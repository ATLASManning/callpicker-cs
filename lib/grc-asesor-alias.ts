/**
 * Nombres de GRC que pertenecen a una cuenta de la cartera con OTRO nombre.
 *
 * POR QUÉ HACE FALTA
 * ------------------
 * El export de GRC viene de Zoho Analytics SIN CID, así que la única llave
 * posible contra la cartera es el nombre. Y los nombres no coinciden: GRC
 * factura por línea o por sucursal —«GTC - TLALPAN», «Finsus Cobranza»,
 * «Salud y Hogar - USA»— mientras la cartera lleva una sola fila por cliente.
 * El resultado era que la concentración de Churn AAA/AA daba por «sin asesor»
 * cuentas que sí tienen dueño.
 *
 * POR QUÉ ES UNA TABLA A MANO Y NO UN ALGORITMO
 * ---------------------------------------------
 * Porque el parecido de nombres se equivoca y no avisa. Sobre estos mismos
 * datos, un cruce por parecido propone «ADSA» ≈ «TATSA» con 0.67 — son dos
 * empresas distintas. Ya pasó antes con el enriquecimiento de facturación:
 * catorce filas del export se llamaban casi igual que una cuenta, dirección
 * las revisó una por una y trece eran la misma empresa pero «Justo Etiquetas»
 * NO (ver el dict MISMA_CUENTA de scripts/gen-grc-zoho.py). Una regla
 * automática habría inventado la atribución de nueve fichas.
 *
 * Así que aquí solo entra lo CONFIRMADO, con quién lo confirmó y cuándo. Lo
 * que se parece pero nadie ha confirmado NO se asigna: la pantalla lo muestra
 * aparte, como pendiente de revisar, y no lo suma a ningún asesor.
 *
 * CÓMO AGREGAR UNO
 * ----------------
 * Con `cuenta` cuando el cliente SÍ está en la cartera: el asesor se lee de
 * ella y sigue vivo, así que si la cuenta cambia de dueño el alias lo sigue.
 * Con `asesor` solo cuando NO hay cuenta que apuntar — eso congela el dato y
 * hay que revisarlo si alguien se mueve de cartera.
 */

export type ReglaAlias = {
  /** Nombre de GRC en minúsculas y sin acentos. Ver `claveAlias`. */
  patron: string
  /** 'exacto' = ese nombre. 'grupo' = ese nombre y todo lo que cuelgue de él. */
  tipo: 'exacto' | 'grupo'
  /** Nombre EXACTO de la cuenta en `cuentas`. Preferir siempre esto. */
  cuenta?: string
  /** Asesor, solo cuando no hay cuenta a la que apuntar. */
  asesor?: string
  /** Quién lo confirmó y cuándo. Sin esto, la regla no debería existir. */
  nota: string
}

/** Minúsculas, sin acentos, espacios colapsados. Conserva los espacios para
 *  poder distinguir un grupo («gtc») de una palabra que lo contenga. */
