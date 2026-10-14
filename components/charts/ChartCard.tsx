'use client'
/**
 * La tarjeta en la que vive cada gráfica del Dashboard.
 *
 * Encabezado con título, subtítulo, ayuda y menú de acciones; modo foco a
 * pantalla completa; estados de carga, vacío y error; y los atajos F / Esc / R.
 *
 * ── POR QUÉ USA `cp-card` ─────────────────────────────────────────────────
 * `globals.css` ya tiene toda la cascada que un fondo OSCURO necesita: fuerza
 * el texto a blanco en los descendientes y reescribe los tokens de superficie.
 * La clase NO impone fondo, así que la tarjeta pone el suyo (navy-700) y hereda
 * el resto. Montar un tema oscuro paralelo sería reabrir la clase de bug que
 * costó nueve rondas en este repo.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { HelpCircle, Maximize2, X, RotateCcw, Download } from 'lucide-react'
import {
  NAVY, BORDE, TX, FOCO, FUENTE, RADIO, MOTION, CIAN,
} from '@/lib/chart-theme'

interface Props {
  titulo: string
  subtitulo?: string
  /** Lo que explica el icono de ayuda. Obligatorio: una gráfica que no se
   *  puede explicar en una frase probablemente no debería estar. */
  ayuda: string
  /** Frase en lenguaje natural que resume el hallazgo. Va en naranja encima
   *  de la gráfica. `null` cuando no hay nada que destacar — NO se inventa. */
  insight?: string | null
  /** Descripción alternativa para lectores de pantalla. El encargo la pide y
   *  es lo único que hace una gráfica utilizable sin ver. */
  descripcion: string
  cargando?: boolean
  error?: string | null
  vacio?: string | null
  onReintentar?: () => void
  onReestablecer?: () => void
  onExportar?: () => void
  children: React.ReactNode
}

