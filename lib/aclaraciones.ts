/**
 * lib/aclaraciones.ts
 * Actividad de ACLARACIÓN por Churn confirmado o Downgrade.
 *
 * INSTRUCCIÓN DE DIRECCIÓN (9-sep-2026):
 *   "a partir de hoy en adelante, si existe una cuenta con estas
 *    características de Churn confirmado o Downgrade sí generas la actividad,
 *    y no se cierra hasta cumplir con el requisito de la aclaración explícita,
 *    con las acciones previas".
 *
 * Cómo se cumple, en tres piezas:
 *
 *  1. QUÉ CUENTA COMO NUEVO — `app/churn/grc-eventos-corte.ts` congela los 870
 *     movimientos que ya existían el 9-sep-2026 (enero a agosto). Todo lo que
 *     aparezca en GRC-AAA-2026 y NO esté ahí es nuevo. Sin ese corte, la
 *     primera ejecución habría tratado 8 meses de historial como si acabaran
 *     de ocurrir: 70 actividades de golpe (Fátima 38, Dan 18, Claudia 14).
 *
 *  2. SE GENERA APARTE DEL TOPE — decisión de dirección: la aclaración NO
 *     ocupa uno de los 4 espacios semanales del asesor. Una semana con tres
 *     bajas exige tres aclaraciones; si compitieran por los 4 espacios, la
 *     documentación del churn desplazaría al trabajo de retención, que es lo
 *     que evita el siguiente churn.
 *
 *  3. NO CIERRA SIN ACLARACIÓN — el candado vive en
 *     `app/api/actividades/[id]/route.ts`: exige causa explícita Y acciones
 *     previas, cada una por separado. Ver `validarCierreAclaracion`.
 *
 * OJO CON LA DIFERENCIA ENTRE CHURN Y DOWNGRADE: una cuenta en Downgrade sigue
 * viva y facturando (así lo dice el encabezado de lib/elegibilidad.ts). La
 * aclaración no la da de baja ni la saca de la cartera; solo obliga a explicar
 * por qué bajó y qué se hizo antes.
 */
import { AAA_GRC_2026 } from '@/app/churn/aaa-grc-data'
import { GRC_EVENTOS_PREVIOS } from '@/app/churn/grc-eventos-corte'
import { normalizarNombre } from '@/lib/elegibilidad'

export type MovimientoAclaracion = 'churn' | 'downgrade'

export const TIPO_ACLARACION = 'aclaracion' as const

export interface EventoAclaracion {
  /** Nombre tal como viene en GRC — para mostrarlo sin deformar. */
  cliente: string
  clienteNorm: string
  /** ENERO … DICIEMBRE, en mayúsculas. */
  mes: string
  movimiento: MovimientoAclaracion
  /** Texto original: puede ser "Churn confirmado + Fraude". */
  movimientoTexto: string
  clave: string
  mrrInicio: number
  mrrFin: number
  perdido: number
}

/**
 * Solo Churn confirmado y Downgrade exigen aclaración.
 *
 * Se usa `includes` y no igualdad porque GRC trae variantes con sufijo
 * ("Churn confirmado + Fraude", "Downgrade + Fraude"): 9 de los 870 eventos
 * al corte. Compararlas por igualdad las dejaría fuera en silencio.
 */
export function clasificarMovimiento(mov: string | null | undefined): MovimientoAclaracion | null {
  const m = String(mov ?? '')
  if (m.includes('Churn confirmado')) return 'churn'
  if (m.includes('Downgrade'))        return 'downgrade'
  return null
}

export function claveEvento(clienteNorm: string, mes: string, mov: MovimientoAclaracion): string {
  return `${clienteNorm}|${mes.toUpperCase()}|${mov}`
}

/** Todos los eventos de Churn/Downgrade presentes hoy en GRC-AAA-2026. */
export function eventosDeAclaracion(): EventoAclaracion[] {
  const out: EventoAclaracion[] = []
  for (const bloque of AAA_GRC_2026) {
    const mes = String(bloque.mes ?? '').toUpperCase()
    for (const r of bloque.clientes) {
      const movimiento = clasificarMovimiento(r.movimiento)
      if (!movimiento) continue
      const clienteNorm = normalizarNombre(r.cliente)
      if (!clienteNorm) continue
      out.push({
        cliente: r.cliente,
        clienteNorm,
        mes,
        movimiento,
        movimientoTexto: r.movimiento,
        clave: claveEvento(clienteNorm, mes, movimiento),
        mrrInicio: r.mrrInicio,
        mrrFin: r.mrrFin,
        perdido: r.perdido,
      })
    }
  }
  return out
}

/**
 * Los eventos POSTERIORES al corte — los únicos que generan actividad.
 * Hoy devuelve 0: el corte cubre enero–agosto y no hay meses más recientes
 * cargados. En cuanto se cargue septiembre, sus movimientos caerán aquí solos.
 */
export function eventosNuevosDeAclaracion(): EventoAclaracion[] {
  return eventosDeAclaracion().filter(e => !GRC_EVENTOS_PREVIOS.has(e.clave))
}

/**
 * Marcador que se incrusta en `descripcion` para saber si una aclaración YA se
 * generó por ESTE evento. Va en la descripción y no en una columna nueva a
 * propósito: no exige migración, y el asesor lo ve escrito en su actividad.
 * Al ser único por (cliente, mes, movimiento), una cuenta que cae dos veces en
 * churn genera dos aclaraciones distintas, que es lo correcto.
 */
