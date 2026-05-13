'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import {
  Receipt, BarChart3, Search, GitMerge, Activity,
  TrendingDown, TrendingUp, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, RefreshCw, Filter, Users,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════
   TIPOS
═══════════════════════════════════════════════════════════════════════ */
type Tab = 'resumen' | 'explorador' | 'conciliacion' | 'uso'

interface Periodo { fecha: string; count: number; mrr: number }

interface Stats {
  total: number; totalMrr: number; avgConsumo: number; sinUso: number; conUso: number
  byClas:      Record<string, { count: number; mrr: number }>
  topPlanes:   { plan: string; count: number; mrr: number }[]
  bins:        number[]   // [0%, 1-25%, 26-50%, 51-75%, 76-100%, >100%]
  modulos:     { menuConfig: number; reportes: number; callHistory: number; visitInbound: number; visitOutbound: number; myExtension: number }
  usoPrincipal: Record<string, number>
}

interface FactRow {
  CID: string; 'Nombre del Cliente': string; 'Fecha de corte': string; Periodo: string
  'Nombre del Plan': string; 'Minutos Incluidos': number | null; 'Minutos Consumidos': number | null
  'Monto del plan': number | null; '% Consumo': number | null; 'Extensiones ilimitadas': string
  'Clasificación de empresa': string; 'Toggle Status': number | null; 'Menú Configuracion': number | null
  Reportes: number | null; 'Call History': number | null; 'Visit Inbound': number | null
  'Visit Outbound': number | null; 'My extension': number | null; 'Total de interacciones': number | null
  '% Llamadas entrantes': number | null; '% Llamadas salientes': number | null
  'Uso Principal de llamadas': string; 'Eventos analizados': string
}

interface ConcRow {
  cid: string; nombre: string; plan: string; clas: string; mrr: number
  toggle: number; consumo: number; matched: boolean
  cuenta_id: number | null; estado: string | null; asesor: string | null; health_score: number | null
}

/* ═══════════════════════════════════════════════════════════════════════
   PALETA
═══════════════════════════════════════════════════════════════════════ */
const BLUE   = '#3b82f6'
const INDIGO = '#6366f1'
const GREEN  = '#22c55e'
const AMBER  = '#f59e0b'
const RED    = '#ef4444'
const GRAY   = '#6b7280'

const CLAS_COLOR: Record<string, string> = {
  AAA:    '#6366f1', Mediana: '#3b82f6', Pequeña: '#22c55e',
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
const fmt  = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const pct  = (n: number) => `${Math.round(n * 10) / 10}%`
const BASE = '/api/facturacion'

const BIN_LABELS = ['0%', '1–25%', '26–50%', '51–75%', '76–100%', '>100%']
const BIN_COLORS = [RED, AMBER, '#f97316', BLUE, GREEN, INDIGO]

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENTES UI
═══════════════════════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, label, value, sub, color }:
  { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold mt-1 truncate" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ml-2"
          style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw size={20} className="text-gray-300 animate-spin" />
    </div>
  )
}

function ConsumoBadge({ val }: { val: number | null }) {
  const v = val ?? 0
  const color = v === 0 ? RED : v <= 25 ? AMBER : v <= 75 ? BLUE : v <= 100 ? GREEN : INDIGO
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{ background: `${color}18`, color }}>
      {v}%
    </span>
  )
}

function ToggleBadge({ val }: { val: number | null }) {
  const v = val ?? 0
  const color = v === 0 ? RED : v < 10 ? AMBER : GREEN
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{ background: `${color}18`, color }}>
      {v === 0 ? 'Sin uso' : v}
    </span>
  )
}

