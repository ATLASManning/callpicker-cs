import { getCuentas, getSemaforoByAsesor } from '@/lib/supabase'
import { getSemaforo, formatMXN } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import MetricasCharts from '@/components/MetricasCharts'

export const dynamic = 'force-dynamic'

export default async function MetricasPage() {
  const [cuentas, semaforoAsesor] = await Promise.all([getCuentas(), getSemaforoByAsesor()])

  const activas = cuentas.filter(c => c.estado === 'activo')
  const total = activas.length
  const facturacionTotal = activas.reduce((s, c) => s + c.facturacion, 0)

  const dist = { verde: 0, azul: 0, amarillo: 0, naranja: 0, rojo: 0 }
  activas.forEach(c => { dist[getSemaforo(c.health_score)]++ })

  const top10 = [...activas].sort((a, b) => b.facturacion - a.facturacion).slice(0, 10)

  const churnRiesgo = activas.filter(c => c.health_score < 40)
  const facturacionChurn = churnRiesgo.reduce((s, c) => s + c.facturacion, 0)

  const conUpsell = activas.filter(c => c.upsell_producto)
  const conCross = activas.filter(c => c.crossell_producto)
  const valorUpsell = activas.reduce((s, c) => s + (c.valor_upsell_estimado ?? 0), 0)

  const totalTickets = activas.reduce((s, c) => s + c.tickets_abiertos, 0)
  const conTickets = activas.filter(c => c.tickets_abiertos > 0).length

  const kpis = [
    { label: 'Cartera Total MXN', value: formatMXN(facturacionTotal), sub: `${total} cuentas activas`, color: 'text-cp' },
    { label: 'Facturación en Riesgo', value: formatMXN(facturacionChurn), sub: `${churnRiesgo.length} cuentas (H/S < 40)`, color: 'text-rojo' },
    { label: 'Pipeline Upsell', value: formatMXN(valorUpsell), sub: `${conUpsell.length} cuentas con upsell`, color: 'text-cpTeal' },
    { label: 'Pipeline Cross-sell', value: String(conCross.length), sub: 'cuentas con cross-sell identificado', color: 'text-purple-400' },
    { label: 'Tickets Abiertos', value: String(totalTickets), sub: `en ${conTickets} cuentas`, color: 'text-naranja' },
    { label: 'Retención Potencial', value: `${Math.round(((total - churnRiesgo.length) / total) * 100)}%`, sub: 'cuentas fuera de riesgo', color: 'text-verde' },
  ]

  const chartData = {
    semaforoAsesor,
    dist,
    top10: top10.map(c => ({ empresa: c.empresa, facturacion: c.facturacion, consecutivo: c.consecutivo })),
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Métricas Customer Success" subtitle="Resumen operativo del equipo de UX" />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-6">
        {kpis.map(k => (
          <div key={k.label} className="cp-card">
            <p className="text-xs text-textMid uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-textLow mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="px-6 pb-6">
        <MetricasCharts data={chartData} />
      </div>

      {/* Tabla churn riesgo */}
      <div className="px-6 pb-6">
        <div className="cp-card">
          <h3 className="text-sm font-semibold text-textHi mb-3">Cuentas en Riesgo (Health Score &lt; 40)</h3>
          <div className="overflow-x-auto">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>#</th><th>Empresa</th><th>Asesor</th>
                  <th>Facturación</th><th>HS</th><th>Días sin act.</th><th>Tickets</th>
                </tr>
              </thead>
              <tbody>
                {churnRiesgo.sort((a,b) => a.health_score - b.health_score).map(c => (
                  <tr key={c.id}>
                    <td className="font-mono text-xs text-rojo font-bold">{c.consecutivo}</td>
                    <td className="text-sm font-medium text-textHi">{c.empresa}</td>
                    <td className="text-xs text-textMid">{c.asesor}</td>
                    <td className="font-semibold text-sm">{formatMXN(c.facturacion)}</td>
                    <td className="text-rojo font-bold text-sm">{c.health_score}</td>
                    <td className="text-xs text-rojo">{c.dias_sin_actividad}d</td>
                    <td className={`text-xs ${c.tickets_abiertos > 0 ? 'text-naranja' : 'text-textLow'}`}>{c.tickets_abiertos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
