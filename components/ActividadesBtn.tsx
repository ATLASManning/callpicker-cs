'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Zap, X, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Loader2, Calendar, Phone, Users,
  BarChart2, FileText, TrendingUp, ChevronDown, History,
  AlertCircle, ListChecks,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type TipoActividad  = 'llamada' | 'reunion' | 'analisis' | 'kam' | 'upsell' | 'validacion' | 'tickets' | 'pagos'
type EstadoAct      = 'pendiente' | 'completada' | 'vencida' | 'bloqueada'

interface Actividad {
  id:               string
  asesor:           string
  cuenta_id:        string
  cid:              string | null
  consecutivo:      string
  empresa:          string
  tipo:             TipoActividad
  descripcion:      string
  prioridad:        'alta' | 'media' | 'baja'
  fecha_programada: string
  fecha_vencimiento:string
  semana_inicio:    string
  estado:           EstadoAct
  completada:       boolean
  resultado:        string | null
  motivo_pendiente: string | null
  semaforo_cuenta:  string
  hs_cuenta:        number
  iniciada_en:          string | null
  tiempo_medido_min:    number | null
  tiempo_reportado_min: number | null
}

const TIEMPO_OPCIONES = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180]
function fmtMin(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

interface SemanaResumen {
  semana_inicio: string
  total:         number
  completadas:   number
  pct:           number
}

interface DataGapInfo {
  campo: string
  nivel: 'critico' | 'importante' | 'deseable'
}

interface DiagCuenta {
  id:           string
  consecutivo:  string
  empresa:      string
  health_score: number
  estado:       string
  gaps:         DataGapInfo[]
  criticos:     number
  importantes:  number
  deseables:    number
  pct_completo: number
}

// ── Config visual por tipo ────────────────────────────────────────────────────

const TIPO_CFG: Record<TipoActividad, { label: string; icon: React.ReactNode; color: string }> = {
  llamada:    { label: 'Llamada',           icon: <Phone size={10} />,       color: '#0E30CC' },
  reunion:    { label: 'Reunión',           icon: <Users size={10} />,       color: '#7C3AED' },
  analisis:   { label: 'Análisis',          icon: <BarChart2 size={10} />,   color: '#0891B2' },
  kam:        { label: 'KAM',              icon: <FileText size={10} />,    color: '#059669' },
  upsell:     { label: 'Upsell',           icon: <TrendingUp size={10} />,  color: '#D97706' },
  validacion: { label: 'Completar Perfil',  icon: <AlertCircle size={10} />, color: '#DC2626' },
  tickets:    { label: 'Análisis Tickets',  icon: <ListChecks size={10} />,  color: '#0E7490' },
  pagos:      { label: 'Comportamiento Pago', icon: <History size={10} />,   color: '#4338CA' },
}

const DIAS  = ['dom','lun','mar','mié','jue','vie','sáb']
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()))
  d.setHours(0, 0, 0, 0)
  return d
}

function toISO(d: Date): string { return d.toISOString().split('T')[0] }

function fmtFecha(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}

function isOverdue(a: Actividad): boolean {
  if (a.completada || a.estado === 'completada') return false
  return new Date(a.fecha_vencimiento + 'T23:59:59') < new Date()
}

function pctColor(pct: number): string {
  return pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444'
}

// ── ActividadCard ─────────────────────────────────────────────────────────────

