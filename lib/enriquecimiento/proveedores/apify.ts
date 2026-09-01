/**
 * Proveedor APIFY — ubicaciones físicas y datos de ficha pública (Google Maps).
 *
 * Sirve sobre todo para "No. de sitios": cuenta las ubicaciones que operan bajo
 * la misma marca y devuelve sus ciudades como evidencia. También aporta teléfono
 * publicado y categoría de negocio.
 *
 * ESTADO: código listo, credencial pendiente. Sin `APIFY_API_KEY` el proveedor
 * se reporta como no disponible y el motor sigue sin él (nunca inventa datos).
 * Actor sugerido: compass/crawler-google-places (4 GB — viable en plan FREE).
 */
import type { CuentaLectura, Hallazgo } from '../tipos'
import { normEmpresa, similitud } from '../normalizar'

export const NOMBRE = 'apify'
export const VERSION = '1.0.0'

const ACTOR   = process.env.APIFY_ACTOR_MAPS ?? 'compass~crawler-google-places'
const BASE    = 'https://api.apify.com/v2'
const TIMEOUT = 240_000   // el actor tarda 2-4 min

export function disponible(): boolean {
  return Boolean(process.env.APIFY_API_KEY)
}

interface Lugar {
  title?: string; address?: string; city?: string; phone?: string
  website?: string; categoryName?: string; totalScore?: number; reviewsCount?: number
  permanentlyClosed?: boolean
}

async function correrActor(busqueda: string, maxLugares = 20): Promise<Lugar[]> {
  const token = process.env.APIFY_API_KEY
  if (!token) return []

  const runRes = await fetch(
    `${BASE}/acts/${ACTOR}/runs?token=${encodeURIComponent(token)}&waitForFinish=180`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchStringsArray: [busqueda],
        maxCrawledPlacesPerSearch: maxLugares,
        language: 'es',
        countryCode: 'mx',
        skipClosedPlaces: true,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    },
  )
  if (!runRes.ok) throw new Error(`Apify run HTTP ${runRes.status}`)

  const run = await runRes.json() as { data?: { defaultDatasetId?: string; status?: string } }
  const dsId = run.data?.defaultDatasetId
  if (!dsId || run.data?.status !== 'SUCCEEDED') {
    throw new Error(`Apify run sin resultados (estado ${run.data?.status ?? 'desconocido'})`)
  }

  const dsRes = await fetch(
    `${BASE}/datasets/${dsId}/items?token=${encodeURIComponent(token)}&format=json&limit=${maxLugares}`,
    { signal: AbortSignal.timeout(60_000) },
  )
  if (!dsRes.ok) throw new Error(`Apify dataset HTTP ${dsRes.status}`)
  return await dsRes.json() as Lugar[]
}

export async function buscar(cuenta: CuentaLectura): Promise<Hallazgo[]> {
  if (!disponible()) return []

  const marca = normEmpresa(cuenta.empresa)
  if (marca.length < 4) return []   // nombre demasiado genérico para buscar por marca

  const lugares = await correrActor(`${cuenta.empresa} México`)
  // Solo ubicaciones cuyo nombre se parece de verdad a la marca: evita traer
  // negocios homónimos o vecinos irrelevantes.
  const propios = lugares.filter(l =>
    !l.permanentlyClosed && similitud(normEmpresa(l.title ?? ''), marca) >= 0.6)
  if (!propios.length) return []

  const out: Hallazgo[] = []
  const url = `https://www.google.com/maps/search/${encodeURIComponent(cuenta.empresa)}`
  const ciudades = Array.from(new Set(propios.map(l => l.city).filter(Boolean))) as string[]

  if (propios.length > 1) {
    out.push({
      campo: 'num_oficinas',
      valor: String(propios.length),
      fuente_tipo: 'apify',
      fuente_nombre: `Apify · ${ACTOR}`,
      fuente_url: url,
      evidencia: `${propios.length} ubicaciones activas con el nombre de la marca` +
                 (ciudades.length ? ` en: ${ciudades.slice(0, 12).join(', ')}` : ''),
      corroboraciones: 1,
      // Maps puede omitir sitios sin ficha: es un piso, no un total exacto.
      estado_verificacion: 'probable',
    })
  }

  const tel = propios.find(l => l.phone)?.phone
  if (tel) {
    out.push({
      campo: 'telefono_corporativo', valor: tel,
      fuente_tipo: 'apify', fuente_nombre: `Apify · ${ACTOR}`, fuente_url: url,
      evidencia: `Teléfono publicado en la ficha de "${propios.find(l => l.phone)?.title}"`,
      corroboraciones: 1,
    })
  }

  const cat = propios.find(l => l.categoryName)?.categoryName
  if (cat) {
    out.push({
      campo: 'giro', valor: cat,
      fuente_tipo: 'apify', fuente_nombre: `Apify · ${ACTOR}`, fuente_url: url,
      evidencia: `Categoría de negocio declarada en la ficha pública: "${cat}"`,
      corroboraciones: 1,
    })
  }

  const web = propios.find(l => l.website)?.website
  if (web) {
    out.push({
      campo: 'pagina_web', valor: web,
      fuente_tipo: 'apify', fuente_nombre: `Apify · ${ACTOR}`, fuente_url: url,
      evidencia: `Sitio declarado en la ficha pública de la ubicación.`,
      corroboraciones: 1,
    })
  }

  return out
}
