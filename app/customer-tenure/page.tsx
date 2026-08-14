'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import type { SemaforoKey } from '@/lib/zoho-ltv'
import {
  Users, DollarSign, TrendingUp, Clock, Search,
  ShieldCheck, AlertTriangle, XCircle, Zap, ChevronLeft,
  ChevronRight, CalendarDays, Award, BarChart2, RefreshCw,
} from 'lucide-react'

/* ══════════════════════════════════════════════════════════════════
   TIPOS
══════════════════════════════════════════════════════════════════ */
type TabT = 'overview' | 'cohort' | 'explorer'

interface SemaforoInfo { count: number; mrr: number; label: string }

interface Stats {
  total: number; totalActivos: number; totalMrr: number; totalLtv: number; avgMeses: number
  bySemaforo: Record<SemaforoKey, SemaforoInfo>
  byBucket:   { bucket: string; count: number; mrr: number; ltv: number; avgMrr: number }[]
  byTamano:   { tamano: string; count: number; mrr: number }[]
  byClasLtv:  { clas: string; count: number; mrr: number }[]
  byCohort:   { year: number; total: number; activos: number; pctRetention: number; mrr: number }[]
  riskAlerts: { id_cliente: string; nombre_cliente: string; tamano_empresa: string; mrr_limpio: number; dias_sin_factura: number; ultima_factura: string; clasificacion_ltv: string }[]
  topLtv:     { id_cliente: string; nombre_cliente: string; tamano_empresa: string; clasificacion_ltv: string; meses_activo: number; mrr_limpio: number; importe_acumulado_recurrente: number; semaforo_key: SemaforoKey; semaforo_actividad: string; primera_factura: string; tenure_bucket: string }[]
  effBins:    number[]
  oneTimers:  number; multiTimers: number; oneTimerMrr: number
}

interface ExplorerRow {
  id_cliente: string; nombre_cliente: string; tamano_empresa: string
  clasificacion_ltv: string; clasificacion_cliente: string
  meses_activo: number; meses_con_factura: number
  primera_factura: string; ultima_factura: string
  mrr_limpio: number; importe_acumulado_recurrente: number
  semaforo_key: SemaforoKey; semaforo_actividad: string
  tenure_bucket: string; dias_sin_factura: number
  mrr_por_mes_facturado: number; es_one_timer: boolean
  rango_ltv_limpio: string; cohorte_periodo: string
}

