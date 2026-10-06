import { NextRequest, NextResponse } from 'next/server'
import { detectarAlertas, UMBRALES } from '@/lib/alertas-detectar'
import { resumir } from '@/lib/alertas'

/**
 * GET /api/alertas — las alertas de cliente de la cartera viva.
 *
 * `?asesor=` acota a su cartera. `?familia=` y `?severidad=` filtran.
 * `?limite=` recorta la lista PERO el resumen sigue siendo del universo
 * completo: un total que se recortara con la lista diría que hay menos riesgo
 * del que hay, que es la peor forma de mentir en un tablero.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const rolAsesor = req.headers.get('x-user-rol') === 'asesor'
  const suyo = decodeURIComponent(req.headers.get('x-user-asesor') ?? '')
  // Un asesor ve SU cartera aunque pida otra: el filtro no es decorativo.
  const asesor = rolAsesor && suyo ? suyo : (sp.get('asesor') || undefined)

  try {
    const todas = await detectarAlertas(asesor ? { asesor } : undefined)
    const resumen = resumir(todas)

    let filtradas = todas
    const familia = sp.get('familia')
    const severidad = sp.get('severidad')
    if (familia) filtradas = filtradas.filter(a => a.familia === familia)
    if (severidad) filtradas = filtradas.filter(a => a.severidad === severidad)

    const limite = Math.min(parseInt(sp.get('limite') ?? '200', 10) || 200, 1000)
    const rows = filtradas.slice(0, limite)

    return NextResponse.json({
      rows,
      mostradas: rows.length,
      filtradas: filtradas.length,
      resumen,
      umbrales: UMBRALES,
      generado: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? 'No se pudieron calcular las alertas' },
      { status: 500 })
  }
}
