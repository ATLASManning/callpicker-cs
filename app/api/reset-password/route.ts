/**
 * POST /api/reset-password — restablecer una contraseña vencida.
 *
 * ── LO QUE ESTABA ROTO (corregido 18 sep 2026) ─────────────────────────────
 * Esta ruta guardaba la contraseña como **SHA-256 plano**. El login la valida
 * con `verifyPassword()` de lib/password.ts, que espera **PBKDF2-SHA512 con
 * salt** en formato `salt:hash` y parte la cadena por los dos puntos: un sha256
 * no los tiene, así que `verifyPassword` devolvía `false` SIEMPRE.
 *
 * O sea: usar este endpoint no recuperaba el acceso, lo destruía — y sin que
 * nadie pudiera notarlo, porque la respuesta decía «éxito». José Manuel se
 * quedó fuera el 15 de septiembre y esto era lo que le esperaba si intentaba
 * recuperarse por aquí.
 *
 * ── Y LO QUE NO ESTABA PROTEGIDO ───────────────────────────────────────────
 * No pedía ninguna credencial: bastaba el correo para cambiarle la contraseña
 * a cualquiera. Hoy sobrevive solo porque `middleware.ts` no lista esta ruta en
 * PUBLIC_PATHS, es decir por accidente de configuración y no por diseño: el día
 * que alguien la agregue, queda abierta. Ahora exige el `JWT_SECRET`, el mismo
 * patrón de /api/auth/bootstrap.
 *
 * Body: { email, newPassword, secret }
 *
 * Para el caso normal —una contraseña vencida y nadie con sesión para
 * renovarla— es preferible `scripts/restablece-password.py`: la contraseña se
 * teclea en la terminal de quien la va a usar y no viaja por la red.
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, passwordExpira } from '@/lib/password'

/* Comparacion de tiempo constante: con `!==` el tiempo de respuesta filtra
 * cuantos caracteres del secreto iban bien. Y si JWT_SECRET faltara, `esperado`
 * seria '' y esto devuelve false en vez de dejar pasar un body sin secreto. */
function secretoValido(dado: unknown): boolean {
  const esperado = process.env.JWT_SECRET ?? ''
  if (!esperado || typeof dado !== 'string' || dado.length !== esperado.length) return false
  return crypto.timingSafeEqual(Buffer.from(dado), Buffer.from(esperado))
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, newPassword, secret } = await request.json()

    if (!secretoValido(secret)) {
      return NextResponse.json({ error: 'no autorizado' }, { status: 401 })
    }
    if (!email || !newPassword) {
      return NextResponse.json({ error: 'email y newPassword requeridos' }, { status: 400 })
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: 'la contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const clean = String(email).trim().toLowerCase()

    const { data: usuario, error: findError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, activo')
      .eq('email', clean)
      .single()

    if (findError || !usuario) {
      return NextResponse.json({ error: 'usuario no encontrado' }, { status: 404 })
    }

    /* El MISMO algoritmo que valida el login. No inventar uno aquí: de eso
     * salió el bug que dejó cuentas irrecuperables. */
    const expira = passwordExpira()
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: hashPassword(String(newPassword)), password_expira: expira })
      .eq('id', usuario.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    /* La contraseña NO se devuelve. Quien la manda ya la tiene, y el cuerpo de
     * una respuesta acaba en logs, proxies y herramientas de red. */
    return NextResponse.json({
      ok: true,
      email: usuario.email,
      expira,
      aviso: usuario.activo ? undefined : 'La cuenta está INACTIVA: el login la rechazará aunque la contraseña sea correcta.',
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
