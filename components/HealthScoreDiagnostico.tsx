import {
  Calendar, Info, CreditCard, Headphones, Users,
  AlertTriangle, CheckCircle2, TrendingDown, Layers,
  type LucideIcon,
} from 'lucide-react'
import type { Cuenta, Seguimiento } from '@/lib/types'
import type { TicketRow } from '@/lib/cuenta-data'
import HealthScoreRing from './HealthScoreRing'

// ── Paleta de colores ─────────────────────────────────────────────────────────
// Verde/Azul = sano · Naranja→Rojo intenso = riesgo gradiente según %
function scoreColor(s: number | null): string {
  if (s === null) return '#CC1414'   // rojo ferrari — sin datos
  if (s >= 80)   return '#22C55E'   // verde
  if (s >= 60)   return '#3B82F6'   // azul
  if (s >= 50)   return '#F59E0B'   // ámbar
  if (s >= 40)   return '#F97316'   // naranja
  if (s >= 30)   return '#EA580C'   // naranja-rojo
  if (s >= 20)   return '#DC2626'   // rojo
  return                '#B91C1C'   // rojo intenso
}

// Color de la barra de alerta: se intensifica conforme baja el score
function alertBarColor(s: number): string {
  if (s >= 55) return '#F59E0B'
  if (s >= 45) return '#F97316'
  if (s >= 35) return '#EA580C'
  if (s >= 25) return '#DC2626'
  return             '#991B1B'
}

// ── Tipos internos ───────────────────────────────────────────────────────────
interface DimResult {
  key:     string
  label:   string
  pct:     string
  weight:  number
  score:   number | null
  detail:  string
  color:   string
  missing: string[]   // campos que activan el panel SAC
  Icon:    LucideIcon
}

// ── Scorer: Antigüedad ───────────────────────────────────────────────────────
function dimAntiguedad(dias: number): DimResult {
  if (dias <= 0) {
    return {
      key: 'ant', label: 'Antigüedad', pct: '5%', weight: 5,
      score: null, detail: 'Sin fecha de inicio registrada',
      color: '#CC1414', missing: ['Fecha de inicio de servicio'], Icon: Calendar,
    }
  }
  const score = dias > 1095 ? 100 : dias > 730 ? 90 : dias > 365 ? 75
    : dias > 180 ? 55 : dias > 90 ? 35 : dias > 30 ? 20 : 10
  const detail = dias > 365
    ? `${Math.floor(dias / 365)} año${Math.floor(dias / 365) > 1 ? 's' : ''} como cliente`
    : dias > 30 ? `${Math.floor(dias / 30)} meses como cliente`
    : `${dias} días — Onboarding activo`
  return { key: 'ant', label: 'Antigüedad', pct: '5%', weight: 5, score, detail, color: scoreColor(score), missing: [], Icon: Calendar }
}

// ── Scorer: Información ───────────────────────────────────────────────────────
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
  const filled  = FIELDS.filter(f =>  r[f.key] != null && r[f.key] !== '')
  const missing = FIELDS.filter(f => !r[f.key]).map(f => f.label)
  const score   = Math.round((filled.length / FIELDS.length) * 100)
  return {
    key: 'info', label: 'Información', pct: '10%', weight: 10,
    score, detail: `${filled.length}/${FIELDS.length} campos registrados`,
    color: scoreColor(score), missing, Icon: Info,
  }
}

// ── Scorer: Pagos ─────────────────────────────────────────────────────────────
function dimPagos(c: Cuenta): DimResult {
  if (c.pagos_al_corriente == null) {
    return {
      key: 'pago', label: 'Pagos', pct: '20%', weight: 20,
      score: null, detail: 'Sin datos de estado de pago',
      color: '#CC1414', missing: ['Estado de pagos al corriente', 'Historial de incidencias de pago'], Icon: CreditCard,
    }
  }
  let score = 100
  if (!c.pagos_al_corriente)   score = 10
  else if (c.incidencias_pago >= 3) score = 40
  else if (c.incidencias_pago >= 1) score = 70
  const detail = !c.pagos_al_corriente
    ? 'Pago vencido — acción inmediata requerida'
    : c.incidencias_pago > 0
      ? `${c.incidencias_pago} incidencia${c.incidencias_pago > 1 ? 's' : ''} de pago`
      : 'Al corriente · Sin incidencias'
  return { key: 'pago', label: 'Pagos', pct: '20%', weight: 20, score, detail, color: scoreColor(score), missing: [], Icon: CreditCard }
}

