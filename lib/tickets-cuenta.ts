/**
 * Estadísticas de tickets POR CUENTA, calculadas siempre del dataset vivo
 * (lib/tickets-data.json vía lib/tickets-norm.ts) — nunca de columnas
 * guardadas en la tabla `cuentas`.
 *
 * REGLA BÁSICA (dirección, 30 Ago 2026): cuando se actualizan los apartados
 * de Tickets o Cortes, la sección de cuentas debe reflejarlo en automático.
 * La columna `cuentas.tickets_abiertos` violaba esa regla: nadie la
 * sincronizaba (solo se sembraba en 0 al crear la cuenta). Este módulo es la
 * única fuente para esas métricas; el campo de la tabla queda obsoleto.
 *
 * ───────────────────────────────────────────────────────────────────────
 * DOS ARREGLOS DE FONDO (24 Sep 2026)
 * ───────────────────────────────────────────────────────────────────────
 *
 * 1) «ABIERTOS» NO ES CERO: ES NO MEDIBLE.
 *    El export de Zoho solo trae tickets CERRADOS — 2 de 5,871 filas sin
 *    fecha de cierre. Así que `abiertos` valía 0 en 221 de las 222 cuentas
 *    mientras la mesa de ayuda tenía 139 abiertos, 140 en espera y 11 fuera
 *    de SLA. El tablero no calculaba mal: el dato NO EXISTE en la fuente, y
 *    el código lo colapsaba a 0 en vez de declararlo ausente.
 *
 *    Eso llegaba hasta el dossier que lee la IA, que afirmaba «0 abiertos»
 *    de GRUPO 2711 mientras su folio #114229 llevaba 21 días fuera de SLA, y
 *    de GRUPO TORRES CORZO con el #106428 en 144 días.
 *
 *    Un cero sin medición no es un cero. Ahora `abiertos` es `number | null`
 *    y `abiertosMedible` dice si se puede afirmar algo. El presente vive en
 *    `lib/mesa-ayuda.ts`, y `lib/soporte-cuenta.ts` junta las dos mitades.
 *
 * 2) FUERA EL CRUCE DIFUSO.
 *    El fallback de «primera palabra» le colgaba a 38 de las 222 cuentas los
 *    tickets de OTRA empresa: 247 tickets y 10 fallas mal atribuidos, y
 *    contados varias veces. Casos medidos: «Dental Bueno» mostraba los 52 de
 *    INVERDENTAL ('inverdental' contiene 'dental'); ECODELI y GVA-República
 *    Dominicana, los 23 de LI FINANCIERA cada una (basta que 'li' esté dentro
 *    de 'ecodeli'); Grupo Petroil, Grupo Garmo, GRUPO CENSERE y Grupo System
 *    ooapas, los mismos 9 de GRUPO SERVEX por empezar todas con 'grupo'; y 13
 *    cuentas más adoptaban la empresa interna «A reservar», cuya primera
 *    palabra es la letra 'a'.
 *
 *    Se cruza por CID, y si no, por nombre normalizado EXACTO. Nada más.
 *    `matchedBy` dice cuál de los dos fue, para que la pantalla lo diga.
 *    Cero por no cruzar y cero por no tener tickets son cosas distintas.
 */
import { TICKETS, ABIERTOS_MEDIBLE, TICKETS_SIN_CIERRE, COBERTURA, type Ticket } from './tickets-norm'

export type ComoCruzo = 'cid' | 'nombre' | 'ninguno'

export interface TicketStatsCuenta {
  total:    number
  fallas:   number
  /** Fallas por CATEGORÍA de la mesa (superconjunto de la bandera: 344 vs 273). */
  fallasCategoria: number
  /**
   * Tickets sin fecha de cierre en el export.
   * `null` cuando el export no permite medirlo — que es el caso hoy.
   * NUNCA imprimir esto como «0 abiertos» sin consultar `abiertosMedible`.
   */
  abiertos: number | null
  abiertosMedible: boolean
  /** Fecha REAL del último ticket (apertura, hora de México). Antes era el mes
   *  de cierre, así que dos cuentas muy distintas se veían idénticas: «2026-09». */
  ultima:   string | null
  /** El mes de cierre más reciente, que es lo que el campo viejo devolvía. */
  ultimoMesCierre: string | null
  comoCruzo: ComoCruzo
}

