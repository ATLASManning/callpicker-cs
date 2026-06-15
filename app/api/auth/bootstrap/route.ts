/**
 * POST /api/auth/bootstrap
 * Asigna contraseñas iniciales a todos los usuarios activos sin contraseña.
 * Requiere el JWT_SECRET como "secret" en el body.
 * Uso único — una vez asignadas, los usuarios con contraseña se omiten.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, genPassword, passwordExpira } from '@/lib/password'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { secret } = await req.json()

  if (!secret || secret !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 })
  }

  const { data: users, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, email, nombre, activo, password_hash')
    .eq('activo', true)

  if (error || !users?.length) {
    return NextResponse.json({ error: 'no hay usuarios activos' }, { status: 400 })
  }

  const results: { email: string; nombre: string; password?: string; expira?: string; status: string }[] = []

  for (const user of users) {
    if (user.password_hash) {
      results.push({ email: user.email, nombre: user.nombre, status: 'ya tiene contraseña — omitido' })
      continue
    }

    const plain  = genPassword()
    const hash   = hashPassword(plain)
    const expira = passwordExpira()

    const { error: upErr } = await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: hash, password_expira: expira })
      .eq('id', user.id)

    if (upErr) {
      results.push({ email: user.email, nombre: user.nombre, status: 'ERROR: ' + upErr.message })
    } else {
      results.push({ email: user.email, nombre: user.nombre, password: plain, expira, status: 'ok' })
    }
  }

  return NextResponse.json({ ok: true, results })
}
