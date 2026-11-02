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
  SOLICITUD_CANCELACION,
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

console.log('')
if (fallos > 0) {
  console.log(`  *** ${fallos} comprobación(es) fallan.`)
  process.exit(1)
}
console.log('  el amarre se escribe y se lee igual, y el catálogo cierra.')
