/**
 * LOS COLORES DE LA BRECHA PLAN-CONSUMO
 * =====================================
 *
 *     node scripts/mide-brecha-colores.mjs
 *
 * Dirección pidió el 20 nov 2026 que la brecha entre el plan contratado y el
 * consumo real se pinte «con mayor fuerza, con colores que alerten, incluso
 * parpadeante», y que se cubran TODOS los casos por debajo del plan, no sólo
 * el tramo de menos del 40% que existía.
 *
 * POR QUÉ ESTE GUIÓN EXISTE
 * -------------------------
 * Este panel —`components/CuentaVeredicto.tsx`— ya se publicó una vez ilegible:
 * se escribió con letra blanca sobre la ficha de cuenta, que es una ISLA CLARA,
 * y el texto sólo se leía seleccionándolo. La ronda siguiente enseñó algo más
 * fino: medir contra el blanco del panel cuando la caja tiene fondo tintado da
 * cifras que pasan sobre blanco y fallan donde el color de verdad se pinta.
 *
 * Aquí cada tono se mide contra el fondo de SU PROPIA caja, con la función REAL
 * de `lib/contraste.ts` —no con una copia—, y con el objetivo de TEXTO (4.5),
 * que no es el 3 que esa función trae por defecto para objetos gráficos.
 *
 * Y LA ESCALA SE LEE, NO SE TECLEA. `BRECHA_CONSUMO` vive en
 * `lib/alertas-veredicto.ts`. Un espejo tecleado a mano deja de ser espejo en
 * cuanto alguien toca el original, y entonces este guión daría verde sobre una
 * escala que ya no existe. [[feedback-verificar-antes-asegurar]]
 *
 * LAS CUATRO COMPROBACIONES
 * -------------------------
 *   1. la escala sube, no deja huecos y cierra donde empieza la tarjeta del
 *      límite — si se separaran, una cuenta al 97% publicaría «su plan está
 *      bien dimensionado» Y «se está acercando al límite», que se contradicen;
 *   2. cada severidad del componente existe en la escala y al revés;
 *   3. título y prueba miden ≥4.5:1 contra el fondo de su caja;
 *   4. CONTROL NEGATIVO: el tono crudo, sin pasar por `tonoSobreFondo`, NO
 *      debe alcanzar. Si alcanzara, la función no estaría haciendo nada y este
 *      guión estaría dando verde por una medición vacía.
 */
import jitiPkg from 'jiti'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* `import { createJiti }` NO sirve: la versión instalada es CommonJS y Node
   rechaza el export con nombre. Mismo arranque que `mide-avatar-rol.mjs`. */
const crear = jitiPkg.createJiti ?? jitiPkg
const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const jiti = crear(fileURLToPath(import.meta.url), { alias: { '@': RAIZ } })

const { tonoSobreFondo } = await jiti.import(path.join(RAIZ, 'lib/contraste.ts'))
const { BRECHA_CONSUMO, UMBRAL_CERCA_DEL_LIMITE, tramoBrecha } =
  await jiti.import(path.join(RAIZ, 'lib/alertas-veredicto.ts'))
/* `UMBRALES` se lee del FUENTE y no se importa: `lib/alertas-detectar.ts`
   arrastra `lib/supabase.ts`, y el cliente de Supabase no arranca bajo Node 20
   («Node.js 20 detected without native WebSocket support»). Leer la constante
   del texto es además lo que ya hace `scripts/mide-brecha-plan.py`. */
const DET = fs.readFileSync(path.join(RAIZ, 'lib/alertas-detectar.ts'), 'utf8')
const M_PLAN = DET.match(/planSobrado:\s*([0-9.]+)/)
if (!M_PLAN) {
  console.log('\n  *** lib/alertas-detectar.ts ya no define UMBRALES.planSobrado.')
  console.log('      Sin ese numero no se puede comprobar el espejo. No se mide.\n')
  process.exit(2)
}
const UMBRALES = { planSobrado: Number(M_PLAN[1]) }

const canal = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const aRgb = (h) => {
  let s = String(h).replace('#', '')
  if (s.length === 3) s = [...s].map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16))
}
const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
const ratio = (a, b) => {
  const [alto, bajo] = [lum(aRgb(a)), lum(aRgb(b))].sort((p, q) => q - p)
  return (alto + 0.05) / (bajo + 0.05)
}

/* El mapa de colores se lee del COMPONENTE, por la misma razón que la escala
   se lee de su módulo: si alguien cambia un fondo ahí y aquí sigue el viejo,
   este guión mide un par que no se pinta en ninguna pantalla. */
