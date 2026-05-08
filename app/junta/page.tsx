import { getCuentas, getSemaforoByAsesor } from '@/lib/supabase'
import { getSemaforo, formatMXN, SEMAFORO_CONFIG, ASESOR_CONFIG } from '@/lib/types'
import type { Asesor } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import SemaforoBadge from '@/components/SemaforoBadge'
import Link from 'next/link'
import { Printer, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function JuntaSemanalPage() {
  const [cuentas, resumen] = await Promise.all([
    getCuentas({ estado: 'activo' }),
    getSemaforoByAsesor(),
  ])

  const asesores: Asesor[] = ['Fátima', 'Dan', 'Claudia']
  const today = new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const porAsesor = asesores.map(asesor => ({
    asesor,
    cuentas: cuentas
      .filter(c => c.asesor === asesor)
      .sort((a, b) => a.health_score - b.health_score),
  }))

  const criticas = cuentas.filter(c => c.health_score < 20)

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Junta Semanal — Semáforo"
        subtitle={`${today} · ${cuentas.length} cuentas activas`}
        actions={
          <button onClick={() => window.print()} className="cp-btn cp-btn-ghost text-xs print:hidden">
            <Printer size={14} /> Imprimir
          </button>
        }
      />

      {/* Alertas críticas */}
      {criticas.length > 0 && (
        <div className="mx-6 mb-5 p-4 bg-rojo/10 border border-rojo/30 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-rojo" />
            <p className="text-sm font-semibold text-rojo">{criticas.length} cuenta{criticas.length > 1 ? 's' : ''} en Riesgo Colorado — Intervención HOY</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {criticas.map(c => (
              <Link key={c.id} href={`/cuentas/${c.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-rojo/20 border border-rojo/40 rounded-lg text-xs hover:bg-rojo/30 transition-colors">
                <span className="font-mono font-bold text-rojo">{c.consecutivo}</span>
                <span className="text-textHi">{c.empresa}</span>
                <span className="text-rojo font-bold">{c.health_score}</span>
                <span className="text-textLow">{formatMXN(c.facturacion)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Resumen por asesor */}
      <div className="grid grid-cols-3 gap-4 px-6 mb-6">
        {resumen.map(r => {
          const ac = ASESOR_CONFIG[r.asesor as Asesor]
          return (
            <div key={r.asesor} className="cp-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: `${ac.color}20`, color: ac.color, border: `1px solid ${ac.color}40` }}>
                  {ac.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-textHi">{r.asesor}</p>
                  <p className="text-xs text-textMid">{r.total} cuentas · {formatMXN(r.facturacion_total)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {[
                  { key:'verde',    count: r.verde,    color:'#22C55E' },
                  { key:'azul',     count: r.azul,     color:'#3B82F6' },
                  { key:'amarillo', count: r.amarillo, color:'#EAB308' },
                  { key:'naranja',  count: r.naranja,  color:'#F97316' },
                  { key:'rojo',     count: r.rojo,     color:'#EF4444' },
                ].map(s => s.count > 0 && (
                  <div key={s.key} className="flex-1 rounded py-1.5 text-center text-xs font-bold"
                    style={{ background: `${s.color}20`, color: s.color }}>
                    {s.count}
                  </div>
                ))}
              </div>
              {r.facturacion_en_riesgo > 0 && (
                <p className="text-xs text-rojo mt-2 flex items-center gap-1">
                  <AlertTriangle size={11} />
                  {formatMXN(r.facturacion_en_riesgo)} en riesgo
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Grid completo por asesor */}
      {porAsesor.map(({ asesor, cuentas: lista }) => {
        const ac = ASESOR_CONFIG[asesor]
        return (
          <div key={asesor} className="px-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${ac.color}20`, color: ac.color }}>
                {ac.initial}
              </div>
              <h2 className="text-sm font-bold text-textHi">{asesor}</h2>
              <span className="text-xs text-textLow">{lista.length} cuentas</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {lista.map(c => {
                const semaforo = getSemaforo(c.health_score)
                const cfg = SEMAFORO_CONFIG[semaforo]
                const tieneAlerta = c.dias_sin_actividad > 7 || c.tickets_abiertos > 0 || !c.pagos_al_corriente

                return (
                  <Link key={c.id} href={`/cuentas/${c.id}`}
                    className="block rounded-xl p-3 border transition-all hover:scale-[1.01] hover:shadow-lg"
                    style={{
                      background: `${cfg.color}08`,
                      borderColor: `${cfg.color}30`,
                    }}>
                    {/* Semáforo indicator */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold text-textLow">{c.consecutivo}</span>
                      <div className="flex items-center gap-1.5">
                        {tieneAlerta && <AlertTriangle size={10} className="text-naranja" />}
                        <div className={`w-3 h-3 rounded-full ${semaforo === 'rojo' ? 'semaforo-rojo' : ''}`}
                          style={{ background: cfg.color }} />
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-textHi mb-1 leading-tight line-clamp-2">
                      {c.empresa}
                    </p>
                    <p className="text-xs text-textMid mb-2">{formatMXN(c.facturacion)}</p>

                    {/* Score bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-surface overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.health_score}%`, background: cfg.color }} />
                      </div>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: cfg.color }}>
                        {c.health_score}
                      </span>
                    </div>

                    {/* Badges rápidas */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.dias_sin_actividad > 7 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rojo/10 text-rojo border border-rojo/20">
                          {c.dias_sin_actividad}d inactivo
                        </span>
                      )}
                      {c.tickets_abiertos > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-naranja/10 text-naranja border border-naranja/20">
                          {c.tickets_abiertos} ticket{c.tickets_abiertos > 1 ? 's' : ''}
                        </span>
                      )}
                      {(c.upsell_producto || c.crossell_producto) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cpTeal/10 text-cpTeal border border-cpTeal/20">
                          <TrendingUp size={8} className="inline mr-0.5" />
                          Oportunidad
                        </span>
                      )}
                      {!c.pagos_al_corriente && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rojo/10 text-rojo border border-rojo/20">
                          Pago pendiente
                        </span>
                      )}
                    </div>

                    {/* Último contacto */}
                    {c.ultimo_contacto && (
                      <p className="text-[9px] text-textLow mt-2 flex items-center gap-1">
                        <Calendar size={8} />
                        Contacto: {new Date(c.ultimo_contacto).toLocaleDateString('es-MX', { day:'2-digit', month:'short' })}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
