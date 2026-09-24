'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  BarChart2, Clock, MousePointerClick, TrendingUp, Search,
  ChevronDown, ChevronLeft, ChevronRight, Calendar, Users,
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
const MESES_LARGOS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
/** La rejilla del calendario empieza en lunes: así se lee una semana de trabajo. */
const DIAS_CAL = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

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

  /* Calendario por mes. La vista por día de la SEMANA dice que los martes son
     el pico, pero no dice QUÉ martes — ni cuántos días del mes no se abrió el
     tablero, que es justo lo que no se veía: Claudia tiene actividad en 15 de
     los 24 días del rango, o sea 9 días en blanco que ninguna otra vista
     muestra. Aquí cada día del mes aparece, con actividad o sin ella. */
  const meses = Array.from(new Set(Object.keys(byDate).map(d => d.slice(0, 7)))).sort()
  const calendario = meses.map(mes => {
    const [anio, m] = mes.split('-').map(Number)
    const diasEnMes = new Date(anio, m, 0).getDate()
    // getDay() da 0 para domingo; la rejilla empieza en lunes, que es como se
    // lee una semana de trabajo.
    const primero = (new Date(anio, m - 1, 1).getDay() + 6) % 7
    const dias = Array.from({ length: diasEnMes }, (_, i) => {
      const fecha = `${mes}-${String(i + 1).padStart(2, '0')}`
      return { dia: i + 1, fecha, visitas: byDate[fecha] ?? 0 }
    })
    const conUso = dias.filter(d => d.visitas > 0).length
    return {
      mes, anio, etiqueta: `${MESES_LARGOS[m - 1]} ${anio}`,
      huecoInicial: primero, dias,
      maxDia: Math.max(0, ...dias.map(d => d.visitas)),
      totalMes: dias.reduce((s, d) => s + d.visitas, 0),
      conUso, sinUso: diasEnMes - conUso, diasEnMes,
    }
  })

  return {
    calendario,
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
  /** El correo que se consultó. Es lo único que siempre se tiene: el usuario
   *  seleccionado puede faltar si se buscó tecleando, y sin esto no había
   *  forma de titular el reporte ni el aviso de «sin registros». */
  const [buscado,   setBuscado]   = useState('')
  /** Mes visible del calendario. Uno solo a la vez: apilar todos los meses
   *  convertía la pantalla en un rollo que crece cada mes que pasa. */
  const [mesIdx,    setMesIdx]    = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [open,      setOpen]      = useState(false)

  // Cargar lista de usuarios al montar
  useEffect(() => {
    // `/api/admin/usuarios` devuelve un ARREGLO, no `{ usuarios: [...] }`.
    // Leer `d.usuarios` daba siempre undefined, así que el combo «Elegir
    // usuario…» salía vacío SIEMPRE — y como no fallaba, no había error que
    // mirar. Se aceptan las dos formas por si la ruta cambia algún día.
    fetch('/api/admin/usuarios')
      .then(r => r.ok ? r.json() : [])
      .then(d => setUsuarios(Array.isArray(d) ? d : (d?.usuarios ?? [])))
      .catch(() => {})
  }, [])

  async function loadUsage(email: string) {
    if (!email) return
    setLoading(true)
    setError('')
    setRows([])
    setBuscado(email)
    try {
      const res = await fetch(`/api/analytics/uso?email=${encodeURIComponent(email)}`)
      if (!res.ok) {
        // El motivo REAL, no «No se pudo cargar los datos». Un 403 por permisos
        // y un 500 de base se arreglan de forma distinta, y con el mensaje
        // genérico había que adivinar cuál era. Esta pantalla ya estuvo muda
        // una vez; que al menos diga qué la calló.
        let detalle = ''
        try {
          const j = await res.json()
          detalle = j?.error ? ` — ${j.error}` : ''
        } catch { /* la respuesta no era JSON */ }
        setError(`No se pudo cargar los datos (HTTP ${res.status})${detalle}`)
        return
      }
      const d = await res.json()
      setRows(Array.isArray(d) ? d : (d?.rows ?? []))
    } catch (e) {
      setError(`Error de conexión: ${e instanceof Error ? e.message : String(e)}`)
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

  /* Al cambiar de usuario se abre en su mes MÁS RECIENTE, que es el que
     interesa. Y se clampa: si el usuario nuevo tiene menos meses que el
     anterior, un índice heredado apuntaría fuera del arreglo. */
  const totalMeses = stats?.calendario.length ?? 0
  useEffect(() => { setMesIdx(Math.max(0, totalMeses - 1)) }, [totalMeses, buscado])
  const mesActual = stats?.calendario[Math.min(mesIdx, totalMeses - 1)] ?? null

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
          {/* Dropdown de usuarios.
              `cp-light` va en este contenedor y cubre de una vez el botón y el
              menú: los dos son islas BLANCAS dentro de la `.cp-card` de arriba,
              y sin la clase de escape globals.css pinta de blanco sus <span> y
              sus <p>/.text-textHi. El combo se veía vacío —solo el chevron— y
              la lista de asesores salía en blanco sobre blanco. */}
          <div className="relative cp-light" style={{ color: '#0F172A' }}>
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
      {/* El aviso de «sin registros» ya NO exige `selected`. Cuando el correo
          se teclea a mano —que es justo lo que hay que hacer si el combo viene
          vacío— `selected` se queda en null, así que no salía ni el reporte ni
          este mensaje: la pantalla quedaba muda, sin siquiera un «no hay
          datos». Ahora basta con haber buscado algo. */}
      {!loading && !error && rows.length === 0 && buscado && (
        <div className="cp-card p-10 text-center text-textMid text-sm">
          Sin registros de uso para <strong>{selected?.nombre ?? buscado}</strong>.
          El tracking comienza a registrarse a partir de esta versión del dashboard.
        </div>
      )}

      {/* ── Reporte ─────────────────────────────────────────────── */}
      {/* Antes exigía `selected` y por eso no pintaba nada al buscar por
          correo. Lo que de verdad hace falta son los datos; el usuario
          seleccionado solo aporta el nombre y el color, y ambos tienen
          alternativa. */}
      {stats && (
        <>
          {/* Header del asesor */}
          <div className="cp-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ background: asesorColor }}>
              {(selected?.nombre ?? buscado).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {/* Si se buscó por correo y ese correo no está en `usuarios` —el
                  caso de Aurora, que sí tiene 19 registros de uso—, el nombre
                  no existe. Se muestra el correo, que es el dato que sí hay. */}
              <p className="text-base font-bold text-textHi">{selected?.nombre ?? buscado}</p>
              <p className="text-xs text-textMid">{selected?.email ?? buscado}</p>
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

          {/* ── Calendario por mes ─────────────────────────────────────────
               La vista por día de la SEMANA dice que los martes son el pico,
               pero no dice QUÉ martes, ni cuántos días del mes no se abrió el
               tablero. Eso último es lo que no se veía por ningún lado: un mes
               con 15 días de uso y 15 en blanco se lee igual que uno de uso
               diario si solo se miran los promedios. */}
          {mesActual && (
            <div className="cp-card p-5">
              {/* Navegación: un mes a la vez, no la pila entera. */}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-blue-600 flex-shrink-0" />
                  <button
                    type="button"
                    onClick={() => setMesIdx(i => Math.max(0, i - 1))}
                    disabled={mesIdx <= 0}
                    title="Mes anterior"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity
                      disabled:opacity-25 disabled:cursor-not-allowed hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <p className="text-sm font-bold text-textHi min-w-[128px] text-center">
                    {mesActual.etiqueta}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMesIdx(i => Math.min(totalMeses - 1, i + 1))}
                    disabled={mesIdx >= totalMeses - 1}
                    title="Mes siguiente"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity
                      disabled:opacity-25 disabled:cursor-not-allowed hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
                  >
                    <ChevronRight size={15} />
                  </button>
                  {totalMeses > 1 && (
                    <span className="text-[11px] text-textMid ml-1">
                      {mesIdx + 1} de {totalMeses}
                    </span>
                  )}
                </div>
                <p className="text-xs text-textMid">
                  <strong className="text-textHi">{mesActual.totalMes}</strong> visitas ·{' '}
                  <strong className="text-textHi">{mesActual.conUso}</strong> días con uso ·{' '}
                  <strong className="text-textHi">{mesActual.sinUso}</strong> sin abrir
                </p>
              </div>

              {/* Salto directo. Cada ficha lleva su total, así se ve de un
                  vistazo dónde hubo actividad sin tener que recorrer mes a mes.
                  Solo aparece cuando hay más de uno que elegir. */}
              {totalMeses > 1 && (
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {stats.calendario.map((c, i) => (
                    <button
                      key={c.mes}
                      type="button"
                      onClick={() => setMesIdx(i)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-80"
                      style={i === mesIdx
                        ? { background: '#1B3FCC', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)' }}
                    >
                      {MESES[Number(c.mes.slice(5, 7)) - 1]} · {c.totalMes}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                {DIAS_CAL.map((d, i) => (
                  <span key={i} className="text-center text-[10px] font-bold text-textMid">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: mesActual.huecoInicial }, (_, i) => <div key={`h${i}`} />)}
                {mesActual.dias.map(d => {
                  const intensidad = mesActual.maxDia > 0 ? d.visitas / mesActual.maxDia : 0
                  return (
                    /* `cp-light` para que los <span> HEREDEN el color de la
                       baldosa: dentro de una .cp-card el CSS global los pinta
                       blancos y en las casillas claras el número desaparecía.
                       Es el mismo motivo que en la rejilla de días de semana. */
                    <div
                      key={d.fecha}
                      title={`${d.fecha} — ${d.visitas} visita${d.visitas === 1 ? '' : 's'}`}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center cp-light"
                      style={{
                        background: d.visitas > 0 ? heatColor(d.visitas, mesActual.maxDia) : 'rgba(255,255,255,0.04)',
                        color: d.visitas === 0 ? 'rgba(255,255,255,0.35)'
                          : intensidad >= 0.5 ? '#fff' : '#1E293B',
                        border: d.visitas === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      }}
                    >
                      <span className="text-[11px] font-bold leading-none">{d.dia}</span>
                      {d.visitas > 0 && (
                        <span className="text-[9px] mt-0.5 opacity-85 leading-none">{d.visitas}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <p className="text-[11px] text-textMid mt-3">
                El número grande es el día del mes; el pequeño, sus visitas. Las casillas
                apagadas son días en que nadie abrió el tablero.
              </p>
            </div>
          )}

          {/* Heatmap por día de semana */}
          <div className="cp-card p-5">
            <p className="text-sm font-bold text-textHi mb-4 flex items-center gap-2">
              <Calendar size={15} className="text-blue-600" />
              Distribución por día de la semana
            </p>
            <div className="grid grid-cols-7 gap-2">
              {DIAS.map((d, i) => (
                <div key={d} className="flex flex-col items-center gap-1.5">
                  {/* `cp-light` para que los <span> de dentro HEREDEN el color
                      de la baldosa en vez de que globals.css los pinte blancos:
                      en las casillas de valor bajo el fondo es claro y el
                      número desaparecía. El ternario ya resuelve las dos
                      direcciones — solo hacía falta dejarlo llegar. */}
                  <div
                    className="w-full aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold cp-light"
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
                {/* Islas claras dentro de la tarjeta oscura: sin `cp-light`,
                    `.cp-card p` y los tokens `.text-textHi/.text-textMid` se
                    fuerzan a blanco y estos dos bloques salen en blanco sobre
                    azul/gris muy claro. */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cp-light" style={{ color: '#0F172A' }}>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <p className="font-semibold text-textHi">Día con más actividad</p>
                    <p className="text-textMid">{fmtFecha(stats.topDay)} — {stats.topDayCount} visitas</p>
                  </div>
                </div>
                {stats.lowDay && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cp-light" style={{ color: '#0F172A' }}>
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