/* ══════════════════════════════════════════════════════════════════
   SEMÁFORO CONFIG
══════════════════════════════════════════════════════════════════ */
const SEM_CFG: Record<SemaforoKey, {
  label: string; sublabel: string; Icon: React.ElementType
  color: string; bg: string; border: string; text: string; muted: string
}> = {
  nuevo:    { label: 'Nuevo', sublabel: 'Factura futura', Icon: Zap,
    color: '#6366f1', bg: '#f5f3ff', border: '#c4b5fd', text: '#4338ca', muted: '#a5b4fc' },
  activo:   { label: 'Activo', sublabel: 'Facturando regularmente', Icon: ShieldCheck,
    color: '#22c55e', bg: '#f0fdf4', border: '#86efac', text: '#15803d', muted: '#4ade80' },
  riesgo:   { label: 'En Riesgo', sublabel: 'Irregularidad detectada', Icon: AlertTriangle,
    color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', text: '#b45309', muted: '#fbbf24' },
  inactivo: { label: 'Inactivo', sublabel: 'Sin facturación reciente', Icon: XCircle,
    color: '#f97316', bg: '#fff7ed', border: '#fdba74', text: '#c2410c', muted: '#fb923c' },
  dormido:  { label: 'Dormido', sublabel: 'Churn confirmado', Icon: XCircle,
    color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', muted: '#f87171' },
}

const BUCKET_ORDER = ['Sin Actividad', 'Nuevos', 'Jóvenes', 'Activos', 'Maduros', 'Veteranos']
const BUCKET_CFG: Record<string, { color: string; bg: string; range: string }> = {
  'Sin Actividad': { color: '#94a3b8', bg: '#f8fafc', range: '0 meses' },
  'Nuevos':        { color: '#8b5cf6', bg: '#f5f3ff', range: '1–3 meses' },
  'Jóvenes':       { color: '#3b82f6', bg: '#eff6ff', range: '4–6 meses' },
  'Activos':       { color: '#22c55e', bg: '#f0fdf4', range: '7–12 meses' },
  'Maduros':       { color: '#f59e0b', bg: '#fffbeb', range: '13–24 meses' },
  'Veteranos':     { color: '#f97316', bg: '#fff7ed', range: '25+ meses' },
}
const TAMANO_CFG: Record<string, string> = {
  'Micro':      '#8b5cf6',
  'SMB':        '#3b82f6',
  'Mid-Market': '#22c55e',
  'Large':      '#f59e0b',
  'Enterprise': '#f97316',
}

/* ══════════════════════════════════════════════════════════════════
   FORMATO
══════════════════════════════════════════════════════════════════ */
function fmtM(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return '$' + n.toLocaleString('es-MX', { maximumFractionDigits: 0 })
}
const fmtN = (n: number) => n.toLocaleString('es-MX')
const fmtDate = (d: string) => d ? d.slice(0, 7) : '—'
const fmtPct  = (n: number) => `${n.toFixed(1)}%`

/* ══════════════════════════════════════════════════════════════════
   SUBCOMPONENTES
══════════════════════════════════════════════════════════════════ */
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

function SemDot({ k }: { k: SemaforoKey }) {
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0"
    style={{ background: SEM_CFG[k]?.color ?? '#94a3b8' }} />
}

function SemBadge({ k, label }: { k: SemaforoKey; label?: string }) {
  const cfg = SEM_CFG[k]
  if (!cfg) return null
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
      {label ?? cfg.label}
    </span>
  )
}

function BucketBadge({ b }: { b: string }) {
  const cfg = BUCKET_CFG[b]
  if (!cfg) return <span className="text-xs text-gray-400">{b}</span>
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {b}
    </span>
  )
}

