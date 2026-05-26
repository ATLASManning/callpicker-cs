import ActivacionesCharts, { ActivacionesData, MesDato, VendedorDato, TamanoDato, Reciente } from '@/components/charts/ActivacionesCharts'

export const dynamic = 'force-dynamic'

// ── Colores y helpers ─────────────────────────────────────────────────────────
const BG     = '#0A1628'
const TX     = '#E8F4FF'
const TX_MID = 'rgba(200,228,255,0.65)'

// ── Mapa de meses para ordenación ─────────────────────────────────────────────
const MES_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
}
const MES_ES: Record<string, string> = {
  Jan: 'Ene', Feb: 'Feb', Mar: 'Mar', Apr: 'Abr', May: 'May', Jun: 'Jun',
  Jul: 'Jul', Aug: 'Ago', Sep: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dic',
}

// ── Parseo CSV con soporte de campos entre comillas ───────────────────────────
function parseCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  cols.push(cur.trim())
  return cols
}

function parsePeso(val: string): number {
  return parseFloat((val || '0').replace(/[$,\s]/g, '')) || 0
}

function parseFecha(fecha: string): { label: string; sortKey: number } {
  // Formato: "19-Nov-2025"
  const parts = fecha.split('-')
  if (parts.length < 3) return { label: '', sortKey: 0 }
  const abbr = parts[1]
  const year = parseInt(parts[2])
  const num  = MES_NUM[abbr] ?? 0
  const es   = MES_ES[abbr]  ?? abbr
  return {
    label:   `${es} ${String(year).slice(2)}`,   // "Nov 25"
    sortKey: year * 100 + num,
  }
}

function normalizeVendedor(v: string): string {
  const lc = (v || '').trim().toLowerCase()
  if (!lc || lc.startsWith('sin') || lc === 'n/a') return 'Sin vendedor'
  if (lc === 'otro' || lc === 'other') return 'Otro'
  // Capitalizar correctamente
  return v.trim().replace(/\b\w/g, c => c.toUpperCase())
}

function normalizeTamanoEmpresa(t: string): string {
  const lc = (t || '').toLowerCase()
  if (lc.includes('1') && lc.includes('10'))  return '1–10 personas'
  if (lc.includes('11') && lc.includes('50')) return '11–50 personas'
  if (lc.includes('51') && lc.includes('150'))return '51–150 personas'
  if (lc.includes('150') && lc.includes('más')) return '150+ personas'
  return t || 'N/A'
}

