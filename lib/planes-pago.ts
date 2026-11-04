/**
 * lib/planes-pago.ts — LOS PLANES BASE Y SUS LIGAS DE PAGO, en un solo sitio.
 *
 * El crudo lo produce `scripts/gen-planes-pago.py` desde el libro «Planes 2.0»
 * (Google Sheet de comercial, hoja «Links Planes Base» cruzada con «PLANES»).
 * Aquí viven los tipos, las consultas y el bloque que lee Atlas, para que la
 * pantalla y el modelo digan exactamente lo mismo. Es el patrón de
 * `lib/integraciones-catalogo.ts`.
 *
 * ── POR QUÉ ESTE MÓDULO NO SE PARECE A LOS DEMÁS ──────────────────────────
 *
 * Porque una liga de pago es la única cosa de la Base de Conocimiento que un
 * asesor COPIA Y PEGA A UN CLIENTE. Un término del glosario mal recordado se
 * corrige en la siguiente frase; una liga mal recordada cobra otra cosa, o no
 * cobra nada, y el cliente se entera en su estado de cuenta.
 *
 * De ahí las tres reglas que atraviesan el archivo:
 *
 * 1. **La liga nunca se construye, se copia.** Todas tienen la misma forma
 *    (`/payments/select_payment_method/XXXXXXXXXX`) y ese parecido es
 *    exactamente lo que invita a completar una que falte. El código jamás
 *    arma una URL: o está en el JSON o no existe.
 * 2. **Un hueco se nombra.** «CE venta automática» no tiene liga mensual ni
 *    precio anual publicado. Eso NO es cero ni es «no aplica»: es un dato que
 *    la hoja no trae. [[feedback-cero-sin-medicion]]
 * 3. **Lo que esta hoja no cubre se dice.** Los seis planes de Conmutador IP
 *    y el de Callcenter existen en el documento y NO tienen liga de pago.
 *    Callar eso haría leer «30 planes» como «todo el catálogo».
 */
import crudo from '@/data/planes-pago.json'

export type EsquemaPlan = 'bolsa' | 'extension'

export interface PlanPago {
  id:       string
  esquema:  EsquemaPlan
  /** «CE», «CE con grabación» o «VyC», tal cual lo escribe la hoja de ligas. */
  familia:  string
  unidad:   'minutos' | 'extensiones'
  cantidad: number
  /** El nombre comercial de la hoja «PLANES» («Básico 60 min»), o `null` si
   *  ese plan no tiene columna allí. Los dos nombres conviven a propósito:
   *  el asesor oye «Emprendedor» de marketing y «CE 200» de la hoja. */
  etiquetaHoja:  string | null
  mensualidad:   number | null
  /** Promo 14x12: son 12 mensualidades por 14 meses de servicio. */
  anualidad:     number | null
  planIdMensual: string | null
  planIdAnual:   string | null
  ligaMensual:   string | null
  ligaAnual:     string | null
  folleto:       string | null
}

export interface MetaPlanesPago {
  origen:      string
  sheet:       string
  hojaLigas:   string
  hojaPrecios: string
  generado:    string
  total:       number
  bolsa:       number
  extension:   number
  conLigaMensual: number
  conLigaAnual:   number
  cruzadosConPrecios: number
  sinAnualidad:    string[]
  fueraDeEstaHoja: string[]
  avisos:          string[]
}

export const PLANES_PAGO  = crudo.planes as PlanPago[]
export const META_PLANES  = crudo.meta as MetaPlanesPago

/** Los dos bloques, en el orden en que los lee una persona. */
export const PLANES_BOLSA     = PLANES_PAGO.filter(p => p.esquema === 'bolsa')
export const PLANES_EXTENSION = PLANES_PAGO.filter(p => p.esquema === 'extension')

