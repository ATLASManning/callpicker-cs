/**
 * PASA CUENTAS A **DORMIDAS**. Por nombre, una por una, con autorización.
 *
 * Instrucción de dirección (4 nov 2026): en cada actualización de Churn hay
 * que sacar el corte TOP y **pasar a Dormidas** las que aparezcan con churn
 * confirmado. `corte-top-churn-confirmado.mjs` saca el corte; éste ejecuta.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * UNA BAJA ES `estado = 'hibernacion'`. NUNCA UN BORRADO.
 *
 * Este guion SÓLO escribe la columna `estado`. No borra filas, no toca
 * `asesor`, `cid`, `facturacion` ni nada más. [[feedback-conciliacion-churn]]
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * POR QUÉ HAY QUE ESCRIBIR `estado` Y NO BASTA CON EL GRC
 *
 * `churn_confirmado` NO es una columna: `app/api/cuentas/route.ts` la DERIVA de
 * `bloqueoComercialDeCuenta`, que lee `NOMBRES_CHURN_GRC`. Y ese set excluye el
 * MES VIVO (`GRC_MES_EN_CURSO`, hoy octubre) por regla de José Manuel del
 * 20 sep 2026. Así que una cuenta con churn de octubre **se sigue viendo en
 * Activas**, y así debe ser mientras octubre no cierre.
 *
 * La alternativa —rotar `GRC_MES_EN_CURSO`— arrastraría a las TRECE cotejables
 * de octubre de un golpe. Cuando dirección autoriza unas cuantas por nombre, la
 * vía correcta es `estado`, que es por cuenta y deja rastro. `getEstadoKey`
 * devuelve '4' con `hibernacion` y `vaEnDormidas` la saca de Activas.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * CÓMO NO APAGAR LA CUENTA EQUIVOCADA
 *
 * El cruce es por nombre, y un nombre puede tocar dos cuentas o ninguna. Por eso
 * el guion **aborta en bloque** —sin escribir una sola fila— si cualquier nombre
 * de la lista no resuelve a EXACTAMENTE una cuenta. Nada de «las que sí pude».
 *
 * USO
 *     node scripts/pasa-a-dormidas.mjs "Jason de Mexico" "KOMBITEC" ...
 *         -> ENSAYO: mide y enseña lo que haría. No escribe.
 *     node scripts/pasa-a-dormidas.mjs --aplica "Jason de Mexico" ...
 *         -> escribe `estado = 'hibernacion'` y vuelve a leer para verificar.
 */
import jitiPkg from 'jiti'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const APLICA = process.argv.includes('--aplica')
const NOMBRES = process.argv.slice(2).filter(a => !a.startsWith('--'))

if (!NOMBRES.length) {
  console.log('\n  Falta la lista de nombres. Nada que hacer.')
  console.log('  node scripts/pasa-a-dormidas.mjs [--aplica] "Nombre 1" "Nombre 2" ...\n')
  process.exit(2)
}

const { default: Module } = await import('node:module')
const resolverOriginal = Module._resolveFilename
Module._resolveFilename = function (pedido, ...resto) {
  if (typeof pedido === 'string' && pedido.startsWith('@/')) {
    pedido = path.join(RAIZ, pedido.slice(2))
  }
  return resolverOriginal.call(this, pedido, ...resto)
}
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class { constructor() { throw new Error('sin realtime') } }
}

const crear = jitiPkg.createJiti ?? jitiPkg
const jiti = crear(fileURLToPath(import.meta.url), {
  alias: { '@': RAIZ }, interopDefault: true, esmResolve: true,
})

/* .env.local — las credenciales NUNCA se imprimen. */
const { config } = await import('dotenv')
config({ path: path.join(RAIZ, '.env.local'), quiet: true })

const fact = await jiti.import(path.join(RAIZ, 'lib/facturacion-cuenta.ts'))
const eleg = await jiti.import(path.join(RAIZ, 'lib/elegibilidad.ts'))
const topm = await jiti.import(path.join(RAIZ, 'lib/cuenta-top.ts'))
const sb   = await jiti.import(path.join(RAIZ, 'lib/supabase.ts'))

const { mapaFacturacion, importeDeCuenta } = fact
const { normalizarNombre } = eleg
const { isTopCustomer } = topm

const pesos = n => '$' + Math.round(n).toLocaleString('es-MX')

const mapa = await mapaFacturacion()
if (mapa.falla) {
  console.log(`\n  *** EL MAPA DE FACTURACIÓN NO CARGÓ: ${mapa.falla}`)
  console.log('  Sin MRR no se puede decir qué sale de la cartera. NO se ejecuta.\n')
  process.exit(2)
}

const { data, error } = await sb.supabaseAdmin
  .from('cuentas')
  /* `facturacion` VA EN EL SELECT aunque no se escriba. `importeDeCuenta` la
     usa como respaldo cuando el GRC no trae el CID; sin ella, toda cuenta
     fuera del GRC mediría $0 y ese cero sería mío, no del dato. */
  .select('id, cid, consecutivo, empresa, asesor, estado, facturacion')
  .limit(2000)
