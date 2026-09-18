/**
 * middleware.ts — Protección de rutas + inyección de headers de sesión
 * Corre en Edge Runtime — solo usa jose para verificar JWT
 */
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME, esEmailAutorizado } from '@/lib/auth'
import { puedeAbrir, definicionRol } from '@/lib/permisos'

const PUBLIC_PATHS  = ['/acceso', '/api/auth/']
const ADMIN_ONLY    = ['/admin',  '/api/admin/']

const isPublic    = (p: string) => PUBLIC_PATHS.some(x => p.startsWith(x))
const isAdminOnly = (p: string) => ADMIN_ONLY.some(x => p.startsWith(x))

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Los documentos de /docs/ (auditorías CONFIDENCIAL, one-pagers internos)
  // NO se eximen: antes se servían sin sesión a cualquiera con la URL.
  const esDocumento = pathname.startsWith('/docs/')

  if (
    !esDocumento && (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      /\.\w+$/.test(pathname)
    )
  ) return NextResponse.next()

  if (isPublic(pathname)) return NextResponse.next()

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

    if (isAdminOnly(pathname) && rol !== 'admin') {
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
