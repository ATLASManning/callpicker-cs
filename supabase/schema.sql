-- ============================================================
-- CALLPICKER CUSTOMER SUCCESS — Supabase Schema v1.0
-- ============================================================

-- Accounts / Cuentas estratégicas
CREATE TABLE IF NOT EXISTS cuentas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consecutivo         VARCHAR(10) NOT NULL UNIQUE,  -- F1, D1, C1…
  cid                 VARCHAR(20),
  empresa             VARCHAR(255) NOT NULL,
  asesor              VARCHAR(50)  NOT NULL CHECK (asesor IN ('Fátima','Dan','Claudia')),
  facturacion         DECIMAL(12,2) DEFAULT 0,
  servicio            TEXT,
  activo_desde        DATE,

  -- Contacto principal
  contacto_nombre     VARCHAR(255),
  contacto_email      VARCHAR(255),
  contacto_tel        VARCHAR(100),
  contacto_cargo      VARCHAR(255),

  -- Empresa
  tamano_empresa      VARCHAR(50),   -- Micro, Pequeña, Mediana, Grande
  giro                VARCHAR(255),
  total_empleados     VARCHAR(100),
  num_oficinas        VARCHAR(50),
  direccion_fiscal    TEXT,
  pagina_web          VARCHAR(255),
  zoho_link           TEXT,
  grupo_empresarial   VARCHAR(255),

  -- Health Score — cada bloque en escala 0-100
  score_actividad     INT DEFAULT 50,   -- Bloque A  35 %
  score_adopcion      INT DEFAULT 50,   -- Bloque B  30 %
  score_pago          INT DEFAULT 50,   -- Bloque C  20 %
  score_relacional    INT DEFAULT 50,   -- Bloque D  15 %
  health_score        INT GENERATED ALWAYS AS (
    ROUND(score_actividad * 0.35
        + score_adopcion  * 0.30
        + score_pago      * 0.20
        + score_relacional* 0.15)
  ) STORED,

  -- Actividad
  dias_sin_actividad      INT DEFAULT 0,
  llamadas_cambio_pct     DECIMAL(5,2) DEFAULT 0,   -- % vs mes anterior
  llamadas_atendidas_pct  DECIMAL(5,2) DEFAULT 0,

  -- Adopción de features (flags)
  tiene_chat_activo       BOOLEAN DEFAULT FALSE,
  tiene_integracion_api   BOOLEAN DEFAULT FALSE,
  tiene_pago_automatico   BOOLEAN DEFAULT FALSE,
  tiene_ia_voz            BOOLEAN DEFAULT FALSE,
  tiene_ia_chat           BOOLEAN DEFAULT FALSE,
  dashboard_revisado      BOOLEAN DEFAULT FALSE,

  -- Pago
  pagos_al_corriente      BOOLEAN DEFAULT TRUE,
  incidencias_pago        INT DEFAULT 0,

  -- Tickets
  tickets_abiertos        INT DEFAULT 0,
  tiene_ticket_reincidente BOOLEAN DEFAULT FALSE,

  -- Vida del cliente
  dias_como_cliente       INT DEFAULT 0,

  -- Oportunidades detectadas
  upsell_producto         VARCHAR(255),
  crossell_producto       VARCHAR(255),
  valor_upsell_estimado   DECIMAL(12,2),

  -- Seguimiento KAM
  ultimo_contacto         DATE,
  proximo_contacto        DATE,
  fecha_ultima_llamada    DATE,
  nps_score               INT,

  -- Estado y observaciones
  estado                  VARCHAR(30) DEFAULT 'activo'
                          CHECK (estado IN ('activo','en_riesgo','hibernacion','cancelado')),
  notas                   TEXT,
  observaciones_kam       TEXT,

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Índices cuentas
CREATE INDEX idx_cuentas_asesor     ON cuentas(asesor);
CREATE INDEX idx_cuentas_health     ON cuentas(health_score);
CREATE INDEX idx_cuentas_estado     ON cuentas(estado);
CREATE INDEX idx_cuentas_factura    ON cuentas(facturacion DESC);
CREATE INDEX idx_cuentas_consecutivo ON cuentas(consecutivo);

-- ── Seguimientos / Bitácora de contactos ──────────────────────
CREATE TABLE IF NOT EXISTS seguimientos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id   UUID REFERENCES cuentas(id) ON DELETE CASCADE,
  fecha       TIMESTAMPTZ DEFAULT NOW(),
  tipo        VARCHAR(50) NOT NULL
              CHECK (tipo IN ('llamada','whatsapp','email','reunion','ticket','nota','demo','upsell')),
  descripcion TEXT,
  resultado   VARCHAR(100),  -- exitoso, sin_respuesta, escalado, interesado, no_interesado
  asesor      VARCHAR(50),
  duracion_min INT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seguimientos_cuenta ON seguimientos(cuenta_id);
