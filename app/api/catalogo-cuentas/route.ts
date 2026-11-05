/**
 * /api/catalogo-cuentas — las cuentas que Reuniones y Anexos pueden elegir.
 *
 * La cartera CS (224) MÁS el padrón de facturación de los cortes (2,726), sin
 * duplicar las que están en las dos. Es lo que hace que se pueda registrar una
 * reunión o colgar un documento de un cliente que ningún asesor lleva — el
 * caso que descubrió ProMujer. Ver `lib/catalogo-cuentas.ts`.
 *
 * Es de SOLO LECTURA. Quién puede ESCRIBIR sobre cada cuenta no se decide
 * aquí: lo deciden las rutas que insertan, con `lib/dueno.ts`.
 */
import { NextRequest, NextResponse } from 'next/server'
import { catalogoCuentas } from '@/lib/catalogo-cuentas'
import { sesionDe, acotaLectura, MENSAJE_SIN_CARTERA } from '@/lib/dueno'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const s = sesionDe(req.headers)
  if (acotaLectura(s) && !s.asesor) {
    return NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 })
  }

  try {
    const cat = await catalogoCuentas()
    /* SI LOS CORTES NO SE PUDIERON LEER NO SE DEVUELVE «la cartera y ya»
       en silencio: el selector se vería corto y nadie sabría por qué. Va un
       aviso que la pantalla pinta. [[feedback-cero-sin-medicion]] */
    return NextResponse.json({
      ...cat,
      aviso: cat.meta.cortesLeidos ? null
        : 'No se pudo leer data/cortes-facturacion.xlsx: sólo se ofrecen las '
        + 'cuentas de la cartera CS. Las de facturación FALTAN, no es que no existan.',
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: 'catalogo_no_disponible', mensaje: String(e) }, { status: 503 },
    )
  }
}
