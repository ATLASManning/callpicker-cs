-- ═══════════════════════════════════════════════════════════════════════
--  Tabla `leads` — captura de prospectos desde Upsell & Cross-sell
--  Correr una sola vez en Supabase → SQL Editor.
--
--  Por qué no se reutiliza `oportunidades`: esa tabla exige `cuenta_id`, es
--  decir, una cuenta que ya existe. Un lead todavía no es cliente — no tiene
--  cuenta, ni CID, ni asesor asignado por cartera. Meterlo ahí obligaría a
--  inventar una cuenta para poder guardarlo.
--
--  Por qué no localStorage (como hace el registro de oportunidades): ahí los
--  datos viven solo en el navegador de quien los capturó. Nadie más los ve, no
--  entran a ningún reporte, y se pierden al limpiar el navegador. Un lead es
--  dinero potencial: tiene que sobrevivir al navegador.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  -- Folio legible para referirse al lead en una conversación.
  consecutivo       bigint generated always as identity,

  empresa           text not null,
  contacto          text,
  telefono          text,
  email             text,
  -- Servicio del portafolio que despertó el interés.
  interes_servicio  text,

  -- Dueño y estatus: sin esto la lista se vuelve un cajón donde nadie
  -- responde por nada.
  asesor            text,
  estado            text not null default 'nuevo',

  notas             text,
  -- Quién lo capturó, para rastrear el origen del dato.
  creado_por        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists leads_estado_idx     on public.leads (estado);
create index if not exists leads_asesor_idx     on public.leads (asesor);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- Un mismo prospecto no debe capturarse dos veces por descuido. El índice
-- es parcial porque el correo es opcional: si no lo traen, no hay llave.
create unique index if not exists leads_email_unico
  on public.leads (lower(email))
  where email is not null and email <> '';

-- `updated_at` se mantiene solo.
create or replace function public.leads_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.leads_touch_updated_at();

-- El acceso ya lo controla el middleware de la aplicación (lista blanca de
-- correos) y todas las lecturas van con la service-role key desde el servidor.
alter table public.leads enable row level security;
