/**
 * lib/tickets-norm.ts — la capa donde el export de Zoho se vuelve dato fiable.
 *
 * POR QUÉ EXISTE
 * --------------
 * `lib/tickets-data.json` es un espejo crudo del Excel de Zoho Desk, y el crudo
 * miente de seis maneras distintas. Cada pantalla que lo leía directo repetía
 * los mismos seis errores con su propia variante. Esto los arregla UNA vez:
 *
 *   1. El eje temporal medía CIERRES. `fecha` y `mes` salen de la columna FECHA
 *      del export, que es el mes de cierre: coincide con `cierre` en 5,838 de
 *      5,871 filas y con `apertura` en solo 5,020. 851 tickets se graficaban en
 *      un mes distinto de aquel en que entraron. Aquí van los dos, con nombre:
 *      `mesApertura` y `mesCierre`.
 *
 *   2. Las fechas se comparaban en UTC. Las 5,871 aperturas traen sufijo Z, y
 *      los filtros cortaban con `apertura.slice(0,10)` — texto UTC — contra un
 *      rango construido en hora de México. 626 tickets (10.7%) caen en otro día
 *      y 24 en otro MES. Todo lo levantado después de las 18:00 se le contaba
 *      al día siguiente. Aquí se ancla a México con Intl, como manda
 *      `lib/fecha-local.ts`.
 *
 *   3. 242 tickets sin prioridad se pintaban «Low» y 182 con el valor 'normal'
 *      no los alcanzaba ningún filtro: 424 tickets (7.2%) invisibles desde la
 *      UI y una barra «Low» que declaraba 4,389 cuando los Low reales son
 *      4,147. `prioridadNorm` les da su propio cajón. 'Normal' NO se traduce a
 *      Medium: no sé que sean lo mismo, y adivinarlo es inventar.
 *
 *   4. 'Sin categoría' (160) y 'Sin categoria' (24) se dibujaban como dos
 *      barras separadas del mismo hueco. Y la categoría mezclaba tipo con
 *      canal: 'Asistencia (voz)' es dos datos en una cadena. Se parten en
 *      `tipo` y `canal`.
 *
 *   5. 37 cadenas de propietario para 18 personas: 'Mario H.' (648) y 'Mario
 *      Hernández' (6) eran dos barras. Filtrar por una perdía los de la otra.
 *      OJO al fundirlas: 'José Antonio R.' y 'José Manuel L.' son DOS personas,
 *      así que la clave es nombre + inicial del apellido, nunca el nombre solo.
 *      Igual que Dan D. y Daniel M., que también son dos.
 *
 *   6. El CID 1 (Callpicker, Digitum, Callpicker pruebas — 175 tickets) era el
 *      SEGUNDO emisor de todo el archivo, por encima de cualquier cliente real,
 *      y el CID 0 ('sin cuenta', 65) figuraba como dos empresas. Verificado
 *      contra Supabase: ninguno de los dos existe en la cartera. Se marcan
 *      `interno` y se cuentan aparte, sin borrarlos.
 *
 * LO QUE ESTA CAPA NO PUEDE ARREGLAR, y por eso lo declara en vez de taparlo:
 * el export SOLO trae tickets cerrados (2 de 5,871 sin fecha de cierre), así
 * que «abiertos» no es cero — es NO MEDIBLE. `ABIERTOS_MEDIBLE` lo calcula de
 * los propios datos en vez de darlo por supuesto. El presente vive en
 * `lib/mesa-ayuda.ts`.
 */
import raw from './tickets-data.json'

/* ── La fila cruda, tal como sale del generador ───────────────────── */
export interface TicketRaw {
  cid:          string
  num:          string
  empresa:      string
  fecha:        string
  ticket_id:    string
  categoria:    string
  subcategoria: string
  es_falla:     string
  producto:     string
  enlace:       string
  propietario:  string
  apertura:     string
  cierre:       string
  duracion:     string
  duracion_hrs: number | null
  prioridad:    string
  mes:          string
}

