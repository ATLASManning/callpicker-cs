import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/* ─── Tipo de registro ───────────────────────────────────────────────── */
export interface FactRow {
  CID:                     string
  'Nombre del Cliente':    string
  'Fecha de corte':        string
  Periodo:                 string
  'Nombre del Plan':       string
  'Minutos Incluidos':     number | null
  'Minutos Consumidos':    number | null
  'Monto del plan':        number | null
  '% Consumo':             number | null
  'Extensiones ilimitadas':string
  'Clasificación de empresa': string
  'Toggle Status':         number | null
  'Menú Configuracion':    number | null
  Reportes:                number | null
  'Call History':          number | null
  'Visit Inbound':         number | null
  'Visit Outbound':        number | null
  'My extension':          number | null
  'Total de interacciones':number | null
  '% Llamadas entrantes':  number | null
  '% Llamadas salientes':  number | null
  'Uso Principal de llamadas': string
  'Eventos analizados':    string
}

/* ─── Carga lazy del JSON ────────────────────────────────────────────── */
let _cache: FactRow[] | null = null
function getData(): FactRow[] {
  if (_cache) return _cache
  const p = join(process.cwd(), 'lib', 'facturacion-data.json')
  _cache = JSON.parse(readFileSync(p, 'utf-8')) as FactRow[]
  return _cache
}

