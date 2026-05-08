import { NextRequest, NextResponse } from 'next/server'
import { getCuentas, upsertCuenta } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  try {
    const data = await getCuentas({
      asesor:   sp.get('asesor')   || undefined,
      semaforo: sp.get('semaforo') || undefined,
      estado:   sp.get('estado')   || undefined,
      search:   sp.get('search')   || undefined,
    })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const cuenta = await upsertCuenta(body)
    return NextResponse.json(cuenta, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
