/**
 * middleware.ts — Protección de rutas + inyección de headers de sesión
 * Corre en Edge Runtime — solo usa jose para verificar JWT
 */
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {
  COOKIE_NAME, esEmailAutorizado, esAdminDelTablero, puedeVerUsoDashboard,
} from '@/lib/auth'
import { puedeAbrir, definicionRol } from '@/lib/permisos'

/* `/api/cron/estado` es pública a propósito: solo dice si `CRON_SECRET` está
   configurado —ni el valor ni su longitud— y existe precisamente para
   diagnosticar el acceso de los crons. Pedirle sesión sería el mismo círculo que
   vino a romper: un fallo de autenticación que no se puede consultar porque
   consultarlo requiere autenticarse. */
const PUBLIC_PATHS  = ['/acceso', '/api/auth/', '/api/cron/estado']
const ADMIN_ONLY    = ['/admin',  '/api/admin/']
/* Uso Dashboard y su API de lectura tienen su PROPIA lista desde el 24 sep
 * 2026, más ancha que la de Gestión de Usuarios. `/api/analytics/uso` se suma
 * aquí aunque la ruta ya se guarde sola: el middleware corre antes y es el
 * único sitio donde la regla vale para la página y para su API a la vez. */
const USO_PATHS     = ['/admin/uso', '/api/analytics/uso']

