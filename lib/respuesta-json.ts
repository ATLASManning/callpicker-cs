/**
 * LEER UNA RESPUESTA DE NUESTRA PROPIA API SIN CONFUNDIR «NO AUTORIZADO» CON «ROTO»
 * ================================================================================
 *
 * El middleware de este proyecto NO devuelve 401 cuando la sesión caducó:
 * **sirve la pantalla de login con HTTP 200 y `text/html`**. Un `fetch` ingenuo
 * ve `r.ok === true`, llama a `r.json()` y revienta con
 *
 *     SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
 *
 * que es exactamente lo que vio el expediente de entrega al probarlo el 18 nov
 * 2026. Para quien usa el tablero, ese texto no dice nada; lo que pasó es que
 * hay que volver a entrar.
 *
 * Es la misma trampa que ya nos costó una lectura falsa en el conector de
 * comunicaciones —responde 200 con el login y un `fetch` ingenuo lo guardaba
 * como «cero comunicaciones»—, así que la regla se escribe UNA vez y se usa
 * desde los tres sitios que leen JSON de nuestra API.
 *
 * Comprobar `status === 401 || status === 302` NO sirve aquí: ninguno de los dos
 * llega. Lo que distingue el caso es el `content-type`.
 */

export class ErrorSesion extends Error {
  constructor() {
    super('Tu sesión expiró. Recarga la página e ingresa de nuevo.')
    this.name = 'ErrorSesion'
  }
}

/**
 * Devuelve el JSON de la respuesta, o lanza con un mensaje legible.
 *
 * - HTML con 200  → `ErrorSesion` (el login servido por el middleware).
 * - JSON con !ok  → el `error` que traiga el cuerpo, o `HTTP <status>`.
 * - Cualquier otra cosa → el tipo que llegó, dicho con palabras, nunca el
 *   `SyntaxError` del parser.
 */
export async function leeJson<T>(r: Response): Promise<T> {
  const tipo = (r.headers.get('content-type') ?? '').toLowerCase()

  if (!tipo.includes('json')) {
    /* La pantalla de login es HTML. Si además vino con 200, es sesión caducada
       y no un fallo del servidor: decirlo mal manda a la persona a buscar un
       error que no existe. */
    if (tipo.includes('html')) throw new ErrorSesion()
    throw new Error(
      `El servidor respondió ${r.status} con ${tipo || 'un tipo sin declarar'}, no con JSON.`
    )
  }

  const j = await r.json()
  if (!r.ok) throw new Error(String(j?.error ?? `HTTP ${r.status}`))
  return j as T
}

/** El texto que se le enseña a la persona, venga de donde venga el fallo. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorSesion) return e.message
  if (e instanceof Error) return e.message
  return String(e)
}
