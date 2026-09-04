/**
 * Fondo tecnológico del Dashboard — malla de líneas, nodos y destellos.
 *
 * Sustituye a la aurora de manchas difusas. Aquí el movimiento sí se percibe:
 * los destellos recorren las líneas en 7 a 13 segundos y los nodos laten entre
 * 3 y 5, no los 44 a 68 de la versión anterior.
 *
 * Es SVG estático con animación CSS: cero JavaScript, cero canvas y cero bucle
 * de repintado por cuadro. La malla se dibuja una vez; lo único que cambia es
 * el `stroke-dashoffset` de seis destellos y la opacidad de los nodos.
 *
 * La franja del encabezado va enmascarada, igual que antes: ahí vive el único
 * texto apoyado sobre el fondo claro y no debe cruzarlo ninguna línea.
 */

/* Malla irregular a propósito. Una retícula perfecta se lee como papel
 * cuadriculado; con los nodos desalineados parece un diagrama de red. */
const N: Array<[number, number]> = [
  [90, 150], [300, 80], [520, 195], [760, 110], [980, 205], [1180, 95], [1365, 215],
  [150, 425], [390, 360], [640, 470], [880, 385], [1120, 480], [1335, 400],
  [80, 700], [330, 780], [580, 690], [820, 790], [1060, 700], [1290, 780],
]

/* Aristas entre vecinos. Se listan a mano para que ninguna cruce media
 * pantalla: la malla debe sugerir estructura, no telaraña. */
const E: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
  [0, 7], [1, 8], [2, 8], [2, 9], [3, 10], [4, 10], [4, 11], [5, 11], [6, 12],
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 12],
  [7, 13], [8, 14], [9, 15], [9, 16], [10, 16], [11, 17], [11, 18], [12, 18],
  [13, 14], [14, 15], [15, 16], [16, 17], [17, 18],
]

/* Las aristas que llevan destello. Solo seis: son lo único que repinta por
 * cuadro, y con más la malla se vuelve ruidosa. */
const DESTELLOS = [
  { e: 3,  dur: 9,   delay: 0 },
  { e: 12, dur: 11,  delay: 1.6 },
  { e: 17, dur: 7.5, delay: 3.1 },
  { e: 24, dur: 12,  delay: 0.8 },
  { e: 29, dur: 8.5, delay: 4.2 },
  { e: 31, dur: 10,  delay: 2.4 },
]

export default function FondoTecnologico() {
  return (
    <div className="cp-malla" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        {/* Líneas base */}
        <g className="cp-malla-lineas">
          {E.map(([a, b], i) => (
            <line key={i} x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]} />
          ))}
        </g>

        {/* Destellos: un segmento corto que viaja por la arista */}
        <g className="cp-malla-destellos">
          {DESTELLOS.map(({ e, dur, delay }) => {
            const [a, b] = E[e]
            return (
              <line
                key={e}
                x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]}
                style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
              />
            )
          })}
        </g>

        {/* Nodos */}
        <g className="cp-malla-nodos">
          {N.map(([x, y], i) => (
            <circle
              key={i} cx={x} cy={y} r={i % 4 === 0 ? 3.2 : 2.2}
              style={{ animationDuration: `${3 + (i % 5) * 0.5}s`, animationDelay: `${(i % 7) * 0.4}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
