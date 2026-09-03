import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Preguntas que Atlas no pudo contestar.
 *
 * Viven en `atlas_pendientes`, aparte de la bitácora, porque no son un
 * registro de lo que pasó: son una lista de trabajo. Cada una es un hueco de
 * conocimiento con nombre y apellido — quién preguntó, qué faltaba — y se
 * cierra cuando alguien la contesta, no cuando pasa el día.
 *
 *   GET   → lista. Admin ve todas; un asesor solo las suyas.
 *   PATCH → cierra una con la respuesta final.
 */

export async function GET(req: NextRequest) {
  const rol   = req.headers.get('x-user-rol') ?? 'viewer'
  const email = req.headers.get('x-user-email') ?? ''
  const estado = req.nextUrl.searchParams.get('estado') ?? 'pendiente'

  let q = supabaseAdmin
    .from('atlas_pendientes')
    .select('id,pregunta,motivo,usuario_email,usuario_nombre,estado,respuesta_final,resuelto_en,created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (estado !== 'todos') q = q.eq('estado', estado)
  if (rol !== 'admin')    q = q.eq('usuario_email', email)

  const { data, error } = await q
  if (error) return NextResponse.json({ pendientes: [], abiertos: 0, error: error.message })

  const pendientes = data ?? []
  return NextResponse.json({
    pendientes,
    abiertos: pendientes.filter(p => p.estado === 'pendiente').length,
  })
}

export async function PATCH(req: NextRequest) {
  const rol = req.headers.get('x-user-rol') ?? 'viewer'
  if (rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, respuesta_final } = await req.json() as { id?: string; respuesta_final?: string }
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Una pendiente se cierra con una respuesta, no con un clic: sin texto no
  // hay nada que devolverle a quien preguntó.
  const texto = String(respuesta_final ?? '').trim()
  if (texto.length < 10) {
    return NextResponse.json({
      error: 'Escribe la respuesta antes de cerrarla. Quien preguntó sigue esperando ese dato.',
    }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('atlas_pendientes')
    .update({ estado: 'resuelto', respuesta_final: texto, resuelto_en: new Date().toISOString() })
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, pendiente: data?.[0] ?? null })
}
