import { getCuentas, getSemaforoByAsesor } from '@/lib/supabase'
import { ticketStatsCuenta } from '@/lib/tickets-cuenta'
import { enrichCuentasWithZoho } from '@/lib/zoho-enrich'
import { esCuentaViva, type Asesor } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import AsesorCard from '@/components/AsesorCard'
import AutoRefresh from '@/components/AutoRefresh'
import { getTicketsByCuenta } from '@/lib/cuenta-data'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const ALL_ASESORES: Asesor[] = ['Fátima', 'Dan', 'Claudia']

export default async function AsesoresPage() {
  const h = headers()
  const rol          = h.get('x-user-rol') ?? 'viewer'
  const asesorHeader = decodeURIComponent(h.get('x-user-asesor') ?? '')
  const isAsesor     = rol === 'asesor' && !!asesorHeader

  const ASESORES = isAsesor
    ? ALL_ASESORES.filter(a => a === asesorHeader)
    : ALL_ASESORES

  const [cuentasDb, resumenList] = await Promise.all([
    getCuentas(isAsesor ? { asesor: asesorHeader } : undefined),
    getSemaforoByAsesor(),
  ])
  // Regla 30 Ago 2026: tickets abiertos del dataset vivo, no de la columna.
  const cuentasRaw = cuentasDb.map(c => ({ ...c, tickets_abiertos: ticketStatsCuenta(c.cid ?? null, c.empresa).abiertos }))

  // Enriquecer con Factura Mensual + MRR en vivo de Zoho (misma fuente que Facturación/Cuentas)
  const cuentas = await enrichCuentasWithZoho(cuentasRaw)

  return (
    <div className="min-h-screen">
      <AutoRefresh intervalMs={300_000} showIndicator={false} />

      <PageHeader
        title="Panel por Asesor"
        subtitle="Vista de cartera individual por ejecutivo de Customer Success"
        actions={<AutoRefresh intervalMs={300_000} showIndicator />}
      />

      <div className="px-6 pb-8 space-y-5">
        {ASESORES.map((asesor, idx) => {
          // Cuentas de este asesor (activo + en_riesgo), ordenadas por HS asc.
          //
          // El filtro por estatus FALTABA (9-sep-2026): este comentario decía
          // "activo + en_riesgo" pero la lista traía TODAS, así que las
          // canceladas y dormidas aparecían en la cartera del asesor con su
          // semáforo de salud. Es lo que reportó Claudia: "Bliss crédito libre"
          // se leía activa/estable estando cancelada (HS 70 → azul "Estable").
          // La facturación de abajo sí filtraba — solo la lista no.
          const todasDelAsesor = cuentas.filter(c => c.asesor === asesor)
          const lista = todasDelAsesor
            .filter(c => esCuentaViva(c.estado))
            .sort((a, b) => a.health_score - b.health_score)
          // No se ocultan en silencio: se dice cuántas quedaron fuera y por qué.
          const fueraDeCartera = todasDelAsesor.length - lista.length

          // Enriquecer con tickets reales de Zoho Desk
          const listaRich = lista.map(c => {
            const r = getTicketsByCuenta(c.cid ?? null, c.empresa)
            return {
              ...c,
              zoho_tickets: {
                total:  r.total,
                fallas: r.rows.filter((t: { es_falla: string }) => t.es_falla === 'Si').length,
                ultima: r.rows[0]?.fecha ?? null,
              },
            }
          })

          // Resumen semáforo de este asesor
          const res = resumenList.find(r => r.asesor === asesor)
          // Total de cartera usando Factura Mensual de Zoho (misma base que la columna y Facturación)
          // `lista` ya es solo cartera viva, así que no se vuelve a filtrar.
          const facturacionTotal = lista
            .reduce((s, c) => s + (c.factura_mensual_zoho ?? c.facturacion ?? 0), 0)
          const resumen = {
            verde:    res?.verde    ?? 0,
            azul:     res?.azul     ?? 0,
            amarillo: res?.amarillo ?? 0,
            naranja:  res?.naranja  ?? 0,
            rojo:     res?.rojo     ?? 0,
            facturacion_total: facturacionTotal,
          }

          return (
            <AsesorCard
              key={asesor}
              asesor={asesor}
              cuentas={listaRich}
              resumen={resumen}
              fueraDeCartera={fueraDeCartera}
              defaultOpen={idx === 0}   // Primer asesor abierto por defecto
            />
          )
        })}
      </div>
    </div>
  )
}
