'use client'
import { useState } from 'react'
import type { ActividadSAC } from '@/lib/supabase'
import { CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'

/* ── Metadatos por tipo ──────────────────────────────────────────────────── */
const TIPO_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  llamada:    { label: 'Llamada',             emoji: '📞', color: '#1B4FCC', bg: '#EEF2FF' },
  reunion:    { label: 'Reunión',             emoji: '📊', color: '#4338CA', bg: '#EEF2FF' },
  analisis:   { label: 'Análisis / Reporte',  emoji: '📈', color: '#6D28D9', bg: '#F5F3FF' },
  kam:        { label: 'Seguimiento KAM',     emoji: '📝', color: '#0369A1', bg: '#E0F2FE' },
  upsell:     { label: 'Propuesta Expansión', emoji: '🚀', color: '#15803D', bg: '#DCFCE7' },
  validacion: { label: 'Completar Perfil',    emoji: '⚠️', color: '#B91C1C', bg: '#FEE2E2' },
  tickets:    { label: 'Análisis Tickets',    emoji: '🎫', color: '#C2410C', bg: '#FFEDD5' },
  pagos:      { label: 'Comportamiento Pago', emoji: '💳', color: '#92400E', bg: '#FEF3C7' },
}

const PRIO_META: Record<string, { color: string; bg: string; border: string }> = {
  alta:  { color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' },
  media: { color: '#9A3412', bg: '#FFEDD5', border: '#FED7AA' },
  baja:  { color: '#1E40AF', bg: '#DBEAFE', border: '#BFDBFE' },
}

function fmtFecha(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
function semanaLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  if (isNaN(d.getTime())) return iso
  return `Semana del ${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

/* ── Row individual ─────────────────────────────────────────────────────── */
function ActividadRow({ act, canEdit }: { act: ActividadSAC; canEdit: boolean }) {
  const [expanded,  setExpanded]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [resultado, setResultado] = useState(act.resultado ?? '')
  const [estado,    setEstado]    = useState(act.estado)
  const [saved,     setSaved]     = useState(false)

  const meta  = TIPO_META[act.tipo] ?? { label: act.tipo, emoji: '📋', color: '#374151', bg: '#F3F4F6' }
  const prio  = PRIO_META[act.prioridad] ?? { color: '#374151', bg: '#F3F4F6', border: '#D1D5DB' }
  const pcomp = estado === 'completada'
  const pbloc = estado === 'bloqueada'

  async function completar() {
    if (!resultado.trim()) return
    setSaving(true)
    try {
      const r = await fetch(`/api/actividades/${act.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: true, estado: 'completada', resultado }),
      })
      if (r.ok) { setEstado('completada'); setSaved(true) }
    } finally { setSaving(false) }
  }

  // Color del borde lateral según estado
  const leftBorder = pcomp ? '#16A34A' : pbloc ? '#DC2626' : '#F59E0B'

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderLeft: `3px solid ${leftBorder}`,
      borderRadius: 10,
      overflow: 'hidden',
      opacity: pbloc ? 0.75 : 1,
    }}>
      {/* Cabecera */}
      <button
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', textAlign: 'left', background: 'transparent',
          cursor: 'pointer', border: 'none',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Emoji tipo */}
        <span style={{ fontSize: 15, flexShrink: 0 }}>{meta.emoji}</span>

        {/* Info central */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            {/* Badge tipo */}
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 20,
              background: meta.bg, color: meta.color,
            }}>
              {meta.label}
            </span>
            {/* Badge prioridad */}
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
              padding: '2px 7px', borderRadius: 20,
              background: prio.bg, color: prio.color, border: `1px solid ${prio.border}`,
            }}>
              {act.prioridad}
            </span>
            {/* Semana */}
            <span style={{ fontSize: 9, color: '#6B7280' }}>{semanaLabel(act.semana_inicio)}</span>
          </div>
          <p style={{ fontSize: 10, color: '#4B5563', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fmtFecha(act.fecha_programada)}
          </p>
        </div>

        {/* Estado badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {pcomp && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
              padding: '3px 9px', borderRadius: 20,
              background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0',
            }}>
              <CheckCircle2 size={9} /> Completada
            </span>
          )}
          {pbloc && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
              padding: '3px 9px', borderRadius: 20,
              background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA',
            }}>
              <XCircle size={9} /> Bloqueada
            </span>
          )}
          {estado === 'pendiente' && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
              padding: '3px 9px', borderRadius: 20,
              background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A',
            }}>
              <Clock size={9} /> Pendiente
            </span>
          )}
          {expanded
            ? <ChevronUp  size={13} style={{ color: '#9CA3AF' }} />
            : <ChevronDown size={13} style={{ color: '#9CA3AF' }} />
          }
        </div>
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div style={{
          padding: '10px 14px 14px',
          borderTop: '1px solid #F3F4F6',
          background: '#F9FAFB',
        }}>
          {/* Descripción */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E7EB',
            borderRadius: 8, padding: '10px 12px', marginBottom: 10,
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
              Descripción de la actividad
            </p>
            <p style={{ fontSize: 11, color: '#1F2937', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
              {act.descripcion}
            </p>
          </div>

          {/* Resultado registrado */}
          {pcomp && act.resultado && (
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 8, padding: '10px 12px', marginBottom: 10,
            }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>
                Resultado registrado
              </p>
              <p style={{ fontSize: 11, color: '#14532D', lineHeight: 1.6, margin: 0 }}>
                {act.resultado}
              </p>
            </div>
          )}

          {/* Completar actividad */}
          {!pcomp && !pbloc && canEdit && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
                Registrar resultado
              </p>
              <textarea
                value={resultado}
                onChange={e => setResultado(e.target.value)}
                placeholder="¿Qué ocurrió? Resultado de la llamada, reunión o análisis..."
                rows={3}
                style={{
                  width: '100%', fontSize: 11, color: '#1F2937',
                  border: '1px solid #D1D5DB', borderRadius: 8,
                  padding: '8px 10px', resize: 'none',
                  outline: 'none', background: '#fff', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={completar}
                disabled={saving || !resultado.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  marginTop: 6, padding: '6px 14px', borderRadius: 8, border: 'none',
                  fontSize: 11, fontWeight: 700, color: '#fff', cursor: saving || !resultado.trim() ? 'not-allowed' : 'pointer',
                  background: saved ? '#16A34A' : '#1B3FCC',
                  opacity: saving || !resultado.trim() ? 0.45 : 1,
                }}
              >
                <CheckCircle2 size={12} />
                {saving ? 'Guardando…' : saved ? '¡Completada!' : 'Marcar como completada'}
              </button>
            </div>
          )}

          {/* Vencimiento */}
          <p style={{ fontSize: 10, color: '#6B7280', margin: 0 }}>
            Vence: <strong style={{ color: '#374151' }}>{fmtFecha(act.fecha_vencimiento)}</strong>
            {' · '}HS cuenta: <strong style={{ color: '#374151' }}>{act.hs_cuenta}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Componente principal ───────────────────────────────────────────────── */
interface Props {
  actividades: ActividadSAC[]
  canEdit:     boolean
}

export default function CuentaActividadesSAC({ actividades, canEdit }: Props) {
  const total       = actividades.length
  const completadas = actividades.filter(a => a.estado === 'completada').length
  const pendientes  = actividades.filter(a => a.estado === 'pendiente').length
  const bloqueadas  = actividades.filter(a => a.estado === 'bloqueada').length
  const pct         = total > 0 ? Math.round(completadas / total * 100) : 0

  if (total === 0) {
    return (
      <div className="cp-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ClipboardList size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
          <h3 style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Actividades SAC
          </h3>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '24px 0', fontStyle: 'italic', margin: 0 }}>
          No hay actividades SAC registradas para esta cuenta.
        </p>
      </div>
    )
  }

  return (
    <div className="cp-card" style={{ padding: '0' }}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />
          <h3 style={{ fontSize: 10, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Actividades SAC
          </h3>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
            background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)',
          }}>
            {total}
          </span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: pct >= 70 ? '#4ADE80' : pct >= 40 ? '#FB923C' : '#F87171' }}>
          {pct}% completado
        </span>
      </div>

      {/* ── KPI resumen ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 16px 4px' }}>
        {/* Completadas */}
        <div style={{
          textAlign: 'center', borderRadius: 10, padding: '10px 6px',
          background: '#F0FDF4', border: '1.5px solid #BBF7D0',
        }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#15803D', margin: 0, lineHeight: 1 }}>{completadas}</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#166534', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completadas</p>
        </div>
        {/* Pendientes */}
        <div style={{
          textAlign: 'center', borderRadius: 10, padding: '10px 6px',
          background: '#FFFBEB', border: '1.5px solid #FDE68A',
        }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#D97706', margin: 0, lineHeight: 1 }}>{pendientes}</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#92400E', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendientes</p>
        </div>
        {/* Bloqueadas */}
        <div style={{
          textAlign: 'center', borderRadius: 10, padding: '10px 6px',
          background: '#FFF1F2', border: '1.5px solid #FECDD3',
        }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#DC2626', margin: 0, lineHeight: 1 }}>{bloqueadas}</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#991B1B', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bloqueadas</p>
        </div>
      </div>

      {/* ── Barra de progreso ────────────────────────────────────────── */}
      <div style={{ padding: '8px 16px 14px' }}>
        <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 99,
            background: pct >= 70 ? '#22C55E' : pct >= 40 ? '#F97316' : '#EF4444',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* ── Lista de actividades ─────────────────────────────────────── */}
      <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 520, overflowY: 'auto' }}>
        {actividades.map(a => (
          <ActividadRow key={a.id} act={a} canEdit={canEdit} />
        ))}
      </div>
    </div>
  )
}
