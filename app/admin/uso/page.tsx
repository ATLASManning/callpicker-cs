'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  BarChart2, Clock, MousePointerClick, TrendingUp, Search,
  ChevronDown, Calendar, Users,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { ASESOR_CONFIG } from '@/lib/types'

// ── Tipos ────────────────────────────────────────────────────────────────────
type Row = {
  id: string
  email: string
  asesor: string
  ruta: string
  seccion: string
  duracion_seg: number | null
  created_at: string
}

type UsuarioMin = { email: string; nombre: string; asesor_nombre: string | null; rol: string }

// ── Helpers ──────────────────────────────────────────────────────────────────
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtDuracion(segs: number): string {
  if (segs < 60)  return `${segs}s`
  if (segs < 3600) return `${Math.floor(segs / 60)}m ${segs % 60}s`
  return `${Math.floor(segs / 3600)}h ${Math.floor((segs % 3600) / 60)}m`
}

function fmtFecha(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

function heatColor(val: number, max: number): string {
  if (max === 0 || val === 0) return '#F1F5F9'
  const pct = val / max
  if (pct >= 0.75) return '#1B3FCC'
  if (pct >= 0.5)  return '#3B5FDD'
  if (pct >= 0.25) return '#7B95EE'
  return '#C7D2F8'
}

// ── Aggregation ──────────────────────────────────────────────────────────────
function aggregate(rows: Row[]) {
  const bySection:  Record<string, { visits: number; total_seg: number }> = {}
  const byDow:      number[] = new Array(7).fill(0)
  const byHour:     number[] = new Array(24).fill(0)
  const byDate:     Record<string, number> = {}
  let totalSeg = 0
  let withDuration = 0

  for (const r of rows) {
    const sec = r.seccion || r.ruta
    if (!bySection[sec]) bySection[sec] = { visits: 0, total_seg: 0 }
    bySection[sec].visits++
    if (r.duracion_seg) {
      bySection[sec].total_seg += r.duracion_seg
      totalSeg += r.duracion_seg
      withDuration++
    }

    const d = new Date(r.created_at)
    byDow[d.getDay()]++
    byHour[d.getHours()]++
    const dateKey = d.toISOString().slice(0, 10)
    byDate[dateKey] = (byDate[dateKey] ?? 0) + 1
  }

  const sectionList = Object.entries(bySection)
    .map(([name, v]) => ({ name, ...v, avg_seg: v.visits ? Math.round(v.total_seg / v.visits) : 0 }))
    .sort((a, b) => b.visits - a.visits)

  const maxDow  = Math.max(...byDow)
  const maxHour = Math.max(...byHour)

  const dateEntries = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))
  const topDay   = dateEntries.reduce((m, e) => e[1] > m[1] ? e : m, ['', 0] as [string, number])
  const lowDay   = dateEntries.reduce((m, e) => e[1] < m[1] ? e : m, ['', Infinity] as [string, number])

  // Día de la semana más/menos activo
  const topDow  = byDow.indexOf(Math.max(...byDow))
  const lowDow  = byDow.indexOf(Math.min(...byDow.filter(v => v > 0)))

  // % de visitas por día de semana
  const total = rows.length
  const dowPct = byDow.map(v => total > 0 ? Math.round((v / total) * 100) : 0)

  return {
    sectionList, byDow, byHour, dowPct,
    maxDow, maxHour, totalSeg, withDuration,
    topDow, lowDow,
    topDay: topDay[0], topDayCount: topDay[1],
    lowDay: lowDay[0] === '' ? null : lowDay[0],
    avgSeg: withDuration > 0 ? Math.round(totalSeg / withDuration) : 0,
  }
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string; sub?: string
}) {
  return (
    <div className="cp-card p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-blue-600" />
      </div>
      <div>
        <p className="text-xs text-textMid font-medium">{label}</p>
        <p className="text-xl font-bold text-textHi mt-0.5">{value}</p>
        {sub && <p className="text-xs text-textMid mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsoDashboardPage() {
  const [usuarios,  setUsuarios]  = useState<UsuarioMin[]>([])
  const [selected,  setSelected]  = useState<UsuarioMin | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [rows,      setRows]      = useState<Row[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [open,      setOpen]      = useState(false)

  // Cargar lista de usuarios al montar
  useEffect(() => {
    fetch('/api/admin/usuarios')
      .then(r => r.ok ? r.json() : { usuarios: [] })
      .then(d => setUsuarios(d.usuarios ?? []))
      .catch(() => {})
  }, [])

  async function loadUsage(email: string) {
    if (!email) return
    setLoading(true)
    setError('')
    setRows([])
    try {
      const res = await fetch(`/api/analytics/uso?email=${encodeURIComponent(email)}`)
      if (!res.ok) { setError('No se pudo cargar los datos'); return }
      const d = await res.json()
      setRows(d.rows ?? [])
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function selectUser(u: UsuarioMin) {
    setSelected(u)
    setEmailInput(u.email)
    setOpen(false)
    loadUsage(u.email)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const u = usuarios.find(x => x.email.toLowerCase() === emailInput.toLowerCase().trim())
    setSelected(u ?? null)
    loadUsage(emailInput.trim())
  }

  const stats = useMemo(() => rows.length > 0 ? aggregate(rows) : null, [rows])

  const asesorColor = selected?.asesor_nombre
    ? ASESOR_CONFIG[selected.asesor_nombre as keyof typeof ASESOR_CONFIG]?.color ?? '#1B3FCC'
    : '#1B3FCC'

  const firstDate = rows[0]?.created_at
  const lastDate  = rows[rows.length - 1]?.created_at

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Uso del Dashboard"
        subtitle="Analítica de navegación por asesor"
      />

      {/* ── Selector ───────────────────────────────────────────── */}
      <div className="cp-card p-5">
        <p className="text-sm font-semibold text-textHi mb-3 flex items-center gap-2">
          <Users size={15} className="text-blue-600" />
          Seleccionar asesor / usuario
        </p>
        <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
          {/* Dropdown de usuarios */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors min-w-[200px]"
            >
              {selected ? (
                <>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: asesorColor }} />
                  <span className="flex-1 text-left truncate">{selected.nombre}</span>
                </>
              ) : (
                <span className="flex-1 text-left text-gray-400">Elegir usuario...</span>
              )}
              <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
            </button>
            {open && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 max-h-64 overflow-y-auto">
                {usuarios.map(u => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => selectUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: ASESOR_CONFIG[u.asesor_nombre as keyof typeof ASESOR_CONFIG]?.color ?? '#6B7280' }}>
                      {u.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-textHi">{u.nombre}</p>
                      <p className="text-xs text-textMid">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* O ingresar email directo */}
          <div className="flex items-center gap-2 text-sm text-textMid">— o —</div>
          <div className="flex gap-2 flex-1 min-w-[280px]">
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="correo@callpicker.com"
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={!emailInput || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Search size={14} />
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* ── Estado ─────────────────────────────────────────────── */}
      {loading && (
        <div className="cp-card p-10 text-center text-textMid text-sm">Cargando datos...</div>
      )}
      {error && (
        <div className="cp-card p-5 text-sm text-red-600 font-medium">{error}</div>
      )}
      {!loading && !error && rows.length === 0 && selected && (
        <div className="cp-card p-10 text-center text-textMid text-sm">
          Sin registros de uso para <strong>{selected.nombre}</strong>.
          El tracking comienza a registrarse a partir de esta versión del dashboard.
        </div>
      )}

      {/* ── Reporte ─────────────────────────────────────────────── */}
      {stats && selected && (
        <>
          {/* Header del asesor */}
          <div className="cp-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ background: asesorColor }}>
              {selected.nombre.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-textHi">{selected.nombre}</p>
              <p className="text-xs text-textMid">{selected.email}</p>
            </div>
            {firstDate && (
              <div className="text-right text-xs text-textMid">
                <p>Primer acceso: <strong>{fmtFecha(firstDate)}</strong></p>
                <p>Último acceso: <strong>{fmtFecha(lastDate)}</strong></p>
              </div>
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={MousePointerClick}
              label="Total de visitas"
              value={rows.length.toString()}
              sub={`${stats.sectionList.length} secciones distintas`}
            />
            <KpiCard
              icon={Clock}
              label="Tiempo total"
              value={fmtDuracion(stats.totalSeg)}
              sub={`Promedio por visita: ${fmtDuracion(stats.avgSeg)}`}
            />
            <KpiCard
              icon={TrendingUp}
              label="Día más activo"
              value={DIAS[stats.topDow]}
              sub={`${stats.byDow[stats.topDow]} visitas (${stats.dowPct[stats.topDow]}% del total)`}
            />
            <KpiCard
              icon={Calendar}
              label="Día menos activo"
              value={stats.lowDow >= 0 ? DIAS[stats.lowDow] : '—'}
              sub={stats.lowDow >= 0 ? `${stats.byDow[stats.lowDow]} visitas (${stats.dowPct[stats.lowDow]}%)` : ''}
            />
          </div>

          {/* Secciones más visitadas */}
          <div className="cp-card p-5">
            <p className="text-sm font-bold text-textHi mb-4 flex items-center gap-2">
              <BarChart2 size={15} className="text-blue-600" />
              Secciones más visitadas
            </p>
            <div className="space-y-2">
              {stats.sectionList.map((s, i) => {
                const pct = rows.length > 0 ? (s.visits / rows.length) * 100 : 0
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-textMid text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-textHi">{s.name}</span>
                        <span className="text-xs text-textMid">
                          {s.visits} visitas · {fmtDuracion(s.avg_seg)} prom.
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: asesorColor }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-xs font-semibold text-textMid text-right">
                      {Math.round(pct)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Heatmap por día de semana */}
          <div className="cp-card p-5">
            <p className="text-sm font-bold text-textHi mb-4 flex items-center gap-2">
              <Calendar size={15} className="text-blue-600" />
              Distribución por día de la semana
            </p>
            <div className="grid grid-cols-7 gap-2">
              {DIAS.map((d, i) => (
                <div key={d} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-full aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold"
                    style={{
                      background: heatColor(stats.byDow[i], stats.maxDow),
                      color: stats.byDow[i] / stats.maxDow >= 0.5 ? '#fff' : '#1E293B',
                    }}
                  >
                    <span className="text-base leading-none">{stats.byDow[i]}</span>
                    <span className="text-[10px] mt-0.5 opacity-80">{stats.dowPct[i]}%</span>
                  </div>
                  <span className="text-xs font-semibold text-textMid">{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap por hora */}
          <div className="cp-card p-5">
            <p className="text-sm font-bold text-textHi mb-4 flex items-center gap-2">
              <Clock size={15} className="text-blue-600" />
              Distribución por hora del día
            </p>
            <div className="grid grid-cols-12 gap-1.5 mb-1">
              {stats.byHour.slice(0, 12).map((v, h) => (
                <div key={h} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      background: heatColor(v, stats.maxHour),
                      color: v / stats.maxHour >= 0.5 ? '#fff' : '#1E293B',
                    }}
                  >
                    {v > 0 ? v : '·'}
                  </div>
                  <span className="text-[10px] text-textMid">{h}h</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-12 gap-1.5">
              {stats.byHour.slice(12).map((v, i) => {
                const h = i + 12
                return (
                  <div key={h} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        background: heatColor(v, stats.maxHour),
                        color: v / stats.maxHour >= 0.5 ? '#fff' : '#1E293B',
                      }}
                    >
                      {v > 0 ? v : '·'}
                    </div>
                    <span className="text-[10px] text-textMid">{h}h</span>
                  </div>
                )
              })}
            </div>
            {/* Leyenda */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[10px] text-textMid">Menos</span>
              {['#F1F5F9', '#C7D2F8', '#7B95EE', '#3B5FDD', '#1B3FCC'].map(c => (
                <div key={c} className="w-5 h-3 rounded" style={{ background: c }} />
              ))}
              <span className="text-[10px] text-textMid">Más</span>
            </div>
          </div>

          {/* Resumen de actividad por fecha */}
          {stats.topDay && (
            <div className="cp-card p-5">
              <p className="text-sm font-bold text-textHi mb-3 flex items-center gap-2">
                <TrendingUp size={15} className="text-blue-600" />
                Pico de actividad
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <p className="font-semibold text-textHi">Día con más actividad</p>
                    <p className="text-textMid">{fmtFecha(stats.topDay)} — {stats.topDayCount} visitas</p>
                  </div>
                </div>
                {stats.lowDay && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-gray-300 flex items-center justify-center text-white">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="font-semibold text-textHi">Día con menos actividad</p>
                      <p className="text-textMid">{fmtFecha(stats.lowDay)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
