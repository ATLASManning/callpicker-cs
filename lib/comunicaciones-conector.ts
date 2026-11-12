/**
 * CLIENTE DEL CONECTOR DE COMUNICACIONES — con su control negativo puesto
 * ======================================================================
 *
 * Lee la forma del dato de `lib/comunicaciones-tipos.ts`. Lee POR QUÉ este
 * archivo desconfía por omisión del encabezado de ese mismo archivo.
 *
 * ── LA REGLA DE ESTE ARCHIVO ──────────────────────────────────────────────
 *
 *   ANTE LA DUDA, SE LANZA UN ERROR. NUNCA SE DEVUELVE UNA LISTA VACÍA.
 *
 * El conector responde **HTTP 200 con la pantalla de login** cuando no hay
 * sesión. Un cliente escrito de la forma obvia —pedir, parsear, devolver lo
 * que salga— convertiría eso en `comunicaciones: []`, y la ficha de la cuenta
 * diría, con toda tranquilidad, que el cliente no nos habla. Eso es peor que
 * un error: un error se ve, un cero se cree.
 *
 * Por eso hay DOS compuertas antes de parsear, y las dos fallan hacia el
 * error:
 *   ① ¿es la pantalla de login?        → ErrorConectorNoAutenticado
 *   ② ¿tiene la forma de una ficha?    → ErrorConectorFormaInesperada
 *
 * Y una tercera después de parsear:
 *   ③ ¿lo parseado cuadra con lo que la propia página DECLARA?
 *      → ErrorConectorNoCuadra     [[feedback-tablas-deben-cerrar]]
 *
 * ── LO QUE FALTA PARA ENCENDERLO ──────────────────────────────────────────
 *
 * `CONECTOR_COMUNICACIONES_TOKEN`. Hoy el webhook se abre con Google SSO de
 * @callpicker.com, que es una sesión de navegador: no sirve server-to-server.
 * Sin esa variable este módulo NO sale a la red — se queda en `noMedible` y lo
 * dice con palabras. Encenderlo a medias sería inventar el dato.
 */

import {
  type Canal,
  type Comunicacion,
  type ContextoComunicaciones,
  type EstadoTicket,
  type ResultadoLlamada,
  type Sentido,
  type VistaConector,
  type AnalisisLlamada,
} from './comunicaciones-tipos'

/* ── Errores: cada uno dice qué pasó, para que la pantalla lo escriba ─────── */

export class ErrorConectorNoAutenticado extends Error {
  constructor() {
    super(
      'El conector devolvió la pantalla de inicio de sesión. NO es que la ' +
        'cuenta no tenga comunicaciones: es que no tenemos credencial para leerlas.',
    )
    this.name = 'ErrorConectorNoAutenticado'
  }
}

export class ErrorConectorFormaInesperada extends Error {
  constructor(detalle: string) {
    super(`El conector respondió algo que no tiene forma de ficha: ${detalle}`)
    this.name = 'ErrorConectorFormaInesperada'
  }
}

export class ErrorConectorNoCuadra extends Error {
  constructor(parseadas: number, declaradas: number) {
    super(
      `La página declara ${declaradas} comunicaciones y se parsearon ` +
        `${parseadas}. No se publica un conteo que no cierra.`,
    )
    this.name = 'ErrorConectorNoCuadra'
  }
}

export class ErrorConectorSinCredencial extends Error {
  constructor() {
    super(
      'Falta CONECTOR_COMUNICACIONES_TOKEN. El conector hoy sólo se abre con ' +
        'sesión de navegador (Google SSO @callpicker.com), que no sirve desde ' +
        'el servidor. Mientras no exista la credencial, esto no sale a la red.',
    )
    this.name = 'ErrorConectorSinCredencial'
  }
}

/* ── ① y ② · Las compuertas ───────────────────────────────────────────────── */

/**
 * La pantalla de login, medida el 11 nov 2026: 745 bytes, `<title>Entrar</title>`,
 * y un enlace a `com-contexto-login`. Se reconoce por CUALQUIERA de los tres.
 * Deliberadamente generoso: un falso positivo aquí cuesta un error visible;
 * un falso negativo cuesta un cero inventado.
 */
export function esPantallaDeLogin(html: string): boolean {
  return (
    /com-contexto-login/i.test(html) ||
    /<title>\s*Entrar\s*<\/title>/i.test(html) ||
    /Entrar con Google/i.test(html)
  )
}

