import { NextRequest, NextResponse } from 'next/server'
import { getCuentas } from '@/lib/supabase'
import { carteraDeTrabajo } from '@/lib/dueno'
import { AAA_GRC_2026 } from '@/app/churn/aaa-grc-data'
import capa from '@/data/cuentas-downgrade.json'

export const dynamic = 'force-dynamic'

/**
 * CUENTAS ACTIVAS CON DOWNGRADE.
 *
 * ── POR QUÉ LA LISTA ES CURADA Y NO CALCULADA ─────────────────────────────
 * Porque ninguna fuente sola contesta la pregunta, y eso está medido
 * (13 nov 2026):
 *
 *   · GRC, corte vivo de noviembre, movimiento «Downgrade» → 16 filas y
 *     **cero** en la cartera gestionada.
 *   · Corte vigente de Análisis DATA → 3 clientes, y el corte dice de los tres
 *     que **no están en la cartera CS**.
 *   · GRC AAA 2026 cruzado con la cartera viva → **60** cuentas, que es el
 *     histórico del año entero: ahí un downgrade de enero ya digerido pesa
 *     igual que uno de octubre.
 *
 * Así que quién entra lo decide dirección, en `data/cuentas-downgrade.json`,
 * y cada entrada dice quién la marcó y cuándo. Lo que NO se teclea ahí es
 * ninguna cifra: el MRR y los eventos salen de las fuentes al leer.
 *
 * ── EL CANDADO VA EN LA CONSULTA ──────────────────────────────────────────
 * No hay consulta propia: se pide a `getCuentas` con la cartera de la sesión,
 * que es la única puerta y ya resuelve el MRR institucional desde el GRC. Un
 * asesor ve de esta lista únicamente sus cuentas. Ver `lib/dueno.ts`.
 *
 * ── Y UN CERO AQUÍ NO ES UN CERO ──────────────────────────────────────────
 * Que las fuentes no traigan eventos de una cuenta marcada NO significa que no
 * haya habido downgrade: dirección puede saberlo por la factura antes de que
 * el GRC lo publique. Por eso cada cuenta viaja con `eventosMedibles` y la
 * pantalla lo dice con palabras en vez de pintar un cero.
 * [[feedback-cero-sin-medicion]]
 */

interface EntradaCapa {
  cid: string
  consecutivo?: string
  empresa: string
  fecha?: string
  quien?: string
  razon?: string
  queBajo?: string
  origen?: string
}

const norm = (s: unknown) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '')

/** Los eventos de Downgrade que el GRC AAA 2026 tiene de un nombre. */
function eventosDe(empresa: string) {
  const k = norm(empresa)
  const out: { mes: string; mrrInicio: number; mrrFin: number; perdido: number }[] = []
  for (const mes of AAA_GRC_2026) {
    for (const r of mes.clientes ?? []) {
      if (!String(r.movimiento ?? '').includes('Downgrade')) continue
      if (norm(r.cliente) !== k) continue
      out.push({
        mes: mes.mes,
        mrrInicio: r.mrrInicio ?? 0,
        mrrFin: r.mrrFin ?? 0,
        perdido: r.perdido ?? 0,
      })
    }
  }
  return out
}

/* EL CORTE SEMANAL DE ANÁLISIS DATA NO SE IMPORTA AQUÍ, Y ES A PROPÓSITO.
   Su constante lleva el número de corte en el nombre (`REPORTE_S28_OCT_2026`),
   así que cada consumidor nuevo es un sitio más que hay que tocar al rotarlo.
   Ya son dos. Y no aportaría nada: los tres downgrades del corte vigente son
   de clientes que el propio corte declara FUERA de la cartera CS, así que
   ninguno puede salir en esta pantalla. Cuando un corte sí traiga una cuenta
   nuestra, lo que la mete aquí es que dirección la marque, y el campo `origen`
   de la capa guarda de qué corte salió. */

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const cartera = carteraDeTrabajo(req.headers, sp.get('asesor'))
  if (!cartera.ok) return cartera.res

  try {
    const entradas = (capa.cuentas ?? []) as unknown as EntradaCapa[]
    const cuentas = await getCuentas({ asesor: cartera.asesor || undefined })
    const porCid = new Map(cuentas.map(c => [String(c.cid ?? '').trim(), c]))

    const filas = []
    /* Entradas que NO se pudieron resolver. Sólo se reportan cuando la petición
       NO viene acotada a un asesor: para un asesor, una cuenta que no es suya
       falta A PROPÓSITO y llamarlo «problema» le diría que existe. */
    const problemas: { cid: string; empresa: string; que: string }[] = []

    for (const e of entradas) {
      const c = porCid.get(String(e.cid).trim())
      if (!c) {
        if (!cartera.asesor) {
          problemas.push({ cid: e.cid, empresa: e.empresa,
            que: 'el CID no está en la cartera' })
        }
        continue
      }
      /* El nombre es el testigo del CID, no la llave. Si no cuadra, la entrada
         no se pinta: un CID reasignado pondría aquí a otra empresa. */
      if (norm(c.empresa) !== norm(e.empresa)) {
        if (!cartera.asesor) {
          problemas.push({ cid: e.cid, empresa: e.empresa,
            que: `el CID ahora es de «${c.empresa}»` })
        }
        continue
      }
      const eventos = eventosDe(c.empresa)
      filas.push({
        id: c.id,
        cid: c.cid,
        consecutivo: c.consecutivo ?? e.consecutivo ?? null,
        empresa: c.empresa,
        asesor: c.asesor ?? null,
        estado: c.estado ?? null,
        mrr: c.facturacion ?? null,
        health_score: c.health_score ?? null,
        // Lo que puso una persona
        fecha: e.fecha ?? null,
        quien: e.quien ?? null,
        razon: e.razon ?? null,
        queBajo: e.queBajo ?? null,
        origen: e.origen ?? null,
        // Lo que miden las fuentes
        eventos,
        eventosMedibles: eventos.length > 0,
        perdidoGrc: eventos.reduce((s, x) => s + x.perdido, 0),
      })
    }

    filas.sort((a, b) => (b.perdidoGrc - a.perdidoGrc) || (b.mrr ?? 0) - (a.mrr ?? 0))

    return NextResponse.json({
      filas,
      problemas,
      /* Qué periodo cubre lo MEDIDO, para que la pantalla no lo dé por supuesto.
         Sin esto, una tabla de eventos se lee como «todo lo que ha pasado».
         [[feedback-contexto-ia-sin-huecos]] */
      cobertura: { grcAaaMeses: AAA_GRC_2026.map(m => m.mes) },
      acotadoA: cartera.asesor || null,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
