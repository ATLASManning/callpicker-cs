/**
 * lib/auth.ts
 * Helpers JWT para sesión de usuario.
 * Usa la librería `jose` (ya instalada) — compatible con Edge Runtime.
 */
import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

export type { Rol } from './permisos'
import type { Rol } from './permisos'

export interface SessionPayload {
  email:        string
  nombre:       string
  rol:          Rol
  asesor_nombre: string | null   // 'Fátima' | 'Dan' | 'Claudia' | null
}

const SESSION_DURATION = 60 * 60 * 24 * 30   // 30 días en segundos
export const COOKIE_NAME = 'cp_session'

/* ── Lista blanca de acceso al dashboard ───────────────────────────────
 * Fuente única de quién puede entrar (instrucción de dirección, 1 Sep 2026).
 *
 * Se evalúa en CADA request desde el middleware — no solo al iniciar sesión.
 * Motivo: la marca `usuarios.activo` solo se revisa en login/verify, y la
 * cookie dura 30 días; el 1 Sep 2026 había 4 usuarios marcados inactivos
 * usando el dashboard con sesiones emitidas antes de la baja.
 *
 * Para cambiar la lista sin desplegar: variable de entorno
 * EMAILS_AUTORIZADOS en Vercel, con los correos separados por coma.
 */
