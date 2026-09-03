/**
 * Puente entre el diccionario técnico y Atlas.
 *
 * El glosario completo son ~170 términos. Meterlo entero en cada petición
 * cuesta contexto en preguntas que no tienen nada que ver con terminología,
 * así que se inyecta por capas:
 *
 *   Siempre  — el mapa de categorías, los doce esenciales, las precisiones que
 *              evitan errores de dimensionamiento y la conducta esperada. Es
 *              poco texto y basta para que Atlas sepa que tiene el diccionario
 *              y cómo debe usarlo.
 *   Al vuelo — los términos que aparecen en la pregunta, completos.
 *   Completo — el índice de una línea por término cuando la pregunta es
 *              claramente de terminología o de capacitación.
 *
 * Lo que nunca se omite es la instrucción de conducta: dirección pidió que
 * Atlas no suelte la definición y ya, sino que pregunte para qué se necesita
 * y encamine hacia el perfilamiento.
 */
import { GLOSARIO, CATEGORIAS_GLOSARIO, type TerminoGlosario } from './glosario'
import {
  DOCE_ESENCIALES, SEGUNDA_OLA, PRECISIONES, NIVELES_EVOLUCION,
  PREGUNTAS_PERFILAMIENTO, TABLA_EVOLUCION, CONDUCTA_ATLAS_GLOSARIO, REGLA_COMERCIAL,
} from './perfilamiento'
import { seccionIntegraciones, integracionDe, PROTOCOLO_SIN_INTEGRACION } from './integraciones-catalogo'

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD')
    .split('').filter(c => { const x = c.codePointAt(0) ?? 0; return x < 0x0300 || x > 0x036f }).join('')
}

/** Palabras que delatan una consulta de terminología o de capacitación. */
const SENALES_GLOSARIO = [
  'que es', 'que significa', 'significa', 'diferencia entre', 'glosario',
  'diccionario', 'termino', 'terminos', 'concepto', 'siglas', 'explicame',
  'explica', 'define', 'definicion', 'capacitacion', 'capacitar', 'entrenar',
  'como le explico', 'como explico', 'como le digo', 'para que sirve',
]
// No se agregan señales genéricas como "usan" o "tienen": aparecen en casi
// cualquier pregunta de cartera y meterían el índice de 179 términos en
// consultas que no lo necesitan. Cuando el asesor nombra una plataforma
// ("usamos Pipedrive"), `terminosEnPregunta` ya la detecta y eso basta para
// activar el índice.

/**
 * Términos mencionados en la pregunta.
 *
 * Se compara sobre texto normalizado y con límites de palabra reconstruidos a
 * mano: `\b` en JavaScript es ASCII y no reconoce acentos, así que un término
 * como "Transcripción" nunca haría match con un patrón que dependa de él.
 */
export function terminosEnPregunta(pregunta: string): TerminoGlosario[] {
  const p = ` ${norm(pregunta).replace(/[^a-z0-9]+/g, ' ')} `
  const hits: TerminoGlosario[] = []
  for (const t of GLOSARIO) {
    const candidatos = [t.t, ...(t.alias ?? []), ...(t.sig ? [t.sig] : [])]
    const match = candidatos.some(c => {
      const n = norm(c).replace(/[^a-z0-9]+/g, ' ').trim()
      // Siglas de 2-3 letras solo cuentan como palabra suelta, para que "api"
      // no dispare dentro de "rapido" ni "ia" dentro de "dia".
      return n.length >= 2 && p.includes(` ${n} `)
    })
    if (match) hits.push(t)
  }
  return hits.slice(0, 18)
}

function lineaTermino(t: TerminoGlosario): string {
  const partes = [t.sig ? `${t.t} (${t.sig})` : t.t, `[${t.cat}]`, t.def]
  if (t.sirve) partes.push(`Sirve para: ${t.sirve}`)
  if (t.com) partes.push(`Comercial: ${t.com}`)
  if (t.ej)  partes.push(`Ej: ${t.ej}`)
  if (t.ojo) partes.push(`OJO: ${t.ojo}`)
  if (t.cat === 'plataformas') {
    const i = integracionDe(t.t)
    // Se entrega el nombre del catálogo tal cual, no solo el alcance: apoyarse
    // en una regla en prosa para que el modelo conserve "(a través de Zapier)"
    // no bastó — omitía el calificativo aunque lo tuviera en la lista. Dándole
    // la cadena exacta que debe escribir, no hay nada que recortar.
    partes.push(i
      ? `INTEGRACIÓN DOCUMENTADA (${i.fuente}). NOMBRE EXACTO QUE DEBES ESCRIBIR, completo y sin recortar: "${i.plataforma}". Alcance exacto, no lo amplíes: ${i.alcances.join(' | ')}`
      : `NO ESTÁ EN EL CATÁLOGO: no afirmes que Callpicker ya se integra con esta plataforma, pero TAMPOCO digas que no se puede. ${PROTOCOLO_SIN_INTEGRACION.condiciones.join(' Y ')} → ${PROTOCOLO_SIN_INTEGRACION.siSeCumplen} ${PROTOCOLO_SIN_INTEGRACION.limite} CIERRA CON ESTA FRASE TEXTUAL, sin omitirla: "${PROTOCOLO_SIN_INTEGRACION.canalizacion}"`)
  }
  return `  - ${partes.join(' | ')}`
}

