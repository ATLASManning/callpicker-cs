/**
 * Tema único de las gráficas del Dashboard.
 *
 * NINGÚN COLOR SE ESCRIBE FUERA DE AQUÍ. Es la condición que pidió dirección y
 * también la única forma de que el validador sirva: si un componente escribe
 * un hex suelto, `mide-paleta-dashboard.py` no lo ve y el contraste deja de
 * estar garantizado.
 *
 * ── TODO ESTÁ MEDIDO, NO ELEGIDO ──────────────────────────────────────────
 * Correr `python scripts/mide-paleta-dashboard.py` antes de tocar un color.
 * Las cifras de los comentarios salen de ahí.
 */

/* ── La paleta cerrada, tal como la fijó dirección ────────────────────────── */
export const NAVY = {
  900: '#082742',   // fondo del apartado      — `--navy2` del documento
  700: '#10355D',   // superficie de tarjeta   — `--navy`
  500: '#1D6CAA',   // bordes activos y acento sobre CLARO — `--blue`
} as const

/* La familia plata se reencuadra sobre los grises AZULADOS del documento:
   un gris neutro al lado de este marino se ve verdoso. */
export const SILVER = {
  300: '#DFE8EF',   // 12.27:1 sobre navy-900 · 10.02:1 sobre navy-700 — texto ok
  500: '#A8BACB',   // 7.65:1 / 6.25:1 — texto ok, y relleno holgado
  700: '#6A7889',   // 3.38:1 / 2.76:1 — NI para objeto. Solo bordes y rejilla.
} as const

/**
 * EL ACENTO ES CIAN, NO NARANJA — y la constante se llama como lo que vale.
 *
 * El documento que fijó esta paleta no tiene naranja en ninguna parte: su
 * acento es el cian del filete y del titular. Un `ORANGE` que valiera cian
 * sería la trampa de las paletas gemelas otra vez — alguien lo lee, asume
 * naranja y escribe un `rgba(255,122,26,…)` al lado sin que falle nada.
 */
export const CIAN = {
  500: '#39ABD8',   // 5.79:1 / 4.73:1 — acento principal, texto ok
  400: '#8AD7F8',   // 9.54:1 / 7.79:1 — hover. Es el titular del hero.
  700: '#1D6CAA',   // 5.56:1 sobre BLANCO — el acento de las islas claras
} as const

export const WHITE = {
  pure: '#FFFFFF',  // 15.23:1 / 12.43:1
  soft: '#F5F8FB',  // 14.29:1 / 11.66:1
} as const

/* ── Texto: qué token vale para qué ───────────────────────────────────────── */
export const TX = {
  /** Valores clave y títulos. */
  hi:  WHITE.pure,
  /** Cuerpo. */
  mid: WHITE.soft,
  /** Secundario, ejes, etiquetas. Es el MÁS BAJO que aún pasa 4.5:1. */
  low: SILVER[300],
} as const

/**
 * `SILVER[500]` NO es un token de texto: mide 4.41:1 sobre la tarjeta y se
 * queda a nueve centésimas de AA. Se deja fuera de `TX` a propósito para que
 * no se use por descuido. Para texto apagado, `TX.low`.
 */

/* ── Rejilla y bordes ─────────────────────────────────────────────────────── */
export const GRID = 'rgba(223,232,239,0.10)'   // plata al 10%, como pide el encargo
export const BORDE = 'rgba(223,232,239,0.15)'  // plata al 15%
export const BORDE_SUAVE = 'rgba(223,232,239,0.08)'  // separadores internos
export const FOCO = CIAN[500]                  // anillo de foco, siempre el acento

/* ── LA PÁGINA ES CLARA Y LAS TARJETAS SON ISLAS OSCURAS ──────────────────
 * Esto no es una decisión del rediseño: es la arquitectura del tablero, y
 * todo lo de arriba son tokens para DENTRO de la tarjeta. En el Dashboard
 * convive lo uno con lo otro —rótulos que cuelgan de la página, chips de
 * aviso sobre la página, y paneles oscuros—, así que cada cosa se mide
 * contra SU fondo real. Medir contra un fondo supuesto es exactamente lo
 * que costó nueve rondas del mismo bug.
 */
export const PAGINA = '#F5F8FB'          // el claro del tablero — `--wash`
export const TARJETA_CLARA = WHITE.pure  // un chip o una isla clara
export const TX_PAGINA = {
  /** Títulos sobre la página clara. El marino del documento: 11.63:1. */
  hi:  NAVY[700],
  /** Cuerpo: `--ink`, 13.86:1 sobre blanco. */
  mid: '#202E3B',
  /** Rótulos y texto apagado: `--muted`, 4.56:1 sobre blanco. Es el MÁS
   *  bajo que pasa AA ahí, así que por debajo no hay nada. */
  low: '#6A7889',
} as const

