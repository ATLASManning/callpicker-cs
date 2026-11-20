/**
 * LA REPRODUCCIÓN ESTÁTICA DE LOS CINCO TRAMOS
 * ============================================
 *
 *     node scripts/repro-brecha-colores.mjs <carpeta-destino>
 *
 * Escribe un `index.html` con los cinco tramos de `BRECHA_CONSUMO` pintados con
 * los colores REALES —calculados con `tonoSobreFondo` de `lib/contraste.ts`— y
 * con el `globals.css` COMPILADO que sirve el servidor de desarrollo.
 *
 * POR QUÉ HACE FALTA
 * ------------------
 * `scripts/mide-brecha-colores.mjs` prueba el CÁLCULO. No prueba el render, y
 * en este panel la diferencia ya costó una publicación: la primera versión de
 * `CuentaVeredicto.tsx` pasaba todas las revisiones de código y se veía en
 * blanco sobre blanco. El método que cerró aquella ronda —y las dos anteriores
 * del mismo bug— fue montar la reproducción con el CSS real y MIRARLA.
 *
 * Se mira estático y no la ficha de verdad porque la ficha exige sesión
 * iniciada, y las credenciales son del usuario: no se teclean por él.
 *
 * El `<link>` apunta al dev server para que la cascada sea la de verdad
 * —`.cp-card`, `.cp-light`, el pulso— y no una copia recortada a mano de las
 * reglas que uno cree que importan. Si el servidor no está arriba, la página
 * se ve sin esa cascada y eso NO prueba nada: el guión lo avisa.
 *
 * No va en `public/`: ahí no se pone nada que no tenga que servirse.
 */
import jitiPkg from 'jiti'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const crear = jitiPkg.createJiti ?? jitiPkg
const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const jiti = crear(fileURLToPath(import.meta.url), { alias: { '@': RAIZ } })

const destino = process.argv[2]
if (!destino) {
  console.log('\n  Falta la carpeta destino.\n'
            + '  node scripts/repro-brecha-colores.mjs <carpeta>\n')
  process.exit(2)
}
const PUERTO = process.argv[3] || '3100'

const { tonoSobreFondo } = await jiti.import(path.join(RAIZ, 'lib/contraste.ts'))
const { BRECHA_CONSUMO } = await jiti.import(path.join(RAIZ, 'lib/alertas-veredicto.ts'))

/* El mapa se lee del componente, igual que en el medidor: una tercera copia a
   mano de estos colores sería una tercera cosa que se desincroniza. */
const TSX = fs.readFileSync(path.join(RAIZ, 'components/CuentaVeredicto.tsx'), 'utf8')
const BLOQUE = TSX.match(/const SEV: Record<PesoHallazgo,[\s\S]*?\n\}(?!\s*>)/)
if (!BLOQUE) { console.log('\n  *** no se encontró el mapa SEV en el componente.\n'); process.exit(2) }
const SEV = {}
for (const m of BLOQUE[0].matchAll(
  /(\w+):\s*\{\s*bg:\s*'([^']+)',\s*borde:\s*(?:'([^']+)'|null),\s*tono:\s*'([^']+)',\s*pulso:\s*(true|false)/g)) {
  SEV[m[1]] = { bg: m[2], borde: m[3] ?? null, tono: m[4], pulso: m[5] === 'true' }
}
if (!Object.keys(SEV).length) { console.log('\n  *** el mapa SEV se leyó vacío.\n'); process.exit(2) }

/* QUÉ SE MIRA. Desde el 20 nov 2026 la alarma la llevan las ALERTAS —la brecha
   es indicio de downgrade— y el peso de cada una sale de la severidad de su
   tipo. Así que lo que hay que ver son los tres pesos con el título REAL de su
   alerta, más la tarjeta de la escala, que es la que sale cuando el detector no
   ha dicho nada y por eso no grita.

   Los títulos se leen del catálogo de `lib/alertas.ts`. No se importa porque
   arrastra Supabase, que no arranca bajo Node 20. */
const ALE = fs.readFileSync(path.join(RAIZ, 'lib/alertas.ts'), 'utf8')
const tituloDe = (tipo) => {
  const m = ALE.match(new RegExp(`tipo: '${tipo}',[\\s\\S]{0,200}?titulo: '([^']+)'`))
  return m ? m[1] : null
}
const MUESTRA = [
  { peso: 'critica', tipo: 'consumo_cero',
    prueba: 'Cero minutos consumidos en los 5 meses medidos (2026-07 a 2026-11), y paga $7,264 al mes.' },
  { peso: 'alta', tipo: 'uso_bajo',
    prueba: 'Nunca pasó del 9% de su plan en 5 meses, y paga $11,029 al mes.' },
  { peso: 'media', tipo: 'plan_sobrado',
    prueba: 'Nunca pasó del 33% de su plan en 5 meses: le sobra el 67% de la bolsa que paga, y paga $7,679 al mes.' },
]
let filas = ''
for (const m of MUESTRA) {
  const titulo = tituloDe(m.tipo)
  if (!titulo) {
    console.log(`\n  *** no se encontró el título de «${m.tipo}» en lib/alertas.ts.\n`)
    process.exit(2)
  }
  const s = SEV[m.peso]
  if (!s) { console.log(`\n  *** el componente no pinta el peso «${m.peso}».\n`); process.exit(2) }
  const cT = tonoSobreFondo(s.tono, s.bg, 4.5)
  const cP = tonoSobreFondo(s.tono, s.bg, 7)
  filas += `      <li class="${s.pulso ? 'cp-pulso-alerta' : ''}"`
         + ` style="background:${s.bg};border:1px solid ${s.borde};border-left:3px solid ${cT};border-radius:8px;padding:6px 8px">
        <p class="t" style="color:${cT}">${titulo}</p>
        <p class="p" style="color:${cP}">${m.prueba}</p>
      </li>\n`
}
/* Y la tarjeta sin peso, que es la mayoría de la cartera: se lee y no grita. */
const SIN = BRECHA_CONSUMO.find(t => !t.sobra)
filas += `      <li>
        <p class="t" style="color:#122E5E">${SIN.titulo}</p>
        <p class="p" style="color:#3D4B5C">consume el 82% de su bolsa</p>
      </li>\n`

const HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Repro — brecha plan/consumo</title>
<link rel="stylesheet" href="http://localhost:${PUERTO}/_next/static/css/app/layout.css">
<style>
  body { background:#F5F8FB; margin:0; padding:24px; font-family:system-ui,sans-serif }
  .panel { max-width:380px; background:#FFFFFF; border:1px solid #DFE8EF;
           border-left:4px solid #DC2626; border-radius:12px; padding:16px }
  ul { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:7px }
  .t { font-size:11.5px; font-weight:600; line-height:1.15; margin:0 }
  .p { font-size:10.5px; line-height:1.35; margin:0 }
  .rot { font-size:10px; font-weight:800; letter-spacing:.3px; color:#10355D; margin:0 0 10px }
</style></head>
<body>
  <div class="cp-light panel">
    <p class="rot">LA BRECHA, COMO LA VE EL ASESOR</p>
    <ul>
${filas}    </ul>
  </div>
</body></html>
`

fs.mkdirSync(destino, { recursive: true })
fs.writeFileSync(path.join(destino, 'index.html'), HTML)
console.log(`\n  Escrito ${path.join(destino, 'index.html')}`)
console.log(`  El CSS se pide a http://localhost:${PUERTO} — si el servidor no está`)
console.log('  arriba, la página se ve SIN la cascada real y mirarla no prueba nada.\n')
