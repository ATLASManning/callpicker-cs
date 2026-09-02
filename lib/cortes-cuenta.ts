/**
 * Cortes de facturación POR CUENTA para consumo server-side (Atlas IA).
 * Lee data/cortes-facturacion.xlsx con caché de módulo (mismo TTL que
 * /api/cortes) — fuente viva, nunca columnas guardadas.
 */
import path from 'path'

export interface CorteCuenta {
  mes: string; plan: string; incl: number; cons: number; pct: number; monto: number; uso: string
  /** Suma de visitas a las secciones del panel en ese corte. */
  panel: number
  /** Visitas a la sección Desarrolladores (señal de integración API). */
  desarrolladores: number
  /** 1 cuando el cobro automático fue exitoso en el periodo. */
  pagoExitoso: number
}

/** Columnas del panel que se suman para medir uso del administrador. */
const COLS_PANEL = [
  'Menú Configuracion', 'Reportes', 'Call History',
  'Visit Inbound', 'Visit Outbound', 'My extension',
] as const

let _cache: Map<string, CorteCuenta[]> | null = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

function excelSerialToMonth(v: unknown): string {
  if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000)
    return d.toISOString().slice(0, 7)
  }
  if (v instanceof Date) return v.toISOString().slice(0, 7)
  return String(v ?? '').slice(0, 7)
}

async function loadMap(): Promise<Map<string, CorteCuenta[]>> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache
  const xlsx = (await import('xlsx')).default
  const fs   = (await import('fs')).default
  const filePath = path.join(process.cwd(), 'data', 'cortes-facturacion.xlsx')
  const map = new Map<string, CorteCuenta[]>()
  if (!fs.existsSync(filePath)) { _cache = map; _cacheTime = Date.now(); return map }

  const wb  = xlsx.readFile(filePath)
  const ws  = wb.Sheets[wb.SheetNames[0]]
  const raw: Record<string, unknown>[] = xlsx.utils.sheet_to_json(ws, { defval: '' })
  const num = (v: unknown) => typeof v === 'number' ? v : parseFloat(String(v)) || 0

  for (const r of raw) {
    const cid = String(r['CID'] ?? '').trim()
    if (!cid) continue
    if (!map.has(cid)) map.set(cid, [])
    map.get(cid)!.push({
      mes:   excelSerialToMonth(r['Fecha de corte']),
      plan:  String(r['Nombre del Plan'] ?? '').trim(),
      incl:  num(r['Minutos Incluidos']),
      cons:  num(r['Minutos Consumidos']),
      pct:   num(r['% Consumo']),
      monto: num(r['Monto del plan']),
      uso:   String(r['Uso Principal de llamadas'] ?? '').trim(),
      panel: COLS_PANEL.reduce((s, c) => s + num(r[c]), 0),
      desarrolladores: num(r['Desarrolladores']),
      pagoExitoso:     num(r['Pago exitoso']),
    })
  }
  for (const arr of map.values()) arr.sort((a, b) => a.mes.localeCompare(b.mes))
  _cache = map; _cacheTime = Date.now()
  return map
}

/** Últimos `n` cortes de la cuenta (por CID), más antiguo → más reciente. */
export async function cortesDeCuenta(cid: string | null | undefined, n = 4): Promise<CorteCuenta[]> {
  if (!cid?.trim()) return []
  const map = await loadMap()
  const arr = map.get(cid.trim()) ?? []
  return arr.slice(-n)
}
