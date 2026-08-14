'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, Users, TrendingUp, AlertCircle, RefreshCw,
  Search, ChevronLeft, ChevronRight, Wifi, WifiOff,
} from 'lucide-react'

/* ── Tipos ─────────────────────────────────────────────────────────────────── */
interface FactRow {
  CID: string
  'Nombre del Cliente': string
  'Tamaño Empresa': string
  'Clasificación LTV': string
  'Clasificación Cliente': string
  'Segmento Factura': string
  'MRR Limpio': number | null
  'Importe Acumulado Recurrente': number | null
  'Importe Acumulado Bruto': number | null
  'Meses Activo': number | null
  'Meses con Factura': number | null
  'Primera Factura': string
  'Última Factura': string
  'Semáforo Actividad': string
  'Es One Timer': string
  'MRR por Mes Facturado': number | null
  'Total Facturas': number | null
  'Cohorte Periodo': string
  'Días sin Factura': number | null
  'Ticket Promedio': number | null
  'Rango LTV': string
  'RFC': string
  'Correo': string
}

interface PeriodoItem { fecha: string; count: number; mrr: number }

interface Stats {
  total: number; totalMrr: number; avgMrr: number
  activos: number; dormidos: number; onTimers: number
  bySegmento: Record<string, { count: number; mrr: number }>
  byLTV: Record<string, { count: number; mrr: number }>
  byRango: Record<string, { count: number; mrr: number }>
  bySemaforo: Record<string, number>
  topClientes: { nombre: string; mrr: number; clas: string; semaforo: string; rango: string }[]
  source: string
}

interface ListResult { total: number; page: number; size: number; rows: FactRow[]; source: string }

