import { NextRequest, NextResponse } from 'next/server'
import { isZohoConfigured, queryZohoView, parseNum } from '@/lib/zoho-analytics'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

// Vista resumen GRC mensual (8 filas con totales por mes)
const CHURN_VIEW_ID = process.env.ZOHO_VIEW_ID_CHURN_DETAIL ?? '245443000011222902'
// Vista facturación — tiene clasificacion_cliente, ultima_factura, mrr_limpio, etc.
const FACT_VIEW_ID  = process.env.ZOHO_VIEW_ID_FACTURACION  ?? ''

/* ── Caches ──────────────────────────────────────────────────────── */
let _grcCache:  { rows: GrcRow[];  cols: string[]; ts: number } | null = null
let _factCache: { rows: FactClienteRow[]; ts: number }          | null = null
const TTL = 15 * 60 * 1000

const MESES_H1 = ['Enero','Febrero','Marzo','Abril','Mayo','Junio']
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_ORDER: Record<string, number> = {
  Enero:1, Febrero:2, Marzo:3, Abril:4, Mayo:5, Junio:6,
  Julio:7, Agosto:8, Septiembre:9, Octubre:10, Noviembre:11, Diciembre:12,
}

/* ── Tipos ────────────────────────────────────────────────────────── */

// Fila del GRC resumen mensual
export interface GrcRow {
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

// Fila enriquecida de Facturación (fuente de datos AAA)
export interface FactClienteRow {
  cid:              string
  nombre:           string
  clasificacion:    string
  clasificacionLtv: string
  segmento:         string
  mrr:              number
  mrrInicio:        number
  acumulado:        number
  mesesActivo:      number
  primeraFactura:   string
  ultimaFactura:    string
  semaforo:         string
  diasSinFactura:   number
  totalFacturas:    number
}

// Fila de detalle AAA por mes (lo que devuelve el endpoint)
export interface AAADetalleRow {
  cid:            string
  nombre:         string
  clasificacion:  string
  segmento:       string
  mrr:            number
  mrrInicio:      number
  acumulado:      number
  mesesActivo:    number
  ultimaFactura:  string
  semaforo:       string
  movimiento:     string   // derivado del semáforo
  diasSinFactura: number
  totalFacturas:  number
}

export interface AAAMes {
  mes:            string
  clientes:       AAADetalleRow[]
  count:          number
  totalMrr:       number
  totalAcumulado: number
}

/* ── Helpers ──────────────────────────────────────────────────────── */
function fc(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k]
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const allKeys = Object.keys(row)
  for (const k of keys) {
    const nk = norm(k)
    const found = allKeys.find(ak => { const nak = norm(ak); return nak === nk || nak.includes(nk) || nk.includes(nak) })
    if (found && row[found] !== undefined && row[found] !== '') return row[found]
  }
  return ''
}

function n(v: string): number {
  return parseNum(String(v).replace(/[$,\s]/g, '').trim()) ?? 0
}

function normStr(s: string) {
  return (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').trim()
}

/** Extrae mes en español (title case) de fechas: DD/MM/YYYY, YYYY-MM-DD, "01 Jan 2026", etc. */
function mesDesFecha(f: string): string | null {
  if (!f) return null
  // Formato "01 Jan 2026" o "01 Jan 26"
  const mEn: Record<string, number> = {
    jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
    jul:7, aug:8, sep:9, oct:10, nov:11, dec:12,
  }
  const mMatch = f.toLowerCase().match(/(\d{1,2})\s+([a-z]{3})\s+(\d{2,4})/)
  if (mMatch) {
    const m = mEn[mMatch[2]]
    const y = parseInt(mMatch[3]) + (mMatch[3].length === 2 ? 2000 : 0)
    if (m && y === 2026 && m <= 6) return MESES_ES[m - 1]
    if (m && y === 2026) return MESES_ES[m - 1]   // permitir todos de 2026
    return null
  }
  // Formato DD/MM/YYYY
  const dmyMatch = f.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmyMatch) {
    const m = parseInt(dmyMatch[2])
    const y = parseInt(dmyMatch[3])
    if (y === 2026) return MESES_ES[m - 1] ?? null
  }
  // Formato YYYY-MM-DD
  const ymdMatch = f.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (ymdMatch) {
    const m = parseInt(ymdMatch[2])
    const y = parseInt(ymdMatch[1])
    if (y === 2026) return MESES_ES[m - 1] ?? null
  }
  // Formato YYYY/MM o YYYY-MM (cohorte)
  const ymMatch = f.match(/^(\d{4})[\/\-](\d{2})$/)
  if (ymMatch) {
    const m = parseInt(ymMatch[2])
    const y = parseInt(ymMatch[1])
    if (y === 2026) return MESES_ES[m - 1] ?? null
  }
  return null
}

