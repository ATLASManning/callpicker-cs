import { NextRequest, NextResponse } from 'next/server'
import { getZohoMap, lookupZoho } from '@/lib/zoho-enrich'

export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa') ?? ''
  if (!empresa.trim()) {
    return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })
  }
  try {
    const zmap = await getZohoMap()
    const z = lookupZoho(empresa.trim(), zmap)
    return NextResponse.json(z ?? { mrr: 0, factura_mensual: 0, semaforo: '' })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
