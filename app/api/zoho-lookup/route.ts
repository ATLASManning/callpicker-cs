import { NextRequest, NextResponse } from 'next/server'
import { getZohoMap, lookupZoho } from '@/lib/zoho-enrich'
import { supabaseAdmin } from '@/lib/supabase'
import { sesionDe, esRolAcotado, esSuya, MENSAJE_SIN_CARTERA } from '@/lib/dueno'
// El nombre de empresa se normaliza con el normalizador canónico del proyecto,
// no con el del candado: son dos cosas distintas que hoy coinciden.
import { normalizarNombre } from '@/lib/elegibilidad'

/**
 * GET /api/zoho-lookup?empresa= — acumulado, factura mensual, semáforo y
 * segmento de un cliente.
 *
 * ERAN 18 LÍNEAS SIN UNA SOLA COMPROBACIÓN. Cualquier sesión preguntaba por
 * cualquier cliente por nombre y recibía su facturación. La auditoría del 6 oct
 * 2026 lo puso el cuarto por gravedad; el 12 oct volvieron los tres asesores,
 * así que estaba vivo.
 *
 * SE BUSCA POR NOMBRE, y ahí está la trampa: el parámetro no es un `id` que se
 * pueda comprobar contra una fila. Así que la comprobación es al revés —se
 * resuelve el nombre contra `cuentas` y se mira de quién es—. Y un nombre que
 * NO está en la cartera no se responde «no es tuyo» sino que se trata como
 * desconocido: si contestáramos la facturación de lo que no está en cartera,
 * bastaría con preguntar por el nombre de cualquier cliente de la empresa para
 * saltarse el candado entero.
 */
export async function GET(req: NextRequest) {
  const empresa = req.nextUrl.searchParams.get('empresa') ?? ''
  if (!empresa.trim()) {
    return NextResponse.json({ error: 'empresa requerida' }, { status: 400 })
  }

  const s = sesionDe(req.headers)
  if (esRolAcotado(s) && !s.asesor) {
    return NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 })
  }

  try {
    if (esRolAcotado(s)) {
      /* El cruce NO es `=` sobre el nombre crudo: `cuentas.empresa` y el
         nombre que manda la ficha difieren en acentos y puntuación, y con una
         comparación estricta el candado expulsaría al asesor de cuentas que
         sí son suyas. */
      const { data, error } = await supabaseAdmin
        .from('cuentas')
        .select('empresa, asesor')
      if (error) throw error
      const pedido = normalizarNombre(empresa)
      const fila = (data ?? []).find(
        c => normalizarNombre((c as { empresa: string | null }).empresa) === pedido)
      if (!fila || !esSuya(s, (fila as { asesor: string | null }).asesor)) {
        return NextResponse.json(
          { error: 'No existe esa cuenta en tu cartera.' }, { status: 404 })
      }
    }

    const zmap = await getZohoMap()
    const z = lookupZoho(empresa.trim(), zmap)
    // La forma vacía tiene que ser la MISMA que la real, o quien la consuma
    // recibe un objeto con otras llaves y no se entera.
    return NextResponse.json(z ?? { acumulado: 0, factura_mensual: 0, semaforo: '', segmento: '' })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