/** Semáforo → tipo de movimiento legible */
function semaforoAMovimiento(s: string): string {
  const sl = (s ?? '').toLowerCase()
  if (sl.includes('dormido') || sl.includes('baja') || sl.includes('cancelad')) return 'Churn confirmado'
  if (sl.includes('riesgo') || sl.includes('irregular')) return 'En riesgo'
  if (sl.includes('activo') || sl.includes('normal') || sl.includes('verde')) return 'Activo'
  if (sl.includes('nuevo')) return 'Nuevo'
  return s || 'Sin semáforo'
}

/* ── Mapeo fila Facturación → FactClienteRow ─────────────────────── */
function mapFactRow(r: Record<string, string>): FactClienteRow {
  return {
    cid:              fc(r, 'id_cliente', 'CID', 'cid'),
    nombre:           fc(r, 'nombre_cliente', 'Nombre del Cliente', 'cliente'),
    clasificacion:    fc(r, 'clasificacion_cliente', 'Clasificación Cliente', 'clasificacion_cliente'),
    clasificacionLtv: fc(r, 'clasificacion_ltv', 'Clasificación LTV'),
    segmento:         fc(r, 'segmento_factura', 'Segmento Factura'),
    mrr:              n(fc(r, 'mrr_limpio', 'MRR Limpio')),
    mrrInicio:        n(fc(r, 'mrr_inicio', 'MRR Inicio', 'mrr_inicio_contrato')),
    acumulado:        n(fc(r, 'importe_acumulado_recurrente', 'Importe Acumulado Recurrente', 'importe_acumulado')),
    mesesActivo:      n(fc(r, 'meses_activo', 'Meses Activo')),
    primeraFactura:   fc(r, 'primera_factura', 'Primera Factura'),
    ultimaFactura:    fc(r, 'ultima_factura', 'Última Factura'),
    semaforo:         fc(r, 'semaforo_actividad', 'Semáforo Actividad'),
    diasSinFactura:   n(fc(r, 'dias_sin_factura', 'Días sin Factura')),
    totalFacturas:    n(fc(r, 'total_facturas', 'Total Facturas')),
  }
}

