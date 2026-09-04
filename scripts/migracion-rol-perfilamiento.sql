-- ═══════════════════════════════════════════════════════════════════════════
--  Rol `perfilamiento` + alta de los 3 usuarios del área
--  Correr en Supabase → SQL Editor. Idempotente.
--
--  La tabla `usuarios` tiene un CHECK que solo admite admin/asesor/viewer, así
--  que el rol nuevo se rechaza antes de poder darlos de alta.
-- ═══════════════════════════════════════════════════════════════════════════

alter table usuarios drop constraint if exists usuarios_rol_check;
alter table usuarios add constraint usuarios_rol_check
  check (rol in ('admin', 'asesor', 'viewer', 'perfilamiento'));

-- Alta de los tres. Si ya existieran, solo se les fija el rol y se reactivan.
insert into usuarios (email, nombre, rol, asesor_nombre, activo)
values
  ('roberto@callpicker.com', 'Roberto', 'perfilamiento', null, true),
  ('nancy@callpicker.com',   'Nancy',   'perfilamiento', null, true),
  ('valeria@callpicker.com', 'Valeria', 'perfilamiento', null, true)
on conflict (email) do update
  set rol = excluded.rol, activo = true, asesor_nombre = null;

-- Verificación: deben salir los tres con rol perfilamiento y activo = true.
select email, nombre, rol, activo
  from usuarios
 where email in ('roberto@callpicker.com', 'nancy@callpicker.com', 'valeria@callpicker.com')
 order by email;
