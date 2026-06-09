/**
 * GET /api/zoho-setup?code=...
 * Ruta temporal para capturar el authorization code de Zoho y
 * canjearlo automáticamente por un refresh_token.
 * BORRAR después de obtener el token.
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CLIENT_ID     = '1000.IY8JM0B2TOCG2KU4L23CW2WE4M636D'
const CLIENT_SECRET = 'f40da99a2b7c4afce74000d2470816f7a73a79d157'
const REDIRECT_URI  = 'https://callpicker-cs.vercel.app/api/zoho-setup'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return new NextResponse(`
      <html><body style="font-family:Arial;padding:40px;max-width:600px;margin:auto">
        <h2>⚠️ No se recibió código</h2>
        <p>Abre la URL de autorización de Zoho primero.</p>
      </body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }

  try {
    const params = new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    })

    const res  = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    })

    const data = await res.json()

    if (data.error) {
      return new NextResponse(`
        <html><body style="font-family:Arial;padding:40px;max-width:600px;margin:auto">
          <h2>❌ Error: ${data.error}</h2>
          <p>El código puede haber expirado. Solicita uno nuevo.</p>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </body></html>`, { headers: { 'Content-Type': 'text/html' } })
    }

    return new NextResponse(`
      <html><body style="font-family:Arial;padding:40px;max-width:700px;margin:auto;background:#f8fafc">
        <div style="background:#fff;border:1px solid #BFDBFE;border-radius:16px;padding:32px">
          <h2 style="color:#059669">✅ Refresh Token obtenido</h2>
          <p style="color:#64748B">Copia el valor y compártelo con el administrador:</p>

          <label style="font-size:12px;font-weight:700;color:#374151">ZOHO_REFRESH_TOKEN</label>
          <div style="background:#F0FDF4;border:1px solid #6EE7B7;border-radius:8px;padding:16px;margin:8px 0 24px;word-break:break-all;font-family:monospace;font-size:14px;color:#065F46">
            ${data.refresh_token ?? '— no retornado —'}
          </div>

          <label style="font-size:12px;font-weight:700;color:#374151">access_token (temporal, no guardar)</label>
          <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:12px;margin:8px 0;word-break:break-all;font-family:monospace;font-size:11px;color:#1E40AF">
            ${data.access_token ?? '—'}
          </div>

          <p style="font-size:12px;color:#94A3B8;margin-top:24px">
            api_domain: ${data.api_domain ?? '—'} &nbsp;|&nbsp; token_type: ${data.token_type ?? '—'}
          </p>
        </div>
      </body></html>`, { headers: { 'Content-Type': 'text/html' } })

  } catch (e) {
    return new NextResponse(`<html><body>Error: ${e}</body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } })
  }
}
