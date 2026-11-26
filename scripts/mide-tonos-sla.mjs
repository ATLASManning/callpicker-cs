/**
 * LOS OCHO TONOS DEL SEMÁFORO DE VENCIMIENTO
 * ==========================================
 *
 *     node scripts/mide-tonos-sla.mjs
 *
 * Mide los tonos que `lib/sla-tonos.ts` DEVUELVE, llamando a la función real
 * vía jiti — no a una copia tecleada: un espejo escrito a mano deja de ser
 * espejo. [[feedback-verificar-antes-asegurar]]
 *
 * QUÉ COMPRUEBA, y por qué cada cosa
 * -----------------------------------
 *   1. Las ocho letras alcanzan 4.5:1 contra el tinte REAL de su pastilla, en
 *      las DOS superficies. Medir contra el fondo a pelo es el error de la 10ª
 *      ronda: el tinte al 14% se come décimas y nadie se enteró.
 *   2. Los ocho trazos alcanzan 3:1, que es el mínimo de un objeto gráfico. Ni
 *      uno más «por si acaso»: aclarar un filete lo vuelve protagonista.
 *   3. La letra de ROJO INTENSO alcanza 4.5:1 sobre su relleno SÓLIDO, que es
 *      el único de los ocho cuyo fondo no es la superficie.
 *   4. CONTROL NEGATIVO: que las SEMILLAS no pasen. Si pasaran, el cálculo
 *      sobraría — y un guión que da verde midiendo lo que ya servía no prueba
 *      que la derivación funcione. Es el control que a `revisa-letra-clara-en-
 *      claro.py` le faltó una ronda entera.
 *
 * Lo que NO prueba: el render. Eso lo cierra abrir la pantalla.
 */
import jitiPkg from 'jiti'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const crear = jitiPkg.createJiti ?? jitiPkg
const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const jiti = crear(fileURLToPath(import.meta.url), { alias: { '@': RAIZ } })

const { tonosSla, SEMILLAS_SLA, PANEL_OSCURO } =
  await jiti.import(path.join(RAIZ, 'lib/sla-tonos.ts'))
const { FONDO_PAGINA } = await jiti.import(path.join(RAIZ, 'lib/contraste.ts'))

const canal = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const aRgb = (h) => {
  let s = String(h).replace('#', '')
  if (s.length === 3) s = [...s].map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16))
}
const lum = (rgb) => 0.2126 * canal(rgb[0]) + 0.7152 * canal(rgb[1]) + 0.0722 * canal(rgb[2])
const ratio = (a, b) => {
  const [alto, bajo] = [lum(aRgb(a)), lum(aRgb(b))].sort((p, q) => q - p)
  return (alto + 0.05) / (bajo + 0.05)
}
/** El tinte compuesto, igual que lo compone el módulo. */
const compone = (hex, alfa, fondo) => {
  const h = aRgb(hex), f = aRgb(fondo)
  return '#' + [0, 1, 2]
    .map((i) => Math.round(h[i] * alfa + f[i] * (1 - alfa)).toString(16).padStart(2, '0'))
    .join('')
}

const SUPERFICIES = [
  { nombre: 'oscura (paneles de /alertas)', clave: 'oscura', fondo: PANEL_OSCURO },
  { nombre: 'clara (ficha y página)',       clave: 'clara',  fondo: FONDO_PAGINA },
]
const ALFA = 0.14

let fallan = 0
console.log('')
for (const sup of SUPERFICIES) {
  const tonos = tonosSla(sup.clave)
  console.log(`  SUPERFICIE ${sup.nombre} — fondo ${sup.fondo}`)
  console.log('  ' + '-'.repeat(72))
  for (const [nivel, t] of Object.entries(tonos)) {
    const tinte = compone(SEMILLAS_SLA[nivel], ALFA, sup.fondo)
    const rTexto = ratio(t.texto, tinte)
    const rTrazo = ratio(t.trazo, sup.fondo)
    const okTexto = rTexto >= 4.5
    const okTrazo = rTrazo >= 3
    if (!okTexto || !okTrazo) fallan++
    console.log(
      `    ${nivel.padEnd(14)} letra ${t.texto} ${rTexto.toFixed(2)}:1 ` +
      `${okTexto ? 'ok ' : '*** NO *** '}· trazo ${t.trazo} ${rTrazo.toFixed(2)}:1 ` +
      `${okTrazo ? 'ok' : '*** NO ***'} · «${t.etiqueta}»`,
    )
    if (t.relleno) {
      const rSolido = ratio(t.sobreRelleno, t.relleno)
      const ok = rSolido >= 4.5
      if (!ok) fallan++
      console.log(
        `    ${''.padEnd(14)} RELLENO SÓLIDO ${t.relleno} · letra ${t.sobreRelleno} ` +
        `${rSolido.toFixed(2)}:1 ${ok ? 'ok' : '*** NO PASA ***'}`,
      )
    }
  }
  console.log('')
}

