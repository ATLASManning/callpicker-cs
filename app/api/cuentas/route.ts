import { NextRequest, NextResponse } from 'next/server'
import { getCuentas, upsertCuenta } from '@/lib/supabase'
import { ticketStatsCuenta } from '@/lib/tickets-cuenta'
import { getZohoMap, lookupZoho } from '@/lib/zoho-enrich'

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
