import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ASESOR_CONFIG } from '@/lib/types'
import { Resend } from 'resend'
import { detectDataGaps, gapScore, type DataGap } from '@/lib/data-gaps'
import { contarRespuestasRadar, preguntasRadarFaltantes } from '@/lib/radar'
import {
  evaluarElegibilidad, esLunes, LIMITE_SEMANAL, MSG,
  type CodigoBloqueo,
} from '@/lib/elegibilidad'

export const dynamic   = 'force-dynamic'
// 55s (antes 30s) — deja margen al fetch interno a /api/facturacion?mode=dormidos
// (que en sí misma corre con maxDuration=55 por la consulta a Zoho Analytics)
// más el resto del procesamiento y el envío de correo opcional.
export const maxDuration = 55

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d   = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ── Conciliación con Churn (Zoho dormidas en vivo) ────────────────────────────
// El campo `estado` de Supabase puede quedar desactualizado respecto a Zoho
// (ver incidente Campus Residencias/Trustworthy, 10 Jul 2026: cuentas ya
// dormidas en Zoho seguían con estado "activo"/"en_riesgo" y recibieron
// actividades). Antes de generar, se cruza contra la misma fuente que usa
// el módulo Churn → Zoho · Dormidos en vivo (/api/facturacion?mode=dormidos).
//
// FAIL-CLOSED (24 Ago 2026): si Zoho no responde se devuelve `null` y NO se
// genera nada. Antes era fail-open y esa fue la vía por la que cuentas ya
// dormidas siguieron recibiendo actividades: cuando la conciliación fallaba
// en silencio, el único filtro que quedaba era el `estado` desactualizado.
async function getDormidasEnZoho(origin: string, cookie: string | null): Promise<Set<string> | null> {
  const dormidas = new Set<string>()
  try {
    // La cookie de sesión debe propagarse: /api/facturacion está detrás del
    // middleware de auth. Sin ella el middleware responde con un redirect al
    // login, fetch lo sigue y devuelve el HTML de /acceso con status 200 — la
    // conciliación fallaba en silencio y todas las cuentas pasaban el filtro.
    // Esa fue la causa real de que cuentas dormidas siguieran recibiendo
    // actividades pese a existir la conciliación (24 Ago 2026).
    const res = await fetch(`${origin}/api/facturacion?mode=dormidos`, {
      signal:   AbortSignal.timeout(25000),
      redirect: 'manual',
      headers:  cookie ? { cookie } : {},
    })
    if (!res.ok) return null
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) return null

    const data = await res.json() as { rows?: Array<{ cuenta_id: number | string | null; matched: boolean }> }
    if (!Array.isArray(data.rows)) return null
    for (const r of data.rows) {
      if (r.matched && r.cuenta_id != null) dormidas.add(String(r.cuenta_id))
    }
  } catch (e) {
    console.warn('[Actividades] Conciliación con Zoho dormidas no disponible — generación bloqueada (fail-closed):', e)
    return null
  }
  return dormidas
}

// ── Auditoría ────────────────────────────────────────────────────────────────
// Deja rastro de qué se generó y qué se bloqueó. Si la tabla `actividades_audit`
// aún no existe (migración pendiente) no rompe la generación: registra en log.
async function auditar(filas: Array<Record<string, unknown>>) {
  if (!filas.length) return
  try {
    const { error } = await supabaseAdmin.from('actividades_audit').insert(filas)
    if (error) console.warn('[Actividades][audit] no registrado:', error.message)
  } catch (e) {
    console.warn('[Actividades][audit] no registrado:', e)
  }
}

