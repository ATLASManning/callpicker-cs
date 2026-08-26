/**
 * Elegibilidad de cuentas para Actividades SAC — fuente de verdad (backend).
 *
 * Regla base: una actividad SAC solo existe sobre una cuenta que HOY es cliente
 * activo y tiene contacto localizable. Cualquier duda se resuelve BLOQUEANDO
 * (fail-closed): si no se puede confirmar el estatus, la cuenta no es elegible.
 *
 * Motivo (incidente 24 Ago 2026): el campo `estado` de Supabase se desactualiza
 * respecto a Churn. Coristylo, Velfare, Global Trust Solutions EZQ y Koltin
 * tenían `estado` activo/en_riesgo en Supabase y "Churn confirmado" en
 * GRC-AAA-2026 — y recibieron actividades esa semana. El estado de Supabase
 * NO es suficiente por sí solo; siempre se concilia contra Churn.
 */

import { AAA_GRC_2026 } from '@/app/churn/aaa-grc-data'
import { CLIENTES_CANCELADOS } from '@/lib/churn-cancelados-data'

/** Tope duro de actividades por cuenta y por asesor en una misma semana. */
export const LIMITE_SEMANAL = 4

export type CodigoBloqueo =
  | 'churn_grc'
  | 'cancelacion'
  | 'dormida'
  | 'estado_no_activo'
  | 'estatus_no_validable'
  | 'contacto_incompleto'
  | 'limite_semanal'
  | 'fuera_de_lunes'
  | 'exclusion_manual'

export const MSG: Record<CodigoBloqueo, string> = {
  churn_grc:            'Actividad bloqueada: la cuenta se encuentra en Churn > GRC - AAA - 2026.',
  cancelacion:          'Actividad bloqueada: la cuenta aparece como cancelada en Churn > Análisis DATA.',
  dormida:              'Actividad bloqueada: la cuenta tiene estatus Dormida.',
  estado_no_activo:     'Actividad bloqueada: la cuenta no tiene estatus activo.',
  estatus_no_validable: 'Actividad bloqueada: no fue posible validar el estatus de la cuenta.',
  contacto_incompleto:  'Completa nombre, teléfono, correo y cargo del contacto antes de iniciar una actividad.',
  limite_semanal:       `Límite semanal alcanzado: esta cuenta ya tiene ${LIMITE_SEMANAL} actividades para la semana actual.`,
  fuera_de_lunes:       'Las actividades SAC solo se generan los lunes.',
  exclusion_manual:     'Actividad bloqueada: la cuenta fue retirada del programa SAC por instrucción de dirección.',
}

/**
 * Exclusiones manuales del programa SAC — cuentas que siguen en cartera pero
 * NO deben recibir actividades, por decisión de dirección. Cada entrada
 * documenta quién la pidió y por qué, para poder revisarla después.
 * El cruce es por nombre normalizado (normalizarNombre).
 */
const EXCLUSIONES_SAC: Array<{ nombre: string; razon: string }> = [
  {
    nombre: 'Pitahaya',
    razon:  '25 Ago 2026 · Fátima vía Slack, confirmado por dirección: downgrade en junio a CE 60 minutos — dejó de ser cuenta TOP/AAA. Pasa a seguimiento de retención, fuera del ritual SAC.',
  },
]

const NOMBRES_EXCLUSION_MANUAL: Set<string> = new Set(
  EXCLUSIONES_SAC.map(e => normalizarNombre(e.nombre))
)

/** Normaliza un nombre de empresa para cruzarlo entre fuentes sin CID común. */
export function normalizarNombre(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Un campo cuenta como capturado solo si trae información real.
 * Los textos de relleno se tratan como campo vacío: dan la falsa impresión de
 * perfil completo y son la razón por la que cuentas sin contacto localizable
 * pasaban el filtro.
 */
const RELLENO = new Set([
  'na', 'n/a', 'noaplica', 'pendiente', 'sininformacion', 'sininfo', 'sindato',
  'sindatos', 'tbd', 'porconfirmar', 'pordefinir', 'desconocido', 'ninguno',
  'nodisponible', 'nd', 'xx', 'xxx', '-', '--', '0', 'null', 'undefined',
])

export function esValorReal(v: unknown): boolean {
  if (v == null) return false
  const raw = String(v).trim()
  if (raw === '') return false
  const k = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '')
  if (RELLENO.has(k)) return false
  if (/^[-–—._]+$/.test(k)) return false
  return true
}

/* ── Listas de exclusión derivadas de Churn ──────────────────────────────────
 * GRC-AAA-2026: se excluyen las cuentas con "Churn confirmado" (la cuenta ya
 * no es cliente). Las de "Downgrade" NO se excluyen: siguen siendo cartera
 * viva y facturando — son precisamente las que más seguimiento requieren.
 */
export const NOMBRES_CHURN_GRC: Set<string> = (() => {
  const s = new Set<string>()
  for (const mes of AAA_GRC_2026) {
    for (const r of mes.clientes) {
      if (r.movimiento.includes('Churn confirmado')) s.add(normalizarNombre(r.cliente))
    }
  }
  s.delete('')
  return s
})()

