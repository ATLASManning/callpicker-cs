/**
 * CUÁNTO DE LOS 20 APARTADOS CONTESTA YA LA HOJA
 * ===============================================
 *
 *     npm run mide:apartados
 *
 * POR QUÉ EXISTE
 * --------------
 * La auditoría de la Fase 1 dijo, apartado por apartado, qué tiene fuente y
 * qué no. Eso era una LECTURA MÍA sobre 34 encabezados. Esto lo mide sobre las
 * filas reales, para que la conversación sea sobre cifras y no sobre mi
 * impresión.
 *
 * Usa `lib/entrega-apartados.ts`, el mismo catálogo que usará la pantalla. No
 * reescribe sus reglas: una copia se separa al primer cambio y entonces la
 * medición sale verde mientras el expediente está roto.
 *
 * LO PRIMERO QUE COMPRUEBA, Y ES LO MÁS IMPORTANTE
 * ------------------------------------------------
 * Que cada columna declarada en el catálogo EXISTA en la hoja. Si escribí mal
 * un nombre, ese apartado saldría «vacío en el 100% de las filas» y la cifra
 * sería falsa en la dirección más creíble: parecería un hallazgo. Un nombre que
 * no calza aborta la medición en vez de publicar el número.
 */
import fs   from 'fs'
import path from 'path'
import {
  APARTADOS, normCol, expedienteDeHoja, resumenExpediente, fechaDeHoja,
  type FilaHoja, type EstadoApartado,
} from '../lib/entrega-apartados'

const RAIZ = path.join(__dirname, '..')
let fallos = 0

