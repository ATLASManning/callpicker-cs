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
/* EL ALIAS `@/` TAMBIÉN EN EL CARGADOR DE NODE, no sólo en jiti.
   Este comprobador llevaba roto desde que `lib/planes-pago.ts` añadió
   `import crudo from '@/data/planes-pago.json'`: la opción `alias` de jiti no
   alcanza a un `.json`, que acaba en el `require` de Node, y reventaba con
   MODULE_NOT_FOUND antes de comprobar nada. Un verificador que no arranca no es
   un verificador que aprueba. [[feedback-verificar-antes-asegurar]]

   Se parchea el resolvedor en vez de este import concreto para que cubra la
   CLASE entera: cualquier `@/…` que aparezca mañana en la cadena del contexto.
   [[feedback-proactividad-jose-manuel]] */
const { default: Module } = await import('node:module')
const resolverOriginal = Module._resolveFilename
Module._resolveFilename = function (pedido, ...resto) {
  if (typeof pedido === 'string' && pedido.startsWith('@/')) {
    pedido = path.join(RAIZ, pedido.slice(2))
  }
  return resolverOriginal.call(this, pedido, ...resto)
}

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

/* QUÉ SE EXIGE DEPENDE DEL CORTE, y por eso se lee del corte en vez de
   escribirse fijo. Este comprobador nació con la semana 26, que NO medía los
   downgrades, y exigía la frase «EL CORTE NO LOS CUANTIFICA» siempre. En
   cuanto llegó un corte que SÍ los mide (semana 27), el verificador se puso
   rojo por hacer lo correcto: estaba comprobando el corte de entonces, no la
   regla. La regla es que el bloque diga LO QUE EL CORTE SABE y calle lo que
   no, y eso tiene dos caras. [[feedback-verificar-antes-asegurar]]

   Se usa EXACTAMENTE la misma condición que `atlas-context.ts`, no una copia
   tecleada: un espejo a mano deja de ser espejo. */
const corte = await jiti.import(path.join(RAIZ, 'app/churn/reporte-actual.ts'))
const REP = Object.values(corte).find(v => v && typeof v === 'object' && 'periodo' in v)
if (!REP) {
  console.log('  *** no encuentro el corte vigente en app/churn/reporte-actual.ts')
  process.exit(1)
}
const SIN_MEDIR = REP.downgradeTotalReal === undefined && REP.downgrades.length === 0
const CUBO = REP.downgrades
  .filter(d => d.cliente.trimStart().startsWith('+'))
  .reduce((s, d) => s + d.perdida, 0)

/* Cuando el corte NO los mide: que lo diga y que prohíba el cero. */
const EXIGIDO_SIN_MEDIR = [
  [/EL CORTE NO LOS CUANTIFICA/i,
   'decir con palabras que el corte no mide los downgrades'],
  [/NO respondas que hubo cero/i,
   'prohibirle al modelo contestar un cero'],
]

/* Cuando SÍ los mide: que aparezca el total declarado y, si hay cubo de
   cierre, que diga que ese dinero NO tiene nombre. Publicar un top como si
   fuera el mes entero es el mismo error al revés. [[feedback-tablas-deben-cerrar]] */
const TOTAL_TAL_CUAL = (REP.downgradeTotalReal ?? 0).toLocaleString('es-MX')
const EXIGIDO_MEDIDO = [
  /* El importe se compara FORMATEADO IGUAL que lo escribe `atlas-context.ts`
     —`toLocaleString('es-MX')`, sin redondear—. Redondearlo aquí buscaba
     «$31,188» en un bloque que dice «$31,187.97» y daba un rojo falso. */
  [new RegExp('el corte declara \\$' + TOTAL_TAL_CUAL.replace(/[.]/g, '\\.'), 'i'),
   `publicar el total declarado de downgrades ($${TOTAL_TAL_CUAL})`],
  ...(CUBO > 0 ? [[
    /NO tienen nombre en el corte: no los atribuyas a nadie/i,
    'avisar de que el dinero del cubo de cierre no tiene nombre',
  ]] : []),
]

const EXIGIDO = SIN_MEDIR ? EXIGIDO_SIN_MEDIR : EXIGIDO_MEDIDO
console.log(`\n  corte vigente: ${REP.periodo} · downgrades `
  + (SIN_MEDIR
     ? 'NO medidos → se exige que el hueco esté DICHO'
     : `medidos ($${(REP.downgradeTotalReal ?? 0).toLocaleString('es-MX')}), `
       + `cubo $${CUBO.toLocaleString('es-MX')} → se exige total y aviso de cubo`))

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

/* SEGUNDO CONTROL NEGATIVO, para la rama de corte MEDIDO. Es el fallo que le
   toca a esa rama: publicar el TOP como si fuera el mes entero, sin el total
   declarado y sin decir que el resto no tiene nombre. Si los patrones de
   `EXIGIDO_MEDIDO` pasaran con esto, no comprobarían nada.
   [[feedback-probar-al-reves]] [[feedback-tablas-deben-cerrar]] */
const TEXTO_TOP_COMO_MES =
  'CHURN — CORTE VIGENTE (apartado Churn > ' + REP.periodo + ', al ' + REP.fecha + '):\n' +
  '  Downgrades de ' + REP.periodo + ' — lista COMPLETA y CERRADA de 6 clientes.\n'
if (!SIN_MEDIR) {
  const pasan = EXIGIDO.filter(([rx]) => rx.test(TEXTO_TOP_COMO_MES)).length
  if (pasan > 0) {
    console.log(`  *** ${pasan} patrón(es) EXIGIDO pasan con el top publicado como el mes: no prueban nada.`)
    process.exit(1)
  }
  const caza = PROHIBIDO.some(([rx]) => rx.test(TEXTO_TOP_COMO_MES))
  console.log(`  control negativo (corte medido): los EXIGIDO rechazan el top-como-mes`
    + (caza ? ' y un PROHIBIDO lo caza' : ''))
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
  if (ok) console.log(SIN_MEDIR
    ? '  ok · el bloque dice lo que no sabe, en vez de un cero'
    : '  ok · el bloque publica el total del corte y marca el dinero sin nombre')
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
  console.log(`  *** ${fallos} problema(s). ` + (SIN_MEDIR
    ? 'El modelo leería un cero que nadie midió.'
    : 'El modelo leería el top como si fuera el mes entero.'))
  process.exit(1)
}
console.log(SIN_MEDIR
  ? '  Las dos sesiones reciben el hueco DICHO, no un cero.\n'
  : '  Las dos sesiones reciben el total del corte y el aviso del cubo.\n')
