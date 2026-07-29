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
  duracion_hrs: number
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
  const cidExact  = sp.get('cid') ?? ''          // match exacto por CID de cuenta
  const producto  = sp.get('producto') ?? ''
  const categoria = sp.get('categoria') ?? ''
  const esFalla   = sp.get('es_falla') ?? ''
  const prioridad = sp.get('prioridad') ?? ''
  const mes       = sp.get('mes') ?? ''
  const propietario = sp.get('propietario') ?? ''
  const page      = parseInt(sp.get('page') ?? '1')
  const limit     = parseInt(sp.get('limit') ?? '50')
  const mode      = sp.get('mode') ?? 'list'

  // ── Propietarios ───────────────────────────────────────────────────
  if (mode === 'propietarios') {
    const set = new Set<string>()
    for (const t of ALL_TICKETS) if (t.propietario) set.add(t.propietario)
    return NextResponse.json({ propietarios: Array.from(set).sort() })
  }

  // ── Stats ──────────────────────────────────────────────────────────
  if (mode === 'stats') {
    const base = mes ? ALL_TICKETS.filter(t => t.fecha.startsWith(mes)) : ALL_TICKETS

    const byMes:   Record<string, number> = {}
    const byCat:   Record<string, number> = {}
    const byProd:  Record<string, number> = {}
    const byPrior: Record<string, number> = {}
    const byProp:  Record<string, number> = {}
    let fallas = 0

    const empMap: Record<string, { total: number; fallas: number; ultima: string }> = {}

    for (const t of base) {
      const m = t.fecha.slice(0, 7)
      byMes[m]  = (byMes[m]  || 0) + 1
      byCat[t.categoria]   = (byCat[t.categoria]   || 0) + 1
      byProd[t.producto]   = (byProd[t.producto]   || 0) + 1
      const pr = t.prioridad || 'Low'
      byPrior[pr] = (byPrior[pr] || 0) + 1
      if (t.propietario) byProp[t.propietario] = (byProp[t.propietario] || 0) + 1
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

    return NextResponse.json({ total: base.length, fallas, byMes, byCat, byProd, byPrior, byProp, topEmpresas })
  }

  // ── Charts ─────────────────────────────────────────────────────────
  if (mode === 'charts') {
    let base = ALL_TICKETS
    if (mes)         base = base.filter(t => t.fecha.startsWith(mes))
    if (propietario) base = base.filter(t => t.propietario.toLowerCase() === propietario.toLowerCase())
    if (producto)    base = base.filter(t => t.producto.toLowerCase().includes(producto.toLowerCase()))
    if (prioridad)   base = base.filter(t => t.prioridad.toLowerCase() === prioridad.toLowerCase())

    const total  = base.length
    const fallas = base.filter(t => t.es_falla === 'Si').length
    const durSum = base.reduce((s, t) => s + (t.duracion_hrs ?? 0), 0)
    const avgDuracion = total > 0 ? Math.round(durSum / total * 10) / 10 : 0

    const propMap: Record<string, { tickets: number; fallas: number; durSum: number }> = {}
    const mesMap:  Record<string, { tickets: number; fallas: number }> = {}
    const prodMap: Record<string, number> = {}
    const priorMap: Record<string, number> = {}
    const durBuckets: Record<string, number> = { '< 1h': 0, '1–4h': 0, '4–8h': 0, '8–24h': 0, '1–3d': 0, '3–7d': 0, '+7d': 0 }

    for (const t of base) {
      const pr = t.propietario || 'Sin propietario'
      if (!propMap[pr]) propMap[pr] = { tickets: 0, fallas: 0, durSum: 0 }
      propMap[pr].tickets++
      if (t.es_falla === 'Si') propMap[pr].fallas++
      propMap[pr].durSum += t.duracion_hrs ?? 0

      if (!mesMap[t.fecha]) mesMap[t.fecha] = { tickets: 0, fallas: 0 }
      mesMap[t.fecha].tickets++
      if (t.es_falla === 'Si') mesMap[t.fecha].fallas++

      prodMap[t.producto || 'Sin producto'] = (prodMap[t.producto || 'Sin producto'] || 0) + 1

      const pKey = t.prioridad || 'Low'
      priorMap[pKey] = (priorMap[pKey] || 0) + 1

      const h = t.duracion_hrs ?? 0
      if (h < 1)   durBuckets['< 1h']++
      else if (h < 4)  durBuckets['1–4h']++
      else if (h < 8)  durBuckets['4–8h']++
      else if (h < 24) durBuckets['8–24h']++
      else if (h < 72) durBuckets['1–3d']++
      else if (h < 168) durBuckets['3–7d']++
      else             durBuckets['+7d']++
    }

    const byPropietario = Object.entries(propMap)
      .map(([name, d]) => ({ name, tickets: d.tickets, fallas: d.fallas, avgDuracion: d.tickets > 0 ? Math.round(d.durSum / d.tickets * 10) / 10 : 0 }))
      .sort((a, b) => b.tickets - a.tickets)

    const byMesArr = Object.entries(mesMap).sort().map(([m, d]) => ({ mes: m, ...d }))
    const byProducto = Object.entries(prodMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const byPrioridad = Object.entries(priorMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const byDuracion = Object.entries(durBuckets).map(([bucket, count]) => ({ bucket, count }))

    return NextResponse.json({
      total, fallas, avgDuracion,
      topPropietario: byPropietario[0]?.name ?? '—',
      byPropietario, byMes: byMesArr, byProducto, byPrioridad, byDuracion,
    })
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
    if (cidExact && t.cid !== cidExact) return false   // filtro exacto por CID
    if (q) {
      const hay = normalize(t.empresa) + ' ' + t.num + ' ' + t.ticket_id
      if (!hay.includes(normalize(q))) return false
    }
    if (producto    && !t.producto.toLowerCase().includes(producto.toLowerCase()))    return false
    if (categoria   && !t.categoria.toLowerCase().includes(categoria.toLowerCase()))  return false
    if (esFalla     && t.es_falla !== esFalla)                                        return false
    if (prioridad   && t.prioridad.toLowerCase() !== prioridad.toLowerCase())         return false
    if (mes         && !t.fecha.startsWith(mes))                                      return false
    if (propietario && t.propietario.toLowerCase() !== propietario.toLowerCase())     return false
    return true
  })

  const total = filtered.length
  const rows  = filtered.slice((page - 1) * limit, page * limit)
  return NextResponse.json({ rows, total, page, pages: Math.ceil(total / limit) })
}
