/**
 * Funciones server-side para obtener tickets y facturación por cuenta.
 * Se leen los JSON directamente — sin fetch, sin API round-trip.
 */
import { readFileSync } from 'fs'
import { join } from 'path'

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
  _tickets = JSON.parse(readFileSync(join(process.cwd(), 'lib', 'tickets-data.json'), 'utf-8'))
  return _tickets!
}

function getFact(): FactRow[] {
  if (_fact) return _fact
  _fact = JSON.parse(readFileSync(join(process.cwd(), 'lib', 'facturacion-data.json'), 'utf-8'))
  return _fact!
}

/* ── Normalize ─────────────────────────────────────────────────────── */
function norm(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

/* ══════════════════════════════════════════════════════════════════════
   TICKETS por cuenta
══════════════════════════════════════════════════════════════════════ */
export function getTicketsByCuenta(
  cid: string | null,
  empresa: string,
  limit = 20,
): { rows: TicketRow[]; total: number; matchedBy: string } {
  const all = getTickets()

  // 1) Exacto por CID
  if (cid) {
    const trimCid = cid.trim()
    const rows = all.filter(t => (t.cid ?? '').trim() === trimCid)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, limit)
    if (rows.length > 0)
      return { rows, total: rows.length, matchedBy: `CID ${trimCid}` }
  }

  // 2) Nombre normalizado completo
  const normEmp = norm(empresa)
  const byName = all.filter(t => norm(t.empresa).includes(normEmp) || normEmp.includes(norm(t.empresa)))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, limit)
  if (byName.length > 0)
    return { rows: byName, total: byName.length, matchedBy: empresa }

  // 3) Primera palabra significativa
  const words = normEmp.split(/\s+/).filter(w => w.length >= 4)
  if (words.length > 0) {
    const byWord = all.filter(t => norm(t.empresa).includes(words[0]))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, limit)
    if (byWord.length > 0)
      return { rows: byWord, total: byWord.length, matchedBy: `"${words[0]}"` }
  }

  return { rows: [], total: 0, matchedBy: '' }
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
