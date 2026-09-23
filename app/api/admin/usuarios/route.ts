import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, passwordExpira } from '@/lib/password'
import { esAdminDelTablero } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Segunda cerradura, a propósito.
 *
 * El middleware ya bloquea todo `/api/admin/`, y es ahí donde se decide. Pero
 * esta ruta devuelve la lista de accesos del tablero y puede CREARLOS, así que
 * no se queda dependiendo de una sola comprobación que vive en otro archivo: si
 * alguien toca `ADMIN_ONLY` en el middleware, esto sigue cerrado.
 *
 * `x-user-email` la pone el middleware en cada request; sin él no hay sesión y
 * se niega, que es el lado seguro de equivocarse.
 */
function guardia(req: NextRequest): NextResponse | null {
  if (!esAdminDelTablero(req.headers.get('x-user-email'))) {
    return NextResponse.json(
      { error: 'Solo la administración del tablero puede usar este módulo.' },
      { status: 403 },
    )
  }
  return null
}

/* GET — listar todos */
export async function GET(req: NextRequest) {
  const no = guardia(req)
  if (no) return no
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, email, nombre, rol, asesor_nombre, activo, ultimo_acceso, creado_en, password_expira')
    .order('creado_en', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/* POST — crear usuario */
export async function POST(req: NextRequest) {
  const no = guardia(req)
  if (no) return no
  const body = await req.json()
  const { email, nombre, rol, asesor_nombre, activo } = body
  if (!email || !nombre || !rol) {
    return NextResponse.json({ error: 'email, nombre y rol son requeridos' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .insert({ email: email.trim().toLowerCase(), nombre, rol, asesor_nombre: asesor_nombre || null, activo: activo ?? false })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/* PATCH — actualizar usuario o asignar contraseña */
export async function PATCH(req: NextRequest) {
  const no = guardia(req)
  if (no) return no
  const body = await req.json()
  const { id, action, new_password, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  /* Acción especial: asignar nueva contraseña (admin) */
  if (action === 'set_password') {
    if (!new_password) return NextResponse.json({ error: 'new_password requerido' }, { status: 400 })
    const hash   = hashPassword(new_password)
    const expira = passwordExpira()
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: hash, password_expira: expira })
      .eq('id', id)
      .select('id, email, nombre, password_expira')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, password_expira: data.password_expira })
  }

  /* Actualización general (activo, rol, etc.) */
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/* DELETE — eliminar usuario */
export async function DELETE(req: NextRequest) {
  const no = guardia(req)
  if (no) return no
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const { error } = await supabaseAdmin.from('usuarios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
