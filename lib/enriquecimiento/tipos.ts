/**
 * Contratos del módulo de enriquecimiento de cuentas.
 *
 * REGLA ESTRUCTURAL: aquí no existe ningún tipo que represente "escribir en
 * cuentas". El motor produce CANDIDATOS; la tabla `cuentas` es de solo lectura
 * para todo este módulo (ver docs/ENRIQUECIMIENTO.md).
 */

/** Campos del alcance. Los tres últimos NO existen en `cuentas`: viven solo
 *  como candidato porque no deben tocar un campo operativo. */
export type CampoEnriquecible =
  | 'contacto_nombre' | 'contacto_cargo' | 'contacto_tel' | 'contacto_email'
  | 'giro' | 'tamano_empresa' | 'total_empleados' | 'num_oficinas' | 'pagina_web'
  | 'razon_social' | 'email_corporativo' | 'telefono_corporativo'
  | 'email_pattern_inferred' | 'insight_sugerido'

/** Campos de `cuentas` que el motor puede LEER para comparar. */
export const CAMPOS_OPERATIVOS: readonly CampoEnriquecible[] = [
  'contacto_nombre', 'contacto_cargo', 'contacto_tel', 'contacto_email',
  'giro', 'tamano_empresa', 'total_empleados', 'num_oficinas', 'pagina_web',
] as const

/**
 * Campos prohibidos como destino de enriquecimiento automático.
 * `nps_score` solo puede venir de datos internos autorizados (encuestas, CRM);
 * `observaciones_kam` y `notas` son propiedad operativa del KAM y se preservan
 * literalmente — un hallazgo relevante se guarda como 'insight_sugerido'.
 */
export const CAMPOS_PROHIBIDOS = ['nps_score', 'observaciones_kam', 'notas'] as const

export type NivelConfianza     = 'confirmado' | 'alta' | 'probable' | 'debil'
export type EstadoVerificacion = 'confirmado' | 'probable' | 'no_verificado'

export type FuenteTipo =
  | 'interno'          // la propia ficha de la cuenta (máxima confianza, sin red)
  | 'sitio_oficial'    // dominio corporativo de la empresa
  | 'directorio'       // directorio empresarial de terceros
  | 'buscador'         // resultados públicos de búsqueda
  | 'apify'            // actor autorizado (Google Maps, etc.)
  | 'linkedin_publico' // resultado público, sin scraping ni autenticación

/** Veredicto de la comparación contra el dato que ya capturó el KAM. */
export type MatchingStatus =
  | 'coincide'      // el hallazgo confirma lo que ya hay
  | 'complementa'   // agrega precisión sin contradecir
  | 'conflicto'     // contradice al dato del KAM → siempre revisión humana
  | 'nuevo'         // el campo estaba vacío
  | 'sin_evidencia' // no se pudo sustentar; se conserva para investigación

export type ProposedAction =
  | 'registrar_validacion'  // coincide: solo se deja constancia
  | 'agregar_adicional'     // se ofrece como dato adicional al KAM
  | 'review_required'       // conflicto o baja confianza
  | 'descartar'

export type ReviewStatus =
  | 'pendiente' | 'aprobado_adicional' | 'incorrecto' | 'pospuesto' | 'fusionado_manual'

export type RolDecision =
  | 'decisor_economico' | 'decisor_tecnico' | 'usuario_clave' | 'influenciador'
  | 'comprador' | 'patrocinador_ejecutivo' | 'gatekeeper' | 'contacto_operativo'

/** Cuenta tal como la lee el motor. Solo lectura. */
export interface CuentaLectura {
  id: string; consecutivo: string | null; cid: string | null
  empresa: string; asesor: string; estado: string | null
  contacto_nombre: string | null; contacto_cargo: string | null
  contacto_tel: string | null;    contacto_email: string | null
  contactos_json: Array<{ nombre?: string; cargo?: string; email?: string; tel?: string }> | null
  giro: string | null; tamano_empresa: string | null
  total_empleados: string | null; num_oficinas: string | null
  pagina_web: string | null; direccion_fiscal: string | null
  observaciones_kam: string | null
}

/** Hallazgo crudo que devuelve un proveedor, antes de comparar y puntuar. */
export interface Hallazgo {
  campo:          CampoEnriquecible
  valor:          string
  fuente_tipo:    FuenteTipo
  fuente_nombre:  string
  fuente_url?:    string | null
  evidencia:      string
  /** Cuántas fuentes independientes sustentan el mismo valor (para el puntaje). */
  corroboraciones?: number
  /** El proveedor puede forzar un tope de verificación (p. ej. patrón inferido). */
  estado_verificacion?: EstadoVerificacion
}

/** Candidato ya comparado, puntuado y listo para persistir o previsualizar. */
export interface Candidato {
  cuenta_id: string; asesor: string
  campo: CampoEnriquecible
  valor_original_snapshot: string | null
  valor_candidato: string
  valor_normalizado: string
  confianza_score: number
  confianza_nivel: NivelConfianza
  estado_verificacion: EstadoVerificacion
  fuente_tipo: FuenteTipo
  fuente_nombre: string
  fuente_url: string | null
  evidencia: string
  consultado_en: string
  matching_status: MatchingStatus
  proposed_action: ProposedAction
  dedupe_key: string
}

export interface DecisorCandidato {
  cuenta_id: string; asesor: string
  persona_nombre: string | null
  cargo: string | null
  area: string | null
  rol_decision: RolDecision | null
  tipo_contacto: EstadoVerificacion
  email: string | null
  telefono: string | null
  confianza_score: number
  estado_verificacion: EstadoVerificacion
  fuente_url: string | null
  fuente_nombre: string
  evidencia: string
  consultado_en: string
  dedupe_key: string
}

export interface ResumenRun {
  cuentas_procesadas: number
  candidatos: number
  decisores: number
  por_matching: Record<MatchingStatus, number>
  por_confianza: Record<NivelConfianza, number>
  por_campo: Record<string, number>
  conflictos: number
  sin_evidencia: number
  campos_no_verificables: string[]
  errores: Array<{ cuenta: string; proveedor: string; detalle: string }>
  proveedores_usados: string[]
  proveedores_no_disponibles: string[]
}

export interface ResultadoRun {
  run_id: string | null      // null en dry-run: no se persiste nada
  dry_run: boolean
  iniciado_en: string
  terminado_en: string
  ejecutado_por: string
  alcance: { asesor?: string; cuenta_ids?: string[]; limite: number }
  candidatos: Candidato[]
  decisores: DecisorCandidato[]
  resumen: ResumenRun
}
