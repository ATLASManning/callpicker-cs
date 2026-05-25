import {
  Users, DollarSign, AlertTriangle, TrendingUp,
  CalendarDays, CheckCircle2, AlertCircle, Ticket, LifeBuoy,
  ArrowUpRight,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SemaforoDashChart from '@/components/charts/SemaforoDashChart'
import TopRiesgoTable from '@/components/TopRiesgoTable'
import AutoRefresh from '@/components/AutoRefresh'
import DashMetricasSection from '@/components/DashMetricasSection'
import { getKPIs, getSemaforoByAsesor, getCuentas } from '@/lib/supabase'
import { formatMXN, getSemaforo } from '@/lib/types'
import { getTicketsByCuenta } from '@/lib/cuenta-data'
import Link from 'next/link'
import rawTickets from '@/lib/tickets-data.json'

export const dynamic = 'force-dynamic'

// ── Paleta azul marino — igual que AsesorCard ─────────────────────────────────
const BG      = '#0A1628'
const PANEL   = '#0F2040'
const PANEL2  = '#0D1B35'
const BORDER  = 'rgba(255,255,255,0.10)'
const BORDER2 = 'rgba(255,255,255,0.06)'
const TX_HI   = '#FFFFFF'
const TX_MID  = 'rgba(255,255,255,0.70)'
const TX_LOW  = 'rgba(255,255,255,0.45)'
const CYAN    = '#00B4FF'

// ── Semáforo colores ──────────────────────────────────────────────────────────
const SEM_COLOR: Record<string, string> = {
  verde: '#22C55E', azul: '#3B82F6', amarillo: '#EAB308',
  naranja: '#F97316', rojo: '#EF4444',
}
const SEM_LABEL: Record<string, string> = {
  verde: 'Saludable', azul: 'Estable', amarillo: 'Observación',
  naranja: 'En Riesgo', rojo: 'Riesgo Alto',
}

// ── Tickets globales ──────────────────────────────────────────────────────────
interface TicketRaw { es_falla: string; fecha: string }
const _allTickets = rawTickets as TicketRaw[]
const globalTickets = {
  total:  _allTickets.length,
  fallas: _allTickets.filter(t => t.es_falla === 'Si').length,
  ultima: _allTickets.reduce((acc, t) => t.fecha > acc ? t.fecha : acc, ''),
}

function fmtFecha(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

// ── KPI Card oscura ───────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string | number; sub: string
  icon: React.ElementType; accent: string
}) {
  return (
    <div style={{
      background: `linear-gradient(145deg, ${PANEL} 0%, rgba(5,13,26,0.95) 100%)`,
      border: `1px solid ${accent}22`,
      borderRadius: 16,
      padding: '20px 20px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 0 24px ${accent}0D, 0 4px 16px rgba(0,0,0,0.4)`,
    }}>
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        borderBottomLeftRadius: '100%', pointerEvents: 'none',
        background: `radial-gradient(circle at top right, ${accent}15 0%, transparent 70%)`,
      }} />
      {/* Icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${accent}18`, border: `1px solid ${accent}30`,
        }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: TX_LOW,
        }}>{label}</span>
      </div>
      {/* Value */}
      <p style={{
        fontSize: 26, fontWeight: 900, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em', color: TX_HI,
        marginBottom: 6,
      }}>{value}</p>
      <p style={{ fontSize: 11, color: TX_MID, lineHeight: 1.4 }}>{sub}</p>
    </div>
  )
}