function BarRow({ label, value, max, color, right }: {
  label: string; value: number; max: number; color: string; right: string
}) {
  const w = max ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between mb-1 text-xs">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">{right}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════════ */
export default function CustomerTenurePage() {
  const [stats, setStats]       = useState<Stats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<TabT>('overview')
  const [refreshing, setRef]    = useState(false)

  /* Explorer state */
  const [rows, setRows]         = useState<ExplorerRow[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [q, setQ]               = useState('')
  const [fSem, setFSem]         = useState('')
  const [fTamano, setFTamano]   = useState('')
  const [fBucket, setFBucket]   = useState('')
  const [loadList, setLL]       = useState(false)
  const [sortBy, setSortBy]     = useState('importe_acumulado_recurrente')
  const [sortDir, setSortDir]   = useState<'asc'|'desc'>('desc')
  const SIZE = 50

  /* ── Cargar stats ─────────────────────────────────────────────── */
  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const d = await fetch('/api/customer-tenure?mode=stats').then(r => r.json())
      if (d && !d.error && d.total !== undefined) setStats(d)
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const handleRefresh = async () => {
    setRef(true)
    await fetch('/api/cron/refresh-tenure')
    await loadStats()
    setRef(false)
  }

  /* ── Cargar explorador ────────────────────────────────────────── */
  const loadExplorer = useCallback(async (pg = page) => {
    setLL(true)
    const p = new URLSearchParams({ mode: 'list', page: String(pg), size: String(SIZE), sort: sortBy, dir: sortDir })
    if (q)       p.set('q', q)
    if (fSem)    p.set('sem', fSem)
    if (fTamano) p.set('tamano', fTamano)
    if (fBucket) p.set('bucket', fBucket)
    const d = await fetch(`/api/customer-tenure?${p}`).then(r => r.json())
    setRows(d.rows ?? [])
    setTotal(d.total ?? 0)
    setLL(false)
  }, [page, q, fSem, fTamano, fBucket, sortBy, sortDir])

  useEffect(() => {
    if (tab === 'explorer') { setPage(1); loadExplorer(1) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, fSem, fTamano, fBucket, sortBy, sortDir])

  useEffect(() => {
    if (tab === 'explorer') loadExplorer(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const totalPages = Math.ceil(total / SIZE)

  /* ── KPIs ─────────────────────────────────────────────────────── */
  const kpis = stats ? [
    { icon: Users,      label: 'Clientes registrados', value: fmtN(stats.total),
      sub: `${fmtN(stats.totalActivos)} activos hoy`,                 color: '#6366f1' },
    { icon: Clock,      label: 'Antigüedad promedio',  value: `${stats.avgMeses} meses`,
      sub: `${(stats.avgMeses / 12).toFixed(1)} años por cliente`,    color: '#3b82f6' },
    { icon: DollarSign, label: 'MRR activo',           value: fmtM(stats.totalMrr),
      sub: `avg ${fmtM(stats.totalActivos ? stats.totalMrr / stats.totalActivos : 0)}/cliente`, color: '#22c55e' },
    { icon: TrendingUp, label: 'LTV acumulado total',  value: fmtM(stats.totalLtv),
      sub: `avg ${fmtM(stats.total ? stats.totalLtv / stats.total : 0)}/cliente`, color: '#f59e0b' },
  ] : []

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Customer Tenure"
        subtitle="Antigüedad, ciclo de vida y semáforo de actividad por cliente — datos Zoho Analytics"
      />

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-4 pb-2">
        <div className="grid grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />
              ))
            : kpis.map(k => <KpiCard key={k.label} {...k} />)
          }
        </div>
        {/* Refresh button */}
        <div className="flex justify-end mt-2">
          <button onClick={handleRefresh} disabled={refreshing || loading}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-40">
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Actualizando desde Zoho…' : 'Actualizar datos'}
          </button>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="px-6">
        <div className="flex gap-1 border-b border-gray-200">
          {([
            ['overview', 'Visión General', BarChart2],
            ['cohort',   'Análisis Cohorte', CalendarDays],
            ['explorer', 'Explorador', Search],
          ] as const).map(([t, lbl, Icon]) => (
            <button key={t} onClick={() => setTab(t as TabT)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
              style={tab === t
                ? { color: '#1B3FCC', borderColor: '#1B3FCC' }
                : { color: '#6b7280', borderColor: 'transparent' }}>
              <Icon size={14} />{lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* ════════════════════════════════════════════════════════
            TAB: VISIÓN GENERAL
        ════════════════════════════════════════════════════════ */}
        {tab === 'overview' && stats && (
          <>
            {/* SEMÁFORO DE ACTIVIDAD */}
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Semáforo de Actividad</h2>
              <div className="grid grid-cols-5 gap-3">
                {(['nuevo','activo','riesgo','inactivo','dormido'] as SemaforoKey[]).map(k => {
                  const cfg  = SEM_CFG[k]
                  const info = stats.bySemaforo[k] ?? { count: 0, mrr: 0, label: cfg.label }
                  const pct  = stats.total ? ((info.count / stats.total) * 100).toFixed(1) : '0'
                  const Icon = cfg.Icon
                  return (
                    <div key={k} className="rounded-xl border p-4 shadow-sm"
                      style={{ background: cfg.bg, borderColor: cfg.border }}>
                      <div className="flex items-center justify-between mb-2">
                        <Icon size={16} style={{ color: cfg.color }} />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: cfg.color + '22', color: cfg.text }}>
                          {pct}%
                        </span>
                      </div>
                      <p className="text-2xl font-extrabold" style={{ color: cfg.text }}>
                        {fmtN(info.count)}
                      </p>
                      <p className="text-[11px] font-bold mt-0.5" style={{ color: cfg.text }}>{cfg.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: cfg.text, opacity: 0.7 }}>{cfg.sublabel}</p>
                      {info.mrr > 0 && (
                        <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${cfg.border}` }}>
                          <p className="text-[10px]" style={{ color: cfg.text, opacity: 0.8 }}>MRR comprometido</p>
                          <p className="text-sm font-bold" style={{ color: cfg.color }}>{fmtM(info.mrr)}</p>
                        </div>
                      )}
                      {/* progress bar */}
                      <div className="mt-2 h-1 rounded-full bg-white overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* DISTRIBUCIÓN ANTIGÜEDAD + TAMAÑO */}
            <div className="grid grid-cols-5 gap-4">

              {/* Antigüedad 3/5 */}
              <section className="col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" /> Distribución por Antigüedad
                </h2>
                <div className="space-y-3">
                  {(() => {
                    const maxCount = Math.max(...stats.byBucket.map(b => b.count), 1)
                    return BUCKET_ORDER
                      .filter(name => stats.byBucket.find(b => b.bucket === name))
                      .map(name => {
                        const b   = stats.byBucket.find(x => x.bucket === name)!
                        const cfg = BUCKET_CFG[name]
                        return (
                          <div key={name}>
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                                <span className="text-xs font-semibold text-gray-700">{name}</span>
                                <span className="text-[10px] text-gray-400">{cfg.range}</span>
                              </div>
                              <div className="flex gap-3 text-xs text-gray-500">
                                <span className="font-bold text-gray-800">{fmtN(b.count)}</span>
                                <span>{fmtM(b.mrr)}</span>
                                <span className="text-gray-400">avg {fmtM(b.avgMrr)}</span>
                              </div>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width: `${Math.round((b.count / maxCount) * 100)}%`, background: cfg.color }} />
                            </div>
                          </div>
                        )
                      })
                  })()}
                </div>

                {/* One-timers */}
                <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium mb-1">One-timers (1 sola factura)</p>
                    <p className="text-lg font-bold text-gray-800">{fmtN(stats.oneTimers)}</p>
                    <p className="text-[10px] text-gray-400">
                      {fmtPct(stats.total ? (stats.oneTimers / stats.total) * 100 : 0)} del total
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium mb-1">Multi-factura</p>
                    <p className="text-lg font-bold text-gray-800">{fmtN(stats.multiTimers)}</p>
                    <p className="text-[10px] text-gray-400">
                      {fmtPct(stats.total ? (stats.multiTimers / stats.total) * 100 : 0)} del total
                    </p>
                  </div>
                </div>
              </section>

              {/* Tamaño + Clasificación 2/5 */}
              <section className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Award size={14} className="text-gray-400" /> Por Tamaño de Empresa
                  </h2>
                  <div className="space-y-2">
                    {stats.byTamano.map(t => {
                      const color = TAMANO_CFG[t.tamano] ?? '#6b7280'
                      const max   = Math.max(...stats.byTamano.map(x => x.count), 1)
                      return (
                        <BarRow key={t.tamano}
                          label={t.tamano} value={t.count} max={max} color={color}
                          right={`${fmtN(t.count)} · ${fmtM(t.mrr)}`} />
                      )
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">Clasificación LTV</h2>
                  <div className="space-y-2">
                    {stats.byClasLtv.map((c, i) => {
                      const colors = ['#6366f1','#22c55e','#f59e0b','#f97316','#ef4444']
                      const max    = Math.max(...stats.byClasLtv.map(x => x.count), 1)
                      return (
                        <BarRow key={c.clas}
                          label={c.clas || 'N/A'} value={c.count} max={max}
                          color={colors[i % colors.length]}
                          right={`${fmtN(c.count)}`} />
                      )
                    })}
                  </div>
                </div>
              </section>
            </div>

            {/* ALERTAS DE RIESGO */}
            {stats.riskAlerts.length > 0 && (
              <section className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-amber-100 flex items-center gap-2"
                  style={{ background: '#fffbeb' }}>
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-sm font-semibold text-amber-800">
                    Clientes Activos con Alerta — días sin factura elevados
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Cliente','Tamaño','Clasificación','MRR','Días sin factura','Última factura'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.riskAlerts.map(r => (
                        <tr key={r.id_cliente} className="border-t border-gray-50 hover:bg-amber-50/30">
                          <td className="px-3 py-2 font-medium text-gray-800 max-w-[200px] truncate">{r.nombre_cliente}</td>
                          <td className="px-3 py-2 text-gray-500">{r.tamano_empresa}</td>
                          <td className="px-3 py-2 text-gray-500">{r.clasificacion_ltv}</td>
                          <td className="px-3 py-2 font-semibold text-indigo-600">{fmtM(r.mrr_limpio)}</td>
                          <td className="px-3 py-2">
                            <span className="font-bold px-2 py-0.5 rounded-full text-[10px]"
                              style={{ background: r.dias_sin_factura > 90 ? '#fee2e2' : '#fef3c7',
                                       color:      r.dias_sin_factura > 90 ? '#b91c1c'  : '#b45309' }}>
                              {r.dias_sin_factura} días
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-500">{fmtDate(r.ultima_factura)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TOP 20 LTV */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Award size={15} className="text-amber-400" />
                <span className="text-sm font-semibold text-gray-700">Top 20 — Mayor LTV Acumulado</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#','Cliente','Tamaño','Clas. LTV','Bucket','Meses','1ª Factura','MRR','LTV Acum.','Estado'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topLtv.map((r, i) => (
                      <tr key={r.id_cliente} className="border-t border-gray-50 hover:bg-gray-50/60">
                        <td className="px-3 py-2.5 font-bold text-gray-300 text-center">{i + 1}</td>
                        <td className="px-3 py-2.5 font-semibold text-gray-800 max-w-[200px] truncate">{r.nombre_cliente}</td>
                        <td className="px-3 py-2.5 text-gray-500">{r.tamano_empresa}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                            {r.clasificacion_ltv}
                          </span>
                        </td>
                        <td className="px-3 py-2.5"><BucketBadge b={r.tenure_bucket} /></td>
                        <td className="px-3 py-2.5 font-semibold text-gray-700">{r.meses_activo}</td>
                        <td className="px-3 py-2.5 text-gray-500">{fmtDate(r.primera_factura)}</td>
                        <td className="px-3 py-2.5 font-semibold text-indigo-600">{fmtM(r.mrr_limpio)}</td>
                        <td className="px-3 py-2.5 font-bold text-gray-900">{fmtM(r.importe_acumulado_recurrente)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <SemDot k={r.semaforo_key} />
                            <span className="font-medium" style={{ color: SEM_CFG[r.semaforo_key]?.text }}>
                              {SEM_CFG[r.semaforo_key]?.label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* EFICIENCIA MRR/mes */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Eficiencia de Facturación — MRR por mes facturado
              </h2>
              <div className="flex gap-2 items-end" style={{ height: 80 }}>
                {['&lt;$200','$200-500','$500-1K','$1K-2K','&gt;$2K'].map((lbl, i) => {
                  const cnt    = stats.effBins[i] ?? 0
                  const maxBin = Math.max(...stats.effBins, 1)
                  const h      = Math.max(4, Math.round((cnt / maxBin) * 64))
                  const colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#6366f1']
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                        <div className="w-full rounded-t" style={{ height: h, background: colors[i] }} />
                      </div>
                      <span className="text-[9px] text-gray-500 text-center"
                        dangerouslySetInnerHTML={{ __html: lbl }} />
                      <span className="text-[10px] font-bold text-gray-700">{fmtN(cnt)}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB: ANÁLISIS COHORTE
        ════════════════════════════════════════════════════════ */}
        {tab === 'cohort' && stats && (
          <>
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-1">Retención por Año de Cohorte</h2>
              <p className="text-[11px] text-gray-400 mb-5">
                Clientes que aún tienen semáforo Activo vs total de clientes adquiridos ese año.
              </p>
              <div className="space-y-2.5">
                {stats.byCohort.map(c => {
                  const retColor = c.pctRetention >= 50 ? '#22c55e'
                    : c.pctRetention >= 20 ? '#f59e0b' : '#ef4444'
                  return (
                    <div key={c.year} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-600 w-12 text-right">{c.year}</span>
                      <div className="flex-1 relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                        {/* Total bar */}
                        <div className="absolute inset-y-0 left-0 bg-gray-200 rounded-lg"
                          style={{ width: '100%' }} />
                        {/* Active bar */}
                        <div className="absolute inset-y-0 left-0 rounded-lg flex items-center pl-2"
                          style={{ width: `${c.pctRetention}%`, background: retColor + 'cc', minWidth: c.activos > 0 ? 4 : 0 }} />
                        <div className="absolute inset-0 flex items-center px-2 justify-between">
                          <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                            {c.activos > 0 ? `${fmtN(c.activos)} activos` : ''}
                          </span>
                          <span className="text-[10px] font-bold" style={{ color: retColor }}>
                            {c.pctRetention}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right w-28">
                        <p className="text-[10px] text-gray-500">{fmtN(c.total)} ingresaron</p>
                        {c.mrr > 0 && <p className="text-[10px] font-semibold text-indigo-600">{fmtM(c.mrr)} MRR</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Cohorte grid por retención */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumen Cohorte</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Año', 'Adquiridos', 'Activos Hoy', 'Retención', 'MRR Activo', 'LTV Promedio'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byCohort.slice().reverse().map(c => {
                      const retColor = c.pctRetention >= 50 ? '#15803d'
                        : c.pctRetention >= 20 ? '#b45309' : '#b91c1c'
                      const retBg    = c.pctRetention >= 50 ? '#f0fdf4'
                        : c.pctRetention >= 20 ? '#fffbeb' : '#fef2f2'
                      return (
                        <tr key={c.year} className="border-t border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-bold text-gray-700">{c.year}</td>
                          <td className="px-4 py-2.5 text-gray-600">{fmtN(c.total)}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-800">{fmtN(c.activos)}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: retBg, color: retColor }}>
                              {c.pctRetention}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-indigo-600">{c.mrr > 0 ? fmtM(c.mrr) : '—'}</td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {c.total > 0 ? fmtM(stats.totalLtv / stats.total) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB: EXPLORADOR
        ════════════════════════════════════════════════════════ */}
        {tab === 'explorer' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Buscar por nombre o ID…"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                </div>
                <select value={fSem} onChange={e => setFSem(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700">
                  <option value="">Todos los semáforos</option>
                  <option value="nuevo">🔵 Nuevo</option>
                  <option value="activo">🟢 Activo</option>
                  <option value="riesgo">🟡 En Riesgo</option>
                  <option value="inactivo">🟠 Inactivo</option>
                  <option value="dormido">🔴 Dormido</option>
                </select>
                <select value={fTamano} onChange={e => setFTamano(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700">
                  <option value="">Todos los tamaños</option>
                  {['Micro','SMB','Mid-Market','Large','Enterprise'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select value={fBucket} onChange={e => setFBucket(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700">
                  <option value="">Todos los buckets</option>
                  {['Sin Actividad','Nuevos','Jóvenes','Activos','Maduros','Veteranos'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 ml-auto">{fmtN(total)} clientes</span>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {[
                        { label: 'Cliente',        col: 'nombre_cliente' },
                        { label: 'Tamaño',          col: 'tamano_empresa' },
                        { label: 'Clas. LTV',       col: 'clasificacion_ltv' },
                        { label: 'Bucket',          col: 'tenure_bucket' },
                        { label: 'Semáforo',        col: 'semaforo_key' },
                        { label: 'Meses activo',    col: 'meses_activo' },
                        { label: 'Días sin fac.',   col: 'dias_sin_factura' },
                        { label: '1ª Factura',      col: 'primera_factura' },
                        { label: 'Últ. Factura',    col: 'ultima_factura' },
                        { label: 'MRR',             col: 'mrr_limpio' },
                        { label: 'LTV Acum.',       col: 'importe_acumulado_recurrente' },
                        { label: 'MRR/mes',         col: 'mrr_por_mes_facturado' },
                        { label: 'Cohorte',         col: 'cohorte_periodo' },
                      ].map(({ label, col }) => (
                        <th key={col} onClick={() => toggleSort(col)}
                          className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap cursor-pointer hover:text-gray-700 select-none">
                          {label}
                          {sortBy === col && (
                            <span className="ml-1 text-indigo-500">{sortDir === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadList
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <tr key={i} className="border-t border-gray-50">
                            {Array.from({ length: 13 }).map((_, j) => (
                              <td key={j} className="px-3 py-3">
                                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : rows.length === 0
                        ? (
                          <tr>
                            <td colSpan={13} className="px-6 py-12 text-center text-gray-400 text-sm">
                              No se encontraron clientes con los filtros aplicados.
                            </td>
                          </tr>
                        )
                        : rows.map(r => (
                          <tr key={r.id_cliente} className="border-t border-gray-50 hover:bg-indigo-50/20">
                            <td className="px-3 py-2 font-medium text-gray-800 max-w-[200px] truncate">{r.nombre_cliente}</td>
                            <td className="px-3 py-2 text-gray-500">{r.tamano_empresa}</td>
                            <td className="px-3 py-2 text-indigo-600 font-semibold text-[10px]">{r.clasificacion_ltv}</td>
                            <td className="px-3 py-2"><BucketBadge b={r.tenure_bucket} /></td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <SemDot k={r.semaforo_key} />
                                <span className="font-medium" style={{ color: SEM_CFG[r.semaforo_key]?.text }}>
                                  {SEM_CFG[r.semaforo_key]?.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 font-semibold text-gray-700 text-center">{r.meses_activo}</td>
                            <td className="px-3 py-2 text-center">
                              {r.dias_sin_factura > 60
                                ? <span className="text-red-600 font-bold">{r.dias_sin_factura}</span>
                                : r.dias_sin_factura > 30
                                  ? <span className="text-amber-600 font-semibold">{r.dias_sin_factura}</span>
                                  : <span className="text-gray-500">{r.dias_sin_factura}</span>
                              }
                            </td>
                            <td className="px-3 py-2 text-gray-500">{fmtDate(r.primera_factura)}</td>
                            <td className="px-3 py-2 text-gray-500">{fmtDate(r.ultima_factura)}</td>
                            <td className="px-3 py-2 font-semibold text-indigo-600">{fmtM(r.mrr_limpio)}</td>
                            <td className="px-3 py-2 font-bold text-gray-900">{fmtM(r.importe_acumulado_recurrente)}</td>
                            <td className="px-3 py-2 text-gray-500">{fmtM(r.mrr_por_mes_facturado)}</td>
                            <td className="px-3 py-2 text-gray-400">{r.cohorte_periodo}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Página {page} de {totalPages} · {fmtN(total)} clientes
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pg = page <= 3 ? i + 1
                        : page >= totalPages - 2 ? totalPages - 4 + i
                        : page - 2 + i
                      if (pg < 1 || pg > totalPages) return null
                      return (
                        <button key={pg} onClick={() => setPage(pg)}
                          className="w-7 h-7 rounded-lg text-xs font-medium border transition-colors"
                          style={page === pg
                            ? { background: '#1B3FCC', color: '#fff', borderColor: '#1B3FCC' }
                            : { background: '#fff', color: '#374151', borderColor: '#e5e7eb' }}>
                          {pg}
                        </button>
                      )
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Loading overlay para overview sin datos */}
        {tab === 'overview' && !stats && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertTriangle size={32} className="mb-3" />
            <p className="text-sm font-medium">No se pudo cargar la información</p>
            <p className="text-xs mt-1">Verifica que las variables de entorno de Zoho estén configuradas</p>
            <button onClick={loadStats}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
              Reintentar
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
