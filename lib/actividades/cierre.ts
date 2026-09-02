/**
 * Candado de calidad al cerrar una actividad SAC.
 *
 * Instrucción de dirección (1 Sep 2026): se acabó cerrar una actividad con una
 * línea. El agujero no estaba en el formulario sino en el cierre — cualquier
 * texto cerraba la actividad y una baja se registraba sin que pasara nada.
 *
 * Principio de diseño: **debe ser más fácil responder bien que responder mal.**
 * Este módulo no castiga al asesor que trabaja; le quita el cierre fácil al que
 * no lo hizo, y convierte las respuestas-excusa en trabajo concreto.
 *
 * Tres reglas, en orden:
 *   1. Declarar una baja NO cierra la actividad: abre expediente. La cuenta no
 *      cambia de estado por lo que escriba el asesor — eso lo valida dirección.
 *   2. "No contesta" NO es un final: es una secuencia de contacto. Si no hay
 *      con quién insistir, ese vacío ES el hallazgo.
 *   3. Una respuesta sin análisis no cierra. Se pide lo mínimo verificable:
 *      con quién se habló, qué dijo el cliente y qué sigue.
 *
 * Alineado al perfil del rol (`lib/perfil-rol.ts`, bloque 4.7): registrar cada
 * interacción relevante con evidencia, no llenar campos.
 */

export type CodigoCierre =
  | 'ok'
  | 'vacio'
  | 'generico'
  | 'sin_analisis'
  | 'declaracion_baja'
  | 'declaracion_downgrade'
  | 'sin_contacto'

export interface VeredictoCierre {
  permitido: boolean
  codigo:    CodigoCierre
  mensaje:   string
  /** Lo que el asesor debe responder para poder cerrar. */
  exige:     string[]
  /** Preguntas concretas, redactadas para copiar y trabajar. */
  preguntas: string[]
}

const OK: VeredictoCierre = { permitido: true, codigo: 'ok', mensaje: '', exige: [], preguntas: [] }

/** Longitud mínima. Una gestión real no cabe en menos que esto. */
const MIN_CARACTERES = 60

/*
 * IMPORTANTE — por qué todas las detecciones corren sobre texto SIN acentos:
 *
 * En JavaScript `` es ASCII: una vocal acentuada NO es carácter de palabra.
 * Una alternativa que termina en acento —"ya no está", "canceló", "renunció"—
 * nunca hacía match, porque el `` final fallaba justo ahí. Se detectó en
 * producción: "Cambió el contacto" sí disparaba (termina en "contacto") pero
 * "Ya no está esa persona" no.
 *
 * Normalizar resuelve eso y, de paso, algo igual de valioso: el asesor que
 * escribe rápido y sin acentos ("no contesto", "cancelo") queda cubierto igual.
 */
