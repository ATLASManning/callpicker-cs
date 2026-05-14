-- ================================================================
-- MIGRACIÓN: adopcion_producto
-- Ejecutar en Supabase → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS adopcion_producto (
  id          bigserial    PRIMARY KEY,
  cuenta_id   bigint       NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  producto    text         NOT NULL,
  nivel       text         NOT NULL
                           CHECK (nivel IN ('alto','medio','bajo','no_aplica')),
  fecha       date         NOT NULL DEFAULT CURRENT_DATE,
  asesor      text,
  notas       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_adopcion_cuenta_id
  ON adopcion_producto(cuenta_id);

CREATE INDEX IF NOT EXISTS idx_adopcion_cuenta_producto
  ON adopcion_producto(cuenta_id, producto, created_at DESC);

-- RLS: habilitar y permitir acceso con service role
ALTER TABLE adopcion_producto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON adopcion_producto
  FOR ALL USING (true);
