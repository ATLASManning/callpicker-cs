import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ASESOR_CONFIG } from '@/lib/types'
import { Resend } from 'resend'

export const dynamic   = 'force-dynamic'
export const maxDuration = 30

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d   = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function addBusinessDays(date: Date, days: number): Date {
  const r = new Date(date)
  let c   = 0
  while (c < days) {
    r.setDate(r.getDate() + 1)
    if (r.getDay() !== 0 && r.getDay() !== 6) c++
  }
  return r
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

type TipoActividad = 'llamada' | 'reunion' | 'analisis' | 'kam' | 'upsell' | 'validacion'
type Prioridad     = 'alta' | 'media' | 'baja'

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
  contacto_nombre: string | null
  contacto_cargo: string | null
  contacto_tel: string | null
  giro: string | null
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
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const DIAS  = ['dom','lun','mar','mié','jue','vie','sáb']

// ── Análisis de datos faltantes ───────────────────────────────────────────────

interface DataGap {
  campo:    string
  pregunta: string
  nivel:    'critico' | 'importante' | 'deseable'
}

function detectDataGaps(c: CuentaFull): DataGap[] {
  const gaps: DataGap[] = []
  if (!c.contacto_nombre)   gaps.push({ campo: 'Contacto principal',     pregunta: '¿Con quién hablas normalmente sobre el servicio? (nombre completo)',              nivel: 'critico' })
  if (!c.contacto_cargo)    gaps.push({ campo: 'Cargo del contacto',     pregunta: '¿Cuál es el cargo o puesto del responsable de la cuenta?',                        nivel: 'critico' })
  if (!c.contacto_tel)      gaps.push({ campo: 'Teléfono directo',       pregunta: '¿Me puedes compartir tu número directo para seguimientos urgentes?',               nivel: 'critico' })
  if (!c.giro)              gaps.push({ campo: 'Giro / Industria',       pregunta: '¿A qué sector o industria pertenece la empresa?',                                  nivel: 'importante' })
  if (!c.nps_score)         gaps.push({ campo: 'NPS (satisfacción)',     pregunta: '"Del 1 al 10, ¿qué tan probable es que recomienden Callpicker a otra empresa?"',   nivel: 'importante' })
  if (!c.observaciones_kam) gaps.push({ campo: 'Observaciones KAM',     pregunta: '¿Hay compromisos vigentes, situaciones especiales o riesgos que debamos registrar?', nivel: 'importante' })
  if (!c.total_empleados)   gaps.push({ campo: 'No. de empleados',       pregunta: '¿Cuántos empleados tiene la organización en total?',                               nivel: 'deseable' })
  if (!c.num_oficinas)      gaps.push({ campo: 'No. de sitios',          pregunta: '¿En cuántas ubicaciones o sucursales operan con Callpicker?',                     nivel: 'deseable' })
  if (!c.pagina_web)        gaps.push({ campo: 'Sitio web',              pregunta: '¿Cuál es el sitio web de la empresa?',                                            nivel: 'deseable' })
  return gaps
}

function gapScore(c: CuentaFull): number {
  const g = detectDataGaps(c)
  return g.filter(x => x.nivel === 'critico').length * 3 + g.filter(x => x.nivel === 'importante').length
}

// ── Lógica de descripción ─────────────────────────────────────────────────────

function buildDescripcion(
  tipo:             TipoActividad,
  hs:               number,
  semaforo:         string,
  diasSinActividad: number,
  idx:              number,
  cuenta:           CuentaFull,
): string {
  const { empresa, upsell_producto } = cuenta
  const gaps     = detectDataGaps(cuenta)
  const criticos = gaps.filter(g => g.nivel === 'critico')

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

  switch (tipo) {

    case 'validacion': {
      const noDeseable = gaps.filter(g => g.nivel !== 'deseable').slice(0, 5)
      const intro = criticos.length > 0
        ? `El perfil de ${empresa} tiene ${gaps.length} campo(s) incompleto(s), incluidos ${criticos.length} CRÍTICO(S) para análisis de riesgo.`
        : `El perfil de ${empresa} tiene ${gaps.length} campo(s) sin registrar que limitan la previsión de riesgo.`
      return `COMPLETAR PERFIL — ${empresa}

${intro} En tu próxima interacción OBTÉN y registra en el sistema:

${noDeseable.map((g, i) => `${i + 1}. ${g.campo.toUpperCase()}: "${g.pregunta}"`).join('\n')}

Actualiza en: Dashboard → Cuentas → ${empresa} → Editar. Sin este perfil completo no podemos predecir churn ni detectar oportunidades de expansión.`
    }

    case 'reunion':
      if (hs < 40) {
        return [
          `REUNIÓN DE RESCATE — ${empresa} (HS: ${hs}). LLEVAR PREPARADO: (1) reporte de uso últimas 4 semanas, (2) tickets abiertos con tiempo sin respuesta, (3) compromisos de sesiones anteriores. OBJETIVOS: identificar causa raíz del deterioro y definir plan de acción con fechas. Si hay señal de churn → escalar a supervisión en < 24h.${capturaStr}`,
          `REUNIÓN DE ESTABILIZACIÓN — ${empresa} (HS: ${hs}). El health score indica riesgo activo. Presenta situación actual, riesgos identificados y plan de recuperación con fechas comprometidas. Involucra al área técnica si hay incidencias sin resolver > 72h. Cierra la reunión con acuerdos documentados y próxima fecha.${capturaStr}`,
        ][idx % 2]
      }
      return [
        `REUNIÓN ESTRATÉGICA — ${empresa}. Presentar: (1) métricas de adopción del periodo — usuarios activos, módulos utilizados, calidad de llamadas; (2) comparativa vs. período anterior; (3) oportunidades de optimización no exploradas; (4) roadmap relevante para sus casos de uso. Cierra con acuerdos y próxima revisión agendada.${capturaStr}`,
        `REUNIÓN DE RESULTADOS — ${empresa}. Lleva el reporte del mes: volumen de llamadas, tasa de resolución en primer contacto, tiempo promedio de atención y SLA. Pide retroalimentación explícita y registra el NPS verbal (1-10). ${modsStr} Alinea expectativas para el siguiente ciclo.${capturaStr}`,
      ][idx % 2]

    case 'upsell':
      return [
        `PROPUESTA DE EXPANSIÓN — ${empresa} → ${upsell_producto ?? 'nueva solución'}. PREPARA: (1) business case con ROI estimado o ahorro en eficiencia, (2) 2-3 casos de éxito de clientes similares, (3) condiciones de implementación y timeline, (4) oferta de piloto sin riesgo si el cliente duda. OBJETIVO: definir próximo paso concreto — demo, aprobación presupuesto o reunión con decisor.${capturaStr}`,
        `ACERCAMIENTO EXPANSIÓN — ${empresa} → ${upsell_producto ?? 'nueva línea'}. Primero confirma que conoces cómo usan la plataforma HOY. Identifica al decisor presupuestal, prepara argumentos de valor diferenciado y busca agendar una sesión de descubrimiento. No propongas precio sin antes entender el caso de uso y el tamaño de la oportunidad.${capturaStr}`,
      ][idx % 2]

    case 'analisis':
      return [
        `ANÁLISIS DE ADOPCIÓN — ${empresa}. Revisa en el dashboard ANTES de cualquier contacto: (1) usuarios activos esta semana vs. semana anterior, (2) variación de llamadas atendidas vs. rechazadas, (3) ${modsStr} Prepara 3 hallazgos concretos para llevar a la siguiente interacción con el cliente.${capturaStr}`,
        `REVISIÓN DE CALIDAD — ${empresa}. Analiza 3 grabaciones recientes: identifica patrones de uso, formas de escalamiento y frecuencia de errores. Puntúa en criterios SAC. Prepara resumen con: (a) 2 buenas prácticas del equipo, (b) 2 áreas de mejora con ejemplo concreto, (c) recomendación de capacitación si aplica.${capturaStr}`,
        `REPORTE EJECUTIVO — ${empresa}. Genera el reporte del período: volumen de llamadas, tasa de resolución en primer contacto, tiempo promedio de atención, SLA cumplido/incumplido y comparativa mensual. Envía por correo al responsable de la cuenta antes del cierre de semana y documenta su respuesta.${capturaStr}`,
        `DIAGNÓSTICO DE SLA — ${empresa}. Verifica tiempos de respuesta, resolución de incidencias y uptime del último mes. Si el SLA fue incumplido en > 1 ocasión → prepara plan de mejora para presentar en la próxima interacción. Registra hallazgos en el sistema. ${modsStr}${capturaStr}`,
      ][idx % 4]

    case 'kam':
      return [
        `REGISTRO KAM — ${empresa}. Actualiza el campo Observaciones KAM con: (1) estado de la relación (positivo/neutral/en riesgo), (2) compromisos de la última interacción y cuáles se cumplieron, (3) riesgos detectados — cambios en equipo, presupuesto o competencia mencionada, (4) próximos pasos con fecha. Sin este registro la cuenta queda ciega para supervisión y handover.${capturaStr}`,
        `VALIDAR TICKETS — ${empresa}. Abre la plataforma de soporte y revisa tickets activos. Identifica el más crítico por tiempo sin resolución. Si supera 48h sin respuesta → escalar inmediatamente y notificar al cliente. Registra estado en el sistema y actualiza Observaciones KAM.${capturaStr}`,
        `ACTUALIZACIÓN DE RELACIÓN — ${empresa}. Revisa compromisos de la última sesión: ¿cuáles se cumplieron? ¿cuáles están pendientes? Documenta nivel de satisfacción percibida y cualquier señal de riesgo u oportunidad. Esta información alimenta directamente el health score y la previsión de churn.${capturaStr}`,
      ][idx % 3]

    case 'llamada':
    default:
      if (semaforo === 'naranja' || semaforo === 'rojo') {
        return [
          `LLAMADA DE RETENCIÓN URGENTE — ${empresa} (HS: ${hs}). OBJETIVO: detectar si hay intención de cancelar. Preguntas clave: "¿Qué aspectos no están cumpliendo sus expectativas?" · "¿Ha evaluado alternativas?" · "¿Qué necesitaría para continuar?". Si confirma riesgo → escalar a supervisión en < 24h. Registra resultado en CRM inmediatamente.${capturaStr}`,
          `LLAMADA DE RESCATE — ${empresa} (HS: ${hs}). Identifica la fricción principal: ¿es técnica (fallas, tickets sin resolver), operativa (el equipo no usa bien la plataforma) o relacional (inconformidad con atención)? Ofrece revisión técnica sin costo si hay fallas activas. Compromete fecha concreta de seguimiento y regístrala.${capturaStr}`,
        ][idx % 2]
      }
      if (semaforo === 'amarillo') {
        return [
          `LLAMADA PREVENTIVA — ${empresa} (HS: ${hs}). Valida: (1) ¿Ha habido cambios en el equipo que usa Callpicker? (2) ¿Hay módulos que dejaron de usar recientemente? (3) ¿Existe algún ticket pendiente sin respuesta? Registra acuerdos y próxima fecha de contacto. ${modsStr}${capturaStr}`,
          `LLAMADA DE MONITOREO — ${empresa} (HS: ${hs}, ${diasSinActividad} días sin contacto). Revisa tickets abiertos antes de llamar. Preguntas: "¿Cómo va el equipo con la plataforma?" · "¿Hubo algún cambio en la operación?" · "¿Hay algo en lo que podamos ayudar?". Detecta señal de riesgo antes de que impacte el health score.${capturaStr}`,
        ][idx % 2]
      }
      if (diasSinActividad > 30) {
        return [
          `LLAMADA DE REACTIVACIÓN — ${empresa} (${diasSinActividad} días sin contacto). PRIORIDAD: restablecer comunicación y verificar si cambió el responsable. Preguntas: (1) "¿Siguen usando Callpicker en sus operaciones diarias?" (2) "¿Ha habido cambios en el equipo o en sus necesidades?" (3) "¿Qué podemos mejorar en nuestra cadencia de contacto?". Registra el nombre del nuevo responsable si hubo cambio.${capturaStr}`,
          `CHECK-IN DE REACTIVACIÓN — ${empresa} (${diasSinActividad}+ días sin contacto). El lapso sin contacto es una señal de alerta pasiva. Confirma que el servicio opera bien, verifica si hubo cambio de equipo o prioridades y restablece la cadencia acordando la próxima fecha de contacto antes de colgar.${capturaStr}`,
        ][idx % 2]
      }
      return [
        `LLAMADA DE SEGUIMIENTO — ${empresa}. Agenda: (1) estado del servicio últimas 2 semanas, (2) incidencias o tickets pendientes, (3) satisfacción del equipo — pide un número del 1 al 10, (4) agendar próxima fecha de contacto antes de colgar. Registra resultado completo en el sistema.${capturaStr}`,
        `LLAMADA DE RELACIÓN — ${empresa}. En cuentas saludables el objetivo es profundizar. Explora: (1) nuevos proyectos del cliente que podamos apoyar, (2) módulos de Callpicker que no usan y podrían serles útiles, (3) NPS verbal del 1 al 10. Si el cliente menciona un nuevo caso de uso → documenta como posible oportunidad.${capturaStr}`,
        `CHECK-IN — ${empresa}. Confirma 3 cosas: (1) el servicio opera sin problemas técnicos, (2) no hay tickets sin respuesta > 48h, (3) el responsable actual es quien esperamos. Si cambió el interlocutor → actualiza el perfil de la cuenta y agenda reunión de presentación formal.${capturaStr}`,
      ][idx % 3]
  }
}

// ── Generador principal ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { asesor, semana: semanaParam, sendEmail = false, testEmail } = body as {
      asesor: string; semana?: string; sendEmail?: boolean; testEmail?: string
    }
    if (!asesor) return NextResponse.json({ error: 'asesor requerido' }, { status: 400 })

    const monday       = semanaParam ? new Date(semanaParam + 'T12:00:00') : getMondayOfWeek(new Date())
    const semanaInicio = toISO(getMondayOfWeek(monday))

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
        upsell_producto, crossell_producto, dias_sin_actividad,
        contacto_nombre, contacto_cargo, contacto_tel,
        giro, pagina_web, total_empleados, num_oficinas,
        nps_score, notas, observaciones_kam,
        score_adopcion, tiene_chat_activo, tiene_integracion_api, tiene_pago_automatico
      `)
      .eq('asesor', asesor)
      .in('estado', ['activo', 'en_riesgo'])
      .order('health_score', { ascending: true })

    if (cErr || !cuentas?.length)
      return NextResponse.json({ error: 'No se encontraron cuentas para este asesor' }, { status: 404 })

    const todas = cuentas as CuentaFull[]

    // Clasificar cuentas por prioridad
    const enRiesgo   = todas.filter(c => c.health_score < 40)
    const observacion = todas.filter(c => c.health_score >= 40 && c.health_score < 60)
    const sinAct     = todas.filter(c => c.health_score >= 60 && c.dias_sin_actividad > 30)
    const conUpsell  = todas.filter(c => c.health_score >= 60 && (c.upsell_producto || c.crossell_producto) && c.dias_sin_actividad <= 30)
    const estables   = todas.filter(c => c.health_score >= 60 && !c.upsell_producto && !c.crossell_producto && c.dias_sin_actividad <= 30)

    // Pool ordenado sin duplicados
    const usedIds = new Set<string>()
    const pool: Array<{ cuenta: CuentaFull; tipo: TipoActividad }> = []

    let ti = 0
    for (const c of enRiesgo) {
      if (!usedIds.has(c.id)) {
        pool.push({ cuenta: c, tipo: ti++ % 2 === 0 ? 'reunion' : 'llamada' })
        usedIds.add(c.id)
      }
    }
    ti = 0
    const obsRotation: TipoActividad[] = ['llamada', 'analisis', 'kam']
    for (const c of observacion) {
      if (!usedIds.has(c.id)) {
        pool.push({ cuenta: c, tipo: obsRotation[ti++ % obsRotation.length] })
        usedIds.add(c.id)
      }
    }
    ti = 0
    for (const c of sinAct) {
      if (!usedIds.has(c.id)) {
        pool.push({ cuenta: c, tipo: ti++ % 2 === 0 ? 'llamada' : 'reunion' })
        usedIds.add(c.id)
      }
    }
    ti = 0
    for (const c of conUpsell) {
      if (!usedIds.has(c.id)) {
        pool.push({ cuenta: c, tipo: ti++ % 2 === 0 ? 'upsell' : 'analisis' })
        usedIds.add(c.id)
      }
    }
    ti = 0
    const estabRotation: TipoActividad[] = ['analisis', 'kam', 'llamada', 'analisis', 'kam']
    for (const c of estables) {
      if (!usedIds.has(c.id)) {
        pool.push({ cuenta: c, tipo: estabRotation[ti++ % estabRotation.length] })
        usedIds.add(c.id)
      }
    }

    if (!pool.length) return NextResponse.json({ error: 'No hay cuentas para generar actividades' }, { status: 400 })

    // Inyectar actividades de validación de datos en el miércoles (posición 4-5 del pool)
    // Solo para cuentas con datos críticos faltantes (score ≥ 2 = 1 crítico o 2 importantes)
    const conGaps = Array.from(todas)
      .map(c => ({ cuenta: c, score: gapScore(c) }))
      .filter(x => x.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)

    if (conGaps.length > 0) {
      const insertAt = Math.min(4, pool.length)
      const validacionItems = conGaps.map(({ cuenta }) => ({ cuenta, tipo: 'validacion' as TipoActividad }))
      pool.splice(insertAt, 0, ...validacionItems)
    }

    // Generar 2 actividades por día hábil (Lun–Vie = 10 actividades)
    const rows: ActividadRow[] = []
    let poolIdx = 0

    for (let d = 0; d < 5; d++) {
      const dia = new Date(monday)
      dia.setDate(monday.getDate() + d)
      const fechaProg = toISO(dia)
      const fechaVenc = toISO(addBusinessDays(dia, 3))

      for (let a = 0; a < 2; a++) {
        const { cuenta, tipo } = pool[poolIdx % pool.length]
        const idx = poolIdx
        poolIdx++

        const hs       = cuenta.health_score
        const semaforo = hs >= 80 ? 'verde' : hs >= 60 ? 'azul' : hs >= 40 ? 'amarillo' : hs >= 20 ? 'naranja' : 'rojo'
        const prioridad: Prioridad = tipo === 'validacion' ? 'media' : hs < 40 ? 'alta' : hs < 60 ? 'media' : 'baja'

        rows.push({
          asesor,
          cuenta_id:        cuenta.id,
          cid:              cuenta.cid,
          consecutivo:      cuenta.consecutivo,
          empresa:          cuenta.empresa,
          tipo,
          descripcion:      buildDescripcion(tipo, hs, semaforo, cuenta.dias_sin_actividad ?? 0, idx, cuenta),
          prioridad,
          fecha_programada: fechaProg,
          fecha_vencimiento:fechaVenc,
          semana_inicio:    semanaInicio,
          estado:           'pendiente',
          semaforo_cuenta:  semaforo,
          hs_cuenta:        hs,
        })
      }
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('actividades')
      .insert(rows)
      .select()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    if (sendEmail) await sendActividadesEmail(asesor, rows as AnyAct[], semanaInicio, testEmail)

    return NextResponse.json({
      generadas:    inserted?.length ?? 0,
      semanaInicio,
      emailEnviado: sendEmail,
      actividades:  inserted,
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
                  Vence: ${dv ? `${DIAS[dv.getDay()]} ${dv.getDate()} ${MESES[dv.getMonth()]}` : '—'} · 3 días hábiles
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
        <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:5px 0 0">${fechaLabel} · 10 actividades · Lunes a viernes · 2 por día</p>
      </div>
      <div style="padding:16px 28px;background:#EFF6FF;border-left:4px solid ${ac.color};border-bottom:1px solid #BFDBFE">
        <p style="margin:0;font-size:13px;color:#1E40AF">
          Hola <strong>${ac.fullName.split(' ')[0]}</strong>, estas son tus actividades SAC para esta semana.
          Cada actividad tiene <strong>3 días hábiles</strong> para completarse. Las actividades <strong style="color:#DC2626">⚠️ Completar Perfil</strong> requieren actualizar datos en el sistema tras la interacción.
        </p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${daysHtml}
      </table>
      <div style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;border-radius:0 0 12px 12px">
        <p style="margin:0;color:#64748B;font-size:12px">
          ⛔ Las actividades no completadas en plazo quedan en <strong style="color:#EF4444">rojo bloqueado</strong>.
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
