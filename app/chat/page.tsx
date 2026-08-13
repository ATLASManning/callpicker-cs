'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Loader2, Sparkles, BookOpen, Clock, ChevronDown, ChevronUp, AlertCircle, Search } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

type TipoRespuesta = 'normal' | 'pendiente' | 'requiere_busqueda_web'
type Confianza     = 'alta' | 'media' | 'baja'

interface Msg {
  role:      'user' | 'assistant'
  content:   string
  tipo?:     TipoRespuesta
  confianza?: Confianza
}

interface BitacoraEntry {
  id:              string
  created_at:      string
  usuario_nombre:  string
  usuario_email:   string
  pregunta:        string
  respuesta:       string
  tipo:            TipoRespuesta
  confianza:       Confianza
  modulos_contexto: string[]
}

const SUGERENCIAS = [
  '¿Qué cuentas tienen mayor riesgo de churn esta semana?',
  'Dame un script de WhatsApp para un cliente con score rojo',
  '¿Cómo identifico oportunidades de upsell con Callpicker Chat?',
  'Explícame el modelo de Health Score de Callpicker',
  '¿Cuál es el promedio de días de activación este año?',
  'Muéstrame las cuentas en auditoría de Claudia',
]

// ── Badge por tipo de respuesta ───────────────────────────────────────────────
function TipoBadge({ tipo, confianza }: { tipo: TipoRespuesta; confianza?: Confianza }) {
  if (tipo === 'pendiente') return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 20, background: '#FEF3C7', color: '#D97706',
      border: '1px solid #FDE68A', marginTop: 6,
    }}>
      <AlertCircle size={10} /> En investigación — recibirás respuesta a la brevedad
    </span>
  )
  if (tipo === 'requiere_busqueda_web') return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 20, background: '#EDE9FE', color: '#7C3AED',
      border: '1px solid #DDD6FE', marginTop: 6,
    }}>
      <Search size={10} /> Requiere autorización — josel@callpicker.com fue notificado
    </span>
  )
  if (confianza === 'baja') return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 20, background: '#F1F5F9', color: '#64748B',
      border: '1px solid #E2E8F0', marginTop: 6,
    }}>
      Información aproximada — validar con el equipo
    </span>
  )
  return null
}

