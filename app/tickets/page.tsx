'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import PageHeader from '@/components/PageHeader'
import CustomSelect from '@/components/CustomSelect'
import {
  Search, Filter, ExternalLink, AlertTriangle, CheckCircle2,
  XCircle, Clock, BarChart3, Users, RefreshCw, ChevronLeft,
  ChevronRight, Zap, Tag, User, Calendar, PlusCircle, Mail, Copy, Check,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts'

/* ─── Tipos ──────────────────────────────────────────────────────── */
type Tab = 'overview' | 'explorador' | 'conciliacion' | 'fallas' | 'nuevo' | 'graficos'

interface TicketRow {
  cid: string; num: string; empresa: string; fecha: string; ticket_id: string
  categoria: string; subcategoria: string; es_falla: string; producto: string
  enlace: string; propietario: string; apertura: string; cierre: string
  duracion: string; prioridad: string
}

interface Stats {
  total: number; fallas: number
  byMes: Record<string, number>
  byCat: Record<string, number>
  byProd: Record<string, number>
  byPrior: Record<string, number>
  byProp: Record<string, number>
  topEmpresas: { nombre: string; total: number; fallas: number; ultima: string }[]
}

interface ChartData {
  total: number
  fallas: number
  avgDuracion: number
  topPropietario: string
  byPropietario: { name: string; tickets: number; fallas: number; avgDuracion: number }[]
  byMes: { mes: string; tickets: number; fallas: number }[]
  byProducto: { name: string; value: number }[]
  byPrioridad: { name: string; value: number }[]
  byCat: { name: string; value: number }[]
  byDuracion: { bucket: string; count: number }[]
}

interface ConcRow {
  cid: string; empresa: string; total: number; fallas: number; ultima: string
  cuenta: { id: string; cid: string | null; empresa: string; asesor: string; estado: string; health_score: number } | null
}

/* ─── Paleta ─────────────────────────────────────────────────────── */
const PRIORIDAD_COLOR: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#f59e0b',
  low: '#22c55e', normal: '#6b7280',
}
const PRODUCTO_COLOR: Record<string, string> = {
  voz: '#3b82f6', chat: '#8b5cf6', 'sin producto': '#9ca3af',
}

function prioColor(p: string) {
  return PRIORIDAD_COLOR[p?.toLowerCase()] ?? '#9ca3af'
}
function prodColor(p: string) {
  return PRODUCTO_COLOR[p?.toLowerCase()] ?? '#9ca3af'
}
// Etiquetas de mes derivadas del propio valor "YYYY-MM" — nunca de una lista
// fija. Una lista fija fue la razón por la que agosto no aparecía en los
// filtros pese a existir 1,046 tickets del mes (incidente 30 Ago 2026).
const MES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function mesLabel(m: string) {
  const n = Number(m?.slice(5, 7))
  return n >= 1 && n <= 12 ? MES_CORTO[n - 1] : m
}
function mesLabelLargo(m: string) {
  const n = Number(m?.slice(5, 7))
  return n >= 1 && n <= 12 ? `${MES_LARGO[n - 1]} ${m.slice(0, 4)}` : m
}

/* ─── Mini-componentes ──────────────────────────────────────────── */
function PillBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap"
      style={{ background: `${color}18`, color, borderColor: `${color}35` }}>
      {label}
    </span>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }:
  { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

type SortDir = 'asc' | 'desc'
function SortableTh({ label, col, sortCol, sortDir, onSort }: {
  label: string; col: string; sortCol: string; sortDir: SortDir; onSort: (c: string) => void
}) {
  const active = sortCol === col
  return (
    <th onClick={() => onSort(col)}
      className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none group"
      style={{ color: active ? '#1B3FCC' : '#6b7280' }}>
      <span className="flex items-center gap-1">
        {label}
        <span className="text-[9px] opacity-60 group-hover:opacity-100">
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
  )
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-xs text-gray-600 w-36 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{value}</span>
    </div>
  )
}

/* ─── Página ─────────────────────────────────────────────────────── */
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',     label: '📊 Overview' },
  { id: 'graficos',     label: '📈 Gráficos' },
  { id: 'explorador',   label: '🔍 Explorador' },
  { id: 'conciliacion', label: '🔗 Conciliación' },
  { id: 'fallas',       label: '⚡ Fallas' },
  { id: 'nuevo',        label: '🎫 Nuevo Ticket' },
]

// La lista de meses se construye desde los datos (/api/tickets?mode=meses)
// dentro del componente — ver mesesDisp/MESES. Aquí solo queda el fallback.
const MESES_FALLBACK: { val: string; label: string }[] = [{ val: '', label: 'Todos los meses' }]

// Fecha de apertura/cierre real (día exacto) — `fecha`/`mes` en los tickets
// solo traen precisión de mes ("2026-08"), apertura/cierre sí traen el día.
function fmtAperturaCorta(iso: string): string {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) }
  catch { return '' }
}

