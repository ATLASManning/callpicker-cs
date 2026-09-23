import { AAA_GRC_FLAT } from '@/app/churn/aaa-grc-data'

/**
 * Churn y Downgrade acumulados del año, por asesor (Ejecutivo CS).
 *
 * POR QUÉ VIVE AQUÍ Y NO EN LA TARJETA
 * ------------------------------------
 * La misma cuenta la necesitan la carátula del asesor y la concentración de
 * GRC AAA. Si cada una lo sumara por su lado, un día dirían cifras distintas
 * sobre la misma pregunta y nadie sabría cuál creer.
 *
 * QUÉ CUENTA Y QUÉ NO
 * -------------------
 * · TODAS las clasificaciones (AAA, AA, A, B, C). La concentración de GRC AAA
 *   se acota a AAA y AA por instrucción expresa; la carátula del asesor no:
 *   ahí la pregunta es «cuánto perdió de SU cartera», y su cartera no es solo
 *   AAA. Son dos preguntas distintas y por eso dan números distintos.
 * · «Churn confirmado + Fraude» cuenta como churn: es la misma baja.
 * · El importe es el INGRESO PERDIDO REAL, que es lo que alimenta el GRC. El
 *   fraude/reestructura se lleva aparte y no se suma.
 *
 * LO QUE NO SE ATRIBUYE
 * ---------------------
 * El export de GRC viene de Zoho sin CID, así que el asesor se resuelve por
 * nombre contra la cartera más la tabla de alias confirmados. Lo que no
 * resuelve NO se reparte: se devuelve en `sinAtribuir` para que quien lo pinte
 * pueda decirlo. Repartir un churn entre los tres asesores porque no se supo
 * de quién era sería inventar tres atribuciones falsas en vez de una.
 */

export type ChurnAsesor = {
  churns: number
  mrrChurn: number
  downgrades: number
  mrrDowngrade: number
  /** Suma de los dos importes: lo que se le fue de la cartera en el período. */
  mrrTotal: number
}

export type ResumenChurnAsesor = {
  porAsesor: Record<string, ChurnAsesor>
  /** Eventos cuyo cliente no se pudo atribuir a ningún asesor. */
  sinAtribuir: number
  mrrSinAtribuir: number
  /** Meses que cubre el corte, en orden de calendario. */
  meses: string[]
  /** true mientras no haya llegado el mapa de asesores: aún no se puede sumar. */
  cargando: boolean
}

const CALENDARIO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const MESES_GRC: string[] = CALENDARIO.filter(
  m => AAA_GRC_FLAT.some(r => r.mes === m))

export const PERIODO_GRC: string =
  MESES_GRC.length ? `${MESES_GRC[0]}–${MESES_GRC[MESES_GRC.length - 1]} 2026` : '—'

function vacio(): ChurnAsesor {
  return { churns: 0, mrrChurn: 0, downgrades: 0, mrrDowngrade: 0, mrrTotal: 0 }
}

/**
 * @param resolver función nombre-de-GRC → asesor, la de
 *   `construirResolutor` en lib/grc-asesor-alias.ts. `null` significa que
 *   todavía no se puede resolver: se devuelve todo en cero con
 *   `cargando: true` en vez de fingir que no hubo churn.
 */
export function churnPorAsesor(
  resolver: ((nombreGrc: string) => string | null) | null,
): ResumenChurnAsesor {
  const porAsesor: Record<string, ChurnAsesor> = {}
  let sinAtribuir = 0
  let mrrSinAtribuir = 0

  if (resolver) {
    for (const r of AAA_GRC_FLAT) {
      const mov = r.movimiento ?? ''
      const esChurn = mov.startsWith('Churn confirmado')
      const esDowngrade = mov === 'Downgrade'
      if (!esChurn && !esDowngrade) continue

      const asesor = resolver(r.cliente)
      if (!asesor) {
        sinAtribuir++
        mrrSinAtribuir += r.perdido ?? 0
        continue
      }
      const acc = porAsesor[asesor] ?? (porAsesor[asesor] = vacio())
      if (esChurn) { acc.churns++; acc.mrrChurn += r.perdido ?? 0 }
      else         { acc.downgrades++; acc.mrrDowngrade += r.perdido ?? 0 }
      acc.mrrTotal = acc.mrrChurn + acc.mrrDowngrade
    }
  }

  return {
    porAsesor, sinAtribuir, mrrSinAtribuir,
    meses: MESES_GRC, cargando: resolver === null,
  }
}

/** Lo de un asesor, sin tener que comprobar si existe la llave. */
export function deAsesor(r: ResumenChurnAsesor, asesor: string): ChurnAsesor {
  return r.porAsesor[asesor] ?? vacio()
}
