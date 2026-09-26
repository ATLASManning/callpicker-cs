/**
 * Cortes de facturación POR CUENTA para consumo server-side (Atlas IA).
 * Lee data/cortes-facturacion.xlsx con caché de módulo (mismo TTL que
 * /api/cortes) — fuente viva, nunca columnas guardadas.
 */
import path from 'path'
import { baseMinutos, type OrigenBase } from '@/lib/plan-minutos'

export interface CorteCuenta {
  mes: string; plan: string; incl: number; cons: number; pct: number; monto: number; uso: string
  /**
   * Minutos reales del plan y de dónde salen. En los planes por extensiones la
   * columna «Minutos Incluidos» del archivo trae 1, no minutos: `base` aplica
   * la regla de 1,500 por extensión. Ver lib/plan-minutos.ts.
   * `pct` se recalcula contra `base`; el % del archivo no se usa.
   */
  base: number | null; extensiones: number | null; origenBase: OrigenBase
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

/* Carga en vuelo compartida. Sin esto, un Promise.all sobre las 218 cuentas
 * encuentra la caché vacía 218 veces y abre el Excel de 19,230 filas otras
 * tantas. Con esto, la primera llamada carga y las demás esperan la misma
 * promesa. */
let _cargando: Promise<Map<string, CorteCuenta[]>> | null = null

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
  if (_cargando) return _cargando
  _cargando = leerArchivo().finally(() => { _cargando = null })
  return _cargando
}

async function leerArchivo(): Promise<Map<string, CorteCuenta[]>> {
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
    const plan = String(r['Nombre del Plan'] ?? '').trim()
    const incl = num(r['Minutos Incluidos'])
    const cons = num(r['Minutos Consumidos'])
    // El % del archivo NO se usa: en los planes por extensiones divide entre 1
    // y publica cosas como 3,417,300%. Se recalcula contra la base real.
    const b = baseMinutos(plan, incl)
    map.get(cid)!.push({
      mes:   excelSerialToMonth(r['Fecha de corte']),
      plan,
      incl,
      cons,
      pct:   b.base && b.base > 0 ? (100 * cons) / b.base : 0,
      base:  b.base, extensiones: b.extensiones, origenBase: b.origen,
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

/**
 * TODOS los cortes, por CID. Comparte la misma caché y la misma carga en vuelo
 * que `cortesDeCuenta`, así que pedirlo no abre el Excel una segunda vez.
 *
 * Lo necesita `lib/focos-riesgo.ts`, que razona sobre la cartera COMPLETA —«qué
 * cuentas desaparecieron del último corte» no se puede contestar cuenta por
 * cuenta, hace falta ver el conjunto.
 */
export async function todosLosCortes(): Promise<Map<string, CorteCuenta[]>> {
  return loadMap()
}

/** El mes del corte más reciente que hay en el archivo, o '' si no hay ninguno. */
export async function ultimoMesDeCorte(): Promise<string> {
  const map = await loadMap()
  let max = ''
  for (const arr of Array.from(map.values())) {
    const m = arr.length ? arr[arr.length - 1].mes : ''
    if (m > max) max = m
  }
  return max
}
