'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BarChart2, Phone, PhoneIncoming, PhoneOutgoing, TrendingUp,
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Search,
  Zap, Filter, CheckCircle, Columns, ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react'

/* ── Tipos ─────────────────────────────────────────────────────────────────── */
interface Stats {
  total: number; totalMonto: number; avgConsumo: number
  sinConsumo: number; conEventos: number
  byPlan:  Record<string, { count: number; monto: number; consumo: number }>
  byClas:  Record<string, { count: number; monto: number }>
  byUso:   Record<string, number>
  zonas:   Record<string, number>
  byMes:   Record<string, { count: number; monto: number; consumo: number }>
}

interface CorteRow {
  cid: string; cliente: string; fechaCorte: string; periodo: string
  plan: string; minutosIncl: number; minutosConsum: number
  monto: number; pctConsumo: number; clasificacion: string
  pctEntrantes: number; pctSalientes: number; usoPrincipal: string
  eventosAnal: string
}

interface Filtros { fechas: string[]; planes: string[]; clases: string[]; usos: string[] }
interface ListRes  { total: number; page: number; size: number; rows: CorteRow[] }

/* ── Definición de columnas de la tabla Detalle ────────────────────────────── */
const ALL_COLS = [
  { key: 'cid',           label: 'CID'           },
  { key: 'cliente',       label: 'Cliente'        },
  { key: 'periodo',       label: 'Periodo'        },
  { key: 'plan',          label: 'Plan'           },
  { key: 'minutosIncl',   label: 'Min. Inc.'      },
  { key: 'minutosConsum', label: 'Min. Cons.'     },
  { key: 'pctConsumo',    label: '% Consumo'      },
  { key: 'monto',         label: 'Monto'          },
  { key: 'clasificacion', label: 'Clasificación'  },
  { key: 'uso',           label: 'Uso'            },
  { key: 'eventos',       label: 'Eventos'        },
] as const

