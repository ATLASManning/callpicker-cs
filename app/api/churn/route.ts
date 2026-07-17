import { NextRequest, NextResponse } from 'next/server'
import { isZohoConfigured, queryZohoView, parseNum } from '@/lib/zoho-analytics'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

const CHURN_VIEW_ID = process.env.ZOHO_VIEW_ID_CHURN_DETAIL ?? '245443000011222902'
const FACT_VIEW_ID  = process.env.ZOHO_VIEW_ID_FACTURACION  ?? ''

let _cache: { rows: ChurnRow[]; cols: string[]; ts: number } | null = null
const TTL = 15 * 60 * 1000

const MESES_H1 = ['Enero','Febrero','Marzo','Abril','Mayo','Junio']
const MESES_ORDER: Record<string, number> = {
  Enero:1, Febrero:2, Marzo:3, Abril:4, Mayo:5, Junio:6,
  Julio:7, Agosto:8, Septiembre:9, Octubre:10, Noviembre:11, Diciembre:12,
}

export interface ChurnRow {
  mes:              string
  cliente:          string
  clasificacion:    string
  fecha:            string
  facturas:         number
  mesesActivo:      number
  importeAcumulado: number
  mrrInicio:        number
  mrrFin:           number
  ingresoPerdido:   number
  ingresoGanado:    number
  movimiento:       string
  cid:              string
  _raw:             Record<string, string>
}

export interface ChurnMes {
  mes:             string
  clientes:        ChurnRow[]
  totalPerdido:    number
  totalGanado:     number
  totalMrrInicio:  number
  totalMrrFin:     number
  count:           number
}

/* ── Helpers ──────────────────────────────────────────────────────── */
function findCol(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k]
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const allKeys = Object.keys(row)
  for (const k of keys) {
    const nk = norm(k)
    const found = allKeys.find(ak => {
      const nak = norm(ak)
      return nak === nk || nak.includes(nk) || nk.includes(nak)
    })
    if (found && row[found] !== undefined && row[found] !== '') return row[found]
  }
  return ''
}

function n(v: string): number {
  return parseNum(v.replace(/[$,\s]/g, '').trim()) ?? 0
}

