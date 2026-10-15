'use client'
import Link from 'next/link'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import type { Cuenta } from '@/lib/types'
import { getSemaforoCuenta, ASESOR_CONFIG, formatMXN } from '@/lib/types'
import SemaforoBadge from './SemaforoBadge'
import HealthScoreRing from './HealthScoreRing'
import * as TEMA from '@/lib/chart-theme'

/* ── Modo oscuro = el tema del Dashboard (12 oct 2026) ─────────────────────
   Era la paleta propia de `DashMetricasSection` —cian, rojo, verde—, que
   dirección retiró de la portada. Ahora sale de `lib/chart-theme.ts`: el
   riesgo va de plata a naranja en las MISMAS tres bandas que la salud de la
   cartera, y el asesor lleva su color del tema. El modo claro no cambia. */
const D = {
  border:   TEMA.BORDE,
  txHi:     TEMA.TX.hi,
  txMid:    TEMA.TX.mid,
  txLow:    TEMA.TX.low,
  rowAlt:   'rgba(255,255,255,0.03)',
  rowHover: 'rgba(255,255,255,0.06)',
  enlace:   TEMA.CIAN[400],
  th:       'rgba(255,255,255,0.04)',
}

/** La banda del semáforo con el color del tema, para el modo oscuro. */
function bandaOscura(semaforo: string): { color: string; etiqueta: string } {
  if (semaforo === 'inactivo') return { color: TEMA.SILVER[500], etiqueta: 'Inactiva' }
  const b = (TEMA.BANDA_DE_SEMAFORO as Record<string, TEMA.Banda>)[semaforo] ?? 'medio'
  return { color: TEMA.BANDA[b], etiqueta: TEMA.BANDA_SEMAFORO_ETIQUETA[b].split(' · ')[0] }
}

interface Props { cuentas: Cuenta[]; dark?: boolean }

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
function DiasCell({ dias, nunca, dark }: { dias: number; nunca?: boolean; dark: boolean }) {
  const color = dark
    ? (nunca || dias > 30 ? TEMA.CIAN[400] : dias > 14 ? TEMA.BANDA.medio : D.txMid)
    : (nunca || dias > 30 ? '#EF4444' : dias > 14 ? '#F97316' : '#3D4B5C')
  const weight = nunca || dias > 14 ? 700 : 500
  return (
    <span style={{ fontSize: 12, fontWeight: weight, color }}
      title={nunca ? 'Sin ningún contacto registrado' : undefined}>
      {nunca ? 'nunca' : `${dias}d`}
    </span>
  )
}

function TicketsCell({ cuenta, dark }: { cuenta: Cuenta; dark: boolean }) {
  const zt = cuenta.zoho_tickets
  if (!zt || zt.total === 0) {
    return <span style={{ fontSize: 12, color: dark ? D.txLow : '#A8BACB' }}>—</span>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          color: zt.total > 10 ? (dark ? TEMA.CIAN[400] : '#F97316') : dark ? D.txHi : '#082742',
        }}>
          {zt.total}
        </span>
        {zt.fallas > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 99,
            background: dark ? 'rgba(57,171,216,0.12)' : 'rgba(239,68,68,0.12)',
            color: dark ? TEMA.CIAN[400] : '#EF4444', fontSize: 11, fontWeight: 700,
            border: dark ? '1px solid rgba(57,171,216,0.35)' : '1px solid rgba(239,68,68,0.25)',
            whiteSpace: 'nowrap',
          }}>
            <AlertTriangle size={8} /> {zt.fallas} falla{zt.fallas > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {zt.ultima && (
        <span style={{ fontSize: 10, color: dark ? D.txLow : '#A8BACB', whiteSpace: 'nowrap' }}>
          Últ: {fmtFecha(zt.ultima)}
        </span>
      )}
    </div>
  )
}

