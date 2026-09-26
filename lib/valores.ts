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

/**
 * Un teléfono que sirva para MARCAR, no solo para llenar el campo.
 *
 * `esValorReal` no basta aquí y no debe bastar: es un criterio genérico y esto
 * depende del significado del campo. Un `55` repetido es un health score
 * perfectamente válido; como teléfono no existe.
 *
 * SE ENCONTRÓ ASÍ (Clikauto, 25 sep 2026): el único contacto de la cuenta tenía
 * `000000000000000` por teléfono. El sistema la daba por «contacto completo»
 * mientras el único canal real era el correo — y desde junio nadie respondía.
 * El dato falso es peor que el ausente: el ausente se ve, el falso apaga la
 * alarma.
 *
 * Tres condiciones, y las tres miran solo los dígitos:
 *   · que haya al menos 7 dígitos (en México, lo mínimo marcable);
 *   · que no sean todos el mismo (0000000000, 1111111111);
 *   · que pase el criterio general de relleno.
 *
 * Se midió antes de escribirlo: en las 222 cuentas solo dos teléfonos y tres
 * entradas de `contactos_json` caen por esta regla. No hay falsos positivos.
 */
export function esTelefonoReal(v: unknown): boolean {
  if (!esValorReal(v)) return false
  const d = String(v).replace(/\D/g, '')
  if (d.length < 7) return false
  return new Set(d).size > 1
}