/* ── CONTROL NEGATIVO ─────────────────────────────────────────────────────── */
console.log('  CONTROL NEGATIVO — las SEMILLAS, sin pasar por el cálculo')
console.log('  ' + '-'.repeat(72))
let semillasQuePasan = 0
for (const [nivel, hex] of Object.entries(SEMILLAS_SLA)) {
  const sobreClaro = ratio(hex, compone(hex, ALFA, FONDO_PAGINA))
  const sobreOscuro = ratio(hex, compone(hex, ALFA, PANEL_OSCURO))
  const pasaLas2 = sobreClaro >= 4.5 && sobreOscuro >= 4.5
  if (pasaLas2) semillasQuePasan++
  console.log(
    `    ${nivel.padEnd(14)} ${hex}   clara ${sobreClaro.toFixed(2)}:1 · ` +
    `oscura ${sobreOscuro.toFixed(2)}:1${pasaLas2 ? '   <-- pasa sin calcular' : ''}`,
  )
}
console.log('')
if (semillasQuePasan === Object.keys(SEMILLAS_SLA).length) {
  console.log('  *** Las semillas pasan TODAS por sí solas en las dos superficies.')
  console.log('      Entonces el cálculo no está haciendo nada y este guión da')
  console.log('      verde por la razón equivocada. Revisar lib/sla-tonos.ts. ***')
  fallan++
}

/* ── LOS TONOS DEL CORREO ─────────────────────────────────────────────────
 *
 * Un cliente de correo es SIEMPRE fondo claro, así que el aviso diario no puede
 * usar los tonos de la pantalla oscura: el rojo del tablero mide menos de 3:1
 * sobre blanco —se mide abajo, como control negativo—.
 *
 * SE MIDE EL HTML RENDERIZADO, NO LAS CONSTANTES DEL ARCHIVO. Aquí había una
 * expresión regular leyendo `const NOMBRE = '#hex'` del archivo, y esa lectura
 * tenía exactamente el agujero que ya costó una ronda con `TT_STYLE`: los tonos
 * tecleados DENTRO de la plantilla no son constantes, así que no los veía.
 * `#D7E7F2` sobre la cabecera azul es uno de ellos y nadie lo había medido.
 *
 * Esto se puede hacer porque `lib/alertas-sla-correo.ts` no importa `resend` ni
 * `lib/supabase.ts` —ése último construye un `RealtimeClient` al cargarse que
 * bajo Node 20 revienta por falta de WebSocket nativo—. Por eso el cuerpo del
 * correo se separó del que lo manda: para poder llamarlo aquí.
 *
 * CÓMO SE DECIDE EL FONDO DE CADA LETRA
 *   · Si el mismo `style` declara `background` y `color`, se miden entre sí.
 *     Ése es el botón: azul con letra blanca encima.
 *   · Si no, contra el fondo de la sección: la cabecera azul oscuro hasta el
 *     `<div>` de la tarjeta, y blanco a partir de ahí.
 * Lo que NO se mide: los filetes de 1px de la tabla (`border`), que son
 * separadores decorativos y no objetos que haya que distinguir.
 */
const { cuerpoDeAviso } = await jiti.import(path.join(RAIZ, 'lib/alertas-sla-correo.ts'))
const { semaforoDe } = await jiti.import(path.join(RAIZ, 'lib/alertas-sla.ts'))

const BLANCO_CORREO = '#ffffff'
const SIN_INHABILES = new Set()
/* Un renglón por cada nivel que el correo puede pintar, para que la plantilla
   recorra TODAS sus ramas de color: la que elige ROJO y la que elige ÁMBAR. */