export default function TicketsPage() {
  const [tab, setTab] = useState<Tab>('overview')

  /* ── Stats ── */
  const [stats, setStats]       = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [overviewMes, setOverviewMes]   = useState('')

  /* ── Meses disponibles: derivados del dataset, nunca de una lista fija ── */
  const [mesesDisp, setMesesDisp] = useState<string[]>([])
  useEffect(() => {
    fetch('/api/tickets?mode=meses')
      .then(r => r.json())
      .then(d => setMesesDisp(Array.isArray(d.meses) ? d.meses : []))
      .catch(() => setMesesDisp([]))
  }, [])
  const MESES = useMemo(() => [
    ...MESES_FALLBACK,
    ...mesesDisp.map(m => ({ val: m, label: mesLabelLargo(m) })),
  ], [mesesDisp])
  const rangoMeses = useMemo(() => {
    if (!mesesDisp.length) return 'Histórico completo'
    const a = mesesDisp[0], b = mesesDisp[mesesDisp.length - 1]
    return a === b ? mesLabelLargo(a) : `${mesLabel(a)}–${mesLabel(b)} ${b.slice(0, 4)}`
  }, [mesesDisp])

  /* ── Explorador ── */
  const [rows, setRows]         = useState<TicketRow[]>([])
  const [listTotal, setListTotal] = useState(0)
  const [listPages, setListPages] = useState(1)
  const [page, setPage]           = useState(1)
  const [listLoading, setListLoading] = useState(false)
  const [q, setQ]                     = useState('')
  const [filterProd, setFilterProd]   = useState('')
  const [filterCat, setFilterCat]     = useState('')
  const [filterPrior, setFilterPrior] = useState('')
  const [filterMes, setFilterMes]     = useState('')
  const [filterDesde, setFilterDesde] = useState('') // YYYY-MM-DD — filtra por fecha de apertura
  const [filterHasta, setFilterHasta] = useState('')
  const [filterFalla, setFilterFalla]         = useState('')
  const [filterEjecutivo, setFilterEjecutivo] = useState('')
  const [filterSubcat, setFilterSubcat]       = useState('')
  const [filterCliente, setFilterCliente]     = useState('') // CID del cliente seleccionado
  const [propietarios, setPropietarios]       = useState<string[]>([])
  const [subcategorias, setSubcategorias]     = useState<string[]>([])
  const [clientes, setClientes]               = useState<{ cid: string; empresa: string; total: number }[]>([])
  const [sortCol, setSortCol]                 = useState('fecha')
  const [sortDir, setSortDir]                 = useState<SortDir>('desc')
  const qRef = useRef(q)

  /* ── Conciliación ── */
  const [conc, setConc]     = useState<{ matched: ConcRow[]; unmatched: ConcRow[]; totalEmpresas: number } | null>(null)
  const [concLoading, setConcLoading] = useState(false)
  const [concQ, setConcQ]   = useState('')
  const [concTab, setConcTab] = useState<'matched' | 'unmatched'>('matched')

  /* ── Nuevo Ticket ── */
  const [copied, setCopied] = useState(false)

  /* ── Modal gráfica Explorador ── */
  const [showModal, setShowModal]         = useState(false)
  const [modalData, setModalData]         = useState<ChartData | null>(null)
  const [modalLoading, setModalLoading]   = useState(false)

  function openExplModal() {
    setShowModal(true)
    setModalLoading(true)
    setModalData(null)
    const p = new URLSearchParams({ mode: 'charts' })
    if (qRef.current)    p.set('q', qRef.current)
    if (filterCliente)   p.set('cid', filterCliente)
    if (filterMes)       p.set('mes', filterMes)
    if (filterDesde)     p.set('desde', filterDesde)
    if (filterHasta)     p.set('hasta', filterHasta)
    if (filterEjecutivo) p.set('propietario', filterEjecutivo)
    if (filterProd)      p.set('producto', filterProd)
    if (filterPrior)     p.set('prioridad', filterPrior)
    if (filterFalla)     p.set('es_falla', filterFalla)
    if (filterCat)       p.set('categoria', filterCat)
    if (filterSubcat)    p.set('subcategoria', filterSubcat)
    fetch(`/api/tickets?${p}`)
      .then(r => r.json()).then(setModalData).finally(() => setModalLoading(false))
  }

  /* ── Gráficos ── */
  const [chartMes, setChartMes]         = useState('')
  const [chartProp, setChartProp]       = useState('')
  const [chartProd, setChartProd]       = useState('')
  const [chartPrior, setChartPrior]     = useState('')
  const [chartData, setChartData]       = useState<ChartData | null>(null)
  const [chartLoading, setChartLoading] = useState(false)

  function copySnippet() {
    navigator.clipboard.writeText('#original_sender {correo@cliente.com}')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Fallas ── */
  const [fallas, setFallas]     = useState<TicketRow[]>([])
  const [fallasTotal, setFallasTotal] = useState(0)
  const [fallasPage, setFallasPage]   = useState(1)
  const [fallasLoading, setFallasLoading] = useState(false)
  const [fallasQ, setFallasQ]         = useState('')

  /* ── Fetch stats ── */
  useEffect(() => {
    setStatsLoading(true)
    const p = new URLSearchParams({ mode: 'stats' })
    if (overviewMes) p.set('mes', overviewMes)
    fetch(`/api/tickets?${p}`)
      .then(r => r.json()).then(setStats).finally(() => setStatsLoading(false))
  }, [overviewMes])

  /* ── Fetch propietarios (una sola vez) ── */
  useEffect(() => {
    fetch('/api/tickets?mode=propietarios')
      .then(r => r.json())
      .then(d => setPropietarios(d.propietarios ?? []))
  }, [])

  /* ── Fetch clientes — empresa + CID (una sola vez) ── */
  useEffect(() => {
    fetch('/api/tickets?mode=clientes')
      .then(r => r.json())
      .then(d => setClientes(d.clientes ?? []))
  }, [])

  /* ── Fetch subcategorías (cambia si cambia categoria) ── */
  useEffect(() => {
    const p = new URLSearchParams({ mode: 'subcategorias' })
    if (filterCat) p.set('categoria', filterCat)
    fetch(`/api/tickets?${p}`)
      .then(r => r.json())
      .then(d => setSubcategorias(d.subcategorias ?? []))
    setFilterSubcat('')
  }, [filterCat])

  /* ── Handler sort ── */
  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  /* ── Fetch list ── */
  const fetchList = useCallback((pg = 1) => {
    setListLoading(true)
    const params = new URLSearchParams({ page: String(pg), limit: '50' })
    if (qRef.current)    params.set('q', qRef.current)
    if (filterCliente)   params.set('cid', filterCliente)
    if (filterProd)      params.set('producto', filterProd)
    if (filterCat)       params.set('categoria', filterCat)
    if (filterSubcat)    params.set('subcategoria', filterSubcat)
    if (filterPrior)     params.set('prioridad', filterPrior)
    if (filterMes)       params.set('mes', filterMes)
    if (filterDesde)     params.set('desde', filterDesde)
    if (filterHasta)     params.set('hasta', filterHasta)
    if (filterFalla)     params.set('es_falla', filterFalla)
    if (filterEjecutivo) params.set('propietario', filterEjecutivo)
    params.set('sortBy', sortCol)
    params.set('sortDir', sortDir)
    fetch(`/api/tickets?${params}`)
      .then(r => r.json())
      .then(d => { setRows(d.rows); setListTotal(d.total); setListPages(d.pages); setPage(pg) })
      .finally(() => setListLoading(false))
  }, [filterCliente, filterProd, filterCat, filterSubcat, filterPrior, filterMes, filterDesde, filterHasta, filterFalla, filterEjecutivo, sortCol, sortDir])

  useEffect(() => { if (tab === 'explorador') fetchList(1) }, [tab, fetchList])

  /* ── Fetch conciliación ── */
  useEffect(() => {
    if (tab !== 'conciliacion' || conc) return
    setConcLoading(true)
    fetch('/api/tickets?mode=conciliacion')
      .then(r => r.json()).then(setConc).finally(() => setConcLoading(false))
  }, [tab, conc])

  /* ── Fetch fallas ── */
  const fetchFallas = useCallback((pg = 1) => {
    setFallasLoading(true)
    const params = new URLSearchParams({ page: String(pg), limit: '50', es_falla: 'Si' })
    if (fallasQ) params.set('q', fallasQ)
    fetch(`/api/tickets?${params}`)
      .then(r => r.json())
      .then(d => { setFallas(d.rows); setFallasTotal(d.total); setFallasPage(pg) })
      .finally(() => setFallasLoading(false))
  }, [fallasQ])

  useEffect(() => { if (tab === 'fallas') fetchFallas(1) }, [tab, fetchFallas])

  /* ── Fetch charts ── */
  useEffect(() => {
    if (tab !== 'graficos') return
    setChartLoading(true)
    const p = new URLSearchParams({ mode: 'charts' })
    if (chartMes)   p.set('mes', chartMes)
    if (chartProp)  p.set('propietario', chartProp)
    if (chartProd)  p.set('producto', chartProd)
    if (chartPrior) p.set('prioridad', chartPrior)
    fetch(`/api/tickets?${p}`)
      .then(r => r.json()).then(setChartData).finally(() => setChartLoading(false))
  }, [tab, chartMes, chartProp, chartProd, chartPrior])

  /* ── Helpers ── */
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    qRef.current = q
    fetchList(1)
  }

  const BLUE = '#3b82f6', RED = '#ef4444', GREEN = '#22c55e', INDIGO = '#6366f1', AMBER = '#f59e0b'

  /* ─────────────────────────────────────── RENDER ─── */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Tickets 2026"
        subtitle={`${stats ? stats.total.toLocaleString('es-MX') : '—'} tickets · Zoho Desk`}
      />

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={tab === t.id ? { background: '#1B3FCC', color: '#fff' } : { color: '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

        {/* ═══ OVERVIEW ════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <>
            {/* Filtro de mes */}
            <div className="flex items-center gap-3">
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar por mes</span>
              <div className="flex flex-wrap gap-1.5">
                {MESES.map(m => (
                  <button key={m.val} onClick={() => setOverviewMes(m.val)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all border"
                    style={overviewMes === m.val
                      ? { background: '#1B3FCC', color: '#fff', borderColor: '#1B3FCC' }
                      : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}>
                    {m.val === '' ? 'Todos' : m.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {statsLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando estadísticas…</div>
            ) : stats ? (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard icon={Tag}           label="Total tickets"      value={stats.total.toLocaleString()}  sub={overviewMes ? MESES.find(m=>m.val===overviewMes)?.label : rangoMeses} color={BLUE}   />
                  <KpiCard icon={AlertTriangle} label="Fallas reales"      value={stats.fallas}                  sub={`${stats.total > 0 ? ((stats.fallas/stats.total)*100).toFixed(1) : 0}% del total`} color={RED} />
                  <KpiCard icon={Zap}           label="Producto Voz"       value={stats.byProd['Voz'] ?? 0}      sub="tickets de voz"            color={BLUE}   />
                  <KpiCard icon={Users}         label="Producto Chat"      value={stats.byProd['Chat'] ?? 0}     sub="tickets de chat"           color={INDIGO} />
                </div>

                {/* Por mes */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900 mb-4">Volumen por Mes</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(stats.byMes).sort().map(([mes, n]) => {

                      const colors = ['#3b82f6','#6366f1','#8b5cf6','#a855f7']
                      const idx = Object.keys(stats.byMes).sort().indexOf(mes)
                      return (
                        <div key={mes} className="rounded-lg p-3 border text-center"
                          style={{ background: `${colors[idx % 4]}08`, borderColor: `${colors[idx % 4]}25` }}>
                          <p className="text-xs text-gray-500">{mesLabel(mes)}</p>
                          <p className="text-2xl font-bold mt-1" style={{ color: colors[idx % 4] }}>{n}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Categorías y Prioridad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-sm text-gray-900 mb-3">Por Categoría</h3>
                    <div>
                      {Object.entries(stats.byCat).sort((a,b)=>b[1]-a[1]).map(([cat, n]) => (
                        <BarRow key={cat} label={cat} value={n}
                          max={Math.max(...Object.values(stats.byCat))} color={BLUE} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-sm text-gray-900 mb-3">Por Prioridad</h3>
                    <div className="space-y-2 mb-4">
                      {Object.entries(stats.byPrior).sort((a,b)=>b[1]-a[1]).map(([p, n]) => (
                        <BarRow key={p} label={p} value={n}
                          max={Math.max(...Object.values(stats.byPrior))} color={prioColor(p)} />
                      ))}
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-3 pt-3 border-t border-gray-100">Por Producto</h3>
                    <div>
                      {Object.entries(stats.byProd).sort((a,b)=>b[1]-a[1]).map(([p, n]) => (
                        <BarRow key={p} label={p} value={n}
                          max={Math.max(...Object.values(stats.byProd))} color={prodColor(p)} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Por Ejecutivo */}
                {stats.byProp && Object.keys(stats.byProp).length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-sm text-gray-900 mb-3">
                      Tickets por Ejecutivo
                      {overviewMes && <span className="ml-2 text-xs font-normal text-gray-400">· {MESES.find(m=>m.val===overviewMes)?.label}</span>}
                    </h3>
                    <div>
                      {Object.entries(stats.byProp).sort((a,b)=>b[1]-a[1]).map(([prop, n]) => (
                        <BarRow key={prop} label={prop} value={n}
                          max={Math.max(...Object.values(stats.byProp))} color={INDIGO} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Top empresas */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-sm text-gray-900">Top 20 Empresas por Volumen</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/70">
                          <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                          <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</th>
                          <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tickets</th>
                          <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fallas</th>
                          <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Última</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topEmpresas.map((e, i) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-2.5 px-4 text-xs text-gray-400">{i + 1}</td>
                            <td className="py-2.5 px-4 font-medium text-gray-900">{e.nombre}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-gray-700">{e.total}</td>
                            <td className="py-2.5 px-4 text-right">
                              {e.fallas > 0
                                ? <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: `${RED}15`, color: RED }}>{e.fallas}</span>
                                : <span className="text-xs text-gray-300">—</span>
                              }
                            </td>
                            <td className="py-2.5 px-4 text-xs text-gray-500">{e.ultima}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}

        {/* ═══ EXPLORADOR ════════════════════════════════════════════ */}
        {tab === 'explorador' && (
          <>
            {/* Búsqueda y filtros */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Buscar por # ticket, Ticket ID o nombre de empresa…"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <button type="submit"
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg"
                  style={{ background: '#1B3FCC' }}>
                  Buscar
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Producto', value: filterProd, setter: setFilterProd,
                    opts: [{ v: '', l: 'Todos' }, { v: 'Voz', l: 'Voz' }, { v: 'Chat', l: 'Chat' }, { v: 'Sin producto', l: 'Sin producto' }] },
                  { label: 'Prioridad', value: filterPrior, setter: setFilterPrior,
                    opts: [{ v: '', l: 'Todas' }, { v: 'Urgent', l: 'Urgente' }, { v: 'High', l: 'Alta' }, { v: 'Medium', l: 'Media' }, { v: 'Low', l: 'Baja' }] },
                  { label: 'Mes', value: filterMes, setter: setFilterMes,
                    opts: MESES.map(m => ({ v: m.val, l: m.label })) },
                  { label: 'Falla', value: filterFalla, setter: setFilterFalla,
                    opts: [{ v: '', l: 'Todas' }, { v: 'Si', l: 'Solo fallas' }, { v: 'No', l: 'No fallas' }] },
                ].map(f => (
                  <CustomSelect key={f.label} value={f.value}
                    onChange={v => { f.setter(v); setTimeout(() => fetchList(1), 0) }}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                    options={f.opts.map(o => ({ value: o.v, label: o.l }))} />
                ))}
                {/* Filtro cliente (empresa + CID) — dinámico, exacto */}
                <CustomSelect value={filterCliente}
                  onChange={v => { setFilterCliente(v); setTimeout(() => fetchList(1), 0) }}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                  options={[{ value: '', label: 'Cliente (todos)' }, ...clientes.map(c => ({ value: c.cid, label: `${c.empresa} · CID ${c.cid} (${c.total})` }))]} />
                {/* Filtro ejecutivo — dinámico */}
                <CustomSelect value={filterEjecutivo}
                  onChange={v => { setFilterEjecutivo(v); setTimeout(() => fetchList(1), 0) }}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                  options={[{ value: '', label: 'Ejecutivo (todos)' }, ...propietarios.map(p => ({ value: p, label: p }))]} />
                {/* Filtro subcategoría — dinámico */}
                <CustomSelect value={filterSubcat}
                  onChange={v => { setFilterSubcat(v); setTimeout(() => fetchList(1), 0) }}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                  options={[{ value: '', label: 'Subcategoría (todas)' }, ...subcategorias.map(s => ({ value: s, label: s }))]} />
                {/* Rango de fecha (apertura) — día exacto, para filtrar por semana o rango específico */}
                <div className="flex items-center gap-1 text-xs">
                  <Calendar size={12} className="text-gray-400" />
                  <input type="date" value={filterDesde}
                    onChange={e => { setFilterDesde(e.target.value); setTimeout(() => fetchList(1), 0) }}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white" />
                  <span className="text-gray-400">–</span>
                  <input type="date" value={filterHasta}
                    onChange={e => { setFilterHasta(e.target.value); setTimeout(() => fetchList(1), 0) }}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white" />
                </div>
                <button onClick={() => {
                    const hoy = new Date()
                    const lunes = new Date(hoy)
                    lunes.setDate(hoy.getDate() + (hoy.getDay() === 0 ? -6 : 1 - hoy.getDay()))
                    const domingo = new Date(lunes)
                    domingo.setDate(lunes.getDate() + 6)
                    const iso = (d: Date) => d.toISOString().slice(0, 10)
                    setFilterDesde(iso(lunes)); setFilterHasta(iso(domingo))
                    setTimeout(() => fetchList(1), 0)
                  }}
                  className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                  Esta semana
                </button>
                {(filterDesde || filterHasta) && (
                  <button onClick={() => { setFilterDesde(''); setFilterHasta(''); setTimeout(() => fetchList(1), 0) }}
                    className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                    Limpiar fecha
                  </button>
                )}
                <button onClick={() => fetchList(1)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                  <RefreshCw size={11} /> Actualizar
                </button>
                <button onClick={openExplModal}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                  style={{ background: INDIGO }}>
                  <BarChart3 size={11} /> Ver gráfica
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>{listLoading ? 'Cargando…' : `${listTotal.toLocaleString()} resultados`}</span>
                <span>Página {page} / {listPages}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">#</th>
                      <SortableTh label="Empresa"      col="empresa"      sortCol={sortCol} sortDir={sortDir} onSort={c => { handleSort(c); setTimeout(() => fetchList(1), 0) }} />
                      <SortableTh label="Categoría"    col="categoria"    sortCol={sortCol} sortDir={sortDir} onSort={c => { handleSort(c); setTimeout(() => fetchList(1), 0) }} />
                      <SortableTh label="Subcategoría" col="subcategoria" sortCol={sortCol} sortDir={sortDir} onSort={c => { handleSort(c); setTimeout(() => fetchList(1), 0) }} />
                      <SortableTh label="Producto"     col="producto"     sortCol={sortCol} sortDir={sortDir} onSort={c => { handleSort(c); setTimeout(() => fetchList(1), 0) }} />
                      <SortableTh label="Prioridad"    col="prioridad"    sortCol={sortCol} sortDir={sortDir} onSort={c => { handleSort(c); setTimeout(() => fetchList(1), 0) }} />
                      <SortableTh label="Falla"        col="falla"        sortCol={sortCol} sortDir={sortDir} onSort={c => { handleSort(c); setTimeout(() => fetchList(1), 0) }} />
                      <SortableTh label="Propietario"  col="propietario"  sortCol={sortCol} sortDir={sortDir} onSort={c => { handleSort(c); setTimeout(() => fetchList(1), 0) }} />
                      <SortableTh label="Fecha"        col="fecha"        sortCol={sortCol} sortDir={sortDir} onSort={c => { handleSort(c); setTimeout(() => fetchList(1), 0) }} />
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Enlace</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listLoading ? (
                      <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-400">Cargando…</td></tr>
                    ) : rows.length === 0 ? (
                      <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-400">Sin resultados</td></tr>
                    ) : rows.map((t, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/20 transition-colors">
                        <td className="py-2.5 px-3 text-xs text-gray-400 font-mono">{t.num}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-900 max-w-[180px] truncate">{t.empresa}</td>
                        <td className="py-2.5 px-3"><PillBadge label={t.categoria} color={BLUE} /></td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 max-w-[140px] truncate">{t.subcategoria}</td>
                        <td className="py-2.5 px-3"><PillBadge label={t.producto || '—'} color={prodColor(t.producto)} /></td>
                        <td className="py-2.5 px-3"><PillBadge label={t.prioridad || 'Low'} color={prioColor(t.prioridad)} /></td>
                        <td className="py-2.5 px-3 text-center">
                          {t.es_falla === 'Si'
                            ? <AlertTriangle size={13} style={{ color: RED }} />
                            : <CheckCircle2 size={13} style={{ color: GREEN }} />}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-600 whitespace-nowrap">{t.propietario}</td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap" title={t.cierre ? `Cierre: ${fmtAperturaCorta(t.cierre)}` : ''}>
                          {fmtAperturaCorta(t.apertura) || t.fecha}
                        </td>
                        <td className="py-2.5 px-3">
                          {t.enlace ? (
                            <a href={t.enlace} target="_blank" rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700">
                              <ExternalLink size={13} />
                            </a>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Paginación */}
              {listPages > 1 && (
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <button onClick={() => fetchList(page - 1)} disabled={page <= 1}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    <ChevronLeft size={13} /> Anterior
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(7, listPages) }, (_, i) => {
                      const p = i + Math.max(1, page - 3)
                      if (p > listPages) return null
                      return (
                        <button key={p} onClick={() => fetchList(p)}
                          className="w-7 h-7 rounded text-xs font-medium"
                          style={p === page ? { background: '#1B3FCC', color: '#fff' } : { color: '#374151' }}>
                          {p}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={() => fetchList(page + 1)} disabled={page >= listPages}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    Siguiente <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ CONCILIACIÓN ══════════════════════════════════════════ */}
        {tab === 'conciliacion' && (
          <>
            {concLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Conciliando con cuentas activas…</div>
            ) : conc ? (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  <KpiCard icon={CheckCircle2} label="Con match en cuentas"   value={conc.matched.length}   sub="empresas identificadas" color={GREEN}  />
                  <KpiCard icon={XCircle}      label="Sin match en cuentas"   value={conc.unmatched.length} sub="empresas no identificadas" color={RED} />
                  <KpiCard icon={Users}        label="Total empresas únicas"  value={conc.totalEmpresas}    sub="en tickets 2026"         color={INDIGO} />
                </div>

                {/* Sub-tabs */}
                <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm flex gap-1 w-fit">
                  {(['matched','unmatched'] as const).map(t => (
                    <button key={t} onClick={() => setConcTab(t)}
                      className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                      style={concTab === t ? { background: '#1B3FCC', color: '#fff' } : { color: '#6b7280' }}>
                      {t === 'matched'
                        ? `✅ Matched (${conc.matched.length})`
                        : `❌ Sin match (${conc.unmatched.length})`}
                    </button>
                  ))}
                </div>

                {/* Búsqueda conciliación */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={concQ} onChange={e => setConcQ(e.target.value)}
                    placeholder="Filtrar por empresa…"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>

                {/* Tabla conciliación */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/70">
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa (ticket)</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tickets</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fallas</th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Último ticket</th>
                          {concTab === 'matched' && <>
                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Match en cuentas</th>
                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asesor</th>
                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">HS</th>
                          </>}
                          {concTab === 'unmatched' && (
                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(concTab === 'matched' ? conc.matched : conc.unmatched)
                          .filter(r => !concQ || r.empresa.toLowerCase().includes(concQ.toLowerCase()))
                          .map((r, i) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                              <td className="py-2.5 px-4 font-medium text-gray-900">{r.empresa}</td>
                              <td className="py-2.5 px-4 text-right font-semibold text-gray-700">{r.total}</td>
                              <td className="py-2.5 px-4 text-right">
                                {r.fallas > 0
                                  ? <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: `${RED}15`, color: RED }}>{r.fallas}</span>
                                  : <span className="text-xs text-gray-300">—</span>}
                              </td>
                              <td className="py-2.5 px-4 text-xs text-gray-500">{r.ultima}</td>
                              {concTab === 'matched' && r.cuenta && <>
                                <td className="py-2.5 px-4 text-xs font-medium" style={{ color: GREEN }}>{r.cuenta.empresa}</td>
                                <td className="py-2.5 px-4 text-xs text-gray-600">{r.cuenta.asesor}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <span className="text-xs font-bold" style={{ color: r.cuenta.health_score >= 70 ? GREEN : r.cuenta.health_score >= 40 ? AMBER : RED }}>
                                    {r.cuenta.health_score}
                                  </span>
                                </td>
                              </>}
                              {concTab === 'unmatched' && (
                                <td className="py-2.5 px-4">
                                  <span className="text-xs text-gray-400 italic">No encontrada en cuentas activas</span>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}

        {/* ═══ FALLAS ════════════════════════════════════════════════ */}
        {tab === 'fallas' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3"
              style={{ borderLeft: `4px solid ${RED}` }}>
              <AlertTriangle size={18} style={{ color: RED }} />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {fallasTotal} tickets marcados como Falla real
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  ES FALLA = Sí · Casos que requieren análisis de causa raíz
                </p>
              </div>
            </div>

            {/* Búsqueda fallas */}
            <form onSubmit={e => { e.preventDefault(); fetchFallas(1) }} className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={fallasQ} onChange={e => setFallasQ(e.target.value)}
                  placeholder="Buscar en fallas por empresa o # ticket…"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30" />
              </div>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white rounded-xl" style={{ background: RED }}>
                Buscar
              </button>
            </form>

            {/* Tabla fallas */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      {['#', 'Empresa', 'Categoría', 'Subcategoría', 'Producto', 'Prioridad', 'Propietario', 'Apertura', 'Duración', 'Enlace'].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fallasLoading ? (
                      <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-400">Cargando…</td></tr>
                    ) : fallas.map((t, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-red-50/20 transition-colors">
                        <td className="py-2.5 px-3 text-xs text-gray-400 font-mono">{t.num}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-900 max-w-[160px] truncate">{t.empresa}</td>
                        <td className="py-2.5 px-3"><PillBadge label={t.categoria} color={RED} /></td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 max-w-[140px] truncate">{t.subcategoria}</td>
                        <td className="py-2.5 px-3"><PillBadge label={t.producto || '—'} color={prodColor(t.producto)} /></td>
                        <td className="py-2.5 px-3"><PillBadge label={t.prioridad || 'Low'} color={prioColor(t.prioridad)} /></td>
                        <td className="py-2.5 px-3 text-xs text-gray-600">{t.propietario}</td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap" title={t.cierre ? `Cierre: ${fmtAperturaCorta(t.cierre)}` : ''}>{fmtAperturaCorta(t.apertura)}</td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap">{t.duracion}</td>
                        <td className="py-2.5 px-3">
                          {t.enlace ? (
                            <a href={t.enlace} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-600">
                              <ExternalLink size={13} />
                            </a>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Paginación fallas */}
              {fallasTotal > 50 && (
                <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                  <button onClick={() => fetchFallas(fallasPage - 1)} disabled={fallasPage <= 1}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">
                    <ChevronLeft size={13} /> Anterior
                  </button>
                  <span className="text-xs text-gray-500">
                    {fallasPage} / {Math.ceil(fallasTotal / 50)}
                  </span>
                  <button onClick={() => fetchFallas(fallasPage + 1)} disabled={fallasPage >= Math.ceil(fallasTotal / 50)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">
                    Siguiente <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ GRÁFICOS ══════════════════════════════════════════════ */}
        {tab === 'graficos' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Filter size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Filtrar</span>
                <CustomSelect value={chartMes} onChange={setChartMes}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                  options={MESES.map(m => ({ value: m.val, label: m.label }))} />
                <CustomSelect value={chartProp} onChange={setChartProp}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                  options={[{ value: '', label: 'Ejecutivo (todos)' }, ...propietarios.map(p => ({ value: p, label: p }))]} />
                <CustomSelect value={chartProd} onChange={setChartProd}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                  options={[
                    { value: '', label: 'Producto (todos)' },
                    { value: 'Voz', label: 'Voz' },
                    { value: 'Chat', label: 'Chat' },
                    { value: 'Sin producto', label: 'Sin producto' },
                  ]} />
                <CustomSelect value={chartPrior} onChange={setChartPrior}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                  options={[
                    { value: '', label: 'Prioridad (todas)' },
                    { value: 'Urgent', label: 'Urgente' },
                    { value: 'High', label: 'Alta' },
                    { value: 'Medium', label: 'Media' },
                    { value: 'Low', label: 'Baja' },
                  ]} />
                {(chartMes || chartProp || chartProd || chartPrior) && (
                  <button onClick={() => { setChartMes(''); setChartProp(''); setChartProd(''); setChartPrior('') }}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {chartLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando gráficos…</div>
            ) : chartData ? (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard icon={Tag}           label="Total tickets"     value={chartData.total.toLocaleString('es-MX')} color={BLUE}   />
                  <KpiCard icon={AlertTriangle} label="Fallas reales"     value={chartData.fallas} sub={`${chartData.total > 0 ? ((chartData.fallas / chartData.total) * 100).toFixed(1) : 0}% del total`} color={RED} />
                  <KpiCard icon={Clock}         label="Duración promedio" value={`${chartData.avgDuracion}h`} sub="horas por ticket" color={AMBER} />
                  <KpiCard icon={User}          label="Top ejecutivo"     value={chartData.topPropietario} color={INDIGO} />
                </div>

                {/* Tickets por Ejecutivo — horizontal */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900 mb-4">Tickets por Ejecutivo</h3>
                  <ResponsiveContainer width="100%" height={Math.min(520, Math.max(200, chartData.byPropietario.length * 30))}>
                    <BarChart data={chartData.byPropietario} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number, n: string) => [v, n === 'tickets' ? 'Tickets' : 'Fallas']} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="tickets" name="Tickets" fill={BLUE} radius={[0, 3, 3, 0]} />
                      <Bar dataKey="fallas"  name="Fallas"  fill={RED}  radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Volumen por Mes */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900 mb-4">Volumen por Mes</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData.byMes.map(d => ({ ...d, label: mesLabel(d.mes) }))} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number, n: string) => [v, n === 'tickets' ? 'Tickets' : 'Fallas']} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="tickets" name="Tickets" fill={BLUE} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="fallas"  name="Fallas"  fill={RED}  radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Producto y Prioridad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-sm text-gray-900 mb-4">Por Producto</h3>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={chartData.byProducto} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [v, 'Tickets']} />
                        <Bar dataKey="value" name="Tickets" radius={[3, 3, 0, 0]}>
                          {chartData.byProducto.map((e, i) => <Cell key={i} fill={prodColor(e.name)} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-sm text-gray-900 mb-4">Por Prioridad</h3>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={chartData.byPrioridad} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [v, 'Tickets']} />
                        <Bar dataKey="value" name="Tickets" radius={[3, 3, 0, 0]}>
                          {chartData.byPrioridad.map((e, i) => <Cell key={i} fill={prioColor(e.name)} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Distribución por duración */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900 mb-4">Distribución por Tiempo de Resolución</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData.byDuracion} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [v, 'Tickets']} />
                      <Bar dataKey="count" name="Tickets" fill={INDIGO} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : null}
          </>
        )}

        {/* ═══ NUEVO TICKET ══════════════════════════════════════════ */}
        {tab === 'nuevo' && (
          <div className="space-y-4 max-w-3xl">

            {/* Banner explicativo */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              style={{ borderLeft: '4px solid #1B3FCC' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1B3FCC15' }}>
                  <PlusCircle size={18} style={{ color: '#1B3FCC' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 mb-1">Levantar ticket a nombre del cliente</h2>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Cuando un ticket se levanta desde el correo del equipo, el titular queda registrado como interno
                    en lugar del cliente. Usa el formulario de abajo para asignar directamente al cliente como titular
                    desde el inicio — sin ajustes posteriores.
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario embebido */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Formulario — Zoho Desk</span>
                <a
                  href="https://forms.zohopublic.com/jadelriogdig1/form/Nuevoticket/formperma/NujUVJ5Mw5WyeXRaoEgXuEHx0OfZNBhozp_D8WfGSXs"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: '#1B3FCC' }}>
                  Abrir en nueva pestaña <ExternalLink size={11} />
                </a>
              </div>
              <iframe
                src="https://forms.zohopublic.com/jadelriogdig1/form/Nuevoticket/formperma/NujUVJ5Mw5WyeXRaoEgXuEHx0OfZNBhozp_D8WfGSXs"
                title="Nuevo ticket a nombre del cliente"
                width="100%"
                height="620"
                style={{ border: 'none', display: 'block' }}
              />
            </div>

            {/* Tip: reenvío de correo */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#f59e0b15' }}>
                  <Mail size={18} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Reenviar un correo del cliente</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Si recibes un correo de un cliente y quieres reenviarlo a{' '}
                    <span className="font-semibold text-gray-800">ayuda@callpicker.com</span> para que sea atendido,
                    agrega la siguiente línea <span className="font-semibold">al inicio del cuerpo del correo</span>{' '}
                    antes de reenviar. El cliente será asignado automáticamente como titular del ticket.
                  </p>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100"
                  style={{ background: '#f8fafc' }}>
                  <span className="text-xs text-gray-500 font-mono">Agregar al inicio del cuerpo del correo</span>
                  <button
                    onClick={copySnippet}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all"
                    style={copied
                      ? { background: '#22c55e15', color: '#16a34a' }
                      : { background: '#f8fafc', color: '#475569' }}>
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="px-4 py-3" style={{ background: '#0f172a' }}>
                  <code className="text-sm font-mono" style={{ color: '#7dd3fc' }}>
                    #original_sender &#123;correo@cliente.com&#125;
                  </code>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                Sustituye <span className="font-mono text-gray-600">correo@cliente.com</span> por la dirección
                real del cliente. Zoho Desk detecta la etiqueta automáticamente y asigna al contacto correcto.
              </p>
            </div>

          </div>
        )}

      </div>

      {/* ─── MODAL GRÁFICA EXPLORADOR ─────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Gráfica del filtro actual</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {listTotal.toLocaleString('es-MX')} tickets
                  {qRef.current         && ` · "${qRef.current}"`}
                  {filterCliente        && ` · ${clientes.find(c => c.cid === filterCliente)?.empresa ?? `CID ${filterCliente}`}`}
                  {filterMes            && ` · ${MESES.find(m => m.val === filterMes)?.label}`}
                  {(filterDesde || filterHasta) && ` · ${filterDesde || '…'} → ${filterHasta || '…'}`}
                  {filterEjecutivo      && ` · ${filterEjecutivo}`}
                  {filterProd           && ` · ${filterProd}`}
                  {filterCat            && ` · ${filterCat}`}
                  {filterSubcat         && ` · ${filterSubcat}`}
                  {filterPrior          && ` · Prioridad ${filterPrior}`}
                  {filterFalla === 'Si'  && ` · Solo fallas`}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <XCircle size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {modalLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Calculando gráficas…</div>
              ) : modalData ? (
                <>
                  {/* KPIs */}
                  <div className="grid grid-cols-3 gap-3">
                    <KpiCard icon={Tag}           label="Tickets filtrados" value={modalData.total.toLocaleString('es-MX')} color={BLUE}   />
                    <KpiCard icon={AlertTriangle} label="Fallas reales"     value={modalData.fallas} sub={`${modalData.total > 0 ? ((modalData.fallas / modalData.total) * 100).toFixed(1) : 0}%`} color={RED} />
                    <KpiCard icon={Clock}         label="Duración promedio" value={`${modalData.avgDuracion}h`} sub="horas por ticket" color={AMBER} />
                  </div>

                  {/* Categoría — horizontal */}
                  {modalData.byCat?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wide mb-3">Por Categoría</h3>
                      <ResponsiveContainer width="100%" height={Math.min(380, modalData.byCat.length * 32 + 20)}>
                        <BarChart data={modalData.byCat} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [v, 'Tickets']} />
                          <Bar dataKey="value" name="Tickets" fill={BLUE} radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Prioridad + Producto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wide mb-3">Por Prioridad</h3>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={modalData.byPrioridad} margin={{ left: 0, right: 15, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [v, 'Tickets']} />
                          <Bar dataKey="value" name="Tickets" radius={[3, 3, 0, 0]}>
                            {modalData.byPrioridad.map((e, i) => <Cell key={i} fill={prioColor(e.name)} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wide mb-3">Por Producto</h3>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={modalData.byProducto} margin={{ left: 0, right: 15, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [v, 'Tickets']} />
                          <Bar dataKey="value" name="Tickets" radius={[3, 3, 0, 0]}>
                            {modalData.byProducto.map((e, i) => <Cell key={i} fill={prodColor(e.name)} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Por ejecutivo — solo si no hay filtro por uno */}
                  {!filterEjecutivo && modalData.byPropietario.length > 1 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wide mb-3">Por Ejecutivo</h3>
                      <ResponsiveContainer width="100%" height={Math.min(440, modalData.byPropietario.length * 30 + 20)}>
                        <BarChart data={modalData.byPropietario} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="tickets" name="Tickets" fill={BLUE} radius={[0, 3, 3, 0]} />
                          <Bar dataKey="fallas"  name="Fallas"  fill={RED}  radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
