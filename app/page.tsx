import { Users, DollarSign, AlertTriangle, TrendingUp, Activity, CheckCircle2 } from 'lucide-react'
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
    getCuentas({ estado: 'activo' }),
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
          <Link href="/seguimiento" className="cp-btn cp-btn-primary">
            <Activity size={14} />
            Seguimiento
          </Link>
        }
      />

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
          <div className="mt-5 pt-4 border-t border-border space-y-2">
            {semaforoAsesor.map(a => (
              <div key={a.asesor} className="flex items-center justify-between">
                <span className="text-xs text-textMid">{a.asesor}</span>
                <span className="text-xs font-semibold text-textHi">{formatMXN(a.facturacion_total)}</span>
              </div>
            ))}
          </div>
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
