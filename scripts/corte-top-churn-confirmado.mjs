/**
 * CORTE DE CUENTAS **TOP** QUE ESTÁN EN **CHURN CONFIRMADO**. SOLO LECTURA.
 *
 * Instrucción de dirección (4 nov 2026): en cada actualización de Churn hay que
 * sacar este corte y pasar a Dormidas las que aparezcan con churn confirmado.
 * Esto saca el corte. **No escribe nada**: la escritura va aparte y después de
 * corroborar, por las razones de abajo.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTE CORTE SE TOMA **ANTES** DE MOVER NADA, Y SE GUARDA
 *
 * `topDeCartera()` deriva el TOP de las 25 cuentas de mayor MRR **entre las que
 * están en `estado` activo o en_riesgo**. En cuanto una cuenta pasa a
 * `hibernacion` SALE de esa población, y el TOP se recalcula sobre las que
 * quedan: suben 25 cuentas distintas. O sea que **ejecutar la decisión destruye
 * la evidencia que la justificaba**, y el corte deja de ser reproducible.
 * Por eso se saca primero y se deja escrito. [[feedback-verificar-antes-asegurar]]
 *
 * TODO SE DERIVA DE LAS FUNCIONES DEL REPO —`topDeCartera`, `mapaFacturacion`,
 * `NOMBRES_CHURN_GRC`, `NOMBRES_CANCELACION`— y no de una copia de sus reglas:
 * un espejo tecleado a mano deja de ser espejo. [[feedback-fuente-unica-cuentas]]
 *
 * ────────────────────────────────────────────────────────────────────────────
 * LAS DOS PUERTAS, Y POR QUÉ NO VALEN LO MISMO
 *
 *  · `churn_grc`     → el nombre aparece con movimiento «Churn confirmado» en
 *                      GRC-AAA-2026. `NOMBRES_CHURN_GRC` ya le quita el MES
 *                      VIVO (regla de José Manuel, 20 sep 2026) y las
 *                      reactivadas. Aun así, el label CRUDO de Zoho está
 *                      medido como mayoritariamente falso —Zoho marca «Churn
 *                      confirmado» todo contrato que aún no factura, lo que
 *                      incluye al que paga tarde— y **el residuo sobre el
 *                      conjunto YA filtrado no se ha medido nunca**.
 *                      Ver `prediccion/docs/01-inventario.md`.
 *  · `cancelacion`   → la cuenta aparece en una cancelación confirmada de
 *                      Churn > Análisis DATA. Esa la escribe una persona.
 *
 * Por eso el corte las SEPARA y dice cuántas puertas sustentan cada cuenta.
 * Una cuenta con las DOS es una baja sustentada; una con sólo `churn_grc` es
 * una cuenta que hay que mirar antes de apagarla. [[polak-grupo-no-es-churn]]
 *
 * USO
 *     node scripts/corte-top-churn-confirmado.mjs
 *     node scripts/corte-top-churn-confirmado.mjs --todas   (no sólo las TOP)
 */
import jitiPkg from 'jiti'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SOLO_TOP = !process.argv.includes('--todas')

/* El alias `@/` también en el cargador de Node: la opción `alias` de jiti no
   alcanza a un `.json`, y la cadena de `lib/` importa varios. Igual que en
   `revisa-contexto-churn-dos-sesiones.mjs`. */
const { default: Module } = await import('node:module')
const resolverOriginal = Module._resolveFilename
Module._resolveFilename = function (pedido, ...resto) {
  if (typeof pedido === 'string' && pedido.startsWith('@/')) {
    pedido = path.join(RAIZ, pedido.slice(2))
  }
  return resolverOriginal.call(this, pedido, ...resto)
}
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {
    constructor() { throw new Error('Este corte no usa realtime.') }
  }
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
const sb   = await jiti.import(path.join(RAIZ, 'lib/supabase.ts'))

const { mapaFacturacion, importeDeCuenta, topDeCartera, N_TOP } = fact
const { normalizarNombre, NOMBRES_CHURN_GRC, NOMBRES_CANCELACION } = eleg

const pesos = n => '$' + Math.round(n).toLocaleString('es-MX')

