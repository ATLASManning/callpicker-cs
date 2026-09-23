import { NextResponse } from 'next/server'
import { getCuentas } from '@/lib/supabase'
import { normalizarNombre } from '@/lib/elegibilidad'

/**
 * Nombre de cliente → asesor responsable, para la concentración de GRC AAA.
 *
 * POR QUÉ NO SE USA `/api/cuentas`
 * --------------------------------
 * Esa ruta RECORTA la cartera cuando quien entra es un asesor: devuelve solo
 * las suyas. La concentración de Churn y Downgrade de GRC AAA tiene que nombrar
 * al responsable de CADA cuenta, así que con esa fuente un asesor vería el
 * resto de la tabla como «sin asesor» y no habría nada en pantalla que se lo
 * advirtiera. Un recorte silencioso es peor que no tener el dato.
 *
 * No amplía lo que ya se ve: el módulo Churn muestra a todo el que entra el
 * nombre y el MRR perdido de cada cliente. Esto solo añade de quién es la
 * cuenta, y nada más — ni contactos, ni facturación, ni notas.
 *
 * El export de GRC no trae CID (viene de Zoho Analytics), así que la única
 * llave posible es el nombre normalizado. Por eso se devuelve también
 * `ambiguos`: los nombres que dos cuentas distintas comparten al normalizar.
 * En esos, el consumidor NO debe atribuir asesor — ver la regla de no inventar
 * atribuciones de [[feedback-contexto-ia-sin-huecos]].
 */
export async function GET() {
  try {
    const cuentas = await getCuentas()

    const porNombre: Record<string, { asesor: string; consecutivo: string; estado: string }> = {}
    const ambiguos: string[] = []

    for (const c of cuentas) {
      const k = normalizarNombre(c.empresa)
      if (!k || !c.asesor) continue
      const previo = porNombre[k]
      if (previo && previo.asesor !== c.asesor) {
        // Dos cuentas distintas con el mismo nombre normalizado y distinto
        // dueño: no se puede elegir una sin inventar.
        if (!ambiguos.includes(k)) ambiguos.push(k)
        continue
      }
      porNombre[k] = {
        asesor: c.asesor,
        consecutivo: c.consecutivo ?? '',
        estado: c.estado ?? '',
      }
    }
    for (const k of ambiguos) delete porNombre[k]

    return NextResponse.json({
      porNombre,
      ambiguos,
      totalCuentas: cuentas.length,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error leyendo la cartera' },
      { status: 500 },
    )
  }
}