/**
 * ¿Esto tiene forma de ficha?
 *
 * LA MARCA ES EL RÓTULO «COMUNICACIONES (n)», NO EL TAMAÑO NI LAS TARJETAS.
 *
 * Mi primera versión exigía 2,000 bytes y al menos un contenedor `.it`. Las
 * dos condiciones estaban mal, y el control positivo de la prueba las tiró:
 *
 *   · el umbral de bytes es un número inventado. La ficha de Plastitabla pesa
 *     68,609 porque tiene 28 comunicaciones; una cuenta con una sola pesa una
 *     fracción de eso y habría sido rechazada por chica.
 *
 *   · exigir `.it` es PEOR: una cuenta que de verdad no tiene comunicaciones
 *     sirve «COMUNICACIONES (0)» y cero tarjetas. Esa página es una respuesta
 *     VÁLIDA y su cero está MEDIDO. Rechazarla habría convertido el único cero
 *     legítimo del sistema en un error. Ver [[feedback-cero-sin-medicion]].
 *
 * Entonces: el rótulo manda. Si declara n > 0, exigimos que las tarjetas
 * existan —si no, algo se truncó—. Si declara 0, cero tarjetas es la respuesta
 * correcta y se deja pasar.
 */
export function tieneFormaDeFicha(html: string): { ok: boolean; detalle: string } {
  const m = html.match(/COMUNICACIONES\s*\((\d+)\)/i)
  if (!m) return { ok: false, detalle: 'sin el rótulo COMUNICACIONES (n)' }

  const declaradas = parseInt(m[1], 10)
  const hayTarjetas = /class="it"/.test(html)

  if (declaradas > 0 && !hayTarjetas) {
    return {
      ok: false,
      detalle: `declara ${declaradas} comunicaciones pero no trae ni una tarjeta`,
    }
  }
  return { ok: true, detalle: '' }
}

/* ── Utilidades de parseo ─────────────────────────────────────────────────── */

const MESES: Record<string, string> = {
  ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
  jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12',
}

/**
 * «11 nov 2026, 03:07 p.m.» → «2026-11-11T15:07:00-06:00»
 *
 * El huso se escribe EXPLÍCITO. Vercel corre en UTC y un `new Date(texto)` sin
 * huso se interpreta allá, no aquí. Ver [[feedback-fechas-zona-mexico]].
 * México no cambia de horario desde 2022, así que -06:00 es constante.
 *
 * Devuelve `null` si no se puede leer: el llamador decide, no se inventa un
 * «hoy» por omisión.
 */
export function fechaMexicoAIso(texto: string): string | null {
  const m = texto.match(
    /(\d{1,2})\s+([a-záéíóú]{3})\w*\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?)?/i,
  )
  if (!m) return null
  const mes = MESES[m[2].slice(0, 3).toLowerCase()]
  if (!mes) return null
  const dia = m[1].padStart(2, '0')
  if (!m[4]) return `${m[3]}-${mes}-${dia}T00:00:00-06:00`
  let hora = parseInt(m[4], 10) % 12
  if (m[6].toLowerCase() === 'p') hora += 12
  return `${m[3]}-${mes}-${dia}T${String(hora).padStart(2, '0')}:${m[5]}:00-06:00`
}

/** «7 min 51 s» → 471 · «42 s» → 42 · «17 min 34 s» → 1054 */
export function duracionASegundos(texto: string): number | null {
  const min = texto.match(/(\d+)\s*min/)
  const seg = texto.match(/(\d+)\s*s\b/)
  if (!min && !seg) return null
  return (min ? parseInt(min[1], 10) * 60 : 0) + (seg ? parseInt(seg[1], 10) : 0)
}

export function resultadoDeLlamada(chips: string[]): ResultadoLlamada | null {
  const t = chips.join(' · ').toLowerCase()
  if (/contestada/.test(t)) return 'contestada'
  if (/perdida/.test(t)) return 'perdida'
  if (/men[úu]/.test(t)) return 'menu'
  return chips.length ? 'desconocido' : null
}

/**
 * «Cerrado» / «Pendiente» / «Abierto».
 *
 * `desconocido` NO es `cerrado`. Nuestra fuente semanal ya nos acostumbró mal:
 * trae 7,914 de 7,916 filas con cierre porque sólo exporta cerrados, y de ahí
 * salió la costumbre de leer la ausencia como cierre. Ver [[tickets-fuente]].
 */
