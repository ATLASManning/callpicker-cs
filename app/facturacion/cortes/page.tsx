'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BarChart2, TrendingUp, AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight, Search, Zap, Filter,
  CheckCircle, Columns, ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react'

/* ── Tipos */
interface Stats {
  total: number; totalMonto: number; avgConsumo: number
  sinConsumo: number; conEventos: number
  byPlan: Record<string, { count: number; monto: number; consumo: number }>
  byClas: Record<string, { count: number; monto: number }>
  byUso:  Record<string, number>
  zonas:  Record<string, number>
  byMes:  Record<string, { count: number; monto: number; consumo: number }>
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

/* ── Columnas */
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

/* ── Helpers */
const fmt$  = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')
const fmtK  = (n: number) =>
  n >= 1_000_000 ? '$' + (n / 1_000_000).toFixed(1) + 'M'
  : n >= 1_000   ? '$' + (n / 1_000).toFixed(0) + 'K'
  : fmt$(n)
const fmtMes = (ym: string) => {
  if (!ym) return ym
  const [y, m] = ym.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${meses[parseInt(m) - 1]} ${y}`
}
const shortPlan = (p: string) =>
  p.replace('Visibilidad y Control', 'VyC')
   .replace('Comunicación Empresarial', 'CE')
   .replace('Extensiones VyC', 'Ext VyC')
   .replace('Ilimitadas', 'IL')
   .replace(' Callcenter', ' CC')
   .replace('minutos', 'min')
   .replace(/  +/g, ' ').trim()

/* ── Paleta oscura */
const PLAN_COLORS = [
  '#60A5FA','#818CF8','#A78BFA','#F472B6','#34D399',
  '#FB923C','#22D3EE','#A3E635','#F87171','#FBBF24',
]
const CLAS_COLOR: Record<string, string> = {
  'AAA':'#1B3FCC','Grande':'#6366f1','Mediana':'#f59e0b','Pequeña':'#22c55e','Micro':'#94a3b8',
}
const CLAS_COLOR_D: Record<string, string> = {
  'AAA':'#60A5FA','Grande':'#818CF8','Mediana':'#FBBF24','Pequeña':'#4ADE80','Micro':'#94A3B8',
}
const USO_COLOR: Record<string, string> = {
  'entrantes':'#1B3FCC','salientes':'#f59e0b','mixtas':'#6366f1','':'#94a3b8','equilibrado':'#6366f1',
}
const USO_COLOR_D: Record<string, string> = {
  'entrantes':'#60A5FA','salientes':'#FBBF24','mixtas':'#A78BFA','equilibrado':'#34D399',
}
const ZONA_COLORS: Record<string, string> = {
  '0%':'#F87171','1-20%':'#FB923C','21-40%':'#FBBF24',
  '41-60%':'#A3E635','61-80%':'#4ADE80','81-100%':'#60A5FA','>100%':'#818CF8',
}

function getBadgeSt(val: string, map: Record<string, string>) {
  const color = map[val] ?? '#94a3b8'
  return { background: color + '18', color, fontWeight: 700 as const, fontSize: 10, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' as const }
}
function pctColor(p: number) {
  if (p === 0)  return '#ef4444'
  if (p <= 20)  return '#f97316'
  if (p <= 60)  return '#f59e0b'
  if (p <= 100) return '#22c55e'
  return '#6366f1'
}
function pctColorD(p: number) {
  if (p === 0)  return '#F87171'
  if (p <= 20)  return '#FB923C'
  if (p <= 60)  return '#FBBF24'
  if (p <= 100) return '#4ADE80'
  return '#818CF8'
}

/* ── VBarChart — barras verticales para fondos oscuros */
type VEntry = { label: string; value: number; color: string; sub?: string }
function VBarChart({ entries, height = 160, fmtVal = (n: number) => n.toLocaleString('es-MX') }: {
  entries: VEntry[]; height?: number; fmtVal?: (n: number) => string
}) {
  const max = Math.max(...entries.map(e => e.value), 1)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: height + 54 }}>
      {entries.map((e, i) => {
        const h = Math.max(6, Math.round((e.value / max) * height))
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {fmtVal(e.value)}
            </span>
            <div style={{
              width: '76%', height: h, minHeight: 6,
              background: `linear-gradient(180deg, ${e.color} 0%, ${e.color}88 100%)`,
              borderRadius: '5px 5px 0 0',
              boxShadow: `0 4px 18px ${e.color}45`,
              transition: 'height 0.5s cubic-bezier(.34,1.56,.64,1)',
            }} title={`${e.label}: ${fmtVal(e.value)}`} />
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', display: 'block' }}>
              {e.label.length > 13 ? e.label.slice(0, 12) + '…' : e.label}
            </span>
            {e.sub && <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{e.sub}</span>}
          </div>
        )
      })}
    </div>
  )
}

/* ── KpiCard — dark */
function KpiCard({ icon: Icon, label, value, sub, color, alert }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string; alert?: boolean
}) {
  return (
    <div style={{
      borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
      background: '#0D1829',
      border: alert ? '1.5px solid rgba(248,113,113,0.5)' : '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: color + '22', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: alert ? '#F87171' : '#fff', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ── FiltroSelect */
function FiltroSelect({ label, value, options, onChange, placeholder }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{label}</span>
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

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════════════════════ */
export default function InformeCortesPage() {
  const [filtros,      setFiltros]      = useState<Filtros>({ fechas: [], planes: [], clases: [], usos: [] })
  const [filtFecha,    setFiltFecha]    = useState('')
  const [filtPlan,     setFiltPlan]     = useState('')
  const [filtClas,     setFiltClas]     = useState('')
  const [filtUso,      setFiltUso]      = useState('')
  const [q,            setQ]            = useState('')
  const [stats,        setStats]        = useState<Stats | null>(null)
  const [list,         setList]         = useState<ListRes | null>(null)
  const [page,         setPage]         = useState(1)
  const [tab,          setTab]          = useState<'resumen' | 'consumo' | 'tendencia' | 'detalle'>('detalle')
  const [loading,      setLoading]      = useState(true)
  const [loadingList,  setLoadingList]  = useState(false)
  const [sortBy,       setSortBy]       = useState<ColKey | ''>('')
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('asc')
  const [visibleCols,  setVisibleCols]  = useState<Set<ColKey>>(new Set(ALL_COLS.map(c => c.key)))
  const [colOrder,     setColOrder]     = useState<ColKey[]>(ALL_COLS.map(c => c.key))
  const [showColMenu,  setShowColMenu]  = useState(false)
  const [dragOverIdx,  setDragOverIdx]  = useState<number | null>(null)
  const colMenuRef  = useRef<HTMLDivElement>(null)
  const dragItemIdx = useRef<number | null>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setShowColMenu(false)
    }
    if (showColMenu) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showColMenu])

  function handleDragStart(idx: number) { dragItemIdx.current = idx }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx) }
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
  function handleDragEnd() { dragItemIdx.current = null; setDragOverIdx(null) }

  function handleSort(key: ColKey) {
    if (key === 'cid' || key === 'eventos') return
    if (sortBy === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortBy(''); setSortDir('asc') }
    } else { setSortBy(key); setSortDir('asc') }
    setPage(1)
  }

  /* ── Carga inicial */
  useEffect(() => {
    const sp     = new URLSearchParams(window.location.search)
    const urlTab = sp.get('tab')
    const urlQ   = sp.get('q')
    if (urlTab === 'detalle' || urlTab === 'resumen' || urlTab === 'consumo' || urlTab === 'tendencia') {
      setTab(urlTab as 'detalle' | 'resumen' | 'consumo' | 'tendencia')
    }
    if (urlQ) setQ(urlQ)
    Promise.all([
      fetch('/api/cortes?mode=filters').then(r => r.json()),
      fetch('/api/cortes?mode=stats').then(r => r.json()),
    ]).then(([f, s]) => {
      setFiltros(f); setStats(s)
      if (f.fechas?.length) setFiltFecha(f.fechas[0])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const p = new URLSearchParams({ mode: 'stats' })
    if (filtFecha) p.set('fecha', filtFecha)
    if (filtPlan)  p.set('plan',  filtPlan)
    if (filtClas)  p.set('clas',  filtClas)
    if (filtUso)   p.set('uso',   filtUso)
    fetch(`/api/cortes?${p}`).then(r => r.json()).then(s => { if (s.total != null) setStats(s) })
  }, [filtFecha, filtPlan, filtClas, filtUso])

  const fetchList = useCallback(() => {
    setLoadingList(true)
    const p = new URLSearchParams({ mode: 'list', page: String(page), size: '30' })
    if (filtFecha) p.set('fecha',   filtFecha)
    if (filtPlan)  p.set('plan',    filtPlan)
    if (filtClas)  p.set('clas',    filtClas)
    if (filtUso)   p.set('uso',     filtUso)
    if (q)         p.set('q',       q)
    if (sortBy)  { p.set('sortBy',  sortBy); p.set('sortDir', sortDir) }
    fetch(`/api/cortes?${p}`).then(r => r.json()).then(d => { if (!d.error) setList(d) })
      .finally(() => setLoadingList(false))
  }, [filtFecha, filtPlan, filtClas, filtUso, q, page, sortBy, sortDir])

  useEffect(() => { if (tab === 'detalle') fetchList() }, [tab, fetchList])

  const resetFiltros = () => {
    setFiltFecha(filtros.fechas[0] ?? '')
    setFiltPlan(''); setFiltClas(''); setFiltUso(''); setQ(''); setPage(1)
  }

  const totalPages    = list ? Math.ceil(list.total / 30) : 0
  const mesTendencia  = stats?.byMes ? Object.entries(stats.byMes).sort((a, b) => a[0].localeCompare(b[0])) : []
  const maxMonto      = Math.max(...mesTendencia.map(([, v]) => v.monto), 1)

  const forecast = (() => {
    if (mesTendencia.length < 3) return null
    const last3      = mesTendencia.slice(-3)
    const avgMonto   = last3.reduce((s, [, v]) => s + v.monto, 0) / 3
    const avgCount   = last3.reduce((s, [, v]) => s + v.count, 0) / 3
    const avgConsumo = last3.reduce((s, [, v]) => s + v.consumo / v.count, 0) / 3
    return { monto: avgMonto, count: avgCount, consumo: avgConsumo }
  })()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <RefreshCw size={28} style={{ color: '#1B3FCC', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Cargando cortes de facturación…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  /* ── Shortcuts de estilo dark-card */
  const DC = { background: '#0D1829', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }
  const DT = { fontSize: 13, fontWeight: 700, color: '#fff',                    marginBottom: 4  }
  const DS = { fontSize: 11, color: 'rgba(255,255,255,0.45)',                   marginBottom: 16 }

  return (
    <div style={{ padding: '28px 32px', background: 'rgba(255,255,255,0.04)', minHeight: '100vh' }}>

      {/* ── Header */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Informe de Cortes</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Análisis de consumo y comportamiento por periodo de corte</p>
        </div>
        <button onClick={() => { setStats(null); setLoading(true); setTimeout(() => window.location.reload(), 100) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* ── Filtros */}
      <div className="cp-card" style={{ borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Filter size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filtros</span>
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
          <p style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            Mostrando: <strong style={{ color: '#1B3FCC' }}>{fmtMes(filtFecha)}</strong>
            {filtClas && <> · <strong>{filtClas}</strong></>}
            {filtPlan && <> · <strong>{filtPlan.length > 35 ? filtPlan.slice(0, 35) + '…' : filtPlan}</strong></>}
            {filtUso  && <> · <strong>{filtUso}</strong></>}
          </p>
        )}
      </div>

      {/* ── KPIs — dark */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <KpiCard icon={BarChart2}     label="Cortes en periodo"  value={stats.total.toLocaleString('es-MX')}      sub={filtFecha ? fmtMes(filtFecha) : 'Todos los meses'}               color="#60A5FA" />
          <KpiCard icon={TrendingUp}    label="Monto total planes" value={fmtK(stats.totalMonto)}                   sub={`Prom. ${fmtK(stats.totalMonto / Math.max(stats.total, 1))} / corte`} color="#818CF8" />
          <KpiCard icon={Zap}           label="Consumo promedio"   value={`${stats.avgConsumo.toFixed(1)}%`}         sub="de minutos incluidos usados"                                       color="#4ADE80" />
          <KpiCard icon={AlertTriangle} label="Sin consumo (0%)"   value={stats.sinConsumo.toLocaleString('es-MX')} sub={`${stats.total ? ((stats.sinConsumo / stats.total) * 100).toFixed(1) : 0}% del total`} color="#F87171" alert={stats.sinConsumo > stats.total * 0.2} />
        </div>
      )}

      {/* ── Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {([
          { key: 'detalle',   label: 'Detalle'           },
          { key: 'consumo',   label: 'Distribución'      },
          { key: 'tendencia', label: 'Tendencia / Prev.' },
          { key: 'resumen',   label: 'Resumen'           },
        ] as { key: typeof tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === t.key ? '#1B3FCC' : '#fff',
            color:      tab === t.key ? '#fff'    : '#374151',
            boxShadow:  tab === t.key ? '0 2px 8px rgba(27,63,204,0.25)' : '0 1px 3px rgba(0,0,0,0.08)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: DETALLE
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'detalle' && (
        <div className="cp-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.04)' }}>
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
            <div ref={colMenuRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowColMenu(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: showColMenu ? '#1B3FCC' : '#fff',
                color: showColMenu ? '#fff' : '#374151',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                <Columns size={13} /> Columnas
                <span style={{ fontSize: 10, fontWeight: 700, background: showColMenu ? 'rgba(255,255,255,0.25)' : '#1B3FCC18', color: showColMenu ? '#fff' : '#1B3FCC', padding: '1px 5px', borderRadius: 99 }}>
                  {visibleCols.size}/{ALL_COLS.length}
                </span>
              </button>
              {showColMenu && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 4px', minWidth: 220 }}>
                  <div style={{ padding: '4px 12px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Columnas</span>
                      <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0 0' }}>Arrastra para reordenar</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setVisibleCols(new Set(ALL_COLS.map(c => c.key)))} style={{ fontSize: 10, color: '#1B3FCC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Todas</button>
                      <button onClick={() => setColOrder(ALL_COLS.map(c => c.key))} style={{ fontSize: 10, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reset orden</button>
                    </div>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '4px 8px 6px' }} />
                  {colOrder.map((key, idx) => {
                    const col      = ALL_COLS.find(c => c.key === key)!
                    const checked  = visibleCols.has(key)
                    const isTarget = dragOverIdx === idx
                    const fromAbove = isTarget && dragItemIdx.current !== null && dragItemIdx.current > idx
                    const fromBelow = isTarget && dragItemIdx.current !== null && dragItemIdx.current < idx
                    return (
                      <div key={key} draggable
                        onDragStart={() => handleDragStart(idx)} onDragOver={e => handleDragOver(e, idx)}
                        onDragLeave={() => setDragOverIdx(null)} onDrop={e => handleDrop(e, idx)} onDragEnd={handleDragEnd}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, margin: '1px 4px', background: isTarget ? '#EFF6FF' : 'transparent', borderTop: fromAbove ? '2px solid #1B3FCC' : '2px solid transparent', borderBottom: fromBelow ? '2px solid #1B3FCC' : '2px solid transparent', opacity: dragItemIdx.current === idx ? 0.35 : 1, cursor: 'grab', transition: 'background 0.1s', userSelect: 'none' }}>
                        <span style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1, flexShrink: 0 }}>⠿</span>
                        <input type="checkbox" checked={checked}
                          onChange={e => { e.stopPropagation(); setVisibleCols(prev => { const next = new Set(prev); if (next.has(key)) { if (next.size > 1) next.delete(key) } else next.add(key); return next }) }}
                          onClick={e => e.stopPropagation()}
                          style={{ accentColor: '#1B3FCC', width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 13, color: checked ? '#0f172a' : '#94a3b8', fontWeight: checked ? 600 : 400, flex: 1 }}>{col.label}</span>
                        <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 700, minWidth: 16, textAlign: 'right' }}>{idx + 1}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {list && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{list.total.toLocaleString('es-MX')} registros</span>}
          </div>

          {loadingList ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Cargando…</div>
          ) : list && list.rows.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {colOrder.filter(k => visibleCols.has(k)).map(k => {
                      const col    = ALL_COLS.find(c => c.key === k)!
                      const isNum  = ['minutosIncl','minutosConsum','pctConsumo','monto'].includes(k)
                      const noSort = k === 'cid' || k === 'eventos'
                      const active = sortBy === k
                      const SortIcon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                      return (
                        <th key={k} onClick={() => handleSort(k as ColKey)} style={{ padding: '10px 10px', textAlign: isNum ? 'right' : 'left', fontWeight: 700, color: active ? '#1B3FCC' : '#374151', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap', fontSize: 11, cursor: noSort ? 'default' : 'pointer', userSelect: 'none', background: active ? '#EFF6FF' : undefined }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {col.label}
                            {!noSort && <SortIcon size={11} style={{ color: active ? '#1B3FCC' : '#cbd5e1', flexShrink: 0 }} />}
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {colOrder.filter(k => visibleCols.has(k)).map(k => {
                        if (k === 'cid')          return <td key={k} style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>{r.cid}</td>
                        if (k === 'cliente')       return <td key={k} style={{ padding: '8px 10px', fontWeight: 600, color: '#fff', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.cliente}</td>
                        if (k === 'periodo')       return <td key={k} style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', fontSize: 11 }}>{r.periodo}</td>
                        if (k === 'plan')          return <td key={k} style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.75)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.plan}>{r.plan}</td>
                        if (k === 'minutosIncl')   return <td key={k} style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.75)', textAlign: 'right' }}>{r.minutosIncl.toLocaleString()}</td>
                        if (k === 'minutosConsum') return <td key={k} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: r.minutosConsum === 0 ? '#ef4444' : '#0f172a' }}>{r.minutosConsum.toLocaleString()}</td>
                        if (k === 'pctConsumo')    return <td key={k} style={{ padding: '8px 10px', textAlign: 'right' }}><span style={{ fontWeight: 700, color: pctColor(r.pctConsumo) }}>{r.pctConsumo.toFixed(1)}%</span></td>
                        if (k === 'monto')         return <td key={k} style={{ padding: '8px 10px', fontWeight: 700, color: '#1B3FCC', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt$(r.monto)}</td>
                        if (k === 'clasificacion') return <td key={k} style={{ padding: '8px 10px' }}><span style={getBadgeSt(r.clasificacion, CLAS_COLOR)}>{r.clasificacion || '—'}</span></td>
                        if (k === 'uso')           return <td key={k} style={{ padding: '8px 10px' }}><span style={getBadgeSt(r.usoPrincipal, USO_COLOR)}>{r.usoPrincipal || '—'}</span></td>
                        if (k === 'eventos')       return <td key={k} style={{ padding: '8px 10px', textAlign: 'center' }}>{r.eventosAnal === 'Si' ? <CheckCircle size={13} style={{ color: '#22c55e' }} /> : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}</td>
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
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Página {page} de {totalPages}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft size={13} /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + idx
                  return <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: p === page ? '#1B3FCC' : '#fff', color: p === page ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: p === page ? 700 : 400 }}>{p}</button>
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}><ChevronRight size={13} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: DISTRIBUCIÓN
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'consumo' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Histograma — ancho completo */}
          <div style={{ ...DC, gridColumn: '1 / -1' }}>
            <p style={DT}>Distribución por % de Consumo</p>
            <p style={DS}>Cuántos cortes caen en cada rango de uso de minutos incluidos</p>
            {(() => {
              const maxZ  = Math.max(...Object.values(stats.zonas), 1)
              const total = Object.values(stats.zonas).reduce((s, n) => s + n, 0) || 1
              const H = 180
              return (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: H + 56, paddingBottom: 0 }}>
                  {Object.entries(stats.zonas).map(([zona, n]) => {
                    const h     = Math.max(6, Math.round((n / maxZ) * H))
                    const pct   = ((n / total) * 100).toFixed(1)
                    const color = ZONA_COLORS[zona] ?? '#94a3b8'
                    return (
                      <div key={zona} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>{n.toLocaleString()}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{pct}%</span>
                        <div style={{ width: '68%', height: h, background: `linear-gradient(180deg,${color},${color}99)`, borderRadius: '6px 6px 0 0', transition: 'height 0.5s', boxShadow: `0 6px 20px ${color}45`, minHeight: 6 }} title={`${zona}: ${n}`} />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>{zona}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Alertas */}
          <div style={DC}>
            <p style={DT}>Alertas de Consumo</p>
            <p style={DS}>Rangos críticos de atención</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Sin consumo (0 min)',      n: stats.zonas['0%']     ?? 0, color: '#F87171', desc: 'Clientes sin ninguna llamada' },
                { label: 'Consumo muy bajo (1-20%)', n: stats.zonas['1-20%'] ?? 0, color: '#FB923C', desc: 'Uso mínimo del plan' },
                { label: 'Exceden su plan (>100%)',  n: stats.zonas['>100%'] ?? 0, color: '#818CF8', desc: 'Candidatos a upgrade' },
              ].map(({ label, n, color, desc }) => (
                <div key={label} style={{ padding: '12px 14px', borderRadius: 10, background: color + '14', border: `1px solid ${color}28` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color }}>{label}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{desc}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{n.toLocaleString()}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{stats.total ? ((n / stats.total) * 100).toFixed(1) : 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eventos */}
          <div style={DC}>
            <p style={DT}>Eventos Analizados</p>
            <p style={DS}>Cobertura de análisis de llamadas</p>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Con eventos', n: stats.conEventos,                color: '#4ADE80', icon: CheckCircle },
                { label: 'Sin eventos', n: stats.total - stats.conEventos,  color: '#475569', icon: AlertTriangle },
              ].map(({ label, n, color, icon: Icon }) => (
                <div key={label} style={{ flex: 1, padding: '16px', borderRadius: 10, background: color + '14', border: `1px solid ${color}25`, textAlign: 'center' }}>
                  <Icon size={20} style={{ color, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{n.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>{label}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{stats.total ? ((n / stats.total) * 100).toFixed(1) : 0}%</p>
                </div>
              ))}
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${stats.total ? (stats.conEventos / stats.total) * 100 : 0}%`, height: '100%', background: '#4ADE80', borderRadius: 99, boxShadow: '0 0 12px #4ADE8055', transition: 'width 0.6s' }} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: TENDENCIA / PREVISIÓN
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'tendencia' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Dos gráficas lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Monto por mes */}
            <div style={DC}>
              <p style={DT}>Monto Total por Mes de Corte</p>
              <p style={DS}>Evolución histórica · {mesTendencia.length} periodos</p>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 220, overflowX: 'auto', paddingBottom: 2 }}>
                {mesTendencia.map(([mes, v], idx) => {
                  const h      = Math.max(6, Math.round((v.monto / maxMonto) * 170))
                  const isLast = idx === mesTendencia.length - 1
                  return (
                    <div key={mes} style={{ minWidth: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 8, color: isLast ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: 700, textAlign: 'center' }}>{fmtK(v.monto)}</span>
                      <div style={{ width: 34, height: h, background: isLast ? '#60A5FA' : 'rgba(96,165,250,0.3)', borderRadius: '4px 4px 0 0', boxShadow: isLast ? '0 4px 18px rgba(96,165,250,0.45)' : undefined, transition: 'height 0.4s' }} title={`${fmtMes(mes)}: ${fmt$(v.monto)}`} />
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', textAlign: 'center', whiteSpace: 'nowrap' }}>{fmtMes(mes)}</span>
                      <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.22)' }}>{v.count}</span>
                    </div>
                  )
                })}
                {forecast && (
                  <div style={{ minWidth: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 8, color: '#818CF8', fontWeight: 700, textAlign: 'center' }}>{fmtK(forecast.monto)}</span>
                    <div style={{ width: 34, height: Math.max(6, Math.round((forecast.monto / maxMonto) * 170)), background: 'transparent', borderRadius: '4px 4px 0 0', border: '2px dashed #818CF8' }} title={`Proyección: ${fmt$(forecast.monto)}`} />
                    <span style={{ fontSize: 8, color: '#818CF8', fontWeight: 700, whiteSpace: 'nowrap' }}>Proyec.</span>
                    <span style={{ fontSize: 7, color: '#818CF8' }}>{Math.round(forecast.count)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Consumo % por mes */}
            <div style={DC}>
              <p style={DT}>Consumo Promedio % por Mes</p>
              <p style={DS}>Comportamiento de uso de minutos incluidos</p>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 220, overflowX: 'auto', paddingBottom: 2 }}>
                {mesTendencia.map(([mes, v], idx) => {
                  const avgC   = v.count ? v.consumo / v.count : 0
                  const h      = Math.max(6, Math.round((Math.min(avgC, 150) / 150) * 170))
                  const isLast = idx === mesTendencia.length - 1
                  const color  = pctColorD(avgC)
                  return (
                    <div key={mes} style={{ minWidth: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 8, color: isLast ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{avgC.toFixed(0)}%</span>
                      <div style={{ width: 34, height: h, background: isLast ? color : color + '55', borderRadius: '4px 4px 0 0', boxShadow: isLast ? `0 4px 18px ${color}50` : undefined, transition: 'height 0.4s' }} title={`${fmtMes(mes)}: ${avgC.toFixed(1)}%`} />
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap' }}>{fmtMes(mes)}</span>
                    </div>
                  )
                })}
                {forecast && (
                  <div style={{ minWidth: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 8, color: '#818CF8', fontWeight: 700 }}>{forecast.consumo.toFixed(0)}%</span>
                    <div style={{ width: 34, height: Math.max(6, Math.round((Math.min(forecast.consumo, 150) / 150) * 170)), background: 'transparent', borderRadius: '4px 4px 0 0', border: '2px dashed #818CF8' }} />
                    <span style={{ fontSize: 8, color: '#818CF8', fontWeight: 700 }}>Proy.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card previsión */}
          {forecast && (
            <div style={{ ...DC, background: 'linear-gradient(135deg, #0D1829 55%, #1e1b4b 100%)', border: '1px solid rgba(129,140,248,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <TrendingUp size={16} style={{ color: '#818CF8' }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  Previsión próximo corte — promedio móvil {Math.min(mesTendencia.length, 3)} meses
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { label: 'Monto proyectado',   value: fmt$(forecast.monto),                     color: '#818CF8' },
                  { label: 'Cortes esperados',   value: Math.round(forecast.count).toLocaleString(), color: '#60A5FA' },
                  { label: 'Consumo proyectado', value: `${forecast.consumo.toFixed(1)}%`,          color: pctColorD(forecast.consumo) },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: `1px solid ${color}30` }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label}</p>
                    <p style={{ fontSize: 26, fontWeight: 800, color }}>{value}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 16 }}>
                * Basado en promedio de los últimos {Math.min(mesTendencia.length, 3)} meses. No considera estacionalidad ni eventos especiales.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: RESUMEN — gráficas verticales con dark cards
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'resumen' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Top Planes — Monto */}
          <div style={DC}>
            <p style={DT}>Top Planes — Monto Total</p>
            <p style={DS}>Por ingresos acumulados en el periodo</p>
            <VBarChart
              height={170}
              fmtVal={fmtK}
              entries={Object.entries(stats.byPlan)
                .sort((a, b) => b[1].monto - a[1].monto)
                .slice(0, 10)
                .map(([plan, v], i) => ({ label: shortPlan(plan), value: v.monto, color: PLAN_COLORS[i], sub: `${v.count}` }))}
            />
          </div>

          {/* Clasificación de Empresa */}
          <div style={DC}>
            <p style={DT}>Clasificación de Empresa</p>
            <p style={DS}>Distribución de cortes por segmento</p>
            <VBarChart
              height={170}
              entries={Object.entries(stats.byClas)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([clas, v]) => ({ label: clas || '—', value: v.count, color: CLAS_COLOR_D[clas] ?? '#94A3B8', sub: fmtK(v.monto) }))}
            />
          </div>

          {/* Uso Principal */}
          <div style={DC}>
            <p style={DT}>Uso Principal de Llamadas</p>
            <p style={DS}>Distribución por tipo de tráfico</p>
            {(() => {
              const total = Object.values(stats.byUso).reduce((s, n) => s + n, 0) || 1
              return (
                <VBarChart
                  height={170}
                  entries={Object.entries(stats.byUso)
                    .sort((a, b) => b[1] - a[1])
                    .map(([uso, n]) => ({
                      label: uso ? uso.charAt(0).toUpperCase() + uso.slice(1) : '—',
                      value: n,
                      color: USO_COLOR_D[uso] ?? '#94A3B8',
                      sub:   `${((n / total) * 100).toFixed(1)}%`,
                    }))}
                />
              )
            })()}
          </div>

          {/* Consumo Promedio por Plan */}
          <div style={DC}>
            <p style={DT}>Consumo Promedio por Plan</p>
            <p style={DS}>Top planes por % de uso vs. minutos incluidos</p>
            <VBarChart
              height={170}
              fmtVal={n => n.toFixed(0) + '%'}
              entries={Object.entries(stats.byPlan)
                .map(([plan, v]) => ({ plan, avg: v.count ? v.consumo / v.count : 0, count: v.count }))
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 8)
                .map(({ plan, avg, count }) => ({ label: shortPlan(plan), value: avg, color: pctColorD(avg), sub: `${count}` }))}
            />
          </div>
        </div>
      )}
    </div>
  )
}
