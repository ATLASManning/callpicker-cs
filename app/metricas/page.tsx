import { redirect } from 'next/navigation'

/**
 * /metricas → ahora forma parte del Dashboard principal.
 * Redirigir al usuario directamente.
 */
export default function MetricasPage() {
  redirect('/#metricas')
}