export default function ChartCard({
  titulo, subtitulo, ayuda, insight, descripcion,
  cargando, error, vacio, onReintentar, onReestablecer, onExportar, children,
}: Props) {
  const [foco, setFoco] = useState(false)
  const [verAyuda, setVerAyuda] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const idAyuda = useId()
  const idDesc = useId()

  /* ── Atajos ──────────────────────────────────────────────────────────────
     Sólo actúan cuando el foco del teclado está DENTRO de esta tarjeta. Un
     atajo global de una letra secuestra el teclado: escribir «foco» en un
     buscador abriría cuatro pantallas completas. */
  const dentro = useCallback(() => {
    const el = ref.current
    return !!el && !!document.activeElement && el.contains(document.activeElement)
  }, [])

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      // Nunca dentro de un campo de texto.
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'Escape' && foco) { setFoco(false); return }
      if (!dentro()) return
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); setFoco(v => !v) }
      if ((e.key === 'r' || e.key === 'R') && onReestablecer) { e.preventDefault(); onReestablecer() }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [foco, dentro, onReestablecer])

  /* Con la tarjeta a pantalla completa, el cuerpo no debe desplazarse detrás. */
  useEffect(() => {
    if (!foco) return
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = antes }
  }, [foco])

  const marco: React.CSSProperties = foco
    ? {
        position: 'fixed', inset: 16, zIndex: 60, overflow: 'auto',
        background: NAVY[900], borderRadius: RADIO,
        border: `1px solid ${BORDE}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }
    : {
        background: NAVY[700], borderRadius: RADIO,
        border: `1px solid ${BORDE}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }

  return (
    <section
      ref={ref}
      className="cp-card"
      style={{ ...marco, transition: `all ${MOTION.normal}ms ${MOTION.ease}` }}
      aria-label={titulo}
      tabIndex={-1}
    >
      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '16px 20px 12px', borderBottom: `1px solid ${BORDE}`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{
              fontSize: FUENTE.titulo, fontWeight: 800, color: TX.hi,
              lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0,
            }}>{titulo}</h3>
            <button
              type="button"
              onClick={() => setVerAyuda(v => !v)}
              aria-label={`Qué es «${titulo}»`}
              aria-expanded={verAyuda}
              aria-controls={idAyuda}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, borderRadius: 999, flexShrink: 0,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: verAyuda ? CIAN[500] : TX.low,
              }}
            >
              <HelpCircle size={15} />
            </button>
          </div>
          {/* EL COLOR VA EN UN <span> CON `background`, NO EN EL <p>.
              `globals.css` tiene `.cp-card p { color:#fff !important }` y un
              `!important` de hoja le gana al color en línea: el subtítulo
              saldría blanco y el insight perdería su naranja, que es
              justamente lo que lo hace visible. El selector mira la subcadena
              «background» en el atributo `style`, así que declararlo —aunque
              sea transparente— saca al span de la regla. */}
          {subtitulo && (
            <p style={{ marginTop: 4 }}>
              <span style={{ background: 'transparent', color: TX.low,
                             fontSize: FUENTE.subtitulo }}>{subtitulo}</span>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {onReestablecer && (
            <BotonAccion etiqueta="Restablecer (R)" onClick={onReestablecer}>
              <RotateCcw size={15} />
            </BotonAccion>
          )}
          {onExportar && (
            <BotonAccion etiqueta="Exportar CSV" onClick={onExportar}>
              <Download size={15} />
            </BotonAccion>
          )}
          <BotonAccion
            etiqueta={foco ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa (F)'}
            onClick={() => setFoco(v => !v)}
          >
            {foco ? <X size={15} /> : <Maximize2 size={15} />}
          </BotonAccion>
        </div>
      </header>

      {verAyuda && (
        <p id={idAyuda} style={{
          margin: 0, padding: '10px 20px', fontSize: FUENTE.cuerpo,
          color: TX.mid, background: 'rgba(255,255,255,0.04)',
          borderBottom: `1px solid ${BORDE}`, lineHeight: 1.6,
        }}>{ayuda}</p>
      )}

      {/* El hallazgo, en una frase. Sólo si lo hay: una frase inventada para
          rellenar el hueco es peor que el hueco. */}
      {insight && !cargando && !error && (
        <p style={{
          margin: 0, padding: '10px 20px', lineHeight: 1.55,
          borderBottom: `1px solid ${BORDE}`,
        }}>
          <span style={{ background: 'transparent', color: CIAN[400],
                         fontSize: FUENTE.cuerpo, fontWeight: 650 }}>{insight}</span>
        </p>
      )}

      {/* ── Cuerpo ────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 20px' }}>
        <p id={idDesc} className="sr-only">{descripcion}</p>
        {cargando ? <Esqueleto />
          : error ? <Error texto={error} onReintentar={onReintentar} />
          : vacio ? <Vacio texto={vacio} />
          : <div aria-describedby={idDesc}>{children}</div>}
      </div>
    </section>
  )
}

function BotonAccion({ etiqueta, onClick, children }: {
  etiqueta: string; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={etiqueta}
      aria-label={etiqueta}
      className="dash-foco"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 8,
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDE}`,
        color: TX.low, cursor: 'pointer',
        transition: `color ${MOTION.rapido}ms, background ${MOTION.rapido}ms`,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = CIAN[400] }}
      onMouseLeave={e => { e.currentTarget.style.color = TX.low }}
    >{children}</button>
  )
}

/* ── Estados ──────────────────────────────────────────────────────────────
   Esqueletos y no ruedas giratorias: una rueda no dice cuánto falta ni qué
   forma va a tener lo que llega, así que la pantalla «salta» al cargar. */
function Esqueleto() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando la gráfica…</span>
      {[82, 64, 71, 48, 55, 38].map((w, i) => (
        <div key={i} style={{
          height: 20, width: `${w}%`, borderRadius: 6, marginBottom: 12,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, '
            + 'rgba(255,255,255,0.10) 37%, rgba(255,255,255,0.05) 63%)',
          backgroundSize: '400% 100%',
          animation: 'dash-brillo 1.4s ease-in-out infinite',
          animationDelay: `${i * 90}ms`,
        }} />
      ))}
    </div>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <p style={{ padding: '28px 0', textAlign: 'center', lineHeight: 1.65 }}>
      <span style={{ background: 'transparent', color: TX.low,
                     fontSize: FUENTE.cuerpo }}>{texto}</span>
    </p>
  )
}

function Error({ texto, onReintentar }: { texto: string; onReintentar?: () => void }) {
  return (
    <div role="alert" style={{ padding: '20px 0', textAlign: 'center' }}>
      <p style={{ lineHeight: 1.6 }}>
        <span style={{ background: 'transparent', color: CIAN[400],
                       fontSize: FUENTE.cuerpo }}>{texto}</span>
      </p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="dash-foco"
          style={{
            marginTop: 12, padding: '7px 16px', borderRadius: 8,
            fontSize: FUENTE.cuerpo, fontWeight: 700,
            background: CIAN[500], color: NAVY[900],
            border: 'none', cursor: 'pointer',
          }}
        >Reintentar</button>
      )}
    </div>
  )
}

export { FOCO }
