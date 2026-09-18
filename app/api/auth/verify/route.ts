/**
 * POST /api/auth/verify
 * Verifica el código de 6 dígitos y emite la cookie de sesión JWT.
 *
 * ── UNA SOLA POLÍTICA, DOS PUERTAS (18 sep 2026) ───────────────────────────
 * Esta ruta emitía sesión sin mirar `password_expira`: quien tuviera acceso a
 * su correo entraba aunque su contraseña estuviera vencida, y sin contraseña
 * alguna. O sea que la caducidad de 30 días no se estaba aplicando de verdad —
 * había una puerta de al lado que la ignoraba.
 *
 * Ahora exige lo mismo que `/api/auth/login`. Si la contraseña venció, el
 * código tampoco abre: se recupera con `scripts/restablece-password.py`, que
 * es el único camino y deja rastro de quién lo hizo.
 *
 * OJO: `app/acceso/page.tsx` NO ofrece este flujo — no hay ningún botón que
 * pida un código. La ruta es pública (`/api/auth/` está en PUBLIC_PATHS) y solo
 * se alcanza llamándola directo. Queda por decidir si se conecta a la pantalla
 * o se retira; mientras tanto, al menos ya no salta la política.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken, cookieOptions, COOKIE_NAME, esEmailAutorizado } from '@/lib/auth'
import type { Rol } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()
  if (!email || !code) {
    return NextResponse.json({ error: 'email y code requeridos' }, { status: 400 })
  }

  const clean = email.trim().toLowerCase()

  // Lista blanca de dirección — se valida antes que nada
  if (!esEmailAutorizado(clean)) {
    return NextResponse.json({ error: 'usuario_invalido' }, { status: 401 })
  }

  const { data: user } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, rol, asesor_nombre, activo, codigo, codigo_expira, password_expira')
    .eq('email', clean)
    .single()

  if (!user || !user.activo) {
    return NextResponse.json({ error: 'usuario_invalido' }, { status: 401 })
  }

  /* Validar código */
  if (user.codigo !== String(code).trim()) {
    return NextResponse.json({ error: 'codigo_invalido' }, { status: 401 })
  }

  /* Validar expiración del código */
  if (!user.codigo_expira || new Date(user.codigo_expira) < new Date()) {
    return NextResponse.json({ error: 'codigo_expirado' }, { status: 401 })
  }

  /* Y la MISMA regla que el login: sin esto, el código era una puerta de al
   * lado que ignoraba la caducidad de la contraseña. */
  if (!user.password_expira || new Date(user.password_expira) < new Date()) {
    return NextResponse.json({ error: 'password_expirado' }, { status: 401 })
  }

  /* Firmar JWT primero — si falla, el código sigue válido en DB */
  let token: string
  try {
    token = await signToken({
      email: clean,
      nombre: user.nombre,
      rol: user.rol as Rol,
      asesor_nombre: user.asesor_nombre ?? null,
    })
  } catch (err) {
    console.error('[verify] signToken error:', err)
    return NextResponse.json({ error: 'config_error', detail: String(err) }, { status: 500 })
  }

  /* Limpiar código usado + actualizar último acceso */
  await supabaseAdmin
    .from('usuarios')
    .update({ codigo: null, codigo_expira: null, ultimo_acceso: new Date().toISOString() })
    .eq('id', user.id)

  const res = NextResponse.json({ ok: true, rol: user.rol })
  res.cookies.set(COOKIE_NAME, token!, cookieOptions())
  return res
}
