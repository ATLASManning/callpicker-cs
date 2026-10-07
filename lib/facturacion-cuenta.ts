import type { Cuenta } from '@/lib/types'

/**
 * lib/facturacion-cuenta.ts — EL IMPORTE DE UNA CUENTA, CON SU ORIGEN
 *
 * Instrucción de dirección, 6 oct 2026: «la información de facturación debes
 * tomarla de Gross Revenue Facturación, ahí está TODO; aquellos datos que no
 * tengas en las cuentas, de ahí tómala».
 *
 * ── POR QUÉ EL GRC Y NO LA VISTA EN VIVO DE ZOHO ─────────────────────────
 *
 * Porque el GRC trae NUESTRO CID y la vista de Facturación no. Comprobado: el
 * campo `CID` de esa vista es el identificador interno de Zoho —valores como
 * `165180000039499223`—, no el CID corto de la cartera. El único puente que
 * queda con esa vista es el NOMBRE de la empresa, y de hecho así es como el
 * panel de la ficha encuentra a cada cliente, con coincidencias por palabras
 * sueltas que el propio código advierte que son imprecisas.
 *
 * Cruzar por nombre mezcla cuentas; ya pasó con los DIDs. El GRC cruza por CID
 * y no se equivoca. Ver [[dids-fuente]] y [[grc-fuente-zoho]].
 *
 * ── CÓMO SE SUMA UNA CUENTA ──────────────────────────────────────────────
 *
 * Un CID puede tener varias filas. `scripts/gen-grc-zoho.py` marca `agrupada`
 * en las líneas que dirección confirmó que son la MISMA empresa y colgó del CID
 * padre —«Odontoprev ATC», «Gas Economico Metropolitano Chat», «lunasoft.net»—.
 * El importe de la cuenta es la SUMA de todas sus filas: eso es lo que factura
 * ese cliente. Tomar sólo la principal dejaría fuera dinero real; tomar sólo la
 * mayor, lo mismo.
 *
 * Se usa `mrrFin` y no `mrrIni`: es el MRR al cierre del periodo medido, o sea
 * el vigente. En una fila de Downgrade, `ini` 32,758 y `fin` 25,313 — el bueno
 * es `fin`.
 *
 * ── LO QUE NO SE PUEDE MEDIR SE DICE ─────────────────────────────────────
 *
 * Diez cuentas vivas no tienen importe en ninguna fuente. Devuelven
 * `origen: 'sin_dato'` y quien las pinte tiene que escribir que no se sabe, NO
 * un cero: un cero se lee como «no vale nada» y son cuentas que facturan.
 * Ver [[feedback-cero-sin-medicion]].
 */

export type OrigenImporte = 'cuentas' | 'grc' | 'sin_dato'

export interface ImporteCuenta {
  mrr: number
  origen: OrigenImporte
  /** Cuántas filas del GRC se sumaron, cuando el origen es `grc`. */
  filas?: number
  /** De esas, cuántas son líneas agrupadas a este CID. */
  agrupadas?: number
}

interface FilaGrc { cid?: string | number | null; mrrFin?: number | null; agrupada?: boolean }

export interface MapaFacturacion {
  porCid: Map<string, { mrr: number; filas: number; agrupadas: number }>
  mes: string
  /** Por qué el mapa salió vacío, cuando salió vacío. Un respaldo que no
   *  carga tiene que DECIRLO: si no, cada cuenta sin importe parece una cuenta
   *  sin dato, y el fallo se confunde con el hallazgo. */
  falla: string | null
}

/* El archivo no cambia entre peticiones y leerlo cuesta; se cachea igual que
   los cortes, con carga en vuelo compartida para que un Promise.all sobre las
   192 cuentas no dispare 192 lecturas. */
let _cache: MapaFacturacion | null = null
let _cacheTime = 0
let _cargando: Promise<MapaFacturacion> | null = null
const CACHE_TTL = 5 * 60 * 1000

