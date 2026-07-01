import { getCuentas } from '@/lib/supabase'
import { formatMXN, getSemaforo, ASESOR_CONFIG } from '@/lib/types'
import type { Asesor } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import SemaforoBadge from '@/components/SemaforoBadge'
import Link from 'next/link'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function UpsellPage() {
  const h = headers()
  const rol          = h.get('x-user-rol') ?? 'viewer'
  const asesorHeader = decodeURIComponent(h.get('x-user-asesor') ?? '')
  const isAsesor     = rol === 'asesor' && !!asesorHeader

  const cuentas = await getCuentas(isAsesor ? { asesor: asesorHeader } : undefined)
  const activas = cuentas.filter(c => c.estado === 'activo')

  const conUpsell = activas.filter(c => c.upsell_producto)
  const conCross  = activas.filter(c => c.crossell_producto)
  const ambos     = activas.filter(c => c.upsell_producto && c.crossell_producto)

  const valorUpsellTotal = activas.reduce((s, c) => s + (c.valor_upsell_estimado ?? 0), 0)

  const asesores: Asesor[] = isAsesor
    ? (['Fátima', 'Dan', 'Claudia'] as Asesor[]).filter(a => a === asesorHeader)
    : ['Fátima', 'Dan', 'Claudia']

  const byAsesor = asesores.map(asesor => {
    const lista = activas.filter(c => c.asesor === asesor)
    const up    = lista.filter(c => c.upsell_producto)
    const cr    = lista.filter(c => c.crossell_producto)
    const valor = lista.reduce((s, c) => s + (c.valor_upsell_estimado ?? 0), 0)
    return { asesor, up, cr, valor, ac: ASESOR_CONFIG[asesor] }
  })

  const pipeline = activas
    .filter(c => c.upsell_producto || c.crossell_producto)
    .sort((a, b) => (b.valor_upsell_estimado ?? 0) - (a.valor_upsell_estimado ?? 0))

  return (
    <div className="min-h-screen">
      <PageHeader title="Pipeline Upsell & Cross-sell" subtitle="Oportunidades de expansión de cartera activa" />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 pb-6">
        {[
          { label: 'Valor Upsell Estimado', value: formatMXN(valorUpsellTotal), color: 'text-cpTeal' },
          { label: 'Cuentas con Upsell', value: String(conUpsell.length), color: 'text-cp' },
          { label: 'Cuentas con Cross-sell', value: String(conCross.length), color: 'text-purple-400' },
          { label: 'Ambas Oportunidades', value: String(ambos.length), color: 'text-verde' },
        ].map(k => (
          <div key={k.label} className="cp-card">
            <p className="text-xs text-textMid uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Por asesor */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {byAsesor.map(({ asesor, up, cr, valor, ac }) => (
            <div key={asesor} className="cp-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: `${ac.color}20`, color: ac.color, border: `1px solid ${ac.color}40` }}>
                  {ac.initial}
                </div>
                <div>
                  <p className="text-sm font-bold text-textHi">{asesor}</p>
                  <p className="text-[10px] text-textLow uppercase tracking-wide">Ejecutivo CS</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-cp/10 p-2">
                  <p className="text-lg font-bold text-cp">{up.length}</p>
                  <p className="text-[9px] text-textLow uppercase">Upsell</p>
                </div>
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <p className="text-lg font-bold text-purple-400">{cr.length}</p>
                  <p className="text-[9px] text-textLow uppercase">Cross</p>
                </div>
                <div className="rounded-lg bg-cpTeal/10 p-2">
                  <p className="text-sm font-bold text-cpTeal">{formatMXN(valor)}</p>
                  <p className="text-[9px] text-textLow uppercase">Valor</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline table */}
        <div className="cp-card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-textHi">Pipeline Completo</h3>
            <p className="text-xs text-textLow mt-0.5">{pipeline.length} cuentas con oportunidades identificadas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Empresa</th>
                  <th>Asesor</th>
                  <th>Health Score</th>
                  <th>Semáforo</th>
                  <th>Facturación Actual</th>
                  <th>Upsell</th>
                  <th>Cross-sell</th>
                  <th>Valor Est.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pipeline.map(c => {
                  const sem = getSemaforo(c.health_score)
                  const ac = ASESOR_CONFIG[c.asesor as Asesor]
                  return (
                    <tr key={c.id}>
                      <td className="font-mono text-xs text-cp font-bold">{c.consecutivo}</td>
                      <td>
                        <Link href={`/cuentas/${c.id}`} className="text-sm font-medium text-textHi hover:text-cpTeal">
                          {c.empresa}
                        </Link>
                      </td>
                      <td>
                        <span className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{ background: `${ac.color}15`, color: ac.color }}>
                          {c.asesor}
                        </span>
                      </td>
                      <td className="text-sm font-bold text-textHi">{c.health_score}</td>
                      <td><SemaforoBadge semaforo={sem} size="sm" /></td>
                      <td className="text-sm font-semibold">{formatMXN(c.facturacion)}</td>
                      <td>
                        {c.upsell_producto ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cpTeal/10 text-cpTeal border border-cpTeal/20 whitespace-nowrap">
                            ↑ {c.upsell_producto}
                          </span>
                        ) : <span className="text-textLow text-xs">—</span>}
                      </td>
                      <td>
                        {c.crossell_producto ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap">
                            ⇄ {c.crossell_producto}
                          </span>
                        ) : <span className="text-textLow text-xs">—</span>}
                      </td>
                      <td className="text-sm font-semibold text-cpTeal">
                        {c.valor_upsell_estimado ? formatMXN(c.valor_upsell_estimado) : '—'}
                      </td>
                      <td>
                        <Link href={`/cuentas/${c.id}`} className="text-xs text-cp hover:text-cpTeal">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
