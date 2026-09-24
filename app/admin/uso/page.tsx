'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  BarChart2, Clock, MousePointerClick, TrendingUp, Search,
  ChevronDown, ChevronLeft, ChevronRight, Calendar, Users,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { ASESOR_CONFIG } from '@/lib/types'
import { fechaLocal, hoyLocal } from '@/lib/fecha-local'

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
/* ── La jornada que se dibuja dentro de cada día ───────────────────────────
 *
 * 9:00 a 19:00: once barras, una por hora. Es la jornada que se pidió, y la
 * medición la respalda — el 85.9% de las visitas caen dentro.
 *
 * PERO EL 14.1% RESTANTE NO SE TIRA EN SILENCIO. Ahí están las 20:00 (72
 * visitas) y las 21:00 (43), que es cuando José Manuel trabaja. Una gráfica
 * que recorta y no lo dice miente sin avisar, así que la actividad de fuera
 * se cuenta en tres sitios: un punto en la casilla del día, el total en el pie
 * del calendario, y el detalle del día, que sí muestra las 24 horas.
 */
const HORA_INI = 9
const HORA_FIN = 19
const HORAS_JORNADA = Array.from({ length: HORA_FIN - HORA_INI + 1 }, (_, i) => HORA_INI + i)

/* Solo días hábiles. Sábado y domingo suman el 1.5% de las visitas —cero
 * sábados en todo el histórico— así que quitarlos no pierde nada y da 5
 * columnas en vez de 7: justo el sitio que necesita la mini-gráfica dentro de
 * cada casilla. Lo que caiga en fin de semana se reporta aparte, no se borra. */
const DIAS_HABILES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']

/** Las 24 horas, para el detalle de un día. Ahí no se recorta nada. */
const HORAS_DIA = Array.from({ length: 24 }, (_, i) => i)

/* Color de una barra y tinte de la casilla. Los dos valores salen de calcular
 * el contraste, no de elegirlos a ojo.
 *
 * El primer intento tenía la relación INVERTIDA: la casilla se tiñe más cuanto
 * más activo es el día, así que la barra azul #4A6FDF se separaba peor del
 * fondo justo en los días que más importa leer — 2.78:1 en el día pico del
 * mes, por debajo del 3:1 que pide WCAG 1.4.11 para un objeto gráfico.
 *
 * Se corrige por los dos lados a la vez, porque ninguno bastaba solo: el tinte
 * sube menos (0.05→0.18 en vez de 0.08→0.34) y las barras son más claras. El
 * peor caso queda en 5.66:1 la barra normal y 10.53:1 la de la hora pico, que
 * además se distinguen entre sí (1.86:1). */
const BARRA_NORMAL = '#7B9CF2'
const BARRA_PICO   = '#C7D8FD'
const TINTE_BASE   = 0.05
const TINTE_CRECE  = 0.13

function barColor(esPico: boolean): string {
  return esPico ? BARRA_PICO : BARRA_NORMAL
}

function fmtDuracion(segs: number): string {
  if (segs < 60)  return `${segs}s`
  if (segs < 3600) return `${Math.floor(segs / 60)}m ${segs % 60}s`
  return `${Math.floor(segs / 3600)}h ${Math.floor((segs % 3600) / 60)}m`
}

/** «08:19», con la hora rellenada a dos dígitos: sin eso la primera y la
 *  última visita se desalinean («8:19» junto a «19:43»). */
