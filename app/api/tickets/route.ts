import { NextRequest, NextResponse } from 'next/server'
import rawData from '@/lib/tickets-data.json'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export interface TicketRow {
  cid: string
  num: string
  empresa: string
  fecha: string
  ticket_id: string
  categoria: string
  subcategoria: string
  es_falla: string
  producto: string
  enlace: string
  propietario: string
  apertura: string
  cierre: string
  duracion: string
  prioridad: string
}

const ALL_TICKETS = rawData as TicketRow[]

function normalize(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q         = sp.get('q')?.toLowerCase() ?? ''
  const producto  = sp.get('producto') ?? ''
  const categoria = sp.get('categoria') ?? ''
  const esFalla   = sp.get('es_falla') ?? ''
  const prioridad = sp.get('prioridad') ?? ''
  const mes       = sp.get('mes') ?? ''
  const page      = parseInt(sp.get('page') ?? '1')
  const limit     = parseInt(sp.get('limit') ?? '50')
  const mode      = sp.get('mode') ?? 'list'

  // ── Stats ──────────────────────────────────────────────────────────
  if (mode === 'stats') {
    const byMes:   Record<string, number> = {}
    const byCat:   Record<string, number> = {}
    const byProd:  Record<string, number> = {}
    const byPrior: Record<string, number> = {}
    let fallas = 0

    const empMap: Record<string, { total: number; fallas: number; ultima: string }> = {}

    for (const t of ALL_TICKETS) {
      const m = t.fecha.slice(0, 7)
      byMes[m]  = (byMes[m]  || 0) + 1
      byCat[t.categoria]   = (byCat[t.categoria]   || 0) + 1
      byProd[t.producto]   = (byProd[t.producto]   || 0) + 1
      const pr = t.prioridad || 'Low'
      byPrior[pr] = (byPrior[pr] || 0) + 1
      if (t.es_falla === 'Si') fallas++

      if (!empMap[t.empresa]) empMap[t.empresa] = { total: 0, fallas: 0, ultima: '' }
      empMap[t.empresa].total++
      if (t.es_falla === 'Si') empMap[t.empresa].fallas++
      if (!empMap[t.empresa].ultima || t.fecha > empMap[t.empresa].ultima)
        empMap[t.empresa].ultima = t.fecha
    }

    const topEmpresas = Object.entries(empMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 20)
      .map(([nombre, d]) => ({ nombre, ...d }))

    return NextResponse.json({ total: ALL_TICKETS.length, fallas, byMes, byCat, byProd, byPrior, topEmpresas })
  }

  // ── Conciliación ───────────────────────────────────────────────────
  if (mode === 'conciliacion') {
    const { data: cuentas } = await supabaseAdmin
      .from('cuentas')
      .select('id, cid, empresa, asesor, estado, health_score')
      .neq('estado', 'cancelado')

    const mapCid:    Record<string, typeof cuentas extends (infer T)[] | null ? T : never> = {}
    const mapNombre: Record<string, typeof cuentas extends (infer T)[] | null ? T : never> = {}
    for (const c of (cuentas ?? [])) {
      if (c.cid) mapCid[String(c.cid)] = c
      mapNombre[normalize(c.empresa)] = c
    }

    type CuentaMin = { id: string; cid: string | null; empresa: string; asesor: string; estado: string; health_score: number } | null

    const empMap: Record<string, {
      cid: string; empresa: string; total: number; fallas: number; ultima: string; cuenta: CuentaMin
    }> = {}

    for (const t of ALL_TICKETS) {
      const key = t.cid + '|' + t.empresa
      if (!empMap[key]) {
        const cuenta = (mapCid[t.cid] ?? mapNombre[normalize(t.empresa)] ?? null) as CuentaMin
        empMap[key] = { cid: t.cid, empresa: t.empresa, total: 0, fallas: 0, ultima: '', cuenta }
      }
      empMap[key].total++
      if (t.es_falla === 'Si') empMap[key].fallas++
      if (!empMap[key].ultima || t.fecha > empMap[key].ultima) empMap[key].ultima = t.fecha
    }

    const rows = Object.values(empMap).sort((a, b) => b.total - a.total)
    return NextResponse.json({
      matched:       rows.filter(r => r.cuenta),
      unmatched:     rows.filter(r => !r.cuenta),
      totalEmpresas: rows.length,
    })
  }

  // ── List (default) ─────────────────────────────────────────────────
  let filtered = ALL_TICKETS.filter(t => {
    if (q) {
      const hay = normalize(t.empresa) + ' ' + t.num + ' ' + t.ticket_id
      if (!hay.includes(normalize(q))) return false
    }
    if (producto  && !t.producto.toLowerCase().includes(producto.toLowerCase()))   return false
    if (categoria && !t.categoria.toLowerCase().includes(categoria.toLowerCase())) return false
    if (esFalla   && t.es_falla !== esFalla)                                       return false
    if (prioridad && t.prioridad.toLowerCase() !== prioridad.toLowerCase())        return false
    if (mes       && !t.fecha.startsWith(mes))                                     return false
    return true
  })

  const total = filtered.length
  const rows  = filtered.slice((page - 1) * limit, page * limit)
  return NextResponse.json({ rows, total, page, pages: Math.ceil(total / limit) })
}
