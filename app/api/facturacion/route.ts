import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import {
  isZohoConfigured, queryZohoView, parseNum, ZohoViewData
} from '@/lib/zoho-analytics'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

/* ─── Tipo de registro ───────────────────────────────────────────────── */
export interface FactRow {
  CID:                          string
  'Nombre del Cliente':         string
  'Fecha de corte':             string
  Periodo:                      string
  'Nombre del Plan':            string
  'Minutos Incluidos':          number | null
  'Minutos Consumidos':         number | null
  'Monto del plan':             number | null
  '% Consumo':                  number | null
  'Extensiones ilimitadas':     string
  'Clasificación de empresa':   string
  'Toggle Status':              number | null
  'Menú Configuracion':         number | null
  Reportes:                     number | null
  'Call History':               number | null
  'Visit Inbound':              number | null
  'Visit Outbound':             number | null
  'My extension':               number | null
  'Total de interacciones':     number | null
  '% Llamadas entrantes':       number | null
  '% Llamadas salientes':       number | null
  'Uso Principal de llamadas':  string
  'Eventos analizados':         string
}

/* ── Mapeo columnas Zoho → FactRow ────────────────────────────────────
   Ajustar los nombres izquierda (Zoho) si cambia el reporte.
   Los nombres derecha (FactRow) son los que usa el dashboard.
─────────────────────────────────────────────────────────────────────── */
const COL: Record<string, keyof FactRow> = {
  'CID':                         'CID',
  'Nombre del Cliente':          'Nombre del Cliente',
  'Fecha de corte':              'Fecha de corte',
  'Periodo':                     'Periodo',
  'Nombre del Plan':             'Nombre del Plan',
  'Minutos Incluidos':           'Minutos Incluidos',
  'Minutos Consumidos':          'Minutos Consumidos',
  'Monto del plan':              'Monto del plan',
  '% Consumo':                   '% Consumo',
  'Extensiones ilimitadas':      'Extensiones ilimitadas',
  'Clasificación de empresa':    'Clasificación de empresa',
  'Toggle Status':               'Toggle Status',
  'Menú Configuracion':          'Menú Configuracion',
  'Reportes':                    'Reportes',
  'Call History':                'Call History',
  'Visit Inbound':               'Visit Inbound',
  'Visit Outbound':              'Visit Outbound',
  'My extension':                'My extension',
  'Total de interacciones':      'Total de interacciones',
  '% Llamadas entrantes':        '% Llamadas entrantes',
  '% Llamadas salientes':        '% Llamadas salientes',
  'Uso Principal de llamadas':   'Uso Principal de llamadas',
  'Eventos analizados':          'Eventos analizados',
}

const NUM_COLS = new Set<keyof FactRow>([
  'Minutos Incluidos', 'Minutos Consumidos', 'Monto del plan',
  '% Consumo', 'Toggle Status', 'Menú Configuracion', 'Reportes',
  'Call History', 'Visit Inbound', 'Visit Outbound', 'My extension',
  'Total de interacciones', '% Llamadas entrantes', '% Llamadas salientes',
])

/* ── Convertir fila Zoho → FactRow ────────────────────────────────── */
function zohoRowToFact(raw: Record<string, string>): FactRow {
  const row: Partial<FactRow> = {}
  for (const [zohoCol, factKey] of Object.entries(COL)) {
    const val = raw[zohoCol] ?? raw[factKey] ?? ''
    if (NUM_COLS.has(factKey)) {
      (row as Record<string, unknown>)[factKey] = parseNum(val)
    } else {
      (row as Record<string, unknown>)[factKey] = val
    }
  }
  // Garantizar campos obligatorios
  if (!row['CID']) row['CID'] = ''
  if (!row['Nombre del Cliente']) row['Nombre del Cliente'] = ''
  if (!row['Fecha de corte']) row['Fecha de corte'] = ''
  if (!row.Periodo) row.Periodo = ''
  if (!row['Nombre del Plan']) row['Nombre del Plan'] = ''
  if (!row['Extensiones ilimitadas']) row['Extensiones ilimitadas'] = ''
  if (!row['Clasificación de empresa']) row['Clasificación de empresa'] = ''
  if (!row['Uso Principal de llamadas']) row['Uso Principal de llamadas'] = ''
  if (!row['Eventos analizados']) row['Eventos analizados'] = ''
  return row as FactRow
}

