'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Zap, X, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Send, Loader2, Calendar, Phone, Users,
  BarChart2, FileText, TrendingUp,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type TipoActividad  = 'llamada' | 'reunion' | 'analisis' | 'kam' | 'upsell'
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
}

// ── Config visual por tipo ────────────────────────────────────────────────────

const TIPO_CFG: Record<TipoActividad, { label: string; icon: React.ReactNode; color: string }> = {
  llamada:  { label: 'Llamada',   icon: <Phone size={10} />,    color: '#0E30CC' },
  reunion:  { label: 'Reunión',   icon: <Users size={10} />,    color: '#7C3AED' },
  analisis: { label: 'Análisis',  icon: <BarChart2 size={10} />,color: '#0891B2' },
  kam:      { label: 'KAM',       icon: <FileText size={10} />, color: '#059669' },
  upsell:   { label: 'Upsell',    icon: <TrendingUp size={10} />,color: '#D97706' },
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

// ── ActividadCard ─────────────────────────────────────────────────────────────

function ActividadCard({
  act, onUpdate,
}: {
  act: Actividad
  onUpdate: (id: string, patch: Partial<Actividad>) => void
}) {
  const [editing,   setEditing]   = useState(false)
  const [resultado, setResultado] = useState(act.resultado ?? '')
  const [motivo,    setMotivo]    = useState(act.motivo_pendiente ?? '')
  const [saving,    setSaving]    = useState(false)

  const overdue   = isOverdue(act)
  const tc        = TIPO_CFG[act.tipo]
  const borderCol = act.completada ? '#22C55E' : overdue ? '#EF4444' : '#E2E8F0'
  const headBg    = act.completada ? '#F0FDF4' : overdue ? '#FFF1F2' : '#F8FAFC'

  async function save(completada: boolean) {
    setSaving(true)
    try {
      const payload = {
        completada,
        estado:          completada ? 'completada' : 'pendiente',
        resultado:       completada ? resultado : null,
        motivo_pendiente:!completada ? motivo    : null,
      }
      const res = await fetch(`/api/actividades/${act.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdate(act.id, updated)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
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
              background: '#EFF6FF', color: '#1B3FCC',
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 99, fontFamily: 'monospace',
            }}>
              {act.consecutivo}
            </span>
            {act.cid && (
              <span style={{ background: '#F8FAFC', color: '#64748B', fontSize: 10, padding: '2px 7px', borderRadius: 99 }}>
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

          <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
            {act.empresa}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.55 }}>
            {act.descripcion}
          </p>
          <p style={{ margin: '5px 0 0', fontSize: 11, color: overdue ? '#DC2626' : '#94A3B8' }}>
            Vigencia: {fmtFecha(act.fecha_programada)} → {fmtFecha(act.fecha_vencimiento)}
            {overdue && ' · Plazo vencido — requiere justificación'}
          </p>

          {/* Resultado visible si completada */}
          {act.completada && act.resultado && (
            <div style={{ marginTop: 6, padding: '5px 10px', background: '#F0FDF4', borderRadius: 6, fontSize: 12, color: '#166534' }}>
              <strong>Resultado:</strong> {act.resultado}
            </div>
          )}

          {/* Motivo si no completada y registrado */}
          {!act.completada && act.motivo_pendiente && (
            <div style={{ marginTop: 6, padding: '5px 10px', background: '#FFF7ED', borderRadius: 6, fontSize: 12, color: '#92400E', border: '1px solid #FED7AA' }}>
              <strong>Motivo:</strong> {act.motivo_pendiente}
            </div>
          )}

          {/* Banner vencida sin justificación */}
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
          {!editing ? (
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <textarea
                value={resultado}
                onChange={e => setResultado(e.target.value)}
                placeholder="Resultado (si se completó)..."
                rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #BFDBFE', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Motivo por el que NO se realizó (obligatorio si vencida)..."
                rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #FECACA', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <button
                  disabled={saving || !resultado.trim()}
                  onClick={() => save(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 6, border: 'none',
                    background: saving || !resultado.trim() ? '#DCFCE7' : '#059669',
                    color: saving || !resultado.trim() ? '#6EE7B7' : '#fff',
                    fontSize: 11, fontWeight: 700,
                    cursor: saving || !resultado.trim() ? 'not-allowed' : 'pointer',
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
                  color: '#64748B', fontSize: 11, cursor: 'pointer', border: 'none',
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function ActividadesBtn({
  asesor,
  acColor,
}: {
  asesor:  string
  acColor: string
}) {
  const [open,          setOpen]          = useState(false)
  const [actividades,   setActividades]   = useState<Actividad[]>([])
  const [loading,       setLoading]       = useState(false)
  const [generating,    setGenerating]    = useState(false)
  const [sendingEmail,  setSendingEmail]  = useState(false)
  const [emailSent,     setEmailSent]     = useState(false)
  const [error,         setError]         = useState<string | null>(null)

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
      setActividades(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar las actividades')
    } finally {
      setLoading(false)
    }
  }, [asesor, semanaInicio])

  useEffect(() => { if (open) load() }, [open, load])

  async function generar(sendEmail: boolean) {
    setGenerating(true)
    setError(null)
    try {
      await fetch('/api/actividades/generar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ asesor, semana: semanaInicio, sendEmail }),
      })
      await load()
      if (sendEmail) setEmailSent(true)
    } catch {
      setError('Error al generar actividades')
    } finally {
      setGenerating(false)
    }
  }

  async function enviarEmail() {
    setSendingEmail(true)
    setError(null)
    try {
      await fetch('/api/actividades/generar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ asesor, semana: semanaInicio, sendEmail: true }),
      })
      setEmailSent(true)
    } catch {
      setError('Error al enviar email')
    } finally {
      setSendingEmail(false)
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
                  {asesor} · Semana del {fmtFecha(semanaInicio)}
                </p>
              </div>

              {actividades.length > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Progress ring (simple) */}
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

              <button onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>

            {/* ─ Banner vencidas ─ */}
            {overdueCount > 0 && (
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
                /* Estado vacío — generar */
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Calendar size={24} color="#7C3AED" />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                    Sin actividades esta semana
                  </p>
                  <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                    Genera automáticamente las 10 actividades de la semana
                    (2 por día, L–V) basadas en el estado real de la cartera de <strong>{asesor}</strong>.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => generar(false)}
                      disabled={generating}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', borderRadius: 10, border: 'none',
                        background: '#7C3AED', color: '#fff',
                        fontSize: 13, fontWeight: 700,
                        cursor: generating ? 'not-allowed' : 'pointer',
                        opacity: generating ? 0.7 : 1,
                      }}
                    >
                      {generating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
                      {generating ? 'Generando...' : 'Generar actividades'}
                    </button>
                    <button
                      onClick={() => generar(true)}
                      disabled={generating}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', borderRadius: 10, border: '1px solid #DDD6FE',
                        background: '#fff', color: '#7C3AED',
                        fontSize: 13, fontWeight: 700,
                        cursor: generating ? 'not-allowed' : 'pointer',
                        opacity: generating ? 0.7 : 1,
                      }}
                    >
                      <Send size={14} />
                      Generar + enviar email
                    </button>
                  </div>
                </div>
              ) : (
                /* Lista de actividades por día */
                Object.entries(byDay).map(([fecha, acts]) => {
                  const d        = new Date(fecha + 'T12:00:00')
                  const dayName  = DIAS[d.getDay()].toUpperCase()
                  const hasOver  = acts.some(a => isOverdue(a))
                  const allDone  = acts.every(a => a.completada)

                  return (
                    <div key={fecha} style={{ marginBottom: 22 }}>
                      {/* Day header */}
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
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
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
            </div>

            {/* ─ Footer ─ */}
            {actividades.length > 0 && (
              <div style={{
                padding: '11px 20px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex', gap: 8, alignItems: 'center',
                flexShrink: 0, flexWrap: 'wrap',
              }}>
                <button
                  onClick={load}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 11px', borderRadius: 7, border: '1px solid #E2E8F0',
                    background: '#fff', color: '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={10} /> Actualizar
                </button>
                <button
                  onClick={enviarEmail}
                  disabled={sendingEmail || emailSent}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 11px', borderRadius: 7, border: 'none',
                    background: emailSent ? '#F0FDF4' : '#7C3AED',
                    color: emailSent ? '#16A34A' : '#fff',
                    fontSize: 11, fontWeight: 700,
                    cursor: sendingEmail || emailSent ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sendingEmail
                    ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Send size={10} />}
                  {emailSent ? '✓ Email enviado' : 'Enviar por email'}
                </button>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 10, color: '#94A3B8' }}>
                    {totalPend} pendiente{totalPend !== 1 ? 's' : ''}
                    {overdueCount > 0 && (
                      <span style={{ color: '#EF4444' }}>
                        {' '}· {overdueCount} vencida{overdueCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
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
