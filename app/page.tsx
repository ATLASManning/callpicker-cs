import {
  Users, DollarSign, AlertTriangle, TrendingUp,
  CalendarDays, CheckCircle2, AlertCircle, Ticket, LifeBuoy,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
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

// ── Stats globales de tickets ─────────────────────────────────────────────────
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

export default async function DashboardPage() {
  const [kpis, semaforoAsesor, cuentas] = await Promise.all([
    getKPIs(),
    getSemaforoByAsesor(),
    getCuentas(),
  ])

  // ── Distribución semáforo ─────────────────────────────────────────────────
  const dist = { verde: 0, azul: 0, amarillo: 0, naranja: 0, rojo: 0 }
  cuentas.forEach(c => { dist[getSemaforo(c.health_score)]++ })

  // ── Top 10 cuentas en riesgo (menor HS) con tickets reales ───────────────
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

  const topRiesgoTicketsTotal  = topRiesgo.reduce((s, c) => s + (c.zoho_tickets?.total  ?? 0), 0)
  const topRiesgoTicketsFallas = topRiesgo.reduce((s, c) => s + (c.zoho_tickets?.fallas ?? 0), 0)

  // ── Cuentas en Observación (amarillo: HS 40-59) ───────────────────────────
  const cuentasObservacion      = cuentas.filter(c => getSemaforo(c.health_score) === 'amarillo')
  const facturacionObservacion  = cuentasObservacion.reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const conUpsell               = cuentas.filter(c => c.upsell_producto || c.crossell_producto).length

  // ── Datos para la sección Métricas ───────────────────────────────────────
  const activas          = cuentas.filter(c => c.estado === 'activo')
  const churnRiesgo      = activas.filter(c => c.health_score < 40)
  const facturacionChurn = churnRiesgo.reduce((s, c) => s + c.facturacion, 0)
  const conUpsellOnly    = activas.filter(c => c.upsell_producto)
  const conCross         = activas.filter(c => c.crossell_producto)
  const valorUpsell      = activas.reduce((s, c) => s + (c.valor_upsell_estimado ?? 0), 0)
  const retencionPct     = activas.length > 0
    ? Math.round(((activas.length - churnRiesgo.length) / activas.length) * 100) : 0

  const top10Fac = [...activas]
    .sort((a, b) => b.facturacion - a.facturacion)
    .slice(0, 10)
    .map(c => ({ empresa: c.empresa, facturacion: c.facturacion, consecutivo: c.consecutivo ?? '' }))

  const churnRows = churnRiesgo
    .sort((a, b) => a.health_score - b.health_score)
    .map(c => ({
      id:                  c.id,
      consecutivo:         c.consecutivo ?? '',
      empresa:             c.empresa,
      asesor:              c.asesor,
      facturacion:         c.facturacion,
      health_score:        c.health_score,
      dias_sin_actividad:  c.dias_sin_actividad,
    }))

  // Resumen por asesor para el card de distribución
  const topRanges: Record<string, number>  = { F: 46, D: 38, C: 43 }
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

  // ── SEMÁFORO config para distribución ────────────────────────────────────
  const semColors: Record<string, string> = {
    verde: '#22C55E', azul: '#3B82F6', amarillo: '#EAB308',
    naranja: '#F97316', rojo: '#EF4444',
  }
  const semLabels: Record<string, string> = {
    verde: 'Saludable', azul: 'Estable', amarillo: 'Observación',
    naranja: 'En Riesgo', rojo: 'Riesgo Alto',
  }

  return (
    <div className="min-h-screen">

      {/* Auto-refresh cada 5 minutos */}
      <AutoRefresh intervalMs={300_000} showIndicator={false} />

      <PageHeader
        title="Dashboard Customer Success"
        subtitle={new Date().toLocaleDateString('es-MX', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })}
        actions={
          <div className="flex items-center gap-3">
            <AutoRefresh intervalMs={300_000} showIndicator={true} />
            <Link href="/reuniones" className="cp-btn cp-btn-primary">
              <CalendarDays size={14} /> Reuniones
            </Link>
          </div>
        }
      />

      {/* ── Banners de fichas pendientes ──────────────────────────────────── */}
      {(kpis.faltaTC > 0 || kpis.faltaHS > 0) && (
        <div className="mx-6 mb-4 flex flex-wrap gap-3">
          {kpis.faltaTC > 0 && (
            <Link href="/cuentas?warning=FALTA_TC"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/40
                bg-orange-500/10 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-colors">
              <AlertCircle size={14} />
              {kpis.faltaTC} cuentas sin ficha Top Customer
            </Link>
          )}
          {kpis.faltaHS > 0 && (
            <Link href="/cuentas?warning=FALTA_HS"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-500/40
                bg-yellow-500/10 text-yellow-500 text-xs font-semibold hover:bg-yellow-500/20 transition-colors">
              <AlertCircle size={14} />
              {kpis.faltaHS} cuentas sin Health Score Callpicker
            </Link>
          )}
        </div>
      )}

      {/* ══ SECCIÓN 1: KPIs principales ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 pb-5">
        <StatCard
          label="Cartera Total"
          value={formatMXN(kpis.facturacionTotal)}
          sub={`${kpis.total} cuentas activas`}
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          label="Cuentas Saludables"
          value={kpis.saludables}
          sub={`${Math.round((kpis.saludables / kpis.total) * 100)}% de la cartera`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          label="En Observación"
          value={cuentasObservacion.length}
          sub={`${formatMXN(facturacionObservacion)} en seguimiento`}
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          label="Oportunidades"
          value={conUpsell}
          sub="Upsell / Cross-sell activas"
          icon={TrendingUp}
          variant="teal"
        />
      </div>

      {/* ══ SECCIÓN 2: Tickets Zoho Desk ══════════════════════════════════════ */}
      <div className="mx-6 mb-5 rounded-xl border border-border bg-surface/50 px-5 py-3
        flex flex-wrap items-center gap-x-8 gap-y-2">
        <div className="flex items-center gap-2">
          <Ticket size={14} className="text-cp" />
          <span className="text-xs font-semibold text-textMid">Tickets Zoho Desk</span>
          <span className="text-[10px] text-textLow">· datos al {fmtFecha(globalTickets.ultima)}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <span>
            <span className="font-bold text-textHi text-sm">{globalTickets.total.toLocaleString()}</span>
            <span className="text-textLow ml-1">tickets totales</span>
          </span>
          <span>
            <span className="font-bold text-rojo text-sm">{globalTickets.fallas}</span>
            <span className="text-textLow ml-1">fallas registradas</span>
          </span>
          {topRiesgoTicketsTotal > 0 && (
            <span>
              <span className="font-bold text-naranja text-sm">{topRiesgoTicketsTotal}</span>
              <span className="text-textLow ml-1">tickets en top 10 riesgo</span>
              {topRiesgoTicketsFallas > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
                  bg-rojo/10 text-rojo text-[10px] font-semibold border border-rojo/20">
                  <AlertTriangle size={9} /> {topRiesgoTicketsFallas} fallas
                </span>
              )}
            </span>
          )}
          <Link href="/tickets"
            className="text-cp hover:text-cpTeal font-medium transition-colors flex items-center gap-1">
            Ver todos los tickets →
          </Link>
          <a
            href="https://ayuda.callpicker.com/"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
              bg-[#0F766E] hover:bg-[#0D9488] text-white shadow-sm transition-all duration-150">
            <LifeBuoy size={13} /> Centro de Ayuda
          </a>
        </div>
      </div>

      {/* ══ SECCIÓN 3: Semáforo + Distribución ═══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 pb-5">

        {/* Semáforo por asesor — 2 columnas */}
        <div className="cp-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-textHi mb-4">Semáforo por Asesor</h3>
          <SemaforoDashChart data={semaforoAsesor} />
        </div>

        {/* Distribución + resumen por asesor — 1 columna */}
        <div className="cp-card">
          <h3 className="text-sm font-semibold text-textHi mb-4">Distribución General</h3>
          <div className="space-y-3">
            {(Object.entries(dist) as [string, number][]).map(([key, count]) => {
              const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: semColors[key] }}>
                      {semLabels[key]}
                    </span>
                    <span className="text-textHi font-semibold">
                      {count} <span className="text-textLow font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: semColors[key] }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen por asesor */}
          <div className="mt-5 pt-4 border-t border-border space-y-2.5">
            {semaforoAsesor.map(a => (
              <div key={a.asesor}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-textMid">{a.asesor}</span>
                    <span className="text-[10px] text-amber-500 font-semibold">
                      ⭐ Top Customer
                    </span>
                  </div>
                  <span className="text-xs font-bold text-textHi tabular-nums">
                    {formatMXN(a.facturacion_total)}
                  </span>
                </div>
                {topFac[a.asesor] && (
                  <p className="text-[10px] text-textLow">
                    Top Customer: {formatMXN(topFac[a.asesor])}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ SECCIÓN 4: Top Cuentas en Riesgo ═════════════════════════════════ */}
      <div className="px-6 pb-6">
        <div className="cp-card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-textHi">Top Cuentas en Riesgo</h3>
              <p className="text-[11px] text-textLow mt-0.5">
                Las 10 cuentas con menor Health Score · tickets conectados desde Zoho Desk
              </p>
            </div>
            <Link href="/cuentas"
              className="text-xs text-cp hover:text-cpTeal transition-colors font-medium">
              Ver todas →
            </Link>
          </div>
          <TopRiesgoTable cuentas={topRiesgo} />
          <div className="px-5 py-2.5 border-t border-border bg-surface/50
            flex items-center justify-between text-[11px] text-textLow">
            <span>Mostrando 10 cuentas de menor Health Score</span>
            {topRiesgoTicketsTotal > 0 && (
              <span className="flex items-center gap-1.5">
                <Ticket size={10} />
                {topRiesgoTicketsTotal} tickets ·
                {topRiesgoTicketsFallas > 0 && (
                  <span className="text-rojo font-semibold"> {topRiesgoTicketsFallas} fallas</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══ SECCIÓN 5: MÉTRICAS — panel Mission Control ═══════════════════════ */}
      <DashMetricasSection
        kpis={{
          facturacionRiesgo: facturacionChurn,
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

    </div>
  )
}
