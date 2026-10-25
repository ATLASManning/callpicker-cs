/**
 * lib/contratos-norm.ts — LA FORMA DE UN CONTRATO, en un solo sitio.
 *
 * El crudo lo produce `scripts/gen-contratos.py` desde el export HTML de la
 * hoja de Google. Aquí viven los tipos y las reglas de lectura para que la
 * API, la pantalla y cualquier verificador cuenten lo mismo. Es el patrón de
 * `lib/tickets-norm.ts`: cada vista que leía el crudo por su cuenta repetía
 * los mismos errores con su propia variante.
 *
 * ── LAS TRES CLASES DE VENCIMIENTO, Y POR QUÉ SON TRES ────────────────────
 *
 *   · `finMedible`      — tiene fecha de fin: se puede calcular cuándo vence.
 *   · `sinVencimiento`  — plazo «libre»: no vence POR DEFINICIÓN.
 *   · ninguna de las dos — no hay fecha ni plazo libre: **NO SE SABE**.
 *
 * Juntar las dos últimas sería cómodo y sería mentira: 27 de los 60 contratos
 * caen en la tercera, y contarlos como «no vencen» diría que casi la mitad de
 * la cartera contractual está tranquila cuando lo que pasa es que la hoja no
 * lo dice. [[feedback-cero-sin-medicion]]
 *
 * ── «sin_estatus» NO ES «no firmado» ──────────────────────────────────────
 * Once contratos no traen estatus escrito. Eso es un hueco de captura, no un
 * contrato sin firmar: hay UNO que la hoja marca explícitamente «no firmado».
 * Se distinguen.
 */

/** Estado de firma, normalizado. El crudo trae «fima» por «firma» 16 veces. */
export type EstadoContrato = 'firmado' | 'en_proceso' | 'no_firmado' | 'sin_estatus'

export interface Contrato {
  cuenta:        string
  cid:           string | null
  vendedor:      string | null
  solicitud:     string | null
  estatusHoja:   string | null
  estado:        EstadoContrato
  plazo:         string | null
  plazoLibre:    boolean
  inicio:        string | null
  fin:           string | null
  finMedible:    boolean
  sinVencimiento: boolean
  vigencia:      string | null
  contenido:     string | null
  solicitante:   string | null
  firmante:      string | null
  emailFirmante: string | null
  gdoc:          string | null
  firma:         string | null
  nota:          string | null
  /** El color de la celda en la hoja. Se guarda y NO se interpreta: el mismo
   *  estatus aparece en negro, azul y rojo, así que no es una dimensión. */
  colorHoja:     string | null
}

/** Lo que añade `/api/contratos` al cruzar con la cartera. */
export interface ContratoCruzado extends Contrato {
  diasParaVencer: number | null
  vencido:        boolean
  enCartera:      boolean
  consecutivo:    string | null
  empresaCartera: string | null
  asesor:         string | null
  estadoCuenta:   string | null
  giro:           string | null
  tamano:         string | null
  mrr:            number | null
  esTop:          boolean
}

export interface TopSinContrato {
  consecutivo: string | null
  empresa:     string | null
  cid:         string | null
  asesor:      string | null
  estado:      string | null
  mrr:         number | null
}

export interface MetaContratos {
  origen:        string
  generado:      string
  total:         number
  porEstado:     Record<string, number>
  conFin:        number
  sinVencimiento: number
  noMedibles:    number
  conCid:        number
  hoy:           string
  enCartera:     number
  fueraDeCartera: number
  topTotal:      number
  topConContrato: number
}

export interface RespuestaContratos {
  meta:           MetaContratos
  contratos:      ContratoCruzado[]
  topSinContrato: TopSinContrato[]
}

/** Las etiquetas que se pintan. En un solo sitio para que no diverjan. */
export const ETIQUETA_ESTADO: Record<EstadoContrato, string> = {
  firmado:     'Firmado',
  en_proceso:  'En proceso de firma',
  no_firmado:  'No firmado',
  sin_estatus: 'Sin estatus en la hoja',
}

/**
 * Las dimensiones por las que se puede partir la gráfica.
 *
 * `giro`, `tamano`, `asesor` y `mrr` **sólo existen para los contratos que
 * cruzan con la cartera**. Los que no cruzan no se tiran: caen en un cubo
 * explícito, porque un reparto que pierde 36 de 60 filas miente sin decirlo.
 * [[feedback-tablas-deben-cerrar]]
 */
export type Dimension = 'estado' | 'vendedor' | 'plazo' | 'giro' | 'tamano' | 'asesor' | 'mrrBanda' | 'anioFin'

export const DIMENSIONES: { id: Dimension; label: string; soloCartera: boolean }[] = [
  { id: 'estado',   label: 'Estatus de firma', soloCartera: false },
  { id: 'vendedor', label: 'Vendedor',         soloCartera: false },
  { id: 'plazo',    label: 'Plazo',            soloCartera: false },
  { id: 'anioFin',  label: 'Año de término',   soloCartera: false },
  { id: 'giro',     label: 'Sector / giro',    soloCartera: true  },
  { id: 'tamano',   label: 'Tamaño',           soloCartera: true  },
  { id: 'asesor',   label: 'Asesor',           soloCartera: true  },
  { id: 'mrrBanda', label: 'Facturación',      soloCartera: true  },
]

/** Bandas de facturación. Los cortes son los del tablero, no inventados. */
export function bandaMrr(mrr: number | null): string {
  if (mrr === null || mrr === undefined) return 'sin dato'
  if (mrr <= 0)      return 'sin dato'
  if (mrr <= 3000)   return '$1 – $3,000'
  if (mrr <= 10000)  return '$3,001 – $10,000'
  if (mrr <= 30000)  return '$10,001 – $30,000'
  if (mrr <= 80000)  return '$30,001 – $80,000'
  return '$80,001 en adelante'
}

/**
 * El valor de una dimensión para un contrato. NUNCA devuelve cadena vacía:
 * un hueco se nombra, para que el reparto cierre y para que el lector sepa
 * que ahí falta un dato en vez de ver una barra sin etiqueta.
 */
export function valorDimension(c: ContratoCruzado, d: Dimension): string {
  switch (d) {
    case 'estado':   return ETIQUETA_ESTADO[c.estado]
    case 'vendedor': return c.vendedor?.trim() || 'sin vendedor anotado'
    case 'plazo':    return c.plazo?.trim() || 'sin plazo anotado'
    case 'anioFin':  return c.fin ? c.fin.slice(0, 4)
                            : c.sinVencimiento ? 'sin vencimiento (libre)'
                            : 'sin fecha de término'
    case 'giro':     return !c.enCartera ? 'fuera de la cartera CS'
                            : c.giro?.trim() || 'sin giro capturado'
    case 'tamano':   return !c.enCartera ? 'fuera de la cartera CS'
                            : c.tamano?.trim() || 'sin tamaño capturado'
    case 'asesor':   return !c.enCartera ? 'fuera de la cartera CS'
                            : c.asesor?.trim() || 'sin asesor'
    case 'mrrBanda': return !c.enCartera ? 'fuera de la cartera CS' : bandaMrr(c.mrr)
  }
}

/** Reparto por dimensión, ordenado y CERRADO: las partes suman el total. */
export function repartir(cs: ContratoCruzado[], d: Dimension): { clave: string; n: number }[] {
  const m = new Map<string, number>()
  for (const c of cs) {
    const k = valorDimension(c, d)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()]
    .map(([clave, n]) => ({ clave, n }))
    .sort((a, b) => b.n - a.n || a.clave.localeCompare(b.clave, 'es'))
}
