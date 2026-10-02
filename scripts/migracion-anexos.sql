-- ═══════════════════════════════════════════════════════════════════════
-- Anexos de cuenta · documentos vinculados a un cliente
--
-- Instrucción de dirección (1 oct 2026): «dentro de reuniones coloca una nueva
-- opción que diga anexos, solicita nombre de cliente, nombre del documento,
-- tema: Falla, venta, producto, proyecto, análisis y permite que se suban
-- documentos de Word, Excel, PDF. Y también asócialo a la cuenta.»
--
-- EL CLIENTE SE GUARDA POR `cuenta_id`, NO POR NOMBRE. Es la misma lección que
-- dejó el módulo de Reuniones: un nombre escrito a mano no es una llave —
-- "Neruc", "Grupo NERUC" y "Neruc Sede Central" son la misma cuenta y no
-- cruzan entre sí. `cid` y `empresa` se conservan como copia legible para
-- reportes; NO usarlas para cruzar.
--
-- EL ARCHIVO NO VIVE AQUÍ. Vive en el bucket PRIVADO `anexos` de Supabase
-- Storage; esta tabla guarda la ruta. Comprobar el bucket con
-- `python scripts/verifica-bucket-anexos.py` — un bucket público serviría
-- documentos de cliente a cualquiera con la URL.
--
-- Ejecutar en el SQL Editor de Supabase. Es idempotente.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.anexos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- El vínculo autoritativo. ON DELETE RESTRICT y no SET NULL: un anexo sin
  -- cuenta es un documento de cliente huérfano que nadie sabe de quién es, y
  -- además deja el archivo en el bucket sin dueño. Si hay que borrar la
  -- cuenta, primero se decide qué pasa con sus documentos.
  cuenta_id        UUID NOT NULL REFERENCES public.cuentas(id) ON DELETE RESTRICT,
  cid              TEXT,
  empresa          TEXT,

  nombre_documento TEXT NOT NULL,

  -- Los cinco temas que pidió dirección. CHECK y no texto libre: un catálogo
  -- abierto se llena de variantes ("Falla", "falla", "FALLAS") que no agrupan.
  tema             TEXT NOT NULL
                   CHECK (tema IN ('falla', 'venta', 'producto', 'proyecto', 'analisis')),

  archivo_nombre   TEXT   NOT NULL,   -- como lo nombró quien lo subió
  archivo_ruta     TEXT   NOT NULL,   -- ruta dentro del bucket `anexos`
  archivo_tipo     TEXT   NOT NULL,   -- MIME verificado en el servidor
  archivo_bytes    BIGINT NOT NULL CHECK (archivo_bytes > 0),

  notas            TEXT,
  subido_por       TEXT,              -- correo de la sesión que lo subió
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un mismo archivo no puede registrarse dos veces apuntando a la misma ruta:
-- borrar uno dejaría al otro apuntando a un objeto inexistente.
CREATE UNIQUE INDEX IF NOT EXISTS idx_anexos_ruta    ON public.anexos (archivo_ruta);
CREATE INDEX        IF NOT EXISTS idx_anexos_cuenta  ON public.anexos (cuenta_id);
CREATE INDEX        IF NOT EXISTS idx_anexos_tema    ON public.anexos (tema);
CREATE INDEX        IF NOT EXISTS idx_anexos_fecha   ON public.anexos (creado_en DESC);

COMMENT ON TABLE  public.anexos IS
  'Documentos (PDF/Word/Excel) vinculados a una cuenta. El archivo vive en el bucket privado `anexos`.';
COMMENT ON COLUMN public.anexos.cuenta_id IS
  'FK a cuentas.id. Es el vinculo autoritativo y es OBLIGATORIO.';
COMMENT ON COLUMN public.anexos.empresa IS
  'Nombre de la cuenta al momento de subir. Copia legible; NO usar como llave.';
COMMENT ON COLUMN public.anexos.archivo_ruta IS
  'Ruta dentro del bucket privado `anexos`. Nunca se expone al navegador: la descarga pasa por /api/anexos/[id]/descargar, que exige sesion.';

-- RLS encendido y SIN politicas: solo la llave de servicio (el servidor) entra.
-- El navegador nunca habla con esta tabla directamente.
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;

-- Verificación. Cierra: las tres últimas suman el total.
SELECT
  count(*)                                        AS total_anexos,
  count(DISTINCT cuenta_id)                       AS cuentas_con_anexos,
  count(*) FILTER (WHERE archivo_tipo = 'application/pdf')              AS pdf,
  count(*) FILTER (WHERE archivo_tipo LIKE '%word%'
                      OR archivo_tipo LIKE '%msword%')                  AS word,
  count(*) FILTER (WHERE archivo_tipo NOT LIKE '%word%'
                     AND archivo_tipo NOT LIKE '%msword%'
                     AND archivo_tipo <> 'application/pdf')             AS excel
FROM public.anexos;