/* ── La fila ya interpretable ─────────────────────────────────────── */
export interface Ticket extends TicketRaw {
  /** Día de APERTURA en hora de México ('AAAA-MM-DD'). Lo que filtra la UI. */
  diaMx:            string
  /** Mes de APERTURA en hora de México. Cuándo ENTRÓ el problema. */
  mesApertura:      string
  /** Mes de CIERRE — lo que el campo `fecha` traía sin decirlo. */
  mesCierre:        string
  /** Sello de apertura en México, para ordenar y mostrar. */
  aperturaMx:       string
  /** 'Asistencia' | 'Administrativo' | 'Activación' | 'Falla' | 'Capacitación' | 'Sin clasificar' */
  tipo:             string
  /** 'Voz' | 'Chat' | 'Sin canal' */
  canal:            string
  /** Categoría con el acento unificado (une 'Sin categoria' con 'Sin categoría'). */
  categoriaNorm:    string
  subcategoriaNorm: string
  /** 'Urgent' | 'High' | 'Medium' | 'Normal' | 'Low' | 'Sin prioridad' */
  prioridadNorm:    string
  /** Nombre completo de la persona, fundidas sus variantes. */
  propietarioNorm:  string
  /** 'Callpicker Activaciones' es una cola, no una persona. */
  propietarioEsCola: boolean
  /** Nombre canónico del CID (el más frecuente), para que un cliente no salga partido. */
  empresaCanon:     string
  /** CID 0 y 1: tráfico interno y de pruebas. No son clientes de la cartera. */
  interno:          boolean
  /** Sin fecha de cierre en el export. Ver ABIERTOS_MEDIBLE antes de creerle. */
  abierto:          boolean
  /** La bandera ES_FALLA del export. 273 tickets. */
  esFallaBandera:   boolean
  /** La categoría capturada por la mesa. 344 tickets, superconjunto de la bandera. */
  esFallaCategoria: boolean
}

/* ══════════════════════════════════════════════════════════════════
   Utilidades
══════════════════════════════════════════════════════════════════ */
function sinAcentos(s: string): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function clave(s: string): string {
  return sinAcentos(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

/* ── Hora de México ────────────────────────────────────────────────
   Con Intl y no restando seis horas a mano: hoy México va en UTC-6 todo
   el año, pero eso es una POLÍTICA, no una ley física. Si vuelve el
   horario de verano, esto sigue bien y una resta fija no. */
const FMT_MX = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
})

function enMexico(iso: string): { dia: string; sello: string } {
  if (!iso) return { dia: '', sello: '' }
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { dia: '', sello: '' }
  const p: Record<string, string> = {}
  for (const parte of FMT_MX.formatToParts(d)) {
    if (parte.type !== 'literal') p[parte.type] = parte.value
  }
  const hora = String(Number(p.hour) % 24).padStart(2, '0')
  const dia = `${p.year}-${p.month}-${p.day}`
  return { dia, sello: `${dia} ${hora}:${p.minute}` }
}

/* ── Prioridad ─────────────────────────────────────────────────────
   Los seis valores que existen de verdad en el archivo. 'Normal' se queda
   como 'Normal': Zoho lo usa en 182 tickets y NO consta que sea Medium. */
export const PRIORIDADES = ['Urgent', 'High', 'Medium', 'Normal', 'Low', 'Sin prioridad'] as const

export const ORDEN_PRIORIDAD: Record<string, number> = {
  Urgent: 0, High: 1, Medium: 2, Normal: 3, Low: 4, 'Sin prioridad': 5,
}

export const ETIQUETA_PRIORIDAD: Record<string, string> = {
  Urgent: 'Urgente', High: 'Alta', Medium: 'Media',
  Normal: 'Normal', Low: 'Baja', 'Sin prioridad': 'Sin prioridad',
}

function normPrioridad(p: string): string {
  const k = clave(p)
  if (!k) return 'Sin prioridad'
  if (k === 'urgent')  return 'Urgent'
  if (k === 'high')    return 'High'
  if (k === 'medium')  return 'Medium'
  if (k === 'normal')  return 'Normal'
  if (k === 'low')     return 'Low'
  return 'Sin prioridad'
}

