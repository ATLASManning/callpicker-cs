import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  isZohoConfigured, queryZohoView, parseNum, ZohoViewData
} from '@/lib/zoho-analytics'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

/* ─── Tipo de registro LTV ───────────────────────────────────────────── */
export interface FactRow {
  CID:                          string
  'Nombre del Cliente':         string
  'Tamaño Empresa':             string
  'Clasificación LTV':          string
  'Clasificación Cliente':      string
  'Segmento Factura':           string
  'MRR Limpio':                 number | null
  'Importe Acumulado Recurrente': number | null
  'Importe Acumulado Bruto':    number | null
  'Meses Activo':               number | null
  'Meses con Factura':          number | null
  'Primera Factura':            string
  'Última Factura':             string
  'Semáforo Actividad':         string
  'Es One Timer':               string
  'MRR por Mes Facturado':      number | null
  'Total Facturas':             number | null
  'Cohorte Periodo':            string
  'Días sin Factura':           number | null
  'Ticket Promedio':            number | null
  'Rango LTV':                  string
  'RFC':                        string
  'Correo':                     string
}

/* ── Mapeo columnas Zoho LTV → FactRow ──────────────────────────────── */
const COL: Record<string, keyof FactRow> = {
  'id_cliente':                    'CID',
  'nombre_cliente':                'Nombre del Cliente',
  'tamano_empresa':                'Tamaño Empresa',
  'clasificacion_ltv':             'Clasificación LTV',
  'clasificacion_cliente':         'Clasificación Cliente',
  'segmento_factura':              'Segmento Factura',
  'mrr_limpio':                    'MRR Limpio',
  'importe_acumulado_recurrente':  'Importe Acumulado Recurrente',
  'importe_acumulado_bruto':       'Importe Acumulado Bruto',
  'meses_activo':                  'Meses Activo',
  'meses_con_factura':             'Meses con Factura',
  'primera_factura':               'Primera Factura',
  'ultima_factura':                'Última Factura',
  'semaforo_actividad':            'Semáforo Actividad',
  'es_one_timer':                  'Es One Timer',
  'mrr_por_mes_facturado':         'MRR por Mes Facturado',
  'total_facturas':                'Total Facturas',
  'cohorte_periodo':               'Cohorte Periodo',
  'dias_sin_factura':              'Días sin Factura',
  'ticket_limpio_promedio':        'Ticket Promedio',
  'rango_ltv_limpio':              'Rango LTV',
  'rfc':                           'RFC',
  'correo':                        'Correo',
}

const NUM_COLS = new Set<keyof FactRow>([
  'MRR Limpio', 'Importe Acumulado Recurrente', 'Importe Acumulado Bruto',
  'Meses Activo', 'Meses con Factura', 'MRR por Mes Facturado',
  'Total Facturas', 'Días sin Factura', 'Ticket Promedio',
])

function zohoRowToFact(raw: Record<string, string>): FactRow {
  const row: Partial<FactRow> = {}
  for (const [zohoCol, factKey] of Object.entries(COL)) {
    const val = raw[zohoCol] ?? ''
    if (NUM_COLS.has(factKey)) {
      // Zoho puede devolver "$1,234.56" — limpiar símbolos
      const cleaned = String(val).replace(/[$,]/g, '').trim();
      (row as Record<string, unknown>)[factKey] = parseNum(cleaned)
    } else {
      (row as Record<string, unknown>)[factKey] = val
    }
  }
  if (!row['CID']) row['CID'] = ''
  if (!row['Nombre del Cliente']) row['Nombre del Cliente'] = ''
  if (!row['Primera Factura']) row['Primera Factura'] = ''
  if (!row['Última Factura']) row['Última Factura'] = ''
  if (!row['Semáforo Actividad']) row['Semáforo Actividad'] = ''
  if (!row['Clasificación LTV']) row['Clasificación LTV'] = ''
  if (!row['Clasificación Cliente']) row['Clasificación Cliente'] = ''
  if (!row['Segmento Factura']) row['Segmento Factura'] = ''
  if (!row['Tamaño Empresa']) row['Tamaño Empresa'] = ''
  if (!row['Rango LTV']) row['Rango LTV'] = ''
  if (!row['Es One Timer']) row['Es One Timer'] = ''
  if (!row['Cohorte Periodo']) row['Cohorte Periodo'] = ''
  if (!row['RFC']) row['RFC'] = ''
  if (!row['Correo']) row['Correo'] = ''
  return row as FactRow
}

/* ── Cache Zoho en memoria (TTL: 15 min) ─────────────────────────── */
let _zohoCache: { data: FactRow[]; ts: number } | null = null
const ZOHO_TTL_MS = 15 * 60 * 1000

