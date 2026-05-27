import path from 'path'
import ActivacionesCharts, { RegistroItem } from '@/components/charts/ActivacionesCharts'

export const dynamic = 'force-dynamic'

const BG     = '#0A1628'
const TX     = '#E8F4FF'
const TX_MID = 'rgba(200,228,255,0.65)'

// ── Normalización ─────────────────────────────────────────────────────────────
function normVendedor(v: string): string {
  const lc = (v || '').trim().toLowerCase()
  if (!lc || lc === 'sin vendedor' || lc.startsWith('sin')) return 'Sin vendedor'
  if (lc === 'otro' || lc === 'other')  return 'Otro'
  if (lc === 'm.mandujano')             return 'M. Mandujano'
  return v.trim()
}
function normEjecutivo(e: string): string {
  const lc = (e || '').trim().toLowerCase()
  if (!lc || lc === 'n/a' || lc === '')  return 'N/A'
  if (lc === 'otro' || lc === 'other')   return 'Otro'
  return e.trim()
}
function normTamano(t: string): string {
  const lc = (t || '').trim().toLowerCase()
  if (!lc || lc === '-') return 'N/A'
  return t.trim().toLowerCase()
}
function normGiro(g: string): string {
  if (!g || g.trim() === '') return 'N/A'
  const lc = g.trim().toLowerCase()
  if (lc === 'bienes raices' || lc === 'bienes raíces') return 'Bienes Raíces'
  return g.trim().charAt(0).toUpperCase() + g.trim().slice(1)
}
function normTipo(t: string): string {
  if (!t || t.trim() === '') return 'N/A'
  return t.trim().toLowerCase()
}

// ── Lectura del Excel ─────────────────────────────────────────────────────────
async function getRegistros(): Promise<RegistroItem[]> {
  try {
    // Importación dinámica para que Next.js no falle en build client-side
    const xlsx = (await import('xlsx')).default
    const fs   = (await import('fs')).default
    const filePath = path.join(process.cwd(), 'data', 'activaciones.xlsx')

    if (!fs.existsSync(filePath)) {
      console.warn('[activaciones] Excel no encontrado en', filePath)
      return []
    }

    const wb   = xlsx.readFile(filePath)
    const ws   = wb.Sheets['Registros']
    if (!ws) { console.warn('[activaciones] Hoja Registros no encontrada'); return [] }

    const raw: Record<string, any>[] = xlsx.utils.sheet_to_json(ws, { defval: '' })

    return raw
      .filter(r => r['ID'] && r['Cliente'])
      .map(r => ({
        id:           String(r['ID']),
        cliente:      String(r['Cliente']).trim(),
        primerPago:   typeof r['1er Pago'] === 'number' ? r['1er Pago'] : parseFloat(String(r['1er Pago']).replace(/[$,]/g, '')) || 0,
        tamano:       normTamano(String(r['Tamaño'])),
        ejecutivo:    normEjecutivo(String(r['Ejecutivo'])),
        mes:          String(r['Mes 1er Pago']).trim(),      // January … December
        ano:          typeof r['Año'] === 'number' ? r['Año'] : parseInt(String(r['Año'])) || 0,
        vendedor:     normVendedor(String(r['Vendedor'])),
        giro:         normGiro(String(r['Giro'])),
        tipo:         normTipo(String(r['Tipo'])),           // pagada / demo / convertida
      }))
      .filter(r => r.ano >= 2020)   // excluir filas con año inválido

  } catch (err) {
    console.error('[activaciones] Error leyendo Excel:', err)
    return []
  }
}

// ── Página ────────────────────────────────────────────────────────────────────
export default async function ActivacionesPage() {
  const registros = await getRegistros()

  if (registros.length === 0) {
    return (
      <div style={{ minHeight: '100%', background: '#050D1A', padding: '48px 32px' }}>
        <div style={{
          maxWidth: 500, margin: '0 auto', padding: '40px 32px', borderRadius: 16,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: TX, marginBottom: 12 }}>
            Archivo no encontrado
          </h2>
          <p style={{ fontSize: 14, color: TX_MID, lineHeight: 1.7 }}>
            Coloca el archivo <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>
              activaciones.xlsx
            </code> en la carpeta <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>
              /data
            </code> del proyecto y reinicia el servidor.
          </p>
        </div>
      </div>
    )
  }

  const totalFac = registros.reduce((s, r) => s + r.primerPago, 0)
  const anos     = Array.from(new Set(registros.map(r => r.ano).filter(Boolean))).sort()

  return (
    // Solo <div> — nunca <main> aquí: el CSS del layout tiene main{background:#DBEAFE !important}
    <div style={{ minHeight: '100%', background: '#050D1A' }}>
      {/* Header */}
      <div style={{
        padding: '28px 32px 24px',
        borderBottom: '1px solid rgba(0,180,255,0.12)',
        background: 'linear-gradient(180deg, rgba(0,180,255,0.08) 0%, #050D1A 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#E8F4FF', lineHeight: 1, letterSpacing: '-0.02em' }}>
              Activaciones 2.0
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(200,228,255,0.65)', marginTop: 8 }}>
              {registros.length.toLocaleString('es-MX')} activaciones &middot; {anos.join(' · ')} &middot; Facturación total{' '}
              <strong style={{ color: '#22C55E' }}>
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(totalFac)}
              </strong>
            </p>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(200,228,255,0.35)' }}>
            Fuente: Tablero de Activaciones 2.0 · Hoja Registros
          </p>
        </div>
      </div>

      {/* Charts */}
      <div style={{ padding: '28px 32px 64px' }}>
        <ActivacionesCharts registros={registros} anos={anos} />
      </div>
    </div>
  )
}
