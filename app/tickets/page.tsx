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
import { tonoSobreClaro, tonoSobreFondo } from '@/lib/contraste'
import { fechaLocal } from '@/lib/fecha-local'

/* ─── Tipos ──────────────────────────────────────────────────────── */
type Tab = 'overview' | 'sla' | 'explorador' | 'conciliacion' | 'fallas' | 'nuevo' | 'graficos'

interface TicketRow {
  cid: string; num: string; empresa: string; fecha: string; ticket_id: string
  categoria: string; subcategoria: string; es_falla: string; producto: string
  enlace: string; propietario: string; apertura: string; cierre: string
  duracion: string; prioridad: string
  /* Campos normalizados por lib/tickets-norm.ts. Son los que se deben pintar:
     los crudos de arriba mienten en seis frentes distintos (mes de cierre
     disfrazado de apertura, fechas UTC, prioridad vacía contada como Low,
     acentos que parten categorías, propietarios en 37 variantes y tráfico
     interno compitiendo con clientes). */
  diaMx: string; mesApertura: string; mesCierre: string; aperturaMx: string
  tipo: string; canal: string; categoriaNorm: string; subcategoriaNorm: string
  prioridadNorm: string; propietarioNorm: string; empresaCanon: string
  interno: boolean; abierto: boolean
  esFallaBandera: boolean; esFallaCategoria: boolean
  duracion_hrs: number | null
}

/** La cobertura real del archivo — calculada, nunca escrita a mano. Viaja en
 *  TODAS las respuestas del API para que ninguna cifra quede sin contexto. */
interface Cobertura {
  total: number; internos: number; deClientes: number
  desde: string; hasta: string
  primerMes: string; ultimoMes: string
  mesesApertura: string[]; mesesCierre: string[]
  sinCierre: number; abiertosMedible: boolean; cidsDistintos: number
  fallasBandera: number; fallasCategoria: number
}

interface Meta {
  cobertura: Cobertura
  abiertosMedible: boolean
  notaSoloCerrados: string
}

interface EmpresaRow {
  cid: string; nombre: string; interno: boolean
  total: number; fallas: number; ultima: string
}

interface Stats extends Meta {
  total: number; fallas: number
  fallasBandera: number; fallasCategoria: number
  byMes: Record<string, number>
  byMesCierre: Record<string, number>
  byCat: Record<string, number>
  byTipo: Record<string, number>
  byCanal: Record<string, number>
  byProd: Record<string, number>
  byPrior: Record<string, number>
  byProp: Record<string, number>
  topEmpresas: EmpresaRow[]
  /** El cubo de resto. Sin esto, el top-20 tiraba el 82.8% en silencio. */
  otrasEmpresas: { grupos: number; total: number; fallas: number } | null
  empresasTotales: number
  internos: number
}

interface ResumenDuracion {
  n: number; sinDato: number
  media: number; mediana: number; p90: number; p99: number; max: number
}

interface ChartData extends Meta {
  total: number
  fallas: number
  fallasCategoria: number
  avgDuracion: number
  duracion: ResumenDuracion
  sinDuracion: number
  topPropietario: string
  byPropietario: { name: string; tickets: number; fallas: number; medianaDuracion: number; avgDuracion: number; sinDuracion: number }[]
  byMes: { mes: string; tickets: number; fallas: number }[]
  byMesCierre: { mes: string; tickets: number }[]
  byProducto: { name: string; value: number }[]
  byPrioridad: { name: string; value: number }[]
  byCat: { name: string; value: number }[]
  byTipo: { name: string; value: number }[]
  byDuracion: { bucket: string; count: number }[]
  prioridades: string[]
}

interface ConcRow {
  cid: string; empresa: string; alias: string[]; total: number; fallas: number
  ultima: string; interno: boolean
  cuenta: {
    id: string; cid: string | null; empresa: string; asesor: string
    estado: string; health_score: number; sinServicio: boolean
  } | null
}

interface ConcData extends Meta {
  matched: ConcRow[]; unmatched: ConcRow[]
  totalEmpresas: number; cidsDistintos: number
  ticketsCruzados: number; ticketsSinCruzar: number
  cuentasCartera: number; cuentasCanceladas: number; cuentasSinServicio: number
  internos: number
}

/* ─── Paleta ─────────────────────────────────────────────────────── */
const PRIORIDAD_COLOR: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#f59e0b',
  low: '#22c55e', normal: '#6b7280', 'sin prioridad': '#94a3b8',
}

/* Las SEIS prioridades que existen de verdad en el archivo. El desplegable
   tenía cuatro, así que 424 tickets (7.2%) no se podían aislar desde la UI: los
   242 en blanco se pintaban «Low» —inflando esa barra de 4,147 a 4,389— y los
   182 con el valor 'normal' no los alcanzaba ninguna opción.
   'Normal' NO se traduce a Media: no consta que sean lo mismo. */
const PRIORIDADES: { val: string; label: string }[] = [
  { val: '',              label: 'Todas las prioridades' },
  { val: 'Urgent',        label: 'Urgente' },
  { val: 'High',          label: 'Alta' },
  { val: 'Medium',        label: 'Media' },
  { val: 'Normal',        label: 'Normal (valor propio de Zoho)' },
  { val: 'Low',           label: 'Baja' },
  { val: 'Sin prioridad', label: 'Sin prioridad (en blanco)' },
]
const PRIORIDAD_LABEL: Record<string, string> = {
  Urgent: 'Urgente', High: 'Alta', Medium: 'Media',
  Normal: 'Normal', Low: 'Baja', 'Sin prioridad': 'Sin prioridad',
}
function prioLabel(p: string) {
  return PRIORIDAD_LABEL[p] ?? (p || 'Sin prioridad')
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
      /* El texto se oscurece; el fondo conserva el tono. Antes la letra
         y el fondo eran el MISMO color y la pastilla daba ~2:1. */
      style={{ background: `${color}18`, color: tonoSobreClaro(color, 0.09), borderColor: `${color}35` }}>
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

/* El carril es `bg-gray-100` (#F3F4F6) y la barra iba con el tono crudo: el
   ámbar medía 1.95:1 contra el carril, el verde 2.07:1 y el naranja 2.55:1,
   bajo el 3:1 que WCAG pide a un objeto gráfico. Se CALCULA el tono que pasa,
   en vez de elegirlo a ojo — el tono se conserva, solo se oscurece lo justo. */
const CARRIL = '#F3F4F6'

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-xs text-gray-600 w-36 truncate flex-shrink-0" title={label}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: CARRIL }}>
        <div className="h-full rounded-full"
          style={{ width: `${pct}%`, background: tonoSobreFondo(color, CARRIL) }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right tabular-nums">
        {value.toLocaleString('es-MX')}
      </span>
    </div>
  )
}

