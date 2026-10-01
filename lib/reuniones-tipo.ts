/**
 * Qué tipos de reunión llevan cuenta vinculada, y en cuáles es obligatoria.
 *
 * ── POR QUÉ ESTE ARCHIVO EXISTE ───────────────────────────────────────────
 * La regla vivía SOLO en `app/reuniones/page.tsx`. El formulario mostraba el
 * combo de cliente y prometía por escrito «Contará en el relacionamiento y en
 * el Health Score de la cuenta», pero `app/api/reuniones/route.ts` tenía su
 * propia copia de la regla — `const esCliente = tipo === 'cliente'` — y
 * escribía `cuenta_id: esCliente ? cuenta_id : null`.
 *
 * Es decir: el servidor TIRABA el vínculo de toda reunión que no fuera de tipo
 * cliente, y devolvía 200. El usuario elegía la cuenta, veía el mensaje verde y
 * la reunión se guardaba huérfana.
 *
 * Medido el 1 oct 2026 sobre las 83 reuniones de la tabla: las 28 de tipo
 * `cliente` están vinculadas y las 55 restantes —16 estrategia, 11 junta
 * semanal, 22 one_on_one, 6 otro— NINGUNA lo está. Es el mismo defecto que la
 * migración de septiembre arregló para las de cliente, repetido en los otros
 * cuatro tipos.
 *
 * Por eso la regla es una sola y la importan los dos lados. Duplicarla fue la
 * causa; dejarla duplicada «pero ahora igual» sería volver a sembrarla.
 */

export type TipoReunion = 'junta_semanal' | 'one_on_one' | 'cliente' | 'estrategia' | 'otro'

/**
 * Instrucción de dirección, 30 sep 2026: «en todas debes tener el combo de
 * elección de cliente, salvo en el caso de One To One». Una junta semanal o una
 * de estrategia pueden ser SOBRE una cuenta, y antes no había dónde decirlo.
 *
 * El One To One es entre dos personas de la casa. No tiene cuenta, y ofrecerla
 * sería invitar a inventarse una.
 */
const SIN_CUENTA: ReadonlySet<string> = new Set<TipoReunion>(['one_on_one'])

/** Mostrar el combo no es lo mismo que exigirlo. */
export function llevaCuenta(t: string | null | undefined): boolean {
  return !SIN_CUENTA.has((t ?? '') as TipoReunion)
}

/**
 * Sólo la reunión CON CLIENTE obliga. En las demás la cuenta es opcional a
 * propósito: una junta semanal puede ser sobre una cuenta o sobre el equipo, y
 * exigirla forzaría a elegir una cualquiera con tal de poder guardar — que es
 * peor que no tenerla.
 */
export function exigeCuenta(t: string | null | undefined): boolean {
  return t === 'cliente'
}

/**
 * Si la reunión fue CON el cliente, o sólo SOBRE el cliente.
 *
 * El bloque de 15 puntos del relacionamiento se llama «Reuniones con el
 * cliente» y mide exactamente eso: que el cliente estuvo en la sala. Una sesión
 * interna de estrategia sobre una cuenta pertenece a la ficha —es contexto
 * real— pero NO es evidencia de relación y no debe subir el Health Score.
 * Sin esta distinción, permitir el vínculo en los otros tipos habría inflado
 * `score_relacional` el mismo día que se arregló el guardado.
 */
export function esConElCliente(t: string | null | undefined): boolean {
  return t === 'cliente'
}

export const ETIQUETA_TIPO: Record<TipoReunion, string> = {
  junta_semanal: 'Junta Semanal',
  one_on_one:    'One To One',
  cliente:       'Con Cliente',
  estrategia:    'Estrategia',
  otro:          'Otro',
}

export function etiquetaTipo(t: string | null | undefined): string {
  return ETIQUETA_TIPO[(t ?? '') as TipoReunion] ?? 'Otro'
}
