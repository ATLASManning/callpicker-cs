'use client'
import type { EstadoSenal } from './AtlasSignal'
import s from './atlas.module.css'

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

   @contraste-padre: este chip no dibuja fondo — va en el `actions` de un
   `PageHeader dark`, dentro del `.pantalla` de `atlas.module.css`.

   REMEDIDO EL 14 OCT 2026, PORQUE EL FONDO CAMBIÓ. Era el casi-negro `#070C16`
   y pasó al marino del «Customer Success Operating System». Y este chip cae
   justo donde está el barrido claro del lienzo —esquina superior derecha—, así
   que el píxel real debajo no es el marino base `#0B2D4D` sino el compuesto
   `#19587E`. Medido contra ÉSE, que es el extremo que aprieta, los cuatro
   tonos viejos se caían: `#7C90B2` a 2.37:1, `#60A5FA` a 3.02 y `#4ADE80` a
   4.40. Un degradado se mide por su punto más claro, no por el cómodo.
   ══════════════════════════════════════════════════════════════════════════ */

const TEXTO: Record<EstadoSenal, { label: string; color: string }> = {
  // Las cifras son contra `#19587E`, el píxel compuesto bajo el chip.
  dormida:    { label: 'Sin conexión',  color: '#C3D2E8' },  // 5.00:1 (era 2.37)
  disponible: { label: 'En línea',      color: '#86EFAC' },  // 5.46:1 (era 4.40)
  escuchando: { label: 'Escuchando',    color: '#A5E8FD' },  // 5.68:1 (era 4.60)
  pensando:   { label: 'Consultando',   color: '#BFD8FF' },  // 5.29:1 (era 3.02)
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
        className={vivo ? s.latido : undefined}
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
