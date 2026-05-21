import Link from 'next/link'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import type { Cuenta } from '@/lib/types'
import { getSemaforo, ASESOR_CONFIG, formatMXN } from '@/lib/types'
import SemaforoBadge from './SemaforoBadge'
import HealthScoreRing from './HealthScoreRing'

// ── Dark palette (match DashMetricasSection) ─────────────────────────────────
const D = {
  panel:    '#071828',
  border:   'rgba(0,180,255,0.10)',
  borderH:  'rgba(0,180,255,0.20)',
  txHi:     '#E8F4FF',
  txMid:    'rgba(200,228,255,0.65)',
  txLow:    'rgba(200,228,255,0.35)',
  rowAlt:   'rgba(255,255,255,0.018)',
  rowHover: 'rgba(0,180,255,0.05)',
  cyan:     '#00B4FF',
  th:       'rgba(255,255,255,0.025)',
}

interface Props { cuentas: Cuenta[]; dark?: boolean }

function fmtFecha(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

function DiasCell({ dias, dark }: { dias: number; dark: boolean }) {
  const color = dias > 30 ? '#EF4444' : dias > 14 ? '#F97316' : dark ? D.txMid : '#64748B'
  const weight = dias > 14 ? 700 : 500
  return (
    <span style={{ fontSize: 12, fontWeight: weight, color }}>{dias}d</span>
  )
}

function TicketsCell({ cuenta, dark }: { cuenta: Cuenta; dark: boolean }) {
  const zt = cuenta.zoho_tickets
  if (!zt || zt.total === 0) {
    return <span style={{ fontSize: 12, color: dark ? D.txLow : '#94A3B8' }}>—</span>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          color: zt.total > 10 ? '#F97316' : dark ? D.txHi : '#0F172A',
        }}>
          {zt.total}
        </span>
        {zt.fallas > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 99,
            background: 'rgba(239,68,68,0.12)',
            color: '#EF4444', fontSize: 10, fontWeight: 700,
            border: '1px solid rgba(239,68,68,0.25)',
            whiteSpace: 'nowrap',
          }}>
            <AlertTriangle size={8} /> {zt.fallas} falla{zt.fallas > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {zt.ultima && (
        <span style={{ fontSize: 10, color: dark ? D.txLow : '#94A3B8', whiteSpace: 'nowrap' }}>
          Últ: {fmtFecha(zt.ultima)}
        </span>
      )}
    </div>
  )
}

export default function TopRiesgoTable({ cuentas, dark = false }: Props) {
  if (cuentas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: dark ? D.txLow : '#94A3B8', fontSize: 14 }}>
        No hay cuentas en riesgo — ¡excelente estado de cartera!
      </div>
    )
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left',
    fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    color: dark ? D.txLow : '#64748B',
    background: dark ? D.th : '#F0F7FF',
    borderBottom: dark ? `1px solid ${D.border}` : '1px solid #BFDBFE',
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
            const semaforo = getSemaforo(c.health_score)
            const ac = ASESOR_CONFIG[c.asesor]
            const hsColor = ['verde','azul'].includes(semaforo) ? '#22C55E'
              : semaforo === 'amarillo' ? '#EAB308' : '#EF4444'
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
                    color: dark ? D.cyan : '#0057FF',
                  }}>
                    {c.consecutivo}
                  </span>
                </td>

                <td style={tdStyle}>
                  <Link href={`/cuentas/${c.id}`}
                    style={{
                      fontSize: 13, fontWeight: 600, display: 'block',
                      lineHeight: 1.3, textDecoration: 'none',
                      color: dark ? D.txHi : '#0F172A',
                    }}
                    className="hover:underline"
                  >
                    {c.empresa}
                  </Link>
                  {c.giro && (
                    <span style={{
                      fontSize: 11, display: 'block',
                      maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: dark ? D.txLow : '#94A3B8',
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
                      background: `${ac.color}25`, color: ac.color,
                    }}>
                      {ac.initial}
                    </span>
                    <span style={{ fontSize: 12, color: dark ? D.txMid : '#475569' }}>
                      {c.asesor}
                    </span>
                  </span>
                </td>

                <td style={tdStyle}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    color: dark ? D.txHi : '#0F172A',
                  }}>
                    {formatMXN(c.facturacion)}
                  </span>
                </td>

                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HealthScoreRing score={c.health_score} size={34} strokeWidth={4} showLabel={false} />
                    <span style={{
                      fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      color: hsColor, textShadow: dark ? `0 0 8px ${hsColor}50` : 'none',
                    }}>
                      {c.health_score}
                    </span>
                  </div>
                </td>

                <td style={tdStyle}>
                  <SemaforoBadge semaforo={semaforo} size="sm" />
                </td>

                <td style={tdStyle}>
                  <DiasCell dias={c.dias_sin_actividad} dark={dark} />
                </td>

                <td style={tdStyle}>
                  <TicketsCell cuenta={c} dark={dark} />
                </td>

                <td style={tdStyle}>
                  <Link href={`/cuentas/${c.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                      fontSize: 12, fontWeight: 600, textDecoration: 'none',
                      color: dark ? D.cyan : '#0057FF',
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
