/**
 * Proveedor MAPA DE DECISORES — personas publicadas por la propia empresa.
 *
 * Fuente única: páginas institucionales del sitio corporativo (equipo,
 * nosotros, dirección, contacto). Es la única que el alcance permite para
 * datos de personas: información de negocio que la empresa publica sobre sí
 * misma. NO se scrapea LinkedIn ni se elude ninguna autenticación.
 *
 * Reglas duras:
 *   · si no hay un nombre publicado, NO se inventa un contacto — se omite;
 *   · el correo solo se toma si aparece literalmente junto a la persona;
 *   · todo entra como `probable`: una página de equipo envejece, y el cargo
 *     publicado no siempre es el que decide la compra.
 */
import type { CuentaLectura, RolDecision, DecisorCandidato, EstadoVerificacion } from '../tipos'
import { extraerEmails, dominioCanonico, esValorReal, normTexto, dedupeKey } from '../normalizar'
import { descargarSitio, htmlATexto } from './sitioWeb'

export const NOMBRE = 'decisores'
export const VERSION = '1.0.0'

/** Cargos que importan, ordenados: el primero que coincida define el rol. */
const CARGOS: Array<{ rx: RegExp; rol: RolDecision; area: string }> = [
  { rx: /\b(ceo|director(a)? general|presidente|presidenta|fundador(a)?|due[ñn]o|socio director)\b/i,
    rol: 'decisor_economico', area: 'Dirección General' },
  { rx: /\b(cfo|director(a)? (de )?finanzas|director(a)? administrativ[oa]|contralor)\b/i,
    rol: 'decisor_economico', area: 'Finanzas' },
  { rx: /\b(cto|cio|director(a)? (de )?(ti|it|sistemas|tecnolog[ií]a|inform[aá]tica))\b/i,
    rol: 'decisor_tecnico', area: 'Tecnología' },
  { rx: /\b(gerente (de )?(ti|it|sistemas|tecnolog[ií]a|inform[aá]tica)|jefe (de )?sistemas|coordinador(a)? (de )?(ti|sistemas))\b/i,
    rol: 'decisor_tecnico', area: 'Tecnología' },
  { rx: /\b(vicepresidente|vp|director(a)? corporativ[oa]|director(a)? divisional)\b/i,
    rol: 'patrocinador_ejecutivo', area: 'Dirección Corporativa' },
  { rx: /\b(compras|adquisiciones|procurement|abastecimiento)\b/i,
    rol: 'comprador', area: 'Compras' },
  { rx: /\b(coo|director(a)? (de )?operaciones|gerente (de )?operaciones)\b/i,
    rol: 'influenciador', area: 'Operaciones' },
  { rx: /\b(director(a)? (comercial|de ventas|de marketing)|gerente (comercial|de ventas|de marketing))\b/i,
    rol: 'influenciador', area: 'Comercial' },
  { rx: /\b(atenci[oó]n a clientes|servicio a clientes|call ?center|customer success|soporte)\b/i,
    rol: 'usuario_clave', area: 'Atención a clientes' },
  { rx: /\b(recepci[oó]n|asistente|secretari[oa]|conmutador)\b/i,
    rol: 'gatekeeper', area: 'Administración' },
  { rx: /\b(gerente|director(a)?|jefe|coordinador(a)?|responsable|encargad[oa]|l[ií]der)\b/i,
    rol: 'contacto_operativo', area: 'Sin especificar' },
]

/** Contextos donde un nombre NO es del equipo de la empresa. */
const CONTEXTO_AJENO =
  /(testimoni|opini[oó]n|rese[ñn]a|cliente satisfech|dijo|coment[oó]|calific|estrella|nuestros clientes|caso de [eé]xito|blog|autor|escrito por|entrevista)/i

/**
 * Palabras que delatan que la "persona" no lo es.
 * La lista creció con los falsos positivos reales de la medición del 1 Sep
 * 2026 sobre 35 sitios: calles ("Río Churubusco" como CTO), instituciones
 * ("Bolsa Mexicana" como fundadora) y áreas ("Políticas Públicas" como
 * director). Sin este filtro el extractor produce puro ruido.
 */
const NO_ES_PERSONA = new RegExp([
  // sociedades y genéricos corporativos
  's\\.?a\\.?|c\\.?v\\.?|inc|llc|group|grupo|corporativ|company|solutions|servicios',
  'sistemas|tecnolog|consultor[ií]a|agencia|holding|asociados|hermanos',
  // navegación y legales
  'inicio|contacto|nosotros|productos|aviso|privacidad|t[eé]rminos|men[uú]|copyright',
  'derechos|error|server|file|directory|pol[ií]tica',
  // toponimia (calles, colonias, ciudades)
  'r[ií]o|avenida|calle|colonia|boulevard|paseo|carretera|kil[oó]metro|norte|sur|oriente|poniente',
  'm[eé]xico|guadalajara|monterrey|puebla|quer[eé]taro|canc[uú]n|toluca|le[oó]n|mérida',
  // instituciones y áreas, no personas
  'bolsa|c[aá]mara|instituto|fundaci[oó]n|universidad|secretar[ií]a|consejo|comisi[oó]n',
  'p[uú]blicas|recursos humanos|capital humano|desarrollo|calidad|performance|marketing',
].join('|'), 'i')

