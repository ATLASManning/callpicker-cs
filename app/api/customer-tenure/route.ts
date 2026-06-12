import { NextRequest, NextResponse } from 'next/server'
import { getLtvRows } from '@/lib/zoho-ltv'
import type { SemaforoKey } from '@/lib/zoho-ltv'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

const BUCKET_ORDER = ['Sin Actividad', 'Nuevos', 'Jóvenes', 'Activos', 'Maduros', 'Veteranos']

function round2(n: number) { return Math.round(n * 100) / 100 }

/* ─── Handler ────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const sp   = req.nextUrl.searchParams
    const mode = sp.get('mode') ?? 'stats'
    const all  = await getLtvRows()

    /* ── STATS ───────────────────────────────────────────────────────── */
    if (mode === 'stats') {
      const total      = all.length
      const activos    = all.filter(r => r.semaforo_key === 'activo')
      const totalMrr   = round2(activos.reduce((s, r) => s + r.mrr_limpio, 0))
      const totalLtv   = round2(all.reduce((s, r) => s + r.importe_acumulado_recurrente, 0))
      const avgMeses   = total ? round2(all.reduce((s, r) => s + r.meses_activo, 0) / total) : 0

      /* Semáforo counts + MRR */
      const semKeys: SemaforoKey[] = ['nuevo', 'activo', 'riesgo', 'inactivo', 'dormido']
      const bySemaforo = Object.fromEntries(
        semKeys.map(k => [k, {
          count: all.filter(r => r.semaforo_key === k).length,
          mrr:   round2(all.filter(r => r.semaforo_key === k).reduce((s, r) => s + r.mrr_limpio, 0)),
          label: all.find(r => r.semaforo_key === k)?.semaforo_actividad ?? k,
        }])
      ) as Record<SemaforoKey, { count: number; mrr: number; label: string }>

      /* Tenure buckets */
      const bucketMap: Record<string, { count: number; mrr: number; ltv: number }> = {}
      for (const r of all) {
        const b = r.tenure_bucket
        if (!bucketMap[b]) bucketMap[b] = { count: 0, mrr: 0, ltv: 0 }
        bucketMap[b].count++
        bucketMap[b].mrr += r.mrr_limpio
        bucketMap[b].ltv += r.importe_acumulado_recurrente
      }
      const byBucket = BUCKET_ORDER.filter(b => bucketMap[b]).map(b => ({
        bucket: b,
        count:  bucketMap[b].count,
        mrr:    round2(bucketMap[b].mrr),
        ltv:    round2(bucketMap[b].ltv),
        avgMrr: round2(bucketMap[b].mrr / bucketMap[b].count),
      }))

      /* Tamaño empresa */
      const tamanoMap: Record<string, { count: number; mrr: number }> = {}
      for (const r of all) {
        const t = r.tamano_empresa || 'N/A'
        if (!tamanoMap[t]) tamanoMap[t] = { count: 0, mrr: 0 }
        tamanoMap[t].count++
        tamanoMap[t].mrr += r.mrr_limpio
      }
      const byTamano = Object.entries(tamanoMap)
        .sort((a, b) => b[1].mrr - a[1].mrr)
        .map(([tamano, v]) => ({ tamano, count: v.count, mrr: round2(v.mrr) }))

      /* Clasificación LTV */
      const clasLtvMap: Record<string, { count: number; mrr: number }> = {}
      for (const r of all) {
        const c = r.clasificacion_ltv || 'N/A'
        if (!clasLtvMap[c]) clasLtvMap[c] = { count: 0, mrr: 0 }
        clasLtvMap[c].count++
        clasLtvMap[c].mrr += r.mrr_limpio
      }
      const byClasLtv = Object.entries(clasLtvMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([clas, v]) => ({ clas, count: v.count, mrr: round2(v.mrr) }))

      /* Cohort retention by year */
      const cohortMap: Record<number, { total: number; activos: number; mrr: number }> = {}
      for (const r of all) {
        if (!r.cohorte_year) continue
        const y = r.cohorte_year
        if (!cohortMap[y]) cohortMap[y] = { total: 0, activos: 0, mrr: 0 }
        cohortMap[y].total++
        if (r.semaforo_key === 'activo') { cohortMap[y].activos++; cohortMap[y].mrr += r.mrr_limpio }
      }
      const byCohort = Object.entries(cohortMap)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([year, v]) => ({
          year: Number(year),
          total: v.total,
          activos: v.activos,
          pctRetention: v.total ? round2((v.activos / v.total) * 100) : 0,
          mrr: round2(v.mrr),
        }))

      /* Risk alerts: active clients with highest dias_sin_factura */
      const riskAlerts = Array.from(
        all.filter(r => r.semaforo_key === 'activo' && r.dias_sin_factura > 30)
      )
        .sort((a, b) => b.dias_sin_factura - a.dias_sin_factura)
        .slice(0, 10)
        .map(r => ({
          id_cliente:     r.id_cliente,
          nombre_cliente: r.nombre_cliente,
          tamano_empresa: r.tamano_empresa,
          mrr_limpio:     r.mrr_limpio,
          dias_sin_factura: r.dias_sin_factura,
          ultima_factura: r.ultima_factura,
          clasificacion_ltv: r.clasificacion_ltv,
        }))

      /* Top 20 by LTV */
      const topLtv = Array.from(all)
        .sort((a, b) => b.importe_acumulado_recurrente - a.importe_acumulado_recurrente)
        .slice(0, 20)
        .map(r => ({
          id_cliente:                   r.id_cliente,
          nombre_cliente:               r.nombre_cliente,
          tamano_empresa:               r.tamano_empresa,
          clasificacion_ltv:            r.clasificacion_ltv,
          meses_activo:                 r.meses_activo,
          mrr_limpio:                   r.mrr_limpio,
          importe_acumulado_recurrente: r.importe_acumulado_recurrente,
          semaforo_key:                 r.semaforo_key,
          semaforo_actividad:           r.semaforo_actividad,
          primera_factura:              r.primera_factura,
          tenure_bucket:                r.tenure_bucket,
        }))

      /* MRR efficiency histogram */
      const effBins = [0, 0, 0, 0, 0]
      for (const r of all.filter(r => r.mrr_por_mes_facturado > 0)) {
        const m = r.mrr_por_mes_facturado
        if      (m < 200)  effBins[0]++
        else if (m < 500)  effBins[1]++
        else if (m < 1000) effBins[2]++
        else if (m < 2000) effBins[3]++
        else               effBins[4]++
      }

      /* One-timers */
      const oneTimers    = all.filter(r => r.es_one_timer).length
      const multiTimers  = total - oneTimers
      const oneTimerMrr  = round2(all.filter(r => r.es_one_timer).reduce((s, r) => s + r.mrr_limpio, 0))

      return NextResponse.json({
        total,
        totalActivos:  activos.length,
        totalMrr,
        totalLtv,
        avgMeses,
        bySemaforo,
        byBucket,
        byTamano,
        byClasLtv,
        byCohort,
        riskAlerts,
        topLtv,
        effBins,
        oneTimers,
        multiTimers,
        oneTimerMrr,
        cacheAge: Math.round((Date.now() - (Date.now() - 0)) / 1000),
      })
    }

    /* ── LIST ────────────────────────────────────────────────────────── */
    if (mode === 'list') {
      const q       = (sp.get('q') ?? '').toLowerCase()
      const sem     = sp.get('sem')    ?? ''
      const tamano  = sp.get('tamano') ?? ''
      const bucket  = sp.get('bucket') ?? ''
      const sortBy  = sp.get('sort')   ?? 'importe_acumulado_recurrente'
      const sortDir = sp.get('dir')    ?? 'desc'
      const page    = Math.max(1, parseInt(sp.get('page') ?? '1'))
      const size    = Math.min(100, parseInt(sp.get('size') ?? '50'))

      type K = keyof typeof all[0]

      let filtered = all
      if (q)      filtered = filtered.filter(r =>
        r.nombre_cliente.toLowerCase().includes(q) || r.id_cliente.includes(q))
      if (sem)    filtered = filtered.filter(r => r.semaforo_key === sem)
      if (tamano) filtered = filtered.filter(r => r.tamano_empresa === tamano)
      if (bucket) filtered = filtered.filter(r => r.tenure_bucket === bucket)

      const sorted = Array.from(filtered).sort((a, b) => {
        const av = (a[sortBy as K] ?? 0) as number | string
        const bv = (b[sortBy as K] ?? 0) as number | string
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })

      const total  = sorted.length
      const offset = (page - 1) * size

      return NextResponse.json({
        total, page, size,
        rows: sorted.slice(offset, offset + size),
      })
    }

    return NextResponse.json({ error: 'mode not found' }, { status: 400 })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[customer-tenure]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
