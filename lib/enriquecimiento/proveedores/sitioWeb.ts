/**
 * Proveedor SITIO WEB OFICIAL.
 *
 * Descarga la home y, como mucho, tres páginas internas relevantes (contacto,
 * nosotros, sucursales). Reglas de convivencia que NO se negocian:
 *   · un request por segundo por host, timeout de 12 s, máximo 4 páginas;
 *   · ante 401/403/429 se detiene y se marca la fuente como bloqueada — no se
 *     reintenta ni se busca rodeo (caso real: chevroletaragon.com.mx da 403);
 *   · User-Agent identificable.
 */
import type { CuentaLectura, Hallazgo } from '../tipos'
import { extraerEmails, extraerTelefonos, dominioCanonico, esValorReal } from '../normalizar'

export const NOMBRE = 'sitio_web'
export const VERSION = '1.0.0'

const UA = 'CallpickerCS-Enrichment/1.0 (+contacto: josel@callpicker.com)'
const TIMEOUT_MS = 12_000
const MAX_PAGINAS = 4
const PAUSA_MS = 1_000

export interface PaginaDescargada { url: string; texto: string; bloqueada?: boolean; status?: number }

const pausa = (ms: number) => new Promise(r => setTimeout(r, ms))

/** HTML → texto plano suficiente para extraer datos, sin dependencias. */
export function htmlATexto(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&aacute;/gi,'á').replace(/&eacute;/gi,'é').replace(/&iacute;/gi,'í')
    .replace(/&oacute;/gi,'ó').replace(/&uacute;/gi,'ú').replace(/&ntilde;/gi,'ñ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function descargar(url: string): Promise<PaginaDescargada> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: ctrl.signal,
    })
    if ([401, 403, 429].includes(res.status)) {
      return { url, texto: '', bloqueada: true, status: res.status }
    }
    if (!res.ok) return { url, texto: '', status: res.status }
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html')) return { url, texto: '', status: res.status }
    return { url, texto: htmlATexto(await res.text()), status: res.status }
  } catch {
    return { url, texto: '', status: 0 }
  } finally {
    clearTimeout(t)
  }
}

/** Rutas internas que suelen concentrar la información de negocio. */
const RUTAS = ['/contacto', '/nosotros', '/sucursales', '/quienes-somos', '/contact']