/** La línea del documento (`--line`). Bordes y separadores sobre claro. */
export const LINEA_CLARA = '#DFE8EF'

/**
 * EL ACENTO NO ES UNO, SON DOS, Y SE ELIGEN POR EL FONDO.
 *
 * Medido, y es una asimetría fuerte que se olvida enseguida:
 *
 *   cian-500 (#39ABD8) sobre la tarjeta navy-700 →  4.73:1  ✓
 *   cian-500 (#39ABD8) sobre blanco              →  2.63:1  ✗
 *   cian-700 (#1D6CAA) sobre blanco              →  5.56:1  ✓
 *
 * O sea que el cian vivo es un acento de fondo OSCURO y no vale ni como
 * borde en la página clara. Ahí el acento es el 700, que es `--blue`. Escribirlo aquí es
 * más barato que volver a medirlo: la primera versión de los chips de aviso
 * de la portada usaba el 500 de borde y se quedaba en 2.61.
 */
export const ACENTO = CIAN[500]        // sobre tarjeta oscura
export const ACENTO_CLARO = CIAN[700]  // sobre página o chip claro

/* ── EL TRILEMA DEL COLOR, Y POR QUÉ LA FORMA CAMBIA ───────────────────────
 *
 * El catálogo tiene SIETE situaciones y el diseño original las apilaba en una
 * sola barra. Medido con `mide-paleta-dashboard.py`, las tres cosas no caben
 * juntas — sólo dos:
 *
 *   paleta cerrada + 7 categorías  ->  separación 3.7 en OKLab. ILEGIBLE.
 *   paleta cerrada + legibilidad   ->  máximo 3 categorías.
 *   7 categorías + legibilidad     ->  22.6, pero es un arcoíris (prohibido).
 *
 * Y los datos empujan en la misma dirección: al 11 oct 2026 `en_orden` tiene
 * CERO cuentas, `oportunidad` UNA, y `no_la_vemos` + `sin_auditar` se llevan
 * 152 de 193 — el 79%. La apilada de siete ya era ilegible por los datos.
 *
 * LA SALIDA NO ES EL COLOR, ES LA FORMA. Una FILA por situación: dentro de
 * cada barra conviven sólo TRES series —los asesores— y eso la paleta lo da
 * holgado (21.2 de separación, medido). Las siete situaciones siguen ahí, con
 * etiqueta directa, en orden de riesgo, y el orden se refuerza con una tira de
 * acento a la izquierda.
 */

/**
 * La tira de acento que ordena las filas: plata (menor riesgo) → cian.
 *
 * NO son series que compitan entre sí, así que no se les exige separación
 * mutua: son un indicador de posición en una lista ya ordenada y etiquetada.
 * Lo que sí se les exige, y cumplen, es verse sobre la tarjeta (≥3:1).
 */
export const TIRA_RIESGO: readonly string[] = [
  '#DFE8EF',  // en_orden         10.02:1
  '#C7DEEC',  // oportunidad       8.93:1
  '#AFD4E8',  // hay_que_mostrarle 7.94:1
  '#95CAE4',  // sin_auditar       7.01:1
  '#7BC0E0',  // no_la_vemos       6.19:1
  '#5EB6DC',  // apagandose        5.45:1
  '#39ABD8',  // se_va             4.73:1
]

/** El orden de riesgo del catálogo, de menor a mayor. Es el orden de las filas. */
export const ORDEN_SITUACION: readonly string[] = [
  'en_orden', 'oportunidad', 'hay_que_mostrarle', 'sin_auditar',
  'no_la_vemos', 'apagandose', 'se_va',
]

/** El acento que le toca a una situación por su posición en el orden. */
export function acentoDeSituacion(situacion: string): string {
  const i = ORDEN_SITUACION.indexOf(situacion)
  return i >= 0 ? TIRA_RIESGO[i] : SILVER[500]
}