/* ── Categoría: tipo + canal ───────────────────────────────────────
   'Asistencia (voz)' son dos datos metidos en una cadena. Separarlos deja
   5 tipos legibles en vez de 12 cadenas, y el canal se puede cruzar. */
const TIPOS = ['Asistencia', 'Administrativo', 'Activación', 'Falla', 'Capacitación']

function partirCategoria(categoria: string, producto: string): {
  tipo: string; canal: string; norm: string
} {
  const k = clave(categoria)
  let canal = 'Sin canal'
  if (k.includes('chat')) canal = 'Chat'
  else if (k.includes('voz')) canal = 'Voz'
  else {
    const kp = clave(producto)
    if (kp.includes('chat')) canal = 'Chat'
    else if (kp.includes('voz')) canal = 'Voz'
  }

  let tipo = 'Sin clasificar'
  for (const t of TIPOS) {
    if (k.startsWith(clave(t))) { tipo = t; break }
  }
  // 'Sin categoría' y 'Sin categoria' caen aquí juntos, que es el punto.
  const norm = tipo === 'Sin clasificar'
    ? 'Sin categoría'
    : (canal === 'Sin canal' ? tipo : `${tipo} (${canal.toLowerCase()})`)
  return { tipo, canal, norm }
}

function normSubcategoria(s: string): string {
  const k = clave(s)
  if (!k || k === 'sin subcategoria') return 'Sin subcategoría'
  return (s ?? '').trim()
}

/* ══════════════════════════════════════════════════════════════════
   Propietarios: 37 cadenas -> 18 personas + 1 cola

   La clave es NOMBRE + INICIAL DEL APELLIDO, nunca el nombre solo:
   'José Antonio R.' y 'José Manuel L.' son dos personas, y con el nombre
   solo se fundirían. Igual Dan D. (431 tickets) y Daniel M. (22).

   Segunda pasada: las variantes de un solo token ('Alma', 'Alexis',
   'Paola', 'Roberto .') se adoptan SOLO si hay exactamente un grupo que
   empiece con ese nombre. Si hubiera dos, se quedan aparte — prefiero una
   barra de más que atribuirle a alguien el trabajo de otro.
══════════════════════════════════════════════════════════════════ */
function clavePropietario(p: string): string {
  const k = clave(p)
  if (!k) return ''
  const t = k.split(' ').filter(Boolean)
  if (t.length === 0) return ''
  return t.length > 1 ? `${t[0]} ${t[1][0]}` : t[0]
}

interface GrupoProp { variantes: Map<string, number>; total: number }

function construirPropietarios(filas: TicketRaw[]): Map<string, string> {
  const grupos = new Map<string, GrupoProp>()
  for (const t of filas) {
    const p = (t.propietario ?? '').trim()
    if (!p) continue
    const k = clavePropietario(p)
    if (!k) continue
    if (!grupos.has(k)) grupos.set(k, { variantes: new Map(), total: 0 })
    const g = grupos.get(k)!
    g.variantes.set(p, (g.variantes.get(p) ?? 0) + 1)
    g.total++
  }

  // Segunda pasada: adoptar los nombres sueltos.
  const claves = Array.from(grupos.keys())
  const redirige = new Map<string, string>()
  for (const k of claves) {
    if (k.includes(' ')) continue
    const candidatos = claves.filter(o => o !== k && o.startsWith(`${k} `))
    if (candidatos.length === 1) redirige.set(k, candidatos[0])
  }
  for (const [desde, hacia] of Array.from(redirige.entries())) {
    const g = grupos.get(desde)
    const d = grupos.get(hacia)
    if (!g || !d) continue
    for (const [v, n] of Array.from(g.variantes.entries())) {
      d.variantes.set(v, (d.variantes.get(v) ?? 0) + n)
    }
    d.total += g.total
    grupos.delete(desde)
  }

  // Nombre a mostrar: la variante más larga (el nombre completo por encima
  // de la abreviatura); a igual largo, la más frecuente.
  const canon = new Map<string, string>()
  for (const [k, g] of Array.from(grupos.entries())) {
    let mejor = ''
    let mejorN = -1
    for (const [v, n] of Array.from(g.variantes.entries())) {
      if (v.length > mejor.length || (v.length === mejor.length && n > mejorN)) {
        mejor = v; mejorN = n
      }
    }
    canon.set(k, mejor)
  }
  // Las variantes adoptadas ya viven dentro del grupo destino, así que este
  // recorrido las alcanza a todas.
  const mapa = new Map<string, string>()
  for (const [k, g] of Array.from(grupos.entries())) {
    for (const v of Array.from(g.variantes.keys())) mapa.set(v, canon.get(k) ?? v)
  }
  return mapa
}

