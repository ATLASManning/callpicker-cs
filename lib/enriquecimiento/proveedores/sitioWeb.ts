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
const CONTEXTO_AJENO = /(client|usuari|beneficiari|atendemos|alcanz|impact|particip|asegurad|afiliad|miembros|pacientes|alumnos|viajeros)/i

export interface EmpleadosDetectados { valor: string; evidencia: string; rechazado?: string }

export function extraerEmpleados(texto: string): EmpleadosDetectados | null {
  const frases = texto.split(/[.\n]/)
  const RX = /(?:somos|contamos con|plantilla de|equipo de|m[aá]s de)?\s*([\d,]{2,7})\s*(?:\+)?\s*(empleados|colaboradores|trabajadores|personas)/i
  for (const f of frases) {
    const m = f.match(RX)
    if (!m) continue
    const frag = f.replace(/\s+/g, ' ').trim().slice(0, 200)
    if (CONTEXTO_AJENO.test(f)) {
      return { valor: '', evidencia: frag, rechazado: 'La cifra se refiere a personas de clientes/usuarios, no a la plantilla propia' }
    }
    return { valor: `${m[1]} ${m[2].toLowerCase()}`, evidencia: frag }
  }
  return null
}

/** Sitios propios. Franquicias y distribuidores se reportan aparte: no son
 *  ubicaciones operativas propias (regla del alcance). */
export interface SitiosDetectados { valor: string; evidencia: string; nota?: string }

export function extraerSitios(texto: string): SitiosDetectados | null {
  const frases = texto.split(/[.\n]/)
  const RX = /(?:m[aá]s de\s*)?([\d,]{1,5})\s*(sucursales|oficinas|tiendas|plantas|centros de distribuci[oó]n|puntos de venta)/i
  for (const f of frases) {
    const m = f.match(RX)
    if (!m) continue
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
