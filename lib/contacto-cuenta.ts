/**
 * lib/contacto-cuenta.ts — cuándo se habló por última vez con cada cuenta.
 *
 * POR QUÉ EXISTE
 * --------------
 * `cuentas.dias_sin_actividad` vale **0 en las 222 cuentas**. Se siembra en 0 al
 * alta y nadie la sincroniza nunca. Con ese 0:
 *
 *   · la urgencia por inactividad no se dispara jamás;
 *   · las tres acciones de cadencia de `/seguimiento` —«contacto urgente hoy»,
 *     «programar llamada de reactivación», «enviar check-in»— no se emiten
 *     nunca, aunque 99 cuentas pasen de 14 días y 27 de 60;
 *   · la columna «Días sin act.» de la portada muestra `0d` en los diez
 *     renglones, siempre, y sus umbrales de color no se pueden cruzar.
 *
 * Es la columna que debería decir a quién llamar, y dice cero en la lista de
 * llamadas.
 *
 * POR QUÉ SE SUMAN DOS FUENTES Y NO SE TOMA SOLO LA VIVA
 * ------------------------------------------------------
 * La regla de la casa dice que la fuente viva manda sobre la columna guardada.
 * Aquí no alcanza, y está medido (1 oct 2026, 192 cuentas vivas):
 *
 *   · **21 cuentas sin ningún seguimiento registrado SÍ traen
 *     `ultimo_contacto`.** Tomar solo `seguimientos` las dejaría como «nunca
 *     contactada» cuando alguien anotó un contacto real.
 *   · En **32** cuentas el valor guardado es MÁS NUEVO que el último
 *     seguimiento, y en **21** más viejo. No es un espejo desfasado: la columna
 *     tiene información que ninguna fuente viva tiene.
 *
 * Así que el último contacto es **el más reciente de las dos**. Sumar nunca
 * pierde; elegir una sola sí.
 *
 * LO QUE NO ENTRA, Y POR QUÉ
 * --------------------------
 * Las reuniones vinculadas a una cuenta serían una tercera fuente legítima,
 * pero hoy solo 28 de 82 reuniones llevan `cuenta_id` y aportarían **una sola**
 * cuenta de las 63 sin seguimiento. No se añade una consulta a un camino
 * caliente por una fila; cuando la mayoría de las reuniones lleven cuenta, se
 * suma aquí y se mide otra vez.
 *
 * NUNCA DEVUELVE CERO POR NO SABER
 * --------------------------------
 * `null` es «nunca se registró un contacto» y es distinto de «hoy». Son 63 de
 * las 192 cuentas vivas, y pintarlas como `0d` las manda al final de cualquier
 * orden por urgencia — justo las que más falta hacen.
 */
import { supabaseAdmin, traerPorPaginas } from './supabase'
import { ahoraEnMexico, fechaLocal } from './fecha-local'

/** «YYYY-MM-DD» de un valor que puede ser `date` o `timestamptz`.
 *
 *  `seguimientos.fecha` es `timestamptz` con un DÍA guardado dentro: quien
 *  escribe manda `hoyEnMexico()` y Postgres lo deja en medianoche UTC. Es la
 *  misma distinción que documenta `textoFecha` en lib/fecha-local.ts — una
 *  medianoche UTC exacta es un día escrito; cualquier otra hora, un instante. */
function diaDe(valor: string | null | undefined): string | null {
  const s = String(valor ?? '')
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.0+)?(Z|\+00:?00)$/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return fechaLocal(ahoraEnMexico(d))
}

/**
 * El día del último contacto de cada cuenta, por `cuenta_id`.
 *
 * @param guardado  lo que trae `cuentas.ultimo_contacto`, por id. Se fusiona
 *                  con los seguimientos quedándose con la fecha mayor.
 */
/* ── CONTACTO ≠ ACTIVIDAD, y el tablero los estaba llamando igual ─────────
 *
 * Dirección, 6 oct 2026: «Los días sin contacto no coinciden. Sección Amarilla
 * aparece con 96 días en un lugar y 36 en otro. Tech People aparece como
 * "nunca contactada" y también con 46 días». Medido: 102 de las 192 cuentas
 * vivas daban distinto según la pantalla.
 *
 * No era un error de cálculo: eran DOS CONCEPTOS compartiendo nombre.
 *
 *   actividad  cualquier renglón del historial, notas y tickets incluidos.
 *              Dice hace cuánto que alguien TOCÓ la cuenta.
 *   contacto   una llamada, un correo, un WhatsApp o una reunión que además
 *              LLEGÓ al cliente. Dice hace cuánto que HABLAMOS con él.
 *
 * Y los dos campos ya existían con el nombre correcto —`dias_sin_actividad` y
 * `dias_sin_contacto`—; lo que pasaba es que se llenaban con lo mismo.
 *
 * De 445 seguimientos, 193 son `nota` y 38 `ticket`: actividad interna. De los
 * 212 que sí son canales, 49 no llegaron. Escribir una nota que dice «esta
 * cuenta está en riesgo» no es haber hablado con ella — y así se perdió
 * Biolaboratorio Sadat.
 *
 * Estas dos constantes son LA definición, y las importa también el motor de
 * alertas: mientras vivan en un solo sitio no pueden volver a divergir.
 */