function ActividadCard({
  act, onUpdate, readOnly = false,
}: {
  act: Actividad
  onUpdate: (id: string, patch: Partial<Actividad>) => void
  readOnly?: boolean
}) {
  const [editing,   setEditing]   = useState(false)
  const [resultado, setResultado] = useState(act.resultado ?? '')
  const [motivo,    setMotivo]    = useState(act.motivo_pendiente ?? '')
  const [tiempoRep, setTiempoRep] = useState<number | ''>('')
  const [saving,    setSaving]    = useState(false)
  const [starting,  setStarting]  = useState(false)
  const [gateError, setGateError] = useState<{
    error: string
    perfilFaltante?: string[]
    radarFaltante?: string[]
    contactoFaltante?: string[]
    codigo?: string
    bloqueada?: boolean
  } | null>(null)

  const overdue   = isOverdue(act)
  const tc        = TIPO_CFG[act.tipo]
  const borderCol = act.completada ? '#22C55E' : overdue ? '#EF4444' : '#E2E8F0'
  const headBg    = act.completada ? '#F0FDF4' : overdue ? '#FFF1F2' : '#F8FAFC'

  async function iniciar() {
    setStarting(true)
    setGateError(null)
    try {
      const res  = await fetch(`/api/actividades/${act.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'iniciar' }),
      })
      const data = await res.json()
      if (res.ok) onUpdate(act.id, data)
      // 409 = la cuenta dejó de ser elegible (churn, dormida, contacto incompleto).
      // El backend ya bloqueó la actividad; se refleja aquí sin recargar.
      else {
        setGateError(data)
        if (data?.bloqueada) onUpdate(act.id, { estado: 'bloqueada' })
      }
    } finally {
      setStarting(false)
    }
  }

  async function save(completada: boolean) {
    setSaving(true)
    setGateError(null)
    try {
      const payload = {
        completada,
        estado:          completada ? 'completada' : 'pendiente',
        resultado:       completada ? resultado : null,
        motivo_pendiente:!completada ? motivo    : null,
        tiempo_reportado_min: completada ? tiempoRep : undefined,
      }
      const res = await fetch(`/api/actividades/${act.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        onUpdate(act.id, data)
        setEditing(false)
      } else {
        setGateError(data)
      }
    } finally {
      setSaving(false)
    }
  }

  // Versión compacta para el histórico (read-only)
  if (readOnly) {
    return (
      <div style={{
        padding: '7px 10px', borderRadius: 7, marginBottom: 5,
        background: act.completada ? '#F0FDF4' : '#FFF7F7',
        border: `1px solid ${act.completada ? '#BBF7D0' : '#FECACA'}`,
        display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        {act.completada
          ? <CheckCircle size={11} color="#22C55E" style={{ flexShrink: 0, marginTop: 2 }} />
          : <XCircle size={11} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1F2937' }}>{act.empresa}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: tc.color, background: `${tc.color}15`, padding: '1px 6px', borderRadius: 99 }}>
              {tc.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{act.descripcion}</p>
          {act.completada && act.resultado && (
            <p style={{ margin: '3px 0 0', fontSize: 10, color: '#166534' }}>✓ {act.resultado}</p>
          )}
          {!act.completada && act.motivo_pendiente && (
            <p style={{ margin: '3px 0 0', fontSize: 10, color: '#92400E' }}>⚠ {act.motivo_pendiente}</p>
          )}
          {act.completada && (act.tiempo_medido_min != null || act.tiempo_reportado_min != null) && (
            <p style={{ margin: '3px 0 0', fontSize: 10, color: '#6B7280' }}>
              ⏱ Medido: {act.tiempo_medido_min != null ? fmtMin(act.tiempo_medido_min) : '—'} · Reportado: {act.tiempo_reportado_min != null ? fmtMin(act.tiempo_reportado_min) : '—'}
              {act.tiempo_medido_min != null && act.tiempo_reportado_min != null && Math.abs(act.tiempo_medido_min - act.tiempo_reportado_min) > act.tiempo_reportado_min * 0.5 && (
                <span style={{ color: '#D97706', fontWeight: 700 }}> · diferencia notable</span>
              )}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      border: `1px solid ${borderCol}`,
      borderLeft: `3px solid ${borderCol}`,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 8,
      background: '#fff',
    }}>
      {/* Card header */}
      <div style={{ background: headBg, padding: '9px 12px', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {act.completada
            ? <CheckCircle size={14} color="#22C55E" />
            : overdue
            ? <AlertTriangle size={14} color="#EF4444" />
            : <Clock size={14} color="#94A3B8" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 5 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              background: `${tc.color}18`, color: tc.color,
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 99, textTransform: 'uppercase',
            }}>
              {tc.icon} {tc.label}
            </span>
            <span style={{
              background: '#0A0F1C', color: '#1B3FCC',
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 99, fontFamily: 'monospace',
            }}>
              {act.consecutivo}
            </span>
            {act.cid && (
              <span style={{ background: '#F8FAFC', color: '#4B5563', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, border: '1px solid #E2E8F0' }}>
                CID: {act.cid}
              </span>
            )}
            {act.prioridad === 'alta' && !act.completada && (
              <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, border: '1px solid #FECACA' }}>
                Alta prioridad
              </span>
            )}
            {overdue && (
              <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, border: '1px solid #FECACA', letterSpacing: '0.04em' }}>
                ⛔ VENCIDA
              </span>
            )}
          </div>

          <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#1F2937', lineHeight: 1.3 }}>
            {act.empresa}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.55 }}>
            {act.descripcion}
          </p>
          <p style={{ margin: '5px 0 0', fontSize: 11, color: overdue ? '#DC2626' : '#94A3B8' }}>
            Vigencia: {fmtFecha(act.fecha_programada)} → {fmtFecha(act.fecha_vencimiento)}
            {overdue && ' · Plazo vencido — requiere justificación'}
          </p>

          {act.completada && act.resultado && (
            <div style={{ marginTop: 6, padding: '5px 10px', background: '#F0FDF4', borderRadius: 6, fontSize: 12, color: '#166534' }}>
              <strong>Resultado:</strong> {act.resultado}
            </div>
          )}

          {!act.completada && act.motivo_pendiente && (
            <div style={{ marginTop: 6, padding: '5px 10px', background: '#FFF7ED', borderRadius: 6, fontSize: 12, color: '#92400E', border: '1px solid #FED7AA' }}>
              <strong>Motivo:</strong> {act.motivo_pendiente}
            </div>
          )}

          {overdue && !act.completada && !act.motivo_pendiente && !editing && (
            <div style={{ marginTop: 6, padding: '5px 10px', background: '#FEF2F2', borderRadius: 6, fontSize: 11, color: '#991B1B', border: '1px solid #FECACA' }}>
              ⛔ Actividad bloqueada para revisión. Indica el motivo para desbloquear.
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      {!act.completada && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #F1F5F9', background: '#FFFFFF' }}>
          {!act.iniciada_en ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {gateError && !editing && (
                <div style={{ padding: '8px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 11, color: '#991B1B' }}>
                  <strong>{gateError.error}</strong>
                  {gateError.contactoFaltante && gateError.contactoFaltante.length > 0 && (
                    <p style={{ margin: '4px 0 0' }}>Faltan: {gateError.contactoFaltante.join(' · ')}</p>
                  )}
                </div>
              )}
              <button
                disabled={starting || act.estado === 'bloqueada'}
                onClick={iniciar}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 13px', borderRadius: 6,
                  cursor: starting || act.estado === 'bloqueada' ? 'not-allowed' : 'pointer',
                  border: `1px solid ${act.estado === 'bloqueada' ? '#E2E8F0' : '#BFDBFE'}`,
                  background: act.estado === 'bloqueada' ? '#F1F5F9' : '#EFF6FF',
                  color: act.estado === 'bloqueada' ? '#94A3B8' : '#1D4ED8',
                  fontSize: 11, fontWeight: 700, alignSelf: 'flex-start',
                }}
              >
                {starting ? <Loader2 size={11} /> : <Clock size={11} />}
                Iniciar actividad
              </button>
            </div>
          ) : !editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>
                ⏱ Iniciada {fmtFecha(act.iniciada_en.slice(0, 10))} — el tiempo se está midiendo
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 6, cursor: 'pointer',
                  border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#166534',
                  fontSize: 11, fontWeight: 700,
                }}>
                  <CheckCircle size={11} /> Completada
                </button>
                <button onClick={() => setEditing(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 6, cursor: 'pointer',
                  border: '1px solid #FECACA', background: '#FEF2F2', color: '#991B1B',
                  fontSize: 11, fontWeight: 700,
                }}>
                  <XCircle size={11} /> No realizada
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {gateError && (
                <div style={{ padding: '8px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 11, color: '#991B1B' }}>
                  <strong>{gateError.error}</strong>
                  {gateError.perfilFaltante && gateError.perfilFaltante.length > 0 && (
                    <p style={{ margin: '4px 0 0' }}>Perfil: {gateError.perfilFaltante.join(' · ')}</p>
                  )}
                  {gateError.radarFaltante && gateError.radarFaltante.length > 0 && (
                    <p style={{ margin: '4px 0 0' }}>Radar sin responder: {gateError.radarFaltante.slice(0, 3).join(' · ')}{gateError.radarFaltante.length > 3 ? ` (+${gateError.radarFaltante.length - 3} más)` : ''}</p>
                  )}
                </div>
              )}
              <textarea
                value={resultado}
                onChange={e => setResultado(e.target.value)}
                placeholder="Resultado (si se completó)..."
                rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Motivo por el que NO se realizó (obligatorio si vencida)..."
                rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #FECACA', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>
                  ¿Cuánto tiempo te tomó esta actividad? (para completar)
                </label>
                <select
                  value={tiempoRep}
                  onChange={e => setTiempoRep(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12, background: '#fff' }}
                >
                  <option value="">Selecciona el tiempo...</option>
                  {TIEMPO_OPCIONES.map(m => (
                    <option key={m} value={m}>{fmtMin(m)}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <button
                  disabled={saving || !resultado.trim() || !tiempoRep}
                  onClick={() => save(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 6, border: 'none',
                    background: saving || !resultado.trim() || !tiempoRep ? '#DCFCE7' : '#059669',
                    color: saving || !resultado.trim() || !tiempoRep ? '#6EE7B7' : '#fff',
                    fontSize: 11, fontWeight: 700,
                    cursor: saving || !resultado.trim() || !tiempoRep ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? <Loader2 size={11} /> : <CheckCircle size={11} />}
                  Guardar completada
                </button>
                {motivo.trim() && (
                  <button
                    disabled={saving}
                    onClick={() => save(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px', borderRadius: 6, border: 'none',
                      background: '#EF4444', color: '#fff',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <FileText size={11} /> Registrar motivo
                  </button>
                )}
                <button onClick={() => setEditing(false)} style={{
                  padding: '5px 10px', borderRadius: 6, background: '#F1F5F9',
                  color: '#4B5563', fontSize: 11, cursor: 'pointer', border: 'none',
                }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Renderizador de análisis IA ───────────────────────────────────────────────

function AnalisisRenderer({ text }: { text: string }) {
  const lines = text.split('\n')

  const rendered = lines.map((line, i) => {
    const trimmed = line.trim()

    // Header principal (## ...)
    if (trimmed.startsWith('## ')) {
      const title = trimmed.slice(3)
      const isWarning  = title.includes('WARNING') || title.includes('RIESGO')
      const isUpsell   = title.includes('UPSELL') || title.includes('OPORTUNIDAD')
      const isCoaching = title.includes('COACHING')
      const isQuirurg  = title.includes('QUIRÚRG') || title.includes('INSTRUC')
      const isResumen  = title.includes('RESUMEN')
      const isTabla    = title.includes('TABLA') || title.includes('PRIORIDAD')
      const bg    = isWarning ? '#FFF5F5' : isUpsell ? '#FFFBEB' : isCoaching ? '#F0FDF4' : isResumen ? '#EFF6FF' : isQuirurg ? '#FFF5F5' : '#F8FAFC'
      const color = isWarning ? '#DC2626' : isUpsell ? '#D97706' : isCoaching ? '#059669' : isResumen ? '#1D4ED8' : isQuirurg ? '#DC2626' : '#334155'
      const border = isWarning ? '#FECACA' : isUpsell ? '#FDE68A' : isCoaching ? '#BBF7D0' : isResumen ? '#BFDBFE' : isQuirurg ? '#FECACA' : '#E2E8F0'
      return (
        <div key={i} style={{ marginTop: i === 0 ? 0 : 20, marginBottom: 10, padding: '10px 14px', background: bg, borderRadius: 10, border: `1px solid ${border}`, borderLeft: `4px solid ${color}` }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
        </div>
      )
    }

    // Líneas con riesgo 🔴 CRÍTICO
    if (trimmed.includes('🔴') || trimmed.toLowerCase().includes('crítico')) {
      return (
        <div key={i} style={{ padding: '7px 12px', background: '#FEF2F2', borderRadius: 7, border: '1px solid #FECACA', marginBottom: 5, fontSize: 12, color: '#991B1B', borderLeft: '3px solid #EF4444' }}>
          {renderInline(trimmed)}
        </div>
      )
    }

    // Líneas con alerta 🟡
    if (trimmed.includes('🟡') || (trimmed.toLowerCase().includes('alerta') && !trimmed.startsWith('|'))) {
      return (
        <div key={i} style={{ padding: '7px 12px', background: '#FFFBEB', borderRadius: 7, border: '1px solid #FDE68A', marginBottom: 5, fontSize: 12, color: '#92400E', borderLeft: '3px solid #F59E0B' }}>
          {renderInline(trimmed)}
        </div>
      )
    }

    // Líneas 🟢 estable
    if (trimmed.includes('🟢')) {
      return (
        <div key={i} style={{ padding: '7px 12px', background: '#F0FDF4', borderRadius: 7, border: '1px solid #BBF7D0', marginBottom: 5, fontSize: 12, color: '#166534', borderLeft: '3px solid #22C55E' }}>
          {renderInline(trimmed)}
        </div>
      )
    }

    // Tabla markdown (líneas con |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (trimmed.includes('---')) return null // Separador de tabla
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim())
      const isHeader = lines[i + 1]?.trim().startsWith('|---')
      return (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
          gap: 0,
          marginBottom: 1,
        }}>
          {cells.map((cell, j) => (
            <div key={j} style={{
              padding: '5px 8px', fontSize: 11,
              background: isHeader ? '#0A1628' : j === 0 ? '#F8FAFC' : '#fff',
              color: isHeader ? '#fff' : cell.includes('🔴') ? '#DC2626' : cell.includes('🟡') ? '#D97706' : cell.includes('🟢') ? '#059669' : '#334155',
              fontWeight: isHeader ? 700 : 400,
              borderBottom: '1px solid #E2E8F0',
              borderRight: j < cells.length - 1 ? '1px solid #E2E8F0' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {renderInline(cell)}
            </div>
          ))}
        </div>
      )
    }

    // Bullets con iconos de coaching
    if (trimmed.startsWith('✅') || trimmed.startsWith('❌') || trimmed.startsWith('➕') || trimmed.startsWith('📋') || trimmed.startsWith('🎯')) {
      const icon = trimmed.slice(0, 2)
      const content = trimmed.slice(2).trim()
      const bg = icon === '✅' ? '#F0FDF4' : icon === '❌' ? '#FEF2F2' : icon === '➕' ? '#EFF6FF' : icon === '📋' ? '#FFFBEB' : '#F5F3FF'
      const col = icon === '✅' ? '#166534' : icon === '❌' ? '#991B1B' : icon === '➕' ? '#1D4ED8' : icon === '📋' ? '#92400E' : '#5B21B6'
      return (
        <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 12px', background: bg, borderRadius: 8, marginBottom: 5, fontSize: 12, color: col }}>
          <span style={{ flexShrink: 0, fontSize: 14 }}>{icon}</span>
          <span style={{ flex: 1 }}>{renderInline(content)}</span>
        </div>
      )
    }

    // Bullets normales (• o -)
    if (trimmed.startsWith('•') || (trimmed.startsWith('- ') && trimmed.length > 2)) {
      const content = trimmed.startsWith('•') ? trimmed.slice(1).trim() : trimmed.slice(2)
      return (
        <div key={i} style={{ display: 'flex', gap: 7, paddingLeft: 8, marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
          <span style={{ color: '#7C3AED', flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{renderInline(content)}</span>
        </div>
      )
    }

    // Línea horizontal ─── o ═══
    if (trimmed.match(/^[─═]{4,}$/)) {
      return <div key={i} style={{ height: 1, background: '#E2E8F0', margin: '10px 0' }} />
    }

    // Línea vacía
    if (!trimmed) return <div key={i} style={{ height: 6 }} />

    // Línea normal
    return (
      <p key={i} style={{ margin: '0 0 4px', fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
        {renderInline(trimmed)}
      </p>
    )
  })

  return <div style={{ fontSize: 12 }}>{rendered}</div>
}

function renderInline(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ActividadesBtn({
  asesor,
  acColor,
}: {
  asesor:  string
  acColor: string
}) {
  const [open,        setOpen]        = useState(false)
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading,     setLoading]     = useState(false)
  const [generating,  setGenerating]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // ── Histórico ──────────────────────────────────────────────────────────────
  const [vista,       setVista]       = useState<'semana' | 'historico' | 'diagnostico' | 'ia'>('semana')
  const [allActs,     setAllActs]     = useState<Actividad[]>([])
  const [loadingHist, setLoadingHist] = useState(false)
  const [expandSem,   setExpandSem]   = useState<string | null>(null)

  // ── Diagnóstico de cartera ─────────────────────────────────────────────────
  const [diagnostico,  setDiagnostico]  = useState<DiagCuenta[]>([])
  const [loadingDiag,  setLoadingDiag]  = useState(false)

  // ── Análisis IA ────────────────────────────────────────────────────────────
  const [analisisResult, setAnalisisResult] = useState<string | null>(null)
  const [analisisMeta,   setAnalisisMeta]   = useState<{ generado_en: string; cuentas: number } | null>(null)
  const [loadingIA,      setLoadingIA]      = useState(false)
  const [iaError,        setIaError]        = useState<string | null>(null)
  const [iaStep,         setIaStep]         = useState(0)

  const IA_STEPS = [
    'Leyendo cartera y seguimientos...',
    'Analizando señales de riesgo...',
    'Detectando campos rotos...',
    'Generando instrucciones quirúrgicas...',
    'Preparando coaching al asesor...',
  ]

  const semanaInicio = toISO(getMondayOfWeek(new Date()))

  const overdueCount  = actividades.filter(a => isOverdue(a)).length
  const completadas   = actividades.filter(a => a.completada).length
  const totalPend     = actividades.filter(a => !a.completada).length
  const pct           = actividades.length > 0 ? Math.round((completadas / actividades.length) * 100) : 0

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/actividades?asesor=${encodeURIComponent(asesor)}&semana=${semanaInicio}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? `Error ${res.status} al cargar actividades`)
        return
      }
      setActividades(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar las actividades')
    } finally {
      setLoading(false)
    }
  }, [asesor, semanaInicio])

  const loadAll = useCallback(async () => {
    setLoadingHist(true)
    try {
      const res  = await fetch(`/api/actividades?asesor=${encodeURIComponent(asesor)}`)
      const data = await res.json()
      setAllActs(Array.isArray(data) ? data : [])
    } finally {
      setLoadingHist(false)
    }
  }, [asesor])

  const loadDiag = useCallback(async () => {
    setLoadingDiag(true)
    try {
      const res  = await fetch(`/api/actividades/diagnostico?asesor=${encodeURIComponent(asesor)}`)
      const data = await res.json()
      setDiagnostico(Array.isArray(data) ? data : [])
    } finally {
      setLoadingDiag(false)
    }
  }, [asesor])

  useEffect(() => { if (open) load() }, [open, load])

  useEffect(() => {
    if (open && vista === 'historico' && allActs.length === 0 && !loadingHist) loadAll()
  }, [open, vista, allActs.length, loadingHist, loadAll])

  useEffect(() => {
    if (open && vista === 'diagnostico' && diagnostico.length === 0 && !loadingDiag) loadDiag()
  }, [open, vista, diagnostico.length, loadingDiag, loadDiag])

  async function runAnalisis() {
    setLoadingIA(true)
    setIaError(null)
    setIaStep(0)

    // Cycla los mensajes de progreso
    const stepTimer = setInterval(() => {
      setIaStep(prev => (prev + 1) % IA_STEPS.length)
    }, 5000)

    try {
      const res  = await fetch('/api/actividades/analisis', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ asesor }),
      })
      const data = await res.json()
      if (!res.ok) {
        setIaError(data.error ?? 'Error al ejecutar el análisis')
      } else {
        setAnalisisResult(data.analisis ?? '')
        setAnalisisMeta({ generado_en: data.generado_en, cuentas: data.cuentas_analizadas })
      }
    } catch {
      setIaError('Error de conexión al ejecutar el análisis')
    } finally {
      clearInterval(stepTimer)
      setLoadingIA(false)
    }
  }

  // ── Computados histórico ──────────────────────────────────────────────────
  const histByWeek: Record<string, Actividad[]> = {}
  for (const a of allActs) {
    if (!histByWeek[a.semana_inicio]) histByWeek[a.semana_inicio] = []
    histByWeek[a.semana_inicio].push(a)
  }
  const historico: SemanaResumen[] = Object.entries(histByWeek)
    .filter(([s]) => s < semanaInicio)
    .map(([s, acts]) => ({
      semana_inicio: s,
      total: acts.length,
      completadas: acts.filter(a => a.completada).length,
      pct: acts.length > 0 ? Math.round(acts.filter(a => a.completada).length / acts.length * 100) : 0,
    }))
    .sort((a, b) => b.semana_inicio.localeCompare(a.semana_inicio))
  const avg4w = historico.length > 0
    ? Math.round(historico.slice(0, 4).reduce((s, w) => s + w.pct, 0) / Math.min(historico.length, 4))
    : null

  async function generar() {
    setGenerating(true)
    setError(null)
    try {
      await fetch('/api/actividades/generar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ asesor, semana: semanaInicio, sendEmail: false }),
      })
      await load()
    } catch {
      setError('Error al generar actividades')
    } finally {
      setGenerating(false)
    }
  }

  function handleUpdate(id: string, patch: Partial<Actividad>) {
    setActividades(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
  }

  // Agrupar por día
  const byDay: Record<string, Actividad[]> = {}
  for (const a of actividades) {
    if (!byDay[a.fecha_programada]) byDay[a.fecha_programada] = []
    byDay[a.fecha_programada].push(a)
  }

  return (
    <>
      {/* ── Botón trigger ───────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 10, border: 'none',
          background: '#7C3AED', color: '#fff',
          fontSize: 11, fontWeight: 700, cursor: 'pointer',
          transition: 'filter 0.15s',
          position: 'relative', width: '100%',
        }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
        onMouseLeave={e => (e.currentTarget.style.filter = '')}
      >
        <Zap size={12} />
        Actividades SAC
        {overdueCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#EF4444', color: '#fff',
            minWidth: 16, height: 16, borderRadius: 99, padding: '0 3px',
            fontSize: 9, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0A1628',
          }}>
            {overdueCount}
          </span>
        )}
      </button>

      {/* ── Panel deslizante ────────────────────────────────────────────── */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 560,
            background: '#FFFFFF',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.22)',
            animation: 'actSlideIn 0.22s ease-out',
          }}>

            {/* ─ Header ─ */}
            <div style={{
              padding: '15px 20px',
              background: '#0A1628',
              borderLeft: `4px solid ${acColor}`,
              display: 'flex', alignItems: 'center', gap: 12,
              flexShrink: 0,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <Zap size={15} color={acColor} />
                  <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 800 }}>Actividades SAC</p>
                </div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  {asesor} · {vista === 'semana'
                    ? `Semana del ${fmtFecha(semanaInicio)}`
                    : vista === 'historico'
                    ? `Actividad acumulada · ${historico.length} sem. registradas`
                    : vista === 'diagnostico'
                    ? `Diagnóstico de cartera · ${diagnostico.filter(d => d.criticos > 0).length} cuentas con datos críticos faltantes`
                    : analisisMeta ? `Análisis IA · ${analisisMeta.cuentas} cuentas · ${new Date(analisisMeta.generado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : 'Análisis IA — Motor de inteligencia SAC'}
                </p>
              </div>

              {vista === 'semana' && actividades.length > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative', width: 36, height: 36 }}>
                      <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="14" fill="none"
                          stroke={pct === 100 ? '#22C55E' : acColor}
                          strokeWidth="3"
                          strokeDasharray={`${2 * Math.PI * 14}`}
                          strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800 }}>
                        {pct}%
                      </span>
                    </div>
                    <div>
                      <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{completadas}/{actividades.length}</p>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 9 }}>completadas</p>
                    </div>
                  </div>
                </div>
              )}

              {vista === 'historico' && avg4w !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: pctColor(avg4w), lineHeight: 1 }}>{avg4w}%</p>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 9 }}>prom. 4 sem.</p>
                  </div>
                </div>
              )}

              <button onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>

            {/* ─ Tabs ─ */}
            <div style={{
              display: 'flex', borderBottom: '1px solid #E2E8F0',
              background: '#fff', flexShrink: 0,
            }}>
              {([
                { id: 'semana',      label: '⚡ Semana' },
                { id: 'historico',   label: '📊 Historial' },
                { id: 'diagnostico', label: '📋 Perfiles' },
                { id: 'ia',          label: '🔬 Análisis IA' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setVista(t.id)}
                  style={{
                    flex: 1, padding: '10px 0',
                    fontSize: 12, fontWeight: 700,
                    color: vista === t.id ? '#7C3AED' : '#94A3B8',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: `2px solid ${vista === t.id ? '#7C3AED' : 'transparent'}`,
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ─ Banner vencidas (solo semana) ─ */}
            {vista === 'semana' && overdueCount > 0 && (
              <div style={{ padding: '9px 20px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <AlertTriangle size={13} color="#DC2626" />
                <p style={{ margin: 0, fontSize: 11, color: '#991B1B', fontWeight: 700 }}>
                  {overdueCount} actividad{overdueCount > 1 ? 'es vencidas' : ' vencida'} —
                  supervisores pueden ver este estado y solicitar justificación
                </p>
              </div>
            )}

            {/* ─ Body (scroll) ─ */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

              {/* ═══ VISTA: ESTA SEMANA ═══ */}
              {vista === 'semana' && (
                <>
                  {error && (
                    <div style={{ padding: '9px 14px', background: '#FEF2F2', borderRadius: 8, color: '#991B1B', fontSize: 12, marginBottom: 16, border: '1px solid #FECACA' }}>
                      {error}
                    </div>
                  )}

                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 56, gap: 12, color: '#94A3B8', fontSize: 13 }}>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Cargando actividades...
                    </div>
                  ) : actividades.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Calendar size={24} color="#7C3AED" />
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1F2937' }}>
                        Sin actividades esta semana
                      </p>
                      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                        Selecciona las <strong>4 cuentas</strong> de la semana para <strong>{asesor}</strong>:
                        las de mayor prioridad con datos de perfil o Radar pendientes.
                        Solo cuentas activas — se excluyen dormidas, canceladas y con churn confirmado.
                      </p>
                      <button
                        onClick={() => generar()}
                        disabled={generating}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '10px 24px', borderRadius: 10, border: 'none',
                          background: '#7C3AED', color: '#fff',
                          fontSize: 13, fontWeight: 700,
                          cursor: generating ? 'not-allowed' : 'pointer',
                          opacity: generating ? 0.7 : 1,
                        }}
                      >
                        {generating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
                        {generating ? 'Generando...' : 'Generar actividades'}
                      </button>
                    </div>
                  ) : (
                    Object.entries(byDay).map(([fecha, acts]) => {
                      const d        = new Date(fecha + 'T12:00:00')
                      const dayName  = DIAS[d.getDay()].toUpperCase()
                      const hasOver  = acts.some(a => isOverdue(a))
                      const allDone  = acts.every(a => a.completada)

                      return (
                        <div key={fecha} style={{ marginBottom: 22 }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            marginBottom: 10, paddingBottom: 8,
                            borderBottom: `2px solid ${hasOver ? '#FCA5A5' : allDone ? '#86EFAC' : '#E2E8F0'}`,
                          }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              background: hasOver ? '#FEF2F2' : allDone ? '#F0FDF4' : '#EFF6FF',
                              border: `1px solid ${hasOver ? '#FECACA' : allDone ? '#BBF7D0' : '#BFDBFE'}`,
                            }}>
                              <span style={{ fontSize: 7, fontWeight: 800, color: hasOver ? '#DC2626' : allDone ? '#16A34A' : '#1D4ED8', letterSpacing: '0.04em' }}>{dayName}</span>
                              <span style={{ fontSize: 17, fontWeight: 900, color: hasOver ? '#DC2626' : allDone ? '#16A34A' : '#1D4ED8', lineHeight: 1 }}>{d.getDate()}</span>
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1F2937' }}>
                                {dayName} {d.getDate()} {MESES[d.getMonth()]}
                              </p>
                              <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                                {acts.filter(a => a.completada).length}/{acts.length} completadas
                                {hasOver && <span style={{ color: '#EF4444' }}> · ⚠ Vencidas</span>}
                              </p>
                            </div>
                            {allDone && <CheckCircle size={16} color="#16A34A" style={{ marginLeft: 'auto' }} />}
                          </div>

                          {acts.map(act => (
                            <ActividadCard key={act.id} act={act} onUpdate={handleUpdate} />
                          ))}
                        </div>
                      )
                    })
                  )}
                </>
              )}

              {/* ═══ VISTA: DIAGNÓSTICO DE CARTERA ═══ */}
              {vista === 'diagnostico' && (
                <>
                  {loadingDiag ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 56, gap: 12, color: '#94A3B8', fontSize: 13 }}>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analizando perfiles...
                    </div>
                  ) : diagnostico.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <ListChecks size={24} color="#059669" />
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1F2937' }}>Sin cuentas activas</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>No se encontraron cuentas para analizar.</p>
                    </div>
                  ) : (
                    <>
                      {/* Resumen global */}
                      {(() => {
                        const conCrit = diagnostico.filter(d => d.criticos > 0)
                        const totalCrit = diagnostico.reduce((s, d) => s + d.criticos, 0)
                        const totalImp  = diagnostico.reduce((s, d) => s + d.importantes, 0)
                        const completas = diagnostico.filter(d => d.gaps.length === 0)
                        return (
                          <div style={{ padding: '14px 16px', borderRadius: 12, background: conCrit.length > 0 ? '#FFF5F5' : '#F0FDF4', border: `1px solid ${conCrit.length > 0 ? '#FECACA' : '#BBF7D0'}`, marginBottom: 16 }}>
                            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Resumen de perfiles — {diagnostico.length} cuentas
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                              <div style={{ textAlign: 'center', padding: '8px 6px', background: '#fff', borderRadius: 8, border: '1px solid #FECACA' }}>
                                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#DC2626', lineHeight: 1 }}>{totalCrit}</p>
                                <p style={{ margin: '3px 0 0', fontSize: 9, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Datos críticos</p>
                              </div>
                              <div style={{ textAlign: 'center', padding: '8px 6px', background: '#fff', borderRadius: 8, border: '1px solid #FED7AA' }}>
                                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#D97706', lineHeight: 1 }}>{totalImp}</p>
                                <p style={{ margin: '3px 0 0', fontSize: 9, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Datos importantes</p>
                              </div>
                              <div style={{ textAlign: 'center', padding: '8px 6px', background: '#fff', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#059669', lineHeight: 1 }}>{completas.length}</p>
                                <p style={{ margin: '3px 0 0', fontSize: 9, color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Perfiles completos</p>
                              </div>
                            </div>
                            {conCrit.length > 0 && (
                              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#991B1B' }}>
                                ⚠ <strong>{conCrit.length} cuenta{conCrit.length > 1 ? 's' : ''}</strong> sin datos de contacto. Sin estos datos no es posible predecir riesgo de churn correctamente.
                              </p>
                            )}
                          </div>
                        )
                      })()}

                      {/* Cards por cuenta */}
                      {diagnostico.map(d => {
                        const hs        = d.health_score
                        const semCol    = hs >= 80 ? '#22C55E' : hs >= 60 ? '#3B82F6' : hs >= 40 ? '#EAB308' : hs >= 20 ? '#F97316' : '#EF4444'
                        const pctBg     = d.pct_completo >= 80 ? '#F0FDF4' : d.pct_completo >= 50 ? '#FFFBEB' : '#FFF5F5'
                        const pctBorder = d.pct_completo >= 80 ? '#BBF7D0' : d.pct_completo >= 50 ? '#FDE68A' : '#FECACA'
                        const pctColor  = d.pct_completo >= 80 ? '#059669' : d.pct_completo >= 50 ? '#D97706' : '#DC2626'

                        if (d.gaps.length === 0) {
                          return (
                            <div key={d.id} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <CheckCircle size={13} color="#059669" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#1F2937', flex: 1 }}>{d.empresa}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>Perfil completo</span>
                            </div>
                          )
                        }

                        return (
                          <div key={d.id} style={{ marginBottom: 8, border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                            {/* Header de cuenta */}
                            <div style={{ padding: '9px 12px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: semCol, padding: '2px 7px', borderRadius: 99 }}>
                                HS {hs}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#1F2937', flex: 1 }}>{d.empresa}</span>
                              <a href={`/cuentas/${d.id}`} style={{ fontSize: 10, color: '#7C3AED', fontWeight: 700, textDecoration: 'none' }}>
                                Ver cuenta →
                              </a>
                            </div>

                            {/* Barra de completitud */}
                            <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${d.pct_completo}%`, background: pctColor, borderRadius: 99, transition: 'width 0.4s' }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: pctColor, minWidth: 36, textAlign: 'right' }}>{d.pct_completo}%</span>
                              <span style={{ fontSize: 9, color: '#94A3B8' }}>completo</span>
                            </div>

                            {/* Campos faltantes */}
                            <div style={{ padding: '8px 12px' }}>
                              <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Datos faltantes ({d.gaps.length})
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {d.gaps.map((g, i) => (
                                  <span key={i} style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                                    background: g.nivel === 'critico' ? '#FEF2F2' : g.nivel === 'importante' ? '#FFFBEB' : '#F8FAFC',
                                    color:      g.nivel === 'critico' ? '#DC2626'  : g.nivel === 'importante' ? '#D97706'  : '#94A3B8',
                                    border: `1px solid ${g.nivel === 'critico' ? '#FECACA' : g.nivel === 'importante' ? '#FDE68A' : '#E2E8F0'}`,
                                  }}>
                                    {g.nivel === 'critico' ? '🔴' : g.nivel === 'importante' ? '🟡' : '⚪'} {g.campo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* Leyenda */}
                      <div style={{ marginTop: 12, padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Niveles de urgencia</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 11, color: '#DC2626' }}>🔴 <strong>Crítico</strong>: bloquea análisis de riesgo y contactabilidad</span>
                          <span style={{ fontSize: 11, color: '#D97706' }}>🟡 <strong>Importante</strong>: limita previsión de churn y oportunidades</span>
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>⚪ <strong>Deseable</strong>: enriquece el perfil del cliente B2B</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ═══ VISTA: ACTIVIDAD ACUMULADA ═══ */}
              {vista === 'historico' && (
                <>
                  {loadingHist ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 56, gap: 12, color: '#94A3B8', fontSize: 13 }}>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Cargando histórico...
                    </div>
                  ) : historico.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <History size={24} color="#64748B" />
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1F2937' }}>Sin semanas anteriores</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                        El historial se irá acumulando semana a semana.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* KPI acumulado */}
                      {avg4w !== null && (
                        <div style={{
                          padding: '14px 16px', borderRadius: 12,
                          background: `${pctColor(avg4w)}10`,
                          border: `1px solid ${pctColor(avg4w)}30`,
                          marginBottom: 16,
                          display: 'flex', gap: 16, alignItems: 'center',
                        }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                              Promedio cumplimiento
                            </p>
                            <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: pctColor(avg4w), lineHeight: 1 }}>
                              {avg4w}%
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#94A3B8' }}>
                              Últimas {Math.min(historico.length, 4)} semanas · {historico.length} sem. totales
                            </p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                            {historico.slice(0, 4).map(s => (
                              <div key={s.semana_inicio} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 60, height: 4, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${s.pct}%`, background: pctColor(s.pct), borderRadius: 99 }} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: pctColor(s.pct), minWidth: 28, textAlign: 'right' }}>{s.pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lista de semanas */}
                      {historico.map(s => {
                        const expanded   = expandSem === s.semana_inicio
                        const actsOfWeek = histByWeek[s.semana_inicio] ?? []
                        const byDayHist: Record<string, Actividad[]> = {}
                        for (const a of actsOfWeek) {
                          if (!byDayHist[a.fecha_programada]) byDayHist[a.fecha_programada] = []
                          byDayHist[a.fecha_programada].push(a)
                        }
                        const col = pctColor(s.pct)

                        return (
                          <div key={s.semana_inicio} style={{
                            marginBottom: 8,
                            border: `1px solid ${expanded ? col + '40' : '#E2E8F0'}`,
                            borderRadius: 10, overflow: 'hidden',
                          }}>
                            {/* Fila resumen de semana */}
                            <div
                              onClick={() => setExpandSem(expanded ? null : s.semana_inicio)}
                              style={{
                                padding: '11px 14px', display: 'flex',
                                alignItems: 'center', gap: 10, cursor: 'pointer',
                                background: expanded ? `${col}08` : '#fff',
                              }}
                            >
                              <div style={{ flexShrink: 0 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1F2937' }}>
                                  Semana del {fmtFecha(s.semana_inicio)}
                                </p>
                                <p style={{ margin: '2px 0 0', fontSize: 10, color: '#94A3B8' }}>
                                  {s.completadas} completadas · {s.total - s.completadas} sin realizar
                                </p>
                              </div>
                              <div style={{ flex: 1, height: 5, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${s.pct}%`, background: col, borderRadius: 99, transition: 'width 0.4s' }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap' }}>
                                {s.completadas}/{s.total}
                              </span>
                              <span style={{
                                fontSize: 11, fontWeight: 800,
                                padding: '3px 9px', borderRadius: 99,
                                background: `${col}18`, color: col,
                                whiteSpace: 'nowrap',
                              }}>
                                {s.pct}%
                              </span>
                              <ChevronDown size={12} color="#94A3B8" style={{
                                flexShrink: 0,
                                transform: expanded ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s',
                              }} />
                            </div>

                            {/* Detalle expandido */}
                            {expanded && (
                              <div style={{ borderTop: `1px solid ${col}20`, padding: '12px 14px', background: '#FAFAFA' }}>
                                {Object.entries(byDayHist)
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([fecha, acts]) => (
                                    <div key={fecha} style={{ marginBottom: 10 }}>
                                      <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {fmtFecha(fecha)} · {acts.filter(a => a.completada).length}/{acts.length}
                                      </p>
                                      {acts.map(act => (
                                        <ActividadCard
                                          key={act.id}
                                          act={act}
                                          onUpdate={() => {}}
                                          readOnly
                                        />
                                      ))}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}
                </>
              )}

              {/* ═══ VISTA: ANÁLISIS IA ═══ */}
              {vista === 'ia' && (
                <>
                  {loadingIA ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 56, gap: 18 }}>
                      <div style={{ position: 'relative', width: 56, height: 56 }}>
                        <div style={{ position: 'absolute', inset: 0, border: '3px solid #E2E8F0', borderRadius: '50%' }} />
                        <div style={{
                          position: 'absolute', inset: 0, border: '3px solid transparent',
                          borderTopColor: '#7C3AED', borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔬</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#fff' }}>Ejecutando análisis SAC...</p>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{IA_STEPS[iaStep]}</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', textAlign: 'center', maxWidth: 260 }}>
                        El motor de inteligencia analiza toda la cartera. Puede tomar 20–40 segundos.
                      </p>
                    </div>
                  ) : iaError ? (
                    <div style={{ padding: '14px 16px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', marginBottom: 16 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Error al ejecutar el análisis</p>
                      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#DC2626' }}>{iaError}</p>
                      <button onClick={runAnalisis} style={{ padding: '6px 14px', borderRadius: 7, background: '#7C3AED', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Reintentar
                      </button>
                    </div>
                  ) : !analisisResult ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED20 0%, #0E30CC20 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
                        🔬
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#fff' }}>Motor de Inteligencia SAC</p>
                      <p style={{ margin: '0 auto 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.6, maxWidth: 320 }}>
                        Analiza toda la cartera de <strong>{asesor}</strong> con IA: riesgo de churn, instrucciones quirúrgicas por cuenta, oportunidades de upsell y coaching táctico al asesor.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 24px', textAlign: 'left', maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
                        {['Diagnóstico de completitud de perfiles', 'Previsión de riesgo y WARNING cards', 'Instrucciones quirúrgicas por cuenta', 'Oportunidades de upsell priorizadas', 'Coaching táctico post-análisis'].map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6B7280' }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#7C3AED20', color: '#7C3AED', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                            {s}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={runAnalisis}
                        disabled={loadingIA}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '11px 28px', borderRadius: 10, border: 'none',
                          background: 'linear-gradient(135deg, #7C3AED 0%, #0E30CC 100%)',
                          color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                        }}
                      >
                        🔬 Ejecutar Análisis SAC
                      </button>
                      <p style={{ margin: '10px 0 0', fontSize: 10, color: '#94A3B8' }}>Powered by gpt-4o-mini · ~20–40 s</p>
                    </div>
                  ) : (
                    <div>
                      {/* Toolbar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '10px 14px', background: '#F5F3FF', borderRadius: 10, border: '1px solid #DDD6FE' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#5B21B6' }}>Análisis generado</p>
                          {analisisMeta && (
                            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#7C3AED' }}>
                              {analisisMeta.cuentas} cuentas · {new Date(analisisMeta.generado_en).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={runAnalisis}
                          disabled={loadingIA}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid #DDD6FE', background: '#fff', color: '#7C3AED', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          <RefreshCw size={10} /> Re-ejecutar
                        </button>
                      </div>

                      {/* Render del análisis */}
                      <AnalisisRenderer text={analisisResult} />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ─ Footer ─ */}
            <div style={{
              padding: '11px 20px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex', gap: 8, alignItems: 'center',
              flexShrink: 0, flexWrap: 'wrap',
            }}>
              <button
                onClick={vista === 'semana' ? load : vista === 'historico' ? loadAll : vista === 'diagnostico' ? loadDiag : runAnalisis}
                disabled={loading || loadingHist}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 11px', borderRadius: 7, border: '1px solid #E2E8F0',
                  background: '#fff', color: '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <RefreshCw size={10} /> Actualizar
              </button>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                {vista === 'semana' ? (
                  <p style={{ margin: 0, fontSize: 10, color: '#94A3B8' }}>
                    {totalPend} pendiente{totalPend !== 1 ? 's' : ''}
                    {overdueCount > 0 && (
                      <span style={{ color: '#EF4444' }}>
                        {' '}· {overdueCount} vencida{overdueCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                ) : vista === 'historico' ? (
                  <p style={{ margin: 0, fontSize: 10, color: '#94A3B8' }}>
                    {historico.reduce((s, w) => s + w.total, 0)} actividades · {historico.length} semanas
                  </p>
                ) : vista === 'diagnostico' ? (
                  <p style={{ margin: 0, fontSize: 10, color: '#94A3B8' }}>
                    {diagnostico.length} cuentas analizadas · {diagnostico.filter(d => d.gaps.length === 0).length} perfiles completos
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: 10, color: '#94A3B8' }}>
                    {analisisMeta ? `gpt-4o-mini · ${analisisMeta.cuentas} cuentas · ${analisisMeta.generado_en.slice(0, 10)}` : 'Pulsa "Actualizar" para re-ejecutar el análisis'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes actSlideIn {
              from { transform: translateX(100%); opacity: 0; }
              to   { transform: translateX(0);    opacity: 1; }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
