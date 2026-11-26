/**
 * lib/dias-habiles.ts — ARITMÉTICA DE PLAZOS EN DÍAS HÁBILES
 *
 * ── POR QUÉ NO SE CUENTAN DÍAS NATURALES ──────────────────────────────────
 *
 * Un plazo de un día natural sobre una alerta crítica abierta el viernes vence
 * el sábado, y el sábado nadie llama a un cliente. El lunes la alerta ya está
 * en rojo intenso por un fin de semana. Un reloj que castiga por existir se
 * deja de mirar, y entonces deja de servir también para lo que sí es urgente.
 *
 * ── Y POR QUÉ «HÁBIL» NO ES «NO ES FIN DE SEMANA» ─────────────────────────
 *
 * El 16 de noviembre de 2026 fue LUNES y fue festivo —Revolución Mexicana, que
 * cae el tercer lunes del mes—. Con sólo la regla del fin de semana, una alerta
 * crítica abierta el viernes 13 habría vencido un día que nadie trabajó, y el
 * martes 17 habría amanecido vencida.
 *
 * Los festivos NO se tecleen aquí: viven en `public.dias_inhabiles`, que es
 * configurable por administración —los puentes de empresa no son festivos de
 * ley y los decide dirección—. Una lista escrita en el código sería un espejo
 * de la tabla, y un espejo tecleado a mano deja de ser espejo en cuanto alguien
 * cambia uno de los dos lados. [[feedback-verificar-antes-asegurar]]
 *
 * ── ESTE ARCHIVO NO IMPORTA NADA, Y NO ES UN DETALLE ──────────────────────
 *
 * Todo lo que calcula recibe el conjunto de inhábiles COMO ARGUMENTO, y el
 * lector de la tabla vive aparte en `lib/dias-inhabiles-fuente.ts`.
 *
 * La primera versión tenía las dos mitades juntas, y el `import` de
 * `lib/supabase.ts` la volvió IMPROBABLE: ese módulo construye un
 * `RealtimeClient` al cargarse, que en Node 20 exige WebSocket nativo y revienta
 * fuera de Next. O sea que la aritmética de plazos —lo único de todo este
 * encargo que se puede comprobar sin base de datos— no se podía comprobar, y
 * por una dependencia que no usaba. `npm run test:sla` la corre entera.
 */

/** Las fechas de este módulo son siempre «YYYY-MM-DD» en el calendario de México. */
export type Dia = string

const MS_DIA = 86_400_000

function aUTC(d: Dia): number {
  return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
}

function aDia(t: number): Dia {
  const d = new Date(t)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
       + `-${String(d.getUTCDate()).padStart(2, '0')}`
}

/**
 * Sábado o domingo.
 *
 * Se mira con `getUTCDay()` sobre una fecha construida con `Date.UTC`, no con
 * `new Date('2026-11-21').getDay()`: eso último interpreta la cadena como
 * medianoche UTC y la imprime en la zona del proceso, así que en México
 * devuelve el día ANTERIOR. Es el mismo desfase que `lib/fecha-local.ts`
 * documenta, y aquí convertiría un viernes en jueves.
 */
export function esFinDeSemana(d: Dia): boolean {
  const dow = new Date(aUTC(d)).getUTCDay()
  return dow === 0 || dow === 6
}

export function esHabil(d: Dia, inhabiles: ReadonlySet<Dia>): boolean {
  return !esFinDeSemana(d) && !inhabiles.has(d)
}

/** El primer día hábil que no es anterior a `d`. Si `d` ya es hábil, es `d`. */
export function siguienteHabil(d: Dia, inhabiles: ReadonlySet<Dia>): Dia {
  let t = aUTC(d)
  for (let i = 0; i < 400; i++) {
    const x = aDia(t)
    if (esHabil(x, inhabiles)) return x
    t += MS_DIA
  }
  /* 400 iteraciones son más de un año de festivos seguidos: si se agota, el
     calendario está mal cargado y devolver la fecha original es menos dañino
     que un bucle infinito en una ruta de servidor. */
  return d
}

/**
 * `n` días hábiles DESPUÉS de `desde`.
 *
 * `n = 1` sobre un viernes devuelve el lunes; si ese lunes es festivo, el
 * martes. `desde` no cuenta aunque sea hábil: el día en que se abre la alerta
 * no es un día de plazo, es el día cero.
 */
export function sumaDiasHabiles(
  desde: Dia, n: number, inhabiles: ReadonlySet<Dia>,
): Dia {
  if (n <= 0) return siguienteHabil(desde, inhabiles)
  let t = aUTC(desde)
  let quedan = n
  for (let i = 0; i < 400 && quedan > 0; i++) {
    t += MS_DIA
    if (esHabil(aDia(t), inhabiles)) quedan--
  }
  return aDia(t)
}

/**
 * Días hábiles transcurridos de `a` a `b`, contando `b` y no `a`.
 *
 * Devuelve 0 cuando `b <= a`, y nunca un negativo: el signo lo decide quien
 * llama, que es el único que sabe qué está midiendo —lo que falta o lo que se
 * pasó—. Un número con signo escondido dentro es la clase de dato que se
 * imprime al revés en una pantalla.
 */
export function diasHabilesEntre(
  a: Dia, b: Dia, inhabiles: ReadonlySet<Dia>,
): number {
  if (b <= a) return 0
  let t = aUTC(a)
  const fin = aUTC(b)
  let n = 0
  while (t < fin) {
    t += MS_DIA
    if (esHabil(aDia(t), inhabiles)) n++
  }
  return n
}

export interface Calendario {
  inhabiles: ReadonlySet<Dia>
  /** Cuántos festivos se leyeron. Cero con `falla: null` es un calendario vacío
   *  de verdad —la tabla existe y está sin sembrar—, que no es lo mismo. */
  cuantos: number
  falla: string | null
}
