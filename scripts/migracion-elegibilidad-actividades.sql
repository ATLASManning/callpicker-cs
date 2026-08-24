-- ============================================================================
-- Actividades SAC — cronómetro, tiempo manual y auditoría de elegibilidad
-- Correr en: Supabase → SQL Editor  (24 Ago 2026)
--
-- Es idempotente: se puede correr varias veces sin efecto adicional.
-- Mientras no se corra, el código sigue funcionando (degrada sin cronómetro
-- ni auditoría), pero el tiempo invertido NO se guarda.
-- ============================================================================

-- 1. Cronómetro y tiempo manual ---------------------------------------------
--    Se guardan como datos INDEPENDIENTES: el tiempo medido por el sistema
--    nunca se sobrescribe con el que reporta el asesor, y viceversa. La
--    diferencia entre ambos es justamente el dato de las reuniones de
--    seguimiento.
ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS iniciada_en          timestamptz,  -- clic en "Iniciar"
  ADD COLUMN IF NOT EXISTS completada_en        timestamptz,  -- clic en "Completada"
  ADD COLUMN IF NOT EXISTS tiempo_medido_min    integer,      -- cronómetro (sistema)
  ADD COLUMN IF NOT EXISTS tiempo_reportado_min integer;      -- declarado por el asesor

COMMENT ON COLUMN actividades.tiempo_medido_min    IS 'Minutos medidos por el sistema entre iniciada_en y completada_en. Nunca se mezcla con tiempo_reportado_min.';
COMMENT ON COLUMN actividades.tiempo_reportado_min IS 'Minutos declarados manualmente por el asesor. Dato independiente del cronómetro.';

-- 2. Auditoría ---------------------------------------------------------------
--    Registra qué se generó, qué se bloqueó y por qué. Sin esta tabla el
--    código solo escribe warnings en el log del servidor.
CREATE TABLE IF NOT EXISTS actividades_audit (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actividad_id       uuid,
  cuenta_id          uuid,
  asesor             text,
  empresa            text,
  cid                text,
  semana_inicio      date,
  accion             text NOT NULL,   -- creado | bloqueado | cancelado | iniciado | completado | excepcion_administrativa
  codigo             text,            -- churn_grc | cancelacion | dormida | estado_no_activo | estatus_no_validable | contacto_incompleto | limite_semanal | fuera_de_lunes
  motivo             text,
  estatus_detectado  text,
  campos_faltantes   text,
  tiempo_medido_min  integer,
  tiempo_reportado_min integer,
  usuario            text,
  creado_en          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS actividades_audit_semana_idx  ON actividades_audit (semana_inicio DESC);
CREATE INDEX IF NOT EXISTS actividades_audit_cuenta_idx  ON actividades_audit (cuenta_id);
CREATE INDEX IF NOT EXISTS actividades_audit_codigo_idx  ON actividades_audit (codigo);

-- 3. Verificación ------------------------------------------------------------
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'actividades'
   AND column_name IN ('iniciada_en','completada_en','tiempo_medido_min','tiempo_reportado_min')
 ORDER BY column_name;