/* ── Mapeo fila GRC resumen → GrcRow ────────────────────────────── */
function mapGrcRow(r: Record<string, string>): GrcRow {
  return {
    mes:              fc(r, 'Mes Nombre', 'mes_nombre', 'mes', 'Mes'),
    cliente:          fc(r, 'Cliente', 'cliente', 'nombre_cliente', 'Nombre del Cliente'),
    clasificacion:    fc(r, 'clasificacion_cliente', 'clasificacion', 'Clasificacion Cliente', 'Clasificación Cliente'),
    fecha:            fc(r, 'Año_Mes fecha', 'año_mes_fecha', 'fecha', 'Fecha'),
    facturas:         n(fc(r, 'Facturas_2026', 'facturas_2026', 'facturas', 'Facturas')),
    mesesActivo:      n(fc(r, 'Meses Activo', 'meses_activo')),
    importeAcumulado: n(fc(r, 'Importe Acumulado', 'importe_acumulado')),
    mrrInicio:        n(fc(r, 'MRR Inicio Contrato', 'mrr_inicio_contrato', 'mrr_inicio')),
    mrrFin:           n(fc(r, 'MRR Fin Contrato', 'mrr_fin_contrato', 'mrr_fin')),
    ingresoPerdido:   n(fc(r, 'Ingreso Perdido Corriente', 'ingreso_perdido_corriente', 'ingreso_perdido')),
    ingresoGanado:    n(fc(r, 'Ingreso Ganado Corriente', 'ingreso_ganado_corriente', 'ingreso_ganado')),
    movimiento:       fc(r, 'Movimiento MRR', 'movimiento_mrr', 'movimiento'),
    cid:              fc(r, 'id_cliente', 'CID', 'cid'),
    _raw: r,
  }
}

/* ── Carga datos GRC resumen ─────────────────────────────────────── */
async function getGrcData(): Promise<{ rows: GrcRow[]; cols: string[] }> {
  if (_grcCache && Date.now() - _grcCache.ts < TTL) return _grcCache
  const result = await queryZohoView({ viewId: CHURN_VIEW_ID })
  const rows   = result.rows.map(mapGrcRow)
  _grcCache = { rows, cols: result.columns, ts: Date.now() }
  return _grcCache
}