const mapa = await mapaFacturacion()
if (mapa.falla) {
  /* Un mapa vacío haría que TODAS las cuentas midieran $0 y el TOP saliera
     por orden arbitrario. Eso no se publica como corte. */
  console.log(`\n  *** EL MAPA DE FACTURACIÓN NO CARGÓ: ${mapa.falla}`)
  console.log('  Sin MRR no hay TOP. NO se saca el corte.\n')
  process.exit(2)
}
console.log(`\n  CORTE · CUENTAS TOP EN CHURN CONFIRMADO`)
console.log('  ' + '='.repeat(72))
console.log(`  MRR del mapa: mes ${mapa.mes} · ${mapa.porCid.size} CIDs`)
console.log(`  GRC «Churn confirmado» (sin mes vivo ni reactivadas): ${NOMBRES_CHURN_GRC.size} nombres`)
console.log(`  Cancelaciones confirmadas (Análisis DATA): ${NOMBRES_CANCELACION.size} nombres`)

const { data, error } = await sb.supabaseAdmin
  .from('cuentas')
  .select('id, cid, consecutivo, empresa, asesor, estado, facturacion, health_score')
  .in('estado', ['activo', 'en_riesgo'])
if (error || !data) {
  console.log(`\n  *** no pude leer \`cuentas\`: ${error?.message ?? 'sin datos'}`)
  process.exit(2)
}

const top = await topDeCartera(mapa)
console.log(`  Población TOP: ${top.size} de ${data.length} cuentas vivas (N_TOP = ${N_TOP})`)
if (top.size === 0) {
  console.log('\n  *** el TOP salió VACÍO. `topDeCartera` devuelve vacío sin cachear')
  console.log('  cuando no pudo leer. Eso NO es «ninguna cuenta es grande».\n')
  process.exit(2)
}

const filas = data.map(c => {
  const n = normalizarNombre(c.empresa)
  return {
    cons: c.consecutivo, empresa: String(c.empresa ?? ''), asesor: c.asesor ?? '—',
    estado: c.estado, mrr: importeDeCuenta(c, mapa).mrr,
    esTop: top.has(String(c.id)),
    grc: NOMBRES_CHURN_GRC.has(n),
    cancel: NOMBRES_CANCELACION.has(n),
  }
}).filter(f => f.grc || f.cancel)

const alcance = SOLO_TOP ? filas.filter(f => f.esTop) : filas
alcance.sort((a, b) => b.mrr - a.mrr)

const dos  = alcance.filter(f => f.grc && f.cancel)
const soloG = alcance.filter(f => f.grc && !f.cancel)
const soloC = alcance.filter(f => !f.grc && f.cancel)

console.log(`\n  ── ${SOLO_TOP ? 'SÓLO CUENTAS TOP' : 'TODA LA CARTERA VIVA'} ──`)
console.log(`  cuentas vivas con churn confirmado y/o cancelación: ${alcance.length}`)
console.log(`  MRR que saldría de la cartera viva: ${pesos(alcance.reduce((s, f) => s + f.mrr, 0))}\n`)

const tabla = (etq, xs, nota) => {
  console.log(`  ${etq} — ${xs.length} cuenta(s) · ${pesos(xs.reduce((s, f) => s + f.mrr, 0))}`)
  console.log(`    ${nota}`)
  if (!xs.length) { console.log('    (ninguna)\n'); return }
  console.log('    %s %s %s %s %s'.replace(/%s/g, () => '')
    + 'CONS  EMPRESA                             ASESOR      ESTADO       MRR  TOP')
  for (const f of xs) {
    console.log(`    ${String(f.cons ?? '—').padEnd(5)} ${f.empresa.slice(0, 35).padEnd(35)} `
      + `${String(f.asesor).slice(0, 11).padEnd(11)} ${String(f.estado).padEnd(9)} `
      + `${pesos(f.mrr).padStart(9)}  ${f.esTop ? 'TOP' : ''}`)
  }
  console.log('')
}

tabla('① LAS DOS PUERTAS (GRC + Análisis DATA)', dos,
  'Baja SUSTENTADA por dos fuentes independientes. Estas se pueden mover.')
tabla('② SÓLO Análisis DATA', soloC,
  'La cancelación la escribió una persona en el reporte semanal. Fuente fuerte.')
