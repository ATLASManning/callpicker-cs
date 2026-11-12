/**
 * LA PALETA DEL «CUSTOMER SUCCESS OPERATING SYSTEM». UNA SOLA COPIA.
 *
 * Los hex salen de la FUENTE —`public/docs/Callpicker_Customer_Success_Operating_System.html`,
 * su bloque `:root`— y no de una captura. Vivían dentro de
 * `app/cuentas/contratos/page.tsx`, así que la segunda pantalla que quisiera
 * este formato tenía que copiarlos: **paletas gemelas**, que es el defecto que
 * más veces ha vuelto en este tablero. Ahora hay un archivo.
 * [[atlas-dashboard-contrast-architecture]] [[feedback-fuente-unica-cuentas]]
 *
 * Todo lo de aquí está medido en `scripts/mide-paleta-contratos.py`, que LEE
 * ESTE ARCHIVO y sale con 1 si algún par baja de su mínimo. El documento es la
 * fuente de los TONOS, no una autoridad sobre el CONTRASTE: tiene tres pares
 * que no alcanzan AA y aquí van corregidos, cada uno con su número.
 */

export const MARINO = '#10355D'   // --navy
/* `--navy2 #082742` NO se declara: es el fondo de la barra lateral del
   documento y aquí no hay barra lateral. Una constante de paleta sin uso es la
   mitad de las «paletas gemelas» que ya costaron una ronda. */
export const AZUL   = '#1D6CAA'   // --blue: el acento sobre fondo CLARO (5.56:1)
export const CIAN   = '#39ABD8'   // --cyan: el filete. Sobre blanco mide 2.63:1 y es
                                  // DECORACIÓN — subraya un título que ya va en
                                  // marino a 12.43:1. Nunca distingue nada por sí.
export const LINEA  = '#DFE8EF'   // --line
export const LAVADO = '#F5F8FB'   // --wash
export const TX_ALTO = '#202E3B'  // --ink
export const TX_MED  = '#3D4B5C'
/* `--muted #6A7889` del documento NO se adopta: mide 4.51:1 sobre blanco
   —justo— y **4.22:1 sobre la fila alterna**, que es el fondo nuevo. Se queda
   la tinta que ya tenía la página: 4.83 y 4.52. Una medición caduca cuando
   cambia el fondo, y no avisa. */
export const TX_BAJO = '#667384'
export const ROJO_TX = '#A4262C'
export const AMBAR_TX = '#8A5200'
export const PLATA  = '#A8BACB'   // sólo sobre marino (6.25:1). Sobre blanco, 1.99.
export const ZEBRA  = '#F4F8FB'   // `tbody tr:nth-child(even)` del documento
export const SOMBRA = '0 13px 32px #1C3F5810'   // la de `.document`
export const MISION = '#EFF7FC'   // el fondo de `.mission`

/* EL HERO. El documento acaba su degradado en `#247BA6`, y contra ese tono
   fallan sus PROPIOS tokens: el rótulo mide 3.57:1, el párrafo 3.72, el texto
   de las pastillas 4.10 y el cian del titular 2.95 — por debajo incluso del
   3:1 de texto grande. En el documento no salta porque su hero es enorme y la
   esquina clara queda detrás del aro decorativo; en una pantalla de trabajo el
   texto cae justo ahí. `#1F6A90` es el mismo tono oscurecido por descenso
   hasta que los CINCO pasan (ΔE 5.6: sigue siendo el mismo azul).

   **UN DEGRADADO SE MIDE POR SU EXTREMO QUE APRIETA**, que aquí es el claro.
   Medido sólo contra el oscuro da 14.03:1 y una esquina ilegible. */
/* LOS TOPES VIVEN UNA SOLA VEZ.
   El menú lateral lleva el MISMO degradado girado (instrucción de dirección,
   12 nov 2026): una columna alta necesita que el recorrido sea vertical, o el
   127° deja casi toda la barra en un solo tono. Escribir los tres topes otra
   vez en el menú sería el patrón de «paletas gemelas» — alguien corrige uno y
   el otro se queda con la medición vieja SIN QUE FALLE NADA.
   Como los topes son los mismos, **las cinco mediciones de abajo valen para
   los dos**: cambiar el ÁNGULO mueve dónde aparece cada tono, no cuáles son. */
const HERO_TOPES = '#0B2D4D,#15537F 72%,#1F6A90'

export const HERO = `linear-gradient(127deg,${HERO_TOPES})`

/* EL MENÚ LATERAL. Vertical y con el extremo claro ABAJO, donde está el
   bloque del usuario; el grueso de los apartados cae sobre la mitad oscura.
   Lo mide `scripts/mide-paleta-sidebar.py`, que lee estos topes de aquí. */
export const SIDEBAR = `linear-gradient(177deg,${HERO_TOPES})`
export const HERO_TAG  = '#B3E8FF'   // 4.51:1 sobre el extremo claro
export const HERO_CIAN = '#8AD7F8'   // 3.73:1 — titular de 44px, mínimo 3:1
export const HERO_LEAD = '#D7E7F2'   // 4.71:1
export const HERO_PILL = '#E5F1FA'   // 5.19:1
/* El borde de las pastillas del documento es blanco al 30%, que compuesto
   sobre el degradado da 1.70:1. Al 60% da 3.22:1 en el extremo claro y 5.98
   en el oscuro. Un borde translúcido NO es blanco: se compone con lo que haya
   debajo, y ahí es donde se mide. */
export const HERO_BORDE = 'rgba(255,255,255,0.60)'
