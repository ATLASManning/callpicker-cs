/**
 * CUÁNTAS DE LAS 2,820 ACTIVACIONES SON «CLIENTE» Y CUÁNTAS «CUENTA»
 * ===================================================================
 *
 *     npm run mide:distintivo
 *
 * La regla de dirección (18 nov 2026): si falta información es **Cuenta**; si
 * la ficha del apartado Cuentas está completa, es **Cliente**.
 *
 * Esto NO vuelve a escribir la regla: importa `clasifica` de
 * `lib/clasificacion-entrega.ts`, que a su vez importa los requisitos del
 * catálogo del motor. Si la pantalla y esta medición no comparten la regla, un
 * día dirán cosas distintas y las dos parecerán ciertas.
 *
 * TRES RESULTADOS, NO DOS
 * -----------------------
 * `cliente`, `cuenta porque le falta algo` y `cuenta porque no está en el
 * apartado Cuentas` son cosas distintas y piden cosas distintas. Juntarlas en
 * «no es cliente» escondería que la inmensa mayoría ni siquiera se gestiona
 * desde CS.
 */
import fs   from 'fs'
import path from 'path'

const RAIZ = path.join(__dirname, '..')

/* El módulo de clasificación arrastra `lib/supabase`, que crea su cliente AL
   IMPORTARSE leyendo el entorno. Next lo tiene; `ts-node` no. Se puebla antes
   de importar nada, y por eso los imports de abajo son dinámicos. */
for (const linea of fs.readFileSync(path.join(RAIZ, '.env.local'), 'utf8').split(/\r?\n/)) {
  const l = linea.trim()
  if (!l || l.startsWith('#')) continue
  const i = l.indexOf('=')
  if (i < 0) continue
  const k = l.slice(0, i).trim()
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '')
}

async function main() {
  const { cargaHoja } = await import('../lib/hoja-activaciones')
  const { clasifica, CAMPOS_CLASIFICACION } = await import('../lib/clasificacion-entrega')

  console.log('')
  console.log('  CUENTA o CLIENTE, SOBRE LAS ACTIVACIONES REALES')
  console.log('  ' + '='.repeat(72))

  const hoja = await cargaHoja()
  if (!hoja) { console.log('  *** no se pudo leer data/activaciones.xlsx'); process.exit(2) }
  const filas = Array.from(hoja.filas.values())
  console.log(`\n  ${filas.length} activaciones en la hoja`)

  /* ── Las fichas, por CID, en páginas ──────────────────────────────────── */
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const fichas = new Map<string, Record<string, unknown>>()
  let desde = 0
  for (;;) {
    const url = `${base}/rest/v1/cuentas?select=${encodeURIComponent(CAMPOS_CLASIFICACION)}`
              + `&limit=1000&offset=${desde}`
    const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!r.ok) {
      console.log(`  *** no se pudo leer cuentas: HTTP ${r.status}`)
      console.log('      Eso NO es «ninguna es cliente»: es que no se midió.')
      process.exit(1)
    }
    const pag = await r.json() as Array<Record<string, unknown>>
    for (const c of pag) {
      const k = String(c.cid ?? '').trim()
      if (k) fichas.set(k, c)
    }
    if (pag.length < 1000) break
    desde += 1000
  }
  console.log(`  ${fichas.size} fichas con CID en el apartado Cuentas`)

  /* ── El reparto ───────────────────────────────────────────────────────── */
  let cliente = 0, incompleta = 0, fuera = 0
  const porFaltante = new Map<string, number>()
  const ejemplos: string[] = []

  for (const f of filas) {
    const c = clasifica(fichas.get(f['id']) ?? null)
    if (c.distintivo === 'cliente') {
      cliente++
      if (ejemplos.length < 8) ejemplos.push(`${f['cliente']} (${f['id']})`)
      continue
    }
    if (c.motivo === 'fuera') { fuera++; continue }
    incompleta++
    for (const x of c.faltan) porFaltante.set(x.etiqueta, (porFaltante.get(x.etiqueta) ?? 0) + 1)
  }

  console.log('')
  console.log('  EL REPARTO')
  console.log('  ' + '-'.repeat(72))
  const pct = (n: number) => `${((n / filas.length) * 100).toFixed(1)}%`
  console.log(`    CLIENTE  (ficha completa) .................. ${cliente}  ${pct(cliente)}`)
  console.log(`    CUENTA   en Cuentas, le falta información .. ${incompleta}  ${pct(incompleta)}`)
  console.log(`    CUENTA   no está en el apartado Cuentas .... ${fuera}  ${pct(fuera)}`)
  const suma = cliente + incompleta + fuera
  if (suma !== filas.length) {
    console.log(`    *** NO CIERRA: ${suma} de ${filas.length}`)
    process.exit(1)
  }
  console.log(`    (cierra: ${suma} de ${filas.length})`)

  if (incompleta) {
    console.log('')
    console.log('  QUÉ FALTA EN LAS QUE SÍ ESTÁN EN CUENTAS')
    console.log('  ' + '-'.repeat(72))
    for (const [etiqueta, n] of Array.from(porFaltante).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${String(n).padStart(4)}  ${etiqueta}`)
    }
    console.log('    (una activación puede faltarle más de una cosa, así que esta')
    console.log('     columna NO suma el total de arriba: no es un reparto)')
  }

  if (ejemplos.length) {
    console.log('')
    console.log('  ALGUNOS CLIENTES')
    console.log('  ' + '-'.repeat(72))
    for (const e of ejemplos) console.log(`    ${e}`)
  }

  console.log('')
  console.log('  La medición cierra.')
}

main().catch(e => { console.error(e); process.exit(2) })
