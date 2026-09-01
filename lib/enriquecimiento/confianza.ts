/**
 * Puntaje de confianza 0-100 y su nivel.
 *
 * El puntaje NO habilita ninguna promoción automática: aun con 100, el
 * candidato entra a la cola de revisión humana. Solo sirve para ordenar esa
 * cola y para que el KAM sepa cuánto peso tiene cada hallazgo.
 */
import type { FuenteTipo, NivelConfianza, EstadoVerificacion, CampoEnriquecible } from './tipos'

/** Base por tipo de fuente. `interno` va alto porque no es una inferencia
 *  externa: es un dato que el propio KAM ya capturó, mal ubicado en la ficha. */
const BASE_POR_FUENTE: Record<FuenteTipo, number> = {
  interno:          92,
  sitio_oficial:    88,
  apify:            72,
  directorio:       62,
  linkedin_publico: 60,
  buscador:         48,
}

/**
 * Campos donde un error cuesta caro operativamente (el KAM llamaría a un
 * número equivocado o escribiría a un correo ajeno): se penalizan para que
 * nunca lleguen a `confirmado` con una sola fuente débil.
 */
const PENALIZACION_CAMPO: Partial<Record<CampoEnriquecible, number>> = {
  contacto_email:        -8,
  contacto_tel:          -5,
  contacto_nombre:       -5,
  email_pattern_inferred: -60,   // un patrón nunca es un dato verificado
}

export interface EntradaPuntaje {
  fuente_tipo:      FuenteTipo
  campo:            CampoEnriquecible
  /** Fuentes independientes que afirman lo mismo (1 = solo una). */
  corroboraciones?: number
  /** El valor apareció literalmente en la evidencia (no fue deducido). */
  literal?:         boolean
  /** Antigüedad de la fuente en días, si se conoce. */
  antiguedad_dias?: number
}

export function puntuar(e: EntradaPuntaje): number {
  let p = BASE_POR_FUENTE[e.fuente_tipo] ?? 40

  const corr = Math.max(1, e.corroboraciones ?? 1)
  if (corr >= 2) p += 8
  if (corr >= 3) p += 4

  if (e.literal === false) p -= 15
  p += PENALIZACION_CAMPO[e.campo] ?? 0

  if (typeof e.antiguedad_dias === 'number') {
    if (e.antiguedad_dias > 730) p -= 10
    else if (e.antiguedad_dias > 365) p -= 5
  }

  return Math.max(0, Math.min(100, Math.round(p)))
}

export function nivelConfianza(score: number): NivelConfianza {
  if (score >= 90) return 'confirmado'
  if (score >= 70) return 'alta'
  if (score >= 40) return 'probable'
  return 'debil'
}

/**
 * Estado de verificación. Un proveedor puede imponer un techo (por ejemplo el
 * patrón de correo inferido, que jamás puede pasar de `no_verificado`).
 */
export function estadoVerificacion(
  score: number, techo?: EstadoVerificacion,
): EstadoVerificacion {
  const calculado: EstadoVerificacion =
    score >= 90 ? 'confirmado' : score >= 60 ? 'probable' : 'no_verificado'
  if (!techo) return calculado
  const orden: EstadoVerificacion[] = ['no_verificado', 'probable', 'confirmado']
  return orden.indexOf(calculado) <= orden.indexOf(techo) ? calculado : techo
}

/**
 * Invariante del módulo, escrita como función para poder probarla:
 * ningún puntaje autoriza escribir en el campo operativo del KAM.
 */
export function permitePromocionAutomatica(_score: number): false {
  return false
}
