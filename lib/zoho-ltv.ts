/**
 * lib/zoho-ltv.ts
 * Fetcher + cache para el view de LTV por cliente en Zoho Analytics.
 * View ID: 245443000009872084 — "DT_SAC_LTV cliente mes histórico"
 */
import { queryZohoView, parseNum } from './zoho-analytics'

export const LTV_VIEW_ID = '245443000009872084'

/* ── Semáforo types ──────────────────────────────────────────────────── */
export type SemaforoKey = 'nuevo' | 'activo' | 'riesgo' | 'inactivo' | 'dormido'

const SEMAFORO_MAP: Record<string, SemaforoKey> = {
  '0 - Factura Futura': 'nuevo',
  '1 - Activo':         'activo',
  '2 - En Riesgo':      'riesgo',
  '3 - Inactivo':       'inactivo',
  '4 - Dormido':        'dormido',
}

/* ── Tenure bucket ───────────────────────────────────────────────────── */
export function calcBucket(meses: number): string {
  if (meses <= 0)  return 'Sin Actividad'
  if (meses <= 3)  return 'Nuevos'
  if (meses <= 6)  return 'Jóvenes'
  if (meses <= 12) return 'Activos'
  if (meses <= 24) return 'Maduros'
  return 'Veteranos'
}

/* ── LTV Row type ────────────────────────────────────────────────────── */
export interface LtvRow {
  id_cliente:                    string
  nombre_cliente:                string
  tamano_empresa:                string
  clasificacion_ltv:             string
  clasificacion_cliente:         string
  segmento_factura:              string
  importe_acumulado_recurrente:  number
  importe_acumulado_bruto:       number
  importe_acumulado_unico:       number
  importe_acumulado_unico_limpio: number
  meses_activo:                  number
  meses_con_factura:             number
  primera_factura:               string   // YYYY-MM-DD
  ultima_factura:                string   // YYYY-MM-DD
  mrr_limpio:                    number
  semaforo_actividad:            string   // "1 - Activo" etc.
  semaforo_key:                  SemaforoKey
  es_one_timer:                  boolean
  mrr_por_mes_facturado:         number
  total_facturas:                number
  total_facturas_100pct_desc:    number
  cohorte_periodo:               string   // "2024-01"
  dias_sin_factura:              number
  ticket_limpio_promedio:        number
  rango_ltv_limpio:              string
  pct_facturas_descontadas:      number
  cohorte_year:                  number
  cohorte_mes:                   number
  rfc:                           string
  correo:                        string
  tenure_bucket:                 string
}

/* ── Parsers ─────────────────────────────────────────────────────────── */
function parseMoney(s: string | undefined): number {
  if (!s) return 0
  const n = parseFloat(s.replace(/[$,\s"]/g, ''))
  return isNaN(n) ? 0 : n
}

const MONTHS: Record<string, string> = {
  Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06',
  Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12',
}

function parseZohoDate(s: string | undefined): string {
  if (!s) return ''
  const parts = s.trim().split(' ')
  if (parts.length === 3) {
    const [d, m, y] = parts
    return `${y}-${MONTHS[m] ?? '01'}-${d.padStart(2, '0')}`
  }
  // fallback: "2026-06" or "2026-06-12"
  return s.slice(0, 10)
}

/* ── Module-level cache (6h TTL) ─────────────────────────────────────── */
let _cache: LtvRow[] | null = null
let _cacheTime = 0
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000

export function invalidateLtvCache() { _cache = null; _cacheTime = 0 }
export function getLtvCacheAge(): number { return _cache ? Date.now() - _cacheTime : -1 }

export async function getLtvRows(): Promise<LtvRow[]> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) return _cache

  const { rows } = await queryZohoView({ viewId: LTV_VIEW_ID })

  _cache = rows.map((r): LtvRow => {
    const mesesActivo  = parseNum(r['meses_activo']) ?? 0
    const semKey       = SEMAFORO_MAP[r['semaforo_actividad'] ?? ''] ?? 'dormido'

    return {
      id_cliente:                    r['id_cliente'] ?? '',
      nombre_cliente:                r['nombre_cliente'] ?? '',
      tamano_empresa:                r['tamano_empresa'] ?? '',
      clasificacion_ltv:             r['clasificacion_ltv'] ?? '',
      clasificacion_cliente:         r['clasificacion_cliente'] ?? '',
      segmento_factura:              r['segmento_factura'] ?? '',
      importe_acumulado_recurrente:  parseMoney(r['importe_acumulado_recurrente']),
      importe_acumulado_bruto:       parseMoney(r['importe_acumulado_bruto']),
      importe_acumulado_unico:       parseMoney(r['importe_acumulado_unico']),
      importe_acumulado_unico_limpio: parseMoney(r['importe_acumulado_unico_limpio']),
      meses_activo:                  mesesActivo,
      meses_con_factura:             parseNum(r['meses_con_factura']) ?? 0,
      primera_factura:               parseZohoDate(r['primera_factura']),
      ultima_factura:                parseZohoDate(r['ultima_factura']),
      mrr_limpio:                    parseMoney(r['mrr_limpio']),
      semaforo_actividad:            r['semaforo_actividad'] ?? '',
      semaforo_key:                  semKey,
      es_one_timer:                  r['es_one_timer'] === 'Yes',
      mrr_por_mes_facturado:         parseNum(r['mrr_por_mes_facturado']) ?? 0,
      total_facturas:                parseNum(r['total_facturas']) ?? 0,
      total_facturas_100pct_desc:    parseNum(r['total_facturas_100pct_desc']) ?? 0,
      cohorte_periodo:               r['cohorte_periodo'] ?? '',
      dias_sin_factura:              parseNum(r['dias_sin_factura']) ?? 0,
      ticket_limpio_promedio:        parseMoney(r['ticket_limpio_promedio']),
      rango_ltv_limpio:              r['rango_ltv_limpio'] ?? '',
      pct_facturas_descontadas:      parseNum(r['pct_facturas_descontadas']) ?? 0,
      cohorte_year:                  parseNum(r['cohorte_year']) ?? 0,
      cohorte_mes:                   parseNum(r['cohorte_mes']) ?? 0,
      rfc:                           r['rfc'] ?? '',
      correo:                        r['correo'] ?? '',
      tenure_bucket:                 calcBucket(mesesActivo),
    }
  })

  _cacheTime = Date.now()
  return _cache!
}
