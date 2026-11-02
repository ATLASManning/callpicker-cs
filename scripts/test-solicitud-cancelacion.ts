/**
 * El amarre de la solicitud de cancelación se guarda DENTRO de `descripcion`,
 * así que lo que escribe `componerSolicitud` y lo que lee `leerSolicitud`
 * tienen que ser la misma cosa. Si divergen, la ficha publica «no se declaró»
 * sobre un dato que sí está —o peor, da por enviado un formato que no lo está.
 *
 * Se prueba AL REVÉS además del caso bueno: sin etiquetas, con el formato
 * pendiente, y con una descripción vieja de antes de esta regla.
 *
 *     npx ts-node --project tsconfig.import.json scripts/test-solicitud-cancelacion.ts
 */
import {
  componerSolicitud, leerSolicitud, identificadorDeCuenta,
  FORMATO_SOLICITUD_CANCELACION, etiquetaAccionRetencion,
  TIPOS_SEGUIMIENTO, resultadosDe, etiquetaTipoSeguimiento, etiquetaResultado,
  SOLICITUD_CANCELACION, resumenDeSeguimiento, lineaSeguimientosKAM,
} from '../lib/seguimiento-tipos'

let fallos = 0
function check(ok: boolean, que: string, detalle = '') {
  console.log(`  ${ok ? 'ok   ' : 'FALLA'}  ${que}${ok ? '' : '   — ' + detalle}`)
  if (!ok) fallos++
}

// ── 1 · Ida y vuelta del caso bueno ─────────────────────────────────────────
const ident = identificadorDeCuenta({ consecutivo: 'D1', cid: '130723', empresa: 'GRUPO TORRES CORZO' })
check(ident === 'D1 · CID 130723 · GRUPO TORRES CORZO', 'el identificador se arma con las tres piezas', ident)

const texto = componerSolicitud({
  accion: 'ajuste_plan',
  identificador: ident,
  detalle: 'El cliente pidió bajar de plan por recorte de presupuesto.\nSegunda línea.',
  enviado: true,
})
const leido = leerSolicitud(texto)
check(leido.enviado === true, 'el formato se lee como enviado', String(leido.enviado))
check(leido.url === FORMATO_SOLICITUD_CANCELACION, 'la URL del formato sobrevive', String(leido.url))
check(leido.cuenta === ident, 'la cuenta ligada sobrevive', String(leido.cuenta))
check(leido.accion === etiquetaAccionRetencion('ajuste_plan'),
      'la acción de retención sobrevive', String(leido.accion))
check(leido.detalle.includes('recorte de presupuesto') && leido.detalle.includes('Segunda línea'),
      'el detalle libre sobrevive entero, con sus dos líneas', JSON.stringify(leido.detalle))
check(!leido.detalle.includes(FORMATO_SOLICITUD_CANCELACION),
      'el detalle NO se queda con las líneas de etiquetas')

// ── 2 · Formato declarado como PENDIENTE ────────────────────────────────────
const pend = leerSolicitud(componerSolicitud({
  accion: 'sin_gestion', identificador: ident, detalle: '', enviado: false,
}))
check(pend.enviado === false, 'un formato pendiente NO se lee como enviado', String(pend.enviado))
check(pend.detalle === '', 'sin detalle libre, el detalle queda vacío', JSON.stringify(pend.detalle))

// ── 3 · AL REVÉS: una descripción que no trae nada de esto ──────────────────
// Es el caso real de los 480 seguimientos que ya existen. Lo que no está se
// devuelve `null` para que la ficha diga «no se declaró» en vez de inventarlo.
const viejo = leerSolicitud('Llamé al cliente y quedamos de vernos el martes.')
check(viejo.enviado === null, 'sin etiqueta de formato, `enviado` es null, no false', String(viejo.enviado))
check(viejo.url === null, 'sin URL, `url` es null', String(viejo.url))
check(viejo.cuenta === null, 'sin cuenta ligada, `cuenta` es null', String(viejo.cuenta))
check(viejo.accion === null, 'sin acción, `accion` es null', String(viejo.accion))
check(viejo.detalle === 'Llamé al cliente y quedamos de vernos el martes.',
      'el texto viejo se devuelve entero como detalle', JSON.stringify(viejo.detalle))

