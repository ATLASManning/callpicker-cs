import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export const dynamic = 'force-dynamic'

/* ── Tipos ─────────────────────────────────────────────────────────────────── */
interface CorteRow {
  cid:            string
  cliente:        string
  fechaCorte:     string   // "YYYY-MM" para agrupar
  fechaCorteISO:  string   // "YYYY-MM-DD"
  periodo:        string   // "2025-11-09 - 2025-12-08"
  plan:           string
  minutosIncl:    number
  minutosConsum:  number
  monto:          number
  pctConsumo:     number
  extIlimitadas:  string
  clasificacion:  string
  pctEntrantes:   number
  pctSalientes:   number
  usoPrincipal:   string
  eventosAnal:    string
  totalInteracc:  number
}

/* ── Caché en memoria ──────────────────────────────────────────────────────── */
let _cache: CorteRow[] | null = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

function excelSerialToISO(serial: number): string {
  if (!serial || typeof serial !== 'number') return ''
  const epoch = new Date(Date.UTC(1899, 11, 30))
  const date  = new Date(epoch.getTime() + serial * 86400000)
  return date.toISOString().split('T')[0]
}

function excelSerialToMonth(serial: number): string {
  const iso = excelSerialToISO(serial)
  if (!iso) return ''
  return iso.slice(0, 7) // "YYYY-MM"
}

async function loadData(): Promise<CorteRow[]> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache

  const xlsx = (await import('xlsx')).default
  const fs   = (await import('fs')).default
  const filePath = path.join(process.cwd(), 'data', 'cortes-facturacion.xlsx')

  if (!fs.existsSync(filePath)) {
    console.warn('[cortes] Excel no encontrado en', filePath)
    return []
  }

  const wb  = xlsx.readFile(filePath)
  const ws  = wb.Sheets[wb.SheetNames[0]]
  const raw: Record<string, unknown>[] = xlsx.utils.sheet_to_json(ws, { defval: '' })

  const toNum = (v: unknown) => typeof v === 'number' ? v : parseFloat(String(v)) || 0
  const toStr = (v: unknown) => String(v ?? '').trim()

  _cache = raw
    .filter(r => r['CID'] && r['Nombre del Cliente'])
    .map(r => {
      const serial  = toNum(r['Fecha de corte'])
      const iso     = excelSerialToISO(serial)
      const mes     = excelSerialToMonth(serial)
      return {
        cid:           toStr(r['CID']),
        cliente:       toStr(r['Nombre del Cliente']),
        fechaCorte:    mes,
        fechaCorteISO: iso,
        periodo:       toStr(r['Periodo']),
        plan:          toStr(r['Nombre del Plan']),
        minutosIncl:   toNum(r['Minutos Incluidos']),
        minutosConsum: toNum(r['Minutos Consumidos']),
        monto:         toNum(r['Monto del plan']),
        pctConsumo:    toNum(r['% Consumo']),
        extIlimitadas: toStr(r['Extensiones ilimitadas']),
        clasificacion: toStr(r['Clasificación de empresa']),
        pctEntrantes:  toNum(r['% Llamadas entrantes']),
        pctSalientes:  toNum(r['% Llamadas salientes']),
        usoPrincipal:  toStr(r['Uso Principal de llamadas']),
        eventosAnal:   toStr(r['Eventos analizados']),
        totalInteracc: toNum(r['Total de interacciones']),
      }
    })

  _cacheTime = Date.now()
  return _cache!
}

/* ── Helpers de filtrado ───────────────────────────────────────────────────── */
function applyFilters(rows: CorteRow[], params: URLSearchParams): CorteRow[] {
  let data = rows
  const fecha = params.get('fecha')
  const plan  = params.get('plan')
  const clas  = params.get('clas')
  const uso   = params.get('uso')
  const q     = params.get('q')?.toLowerCase()

  if (fecha) data = data.filter(r => r.fechaCorte === fecha)
  if (plan)  data = data.filter(r => r.plan === plan)
  if (clas)  data = data.filter(r => r.clasificacion === clas)
  if (uso)   data = data.filter(r => r.usoPrincipal === uso)
  if (q)     data = data.filter(r => r.cliente.toLowerCase().includes(q) || r.cid.includes(q))

  return data
}

