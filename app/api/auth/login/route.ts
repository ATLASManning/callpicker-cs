/**
 * POST /api/auth/login
 * Valida email + contraseña → emite JWT cookie 52h.
 * La contraseña la asigna el admin; expira en 30 días.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword } from '@/lib/password'
import { signToken, cookieOptions, COOKIE_NAME, esEmailAutorizado } from '@/lib/auth'
import type { Rol } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'email y password requeridos' }, { status: 400 })
  }

  const clean = email.trim().toLowerCase()

  // Lista blanca de dirección — se valida antes que nada
  if (!esEmailAutorizado(clean)) {
    return NextResponse.json({ error: 'usuario_invalido' }, { status: 401 })
  }

  const { data: user } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, rol, asesor_nombre, activo, password_hash, password_expira')
    .eq('email', clean)
    .single()

  if (!user || !user.activo) {
    return NextResponse.json({ error: 'usuario_invalido' }, { status: 401 })
  }

  if (!user.password_hash) {
    return NextResponse.json({ error: 'sin_password' }, { status: 401 })
  }

  if (!verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'password_invalido' }, { status: 401 })
  }

  if (!user.password_expira || new Date(user.password_expira) < new Date()) {
    return NextResponse.json({ error: 'password_expirado' }, { status: 401 })
  }

  let token: string
  try {
    token = await signToken({
      email: clean,
      nombre: user.nombre,
      rol: user.rol as Rol,
      asesor_nombre: user.asesor_nombre ?? null,
    })
  } catch (err) {
    console.error('[login] signToken error:', err)
    return NextResponse.json({ error: 'config_error' }, { status: 500 })
  }

  await supabaseAdmin
    .from('usuarios')
    .update({ ultimo_acceso: new Date().toISOString() })
    .eq('id', user.id)

  const res = NextResponse.json({ ok: true, rol: user.rol })
  res.cookies.set(COOKIE_NAME, token!, cookieOptions())
  return res
}
