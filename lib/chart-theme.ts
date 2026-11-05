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

/* ═══════════════════════════════════════════════════════════════════════════
 * EL DASHBOARD ES ISLA CLARA DESDE EL 4 NOV 2026 — LEER ESTO ANTES DE TOCAR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hasta esa fecha este módulo pintaba TARJETAS OSCURAS sobre página clara, y
 * toda la paleta de abajo estaba medida contra marino. Dirección pidió el
 * formato de Contratos «en toda la ventana del apartado, no sólo en el
 * título», así que las tarjetas son BLANCAS y la tinta es OSCURA.
 *
 * LO QUE ESO ROMPIÓ, Y POR QUÉ NO FUE UN CAMBIO DE TOKENS DE SITIO
 * (medido con `scripts/mide-paleta-dashboard-claro.py`, sección 2):
 *
 *     asesor Dan    = WHITE.soft  #F5F8FB sobre blanco →  1.07:1  invisible
 *     asesor Fátima = SILVER[500] #A8BACB sobre blanco →  1.99:1  invisible
 *     acento        = CIAN[500]   #39ABD8 sobre blanco →  2.63:1  ni 3:1
 *     banda bajo    = SILVER[300] #DFE8EF sobre blanco →  1.24:1  invisible
 *
 * Y los tintes `rgba(255,255,255,0.0X)` de hover y cebra: sobre una tarjeta
 * blanca componen BLANCO. No oscurecen nada, no falla nada, y la fila deja de
 * marcarse. Por eso los realces ahora son hex declarados (`SUPERFICIE.cebra`),
 * no tintes. [[atlas-dashboard-contrast-architecture]]
 *
 * LAS SUPERFICIES Y LA TINTA SALEN DE `lib/paleta-cs.ts`, que es la paleta de
 * Contratos. NO se declara aquí un juego paralelo: eso sería «paletas
 * gemelas» otra vez, y la próxima corrección entraría en una y no en la otra
 * sin que fallara nada.
 */

/* ── La familia cerrada, tal como la fijó dirección ───────────────────────
 * Estos cuatro bloques siguen siendo los COLORES de la paleta —no cambian de
 * valor—, pero ya no describen la superficie del módulo. El fondo de la
 * tarjeta se pide por `SUPERFICIE`, no por `NAVY[700]`: un nombre que diga
 * «navy» y valga blanco es la trampa del `ORANGE` que valía cian.
 */
export const NAVY = {
  900: '#082742',   // `--navy2` — el tono más oscuro de la familia
  700: '#10355D',   // `--navy`  — titulares sobre claro, 12.43:1
  500: '#1D6CAA',   // `--blue`  — EL ACENTO sobre claro, 5.56:1
} as const

/* La familia plata se reencuadra sobre los grises AZULADOS del documento:
   un gris neutro al lado de este marino se ve verdoso. */
export const SILVER = {
  300: '#DFE8EF',   // `--line`. Sobre BLANCO mide 1.24:1: sólo separadores.
  500: '#A8BACB',   // 1.99:1 sobre blanco — NO es texto ni relleno aquí.
  700: '#6A7889',   // 4.23:1 sobre el lavado — NO llega. Ver `TX.low`.
} as const
/* OJO: los tres medían de sobra sobre marino y NINGUNO sirve de texto sobre
   blanco. Quedan porque la familia es la misma y porque el tooltip —que
   sigue siendo oscuro— sí los usa. Para tinta sobre claro está `TX`. */

/**
 * EL ACENTO ES CIAN, NO NARANJA — y la constante se llama como lo que vale.
 *
 * El documento que fijó esta paleta no tiene naranja en ninguna parte: su
 * acento es el cian del filete y del titular. Un `ORANGE` que valiera cian
 * sería la trampa de las paletas gemelas otra vez — alguien lo lee, asume
 * naranja y escribe un `rgba(255,122,26,…)` al lado sin que falle nada.
 */