// ── Panel genérico oscuro ─────────────────────────────────────────────────────
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{
      background: PANEL,
      border: `1px solid ${BORDER}`,
      borderRadius: 16,
      padding: 20,
    }}>
      {children}
    </div>
  )
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.10em',
      color: TX_MID, marginBottom: 16,
    }}>{children}</p>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default async function DashboardPage() {
  const [kpis, semaforoAsesor, cuentas] = await Promise.all([
    getKPIs(), getSemaforoByAsesor(), getCuentas(),
  ])

  // Distribución semáforo
  const dist = { verde: 0, azul: 0, amarillo: 0, naranja: 0, rojo: 0 }
  cuentas.forEach(c => { dist[getSemaforo(c.health_score)]++ })

  // Top 10 riesgo con tickets
  const topRiesgo = [...cuentas]
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 10)
    .map(c => {
      const r = getTicketsByCuenta(c.cid ?? null, c.empresa)
      return {
        ...c,
        zoho_tickets: {
          total:  r.total,
          fallas: r.rows.filter(t => t.es_falla === 'Si').length,
          ultima: r.rows[0]?.fecha ?? null,
        },
      }
    })

  const topRiesgoTix    = topRiesgo.reduce((s, c) => s + (c.zoho_tickets?.total  ?? 0), 0)
  const topRiesgoFallas = topRiesgo.reduce((s, c) => s + (c.zoho_tickets?.fallas ?? 0), 0)

  // Observación y Oportunidades
  const cuentasObs   = cuentas.filter(c => getSemaforo(c.health_score) === 'amarillo')
  const facObs       = cuentasObs.reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const conUpsell    = cuentas.filter(c => c.upsell_producto || c.crossell_producto).length

  // Datos Métricas
  const activas        = cuentas.filter(c => c.estado === 'activo')
  const churnRiesgo    = activas.filter(c => c.health_score < 40)
  const facChurn       = churnRiesgo.reduce((s, c) => s + c.facturacion, 0)
  const conUpsellOnly  = activas.filter(c => c.upsell_producto)
  const conCross       = activas.filter(c => c.crossell_producto)
  const valorUpsell    = activas.reduce((s, c) => s + (c.valor_upsell_estimado ?? 0), 0)
  const retencionPct   = activas.length > 0
    ? Math.round(((activas.length - churnRiesgo.length) / activas.length) * 100) : 0

  const top10Fac = [...activas]
    .sort((a, b) => b.facturacion - a.facturacion)
    .slice(0, 10)
    .map(c => ({ empresa: c.empresa, facturacion: c.facturacion, consecutivo: c.consecutivo ?? '' }))

  const churnRows = churnRiesgo
    .sort((a, b) => a.health_score - b.health_score)
    .map(c => ({
      id: c.id, consecutivo: c.consecutivo ?? '', empresa: c.empresa,
      asesor: c.asesor, facturacion: c.facturacion,
      health_score: c.health_score, dias_sin_actividad: c.dias_sin_actividad,
    }))

  // Resumen Top Customer por asesor
  const topRanges:  Record<string, number> = { F: 46, D: 48, C: 47 }
  const prefixAsesor: Record<string, string> = { F: 'Fátima', D: 'Dan', C: 'Claudia' }
  const topFac: Record<string, number> = {}
  cuentas.forEach(c => {
    if (!c.consecutivo) return
    const prefix = c.consecutivo[0]
    const num = parseInt(c.consecutivo.slice(1), 10)
    if (topRanges[prefix] && num >= 1 && num <= topRanges[prefix]) {
      const a = prefixAsesor[prefix]
      topFac[a] = (topFac[a] || 0) + (c.facturacion || 0)
    }
  })

  const nowISO = new Date().toISOString()

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AutoRefresh intervalMs={300_000} showIndicator={false} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard Customer Success"
        subtitle={new Date().toLocaleDateString('es-MX', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })}
        actions={
          <div className="flex items-center gap-3">
            <AutoRefresh intervalMs={300_000} showIndicator />
            <Link href="/reuniones" className="cp-btn cp-btn-primary">
              <CalendarDays size={14} /> Reuniones
            </Link>
          </div>
        }
      />

      {/* ── Banners fichas pendientes ──────────────────────────────────────── */}
      {(kpis.faltaTC > 0 || kpis.faltaHS > 0) && (
        <div className="mx-6 mb-4 flex flex-wrap gap-3">
          {kpis.faltaTC > 0 && (
            <Link href="/cuentas?warning=FALTA_TC"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{
                border: '1px solid rgba(249,115,22,0.35)',
                background: 'rgba(249,115,22,0.10)',
                color: '#FB923C',
              }}>
              <AlertCircle size={14} /> {kpis.faltaTC} cuentas sin ficha Top Customer
            </Link>
          )}
          {kpis.faltaHS > 0 && (
            <Link href="/cuentas?warning=FALTA_HS"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{
                border: '1px solid rgba(234,179,8,0.35)',
                background: 'rgba(234,179,8,0.10)',
                color: '#EAB308',
              }}>
              <AlertCircle size={14} /> {kpis.faltaHS} cuentas sin Health Score Callpicker
            </Link>
          )}
        </div>
      )}

      {/* ══ §1 KPIs principales ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 pb-5">
        <KpiCard label="Cartera Total"
          value={formatMXN(kpis.facturacionTotal)}
          sub={`${kpis.total} cuentas activas`}
          icon={DollarSign} accent={CYAN} />
        <KpiCard label="Cuentas Saludables"
          value={kpis.saludables}
          sub={`${Math.round((kpis.saludables / kpis.total) * 100)}% de la cartera`}
          icon={CheckCircle2} accent="#22C55E" />
        <KpiCard label="En Observación"
          value={cuentasObs.length}
          sub={`${formatMXN(facObs)} en seguimiento`}
          icon={AlertTriangle} accent="#EAB308" />
        <KpiCard label="Oportunidades"
          value={conUpsell}
          sub="Upsell / Cross-sell activas"
          icon={TrendingUp} accent="#A855F7" />
      </div>

      {/* ══ §2 Tickets Zoho Desk ══════════════════════════════════════════════ */}
      <div className="mx-6 mb-5 px-5 py-3 rounded-xl flex flex-wrap items-center gap-x-8 gap-y-2"
        style={{ background: PANEL2, border: `1px solid ${BORDER2}` }}>
        <div className="flex items-center gap-2">
          <Ticket size={13} style={{ color: CYAN }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: TX_MID }}>Tickets Zoho Desk</span>
          <span style={{ fontSize: 10, color: TX_LOW }}>· datos al {fmtFecha(globalTickets.ultima)}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span style={{ fontSize: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: TX_HI }}>
              {globalTickets.total.toLocaleString()}
            </span>
            <span style={{ color: TX_LOW, marginLeft: 4 }}>tickets totales</span>
          </span>
          <span style={{ fontSize: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#EF4444' }}>
              {globalTickets.fallas}
            </span>
            <span style={{ color: TX_LOW, marginLeft: 4 }}>fallas registradas</span>
          </span>
          {topRiesgoTix > 0 && (
            <span style={{ fontSize: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#F97316' }}>
                {topRiesgoTix}
              </span>
              <span style={{ color: TX_LOW, marginLeft: 4 }}>tickets en top 10 riesgo</span>
              {topRiesgoFallas > 0 && (
                <span style={{
                  marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '2px 7px', borderRadius: 99,
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#EF4444', fontSize: 10, fontWeight: 700,
                }}>
                  <AlertTriangle size={9} /> {topRiesgoFallas} fallas
                </span>
              )}
            </span>
          )}
          <Link href="/tickets"
            style={{ fontSize: 12, color: CYAN, fontWeight: 600, textDecoration: 'none' }}
            className="hover:underline flex items-center gap-1">
            Ver todos <ArrowUpRight size={11} />
          </Link>
          <a href="https://ayuda.callpicker.com/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
              bg-[#0F766E] hover:bg-[#0D9488] text-white shadow-sm transition-all duration-150">
            <LifeBuoy size={13} /> Centro de Ayuda
          </a>
        </div>
      </div>

      {/* ══ §3 Semáforo + Distribución ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 pb-5">

        {/* Semáforo por asesor */}
        <Panel className="lg:col-span-2">
          <PanelTitle>Semáforo por Asesor</PanelTitle>
          <SemaforoDashChart data={semaforoAsesor} />
        </Panel>

        {/* Distribución general */}
        <Panel>
          <PanelTitle>Distribución General</PanelTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(Object.entries(dist) as [string, number][]).map(([key, count]) => {
              const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: SEM_COLOR[key] }}>
                      {SEM_LABEL[key]}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TX_HI }}>
                      {count} <span style={{ fontWeight: 400, color: TX_LOW }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{
                    height: 5, borderRadius: 99,
                    background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${pct}%`, background: SEM_COLOR[key],
                      boxShadow: `0 0 6px ${SEM_COLOR[key]}60`,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen por asesor */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER2}` }}>
            {semaforoAsesor.map(a => (
              <div key={a.asesor} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: TX_MID }}>{a.asesor}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#FBBF24' }}>⭐ Top</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: TX_HI, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMXN(a.facturacion_total)}
                  </span>
                </div>
                {topFac[a.asesor] && (
                  <p style={{ fontSize: 10, color: TX_LOW }}>
                    Top Customer: {formatMXN(topFac[a.asesor])}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ══ §4 Top Cuentas en Riesgo ══════════════════════════════════════════ */}
      <div className="px-6 pb-5">
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`,
          borderRadius: 16, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px 12px', borderBottom: `1px solid ${BORDER2}`,
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: TX_MID }}>
                Top Cuentas en Riesgo
              </p>
              <p style={{ fontSize: 11, color: TX_LOW, marginTop: 2 }}>
                Las 10 cuentas con menor Health Score · tickets conectados desde Zoho Desk
              </p>
            </div>
            <Link href="/cuentas"
              style={{ fontSize: 12, color: CYAN, fontWeight: 600, textDecoration: 'none' }}
              className="hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight size={11} />
            </Link>
          </div>

          <TopRiesgoTable cuentas={topRiesgo} dark />

          {/* Footer */}
          <div style={{
            padding: '10px 20px', borderTop: `1px solid ${BORDER2}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: TX_LOW }}>Mostrando 10 cuentas de menor Health Score</span>
            {topRiesgoTix > 0 && (
              <span style={{ fontSize: 11, color: TX_LOW, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Ticket size={10} />
                {topRiesgoTix} tickets
                {topRiesgoFallas > 0 && (
                  <span style={{ color: '#EF4444', fontWeight: 700 }}>· {topRiesgoFallas} fallas</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══ §5 Métricas ═══════════════════════════════════════════════════════ */}
      <DashMetricasSection
        kpis={{
          facturacionRiesgo: facChurn,
          churnCount:        churnRiesgo.length,
          valorUpsell,
          upsellCount:       conUpsellOnly.length,
          crossCount:        conCross.length,
          retencionPct,
          totalCuentas:      activas.length,
        }}
        top10={top10Fac}
        churnRows={churnRows}
        updatedAt={nowISO}
      />

      {/* ── Footer de página ──────────────────────────────────────────────── */}
      <div className="px-6 pb-6 pt-2 flex items-center gap-2 text-[10px] text-textLow">
        <span className="text-cp font-bold">CALLPICKER CUSTOMER SUCCESS</span>
        <span>·</span>
        <span>Datos sincronizados en tiempo real · force-dynamic · auto-refresh 5 min</span>
        <span>·</span>
        <span>{new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>
    </div>
  )
}
