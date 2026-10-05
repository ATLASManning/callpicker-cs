/**
 * lib/anexos.ts — Documentos de cuenta: catálogo, validación y almacenamiento.
 *
 * Instrucción de dirección (1 oct 2026): un apartado de Anexos dentro de
 * Reuniones que pida cliente, nombre del documento y tema, acepte Word, Excel
 * y PDF, y quede asociado a la cuenta.
 *
 * ── DÓNDE VIVE EL ARCHIVO, Y POR QUÉ NO EN public/ ────────────────────────
 * En el bucket PRIVADO `anexos` de Supabase Storage. NO en `public/`:
 * `middleware.ts` exime de sesión toda ruta con extensión salvo `/docs/` y
 * `/auditorias/`, así que un .pdf ahí se descargaría sin sesión. El 18 sep
 * 2026 se borraron tres exports por exactamente eso.
 *
 * Por la misma razón la ruta de descarga es `/api/anexos/[id]/descargar`, SIN
 * extensión al final. Si terminara en `.pdf`, el `/\.\w+$/` del middleware la
 * dejaría pasar sin sesión y el candado del bucket no serviría de nada.
 */

export const TEMAS = ['falla', 'venta', 'producto', 'proyecto', 'analisis'] as const
export type Tema = (typeof TEMAS)[number]

export const ETIQUETA_TEMA: Record<Tema, string> = {
  falla:    'Falla',
  venta:    'Venta',
  producto: 'Producto',
  proyecto: 'Proyecto',
  analisis: 'Análisis',
}

export const COLOR_TEMA: Record<Tema, { fg: string; bg: string }> = {
  falla:    { fg: '#DC2626', bg: 'rgba(220,38,38,0.10)'  },
  venta:    { fg: '#059669', bg: 'rgba(5,150,105,0.10)'  },
  producto: { fg: '#0057FF', bg: 'rgba(0,87,255,0.10)'   },
  proyecto: { fg: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  analisis: { fg: '#D97706', bg: 'rgba(217,119,6,0.10)'  },
}

export function esTema(v: unknown): v is Tema {
  return typeof v === 'string' && (TEMAS as readonly string[]).includes(v)
}

export const BUCKET = 'anexos'

/**
 * 4 MB, y NO los 25 que el bucket permite.
 *
 * El límite real no lo pone este código ni Supabase: lo pone Vercel, que corta
 * el CUERPO de una petición a una función serverless en **4.5 MB** y responde
 * 413 antes de que la ruta llegue a ejecutarse. Prometer 25 MB era prometer
 * algo que la plataforma no puede aceptar: quien subiera un PDF de 10 MB vería
 * un fallo crudo, sin el mensaje explicativo que esta validación redacta,
 * porque la ruta nunca se habría ejecutado para redactarlo.
 *
 * Se deja en 4 MB con margen: el multipart añade cabeceras y el separador por
 * cada campo, así que el cuerpo pesa algo más que el archivo.
 *
 * El bucket sigue aceptando 25 MB a propósito — ese techo no estorba, y el día
 * que la subida pase por una URL firmada directa al almacenamiento (que es
 * como se levantaría este límite) no habría que volver a tocarlo.
 */
export const MAX_BYTES = 4 * 1024 * 1024

/**
 * Los formatos que pidió dirección: Word, Excel, PDF y —desde el 5 oct
 * 2026— informes HTML.
 *
 * Se valida el MIME **y** la extensión, y tienen que coincidir. El navegador
 * manda el MIME y es trivial falsificarlo; la extensión sola tampoco basta.
 * Exigir las dos cosas cierra el caso de un ejecutable renombrado a `.pdf`.
 */
export const FORMATOS: { mime: string; ext: string[]; etiqueta: string }[] = [
  { mime: 'application/pdf', ext: ['.pdf'], etiqueta: 'PDF' },
  { mime: 'application/msword', ext: ['.doc'], etiqueta: 'Word' },
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: ['.docx'], etiqueta: 'Word' },
  { mime: 'application/vnd.ms-excel', ext: ['.xls'], etiqueta: 'Excel' },
  { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: ['.xlsx'], etiqueta: 'Excel' },
  { mime: 'application/vnd.ms-excel.sheet.macroEnabled.12', ext: ['.xlsm'], etiqueta: 'Excel' },
  /* HTML — los informes autónomos que genera el equipo (llamadas perdidas,
     análisis por cuenta). Instrucción de dirección, 5 oct 2026.

     ES EL ÚNICO FORMATO DE ESTA LISTA QUE EJECUTA CÓDIGO. Un .docx o un .xlsx
     los abre Office fuera del navegador; un .html con un `<script>` dentro
     corre EN el navegador, y si se sirviera desde nuestro origen tendría
     acceso a la cookie de sesión del tablero. Por eso la descarga va SIEMPRE
     como adjunto y con `Content-Security-Policy: sandbox` — ver el encabezado
     de app/api/anexos/[id]/descargar/route.ts. No es paranoia: el informe de
     ejemplo que motivó esto trae un `<script>` embebido. */
  { mime: 'text/html', ext: ['.html', '.htm'], etiqueta: 'HTML' },
]

