'use client'
import type { EstadoSenal } from './AtlasSignal'

/* ══════════════════════════════════════════════════════════════════════════
   LA PRESENCIA — decir en palabras lo que la línea dice en movimiento
   ══════════════════════════════════════════════════════════════════════════

   La señal comunica por ritmo, y el ritmo es ambiguo: ¿se movió porque está
   pensando o porque sí? Este chip lo dice con palabras, y lo dice para quien
   no puede ver el canvas — un lector de pantalla no lee una onda.

   Por eso lleva `aria-live="polite"`: cuando el estado cambia, se anuncia. Sin
   interrumpir lo que se esté leyendo, que para eso es «polite».

   NO DICE «ESCRIBIENDO…» NI FINGE NADA. Cada texto corresponde a algo que de
   verdad está pasando en la aplicación.
   ══════════════════════════════════════════════════════════════════════════ */

const TEXTO: Record<EstadoSenal, { label: string; color: string }> = {
  // #5E7396 daba 4.07:1 sobre el fondo, por debajo del 4.5 de AA. Este da 6.05.
  dormida:    { label: 'Sin conexión',  color: '#7C90B2' },
  disponible: { label: 'En línea',      color: '#4ADE80' },
  escuchando: { label: 'Escuchando',    color: '#7DD3FC' },
  pensando:   { label: 'Consultando',   color: '#60A5FA' },
}

export default function AtlasPresencia({ estado }: { estado: EstadoSenal }) {
  const { label, color } = TEXTO[estado]
  const vivo = estado !== 'dormida'
  return (
    <span
      aria-live="polite"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontSize: 11.5, fontWeight: 600, letterSpacing: '0.01em',
        color, background: 'transparent',
      }}
    >
      {/* El punto late solo cuando hay algo que latir. La animación se declara
          en globals.css para poder apagarla con prefers-reduced-motion. */}
      <span
        className={vivo ? 'atlas-latido' : undefined}
        style={{
          width: 7, height: 7, borderRadius: '50%',
          background: color, flexShrink: 0,
          boxShadow: vivo ? `0 0 8px ${color}` : 'none',
        }}
      />
      {label}
    </span>
  )
}
