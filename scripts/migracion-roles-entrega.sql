-- ═══════════════════════════════════════════════════════════════════════════
--  ROLES `activaciones` Y `sac` — la segregación de funciones de la entrega
--  Correr en Supabase → SQL Editor. Idempotente.
--
--  18 nov 2026. Mismo patrón que `migracion-rol-perfilamiento.sql`: la tabla
--  `usuarios` tiene un CHECK que enumera los roles admitidos, así que un rol
--  nuevo se RECHAZA con 23514 antes de poder asignárselo a nadie. El tipo de
--  TypeScript, el middleware y la pantalla de Gestión de Usuarios ya los
--  conocen; sin esta migración existen en el código y no en la base.
--
--  POR QUÉ DOS ROLES Y NO UNO
--  --------------------------
--  El control de entrega solo significa algo si quien ENTREGA no es quien
--  ACEPTA. Hasta hoy eso era imposible: `admin`, `asesor` y `viewer` llevan
--  `paginas: null, apis: null` en lib/permisos.ts — o sea TODO. Un usuario
--  tiene UNA fila y UN rol, así que con los dos roles la separación es
--  estructural: nadie puede ser las dos partes a la vez.
--
--  LO QUE ESTA MIGRACIÓN **NO** HACE, A PROPÓSITO
--  ----------------------------------------------
--  No da de alta a nadie. `migracion-rol-perfilamiento.sql` sí lo hizo porque
--  dirección había dado tres nombres; aquí no hay ninguno. Inventar un usuario
--  para que la migración «se vea completa» sería inventar un dato.
--
--  Y RECORDAR LAS TRES PUERTAS: una fila en `usuarios` NO da acceso. Hace falta
--  además que el correo esté en la lista blanca de `lib/auth.ts` (se evalúa en
--  CADA request) y, para el rol `asesor`, que `usuarios.asesor_nombre` esté
--  puesto. Erick estuvo registrado y activo sin poder entrar justo por esto.
-- ═══════════════════════════════════════════════════════════════════════════

alter table usuarios drop constraint if exists usuarios_rol_check;
alter table usuarios add constraint usuarios_rol_check
  check (rol in ('admin', 'asesor', 'viewer', 'perfilamiento',
                 'activaciones', 'sac'));

-- ── VERIFICACIÓN AL REVÉS, QUE ES LA QUE PRUEBA ALGO ───────────────────────
--
-- Que el CHECK acepte los dos nombres nuevos no demuestra que siga rechazando
-- lo que no debe entrar. Una regla solo se prueba con lo que NO debe pasar: si
-- alguien escribiera `check (rol is not null)` el bloque de arriba «funciona»
-- igual y la columna deja de validar nada.
--
-- Así que este bloque LEE la restricción y exige tres cosas: que exista, que
-- nombre los dos roles nuevos, y que siga siendo una LISTA CERRADA.
--
-- Se hace leyendo `pg_constraint` y no intentando un INSERT prohibido, que fue
-- la primera versión: `usuarios` tiene columnas obligatorias, así que el INSERT
-- de prueba podía fallar por `not_null_violation` en vez de por el CHECK —
-- fallar por el motivo equivocado se lee igual que fallar por el bueno, y el
-- mensaje habría dicho que la validación funciona cuando no se llegó a probar.
-- No escribe nada.
do $$
declare
  def text;
begin
  select pg_get_constraintdef(oid) into def
    from pg_constraint
   where conrelid = 'usuarios'::regclass
     and conname  = 'usuarios_rol_check';

  if def is null then
    raise exception 'La restriccion usuarios_rol_check NO existe despues de crearla.';
  end if;

  -- Postgres reescribe `rol in (...)` como `rol = ANY (ARRAY[...])`.
  if def !~* '(= *ANY|IN) *\(' then
    raise exception
      'El CHECK de usuarios.rol NO es una lista cerrada de valores: %. '
      'Una restriccion como `rol is not null` deja pasar cualquier rol.', def;
  end if;

  if def !~ 'activaciones' then
    raise exception 'El CHECK no admite el rol `activaciones`: %', def;
  end if;
  if def !~ '''sac''' then
    raise exception 'El CHECK no admite el rol `sac`: %', def;
  end if;

  raise notice 'ok  lista cerrada y los dos roles nuevos admitidos: %', def;
end $$;

-- Qué roles hay realmente en uso, y con cuántas personas cada uno.
-- Un rol recién creado debe salir con 0: eso es correcto, y es distinto de que
-- el rol no exista.
select rol, count(*) as personas, count(*) filter (where activo) as activas
  from usuarios
 group by rol
 order by personas desc;
