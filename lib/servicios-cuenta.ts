/**
 * CAPA 1 — Inventario de servicios por cuenta.
 *
 * Fuente única de qué servicios tiene un cliente y en qué estado están. Nace
 * de la instrucción de dirección (11 sep 2026): el Health Score debe reflejar
 * todo lo que el cliente representa, y entre más servicios tenga, mayor la
 * exigencia al asesor.
 *
 * ── POR QUÉ TRES FUENTES Y NO UNA ──────────────────────────────────────────
 * El archivo de cortes NO es el inventario: trae UNA sola línea de plan por
 * CID y por mes (19,072 de 19,151 combinaciones). Gas Económico aparece en 7
 * cortes y siempre como «Callpicker Chat Básico 9 agentes» — su Visibilidad y
 * Control y su DID no salen ahí nunca, pero su ficha sí los declara. Construir
 * el inventario solo desde cortes habría perdido dos de sus tres servicios.
 *
 *   A) `cuentas.servicio` y `servicios_json` → qué DECLARA tener
 *   B) cortes de facturación                → medición de voz, panel y monto
 *   C) hoja de Callpicker Chat              → medición de chat
 *
 * Cobertura medida sobre las 219 cuentas con CID: 207 (95%) quedan con al
 * menos un servicio identificado; 75 resultan multi-servicio.
 *
 * ── LAS BANDERAS DE LA TABLA NO SE USAN ───────────────────────────────────
 * `tiene_chat_activo`, `tiene_ia_chat` y `tiene_ia_voz` están en `false` para
 * las 220 cuentas: nunca se poblaron. Mientras tanto HomiRent mueve 163,063
 * mensajes de chat. Este módulo deriva de datos reales justamente para no
 * depender de una casilla que alguien tiene que acordarse de marcar.
 */
import { cortesDeCuenta, type CorteCuenta } from './cortes-cuenta'
import { CHAT_CLIENTES } from '@/app/callpicker-chat/chat-data'

export type FamiliaServicio =
  | 'Voz · Visibilidad y Control'
  | 'Voz · Comunicación Empresarial'
  | 'Voz · Plan Emprendedor'
  | 'Chat'
  | 'Asistente Virtual'
  | 'DID'
  | 'Troncal SIP'
  | 'Calltracking'
  | 'Conmutador Virtual'
  | 'Números Virtuales'

/** Estado operativo de un servicio. `no_medible` es distinto de `sin_uso`:
 *  uno dice "no hay con qué saberlo", el otro dice "sabemos que no se usa". */
export type EstadoServicio = 'sano' | 'bajo' | 'sin_uso' | 'sin_medicion' | 'no_medible'

export interface ServicioCuenta {
  familia:    FamiliaServicio
  contratado: boolean
  /** null cuando no existe forma de medir este servicio hoy. */
  enUso:      boolean | null
  estado:     EstadoServicio
  detalle:    string
  /** De dónde salió cada afirmación. Sin esto no se puede auditar el dato. */
  evidencia:  string[]
  metricas?:  Record<string, number | string | null>
}

export interface InventarioCuenta {
  servicios:   ServicioCuenta[]
  total:       number
  conMedicion: number
  noMedibles:  number
  /** Plan del corte más reciente, tal como lo muestra hoy la ficha. */
  planUltimoCorte: string | null
  mesUltimoCorte:  string | null
}

/* ── Taxonomía ───────────────────────────────────────────────────────────────
 * Validada contra las 19,230 filas de cortes: deja 0.6% sin clasificar.
 * El orden importa — se evalúa de lo más específico a lo más general, porque
 * un plan «CP Chat QR» es Chat aunque mencione números. Y un mismo texto puede
 * declarar VARIOS servicios: «Visibilidad y Control + CP Chat y DID» son tres,
 * por eso devuelve lista y no un único valor.                                */
