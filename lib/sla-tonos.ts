import {
  tonoSobreOscuro, tonoSobrePagina, tonoSobreTinte, textoSobreSolido,
  rellenoParaTextoClaro, FONDO_PAGINA,
} from '@/lib/contraste'
import { ETIQUETA_NIVEL, type NivelSemaforo } from '@/lib/alertas-sla'

/**
 * LOS TONOS DEL SEMÁFORO DE VENCIMIENTO — SE CALCULAN, NO SE LISTAN
 *
 * **Leer [[atlas-dashboard-contrast-architecture]] antes de tocar un color de
 * este archivo.** Catorce rondas del mismo bug en este tablero, y la de la 10ª
 * es la que más veces ha vuelto: *una medición de contraste caduca cuando
 * cambia la paleta, y no avisa*. Aquí no hay ninguna medición guardada: los
 * ocho niveles se derivan con las funciones de `lib/contraste.ts` contra el
 * fondo REAL de cada superficie, así que el día que una pantalla cambie de
 * fondo, los tonos cambian con ella.
 *
 * ── LAS DOS SUPERFICIES, Y NO SE MEZCLAN ──────────────────────────────────
 *
 *   · `oscura` — los paneles de `/alertas` (`#0D1829`). Ahí la letra ASCIENDE
 *                hacia el blanco: `tonoSobreOscuro`.
 *   · `clara`  — la ficha de cuenta y la página (`#F5F8FB`). Ahí la letra
 *                DESCIENDE: `tonoSobrePagina`.
 *
 * Son dos juegos y van en el mismo archivo a propósito: dos archivos con los
 * mismos nombres son las «paletas gemelas» que ya costaron una ronda —alguien
 * corrige uno y el otro se queda con la medición vieja sin que falle nada—. Lo
 * que no se puede es pedir el juego equivocado, y por eso la superficie es un
 * argumento obligatorio y no tiene valor por omisión.
 *
 * ── ROJO INTENSO NO ES «MÁS ROJO» ─────────────────────────────────────────
 *
 * El encargo pide un quinto escalón por encima del rojo, y eso no se consigue
 * con un rojo más saturado: sobre fondo oscuro la letra ya va casi blanca y no
 * queda hacia dónde subirla; sobre fondo claro, bajar más el rojo lo acerca al
 * marino del texto normal. **Un color que no se puede aclarar se MUDA de
 * sitio**: el nivel `rojo_intenso` se pinta como RELLENO SÓLIDO con su letra
 * elegida contra ese relleno, que es lo mismo que se hizo con los colores de
 * rol en el avatar del menú lateral (14ª ronda).
 *
 * Y el relleno no desempeña el papel del aviso: `ETIQUETA_NIVEL` lo dice CON
 * PALABRAS —«INCUMPLIDA»— al lado. El color nunca es el único indicador, que es
 * literalmente lo que el encargo exige en su sección 2.
 */

/** El panel oscuro de `/alertas`. El mismo valor que esa pantalla pinta. */
export const PANEL_OSCURO = '#0D1829'

export type Superficie = 'oscura' | 'clara'

/**
 * LA FAMILIA, una semilla por nivel.
 *
 * Son las semillas, NO los colores que se pintan: ninguno de estos seis pasa
 * 4.5:1 por sí solo en las dos superficies —el verde `#22C55E` mide 2.28:1
 * sobre blanco y el ámbar `#EAB308` 1.75:1—, y por eso ninguno llega a la
 * pantalla sin pasar por el cálculo.
 */
const SEMILLA: Record<NivelSemaforo, string> = {
  verde:        '#22C55E',
  amarillo:     '#EAB308',
  naranja:      '#F97316',
  rojo:         '#EF4444',
  rojo_intenso: '#DC2626',
  /* Bloqueada y cerrada comparten el gris a propósito: las dos dicen «esto no
     corre contra ti». Lo que las distingue es la palabra, no el tono. */
  bloqueada:    '#94A3B8',
  atendida:     '#0EA5E9',
  cerrada:      '#94A3B8',
}

