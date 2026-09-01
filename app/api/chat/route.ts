import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { KB } from '@/app/base-cs/kb-data'
import { supabaseAdmin } from '@/lib/supabase'
import { buildAtlasContext, buildCuentaDossier } from '@/lib/atlas-context'
import { Resend } from 'resend'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' })

// ── Serializar KB a texto plano (estático — cargado una vez) ──────────────────
function kbToText(): string {
  const lines: string[] = []
  for (const cat of KB) {
    const arts = cat.articulos.filter(a => a.badge !== 'roto')
    if (!arts.length) continue
    lines.push(`\n## ${cat.label.toUpperCase()}`)
    for (const art of arts) {
      lines.push(`\n### ${art.titulo}`)
      lines.push(art.descripcion)
      if (art.ubicacion)          lines.push(`Ubicacion: ${art.ubicacion}`)
      if (art.utilidad)           lines.push(`Utilidad: ${art.utilidad}`)
      if (art.tarificacion?.length) {
        lines.push('Tarifas:')
        for (const t of art.tarificacion) {
          const tag = t.nivel === 'red' ? '[!]' : t.nivel === 'amber' ? '[i]' : '[ok]'
          lines.push(`  ${tag} ${t.tipo}: ${t.regla}`)
        }
      }
      if (art.modalidades?.length) {
        for (const m of art.modalidades) lines.push(`  - ${m.nombre}: ${m.descripcion}`)
      }
      if (art.funcionamiento?.length) {
        for (const f of art.funcionamiento) lines.push(`  - ${f}`)
      }
      if (art.acciones?.length) lines.push(`Acciones: ${art.acciones.join(' | ')}`)
      if (art.subtitulos?.length) {
        for (const s of art.subtitulos) {
          lines.push(`${s.titulo}:`)
          for (const item of s.items) lines.push(`  - ${item}`)
        }
      }
      if (art.consideraciones?.length) {
        for (const c of art.consideraciones) {
          const tag = c.tipo === 'warning' ? '[!]' : c.tipo === 'error' ? '[x]' : '[i]'
          lines.push(`  ${tag} ${c.texto}`)
        }
      }
      if (art.bloques?.length) {
        for (const b of art.bloques) {
          if (b.tipo === 'parrafo' && b.texto) lines.push(b.texto)
          else if (b.tipo === 'seccion' && b.titulo) lines.push(`** ${b.titulo} **`)
          else if (b.tipo === 'lista' && b.items) b.items.forEach(i => lines.push(`  - ${i}`))
          else if (b.tipo === 'cita' && b.texto)  lines.push(`"${b.texto}"`)
          else if (b.tipo === 'firma' && b.texto) lines.push(`— ${b.texto}`)
        }
      }
    }
  }
  return lines.join('\n')
}

const KB_TEXT = kbToText()