function fmtHora(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
  /** Las 24 horas de CADA día. El módulo de horas que ya existía es un
   *  promedio de todo el rango: dice que el pico general son las 17:00, pero
   *  no dice que el 1 de septiembre el pico fueron las 9:00 y el 9 de
   *  septiembre las 17:00. Seis horas distintas mandan según el día — esa
   *  variación es justo lo que el promedio borra. */
  const byDateHour: Record<string, number[]> = {}
  let totalSeg = 0
  let withDuration = 0

  for (const r of rows) {
    const sec = r.seccion || r.ruta
    if (!bySection[sec]) bySection[sec] = { visits: 0, total_seg: 0 }
    bySection[sec].visits++
    /* `!= null` y NO un truthy. `PageTracker` calcula la duración con
       `Math.round((Date.now() - inicio) / 1000)`, así que una navegación de
       menos de medio segundo se guarda como 0 — que es una MEDICIÓN, no un
       hueco. Un `if (r.duracion_seg)` la descartaba junto con los nulos: la
       visita caía del denominador, el promedio subía al retirar el valor más
       bajo, y el conteo de «medidas» quedaba corto.
       Hoy no muerde —1,954 filas y ninguna vale 0, comprobado el 23 sep 2026—
       pero es la regla «un cero sin medición no es un cero» al revés: aquí lo
       que se perdía era un cero SÍ medido. */
    if (r.duracion_seg != null) {
      bySection[sec].total_seg += r.duracion_seg
      totalSeg += r.duracion_seg
      withDuration++
    }

    const d = new Date(r.created_at)
    byDow[d.getDay()]++
    byHour[d.getHours()]++
    /* La fecha se arma con las partes LOCALES, no con `toISOString()`.
     *
     * `toISOString()` convierte a UTC, y México va seis horas atrás: todo lo
     * que ocurre después de las 18:00 locales caía en el día SIGUIENTE. Con
     * eso el calendario pintaba actividad el 24 de septiembre cuando en
     * México todavía era el 23 — el registro de las 21:03 locales se guardaba
     * como 03:03 del día siguiente en UTC. Afecta al 30% de los registros.
     *
     * Además dejaba la pantalla contradiciéndose sola: `getDay()` y
     * `getHours()`, dos líneas más arriba, YA usan hora local. El calendario
     * era lo único que hablaba en UTC. */
    const dateKey = fechaLocal(d)
    byDate[dateKey] = (byDate[dateKey] ?? 0) + 1
    if (!byDateHour[dateKey]) byDateHour[dateKey] = new Array(24).fill(0)
    byDateHour[dateKey][d.getHours()]++
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
  const VACIO_24 = new Array(24).fill(0) as number[]

  /* LA VENTANA MEDIDA. Un día solo puede decir «no abrió el tablero» si ese
     día se estuvo midiendo. Fuera de esa ventana no hay un cero: hay un hueco,
     y son cosas distintas.
       · Por delante: el mes se arma SIEMPRE completo, así que un 30 de
         septiembre visto el día 23 salía pintado y contado como «sin abrir».
       · Por detrás: antes del primer registro no había medición, así que los
         días previos tampoco son días en que no abrió.
     Sin esto, la cabecera decía «12 de 22 días hábiles con uso · 10 sin abrir»
     cuando cinco de esos diez ni siquiera habían ocurrido. */
  const primerDiaMedido = dateEntries.length > 0 ? dateEntries[0][0] : null
  const hoy = hoyLocal()

  const meses = Array.from(new Set(Object.keys(byDate).map(d => d.slice(0, 7)))).sort()
  const calendario = meses.map(mes => {
    const [anio, m] = mes.split('-').map(Number)
    const diasEnMes = new Date(anio, m, 0).getDate()

    const dias = Array.from({ length: diasEnMes }, (_, i) => {
      const fecha = `${mes}-${String(i + 1).padStart(2, '0')}`
      // getDay() da 0 para domingo; aquí 0 = lunes, que es como se lee una
      // semana de trabajo y como se numeran las columnas de la rejilla.
      const dow = (new Date(anio, m - 1, i + 1).getDay() + 6) % 7
      const horas = byDateHour[fecha] ?? VACIO_24
      const visitas = byDate[fecha] ?? 0
      const jornada = HORAS_JORNADA.map(h => horas[h])
      const enJornada = jornada.reduce((s, v) => s + v, 0)
      const pico = enJornada > 0 ? HORAS_JORNADA[jornada.indexOf(Math.max(...jornada))] : null
      return {
        dia: i + 1, fecha, dow, visitas, jornada, enJornada,
        // Lo que cae antes de las 9 o después de las 19. No se descarta: se
        // enseña, porque si no la gráfica recortaría el 14% sin avisar.
        fuera: visitas - enJornada,
        pico,
        // ¿Hubo medición ese día? Un día futuro o anterior al primer registro
        // no es un cero: es un hueco, y se pinta y se cuenta aparte.
        medible: primerDiaMedido !== null && fecha >= primerDiaMedido && fecha <= hoy,
      }
    })

    const habiles = dias.filter(d => d.dow < 5)
    const finde   = dias.filter(d => d.dow >= 5)
    const findeVisitas = finde.reduce((s, d) => s + d.visitas, 0)
    const conUso = habiles.filter(d => d.visitas > 0).length
    // «Sin abrir» solo cuenta los días MEDIDOS y vacíos. Los de fuera de la
    // ventana se llevan su propio contador para que la resta cierre y para
    // poder decirlo en pantalla en vez de disimularlo.
    const sinUso = habiles.filter(d => d.medible && d.visitas === 0).length
    const sinMedir = habiles.filter(d => !d.medible).length
    const totalHabiles = habiles.reduce((s, d) => s + d.visitas, 0)
    const totalMes = totalHabiles + findeVisitas

    /* CIERRE. Dos sumas que tienen que cuadrar o la pantalla miente:
       el mes = hábiles + fin de semana, y cada día = jornada + fuera de
       jornada. Si algún día esto se rompe, que se rompa aquí y no en la
       cabeza de quien lee el calendario. */
    const sumaDias = dias.reduce((s, d) => s + d.visitas, 0)
    if (sumaDias !== totalMes) {
      console.error('[Uso] el mes no cierra', { mes, sumaDias, totalMes })
    }
    for (const d of dias) {
      if (d.enJornada + d.fuera !== d.visitas) {
        console.error('[Uso] el día no cierra', d.fecha)
      }
    }
    // Y los días hábiles también cierran en tres cubetas, sin que sobre ni
    // falte ninguno: con uso + medidos y vacíos + sin medición.
    if (conUso + sinUso + sinMedir !== habiles.length) {
      console.error('[Uso] los días hábiles no cierran', { mes, conUso, sinUso, sinMedir })
    }

    return {
      mes, anio, etiqueta: `${MESES_LARGOS[m - 1]} ${anio}`,
      // La rejilla es de 5 columnas y los días hábiles van seguidos de lunes a
      // viernes, así que basta con desplazar el primero a su columna.
      huecoInicial: habiles.length > 0 ? habiles[0].dow : 0,
      dias: habiles,
      // Escala COMPARTIDA por todo el mes. Si cada día se normalizara contra
      // su propio máximo, un día de 15 visitas dibujaría barras tan altas como
      // uno de 200 y el calendario diría que todos los días son iguales.
      maxHoraMes: Math.max(0, ...habiles.map(d => Math.max(0, ...d.jornada))),
      maxDia: Math.max(0, ...habiles.map(d => d.visitas)),
      totalMes, totalHabiles,
      fueraJornada: habiles.reduce((s, d) => s + d.fuera, 0),
      findeVisitas, findeDias: finde.filter(d => d.visitas > 0).length,
      conUso, sinUso, sinMedir, diasEnMes,
      diasHabiles: habiles.length,
      // El denominador honesto: solo los días hábiles que de verdad se midieron.
      habilesMedidos: habiles.length - sinMedir,
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
  /** Día abierto en el detalle, «YYYY-MM-DD», o null. La mini-gráfica de la
   *  casilla contesta «cuándo»; esto contesta «qué hizo». */
  const [diaSel,    setDiaSel]    = useState<string | null>(null)
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

  /* Al cambiar de mes o de usuario se cierra el detalle: dejarlo abierto
     mostraría un día que ya no está en la rejilla de arriba. */
  useEffect(() => { setDiaSel(null) }, [mesIdx, buscado])

  /* El detalle de un día, a las 24 HORAS. La casilla dibuja 9-19 porque es lo
     que cabe; aquí no se recorta nada, que es donde tiene que aparecer el 14%
     de actividad que vive fuera de la jornada. */
  const detalle = useMemo(() => {
    if (!diaSel) return null
    const delDia = rows.filter(r => fechaLocal(new Date(r.created_at)) === diaSel)
    if (delDia.length === 0) return null

    const horas = new Array(24).fill(0) as number[]
    const porSeccion: Record<string, { visitas: number; seg: number; conDur: number }> = {}
    const duraciones: number[] = []
    for (const r of delDia) {
      horas[new Date(r.created_at).getHours()]++
      const sec = r.seccion || r.ruta || '[sin sección]'
      if (!porSeccion[sec]) porSeccion[sec] = { visitas: 0, seg: 0, conDur: 0 }
      porSeccion[sec].visitas++
      // `!= null`, por lo mismo que en `aggregate()`: un 0 es una medición.
      if (r.duracion_seg != null) {
        porSeccion[sec].seg += r.duracion_seg
        porSeccion[sec].conDur++
        duraciones.push(r.duracion_seg)
      }
    }

    /* La tabla de secciones CIERRA: se enseñan las 8 más visitadas y el resto
       va a un bucket «otras», con su cuenta. Un top-8 que tira la cola dice
       que ésas son todas las secciones, y el 1 de septiembre hubo 16. */
    const todas = Object.entries(porSeccion)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.visitas - a.visitas)
    const top = todas.slice(0, 8)
    const resto = todas.slice(8)
    const secciones = resto.length > 0
      ? top.concat([{
          name: `(otras ${resto.length} secciones)`,
          visitas: resto.reduce((s, x) => s + x.visitas, 0),
          seg:     resto.reduce((s, x) => s + x.seg, 0),
          conDur:  resto.reduce((s, x) => s + x.conDur, 0),
        }])
      : top

    duraciones.sort((a, b) => a - b)
    const fechas = delDia.map(r => new Date(r.created_at).getTime())
    const d0 = new Date(diaSel + 'T12:00:00')

    return {
      fecha: diaSel,
      etiqueta: `${DIAS[d0.getDay()]} ${d0.getDate()} de ${MESES_LARGOS[d0.getMonth()]}`,
      total: delDia.length,
      horas,
      maxHora: Math.max(...horas),
      secciones,
      seccionesTotales: todas.length,
      // MEDIANA, no promedio: la máxima medida del histórico son 16.7 horas —
      // una pestaña que se quedó abierta toda la noche, no tiempo de trabajo.
      // Un promedio con eso dentro no describe ninguna sesión real.
      medianaSeg: duraciones.length > 0 ? duraciones[Math.floor(duraciones.length / 2)] : null,
      conDuracion: duraciones.length,
      primera: new Date(Math.min(...fechas)),
      ultima:  new Date(Math.max(...fechas)),
      fuera: horas.reduce((s, v, h) => (h < HORA_INI || h > HORA_FIN) ? s + v : s, 0),
    }
  }, [diaSel, rows])

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
                  {/* El denominador son los días hábiles MEDIDOS, no los del
                      mes. Contar sobre los 30 metería los fines de semana; y
                      contar sobre los 22 hábiles metería los días futuros y
                      los anteriores al primer registro, que no son ceros sino
                      huecos. Los huecos se dicen aparte, no se disimulan. */}
                  <strong className="text-textHi">{mesActual.conUso}</strong> de{' '}
                  <strong className="text-textHi">{mesActual.habilesMedidos}</strong> días hábiles medidos ·{' '}
                  <strong className="text-textHi">{mesActual.sinUso}</strong> sin abrir
                  {mesActual.sinMedir > 0 && (
                    <> · <strong className="text-textHi">{mesActual.sinMedir}</strong> sin medición</>
                  )}
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

              {/* Cinco columnas, no siete: el fin de semana sale de la rejilla
                  para dejarle sitio a la mini-gráfica dentro de cada casilla. */}
              <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                {DIAS_HABILES.map((d, i) => (
                  <span key={i} className="text-center text-[10px] font-bold text-textMid">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: mesActual.huecoInicial }, (_, i) => <div key={`h${i}`} />)}
                {mesActual.dias.map(d => {
                  const abierto = diaSel === d.fecha
                  const intensidad = mesActual.maxDia > 0 ? d.visitas / mesActual.maxDia : 0
                  /* La casilla se queda OSCURA aunque tenga actividad. Antes era
                     una baldosa de color claro con el número encima, y sobre un
                     fondo que cambia de tono en cuatro pasos no hay color de
                     barra que se lea en los cuatro. Con una sola superficie
                     oscura, el texto blanco que globals.css ya fuerza dentro de
                     una .cp-card es el correcto y no hace falta `cp-light`: el
                     nivel del día lo dicen el número y el tinte, y la hora la
                     dicen las barras. */
                  /* TRES ESTADOS, NO DOS. Un día sin medición —futuro, o
                     anterior al primer registro— NO es un día que se quedó
                     vacío: es un hueco. Se dibuja casi transparente y con el
                     borde punteado, para que a simple vista no se confunda con
                     un «no abrió el tablero» que sí se midió. */
                  const fondo = !d.medible ? 'transparent'
                    : d.visitas === 0 ? 'rgba(255,255,255,0.03)'
                    : `rgba(59,95,221,${(TINTE_BASE + TINTE_CRECE * intensidad).toFixed(3)})`
                  return (
                    <button
                      key={d.fecha}
                      type="button"
                      disabled={d.visitas === 0}
                      onClick={() => setDiaSel(abierto ? null : d.fecha)}
                      title={!d.medible
                        ? `${d.fecha} — sin medición (fuera del periodo registrado)`
                        : d.visitas === 0
                        ? `${d.fecha} — se midió y no abrió el tablero`
                        : `${d.fecha} — ${d.visitas} visita${d.visitas === 1 ? '' : 's'}`
                          + (d.pico !== null ? `, pico a las ${String(d.pico).padStart(2, '0')}:00` : '')
                          + (d.fuera > 0 ? `, ${d.fuera} fuera de 9-19h` : '')
                          + '. Clic para el detalle.'}
                      className="rounded-lg p-1.5 flex flex-col text-left transition-all
                        disabled:cursor-default enabled:hover:brightness-125"
                      style={{
                        background: fondo,
                        border: abierto ? '1.5px solid #A9C0FA'
                          : !d.medible ? '1px dashed rgba(255,255,255,0.10)'
                          : d.visitas === 0 ? '1px solid rgba(255,255,255,0.05)'
                          : '1px solid rgba(255,255,255,0.09)',
                        minHeight: 62,
                      }}
                    >
                      {/* OJO CON EL `background: 'transparent'` DE ESTOS SPAN.
                          No es decorativo: globals.css:105 dice
                            .cp-card span:not([style*="background"]) { color: #fff !important }
                          así que dentro de una tarjeta oscura un <span> que
                          solo declare `color` se pinta BLANCO y pierde su
                          color. Declarar `background` es lo que lo saca del
                          selector. Es el bug recurrente nº1 del proyecto. */}
                      <span className="flex items-baseline justify-between gap-1 leading-none">
                        <span className="text-[11px] font-bold"
                          style={{
                            color: !d.medible ? 'rgba(255,255,255,0.18)'
                              : d.visitas === 0 ? 'rgba(255,255,255,0.35)' : '#fff',
                            background: 'transparent',
                          }}>
                          {d.dia}
                        </span>
                        {d.visitas > 0 && (
                          <span className="text-[9px] font-semibold"
                            style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent' }}>
                            {d.visitas}
                            {/* El punto avisa de que ese día hubo actividad
                                fuera de 9-19 y la gráfica de abajo NO la
                                dibuja. Sin esto el recorte sería invisible. */}
                            {d.fuera > 0 && (
                              <span style={{ color: '#F59E0B', background: 'transparent' }}
                                title={`${d.fuera} fuera de horario`}>·</span>
                            )}
                          </span>
                        )}
                      </span>

                      {/* La mini-gráfica: 11 barras, 9:00 a 19:00. La altura se
                          mide contra el máximo del MES, no del día, para que
                          un día flojo se vea flojo. */}
                      <span className="flex items-end gap-px mt-1.5" style={{ height: 26 }}>
                        {d.jornada.map((v, i) => {
                          const h = mesActual.maxHoraMes > 0 ? v / mesActual.maxHoraMes : 0
                          return (
                            <span
                              key={i}
                              className="flex-1 rounded-t-[1px]"
                              style={{
                                // Suelo del 14%: una hora con una sola visita
                                // tiene que verse. Sin suelo desaparece y el
                                // día parece vacío a esa hora.
                                height: v === 0 ? '2px' : `${Math.max(14, h * 100)}%`,
                                background: v === 0
                                  ? 'rgba(255,255,255,0.07)'
                                  : barColor(d.pico === HORAS_JORNADA[i]),
                              }}
                            />
                          )
                        })}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* LEYENDA DE LA JORNADA, alineada con UNA casilla.
                  El primer intento la colgaba de la rejilla entera, así que
                  «9:00» caía en el borde del lunes, «19:00» en el del viernes y
                  «14:00» entre miércoles y jueves: el lector mapeaba el eje de
                  horas sobre el eje de días, que es justo la lectura contraria.
                  Ahora va dentro de una rejilla de 5 columnas y ocupa solo la
                  primera, de modo que sus marcas caen sobre las barras que
                  nombran. Las otras cuatro columnas quedan vacías a propósito. */}
              <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                <div className="flex items-center justify-between px-1.5">
                  <span className="text-[9px] text-textMid">{HORA_INI}h</span>
                  <span className="text-[9px] text-textMid">14h</span>
                  <span className="text-[9px] text-textMid">{HORA_FIN}h</span>
                </div>
                <div className="col-span-4 flex items-center">
                  <span className="text-[9px] text-textMid">
                    ← el eje horario de cada casilla, de {HORA_INI}:00 a {HORA_FIN}:00
                  </span>
                </div>
              </div>

              {/* EL CIERRE. Lo que la rejilla NO dibuja, dicho con números: si
                  no está aquí, el recorte de 9-19 y el de fin de semana pasan
                  por «no hubo actividad». */}
              <p className="text-[11px] text-textMid mt-3 leading-relaxed">
                Cada casilla trae el día, sus visitas y una barra por hora de{' '}
                <strong className="text-textHi">{HORA_INI}:00 a {HORA_FIN}:00</strong>; la barra
                clara es la hora pico de ese día. <strong className="text-textHi">Clic en un día</strong>{' '}
                para ver el detalle.
                {mesActual.fueraJornada > 0 && (
                  <>
                    {/* `<span>` con `background`, NO `<strong>`: globals.css:101
                        fuerza a blanco todos los <strong> de una .cp-card y ahí
                        no hay cláusula de escape que valga — el ámbar se perdía.
                        El peso se consigue con font-bold. */}
                    {' '}Fuera de esa franja quedan{' '}
                    <span className="font-bold" style={{ color: '#F59E0B', background: 'transparent' }}>
                      {mesActual.fueraJornada} visitas
                    </span>{' '}
                    (marcadas con{' '}
                    <span style={{ color: '#F59E0B', background: 'transparent' }}>·</span>); el
                    detalle del día sí las muestra.
                  </>
                )}
                {mesActual.findeVisitas > 0
                  ? <> Sábados y domingos no salen en la rejilla: suman{' '}
                      <strong className="text-textHi">{mesActual.findeVisitas} visitas</strong> en{' '}
                      {mesActual.findeDias} día{mesActual.findeDias === 1 ? '' : 's'}.</>
                  : <> No hubo actividad en sábado ni domingo.</>}
                {/* La casilla punteada. Sin explicarla, un día futuro se lee
                    igual que uno en que no abrió el tablero — y son cosas
                    distintas: una es un dato, la otra es la falta de él. */}
                {mesActual.sinMedir > 0 && (
                  <> Las casillas <span style={{
                    background: 'transparent',
                    border: '1px dashed rgba(255,255,255,0.35)',
                    borderRadius: 3, padding: '0 5px',
                  }}>punteadas</span> son días sin medición —futuros, o previos al primer
                    registro—, no días en que no abrió el tablero: por eso no entran en el
                    conteo de arriba.</>
                )}
              </p>

              {/* ── Detalle del día ───────────────────────────────────────── */}
              {detalle && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <div>
                      <p className="text-sm font-bold text-textHi capitalize">{detalle.etiqueta}</p>
                      <p className="text-[11px] text-textMid mt-0.5">
                        <strong className="text-textHi">{detalle.total}</strong> visitas ·{' '}
                        de <strong className="text-textHi">{fmtHora(detalle.primera)}</strong>
                        {' '}a <strong className="text-textHi">{fmtHora(detalle.ultima)}</strong>
                        {detalle.medianaSeg !== null && (
                          <> · mediana por pantalla <strong className="text-textHi">{fmtDuracion(detalle.medianaSeg)}</strong>{' '}
                            ({detalle.conDuracion} de {detalle.total} medidas)</>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDiaSel(null)}
                      className="text-[11px] px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)' }}
                    >
                      Cerrar
                    </button>
                  </div>

                  {/* Las 24 horas. Aquí NO se recorta: es el sitio donde tiene
                      que verse lo que la casilla deja fuera. */}
                  <p className="text-[11px] font-semibold text-textHi mb-1.5">Las 24 horas del día</p>
                  <div className="flex items-end gap-px" style={{ height: 56 }}>
                    {HORAS_DIA.map(h => {
                      const v = detalle.horas[h]
                      const dentro = h >= HORA_INI && h <= HORA_FIN
                      const alto = detalle.maxHora > 0 ? v / detalle.maxHora : 0
                      return (
                        <div
                          key={h}
                          className="flex-1 rounded-t-sm"
                          title={`${String(h).padStart(2, '0')}:00 — ${v} visita${v === 1 ? '' : 's'}${dentro ? '' : ' (fuera de la jornada)'}`}
                          style={{
                            height: v === 0 ? '2px' : `${Math.max(8, alto * 100)}%`,
                            background: v === 0 ? 'rgba(255,255,255,0.07)'
                              : dentro ? '#4A6FDF' : '#F59E0B',
                          }}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {[0, 6, 12, 18, 23].map(h => (
                      <span key={h} className="text-[9px] text-textMid">{String(h).padStart(2, '0')}h</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-textMid mt-1.5">
                    Azul: dentro de {HORA_INI}:00–{HORA_FIN}:00.{' '}
                    {detalle.fuera > 0
                      ? <>En{' '}
                          <span style={{ color: '#F59E0B', background: 'transparent' }}>ámbar</span>, las{' '}
                          <strong className="text-textHi">{detalle.fuera}</strong> visitas fuera de
                          esa franja — que la rejilla de arriba no dibuja.</>
                      : <>Ese día no hubo actividad fuera de esa franja.</>}
                  </p>

                  {/* Qué miró. La tabla CIERRA: el bucket «otras» lleva la cola
                      para que las visitas sumen el total del día. */}
                  <p className="text-[11px] font-semibold text-textHi mt-4 mb-1.5">
                    Qué consultó — {detalle.seccionesTotales} secciones
                  </p>
                  <div className="space-y-1">
                    {detalle.secciones.map(s => {
                      const pct = detalle.total > 0 ? (s.visitas / detalle.total) * 100 : 0
                      return (
                        <div key={s.name} className="flex items-center gap-2">
                          <span className="text-[11px] text-textMid truncate" style={{ width: '38%' }}>
                            {s.name}
                          </span>
                          <span className="flex-1 rounded-full overflow-hidden"
                            style={{ height: 8, background: 'rgba(255,255,255,0.07)' }}>
                            <span className="block h-full rounded-full"
                              style={{ width: `${Math.max(3, pct)}%`, background: '#4A6FDF' }} />
                          </span>
                          <span className="text-[10px] font-semibold text-textHi text-right" style={{ width: 34 }}>
                            {s.visitas}
                          </span>
                          <span className="text-[10px] text-textMid text-right" style={{ width: 52 }}>
                            {s.conDur > 0 ? fmtDuracion(Math.round(s.seg / s.conDur)) : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-textMid mt-2">
                    La última columna es el tiempo medio en esa pantalla; «—» es que
                    ninguna de sus visitas trae duración medida.
                  </p>
                </div>
              )}
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
