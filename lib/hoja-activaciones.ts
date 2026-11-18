import path from 'path'
import { normCol, fechaDeHoja, type FilaHoja } from '@/lib/entrega-apartados'

/**
 * LA HOJA DE ACTIVACIONES 2.0, LEÍDA UNA SOLA VEZ Y EN UN SOLO SITIO
 * ===================================================================
 *
 * `data/activaciones.xlsx` lo mantiene Activaciones y **no se toca**. Esto sólo
 * lo lee, y lo lee igual para todos los que lo necesiten: el expediente de una
 * activación y el buscador que tiene que alcanzarlas todas.
 *
 * Vive aquí y no dentro de una ruta porque las reglas de lectura no son
 * triviales y **copiarlas es perderlas**:
 *
 *   - **Una activación por ID.** Hay filas que comparten ID —el mismo cliente
 *     apuntado dos veces, una a medio capturar— y se queda la más completa.
 *   - **Encabezados repetidos**: `Apertura Ticket` y `Cierre Ticket` salen dos
 *     veces; se usa la primera aparición.
 *   - **Las fechas vienen en dos formatos**: 1,907 como fecha de verdad y 839
 *     como texto en inglés («21-Aug-2023»). Se normalizan a ISO.
 *
 * Si una ruta se trajera su propia copia de esto, el día que la hoja cambie una
 * de las dos seguiría leyendo a su manera y nadie se enteraría.
 */

const COLS_FECHA = new Set([
  'fecha1erpago', 'aperturaticket', 'arranquedeproceso', 'cierreticket',
])

function excelSerialToISO(serial: number): string {
  const epoch = new Date(Date.UTC(1899, 11, 30))
  return new Date(epoch.getTime() + serial * 86400000).toISOString().split('T')[0]
}

export function fmtCelda(col: string, v: unknown): string {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().split('T')[0]
  if (typeof v === 'number') {
    if (COLS_FECHA.has(col) && v > 40000 && v < 60000) return excelSerialToISO(v)
    return Number.isInteger(v) ? String(v) : v.toFixed(2)
  }
  const s = String(v).trim()
  return COLS_FECHA.has(col) ? fechaDeHoja(s) : s
}

let _cache: { filas: Map<string, FilaHoja> } | null = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

/** Todas las activaciones de la hoja, por ID. `null` si el archivo no está. */
export async function cargaHoja(): Promise<{ filas: Map<string, FilaHoja> } | null> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache
  const xlsx = (await import('xlsx')).default
  const fs   = (await import('fs')).default
  const ruta = path.join(process.cwd(), 'data', 'activaciones.xlsx')
  if (!fs.existsSync(ruta)) return null
  const wb = xlsx.readFile(ruta, { cellDates: true })
  const ws = wb.Sheets['Hoja1']
  if (!ws) return null

  const matriz: unknown[][] = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null })
  const headers = ((matriz[0] ?? []) as unknown[]).map((h, i) =>
    h == null || String(h).trim() === '' ? `Columna ${i + 1}` : String(h).trim())

  const filas = new Map<string, FilaHoja>()
  const llenas = (f: FilaHoja) => Object.values(f).filter(v => v !== '').length
  for (const arr of matriz.slice(1)) {
    const fila: FilaHoja = {}
    headers.forEach((h, i) => {
      const n = normCol(h)
      if (!(n in fila)) fila[n] = fmtCelda(n, arr[i])
    })
    const id = fila['id']
    if (!id || !fila['cliente']) continue
    const previa = filas.get(id)
    if (!previa || llenas(fila) > llenas(previa)) filas.set(id, fila)
  }
  _cache = { filas }
  _cacheTime = Date.now()
  return _cache
}

/** Sin acentos, sin puntuación y en minúsculas, para buscar por nombre. */
export function normBusqueda(s: string): string {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim()
}
