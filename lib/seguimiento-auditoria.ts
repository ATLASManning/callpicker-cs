/**
 * lib/seguimiento-auditoria.ts — la cuenta auditada Y en riesgo se trabaja.
 *
 * INSTRUCCIÓN DE DIRECCIÓN (25 sep 2026)
 * --------------------------------------
 * «Ahora es instrucción: seguimiento a las cuentas que tienen auditoría y están
 * en riesgo, con actividades SAC. Objetivo prevenir churn.»
 *
 * Nace de ALTERNET: se le entregó una auditoría en junio, la cuenta pidió la
 * baja el 25 de septiembre, y el expediente que quedó son seis seguimientos con
 * siete semanas de hueco entre julio y septiembre. Y lo más revelador —
 * **ALTERNET nunca tuvo una sola actividad SAC asignada en toda su historia**.
 * El sistema jamás le pidió a nadie seguirla. Una auditoría que no se convierte
 * en trabajo asignado es un documento, no una intervención.
 *
 * POR QUÉ NO SE REPITE CADA SEMANA
 * --------------------------------
 * Son 22 cuentas auditadas en riesgo: Claudia 10, Dan 8, Fátima 4. Meterle diez
 * cada lunes a Claudia, encima de sus cuatro, son catorce — y las quince
 * semanales ya se intentaron y fracasaron; por eso dirección las bajó a cuatro.
 *
 * Así que esto es un ACERVO, no una carga semanal: **una actividad por cuenta,
 * generada UNA sola vez, que no vence y no se regenera**. Se trabaja hasta
 * agotarla. Si la cuenta sale de riesgo antes, la actividad sigue viva: salir
 * de riesgo también se documenta.
 *
 * VA FUERA DEL TOPE DE CUATRO, igual que la aclaración de baja y por la misma
 * razón: es una instrucción de dirección, no parte del lote rutinario. Si
 * compitiera por los cuatro lugares, desplazaría al resto de la cartera y el
 * problema se movería de sitio en vez de resolverse.
 *
 * SE CIERRA CON EVIDENCIA, NO CON UN CLIC
 * ---------------------------------------
 * «Quiero evidencia de su trabajo.» Cerrar esto exige decir con quién se habló,
 * qué se acordó y cuándo es el siguiente paso. Igual que la aclaración, NO se
 * exige que la noticia sea buena: «el cliente no contesta desde el 3 de agosto,
 * escalado a dirección comercial» es una respuesta válida y valiosa. Lo que se
 * rechaza es el vacío y el relleno.
 */
import { STATIC_CASES } from '@/app/auditoria/cases'
import type { AuditoriaCase, EstadoAuditoria } from '@/app/auditoria/types'

export const TIPO_AUDITORIA = 'auditoria' as const

/** Marca invisible que permite reconocer la actividad sin una columna nueva. */
export const MARCADOR_AUDITORIA = '[AUDITORÍA·RIESGO]'

/**
 * Los estados de auditoría que obligan seguimiento.
 *
 * `perdido` NO entra: la cuenta ya se fue y el expediente de baja lo cubre la
 * aclaración, que es otra cosa. `activo` tampoco — una auditoría de una cuenta
 * sana es inteligencia comercial, no prevención de churn.
 *
 * `rescatable` y `en_recuperacion` SÍ entran: son justo el momento en que el
 * seguimiento todavía cambia el resultado.
 */
const ESTADOS_QUE_OBLIGAN: ReadonlySet<EstadoAuditoria> = new Set([
  'en_riesgo', 'rescatable', 'en_recuperacion',
])

export interface CuentaAuditadaEnRiesgo {
  auditoria:  AuditoriaCase
  nombre:     string
  asesor:     string
  estado:     EstadoAuditoria
  /** Cuándo se entregó la auditoría, tal como la trae el caso. */
  fechaAuditoria: string
  /** Los hallazgos, que son el guion de la conversación. */
  hallazgos:  string[]
}

/** Las cuentas auditadas que están en riesgo, opcionalmente de un asesor. */
export function auditadasEnRiesgo(asesor?: string | null): CuentaAuditadaEnRiesgo[] {
  const out: CuentaAuditadaEnRiesgo[] = []
  for (const a of STATIC_CASES) {
    if (!ESTADOS_QUE_OBLIGAN.has(a.estado)) continue
    const suyo = String(a.asesor ?? '').trim()
    if (asesor && suyo !== String(asesor).trim()) continue
    out.push({
      auditoria: a,
      nombre: a.nombre,
      asesor: suyo,
      estado: a.estado,
      fechaAuditoria: a.fecha_auditoria || a.fecha_periodo || 'sin fecha',
      hallazgos: Array.isArray(a.hallazgos) ? a.hallazgos : [],
    })
  }
  return out
}

