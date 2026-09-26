/**
 * lib/cierre-seguimiento.ts — «el cliente no quiere» no es una respuesta.
 *
 * INSTRUCCIÓN DE DIRECCIÓN (25 sep 2026)
 * --------------------------------------
 * «Si responden que el cliente no quiere o cualquier respuesta corta, oblígalos a
 * que te expliquen y detallen qué acciones tomaron, a quién le presentaron, si es
 * la persona correcta, por qué no contratan más servicios, una integración, etc.»
 *
 * LA REGLA NO EXIGE QUE LA NOTICIA SEA BUENA
 * ------------------------------------------
 * «Hablé con Anahí el 12 de agosto, me dijo que lo verían en comité, no ha vuelto
 * a contestar y lo escalé a dirección comercial el 3 de septiembre» es una
 * respuesta EXCELENTE aunque el resultado sea malo. Lo que se rechaza es el
 * vacío, el relleno y la sentencia sin trabajo detrás.
 *
 * Y un «no quiere» dispara exigencia extra a propósito: es la frase con la que se
 * cierra una conversación que nunca se tuvo.
 *
 * POR QUÉ ESTÁ EN SU PROPIO ARCHIVO
 * ---------------------------------
 * Vivía dentro de `lib/focos-riesgo.ts`, y ese módulo arrastra los 3.5 MB de
 * `lib/tickets-data.json` más el Excel de cortes. La ruta que cierra actividades
 * —`/api/actividades/[id]`— es interactiva y solo necesita el validador, así que
 * importarlo de allá le habría cargado el dataset entero en cada cierre.
 * `focos-riesgo` lo re-exporta para que el generador siga importando de un lugar.
 */

export const TIPO_FOCO = 'foco_riesgo' as const

/**
 * Qué trabajo era esta actividad, leído del marcador de su descripción.
 *
 * `descripcionFoco` escribe `[SEGUIMIENTO·CLASE·TRABAJO] …` en la primera línea.
 * Se codifica ahí porque la tabla `actividades` no tiene columna para el trabajo
 * y agregarla exige una migración; es el mismo recurso que usa la aclaración.
 *
 * Devuelve `''` cuando no hay marcador — las actividades generadas ANTES de que
 * el trabajo existiera no lo traen, y ésas se validan con las reglas generales.
 * Fallar hacia «sin trabajo» es lo correcto aquí: un candado que no se puede
 * determinar no debe inventarse uno.
 */
export function trabajoDeDescripcion(desc: unknown): string {
  const m = /^\[SEGUIMIENTO·[^·\]]+·([^\]]+)\]/.exec(String(desc ?? '').trim())
  return m ? m[1].trim().toLowerCase() : ''
}

/** Mínimos por campo. Una gestión real no cabe en menos. */
const MIN_CONTACTO = 30
const MIN_ACCIONES = 60
const MIN_MOTIVO   = 60

/** Cuánto detalle se exige en el porqué cuando la respuesta trae una sentencia. */
const MIN_MOTIVO_CON_SENTENCIA = 140

/**
 * Declarar que en una cuenta decide UNA SOLA persona es la escotilla del Mapa de
 * Decisores, y las escotillas se cobran caras: existen cuentas así —un dueño,
 * una empresa de tres— pero también es la salida fácil para no investigar. Se
 * exige el mismo detalle que a una sentencia.
 */
export const MIN_MOTIVO_DECISOR_UNICO = 140

/* ══════════════════════════════════════════════════════════════════
   LA ESCOTILLA NO SE ABRE SOLA: la autoriza Daniel Martínez

   Instrucción de dirección, 25 sep 2026: «puede ser que alguna cuenta tenga esa
   limitante, pero si ya se investigó deberá solicitar autorización a Daniel
   Martínez para que se cierre la actividad, con la nota de la investigación y
   el OK de Daniel Martínez.»

   Por qué importa el diseño: una escotilla que el propio asesor abre marcando
   una casilla no es una escotilla, es un botón de saltarse el trabajo. Con
   autorización de por medio sigue existiendo la salida legítima —hay cuentas
   donde de verdad decide una sola persona— pero pasa por alguien que puede
   mirar la investigación y decir que no.

   Cómo está implementado, y por qué así: la tabla `actividades` NO tiene columna
   de autorización y agregarla exige una migración SQL. Así que la solicitud se
   guarda en `motivo_pendiente` con un marcador, y la actividad se queda ABIERTA
   —`completada = false`— que es exactamente lo que es: trabajo entregado,
   esperando visto bueno. Nada de inventar un valor nuevo de `estado`: esa
   columna hoy solo usa tres y no se ha verificado que acepte un cuarto.
══════════════════════════════════════════════════════════════════ */

