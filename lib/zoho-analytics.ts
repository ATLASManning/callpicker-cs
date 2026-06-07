/**
 * lib/zoho-analytics.ts
 * Cliente OAuth2 para Zoho Analytics API v2
 * Credenciales via env vars — nunca exponer en frontend
 */

/* ── Configuración ─────────────────────────────────────────────────── */
const ZOHO_TOKEN_URL    = 'https://accounts.zoho.com/oauth/v2/token'
const ZOHO_API_BASE     = 'https://analyticsapi.zoho.com/restapi/v2'

export interface ZohoConfig {
  clientId:     string
  clientSecret: string
  refreshToken: string
  orgId:        string
  workspaceId:  string
}

export interface ZohoQueryOptions {
  viewId:          string
  criteria?:       string          // ej. "\"Tabla\".\"CID\"='12345'"
  selectedColumns?: string[]
  maxRows?:        number
}

interface ZohoTokenCache {
  accessToken: string
  expiresAt:   number             // ms timestamp
}

/* ── Cache de token en memoria ─────────────────────────────────────── */
let _tokenCache: ZohoTokenCache | null = null

export function getZohoConfig(): ZohoConfig | null {
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORG_ID, ZOHO_WORKSPACE_ID } = process.env
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN || !ZOHO_ORG_ID || !ZOHO_WORKSPACE_ID) {
    return null
  }
  return {
    clientId:     ZOHO_CLIENT_ID,
    clientSecret: ZOHO_CLIENT_SECRET,
    refreshToken: ZOHO_REFRESH_TOKEN,
    orgId:        ZOHO_ORG_ID,
    workspaceId:  ZOHO_WORKSPACE_ID,
  }
}

export function isZohoConfigured(): boolean {
  return getZohoConfig() !== null
}

/* ── Obtener / renovar access token ────────────────────────────────── */
export async function getAccessToken(cfg: ZohoConfig): Promise<string> {
  const now = Date.now()
  // Retornar token cacheado si aún es válido (con 60s de margen)
  if (_tokenCache && _tokenCache.expiresAt - 60_000 > now) {
    return _tokenCache.accessToken
  }

  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    client_id:     cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: cfg.refreshToken,
  })

  const res = await fetch(ZOHO_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Zoho token refresh failed (${res.status}): ${text}`)
  }

  const json = await res.json() as { access_token?: string; expires_in?: number; error?: string }

  if (json.error || !json.access_token) {
    throw new Error(`Zoho token error: ${json.error ?? 'no access_token'}`)
  }

  const expiresIn = json.expires_in ?? 3600
  _tokenCache = {
    accessToken: json.access_token,
    expiresAt:   now + expiresIn * 1000,
  }

  return _tokenCache.accessToken
}

/* ── Tipo de respuesta Zoho ─────────────────────────────────────────── */
export interface ZohoViewData {
  columns: string[]
  rows:    Record<string, string>[]
}

/* ── Consultar una vista de Zoho Analytics ─────────────────────────── */
export async function queryZohoView(opts: ZohoQueryOptions): Promise<ZohoViewData> {
  const cfg = getZohoConfig()
  if (!cfg) throw new Error('Zoho Analytics no está configurado. Revisa las variables de entorno.')

  const token = await getAccessToken(cfg)

  const config: Record<string, unknown> = { responseFormat: 'json' }
  if (opts.criteria)        config.criteria        = opts.criteria
  if (opts.selectedColumns) config.selectedColumns = opts.selectedColumns
  if (opts.maxRows)         config.maxRows         = opts.maxRows

  const url = new URL(`${ZOHO_API_BASE}/workspaces/${cfg.workspaceId}/views/${opts.viewId}/data`)
  url.searchParams.set('CONFIG', JSON.stringify(config))

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization':   `Zoho-oauthtoken ${token}`,
      'ZANALYTICS-ORGID': cfg.orgId,
    },
    // Next.js: no cachear en Vercel Edge — siempre frescos
    cache: 'no-store',
  })

  if (res.status === 401) {
    // Limpiar cache y reintentar una vez
    _tokenCache = null
    return queryZohoView(opts)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Zoho Analytics query failed (${res.status}): ${text}`)
  }

  const json = await res.json()

  // Estructura Zoho v2: { data: { columns: [...], rows: [[...], ...] } }
  const data = json?.data
  if (!data) throw new Error('Respuesta inesperada de Zoho Analytics')

  const columns: string[] = data.columns ?? []

  // Las filas pueden venir como array de arrays o array de objetos
  const rawRows: unknown[] = data.rows ?? []
  let rows: Record<string, string>[]

  if (rawRows.length === 0) {
    rows = []
  } else if (Array.isArray(rawRows[0])) {
    // Array de arrays → convertir a objetos
    rows = (rawRows as string[][]).map(row => {
      const obj: Record<string, string> = {}
      columns.forEach((col, i) => { obj[col] = row[i] ?? '' })
      return obj
    })
  } else {
    rows = rawRows as Record<string, string>[]
  }

  return { columns, rows }
}

/* ── Consulta con filtro por criterio simple ─────────────────────────── */
export async function queryZohoViewFiltered(
  viewId: string,
  tableName: string,
  columnName: string,
  value: string,
): Promise<ZohoViewData> {
  return queryZohoView({
    viewId,
    criteria: `"${tableName}"."${columnName}"='${value}'`,
  })
}

/* ── Helper: parsear número desde string Zoho ────────────────────────── */
export function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(/,/g, ''))
  return isNaN(n) ? null : n
}
