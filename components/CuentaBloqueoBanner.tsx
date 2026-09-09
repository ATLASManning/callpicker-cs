import { Ban } from 'lucide-react'
import type { BloqueoComercial } from '@/lib/elegibilidad'

/**
 * Aviso de cuenta bloqueada para Actividades SAC.
 *
 * POR QUÉ (9-sep-2026): la regla de elegibilidad ya impedía generar actividades
 * sobre cuentas en churn confirmado, canceladas o dormidas — Bliss crédito
 * libre nunca recibió una— pero la ficha no lo decía en ninguna parte, y con el
 * semáforo pintando "Estable" el candado era invisible. Este banner hace
 * explícito el bloqueo y CADA una de sus causas, con el mismo texto que devuelve
 * el backend cuando rechaza la generación.
 */
export default function CuentaBloqueoBanner({ bloqueo }: { bloqueo: BloqueoComercial }) {
  if (!bloqueo.bloqueada) return null

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.35)' }}
    >
      <div className="flex items-start gap-2.5">
        <Ban size={16} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
        <div style={{ minWidth: 0 }}>
          <p className="text-[13px] font-bold" style={{ color: '#B91C1C', margin: 0 }}>
            Cuenta fuera del programa SAC — no se generan actividades
          </p>
          <ul className="mt-1.5" style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
            {bloqueo.motivos.map((m, i) => (
              <li
                key={i}
                className="text-[11.5px]"
                style={{ color: '#7F1D1D', lineHeight: 1.5, paddingLeft: 12, position: 'relative' }}
              >
                <span style={{ position: 'absolute', left: 0 }}>·</span>
                {m.replace(/^Actividad bloqueada:\s*/, '')}
              </li>
            ))}
          </ul>
          {/* Bloqueada NO implica muerta. Una cuenta puede seguir facturando y
              estar fuera del ritual SAC por decisión de dirección (hoy:
              Pitahaya, un downgrade). Decirle a su asesor que el Health Score
              es "historial" sería falso y contradiría el badge ACTIVA que se
              pinta dos líneas más arriba en la misma ficha. */}
          <p className="text-[10.5px]" style={{ color: '#9A3412', margin: '8px 0 0', lineHeight: 1.5 }}>
            {bloqueo.sigueViva
              ? 'La cuenta sigue activa y su Health Score es vigente: lo que está suspendido es el ritual de actividades SAC, no el servicio.'
              : 'El Health Score que se muestra es el último calculado mientras la cuenta estuvo activa: es historial, no salud vigente.'}
          </p>
        </div>
      </div>
    </div>
  )
}
