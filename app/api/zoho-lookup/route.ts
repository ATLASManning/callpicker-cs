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
    // La forma vacía tiene que ser la MISMA que la real, o quien la consuma
    // recibe un objeto con otras llaves y no se entera.
    return NextResponse.json(z ?? { acumulado: 0, factura_mensual: 0, semaforo: '', segmento: '' })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