/**
 * Cancelaciones confirmadas en Churn > Análisis DATA (reportes semanales).
 * Sustituye al módulo "Alertas · Cancelación", retirado el 24 Ago 2026: esa
 * información ya vive en los módulos que integran Churn. El cruce es por
 * nombre porque los reportes semanales no traen CID.
 */
export const NOMBRES_CANCELACION: Set<string> = (() => {
  const s = new Set<string>()
  for (const c of CLIENTES_CANCELADOS) s.add(normalizarNombre(c.cliente))
  s.delete('')
  return s
})()

/* ── Evaluación ──────────────────────────────────────────────────────────── */

export interface CuentaElegibilidadInput {
  id:              string
  cid:             string | null
  empresa:         string
  estado:          string | null
  contacto_nombre: string | null
  contacto_cargo:  string | null
  contacto_tel:    string | null
  contacto_email:  string | null
}

export interface ResultadoElegibilidad {
  elegible:          boolean
  codigo:            CodigoBloqueo | null
  motivo:            string | null
  contactoFaltante:  string[]
}

const CAMPOS_CONTACTO: Array<{ key: keyof CuentaElegibilidadInput; label: string }> = [
  { key: 'contacto_nombre', label: 'Nombre'   },
  { key: 'contacto_tel',    label: 'Teléfono' },
  { key: 'contacto_email',  label: 'Correo'   },
  { key: 'contacto_cargo',  label: 'Cargo'    },
]

/** Columnas de `cuentas` necesarias para evaluar elegibilidad. */
export const CAMPOS_ELEGIBILIDAD_SELECT =
  'id, cid, empresa, estado, contacto_nombre, contacto_cargo, contacto_tel, contacto_email'

/**
 * Tipos de actividad cuyo propósito ES capturar los datos del contacto.
 * Para éstas NO se exige contacto completo: exigirlo crearía un candado sin
 * salida — la cuenta nunca podría completar sus datos porque nunca podría
 * iniciar la actividad que sirve para completarlos. Los bloqueos por churn,
 * cancelación, dormida y estatus no validable SÍ siguen aplicando.
 */
const TIPOS_DE_CAPTURA = new Set(['validacion'])

/**
 * @param dormidasZoho  IDs dormidos según Zoho. `null` = la conciliación falló
 *                      → fail-closed: ninguna cuenta se considera validable.
 * @param tipo          Tipo de actividad. Si es de captura ('validacion') se
 *                      omite la exigencia de contacto completo.
 */
export function evaluarElegibilidad(
  c: CuentaElegibilidadInput,
  dormidasZoho: Set<string> | null,
  tipo?: string,
): ResultadoElegibilidad {
  const ok = (): ResultadoElegibilidad => ({ elegible: true, codigo: null, motivo: null, contactoFaltante: [] })
  const no = (codigo: CodigoBloqueo, contactoFaltante: string[] = []): ResultadoElegibilidad =>
    ({ elegible: false, codigo, motivo: MSG[codigo], contactoFaltante })

  // 0. Exclusión manual por dirección — aplica a TODOS los tipos de actividad.
  if (NOMBRES_EXCLUSION_MANUAL.has(normalizarNombre(c.empresa))) return no('exclusion_manual')

  // 1. Conciliación con Churn indisponible → no se puede afirmar que está activa.
  if (dormidasZoho === null) return no('estatus_no_validable')

  // 2. Estatus en Supabase.
  const estado = String(c.estado ?? '').trim()
  if (estado === '') return no('estatus_no_validable')
  if (estado !== 'activo' && estado !== 'en_riesgo') {
    return no(estado === 'hibernacion' ? 'dormida' : 'estado_no_activo')
  }

  // 3. Dormida en Zoho, aunque Supabase diga lo contrario.
  if (dormidasZoho.has(String(c.id))) return no('dormida')

  // 4. Churn confirmado en GRC-AAA-2026 (cruce por nombre: esa fuente no trae CID).
  if (NOMBRES_CHURN_GRC.has(normalizarNombre(c.empresa))) return no('churn_grc')

  // 5. Cancelación confirmada en los reportes semanales de Churn.
  if (NOMBRES_CANCELACION.has(normalizarNombre(c.empresa))) return no('cancelacion')

  // 6. Contacto localizable: nombre, teléfono, correo y cargo con datos reales.
  //    No aplica a las actividades de captura — ver TIPOS_DE_CAPTURA.
  if (!TIPOS_DE_CAPTURA.has(String(tipo ?? ''))) {
    const faltantes = CAMPOS_CONTACTO.filter(f => !esValorReal(c[f.key])).map(f => f.label)
    if (faltantes.length > 0) return no('contacto_incompleto', faltantes)
  }

  return ok()
}

/** ¿La fecha dada es lunes? Las actividades SAC solo se generan/disparan en lunes. */
export function esLunes(d: Date): boolean {
  return d.getDay() === 1
}
