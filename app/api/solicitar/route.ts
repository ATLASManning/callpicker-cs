import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, empresa } = await req.json()

    if (!nombre?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nombre y email son requeridos.' }, { status: 400 })
    }

    // Check if already requested
    const { data: existing } = await supabaseAdmin
      .from('solicitudes_acceso')
      .select('id, estado')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      if (existing.estado === 'aprobado') {
        return NextResponse.json({ error: 'Este correo ya tiene acceso aprobado. Revisa tu bandeja de entrada.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Ya existe una solicitud pendiente para este correo.' }, { status: 409 })
    }

    // Insert new request
    const { data: solicitud, error: insertError } = await supabaseAdmin
      .from('solicitudes_acceso')
      .insert({
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        empresa: empresa?.trim() || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Error al guardar la solicitud.' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://callpicker-cs.vercel.app'
    const approveUrl = `${baseUrl}/api/aprobar?id=${solicitud.id}&token=${solicitud.token}`

    // Send admin notification email
    await resend.emails.send({
      from: 'Callpicker CS <noreply@callpicker.com>',
      to: process.env.ADMIN_EMAIL || 'admin@callpicker.com',
      subject: `🔐 Solicitud de acceso: ${nombre}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto;">
          <div style="background: #1B3FCC; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">📋 Nueva solicitud de acceso</h1>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Nombre</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${nombre}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${email}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Empresa</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${empresa || '—'}</td></tr>
            </table>
            <div style="margin-top: 24px; text-align: center;">
              <a href="${approveUrl}" style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
                ✅ Aprobar acceso
              </a>
            </div>
            <p style="margin-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
              Al hacer clic, se enviará automáticamente el enlace de acceso a <strong>${email}</strong>.
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error in /api/solicitar:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
