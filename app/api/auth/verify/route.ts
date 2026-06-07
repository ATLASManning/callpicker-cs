/**
 * POST /api/auth/verify
 * Verifica el código de 6 dígitos y emite la cookie de sesión JWT.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken, cookieOptions, COOKIE_NAME } from '@/lib/auth'
import type { Rol } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()
  if (!email || !code) {
    return NextResponse.json({ error: 'email y code requeridos' }, { status: 400 })
  }

  const clean = email.trim().toLowerCase()

  const { data: user } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, rol, asesor_nombre, activo, codigo, codigo_expira')
    .eq('email', clean)
    .single()

  if (!user || !user.activo) {
    return NextResponse.json({ error: 'usuario_invalido' }, { status: 401 })
  }

  /* Validar código */
  if (user.codigo !== String(code).trim()) {
    return NextResponse.json({ error: 'codigo_invalido' }, { status: 401 })
  }

  /* Validar expiración */
  if (!user.codigo_expira || new Date(user.codigo_expira) < new Date()) {
    return NextResponse.json({ error: 'codigo_expirado' }, { status: 401 })
  }

  /* Limpiar código usado + actualizar último acceso */
  await supabaseAdmin
    .from('usuarios')
    .update({ codigo: null, codigo_expira: null, ultimo_acceso: new Date().toISOString() })
    .eq('id', user.id)

  /* Firmar JWT y emitir cookie */
  const token = await signToken({
    email: clean,
    nombre: user.nombre,
    rol: user.rol as Rol,
    asesor_nombre: user.asesor_nombre ?? null,
  })

  const res = NextResponse.json({ ok: true, rol: user.rol })
  res.cookies.set(COOKIE_NAME, token, cookieOptions())
  return res
}