// ── Panel de bitácora ─────────────────────────────────────────────────────────
function BitacoraPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries,  setEntries]  = useState<BitacoraEntry[]>([])
  const [loading,  setLoading]  = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/chat/bitacora')
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  const tipoColor = (t: TipoRespuesta) =>
    t === 'pendiente'            ? '#D97706' :
    t === 'requiere_busqueda_web'? '#7C3AED' : '#16A34A'

  const tipoLabel = (t: TipoRespuesta) =>
    t === 'pendiente'            ? 'Pendiente' :
    t === 'requiere_busqueda_web'? 'Web auth'  : 'Respondida'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: 540, height: '100%',
          background: '#FFFFFF', overflowY: 'auto',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFF', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <BookOpen size={18} style={{ color: '#1D4ED8' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>
              Bitácora del día
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20 }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '16px 20px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 13 }}>
              <Loader2 size={14} className="animate-spin" /> Cargando bitácora…
            </div>
          )}
          {!loading && entries.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 40 }}>
              Sin consultas registradas hoy
            </div>
          )}
          {!loading && entries.map((e, i) => (
            <div key={e.id} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 10,
              background: i % 2 === 0 ? '#F8FAFF' : '#FFFFFF',
            }}>
              <div
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px',
                      borderRadius: 20, background: tipoColor(e.tipo) + '18',
                      color: tipoColor(e.tipo),
                    }}>{tipoLabel(e.tipo)}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      {new Date(e.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {e.usuario_nombre && (
                      <span style={{ fontSize: 11, color: '#64748B' }}>— {e.usuario_nombre}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#1E3A5F', fontWeight: 600, lineHeight: 1.4 }}>
                    {e.pregunta.slice(0, 120)}{e.pregunta.length > 120 ? '…' : ''}
                  </div>
                </div>
                {expanded === e.id ? <ChevronUp size={14} style={{ color: '#94A3B8', flexShrink: 0, marginTop: 2 }} /> : <ChevronDown size={14} style={{ color: '#94A3B8', flexShrink: 0, marginTop: 2 }} />}
              </div>

              {expanded === e.id && (
                <div style={{ padding: '0 14px 12px', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {e.respuesta}
                  </div>
                  {e.modulos_contexto?.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {e.modulos_contexto.map(m => (
                        <span key={m} style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 20,
                          background: '#DBEAFE', color: '#1D4ED8',
                        }}>{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ChatPage() {
  const [msgs,         setMsgs]         = useState<Msg[]>([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [bitacoraOpen, setBitacoraOpen] = useState(false)
  const [totalHoy,     setTotalHoy]     = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // Cargar contador del día al montar
  useEffect(() => {
    fetch('/api/chat/bitacora')
      .then(r => r.json())
      .then(d => setTotalHoy((d.entries ?? []).length))
      .catch(() => {})
  }, [])

  const send = useCallback(async (text?: string) => {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput('')
    const newMsgs: Msg[] = [...msgs, { role: 'user', content }]
    setMsgs(newMsgs)
    setLoading(true)
    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      setMsgs(prev => [
        ...prev,
        {
          role:      'assistant',
          content:   data.reply ?? data.error ?? 'Error al procesar la respuesta',
          tipo:      data.tipo ?? 'normal',
          confianza: data.confianza ?? 'alta',
        },
      ])
      setTotalHoy(prev => (prev ?? 0) + 1)
    } catch {
      setMsgs(prev => [
        ...prev,
        { role: 'assistant', content: 'Error de conexión — intenta de nuevo', tipo: 'normal', confianza: 'alta' },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, msgs])

  return (
    <div className="h-screen flex flex-col">
      <PageHeader
        title="Atlas IA — Customer Success"
        subtitle="Análisis inteligente · Retención · Upsell"
      />

      {/* Barra de acciones */}
      <div style={{
        padding: '8px 24px', borderBottom: '1px solid #BFDBFE',
        background: '#F8FAFF', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 12, color: '#64748B' }}>
          Contexto: Cuentas · Tickets · Auditoría · Activaciones · Seguimientos · Base de Conocimiento · Reuniones
        </div>
        <button
          onClick={() => setBitacoraOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20, border: '1px solid #BFDBFE',
            background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Clock size={12} />
          Bitácora del día
          {totalHoy !== null && totalHoy > 0 && (
            <span style={{
              background: '#1D4ED8', color: '#FFF',
              borderRadius: 20, padding: '0 6px', fontSize: 10, fontWeight: 800,
              minWidth: 18, textAlign: 'center',
            }}>{totalHoy}</span>
          )}
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4" style={{ paddingTop: 16 }}>
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cp/15 flex items-center justify-center mb-4 shadow-glow-cp">
              <Sparkles size={28} className="text-cp" />
            </div>
            <h2 className="text-lg font-bold text-textHi mb-1">Atlas IA — Customer Success</h2>
            <p className="text-sm text-textMid mb-2 max-w-md">
              Asistente inteligente con acceso a <strong>todos los módulos</strong> del dashboard:
              cuentas, tickets, auditorías, activaciones, seguimientos, reuniones y base de conocimiento.
            </p>
            <p className="text-xs text-textLow mb-8 max-w-sm">
              Cada consulta queda registrada en la bitácora del día. Si no tengo la información,
              lo registro para investigarlo — nunca invento datos.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-xl w-full">
              {SUGERENCIAS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left p-3 rounded-xl border border-border bg-surface hover:bg-surfaceAlt hover:border-cp/40 transition-all text-xs text-textMid">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
              ${m.role === 'assistant' ? 'bg-cp/15 text-cp' : 'bg-cpTeal/15 text-cpTeal'}`}>
              {m.role === 'assistant' ? <Bot size={15} /> : <User size={15} />}
            </div>
            <div className={`max-w-[78%] rounded-2xl p-3.5 text-sm
              ${m.role === 'assistant'
                ? 'bg-surface border border-border text-textHi rounded-tl-sm'
                : 'bg-cp text-white rounded-tr-sm'}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.role === 'assistant' && (
                <TipoBadge tipo={m.tipo ?? 'normal'} confianza={m.confianza} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cp/15 flex items-center justify-center text-cp">
              <Bot size={15} />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-cp" />
              <span className="text-xs text-textMid">Consultando módulos del dashboard…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6">
        <div className="flex gap-2 items-end bg-surface border border-border rounded-2xl p-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Pregunta sobre cuentas, tickets, activaciones, auditorías, scripts de contacto…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-textHi placeholder:text-textLow resize-none outline-none px-2 py-1 max-h-32"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-cp flex items-center justify-center text-white disabled:opacity-40 transition-opacity flex-shrink-0">
            <Send size={15} />
          </button>
        </div>
        <p className="text-center text-[10px] text-textLow mt-2">
          Atlas IA · Si no tengo la información, la registro y te respondo — nunca invento datos
        </p>
      </div>

      <BitacoraPanel open={bitacoraOpen} onClose={() => setBitacoraOpen(false)} />
    </div>
  )
}
