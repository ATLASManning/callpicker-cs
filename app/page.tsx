import { Users, DollarSign, AlertTriangle, TrendingUp, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import SemaforoDashChart from '@/components/charts/SemaforoDashChart'
import TopRiesgoTable from '@/components/TopRiesgoTable'
import { getKPIs, getSemaforoByAsesor, getCuentas } from '@/lib/supabase'
import { formatMXN, getSemaforo } from '@/lib/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [kpis, semaforoAsesor, cuentas] = await Promise.all([
    getKPIs(),
    getSemaforoByAsesor(),
    getCuentas(),
  ])

  const dist = { verde: 0, azul: 0, amarillo: 0, naranja: 0, rojo: 0 }
  cuentas.forEach(c => { dist[getSemaforo(c.health_score)]++ })

  const topRiesgo = [...cuentas]
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 10)

  const conUpsell = cuentas.filter(c => c.upsell_producto || c.crossell_producto).length

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Dashboard Customer Success"
        subtitle={`${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        actions={
          <Link href="/reuniones" className="cp-btn cp-btn-primary">
            <CalendarDays size={14} />
            Reuniones
          </Link>
        }
      />

      {/* Fichas pendientes banner */}
      {(kpis.faltaTC > 0 || kpis.faltaHS > 0) && (
        <div className="mx-6 mb-4 flex flex-wrap gap-3">
          {kpis.faltaTC > 0 && (
            <Link href="/cuentas?warning=FALTA_TC"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-colors">
              <AlertCircle size={14} />
              {kpis.faltaTC} cuentas sin ficha Top Customer — pendiente del asesor
            </Link>
          )}
          {kpis.faltaHS > 0 && (
            <Link href="/cuentas?warning=FALTA_HS"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-500 text-xs font-semibold hover:bg-yellow-500/20 transition-colors">
              <AlertCircle size={14} />
              {kpis.faltaHS} cuentas sin Health Score Callpicker
            </Link>
          )}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 pb-6">
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
          label="Cuentas en Riesgo"
          value={kpis.enRiesgo}
          sub={`${formatMXN(kpis.facturacionRiesgo)} expuesto`}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 pb-6">
        {/* Semáforo chart */}
        <div className="cp-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-textHi mb-4">Semáforo por Asesor</h3>
          <SemaforoDashChart data={semaforoAsesor} />
        </div>

        {/* Distribución doughnut */}
        <div className="cp-card">
          <h3 className="text-sm font-semibold text-textHi mb-4">Distribución General</h3>
          <div className="space-y-3">
            {(Object.entries(dist) as [string, number][]).map(([key, count]) => {
              const colors: Record<string, string> = {
                verde: '#22C55E', azul: '#3B82F6', amarillo: '#EAB308',
                naranja: '#F97316', rojo: '#EF4444',
              }
              const labels: Record<string, string> = {
                verde: 'Saludable', azul: 'Estable', amarillo: 'Observación',
                naranja: 'En Riesgo', rojo: 'Riesgo Alto',
              }
              const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-textMid" style={{ color: colors[key] }}>{labels[key]}</span>
                    <span className="text-textHi font-medium">{count} <span className="text-textLow">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: colors[key] }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen por asesor */}
          {(() => {
            const topRanges: Record<string, number> = { F: 46, D: 38, C: 43 }
            const prefixAsesor: Record<string, string> = { F: 'Fátima', D: 'Dan', C: 'Claudia' }
            const topCount: Record<string, number> = { Fátima: 46, Dan: 38, Claudia: 43 }
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
            return (
              <div className="mt-5 pt-4 border-t border-border space-y-2">
                {semaforoAsesor.map(a => (
                  <div key={a.asesor}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-textMid">{a.asesor}</span>
                        <span className="text-[10px] text-amber-400 font-semibold">⭐ {topCount[a.asesor] || 0} TOP</span>
                      </div>
                      <span className="text-xs font-semibold text-textHi">{formatMXN(a.facturacion_total)}</span>
                    </div>
                    {topFac[a.asesor] && (
                      <p className="text-[10px] text-textLow">
                        Top Customer: {formatMXN(topFac[a.asesor])}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Top Riesgo */}
      <div className="px-6 pb-6">
        <div className="cp-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-textHi">Top Cuentas en Riesgo</h3>
            <Link href="/cuentas?semaforo=rojo" className="text-xs text-cp hover:text-cpTeal transition-colors">
              Ver todas →
            </Link>
          </div>
          <TopRiesgoTable cuentas={topRiesgo} />
        </div>
      </div>
    </div>
  )
}