interface FilterOpts {
  meses: string[]; ltvs: string[]; segmentos: string[]; tamanos: string[]; semaforos: string[]
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const fmt$ = (n: number | null | undefined) =>
  n == null ? '—' : '$' + Math.round(n).toLocaleString('es-MX')

const SEMAFORO_COLOR: Record<string, string> = {
  '1 - Activo':    '#22c55e',
  '2 - En riesgo': '#f59e0b',
  '3 - Irregular': '#f97316',
  '4 - Dormido':   '#94a3b8',
}

// Color por prefijo numérico — funciona con cualquier etiqueta que Zoho devuelva (VIP, Alto, etc.)
function getLtvColor(val: string): string {
  const n = parseInt(val)
  if (n === 1) return '#1B3FCC'
  if (n === 2) return '#6366f1'
  if (n === 3) return '#f59e0b'
  if (n === 4) return '#f97316'
  if (n === 5) return '#ef4444'
  return '#94a3b8'
}

function getBadgeStyle(val: string, map: Record<string, string>, colorFn?: (v: string) => string) {
  const color = colorFn ? colorFn(val) : (map[val] ?? '#94a3b8')
  return { background: color + '18', color, fontWeight: 700 as const, fontSize: 10, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' as const }
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="cp-card" style={{ borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</p>}
      </div>
    </div>
  )
}

function BarGroup({ title, data, colorMap, colorFn, mrr }: {
  title: string
  data: Record<string, { count: number; mrr: number } | number>
  colorMap?: Record<string, string>
  colorFn?: (key: string) => string
  mrr?: boolean
}) {
  const entries = Object.entries(data).sort((a, b) => {
    const av = typeof a[1] === 'number' ? a[1] : a[1].mrr
    const bv = typeof b[1] === 'number' ? b[1] : b[1].mrr
    return bv - av
  })
  const max = entries.reduce((m, [, v]) => {
    const val = typeof v === 'number' ? v : (mrr ? v.mrr : v.count)
    return Math.max(m, val)
  }, 1)

  return (
    <div className="cp-card" style={{ borderRadius: 14, padding: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {entries.map(([key, v]) => {
          const val = typeof v === 'number' ? v : (mrr ? v.mrr : v.count)
          const count = typeof v === 'number' ? v : v.count
          const pct = Math.round((val / max) * 100)
          const color = colorFn ? colorFn(key) : (colorMap?.[key] ?? '#1B3FCC')
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{key || 'Sin datos'}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                  {mrr && typeof v !== 'number' ? fmt$(v.mrr) + ' · ' : ''}{count} ctas
                </span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 99 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Componente principal ──────────────────────────────────────────────────── */
export default function FacturacionPage() {
  const [periodos, setPeriodos] = useState<PeriodoItem[]>([])
  const [totalGeneral, setTotalGeneral] = useState(0)
  const [filtroActivo, setFiltroActivo] = useState('__all__')
  const [stats, setStats] = useState<Stats | null>(null)
  const [list, setList] = useState<ListResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<'resumen' | 'clientes' | 'top'>('resumen')

  /* ── Filtros de tabla ────────────────────────────────────────────── */
  const [filterOpts, setFilterOpts] = useState<FilterOpts>({ meses: [], ltvs: [], segmentos: [], tamanos: [], semaforos: [] })
  const [filtroMes,     setFiltroMes]     = useState('')
  const [filtroLtv,     setFiltroLtv]     = useState('')
  const [filtroSeg,     setFiltroSeg]     = useState('')
  const [filtroTamano,  setFiltroTamano]  = useState('')
  const [filtroSemaforo, setFiltroSemaforo] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/facturacion?mode=periodos').then(r => r.json()),
      fetch('/api/facturacion?mode=filters').then(r => r.json()),
    ]).then(([periodos, filters]) => {
      if (periodos.error) { setError(periodos.error); return }
      setPeriodos(periodos.periodos ?? [])
      setTotalGeneral(periodos.total ?? 0)
      setSource(periodos.source ?? '')
      if (!filters.error) setFilterOpts({
        meses:     filters.meses     ?? [],
        ltvs:      filters.ltvs      ?? [],
        segmentos: filters.segmentos ?? [],
        tamanos:   filters.tamanos   ?? [],
        semaforos: filters.semaforos ?? [],
      })
    })
      .catch(() => setError('No se pudo conectar con la API'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const url = filtroActivo === '__all__'
      ? '/api/facturacion?mode=stats'
      : `/api/facturacion?mode=stats&fecha=${encodeURIComponent(filtroActivo)}`
    fetch(url).then(r => r.json()).then(d => { if (!d.error) setStats(d) })
  }, [filtroActivo])

  const fetchList = useCallback(() => {
    setLoadingList(true)
    const params = new URLSearchParams({ mode: 'list', page: String(page), size: '25' })
    if (filtroActivo !== '__all__') params.set('fecha', filtroActivo)
    if (q)             params.set('q',      q)
    if (filtroMes)     params.set('mes',    filtroMes)
    if (filtroLtv)     params.set('ltv',    filtroLtv)
    if (filtroSeg)     params.set('seg',    filtroSeg)
    if (filtroTamano)  params.set('tamano', filtroTamano)
    if (filtroSemaforo) params.set('sema',  filtroSemaforo)
    fetch(`/api/facturacion?${params}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setList(d) })
      .finally(() => setLoadingList(false))
  }, [filtroActivo, page, q, filtroMes, filtroLtv, filtroSeg, filtroTamano, filtroSemaforo])

  useEffect(() => { if (tab === 'clientes') fetchList() }, [tab, fetchList])

  const totalPages = list ? Math.ceil(list.total / 25) : 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <RefreshCw size={28} style={{ color: '#1B3FCC', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Cargando datos de Zoho Analytics…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error || (!loading && periodos.length === 0)) return (
    <div style={{ padding: 32 }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: 28, maxWidth: 540 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <WifiOff size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Sin conexión a Zoho Analytics</p>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
              {error || 'No se encontraron datos LTV. Verifica que las credenciales de Zoho estén configuradas y el usuario tenga acceso al workspace.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', background: 'rgba(255,255,255,0.04)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Facturación · LTV</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            {totalGeneral.toLocaleString()} clientes · {' '}
            {source === 'zoho'
              ? <><Wifi size={11} style={{ color: '#22c55e' }} /><span style={{ color: '#22c55e', fontWeight: 600 }}>Zoho en vivo</span></>
              : source === 'supabase'
              ? <><WifiOff size={11} style={{ color: '#d97706' }} /><span style={{ color: '#d97706', fontWeight: 600 }}>Datos locales (Supabase)</span></>
              : <><WifiOff size={11} style={{ color: '#ef4444' }} /><span style={{ color: '#ef4444', fontWeight: 600 }}>Sin datos</span></>
            }
          </p>
        </div>
        <button onClick={() => window.location.reload()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* Banner modo local */}
      {source === 'supabase' && (
        <div style={{
          marginBottom: 20, padding: '12px 18px',
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <WifiOff size={15} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#92400e' }}>
              Zoho Analytics no disponible — mostrando datos de Supabase
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>
              MRR desde registros manuales · Sin segmentación LTV avanzada · La clasificación LTV se calcula por rango de MRR.
              Para restaurar la conexión, renueva el <strong>ZOHO_REFRESH_TOKEN</strong> en Vercel.
            </p>
          </div>
        </div>
      )}

      {/* Selector de actividad */}
      <div className="cp-card" style={{ borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Filtrar por Semáforo de Actividad
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setFiltroActivo('__all__')} style={{
            padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
            border: filtroActivo === '__all__' ? '2px solid #1B3FCC' : '1.5px solid #e2e8f0',
            background: filtroActivo === '__all__' ? '#1B3FCC' : '#fff',
            color: filtroActivo === '__all__' ? '#fff' : '#374151',
          }}>
            Todos · {totalGeneral.toLocaleString()}
          </button>
          {periodos.map(p => {
            const active = filtroActivo === p.fecha
            const color = SEMAFORO_COLOR[p.fecha] ?? '#94a3b8'
            return (
              <button key={p.fecha} onClick={() => { setFiltroActivo(p.fecha); setPage(1) }} style={{
                padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                border: active ? `2px solid ${color}` : '1.5px solid #e2e8f0',
                background: active ? color : '#fff',
                color: active ? '#fff' : '#374151',
              }}>
                {p.fecha} · {p.count}
              </button>
            )
          })}
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <KpiCard icon={DollarSign} label="MRR Total (limpio)" value={fmt$(stats.totalMrr)} sub={`Promedio ${fmt$(stats.avgMrr)} / cliente`} color="#1B3FCC" />
          <KpiCard icon={Users} label="Clientes activos" value={String(stats.activos)} color="#22c55e" />
          <KpiCard icon={TrendingUp} label="Clientes filtrados" value={String(stats.total)} sub={filtroActivo === '__all__' ? 'Base activa' : filtroActivo} color="#6366f1" />
          <KpiCard icon={AlertCircle} label="One Timers" value={String(stats.onTimers)} sub={`${stats.total ? ((stats.onTimers / stats.total) * 100).toFixed(1) : 0}% del total`} color="#f59e0b" />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['resumen', 'clientes', 'top'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === t ? '#1B3FCC' : '#fff',
            color: tab === t ? '#fff' : '#374151',
            boxShadow: tab === t ? '0 2px 8px rgba(27,63,204,0.25)' : '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            {t === 'resumen' ? 'Resumen' : t === 'clientes' ? 'Clientes' : 'Top MRR'}
          </button>
        ))}
      </div>

      {/* ── Tab: Resumen ─────────────────────────────────────── */}
      {tab === 'resumen' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <BarGroup title="MRR por Segmento" data={stats.bySegmento} mrr />
          <BarGroup title="Clientes por Clasificación LTV" data={stats.byLTV} colorFn={getLtvColor} mrr />
          <BarGroup title="Distribución por Rango LTV" data={stats.byRango} mrr />
          <BarGroup title="Semáforo de Actividad" data={stats.bySemaforo} colorMap={SEMAFORO_COLOR} />
        </div>
      )}

      {/* ── Tab: Top MRR ─────────────────────────────────────── */}
      {tab === 'top' && stats && (
        <div className="cp-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Top 10 clientes por MRR</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['#', 'Cliente', 'MRR', 'Rango LTV', 'Clasificación', 'Semáforo'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.topClientes.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 700 }}>#{i + 1}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#fff' }}>{c.nombre}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1B3FCC' }}>{fmt$(c.mrr)}</td>
                  <td style={{ padding: '10px 14px' }}><span style={getBadgeStyle(c.rango, {})}>{c.rango || '—'}</span></td>
                  <td style={{ padding: '10px 14px' }}><span style={getBadgeStyle(c.clas, {}, getLtvColor)}>{c.clas || '—'}</span></td>
                  <td style={{ padding: '10px 14px' }}><span style={getBadgeStyle(c.semaforo, SEMAFORO_COLOR)}>{c.semaforo || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Clientes ─────────────────────────────────────── */}
      {tab === 'clientes' && (
        <div className="cp-card" style={{ borderRadius: 14, overflow: 'hidden' }}>

          {/* ── Barra de filtros ──────────────────────────────────── */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)' }}>
            {([
              { label: 'MES',           placeholder: 'Todos los meses',          opts: filterOpts.meses,     val: filtroMes,      set: setFiltroMes },
              { label: 'CLASIFICACIÓN', placeholder: 'Todas las clasificaciones', opts: filterOpts.ltvs,      val: filtroLtv,      set: setFiltroLtv },
              { label: 'SEGMENTO',      placeholder: 'Todos los segmentos',       opts: filterOpts.segmentos, val: filtroSeg,      set: setFiltroSeg },
              { label: 'TAMAÑO',        placeholder: 'Todos los tamaños',         opts: filterOpts.tamanos,   val: filtroTamano,   set: setFiltroTamano },
              { label: 'SEMÁFORO',      placeholder: 'Todos los estados',         opts: filterOpts.semaforos, val: filtroSemaforo, set: setFiltroSemaforo },
            ] as { label: string; placeholder: string; opts: string[]; val: string; set: (v: string) => void }[]).map(f => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{f.label}</span>
                <div style={{ position: 'relative' }}>
                  <select
                    value={f.val}
                    onChange={e => { f.set(e.target.value); setPage(1) }}
                    style={{
                      appearance: 'none', WebkitAppearance: 'none',
                      padding: '7px 32px 7px 12px', borderRadius: 8,
                      border: f.val ? '1.5px solid #1B3FCC' : '1.5px solid #e2e8f0',
                      fontSize: 13, background: '#fff',
                      color: f.val ? '#1B3FCC' : '#374151',
                      fontWeight: f.val ? 600 : 400,
                      cursor: 'pointer', outline: 'none',
                      minWidth: 170, maxWidth: 220,
                    }}
                  >
                    <option value="">{f.placeholder}</option>
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <svg viewBox="0 0 10 6" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, pointerEvents: 'none', fill: f.val ? '#1B3FCC' : '#94a3b8' }}>
                    <path d="M0 0l5 6 5-6z" />
                  </svg>
                </div>
              </div>
            ))}

            {/* Limpiar filtros */}
            {(filtroMes || filtroLtv || filtroSeg || filtroTamano || filtroSemaforo) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'transparent' }}>x</span>
                <button
                  onClick={() => { setFiltroMes(''); setFiltroLtv(''); setFiltroSeg(''); setFiltroTamano(''); setFiltroSemaforo(''); setPage(1) }}
                  style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* ── Buscador ──────────────────────────────────────────── */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
                onKeyDown={e => e.key === 'Enter' && fetchList()}
                placeholder="Buscar por cliente, segmento…"
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button onClick={fetchList} style={{ padding: '8px 14px', borderRadius: 8, background: '#1B3FCC', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Buscar
            </button>
            {list && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{list.total.toLocaleString()} clientes</span>}
          </div>

          {loadingList
            ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Cargando…</div>
            : list && list.rows.length > 0
              ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                        {['Cliente', 'Segmento', 'Factura Mensual', 'MRR', 'Acumulado Rec.', 'Clasif. LTV', 'Semáforo', 'Meses Activo', 'Última Factura'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.rows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding: '9px 12px', maxWidth: 200 }}>
                            <div style={{ fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r['Nombre del Cliente'] || '—'}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{r['Tamaño Empresa']}</div>
                          </td>
                          <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.75)' }}>{r['Segmento Factura'] || '—'}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#fff' }}>{fmt$(r['Ticket Promedio'])}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1B3FCC' }}>{fmt$(r['MRR Limpio'])}</td>
                          <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.75)' }}>{fmt$(r['Importe Acumulado Recurrente'])}</td>
                          <td style={{ padding: '9px 12px' }}><span style={getBadgeStyle(r['Clasificación LTV'], {}, getLtvColor)}>{r['Clasificación LTV'] || '—'}</span></td>
                          <td style={{ padding: '9px 12px' }}><span style={getBadgeStyle(r['Semáforo Actividad'], SEMAFORO_COLOR)}>{r['Semáforo Actividad'] || '—'}</span></td>
                          <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>{r['Meses Activo'] ?? '—'}</td>
                          <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.45)' }}>{r['Última Factura'] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
              : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Sin resultados</div>
          }

          {list && totalPages > 1 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Página {page} de {totalPages}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={13} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