async function leer(): Promise<MapaFacturacion> {
  const porCid = new Map<string, { mrr: number; filas: number; agrupadas: number }>()
  let mes = ''
  let falla: string | null = null
  try {
    /* ── SE IMPORTA, NO SE LEE DEL DISCO ────────────────────────────────
     *
     * La primera versión hacía `readFileSync(path.join(process.cwd(), 'data',
     * 'grc-zoho.json'))` —igual que `/api/grc`, que funciona— y en producción
     * devolvía un mapa vacío: «No se encontró data/grc-zoho.json
     * (cwd=/var/task)». El archivo SÍ se despliega; lo que pasa es que el
     * trazador de Next decide qué ficheros viajan con cada lambda leyendo el
     * código, y una ruta que se arma en tiempo de ejecución no se puede
     * seguir. La ruta `/api/grc` sí lo lleva; la de alertas, no.
     *
     * Con un import de especificador literal, webpack lo empaqueta DENTRO del
     * bundle y deja de depender de dónde quedó el disco. Cuesta 1.2 MB en la
     * lambda y a cambio no vuelve a fallar en silencio por una ruta.
     *
     * Vale también para la portada, que es componente de servidor y monta el
     * panel de alertas en el primer render. */
    const mod = await import('@/data/grc-zoho.json')
    const json = ((mod as { default?: unknown }).default ?? mod) as
      { meta?: { mesVivo?: string }; filas?: FilaGrc[] }
    mes = json.meta?.mesVivo ?? ''
    for (const f of json.filas ?? []) {
      if (f.cid === null || f.cid === undefined) continue
      const cid = String(f.cid).trim()
      if (!cid) continue
      const prev = porCid.get(cid) ?? { mrr: 0, filas: 0, agrupadas: 0 }
      prev.mrr += f.mrrFin ?? 0
      prev.filas += 1
      if (f.agrupada) prev.agrupadas += 1
      porCid.set(cid, prev)
    }
    if (porCid.size === 0) falla = 'El archivo se leyó pero no trae filas con CID'
  } catch (e) {
    /* Un GRC ilegible no puede tumbar el tablero, pero tampoco puede callarse:
       se devuelve el mapa vacío CON el motivo. */
    falla = (e as Error)?.message ?? 'error leyendo data/grc-zoho.json'
  }
  _cache = { porCid, mes, falla }
  _cacheTime = Date.now()
  return _cache
}

export async function mapaFacturacion(): Promise<MapaFacturacion> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache
  if (_cargando) return _cargando
  _cargando = leer().finally(() => { _cargando = null })
  return _cargando
}

/**
 * El importe mensual de una cuenta, diciendo de dónde salió.
 *
 * `tieneCorte` decide si se respeta lo que ya trae la ficha. La regla que pidió
 * dirección es que el GRC manda **cuando a la cuenta le falta el dato**: o
 * porque no aparece en el archivo de cortes, o porque su `facturacion` viene en
 * cero. Donde hay corte y hay importe, no se toca: cambiarlo por cambiarlo
 * dejaría dos cifras del mismo concepto conviviendo en el tablero.
 */
export function importeDeCuenta(
  cuenta: { cid?: string | number | null; facturacion?: number | null },
  mapa: MapaFacturacion,
): ImporteCuenta {
  const propio = cuenta.facturacion ?? 0
  const cid = cuenta.cid === null || cuenta.cid === undefined
    ? null : String(cuenta.cid).trim()
  const g = cid ? mapa.porCid.get(cid) : undefined
  if (g && g.mrr > 0) {
    return { mrr: g.mrr, origen: 'grc', filas: g.filas, agrupadas: g.agrupadas }
  }
  if (propio > 0) return { mrr: propio, origen: 'cuentas' }
  return { mrr: 0, origen: 'sin_dato' }
}

