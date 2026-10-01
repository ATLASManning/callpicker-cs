/**
 * lib/grc-cerrados.ts — el GRC sin el mes vivo, en un solo sitio.
 *
 * POR QUÉ EXISTE
 * --------------
 * La regla de la casa dice que **el churn del mes vivo no es churn: es cartera
 * por cobrar**. Son facturas que todavía no se cobran y que se recuperan con el
 * pago. El churn real es el del mes VENCIDO.
 *
 * La regla estaba, y se aplicaba en unos sitios y en otros no. Cada módulo
 * resolvía por su cuenta si saltar el mes en curso, así que la misma cifra
 * salía distinta según qué pantalla la pidiera:
 *
 *   · `lib/elegibilidad.ts` lo saltaba — correcto.
 *   · `lib/conciliacion.ts` no, y ofrecía 46 cuentas vivas para mandarlas a
 *     Dormida, con $326,762 de facturación detrás.
 *   · `lib/churn-por-asesor.ts` no, e **invertía el orden de las tres asesoras**.
 *   · `lib/atlas-context.ts` no, y le contaba al modelo 755 clientes de
 *     septiembre bajo el rótulo «CHURN CONFIRMADO».
 *
 * Una regla que cada quien aplica a su manera es una regla que no existe. Aquí
 * se decide una vez.
 *
 * LA MAGNITUD, MEDIDA
 * -------------------
 * Al 1 de octubre de 2026, septiembre trae **755** filas con «Churn confirmado»
 * contra 40 a 62 de cada mes cerrado, y **749 nombres aparecen únicamente ahí**.
 * No es un sesgo pequeño: es más que los ocho meses cerrados juntos.
 *
 * LO QUE ESTE MÓDULO NO CUBRE
 * ---------------------------
 * `CLIENTES_CANCELADOS` (el reporte semanal de Churn · Análisis DATA) es otra
 * fuente y NO se filtra: ahí «cancelación confirmada» es una baja que dirección
 * revisó, no un retraso de cobranza. Ver el comentario en `lib/conciliacion.ts`.
 */
import { AAA_GRC_2026, AAA_GRC_FLAT } from '@/app/churn/aaa-grc-data'
import { GRC_MES_EN_CURSO } from '@/app/churn/grc-reporte'

const VIVO = (GRC_MES_EN_CURSO ?? '').toLowerCase()

/** ¿Es este el mes que todavía se está cobrando? */
export function esMesVivo(mes: string | null | undefined): boolean {
  return Boolean(VIVO) && String(mes ?? '').toLowerCase() === VIVO
}

/** El nombre del mes excluido, para poder decirlo en pantalla en vez de que
 *  alguien se pregunte por qué no cuadra con el archivo. `null` si no hay. */
export const GRC_MES_EXCLUIDO: string | null = GRC_MES_EN_CURSO

/** Los meses CERRADOS del GRC. Es lo que se debe contar como churn. */
export const AAA_GRC_MESES_CERRADOS = AAA_GRC_2026.filter(m => !esMesVivo(m.mes))

/** Las filas de los meses cerrados, planas. Sustituye a `AAA_GRC_FLAT` en todo
 *  lo que mida churn o downgrade atribuible a alguien. */
export const AAA_GRC_CERRADOS = AAA_GRC_FLAT.filter(r => !esMesVivo(r.mes))

/** Lo que se dejó fuera, para poder declararlo: filas y MRR del mes vivo.
 *  Un número que desaparece sin explicación se lee como un error. */
export const GRC_MES_VIVO_RESUMEN = (() => {
  const filas = AAA_GRC_FLAT.filter(r => esMesVivo(r.mes) && (r.movimiento ?? '').startsWith('Churn confirmado'))
  return {
    mes: GRC_MES_EXCLUIDO,
    clientes: filas.length,
    /* `perdido` a secas, SIN sumar `perdido2`: esa segunda columna es
       fraude-reestructura y no es pérdida por churn. Mezclarlas infla el
       churn de meses enteros — Junio pasaba de $87,260 a $147,777. */
    mrr: filas.reduce((s, r) => s + (r.perdido ?? 0), 0),
  }
})()
