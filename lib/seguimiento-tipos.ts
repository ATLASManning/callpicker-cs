/**
 * Catálogo del combo de «Seguimiento KAM»: qué tipos existen, cómo se llaman en
 * pantalla, y qué resultados admite cada uno.
 *
 * ── POR QUÉ UN ARCHIVO Y NO LAS LISTAS SUELTAS ─────────────────────────────
 * Hasta el 2 nov 2026 los tipos vivían escritos a mano en `SeguimientoForm` y
 * los resultados DOS veces: ahí y en `SeguimientoStatusSelect`. Dos copias de
 * la misma lista divergen sin que nadie se dé cuenta — el formulario ofrecía
 * seis resultados y la pastilla de la ficha ofrecía los mismos seis por
 * casualidad, no por construcción. Aquí viven una vez y los importan los dos.
 *
 * ── LA SOLICITUD DE CANCELACIÓN NO ES UN CANAL ─────────────────────────────
 * Los otros ocho tipos dicen POR DÓNDE se habló (llamada, whatsapp, email…) o
 * qué se hizo (demo, nota). `solicitud_cancelacion` dice QUÉ PASÓ: el cliente
 * pidió irse o bajar de plan. Por eso NO entra en `CANALES_CONTACTO` de
 * `lib/contacto-cuenta.ts` —registrarla no es haber contactado al cliente— y
 * por eso arrastra dos cosas que los demás no piden:
 *
 *   1. **El formato oficial.** Dirección (2 nov 2026) fijó el formulario de
 *      `FORMATO_SOLICITUD_CANCELACION` como el trámite, y pidió que quede
 *      LIGADO A LA CUENTA desde el seguimiento. El formulario vive en Google y
 *      pide sesión corporativa, así que el tablero no puede leer sus
 *      respuestas: lo que sí puede es no dejar registrar la solicitud sin
 *      declarar que el formato se envió y con qué identificador de cuenta, que
 *      es lo que permite casar las dos mitades a ojo.
 *   2. **Qué se hizo para evitar la baja.** Una solicitud registrada sin la
 *      acción de retención documenta la pérdida y no la gestión. Es obligatoria.
 *
 * Nada de esto cambia el estado de la cuenta: **una baja no se consuma aquí.**
 * Registrar la solicitud documenta un riesgo; la baja la autoriza dirección y
 * se ejecuta pasando la cuenta a Dormida. Ver la regla de conciliación.
 */
import type { TipoSeguimiento } from './types'

/** El trámite oficial. Pide sesión corporativa de Google. */
export const FORMATO_SOLICITUD_CANCELACION =
  'https://docs.google.com/forms/d/e/1FAIpQLSej6O3PXSJ7SadPztjhCCbaKwQjT8-2FlHYIZT8Xb5bH_hWRQ/viewform'

export const SOLICITUD_CANCELACION: TipoSeguimiento = 'solicitud_cancelacion'

export interface OpcionTipo {
  value: TipoSeguimiento
  label: string
}

/**
 * El combo, en orden.
 *
 * Las etiquetas van escritas con su acentuación y mayúsculas reales en vez de
 * dejar que el CSS las arregle: `capitalize` sobre «solicitud de cancelación»
 * imprime «Solicitud De Cancelación», y sobre `whatsapp` imprimía «Whatsapp».
 */
export const TIPOS_SEGUIMIENTO: OpcionTipo[] = [
  { value: 'llamada',               label: 'Llamada' },
  { value: 'whatsapp',              label: 'WhatsApp' },
  { value: 'email',                 label: 'Email' },
  { value: 'reunion',               label: 'Reunión' },
  { value: 'ticket',                label: 'Ticket' },
  { value: 'nota',                  label: 'Nota' },
  { value: 'demo',                  label: 'Demo' },
  { value: 'upsell',                label: 'Upsell' },
  { value: 'solicitud_cancelacion', label: 'Solicitud de cancelación' },
]

/** Para pintar un tipo ya guardado, incluidos los que ya no se ofrezcan. */
export function etiquetaTipoSeguimiento(t: string | null | undefined): string {
  const v = String(t ?? '').trim()
  const op = TIPOS_SEGUIMIENTO.find(o => o.value === v)
  if (op) return op.label
  if (!v) return 'Sin tipo'
  // Un tipo viejo o escrito por otra vía: se muestra legible, no se esconde.
  return v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ')
}

const RESULTADOS_GENERALES = [
  'exitoso', 'sin_respuesta', 'escalado', 'interesado', 'no_interesado', 'pendiente',
]

/**
 * Los resultados de una solicitud de cancelación son otros.
 *
 * «exitoso» no significa nada aquí —¿exitosa la cancelación?— y lo que
 * dirección necesita leer es el desenlace de la retención. `pendiente` se
 * conserva porque es el valor con el que nace cualquier seguimiento.
 */
const RESULTADOS_CANCELACION = [
  'en_negociacion', 'retenida', 'downgrade_negociado', 'cancelacion_confirmada', 'pendiente',
]

export const RESULTADOS_POR_TIPO: Record<string, string[]> = {
  solicitud_cancelacion: RESULTADOS_CANCELACION,
}

export function resultadosDe(tipo: string | null | undefined): string[] {
  return RESULTADOS_POR_TIPO[String(tipo ?? '')] ?? RESULTADOS_GENERALES
}

/** Todos los resultados que el tablero puede escribir, sin repetir. */
export const RESULTADOS_TODOS: string[] = Array.from(
  new Set([...RESULTADOS_GENERALES, ...RESULTADOS_CANCELACION]),
)

