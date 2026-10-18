/**
 * lib/fecha-xlsx.ts — UNA FECHA DE EXCEL, VENGA COMO VENGA.
 *
 * El mismo .xlsx entrega la misma columna de TRES formas distintas, y cada
 * lector que se escribía entendía sólo una:
 *
 *   · número de serie de Excel (días desde el 30 dic 1899)
 *   · un `Date` de verdad, cuando la celda tiene formato de fecha
 *   · TEXTO, `10-Dec-2025` — **645 de las 2,747 filas** del tablero de
 *     activaciones, el 23%, están así
 *
 * Vivía dentro de `lib/nuevos-sin-asesor.ts` y la necesitaba también el módulo
 * de Activaciones. Copiarla habría sido la segunda versión de una función que
 * ya se había equivocado una vez: cuando sólo entendía el número de serie, las
 * 49 fechas en texto quedaban «sin fecha», entraban en la ventana por no poder
 * descartarlas, y el globo de clientes nuevos anunciaba 32 donde había UNO.
 *
 * Así que se mueve aquí entera y se importa en los dos sitios. Mover una
 * función es borrarla del sitio viejo: si alguien encuentra una copia local de
 * esto, sobra. [[feedback-verificar-antes-asegurar]]
 */

/** Los meses como los escribe el .xlsx: `10-Dec-2025`. */
const MESES: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
}

/** La fecha en `YYYY-MM-DD`, o `null` si la celda no trae ninguna. */
export function fechaDeXlsx(cru: unknown): string | null {
  if (typeof cru === 'number' && cru > 0) {
    const d = new Date(Date.UTC(1899, 11, 30) + cru * 86400000)
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }
  if (cru instanceof Date && !Number.isNaN(cru.getTime())) {
    return cru.toISOString().slice(0, 10)
  }
  if (typeof cru === 'string') {
    const s = cru.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
    const m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/)
    if (m) {
      const mes = MESES[m[2].toUpperCase()]
      if (mes) return `${m[3]}-${mes}-${m[1].padStart(2, '0')}`
    }
  }
  return null
}

/** El AÑO de esa fecha, o `null`. Para rellenar una columna `Año` vacía. */
export function anoDeXlsx(cru: unknown): number | null {
  const f = fechaDeXlsx(cru)
  if (!f) return null
  const a = parseInt(f.slice(0, 4), 10)
  return Number.isFinite(a) ? a : null
}
