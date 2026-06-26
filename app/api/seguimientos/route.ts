import { NextRequest, NextResponse } from 'next/server'
import { getSeguimientos, addSeguimiento, updateSeguimientoResultado } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const cuentaId = req.nextUrl.searchParams.get('cuenta_id')
  if (!cuentaId) return NextResponse.json({ error: 'cuenta_id required' }, { status: 400 })
  const data = await getSeguimientos(cuentaId)
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, resultado } = await req.json()
    if (!id || !resultado) return NextResponse.json({ error: 'id y resultado requeridos' }, { status: 400 })
    await updateSeguimientoResultado(id, resultado)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const s = await addSeguimiento(body)

    // Update ultimo_contacto on the cuenta
    await fetch(`${req.nextUrl.origin}/api/cuentas/${body.cuenta_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ultimo_contacto: new Date().toISOString().split('T')[0] }),
    })

    return NextResponse.json(s, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
