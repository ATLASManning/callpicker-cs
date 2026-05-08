import Link from 'next/link'
import type { Cuenta } from '@/lib/types'
import { getSemaforo, ASESOR_CONFIG, formatMXN } from '@/lib/types'
import SemaforoBadge from './SemaforoBadge'
import HealthScoreRing from './HealthScoreRing'

interface Props { cuentas: Cuenta[] }

export default function TopRiesgoTable({ cuentas }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="cp-table">
        <thead>
          <tr>
            <th>Cuenta</th>
            <th>Empresa</th>
            <th>Asesor</th>
            <th>Facturación</th>
            <th>Health Score</th>
            <th>Sem.</th>
            <th>Días sin act.</th>
            <th>Tickets</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {cuentas.map(c => {
            const semaforo = getSemaforo(c.health_score)
            const ac = ASESOR_CONFIG[c.asesor]
            return (
              <tr key={c.id}>
                <td className="font-mono text-xs text-cp font-semibold">{c.consecutivo}</td>
                <td>
                  <Link href={`/cuentas/${c.id}`} className="text-textHi hover:text-cpTeal font-medium text-sm">
                    {c.empresa}
                  </Link>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: `${ac.color}25`, color: ac.color }}>
                      {ac.initial}
                    </span>
                    <span className="text-xs text-textMid">{c.asesor}</span>
                  </span>
                </td>
                <td className="font-semibold text-sm">{formatMXN(c.facturacion)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <HealthScoreRing score={c.health_score} size={36} strokeWidth={4} showLabel={false} />
                    <span className="text-sm font-bold" style={{ color: ['verde','azul'].includes(semaforo) ? '#22C55E' : semaforo === 'amarillo' ? '#EAB308' : '#EF4444' }}>
                      {c.health_score}
                    </span>
                  </div>
                </td>
                <td><SemaforoBadge semaforo={semaforo} size="sm" /></td>
                <td>
                  <span className={`text-xs font-medium ${c.dias_sin_actividad > 7 ? 'text-rojo' : 'text-textMid'}`}>
                    {c.dias_sin_actividad}d
                  </span>
                </td>
                <td>
                  <span className={`text-xs font-medium ${c.tickets_abiertos > 0 ? 'text-naranja' : 'text-textLow'}`}>
                    {c.tickets_abiertos}
                  </span>
                </td>
                <td>
                  <Link href={`/cuentas/${c.id}`}
                    className="text-xs text-cp hover:text-cpTeal font-medium transition-colors">
                    Ver →
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