/* ══════════════════════════════════════════════════════════════════
   Internos: CID 0 y CID 1

   Comprobado contra Supabase el 24-sep-2026: ninguno de los dos existe en
   la cartera de 222 cuentas, y no hay ninguna cuenta que se llame Digitum
   ni Callpicker. Son tráfico interno y de pruebas. No se borran — se
   marcan, se cuentan aparte y se dicen.
══════════════════════════════════════════════════════════════════ */
export const CIDS_INTERNOS: Record<string, string> = {
  '1': 'Callpicker / Digitum (interno)',
  '0': 'Sin cuenta',
}

/* ══════════════════════════════════════════════════════════════════
   Construcción
══════════════════════════════════════════════════════════════════ */
const FILAS = raw as unknown as TicketRaw[]

const MAPA_PROP = construirPropietarios(FILAS)

/** Nombre canónico por CID: el más frecuente. Evita que un cliente salga
 *  partido en dos renglones (CID 306 era 'KW - City', 'City HUB' y 'City'). */
const MAPA_EMPRESA = (() => {
  const porCid = new Map<string, Map<string, number>>()
  for (const t of FILAS) {
    const cid = (t.cid ?? '').trim()
    const emp = (t.empresa ?? '').trim()
    if (!cid || !emp) continue
    if (!porCid.has(cid)) porCid.set(cid, new Map())
    const m = porCid.get(cid)!
    m.set(emp, (m.get(emp) ?? 0) + 1)
  }
  const out = new Map<string, string>()
  for (const [cid, m] of Array.from(porCid.entries())) {
    if (CIDS_INTERNOS[cid]) { out.set(cid, CIDS_INTERNOS[cid]); continue }
    let mejor = ''
    let mejorN = -1
    for (const [nombre, n] of Array.from(m.entries())) {
      if (n > mejorN || (n === mejorN && nombre.length > mejor.length)) { mejor = nombre; mejorN = n }
    }
    out.set(cid, mejor)
  }
  return out
})()

export const TICKETS: Ticket[] = FILAS.map(t => {
  const cid = (t.cid ?? '').trim()
  const ap = enMexico(t.apertura ?? '')
  const cat = partirCategoria(t.categoria ?? '', t.producto ?? '')
  const propCrudo = (t.propietario ?? '').trim()
  const prop = propCrudo ? (MAPA_PROP.get(propCrudo) ?? propCrudo) : ''
  return {
    ...t,
    diaMx:            ap.dia,
    mesApertura:      ap.dia ? ap.dia.slice(0, 7) : '',
    mesCierre:        (t.fecha ?? '').slice(0, 7),
    aperturaMx:       ap.sello,
    tipo:             cat.tipo,
    canal:            cat.canal,
    categoriaNorm:    cat.norm,
    subcategoriaNorm: normSubcategoria(t.subcategoria ?? ''),
    prioridadNorm:    normPrioridad(t.prioridad ?? ''),
    propietarioNorm:  prop,
    propietarioEsCola: clave(prop).startsWith('callpicker'),
    empresaCanon:     MAPA_EMPRESA.get(cid) ?? (t.empresa ?? '').trim(),
    interno:          Boolean(CIDS_INTERNOS[cid]),
    abierto:          !String(t.cierre ?? '').trim(),
    esFallaBandera:   t.es_falla === 'Si',
    esFallaCategoria: cat.tipo === 'Falla',
  }
})