export default function TopRiesgoTable({ cuentas, dark = false }: Props) {
  if (cuentas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: dark ? D.txLow : '#A8BACB', fontSize: 14 }}>
        No hay cuentas en riesgo — ¡excelente estado de cartera!
      </div>
    )
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left',
    fontSize: dark ? 12 : 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    color: dark ? D.txLow : '#3D4B5C',
    background: dark ? D.th : '#F0F7FF',
    borderBottom: dark ? `1px solid ${D.border}` : '1px solid #A8BACB',
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderBottom: dark ? `1px solid rgba(255,255,255,0.04)` : '1px solid #E0EDFF',
    fontSize: 13,
    verticalAlign: 'middle',
    color: dark ? D.txMid : '#334155',
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
            const ac = ASESOR_CONFIG[c.asesor]
            // 'inactivo' se contempla explícitamente: sin este caso caía en el
            // `else` y una cuenta cancelada mostraba su Health Score en ROJO,
            // es decir "riesgo alto" — cuando ya no hay riesgo, hay baja.
            const banda = bandaOscura(semaforo)
            const hsColor = dark ? banda.color
              : semaforo === 'inactivo' ? '#3D4B5C'
              : ['verde','azul'].includes(semaforo) ? '#22C55E'
              : semaforo === 'amarillo' ? '#EAB308' : '#EF4444'
            const colorAsesor = dark ? (TEMA.ASESOR[c.asesor] ?? TEMA.SILVER[500]) : ac.color
            const rowBg = dark
              ? (idx % 2 === 0 ? 'transparent' : D.rowAlt)
              : 'transparent'

            return (
              <tr key={c.id}
                style={{ background: rowBg }}
                onMouseEnter={e => { if (dark) (e.currentTarget as HTMLTableRowElement).style.background = D.rowHover }}
                onMouseLeave={e => { if (dark) (e.currentTarget as HTMLTableRowElement).style.background = rowBg }}
              >
                <td style={tdStyle}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                    color: dark ? D.enlace : '#0057FF',
                  }}>
                    {c.consecutivo}
                  </span>
                </td>

                <td style={tdStyle}>
                  <Link href={`/cuentas/${c.id}`}
                    style={{
                      fontSize: 13, fontWeight: 600, display: 'block',
                      lineHeight: 1.3, textDecoration: 'none',
                      color: dark ? D.txHi : '#082742',
                    }}
                    className="hover:underline"
                  >
                    {c.empresa}
                  </Link>
                  {c.giro && (
                    <span style={{
                      fontSize: 11, display: 'block',
                      maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: dark ? D.txLow : '#A8BACB',
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
                      background: dark ? colorAsesor : `${ac.color}25`,
                      color: dark ? TEMA.NAVY[900] : ac.color,
                    }}>
                      {ac.initial}
                    </span>
                    <span style={{ fontSize: 12, color: dark ? D.txMid : '#202E3B' }}>
                      {c.asesor}
                    </span>
                  </span>
                </td>

                <td style={tdStyle}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    color: dark ? D.txHi : '#082742',
                  }}>
                    {formatMXN(c.facturacion)}
                  </span>
                </td>

                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* El anillo trae su propio arcoíris; en oscuro basta la cifra
                        en el color de su banda. */}
                    {!dark && (
                      <HealthScoreRing score={c.health_score} size={34} strokeWidth={4} showLabel={false} estado={c.estado} />
                    )}
                    <span style={{
                      fontSize: dark ? 15 : 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      color: hsColor, background: 'transparent',
                    }}>
                      {c.health_score}
                    </span>
                  </div>
                </td>

                <td style={tdStyle}>
                  {dark ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                                   background: 'transparent', color: D.txMid, fontSize: 12 }}>
                      <i aria-hidden style={{ width: 9, height: 9, borderRadius: 2,
                                              background: banda.color, display: 'inline-block' }} />
                      {banda.etiqueta}
                    </span>
                  ) : <SemaforoBadge semaforo={semaforo} size="sm" />}
                </td>

                <td style={tdStyle}>
                  <DiasCell dias={c.dias_sin_actividad} nunca={c.dias_sin_contacto == null} dark={dark} />
                </td>

                <td style={tdStyle}>
                  <TicketsCell cuenta={c} dark={dark} />
                </td>

                <td style={tdStyle}>
                  <Link href={`/cuentas/${c.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                      fontSize: 12, fontWeight: 600, textDecoration: 'none',
                      color: dark ? D.enlace : '#0057FF',
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
