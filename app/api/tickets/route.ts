import { NextRequest, NextResponse } from 'next/server'
import { getTickets, addTicket } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const cuentaId = req.nextUrl.searchParams.get('cuenta_id')
  if (!cuentaId) return NextResponse.json({ error: 'cuenta_id required' }, { status: 400 })
  const data = await getTickets(cuentaId)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const t = await addTicket(body)
    return NextResponse.json(t, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