/* ══════════════════════════════════════════════════════════════════
   ¿Se puede medir «abiertos» con este archivo?

   NO se da por supuesto: se mide. Si prácticamente ninguna fila viene sin
   cierre, el export está filtrado a cerrados y «0 abiertos» no es un cero,
   es una ausencia de medición. La regla de la casa: un cero sin medición
   no es un cero.
══════════════════════════════════════════════════════════════════ */
const SIN_CIERRE = TICKETS.filter(t => t.abierto).length

/** Umbral: por debajo del 1% de filas sin cierre, el export es de cerrados. */
export const ABIERTOS_MEDIBLE = TICKETS.length > 0 && SIN_CIERRE / TICKETS.length >= 0.01

export const TICKETS_SIN_CIERRE = SIN_CIERRE

/* ══════════════════════════════════════════════════════════════════
   Cobertura real del archivo — calculada, nunca escrita a mano.
   El rótulo «Feb–Ago 2026» llevaba un mes desfasado y ocultaba 842
   tickets de septiembre en el contexto que recibe Atlas.
══════════════════════════════════════════════════════════════════ */
function rango(vals: string[]): { min: string; max: string } {
  let min = ''
  let max = ''
  for (const v of vals) {
    if (!v) continue
    if (!min || v < min) min = v
    if (!max || v > max) max = v
  }
  return { min, max }
}

const R_AP = rango(TICKETS.map(t => t.aperturaMx))
const R_CI = rango(TICKETS.map(t => t.mesCierre))

export const COBERTURA = {
  total:            TICKETS.length,
  internos:         TICKETS.filter(t => t.interno).length,
  deClientes:       TICKETS.filter(t => !t.interno).length,
  /** Primera y última APERTURA, en hora de México, con día y hora. */
  desde:            R_AP.min,
  hasta:            R_AP.max,
  primerMes:        R_AP.min ? R_AP.min.slice(0, 7) : '',
  ultimoMes:        R_AP.max ? R_AP.max.slice(0, 7) : '',
  primerMesCierre:  R_CI.min,
  ultimoMesCierre:  R_CI.max,
  mesesApertura:    Array.from(new Set(TICKETS.map(t => t.mesApertura).filter(Boolean))).sort(),
  mesesCierre:      Array.from(new Set(TICKETS.map(t => t.mesCierre).filter(Boolean))).sort(),
  sinCierre:        SIN_CIERRE,
  abiertosMedible:  ABIERTOS_MEDIBLE,
  /** CIDs distintos de verdad. El conteo viejo usaba pares `cid|empresa` y
   *  devolvía 1,563 «empresas únicas» para 1,531 CIDs: 32 de más, y las de
   *  más eran justo los errores de captura, así que el KPI premiaba la
   *  suciedad del dato. */
  cidsDistintos:    new Set(TICKETS.map(t => (t.cid ?? '').trim()).filter(Boolean)).size,
  fallasBandera:    TICKETS.filter(t => t.esFallaBandera).length,
  fallasCategoria:  TICKETS.filter(t => t.esFallaCategoria).length,
}

/** La frase que va en pantalla y en el contexto de la IA. Una sola versión. */
export const NOTA_SOLO_CERRADOS =
  'El export de Zoho solo trae tickets CERRADOS (' + String(SIN_CIERRE) + ' de ' +
  String(TICKETS.length) + ' filas sin fecha de cierre), así que este módulo ' +
  'cuenta historia y no ve el presente. Los tickets vivos están en el corte ' +
  'diario de la mesa de ayuda.'

/* ══════════════════════════════════════════════════════════════════
   Clientes para el combo del Explorador — UNA fila por CID.

   Antes la clave era `cid|empresa`, así que salían 1,563 renglones para
   1,531 CIDs: el mismo cliente partido en dos, con el conteo repartido, y
   el filtro (que compara SOLO el CID) devolvía otra cosa distinta de la
   que prometía el renglón. Ahora la promesa y la entrega son el mismo
   número.
══════════════════════════════════════════════════════════════════ */
export interface ClienteCombo {
  cid:      string
  empresa:  string
  total:    number
  /** Otros nombres con los que la mesa capturó este mismo CID. */
  alias:    string[]
  interno:  boolean
}