export interface Tono {
  /** La letra, medida contra la superficie. */
  texto: string
  /** El filete o el borde. Objeto gráfico: 3:1, no 4.5. */
  trazo: string
  /** El tinte de la pastilla, sobre el que se mide `texto`. */
  tinte: string
  /** Sólo `rojo_intenso`: el relleno sólido al que se muda el color. */
  relleno: string | null
  /** La letra que va ENCIMA de ese relleno. */
  sobreRelleno: string | null
  /** La palabra. Siempre acompaña al color; nunca lo sustituye. */
  etiqueta: string
}

/** El alfa del tinte de las pastillas. El mismo de `pastillaSobrePagina`. */
const ALFA_TINTE = 0.14

function tonoDe(nivel: NivelSemaforo, superficie: Superficie): Tono {
  const hex = SEMILLA[nivel]
  const fondo = superficie === 'oscura' ? PANEL_OSCURO : FONDO_PAGINA

  /* El TEXTO se mide contra el tinte compuesto, no contra el fondo a pelo: una
     pastilla `rgba(…,0.14)` es un pelo más clara (o más oscura) que el panel, y
     ésas son las décimas que se comió la 10ª ronda. */
  const texto = superficie === 'oscura'
    /* Sobre oscuro el tinte ACLARA el fondo, así que medir contra el fondo a
       pelo sería optimista. `tonoSobreOscuro` no compone, así que se le pasa el
       fondo ya compuesto. */
    ? tonoSobreOscuro(hex, componeTinte(hex, ALFA_TINTE, PANEL_OSCURO), 4.5)
    : tonoSobrePagina(hex, ALFA_TINTE)

  const trazo = superficie === 'oscura'
    ? tonoSobreOscuro(hex, PANEL_OSCURO, 3)
    : tonoSobreTinte(hex, 0, FONDO_PAGINA, 3)

  /* Sólo el quinto escalón se muda a relleno sólido. En los demás un relleno
     sólido robaría la jerarquía: si todo grita, nada grita. */
  const relleno = nivel === 'rojo_intenso'
    ? rellenoParaTextoClaro(hex, 1, 4.5)
    : null

  return {
    texto,
    trazo,
    tinte: `${hex}${Math.round(ALFA_TINTE * 255).toString(16).padStart(2, '0')}`,
    relleno,
    sobreRelleno: relleno ? textoSobreSolido(relleno) : null,
    etiqueta: ETIQUETA_NIVEL[nivel],
  }
}

/**
 * El tinte compuesto sobre un fondo, en hex.
 *
 * `componeSobre` de `lib/contraste.ts` hace esto mismo, pero su fondo por
 * omisión es la tarjeta oscura del tema viejo (`#082742`) y aquí el panel es
 * otro. Se pasa explícito para que no haya un fondo supuesto.
 */
function componeTinte(hex: string, alfa: number, fondoHex: string): string {
  const n = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16)
  const h = hex.replace('#', '')
  const f = fondoHex.replace('#', '')
  const mezcla = [0, 2, 4]
    .map(i => Math.round(n(h, i) * alfa + n(f, i) * (1 - alfa)))
    .map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
    .join('')
  return `#${mezcla}`
}

const CACHE = new Map<Superficie, Record<NivelSemaforo, Tono>>()

/** Los ocho niveles con sus tonos, ya calculados para esa superficie. */
export function tonosSla(superficie: Superficie): Record<NivelSemaforo, Tono> {
  const guardado = CACHE.get(superficie)
  if (guardado) return guardado
  const niveles = Object.keys(SEMILLA) as NivelSemaforo[]
  const r = Object.fromEntries(
    niveles.map(n => [n, tonoDe(n, superficie)]),
  ) as Record<NivelSemaforo, Tono>
  CACHE.set(superficie, r)
  return r
}

export function tonoSla(nivel: NivelSemaforo, superficie: Superficie): Tono {
  return tonosSla(superficie)[nivel] ?? tonosSla(superficie).cerrada
}

/** Las semillas, para el guión que mide. No se pintan nunca. */
export const SEMILLAS_SLA = SEMILLA
