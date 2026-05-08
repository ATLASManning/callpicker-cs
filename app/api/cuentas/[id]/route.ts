import { NextRequest, NextResponse } from 'next/server'
import { getCuentaById, updateCuenta, saveHealthSnapshot } from '@/lib/supabase'

interface Ctx { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const cuenta = await getCuentaById(params.id)
  if (!cuenta) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(cuenta)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const body = await req.json()
    const updated = await updateCuenta(params.id, body)

    // Auto-save health score snapshot when scores change
    const scoreKeys = ['score_actividad','score_adopcion','score_pago','score_relacional']
    if (scoreKeys.some(k => k in body)) {
      await saveHealthSnapshot(params.id, updated)
    }

    return NextResponse.json(updated)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
