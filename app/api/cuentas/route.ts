import { NextRequest, NextResponse } from 'next/server'
import { getCuentas, upsertCuenta } from '@/lib/supabase'
import rawTickets from '@/lib/tickets-data.json'
import { getZohoMap, lookupZoho } from '@/lib/zoho-enrich'

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
  const asesorHeader = decodeURIComponent(req.headers.get('x-user-asesor') ?? '')

  // Si el usuario es asesor, forzar filtro por su nombre (ignora el param del frontend)
  const asesorFiltro = rol === 'asesor' ? asesorHeader : (sp.get('asesor') || undefined)

  try {
    const [data, zohoMap] = await Promise.all([
      getCuentas({
        asesor:   asesorFiltro || undefined,
        semaforo: sp.get('semaforo') || undefined,
        estado:   sp.get('estado')   || undefined,
        search:   sp.get('search')   || undefined,
      }),
      getZohoMap(),
    ])

    // Enriquecer cada cuenta con tickets + MRR y Factura Mensual de Zoho
    const enriched = data.map(c => {
      const z = lookupZoho(c.empresa, zohoMap)
      return {
        ...c,
        zoho_tickets:       getTicketStats(c.cid ?? null, c.empresa),
        mrr_zoho:           z?.mrr            ?? null,
        factura_mensual_zoho: z?.factura_mensual ?? null,
      }
    })

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
