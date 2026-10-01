/**
 * lib/health-score.ts — de qué está hecho el Health Score, y cuánto de él se midió.
 *
 * EL PROBLEMA
 * -----------
 * `health_score` es una columna GENERADA de Postgres:
 *
 *     0.35·score_actividad + 0.30·score_adopcion + 0.20·score_pago + 0.15·score_relacional
 *
 * Los cuatro bloques se mueven con cuatro deslizadores a mano y arrancan en 50.
 * Ese número pinta el semáforo, ordena la tabla de cuentas críticas, decide el
 * orden del lote de los lunes y entra en el contexto de Atlas. Medido el 1 de
 * octubre de 2026 sobre las 192 cuentas vivas:
 *
 *     bloque              peso   en el 50   valores   rango
 *     score_actividad      35%   102 (53%)      45    29-100
 *     score_adopcion       30%   101 (53%)      47     2-100
 *     score_pago           20%    93 (48%)       3    50-100
 *     score_relacional     15%    24 (12%)      60     0-82
 *
 * `score_relacional` es el único que tiene derivación viva —`lib/relacionamiento.ts`
 * lo calcula y `/api/relacionamiento` lo escribe—, y se nota: es el único que
 * casi nadie tiene en el valor por omisión.
 *
 * La consecuencia, en cuentas: **80 de las 192 tienen solo el 15% del peso
 * apoyado en dato capturado**, y **10 tienen los cuatro bloques en 50**, o sea
 * un Health Score de 50 enteramente fabricado. El promedio de peso medido es
 * 54%.
 *
 * QUÉ HACE ESTE MÓDULO
 * --------------------
 * Dos cosas, ninguna de ellas inventar una fórmula nueva:
 *
 * 1. **Dice cuánto del score está medido.** Un 52 sobre dato completo y un 52
 *    sobre tres deslizadores en 50 no son el mismo número, y hoy se pintan
 *    igual. Un indicador que no distingue entre «medí y da 52» y «no sé» hace
 *    que se decida sobre el segundo creyendo que es el primero.
 *
 * 2. **Deriva `score_adopcion`** de `adopcion_producto`, que desde la limpieza
 *    del 1 de octubre ya no tiene los 566 «No Aplica» por omisión. Usa la MISMA
 *    fórmula que la portada ya aplicaba para su matriz —alto 100, medio 50,
 *    bajo 0, promediado sobre los productos CONTRATADOS—, no una nueva.
 *
 * LO QUE NO HACE, Y POR QUÉ
 * -------------------------
 * No deriva `score_actividad` ni `score_pago`. Hay señales vivas que podrían
 * alimentarlos —días sin contacto, volumen de llamadas, consumo contra plan,
 * incidencias de pago—, pero **qué mide cada bloque y con qué umbrales es una
 * decisión de negocio, no técnica**. Inventarla aquí sería cambiar en silencio
 * el número que ordena el trabajo de tres personas.
 */

/** Los cuatro bloques y su peso en el Health Score, tal como los define el
 *  `GENERATED ALWAYS AS` de `supabase/schema.sql`. Si ahí cambian, cambian aquí. */
export const BLOQUES_HS = [
  { campo: 'score_actividad',  peso: 0.35, label: 'Actividad'  },
  { campo: 'score_adopcion',   peso: 0.30, label: 'Adopción'   },
  { campo: 'score_pago',       peso: 0.20, label: 'Pago'       },
  { campo: 'score_relacional', peso: 0.15, label: 'Relacional' },
] as const

/** El valor con el que nace cada bloque. No es una medición: es un marcador. */
export const DEFAULT_BLOQUE = 50

export interface PesoMedido {
  /** Fracción del Health Score apoyada en dato capturado, de 0 a 1. */
  fraccion: number
  /** Los bloques que siguen en el valor por omisión. */
  sinMedir: string[]
}

/**
 * Cuánto del Health Score de esta cuenta descansa en dato capturado.
 *
 * Un bloque en 50 clavado se cuenta como NO medido. Es una heurística y hay que
 * decirlo: una cuenta cuya actividad valga exactamente 50 de verdad se contaría
 * como sin medir. El sesgo va del lado seguro —declara menos certeza de la que
 * hay, nunca más— y la alternativa, que sería una columna «medido» por bloque,
 * es un cambio de esquema que vale la pena solo si esto resulta corto.
 */
export function pesoMedido(c: Record<string, unknown>): PesoMedido {
  let fraccion = 0
  const sinMedir: string[] = []
  for (const b of BLOQUES_HS) {
    const v = c[b.campo]
    if (typeof v === 'number' && v !== DEFAULT_BLOQUE) fraccion += b.peso
    else sinMedir.push(b.label)
  }
  return { fraccion, sinMedir }
}

/** «Medido al 85%» / «Medido al 15% — Actividad, Adopción y Pago sin capturar». */
export function textoPesoMedido(p: PesoMedido): string {
  const pct = Math.round(p.fraccion * 100)
  if (!p.sinMedir.length) return 'Medido al 100%'
  const lista = p.sinMedir.length === 1
    ? p.sinMedir[0]
    : `${p.sinMedir.slice(0, -1).join(', ')} y ${p.sinMedir[p.sinMedir.length - 1]}`
  return `Medido al ${pct}% — ${lista} sin capturar`
}

/* ── Derivación de `score_adopcion` ─────────────────────────────────────── */

/** Lo que vale cada nivel. Es la escala que la portada ya usaba para su matriz
 *  de adopción (`app/page.tsx`), no una nueva: alto 100, medio 50, bajo 0. */
const VALOR_NIVEL: Record<string, number> = { alto: 100, medio: 50, bajo: 0 }

/**
 * El score de adopción de una cuenta, 0 a 100, o `null` si no hay nada medible.
 *
 * Solo entran los productos CONTRATADOS. `no_aplica` queda fuera del promedio:
 * es un producto que el cliente no tiene, no una adopción baja — la misma regla
 * que el Radar aplica desde el 1 de octubre de 2026.
 *
 * `null` cuando no hay ni un producto contratado evaluado. **No devuelve 0**:
 * un cero aquí arrastraría el 30% del Health Score hacia abajo por falta de
 * captura, que es justo lo contrario de lo que debe pasar.
 *
 * @param filas  las filas VIGENTES de la cuenta: la última por producto.
 */
export function scoreAdopcionDe(
  filas: Array<{ producto: string; nivel: string }>,
): number | null {
  const valores = filas
    .filter(f => f.nivel in VALOR_NIVEL)
    .map(f => VALOR_NIVEL[f.nivel])
  if (!valores.length) return null
  return Math.round(valores.reduce((s, v) => s + v, 0) / valores.length)
}

/** La última fila por producto, que es lo que `scoreAdopcionDe` espera.
 *  Mismo criterio que el panel de la ficha, la portada y el Radar. */
export function filasVigentes<T extends { producto: string; fecha?: string | null; created_at?: string | null }>(
  filas: T[],
): T[] {
  const orden = [...filas].sort((a, b) =>
    String(b.fecha ?? '').localeCompare(String(a.fecha ?? '')) ||
    String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
  const vistos = new Set<string>()
  return orden.filter(f => {
    if (vistos.has(f.producto)) return false
    vistos.add(f.producto)
    return true
  })
}