const VACIO: TicketStatsCuenta = {
  total: 0, fallas: 0, fallasCategoria: 0,
  abiertos: ABIERTOS_MEDIBLE ? 0 : null,
  abiertosMedible: ABIERTOS_MEDIBLE,
  ultima: null, ultimoMesCierre: null, comoCruzo: 'ninguno',
}

function norm(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

interface Acum {
  total: number; fallas: number; fallasCategoria: number
  sinCierre: number; ultima: string; ultimoMesCierre: string
}

const _byCid  = new Map<string, Acum>()
const _byName = new Map<string, Acum>()

function acumular(mapa: Map<string, Acum>, k: string, t: Ticket) {
  let s = mapa.get(k)
  if (!s) {
    s = { total: 0, fallas: 0, fallasCategoria: 0, sinCierre: 0, ultima: '', ultimoMesCierre: '' }
    mapa.set(k, s)
  }
  s.total++
  if (t.esFallaBandera)   s.fallas++
  if (t.esFallaCategoria) s.fallasCategoria++
  if (t.abierto)          s.sinCierre++
  if (t.aperturaMx > s.ultima)          s.ultima = t.aperturaMx
  if (t.mesCierre > s.ultimoMesCierre)  s.ultimoMesCierre = t.mesCierre
}

for (const t of TICKETS) {
  const cid = (t.cid ?? '').trim()
  if (cid) acumular(_byCid, cid, t)
  // El nombre vacío o '-' NO indexa: el CID 134907 tiene empresa '-', que al
  // normalizar queda cadena vacía, y con `includes('')` sus 2 tickets (uno de
  // ellos una falla) se le colgaban a 36 cuentas distintas.
  const n = norm(t.empresa)
  if (n) acumular(_byName, n, t)
}

function aStats(a: Acum, comoCruzo: ComoCruzo): TicketStatsCuenta {
  return {
    total:  a.total,
    fallas: a.fallas,
    fallasCategoria: a.fallasCategoria,
    abiertos: ABIERTOS_MEDIBLE ? a.sinCierre : null,
    abiertosMedible: ABIERTOS_MEDIBLE,
    ultima: a.ultima || null,
    ultimoMesCierre: a.ultimoMesCierre || null,
    comoCruzo,
  }
}

/**
 * Stats de la cuenta. Exacto por CID; si no, por nombre normalizado exacto.
 *
 * NO hay tercera oportunidad difusa, a propósito. Si esto devuelve 0 con
 * `comoCruzo: 'ninguno'`, lo honesto es decir «no se cruzó», no «no tiene
 * tickets»: puede que la cuenta opere con otro CID, como Grupo Petroil, cuyos
 * 32 tickets reales viven bajo cuatro CIDs que su ficha no declara.
 */
export function ticketStatsCuenta(cid: string | null | undefined, empresa: string): TicketStatsCuenta {
  const c = (cid ?? '').trim()
  if (c) {
    const porCid = _byCid.get(c)
    if (porCid) return aStats(porCid, 'cid')
  }
  const n = norm(empresa)
  if (n) {
    const porNombre = _byName.get(n)
    if (porNombre) return aStats(porNombre, 'nombre')
  }
  return VACIO
}

/** Para que las pantallas expliquen el hueco con las mismas palabras. */
export const TICKETS_META = {
  abiertosMedible: ABIERTOS_MEDIBLE,
  sinCierre: TICKETS_SIN_CIERRE,
  total: COBERTURA.total,
  desde: COBERTURA.desde,
  hasta: COBERTURA.hasta,
}