export function marcadorAclaracion(e: EventoAclaracion): string {
  return `[ACLARACIÓN · ${e.mes} · ${e.movimiento === 'churn' ? 'CHURN CONFIRMADO' : 'DOWNGRADE'}]`
}

const MXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)

/** Texto de la actividad. Dice exactamente qué se exige para poder cerrarla. */
export function descripcionAclaracion(e: EventoAclaracion, empresa: string): string {
  const esChurn = e.movimiento === 'churn'
  const cabeza = esChurn
    ? `ACLARACIÓN OBLIGATORIA — CHURN CONFIRMADO de ${empresa} (${e.mes} 2026). La cuenta se dio de baja: MRR ${MXN(e.mrrInicio)} → ${MXN(e.mrrFin)}, pérdida ${MXN(e.perdido)}.`
    : `ACLARACIÓN OBLIGATORIA — DOWNGRADE de ${empresa} (${e.mes} 2026). La cuenta sigue activa pero bajó: MRR ${MXN(e.mrrInicio)} → ${MXN(e.mrrFin)}, pérdida ${MXN(e.perdido)}.`

  return [
    `${marcadorAclaracion(e)} ${cabeza}`,
    '',
    'Esta actividad NO se puede cerrar sin dos cosas, y se piden por separado:',
    '',
    '1) CAUSA EXPLÍCITA — por qué ocurrió. No vale "el cliente lo decidió" ni',
    '   "por costos" a secas: qué pasó, cuándo empezó, quién lo decidió del lado',
    `   del cliente y si hubo un detonante (falla, facturación, competencia,${esChurn ? ' cierre de operación' : ' recorte de presupuesto'}).`,
    '',
    '2) ACCIONES PREVIAS — qué se hizo ANTES de que ocurriera. Contactos,',
    '   reuniones, propuestas, escalamientos, con fechas. Si no se hizo nada,',
    '   escríbelo así de claro: eso también es un hallazgo y es el que más',
    '   sirve para que no se repita.',
    '',
    esChurn
      ? 'Si detectas que la baja era evitable, escálalo a Dirección con el expediente.'
      : 'Si el downgrade es recuperable, define el plan de recuperación con fecha.',
  ].join('\n')
}

/* ── Candado de cierre ──────────────────────────────────────────────────────
 * Se exigen DOS campos separados en vez de un texto único a propósito: con un
 * solo cuadro, "el cliente se fue por precio" cumple el mínimo y no dice nada
 * de lo que se intentó — que es justamente el aprendizaje que dirección quiere
 * capturar. Separarlos obliga a responder las dos preguntas.
 */

/** Mínimo de caracteres útiles por campo. */
const MIN_CAUSA   = 40
const MIN_ACCIONES = 40

/** Respuestas de relleno que no explican nada. Se rechazan explícitamente. */
const RELLENO = [
  'no aplica', 'n/a', 'na', 'ninguna', 'ninguno', 'sin comentarios', 'sin comentario',
  'nada', 'no se hizo nada', 'no hubo', 'se fue', 'cliente se fue', 'ya no', 'x',
  'pendiente', 'por definir', 'sin informacion', 'sin información', 'no se',
]

function esRelleno(t: string): boolean {
  const limpio = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  return RELLENO.includes(limpio)
}

export interface CierreAclaracion {
  causa?: unknown
  accionesPrevias?: unknown
}

export interface VeredictoAclaracion {
  permitido: boolean
  faltantes: string[]
  mensaje: string | null
}

/**
 * ¿Se puede cerrar esta aclaración?
 *
 * Nota deliberada: NO se exige que las acciones previas sean "suficientes".
 * "No se hizo ningún contacto entre marzo y la baja porque la cuenta no tenía
 * asesor asignado" es una respuesta VÁLIDA y valiosa — lo que se rechaza es
 * el vacío y el relleno, no la mala noticia.
 */
export function validarCierreAclaracion(v: CierreAclaracion): VeredictoAclaracion {
  const causa    = String(v.causa ?? '').trim()
  const acciones = String(v.accionesPrevias ?? '').trim()
  const faltantes: string[] = []

  if (causa.length < MIN_CAUSA || esRelleno(causa)) {
    faltantes.push(
      `Causa explícita de la baja (mínimo ${MIN_CAUSA} caracteres): qué pasó, cuándo empezó y quién lo decidió.`,
    )
  }
  if (acciones.length < MIN_ACCIONES || esRelleno(acciones)) {
    faltantes.push(
      `Acciones previas con fechas (mínimo ${MIN_ACCIONES} caracteres): qué se hizo antes. Si no se hizo nada, dilo y explica por qué.`,
    )
  }

  if (faltantes.length === 0) return { permitido: true, faltantes: [], mensaje: null }
  return {
    permitido: false,
    faltantes,
    mensaje: 'Esta aclaración no se puede cerrar todavía: falta documentar la baja.',
  }
}

/** Une los dos campos en el `resultado` que se guarda, sin perder la estructura. */
export function componerResultadoAclaracion(causa: string, acciones: string): string {
  return `CAUSA: ${causa.trim()}\n\nACCIONES PREVIAS: ${acciones.trim()}`
}
