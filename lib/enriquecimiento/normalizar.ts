/**
 * Normalización para COMPARAR. Nunca para escribir.
 *
 * Todas estas funciones producen una forma canónica que sirve para decidir si
 * un candidato coincide, complementa o contradice al dato del KAM. El valor que
 * se muestra y se guarda como candidato es SIEMPRE el texto original tal como
 * lo publicó la fuente, y el del KAM queda intacto (regla no negociable).
 */
import { esValorReal } from '../valores'

/** Reexportado para que todo el módulo use el mismo criterio de "vacío" que el
 *  resto del dashboard — incluye el literal "0" que se usó como relleno. */
export { esValorReal }

export function normTexto(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Host canónico: sin protocolo, sin www, sin puerto, sin barra final. */
export function dominioCanonico(url: string | null | undefined): string {
  const raw = String(url ?? '').trim()
  if (!raw || !esValorReal(raw)) return ''
  const conProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    return new URL(conProto).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** URL canónica (protocolo + host + path sin barra final). */
export function urlCanonica(url: string | null | undefined): string {
  const host = dominioCanonico(url)
  if (!host) return ''
  const raw = String(url ?? '').trim()
  const conProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const u = new URL(conProto)
    const path = u.pathname.replace(/\/+$/, '')
    return `https://${host}${path}`
  } catch {
    return `https://${host}`
  }
}

/**
 * Teléfono a E.164 mexicano cuando se puede deducir con seguridad.
 * 10 dígitos → +52; 12 dígitos que empiezan en 52 → +52; ya en +… se respeta.
 * Si no se puede afirmar el país, devuelve solo los dígitos: preferimos un
 * valor honesto y comparable a inventar una lada.
 */
export function telefonoE164(tel: string | null | undefined): string {
  const raw = String(tel ?? '')
  if (!esValorReal(raw)) return ''
  const masPrefijo = raw.trim().startsWith('+')
  const d = raw.replace(/\D/g, '')
  if (!d) return ''
  if (masPrefijo)                       return `+${d}`
  if (d.length === 10)                  return `+52${d}`
  if (d.length === 12 && d.startsWith('52')) return `+${d}`
  if (d.length === 11 && d.startsWith('1'))  return `+${d}`   // NANP
  return d
}

const RX_EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi

export function emailNormalizado(email: string | null | undefined): string {
  const m = String(email ?? '').toLowerCase().match(RX_EMAIL)
  return m ? m[0] : ''
}

/** Extrae todos los correos de un texto libre (útil para el proveedor interno:
 *  hay fichas con el correo pegado dentro del nombre del contacto). */
export function extraerEmails(texto: string | null | undefined): string[] {
  const m = String(texto ?? '').match(RX_EMAIL)
  return m ? Array.from(new Set(m.map(x => x.toLowerCase()))) : []
}

/** Teléfonos de 10 dígitos en texto libre, tolerando separadores. */
export function extraerTelefonos(texto: string | null | undefined): string[] {
  const t = String(texto ?? '')
  const m = t.match(/(?:\+?52[\s-]?)?(?:\(?\d{2,3}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/g) ?? []
  const out = new Set<string>()
  for (const cand of m) {
    const d = cand.replace(/\D/g, '')
    if (d.length >= 10 && d.length <= 13) out.add(telefonoE164(cand))
  }
  return Array.from(out).filter(Boolean)
}

/** Razón social / marca sin sufijos societarios, para comparar nombres. */
export function normEmpresa(nombre: string | null | undefined): string {
  return normTexto(nombre)
    .replace(/\b(s a de c v|sa de cv|sapi de cv|s de rl de cv|srl|sa|sc|ac|inc|llc|ltd)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Similitud 0..1 por bigramas (Dice). Estable y sin dependencias. */
export function similitud(a: string, b: string): number {
  const x = normTexto(a), y = normTexto(b)
  if (!x || !y) return 0
  if (x === y) return 1
  if (x.length < 2 || y.length < 2) return x === y ? 1 : 0
  const bigramas = (s: string) => {
    const m = new Map<string, number>()
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2)
      m.set(g, (m.get(g) ?? 0) + 1)
    }
    return m
  }
  const ma = bigramas(x), mb = bigramas(y)
  let inter = 0, total = 0
  for (const n of Array.from(ma.values())) total += n
  for (const n of Array.from(mb.values())) total += n
  for (const [g, n] of Array.from(ma.entries())) inter += Math.min(n, mb.get(g) ?? 0)
  return (2 * inter) / total
}

/** Primer número entero que aparezca en un texto ("22 propias" → 22). */
export function primerEntero(texto: string | null | undefined): number | null {
  const m = String(texto ?? '').match(/\d[\d,]*/)
  if (!m) return null
  const n = parseInt(m[0].replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

/* ── Taxonomías ─────────────────────────────────────────────────────────────
 * Normalizan SOLO para comparar y agrupar. La denominación original del KAM
 * se conserva siempre en `valor_original_snapshot`.
 */

const TAMANOS: Array<[RegExp, string]> = [
  [/enterprise|corporativ/i,      'enterprise'],
  [/grande|large/i,               'grande'],
  [/median/i,                     'mediana'],
  [/peque|chica|small/i,          'pequeña'],
  [/micro/i,                      'micro'],
]

export function taxonomiaTamano(v: string | null | undefined): string {
  const s = String(v ?? '')
  if (!esValorReal(s)) return ''
  for (const [rx, out] of TAMANOS) if (rx.test(s)) return out
  return ''
}

/** Rango de empleados a etiqueta comparable. Acepta "51-200", "51–200 empleados",
 *  "150 empleados aproximadamente", "11-50". */
export function taxonomiaEmpleados(v: string | null | undefined): string {
  const s = String(v ?? '')
  if (!esValorReal(s)) return ''
  const nums = (s.match(/\d[\d,]*/g) ?? []).map(x => parseInt(x.replace(/,/g, ''), 10)).filter(Number.isFinite)
  if (!nums.length) return ''
  const alto = Math.max(...nums)
  if (alto <= 10)   return '1-10'
  if (alto <= 50)   return '11-50'
  if (alto <= 200)  return '51-200'
  if (alto <= 500)  return '201-500'
  if (alto <= 1000) return '501-1000'
  return '1000+'
}

const GIROS: Array<[RegExp, string]> = [
  [/farmac|medicament|salud|clinic|hospital|medic/i, 'salud_farmaceutica'],
  [/inmobili|desarrollo.*(residencial|comercial)|condos|real estate/i, 'inmobiliario'],
  [/automotr|concesionar|agencia de autos|chevrolet|seminuev/i, 'automotriz'],
  [/viaje|turismo|travel|agencia de viajes|hotel/i, 'turismo_viajes'],
  [/educa|colegio|universidad|escuela|prepa/i, 'educacion'],
  [/financ|credito|banc|seguros|fintech|prestam/i, 'financiero_seguros'],
  [/marketing|publicidad|agencia digital|medios/i, 'marketing_publicidad'],
  [/software|tecnolog|sistemas|it |ti |telecom|desarrollo de software/i, 'tecnologia'],
  [/transport|log[ií]stic|paqueter|fletes|mudanz/i, 'transporte_logistica'],
  [/manufactur|industrial|f[aá]brica|planta|acero|metal/i, 'manufactura_industrial'],
  [/construc|arquitect|ingenier[ií]a civil/i, 'construccion'],
  [/restaurant|aliment|taquer|panader|pasteler|bebida/i, 'alimentos_bebidas'],
  [/retail|tienda|comercio|venta de equipos|distribuidor|papeler/i, 'comercio_distribucion'],
  [/bienestar|wellness|recursos humanos|capital humano|n[oó]mina/i, 'bienestar_rrhh'],
  [/legal|abogad|jur[ií]dic|notar/i, 'legal'],
  [/seguridad|vigilancia|alarmas/i, 'seguridad'],
]

export function taxonomiaGiro(v: string | null | undefined): string {
  const s = String(v ?? '')
  if (!esValorReal(s)) return ''
  for (const [rx, out] of GIROS) if (rx.test(s)) return out
  return 'otros'
}

/** Clave de deduplicación: cuenta + campo + valor normalizado + host de la
 *  fuente. Reejecutar el proceso produce la misma clave → no duplica. */
export function dedupeKey(
  cuentaId: string, campo: string, valorNormalizado: string, fuenteUrl?: string | null,
): string {
  const host = dominioCanonico(fuenteUrl) || 'sin_url'
  return `${cuentaId}|${campo}|${valorNormalizado}|${host}`.toLowerCase()
}
