-- ============================================================================
-- ENRIQUECIMIENTO DE CUENTAS — esquema aditivo
-- Correr en: Supabase → SQL Editor   (1 Sep 2026)
-- Idempotente: se puede correr varias veces sin efecto adicional.
--
-- PRINCIPIO NO NEGOCIABLE: ninguna de estas tablas modifica `cuentas`.
-- El dato capturado por cada KAM queda intacto; aquí solo viven CANDIDATOS
-- con su evidencia, su fuente y su estado de revisión. La promoción de un
-- candidato al campo operativo es una acción manual, auditada y apagada por
-- defecto (ver docs/ENRIQUECIMIENTO.md §3).
--
-- Reversa al final del archivo, comentada.
-- ============================================================================

-- ── 1. Ejecuciones ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enriquecimiento_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iniciado_en    timestamptz NOT NULL DEFAULT now(),
  terminado_en   timestamptz,
  ejecutado_por  text        NOT NULL,
  alcance        jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- {asesor, cuenta_ids, limite}
  dry_run        boolean     NOT NULL DEFAULT true,
  estado         text        NOT NULL DEFAULT 'en_curso',   -- en_curso|completado|error|cancelado
  proveedores    jsonb       NOT NULL DEFAULT '[]'::jsonb,  -- [{nombre, version, disponible}]
  resumen        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  error_detalle  text
);

CREATE INDEX IF NOT EXISTS enr_runs_fecha_idx  ON enriquecimiento_runs (iniciado_en DESC);
CREATE INDEX IF NOT EXISTS enr_runs_estado_idx ON enriquecimiento_runs (estado);

-- ── 2. Candidatos de enriquecimiento ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enriquecimiento_candidatos (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id               uuid NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  asesor                  text NOT NULL,              -- KAM propietario al momento del hallazgo
  run_id                  uuid REFERENCES enriquecimiento_runs(id) ON DELETE SET NULL,

  campo                   text NOT NULL,              -- contacto_email, giro, num_oficinas, ...
  valor_original_snapshot text,                       -- foto del valor del KAM al consultar
  valor_candidato         text NOT NULL,
  valor_normalizado       text NOT NULL,

  -- Confianza y verificación
  confianza_score         integer NOT NULL CHECK (confianza_score BETWEEN 0 AND 100),
  confianza_nivel         text    NOT NULL,           -- confirmado|alta|probable|debil
  estado_verificacion     text    NOT NULL,           -- confirmado|probable|no_verificado

  -- Trazabilidad obligatoria
  fuente_tipo             text NOT NULL,              -- interno|sitio_oficial|directorio|buscador|apify|linkedin_publico
  fuente_nombre           text NOT NULL,
  fuente_url              text,
  evidencia               text NOT NULL,              -- fragmento textual que sustenta el dato
  consultado_en           timestamptz NOT NULL DEFAULT now(),

  -- Comparación contra el dato del KAM
  matching_status         text NOT NULL,              -- coincide|complementa|conflicto|nuevo|sin_evidencia
  proposed_action         text NOT NULL,              -- registrar_validacion|agregar_adicional|review_required|descartar

  -- Revisión humana
  review_status           text NOT NULL DEFAULT 'pendiente', -- pendiente|aprobado_adicional|incorrecto|pospuesto|fusionado_manual
  revisado_por            text,
  revisado_en             timestamptz,
  nota_revision           text,

  dedupe_key              text NOT NULL,
  creado_en               timestamptz NOT NULL DEFAULT now()
);

