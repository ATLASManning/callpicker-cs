'use client'
import Link from 'next/link'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import type { Cuenta } from '@/lib/types'
import { getSemaforoCuenta, ASESOR_CONFIG, configAsesor, formatMXN } from '@/lib/types'
import { textoSobreSolido } from '@/lib/contraste'
import * as TEMA from '@/lib/chart-theme'

/* ── UNA SOLA PALETA (4 nov 2026) ──────────────────────────
   Esta tabla tenia DOS: una clara —azules y rojos de Tailwind— y una oscura
   con los tokens del tema, elegidas por una prop `dark`. Al pasar el
   Dashboard a isla clara la rama oscura se quedo SIN UN SOLO CONSUMIDOR
   (`app/page.tsx` es el unico que monta esta tabla), y dos paletas
   equivalentes lado a lado en un archivo son la trampa documentada: alguien
   corrige una y la otra se queda vieja sin que falle nada.

   Asi que la prop se fue y queda una. Los tonos son los del tema, medidos
   contra la tarjeta BLANCA. Lo que se cayo al unificar:

       #A8BACB (texto apagado)  1.99:1  ->  TX.low      4.83:1
       #F97316 (muchos tickets) 2.80:1  ->  AMBAR_AVISO 6.39:1
       #EF4444 (fallas)         3.76:1  ->  ROJO_AVISO  7.26:1
       #22C55E (health bueno)   2.28:1  ->  BANDA.bajo  3.03:1 (objeto grafico)
       #EAB308 (health medio)   1.75:1  ->  BANDA.medio 7.02:1

   Ninguno de esos cinco llegaba a AA sobre blanco, y NO los introdujo este
   cambio: estaban en la rama clara desde antes.
   [[feedback-verificar-antes-asegurar]]
*/
const D = {
  border:   TEMA.BORDE,
  txHi:     TEMA.TX.hi,
  txMid:    TEMA.TX.mid,
  txLow:    TEMA.TX.low,
  rowAlt:   TEMA.SUPERFICIE.cebra,
  rowHover: TEMA.SUPERFICIE.aviso,
  enlace:   TEMA.ACENTO,
  th:       TEMA.SUPERFICIE.cebra,
}

/** La banda del semaforo con el color del tema. */
function bandaDeSemaforo(semaforo: string): { color: string; etiqueta: string } {
  if (semaforo === 'inactivo') return { color: TEMA.TX.low, etiqueta: 'Inactiva' }
  const b = (TEMA.BANDA_DE_SEMAFORO as Record<string, TEMA.Banda>)[semaforo] ?? 'medio'
  return { color: TEMA.BANDA[b], etiqueta: TEMA.BANDA_SEMAFORO_ETIQUETA[b].split(' · ')[0] }
}

interface Props { cuentas: Cuenta[] }

function fmtFecha(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

/* `nunca` NO es «hace N días». Cuando no hay ningún contacto registrado, el
   número que lleva `dias` es la ANTIGÜEDAD de la cuenta —así ordena arriba, que
   es donde debe ir—, pero escribirlo como «1694d» se leería como un contacto de
   hace cuatro años. Son 42 de las 192 cuentas vivas. */
function DiasCell({ dias, nunca }: { dias: number; nunca?: boolean }) {
  const color = nunca || dias > 30 ? TEMA.ROJO_AVISO
    : dias > 14 ? TEMA.AMBAR_AVISO : D.txMid
  const weight = nunca || dias > 14 ? 700 : 500
  return (
    <span style={{ fontSize: 12, fontWeight: weight, color }}
      title={nunca ? 'Sin ningún contacto registrado' : undefined}>
      {nunca ? 'nunca' : `${dias}d`}
    </span>
  )
}

function TicketsCell({ cuenta }: { cuenta: Cuenta }) {
  const zt = cuenta.zoho_tickets
  if (!zt || zt.total === 0) {
    return <span style={{ fontSize: 12, color: D.txLow }}>—</span>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          color: zt.total > 10 ? TEMA.AMBAR_AVISO : D.txHi,
        }}>
          {zt.total}
        </span>
        {zt.fallas > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 99,
            background: TEMA.ROJO_AVISO_FONDO,
            color: TEMA.ROJO_AVISO, fontSize: 11, fontWeight: 700,
            border: `1px solid ${TEMA.ROJO_AVISO}`,
            whiteSpace: 'nowrap',
          }}>
            <AlertTriangle size={8} /> {zt.fallas} falla{zt.fallas > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {zt.ultima && (
        <span style={{ fontSize: 10, color: D.txLow, whiteSpace: 'nowrap' }}>
          Últ: {fmtFecha(zt.ultima)}
        </span>
      )}
    </div>
  )
}

