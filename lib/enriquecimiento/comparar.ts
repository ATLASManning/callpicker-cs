/**
 * Comparación de un hallazgo contra el dato que ya capturó el KAM.
 *
 * Esta capa decide el VEREDICTO (coincide / complementa / conflicto / nuevo /
 * sin evidencia) y la acción propuesta. Nunca modifica el valor original: solo
 * lo lee y lo fotografía en `valor_original_snapshot`.
 */
import type {
  CampoEnriquecible, CuentaLectura, Hallazgo, Candidato,
  MatchingStatus, ProposedAction,
} from './tipos'
import { CAMPOS_OPERATIVOS } from './tipos'
import { puntuar, nivelConfianza, estadoVerificacion } from './confianza'
import {
  esValorReal, normTexto, dominioCanonico, telefonoE164, emailNormalizado,
  similitud, primerEntero, taxonomiaTamano, taxonomiaEmpleados, taxonomiaGiro,
  dedupeKey,
} from './normalizar'

/** Valor normalizado por tipo de campo, para comparar peras con peras. */
export function normalizarPorCampo(campo: CampoEnriquecible, valor: string): string {
  switch (campo) {
    case 'pagina_web':            return dominioCanonico(valor)
    case 'contacto_email':
    case 'email_corporativo':
    case 'email_pattern_inferred': return emailNormalizado(valor) || normTexto(valor)
    case 'contacto_tel':
    case 'telefono_corporativo':  return telefonoE164(valor)
    case 'tamano_empresa':        return taxonomiaTamano(valor) || normTexto(valor)
    case 'total_empleados':       return taxonomiaEmpleados(valor) || normTexto(valor)
    case 'num_oficinas':          return String(primerEntero(valor) ?? normTexto(valor))
    case 'giro':                  return taxonomiaGiro(valor) || normTexto(valor)
    default:                      return normTexto(valor)
  }
}

/** Lee el valor operativo actual del campo, o null si el campo no vive en `cuentas`. */
export function valorOriginal(cuenta: CuentaLectura, campo: CampoEnriquecible): string | null {
  if (!CAMPOS_OPERATIVOS.includes(campo)) return null
  const v = (cuenta as unknown as Record<string, unknown>)[campo]
  return v == null ? null : String(v)
}

/**
 * Veredicto. Reglas:
 * - Campo vacío (incluye el relleno "0") → `nuevo`.
 * - Igual tras normalizar → `coincide`.
 * - Muy parecido, o el candidato contiene al original y aporta más → `complementa`.
 * - Distinto de verdad → `conflicto` (SIEMPRE revisión humana; jamás sustituye).
 */
export function comparar(
  campo: CampoEnriquecible, original: string | null, candidato: string,
): MatchingStatus {
  if (!esValorReal(candidato)) return 'sin_evidencia'
  if (!esValorReal(original))  return 'nuevo'

  const a = normalizarPorCampo(campo, original as string)
  const b = normalizarPorCampo(campo, candidato)
  if (!b) return 'sin_evidencia'
  if (a && a === b) return 'coincide'

  // Numéricos: una diferencia de cantidad es conflicto, no matiz.
  if (campo === 'num_oficinas' || campo === 'total_empleados') {
    const na = primerEntero(original as string), nb = primerEntero(candidato)
    if (na != null && nb != null) {
      if (na === nb) return 'coincide'
      const rel = Math.abs(na - nb) / Math.max(na, nb)
      return rel <= 0.1 ? 'complementa' : 'conflicto'
    }
  }

  // El candidato incluye al original y agrega detalle → complementa.
  const na = normTexto(original as string), nb = normTexto(candidato)
  if (na && nb && nb.includes(na) && nb.length > na.length) return 'complementa'

  const sim = similitud(original as string, candidato)
  if (sim >= 0.85) return 'coincide'
  if (sim >= 0.55) return 'complementa'
  return 'conflicto'
}

export function accionPropuesta(estado: MatchingStatus, score: number): ProposedAction {
  if (estado === 'sin_evidencia') return 'descartar'
  if (estado === 'conflicto')     return 'review_required'
  if (estado === 'coincide')      return 'registrar_validacion'
  // nuevo | complementa: se ofrece como adicional solo si hay respaldo decente
  return score >= 70 ? 'agregar_adicional' : 'review_required'
}

/** Convierte un hallazgo crudo en candidato listo para previsualizar o guardar. */
export function construirCandidato(
  cuenta: CuentaLectura, h: Hallazgo, consultadoEn = new Date().toISOString(),
): Candidato {
  const original   = valorOriginal(cuenta, h.campo)
  const matching   = comparar(h.campo, original, h.valor)
  const score      = puntuar({
    fuente_tipo: h.fuente_tipo,
    campo: h.campo,
    corroboraciones: h.corroboraciones,
    literal: true,
  })
  const normalizado = normalizarPorCampo(h.campo, h.valor)

  return {
    cuenta_id: cuenta.id,
    asesor: cuenta.asesor,
    campo: h.campo,
    valor_original_snapshot: original,
    valor_candidato: h.valor,          // texto tal como lo publicó la fuente
    valor_normalizado: normalizado,
    confianza_score: score,
    confianza_nivel: nivelConfianza(score),
    estado_verificacion: estadoVerificacion(score, h.estado_verificacion),
    fuente_tipo: h.fuente_tipo,
    fuente_nombre: h.fuente_nombre,
    fuente_url: h.fuente_url ?? null,
    evidencia: h.evidencia,
    consultado_en: consultadoEn,
    matching_status: matching,
    proposed_action: accionPropuesta(matching, score),
    dedupe_key: dedupeKey(cuenta.id, h.campo, normalizado, h.fuente_url),
  }
}

/** Quita candidatos repetidos dentro de una misma corrida (misma dedupe_key),
 *  conservando el de mayor confianza. */
export function deduplicar(cands: Candidato[]): Candidato[] {
  const porClave = new Map<string, Candidato>()
  for (const c of cands) {
    const prev = porClave.get(c.dedupe_key)
    if (!prev || c.confianza_score > prev.confianza_score) porClave.set(c.dedupe_key, c)
  }
  return Array.from(porClave.values())
}
