import path from 'path'
import ActivacionesCharts, { RegistroItem } from '@/components/charts/ActivacionesCharts'
import ActivacionesDiagnostico from '@/components/charts/ActivacionesDiagnostico'
import ActivacionesGrandes from '@/components/charts/ActivacionesGrandes'

export const dynamic = 'force-dynamic'

const TX     = '#0F172A'
const TX_MID = '#475569'

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
/** Una fila que el filtro de año aparta. Lleva `primerPago` para poder decir
 *  si alguna de las apartadas habría entrado al corte de las grandes: sin el
 *  importe, el módulo no puede afirmar que no se le escapó ninguna. */
interface Descartada {
  id: string; cliente: string; ejecutivo: string; ano: number; primerPago: number
}

/* El tipo declarado decía `Promise<RegistroItem[]>` y la función devuelve un
   objeto con dos listas. `next.config.js` trae `ignoreBuildErrors`, así que
   compilaba mintiendo. */
async function getRegistros(): Promise<{
  registros: RegistroItem[]; descartadas: Descartada[]
}> {
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
    const ws   = wb.Sheets['Hoja1']
    if (!ws) { console.warn('[activaciones] Hoja Hoja1 no encontrada'); return [] }

    const raw: Record<string, any>[] = xlsx.utils.sheet_to_json(ws, { defval: '' })

    const conIdYCliente = raw.filter(r => r['ID'] && r['Cliente'])
    const filas = conIdYCliente
      .map(r => ({
        id:             String(r['ID']),
        cliente:        String(r['Cliente']).trim(),
        primerPago:     typeof r['1er Pago'] === 'number' ? r['1er Pago'] : parseFloat(String(r['1er Pago']).replace(/[$,]/g, '')) || 0,
        tamano:         normTamano(String(r['Tamaño'])),
        ejecutivo:      normEjecutivo(String(r['Ejecutivo'])),
        mes:            String(r['Mes 1er Pago']).trim(),
        ano:            typeof r['Año'] === 'number' ? r['Año'] : parseInt(String(r['Año'])) || 0,
        vendedor:       normVendedor(String(r['Vendedor'])),
        giro:           normGiro(String(r['Giro'])),
        tipo:           normTipo(String(r['Tipo'])),
        /* UN CERO AQUÍ SÍ ES UNA MEDICIÓN: significa «se activó el mismo día».
           Esto decía `> 0`, así que 24 activaciones del mismo día se volvían
           «sin medir» y desaparecían del mejor caso de la operación. Medido en
           `scripts/mide-dias-cero.py`: de esas 24, veintidós traen mes,
           importe Y ejecutivo —casi todas `sencillo` y de importe chico, el
           perfil exacto de una activación que se resuelve el mismo día—, y en
           todo el archivo esa columna no tiene ni una celda vacía: 2,121
           números positivos, 24 ceros, 3 negativos y 579 guiones que son
           exactamente los 579 demos.
           Los NEGATIVOS sí son basura de captura —no existen los días
           negativos— y siguen siendo `null`. */
        diasActivacion: typeof r['Dias activacion'] === 'number' && r['Dias activacion'] >= 0 ? r['Dias activacion'] : null,
        contacto:       String(r['¿Se tuvo contacto?'] ?? '').trim() || 'N/A',
        encuesta:       String(r['Encuesta Satisfaccion al cliente'] ?? '').trim() || 'N/A',
        complejidad:    String(r['Complejidad'] ?? '').trim().toLowerCase() || 'N/A',
      }))

    /* El filtro de año se queda —protege de basura— pero YA NO TIRA EN SILENCIO.
       Una celda de año vacía en Excel llega como 1899, así que la activación se
       descartaba y nadie se enteraba. Volvió a pasar en el export del 25 sep
       2026: la de GRUPO CGBS (ID 189992, Cecilia) se perdía entera.
       Un dato que se descarta se CUENTA y se dice. Es la misma regla que la de
       los top-N que tiran el resto sin avisar. */
    const validas = filas.filter(r => r.ano >= 2020)
    const descartadas = filas
      .filter(r => r.ano < 2020)
      .map(r => ({ id: r.id, cliente: r.cliente, ejecutivo: r.ejecutivo,
                   ano: r.ano, primerPago: r.primerPago }))
    return { registros: validas, descartadas }

  } catch (err) {
    console.error('[activaciones] Error leyendo Excel:', err)
    return { registros: [], descartadas: [] }
  }
}

