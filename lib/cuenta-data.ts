/**
 * Funciones server-side para obtener tickets y facturación por cuenta.
 * Se leen los JSON directamente — sin fetch, sin API round-trip.
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
// Static import ensures tickets-data.json is included in every route's
// Vercel serverless bundle — prevents ENOENT on cold starts for routes
// that don't have their own `import rawTickets from './tickets-data.json'`
import _ticketsJson from './tickets-data.json'

/* ── Tipos ─────────────────────────────────────────────────────────── */
export interface TicketRow {
  cid: string; num: string; empresa: string; fecha: string
  ticket_id: string; categoria: string; subcategoria: string
  es_falla: string; producto: string; enlace: string
  propietario: string; apertura: string; cierre: string
  duracion: string; prioridad: string
}

export interface FactRow {
  CID: string
  'Nombre del Cliente': string
  'Fecha de corte': string
  Periodo: string
  'Nombre del Plan': string
  'Monto del plan': number | null
  '% Consumo': number | null
  'Toggle Status': number | null
  'Minutos Incluidos': number | null
  'Minutos Consumidos': number | null
  'Clasificación de empresa': string
}

/* ── Caches ────────────────────────────────────────────────────────── */
let _tickets: TicketRow[] | null = null
let _fact: FactRow[] | null = null

function getTickets(): TicketRow[] {
  if (_tickets) return _tickets
  _tickets = _ticketsJson as unknown as TicketRow[]
  return _tickets!
}

function getFact(): FactRow[] {
  if (_fact) return _fact
  const p = join(process.cwd(), 'lib', 'facturacion-data.json')
  if (!existsSync(p)) { _fact = []; return [] }
  _fact = JSON.parse(readFileSync(p, 'utf-8'))
  return _fact!
}

/* ── Normalize ───────────────────────────────────────────────────────
   IDÉNTICA a la de lib/tickets-cuenta.ts, a propósito: si las dos difieren
   —aunque sea en un doble espacio— la ficha de la cuenta y la lista de
   /cuentas vuelven a contradecirse, que es justo el defecto que se arregló.
   El rango va escapado (̀-ͯ) para que se lea qué hace. */