const vacio = leerSolicitud(null)
check(vacio.enviado === null && vacio.detalle === '', 'una descripción nula no revienta')

// ── 4 · El catálogo del combo ───────────────────────────────────────────────
check(TIPOS_SEGUIMIENTO.some(t => t.value === SOLICITUD_CANCELACION),
      'el combo ofrece la solicitud de cancelación')
check(TIPOS_SEGUIMIENTO.every(t => t.label.trim() !== '' && !t.label.includes('_')),
      'ningún tipo se muestra con guion bajo',
      TIPOS_SEGUIMIENTO.filter(t => t.label.includes('_')).map(t => t.value).join(', '))
check(new Set(TIPOS_SEGUIMIENTO.map(t => t.value)).size === TIPOS_SEGUIMIENTO.length,
      'no hay tipos repetidos en el combo')

const rCancel = resultadosDe(SOLICITUD_CANCELACION)
const rNormal = resultadosDe('llamada')
check(!rCancel.includes('exitoso'),
      'los resultados de la solicitud NO incluyen «exitoso»', rCancel.join(', '))
check(rCancel.includes('retenida') && rCancel.includes('downgrade_negociado')
      && rCancel.includes('cancelacion_confirmada'),
      'sí incluyen retenida, downgrade negociado y cancelación confirmada', rCancel.join(', '))
check(rNormal.includes('exitoso'), 'los demás tipos conservan sus seis de siempre')
check(rCancel.includes('pendiente') && rNormal.includes('pendiente'),
      '«pendiente» está en los dos: es el valor con el que nace cualquier registro')

// Las etiquetas acentuadas: `capitalize` sobre el valor crudo daba «En Negociacion».
check(etiquetaResultado('en_negociacion') === 'En negociación',
      'en_negociacion se muestra acentuado y en minúscula la segunda palabra',
      etiquetaResultado('en_negociacion'))
check(etiquetaResultado('cancelacion_confirmada') === 'Cancelación confirmada',
      'cancelacion_confirmada igual', etiquetaResultado('cancelacion_confirmada'))
check(etiquetaTipoSeguimiento(SOLICITUD_CANCELACION) === 'Solicitud de cancelación',
      'el tipo se muestra con su nombre completo', etiquetaTipoSeguimiento(SOLICITUD_CANCELACION))
check(etiquetaTipoSeguimiento('un_tipo_viejo') === 'Un tipo viejo',
      'un tipo desconocido se muestra legible en vez de esconderse',
      etiquetaTipoSeguimiento('un_tipo_viejo'))
check(etiquetaResultado('escrito a mano por alguien') === 'escrito a mano por alguien',
      'un resultado escrito a mano se muestra tal cual')

// ── 5 · El resumen de una línea ─────────────────────────────────────────────
// Es la función que arregla el renglón que producción publicaba el 2 nov 2026:
// «Nota interna (solicitud_cancelacion): Formato de solicitud de cancelación:
// env…» — cuarenta caracteres de fontanería. La prueba de fondo es que NINGÚN
// resumen empiece por una etiqueta del amarre, con el recorte que sea.
const r40 = resumenDeSeguimiento(SOLICITUD_CANCELACION, texto, 40)
const r160 = resumenDeSeguimiento(SOLICITUD_CANCELACION, texto, 160)
check(r40 === etiquetaAccionRetencion('ajuste_plan'),
      'a 40 letras el resumen es la acción sola: no cabe nada más', r40)
check(r160.startsWith(etiquetaAccionRetencion('ajuste_plan')) && r160.includes('presupuesto'),
      'a 160 sí entra el detalle que escribió el asesor', r160)
for (const n of [10, 20, 40, 70, 160, 500]) {
  const r = resumenDeSeguimiento(SOLICITUD_CANCELACION, texto, n)
  check(!r.startsWith('Formato') && !r.includes('docs.google.com'),
        `con max=${n} el resumen no empieza por fontanería ni trae la URL`, r)
}
check(resumenDeSeguimiento(SOLICITUD_CANCELACION,
        componerSolicitud({ accion: '', identificador: ident, detalle: '', enviado: false }), 70)
      .length > 0,
      'una solicitud sin acción declarada igual dice algo')
