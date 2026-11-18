/**
 * CUENTA ≠ CLIENTE
 * ================
 *
 * Una **cuenta** es lo que se aprovisiona: una fila de la hoja de Activaciones
 * 2.0, con su ID (el CID). Es la unidad técnica.
 *
 * Un **cliente** es quien paga y quien recibe el servicio. Puede tener varias
 * cuentas. Es la unidad de negocio, y es la que importa cuando se habla de
 * entrega aceptada, de churn o de cartera.
 *
 * El tablero contaba 2,192 activaciones y las llamaba, de hecho, clientes. No
 * son lo mismo y la diferencia no es cosmética: si un cliente con cuatro
 * cuentas se va, el tablero de activaciones lo cuenta como cuatro altas y la
 * cartera lo cuenta como una baja.
 *
 * ── LO QUE ESTO ES, Y LO QUE NO ──────────────────────────────────────────────
 *
 * La hoja NO trae identificador de cliente. Sólo trae `Cliente`, un nombre
 * tecleado a mano. Agrupar por ese nombre es una **heurística declarada**, no
 * un hecho:
 *
 *   - **Parte de menos** cuando el mismo cliente está escrito de dos formas
 *     («Medexp» y «Medicall Expert» son la misma empresa y aquí salen como dos).
 *   - **Junta de más** si dos empresas distintas comparten un nombre genérico.
 *
 * Por eso la cifra se publica SIEMPRE con el método al lado, y la agrupación
 * fuerte —la que decide cartera, churn y facturación— sigue siendo por CID
 * contra `cuentas` y el GRC. Cruzar por nombre mezcla cuentas; aquí se hace a
 * propósito y acotado a una sola pregunta: cuántos clientes distintos hay
 * detrás de las activaciones.
 *
 * ── LOS NOMBRES QUE NO SON NOMBRES ───────────────────────────────────────────
 *
 * La hoja trae filas cuyo `Cliente` es un marcador `cpNNNNNN` —el propio número
 * de activación— porque el nombre nunca se capturó. Contarlos como clientes
 * distintos inflaría la cifra con un cliente ficticio por fila. Se apartan y se
 * dicen por su nombre: son nombre PENDIENTE, no clientes.
 */

/** Sufijos de razón social que no distinguen a una empresa de otra. */
const SUFIJOS = [
  'sa de cv', 'sa de c v', 's a de c v', 'sab de cv', 'sapi de cv',
  'srl de cv', 's de rl de cv', 's de rl', 'srl', 'sapi', 'sab',
  'sc', 'ac', 'sa', 'spr de rl', 'sas',
]

/** Un `Cliente` que es en realidad el número de activación, no un nombre. */
export function esMarcadorSinNombre(nombre: string): boolean {
  return /^cp\s*\d{4,}$/i.test(String(nombre ?? '').trim())
}

/**
 * La clave con la que dos filas se consideran el mismo cliente.
 *
 * Devuelve `''` cuando el nombre no sirve para agrupar (vacío o marcador), que
 * es distinto de devolver una clave rara: quien llama tiene que decidir qué
 * hace con los que no tienen nombre, no esconderlos en un cubo.
 */
export function claveCliente(nombre: string): string {
  const s = String(nombre ?? '').trim()
  if (!s || esMarcadorSinNombre(s)) return ''

  let k = s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.,;:"'`()[\]/\\|_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // El sufijo sólo se quita del FINAL: «SA» dentro del nombre puede ser parte
  // de la palabra, y recortarlo a ciegas junta empresas que no son la misma.
  for (const suf of SUFIJOS) {
    if (k.endsWith(' ' + suf)) { k = k.slice(0, -(suf.length + 1)).trim(); break }
  }
  return k
}

export interface ClienteAgrupado {
  clave:    string
  /** El nombre más largo de los que aparecen: el menos abreviado. */
  nombre:   string
  /** Todas las grafías con que la hoja escribe a este cliente. */
  grafias:  string[]
  /** Los IDs de activación (las cuentas) de este cliente. */
  cuentas:  string[]
}

export interface AgrupacionClientes {
  clientes:      ClienteAgrupado[]
  /** Cuentas cuyo `Cliente` es un marcador `cpNNNNNN`: nombre PENDIENTE. */
  sinNombre:     string[]
  /** Cuentas sin ningún nombre de cliente en la hoja. */
  sinDato:       string[]
}

/**
 * Agrupa cuentas (id + nombre de cliente) en clientes.
 *
 * No inventa: lo que no tiene nombre sale aparte y contado, nunca repartido
 * entre los que sí lo tienen ni fundido en un cubo «otros» mudo.
 */
export function agrupaClientes(
  cuentas: Array<{ id: string; cliente: string }>,
): AgrupacionClientes {
  const mapa = new Map<string, { grafias: Map<string, number>; cuentas: Set<string> }>()
  const sinNombre: string[] = []
  const sinDato:   string[] = []

  for (const c of cuentas) {
    const nombre = String(c.cliente ?? '').trim()
    if (!nombre)                  { sinDato.push(c.id);   continue }
    if (esMarcadorSinNombre(nombre)) { sinNombre.push(c.id); continue }

    const k = claveCliente(nombre)
    if (!k) { sinDato.push(c.id); continue }

    let e = mapa.get(k)
    if (!e) { e = { grafias: new Map(), cuentas: new Set() }; mapa.set(k, e) }
    e.grafias.set(nombre, (e.grafias.get(nombre) ?? 0) + 1)
    e.cuentas.add(c.id)
  }

  const clientes: ClienteAgrupado[] = Array.from(mapa.entries()).map(([clave, e]) => {
    const grafias = Array.from(e.grafias.keys())
    /* Se muestra la grafía MÁS LARGA, que es la menos abreviada: entre
       «Medexp» y «Medicall Expert», la segunda. Quedarse con la primera que
       llegó dejaría el nombre a merced del orden de las filas. */
    const nombre = grafias.slice().sort((a, b) => b.length - a.length)[0]
    return { clave, nombre, grafias, cuentas: Array.from(e.cuentas) }
  })

  clientes.sort((a, b) =>
    b.cuentas.length - a.cuentas.length || a.nombre.localeCompare(b.nombre, 'es'))

  return { clientes, sinNombre, sinDato }
}
