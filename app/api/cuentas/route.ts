import { NextRequest, NextResponse } from 'next/server'
import { getCuentas, upsertCuenta } from '@/lib/supabase'
import rawTickets from '@/lib/tickets-data.json'
import { queryZohoView, parseNum, isZohoConfigured } from '@/lib/zoho-analytics'

// ── Cache Zoho LTV (15 min) ──────────────────────────────────────────────────
let _zohoMrrCache: { map: Record<string, number>; ts: number } | null = null
const ZOHO_TTL = 15 * 60 * 1000

async function getZohoMrrMap(): Promise<Record<string, number>> {
  if (_zohoMrrCache && Date.now() - _zohoMrrCache.ts < ZOHO_TTL) return _zohoMrrCache.map
  if (!isZohoConfigured()) return {}
  try {
    const viewId = process.env.ZOHO_VIEW_ID_FACTURACION!
    const result = await queryZohoView({ viewId })
    const map: Record<string, number> = {}
    for (const row of result.rows) {
      const semaforo = row['semaforo_actividad'] ?? ''
      if (semaforo === '4 - Dormido') continue
      const mrr = parseNum(row['mrr_limpio']?.replace(/[$,]/g, '')) ?? 0
      const name = normStr(row['nombre_cliente'] ?? '')
      if (!name || mrr <= 0) continue
      map[name] = (map[name] ?? 0) + mrr
    }
    _zohoMrrCache = { map, ts: Date.now() }
    return map
  } catch {
    return {}
  }
}

function normStr(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

function lookupMrr(empresa: string, zmap: Record<string, number>): number {
  const n = normStr(empresa)
  if (zmap[n]) return zmap[n]
  // Fallback: coincidencia por primeras dos palabras significativas
  const words = n.split(/\s+/).filter(w => w.length >= 3).slice(0, 2)
  if (words.length === 0) return 0
  let best = 0
  for (const [key, val] of Object.entries(zmap)) {
    if (words.every(w => key.includes(w))) { best += val }
  }
  return best
}

// ── Tipos de tickets ─────────────────────────────────────────────────────────
interface TicketRaw {
  cid: string; empresa: string; fecha: string; es_falla: string
}

// ── Pre-computa mapa de stats por CID y nombre normalizado (una sola vez) ────
function norm(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

interface TicketStats { total: number; fallas: number; ultima: string | null }

const _byCid:  Record<string, TicketStats> = {}
const _byName: Record<string, TicketStats> = {}

for (const t of rawTickets as TicketRaw[]) {
  // por CID
  if (t.cid?.trim()) {
    const k = t.cid.trim()
    if (!_byCid[k]) _byCid[k] = { total: 0, fallas: 0, ultima: null }
    _byCid[k].total++
    if (t.es_falla === 'Si') _byCid[k].fallas++
    if (!_byCid[k].ultima || t.fecha > _byCid[k].ultima!) _byCid[k].ultima = t.fecha
  }
  // por nombre normalizado
  const normName = norm(t.empresa)
  if (normName) {
    if (!_byName[normName]) _byName[normName] = { total: 0, fallas: 0, ultima: null }
    _byName[normName].total++
    if (t.es_falla === 'Si') _byName[normName].fallas++
    if (!_byName[normName].ultima || t.fecha > _byName[normName].ultima!) _byName[normName].ultima = t.fecha
  }
}

function getTicketStats(cid: string | null, empresa: string): TicketStats {
  // 1) Exacto por CID
  if (cid?.trim() && _byCid[cid.trim()]) return _byCid[cid.trim()]

  // 2) Nombre normalizado completo
  const normEmp = norm(empresa)
  if (_byName[normEmp]) return _byName[normEmp]

  // 3) Coincidencia parcial por primera palabra significativa
  const words = normEmp.split(/\s+/).filter(w => w.length >= 4)
  if (words.length > 0) {
    const found = Object.entries(_byName).find(([k]) =>
      k.includes(words[0]) || words[0].includes(k.split(' ')[0])
    )
    if (found) return found[1]
  }

  return { total: 0, fallas: 0, ultima: null }
}

// ── Handlers ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp  = req.nextUrl.searchParams
  const rol = req.headers.get('x-user-rol') ?? 'viewer'
  const asesorHeader = req.headers.get('x-user-asesor') ?? ''

  // Si el usuario es asesor, forzar filtro por su nombre (ignora el param del frontend)
  const asesorFiltro = rol === 'asesor' ? asesorHeader : (sp.get('asesor') || undefined)

  try {
    const [data, zohoMrr] = await Promise.all([
      getCuentas({
        asesor:   asesorFiltro || undefined,
        semaforo: sp.get('semaforo') || undefined,
        estado:   sp.get('estado')   || undefined,
        search:   sp.get('search')   || undefined,
      }),
      getZohoMrrMap(),
    ])

    // Enriquecer cada cuenta con tickets + MRR real de Zoho
    const enriched = data.map(c => ({
      ...c,
      zoho_tickets: getTicketStats(c.cid ?? null, c.empresa),
      mrr_zoho: lookupMrr(c.empresa, zohoMrr) || null,
    }))

    return NextResponse.json(enriched)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const cuenta = await upsertCuenta(body)
    return NextResponse.json(cuenta, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
