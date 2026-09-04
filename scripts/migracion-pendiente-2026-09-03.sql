-- ═══════════════════════════════════════════════════════════════════════════
--  MIGRACIÓN PENDIENTE — correr en Supabase → SQL Editor
--  Junta lo que falta al 3 de septiembre de 2026. Es idempotente: se puede
--  correr varias veces sin efecto adicional.
--
--  Bloque 1 — tabla `leads`: la necesita el módulo Lead de Upsell & Cross-sell.
--             Sin ella el módulo carga pero no guarda nada.
--  Bloque 2 — `actividades.completada_en` + `actividades_audit`: pendiente
--             desde el 24 de agosto. Sin esto el cronómetro no cierra el
--             tiempo y la generación de actividades no deja rastro auditable.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══ BLOQUE 1 · Tabla leads ═══════════════════════════════════════════════
-- No se reutiliza `oportunidades` porque esa tabla exige `cuenta_id`: un lead
-- todavía no es cliente, no tiene cuenta ni CID.

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  consecutivo       bigint generated always as identity,   -- folio legible
  empresa           text not null,
  contacto          text,
  telefono          text,
  email             text,
  interes_servicio  text,
  asesor            text,                                   -- dueño del lead
  estado            text not null default 'nuevo',
  notas             text,
  creado_por        text,                                   -- quién lo capturó
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists leads_estado_idx     on public.leads (estado);
create index if not exists leads_asesor_idx     on public.leads (asesor);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- Un mismo prospecto no debe capturarse dos veces. Índice parcial porque el
-- correo es opcional: si no lo traen, no hay llave que comparar.
create unique index if not exists leads_email_unico
  on public.leads (lower(email))
  where email is not null and email <> '';

create or replace function public.leads_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.leads_touch_updated_at();

alter table public.leads enable row level security;


-- ═══ BLOQUE 2 · Cronómetro y auditoría de actividades ═════════════════════
-- `iniciada_en`, `tiempo_medido_min` y `tiempo_reportado_min` ya existen;
-- falta `completada_en`, sin la cual el cronómetro nunca cierra.

alter table actividades
  add column if not exists iniciada_en          timestamptz,
  add column if not exists completada_en        timestamptz,
  add column if not exists tiempo_medido_min    integer,
  add column if not exists tiempo_reportado_min integer;

comment on column actividades.tiempo_medido_min    is 'Minutos medidos por el sistema entre iniciada_en y completada_en. Nunca se mezcla con tiempo_reportado_min.';
comment on column actividades.tiempo_reportado_min is 'Minutos declarados manualmente por el asesor. Dato independiente del cronómetro.';

-- Deja rastro de qué se generó, qué se bloqueó y por qué. Sin esta tabla el
-- código solo escribe warnings en el log del servidor.
create table if not exists actividades_audit (
  id                   uuid primary key default gen_random_uuid(),
  actividad_id         uuid,
  cuenta_id            uuid,
  asesor               text,
  empresa              text,
  cid                  text,
  semana_inicio        date,
  accion               text not null,   -- creado | bloqueado | cancelado | iniciado | completado | excepcion_administrativa
  codigo               text,            -- churn_grc | cancelacion | dormida | estado_no_activo | estatus_no_validable | contacto_incompleto | limite_semanal | fuera_de_lunes
  motivo               text,
  estatus_detectado    text,
  campos_faltantes     text,
  tiempo_medido_min    integer,
  tiempo_reportado_min integer,
  usuario              text,
  creado_en            timestamptz not null default now()
);

create index if not exists actividades_audit_semana_idx on actividades_audit (semana_inicio desc);
create index if not exists actividades_audit_cuenta_idx on actividades_audit (cuenta_id);
create index if not exists actividades_audit_codigo_idx on actividades_audit (codigo);


-- ═══ VERIFICACIÓN ═════════════════════════════════════════════════════════
-- Debe devolver 3 renglones: leads, actividades_audit y completada_en.
select 'tabla leads'              as objeto, count(*)::text as ok from information_schema.tables  where table_name  = 'leads'
union all
select 'tabla actividades_audit', count(*)::text            from information_schema.tables  where table_name  = 'actividades_audit'
union all
select 'actividades.completada_en', count(*)::text          from information_schema.columns where table_name  = 'actividades' and column_name = 'completada_en';