type ColKey = typeof ALL_COLS[number]['key']

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const fmt$ = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')
const fmtMes = (ym: string) => {
  if (!ym) return ym
  const [y, m] = ym.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${meses[parseInt(m) - 1]} ${y}`
}

const CLAS_COLOR: Record<string, string> = {
  'AAA':     '#1B3FCC', 'Grande':  '#6366f1', 'Mediana': '#f59e0b',
  'Pequeña': '#22c55e', 'Micro':   '#94a3b8',
}
const USO_COLOR: Record<string, string> = {
  'entrantes': '#1B3FCC', 'salientes': '#f59e0b', 'mixtas': '#6366f1', '': '#94a3b8',
}

function getBadgeSt(val: string, map: Record<string, string>) {
  const color = map[val] ?? '#94a3b8'
  return { background: color + '18', color, fontWeight: 700 as const, fontSize: 10, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' as const }
}

function pctConsumoColor(p: number) {
  if (p === 0)    return '#ef4444'
  if (p <= 20)    return '#f97316'
  if (p <= 60)    return '#f59e0b'
  if (p <= 100)   return '#22c55e'
  return '#6366f1'
}

function KpiCard({ icon: Icon, label, value, sub, color, alert }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string; alert?: boolean
}) {
  return (
    <div className="cp-card" style={{ borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', border: alert ? '1.5px solid #fecaca' : undefined }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 20, fontWeight: 800, color: alert ? '#dc2626' : '#0f172a', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</p>}
      </div>
    </div>
  )
}

function HBar({ label, count, pct, monto, color, note }: {
  label: string; count: number; pct: number; monto?: number; color: string; note?: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, gap: 8 }}>
        <span style={{ fontSize: 12, color: '#374151', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label || '—'}</span>
        <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
          {monto != null ? fmt$(monto) + ' · ' : ''}{count}
          {note && <span style={{ color: '#94a3b8' }}> · {note}</span>}
        </span>
      </div>
      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

/* ── Selector de filtros ───────────────────────────────────────────────────── */
function FiltroSelect({ label, value, options, onChange, placeholder }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{
          appearance: 'none', WebkitAppearance: 'none',
          padding: '7px 28px 7px 10px', borderRadius: 8,
          border: value ? '1.5px solid #1B3FCC' : '1.5px solid #e2e8f0',
          fontSize: 12, background: '#fff',
          color: value ? '#1B3FCC' : '#374151',
          fontWeight: value ? 700 : 400, cursor: 'pointer', outline: 'none',
          minWidth: 160, maxWidth: 240,
        }}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{label === 'FECHA CORTE' ? fmtMes(o) : o}</option>)}
        </select>
        <svg viewBox="0 0 10 6" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 9, height: 9, pointerEvents: 'none', fill: value ? '#1B3FCC' : '#94a3b8' }}>
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </div>
    </div>
  )
}

/* ── Componente principal ──────────────────────────────────────────────────── */
export default function InformeCortesPage() {
  const [filtros,    setFiltros]    = useState<Filtros>({ fechas: [], planes: [], clases: [], usos: [] })
  const [filtFecha,  setFiltFecha]  = useState('')
  const [filtPlan,   setFiltPlan]   = useState('')
  const [filtClas,   setFiltClas]   = useState('')
  const [filtUso,    setFiltUso]    = useState('')
  const [q,          setQ]          = useState('')
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [list,       setList]       = useState<ListRes | null>(null)
  const [page,       setPage]       = useState(1)
  const [tab,        setTab]        = useState<'resumen' | 'consumo' | 'tendencia' | 'detalle'>('resumen')
  const [loading,    setLoading]    = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  const [sortBy,     setSortBy]     = useState<ColKey | ''>('')
  const [sortDir,    setSortDir]    = useState<'asc' | 'desc'>('asc')
  const [visibleCols,  setVisibleCols]  = useState<Set<ColKey>>(new Set(ALL_COLS.map(c => c.key)))
  const [colOrder,     setColOrder]     = useState<ColKey[]>(ALL_COLS.map(c => c.key))
  const [showColMenu,  setShowColMenu]  = useState(false)
  const [dragOverIdx,  setDragOverIdx]  = useState<number | null>(null)
  const colMenuRef  = useRef<HTMLDivElement>(null)
  const dragItemIdx = useRef<number | null>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setShowColMenu(false)
      }
    }
    if (showColMenu) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showColMenu])

  function handleDragStart(idx: number) {
    dragItemIdx.current = idx
  }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setDragOverIdx(idx)
  }
  function handleDrop(e: React.DragEvent, idx: number) {
    e.preventDefault()
    const from = dragItemIdx.current
    if (from === null || from === idx) { setDragOverIdx(null); return }
    const next = Array.from(colOrder)
    const [moved] = next.splice(from, 1)
    next.splice(idx, 0, moved)
    setColOrder(next)
    dragItemIdx.current = null
    setDragOverIdx(null)
  }
  function handleDragEnd() {
    dragItemIdx.current = null
    setDragOverIdx(null)
  }

  function handleSort(key: ColKey) {
    if (key === 'cid' || key === 'eventos') return  // sin sort en CID ni Eventos
    if (sortBy === key) {
      if (sortDir === 'asc')  { setSortDir('desc') }
      else                    { setSortBy(''); setSortDir('asc') }
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  /* ── Cargar filtros y stats iniciales ─────────────────────────────── */
  useEffect(() => {
    Promise.all([
      fetch('/api/cortes?mode=filters').then(r => r.json()),
      fetch('/api/cortes?mode=stats').then(r => r.json()),
    ]).then(([f, s]) => {
      setFiltros(f)
      setStats(s)
      if (f.fechas?.length) setFiltFecha(f.fechas[0]) // mes más reciente
    }).finally(() => setLoading(false))
  }, [])

  /* ── Recargar stats cuando cambian filtros ────────────────────────── */
  useEffect(() => {
    const p = new URLSearchParams({ mode: 'stats' })
    if (filtFecha) p.set('fecha', filtFecha)
    if (filtPlan)  p.set('plan',  filtPlan)
    if (filtClas)  p.set('clas',  filtClas)
    if (filtUso)   p.set('uso',   filtUso)
    fetch(`/api/cortes?${p}`).then(r => r.json()).then(s => { if (s.total != null) setStats(s) })
  }, [filtFecha, filtPlan, filtClas, filtUso])

  /* ── Lista paginada ───────────────────────────────────────────────── */
  const fetchList = useCallback(() => {
    setLoadingList(true)
    const p = new URLSearchParams({ mode: 'list', page: String(page), size: '30' })
    if (filtFecha) p.set('fecha',   filtFecha)
    if (filtPlan)  p.set('plan',    filtPlan)
    if (filtClas)  p.set('clas',    filtClas)
    if (filtUso)   p.set('uso',     filtUso)
    if (q)         p.set('q',       q)
    if (sortBy)  { p.set('sortBy',  sortBy); p.set('sortDir', sortDir) }
    fetch(`/api/cortes?${p}`).then(r => r.json()).then(d => {
      if (!d.error) setList(d)
    }).finally(() => setLoadingList(false))
  }, [filtFecha, filtPlan, filtClas, filtUso, q, page, sortBy, sortDir])

  useEffect(() => { if (tab === 'detalle') fetchList() }, [tab, fetchList])

  const resetFiltros = () => {
    setFiltFecha(filtros.fechas[0] ?? '')
    setFiltPlan(''); setFiltClas(''); setFiltUso('')
    setQ(''); setPage(1)
  }

  const totalPages = list ? Math.ceil(list.total / 30) : 0

  /* ── Tendencia por mes ────────────────────────────────────────────── */
  const mesTendencia = stats?.byMes
    ? Object.entries(stats.byMes).sort((a, b) => a[0].localeCompare(b[0]))
    : []
  const maxMonto = Math.max(...mesTendencia.map(([, v]) => v.monto), 1)

  /* ── Previsión simple (promedio móvil 3 meses → proyección 1 mes) ── */
  const forecast = (() => {
    if (mesTendencia.length < 3) return null
    const last3 = mesTendencia.slice(-3)
    const avgMonto   = last3.reduce((s, [, v]) => s + v.monto, 0)   / 3
    const avgCount   = last3.reduce((s, [, v]) => s + v.count, 0)   / 3
    const avgConsumo = last3.reduce((s, [, v]) => s + v.consumo / v.count, 0) / 3
    return { monto: avgMonto, count: avgCount, consumo: avgConsumo }
  })()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <RefreshCw size={28} style={{ color: '#1B3FCC', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#64748b', fontSize: 14 }}>Cargando cortes de facturación…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', background: '#f1f5f9', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Informe de Cortes</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Análisis de consumo y comportamiento por periodo de corte
          </p>
        </div>
        <button onClick={() => { setStats(null); setLoading(true); setTimeout(() => window.location.reload(), 100) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 }}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* ── Panel de filtros ──────────────────────────────────────────────── */}
      <div className="cp-card" style={{ borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Filter size={13} style={{ color: '#64748b' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filtros</span>
          {(filtFecha || filtPlan || filtClas || filtUso) && (
            <button onClick={resetFiltros}
              style={{ marginLeft: 'auto', fontSize: 11, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              Limpiar filtros
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <FiltroSelect label="FECHA CORTE"   value={filtFecha} options={filtros.fechas} onChange={v => { setFiltFecha(v); setPage(1) }} placeholder="Todos los meses" />
          <FiltroSelect label="CLASIFICACIÓN" value={filtClas}  options={filtros.clases} onChange={v => { setFiltClas(v);  setPage(1) }} placeholder="Todas las clasificaciones" />
          <FiltroSelect label="PLAN"          value={filtPlan}  options={filtros.planes} onChange={v => { setFiltPlan(v);  setPage(1) }} placeholder="Todos los planes" />
          <FiltroSelect label="USO PRINCIPAL" value={filtUso}   options={filtros.usos}   onChange={v => { setFiltUso(v);   setPage(1) }} placeholder="Todos los usos" />
        </div>
        {filtFecha && (
          <p style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
            Mostrando: <strong style={{ color: '#1B3FCC' }}>{fmtMes(filtFecha)}</strong>
            {filtClas  && <> · <strong>{filtClas}</strong></>}
            {filtPlan  && <> · <strong>{filtPlan.length > 35 ? filtPlan.slice(0, 35) + '…' : filtPlan}</strong></>}
            {filtUso   && <> · <strong>{filtUso}</strong></>}
          </p>
        )}
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <KpiCard icon={BarChart2}    label="Cortes en periodo"  value={stats.total.toLocaleString('es-MX')} sub={filtFecha ? fmtMes(filtFecha) : 'Todos los meses'} color="#1B3FCC" />
          <KpiCard icon={TrendingUp}   label="Monto total planes" value={fmt$(stats.totalMonto)}              sub={`Prom. ${fmt$(stats.totalMonto / Math.max(stats.total, 1))} / corte`} color="#6366f1" />
          <KpiCard icon={Zap}          label="Consumo promedio"   value={`${stats.avgConsumo.toFixed(1)}%`}   sub="de minutos incluidos usados" color="#22c55e" />
          <KpiCard icon={AlertTriangle} label="Sin consumo (0%)" value={stats.sinConsumo.toLocaleString('es-MX')} sub={`${stats.total ? ((stats.sinConsumo / stats.total) * 100).toFixed(1) : 0}% del total`} color="#ef4444" alert={stats.sinConsumo > stats.total * 0.2} />
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {([
          { key: 'resumen',   label: 'Resumen'           },
          { key: 'consumo',   label: 'Distribución'      },
          { key: 'tendencia', label: 'Tendencia / Prev.' },
          { key: 'detalle',   label: 'Detalle'           },
        ] as { key: typeof tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === t.key ? '#1B3FCC' : '#fff',
            color:      tab === t.key ? '#fff' : '#374151',
            boxShadow:  tab === t.key ? '0 2px 8px rgba(27,63,204,0.25)' : '0 1px 3px rgba(0,0,0,0.08)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: RESUMEN
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'resumen' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Top planes por monto */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Top Planes — Monto Total</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.entries(stats.byPlan)
                .sort((a, b) => b[1].monto - a[1].monto)
                .slice(0, 10)
                .map(([plan, v], i) => {
                  const colors = ['#1B3FCC','#6366f1','#8b5cf6','#f59e0b','#22c55e','#f97316','#ec4899','#06b6d4','#84cc16','#94a3b8']
                  const max = Object.values(stats.byPlan).reduce((m, x) => Math.max(m, x.monto), 1)
                  return (
                    <HBar key={plan}
                      label={plan.length > 38 ? plan.slice(0, 38) + '…' : plan}
                      count={v.count} monto={v.monto}
                      pct={Math.round((v.monto / max) * 100)}
                      color={colors[i % colors.length]}
                    />
                  )
                })}
            </div>
          </div>

          {/* Clasificación empresa */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Clasificación de Empresa</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.entries(stats.byClas)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([clas, v]) => {
                  const max = Object.values(stats.byClas).reduce((m, x) => Math.max(m, x.count), 1)
                  return (
                    <HBar key={clas}
                      label={clas} count={v.count} monto={v.monto}
                      pct={Math.round((v.count / max) * 100)}
                      color={CLAS_COLOR[clas] ?? '#94a3b8'}
                    />
                  )
                })}
            </div>
          </div>

          {/* Uso principal de llamadas */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Uso Principal de Llamadas</p>
            {(() => {
              const total = Object.values(stats.byUso).reduce((s, n) => s + n, 0) || 1
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(stats.byUso).sort((a, b) => b[1] - a[1]).map(([uso, n]) => (
                    <div key={uso}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {uso === 'entrantes' ? <PhoneIncoming size={13} style={{ color: USO_COLOR[uso] }} />
                           : uso === 'salientes' ? <PhoneOutgoing size={13} style={{ color: USO_COLOR[uso] }} />
                           : <Phone size={13} style={{ color: USO_COLOR[uso] }} />}
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, textTransform: 'capitalize' }}>{uso || '—'}</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{n.toLocaleString('es-MX')} · {((n / total) * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99 }}>
                        <div style={{ width: `${(n / total) * 100}%`, height: '100%', background: USO_COLOR[uso] ?? '#94a3b8', borderRadius: 99, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Consumo promedio por plan (top 8) */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Consumo Promedio por Plan</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.entries(stats.byPlan)
                .map(([plan, v]) => ({ plan, avg: v.count ? v.consumo / v.count : 0, count: v.count }))
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 8)
                .map(({ plan, avg, count }) => (
                  <HBar key={plan}
                    label={plan.length > 38 ? plan.slice(0, 38) + '…' : plan}
                    count={count} pct={Math.min(Math.round(avg), 100)}
                    note={`${avg.toFixed(1)}% consumo`}
                    color={pctConsumoColor(avg)}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: DISTRIBUCIÓN DE CONSUMO
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'consumo' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Zonas de consumo */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 20, gridColumn: '1 / -1' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Distribución por % de Consumo</p>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Cuántos clientes caen en cada rango de uso respecto a sus minutos incluidos</p>
            {(() => {
              const ZONA_COLORS: Record<string, string> = {
                '0%': '#ef4444', '1-20%': '#f97316', '21-40%': '#f59e0b',
                '41-60%': '#84cc16', '61-80%': '#22c55e', '81-100%': '#1B3FCC', '>100%': '#6366f1',
              }
              const maxZ = Math.max(...Object.values(stats.zonas), 1)
              const total = Object.values(stats.zonas).reduce((s, n) => s + n, 0) || 1
              return (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 180 }}>
                  {Object.entries(stats.zonas).map(([zona, n]) => {
                    const h = Math.round((n / maxZ) * 150)
                    const pct = ((n / total) * 100).toFixed(1)
                    return (
                      <div key={zona} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: '#374151', fontWeight: 700 }}>{n.toLocaleString()}</span>
                        <span style={{ fontSize: 9, color: '#94a3b8' }}>{pct}%</span>
                        <div style={{ width: '100%', height: h, background: ZONA_COLORS[zona] ?? '#94a3b8', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' }} title={`${zona}: ${n} cortes`} />
                        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{zona}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Minutos incluidos vs consumidos */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Alertas de Consumo</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Sin consumo (0 min)', n: stats.zonas['0%'] ?? 0, color: '#ef4444', desc: 'Clientes sin ninguna llamada' },
                { label: 'Consumo muy bajo (1-20%)', n: stats.zonas['1-20%'] ?? 0, color: '#f97316', desc: 'Uso mínimo del plan' },
                { label: 'Exceden su plan (>100%)', n: stats.zonas['>100%'] ?? 0, color: '#6366f1', desc: 'Candidatos a upgrade' },
              ].map(({ label, n, color, desc }) => (
                <div key={label} style={{ padding: '12px 14px', borderRadius: 10, background: color + '08', border: `1px solid ${color}20` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color }}>{label}</p>
                      <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{desc}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{n.toLocaleString()}</p>
                      <p style={{ fontSize: 10, color: '#94a3b8' }}>{stats.total ? ((n / stats.total) * 100).toFixed(1) : 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eventos analizados */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Eventos Analizados</p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              {[
                { label: 'Con eventos', n: stats.conEventos, color: '#22c55e', icon: CheckCircle },
                { label: 'Sin eventos', n: stats.total - stats.conEventos, color: '#94a3b8', icon: AlertTriangle },
              ].map(({ label, n, color, icon: Icon }) => (
                <div key={label} style={{ flex: 1, padding: '14px 16px', borderRadius: 10, background: color + '10', border: `1px solid ${color}25`, textAlign: 'center' }}>
                  <Icon size={20} style={{ color, margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{n.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{label}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8' }}>{stats.total ? ((n / stats.total) * 100).toFixed(1) : 0}%</p>
                </div>
              ))}
            </div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99 }}>
              <div style={{ width: `${stats.total ? (stats.conEventos / stats.total) * 100 : 0}%`, height: '100%', background: '#22c55e', borderRadius: 99 }} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: TENDENCIA / PREVISIÓN
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'tendencia' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Gráfica de tendencia mensual */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Monto Total por Mes de Corte</p>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Evolución histórica · {mesTendencia.length} periodos</p>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 200, overflowX: 'auto', paddingBottom: 4 }}>
              {mesTendencia.map(([mes, v], idx) => {
                const h = Math.round((v.monto / maxMonto) * 160)
                const isForecast = false
                const isLast = idx === mesTendencia.length - 1
                return (
                  <div key={mes} style={{ minWidth: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, color: '#64748b', textAlign: 'center' }}>{fmt$(v.monto)}</span>
                    <div style={{
                      width: 40, height: h,
                      background: isLast ? '#1B3FCC' : '#1B3FCC40',
                      borderRadius: '4px 4px 0 0', transition: 'height 0.4s',
                      border: isForecast ? '2px dashed #6366f1' : undefined,
                    }} title={`${fmtMes(mes)}: ${fmt$(v.monto)}`} />
                    <span style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {fmtMes(mes)}
                    </span>
                    <span style={{ fontSize: 9, color: '#64748b' }}>{v.count}</span>
                  </div>
                )
              })}

              {/* Proyección siguiente mes */}
              {forecast && (
                <div style={{ minWidth: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: '#6366f1', textAlign: 'center', fontWeight: 700 }}>{fmt$(forecast.monto)}</span>
                  <div style={{
                    width: 40, height: Math.round((forecast.monto / maxMonto) * 160),
                    background: 'transparent', borderRadius: '4px 4px 0 0',
                    border: '2px dashed #6366f1',
                  }} title={`Proyección: ${fmt$(forecast.monto)}`} />
                  <span style={{ fontSize: 9, color: '#6366f1', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Proyección
                  </span>
                  <span style={{ fontSize: 9, color: '#6366f1' }}>{Math.round(forecast.count)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tendencia de consumo promedio */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Consumo Promedio % por Mes</p>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Comportamiento de uso de minutos incluidos</p>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120 }}>
              {mesTendencia.map(([mes, v], idx) => {
                const avgC = v.count ? v.consumo / v.count : 0
                const h = Math.round((avgC / 100) * 90)
                const isLast = idx === mesTendencia.length - 1
                return (
                  <div key={mes} style={{ minWidth: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, color: '#64748b' }}>{avgC.toFixed(0)}%</span>
                    <div style={{ width: 40, height: Math.max(h, 4), background: isLast ? pctConsumoColor(avgC) : pctConsumoColor(avgC) + '60', borderRadius: '4px 4px 0 0' }} />
                    <span style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtMes(mes)}</span>
                  </div>
                )
              })}
              {forecast && (
                <div style={{ minWidth: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: '#6366f1', fontWeight: 700 }}>{forecast.consumo.toFixed(0)}%</span>
                  <div style={{ width: 40, height: Math.max(Math.round((forecast.consumo / 100) * 90), 4), background: 'transparent', borderRadius: '4px 4px 0 0', border: '2px dashed #6366f1' }} />
                  <span style={{ fontSize: 8, color: '#6366f1', fontWeight: 700 }}>Proy.</span>
                </div>
              )}
            </div>
          </div>

          {/* Card de previsión */}
          {forecast && (
            <div className="cp-card" style={{ borderRadius: 14, padding: 20, background: 'linear-gradient(135deg, #6366f108, #1B3FCC08)', border: '1px solid #6366f130' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TrendingUp size={16} style={{ color: '#6366f1' }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Previsión próximo corte (promedio móvil 3 meses)</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Monto proyectado',    value: fmt$(forecast.monto),                  color: '#6366f1' },
                  { label: 'Cortes esperados',    value: Math.round(forecast.count).toLocaleString(), color: '#1B3FCC' },
                  { label: 'Consumo proyectado',  value: `${forecast.consumo.toFixed(1)}%`,     color: pctConsumoColor(forecast.consumo) },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '12px 16px', background: '#fff', borderRadius: 10 }}>
                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color }}>{value}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
                * Basado en promedio de los últimos {Math.min(mesTendencia.length, 3)} meses disponibles. No considera estacionalidad ni eventos especiales.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: DETALLE
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'detalle' && (
        <div className="cp-card" style={{ borderRadius: 14, overflow: 'hidden' }}>

          {/* Buscador + selector de columnas */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center', background: '#f8fafc' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
                onKeyDown={e => e.key === 'Enter' && fetchList()}
                placeholder="Buscar cliente o CID…"
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button onClick={() => { setPage(1); fetchList() }}
              style={{ padding: '8px 14px', borderRadius: 8, background: '#1B3FCC', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Buscar
            </button>

            {/* Selector de columnas */}
            <div ref={colMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowColMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                  background: showColMenu ? '#1B3FCC' : '#fff',
                  color: showColMenu ? '#fff' : '#374151',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                }}
              >
                <Columns size={13} />
                Columnas
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: showColMenu ? 'rgba(255,255,255,0.25)' : '#1B3FCC18',
                  color: showColMenu ? '#fff' : '#1B3FCC',
                  padding: '1px 5px', borderRadius: 99,
                }}>
                  {visibleCols.size}/{ALL_COLS.length}
                </span>
              </button>

              {showColMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
                  background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 4px',
                  minWidth: 220,
                }}>
                  {/* Cabecera */}
                  <div style={{ padding: '4px 12px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Columnas
                      </span>
                      <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0 0' }}>Arrastra para reordenar</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setVisibleCols(new Set(ALL_COLS.map(c => c.key)))}
                        style={{ fontSize: 10, color: '#1B3FCC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                        Todas
                      </button>
                      <button onClick={() => setColOrder(ALL_COLS.map(c => c.key))}
                        style={{ fontSize: 10, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Reset orden
                      </button>
                    </div>
                  </div>
                  <div style={{ height: 1, background: '#f1f5f9', margin: '4px 8px 6px' }} />

                  {/* Lista draggable */}
                  {colOrder.map((key, idx) => {
                    const col    = ALL_COLS.find(c => c.key === key)!
                    const checked = visibleCols.has(key)
                    const isTarget = dragOverIdx === idx
                    const fromAbove = isTarget && dragItemIdx.current !== null && dragItemIdx.current > idx
                    const fromBelow = isTarget && dragItemIdx.current !== null && dragItemIdx.current < idx
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={e => handleDragOver(e, idx)}
                        onDragLeave={() => setDragOverIdx(null)}
                        onDrop={e => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 10px',
                          borderRadius: 8, margin: '1px 4px',
                          background: isTarget ? '#EFF6FF' : 'transparent',
                          borderTop:    fromAbove ? '2px solid #1B3FCC' : '2px solid transparent',
                          borderBottom: fromBelow ? '2px solid #1B3FCC' : '2px solid transparent',
                          opacity: dragItemIdx.current === idx ? 0.35 : 1,
                          cursor: 'grab',
                          transition: 'background 0.1s, opacity 0.15s',
                          userSelect: 'none',
                        }}
                      >
                        {/* Handle */}
                        <span style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1, flexShrink: 0 }}>⠿</span>

                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            e.stopPropagation()
                            setVisibleCols(prev => {
                              const next = new Set(prev)
                              if (next.has(key)) { if (next.size > 1) next.delete(key) }
                              else next.add(key)
                              return next
                            })
                          }}
                          onClick={e => e.stopPropagation()}
                          style={{ accentColor: '#1B3FCC', width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                        />

                        {/* Etiqueta */}
                        <span style={{ fontSize: 13, color: checked ? '#0f172a' : '#94a3b8', fontWeight: checked ? 600 : 400, flex: 1 }}>
                          {col.label}
                        </span>

                        {/* Número de posición */}
                        <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 700, minWidth: 16, textAlign: 'right' }}>
                          {idx + 1}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {list && <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{list.total.toLocaleString('es-MX')} registros</span>}
          </div>

          {loadingList ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Cargando…</div>
          ) : list && list.rows.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {colOrder.filter(k => visibleCols.has(k)).map(k => {
                      const col     = ALL_COLS.find(c => c.key === k)!
                      const isNum   = ['minutosIncl','minutosConsum','pctConsumo','monto'].includes(k)
                      const noSort  = k === 'cid' || k === 'eventos'
                      const active  = sortBy === k
                      const SortIcon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                      return (
                        <th
                          key={k}
                          onClick={() => handleSort(k as ColKey)}
                          style={{
                            padding: '10px 10px',
                            textAlign: isNum ? 'right' : 'left',
                            fontWeight: 700,
                            color: active ? '#1B3FCC' : '#374151',
                            borderBottom: '1px solid #e2e8f0',
                            whiteSpace: 'nowrap',
                            fontSize: 11,
                            cursor: noSort ? 'default' : 'pointer',
                            userSelect: 'none',
                            background: active ? '#EFF6FF' : undefined,
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {col.label}
                            {!noSort && (
                              <SortIcon
                                size={11}
                                style={{ color: active ? '#1B3FCC' : '#cbd5e1', flexShrink: 0 }}
                              />
                            )}
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {colOrder.filter(k => visibleCols.has(k)).map(k => {
                        if (k === 'cid')
                          return <td key={k} style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>{r.cid}</td>
                        if (k === 'cliente')
                          return <td key={k} style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.cliente}</td>
                        if (k === 'periodo')
                          return <td key={k} style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 11 }}>{r.periodo}</td>
                        if (k === 'plan')
                          return <td key={k} style={{ padding: '8px 10px', color: '#374151', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.plan}>{r.plan}</td>
                        if (k === 'minutosIncl')
                          return <td key={k} style={{ padding: '8px 10px', color: '#374151', textAlign: 'right' }}>{r.minutosIncl.toLocaleString()}</td>
                        if (k === 'minutosConsum')
                          return <td key={k} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: r.minutosConsum === 0 ? '#ef4444' : '#0f172a' }}>{r.minutosConsum.toLocaleString()}</td>
                        if (k === 'pctConsumo')
                          return <td key={k} style={{ padding: '8px 10px', textAlign: 'right' }}><span style={{ fontWeight: 700, color: pctConsumoColor(r.pctConsumo) }}>{r.pctConsumo.toFixed(1)}%</span></td>
                        if (k === 'monto')
                          return <td key={k} style={{ padding: '8px 10px', fontWeight: 700, color: '#1B3FCC', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt$(r.monto)}</td>
                        if (k === 'clasificacion')
                          return <td key={k} style={{ padding: '8px 10px' }}><span style={getBadgeSt(r.clasificacion, CLAS_COLOR)}>{r.clasificacion || '—'}</span></td>
                        if (k === 'uso')
                          return <td key={k} style={{ padding: '8px 10px' }}><span style={getBadgeSt(r.usoPrincipal, USO_COLOR)}>{r.usoPrincipal || '—'}</span></td>
                        if (k === 'eventos')
                          return (
                            <td key={k} style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {r.eventosAnal === 'Si'
                                ? <CheckCircle size={13} style={{ color: '#22c55e' }} />
                                : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}
                            </td>
                          )
                        return null
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Sin resultados</div>
          )}

          {list && totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Página {page} de {totalPages}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + idx
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: p === page ? '#1B3FCC' : '#fff', color: p === page ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: p === page ? 700 : 400 }}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
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
