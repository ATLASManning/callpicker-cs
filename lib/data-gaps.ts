/**
 * Catálogo único de "campos faltantes" de una cuenta — usado por el generador
 * de Actividades SAC, el diagnóstico de cartera y el gate de "Completar Perfil".
 * Antes existían 2 definiciones ligeramente distintas (generar/route.ts y
 * diagnostico/route.ts); unificado el 20 Ago 2026 para que una cuenta nunca
 * aparezca "completa" en un lado e "incompleta" en otro.
 */

export interface DataGap {
  campo:    string
  pregunta: string
  nivel:    'critico' | 'importante' | 'deseable'
}

export interface ContactoJson { nombre: string; cargo: string; email: string; tel?: string }

export interface CuentaGapInput {
  activo_desde:      string | null
  contacto_nombre:   string | null
  contacto_cargo:    string | null
  contacto_tel:      string | null
  contacto_email:    string | null
  contactos_json:    ContactoJson[] | null
  giro:              string | null
  tamano_empresa:    string | null
  nps_score:         number | null
  observaciones_kam: string | null
  total_empleados:   string | null
  num_oficinas:      string | null
  pagina_web:        string | null
}

export function detectDataGaps(c: CuentaGapInput): DataGap[] {
  const gaps: DataGap[] = []
  if (!c.activo_desde)    gaps.push({ campo: 'Fecha de inicio',      pregunta: '¿Desde cuándo son clientes de Callpicker? (mes y año aproximado)',                nivel: 'critico' })
  if (!c.contacto_nombre) gaps.push({ campo: 'Contacto principal',   pregunta: '¿Con quién hablas normalmente sobre el servicio? (nombre completo)',              nivel: 'critico' })
  if (!c.contacto_cargo)  gaps.push({ campo: 'Cargo del contacto',   pregunta: '¿Cuál es el cargo o puesto del responsable de la cuenta?',                        nivel: 'critico' })
  if (!c.contacto_tel)    gaps.push({ campo: 'Teléfono directo',     pregunta: '¿Me puedes compartir tu número directo para seguimientos urgentes?',               nivel: 'critico' })
  if (!c.contacto_email)  gaps.push({ campo: 'Correo del contacto',  pregunta: '¿Cuál es el correo directo de tu contacto principal?',                            nivel: 'critico' })

  // Mapa de decisores / contacto alterno — lección KOMBITEC
  const extraContacts = Array.isArray(c.contactos_json) ? c.contactos_json.length : 0
  if (extraContacts < 2)  gaps.push({ campo: 'Mapa de decisores',   pregunta: '¿Hay alguien más en la empresa involucrado en las decisiones sobre herramientas como Callpicker? (nombre, cargo, teléfono alterno y email)',  nivel: 'critico' })

  if (!c.giro)            gaps.push({ campo: 'Giro / Industria',     pregunta: '¿A qué sector o industria pertenece la empresa?',                                  nivel: 'importante' })
  if (!c.tamano_empresa)  gaps.push({ campo: 'Tamaño de cuenta',     pregunta: '¿Cómo clasificarías el tamaño de esta cuenta? (pequeña / mediana / grande)',        nivel: 'importante' })
  if (!c.nps_score)       gaps.push({ campo: 'NPS (satisfacción)',   pregunta: '"Del 1 al 10, ¿qué tan probable es que recomienden Callpicker a otra empresa?"',   nivel: 'importante' })
  if (!c.observaciones_kam || String(c.observaciones_kam).trim() === '' || String(c.observaciones_kam).trim() === '0')
                           gaps.push({ campo: 'Observaciones KAM', pregunta: '¿Hay compromisos vigentes, situaciones especiales o riesgos que debamos registrar?', nivel: 'importante' })
  if (!c.total_empleados) gaps.push({ campo: 'No. de empleados',     pregunta: '¿Cuántos empleados tiene la organización en total?',                               nivel: 'deseable' })
  if (!c.num_oficinas)    gaps.push({ campo: 'No. de sitios',        pregunta: '¿En cuántas ubicaciones o sucursales operan con Callpicker?',                     nivel: 'deseable' })
  if (!c.pagina_web)      gaps.push({ campo: 'Sitio web',            pregunta: '¿Cuál es el sitio web de la empresa?',                                            nivel: 'deseable' })
  return gaps
}

