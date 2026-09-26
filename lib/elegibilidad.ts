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
import { GRC_MES_EN_CURSO } from '@/app/churn/grc-reporte'
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
 * Exclusiones manuales del programa SAC — cuentas que siguen en cartera,
 * activas y facturando, pero que NO deben recibir actividades por decisión de
 * dirección. Excluir NO es cancelar: la cuenta sigue viva (ver `sigueViva` en
 * bloqueoComercialDeCuenta) y sigue contando en la cartera del asesor.
 *
 * Cada entrada documenta quién la pidió y por qué, para poder revisarla después.
 *
 * El cruce es por CID cuando se conoce, y por nombre normalizado como respaldo.
 * El CID es la llave fuerte: el nombre puede cambiar en la base o repetirse
 * entre dos cuentas, y entonces la exclusión se rompe en silencio o alcanza a
 * quien no debía. Por eso se piden los dos y basta con que empate uno.
 */
const EXCLUSIONES_SAC: Array<{ nombre: string; cid?: string; razon: string }> = [
  {
    nombre: 'Pitahaya',
    razon:  '25 Ago 2026 · Fátima vía Slack, confirmado por dirección: downgrade en junio a CE 60 minutos — dejó de ser cuenta TOP/AAA. Pasa a seguimiento de retención, fuera del ritual SAC.',
  },
  {
    nombre: 'Centinela Property',
    cid:    '140527',
    razon:  '15 Sep 2026 · José Manuel, dirección: no es cuenta TOP y su facturación es un paquete de 400 minutos que paga de forma ANUAL. El ritual SAC está armado sobre el ciclo mensual —corte, consumo, seguimiento—; en una cuenta con un solo momento comercial al año esa cadencia genera tareas sin sustento. Se retira del SAC SIN cancelarla ni borrarla: sigue activa, sigue en la cartera de Claudia y sigue midiéndose. Revisar en la renovación anual.',
  },
]

const NOMBRES_EXCLUSION_MANUAL: Set<string> = new Set(
  EXCLUSIONES_SAC.map(e => normalizarNombre(e.nombre))
)

const CIDS_EXCLUSION_MANUAL: Set<string> = new Set(
  EXCLUSIONES_SAC.map(e => String(e.cid ?? '').trim()).filter(Boolean)
)

/** ¿Dirección retiró esta cuenta del programa SAC? CID primero, nombre después. */
export function esExclusionManual(c: { cid?: string | null; empresa?: string | null }): boolean {
  const cid = String(c.cid ?? '').trim()
  if (cid && CIDS_EXCLUSION_MANUAL.has(cid)) return true
  return NOMBRES_EXCLUSION_MANUAL.has(normalizarNombre(c.empresa))
}

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
/* La definicion vive ahora en lib/valores.ts — un modulo sin dependencias, para
 * que el enriquecimiento y las pruebas puedan usarla sin arrastrar los datasets
 * de churn que importa este archivo. Se reexporta para no tocar a ningun
 * consumidor existente: sigue habiendo UNA sola definicion. */
/* Se importa Y se reexporta: `export { X } from` por si solo reexporta sin
 * crear el binding local, y este archivo usa esValorReal internamente. */
import { esValorReal, esTelefonoReal } from './valores'
export { esValorReal, esTelefonoReal }

/* ── Cuentas que Zoho sigue contando como churn pero están vivas ─────────────
 * El archivo de GRC espejea a Zoho peso por peso porque alimenta la tabla
 * oficial que se reporta a dirección. Esta lista es la contraparte: lo que NO
 * debe salirse de la operación aunque Zoho lo cuente como baja.
 *
 * Va por nombre normalizado, igual que el resto del módulo.
 */
export const REACTIVADAS_FUERA_DEL_CHURN: ReadonlyMap<string, string> = new Map([
  // 9 sep 2026 · José Manuel López Delgadillo, Dirección: "te solicito sacarla
  // del Churn". TATSA figuraba con Churn confirmado en agosto 2026 (AAA, MRR
  // 11,086 → 0). Tras la recomendación de los dueños de CBS Compresores y la
  // visita de dirección, la cuenta se reactiva y se da de alta como cuenta TOP
  // (D59, cartera de Dan). Zoho la sigue contando en agosto; el número oficial
  // la incluye, la operación no.
  ['tatsa', 'Reactivada. Alta como cuenta TOP D59 el 9 sep 2026.'],
])

/* ── Listas de exclusión derivadas de Churn ──────────────────────────────────
 * GRC-AAA-2026: se excluyen las cuentas con "Churn confirmado" (la cuenta ya
 * no es cliente). Las de "Downgrade" NO se excluyen: siguen siendo cartera
 * viva y facturando — son precisamente las que más seguimiento requieren.
 *
 * DOS EXCEPCIONES, y las dos por la misma razón — que Zoho marca como baja lo
 * que todavía no es baja:
 *
 *   · EL MES VIVO NO CUENTA. Regla de José Manuel (20-sep-2026): el mes en
 *     curso son clientes que tardan en pagar, no bajas; el churn real es el
 *     del mes vencido. Septiembre 2026 metería 755 cuentas aquí y las dejaría
 *     sin actividades SAC estando vivas. Al cerrar el mes, las que sigan en
 *     churn entran solas.
 *   · Las REACTIVADAS, arriba.
 */
