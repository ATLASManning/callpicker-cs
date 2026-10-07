import { NextRequest, NextResponse } from 'next/server'
import { detectarAlertas, UMBRALES } from '@/lib/alertas-detectar'
import { resumir } from '@/lib/alertas'
import { mapaFacturacion } from '@/lib/facturacion-cuenta'
import { alertasConMemoria } from '@/lib/alertas-episodios'
import { ultimoDiag } from '@/lib/senal-escrita'

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

  /* FALLA CERRADO, y la diferencia no es teórica.
   *
   * Antes era `rolAsesor && suyo ? suyo : (sp.get('asesor') || undefined)`: si
   * la sesión decía rol `asesor` pero venía SIN nombre de asesor, la condición
   * caía al lado derecho, se respetaba el `?asesor=` que mandara el cliente y,
   * sin ese parámetro, no quedaba filtro ninguno — la cartera entera de la
   * empresa. El caso que más duele es justo el que parece inofensivo: un
   * usuario al que se le asignó el rol y se le olvidó el nombre no veía menos,
   * veía TODO.
   *
   * Ahora un rol `asesor` sin nombre no recibe datos. Un permiso incompleto se
   * resuelve negando, nunca concediendo. */
  if (rolAsesor && !suyo) {
    return NextResponse.json(
      { error: 'La sesión tiene rol de asesor pero no trae asignada una cartera. '
             + 'Pedir a administración que complete el usuario.' },
      { status: 403 })
  }
  // Un asesor ve SU cartera aunque pida otra: el filtro no es decorativo.
  const asesor = rolAsesor ? suyo : (sp.get('asesor') || undefined)

  try {
    const { alertas: todas, memoria: episodios } = await alertasConMemoria(
      () => detectarAlertas(asesor ? { asesor } : undefined),
      asesor ? { asesor } : undefined,
    )
    const resumen = resumir(todas)

    let filtradas = todas
    const familia = sp.get('familia')
    const severidad = sp.get('severidad')
    const dueno = sp.get('dueno')
    if (familia) filtradas = filtradas.filter(a => a.familia === familia)
    if (severidad) filtradas = filtradas.filter(a => a.severidad === severidad)
    if (dueno) filtradas = filtradas.filter(a => a.dueno === dueno)

    const limite = Math.min(parseInt(sp.get('limite') ?? '200', 10) || 200, 1000)
    const rows = filtradas.slice(0, limite)

    return NextResponse.json({
      rows,
      mostradas: rows.length,
      filtradas: filtradas.length,
      resumen,
      umbrales: UMBRALES,
      /* El estado de la MEMORIA. Si la antigüedad no se está midiendo hay que
         poder verlo de un vistazo, no deducirlo de que todo diga 0. */
      episodios: {
        abiertos: episodios.abiertos, detectados: episodios.detectados,
        nuevos: episodios.nuevos, cerrados: episodios.cerrados,
        sinCerrar: episodios.sinCerrar, falla: episodios.falla,
      },
      /* Lo que vio la capa CUALITATIVA, y qué guarda tiró cada coincidencia.
         Una capa que no encuentra nada y una que no corre se ven igual.

         Se publica SÓLO si el diagnóstico es de esta misma cartera. `ultimoDiag`
         vive en el módulo y una lambda atiende varias peticiones a la vez, así
         que entre el `detectar` de arriba y esta línea puede haberlo pisado la
         corrida de otro usuario — con su cartera, que es más chica. Publicarlo
         igual sería enseñar 20 textos donde hay 704 y leerlo como «la capa casi
         no encuentra nada»: un diagnóstico equivocado me hace depurar lo que no
         está roto, y eso ya pasó. Si no coincide, se dice. */
      escritas: (() => {
        const esperado = asesor ?? 'cartera-completa'
        if (ultimoDiag.ambito !== esperado) {
          return { ambito: ultimoDiag.ambito, esperado,
                   aviso: 'El diagnóstico corresponde a otra cartera (petición '
                        + 'concurrente); los conteos no son de esta consulta.' }
        }
        /* El `detalle` lleva fragmentos de prosa del cliente. A un asesor se le
           dan los conteos —que son de SU cartera y le sirven para saber si la
           capa corrió— pero no las frases. */
        return rolAsesor ? { ...ultimoDiag, detalle: undefined } : ultimoDiag
      })(),
      /* El estado del respaldo de IMPORTES. Si el GRC no carga, las cuentas sin
         `facturacion` salen en cero y eso se confunde con un hallazgo. */
      facturacion: await (async () => {
        const m = await mapaFacturacion()
        return { cid: m.porCid.size, mes: m.mes, falla: m.falla }
      })(),
      generado: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? 'No se pudieron calcular las alertas' },
      { status: 500 })
  }
}