/* ── Cache Zoho en memoria (TTL: 10 min) ─────────────────────────── */
let _zohoCache: { data: FactRow[]; ts: number } | null = null
const ZOHO_TTL_MS = 10 * 60 * 1000

async function getZohoData(): Promise<FactRow[]> {
  if (_zohoCache && Date.now() - _zohoCache.ts < ZOHO_TTL_MS) return _zohoCache.data

  const viewId = process.env.ZOHO_VIEW_ID_FACTURACION
  if (!viewId) throw new Error('ZOHO_VIEW_ID_FACTURACION no configurado')

  const result: ZohoViewData = await queryZohoView({ viewId })
  const data = result.rows.map(zohoRowToFact)
  _zohoCache = { data, ts: Date.now() }
  return data
}

/* ── Fallback: JSON local ─────────────────────────────────────────── */
let _localCache: FactRow[] | null = null
function getLocalData(): FactRow[] {
  if (_localCache) return _localCache
  const p = join(process.cwd(), 'lib', 'facturacion-data.json')
  if (!existsSync(p)) return []
  _localCache = JSON.parse(readFileSync(p, 'utf-8')) as FactRow[]
  return _localCache
}

/* ── Obtener datos (Zoho si configurado, local si no) ────────────── */
async function getData(): Promise<{ rows: FactRow[]; source: 'zoho' | 'local' | 'empty' }> {
  if (isZohoConfigured()) {
    try {
      const rows = await getZohoData()
      return { rows, source: 'zoho' }
    } catch (err) {
      console.error('[facturacion] Zoho error, fallback local:', err)
    }
  }
  const rows = getLocalData()
  return { rows, source: rows.length ? 'local' : 'empty' }
}

