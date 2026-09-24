/**
 * Fechas en el calendario que importa, no en el del servidor.
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
 * LAS DOS MITADES
 * ---------------
 * `fechaLocal`/`hoyLocal` son para código de NAVEGADOR: «local» es la zona de
 * quien mira, y quien mira está en México.
 *
 * `ahoraEnMexico`/`hoyEnMexico` son para código de SERVIDOR. Las rutas de
 * `app/api` corren en Vercel, que va en UTC, y ahí «local» no significa nada:
 * hay que nombrar la zona. Esa mitad se añadió el 23 sep 2026, al medir el
 * daño real (ver abajo). Úsalas también en cualquier código que pueda correr
 * en los dos lados —un Server Component, un helper compartido—, porque dan la
 * respuesta correcta sin importar dónde se ejecuten.
 *
 * QUÉ ROMPÍA EN EL SERVIDOR (medido el 23 sep 2026)
 * -------------------------------------------------
 *  · LA GENERACIÓN SAC, que era lo grave. El generador solo corre en lunes.
 *    Un lunes a partir de las 18:00 de México el servidor ya cree que es
 *    martes y **se bloquea**: 6 de las 24 horas del lunes quedaban
 *    inutilizables. Y al revés, de 18:00 a 23:59 del DOMINGO dejaba generar la
 *    semana antes de tiempo.
 *  · EL AVISO DE «VENCIDA», que compara contra el «hoy» del servidor. La
 *    ventana de riesgo son esas mismas 6 horas, todos los días: una actividad
 *    que vence el viernes se vería vencida desde el jueves a las 18:00.
 *    (Ese día no había ninguna en la ventana; el riesgo era latente.)
 *  · Las fechas YA GUARDADAS estaban bien: las 409 actividades tienen
 *    `semana_inicio` en lunes, y desde el 24 ago —cuando se retiró la rotación
 *    martes-viernes— las 49 nuevas vencen en viernes, sin excepción.
 *
 * LO QUE ESTO NO ES
 * -----------------
 * No toca las conversiones de seriales de Excel (`app/api/cortes`,
 * `app/api/activaciones/detalle`): ésas construyen la fecha sobre el epoch
 * UTC y `toISOString()` es justo lo que deben usar. Cambiarlas las rompería.
 */

/** La zona del negocio. México no observa horario de verano desde 2022, pero
 *  se nombra la zona IANA en vez de restar 6 horas a mano: si eso cambia, o si
 *  algún día hay que mirar otra zona, se cambia aquí y nada más. */
export const ZONA_MEXICO = 'America/Mexico_City'

/** «YYYY-MM-DD» de una fecha, con las partes locales. */
export function fechaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** El día de hoy donde está el usuario, no donde está el servidor. */
export function hoyLocal(): string {
  return fechaLocal(new Date())
}

/* ── La mitad de servidor ──────────────────────────────────────────────────── */

const PARTES_MEXICO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_MEXICO,
  hour12:   false,
  year:  'numeric', month:  '2-digit', day:    '2-digit',
  hour:  '2-digit', minute: '2-digit', second: '2-digit',
})

/**
 * Un `Date` cuyas partes LOCALES son la hora de pared de México.
 *
 * El truco está en para qué sirve: devuelve un instante que NO es el real —si
 * el servidor va en UTC, va seis horas atrás—, pero cuyos `getDay()`,
 * `getDate()`, `getHours()` y `setHours()` responden lo que responderían en
 * México. Así el código que ya existe (`getMondayOfWeek`, `esLunes`) sigue
 * escrito igual y empieza a dar la respuesta correcta.
 *
 * Por eso **su resultado no se serializa con `toISOString()`** —eso volvería a
 * meter el desfase—, sino con `fechaLocal()`.
 */
export function ahoraEnMexico(base: Date = new Date()): Date {
  const p: Record<string, string> = {}
  for (const parte of PARTES_MEXICO.formatToParts(base)) {
    if (parte.type !== 'literal') p[parte.type] = parte.value
  }
  // A medianoche algunos runtimes emiten «24» en vez de «00» con hour12:false.
  const hora = Number(p.hour) % 24
  return new Date(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    hora, Number(p.minute), Number(p.second), 0,
  )
}

/** «YYYY-MM-DD» del día que es HOY en México, corra donde corra el código. */
export function hoyEnMexico(base: Date = new Date()): string {
  return fechaLocal(ahoraEnMexico(base))
}

/** «YYYY-MM-DD HH:MM» de México. Para notas de auditoría, donde escribir la
 *  hora en UTC obliga a quien lee a hacer la resta de cabeza. */
export function selloMexico(base: Date = new Date()): string {
  const d = ahoraEnMexico(base)
  return `${fechaLocal(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
