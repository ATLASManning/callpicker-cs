'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
// `Bot`, `User` y `Sparkles` se fueron con los avatares: en esta pantalla ni
// yo ni tú llevamos icono de muñequito.
import { Send, Loader2, BookOpen, Clock, ChevronDown, ChevronUp, AlertCircle, Search } from 'lucide-react'
import { VistaPendientes, VistaReporteMensual } from '@/components/AtlasPendientes'
import PageHeader from '@/components/PageHeader'
import AtlasSignal, { type EstadoSenal } from './AtlasSignal'
import AtlasPresencia from './AtlasPresencia'
import s from './atlas.module.css'

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
/* Lo que queda aquí es lo que sigue pintándose con estilos en línea: la barra
 * de acciones y los contadores. Todo lo demás —hilo, compositor, burbujas,
 * sugerencias— vive ya en `atlas.module.css`, que es lo que garantiza que esta
 * pantalla no pueda alcanzar a ninguna otra.
 * Medidos contra el fondo base #070C16, no estimados. */
const TX_BAJO = '#7C90B2'                    //  6.05:1 — metadatos
const BORDE   = 'rgba(255,255,255,0.09)'     //  1.23:1 — solo separadores

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
  /** Cuánto tardé en contestar, en milisegundos. Medido en el navegador, que
   *  es el único reloj que tengo aquí: ni se lo pregunto a nadie ni lo invento.
   *  Se enseña porque una respuesta de doce segundos y una de uno no son la
   *  misma clase de respuesta, y quien está al teléfono lo nota. */
  msTardado?: number
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

/* ── Negritas ──────────────────────────────────────────────────────────────
 *
 * El prompt le pide al modelo que NO use markdown con asteriscos, y aun así
 * los manda. Pedirlo más fuerte no lo garantiza: un modelo generativo no es
 * determinista, y la pantalla mostraba «**Facturación:**» en crudo en cada
 * bullet — sucio, y encima delata el andamio.
 *
 * Así que se resuelve donde SÍ es determinista: al pintar. Lo que venga entre
 * dobles asteriscos se pone en negrita y los asteriscos desaparecen.
 *
 * Deliberadamente NO es un intérprete de markdown: solo negritas. Meter aquí
 * un renderizador completo abriría la puerta a que el modelo decida la
 * estructura de la pantalla, y esa decisión no es suya.
 */
const RX_NEGRITA = /\*\*([^*]+)\*\*/g