/** Reparto por asesor, para poder decir el tamaño del acervo antes de generarlo. */
export function repartoAuditadas(): Record<string, number> {
  const r: Record<string, number> = {}
  for (const c of auditadasEnRiesgo()) {
    const k = c.asesor || '[sin asesor]'
    r[k] = (r[k] ?? 0) + 1
  }
  return r
}

/**
 * La descripción de la actividad.
 *
 * Lleva los hallazgos de la auditoría dentro, a propósito: el asesor no tiene
 * que ir a buscar el documento ni acordarse de qué decía. El guion de la
 * conversación viaja con la tarea.
 */
export function descripcionSeguimientoAuditoria(c: CuentaAuditadaEnRiesgo): string {
  const top = c.hallazgos.slice(0, 3)
    .map((h, i) => `  ${i + 1}. ${String(h).trim()}`)
    .join('\n')
  const bloqueHallazgos = top
    ? `\n\nLO QUE ENCONTRÓ LA AUDITORÍA:\n${top}`
    : '\n\n(La auditoría no dejó hallazgos en lista; ábrela en /auditoria antes de llamar.)'

  return [
    `${MARCADOR_AUDITORIA} SEGUIMIENTO A AUDITORÍA — ${c.nombre}`,
    '',
    `Esta cuenta tiene auditoría entregada (${c.fechaAuditoria}) y está en estado ` +
    `«${c.estado.replace('_', ' ')}». Instrucción de dirección: no se deja correr.`,
    bloqueHallazgos,
    '',
    'QUÉ HAY QUE HACER:',
    '  · Contactar al responsable de la cuenta y retomar los hallazgos con él.',
    '  · Acordar UNA acción concreta con fecha, no una intención.',
    '  · Registrar el resultado aquí mismo, aunque la respuesta sea mala.',
    '',
    'Esta actividad NO vence y NO se vuelve a generar: queda abierta hasta que se ' +
    'documente. Tampoco ocupa uno de los cuatro lugares semanales.',
  ].join('\n')
}

/* ══════════════════════════════════════════════════════════════════
   Cierre: exige evidencia
══════════════════════════════════════════════════════════════════ */
const MIN_CONTACTO = 25
const MIN_ACUERDO  = 40

/** Respuestas que no dicen nada. Mismo criterio que lib/aclaraciones.ts. */
const RELLENO = [
  'na', 'n/a', 'ninguna', 'ninguno', 'nada', 'sin novedad', 'ok', 'listo',
  'hecho', 'realizado', 'atendido', 'seguimiento', 'se dio seguimiento',
  'pendiente', 'en proceso', '-', '.', 'x',
]

function esRelleno(s: string): boolean {
  const limpio = s.trim().toLowerCase().replace(/[.;,!]+$/g, '')
  return RELLENO.includes(limpio)
}

export interface CierreAuditoria {
  /** Con quién se habló: nombre y puesto. */
  contacto?: unknown
  /** Qué se acordó, con fecha. */
  acuerdo?: unknown
}

export interface VeredictoAuditoria {
  permitido: boolean
  faltantes: string[]
  mensaje: string | null
}

/**
 * ¿Se puede cerrar este seguimiento?
 *
 * Igual que con la aclaración de baja, NO se exige que el resultado sea bueno.
 * «Hablé con Anahí el 12 de agosto, dijo que lo verían en comité y no ha vuelto
 * a contestar; escalado a dirección comercial el 3 de septiembre» es una
 * respuesta VÁLIDA. Lo que se rechaza es el vacío y el relleno.
 */
export function validarCierreAuditoria(v: CierreAuditoria): VeredictoAuditoria {
  const contacto = String(v.contacto ?? '').trim()
  const acuerdo  = String(v.acuerdo ?? '').trim()
  const faltantes: string[] = []

  if (contacto.length < MIN_CONTACTO || esRelleno(contacto)) {
    faltantes.push(
      `Con quién hablaste (mínimo ${MIN_CONTACTO} caracteres): nombre, puesto y por qué vía. ` +
      'Si no lograste contacto, dilo y di cuántas veces lo intentaste y cuándo.',
    )
  }
  if (acuerdo.length < MIN_ACUERDO || esRelleno(acuerdo)) {
    faltantes.push(
      `Qué se acordó (mínimo ${MIN_ACUERDO} caracteres): la acción concreta y su fecha. ` +
      'Si no hubo acuerdo, dilo y explica cuál es el siguiente paso y cuándo.',
    )
  }

  if (faltantes.length === 0) return { permitido: true, faltantes: [], mensaje: null }
  return {
    permitido: false,
    faltantes,
    mensaje: 'Este seguimiento no se puede cerrar todavía: falta la evidencia del trabajo.',
  }
}

/** Une los dos campos en el `resultado` que se guarda, sin perder la estructura. */
export function componerResultadoAuditoria(contacto: string, acuerdo: string): string {
  return `CONTACTO: ${contacto.trim()}\n\nACUERDO: ${acuerdo.trim()}`
}
