/**
 * Criterio único de "valor real" vs "relleno".
 *
 * Vivía dentro de lib/elegibilidad.ts, que arrastra los datasets de churn; se
 * extrajo aquí para que cualquier módulo (y las pruebas) pueda usarlo sin esa
 * cadena de imports. `lib/elegibilidad.ts` lo reexporta, así que sigue habiendo
 * UNA sola definición en todo el proyecto.
 *
 * Importa porque en `cuentas` el vacío se capturó de varias formas: null, ''
 * y el literal "0" (giro="0", pagina_web="0", num_oficinas="0").
 */

const RELLENO = new Set([
  'na', 'n/a', 'noaplica', 'pendiente', 'sininformacion', 'sininfo', 'sindato',
  'sindatos', 'tbd', 'porconfirmar', 'pordefinir', 'desconocido', 'ninguno',
  'nodisponible', 'nd', 'xx', 'xxx', '-', '--', '0', 'null', 'undefined',
])

export function esValorReal(v: unknown): boolean {
  if (v == null) return false
  const raw = String(v).trim()
  if (raw === '') return false
  const k = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '')
  if (RELLENO.has(k)) return false
  if (/^[-–—._]+$/.test(k)) return false
  return true
}
