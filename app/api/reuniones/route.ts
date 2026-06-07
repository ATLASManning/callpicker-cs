import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/* ── GET /api/reuniones ─────────────────────────────────────────────── */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('reuniones')
    .select('*')
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false })

  if (error) {
    // Si la tabla no existe todavía, retornar array vacío con flag
    if (error.code === '42P01') {
      return NextResponse.json({ rows: [], tableExists: false })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [], tableExists: true })
}

/* ── POST /api/reuniones ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { fecha, tipo, titulo, participantes, resumen, acuerdos, proximos_pasos } = body

  if (!fecha || !titulo?.trim()) {
    return NextResponse.json({ error: 'fecha y titulo son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('reuniones')
    .insert({
      fecha,
      tipo:           tipo ?? 'junta_semanal',
      titulo:         titulo.trim(),
      participantes:  participantes ?? '',
      resumen:        resumen ?? '',
      acuerdos:       acuerdos ?? '',
      proximos_pasos: proximos_pasos ?? '',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'table_not_found', tableExists: false }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ row: data })
}
