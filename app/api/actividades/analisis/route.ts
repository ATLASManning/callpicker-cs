import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ticketStatsCuenta } from '@/lib/tickets-cuenta'
import { headers } from 'next/headers'
import OpenAI from 'openai'

export const dynamic    = 'force-dynamic'
export const maxDuration = 55

// ── Prompt del analista SAC ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el motor de inteligencia del equipo de Customer Success de Callpicker.
Tu función principal NO es generar reportes pasivos. ES leer los datos de la plataforma y devolver INSTRUCCIONES CONCRETAS Y PRIORIZADAS al asesor de SAC para que actúe HOY.

════════════════════════════════════════════════════════════════
PASO 1 — DIAGNÓSTICO DE COMPLETITUD
════════════════════════════════════════════════════════════════
Para cada cuenta, evalúa si los campos críticos están llenos. Márcalos como CAMPO ROTO si están vacíos o con valor genérico:
  [ ] Health Score calculado
  [ ] Semáforo actualizado en últimos 30 días
  [ ] Próxima fecha de contacto agendada
  [ ] Decisor/contacto clave confirmado
  [ ] Giro o industria registrada
  [ ] Último acuerdo de seguimiento documentado
  [ ] NPS registrado
  [ ] Observaciones KAM documentadas

Salida: tabla cuenta | campos rotos | score completitud (0–8)
Incluye preguntas exactas en guion de SAC para reparar cada campo roto, en primera persona y tono profesional.

════════════════════════════════════════════════════════════════
PASO 2 — PREVISIÓN DE RIESGO POR CUENTA
════════════════════════════════════════════════════════════════
Nivel de riesgo:
  🔴 CRÍTICO: HS < 50 | tickets repetidos sin resolución | caída facturación > 15% | >21 días sin contacto | MRR cancelado
  🟡 ALERTA:  HS 50–65 | 1–2 fallas en 30 días | variación -5% a -15% | 8–20 días sin contacto
  🟢 ESTABLE: HS > 65 | tickets normales | facturación estable | contacto reciente

Para cada cuenta 🔴 o 🟡 genera una WARNING CARD compacta con: cuenta, HS, riesgo, motivo principal, señal más preocupante, ventana para actuar, canal recomendado.

════════════════════════════════════════════════════════════════
PASO 3 — INSTRUCCIÓN QUIRÚRGICA AL ASESOR
════════════════════════════════════════════════════════════════
Para cuentas 🔴 y las top 3 en 🟡, genera bloque completo:
  • OBJETIVO de la interacción (una frase)
  • CONTEXTO RÁPIDO (HS, facturación, tickets, último contacto)
  • GUION para llamada/chat (apertura, 2-3 preguntas de sondeo, propuesta de acción inmediata, cierre con compromiso)
  • CAMPOS A ACTUALIZAR en CRM al terminar (campo exacto + valor)
  • MÉTRICAS DE ÉXITO (cómo saber que la acción funcionó en 14 días)

════════════════════════════════════════════════════════════════
PASO 4 — OPORTUNIDADES DE UPSELL / CROSS-SELL
════════════════════════════════════════════════════════════════
Para cuentas con HS ≥ 70 y facturación estable o creciente:
  • Identifica producto/plan más adecuado según giro, tamaño, canales activos
  • Propuesta de 3 líneas para el asesor
  • Script de apertura de la conversación de upsell

════════════════════════════════════════════════════════════════
PASO 5 — COACHING AL ASESOR
════════════════════════════════════════════════════════════════
Basándote en seguimientos y actividades registradas:
  ✅ Qué está haciendo bien (con ejemplo concreto)
  ❌ Qué debe dejar de hacer
  ➕ Qué debe empezar a hacer en cada interacción
  📋 Qué registros tiene incompletos esta semana (lista exacta)
  🎯 Una prioridad de acción para las próximas 24 h

Si no hay datos suficientes: "DATOS INSUFICIENTES — el asesor no registró notas en X interacciones de los últimos 7 días."

════════════════════════════════════════════════════════════════
FORMATO DE SALIDA (en este orden exacto)
════════════════════════════════════════════════════════════════

## RESUMEN EJECUTIVO
[5 bullets concisos sobre el estado de la cartera]

## TABLA DE PRIORIDADES
| Cuenta | HS | Semáforo | Riesgo | Acción inmediata | Canal | Plazo |
|---|---|---|---|---|---|---|
[filas]

## WARNING CARDS
[solo cuentas 🔴 y 🟡]

## INSTRUCCIONES QUIRÚRGICAS
[solo cuentas alta prioridad]

## OPORTUNIDADES DE UPSELL
[top 3]

## COACHING AL ASESOR
[feedback táctico]