function lineaCorta(t: TerminoGlosario): string {
  return `  - ${t.sig ? `${t.t} (${t.sig})` : t.t}: ${t.def}`
}

/**
 * Secciones de glosario para el contexto de Atlas.
 * `pregunta` decide cuánto detalle se incluye.
 */
export function seccionesGlosario(pregunta: string): { secciones: string[]; modulos: string[] } {
  const secciones: string[] = []
  const modulos: string[] = []
  const p = norm(pregunta)

  /* ── Capa 1: siempre ──────────────────────────────────────────────────── */
  secciones.push(
    `DICCIONARIO TÉCNICO-COMERCIAL (apartado Base de Conocimiento > Glosario técnico | ${GLOSARIO.length} términos en ${CATEGORIAS_GLOSARIO.length} categorías):\n` +
    `  Categorías: ${CATEGORIAS_GLOSARIO.map(c => `${c.id}=${c.label}`).join(' · ')}\n` +
    `  Los 12 que todo comercial debe dominar: ${DOCE_ESENCIALES.join(', ')}.\n` +
    `  Segunda capa, después de esos doce: ${SEGUNDA_OLA.join(', ')}.\n` +
    `  Tienes cargado el diccionario completo: NUNCA respondas "no tengo ese término" a una consulta de terminología de comunicaciones, telefonía, contact center, IA conversacional, APIs, CRM o integraciones.`
  )

  secciones.push(
    `PRECISIONES QUE EVITAN ERRORES COMERCIALES (dilas sin que te las pidan cuando el término lo amerite):\n` +
    PRECISIONES.map(x => `  - ${x.titulo}. Confusión: ${x.confusion} Corrección: ${x.correccion}${x.ejemplo ? ` Ej: ${x.ejemplo}` : ''}`).join('\n')
  )

  secciones.push(
    `ESCALA DE EVOLUCIÓN DEL CLIENTE (úbicalo y nombra el SIGUIENTE nivel realista, no el 7 siempre):\n` +
    NIVELES_EVOLUCION.map(n => `  ${n.n}. ${n.titulo} — ${n.que} Señal de que está aquí: ${n.senal}`).join('\n')
  )

  secciones.push(
    `CONDUCTA OBLIGATORIA AL RESPONDER TERMINOLOGÍA (instrucción de dirección):\n` +
    CONDUCTA_ATLAS_GLOSARIO.map((c, i) => `  ${i + 1}. ${c}`).join('\n') +
    `\n  Regla de fondo: ${REGLA_COMERCIAL}`
  )

  secciones.push(
    `PREGUNTAS DE PERFILAMIENTO (de aquí salen las que le pasas al asesor; máximo tres por respuesta, las que apliquen al tema):\n` +
    PREGUNTAS_PERFILAMIENTO.map(b =>
      `  ${b.bloque} — revela: ${b.revela}\n${b.preguntas.map(q => `    · ${q}`).join('\n')}`
    ).join('\n')
  )
  secciones.push(seccionIntegraciones())
  modulos.push('glosario', 'integraciones-catalogo')

  /* ── Capa 2: los términos que aparecen en la pregunta ─────────────────── */
  const hits = terminosEnPregunta(pregunta)
  if (hits.length) {
    secciones.push(
      `TÉRMINOS DETECTADOS EN LA PREGUNTA (usa estas fichas completas, son la fuente):\n` +
      hits.map(lineaTermino).join('\n')
    )
    modulos.push(`glosario:${hits.length}`)
  }

  /* ── Capa 3: índice completo si la consulta es de terminología ────────── */
  const esConsultaGlosario = SENALES_GLOSARIO.some(s => p.includes(s)) || hits.length > 0
  if (esConsultaGlosario) {
    secciones.push(
      `ÍNDICE COMPLETO DEL DICCIONARIO (una línea por término; si necesitas más detalle de alguno, ya lo tienes arriba o pídelo):\n` +
      GLOSARIO.map(lineaCorta).join('\n')
    )
    secciones.push(
      `DE DÓNDE VIENE CADA COSA (para explicar migraciones):\n` +
      TABLA_EVOLUCION.map(r => `  ${r.antes} → ${r.despues}`).join('\n')
    )
    modulos.push('glosario:indice')
  }

  return { secciones, modulos }
}
