'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
// `Bot`, `User` y `Sparkles` se fueron con los avatares: en esta pantalla ni
// yo ni tú llevamos icono de muñequito.
import { Send, Loader2, BookOpen, Clock, ChevronDown, ChevronUp, AlertCircle, Search } from 'lucide-react'
import { VistaPendientes, VistaReporteMensual } from '@/components/AtlasPendientes'
import PageHeader from '@/components/PageHeader'
import AtlasSignal, { type EstadoSenal } from '@/components/AtlasSignal'
import AtlasPresencia from '@/components/AtlasPresencia'

/* ── La paleta de la pantalla oscura ──────────────────────────────────────
 *
 * Va aquí y no en Tailwind a propósito: los tokens `text-textHi`,
 * `bg-surface` y compañía están calculados para PÁGINA CLARA —son grises que
 * contrastan contra blanco— y sobre este fondo casi negro se pierden. Usarlos
 * aquí habría sido heredar el contraste de otra pantalla.
 *
 * Los tres tonos están MEDIDOS contra el fondo base #070C16, no estimados: la
 * primera vez escribí 16.1 / 8.4 / 5.2 de memoria y los tres estaban mal.
 * Todos pasan el 4.5:1 de AA para texto normal. */
const TX_ALTO  = '#E8F0FF'   // 17.09:1 — el texto que se lee
const TX_MEDIO = '#A9BBD8'   // 10.05:1 — lo secundario, aún cómodo
const TX_BAJO  = '#7C90B2'   //  6.05:1 — metadatos; sigue pasando AA
const BORDE    = 'rgba(255,255,255,0.09)'   // 1.23:1 — solo separadores decorativos
/* Los CONTROLES necesitan borde propio. A 0.09 el campo de texto y los seis
 * botones de sugerencia flotaban sin contorno: se adivinaban por dónde caía el
 * texto, no por su forma. A 0.34 llega a 3:1, el mínimo de WCAG para un objeto
 * gráfico, y sigue leyéndose sutil. */
const BORDE_CONTROL = 'rgba(255,255,255,0.34)'

/* El degradado de la burbuja de quien pregunta. Empezó en #1E5BD8 → #3884FF y
 * el extremo claro daba 3.55:1 con el blanco encima: por debajo de AA justo en
 * la mitad derecha del globo. Este par aguanta en TODO su recorrido (6.98:1 y
 * 5.17:1) — un degradado hay que medirlo en los dos extremos, no en uno. */
const AZUL_TU = 'linear-gradient(135deg, #1B4FC9, #2563EB)'

type TipoRespuesta = 'normal' | 'pendiente' | 'requiere_busqueda_web'

/** Las tres caras del book de preguntas. */
type VistaPanel = 'dia' | 'pendientes' | 'mensual'
const VISTAS_PANEL: Array<{ id: VistaPanel; label: string; sub: string }> = [
  { id: 'dia',        label: 'Bitácora del día',   sub: 'Lo que se preguntó hoy' },
  { id: 'pendientes', label: 'Pendientes',         sub: 'Preguntas sin contestar' },
  { id: 'mensual',    label: 'Reporte mensual',    sub: 'El mes visto de lejos' },
]
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
/* Los tres avisos que puedo dar sobre mi propia respuesta. Van INVERTIDOS
 * respecto al resto del tablero: allí el badge es un relleno pastel con texto
 * oscuro, y aquí el fondo es casi negro, así que el color vivo lo lleva el
 * TEXTO y el relleno es una veladura del mismo tono. Los tres pasan 4.5:1.
 *
 * Y no son letra chica: son la parte honesta de la conversación. Si algo lo sé
 * a medias, el sitio para decirlo es debajo de haberlo dicho. */
const AVISO_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  fontSize: 10.5, fontWeight: 700, padding: '3px 10px',
  borderRadius: 20, marginTop: 9, lineHeight: 1.5,
}

function TipoBadge({ tipo, confianza }: { tipo: TipoRespuesta; confianza?: Confianza }) {
  if (tipo === 'pendiente') return (
    <span style={{
      ...AVISO_BASE, background: 'rgba(217,119,6,0.14)', color: '#FCD34D',
      border: '1px solid rgba(252,211,77,0.32)',
    }}>
      <AlertCircle size={10} /> En investigación — recibirás respuesta a la brevedad
    </span>
  )
  if (tipo === 'requiere_busqueda_web') return (
    <span style={{
      ...AVISO_BASE, background: 'rgba(124,58,237,0.16)', color: '#C4B5FD',
      border: '1px solid rgba(196,181,253,0.30)',
    }}>
      <Search size={10} /> Requiere autorización — josel@callpicker.com fue notificado
    </span>
  )
  if (confianza === 'baja') return (
    <span style={{
      ...AVISO_BASE, background: 'rgba(255,255,255,0.05)', color: '#A9BBD8',
      border: '1px solid rgba(255,255,255,0.13)',
    }}>
      Información aproximada — validar con el equipo
    </span>
  )
  return null
}