// ── System prompt base (estático) ─────────────────────────────────────────────
const BASE_SYSTEM = `Eres Atlas, el asistente de IA del equipo de Customer Success de Callpicker.

SOBRE CALLPICKER:
Empresa mexicana de telefonia empresarial (cloud PBX / UCaaS), 19 anos en el mercado.
Productos: Extensiones VyC, Callpicker Chat (omnicanalidad), IA de Voz, IA de Chat, Integraciones API, Callpicker Pay, Calltracking.

MODELO DE HEALTH SCORE:
- Bloque A — Actividad en plataforma (35%): login, volumen llamadas, app movil
- Bloque B — Adopcion de features (30%): Chat, grabacion, extensiones, dashboard
- Bloque C — Comportamiento de pago (20%): pagos al corriente, incidencias
- Bloque D — Senales relacionales (15%): responde contactos, tickets abiertos

SEMAFOROS DE SALUD:
- Verde 80-100: Saludable — monitoreo mensual
- Azul 60-79: Estable — check-in mensual
- Amarillo 40-59: Observacion — contacto en 5 dias
- Naranja 20-39: Riesgo — llamada en 48 horas
- Rojo 0-19: Riesgo Alto — intervencion HOY

DATOS CHURN (referencia historica):
- La cancelacion no es un evento — es un proceso de 30-60 dias.
- 32% cancela por uso no sostenido. 18.6% por problemas de pago (recuperable).
- 40% del churn ocurre en clientes de mas de 24 meses de antiguedad.
- GRC (Gross Revenue Churn) 2026 acumulado: ~13.1% al corte julio.

ACTIVACIONES:
- Total activaciones registradas: 2,601 (2023-2026) por $2,813,402 MXN.
- Promedio dias de activacion: ~21.6 dias. Solo 21% se activa en <= 7 dias (SLA ideal).
- Ejecutivos de activacion: Pepe Tono, Cecilia, Ricardo, Enrique, Tono del Rio.

OPORTUNIDADES DE UPSELL/CROSS-SELL:
- Upsell: mas extensiones, mas minutos, IA de voz, Callcenter
- Cross-sell: Callpicker Chat, Callpicker Pay, Integraciones API, modulo de IA

─────────────────────────────────────────────────────
BASE DE CONOCIMIENTO — PRODUCTOS Y FUNCIONALIDADES
─────────────────────────────────────────────────────
${KB_TEXT}
─────────────────────────────────────────────────────

FORMATO DE RESPUESTA OBLIGATORIO — responde SIEMPRE con JSON valido, sin texto fuera del JSON:
{
  "reply": "Tu respuesta aqui — usa saltos de linea y bullets con • para listas. Sin markdown con asteriscos.",
  "tipo": "normal",
  "motivo_pendiente": null,
  "confianza": "alta"
}

Valores posibles:
- "tipo": "normal" | "pendiente" | "requiere_busqueda_web"
- "confianza": "alta" | "media" | "baja"

REGLAS DE TIPO:
- "normal": tienes la informacion y puedes responder con confianza.
- "pendiente": la pregunta es sobre datos especificos que no tienes disponibles (un cliente en particular fuera del contexto, cifras exactas no cargadas, etc). En reply di: "No tengo esa informacion disponible en este momento. He registrado tu consulta — te responderemos a la brevedad." Rellena motivo_pendiente con que falta.
- PROHIBIDO usar "pendiente" cuando el contexto incluya un bloque "DOSSIER DE CUENTA": esa cuenta SI existe en la cartera. Responde tipo "normal" con los datos del dossier, y si el dossier esta incompleto lo dices explicitamente (ver CALIDAD DE DATOS) — pero jamas contestes que no tienes la informacion.
- "requiere_busqueda_web": la pregunta requiere informacion de internet (precios de competidores, noticias del mercado, normativa vigente, empresas externas). En reply di: "Para responder esto con precision necesito buscar informacion actualizada en internet. He registrado la consulta — josel@callpicker.com autorizara la busqueda y te enviamos la respuesta."

REGLAS DE RESPUESTA:
- Responde siempre en espanol, de forma concisa y accionable.
- Cuando sugieras contacto con cliente, incluye un script de WhatsApp o llamada.
- NO inventes precios, cifras tecnicas ni funcionalidades fuera de tu contexto.
- Usa "confianza":"baja" cuando respondas con datos aproximados o incompletos.
- Para preguntas sobre una cuenta especifica: usa PRIMERO el bloque "DOSSIER DE CUENTA" si existe; despues el contexto de cuentas activas y auditorias.

OFERTA DE PORTAFOLIO — cuando pregunten que ofrecer, vender o proponer a una cuenta:
1. Analiza primero el DOSSIER DE CUENTA: que factura, que plan tiene, cuanto consume de su bolsa, que modulos ya usa y cuales no.
2. Propon 2-3 ofertas PRIORIZADAS del portafolio Callpicker, cada una anclada a un dato concreto del dossier. Guia de mapeo:
   - Consumo de minutos >= 85% de la bolsa → ampliar bolsa de minutos o plan superior.
   - Sin Callpicker Chat → omnicanalidad (WhatsApp, Messenger, webchat) para su operacion.
   - Sin Integraciones API y giro que opera con CRM/ERP → integracion con su sistema.
   - Sin Pago automatico o con incidencias de pago → Callpicker Pay / cobro automatico.
   - Alto volumen de llamadas o atencion fuera de horario → IA de Voz.
   - Tiene Chat activo pero sin IA de Chat → IA de Chat.
   - Uso principal de llamadas ventas/marketing → Calltracking.
3. Cada oferta lleva: producto, razon anclada al dato ("consume el 92% de su bolsa"), y siguiente paso para el asesor.
4. Cierra con un script corto de WhatsApp o llamada para abrir la conversacion con el cliente.

CALIDAD DE DATOS (obligatorio):
- Si el DOSSIER marca "CALIDAD DE DATOS...: INCOMPLETA", tu respuesta DEBE cerrar con una seccion "Para afinar esta recomendacion:" listando lo que falta capturar en la cuenta (actividades SAC, seguimientos, Radar X/12, datos de perfil faltantes) y recordando que una mejor respuesta exige la cuenta con la mayor cantidad de datos posible.
- En ese caso usa "confianza": "media", o "baja" si faltan datos criticos.`

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface ChatResponse {
  reply:             string
  tipo:              'normal' | 'pendiente' | 'requiere_busqueda_web'
  motivo_pendiente?: string | null
  confianza:         'alta' | 'media' | 'baja'
}

