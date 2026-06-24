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

type TipoActividad = 'llamada' | 'reunion' | 'analisis' | 'kam' | 'upsell'
type Prioridad     = 'alta' | 'media' | 'baja'

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
  llamada:  { label: 'Llamada',             emoji: '📞' },
  reunion:  { label: 'Reunión',             emoji: '📊' },
  analisis: { label: 'Análisis / Reporte',  emoji: '📈' },
  kam:      { label: 'Seguimiento KAM',     emoji: '📝' },
  upsell:   { label: 'Propuesta Expansión', emoji: '🚀' },
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const DIAS  = ['dom','lun','mar','mié','jue','vie','sáb']

// ── Lógica de descripción ─────────────────────────────────────────────────────

function buildDescripcion(
  tipo:             TipoActividad,
  empresa:          string,
  hs:               number,
  semaforo:         string,
  upsell:           string | null,
  diasSinActividad: number,
  idx:              number,
): string {
  switch (tipo) {

    case 'reunion':
      if (hs < 40) {
        const v = [
          `Reunión urgente de diagnóstico con ${empresa} (HS: ${hs}). Revisar causa raíz del deterioro, validar tickets críticos abiertos en soporte y definir plan de acción con fechas comprometidas. Escalar si hay señal de churn.`,
          `Reunión de rescate con ${empresa} (HS: ${hs} — En Riesgo). Presentar situación actual de la cuenta, compromisos pendientes y plan de estabilización. Involucrar a área técnica si hay incidencias no resueltas.`,
        ]
        return v[idx % v.length]
      }
      return [
        `Reunión de revisión estratégica con ${empresa}. Presentar métricas de adopción del periodo, módulos con menor uso y oportunidades de optimización. Confirmar acuerdos y próximos pasos.`,
        `Reunión de resultados con ${empresa}. Mostrar reporte del mes: volumen de llamadas, calidad, tiempos de atención y comparativa vs. periodo anterior. Alinear expectativas para el siguiente ciclo.`,
      ][idx % 2]

    case 'upsell':
      return [
        `Presentar propuesta de expansión a ${empresa}${upsell ? ` — ${upsell}` : ''}. Preparar business case con ROI estimado, casos de éxito de clientes similares y condiciones de implementación. Confirmar reunión de decisión esta semana.`,
        `Acercamiento de expansión con ${empresa}${upsell ? ` — ${upsell}` : ''}. Identificar el área con mayor potencial de crecimiento, preparar argumentos de valor diferenciado y agendar demo o presentación ejecutiva.`,
      ][idx % 2]

    case 'analisis':
      return [
        `Analizar métricas de adopción de ${empresa}: usuarios activos, módulos con menor uso y tasas de conversión de llamadas. Preparar reporte ejecutivo con recomendaciones de optimización para compartir esta semana.`,
        `Revisar grabaciones recientes de ${empresa}. Seleccionar 3 llamadas representativas, identificar patrones de uso y áreas de mejora. Preparar resumen para compartir con el responsable de la cuenta.`,
        `Preparar análisis de calidad de interacciones para ${empresa}. Evaluar llamadas del periodo, puntuar en base a criterios SAC e incluir 3 buenas prácticas y 2 áreas de mejora con ejemplos concretos.`,
        `Generar reporte mensual de resultados para ${empresa}: volumen de llamadas, tasa de resolución en primer contacto, tiempo promedio de atención y cumplimiento de SLA. Enviar antes del cierre de semana.`,
        `Revisión de SLA con ${empresa}. Verificar tiempos de respuesta, resolución de incidencias y uptime del último mes. Documentar desviaciones y preparar comunicado con plan de mejora si se detectan brechas.`,
      ][idx % 5]

    case 'kam':
      return [
        `Registrar actividad KAM para ${empresa}. Documentar estado actual de la relación, acuerdos vigentes, riesgos identificados y próximos pasos con fechas concretas. Actualizar semáforo de salud en el sistema.`,
        `Validar tickets abiertos de ${empresa} en la plataforma de soporte. Identificar el ticket más crítico y su tiempo sin respuesta. Escalar si supera 48h sin resolución y registrar en seguimiento KAM.`,
        `Actualización de registro KAM para ${empresa}. Revisar compromisos de la última sesión, confirmar cuáles se cumplieron y cuáles están pendientes. Documentar estado de satisfacción y nivel de riesgo actual.`,
      ][idx % 3]

    case 'llamada':
    default:
      if (semaforo === 'naranja' || semaforo === 'rojo') {
        return [
          `Llamada urgente de retención con ${empresa} (HS: ${hs}). Confirmar continuidad del servicio, identificar la fricción principal y ofrecer revisión técnica sin costo. Escalar a supervisión si hay señal de churn inminente.`,
          `Llamada de rescate con ${empresa} (HS: ${hs} — En Riesgo). Identificar causa raíz del deterioro, revisar el ticket más crítico abierto en soporte y definir acuerdos concretos con fecha de seguimiento comprometida.`,
        ][idx % 2]
      }
      if (semaforo === 'amarillo') {
        return [
          `Llamada preventiva con ${empresa} (HS: ${hs}). Indagar cambios recientes en operación, revisar tickets pendientes en soporte y validar si el equipo está aprovechando correctamente la plataforma.`,
          `Llamada de monitoreo con ${empresa} (HS: ${hs}). Verificar satisfacción del equipo, revisar el ticket abierto más antiguo y detectar si hubo cambios en el responsable de la cuenta.`,
          `Revisión de adopción con ${empresa} (HS: ${hs}). Validar qué módulos se usan menos, si hay usuarios inactivos y qué bloqueos operativos existen. Registrar acuerdos y compromisos en el sistema.`,
        ][idx % 3]
      }
      if (diasSinActividad > 30) {
        return [
          `Llamada de reactivación con ${empresa} (${diasSinActividad}+ días sin contacto). Recuperar comunicación activa, identificar si hubo cambios en el equipo y confirmar cadencia de seguimiento.`,
          `Check-in con ${empresa} — más de ${diasSinActividad} días sin contacto. Validar satisfacción actual, identificar necesidades no atendidas y restablecer relación con el responsable de la cuenta.`,
        ][idx % 2]
      }
      return [
        `Llamada de seguimiento con ${empresa}. Verificar estado del servicio, incidencias pendientes, nivel de satisfacción del equipo y agendar próximo punto de contacto.`,
        `Llamada de relación con ${empresa}. Indagar cómo usa la plataforma el equipo operativo, qué funcionalidades aprovecha menos y si hay nuevas necesidades no documentadas.`,
        `Check-in con ${empresa}. Confirmar que el servicio opera correctamente, revisar si hay tickets sin respuesta y explorar oportunidades de mejora en los flujos actuales.`,
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

    const monday      = semanaParam ? new Date(semanaParam + 'T12:00:00') : getMondayOfWeek(new Date())
    const semanaInicio = toISO(getMondayOfWeek(monday))

    // Verificar si ya existen actividades esta semana
    const { data: existing } = await supabaseAdmin
      .from('actividades')
      .select('id')
      .eq('asesor', asesor)
      .eq('semana_inicio', semanaInicio)
      .limit(1)

    if (existing && existing.length > 0) {
      // Ya existen — solo enviar email si se pide
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

    // Obtener cuentas activas/en_riesgo del asesor ordenadas por HS ascendente
    const { data: cuentas, error: cErr } = await supabaseAdmin
      .from('cuentas')
      .select('id, consecutivo, cid, empresa, health_score, estado, upsell_producto, crossell_producto, dias_sin_actividad')
      .eq('asesor', asesor)
      .in('estado', ['activo', 'en_riesgo'])
      .order('health_score', { ascending: true })

    if (cErr || !cuentas?.length)
      return NextResponse.json({ error: 'No se encontraron cuentas para este asesor' }, { status: 404 })

    // Clasificar cuentas por prioridad
    const enRiesgo   = cuentas.filter(c => c.health_score < 40)
    const observacion = cuentas.filter(c => c.health_score >= 40 && c.health_score < 60)
    const sinAct     = cuentas.filter(c => c.health_score >= 60 && c.dias_sin_actividad > 30)
    const conUpsell  = cuentas.filter(c => c.health_score >= 60 && (c.upsell_producto || c.crossell_producto) && c.dias_sin_actividad <= 30)
    const estables   = cuentas.filter(c => c.health_score >= 60 && !c.upsell_producto && !c.crossell_producto && c.dias_sin_actividad <= 30)

    // Pool ordenado sin duplicados — cada tier rota tipos para variedad real
    const usedIds = new Set<string>()
    const pool: Array<{ cuenta: typeof cuentas[0]; tipo: TipoActividad }> = []

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
        const prioridad: Prioridad = hs < 40 ? 'alta' : hs < 60 ? 'media' : 'baja'

        rows.push({
          asesor,
          cuenta_id:        cuenta.id,
          cid:              cuenta.cid,
          consecutivo:      cuenta.consecutivo,
          empresa:          cuenta.empresa,
          tipo,
          descripcion:      buildDescripcion(tipo, cuenta.empresa, hs, semaforo, cuenta.upsell_producto ?? null, cuenta.dias_sin_actividad ?? 0, idx),
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

// Tipo mínimo compatible con ActividadRow y con el retorno de Supabase select(*)
type AnyAct = ActividadRow & { [k: string]: unknown }

async function sendActividadesEmail(
  asesor:       string,
  actividades:  AnyAct[],
  semanaInicio: string,
  testEmail?:   string,          // Si se pasa → email solo a esta dirección (sin CC)
) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[Actividades] Email simulado para ${asesor} — semana ${semanaInicio}`)
    return
  }

  const ac = ASESOR_CONFIG[asesor as keyof typeof ASESOR_CONFIG]
  if (!ac) return

  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

  // Agrupar por día
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
    const d       = new Date(fecha + 'T12:00:00')
    const dayLbl  = `${DIAS[d.getDay()].toUpperCase()} ${d.getDate()} ${MESES[d.getMonth()]}`

    const actsHtml = acts.map(a => {
      const tipo      = String(a.tipo ?? 'llamada') as TipoActividad
      const meta      = TIPO_META[tipo]
      const prioridad = String(a.prioridad ?? 'media')
      const color     = prioridad === 'alta' ? '#EF4444' : prioridad === 'media' ? '#F97316' : '#3B82F6'
      const vence     = String(a.fecha_vencimiento ?? '')
      const dv        = vence ? new Date(vence + 'T12:00:00') : null

      return `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #F1F5F9">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <span style="font-size:20px;flex-shrink:0;margin-top:2px">${meta.emoji}</span>
              <div style="flex:1;min-width:0">
                <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px">
                  <span style="background:${color}18;color:${color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase">${meta.label}</span>
                  <span style="background:#EFF6FF;color:#1B3FCC;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;font-family:monospace">${String(a.consecutivo ?? '')}</span>
                  <span style="font-size:13px;font-weight:700;color:#0F172A">${String(a.empresa ?? '')}</span>
                </div>
                <p style="margin:0 0 4px;color:#475569;font-size:12px;line-height:1.55">${String(a.descripcion ?? '')}</p>
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
      <!-- Header -->
      <div style="background:#0A1628;padding:24px 28px;border-radius:12px 12px 0 0;border-left:4px solid ${ac.color}">
        <p style="color:#fff;font-size:17px;font-weight:800;margin:0">📋 Actividades SAC — ${ac.fullName}</p>
        <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:5px 0 0">${fechaLabel} · 10 actividades · Lunes a viernes · 2 por día</p>
      </div>
      <!-- Intro -->
      <div style="padding:16px 28px;background:#EFF6FF;border-left:4px solid ${ac.color};border-bottom:1px solid #BFDBFE">
        <p style="margin:0;font-size:13px;color:#1E40AF">
          Hola <strong>${ac.fullName.split(' ')[0]}</strong>, estas son tus actividades SAC para esta semana.
          Cada actividad tiene <strong>3 días hábiles</strong> para completarse. Registra tu resultado en el Dashboard.
        </p>
      </div>
      <!-- Tabla de actividades -->
      <table style="width:100%;border-collapse:collapse">
        ${daysHtml}
      </table>
      <!-- Footer -->
      <div style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;border-radius:0 0 12px 12px">
        <p style="margin:0;color:#64748B;font-size:12px">
          ⛔ Las actividades no completadas en plazo quedan en <strong style="color:#EF4444">rojo bloqueado</strong> para revisión de supervisores.
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