export const MIMES_PERMITIDOS = FORMATOS.map(f => f.mime)
export const EXTENSIONES = FORMATOS.flatMap(f => f.ext)
/** Para el `accept` del <input type="file">. */
export const ACCEPT = [...MIMES_PERMITIDOS, ...EXTENSIONES].join(',')

const EXT_HTML = ['.html', '.htm']

/** Un .html que el navegador no supo tipar. Es la única excepción tolerada. */
function esHtmlSinTipo(nombre: string, mime: string): boolean {
  return EXT_HTML.includes(extensionDe(nombre))
      && (!mime || mime === 'text/plain')
}

/**
 * El tipo con el que se GUARDA el archivo.
 *
 * Si se guardara el `type` crudo del navegador, un .html que llegó sin tipo se
 * almacenaría con `archivo_tipo: ''` y la descarga saldría como
 * `application/octet-stream` — el navegador no sabría qué es. Se normaliza
 * aquí, una sola vez, para que la fila guarde el tipo real.
 */
export function mimeEfectivo(nombre: string, mime: string): string {
  if (FORMATOS.some(f => f.mime === mime)) return mime
  if (esHtmlSinTipo(nombre, mime)) return 'text/html'
  return mime
}

export function extensionDe(nombre: string): string {
  const i = nombre.lastIndexOf('.')
  return i < 0 ? '' : nombre.slice(i).toLowerCase()
}

export function etiquetaFormato(mime: string): string {
  return FORMATOS.find(f => f.mime === mime)?.etiqueta ?? 'Documento'
}

/**
 * Valida el archivo. Devuelve el motivo del rechazo, o null si pasa.
 *
 * Que el MIME y la extensión tengan que corresponderse es deliberado: un
 * `.exe` renombrado a `.pdf` trae MIME `application/pdf` si el cliente lo dice,
 * pero su extensión real no está en la lista de ese MIME y cae aquí.
 */
export function motivoRechazo(nombre: string, mime: string, bytes: number): string | null {
  if (!bytes) return 'El archivo está vacío.'
  if (bytes > MAX_BYTES) {
    return `El archivo pesa ${(bytes / 1024 / 1024).toFixed(1)} MB y el máximo son `
         + `${MAX_BYTES / 1024 / 1024} MB.`
  }
  const formato = FORMATOS.find(f => f.mime === mime)
  if (!formato) {
    /* La ÚNICA tolerancia, y es acotada a propósito: un .html que llega sin
       tipo o como text/plain. Los navegadores varían ahí y rechazarlo sería
       rechazar un archivo legítimo por un detalle del navegador.
       NO se extiende a `application/octet-stream` ni a los demás formatos:
       eso aceptaría cualquier binario con tal de que llevara una extensión
       conocida, que es justo lo que la pareja MIME+extensión vino a cerrar. */
    if (esHtmlSinTipo(nombre, mime)) return null
    return `Tipo de archivo no permitido (${mime || 'desconocido'}). `
         + 'Sólo se aceptan Word, Excel, PDF y HTML.'
  }
  const ext = extensionDe(nombre)
  if (!formato.ext.includes(ext)) {
    return `La extensión "${ext || '(ninguna)'}" no corresponde a un archivo ${formato.etiqueta}. `
         + `Se esperaba ${formato.ext.join(' o ')}.`
  }
  return null
}

/**
 * Ruta dentro del bucket: `<cuenta_id>/<sello>-<nombre saneado>`.
 *
 * El nombre se sanea en serio. Un nombre con `../` o con una barra podría
 * escribir fuera de la carpeta de la cuenta; se reduce a letras, números,
 * punto, guion y guion bajo, y el resto se colapsa. Se antepone un sello de
 * tiempo para que subir dos veces el mismo archivo no pise el anterior —
 * borrar en silencio una versión previa es perder un documento.
 */
export function rutaEnBucket(cuentaId: string, nombre: string, sello: number): string {
  const ext = extensionDe(nombre)
  const base = nombre
    .slice(0, nombre.length - ext.length)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80)
  return `${cuentaId}/${sello}-${base || 'documento'}${ext}`
}

export function pesoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export interface Anexo {
  id: string
  cuenta_id: string
  cid: string | null
  empresa: string | null
  nombre_documento: string
  tema: Tema
  archivo_nombre: string
  archivo_ruta: string
  archivo_tipo: string
  archivo_bytes: number
  notas: string | null
  subido_por: string | null
  creado_en: string
}
