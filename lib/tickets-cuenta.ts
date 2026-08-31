/**
 * Estadísticas de tickets POR CUENTA, calculadas siempre del dataset vivo
 * (lib/tickets-data.json) — nunca de columnas guardadas en la tabla `cuentas`.
 *
 * REGLA BÁSICA (dirección, 30 Ago 2026): cuando se actualizan los apartados
 * de Tickets o Cortes, la sección de cuentas debe reflejarlo en automático.
 * La columna `cuentas.tickets_abiertos` violaba esa regla: nadie la
 * sincronizaba (solo se sembraba en 0 al crear la cuenta), así que el Radar,
 * Seguimiento y el análisis IA leían un número congelado. Este módulo es la
 * única fuente para esas métricas; el campo de la tabla queda obsoleto.
 *
 * "Abierto" = ticket sin fecha de cierre en el export de Zoho Desk (el
 * generador scripts/gen-tickets-data.py deja `cierre` vacío en ese caso).
 */
import rawTickets from './tickets-data.json'

interface TicketRaw {
  cid: string; empresa: string; fecha: string; es_falla: string; cierre: string
}

export interface TicketStatsCuenta {
  total:    number
  fallas:   number
  abiertos: number
  ultima:   string | null
}

const VACIO: TicketStatsCuenta = { total: 0, fallas: 0, abiertos: 0, ultima: null }

function norm(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

const _byCid:  Record<string, TicketStatsCuenta> = {}
const _byName: Record<string, TicketStatsCuenta> = {}

function acumular(mapa: Record<string, TicketStatsCuenta>, k: string, t: TicketRaw) {
  if (!mapa[k]) mapa[k] = { total: 0, fallas: 0, abiertos: 0, ultima: null }
  const s = mapa[k]
  s.total++
  if (t.es_falla === 'Si') s.fallas++
  if (!String(t.cierre ?? '').trim()) s.abiertos++
  if (!s.ultima || t.fecha > s.ultima) s.ultima = t.fecha
}

for (const t of rawTickets as TicketRaw[]) {
  if (t.cid?.trim())    acumular(_byCid,  t.cid.trim(), t)
  const n = norm(t.empresa)
  if (n)                acumular(_byName, n, t)
}

/**
 * Stats de la cuenta: exacto por CID; si no, por nombre normalizado; si no,
 * coincidencia parcial por primera palabra significativa (mismo criterio que
 * usaba /api/cuentas desde su creación).
 */
export function ticketStatsCuenta(cid: string | null | undefined, empresa: string): TicketStatsCuenta {
  if (cid?.trim() && _byCid[cid.trim()]) return _byCid[cid.trim()]

  const normEmp = norm(empresa)
  if (_byName[normEmp]) return _byName[normEmp]

  const words = normEmp.split(/\s+/).filter(w => w.length >= 4)
  if (words.length > 0) {
    const found = Object.entries(_byName).find(([k]) =>
      k.includes(words[0]) || words[0].includes(k.split(' ')[0])
    )
    if (found) return found[1]
  }
  return VACIO
}
