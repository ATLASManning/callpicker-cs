/**
 * middleware.ts — Protección de rutas + inyección de headers de sesión
 * Corre en Edge Runtime — solo usa jose para verificar JWT
 */
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME, esEmailAutorizado } from '@/lib/auth'

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
