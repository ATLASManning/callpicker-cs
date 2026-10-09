import Link from 'next/link'
import { AlertTriangle, BellRing } from 'lucide-react'
import { formatMXN } from '@/lib/types'

/**
 * components/ColaDeTrabajoAsesor.tsx — SU SEMANA, EN SU PANTALLA DE INICIO
 *
 * Vive fuera de `AsesorCard` por una razón de tiempos, no de orden. El motor
 * de veredictos cuesta entre 1.6 y 2.7 segundos —medido: lo que pesa son las
 * lecturas globales de facturación y cortes, no las cuentas, así que filtrar
 * por asesora casi no lo baja— y `AsesorCard` es un componente de cliente que
 * recibe datos ya resueltos. Tenerlo dentro obligaba a la página a esperar el
 * motor ANTES de pintar nada: `/asesores` pasó de 1.8 a 4.5 segundos, en la
 * pantalla con la que el asesor empieza el día.
 *
 * Separado, la página lo envuelve en `<Suspense>` y se transmite aparte: la
 * tarjeta sale de inmediato y la cola aterriza un segundo después, en su
 * hueco. Un tablero que tarda cinco segundos en aparecer se abre menos veces,
 * y éste tiene que abrirse todos los días.
 *
 * @contraste-padre: este componente no dibuja fondo — se monta en el hueco
 * `colaDeTrabajo` de `AsesorCard`, dentro del degradado
 * `linear-gradient(135deg, #0A1628, #0F2040)`. La medición se hace contra
 * `#0F2040`, que es el extremo MÁS CLARO del degradado y por tanto el que
 * aprieta: medir contra `#0A1628` regalaría décimas que la pantalla no da.
 */

const TX_HI  = '#FFFFFF'                      /* 16.14:1 sobre #0F2040 */
const TX_MID = 'rgba(255,255,255,0.70)'       /*  8.48:1 */
/* El 0.45 de la primera versión medía 4.31:1 — por debajo del 4.5 de AA, y
   justo en las etiquetas de 11px, que son las que menos perdonan. El alfa
   mínimo que pasa es 0.47 (4.57:1) y ése va demasiado al filo: 0.50 da
   4.84:1. Medido el 8 oct 2026 contra #0F2040. */
const TX_LOW = 'rgba(255,255,255,0.50)'       /*  4.84:1 */
const LINEA  = 'rgba(255,255,255,0.10)'

export interface AlertasAsesor {
  /** Cuentas con veredicto emitido. */
  total: number
  /** Lo que pide trabajo: todo menos «en orden». */
  mrrEnRiesgo: number
  porSituacion: Array<{ k: string; titulo: string; color: string; n: number; mrr: number }>
  top: Array<{ cuentaId: string; empresa: string; mrr: number | null; color: string; accion: string }>
  /** Motivo por el que NO se pudo medir. Nunca se dibuja un cero en su lugar. */
  falla: string | null
}

const CAJA: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINEA}`,
}

/** Lo que se ve mientras el motor calcula. Dice que está trabajando, no un
 *  cero: un «0 alertas» que luego cambia a 23 es peor que esperar. */
export function ColaCargando() {
  return (
    <div className="px-6 pb-5">
      <div className="rounded-xl p-4" style={CAJA}>
        <span className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: TX_LOW, background: 'transparent' }}>Mis alertas</span>
        <span className="text-[11px] ml-2" style={{ color: TX_LOW, background: 'transparent' }}>
          calculando el veredicto de sus cuentas…
        </span>
      </div>
    </div>
  )
}

export default function ColaDeTrabajoAsesor({
  asesor, alertas, acento,
}: {
  asesor: string
  alertas: AlertasAsesor
  /** El color de la asesora, el mismo que usa el resto de su tarjeta. */
  acento: string
}) {
  const BTN = 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg '
            + 'text-[11px] font-bold text-white shadow-sm transition-all duration-150 '
            + 'whitespace-nowrap hover:brightness-110'

  return (
    <div className="px-6 pb-5">
      <div className="rounded-xl p-4" style={CAJA}>

        {alertas.falla ? (
          /* Un cero sin medición no es un cero: si el motor falló se dice, en
             vez de pintar «0 alertas», que se leería como buenas noticias.
             Ver [[feedback-cero-sin-medicion]]. */
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
            <span className="text-[11.5px]" style={{ color: TX_MID, background: 'transparent' }}>
              No se pudieron calcular tus alertas: {alertas.falla}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: TX_LOW, background: 'transparent' }}>Mis alertas</span>
                <span className="text-[11px]" style={{ color: TX_LOW, background: 'transparent' }}>
                  {alertas.total} cuenta{alertas.total !== 1 ? 's' : ''} con veredicto
                  {alertas.mrrEnRiesgo > 0 && ` · ${formatMXN(alertas.mrrEnRiesgo)} pidiendo trabajo`}
                </span>
              </div>
              <Link href={`/alertas?asesor=${encodeURIComponent(asesor)}`}
                className={BTN} style={{ background: acento }}>
                <BellRing size={12} /> Abrir mi cola de trabajo
              </Link>
            </div>

            {/* El reparto. Cada mosaico filtra la pantalla de Alertas: el
                número ES el enlace, no un adorno al lado de uno. */}
            <div className="flex flex-wrap gap-2 mb-3">
              {alertas.porSituacion.map(s => (
                <Link key={s.k}
                  href={`/alertas?asesor=${encodeURIComponent(asesor)}&situacion=${s.k}`}
                  className="rounded-lg px-3 py-2 transition-all hover:brightness-125"
                  style={{ background: `${s.color}1A`, border: `1px solid ${s.color}44`, minWidth: 124 }}>
                  <span className="flex items-baseline gap-1.5" style={{ background: 'transparent' }}>
                    <span className="text-[17px] font-extrabold leading-none"
                      style={{ color: s.color, background: 'transparent' }}>{s.n}</span>
                    {s.mrr > 0 && (
                      <span className="text-[10px]" style={{ color: TX_LOW, background: 'transparent' }}>
                        {formatMXN(s.mrr)}
                      </span>
                    )}
                  </span>
                  <span className="block text-[10.5px] font-semibold mt-0.5"
                    style={{ color: s.color, background: 'transparent' }}>{s.titulo}</span>
                </Link>
              ))}
            </div>

            {/* Lo primero de la cola, ya con su acción: que no haga falta abrir
                otra pantalla para saber por dónde empezar el lunes. */}
            {alertas.top.length > 0 && (
              <div className="space-y-1.5">
                {alertas.top.map(t => (
                  <Link key={t.cuentaId} href={`/cuentas/${t.cuentaId}`}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: t.color,
                                   display: 'inline-block', flexShrink: 0, marginTop: 5 }} />
                    <span className="block min-w-0" style={{ background: 'transparent' }}>
                      <span className="block text-[12px] font-semibold truncate"
                        style={{ color: TX_HI, background: 'transparent' }}>
                        {t.empresa}
                        {t.mrr !== null && (
                          <span className="font-normal ml-1.5"
                            style={{ color: TX_LOW, background: 'transparent' }}>
                            {formatMXN(t.mrr)}
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] leading-snug"
                        style={{ color: TX_MID, background: 'transparent' }}>{t.accion}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
