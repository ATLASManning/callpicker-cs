/**
 * Fondo del tablero — LA SECUENCIA, la misma que Atlas lleva en su señal.
 *
 * Dirección señaló la tira de barras de `/chat` y pidió exactamente eso para
 * el fondo, «pero dale vida». Así que es la misma figura —una secuencia de voz
 * centrada, barras verticales de puntas redondas sobre un eje tenue— y lo que
 * cambia es que aquí NUNCA se detiene.
 *
 * ── POR QUÉ NO SE COPIÓ EL CANVAS DE `AtlasSignal` ────────────────────────
 * Aquel es un `requestAnimationFrame` que repinta 60 veces por segundo, y está
 * bien PORQUE vive en una sola pantalla y porque sus barras significan algo:
 * suben cuando escribes, se aceleran cuando hay una consulta corriendo. Esto
 * es el fondo de TODAS las pantallas y se queda abierto toda la jornada. Un
 * bucle de repintado permanente detrás de cada vista es batería gastada en un
 * adorno.
 *
 * Aquí la vida la dan animaciones CSS sobre `transform`, que el compositor
 * resuelve sin tocar el layout ni repintar: cero JavaScript y cero canvas,
 * igual que la malla a la que esto sustituye.
 *
 * ── CÓMO SE CONSIGUE QUE LA ONDA VIAJE ────────────────────────────────────
 * Todas las barras comparten UNA animación; lo que las desfasa es su
 * `animation-delay`, proporcional a su posición. Eso es lo que convierte N
 * latidos independientes en una onda que recorre la pantalla. Sin el desfase
 * la tira entera subiría y bajaría a coro, que se lee como un parpadeo.
 *
 * ── LAS TRES COSAS QUE SE HEREDAN DE LA SEÑAL DE ATLAS ────────────────────
 *   1. ENVOLVENTE: las barras nacen y mueren bajas en los bordes. Sin ella
 *      parece un trozo recortado de algo más grande.
 *   2. TRES ARMÓNICOS y no uno: una sinusoide pura se lee como máquina. El
 *      tercero es rápido y de poca altura — es el titileo.
 *   3. SUELO: ninguna barra llega a cero. Un hueco en mitad de la secuencia
 *      parece un fallo, no reposo.
 */

/** Cuántas barras. 96 sobre un lienzo de 1440 da un paso de 15 — el mismo aire
 *  que la señal de Atlas (3 de barra y 4 de hueco) escalado al fondo. Más
 *  barras es más nodos animados sin que el ojo gane nada. */
const N = 96
const ANCHO = 1440
const ALTO = 900
const CENTRO = ALTO / 2
const PASO = ANCHO / N
const GROSOR = 4.5
const MAX = 150            // altura máxima de media barra, hacia cada lado

/** La altura de reposo de cada barra. Determinista a propósito: con `Math.random`
 *  el servidor y el navegador dibujarían tiras distintas y React tiraría el HTML
 *  del servidor entero. Ver [[recharts-nunca-en-servidor]]. */
function alturaDe(i: number): number {
  const u = N > 1 ? i / (N - 1) : 0.5
  const env = Math.pow(Math.sin(Math.PI * u), 0.82)
  const onda =
    0.58 * Math.sin(u * 22.0) +
    0.28 * Math.sin(u * 41.0 + 1.3) +
    0.14 * Math.sin(u * 73.0 + 2.6)
  return Math.max(10, Math.abs(onda) * env * MAX)
}

export default function FondoTecnologico() {
  return (
    <div className="cp-sig" aria-hidden="true">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="xMidYMid slice">
        {/* El eje. Sostiene la secuencia cuando las barras están bajas, para
            que el reposo no se lea como pantalla apagada. */}
        <line className="cp-sig-eje" x1="0" y1={CENTRO} x2={ANCHO} y2={CENTRO} />

        <g className="cp-sig-barras">
          {Array.from({ length: N }, (_, i) => {
            const h = alturaDe(i)
            const u = i / (N - 1)
            return (
              <rect
                key={i}
                x={i * PASO + (PASO - GROSOR) / 2}
                y={CENTRO - h}
                width={GROSOR}
                height={h * 2}
                rx={GROSOR / 2}
                style={{
                  /* EL DESFASE ES LO QUE HACE QUE LA ONDA VIAJE. Se reparte
                     1.8s a lo ancho sobre un ciclo de 2.6s, así que en pantalla
                     conviven algo menos de dos crestas: suficientes para que se
                     vea avanzar, pocas para que no vibre. */
                  animationDelay: `${(u * 1.8).toFixed(3)}s`,
                  /* El centro brilla más que los extremos: la secuencia tiene
                     foco, igual que en la señal de Atlas. */
                  opacity: 0.10 + 0.16 * Math.pow(Math.sin(Math.PI * u), 0.82),
                }}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}