function normStr(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

function mapRow(r: Record<string, string>): ChurnRow {
  return {
    mes:              findCol(r, 'Mes Nombre', 'mes_nombre', 'mes', 'Mes'),
    cliente:          findCol(r, 'Cliente', 'cliente', 'nombre_cliente', 'Nombre del Cliente'),
    clasificacion:    findCol(r, 'clasificacion_cliente', 'clasificacion', 'Clasificacion Cliente', 'Clasificación Cliente'),
    fecha:            findCol(r, 'Año_Mes fecha', 'año_mes_fecha', 'fecha', 'Fecha'),
    facturas:         n(findCol(r, 'Facturas_2026', 'facturas_2026', 'facturas', 'Facturas')),
    mesesActivo:      n(findCol(r, 'Meses Activo', 'meses_activo', 'meses activo')),
    importeAcumulado: n(findCol(r, 'Importe Acumulado', 'importe_acumulado')),
    mrrInicio:        n(findCol(r, 'MRR Inicio Contrato', 'mrr_inicio_contrato', 'mrr_inicio')),
    mrrFin:           n(findCol(r, 'MRR Fin Contrato', 'mrr_fin_contrato', 'mrr_fin')),
    ingresoPerdido:   n(findCol(r, 'Ingreso Perdido Corriente', 'ingreso_perdido_corriente', 'ingreso_perdido')),
    ingresoGanado:    n(findCol(r, 'Ingreso Ganado Corriente', 'ingreso_ganado_corriente', 'ingreso_ganado')),
    movimiento:       findCol(r, 'Movimiento MRR', 'movimiento_mrr', 'movimiento', 'tipo_movimiento'),
    cid:              findCol(r, 'id_cliente', 'CID', 'cid', 'Id Cliente'),
    _raw: r,
  }
}

async function getData(): Promise<{ rows: ChurnRow[]; cols: string[] }> {
  if (_cache && Date.now() - _cache.ts < TTL) return _cache
  const result = await queryZohoView({ viewId: CHURN_VIEW_ID })
  const rows   = result.rows.map(mapRow)
  _cache = { rows, cols: result.columns, ts: Date.now() }
  return _cache
}

/* ─────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const sp   = req.nextUrl.searchParams
  const mode = sp.get('mode') ?? 'list'

  if (!isZohoConfigured()) {
    return NextResponse.json({ error: 'Zoho no configurado', rows: [] }, { status: 200 })
  }

  /* ── discover ─────────────────────────────────────────────────── */
  if (mode === 'discover') {
    try {
      const raw = await queryZohoView({ viewId: CHURN_VIEW_ID, maxRows: 5 })
      return NextResponse.json({ viewId: CHURN_VIEW_ID, columns: raw.columns, sample: raw.rows.slice(0, 3) })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  /* ── Cargar datos ─────────────────────────────────────────────── */
  let rows: ChurnRow[]
  let cols: string[]
  try {
    const d = await getData()
    rows = d.rows
    cols = d.cols
  } catch (e) {
    return NextResponse.json({ error: String(e), rows: [] }, { status: 200 })
  }

  /* ── Filtros comunes ──────────────────────────────────────────── */
  const clasificacion = (sp.get('clasificacion') ?? '').toUpperCase()   // AAA, AA, A, ''=todos
  const movFiltro     = (sp.get('mov') ?? '').toLowerCase()             // churn, downgrade, ''=todos
  const soloH1        = sp.get('h1') === 'true'

  let filtered = rows
  if (clasificacion) filtered = filtered.filter(r => r.clasificacion.toUpperCase() === clasificacion)
  if (movFiltro)     filtered = filtered.filter(r => r.movimiento.toLowerCase().includes(movFiltro))
  if (soloH1)        filtered = filtered.filter(r => MESES_H1.includes(r.mes))

  /* ── MODO: list — filas planas ────────────────────────────────── */
  if (mode === 'list') {
    const meses = Array.from(new Set(rows.map(r => r.mes).filter(Boolean)))
      .sort((a, b) => (MESES_ORDER[a] ?? 99) - (MESES_ORDER[b] ?? 99))

    const byMov: Record<string, { count: number; perdido: number }> = {}
    for (const r of filtered) {
      const m = r.movimiento || 'Sin clasificar'
      if (!byMov[m]) byMov[m] = { count: 0, perdido: 0 }
      byMov[m].count++
      byMov[m].perdido += r.ingresoPerdido
    }

    filtered.sort((a, b) => b.ingresoPerdido - a.ingresoPerdido)
    return NextResponse.json({
      total: filtered.length,
      totalIngresoPerdido: Math.round(filtered.reduce((s, r) => s + r.ingresoPerdido, 0)),
      totalIngresoGanado:  Math.round(filtered.reduce((s, r) => s + r.ingresoGanado, 0)),
      byMov, meses, cols, rows: filtered,
    })
  }

  /* ── MODO: detalle-mes — agrupado Ene–Jun por cliente ────────── */
  if (mode === 'detalle-mes') {
    const clsFiltro = clasificacion || 'AAA'
    const MESES_H1_LC = MESES_H1.map(m => m.toLowerCase())

    // Debug: qué hay en la vista antes de filtrar
    const debugClasificaciones = Array.from(new Set(rows.map(r => r.clasificacion).filter(Boolean))).slice(0, 20)
    const debugMeses = Array.from(new Set(rows.map(r => r.mes).filter(Boolean))).slice(0, 20)
    const debugSampleRaw = rows[0]?._raw ?? {}

    let data = rows.filter(r => r.clasificacion.toUpperCase().trim() === clsFiltro)
    if (movFiltro) data = data.filter(r => r.movimiento.toLowerCase().includes(movFiltro))
    // Comparación case-insensitive para los meses
    data = data.filter(r => MESES_H1_LC.includes(r.mes.toLowerCase().trim()))

    // Agrupar por mes — normalizar key a Title Case con MESES_H1 como referencia
    const mesCanonico = (m: string): string => {
      const ml = m.toLowerCase().trim()
      return MESES_H1.find(h => h.toLowerCase() === ml) ?? m
    }
    const porMes: Record<string, ChurnRow[]> = {}
    for (const r of data) {
      const key = mesCanonico(r.mes)
      if (!porMes[key]) porMes[key] = []
      porMes[key].push(r)
    }

    // Construir ChurnMes ordenado
    const mesesResult: ChurnMes[] = MESES_H1
      .filter(m => porMes[m])
      .map(mes => {
        const clientes = porMes[mes].sort((a, b) => b.ingresoPerdido - a.ingresoPerdido || b.mrrInicio - a.mrrInicio)
        return {
          mes,
          clientes,
          count:           clientes.length,
          totalPerdido:    Math.round(clientes.reduce((s, r) => s + r.ingresoPerdido, 0)),
          totalGanado:     Math.round(clientes.reduce((s, r) => s + r.ingresoGanado, 0)),
          totalMrrInicio:  Math.round(clientes.reduce((s, r) => s + r.mrrInicio, 0)),
          totalMrrFin:     Math.round(clientes.reduce((s, r) => s + r.mrrFin, 0)),
        }
      })

    const totales = {
      clientes:     Array.from(new Set(data.map(r => r.cliente))).length,
      registros:    data.length,
      perdido:      Math.round(data.reduce((s, r) => s + r.ingresoPerdido, 0)),
      ganado:       Math.round(data.reduce((s, r) => s + r.ingresoGanado, 0)),
      mrrInicioSum: Math.round(data.reduce((s, r) => s + r.mrrInicio, 0)),
    }

    return NextResponse.json({
      clasificacion: clsFiltro,
      meses:         mesesResult,
      totales,
      cols,
      // Debug: qué hay en la vista (para ajustar filtros si sale vacío)
      _debug: mesesResult.length === 0 ? {
        totalRows:          rows.length,
        clasificaciones:    debugClasificaciones,
        mesesDisponibles:   debugMeses,
        colsRaw:            cols,                           // nombres exactos que devuelve Zoho
        sampleRawKeys:      Object.keys(debugSampleRaw),   // keys del primer row
        sampleRawRow:       debugSampleRaw,                 // valores del primer row
        hint: 'Revisar colsRaw/sampleRawKeys para ver nombres exactos de columnas en esta vista',
      } : undefined,
    })
  }

  /* ── MODO: cruzado — GRC + Facturación ───────────────────────── */
  if (mode === 'cruzado') {
    const factByCid:    Record<string, Record<string, string>> = {}
    const factByNombre: Record<string, Record<string, string>> = {}

    if (FACT_VIEW_ID) {
      try {
        const factRes = await queryZohoView({ viewId: FACT_VIEW_ID })
        for (const r of factRes.rows) {
          const cid    = r['id_cliente'] ?? ''
          const nombre = r['nombre_cliente'] ?? ''
          if (cid)    factByCid[cid]             = r
          if (nombre) factByNombre[normStr(nombre)] = r
        }
      } catch { /* sin cruce */ }
    }

    const result = filtered.map(r => {
      const factRow  = factByCid[r.cid] ?? factByNombre[normStr(r.cliente)] ?? null
      const semaforo = factRow ? (factRow['semaforo_actividad'] ?? '') : null
      return {
        ...r,
        semaforoActual: semaforo,
        mrrActual:      factRow ? n(factRow['mrr_limpio'] ?? '') : null,
        segmento:       factRow ? (factRow['segmento_factura'] ?? null) : null,
        factMatched:    !!factRow,
        alerta: !!factRow && !!semaforo && !semaforo.toLowerCase().includes('dormido'),
      }
    }).sort((a, b) => b.ingresoPerdido - a.ingresoPerdido)

    return NextResponse.json({
      total:       result.length,
      totalPerdido: Math.round(result.reduce((s, r) => s + r.ingresoPerdido, 0)),
      alertas:     result.filter(r => r.alerta).length,
      factMatched: result.filter(r => r.factMatched).length,
      rows:        result,
    })
  }

  return NextResponse.json({ error: 'mode not found' }, { status: 400 })
}
