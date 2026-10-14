import {
  OBJETIVO_PUESTO, POSTURA, RESPONSABILIDADES, CADENCIA,
  INDICADORES_ANCLA, ANTI_PERFIL, PRINCIPIO_BAJA, PROTOCOLO_BAJA,
  RESPUESTAS_NO_ACEPTADAS, EVALUACION_PERDIDA, REGLAS_DURAS,
} from '@/lib/perfil-rol'

/**
 * EL MARCO DEL ÁREA, PARA QUE ATLAS LO TENGA.
 *
 * ── POR QUÉ EXISTE ESTE ARCHIVO ───────────────────────────────────────────
 * Dirección preguntó a Atlas por el mensaje del Director de Customer Success y
 * Atlas contestó con generalidades. No fue un fallo del modelo: **el documento
 * marco no estaba en su contexto**. Estaba publicado —`/docs/Callpicker_
 * Customer_Success_Operating_System.html`, enlazado desde Perfil del Rol— y la
 * herramienta no lo leía. Un documento marco que la herramienta no lee no
 * informa a nadie.
 *
 * Instrucción, 14 oct 2026: *«en ATLAS IA debes contestar apoyando de toda la
 * data que posees, así que no te limites»* y *«todo lo que anexamos aquí y en
 * la herramienta debes tomarlo como parte importante»*.
 *
 * ── POR QUÉ NO SE INYECTA EL HTML ENTERO ──────────────────────────────────
 * El documento son ~25,000 caracteres de texto. Metido en cada petición, se
 * lleva un trozo del presupuesto de contexto en cada pregunta, incluidas las
 * que no van de doctrina. Aquí va lo que de verdad decide una respuesta —los
 * siete principios, las dos definiciones de éxito y el encargo del rol— y se
 * NOMBRA la ruta del documento completo para que Atlas pueda remitir a él.
 *
 * ── LA DOCTRINA DEL ROL NO SE RETECLEA ────────────────────────────────────
 * `lib/perfil-rol.ts` ya la tiene estructurada y es la que pinta la pantalla
 * de Perfil del Rol. Se deriva de ahí, no se copia: dos copias de la misma
 * doctrina se desincronizan, y la que Atlas cite sería la vieja sin que nada
 * falle. Ver [[feedback-fuente-unica-cuentas]].
 */

/** La ruta pública del documento completo. Atlas remite aquí cuando alguien
 *  pide el texto íntegro o una sección que este resumen no cubre. */
export const MARCO_RUTA = '/docs/Callpicker_Customer_Success_Operating_System.html'

/** Los siete principios, tal como los enuncia el documento. */
const PRINCIPIOS = [
  'El éxito del cliente empieza por entenderlo',
  'La actividad no es el resultado',
  'Los datos nos ayudan a decidir, pero no reemplazan el criterio',
  'El riesgo se gestiona antes de que se convierta en churn',
  'Cada cliente merece una estrategia, no solamente atención',
  'La responsabilidad por el cliente es compartida',
  'La expansión debe ser consecuencia del valor',
]

const li = (xs: readonly string[]) => xs.map(x => `  · ${x}`).join('\n')

export const MARCO_SUMMARY = `
## MARCO DEL ÁREA — «Customer Success Operating System»
Documento institucional de filosofía, gestión y operación, firmado por el
Director de Customer Success (octubre 2026). Es la referencia que orienta la
estrategia, las decisiones y el trabajo cotidiano del área. El texto íntegro
está publicado en ${MARCO_RUTA} y se enlaza desde la pantalla «Perfil del rol».
CUANDO ALGUIEN PREGUNTE POR LA POSTURA DEL ÁREA, POR EL MENSAJE DE LA DIRECCIÓN
O POR CÓMO DEBE TRABAJARSE UNA CUENTA, LA RESPUESTA SALE DE AQUÍ — no de
generalidades de Customer Success.

### Los siete principios
${PRINCIPIOS.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

### El rol: ${OBJETIVO_PUESTO.titulo}
Área: ${OBJETIVO_PUESTO.area} · Reporta a: ${OBJETIVO_PUESTO.reportaA}
Objetivo: ${OBJETIVO_PUESTO.objetivo}
Lo que NO es: ${OBJETIVO_PUESTO.noEs}
Métrica ancla: ${OBJETIVO_PUESTO.metricaAncla}

### Los tres desplazamientos de postura
${POSTURA.map(p => `  · ${p.de} → ${p.a}: ${p.texto}`).join('\n')}

### Las ${RESPONSABILIDADES.length} responsabilidades
${RESPONSABILIDADES.map(r => `  ${r.clave} ${r.titulo}`).join('\n')}
Toda actividad semanal debe poder rastrearse a una de ellas. Una actividad que
no se rastrea sobra; una responsabilidad sin actividad es un hueco con dueño.

### Cadencia exigida
${CADENCIA.map(c => `  · ${c.periodo}: ${c.detalle}`).join('\n')}

### Indicadores ancla
${INDICADORES_ANCLA.map(i => `  · ${i.nombre} — ${i.definicion} (meta: ${i.meta})`).join('\n')}

### Reglas duras — no admiten excepción
${REGLAS_DURAS.map(r => `  · ${r.titulo}: ${r.texto}`).join('\n')}

### Una baja NO se archiva
${PRINCIPIO_BAJA}
Protocolo por fases:
${PROTOCOLO_BAJA.map(f => `  · ${f.fase} (${f.cuando})`).join('\n')}
Cómo se evalúa una pérdida:
${EVALUACION_PERDIDA.map(e => `  · ${e.etiqueta}: ${e.criterio}`).join('\n')}

### Respuestas que NO se aceptan de un asesor
${RESPUESTAS_NO_ACEPTADAS.map(r => `  · ${r.frase} — ${r.porque}`).join('\n')}

### Anti-perfil — lo que el área NO quiere
${li(ANTI_PERFIL)}
`.trim()
