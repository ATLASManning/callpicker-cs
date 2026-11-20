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
const BLOQUE = TSX.match(/const SEV: Record<Severidad,[\s\S]*?\n\}(?!\s*>)/)
if (!BLOQUE) { console.log('\n  *** no se encontró el mapa SEV en el componente.\n'); process.exit(2) }
const SEV = {}
for (const m of BLOQUE[0].matchAll(
  /(\w+):\s*\{\s*bg:\s*'([^']+)',\s*borde:\s*(?:'([^']+)'|null),\s*tono:\s*'([^']+)',\s*pulso:\s*(true|false)/g)) {
  SEV[m[1]] = { bg: m[2], borde: m[3] ?? null, tono: m[4], pulso: m[5] === 'true' }
}
if (!Object.keys(SEV).length) { console.log('\n  *** el mapa SEV se leyó vacío.\n'); process.exit(2) }

/* Un porcentaje de ejemplo DENTRO de cada tramo, para que el texto que se mira
   sea el que de verdad se publicaría y no un relleno. */
const EJEMPLO = { critica: 0, alta: 9, media: 24, baja: 55, ok: 82 }

let filas = ''
for (const t of BRECHA_CONSUMO) {
  const s = SEV[t.severidad]
  const caja = s.borde !== null
  const cT = tonoSobreFondo(s.tono, s.bg, 4.5)
  const cP = caja ? tonoSobreFondo(s.tono, s.bg, 7) : '#3D4B5C'
  const pct = EJEMPLO[t.severidad]
  const sobra = t.severidad === 'ok' ? '' : `; le sobra el ${100 - pct}%`
  filas += `      <li class="${s.pulso ? 'cp-pulso-alerta' : ''}"${caja
    ? ` style="background:${s.bg};border:1px solid ${s.borde};border-left:3px solid ${cT};border-radius:8px;padding:6px 8px"`
    : ''}>
        <p class="t" style="color:${cT}">${t.titulo}</p>
        <p class="p" style="color:${cP}">consume el ${pct}% de su bolsa${sobra}</p>
      </li>\n`
}

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
    <p class="rot">PARA ENSEÑARLE — LOS CINCO TRAMOS</p>
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