async function getZohoData(): Promise<FactRow[]> {
  if (_zohoCache && Date.now() - _zohoCache.ts < ZOHO_TTL_MS) return _zohoCache.data

  const viewId = process.env.ZOHO_VIEW_ID_FACTURACION
  if (!viewId) throw new Error('ZOHO_VIEW_ID_FACTURACION no configurado')

  const result: ZohoViewData = await queryZohoView({ viewId })
  const data = result.rows.map(zohoRowToFact)
  _zohoCache = { data, ts: Date.now() }
  return data
}

async function getData(): Promise<{ rows: FactRow[]; source: 'zoho' | 'empty' }> {
  if (isZohoConfigured()) {
    try {
      const rows = await getZohoData()
      return { rows, source: 'zoho' }
    } catch (err) {
      console.error('[facturacion] Zoho error:', err)
      throw err
    }
  }
  return { rows: [], source: 'empty' }
}

function normalize(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

/* ── Parsear "DD Mon YYYY" o "YYYY-MM-DD" → "Mon YYYY" ─────────────── */
function parseMesAnio(fecha: string): string {
  if (!fecha) return ''
  const parts = fecha.trim().split(' ')
  if (parts.length >= 3) return `${parts[1]} ${parts[2]}`   // "15 May 2026" → "May 2026"
  if (fecha.includes('-')) { const p = fecha.split('-'); return `${p[1]}-${p[0]}` }
  return fecha
}

const MESES_ORDEN: Record<string, number> = {
  Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12
}

/* ─── Handler ────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const sp   = req.nextUrl.searchParams
  const mode = sp.get('mode') ?? 'list'

  let rows: FactRow[] = []
  let source = 'empty'

  try {
    const result = await getData()
    rows = result.rows
    source = result.source
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg, periodos: [], rows: [] }, { status: 200 })
  }

  /* ── MODO: source ─────────────────────────────────────────────── */
  if (mode === 'source') {
    return NextResponse.json({ source, zohoConfigured: isZohoConfigured(), rows: rows.length })
  }

  /* ── MODO: filters ── valores únicos para los dropdowns ──────── */
  if (mode === 'filters') {
    const uniq = (key: keyof FactRow) =>
      Array.from(new Set(rows.map(r => String(r[key] ?? '')).filter(Boolean))).sort()
    return NextResponse.json({
      meses:     uniq('Cohorte Periodo'),
      ltvs:      uniq('Clasificación LTV'),
      segmentos: uniq('Segmento Factura'),
      tamanos:   uniq('Tamaño Empresa'),
      semaforos: uniq('Semáforo Actividad'),
      source,
    })
  }

  /* ── MODO: periodos — en LTV no hay períodos de corte, usamos cohorte ── */
  if (mode === 'periodos') {
    // Agrupar por Semáforo de actividad para dar una visión resumen
    const semaforos: Record<string, { count: number; mrr: number }> = {}
    for (const r of rows) {
      const s = r['Semáforo Actividad'] || 'Sin datos'
      if (!semaforos[s]) semaforos[s] = { count: 0, mrr: 0 }
      semaforos[s].count++
      semaforos[s].mrr += r['MRR Limpio'] ?? 0
    }
    // Devolver como "periodos" usando semáforo como "fecha" para el selector
    const periodos = Object.entries(semaforos)
      .sort((a, b) => b[1].mrr - a[1].mrr)
      .map(([fecha, v]) => ({ fecha, count: v.count, mrr: Math.round(v.mrr * 100) / 100 }))
    return NextResponse.json({ periodos, total: rows.length, source })
  }

  /* ── Filtrar por semáforo (en lugar de fecha) ─────────────────── */
  const semaforo = sp.get('fecha') ?? ''
  const filtered = semaforo && semaforo !== '__all__'
    ? rows.filter(r => r['Semáforo Actividad'] === semaforo)
    : rows

  /* ── MODO: stats ────────────────────────────────────────────────── */
  if (mode === 'stats') {
    const totalMrr = filtered.reduce((s, r) => s + (r['MRR Limpio'] ?? 0), 0)
    const avgMrr   = filtered.length ? totalMrr / filtered.length : 0

    // Por segmento
    const bySegmento: Record<string, { count: number; mrr: number }> = {}
    for (const r of filtered) {
      const s = r['Segmento Factura'] || 'N/A'
      if (!bySegmento[s]) bySegmento[s] = { count: 0, mrr: 0 }
      bySegmento[s].count++
      bySegmento[s].mrr += r['MRR Limpio'] ?? 0
    }

    // Por clasificación LTV
    const byLTV: Record<string, { count: number; mrr: number }> = {}
    for (const r of filtered) {
      const s = r['Clasificación LTV'] || 'N/A'
      if (!byLTV[s]) byLTV[s] = { count: 0, mrr: 0 }
      byLTV[s].count++
      byLTV[s].mrr += r['MRR Limpio'] ?? 0
    }

    // Top clientes por MRR
    const topClientes = filtered
      .filter(r => (r['MRR Limpio'] ?? 0) > 0)
      .sort((a, b) => (b['MRR Limpio'] ?? 0) - (a['MRR Limpio'] ?? 0))
      .slice(0, 10)
      .map(r => ({
        nombre: r['Nombre del Cliente'],
        mrr: r['MRR Limpio'] ?? 0,
        clas: r['Clasificación LTV'],
        semaforo: r['Semáforo Actividad'],
        rango: r['Rango LTV'],
      }))

    // Por rango LTV
    const byRango: Record<string, { count: number; mrr: number }> = {}
    for (const r of filtered) {
      const s = r['Rango LTV'] || 'N/A'
      if (!byRango[s]) byRango[s] = { count: 0, mrr: 0 }
      byRango[s].count++
      byRango[s].mrr += r['MRR Limpio'] ?? 0
    }

    // Semáforo actividad
    const bySemaforo: Record<string, number> = {}
    for (const r of filtered) {
      const s = r['Semáforo Actividad'] || 'N/A'
      bySemaforo[s] = (bySemaforo[s] ?? 0) + 1
    }

    const activos   = filtered.filter(r => r['Semáforo Actividad']?.includes('Activo') || r['Semáforo Actividad']?.includes('activo')).length
    const dormidos  = filtered.filter(r => r['Semáforo Actividad']?.includes('Dormido') || r['Semáforo Actividad']?.includes('dormido')).length
    const onTimers  = filtered.filter(r => r['Es One Timer'] === 'Yes').length

    return NextResponse.json({
      total: filtered.length,
      totalMrr: Math.round(totalMrr),
      avgMrr: Math.round(avgMrr),
      activos, dormidos, onTimers,
      bySegmento, byLTV, byRango, bySemaforo,
      topClientes,
      source,
    })
  }

  /* ── MODO: list ─────────────────────────────────────────────────── */
  if (mode === 'list') {
    const q         = (sp.get('q') ?? '').toLowerCase()
    const page      = Math.max(1, parseInt(sp.get('page') ?? '1'))
    const size      = Math.min(100, parseInt(sp.get('size') ?? '50'))
    const ltv       = sp.get('ltv') ?? ''
    const seg       = sp.get('seg') ?? ''
    const tamano    = sp.get('tamano') ?? ''
    const mes       = sp.get('mes') ?? ''
    const sema      = sp.get('sema') ?? ''

    let list = filtered
    if (q) list = list.filter(r =>
      normalize(r['Nombre del Cliente'] ?? '').includes(normalize(q)) ||
      (r.CID ?? '').toLowerCase().includes(q) ||
      normalize(r['Segmento Factura'] ?? '').includes(normalize(q))
    )
    if (ltv)    list = list.filter(r => r['Clasificación LTV'] === ltv)
    if (seg)    list = list.filter(r => r['Segmento Factura'] === seg)
    if (tamano) list = list.filter(r => r['Tamaño Empresa'] === tamano)
    if (mes)    list = list.filter(r => r['Cohorte Periodo'] === mes)
    if (sema)   list = list.filter(r => r['Semáforo Actividad'] === sema)

    const total  = list.length
    const offset = (page - 1) * size
    const slice  = list
      .sort((a, b) => (b['MRR Limpio'] ?? 0) - (a['MRR Limpio'] ?? 0))
      .slice(offset, offset + size)
    return NextResponse.json({ total, page, size, rows: slice, source })
  }

  /* ── MODO: conciliacion ─────────────────────────────────────────── */
  if (mode === 'conciliacion') {
    const { data: cuentas } = await supabaseAdmin
      .from('cuentas')
      .select('id, nombre, estado, asesor, health_score, facturacion, cid')

    type CuentaRow = {
      id: number; nombre: string; estado: string; asesor: string
      health_score: number | null; facturacion: number | null; cid: string | null
    }
    const mapCid:    Record<string, CuentaRow> = {}
    const mapNombre: Record<string, CuentaRow> = {}
    for (const c of ((cuentas ?? []) as CuentaRow[])) {
      if (c.cid) mapCid[String(c.cid)] = c
      mapNombre[normalize(c.nombre ?? '')] = c
    }

    const result = rows.map(r => {
      const cuenta = mapCid[r.CID] ?? mapNombre[normalize(r['Nombre del Cliente'] ?? '')] ?? null
      return {
        cid: r.CID,
        nombre: r['Nombre del Cliente'],
        ltv: r['Clasificación LTV'],
        segmento: r['Segmento Factura'],
        mrr: r['MRR Limpio'] ?? 0,
        semaforo: r['Semáforo Actividad'],
        rango: r['Rango LTV'],
        matched: !!cuenta,
        cuenta_id: cuenta?.id ?? null,
        estado: cuenta?.estado ?? null,
        asesor: cuenta?.asesor ?? null,
        health_score: cuenta?.health_score ?? null,
      }
    }).sort((a, b) => b.mrr - a.mrr)

    const matched   = result.filter(r => r.matched).length
    const unmatched = result.filter(r => !r.matched).length
    return NextResponse.json({ total: result.length, matched, unmatched, rows: result, source })
  }

  /* ── MODO: by-cid ────────────────────────────────────────────────── */
  if (mode === 'by-cid') {
    const cid    = sp.get('cid') ?? ''
    const nombre = sp.get('nombre') ?? ''

    // Extraer palabras clave significativas del nombre (>= 3 chars, no stopwords)
    const STOP = new Set(['de','del','la','el','los','las','en','y','a','s','sa','cv','sapi','grupo','the','and'])
    const keywords = normalize(nombre)
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP.has(w))
      .slice(0, 3)

    // Generar acrónimo con la primera letra de cada palabra >= 2 chars
    // Ej: "GRUPO TORRES CORZO" → "GTC", "GRUPO NACIONAL PROVINCIAL" → "GNP"
    const acronym = nombre.trim().split(/\s+/)
      .filter(w => w.length >= 2)
      .map(w => normalize(w)[0] ?? '')
      .join('')
    // Solo usar si tiene ≥ 3 chars (evitar falsos positivos con SA, CV, etc.)
    const useAcronym = acronym.length >= 3

    // Buscar todas las sub-cuentas relacionadas
    let found: FactRow[] = []

    // 1. CID exacto primero
    if (cid) found = rows.filter(r => (r.CID ?? '').trim() === cid.trim())

    const cidsSeen = new Set(found.map(r => r.CID))

    // 2. Ampliar con keywords: cualquier cuenta cuyo nombre contenga alguna keyword
    if (keywords.length > 0) {
      const byKeyword = rows.filter(r => {
        const n = normalize(r['Nombre del Cliente'] ?? '')
        return keywords.some(kw => n.includes(kw))
      })
      for (const r of byKeyword) {
        if (!cidsSeen.has(r.CID)) { found.push(r); cidsSeen.add(r.CID) }
      }
    }

    // 3. Buscar por acrónimo: cuentas cuyo nombre empiece con "GTC - " o "GTC-" o "GTC "
    if (useAcronym) {
      const acr = acronym.toLowerCase()
      const byAcronym = rows.filter(r => {
        const n = normalize(r['Nombre del Cliente'] ?? '')
        return n.startsWith(acr + ' ') || n.startsWith(acr + '-') || n === acr
      })
      for (const r of byAcronym) {
        if (!cidsSeen.has(r.CID)) { found.push(r); cidsSeen.add(r.CID) }
      }
    }

    if (found.length === 0) return NextResponse.json({ rows: [], mrrGrupo: 0, mesReciente: '', subCuentas: 0, source })

    const fechas = found
      .map(r => r['Última Factura'])
      .filter((f): f is string => !!f && f.trim().length > 0)
      .map(f => ({ raw: f, parsed: parseMesAnio(f) }))

    const sortedFechas = fechas.sort((a, b) => {
      const [mA, yA] = a.parsed.split(' ')
      const [mB, yB] = b.parsed.split(' ')
      const yearDiff = parseInt(yB ?? '0') - parseInt(yA ?? '0')
      if (yearDiff !== 0) return yearDiff
      return (MESES_ORDEN[mB ?? ''] ?? 0) - (MESES_ORDEN[mA ?? ''] ?? 0)
    })

    const mesReciente = sortedFechas[0]?.parsed ?? ''

    // Filtrar solo las cuentas del mes más reciente
    const cuentasMesReciente = mesReciente
      ? found.filter(r => parseMesAnio(r['Última Factura']) === mesReciente)
      : found

    // Suma del MRR del mes reciente
    const mrrGrupo = cuentasMesReciente.reduce((s, r) => s + (r['MRR Limpio'] ?? 0), 0)

    return NextResponse.json({
      rows: found,                    // todas las sub-cuentas encontradas
      cuentasMesReciente,             // solo las del mes reciente
      mrrGrupo: Math.round(mrrGrupo),
      mesReciente,
      subCuentas: found.length,
      source,
    })
  }

  return NextResponse.json({ error: 'mode not found' }, { status: 400 })
}
