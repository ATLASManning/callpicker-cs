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

      {/* Formularios */}
      <div className="px-6 pb-6">
        <div className="cp-card mb-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-cp" />
            <h3 className="text-sm font-bold text-textHi">Formularios</h3>
            <span className="text-[10px] text-textLow uppercase tracking-wide ml-1">Captura de oportunidades · Zoho</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://forms.zohopublic.com/virtualoffice23037/form/Detallesdelcliente/formperma/k9B-VO3p9PSrCRKPFhe1sCQyBUM_rEe0dZV2rL6lphc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-3 rounded-xl border border-cpTeal/30 bg-cpTeal/5 hover:bg-cpTeal/10 transition-colors px-4 py-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-cpTeal/15 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cpTeal">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cpTeal group-hover:underline">Lead Nuevo</p>
                <p className="text-[11px] text-textLow truncate">Sin cuenta Callpicker · Detalles del cliente</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textLow flex-shrink-0">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>

            <a
              href="https://forms.zohopublic.com/virtualoffice23037/form/FormularioPerfilamiento2daversin/formperma/43yvXFdwbGMGc_ni__Yh0xCIIsmmpqOWK1_tf3fKUW4"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-3 rounded-xl border border-cp/30 bg-cp/5 hover:bg-cp/10 transition-colors px-4 py-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-cp/15 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cp">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cp group-hover:underline">Lead con Cuenta Activa</p>
                <p className="text-[11px] text-textLow truncate">Con cuenta Callpicker · Perfilamiento 2ª versión</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textLow flex-shrink-0">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
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
