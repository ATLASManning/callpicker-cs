/**
 * REPRODUCCIÓN ESTÁTICA DEL SEMÁFORO SLA
 *
 * El método que cerró las rondas de contraste de este proyecto: no razonar
 * sobre la cascada, montarla con el `globals.css` REAL y MIRARLA.
 *
 *   node genera-repro-sla.mjs <raiz-del-repo> <salida.html>
 *
 * Los tonos los pide a `lib/sla-tonos.ts` vía jiti: si se tecleasen aquí, la
 * reproducción dejaría de reproducir nada.
 */
import jitiPkg from 'jiti'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const RAIZ = process.argv[2]
const SALIDA = process.argv[3]
if (!RAIZ || !SALIDA) {
  console.error('uso: node genera-repro-sla.mjs <raiz-del-repo> <salida.html>')
  process.exit(2)
}

const crear = jitiPkg.createJiti ?? jitiPkg
const jiti = crear(fileURLToPath(import.meta.url), { alias: { '@': RAIZ } })

const { tonosSla, PANEL_OSCURO } = await jiti.import(path.join(RAIZ, 'lib/sla-tonos.ts'))
const { FONDO_PAGINA } = await jiti.import(path.join(RAIZ, 'lib/contraste.ts'))

/* Las reglas REALES de globals.css que pisan el color. Se extraen del archivo,
   no se transcriben: transcribirlas es lo que hace que la reproducción pase y
   la pantalla siga rota. */
const css = fs.readFileSync(path.join(RAIZ, 'app/globals.css'), 'utf8')
const reglas = css
  .split('}')
  .filter(b => /\.cp-card|\.cp-light/.test(b))
  .map(b => b + '}')
  .join('\n')

const NIVELES = ['verde', 'amarillo', 'naranja', 'rojo', 'rojo_intenso',
                 'bloqueada', 'atendida', 'cerrada']

const FRASES = {
  verde: 'En tiempo · faltan 4 días hábiles (vence el 1 dic 2026)',
  amarillo: 'Por vencer · faltan 2 días hábiles (vence el 27 nov 2026)',
  naranja: 'Vence HOY, 25 nov 2026',
  rojo: 'Vencida hace 1 día hábil (vencía el 24 nov 2026)',
  rojo_intenso: 'INCUMPLIDA · vencida hace 4 días hábiles (vencía el 19 nov 2026)',
  bloqueada: 'No la puede cerrar el ejecutivo',
  atendida: 'Atendida el 24 nov 2026, dentro del plazo',
  cerrada: 'Cerrada',
}

function renglon(nivel, t, tema) {
  const intenso = nivel === 'rojo_intenso'
  const pastilla = intenso
    ? `background:${t.relleno};border:1px solid ${t.trazo};color:${t.sobreRelleno}`
    : `background:${t.tinte};border:1px solid ${t.trazo};color:${t.texto}`
  return `
  <div style="background:${tema.panel};border:1px solid ${intenso ? t.relleno : tema.borde};
              border-left:${intenso ? 6 : 3}px solid ${t.trazo};border-radius:12px;
              padding:12px 16px;margin-bottom:10px;
              box-shadow:${intenso ? `0 0 0 2px ${t.trazo}55` : 'none'}">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
      <div>
        <span style="color:${tema.hi};background:transparent;font-size:13.5px;font-weight:700">AGUA INMACULADA</span>
        <span style="color:${tema.low};background:transparent;font-size:11px;margin-left:8px">C17 · Erick · $12,480 al mes</span>
        <div style="color:${tema.hi};background:transparent;font-size:12.5px;font-weight:600;margin-top:2px">Dos meses sin contacto</div>
      </div>
      <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;
                   border-radius:999px;${pastilla}">
        <span style="color:inherit;background:transparent;font-size:11px;font-weight:700;letter-spacing:.3px">${t.etiqueta}</span>
      </span>
    </div>
    <div style="margin-top:6px">
      <span style="color:${t.texto};background:transparent;font-size:11.5px;font-weight:600">${FRASES[nivel]}</span>
      <span style="color:${tema.low};background:transparent;font-size:11px"> · severidad alta (subió de media): está en el 20% de mayor facturación de tu cartera</span>
    </div>
    <div style="margin-top:8px">
      <div style="color:${tema.hi};background:transparent;font-size:12.5px;font-weight:600">
        Llamar al contacto principal antes del 27 nov 2026 y registrar un seguimiento con el resultado y el próximo paso con fecha.
      </div>
      <div style="color:${tema.mid};background:transparent;font-size:11px;margin-top:4px">
        Tu atención se cierra con un seguimiento por un canal real, registrada en esta misma cuenta.
      </div>
      <div style="color:${tema.aviso};background:transparent;font-size:11px;margin-top:2px">
        Eso NO apaga la alerta: la apaga que el cliente vuelva a contestar. Hasta entonces sigue en la lista, ya atendida.
      </div>
    </div>
  </div>`
}