check(resumenDeSeguimiento('llamada', 'Hablé con el cliente.', 70) === 'Hablé con el cliente.',
      'un seguimiento normal corto se devuelve entero, sin puntos suspensivos',
      resumenDeSeguimiento('llamada', 'Hablé con el cliente.', 70))
check(resumenDeSeguimiento('llamada', 'x'.repeat(100), 70) === 'x'.repeat(70) + '…',
      'y uno largo se corta exactamente en `max` y lo señala')
check(resumenDeSeguimiento('nota', null, 70) === '' && resumenDeSeguimiento(null, null) === '',
      'sin texto, el resumen es vacío: no se inventa un guion')

// ── 6 · Lo que lee el MODELO ────────────────────────────────────────────────
// Esta es la línea del dossier de Atlas. Se prueba aquí y no armando el
// dossier entero porque eso exige base de datos y archivos — y una línea que
// un modelo lee no puede quedarse sin comprobar por culpa del andamio.
const FILAS = [
  { fecha: '2026-11-02', tipo: SOLICITUD_CANCELACION, resultado: 'en_negociacion',
    descripcion: texto },
  { fecha: '2026-09-14', tipo: 'email', resultado: 'exitoso',
    descripcion: 'Mandé la cotización de $96,250 + IVA.' },
]
const linea2 = lineaSeguimientosKAM(FILAS, 5)
check(linea2.startsWith('(1/2) '), 'los seguimientos van numerados i/N', linea2.slice(0, 20))
check(linea2.includes('(2/2) '), 'y el segundo también')
check(linea2.includes('Solicitud de cancelación'),
      'el tipo se le da al modelo por su nombre, no como `solicitud_cancelacion`')
check(!linea2.includes('solicitud_cancelacion'),
      'AL REVÉS: el valor crudo NO llega al modelo', linea2)
check(!linea2.includes('docs.google.'),
      'AL REVÉS: la URL del formato NO llega como si fuera el texto', linea2)
check(linea2.includes(etiquetaAccionRetencion('ajuste_plan')),
      'lo que SÍ llega es qué se hizo para evitar la baja')
check(linea2.includes('recorte de presupuesto'),
      'y el motivo que dio el cliente')
check(linea2.endsWith('son todos los que tiene.'),
      'con menos filas que el tope, se dice que es la bitácora entera', linea2.slice(-40))

// Con el tope justo, NO se puede afirmar el total — y la línea lo dice.
const CINCO = Array.from({ length: 5 }, (_, i) => ({
  fecha: `2026-10-0${i + 1}`, tipo: 'llamada', resultado: 'exitoso',
  descripcion: `llamada ${i + 1}`,
}))
const linea5 = lineaSeguimientosKAM(CINCO, 5)
check(/NO afirmes cuántos seguimientos/.test(linea5),
      'con el tope lleno, se le prohíbe al modelo afirmar el total', linea5.slice(-60))
check(!linea5.includes('son todos los que tiene'),
      'AL REVÉS: con el tope lleno NO se dice que sean todos')
check(lineaSeguimientosKAM([], 5) === 'NINGUNO registrado',
      'sin seguimientos se dice NINGUNO, que no es lo mismo que no haber mirado')
check(lineaSeguimientosKAM([{ fecha: '2026-10-01', tipo: 'nota', descripcion: null }], 5)
        .includes('sin texto capturado'),
      'un seguimiento sin texto se marca con palabras, no se deja en blanco')

// CONTROL NEGATIVO: el formato de ANTES del 2 nov 2026 tiene que fallar estas
// mismas comprobaciones. Si pasara, no estarían probando nada.
const VIEJO = `[2026-11-02] ${SOLICITUD_CANCELACION}: ${texto.replace(/\s+/g, ' ').slice(0, 70)}`
check(VIEJO.includes('solicitud_cancelacion') && VIEJO.includes('docs.google.')
      && !/\(1\//.test(VIEJO) && !/son todos los que tiene/.test(VIEJO),
      'CONTROL: el formato viejo falla las cuatro comprobaciones de arriba', VIEJO)

console.log('')
if (fallos > 0) {
  console.log(`  *** ${fallos} comprobación(es) fallan.`)
  process.exit(1)
}
console.log('  el amarre se escribe y se lee igual, y el catálogo cierra.')
