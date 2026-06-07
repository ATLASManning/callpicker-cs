import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/* GET — listar todos */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, email, nombre, rol, asesor_nombre, activo, ultimo_acceso, creado_en')
    .order('creado_en', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/* POST — crear usuario */
export async function POST(req: NextRequest) {
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

/* PATCH — actualizar usuario */
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
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
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const { error } = await supabaseAdmin.from('usuarios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
