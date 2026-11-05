-- ═══════════════════════════════════════════════════════════════════════
-- Anexos de cuentas que NO están en la cartera CS
--
-- Instrucción de dirección (José Manuel, 5 nov 2026): «En el apartado de
-- Reuniones y Anexos permite el ingreso de información de todas las cuentas,
-- puedes cruzar con el apartado informe de cortes los CID y nombre de cuentas».
--
-- ── QUÉ CAMBIA Y POR QUÉ ──────────────────────────────────────────────────
-- `anexos.cuenta_id` era UUID NOT NULL REFERENCES cuentas(id). Esa cartera
-- tiene 224 cuentas; Callpicker factura a 2,726. Con el NOT NULL, a un cliente
-- fuera de cartera —ProMujer, con convenio firmado hasta 2028— no se le podía
-- colgar un documento: el insert fallaba.
--
-- ── LO QUE NO SE AFLOJA ───────────────────────────────────────────────────
-- El NOT NULL estaba por una razón buena, escrita en la migración original:
-- «un anexo sin cuenta es un documento de cliente huérfano que nadie sabe de
-- quién es, y además deja el archivo en el bucket sin dueño».
--
-- Esa razón sigue valiendo, así que el NOT NULL no se quita y ya: se SUSTITUYE
-- por un CHECK que exige que el documento esté amarrado a ALGO — a la cuenta
-- de cartera (`cuenta_id`) o, cuando no hay, al CID del padrón de facturación
-- (`cid`). Lo que se prohíbe es el huérfano, no la cuenta fuera de cartera.
--
-- La FK se conserva: un `cuenta_id` que no exista sigue siendo imposible.
--
-- Ejecutar en el SQL Editor de Supabase. Es idempotente.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.anexos ALTER COLUMN cuenta_id DROP NOT NULL;

-- El amarre mínimo. `btrim` porque una cadena de espacios es tan huérfana
-- como un NULL, y un CHECK con `<> ''` a secas la dejaría pasar.
-- [[feedback-probar-al-reves]]
ALTER TABLE public.anexos DROP CONSTRAINT IF EXISTS anexos_amarrado_a_algo;
ALTER TABLE public.anexos ADD CONSTRAINT anexos_amarrado_a_algo
  CHECK (cuenta_id IS NOT NULL OR (cid IS NOT NULL AND btrim(cid) <> ''));

CREATE INDEX IF NOT EXISTS idx_anexos_cid ON public.anexos (cid);

COMMENT ON COLUMN public.anexos.cuenta_id IS
  'FK a cuentas.id cuando la cuenta esta en la cartera CS. NULL cuando el '
  'cliente solo existe en el padron de facturacion; entonces el amarre es '
  'cid. El CHECK anexos_amarrado_a_algo exige uno de los dos.';
COMMENT ON COLUMN public.anexos.cid IS
  'CID del cliente. Copia legible cuando hay cuenta_id; AMARRE AUTORITATIVO '
  'cuando no lo hay. Ver lib/catalogo-cuentas.ts.';

-- ── COMPROBACIÓN ─────────────────────────────────────────────────────────
-- Cierra: las tres últimas columnas suman el total, y la cuarta debe ser 0.
SELECT
  count(*)                                                  AS total_anexos,
  count(*) FILTER (WHERE cuenta_id IS NOT NULL)             AS en_cartera,
  count(*) FILTER (WHERE cuenta_id IS NULL
                     AND cid IS NOT NULL
                     AND btrim(cid) <> '')                  AS solo_facturacion,
  count(*) FILTER (WHERE cuenta_id IS NULL
                     AND (cid IS NULL OR btrim(cid) = ''))  AS HUERFANOS_DEBE_SER_CERO
FROM public.anexos;

-- Y el control NEGATIVO: esto TIENE que fallar con
-- «new row for relation "anexos" violates check constraint». Si pasa, el
-- CHECK no está puesto y la migración no sirvió. Correrlo a mano, es
-- deliberadamente destructivo-si-funciona-mal, por eso va comentado:
--
--   INSERT INTO public.anexos (cuenta_id, cid, nombre_documento, tema,
--                              archivo_ruta, archivo_nombre)
--   VALUES (NULL, '   ', 'prueba huerfano', 'analisis', 'x', 'x');
