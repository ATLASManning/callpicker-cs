import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { SignJWT } from 'jose'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/acceso', req.url))
  }

  // Validate the token
  const { data: solicitud, error } = await supabaseAdmin
    .from('solicitudes_acceso')
    .select()
    .eq('token', token)
    .eq('estado', 'aprobado')
    .single()

  if (error || !solicitud) {
    return NextResponse.redirect(new URL('/acceso?error=token_invalido', req.url))
  }

  // Sign a JWT valid for 90 days
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me')
  const jwt = await new SignJWT({
    sub: solicitud.email,
    nombre: solicitud.nombre,
    id: solicitud.id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('90d')
    .setIssuedAt()
    .sign(secret)

  const res = NextResponse.redirect(new URL('/', req.url))
  res.cookies.set('cp_access', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90 days
    path: '/',
  })

  return res
}
