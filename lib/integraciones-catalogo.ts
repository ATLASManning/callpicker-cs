/**
 * Catálogo autoritativo de integraciones — derivado del artículo de la Base de
 * Conocimiento, no copiado.
 *
 * Por qué existe: el 3 de septiembre de 2026, al cargar las plataformas del
 * glosario, Atlas respondió a "el cliente usa Pipedrive" describiendo una
 * "Integración con Pipedrive" que registra llamadas y crea contactos. La
 * integración existe, pero el catálogo la documenta como "Pipedrive (a través
 * de Zapier)" — y esa diferencia es el proyecto: implica Zapier de por medio,
 * con sus credenciales, sus límites y su costo. Atlas la describió como si
 * fuera nativa. El riesgo no es solo inventar una integración inexistente;
 * es describir mal el alcance de una que sí existe.
 *
 * La lista se lee del artículo `integraciones-catalogo-2026` en tiempo de
 * ejecución en lugar de duplicarse aquí: cuando Producto agregue o cambie una
 * plataforma, Atlas se entera sin que nadie toque este archivo.
 */
import { KB } from '@/app/base-cs/kb-data'

const ID_CATALOGO = 'integraciones-catalogo-2026'
/** Artículo previo, con plataformas que el catálogo 2026 no repite. */
const ID_OTRAS = 'integraciones-otras'

export interface IntegracionCatalogo {
  plataforma: string
  /** Alcance exacto de cada flujo documentado. */
  alcances:   string[]
  fuente:     string
}

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD')
    .split('').filter(c => { const x = c.codePointAt(0) ?? 0; return x < 0x0300 || x > 0x036f }).join('')
    .replace(/[^a-z0-9]/g, '')
}

let _cache: IntegracionCatalogo[] | null = null

/** Plataformas con integración documentada, con su alcance. */
export function catalogoIntegraciones(): IntegracionCatalogo[] {
  if (_cache) return _cache
  const out: IntegracionCatalogo[] = []

  for (const cat of KB) {
    for (const art of cat.articulos) {
      if (art.id === ID_CATALOGO) {
        for (const s of art.subtitulos ?? []) {
          out.push({ plataforma: s.titulo, alcances: s.items, fuente: 'Catálogo de Integraciones 2026' })
        }
      }
      if (art.id === ID_OTRAS) {
        // Formato "Plataforma — alcance" dentro de una sola lista.
        for (const s of art.subtitulos ?? []) {
          for (const item of s.items) {
            const [nombre, ...resto] = item.split('—')
            const plataforma = nombre.trim()
            if (!plataforma) continue
            const ya = out.find(o => norm(o.plataforma) === norm(plataforma))
            if (ya) continue
            out.push({ plataforma, alcances: [resto.join('—').trim()], fuente: 'Otras Integraciones CRM' })
          }
        }
      }
    }
  }
  _cache = out
  return out
}

/**
 * Integración documentada para una plataforma, o `null`.
 *
 * El match es laxo en los dos sentidos porque el catálogo y el glosario no
 * usan el mismo nombre: "Sirena" en el glosario es "Get Sirena" y "Sirena App"
 * en la Base de Conocimiento.
 */
export function integracionDe(nombre: string): IntegracionCatalogo | null {
  const k = norm(nombre)
  if (k.length < 3) return null
  const cat = catalogoIntegraciones()
  return cat.find(c => {
    const n = norm(c.plataforma)
    return n === k || (n.length >= 4 && k.length >= 4 && (n.includes(k) || k.includes(n)))
  }) ?? null
}

/** Bloque para el contexto de Atlas: qué existe y la prohibición de inventar. */
export function seccionIntegraciones(): string {
  const cat = catalogoIntegraciones()
  return (
    `INTEGRACIONES DISPONIBLES — LISTA AUTORITATIVA (apartado Base de Conocimiento > Catálogo de Integraciones 2026 y Otras Integraciones CRM).\n` +
    `  REGLA DURA: esta lista es la ÚNICA fuente para afirmar que una integración existe. Si una plataforma NO aparece abajo, está PROHIBIDO decir que Callpicker se integra con ella, describir lo que "permitiría" hacer, o insinuar que existe. Di con esas palabras que no está en el catálogo y que habría que evaluarla como integración a la medida vía API, y ofrece confirmarlo con Producto.\n` +
    `  Tampoco amplíes el alcance: si el catálogo dice que solo registra llamadas, no digas que también sincroniza contactos ni que abre la ficha.\n` +
    `  Y NUNCA recortes el nombre de la plataforma: cuando trae un calificativo entre paréntesis —"Pipedrive (a través de Zapier)", "Upnify (antes SalesUP)"— ese calificativo ES el alcance del proyecto y debe decirse siempre. Omitir "a través de Zapier" convierte una integración que exige Zapier, con sus credenciales, límites y costo, en una nativa que no existe.\n` +
    cat.map(c => `  - ${c.plataforma}: ${c.alcances.join(' | ')}`).join('\n')
  )
}