function ClasChip({ clas }: { clas: string }) {
  const c = CLAS_COLOR[clas] ?? GRAY
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
      style={{ background: `${c}15`, color: c, borderColor: `${c}35` }}>
      {clas}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   SELECTORES DE PERÍODO
═══════════════════════════════════════════════════════════════════════ */
function PeriodoBar({ periodos, selected, onChange }: {
  periodos: Periodo[]; selected: string; onChange: (f: string) => void
}) {
  if (!periodos.length) return null
  // Group by month for compact display
  const byMonth: Record<string, Periodo[]> = {}
  for (const p of periodos) {
    const m = p.fecha.slice(0, 7)
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(p)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3">
        <Receipt size={13} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha de Corte</span>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-1">
          {periodos.length} fechas
        </span>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={selected}
            onChange={e => onChange(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            {periodos.map(p => (
              <option key={p.fecha} value={p.fecha}>
                {p.fecha} — {p.count} cuentas · {fmt(p.mrr)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mini sparkline de MRR (5 últimos meses únicos) */}
      <div className="px-4 py-2 flex items-center gap-4 overflow-x-auto">
        {Object.entries(byMonth).slice(0, 6).map(([month, ps]) => {
          const totalMrr = ps.reduce((s, p) => s + p.mrr, 0)
          const cuentas  = new Set(ps.flatMap(p => [])).size  // just count dates
          const isSelMonth = selected.startsWith(month)
          return (
            <button key={month}
              onClick={() => onChange(ps[0].fecha)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
              style={isSelMonth ? { background: '#1B3FCC10', border: '1px solid #1B3FCC40' } : {}}>
              <span className="text-[10px] font-semibold" style={{ color: isSelMonth ? '#1B3FCC' : '#6b7280' }}>
                {new Date(month + '-01').toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })}
              </span>
              <span className="text-xs font-bold text-gray-700">{fmt(totalMrr)}</span>
              <span className="text-[9px] text-gray-400">{ps.length} cortes</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════ */
export default function FacturacionPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [selected, setSelected] = useState<string>('')
  const [tab,      setTab]      = useState<Tab>('resumen')

  // Stats
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Explorador
  const [rows,     setRows]     = useState<FactRow[]>([])
  const [rowTotal, setRowTotal] = useState(0)
  const [page,     setPage]     = useState(1)
  const [q,        setQ]        = useState('')
  const [clas,     setClas]     = useState('')
  const [uso,      setUso]      = useState('')
  const [listLoading, setListLoading] = useState(false)

  // Conciliacion
  const [concRows, setConcRows] = useState<ConcRow[]>([])
  const [concMeta, setConcMeta] = useState({ total: 0, matched: 0, unmatched: 0 })
  const [concFilter, setConcFilter] = useState<'all' | 'matched' | 'unmatched'>('all')
  const [concLoading, setConcLoading] = useState(false)
  const [concLoaded, setConcLoaded] = useState(false)

  /* ── Cargar periodos ─────────────────────────────────────────────── */
  useEffect(() => {
    fetch(`${BASE}?mode=periodos`)
      .then(r => r.json())
      .then(d => {
        setPeriodos(d.periodos)
        if (d.periodos.length) setSelected(d.periodos[0].fecha)
      })
  }, [])

  /* ── Cargar stats al cambiar período ─────────────────────────────── */
  useEffect(() => {
    if (!selected) return
    setStatsLoading(true)
    fetch(`${BASE}?mode=stats&fecha=${selected}`)
      .then(r => r.json())
      .then(d => { setStats(d); setStatsLoading(false) })
      .catch(() => setStatsLoading(false))
  }, [selected])

  /* ── Cargar lista ─────────────────────────────────────────────────── */
  const loadList = useCallback(() => {
    if (!selected) return
    setListLoading(true)
    const params = new URLSearchParams({
      mode: 'list', fecha: selected, q, clas, uso, page: String(page), size: '50'
    })
    fetch(`${BASE}?${params}`)
      .then(r => r.json())
      .then(d => { setRows(d.rows); setRowTotal(d.total); setListLoading(false) })
      .catch(() => setListLoading(false))
  }, [selected, q, clas, uso, page])

  useEffect(() => { if (tab === 'explorador') loadList() }, [tab, loadList])
  useEffect(() => { if (tab === 'explorador') { setPage(1) } }, [q, clas, uso, selected])
  useEffect(() => { if (tab === 'explorador') loadList() }, [page])

  /* ── Cargar conciliación (lazy) ──────────────────────────────────── */
  const loadConciliacion = useCallback(() => {
    if (!selected || concLoaded) return
    setConcLoading(true)
    fetch(`${BASE}?mode=conciliacion&fecha=${selected}`)
      .then(r => r.json())
      .then(d => {
        setConcRows(d.rows); setConcMeta({ total: d.total, matched: d.matched, unmatched: d.unmatched })
        setConcLoading(false); setConcLoaded(true)
      })
      .catch(() => setConcLoading(false))
  }, [selected, concLoaded])

  useEffect(() => {
    if (tab === 'conciliacion') loadConciliacion()
  }, [tab, loadConciliacion])

  // Reset conciliación al cambiar período
  useEffect(() => { setConcLoaded(false); setConcRows([]) }, [selected])

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'resumen',       label: 'Resumen',         icon: BarChart3  },
    { id: 'explorador',    label: 'Explorador',       icon: Search     },
    { id: 'conciliacion',  label: 'Conciliación',     icon: GitMerge   },
    { id: 'uso',           label: 'Análisis de Uso',  icon: Activity   },
  ]

  const selPeriodo = periodos.find(p => p.fecha === selected)
  const totalPages = Math.ceil(rowTotal / 50)

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Corte Facturación"
        subtitle="Análisis de consumo y comportamiento por período de facturación · Todas las cuentas"
      />

      {/* Selector de período */}
      <div className="px-6 pt-4 pb-0">
        <PeriodoBar periodos={periodos} selected={selected} onChange={f => { setSelected(f); setTab('resumen') }} />
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="px-6 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard icon={Receipt}      label="MRR del Corte"       value={fmt(stats.totalMrr)}
            sub={`${stats.total} cuentas · ${selected}`}        color={INDIGO}  />
          <KpiCard icon={BarChart3}    label="% Consumo Promedio"  value={pct(stats.avgConsumo)}
            sub="Minutos incluidos utilizados"                    color={BLUE}    />
          <KpiCard icon={TrendingDown} label="Sin Uso (Toggle=0)"  value={`${stats.sinUso}`}
            sub={`${pct((stats.sinUso / stats.total) * 100)} no usó plataforma`} color={RED}  />
          <KpiCard icon={TrendingUp}   label="Con Actividad"       value={`${stats.conUso}`}
            sub={`${pct((stats.conUso / stats.total) * 100)} con interacciones`}  color={GREEN} />
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-3">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={tab === t.id ? { background: '#1B3FCC', color: '#fff' } : { color: '#6b7280' }}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

        {/* ══ RESUMEN ═══════════════════════════════════════════════ */}
        {tab === 'resumen' && (
          statsLoading ? <LoadingSpinner /> : stats ? (
            <>
              {/* Por clasificación */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-sm text-gray-900 mb-4">MRR por Clasificación de Empresa</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(stats.byClas).sort((a, b) => b[1].mrr - a[1].mrr).map(([c, v]) => {
                    const color = CLAS_COLOR[c] ?? GRAY
                    const pctTotal = stats.totalMrr > 0 ? (v.mrr / stats.totalMrr) * 100 : 0
                    return (
                      <div key={c} className="rounded-xl border-2 p-4"
                        style={{ borderColor: `${color}40`, background: `${color}06` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{c}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{fmt(v.mrr)}</p>
                        <p className="text-xs text-gray-500 mt-1">{v.count} cuentas · {pct(pctTotal)} del total</p>
                        <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pctTotal}%`, background: color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top planes */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100" style={{ background: `${INDIGO}08` }}>
                  <h3 className="font-semibold text-sm text-gray-900">Top Planes por MRR — {selected}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cuentas</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">MRR</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Participación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topPlanes.map((p, i) => {
                        const pp = stats.totalMrr > 0 ? (p.mrr / stats.totalMrr) * 100 : 0
                        return (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 px-4 text-xs text-gray-400">{i + 1}</td>
                            <td className="py-2.5 px-4 font-medium text-gray-800 text-xs max-w-[280px] truncate">{p.plan}</td>
                            <td className="py-2.5 px-4 text-right text-xs text-gray-600">{p.count}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-xs" style={{ color: INDIGO }}>{fmt(p.mrr)}</td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[60px]">
                                  <div className="h-full rounded-full" style={{ width: `${pp}%`, background: INDIGO }} />
                                </div>
                                <span className="text-[10px] text-gray-400 w-8 text-right">{pct(pp)}</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Distribución % consumo */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-sm text-gray-900 mb-4">Distribución de % Consumo de Minutos</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {BIN_LABELS.map((lbl, i) => {
                    const n = stats.bins[i] ?? 0
                    const pp = stats.total > 0 ? (n / stats.total) * 100 : 0
                    return (
                      <div key={lbl} className="rounded-xl border p-3 text-center"
                        style={{ background: `${BIN_COLORS[i]}08`, borderColor: `${BIN_COLORS[i]}30` }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: BIN_COLORS[i] }}>{lbl}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{n}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{pct(pp)}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  <span style={{ color: RED }}>●</span> Sin uso &nbsp;
                  <span style={{ color: AMBER }}>●</span> Bajo consumo (1–25%) &nbsp;
                  <span style={{ color: GREEN }}>●</span> Consumo óptimo (76–100%)
                </p>
              </div>
            </>
          ) : null
        )}

        {/* ══ EXPLORADOR ════════════════════════════════════════════ */}
        {tab === 'explorador' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Buscar</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
                    placeholder="CID, nombre o plan..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Clasificación</label>
                <select value={clas} onChange={e => { setClas(e.target.value); setPage(1) }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">Todas</option>
                  <option value="AAA">AAA</option>
                  <option value="Mediana">Mediana</option>
                  <option value="Pequeña">Pequeña</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Actividad</label>
                <select value={uso} onChange={e => { setUso(e.target.value); setPage(1) }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">Todos</option>
                  <option value="activo">Con actividad</option>
                  <option value="inactivo">Sin uso (Toggle=0)</option>
                </select>
              </div>
              <div className="text-xs text-gray-400 pt-5">
                {rowTotal.toLocaleString()} registros
              </div>
            </div>

            {listLoading ? <LoadingSpinner /> : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70">
                        {['CID','Cliente','Plan','MRR','% Consu.','Mins Inc.','Mins Cons.','Clas.','Toggle','Interac.','% Ent.','% Sal.','Uso Ppal.'].map(h => (
                          <th key={h} className="py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors">
                          <td className="py-2.5 px-3 text-xs font-mono text-gray-500">{r.CID}</td>
                          <td className="py-2.5 px-3 font-medium text-gray-800 text-xs max-w-[160px] truncate">{r['Nombre del Cliente']}</td>
                          <td className="py-2.5 px-3 text-xs text-gray-600 max-w-[180px] truncate">{r['Nombre del Plan']}</td>
                          <td className="py-2.5 px-3 text-xs font-semibold" style={{ color: INDIGO }}>{fmt(r['Monto del plan'] ?? 0)}</td>
                          <td className="py-2.5 px-3"><ConsumoBadge val={r['% Consumo']} /></td>
                          <td className="py-2.5 px-3 text-xs text-gray-500 text-right">{r['Minutos Incluidos']?.toLocaleString() ?? '—'}</td>
                          <td className="py-2.5 px-3 text-xs text-gray-500 text-right">{r['Minutos Consumidos']?.toLocaleString() ?? '—'}</td>
                          <td className="py-2.5 px-3"><ClasChip clas={r['Clasificación de empresa']} /></td>
                          <td className="py-2.5 px-3"><ToggleBadge val={r['Toggle Status']} /></td>
                          <td className="py-2.5 px-3 text-xs text-gray-500 text-right">{r['Total de interacciones'] ?? '—'}</td>
                          <td className="py-2.5 px-3 text-xs text-gray-500 text-right">{r['% Llamadas entrantes'] != null ? `${r['% Llamadas entrantes']}%` : '—'}</td>
                          <td className="py-2.5 px-3 text-xs text-gray-500 text-right">{r['% Llamadas salientes'] != null ? `${r['% Llamadas salientes']}%` : '—'}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-medium text-gray-500">{r['Uso Principal de llamadas'] ?? '—'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Mostrando {((page - 1) * 50) + 1}–{Math.min(page * 50, rowTotal)} de {rowTotal.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-gray-500 px-2 py-1">
                      {page} / {totalPages}
                    </span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ CONCILIACIÓN ══════════════════════════════════════════ */}
        {tab === 'conciliacion' && (
          <>
            {/* KPIs de conciliación */}
            <div className="grid grid-cols-3 gap-3">
              <KpiCard icon={Users}        label="CIDs en este corte" value={String(concMeta.total)}    sub={selected}    color={INDIGO} />
              <KpiCard icon={CheckCircle2} label="Conciliados"        value={String(concMeta.matched)}
                sub={concMeta.total > 0 ? pct((concMeta.matched / concMeta.total) * 100) + ' match' : '—'} color={GREEN} />
              <KpiCard icon={AlertTriangle}label="Sin match en DB"    value={String(concMeta.unmatched)}
                sub="No encontrados en cuentas"                                    color={AMBER} />
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm flex items-center gap-3 flex-wrap">
              <Filter size={13} className="text-gray-400" />
              {(['all', 'matched', 'unmatched'] as const).map(f => (
                <button key={f} onClick={() => setConcFilter(f)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={concFilter === f
                    ? { background: '#1B3FCC', color: '#fff' }
                    : { color: '#6b7280', background: '#f9fafb' }}>
                  {f === 'all' ? 'Todos' : f === 'matched' ? '✓ Conciliados' : '✗ Sin match'}
                </button>
              ))}
              <span className="text-xs text-gray-400 ml-auto">
                {concRows.filter(r =>
                  concFilter === 'all' ? true :
                  concFilter === 'matched' ? r.matched : !r.matched
                ).length} registros
              </span>
            </div>

            {concLoading ? <LoadingSpinner /> : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70">
                        {['CID','Cliente (Facturación)','Plan','Clas.','MRR','Consumo','Toggle','Match','Estado CP','Asesor CP','HS'].map(h => (
                          <th key={h} className="py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {concRows
                        .filter(r =>
                          concFilter === 'all' ? true :
                          concFilter === 'matched' ? r.matched : !r.matched
                        )
                        .map((r, i) => (
                          <tr key={i} className={`border-b border-gray-100 transition-colors ${r.matched ? 'hover:bg-green-50/20' : 'hover:bg-amber-50/20 bg-amber-50/10'}`}>
                            <td className="py-2.5 px-3 text-xs font-mono text-gray-500">{r.cid}</td>
                            <td className="py-2.5 px-3 font-medium text-gray-800 text-xs max-w-[160px] truncate">{r.nombre}</td>
                            <td className="py-2.5 px-3 text-xs text-gray-500 max-w-[160px] truncate">{r.plan}</td>
                            <td className="py-2.5 px-3"><ClasChip clas={r.clas} /></td>
                            <td className="py-2.5 px-3 text-xs font-semibold" style={{ color: INDIGO }}>{fmt(r.mrr)}</td>
                            <td className="py-2.5 px-3"><ConsumoBadge val={r.consumo} /></td>
                            <td className="py-2.5 px-3"><ToggleBadge val={r.toggle} /></td>
                            <td className="py-2.5 px-3">
                              {r.matched
                                ? <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">✓ Match</span>
                                : <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Sin match</span>
                              }
                            </td>
                            <td className="py-2.5 px-3">
                              {r.estado ? (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                  style={{ background: r.estado === 'activo' ? '#22c55e18' : '#ef444418', color: r.estado === 'activo' ? GREEN : RED }}>
                                  {r.estado}
                                </span>
                              ) : <span className="text-[10px] text-gray-300">—</span>}
                            </td>
                            <td className="py-2.5 px-3 text-xs text-gray-500">{r.asesor ?? '—'}</td>
                            <td className="py-2.5 px-3">
                              {r.health_score != null ? (
                                <span className="text-xs font-bold" style={{ color: r.health_score >= 70 ? GREEN : r.health_score >= 40 ? AMBER : RED }}>
                                  {r.health_score}
                                </span>
                              ) : <span className="text-[10px] text-gray-300">—</span>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ ANÁLISIS DE USO ═══════════════════════════════════════ */}
        {tab === 'uso' && (
          statsLoading ? <LoadingSpinner /> : stats ? (
            <>
              {/* Uso de módulos */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-sm text-gray-900 mb-4">Interacciones por Módulo — {selected}</h3>
                <div className="space-y-3">
                  {([
                    { key: 'callHistory',   label: 'Call History',      color: INDIGO },
                    { key: 'visitInbound',  label: 'Visit Inbound',     color: BLUE   },
                    { key: 'visitOutbound', label: 'Visit Outbound',    color: GREEN  },
                    { key: 'reportes',      label: 'Reportes',          color: AMBER  },
                    { key: 'menuConfig',    label: 'Menú Configuración',color: '#f97316' },
                    { key: 'myExtension',   label: 'My Extension',      color: '#8b5cf6' },
                  ] as const).map(m => {
                    const val = stats.modulos[m.key] ?? 0
                    const max = Math.max(...Object.values(stats.modulos))
                    const pp  = max > 0 ? (val / max) * 100 : 0
                    return (
                      <div key={m.key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{m.label}</span>
                          <span className="font-bold" style={{ color: m.color }}>{val.toLocaleString()} interacciones</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pp}%`, background: m.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Uso principal de llamadas */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-sm text-gray-900 mb-4">Uso Principal de Llamadas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(stats.usoPrincipal).sort((a, b) => b[1] - a[1]).map(([tipo, n]) => {
                    const color = tipo === 'entrantes' ? GREEN : tipo === 'salientes' ? BLUE : AMBER
                    const pp = stats.total > 0 ? (n / stats.total) * 100 : 0
                    return (
                      <div key={tipo} className="rounded-xl border-2 p-4"
                        style={{ borderColor: `${color}40`, background: `${color}06` }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color }}>{tipo}</p>
                        <p className="text-2xl font-bold text-gray-900">{n}</p>
                        <p className="text-xs text-gray-500 mt-1">{pct(pp)} de las cuentas</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actividad real vs inactividad */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-sm text-gray-900 mb-4">Actividad de Plataforma (Toggle Status)</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl border-2 p-4" style={{ borderColor: `${RED}40`, background: `${RED}06` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: RED }}>Sin Actividad (Toggle = 0)</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.sinUso}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: RED }}>
                      {pct((stats.sinUso / stats.total) * 100)} del total
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Cuentas activas en facturación que no registraron ningún inicio de sesión en el período.
                      Riesgo de churn silencioso.
                    </p>
                  </div>
                  <div className="rounded-xl border-2 p-4" style={{ borderColor: `${GREEN}40`, background: `${GREEN}06` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: GREEN }}>Con Actividad (Toggle {'>'} 0)</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.conUso}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: GREEN }}>
                      {pct((stats.conUso / stats.total) * 100)} del total
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Cuentas con al menos un inicio de sesión registrado en el período de facturación.
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg border" style={{ background: `${AMBER}08`, borderColor: `${AMBER}30` }}>
                  <p className="text-xs font-semibold" style={{ color: AMBER }}>⚠ Señal de alerta</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Una cuenta con Toggle Status = 0 durante varios períodos consecutivos es candidata a churn.
                    Revisar en el módulo de Churn y priorizar contacto proactivo del asesor.
                  </p>
                </div>
              </div>
            </>
          ) : null
        )}
      </div>
    </div>
  )
}
