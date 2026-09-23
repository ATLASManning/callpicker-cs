import { STATIC_CASES } from '@/app/auditoria/cases'
import type { EstadoAuditoria } from '@/app/auditoria/types'

/**
 * Cuántas auditorías tiene cada asesor y en qué estatus.
 *
 * DÓNDE SE CALCULA Y POR QUÉ IMPORTA
 * ----------------------------------
 * Los 33 casos viven como módulos TypeScript y pesan cerca de 1 MB entre
 * todos. Esto se llama SOLO desde la página de Asesores, que es un Server
 * Component: el megabyte se queda en el servidor y a la tarjeta le llega el
 * resumen —cuatro números y un desglose—, no los casos. Si se importara desde
 * el componente de la tarjeta, que es cliente, ese megabyte viajaría al
 * navegador en cada carga.
 *
 * El estatus NO se reinterpreta: es el campo `estado` de cada caso, tal como
 * lo escribió quien hizo la auditoría.
 */

export const ORDEN_ESTADO: EstadoAuditoria[] = [
  'perdido', 'en_riesgo', 'rescatable', 'en_recuperacion', 'recuperado', 'activo',
]

export const META_ESTADO: Record<EstadoAuditoria, { label: string; color: string }> = {
  perdido:         { label: 'Perdido',          color: '#EF4444' },
  en_riesgo:       { label: 'En riesgo',        color: '#F97316' },
  rescatable:      { label: 'Rescatable',       color: '#EAB308' },
  en_recuperacion: { label: 'En recuperación',  color: '#3B82F6' },
  recuperado:      { label: 'Recuperado',       color: '#22C55E' },
  activo:          { label: 'Activo',           color: '#14B8A6' },
}

export type AuditoriasAsesor = {
  total: number
  /** Conteo por estatus, en el orden de ORDEN_ESTADO y sin los que van en cero. */
  porEstado: Array<{ estado: EstadoAuditoria; label: string; color: string; n: number }>
  /** Las que piden atención: perdido, en riesgo o rescatable. */
  abiertas: number
}

const VACIO: AuditoriasAsesor = { total: 0, porEstado: [], abiertas: 0 }
const ATENCION: EstadoAuditoria[] = ['perdido', 'en_riesgo', 'rescatable']

export function auditoriasPorAsesor(): Record<string, AuditoriasAsesor> {
  const acc: Record<string, Partial<Record<EstadoAuditoria, number>>> = {}

  for (const c of STATIC_CASES) {
    // Sin asesor capturado no se reparte entre nadie: se omite y el total de
    // cada tarjeta deja de cuadrar con los 33, que es lo correcto — la tarjeta
    // dice lo de ESE asesor, no una porción inventada de lo que no se sabe.
    if (!c.asesor) continue
    const e = acc[c.asesor] ?? (acc[c.asesor] = {})
    e[c.estado] = (e[c.estado] ?? 0) + 1
  }

  const salida: Record<string, AuditoriasAsesor> = {}
  for (const [asesor, conteo] of Object.entries(acc)) {
    const porEstado = ORDEN_ESTADO
      .filter(e => (conteo[e] ?? 0) > 0)
      .map(e => ({ estado: e, label: META_ESTADO[e].label, color: META_ESTADO[e].color, n: conteo[e]! }))
    salida[asesor] = {
      total: porEstado.reduce((s, x) => s + x.n, 0),
      porEstado,
      abiertas: ATENCION.reduce((s, e) => s + (conteo[e] ?? 0), 0),
    }
  }
  return salida
}

export function auditoriasDe(
  mapa: Record<string, AuditoriasAsesor>, asesor: string,
): AuditoriasAsesor {
  return mapa[asesor] ?? VACIO
}
