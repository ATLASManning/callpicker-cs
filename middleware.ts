import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/acceso', '/api/solicitar', '/api/aprobar', '/api/ingresar']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/workbox')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('cp_access')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/acceso', req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me')
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/acceso', req.url))
    res.cookies.delete('cp_access')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