const pesos = (n: number | null): string =>
  n === null || n === undefined
    ? 'sin precio publicado'
    : new Intl.NumberFormat('es-MX',
        { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

/** «CE · 400 minutos», «CE · 1 extensión». El nombre con el que se le habla. */
export function nombrePlan(p: PlanPago): string {
  const u = p.cantidad === 1 ? (p.unidad === 'minutos' ? 'minuto' : 'extensión') : p.unidad
  return `${p.familia} · ${p.cantidad} ${u}`
}

/**
 * La promo 14x12, dicha con números en vez de con la etiqueta.
 *
 * «14x12» no se entiende sin desarrollarlo, y desarrollarlo mal es peor: la
 * anualidad **no** es más barata por mes de pago —es doce veces la mensualidad,
 * al centavo, comprobado en los 29 planes que cruzan—. Lo que se gana son DOS
 * MESES DE SERVICIO. Decir «ahorras un 17%» sería cierto por mes de servicio y
 * falso por importe, así que se dicen las dos cosas y no se resume.
 */
export function explicaAnualidad(p: PlanPago): string | null {
  if (p.anualidad === null || p.mensualidad === null) return null
  return `${pesos(p.anualidad)} al año = 12 × ${pesos(p.mensualidad)}, `
       + `y cubren 14 meses de servicio (promo 14x12).`
}

/**
 * El bloque que lee Atlas.
 *
 * `pregunta` decide si van las 30 ligas o sólo el mapa. La regla dura va en
 * las DOS capas: sin ella, una respuesta construida sobre el mapa —sin la
 * tabla delante— es justo el caso en que el modelo rellena la URL que le
 * falta, porque todas se parecen.
 */
export function seccionesPlanesPago(pregunta: string): { secciones: string[]; modulos: string[] } {
  const secciones: string[] = []
  const modulos: string[] = []

  const REGLA =
    `  REGLA DURA — LAS LIGAS DE PAGO NO SE CONSTRUYEN, SE COPIAN. Todas tienen la misma forma `
  + `(https://admin.callpicker.com/payments/select_payment_method/ + diez caracteres) y por eso es `
  + `fácil completar una inventando el final. Una liga inventada cobra otro plan o no cobra nada, y `
  + `el asesor se la manda al cliente creyendo que es la buena. Si la liga que te piden no está `
  + `ABAJO, LETRA POR LETRA, di que no la tienes y que se pide a comercial. Nunca la deduzcas de otra, `
  + `nunca la acortes, nunca la reescribas «limpia».\n`
  + `  TAMPOCO inventes el Plan ID: es el número con el que se da de alta en el admin y uno equivocado `
  + `contrata otra cosa.`

  const rango = (ps: PlanPago[], u: string) => {
    const cs = ps.map(p => p.cantidad).sort((a, b) => a - b)
    return `${cs[0]} a ${cs[cs.length - 1]} ${u}`
  }

  /* ── Capa 1: siempre. Qué existe, qué NO, y la prohibición. ───────────── */
  secciones.push(
    `PLANES BASE Y LIGAS DE PAGO (apartado Base de Conocimiento > Planes base y ligas de pago | `
    + `origen: Google Sheet «Planes 2.0», hoja «${META_PLANES.hojaLigas}» | corte del ${META_PLANES.generado}).\n`
    + `  Son ${META_PLANES.total} planes con liga de cobro: ${META_PLANES.bolsa} de bolsa de minutos `
    + `(${rango(PLANES_BOLSA, 'minutos')}) y ${META_PLANES.extension} por extensión `
    + `(${rango(PLANES_EXTENSION, 'extensiones')}), en las familias `
    + `${[...new Set(PLANES_PAGO.map(p => p.familia))].join(', ')}.\n`
    + `  ${META_PLANES.conLigaMensual} tienen liga de pago MENSUAL y ${META_PLANES.conLigaAnual} liga ANUAL.\n`
    + `  LA ANUALIDAD ES LA PROMO 14x12: se pagan 12 mensualidades (el importe anual es exactamente `
    + `12 × la mensualidad, comprobado en los ${META_PLANES.cruzadosConPrecios} planes que cruzan con la hoja de precios) `
    + `y se reciben 14 MESES DE SERVICIO. Lo que se gana son dos meses, NO un descuento sobre el importe: `
    + `no digas «ahorras un 17%» a secas, di las dos cosas.\n`
    + `  LO QUE ESTA HOJA NO CUBRE, y no es que no exista: ${META_PLANES.fueraDeEstaHoja.join(', ')}. `
    + `Esos planes están en el documento pero NO llevan liga de pago, así que no los cobres con liga: `
    + `se piden a comercial. Decir que «no existen» sería falso.\n`
    + `  LA HOJA NO DICE SI LOS PRECIOS LLEVAN IVA. No lo afirmes en ninguno de los dos sentidos: `
    + `si te lo preguntan, di que el documento no lo especifica.\n`
    + REGLA,
  )
  modulos.push('planes-pago')

  if (META_PLANES.sinAnualidad.length) {
    const huecos = PLANES_PAGO.filter(p => META_PLANES.sinAnualidad.includes(p.id))
    secciones.push(
      `HUECOS DECLARADOS EN LA HOJA DE PLANES (son datos que faltan, NO ceros ni «no aplica»):\n`
      + huecos.map(p =>
          `  - ${nombrePlan(p)} (${pesos(p.mensualidad)} al mes): `
          + `${p.ligaMensual ? '' : 'sin liga de pago mensual y '}sin precio anual publicado`
          + `${p.ligaAnual ? `, aunque SÍ trae liga de pago anual (${p.ligaAnual}) y Plan ID ${p.planIdAnual}` : ''}. `
          + `Si te preguntan el costo anual, di que la hoja no lo trae.`).join('\n'),
    )
  }

  /* Los avisos del generador. Son contradicciones del ORIGEN, no del código:
     entran al contexto para que Atlas no repita una etiqueta equivocada. */
  if (META_PLANES.avisos.length) {
    secciones.push(
      `AVISOS SOBRE EL ORIGEN (${META_PLANES.avisos.length}) — dilos si el tema sale, no los escondas:\n`
      + META_PLANES.avisos.map(a => `  - ${a}`).join('\n'),
    )
    modulos.push('planes-pago:avisos')
  }

  /* ── Capa 2: la tabla con las ligas, sólo si la pregunta la pide. ─────── */
  const PIDE = /plan(es)?\b|precio|costo|cuesta|cuánto|cuanto|tarifa|liga|link|pago|cobr|contrat|renov|anualidad|mensualidad|paquete|bolsa de minutos|extensi/i
  if (PIDE.test(pregunta)) {
    const linea = (p: PlanPago) =>
      `  - ${nombrePlan(p)}`
      + `${p.etiquetaHoja ? ` (en la hoja de precios: «${p.etiquetaHoja}»)` : ''}`
      + ` | mensual ${pesos(p.mensualidad)}`
      + `${p.planIdMensual ? ` · Plan ID ${p.planIdMensual}` : ' · sin Plan ID mensual'}`
      + `${p.ligaMensual ? ` · ${p.ligaMensual}` : ' · SIN liga mensual'}`
      + ` | anual ${pesos(p.anualidad)}`
      + `${p.planIdAnual ? ` · Plan ID ${p.planIdAnual}` : ' · sin Plan ID anual'}`
      + `${p.ligaAnual ? ` · ${p.ligaAnual}` : ' · SIN liga anual'}`
      + `${p.folleto ? ` | folleto ${p.folleto}` : ''}`

    secciones.push(
      `TABLA COMPLETA DE PLANES BASE — ${META_PLANES.total} de ${META_PLANES.total}, ninguno omitido. `
      + `Es la ÚNICA fuente para una liga de pago o un Plan ID.\n`
      + `  BOLSA DE MINUTOS (${PLANES_BOLSA.length}):\n${PLANES_BOLSA.map(linea).join('\n')}\n`
      + `  POR EXTENSIÓN (${PLANES_EXTENSION.length}):\n${PLANES_EXTENSION.map(linea).join('\n')}\n`
      + REGLA,
    )
    modulos.push('planes-pago:tabla')
  }

  return { secciones, modulos }
}
