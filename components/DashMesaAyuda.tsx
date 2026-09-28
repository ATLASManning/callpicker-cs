import { AlertTriangle, Clock, Inbox, UserX } from 'lucide-react'
import type { resumenMesa } from '@/lib/mesa-ayuda'

/**
 * components/DashMesaAyuda.tsx — el corte diario de la mesa, en el Dashboard.
 *
 * POR QUÉ EXISTE
 * --------------
 * Dirección, 28 sep 2026: «el reporte diario de Zoho Desk no lo veo en el
 * Dashboard». Y tenía razón: el corte se cargaba, llegaba a producción y
 * alimentaba el evaluador de candidatura, la ficha de cuenta y el módulo
 * Tickets — pero en la pantalla principal no se pintaba en ningún lado. Era un
 * dato vivo e invisible.
 *
 * LO QUE DICE Y LO QUE NO
 * -----------------------
 * Los KPIs son GLOBALES de la mesa, no de una cuenta. La mesa publica cuántos
 * tickets están abiertos en total; NO permite saber cuántos tiene cada cliente.
 * Por eso el bloque de abajo es de VENCIDOS —ahí sí hay folio y cuenta— y los
 * tres números de arriba se etiquetan como lo que son.
 *
 * Confundir las dos cosas es justo el error que este módulo vino a corregir: el
 * tablero afirmaba «0 abiertos» de GRUPO 2711 porque el export de Zoho solo
 * trae cerrados, mientras su folio llevaba 21 días fuera de SLA.
 *
 * LA RACHA ES EL DATO
 * -------------------
 * «15 de 15 cortes» dice más que «148 días»: un folio viejo puede ser un caso
 * raro, pero aparecer en TODOS los cortes desde que se mide es un patrón que no
 * se ha roto ni una vez.
 */
export default function DashMesaAyuda({
  mesa, panel, borde, txHi, txMid, txLow,
}: {
  mesa: ReturnType<typeof resumenMesa>
  panel: string; borde: string; txHi: string; txMid: string; txLow: string
}) {
  if (!mesa.hay) return null

  const kpis = [
    { icono: Inbox,          n: mesa.abiertos,    t: 'abiertos',      c: '#7DD3FC' },
    { icono: Clock,          n: mesa.enEspera,    t: 'en espera',     c: '#EAB308' },
    { icono: AlertTriangle,  n: mesa.vencidos,    t: 'fuera de SLA',  c: '#EF4444' },
    { icono: UserX,          n: mesa.noAsignados, t: 'sin asignar',   c: '#F97316' },
  ]

  return (
    <div style={{ background: panel, border: `1px solid ${borde}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: txMid, margin: 0 }}>
          Mesa de ayuda · corte diario
        </p>
        {/* La fecha del corte dice de CUÁNDO es todo lo demás. A 12 px, `txLow`
            da 4.18:1 sobre este panel y el mínimo es 4.5. */}
        <span style={{ fontSize: 12, color: txMid }}>
          {mesa.fecha}{mesa.hora ? ` · ${mesa.hora}` : ''} · corte {mesa.cortes} de la serie
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {kpis.map(k => {
          const Icono = k.icono
          return (
            <div key={k.t} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Icono size={13} style={{ color: k.c }} />
                <span style={{ fontSize: 11, color: txMid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.t}</span>
              </div>
              {/* Un hueco se dice, no se pinta como cero: la mesa puede no
                  publicar un KPI en un corte y eso no es «ninguno». */}
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: k.n == null ? txLow : k.c, lineHeight: 1.1 }}>
                {k.n == null ? '—' : k.n}
              </p>
            </div>
          )
        })}
      </div>

      {/* `txMid` y no `txLow`: esta advertencia es lo que impide confundir un
          KPI global con uno por cuenta. Ponerla al 45% de opacidad sería
          esconder justo la línea que evita el malentendido. */}
      <p style={{ fontSize: 11, color: txMid, margin: '0 0 10px', lineHeight: 1.5 }}>
        Los cuatro números son de TODA la mesa, no de una cuenta: el reporte no reparte los abiertos
        por cliente. Lo que sí trae cuenta y folio son los vencidos.
      </p>

      {mesa.porCuenta.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: txMid, margin: '0 0 8px' }}>
            Cuentas fuera de SLA hoy
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mesa.porCuenta.map(c => {
              /* Umbrales medidos sobre los cortes reales, no elegidos a ojo:
                 ver REINCIDE_DESDE y GRAVE_DIAS en lib/soporte-cuenta.ts. */
              const grave = c.peorDias >= 14
              const reincide = c.rachas >= 3
              return (
                <div key={c.cid} style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  padding: '8px 12px', borderRadius: 10,
                  background: grave ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                  borderLeft: `3px solid ${grave ? '#EF4444' : '#EAB308'}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: txHi, flex: 1, minWidth: 160 }}>
                    {c.cuenta}
                  </span>
                  <span style={{ fontSize: 11, color: txMid, fontFamily: 'monospace' }}>CID {c.cid}</span>
                  <span style={{ fontSize: 12, color: txMid }}>
                    {c.folios} folio{c.folios === 1 ? '' : 's'}
                  </span>
                  {/* `#F87171` y no `#EF4444`: a 13 px el mínimo es 4.5:1 y el
                      rojo fuerte da 4.29 sobre este panel. El número grande de
                      arriba sí lo usa, porque a 26 px en negrita cuenta como
                      texto grande y ahí el mínimo baja a 3:1. Calculado, no
                      estimado. */}
                  <span style={{ fontSize: 13, fontWeight: 800, color: grave ? '#F87171' : '#EAB308' }}>
                    {c.peorDias} días fuera de SLA
                  </span>
                  {reincide && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                      background: 'rgba(239,68,68,0.15)', color: '#FCA5A5',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}>
                      en {c.rachas} de {mesa.cortes} cortes
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
