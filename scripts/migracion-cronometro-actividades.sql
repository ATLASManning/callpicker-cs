-- Ejecutar en Supabase → SQL Editor antes del lunes 24 de agosto 2026.
-- Agrega el cronómetro + auto-reporte de tiempo a la tabla `actividades`.
-- Es seguro correrlo más de una vez (IF NOT EXISTS).

ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS iniciada_en timestamptz,
  ADD COLUMN IF NOT EXISTS tiempo_medido_min integer,
  ADD COLUMN IF NOT EXISTS tiempo_reportado_min integer;
