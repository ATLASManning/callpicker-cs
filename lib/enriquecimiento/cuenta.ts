/**
 * Datos enriquecidos POR CUENTA, listos para pintar en la ficha y para
 * alimentar a Atlas IA.
 *
 * Estos datos son INFORMACIÓN GENERAL ADICIONAL: se muestran junto al registro
 * del KAM, nunca en su lugar. La ficha sigue leyendo `cuentas` para sus campos
 * operativos; esto es una capa de contexto encima.
 *
 * Además de listar hallazgos, deriva SEÑALES COMERCIALES — red de sucursales,
 * franquicias, contactabilidad — que es lo que convierte un dato suelto en una
 * conversación de upsell, cross-sell o retención.
 */
import { supabaseAdmin } from '../supabase'
import { esValorReal, primerEntero } from './normalizar'

export interface CandidatoCuenta {
  id: string
  campo: string
  valor_original_snapshot: string | null
  valor_candidato: string
  confianza_score: number
  confianza_nivel: string
  estado_verificacion: string
  fuente_tipo: string
  fuente_nombre: string
  fuente_url: string | null
  evidencia: string
  consultado_en: string
  matching_status: string
  review_status: string
}

export type TipoSenal = 'oportunidad' | 'riesgo' | 'dato'

export interface SenalComercial {
  tipo:    TipoSenal
  titulo:  string
  detalle: string
  accion?: string
}

export interface DatosEnriquecidos {
  candidatos: CandidatoCuenta[]
  porCampo:   Record<string, CandidatoCuenta[]>
  senales:    SenalComercial[]
  total:      number
  conflictos: number
  ultimaConsulta: string | null
}

/** Cuenta mínima que necesitamos para derivar señales. */
export interface CuentaParaSenales {
  num_oficinas: string | null
  contacto_email: string | null
  contacto_tel: string | null
  tamano_empresa: string | null
  giro: string | null
  tiene_chat_activo?: boolean | null
  tiene_integracion_api?: boolean | null
  tiene_ia_voz?: boolean | null
  tiene_ia_chat?: boolean | null
  tiene_pago_automatico?: boolean | null
  estado?: string | null
}

const RX_FRANQUICIA = /franquicia|franquiciatar|distribuidor|afiliad|concesionar/i
const RX_MULTISITIO = /sucursal|oficina|tienda|planta|centro de distribuci|punto de venta|plaza/i

/**
 * Deriva señales comerciales cruzando lo que el KAM ya sabe con lo encontrado.
 * El foco es accionable: qué conversación abre cada dato.
 */
