/**
 * Pruebas del candado de cierre de actividades.
 *
 *   npm run test:cierre
 *
 * Los casos son las respuestas reales que dirección quiere eliminar
 * ("no contesta", "ya no es la persona", "se dio de baja") y las respuestas de
 * trabajo genuino que NO deben estorbarse.
 */
import assert from 'node:assert/strict'
import { evaluarCierre } from '../lib/actividades/cierre'

let ok = 0, fallos = 0
function test(nombre: string, fn: () => void) {
  try { fn(); ok++; console.log(`  ✓ ${nombre}`) }
  catch (e) { fallos++; console.error(`  ✗ ${nombre}\n      ${e instanceof Error ? e.message : e}`) }
}
const codigo = (t: string, extra = {}) => evaluarCierre({ resultado: t, ...extra }).codigo

console.log('\nRESPUESTAS QUE YA NO CIERRAN')

test('vacío no cierra', () => {
  assert.equal(codigo(''), 'vacio')
  assert.equal(evaluarCierre({ resultado: null }).permitido, false)
})

test('frases genéricas no cierran', () => {
  for (const t of ['Se dio seguimiento', 'Sin novedades', 'todo bien', 'ok', 'Cliente informado', 'Pendiente']) {
    assert.equal(evaluarCierre({ resultado: t }).permitido, false, `debió rechazar: ${t}`)
  }
})

test('declarar una baja abre expediente, no cierra — aunque sea de tres palabras', () => {
  const v = evaluarCierre({ resultado: 'La cuenta se dio de baja' })
  assert.equal(v.codigo, 'declaracion_baja')
  assert.ok(v.preguntas.some(p => /primera señal/i.test(p)), 'debe preguntar por la primera señal')
  assert.ok(v.exige.some(e => /preventivas/i.test(e)), 'debe exigir las acciones preventivas')
})

test('declarar un downgrade también abre expediente', () => {
  assert.equal(codigo('El cliente pidió bajar de plan'), 'declaracion_downgrade')
  assert.equal(codigo('Van a quitar extensiones'), 'declaracion_downgrade')
})

test('"no contesta" abre secuencia de contacto, no cierra', () => {
  const v = evaluarCierre({ resultado: 'No contesta' })
  assert.equal(v.codigo, 'sin_contacto')
  assert.ok(v.preguntas.some(p => /otro contacto|canal/i.test(p)))
})

test('"ya no es la persona" exige el diagnóstico del cambio de decisor', () => {
  const v = evaluarCierre({ resultado: 'Ya no está esa persona en la empresa' })
  assert.equal(v.codigo, 'sin_analisis')
  assert.ok(v.preguntas.some(p => /nueva persona|cargo/i.test(p)))
})

test('un relato corto sin análisis no cierra', () => {
  assert.equal(evaluarCierre({ resultado: 'Le marqué al cliente hoy por la mañana' }).permitido, false)
})

console.log('\nTRABAJO REAL QUE SÍ DEBE CERRAR')

test('gestión con persona, hallazgo y siguiente paso cierra', () => {
  const v = evaluarCierre({ resultado:
    'Hablé con el Ing. Ramírez, gerente de sistemas. Comentó que bajaron las llamadas ' +
    'porque cerraron la sucursal de León. Quedamos en revisar extensiones el viernes.' })
  assert.equal(v.permitido, true, v.mensaje)
})

test('reunión documentada con fecha y acuerdo cierra', () => {
  const v = evaluarCierre({ resultado:
    'Reunión con la directora administrativa el 3 de septiembre. Detectó que no usan ' +
    'grabaciones porque nadie los capacitó. Agendé capacitación para la próxima semana.' })
  assert.equal(v.permitido, true, v.mensaje)
})

test('mencionar una cancelación CON expediente sustentado sí cierra', () => {
  const v = evaluarCierre({
    resultado: 'El cliente canceló por cierre de la sucursal norte, confirmado con el director el 28 de agosto.',
    expedienteAdjunto: true,
  })
  assert.equal(v.permitido, true, v.mensaje)
})

test('"no contesta" CON secuencia registrada sí cierra', () => {
  const v = evaluarCierre({
    resultado: 'No contesta desde hace dos semanas; intenté por correo, WhatsApp y teléfono a dos contactos distintos.',
    secuenciaRegistrada: true,
  })
  assert.equal(v.permitido, true, v.mensaje)
})

console.log('\nGARANTÍAS DEL DISEÑO')

test('el veredicto SIEMPRE dice qué falta y qué preguntar', () => {
  for (const t of ['', 'ok', 'No contesta', 'se dio de baja', 'Ya no es la persona', 'Le marqué hoy']) {
    const v = evaluarCierre({ resultado: t })
    if (v.permitido) continue
    assert.ok(v.mensaje.length > 20, `sin mensaje útil para: ${t}`)
    assert.ok(v.exige.length > 0 && v.preguntas.length > 0, `sin guía para: ${t}`)
  }
})

test('el candado no toca el estado de la cuenta: solo evalúa texto', () => {
  const src = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'lib', 'actividades', 'cierre.ts'), 'utf8')
  assert.ok(!/supabase|from\('cuentas'\)|update\(/.test(src),
    'cierre.ts debe ser lógica pura, sin acceso a base de datos')
})

console.log(`\n${ok} pruebas OK · ${fallos} fallidas`)
if (fallos > 0) process.exit(1)
