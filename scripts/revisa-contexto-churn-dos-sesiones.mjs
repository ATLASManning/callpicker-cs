/**
 * COMPRUEBA LO QUE ATLAS LEE DEL CORTE VIGENTE, CON LAS DOS SESIONES.
 *
 * `revisa-contexto-corte-vigente.py` sólo mira si quedan cifras tecleadas en el
 * código; no dice QUÉ acaba leyendo el modelo. Esto arma el contexto de verdad
 * —administración y asesor acotado— y le exige al bloque del corte que no
 * afirme un cero que nadie midió.
 *
 * Nació porque con `downgrades: []` el contexto decía, literalmente, «lista
 * COMPLETA y CERRADA de 0 clientes por $0 — no hay un cliente número 1», que es
 * afirmar que en octubre no hubo downgrades cuando el corte anterior reportaba
 * cuatro. Recortarle el dato a un modelo sin decirle QUÉ le falta cambia una
 * fuga por una mentira. [[feedback-contexto-ia-sin-huecos]]
 *
 * Se carga con `jiti` —que ya está en el proyecto— porque `lib/atlas-context.ts`
 * es TypeScript con alias `@/`, y node no lo lee a pelo.
 *
 * USO
 *     node scripts/revisa-contexto-churn-dos-sesiones.mjs
 */
import jitiPkg from 'jiti'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/* jiti es CommonJS: la versión del proyecto exporta la factoría por defecto y
   no como `createJiti`, así que se coge del default. */
const crear = jitiPkg.createJiti ?? jitiPkg
const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const jiti = crear(fileURLToPath(import.meta.url), {
  alias: { '@': RAIZ },
  interopDefault: true,
  esmResolve: true,
})
/* supabase-js construye un RealtimeClient al crear el cliente y en Node 20 no
   hay `WebSocket` global, así que revienta al importar `lib/supabase`. El
   contexto de Atlas NO usa realtime: sólo lee por REST. Un tapón que explota si
   alguien lo llama de verdad deja pasar el import sin fingir que funciona. */
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {
    constructor() {
      throw new Error('Este comprobador no usa realtime. Si hace falta, instalar «ws».')
    }
  }
}

/* .env.local, que es de donde salen las credenciales. NUNCA se imprimen. */
const { config } = await import('dotenv')
config({ path: path.join(RAIZ, '.env.local'), quiet: true })

const mod = await jiti.import(path.join(RAIZ, 'lib/atlas-context.ts'))
const buildAtlasContext = mod.buildAtlasContext ?? mod.default?.buildAtlasContext

const SESIONES = [
  ['administración (sin acotar)', undefined],
  ['asesor acotado',             { rol: 'asesor', asesor: 'Erick Sánchez', email: 'erick@callpicker.com' }],
]

/* Lo que NO puede aparecer en el bloque del corte vigente. Cada patrón lleva
   por qué: un detector sin motivo escrito se borra en cuanto estorba. */
const PROHIBIDO = [
  [/lista COMPLETA y CERRADA de 0 /i,
   'afirma que la lista de downgrades está cerrada en cero'],
  [/0 clientes por \$0/i,
   'publica cero downgrades con importe cero'],
  [/no hay un cliente número 1/i,
   'le prohíbe al modelo nombrar un downgrade cuando el corte no los midió'],
  [/Downgrades de [^—]+— lista COMPLETA/i,
   'cierra la lista de downgrades sin que el corte la haya medido'],
]

/* Y lo que SÍ tiene que estar cuando el corte no los cuantifica. */
const EXIGIDO = [
  [/EL CORTE NO LOS CUANTIFICA/i,
   'decir con palabras que el corte no mide los downgrades'],
  [/NO respondas que hubo cero/i,
   'prohibirle al modelo contestar un cero'],
]

const RX_BLOQUE = /CHURN — CORTE VIGENTE[\s\S]*?(?=\n[A-ZÁÉÍÓÚÑ][^\n]{0,60}:\n|$)/

let fallos = 0
const BLOQUES = []

/* CONTROL NEGATIVO. Un comprobador que nunca ha fallado no ha comprobado nada.
   Esto es, palabra por palabra, lo que el contexto decía ANTES del arreglo:
   si los patrones no lo cazan, están rotos y el verde de abajo no vale.
   [[feedback-verificar-antes-asegurar]] [[feedback-probar-al-reves]] */