const CASOS = [
  { estado: 'abierta', severidad: 'critica', fechaLimite: '2026-11-20' }, // vencida hace días
  { estado: 'abierta', severidad: 'alta',    fechaLimite: '2026-11-25' }, // vencida ayer
  { estado: 'abierta', severidad: 'alta',    fechaLimite: '2026-11-26' }, // vence hoy
  { estado: 'abierta', severidad: 'media',   fechaLimite: '2026-11-27' }, // por vencer
  { estado: 'abierta', severidad: 'media',   fechaLimite: '2026-12-10' }, // en tiempo
]
const HOY = '2026-11-26'
const LINEAS = CASOS.map((c, i) => ({
  empresa: `Cuenta de prueba ${i + 1} & Cía`,
  consecutivo: `D${i + 1}`,
  condicion: 'consumo',
  semaforo: semaforoDe(c, HOY, SIN_INHABILES),
  severidad: c.severidad,
  accion_sugerida: 'Llamar al contacto de facturación y confirmar el plan vigente.',
  mrr: 12345 * (i + 1),
  cuenta_id: `prueba-${i + 1}`,
}))

/** Extrae los pares (letra, fondo) de un HTML de correo, con la regla de arriba. */
function paresDelCorreo(html) {
  const CORTE = html.indexOf('background:#FFFFFF')
  const pares = []
  for (const m of html.matchAll(/style="([^"]*)"/g) ) {
    const estilo = m[1]
    const letra = estilo.match(/(?:^|[;\s])color:\s*(#[0-9A-Fa-f]{3,6})/)
    if (!letra) continue
    const propio = estilo.match(/background(?:-color)?:\s*(#[0-9A-Fa-f]{3,6})/)
    const seccion = CORTE >= 0 && m.index < CORTE ? '#0B2D4D' : BLANCO_CORREO
    pares.push({
      letra: letra[1],
      fondo: propio ? propio[1] : seccion,
      donde: propio ? 'su propio relleno'
                    : (seccion === BLANCO_CORREO ? 'la tarjeta blanca' : 'la cabecera'),
    })
  }
  return pares
}

console.log('')
console.log('  EL AVISO POR CORREO — medido sobre el HTML que la función DEVUELVE')
console.log('  ' + '-'.repeat(70))

const VARIANTES = [
  ['asesor',    cuerpoDeAviso('Erick', LINEAS, HOY, false)],
  ['dirección', cuerpoDeAviso('dirección', LINEAS, HOY, true)],
]
let paresMedidos = 0
const vistos = new Set()
for (const [quien, html] of VARIANTES) {
  const pares = paresDelCorreo(html)
  if (!pares.length) {
    console.log(`    *** no se encontró ni un par de color en el correo de ${quien}:`)
    console.log('        el espejo está roto, así que esta sección no prueba nada ***')
    fallan++
    continue
  }
  for (const p of pares) {
    const clave = `${p.letra.toLowerCase()}|${p.fondo.toLowerCase()}`
    if (vistos.has(clave)) continue
    vistos.add(clave)
    paresMedidos++
    const r = ratio(p.letra, p.fondo)
    const ok = r >= 4.5
    if (!ok) fallan++
    console.log(
      `    letra ${p.letra.toUpperCase().padEnd(8)} sobre ${p.fondo.toUpperCase().padEnd(8)} ` +
      `(${p.donde.padEnd(18)}) ${r.toFixed(2)}:1  ${ok ? 'ok' : '*** NO PASA ***'}`,
    )
  }
}
console.log(`    ${paresMedidos} pares distintos, de ${VARIANTES.length} variantes del correo.`)

/* CONTROL NEGATIVO DEL CORREO — que el tono del TABLERO OSCURO no pase sobre
   blanco. Si pasara, el correo no necesitaría paleta propia y esta sección
   estaría dando verde por una razón que no es la suya. */
const tonoOscuro = tonosSla('oscura').rojo.texto
const rControl = ratio(tonoOscuro, BLANCO_CORREO)
console.log(
  `    CONTROL NEGATIVO: el rojo del tablero oscuro (${tonoOscuro}) sobre blanco ` +
  `mide ${rControl.toFixed(2)}:1`,
)
if (rControl >= 4.5) {
  console.log('    *** y PASA, así que la paleta aparte del correo no se justifica')
  console.log('        y esta sección no está probando lo que dice probar. ***')
  fallan++
}

console.log('')
if (fallan) {
  console.log(`  *** ${fallan} medición(es) por debajo del mínimo. ***`)
  console.log('  Los tonos se derivan en `lib/sla-tonos.ts` con las funciones de')
  console.log('  `lib/contraste.ts`. No se teclea un hex para taparlo:')
  console.log('  [[atlas-dashboard-contrast-architecture]].')
} else {
  console.log('  Los 8 niveles pasan en las dos superficies, y las semillas no.')
}
process.exit(fallan ? 1 : 0)