export const CLIENTES: ClienteCombo[] = (() => {
  const m = new Map<string, { total: number; nombres: Map<string, number> }>()
  for (const t of TICKETS) {
    const cid = (t.cid ?? '').trim()
    if (!cid) continue
    if (!m.has(cid)) m.set(cid, { total: 0, nombres: new Map() })
    const e = m.get(cid)!
    e.total++
    const emp = (t.empresa ?? '').trim()
    if (emp) e.nombres.set(emp, (e.nombres.get(emp) ?? 0) + 1)
  }
  const out: ClienteCombo[] = []
  for (const [cid, e] of Array.from(m.entries())) {
    const canon = MAPA_EMPRESA.get(cid) ?? ''
    const alias = Array.from(e.nombres.keys()).filter(n => n !== canon).sort()
    out.push({ cid, empresa: canon || `CID ${cid}`, total: e.total, alias, interno: Boolean(CIDS_INTERNOS[cid]) })
  }
  return out.sort((a, b) => a.empresa.localeCompare(b.empresa, 'es'))
})()

/* ══════════════════════════════════════════════════════════════════
   Estadísticos de duración

   La media es 144.9 h y la mediana 29.2: cinco veces. La arrastran 222
   tickets de más de 30 días y un folio cerrado 265 días después. Publicar
   solo la media dice que el ticket típico tarda seis días, y no.

   Además es tiempo de RELOJ: incluye noches y fines de semana. La columna
   TIEMPO TRABAJADO del Excel no se lee, así que esto no es «tiempo de
   resolución», es cuánto tardó el folio en cerrarse.
══════════════════════════════════════════════════════════════════ */
export interface ResumenDuracion {
  n: number; sinDato: number
  media: number; mediana: number; p90: number; p99: number; max: number
}

export function resumenDuracion(filas: Ticket[]): ResumenDuracion {
  const d = filas.map(t => t.duracion_hrs).filter((h): h is number => typeof h === 'number').sort((a, b) => a - b)
  const sinDato = filas.length - d.length
  if (d.length === 0) return { n: 0, sinDato, media: 0, mediana: 0, p90: 0, p99: 0, max: 0 }
  const r1 = (x: number) => Math.round(x * 10) / 10
  const pct = (p: number) => d[Math.min(d.length - 1, Math.floor(d.length * p))]
  return {
    n: d.length, sinDato,
    media:   r1(d.reduce((s, x) => s + x, 0) / d.length),
    mediana: r1(d[Math.floor(d.length / 2)]),
    p90:     r1(pct(0.9)),
    p99:     r1(pct(0.99)),
    max:     r1(d[d.length - 1]),
  }
}

/* ══════════════════════════════════════════════════════════════════
   Top-N que CIERRA

   Un top-20 que tira el 82.8% de los tickets sin decirlo miente sin
   mentir. Esto devuelve siempre el cubo «otros» y el total, para que la
   suma de lo que se ve sea igual al universo. Es la misma regla que ya
   costó el incidente de la tabla de destinos de llamadas.
══════════════════════════════════════════════════════════════════ */
export interface TopConCierre<T> {
  top: T[]
  otros: { grupos: number; total: number; fallas: number } | null
  universo: number
  gruposTotales: number
}

export function topQueCierra<T extends { total: number; fallas: number }>(
  filas: T[], n: number,
): TopConCierre<T> {
  const orden = filas.slice().sort((a, b) => b.total - a.total)
  const top = orden.slice(0, n)
  const resto = orden.slice(n)
  const universo = orden.reduce((s, x) => s + x.total, 0)
  const otros = resto.length > 0
    ? {
        grupos: resto.length,
        total:  resto.reduce((s, x) => s + x.total, 0),
        fallas: resto.reduce((s, x) => s + x.fallas, 0),
      }
    : null
  // Cierre: lo que se muestra más lo agrupado tiene que ser el universo.
  const suma = top.reduce((s, x) => s + x.total, 0) + (otros?.total ?? 0)
  if (suma !== universo) {
    throw new Error(`topQueCierra no cierra: ${suma} != ${universo}`)
  }
  return { top, otros, universo, gruposTotales: orden.length }
}
