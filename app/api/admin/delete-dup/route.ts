import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET  /api/admin/delete-dup          → lista cuentas con prefijo _dup_
// POST /api/admin/delete-dup          → elimina todas las cuentas _dup_
// POST /api/admin/delete-dup?id=xxx   → elimina una cuenta específica por id

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('id, empresa, consecutivo, asesor, health_score, facturacion')
    .ilike('empresa', '_dup_%')
    .order('empresa')

  if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
  return NextResponse.json({ dups: data ?? [], count: (data ?? []).length })
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const specificId = searchParams.get('id')

  if (specificId) {
    // Eliminar solo una cuenta por id
    const { error } = await supabaseAdmin
      .from('cuentas')
      .delete()
      .eq('id', specificId)

    if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
    return NextResponse.json({ ok: true, deleted_id: specificId })
  }

  // Eliminar todas las que empiecen con _dup_
  const { data: dups, error: fetchErr } = await supabaseAdmin
    .from('cuentas')
    .select('id, empresa')
    .ilike('empresa', '_dup_%')

  if (fetchErr) return NextResponse.json({ error: String(fetchErr) }, { status: 500 })
  if (!dups || dups.length === 0) return NextResponse.json({ ok: true, deleted: [], message: 'No hay duplicados' })

  const ids = dups.map(d => d.id)

  const { error: delErr } = await supabaseAdmin
    .from('cuentas')
    .delete()
    .in('id', ids)

  if (delErr) return NextResponse.json({ error: String(delErr) }, { status: 500 })

  return NextResponse.json({
    ok: true,
    deleted: dups.map(d => ({ id: d.id, empresa: d.empresa })),
    count: dups.length,
  })
}