// ── Scorer: Módulos Activados ────────────────────────────────────────────────
// Mide COBERTURA: cuántos módulos del portafolio tiene encendidos la cuenta.
// Es distinto del indicador "Adopción de producto" del Radar, que mide
// PROFUNDIDAD (qué tan bien usa lo que ya tiene, según la revisión del asesor).
//
// Los flags viven en la tabla `cuentas` y hoy nadie los captura: están en
// false en las 201 cuentas activas. Por eso NO se penaliza la ausencia de
// dato — antes toda cuenta con más de un año caía a score 8 y arrastraba
// ~23 puntos del Health Score por un campo vacío, no por falta de adopción.
function dimModulos(c: Cuenta, diasCliente: number, revisionesAdopcion: number): DimResult {
  const MODS = [
    'tiene_chat_activo', 'tiene_integracion_api', 'tiene_pago_automatico',
    'tiene_ia_voz', 'tiene_ia_chat', 'dashboard_revisado',
  ]
  const r      = c as unknown as Record<string, unknown>
  const active = MODS.filter(m => r[m] === true).length
  const total  = MODS.length
  // Un flag capturado en false es informativo; una cuenta donde ninguno de los
  // seis fue tocado nunca es simplemente un registro sin llenar.
  const capturado = MODS.some(m => r[m] === true || r[m] === false)

  let score: number
  let detail: string

  if (active === 0 && !capturado) {
    // Sin dato: neutro, nunca crítico. La señal real la da el Radar.
    score  = 50
    detail = revisionesAdopcion > 0
      ? 'Sin registro de módulos — ver Adopción en el Radar'
      : 'Sin registro de módulos activados'
  } else if (diasCliente < 90) {
    score  = active === 0 ? 45 : active <= 2 ? 65 : 82
    detail = active === 0 ? 'En onboarding — activación en proceso' : `${active}/${total} módulos · Cliente nuevo`
  } else if (active === 0 && diasCliente > 365) {
    score  = 8
    detail = `0/${total} módulos en ${Math.floor(diasCliente / 365)} año${Math.floor(diasCliente / 365) > 1 ? 's' : ''} — costo de salida bajo`
  } else if (active === 0) {
    score = 22; detail = `0/${total} módulos activados`
  } else if (active === 1) {
    score = 38; detail = `1/${total} módulos activos`
  } else if (active === 2) {
    score = 55; detail = `2/${total} módulos activos`
  } else if (active === 3) {
    score = 72; detail = `3/${total} módulos activos`
  } else if (active === 4) {
    score = 85; detail = `4/${total} módulos activos`
  } else {
    score = 95; detail = `${active}/${total} módulos — cuenta expandida`
  }

  // Bonus por NPS positivo
  if (c.nps_score != null && c.nps_score >= 8) score = Math.min(100, score + 5)

  return {
    key: 'modulos', label: 'Módulos activados', pct: '25%', weight: 25,
    score, detail, color: scoreColor(score), missing: [], Icon: Layers,
  }
}

// ── Scorer: Soporte Técnico ───────────────────────────────────────────────────
function dimSoporte(cid: string | null, rows: TicketRow[], ticketsAbiertos: number): DimResult {
  if (!cid) {
    return {
      key: 'tkt', label: 'Soporte', pct: '15%', weight: 15,
      score: null, detail: 'Sin CID Zoho configurado',
      color: '#CC1414', missing: ['CID de Zoho Desk (configurar en perfil de cuenta)'], Icon: Headphones,
    }
  }
  const total    = rows.length
  const fallas   = rows.filter(t => t.es_falla === 'Si').length
  const urgentes = rows.filter(t => t.prioridad === 'Urgent' || t.prioridad === 'High').length

  let score = 100
  if (ticketsAbiertos > 2)      score -= 40
  else if (ticketsAbiertos > 0) score -= 20

  if (total === 0) {
    score = Math.min(score, 95)
  } else {
    score -= Math.min(25, fallas * 12)
    score -= Math.min(15, urgentes * 6)
    score -= Math.min(15, (total - 1) * 3)
  }
  score = Math.max(8, score)

  const parts: string[] = []
  if (total > 0)          parts.push(`${total} ticket${total !== 1 ? 's' : ''}`)
  if (fallas > 0)         parts.push(`${fallas} falla${fallas !== 1 ? 's' : ''}`)
  if (ticketsAbiertos > 0) parts.push(`${ticketsAbiertos} abierto${ticketsAbiertos !== 1 ? 's' : ''}`)
  const detail = parts.length > 0 ? parts.join(' · ') : 'Sin tickets registrados'

  return { key: 'tkt', label: 'Soporte', pct: '15%', weight: 15, score, detail, color: scoreColor(score), missing: [], Icon: Headphones }
}

