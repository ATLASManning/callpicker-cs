-- ═══════════════════════════════════════════════════════════════════════
-- Reuniones ↔ Cuentas · vínculo real por id, no por texto libre
--
-- POR QUÉ: el formulario de Reuniones pedía la empresa como TEXTO LIBRE y la
-- columna `empresa` NUNCA se creó en la tabla. Resultado al 8-sep-2026: las 18
-- reuniones de tipo "cliente" están SIN vínculo con su cuenta, y lo que el
-- usuario escribía se perdía en cada guardado.
--
-- Un nombre escrito a mano no sirve como llave: "Neruc", "Grupo NERUC" y
-- "Neruc Sede Central" son la misma cuenta y no cruzan entre sí. Por eso se
-- vincula por `cuenta_id` (llave foránea real) y se conservan `cid` y `empresa`
-- como copia legible para reportes.
--
-- Ejecutar en el SQL Editor de Supabase. Es idempotente.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.reuniones
  ADD COLUMN IF NOT EXISTS cuenta_id UUID REFERENCES public.cuentas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cid       TEXT,
  ADD COLUMN IF NOT EXISTS empresa   TEXT;

-- Búsqueda de las reuniones de una cuenta desde su ficha
CREATE INDEX IF NOT EXISTS idx_reuniones_cuenta_id ON public.reuniones (cuenta_id);
CREATE INDEX IF NOT EXISTS idx_reuniones_cid       ON public.reuniones (cid);
CREATE INDEX IF NOT EXISTS idx_reuniones_fecha     ON public.reuniones (fecha DESC);

COMMENT ON COLUMN public.reuniones.cuenta_id IS
  'FK a cuentas.id. Es el vínculo autoritativo. Sólo se llena en reuniones de tipo cliente.';
COMMENT ON COLUMN public.reuniones.cid IS
  'CID de la cuenta al momento de vincular. Copia denormalizada para reportes.';
COMMENT ON COLUMN public.reuniones.empresa IS
  'Nombre de la cuenta al momento de vincular. Copia legible; NO usar como llave.';

-- Verificación
SELECT
  count(*)                                             AS total_reuniones,
  count(*) FILTER (WHERE tipo = 'cliente')             AS de_cliente,
  count(*) FILTER (WHERE cuenta_id IS NOT NULL)        AS vinculadas,
  count(*) FILTER (WHERE tipo = 'cliente'
                     AND cuenta_id IS NULL)            AS cliente_sin_vinculo
FROM public.reuniones;
