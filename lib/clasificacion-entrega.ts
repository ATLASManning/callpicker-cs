import { REQUISITOS_FICHA } from '@/lib/requisitos-ficha'

/**
 * CUENTA o CLIENTE: el distintivo de cada activación
 * ===================================================
 *
 * La regla, tal como la dio dirección el 18 nov 2026:
 *
 *   > «Si hace falta información, dale el distintivo de **Cuenta**. Si está
 *   > completa la información en el apartado Cuentas, la clasificación será
 *   > **Cliente**.»
 *
 * Una **cuenta** es algo aprovisionado de lo que no sabemos lo suficiente para
 * sostener una conversación: el servicio está arriba, la ficha no. Un
 * **cliente** es una cuenta de la que el apartado Cuentas ya sabe lo necesario.
 *
 * ── QUÉ ES «COMPLETA», Y POR QUÉ NO LO DECIDO YO ─────────────────────────────
 *
 * «Completa» NO es una lista nueva. Es la que el sistema ya usa para encender
 * sus propias alarmas de ceguera, y se importa de donde vive:
 *
 *   - Los **tres campos críticos** de `REQUISITOS_FICHA` (`lib/requisitos-ficha.ts`,
 *     el mismo catálogo que usa el motor de alertas):
 *     giro, servicio contratado y fecha de alta. Son los que impiden escribir
 *     una auditoría; sin ellos no se puede opinar de la cuenta.
 *   - **Al menos un contacto** capturado — la condición de `sin_contactos`.
 *   - **Observaciones del KAM** — la condición de `sin_ficha`.
 *
 * Los dos requisitos OPCIONALES de esa lista (tamaño de empresa y notas) **no
 * degradan a Cuenta**: el propio catálogo dice que su ausencia no enciende
 * ninguna alerta por sí sola, y «una alerta que salta por un campo opcional es
 * una alerta que se aprende a cerrar sin leer». Si faltan, se nombran, pero no
 * cambian el distintivo.
 *
 * ── LO QUE NO SE PUEDE CONFUNDIR ─────────────────────────────────────────────
 *
 * Hay TRES razones distintas por las que una activación no es Cliente, y se
 * dicen aparte porque piden cosas distintas:
 *
 *   - `incompleta`  — la cuenta está en el apartado Cuentas y le faltan campos.
 *                     Es trabajo del asesor, y la lista dice cuáles y de quién.
 *   - `fuera`       — el CID no está en el apartado Cuentas. No es una ficha a
 *                     medias: es una cuenta que nadie gestiona desde CS, y son
 *                     la inmensa mayoría de las 2,820 activaciones.
 *   - `no_medido`   — no se pudo leer el apartado Cuentas. **No es «le falta
 *                     información»**: es que no lo sabemos. Pintar esto como
 *                     «Cuenta» convertiría una falla de la base en un juicio
 *                     sobre el trabajo de alguien. [[feedback-cero-sin-medicion]]
 */

/** La forma mínima de una fila de `cuentas` para poder clasificar. */
export interface FichaParaClasificar {
  id?: string | null
  cid?: string | null
  empresa?: string | null
  giro?: string | null
  servicio?: string | null
  activo_desde?: string | null
  tamano_empresa?: string | null
  notas?: string | null
  observaciones_kam?: string | null
  contactos_json?: unknown
}

export type Distintivo = 'cliente' | 'cuenta'
export type MotivoCuenta = 'incompleta' | 'fuera' | 'no_medido'

export interface Faltante {
  campo:    string
  etiqueta: string
  critico:  boolean
  dueno:    string
}

export interface Clasificacion {
  distintivo: Distintivo
  /** Sólo cuando el distintivo es `cuenta`. */
  motivo:     MotivoCuenta | null
  /** Lo que falta, con nombre y dueño. Vacío si no falta nada. */
  faltan:     Faltante[]
  /** Lo que falta pero NO degrada a Cuenta. Se nombra para la misma visita. */
  faltanOpcionales: Faltante[]
  /** Una línea, en palabras, para mostrar junto al distintivo. */
  porque:     string
}

