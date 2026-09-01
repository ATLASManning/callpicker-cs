import { headers } from 'next/headers'
import PageHeader from '@/components/PageHeader'
import RevisionEnriquecimiento from './RevisionEnriquecimiento'

export const dynamic = 'force-dynamic'

/**
 * Bandeja de revisión de enriquecimiento.
 *
 * Muestra, lado a lado, el dato que capturó el KAM y el hallazgo externo. No
 * existe acción de "reemplazar": el KAM aprueba el dato como adicional, lo
 * marca incorrecto o lo pospone. El valor original nunca se toca desde aquí.
 */
export default function EnriquecimientoPage() {
  const h            = headers()
  const rol          = h.get('x-user-rol') ?? 'viewer'
  const asesorHeader = decodeURIComponent(h.get('x-user-asesor') ?? '')
  const esAdmin      = rol === 'admin'

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="Enriquecimiento de cuentas"
        subtitle="Hallazgos externos propuestos como dato adicional — el registro del KAM permanece intacto"
      />
      <RevisionEnriquecimiento esAdmin={esAdmin} asesorSesion={asesorHeader} />
    </div>
  )
}
