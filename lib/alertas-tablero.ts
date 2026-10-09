import { FUENTES, type CuentaConVeredicto, type ClaveFuente } from '@/lib/alertas-estado'
import { SITUACION, type Situacion, type ClaseHallazgo } from '@/lib/alertas-veredicto'

/**
 * lib/alertas-tablero.ts — LO QUE EL DASHBOARD NECESITA DE ALERTAS, Y NADA MÁS
 *
 * Instrucción de dirección, 8 oct 2026, con captura del Dashboard en la mano:
 * *«lo que debe existir en el Dashboard son gráficas del tema en cuestión, con
 * los combos que permita elegir datos para obtener data»*. El Dashboard deja
 * de REPETIR la lista de `/alertas` y pasa a analizarla.
 *
 * ── POR QUÉ UNA PROYECCIÓN Y NO LAS FILAS ────────────────────────────────
 *
 * `veredictosDeCartera()` devuelve 431 KB para 192 cuentas, y 110 de esos KB
 * son el campo `prueba` de cada hallazgo —el texto que sostiene cada uno— más
 * 47 KB de `accion` y `porque`. Todo eso es para la FICHA, donde se lee una
 * cuenta; una gráfica no lee ninguno de los tres.
 *
 * Aquí se mandan las dimensiones y los hallazgos como ÍNDICES contra un
 * catálogo de 28 títulos que viaja una sola vez. Medido: **63 KB, un 85%
 * menos**. En una portada que ya carga seis secciones, eso se nota.
 *
 * ── LO QUE NO SE PROYECTA, A PROPÓSITO ───────────────────────────────────
 *
 * `dueno` vale `'asesor'` en las 192 cuentas: ninguna ruta de `veredictoDe`
 * produce `'direccion'`. Como eje sería una sola barra. Si algún día el motor
 * empieza a repartir dueño, aquí es donde entra.
 */

/** El catálogo de hallazgos: su clase y su título, una vez para todas. */
export interface TituloHallazgo {
  clase: ClaseHallazgo
  titulo: string
}

/** Una cuenta, con lo justo para poder agruparla, filtrarla y medirla. */
export interface FilaTablero {
  id: string
  empresa: string
  asesor: string | null
  /** `null` = no hay importe en ninguna fuente. NO es cero. */
  mrr: number | null
  esTop: boolean
  situacion: Situacion
  /** Cuántas de las ocho fuentes tienen dato. Se deriva de `fuentes`. */
  nFuentes: number
  /** Cuáles, en el orden de `FUENTES`. */
  fuentes: boolean[]
  relacionNivel: string
  /** La candidatura de CRECIMIENTO, si tiene. `null` NO significa «no es
   *  candidata a nada»: puede tener candidatura de estabilizar o reactivar,
   *  que son de resolver y no de crecer. Por eso viaja también el total. */
  candidatura: string | null
  /** Cuántas candidaturas tiene en total, de crecer y de resolver. */
  candidaturasTotal: number
  /** Índices contra `catalogo`. */
  hallazgos: number[]
}

export interface PayloadTablero {
  catalogo: TituloHallazgo[]
  filas: FilaTablero[]
  /** Las ocho fuentes con su etiqueta y a quién se le pide lo que falta. */
  fuentes: { k: ClaveFuente; etiqueta: string; pedirA: string }[]
  /** Título y orden de cada situación, para no declararlos dos veces.
   *
   *  EL COLOR NO VIAJA AQUÍ, y es a propósito. Salía de
   *  `LUZ[SITUACION[k].luz].color`, y la luz NO es única por situación:
   *  `no_la_vemos` y `sin_auditar` son las dos «amarillo» y `oportunidad` y
   *  `en_orden` las dos «verde». En el semáforo de `/alertas` eso da igual
   *  —cada mosaico lleva su título al lado—, pero en una barra APILADA son
   *  dos bloques que se tocan sin frontera: 152 de 192 cuentas en un solo
   *  amarillo con dos pastillas idénticas en la leyenda. La paleta de la
   *  gráfica la declara la gráfica, medida contra su propio fondo
   *  (`scripts/mide-paleta-situaciones.py`). */
  situaciones: { k: Situacion; titulo: string; orden: number }[]
  /** DE QUIÉN es lo que se está viendo. Sin esto la cabecera rotulaba
   *  «Cartera completa» también en la sesión de un asesor, que ve 68 de 192:
   *  el alcance lo decide `page.tsx` con el encabezado de la sesión y la
   *  pantalla no tiene forma de saberlo mirando las filas. */
  alcance: { asesor: string | null }
  /** Si una fuente no cargó, se dice. Un cero aquí se leería como «no hay
   *  riesgo», que es la mentira más cara que puede contar este tablero. */
  falla: string | null
}

export function proyectaTablero(
  cuentas: CuentaConVeredicto[],
  falla: string | null,
  alcance: { asesor: string | null } = { asesor: null },
): PayloadTablero {
  const indice = new Map<string, number>()
  const catalogo: TituloHallazgo[] = []

  const filas: FilaTablero[] = cuentas.map(c => {
    const hallazgos: number[] = []
    for (const h of c.veredicto.hallazgos) {
      const clave = `${h.clase}\u0000${h.titulo}`
      let i = indice.get(clave)
      if (i === undefined) {
        i = catalogo.length
        indice.set(clave, i)
        catalogo.push({ clase: h.clase, titulo: h.titulo })
      }
      hallazgos.push(i)
    }
    return {
      id: c.cuentaId,
      empresa: c.empresa,
      asesor: c.asesor,
      mrr: c.mrr,
      esTop: c.esTop,
      situacion: c.veredicto.situacion,
      nFuentes: c.datos.fuentes,
      fuentes: FUENTES.map(f => c.datos.fuentesDetalle[f.k]),
      relacionNivel: c.datos.relacionNivel,
      candidatura: c.datos.candidatura,
      candidaturasTotal: c.datos.candidaturasTotal,
      hallazgos,
    }
  })

  return {
    catalogo,
    filas,
    fuentes: FUENTES.map(f => ({ k: f.k, etiqueta: f.etiqueta, pedirA: f.pedirA })),
    situaciones: (Object.keys(SITUACION) as Situacion[])
      .map(k => ({ k, titulo: SITUACION[k].titulo, orden: SITUACION[k].orden }))
      .sort((a, b) => a.orden - b.orden),
    alcance,
    falla,
  }
}