/* ── LAS TRES BANDAS: el techo medido de la paleta ────────────────────────
 * La tira de arriba vale para pintar un ACENTO por fila, porque esos siete
 * tonos nunca se tocan entre sí. Cuando hay que APILARLOS —segmentos
 * contiguos de una misma barra— el ojo los compara borde con borde y hace
 * falta separación real. Y ahí la paleta tiene un techo que se midió:
 *
 *   la polilínea plata→cian mide 25.2 ΔE DE LARGO. Repartida:
 *     3 escalones → 12.6 cada uno   ✓  (umbral 10)
 *     4 escalones →  8.4            ✗
 *     5 escalones →  6.2            ✗
 *
 * Buscando sobre los DIECISÉIS colores del tema, no sólo sobre la tira, y
 * exigiendo que el tono avance de verdad (en OKLab, que `a` y `b` no bajen
 * nunca: sin eso la búsqueda daba por bueno blanco→plata→NARANJA→PLATA→
 * naranja, que pasa el ΔE de sobra y aun así zigzaguea y se lee como cinco
 * categorías en vez de cinco niveles) salen CERO secuencias de cinco y seis
 * de cuatro. El techo real es cuatro, y cuatro sólo estirando el extremo
 * claro al blanco puro.
 *
 * De ahí la regla de todo el Dashboard: **lo que se apila lleva TRES
 * bandas**, y las 7 situaciones o los 5 semáforos originales viven en la
 * leyenda, en la etiqueta directa y en el tooltip, que es donde el detalle
 * se lee de uno en uno y no por comparación de bordes.
 *
 * Son los mismos tres tonos en la gráfica A y en el semáforo a propósito:
 * dos escalas de riesgo en la misma pantalla con colores distintos obligan
 * a aprenderse dos códigos.
 */
export const BANDA = {
  bajo:  SILVER[300],   // 10.02:1 sobre la tarjeta
  medio: '#95CAE4',     //  7.01:1 — el centro de la tira
  alto:  CIAN[500],     //  4.73:1
} as const

export type Banda = keyof typeof BANDA

/** Las bandas de menor a mayor riesgo. Es el orden de apilado. */
export const ORDEN_BANDA: readonly Banda[] = ['bajo', 'medio', 'alto']

/** La banda «alto» SIEMPRE va con trama: ver `TRAMAS`. */
export const BANDA_TRAMA: Record<Banda, boolean> = {
  bajo: false, medio: false, alto: true,
}

/** En qué banda cae cada situación del catálogo. Sale del ORDEN, no de una
 *  lista escrita aparte: así una situación nueva no se queda sin banda. */
export function bandaDeSituacion(situacion: string): Banda {
  const i = ORDEN_SITUACION.indexOf(situacion)
  if (i < 0) return 'medio'
  return i <= 2 ? 'bajo' : i <= 4 ? 'medio' : 'alto'
}

/** En qué banda cae cada luz del semáforo.
 *
 *  El corte NO lo elegí yo: es el que el propio tooltip de la gráfica ya
 *  usaba para resumir —`saludables = Verde + Azul`, `riesgo = Naranja +
 *  Rojo`, y amarillo solo en medio—. O sea que la lectura de la pantalla ya
 *  era de tres grupos; lo único que cambia es que ahora el dibujo lo dice. */
export const BANDA_DE_SEMAFORO = {
  verde: 'bajo', azul: 'bajo', amarillo: 'medio', naranja: 'alto', rojo: 'alto',
} as const satisfies Record<string, Banda>

/** El nombre de cada banda en la leyenda, con las luces que agrupa. */
export const BANDA_SEMAFORO_ETIQUETA: Record<Banda, string> = {
  bajo:  'Sanas · saludable + estable',
  medio: 'En observación',
  alto:  'En riesgo · riesgo + riesgo alto',
}

/* ── Asesores: CATEGÓRICO, no ordenado ────────────────────────────────────
 * El par más apretado se separa 12.2 en OKLab — holgado.
 * `SILVER[500]` ahora SÍ pasa como texto (6.25:1), al revés que en la paleta
 * anterior, donde se quedaba en 4.41:1.
 */
export const ASESOR: Record<string, string> = {
  Claudia: CIAN[500],
  Dan:     WHITE.soft,
  'Fátima': SILVER[500],
}

/* ── Tramas SVG: no depender solo del color ───────────────────────────────
 * Se declaran una vez en `<defs>` y se referencian con `url(#id)`.
 * La banda «alto» SIEMPRE lleva trama: es la que hay que reconocer a dos
 * metros de la pantalla y la que tiene que sobrevivir a una impresión en gris
 * o a un daltonismo.
 */
export const TRAMAS = {
  alto: 'trama-alto',
} as const

/** El `<defs>` que hay que montar una vez por SVG que use tramas. */
export const TRAMA_DEFS = [
  {
    id: TRAMAS.alto,
    /** Diagonales a 45°, 6px de paso. Legible desde ~3px de ancho de barra. */
    patron: { ancho: 6, alto: 6, linea: 'M0,6 l6,-6 M-1,1 l2,-2 M5,7 l2,-2' },
  },
] as const

