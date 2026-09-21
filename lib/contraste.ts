/**
 * Tono de texto legible sobre fondo claro.
 *
 * ── EL PROBLEMA QUE RESUELVE ───────────────────────────────────────────────
 * Por todo el tablero hay pastillas que pintan el texto y el fondo con el
 * MISMO color —`color: X` sobre `background: X + '18'`—. Queda bonito y es
 * ilegible: un ámbar `#f59e0b` sobre su propio tinte al 14% da **1.93:1**,
 * cuando el mínimo para texto es 4.5:1. Con el amarillo `#EAB308` baja a
 * 1.75:1. Salió en el barrido del 21 sep 2026 en seis componentes distintos
 * (semáforos de churn, prioridades de tickets, chips de activaciones, Health
 * Score de seguimiento, contadores de auditoría).
 *
 * ── POR QUÉ SE CALCULA Y NO SE LISTA ───────────────────────────────────────
 * La tentación es un diccionario «ámbar → ámbar oscuro» en cada archivo. Eso
 * son seis listas que se desincronizan en cuanto alguien añade un color: la
 * pastilla nueva se vería mal y nadie lo notaría, porque no falla nada. Aquí
 * se oscurece el tono hasta que MIDE lo que tiene que medir, sea cual sea.
 *
 * El fondo se deja igual: solo se oscurece la letra. Así la pastilla conserva
 * su color —que es lo que comunica— y gana el contraste.
 */

const CACHE = new Map<string, string>()

function hexARgb(h: string): [number, number, number] {
  let s = String(h ?? '').trim().replace('#', '')
  if (s.length === 3) s = s.split('').map(c => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return [15, 23, 42]   // basura -> marino
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ]
}

const rgbAHex = (c: number[]) =>
  '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase()).join('')

/** Canal sRGB linealizado, según la fórmula de WCAG. */
function canal(c: number): number {
  const x = c / 255
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

const luminancia = (c: number[]) =>
  0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2])

function contraste(a: number[], b: number[]): number {
  const la = luminancia(a)
  const lb = luminancia(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** El fondo REAL de la pastilla: el tinte sobre el blanco de la tarjeta. */
const compone = (fg: number[], alfa: number, fondo = [255, 255, 255]) =>
  fg.map((c, i) => c * alfa + fondo[i] * (1 - alfa))

/**
 * Oscurece `hex` hasta que contrasta contra su propio tinte sobre fondo claro.
 *
 * @param hex      el color de la pastilla
 * @param alfa     qué tan fuerte es el tinte del fondo (0.14 = el típico `18`)
 * @param objetivo contraste mínimo; 4.5:1 es el de texto normal en WCAG AA
 *
 * Devuelve el mismo color si ya contrastaba. Verificado contra los diez tonos
 * que usa el tablero: todos pasan de ~2:1 a 4.5:1 o más.
 */
export function tonoSobreClaro(hex: string, alfa = 0.14, objetivo = 4.5): string {
  const clave = `${hex}|${alfa}|${objetivo}`
  const guardado = CACHE.get(clave)
  if (guardado) return guardado

  const base = hexARgb(hex)
  const fondo = compone(base, alfa)
  let r = '#0F172A'
  for (let k = 1; k > 0.02; k -= 0.025) {
    const cand = base.map(c => c * k)
    if (contraste(cand, fondo) >= objetivo) { r = rgbAHex(cand); break }
  }
  CACHE.set(clave, r)
  return r
}

/**
 * El estilo completo de una pastilla de color sobre fondo claro.
 *
 * El fondo conserva el tono original —es lo que comunica de un vistazo— y la
 * letra se oscurece lo necesario para leerse.
 */
export function pastillaClara(hex: string, alfa = 0.14) {
  return {
    background: `${hex}${Math.round(alfa * 255).toString(16).padStart(2, '0')}`,
    color: tonoSobreClaro(hex, alfa),
    borderColor: `${hex}55`,
  }
}