if (error || !data) {
  console.log(`\n  *** no pude leer \`cuentas\`: ${error?.message ?? 'sin datos'}`)
  process.exit(2)
}

console.log(`\n  PASAR A DORMIDAS — ${APLICA ? 'APLICANDO' : 'ENSAYO (no escribe)'}`)
console.log('  ' + '='.repeat(74))
console.log(`  MRR del mapa: mes ${mapa.mes} · cuentas leídas: ${data.length}`)
console.log(`  nombres recibidos: ${NOMBRES.length}\n`)

/* ── RESOLUCIÓN: cada nombre tiene que dar EXACTAMENTE una cuenta ─────────── */
const resueltas = []
const problemas = []
for (const nombre of NOMBRES) {
  const n = normalizarNombre(nombre)
  let hits = data.filter(c => normalizarNombre(c.empresa) === n)
  /* Si el normalizado no pega, se intenta por contención — pero sólo se acepta
     si da UNA sola. Dos coincidencias es ambigüedad, y una cuenta apagada por
     ambigüedad no se nota hasta que el cliente llama. */
  if (hits.length === 0) {
    const q = String(nombre).toLowerCase().trim()
    hits = data.filter(c => String(c.empresa ?? '').toLowerCase().includes(q))
  }
  if (hits.length !== 1) {
    problemas.push({ nombre, hits })
    continue
  }
  const c = hits[0]
  /* El IMPORTE se guarda CON SU ORIGEN. `importeDeCuenta` devuelve
     `origen: 'sin_dato'` cuando no hay ni GRC ni respaldo, y eso NO es un cero:
     es una no-medición. Quedarse sólo con `.mrr` las vuelve indistinguibles y
     convierte «no la medí» en «dejó de facturar». [[feedback-cero-sin-medicion]] */
  const imp = importeDeCuenta(c, mapa)
  const cidTxt = c.cid === null || c.cid === undefined ? '' : String(c.cid).trim()
  resueltas.push({
    ...c, mrr: imp.mrr, origen: imp.origen, pedido: nombre,
    enMapa: Boolean(cidTxt) && mapa.porCid.has(cidTxt),
    tieneCid: Boolean(cidTxt),
  })
}

const importeTxt = c =>
  c.origen === 'sin_dato'
    ? (!c.tieneCid ? 'SIN MEDIR (sin CID)'
      : c.enMapa ? '$0 MEDIDO (en GRC)' : 'SIN MEDIR (no en GRC)')
    : `${pesos(c.mrr)} (${c.origen})`

console.log('  RESOLUCIÓN DE NOMBRES')
console.log('    CONS  EMPRESA                             ASESOR      ESTADO HOY   TOP  IMPORTE')
for (const c of resueltas) {
  console.log(`    ${String(c.consecutivo ?? '—').padEnd(5)} ${String(c.empresa).slice(0, 35).padEnd(35)} `
    + `${String(c.asesor ?? '—').slice(0, 11).padEnd(11)} ${String(c.estado).padEnd(12)} `
    + `${isTopCustomer(c.consecutivo) ? 'sí ' : 'no '} ${importeTxt(c)}`)
}

if (problemas.length) {
  console.log('\n  *** NO SE EJECUTA NADA. Estos nombres no resuelven a una sola cuenta:')
  for (const p of problemas) {
    console.log(`      «${p.nombre}» -> ${p.hits.length} coincidencia(s)`)
    for (const h of p.hits) {
      console.log(`           ${String(h.consecutivo ?? '—').padEnd(5)} ${h.empresa}`)
    }
  }
  console.log('\n  Se aborta EN BLOQUE a propósito: apagar «las que sí pude» deja la')
  console.log('  lista a medias sin que nadie se entere. Corrige los nombres y repite.\n')
  process.exit(2)
}

/* ── LO QUE YA ESTABA DORMIDA NO SE VUELVE A ESCRIBIR ─────────────────────── */
const yaDormidas = resueltas.filter(c => c.estado === 'hibernacion' || c.estado === 'cancelado')
const porMover   = resueltas.filter(c => !(c.estado === 'hibernacion' || c.estado === 'cancelado'))

console.log(`\n  ya estaban dormidas/canceladas : ${yaDormidas.length}`)
console.log(`  se moverían a hibernacion      : ${porMover.length}`)
/* El total DECLARA cuántas no se pudieron medir. Un «$0 sale de la cartera»
   calculado sobre cuentas sin medición es falso en el sentido peligroso: hace
   parecer inocua una baja cuyo importe simplemente no se conoce. */
const medibles   = porMover.filter(c => c.origen !== 'sin_dato')
const sinMedicion = porMover.filter(c => c.origen === 'sin_dato')
console.log(`  MRR que sale de la cartera viva: ${pesos(medibles.reduce((s, c) => s + c.mrr, 0))}`
  + `  (sobre ${medibles.length} de ${porMover.length} medibles)`)