// ── Scorer: Seguimiento KAM ──────────────────────────────────────────────────
// Un contacto reactivado por crisis (1 seguimiento de ticket) no equivale a
// seguimiento proactivo. Se penaliza el historial escaso.
function dimSeguimiento(seguimientos: Seguimiento[], c: Cuenta): DimResult {
  const dias          = c.dias_sin_actividad ?? 0
  const ultimoContacto = c.ultimo_contacto
  const hasSeg         = seguimientos.length > 0

  if (!hasSeg && !ultimoContacto) {
    return {
      key: 'seg', label: 'Seguimiento KAM', pct: '25%', weight: 25,
      score: null, detail: 'Sin registros de actividad o seguimiento',
      color: '#CC1414', missing: ['Primer registro de actividad KAM', 'Fecha de último contacto'], Icon: Users,
    }
  }

  // Base por días sin actividad
  let score = dias <= 3 ? 100 : dias <= 7 ? 90 : dias <= 14 ? 75 : dias <= 30 ? 55 : dias <= 60 ? 35 : 15

  // Historial escaso = contacto reactivo (crisis), no proactivo
  if (seguimientos.length <= 1 && !ultimoContacto) {
    score = Math.min(score, 55)
  } else if (seguimientos.length <= 2 && !ultimoContacto) {
    score = Math.min(score, 70)
  }

  // Bonus por historial sólido y notas KAM
  if (seguimientos.length >= 10)     score = Math.min(100, score + 10)
  else if (seguimientos.length >= 5) score = Math.min(100, score + 5)
  const obs = c.observaciones_kam?.trim() ?? ''
  if (obs && obs !== '0' && obs.length > 5) score = Math.min(100, score + 3)

  const detail = dias <= 7 ? 'Contacto esta semana'
    : dias <= 30 ? `${dias} días sin contacto`
    : `${dias} días — intervención urgente`

  return { key: 'seg', label: 'Seguimiento KAM', pct: '25%', weight: 25, score, detail, color: scoreColor(score), missing: [], Icon: Users }
}

