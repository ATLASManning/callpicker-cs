import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/* ── DELETE /api/reuniones/[id] ─────────────────────────────────────── */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('reuniones')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
