import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

/* ─── Raw fact row ───────────────────────────────────────────────────── */
interface FactRow {
  CID:                      string
  'Nombre del Cliente':     string
  'Fecha de corte':         string
  'Nombre del Plan':        string
  'Clasificación de empresa': string
  'Monto del plan':         number | null
  '% Consumo':              number | null
  'Toggle Status':          number | null
  'Total de interacciones': number | null
}

/* ─── Computed tenure row ────────────────────────────────────────────── */
export interface TenureRow {
  cid:                   string
  nombre:                string
  clasificacion:         string
  segmento_factura:      string
  meses_activo:          number
  meses_con_factura:     number
  primera_factura:       string
  ultima_factura:        string
  mrr_limpio:            number
  importe_acumulado:     number
  mrr_por_mes_facturado: number
  semaforo:              'verde' | 'amarillo' | 'rojo'
  total_facturas:        number
  tenure_bucket:         string
}

const BUCKET_ORDER = ['Nuevos', 'Jóvenes', 'Activos', 'Maduros', 'Veteranos']

/* ─── Semáforo logic ────────────────────────────────────────────────── */
function calcSemaforo(toggle: number, consumo: number): 'verde' | 'amarillo' | 'rojo' {
  if (toggle > 0 && consumo >= 25) return 'verde'
  if (toggle > 0)                  return 'amarillo'
  return 'rojo'
}

/* ─── Tenure bucket ──────────────────────────────────────────────────── */
function calcBucket(meses: number): string {
  if (meses <= 3)  return 'Nuevos'
  if (meses <= 6)  return 'Jóvenes'
  if (meses <= 12) return 'Activos'
  if (meses <= 24) return 'Maduros'
  return 'Veteranos'
}

/* ─── MRR segment ────────────────────────────────────────────────────── */
function calcSegmento(mrr: number): string {
  if (mrr <= 0)     return 'Sin Factura'
  if (mrr < 500)    return 'Básico'
  if (mrr < 1500)   return 'Estándar'
  if (mrr < 3000)   return 'Premium'
  return 'Enterprise'
}

/* ─── Lazy cache ─────────────────────────────────────────────────────── */
let _cache: TenureRow[] | null = null

function buildTenure(): TenureRow[] {
  if (_cache) return _cache

  const p = join(process.cwd(), 'lib', 'facturacion-data.json')
  const raw = JSON.parse(readFileSync(p, 'utf-8')) as FactRow[]

  /* Group by CID */
  const map: Record<string, FactRow[]> = {}
  for (const r of raw) {
    const cid = r.CID ?? 'UNKNOWN'
    if (!map[cid]) map[cid] = []
    map[cid].push(r)
  }

  _cache = Object.entries(map).map(([cid, rows]) => {
    rows.sort((a, b) => (a['Fecha de corte'] ?? '').localeCompare(b['Fecha de corte'] ?? ''))

    const latest   = rows[rows.length - 1]
    const earliest = rows[0]

    const mesesActivo      = new Set(rows.map(r => r['Fecha de corte'])).size
    const rowsConMrr       = rows.filter(r => (r['Monto del plan'] ?? 0) > 0)
    const mesesConFactura  = rowsConMrr.length
    const importeAcumulado = rows.reduce((s, r) => s + (r['Monto del plan'] ?? 0), 0)
    const mrrLimpio        = latest['Monto del plan'] ?? 0
    const mrrPorMes        = mesesConFactura > 0 ? importeAcumulado / mesesConFactura : 0

    return {
      cid,
      nombre:                latest['Nombre del Cliente'] ?? '',
      clasificacion:         latest['Clasificación de empresa'] ?? 'N/A',
      segmento_factura:      calcSegmento(mrrLimpio),
      meses_activo:          mesesActivo,
      meses_con_factura:     mesesConFactura,
      primera_factura:       earliest['Fecha de corte'] ?? '',
      ultima_factura:        latest['Fecha de corte'] ?? '',
      mrr_limpio:            Math.round(mrrLimpio        * 100) / 100,
      importe_acumulado:     Math.round(importeAcumulado * 100) / 100,
      mrr_por_mes_facturado: Math.round(mrrPorMes        * 100) / 100,
      semaforo:              calcSemaforo(latest['Toggle Status'] ?? 0, latest['% Consumo'] ?? 0),
      total_facturas:        mesesConFactura,
      tenure_bucket:         calcBucket(mesesActivo),
    }
  })

  return _cache!
}