function norm(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Orden de tickets: del mas reciente al mas antiguo.
 *
 * Antes se ordenaba por `fecha`, que es el MES ("2026-07"), no la fecha
 * completa: dentro de un mismo mes el orden quedaba al azar y la ficha
 * mostraba un ticket del 30 de junio antes que uno del 13 de julio.
 * `apertura` trae el timestamp ISO completo y esta poblado en los 4,987
 * registros; `fecha` queda solo como respaldo.
 */
function ordenRecientePrimero(a: TicketRow, b: TicketRow): number {
  const fa = a.apertura || a.fecha || ''
  const fb = b.apertura || b.fecha || ''
  return fb.localeCompare(fa)
}

/* ══════════════════════════════════════════════════════════════════════
   TICKETS por cuenta
══════════════════════════════════════════════════════════════════════ */
/**
 * Tickets de una cuenta. Tres arreglos de fondo (24 Sep 2026):
 *
 * 1) EL TOTAL SE CUENTA ANTES DE CORTAR. `.slice(0, limit)` se aplicaba ANTES
 *    de `total: rows.length`, así que el total nunca podía pasar de 20: D1
 *    GRUPO TORRES CORZO tiene 183 tickets y su ficha decía 20; C26 GRUPO 2711
 *    tiene 53 y decía 20. Peor: /cuentas usaba el OTRO contador y la MISMA
 *    cuenta mostraba 53 en la lista y 20 en su ficha.
 *
 * 2) EL NOMBRE SE COMPARA EXACTO, NO CON `includes`. El CID 134907 tiene
 *    empresa '-', que al normalizar queda cadena vacía, y
 *    `cualquierNombre.includes('')` es SIEMPRE true: sus 2 tickets —uno de
 *    ellos «Falla Carrier (voz)»— se le colgaban a 36 cuentas distintas, que
 *    aparecían todas con «1 falla» que no era suya.
 *
 * 3) FUERA EL TERCER PASO DIFUSO. Buscar por la primera palabra le daba a
 *    «Grupo Petroil y Cías» los tickets de GRUPO SERVEX. Ahora esta función y
 *    `ticketStatsCuenta` usan LA MISMA regla, así que la ficha y la lista de
 *    cuentas ya no pueden contradecirse: antes 44 de 222 daban cifras
 *    distintas según la pantalla.
 *
 * `comoCruzo: 'ninguno'` NO significa «no tiene tickets»: significa que no se
 * pudo cruzar. La cuenta puede operar con otro CID.
 */
export function getTicketsByCuenta(
  cid: string | null,
  empresa: string,
  limit = 20,
): { rows: TicketRow[]; total: number; matchedBy: string; comoCruzo: 'cid' | 'nombre' | 'ninguno' } {
  const all = getTickets()

  // 1) Exacto por CID
  if (cid && cid.trim()) {
    const trimCid = cid.trim()
    const todos = all.filter(t => (t.cid ?? '').trim() === trimCid).sort(ordenRecientePrimero)
    if (todos.length > 0)
      return { rows: todos.slice(0, limit), total: todos.length, matchedBy: `CID ${trimCid}`, comoCruzo: 'cid' }
  }

  // 2) Nombre normalizado EXACTO. El `if (normEmp)` es el candado: sin él, una
  //    cuenta con nombre vacío se llevaría medio dataset.
  const normEmp = norm(empresa)
  if (normEmp) {
    const todos = all.filter(t => norm(t.empresa) === normEmp).sort(ordenRecientePrimero)
    if (todos.length > 0)
      return { rows: todos.slice(0, limit), total: todos.length, matchedBy: empresa, comoCruzo: 'nombre' }
  }

  return { rows: [], total: 0, matchedBy: '', comoCruzo: 'ninguno' }
}

/* ══════════════════════════════════════════════════════════════════════
   FACTURACIÓN por cuenta
══════════════════════════════════════════════════════════════════════ */
export function getFacturacionByCuenta(
  cid: string | null,
  empresa: string,
  limit = 18,
): { rows: FactRow[]; matchedBy: string } {
  const all = getFact()

  // 1) Exacto por CID
  if (cid) {
    const trimCid = cid.trim()
    const rows = all.filter(r => (r.CID ?? '').trim() === trimCid)
      .sort((a, b) => (b['Fecha de corte'] ?? '').localeCompare(a['Fecha de corte'] ?? ''))
      .slice(0, limit)
    if (rows.length > 0)
      return { rows, matchedBy: `CID ${trimCid}` }
  }

  // 2) Nombre normalizado completo
  const normEmp = norm(empresa)
  const byName = all.filter(r => {
    const cn = norm(r['Nombre del Cliente'] ?? '')
    return cn.includes(normEmp) || normEmp.includes(cn.split(' ')[0])
  }).sort((a, b) => (b['Fecha de corte'] ?? '').localeCompare(a['Fecha de corte'] ?? ''))
    .slice(0, limit)
  if (byName.length > 0)
    return { rows: byName, matchedBy: empresa }

  // 3) Primera palabra significativa
  const words = normEmp.split(/\s+/).filter(w => w.length >= 4)
  if (words.length > 0) {
    const byWord = all.filter(r => norm(r['Nombre del Cliente'] ?? '').includes(words[0]))
      .sort((a, b) => (b['Fecha de corte'] ?? '').localeCompare(a['Fecha de corte'] ?? ''))
      .slice(0, limit)
    if (byWord.length > 0)
      return { rows: byWord, matchedBy: `"${words[0]}"` }
  }

  return { rows: [], matchedBy: '' }
}