export const CIAN = {
  500: '#39ABD8',   // 2.63:1 sobre BLANCO — NO vale ni como relleno aquí.
  400: '#8AD7F8',   // 1.50:1 sobre blanco — sólo dentro del tooltip oscuro.
  700: '#1D6CAA',   // 5.56:1 sobre BLANCO — ÉSTE es el acento del módulo.
} as const

export const WHITE = {
  pure: '#FFFFFF',  // la superficie de la tarjeta
  soft: '#F5F8FB',  // `--wash`, la página
} as const

/* ── LAS SUPERFICIES ──────────────────────────────────────────────────────
 * Se piden por aquí y no por `NAVY[700]`. Los cuatro valores son los de
 * `lib/paleta-cs.ts`, que es lo que pinta Contratos: el encargo es que las
 * dos pantallas se vean igual, y dos juegos de superficies «equivalentes»
 * se desincronizan a la primera corrección.
 */
export const SUPERFICIE = {
  /** El lavado de la página, detrás de las tarjetas. */
  pagina:  '#F5F8FB',
  /** La tarjeta. Es la superficie contra la que se mide TODO lo demás. */
  tarjeta: '#FFFFFF',
  /** Fila alterna de tabla. HEX DECLARADO, no un tinte: un `rgba` blanco
   *  sobre blanco no oscurece nada y la cebra desaparece sin fallar. */
  cebra:   '#F4F8FB',
  /** Recuadro de aviso. SÓLO admite titular marino o azul: el secundario
   *  encima mide 4.45:1 y no llega. Medido, no supuesto. */
  aviso:   '#EFF7FC',
} as const

/* ── Texto: qué token vale para qué ───────────────────────────────────────
 * Los tres niveles son los de `lib/paleta-cs.ts`. Están medidos contra las
 * TRES superficies de texto corrido —tarjeta, página y cebra—, porque en
 * esta pantalla conviven y un tono que valga en una y no en otra cae de
 * lado sin que nadie lo toque.
 */
export const TX = {
  /** Títulos y cifras clave. Marino: 12.43 / 11.66 / 11.64:1. */
  hi:  NAVY[700],
  /** Cuerpo. `--ink` aclarado: 8.90 / 8.35 / 8.34:1. */
  mid: '#3D4B5C',
  /** Secundario, ejes, etiquetas: 4.83 / 4.53 / 4.52:1. Es el más bajo que
   *  pasa AA en las tres, así que por debajo NO hay nada. */
  low: '#667384',
} as const

/**
 * NO USAR `SILVER[700]` (#6A7889) DE TEXTO. Es el que este módulo usaba
 * cuando era oscuro y sobre el lavado de la página mide 4.23:1 — no llega.
 * Era un fallo que YA ESTABA; voltear el módulo sólo lo puso a la vista.
 */

/**
 * LA ÚNICA SUPERFICIE OSCURA QUE QUEDA: EL TOOLTIP.
 *
 * Es convención de la casa que el tooltip sea oscuro —uno claro sobre una
 * tarjeta clara se confunde con la tarjeta—, así que dentro de él la tinta
 * es la contraria y hace falta un juego propio.
 *
 * ESTO NO ES UN LUJO: `ChartTooltip` pintaba su título con `TX.hi`, y al
 * voltear el módulo `TX.hi` pasó a valer MARINO. Sobre `NAVY[900]` eso mide
 * **1.40:1** — el título del tooltip, invisible. Es la Variante B del bug de
 * este tablero: un panel oscuro usando tokens cuyo valor correcto dependía
 * de que la superficie fuese otra. [[atlas-dashboard-contrast-architecture]]
 *
 * Un panel oscuro NUNCA debe usar `TX`. Usa esto.
 */
export const TX_OSCURO = {
  hi:  '#FFFFFF',   // 15.23:1 sobre NAVY[900]
  mid: '#F5F8FB',   // 14.29:1
  low: '#DFE8EF',   // 12.27:1
} as const

/* ── Rejilla y bordes ─────────────────────────────────────────────────────
 * Sobre claro se tiñe con MARINO. Teñir con blanco no oscurece nada.
 */
