/**
 * AGRUPAR LA COLA POR CUENTA — las tres reglas, fuera de la pantalla
 *
 * ── POR QUÉ UN MÓDULO Y NO TRES FUNCIONES DENTRO DEL COMPONENTE ───────────
 *
 * `components/CompromisosSla.tsx` es `'use client'` y arrastra `next/link` y
 * `lucide-react`: nada de lo que vive ahí se puede importar desde `ts-node`, así
 * que una regla escrita ahí dentro sólo se puede comprobar MIRANDO la pantalla.
 * Estas tres se pueden medir, y por eso salen: `scripts/test-agrupa-cuenta.ts`
 * las corre con casos que incluyen los que NO deben pasar.
 * [[feedback-probar-al-reves]]
 *
 * ── LAS TRES REGLAS ───────────────────────────────────────────────────────
 *
 * 1. Agrupar NO reordena: cada cuenta toma el sitio de su primera alerta.
 * 2. Agrupar NO pierde ni funde: entran N alertas y salen N.
 * 3. El nivel de la cuenta es el PEOR de sus alertas, nunca el promedio ni el
 *    de la primera que llegó.
 *
 * Los tipos son estructurales a propósito: aquí no se importa `FilaSla` —que
 * vive en el componente de cliente— ni `NivelSemaforo`. Lo que estas funciones
 * necesitan es un `cuenta_id` y un `semaforo.orden`, y pedir sólo eso es lo que
 * permite probarlas con objetos de tres campos.
 */

export interface GrupoDe<T> {
  cuenta_id: string
  filas: T[]
}

/**
 * Junta las alertas de una misma cuenta RESPETANDO el orden de entrada.
 *
 * La cola llega ya ordenada por la ruta (`ordenaCola`: semáforo y luego dinero
 * descendente, con la clase «paga más de lo que usa» delante). Cada cuenta toma
 * la posición de su PRIMERA alerta, que por ese orden es la más urgente que
 * tiene: agrupar no asciende ni degrada a nadie, las demás alertas de la cuenta
 * suben a hacerle compañía a la peor.
 *
 * Reordenar aquí sería una SEGUNDA implementación del orden de la cola, y la
 * que mandaría sería la que alguien edite primero.
 */
export function agrupaPorCuenta<T extends { cuenta_id: string }>(
  filas: readonly T[],
): Array<GrupoDe<T>> {
  const orden: string[] = []
  const por = new Map<string, T[]>()
  for (const f of filas) {
    const k = String(f.cuenta_id)
    const ya = por.get(k)
    if (ya) ya.push(f)
    else { por.set(k, [f]); orden.push(k) }
  }
  return orden.map(k => ({ cuenta_id: k, filas: por.get(k) as T[] }))
}

/**
 * La PEOR alerta del grupo. `orden` menor = más urgente (`ORDEN` en
 * `lib/alertas-sla.ts`: rojo intenso 0 … cerrada 7).
 *
 * Es el nivel que lleva la tarjeta. Un promedio diría «dos tercios bien» de una
 * cuenta con una incumplida y dos en tiempo, y es la misma regla con la que el
 * banner elige su color.
 *
 * Empate: se queda la PRIMERA, que por el orden de la cola es la de más dinero.
 */
export function peorDe<T extends { semaforo: { orden: number } }>(
  filas: readonly T[],
): T {
  if (filas.length === 0) {
    /* Un grupo vacío no existe —`agrupaPorCuenta` sólo crea uno al meterle una
       fila—, y si algún día existiera, devolver `undefined` haría reventar la
       pantalla tres líneas más abajo con un mensaje que no dice nada. */
    throw new Error('peorDe: no hay alertas en el grupo')
  }
  return filas.reduce((a, b) => (b.semaforo.orden < a.semaforo.orden ? b : a))
}

export interface ConteoNivel<N> {
  /** La palabra tal como la publica la fila, sin traducir de nuevo. */
  etiqueta: string
  n: number
  nivel: N
  orden: number
}

/**
 * El desglose por nivel de un grupo, del peor al mejor.
 *
 * LA SUMA CIERRA: `porNivel(filas)` suma exactamente `filas.length`. No hay
 * cubo «otros» porque no hay filtro — toda alerta tiene etiqueta—, y eso es lo
 * que comprueba la prueba. [[feedback-tablas-deben-cerrar]]
 *
 * Las palabras salen de `etiquetaNivel`, que ya viene en cada fila. Traducir
 * aquí los ocho niveles a texto sería un segundo diccionario de los mismos
 * valores, y el día que uno cambie quedarían dos pantallas diciendo cosas
 * distintas del mismo color.
 */
/* EL NIVEL SALE POR ACCESO INDEXADO, no por un segundo parámetro genérico.
   Escrito como `<N extends string, T extends { semaforo: { nivel: N } }>`, con
   `N` metido dos niveles dentro de `T`, TypeScript no lo deduce de la fila: lo
   ensancha a `string` y entonces `tonoSla(v.nivel, …)` deja de compilar en la
   pantalla. Con `T['semaforo']['nivel']` el tipo viaja entero desde la fila. */
export function porNivel<
  T extends { etiquetaNivel: string; semaforo: { nivel: string; orden: number } },
>(filas: readonly T[]): Array<ConteoNivel<T['semaforo']['nivel']>> {
  type N = T['semaforo']['nivel']
  const m = new Map<string, ConteoNivel<N>>()
  for (const f of filas) {
    const ya = m.get(f.etiquetaNivel)
    if (ya) ya.n += 1
    else {
      m.set(f.etiquetaNivel, {
        etiqueta: f.etiquetaNivel, n: 1,
        nivel: f.semaforo.nivel, orden: f.semaforo.orden,
      })
    }
  }
  return Array.from(m.values()).sort((a, b) => a.orden - b.orden)
}
