import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/* ── GET /api/reuniones ─────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const sp      = req.nextUrl.searchParams
  const tipo    = sp.get('tipo')
  const empresa = sp.get('empresa')

  let query = supabaseAdmin
    .from('reuniones')
    .select('*')
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false })

  if (tipo)    query = query.eq('tipo', tipo)
  if (empresa) query = query.ilike('empresa', `%${empresa}%`)

  const { data, error } = await query

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ rows: [], tableExists: false })
    // Columna empresa no existe aún — ignorar filtro, devolver todo
    if (error.code === '42703') {
      const { data: all, error: e2 } = await supabaseAdmin
        .from('reuniones')
        .select('*')
        .order('fecha', { ascending: false })
        .order('creado_en', { ascending: false })
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
      return NextResponse.json({ rows: all ?? [], tableExists: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [], tableExists: true })
}

/* ── POST /api/reuniones ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { fecha, tipo, titulo, participantes, resumen, acuerdos, proximos_pasos, empresa } = body

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
      empresa:        tipo === 'cliente' ? (empresa ?? null) : null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ error: 'table_not_found', tableExists: false }, { status: 503 })

    // Columna 'empresa' no existe aún → reintentar sin ella
    if (error.code === '42703' || error.message.includes("'empresa'")) {
      const { data: data2, error: e2 } = await supabaseAdmin
        .from('reuniones')
        .insert({ fecha, tipo: tipo ?? 'junta_semanal', titulo: titulo.trim(), participantes: participantes ?? '', resumen: resumen ?? '', acuerdos: acuerdos ?? '', proximos_pasos: proximos_pasos ?? '' })
        .select()
        .single()
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
      return NextResponse.json({ row: data2 })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ row: data })
}