export function claveAlias(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export const ALIAS_GRC: ReglaAlias[] = [
  {
    patron: 'gtc', tipo: 'grupo', asesor: 'Dan',
    nota: 'Dirección, 22 sep 2026: «todas las GTC son de DAN». Son 17 líneas en '
        + 'GRC (TLALPAN, LA JOYA, CARRANZA, LOMAS, BMW, INFINITI…) y ninguna '
        + 'tiene fila propia en `cuentas`, por eso va por asesor y no por cuenta.',
  },
  {
    patron: 'finsus', tipo: 'grupo', cuenta: 'Finsus Growth',
    nota: 'Dirección, 22 sep 2026: «Finsus es Fátima». GRC lo parte en «Finsus '
        + 'Growth» y «Finsus Cobranza»; la cartera solo tiene F1 Finsus Growth. '
        + 'Se apunta a esa cuenta para que el asesor siga vivo.',
  },
  {
    patron: 'petroil', tipo: 'grupo', cuenta: 'Petroil - Corp de Estaciones',
    nota: 'Dirección, 22 sep 2026: «Petroil - Torre de Control, Petroil - Corp de '
        + 'Estaciones e incluso Oceánica son del mismo Grupo; Grupo Petroil debe '
        + 'atenderlas Dan». GRC lo parte en cinco líneas (Centro de Ayuda TI, Colosio '
        + 'Mzt, GASCYTSA, Prebiem Oceanica, Torre de Control) y solo dos tienen cuenta '
        + 'propia. Se apunta a F32 para que el asesor siga vivo. OJO: «Oceánica» NO '
        + 'entra por esta regla porque no empieza por «Petroil» — cruza sola contra su '
        + 'cuenta C54, que el 22 sep pasó también a Dan.',
  },
  {
    patron: 'prebiem', tipo: 'grupo', cuenta: 'Petroil - Corp de Estaciones',
    nota: 'Dirección, 22 sep 2026: «existe también una cuenta con el nombre de PREBIEM, '
        + 'es de Grupo Petroil» — «si algún día sale, ya sabes a quién corresponde». Al '
        + '22 sep NO existe como cuenta suelta en ninguna fuente: ni en `cuentas`, ni en '
        + 'los cortes, ni en GRC, ni en tickets. Solo aparece como ETIQUETA de dos '
        + 'números (CIDs 146201 y 148385), o sea una línea dentro del grupo. Esta regla '
        + 'queda puesta por adelantado: el día que Zoho la facture con nombre propio se '
        + 'atribuye sola, en vez de caer en «sin asesor» y tener que descubrirlo otra vez.',
  },
  {
    patron: 'hoteles y servicios', tipo: 'exacto', asesor: 'Dan',
    nota: 'Dirección, 22 sep 2026: «Hoteles y Servicios es de DAN». No hay cuenta '
        + 'con ese nombre en la cartera, así que la atribución es directa.',
  },
]

/**
 * Construye el resolutor nombre-de-GRC → asesor a partir de la cartera.
 *
 * Vive aquí para que la ruta `/api/churn/asesores` y la página de Asesores
 * usen LA MISMA resolución. Con dos copias, un día la carátula del asesor y la
 * concentración de GRC dirían cosas distintas sobre el mismo churn.
 *
 * Devuelve null cuando no se puede afirmar de quién es. Nunca adivina.
 */
export function construirResolutor(
  cuentas: Array<{ empresa: string; asesor?: string | null }>,
): (nombreGrc: string) => string | null {
  const porNombre: Record<string, string> = {}
  const ambiguos = new Set<string>()
  const porEmpresa: Record<string, string> = {}

  for (const c of cuentas) {
    if (!c.asesor) continue
    porEmpresa[c.empresa] = c.asesor
    const k = normalizaFuerte(c.empresa)
    if (!k) continue
    if (porNombre[k] && porNombre[k] !== c.asesor) { ambiguos.add(k); continue }
    porNombre[k] = c.asesor
  }
  ambiguos.forEach(k => { delete porNombre[k] })

  return (nombreGrc: string): string | null => {
    const directo = porNombre[normalizaFuerte(nombreGrc)]
    if (directo) return directo
    const r = reglaPara(nombreGrc)
    if (!r) return null
    if (r.cuenta) return porEmpresa[r.cuenta] ?? null   // la cuenta manda: sigue viva
    return r.asesor ?? null
  }
}

/** Sin acentos, sin espacios ni signos. Igual que `normalizarNombre`; se repite
 *  aquí para que este módulo no arrastre los datasets que importa elegibilidad. */
function normalizaFuerte(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/** ¿Alguna regla cubre este nombre de GRC? */
export function reglaPara(nombreGrc: string): ReglaAlias | null {
  const k = claveAlias(nombreGrc)
  if (!k) return null
  for (const r of ALIAS_GRC) {
    if (r.tipo === 'exacto') {
      if (k === r.patron) return r
    } else if (k === r.patron || k.startsWith(r.patron + ' ')) {
      return r
    }
  }
  return null
}
