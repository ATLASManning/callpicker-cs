/**
 * GET /api/auth/me — la sesión actual, más cuándo vence la contraseña.
 *
 * ── POR QUÉ LEE LA COOKIE Y NO LAS CABECERAS ───────────────────────────────
 * Antes usaba `getSessionFromHeaders`, que lee `x-user-email` de la PETICIÓN.
 * Esas cabeceras las pone `middleware.ts`… pero esta ruta empieza con
 * `/api/auth/`, que está en `PUBLIC_PATHS`: el middleware sale antes de
 * ponerlas. O sea que la sesión salía `null` y la ruta respondía **401 siempre,
 * para todos**.
 *
 * Eso dejaba muerto el aviso de vencimiento que cuelga de aquí: la barra nunca
 * se habría pintado, ni a siete días ni al último. Ahora la ruta verifica el
 * JWT de la cookie por su cuenta y no depende de que otro le prepare el camino.
 *
 * De paso deja de ser un oráculo: al ser pública y confiar en cabeceras que
 * cualquiera puede mandar, se le podía preguntar por el correo ajeno que se
 * quisiera. Con la cookie firmada, solo contesta de quien la trae.
 *
 * ── POR QUÉ IMPORTA `diasParaExpirar` ──────────────────────────────────────
 * La contraseña dura 30 días y al vencerse el login responde `password_expirado`:
 * a partir de ahí no se entra, y el módulo para renovarla vive detrás del login.
 * Es un círculo cerrado, y fue lo que pasó — tres cuentas quedaron fuera el 15
 * de septiembre de 2026 sin que nadie lo viera venir.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME, esEmailAutorizado } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DIA = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null

  /* La lista blanca se revalida aquí: un correo dado de baja puede seguir
   * trayendo una cookie válida hasta que caduque. */
  if (!session || !esEmailAutorizado(session.email)) {
    return NextResponse.json(null, { status: 401 })
  }

  let passwordExpira: string | null = null
  let diasParaExpirar: number | null = null
  let avisoNoDisponible = false

  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('password_expira')
      .eq('email', session.email)
      .single()

    if (error) {
      /* Que el aviso no se pueda calcular NO es lo mismo que «no vence
       * pronto». Se dice, para que la pantalla no finja tranquilidad. */
      avisoNoDisponible = true
    } else if (data?.password_expira) {
      passwordExpira = data.password_expira
      /* Se redondea hacia ABAJO. Con `ceil`, una contraseña que vence en dos
       * horas decía «vence mañana» y una de treinta horas decía «en 2 días»:
       * el aviso daba más tiempo del que había. Quedarse largo es el único
       * error que de verdad importa en una cuenta regresiva. */
      diasParaExpirar = Math.floor((new Date(data.password_expira).getTime() - Date.now()) / DIA)
    }
  } catch {
    avisoNoDisponible = true
  }

  return NextResponse.json({ ...session, passwordExpira, diasParaExpirar, avisoNoDisponible })
}
