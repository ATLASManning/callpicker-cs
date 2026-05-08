import { getCuentas, getSemaforoByAsesor } from '@/lib/supabase'
import { getSemaforo, formatMXN, ASESOR_CONFIG } from '@/lib/types'
import type { Asesor } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AsesoresPage() {
  const [cuentas, resumen] = await Promise.all([getCuentas(), getSemaforoByAsesor()])

  const asesores: Asesor[] = ['Fátima', 'Dan', 'Claudia']

  return (
    <div className="min-h-screen">
      <PageHeader title="Panel por Asesor" subtitle="Vista de cartera individual por ejecutivo de UX" />

      {asesores.map(asesor => {
        const ac = ASESOR_CONFIG[asesor]
        const res = resumen.find(r => r.asesor === asesor)
        const lista = cuentas
          .filter(c => c.asesor === asesor && c.estado === 'activo')
          .sort((a, b) => a.health_score - b.health_score)

        const enRiesgo = lista.filter(c => c.health_score < 40)
        const saludables = lista.filter(c => c.health_score >= 60)

        return (
          <div key={asesor} className="px-6 mb-8">
            {/* Asesor header */}
            <div className="flex items-center gap-4 mb-4 p-4 cp-card">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ background: `${ac.color}20`, color: ac.color, border: `1px solid ${ac.color}40` }}>
                {ac.initial}
              </div>
              <div>
                <h2 className="text-base font-bold text-textHi">{asesor}</h2>
                <p className="text-xs text-textMid">Ejecutivo de Customer Success</p>
              </div>
              <div className="ml-auto grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-textHi">{lista.length}</p>
                  <p className="text-[10px] text-textLow uppercase tracking-wide">Cuentas</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-textHi">{formatMXN(res?.facturacion_total ?? 0)}</p>
                  <p className="text-[10px] text-textLow uppercase tracking-wide">Facturación</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-verde">{saludables.length}</p>
                  <p className="text-[10px] text-textLow uppercase tracking-wide">Saludables</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-rojo">{enRiesgo.length}</p>
                  <p className="text-[10px] text-textLow uppercase tracking-wide">En Riesgo</p>
                </div>
              </div>
            </div>

            {/* Distribución semáforo */}
            {res && (
              <div className="flex gap-2 mb-4">
                {[
                  { label: 'Verde',    count: res.verde,    color: '#22C55E' },
                  { label: 'Azul',     count: res.azul,     color: '#3B82F6' },
                  { label: 'Amarillo', count: res.amarillo, color: '#EAB308' },
                  { label: 'Naranja',  count: res.naranja,  color: '#F97316' },
                  { label: 'Rojo',     count: res.rojo,     color: '#EF4444' },
                ].map(s => s.count > 0 && (
                  <div key={s.label} className="flex-1 rounded-lg py-2 text-center text-xs"
                    style={{ background: `${s.color}12`, color: s.color, border: `1px solid ${s.color}25` }}>
                    <p className="text-lg font-bold">{s.count}</p>
                    <p className="text-[9px] uppercase tracking-wide opacity-70">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Cuentas table */}
            <div className="cp-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="cp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Empresa</th>
                      <th>Facturación</th>
                      <th>Health Score</th>
                      <th>Semáforo</th>
                      <th>Días sin act.</th>
                      <th>Tickets</th>
                      <th>Último contacto</th>
                      <th>Upsell / Cross</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map(c => {
                      const semaforo = getSemaforo(c.health_score)
                      return (
                        <tr key={c.id}>
                          <td className="font-mono text-xs text-cp font-bold">{c.consecutivo}</td>
                          <td>
                            <Link href={`/cuentas/${c.id}`} className="text-sm font-medium text-textHi hover:text-cpTeal">
                              {c.empresa}
                            </Link>
                          </td>
                          <td className="font-semibold text-sm">{formatMXN(c.facturacion)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <HealthScoreRing score={c.health_score} size={32} strokeWidth={4} showLabel={false} />
                              <span className="text-sm font-bold text-textHi">{c.health_score}</span>
                            </div>
                          </td>
                          <td><SemaforoBadge semaforo={semaforo} size="sm" /></td>
                          <td className={`text-xs font-medium ${c.dias_sin_actividad > 10 ? 'text-rojo' : 'text-textMid'}`}>
                            {c.dias_sin_actividad}d
                          </td>
                          <td className={`text-xs ${c.tickets_abiertos > 0 ? 'text-naranja font-semibold' : 'text-textLow'}`}>
                            {c.tickets_abiertos}
                          </td>
                          <td className="text-xs text-textLow whitespace-nowrap">
                            {c.ultimo_contacto ? new Date(c.ultimo_contacto).toLocaleDateString('es-MX', { day:'2-digit', month:'short' }) : '—'}
                          </td>
                          <td>
                            <div className="flex flex-col gap-1">
                              {c.upsell_producto && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cpTeal/10 text-cpTeal border border-cpTeal/20">
                                  ↑ {c.upsell_producto}
                                </span>
                              )}
                              {c.crossell_producto && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  ⇄ {c.crossell_producto}
                                </span>
                              )}
                            </div>
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
        )
      })}
    </div>
  )
}
