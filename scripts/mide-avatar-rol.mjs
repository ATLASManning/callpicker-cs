/**
 * EL ICONO SOBRE EL RELLENO DEL ROL
 * =================================
 *
 *     node scripts/mide-avatar-rol.mjs
 *
 * Al llevar el degradado del hero al menú lateral (12 nov 2026), los cuatro
 * colores de rol dejaron de servir como TEXTO: sobre el extremo claro del
 * degradado miden 2.34, 3.10, 3.57 y 1.51, y el morado de Perfilamiento ya
 * fallaba antes sobre el marino plano con 3.55.
 *
 * Se mudaron al círculo del avatar, como RELLENO sólido, y el icono de encima
 * lo elige `textoSobreSolido()` contra ese relleno.
 *
 * POR QUÉ ESTO NECESITA SU PROPIO GUIÓN
 * --------------------------------------
 * `scripts/mide-paleta-sidebar.py` mide contra el DEGRADADO, y este par no se
 * mide contra el degradado sino contra el relleno del propio círculo: es la
 * única medición del menú cuyo fondo no es la barra. Y es la que se cae sola si
 * alguien edita un color en `lib/permisos.ts` sin pasar por aquí — la función
 * se recalcula, pero nadie comprueba que el resultado alcance.
 *
 * Llama a la función REAL de `lib/contraste.ts`, no a una copia: un espejo
 * tecleado a mano deja de ser espejo. [[feedback-verificar-antes-asegurar]]
 */
import jitiPkg from 'jiti'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* `import { createJiti }` NO sirve: la versión instalada es CommonJS y Node
   rechaza el export con nombre. Mismo arranque que
   `scripts/revisa-contexto-comunicaciones.mjs`. */
const crear = jitiPkg.createJiti ?? jitiPkg

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const jiti = crear(fileURLToPath(import.meta.url), { alias: { '@': RAIZ } })

const { textoSobreSolido } = await jiti.import(path.join(RAIZ, 'lib/contraste.ts'))
const { definicionRol } = await jiti.import(path.join(RAIZ, 'lib/permisos.ts'))

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

const ROLES = ['admin', 'asesor', 'viewer', 'perfilamiento']

let fallan = 0
console.log('')
console.log('  ICONO SOBRE EL RELLENO DEL ROL — con textoSobreSolido() real')
console.log('')
for (const rol of ROLES) {
  const d = definicionRol(rol)
  if (!d || !d.color) {
    console.log(`    ${rol.padEnd(16)} *** definicionRol() no devolvió color ***`)
    fallan++
    continue
  }
  const tinta = textoSobreSolido(d.color)
  const r = ratio(tinta, d.color)
  const ok = r >= 4.5
  if (!ok) fallan++
  console.log(
    `    ${String(d.label).padEnd(16)} relleno ${d.color}   icono ${tinta}   ` +
    `${r.toFixed(2)}:1   ${ok ? 'ok' : '*** NO PASA ***'}`,
  )
}

console.log('')
if (fallan) {
  console.log(`  *** ${fallan} rol(es) sin contraste suficiente en su avatar. ***`)
  console.log('  El relleno vive en `lib/permisos.ts`; la tinta la calcula')
  console.log('  `textoSobreSolido()` y no se teclea en `components/Sidebar.tsx`.')
} else {
  console.log(`  Los ${ROLES.length} avatares de rol pasan 4.5:1.`)
}
process.exit(fallan ? 1 : 0)
