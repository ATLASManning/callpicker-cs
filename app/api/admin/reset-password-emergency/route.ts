import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()

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
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
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
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      email,
      newPassword,
      expiresAt: expiresAt.toLocaleDateString('es-MX'),
      message: 'Contraseña actualizada exitosamente'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