export async function descargarSitio(dominio: string): Promise<PaginaDescargada[]> {
  const host = dominioCanonico(dominio)
  if (!host) return []
  const paginas: PaginaDescargada[] = []

  const home = await descargar(`https://${host}`)
  paginas.push(home)
  if (home.bloqueada || !home.texto) return paginas   // respetamos el bloqueo

  // Solo seguimos rutas que la home menciona, para no golpear a ciegas
  const enHome = RUTAS.filter(r => home.texto.toLowerCase().includes(r.replace(/\//g, '')))
  for (const ruta of enHome.slice(0, MAX_PAGINAS - 1)) {
    await pausa(PAUSA_MS)
    const p = await descargar(`https://${host}${ruta}`)
    if (p.bloqueada) break
    if (p.texto) paginas.push(p)
  }
  return paginas
}

/* ── Extractores ─────────────────────────────────────────────────────────── */

/** Palabras que delatan que la cifra NO es la plantilla propia de la empresa.
 *  Caso real del piloto: Velfare publica "más de 5000 colaboradores están
 *  mejorando su calidad de vida" — son empleados de sus CLIENTES. */
const CONTEXTO_AJENO = /(client|usuari|beneficiari|atendemos|alcanz|impact|particip|asegurad|afiliad|miembro|paciente|alumno|viaj|grupo|reserva|cupo|capacidad|asistente|invitado|pasajero)/i

/**
 * Quita del texto todo lo que parezca teléfono ANTES de buscar cifras.
 * Caso real del piloto: "(55) 54 82 82 82 Sucursales Mundo Joven" producía
 * "82 sucursales" — el número salía del teléfono pegado a la palabra.
 */
export function sinTelefonos(texto: string): string {
  return texto
    // Un teléfono es un grupo inicial seguido de DOS o más grupos de dígitos;
    // el cuantificador debe consumirlos todos o queda residuo ("… 82 Sucursales").
    .replace(/\+?\(?\d{2,3}\)?(?:[\s.·-]?\d{2,4}){2,}/g, ' ')
    .replace(/\+\d[\d\s.-]{7,}/g, ' ')
}

export interface EmpleadosDetectados { valor: string; evidencia: string; rechazado?: string }

export function extraerEmpleados(texto: string): EmpleadosDetectados | null {
  const frases = texto.split(/[.\n]/)
  // "personas" solo cuenta si la frase la ancla explícitamente a la plantilla;
  // suelta significa cualquier cosa ("viajas más de 10 personas").
  const RX_PLANTILLA = /(?:somos|contamos con|plantilla de|equipo de|n[oó]mina de|m[aá]s de)?\s*(\d[\d,]{1,6})\s*\+?\s*(empleados|colaboradores|trabajadores)/i
  const RX_PERSONAS  = /(?:somos|plantilla de|equipo de|n[oó]mina de)\s*(?:m[aá]s de\s*)?(\d[\d,]{1,6})\s*(personas)/i

  for (const f of frases) {
    if (/[¿?]/.test(f)) continue                    // preguntas de marketing, no datos
    const limpio = sinTelefonos(f)
    const m = limpio.match(RX_PLANTILLA) ?? limpio.match(RX_PERSONAS)
    if (!m) continue
    const frag = f.replace(/\s+/g, ' ').trim().slice(0, 200)
    if (CONTEXTO_AJENO.test(f)) {
      return { valor: '', evidencia: frag, rechazado: 'La cifra se refiere a personas de clientes/usuarios/grupos, no a la plantilla propia' }
    }
    // Una cifra que no parsea a un entero positivo es ruido de extraccion
    // (caso real: "000 trabajadores" salido de un numero partido).
    if (!(parseInt(m[1].replace(/,/g, ''), 10) > 0)) continue
    return { valor: `${m[1]} ${m[2].toLowerCase()}`, evidencia: frag }
  }
  return null
}

/** Sitios propios. Franquicias y distribuidores se reportan aparte: no son
 *  ubicaciones operativas propias (regla del alcance). */
export interface SitiosDetectados { valor: string; evidencia: string; nota?: string }

export function extraerSitios(texto: string): SitiosDetectados | null {
  const frases = texto.split(/[.\n]/)
  const RX = /(?:m[aá]s de\s*)?(\d[\d,]{0,4})\s*(sucursales|oficinas|tiendas|plantas|centros de distribuci[oó]n|puntos de venta)/i
  for (const f of frases) {
    // Los teléfonos se retiran primero: un "(55) 54 82 82 82" junto a la palabra
    // "Sucursales" hacía leer "82 sucursales".
    const m = sinTelefonos(f).match(RX)
    if (!m) continue
    // Misma validacion: sin entero positivo no hay dato (caso real: ", tiendas").
    if (!(parseInt(m[1].replace(/,/g, ''), 10) > 0)) continue
    const frag = f.replace(/\s+/g, ' ').trim().slice(0, 200)
    const franquicia = /franquicia|distribuidor|afiliad/i.test(f)
    return {
      valor: `${m[1]} ${m[2].toLowerCase()}`,
      evidencia: frag,
      nota: franquicia ? 'La fuente mezcla ubicaciones propias con franquicias o distribuidores' : undefined,
    }
  }
  return null
}

const GENERICOS_EMAIL = /^(no-?reply|noreply|postmaster|webmaster|abuse)@/i

export async function buscar(cuenta: CuentaLectura): Promise<{ hallazgos: Hallazgo[]; bloqueado: boolean; paginas: string[] }> {
  const dominio = esValorReal(cuenta.pagina_web) ? dominioCanonico(cuenta.pagina_web) : ''
  if (!dominio) return { hallazgos: [], bloqueado: false, paginas: [] }

  const paginas = await descargarSitio(dominio)
  const bloqueado = paginas.some(p => p.bloqueada)
  const utiles = paginas.filter(p => p.texto)
  if (!utiles.length) return { hallazgos: [], bloqueado, paginas: paginas.map(p => p.url) }

  const out: Hallazgo[] = []
  const base = { fuente_tipo: 'sitio_oficial' as const, fuente_nombre: `Sitio oficial ${dominio}` }

  for (const p of utiles) {
    // Correos corporativos publicados — NUNCA se proponen como contacto_email
    // de una persona: son buzones de la empresa.
    for (const email of extraerEmails(p.texto)) {
      if (GENERICOS_EMAIL.test(email)) continue
      if (!email.endsWith(dominio.replace(/^www\./, ''))) continue
      out.push({
        ...base, campo: 'email_corporativo', valor: email, fuente_url: p.url,
        evidencia: `Correo publicado en ${p.url}`, corroboraciones: 1,
      })
    }

    for (const tel of extraerTelefonos(p.texto).slice(0, 3)) {
      out.push({
        ...base, campo: 'telefono_corporativo', valor: tel, fuente_url: p.url,
        evidencia: `Teléfono publicado en ${p.url}`, corroboraciones: 1,
      })
    }

    const emp = extraerEmpleados(p.texto)
    if (emp?.valor) {
      out.push({
        ...base, campo: 'total_empleados', valor: emp.valor, fuente_url: p.url,
        evidencia: emp.evidencia, corroboraciones: 1,
      })
    }

    const sit = extraerSitios(p.texto)
    if (sit) {
      out.push({
        ...base, campo: 'num_oficinas', valor: sit.valor, fuente_url: p.url,
        evidencia: sit.nota ? `${sit.evidencia} — NOTA: ${sit.nota}` : sit.evidencia,
        corroboraciones: 1,
        estado_verificacion: sit.nota ? 'probable' : undefined,
      })
    }
  }

  // El dominio respondió: confirma el sitio oficial
  out.push({
    ...base, campo: 'pagina_web', valor: `https://${dominio}`,
    fuente_url: `https://${dominio}`,
    evidencia: `El dominio respondió correctamente (HTTP ${utiles[0].status}).`,
    corroboraciones: 1,
  })

  return { hallazgos: out, bloqueado, paginas: paginas.map(p => p.url) }
}