const EMAILS_AUTORIZADOS_DEFAULT = [
  'daniel@callpicker.com',
  'josel@callpicker.com',
  'lopezdjosemanuel@gmail.com',
  /* Área de Perfilamiento (3 sep 2026) — acceso limitado por el rol
   * `perfilamiento`, ver lib/permisos.ts. Queda sólo Roberto.
   *
   * ── NANCY Y VALERIA, FUERA EL 6 OCT 2026 ────────────────────────────────
   *
   * Dirección: «Nancy Valeria tampoco deben tener acceso».
   *
   * Nunca llegaron a tener fila en `usuarios` —comprobado ese día contra la
   * tabla—, así que no podían iniciar sesión: el login exige la fila. Pero
   * estaban en ESTA lista, que es la que evalúa el middleware, y una cookie
   * suya habría pasado. Era una puerta sin llave puesta, no una puerta
   * abierta; ahora tampoco está la puerta.
   *
   * Es justo la deriva inversa a la de `enrique@` y `v.zepeda@`, que sí tienen
   * fila activa en `usuarios` pero no están aquí: ésos no entran, porque esta
   * lista manda. Las dos listas hay que mirarlas juntas.
   */
  'roberto@callpicker.com',
  // 'nancy@callpicker.com',
  // 'valeria@callpicker.com',
  /* Asesores de cuenta (7 sep 2026) — rol `asesor`: cada uno ve sólo su
   * cartera. Marcarlos `activo` en Gestión de Usuarios NO basta: esa marca
   * sólo se revisa en login/verify, mientras que esta lista se evalúa en
   * cada request desde el middleware.
   *
   * ── SUSPENDIDOS EL 6 OCT 2026, POR INSTRUCCIÓN DE DIRECCIÓN ─────────────
   *
   * «No habrá acceso para ellos hasta no haber concluido el Dashboard con lo
   * que solicitó Daniel». El tablero está a media reconstrucción —el concepto
   * de Actividad SAC se volvió Alerta de Cliente ese mismo día— y entrar
   * ahora sería trabajar contra una pantalla que va a cambiar debajo.
   *
   * POR QUÉ SE COMENTAN AQUÍ Y NO SE DESACTIVAN EN GESTIÓN DE USUARIOS
   * -----------------------------------------------------------------
   * Porque desactivarlos ahí NO los saca. Medido en producción ese mismo día:
   * los tres figuraban «Inactivo» con la contraseña vencida y aun así los tres
   * abrían el tablero completo —y cada uno veía dentro a los otros dos—. La
   * marca `activo` se revisa en login/verify; esta lista se revisa en cada
   * request. Es la única de las dos que muerde contra una cookie ya emitida,
   * y las cookies duran 30 días.
   *
   * CÓMO SE LES DEVUELVE EL ACCESO
   * ------------------------------
   * Descomentar estas tres líneas y desplegar. Si corre prisa y no se quiere
   * desplegar, la escotilla es la variable EMAILS_AUTORIZADOS en Vercel: si
   * está definida SUSTITUYE a esta lista entera, así que hay que poner en ella
   * TODOS los correos, no sólo los tres.
   *
   * ── ACCESO DEVUELTO EL 12 OCT 2026 ──────────────────────────────────────
   *
   * Dirección: «Ya les di acceso desde la mañana y les compartí a cada uno su
   * password, así que ya debieron ingresar». La condición de la suspensión
   * —concluir el Dashboard— se cumplió ese mismo día: el rediseño entró a
   * producción por la mañana.
   *
   * NO HABÍAN PODIDO ENTRAR, y no por su contraseña. `verify/route.ts:36`
   * comprueba esta lista ANTES que la contraseña y antes que `activo`, así
   * que los tres recibían «usuario_invalido» — que se lee como correo mal
   * escrito, no como suspensión. Y `ultimo_acceso` sólo se escribe al pasar
   * ese filtro: por eso Gestión de Usuarios seguía mostrando el 7 de
   * septiembre mientras los tres ya tenían contraseña nueva y estado Activo.
   *
   * Es la demostración simétrica de lo que dice el bloque de arriba: marcar
   * a alguien ACTIVO aquí tampoco le da acceso, igual que marcarlo inactivo
   * no se lo quita. Las dos listas hay que mirarlas juntas, siempre.
   */
  'fatima@callpicker.com',
  /* ── CLAUDIA HERNÁNDEZ, FUERA EL 15 OCT 2026 ──────────────────────────────
   *
   * Dirección: «Retira el acceso al Dashboard a Claudia Hernández
   * claudia@callpicker.com desde este momento. Yo lo hice en el panel,
   * asegúrate que no pueda ingresar».
   *
   * ESTA LÍNEA COMENTADA ES LO QUE HACE QUE LA BAJA EXISTA. Lo del panel la
   * dejó «Inactivo» y cerró el login nuevo, pero NO cerró su sesión viva.
   * Medido en producción ANTES de tocar nada, con una cookie firmada suya:
   *
   *     /          HTTP 200   44,573 B   ABRE
   *     /cuentas   HTTP 200   40,255 B   ABRE
   *     /alertas   HTTP 200   39,318 B   ABRE
   *     login      401 usuario_invalido   ← el panel SÍ cerró esta puerta
   *
   * O sea exactamente el caso de Aurora y el de los tres asesores del 6 oct:
   * la marca `activo` se revisa en login/verify; esta lista se revisa en CADA
   * request, y es la única de las dos que muerde contra una cookie ya emitida.
   * Las cookies duran 30 días.
   *
   * Sus APIs ya daban 403 por el candado de cartera, pero las PÁGINAS abrían:
   * veía la navegación y todo lo que no pasa por esas dos rutas. Un candado de
   * alcance no sustituye a una baja.
   *
   * Se comenta y no se borra, para que quede el rastro de que tuvo acceso y de
   * cuándo se le quitó. Nadie se dio de baja de los datos: su cartera, sus
   * seguimientos y sus alertas siguen intactos. Devolver el acceso =
   * descomentar y desplegar.
   *
   * Comprobado DESPUÉS de desplegar con
   * `python scripts/revisa-acceso-correo.py claudia@callpicker.com --esperado fuera`.
   */
  // 'claudia@callpicker.com',
  /* ── ERICK SÁNCHEZ, ALTA EL 16 OCT 2026 ───────────────────────────────────
   *
   * Dirección: «Te comparto el correo de Erick Sánchez […] y le permitas el
   * acceso a la plataforma ya lo registré». Recibe la cartera que era de
   * Claudia: 71 cuentas, ya a su nombre en `cuentas.asesor` desde el 15 oct.
   *
   * REGISTRARLO EN EL PANEL NO LE DA ACCESO. Su fila en `usuarios` ya existe
   * y está Activo, pero `verify/route.ts` comprueba ESTA lista ANTES que la
   * contraseña y antes que `activo`: sin esta línea recibiría
   * «usuario_invalido», que se lee como correo mal escrito y no como falta de
   * permiso. Es exactamente lo que les pasó a los tres asesores el 12 oct.
   *
   * Y TAMPOCO BASTA CON ESTO: el candado de `lib/dueno.ts` falla CERRADO, así
   * que un rol `asesor` con `usuarios.asesor_nombre` vacío entra al tablero y
   * recibe 403 en sus propios datos. Su fila tiene que decir «Erick» en la
   * columna ASESOR, que es justo lo que la tabla de Gestión de Usuarios no
   * dejaba editar hasta hoy.
   */
  'erick@callpicker.com',
  'dominguez.dan@callpicker.com',
  /* Aurora — alta el 10 sep 2026 por instrucción de dirección, rol `viewer`.
   *
   * ── BAJA EL 6 OCT 2026 ──────────────────────────────────────────────────
   *
   * Dirección: «Aurora, ya la di de baja». Esta línea es lo que hace que la
   * baja EXISTA.
   *
   * Es el caso más claro de por qué esta lista no es redundante con Gestión de
   * Usuarios. Al darla de baja, su fila de `usuarios` se BORRÓ —no quedó
   * inactiva, desapareció— y aun así, medido contra producción ese mismo día,
   * seguía abriendo el tablero completo: HTTP 200, 990 KB. Una vez que hay
   * cookie firmada, el middleware no vuelve a mirar la tabla de usuarios; mira
   * la firma y esta lista, y nada más. Borrar la fila no revoca nada, sólo
   * impide volver a iniciar sesión — y la cookie dura 30 días.
   *
   * Se deja comentada y no se borra para que quede el rastro de que tuvo
   * acceso y de cuándo se le quitó.
   */
  // 'auroravelinomartinez1@gmail.com',
]

