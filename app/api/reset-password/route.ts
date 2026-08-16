import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * POST /api/reset-password
 * Endpoint de emergencia sin autenticación - para resetear contraseñas expiradas
 * Body: { email: string, newPassword: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, newPassword } = body

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email y newPassword requeridos' }, { status: 400 })
    }

    // Buscar usuario en tabla usuarios
    const { data: usuario, error: findError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (findError || !usuario) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado',
        debug: findError?.message
      }, { status: 404 })
    }

    // Generar hash de contraseña
    const passwordHash = crypto
      .createHash('sha256')
      .update(newPassword)
      .digest('hex')

    // Actualizar en tabla usuarios
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        password_hash: passwordHash,
        password_expira: expiresAt.toISOString()
      })
      .eq('id', usuario.id)

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar',
        debug: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      email,
      newPassword,
      expiresAt: expiresAt.toLocaleDateString('es-MX'),
      message: 'Contraseña actualizada exitosamente'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
