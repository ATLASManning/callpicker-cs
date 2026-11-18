/**
 * CUÁNTOS CLIENTES HAY DETRÁS DE LAS ACTIVACIONES
 * ================================================
 *
 *     npm run mide:clientes
 *
 * El tablero cuenta activaciones y las enseña como si fueran clientes. Esto
 * mide la diferencia sobre las filas reales: cuántas cuentas, cuántos clientes,
 * cuántos clientes tienen más de una cuenta y cuánta facturación de primer pago
 * se concentra en ellos.
 *
 * Usa `lib/clientes-activacion.ts`, el mismo agrupador que usa la pantalla. La
 * regla no se copia aquí: una copia se separa al primer cambio y entonces la
 * medición sale verde mientras la pantalla enseña otra cosa.
 *
 * LO QUE ESTA MEDICIÓN NO PUEDE HACER
 * ------------------------------------
 * La hoja no trae identificador de cliente, sólo el nombre tecleado. La cifra
 * de clientes es una ESTIMACIÓN POR NOMBRE y se imprime diciéndolo. Las dos
 * formas de equivocarse se cuentan aparte y se enseñan: los nombres que son
 * marcadores `cpNNNNNN` (nombre pendiente) y los casos donde el mismo cliente
 * aparece con varias grafías.
 */
import fs   from 'fs'
import path from 'path'
import { agrupaClientes, esMarcadorSinNombre } from '../lib/clientes-activacion'
import { normCol } from '../lib/entrega-apartados'

const RAIZ = path.join(__dirname, '..')
let fallos = 0

