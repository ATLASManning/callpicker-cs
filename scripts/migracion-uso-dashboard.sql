-- ============================================================================
-- Analytics de uso del Dashboard — tabla uso_dashboard
-- Correr en: Supabase → SQL Editor  (30 Ago 2026)
-- Idempotente: se puede correr varias veces sin efecto adicional.
--
-- CONTEXTO: el código de rastreo existe desde hace tiempo (PageTracker envía
-- cada visita a /api/analytics/pageview, y /admin/uso la consulta), pero esta
-- tabla nunca se creó — cada inserción fallaba en silencio y el historial de
-- conexiones se perdió. Por eso no existe el reporte de agosto 2026: el dato
-- empieza a acumularse a partir de que corras esto.
--
-- El esquema replica exactamente lo que el código ya usa:
--   insert { email, asesor, ruta, seccion }        (pageview POST)
--   update { duracion_seg } por id                 (sendBeacon al salir)
--   select * order by created_at                   (/api/analytics/uso)
-- ============================================================================

CREATE TABLE IF NOT EXISTS uso_dashboard (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  asesor       text,
  ruta         text NOT NULL,
  seccion      text NOT NULL,
  duracion_seg integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uso_dash_fecha_idx   ON uso_dashboard (created_at DESC);
CREATE INDEX IF NOT EXISTS uso_dash_email_idx   ON uso_dashboard (email, created_at DESC);
CREATE INDEX IF NOT EXISTS uso_dash_seccion_idx ON uso_dashboard (seccion);

-- Verificación
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_name = 'uso_dashboard' ORDER BY ordinal_position;