/* ── GET handler ───────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const allData = await loadData()
    const params  = req.nextUrl.searchParams
    const mode    = params.get('mode') ?? 'stats'

    /* ── Filtros disponibles ─────────────────────────────────────────── */
    if (mode === 'filters') {
      const fechas  = Array.from(new Set(allData.map(r => r.fechaCorte))).filter(Boolean).sort().reverse()
      const planes  = Array.from(new Set(allData.map(r => r.plan))).filter(Boolean).sort()
      const clases  = Array.from(new Set(allData.map(r => r.clasificacion))).filter(Boolean).sort()
      const usos    = Array.from(new Set(allData.map(r => r.usoPrincipal))).filter(Boolean).sort()
      return NextResponse.json({ fechas, planes, clases, usos })
    }

    /* ── Por CID (panel cuentas) ─────────────────────────────────────── */
    if (mode === 'by-cid') {
      const cid    = params.get('cid') ?? ''
      const nombre = params.get('nombre') ?? ''
      const rows   = allData.filter(r =>
        (cid && r.cid === cid) || (!cid && nombre && r.cliente.toLowerCase().includes(nombre.toLowerCase()))
      )
      const byMes = rows.reduce<Record<string, { count: number; monto: number; consumo: number; min: number; minC: number }>>((acc, r) => {
        if (!acc[r.fechaCorte]) acc[r.fechaCorte] = { count: 0, monto: 0, consumo: 0, min: 0, minC: 0 }
        acc[r.fechaCorte].count++
        acc[r.fechaCorte].monto   += r.monto
        acc[r.fechaCorte].consumo += r.pctConsumo
        acc[r.fechaCorte].min     += r.minutosIncl
        acc[r.fechaCorte].minC    += r.minutosConsum
        return acc
      }, {})
      return NextResponse.json({ rows: rows.slice(0, 24), byMes, total: rows.length })
    }

    /* ── Stats / KPIs + gráficas ─────────────────────────────────────── */
    if (mode === 'stats') {
      const data = applyFilters(allData, params)
      if (!data.length) return NextResponse.json({ total: 0 })

      const totalMonto    = data.reduce((s, r) => s + r.monto, 0)
      const avgConsumo    = data.reduce((s, r) => s + r.pctConsumo, 0) / data.length
      const sinConsumo    = data.filter(r => r.pctConsumo === 0).length
      const conEventos    = data.filter(r => r.eventosAnal === 'Si').length

      // Por plan
      const byPlan: Record<string, { count: number; monto: number; consumo: number }> = {}
      for (const r of data) {
        if (!byPlan[r.plan]) byPlan[r.plan] = { count: 0, monto: 0, consumo: 0 }
        byPlan[r.plan].count++
        byPlan[r.plan].monto   += r.monto
        byPlan[r.plan].consumo += r.pctConsumo
      }

      // Por clasificacion
      const byClas: Record<string, { count: number; monto: number }> = {}
      for (const r of data) {
        if (!byClas[r.clasificacion]) byClas[r.clasificacion] = { count: 0, monto: 0 }
        byClas[r.clasificacion].count++
        byClas[r.clasificacion].monto += r.monto
      }

      // Por uso principal
      const byUso: Record<string, number> = {}
      for (const r of data) {
        byUso[r.usoPrincipal] = (byUso[r.usoPrincipal] ?? 0) + 1
      }

      // Distribución consumo (rangos 0-20, 21-40, 41-60, 61-80, 81-100, >100)
      const zonas: Record<string, number> = {
        '0%': 0, '1-20%': 0, '21-40%': 0, '41-60%': 0,
        '61-80%': 0, '81-100%': 0, '>100%': 0,
      }
      for (const r of data) {
        const p = r.pctConsumo
        if (p === 0)        zonas['0%']++
        else if (p <= 20)   zonas['1-20%']++
        else if (p <= 40)   zonas['21-40%']++
        else if (p <= 60)   zonas['41-60%']++
        else if (p <= 80)   zonas['61-80%']++
        else if (p <= 100)  zonas['81-100%']++
        else                zonas['>100%']++
      }

      // Tendencia por mes (solo si no hay filtro de fecha)
      const byMes: Record<string, { count: number; monto: number; consumo: number }> = {}
      for (const r of allData) {
        if (!byMes[r.fechaCorte]) byMes[r.fechaCorte] = { count: 0, monto: 0, consumo: 0 }
        byMes[r.fechaCorte].count++
        byMes[r.fechaCorte].monto   += r.monto
        byMes[r.fechaCorte].consumo += r.pctConsumo
      }

      return NextResponse.json({
        total: data.length, totalMonto, avgConsumo, sinConsumo, conEventos,
        byPlan, byClas, byUso, zonas, byMes,
      })
    }

    /* ── Lista paginada ──────────────────────────────────────────────── */
    if (mode === 'list') {
      const data = applyFilters(allData, params)
      const page = parseInt(params.get('page') ?? '1')
      const size = parseInt(params.get('size') ?? '30')
      const start = (page - 1) * size
      return NextResponse.json({
        total: data.length,
        page, size,
        rows: data.slice(start, start + size),
      })
    }

    return NextResponse.json({ error: 'mode inválido' }, { status: 400 })

  } catch (e: unknown) {
    console.error('[cortes]', e)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}