// ── Radar de Cuenta — cuántas de las 12 preguntas tiene respondidas cada cuenta
async function getRadarMap(cuentaIds: string[]): Promise<Map<string, Record<string, unknown> | null>> {
  const map = new Map<string, Record<string, unknown> | null>()
  if (!cuentaIds.length) return map
  try {
    const { data, error } = await supabaseAdmin
      .from('radar_respuestas')
      .select('cuenta_id, respuestas, creado_en')
      .in('cuenta_id', cuentaIds)
      .order('creado_en', { ascending: false })
    if (error) return map // tabla ausente u otro error — se trata como "sin respuestas" (fail-open)
    const vistos = new Set<string>()
    for (const r of (data ?? []) as Array<{ cuenta_id: string; respuestas: Record<string, unknown> | null }>) {
      if (vistos.has(r.cuenta_id)) continue // ya se tomó la más reciente
      vistos.add(r.cuenta_id)
      map.set(r.cuenta_id, r.respuestas)
    }
  } catch { /* fail-open */ }
  return map
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

type TipoActividad = 'llamada' | 'reunion' | 'analisis' | 'kam' | 'upsell' | 'validacion' | 'tickets' | 'pagos'
type Prioridad     = 'alta' | 'media' | 'baja'

interface ContactoJson { nombre: string; cargo: string; email: string; tel?: string }

interface CuentaFull {
  id: string
  consecutivo: string
  cid: string | null
  empresa: string
  health_score: number
  estado: string
  upsell_producto: string | null
  crossell_producto: string | null
  dias_sin_actividad: number
  activo_desde: string | null
  contacto_nombre: string | null
  contacto_cargo: string | null
  contacto_tel: string | null
  contacto_email: string | null
  giro: string | null
  tamano_empresa: string | null
  pagina_web: string | null
  total_empleados: string | null
  num_oficinas: string | null
  nps_score: number | null
  notas: string | null
  observaciones_kam: string | null
  score_adopcion: number
  tiene_chat_activo: boolean
  tiene_integracion_api: boolean
  tiene_pago_automatico: boolean
  facturacion: number | null
  contactos_json: ContactoJson[] | null
}

interface ActividadRow {
  asesor:           string
  cuenta_id:        string
  cid:              string | null
  consecutivo:      string
  empresa:          string
  tipo:             TipoActividad
  descripcion:      string
  prioridad:        Prioridad
  fecha_programada: string
  fecha_vencimiento:string
  semana_inicio:    string
  estado:           string
  semaforo_cuenta:  string
  hs_cuenta:        number
}

const TIPO_META: Record<TipoActividad, { label: string; emoji: string }> = {
  llamada:    { label: 'Llamada',             emoji: '📞' },
  reunion:    { label: 'Reunión',             emoji: '📊' },
  analisis:   { label: 'Análisis / Reporte',  emoji: '📈' },
  kam:        { label: 'Seguimiento KAM',     emoji: '📝' },
  upsell:     { label: 'Propuesta Expansión', emoji: '🚀' },
  validacion: { label: 'Completar Perfil',    emoji: '⚠️' },
  tickets:    { label: 'Análisis de Tickets', emoji: '🎫' },
  pagos:      { label: 'Comportamiento Pago', emoji: '💳' },
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const DIAS  = ['dom','lun','mar','mié','jue','vie','sáb']

// ── Análisis de datos faltantes ───────────────────────────────────────────────
// detectDataGaps / gapScore ahora viven en lib/data-gaps.ts (catálogo único,
// compartido con diagnostico/route.ts y el gate de completada en [id]/route.ts).

// Cuenta TOP = facturación ≥ $3,000 MXN/mes o score de adopción alto
function isTopAccount(c: CuentaFull): boolean {
  return (c.facturacion != null && c.facturacion >= 3000) || c.score_adopcion >= 70
}

// Bloque de análisis de tráfico Callpicker — se inyecta en llamada, análisis y reunión
function buildCallAnalysisBlock(empresa: string, isTop: boolean): string {
  const base = `\n\n📊 ANÁLISIS CALLPICKER PREVIO AL CONTACTO — ${empresa}:\nRevisa en el dashboard ANTES de marcar:\n• Ratio entrantes vs. salientes últimas 4 semanas — ¿cuál domina?\n• % de llamadas rechazadas o abandonadas (benchmark interno: < 15%)\n• Duración promedio de llamada vs. plan contratado\n• DIDs activos vs. DIDs contratados — ¿está pagando líneas sin uso?\n• ¿Se están grabando las llamadas? ¿El cliente accede a las grabaciones?\nLleva estos 5 datos a la conversación. Un asesor que desconoce el uso real del cliente pierde credibilidad en los primeros 30 segundos.`
  if (!isTop) return base
  return base + `\n• CUENTA TOP: mapea también los horarios pico de mayor volumen y si los agentes del cliente están dimensionados para ese tráfico. Esta información es argumento directo para una propuesta de expansión.`
}

// Alerta KOMBITEC — aparece cuando hay gaps críticos de decisores o datos
function buildKombitecAlert(empresa: string, gaps: DataGap[]): string {
  const sinDecisor = gaps.some(g => g.campo === 'Mapa de decisores')
  const sinKAM     = gaps.some(g => g.campo === 'Observaciones KAM')
  if (!sinDecisor && !sinKAM) return ''
  return `\n\n🔴 ALERTA — LECCIÓN KOMBITEC:\nSe documentó un caso real en cartera donde el asesor no tenía ningún seguimiento registrado, ningún mapa de decisores y ningún dato de perfil. Cuando el cliente solicitó cambios contractuales, no había contexto para responder ni para identificar a otras personas con poder de decisión. Esa situación colocó la cuenta en riesgo total de pérdida.\nPregunta obligatoria en esta interacción: "Si ${empresa} decidiera pedir una baja o downgrade HOY, ¿tienes la información para responder con contexto en menos de 2 horas?" Si la respuesta es NO → esta actividad no termina hasta que captures lo que falta.`
}

// Bloque del Radar de Cuenta — las 12 preguntas obligatorias del asesor.
// Se usa solo en el lote dedicado de los lunes (Completar Perfil + Radar).
function buildRadarBlock(empresa: string, respondidas: number, faltantes: ReturnType<typeof preguntasRadarFaltantes>): string {
  if (faltantes.length === 0) return `\n\n🧭 RADAR DE CUENTA: ${empresa} ya tiene las 12 preguntas respondidas — revisa si alguna respuesta cambió antes de dar por cerrado este bloque.`
  const lista = faltantes.slice(0, 6).map(p => `${p.n}. ${p.critica ? '[CRÍTICA] ' : ''}${p.texto}`).join('\n')
  const resto = faltantes.length > 6 ? `\n… y ${faltantes.length - 6} pregunta(s) más en la pestaña Radar de la cuenta.` : ''
  return `\n\n🧭 RADAR DE CUENTA — ${empresa}: ${respondidas}/12 preguntas respondidas. Responde las que faltan en la sección "Radar de Cuenta" de la ficha (Dashboard → Cuentas → ${empresa}):\n${lista}${resto}\nEstas preguntas son tan obligatorias como los datos de perfil — no es opcional dejarlas en blanco.`
}

// ── Lógica de descripción ─────────────────────────────────────────────────────

function buildDescripcion(
  tipo:             TipoActividad,
  hs:               number,
  semaforo:         string,
  diasSinActividad: number,
  idx:              number,
  cuenta:           CuentaFull,
  radar?:           { respondidas: number; faltantes: ReturnType<typeof preguntasRadarFaltantes> },
): string {
  const { empresa, upsell_producto } = cuenta
  const gaps     = detectDataGaps(cuenta)
  const criticos = gaps.filter(g => g.nivel === 'critico')
  const isTop    = isTopAccount(cuenta)

  const topTag    = isTop ? ' [CUENTA TOP]' : ''
  const capturaStr = criticos.length > 0
    ? `\n\n⚡ CAPTURAR EN ESTA INTERACCIÓN: ${criticos.map(g => g.campo).join(' · ')}. Sin estos datos el perfil queda incompleto para análisis de riesgo.`
    : ''

  const modulos: string[] = []
  if (!cuenta.tiene_chat_activo)     modulos.push('chat')
  if (!cuenta.tiene_integracion_api) modulos.push('integración API')
  if (!cuenta.tiene_pago_automatico) modulos.push('pago automático')
  const modsStr = modulos.length > 0
    ? `Módulos sin activar: ${modulos.join(', ')}.`
    : 'Todos los módulos principales están activos.'

  const callBlock = buildCallAnalysisBlock(empresa, isTop)
  const kombitec  = buildKombitecAlert(empresa, gaps)

  switch (tipo) {

    case 'validacion': {
      const noDeseable  = gaps.filter(g => g.nivel !== 'deseable').slice(0, 6)
      const sinDecisor  = gaps.some(g => g.campo === 'Mapa de decisores')
      const introRiesgo = criticos.length > 0
        ? `El perfil de ${empresa} tiene ${criticos.length} dato(s) CRÍTICO(S) sin registrar.`
        : `El perfil de ${empresa} tiene ${gaps.length} campo(s) sin completar que limitan la previsión de riesgo.`

      return `COMPLETAR PERFIL${topTag} — ${empresa}

⚠️  LECCIÓN KOMBITEC: En una cuenta real en nuestra cartera, el asesor no tenía ningún dato de perfil, sin seguimientos y sin mapa de decisores. Cuando el cliente solicitó un cambio contractual, no había contexto para responder — ni siquiera sabíamos quién más podía tomar esa decisión. ¿Podría ocurrirte esto con ${empresa} hoy?

${introRiesgo} En tu próxima interacción OBTÉN y registra:

${noDeseable.map((g, i) => `${i + 1}. ${g.campo.toUpperCase()}: "${g.pregunta}"`).join('\n')}
${sinDecisor ? `\n🔑 DECISORES — Pregunta obligatoria: "¿Hay alguien más en ${empresa} involucrado en decisiones sobre herramientas como Callpicker?" Registra nombre, cargo y correo de cada persona adicional que mencionen. Un solo contacto es un punto de falla.` : ''}

Actualiza en: Dashboard → Cuentas → ${empresa} → Editar.${isTop ? '\n\n★ CUENTA TOP: por el volumen e historial de esta cuenta, tener el perfil al 100% NO es opcional. Escala con tu coordinador si el cliente se niega a compartir datos básicos — es una señal de riesgo en sí misma.' : ''}${radar ? buildRadarBlock(empresa, radar.respondidas, radar.faltantes) : ''}

✅ Esta actividad solo se puede marcar como Completada cuando los datos críticos de arriba estén guardados en la cuenta y las 12 preguntas del Radar tengan respuesta — el sistema lo valida automáticamente al guardar.`
    }

    case 'reunion':
      if (hs < 40) {
        return [
          `REUNIÓN DE RESCATE${topTag} — ${empresa} (HS: ${hs}). LLEVAR PREPARADO: (1) reporte de uso + análisis de tráfico de llamadas últimas 4 semanas (ratio entrantes/salientes, % abandonadas), (2) tickets abiertos con tiempo sin respuesta, (3) compromisos de sesiones anteriores. OBJETIVOS: identificar causa raíz del deterioro y definir plan de acción con fechas. Si hay señal de churn → escalar a supervisión en < 24h.${kombitec}${capturaStr}`,
          `REUNIÓN DE ESTABILIZACIÓN${topTag} — ${empresa} (HS: ${hs}). Presenta situación actual con datos reales de uso Callpicker: volumen, tasa de abandono, calidad. Define plan de recuperación con fechas comprometidas. Involucra al área técnica si hay incidencias sin resolver > 72h. Cierra con acuerdos documentados y pregunta directa: "¿Hay alguien más en la empresa que deba estar en esta conversación?".${kombitec}${capturaStr}`,
        ][idx % 2]
      }
      if (isTop) {
        return [
          `REUNIÓN ESTRATÉGICA${topTag} — ${empresa}. Presentar con datos reales de Callpicker: (1) métricas de adopción — usuarios activos, módulos utilizados, volumen entrantes/salientes, tasa de resolución primer contacto; (2) comparativa vs. período anterior; (3) oportunidades de optimización no exploradas; (4) roadmap relevante para sus casos de uso. Cierra con acuerdos escritos, próxima revisión agendada y actualización del mapa de decisores.${callBlock}${capturaStr}`,
          `REUNIÓN DE RESULTADOS${topTag} — ${empresa}. Lleva el reporte del mes con análisis de tráfico de llamadas: volumen, tasa de resolución primer contacto, tiempo promedio de atención, DIDs activos vs. contratados, SLA. Pide NPS verbal (1-10) y registra respuesta. ${modsStr} Pregunta explícita: "¿Quién más en su equipo tiene acceso al dashboard de Callpicker?" — confirma que el mapa de usuarios es correcto.${capturaStr}`,
        ][idx % 2]
      }
      return [
        `REUNIÓN ESTRATÉGICA — ${empresa}. Presentar: (1) métricas de adopción del periodo — usuarios activos, módulos utilizados, volumen de llamadas; (2) comparativa vs. período anterior; (3) oportunidades de optimización no exploradas. Cierra con acuerdos y próxima revisión agendada.${callBlock}${capturaStr}`,
        `REUNIÓN DE RESULTADOS — ${empresa}. Lleva el reporte del mes: volumen de llamadas, tasa de resolución primer contacto, tiempo promedio de atención y SLA. Pide NPS verbal (1-10). ${modsStr} Alinea expectativas para el siguiente ciclo.${capturaStr}`,
      ][idx % 2]

    case 'upsell':
      return [
        `PROPUESTA DE EXPANSIÓN${topTag} — ${empresa} → ${upsell_producto ?? 'nueva solución'}. PREPARA: (1) business case con ROI estimado basado en su uso real de Callpicker (volumetría actual → oportunidad con nuevo módulo), (2) 2-3 casos de éxito de clientes similares, (3) condiciones de implementación y timeline, (4) oferta de piloto sin riesgo si el cliente duda. OBJETIVO: definir próximo paso concreto con el DECISOR PRESUPUESTAL — no con quien usa la plataforma operativamente.${capturaStr}`,
        `ACERCAMIENTO EXPANSIÓN${topTag} — ${empresa} → ${upsell_producto ?? 'nueva línea'}. Primero confirma cómo usan la plataforma HOY: revisa tráfico, grabaciones activas, módulos sin usar. Identifica al decisor presupuestal — si no lo conoces, pregúntale a tu contacto quién aprueba las herramientas tecnológicas. No propongas precio sin antes entender el caso de uso y el tamaño real de la oportunidad.${capturaStr}`,
      ][idx % 2]

    case 'analisis':
      return [
        `ANÁLISIS DE TRÁFICO CALLPICKER — ${empresa}. Revisa en el dashboard:\n• Total de llamadas entrantes vs. salientes últimas 4 semanas\n• % abandonadas/rechazadas — si supera el 15% el cliente tiene un problema operativo que no sabe que tenemos visible\n• Tiempo promedio de llamada y hora pico de mayor volumen\n• DIDs activos vs. total contratados — líneas sin uso son costo desperdiciado para el cliente\n• Variación semana a semana (¿hay caída brusca de llamadas? → señal de alerta)\nPrepara 3 hallazgos concretos y llévalos al próximo contacto. Si encuentras algo anormal, contacta antes de que el cliente lo reporte.${capturaStr}`,
        `REVISIÓN DE CALIDAD DE LLAMADAS — ${empresa}. Escucha 3 grabaciones recientes: identifica si los agentes del cliente están usando bien la plataforma (menús, transferencias, tiempos de hold). Evalúa: (a) ¿Se están aprovechando las funciones de Callpicker? (b) ¿Hay llamadas que terminaron mal por error técnico vs. por error humano? (c) ¿El cliente está monitoreando sus propias grabaciones? Prepara resumen con 2 observaciones concretas para compartir.${capturaStr}`,
        `REPORTE EJECUTIVO${topTag} — ${empresa}. Genera el reporte del período: volumen de llamadas (entrantes/salientes/abandonadas), tasa de resolución primer contacto, tiempo promedio de atención, SLA cumplido/incumplido, comparativa mensual. Envía por correo al responsable antes del cierre de semana y documenta su respuesta. ${isTop ? 'CUENTA TOP: incluye también el análisis de costo por llamada y proyección de utilización vs. plan contratado.' : ''}${capturaStr}`,
        `DIAGNÓSTICO DE SLA — ${empresa}. Verifica tiempos de respuesta, resolución de incidencias y uptime del último mes. Si el SLA fue incumplido en > 1 ocasión → prepara plan de mejora para presentar en la próxima interacción. ${modsStr}${capturaStr}`,
      ][idx % 4]

    case 'kam':
      return [
        `REGISTRO KAM — ${empresa}. Actualiza el campo Observaciones KAM con: (1) estado de la relación (positivo/neutral/en riesgo), (2) compromisos de la última interacción y cuáles se cumplieron, (3) MAPA DE DECISORES actualizado — ¿cambiaron? ¿hay alguien nuevo con influencia sobre la cuenta?, (4) riesgos detectados — cambios en equipo, presupuesto o competencia mencionada, (5) próximos pasos con fecha. Sin este registro la cuenta queda ciega para supervisión y cualquier handover.${kombitec}${capturaStr}`,
        `VALIDAR TICKETS + KAM — ${empresa}. Revisa tickets activos y su antigüedad. Si supera 48h sin respuesta → escalar inmediatamente. Luego: ¿los compromisos del último contacto están en KAM? ¿El mapa de decisores está actualizado? Un KAM vacío o desactualizado equivale a empezar de cero cada vez que contactas al cliente.${kombitec}${capturaStr}`,
        `ACTUALIZACIÓN DE RELACIÓN${topTag} — ${empresa}. Revisa compromisos de la última sesión: ¿cuáles se cumplieron? ¿cuáles están pendientes? Documenta nivel de satisfacción percibida, señales de riesgo u oportunidad, y confirma que el mapa de decisores tiene al menos 2 contactos con nombre, cargo y correo. ${isTop ? 'CUENTA TOP: un solo contacto conocido en esta cuenta es inaceptable — identifica al menos al respaldo operativo y al decisor presupuestal.' : ''}${capturaStr}`,
      ][idx % 3]

    case 'tickets':
      return [
        `REVISIÓN DE TICKETS — ${empresa}. Antes de cualquier contacto: (1) tickets abiertos y antigüedad, (2) categorías más frecuentes este mes (técnica / uso / configuración), (3) tiempo de resolución vs. SLA. Si hay tickets > 48h sin respuesta → escalar de inmediato y notificar al cliente con ETA de cierre. Importante: ¿el cliente está abriendo tickets por funciones de Callpicker que debería estar usando sin fricción? → eso es una señal de adopción baja que debe documentarse.${capturaStr}`,
        `ANÁLISIS DE CALIDAD EN SOPORTE — ${empresa}. Clasifica tickets del último mes. Si "fallas técnicas" aparece más de 3 veces → el cliente tiene un problema de estabilidad que bloquea cualquier conversación de expansión. Si "dudas de uso" domina → el cliente no ha sido capacitado correctamente sobre las funciones de Callpicker que ya paga. Genera resumen y propón acción correctiva para la próxima interacción.${capturaStr}`,
      ][idx % 2]

    case 'pagos':
      return [
        `REVISIÓN DE COMPORTAMIENTO DE PAGO — ${empresa}. Verifica: (1) ¿pagos al corriente?, (2) número de incidencias históricas, (3) mes de último pago confirmado. Si hay atraso + HS < 60 → riesgo real: coordinar con cobranza y notificar a supervisión inmediatamente. Si hay 2+ incidencias históricas → nota de alerta en KAM y preparar argumentación de valor antes del próximo contacto. ${isTop ? 'CUENTA TOP: un atraso en esta cuenta tiene impacto en MRR relevante — escalar sin esperar al siguiente ciclo.' : ''}${capturaStr}`,
        `VALIDACIÓN DE FACTURACIÓN — ${empresa}. Confirma que la factura fue emitida, enviada y recibida correctamente. Si hay discrepancias → documentar y canalizar a administración el mismo día. Pregunta directa: "¿Llegó correctamente su estado de cuenta y coincide con los servicios activos?". Si el cliente menciona líneas que está pagando pero no usa → oportunidad de revisión de plan (y de fortalecer la relación siendo proactivo).${capturaStr}`,
      ][idx % 2]

    case 'llamada':
    default:
      if (semaforo === 'naranja' || semaforo === 'rojo') {
        return [
          `LLAMADA DE RETENCIÓN URGENTE${topTag} — ${empresa} (HS: ${hs}). OBJETIVO: detectar si hay intención de cancelar. Preguntas clave: "¿Qué aspectos no están cumpliendo sus expectativas?" · "¿Ha evaluado alternativas?" · "¿Qué necesitaría para continuar?". Si confirma riesgo → escalar a supervisión en < 24h. Registra resultado en CRM inmediatamente. Confirma quién más en la empresa tiene influencia sobre esta decisión.${callBlock}${kombitec}${capturaStr}`,
          `LLAMADA DE RESCATE${topTag} — ${empresa} (HS: ${hs}). Identifica la fricción principal: ¿es técnica (fallas, tickets sin resolver), operativa (el equipo no usa bien Callpicker) o relacional (inconformidad con atención)? Lleva el análisis de tráfico de llamadas del último mes — los datos de uso hablan por sí solos. Compromete fecha concreta de seguimiento y regístrala. Confirma mapa de decisores.${callBlock}${capturaStr}`,
        ][idx % 2]
      }
      if (semaforo === 'amarillo') {
        return [
          `LLAMADA PREVENTIVA${topTag} — ${empresa} (HS: ${hs}). Antes de marcar, revisa el tráfico de llamadas reciente en Callpicker. Valida en la llamada: (1) ¿cambios en el equipo que usa la plataforma?, (2) ¿módulos que dejaron de usar?, (3) ¿tickets pendientes sin respuesta? Registra acuerdos y próxima fecha. ${modsStr}${callBlock}${capturaStr}`,
          `LLAMADA DE MONITOREO${topTag} — ${empresa} (HS: ${hs}, ${diasSinActividad} días sin contacto). Revisa tickets y tráfico de llamadas antes de marcar. Preguntas: "¿Cómo va el equipo con la plataforma?" · "¿Hubo algún cambio en la operación?" · "¿Hay algo en lo que podamos ayudar?". Detecta señal de riesgo antes de que impacte el health score.${callBlock}${capturaStr}`,
        ][idx % 2]
      }
      if (diasSinActividad > 30) {
        return [
          `LLAMADA DE REACTIVACIÓN${topTag} — ${empresa} (${diasSinActividad} días sin contacto). PRIORIDAD: restablecer comunicación. Revisa en Callpicker si el cliente sigue usando el servicio (tráfico activo o inactivo — eso te dice mucho antes de la llamada). Preguntas: (1) "¿Siguen usando Callpicker en sus operaciones diarias?" (2) "¿Ha habido cambios en el equipo o en sus necesidades?" (3) "¿Con quién debo hablar si usted no está disponible?". Registra el nombre del nuevo responsable y cualquier nuevo decisor.${kombitec}${capturaStr}`,
          `CHECK-IN DE REACTIVACIÓN${topTag} — ${empresa} (${diasSinActividad}+ días sin contacto). El lapso sin contacto es señal de alerta pasiva. Verifica el tráfico en Callpicker ANTES de llamar — si las llamadas siguen fluyendo el cliente está activo aunque no hayamos hablado. Confirma que el servicio opera bien, verifica si hubo cambios de equipo o prioridades, y cierra la llamada acordando la próxima fecha de contacto.${capturaStr}`,
        ][idx % 2]
      }
      return [
        `LLAMADA DE SEGUIMIENTO${topTag} — ${empresa}. Agenda: (1) análisis de tráfico de llamadas últimas 2 semanas (llévalos tú — no esperes a que el cliente pregunte), (2) incidencias o tickets pendientes, (3) satisfacción del equipo — pide un número del 1 al 10, (4) agendar próxima fecha de contacto antes de colgar. Registra resultado completo en el sistema.${callBlock}${capturaStr}`,
        `LLAMADA DE RELACIÓN${topTag} — ${empresa}. El objetivo es profundizar. Explora: (1) nuevos proyectos del cliente que Callpicker pueda apoyar, (2) módulos que no usan y podrían serles útiles, (3) NPS verbal 1-10. Si el cliente menciona un nuevo caso de uso → documenta como oportunidad. Pregunta quién más en su equipo usa o administra Callpicker — ese es tu próximo contacto a mapear.${capturaStr}`,
        `CHECK-IN${topTag} — ${empresa}. Confirma 3 cosas: (1) el servicio opera sin problemas técnicos, (2) no hay tickets sin respuesta > 48h, (3) el responsable actual es quien esperamos — si cambió, actualiza el perfil inmediatamente y agenda reunión de presentación formal con el nuevo interlocutor.${capturaStr}`,
      ][idx % 3]
  }
}

// ── Generador principal ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { asesor, semana: semanaParam, sendEmail = false, testEmail, excepcionAdministrativa = false } = body as {
      asesor: string; semana?: string; sendEmail?: boolean; testEmail?: string
      excepcionAdministrativa?: boolean
    }
    if (!asesor) return NextResponse.json({ error: 'asesor requerido' }, { status: 400 })

    const monday       = semanaParam ? new Date(semanaParam + 'T12:00:00') : getMondayOfWeek(new Date())
    const semanaInicio = toISO(getMondayOfWeek(monday))

    // Las actividades SAC solo se disparan en lunes. La única salida es una
    // excepción administrativa explícita, que queda registrada en auditoría.
    const hoy = new Date()
    if (!esLunes(hoy)) {
      if (!excepcionAdministrativa) {
        return NextResponse.json({
          error: MSG.fuera_de_lunes + ' Hoy no es lunes; para generar fuera de calendario se requiere excepción administrativa.',
          codigo: 'fuera_de_lunes' as CodigoBloqueo,
        }, { status: 409 })
      }
      await auditar([{
        asesor, semana_inicio: semanaInicio, accion: 'excepcion_administrativa',
        codigo: 'fuera_de_lunes', motivo: `Generación fuera de lunes autorizada (${hoy.toISOString()})`,
        creado_en: new Date().toISOString(),
      }])
    }

    // Verificar si ya existen actividades esta semana
    const { data: existing } = await supabaseAdmin
      .from('actividades')
      .select('id')
      .eq('asesor', asesor)
      .eq('semana_inicio', semanaInicio)
      .limit(1)

    if (existing && existing.length > 0) {
      if (sendEmail) {
        const { data: acts } = await supabaseAdmin
          .from('actividades')
          .select('*')
          .eq('asesor', asesor)
          .eq('semana_inicio', semanaInicio)
          .order('fecha_programada', { ascending: true })
        if (acts?.length) await sendActividadesEmail(asesor, acts as AnyAct[], semanaInicio, testEmail)
      }
      return NextResponse.json({ message: 'Ya existen actividades para esta semana', semanaInicio })
    }

    // Obtener cuentas con campos extendidos para análisis de datos
    const { data: cuentas, error: cErr } = await supabaseAdmin
      .from('cuentas')
      .select(`
        id, consecutivo, cid, empresa, health_score, estado,
        upsell_producto, crossell_producto, dias_sin_actividad, activo_desde,
        contacto_nombre, contacto_cargo, contacto_tel, contacto_email,
        giro, tamano_empresa, pagina_web, total_empleados, num_oficinas,
        nps_score, notas, observaciones_kam,
        score_adopcion, tiene_chat_activo, tiene_integracion_api, tiene_pago_automatico,
        facturacion, contactos_json
      `)
      .eq('asesor', asesor)
      .in('estado', ['activo', 'en_riesgo'])
      .order('health_score', { ascending: true })

    if (cErr || !cuentas?.length)
      return NextResponse.json({ error: 'No se encontraron cuentas para este asesor' }, { status: 404 })

    // Conciliar con Churn — dos fuentes:
    // 1. Zoho · Dormidas en vivo (ver getDormidasEnZoho arriba)
    // 2. Alertas · Cuentas Cancelación (reporte manual, lib/churn-cancelaciones-data.ts),
    //    cruzado por CID ya que esas cuentas aún no tienen cuenta_id de Supabase vinculado.
    const dormidasZoho = await getDormidasEnZoho(req.nextUrl.origin, req.headers.get('cookie'))

    // Fail-closed: sin conciliación con Churn no se puede afirmar que ninguna
    // cuenta siga activa, así que no se genera nada.
    if (dormidasZoho === null)
      return NextResponse.json({
        error: MSG.estatus_no_validable + ' No se pudo conciliar con Churn (Zoho · Dormidos). No se generaron actividades.',
        codigo: 'estatus_no_validable' as CodigoBloqueo,
      }, { status: 503 })

    const candidatas = cuentas as CuentaFull[]
    const bloqueadas: Array<{ consecutivo: string; empresa: string; cid: string | null; codigo: CodigoBloqueo; motivo: string; contactoFaltante: string[] }> = []
    const todas: CuentaFull[] = []

    // El generador solo produce actividades de tipo 'validacion' (Completar
    // Perfil + Radar), por eso se evalúa con ese tipo: la cuenta con datos
    // faltantes es justamente la que debe recibirla.
    for (const c of candidatas) {
      const e = evaluarElegibilidad(c, dormidasZoho, 'validacion')
      if (e.elegible) { todas.push(c); continue }
      bloqueadas.push({
        consecutivo: c.consecutivo, empresa: c.empresa, cid: c.cid,
        codigo: e.codigo!, motivo: e.motivo!, contactoFaltante: e.contactoFaltante,
      })
    }

    const excluidasPorChurn = bloqueadas.filter(b =>
      b.codigo === 'churn_grc' || b.codigo === 'cancelacion' || b.codigo === 'dormida'
    ).length

    if (!todas.length)
      return NextResponse.json({
        error: 'Ninguna cuenta de este asesor resultó elegible: todas están en Churn (dormida / cancelación / GRC-AAA-2026) o tienen el contacto incompleto.',
        excluidasPorChurn, bloqueadas,
      }, { status: 404 })

    // ── Guardas de integridad de cartera ──────────────────────────────────
    // Incidente 18 Ago 2026: "Medicall Expert" existía DUPLICADA en Supabase
    // (mismo CID 162474) con dos consecutivos y dos asesores distintos —
    // Z56/Claudia y C31/Dan — y ambas pasaban el filtro .eq('asesor'),
    // por lo que Claudia recibió actividades de una cuenta que atiende Dan.
    // El filtro por asesor es correcto; el dato es el que estaba duplicado.
    const { data: todasCuentasRaw } = await supabaseAdmin
      .from('cuentas')
      .select('id, cid, asesor, empresa, consecutivo')
      .in('estado', ['activo', 'en_riesgo'])

    const asesoresPorCid = new Map<string, Set<string>>()
    for (const c of (todasCuentasRaw ?? []) as Array<{ cid: string | null; asesor: string | null }>) {
      if (!c.cid || !c.asesor) continue
      const k = String(c.cid).trim()
      if (!asesoresPorCid.has(k)) asesoresPorCid.set(k, new Set())
      asesoresPorCid.get(k)!.add(c.asesor)
    }

    // (a) CID compartido con OTRO asesor → conflicto no resoluble automáticamente.
    //     Se excluye y se reporta: generar para ambos garantiza un error de asignación.
    const conflictosDeAsignacion: Array<{ consecutivo: string; empresa: string; cid: string; asesores: string[] }> = []
    const sinConflicto = todas.filter(c => {
      const a = c.cid ? asesoresPorCid.get(String(c.cid).trim()) : undefined
      if (a && a.size > 1) {
        conflictosDeAsignacion.push({
          consecutivo: c.consecutivo, empresa: c.empresa,
          cid: String(c.cid), asesores: Array.from(a),
        })
        return false
      }
      return true
    })

    // (b) CID repetido DENTRO del mismo asesor → misma cuenta real dada de alta
    //     dos veces; se conserva una sola (la primera, que por el ORDER BY
    //     health_score asc es la más urgente) para no duplicar actividades.
    const cidsVistos = new Set<string>()
    const duplicadasMismoAsesor: Array<{ consecutivo: string; empresa: string; cid: string }> = []
    const elegibles = sinConflicto.filter(c => {
      if (!c.cid) return true
      const k = String(c.cid).trim()
      if (cidsVistos.has(k)) {
        duplicadasMismoAsesor.push({ consecutivo: c.consecutivo, empresa: c.empresa, cid: k })
        return false
      }
      cidsVistos.add(k)
      return true
    })

    if (!elegibles.length)
      return NextResponse.json({
        error: 'No quedaron cuentas elegibles tras validar la integridad de la cartera — revisar duplicados y conflictos de asignación en Supabase',
        conflictosDeAsignacion, duplicadasMismoAsesor,
      }, { status: 409 })

    // ── La semana completa: Completar Perfil + Radar sobre 4 cuentas ─────────
    // Es el ÚNICO lote que se genera. Antes esto convivía con 12 actividades de
    // rotación martes-viernes; se retiró el 24 Ago 2026 porque el objetivo del
    // asesor son 4 cuentas cerradas, no 16 tareas abiertas.
    // Plazo: toda la semana (vence el viernes).
    const semInicioDate = new Date(semanaInicio + 'T12:00:00')
    const friday = new Date(semInicioDate)
    friday.setDate(semInicioDate.getDate() + 4)
    const fechaVencLunes = toISO(friday)

    const semanaAnteriorDate = new Date(semanaInicio + 'T12:00:00')
    semanaAnteriorDate.setDate(semanaAnteriorDate.getDate() - 7)
    const semanaAnterior = toISO(semanaAnteriorDate)

    const cuentaIds = elegibles.map(c => c.id)
    const radarMap  = await getRadarMap(cuentaIds)

    function necesitaCompletar(c: CuentaFull): { criticos: number; importantes: number; radarResp: number; score: number } {
      const gaps       = detectDataGaps(c)
      const criticos    = gaps.filter(g => g.nivel === 'critico').length
      const importantes = gaps.filter(g => g.nivel === 'importante').length
      const radarResp   = contarRespuestasRadar(radarMap.get(c.id))
      const score = gapScore(c) + (12 - radarResp) * 2
      return { criticos, importantes, radarResp, score }
    }

    // (a) Carry-over: actividades de "validación" de la semana pasada que NO
    //     se completaron regresan primero, marcadas [2ª SOLICITUD] — solo si
    //     la cuenta sigue elegible y sigue teniendo algo pendiente hoy.
    const { data: pendientesSemanaAnterior } = await supabaseAdmin
      .from('actividades')
      .select('cuenta_id')
      .eq('asesor', asesor)
      .eq('semana_inicio', semanaAnterior)
      .eq('tipo', 'validacion')
      .eq('completada', false)

    const elegiblesPorId = new Map(elegibles.map(c => [c.id, c]))
    const carryOverIds   = new Set<string>()
    const lunesSeleccion: Array<{ cuenta: CuentaFull; segundaSolicitud: boolean }> = []

    for (const p of pendientesSemanaAnterior ?? []) {
      if (lunesSeleccion.length >= LIMITE_SEMANAL) break
      const c = elegiblesPorId.get(p.cuenta_id)
      if (!c || carryOverIds.has(c.id)) continue
      const { criticos, importantes, radarResp } = necesitaCompletar(c)
      if (criticos === 0 && importantes === 0 && radarResp >= 12) continue // ya se puso al día por otra vía
      carryOverIds.add(c.id)
      lunesSeleccion.push({ cuenta: c, segundaSolicitud: true })
    }

    // No repetir semana a semana la misma cuenta: las que ya se trabajaron en
    // las últimas 8 semanas pasan al final de la fila. Solo vuelven antes si
    // quedaron incompletas (eso ya lo cubre el carry-over de arriba).
    const hace8Semanas = new Date(semInicioDate)
    hace8Semanas.setDate(semInicioDate.getDate() - 56)
    const { data: trabajadasRecientes } = await supabaseAdmin
      .from('actividades')
      .select('cuenta_id, semana_inicio')
      .eq('asesor', asesor)
      .eq('tipo', 'validacion')
      .gte('semana_inicio', toISO(hace8Semanas))
      .lt('semana_inicio', semanaInicio)

    const ultimaVezPorCuenta = new Map<string, string>()
    for (const t of (trabajadasRecientes ?? []) as Array<{ cuenta_id: string; semana_inicio: string }>) {
      const prev = ultimaVezPorCuenta.get(t.cuenta_id)
      if (!prev || t.semana_inicio > prev) ultimaVezPorCuenta.set(t.cuenta_id, t.semana_inicio)
    }

    // (b) Rellenar hasta LIMITE_SEMANAL con las cuentas de mayor prioridad:
    //     nunca trabajadas primero, luego más críticos de perfil, luego mayor
    //     facturación (TOP primero), luego más tiempo sin contacto.
    const candidatasLunes = elegibles
      .filter(c => !carryOverIds.has(c.id))
      .map(c => ({ cuenta: c, ...necesitaCompletar(c), ultima: ultimaVezPorCuenta.get(c.id) ?? '' }))
      .filter(x => x.criticos > 0 || x.importantes > 0 || x.radarResp < 12)
      .sort((a, b) => {
        if (a.ultima !== b.ultima) return a.ultima.localeCompare(b.ultima) // '' (nunca) va primero
        if (b.score !== a.score) return b.score - a.score
        const facA = a.cuenta.facturacion ?? 0, facB = b.cuenta.facturacion ?? 0
        if (facB !== facA) return facB - facA
        return (b.cuenta.dias_sin_actividad ?? 0) - (a.cuenta.dias_sin_actividad ?? 0)
      })

    for (const { cuenta } of candidatasLunes) {
      if (lunesSeleccion.length >= LIMITE_SEMANAL) break
      lunesSeleccion.push({ cuenta, segundaSolicitud: false })
    }

    if (!lunesSeleccion.length)
      return NextResponse.json({
        error: 'No hay cuentas elegibles con datos pendientes para este asesor: todas las cuentas activas ya tienen el perfil y el Radar completos.',
        bloqueadas,
      }, { status: 400 })

    const rows: ActividadRow[] = []

    // ── Lunes: hasta 4 actividades de Completar Perfil + Radar de Cuenta ──────
    lunesSeleccion.forEach(({ cuenta, segundaSolicitud }, i) => {
      const hs        = cuenta.health_score
      const semaforo  = hs >= 80 ? 'verde' : hs >= 60 ? 'azul' : hs >= 40 ? 'amarillo' : hs >= 20 ? 'naranja' : 'rojo'
      const respuestasRadar = radarMap.get(cuenta.id)
      const radarResp   = contarRespuestasRadar(respuestasRadar)
      const radarFaltan = preguntasRadarFaltantes(respuestasRadar)
      let descripcion = buildDescripcion('validacion', hs, semaforo, cuenta.dias_sin_actividad ?? 0, i, cuenta, {
        respondidas: radarResp,
        faltantes:   radarFaltan,
      })
      if (segundaSolicitud) descripcion = `[2ª SOLICITUD — no se completó la semana pasada]\n\n${descripcion}`

      rows.push({
        asesor,
        cuenta_id:        cuenta.id,
        cid:              cuenta.cid,
        consecutivo:      cuenta.consecutivo,
        empresa:          cuenta.empresa,
        tipo:             'validacion',
        descripcion,
        prioridad:        'alta',
        fecha_programada: semanaInicio,
        fecha_vencimiento:fechaVencLunes,
        semana_inicio:    semanaInicio,
        estado:           'pendiente',
        semaforo_cuenta:  semaforo,
        hs_cuenta:        hs,
      })
    })

    // No se genera nada más. La semana del asesor son EXACTAMENTE estas cuentas
    // (máx. 4): cerrar sus datos faltantes. No se agregan actividades de
    // rotación encima — la rotación martes-viernes se retiró el 24 Ago 2026.

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('actividades')
      .insert(rows)
      .select()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    const ahora = new Date().toISOString()
    await auditar([
      ...lunesSeleccion.map(({ cuenta, segundaSolicitud }) => ({
        asesor, semana_inicio: semanaInicio, cuenta_id: cuenta.id, empresa: cuenta.empresa,
        cid: cuenta.cid, accion: 'creado', codigo: null,
        motivo: segundaSolicitud ? 'Carry-over: no se completó la semana anterior' : 'Selección semanal por datos faltantes',
        estatus_detectado: cuenta.estado, creado_en: ahora,
      })),
      ...bloqueadas.map(b => ({
        asesor, semana_inicio: semanaInicio, empresa: b.empresa, cid: b.cid,
        accion: 'bloqueado', codigo: b.codigo, motivo: b.motivo,
        campos_faltantes: b.contactoFaltante.length ? b.contactoFaltante.join(', ') : null,
        creado_en: ahora,
      })),
    ])

    if (sendEmail) await sendActividadesEmail(asesor, rows as AnyAct[], semanaInicio, testEmail)

    return NextResponse.json({
      generadas:    inserted?.length ?? 0,
      semanaInicio,
      emailEnviado: sendEmail,
      actividades:  inserted,
      completarPerfil: { // único lote de la semana — Perfil + Radar de Cuenta
        cuentas: lunesSeleccion.length,
        segundaSolicitud: lunesSeleccion.filter(x => x.segundaSolicitud).length,
      },
      excluidasPorChurn, // dormidas en Zoho, en alerta de cancelación o con churn confirmado en GRC-AAA-2026
      bloqueadas,        // detalle de cada cuenta no elegible y su motivo
      // Integridad de cartera — si vienen con elementos, hay datos que corregir en Supabase:
      conflictosDeAsignacion, // mismo CID con 2+ asesores: nadie recibió actividad, requiere decidir el dueño real
      duplicadasMismoAsesor,  // mismo CID repetido en el mismo asesor: se generó solo una vez
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// ── Email ─────────────────────────────────────────────────────────────────────

type AnyAct = ActividadRow & { [k: string]: unknown }

async function sendActividadesEmail(
  asesor:       string,
  actividades:  AnyAct[],
  semanaInicio: string,
  testEmail?:   string,
) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[Actividades] Email simulado para ${asesor} — semana ${semanaInicio}`)
    return
  }

  const ac = ASESOR_CONFIG[asesor as keyof typeof ASESOR_CONFIG]
  if (!ac) return

  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

  const byDay: Record<string, Array<Record<string, unknown>>> = {}
  for (const a of actividades) {
    const key = String(a.fecha_programada)
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(a)
  }

  const fechaLabel = (() => {
    const d = new Date(semanaInicio + 'T12:00:00')
    return `Semana del ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
  })()

  const daysHtml = Object.entries(byDay).map(([fecha, acts]) => {
    const d      = new Date(fecha + 'T12:00:00')
    const dayLbl = `${DIAS[d.getDay()].toUpperCase()} ${d.getDate()} ${MESES[d.getMonth()]}`

    const actsHtml = acts.map(a => {
      const tipo      = String(a.tipo ?? 'llamada') as TipoActividad
      const meta      = TIPO_META[tipo]
      const prioridad = String(a.prioridad ?? 'media')
      const isVal     = tipo === 'validacion'
      const color     = isVal ? '#DC2626' : prioridad === 'alta' ? '#EF4444' : prioridad === 'media' ? '#F97316' : '#3B82F6'
      const vence     = String(a.fecha_vencimiento ?? '')
      const dv        = vence ? new Date(vence + 'T12:00:00') : null

      return `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #F1F5F9;${isVal ? 'background:#FFF5F5;' : ''}">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <span style="font-size:20px;flex-shrink:0;margin-top:2px">${meta.emoji}</span>
              <div style="flex:1;min-width:0">
                <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px">
                  <span style="background:${color}18;color:${color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase">${meta.label}</span>
                  <span style="background:#EFF6FF;color:#1B3FCC;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;font-family:monospace">${String(a.consecutivo ?? '')}</span>
                  <span style="font-size:13px;font-weight:700;color:#0F172A">${String(a.empresa ?? '')}</span>
                </div>
                <p style="margin:0 0 4px;color:#475569;font-size:12px;line-height:1.55;white-space:pre-line">${String(a.descripcion ?? '')}</p>
                <p style="margin:0;color:#94A3B8;font-size:11px">
                  Vence: ${dv ? `${DIAS[dv.getDay()]} ${dv.getDate()} ${MESES[dv.getMonth()]}` : '—'}
                </p>
              </div>
            </div>
          </td>
        </tr>`
    }).join('')

    return `
      <tr><td style="padding:14px 16px 4px;background:#F8FAFC;border-top:2px solid #E2E8F0">
        <p style="margin:0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#64748B">${dayLbl}</p>
      </td></tr>
      ${actsHtml}`
  }).join('')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:#0A1628;padding:24px 28px;border-radius:12px 12px 0 0;border-left:4px solid ${ac.color}">
        <p style="color:#fff;font-size:17px;font-weight:800;margin:0">📋 Actividades SAC — ${ac.fullName}</p>
        <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:5px 0 0">${fechaLabel} · ${actividades.length} cuenta(s) · Completar Perfil + Radar · toda la semana</p>
      </div>
      <div style="padding:16px 28px;background:#EFF6FF;border-left:4px solid ${ac.color};border-bottom:1px solid #BFDBFE">
        <p style="margin:0;font-size:13px;color:#1E40AF">
          Hola <strong>${ac.fullName.split(' ')[0]}</strong>, esta semana tu objetivo son <strong>estas ${actividades.length} cuenta(s)</strong> — nada más.
          La tarea es <strong style="color:#DC2626">cerrar los datos que faltan</strong> en cada una: perfil completo y las 12 preguntas del Radar de Cuenta.
          Tienes <strong>toda la semana</strong> (vence el viernes). El sistema valida los datos al guardar: la actividad no se puede cerrar si siguen faltando.
        </p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${daysHtml}
      </table>
      <div style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;border-radius:0 0 12px 12px">
        <p style="margin:0;color:#64748B;font-size:12px">
          ⛔ Lo que no se cierre esta semana regresa el próximo lunes marcado como <strong style="color:#EF4444">[2ª SOLICITUD]</strong>.
          Registra siempre el motivo en el sistema si no fue posible realizarla.
        </p>
        <p style="margin:8px 0 0;color:#94A3B8;font-size:11px">
          Dashboard → Panel Asesores → Actividades SAC · Supervisores: josel@callpicker.com · daniel@callpicker.com
        </p>
      </div>
    </div>`

  const resend = new Resend(apiKey)
  const isTest = Boolean(testEmail)

  await resend.emails.send({
    from,
    to:      isTest ? testEmail! : ac.email,
    ...(isTest ? {} : { cc: ['josel@callpicker.com', 'daniel@callpicker.com'] }),
    subject: isTest
      ? `[PRUEBA] 📋 Actividades SAC — ${ac.fullName} — ${fechaLabel}`
      : `📋 Actividades SAC — ${ac.fullName} — ${fechaLabel}`,
    html,
  })
}