/* ─── Handler ────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const sp   = req.nextUrl.searchParams
  const mode = sp.get('mode') ?? 'stats'
  const all  = buildTenure()

  /* ── MODO: stats ─────────────────────────────────────────────────── */
  if (mode === 'stats') {
    const total        = all.length
    const withMrr      = all.filter(r => r.mrr_limpio > 0)
    const totalMrr     = all.reduce((s, r) => s + r.mrr_limpio, 0)
    const totalAcum    = all.reduce((s, r) => s + r.importe_acumulado, 0)
    const avgMeses     = total ? all.reduce((s, r) => s + r.meses_activo, 0) / total : 0
    const avgMrr       = withMrr.length ? withMrr.reduce((s, r) => s + r.mrr_limpio, 0) / withMrr.length : 0
    const verde        = all.filter(r => r.semaforo === 'verde').length
    const amarillo     = all.filter(r => r.semaforo === 'amarillo').length
    const rojo         = all.filter(r => r.semaforo === 'rojo').length

    /* MRR at stake per semaforo */
    const mrrBySemaforo = {
      verde:    Math.round(all.filter(r => r.semaforo === 'verde').reduce((s, r)    => s + r.mrr_limpio, 0) * 100) / 100,
      amarillo: Math.round(all.filter(r => r.semaforo === 'amarillo').reduce((s, r) => s + r.mrr_limpio, 0) * 100) / 100,
      rojo:     Math.round(all.filter(r => r.semaforo === 'rojo').reduce((s, r)     => s + r.mrr_limpio, 0) * 100) / 100,
    }

    /* Tenure bucket breakdown */
    const bucketMap: Record<string, { count: number; mrr: number; meses: number; acum: number }> = {}
    for (const r of all) {
      if (!bucketMap[r.tenure_bucket]) bucketMap[r.tenure_bucket] = { count: 0, mrr: 0, meses: 0, acum: 0 }
      bucketMap[r.tenure_bucket].count++
      bucketMap[r.tenure_bucket].mrr   += r.mrr_limpio
      bucketMap[r.tenure_bucket].meses += r.meses_activo
      bucketMap[r.tenure_bucket].acum  += r.importe_acumulado
    }
    const byBucket = BUCKET_ORDER.filter(b => bucketMap[b]).map(b => ({
      bucket:   b,
      count:    bucketMap[b].count,
      mrr:      Math.round(bucketMap[b].mrr  * 100) / 100,
      avgMrr:   Math.round((bucketMap[b].mrr  / bucketMap[b].count) * 100) / 100,
      avgMeses: Math.round((bucketMap[b].meses / bucketMap[b].count) * 10)  / 10,
      acum:     Math.round(bucketMap[b].acum * 100) / 100,
    }))

    /* Clasificación × Bucket matrix */
    const byClasxBucket: Record<string, Record<string, number>> = {}
    for (const r of all) {
      if (!byClasxBucket[r.clasificacion]) byClasxBucket[r.clasificacion] = {}
      byClasxBucket[r.clasificacion][r.tenure_bucket] =
        (byClasxBucket[r.clasificacion][r.tenure_bucket] ?? 0) + 1
    }

    /* Segmento por MRR */
    const bySegmento: Record<string, { count: number; mrr: number }> = {}
    for (const r of all) {
      if (!bySegmento[r.segmento_factura]) bySegmento[r.segmento_factura] = { count: 0, mrr: 0 }
      bySegmento[r.segmento_factura].count++
      bySegmento[r.segmento_factura].mrr += r.mrr_limpio
    }

    /* Top 15 por LTV acumulado */
    const topByLtv = [...all]
      .sort((a, b) => b.importe_acumulado - a.importe_acumulado)
      .slice(0, 15)
      .map(r => ({
        cid:          r.cid,
        nombre:       r.nombre,
        clasificacion: r.clasificacion,
        importe:      r.importe_acumulado,
        meses:        r.meses_activo,
        mrr:          r.mrr_limpio,
        semaforo:     r.semaforo,
        bucket:       r.tenure_bucket,
        mrr_por_mes:  r.mrr_por_mes_facturado,
      }))

    /* MRR por mes facturado — histograma de eficiencia */
    const effBins = [0, 0, 0, 0, 0]  // <200, 200-500, 500-1000, 1000-2000, >2000
    for (const r of all) {
      const m = r.mrr_por_mes_facturado
      if (m < 200)       effBins[0]++
      else if (m < 500)  effBins[1]++
      else if (m < 1000) effBins[2]++
      else if (m < 2000) effBins[3]++
      else               effBins[4]++
    }

    return NextResponse.json({
      total,
      avgMeses:     Math.round(avgMeses * 10) / 10,
      avgMrr:       Math.round(avgMrr * 100) / 100,
      pctVerde:     total ? Math.round((verde / total) * 1000) / 10 : 0,
      totalMrr:     Math.round(totalMrr  * 100) / 100,
      totalAcum:    Math.round(totalAcum * 100) / 100,
      semaforo:     { verde, amarillo, rojo },
      mrrBySemaforo,
      byBucket,
      byClasxBucket,
      bySegmento,
      topByLtv,
      effBins,
    })
  }

  /* ── MODO: list ─────────────────────────────────────────────────── */
  if (mode === 'list') {
    const q        = (sp.get('q') ?? '').toLowerCase()
    const semaforo = sp.get('semaforo') ?? ''
    const clas     = sp.get('clas')     ?? ''
    const bucket   = sp.get('bucket')   ?? ''
    const segmento = sp.get('segmento') ?? ''
    const sortBy   = sp.get('sort')     ?? 'importe_acumulado'
    const sortDir  = sp.get('dir')      ?? 'desc'
    const page     = Math.max(1, parseInt(sp.get('page') ?? '1'))
    const size     = Math.min(100, parseInt(sp.get('size') ?? '50'))

    let filtered = all
    if (q)        filtered = filtered.filter(r =>
      r.cid.toLowerCase().includes(q) || r.nombre.toLowerCase().includes(q))
    if (semaforo) filtered = filtered.filter(r => r.semaforo         === semaforo)
    if (clas)     filtered = filtered.filter(r => r.clasificacion    === clas)
    if (bucket)   filtered = filtered.filter(r => r.tenure_bucket    === bucket)
    if (segmento) filtered = filtered.filter(r => r.segmento_factura === segmento)

    type Key = keyof TenureRow
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortBy as Key] ?? 0
      const bv = b[sortBy as Key] ?? 0
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

    const total  = sorted.length
    const offset = (page - 1) * size
    const slice  = sorted.slice(offset, offset + size)

    return NextResponse.json({ total, page, size, rows: slice })
  }

  return NextResponse.json({ error: 'mode not found' }, { status: 400 })
}
