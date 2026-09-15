/**
 * lib/plan-minutos.ts
 * Cuántos minutos incluye realmente un plan, y sobre qué base se mide el consumo.
 *
 * REGLA DE NEGOCIO (dirección, 14 sep 2026): hay planes con minutos —una bolsa—
 * y planes por extensiones. En los de extensiones se cuentan **1,500 minutos por
 * extensión**.
 *
 * POR QUÉ HACE FALTA. En los planes de extensiones ilimitadas la columna
 * «Minutos Incluidos» del archivo no trae minutos: trae 1. El archivo calcula
 * entonces su «% Consumo» dividiendo entre 1, y publica cosas como 3,417,300%.
 * En la ficha de cuenta eso salía como «1 min incluidos», que es falso: ese plan
 * son 13 extensiones, o sea 19,500 minutos, y el consumo real es 175%.
 *
 * CUÁNDO APLICA Y CUÁNDO NO. No basta con que el plan mencione extensiones:
 * «50 Extensiones Visibilidad y Control IP» de LI Financiera trae una bolsa real
 * de 12,500 minutos y su 6.82% del archivo es correcto. Aplicarle ×1500 a ciegas
 * la bajaría a 1.14% e inventaría holgura que no existe.
 *
 * El discriminante sale de los datos, no de una corazonada. Midiendo minutos por
 * extensión sobre los 2,624 cortes que mencionan extensiones aparece un hueco
 * limpio:
 *
 *     ≤ 1 min/ext   2,213 filas   (2,199 son de extensiones ilimitadas)
 *     1 – 10            41
 *     10 – 50           16
 *     ─────────────── el hueco ───────────────
 *     50 – 200          38        (36 de planes NO ilimitados)
 *     200 – 500        190        (187 de planes NO ilimitados)  ← LI Financiera, 250/ext
 *     > 500            126        (124 de planes NO ilimitados)
 *
 * Debajo del hueco el número no puede ser una bolsa —nadie contrata 1 minuto
 * para 13 extensiones—; encima, sí lo es. De ahí `MIN_POR_EXT_PLAUSIBLE`.
 *
 * El % SIEMPRE se recalcula aquí. El del archivo no se usa nunca.
 */

/** Minutos que aporta cada extensión en un plan por extensiones. */
export const MINUTOS_POR_EXTENSION = 1500

/**
 * Debajo de esto, «Minutos Incluidos» no puede ser una bolsa de minutos.
 * Es la frontera del hueco observado en los datos, no un número elegido a gusto.
 */
const MIN_POR_EXT_PLAUSIBLE = 50

/** «3 Extensiones …», «1 Extensión …», «VyC 8 ext ilimitadas», «AV 10 Extensiones …». */
const RX_EXTENSIONES = /(\d+)\s*(?:extensi[oó]n(?:es)?|ext\b)/i

/**
 * Algunos planes se abrevian y omiten la palabra: «10 Visibilidad y Control IL»
 * son 10 extensiones. Solo cuenta cuando el número abre el nombre Y el plan
 * está marcado IL, para no confundirlo con «VILLAUTOS ARAGON 2 números
 * virtuales» —el 2 va a media frase y no son extensiones— ni con «AV 1,000 min
 * Agente Virtual». El propio archivo lo confirma: 4,559 consumidos al 30.39%
 * implican una base de 15,002, que es 10 × 1,500.
 */
const RX_EXT_ABREVIADO = /^(\d+)\s+\S.*\bIL\b/i

/** Planes que no consumen minutos de voz: no se les mide consumo. */
const RX_SIN_VOZ = /\bchat\b|\bagentes?\s+cp\b|sin\s+saldo|n[uú]meros?\s+virtuales?|whatsapp/i

/**
 * Debajo de esto, «Minutos Incluidos» no es una bolsa: es un marcador. Nadie
 * contrata un plan de uno o dos minutos. Sin extensiones que aplicar, la cuenta
 * se queda sin base y se dice «sin minutos medibles» en vez de inventar una.
 */
const BOLSA_MINIMA = 3

export type OrigenBase = 'extensiones' | 'bolsa' | 'sin_medicion'

export interface BaseMinutos {
  /** Minutos contra los que se mide el consumo. `null` = no se puede medir. */
  base: number | null
  /** Extensiones leídas del nombre del plan, si las declara. */
  extensiones: number | null
  /** De dónde salió `base`, para poder decirlo en pantalla. */
  origen: OrigenBase
  /** Lo que traía el archivo, por si hay que mostrar la discrepancia. */
  inclArchivo: number
}

/**
 * La base de minutos de un corte.
 *
 * @param plan  nombre del plan tal como viene en el archivo
 * @param incl  columna «Minutos Incluidos» del archivo
 */
export function baseMinutos(plan: string | null | undefined, incl: number): BaseMinutos {
  const nombre = String(plan ?? '')
  const m = RX_EXTENSIONES.exec(nombre) ?? RX_EXT_ABREVIADO.exec(nombre)
  const ext = m ? parseInt(m[1], 10) : null
  const vacio = { extensiones: ext, inclArchivo: incl }

  if (RX_SIN_VOZ.test(nombre) && !ext) {
    return { base: null, origen: 'sin_medicion', ...vacio }
  }
  if (ext && ext > 0) {
    // Con extensiones declaradas, el archivo solo se cree si su valor puede
    // ser de verdad una bolsa de minutos.
    const porExt = incl > 0 ? incl / ext : 0
    if (porExt >= MIN_POR_EXT_PLAUSIBLE) {
      return { base: incl, origen: 'bolsa', ...vacio }
    }
    return { base: ext * MINUTOS_POR_EXTENSION, origen: 'extensiones', ...vacio }
  }
  if (incl >= BOLSA_MINIMA) return { base: incl, origen: 'bolsa', ...vacio }
  return { base: null, origen: 'sin_medicion', ...vacio }
}

/** % de consumo sobre la base real. `null` cuando no hay base contra la cual medir. */
export function pctConsumo(plan: string | null | undefined, incl: number, cons: number): number | null {
  const { base } = baseMinutos(plan, incl)
  return base && base > 0 ? (100 * cons) / base : null
}

/** Cómo se nombra la base en pantalla: «19,500 min incluidos (13 ext × 1,500)». */
export function etiquetaBase(b: BaseMinutos): string {
  if (b.base === null) return 'sin minutos medibles'
  const n = b.base.toLocaleString('es-MX')
  return b.origen === 'extensiones' && b.extensiones
    ? `${n} min incluidos (${b.extensiones} ext × ${MINUTOS_POR_EXTENSION.toLocaleString('es-MX')})`
    : `${n} min incluidos`
}