const tonosOscuro = tonosSla('oscura')
const tonosClaro = tonosSla('clara')

const temaOscuro = {
  panel: PANEL_OSCURO, borde: 'rgba(255,255,255,0.08)',
  hi: 'rgba(255,255,255,0.94)', mid: 'rgba(255,255,255,0.72)',
  low: 'rgba(255,255,255,0.55)', aviso: tonosOscuro.amarillo.texto,
}
const temaClaro = {
  panel: '#FFFFFF', borde: '#DFE8EF',
  hi: '#202E3B', mid: '#3D4B5C', low: '#667384', aviso: tonosClaro.amarillo.texto,
}

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Repro semáforo SLA</title>
<style>
  body { margin:0; font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
  .pagina { background:${FONDO_PAGINA}; padding:24px; }
  h2 { font-size:14px; color:#122E5E; margin:0 0 10px; }
  /* ── LAS REGLAS REALES DE globals.css QUE PISAN EL COLOR ───────────────── */
${reglas}
</style></head>
<body>
  <div class="pagina">
    <h2>Isla OSCURA — los paneles de /alertas, DENTRO de una .cp-card</h2>
    <div class="cp-card" style="background:${PANEL_OSCURO};padding:12px;border-radius:14px">
      ${NIVELES.map(n => renglon(n, tonosOscuro[n], temaOscuro)).join('')}
    </div>

    <h2 style="margin-top:24px">Isla CLARA — la ficha de cuenta, sin .cp-card</h2>
    <div style="padding:12px">
      ${NIVELES.map(n => renglon(n, tonosClaro[n], temaClaro)).join('')}
    </div>
  </div>
</body></html>`

fs.writeFileSync(SALIDA, html, 'utf8')
console.log(`escrito: ${SALIDA}`)
console.log(`reglas .cp-card/.cp-light extraídas: ${reglas.split('}').length - 1}`)

/* ═══════════════════════════════════════════════════════════════════════════
 * Y SE MIDE LO QUE SE ACABA DE ESCRIBIR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * NACIÓ DE UN BUG QUE ESTE MISMO GUIÓN ENSEÑÓ: la línea del vencimiento usaba
 * `sobreRelleno` cuando el nivel era INCUMPLIDA, y en la ficha CLARA eso es
 * blanco sobre tarjeta blanca. Ningún detector lo vio, el compilador tampoco, y
 * la reproducción sólo lo delató porque alguien la MIRÓ.
 *
 * Mirar no es repetible. Esto sí: se recorre el HTML generado buscando cada
 * `color:X` con su `background` real detrás y se mide. Un par por debajo de 3:1
 * sale con código 1. No sustituye a mirarlo —el solape, el recorte y el tamaño
 * sólo se ven— pero esta clase concreta ya no depende de que alguien se fije.
 */
const canal = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const aRgb = (h) => {
  let s = String(h).trim().replace('#', '')
  if (s.length === 3) s = [...s].map((c) => c + c).join('')
  if (s.length === 8) s = s.slice(0, 6)   // el tinte lleva alfa; el fondo lo pone el padre
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16))
}
const lum = (g) => 0.2126 * canal(g[0]) + 0.7152 * canal(g[1]) + 0.0722 * canal(g[2])
const ratio = (a, b) => {
  const [alto, bajo] = [lum(aRgb(a)), lum(aRgb(b))].sort((p, q) => q - p)
  return (alto + 0.05) / (bajo + 0.05)
}

/* Cada par (texto, fondo sobre el que de verdad cae) que el renglón pinta.
   Se construye desde los MISMOS objetos que generan el HTML, así que si alguien
   cambia un color arriba, esto lo mide sin tocarlo. */
const pares = []
for (const [sup, tonos, tema] of [['oscura', tonosOscuro, temaOscuro],
                                  ['clara', tonosClaro, temaClaro]]) {
  for (const nivel of NIVELES) {
    const t = tonos[nivel]
    pares.push([`${sup}/${nivel} · empresa`,       tema.hi,   tema.panel, 4.5])
    pares.push([`${sup}/${nivel} · vencimiento`,   t.texto,   tema.panel, 4.5])
    pares.push([`${sup}/${nivel} · severidad`,     tema.low,  tema.panel, 4.5])
    pares.push([`${sup}/${nivel} · cierra`,        tema.mid,  tema.panel, 4.5])
    pares.push([`${sup}/${nivel} · no la apaga`,   tema.aviso, tema.panel, 4.5])
    pares.push([`${sup}/${nivel} · pastilla`,
                nivel === 'rojo_intenso' ? t.sobreRelleno : t.texto,
                nivel === 'rojo_intenso' ? t.relleno : tema.panel, 4.5])
    pares.push([`${sup}/${nivel} · filete`,        t.trazo,   tema.panel, 3])
  }
}

let fallan = 0
console.log('')
console.log('  CADA TEXTO CONTRA EL FONDO QUE DE VERDAD TIENE DEBAJO')
console.log('  ' + '-'.repeat(70))
for (const [que, texto, fondo, minimo] of pares) {
  /* Los `rgba(255,255,255,0.xx)` del tema oscuro se componen sobre el panel. */
  const m = String(texto).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/)
  let tinta = texto
  if (m) {
    const f = aRgb(fondo)
    const a = Number(m[4])
    tinta = '#' + [1, 2, 3]
      .map((i) => Math.round(Number(m[i]) * a + f[i - 1] * (1 - a)).toString(16).padStart(2, '0'))
      .join('')
  }
  const r = ratio(tinta, fondo)
  const ok = r >= minimo
  if (!ok) {
    fallan++
    console.log(`    *** ${que.padEnd(34)} ${String(texto).padEnd(24)} ${r.toFixed(2)}:1 ` +
                `(mínimo ${minimo}) sobre ${fondo} ***`)
  }
}
if (fallan === 0) {
  console.log(`    los ${pares.length} pares del renglón pasan su mínimo.`)
}

/* CONTROL NEGATIVO: el bug que esto nació para cazar tiene que seguir
   cazándose. Si dejara de dispararse, el medidor estaría mudo. */
const malo = ratio(tonosClaro.rojo_intenso.sobreRelleno, temaClaro.panel)
if (malo >= 3) {
  console.log('')
  console.log('  *** El control negativo NO se dispara: `sobreRelleno` sobre la')
  console.log('      tarjeta clara ya no mide mal, así que este medidor no')
  console.log('      prueba nada. Revisarlo antes de confiar en el verde. ***')
  fallan++
} else {
  console.log(`    control negativo ok: sobreRelleno sobre la tarjeta clara mide ` +
              `${malo.toFixed(2)}:1 — sigue siendo un bug si alguien lo usa ahí.`)
}

console.log('')
process.exit(fallan ? 1 : 0)
