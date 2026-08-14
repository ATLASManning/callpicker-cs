import {
  Calendar, Info, CreditCard, Headphones, Users,
  AlertTriangle, CheckCircle2, TrendingDown, type LucideIcon,
} from 'lucide-react'
import type { Cuenta, Seguimiento } from '@/lib/types'
import type { TicketRow } from '@/lib/cuenta-data'
import HealthScoreRing from './HealthScoreRing'
import HealthScoreEditor from './HealthScoreEditor'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DimResult {
  key:     string
  label:   string
  pct:     string
  weight:  number
  score:   number | null   // null = datos insuficientes
  detail:  string
  color:   string
  missing: string[]
  Icon:    LucideIcon
}

// ── Palette helper ────────────────────────────────────────────────────────────
function scoreColor(s: number | null): string {
  if (s === null) return '#DC2626'
  if (s >= 80) return '#22C55E'
  if (s >= 60) return '#3B82F6'
  if (s >= 40) return '#F59E0B'
  return '#EF4444'
}

// ── Scorers ───────────────────────────────────────────────────────────────────

function dimAntiguedad(dias: number): DimResult {
  if (dias <= 0) {
    return {
      key: 'ant', label: 'Antigüedad', pct: '15%', weight: 15,
      score: null, detail: 'Sin fecha de inicio registrada',
      color: '#DC2626', missing: ['Fecha de inicio de servicio'], Icon: Calendar,
    }
  }
  const score = dias > 1095 ? 100 : dias > 730 ? 90 : dias > 365 ? 75
    : dias > 180 ? 55 : dias > 90 ? 35 : dias > 30 ? 20 : 10
  const detail = dias > 365
    ? `${Math.floor(dias / 365)} año${Math.floor(dias / 365) > 1 ? 's' : ''} como cliente`
    : dias > 30 ? `${Math.floor(dias / 30)} meses como cliente`
    : `${dias} días — Onboarding activo`
  return { key: 'ant', label: 'Antigüedad', pct: '15%', weight: 15, score, detail, color: scoreColor(score), missing: [], Icon: Calendar }
}

function dimInformacion(c: Cuenta): DimResult {
  const FIELDS = [
    { key: 'cid',             label: 'CID Zoho Desk' },
    { key: 'contacto_nombre', label: 'Nombre del contacto' },
    { key: 'contacto_email',  label: 'Email del contacto' },
    { key: 'contacto_tel',    label: 'Teléfono de contacto' },
    { key: 'contacto_cargo',  label: 'Cargo del contacto' },
    { key: 'giro',            label: 'Giro de la empresa' },
    { key: 'tamano_empresa',  label: 'Tamaño de empresa' },
    { key: 'zoho_link',       label: 'Vínculo Zoho CRM' },
  ]
  const r = c as unknown as Record<string, unknown>
  const filled = FIELDS.filter(f => r[f.key] != null && r[f.key] !== '')
  const missing = FIELDS.filter(f => !r[f.key]).map(f => f.label)
  const score = Math.round((filled.length / FIELDS.length) * 100)
  return {
    key: 'info', label: 'Información', pct: '10%', weight: 10,
    score, detail: `${filled.length}/${FIELDS.length} campos registrados`,
    color: scoreColor(score), missing, Icon: Info,
  }
}

function dimPagos(c: Cuenta): DimResult {
  if (c.pagos_al_corriente == null) {
    return {
      key: 'pago', label: 'Pagos', pct: '25%', weight: 25,
      score: null, detail: 'Sin datos de estado de pago',
      color: '#DC2626', missing: ['Estado de pagos al corriente', 'Historial de incidencias de pago'], Icon: CreditCard,
    }
  }
  let score = 100
  if (!c.pagos_al_corriente) score = 10
  else if (c.incidencias_pago >= 3) score = 40
  else if (c.incidencias_pago >= 1) score = 70
  const detail = !c.pagos_al_corriente
    ? 'Pago vencido — acción inmediata requerida'
    : c.incidencias_pago > 0 ? `${c.incidencias_pago} incidencia${c.incidencias_pago > 1 ? 's' : ''} de pago`
    : 'Al corriente · Sin incidencias'
  return { key: 'pago', label: 'Pagos', pct: '25%', weight: 25, score, detail, color: scoreColor(score), missing: [], Icon: CreditCard }
}

function dimTickets(cid: string | null, rows: TicketRow[]): DimResult {
  if (!cid) {
    return {
      key: 'tkt', label: 'Soporte Técnico', pct: '20%', weight: 20,
      score: null, detail: 'Sin CID Zoho configurado',
      color: '#DC2626', missing: ['CID de Zoho Desk (configurar en perfil de cuenta)'], Icon: Headphones,
    }
  }
  const total = rows.length
  const fallas = rows.filter(t => t.es_falla === 'Si').length
  const urgentes = rows.filter(t => t.prioridad === 'Urgent' || t.prioridad === 'High').length
  if (total === 0) {
    return { key: 'tkt', label: 'Soporte Técnico', pct: '20%', weight: 20, score: 95, detail: 'Sin tickets registrados', color: '#22C55E', missing: [], Icon: Headphones }
  }
  let score = 100 - Math.min(30, fallas * 15) - Math.min(20, urgentes * 8) - Math.min(20, (total - 1) * 3)
  score = Math.max(10, score)
  const parts = [`${total} ticket${total !== 1 ? 's' : ''}`]
  if (fallas > 0) parts.push(`${fallas} falla${fallas !== 1 ? 's' : ''}`)
  return { key: 'tkt', label: 'Soporte Técnico', pct: '20%', weight: 20, score, detail: parts.join(' · '), color: scoreColor(score), missing: [], Icon: Headphones }
}

