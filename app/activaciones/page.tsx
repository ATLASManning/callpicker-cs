import path from 'path'
import { anoDeXlsx } from '@/lib/fecha-xlsx'
import ActivacionesCharts, { RegistroItem } from '@/components/charts/ActivacionesCharts'
import ActivacionesDiagnostico from '@/components/charts/ActivacionesDiagnostico'
import SoloEnCliente, { ReservaGrafica } from '@/components/charts/SoloEnCliente'
import ActivacionesGrandes from '@/components/charts/ActivacionesGrandes'

export const dynamic = 'force-dynamic'

/* Paleta del Customer Success Operating System — ver
   `components/charts/ActivacionesCharts.tsx` para la tabla completa. */
const TX     = '#202E3B'   // --ink
const TX_MID = '#3D4B5C'

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
  /** Filas que compartían ID con otra y se fundieron. Se dice, no se calla. */
  duplicadasQuitadas: number
  /** Cuántas salvó el año sacado de la fecha de pago. */
  recuperadas: number
}> {
  try {
    // Importación dinámica para que Next.js no falle en build client-side
    const xlsx = (await import('xlsx')).default
    const fs   = (await import('fs')).default
    const filePath = path.join(process.cwd(), 'data', 'activaciones.xlsx')

    if (!fs.existsSync(filePath)) {
      console.warn('[activaciones] Excel no encontrado en', filePath)
      return { registros: [], descartadas: [], duplicadasQuitadas: 0, recuperadas: 0 }
    }

    const wb   = xlsx.readFile(filePath)
    const ws   = wb.Sheets['Hoja1']
    if (!ws) {
      console.warn('[activaciones] Hoja Hoja1 no encontrada')
      return { registros: [], descartadas: [], duplicadasQuitadas: 0, recuperadas: 0 }
    }

    const raw: Record<string, any>[] = xlsx.utils.sheet_to_json(ws, { defval: '' })

    const conIdYCliente = raw.filter(r => r['ID'] && r['Cliente'])

    /* ── DOS FILAS CON EL MISMO ID SON UNA ACTIVACIÓN, NO DOS ───────────────
       El corte del 16 oct 2026 trajo seis IDs repetidos, y los seis son el
       MISMO cliente, el MISMO día, el MISMO importe y el MISMO mes, dos veces:
       una fila completa y otra a medio capturar, sin `Año`, sin ejecutivo y
       sin días. No son dos activaciones, es la misma apuntada dos veces.

       Hasta hoy no se notaba porque el filtro de año las tiraba de rebote —la
       copia incompleta no tiene año—, o sea que lo correcto pasaba por
       casualidad. En cuanto el año se recupera de la fecha de pago (abajo),
       esa casualidad se acaba y cada una contaría doble.

       Se queda la fila MÁS COMPLETA. Y lo que se descarta se cuenta: no se
       tira nada en silencio. [[activaciones-fuente]] */
    const llenos = (r: Record<string, any>) =>
      Object.values(r).filter(v => v !== '' && v !== null && v !== undefined).length
    const porId = new Map<string, Record<string, any>>()
    let duplicadasQuitadas = 0
    for (const r of conIdYCliente) {
      const k = String(r['ID']).trim()
      const previa = porId.get(k)
      if (!previa) { porId.set(k, r); continue }
      duplicadasQuitadas++
      if (llenos(r) > llenos(previa)) porId.set(k, r)
    }
    const unicas = Array.from(porId.values())

    const filas = unicas
      .map(r => ({
        id:             String(r['ID']),
        cliente:        String(r['Cliente']).trim(),
        primerPago:     typeof r['1er Pago'] === 'number' ? r['1er Pago'] : parseFloat(String(r['1er Pago']).replace(/[$,]/g, '')) || 0,
        tamano:         normTamano(String(r['Tamaño'])),
        ejecutivo:      normEjecutivo(String(r['Ejecutivo'])),
        mes:            String(r['Mes 1er Pago']).trim(),
        /* SI LA COLUMNA «Año» VIENE VACÍA, SE SACA DE LA FECHA DE PAGO.
           Es el caso GAMP otra vez, y van tres cortes. En el del 16 oct 2026
           había CUATRO activaciones pagadas de octubre —Cityplanners $1,470,
           cp190206 $1,558, Avagic $1,029 y Plastitabla $379, $4,436 en
           total— con `Fecha 1er Pago` del 8 y el 14 de octubre y la casilla
           del año en blanco. El filtro de abajo las tiraba enteras.
           La fecha de pago es un dato mejor que la casilla del año: la
           escribe el cobro, no el capturista. Si tampoco hay fecha, queda 0 y
           el filtro la descarta — contándola, como siempre. */
        ano:            typeof r['Año'] === 'number' ? r['Año']
                        : parseInt(String(r['Año'])) || anoDeXlsx(r['Fecha 1er Pago']) || 0,
        anoRecuperado:  !(typeof r['Año'] === 'number' || parseInt(String(r['Año'])))
                        && anoDeXlsx(r['Fecha 1er Pago']) !== null,
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
    const recuperadas = validas.filter(r => r.anoRecuperado).length
    return { registros: validas, descartadas, duplicadasQuitadas, recuperadas }

  } catch (err) {
    console.error('[activaciones] Error leyendo Excel:', err)
    return { registros: [], descartadas: [], duplicadasQuitadas: 0, recuperadas: 0 }
  }
}

// ── Página ────────────────────────────────────────────────────────────────────
export default async function ActivacionesPage() {
  const { registros, descartadas, duplicadasQuitadas, recuperadas } = await getRegistros()

  if (registros.length === 0) {
    return (
      <div style={{ minHeight: '100%', padding: '48px 32px' }}>
        <div style={{
          maxWidth: 500, margin: '0 auto', padding: '40px 32px', borderRadius: 16,
          background: '#FFFFFF', border: '1px solid #DFE8EF',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: TX, marginBottom: 12 }}>
            Archivo no encontrado
          </h2>
          <p style={{ fontSize: 14, color: TX_MID, lineHeight: 1.7 }}>
            Coloca el archivo <code style={{ background: '#F5F8FB', padding: '2px 6px', borderRadius: 4 }}>
              activaciones.xlsx
            </code> en la carpeta <code style={{ background: '#F5F8FB', padding: '2px 6px', borderRadius: 4 }}>
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
    // Va en <div> y no en <main>. OJO: el motivo que decía este comentario ya
    // NO existe — citaba un `main{background:#DBEAFE !important}` de
    // `globals.css`, y hoy esa regla sólo trae `width` y `padding`. Se deja en
    // <div> porque el layout ya monta su propio <main> alrededor y anidar otro
    // sería marcado inválido; pero que nadie lo cambie buscando un fondo que
    // ya no está.
    <div style={{ minHeight: '100%' }}>
      {/* Lo que el archivo trae y la pantalla NO puede mostrar. Va arriba de
          todo y con nombre y apellido, porque el arreglo está en la hoja de
          origen, no aquí: una celda de año vacía en Excel llega como 1899. */}
      {descartadas.length > 0 && (
        <div style={{ margin: '16px 32px 0', padding: '12px 16px', borderRadius: 12,
                      background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#7C2D12', marginBottom: 6 }}>
            {/* «activaciónes» NO EXISTE. El plural de «activación» pierde el
                acento: activaciones. Estuvo así desde que se escribió el
                aviso, en el único texto que se lee cuando algo va mal. */}
            {descartadas.length === 1
              ? '1 activación del archivo no aparece abajo'
              : `${descartadas.length} activaciones del archivo no aparecen abajo`}
            : no hay con qué fecharla{descartadas.length !== 1 ? 's' : ''}
          </p>
          <p style={{ fontSize: 12, color: '#9A3412', lineHeight: 1.6 }}>
            {/* El texto decía sólo «Excel la entrega como 1899». Desde que el
                año se recupera de la fecha de pago, lo que queda aquí es otra
                cosa: filas SIN año y SIN fecha de primer pago, o sea sin
                ningún dato con el que situarlas en el tiempo. Decir la causa
                vieja manda a buscar donde ya no está el problema. */}
            Les falta la casilla «Año» <strong>y</strong> la «Fecha 1er Pago», así que no
            hay forma de saber a qué corte pertenecen. Se arregla en la hoja de origen,
            capturando cualquiera de las dos:
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

      {/* LO QUE EL MÓDULO ARREGLÓ DEL ARCHIVO, DICHO EN VOZ ALTA.
          Recuperar un dato en silencio es tan opaco como tirarlo en silencio:
          quien mantiene la hoja de origen no se entera de que hay filas a
          medio capturar, y el mes siguiente vuelven. Esto no es un error del
          tablero — es trabajo pendiente en la hoja. */}
      {(duplicadasQuitadas > 0 || recuperadas > 0) && (
        <div style={{ margin: '16px 32px 0', padding: '12px 16px', borderRadius: 12,
                      background: '#F5F8FB', border: '1px solid #DFE8EF' }}>
          <p style={{ fontSize: 12, color: '#3D4B5C', lineHeight: 1.6 }}>
            {recuperadas > 0 && (
              <>
                <strong>{recuperadas === 1 ? '1 activación' : `${recuperadas} activaciones`}</strong>{' '}
                {recuperadas === 1
                  ? 'traía la casilla «Año» en blanco y se recuperó'
                  : 'traían la casilla «Año» en blanco y se recuperaron'}{' '}
                con la fecha del primer pago, así que sí{' '}
                {recuperadas === 1 ? 'cuenta' : 'cuentan'} abajo. Conviene capturar el año
                en la hoja.{' '}
              </>
            )}
            {duplicadasQuitadas > 0 && (
              <>
                <strong>{duplicadasQuitadas} fila{duplicadasQuitadas !== 1 ? 's' : ''}</strong>{' '}
                compartía{duplicadasQuitadas !== 1 ? 'n' : ''} ID con otra —el mismo cliente
                apuntado dos veces, una de ellas a medio capturar— y se fundi
                {duplicadasQuitadas !== 1 ? 'eron' : 'ó'} con la más completa: una activación,
                no dos.
              </>
            )}
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '28px 32px 24px',
        borderBottom: '1px solid #DFE8EF',
        background: 'linear-gradient(180deg, rgba(29,108,170,0.06) 0%, #F5F8FB 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: TX, lineHeight: 1, letterSpacing: '-0.02em' }}>
              Activaciones 2.0
            </h1>
            <p style={{ fontSize: 13, color: TX_MID, marginTop: 8 }}>
              {activaciones.length.toLocaleString('es-MX')} activaciones{demos > 0 && <> &middot; {demos.toLocaleString('es-MX')} demos</>} &middot; {anos.join(' · ')} &middot; Facturación total{' '}
              <strong style={{ color: '#1D6CAA' }}>
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(totalFac)}
              </strong>
            </p>
          </div>
          <p style={{ fontSize: 11, color: '#6A7889' }}>
            Fuente: Tablero de Activaciones 2.0 · Hoja Registros
          </p>
        </div>
      </div>

      {/* Charts */}
      <div style={{ padding: '28px 32px 64px' }}>
        <SoloEnCliente reserva={<ReservaGrafica alto={420} />}>
            <ActivacionesCharts registros={registros} anos={anos} />
          </SoloEnCliente>
        <ActivacionesGrandes registros={registros} />
        <SoloEnCliente reserva={<ReservaGrafica alto={320} />}>
            <ActivacionesDiagnostico registros={registros} />
          </SoloEnCliente>
      </div>
    </div>
  )
}
