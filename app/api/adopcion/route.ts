import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/* ─── GET: historial completo de una cuenta ─────────────────────────── */
export async function GET(req: NextRequest) {
  const cuentaId = req.nextUrl.searchParams.get('cuentaId')
  if (!cuentaId) return NextResponse.json({ error: 'cuentaId requerido' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('adopcion_producto')
    .select('*')
    .eq('cuenta_id', cuentaId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [] })
}

/* ─── POST: guardar revisión mensual ────────────────────────────────── */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { cuenta_id, asesor, fecha, productos } = body

  if (!cuenta_id || !Array.isArray(productos) || !productos.length) {
    return NextResponse.json({ error: 'cuenta_id y productos son requeridos' }, { status: 400 })
  }

  const rows = productos.map((p: { producto: string; nivel: string; notas?: string }) => ({
    cuenta_id: cuenta_id,  // uuid string — no convertir a Number
    producto:  p.producto,
    nivel:     p.nivel,
    fecha:     fecha ?? new Date().toISOString().slice(0, 10),
    asesor:    asesor ?? null,
    notas:     p.notas || null,
  }))

  const { data, error } = await supabaseAdmin
    .from('adopcion_producto')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data })
}
