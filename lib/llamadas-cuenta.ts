/**
 * Atención de llamadas por cuenta — lógica, umbrales y redacción.
 *
 * El componente no decide nada: todo el juicio vive aquí, para que cambiar un
 * umbral no obligue a tocar la pantalla.
 *
 * ── LAS REGLAS QUE NO SE NEGOCIAN ──────────────────────────────────────────
 * 1. Entrante «Lost» y saliente «Lost» NO son lo mismo y nunca se suman. La
 *    entrante es un cliente final al que ninguna extensión le contestó (20.4%
 *    en el archivo); la saliente es una marcación que no conectó (43.6%, que es
 *    lo normal). Por eso las salientes se publican INVERTIDAS, como «% que
 *    conectó»: así restarlas contra el indicador de entrantes no es solo una
 *    prohibición, es aritméticamente imposible.
 * 2. `Self_service` no es una falla: son 111,224 llamadas que el menú resolvió
 *    sin agente. Va del lado atendido del cociente y jamás en el numerador.
 *    Un solo denominador en todo el módulo —todas las entrantes— que es el
 *    mismo que dibuja la barra apilada, para que la cifra se pueda reproducir
 *    midiendo la gráfica.
 * 3. Los nombres de destino NO se clasifican por su texto. Un filtro de
 *    palabras clave marcó «CLAUDIA ROMAN» como agente virtual porque el nombre
 *    contiene la subcadena "ia ". El nombre se imprime tal cual.
 * 4. Se dice «llamadas» y «números distintos», nunca «personas»: D2 registra
 *    2,625 llamadas desde 1,237 números. Y «sin contestar» para entrantes,
 *    «no conectó» para salientes; nunca «perdidas» a secas.
 * 5. El 20.4% es la «línea base del archivo», no de la cartera: son 86 de 220
 *    cuentas de un corte deliberado de poco consumo.
 */

export interface DestinoLlamadas {
  /** Literal de `destination_data_1`, sin corregir acentos ni mayúsculas. */
  d: string
  /** No contestadas que cayeron en este destino. */
  l: number
  /** Contestadas por este destino. Sostiene la compuerta del destino por confirmar. */
  c: number
  min: number
  /** Números distintos que quedaron sin contestar. -1 en el bucket «otros». */
  n: number
  otros?: number
}

export interface MesEntrantes { t: number; l: number; r: number; s: number; v: number }
export interface MesSalientes { t: number; n: number }

export interface LlamadasCuenta {
  cid: string
  empresa: string
  norm: string
  ent: {
    total: number; lost: number
    meses: Record<string, MesEntrantes>
    dow: number[]; dowL: number[]
    hora: number[]; horaL: number[]
    dest: DestinoLlamadas[]
    primera: string | null; ultima: string | null
    lostSinNum: number
  } | null
  sal: { total: number; noCon: number; meses: Record<string, MesSalientes>; ultima: string | null } | null
  cerrado: { t: number; l: number } | null
  base: { t: number; l: number }
  ultima: string | null
}

export interface LlamadasMeta {
  corte: string; mesCerrado: string; baseFin: string
  meses: string[]; cuentas: number; fuente: string
  entTotal: number; entLost: number; salTotal: number; salNoCon: number
  baseEnt: number; baseSalCon: number
}

export type VeredictoLlamadas =
  | 'sin_lectura' | 'en_silencio' | 'por_confirmar' | 'sin_volumen'
  | 'llama' | 'vigilar' | 'estable'

/* ── Umbrales, todos en un solo lugar ─────────────────────────────────────── */
export const U = {
  /** Menos de esto en toda la ventana: no hay con qué medir atención. */
  VOLUMEN_MINIMO: 30,
  /** Días sin una sola llamada, contados contra el CORTE DEL ARCHIVO. */
  DIAS_SILENCIO: 30,
  /** Base mínima del mes cerrado y de los meses previos para comparar. */
  MES_MINIMO: 300,
  BASE_MINIMA: 300,
  /** Puntos porcentuales de deterioro contra su propia base. */
  PTS_LLAMA: 5,
  PTS_VIGILAR: 2,
  /** Compuerta del destino por confirmar. */
  CONF_CONCENTRACION: 0.60,
  CONF_MINIMO: 200,
  /** Un día o una hora solo se publican como hallazgo con esta base. */
  N_MINIMO_DIA: 100,
  N_MINIMO_HORA: 100,
  PTS_HALLAZGO: 5,
  /** Un mes con menos de esto no lleva etiqueta de porcentaje. */
  MES_ETIQUETA: 30,
  /** El pie avisa que el archivo está congelado pasando este plazo. */
  DIAS_ARCHIVO_VIEJO: 45,
} as const

