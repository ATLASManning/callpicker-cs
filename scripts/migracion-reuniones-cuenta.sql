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

-- 1-oct-2026: la cuenta se llena —y es OBLIGATORIA— en todos los tipos salvo
-- one_on_one. Este comentario decía «sólo en reuniones de tipo cliente», que
-- era justo la creencia que hacía al servidor tirar el vínculo de los demás.
COMMENT ON COLUMN public.reuniones.cuenta_id IS
  'FK a cuentas.id. Es el vinculo autoritativo. Obligatoria en todo tipo salvo one_on_one; ver lib/reuniones-tipo.ts.';
COMMENT ON COLUMN public.reuniones.cid IS
  'CID de la cuenta al momento de vincular. Copia denormalizada para reportes.';
COMMENT ON COLUMN public.reuniones.empresa IS
  'Nombre de la cuenta al momento de vincular. Copia legible; NO usar como llave.';

-- Verificación. Cierra: las cuatro últimas columnas suman el total.
SELECT
  count(*)                                             AS total_reuniones,
  count(*) FILTER (WHERE tipo = 'one_on_one')          AS one_on_one_sin_cuenta,
  count(*) FILTER (WHERE tipo <> 'one_on_one'
                     AND cuenta_id IS NOT NULL
                     AND tipo =  'cliente')            AS con_cliente_vinculadas,
  count(*) FILTER (WHERE tipo <> 'one_on_one'
                     AND cuenta_id IS NOT NULL
                     AND tipo <> 'cliente')            AS internas_vinculadas,
  count(*) FILTER (WHERE tipo <> 'one_on_one'
                     AND cuenta_id IS NULL)            AS HUERFANAS
FROM public.reuniones;
