import { NextRequest, NextResponse } from 'next/server'
import { POST as generarPOST } from '@/app/api/actividades/generar/route'
import { ahoraEnMexico, fechaLocal } from '@/lib/fecha-local'
/* `esLunes` vive en elegibilidad y NO en fecha-local: recibe una fecha ya
   trasladada a México, que es justo lo que devuelve `ahoraEnMexico()`. Es el
   mismo par que usa el generador para su propia guarda de lunes. */
import { esLunes } from '@/lib/elegibilidad'

/**
 * app/api/cron/generar-semana — el lote del lunes, sin que nadie apriete nada.
 *
 * POR QUÉ EXISTE
 * --------------
 * La generación semanal SIEMPRE fue manual: alguien tenía que abrir el panel de
 * cada asesor y pulsar «Generar actividades», tres veces, cada lunes. El 28 de
 * septiembre de 2026 a las 10:12 el panel seguía vacío y así se descubrió —
 * junto con que la generación además estaba rota por un import faltante.
 *
 * Instrucción de dirección ese mismo día: dejar el cron del lunes funcionando.
 *
 * CÓMO GENERA
 * -----------
 * Llama al handler POST de `/api/actividades/generar` DIRECTAMENTE, no por HTTP.
 * Es una función exportada y se puede invocar; hacerlo por red sumaría una vuelta
 * de latencia y obligaría a abrirle también esa ruta al secreto.
 *
 * Lo que sí viaja es la cabecera `Authorization`, porque ese handler hace su
 * propia petición interna a `/api/facturacion?mode=dormidos` para conciliar con
 * Zoho, y esa sí pasa por el middleware. Sin la cabecera, esa conciliación
 * devuelve el HTML del login, el generador lo detecta y —fail-closed, por
 * diseño— no genera nada. O sea: sin reenviar el secreto, el cron correría y no
 * produciría una sola actividad.
 *
 * NO MANDA CORREO
 * ---------------
 * `sendEmail: false`. Mandar correo a tres personas en automático es algo que se
 * pide, no que se asume; el lote queda en el tablero y el aviso se decide aparte.
 *
 * IDEMPOTENTE
 * -----------
 * El generador devuelve «Ya existen actividades para esta semana» si ya se
 * generaron, así que repetirlo no duplica. Eso hace seguro reintentar, y hace
 * inofensivo que alguien lo dispare a mano.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ASESORES = ['Claudia', 'Dan', 'Fátima'] as const

/** Margen para contestar antes de que la función se corte. */
const CORTE_MS = 52_000

export async function GET(req: NextRequest) {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!process.env.CRON_SECRET || bearer !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  /* El lunes se comprueba en hora de MÉXICO, no en la del servidor: Vercel va en
     UTC y el cron de las 08:00 de México son las 14:00 UTC del mismo día, pero
     un horario más temprano caería en domingo allá. El generador ya tiene su
     propia guarda de lunes; ésta evita siquiera intentarlo.
     `?forzar=1` la salta, para poder probar el cron cualquier día. */
  const forzar = req.nextUrl.searchParams.get('forzar') === '1'
  const hoy = ahoraEnMexico()
  if (!forzar && !esLunes(hoy)) {
    return NextResponse.json({
      ok: true, omitido: 'no es lunes en México', fecha: fechaLocal(hoy),
    })
  }

  const t0 = Date.now()
  const resultados: Array<Record<string, unknown>> = []

  for (const asesor of ASESORES) {
    if (Date.now() - t0 > CORTE_MS) {
      resultados.push({ asesor, estado: 'sin tiempo', nota: 'se generará al reintentar' })
      continue
    }
    try {
      /* Se reconstruye la petición para el handler: misma URL de origen —la usa
         para su fetch interno— y la cabecera del secreto, que es lo que le
         permite conciliar con Zoho. */
      const url = new URL('/api/actividades/generar', req.nextUrl.origin)
      const interna = new NextRequest(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ asesor, sendEmail: false }),
      })
      const res = await generarPOST(interna)
      const cuerpo = await res.json().catch(() => ({}))
      resultados.push({
        asesor,
        status: res.status,
        generadas: cuerpo?.generadas ?? null,
        focos: cuerpo?.acervoDeRiesgo?.generadas ?? null,
        mensaje: cuerpo?.message ?? cuerpo?.error ?? null,
      })
    } catch (e) {
      resultados.push({ asesor, estado: 'error', detalle: e instanceof Error ? e.message : String(e) })
    }
  }

  const total = resultados.reduce((s, r) => s + (Number(r.generadas) || 0), 0)
  return NextResponse.json({
    ok: true,
    fecha: fechaLocal(hoy),
    ms: Date.now() - t0,
    totalGeneradas: total,
    resultados,
  })
}