function dimSeguimiento(seguimientos: Seguimiento[], c: Cuenta): DimResult {
  const hasSeg = seguimientos.length > 0
  const dias = c.dias_sin_actividad ?? 0
  if (!hasSeg && !c.ultimo_contacto && !c.fecha_ultima_llamada) {
    return {
      key: 'seg', label: 'Seguimiento KAM', pct: '30%', weight: 30,
      score: null, detail: 'Sin registros de actividad o seguimiento',
      color: '#DC2626', missing: ['Primer registro de actividad KAM', 'Fecha de último contacto'], Icon: Users,
    }
  }
  let score = dias <= 3 ? 100 : dias <= 7 ? 90 : dias <= 14 ? 75 : dias <= 30 ? 55 : dias <= 60 ? 35 : 15
  if (seguimientos.length >= 10) score = Math.min(100, score + 10)
  else if (seguimientos.length >= 5) score = Math.min(100, score + 5)
  if (c.observaciones_kam?.trim()) score = Math.min(100, score + 3)
  const detail = dias <= 7 ? 'Contacto activo esta semana'
    : dias <= 30 ? `${dias} días sin contacto`
    : `${dias} días — intervención urgente`
  return { key: 'seg', label: 'Seguimiento KAM', pct: '30%', weight: 30, score, detail, color: scoreColor(score), missing: [], Icon: Users }
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
function AlertaBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4, background: '#CC1010', color: '#fff', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
        SIN DATOS
      </span>
    )
  }
  if (score < 40) {
    return (
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4, background: '#DC2626', color: '#fff', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
        ALERTA
      </span>
    )
  }
  if (score < 60) {
    return (
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4, background: '#C2410C', color: '#fff', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
        ATENCIÓN
      </span>
    )
  }
  return null
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  cuenta:      Cuenta
  seguimientos: Seguimiento[]
  ticketRows:  TicketRow[]
  diasCliente: number
  canEdit:     boolean
}

export default function HealthScoreDiagnostico({ cuenta, seguimientos, ticketRows, diasCliente, canEdit }: Props) {
  const dims: DimResult[] = [
    dimAntiguedad(diasCliente),
    dimInformacion(cuenta),
    dimPagos(cuenta),
    dimTickets(cuenta.cid, ticketRows),
    dimSeguimiento(seguimientos, cuenta),
  ]

  // Weighted average from available dimensions only
  const avail = dims.filter(d => d.score !== null)
  const totalW = avail.reduce((s, d) => s + d.weight, 0)
  const hs = totalW > 0 ? Math.round(avail.reduce((s, d) => s + d.score! * d.weight, 0) / totalW) : 0
  const isPartial = avail.length < dims.length

  const missingDims = dims.filter(d => d.score === null)
  const allMissing  = missingDims.flatMap(d => d.missing)
  const alertDims   = dims.filter(d => d.score !== null && d.score < 40)

  return (
    <div className="cp-card" style={{ padding: 0 }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Diagnóstico Automático
          </p>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
            Health Score
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isPartial && (
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.07em', padding: '2px 8px', borderRadius: 4, background: 'rgba(220,38,38,0.2)', color: '#F87171', border: '1px solid rgba(220,38,38,0.3)', textTransform: 'uppercase' }}>
              Incompleto
            </span>
          )}
          {!isPartial && (missingDims.length === 0) && (
            <CheckCircle2 size={14} style={{ color: '#22C55E' }} />
          )}
        </div>
      </div>

      {/* ── Score ring + dimensions ────────────────────────────────────── */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

          {/* Ring gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <HealthScoreRing score={hs} size={84} strokeWidth={8} />
            {isPartial && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.3 }}>
                Parcial<br />({avail.length}/{dims.length} dims)
              </span>
            )}
          </div>

          {/* Dimension rows */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dims.map(d => {
              const { Icon } = d
              const pctWidth = d.score !== null ? `${d.score}%` : '0%'
              const showBadge = d.score === null || d.score < 60
              return (
                <div key={d.key}>
                  {/* Label row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                      <Icon size={10} style={{ color: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.label}
                      </span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{d.pct}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      {showBadge ? (
                        <AlertaBadge score={d.score} />
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.score}</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      width: pctWidth, height: '100%', borderRadius: 99,
                      background: d.score === null ? 'repeating-linear-gradient(45deg, #DC2626 0px, #DC2626 4px, rgba(220,38,38,0.3) 4px, rgba(220,38,38,0.3) 8px)' : d.color,
                      transition: 'width 0.7s ease',
                    }} />
                  </div>

                  {/* Detail text */}
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0', lineHeight: 1 }}>
                    {d.detail}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Alertas activas ──────────────────────────────────────────── */}
        {alertDims.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertDims.map(d => (
              <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <TrendingDown size={11} style={{ color: '#F87171', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#FCA5A5', fontWeight: 500 }}>
                  <strong style={{ color: '#F87171' }}>{d.label}:</strong> {d.detail}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── SAC — Datos insuficientes ─────────────────────────────────── */}
        {allMissing.length > 0 && (
          <div style={{ marginTop: 14, borderRadius: 10, border: '1.5px solid rgba(220,38,38,0.35)', background: 'rgba(220,38,38,0.08)', padding: '11px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#DC2626', flexShrink: 0 }}>
                <AlertTriangle size={11} style={{ color: '#fff' }} />
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Actividad SAC Requerida
                </p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.2 }}>
                  Información faltante para diagnóstico completo
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {allMissing.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>{m}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              Solicitar al asesor como actividad de seguimiento SAC
            </p>
          </div>
        )}
      </div>

      {/* ── Editor manual (admin override) ───────────────────────────── */}
      {canEdit && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 18px 14px' }}>
          <HealthScoreEditor cuenta={cuenta} canEdit={canEdit} />
        </div>
      )}
    </div>
  )
}
