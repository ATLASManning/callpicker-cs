/**
 * CORTE DE CUENTAS **TOP** QUE ESTÉN BAJO **CHURN CONFIRMADO**. SOLO LECTURA.
 *
 * Instrucción de dirección (4 nov 2026): en cada actualización de Churn hay que
 * sacar este corte y pasar a Dormidas las que aparezcan con churn confirmado.
 * Esto saca el corte. **No escribe en `cuentas`.**
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * QUÉ ES «CUENTA TOP» AQUÍ, Y NO ES EL TOP POR MRR
 *
 * Aclaración de dirección: **«cuentas TOP» son las del apartado Cuentas
 * Activas**, las que marca el filtro TOP de esa pantalla —
 * `isTopCustomer(consecutivo)`, «venía en la lista Top Customer», derivado del
 * CONSECUTIVO (F1-F46, D1-D38, C1-C43, más las enumeradas).
 *
 * La primera versión usaba `topDeCartera()`, que son **las 25 de mayor MRR**.
 * Son dos poblaciones distintas y ninguna avisa de que no es la otra. Ahora se
 * importa `isTopCustomer` de `lib/cuenta-top.ts`: la MISMA función que usa la
 * pantalla, no una copia. [[feedback-fuente-unica-cuentas]]
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * LO PRIMERO QUE HAY QUE SABER: ACTIVAS YA LAS EXCLUYE
 *
 * `app/cuentas/page.tsx` filtra `.filter(c => !vaEnDormidas(c))`, y
 * `vaEnDormidas` es `churn_confirmado || cancelacion_reportada ||
 * estadoKey === '4'`. O sea que **una cuenta con churn confirmado NO está en
 * Activas**: ya salió de ahí y ya se ve en Dormidas, por la regla de dirección
 * del 9 sep 2026, SIN tocar `cuentas.estado`.
 *
 * Por eso este corte mide las dos cosas por separado:
 *
 *   A) lo que la PANTALLA de Activas enseña hoy  → debe ser CERO siempre, y si
 *      no lo es, el filtro está roto. Es un control, no un hallazgo.
 *   B) lo que la COLUMNA `estado` todavía dice   → aquí sí puede haber trabajo:
 *      cuentas con `estado` activo/en_riesgo que ya son churn confirmado. No
 *      se ven en Activas, pero la columna miente y de ella cuelgan el MRR de la
 *      cartera viva, los conteos por asesor, las alertas y `topDeCartera()`.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * LAS DOS PUERTAS, Y POR QUÉ NO VALEN LO MISMO
 *
 *  · `churn_grc`   → el nombre aparece con movimiento «Churn confirmado» en
 *                    GRC-AAA-2026. `NOMBRES_CHURN_GRC` ya le quita el MES VIVO
 *                    (regla de José Manuel, 20 sep 2026) y las reactivadas.
 *                    Aun así el label CRUDO de Zoho está medido como
 *                    mayoritariamente falso —marca «Churn confirmado» todo
 *                    contrato que aún no factura, lo que incluye al que paga
 *                    tarde— y **el residuo sobre el conjunto ya filtrado no se
 *                    ha medido nunca**. Ver `prediccion/docs/01-inventario.md`.
 *  · `cancelacion` → la cuenta aparece en una cancelación confirmada de
 *                    Churn > Análisis DATA. Ésa la escribe una persona.
 *
 * Una cuenta con las DOS es una baja sustentada. Una con sólo `churn_grc` hay
 * que corroborarla antes de apagarla. [[polak-grupo-no-es-churn]]
 *
 * NINGUNA CUENTA SE BORRA. Una baja es `estado = 'hibernacion'`.
 * [[feedback-conciliacion-churn]]
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
const topm = await jiti.import(path.join(RAIZ, 'lib/cuenta-top.ts'))
const sb   = await jiti.import(path.join(RAIZ, 'lib/supabase.ts'))

const { mapaFacturacion, importeDeCuenta } = fact
const { normalizarNombre, NOMBRES_CHURN_GRC, NOMBRES_CANCELACION } = eleg
const { isTopCustomer, TOP_RANGES } = topm

const pesos = n => '$' + Math.round(n).toLocaleString('es-MX')

const mapa = await mapaFacturacion()
if (mapa.falla) {
  /* Un mapa vacío haría que TODAS las cuentas midieran $0. Eso no se publica. */
  console.log(`\n  *** EL MAPA DE FACTURACIÓN NO CARGÓ: ${mapa.falla}`)
  console.log('  Sin MRR el corte no puede ordenar ni cifrar. NO se saca.\n')
  process.exit(2)
}