if (sinMedicion.length) {
  console.log(`  SIN MEDIR: ${sinMedicion.length} cuenta(s) — ${sinMedicion
    .map(c => c.consecutivo ?? c.empresa).join(', ')}`)
  console.log('  Su importe NO es cero: es desconocido. No se suma ni se presenta como $0.')
}

if (!porMover.length) {
  console.log('\n  No hay nada que mover.\n')
  process.exit(0)
}

if (!APLICA) {
  console.log('\n  ENSAYO. No se escribió nada. Repite con --aplica para ejecutar.\n')
  process.exit(0)
}

/* ── ESCRITURA: sólo `estado`, fila por fila, por `id` ────────────────────── */
console.log('\n  ' + '-'.repeat(74))
console.log('  ESCRIBIENDO `estado = hibernacion` — sólo esa columna, por id\n')
const fallos = []
for (const c of porMover) {
  const { error: e } = await sb.supabaseAdmin
    .from('cuentas')
    .update({ estado: 'hibernacion' })
    .eq('id', c.id)
  if (e) {
    fallos.push({ c, msg: e.message })
    console.log(`    *** ${c.consecutivo} ${c.empresa} -> FALLÓ: ${e.message}`)
  } else {
    console.log(`    ok  ${String(c.consecutivo ?? '—').padEnd(5)} ${c.empresa}`)
  }
}

/* ── VERIFICACIÓN: se VUELVE A LEER. Que el update no diera error no prueba
      que la fila quedó escrita. [[feedback-verificar-antes-asegurar]] ────── */
console.log('\n  ' + '-'.repeat(74))
console.log('  VERIFICACIÓN — se relee de la base, no se cree el update\n')
const ids = porMover.map(c => c.id)
const { data: despues, error: e2 } = await sb.supabaseAdmin
  .from('cuentas')
  .select('id, consecutivo, empresa, estado')
  .in('id', ids)
if (e2 || !despues) {
  console.log(`    *** no pude releer: ${e2?.message ?? 'sin datos'}`)
  process.exit(2)
}
let mal = 0
for (const c of porMover) {
  const d = despues.find(x => x.id === c.id)
  const ok = d && d.estado === 'hibernacion'
  if (!ok) mal++
  console.log(`    ${ok ? 'ok  ' : 'MAL '} ${String(c.consecutivo ?? '—').padEnd(5)} `
    + `${String(c.empresa).slice(0, 38).padEnd(38)} ${c.estado} -> ${d ? d.estado : '(no la encuentro)'}`)
}
/* CONTROL NEGATIVO: ninguna fila se perdió. Una baja NO es un borrado, así que
   las que pedimos tienen que SEGUIR EXISTIENDO. */
if (despues.length !== ids.length) {
  console.log(`\n  *** DESAPARECIERON FILAS: pedí ${ids.length} y volvieron ${despues.length}.`)
  console.log('  Una baja es pasar a Dormida, NUNCA un borrado. Revisar YA.')
  process.exit(2)
}
console.log(`\n  siguen existiendo las ${despues.length} filas (una baja no borra).`)

/* ── BITÁCORA: la evidencia de quién se apagó y con qué autorización ─────── */
const salida = path.join(RAIZ, 'data', 'bajas-a-dormidas')
fs.mkdirSync(salida, { recursive: true })
const destino = path.join(salida, `bajas-${String(mapa.mes).replace(/[^\w-]/g, '_')}.json`)
let previo = []
if (fs.existsSync(destino)) {
  try { previo = JSON.parse(fs.readFileSync(destino, 'utf8')) } catch { previo = [] }
  if (!Array.isArray(previo)) previo = []
}
previo.push({
  mes_mapa: mapa.mes,
  nombres_pedidos: NOMBRES,
  movidas: porMover.map(c => ({
    id: c.id, cid: c.cid, consecutivo: c.consecutivo, empresa: c.empresa,
    asesor: c.asesor, estado_antes: c.estado, estado_despues: 'hibernacion',
    mrr: c.mrr, top: isTopCustomer(c.consecutivo),
  })),
  ya_estaban: yaDormidas.map(c => ({ consecutivo: c.consecutivo, empresa: c.empresa, estado: c.estado })),
  fallos: fallos.map(f => ({ consecutivo: f.c.consecutivo, empresa: f.c.empresa, error: f.msg })),
})
fs.writeFileSync(destino, JSON.stringify(previo, null, 2), 'utf8')
console.log(`  bitácora en data/bajas-a-dormidas/${path.basename(destino)}\n`)

if (mal || fallos.length) {
  console.log(`  *** ${mal} sin verificar y ${fallos.length} con error. NO está terminado.\n`)
  process.exit(1)
}
console.log(`  LISTO: ${porMover.length} cuenta(s) en Dormidas. Ninguna borrada.\n`)
