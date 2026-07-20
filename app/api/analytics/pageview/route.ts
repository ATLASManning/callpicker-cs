import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

// POST — nueva visita a página (retorna { id })
// POST con campo `id` — actualizar duración (enviado via sendBeacon)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // sendBeacon no puede enviar PATCH; detectar si es un update por presencia de `id`
    if (body.id && body.duracion_seg !== undefined) {
      await supabaseAdmin
        .from('uso_dashboard')
        .update({ duracion_seg: body.duracion_seg })
        .eq('id', body.id)
      return NextResponse.json({ ok: true })
    }

    const h      = headers()
    const email  = h.get('x-user-email') ?? ''
    const asesor = decodeURIComponent(h.get('x-user-asesor') ?? '')

    const { ruta, seccion } = body as { ruta: string; seccion: string }
    if (!ruta || !seccion || !email) return NextResponse.json({ error: 'missing' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('uso_dashboard')
      .insert({ email, asesor, ruta, seccion })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id })
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// PATCH — actualizar duración al salir de la página
export async function PATCH(req: NextRequest) {
  try {
    const { id, duracion_seg } = await req.json()
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    await supabaseAdmin
      .from('uso_dashboard')
      .update({ duracion_seg })
      .eq('id', id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