function normalize(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

/* ─── Handler ────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const sp   = req.nextUrl.searchParams
  const mode = sp.get('mode') ?? 'list'

  const { rows: all, source } = await getData()

  /* ── Status de la fuente ─────────────────────────────────────────── */
  if (mode === 'source') {
    return NextResponse.json({
      source,
      zohoConfigured: isZohoConfigured(),
      rows: all.length,
    })
  }

  /* ── MODO: periodos ─────────────────────────────────────────────── */
  if (mode === 'periodos') {
    const map: Record<string, { count: number; mrr: number }> = {}
    for (const r of all) {
      const f = r['Fecha de corte'] ?? ''
      if (!f) continue
      if (!map[f]) map[f] = { count: 0, mrr: 0 }
      map[f].count++
      map[f].mrr += Number(r['Monto del plan'] ?? 0)
    }
    const periodos = Object.entries(map)
      .map(([fecha, v]) => ({ fecha, count: v.count, mrr: Math.round(v.mrr * 100) / 100 }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
    return NextResponse.json({ periodos, source })
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
    const sinUso = rows.filter(r => (r['Toggle Status'] ?? 0) === 0).length
    const conUso = rows.length - sinUso

    const byClas: Record<string, { count: number; mrr: number }> = {}
    for (const r of rows) {
      const c = r['Clasificación de empresa'] ?? 'N/A'
      if (!byClas[c]) byClas[c] = { count: 0, mrr: 0 }
      byClas[c].count++
      byClas[c].mrr += r['Monto del plan'] ?? 0
    }

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

    const bins = [0, 0, 0, 0, 0, 0]
    for (const r of rows) {
      const c = r['% Consumo'] ?? 0
      if (c === 0)       bins[0]++
      else if (c <= 25)  bins[1]++
      else if (c <= 50)  bins[2]++
      else if (c <= 75)  bins[3]++
      else if (c <= 100) bins[4]++
      else               bins[5]++
    }

    const modulos = {
      menuConfig:   rows.reduce((s, r) => s + (r['Menú Configuracion'] ?? 0), 0),
      reportes:     rows.reduce((s, r) => s + (r.Reportes ?? 0), 0),
      callHistory:  rows.reduce((s, r) => s + (r['Call History'] ?? 0), 0),
      visitInbound: rows.reduce((s, r) => s + (r['Visit Inbound'] ?? 0), 0),
      visitOutbound:rows.reduce((s, r) => s + (r['Visit Outbound'] ?? 0), 0),
      myExtension:  rows.reduce((s, r) => s + (r['My extension'] ?? 0), 0),
    }

    const usoPrincipal: Record<string, number> = {}
    for (const r of rows) {
      const u = r['Uso Principal de llamadas'] ?? 'N/A'
      usoPrincipal[u] = (usoPrincipal[u] ?? 0) + 1
    }

    return NextResponse.json({
      total: rows.length, totalMrr: Math.round(totalMrr * 100) / 100,
      avgConsumo: Math.round(avgConsumo * 10) / 10,
      sinUso, conUso, byClas, topPlanes, bins, modulos, usoPrincipal, source,
    })
  }

  /* ── MODO: list ─────────────────────────────────────────────────── */
  if (mode === 'list') {
    const q         = (sp.get('q') ?? '').toLowerCase()
    const clas      = sp.get('clas') ?? ''
    const plan      = sp.get('plan') ?? ''
    const usoFilter = sp.get('uso') ?? ''
    const page      = Math.max(1, parseInt(sp.get('page') ?? '1'))
    const size      = Math.min(100, parseInt(sp.get('size') ?? '50'))

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
    return NextResponse.json({ total, page, size, rows: slice, source })
  }

  /* ── MODO: conciliacion ─────────────────────────────────────────── */
  if (mode === 'conciliacion') {
    const { data: cuentas } = await supabaseAdmin
      .from('cuentas')
      .select('id, nombre, estado, asesor, health_score, facturacion, cid')

    type CuentaRow = {
      id: number; nombre: string; estado: string; asesor: string
      health_score: number | null; facturacion: number | null; cid: string | null
    }
    const mapCid:    Record<string, CuentaRow> = {}
    const mapNombre: Record<string, CuentaRow> = {}
    for (const c of ((cuentas ?? []) as CuentaRow[])) {
      if (c.cid) mapCid[String(c.cid)] = c
      mapNombre[normalize(c.nombre ?? '')] = c
    }

    const cidSet    = new Set(rows.map(r => r.CID))
    const uniqueCids = Array.from(cidSet)
    const result = uniqueCids.map(cid => {
      const factRows = rows.filter(r => r.CID === cid)
      const first    = factRows[0]
      const mrr      = factRows.reduce((s, r) => s + (r['Monto del plan'] ?? 0), 0)
      const cuenta   = mapCid[cid]
        ?? mapNombre[normalize(first?.['Nombre del Cliente'] ?? '')]
        ?? null

      return {
        cid, nombre: first?.['Nombre del Cliente'] ?? '',
        plan: first?.['Nombre del Plan'] ?? '',
        clas: first?.['Clasificación de empresa'] ?? '',
        mrr: Math.round(mrr * 100) / 100,
        toggle: first?.['Toggle Status'] ?? 0,
        consumo: first?.['% Consumo'] ?? 0,
        matched: !!cuenta,
        cuenta_id: cuenta?.id ?? null,
        estado: cuenta?.estado ?? null,
        asesor: cuenta?.asesor ?? null,
        health_score: cuenta?.health_score ?? null,
      }
    }).sort((a, b) => b.mrr - a.mrr)

    const matched   = result.filter(r => r.matched).length
    const unmatched = result.filter(r => !r.matched).length
    return NextResponse.json({ total: result.length, matched, unmatched, rows: result, source })
  }

  /* ── MODO: by-cid (para panel de cuenta) ────────────────────────── */
  if (mode === 'by-cid') {
    const cid    = sp.get('cid') ?? ''
    const nombre = sp.get('nombre') ?? ''

    let found = cid ? all.filter(r => (r.CID ?? '').trim() === cid.trim()) : []

    if (!found.length && nombre) {
      const normNombre = normalize(nombre)
      found = all.filter(r => {
        const cn = normalize(r['Nombre del Cliente'] ?? '')
        return cn.includes(normNombre) || normNombre.includes(cn.split(' ')[0] ?? '')
      })
    }

    found = found.sort((a, b) => (b['Fecha de corte'] ?? '').localeCompare(a['Fecha de corte'] ?? '')).slice(0, 24)
    return NextResponse.json({ rows: found, source })
  }

  return NextResponse.json({ error: 'mode not found' }, { status: 400 })
}
