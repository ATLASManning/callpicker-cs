import {
  DollarSign, AlertTriangle, TrendingUp,
  CalendarDays, CheckCircle2, AlertCircle, Ticket, LifeBuoy,
  ArrowUpRight, Target, RefreshCw,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SemaforoDashChart from '@/components/charts/SemaforoDashChart'
import AsesorLineasChart from '@/components/charts/AsesorLineasChart'
import TicketsAnalyticsChart, { type TicketsAnalyticsData } from '@/components/charts/TicketsAnalyticsChart'
import TopRiesgoTable from '@/components/TopRiesgoTable'
import AutoRefresh from '@/components/AutoRefresh'
import DashAlertasCriticas from '@/components/DashAlertasCriticas'
import DashMetricasSection from '@/components/DashMetricasSection'
import TopCuentasVersatil, { type CuentaRank } from '@/components/TopCuentasVersatil'
import { getKPIs, getSemaforoByAsesor, getCuentas, getActividadesSAC, getAdopcionProductoAll, type AdopcionRow } from '@/lib/supabase'
import { formatMXN, getSemaforo, ASESOR_CONFIG, type Cuenta, type Asesor } from '@/lib/types'
import { AUDITORIA_REFS } from '@/app/auditoria/registry'
import { getTicketsByCuenta } from '@/lib/cuenta-data'
import Link from 'next/link'
import rawTickets from '@/lib/tickets-data.json'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// ── Paleta ────────────────────────────────────────────────────────────────────
const PANEL  = '#0F2040'
const PANEL2 = '#0D1B35'
const BORDER  = 'rgba(255,255,255,0.10)'
const BORDER2 = 'rgba(255,255,255,0.06)'
const TX_HI  = '#FFFFFF'
const TX_MID = 'rgba(255,255,255,0.70)'
const TX_LOW = 'rgba(255,255,255,0.45)'
const CYAN   = '#00B4FF'

const SEM_COLOR: Record<string, string> = {
  verde: '#22C55E', azul: '#3B82F6', amarillo: '#EAB308', naranja: '#F97316', rojo: '#EF4444',
}
const SEM_LABEL: Record<string, string> = {
  verde: 'Saludable', azul: 'Estable', amarillo: 'Observación', naranja: 'En Riesgo', rojo: 'Riesgo Alto',
}

// ── Config adopción y perfil ──────────────────────────────────────────────────
// Adopción real: se calcula desde la tabla `adopcion_producto` (capturada por
// asesores en cada Cuenta), NO desde los flags booleanos de `cuentas` — esos
// flags nunca se llenan y siempre reportaban 0%.
const ADOPT_FEATURES: { key: keyof Cuenta; label: string; producto: string }[] = [
  { key: 'tiene_chat_activo',     label: 'Chat',       producto: 'Callpicker Chat' },
  { key: 'tiene_ia_voz',          label: 'IA Voz',     producto: 'IA de Voz' },
  { key: 'tiene_ia_chat',         label: 'IA Chat',    producto: 'IA de Chat' },
  { key: 'tiene_integracion_api', label: 'API',        producto: 'Integración API' },
  { key: 'tiene_pago_automatico', label: 'Pago Auto',  producto: 'Pago Automático' },
  { key: 'dashboard_revisado',    label: 'Dashboard',  producto: 'Uso del Panel Administrador' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

// Datos relevantes que le faltan a una cuenta para poder operarla bien.
// Compartido por Alertas Críticas y el ranking versátil de Top Cuentas.
function computeFaltantes(c: Cuenta): string[] {
  const faltantes: string[] = []
  if (!c.contacto_nombre)                      faltantes.push('Contacto')
  if (!c.contacto_tel)                         faltantes.push('Teléfono')
  if (!c.contacto_email)                       faltantes.push('Correo')
  if (!c.activo_desde)                         faltantes.push('Fecha de alta')
  if (!c.giro)                                 faltantes.push('Giro')
  if (!c.cid)                                  faltantes.push('CID Zoho')
  const kam = String(c.observaciones_kam ?? '').trim()
  if (kam === '' || kam === '0')               faltantes.push('Observaciones KAM')
  if ((c.contactos_json?.length ?? 0) < 2)     faltantes.push('Mapa de decisores')
  return faltantes
}

// Días desde el último contacto registrado. null = nunca se registró uno.
function diasSinContactoDe(c: Cuenta): number | null {
  return c.ultimo_contacto
    ? Math.floor((Date.now() - new Date(c.ultimo_contacto).getTime()) / 86400000)
    : null
}

function fmtFecha(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

// ── Diagnóstico de perfiles ───────────────────────────────────────────────────
const CRITICAL_FIELDS: (keyof Cuenta)[] = ['contacto_nombre', 'contacto_cargo', 'contacto_tel']
const IMPORTANT_FIELDS: (keyof Cuenta)[] = ['giro', 'nps_score', 'observaciones_kam', 'total_empleados', 'num_oficinas', 'pagina_web']
const CRITICAL_LABELS: Record<string, string> = {
  contacto_nombre: 'Contacto principal', contacto_cargo: 'Cargo', contacto_tel: 'Teléfono',
}
const IMPORTANT_LABELS: Record<string, string> = {
  giro: 'Giro', nps_score: 'NPS', observaciones_kam: 'Obs. KAM',
  total_empleados: 'No. empleados', num_oficinas: 'No. sitios', pagina_web: 'Sitio web',
}

const isFieldFilled = (v: unknown) => v !== null && v !== undefined && v !== ''

function profileSemaforoForCuenta(c: Cuenta): 'verde' | 'amarillo' | 'naranja' | 'rojo' {
  const missing = CRITICAL_FIELDS.filter(f => !isFieldFilled(c[f])).length
  if (missing === 0) return 'verde'
  if (missing === 1) return 'amarillo'
  if (missing === 2) return 'naranja'
  return 'rojo'
}

const SAC_WEEKLY_TARGET = 15 // 3 actividades/día × 5 días hábiles

// ── Gauge SVG ─────────────────────────────────────────────────────────────────
// Semicircle: 270° (left/9 o'clock) → 90° (right/3 o'clock) via top, 180° sweep
function Gauge({ score, color, gid, label }: { score: number; color: string; gid: string; label?: string }) {
  const W = 180, H = 100
  const cx = 90, cy = 92, r = 74

  const toRad = (deg: number) => (deg - 90) * Math.PI / 180
  const px = (deg: number) => cx + r * Math.cos(toRad(deg))
  const py = (deg: number) => cy + r * Math.sin(toRad(deg))

  const arc = (from: number, to: number) => {
    const sweep = ((to - from) + 360) % 360
    const large = sweep > 180 ? 1 : 0
    return `M ${px(from).toFixed(1)},${py(from).toFixed(1)} A ${r} ${r} 0 ${large} 1 ${px(to).toFixed(1)},${py(to).toFixed(1)}`
  }

  const fillDeg = 270 + Math.max(score, 0.5) * 180 / 100
  const sw = 12
  const filtId = `g-${gid}`

  // Needle
  const nr = r * 0.82
  const nDeg = fillDeg
  const nx = cx + nr * Math.cos(toRad(nDeg))
  const ny = cy + nr * Math.sin(toRad(nDeg))

  // Threshold ticks at 20, 40, 60, 80
  const tickDots = [20, 40, 60, 80].map(v => {
    const d = 270 + v * 180 / 100
    return { x: px(d), y: py(d), c: v < 40 ? '#EF4444' : v < 60 ? '#EAB308' : v < 80 ? '#3B82F6' : '#22C55E' }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
      <defs>
        <filter id={filtId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Track */}
      <path d={arc(270, 90)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} strokeLinecap="round" />

      {/* Fill arc */}
      <path d={arc(270, fillDeg)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        filter={`url(#${filtId})`} />

      {/* Threshold dots */}
      {tickDots.map((t, i) => (
        <circle key={i} cx={t.x.toFixed(1)} cy={t.y.toFixed(1)} r="3" fill={t.c} />
      ))}

      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx.toFixed(1)} y2={ny.toFixed(1)}
        stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="6" fill={color} />
      <circle cx={cx} cy={cy} r="2.5" fill="white" />

      {/* Score text */}
      <text x={cx} y={cy - 28} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="28" fontWeight="900">
        {label ?? Math.round(score)}
      </text>
    </svg>
  )
}

// ── UI Components ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub: string
  icon: React.ElementType; accent: string
}) {
  return (
    <div style={{
      background: `linear-gradient(145deg, ${PANEL} 0%, rgba(5,13,26,0.95) 100%)`,
      border: `1px solid ${accent}22`, borderRadius: 16, padding: '20px',
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 24px ${accent}0D, 0 4px 16px rgba(0,0,0,0.4)`,
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderBottomLeftRadius: '100%', pointerEvents: 'none', background: `radial-gradient(circle at top right, ${accent}15 0%, transparent 70%)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${accent}18`, border: `1px solid ${accent}30` }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: TX_LOW }}>{label}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', color: TX_HI, marginBottom: 6 }}>{value}</p>
      <p style={{ fontSize: 11, color: TX_MID, lineHeight: 1.4 }}>{sub}</p>
    </div>
  )
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      {children}
    </div>
  )
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: TX_MID, marginBottom: 16 }}>
      {children}
    </p>
  )
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 99, background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

// ── Asesor Stats type ─────────────────────────────────────────────────────────
interface AsesorStats {
  asesor: string
  color: string
  cuentas: Cuenta[]
  totalAsignadas: number
  totalFac: number
  facEnRiesgo: number
  avgHealth: number
  semDist: { verde: number; azul: number; amarillo: number; naranja: number; rojo: number }
  adoptRates: Record<string, number>
  profilePct: number
  subScores: { actividad: number; adopcion: number; pago: number; relacional: number }
  topRisk: Cuenta | null
  topSaludable: Cuenta | null
  upsellCount: number
  auditCount: number
  auditPct: number
  profileDist: { verde: number; amarillo: number; naranja: number; rojo: number }
  criticosFaltantes: number
  importantesFaltantes: number
}

function computeAsesorStats(
  asesor: string, cuentas: Cuenta[], auditSet: Set<string>,
  adopMap: Map<string, Map<string, AdopcionRow>>, totalAsignadas: number,
): AsesorStats {
  const color = ASESOR_CONFIG[asesor as Asesor]?.color ?? '#6366F1'
  const semDist = { verde: 0, azul: 0, amarillo: 0, naranja: 0, rojo: 0 }
  let totalFac = 0, facEnRiesgo = 0

  cuentas.forEach(c => {
    totalFac += c.facturacion ?? 0
    const s = getSemaforo(c.health_score)
    semDist[s]++
    if (c.health_score < 40) facEnRiesgo += c.facturacion ?? 0
  })

  const avgHealth = avg(cuentas.map(c => c.health_score ?? 50))

  // Adopción real desde `adopcion_producto` (capturada por el asesor en cada
  // Cuenta): por cuenta con registro y nivel aplicable, alto=100 medio=50
  // bajo=0. Se excluye `no_aplica` (el producto no le corresponde a la cuenta,
  // no cuenta como "no adoptado"). Sin registros → 0% (pendiente de captura).
  const adoptRates: Record<string, number> = {}
  for (const f of ADOPT_FEATURES) {
    const scores: number[] = []
    cuentas.forEach(c => {
      const nivel = adopMap.get(c.id)?.get(f.producto)?.nivel
      if (!nivel || nivel === 'no_aplica') return
      scores.push(nivel === 'alto' ? 100 : nivel === 'medio' ? 50 : 0)
    })
    adoptRates[f.key as string] = scores.length > 0 ? avg(scores) : 0
  }

  const profilePct = cuentas.length > 0
    ? (cuentas.reduce((sum, c) => {
        let filled = 0
        if (c.contacto_nombre)  filled++
        if (c.giro)             filled++
        if (c.activo_desde)     filled++
        if (c.observaciones_kam) filled++
        if (c.pagina_web)       filled++
        return sum + filled / 5
      }, 0) / cuentas.length) * 100 : 0

  const subScores = {
    actividad:  avg(cuentas.map(c => c.score_actividad  ?? 50)),
    adopcion:   avg(cuentas.map(c => c.score_adopcion   ?? 50)),
    pago:       avg(cuentas.map(c => c.score_pago       ?? 50)),
    relacional: avg(cuentas.map(c => c.score_relacional ?? 50)),
  }

  const sorted = [...cuentas].sort((a, b) => a.health_score - b.health_score)
  const upsellCount = cuentas.filter(c => c.upsell_producto || c.crossell_producto).length
  const auditCount = cuentas.filter(c => c.consecutivo && auditSet.has(c.consecutivo.toUpperCase())).length
  const auditPct   = cuentas.length > 0 ? (auditCount / cuentas.length) * 100 : 0

  const profileDist = { verde: 0, amarillo: 0, naranja: 0, rojo: 0 }
  let criticosFaltantes = 0, importantesFaltantes = 0
  cuentas.forEach(c => {
    profileDist[profileSemaforoForCuenta(c)]++
    criticosFaltantes    += CRITICAL_FIELDS.filter(f => !isFieldFilled(c[f])).length
    importantesFaltantes += IMPORTANT_FIELDS.filter(f => !isFieldFilled(c[f])).length
  })

  return {
    asesor, color, cuentas, totalAsignadas, totalFac, facEnRiesgo, avgHealth, semDist,
    adoptRates, profilePct, subScores,
    topRisk: sorted[0] ?? null,
    topSaludable: sorted[sorted.length - 1] ?? null,
    upsellCount, auditCount, auditPct,
    profileDist, criticosFaltantes, importantesFaltantes,
  }
}

// ── Gauge Card ────────────────────────────────────────────────────────────────
function GaugeCard({ st }: { st: AsesorStats }) {
  const semOrder = ['verde', 'azul', 'amarillo', 'naranja', 'rojo'] as const
  const semLabel = getSemaforo(st.avgHealth)
  const semColor = SEM_COLOR[semLabel]

  return (
    <div style={{ background: PANEL, border: `1px solid ${st.color}22`, borderRadius: 16, padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Asesor header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: st.color, boxShadow: `0 0 8px ${st.color}` }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: TX_HI }}>{st.asesor}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: `${semColor}20`, color: semColor, border: `1px solid ${semColor}40` }}>
          {SEM_LABEL[semLabel]}
        </span>
      </div>

      {/* Gauge */}
      <Gauge score={st.avgHealth} color={st.color} gid={st.asesor.replace(/[^a-z]/gi, '')} />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 10px' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: TX_HI, lineHeight: 1 }}>{st.totalAsignadas}</p>
          <p style={{ fontSize: 11, color: TX_LOW, marginTop: 2 }}>cuentas</p>
          {st.totalAsignadas > st.cuentas.length && (
            <p style={{ fontSize: 9, color: TX_LOW, marginTop: 2, opacity: 0.75 }}>{st.cuentas.length} activas/riesgo</p>
          )}
        </div>
        <div style={{ flex: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 10px' }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: TX_HI, lineHeight: 1 }}>{formatMXN(st.totalFac)}</p>
          <p style={{ fontSize: 11, color: TX_LOW, marginTop: 2 }}>MRR total</p>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 10px' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#A855F7', lineHeight: 1 }}>{st.upsellCount}</p>
          <p style={{ fontSize: 11, color: TX_LOW, marginTop: 2 }}>oportunidades</p>
        </div>
      </div>

      {/* Semáforo pills */}
      <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' as const }}>
        {semOrder.map(s => {
          const n = st.semDist[s]
          if (!n) return null
          return (
            <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: `${SEM_COLOR[s]}20`, color: SEM_COLOR[s], border: `1px solid ${SEM_COLOR[s]}30` }}>
              {n} {SEM_LABEL[s]}
            </span>
          )
        })}
      </div>

      {/* Cobertura auditoría */}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER2}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: TX_LOW }}>
            Cobertura análisis
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: st.auditPct >= 30 ? '#22C55E' : st.auditPct >= 15 ? '#EAB308' : '#EF4444' }}>
              {st.auditCount}/{st.cuentas.length}
            </span>
            <span style={{ fontSize: 11, color: TX_LOW }}>auditadas</span>
          </div>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${Math.min(st.auditPct, 100)}%`,
            background: st.auditPct >= 30 ? '#22C55E' : st.auditPct >= 15 ? '#EAB308' : '#EF4444',
          }} />
        </div>
        {st.cuentas.length - st.auditCount > 0 && (
          <p style={{ fontSize: 11, color: '#F97316', marginTop: 3 }}>
            {st.cuentas.length - st.auditCount} sin analizar · punto ciego de churn
          </p>
        )}
      </div>

      {/* Facturación en riesgo */}
      {st.facEnRiesgo > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, color: '#F97316', display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertTriangle size={12} />
          <span>{formatMXN(st.facEnRiesgo)} en riesgo</span>
        </div>
      )}
    </div>
  )
}

// ── Asesor Detail Card ────────────────────────────────────────────────────────
function AsesorDetailCard({ st }: { st: AsesorStats }) {
  const subEntries = [
    { key: 'actividad',  label: 'Actividad',  val: st.subScores.actividad },
    { key: 'adopcion',   label: 'Adopción',   val: st.subScores.adopcion },
    { key: 'pago',       label: 'Pago',       val: st.subScores.pago },
    { key: 'relacional', label: 'Relacional', val: st.subScores.relacional },
  ]
  const bestSub  = subEntries.reduce((a, b) => a.val > b.val ? a : b)
  const worstSub = subEntries.reduce((a, b) => a.val < b.val ? a : b)

  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: TX_HI }}>{st.asesor}</span>
        <span style={{ fontSize: 12, color: TX_LOW, marginLeft: 'auto' }}>{st.cuentas.length} cuentas</span>
      </div>

      {/* Sub-scores */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: TX_LOW, marginBottom: 8 }}>Sub-scores promedio</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {subEntries.map(e => {
            const c = e.val >= 80 ? '#22C55E' : e.val >= 60 ? '#3B82F6' : e.val >= 40 ? '#EAB308' : '#EF4444'
            return (
              <div key={e.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: TX_MID }}>{e.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{Math.round(e.val)}</span>
                </div>
                <MiniBar pct={e.val} color={c} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Adopción de features */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: TX_LOW, marginBottom: 8 }}>Adopción de producto</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ADOPT_FEATURES.map(f => {
            const pct = st.adoptRates[f.key as string] ?? 0
            const c = pct >= 60 ? '#22C55E' : pct >= 30 ? '#EAB308' : '#EF4444'
            return (
              <div key={f.key as string} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: TX_MID, width: 72, flexShrink: 0 }}>{f.label}</span>
                <MiniBar pct={pct} color={c} />
                <span style={{ fontSize: 12, fontWeight: 700, color: c, width: 34, textAlign: 'right' as const }}>{Math.round(pct)}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Completitud de info */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: TX_LOW }}>Completitud de fichas</p>
          <span style={{ fontSize: 13, fontWeight: 800, color: st.profilePct >= 70 ? '#22C55E' : st.profilePct >= 40 ? '#EAB308' : '#EF4444' }}>
            {Math.round(st.profilePct)}%
          </span>
        </div>
        <MiniBar pct={st.profilePct} color={st.profilePct >= 70 ? '#22C55E' : st.profilePct >= 40 ? '#EAB308' : '#EF4444'} />
        <p style={{ fontSize: 11, color: TX_LOW, marginTop: 4 }}>Contacto · Giro · Antigüedad · Obs. KAM · Web</p>
      </div>

      {/* Áreas a replicar / de seguimiento */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '8px 10px' }}>
          <p style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 3 }}>Replicar</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: TX_HI }}>{bestSub.label}</p>
          <p style={{ fontSize: 12, color: '#22C55E' }}>{Math.round(bestSub.val)}</p>
        </div>
        <div style={{ flex: 1, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 10px' }}>
          <p style={{ fontSize: 11, color: '#F97316', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 3 }}>Seguimiento</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: TX_HI }}>{worstSub.label}</p>
          <p style={{ fontSize: 12, color: '#F97316' }}>{Math.round(worstSub.val)}</p>
        </div>
      </div>

      {/* Top risk / top saludable */}
      {(st.topRisk || st.topSaludable) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {st.topRisk && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, width: 68, flexShrink: 0 }}>Mayor riesgo</span>
              <Link href={`/cuentas/${st.topRisk.id}`} style={{ fontSize: 12, color: TX_MID, textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} className="hover:underline">
                {st.topRisk.empresa}
              </Link>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', flexShrink: 0 }}>{st.topRisk.health_score}</span>
            </div>
          )}
          {st.topSaludable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, width: 68, flexShrink: 0 }}>Más saludable</span>
              <Link href={`/cuentas/${st.topSaludable.id}`} style={{ fontSize: 12, color: TX_MID, textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} className="hover:underline">
                {st.topSaludable.empresa}
              </Link>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', flexShrink: 0 }}>{st.topSaludable.health_score}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Adopción Matrix ───────────────────────────────────────────────────────────
function AdopcionMatrix({ asesores }: { asesores: AsesorStats[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 14px', textAlign: 'left' as const, fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase' as const, letterSpacing: '0.08em', borderBottom: `1px solid ${BORDER2}` }}>Feature</th>
            {asesores.map(a => (
              <th key={a.asesor} style={{ padding: '10px 14px', textAlign: 'center' as const, fontSize: 13, fontWeight: 700, color: a.color, borderBottom: `1px solid ${BORDER2}` }}>
                {a.asesor}
              </th>
            ))}
            <th style={{ padding: '10px 14px', textAlign: 'center' as const, fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase' as const, letterSpacing: '0.06em', borderBottom: `1px solid ${BORDER2}` }}>Global</th>
          </tr>
        </thead>
        <tbody>
          {ADOPT_FEATURES.map((f, fi) => {
            const globalPct = asesores.length > 0
              ? avg(asesores.map(a => a.adoptRates[f.key as string] ?? 0)) : 0
            return (
              <tr key={f.key as string} style={{ background: fi % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '10px 14px', fontSize: 13, color: TX_MID }}>{f.label}</td>
                {asesores.map(a => {
                  const pct = a.adoptRates[f.key as string] ?? 0
                  const c = pct >= 60 ? '#22C55E' : pct >= 30 ? '#EAB308' : '#EF4444'
                  return (
                    <td key={a.asesor} style={{ padding: '10px 14px', textAlign: 'center' as const }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: c }}>{Math.round(pct)}%</span>
                        <div style={{ width: 44, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: 99 }} />
                        </div>
                      </div>
                    </td>
                  )
                })}
                <td style={{ padding: '10px 14px', textAlign: 'center' as const }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: TX_MID }}>{Math.round(globalPct)}%</span>
                </td>
              </tr>
            )
          })}
          {/* Profile completeness row */}
          <tr style={{ borderTop: `1px solid ${BORDER2}`, background: 'rgba(255,255,255,0.03)' }}>
            <td style={{ padding: '10px 14px', fontSize: 13, color: TX_MID, fontStyle: 'italic' }}>Completitud fichas</td>
            {asesores.map(a => {
              const c = a.profilePct >= 70 ? '#22C55E' : a.profilePct >= 40 ? '#EAB308' : '#EF4444'
              return (
                <td key={a.asesor} style={{ padding: '10px 14px', textAlign: 'center' as const }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: c }}>{Math.round(a.profilePct)}%</span>
                </td>
              )
            })}
            <td style={{ padding: '8px 12px', textAlign: 'center' as const }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: TX_MID }}>{Math.round(avg(asesores.map(a => a.profilePct)))}%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ── Diagnóstico de Perfiles ───────────────────────────────────────────────────