const TSX = fs.readFileSync(path.join(RAIZ, 'components/CuentaVeredicto.tsx'), 'utf8')
/* El `(?!\s*>)` NO es adorno: el tipo del mapa también acaba en `\n}`, pero el
   suyo sigue con `> = {`. Sin el lookahead, la captura se corta en la
   anotación de tipo y abajo se miden CERO pares — y una medición vacía
   imprimiría «todo mide» igual que una buena. */
const BLOQUE = TSX.match(/const SEV: Record<PesoHallazgo,[\s\S]*?\n\}(?!\s*>)/)
if (!BLOQUE) {
  console.log('\n  *** components/CuentaVeredicto.tsx ya no define el mapa SEV.')
  console.log('      O cambió de nombre, o cambió de forma. No se mide a ciegas.\n')
  process.exit(2)
}
const SEV = {}
for (const m of BLOQUE[0].matchAll(
  /(\w+):\s*\{\s*bg:\s*'([^']+)',\s*borde:\s*(?:'([^']+)'|null),\s*tono:\s*'([^']+)',\s*pulso:\s*(true|false)/g)) {
  SEV[m[1]] = { bg: m[2], borde: m[3] ?? null, tono: m[4], pulso: m[5] === 'true' }
}

/* Un mapa vacío recorrería los bucles de abajo sin medir nada y sin quejarse.
   Medir cero pares y declarar éxito es peor que no medir. */
if (!Object.keys(SEV).length) {
  console.log('\n  *** el mapa SEV se leyó VACÍO: la expresión que lo parsea ya no')
  console.log('      casa con cómo está escrito. Medir cero pares daría verde.\n')
  process.exit(2)
}

let fallan = 0
const mal = (t) => { console.log('    *** ' + t); fallan++ }

console.log('')
console.log('  LA BRECHA PLAN-CONSUMO — escala, colores y control negativo')
console.log('')

/* ── 1. La escala ───────────────────────────────────────────────────────── */
console.log('  1. LA ESCALA, leída de lib/alertas-veredicto.ts')
let previo = 0
for (const t of BRECHA_CONSUMO) {
  console.log(`     ${String(previo).padStart(3)}% a ${String(t.hasta).padStart(3)}%  `
            + `${(t.sobra ? 'le sobra' : 'bien').padEnd(9)} ${t.titulo}`)
  if (t.hasta <= previo) mal(`el tramo ${t.hasta} no sube respecto al anterior (${previo})`)
  previo = t.hasta
}
if (previo !== UMBRAL_CERCA_DEL_LIMITE) {
  mal(`la escala cierra en ${previo}% y la tarjeta del límite empieza en `
    + `${UMBRAL_CERCA_DEL_LIMITE}%. Entre los dos números una cuenta publicaría `
    + `las dos frases, o ninguna.`)
} else {
  console.log(`     cierra en ${previo}%, justo donde empieza la tarjeta del límite. OK`)
}
/* Que no haya hueco se comprueba RECORRIENDO, no leyendo la lista: un `hasta`
   bien escrito con un `find` mal escrito deja el mismo hueco. */
for (let p = 0; p < UMBRAL_CERCA_DEL_LIMITE; p += 0.5) {
  if (!tramoBrecha(p)) { mal(`el ${p}% no cae en ningún tramo`); break }
}
console.log('')

/* ── 2. El espejo del 70, y los pesos que el componente pinta ─────────── */
console.log('  2. EL ESPEJO: donde acaba «le sobra» y donde salta plan_sobrado')
const topeEscala = BRECHA_CONSUMO.filter(t => t.sobra).slice(-1)[0]?.hasta
if (topeEscala !== UMBRALES.planSobrado) {
  mal(`la ficha deja de decir «le sobra» en el ${topeEscala}% y el detector abre `
    + `plan_sobrado hasta el ${UMBRALES.planSobrado}%. Entre los dos numeros la `
    + `ficha y la lista de alertas dirian cosas distintas de la misma cuenta.`)
} else {
  console.log(`     los dos valen ${topeEscala}%. OK`)
}
/* Los pesos los pone `PESO_DE_SEVERIDAD`, traduciendo la severidad del
   catalogo. Que el componente pinte EXACTAMENTE esos, ni uno mas ni uno
   menos: uno de mas es codigo muerto que parece vivo, uno de menos es un
   hallazgo sin color. */
