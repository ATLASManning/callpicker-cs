import { getEstadoCuentaConfig } from '@/lib/types'
import { tonoSobreClaro } from '@/lib/contraste'

/**
 * Estatus comercial de la cuenta, dicho con todas sus letras.
 *
 * Nace del reporte de Claudia (9-sep-2026): "Bliss crédito libre" se veía
 * *Estable* estando cancelada. El semáforo mide salud; el estatus dice si
 * todavía hay cliente. Cuando la cuenta ya no está viva, esto es lo primero
 * que debe leerse — por eso las no vivas se pintan con relleno sólido y no
 * como una etiqueta más del montón.
 */
export default function EstadoCuentaBadge({
  estado, size = 'md',
}: {
  estado: string | null | undefined
  size?: 'sm' | 'md'
}) {
  const cfg = getEstadoCuentaConfig(estado)
  const sm = size === 'sm'

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap"
      style={{
        fontSize: sm ? 10 : 11,
        padding: sm ? '2px 8px' : '3px 10px',
        letterSpacing: '0.03em',
        /* La rama VIVA pintaba la letra con el MISMO color del fondo —`color:
           cfg.color` sobre `${cfg.color}18`— y esta pastilla vive en el
           encabezado de la ficha, que está sobre la página clara. El tinte al
           9.4% compuesto sobre el `#EFF6FF` queda casi blanco: Activa medía
           2.74:1 y En riesgo 2.93:1, por debajo incluso del 3:1 con el que ya
           no se lee. Y es la rama que se ve casi siempre, porque `activo` y
           `en_riesgo` son los dos estados normales de la cartera.

           El tono se CALCULA hasta 4.5:1 en vez de elegirse: es exactamente el
           caso para el que se escribió `tonoSobreClaro`. La rama no viva se
           queda como está — blanco sobre relleno sólido ya mide 4.8:1. */
        color:      cfg.viva ? tonoSobreClaro(cfg.color, 0.094) : '#fff',
        background: cfg.viva ? `${cfg.color}18` : cfg.color,
        border:     `1px solid ${cfg.color}${cfg.viva ? '55' : ''}`,
      }}
      title={cfg.viva ? `Cuenta ${cfg.label.toLowerCase()}` : `Cuenta ${cfg.label.toLowerCase()} — sin servicio vigente`}
    >
      {!cfg.viva && (
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: sm ? 5 : 6, height: sm ? 5 : 6, background: '#fff', opacity: 0.9 }}
        />
      )}
      {cfg.label.toUpperCase()}
    </span>
  )
}