/* ── Tipografía ───────────────────────────────────────────────────────────
 * El encargo es explícito: los textos actuales son demasiado pequeños.
 * Mínimos: 12px en ejes, 14px en cuerpo, 18–20px en títulos de sección.
 */
export const FUENTE = {
  eje:       12,
  cuerpo:    14,
  etiqueta:  13,
  valor:     16,
  subtitulo: 13,
  titulo:    19,
} as const

/** Las cifras SIEMPRE con cifras de ancho fijo, o las columnas bailan. */
export const TABULAR: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' }

/* ── Espaciado y layout ───────────────────────────────────────────────────── */
export const BASE = 8
export const ANCHO_MAX = 1440   // en 4K el tablero no se estira
export const RADIO = 16

/* ── TAMAÑOS MÍNIMOS: lo que hace falta para que de verdad funcione ───────
 *
 * No son preferencias. Cada uno sale de un fallo concreto que se vio en la
 * pantalla actual o de un requisito de accesibilidad.
 */
export const MINIMOS = {
  /** Alto de una fila con etiqueta dentro. Por debajo, la etiqueta no cabe y
   *  hay que sacarla fuera, que es donde se pierde el vínculo con la barra. */
  altoFila: 34,
  /** Alto de la barra dentro de la fila. */
  altoBarra: 20,
  /** Ancho MÍNIMO PINTADO de un segmento, aunque su valor sea casi cero.
   *  Hoy hay situaciones con 1 cuenta de 193 (0.5%): a escala real eso es
   *  medio píxel, invisible e inclicable. Se pinta este mínimo y el tooltip
   *  dice el valor verdadero. */
  anchoSegmento: 3,
  /** Área de clic, que NO es el ancho pintado. WCAG 2.5.8 pide 24×24 como
   *  mínimo; se envuelve el segmento en un `<rect>` transparente de este alto
   *  para que un segmento de 3px siga siendo clicable. */
  areaClic: 24,
  /** Ancho de la tira de acento a la izquierda de cada fila. */
  tiraAcento: 4,
  /** Un segmento más angosto que esto NO puede llevar etiqueta dentro: se
   *  saca al extremo de la barra con `TX.low`. */
  anchoParaEtiqueta: 46,
} as const

/* ── Movimiento ───────────────────────────────────────────────────────────
 * 150–300ms, ease-out. `prefers-reduced-motion` NO es opcional: quien lo
 * activa suele hacerlo por mareo o vértigo, no por gusto.
 */
export const MOTION = {
  rapido: 150,
  normal: 220,
  entrada: 600,
  stagger: 45,
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const

/* ── Formato es-MX ────────────────────────────────────────────────────────── */
const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
})

/**
 * Moneda COMPACTA para ejes: `$1.2M`, `$350K`.
 *
 * No usa `notation: 'compact'` de Intl a propósito: en es-MX abrevia el millón
 * como «1.2 M» con espacio y el millar como «350 k» minúscula, que en un eje
 * estrecho parte de línea y se lee peor. Aquí se controla.
 */
export function mxnCompacto(n: number): string {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `$${(n / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`
  if (a >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

/** Moneda completa, para tooltips y valores que se citan. */
export function mxn(n: number): string {
  return MXN.format(n)
}

export function pct(n: number, dec = 1): string {
  return `${n.toFixed(dec)}%`
}

/* ── Config común de recharts ─────────────────────────────────────────────
 * recharts es la única librería de gráficas del repo y hace todo lo que el
 * encargo pide: barras redondeadas, brush, animación con stagger, tooltips a
 * medida y tramas vía `<defs>`. Añadir una segunda librería duplicaría el
 * bundle sin ganar nada.
 */
export const EJE_COMUN = {
  stroke: SILVER[700],
  tick: { fill: TX.low, fontSize: FUENTE.eje },
  tickLine: false,
  axisLine: { stroke: 'rgba(223,232,239,0.18)' },
} as const

/**
 * Los TRES estilos del tooltip, siempre juntos.
 *
 * Sin `labelStyle` ni `itemStyle`, recharts pinta el texto con el color de la
 * serie — que aquí es un relleno de barra y sobre la tarjeta no se lee. Es un
 * error que ya costó una ronda en este repo.
 */
export const TOOLTIP = {
  contentStyle: {
    background: NAVY[900],
    border: `1px solid ${BORDE}`,
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: FUENTE.cuerpo,
    boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
  },
  labelStyle: { color: TX.hi, fontWeight: 800, marginBottom: 6 },
  itemStyle:  { color: TX.mid },
} as const