const REGLAS: [FamiliaServicio, RegExp][] = [
  ['Chat',                           /\bchat\b/],
  ['Asistente Virtual',              /\bagentes? virtuales?\b|\basistente virtual\b|\bia de voz\b/],
  ['Calltracking',                   /\bcall ?tracking\b/],
  ['Conmutador Virtual',             /\bconmutador\b/],
  ['Números Virtuales',              /\bn[uú]meros? virtuales?\b/],
  ['DID',                            /\bdid\b/],
  ['Troncal SIP',                    /\btroncal\b|\bcanales? sip\b|\bsip\b/],
  ['Voz · Visibilidad y Control',    /\bvisibilidad y control\b|\bvyc\b|\bv y c\b/],
  ['Voz · Comunicación Empresarial', /\bcomunicaci[oó]n empresarial\b|\bcom empresarial\b|\bce\b|\bcel\b/],
  ['Voz · Plan Emprendedor',         /\bemprendedor\b/],
]

/** Sin acentos y en minúsculas. Los nombres de plan traen acentos
 *  inconsistentes: sin esto, «Comunicación Empresarial 400 minutos» —4,931
 *  filas, el plan más vendido— caía en «sin clasificar». */
function normalizar(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').toLowerCase().trim()
}

export function familiasDeTexto(texto: string | null | undefined): FamiliaServicio[] {
  const p = normalizar(texto)
  if (!p) return []
  return REGLAS.filter(([, re]) => re.test(p)).map(([f]) => f)
}

const ES_VOZ = (f: FamiliaServicio) => f.startsWith('Voz ·')

/* ── Evaluación por servicio ─────────────────────────────────────────────── */

function evaluarVoz(cortes: CorteCuenta[]): Omit<ServicioCuenta, 'familia' | 'contratado'> {
  const ult = cortes[cortes.length - 1]
  if (!ult) {
    return {
      enUso: null, estado: 'sin_medicion',
      detalle: 'La cuenta no aparece en los cortes de facturación, así que no hay forma de medir su uso de voz.',
      evidencia: ['Sin registro en cortes de facturación'],
    }
  }
  const pct = ult.incl > 0 ? (ult.cons / ult.incl) * 100 : null
  const ev = [`Corte ${ult.mes}: ${ult.cons.toLocaleString('es-MX')} de ${ult.incl.toLocaleString('es-MX')} minutos`]
  if (ult.uso) ev.push(`Uso principal: ${ult.uso}`)

  if (ult.cons === 0) {
    return {
      enUso: false, estado: 'sin_uso',
      detalle: `Cero minutos consumidos en el corte de ${ult.mes} sobre ${ult.incl.toLocaleString('es-MX')} incluidos.`,
      evidencia: ev,
      metricas: { minutosIncluidos: ult.incl, minutosConsumidos: 0, pctConsumo: 0, monto: ult.monto },
    }
  }
  // Un plan con 1 minuto incluido no es un plan de voz: suele ser la línea de
  // otro servicio facturada en el mismo corte. No se juzga su consumo.
  if (ult.incl <= 1) {
    return {
      enUso: true, estado: 'no_medible',
      detalle: 'El plan del corte no declara una bolsa de minutos real, así que el porcentaje de consumo no significa nada.',
      evidencia: ev,
      metricas: { minutosIncluidos: ult.incl, minutosConsumidos: ult.cons, pctConsumo: null, monto: ult.monto },
    }
  }
  const estado: EstadoServicio = pct === null ? 'no_medible' : pct < 15 ? 'bajo' : 'sano'
  return {
    enUso: true, estado,
    detalle: pct !== null && pct < 15
      ? `Consume ${pct.toFixed(0)}% de su bolsa. Plan probablemente sobredimensionado.`
      : `Consume ${pct === null ? '—' : pct.toFixed(0)}% de su bolsa de minutos.`,
    evidencia: ev,
    metricas: { minutosIncluidos: ult.incl, minutosConsumidos: ult.cons, pctConsumo: pct, monto: ult.monto },
  }
}

const MAPA_CHAT: Record<string, EstadoServicio> = {
  saludable: 'sano', intenso: 'sano', bajo: 'bajo',
  sin_uso: 'sin_uso', sin_medicion: 'sin_medicion', suspendida: 'sin_medicion',
}

