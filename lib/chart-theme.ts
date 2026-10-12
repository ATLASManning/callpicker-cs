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
  900: '#0B1F3A',   // fondo del apartado
  700: '#12305A',   // superficie de tarjeta
  500: '#1B4580',   // acento azul, bordes activos
} as const

export const SILVER = {
  300: '#C0C6CE',   // 9.60:1 sobre navy-900 · 7.65:1 sobre navy-700 — texto ok
  500: '#8E96A3',   // 5.54:1 / 4.41:1 — SOLO objeto gráfico sobre navy-700
  700: '#5B6573',   // 2.80:1 / 2.23:1 — NI para objeto. Solo bordes y rejilla.
} as const

export const ORANGE = {
  500: '#FF7A1A',   // 6.33:1 / 5.04:1 — acento principal, texto ok
  400: '#FF9A4D',   // 7.85:1 / 6.25:1 — hover
  700: '#C85A00',   // presionado
} as const

export const WHITE = {
  pure: '#FFFFFF',  // 16.52:1 / 13.16:1
  soft: '#F4F6F9',  // 15.26:1 / 12.15:1
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
export const GRID = 'rgba(192,198,206,0.10)'   // plata al 10%, como pide el encargo
export const BORDE = 'rgba(192,198,206,0.15)'  // plata al 15%
export const FOCO = ORANGE[500]                // anillo de foco, siempre naranja

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
 * La tira de acento que ordena las filas: plata (menor riesgo) → naranja.
 *
 * NO son series que compitan entre sí, así que no se les exige separación
 * mutua: son un indicador de posición en una lista ya ordenada y etiquetada.
 * Lo que sí se les exige, y cumplen, es verse sobre la tarjeta (≥3:1).
 */
export const TIRA_RIESGO: readonly string[] = [
  '#C0C6CE',  // en_orden          7.65:1
  '#CEBCB6',  // oportunidad       7.20:1
  '#DAB09E',  // hay_que_mostrarle 6.69:1
  '#E5A585',  // sin_auditar       6.30:1
  '#EE986A',  // no_la_vemos       5.85:1
  '#F78A4B',  // apagandose        5.45:1
  '#FF7A1A',  // se_va             5.04:1
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

/* ── Asesores: CATEGÓRICO, no ordenado ────────────────────────────────────
 * El par más apretado se separa 21.2 en OKLab — holgado.
 * Fátima usa `SILVER[500]`, que vale como relleno (4.41:1 ≥ 3) pero NO como
 * texto: su nombre se escribe en `TX.low`, no en su color.
 */
export const ASESOR: Record<string, string> = {
  Claudia: ORANGE[500],
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
  axisLine: { stroke: 'rgba(192,198,206,0.18)' },
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