REGLA DE ORO: Si los datos tienen campos vacíos, NO asumas. Indica qué falta y genera la pregunta exacta para obtenerlo. EL OBJETIVO PRINCIPAL ES PREVENIR CHURN. Las cuentas con MRR alto y HS bajo son PRIORIDAD ABSOLUTA.

Responde en español. Sé específico y accionable. No repitas datos sin agregar análisis.`

// ── Construcción del contexto ─────────────────────────────────────────────────

function buildContext(asesor: string, cuentas: Record<string, unknown>[], seguimientos: Record<string, unknown>[], actividades: Record<string, unknown>[]): string {
  const today = new Date().toISOString().split('T')[0]

  let ctx = `ANALISTA SAC — CARTERA DE ${asesor.toUpperCase()}\nFECHA: ${today}\nTOTAL CUENTAS: ${cuentas.length}\n\n`
  ctx += '═'.repeat(60) + '\nCUENTAS (ordenadas por Health Score ascendente)\n' + '═'.repeat(60) + '\n\n'

  for (const c of cuentas) {
    const hs  = Number(c.health_score ?? 50)
    const sem = hs >= 80 ? 'VERDE' : hs >= 60 ? 'AZUL' : hs >= 40 ? 'AMARILLO' : hs >= 20 ? 'NARANJA' : 'ROJO'
    const fac = Number(c.facturacion ?? 0)
    const dias = Number(c.dias_sin_actividad ?? 0)

    ctx += `[${c.consecutivo}] ${c.empresa}\n`
    ctx += `  HS: ${hs} | Semáforo: ${sem} | Estado: ${c.estado}\n`
    ctx += `  Facturación MRR: $${fac.toLocaleString('es-MX')} | Días sin contacto: ${dias}\n`

    // Sub-scores
    const sa = c.score_actividad, so = c.score_adopcion, sp = c.score_pago, sr = c.score_relacional
    ctx += `  Sub-scores → Actividad: ${sa ?? '?'} | Adopción: ${so ?? '?'} | Pago: ${sp ?? '?'} | Relacional: ${sr ?? '?'}\n`

    // Tickets
    ctx += `  Tickets abiertos: ${ticketStatsCuenta(c.cid ?? null, c.empresa).abiertos} | Ticket reincidente: ${c.tiene_ticket_reincidente ? 'SÍ ⚠' : 'No'}\n`

    // Data gaps
    const rotos: string[] = []
    if (!c.contacto_nombre)   rotos.push('contacto')
    if (!c.giro)              rotos.push('giro')
    if (!c.nps_score)         rotos.push('NPS')
    if (!c.observaciones_kam) rotos.push('observaciones KAM')
    if (!c.proximo_contacto)  rotos.push('próxima cita agendada')
    if (rotos.length > 0) ctx += `  ⚠ CAMPOS ROTOS: ${rotos.join(', ')}\n`

    // Contact
    if (c.contacto_nombre) ctx += `  Contacto: ${c.contacto_nombre}${c.contacto_cargo ? ` (${c.contacto_cargo})` : ''}\n`
    if (c.giro)            ctx += `  Giro: ${c.giro}\n`
    if (c.nps_score)       ctx += `  NPS: ${c.nps_score}/10\n`

    // Notes
    if (c.observaciones_kam) ctx += `  KAM: ${String(c.observaciones_kam).slice(0, 150)}\n`
    if (c.notas)             ctx += `  Notas: ${String(c.notas).slice(0, 120)}\n`

    // Opportunities
    if (c.upsell_producto)   ctx += `  Oportunidad upsell: ${c.upsell_producto}${c.valor_upsell_estimado ? ` ($${Number(c.valor_upsell_estimado).toLocaleString('es-MX')})` : ''}\n`
    if (c.crossell_producto) ctx += `  Oportunidad cross-sell: ${c.crossell_producto}\n`

    // Modules
    const mods: string[] = []
    if (c.tiene_chat_activo)     mods.push('chat')
    if (c.tiene_integracion_api) mods.push('API')
    if (c.tiene_pago_automatico) mods.push('pago-auto')
    if (c.tiene_ia_voz)          mods.push('IA-voz')
    if (c.tiene_ia_chat)         mods.push('IA-chat')
    ctx += `  Módulos activos: ${mods.length > 0 ? mods.join(', ') : 'ninguno'}\n`

    // Dates
    if (c.ultimo_contacto)  ctx += `  Último contacto: ${c.ultimo_contacto}\n`
    if (c.proximo_contacto) ctx += `  Próxima cita: ${c.proximo_contacto}\n`

    // Recent seguimientos (max 3 per account)
    const segs = seguimientos.filter(s => s.cuenta_id === c.id).slice(0, 3)
    if (segs.length > 0) {
      ctx += `  Seguimientos recientes:\n`
      for (const s of segs) {
        const desc = String(s.descripcion ?? '').slice(0, 100)
        const res  = s.resultado ? ` → ${String(s.resultado).slice(0, 60)}` : ''
        ctx += `    • [${s.fecha}] ${s.tipo}: ${desc}${res}\n`
      }
    } else {
      ctx += `  Seguimientos: NINGUNO registrado en últimos 30 días\n`
    }

    ctx += '\n'
  }

  // Activities summary
  const actComp = actividades.filter(a => a.completada)
  const actPend = actividades.filter(a => !a.completada)

  if (actComp.length > 0) {
    ctx += '\n' + '─'.repeat(50) + '\nACTIVIDADES COMPLETADAS (últimos 30 días)\n' + '─'.repeat(50) + '\n'
    for (const a of actComp.slice(0, 8)) {
      const res = a.resultado ? String(a.resultado).slice(0, 80) : 'sin resultado registrado'
      ctx += `  [${a.fecha_programada}] ${a.empresa} | ${a.tipo}: ${res}\n`
    }
  }

  if (actPend.length > 0) {
    ctx += '\n' + '─'.repeat(50) + '\nACTIVIDADES PENDIENTES / NO REALIZADAS\n' + '─'.repeat(50) + '\n'
    for (const a of actPend.slice(0, 8)) {
      const mot = a.motivo_pendiente ? ` ← MOTIVO: ${String(a.motivo_pendiente).slice(0, 60)}` : ''
      ctx += `  [${a.fecha_programada}] ${a.empresa} | ${a.tipo}${mot}\n`
    }
  }

  return ctx
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const h       = headers()
    const rol     = h.get('x-user-rol') ?? 'viewer'
    const asesorH = decodeURIComponent(h.get('x-user-asesor') ?? '')

    const body   = await req.json()
    const { asesor } = body as { asesor: string }

    if (!asesor) return NextResponse.json({ error: 'asesor requerido' }, { status: 400 })
    if (rol === 'asesor' && asesorH !== asesor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY no configurado en Vercel' }, { status: 503 })

    const hace30 = new Date()
    hace30.setDate(hace30.getDate() - 30)
    const desde30 = hace30.toISOString().split('T')[0]

    const [cuentasRes, seguimientosRes, actividadesRes] = await Promise.all([
      supabaseAdmin
        .from('cuentas')
        .select(`
          id, consecutivo, cid, empresa, health_score, estado, facturacion, dias_sin_actividad,
          contacto_nombre, contacto_cargo, giro, nps_score, notas, observaciones_kam,
          tickets_abiertos, tiene_ticket_reincidente,
          score_actividad, score_adopcion, score_pago, score_relacional,
          upsell_producto, crossell_producto, valor_upsell_estimado,
          tiene_chat_activo, tiene_integracion_api, tiene_pago_automatico, tiene_ia_voz, tiene_ia_chat,
          ultimo_contacto, proximo_contacto
        `)
        .eq('asesor', asesor)
        .in('estado', ['activo', 'en_riesgo'])
        .order('health_score', { ascending: true }),

      supabaseAdmin
        .from('seguimientos')
        .select('cuenta_id, fecha, tipo, descripcion, resultado')
        .gte('fecha', desde30)
        .order('fecha', { ascending: false })
        .limit(80),

      supabaseAdmin
        .from('actividades')
        .select('empresa, tipo, descripcion, resultado, motivo_pendiente, completada, estado, fecha_programada')
        .eq('asesor', asesor)
        .gte('fecha_programada', desde30)
        .order('fecha_programada', { ascending: false })
        .limit(30),
    ])

    const cuentas      = (cuentasRes.data ?? []) as Record<string, unknown>[]
    const seguimientos = (seguimientosRes.data ?? []) as Record<string, unknown>[]
    const actividades  = (actividadesRes.data ?? []) as Record<string, unknown>[]

    if (!cuentas.length) return NextResponse.json({ error: 'No se encontraron cuentas activas' }, { status: 404 })

    const context = buildContext(asesor, cuentas, seguimientos, actividades)

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model:      'gpt-4o-mini',
      max_tokens: 3500,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Ejecuta el análisis completo de 5 pasos para la cartera de ${asesor}. Sé específico, directo y accionable:\n\n${context}`,
        },
      ],
    })

    const analisis = completion.choices[0]?.message?.content ?? ''

    return NextResponse.json({
      asesor,
      generado_en:       new Date().toISOString(),
      analisis,
      cuentas_analizadas: cuentas.length,
      tokens_usados:      completion.usage?.total_tokens ?? 0,
    })
  } catch (e) {
    console.error('[analisis-sac]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
