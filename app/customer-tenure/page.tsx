'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import {
  Clock, Users, DollarSign, TrendingUp, Search,
  ChevronLeft, ChevronRight, Circle, Award, CalendarDays,
  BarChart2, ShieldCheck, AlertTriangle, XCircle,
} from 'lucide-react'

/* ══════════════════════════════════════════════════════════════════════
   TIPOS
══════════════════════════════════════════════════════════════════════ */
type TabT = 'overview' | 'explorer'
type Semaforo = 'verde' | 'amarillo' | 'rojo'

interface TenureStats {
  total:        number
  avgMeses:     number
  avgMrr:       number
  pctVerde:     number
  totalMrr:     number
  totalAcum:    number
  semaforo:     Record<Semaforo, number>
  mrrBySemaforo: Record<Semaforo, number>
  byBucket: { bucket: string; count: number; mrr: number; avgMrr: number; avgMeses: number; acum: number }[]
  byClasxBucket: Record<string, Record<string, number>>
  bySegmento:    Record<string, { count: number; mrr: number }>
  topByLtv: { cid: string; nombre: string; clasificacion: string; importe: number; meses: number; mrr: number; semaforo: Semaforo; bucket: string; mrr_por_mes: number }[]
  effBins: number[]
}

interface TenureRow {
  cid: string; nombre: string; clasificacion: string; segmento_factura: string
  meses_activo: number; meses_con_factura: number
  primera_factura: string; ultima_factura: string
  mrr_limpio: number; importe_acumulado: number; mrr_por_mes_facturado: number
  semaforo: Semaforo; total_facturas: number; tenure_bucket: string
}

/* ══════════════════════════════════════════════════════════════════════
   CONFIGURACIÓN DE COLORES Y LABELS
══════════════════════════════════════════════════════════════════════ */
const SEMAFORO_CFG: Record<Semaforo, {
  label: string; Icon: React.ElementType
  dot: string; bg: string; border: string; text: string; textMuted: string
}> = {
  verde: {
    label: 'Activo', Icon: ShieldCheck,
    dot: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', textMuted: '#4ade80',
  },
  amarillo: {
    label: 'En Riesgo', Icon: AlertTriangle,
    dot: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#b45309', textMuted: '#fbbf24',
  },
  rojo: {
    label: 'Inactivo', Icon: XCircle,
    dot: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', textMuted: '#f87171',
  },
}

const BUCKET_CFG: Record<string, { color: string; bg: string; range: string }> = {
  'Nuevos':    { color: '#8b5cf6', bg: '#f5f3ff', range: '1–3 meses'  },
  'Jóvenes':   { color: '#3b82f6', bg: '#eff6ff', range: '4–6 meses'  },
  'Activos':   { color: '#22c55e', bg: '#f0fdf4', range: '7–12 meses' },
  'Maduros':   { color: '#f59e0b', bg: '#fffbeb', range: '13–24 meses'},
  'Veteranos': { color: '#f97316', bg: '#fff7ed', range: '25+ meses'  },
}

const CLAS_COLOR: Record<string, string> = {
  AAA: '#6366f1', Mediana: '#3b82f6', Pequeña: '#22c55e',
}

const BUCKET_ORDER = ['Nuevos', 'Jóvenes', 'Activos', 'Maduros', 'Veteranos']

