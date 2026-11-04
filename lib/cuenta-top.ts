/**
 * ¿ES UNA CUENTA TOP? UNA definición, y ésta es la del apartado Cuentas.
 *
 * Vivía dentro de `app/cuentas/page.tsx` como función local, así que nada fuera
 * de esa pantalla podía preguntarlo sin reescribir la regla. Se saca aquí para
 * que el corte de Churn —`scripts/corte-top-churn-confirmado.mjs`— la IMPORTE
 * en vez de copiarla: un espejo tecleado a mano deja de ser espejo.
 * [[feedback-fuente-unica-cuentas]] [[feedback-verificar-antes-asegurar]]
 *
 * OJO, HAY DOS COSAS LLAMADAS «TOP» Y NO SON LA MISMA:
 *
 *   · ESTA — «venía en la lista Top Customer», que es lo que marca el filtro
 *     TOP del apartado Cuentas Activas. Sale del CONSECUTIVO.
 *   · `topDeCartera()` en `lib/facturacion-cuenta.ts` — las 25 cuentas de mayor
 *     MRR de la cartera viva, que es lo que usan las alertas para priorizar.
 *     Ésa se recalcula cuando una cuenta cambia de estado; esta NO.
 *
 * Cuando dirección dice «cuentas TOP» hablando del apartado de Cuentas, es
 * ESTA. Confundirlas da dos poblaciones distintas y ninguna avisa.
 */

/**
 * Rangos del concentrado original "Top Customer.xlsx": los consecutivos se
 * asignaron en bloque (F1-F46, D1-D38, C1-C43) al importar ese Excel, así que
 * el rango equivale a "venía en la lista Top Customer".
 */
export const TOP_RANGES: Record<string, number> = { F: 46, D: 38, C: 43 }

/**
 * Cuentas TOP dadas de alta DESPUÉS de aquel concentrado.
 *
 * El rango por sí solo no puede expresarlas: una cuenta nueva siempre recibe un
 * consecutivo por encima del bloque (TATSA es D59) y quedaría fuera de TOP para
 * siempre. Ampliar el rango tampoco sirve — subir D a 59 marcaría como TOP a
 * D39-D58, que no lo son. Por eso van enumeradas, con su razón.
 */
export const TOP_EXTRA: Record<string, string> = {
  D59: 'TATSA — alta 9 sep 2026 por instrucción de dirección. Cuenta TOP: 8 sitios con Callpicker, 11 DIDs, red de 10 puntos comerciales.',
}

export function isTopCustomer(consecutivo: string | null): boolean {
  if (!consecutivo) return false
  if (TOP_EXTRA[consecutivo]) return true
  const prefix = consecutivo[0]
  const num = parseInt(consecutivo.slice(1), 10)
  return !!TOP_RANGES[prefix] && num >= 1 && num <= TOP_RANGES[prefix]
}