/* ── Carga datos Facturación (fuente AAA) ────────────────────────── */
async function getFactData(): Promise<FactClienteRow[]> {
  if (_factCache && Date.now() - _factCache.ts < TTL) return _factCache.rows
  const result = await queryZohoView({ viewId: FACT_VIEW_ID })
  const rows   = result.rows.map(mapFactRow)
  _factCache = { rows, ts: Date.now() }
  return rows
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
    const vid = sp.get('viewId') ?? CHURN_VIEW_ID
    try {
      const raw = await queryZohoView({ viewId: vid, maxRows: 5 })
      return NextResponse.json({ viewId: vid, columns: raw.columns, sample: raw.rows.slice(0, 3), total: raw.rows.length })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  /* ── MODO: detalle-mes — AAA H1 desde Facturación ────────────── */
  if (mode === 'detalle-mes') {
    if (!FACT_VIEW_ID) {
      return NextResponse.json({ error: 'ZOHO_VIEW_ID_FACTURACION no configurado', meses: [], totales: {} }, { status: 200 })
    }

    let factRows: FactClienteRow[]
    try {
      factRows = await getFactData()
    } catch (e) {
      return NextResponse.json({ error: String(e), meses: [], totales: {} }, { status: 200 })
    }

    const clsFiltro = (sp.get('clasificacion') ?? 'AAA').toUpperCase()
    const semFiltro = (sp.get('semaforo') ?? '').toLowerCase()  // '' = todos, 'dormido' = solo dormidos

    // Filtrar por clasificación AAA
    let aaa = factRows.filter(r => r.clasificacion.toUpperCase().trim() === clsFiltro)
    if (semFiltro) aaa = aaa.filter(r => r.semaforo.toLowerCase().includes(semFiltro))

    // Debug info
    const debugClasificaciones = Array.from(new Set(factRows.map(r => r.clasificacion).filter(Boolean))).slice(0, 20)
    const debugSemaforosAAA    = Array.from(new Set(aaa.map(r => r.semaforo).filter(Boolean))).slice(0, 20)
    const debugFechasAAA       = aaa.slice(0, 5).map(r => r.ultimaFactura)

    // Agrupar por mes de última factura en 2026
    const porMes: Record<string, AAADetalleRow[]> = {}
    for (const r of aaa) {
      const mes = mesDesFecha(r.ultimaFactura)
      if (!mes) continue
      if (!MESES_H1.includes(mes)) continue   // solo H1
      if (!porMes[mes]) porMes[mes] = []
      porMes[mes].push({
        cid:           r.cid,
        nombre:        r.nombre,
        clasificacion: r.clasificacion,
        segmento:      r.segmento,
        mrr:           r.mrr,
        mrrInicio:     r.mrrInicio,
        acumulado:     r.acumulado,
        mesesActivo:   r.mesesActivo,
        ultimaFactura: r.ultimaFactura,
        semaforo:      r.semaforo,
        movimiento:    semaforoAMovimiento(r.semaforo),
        diasSinFactura: r.diasSinFactura,
        totalFacturas: r.totalFacturas,
      })
    }

    const mesesResult: AAAMes[] = MESES_H1
      .filter(m => porMes[m])
      .map(mes => {
        const clientes = porMes[mes].sort((a, b) => b.mrr - a.mrr)
        return {
          mes,
          clientes,
          count:          clientes.length,
          totalMrr:       Math.round(clientes.reduce((s, r) => s + r.mrr, 0)),
          totalAcumulado: Math.round(clientes.reduce((s, r) => s + r.acumulado, 0)),
        }
      })

    const totales = {
      clientesAAA:    aaa.length,
      clientesEnMes:  Object.values(porMes).reduce((s, arr) => s + arr.length, 0),
      totalMrr:       Math.round(Object.values(porMes).flat().reduce((s, r) => s + r.mrr, 0)),
      mesesConData:   mesesResult.length,
    }

    return NextResponse.json({
      clasificacion: clsFiltro,
      meses:         mesesResult,
      totales,
      _debug: {
        totalFactRows:     factRows.length,
        totalAAA:          aaa.length,
        clasificaciones:   debugClasificaciones,
        semaforosEnAAA:    debugSemaforosAAA,
        muestraFechasAAA:  debugFechasAAA,
        hint: 'Agrupa por mes de Última Factura en 2026 — clientes AAA de la vista de Facturación',
      },
    })
  }

  /* ── Cargar datos GRC para los demás modos ───────────────────── */
  let rows: GrcRow[]
  let cols: string[]
  try {
    const d = await getGrcData()
    rows = d.rows
    cols = d.cols
  } catch (e) {
    return NextResponse.json({ error: String(e), rows: [] }, { status: 200 })
  }

  const clasificacion = (sp.get('clasificacion') ?? '').toUpperCase()
  const movFiltro     = (sp.get('mov') ?? '').toLowerCase()
  const soloH1        = sp.get('h1') === 'true'

  let filtered = rows
  if (clasificacion) filtered = filtered.filter(r => r.clasificacion.toUpperCase() === clasificacion)
  if (movFiltro)     filtered = filtered.filter(r => r.movimiento.toLowerCase().includes(movFiltro))
  if (soloH1)        filtered = filtered.filter(r => MESES_H1.includes(r.mes))

  /* ── MODO: list ──────────────────────────────────────────────── */
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

  /* ── MODO: cruzado — GRC + Facturación ──────────────────────── */
  if (mode === 'cruzado') {
    let factRows: FactClienteRow[] = []
    if (FACT_VIEW_ID) {
      try { factRows = await getFactData() } catch { /* sin cruce */ }
    }
    const factByCid:    Record<string, FactClienteRow> = {}
    const factByNombre: Record<string, FactClienteRow> = {}
    for (const r of factRows) {
      if (r.cid)    factByCid[r.cid]              = r
      if (r.nombre) factByNombre[normStr(r.nombre)] = r
    }

    const result = filtered.map(r => {
      const factRow  = factByCid[r.cid] ?? factByNombre[normStr(r.cliente)] ?? null
      const semaforo = factRow?.semaforo ?? null
      return {
        ...r,
        semaforoActual: semaforo,
        mrrActual:      factRow?.mrr ?? null,
        segmento:       factRow?.segmento ?? null,
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
