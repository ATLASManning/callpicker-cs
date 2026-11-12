/**
 * ¿ATLAS SABE QUE NO SABE?
 * ========================
 *
 *     node scripts/revisa-contexto-comunicaciones.mjs
 *
 * El bloque de Comunicación de `lib/atlas-context.ts` es distinto a todos los
 * demás: no le entrega un dato al modelo, le entrega **el borde de su
 * ignorancia**. Atlas no puede abrir el conector —no hay credencial—, así que
 * sobre el CONTENIDO de las comunicaciones no sabe absolutamente nada.
 *
 * Y ya sabemos qué pasa cuando a este modelo se le quita un dato sin decirle
 * con palabras que no lo tiene: en octubre, al cerrarle el candado de cartera,
 * **se lo inventó**. [[auditoria-acceso-oct2026]]
 *
 * Entonces este comprobador verifica DOS cosas opuestas:
 *
 *   EXIGIDO    — que la prohibición esté escrita, explícita, y que la liga
 *                correcta se entregue (que es lo único verdadero que puede dar).
 *   PROHIBIDO  — que en ninguna parte del contexto haya una frase que AFIRME
 *                vacío sobre comunicaciones.
 *
 * Y trae su propio control negativo: un texto fabricado que sí contiene esas
 * frases. Si el detector no lo caza, el comprobador truena. Un verificador que
 * concluye éxito por omisión es peor que no tener ninguno.
 * [[feedback-verificar-antes-asegurar]] [[feedback-probar-al-reves]]
 */

import jitiPkg from 'jiti'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const crear = jitiPkg.createJiti ?? jitiPkg
const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/* El alias `@/` también en el resolvedor de Node, no sólo en jiti: hay
   imports de `.json` en la cadena del contexto que jiti deja pasar al require
   de Node. Misma razón que en `revisa-contexto-churn-dos-sesiones.mjs`. */
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

/* supabase-js crea un RealtimeClient al construirse y Node 20 no trae
   `WebSocket` global. El contexto sólo lee por REST. Un tapón que explota si
   alguien lo usa de verdad. */
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {
    constructor() {
      throw new Error('Este comprobador no usa realtime. Si hace falta, instalar «ws».')
    }
  }
}

/* Credenciales desde .env.local. NUNCA se imprimen. */
const { config } = await import('dotenv')
config({ path: path.join(RAIZ, '.env.local'), quiet: true })

/* TAPÓN DEL ARNÉS, NO DEL PRODUCTO.
 *
 * `lib/cortes-cuenta.ts` hace `(await import('fs')).default`, que es correcto
 * y funciona en Next. Jiti convierte ese `import()` dinámico en un `require`,
 * y el objeto de un módulo CJS no trae `.default`: revienta con
 * «Cannot read properties of undefined (reading 'existsSync')» al construir el
 * dossier de una cuenta.
 *
 * Se le añade el `.default` al objeto que devuelve `require`, que es el MISMO
 * que verá el código bajo prueba. Se arregla el arnés y no el producto: tocar
 * `lib/cortes-cuenta.ts` para que un comprobador arranque sería cambiar lo que
 * se despliega por conveniencia de lo que se mide. */
/* Se engancha en `Module._load` y NO con un `createRequire` propio: jiti
   mantiene su PROPIA instancia de require y su caché, así que parchear el
   objeto que devuelve mi require tocaba otro ejemplar y el código bajo prueba
   seguía viendo `undefined`. Por aquí pasan todas.
   Y se mira el VALOR de `.default`, no si la llave existe: algunos paquetes la
   traen declarada valiendo `undefined`. */
const CON_DEFAULT = new Set(['fs', 'node:fs', 'xlsx'])
const cargarOriginal = Module._load
Module._load = function (pedido, ...resto) {
  const m = cargarOriginal.call(this, pedido, ...resto)
  if (CON_DEFAULT.has(pedido) && m && typeof m === 'object' && m.default === undefined) {
    try { m.default = m } catch { /* congelado: se deja como está */ }
  }
  return m
}

const mod = await jiti.import(path.join(RAIZ, 'lib/atlas-context.ts'))
const buildAtlasContext  = mod.buildAtlasContext  ?? mod.default?.buildAtlasContext
const buildCuentaDossier = mod.buildCuentaDossier ?? mod.default?.buildCuentaDossier

const liga = await jiti.import(path.join(RAIZ, 'lib/comunicaciones-liga.ts'))
const CONECTOR = liga.CONECTOR_COMUNICACIONES ?? liga.default?.CONECTOR_COMUNICACIONES

