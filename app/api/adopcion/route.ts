import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'

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

  /* «sin evaluar» NO SE GUARDA, y la ruta lo vuelve a comprobar aunque el modal
     ya lo filtre: es la unica puerta a esta tabla y el CHECK de la columna solo
     admite alto/medio/bajo/no_aplica, asi que una fila asi reventaria el insert
     con un mensaje de Postgres que nadie sabria leer.
     La ausencia de fila ES «sin evaluar». */
  const NIVELES_VALIDOS = new Set(['alto', 'medio', 'bajo', 'no_aplica'])
  const limpias = (productos as Array<{ producto: string; nivel: string; notas?: string }>)
    .filter(p => NIVELES_VALIDOS.has(p.nivel))

  if (!limpias.length) {
    return NextResponse.json(
      { error: 'No hay nada que guardar: ningun producto trae un nivel evaluado.' },
      { status: 400 },
    )
  }

  const rows = limpias.map(p => ({
    cuenta_id: cuenta_id,  // uuid string — no convertir a Number
    producto:  p.producto,
    nivel:     p.nivel,
    fecha:     fecha ?? hoyEnMexico(),
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
