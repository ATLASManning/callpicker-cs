import Link from 'next/link'
import { UserPlus, AlertCircle } from 'lucide-react'
import type { NuevosSinAsesor } from '@/lib/nuevos-sin-asesor'

/**
 * EL GLOBO DE «ESTE CLIENTE NO TIENE ASESOR».
 *
 * Encargo de dirección, 16 oct 2026: «un globo de información relevante e
 * importante, con la leyenda: se pide revisar si a esta cuenta se le asigna
 * un Asesor».
 *
 * ── POR QUÉ NO SE PINTA CUANDO NO HAY NADA ────────────────────────────────
 * Un aviso que está siempre deja de ser un aviso. Medido el 16 oct: por la
 * vía de facturación hay CERO huérfanos y por activaciones UNO en los últimos
 * noventa días. O sea que el estado normal de este globo es no existir, y eso
 * es exactamente lo que le da valor el día que aparece.
 *
 * ── LO QUE SÍ SE DICE CUANDO NO SE PINTA ──────────────────────────────────
 * Si una de las dos fuentes no se pudo leer, el globo SÍ sale, en gris, para
 * decirlo. Un panel ausente porque no hay nada y un panel ausente porque no
 * se midió se ven igual, y no son lo mismo. [[feedback-cero-sin-medicion]]
 *
 * Los colores salen de la paleta del Customer Success Operating System, y el
 * ámbar del texto va oscurecido: el `#f59e0b` crudo da 2.15:1 sobre su propio
 * tinte y aquí el dato es la cifra. [[atlas-dashboard-contrast-architecture]]
 */

const AMBAR      = '#F59E0B'
const AMBAR_TX   = '#8A5906'
const MARINO     = '#10355D'
const TINTA      = '#202E3B'
const SECUNDARIO = '#5C6978'
const LINEA      = '#DFE8EF'

const money = (n: number) =>
  '$' + Math.round(n).toLocaleString('es-MX')

export default function GloboNuevosSinAsesor({ d }: { d: NuevosSinAsesor }) {
  const sinMedir = !d.leyó.activaciones || !d.leyó.facturacion

  /* Nada que avisar y todo medido: el globo no existe. */
  if (!d.nuevos.length && !sinMedir) return null

  if (!d.nuevos.length && sinMedir) {
    const cuales = [
      !d.leyó.activaciones ? 'Activaciones 2.0' : null,
      !d.leyó.facturacion ? 'Facturación' : null,
    ].filter(Boolean).join(' y ')
    return (
      <div className="rounded-xl p-4 mb-5"
        style={{ background: '#F5F8FB', border: `1px solid ${LINEA}` }}>
        <p className="text-sm font-semibold" style={{ color: TINTA }}>
          Clientes sin asesor: no se pudo revisar
        </p>
        <p className="text-xs mt-1" style={{ color: SECUNDARIO }}>
          No se pudo leer {cuales}, así que esta comprobación no corrió. No
          quiere decir que no haya ninguno: quiere decir que no se miró.
        </p>
      </div>
    )
  }

  const n = d.nuevos.length
  return (
    <div className="rounded-xl mb-5 overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${LINEA}`,
        borderLeft: `4px solid ${AMBAR}`,
        boxShadow: '0 1px 3px rgba(16,53,93,0.08)',
      }}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${AMBAR}1A`, border: `1px solid ${AMBAR}33` }}>
            <UserPlus size={17} style={{ color: AMBAR_TX }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: TINTA }}>
              {n === 1
                ? 'Un cliente de más de ' + money(d.umbral) + ' no tiene asesor'
                : n + ' clientes de más de ' + money(d.umbral) + ' no tienen asesor'}
            </p>
            {/* La leyenda, con las palabras de dirección. */}
            <p className="text-xs mt-0.5 font-semibold" style={{ color: AMBAR_TX }}>
              Se pide revisar si a esta cuenta se le asigna un Asesor.
            </p>

            <ul className="mt-3 space-y-1.5">
              {d.nuevos.slice(0, 6).map((c, i) => (
                <li key={c.cliente + i}
                  className="flex items-baseline justify-between gap-3 py-1.5"
                  style={{ borderBottom: i < Math.min(d.nuevos.length, 6) - 1
                    ? `1px solid ${LINEA}` : 'none' }}>
                  <span className="text-sm font-semibold truncate" style={{ color: TINTA }}>
                    {c.cliente}
                    {c.veredicto === 'sin_asesor' && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: `${MARINO}14`, color: MARINO }}>
                        está en cartera, sin asesor
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: AMBAR_TX }}>
                    {money(c.importe)}
                    {/* QUÉ es esa cifra, que no es lo mismo en las dos fuentes. */}
                    <span className="ml-1.5 text-[10px] font-medium" style={{ color: SECUNDARIO }}>
                      {c.fuente === 'activacion' ? 'primer pago' : 'MRR'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {d.nuevos.length > 6 && (
              <p className="text-xs mt-2" style={{ color: SECUNDARIO }}>
                y {d.nuevos.length - 6} más
              </p>
            )}

            {/* El pie dice de dónde sale y qué NO entra, para que el número
                se pueda defender sin abrir el código. */}
            <p className="text-[11px] mt-3 leading-relaxed" style={{ color: SECUNDARIO }}>
              De Activaciones 2.0 (primer pago) y de Facturación (MRR del Gross
              Revenue), con primer pago en los últimos {d.dias} días.
              {d.antiguos > 0 && (
                <> Hay <strong style={{ color: TINTA }}>{d.antiguos}</strong> más
                por encima del umbral sin cuenta en la cartera, pero de antes de
                esa ventana: no son altas nuevas, son un rezago.</>
              )}
              {d.porConfirmar > 0 && (
                <> Otros <strong style={{ color: TINTA }}>{d.porConfirmar}</strong> se
                parecen a una cuenta que ya existe y no se cuentan aquí — el
                nombre cambia entre sistemas y hay que confirmarlos a mano.</>
              )}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <Link href="/cuentas/nueva"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: MARINO, color: '#FFFFFF' }}>
                <UserPlus size={12} />
                Dar de alta y asignar
              </Link>
              <Link href="/activaciones"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: `${MARINO}12`, color: MARINO,
                         border: `1px solid ${MARINO}25` }}>
                Ver Activaciones 2.0
              </Link>
            </div>
          </div>
        </div>

        {sinMedir && (
          <p className="text-[11px] mt-3 flex items-start gap-1.5"
            style={{ color: AMBAR_TX }}>
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
            Ojo: {!d.leyó.activaciones ? 'Activaciones 2.0' : 'Facturación'} no
            se pudo leer, así que esta lista puede estar incompleta.
          </p>
        )}
      </div>
    </div>
  )
}