/**
 * Quién puede autorizar el cierre con un solo decisor.
 *
 * Daniel Martínez es `daniel@callpicker.com`. OJO: NO es `dominguez.dan@…`, que
 * es Dan Domínguez, asesor de cuenta — si se confundieran, un asesor estaría
 * autorizando sus propias excepciones. Hay dos Dan en la casa.
 *
 * Dirección entra también, porque quien pone la regla puede aplicarla.
 * Se puede mover sin desplegar con AUTORIZAN_DECISOR_UNICO en Vercel.
 */
const AUTORIZAN_POR_DEFECTO = [
  'daniel@callpicker.com',
  'josel@callpicker.com',
  'lopezdjosemanuel@gmail.com',
]

export const AUTORIZA_NOMBRE = 'Daniel Martínez'

export function puedeAutorizarDecisorUnico(email: string | null | undefined): boolean {
  if (!email) return false
  const raw = process.env.AUTORIZAN_DECISOR_UNICO
  const lista = raw ? raw.split(',') : AUTORIZAN_POR_DEFECTO
  return new Set(lista.map(e => e.trim().toLowerCase()).filter(Boolean))
    .has(email.trim().toLowerCase())
}

const MARCA_SOLICITUD = 'AUTORIZACIÓN PENDIENTE'

/** El texto que queda en `motivo_pendiente` mientras espera el visto bueno. */
export function marcaSolicitudAutorizacion(fecha: string, nota: string): string {
  return `[${MARCA_SOLICITUD} · ${AUTORIZA_NOMBRE} · ${fecha}]\n\n${nota}`
}

/** ¿Esta actividad está esperando autorización? Devuelve la nota, o `null`. */
export function solicitudPendiente(motivo: unknown): string | null {
  const t = String(motivo ?? '')
  if (!t.startsWith(`[${MARCA_SOLICITUD}`)) return null
  const corte = t.indexOf('\n\n')
  return corte === -1 ? '' : t.slice(corte + 2)
}

/** El sello que se guarda en el resultado cuando se autoriza. */
export function selloAutorizacion(porEmail: string, fecha: string): string {
  return `AUTORIZADO por ${AUTORIZA_NOMBRE} (${porEmail}) el ${fecha} — ` +
    'cierre con un solo decisor identificado.'
}

/** Respuestas que no dicen nada, por muy sinceras que sean. */
const RELLENO = [
  'na', 'n/a', 'ninguna', 'ninguno', 'nada', 'sin novedad', 'ok', 'listo',
  'hecho', 'realizado', 'atendido', 'seguimiento', 'se dio seguimiento',
  'pendiente', 'en proceso', 'sin respuesta', 'no contesta', 'no contestó',
  'no aplica', 'ya se hizo', 'se llamo', 'se llamó', 'se envio', 'se envió',
  '-', '.', 'x', 'xx',
]

/**
 * Frases que CIERRAN una conversación en vez de contarla. No están prohibidas
 * —a veces son la verdad— pero obligan a explicar el porqué con detalle.
 */
const SENTENCIAS = [
  'no quiere', 'no quiso', 'no le interesa', 'no está interesado',
  'no esta interesado', 'no acepta', 'no aceptó', 'no acepto',
  'no tiene presupuesto', 'no hay presupuesto', 'lo va a pensar',
  'no por ahora', 'más adelante', 'mas adelante', 'no lo necesita',
  'está bien así', 'esta bien asi', 'no requiere',
]

function limpio(s: string): string {
  return s.trim().toLowerCase().replace(/[.;,!¡¿?]+$/g, '')
}