const VER = fs.readFileSync(path.join(RAIZ, 'lib/alertas-veredicto.ts'), 'utf8')
const MAPA = VER.match(/const PESO_DE_SEVERIDAD[\s\S]*?\n  \}/)
if (!MAPA) {
  mal('no se encontro PESO_DE_SEVERIDAD en lib/alertas-veredicto.ts')
} else {
  const pesos = new Set([...MAPA[0].matchAll(/:\s*'(\w+)'/g)].map(m => m[1]))
  for (const p of pesos) if (!SEV[p]) mal(`se asigna el peso «${p}» y el componente no lo pinta`)
  for (const p of Object.keys(SEV)) if (!pesos.has(p)) mal(`el componente pinta «${p}» y nadie lo asigna`)
  if (!fallan) console.log(`     ${pesos.size} pesos, todos con color y todos usados. OK`)
}
console.log('')

/* ── 3 y 4. Los pares, y el control negativo ────────────────────────────── */
console.log('  3. LOS PARES, medidos con tonoSobreFondo() contra SU fondo')
console.log('')
console.log('     sev      fondo    título          prueba   crudo   pulso')
for (const [s, c] of Object.entries(SEV)) {
  const cTitulo = tonoSobreFondo(c.tono, c.bg, 4.5)
  const rTitulo = ratio(cTitulo, c.bg)
  /* La prueba sólo se recalcula donde hay caja; sin caja hereda TX_SUAVE, que
     ya está medido en el propio componente desde la 8ª ronda. */
  const conCaja = c.borde !== null
  const cPrueba = conCaja ? tonoSobreFondo(c.tono, c.bg, 7) : null
  const rPrueba = conCaja ? ratio(cPrueba, c.bg) : null
  const rCrudo = ratio(c.tono, c.bg)
  console.log(`     ${s.padEnd(8)} ${c.bg}  ${cTitulo} ${rTitulo.toFixed(2)}`
            + `  ${conCaja ? `${cPrueba} ${rPrueba.toFixed(2)}` : '   —  (sin caja)   '}`
            + `  ${rCrudo.toFixed(2)}   ${c.pulso ? 'sí' : 'no'}`)
  if (rTitulo < 4.5) mal(`el título de «${s}» mide ${rTitulo.toFixed(2)}:1 sobre ${c.bg}`)
  if (conCaja && rPrueba < 4.5) mal(`la prueba de «${s}» mide ${rPrueba.toFixed(2)}:1`)
  /* CONTROL NEGATIVO. Si el tono crudo ya alcanzara, `tonoSobreFondo` no
     estaría corrigiendo nada y estas cifras no probarían nada. */
  if (conCaja && rCrudo >= 4.5) {
    mal(`el tono crudo de «${s}» ya mide ${rCrudo.toFixed(2)}:1 sobre su caja. `
      + `La corrección no está haciendo nada: esta medición no prueba nada.`)
  }
}
console.log('')

/* ── El parpadeo: que esté declarado Y que esté apagado para quien lo pida ── */
console.log('  4. EL PULSO')
const CSS = fs.readFileSync(path.join(RAIZ, 'app/globals.css'), 'utf8')
const clases = Object.entries(SEV).filter(([, c]) => c.pulso).map(([s]) => s)
if (!clases.length) {
  console.log('     ninguna severidad pulsa.')
} else if (!/@keyframes\s+cp-pulso-alerta/.test(CSS)) {
  mal('«' + clases.join(', ') + '» pide pulso y globals.css no define cp-pulso-alerta')
} else if (!/prefers-reduced-motion[\s\S]{0,400}cp-pulso-alerta|cp-pulso-alerta[\s\S]{0,400}prefers-reduced-motion/.test(CSS)) {
  mal('cp-pulso-alerta no respeta prefers-reduced-motion')
} else {
  /* Lo que de verdad importa del pulso: que lo que late sea el HALO. Si la
     animación tocara `opacity` o `color`, el texto se apagaría a ratos. */
  const kf = CSS.match(/@keyframes\s+cp-pulso-alerta\s*\{[\s\S]*?\n\}/)[0]
  if (/\bopacity\b|\bcolor\b|\bvisibility\b/.test(kf)) {
    mal('el pulso anima opacity/color/visibility: el TEXTO parpadearía y hay '
      + 'instantes en que el hallazgo no se puede leer. Sólo debe latir el halo.')
  } else {
    console.log(`     «${clases.join(', ')}» pulsa; late el halo (box-shadow), no el texto;`)
    console.log('     apagado bajo prefers-reduced-motion dejando el aro puesto. OK')
  }
}

console.log('')
if (fallan) { console.log(`  *** ${fallan} comprobación(es) FALLAN ***\n`); process.exit(1) }
console.log('  Todo mide. (Esto prueba el cálculo, no el render: eso lo cierra mirar la pantalla.)\n')