/* ── Lo que TIENE que estar ───────────────────────────────────────────────── */

const EXIGIDO_GENERAL = [
  [/NO PUEDES LEERLO/i,
   'el bloque debe decirle al modelo, con esas palabras, que no puede abrirlo'],
  [/PROHIBIDO/i,
   'debe traer la lista de lo que no puede afirmar'],
  [/no tiene comunicaciones/i,
   'debe nombrar la frase prohibida para que el modelo la reconozca (va DENTRO de la prohibición)'],
  [/tickets[\s\S]{0,80}ABIERTOS/i,
   'debe decir que ahí están los tickets abiertos, que es lo que el tablero no mide'],
  [new RegExp(CONECTOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
   'debe entregar la raíz del conector para poder armar la liga'],
  [/SIN CID/i,
   'debe decir que una cuenta sin CID no es una cuenta sin comunicaciones'],
]

/* ── Lo que NO puede estar ────────────────────────────────────────────────── */

/* USO CONTRA MENCIÓN — y me pilló mi propio comprobador.
 *
 * Estos patrones tienen que cazar una AFIRMACIÓN de vacío, no la PROHIBICIÓN
 * de afirmarla. El bloque legítimo dice: «Nunca respondas que la cuenta "no
 * tiene comunicaciones", "no ha llamado"…» — o sea que CONTIENE las frases
 * prohibidas, precisamente para que el modelo las reconozca.
 *
 * Mi primera versión acotó bien el patrón de «no tiene comunicaciones»
 * (exigiendo un sujeto delante) y se le olvidó hacer lo mismo con «no ha
 * llamado», así que el comprobador salió en rojo contra el texto correcto.
 *
 * La solución no es parchar ese patrón: es aplicar la distinción a TODA la
 * clase. Lo que va entre comillas angulares «…» en este contexto es una
 * MENCIÓN, nunca un uso. Se quitan antes de buscar, y así ningún patrón futuro
 * tropieza con la misma piedra. [[feedback-proactividad-jose-manuel]] */
const sinMenciones = (t) => t.replace(/«[^»]*»/g, '«…»')
const PROHIBIDO = [
  [/\b(esta cuenta|el cliente|la cuenta) no tiene comunicaciones/i,
   'AFIRMA que una cuenta no tiene comunicaciones, y eso no se ha podido medir'],
  [/\b0 comunicaciones\b/i,
   'publica un conteo de comunicaciones en cero sin haberlo medido'],
  [/\bsin tickets abiertos\b/i,
   'afirma que no hay tickets abiertos; el tablero NO mide los abiertos'],
  [/\b(no ha llamado|nunca ha llamado|no registra llamadas)\b/i,
   'afirma ausencia de llamadas apoyándose en un registro que no se leyó'],
  [/último contacto según el registro de comunicaciones/i,
   'fecha un último contacto con una fuente que no se pudo abrir'],
]

/* ── Control negativo: texto fabricado que DEBE ser cazado ────────────────── */

/* EL CONTROL NEGATIVO TIENE QUE EJERCITAR **TODOS** LOS PATRONES.
 *
 * La primera versión de este texto sólo disparaba cuatro de los cinco, y el
 * comprobador —con razón— salió en rojo: un patrón que nunca se prueba es un
 * patrón del que no se sabe si funciona. Si mañana se añade uno a PROHIBIDO,
 * hay que añadir aquí la frase que lo dispare. */
const TEXTO_MALO = `
  REGISTRO DE COMUNICACIONES — apartado Comunicación
  Esta cuenta no tiene comunicaciones registradas en los últimos 90 días.
  Tiene 0 comunicaciones y está sin tickets abiertos, así que no ha llamado.
  Su último contacto según el registro de comunicaciones fue el 2 de agosto.
`

/* ── Carrera ──────────────────────────────────────────────────────────────── */

let fallos = 0
const falla = (m) => { console.log(`  FALLA · ${m}`); fallos++ }
const ok    = (m) => console.log(`  ok    · ${m}`)

function revisa(etiqueta, texto, exigidos) {
  console.log(`\n  ── ${etiqueta} ──`)
  console.log(`  bloque de ${texto.length} caracteres`)
  for (const [re, porque] of exigidos) {
    if (re.test(texto)) ok(porque)
    else falla(`FALTA: ${porque}  (${re})`)
  }
  /* Se buscan los prohibidos SIN las menciones entre «…»: ahí es donde el
     propio bloque escribe las frases que está prohibiendo. */
  const usos = sinMenciones(texto)
  for (const [re, porque] of PROHIBIDO) {
    if (re.test(usos)) falla(`APARECE algo prohibido: ${porque}  (${re})`)
  }
}

console.log('\n  CONTEXTO GENERAL — las dos sesiones\n')

const SESIONES = [
  ['administración (sin acotar)', undefined],
  ['asesor acotado',             { rol: 'asesor', asesor: 'Erick Sánchez', email: 'erick@callpicker.com' }],
]

for (const [etiqueta, sesion] of SESIONES) {
  const { text, modulos } = await buildAtlasContext('¿dónde veo las comunicaciones?', sesion)
  revisa(etiqueta, text, EXIGIDO_GENERAL)
  if (modulos.includes('comunicaciones-registro')) ok('el módulo queda registrado en `modulos`')
  else falla('el bloque no se registró en `modulos`')
}

console.log('\n  DOSSIER DE UNA CUENTA REAL — la liga tiene que venir armada\n')

/* POR QUÉ SE CAMBIA EL DIRECTORIO ANTES DE PEDIR EL DOSSIER.
 *
 * `lib/cortes-cuenta.ts` abre `data/cortes-facturacion.xlsx` con
 * `(await import('xlsx')).default`, y jiti resuelve ESE import por una vía que
 * no pasa por `Module._load`, así que el tapón de arriba no lo alcanza y el
 * dossier revienta antes de armarse.
 *
 * En vez de seguir peleando con el cargador —o, peor, de tocar código de
 * producción para que un comprobador arranque—, se le quita la NECESIDAD: ese
 * módulo comprueba `fs.existsSync` ANTES de usar xlsx y, si el libro no está,
 * devuelve un mapa vacío. Apuntando el `cwd` a un directorio sin `data/`, la
 * rama de xlsx no se pisa nunca.
 *
 * CONSECUENCIA, dicha en voz alta: el dossier que se revisa aquí sale SIN la
 * sección de cortes de facturación. Da igual para lo que mide este archivo
 * —la sección de comunicaciones—, pero no vale leer este comprobador como si
 * hubiera revisado el dossier completo. [[feedback-verificar-antes-asegurar]] */
const cwdOriginal = process.cwd()
process.chdir(path.join(RAIZ, 'scripts'))
let dossier = null
try {
  dossier = await buildCuentaDossier('cuéntame de ABRL SISTEMAS & PROYECTOS')
} finally {
  process.chdir(cwdOriginal)
}
if (!dossier) {
  falla('no se pudo construir el dossier de la cuenta de prueba (¿cambió de nombre?)')
} else {
  const EXIGIDO_CUENTA = [
    [/REGISTRO DE COMUNICACIONES de esta cuenta/i, 'el dossier trae su propia sección'],
    [new RegExp(CONECTOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?q=\\d+'),
     'la liga viene ARMADA con el CID, no como plantilla'],
    [/NO PUEDES LEER ESE REGISTRO/i, 'repite la prohibición donde el modelo va a estar mirando'],
  ]
  revisa(`dossier · ${dossier.empresa}`, dossier.text, EXIGIDO_CUENTA)
}

console.log('\n  CONTROL NEGATIVO — el detector tiene que cazar el texto fabricado\n')

/* Se le aplica el MISMO filtro de menciones que al texto real: si quitar las
   «…» hubiera dejado ciego al detector, aquí se vería. */
let cazados = 0
const malo = sinMenciones(TEXTO_MALO)
for (const [re, porque] of PROHIBIDO) {
  if (re.test(malo)) { cazados++; ok(`cazado: ${porque}`) }
  else falla(`NO cazó: ${porque}  (${re})`)
}
console.log(`  ${cazados}/${PROHIBIDO.length} patrones cazaron el texto fabricado`)

/* Y la otra mitad del control: el bloque BUENO no debe dispararlos, aunque
   contenga las mismas palabras dentro de la prohibición. Eso ya se comprobó
   arriba al correr PROHIBIDO sobre el contexto real. */

console.log('\n  ' + '─'.repeat(70))
if (fallos) {
  console.log(`  ${fallos} FALLA(S). Atlas podría inventar lo que no puede leer.\n`)
  process.exit(1)
}
console.log('  Atlas sabe que NO sabe, y sabe a dónde mandar a quien pregunte.\n')