/* ─── Página ─────────────────────────────────────────────────────── */
/* Lo que devuelve /api/mesa-ayuda. Se declara aquí y no se infiere: si la
   ruta cambia de forma, esto falla al compilar en vez de pintar undefined. */
interface VencidoVivo {
  folio: string; asunto: string; contacto: string; cid: string; cuenta: string
  vence: string; diasSLA: number | null; ultimaAct: string
  diasSinMover: number | null; estado: string; responsable: string; canal: string
}
interface MesaResumen {
  hay: boolean
  cortes: number
  fecha: string | null
  hora: string | null
  vencidos: number
  abiertos: number | null
  enEspera: number | null
  noAsignados: number | null
  porCuenta: { cid: string; cuenta: string; folios: number; peorDias: number; rachas: number }[]
  vencidosDetalle: VencidoVivo[]
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',     label: '📊 Overview' },
  /* «Fuera de SLA» va SEGUNDA, justo después del resumen. Es lo único de este
     módulo que habla del presente: todo lo demás son tickets ya cerrados. */
  { id: 'sla',          label: '🔥 Fuera de SLA' },
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
  /* El estado VIVO de la mesa, que el export de Zoho no trae: viene de los
     cortes diarios en data/mesa-ayuda. `null` = aún cargando; `hay:false` =
     no hay ningún corte, y eso se DICE, no se disimula con ceros. */
  const [mesa, setMesa] = useState<MesaResumen | null>(null)
  useEffect(() => {
    fetch('/api/mesa-ayuda')
      .then(r => r.ok ? r.json() : null)
      .then(d => setMesa(d))
      .catch(() => setMesa(null))
  }, [])

  /* ── Stats ── */
  const [stats, setStats]       = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [overviewMes, setOverviewMes]   = useState('')

  /* ── Meses disponibles: derivados del dataset, nunca de una lista fija ──
       Y por mes de APERTURA, no de cierre: 851 tickets caen en un mes distinto
       de aquel en que entraron, y el eje temporal debe decir cuándo ENTRÓ el
       problema. La cobertura viaja en la misma respuesta. */
  const [mesesDisp, setMesesDisp] = useState<string[]>([])
  const [cob, setCob] = useState<Cobertura | null>(null)
  useEffect(() => {
    fetch('/api/tickets?mode=meses')
      .then(r => r.json())
      .then(d => {
        setMesesDisp(Array.isArray(d.meses) ? d.meses : [])
        setCob(d.cobertura ?? null)
      })
      .catch(() => { setMesesDisp([]); setCob(null) })
  }, [])
  const MESES = useMemo(() => [
    ...MESES_FALLBACK,
    ...mesesDisp.map(m => ({ val: m, label: mesLabelLargo(m) })),
  ], [mesesDisp])
  /* El rango cruza de año: el archivo arranca en ago-2025 y la etiqueta antigua
     pegaba un solo año al final («Ago–Sep 2026»), que para 2025 era falso. */
  const rangoMeses = useMemo(() => {
    if (!mesesDisp.length) return 'Histórico completo'
    const a = mesesDisp[0], b = mesesDisp[mesesDisp.length - 1]
    if (a === b) return mesLabelLargo(a)
    const anioA = a.slice(0, 4), anioB = b.slice(0, 4)
    return anioA === anioB
      ? `${mesLabel(a)}–${mesLabel(b)} ${anioB}`
      : `${mesLabel(a)} ${anioA}–${mesLabel(b)} ${anioB}`
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
  const [filterInterno, setFilterInterno]     = useState('') // '' | 'excluir' | 'solo'
  const [propietarios, setPropietarios]       = useState<string[]>([])
  const [subcategorias, setSubcategorias]     = useState<string[]>([])
  const [clientes, setClientes]               = useState<{ cid: string; empresa: string; total: number; alias: string[]; interno: boolean }[]>([])
  const [sortCol, setSortCol]                 = useState('fecha')
  const [sortDir, setSortDir]                 = useState<SortDir>('desc')
  const qRef = useRef(q)

  /* ── Conciliación ── */
  const [conc, setConc]     = useState<ConcData | null>(null)
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
    if (filterCat)       p.set('tipo', filterCat)
    if (filterSubcat)    p.set('subcategoria', filterSubcat)
    if (filterInterno)   p.set('interno', filterInterno)
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
      // `nombres` viene ya fundido: 37 cadenas para 19 personas y una cola.
      // Filtrar por «Mario H.» perdía los 6 tickets de «Mario Hernández».
      .then(d => setPropietarios(Array.isArray(d.nombres) ? d.nombres : []))
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
    if (filterCat)       params.set('tipo', filterCat)
    if (filterSubcat)    params.set('subcategoria', filterSubcat)
    if (filterPrior)     params.set('prioridad', filterPrior)
    if (filterMes)       params.set('mes', filterMes)
    if (filterDesde)     params.set('desde', filterDesde)
    if (filterHasta)     params.set('hasta', filterHasta)
    if (filterFalla)     params.set('es_falla', filterFalla)
    if (filterEjecutivo) params.set('propietario', filterEjecutivo)
    if (filterInterno)   params.set('interno', filterInterno)
    params.set('sortBy', sortCol)
    params.set('sortDir', sortDir)
    fetch(`/api/tickets?${params}`)
      .then(r => r.json())
      .then(d => { setRows(d.rows); setListTotal(d.total); setListPages(d.pages); setPage(pg) })
      .finally(() => setListLoading(false))
  }, [filterCliente, filterProd, filterCat, filterSubcat, filterPrior, filterMes, filterDesde, filterHasta, filterFalla, filterEjecutivo, filterInterno, sortCol, sortDir])

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
      {/* El subtítulo usaba `stats.total`, que se recalcula con el filtro de mes
          del Overview. Al filtrar a Febrero el encabezado pasaba a «147 tickets»
          y SE QUEDABA ASÍ al cambiar de pestaña, donde ya no hay ningún filtro
          visible: el número se leía como el total del archivo. Ahora el
          encabezado muestra SIEMPRE la cobertura del archivo —que no depende de
          ningún filtro— y el conteo filtrado vive dentro del Overview.
          El título también se calcula: decía «Tickets 2026» y el archivo arranca
          en agosto de 2025. */}
      <PageHeader
        title={cob ? `Tickets · ${mesLabelLargo(cob.primerMes)} a ${mesLabelLargo(cob.ultimoMes)}` : 'Tickets'}
        subtitle={cob
          ? `${cob.total.toLocaleString('es-MX')} tickets en el archivo · ${cob.deClientes.toLocaleString('es-MX')} de clientes`
            + ` · ${cob.internos} internos · corte al ${cob.hasta} (hora de México)`
          : 'Zoho Desk'}
      />

