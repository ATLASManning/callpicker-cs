/**
 * ¿CUÁNTAS CUENTAS NO ESTÁN EN LA HOJA DE ACTIVACIONES?
 * ======================================================
 *
 *     npm run mide:universo
 *
 * POR QUÉ
 * -------
 * El buscador de entregas y los filtros de la ficha salían SÓLO de
 * `data/activaciones.xlsx`. Dirección buscó «CBS Compresores» —cuenta F24, CID
 * 134358, de la cartera de Fátima— y no apareció: **no está en la hoja**. No era
 * un recorte de la búsqueda, era que el universo estaba mal elegido.
 *
 * Esto mide el tamaño real del problema antes de cambiar nada: cuántas cuentas
 * de cartera no tienen fila en la hoja, cuántas activaciones no están en
 * cartera, y cuántas se tocan. Las tres cifras tienen que cerrar contra los dos
 * totales.
 *
 * NO ESCRIBE NADA.
 */
import fs from 'fs'
import path from 'path'

const RAIZ = process.cwd()

/* El `.env.local` se carga ANTES de importar nada que cree el cliente de
   Supabase al importarse: si no, revienta por falta de variables. */
for (const linea of fs.readFileSync(path.join(RAIZ, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}

interface CuentaBreve {
  cid: string | null; empresa: string | null
  consecutivo: string | null; asesor: string | null; estado: string | null
}

async function main() {
  const { cargaHoja } = await import('../lib/hoja-activaciones')

  const hoja = await cargaHoja()
  if (!hoja) throw new Error('No se pudo leer data/activaciones.xlsx')

  /* Por REST y no por `lib/supabase`: ese módulo crea su cliente AL
     IMPORTARSE y revienta fuera de Next por el WebSocket de realtime. */
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const cuentas: CuentaBreve[] = []
  for (let desde = 0; ; desde += 1000) {
    const url = `${base}/rest/v1/cuentas?select=cid,empresa,consecutivo,asesor,estado`
              + `&limit=1000&offset=${desde}`
    const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!r.ok) {
      console.log(`  *** no se pudo leer cuentas: HTTP ${r.status}`)
      console.log('      Eso NO es «no falta ninguna»: es que no se midió.')
      process.exit(1)
    }
    const pag = await r.json() as CuentaBreve[]
    cuentas.push(...pag)
    if (pag.length < 1000) break
  }

  const enHoja = new Set(hoja.filas.keys())

  const sinCid = cuentas.filter(c => !String(c.cid ?? '').trim())
  const conCid = cuentas.filter(c => String(c.cid ?? '').trim())
  const cidsCartera = new Set(conCid.map(c => String(c.cid).trim()))

  const cuentasFueraDeLaHoja = conCid.filter(c => !enHoja.has(String(c.cid).trim()))
  const seTocan = conCid.filter(c => enHoja.has(String(c.cid).trim()))
  const activacionesFueraDeCartera = [...enHoja].filter(id => !cidsCartera.has(id))

  console.log('')
  console.log('  EL UNIVERSO DE LAS ENTREGAS')
  console.log('  ' + '='.repeat(70))
  console.log(`  hoja de Activaciones 2.0 ....... ${hoja.filas.size} activaciones (por ID)`)
  console.log(`  cartera (tabla cuentas) ........ ${cuentas.length} cuentas`)
  console.log(`    de ellas, SIN cid ............ ${sinCid.length}`)
  console.log(`    con cid ...................... ${conCid.length}`)
  console.log('')
  console.log(`  se tocan (cid en las dos) ...... ${seTocan.length}`)
  console.log(`  cuentas de cartera QUE NO ESTÁN EN LA HOJA ... ${cuentasFueraDeLaHoja.length}`)
  console.log(`  activaciones que no están en cartera ......... ${activacionesFueraDeCartera.length}`)
  console.log('')
  console.log(`  universo unido ................. ${hoja.filas.size + cuentasFueraDeLaHoja.length}`)

  /* Que las partes cierren contra los dos totales. Un reparto que no cierra es
     un reparto que no se midió. */
  const fallos: string[] = []
  if (seTocan.length + cuentasFueraDeLaHoja.length !== conCid.length) {
    fallos.push(`cartera con cid: ${seTocan.length} + ${cuentasFueraDeLaHoja.length} ` +
                `!= ${conCid.length}`)
  }
  if (seTocan.length + activacionesFueraDeCartera.length !== hoja.filas.size) {
    /* Ojo: varias cuentas de cartera podrían compartir cid. Si esto no cierra,
       eso es lo primero que hay que mirar. */
    fallos.push(`hoja: ${seTocan.length} + ${activacionesFueraDeCartera.length} ` +
                `!= ${hoja.filas.size} — ¿hay cids repetidos en cuentas?`)
  }
  if (sinCid.length + conCid.length !== cuentas.length) {
    fallos.push('el reparto por cid no suma el total de cuentas')
  }

  console.log('')
  console.log('  ALGUNAS QUE LA HOJA NO TIENE')
  console.log('  ' + '-'.repeat(70))
  for (const c of cuentasFueraDeLaHoja.slice(0, 12)) {
    console.log(`    ${(c.consecutivo ?? '—').padEnd(6)} ${(c.empresa ?? '(sin nombre)').slice(0, 42).padEnd(42)} ` +
                `cid ${c.cid} · ${c.asesor ?? '—'}`)
  }
  if (cuentasFueraDeLaHoja.length > 12) {
    console.log(`    … y ${cuentasFueraDeLaHoja.length - 12} más`)
  }

  if (sinCid.length) {
    console.log('')
    console.log(`  ${sinCid.length} cuenta(s) de cartera NO TIENEN CID, así que no se pueden`)
    console.log('  cruzar contra la hoja ni pedir su expediente por CID. No es que')
    console.log('  falten de la hoja: es que no hay por dónde buscarlas.')
    for (const c of sinCid.slice(0, 8)) {
      console.log(`    ${(c.consecutivo ?? '—').padEnd(6)} ${c.empresa ?? '(sin nombre)'}`)
    }
  }

  console.log('')
  if (fallos.length) {
    console.log('  LA MEDICIÓN NO CIERRA:')
    for (const f of fallos) console.log(`    - ${f}`)
    process.exit(1)
  }
  console.log('  La medición cierra.')
  console.log('')
}

main().catch(e => { console.error(e); process.exit(1) })
