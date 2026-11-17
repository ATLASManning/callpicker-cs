/**
 * Que cada entrada de REACTIVADAS_FUERA_DEL_CHURN de verdad desbloquee algo.
 *
 * ── POR QUE EXISTE ──────────────────────────────────────────────────────────
 * La lista va por NOMBRE NORMALIZADO y la clave se teclea a mano. Una clave
 * mal tecleada no da error, no rompe el build y no se nota en pantalla: la
 * cuenta se queda en Dormidas exactamente igual que antes, y quien escribió la
 * línea cree haberla sacado. Es un espejo tecleado a mano, que deja de ser
 * espejo. [[feedback-verificar-antes-asegurar]]
 *
 * Por eso aquí NO se recalcula la normalización: se importa la MISMA función
 * que usa la aplicación (`normalizarNombre`), se cruza contra los MISMOS datos
 * (`AAA_GRC_2026`) y se comprueba el MISMO Set que decide (`NOMBRES_CHURN_GRC`).
 *
 * ── LAS TRES PREGUNTAS ──────────────────────────────────────────────────────
 *   1. ¿La clave le corresponde a algún cliente REAL con «Churn confirmado»?
 *      Si no, la línea no desbloquea nada.
 *   2. ¿La cuenta salió de verdad de `NOMBRES_CHURN_GRC`?
 *   3. AL REVES: un nombre que SI está en churn y NO en la lista, ¿sigue
 *      bloqueado? Sin esta tercera, el guion daría verde con la lista vacía y
 *      con la lista entera. Una regla sólo se prueba con lo que NO debe entrar.
 *      [[feedback-probar-al-reves]]
 *
 * Es de SOLO LECTURA. Sale con 1 si alguna falla.
 *
 *     node scripts/revisa-reactivadas.mjs
 */
import jitiPkg from 'jiti'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/* El alias `@/` también en el cargador de Node: la opción `alias` de jiti no
   alcanza a un `.json`, y la cadena de `lib/` importa varios. */
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
    constructor() { throw new Error('Esta revisión no usa realtime.') }
  }
}

const crear = jitiPkg.createJiti ?? jitiPkg
const jiti = crear(fileURLToPath(import.meta.url), {
  alias: { '@': RAIZ }, interopDefault: true, esmResolve: true,
})

const eleg = await jiti.import(path.join(RAIZ, 'lib/elegibilidad.ts'))
const grc  = await jiti.import(path.join(RAIZ, 'app/churn/aaa-grc-data.ts'))
const rep  = await jiti.import(path.join(RAIZ, 'app/churn/grc-reporte.ts'))

const { normalizarNombre, NOMBRES_CHURN_GRC, REACTIVADAS_FUERA_DEL_CHURN } = eleg
const { AAA_GRC_2026 } = grc
const { GRC_MES_EN_CURSO } = rep

const fallos = []
const ok = (bien, que, detalle = '') => {
  console.log(`  ${bien ? 'ok  ' : 'FALLA'}  ${que}${detalle ? `\n          ${detalle}` : ''}`)
  if (!bien) fallos.push(que)
}

/* Todos los «Churn confirmado» del GRC, FUERA del mes vivo — que es el mismo
   recorte que hace NOMBRES_CHURN_GRC. Se guarda el nombre tal cual para poder
   nombrarlo en el mensaje, no sólo su forma normalizada. */
const vivo = String(GRC_MES_EN_CURSO ?? '').toLowerCase()
const enChurn = new Map()   // normalizado -> { nombre, meses:[], mrr }
for (const mes of AAA_GRC_2026) {
  if (vivo && String(mes.mes).toLowerCase() === vivo) continue
  for (const r of mes.clientes) {
    if (!String(r.movimiento ?? '').includes('Churn confirmado')) continue
    const n = normalizarNombre(r.cliente)
    if (!n) continue
    const v = enChurn.get(n) ?? { nombre: r.cliente, meses: [], mrr: 0 }
    v.meses.push(String(mes.mes))
    v.mrr = Math.max(v.mrr, Number(r.mrrInicio ?? 0))
    enChurn.set(n, v)
  }
}

console.log(`\n  mes vivo excluido: «${GRC_MES_EN_CURSO ?? '(ninguno)'}»`)
console.log(`  «Churn confirmado» en el GRC, fuera del mes vivo: ${enChurn.size} nombres`)
console.log(`  reactivadas declaradas: ${REACTIVADAS_FUERA_DEL_CHURN.size}\n`)

console.log('  1 · CADA CLAVE LE CORRESPONDE A UN CLIENTE REAL EN CHURN\n')
for (const [clave, razon] of REACTIVADAS_FUERA_DEL_CHURN) {
  const hit = enChurn.get(clave)
  ok(!!hit, `«${clave}» cruza con un «Churn confirmado» del GRC`,
     hit
       ? `${hit.nombre} · ${hit.meses.join(', ')} · MRR ${Math.round(hit.mrr).toLocaleString('es-MX')} — ${razon}`
       : 'ningún cliente del GRC normaliza a esta clave: la línea NO desbloquea nada. '
         + 'Revisar cómo está escrito el nombre en app/churn/aaa-grc-data.ts.')
}

console.log('\n  2 · Y POR ESO ESTAN FUERA DEL SET QUE BLOQUEA\n')
for (const [clave] of REACTIVADAS_FUERA_DEL_CHURN) {
  ok(!NOMBRES_CHURN_GRC.has(clave), `«${clave}» NO está en NOMBRES_CHURN_GRC`)
}

console.log('\n  3 · AL REVES: lo que NO está en la lista sigue bloqueado\n')
const fuera = [...enChurn.keys()].filter(n => !REACTIVADAS_FUERA_DEL_CHURN.has(n))
ok(fuera.length > 0, 'hay nombres en churn que NO son reactivadas',
   `${fuera.length} de ${enChurn.size}. Si esto fuera 0 el control de abajo sería vacío.`)
const siguenBloqueados = fuera.filter(n => NOMBRES_CHURN_GRC.has(n))
ok(siguenBloqueados.length === fuera.length,
   'los que no son reactivadas SIGUEN en NOMBRES_CHURN_GRC',
   `${siguenBloqueados.length} de ${fuera.length} bloqueados`)

/* Control NEGATIVO duro: una clave inventada no puede quedar desbloqueada.
   Si esto pasara, el Set no estaría filtrando nada y los dos bloques de
   arriba darían verde por construcción. */
const inventada = 'estaempresanoexisteenningunafuente'
ok(!NOMBRES_CHURN_GRC.has(inventada) && !enChurn.has(inventada),
   'una clave inventada no figura en ninguno de los dos conjuntos',
   'control de cordura: prueba que las comprobaciones de arriba miran datos reales')

console.log('\n  ═══════════════════════════════════════════════════════════')
if (fallos.length) {
  console.log(`  *** ${fallos.length} comprobación(es) fallan.`)
  console.log('      Una clave que no cruza deja a la cuenta en Dormidas igual,')
  console.log('      sin avisar. Corregirla mirando el nombre EXACTO del GRC.')
  process.exit(1)
}
console.log('  CADA REACTIVADA DESBLOQUEA A UN CLIENTE REAL, y el resto sigue bloqueado.')