      {/* ═══ LO QUE ESTE MÓDULO NO VE ═══════════════════════════════
           Va ARRIBA DE TODO y en todas las pestañas, porque es la salvedad que
           cambia cómo se lee cada cifra de abajo. El export de Zoho solo trae
           tickets CERRADOS —2 de 5,871 sin fecha de cierre—, así que este
           módulo cuenta historia y no ve el presente. Sin este aviso, «0
           abiertos» se lee como «no hay nada pendiente», que es falso.
           Callar una limitación no la hace desaparecer: la vuelve una trampa. */}
      {mesa && (
        <div className="px-6 pt-4">
          <div className="rounded-xl border p-4 flex flex-wrap items-start gap-x-6 gap-y-3"
            style={{ background: mesa.hay ? '#FFF7ED' : '#F8FAFC',
                     borderColor: mesa.hay ? '#FED7AA' : '#E2E8F0' }}>
            <div className="flex items-start gap-2.5 flex-1 min-w-[280px]">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#C2410C' }} />
              <div className="text-xs leading-relaxed" style={{ color: '#7C2D12' }}>
                <strong>Todo lo que hay abajo son tickets CERRADOS.</strong> El export de
                Zoho no trae los abiertos, así que este módulo no puede verlos ni contarlos.
                {mesa.hay && mesa.abiertos !== null && (
                  <> Hoy la mesa tiene <strong>{mesa.abiertos} abiertos</strong>
                    {mesa.enEspera !== null && <> y <strong>{mesa.enEspera} en espera</strong></>},
                    y ninguno aparece en estas cifras.</>
                )}
              </div>
            </div>
            {mesa.hay && (
              <div className="flex items-center gap-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: '#9A3412' }}>Fuera de SLA</p>
                  <p className="text-2xl font-extrabold leading-none mt-1" style={{ color: '#C2410C' }}>{mesa.vencidos}</p>
                </div>
                <button onClick={() => setTab('sla')}
                  className="text-xs font-semibold px-3 py-2 rounded-lg"
                  style={{ background: '#C2410C', color: '#fff' }}>
                  Ver los {mesa.vencidos}
                </button>
                {/* La fecha del corte NUNCA se omite: un dato sin fecha se lee
                    como si fuera de hoy, y puede ser del viernes pasado. */}
                <p className="text-[10px]" style={{ color: '#9A3412' }}>
                  corte {mesa.fecha}{mesa.hora ? ` · ${mesa.hora}` : ''}
                </p>
              </div>
            )}
            {!mesa.hay && (
              <p className="text-xs" style={{ color: '#64748B' }}>
                Sin cortes de la mesa de ayuda. Correr <code>scripts/gen-mesa-ayuda.py</code>.
              </p>
            )}
          </div>
        </div>
      )}

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
                {/* KPIs. «Fallas» son DOS cifras distintas conviviendo en la
                    misma pantalla: la bandera ES_FALLA del export (273) y la
                    categoría que capturó la mesa (344). Los 273 son subconjunto
                    EXACTO de los 344 —verificado ticket por ticket—, así que la
                    diferencia son 71 folios que la mesa catalogó como falla y la
                    bandera no reconoce. Antes no había ningún texto que lo
                    dijera: quien leía la barra se llevaba 344 y quien leía el
                    KPI, 273. */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard icon={Tag}           label="Tickets del corte"  value={stats.total.toLocaleString()}  sub={overviewMes ? `Aperturas de ${MESES.find(m=>m.val===overviewMes)?.label}` : rangoMeses} color={BLUE}   />
                  <KpiCard icon={AlertTriangle} label="Fallas (bandera)"   value={stats.fallasBandera}
                    sub={`${stats.total > 0 ? ((stats.fallasBandera/stats.total)*100).toFixed(1) : 0}% · ${stats.fallasCategoria} por categoría de la mesa`} color={RED} />
                  <KpiCard icon={Zap}           label="Producto Voz"       value={stats.byProd['Voz'] ?? 0}      sub="tickets de voz"            color={BLUE}   />
                  <KpiCard icon={Users}         label="Producto Chat"      value={stats.byProd['Chat'] ?? 0}     sub="tickets de chat"           color={INDIGO} />
                </div>

                <p className="text-[11px] text-gray-500 -mt-1">
                  Las dos cifras de falla son reales y miden cosas distintas:{' '}
                  <strong className="text-gray-700">{stats.fallasBandera}</strong> traen la bandera
                  {' '}ES_FALLA del export y <strong className="text-gray-700">{stats.fallasCategoria}</strong>{' '}
                  están clasificados como Falla por la mesa. Los primeros son un subconjunto exacto
                  de los segundos: {stats.fallasCategoria - stats.fallasBandera} folios que la mesa
                  catalogó como falla y la bandera no reconoce.
                </p>

                {/* Por mes — de APERTURA. Antes era el mes de CIERRE (el campo
                    `fecha` del export) y se leía como mes de alta: 851 tickets
                    se graficaban en un mes distinto del que entraron, y
                    septiembre difería en 165. El mes en curso va marcado: se
                    dibujaba al lado de agosto completo, así que el tablero
                    parecía decir que septiembre cayó cuando le faltaban días. */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">Volumen por mes de APERTURA</h3>
                  <p className="text-[11px] text-gray-500 mb-4">
                    Cuándo ENTRÓ el ticket, anclado a hora de México. El export también trae el mes
                    de cierre, que es otro reparto: {cob ? `${Object.values(stats.byMesCierre).reduce((a, b) => a + b, 0)} cierres` : '—'} en el mismo periodo.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(stats.byMes).sort().map(([mes, n], idx, arr) => {
                      const colors = ['#3b82f6','#6366f1','#8b5cf6','#a855f7']
                      const esUltimo = idx === arr.length - 1 && mes === cob?.ultimoMes
                      return (
                        <div key={mes} className="rounded-lg p-3 border text-center"
                          style={{ background: `${colors[idx % 4]}08`, borderColor: `${colors[idx % 4]}25` }}>
                          <p className="text-xs text-gray-500">{mesLabel(mes)}</p>
                          <p className="text-2xl font-bold mt-1" style={{ color: colors[idx % 4] }}>{n}</p>
                          {esUltimo && (
                            <p className="text-[9px] text-amber-700 font-semibold mt-0.5">
                              incompleto · al día {cob?.hasta.slice(8, 10)}
                            </p>
                          )}
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
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">Por Prioridad</h3>
                    {/* Los 242 en blanco ya no se suman a Low (que decía 4,389
                        cuando los Low reales son 4,147) y los 182 'normal' ya no
                        quedan fuera de todo control. Las seis barras suman el
                        total del corte. */}
                    <p className="text-[11px] text-gray-500 mb-3">
                      Las seis cierran el total. «Sin prioridad» son tickets en blanco en el export,
                      y «Normal» es un valor propio de Zoho: no se traduce a Media porque no consta
                      que sean lo mismo.
                    </p>
                    <div className="space-y-2 mb-4">
                      {Object.entries(stats.byPrior)
                        .sort((a, b) => b[1] - a[1])
                        .map(([p, n]) => (
                          <BarRow key={p} label={prioLabel(p)} value={n}
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

                {/* Por Ejecutivo — nombres FUNDIDOS (eran 37 cadenas para 19
                    personas y una cola) e incluyendo «Sin propietario», que el
                    Overview descartaba en silencio: sus barras sumaban 5,845 de
                    5,871 y la pestaña de Gráficos daba otro total. */}
                {stats.byProp && Object.keys(stats.byProp).length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">
                      Tickets por Ejecutivo
                      {overviewMes && <span className="ml-2 text-xs font-normal text-gray-400">· {MESES.find(m=>m.val===overviewMes)?.label}</span>}
                    </h3>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Suma {Object.values(stats.byProp).reduce((a, b) => a + b, 0).toLocaleString()} de{' '}
                      {stats.total.toLocaleString()} — las barras cierran el corte, incluida
                      «Sin propietario».
                    </p>
                    <div>
                      {Object.entries(stats.byProp).sort((a,b)=>b[1]-a[1]).map(([prop, n]) => (
                        <BarRow key={prop} label={prop} value={n}
                          max={Math.max(...Object.values(stats.byProp))} color={INDIGO} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Top empresas — CIERRA.
                    Los 20 renglones sumaban 1,008 de 5,871 tickets (17.2%) y la
                    tabla no decía nada de los 4,863 restantes repartidos entre
                    1,537 empresas más. Es el mismo patrón que ya costó el
                    incidente de la tabla de destinos de llamadas: un top-N que
                    tira el resto miente sin mentir. Ahora lleva cubo «otros» y
                    la suma de lo que se ve es igual al universo.
                    Se agrupa por CID, no por la cadena de empresa: así «GRUPO
                    FRISA» y «Grupo Frisa» dejan de ser dos renglones. */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-sm text-gray-900">Top 20 clientes por volumen</h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      De {stats.empresasTotales.toLocaleString()} CIDs distintos en el corte.
                      Agrupado por CID; el tráfico interno va marcado.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/70">
                          <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                          <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente · CID</th>
                          <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tickets</th>
                          <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fallas</th>
                          <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Último ticket</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topEmpresas.map((e, i) => (
                          <tr key={e.cid} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-2.5 px-4 text-xs text-gray-400">{i + 1}</td>
                            <td className="py-2.5 px-4 font-medium text-gray-900">
                              {e.nombre}
                              <span className="text-xs text-gray-400 font-normal"> · CID {e.cid}</span>
                              {e.interno && (
                                <span className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                  style={{ background: '#E2E8F0', color: '#475569' }}>INTERNO</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-gray-700">{e.total}</td>
                            <td className="py-2.5 px-4 text-right">
                              {e.fallas > 0
                                ? <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: `${RED}15`, color: RED }}>{e.fallas}</span>
                                : <span className="text-xs text-gray-300">—</span>
                              }
                            </td>
                            {/* La fecha REAL del último ticket, con día. Antes era
                                `max(t.fecha)` —el mes de cierre— y la celda decía
                                literalmente «2026-09»: una cuenta que abrió su
                                último ticket el día 2 y otra el 23 se veían igual. */}
                            <td className="py-2.5 px-4 text-xs text-gray-500">{e.ultima || '—'}</td>
                          </tr>
                        ))}
                        {stats.otrasEmpresas && (
                          <tr className="bg-gray-50/70 border-t-2 border-gray-200">
                            <td className="py-2.5 px-4 text-xs text-gray-400">—</td>
                            <td className="py-2.5 px-4 text-gray-600 italic">
                              Otros {stats.otrasEmpresas.grupos.toLocaleString()} clientes
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-gray-700">{stats.otrasEmpresas.total.toLocaleString()}</td>
                            <td className="py-2.5 px-4 text-right text-xs text-gray-600">{stats.otrasEmpresas.fallas}</td>
                            <td className="py-2.5 px-4 text-xs text-gray-400">—</td>
                          </tr>
                        )}
                        <tr className="bg-blue-50/50 border-t-2 border-blue-200 font-semibold">
                          <td className="py-2.5 px-4 text-xs text-gray-400">=</td>
                          <td className="py-2.5 px-4 text-gray-900">Total del corte</td>
                          <td className="py-2.5 px-4 text-right text-gray-900">{stats.total.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right text-gray-900">{stats.fallasBandera}</td>
                          <td className="py-2.5 px-4" />
                        </tr>
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
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: 'Producto', value: filterProd, setter: setFilterProd,
                    opts: [{ v: '', l: 'Todos' }, { v: 'Voz', l: 'Voz' }, { v: 'Chat', l: 'Chat' }, { v: 'Sin producto', l: 'Sin producto' }] },
                  /* Las SEIS prioridades reales. Con cuatro, 424 tickets no se
                     podían aislar desde ningún control de la pantalla. */
                  { label: 'Prioridad', value: filterPrior, setter: setFilterPrior,
                    opts: PRIORIDADES.map(p => ({ v: p.val, l: p.label })) },
                  { label: 'Mes', value: filterMes, setter: setFilterMes,
                    opts: MESES.map(m => ({ v: m.val, l: m.label })) },
                  { label: 'Falla', value: filterFalla, setter: setFilterFalla,
                    opts: [{ v: '', l: 'Todas' }, { v: 'Si', l: 'Solo fallas (bandera)' }, { v: 'No', l: 'No fallas' }] },
                  /* El filtro de Categoría EXISTÍA en el código —`filterCat` se
                     enviaba al API y alimentaba el desplegable de subcategorías—
                     pero no tenía ningún control en la pantalla: `setFilterCat`
                     no se llamaba en las 1,266 líneas del archivo. Así que
                     siempre valía '' y las subcategorías traían las 79 del
                     archivo completo. Se corta por TIPO, que es el dato útil
                     (Asistencia 3,323 · Administrativo 1,652 · Falla 344), con
                     el canal aparte en vez de pegado en la misma cadena. */
                  { label: 'Tipo', value: filterCat, setter: setFilterCat,
                    opts: [
                      { v: '', l: 'Todos los tipos' },
                      { v: 'Asistencia', l: 'Asistencia' },
                      { v: 'Administrativo', l: 'Administrativo' },
                      { v: 'Falla', l: 'Falla (categoría de la mesa)' },
                      { v: 'Activación', l: 'Activación' },
                      { v: 'Capacitación', l: 'Capacitación' },
                      { v: 'Sin categoría', l: 'Sin clasificar' },
                    ] },
                  /* El tráfico interno (CID 0 y 1) es el segundo emisor de todo
                     el archivo. Ahora se puede sacar de la vista. */
                  { label: 'Interno', value: filterInterno, setter: setFilterInterno,
                    opts: [
                      { v: '', l: 'Clientes + internos' },
                      { v: 'excluir', l: 'Solo clientes' },
                      { v: 'solo', l: 'Solo internos (CID 0 y 1)' },
                    ] },
                ].map(f => (
                  <div key={f.label} className="w-40 flex-shrink-0">
                    <CustomSelect value={f.value}
                      onChange={v => { f.setter(v); setTimeout(() => fetchList(1), 0) }}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                      options={f.opts.map(o => ({ value: o.v, label: o.l }))} />
                  </div>
                ))}
                {/* Filtro cliente (empresa + CID) — dinámico, exacto */}
                <div className="w-64 flex-shrink-0">
                  <CustomSelect value={filterCliente}
                    onChange={v => { setFilterCliente(v); setTimeout(() => fetchList(1), 0) }}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                    /* UNA opción por CID, porque el filtro compara SOLO el CID.
                       Antes la clave era `cid|empresa`, así que el renglón
                       prometía un número que el filtro no entregaba: elegir
                       «Digitum · CID 1 (63)» devolvía 175 filas, porque bajo ese
                       CID también viven Callpicker y Callpicker pruebas. Ahora el
                       conteo del renglón ES el que devuelve el filtro, y los
                       nombres alternos se avisan en lugar de partir la fila. */
                    options={[{ value: '', label: 'Cliente (todos)' }, ...clientes.map(c => ({
                      value: c.cid,
                      label: `${c.empresa} · CID ${c.cid} (${c.total})`
                        + (c.alias.length ? ` +${c.alias.length} alias` : ''),
                    }))]} />
                </div>
                {/* Filtro ejecutivo — dinámico */}
                <div className="w-48 flex-shrink-0">
                  <CustomSelect value={filterEjecutivo}
                    onChange={v => { setFilterEjecutivo(v); setTimeout(() => fetchList(1), 0) }}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                    options={[{ value: '', label: 'Ejecutivo (todos)' }, ...propietarios.map(p => ({ value: p, label: p }))]} />
                </div>
                {/* Filtro subcategoría — dinámico */}
                <div className="w-52 flex-shrink-0">
                  <CustomSelect value={filterSubcat}
                    onChange={v => { setFilterSubcat(v); setTimeout(() => fetchList(1), 0) }}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                    options={[{ value: '', label: 'Subcategoría (todas)' }, ...subcategorias.map(s => ({ value: s, label: s }))]} />
                </div>
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
                    const iso = fechaLocal
                    setFilterDesde(iso(lunes)); setFilterHasta(iso(domingo))
                    setTimeout(() => fetchList(1), 0)
                  }}
                  className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                  Esta semana
                </button>
                {(filterDesde || filterHasta) && (
                  /* «Esta semana» se ve siempre floja y no es una caída: el
                     archivo solo tiene tickets CERRADOS, así que los de esta
                     semana que aún no cierran no están. Sin este aviso, 66
                     contra 179 de la semana anterior se lee como −63%. */
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                    Ojo: los tickets recientes que aún no cierran NO están en el archivo
                  </span>
                )}
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
                        {/* El folio `num` NO identifica al ticket: hay 3 valores
                            repartidos en 7 filas (el 1877 tres veces), porque
                            conviven dos series de numeración. `ticket_id` sí es
                            único en las 5,871. Se avisa al pasar el cursor. */}
                        <td className="py-2.5 px-3 text-xs text-gray-400 font-mono"
                          title={`ID único: ${t.ticket_id}`}>{t.num}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-900 max-w-[180px] truncate"
                          title={t.empresa !== t.empresaCanon ? `Capturado como «${t.empresa}» · CID ${t.cid}` : `CID ${t.cid}`}>
                          {t.empresaCanon || t.empresa}
                          {t.interno && <span className="ml-1 text-[9px] text-gray-400">(interno)</span>}
                        </td>
                        <td className="py-2.5 px-3"><PillBadge label={t.categoriaNorm} color={BLUE} /></td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 max-w-[140px] truncate">{t.subcategoriaNorm}</td>
                        <td className="py-2.5 px-3"><PillBadge label={t.producto || '—'} color={prodColor(t.producto)} /></td>
                        {/* Los 242 tickets sin prioridad se pintaban «Low». Ya no. */}
                        <td className="py-2.5 px-3"><PillBadge label={prioLabel(t.prioridadNorm)} color={prioColor(t.prioridadNorm)} /></td>
                        <td className="py-2.5 px-3 text-center"
                          title={t.esFallaCategoria && !t.esFallaBandera
                            ? 'Clasificado como Falla por la mesa, sin la bandera ES_FALLA del export'
                            : ''}>
                          {t.esFallaBandera
                            ? <AlertTriangle size={13} style={{ color: RED }} />
                            : t.esFallaCategoria
                              ? <AlertTriangle size={13} style={{ color: AMBER }} />
                              : <CheckCircle2 size={13} style={{ color: GREEN }} />}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-600 whitespace-nowrap">{t.propietarioNorm || '—'}</td>
                        {/* La apertura ya viene anclada a hora de México desde el
                            servidor. Antes se pintaba con `toLocaleDateString` del
                            navegador mientras el filtro comparaba la fecha UTC:
                            626 tickets se veían con un día y se filtraban con otro. */}
                        <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap"
                          title={t.cierre ? `Cierre: ${fmtAperturaCorta(t.cierre)} · duración ${t.duracion || '—'}` : 'Sin cerrar'}>
                          {t.aperturaMx || '—'}
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
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Conciliando con la cartera…</div>
            ) : conc ? (
              <>
                {/* KPIs.
                    «Total empresas únicas» contaba pares `cid|empresa`: daba
                    1,563 para 1,531 CIDs, y los 32 pares de más eran justo los
                    errores de captura («GRUPO FRISA»/«Grupo Frisa»,
                    «RE/MAX Satelite»/«REMAX Satelite»), así que el KPI premiaba
                    el dato sucio. Ahora se cuentan CIDs.
                    Y la consulta traía todo lo que no estuviera cancelado, así
                    que las cuentas en hibernación se presentaban como activas y
                    con su Health Score en verde: lib/types.ts las define SIN
                    SERVICIO y manda pintarlas inactivas. */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard icon={CheckCircle2} label="CIDs con cuenta"   value={conc.matched.length}
                    sub={`${conc.ticketsCruzados.toLocaleString()} tickets`} color={GREEN}  />
                  <KpiCard icon={XCircle}      label="CIDs sin cuenta"   value={conc.unmatched.length}
                    sub={`${conc.ticketsSinCruzar.toLocaleString()} tickets sin cruzar`} color={RED} />
                  <KpiCard icon={Users}        label="CIDs distintos"    value={conc.cidsDistintos}
                    sub={`en el archivo · ${conc.internos} internos`} color={INDIGO} />
                  <KpiCard icon={Tag}          label="Cuentas en cartera" value={conc.cuentasCartera}
                    sub={`${conc.cuentasSinServicio} sin servicio · ${conc.cuentasCanceladas} canceladas (fuera)`} color={AMBER} />
                </div>

                <p className="text-[11px] text-gray-500">
                  Se cuentan <strong className="text-gray-700">CIDs</strong>, no pares CID+nombre: un
                  mismo cliente capturado con dos escrituras ya no suma dos. Las cuentas en
                  hibernación aparecen marcadas «sin servicio» y su Health Score se muestra en gris —
                  no se puede estar saludable y sin servicio a la vez.
                </p>

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
                            <tr key={r.cid || i} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                              <td className="py-2.5 px-4 font-medium text-gray-900">
                                {r.empresa}
                                <span className="text-xs text-gray-400 font-normal"> · CID {r.cid || '—'}</span>
                                {r.interno && (
                                  <span className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                    style={{ background: '#E2E8F0', color: '#475569' }}>INTERNO</span>
                                )}
                                {/* Los nombres alternos se avisan en vez de partir la fila en dos. */}
                                {r.alias.length > 0 && (
                                  <span className="block text-[10px] text-gray-400 italic mt-0.5"
                                    title={r.alias.join(' · ')}>
                                    también capturado como: {r.alias.slice(0, 2).join(' · ')}
                                    {r.alias.length > 2 ? ` y ${r.alias.length - 2} más` : ''}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right font-semibold text-gray-700">{r.total}</td>
                              <td className="py-2.5 px-4 text-right">
                                {r.fallas > 0
                                  ? <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: `${RED}15`, color: RED }}>{r.fallas}</span>
                                  : <span className="text-xs text-gray-300">—</span>}
                              </td>
                              <td className="py-2.5 px-4 text-xs text-gray-500">{r.ultima || '—'}</td>
                              {concTab === 'matched' && r.cuenta && <>
                                <td className="py-2.5 px-4 text-xs font-medium"
                                  style={{ color: r.cuenta.sinServicio ? '#64748B' : GREEN }}>
                                  {r.cuenta.empresa}
                                  {r.cuenta.sinServicio && (
                                    /* #475569 sobre #E2E8F0 mide 6.15:1. El slate-500
                                       que puse primero daba 3.86:1 y no pasa AA. */
                                    <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                      style={{ background: '#E2E8F0', color: '#475569' }}>
                                      SIN SERVICIO · {r.cuenta.estado}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-xs text-gray-600">{r.cuenta.asesor}</td>
                                <td className="py-2.5 px-4 text-right">
                                  {/* El estatus manda sobre el Health Score: una cuenta
                                      sin servicio no se pinta en verde por tener 84. */}
                                  {/* El gris no puede ser tan claro que no se lea:
                                      #94A3B8 sobre blanco mide 2.56:1. #475569 da
                                      8.49:1 y sigue leyéndose como «apagado»
                                      frente al verde/ámbar/rojo de al lado.
                                      Y el estado no se comunica SOLO con el color:
                                      la etiqueta «SIN SERVICIO» va en la celda
                                      anterior, con palabras. */}
                                  <span className="text-xs font-bold"
                                    title={r.cuenta.sinServicio ? 'Cuenta sin servicio: el Health Score es histórico' : ''}
                                    style={{ color: r.cuenta.sinServicio
                                      ? '#475569'
                                      : tonoSobreFondo(
                                          r.cuenta.health_score >= 70 ? GREEN : r.cuenta.health_score >= 40 ? AMBER : RED,
                                          '#FFFFFF', 4.5) }}>
                                    {r.cuenta.health_score}
                                  </span>
                                </td>
                              </>}
                              {concTab === 'unmatched' && (
                                <td className="py-2.5 px-4">
                                  <span className="text-xs text-gray-400 italic">
                                    {r.interno ? 'Tráfico interno, no es un cliente' : 'Su CID no está en la cartera'}
                                  </span>
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
        {/* ═══ FUERA DE SLA ════════════════════════════════════════
             Lo único de este módulo que habla del PRESENTE. Sale de los cortes
             diarios de la mesa de ayuda, no del export. */}
        {tab === 'sla' && (
          mesa?.hay ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard icon={AlertTriangle} label="Fuera de SLA" value={String(mesa.vencidos)}
                  sub={`corte ${mesa.fecha}`} color={RED} />
                <KpiCard icon={Tag} label="Abiertos en la mesa" value={mesa.abiertos ?? '—'}
                  sub="no están en este módulo" color={BLUE} />
                <KpiCard icon={Users} label="En espera" value={mesa.enEspera ?? '—'}
                  sub="tampoco están" color={INDIGO} />
                <KpiCard icon={Zap} label="Sin asignar" value={mesa.noAsignados ?? '—'}
                  sub="nadie los persigue" color={mesa.noAsignados ? RED : BLUE} />
              </div>

              {/* LA RACHA es lo que ninguna otra fuente da. Una cuenta que
                  aparece en 13 de 13 cortes no tuvo un mal día: no ha tenido
                  uno bueno. Eso convierte un ticket en un problema de relación. */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-sm text-gray-900">Cuentas con tickets vencidos</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  «Cortes» es en cuántos de los {mesa.cortes} cortes guardados esta cuenta ha
                  tenido algún ticket fuera de SLA. Una cuenta en {mesa.cortes} de {mesa.cortes} no
                  tuvo un mal día — no ha tenido uno bueno.
                </p>
                <div className="space-y-2">
                  {mesa.porCuenta.map(c => (
                    <div key={c.cid} className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-gray-400 w-16 flex-shrink-0">{c.cid}</span>
                      <span className="font-semibold text-gray-900 flex-1 truncate">{c.cuenta}</span>
                      <span className="text-gray-500 w-20 text-right">{c.folios} folio{c.folios === 1 ? '' : 's'}</span>
                      <span className="w-24 text-right font-semibold"
                        style={{ color: c.peorDias >= 30 ? RED : c.peorDias >= 7 ? '#C2410C' : '#64748B' }}>
                        {c.peorDias} d fuera
                      </span>
                      <span className="w-24 text-right"
                        style={{ color: c.rachas === mesa.cortes ? RED : '#64748B',
                                 fontWeight: c.rachas === mesa.cortes ? 700 : 400 }}>
                        {c.rachas}/{mesa.cortes} cortes
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 pt-5 pb-3">
                  <h3 className="font-semibold text-sm text-gray-900">Los {mesa.vencidos} folios</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    «Sin mover» son los días desde la última actividad registrada, que no es lo
                    mismo que los días fuera de SLA: un ticket puede vencer ayer y llevar
                    cuarenta días en silencio.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Folio', 'Cuenta', 'Asunto', 'Estado', 'Responsable', 'Canal', 'Fuera', 'Sin mover'].map((h, i) => (
                          <th key={h} className={`py-2 px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide ${i >= 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mesa.vencidosDetalle.map(v => (
                        <tr key={v.folio} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono text-gray-500">#{v.folio}</td>
                          <td className="py-2 px-3 font-semibold text-gray-900">{v.cuenta}</td>
                          <td className="py-2 px-3 text-gray-600 max-w-[280px] truncate" title={v.asunto}>{v.asunto}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={v.estado === 'Escalado'
                                ? { background: '#FEE2E2', color: '#B91C1C' }
                                : { background: '#F1F5F9', color: '#475569' }}>
                              {v.estado}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{v.responsable}</td>
                          <td className="py-2 px-3 text-gray-500">{v.canal}</td>
                          <td className="py-2 px-3 text-right font-semibold"
                            style={{ color: (v.diasSLA ?? 0) >= 30 ? RED : '#C2410C' }}>{v.diasSLA} d</td>
                          <td className="py-2 px-3 text-right text-gray-500">{v.diasSinMover} d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 px-1">
                Fuente: Reporte Diario de Mesa de Ayuda, corte {mesa.fecha}
                {mesa.hora ? ` a las ${mesa.hora}` : ''} · {mesa.cortes} cortes guardados.
                Esto cubre los tickets <strong>vencidos</strong>, no los {mesa.abiertos ?? '—'} abiertos
                que aún no vencen — para ésos hace falta que el export de Zoho deje de filtrar
                por cerrado.
              </p>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-sm font-semibold text-gray-900 mb-2">Sin cortes de la mesa de ayuda</p>
              <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
                Esta vista lee <code>data/mesa-ayuda/</code>, que se llena con
                <code> python scripts/gen-mesa-ayuda.py --todos</code> a partir de los
                Reportes Diarios que genera la tarea programada.
              </p>
            </div>
          )
        )}

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
                        <td className="py-2.5 px-3 text-xs text-gray-400 font-mono" title={`ID único: ${t.ticket_id}`}>{t.num}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-900 max-w-[160px] truncate" title={`CID ${t.cid}`}>{t.empresaCanon || t.empresa}</td>
                        <td className="py-2.5 px-3"><PillBadge label={t.categoriaNorm} color={RED} /></td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 max-w-[140px] truncate">{t.subcategoriaNorm}</td>
                        <td className="py-2.5 px-3"><PillBadge label={t.producto || '—'} color={prodColor(t.producto)} /></td>
                        <td className="py-2.5 px-3"><PillBadge label={prioLabel(t.prioridadNorm)} color={prioColor(t.prioridadNorm)} /></td>
                        <td className="py-2.5 px-3 text-xs text-gray-600">{t.propietarioNorm || '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap" title={t.cierre ? `Cierre: ${fmtAperturaCorta(t.cierre)}` : 'Sin cerrar'}>{t.aperturaMx || '—'}</td>
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
                <div className="w-44 flex-shrink-0">
                  <CustomSelect value={chartMes} onChange={setChartMes}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                    options={MESES.map(m => ({ value: m.val, label: m.label }))} />
                </div>
                <div className="w-48 flex-shrink-0">
                  <CustomSelect value={chartProp} onChange={setChartProp}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                    options={[{ value: '', label: 'Ejecutivo (todos)' }, ...propietarios.map(p => ({ value: p, label: p }))]} />
                </div>
                <div className="w-44 flex-shrink-0">
                  <CustomSelect value={chartProd} onChange={setChartProd}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                    options={[
                      { value: '', label: 'Producto (todos)' },
                      { value: 'Voz', label: 'Voz' },
                      { value: 'Chat', label: 'Chat' },
                      { value: 'Sin producto', label: 'Sin producto' },
                    ]} />
                </div>
                <div className="w-44 flex-shrink-0">
                  {/* Las seis reales, igual que en el Explorador: con cuatro,
                      424 tickets no se podían aislar desde ningún control. */}
                  <CustomSelect value={chartPrior} onChange={setChartPrior}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                    options={PRIORIDADES.map(p => ({
                      value: p.val,
                      label: p.val === '' ? 'Prioridad (todas)' : p.label,
                    }))} />
                </div>
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
                {/* KPIs.
                    La media de duración es 144.9 h y la mediana 29.2: cinco
                    veces. La arrastran 222 tickets de más de 30 días y un folio
                    cerrado 265 días después (p99 = 1,703 h). Publicar solo la
                    media decía que el ticket típico tarda seis días, y no.
                    Manda la MEDIANA; la media queda al lado, rotulada. */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard icon={Tag}           label="Tickets del corte" value={chartData.total.toLocaleString('es-MX')} color={BLUE}   />
                  <KpiCard icon={AlertTriangle} label="Fallas (bandera)"  value={chartData.fallas}
                    sub={`${chartData.total > 0 ? ((chartData.fallas / chartData.total) * 100).toFixed(1) : 0}% · ${chartData.fallasCategoria} por categoría`} color={RED} />
                  <KpiCard icon={Clock}         label="Duración mediana"  value={`${chartData.duracion.mediana}h`}
                    sub={`media ${chartData.duracion.media}h · p90 ${chartData.duracion.p90}h · máx ${chartData.duracion.max}h`} color={AMBER} />
                  <KpiCard icon={User}          label="Top ejecutivo"     value={chartData.topPropietario} color={INDIGO} />
                </div>

                <p className="text-[11px] text-gray-500 -mt-1">
                  La duración es tiempo de <strong className="text-gray-700">reloj</strong>: incluye
                  noches y fines de semana, y mide cuánto tardó el folio en cerrarse, no cuánto se
                  trabajó en él. Sobre {chartData.duracion.n.toLocaleString()} tickets con dato
                  {chartData.duracion.sinDato > 0 && <> ({chartData.duracion.sinDato} sin medir, excluidos)</>}.
                  La media va {chartData.duracion.mediana > 0 ? (chartData.duracion.media / chartData.duracion.mediana).toFixed(1) : '—'}× por
                  encima de la mediana porque la arrastran los extremos.
                </p>

                {/* Tickets por Ejecutivo — horizontal.
                    Nombres fundidos, y la barra de tiempo usa la MEDIANA: con la
                    media, un solo folio olvidado convierte al agente más rápido
                    en el más lento de la mesa. */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">Tickets por Ejecutivo</h3>
                  <p className="text-[11px] text-gray-500 mb-4">
                    Suma {chartData.byPropietario.reduce((s, p) => s + p.tickets, 0).toLocaleString()} de{' '}
                    {chartData.total.toLocaleString()} — cierra el corte, incluida «Sin propietario».
                    Las 37 formas de escribir 19 nombres quedan fundidas.
                  </p>
                  <ResponsiveContainer width="100%" height={Math.min(520, Math.max(200, chartData.byPropietario.length * 30))}>
                    <BarChart data={chartData.byPropietario} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }}
                        formatter={(v: number, n: string) => [
                          n === 'medianaDuracion' ? `${v} h` : v,
                          n === 'tickets' ? 'Tickets' : n === 'fallas' ? 'Fallas' : 'Mediana de cierre',
                        ]} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="tickets" name="Tickets" fill={BLUE} radius={[0, 3, 3, 0]} />
                      <Bar dataKey="fallas"  name="Fallas"  fill={RED}  radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Volumen por Mes — de APERTURA */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">Volumen por mes de APERTURA</h3>
                  <p className="text-[11px] text-gray-500 mb-4">
                    Cuándo entró el ticket, en hora de México. El último mes está incompleto.
                  </p>
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
                    <KpiCard icon={AlertTriangle} label="Fallas (bandera)"  value={modalData.fallas} sub={`${modalData.total > 0 ? ((modalData.fallas / modalData.total) * 100).toFixed(1) : 0}% · ${modalData.fallasCategoria} por categoría`} color={RED} />
                    {/* La mediana, no la media: 29.2 h contra 144.9 h. */}
                    <KpiCard icon={Clock}         label="Duración mediana" value={`${modalData.duracion.mediana}h`}
                      sub={`media ${modalData.duracion.media}h · máx ${modalData.duracion.max}h`} color={AMBER} />
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