// ── Logging helpers ───────────────────────────────────────────────────────────
async function logBitacora(
  pregunta:   string,
  resp:       ChatResponse,
  email:      string,
  nombre:     string,
  modulos:    string[],
) {
  try {
    await supabaseAdmin.from('atlas_bitacora').insert({
      usuario_email:    email,
      usuario_nombre:   nombre,
      pregunta,
      respuesta:        resp.reply,
      tipo:             resp.tipo,
      confianza:        resp.confianza,
      modulos_contexto: modulos,
    })
  } catch { /* tabla aun no creada — no bloquear chat */ }
}

async function logPendiente(
  pregunta: string,
  resp:     ChatResponse,
  email:    string,
  nombre:   string,
) {
  try {
    await supabaseAdmin.from('atlas_pendientes').insert({
      pregunta,
      motivo:        resp.motivo_pendiente ?? resp.tipo,
      usuario_email: email,
      usuario_nombre: nombre,
      estado:        'pendiente',
    })
  } catch { /* tabla aun no creada */ }
}

async function notifyAdmin(pregunta: string, resp: ChatResponse, nombre: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  try {
    const resend = new Resend(key)
    const tipoLabel = resp.tipo === 'requiere_busqueda_web'
      ? 'Requiere busqueda web'
      : 'Informacion pendiente'
    await resend.emails.send({
      from:    'onboarding@resend.dev',
      to:      'josel@callpicker.com',
      subject: `Atlas IA — ${tipoLabel} (${nombre})`,
      text: `Atlas IA registro una consulta que requiere atencion.

Usuario: ${nombre}
Pregunta: ${pregunta}
Tipo: ${tipoLabel}
Motivo: ${resp.motivo_pendiente ?? 'No especificado'}

Revisa el apartado "Pendientes" en Atlas IA del dashboard.
https://callpicker-cs.vercel.app/chat`,
    })
  } catch { /* no bloquear */ }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, cuentaContext } = await req.json()

    const email  = req.headers.get('x-user-email') ?? ''
    const nombre = decodeURIComponent(req.headers.get('x-user-nombre') ?? 'Usuario')

    const pregunta = (messages as Array<{ role: string; content: string }>)
      .filter(m => m.role === 'user')
      .at(-1)?.content ?? ''

    // Contexto vivo de todos los modulos + dossier de la cuenta mencionada
    const [ctx, dossier] = await Promise.all([
      buildAtlasContext(),
      buildCuentaDossier(String(pregunta)).catch(() => null),
    ])
    if (dossier) ctx.modulos.push(`dossier:${dossier.empresa}`)

    const systemMsgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: BASE_SYSTEM },
      {
        role: 'system',
        content:
          `DATOS EN VIVO — ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n${ctx.text}`,
      },
    ]

    if (dossier) {
      systemMsgs.push({ role: 'system', content: dossier.text })
    }

    if (cuentaContext) {
      systemMsgs.push({
        role:    'system',
        content: `CUENTA EN CONTEXTO (informacion del modulo Cuentas):\n${JSON.stringify(cuentaContext, null, 2)}`,
      })
    }

    const openaiResp = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [...systemMsgs, ...messages],
      temperature:     0.3,
      max_tokens:      1600,
      response_format: { type: 'json_object' },
    })

    const raw = openaiResp.choices[0].message.content ?? '{}'

    let chatResp: ChatResponse
    try {
      chatResp = JSON.parse(raw) as ChatResponse
      if (!chatResp.reply) chatResp.reply = raw
      if (!chatResp.tipo) chatResp.tipo = 'normal'
      if (!chatResp.confianza) chatResp.confianza = 'alta'
    } catch {
      chatResp = { reply: raw, tipo: 'normal', confianza: 'alta' }
    }

    // Logging (fire and forget — no bloquea la respuesta)
    void logBitacora(pregunta, chatResp, email, nombre, ctx.modulos)

    if (chatResp.tipo !== 'normal') {
      void logPendiente(pregunta, chatResp, email, nombre)
      void notifyAdmin(pregunta, chatResp, nombre)
    }

    return NextResponse.json({
      reply:     chatResp.reply,
      tipo:      chatResp.tipo,
      confianza: chatResp.confianza,
    })

  } catch (e: unknown) {
    console.error('[atlas-ia]', e)
    return NextResponse.json({ error: 'Error al procesar la respuesta' }, { status: 500 })
  }
}