function PerfilDistPanel({ asesores }: { asesores: AsesorStats[] }) {
  const totalCriticos    = asesores.reduce((s, a) => s + a.criticosFaltantes, 0)
  const totalImportantes = asesores.reduce((s, a) => s + a.importantesFaltantes, 0)
  const totalCuentas     = asesores.reduce((s, a) => s + a.cuentas.length, 0)
  const totalVerdes      = asesores.reduce((s, a) => s + a.profileDist.verde, 0)
  const totalSinContacto = asesores.reduce((s, a) => s + a.profileDist.rojo, 0)

  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: TX_MID }}>
          Diagnóstico de Perfiles · {totalCuentas} cuentas
        </p>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: TX_LOW }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />Sin contacto</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />2 campos</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EAB308', display: 'inline-block' }} />1 campo</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />Completo</span>
        </div>
      </div>

      {/* KPI resumen */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { val: totalCriticos,    label: 'datos críticos faltantes',    color: '#EF4444' },
          { val: totalImportantes, label: 'datos importantes faltantes', color: '#EAB308' },
          { val: totalSinContacto, label: 'cuentas sin contacto',        color: '#F97316' },
          { val: totalVerdes,      label: `de ${totalCuentas} perfiles completos`, color: '#22C55E' },
        ].map((item, i) => (
          <div key={i} style={{ flex: 1, background: `${item.color}10`, border: `1px solid ${item.color}25`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' as const }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.val}</p>
            <p style={{ fontSize: 11, color: TX_LOW, marginTop: 4, lineHeight: 1.3 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Stacked bars por asesor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {asesores.map(a => {
          const total = a.cuentas.length
          if (!total) return null
          const d = a.profileDist
          // % de campos críticos cubiertos (no cuentas, sino campos totales)
          const maxCriticos = total * CRITICAL_FIELDS.length
          const filledCriticos = maxCriticos - a.criticosFaltantes
          const pctCriticos = Math.round((filledCriticos / maxCriticos) * 100)
          const colorPct = pctCriticos >= 80 ? '#22C55E' : pctCriticos >= 50 ? '#EAB308' : '#EF4444'

          return (
            <div key={a.asesor}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: TX_HI }}>{a.asesor}</span>
                  <span style={{ fontSize: 12, color: TX_LOW }}>{total} cuentas</span>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                  <span style={{ color: '#EF4444' }}>{a.criticosFaltantes} críticos</span>
                  <span style={{ color: '#EAB308' }}>{a.importantesFaltantes} importantes</span>
                  <span style={{ color: colorPct, fontWeight: 700 }}>{pctCriticos}% críticos cubiertos</span>
                </div>
              </div>
              {/* Stacked bar */}
              <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', gap: 1 }}>
                {d.rojo     > 0 && <div style={{ flex: d.rojo,     background: '#EF4444' }} title={`${d.rojo} sin contacto`} />}
                {d.naranja  > 0 && <div style={{ flex: d.naranja,  background: '#F97316' }} title={`${d.naranja} con 2 críticos faltantes`} />}
                {d.amarillo > 0 && <div style={{ flex: d.amarillo, background: '#EAB308' }} title={`${d.amarillo} con 1 crítico faltante`} />}
                {d.verde    > 0 && <div style={{ flex: d.verde,    background: '#22C55E' }} title={`${d.verde} críticos completos`} />}
              </div>
              {/* Labels */}
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: TX_LOW }}>
                {d.rojo     > 0 && <span style={{ fontSize: 11, color: '#EF4444' }}>{d.rojo} sin contacto</span>}
                {d.naranja  > 0 && <span style={{ fontSize: 11, color: '#F97316' }}>{d.naranja} críticos ×2</span>}
                {d.amarillo > 0 && <span style={{ fontSize: 11, color: '#EAB308' }}>{d.amarillo} crítico ×1</span>}
                {d.verde    > 0 && <span style={{ fontSize: 11, color: '#22C55E' }}>{d.verde} ok</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Campos más faltantes */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER2}` }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: TX_LOW, marginBottom: 8 }}>
          Campos más faltantes
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {CRITICAL_FIELDS.map(f => {
            const n = asesores.reduce((s, a) => s + a.cuentas.filter(c => !isFieldFilled(c[f])).length, 0)
            if (!n) return null
            return (
              <span key={String(f)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 600 }}>
                {CRITICAL_LABELS[String(f)]} ({n})
              </span>
            )
          })}
          {IMPORTANT_FIELDS.map(f => {
            const n = asesores.reduce((s, a) => s + a.cuentas.filter(c => !isFieldFilled(c[f])).length, 0)
            if (!n) return null
            return (
              <span key={String(f)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'rgba(234,179,8,0.10)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.25)', fontWeight: 600 }}>
                {IMPORTANT_LABELS[String(f)]} ({n})
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── SAC Cumplimiento Semanal ──────────────────────────────────────────────────
function SACWeeklyPanel({ asesores, segsMap }: { asesores: AsesorStats[]; segsMap: Record<string, number[]> }) {
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: TX_MID }}>
          Cumplimiento SAC Semanal
        </p>
        <span style={{ fontSize: 12, color: TX_LOW }}>Meta: {SAC_WEEKLY_TARGET} actividades/semana · 3/día × 5 días</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {asesores.map(a => {
          const weeks = segsMap[a.asesor] ?? [0, 0, 0, 0]
          const thisWeek = weeks[0]
          const score = Math.min((thisWeek / SAC_WEEKLY_TARGET) * 100, 100)
          const gaugeColor = score >= 80 ? '#22C55E' : score >= 50 ? '#EAB308' : '#EF4444'
          const maxPrev = Math.max(...weeks.slice(1), 1)
          const weekLabel = ['S-2', 'S-3', 'S-4']

          return (
            <div key={a.asesor} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: TX_HI }}>{a.asesor}</span>
              </div>

              {/* Gauge — muestra el nro real de actividades */}
              <Gauge
                score={score}
                color={gaugeColor}
                gid={`sac-${a.asesor.replace(/[^a-z]/gi, '')}`}
                label={String(thisWeek)}
              />

              <p style={{ fontSize: 12, color: TX_MID, textAlign: 'center' as const, marginTop: -4 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: gaugeColor }}>{thisWeek}</span>
                {' '}<span style={{ color: TX_LOW }}>/ {SAC_WEEKLY_TARGET}</span>
                {' '}<span style={{ color: TX_LOW }}>actividades esta semana</span>
              </p>

              {/* Tendencia: últimas 3 semanas */}
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 11, color: TX_LOW, marginBottom: 5 }}>Semanas anteriores</p>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 44 }}>
                  {weeks.slice(1).map((w, i) => {
                    const h = Math.max(Math.round((w / Math.max(maxPrev, SAC_WEEKLY_TARGET)) * 40), 3)
                    const bc = (w / SAC_WEEKLY_TARGET) >= 0.8 ? '#22C55E' : (w / SAC_WEEKLY_TARGET) >= 0.5 ? '#EAB308' : '#EF4444'
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ height: `${h}px`, width: '100%', borderRadius: 3, background: bc }} />
                        <span style={{ fontSize: 11, color: TX_LOW }}>{w}</span>
                        <span style={{ fontSize: 10, color: TX_LOW }}>{weekLabel[i]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tickets globales ──────────────────────────────────────────────────────────
interface TicketRaw { es_falla: string; fecha: string; empresa: string; categoria: string; mes: string }
const _allTickets = rawTickets as TicketRaw[]
const globalTickets = {
  total:  _allTickets.length,
  fallas: _allTickets.filter(t => t.es_falla === 'Si').length,
  ultima: _allTickets.reduce((acc, t) => t.fecha > acc ? t.fecha : acc, ''),
}

// ── Tickets analytics (server-side, static) ───────────────────────────────────
const ticketsAnalytics: TicketsAnalyticsData = (() => {
  const INTERNAL = new Set(['Callpicker', 'sin cuenta', ''])

  // Top clientes
  const cliMap: Record<string, { total: number; fallas: number }> = {}
  for (const t of _allTickets) {
    if (INTERNAL.has(t.empresa)) continue
    if (!cliMap[t.empresa]) cliMap[t.empresa] = { total: 0, fallas: 0 }
    cliMap[t.empresa].total++
    if (t.es_falla === 'Si') cliMap[t.empresa].fallas++
  }
  const topClientes = Object.entries(cliMap)
    .map(([empresa, v]) => ({ empresa, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Por categoría
  const catMap: Record<string, { total: number; fallas: number }> = {}
  for (const t of _allTickets) {
    const cat = t.categoria || 'Sin categorizar'
    if (!catMap[cat]) catMap[cat] = { total: 0, fallas: 0 }
    catMap[cat].total++
    if (t.es_falla === 'Si') catMap[cat].fallas++
  }
  const porCategoria = Object.entries(catMap)
    .map(([categoria, v]) => ({ categoria, ...v }))
    .sort((a, b) => b.total - a.total)

  // Reincidencia (empresa × categoría)
  const reinMap: Record<string, { empresa: string; categoria: string; count: number; fallas: number }> = {}
  for (const t of _allTickets) {
    if (INTERNAL.has(t.empresa)) continue
    const cat = t.categoria || 'Sin categorizar'
    const k = `${t.empresa}||${cat}`
    if (!reinMap[k]) reinMap[k] = { empresa: t.empresa, categoria: cat, count: 0, fallas: 0 }
    reinMap[k].count++
    if (t.es_falla === 'Si') reinMap[k].fallas++
  }
  const reincidentes = Object.values(reinMap)
    .filter(x => x.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  // Tendencia mensual
  const mesMap: Record<string, { total: number; fallas: number }> = {}
  for (const t of _allTickets) {
    if (!t.mes) continue
    if (!mesMap[t.mes]) mesMap[t.mes] = { total: 0, fallas: 0 }
    mesMap[t.mes].total++
    if (t.es_falla === 'Si') mesMap[t.mes].fallas++
  }
  const tendencia = Object.entries(mesMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, v]) => ({
      mes,
      label: new Date(mes + '-15').toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      total: v.total,
      fallas: v.fallas,
      otros: v.total - v.fallas,
    }))

  return {
    topClientes,
    porCategoria,
    reincidentes,
    tendencia,
    totalTickets: _allTickets.length,
    totalFallas:  _allTickets.filter(t => t.es_falla === 'Si').length,
  }
})()

// ═════════════════════════════════════════════════════════════════════════════
export default async function DashboardPage() {
  const h = headers()
  const rol          = h.get('x-user-rol') ?? 'viewer'
  const asesorHeader = decodeURIComponent(h.get('x-user-asesor') ?? '')
  const isAsesor     = rol === 'asesor' && !!asesorHeader

  // semana_inicio de hace 3 semanas (para traer 4 semanas de actividades SAC)
  const getMondayOffset = (offsetWeeks: number): string => {
    const d = new Date(); d.setHours(0,0,0,0)
    const dow = d.getDay()
    d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow) - offsetWeeks * 7)
    return d.toISOString().slice(0, 10)
  }
  const semana3back = getMondayOffset(3)

  const [kpis, semaforoAsesor, allCuentas, actsRaw, adopRows] = await Promise.all([
    getKPIs(), getSemaforoByAsesor(),
    getCuentas(isAsesor ? { asesor: asesorHeader } : undefined),
    getActividadesSAC(semana3back),
    getAdopcionProductoAll(),
  ])

  // Último nivel registrado por cuenta+producto (puede haber historial)
  const adopMap = new Map<string, Map<string, AdopcionRow>>()
  adopRows.forEach(r => {
    if (!adopMap.has(r.cuenta_id)) adopMap.set(r.cuenta_id, new Map())
    const porProducto = adopMap.get(r.cuenta_id)!
    const actual = porProducto.get(r.producto)
    if (!actual || r.created_at > actual.created_at) porProducto.set(r.producto, r)
  })

  // Solo activas + en_riesgo para análisis
  const cuentas = allCuentas.filter(c => c.estado === 'activo' || c.estado === 'en_riesgo')

  // Distribución semáforo global
  const dist = { verde: 0, azul: 0, amarillo: 0, naranja: 0, rojo: 0 }
  cuentas.forEach(c => { dist[getSemaforo(c.health_score)]++ })

  // ── Cobertura de auditoría ────────────────────────────────────────────────
  const auditSet = new Set(
    AUDITORIA_REFS.flatMap(r => r.consecutivos.map(c => c.toUpperCase()))
  )
  const cuentasAuditadas  = cuentas.filter(c => c.consecutivo && auditSet.has(c.consecutivo.toUpperCase()))
  const cuentasSinAudit   = cuentas.length - cuentasAuditadas.length
  const auditCovPct       = Math.round((cuentasAuditadas.length / Math.max(cuentas.length, 1)) * 100)
  // MRR de cuentas sin auditar — son el "punto ciego"
  const facSinAudit       = cuentas
    .filter(c => !(c.consecutivo && auditSet.has(c.consecutivo.toUpperCase())))
    .reduce((s, c) => s + (c.facturacion ?? 0), 0)

  // SAC semanal — agrupa ACTIVIDADES completadas de la tabla `actividades`
  // weekKeys[0]=esta semana (lunes), [1]=hace 1 sem, [2]=hace 2 sem, [3]=hace 3 sem
  const weekKeys = [0, 1, 2, 3].map(i => getMondayOffset(i))
  const segsMap: Record<string, number[]> = {}
  const ASESORES_LIST: Asesor[] = ['Fátima', 'Dan', 'Claudia']
  ASESORES_LIST.forEach(a => { segsMap[a] = [0, 0, 0, 0] })
  actsRaw.forEach(act => {
    if (!act.completada) return
    const idx = weekKeys.indexOf(act.semana_inicio)
    if (idx === -1) return
    if (segsMap[act.asesor]) segsMap[act.asesor][idx]++
  })

  // Stats por asesor
  const ASESORES: Asesor[] = ['Fátima', 'Dan', 'Claudia']
  const asesorStats: AsesorStats[] = ASESORES.map(a => {
    const ac = cuentas.filter(c => c.asesor === a)
    const totalAsignadas = allCuentas.filter(c => c.asesor === a).length
    return computeAsesorStats(a, ac, auditSet, adopMap, totalAsignadas)
  }).filter(s => s.cuentas.length > 0)

  // Top 10 riesgo con tickets
  const topRiesgo = [...cuentas]
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 10)
    .map(c => {
      const r = getTicketsByCuenta(c.cid ?? null, c.empresa)
      return { ...c, zoho_tickets: { total: r.total, fallas: r.rows.filter(t => t.es_falla === 'Si').length, ultima: r.rows[0]?.fecha ?? null } }
    })

  const topRiesgoTix    = topRiesgo.reduce((s, c) => s + (c.zoho_tickets?.total  ?? 0), 0)
  const topRiesgoFallas = topRiesgo.reduce((s, c) => s + (c.zoho_tickets?.fallas ?? 0), 0)

  // Datos para DashMetricasSection
  const activas       = cuentas.filter(c => c.estado === 'activo')
  const churnRiesgo   = activas.filter(c => c.health_score < 40)
  const cuentasObs    = cuentas.filter(c => getSemaforo(c.health_score) === 'amarillo')
  const facObs        = cuentasObs.reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const conUpsell     = activas.filter(c => c.upsell_producto || c.crossell_producto).length

  const top10Fac = [...activas].sort((a, b) => b.facturacion - a.facturacion).slice(0, 10)
    .map(c => ({ empresa: c.empresa, facturacion: c.facturacion, consecutivo: c.consecutivo ?? '' }))
  const churnRows = churnRiesgo.sort((a, b) => a.health_score - b.health_score)
    .map(c => ({ id: c.id, consecutivo: c.consecutivo ?? '', empresa: c.empresa, asesor: c.asesor, facturacion: c.facturacion, health_score: c.health_score, dias_sin_actividad: c.dias_sin_actividad }))

  // ── Alertas críticas: datos faltantes + cuentas sin contacto ──────────────
  // Una cuenta entra a la alerta si le falta al menos un dato relevante para
  // operarla, o si lleva más de 30 días sin un seguimiento registrado.
  const alertasCriticas = cuentas.map(c => {
    const faltantes = computeFaltantes(c)
    const diasSinContacto = diasSinContactoDe(c)

    return {
      id: String(c.id),
      consecutivo: c.consecutivo ?? '',
      empresa: c.empresa,
      asesor: c.asesor ?? null,
      facturacion: c.facturacion ?? 0,
      diasSinContacto,
      faltantes,
    }
  }).filter(c => c.faltantes.length > 0 || c.diasSinContacto === null || c.diasSinContacto > 30)

  // ── Top Cuentas — ranking versátil (13 dimensiones seleccionables) ────────
  const rankRows: CuentaRank[] = cuentas.map(c => {
    const tix = getTicketsByCuenta(c.cid ?? null, c.empresa)
    const porProducto = adopMap.get(c.id)
    let adopcionPct: number | null = null
    if (porProducto) {
      const scores = Array.from(porProducto.values())
        .filter(r => r.nivel !== 'no_aplica')
        .map(r => r.nivel === 'alto' ? 100 : r.nivel === 'medio' ? 50 : 0)
      if (scores.length > 0) adopcionPct = avg(scores)
    }
    return {
      id: String(c.id),
      consecutivo: c.consecutivo ?? '',
      empresa: c.empresa,
      asesor: c.asesor ?? null,
      facturacion: c.facturacion ?? 0,
      healthScore: c.health_score ?? 50,
      activoDesde: c.activo_desde,
      diasSinContacto: diasSinContactoDe(c),
      ticketsTotal: tix.total,
      ticketsFallas: tix.rows.filter(t => t.es_falla === 'Si').length,
      upsellValor: c.valor_upsell_estimado ?? 0,
      adopcionPct,
      faltantesCount: computeFaltantes(c).length,
    }
  })

  const nowISO = new Date().toISOString()

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AutoRefresh intervalMs={300_000} showIndicator={false} />

      <PageHeader
        title="Dashboard Customer Success"
        subtitle={new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={
          <div className="flex items-center gap-3">
            <AutoRefresh intervalMs={300_000} showIndicator />
            <Link href="/reuniones" className="cp-btn cp-btn-primary">
              <CalendarDays size={14} /> Reuniones
            </Link>
          </div>
        }
      />

      {/* ── Banners fichas pendientes ────────────────────────────────────── */}
      {(kpis.faltaTC > 0 || kpis.faltaHS > 0) && (
        <div className="mx-6 mb-4 flex flex-wrap gap-3">
          {kpis.faltaTC > 0 && (
            <Link href="/cuentas?warning=FALTA_TC" className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ border: '1px solid rgba(249,115,22,0.35)', background: 'rgba(249,115,22,0.10)', color: '#FB923C' }}>
              <AlertCircle size={14} /> {kpis.faltaTC} cuentas sin ficha Top Customer
            </Link>
          )}
          {kpis.faltaHS > 0 && (
            <Link href="/cuentas?warning=FALTA_HS" className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ border: '1px solid rgba(234,179,8,0.35)', background: 'rgba(234,179,8,0.10)', color: '#EAB308' }}>
              <AlertCircle size={14} /> {kpis.faltaHS} cuentas sin Health Score Callpicker
            </Link>
          )}
        </div>
      )}

      {/* ══ §1 Cumplimiento SAC Semanal ════════════════════════════════════ */}
      <div className="px-6 pb-5">
        <SACWeeklyPanel asesores={asesorStats} segsMap={segsMap} />
      </div>

      {/* ══ §2 Alertas Críticas · datos faltantes y sin contacto ══════════ */}
      <DashAlertasCriticas cuentas={alertasCriticas} totalCuentas={cuentas.length} />

      {/* ══ §3 Diagnóstico de Perfiles ════════════════════════════════════ */}
      <div className="px-6 pb-5">
        <PerfilDistPanel asesores={asesorStats} />
      </div>

      {/* ══ §4 KPIs principales ════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 px-6 pb-5">
        {/* KPI Auditoría — TOP para anticipar churn */}
        <div style={{
          background: `linear-gradient(145deg, ${PANEL} 0%, rgba(5,13,26,0.95) 100%)`,
          border: `1px solid ${auditCovPct >= 30 ? '#22C55E' : auditCovPct >= 15 ? '#EAB30888' : '#EF444444'}`,
          borderRadius: 16, padding: '20px',
          position: 'relative', overflow: 'hidden',
          boxShadow: `0 0 28px ${auditCovPct >= 30 ? '#22C55E' : '#EF4444'}0F, 0 4px 16px rgba(0,0,0,0.4)`,
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderBottomLeftRadius: '100%', pointerEvents: 'none', background: `radial-gradient(circle at top right, ${auditCovPct >= 30 ? '#22C55E' : '#EF4444'}15 0%, transparent 70%)` }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${auditCovPct >= 30 ? '#22C55E' : '#EF4444'}18`, border: `1px solid ${auditCovPct >= 30 ? '#22C55E' : '#EF4444'}30` }}>
              <Target size={15} style={{ color: auditCovPct >= 30 ? '#22C55E' : '#EF4444' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: TX_LOW }}>Cobertura Auditoría</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
            <p style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', color: TX_HI }}>
              {cuentasAuditadas.length}
              <span style={{ fontSize: 14, fontWeight: 400, color: TX_LOW }}> / {cuentas.length}</span>
            </p>
            <span style={{ fontSize: 13, fontWeight: 800, color: auditCovPct >= 30 ? '#22C55E' : '#EF4444' }}>{auditCovPct}%</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${auditCovPct}%`, background: auditCovPct >= 30 ? '#22C55E' : auditCovPct >= 15 ? '#EAB308' : '#EF4444', boxShadow: `0 0 6px ${auditCovPct >= 30 ? '#22C55E' : '#EF4444'}60` }} />
          </div>
          <p style={{ fontSize: 12, color: TX_MID, lineHeight: 1.5 }}>
            {cuentasSinAudit > 0
              ? <><span style={{ color: '#F97316', fontWeight: 700 }}>{cuentasSinAudit} sin analizar</span> · {formatMXN(facSinAudit)} punto ciego</>
              : <span style={{ color: '#22C55E' }}>Cartera totalmente cubierta</span>
            }
          </p>
          <Link href="/auditoria" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: CYAN, fontWeight: 600, textDecoration: 'none' }} className="hover:underline">
            Ver auditorías <ArrowUpRight size={12} />
          </Link>
        </div>

        <KpiCard label="Cartera Total" value={formatMXN(kpis.facturacionTotal)} sub={`${kpis.total} cuentas activas`} icon={DollarSign} accent={CYAN} />
        <KpiCard label="Cuentas Saludables" value={kpis.saludables} sub={`${Math.round((kpis.saludables / Math.max(kpis.total, 1)) * 100)}% de la cartera`} icon={CheckCircle2} accent="#22C55E" />
        <KpiCard label="En Observación" value={cuentasObs.length} sub={`${formatMXN(facObs)} en seguimiento`} icon={AlertTriangle} accent="#EAB308" />
        <KpiCard label="Oportunidades" value={conUpsell} sub="Upsell / Cross-sell activas" icon={TrendingUp} accent="#A855F7" />
      </div>

      {/* ══ §5 Tacómetros por Asesor ═══════════════════════════════════════ */}
      <div className="px-6 pb-2">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: TX_LOW }}>
            Salud Promedio por Asesor
          </p>
          <span style={{ fontSize: 12, color: TX_LOW }}>— Health Score promedio de toda la cartera</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {asesorStats.map(st => <GaugeCard key={st.asesor} st={st} />)}
        </div>
      </div>

      {/* ══ §6 Análisis detallado por Asesor ══════════════════════════════ */}
      <div className="px-6 pb-5">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: TX_LOW }}>
            Análisis por Asesor
          </p>
          <span style={{ fontSize: 12, color: TX_LOW }}>— sub-scores, adopción de producto, completitud de fichas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {asesorStats.map(st => <AsesorDetailCard key={st.asesor} st={st} />)}
        </div>
      </div>

      {/* ══ §7 Matriz adopción + completitud ══════════════════════════════ */}
      <div className="px-6 pb-5">
        <Panel>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <PanelTitle>Matriz de Adopción · Resumen comparativo</PanelTitle>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: TX_LOW }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} /> ≥60% Bueno</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EAB308', display: 'inline-block' }} /> ≥30% Parcial</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} /> &lt;30% Alerta</span>
            </div>
          </div>
          <AdopcionMatrix asesores={asesorStats} />
        </Panel>
      </div>

      {/* ══ §8 Semáforo + Distribución ════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 pb-5">
        <Panel className="lg:col-span-2">
          <PanelTitle>Semáforo por Asesor</PanelTitle>
          <SemaforoDashChart data={semaforoAsesor} />
        </Panel>
        <Panel>
          <PanelTitle>Distribución General</PanelTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(Object.entries(dist) as [string, number][]).map(([key, count]) => {
              const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: SEM_COLOR[key] }}>{SEM_LABEL[key]}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TX_HI }}>{count} <span style={{ fontWeight: 400, color: TX_LOW }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: SEM_COLOR[key], boxShadow: `0 0 6px ${SEM_COLOR[key]}60` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER2}` }}>
            {semaforoAsesor.map(a => (
              <div key={a.asesor} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TX_MID }}>{a.asesor}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: TX_HI }}>{formatMXN(a.facturacion_total)}</span>
                </div>
                <p style={{ fontSize: 12, color: TX_LOW }}>{a.total} cuentas · {formatMXN(a.facturacion_en_riesgo)} en riesgo</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ══ §9 Tendencia por Asesor ════════════════════════════════════════ */}
      <div className="px-6 pb-5">
        <Panel>
          <PanelTitle>Distribución por Asesor · Rango de Salud</PanelTitle>
          <p style={{ fontSize: 13, color: TX_MID, marginBottom: 16, marginTop: -8 }}>
            Cuentas e importe por semáforo — alterna entre vista de cantidad e importe facturado
          </p>
          <AsesorLineasChart data={semaforoAsesor} />
        </Panel>
      </div>

      {/* ══ §10 Top Cuentas en Riesgo ═══════════════════════════════════════ */}
      <div className="px-6 pb-5">
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: `1px solid ${BORDER2}` }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: TX_MID }}>Top Cuentas en Riesgo</p>
              <p style={{ fontSize: 11, color: TX_LOW, marginTop: 2 }}>Las 10 cuentas con menor Health Score · tickets desde Zoho Desk</p>
            </div>
            <Link href="/cuentas" style={{ fontSize: 12, color: CYAN, fontWeight: 600, textDecoration: 'none' }} className="hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight size={11} />
            </Link>
          </div>
          <TopRiesgoTable cuentas={topRiesgo} dark />
          <div style={{ padding: '10px 20px', borderTop: `1px solid ${BORDER2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: TX_LOW }}>Mostrando 10 cuentas de menor Health Score</span>
            {topRiesgoTix > 0 && (
              <span style={{ fontSize: 11, color: TX_LOW, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Ticket size={10} /> {topRiesgoTix} tickets {topRiesgoFallas > 0 && <span style={{ color: '#EF4444', fontWeight: 700 }}>· {topRiesgoFallas} fallas</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══ §11a Top Cuentas — Ranking Versátil ═════════════════════════════ */}
      <TopCuentasVersatil data={rankRows} />

      {/* ══ §11b Métricas ════════════════════════════════════════════════════ */}
      <DashMetricasSection
        kpis={{ totalCuentas: activas.length }}
        top10={top10Fac}
        churnRows={churnRows}
        updatedAt={nowISO}
      />

      {/* ══ §12 Análisis de Tickets · Zoho Desk ══════════════════ */}
      <div className="mx-6 mb-5 px-5 py-3 rounded-xl flex flex-wrap items-center gap-x-8 gap-y-2"
        style={{ background: PANEL2, border: `1px solid ${BORDER2}` }}>
        <div className="flex items-center gap-2">
          <Ticket size={13} style={{ color: CYAN }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: TX_MID }}>Tickets Zoho Desk</span>
          <span style={{ fontSize: 12, color: TX_LOW }}>· datos al {fmtFecha(globalTickets.ultima)}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span style={{ fontSize: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: TX_HI }}>{globalTickets.total.toLocaleString()}</span>
            <span style={{ color: TX_LOW, marginLeft: 4 }}>tickets totales</span>
          </span>
          <span style={{ fontSize: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>{globalTickets.fallas}</span>
            <span style={{ color: TX_LOW, marginLeft: 4 }}>fallas</span>
          </span>
          {topRiesgoTix > 0 && (
            <span style={{ fontSize: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#F97316' }}>{topRiesgoTix}</span>
              <span style={{ color: TX_LOW, marginLeft: 4 }}>en top 10 riesgo</span>
              {topRiesgoFallas > 0 && (
                <span style={{ marginLeft: 8, padding: '2px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 12, fontWeight: 700 }}>
                  {topRiesgoFallas} fallas
                </span>
              )}
            </span>
          )}
          <Link href="/tickets" style={{ fontSize: 12, color: CYAN, fontWeight: 600, textDecoration: 'none' }} className="hover:underline flex items-center gap-1">
            Ver todos <ArrowUpRight size={11} />
          </Link>
          <a href="https://ayuda.callpicker.com/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F766E] hover:bg-[#0D9488] text-white shadow-sm transition-all duration-150">
            <LifeBuoy size={13} /> Centro de Ayuda
          </a>
        </div>
      </div>

      {/* ══ §12b Tickets Analytics ══════════════════════════════════════════ */}
      <div className="px-6 mb-5">
        <TicketsAnalyticsChart data={ticketsAnalytics} />
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="px-6 pb-6 pt-2 flex items-center gap-2 text-[10px] text-textLow">
        <span className="text-cp font-bold">CALLPICKER CUSTOMER SUCCESS</span>
        <span>·</span>
        <span>Datos en tiempo real · force-dynamic · auto-refresh 5 min</span>
        <span>·</span>
        <span>{new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>
    </div>
  )
}
