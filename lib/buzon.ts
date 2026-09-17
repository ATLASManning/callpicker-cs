/**
 * lib/buzon.ts
 * Buzón del Cliente — sugerencias a servicios y procesos.
 *
 * ── LO QUE DIRECCIÓN PIDIÓ ─────────────────────────────────────────────────
 * Cliente y CID, solicitud, prioridad (alta/media/baja), área responsable,
 * detalle del seguimiento, canal de entrada, fecha de solicitud, fecha de
 * entrega y si hubo solución.
 *
 * ── LO QUE SE AGREGÓ, Y POR QUÉ ────────────────────────────────────────────
 * Dirección pidió expresamente incluir «algún tema que no esté tomando en
 * cuenta». Son cuatro, y cada uno tapa una fuga concreta:
 *
 *  1. TEMA (agrupador). Es el campo más valioso de todo el módulo y no estaba
 *     en la lista. Un buzón sin agrupación es una lista de anécdotas: un
 *     cliente pidiendo algo es una opinión; ocho pidiendo lo mismo es una
 *     instrucción de producto. Sin `tema` nadie puede ver la segunda, y el
 *     buzón se convierte en un archivero.
 *
 *  2. ¿SE LE AVISÓ AL CLIENTE? Es la fuga más común de estos sistemas. Se
 *     entrega la mejora y nadie se lo dice a quien la pidió; el cliente
 *     concluye que hablar no sirve y deja de sugerir. Una entrega no avisada
 *     es trabajo hecho y crédito perdido — y la próxima sugerencia que no
 *     llega es la que habría evitado una baja.
 *
 *  3. FECHA COMPROMETIDA ≠ FECHA DE ENTREGA. Lo prometido y lo cumplido son
 *     cosas distintas. La distancia entre las dos es lo único que el cliente
 *     percibe como servicio, y con un solo campo no se puede medir.
 *
 *  4. «SOLUCIÓN: SÍ/NO» NO PUEDE DESCRIBIR LO QUE SIGUE ABIERTO. Si se obliga
 *     a elegir desde el primer día, todo nace en «no» y el tablero reporta un
 *     fracaso que no ocurrió. `solucion` queda nula hasta que el ciclo cierra:
 *     nulo es «todavía no», nunca «no».
 *
 * Y una regla que no se negocia: un «no» sin motivo no es una respuesta. Es
 * justo el caso en el que hay que dar la cara, así que la base misma lo exige.
 */

export type Prioridad = 'alta' | 'media' | 'baja'
export type Area      = 'administracion' | 'ingenieria' | 'producto' | 'soporte'
export type Canal     = 'whatsapp' | 'telefono' | 'email' | 'meeting' | 'ticket'
export type EstadoBuzon = 'recibida' | 'en_analisis' | 'comprometida' | 'entregada' | 'no_procede'
export type Solucion  = 'si' | 'no' | null

export interface EntradaBuzon {
  id: string
  cuenta_id: string | null
  cid: string | null
  cliente: string
  solicitud: string
  tema: string | null
  prioridad: Prioridad
  area: Area
  canal: Canal
  estado: EstadoBuzon
  seguimiento: string | null
  fecha_solicitud: string
  fecha_compromiso: string | null
  fecha_entrega: string | null
  solucion: Solucion
  motivo_respuesta: string | null
  avisado_al_cliente: boolean
  fecha_aviso: string | null
  registrado_por: string | null
  asesor: string | null
  created_at?: string
  updated_at?: string
}

/* ── Catálogos: una sola definición, la usan el formulario y los filtros ──── */

export const PRIORIDADES: { v: Prioridad; label: string; color: string; nota: string }[] = [
  { v: 'alta',  label: 'Alta',  color: '#DC2626', nota: 'Bloquea la operación del cliente o hay compromiso comercial de por medio' },
  { v: 'media', label: 'Media', color: '#D97706', nota: 'Mejora sensible, sin operación detenida' },
  { v: 'baja',  label: 'Baja',  color: '#0369A1', nota: 'Preferencia o comodidad; suma, no urge' },
]

export const AREAS: { v: Area; label: string; color: string }[] = [
  { v: 'administracion', label: 'Administración', color: '#7C3AED' },
  { v: 'ingenieria',     label: 'Ingeniería',     color: '#0891B2' },
  { v: 'producto',       label: 'Producto',       color: '#1B3FCC' },
  { v: 'soporte',        label: 'Soporte',        color: '#059669' },
]

export const CANALES: { v: Canal; label: string }[] = [
  { v: 'whatsapp', label: 'WhatsApp' },
  { v: 'telefono', label: 'Teléfono' },
  { v: 'email',    label: 'Email'    },
  { v: 'meeting',  label: 'Meeting'  },
  { v: 'ticket',   label: 'Ticket'   },
]

export const ESTADOS: { v: EstadoBuzon; label: string; color: string; abierto: boolean }[] = [
  { v: 'recibida',     label: 'Recibida',       color: '#64748B', abierto: true  },
  { v: 'en_analisis',  label: 'En análisis',    color: '#0891B2', abierto: true  },
  { v: 'comprometida', label: 'Comprometida',   color: '#D97706', abierto: true  },
  { v: 'entregada',    label: 'Entregada',      color: '#059669', abierto: false },
  { v: 'no_procede',   label: 'No procede',     color: '#B91C1C', abierto: false },
]

export const etiqueta = <T extends string>(
  cat: { v: T; label: string }[], v: T | null | undefined,
): string => cat.find(x => x.v === v)?.label ?? '—'

export const colorDe = <T extends string>(
  cat: { v: T; color: string }[], v: T | null | undefined,
): string => cat.find(x => x.v === v)?.color ?? '#94A3B8'

