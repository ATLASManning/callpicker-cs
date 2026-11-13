'use client'

/**
 * Cuentas → Activas con Downgrade.
 *
 * Pedido por dirección (13 nov 2026): un apartado entre «Activas» y
 * «Auditoría» para las cuentas que siguen vivas pero encogieron.
 *
 * ── POR QUÉ LA LISTA ES CURADA ────────────────────────────────────────────
 * Está medido y ninguna fuente contesta sola: el GRC del corte vivo trae 16
 * downgrades y CERO de la cartera; el corte de Análisis DATA trae 3 y los tres
 * están fuera de la cartera CS; y GRC AAA 2026 cruza 60, que es el histórico
 * del año entero. Quién entra lo decide dirección en
 * `data/cuentas-downgrade.json`. El detalle está en `/api/cuentas/downgrade`.
 *
 * ── LO QUE ESTA PANTALLA SE NIEGA A HACER ─────────────────────────────────
 *
 * 1. NO pinta «$0 perdidos» cuando las fuentes no traen eventos de una cuenta
 *    marcada. Dirección puede saber de un downgrade por la factura antes de
 *    que el GRC lo publique: eso se dice con palabras, no con un cero.
 *    [[feedback-cero-sin-medicion]]
 * 2. NO deja la tabla de eventos sin decir QUÉ PERIODO cubre. Una tabla de
 *    eventos sin periodo se lee como «todo lo que ha pasado».
 *    [[feedback-contexto-ia-sin-huecos]]
 * 3. NO llama baja a un downgrade. La cuenta sigue activa y sigue en la
 *    cartera de su asesor; esta pantalla la pone ADEMÁS aquí para que se mire.
 *
 * Página clara con UNA isla oscura, el hero. Dentro del hero, letra clara;
 * fuera, letra oscura. [[atlas-dashboard-contrast-architecture]]
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingDown, ExternalLink, AlertTriangle } from 'lucide-react'
import HeroModulo from '@/components/HeroModulo'
import {
  MARINO, AZUL, LINEA, LAVADO, TX_ALTO, TX_MED, TX_BAJO,
  ROJO_TX, AMBAR_TX, ZEBRA, SOMBRA, MISION,
} from '@/lib/paleta-cs'

interface Evento { mes: string; mrrInicio: number; mrrFin: number; perdido: number }
interface Fila {
  id: string
  cid: string | null
  consecutivo: string | null
  empresa: string
  asesor: string | null
  estado: string | null
  mrr: number | null
  health_score: number | null
  fecha: string | null
  quien: string | null
  razon: string | null
  queBajo: string | null
  origen: string | null
  eventos: Evento[]
  eventosMedibles: boolean
  perdidoGrc: number
}
interface Respuesta {
  filas: Fila[]
  problemas: { cid: string; empresa: string; que: string }[]
  cobertura: { grcAaaMeses: string[] }
  acotadoA: string | null
}

const pesos = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function ActivasConDowngrade() {
  const [d, setD] = useState<Respuesta | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/cuentas/downgrade')
      .then(r => r.json())
      .then(j => (j.error ? setError(String(j.error)) : setD(j)))
      .catch(e => setError(String(e)))
  }, [])

  const filas = d?.filas ?? []
  const conMedicion = filas.filter(f => f.eventosMedibles)
  const perdido = conMedicion.reduce((s, f) => s + f.perdidoGrc, 0)
  const mrrVigente = filas.reduce((s, f) => s + (f.mrr ?? 0), 0)

  /* LAS PASTILLAS DICEN SOBRE CUÁNTAS CUENTAS ESTÁN CALCULADAS.
     «$X perdidos» a secas, con cuentas sin medición en la tabla, afirma de
     ellas que perdieron cero. Va el `i/N`. [[feedback-cero-sin-medicion]] */
  const pastillas = filas.length
    ? [
        `${filas.length} ${filas.length === 1 ? 'cuenta' : 'cuentas'}`,
        `${pesos(mrrVigente)} de MRR vigente`,
        conMedicion.length
          ? `${pesos(perdido)} de caída medida en ${conMedicion.length} de ${filas.length}`
          : 'ninguna tiene caída medible en el GRC todavía',
      ]
    : undefined

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <HeroModulo
        titulo="Activas con"
        tituloCian="Downgrade"
        lead="Cuentas que siguen vivas, siguen en la cartera de su asesor y siguen facturando — pero encogieron. Un downgrade no es una baja: es la señal que la precede, y es la que todavía se puede revertir."
        pastillas={pastillas}
      />

      <main style={{ padding: '28px 32px 60px', color: TX_ALTO }}>
        {error && (
          <p style={{ color: ROJO_TX, fontSize: 13, fontWeight: 700 }}>
            No se pudo leer el apartado: {error}
          </p>
        )}

        {d?.acotadoA && (
          <p style={{ fontSize: 12, color: TX_MED, marginBottom: 16 }}>
            Estás viendo sólo la cartera de <strong style={{ color: MARINO }}>{d.acotadoA}</strong>.
            Puede haber cuentas marcadas en otras carteras que no salen aquí.
          </p>
        )}

        {/* ── NINGUNA MARCADA: SE DICE QUÉ FALTA, NO SE PINTA UNA TABLA VACÍA ── */}
        {d && filas.length === 0 && !d.problemas.length && (
          <section style={{
            background: MISION, border: `1px solid ${LINEA}`, borderRadius: 14,
            padding: '22px 24px', boxShadow: SOMBRA, maxWidth: 820,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: MARINO, marginBottom: 8 }}>
              Todavía no hay ninguna cuenta marcada
            </h2>
            <p style={{ fontSize: 13, color: TX_MED, lineHeight: 1.65, marginBottom: 10 }}>
              Esto <strong>no</strong> quiere decir que ninguna cuenta de la cartera haya
              tenido un downgrade. Quiere decir que nadie ha marcado ninguna todavía: la
              lista es curada porque ninguna fuente contesta sola la pregunta.
            </p>
            <ul style={{ fontSize: 12.5, color: TX_MED, lineHeight: 1.75, paddingLeft: 18 }}>
              <li>
                El GRC del corte vivo trae <strong>16</strong> filas con movimiento
                «Downgrade» y <strong>ninguna</strong> es de la cartera gestionada.
              </li>
              <li>
                El corte vigente de Análisis DATA trae <strong>3</strong>, y el propio
                corte dice de los tres que están <strong>fuera de la cartera CS</strong>.
              </li>
              <li>
                GRC AAA 2026 cruza <strong>60</strong> cuentas vivas, pero es el histórico
                del año entero: un downgrade de enero ya digerido pesa ahí igual que uno
                de octubre.
              </li>
            </ul>
            <p style={{ fontSize: 12.5, color: TX_MED, lineHeight: 1.65, marginTop: 12 }}>
              Se marca una cuenta añadiéndola a <code style={{
                background: LAVADO, border: `1px solid ${LINEA}`, borderRadius: 5,
                padding: '1px 5px', fontSize: 11.5, color: MARINO,
              }}>data/cuentas-downgrade.json</code> con su CID, quién la marca, cuándo y
              qué producto bajó. Las cifras no se teclean: el MRR y la caída salen de las
              fuentes al leer.
            </p>
          </section>
        )}

        {/* ── ENTRADAS QUE NO SE PUDIERON RESOLVER ─────────────────────────── */}
        {!!d?.problemas.length && (
          <section style={{
            background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: 12,
            padding: '14px 18px', marginBottom: 20, maxWidth: 820,
          }}>
            <p style={{ fontSize: 12.5, fontWeight: 800, color: MARINO,
                        display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <AlertTriangle size={15} />
              {d.problemas.length} entrada(s) marcadas que no se pudieron resolver
            </p>
            {d.problemas.map(p => (
              <p key={p.cid} style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>
                <strong>{p.empresa}</strong> (CID {p.cid}) — {p.que}. No se pinta:
                corrige la entrada en <code>data/cuentas-downgrade.json</code>.
              </p>
            ))}
          </section>
        )}

        {/* ── LA TABLA ─────────────────────────────────────────────────────── */}
        {filas.length > 0 && (
          <>
            <div style={{
              border: `1px solid ${LINEA}`, borderRadius: 14, overflow: 'hidden',
              boxShadow: SOMBRA,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: MARINO, color: '#FFFFFF' }}>
                    {['Cuenta', 'Asesor', 'MRR vigente', 'Qué bajó',
                      'Caída medida (GRC AAA)', 'Quién la marcó'].map(h => (
                      <th key={h} style={{
                        textAlign: h === 'MRR vigente' || h === 'Caída medida (GRC AAA)'
                          ? 'right' : 'left',
                        padding: '11px 14px', fontWeight: 700, fontSize: 11.5,
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={f.id} style={{
                      background: i % 2 ? ZEBRA : '#FFFFFF',
                      borderTop: `1px solid ${LINEA}`,
                    }}>
                      <td style={{ padding: '11px 14px', verticalAlign: 'top' }}>
                        <Link href={`/cuentas/${f.id}`} style={{
                          color: MARINO, fontWeight: 700, textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}>
                          {f.consecutivo && (
                            <span style={{ color: AZUL, fontWeight: 800 }}>{f.consecutivo}</span>
                          )}
                          {f.empresa}
                          <ExternalLink size={11} style={{ color: TX_BAJO }} />
                        </Link>
                        <div style={{ fontSize: 11, color: TX_BAJO, marginTop: 3 }}>
                          {f.estado === 'en_riesgo' ? 'En riesgo' : 'Activa'}
                          {f.cid ? ` · CID ${f.cid}` : ''}
                        </div>
                        {f.razon && (
                          <p style={{ fontSize: 11.5, color: TX_MED, marginTop: 6,
                                      maxWidth: 420, lineHeight: 1.55 }}>
                            {f.razon}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', color: TX_MED, verticalAlign: 'top' }}>
                        {f.asesor ?? '—'}
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right',
                                   fontWeight: 700, color: MARINO, verticalAlign: 'top',
                                   whiteSpace: 'nowrap' }}>
                        {f.mrr ? pesos(f.mrr) : (
                          <span style={{ color: AMBAR_TX, fontWeight: 600, fontSize: 11.5 }}>
                            sin dato en el corte
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', color: TX_MED, verticalAlign: 'top',
                                   maxWidth: 240, lineHeight: 1.5 }}>
                        {f.queBajo ?? <span style={{ color: TX_BAJO }}>no se anotó</span>}
                        {f.origen && (
                          <div style={{ fontSize: 11, color: TX_BAJO, marginTop: 4 }}>
                            según {f.origen}
                          </div>
                        )}
                      </td>
                      {/* UN CERO AQUÍ SERÍA UNA AFIRMACIÓN FALSA. */}
                      <td style={{ padding: '11px 14px', textAlign: 'right',
                                   verticalAlign: 'top' }}>
                        {f.eventosMedibles ? (
                          <>
                            <div style={{ fontWeight: 700, color: ROJO_TX, whiteSpace: 'nowrap' }}>
                              <TrendingDown size={12} style={{ display: 'inline', marginRight: 4 }} />
                              {pesos(f.perdidoGrc)}
                            </div>
                            <div style={{ fontSize: 11, color: TX_BAJO, marginTop: 3 }}>
                              {f.eventos.map(e => e.mes).join(', ')}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: AMBAR_TX, fontSize: 11.5, fontWeight: 600 }}>
                            el GRC AAA no trae eventos suyos — no es cero, es que no lo mide
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', color: TX_MED, verticalAlign: 'top',
                                   fontSize: 11.5, maxWidth: 200, lineHeight: 1.5 }}>
                        {f.quien ?? '—'}
                        {f.fecha && (
                          <div style={{ fontSize: 11, color: TX_BAJO, marginTop: 3 }}>{f.fecha}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* QUÉ PERIODO CUBRE LO MEDIDO. Sin esto la columna de caída se lee
                como «todo lo que ha pasado». */}
            <p style={{ fontSize: 11.5, color: TX_MED, marginTop: 12, lineHeight: 1.6,
                        maxWidth: 820 }}>
              La <strong>caída medida</strong> suma los eventos de movimiento «Downgrade»
              que GRC AAA 2026 publica de cada cuenta, y ese dataset cubre{' '}
              <strong>{d?.cobertura.grcAaaMeses.join(' · ') || 'los meses cargados'}</strong>.
              Un downgrade posterior a ese rango, o uno que el cliente pactó por fuera,
              no aparece ahí — por eso la columna dice cuándo no lo mide en vez de pintar
              un cero. El <strong>MRR vigente</strong> es el institucional del Gross
              Revenue Facturación, cruzado por CID.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