export default function TopRiesgoTable({ cuentas }: Props) {
  if (cuentas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: D.txLow, fontSize: 14 }}>
        No hay cuentas en riesgo — ¡excelente estado de cartera!
      </div>
    )
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left',
    fontSize: 12, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    color: D.txLow,
    background: D.th,
    borderBottom: `1px solid ${D.border}`,
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderBottom: `1px solid ${D.border}`,
    fontSize: 13,
    verticalAlign: 'middle',
    color: D.txMid,
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: 72 }} />
          <col style={{ width: 200 }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 115 }} />
          <col style={{ width: 115 }} />
          <col style={{ width: 115 }} />
          <col style={{ width: 105 }} />
          <col style={{ width: 145 }} />
          <col style={{ width: 60 }} />
        </colgroup>
        <thead>
          <tr>
            {['Cuenta','Empresa','Asesor','Facturación','Health Score','Semáforo',
              'Días sin actividad','Tickets Zoho Desk',''].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cuentas.map((c, idx) => {
            const semaforo = getSemaforoCuenta(c)
            const ac = configAsesor(c.asesor)
            // 'inactivo' se contempla explícitamente: sin este caso caía en el
            // `else` y una cuenta cancelada mostraba su Health Score en ROJO,
            // es decir "riesgo alto" — cuando ya no hay riesgo, hay baja.
            const banda = bandaDeSemaforo(semaforo)
            /* La cifra del Health Score va en el color de SU BANDA, que son
               los tres pasos ya medidos. Los cuatro tonos de antes —verde,
               ambar y rojo de Tailwind— median entre 1.75 y 3.76:1. */
            const hsColor = banda.color
            /* El respaldo NO puede ser un color de serie: cuando valia
               SILVER[500] coincidia con el tono de una asesora. */
            const colorAsesor = TEMA.ASESOR[c.asesor] ?? TEMA.TX.low
            const rowBg = idx % 2 === 0 ? 'transparent' : D.rowAlt

            return (
              <tr key={c.id}
                style={{ background: rowBg }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = D.rowHover }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = rowBg }}
              >
                <td style={tdStyle}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                    color: D.enlace,
                  }}>
                    {c.consecutivo}
                  </span>
                </td>

                <td style={tdStyle}>
                  <Link href={`/cuentas/${c.id}`}
                    style={{
                      fontSize: 13, fontWeight: 600, display: 'block',
                      lineHeight: 1.3, textDecoration: 'none',
                      color: D.txHi,
                    }}
                    className="hover:underline"
                  >
                    {c.empresa}
                  </Link>
                  {c.giro && (
                    <span style={{
                      fontSize: 11, display: 'block',
                      maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: D.txLow,
                    }}>
                      {c.giro}
                    </span>
                  )}
                </td>

                <td style={tdStyle}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      /* Relleno SOLIDO con el color del asesor: la letra NO
                         se pone por costumbre. `textoSobreSolido` devuelve
                         blanco si el blanco pasa y, si no, el propio tono
                         oscurecido. Hace falta: el asesor mas claro mide
                         3.03:1 con blanco encima — vale de relleno y NO de
                         letra. [[atlas-dashboard-contrast-architecture]] */
                      background: colorAsesor,
                      color: textoSobreSolido(colorAsesor),
                    }}>
                      {ac.initial}
                    </span>
                    <span style={{ fontSize: 12, color: D.txMid }}>
                      {c.asesor}
                    </span>
                  </span>
                </td>

                <td style={tdStyle}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    color: D.txHi,
                  }}>
                    {formatMXN(c.facturacion)}
                  </span>
                </td>

                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* El anillo traia su propio arcoiris, que es otra escala
                        de riesgo al lado de la del tema: dos codigos para lo
                        mismo. Queda la cifra en el color de su banda. */}
                    <span style={{
                      fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      color: hsColor, background: 'transparent',
                    }}>
                      {c.health_score}
                    </span>
                  </div>
                </td>

                <td style={tdStyle}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                                 background: 'transparent', color: D.txMid, fontSize: 12 }}>
                    <i aria-hidden style={{ width: 9, height: 9, borderRadius: 2,
                                            background: banda.color, display: 'inline-block' }} />
                    {banda.etiqueta}
                  </span>
                </td>

                <td style={tdStyle}>
                  <DiasCell dias={c.dias_sin_actividad} nunca={c.dias_sin_contacto == null} />
                </td>

                <td style={tdStyle}>
                  <TicketsCell cuenta={c} />
                </td>

                <td style={tdStyle}>
                  <Link href={`/cuentas/${c.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                      fontSize: 12, fontWeight: 600, textDecoration: 'none',
                      color: D.enlace,
                    }}
                    className="hover:underline"
                  >
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