CREATE INDEX idx_seguimientos_fecha  ON seguimientos(fecha DESC);

-- ── Historial Health Score ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_score_historial (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id       UUID REFERENCES cuentas(id) ON DELETE CASCADE,
  fecha           DATE DEFAULT CURRENT_DATE,
  health_score    INT NOT NULL,
  score_actividad INT,
  score_adopcion  INT,
  score_pago      INT,
  score_relacional INT,
  semaforo        VARCHAR(20),   -- verde, azul, amarillo, naranja, rojo
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hs_historial_cuenta ON health_score_historial(cuenta_id);
CREATE INDEX idx_hs_historial_fecha  ON health_score_historial(fecha DESC);

-- ── Oportunidades (Upsell / Cross-sell) ───────────────────────
CREATE TABLE IF NOT EXISTS oportunidades (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id           UUID REFERENCES cuentas(id) ON DELETE CASCADE,
  tipo                VARCHAR(20) NOT NULL CHECK (tipo IN ('upsell','crossell')),
  producto            VARCHAR(255),
  valor_estimado      DECIMAL(12,2),
  estado              VARCHAR(30) DEFAULT 'identificada'
                      CHECK (estado IN ('identificada','en_proceso','ganada','perdida','descartada')),
  notas               TEXT,
  fecha_identificacion DATE DEFAULT CURRENT_DATE,
  fecha_cierre        DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opor_cuenta ON oportunidades(cuenta_id);
CREATE INDEX idx_opor_estado ON oportunidades(estado);

-- ── Tickets ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id   UUID REFERENCES cuentas(id) ON DELETE CASCADE,
  titulo      VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo        VARCHAR(50)  CHECK (tipo IN ('falla_servicio','facturacion','tiempo_respuesta','configuracion','discovery','otro')),
  prioridad   VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('critica','alta','normal','baja')),
  estado      VARCHAR(20) DEFAULT 'abierto' CHECK (estado IN ('abierto','en_proceso','resuelto','cerrado')),
  reincidente BOOLEAN DEFAULT FALSE,
  dias_abierto INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_cuenta ON tickets(cuenta_id);
CREATE INDEX idx_tickets_estado ON tickets(estado);

-- ── Chat IA — historial conversaciones ───────────────────────
CREATE TABLE IF NOT EXISTS chat_mensajes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID REFERENCES cuentas(id) ON DELETE SET NULL,
  rol       VARCHAR(20) NOT NULL CHECK (rol IN ('user','assistant','system')),
  contenido TEXT NOT NULL,
  fecha     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_cuenta ON chat_mensajes(cuenta_id);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cuentas_upd       BEFORE UPDATE ON cuentas       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_oportunidades_upd BEFORE UPDATE ON oportunidades  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tickets_upd       BEFORE UPDATE ON tickets        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Vista: semáforo resumen por asesor ───────────────────────
CREATE OR REPLACE VIEW vista_semaforo_asesor AS
SELECT
  asesor,
  COUNT(*) FILTER (WHERE health_score >= 80)              AS verde,
  COUNT(*) FILTER (WHERE health_score BETWEEN 60 AND 79)  AS azul,
  COUNT(*) FILTER (WHERE health_score BETWEEN 40 AND 59)  AS amarillo,
  COUNT(*) FILTER (WHERE health_score BETWEEN 20 AND 39)  AS naranja,
  COUNT(*) FILTER (WHERE health_score < 20)               AS rojo,
  COUNT(*)                                                 AS total,
  SUM(facturacion)                                         AS facturacion_total,
  SUM(facturacion) FILTER (WHERE health_score < 40)       AS facturacion_en_riesgo
FROM cuentas
WHERE estado = 'activo'
GROUP BY asesor;

-- ── Vista: cuentas en riesgo (junta semanal) ─────────────────
CREATE OR REPLACE VIEW vista_riesgo AS
SELECT
  c.id, c.consecutivo, c.empresa, c.asesor, c.facturacion,
  c.health_score,
  CASE
    WHEN c.health_score >= 80 THEN 'verde'
    WHEN c.health_score >= 60 THEN 'azul'
    WHEN c.health_score >= 40 THEN 'amarillo'
    WHEN c.health_score >= 20 THEN 'naranja'
    ELSE 'rojo'
  END AS semaforo,
  c.dias_sin_actividad,
  c.tickets_abiertos,
  c.ultimo_contacto,
  c.upsell_producto,
  c.crossell_producto
FROM cuentas c
WHERE c.estado = 'activo'
ORDER BY c.health_score ASC, c.facturacion DESC;
