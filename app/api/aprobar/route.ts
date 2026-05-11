import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  const token = searchParams.get('token')

  if (!id || !token) {
    return new NextResponse('Enlace inválido.', { status: 400 })
  }

  // Verify and update the request
  const { data: solicitud, error } = await supabaseAdmin
    .from('solicitudes_acceso')
    .select()
    .eq('id', id)
    .eq('token', token)
    .single()

  if (error || !solicitud) {
    return new NextResponse('Solicitud no encontrada o enlace inválido.', { status: 404 })
  }

  if (solicitud.estado === 'aprobado') {
    return new NextResponse(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2 style="color:#16a34a">✅ Ya aprobado</h2>
        <p>${solicitud.nombre} ya tiene acceso activo.</p>
      </body></html>
    `, { status: 200, headers: { 'Content-Type': 'text/html' } })
  }

  // Mark as approved
  await supabaseAdmin
    .from('solicitudes_acceso')
    .update({ estado: 'aprobado' })
    .eq('id', id)

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://callpicker-cs.vercel.app'
  const accessUrl = `${baseUrl}/api/ingresar?token=${solicitud.token}`

  // Send access email to the user
  await resend.emails.send({
    from: 'Callpicker CS <noreply@callpicker.com>',
    to: solicitud.email,
    subject: '🎉 Tu acceso a Callpicker CS ha sido aprobado',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background: #1B3FCC; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 20px;">¡Acceso aprobado! 🎉</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #0f172a; font-size: 15px;">Hola <strong>${solicitud.nombre}</strong>,</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">
            Tu acceso al panel de <strong>Callpicker Customer Success</strong> ha sido aprobado.
            Haz clic en el botón para ingresar:
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${accessUrl}" style="display: inline-block; background: #1B3FCC; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
              🚀 Ingresar al Dashboard
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Este enlace es personal y de un solo uso. Tu sesión durará 90 días.
          </p>
        </div>
      </div>
    `,
  })

  return new NextResponse(`
    <html><body style="font-family:-apple-system,sans-serif;text-align:center;padding:60px;background:#f8fafc">
      <div style="max-width:400px;margin:0 auto;background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div style="font-size:48px;margin-bottom:16px">✅</div>
        <h2 style="color:#0f172a;margin-bottom:8px">Acceso aprobado</h2>
        <p style="color:#64748b;font-size:14px">Se ha enviado el enlace de acceso a <strong>${solicitud.email}</strong>.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px">Puedes cerrar esta ventana.</p>
      </div>
    </body></html>
  `, { status: 200, headers: { 'Content-Type': 'text/html' } })
}
