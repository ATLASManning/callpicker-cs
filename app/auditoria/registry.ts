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
  // ── Fátima ────────────────────────────────────────────────────────────────
  { id: 'arkansas',        nombre: 'Arkansas State University (ASUQ)', consecutivos: ['F45'] },
  { id: 'finsus',          nombre: 'FINSUS – Economía Móvil',          consecutivos: ['F1']  },
  { id: 'grupofrisa',      nombre: 'Grupo FRISA / ACISA',              consecutivos: ['F16'] },
  { id: 'samalab',         nombre: 'SAMALAB',                          consecutivos: ['F14'] },
  { id: 'azyco',           nombre: 'Azyco Guadalajara',                consecutivos: ['F6']  },
  { id: 'polak-grupo',     nombre: 'Polak Grupo',                      consecutivos: ['F5']  },
  { id: 'pubsa',           nombre: 'Publicidad en Buscadores (AdCentral)', consecutivos: ['F17'] },
  // ── Claudia ───────────────────────────────────────────────────────────────
  { id: 'agua-inmaculada', nombre: 'Agua Inmaculada',                  consecutivos: ['C17'] },
  { id: 'labsus',          nombre: 'LABSUS Centro Diagnóstico',        consecutivos: ['C37'] },
  { id: 'brandgroup',      nombre: 'Brand-Kern-Liebers México (Brandgroup)', consecutivos: ['C15'] },
  { id: 'clickbalance',    nombre: 'ClickBalance ERP',                 consecutivos: ['C43'] },
  { id: 'elerybrands',     nombre: 'Elery Brands · Clínicas del Hombre', consecutivos: ['C22'] },
  { id: 'alternet',        nombre: 'ALTERNET',                         consecutivos: ['C10'] },
  { id: 'hospital-santa-rosa', nombre: 'Hospital Santa Rosa',          consecutivos: ['C4']  },
  { id: 'travelling',      nombre: 'Travelling / Grupo Mundo Joven',   consecutivos: ['C16'] },
  { id: 'dental-district', nombre: 'Dental District',                  consecutivos: ['Z54'] },
  // ── Dan ───────────────────────────────────────────────────────────────────
  { id: 'salud-y-hogar',   nombre: 'Salud y Hogar',                    consecutivos: ['D3']  },
  { id: 'cintascove',      nombre: 'Cintas Cove S.A. de C.V.',         consecutivos: ['D14'] },
  { id: 'alianza',         nombre: 'Alianza Multimarca',               consecutivos: ['D4']  },
  { id: 'medicall-expert', nombre: 'Medicall Expert',                  consecutivos: ['C31'] },
  { id: 'vaeo-business-club', nombre: 'VAEO Business Club',           consecutivos: ['C51'] },
  { id: 'kombitec',           nombre: 'KOMBITEC S.A. DE C.V.',        consecutivos: ['D22'] },
  { id: 'neruc-sede-central', nombre: 'NERUC Sede Central',            consecutivos: ['C9']  },
]

/** Devuelve la auditoría asociada a un consecutivo de cuenta, o null si no existe. */
export function findAuditoriaForConsecutivo(consecutivo: string | null | undefined): AuditoriaRef | null {
  if (!consecutivo) return null
  const c = consecutivo.trim().toUpperCase()
  return AUDITORIA_REFS.find(ref => ref.consecutivos.some(x => x.toUpperCase() === c)) ?? null
}