/**
 * Las etiquetas se ESCRIBEN, no se derivan del valor.
 *
 * Quitarle el guion bajo a `en_negociacion` y dejar que `capitalize` lo
 * arregle imprime «En Negociacion»: sin acento, porque el valor guardado no lo
 * tiene, y con la segunda palabra en mayúscula, porque el text-transform no
 * sabe de español.
 */
const ETIQUETA_RESULTADO: Record<string, string> = {
  exitoso:                'Exitoso',
  sin_respuesta:          'Sin respuesta',
  escalado:               'Escalado',
  interesado:             'Interesado',
  no_interesado:          'No interesado',
  pendiente:              'Pendiente',
  en_negociacion:         'En negociación',
  retenida:               'Retenida',
  downgrade_negociado:    'Downgrade negociado',
  cancelacion_confirmada: 'Cancelación confirmada',
}

export function etiquetaResultado(r: string | null | undefined): string {
  const v = String(r ?? '').trim()
  if (!v) return ETIQUETA_RESULTADO.pendiente
  // Un resultado escrito a mano —hay varios en la base— se muestra tal cual.
  return ETIQUETA_RESULTADO[v] ?? v.replace(/_/g, ' ')
}

/**
 * Qué se hizo para evitar la baja o el downgrade.
 *
 * Es un catálogo cerrado a propósito: en texto libre cada asesor escribe la
 * misma gestión con otras palabras y después no se puede contar cuál retiene.
 * `otra` existe para no forzar a mentir — lleva el detalle en el cuerpo.
 */
export const ACCIONES_RETENCION: { value: string; label: string }[] = [
  { value: 'plan_rescate',        label: 'Plan de rescate documentado con fechas' },
  { value: 'ajuste_plan',         label: 'Ajuste de plan / downgrade negociado' },
  { value: 'condicion_comercial', label: 'Condición comercial o descuento temporal' },
  { value: 'resolucion_soporte',  label: 'Resolución del problema de soporte que la originó' },
  { value: 'sesion_valor',        label: 'Sesión de valor / re-onboarding del panel' },
  { value: 'escalamiento',        label: 'Escalamiento a dirección de CS' },
  { value: 'acuerdo_pago',        label: 'Acuerdo de pago o regularización del adeudo' },
  { value: 'sin_gestion',         label: 'Ninguna todavía — se registra la solicitud' },
  { value: 'otra',                label: 'Otra (se detalla abajo)' },
]

export function etiquetaAccionRetencion(v: string | null | undefined): string {
  const a = ACCIONES_RETENCION.find(x => x.value === String(v ?? ''))
  return a ? a.label : String(v ?? '')
}

/* ── El amarre con la cuenta ────────────────────────────────────────────────
 *
 * `seguimientos` no tiene columnas para esto y añadirlas obligaría a una
 * migración y a tocar los lectores. Se guarda dentro de `descripcion` con
 * etiquetas fijas, igual que la bitácora de `observaciones-kam.ts`: los doce
 * sitios que hoy leen una cadena siguen recibiendo una cadena, y quien sepa
 * leerla saca los campos. Las etiquetas son literales y NO se traducen: el
 * lector de abajo las busca por texto.
 */
const ET_FORMATO = 'Formato de solicitud de cancelación:'
const ET_CUENTA = 'Cuenta ligada:'
const ET_ACCION = 'Acción para evitar la baja o el downgrade:'

/** Lo que el asesor pega en el formato para que las dos mitades casen. */
export function identificadorDeCuenta(c: {
  consecutivo?: string | null
  cid?: string | null
  empresa?: string | null
}): string {
  const partes = [
    String(c.consecutivo ?? '').trim(),
    c.cid ? `CID ${String(c.cid).trim()}` : '',
    String(c.empresa ?? '').trim(),
  ].filter(Boolean)
  return partes.join(' · ')
}

export function componerSolicitud(d: {
  accion: string
  identificador: string
  detalle: string
  enviado: boolean
}): string {
  const lineas = [
    `${ET_FORMATO} ${d.enviado ? 'enviado' : 'PENDIENTE DE ENVIAR'} · ${FORMATO_SOLICITUD_CANCELACION}`,
    `${ET_CUENTA} ${d.identificador}`,
    `${ET_ACCION} ${etiquetaAccionRetencion(d.accion)}`,
  ]
  const detalle = d.detalle.trim()
  if (detalle) lineas.push('', detalle)
  return lineas.join('\n')
}

export interface SolicitudLeida {
  enviado: boolean | null
  url: string | null
  cuenta: string | null
  accion: string | null
  detalle: string
}

/**
 * Saca los campos de una descripción de solicitud.
 *
 * Devuelve `null` en los campos que no estén, en vez de inventarlos: una
 * solicitud registrada antes de esta regla —o escrita a mano— no trae nada, y
 * la ficha tiene que poder decir «no se declaró» con palabras.
 */
export function leerSolicitud(descripcion: string | null | undefined): SolicitudLeida {
  const t = String(descripcion ?? '').replace(/\r\n/g, '\n')
  const linea = (etiqueta: string) => {
    const i = t.indexOf(etiqueta)
    if (i < 0) return null
    const fin = t.indexOf('\n', i)
    return t.slice(i + etiqueta.length, fin < 0 ? undefined : fin).trim() || null
  }
  const formato = linea(ET_FORMATO)
  const url = formato ? (formato.match(/https?:\/\/\S+/) ?? [null])[0] : null
  const detalle = t
    .split('\n')
    .filter(l => ![ET_FORMATO, ET_CUENTA, ET_ACCION].some(e => l.includes(e)))
    .join('\n')
    .trim()
  return {
    enviado: formato ? /\benviado\b/i.test(formato) : null,
    url,
    cuenta: linea(ET_CUENTA),
    accion: linea(ET_ACCION),
    detalle,
  }
}