console.log('\n  CORTE · CUENTAS TOP BAJO CHURN CONFIRMADO')
console.log('  ' + '='.repeat(72))
console.log(`  MRR del mapa: mes ${mapa.mes} · ${mapa.porCid.size} CIDs`)
console.log(`  TOP = filtro del apartado Cuentas (consecutivo): `
  + Object.entries(TOP_RANGES).map(([p, n]) => `${p}1-${p}${n}`).join(', ') + ' + enumeradas')
console.log(`  GRC «Churn confirmado» (sin mes vivo ni reactivadas): ${NOMBRES_CHURN_GRC.size} nombres`)
console.log(`  Cancelaciones confirmadas (Análisis DATA): ${NOMBRES_CANCELACION.size} nombres`)

const { data, error } = await sb.supabaseAdmin
  .from('cuentas')
  .select('id, cid, consecutivo, empresa, asesor, estado, facturacion, health_score')
  .limit(2000)
if (error || !data) {
  console.log(`\n  *** no pude leer \`cuentas\`: ${error?.message ?? 'sin datos'}`)
  process.exit(2)
}

/* `getEstadoKey` de la pantalla: '4' es Dormido. Se replica SÓLO la parte que
   decide dormida —estado hibernacion/cancelado— porque la otra rama ('0' por
   facturación 0) no es churn y aquí confundiría «sin importe» con «de baja». */
const esDormidaPorEstado = c => c.estado === 'hibernacion' || c.estado === 'cancelado'

const filas = data.map(c => {
  const n = normalizarNombre(c.empresa)
  return {
    cons: c.consecutivo, empresa: String(c.empresa ?? ''), asesor: c.asesor ?? '—',
    estado: c.estado, mrr: importeDeCuenta(c, mapa).mrr,
    esTop: isTopCustomer(c.consecutivo),
    grc: NOMBRES_CHURN_GRC.has(n),
    cancel: NOMBRES_CANCELACION.has(n),
    dormidaPorEstado: esDormidaPorEstado(c),
  }
})

const marcadas = filas.filter(f => f.grc || f.cancel)
const ambito   = SOLO_TOP ? marcadas.filter(f => f.esTop) : marcadas
ambito.sort((a, b) => b.mrr - a.mrr)

console.log(`  cuentas leídas: ${filas.length} · TOP: ${filas.filter(f => f.esTop).length}`)

