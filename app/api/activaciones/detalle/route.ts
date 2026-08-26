import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export const dynamic = 'force-dynamic'

/**
 * Ficha completa de un cliente del Tablero de Activaciones 2.0.
 *
 * Devuelve TODAS las columnas del archivo (data/activaciones.xlsx) para los
 * registros que coincidan por CID (columna ID) o por nombre de cliente. Se
 * construye genéricamente desde la fila de encabezados: si el archivo gana o
 * cambia columnas, la ficha las refleja sin tocar código.
 *
 * La página no incrusta estos detalles en el HTML inicial a propósito: los
 * comentarios de encuesta de 2,600 registros pesarían cientos de KB. Se piden
 * bajo demanda al seleccionar un cliente.
 */

interface CampoValor { campo: string; valor: string }
interface RegistroDetalle { cid: string; cliente: string; campos: CampoValor[] }

let _cache: { headers: string[]; filas: unknown[][] } | null = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

function excelSerialToISO(serial: number): string {
  const epoch = new Date(Date.UTC(1899, 11, 30))
  return new Date(epoch.getTime() + serial * 86400000).toISOString().split('T')[0]
}

/** Columnas cuyo valor numérico es una fecha serial de Excel. */
const COLS_FECHA = new Set([
  'fecha 1er pago', 'apertura ticket', 'arranque de proceso', 'cierre ticket',
])

function fmtValor(campo: string, v: unknown): string {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().split('T')[0]
  if (typeof v === 'number') {
    if (COLS_FECHA.has(campo.trim().toLowerCase()) && v > 40000 && v < 60000) {
      return excelSerialToISO(v)
    }
    return Number.isInteger(v) ? String(v) : v.toFixed(2)
  }
  return String(v).trim()
}

const norm = (s: string) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

async function loadMatriz() {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache
  const xlsx = (await import('xlsx')).default
  const fs   = (await import('fs')).default
  const filePath = path.join(process.cwd(), 'data', 'activaciones.xlsx')
  if (!fs.existsSync(filePath)) return null

  const wb = xlsx.readFile(filePath, { cellDates: true })
  const ws = wb.Sheets['Hoja1']
  if (!ws) return null

  const matriz: unknown[][] = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null })
  const headersRaw = (matriz[0] ?? []) as unknown[]
  // Encabezados duplicados ("Apertura Ticket" aparece dos veces) se numeran
  // para no perder columnas; los vacíos se marcan por posición.
  const vistos = new Map<string, number>()
  const headers = headersRaw.map((h, i) => {
    const base = h == null || String(h).trim() === '' ? `Columna ${i + 1}` : String(h).trim()
    const n = (vistos.get(base) ?? 0) + 1
    vistos.set(base, n)
    return n === 1 ? base : `${base} (${n})`
  })

  _cache = { headers, filas: matriz.slice(1) }
  _cacheTime = Date.now()
  return _cache
}

export async function GET(req: NextRequest) {
  try {
    const sp      = req.nextUrl.searchParams
    const cid     = (sp.get('cid') ?? '').trim()
    const cliente = (sp.get('cliente') ?? '').trim()
    if (!cid && !cliente)
      return NextResponse.json({ error: 'Indica cid o cliente' }, { status: 400 })

    const data = await loadMatriz()
    if (!data)
      return NextResponse.json({ error: 'Archivo de activaciones no disponible' }, { status: 404 })

    const { headers, filas } = data
    const idxId      = headers.findIndex(h => h.toLowerCase() === 'id')
    const idxCliente = headers.findIndex(h => h.toLowerCase() === 'cliente')
    const objetivo   = norm(cliente)

    const registros: RegistroDetalle[] = []
    for (const fila of filas) {
      const vId  = fila[idxId]
      const vCli = fila[idxCliente]
      if (vId == null || vCli == null) continue
      const coincide =
        (cid && String(vId).trim() === cid) ||
        (objetivo && norm(String(vCli)) === objetivo)
      if (!coincide) continue

      const campos: CampoValor[] = []
      headers.forEach((h, i) => {
        const valor = fmtValor(h, fila[i])
        if (valor !== '') campos.push({ campo: h, valor })
      })
      registros.push({ cid: String(vId).trim(), cliente: String(vCli).trim(), campos })
      if (registros.length >= 20) break // un cliente con 20+ altas es un error de captura
    }

    return NextResponse.json({ registros, total: registros.length, columnasArchivo: headers.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