/**
 * Cuántos campos evalúa el catálogo. Se deriva del propio `detectDataGaps`
 * con una cuenta totalmente vacía, así que no puede desfasarse al agregar o
 * quitar un campo. Antes estaba escrito a mano como 11 cuando ya eran 13, y
 * eso producía porcentajes de completitud negativos.
 */
export const TOTAL_CAMPOS_GAP = detectDataGaps({
  activo_desde: null, contacto_nombre: null, contacto_cargo: null,
  contacto_tel: null, contacto_email: null, contactos_json: null,
  giro: null, tamano_empresa: null, nps_score: null, observaciones_kam: null,
  total_empleados: null, num_oficinas: null, pagina_web: null,
}).length

export function gapScore(c: CuentaGapInput): number {
  const g = detectDataGaps(c)
  return g.filter(x => x.nivel === 'critico').length * 3 + g.filter(x => x.nivel === 'importante').length
}

/* ── Conciliación con lo que Atlas ya localizó ────────────────────────────────
 * `detectDataGaps` solo mira las columnas de `cuentas`, así que un campo sigue
 * contando como faltante aunque el enriquecimiento ya haya encontrado el dato
 * (por diseño nunca se escribe en `cuentas`). Esto separa las dos cosas:
 *   · por conseguir  → nadie tiene el dato, el KAM debe preguntarlo
 *   · por confirmar  → Atlas ya lo localizó, solo falta validarlo y capturarlo
 * Son tareas distintas y cuestan distinto: mezclarlas infla la lista.
 */

/** Campo del catálogo → campos del enriquecimiento que lo resuelven. */
const EQUIVALENCIAS: Record<string, { directo: string[]; pista: string[] }> = {
  'Contacto principal': { directo: ['contacto_nombre'], pista: [] },
  'Cargo del contacto': { directo: ['contacto_cargo'], pista: [] },
  'Teléfono directo':   { directo: ['contacto_tel'],   pista: ['telefono_corporativo'] },
  'Correo del contacto':{ directo: ['contacto_email'], pista: ['email_corporativo'] },
  'Giro / Industria':   { directo: ['giro'],           pista: [] },
  'Tamaño de cuenta':   { directo: ['tamano_empresa'], pista: [] },
  'No. de empleados':   { directo: ['total_empleados'],pista: [] },
  'No. de sitios':      { directo: ['num_oficinas'],   pista: [] },
  'Sitio web':          { directo: ['pagina_web'],     pista: [] },
  // 'NPS (satisfacción)' y 'Observaciones KAM' no se enriquecen nunca: solo
  // pueden venir del cliente o del KAM. 'Mapa de decisores' y 'Fecha de inicio'
  // tampoco tienen equivalente automático.
}

export interface CandidatoParaConciliar {
  campo: string
  valor_candidato: string
  confianza_score: number
  fuente_nombre: string
}

export interface GapConciliado extends DataGap {
  /** 'directo' = el dato exacto; 'pista' = una vía relacionada (buzón corporativo). */
  localizado?: 'directo' | 'pista'
  valor?:      string
  confianza?:  number
  fuente?:     string
}

export function conciliarGaps(
  gaps: DataGap[], candidatos: CandidatoParaConciliar[],
): GapConciliado[] {
  if (!candidatos.length) return gaps
  const porCampo = new Map<string, CandidatoParaConciliar>()
  for (const c of candidatos) {
    const prev = porCampo.get(c.campo)
    if (!prev || c.confianza_score > prev.confianza_score) porCampo.set(c.campo, c)
  }

  return gaps.map(g => {
    const eq = EQUIVALENCIAS[g.campo]
    if (!eq) return g
    for (const campo of eq.directo) {
      const c = porCampo.get(campo)
      if (c) return { ...g, localizado: 'directo', valor: c.valor_candidato,
                      confianza: c.confianza_score, fuente: c.fuente_nombre }
    }
    for (const campo of eq.pista) {
      const c = porCampo.get(campo)
      if (c) return { ...g, localizado: 'pista', valor: c.valor_candidato,
                      confianza: c.confianza_score, fuente: c.fuente_nombre }
    }
    return g
  })
}

/** Columnas de `cuentas` que hay que seleccionar para poder llamar detectDataGaps/gapScore. */
export const CAMPOS_GAP_SELECT =
  'activo_desde, contacto_nombre, contacto_cargo, contacto_tel, contacto_email, contactos_json, ' +
  'giro, tamano_empresa, nps_score, observaciones_kam, total_empleados, num_oficinas, pagina_web'
