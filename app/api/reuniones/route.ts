import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/* ── GET /api/reuniones ─────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams
  const tipo     = sp.get('tipo')
  const empresa  = sp.get('empresa')
  const cuentaId = sp.get('cuenta_id')

  let query = supabaseAdmin
    .from('reuniones')
    .select('*')
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false })

  if (tipo)     query = query.eq('tipo', tipo)
  // El vínculo autoritativo es cuenta_id; `empresa` sólo se usa como filtro
  // de texto para búsquedas sueltas, nunca como llave.
  if (cuentaId) query = query.eq('cuenta_id', cuentaId)
  if (empresa)  query = query.ilike('empresa', `%${empresa}%`)

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
  const { fecha, tipo, titulo, participantes, resumen, acuerdos, proximos_pasos,
          empresa, cuenta_id, cid } = body

  if (!fecha || !titulo?.trim()) {
    return NextResponse.json({ error: 'fecha y titulo son requeridos' }, { status: 400 })
  }
  // Una reunión de cliente sin cuenta vinculada no sirve para nada aguas
  // abajo: no alimenta el relacionamiento ni aparece en la ficha. Se exige.
  if (tipo === 'cliente' && !cuenta_id) {
    return NextResponse.json(
      { error: 'Una reunión con cliente debe vincularse a una cuenta' }, { status: 400 })
  }

  const esCliente = tipo === 'cliente'
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
      cuenta_id:      esCliente ? cuenta_id : null,
      cid:            esCliente ? (cid ?? null) : null,
      empresa:        esCliente ? (empresa ?? null) : null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ error: 'table_not_found', tableExists: false }, { status: 503 })

    // Faltan las columnas de vínculo (migración pendiente).
    //
    // ANTES esto reintentaba el insert SIN esas columnas y devolvía 200: la
    // reunión se guardaba sin cuenta y el usuario creía haberla vinculado. Ésa
    // es la razón de que las 18 reuniones de cliente quedaran huérfanas.
    // Ahora, si es una reunión de cliente, se rechaza de forma explícita.
    if (error.code === '42703' || error.message.includes("'empresa'")) {
      if (esCliente) {
        return NextResponse.json({
          error: 'migracion_pendiente',
          mensaje: 'Falta ejecutar scripts/migracion-reuniones-cuenta.sql: la tabla reuniones '
                 + 'no tiene las columnas cuenta_id, cid y empresa. Sin ellas la reunión se '
                 + 'guardaría sin vínculo con la cuenta.',
        }, { status: 503 })
      }
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
