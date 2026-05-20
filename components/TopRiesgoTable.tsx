import Link from 'next/link'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import type { Cuenta } from '@/lib/types'
import { getSemaforo, ASESOR_CONFIG, formatMXN } from '@/lib/types'
import SemaforoBadge from './SemaforoBadge'
import HealthScoreRing from './HealthScoreRing'

interface Props { cuentas: Cuenta[] }

function fmtFecha(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

function DiasCell({ dias }: { dias: number }) {
  const cls = dias > 30 ? 'text-rojo font-bold'
    : dias > 14 ? 'text-naranja font-semibold'
    : 'text-textMid'
  return <span className={`text-xs ${cls}`}>{dias}d</span>
}

function TicketsCell({ cuenta }: { cuenta: Cuenta }) {
  const zt = cuenta.zoho_tickets
  if (!zt || zt.total === 0) {
    return <span className="text-xs text-textLow">—</span>
  }
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-sm font-bold tabular-nums ${zt.total > 10 ? 'text-naranja' : 'text-textHi'}`}>
          {zt.total}
        </span>
        {zt.fallas > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
            bg-rojo/10 text-rojo text-[10px] font-semibold border border-rojo/20 whitespace-nowrap">
            <AlertTriangle size={9} /> {zt.fallas} falla{zt.fallas > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {zt.ultima && (
        <span className="text-[10px] text-textLow whitespace-nowrap">Últ: {fmtFecha(zt.ultima)}</span>
      )}
    </div>
  )
}

export default function TopRiesgoTable({ cuentas }: Props) {
  if (cuentas.length === 0) {
    return (
      <div className="text-center py-8 text-textLow text-sm">
        No hay cuentas en riesgo — ¡excelente estado de cartera!
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="cp-table">
        <colgroup>
          <col style={{ width: '72px' }} />   {/* Cuenta */}
          <col style={{ width: '200px' }} />  {/* Empresa */}
          <col style={{ width: '100px' }} />  {/* Asesor */}
          <col style={{ width: '115px' }} />  {/* Facturación */}
          <col style={{ width: '115px' }} />  {/* Health Score */}
          <col style={{ width: '115px' }} />  {/* Semáforo */}
          <col style={{ width: '105px' }} />  {/* Días sin actividad */}
          <col style={{ width: '145px' }} />  {/* Tickets Zoho Desk */}
          <col style={{ width: '60px' }} />   {/* Acción */}
        </colgroup>
        <thead>
          <tr>
            <th>Cuenta</th>
            <th>Empresa</th>
            <th>Asesor</th>
            <th>Facturación</th>
            <th>Health Score</th>
            <th>Semáforo</th>
            <th>Días sin actividad</th>
            <th>Tickets Zoho Desk</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cuentas.map(c => {
            const semaforo = getSemaforo(c.health_score)
            const ac = ASESOR_CONFIG[c.asesor]
            const hsColor = ['verde', 'azul'].includes(semaforo)
              ? '#22C55E' : semaforo === 'amarillo' ? '#EAB308' : '#EF4444'

            return (
              <tr key={c.id}>

                {/* Cuenta */}
                <td>
                  <span className="font-mono text-xs font-bold text-cp">{c.consecutivo}</span>
                </td>

                {/* Empresa */}
                <td>
                  <Link href={`/cuentas/${c.id}`}
                    className="text-sm font-semibold text-textHi hover:text-cp transition-colors block leading-tight">
                    {c.empresa}
                  </Link>
                  {c.giro && (
                    <span className="text-[11px] text-textLow truncate block max-w-[190px]">{c.giro}</span>
                  )}
                </td>

                {/* Asesor */}
                <td>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${ac.color}25`, color: ac.color }}>
                      {ac.initial}
                    </span>
                    <span className="text-xs text-textMid">{c.asesor}</span>
                  </span>
                </td>

                {/* Facturación */}
                <td>
                  <span className="text-sm font-bold text-textHi tabular-nums">
                    {formatMXN(c.facturacion)}
                  </span>
                </td>

                {/* Health Score */}
                <td>
                  <div className="flex items-center gap-2">
                    <HealthScoreRing score={c.health_score} size={34} strokeWidth={4} showLabel={false} />
                    <span className="text-sm font-bold tabular-nums" style={{ color: hsColor }}>
                      {c.health_score}
                    </span>
                  </div>
                </td>

                {/* Semáforo */}
                <td>
                  <SemaforoBadge semaforo={semaforo} size="sm" />
                </td>

                {/* Días sin actividad */}
                <td>
                  <DiasCell dias={c.dias_sin_actividad} />
                </td>

                {/* Tickets Zoho Desk — datos reales */}
                <td>
                  <TicketsCell cuenta={c} />
                </td>

                {/* Acción */}
                <td>
                  <Link href={`/cuentas/${c.id}`}
                    className="inline-flex items-center gap-0.5 text-xs text-cp hover:text-cpTeal font-medium transition-colors">
                    Ver <ArrowUpRight size={12} />
                  </Link>
                </td>

              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