function conNegritas(texto: string): React.ReactNode {
  // `split` con grupo de captura intercala: [texto, negrita, texto, ...].
  // Nunca `RX_NEGRITA.test()` — al ser global guarda `lastIndex` entre
  // llamadas y alternaría true/false sobre la misma cadena.
  const partes = texto.split(RX_NEGRITA)
  if (partes.length === 1) return texto
  return partes.map((p, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: '#FFFFFF', fontWeight: 700 }}>{p}</strong>
      : <span key={i}>{p}</span>
  )
}

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
    const arranque = performance.now()
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
          msTardado: Math.round(performance.now() - arranque),
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
    <div className={s.pantalla}>
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
      <div className={`${s.hilo} px-6`} style={{ paddingTop: 16, paddingBottom: 8 }}>
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            {/* No hay orbe ni cara. La misma señal que vive abajo, presentada
                aquí más ancha: es la bienvenida Y es lo que va a acompañar
                toda la conversación. Una sola idea, no dos. */}
            <div style={{ width: '100%', maxWidth: 680, marginBottom: 30 }}>
              <AtlasSignal estado={estadoSenal} altura={104} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Atlas
            </h2>
            <p style={{ fontSize: 15.5, color: '#C3D2E8', marginTop: 12, maxWidth: 540, lineHeight: 1.7 }}>
              Leo todo el tablero: cuentas, tickets, auditorías, activaciones, seguimientos,
              reuniones y la base de conocimiento.
            </p>
            {/* Esto no es letra chica. Es lo más importante que puedo decir de
                mí, así que va en el centro y no al pie en gris. */}
            <p className={s.honestidad} style={{ marginTop: 18 }}>
              Si no tengo el dato, lo registro y te lo digo.{' '}
              <strong style={{ color: '#FFFFFF' }}>Nunca lo invento.</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl w-full" style={{ marginTop: 34 }}>
              {SUGERENCIAS.map(pregunta => (
                /* El hover vive en el CSS (`.sugerencia:hover`), no en tres
                   manejadores de ratón: así también responde al foco de
                   teclado y se apaga con «reducir movimiento». */
                <button key={pregunta} onClick={() => send(pregunta)} className={s.sugerencia}>
                  {pregunta}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-7">
          {msgs.map((m, i) => (
            m.role === 'user' ? (
              /* Tú SÍ eres una burbuja: eres alguien que habla desde un sitio. */
              <div key={i} className={`flex justify-end ${s.entra}`}>
                <div className={s.tuyo}>{m.content}</div>
              </div>
            ) : (
              /* Yo NO. No llevo avatar ni burbuja: soy el filo luminoso del que
                 sale el texto. No tengo cara que poner, y ponerle una a esto
                 sería la primera mentira de la conversación. */
              /* EL FILO LLEVA LA CONFIANZA. Verla de un vistazo es más
                 rápido que leer la etiqueta de abajo, y el color no sustituye
                 a esa etiqueta: la acompaña, porque el color solo nunca debe
                 ser el único portador de un significado. */
              <div key={i} className={[
                s.entra, s.mio,
                m.confianza === 'baja' ? s.mioBaja
                  : m.confianza === 'media' ? s.mioMedia : s.mioAlta,
              ].join(' ')}>
                <p className={s.texto}>{conNegritas(m.content)}</p>
                <TipoBadge tipo={m.tipo ?? 'normal'} confianza={m.confianza} />
                {(m.msTardado !== undefined || (m.confianza && m.confianza !== 'alta')) && (
                  <p className={s.meta}>
                    {m.msTardado !== undefined && (m.msTardado < 1000
                      ? `respondido en ${m.msTardado} ms`
                      : `respondido en ${(m.msTardado / 1000).toFixed(1)} s`)}
                    {/* El filo ámbar se explica aquí con palabras. Un color no
                        puede ser el único portador de un significado: quien no
                        distingue esos dos azules se quedaría sin el aviso. */}
                    {m.confianza === 'media' && ' · confianza media, conviene verificarlo'}
                    {m.confianza === 'baja'  && ' · confianza baja'}
                  </p>
                )}
              </div>
            )
          ))}

          {loading && (
            <div className={s.entra} style={{
              maxWidth: '86%', paddingLeft: 16,
              borderLeft: '2px solid rgba(125,211,252,0.45)',
              display: 'flex', alignItems: 'center', gap: 9,
            }}>
              <Loader2 size={15} className="animate-spin" style={{ color: '#7DD3FC' }} />
              <span style={{ fontSize: 14.5, color: '#C3D2E8' }}>
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
      {/* PEGADO ABAJO. Esto es lo que sustituye al `h-screen` que rompió la
          geometría: ya no hay altura que calcular ni regla global que mire al
          padre. Pase lo que pase por encima —el aviso de contraseña por vencer,
          por ejemplo— el campo de texto nunca se sale de la vista. */}
      <div className={s.compositor}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {msgs.length > 0 && (
            <div style={{ marginBottom: 2 }}>
              <AtlasSignal estado={estadoSenal} altura={60} />
            </div>
          )}

          {/* El realce del foco lo hace `:focus-within` en el CSS, no un
              estado de React: menos código y funciona aunque el foco entre por
              un camino que un `onFocus` no vea. */}
          <div className={s.caja}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Pregunta sobre cuentas, tickets, activaciones, auditorías, scripts de contacto…"
              rows={1}
              className={s.campo}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Enviar pregunta"
              className={s.enviar}
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
