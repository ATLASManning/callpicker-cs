/**
 * Tono de texto legible sobre fondo claro.
 *
 * ── EL PROBLEMA QUE RESUELVE ───────────────────────────────────────────────
 * Por todo el tablero hay pastillas que pintan el texto y el fondo con el
 * MISMO color —`color: X` sobre `background: X + '18'`—. Queda bonito y es
 * ilegible: un ámbar `#f59e0b` sobre su propio tinte al 14% da **1.93:1**,
 * cuando el mínimo para texto es 4.5:1. Con el amarillo `#EAB308` baja a
 * 1.75:1. Salió en el barrido del 21 sep 2026 en seis componentes distintos
 * (semáforos de churn, prioridades de tickets, chips de activaciones, Health
 * Score de seguimiento, contadores de auditoría).
 *
 * ── POR QUÉ SE CALCULA Y NO SE LISTA ───────────────────────────────────────
 * La tentación es un diccionario «ámbar → ámbar oscuro» en cada archivo. Eso
 * son seis listas que se desincronizan en cuanto alguien añade un color: la
 * pastilla nueva se vería mal y nadie lo notaría, porque no falla nada. Aquí
 * se oscurece el tono hasta que MIDE lo que tiene que medir, sea cual sea.
 *
 * El fondo se deja igual: solo se oscurece la letra. Así la pastilla conserva
 * su color —que es lo que comunica— y gana el contraste.
 */

/**
 * EL TEXTO TENUE DE LOS PANELES OSCUROS. Un solo valor, medido, compartido.
 *
 * ── EL PROBLEMA ────────────────────────────────────────────────────────────
 * El texto secundario de los paneles oscuros se pintaba con un blanco
 * translúcido escrito a mano en cada archivo: `rgba(255,255,255,0.45)` en unos
 * veinte sitios, con hermanos en 0.35, 0.38, 0.40, 0.42, 0.48 y 0.50 según
 * quién escribiera el panel. Medido el 9 oct 2026, **ninguno llegaba al 4.5:1
 * de AA** sobre su propio fondo: el 0.45 daba entre 4.31 y 4.51:1 y el 0.40
 * bajaba a 3.69. Son las etiquetas de 11px, que son las que menos perdonan.
 *
 * ── POR QUÉ UN TOKEN Y NO VEINTE CONSTANTES ────────────────────────────────
 * Veinte constantes con el mismo oficio divergen: así nacieron los siete alfas
 * distintos de arriba, y así volvería a pasar. Peor, el valor correcto NO ES
 * FIJO — depende del panel, y el panel cambió: la paleta del Customer Success
 * Operating System (13 oct 2026) pasó `.cp-card` de `#0D1829` a `#082742`, que
 * es más CLARO, y de un día para otro dejó corto todo lo que estaba calculado
 * contra el marino viejo. Con un token, re-medir es cambiar una línea.
 *
 * ── LA MEDICIÓN (16 oct 2026, `scripts/mide-texto-tenue.py`) ───────────────
 * El alfa lo fija la superficie más CLARA sobre la que de verdad cae texto
 * tenue, que no es el panel a pelo: es el panel con una caja tintada encima.
 * `rgba(255,255,255,0.08)` se usa 27 veces y aclara el fondo lo justo para
 * comerse tres décimas de ratio.
 *
 *   superficie        alfa mínimo para 4.5:1
 *   #082742 + 0.09    0.53   <- EL QUE APRIETA (.cp-card + tinte más claro)
 *   #082742 + 0.08    0.53   (.cp-card + el tinte más usado)
 *   #082742           0.48   (.cp-card a pelo)
 *   #0F2040 + 0.04    0.49   (la CAJA de ColaDeTrabajoAsesor)
 *   #0D1829 + 0.07    0.48   (Sidebar, renglón activo)
 *   #16233A / #16243D 0.47   (cabeceras y pies sticky)
 *   #0F2040           0.47   (extremo claro del degradado de AsesorCard)
 *   #0D1829           0.46   (paneles de /alertas, /analisis-llamadas, cortes)
 *   #0A1628 / #0A0F1C 0.45-0.46
 *
 * Se eligió **0.55 y no el 0.53 justo** por la misma razón por la que el 8 oct
 * se descartó el 0.47 en `ColaDeTrabajoAsesor`: el mínimo va al filo, y
 * cualquier caja tintada nueva lo tumba sin que falle nada. Con 0.55 las doce
 * superficies miden entre **4.74:1 y 6.22:1**.
 *
 * Esto es TEXTO. Las rejillas, los ejes y los trazos de las gráficas son
 * objetos gráficos: piden 3:1, no 4.5:1, y subirles el alfa los convierte en
 * protagonistas de la gráfica. No usar este token ahí.
 */
