'use client'
/**
 * La tarjeta en la que vive cada gráfica del Dashboard.
 *
 * Encabezado con título, subtítulo, ayuda y menú de acciones; modo foco a
 * pantalla completa; estados de carga, vacío y error; y los atajos F / Esc / R.
 *
 * ── POR QUÉ YA NO LLEVA `cp-card` (4 nov 2026) ───────────────────────────
 * La llevaba mientras la tarjeta era OSCURA: esa clase fuerza a BLANCO el
 * texto de sus descendientes, que es justo lo que un fondo marino necesita.
 *
 * Al pasar la tarjeta a BLANCA la clase se vuelve exactamente lo contrario de
 * lo que hace falta: blanco sobre blanco en el título, el subtítulo, el
 * insight y cada `<p>` de dentro — la Variante A del bug de contraste de este
 * tablero, el caso que sólo se lee seleccionando el texto. Quitarla no es
 * cosmética: es la condición para que esta tarjeta sea legible.
 * [[atlas-dashboard-contrast-architecture]]
 *
 * Y con ella se va su secuela: los `<span style={{background:'transparent'}}>`
 * que había que poner para salvar un color de la cascada ya no hacen falta.
 * Se dejan donde no estorban, pero el color ya no depende de ellos.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { HelpCircle, Maximize2, X, RotateCcw, Download } from 'lucide-react'
import {
  SUPERFICIE, BORDE, TX, FOCO, FUENTE, RADIO, MOTION, ACENTO,
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
        background: SUPERFICIE.tarjeta, borderRadius: RADIO,
        border: `1px solid ${BORDE}`,
        boxShadow: '0 32px 80px rgba(16,53,93,0.28)',
      }
    : {
        background: SUPERFICIE.tarjeta, borderRadius: RADIO,
        border: `1px solid ${BORDE}`,
        boxShadow: '0 13px 32px rgba(28,63,88,0.06)',
      }

  return (
    <section
      ref={ref}
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
                color: verAyuda ? ACENTO : TX.low,
              }}
            >
              <HelpCircle size={15} />
            </button>
          </div>
          {/* El `<span>` con `background` era el escape de la cascada de
              `.cp-card`, que ya no aplica a esta tarjeta. Se queda porque no
              estorba y porque el detector lo cuenta como seguro, pero el
              color del subtítulo ya NO depende de él. */}
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
          color: TX.mid, background: SUPERFICIE.cebra,
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
          <span style={{ background: 'transparent', color: ACENTO,
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
        background: SUPERFICIE.cebra, border: `1px solid ${BORDE}`,
        color: TX.low, cursor: 'pointer',
        transition: `color ${MOTION.rapido}ms, background ${MOTION.rapido}ms`,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = ACENTO }}
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
          /* El brillo se hace con MARINO translúcido, no con blanco: sobre
             una tarjeta blanca un `rgba(255,255,255,…)` compone blanco y el
             esqueleto se vuelve invisible — un «cargando» que no se ve se
             lee como una tarjeta vacía. */
          background: 'linear-gradient(90deg, rgba(16,53,93,0.06) 25%, '
            + 'rgba(16,53,93,0.12) 37%, rgba(16,53,93,0.06) 63%)',
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
        <span style={{ background: 'transparent', color: ACENTO,
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
            /* Relleno sólido: la letra se ELIGE midiendo, no por costumbre.
               Blanco sobre #1D6CAA mide 5.56:1. El cian vivo que había antes
               sólo admite letra oscura, y aquí la tarjeta es clara. */
            background: ACENTO, color: SUPERFICIE.tarjeta,
            border: 'none', cursor: 'pointer',
          }}
        >Reintentar</button>
      )}
    </div>
  )
}

export { FOCO }