function num(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const s = String(v ?? '').replace(/[^0-9.-]/g, '')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

async function main() {
  console.log('')
  console.log('  CUENTAS QUE ACTIVAN vs CLIENTES QUE ACTIVAN')
  console.log('  ' + '='.repeat(72))

  const xlsx = (await import('xlsx')).default
  const ruta = path.join(RAIZ, 'data', 'activaciones.xlsx')
  if (!fs.existsSync(ruta)) { console.log('  *** no existe data/activaciones.xlsx'); process.exit(2) }

  const wb = xlsx.readFile(ruta, { cellDates: true })
  const ws = wb.Sheets['Hoja1']
  if (!ws) { console.log('  *** la hoja «Hoja1» no existe'); process.exit(2) }

  const matriz: unknown[][] = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null })
  const headers = (matriz[0] ?? []).map(h => normCol(String(h ?? '')))
  const filas   = matriz.slice(1)

  const col = (n: string) => headers.indexOf(n)
  const iId   = col('id')
  const iCli  = col('cliente')
  const iTipo = col('tipo')
  const iPago = col('1erpago') >= 0 ? col('1erpago') : col('primerpago')
  const iAno  = col('ano') >= 0 ? col('ano') : col('año')

  if (iId < 0 || iCli < 0) {
    console.log('  *** la hoja no trae ID o Cliente. Encabezados:')
    for (const h of headers) console.log(`      ${h}`)
    process.exit(1)
  }

  /* ── Una cuenta por ID. La fila con más campos llenos gana. ──────────────── */
  const porId = new Map<string, { id: string; cliente: string; tipo: string; pago: number; ano: string; llenas: number }>()
  let sinId = 0
  for (const f of filas) {
    const id  = String(f[iId]  ?? '').trim()
    const cli = String(f[iCli] ?? '').trim()
    if (!id) { sinId++; continue }
    const llenas = f.filter(v => v != null && String(v).trim() !== '').length
    const previa = porId.get(id)
    if (previa && previa.llenas >= llenas) continue
    porId.set(id, {
      id, cliente: cli,
      tipo: iTipo >= 0 ? String(f[iTipo] ?? '').trim().toLowerCase() : '',
      pago: iPago >= 0 ? num(f[iPago]) : 0,
      ano:  iAno  >= 0 ? String(f[iAno] ?? '').trim() : '',
      llenas,
    })
  }
  const cuentas = Array.from(porId.values())

  console.log(`\n  ${filas.length} filas en la hoja`)
  console.log(`  ${cuentas.length} cuentas (IDs únicos) · ${filas.length - cuentas.length - sinId} filas repetidas · ${sinId} sin ID`)

  /* ── 1 · LA DIFERENCIA ───────────────────────────────────────────────────── */
  const g = agrupaClientes(cuentas.map(c => ({ id: c.id, cliente: c.cliente })))
  const conVarias = g.clientes.filter(c => c.cuentas.length > 1)
  const cuentasDeVarias = conVarias.reduce((s, c) => s + c.cuentas.length, 0)

  console.log('')
  console.log('  1 · CUENTAS vs CLIENTES')
  console.log('  ' + '-'.repeat(72))
  console.log(`    cuentas activadas (IDs únicos) ........ ${cuentas.length}`)
  console.log(`    clientes con nombre .................. ${g.clientes.length}   ← estimación POR NOMBRE`)
  console.log(`    cuentas con nombre PENDIENTE (cpNNN) . ${g.sinNombre.length}`)
  console.log(`    cuentas sin nombre de cliente ........ ${g.sinDato.length}`)
  const suma = g.clientes.reduce((s, c) => s + c.cuentas.length, 0) + g.sinNombre.length + g.sinDato.length
  if (suma !== cuentas.length) {
    console.log(`    *** NO CIERRA: ${suma} repartidas de ${cuentas.length}`)
    fallos++
  } else {
    console.log(`    (cierra: ${suma} de ${cuentas.length})`)
  }
  console.log('')
  console.log(`    clientes con MÁS DE UNA cuenta ....... ${conVarias.length}`)
  console.log(`    cuentas que les pertenecen ........... ${cuentasDeVarias}`
    + ` (${((cuentasDeVarias / cuentas.length) * 100).toFixed(1)}% de las cuentas)`)

  /* ── 2 · EN QUÉ SE NOTA ──────────────────────────────────────────────────── */
  console.log('')
  console.log('  2 · LOS QUE MÁS CUENTAS TIENEN')
  console.log('  ' + '-'.repeat(72))
  for (const c of g.clientes.slice(0, 15)) {
    const extra = c.grafias.length > 1 ? `  [${c.grafias.length} grafías: ${c.grafias.join(' / ')}]` : ''
    console.log(`    ${String(c.cuentas.length).padStart(3)}  ${c.nombre}${extra}`)
  }

  /* ── 3 · LAS DOS FORMAS DE EQUIVOCARSE, CONTADAS ─────────────────────────── */
  console.log('')
  console.log('  3 · LO QUE LA HEURÍSTICA NO PUEDE GARANTIZAR')
  console.log('  ' + '-'.repeat(72))
  const variasGrafias = g.clientes.filter(c => c.grafias.length > 1)
  console.log(`    clientes escritos de más de una forma . ${variasGrafias.length}`)
  console.log('    (eso es lo que esta agrupación SÍ cose; lo que NO puede coser es')
  console.log('     «Medexp» contra «Medicall Expert», que no se parecen como texto)')
  const marcadores = cuentas.filter(c => esMarcadorSinNombre(c.cliente))
  const facturaMarcadores = marcadores.reduce((s, c) => s + c.pago, 0)
  console.log('')
  console.log(`    cuentas con marcador cpNNNNNN ........ ${marcadores.length}`)
  console.log(`    primer pago que representan .......... $${facturaMarcadores.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`)
  console.log('    No son clientes distintos: son clientes SIN NOMBRE CAPTURADO.')
  console.log('    Contarlos como clientes inflaría la cifra con uno ficticio por fila.')

  /* ── 4 · POR AÑO, QUE ES COMO SE MIRA EL TABLERO ─────────────────────────── */
  if (iAno >= 0) {
    console.log('')
    console.log('  4 · POR AÑO')
    console.log('  ' + '-'.repeat(72))
    console.log('    año    cuentas   clientes   dif')
    const anos = Array.from(new Set(cuentas.map(c => c.ano).filter(Boolean))).sort()
    for (const a of anos) {
      const delAno = cuentas.filter(c => c.ano === a)
      const ga = agrupaClientes(delAno.map(c => ({ id: c.id, cliente: c.cliente })))
      const cl = ga.clientes.length
      console.log(`    ${a}   ${String(delAno.length).padStart(7)}   ${String(cl).padStart(8)}`
        + `   ${String(delAno.length - cl).padStart(4)}`)
    }
    console.log('    (la columna «clientes» excluye los de nombre pendiente)')
  }

  /* ── 5 · ACTIVAR NO ES SER CLIENTE DE CARTERA ───────────────────────────── */
  console.log('')
  console.log('  5 · LA HOJA DE ACTIVACIONES NO ES EL CENSO DE CLIENTES')
  console.log('  ' + '-'.repeat(72))
  const rutaGrc = path.join(RAIZ, 'data', 'grc-zoho.json')
  if (!fs.existsSync(rutaGrc)) {
    console.log('    NO MEDIDO: falta data/grc-zoho.json.')
  } else {
    const grc = JSON.parse(fs.readFileSync(rutaGrc, 'utf8'))
    const filasGrc: Array<Record<string, unknown>> = grc.filas ?? []
    const conCid = filasGrc.filter(f => String(f.cid ?? '').trim())
    /* OJO CON ESTE CRUCE. En el GRC sólo traen CID las filas de CARTERA
       (aquí, ${conCid.length} de ${filasGrc.length}). Así que esto mide «está en
       la cartera de CS», NO «sigue siendo cliente»: la inmensa mayoría de las
       activaciones son cuentas que nadie gestiona desde CS y que pueden estar
       facturando igual. Leerlo como supervivencia daría una cifra falsa y
       alarmante. */
    const cidsCartera = new Set(conCid.map(f => String(f.cid).trim()))
    const ids = new Set(cuentas.map(c => c.id))
    const enAmbas = Array.from(cidsCartera).filter(c => ids.has(c))
    const soloCartera = Array.from(cidsCartera).filter(c => !ids.has(c))
    console.log(`    filas del GRC ........................ ${filasGrc.length}`)
    console.log(`    de ellas, CON CID (= cartera) ........ ${conCid.length}`
      + ` (${((conCid.length / Math.max(1, filasGrc.length)) * 100).toFixed(1)}%)`)
    /* FILAS CON CID ≠ CIDs DISTINTOS. Una cuenta de cartera puede traer varias
       filas en el GRC. El reparto de abajo es sobre CIDs, así que imprimir sólo
       las filas dejaría la tabla sin cerrar: 81 + 123 da 204, no 222. */
    console.log(`    CIDs distintos entre esas filas ...... ${cidsCartera.size}`
      + ` (${conCid.length - cidsCartera.size} fila(s) comparten CID)`)
    console.log('')
    console.log(`    cuentas de cartera también en la hoja  ${enAmbas.length}`)
    console.log(`    cuentas de cartera que NO están ...... ${soloCartera.length}`)
    if (enAmbas.length + soloCartera.length !== cidsCartera.size) {
      console.log(`    *** NO CIERRA: ${enAmbas.length + soloCartera.length} de ${cidsCartera.size}`)
      fallos++
    } else {
      console.log(`    (cierra: ${enAmbas.length + soloCartera.length} de ${cidsCartera.size} CIDs)`)
    }
    console.log(`    activaciones que NO son de cartera ... ${cuentas.length - enAmbas.length}`)
    console.log('')
    console.log('    Las dos poblaciones apenas se tocan. «Cuenta que activa» y')
    console.log('    «cliente de cartera» no son la misma lista, y ninguna se')
    console.log('    deriva de la otra.')
    console.log('    Esto mide CARTERA, no supervivencia: el CID del GRC sólo')
    console.log('    existe en las filas de cartera, así que una activación fuera')
    console.log('    de esta lista puede estar facturando igual.')
  }

  console.log('')
  if (fallos) { console.log(`  *** ${fallos} comprobación(es) no cerraron.`); process.exit(1) }
  console.log('  La medición cierra.')
}

main().catch(e => { console.error(e); process.exit(2) })
