import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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

/* ─── Helpers ────────────────────────────────────────────────────────── */
function calcBucket(meses: number): string {
  if (meses <= 3)  return 'Nuevos'
  if (meses <= 6)  return 'Jóvenes'
  if (meses <= 12) return 'Activos'
  if (meses <= 24) return 'Maduros'
  return 'Veteranos'
}

function calcSegmento(mrr: number): string {
  if (mrr <= 0)   return 'Sin Factura'
  if (mrr < 500)  return 'Básico'
  if (mrr < 1500) return 'Estándar'
  if (mrr < 3000) return 'Premium'
  return 'Enterprise'
}

function monthDiff(a: string, b: string): number {
  if (!a || !b) return 1
  const da = new Date(a.length === 7 ? a + '-01' : a)
  const db = new Date(b.length === 7 ? b + '-01' : b)
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return 1
  return Math.max(1, (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth()) + 1)
}

function calcSemaforo(ultimaFecha: string, mrr: number): 'verde' | 'amarillo' | 'rojo' {
  if (!ultimaFecha || mrr <= 0) return 'rojo'
  const ultima = new Date(ultimaFecha.length === 7 ? ultimaFecha + '-01' : ultimaFecha)
  if (isNaN(ultima.getTime())) return 'rojo'
  const diffMonths = (Date.now() - ultima.getTime()) / (1000 * 60 * 60 * 24 * 30.5)
  if (diffMonths <= 1.5) return 'verde'
  if (diffMonths <= 3.5) return 'amarillo'
  return 'rojo'
}

/* ─── Lazy cache (5 min TTL) ─────────────────────────────────────────── */
let _cache: TenureRow[] | null = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

async function buildTenure(): Promise<TenureRow[]> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache

  const allRows: {
    cid: string; empresa: string; facturacion: number | null
    primera_factura: string | null; ultima_factura: string | null
    clasificacion: string | null
  }[] = []

  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('cuentas')
      .select('cid, empresa, facturacion, primera_factura, ultima_factura, clasificacion')
      .not('cid', 'is', null)
      .not('primera_factura', 'is', null)
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  _cache = allRows.map(c => {
    const mrr         = c.facturacion ?? 0
    const primera     = c.primera_factura ?? ''
    const ultima      = c.ultima_factura ?? ''
    const mesesActivo = monthDiff(primera, ultima)
    const acumulado   = Math.round(mrr * mesesActivo * 100) / 100

    return {
      cid:                   c.cid ?? 'UNKNOWN',
      nombre:                c.empresa ?? '',
      clasificacion:         c.clasificacion ?? 'N/A',
      segmento_factura:      calcSegmento(mrr),
      meses_activo:          mesesActivo,
      meses_con_factura:     mrr > 0 ? mesesActivo : 0,
      primera_factura:       primera,
      ultima_factura:        ultima,
      mrr_limpio:            Math.round(mrr * 100) / 100,
      importe_acumulado:     acumulado,
      mrr_por_mes_facturado: mrr > 0 ? Math.round(mrr * 100) / 100 : 0,
      semaforo:              calcSemaforo(ultima, mrr),
      total_facturas:        mrr > 0 ? mesesActivo : 0,
      tenure_bucket:         calcBucket(mesesActivo),
    }
  })

  _cacheTime = Date.now()
  return _cache!
}

/* ─── Handler ────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
  const sp   = req.nextUrl.searchParams
  const mode = sp.get('mode') ?? 'stats'
  const all  = await buildTenure()

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
    const topByLtv = Array.from(all)
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
    const sorted = Array.from(filtered).sort((a, b) => {
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