// ── Página ────────────────────────────────────────────────────────────────────
export default async function ActivacionesPage() {
  const { registros, descartadas } = await getRegistros()

  if (registros.length === 0) {
    return (
      <div style={{ minHeight: '100%', padding: '48px 32px' }}>
        <div style={{
          maxWidth: 500, margin: '0 auto', padding: '40px 32px', borderRadius: 16,
          background: '#FFFFFF', border: '1px solid #BFDBFE',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: TX, marginBottom: 12 }}>
            Archivo no encontrado
          </h2>
          <p style={{ fontSize: 14, color: TX_MID, lineHeight: 1.7 }}>
            Coloca el archivo <code style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: 4 }}>
              activaciones.xlsx
            </code> en la carpeta <code style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: 4 }}>
              /data
            </code> del proyecto y reinicia el servidor.
          </p>
        </div>
      </div>
    )
  }

  /* El encabezado cuenta ACTIVACIONES, no filas del archivo. 571 de las 2,721
     son demos: no pagan, no traen mes y no entran a cartera. Se declaran
     aparte en vez de disolverse en el total. */
  const activaciones = registros.filter(r => r.tipo !== 'demo')
  const demos        = registros.length - activaciones.length
  const totalFac = activaciones.reduce((s, r) => s + r.primerPago, 0)
  const anos     = Array.from(new Set(registros.map(r => r.ano).filter(Boolean))).sort()

  return (
    // Solo <div> — nunca <main> aquí: el CSS del layout tiene main{background:#DBEAFE !important}
    <div style={{ minHeight: '100%' }}>
      {/* Lo que el archivo trae y la pantalla NO puede mostrar. Va arriba de
          todo y con nombre y apellido, porque el arreglo está en la hoja de
          origen, no aquí: una celda de año vacía en Excel llega como 1899. */}
      {descartadas.length > 0 && (
        <div style={{ margin: '16px 32px 0', padding: '12px 16px', borderRadius: 12,
                      background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#7C2D12', marginBottom: 6 }}>
            {descartadas.length} activación{descartadas.length !== 1 ? 'es' : ''} del archivo
            no {descartadas.length !== 1 ? 'aparecen' : 'aparece'} abajo: les falta el AÑO
          </p>
          <p style={{ fontSize: 12, color: '#9A3412', lineHeight: 1.6 }}>
            La celda «Año» viene vacía y Excel la entrega como 1899, así que no entra en
            ningún corte. Se arregla en la hoja de origen, capturando el año:
          </p>
          <ul style={{ fontSize: 12, color: '#7C2D12', marginTop: 6, paddingLeft: 18 }}>
            {descartadas.map(d => (
              <li key={d.id}>
                <span style={{ fontWeight: 700 }}>{d.cliente}</span>
                {' '}· ID {d.id} · {d.ejecutivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '28px 32px 24px',
        borderBottom: '1px solid #BFDBFE',
        background: 'linear-gradient(180deg, rgba(0,87,255,0.05) 0%, #EFF6FF 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: TX, lineHeight: 1, letterSpacing: '-0.02em' }}>
              Activaciones 2.0
            </h1>
            <p style={{ fontSize: 13, color: TX_MID, marginTop: 8 }}>
              {activaciones.length.toLocaleString('es-MX')} activaciones{demos > 0 && <> &middot; {demos.toLocaleString('es-MX')} demos</>} &middot; {anos.join(' · ')} &middot; Facturación total{' '}
              <strong style={{ color: '#16A34A' }}>
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(totalFac)}
              </strong>
            </p>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8' }}>
            Fuente: Tablero de Activaciones 2.0 · Hoja Registros
          </p>
        </div>
      </div>

      {/* Charts */}
      <div style={{ padding: '28px 32px 64px' }}>
        <ActivacionesCharts registros={registros} anos={anos} />
        <ActivacionesGrandes registros={registros} />
        <ActivacionesDiagnostico registros={registros} />
      </div>
    </div>
  )
}