export const TX_TENUE = 'rgba(255,255,255,0.55)'

const CACHE = new Map<string, string>()

function hexARgb(h: string): [number, number, number] {
  let s = String(h ?? '').trim().replace('#', '')
  if (s.length === 3) s = s.split('').map(c => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return [15, 23, 42]   // basura -> marino
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ]
}

const rgbAHex = (c: number[]) =>
  '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase()).join('')

/** Canal sRGB linealizado, según la fórmula de WCAG. */
function canal(c: number): number {
  const x = c / 255
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

const luminancia = (c: number[]) =>
  0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2])

function contraste(a: number[], b: number[]): number {
  const la = luminancia(a)
  const lb = luminancia(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** El fondo REAL de la pastilla: el tinte sobre el blanco de la tarjeta. */
const compone = (fg: number[], alfa: number, fondo = [255, 255, 255]) =>
  fg.map((c, i) => c * alfa + fondo[i] * (1 - alfa))

/**
 * Oscurece `hex` hasta que contrasta contra su propio tinte sobre fondo claro.
 *
 * @param hex      el color de la pastilla
 * @param alfa     qué tan fuerte es el tinte del fondo (0.14 = el típico `18`)
 * @param objetivo contraste mínimo; 4.5:1 es el de texto normal en WCAG AA
 *
 * Devuelve el mismo color si ya contrastaba. Verificado contra los diez tonos
 * que usa el tablero: todos pasan de ~2:1 a 4.5:1 o más.
 */
export function tonoSobreClaro(hex: string, alfa = 0.14, objetivo = 4.5): string {
  const clave = `${hex}|${alfa}|${objetivo}`
  const guardado = CACHE.get(clave)
  if (guardado) return guardado

  const base = hexARgb(hex)
  const fondo = compone(base, alfa)
  let r = '#0F172A'
  for (let k = 1; k > 0.02; k -= 0.025) {
    /* SE MIDE EL HEX, NO EL FLOTANTE. El candidato se calcula con decimales y
       se sirve redondeado a enteros, y ese redondeo se come hasta una décima:
       el verde `#22C55E` salía del descenso con 4.5001:1 y llegaba a la
       pantalla con 4.4997. Pasaba la revisión por un pelo del lado malo.
       Medir el hex ya redondeado hace que la garantía sea exacta. */
    const cand = rgbAHex(base.map(c => c * k))
    if (contraste(hexARgb(cand), fondo) >= objetivo) { r = cand; break }
  }
  CACHE.set(clave, r)
  return r
}

/**
 * Oscurece `hex` hasta que contrasta contra un fondo CONCRETO.
 *
 * `tonoSobreClaro` compone el fondo a partir del propio color (el caso de las
 * pastillas). Aquí el fondo es un color dado, que es el caso de una barra sobre
 * su carril: las barras de prioridad de /tickets iban sobre `bg-gray-100` y
 * medían 1.95:1 el ámbar, 2.07:1 el verde y 2.55:1 el naranja — por debajo del
 * 3:1 que WCAG pide a un objeto gráfico que comunica información.
 *
 * El objetivo por omisión es 3:1 justamente porque el caso de uso son objetos
 * gráficos (barras, líneas, puntos), no texto.
 */
export function tonoSobreFondo(hex: string, fondoHex: string, objetivo = 3): string {
  const clave = `f|${hex}|${fondoHex}|${objetivo}`
  const guardado = CACHE.get(clave)
  if (guardado) return guardado

  const base = hexARgb(hex)
  const fondo = hexARgb(fondoHex)
  let r = '#0F172A'
  if (contraste(base, fondo) >= objetivo) {
    r = rgbAHex(base)
  } else {
    for (let k = 1; k > 0.02; k -= 0.02) {
      /* Redondeado antes de medir, igual que arriba. */
      const cand = rgbAHex(base.map(c => c * k))
      if (contraste(hexARgb(cand), fondo) >= objetivo) { r = cand; break }
    }
  }
  CACHE.set(clave, r)
  return r
}

/**
 * El estilo completo de una pastilla de color sobre fondo claro.
 *
 * El fondo conserva el tono original —es lo que comunica de un vistazo— y la
 * letra se oscurece lo necesario para leerse.
 */
export function pastillaClara(hex: string, alfa = 0.14) {
  return {
    background: `${hex}${Math.round(alfa * 255).toString(16).padStart(2, '0')}`,
    color: tonoSobreClaro(hex, alfa),
    borderColor: `${hex}55`,
  }
}

/**
 * EL FONDO DE LA PÁGINA. No es blanco, y esa diferencia descuadra la medición.
 *
 * `app/globals.css:11` pone `html, body { background: #F5F8FB !important }`. Un
 * tinte translúcido encima de eso NO compone sobre blanco: compone sobre este
 * gris azulado, que es un pelo más oscuro y se come décimas de ratio.
 *
 * CORREGIDO el 16 oct 2026: decía `#EFF6FF`, que fue el fondo hasta que la
 * paleta del Customer Success Operating System (13 oct) lo cambió a `#F5F8FB`.
 *
 * Y la dirección del error se MIDIÓ antes de escribirla aquí, porque el
 * razonamiento la tenía al revés. `#F5F8FB` es más CLARO (luminancia 0.9351
 * contra 0.9148), así que la constante vieja hacía el descenso contra un fondo
 * más oscuro del real y oscurecía la letra DE MÁS: medidos los seis tonos del
 * tablero sobre el fondo de verdad, el tono viejo daba entre 4.58 y 4.79:1 y
 * el nuevo entre 4.52 y 4.76:1. **Los doce pasan AA.** O sea que esto no
 * rescata ningún contraste roto —nada estaba roto por aquí— sino que deja de
 * apagar el color de la pastilla sin motivo, y sobre todo quita una constante
 * que decía ser el fondo de la página y ya no lo era: la siguiente vez que
 * alguien la lea para medir algo, lo medirá contra la pantalla que existe.
 */
export const FONDO_PAGINA = '#F5F8FB'

/**
 * El tono de letra para una pastilla que vive A NIVEL DE PÁGINA.
 *
 * `tonoSobreClaro` compone el tinte sobre BLANCO, que es correcto dentro de
 * una tarjeta blanca y equivocado en cualquier otro sitio. Usarla en la página
 * deja el tono corto: medido el 8 oct 2026, la pastilla de estatus de la ficha
 * salía a 4.65:1 según el cálculo y a **4.30:1** en la pantalla, y la inicial
 * de la empresa a 4.17:1 en sus seis estados. Pasaban la revisión y no pasaban
 * el ojo.
 *
 * Existe para que la diferencia no haya que recordarla: si el elemento cuelga
 * de la página, ésta; si cuelga de una tarjeta blanca, `tonoSobreClaro`.
 */
export function tonoSobrePagina(hex: string, alfa = 0.14, objetivo = 4.5): string {
  return tonoSobreTinte(hex, alfa, FONDO_PAGINA, objetivo)
}

/**
 * EL CASO GENERAL: una pastilla tintada sobre CUALQUIER superficie.
 *
 * `tonoSobreClaro` supone blanco y `tonoSobrePagina` supone el `#EFF6FF` de la
 * página. Entre esos dos extremos vive media aplicación: `/auditoria` corre
 * sobre `bg-gray-50` (`#F9FAFB`), las tarjetas de `/churn` sobre otro gris, y
 * cada uno desplaza el cálculo lo justo para que no se note hasta que se mide.
 *
 * Medido el 9 oct 2026 en las seis pastillas de estado de `/auditoria`, que
 * usaban `tonoSobreClaro`: las SEIS salían entre 4.32 y 4.43:1 sobre su fondo
 * real, todas por debajo del 4.5 de AA, y todas lo pasaban contra el blanco
 * que el cálculo suponía. Es exactamente el error del 8 oct otra vez —pasaban
 * la revisión y no pasaban el ojo— y volvió porque la herramienta sólo sabía
 * de dos fondos.
 *
 * Con esto hay una sola regla y no tres: **el tono se calcula contra el fondo
 * donde de verdad cae la letra.** `tonoSobreClaro` y `tonoSobrePagina` son
 * ahora atajos de este caso para los dos fondos más comunes.
 */
export function tonoSobreTinte(
  hex: string,
  alfa: number,
  fondoHex: string,
  objetivo = 4.5,
): string {
  const fondo = compone(hexARgb(hex), alfa, hexARgb(fondoHex))
  return tonoSobreFondo(hex, rgbAHex(fondo), objetivo)
}

/** Como `pastillaClara`, pero para una pastilla que vive sobre la página. */
export function pastillaSobrePagina(hex: string, alfa = 0.14) {
  return {
    background: `${hex}${Math.round(alfa * 255).toString(16).padStart(2, '0')}`,
    color: tonoSobrePagina(hex, alfa),
    borderColor: `${hex}55`,
  }
}

/**
 * EL CUARTO CASO: letra sobre un relleno SÓLIDO de color.
 *
 * Las tres funciones de arriba suponen un fondo claro —blanco, la página, o un
 * tinte translúcido— y oscurecen la letra. Aquí el fondo es el color entero, y
 * la respuesta no siempre es oscurecer: sobre un azul `#0057FF` el blanco mide
 * 5.52:1 y es correcto, mientras que sobre el mismo azul la letra oscura no
 * llega a 4.5 por mucho que se baje.
 *
 * Lo que NO se puede hacer es poner blanco por costumbre. Medido el 8 oct 2026
 * en las pastillas numeradas del glosario: de los siete rellenos de los pasos,
 * **cinco** dejaban el blanco por debajo de AA —`#22C55E` en 2.28:1, `#94A3B8`
 * en 2.56, `#0EA5E9` en 2.77, `#A855F7` en 3.95 y `#8B5CF6` en 4.27—. Los
 * `bg-*-500` de Tailwind son el mismo caso: su blanco mide 3.68 (azul) y 3.76
 * (rojo), que es justamente por qué existe el `-600`.
 *
 * Decide por medición: blanco si el blanco pasa, y si no, el propio tono
 * oscurecido hasta que pase —así la pastilla conserva su color—. Si ninguno
 * llega al objetivo (un relleno de luminancia intermedia puede no admitir
 * ninguno de los dos), devuelve el que más contraste da, que es lo más honesto
 * que se puede hacer sin cambiarle el fondo.
 */
export function textoSobreSolido(hex: string, objetivo = 4.5): string {
  const clave = `s|${hex}|${objetivo}`
  const guardado = CACHE.get(clave)
  if (guardado) return guardado

  const fondo = hexARgb(hex)
  const BLANCO = [255, 255, 255]
  const cBlanco = contraste(BLANCO, fondo)

  let r = ''
  if (cBlanco >= objetivo) {
    r = '#FFFFFF'
  } else {
    /* El mismo descenso que `tonoSobreFondo`, pero contra el propio relleno.
       EN CUANTO ALCANZA EL OBJETIVO SE PARA: así gana el tono con el color
       conservado y no el marino. La primera versión comparaba el marino
       contra el ganador del descenso, y como el marino mide más sobre un
       relleno claro —7.83:1 sobre el verde `#22C55E` frente a los 4.5 justos
       del verde oscuro—, se llevaba todos los casos y el color se perdía.

       El marino queda solo como semilla, para el caso en que el descenso NO
       alcance el objetivo. Con el 4.5 de AA ese caso no existe: si el blanco
       falla es que la luminancia del relleno pasa de 0.183, y entonces el
       negro mide más de 4.67:1. Pero con un objetivo de AAA (7:1) sí puede
       quedarse corto, y entonces se devuelve lo que más mida de los tres. */
    let mejor = '#0F172A'
    let cMejor = contraste(hexARgb(mejor), fondo)
    for (let k = 1; k > 0.02; k -= 0.02) {
      /* Redondeado antes de medir, igual que en las dos de arriba. */
      const cand = rgbAHex(fondo.map(c => c * k))
      const c = contraste(hexARgb(cand), fondo)
      if (c >= objetivo) { mejor = cand; cMejor = c; break }
      if (c > cMejor) { mejor = cand; cMejor = c }
    }
    r = cMejor >= objetivo || cMejor >= cBlanco ? mejor : '#FFFFFF'
  }
  CACHE.set(clave, r)
  return r
}