const TEXTO_VIEJO =
  'CHURN — CORTE VIGENTE (apartado Churn > Semana 26 · Oct 2026, al 27/10/2026):\n' +
  '  Downgrades de Semana 26 · Oct 2026 — lista COMPLETA y CERRADA de 0 clientes por $0. ' +
  'No hay un cliente número 1: cualquier otro nombre pertenece a otro corte.\n' +
  '  Cancelados $20,234 en 6 cuentas\n'
const cazados = PROHIBIDO.filter(([rx]) => rx.test(TEXTO_VIEJO)).length
console.log(`\n  control negativo: ${cazados}/${PROHIBIDO.length} patrones cazan el texto viejo`)
if (cazados === 0) {
  console.log('  *** LOS PATRONES NO CAZAN NI EL TEXTO QUE VENÍAN A PROHIBIR.')
  process.exit(1)
}
if (EXIGIDO.some(([rx]) => rx.test(TEXTO_VIEJO))) {
  console.log('  *** un patrón EXIGIDO ya pasaba con el texto viejo: no prueba nada.')
  process.exit(1)
}
console.log('  control negativo ok · los patrones saben fallar')

for (const [etq, sesion] of SESIONES) {
  const { text } = await buildAtlasContext('¿cuántos downgrades hubo en octubre?', sesion)
  const m = text.match(RX_BLOQUE)
  console.log(`\n  ── ${etq} ──`)
  if (!m) {
    console.log('  *** no encuentro el bloque «CHURN — CORTE VIGENTE». ' +
                'O cambió el rótulo o la sesión no lo recibe: las dos cosas hay que mirarlas.')
    fallos++
    continue
  }
  const bloque = m[0]
  BLOQUES.push(bloque)
  console.log(`  bloque de ${bloque.length} caracteres`)

  for (const [rx, porque] of PROHIBIDO) {
    const hit = bloque.match(rx)
    if (hit) {
      console.log(`  *** APARECE lo que no debe: ${porque}`)
      console.log(`      «…${hit[0].slice(0, 90)}…»`)
      fallos++
    }
  }
  for (const [rx, porque] of EXIGIDO) {
    if (!rx.test(bloque)) {
      console.log(`  *** FALTA: ${porque}`)
      fallos++
    }
  }

  /* El conteo de cancelaciones tampoco puede salir del número de filas: el cubo
     de cierre no es un cliente. */
  const cancel = bloque.match(/Cancelados \$[\d,.]+ en (\d+) cuentas/)
  console.log(cancel
    ? `  cancelaciones que ve el modelo: ${cancel[1]} cuentas`
    : '  *** no encuentro la línea de cancelados con su conteo')
  if (!cancel) fallos++

  const ok = PROHIBIDO.every(([rx]) => !rx.test(bloque)) && EXIGIDO.every(([rx]) => rx.test(bloque))
  if (ok) console.log('  ok · el bloque dice lo que no sabe, en vez de un cero')
}

/* Y SE DICE SI LAS DOS SESIONES RECIBIERON DE VERDAD COSAS DISTINTAS. Con
   `LECTURA_LIBRE` activo —instrucción de dirección, 15 oct 2026— el acotado
   queda en false y las dos sesiones leen el MISMO bloque. Eso está bien, pero
   callarlo haría creer que se probaron dos caminos cuando se probó uno.
   [[feedback-contexto-ia-sin-huecos]] */
const tamanos = new Set(BLOQUES.map(b => b.length))
console.log(tamanos.size === 1
  ? '\n  AVISO: las dos sesiones reciben el MISMO bloque (LECTURA_LIBRE activo,\n'
    + '  así que `acotado` es false). Esto comprobó UN camino, no dos. Si algún\n'
    + '  día se vuelve a cerrar la lectura, hay que volver a correr esto.'
  : '\n  las dos sesiones reciben bloques distintos: se comprobaron los dos caminos.')

console.log('')
if (fallos) {
  console.log(`  *** ${fallos} problema(s). El modelo leería un cero que nadie midió.`)
  process.exit(1)
}
console.log('  Las dos sesiones reciben el hueco DICHO, no un cero.\n')