/* ── A · CONTROL: lo que la PANTALLA de Activas enseña ───────────────────── */
console.log('\n  ' + '-'.repeat(72))
console.log('  A · CONTROL — ¿alguna de éstas se VE hoy en Cuentas Activas?\n')
const enPantalla = ambito.filter(f => !f.dormidaPorEstado)
console.log('  Activas filtra `!vaEnDormidas(c)`, y `churn_confirmado` es una de sus')
console.log('  tres condiciones, así que la respuesta correcta es NINGUNA. Si sale')
console.log('  alguna, el filtro de la pantalla está roto — eso es el hallazgo.')
console.log(`\n  → ${enPantalla.length === 0
  ? 'NINGUNA. El filtro de Activas hace su trabajo.'
  : `*** ${enPantalla.length} SE VEN EN ACTIVAS. Revisar \`vaEnDormidas\`.`}`)

/* ── B · DONDE SÍ PUEDE HABER TRABAJO: la columna `estado` ───────────────── */
console.log('\n  ' + '-'.repeat(72))
console.log('  B · LA COLUMNA `estado` — aquí es donde puede quedar trabajo\n')
const estadoMiente = ambito.filter(f => !f.dormidaPorEstado)
const yaMovidas    = ambito.filter(f => f.dormidaPorEstado)
console.log(`  ya con estado hibernacion/cancelado : ${yaMovidas.length}`)
console.log(`  con estado todavía activo/en_riesgo : ${estadoMiente.length}`
  + (estadoMiente.length ? '   ← candidatas' : ''))
if (estadoMiente.length) {
  console.log(`  MRR que saldría de la cartera viva  : ${pesos(estadoMiente.reduce((s, f) => s + f.mrr, 0))}`)
}

const tabla = (etq, xs, nota) => {
  console.log(`\n  ${etq} — ${xs.length} cuenta(s) · ${pesos(xs.reduce((s, f) => s + f.mrr, 0))}`)
  console.log(`    ${nota}`)
  if (!xs.length) { console.log('    (ninguna)'); return }
  /* La columna PUERTA va en TODAS las tablas, no sólo en las candidatas. En
     ①②③ la puerta se deduce del título, pero en ⓿ no, y sin ella «está en
     churn confirmado» no dice si lo sustenta una persona o sólo el label del
     GRC —que está medido como mayoritariamente falso en crudo. */
  console.log('    CONS  EMPRESA                             ASESOR      ESTADO       PUERTA        MRR')
  for (const f of xs) {
    const puerta = f.grc && f.cancel ? 'GRC+DATA' : f.cancel ? 'DATA' : 'GRC'
    console.log(`    ${String(f.cons ?? '—').padEnd(5)} ${f.empresa.slice(0, 35).padEnd(35)} `
      + `${String(f.asesor).slice(0, 11).padEnd(11)} ${String(f.estado).padEnd(12)} `
      + `${puerta.padEnd(9)} ${pesos(f.mrr).padStart(9)}`)
  }
}

/* EL TRABAJO YA HECHO TAMBIÉN SE LISTA, Y NO ES DECORACIÓN.
   La primera versión imprimía «ya con estado hibernacion/cancelado: 5» y ahí
   se quedaba. Cuando dirección pregunta «¿cuáles cuentas TOP están en churn
   confirmado?», la respuesta COMPLETA son éstas —las que ya se apagaron— más
   las candidatas. Un corte que sólo enseña lo pendiente contesta «ninguna» a
   una pregunta cuya respuesta real son cinco nombres.
   [[feedback-cero-sin-medicion]] */
tabla('⓿ YA EN DORMIDAS (trabajo hecho en cortes anteriores)',
  yaMovidas,
  'Éstas YA están apagadas. Son la respuesta a «cuáles son», no un pendiente.')

tabla('① LAS DOS PUERTAS (GRC + Análisis DATA)',
  estadoMiente.filter(f => f.grc && f.cancel),
  'Baja SUSTENTADA por dos fuentes independientes. Éstas se pueden mover.')
tabla('② SÓLO Análisis DATA',
  estadoMiente.filter(f => !f.grc && f.cancel),
  'La cancelación la escribió una persona en el reporte semanal. Fuente fuerte.')
tabla('③ SÓLO el label del GRC',
  estadoMiente.filter(f => f.grc && !f.cancel),
  '⚠️ AQUÍ ESTÁ EL RIESGO. Corroborar una por una ANTES de apagarlas.')

/* ── CONTROL DEL CERO ────────────────────────────────────────────────────── */
console.log('\n  ' + '-'.repeat(72))
console.log('  CONTROL DEL CERO — un cero sin medición no es un cero\n')
console.log(`  cuentas marcadas por alguna puerta, en CUALQUIER estado: ${marcadas.length} de ${filas.length}`)
const porEstado = {}
for (const f of marcadas) porEstado[f.estado ?? '?'] = (porEstado[f.estado ?? '?'] ?? 0) + 1
for (const [e, n] of Object.entries(porEstado).sort((a, b) => b[1] - a[1])) {
  console.log(`      ${String(e).padEnd(12)} ${String(n).padStart(4)}`
    + (e === 'hibernacion' || e === 'cancelado' ? '   ← ya movidas' : ''))
}
console.log(`      de ésas, TOP: ${marcadas.filter(f => f.esTop).length}`)
if (marcadas.length === 0) {
  console.log('\n  *** NI UNA SOLA en ningún estado. Eso NO es «la cartera está limpia»:')
  console.log('  es que el cruce por nombre no está cruzando. NO concluyas un cero.')
} else if (estadoMiente.length === 0) {
  console.log('\n  El cruce SÍ funciona, así que el cero de arriba es un cero MEDIDO:')
  console.log('  el trabajo ya estaba hecho en cortes anteriores.')
}

/* El corte se GUARDA: es la evidencia de la decisión, y una vez ejecutada la
   cuenta ya no está donde el corte la vio. */
const salida = path.join(RAIZ, 'data', 'cortes-top-churn')
fs.mkdirSync(salida, { recursive: true })
const sello = `${mapa.mes}`.replace(/[^\w-]/g, '_') + (SOLO_TOP ? '' : '-todas')
const destino = path.join(salida, `top-churn-${sello}.json`)
fs.writeFileSync(destino, JSON.stringify({
  mes: mapa.mes, solo_top: SOLO_TOP, cuentas_leidas: filas.length,
  top_ranges: TOP_RANGES,
  grc_nombres: NOMBRES_CHURN_GRC.size, cancel_nombres: NOMBRES_CANCELACION.size,
  marcadas_total: marcadas.length, se_ven_en_activas: enPantalla.length,
  ya_movidas: yaMovidas.length,
  /* Las ya movidas se guardan COMPLETAS, no sólo contadas: son la respuesta a
     «cuáles cuentas TOP están en churn confirmado» y el JSON es la evidencia. */
  ya_movidas_detalle: yaMovidas,
  candidatas: estadoMiente,
}, null, 2), 'utf8')
console.log(`\n  corte guardado en data/cortes-top-churn/top-churn-${sello}.json\n`)
