import { NextRequest, NextResponse } from 'next/server'
import { getCuentas, upsertCuenta } from '@/lib/supabase'
import { soporteDeCuenta } from '@/lib/soporte-cuenta'
import { getZohoMap, lookupZoho } from '@/lib/zoho-enrich'
import { bloqueoComercialDeCuenta } from '@/lib/elegibilidad'
import {
  carteraDeTrabajo, firmaDeSesion, esSuya, sesionDe, exigeDuenoDeCuenta,
} from '@/lib/dueno'

// Stats de tickets por cuenta: fuente única en lib/tickets-cuenta.ts
// (regla 30 Ago 2026: lo que se actualiza en Tickets se refleja en cuentas).

// ── Handlers ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp  = req.nextUrl.searchParams

  /* SU CARTERA ES SU COLA DE TRABAJO, no un candado: la lista abre con las
     cuentas del asesor porque es lo que la hace servir para algo, y así ha sido
     siempre en este tablero.
   *
   * Lo que cambia el 15 oct 2026 es que un `?asesor=` EXPLÍCITO se respeta —
   * consultar es libre por instrucción de dirección—. Antes se ignoraba, así
   * que un asesor no podía ni buscar la cuenta de un cliente que le llamara sin
   * ser suya. Lo que NO se respeta nunca es el `asesor` del cuerpo al escribir:
   * eso es firmar como otro. Ver lib/dueno.ts. */
  const cartera = carteraDeTrabajo(req.headers, sp.get('asesor'))
  if (!cartera.ok) return cartera.res
  const asesorFiltro = cartera.asesor

  try {
    const [data, zohoMap] = await Promise.all([
      getCuentas({
        asesor:   asesorFiltro || undefined,
        semaforo: sp.get('semaforo') || undefined,
        estado:   sp.get('estado')   || undefined,
        search:   sp.get('search')   || undefined,
      }),
      getZohoMap(),
    ])

    // Enriquecer cada cuenta con tickets + MRR y Factura Mensual de Zoho
    const enriched = data.map(c => {
      const z = lookupZoho(c.empresa, zohoMap)
      const sop = soporteDeCuenta(c.cid ?? null, c.empresa)
      const stats = sop.historia
      // Bloqueo comercial calculado AQUÍ, en el servidor, a propósito: cruza
      // los datasets de Churn (GRC-AAA-2026 y Análisis DATA) que son grandes y
      // no tienen por qué viajar al navegador. El cliente solo recibe el
      // veredicto. Ver bloqueoComercialDeCuenta en lib/elegibilidad.ts.
      const bloqueo = bloqueoComercialDeCuenta(c)
      return {
        ...c,
        zoho_tickets:         stats,
        // La columna guardada se sobrescribe (nadie la sincronizaba), pero ojo:
        // el export de Zoho solo trae CERRADOS, así que «abiertos» no se puede
        // medir con él y aquí sale 0 por definición, no por observación. Lo
        // medible son los vencidos del corte de la mesa, que van aparte.
        tickets_abiertos:     stats.abiertos ?? 0,
        tickets_abiertos_medible: sop.abiertosMedible,
        tickets_vencidos:     sop.vencidos.length,
        peor_dias_sla:        sop.peorDiasSLA,
        reincide_mesa:        sop.reincideEnMesa,
        fecha_corte_mesa:     sop.fechaCorte,
        severidad_soporte:    sop.severidad,
        // Trae el ACUMULADO desde el 17 sep 2026, no una mensualidad.
        mrr_zoho:             z?.acumulado      ?? null,
        factura_mensual_zoho: z?.factura_mensual ?? null,
        semaforo_zoho:        z?.semaforo        ?? null,
        segmento_zoho:        z?.segmento        ?? null,
        // `churn_confirmado` es TRUE aunque `estado` siga diciendo activo: las
        // fuentes de Churn mandan sobre la columna, que se desactualiza (fue
        // la causa del incidente del 24-ago-2026).
        churn_confirmado:     bloqueo.codigos.includes('churn_grc'),
        cancelacion_reportada: bloqueo.codigos.includes('cancelacion'),
        bloqueo_sac:          bloqueo.bloqueada,
        bloqueo_motivos:      bloqueo.motivos,
      }
    })

    return NextResponse.json(enriched)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  /* Este POST es un UPSERT: con `id` reescribe una cuenta existente. Sin
     comprobación, un asesor reescribía cualquier cuenta de la empresa —incluida
     la columna `asesor`, con lo que podía adjudicarse cartera ajena— y un
     `viewer` creaba cuentas. No estaba en los siete puntos de la auditoría;
     salió al barrer la clase, que es el encargo. */
  const s = sesionDe(req.headers)
  if (s.rol !== 'admin' && s.rol !== 'asesor') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const body = await req.json()

    if (body?.id) {
      const corta = await exigeDuenoDeCuenta(req.headers, String(body.id), 'escritura')
      if (corta) return corta
    }

    /* El dueño lo pone la sesión, no el cuerpo: si no, un asesor se asigna a sí
       mismo una cuenta de otro, o se la pasa a un tercero. Administración sigue
       pudiendo mover cartera, que es su trabajo. */
    const firma = firmaDeSesion(req.headers, body?.asesor)
    if (!firma.ok) return firma.res
    const sanea = s.rol === 'asesor'
      ? { ...body, asesor: firma.asesor }
      : body

    if (s.rol === 'asesor' && body?.asesor && !esSuya(s, body.asesor)) {
      return NextResponse.json(
        { error: 'No puedes asignar una cuenta a otra cartera.' },
        { status: 403 })
    }

    const cuenta = await upsertCuenta(sanea)
    return NextResponse.json(cuenta, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
