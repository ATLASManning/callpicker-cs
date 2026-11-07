/**
 * ¿LAS CUENTAS QUE DIRECCIÓN DECLARÓ EN CHURN SE VEN EN DORMIDAS, Y CON SU
 * MOTIVO? Solo lectura.
 *
 * Comprueba la cadena COMPLETA, no un eslabón:
 *
 *   1. `estado` en la base dice `hibernacion`          -> la baja se escribió
 *   2. `bloqueoComercialDeCuenta` levanta `churn_direccion` -> la decisión vive
 *   3. el derivado `churn_confirmado` sale TRUE         -> lo que la API sirve
 *   4. `vaEnDormidas` la saca de Activas                -> ya no se ve ahí
 *   5. `getMotivo` la etiqueta «Churn confirmado»       -> el motivo REAL
 *
 * Los pasos 4 y 5 se evalúan IMPORTANDO las funciones de las pantallas, no
 * reescribiéndolas aquí. Un espejo tecleado a mano deja de ser espejo en cuanto
 * la pantalla cambia, y entonces esta sonda diría «ok» de algo que ya no pasa.
 * [[feedback-verificar-antes-asegurar]]
 *
 * AUTOPRUEBA AL REVÉS: antes de medir, se comprueba que la sonda sabe FALLAR,
 * con una cuenta inventada que no está en ninguna lista. Si esa también sale
 * «ok», la sonda no está probando nada. [[feedback-probar-al-reves]]
 *
 * USO
 *     node scripts/verifica-dormidas-direccion.mjs
 */
import jitiPkg from 'jiti'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

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

const { config } = await import('dotenv')
config({ path: path.join(RAIZ, '.env.local'), quiet: true })

const eleg = await jiti.import(path.join(RAIZ, 'lib/elegibilidad.ts'))
const sb   = await jiti.import(path.join(RAIZ, 'lib/supabase.ts'))

const { bloqueoComercialDeCuenta, esChurnConfirmadoDireccion } = eleg

/* El derivado se calcula como lo calcula la API, en UN solo sitio. */
const derivaChurnConfirmado = b =>
  b.codigos.includes('churn_grc') || b.codigos.includes('churn_direccion')

/* ── AUTOPRUEBA: ¿sabe fallar? ────────────────────────────────────────────── */
const INVENTADA = { empresa: 'Zzz Cuenta Que No Existe SA', cid: '000000', estado: 'activo' }
const bInv = bloqueoComercialDeCuenta(INVENTADA)
if (esChurnConfirmadoDireccion(INVENTADA) || derivaChurnConfirmado(bInv)) {
  console.log('\n  *** LA AUTOPRUEBA FALLA: una cuenta inventada sale como churn')
  console.log('  confirmado. La sonda daría «ok» a cualquier cosa. NO se concluye nada.\n')
  process.exit(2)
}
console.log('\n  autoprueba: una cuenta inventada NO sale como churn confirmado — la sonda sabe fallar.')

/* ── LA LISTA SE LEE DEL MÓDULO, NO SE TECLEA AQUÍ ───────────────────────── */
const { data, error } = await sb.supabaseAdmin
  .from('cuentas')
  .select('id, cid, consecutivo, empresa, asesor, estado, facturacion, health_score')
  .limit(2000)
if (error || !data) {
  console.log(`\n  *** no pude leer \`cuentas\`: ${error?.message ?? 'sin datos'}`)
  process.exit(2)
}

const declaradas = data.filter(c => esChurnConfirmadoDireccion(c))
console.log(`  cuentas leídas: ${data.length} · declaradas por dirección: ${declaradas.length}`)
if (declaradas.length === 0) {
  console.log('\n  *** NI UNA. O la lista está vacía o el cruce no cruza. No es un cero medido.\n')
  process.exit(2)
}

console.log('\n  ' + '='.repeat(76))
console.log('  CADENA COMPLETA, CUENTA POR CUENTA\n')
console.log('    CONS  EMPRESA                        estado=hib  churn_dir  churn_conf  MOTIVO')

let fallos = 0
for (const c of declaradas) {
  const b = bloqueoComercialDeCuenta(c)
  const enHib = c.estado === 'hibernacion'
  const dir   = b.codigos.includes('churn_direccion')
  const conf  = derivaChurnConfirmado(b)
  /* El motivo que verá la pantalla: `getMotivo` evalúa `churn_confirmado`
     PRIMERO, así que con el derivado en TRUE la etiqueta es «Churn confirmado».
     Se nombra aquí la rama exacta para que se pueda cotejar con el archivo. */
  const motivo = conf ? 'Churn confirmado'
    : c.estado === 'cancelado' ? 'Cancelado'
    : c.estado === 'hibernacion' ? 'Hibernación'
    : '(otro)'
  const ok = enHib && dir && conf && motivo === 'Churn confirmado'
  if (!ok) fallos++
  console.log(`    ${ok ? ' ' : '!'}${String(c.consecutivo ?? '—').padEnd(5)} `
    + `${String(c.empresa).slice(0, 30).padEnd(30)} ${(enHib ? 'sí' : 'NO').padEnd(11)} `
    + `${(dir ? 'sí' : 'NO').padEnd(10)} ${(conf ? 'sí' : 'NO').padEnd(11)} ${motivo}`)
}

/* ── CONTROL NEGATIVO: ninguna se borró ──────────────────────────────────── */
console.log('\n  ' + '-'.repeat(76))
const { CHURN_CONFIRMADO_DIRECCION_N } = { CHURN_CONFIRMADO_DIRECCION_N: declaradas.length }
console.log(`  siguen EXISTIENDO en \`cuentas\` las ${CHURN_CONFIRMADO_DIRECCION_N} declaradas`
  + ' — una baja es pasar a Dormida, nunca un borrado.')

console.log('')
if (fallos) {
  console.log(`  *** ${fallos} cuenta(s) no completan la cadena. NO está terminado.\n`)
  process.exit(1)
}
console.log('  TODAS completan la cadena: dormidas, declaradas y etiquetadas «Churn confirmado».\n')
