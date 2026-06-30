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

export interface ZohoAcct { mrr: number; factura_mensual: number; semaforo: string }

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
      const name = normStr(row['nombre_cliente'] ?? '')
      if (!name) continue
      const mrr     = parseNum(row['mrr_limpio']?.replace(/[$,]/g, '')) ?? 0
      const factura = parseNum(row['ticket_limpio_promedio']?.replace(/[$,]/g, '')) ?? 0
      if (!map[name]) map[name] = { mrr: 0, factura_mensual: 0, semaforo: sema }
      // Acumular MRR/factura para TODAS las filas (dormidas y activas)
      map[name].mrr            += mrr
      map[name].factura_mensual += factura
      // Semáforo activo prevalece sobre dormido (subcuenta activa salva a la cuenta)
      if (sema !== '4 - Dormido') map[name].semaforo = sema
    }
    _zohoCache = { map, ts: Date.now() }
    return map
  } catch {
    return {}
  }
}

/**
 * Busca y SUMA todas las subcuentas de Zoho que correspondan a la misma cuenta.
 * Usa las primeras 2 palabras significativas (≥3 chars) como clave de agrupación,
 * lo que garantiza que "Grupo Frisa" + "Grupo Frisa - ACISA" se sumen correctamente.
 * El match exacto siempre queda incluido (sus palabras están dentro del propio key).
 */
export function lookupZoho(empresa: string, zmap: Record<string, ZohoAcct>): ZohoAcct | null {
  const n = normStr(empresa)
  const words = n.split(/\s+/).filter(w => w.length >= 3).slice(0, 2)

  if (words.length > 0) {
    let mrr = 0, factura_mensual = 0, semaforo = '4 - Dormido', found = false
    for (const [key, val] of Object.entries(zmap)) {
      if (words.every(w => key.includes(w))) {
        mrr            += val.mrr
        factura_mensual += val.factura_mensual
        found = true
        // Cualquier semáforo activo gana sobre dormido
        if (val.semaforo && val.semaforo !== '4 - Dormido') semaforo = val.semaforo
      }
    }
    if (found) return { mrr, factura_mensual, semaforo }
  }

  // Fallback para nombres sin palabras significativas de ≥3 chars
  return zmap[n] ?? null
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