export function derivarSenales(
  c: CuentaParaSenales, cands: CandidatoCuenta[],
): SenalComercial[] {
  const out: SenalComercial[] = []

  // ── Red de ubicaciones: la señal de upsell más directa ──────────────────
  const textoSitios = [
    c.num_oficinas ?? '',
    ...cands.filter(x => x.campo === 'num_oficinas').map(x => `${x.valor_candidato} ${x.evidencia}`),
  ].join(' ')
  const nSitios = Math.max(
    primerEntero(c.num_oficinas) ?? 0,
    ...cands.filter(x => x.campo === 'num_oficinas').map(x => primerEntero(x.valor_candidato) ?? 0),
  )

  if (RX_FRANQUICIA.test(textoSitios)) {
    out.push({
      tipo: 'oportunidad',
      titulo: 'Opera con franquicias o distribuidores',
      detalle: nSitios > 1
        ? `La red suma alrededor de ${nSitios} puntos. Cada franquiciatario es una unidad que decide y paga por separado.`
        : 'La red incluye franquicias o distribuidores: unidades que deciden y pagan por separado.',
      accion: 'Proponer un esquema por unidad (extensiones y calltracking por punto) en vez de una sola cuenta central.',
    })
  } else if (nSitios >= 3) {
    out.push({
      tipo: 'oportunidad',
      titulo: `Red de ${nSitios} ubicaciones propias`,
      detalle: 'Varias sedes operando: cada una necesita sus propias extensiones y su número rastreable.',
      accion: 'Revisar cuántas extensiones tiene contratadas contra el número de sedes; proponer Calltracking por sucursal.',
    })
  } else if (nSitios === 0 && cands.some(x => x.campo === 'num_oficinas')) {
    out.push({
      tipo: 'dato',
      titulo: 'Se encontró información de ubicaciones',
      detalle: 'La fuente pública menciona sedes que la ficha no tiene registradas.',
      accion: 'Validar con el cliente cuántas ubicaciones operan con Callpicker.',
    })
  }

  // ── Contactabilidad: base de la retención ───────────────────────────────
  const correosNuevos = cands.filter(x =>
    (x.campo === 'contacto_email' || x.campo === 'email_corporativo') && x.matching_status === 'nuevo')
  const telsNuevos = cands.filter(x =>
    (x.campo === 'contacto_tel' || x.campo === 'telefono_corporativo') && x.matching_status === 'nuevo')

  if (!esValorReal(c.contacto_email) && correosNuevos.length) {
    out.push({
      tipo: 'oportunidad',
      titulo: `${correosNuevos.length} vía(s) de correo encontradas`,
      detalle: `La ficha no tenía correo del contacto. Se localizó: ${correosNuevos.map(x => x.valor_candidato).join(', ')}.`,
      accion: 'Confirmar con el cliente cuál es el correo del responsable y registrarlo.',
    })
  }

  /* Riesgo de incontactabilidad. Cuenta TODAS las vías, las del KAM y las
   * localizadas: un teléfono corporativo encontrado ya es un canal. Antes esta
   * señal ignoraba los teléfonos hallados y se contradecía con la línea de
   * abajo (caso Velfare, 1 Sep 2026). */
  const hayVia = esValorReal(c.contacto_email) || esValorReal(c.contacto_tel) ||
                 correosNuevos.length > 0 || telsNuevos.length > 0
  if (!hayVia) {
    out.push({
      tipo: 'riesgo',
      titulo: 'Cuenta sin vía de contacto localizable',
      detalle: 'Ni la ficha ni las fuentes públicas dan un correo o teléfono del responsable.',
      accion: 'Prioridad alta: sin canal de contacto, una baja se entera cuando ya ocurrió.',
    })
  } else if (!esValorReal(c.contacto_email) && !esValorReal(c.contacto_tel) && telsNuevos.length) {
    // La ficha no tiene contacto, pero la investigación sí dio un canal.
    out.push({
      tipo: 'oportunidad',
      titulo: 'Sin contacto en la ficha, pero sí hay canal localizado',
      detalle: `La ficha no registra correo ni teléfono del responsable; la investigación encontró ${telsNuevos.map(x => x.valor_candidato).join(', ')}.`,
      accion: 'Llamar a ese número para identificar al responsable y cerrar el hueco de contactabilidad.',
    })
  } else if (telsNuevos.length) {
    out.push({
      tipo: 'dato',
      titulo: `${telsNuevos.length} teléfono(s) corporativo(s) adicionales`,
      detalle: telsNuevos.map(x => x.valor_candidato).join(', '),
      accion: 'Útil como vía alterna cuando el contacto principal no responde.',
    })
  }

  // ── Cross-sell por perfil ────────────────────────────────────────────────
  const sinModulos = [
    !c.tiene_chat_activo && 'Callpicker Chat',
    !c.tiene_integracion_api && 'Integración API',
    !c.tiene_ia_voz && 'IA de Voz',
    !c.tiene_pago_automatico && 'Pago automático',
  ].filter(Boolean) as string[]

  if (nSitios >= 3 && sinModulos.length >= 3) {
    out.push({
      tipo: 'oportunidad',
      titulo: 'Red multi-sitio con adopción baja',
      detalle: `Opera en ~${nSitios} puntos y no tiene activado: ${sinModulos.join(', ')}.`,
      accion: 'La distribución geográfica es el argumento: centralizar atención con Chat e IA de Voz.',
    })
  }

  // ── Señal de riesgo por estado ───────────────────────────────────────────
  if (c.estado === 'hibernacion' || c.estado === 'cancelado') {
    out.push({
      tipo: 'riesgo',
      titulo: `Cuenta en estado "${c.estado}"`,
      detalle: 'Los datos enriquecidos sirven aquí para reactivación, no para crecimiento.',
      accion: 'Verificar si la empresa sigue operando antes de cualquier acercamiento comercial.',
    })
  }

  return out
}

/** Trae los datos enriquecidos de una cuenta y sus señales derivadas. */
export async function datosEnriquecidosDeCuenta(
  cuentaId: string, cuenta?: CuentaParaSenales,
): Promise<DatosEnriquecidos> {
  const vacio: DatosEnriquecidos = {
    candidatos: [], porCampo: {}, senales: [], total: 0, conflictos: 0, ultimaConsulta: null,
  }

  const { data, error } = await supabaseAdmin
    .from('enriquecimiento_candidatos')
    .select(`id, campo, valor_original_snapshot, valor_candidato, confianza_score,
             confianza_nivel, estado_verificacion, fuente_tipo, fuente_nombre,
             fuente_url, evidencia, consultado_en, matching_status, review_status`)
    .eq('cuenta_id', cuentaId)
    .neq('review_status', 'incorrecto')
    .order('confianza_score', { ascending: false })

  if (error || !data?.length) return vacio

  const candidatos = data as unknown as CandidatoCuenta[]
  const porCampo: Record<string, CandidatoCuenta[]> = {}
  for (const c of candidatos) {
    if (!porCampo[c.campo]) porCampo[c.campo] = []
    porCampo[c.campo].push(c)
  }

  return {
    candidatos,
    porCampo,
    senales: cuenta ? derivarSenales(cuenta, candidatos) : [],
    total: candidatos.length,
    conflictos: candidatos.filter(c => c.matching_status === 'conflicto').length,
    ultimaConsulta: candidatos
      .map(c => c.consultado_en)
      .sort()
      .at(-1) ?? null,
  }
}