const SIN_DESTINO = '(sin destino registrado)'
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const n = (x: number) => x.toLocaleString('es-MX')

export function mesCorto(ym: string) {
  const [y, m] = ym.split('-')
  return `${MESES_CORTOS[parseInt(m, 10) - 1]}${y !== '2026' ? ` ${y.slice(2)}` : ''}`
}
export function mesLargo(ym: string) {
  const [y, m] = ym.split('-')
  return `${MESES_LARGOS[parseInt(m, 10) - 1]} ${y}`
}
export function fechaCorta(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${parseInt(d, 10)} ${MESES_CORTOS[parseInt(m, 10) - 1].toLowerCase()} ${y}`
}
function diasEntre(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

/** Misma normalización que el generador (scripts/gen-llamadas-data.py). */
export function normalizarNombre(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[.,()\-_/]/g, ' ')
    .replace(/\b(s\.?a\.?p\.?i\.?|s\.?a\.?|s\.?\s?de\s?r\.?l\.?|c\.?v\.?|de\s?c\.?v\.?|sc|sofom|e\.?n\.?r\.?|spr|rl)\b/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

/**
 * Conciliación: por CID o por nombre de cliente, según instrucción de dirección.
 *
 * Hoy las dos rutas dan las mismas 86 cuentas —ningún nombre rescata una cuenta
 * que el CID no haya encontrado— y 85 de 86 coinciden por ambas. La única
 * discrepancia viva es C9: la cartera dice «Neruc Sede Central» y el archivo
 * «Grupo Neruc», con el mismo CID 73660. El cruce por nombre existe para cuando
 * un CID se capture mal o la siguiente extracción cambie de identificador.
 *
 * El nombre solo resuelve si es coincidencia EXACTA normalizada y si apunta a
 * un único registro: un nombre ambiguo no detona nada.
 */
export function conciliar(
  registros: Record<string, LlamadasCuenta>,
  cid: string | null | undefined,
  empresa: string | null | undefined,
): { datos: LlamadasCuenta; via: 'cid' | 'nombre'; nombreDifiere: boolean } | null {
  const id = String(cid ?? '').trim()
  if (id && registros[id]) {
    const d = registros[id]
    return { datos: d, via: 'cid', nombreDifiere: difiere(d.norm, normalizarNombre(empresa)) }
  }
  const nom = normalizarNombre(empresa)
  if (!nom) return null
  const hits = Object.values(registros).filter(r => r.norm && r.norm === nom)
  if (hits.length !== 1) return null   // cero o ambiguo: no se detona nada
  return { datos: hits[0], via: 'nombre', nombreDifiere: false }
}

function difiere(a: string, b: string) {
  if (!a || !b) return false
  return !(a === b || a.includes(b) || b.includes(a))
}

/* ── La compuerta del destino por confirmar ───────────────────────────────── */
/**
 * Un destino queda «por confirmar» cuando NUNCA sostuvo una conversación:
 * cero contestadas y cero minutos, además de concentrar la mayoría de lo no
 * contestado. No mira el texto del nombre — mira la estructura.
 *
 * Medido sobre las 773,486 entrantes:
 *   solo concentración (≥50% y ≥200)      → 25 destinos, 24 falsos positivos
 *                                           (Oficina, Ventas, Juan Cervantes,
 *                                            Jazmin Mendoza… empleados del cliente)
 *   + contestadas = 0 y minutos = 0       →  1 destino,   0 falsos positivos
 *
 * El bucket «(sin destino registrado)» queda excluido: cumpliría «cero
 * contestadas» por definición y no es un lugar por el que se pueda preguntar.
 */
export function destinoPorConfirmar(d: LlamadasCuenta): DestinoLlamadas | null {
  if (!d.ent || d.ent.lost <= 0) return null
  for (const x of d.ent.dest) {
    if (x.d === SIN_DESTINO || x.d === 'otros destinos') continue
    if (x.c === 0 && x.min === 0 && x.l >= U.CONF_MINIMO &&
        x.l / d.ent.lost >= U.CONF_CONCENTRACION) return x
  }
  return null
}

/* ── Hallazgos de día y hora ──────────────────────────────────────────────── */
export interface Hallazgos {
  pctCuenta: number
  peorDia: { i: number; nombre: string; pct: number; total: number; lost: number } | null
  horas: { h: number; pct: number; total: number; lost: number }[]
  fuera: { total: number; lost: number }
  frase: string
}

export function hallazgos(d: LlamadasCuenta, confirmado: boolean): Hallazgos | null {
  if (!d.ent || d.ent.total <= 0) return null
  const pctCuenta = (100 * d.ent.lost) / d.ent.total

  let peorDia: Hallazgos['peorDia'] = null
  d.ent.dow.forEach((t, i) => {
    if (t < U.N_MINIMO_DIA) return
    const pct = (100 * d.ent!.dowL[i]) / t
    if (!peorDia || pct > peorDia.pct) {
      peorDia = { i, nombre: DIAS[i], pct, total: t, lost: d.ent!.dowL[i] }
    }
  })
  if (peorDia && peorDia.pct - pctCuenta < U.PTS_HALLAZGO) peorDia = null

  const horas: Hallazgos['horas'] = []
  for (let h = 7; h <= 20; h++) {
    const t = d.ent.hora[h]
    if (t < U.N_MINIMO_HORA) continue
    const pct = (100 * d.ent.horaL[h]) / t
    if (pct - pctCuenta >= U.PTS_HALLAZGO) horas.push({ h, pct, total: t, lost: d.ent.horaL[h] })
  }

  let fueraT = 0, fueraL = 0
  for (let h = 0; h < 24; h++) {
    if (h >= 7 && h <= 20) continue
    fueraT += d.ent.hora[h]; fueraL += d.ent.horaL[h]
  }

  let frase: string
  if (confirmado) {
    frase = 'No se publica hallazgo de día ni de hora: mientras el destino no esté confirmado, ' +
            'el patrón describe a ese destino y no a la atención del cliente.'
  } else if (!peorDia && !horas.length) {
    frase = 'Las no contestadas se reparten parejo: no hay un día ni una hora que expliquen el problema.'
  } else {
    const partes: string[] = []
    if (peorDia) {
      partes.push(`Su peor día es el ${peorDia.nombre}: ${peorDia.pct.toFixed(1)}% sin contestar ` +
                  `sobre ${n(peorDia.total)} llamadas, contra ${pctCuenta.toFixed(1)}% de la cuenta`)
    }
    if (horas.length) {
      const hs = horas.map(x => `${x.h} h`).join(', ')
      partes.push(`${peorDia ? 'y las horas que se salen son' : 'Las horas que se salen son'} ${hs}`)
    }
    frase = partes.join(' ') + '.'
  }
  return { pctCuenta, peorDia, horas, fuera: { total: fueraT, lost: fueraL }, frase }
}

/* ── Veredicto ────────────────────────────────────────────────────────────── */
export interface LecturaLlamadas {
  datos: LlamadasCuenta
  via: 'cid' | 'nombre'
  nombreDifiere: boolean
  veredicto: VeredictoLlamadas
  etiqueta: string
  color: string
  /** % sin contestar del último mes cerrado. null si no hay base. */
  pctCerrado: number | null
  /** Puntos contra su propia base previa. null si no hay base suficiente. */
  delta: number | null
  pctBase: number | null
  confirmar: DestinoLlamadas | null
  hall: Hallazgos | null
  diasSinLlamada: number | null
  portada: string
  decir: string[]
  archivoViejo: boolean
}

const ETIQUETA: Record<VeredictoLlamadas, { t: string; c: string }> = {
  sin_lectura:   { t: 'SIN LECTURA',       c: '#94a3b8' },
  en_silencio:   { t: 'EN SILENCIO',       c: '#ef4444' },
  por_confirmar: { t: 'POR CONFIRMAR',     c: '#94a3b8' },
  sin_volumen:   { t: 'SIN VOLUMEN',       c: '#94a3b8' },
  llama:         { t: 'LLAMA ESTA SEMANA', c: '#ef4444' },
  vigilar:       { t: 'VIGILAR',           c: '#f59e0b' },
  estable:       { t: 'ESTABLE',           c: '#22c55e' },
}

export function leerLlamadas(
  registros: Record<string, LlamadasCuenta>,
  meta: LlamadasMeta,
  cid: string | null | undefined,
  empresa: string | null | undefined,
  hoy?: string,
): LecturaLlamadas | null {
  const m = conciliar(registros, cid, empresa)
  if (!m) return null
  const d = m.datos

  const pctCerrado = d.cerrado && d.cerrado.t > 0 ? (100 * d.cerrado.l) / d.cerrado.t : null
  const pctBase = d.base.t > 0 ? (100 * d.base.l) / d.base.t : null
  const comparable = !!d.cerrado && d.cerrado.t >= U.MES_MINIMO && d.base.t >= U.BASE_MINIMA
  const delta = comparable && pctCerrado !== null && pctBase !== null ? pctCerrado - pctBase : null

  const confirmar = destinoPorConfirmar(d)
  const diasSinLlamada = d.ultima ? diasEntre(d.ultima, meta.corte) : null

  // Precedencia. Un teléfono que dejó de sonar pesa más que cualquier porcentaje.
  let veredicto: VeredictoLlamadas
  if (diasSinLlamada !== null && diasSinLlamada > U.DIAS_SILENCIO) veredicto = 'en_silencio'
  else if (confirmar) veredicto = 'por_confirmar'
  else if (!d.ent || d.ent.total < U.VOLUMEN_MINIMO) veredicto = 'sin_volumen'
  else if (delta !== null && delta >= U.PTS_LLAMA) veredicto = 'llama'
  else if (delta !== null && delta >= U.PTS_VIGILAR) veredicto = 'vigilar'
  else veredicto = 'estable'

  const hall = hallazgos(d, !!confirmar)
  const e = ETIQUETA[veredicto]

  return {
    datos: d, via: m.via, nombreDifiere: m.nombreDifiere,
    veredicto, etiqueta: e.t, color: e.c,
    pctCerrado, delta, pctBase, confirmar, hall, diasSinLlamada,
    portada: portada(d, meta, veredicto, pctCerrado, pctBase, delta, confirmar, diasSinLlamada),
    decir: queDecir(d, meta, veredicto, pctCerrado, confirmar, hall, diasSinLlamada),
    archivoViejo: hoy ? diasEntre(meta.corte, hoy) > U.DIAS_ARCHIVO_VIEJO : false,
  }
}

function portada(
  d: LlamadasCuenta, meta: LlamadasMeta, v: VeredictoLlamadas,
  pct: number | null, base: number | null, delta: number | null,
  conf: DestinoLlamadas | null, dias: number | null,
): string {
  const mes = mesLargo(meta.mesCerrado)
  const c = d.cerrado
  if (v === 'en_silencio' && d.ultima) {
    return `Esta cuenta dejó de registrar llamadas el ${fechaCorta(d.ultima)}: ${dias} días sin una sola, ` +
           `al corte del archivo. No es un problema de atención — es una cuenta que se está apagando.`
  }
  if (conf && c) {
    return `En ${mes} quedaron sin contestar ${n(c.l)} de ${n(c.t)} llamadas entrantes, y todas entran ` +
           `a un solo destino que nunca sostuvo una conversación: «${conf.d}». La cifra se publica ` +
           `completa; la alarma queda apagada hasta que alguien confirme qué atiende ahí.`
  }
  if (v === 'sin_volumen') {
    const t = d.ent?.total ?? 0
    return `${n(t)} llamadas entrantes en toda la ventana: muy pocas para medir atención. ` +
           `Aquí la conversación es de uso, no de servicio.`
  }
  if (!c || pct === null) {
    return `Sin registro de entrantes en ${mes}. El módulo no publica porcentaje de un mes sin llamadas.`
  }
  const cab = `En ${mes} quedaron sin contestar ${n(c.l)} de ${n(c.t)} llamadas entrantes: ` +
              `${Math.round(pct)} de cada 100.`
  if (delta === null) {
    return `${cab} No alcanza base para compararlo contra sus meses previos.`
  }
  const suya = `Su propia base de ${mesCorto(meta.meses[0]).toLowerCase()} a ${mesCorto(meta.baseFin).toLowerCase()} era ${base!.toFixed(1)}%.`
  if (v === 'llama')   return `${cab} ${suya} Esta cuenta vale una de tus 4 actividades de la semana.`
  if (v === 'vigilar') return `${cab} ${suya} Todavía no es urgente: pregúntalo en la próxima llamada.`
  return `${cab} ${suya} Se mantiene en su nivel de siempre.`
}

function queDecir(
  d: LlamadasCuenta, meta: LlamadasMeta, v: VeredictoLlamadas,
  pct: number | null, conf: DestinoLlamadas | null,
  hall: Hallazgos | null, dias: number | null,
): string[] {
  const out: string[] = []
  const c = d.cerrado
  if (conf) {
    out.push(`Antes de reportar nada: preguntar qué atiende el destino «${conf.d}». ` +
             `Recibió ${n(conf.l)} llamadas de ${n(conf.n)} números distintos y ninguna quedó registrada ` +
             `como conversación. Si es un asistente virtual, esta cuenta no tiene un problema de atención.`)
  } else if (v === 'en_silencio' && d.ultima) {
    out.push(`Su última llamada fue el ${fechaCorta(d.ultima)}. Preguntar si migraron el teléfono, ` +
             `si cambiaron de operación o si hay algo que no nos han dicho.`)
  } else if (v === 'sin_volumen') {
    out.push(`El volumen es tan bajo que no se puede hablar de atención. La conversación aquí es de uso: ` +
             `qué esperaban del servicio y qué están usando en realidad.`)
  } else if (c && pct !== null && (v === 'llama' || v === 'vigilar')) {
    out.push(`En ${mesLargo(meta.mesCerrado)} quedaron sin contestar ${n(c.l)} de ${n(c.t)} llamadas ` +
             `entrantes: ${Math.round(pct)} de cada 100.`)
  }
  if (hall && !conf) {
    if (hall.peorDia) {
      out.push(`Su peor día es el ${hall.peorDia.nombre}: ${hall.peorDia.pct.toFixed(1)}% sin contestar ` +
               `sobre ${n(hall.peorDia.total)} llamadas.`)
    }
    if (hall.horas.length) {
      const peor = hall.horas.reduce((a, b) => (b.pct > a.pct ? b : a))
      out.push(`A las ${peor.h} h se cae ${peor.pct.toFixed(0)}%: ${n(peor.lost)} de ${n(peor.total)} llamadas. ` +
               `Ahí no hay quien conteste.`)
    }
  }
  const sd = d.ent?.dest.find(x => x.d === SIN_DESTINO)
  if (sd && d.ent && sd.l / d.ent.lost >= 0.5) {
    out.push(`${n(sd.l)} de las ${n(d.ent.lost)} sin contestar no llegaron a ninguna extensión. ` +
             `El archivo no dice por qué; vale revisarlo con soporte antes de culpar a nadie.`)
  }
  return out.slice(0, 3)
}

/** Serie mensual lista para la gráfica, con el mes parcial marcado. */
export function serieMensual(d: LlamadasCuenta, meta: LlamadasMeta) {
  return meta.meses.map(m => {
    const v = d.ent?.meses[m]
    const parcial = m > meta.mesCerrado
    return {
      mes: m,
      label: parcial ? `${mesCorto(m)} 1–${parseInt(meta.corte.slice(8), 10)}` : mesCorto(m),
      parcial,
      t: v?.t ?? 0, l: v?.l ?? 0, r: v?.r ?? 0, s: v?.s ?? 0, v: v?.v ?? 0,
      pct: v && v.t > 0 ? (100 * v.l) / v.t : null,
      etiquetable: !!v && v.t >= U.MES_ETIQUETA,
    }
  })
}