const isPublic    = (p: string) => PUBLIC_PATHS.some(x => p.startsWith(x))
const isAdminOnly = (p: string) => ADMIN_ONLY.some(x => p.startsWith(x))
const isUso       = (p: string) => USO_PATHS.some(x => p.startsWith(x))

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Los documentos NO se eximen: antes se servían sin sesión a cualquiera con
  // la URL. La regla de abajo deja pasar toda ruta con extensión —lo que los
  // recursos estáticos necesitan— pero también deja pasar cualquier archivo que
  // alguien deje caer en public/.
  //
  // /docs/ ya estaba cubierto (auditorías CONFIDENCIAL, one-pagers internos).
  // /auditorias/ se suma el 18 sep 2026: ahí viven dos reportes de llamadas de
  // clientes con nombre y apellido, enlazados desde el módulo de Auditoría, y
  // se estaban descargando sin sesión.
  //
  // OJO AL AGREGAR ARCHIVOS: todo lo que se ponga en public/ fuera de estas dos
  // carpetas queda público. El 18 sep 2026 se borraron tres exports que nadie
  // enlazaba y que cualquiera podía bajar: el tablero de activaciones (2,609
  // filas), los cortes de facturación (18,104) y los tickets (4,435).
  const esDocumento = pathname.startsWith('/docs/') || pathname.startsWith('/auditorias/')

  if (
    !esDocumento && (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      /\.\w+$/.test(pathname)
    )
  ) return NextResponse.next()

  /* ── EL EDGE SE DELATA A SÍ MISMO, SOLO EN `/api/cron/estado` ──────────
   *
   * El 30 sep 2026 se configuró CRON_SECRET en Vercel y `/api/cron/estado`
   * contestó `puedenCorrer: true` de inmediato… mientras una llamada real de
   * cron seguía recibiendo el HTML del login. Las dos cosas son ciertas a la
   * vez: ese estado lo lee la RUTA, que corre en Node; quien decide si la
   * llamada entra es ESTE archivo, que corre en el Edge. Si discrepan, el flag
   * dice que todo está bien y el cron no corre — en silencio, que es la forma
   * de falla que este tablero ya padeció durante meses.
   *
   * Así que el Edge contesta dos preguntas sobre sí mismo, y ninguna revela el
   * secreto: si TIENE la variable, y si lo que le acaban de mandar COINCIDE.
   * No el valor, no un prefijo, no la longitud. Con eso se separan las tres
   * causas posibles: la variable no llegó al Edge, el valor guardado es otro,
   * o el problema está en otra parte.
   *
   * Va solo en esta ruta, que ya era pública, y solo si quien pregunta trae
   * una cabecera `authorization` — sin ella no hay nada que comparar. */
  if (pathname === '/api/cron/estado') {
    const enviado = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const res = NextResponse.next()
    res.headers.set('x-cron-edge', process.env.CRON_SECRET ? 'si' : 'no')
    res.headers.set('x-cron-match',
      !enviado ? 'sin-cabecera'
        : enviado === process.env.CRON_SECRET ? 'si' : 'no')
    return res
  }

  if (isPublic(pathname)) return NextResponse.next()

  /* ── LAS TAREAS PROGRAMADAS ENTRAN CON SU PROPIO SECRETO ───────────────
   *
   * Vercel dispara los crons con `Authorization: Bearer $CRON_SECRET`. Sin esta
   * puerta el middleware los mandaba a `/acceso` —no traen cookie de sesión— y
   * el redirect responde 200 con HTML, así que Vercel los daba por exitosos.
   *
   * Eso llevaba pasando meses: `/api/cron/refresh-tenure` está programado desde
   * hace tiempo y NUNCA ha corrido. Se comprobó el 28 sep 2026 pidiéndolo sin
   * sesión: devolvía el HTML del login con status 200. Es el mismo fallo que el
   * código ya documenta en la conciliación con Zoho — un redirect que `fetch`
   * sigue y convierte en éxito aparente.
   *
   * Autorización, no excepción: sin el secreto correcto no pasa nada. Y va
   * acotado a `/api/`, así que aunque el secreto se filtrara no abre ninguna
   * pantalla, solo endpoints.
   *
   * FAIL-CLOSED: si `CRON_SECRET` no está configurado en Vercel, esto no deja
   * pasar a nadie. Es el lado seguro — un cron que no corre se nota; una puerta
   * abierta sin llave, no. `/api/cron/estado` dice si el secreto existe.
   */
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const cronSecret = process.env.CRON_SECRET
  if (pathname.startsWith('/api/') && cronSecret && bearer === cronSecret) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/acceso'
    return NextResponse.redirect(url)
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    const rol          = (payload.rol          as string) ?? 'viewer'
    const email        = (payload.email        as string) ?? ''
    const nombre       = (payload.nombre       as string) ?? ''
    const asesor_nombre = (payload.asesor_nombre as string) ?? ''

    // Lista blanca — se aplica en cada request, así una sesión emitida antes
    // de la baja del usuario deja de funcionar de inmediato.
    if (!esEmailAutorizado(email)) {
      const url = req.nextUrl.clone()
      url.pathname = '/acceso'
      url.search   = '?motivo=no_autorizado'
      const res = NextResponse.redirect(url)
      res.cookies.delete(COOKIE_NAME)
      return res
    }

    /* Administración del tablero, cerrada por CORREO y no por rol desde el 23
     * sep 2026 por instrucción de dirección. Ya NO basta el rol `admin`: ver el
     * porqué en `esAdminDelTablero`, lib/auth.ts.
     *
     * Aquí es donde se decide de verdad. Ocultar los enlaces del menú no
     * protege nada —la URL se puede teclear— y una comprobación dentro de la
     * página tampoco alcanza a sus APIs. Esto corre antes que ambas.
     *
     * SON DOS COMPUERTAS, NO UNA (24 sep 2026). «Uso Dashboard» solo LEE la
     * navegación; «Gestión de Usuarios» ESCRIBE quién entra, así que es la
     * llave de todo lo demás. Al abrir la primera a Daniel se separaron.
     *
     * EL ORDEN NO ES CASUAL: `/admin/uso` también empieza por `/admin`, de modo
     * que si se preguntara primero por `isAdminOnly` caería en la lista
     * estrecha y la apertura no serviría de nada. Lo específico va antes.
     *
     * A las llamadas de API se les responde 403 y no un redirect, que el
     * cliente no sabría interpretar. */
    const fueraDeUso   = isUso(pathname)       && !puedeVerUsoDashboard(email)
    const fueraDeAdmin = !isUso(pathname)      && isAdminOnly(pathname) && !esAdminDelTablero(email)
    if (fueraDeUso || fueraDeAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Solo la administración del tablero puede usar este módulo.' },
          { status: 403 },
        )
      }
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Permisos por modulo. Se aplica aqui y no solo escondiendo enlaces en el
    // menu: ocultar un link no impide teclear la URL. Un rol acotado que pida
    // un modulo ajeno cae en su pantalla de inicio; si es una llamada de API,
    // recibe 403 en vez de un redirect que el cliente no sabria interpretar.
    if (!puedeAbrir(rol, pathname, req.method)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Tu rol no tiene acceso a este modulo.' },
          { status: 403 },
        )
      }
      const url = req.nextUrl.clone()
      url.pathname = definicionRol(rol).inicio
      url.search   = ''
      return NextResponse.redirect(url)
    }

    /* ── POR QUE `res.headers.set()` Y NO `next({ request: { headers } })` ──
     *
     * Parece un error —la forma documentada para reescribir cabeceras de la
     * PETICION es `next({ request: { headers } })`— y el 18 sep 2026 una
     * revision lo reporto como tal: «las x-user-* nunca llegan al handler, los
     * ~40 sitios con `?? 'viewer'` caen siempre al default».
     *
     * ES FALSO, y se comprobo en el Next instalado (14.2.3):
     * `router-utils/resolve-routes.js:389-392` recorre TODAS las cabeceras de
     * respuesta del middleware y hace `req.headers[key] = value`. O sea que
     * estas cuatro llegan igual al route handler y a `headers()` de los Server
     * Components. La evidencia de campo lo confirma: el boton «Borrar» de
     * Observaciones KAM depende de `canEdit = rol === 'admin' || 'asesor'` y se
     * pinta correctamente.
     *
     * NO cambiar esto a `next({ request: { headers } })` sin poder probarlo en
     * vivo: esa ruta pasa por el override, que BORRA toda cabecera de la
     * peticion que no venga en la lista, y aqui se juega la autorizacion de
     * toda la aplicacion.
     *
     * Lo que si conviene revisar algun dia: en las rutas PUBLICAS el middleware
     * sale antes (linea 31) y no pone nada, asi que una x-user-* que mandara el
     * cliente sobreviviria. Hoy no se explota porque ninguna ruta publica lee
     * esas cabeceras — /api/auth/me se paso a leer la cookie justamente por
     * eso—, pero es una invariante que nadie esta vigilando. */
    const res = NextResponse.next()
    res.headers.set('x-user-email',  email)
    res.headers.set('x-user-rol',    rol)
    res.headers.set('x-user-nombre', encodeURIComponent(nombre))
    res.headers.set('x-user-asesor', encodeURIComponent(asesor_nombre))
    return res

  } catch {
    const url = req.nextUrl.clone()
    url.pathname = '/acceso'
    const res = NextResponse.redirect(url)
    res.cookies.delete(COOKIE_NAME)
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