export const GRID = 'rgba(16,53,93,0.10)'        // marino al 10%
export const BORDE = '#DFE8EF'                   // `--line`, 1.24:1 — separador
export const BORDE_SUAVE = 'rgba(16,53,93,0.07)' // separadores internos
export const FOCO = CIAN[700]                    // anillo de foco, el acento claro

/* ── TODA LA PANTALLA ES CLARA: YA NO HAY DOS JUEGOS ──────────────────────
 * Mientras el módulo tuvo tarjetas oscuras hacían falta dos escalas de
 * tinta —una para dentro de la tarjeta y otra para los rótulos que colgaban
 * de la página—, y elegir mal entre las dos fue el bug de nueve rondas.
 * Ahora la tarjeta y la página son las dos claras, así que la escala es UNA:
 * `TX`. Estos alias se quedan apuntando ahí para no romper los consumidores
 * que ya los nombran, pero NO son un segundo juego: valen lo mismo.
 */
export const PAGINA = SUPERFICIE.pagina
export const TARJETA_CLARA = SUPERFICIE.tarjeta
export const TX_PAGINA = TX

/** La línea del documento (`--line`). Bordes y separadores. */
export const LINEA_CLARA = BORDE

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
 * borde en la página clara. Ahí el acento es el 700, que es `--blue`.
 *
 * DESDE QUE EL MÓDULO ES CLARO, EL ACENTO ES UNO SOLO: el 700. El cian vivo
 * sobrevive en un único sitio —dentro del tooltip, que sigue siendo oscuro
 * por convención de la casa— y para eso está `ACENTO_SOBRE_OSCURO`.
 */
export const ACENTO = CIAN[700]              // #1D6CAA · 5.56:1 sobre la tarjeta
export const ACENTO_CLARO = CIAN[700]        // alias: ya no hay dos
export const ACENTO_SOBRE_OSCURO = CIAN[500] // SÓLO dentro del tooltip

/**
 * EL ÚNICO COLOR DE FUERA DE LA FAMILIA, y está acotado a una cosa.
 *
 * El panel de «una fuente no respondió» iba en `rgba(248,113,113,…)` — un
 * rojo Tailwind escrito suelto que ningún validador veía. Sobre la tarjeta
 * blanca ese rojo claro mide 2.77:1 y el aviso que dice que los datos no son
 * de fiar se leería peor que los datos.
 *
 * Es el mismo rojo que ya usa Contratos (`ROJO_TX` de `lib/paleta-cs.ts`), no
 * uno nuevo: un segundo rojo en el tablero es otra paleta gemela.
 */
export const ROJO_AVISO = '#A4262C'       // 7.26:1 sobre blanco · 6.88 sobre su fondo
export const ROJO_AVISO_FONDO = '#FFF7F7'

/**
 * El ámbar de «ojo con esto», también el de Contratos (`AMBAR_TX`).
 *
 * Sustituye al `#F97316` que llevaba la tabla de menor Health Score, que
 * sobre blanco mide 2.80:1. El naranja-500 de Tailwind es un acento de fondo
 * OSCURO; sobre claro hace falta bajar hasta aquí.
 */
export const AMBAR_AVISO = '#8A5200'      // 6.39:1 sobre blanco · 5.98 sobre la cebra

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
/* LA ESCALA SE INVIRTIÓ AL PASAR A CLARO, y conviene saberlo: sobre marino
   el riesgo alto era el tono CLARO (el cian), porque sobre oscuro lo que
   destaca es lo claro. Sobre blanco el riesgo alto es el tono OSCURO. Es lo
   correcto —más tinta, más peso— pero quien recuerde la pantalla vieja va a
   leerlo al revés el primer día. Las siete llevan etiqueta directa. */
