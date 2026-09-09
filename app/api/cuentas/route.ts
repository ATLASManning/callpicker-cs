import { NextRequest, NextResponse } from 'next/server'
import { getCuentas, upsertCuenta } from '@/lib/supabase'
import { ticketStatsCuenta } from '@/lib/tickets-cuenta'
import { getZohoMap, lookupZoho } from '@/lib/zoho-enrich'
import { bloqueoComercialDeCuenta } from '@/lib/elegibilidad'

// Stats de tickets por cuenta: fuente única en lib/tickets-cuenta.ts
// (regla 30 Ago 2026: lo que se actualiza en Tickets se refleja en cuentas).

// ── Handlers ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp  = req.nextUrl.searchParams
  const rol = req.headers.get('x-user-rol') ?? 'viewer'
  const asesorHeader = decodeURIComponent(req.headers.get('x-user-asesor') ?? '')

  // Si el usuario es asesor, forzar filtro por su nombre (ignora el param del frontend)
  const asesorFiltro = rol === 'asesor' ? asesorHeader : (sp.get('asesor') || undefined)

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
      const stats = ticketStatsCuenta(c.cid ?? null, c.empresa)
      // Bloqueo comercial calculado AQUÍ, en el servidor, a propósito: cruza
      // los datasets de Churn (GRC-AAA-2026 y Análisis DATA) que son grandes y
      // no tienen por qué viajar al navegador. El cliente solo recibe el
      // veredicto. Ver bloqueoComercialDeCuenta en lib/elegibilidad.ts.
      const bloqueo = bloqueoComercialDeCuenta(c)
      return {
        ...c,
        zoho_tickets:         stats,
        // Sobrescribe la columna guardada en la tabla (nadie la sincronizaba):
        // los abiertos se calculan SIEMPRE del dataset vivo de Zoho Desk.
        tickets_abiertos:     stats.abiertos,
        mrr_zoho:             z?.mrr            ?? null,
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
  try {
    const body = await req.json()
    const cuenta = await upsertCuenta(body)
    return NextResponse.json(cuenta, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
