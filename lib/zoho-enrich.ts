/**
 * lib/zoho-enrich.ts
 * Enriquecimiento de cuentas con MRR y Factura Mensual en vivo desde Zoho Analytics.
 *
 * Fuente única de verdad para los datos de facturación que se muestran en
 * los módulos Facturación, Cuentas y Asesores:
 *   · Factura Mensual = "Ticket Limpio Promedio"  (ticket_limpio_promedio)
 *   · MRR             = "MRR Limpio"               (mrr_limpio)
 *
 * Cache en memoria de 15 min compartido por todos los consumidores.
 */
import { queryZohoView, parseNum, isZohoConfigured } from '@/lib/zoho-analytics'

export interface ZohoAcct { mrr: number; factura_mensual: number; semaforo: string; segmento: string }

const SEG_RANK: Record<string, number> = { Enterprise: 5, Large: 4, 'Mid-Market': 3, SMB: 2, Micro: 1 }

const ZOHO_TTL = 15 * 60 * 1000
let _zohoCache: { map: Record<string, ZohoAcct>; ts: number } | null = null

function normStr(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

/** Mapa { nombre normalizado → { mrr, factura_mensual, semaforo } } agregando subcuentas por nombre. */
export async function getZohoMap(): Promise<Record<string, ZohoAcct>> {
  if (_zohoCache && Date.now() - _zohoCache.ts < ZOHO_TTL) return _zohoCache.map
  if (!isZohoConfigured()) return {}
  try {
    const viewId = process.env.ZOHO_VIEW_ID_FACTURACION!
    const result = await queryZohoView({ viewId })
    const map: Record<string, ZohoAcct> = {}
    for (const row of result.rows) {
      const sema = row['semaforo_actividad'] ?? ''
      const seg  = row['segmento_factura']   ?? ''
      const name = normStr(row['nombre_cliente'] ?? '')
      if (!name) continue
      // Registrar semáforo para todas las filas (incluyendo dormidas)
      if (!map[name]) map[name] = { mrr: 0, factura_mensual: 0, semaforo: sema, segmento: seg }
      // Acumular segmento más alto (Enterprise > Large > Mid-Market > SMB > Micro)
      if ((SEG_RANK[seg] ?? 0) > (SEG_RANK[map[name].segmento] ?? 0)) map[name].segmento = seg
      if (sema !== '4 - Dormido') {
        // Solo acumular MRR en filas activas — conserva la suma original de Facturación
        const mrr     = parseNum(row['mrr_limpio']?.replace(/[$,]/g, '')) ?? 0
        const factura = parseNum(row['ticket_limpio_promedio']?.replace(/[$,]/g, '')) ?? 0
        map[name].mrr            += mrr
        map[name].factura_mensual += factura
        map[name].semaforo = sema   // semáforo activo prevalece
      }
    }
    _zohoCache = { map, ts: Date.now() }
    return map
  } catch {
    return {}
  }
}

/**
 * Genera las siglas de un nombre normalizado (e.g. "grupo torres corzo" → "gtc").
 * Solo considera palabras de ≥3 chars para descartar partículas ("de", "la", "sa"…).
 */
function getAcronym(n: string): string {
  return n.split(/\s+/).filter(w => w.length >= 3).map(w => w[0]).join('')
}

/**
 * Busca y SUMA todas las subcuentas de Zoho que correspondan a la misma cuenta.
 *
 * Ejecuta AMBAS estrategias y combina los resultados (sin retornar temprano):
 *  1. Primeras 2 palabras significativas (≥3 chars): cubre "Grupo Frisa - ACISA", etc.
 *  2. Siglas (≥3 letras) como primera palabra: cubre "GTC - MATEHUALA", "GTC - BMW", etc.
 *     Necesario porque "Grupo Torres Corzo - GTC" es dormido en Zoho ($0), pero las
 *     subcuentas activas viven bajo prefijo "GTC".
 *  3. Fallback exact key.
 */
export function lookupZoho(empresa: string, zmap: Record<string, ZohoAcct>): ZohoAcct | null {
  const n = normStr(empresa)
  const words    = n.split(/\s+/).filter(w => w.length >= 3).slice(0, 2)
  const acronym  = getAcronym(n)

  // Colectar todas las claves que coincidan por cualquiera de las dos estrategias
  const matched = new Set<string>()
  for (const key of Object.keys(zmap)) {
    const byWords   = words.length > 0 && words.every(w => key.includes(w))
    const byAcronym = acronym.length >= 3 && key.split(/\s+/)[0] === acronym
    if (byWords || byAcronym) matched.add(key)
  }

  if (matched.size > 0) {
    let mrr = 0, factura_mensual = 0, semaforo = '4 - Dormido', segmento = ''
    for (const key of Array.from(matched)) {
      const val = zmap[key]
      mrr            += val.mrr
      factura_mensual += val.factura_mensual
      if (val.semaforo && val.semaforo !== '4 - Dormido') semaforo = val.semaforo
      if ((SEG_RANK[val.segmento] ?? 0) > (SEG_RANK[segmento] ?? 0)) segmento = val.segmento
    }
    return { mrr, factura_mensual, semaforo, segmento }
  }

  // Fallback exact key
  return zmap[n] ? { ...zmap[n] } : null
}

/** Devuelve las cuentas con `mrr_zoho`, `factura_mensual_zoho` y `semaforo_zoho` desde Zoho. */
export async function enrichCuentasWithZoho<T extends { empresa: string }>(
  cuentas: T[],
): Promise<(T & { mrr_zoho: number | null; factura_mensual_zoho: number | null; semaforo_zoho: string | null })[]> {
  const zmap = await getZohoMap()
  return cuentas.map(c => {
    const z = lookupZoho(c.empresa, zmap)
    return {
      ...c,
      mrr_zoho:             z?.mrr             ?? null,
      factura_mensual_zoho: z?.factura_mensual ?? null,
      semaforo_zoho:        z?.semaforo        ?? null,
    }
  })
}
