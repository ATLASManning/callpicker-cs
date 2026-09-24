/**
 * Fechas en hora LOCAL, no en UTC.
 *
 * POR QUÉ EXISTE
 * --------------
 * `new Date().toISOString().slice(0, 10)` es la forma natural de sacar
 * «YYYY-MM-DD» y está mal para este proyecto: `toISOString()` convierte a UTC
 * y México va seis horas atrás, así que **todo lo que pasa después de las
 * 18:00 locales queda sellado con la fecha del día SIGUIENTE**.
 *
 * Se detectó el 23 sep 2026 en el calendario de Uso Dashboard: pintaba
 * actividad el día 24 cuando en México aún era 23. El registro de las 21:03
 * locales se guardaba como 03:03 del 24 en UTC. Afectaba al 30% de los
 * registros, y dejaba la pantalla contradiciéndose sola, porque `getDay()` y
 * `getHours()` —que alimentan las otras dos gráficas— sí usan hora local.
 *
 * QUÉ CUBRE Y QUÉ NO
 * ------------------
 * Esto es para código de NAVEGADOR, donde «local» es la zona de quien mira, y
 * quien mira está en México. Las rutas de `app/api` corren en el servidor de
 * Vercel, que va en UTC: ahí «hoy» es otra discusión —afecta a cuándo vence una
 * actividad y a dónde empieza el lunes del generador SAC— y no se cambia sin
 * decidirlo antes.
 */

/** «YYYY-MM-DD» de una fecha, con las partes locales. */
export function fechaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** El día de hoy donde está el usuario, no donde está el servidor. */
export function hoyLocal(): string {
  return fechaLocal(new Date())
}