/**
 * Resuelve el importe de una lista de cuentas. **Es la única puerta.**
 *
 * Nace de una contradicción que reportó dirección el 6 oct 2026: Tech People
 * salía con $86,737 en Alertas y con $55,098 en Cuentas y en Candidaturas.
 * Había tres reglas distintas conviviendo:
 *
 *   · Alertas      → el GRC por CID.
 *   · Cuentas/KPIs → `enrichCuentasWithZoho`, que sobreescribe `facturacion`
 *                    con una búsqueda DIFUSA por nombre (las dos primeras
 *                    palabras o el acrónimo) y SUMA todo lo que coincida.
 *   · La ficha     → el MRR del grupo de Zoho, también por nombre.
 *
 * Mientras existan tres reglas habrá tres cifras. Ahora hay una, y es la que
 * pidió dirección: **el MRR Final de Gross Revenue Facturación**, cruzado por
 * CID. Donde el GRC no tiene la cuenta se conserva lo que ya traía la ficha, y
 * donde no hay nada se dice que no se sabe.
 *
 * Medido al cambiarlo: 155 de 192 cuentas vivas mueven su importe y la cartera
 * pasa de $1,884,241 a $2,220,416. Los saltos grandes van en las dos
 * direcciones y el GRC está internamente limpio —todas «MRR estable», ini igual
 * a fin, sin pérdidas—: Tech People $59,423 → $86,737 (suma su línea agrupada),
 * GRUPO FRISA $1,622 → $17,909 (idem), y Grupo System ooapas $38,123 → $1,078.
 * Ese último además resuelve una rareza: una cuenta de $38,000 con consumo cero
 * era inexplicable; una de $1,078, no.
 */
export async function resolverImportes<T extends { cid?: string | number | null
                                                   facturacion?: number | null }>(
  cuentas: T[],
): Promise<T[]> {
  if (!cuentas.length) return cuentas
  const mapa = await mapaFacturacion()
  if (mapa.porCid.size === 0) return cuentas   // sin fuente, no se inventa nada
  return cuentas.map(c => {
    const i = importeDeCuenta(c, mapa)
    return i.origen === 'grc' ? { ...c, facturacion: i.mrr } : c
  })
}

/**
 * Rellena `facturacion` desde el GRC en las cuentas que la traen en cero.
 *
 * Es la versión para los consumidores que NO saben de cortes y que, aun así,
 * TOMAN DECISIONES con el importe. Una auditoría del 6 oct 2026 encontró que
 * `cuentas.facturacion` se lee en diecisiete sitios y que el respaldo aplicado
 * sólo en las alertas dejaba el mismo número distinto según la pantalla:
 *
 *   · `isTopAccount` en la generación de actividades usa el umbral de $3,000 y
 *     decide el CONTENIDO de la tarea semanal. Con el respaldo pasan de 143 a
 *     166 las cuentas que reciben la tarea de cuenta TOP: veintitrés cuentas
 *     —IMPAS entre ellas, con $65,640 al mes— estaban recibiendo la genérica.
 *   · `focosDeRiesgo` usa el importe para ordenar el lote del lunes.
 *
 * No se les pasa `tieneCorte` a propósito: aquí sólo se rellena lo que falta,
 * que es justo lo que pidió dirección —«aquellos datos que no tengas en las
 * cuentas, de ahí tómala»—. Lo que ya tiene número no se toca.
 */
export async function conImporteGrc<T extends { cid?: string | number | null
                                                facturacion?: number | null }>(
  cuentas: T[],
): Promise<T[]> {
  if (!cuentas.length) return cuentas
  const mapa = await mapaFacturacion()
  if (mapa.porCid.size === 0) return cuentas
  return cuentas.map(c => {
    if ((c.facturacion ?? 0) > 0) return c
    const cid = c.cid === null || c.cid === undefined ? null : String(c.cid).trim()
    const g = cid ? mapa.porCid.get(cid) : undefined
    return g && g.mrr > 0 ? { ...c, facturacion: g.mrr } : c
  })
}

/** Para los textos: «$12,345 al mes» o la frase que dice que no se sabe. */
export function textoImporte(i: ImporteCuenta): string {
  if (i.origen === 'sin_dato') return 'importe mensual no disponible en ninguna fuente'
  return '$' + Math.round(i.mrr).toLocaleString('es-MX') + ' al mes'
}

export type { Cuenta }