export function emailsAutorizados(): Set<string> {
  const raw  = process.env.EMAILS_AUTORIZADOS
  const list = raw ? raw.split(',') : EMAILS_AUTORIZADOS_DEFAULT
  return new Set(list.map(e => e.trim().toLowerCase()).filter(Boolean))
}

export function esEmailAutorizado(email: string | null | undefined): boolean {
  if (!email) return false
  return emailsAutorizados().has(email.trim().toLowerCase())
}

/**
 * Administración del tablero: Gestión de Usuarios.
 *
 * Instrucción de dirección (23 sep 2026): «de estos apartados nadie debe tener
 * acceso, solo josel@callpicker.com y lopezdjosemanuel@gmail.com», y «no debe
 * aparecer en sus accesos salvo en los 2 que son el administrador».
 *
 * OJO (24 sep 2026): esto ya NO gobierna «Uso Dashboard». Las dos pantallas
 * colgaban de esta misma lista, y al pedirse acceso a la de uso para
 * `daniel@callpicker.com` se separaron: ver `puedeVerUsoDashboard` abajo.
 * Gestión de Usuarios se queda como estaba, en los dos correos de dirección.
 *
 * POR QUÉ NO BASTA CON EL ROL `admin`
 * -----------------------------------
 * Hasta hoy `/admin` se protegía con `rol === 'admin'`, y funcionaba porque da
 * la casualidad de que los dos únicos admin son justo esos dos correos. Pero
 * eso es una coincidencia, no una regla: el día que alguien reciba el rol desde
 * Gestión de Usuarios —que es exactamente lo que esa pantalla hace— entraría a
 * administrar accesos sin que nadie lo hubiera decidido. La lista por correo
 * cierra esa puerta.
 *
 * Va AQUÍ y no en `lib/permisos.ts` porque los permisos son por ROL y esto es
 * por PERSONA. Mezclarlos habría hecho creer que se gobierna creando un rol.
 *
 * Se puede sobreescribir con la variable ADMIN_TABLERO en Vercel, igual que la
 * lista blanca general, por si hay que rotar a alguien sin desplegar.
 */
const ADMIN_TABLERO_DEFAULT = [
  'josel@callpicker.com',
  'lopezdjosemanuel@gmail.com',
]