/**
 * Sin acentos, para que la detección no dependa de que escriban bien.
 *
 * Es la misma lección de `lib/actividades/cierre.ts`: el asesor que escribe
 * rápido pone «no esta interesado» sin tilde, y una lista con tildes le pasaba
 * por encima. Aquí SENTENCIAS trae las dos formas por claridad, pero se compara
 * sobre el texto normalizado para cubrir también las que no anoté.
 */
function sinAcentos(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function esRelleno(s: string): boolean {
  const t = limpio(s)
  const n = sinAcentos(t)
  return RELLENO.some(r => t === r || n === sinAcentos(r))
}

function traeSentencia(s: string): string | null {
  const n = sinAcentos(limpio(s))
  return SENTENCIAS.find(f => n.includes(sinAcentos(f))) ?? null
}

export interface CierreSeguimiento {
  /** Con quién hablaste: nombre, puesto y por qué vía. */
  contacto?: unknown
  /** Qué hiciste: acciones concretas con fechas. */
  acciones?: unknown
  /** Por qué quedó así y cuál es el siguiente paso. */
  motivo?: unknown
}

export interface VeredictoSeguimiento {
  permitido: boolean
  faltantes: string[]
  mensaje: string | null
}

export function validarCierreSeguimiento(v: CierreSeguimiento): VeredictoSeguimiento {
  const contacto = String(v.contacto ?? '').trim()
  const acciones = String(v.acciones ?? '').trim()
  const motivo   = String(v.motivo ?? '').trim()
  const faltantes: string[] = []

  if (contacto.length < MIN_CONTACTO || esRelleno(contacto)) {
    faltantes.push(
      `CON QUIÉN HABLASTE (mínimo ${MIN_CONTACTO} caracteres): nombre, puesto y por qué vía. ` +
      'Y di si esa persona DECIDE o solo opera: hablar con quien no decide explica muchos «no».',
    )
  }
  if (acciones.length < MIN_ACCIONES || esRelleno(acciones)) {
    faltantes.push(
      `QUÉ HICISTE (mínimo ${MIN_ACCIONES} caracteres): las acciones concretas con fechas. ` +
      'Qué le presentaste, con qué datos, en qué formato. Si no lograste contacto, cuántas ' +
      'veces lo intentaste, por qué vías y en qué fechas.',
    )
  }
  if (motivo.length < MIN_MOTIVO || esRelleno(motivo)) {
    faltantes.push(
      `POR QUÉ QUEDÓ ASÍ (mínimo ${MIN_MOTIVO} caracteres): la razón de fondo y el siguiente ` +
      'paso con fecha. No el resultado, la CAUSA.',
    )
  }

  /* Una sentencia sin trabajo detrás no cierra. Se revisa el texto completo: da
     igual en qué campo la escriban. Y solo se evalúa cuando los tres mínimos ya
     pasaron, para no apilar dos regaños por lo mismo. */
  const sentencia = traeSentencia(`${contacto} ${acciones} ${motivo}`)
  if (sentencia && faltantes.length === 0 && motivo.length < MIN_MOTIVO_CON_SENTENCIA) {
    faltantes.push(
      `Escribiste «${sentencia}», y eso es un resultado, no una explicación. Para cerrar con ` +
      `esa respuesta hace falta el detalle (mínimo ${MIN_MOTIVO_CON_SENTENCIA} caracteres en el ` +
      'porqué): ¿a quién se lo presentaste y esa persona decide? ¿Qué le presentaste exactamente? ' +
      '¿Qué objeción puso —precio, momento, no lo entendió, ya tiene otro proveedor—? ¿Qué le ' +
      'ofreciste para rebatirla? ¿Cuándo se retoma y con quién?',
    )
  }

  if (faltantes.length === 0) return { permitido: true, faltantes: [], mensaje: null }
  return {
    permitido: false,
    faltantes,
    mensaje: 'Este seguimiento no se puede cerrar todavía: falta la evidencia del trabajo.',
  }
}

/** Une los tres campos en el `resultado` que se guarda, sin perder la estructura. */
export function componerResultadoSeguimiento(
  contacto: string, acciones: string, motivo: string,
): string {
  return [
    `CONTACTO: ${contacto.trim()}`,
    `ACCIONES: ${acciones.trim()}`,
    `POR QUÉ Y SIGUIENTE PASO: ${motivo.trim()}`,
  ].join('\n\n')
}