function cuantosContactos(v: unknown): number {
  try {
    const arr = Array.isArray(v) ? v : (typeof v === 'string' && v ? JSON.parse(v) : [])
    return Array.isArray(arr) ? arr.length : 0
  } catch { return 0 }
}

const listar = (f: Faltante[]) =>
  f.map(x => `${x.etiqueta} (${x.dueno})`).join(', ')

/**
 * Clasifica una activación.
 *
 * @param ficha  la fila de `cuentas` con ese CID, `null` si no está en cartera,
 *               `undefined` si NO SE PUDO LEER. Los tres casos son distintos y
 *               se devuelven distintos.
 */
export function clasifica(ficha: FichaParaClasificar | null | undefined): Clasificacion {
  if (ficha === undefined) {
    return {
      distintivo: 'cuenta', motivo: 'no_medido', faltan: [], faltanOpcionales: [],
      porque: 'No se pudo leer el apartado Cuentas, así que NO está medido. '
            + 'Eso es distinto de que le falte información.',
    }
  }
  if (ficha === null) {
    return {
      distintivo: 'cuenta', motivo: 'fuera', faltan: [], faltanOpcionales: [],
      porque: 'No está en el apartado Cuentas: es una cuenta activada que no '
            + 'se gestiona desde CS. Para que sea Cliente tiene que existir ahí '
            + 'primero.',
    }
  }

  /* Los requisitos salen del catálogo del motor. Si alguien añade uno allá,
     esta clasificación lo exige automáticamente. */
  const deCatalogo = REQUISITOS_FICHA.map(r => ({
    campo: r.campo, etiqueta: r.etiqueta, critico: r.critico, dueno: r.dueno,
    hay: r.hay(ficha),
  }))

  const faltanCriticos = deCatalogo.filter(r => r.critico && !r.hay)
    .map(({ campo, etiqueta, critico, dueno }) => ({ campo, etiqueta, critico, dueno }))
  const faltanOpcionales = deCatalogo.filter(r => !r.critico && !r.hay)
    .map(({ campo, etiqueta, critico, dueno }) => ({ campo, etiqueta, critico, dueno }))

  const faltan: Faltante[] = [...faltanCriticos]
  if (cuantosContactos(ficha.contactos_json) === 0) {
    faltan.push({ campo: 'contactos_json', etiqueta: 'al menos un contacto',
                  critico: true, dueno: 'el asesor' })
  }
  if (!(ficha.observaciones_kam ?? '').trim()) {
    faltan.push({ campo: 'observaciones_kam', etiqueta: 'observaciones del KAM',
                  critico: true, dueno: 'el asesor' })
  }

  if (faltan.length) {
    return {
      distintivo: 'cuenta', motivo: 'incompleta', faltan, faltanOpcionales,
      porque: `Está en el apartado Cuentas, pero le falta: ${listar(faltan)}.`
            + (faltanOpcionales.length
                ? ` Y de paso, sin degradarla: ${listar(faltanOpcionales)}.`
                : ''),
    }
  }

  return {
    distintivo: 'cliente', motivo: null, faltan: [], faltanOpcionales,
    porque: 'Su ficha en el apartado Cuentas está completa: giro, servicio, '
          + 'fecha de alta, contactos y observaciones del KAM.'
          + (faltanOpcionales.length
              ? ` Falta, sin degradarla: ${listar(faltanOpcionales)}.`
              : ''),
  }
}

/** Los campos de `cuentas` que hay que pedir para poder clasificar. */
export const CAMPOS_CLASIFICACION =
  'id, cid, empresa, giro, servicio, activo_desde, tamano_empresa, notas, ' +
  'observaciones_kam, contactos_json'