// ── Panel de bitácora ─────────────────────────────────────────────────────────
function BitacoraPanel({ open, onClose, vistaInicial, onCambio }: {
  open: boolean; onClose: () => void
  vistaInicial: VistaPanel; onCambio?: () => void
}) {
  const [vista, setVista] = useState<VistaPanel>(vistaInicial)
  useEffect(() => { if (open) setVista(vistaInicial) }, [open, vistaInicial])
  const [entries,  setEntries]  = useState<BitacoraEntry[]>([])
  const [loading,  setLoading]  = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!open || vista !== 'dia') return
    setLoading(true)
    fetch('/api/chat/bitacora')
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [open, vista])

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
      {/* `cp-light`: este cajón es BLANCO y cuelga de la pantalla oscura, así
          que heredaba su barra de scroll —pista al 4% de blanco SOBRE blanco—
          y quedaba invisible. La clase de escape le devuelve la suya. */}
      <div
        className="cp-light"
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
          <BookOpen size={18} style={{ color: '#1D4ED8', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>
              Book de preguntas
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {VISTAS_PANEL.find(v => v.id === vista)?.sub ??
                new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20 }}>✕</button>
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 20px 0', borderBottom: '1px solid #E2E8F0' }}>
          {VISTAS_PANEL.map(v => {
            const activa = vista === v.id
            return (
              <button key={v.id} onClick={() => setVista(v.id)} style={{
                padding: '7px 13px', fontSize: 12.5, fontWeight: activa ? 800 : 600,
                color: activa ? '#1D4ED8' : '#64748b', background: 'none',
                border: 'none', borderBottom: `2px solid ${activa ? '#1D4ED8' : 'transparent'}`,
                cursor: 'pointer', marginBottom: -1,
              }}>
                {v.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '16px 20px' }}>
          {vista === 'pendientes' && <VistaPendientes onCambio={onCambio} />}
          {vista === 'mensual'    && <VistaReporteMensual />}

          {vista === 'dia' && loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
              <Loader2 size={14} className="animate-spin" /> Cargando bitácora…
            </div>
          )}
          {vista === 'dia' && !loading && entries.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 40 }}>
              Sin consultas registradas hoy
            </div>
          )}
          {vista === 'dia' && !loading && entries.map((e, i) => (
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
                      <span style={{ fontSize: 11, color: '#64748b' }}>— {e.usuario_nombre}</span>
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
  const [vistaPanel,   setVistaPanel]   = useState<VistaPanel>('dia')
  const [pendientes,   setPendientes]   = useState<number | null>(null)
  /** ¿El campo de texto tiene el cursor? No es lo mismo que «hay texto»: quien
   *  llega con Tab necesita ver que ya está ahí ANTES de escribir nada. */
  const [enfocado,     setEnfocado]     = useState(false)
  /** ¿Falló la última llamada? Mientras esto sea true, la presencia dice la
   *  verdad: «Sin conexión», y no «En línea» con un error en pantalla. */
  const [caido,        setCaido]        = useState(false)

  // El contador de pendientes vive en la cabecera porque es lo que no debe
  // quedarse esperando: una pregunta sin contestar es alguien sin respuesta.
  const cargarPendientes = useCallback(() => {
    fetch('/api/chat/pendientes')
      .then(r => r.json())
      .then(d => setPendientes(d.abiertos ?? 0))
      .catch(() => setPendientes(null))
  }, [])
  useEffect(() => { cargarPendientes() }, [cargarPendientes])
  const [totalHoy,     setTotalHoy]     = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  /* ── El estado de la señal ───────────────────────────────────────────────
   *
   * Cada estado corresponde a algo que DE VERDAD está pasando, no a un
   * temporizador que finge actividad:
   *   pensando    hay una petición corriendo contra /api/chat
   *   escuchando  hay texto en el campo — te está siguiendo mientras escribes
   *   disponible  nada en curso: está, y no pasa nada
   * Si la línea se acelera es porque hay una consulta. Una animación que late
   * igual pase lo que pase enseña a no mirarla. */
  const escribiendo = input.trim().length > 0
  /* `caido` va PRIMERO en la cadena. El chip decía «En línea» con el punto
     latiendo mientras el propio chat imprimía «Error de conexión» dos
     centímetros más abajo — exactamente lo que la señal promete no hacer. Si
     digo que no finjo, no puedo fingir que estoy. */
  const estadoSenal: EstadoSenal = caido ? 'dormida'
    : loading ? 'pensando'
    : escribiendo ? 'escuchando'
    : 'disponible'

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
      setCaido(false)
    } catch {
      setMsgs(prev => [
        ...prev,
        { role: 'assistant', content: 'Error de conexión — intenta de nuevo', tipo: 'normal', confianza: 'alta' },
      ])
      setCaido(true)
    } finally {
      setLoading(false)
    }
  }, [input, loading, msgs])

  return (
    <div className="flex flex-col atlas-fondo" style={{ flex: 1, minHeight: 0 }}>
      <PageHeader
        dark
        title="Atlas IA — Customer Success"
        subtitle="Análisis inteligente · Retención · Upsell"
        actions={<AtlasPresencia estado={estadoSenal} />}
      />

      {/* Barra de acciones */}
      <div style={{
        padding: '8px 24px', borderBottom: `1px solid ${BORDE}`,
        background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ fontSize: 12, color: TX_BAJO }}>
          Contexto: Cuentas · Tickets · Auditoría · Activaciones · Seguimientos · Base de Conocimiento · Reuniones
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => { setVistaPanel('dia'); setBitacoraOpen(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              border: '1px solid rgba(125,211,252,0.28)',
              background: 'rgba(56,132,255,0.12)', color: '#9EC5FF',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Clock size={12} />
            Bitácora del día
            {totalHoy !== null && totalHoy > 0 && (
              <span style={{
                // #3884FF daba 3.55:1 con el blanco encima; este da 4.52:1.
                background: '#126DFF', color: '#FFF',
                borderRadius: 20, padding: '0 6px', fontSize: 10, fontWeight: 800,
                minWidth: 18, textAlign: 'center',
              }}>{totalHoy}</span>
            )}
          </button>

          {/* Separado y en ámbar a proposito: lo que no se pudo contestar no
              debe leerse como una entrada más del registro del día. En oscuro
              el ámbar sube a #FCD34D, que sobre este fondo sí se lee. */}
          <button
            onClick={() => { setVistaPanel('pendientes'); setBitacoraOpen(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              border: `1px solid ${pendientes ? 'rgba(252,211,77,0.38)' : BORDE}`,
              background: pendientes ? 'rgba(217,119,6,0.14)' : 'rgba(255,255,255,0.03)',
              color: pendientes ? '#FCD34D' : TX_BAJO,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <AlertCircle size={12} />
            Pendientes de contestar
            {pendientes !== null && pendientes > 0 && (
              <span style={{
                /* Invertido, no oscurecido: bajar el ambar hasta que aguante
                   blanco lo vuelve cafe y deja de leerse como aviso. Asi usa
                   el mismo idioma que los avisos de la respuesta, y da 11.7:1. */
                background: 'rgba(217,119,6,0.22)', color: '#FCD34D',
                borderRadius: 20, padding: '0 6px', fontSize: 10, fontWeight: 800,
                minWidth: 18, textAlign: 'center',
              }}>{pendientes}</span>
            )}
          </button>
        </div>
      </div>

      {/* Conversación */}
      <div className="flex-1 overflow-y-auto px-6 pb-4" style={{ paddingTop: 16 }}>
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            {/* No hay orbe ni cara. La misma señal que vive abajo, presentada
                aquí más ancha: es la bienvenida Y es lo que va a acompañar
                toda la conversación. Una sola idea, no dos. */}
            <div style={{ width: '100%', maxWidth: 560, marginBottom: 26 }}>
              <AtlasSignal estado={estadoSenal} altura={74} />
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: TX_ALTO, letterSpacing: '-0.01em' }}>
              Atlas
            </h2>
            <p style={{ fontSize: 13.5, color: TX_MEDIO, marginTop: 8, maxWidth: 470, lineHeight: 1.65 }}>
              Leo todo el tablero: cuentas, tickets, auditorías, activaciones, seguimientos,
              reuniones y la base de conocimiento.
            </p>
            {/* Esto no es letra chica. Es lo más importante que puedo decir de
                mí, así que va en el centro y no al pie en gris. */}
            <p style={{
              fontSize: 12.5, color: '#9EC5FF', marginTop: 14, maxWidth: 440,
              lineHeight: 1.65, padding: '10px 16px', borderRadius: 10,
              background: 'rgba(56,132,255,0.08)',
              border: '1px solid rgba(125,211,252,0.18)',
            }}>
              Si no tengo el dato, lo registro y te lo digo. <strong style={{ color: '#CFE4FF' }}>Nunca
              lo invento.</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full" style={{ marginTop: 28 }}>
              {SUGERENCIAS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 12,
                    border: `1px solid ${BORDE_CONTROL}`, background: 'rgba(255,255,255,0.03)',
                    color: TX_MEDIO, fontSize: 12.5, lineHeight: 1.5, cursor: 'pointer',
                    transition: 'border-color 160ms, background 160ms, color 160ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(125,211,252,0.42)'
                    e.currentTarget.style.background = 'rgba(56,132,255,0.10)'
                    e.currentTarget.style.color = TX_ALTO
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = BORDE_CONTROL
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.color = TX_MEDIO
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5">
          {msgs.map((m, i) => (
            m.role === 'user' ? (
              /* Tú SÍ eres una burbuja: eres alguien que habla desde un sitio. */
              <div key={i} className="flex justify-end atlas-entra">
                <div style={{
                  maxWidth: '76%', borderRadius: '16px 16px 4px 16px',
                  padding: '11px 15px', fontSize: 13.5, lineHeight: 1.65,
                  background: AZUL_TU,
                  color: '#FFFFFF',
                  boxShadow: '0 6px 22px rgba(56,132,255,0.22)',
                }}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ) : (
              /* Yo NO. No llevo avatar ni burbuja: soy el filo luminoso del que
                 sale el texto. No tengo cara que poner, y ponerle una a esto
                 sería la primera mentira de la conversación. */
              <div key={i} className="atlas-entra" style={{
                maxWidth: '86%', paddingLeft: 16,
                borderLeft: '2px solid rgba(125,211,252,0.45)',
              }}>
                <p style={{
                  fontSize: 13.5, lineHeight: 1.75, color: TX_ALTO,
                  whiteSpace: 'pre-wrap',
                }}>{m.content}</p>
                <TipoBadge tipo={m.tipo ?? 'normal'} confianza={m.confianza} />
              </div>
            )
          ))}

          {loading && (
            <div className="atlas-entra" style={{
              maxWidth: '86%', paddingLeft: 16,
              borderLeft: '2px solid rgba(125,211,252,0.45)',
              display: 'flex', alignItems: 'center', gap: 9,
            }}>
              <Loader2 size={13} className="animate-spin" style={{ color: '#7DD3FC' }} />
              <span style={{ fontSize: 12.5, color: TX_MEDIO }}>
                Consultando los módulos del tablero…
              </span>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* ── La señal y la entrada ─────────────────────────────────────────
          La línea va JUSTO ENCIMA del campo de texto, en el borde entre lo que
          escribes y lo que soy. No es un adorno colocado donde cupo: ése es
          literalmente el sitio que le corresponde. */}
      <div style={{ padding: '0 24px 22px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {msgs.length > 0 && (
            <div style={{ marginBottom: -6 }}>
              <AtlasSignal estado={estadoSenal} altura={44} />
            </div>
          )}

          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: 'rgba(255,255,255,0.045)',
            /* El realce responde al FOCO, no a «hay texto». Antes, quien
               llegaba con Tab no veía cambiar nada y tenía que escribir para
               descubrir dónde estaba el cursor. El borde a 0.09 daba 1.23:1
               —invisible—; enfocado sube a 0.5, que se lee. */
            border: `1px solid ${enfocado ? 'rgba(125,211,252,0.50)' : BORDE_CONTROL}`,
            borderRadius: 16, padding: 8,
            transition: 'border-color 180ms, box-shadow 180ms',
            boxShadow: enfocado ? '0 0 0 3px rgba(56,132,255,0.18)' : 'none',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              onFocus={() => setEnfocado(true)}
              onBlur={() => setEnfocado(false)}
              placeholder="Pregunta sobre cuentas, tickets, activaciones, auditorías, scripts de contacto…"
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                resize: 'none', maxHeight: 128, padding: '6px 8px',
                fontSize: 13.5, lineHeight: 1.6, color: TX_ALTO,
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Enviar pregunta"
              style={{
                width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', color: '#FFF',
                background: (loading || !input.trim())
                  ? 'rgba(255,255,255,0.08)'
                  : AZUL_TU,
                cursor: (loading || !input.trim()) ? 'default' : 'pointer',
                transition: 'background 200ms',
              }}
            >
              <Send size={15} />
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 10.5, color: TX_BAJO, marginTop: 10 }}>
            Cada consulta queda en la bitácora del día · Si no tengo el dato, lo registro y te respondo
          </p>
        </div>
      </div>

      <BitacoraPanel open={bitacoraOpen} onClose={() => setBitacoraOpen(false)}
                     vistaInicial={vistaPanel} onCambio={cargarPendientes} />
    </div>
  )
}