export const TIRA_RIESGO: readonly string[] = [
  '#339ECF',  // en_orden           3.03:1 sobre la tarjeta
  '#2B88B6',  // oportunidad        3.96:1
  '#23749D',  // hay_que_mostrarle  5.18:1
  '#1C5F85',  // sin_auditar        6.94:1
  '#154C6E',  // no_la_vemos        9.17:1
  '#0E3957',  // apagandose        12.06:1
  '#082742',  // se_va             15.23:1
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
  bajo:  '#339ECF',   //  3.03:1 sobre la tarjeta blanca
  medio: '#195C93',   //  7.02:1
  alto:  '#082742',   // 15.23:1 — el riesgo alto es el que más tinta lleva
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
 *
 * UN BUG QUE ESTE MAPA TENÍA Y QUE NO FALLABA. Antes listaba a Claudia, Dan
 * y Fátima. Erick sustituyó a Claudia el 15 oct 2026 y NO entró aquí; el
 * consumidor hace `COLOR_ASESOR[a] ?? GRIS` y ese gris de respaldo era
 * `SILVER[500]`… el mismo tono que ya tenía Fátima. **Dos de los tres
 * asesores se pintaban IGUAL en la barra apilada**, sin que fallara nada y
 * sin que la leyenda lo dijera. Se ve en la captura del 4 nov 2026.
 *
 * Los nombres son los de `ASESOR_CONFIG` (`lib/types.ts`), que es la fuente
 * única, y están LOS CUATRO para que nadie caiga al respaldo. Se escriben
 * aquí en vez de importarlos porque `tailwind.config.ts` importa este
 * archivo y arrastrar `lib/types.ts` a la configuración de Tailwind es
 * pedir un ciclo; a cambio, `mide-paleta-dashboard-claro.py` lee LOS DOS
 * archivos y falla si las dos listas dejan de coincidir.
 *
 * Los tonos NO se eligieron: salen de repartir la familia útil sobre blanco
 * en cuatro pasos. Par más apretado, 13.2 en OKLab — holgado sobre el 10.
 * El orden es el de `ASESOR_CONFIG` y no el de la vista: si fuera el de la
 * vista, filtrar un asesor repintaría a los que quedan.
 */
export const ASESOR: Record<string, string> = {
  'Fátima': '#339ECF',   //  3.03:1 sobre la tarjeta
  Dan:      '#23749D',   //  5.18:1
  Erick:    '#154C6E',   //  9.17:1
  Claudia:  '#082742',   // 15.23:1 — sin cartera, pero sale en el histórico
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
  stroke: BORDE,
  tick: { fill: TX.low, fontSize: FUENTE.eje },
  tickLine: false,
  axisLine: { stroke: 'rgba(16,53,93,0.18)' },
} as const

/**
 * Los TRES estilos del tooltip, siempre juntos.
 *
 * Sin `labelStyle` ni `itemStyle`, recharts pinta el texto con el color de la
 * serie — que aquí es un relleno de barra y sobre la tarjeta no se lee. Es un
 * error que ya costó una ronda en este repo.
 */
/**
 * EL TOOLTIP SIGUE SIENDO OSCURO, A PROPÓSITO — y por eso NO usa `TX`.
 *
 * Es la convención de la casa (`#0A1628` en los demás módulos): un tooltip
 * claro sobre una tarjeta clara se confunde con la tarjeta, y recharts arma
 * su contenido con `<p>` y `<span>` que heredan de donde caen.
 *
 * Lo que NO se puede hacer es dejarle los tokens del módulo: `TX.hi` ahora
 * es MARINO y sobre `NAVY[900]` mediría 1.4:1 — ilegible. Los tres estilos
 * van con blanco explícito, que es lo que corresponde a ese fondo, y el
 * acento de dentro es el cian vivo, que ahí sí mide (5.79:1).
 */
export const TOOLTIP = {
  contentStyle: {
    background: NAVY[900],
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: FUENTE.cuerpo,
    boxShadow: '0 12px 32px rgba(8,39,66,0.35)',
  },
  labelStyle: { color: TX_OSCURO.hi, fontWeight: 800, marginBottom: 6 },
  itemStyle:  { color: TX_OSCURO.mid },
} as const