function normalize(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

/* ─── Handler ────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const sp    = req.nextUrl.searchParams
  const mode  = sp.get('mode') ?? 'list'
  const all   = getData()

  /* ── MODO: periodos ─────────────────────────────────────────────── */
  if (mode === 'periodos') {
    const map: Record<string, { count: number; mrr: number }> = {}
    for (const r of all) {
      const f = r['Fecha de corte'] ?? ''
      if (!map[f]) map[f] = { count: 0, mrr: 0 }
      map[f].count++
      map[f].mrr += Number(r['Monto del plan'] ?? 0)
    }
    const periodos = Object.entries(map)
      .map(([fecha, v]) => ({ fecha, count: v.count, mrr: Math.round(v.mrr * 100) / 100 }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
    return NextResponse.json({ periodos })
  }

  /* ── Filtrar por fecha ──────────────────────────────────────────── */
  const fecha = sp.get('fecha') ?? ''
  const rows  = fecha ? all.filter(r => r['Fecha de corte'] === fecha) : all

  /* ── MODO: stats ────────────────────────────────────────────────── */
  if (mode === 'stats') {
    const totalMrr   = rows.reduce((s, r) => s + (r['Monto del plan'] ?? 0), 0)
    const avgConsumo = rows.length
      ? rows.reduce((s, r) => s + (r['% Consumo'] ?? 0), 0) / rows.length
      : 0
    const sinUso     = rows.filter(r => (r['Toggle Status'] ?? 0) === 0).length
    const conUso     = rows.length - sinUso

    /* Por clasificación */
    const byClas: Record<string, { count: number; mrr: number }> = {}
    for (const r of rows) {
      const c = r['Clasificación de empresa'] ?? 'N/A'
      if (!byClas[c]) byClas[c] = { count: 0, mrr: 0 }
      byClas[c].count++
      byClas[c].mrr += r['Monto del plan'] ?? 0
    }

    /* Por plan (top 10 MRR) */
    const byPlan: Record<string, { count: number; mrr: number }> = {}
    for (const r of rows) {
      const p = r['Nombre del Plan'] ?? 'N/A'
      if (!byPlan[p]) byPlan[p] = { count: 0, mrr: 0 }
      byPlan[p].count++
      byPlan[p].mrr += r['Monto del plan'] ?? 0
    }
    const topPlanes = Object.entries(byPlan)
      .map(([plan, v]) => ({ plan, count: v.count, mrr: Math.round(v.mrr * 100) / 100 }))
      .sort((a, b) => b.mrr - a.mrr).slice(0, 15)

    /* Distribución % consumo */
    const bins = [0, 0, 0, 0, 0, 0]   // 0%, 1-25%, 26-50%, 51-75%, 76-100%, >100%
    for (const r of rows) {
      const c = r['% Consumo'] ?? 0
      if (c === 0)       bins[0]++
      else if (c <= 25)  bins[1]++
      else if (c <= 50)  bins[2]++
      else if (c <= 75)  bins[3]++
      else if (c <= 100) bins[4]++
      else               bins[5]++
    }

    /* Uso de módulos (suma de interacciones con cada módulo) */
    const modulos = {
      menuConfig:   rows.reduce((s, r) => s + (r['Menú Configuracion'] ?? 0), 0),
      reportes:     rows.reduce((s, r) => s + (r.Reportes ?? 0), 0),
      callHistory:  rows.reduce((s, r) => s + (r['Call History'] ?? 0), 0),
      visitInbound: rows.reduce((s, r) => s + (r['Visit Inbound'] ?? 0), 0),
      visitOutbound:rows.reduce((s, r) => s + (r['Visit Outbound'] ?? 0), 0),
      myExtension:  rows.reduce((s, r) => s + (r['My extension'] ?? 0), 0),
    }

    /* Uso principal */
    const usoPrincipal: Record<string, number> = {}
    for (const r of rows) {
      const u = r['Uso Principal de llamadas'] ?? 'N/A'
      usoPrincipal[u] = (usoPrincipal[u] ?? 0) + 1
    }

    return NextResponse.json({
      total: rows.length,
      totalMrr: Math.round(totalMrr * 100) / 100,
      avgConsumo: Math.round(avgConsumo * 10) / 10,
      sinUso, conUso,
      byClas, topPlanes, bins, modulos, usoPrincipal,
    })
  }

  /* ── MODO: list ─────────────────────────────────────────────────── */
  if (mode === 'list') {
    const q        = (sp.get('q') ?? '').toLowerCase()
    const clas     = sp.get('clas') ?? ''
    const plan     = sp.get('plan') ?? ''
    const usoFilter= sp.get('uso') ?? ''   // 'activo' | 'inactivo'
    const page     = Math.max(1, parseInt(sp.get('page') ?? '1'))
    const size     = Math.min(100, parseInt(sp.get('size') ?? '50'))

    let filtered = rows
    if (q) filtered = filtered.filter(r =>
      (r.CID ?? '').includes(q) ||
      normalize(r['Nombre del Cliente'] ?? '').includes(normalize(q)) ||
      normalize(r['Nombre del Plan'] ?? '').includes(normalize(q))
    )
    if (clas) filtered = filtered.filter(r => r['Clasificación de empresa'] === clas)
    if (plan) filtered = filtered.filter(r => r['Nombre del Plan'] === plan)
    if (usoFilter === 'activo')   filtered = filtered.filter(r => (r['Toggle Status'] ?? 0) > 0)
    if (usoFilter === 'inactivo') filtered = filtered.filter(r => (r['Toggle Status'] ?? 0) === 0)

    const total  = filtered.length
    const offset = (page - 1) * size
    const slice  = filtered.slice(offset, offset + size)

    return NextResponse.json({ total, page, size, rows: slice })
  }

  /* ── MODO: conciliacion ─────────────────────────────────────────── */
  if (mode === 'conciliacion') {
    // Obtener cuentas de Supabase
    const { data: cuentas } = await supabaseAdmin
      .from('cuentas')
      .select('id, nombre, estado, asesor, health_score, facturacion, cid')

    type CuentaRow = { id: number; nombre: string; estado: string; asesor: string; health_score: number | null; facturacion: number | null; cid: string | null }
    const mapCid:    Record<string, CuentaRow> = {}
    const mapNombre: Record<string, CuentaRow> = {}
    for (const c of ((cuentas ?? []) as CuentaRow[])) {
      if (c.cid) mapCid[String(c.cid)] = c
      mapNombre[normalize(c.nombre ?? '')] = c
    }

    // Obtener CIDs únicos del período
    const cidSet = new Set(rows.map(r => r.CID))
    const uniqueCids = Array.from(cidSet)
    const result = uniqueCids.map(cid => {
      const factRows = rows.filter(r => r.CID === cid)
      const first    = factRows[0]
      const mrr      = factRows.reduce((s, r) => s + (r['Monto del plan'] ?? 0), 0)
      const cuenta   = mapCid[cid]
        ?? mapNombre[normalize(first?.['Nombre del Cliente'] ?? '')]
        ?? null

      return {
        cid,
        nombre:     first?.['Nombre del Cliente'] ?? '',
        plan:       first?.['Nombre del Plan'] ?? '',
        clas:       first?.['Clasificación de empresa'] ?? '',
        mrr:        Math.round(mrr * 100) / 100,
        toggle:     first?.['Toggle Status'] ?? 0,
        consumo:    first?.['% Consumo'] ?? 0,
        matched:    !!cuenta,
        cuenta_id:  cuenta?.id ?? null,
        estado:     cuenta?.estado ?? null,
        asesor:     cuenta?.asesor ?? null,
        health_score: cuenta?.health_score ?? null,
      }
    }).sort((a, b) => b.mrr - a.mrr)

    const matched   = result.filter(r => r.matched).length
    const unmatched = result.filter(r => !r.matched).length

    return NextResponse.json({ total: result.length, matched, unmatched, rows: result })
  }

  return NextResponse.json({ error: 'mode not found' }, { status: 400 })
}