function evaluarChat(cid: string): Omit<ServicioCuenta, 'familia' | 'contratado'> {
  const c = CHAT_CLIENTES.find(x => x.cid === cid)
  if (!c) {
    return {
      enUso: null, estado: 'sin_medicion',
      detalle: 'La cuenta no aparece en la hoja de Callpicker Chat, así que no hay forma de medir su uso.',
      evidencia: ['Sin registro en la hoja de chat'],
    }
  }
  return {
    enUso: c.mensajes > 0,
    estado: MAPA_CHAT[c.semaforo] ?? 'sin_medicion',
    detalle: c.motivos?.[0] ?? `${c.mensajes.toLocaleString('es-MX')} mensajes en el corte.`,
    evidencia: [
      `Corte desde ${c.periodo}: ${c.mensajes.toLocaleString('es-MX')} mensajes en ${c.conversaciones.toLocaleString('es-MX')} conversaciones`,
      `${c.cuentas.length} cuenta(s) Chatwoot · ${c.inboxes.length} bandeja(s)`,
    ],
    metricas: {
      mensajes: c.mensajes, conversaciones: c.conversaciones,
      bandejas: c.inboxes.length, contratadasMuertas: c.contratadosMuertos,
      semaforo: c.semaforo,
    },
  }
}

/** Servicios que hoy no tienen ninguna fuente de medición de uso. Se declara
 *  explícitamente en vez de pintarlos como si estuvieran bien. */
function sinFuente(familia: FamiliaServicio): Omit<ServicioCuenta, 'familia' | 'contratado'> {
  return {
    enUso: null, estado: 'no_medible',
    detalle: `Contratado, pero hoy no existe una fuente que mida su uso. No se puede afirmar que esté sano ni que no lo esté.`,
    evidencia: [`Declarado en el servicio de la cuenta · sin medición disponible para ${familia}`],
  }
}

/* ── Punto de entrada ────────────────────────────────────────────────────── */
export async function inventarioDeCuenta(
  cid: string | null | undefined,
  servicio?: string | null,
  serviciosJson?: unknown,
): Promise<InventarioCuenta> {
  const id = String(cid ?? '').trim()
  const cortes = id ? await cortesDeCuenta(id, 9) : []

  const fams = new Set<FamiliaServicio>()
  // A · lo que declara la ficha
  familiasDeTexto(servicio).forEach(f => fams.add(f))
  if (Array.isArray(serviciosJson)) {
    for (const s of serviciosJson) {
      const txt = typeof s === 'string' ? s : (s as Record<string, unknown>)?.nombre
      familiasDeTexto(typeof txt === 'string' ? txt : null).forEach(f => fams.add(f))
    }
  }
  // B · lo que aparece facturado en cualquiera de sus cortes
  for (const c of cortes) familiasDeTexto(c.plan).forEach(f => fams.add(f))
  // C · si tiene dato de chat, tiene chat — aunque nadie lo haya declarado
  if (id && CHAT_CLIENTES.some(x => x.cid === id)) fams.add('Chat')

  const servicios: ServicioCuenta[] = [...fams].map(familia => {
    const base = ES_VOZ(familia) ? evaluarVoz(cortes)
      : familia === 'Chat' ? evaluarChat(id)
      : sinFuente(familia)
    return { familia, contratado: true, ...base }
  })

  // Orden: primero lo que exige atención, y dentro de eso la voz antes que el resto.
  const PESO: Record<EstadoServicio, number> = {
    sin_uso: 0, bajo: 1, sin_medicion: 2, no_medible: 3, sano: 4,
  }
  servicios.sort((a, b) =>
    PESO[a.estado] - PESO[b.estado] ||
    Number(ES_VOZ(b.familia)) - Number(ES_VOZ(a.familia)) ||
    a.familia.localeCompare(b.familia, 'es'))

  const ult = cortes[cortes.length - 1]
  return {
    servicios,
    total: servicios.length,
    conMedicion: servicios.filter(s => s.enUso !== null).length,
    noMedibles:  servicios.filter(s => s.enUso === null).length,
    planUltimoCorte: ult?.plan ?? null,
    mesUltimoCorte:  ult?.mes ?? null,
  }
}