export function adminsDelTablero(): Set<string> {
  const raw  = process.env.ADMIN_TABLERO
  const list = raw ? raw.split(',') : ADMIN_TABLERO_DEFAULT
  return new Set(list.map(e => e.trim().toLowerCase()).filter(Boolean))
}

/** ¿Este correo puede entrar a Gestión de Usuarios y a /api/admin? */
export function esAdminDelTablero(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.trim().toLowerCase()
  // Doble compuerta: además de estar en la lista de administración, tiene que
  // seguir en la lista blanca general. Una baja general da de baja también su
  // acceso de administrador, sin tener que acordarse de dos sitios.
  return adminsDelTablero().has(e) && esEmailAutorizado(e)
}

/* ── Uso Dashboard: su propia lista ───────────────────────────────────────────
 *
 * POR QUÉ SE SEPARÓ (24 sep 2026)
 * -------------------------------
 * Dirección pidió dar «Uso Dashboard» a `daniel@callpicker.com`. Las dos
 * pantallas de administración colgaban de `adminsDelTablero()`, así que
 * añadirlo ahí le habría dado ADEMÁS Gestión de Usuarios — que es justo la
 * pantalla donde se reparten los roles, y por tanto la llave para concederse
 * lo que quiera. Habría deshecho en un renglón el candado del 23 de septiembre.
 *
 * Son permisos distintos porque hacen cosas distintas: ésta solo LEE la
 * navegación; la otra ESCRIBE quién entra. Lo que se pidió fue lo primero.
 *
 * Quien administra el tablero puede ver el uso SIEMPRE, sin repetirse en las
 * dos listas: un correo que se retire de arriba se retira también de aquí.
 */
const USO_DASHBOARD_EXTRA = [
  // Daniel Alcalá — alta por instrucción de dirección, 24 sep 2026. Solo
  // lectura de la analítica de navegación; NO entra a Gestión de Usuarios.
  'daniel@callpicker.com',
]

export function lectoresDelUso(): Set<string> {
  // Igual que las otras dos listas, se puede rotar sin desplegar con la
  // variable USO_DASHBOARD en Vercel. Si se define, SUSTITUYE a los extras,
  // pero la administración del tablero sigue entrando.
  const raw   = process.env.USO_DASHBOARD
  const extra = raw ? raw.split(',') : USO_DASHBOARD_EXTRA
  // `Array.from` y no un spread sobre el Set: el tsconfig no trae
  // `downlevelIteration` y `[...unSet]` no compila.
  const lista = new Set(Array.from(adminsDelTablero()))
  for (const e of extra) {
    const n = e.trim().toLowerCase()
    if (n) lista.add(n)
  }
  return lista
}

/** ¿Este correo puede ver Uso Dashboard y su API de lectura? */
export function puedeVerUsoDashboard(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.trim().toLowerCase()
  // La misma doble compuerta: una baja en la lista blanca general cierra
  // también esta puerta, sin tener que acordarse de dos sitios.
  return lectoresDelUso().has(e) && esEmailAutorizado(e)
}

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET no configurado')
  return new TextEncoder().encode(s)
}

/* ── Firmar token ──────────────────────────────────────────────────── */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret())
}

/* ── Verificar token ───────────────────────────────────────────────── */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/* ── Leer sesión desde headers (puestos por middleware) ──────────────
   Usar en Server Components y API Routes                             */
export function getSessionFromHeaders(req: NextRequest): SessionPayload | null {
  const email = req.headers.get('x-user-email')
  const rol   = req.headers.get('x-user-rol') as Rol | null
  if (!email || !rol) return null
  const rawNombre  = req.headers.get('x-user-nombre') ?? ''
  const rawAsesor  = req.headers.get('x-user-asesor') ?? ''
  return {
    email,
    nombre:        decodeURIComponent(rawNombre),
    rol,
    asesor_nombre: rawAsesor ? decodeURIComponent(rawAsesor) : null,
  }
}

/* ── Opciones de cookie segura ────────────────────────────────────── */
export function cookieOptions(maxAge = SESSION_DURATION) {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge,
  }
}