export const NOMBRES_CHURN_GRC: Set<string> = (() => {
  const vivo = (GRC_MES_EN_CURSO ?? '').toLowerCase()
  const s = new Set<string>()
  for (const mes of AAA_GRC_2026) {
    if (vivo && String(mes.mes).toLowerCase() === vivo) continue
    for (const r of mes.clientes) {
      if (!r.movimiento.includes('Churn confirmado')) continue
      const n = normalizarNombre(r.cliente)
      if (REACTIVADAS_FUERA_DEL_CHURN.has(n)) continue
      s.add(n)
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

/**
 * El teléfono lleva su propio criterio (`esTelefonoReal`), más estricto que el
 * genérico: `000000000000000` pasaba como dato válido y daba por «completa» a
 * una cuenta cuyo único canal vivo era el correo. Ver lib/valores.ts.
 */
const CAMPOS_CONTACTO: Array<{
  key: keyof CuentaElegibilidadInput; label: string; valida?: (v: unknown) => boolean
}> = [
  { key: 'contacto_nombre', label: 'Nombre'   },
  { key: 'contacto_tel',    label: 'Teléfono', valida: esTelefonoReal },
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
const TIPOS_DE_CAPTURA = new Set([
  'validacion',
  // 'aclaracion' (Churn confirmado / Downgrade) por el mismo motivo, al revés:
  // exigir "contacto localizable" para documentar una baja es absurdo —
  // precisamente el cliente que se fue es el que ya no tiene contacto vivo.
  // Sin esto, la aclaración de una cuenta con la ficha incompleta no se podría
  // ni iniciar, y esa cuenta es de las que más urge explicar.
  'aclaracion',
])

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

  // 0. Exclusión manual por dirección — aplica a TODOS los tipos de actividad,
  //    incluidos los de captura: si dirección la sacó del ritual, no se le
  //    genera nada, ni siquiera para completarle la ficha.
  if (esExclusionManual(c)) return no('exclusion_manual')

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
    const faltantes = CAMPOS_CONTACTO
      .filter(f => !(f.valida ?? esValorReal)(c[f.key]))
      .map(f => f.label)
    if (faltantes.length > 0) return no('contacto_incompleto', faltantes)
  }

  return ok()
}

/** ¿La fecha dada es lunes? Las actividades SAC solo se generan/disparan en lunes. */
export function esLunes(d: Date): boolean {
  return d.getDay() === 1
}

/* ── Bloqueo visible en la ficha de la cuenta ────────────────────────────────
 *
 * POR QUÉ EXISTE (9 Sep 2026): Claudia reportó que "Bliss crédito libre"
 * aparecía como *Estable* en el dashboard estando cancelada. La regla de
 * actividades SÍ la bloqueaba — Bliss nunca recibió una actividad SAC — pero
 * nada en la pantalla lo decía, así que desde fuera parecía que el candado no
 * existía. Un candado que no se ve no genera confianza.
 *
 * Esta función es SOLO para mostrar. Evalúa las causas PERMANENTES de bloqueo
 * (estatus no vivo, churn confirmado, cancelación, exclusión de dirección), que
 * son las que se pueden leer sin salir a la red.
 *
 * NO sustituye a `evaluarElegibilidad`: le falta la conciliación en vivo con
 * Zoho Dormidas y el fail-closed correspondiente. Autorizar una actividad SOLO
 * con esta función reabriría el hueco del 24 de agosto. Autorizar = evaluarElegibilidad.
 */
export interface BloqueoComercial {
  bloqueada: boolean
  codigos:   CodigoBloqueo[]
  motivos:   string[]
  /**
   * ¿La cuenta SIGUE siendo cliente pese a estar bloqueada?
   *
   * Bloqueada y muerta no son lo mismo. `exclusion_manual` retira del ritual
   * SAC a cuentas que siguen en cartera y facturando (hoy: Pitahaya por
   * downgrade, y Centinela Property por facturar de forma anual). Sin esta
   * bandera, la ficha mostraría el badge ACTIVA y, dos líneas abajo, un aviso
   * diciendo que su Health Score es historial — falso, y justo el error inverso
   * al que este módulo vino a corregir.
   */
  sigueViva: boolean
}

export function bloqueoComercialDeCuenta(
  c: { empresa: string; cid?: string | null; estado?: string | null },
): BloqueoComercial {
  const codigos: CodigoBloqueo[] = []
  const n = normalizarNombre(c.empresa)
  const estado = String(c.estado ?? '').trim()

  if (esExclusionManual(c)) codigos.push('exclusion_manual')
  if (estado === '')                            codigos.push('estatus_no_validable')
  else if (estado === 'hibernacion')            codigos.push('dormida')
  else if (estado !== 'activo' && estado !== 'en_riesgo') codigos.push('estado_no_activo')
  if (NOMBRES_CHURN_GRC.has(n))   codigos.push('churn_grc')
  if (NOMBRES_CANCELACION.has(n)) codigos.push('cancelacion')

  return {
    bloqueada: codigos.length > 0,
    codigos,
    motivos: codigos.map(k => MSG[k]),
    sigueViva: estado === 'activo' || estado === 'en_riesgo',
  }
}