// ── Badge de alerta (naranja→rojo según score) ────────────────────────────────
function AlertaBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span style={{
        fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
        padding: '2px 8px', borderRadius: 4,
        background: '#CC1414', color: '#fff',
        textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        SIN DATOS
      </span>
    )
  }

  const bg = score >= 55 ? '#D97706'   // ámbar oscuro
           : score >= 45 ? '#C2410C'   // naranja oscuro
           : score >= 35 ? '#DC2626'   // rojo
           :               '#991B1B'   // rojo intenso

  const texto = score >= 55 ? 'ATENCIÓN'
              : score >= 35 ? 'ALERTA'
              :               '⚠ CRÍTICO'

  return (
    <span style={{
      fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
      padding: '2px 8px', borderRadius: 4,
      background: bg, color: '#fff',
      textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap',
    }}>
      {texto}
    </span>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  cuenta:           Cuenta
  seguimientos:     Seguimiento[]
  ticketRows:       TicketRow[]
  diasCliente:      number
  auditoriaEstado?: string | null
  auditoriaNombre?: string | null
  /** Registros en adopcion_producto — solo para diferenciar "sin dato" de "sin módulos" */
  revisionesAdopcion?: number
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function HealthScoreDiagnostico({
  cuenta, seguimientos, ticketRows, diasCliente,
  auditoriaEstado, auditoriaNombre, revisionesAdopcion = 0,
}: Props) {

  // ── Cálculo de las 6 dimensiones ───────────────────────────────────────────
  const dims: DimResult[] = [
    dimAntiguedad(diasCliente),
    dimInformacion(cuenta),
    dimPagos(cuenta),
    dimModulos(cuenta, diasCliente, revisionesAdopcion),
    dimSoporte(cuenta.cid, ticketRows, cuenta.tickets_abiertos ?? 0),
    dimSeguimiento(seguimientos, cuenta),
  ]

  const avail   = dims.filter(d => d.score !== null)
  const totalW  = avail.reduce((s, d) => s + d.weight, 0)
  const hs      = totalW > 0 ? Math.round(avail.reduce((s, d) => s + d.score! * d.weight, 0) / totalW) : 0
  const isPartial = avail.length < dims.length

  const missingDims = dims.filter(d => d.score === null)
  const allMissing  = missingDims.flatMap(d => d.missing)
  const alertDims   = dims.filter(d => d.score !== null && d.score < 40)

  const hasAuditRisk = auditoriaEstado === 'en_riesgo' || auditoriaEstado === 'rescatable'
  const hasAuditLoss = auditoriaEstado === 'perdido'

  // Color del header global según HS total
  const hsIsRisk = hs < 60 && !isPartial

  return (
    <div className="cp-card" style={{ padding: 0 }}>

      {/* ── Banner de auditoría activa ────────────────────────────────── */}
      {(hasAuditRisk || hasAuditLoss) && (
        <div style={{
          borderRadius: '15px 15px 0 0', padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 8,
          background: hasAuditLoss ? 'rgba(127,29,29,0.95)' : 'rgba(185,28,28,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <AlertTriangle size={12} style={{ color: '#FCA5A5', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#FCA5A5', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {hasAuditLoss ? 'CUENTA PERDIDA' : 'AUDITORÍA EN RIESGO'}
          </span>
          {auditoriaNombre && (
            <span style={{ fontSize: 10, color: 'rgba(252,165,165,0.7)' }}>· {auditoriaNombre}</span>
          )}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
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
          {!isPartial && !hsIsRisk && (
            <CheckCircle2 size={14} style={{ color: '#22C55E' }} />
          )}
          {!isPartial && hsIsRisk && (
            <AlertTriangle size={14} style={{ color: alertBarColor(hs) }} />
          )}
        </div>
      </div>

      {/* ── Ring + dimensiones ────────────────────────────────────────── */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

          {/* Gauge circular */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <HealthScoreRing score={hs} size={84} strokeWidth={8} />
            {isPartial && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.3 }}>
                Parcial<br />({avail.length}/{dims.length})
              </span>
            )}
          </div>

          {/* Filas de dimensiones */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {dims.map(d => {
              const { Icon } = d
              const showBadge = d.score === null || d.score < 60
              return (
                <div key={d.key}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                      <Icon size={10} style={{ color: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.label}
                      </span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{d.pct}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      {showBadge
                        ? <AlertaBadge score={d.score} />
                        : <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.score}</span>
                      }
                    </div>
                  </div>

                  {/* Barra de progreso — usa el color del score de la dimensión */}
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      width: d.score !== null ? `${d.score}%` : '0%',
                      height: '100%', borderRadius: 99,
                      background: d.score === null
                        ? 'repeating-linear-gradient(45deg,#CC1414 0px,#CC1414 4px,rgba(204,20,20,0.25) 4px,rgba(204,20,20,0.25) 8px)'
                        : d.color,
                      transition: 'width 0.7s ease',
                    }} />
                  </div>

                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0', lineHeight: 1 }}>
                    {d.detail}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Alertas de dimensiones críticas (<40) ─────────────────── */}
        {alertDims.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertDims.map(d => (
              <div key={d.key} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 8,
                background: `${alertBarColor(d.score!)}22`,
                border: `1px solid ${alertBarColor(d.score!)}55`,
              }}>
                <TrendingDown size={11} style={{ color: alertBarColor(d.score!), flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#FCA5A5', fontWeight: 500 }}>
                  <strong style={{ color: alertBarColor(d.score!) }}>{d.label}:</strong> {d.detail}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Panel SAC — datos insuficientes ──────────────────────── */}
        {allMissing.length > 0 && (
          <div style={{
            marginTop: 14, borderRadius: 10,
            border: '1.5px solid rgba(204,20,20,0.45)',
            background: 'rgba(204,20,20,0.1)', padding: '11px 13px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: '50%', background: '#CC1414', flexShrink: 0,
              }}>
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
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>{m}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              Solicitar al asesor como actividad de seguimiento SAC
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