tabla('③ SÓLO el label del GRC', soloG,
  '⚠️ AQUÍ ESTÁ EL RIESGO. Zoho marca «Churn confirmado» todo contrato que aún '
  + 'no factura.\n    Hay que corroborar una por una ANTES de apagarlas.')

/* CONTROL: UN CERO AQUÍ SÓLO VALE SI SE SABE CUÁNTAS HAY EN TOTAL.
   Si el corte sale vacío puede ser que la cartera esté limpia… o que el cruce
   por nombre no cruce nada. Se cuenta sobre TODOS los estados: las que ya están
   en `hibernacion`/`cancelado` son el trabajo YA hecho, y su existencia prueba
   que el cruce funciona. [[feedback-cero-sin-medicion]] [[feedback-probar-al-reves]] */
console.log('  ' + '-'.repeat(72))
const { data: todos } = await sb.supabaseAdmin
  .from('cuentas')
  .select('consecutivo, empresa, estado')
  .limit(2000)
if (todos) {
  const marcadas = todos.filter(c => {
    const n = normalizarNombre(c.empresa)
    return NOMBRES_CHURN_GRC.has(n) || NOMBRES_CANCELACION.has(n)
  })
  const porEstado = {}
  for (const c of marcadas) porEstado[c.estado ?? '?'] = (porEstado[c.estado ?? '?'] ?? 0) + 1
  console.log(`\n  CONTROL · cuentas de la cartera marcadas por alguna de las dos puertas,`)
  console.log(`  en CUALQUIER estado: ${marcadas.length} de ${todos.length}`)
  for (const [e, n] of Object.entries(porEstado).sort((a, b) => b[1] - a[1])) {
    console.log(`      ${String(e).padEnd(12)} ${String(n).padStart(4)}`
      + (e === 'hibernacion' || e === 'cancelado' ? '   ← ya movidas' : ''))
  }
  if (marcadas.length === 0) {
    console.log('\n  *** NI UNA SOLA en ningún estado. Eso NO es «la cartera está limpia»:')
    console.log('  es que el cruce por nombre no está cruzando. NO concluyas un cero.')
  } else if (alcance.length === 0) {
    console.log('\n  El cruce SÍ funciona (hay cuentas marcadas), así que el cero de arriba')
    console.log('  es un cero MEDIDO: el trabajo ya estaba hecho en cortes anteriores.')
  }
}

console.log('\n  LO QUE YA PASA HOY, SIN TOCAR NADA:')
console.log('  estas cuentas YA SE VEN en Dormidas. `app/cuentas/dormidas/page.tsx`')
console.log('  filtra por `churn_confirmado || cancelacion_reportada` además de por')
console.log('  `estado`, por la regla de dirección del 9 sep 2026. Lo que falta es')
console.log('  que SALGAN de Activas, y eso sí cambia el MRR de la cartera viva,')
console.log('  los conteos por asesor, las alertas y la población del TOP.')
console.log('\n  NINGUNA CUENTA SE BORRA. Una baja es pasar a `hibernacion`.')
console.log('  [[feedback-conciliacion-churn]]')

/* El corte se GUARDA porque deja de ser reproducible en cuanto se ejecute:
   al mover una cuenta a `hibernacion`, el TOP se recalcula sobre las que
   quedan. Sin este archivo no habría con qué justificar la decisión después. */
const salida = path.join(RAIZ, 'data', 'cortes-top-churn')
fs.mkdirSync(salida, { recursive: true })
const sello = `${mapa.mes}`.replace(/[^\w-]/g, '_')
const destino = path.join(salida, `top-churn-${sello}.json`)
fs.writeFileSync(destino, JSON.stringify({
  mes: mapa.mes, n_top: N_TOP, poblacion_top: top.size, cuentas_vivas: data.length,
  grc_nombres: NOMBRES_CHURN_GRC.size, cancel_nombres: NOMBRES_CANCELACION.size,
  solo_top: SOLO_TOP,
  dos_puertas: dos, solo_analisis_data: soloC, solo_label_grc: soloG,
}, null, 2), 'utf8')
console.log(`\n  corte guardado en data/cortes-top-churn/top-churn-${sello}.json`)
console.log('  (es la evidencia: el TOP cambia en cuanto se mueva una cuenta)\n')