function sinAcentos(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * Frases que por sí solas no son un cierre. No están prohibidas —son legítimas
 * como parte de un relato—; lo que no se acepta es que sean TODA la respuesta.
 */
const RX_GENERICO = new RegExp(
  '^(?:\W|\d)*(?:' + [
    'ok', 'listo', 'hecho', 'realizado', 'atendido', 'aplica', 'no aplica', 'n\/?a',
    'se dio seguimiento', 'seguimiento', 'se reviso', 'revisado', 'se atendio',
    'sin novedad(?:es)?', 'todo bien', 'todo en orden', 'sin cambios', 'sin comentarios',
    'cliente informado', 'se le informo', 'se contacto', 'contactado',
    'pendiente', 'en proceso', 'se quedo de ver', 'queda pendiente',
    'ya se habia hecho', 'no hubo respuesta', 'sin respuesta',
  ].join('|') + ')(?:\W|\d)*$',
  'i',
)

/** El cliente se va. Declararlo abre expediente, no cierra la actividad. */
const RX_BAJA = /(?:cancel(?:ar|o|ada|ado|acion)|dar(?:se)? de baja|se dio de baja|ya no (?:esta|son|es) cliente|termin(?:ar|o) (?:el )?(?:servicio|contrato)|cerr(?:ar|o) (?:la )?cuenta|no (?:va|van) a (?:continuar|renovar|seguir)|dej(?:ar|o) de usar|se fue con|se cambio (?:de|a) (?:proveedor|otra empresa))/i

/** Reducción de servicio. Mismo tratamiento: expediente. */
const RX_DOWNGRADE = /(?:downgrade|baj(?:ar|o) (?:de )?plan|reduc(?:ir|cion|jo)|menos (?:extensiones|licencias|lineas|agentes|minutos)|quit(?:ar|o) (?:extensiones|lineas|licencias|agentes)|cambi(?:ar|o) a un plan (?:menor|mas bajo))/i

/** El cliente no respondió. Es un disparador, no un desenlace. */
const RX_SIN_CONTACTO = /(?:no (?:me )?(?:contest(?:a|o|aron)|respond(?:e|io|ieron)|atendi(?:o|eron))|no hubo respuesta|sin respuesta|buzon|no localizado|ilocalizable|no se pudo contactar|manda(?:ba)? a buzon|no esta disponible)/i

/** El interlocutor cambió. Es la causa 7 del catálogo, no una excusa. */
const RX_CAMBIO_PERSONA = /(?:ya no (?:esta|trabaja|labora)|cambi(?:o|aron) (?:de |el |la )?(?:persona|contacto|encargad|responsable|administrador)|otra persona|nuevo (?:contacto|encargado|responsable)|sali(?:o) de la empresa|renuncio)/i

/* ── Señales de que SÍ hubo análisis ───────────────────────────────────────
 * No se exige una plantilla: se exige que la respuesta contenga al menos dos
 * señales de trabajo real — una persona, una fecha, un siguiente paso o un
 * hallazgo concreto. */
const RX_PERSONA   = /(?:hable|platique|reunion con|me atendio|contacte a|con el |con la |licenciad|ingenier|sr\.|sra\.|gerente|director|encargad)/i
const RX_SIGUIENTE = /(?:qued(?:amos|o)|acord(?:amos|o)|compromiso|siguiente paso|proxim[oa]|agend(?:e|amos|ada)|enviare|mandare|revisare|volvere a|se agenda|se enviara|para el |el dia)/i
const RX_FECHA     = /(?:\d{1,2}[\/-]\d{1,2}|lunes|martes|miercoles|jueves|viernes|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|proxima semana|esta semana|manana)/i
const RX_HALLAZGO  = /(?:porque|debido a|el problema|la razon|detect|encontr|reporto|se identific|comento que|menciono que|dijo que|indico que|solicito|requiere|necesita)/i

function tieneAnalisis(texto: string): boolean {
  const t = sinAcentos(texto)
  let señales = 0
  if (RX_PERSONA.test(t))   señales++
  if (RX_SIGUIENTE.test(t)) señales++
  if (RX_FECHA.test(t))     señales++
  if (RX_HALLAZGO.test(t))  señales++
  return señales >= 2
}

export interface EntradaCierre {
  resultado: string | null | undefined
  /** Tipo de actividad — las de análisis de pérdida se cierran con otras reglas. */
  tipo?: string
  /** El asesor ya sustentó el expediente de baja en esta misma entrega. */
  expedienteAdjunto?: boolean
  /** Ya registró el segundo intento por otro canal. */
  secuenciaRegistrada?: boolean
}

/**
 * Evalúa si una actividad puede cerrarse con el resultado escrito.
 * Devuelve siempre qué falta y las preguntas exactas a responder.
 */
export function evaluarCierre(e: EntradaCierre): VeredictoCierre {
  const t = String(e.resultado ?? '').trim()
  // Todas las detecciones corren sobre `n`; `t` conserva el original
  // para longitud y para lo que se guarda.
  const n = sinAcentos(t)

  if (!t) {
    return {
      permitido: false, codigo: 'vacio',
      mensaje: 'No se puede cerrar una actividad sin describir qué pasó.',
      exige: ['Qué acción realizaste', 'Con quién hablaste', 'Qué respondió el cliente', 'Cuál es el siguiente paso y cuándo'],
      preguntas: [
        '¿Con quién hablaste? (nombre y cargo)',
        '¿Qué te dijo el cliente, con sus palabras?',
        '¿Qué acordaron y para qué fecha?',
      ],
    }
  }

  /* El ORDEN importa. Una baja declarada en tres palabras debe abrir
   * expediente, no rebotar por "muy breve": es el camino que más nos interesa
   * conducir bien. Lo mismo con "no contesta" y con el cambio de interlocutor:
   * el mensaje útil es el de su propio flujo, no un regaño de longitud. */

  // ── 1. Declaración de baja o downgrade: abre expediente, no cierra ────────
  const declaraBaja      = RX_BAJA.test(n)
  const declaraDowngrade = !declaraBaja && RX_DOWNGRADE.test(n)

  if ((declaraBaja || declaraDowngrade) && !e.expedienteAdjunto) {
    const evento = declaraBaja ? 'cancelación' : 'reducción de servicio'
    return {
      permitido: false,
      codigo: declaraBaja ? 'declaracion_baja' : 'declaracion_downgrade',
      mensaje:
        `Reportaste una ${evento}. A partir de ahora eso no cierra la actividad: abre un expediente. ` +
        `La cuenta no cambia de estatus con este reporte — lo valida Dirección con la evidencia que registres.`,
      exige: [
        'Causa principal del catálogo',
        'Fecha en que apareció la primera señal',
        'Acciones preventivas ejecutadas, con fecha y resultado',
        'Con quién se habló y qué dijo textualmente',
        'Evidencia (folio de ticket, correo, minuta o reunión)',
        'Qué harías distinto si la cuenta volviera a estar en riesgo',
      ],
      preguntas: [
        '¿Cuál fue el motivo real de la decisión, en palabras del cliente?',
        '¿Cuándo notaste la primera señal de que esto podía pasar?',
        '¿Qué hiciste entre esa primera señal y hoy? Fechas y resultado de cada acción.',
        '¿Con quién hablaste? ¿Era quien decide o quien opera?',
        '¿Se escaló a soporte, producto, finanzas o Dirección? ¿Cuándo?',
        '¿Qué evidencia respalda lo anterior?',
        '¿Qué se pudo haber hecho antes y no se hizo?',
      ],
    }
  }

  // ── 2. "No contesta": secuencia, no desenlace ─────────────────────────────
  if (RX_SIN_CONTACTO.test(n) && !e.secuenciaRegistrada && !tieneAnalisis(t)) {
    return {
      permitido: false, codigo: 'sin_contacto',
      mensaje:
        'Que el cliente no conteste no cierra la actividad: es el inicio de una secuencia. ' +
        'Si además no hay a quién más contactar, ese vacío es el hallazgo de esta cuenta.',
      exige: [
        'Segundo intento por un canal distinto',
        'Intento con un contacto alterno de la cuenta',
        'Si no existe contacto alterno, registrarlo como hallazgo',
      ],
      preguntas: [
        '¿Por qué canal intentaste y a qué hora? ¿Probaste correo, WhatsApp y teléfono?',
        '¿Existe otro contacto en la cuenta? Si no, ¿por qué seguimos dependiendo de una sola persona?',
        '¿Desde cuándo no responde? ¿Es la primera vez o ya venía pasando?',
        '¿Qué harás si tampoco responde al segundo intento?',
      ],
    }
  }

  // ── 3. Cambio de interlocutor: es diagnóstico, no explicación ─────────────
  if (RX_CAMBIO_PERSONA.test(n) && !tieneAnalisis(t)) {
    return {
      permitido: false, codigo: 'sin_analisis',
      mensaje:
        'Un cambio de contacto es una de las causas más frecuentes de baja, no un cierre. ' +
        'Necesitamos saber quién quedó y qué se hizo cuando cambió.',
      exige: ['Nombre y cargo del nuevo contacto', 'Desde cuándo cambió', 'Qué se hizo al enterarnos'],
      preguntas: [
        '¿Quién es la nueva persona y qué cargo tiene?',
        '¿Desde cuándo está y cómo nos enteramos?',
        '¿Ya la conocemos o la relación se perdió con la anterior?',
        '¿Qué acción tomaste para reconstruir la relación?',
      ],
    }
  }

  // ── 4. Longitud mínima: una gestión real no cabe en menos ─────────────────
  if (t.length < MIN_CARACTERES) {
    return {
      permitido: false, codigo: 'vacio',
      mensaje: 'El resultado es demasiado breve para cerrar la actividad. Describe qué hiciste, con quién y qué sigue.',
      exige: ['Qué acción realizaste', 'Con quién hablaste', 'Qué respondió el cliente', 'Cuál es el siguiente paso y cuándo'],
      preguntas: [
        '¿Con quién hablaste? (nombre y cargo)',
        '¿Qué te dijo el cliente, con sus palabras?',
        '¿Qué acordaron y para qué fecha?',
      ],
    }
  }

  if (RX_GENERICO.test(n)) {
    return {
      permitido: false, codigo: 'generico',
      mensaje: 'Esa respuesta no describe una gestión. "Se dio seguimiento" o "sin novedades" no permiten saber qué pasó con la cuenta.',
      exige: ['Descripción concreta de lo que ocurrió', 'Siguiente paso con fecha'],
      preguntas: [
        '¿Qué hiciste exactamente y cuándo?',
        '¿Qué encontraste que no sabíamos antes de esta actividad?',
        '¿Qué queda pendiente y para cuándo?',
      ],
    }
  }

  // Si ya sustentó el expediente o registró la secuencia, el análisis vive ahí:
  // no se le pide dos veces lo mismo en el texto libre.
  if (!tieneAnalisis(t) && !e.expedienteAdjunto && !e.secuenciaRegistrada) {
    return {
      permitido: false, codigo: 'sin_analisis',
      mensaje: 'Falta el análisis. La respuesta no dice con quién hablaste, qué encontraste ni qué sigue.',
      exige: ['Persona con la que hablaste', 'Hallazgo concreto', 'Siguiente paso con fecha'],
      preguntas: [
        '¿Con quién trataste y en qué calidad decide o ejecuta?',
        '¿Qué aprendiste de la cuenta que no estaba registrado?',
        '¿Cuál es el siguiente paso y para qué fecha?',
      ],
    }
  }

  return OK
}
