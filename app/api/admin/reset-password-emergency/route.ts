/**
 * POST /api/admin/reset-password-emergency — restablecer una contraseña.
 *
 * Vive bajo /api/admin/, así que `middleware.ts` ya exige sesión de admin: el
 * comentario que decía «NO requiere autenticación» era falso y se quitó.
 *
 * ── LO QUE ESTABA ROTO (corregido 18 sep 2026) ─────────────────────────────
 * Guardaba la contraseña como **SHA-256 plano**, pero el login la valida con
 * `verifyPassword()` de lib/password.ts, que espera **PBKDF2-SHA512 con salt**
 * en formato `salt:hash` y parte por los dos puntos. Un sha256 no los tiene, así
 * que `verifyPassword` devolvía `false` SIEMPRE: el endpoint respondía «éxito»
 * y dejaba la cuenta sin forma de entrar.
 *
 * Además devolvía `newPassword` EN CLARO en el JSON de respuesta. Ya no: el
 * cuerpo de una respuesta acaba en logs, proxies y herramientas de red, y quien
 * la mandó ya la tiene.
 *
 * Body: { email, newPassword }
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, passwordExpira } from '@/lib/password'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email y newPassword requeridos' }, { status: 400 })
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const clean = String(email).trim().toLowerCase()

    const { data: usuario, error: findError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, activo')
      .eq('email', clean)
      .single()

    if (findError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    /* El MISMO algoritmo que valida el login. */
    const expira = passwordExpira()
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: hashPassword(String(newPassword)), password_expira: expira })
      .eq('id', usuario.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      email: usuario.email,
      expira,
      expiraLegible: new Date(expira).toLocaleDateString('es-MX'),
      aviso: usuario.activo ? undefined : 'La cuenta está INACTIVA: el login la rechazará aunque la contraseña sea correcta.',
      message: 'Contraseña actualizada. No se devuelve en la respuesta a propósito.',
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
