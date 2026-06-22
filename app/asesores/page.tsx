import { getCuentas, getSemaforoByAsesor } from '@/lib/supabase'
import { enrichCuentasWithZoho } from '@/lib/zoho-enrich'
import type { Asesor } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import AsesorCard from '@/components/AsesorCard'
import AutoRefresh from '@/components/AutoRefresh'
import { getTicketsByCuenta } from '@/lib/cuenta-data'

export const dynamic = 'force-dynamic'

const ASESORES: Asesor[] = ['Fátima', 'Dan', 'Claudia']

export default async function AsesoresPage() {
  const [cuentasRaw, resumenList] = await Promise.all([getCuentas(), getSemaforoByAsesor()])
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
          // Cuentas de este asesor (activo + en_riesgo), ordenadas por HS asc
          const lista = cuentas
            .filter(c => c.asesor === asesor)
            .sort((a, b) => a.health_score - b.health_score)

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
          const facturacionTotal = lista
            .filter(c => c.estado === 'activo' || c.estado === 'en_riesgo')
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
              defaultOpen={idx === 0}   // Primer asesor abierto por defecto
            />
          )
        })}
      </div>
    </div>
  )
}