/** Un nombre propio real tiene al menos dos palabras y ninguna es un cargo. */
function pareceNombrePersona(nombre: string): boolean {
  const palabras = nombre.trim().split(/\s+/).filter(p => p.length > 1)
  if (palabras.length < 2 || palabras.length > 4) return false
  if (NO_ES_PERSONA.test(nombre)) return false
  if (CARGOS.some(c => c.rx.test(nombre))) return false
  return true
}

/** Rutas institucionales donde suele publicarse el equipo. */
const RUTAS_EQUIPO = [
  '/nosotros', '/equipo', '/quienes-somos', '/quienes_somos', '/about', '/about-us',
  '/team', '/nuestro-equipo', '/direccion', '/directorio', '/liderazgo', '/empresa',
]

/**
 * Nombre propio en español: 2 a 4 palabras capitalizadas, admitiendo
 * partículas ("de", "del", "la") en minúscula entre apellidos.
 */
const RX_NOMBRE =
  /\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+(?:de|del|la|las|los|y)\s+)?(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}){1,3})\b/g

export interface PersonaDetectada {
  nombre: string
  cargo: string
  rol: RolDecision
  area: string
  email: string | null
  evidencia: string
  url: string
}

/**
 * Busca pares nombre↔cargo dentro de una misma frase o líneas contiguas.
 * Trabaja sobre texto plano ya extraído del HTML.
 */
export function extraerPersonas(texto: string, url: string): PersonaDetectada[] {
  const out: PersonaDetectada[] = []
  const vistos = new Set<string>()
  // Se analizan bloques cortos: un nombre y su cargo suelen ir juntos.
  const bloques = texto.split(/\n+/).flatMap(l => l.split(/(?<=[.;])\s+/))

  for (let i = 0; i < bloques.length; i++) {
    const bloque = `${bloques[i]} ${bloques[i + 1] ?? ''}`.trim()
    if (bloque.length < 8 || bloque.length > 260) continue
    if (CONTEXTO_AJENO.test(bloque)) continue

    const cargoDef = CARGOS.find(c => c.rx.test(bloque))
    if (!cargoDef) continue

    const cargoTexto = (bloque.match(cargoDef.rx)?.[0] ?? '').trim()

    RX_NOMBRE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = RX_NOMBRE.exec(bloque)) !== null) {
      const nombre = m[1].replace(/\s+/g, ' ').trim()
      if (!pareceNombrePersona(nombre)) continue
      const clave = normTexto(nombre)
      if (!clave || clave.length < 6 || vistos.has(clave)) continue
      vistos.add(clave)

      // Correo solo si aparece literalmente en el mismo bloque
      const correos = extraerEmails(bloque)
      out.push({
        nombre,
        cargo: cargoTexto || 'Sin especificar',
        rol: cargoDef.rol,
        area: cargoDef.area,
        email: correos[0] ?? null,
        evidencia: bloque.replace(/\s+/g, ' ').slice(0, 200),
        url,
      })
      break   // un nombre por bloque: evita listar toda una plana
    }
    if (out.length >= 8) break
  }
  return out
}

/** Descarga las páginas institucionales y devuelve los decisores candidatos. */
export async function buscar(cuenta: CuentaLectura): Promise<DecisorCandidato[]> {
  const dominio = esValorReal(cuenta.pagina_web) ? dominioCanonico(cuenta.pagina_web) : ''
  if (!dominio) return []

  const paginas = await descargarSitio(dominio)
  const utiles = paginas.filter(p => p.texto)
  if (!utiles.length) return []

  // Nombres que el KAM ya registró: no se duplican como "hallazgo nuevo".
  const yaRegistrados = new Set<string>([
    normTexto(cuenta.contacto_nombre ?? ''),
    ...(cuenta.contactos_json ?? []).map(c => normTexto(c.nombre ?? '')),
  ].filter(Boolean))

  const ahora = new Date().toISOString()
  const out: DecisorCandidato[] = []
  const vistos = new Set<string>()

  for (const p of utiles) {
    for (const persona of extraerPersonas(p.texto, p.url)) {
      const clave = normTexto(persona.nombre)
      if (vistos.has(clave) || yaRegistrados.has(clave)) continue
      vistos.add(clave)

      // Una página de equipo envejece y el cargo publicado no siempre decide:
      // techo de verificación 'probable' para todo el mapa.
      const score = persona.rol === 'contacto_operativo' ? 62 : 74
      const estado: EstadoVerificacion = 'probable'

      out.push({
        cuenta_id: cuenta.id,
        asesor: cuenta.asesor,
        persona_nombre: persona.nombre,
        cargo: persona.cargo,
        area: persona.area,
        rol_decision: persona.rol,
        tipo_contacto: estado,
        email: persona.email,
        telefono: null,
        confianza_score: score,
        estado_verificacion: estado,
        fuente_url: persona.url,
        fuente_nombre: `Sitio oficial ${dominio} — página institucional`,
        evidencia: persona.evidencia,
        consultado_en: ahora,
        dedupe_key: dedupeKey(cuenta.id, `decisor:${clave}`, clave, persona.url),
      })
    }
  }
  return out.slice(0, 6)
}

/** Reexporta para pruebas. */
export { htmlATexto }