export const estaAbierta = (e: EntradaBuzon) =>
  ESTADOS.find(x => x.v === e.estado)?.abierto ?? true

/* ── Derivados ───────────────────────────────────────────────────────────── */

const DIA = 86_400_000
const dias = (a: string, b: string) =>
  Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / DIA)

/** Días que lleva abierta, o que tardó en cerrar. */
export function diasEnCurso(e: EntradaBuzon, hoy: string): number {
  return dias(e.fecha_solicitud, e.fecha_entrega ?? hoy)
}

/**
 * Cumplimiento del compromiso. `null` cuando no hay fecha comprometida — que
 * es información en sí misma: no se puede incumplir lo que nunca se prometió,
 * pero tampoco se puede presumir de cumplirlo.
 */
export function diasContraCompromiso(e: EntradaBuzon, hoy: string): number | null {
  if (!e.fecha_compromiso) return null
  return dias(e.fecha_compromiso, e.fecha_entrega ?? hoy)
}

export type Alerta = { texto: string; color: string }

/**
 * Lo que hay que ver sin abrir el renglón. No inventa urgencia: cada alerta
 * corresponde a un hecho verificable en el propio registro.
 */
export function alertas(e: EntradaBuzon, hoy: string): Alerta[] {
  const out: Alerta[] = []
  const vs = diasContraCompromiso(e, hoy)

  if (vs !== null && vs > 0 && estaAbierta(e)) {
    out.push({ texto: `${vs} día${vs === 1 ? '' : 's'} sobre lo comprometido`, color: '#DC2626' })
  }
  if (!e.fecha_compromiso && e.estado === 'comprometida') {
    out.push({ texto: 'Comprometida sin fecha', color: '#D97706' })
  }
  // La fuga del circuito: se resolvió y el cliente no lo sabe.
  if (!estaAbierta(e) && !e.avisado_al_cliente) {
    out.push({ texto: 'Cerrada y el cliente no lo sabe', color: '#B45309' })
  }
  if (e.prioridad === 'alta' && e.estado === 'recibida' && diasEnCurso(e, hoy) > 7) {
    out.push({ texto: 'Alta prioridad sin analizar', color: '#DC2626' })
  }
  return out
}

/* ── La lectura que justifica el módulo: la recurrencia ──────────────────── */

export interface TemaAgrupado {
  tema: string
  solicitudes: number
  /** Clientes DISTINTOS que lo han pedido. Es el número que decide. */
  clientes: number
  areas: Area[]
  abiertas: number
  entregadas: number
  alta: number
  ejemplos: string[]
}

/**
 * Agrupa por tema y ordena por CLIENTES DISTINTOS, no por número de
 * solicitudes: diez tickets del mismo cliente siguen siendo un cliente, y
 * confundirlo hace que el más insistente marque la hoja de ruta en vez del
 * más representativo.
 */
export function agruparPorTema(entradas: EntradaBuzon[]): TemaAgrupado[] {
  const m = new Map<string, { e: EntradaBuzon[]; cli: Set<string> }>()
  for (const e of entradas) {
    const t = (e.tema ?? '').trim()
    if (!t) continue
    const g = m.get(t) ?? { e: [], cli: new Set<string>() }
    g.e.push(e)
    g.cli.add((e.cid ?? e.cliente ?? '').trim().toLowerCase())
    m.set(t, g)
  }
  return Array.from(m.entries()).map(([tema, g]) => ({
    tema,
    solicitudes: g.e.length,
    clientes: g.cli.size,
    areas: Array.from(new Set(g.e.map(x => x.area))),
    abiertas: g.e.filter(estaAbierta).length,
    entregadas: g.e.filter(x => x.estado === 'entregada').length,
    alta: g.e.filter(x => x.prioridad === 'alta').length,
    ejemplos: g.e.slice(0, 3).map(x => x.solicitud),
  })).sort((a, b) => b.clientes - a.clientes || b.solicitudes - a.solicitudes)
}

export interface ResumenBuzon {
  total: number
  abiertas: number
  entregadas: number
  noProcede: number
  alta: number
  vencidas: number
  cerradasSinAvisar: number
  sinTema: number
  porArea: { area: Area; n: number; abiertas: number }[]
  porCanal: { canal: Canal; n: number }[]
  diasPromedioCierre: number | null
}

export function resumirBuzon(entradas: EntradaBuzon[], hoy: string): ResumenBuzon {
  const cerradas = entradas.filter(e => !estaAbierta(e) && e.fecha_entrega)
  const suma = cerradas.reduce((s, e) => s + diasEnCurso(e, hoy), 0)
  return {
    total: entradas.length,
    abiertas: entradas.filter(estaAbierta).length,
    entregadas: entradas.filter(e => e.estado === 'entregada').length,
    noProcede: entradas.filter(e => e.estado === 'no_procede').length,
    alta: entradas.filter(e => e.prioridad === 'alta' && estaAbierta(e)).length,
    vencidas: entradas.filter(e => {
      const v = diasContraCompromiso(e, hoy)
      return v !== null && v > 0 && estaAbierta(e)
    }).length,
    cerradasSinAvisar: entradas.filter(e => !estaAbierta(e) && !e.avisado_al_cliente).length,
    sinTema: entradas.filter(e => !(e.tema ?? '').trim()).length,
    porArea: AREAS.map(a => ({
      area: a.v,
      n: entradas.filter(e => e.area === a.v).length,
      abiertas: entradas.filter(e => e.area === a.v && estaAbierta(e)).length,
    })),
    porCanal: CANALES.map(c => ({ canal: c.v, n: entradas.filter(e => e.canal === c.v).length })),
    diasPromedioCierre: cerradas.length ? Math.round(suma / cerradas.length) : null,
  }
}
