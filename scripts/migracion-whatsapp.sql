-- ============================================================================
-- Módulo WhatsApp — conversaciones, mensajes y señales
-- Correr en: Supabase → SQL Editor  (25 Ago 2026)
-- Idempotente: se puede correr varias veces sin efecto adicional.
-- ============================================================================

-- 1. Conversaciones (chats individuales y grupos) --------------------------
CREATE TABLE IF NOT EXISTS wa_conversaciones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text NOT NULL,
  tipo           text NOT NULL DEFAULT 'individual',  -- individual | grupo
  cuenta_id      uuid REFERENCES cuentas(id) ON DELETE SET NULL,
  origen         text NOT NULL DEFAULT 'exportacion', -- exportacion | cloud_api
  participantes  text[],
  total_mensajes integer DEFAULT 0,
  primer_mensaje timestamptz,
  ultimo_mensaje timestamptz,
  riesgo         integer DEFAULT 0,                   -- 0-100, calculado del análisis
  notas          text,
  -- Una importación equivocada NO se borra (los mensajes son inmutables):
  -- se archiva, desaparece de la bandeja y queda auditable.
  archivada      boolean NOT NULL DEFAULT false,
  archivada_por  text,
  archivada_en   timestamptz,
  motivo_archivo text,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_conv_nombre_idx ON wa_conversaciones (lower(nombre));
CREATE INDEX IF NOT EXISTS wa_conv_cuenta_idx        ON wa_conversaciones (cuenta_id);
CREATE INDEX IF NOT EXISTS wa_conv_riesgo_idx        ON wa_conversaciones (riesgo DESC);

-- 2. Mensajes ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_mensajes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- RESTRICT, no CASCADE: borrar la conversación tampoco puede arrastrar
  -- mensajes. Nada se destruye; ver `archivada` en wa_conversaciones.
  conversacion_id uuid NOT NULL REFERENCES wa_conversaciones(id) ON DELETE RESTRICT,
  autor           text NOT NULL,
  texto           text,
  enviado_en      timestamptz NOT NULL,
  es_nuestro      boolean DEFAULT false,   -- lado Callpicker vs. cliente
  hash            text,                    -- dedup al reimportar el mismo chat
  creado_en       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_msg_hash_idx ON wa_mensajes (conversacion_id, hash);
CREATE INDEX IF NOT EXISTS wa_msg_conv_fecha_idx   ON wa_mensajes (conversacion_id, enviado_en DESC);

-- 3. Señales detectadas -----------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_senales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id uuid NOT NULL REFERENCES wa_conversaciones(id) ON DELETE CASCADE,
  cuenta_id       uuid REFERENCES cuentas(id) ON DELETE SET NULL,
  tipo            text NOT NULL,   -- cancelacion | escalamiento | falla_tecnica | competencia | precio | compromiso_abierto | cambio_contacto | expansion | silencio
  severidad       text NOT NULL,   -- critica | alta | media | info
  titulo          text,
  evidencia       text,
  autor           text,
  enviado_en      timestamptz,
  accion          text,
  atendida        boolean DEFAULT false,
  atendida_por    text,
  atendida_en     timestamptz,
  creado_en       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_senal_unica_idx ON wa_senales (conversacion_id, tipo, enviado_en, autor);
CREATE INDEX IF NOT EXISTS wa_senal_pend_idx  ON wa_senales (atendida, severidad);
CREATE INDEX IF NOT EXISTS wa_senal_cuenta_idx ON wa_senales (cuenta_id);

-- 4. INMUTABILIDAD DE MENSAJES ---------------------------------------------
-- Requisito de dirección (25 Ago 2026): el módulo es de SOLA OBSERVACIÓN.
-- Ninguna persona puede cambiar, sustituir ni eliminar un mensaje.
--
-- No basta con no exponer endpoints de edición: se bloquea en el motor, de
-- modo que ni la aplicación, ni la service-role key, ni alguien con acceso
-- directo al SQL Editor pueda alterar el registro. Solo INSERT es válido.
-- Una importación equivocada NO se borra: se marca `archivada` en
-- wa_conversaciones, con quién y por qué. Desaparece de la bandeja y sigue
-- siendo auditable. Nada se destruye ni se reescribe en silencio.
CREATE OR REPLACE FUNCTION wa_mensajes_inmutables()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    'wa_mensajes es de solo lectura: los mensajes de WhatsApp no se pueden % (módulo de observación).',
    lower(TG_OP);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wa_mensajes_no_update ON wa_mensajes;
CREATE TRIGGER wa_mensajes_no_update
  BEFORE UPDATE ON wa_mensajes
  FOR EACH ROW EXECUTE FUNCTION wa_mensajes_inmutables();

DROP TRIGGER IF EXISTS wa_mensajes_no_delete ON wa_mensajes;
CREATE TRIGGER wa_mensajes_no_delete
  BEFORE DELETE ON wa_mensajes
  FOR EACH ROW EXECUTE FUNCTION wa_mensajes_inmutables();

-- 5. Verificación -----------------------------------------------------------
SELECT table_name FROM information_schema.tables
 WHERE table_name IN ('wa_conversaciones','wa_mensajes','wa_senales')
 ORDER BY table_name;

SELECT tgname AS trigger_inmutabilidad
  FROM pg_trigger
 WHERE tgrelid = 'wa_mensajes'::regclass AND NOT tgisinternal;