-- Idempotencia: el mismo hallazgo, de la misma fuente, no se duplica jamás
CREATE UNIQUE INDEX IF NOT EXISTS enr_cand_dedupe_uidx ON enriquecimiento_candidatos (dedupe_key);
CREATE INDEX IF NOT EXISTS enr_cand_cuenta_idx  ON enriquecimiento_candidatos (cuenta_id, campo);
CREATE INDEX IF NOT EXISTS enr_cand_asesor_idx  ON enriquecimiento_candidatos (asesor, review_status);
CREATE INDEX IF NOT EXISTS enr_cand_review_idx  ON enriquecimiento_candidatos (review_status, confianza_score DESC);
CREATE INDEX IF NOT EXISTS enr_cand_match_idx   ON enriquecimiento_candidatos (matching_status);
CREATE INDEX IF NOT EXISTS enr_cand_fecha_idx   ON enriquecimiento_candidatos (consultado_en DESC);
CREATE INDEX IF NOT EXISTS enr_cand_run_idx     ON enriquecimiento_candidatos (run_id);

-- ── 3. Mapa de decisores candidato ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enriquecimiento_decisores (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id           uuid NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  asesor              text NOT NULL,
  run_id              uuid REFERENCES enriquecimiento_runs(id) ON DELETE SET NULL,

  persona_nombre      text,                    -- NULL si no se confirmó públicamente
  cargo               text,
  area                text,
  rol_decision        text,                    -- decisor_economico|decisor_tecnico|usuario_clave|
                                               -- influenciador|comprador|patrocinador_ejecutivo|
                                               -- gatekeeper|contacto_operativo
  tipo_contacto       text,                    -- confirmado|probable|no_verificado
  email               text,
  telefono            text,

  confianza_score     integer NOT NULL CHECK (confianza_score BETWEEN 0 AND 100),
  estado_verificacion text NOT NULL,
  fuente_url          text,
  fuente_nombre       text NOT NULL,
  evidencia           text NOT NULL,
  consultado_en       timestamptz NOT NULL DEFAULT now(),

  review_status       text NOT NULL DEFAULT 'pendiente',
  revisado_por        text,
  revisado_en         timestamptz,

  dedupe_key          text NOT NULL,
  creado_en           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS enr_dec_dedupe_uidx ON enriquecimiento_decisores (dedupe_key);
CREATE INDEX IF NOT EXISTS enr_dec_cuenta_idx ON enriquecimiento_decisores (cuenta_id);
CREATE INDEX IF NOT EXISTS enr_dec_asesor_idx ON enriquecimiento_decisores (asesor, review_status);

-- ── 4. Auditoría ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enriquecimiento_auditoria (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id       uuid REFERENCES cuentas(id) ON DELETE CASCADE,
  entidad_tipo    text NOT NULL,          -- candidato|decisor|run|cuenta
  entidad_id      uuid,
  accion          text NOT NULL,          -- creado|aprobado_adicional|marcado_incorrecto|pospuesto|
                                          -- fusionado_manual|aplicado_a_cuenta
  valor_previo    text,
  valor_propuesto text,
  fuente_url      text,
  ejecutado_por   text NOT NULL,
  run_id          uuid REFERENCES enriquecimiento_runs(id) ON DELETE SET NULL,
  creado_en       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enr_audit_cuenta_idx ON enriquecimiento_auditoria (cuenta_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS enr_audit_fecha_idx  ON enriquecimiento_auditoria (creado_en DESC);
CREATE INDEX IF NOT EXISTS enr_audit_ent_idx    ON enriquecimiento_auditoria (entidad_tipo, entidad_id);

-- ── Verificación ────────────────────────────────────────────────────────────
SELECT table_name, count(*) AS columnas
  FROM information_schema.columns
 WHERE table_name IN ('enriquecimiento_runs','enriquecimiento_candidatos',
                      'enriquecimiento_decisores','enriquecimiento_auditoria')
 GROUP BY table_name
 ORDER BY table_name;

-- ============================================================================
-- REVERSA (no ejecutar salvo que se quiera desmontar el módulo).
-- Es seguro: ninguna de estas tablas contiene datos capturados por los KAM.
--
-- DROP TABLE IF EXISTS enriquecimiento_auditoria;
-- DROP TABLE IF EXISTS enriquecimiento_decisores;
-- DROP TABLE IF EXISTS enriquecimiento_candidatos;
-- DROP TABLE IF EXISTS enriquecimiento_runs;
-- ============================================================================
