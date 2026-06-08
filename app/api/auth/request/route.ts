/**
 * POST /api/auth/request
 * Valida el email, genera un código de 6 dígitos y lo envía por correo.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const clean = email.trim().toLowerCase()

  /* Buscar usuario en la tabla */
  const { data: user, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, rol, activo')
    .eq('email', clean)
    .single()

  if (error || !user) {
    /* Email no registrado — crear solicitud pendiente y notificar admin */
    await supabaseAdmin.from('usuarios').upsert({
      email: clean, nombre: clean.split('@')[0],
      rol: 'viewer', activo: false,
    }, { onConflict: 'email', ignoreDuplicates: true })

    await notifyAdmin(clean)
    return NextResponse.json({ status: 'pending' })
  }

  if (!user.activo) {
    return NextResponse.json({ status: 'inactive' })
  }

  /* Generar código */
  const code    = genCode()
  const expira  = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

  await supabaseAdmin
    .from('usuarios')
    .update({ codigo: code, codigo_expira: expira })
    .eq('id', user.id)

  /* Enviar por email */
  await sendCode(clean, user.nombre, code)

  return NextResponse.json({ status: 'sent' })
}

/* ── Enviar código de acceso ────────────────────────────────────────── */
async function sendCode(email: string, nombre: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

  if (!apiKey) {
    /* Modo desarrollo — imprimir código en consola del servidor */
    console.log(`\n🔑 CÓDIGO DE ACCESO para ${email}: ${code}\n`)
    return
  }

  const resend = new Resend(apiKey)
  await resend.emails.send({
    from,
    to: email,
    subject: `${code} — Tu código de acceso Callpicker`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#1B3FCC;padding:24px 32px;border-radius:12px 12px 0 0">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0">📞 Callpicker Customer Success</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #BFDBFE;border-radius:0 0 12px 12px">
          <p style="color:#0F172A;font-size:16px">Hola <strong>${nombre}</strong>,</p>
          <p style="color:#475569">Tu código de acceso es:</p>
          <div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1B3FCC">${code}</span>
          </div>
          <p style="color:#64748B;font-size:13px">⏱ Válido por <strong>10 minutos</strong>. No lo compartas con nadie.</p>
          <p style="color:#64748B;font-size:12px;margin-top:24px;padding-top:16px;border-top:1px solid #EFF6FF">
            Si no solicitaste este código, ignora este correo.
          </p>
        </div>
      </div>`,
  })
}

/* ── Notificar al admin sobre nueva solicitud ───────────────────────── */
async function notifyAdmin(email: string) {
  const apiKey     = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL ?? 'lopezdjosemanuel@gmail.com'
  const from       = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://callpicker-cs.vercel.app'

  if (!apiKey) {
    console.log(`\n🔔 NUEVA SOLICITUD DE ACCESO: ${email} — Aprobar en /admin/usuarios\n`)
    return
  }

  const resend = new Resend(apiKey)
  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `Nueva solicitud de acceso: ${email}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#1B3FCC;padding:24px 32px;border-radius:12px 12px 0 0">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0">📞 Callpicker CS — Nueva solicitud</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #BFDBFE;border-radius:0 0 12px 12px">
          <p style="color:#0F172A"><strong>${email}</strong> quiere acceder al dashboard.</p>
          <a href="${appUrl}/admin/usuarios"
             style="display:inline-block;background:#1B3FCC;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px">
            Gestionar accesos →
          </a>
        </div>
      </div>`,
  })
}
