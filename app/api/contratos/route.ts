/**
 * /api/contratos — los contratos con clientes, cruzados con la cartera.
 *
 * ── POR QUE EL CRUCE VA AQUÍ Y NO EN EL GENERADOR ─────────────────────────
 * El archivo de contratos es un export que se refresca cada tanto; la cartera
 * cambia todos los días (altas, cambios de asesor, estados). Si el cruce se
 * congelara en el JSON, un contrato seguiría diciendo «Claudia» un mes después
 * de que su cuenta pasó a Erick. Se cruza en cada petición, por CID.
 *
 * ── EL CRUCE ES POR CID, NUNCA POR NOMBRE ─────────────────────────────────
 * La hoja escribe «IMPAS Municipio Chihua…» y la cartera «IMPAS Municipio
 * Chihuahua»; por nombre eso se arregla con un parecido, y un parecido mezcla
 * cuentas — es la misma trampa documentada en [[dids-fuente]] y la que propone
 * «ADSA ≈ TATSA» siendo empresas distintas. 51 de los 60 contratos traen CID.
 *
 * ── LO QUE NO CRUZA NO SE TIRA ────────────────────────────────────────────
 * 36 contratos no corresponden a ninguna cuenta de la cartera CS: son clientes
 * de Callpicker que ningún asesor lleva. Salen igual, marcados `enCartera:
 * false`, y sus dimensiones de cartera (giro, tamaño, facturación) van en
 * `null` — que NO es lo mismo que cero. [[feedback-cero-sin-medicion]]
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { mapaFacturacion, importeDeCuenta, topDeCartera } from '@/lib/facturacion-cuenta'
import { hoyEnMexico } from '@/lib/fecha-local'
import type { Contrato } from '@/lib/contratos-norm'
import datos from '@/data/contratos.json'

export const dynamic = 'force-dynamic'

/** Días desde hoy (hora de México) hasta una fecha ISO. Negativo = ya pasó. */
function diasHasta(iso: string | null, hoy: string): number | null {
  if (!iso) return null
  const a = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))
  const b = Date.UTC(+hoy.slice(0, 4), +hoy.slice(5, 7) - 1, +hoy.slice(8, 10))
  return Math.round((a - b) / 86400000)
}

export async function GET() {
  try {
    const hoy = hoyEnMexico()

    const { data: cuentas, error } = await supabaseAdmin
      .from('cuentas')
      .select('id, cid, empresa, consecutivo, asesor, estado, giro, tamano_empresa, facturacion')

    /* SIN CARTERA NO SE INVENTA UN CRUCE VACÍO. Devolver todo como «fuera de
       cartera» se leería como un hallazgo —«ningún contrato es de la cartera»—
       cuando es la lectura que falló. Es el mismo error que costó dos
       despliegues con el GRC: confundir un fallo con un hallazgo.
       [[grc-fuente-zoho]] */
    if (error || !cuentas) {
      return NextResponse.json(
        { error: 'No se pudo leer la cartera', detalle: error?.message ?? null },
        { status: 503 },
      )
    }

    const mapa = await mapaFacturacion()
    const top  = await topDeCartera(mapa)

    const porCid = new Map<string, typeof cuentas[number]>()
    for (const c of cuentas) {
      const cid = String(c.cid ?? '').trim()
      if (cid) porCid.set(cid, c)
    }

    const contratos = (datos.contratos as unknown as Contrato[]).map(c => {
      const cid = c.cid
      const cta = cid ? porCid.get(cid) : undefined
      const fin = c.fin
      const dias = diasHasta(fin, hoy)
      return {
        ...c,
        diasParaVencer: dias,
        vencido: dias !== null && dias < 0,
        enCartera: !!cta,
        consecutivo: cta?.consecutivo ?? null,
        empresaCartera: cta?.empresa ?? null,
        asesor: cta?.asesor ?? null,
        estadoCuenta: cta?.estado ?? null,
        giro: cta?.giro ?? null,
        tamano: cta?.tamano_empresa ?? null,
        /* El importe sale de la MISMA función que el resto del tablero, que
           prefiere el MRR institucional del GRC y sólo cae al promedio de vida
           cuando el GRC no tiene la cuenta. Calcularlo aquí a mano habría dado
           una tercera cifra para lo mismo. [[grc-fuente-zoho]] */
        mrr: cta ? importeDeCuenta(cta, mapa).mrr : null,
        esTop: cta ? top.has(String(cta.id)) : false,
      }
    })

    /* LAS CUENTAS TOP SIN CONTRATO: es la pregunta que motivó el módulo, y se
       contesta al revés — desde la cartera, no desde la hoja. Mirando sólo los
       contratos nunca se vería a quien NO tiene ninguno. */
    const cidsFirmados = new Set(
      contratos.filter(c => c.estado === 'firmado' && c.cid).map(c => c.cid as string),
    )
    const tops = cuentas.filter(c => top.has(String(c.id)))
    const topSinContrato = tops
      .filter(c => !cidsFirmados.has(String(c.cid ?? '').trim()))
      .map(c => ({
        consecutivo: c.consecutivo, empresa: c.empresa, cid: c.cid,
        asesor: c.asesor, estado: c.estado,
        mrr: importeDeCuenta(c, mapa).mrr,
      }))
      .sort((a, b) => (b.mrr ?? 0) - (a.mrr ?? 0))

    return NextResponse.json({
      meta: {
        ...datos.meta,
        hoy,
        enCartera: contratos.filter(c => c.enCartera).length,
        fueraDeCartera: contratos.filter(c => !c.enCartera).length,
        topTotal: tops.length,
        topConContrato: tops.length - topSinContrato.length,
      },
      contratos,
      topSinContrato,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
