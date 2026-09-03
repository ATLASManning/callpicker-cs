import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  conciliar, notaReclasificacion, ESTADO_DORMIDA, ESTADOS_VIVOS,
  type CuentaConciliable, type FilaZohoDormido,
} from '@/lib/conciliacion'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Conciliación de cierre de semana.
 *
 *   GET  → vista previa. No escribe nada.
 *   POST → aplica la reclasificación de lo que quedó del lado del histórico.
 *
 * La separación importa: nunca se escribe sin que alguien haya visto antes qué
 * se va a escribir. El POST vuelve a conciliar del lado del servidor en lugar
 * de confiar en una lista que le manden — la decisión de qué cuenta se toca
 * se toma aquí, con los datos de este momento.
 */

const CAMPOS: string = 'id, consecutivo, cid, empresa, asesor, estado, facturacion'

/** Zoho · Dormidos, la misma fuente viva que usa el módulo Churn. */
async function dormidosZoho(origin: string, cookie: string | null): Promise<FilaZohoDormido[] | null> {
  try {
    // La cookie debe propagarse: /api/facturacion vive detrás del middleware
    // de auth y sin ella devuelve el HTML del login con status 200.
    const res = await fetch(`${origin}/api/facturacion?mode=dormidos`, {
      signal: AbortSignal.timeout(25000),
      redirect: 'manual',
      headers: cookie ? { cookie } : {},
    })
    if (!res.ok) return null
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) return null
    const data = await res.json() as { rows?: FilaZohoDormido[] }
    return Array.isArray(data.rows) ? data.rows : null
  } catch (e) {
    console.warn('[Conciliación] Zoho · Dormidos no disponible:', e)
    return null
  }
}

async function cargar(req: NextRequest) {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select(CAMPOS)
    .order('facturacion', { ascending: false })

  if (error) throw new Error(error.message)

  const zoho = await dormidosZoho(req.nextUrl.origin, req.headers.get('cookie'))
  return {
    resumen: conciliar((data ?? []) as unknown as CuentaConciliable[], zoho),
    zohoDisponible: zoho !== null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { resumen, zohoDisponible } = await cargar(req)
    return NextResponse.json({ ...resumen, zohoDisponible, aplicado: false })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { resumen, zohoDisponible } = await cargar(req)

    const aplicadas: Array<{ consecutivo: string; empresa: string; de: string; a: string }> = []
    const fallidas: Array<{ consecutivo: string; empresa: string; error: string }> = []

    for (const h of resumen.reclasificar) {
      const nota = notaReclasificacion(h)

      // Se relee la observación en el momento de escribir y se concatena: el
      // enriquecimiento y las notas del KAM son datos de otro; esto agrega,
      // nunca sustituye.
      const { data: prev } = await supabaseAdmin
        .from('cuentas')
        .select('observaciones_kam, estado')
        .eq('id', h.cuenta.id)
        .single()

      // Si alguien la movió entre la lectura y la escritura, se respeta.
      if (prev && !(ESTADOS_VIVOS as readonly string[]).includes(String(prev.estado ?? ''))) {
        continue
      }

      const anterior = (prev?.observaciones_kam ?? '').trim()
      const { error } = await supabaseAdmin
        .from('cuentas')
        .update({
          estado: ESTADO_DORMIDA,
          observaciones_kam: anterior ? `${anterior}\n\n${nota}` : nota,
        })
        .eq('id', h.cuenta.id)

      if (error) fallidas.push({ consecutivo: h.cuenta.consecutivo, empresa: h.cuenta.empresa, error: error.message })
      else aplicadas.push({ consecutivo: h.cuenta.consecutivo, empresa: h.cuenta.empresa, de: String(h.cuenta.estado), a: ESTADO_DORMIDA })
    }

    return NextResponse.json({
      ...resumen,
      zohoDisponible,
      aplicado: true,
      aplicadas,
      fallidas,
      // Las posteriores al corte se reportan pero NO se tocan: cambian de
      // estatus cuando el asesor documente, no antes.
      pendientesDeExpediente: resumen.exigeExpediente.length,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