function env(clave: string): string | null {
  const ruta = path.join(RAIZ, '.env.local')
  if (!fs.existsSync(ruta)) return null
  for (const linea of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const l = linea.trim()
    if (l.startsWith(clave + '=')) {
      return l.slice(clave.length + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return null
}

/* ── La hoja, leída igual que la lee la aplicación ─────────────────────────── */
const COLS_FECHA = new Set([
  'fecha1erpago', 'aperturaticket', 'arranquedeproceso', 'cierreticket',
])

function excelSerialToISO(serial: number): string {
  const epoch = new Date(Date.UTC(1899, 11, 30))
  return new Date(epoch.getTime() + serial * 86400000).toISOString().split('T')[0]
}

function fmt(colNorm: string, v: unknown): string {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().split('T')[0]
  if (typeof v === 'number') {
    if (COLS_FECHA.has(colNorm) && v > 40000 && v < 60000) return excelSerialToISO(v)
    return Number.isInteger(v) ? String(v) : v.toFixed(2)
  }
  const s = String(v).trim()
  // Las fechas vienen en dos formatos. Igual que en la ruta del expediente: si
  // las dos reglas se separan, la medición deja de medir lo que se muestra.
  return COLS_FECHA.has(colNorm) ? fechaDeHoja(s) : s
}

async function main() {
  console.log('')
  console.log('  LOS 20 APARTADOS CONTRA LA HOJA REAL')
  console.log('  ' + '='.repeat(72))

  const xlsx = (await import('xlsx')).default
  const ruta = path.join(RAIZ, 'data', 'activaciones.xlsx')
  if (!fs.existsSync(ruta)) {
    console.log('  *** no existe data/activaciones.xlsx')
    process.exit(2)
  }

  const wb = xlsx.readFile(ruta, { cellDates: true })
  const ws = wb.Sheets['Hoja1']
  if (!ws) { console.log('  *** la hoja «Hoja1» no existe'); process.exit(2) }

  const matriz: unknown[][] = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null })
  const headersRaw = (matriz[0] ?? []) as unknown[]
  const headers = headersRaw.map((h, i) =>
    h == null || String(h).trim() === '' ? `Columna ${i + 1}` : String(h).trim())
  const filasRaw = matriz.slice(1)

  console.log(`\n  ${filasRaw.length} filas · ${headers.length} columnas`)

  /* ── 1 · ¿EXISTEN LAS COLUMNAS QUE DECLARA EL CATÁLOGO? ─────────────────── */
  console.log('')
  console.log('  1 · LAS COLUMNAS DECLARADAS EXISTEN EN LA HOJA')
  console.log('  ' + '-'.repeat(72))

  // Un encabezado repetido —«Apertura Ticket» y «Cierre Ticket» salen dos
  // veces— se queda con la PRIMERA aparición. Da igual cuál para medir si está
  // llena, pero hay que decir que hay dos.
  const indicePorCol = new Map<string, number>()
  const repetidas: string[] = []
  headers.forEach((h, i) => {
    const n = normCol(h)
    if (indicePorCol.has(n)) { if (!repetidas.includes(n)) repetidas.push(n) }
    else indicePorCol.set(n, i)
  })
  if (repetidas.length) {
    console.log(`    encabezados repetidos en la hoja: ${repetidas.join(', ')}`)
    console.log('    (se usa la primera aparición de cada uno)')
  }

  const declaradas = Array.from(new Set(APARTADOS.flatMap(a => a.columnas)))
  const inexistentes = declaradas.filter(c => !indicePorCol.has(c))
  if (inexistentes.length) {
    console.log('')
    console.log('    *** COLUMNAS DECLARADAS QUE NO EXISTEN EN LA HOJA:')
    for (const c of inexistentes) console.log(`        ${c}`)
    console.log('')
    console.log('    La medición NO sigue. Un nombre mal escrito haría salir ese')
    console.log('    apartado vacío en el 100% de las filas, y eso se lee como un')
    console.log('    hallazgo en vez de como un error mío.')
    console.log('')
    console.log('    Encabezados reales, normalizados:')
    for (const h of headers) console.log(`        ${normCol(h).padEnd(30)} ← ${h}`)
    process.exit(1)
  }
  console.log(`    ok  las ${declaradas.length} columnas declaradas existen`)

  /* ── 2 · UNA ACTIVACIÓN POR ID ──────────────────────────────────────────── */
  const iId  = indicePorCol.get('id')!
  const iCli = indicePorCol.get('cliente')!

  const porId = new Map<string, FilaHoja>()
  let sinId = 0, idsNoNumericos = 0
  const llenas = (f: FilaHoja) => Object.values(f).filter(v => v !== '').length

  for (const filaArr of filasRaw) {
    const id = fmt('id', filaArr[iId])
    const cli = fmt('cliente', filaArr[iCli])
    if (!id || !cli) { sinId++; continue }
    if (!/^\d+$/.test(id)) idsNoNumericos++

    const fila: FilaHoja = {}
    headers.forEach((h, i) => {
      const n = normCol(h)
      if (!(n in fila)) fila[n] = fmt(n, filaArr[i])
    })
    const previa = porId.get(id)
    if (!previa || llenas(fila) > llenas(previa)) porId.set(id, fila)
  }

  const activaciones = Array.from(porId.values())
  console.log('')
  console.log('  2 · POBLACIÓN MEDIDA')
  console.log('  ' + '-'.repeat(72))
  console.log(`    ${activaciones.length} activaciones únicas por ID`)
  console.log(`    ${filasRaw.length - sinId - activaciones.length} filas fundidas por ID repetido`)
  console.log(`    ${sinId} filas sin ID o sin cliente, fuera de la medición`)
  console.log(`    ${idsNoNumericos} ID(s) que NO son un número — un ID que no es`)
  console.log('      un número no es un ID, y se disfraza de renumeración')

  /* ── 3 · APARTADO POR APARTADO ──────────────────────────────────────────── */
  console.log('')
  console.log('  3 · CADA APARTADO, SOBRE LAS ' + activaciones.length + ' ACTIVACIONES')
  console.log('  ' + '-'.repeat(72))
  console.log('    ' + 'apartado'.padEnd(42)
    + 'compl.  falta  otra fte  s/fte  n/med')

  const conteo = new Map<string, Record<EstadoApartado, number>>()
  for (const ap of APARTADOS) {
    conteo.set(ap.clave, {
      completo: 0, falta: 0, otra_fuente: 0, sin_fuente: 0, no_medible: 0,
    })
  }

  const expedientes = activaciones.map(expedienteDeHoja)
  for (const exp of expedientes) {
    for (const v of exp) conteo.get(v.clave)![v.estado]++
  }

  for (const ap of APARTADOS) {
    const c = conteo.get(ap.clave)!
    const marca = ap.cierraConLaHoja ? ' *' : ''
    console.log('    ' + `${ap.clave} ${ap.titulo}`.slice(0, 40).padEnd(42)
      + String(c.completo).padStart(6)
      + String(c.falta).padStart(7)
      + String(c.otra_fuente).padStart(10)
      + String(c.sin_fuente).padStart(7)
      + String(c.no_medible).padStart(7) + marca)
  }
  console.log('')
  console.log('    * los apartados que la HOJA cierra por sí sola. En los demás,')
  console.log('      lo que la hoja trae se MUESTRA pero no cierra el apartado.')

  /* El assert de cierre: cada apartado tiene que sumar la población entera. */
  for (const ap of APARTADOS) {
    const c = conteo.get(ap.clave)!
    const suma = c.completo + c.falta + c.otra_fuente + c.sin_fuente + c.no_medible
    if (suma !== activaciones.length) {
      console.log(`    *** el apartado ${ap.clave} suma ${suma} y no ${activaciones.length}`)
      fallos++
    }
  }

  /* ── 4 · CUÁNTAS ACTIVACIONES TIENEN EL EXPEDIENTE COMPLETO ─────────────── */
  console.log('')
  console.log('  4 · EXPEDIENTES COMPLETOS, CON LO QUE LA HOJA DA')
  console.log('  ' + '-'.repeat(72))

  const resumenes = expedientes.map(resumenExpediente)
  const sinFaltas = resumenes.filter(r => r.faltan === 0).length
  const conPct    = resumenes.filter(r => r.pctDeLoQueCierraLaHoja !== null)
  const media = conPct.length
    ? conPct.reduce((s, r) => s + (r.pctDeLoQueCierraLaHoja ?? 0), 0) / conPct.length
    : null

  const m0 = resumenes[0]
  console.log(`    De los 20 apartados, la HOJA cierra ${m0.cierraHoja}.`)
  console.log(`    ${m0.otraFuente} los cierra otra fuente del sistema (cuentas, GRC,`)
  console.log('      contratos, DIDs), que se consulta del lado del servidor.')
  console.log(`    ${m0.sinFuente} no tienen fuente en ningún sitio y ${m0.noMedibles} no es medible.`)
  console.log('')
  console.log(`    ${sinFaltas} de ${activaciones.length} activaciones tienen completos los`)
  console.log(`      ${m0.cierraHoja} que la hoja cierra`
    + ` (${(sinFaltas / activaciones.length * 100).toFixed(1)}%)`)
  console.log(media === null
    ? '    media: NO MEDIBLE (la hoja no cierra ningún apartado)'
    : `    media: ${media.toFixed(1)}% de los ${m0.cierraHoja} que la hoja cierra`)

  console.log('')
  console.log('    LOS APARTADOS SIN FUENTE, con palabras y no con un hueco:')
  for (const ap of APARTADOS.filter(a => a.cuandoVacio === 'sin_fuente')) {
    console.log(`      ${ap.clave} ${ap.titulo}`)
  }
  for (const ap of APARTADOS.filter(a => a.cuandoVacio === 'no_medible')) {
    console.log(`      ${ap.clave} ${ap.titulo}  — NO MEDIBLE`)
  }

  /* ── 5 · LOS APARTADOS 05–08 NO SALEN DE LA HOJA: SALEN DE `cuentas` ────── */
  console.log('')
  console.log('  5 · CONTACTOS: LA FUENTE ES `cuentas`, NO LA HOJA')
  console.log('  ' + '-'.repeat(72))

  const URL = env('NEXT_PUBLIC_SUPABASE_URL')
  const KEY = env('SUPABASE_SERVICE_ROLE_KEY') ?? env('SUPABASE_SERVICE_KEY')
  if (!URL || !KEY) {
    console.log('    sin credenciales en .env.local — NO MEDIDO.')
    console.log('    (que no se pueda medir no es que esté vacío)')
  } else {
    const res = await fetch(
      `${URL}/rest/v1/cuentas?select=id,empresa,contacto_nombre,contacto_cargo,`
      + 'contacto_tel,contacto_email,contactos_json&limit=5000',
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
    if (!res.ok) {
      console.log(`    *** no se pudo leer \`cuentas\`: HTTP ${res.status} — NO MEDIDO`)
      fallos++
    } else {
      const cuentas = await res.json() as Record<string, unknown>[]
      const lleno = (v: unknown) => typeof v === 'string' && v.trim() !== ''
      const segundos = (c: Record<string, unknown>) => {
        const j = c.contactos_json
        return Array.isArray(j) ? j.length : 0
      }
      const total = cuentas.length
      const pct = (n: number) => `${n} de ${total} (${(n / total * 100).toFixed(1)}%)`
      console.log(`    ${total} cuentas en cartera`)
      console.log(`    05 nombre del contacto 1 : ${pct(cuentas.filter(c => lleno(c.contacto_nombre)).length)}`)
      console.log(`       …y su cargo           : ${pct(cuentas.filter(c => lleno(c.contacto_cargo)).length)}`)
      console.log(`    07 teléfono 1            : ${pct(cuentas.filter(c => lleno(c.contacto_tel)).length)}`)
      console.log(`    08 correo 1              : ${pct(cuentas.filter(c => lleno(c.contacto_email)).length)}`)
      console.log(`    06/07/08 un SEGUNDO contacto en contactos_json:`)
      console.log(`                             : ${pct(cuentas.filter(c => segundos(c) >= 2).length)}`)
      console.log('')
      console.log('    El apartado 06 pide un segundo responsable. Ese porcentaje es')
      console.log('    el techo real de lo que se puede entregar sin inventarlo.')
    }
  }

  console.log('')
  console.log('  ' + '='.repeat(72))
  if (fallos) {
    console.log(`  *** ${fallos} problema(s) en la medición ***`)
    console.log('')
    process.exit(1)
  }
  console.log('  Cada apartado cierra contra la población entera.')
  console.log('')
}

main().catch(e => { console.error(e); process.exit(1) })