// ── Fetch y procesamiento ─────────────────────────────────────────────────────
async function getActivacionesData(): Promise<ActivacionesData | null> {
  const csvUrl = process.env.ACTIVACIONES_CSV_URL
  if (!csvUrl) return null

  try {
    const res = await fetch(csvUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const text = await res.text()
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return null

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''))

    // Detectar índices de columnas por nombre (robusto ante reordenación)
    const idx = {
      id:            headers.findIndex(h => h === 'cid' || h === 'id'),
      cliente:       headers.findIndex(h => h === 'nombre' || h === 'cliente'),
      mes:           headers.findIndex(h => h === 'mes'),
      fechaArranque: headers.findIndex(h => h.includes('arranque') || h.includes('fecha')),
      vendedor:      headers.findIndex(h => h === 'vendedor'),
      tamanoEmpresa: headers.findIndex(h => h.includes('empresa')),
      tamanoCuenta:  headers.findIndex(h => h.includes('cuenta')),
      primerPago:    headers.findIndex(h => h.includes('pago') || h.includes('1er')),
    }

    const records = lines.slice(1).map(line => {
      const c = parseCSVLine(line)
      const g = (i: number) => (i >= 0 ? c[i] ?? '' : '')
      return {
        id:            g(idx.id),
        cliente:       g(idx.cliente),
        mes:           g(idx.mes),
        fechaArranque: g(idx.fechaArranque),
        vendedor:      normalizeVendedor(g(idx.vendedor)),
        tamanoEmpresa: normalizeTamanoEmpresa(g(idx.tamanoEmpresa)),
        tamanoCuenta:  g(idx.tamanoCuenta).toLowerCase().trim(),
        primerPago:    parsePeso(g(idx.primerPago)),
      }
    }).filter(r => r.id && r.cliente)

    if (records.length === 0) return null

    // ── Agregaciones ──────────────────────────────────────────────────────────
    const byMes    = new Map<string, { count: number; facturacion: number; sortKey: number }>()
    const byVnd    = new Map<string, { count: number; facturacion: number }>()
    const byCuenta = new Map<string, number>()
    const byEmpresa= new Map<string, number>()

    let totalFac = 0
    let sinVnd   = 0

    for (const r of records) {
      // Mes
      const { label, sortKey } = parseFecha(r.fechaArranque)
      if (label) {
        const m = byMes.get(label) ?? { count: 0, facturacion: 0, sortKey }
        m.count++; m.facturacion += r.primerPago
        byMes.set(label, m)
      }

      // Vendedor
      const vd = byVnd.get(r.vendedor) ?? { count: 0, facturacion: 0 }
      vd.count++; vd.facturacion += r.primerPago
      byVnd.set(r.vendedor, vd)
      if (r.vendedor === 'Sin vendedor') sinVnd++

      // Tamaño cuenta
      const tc = r.tamanoCuenta || 'N/A'
      byCuenta.set(tc, (byCuenta.get(tc) ?? 0) + 1)

      // Tamaño empresa
      const te = r.tamanoEmpresa || 'N/A'
      byEmpresa.set(te, (byEmpresa.get(te) ?? 0) + 1)

      totalFac += r.primerPago
    }

    const porMes: MesDato[] = Array.from(byMes.entries())
      .map(([mes, d]) => ({ mes, ...d }))
      .sort((a, b) => a.sortKey - b.sortKey)

    const porVendedor: VendedorDato[] = Array.from(byVnd.entries())
      .map(([vendedor, d]) => ({ vendedor, ...d }))
      .sort((a, b) => b.count - a.count)

    const porTamanoCuenta: TamanoDato[] = Array.from(byCuenta.entries())
      .map(([tamano, count]) => ({ tamano, count }))
      .sort((a, b) => b.count - a.count)

    const porTamanoEmpresa: TamanoDato[] = Array.from(byEmpresa.entries())
      .map(([tamano, count]) => ({ tamano, count }))
      .sort((a, b) => b.count - a.count)

    // Últimas 20 por fecha
    const recientes: Reciente[] = [...records]
      .sort((a, b) => {
        const { sortKey: sa } = parseFecha(a.fechaArranque)
        const { sortKey: sb } = parseFecha(b.fechaArranque)
        return sb - sa
      })
      .slice(0, 20)

    return {
      total:            records.length,
      facturacionTotal: totalFac,
      promedioPago:     records.length > 0 ? totalFac / records.length : 0,
      pctSinVendedor:   records.length > 0 ? (sinVnd / records.length) * 100 : 0,
      porMes,
      porVendedor,
      porTamanoCuenta,
      porTamanoEmpresa,
      recientes,
      updatedAt: new Date().toISOString(),
    }

  } catch (err) {
    console.error('[activaciones] Error:', err)
    return null
  }
}

// ── Página ────────────────────────────────────────────────────────────────────
export default async function ActivacionesPage() {
  const data = await getActivacionesData()

  if (!data) {
    return (
      <main style={{ minHeight: '100vh', background: BG, padding: '48px 32px' }}>
        <div style={{
          maxWidth: 520, margin: '0 auto', padding: '40px 32px', borderRadius: 16,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: TX, marginBottom: 12 }}>
            Configuración pendiente
          </h2>
          <p style={{ fontSize: 14, color: TX_MID, lineHeight: 1.7, marginBottom: 24 }}>
            Para activar el Tablero de Activaciones, publica la hoja <strong style={{ color: TX }}>Registros</strong> de Google Sheets como CSV y agrega la URL al archivo <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>.env.local</code>.
          </p>
          <div style={{
            background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.20)',
            borderRadius: 10, padding: '16px 20px', textAlign: 'left',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#00B4FF', marginBottom: 10 }}>
              Pasos en Google Sheets:
            </p>
            {[
              'Archivo → Compartir → Publicar en la web',
              'Seleccionar hoja "Registros" y formato CSV',
              'Hacer clic en Publicar → Copiar URL',
              'Agregar al .env.local como ACTIVACIONES_CSV_URL',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#00B4FF20',
                  color: '#00B4FF', fontSize: 11, fontWeight: 800, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: TX_MID }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: BG }}>
      {/* Header */}
      <div style={{
        padding: '28px 32px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, lineHeight: 1 }}>
              Tablero de Activaciones
            </h1>
            <p style={{ fontSize: 13, color: TX_MID, marginTop: 6 }}>
              Datos en tiempo real · Hoja <strong style={{ color: TX }}>Registros</strong> · {data.total.toLocaleString('es-MX')} activaciones totales
            </p>
          </div>
          <p style={{ fontSize: 11, color: TX_MID }}>
            Fuente: Tablero de Activaciones 2.0
          </p>
        </div>
      </div>

      {/* Charts */}
      <div style={{ padding: '0 32px 48px' }}>
        <ActivacionesCharts data={data} />
      </div>
    </main>
  )
}