export function estadoDeTicket(chips: string[]): EstadoTicket | null {
  const t = chips.join(' · ').toLowerCase()
  if (/cerrado/.test(t)) return 'cerrado'
  if (/pendiente/.test(t)) return 'pendiente'
  if (/abierto/.test(t)) return 'abierto'
  return chips.length ? 'desconocido' : null
}

export function canalDeTexto(texto: string): Canal | null {
  const t = texto.trim().toLowerCase()
  if (t.startsWith('ticket')) return 'ticket'
  if (t.startsWith('llamada')) return 'llamada'
  if (t.startsWith('correo')) return 'correo'
  if (t.startsWith('whatsapp')) return 'whatsapp'
  return null
}

export function sentidoDeTexto(texto: string): Sentido | null {
  if (/·\s*entrante/i.test(texto)) return 'entrante'
  if (/·\s*saliente/i.test(texto)) return 'saliente'
  return null
}

/* ── El análisis del modelo de la fuente ──────────────────────────────────── */

export const analisisVacio = (): AnalisisLlamada => ({
  riesgoCancelacion: null,
  desempeno: null,
  tipo: null,
  rotuloNecesidad: null,
  necesidad: null,
  rotuloResolucion: null,
  resolucion: null,
  resultado: null,
  siguientePaso: null,
  loQueHizoBien: [],
  sugerencias: [],
})

/* ── ③ · El cierre ────────────────────────────────────────────────────────── */

/** «COMUNICACIONES (28)» → 28. `null` si la página no lo declara. */
export function declaradasEnLaPagina(html: string): number | null {
  const m = html.match(/COMUNICACIONES\s*\((\d+)\)/i)
  return m ? parseInt(m[1], 10) : null
}

/**
 * La puerta final. Se llama SIEMPRE antes de devolver una ficha.
 *
 * Si la página declara 28 y parseamos 26, publicar 26 sería publicar una
 * mentira cómoda. Cada corte de la cadena cierra o no se publica.
 */
export function exigeQueCuadre(ctx: ContextoComunicaciones): void {
  if (ctx.declaradas === null) return // no declaró: no hay contra qué cuadrar
  if (ctx.declaradas !== ctx.comunicaciones.length) {
    throw new ErrorConectorNoCuadra(ctx.comunicaciones.length, ctx.declaradas)
  }
}

/* ── La puerta de entrada ─────────────────────────────────────────────────── */

export interface OpcionesConector {
  vista: VistaConector
  idZoho: string
  /** Para pruebas: HTML ya capturado, sin salir a la red. */
  htmlDePrueba?: string
}

/**
 * Trae y valida una ficha. NO parsea todavía el cuerpo —ese parser se escribe
 * contra la rama JSON, no contra las clases de una letra (`it`, `h`, `ia`,
 * `med`) que alguien minificó a mano dentro de un nodo de n8n y que cambian el
 * día que ese alguien edite la plantilla.
 *
 * Lo que este módulo YA garantiza, y es lo que importa: que una pantalla de
 * login jamás entre al tablero disfrazada de cuenta silenciosa.
 */
export async function validaRespuestaDelConector(
  opts: OpcionesConector,
): Promise<{ html: string; declaradas: number | null }> {
  let html: string

  if (opts.htmlDePrueba !== undefined) {
    html = opts.htmlDePrueba
  } else {
    const base = process.env.CONECTOR_COMUNICACIONES_URL
    const token = process.env.CONECTOR_COMUNICACIONES_TOKEN
    if (!base || !token) throw new ErrorConectorSinCredencial()

    const url = `${base}?v=${encodeURIComponent(opts.vista)}&id=${encodeURIComponent(opts.idZoho)}`
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/html' },
      cache: 'no-store',
    })
    html = await r.text()
  }

  // ① ¿login?  — primero, porque llega con HTTP 200 y pasaría cualquier
  //              comprobación basada en el código de respuesta.
  if (esPantallaDeLogin(html)) throw new ErrorConectorNoAutenticado()

  // ② ¿tiene forma de ficha?
  const forma = tieneFormaDeFicha(html)
  if (!forma.ok) throw new ErrorConectorFormaInesperada(forma.detalle)

  return { html, declaradas: declaradasEnLaPagina(html) }
}