export const CANALES_CONTACTO: ReadonlySet<string> = new Set([
  'llamada', 'whatsapp', 'email', 'correo', 'reunion', 'visita', 'videollamada',
])

const RX_NO_LLEGO = new RegExp([
  'sin[_ ]respuesta', 'sin[_ ]?[eé]xito', 'no contest', 'fuera de servicio',
  'buz[óo]n', 'no se (?:obtuvo|ha obtenido) respuesta', 'intentos? de contacto',
  'no (?:fue|ha sido) posible', 'se continuar[áa] intentando', 'pendiente de respuesta',
  'ya no (?:forma parte|labora|trabaja|est[áa] en)', 'dej[óo] de laborar',
].join('|'), 'i')

/** ¿Este seguimiento llegó al cliente? Sólo los canales, y sólo los que no
 *  declaran haber fallado. `resultado` no es un enum: junto a 'exitoso' hay
 *  frases escritas a mano, así que se define lo que NO llegó. */
export function llegoAlCliente(
  s: { tipo?: string | null; resultado?: string | null; descripcion?: string | null },
): boolean {
  if (!CANALES_CONTACTO.has(String(s.tipo ?? '').toLowerCase())) return false
  const r = String(s.resultado ?? '').trim().toLowerCase()
  if (r === 'sin_respuesta') return false
  return !(RX_NO_LLEGO.test(r) || RX_NO_LLEGO.test(String(s.descripcion ?? '')))
}

/**
 * El último contacto que LLEGÓ al cliente, por cuenta.
 *
 * No mezcla `cuentas.ultimo_contacto`: esa columna la escribe el cierre de
 * cualquier actividad —incluidas las de `validacion`, que no hablan con
 * nadie—, así que revisar unos datos marcaba la cuenta como contactada.
 */
export async function ultimoContactoEfectivoPorCuenta(): Promise<Map<string, string>> {
  const filas = await traerPorPaginas<{ cuenta_id: string; fecha: string
                                        tipo: string | null; resultado: string | null
                                        descripcion: string | null }>(
    (desde, hasta) => supabaseAdmin
      .from('seguimientos')
      .select('cuenta_id, fecha, tipo, resultado, descripcion')
      .range(desde, hasta),
  )
  const mapa = new Map<string, string>()
  for (const f of filas) {
    if (!f.cuenta_id || !llegoAlCliente(f)) continue
    const d = diaDe(f.fecha)
    if (!d) continue
    const previo = mapa.get(f.cuenta_id)
    if (!previo || d > previo) mapa.set(f.cuenta_id, d)
  }
  return mapa
}

export async function ultimoContactoPorCuenta(
  guardado: Map<string, string | null> = new Map(),
): Promise<Map<string, string>> {
  const filas = await traerPorPaginas<{ cuenta_id: string; fecha: string }>(
    (desde, hasta) => supabaseAdmin
      .from('seguimientos')
      .select('cuenta_id, fecha')
      .range(desde, hasta),
  )

  const mapa = new Map<string, string>()
  const anotar = (id: string | null | undefined, valor: string | null | undefined) => {
    if (!id) return
    const d = diaDe(valor)
    if (!d) return
    const previo = mapa.get(id)
    if (!previo || d > previo) mapa.set(id, d)
  }

  for (const [id, valor] of guardado) anotar(id, valor)
  for (const f of filas) anotar(f.cuenta_id, f.fecha)
  return mapa
}

/**
 * Días desde el último contacto. **`null` = nunca se registró uno.**
 *
 * No devuelve 0 por no saber: un cero sin medición no es un cero, y aquí
 * significaría «hablamos hoy» sobre una cuenta que nadie ha tocado nunca.
 */
export function diasSinContacto(dia: string | null | undefined): number | null {
  if (!dia) return null
  const hoy = fechaLocal(ahoraEnMexico())
  const ms = Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${String(dia).slice(0, 10)}T00:00:00Z`)
  if (isNaN(ms)) return null
  return Math.max(0, Math.floor(ms / 86400000))
}

/** Cómo se escribe en pantalla, sin inventar un número donde no lo hay. */
export function textoSinContacto(dias: number | null): string {
  if (dias === null) return 'nunca'
  if (dias === 0) return 'hoy'
  return `${dias}d`
}