/* ══════════════════════════════════════════════════════════════════════
   HELPERS DE FORMATO
══════════════════════════════════════════════════════════════════════ */
function fmtMrr(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
const fmtNum = (n: number) => n.toLocaleString('es-MX')
const fmtDate = (d: string) => d ? d.slice(0, 7) : '—'

/* ══════════════════════════════════════════════════════════════════════
   SUBCOMPONENTES
══════════════════════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold mt-0.5 truncate" style={{ color }}>{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SemaforoDot({ s }: { s: Semaforo }) {
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0"
    style={{ background: SEMAFORO_CFG[s].dot }} />
}

function BucketBadge({ b }: { b: string }) {
  const cfg = BUCKET_CFG[b]
  if (!cfg) return <span className="text-xs text-gray-500">{b}</span>
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {b}
    </span>
  )
}

function ClasBadge({ c }: { c: string }) {
  const color = CLAS_COLOR[c] ?? '#6b7280'
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: color + '18', color }}>
      {c}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════════════ */
export default function CustomerTenurePage() {
  const [stats, setStats]       = useState<TenureStats | null>(null)
  const [loadingStats, setLS]   = useState(true)
  const [tab, setTab]           = useState<TabT>('overview')

  /* ─── Explorer state ─────────────────────────────────────────────── */
  const [rows, setRows]         = useState<TenureRow[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [q, setQ]               = useState('')
  const [fSem, setFSem]         = useState('')
  const [fClas, setFClas]       = useState('')
  const [fBucket, setFBucket]   = useState('')
  const [loadingList, setLL]    = useState(false)
  const [sortBy, setSortBy]     = useState('importe_acumulado')
  const [sortDir, setSortDir]   = useState<'asc'|'desc'>('desc')

  const SIZE = 50

  /* ─── Cargar stats ───────────────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/customer-tenure?mode=stats')
      .then(r => r.json())
      .then(d => { if (d && !d.error && d.total !== undefined) setStats(d); setLS(false) })
      .catch(() => setLS(false))
  }, [])

  /* ─── Cargar lista ───────────────────────────────────────────────── */
  const loadList = useCallback(async (pg = page) => {
    setLL(true)
    const params = new URLSearchParams({
      mode: 'list', page: String(pg), size: String(SIZE),
      sort: sortBy, dir: sortDir,
    })
    if (q)       params.set('q', q)
    if (fSem)    params.set('semaforo', fSem)
    if (fClas)   params.set('clas', fClas)
    if (fBucket) params.set('bucket', fBucket)

    const data = await fetch(`/api/customer-tenure?${params}`).then(r => r.json())
    setRows(data.rows ?? [])
    setTotal(data.total ?? 0)
    setLL(false)
  }, [page, q, fSem, fClas, fBucket, sortBy, sortDir])

  useEffect(() => {
    if (tab === 'explorer') loadList(1).then(() => setPage(1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, fSem, fClas, fBucket, sortBy, sortDir])

  useEffect(() => {
    if (tab === 'explorer') loadList(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const totalPages = Math.ceil(total / SIZE)

  /* ─── KPI data ───────────────────────────────────────────────────── */
  const kpis = stats ? [
    { icon: Users,       label: 'Clientes únicos',      value: fmtNum(stats.total),                 sub: 'en base histórica de facturación',                color: '#6366f1' },
    { icon: Clock,       label: 'Antigüedad promedio',   value: `${stats.avgMeses} meses`,           sub: `${Math.round(stats.avgMeses / 12 * 10) / 10} años por cliente`,   color: '#3b82f6' },
    { icon: DollarSign,  label: 'MRR total activo',      value: fmtMrr(stats.totalMrr),             sub: `LTV acumulado: ${fmtMrr(stats.totalAcum)}`,        color: '#22c55e' },
    { icon: TrendingUp,  label: 'Semáforo verde',        value: `${stats.pctVerde}%`,               sub: `${fmtNum(stats.semaforo.verde)} clientes activos`, color: '#f59e0b' },
  ] : []

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Customer Tenure"
        subtitle="Antigüedad, ciclo de vida y semáforo de actividad por cliente"
      />

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <div className="px-6 pb-4 grid grid-cols-4 gap-4">
        {loadingStats
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />
            ))
          : kpis.map(k => <KpiCard key={k.label} {...k} />)
        }
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="px-6 pb-0">
        <div className="flex gap-1 border-b border-gray-200">
          {([['overview', 'Visión General', BarChart2], ['explorer', 'Explorador', Search]] as const).map(([t, lbl, Icon]) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
              style={tab === t
                ? { color: '#1B3FCC', borderColor: '#1B3FCC' }
                : { color: '#6b7280', borderColor: 'transparent' }
              }>
              <Icon size={14} />
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido scrollable ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* ════════════════════════════════════════════════════════════
            TAB: VISIÓN GENERAL
        ════════════════════════════════════════════════════════════ */}
        {tab === 'overview' && stats && (
          <>
            {/* ── Semáforo de Actividad ──────────────────────────── */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Circle size={13} fill="currentColor" className="text-gray-400" />
                Semáforo de Actividad
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {(['verde', 'amarillo', 'rojo'] as Semaforo[]).map(s => {
                  const cfg  = SEMAFORO_CFG[s]
                  const cnt  = stats.semaforo[s]
                  const mrr  = stats.mrrBySemaforo[s]
                  const pct  = stats.total ? ((cnt / stats.total) * 100).toFixed(1) : '0'
                  const Icon = cfg.Icon
                  return (
                    <div key={s} className="rounded-xl border p-5 shadow-sm"
                      style={{ background: cfg.bg, borderColor: cfg.border }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon size={18} style={{ color: cfg.dot }} />
                          <span className="text-sm font-bold" style={{ color: cfg.text }}>{cfg.label}</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.dot + '22', color: cfg.text }}>
                          {pct}%
                        </span>
                      </div>
                      <p className="text-3xl font-extrabold mb-1" style={{ color: cfg.text }}>
                        {fmtNum(cnt)}
                      </p>
                      <p className="text-xs font-medium" style={{ color: cfg.text }}>clientes</p>
                      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${cfg.border}` }}>
                        <p className="text-[11px] font-medium" style={{ color: cfg.text }}>
                          MRR comprometido
                        </p>
                        <p className="text-lg font-bold" style={{ color: cfg.dot }}>
                          {fmtMrr(mrr)}
                        </p>
                      </div>
                      {/* mini progress bar */}
                      <div className="mt-2 h-1.5 rounded-full bg-white overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: cfg.dot }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── Distribución por Antigüedad + Matriz ─────────────── */}
            <div className="grid grid-cols-5 gap-4">

              {/* Tenure buckets — 3/5 de ancho */}
              <section className="col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  Distribución por Antigüedad
                </h2>
                <div className="space-y-3">
                  {(() => {
                    const maxCount = Math.max(...stats.byBucket.map(b => b.count), 1)
                    return BUCKET_ORDER.filter(name => stats.byBucket.find(b => b.bucket === name)).map(name => {
                      const b   = stats.byBucket.find(x => x.bucket === name)!
                      const cfg = BUCKET_CFG[name]
                      const w   = Math.round((b.count / maxCount) * 100)
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ background: cfg.color }} />
                              <span className="text-xs font-semibold text-gray-700">{name}</span>
                              <span className="text-[10px] text-gray-400">{cfg.range}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="font-bold text-gray-700">{fmtNum(b.count)}</span>
                              <span>{fmtMrr(b.mrr)}</span>
                              <span className="text-gray-400">avg {fmtMrr(b.avgMrr)}/cliente</span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${w}%`, background: cfg.color }} />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>

                {/* Eficiencia MRR/mes */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Eficiencia facturada (MRR / mes activo)
                  </p>
                  <div className="flex gap-2">
                    {['&lt;$200','$200–500','$500–1K','$1K–2K','&gt;$2K'].map((lbl, i) => {
                      const cnt = stats.effBins[i] ?? 0
                      const max = Math.max(...stats.effBins, 1)
                      const h   = Math.max(4, Math.round((cnt / max) * 60))
                      const colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#6366f1']
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                            <div className="w-full rounded-t"
                              style={{ height: h, background: colors[i] }} />
                          </div>
                          <span className="text-[9px] text-gray-500 text-center"
                            dangerouslySetInnerHTML={{ __html: lbl }} />
                          <span className="text-[10px] font-bold text-gray-700">{fmtNum(cnt)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>

              {/* Clasificación × Tenure matrix — 2/5 de ancho */}
              <section className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Award size={14} className="text-gray-400" />
                  Clasificación × Tenure
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left pb-2 text-gray-500 font-medium">Clas.</th>
                        {BUCKET_ORDER.map(b => (
                          <th key={b} className="pb-2 text-center font-medium"
                            style={{ color: BUCKET_CFG[b]?.color ?? '#6b7280' }}>
                            {b.slice(0, 3)}
                          </th>
                        ))}
                        <th className="pb-2 text-center text-gray-500 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.byClasxBucket).map(([clas, buckets]) => {
                        const rowTotal = Object.values(buckets).reduce((s, v) => s + v, 0)
                        const color    = CLAS_COLOR[clas] ?? '#6b7280'
                        return (
                          <tr key={clas} className="border-t border-gray-50">
                            <td className="py-2 pr-2">
                              <span className="font-semibold" style={{ color }}>{clas}</span>
                            </td>
                            {BUCKET_ORDER.map(b => {
                              const val = buckets[b] ?? 0
                              const intensity = rowTotal ? val / rowTotal : 0
                              return (
                                <td key={b} className="py-2 text-center">
                                  {val > 0 ? (
                                    <span className="inline-flex items-center justify-center w-7 h-5 rounded text-[10px] font-bold"
                                      style={{
                                        background: (BUCKET_CFG[b]?.color ?? '#6b7280') + Math.round(intensity * 200 + 20).toString(16).padStart(2,'0'),
                                        color: intensity > 0.4 ? '#fff' : BUCKET_CFG[b]?.color ?? '#6b7280'
                                      }}>
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-gray-200">—</span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="py-2 text-center font-bold text-gray-700">{fmtNum(rowTotal)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Segmento por MRR */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Segmento por MRR actual</p>
                  <div className="space-y-1.5">
                    {Object.entries(stats.bySegmento)
                      .sort((a, b) => b[1].mrr - a[1].mrr)
                      .map(([seg, v]) => {
                        const total = stats.total
                        const w = total ? Math.round((v.count / total) * 100) : 0
                        return (
                          <div key={seg} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 w-20 truncate">{seg}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-indigo-400"
                                style={{ width: `${w}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-700 w-8 text-right">
                              {fmtNum(v.count)}
                            </span>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </section>
            </div>

            {/* ── Top 15 por LTV ────────────────────────────────────── */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Award size={15} className="text-amber-400" />
                <span className="text-sm font-semibold text-gray-700">Top 15 — Mayor LTV Acumulado</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#','CID','Cliente','Clas.','Bucket','Meses','Primera F.','Última F.','MRR','LTV Acumulado','MRR/mes'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topByLtv.map((r, i) => (
                      <tr key={r.cid} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-bold text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2.5 font-mono text-gray-500 text-[10px]">{r.cid}</td>
                        <td className="px-3 py-2.5 font-semibold text-gray-800 max-w-[180px] truncate">{r.nombre}</td>
                        <td className="px-3 py-2.5"><ClasBadge c={r.clasificacion} /></td>
                        <td className="px-3 py-2.5"><BucketBadge b={r.bucket} /></td>
                        <td className="px-3 py-2.5 font-semibold text-gray-700">{r.meses}</td>
                        <td className="px-3 py-2.5 text-gray-500">—</td>
                        <td className="px-3 py-2.5 text-gray-500">—</td>
                        <td className="px-3 py-2.5 font-semibold text-indigo-600">{fmtMrr(r.mrr)}</td>
                        <td className="px-3 py-2.5 font-bold text-gray-900">{fmtMrr(r.importe)}</td>
                        <td className="px-3 py-2.5 text-gray-500">{fmtMrr(r.mrr_por_mes)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <SemaforoDot s={r.semaforo} />
                            <span style={{ color: SEMAFORO_CFG[r.semaforo].text }} className="font-medium">
                              {SEMAFORO_CFG[r.semaforo].label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: EXPLORADOR
        ════════════════════════════════════════════════════════════ */}
        {tab === 'explorer' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex flex-wrap gap-3 items-center">
                {/* Búsqueda */}
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Buscar por nombre o CID…"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  />
                </div>

                {/* Semáforo */}
                <select value={fSem} onChange={e => setFSem(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white text-gray-700">
                  <option value="">Todos los semáforos</option>
                  <option value="verde">🟢 Activo</option>
                  <option value="amarillo">🟡 En Riesgo</option>
                  <option value="rojo">🔴 Inactivo</option>
                </select>

                {/* Clasificación */}
                <select value={fClas} onChange={e => setFClas(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white text-gray-700">
                  <option value="">Todas las clasificaciones</option>
                  {['AAA','Mediana','Pequeña'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Bucket */}
                <select value={fBucket} onChange={e => setFBucket(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white text-gray-700">
                  <option value="">Todos los segmentos</option>
                  {['Nuevos','Jóvenes','Activos','Maduros','Veteranos'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <span className="text-xs text-gray-400 ml-auto">
                  {fmtNum(total)} clientes
                </span>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {[
                        { label: 'CID',             col: 'cid' },
                        { label: 'Cliente',          col: 'nombre' },
                        { label: 'Clas.',            col: 'clasificacion' },
                        { label: 'Segmento',         col: 'segmento_factura' },
                        { label: 'Bucket',           col: 'tenure_bucket' },
                        { label: 'Semáforo',         col: 'semaforo' },
                        { label: 'Meses Activo',     col: 'meses_activo' },
                        { label: 'Meses c/Factura',  col: 'meses_con_factura' },
                        { label: 'Primera Factura',  col: 'primera_factura' },
                        { label: 'Última Factura',   col: 'ultima_factura' },
                        { label: 'MRR',              col: 'mrr_limpio' },
                        { label: 'LTV Acumulado',    col: 'importe_acumulado' },
                        { label: 'MRR/mes',          col: 'mrr_por_mes_facturado' },
                      ].map(({ label, col }) => (
                        <th key={col}
                          className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap cursor-pointer select-none hover:text-gray-700"
                          onClick={() => toggleSort(col)}>
                          {label}
                          {sortBy === col && (
                            <span className="ml-1 text-indigo-500">
                              {sortDir === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingList ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="border-t border-gray-50">
                          {Array.from({ length: 13 }).map((_, j) => (
                            <td key={j} className="px-3 py-3">
                              <div className="h-3 bg-gray-100 rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="px-6 py-12 text-center text-gray-400 text-sm">
                          No se encontraron clientes con los filtros aplicados.
                        </td>
                      </tr>
                    ) : rows.map(r => (
                      <tr key={r.cid} className="border-t border-gray-50 hover:bg-indigo-50/30">
                        <td className="px-3 py-2.5 font-mono text-gray-500 text-[10px]">{r.cid}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[180px] truncate">{r.nombre}</td>
                        <td className="px-3 py-2.5"><ClasBadge c={r.clasificacion} /></td>
                        <td className="px-3 py-2.5 text-gray-600">{r.segmento_factura}</td>
                        <td className="px-3 py-2.5"><BucketBadge b={r.tenure_bucket} /></td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <SemaforoDot s={r.semaforo} />
                            <span style={{ color: SEMAFORO_CFG[r.semaforo].text }} className="font-medium text-[10px]">
                              {SEMAFORO_CFG[r.semaforo].label}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-gray-700 text-center">{r.meses_activo}</td>
                        <td className="px-3 py-2.5 text-gray-500 text-center">{r.meses_con_factura}</td>
                        <td className="px-3 py-2.5 text-gray-500">{fmtDate(r.primera_factura)}</td>
                        <td className="px-3 py-2.5 text-gray-500">{fmtDate(r.ultima_factura)}</td>
                        <td className="px-3 py-2.5 font-semibold text-indigo-600">{fmtMrr(r.mrr_limpio)}</td>
                        <td className="px-3 py-2.5 font-bold text-gray-900">{fmtMrr(r.importe_acumulado)}</td>
                        <td className="px-3 py-2.5 text-gray-500">{fmtMrr(r.mrr_por_mes_facturado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Página {page} de {totalPages} · {fmtNum(total)} clientes
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pg = page <= 3
                        ? i + 1
                        : page >= totalPages - 2
                          ? totalPages - 4 + i
                          : page - 2 + i
                      if (pg < 1 || pg > totalPages) return null
                      return (
                        <button key={pg} onClick={() => setPage(pg)}
                          className="w-7 h-7 rounded-lg text-xs font-medium border transition-colors"
                          style={page === pg
                            ? { background: '#1B3FCC', color: '#fff', borderColor: '#1B3FCC' }
                            : { background: '#fff', color: '#374151', borderColor: '#e5e7eb' }
                          }>
                          {pg}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
