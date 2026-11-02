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

/**
 * Lo que dice un seguimiento, en una línea, para quien sólo tiene una línea.
 *
 * ── POR QUÉ HACE FALTA ─────────────────────────────────────────────────────
 * El cuerpo de una solicitud de cancelación empieza SIEMPRE por las tres
 * etiquetas del amarre, así que cualquier `slice` sobre `descripcion` cae
 * dentro de la fontanería. Medido el 2 nov 2026 en tres sitios distintos:
 *
 *   - el bloque de movimiento de alertas cortaba a 40 y publicaba
 *     «Formato de solicitud de cancelación: env…»;
 *   - la tabla de la junta del asesor enseñaba 200px de lo mismo;
 *   - y `lib/atlas-context.ts` le pasaba al MODELO 70 letras que terminan
 *     dentro de la URL de Google. Eso es lo peor de los tres: una pantalla
 *     con un renglón feo se nota, pero un modelo al que le llega una cuenta
 *     que pidió irse descrita como media URL no dice «no sé» — rellena.
 *
 * Para una solicitud, la línea útil es QUÉ SE HIZO para evitar la baja, y
 * después el detalle que escribió el asesor. Lo que no se declaró se dice.
 *
 * `max` es el presupuesto de TODA la línea, no sólo del texto libre. En una
 * solicitud la acción va entera —cortarla por la mitad («Resolución del
 * problema de sopo…») la vuelve a hacer ilegible— y el detalle libre entra
 * sólo con lo que sobre. Si no sobra sitio para decir algo, no entra: el
 * bloque de alertas pide 40 letras y ahí la acción ya es la línea.
 */
const MINIMO_UTIL = 12

export function resumenDeSeguimiento(
  tipo: string | null | undefined,
  descripcion: string | null | undefined,
  max = 70,
): string {
  const limpia = (s: string) => s.replace(/\s+/g, ' ').trim()
  const cortar = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s)
  if (String(tipo ?? '').toLowerCase() === SOLICITUD_CANCELACION) {
    const sol = leerSolicitud(descripcion)
    const cabeza = sol.accion ?? 'no se declaró qué se hizo para evitarla'
    const resto = limpia(sol.detalle)
    const sobra = max - cabeza.length - 3   // el « — »
    if (!resto || sobra < MINIMO_UTIL) return cabeza
    return `${cabeza} — ${cortar(resto, sobra)}`
  }
  const t = limpia(String(descripcion ?? ''))
  return t ? cortar(t, max) : ''
}

/**
 * La bitácora de seguimientos, tal y como se la damos a un MODELO.
 *
 * Vive aquí y no en `lib/atlas-context.ts` porque así se puede probar sola:
 * armar el dossier entero exige base de datos y archivos, y una línea que el
 * modelo lee no puede quedar sin comprobar por culpa del andamio.
 *
 * ── LO QUE LE PASABA ANTES ─────────────────────────────────────────────────
 *   Seguimientos KAM: [2026-11-02] solicitud_cancelacion: Formato de
 *   solicitud de cancelación: enviado · https://docs.google.c
 *
 * Dos huecos, y los dos de la misma familia — callarle al modelo lo que no
 * tiene:
 *
 *   1. Setenta letras que terminan DENTRO de la URL. Una cuenta que pidió
 *      irse le llegaba descrita como media dirección web. Un hueco así no
 *      produce un «no sé»: produce una invención.
 *   2. Enseñaba TRES de los CINCO que la consulta trae, sin decirlo. Tres
 *      renglones sin índice se leen como la bitácora entera, y el modelo
 *      contesta «tiene tres seguimientos» sobre una cuenta que tiene treinta.
 *
 * Ahora van numerados `i/N`, y la línea dice si es la bitácora completa o una
 * muestra — y cuando es una muestra, le prohíbe afirmar el total.
 */
export function lineaSeguimientosKAM(
  segs: Array<{ fecha?: unknown; tipo?: string | null
                descripcion?: string | null; resultado?: string | null }>,
  tope = 5,
): string {
  if (!segs.length) return 'NINGUNO registrado'
  const n = Math.min(segs.length, tope)
  const cuerpo = segs.slice(0, tope).map((s, i) =>
    `(${i + 1}/${n}) [${String(s.fecha ?? 'sin fecha').slice(0, 10)}] `
    + `${etiquetaTipoSeguimiento(s.tipo)}`
    + (s.resultado ? ` [${etiquetaResultado(s.resultado)}]` : '')
    + `: ${resumenDeSeguimiento(s.tipo, s.descripcion, 160) || 'sin texto capturado'}`,
  ).join(' | ')
  /* `>=` y no `>`: con exactamente `tope` filas no se sabe si hay más, y
     suponer que no las hay es justo la afirmación que no se puede hacer. */
  return cuerpo + (segs.length >= tope
    ? ` — son los ${tope} MÁS RECIENTES, no la bitácora entera: el total no se `
      + `consultó, así que NO afirmes cuántos seguimientos tiene esta cuenta.`
    : ' — son todos los que tiene.')
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
