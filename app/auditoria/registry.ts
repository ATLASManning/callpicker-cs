/**
 * app/auditoria/registry.ts
 * Mapeo entre cuentas y su caso de Auditoría.
 *
 * El detalle de cada cuenta (/cuentas/[id]) muestra un botón "Auditoría" cuando
 * su consecutivo aparece aquí, enlazando a /auditoria?caso=<id>.
 *
 * ➕ Al agregar una nueva auditoría al módulo (nuevo *-data.ts), añade su entrada
 *    aquí con el/los consecutivo(s) de la cuenta para que el botón aparezca solo.
 *    El `id` debe coincidir EXACTAMENTE con AuditoriaCase.id.
 */
export interface AuditoriaRef {
  id:           string    // = AuditoriaCase.id
  nombre:       string    // etiqueta legible del caso
  consecutivos: string[]  // cuentas (consecutivo) que abre este reporte
}

export const AUDITORIA_REFS: AuditoriaRef[] = [
  { id: 'arkansas',        nombre: 'Arkansas State University (ASUQ)', consecutivos: ['F45'] },
  { id: 'finsus',          nombre: 'FINSUS – Economía Móvil',          consecutivos: ['F1']  },
  { id: 'grupofrisa',      nombre: 'Grupo FRISA / ACISA',              consecutivos: ['F16'] },
  { id: 'agua-inmaculada', nombre: 'Agua Inmaculada',                  consecutivos: ['C17'] },
  { id: 'salud-y-hogar',   nombre: 'Salud y Hogar',                    consecutivos: ['D3']  },
  { id: 'samalab',         nombre: 'SAMALAB',                          consecutivos: ['F14'] },
  { id: 'labsus',          nombre: 'LABSUS Centro Diagnóstico',        consecutivos: ['C37'] },
  { id: 'brandgroup',      nombre: 'Brand-Kern-Liebers México (Brandgroup)', consecutivos: ['C15'] },
  { id: 'cintascove',      nombre: 'Cintas Cove S.A. de C.V.',              consecutivos: ['D14'] },
  { id: 'clickbalance',    nombre: 'ClickBalance ERP',                       consecutivos: ['C43'] },
  { id: 'elerybrands',     nombre: 'Elery Brands · Clínicas del Hombre',      consecutivos: ['C22'] },
]

/** Devuelve la auditoría asociada a un consecutivo de cuenta, o null si no existe. */
export function findAuditoriaForConsecutivo(consecutivo: string | null | undefined): AuditoriaRef | null {
  if (!consecutivo) return null
  const c = consecutivo.trim().toUpperCase()
  return AUDITORIA_REFS.find(ref => ref.consecutivos.some(x => x.toUpperCase() === c)) ?? null
}
