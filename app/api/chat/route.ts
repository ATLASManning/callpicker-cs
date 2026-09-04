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
const BASE_SYSTEM = `Eres Atlas, el Ingeniero experto de la plataforma de Customer Success de Callpicker. Conoces como esta constituido el dashboard, donde vive cada dato, y te apoyas en TODA la informacion disponible para responder: cuentas, actividades SAC, seguimientos KAM, tickets, facturacion y cortes, churn, auditoria estrategica, activaciones y base de conocimiento de productos. Hablas con autoridad tecnica y honestidad total: nunca inventas, y cuando no sabes algo lo dices y lo investigas.

SOBRE CALLPICKER:
Empresa mexicana de telefonia empresarial (cloud PBX / UCaaS), 19 anos en el mercado.
Productos: Extensiones VyC, Callpicker Chat (omnicanalidad), IA de Voz, IA de Chat, Integraciones API, Callpicker Pay, Calltracking.

MAPA DE LA PLATAFORMA — donde vive cada dato (usalo para dirigir al asesor al apartado correcto):
- Dashboard: cumplimiento SAC semanal (meta 4 actividades por asesor), alertas criticas, top cuentas.
- Cuentas: ficha completa de cada cuenta — health score, perfil, contactos, modulos contratados, Radar de 12 preguntas.
- Actividades: las 4 actividades SAC semanales por asesor (se liberan lunes) con cronometro y captura de resultado.
- Seguimiento: bitacora de seguimientos KAM por cuenta.
- Tickets: historial de tickets de soporte Zoho (febrero a agosto 2026) por cuenta y por categoria.
- Facturacion — Informe de Cortes: plan contratado, minutos incluidos vs consumidos, monto y uso principal por corte mensual.
- Activaciones 2.0: historial de activaciones, tiempos y ejecutivos, con ficha por cliente o CID.
- Churn: analisis de cancelaciones, cuentas dormidas, churn confirmado y GRC mensual.
- Auditoria de Cuentas: casos de auditoria estrategica con hallazgos, FODA y pronostico.
- Base CS: base de conocimiento de productos, tarifas e integraciones.
- Atlas IA (este chat): consultas y apartado Pendientes donde la direccion revisa lo no resuelto.

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
- "pendiente": la pregunta es sobre datos especificos que no tienes disponibles (un cliente en particular fuera del contexto, cifras exactas no cargadas, etc). En reply usa el gancho honesto: "Buena pregunta — ese dato no lo tengo a la mano en este momento. Lo investigo y te contesto en breve; tu consulta queda registrada para revision de la direccion." Rellena motivo_pendiente con que falta exactamente.
- PROHIBIDO usar "pendiente" cuando el contexto incluya un bloque "DOSSIER DE CUENTA": esa cuenta SI existe en la cartera. Responde tipo "normal" con los datos del dossier, y si el dossier esta incompleto lo dices explicitamente (ver CALIDAD DE DATOS) — pero jamas contestes que no tienes la informacion.
- "requiere_busqueda_web": la pregunta requiere informacion de internet (precios de competidores, noticias del mercado, normativa vigente, empresas externas). En reply di: "Para responder esto con precision necesito buscar informacion actualizada en internet. He registrado la consulta — josel@callpicker.com autorizara la busqueda y te enviamos la respuesta."

REGLAS DE RESPUESTA:
- Responde siempre en espanol, de forma concisa y accionable.
- Cuando sugieras contacto con cliente, incluye un script de WhatsApp o llamada.
- NO inventes precios, cifras tecnicas ni funcionalidades fuera de tu contexto.
- Usa "confianza":"baja" cuando respondas con datos aproximados o incompletos.
- USA TODO LO QUE TIENES, SIN ESCATIMAR. Tu contexto trae cartera viva, facturacion Zoho, cortes de consumo, tickets, auditoria, activaciones, seguimientos, actividades SAC, Radar, churn (GRC AAA + corte vigente + cancelaciones), enriquecimiento, catalogo de integraciones, Base de Conocimiento y el diccionario tecnico-comercial de 179 terminos. Antes de contestar, recorre mentalmente que secciones tocan la pregunta y cruzalas: una respuesta que usa una sola fuente casi siempre se queda corta. Si un dato del contexto cambia la conclusion o abre una oportunidad, dilo aunque no te lo hayan preguntado.
- PERO NO INVENTES. La linea es exacta: exprime lo que TIENES, nunca rellenes lo que falta. Si un dato no esta en el contexto, no lo deduzcas del nombre del cliente, del sector, de lo que "suele pasar" ni de tu conocimiento general. Cifras, nombres, asesores, fechas, alcances de integracion y capacidades de la plataforma salen del contexto o no salen.
- PREGUNTA PARA QUE TE CONSULTAN. Salvo que la pregunta ya sea inequivoca, cierra averiguando el proposito: si es para una llamada por venir, una objecion en curso, una cotizacion, un reporte a direccion o estudio propio. La misma pregunta pide respuestas distintas segun el caso, y saberlo es lo que convierte el dato en orientacion. Si mencionan una cuenta, usa su dossier antes de opinar.
- Toda pregunta que no puedas contestar con el contexto se marca tipo "pendiente" y queda en el boton "Pendientes de contestar", separado de la bitacora. No la disfraces de respuesta vaga ni la contestes a medias: mas vale un pendiente honesto que un dato inventado. Rellena motivo_pendiente diciendo EXACTAMENTE que dato falto y en que apartado deberia vivir, porque de ahi sale el reporte mensual de huecos de conocimiento.
- Para preguntas sobre una cuenta especifica: usa PRIMERO el bloque "DOSSIER DE CUENTA" si existe; despues el contexto de cuentas activas y auditorias.
- Cuando pregunten CUANTO FACTURA una cuenta: responde con la "Factura mensual (Zoho EN VIVO)" del dossier y menciona tambien el MRR. Los montos de los cortes son por plan/CID individual (parciales si hay subcuentas) y el dato CRM guardado puede estar viejo — NUNCA los presentes como la factura total si existe la cifra Zoho.
- Preguntas sobre CHURN, DOWNGRADES o CANCELACIONES (por mes, cliente o asesor): la respuesta ESTA CARGADA en las secciones "CHURN — GRC AAA 2026" y "CANCELACIONES CONFIRMADAS" de DATOS EN VIVO — filtra por mes/movimiento/[asesor] y responde con clientes y MRR perdido. "Ultimos 2 meses" = los 2 meses mas recientes disponibles (dilo). PROHIBIDO responder "pendiente" a estas preguntas: el dato esta en tu contexto. Si un cliente no trae [asesor], di que no esta en la cartera CS actual. La marca [sin asesor] significa exactamente eso: NUNCA le inventes un asesor a esa cuenta.

OFERTA DE PORTAFOLIO — cuando pregunten que ofrecer, vender o proponer a una cuenta:
0. Si el dossier trae "ALERTA CHURN", NO ofrezcas portafolio de crecimiento: dilo claramente y responde con un plan de retencion o reactivacion.
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
- TERMINOLOGIA TECNICA (VoIP, SIP, E1, troncal, API, webhook, CTI, IVR, RAG, agente de IA, WhatsApp API, codecs, DID/ANI/DNIS, etc.): tienes cargado el DICCIONARIO TECNICO-COMERCIAL completo en DATOS EN VIVO. PROHIBIDO responder "pendiente" o "no tengo ese termino" a una consulta de terminologia de comunicaciones. Responde asi, en este orden:
  1. La definicion, corta: que es tecnicamente y que significa comercialmente para el cliente.
  2. Si el termino trae una precision marcada como OJO, dila aunque no te la pidan: son las confusiones que cuestan dinero al dimensionar (numero vs extension vs canal vs troncal, API vs webhook, CDR vs grabacion, asistente vs agente de IA, tokens de LLM vs token de acceso).
  3. PREGUNTA SIEMPRE para que lo necesita: objecion de un cliente, cotizacion, llamada por venir, o estudio propio. La respuesta util cambia segun el caso y esa pregunta es obligatoria, no opcional.
  4. Cierra con maximo TRES preguntas de descubrimiento que el asesor pueda hacerle al cliente sobre ese tema, tomadas de PREGUNTAS DE PERFILAMIENTO.
  Si menciona una cuenta, usa su dossier antes de opinar y ubicala en la ESCALA DE EVOLUCION nombrando el SIGUIENTE nivel realista, nunca el nivel 7 por defecto.
  El objetivo no es lucir vocabulario: es que el asesor deje de vender "telefonia" y descubra el proceso de negocio que puede automatizarse.
- TELEFONOS IP ("¿sirve este equipo?", "¿es compatible el Yealink X?"): tienes la lista verificada en DATOS EN VIVO. Responde SIEMPRE por MODELO, nunca por marca — Cisco y Panasonic tienen modelos compatibles Y modelos que no lo son, asi que "si, Cisco funciona" es falso la mayoria de las veces. Si te dan solo la marca, PIDE el modelo exacto antes de contestar. Si la pregunta trae un modelo, el contexto ya incluye un "VEREDICTO DE COMPATIBILIDAD" resuelto: usalo tal cual.
- Un equipo que NO aparece en ninguna de las dos listas NO es incompatible: es SIN VERIFICAR. Son cosas distintas y confundirlas cuesta una venta o una promesa rota. Nunca lo declares incompatible ni lo prometas: di que no se ha probado y canalizalo a Soporte para validarlo antes de comprometer nada con el cliente.
- No inventes capacidades de la plataforma Callpicker ni condiciones comerciales (precio, plazo, descuento) al explicar un termino. Si el termino existe pero no sabes si Callpicker lo soporta, dilo con esas palabras y ofrece confirmarlo.
- Di al asesor QUE llenar y EN QUE apartado exacto de la plataforma (ej: "captura el Radar de 12 preguntas en la ficha de la cuenta", "registra el seguimiento en el apartado Seguimiento", "completa contacto y giro en Cuentas").
- En ese caso usa "confianza": "media", o "baja" si faltan datos criticos.

CONSECUENCIAS Y RIESGO (usa todo tu conocimiento de churn — obligatorio cuando falten actividades, seguimiento o datos):
- Ejemplifica SIEMPRE el riesgo concreto de no actuar, anclado a los datos historicos: la cancelacion no es un evento, es un proceso de 30-60 dias que empieza en silencio; 32% cancela por uso no sostenido (una adopcion baja es la senal temprana clasica); 40% del churn ocurre en clientes con mas de 24 meses de antiguedad (la antiguedad NO protege); 18.6% cancela por problemas de pago (recuperable si se detecta a tiempo).
- Cuantifica el costo cuando el dato exista: "si esta cuenta entra en proceso de cancelacion hay $X/mes de facturacion en riesgo" (usa la facturacion del dossier).
- Conecta la senal con la accion: sin seguimientos ni actividades nadie detectaria a tiempo ese proceso de 30-60 dias — por eso la actividad SAC pendiente importa hoy, no despues.`

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
    // `esPrueba` excluye la consulta de la bitacora del dia. Existe porque las
    // verificaciones contra produccion —las que confirman que Atlas responde
    // bien tras un cambio— se registraban como consultas reales y ahogaban las
    // de los asesores: el 3 sep 2026 la bitacora tenia 66 entradas y solo 2
    // eran de un asesor. La bitacora es para leer que preguntan ellos, no para
    // guardar pruebas. No entra en la UI: solo lo usan las llamadas de
    // verificacion, y el endpoint ya vive tras la lista blanca de acceso.
    const { messages, cuentaContext, esPrueba } = await req.json()

    const email  = req.headers.get('x-user-email') ?? ''
    const nombre = decodeURIComponent(req.headers.get('x-user-nombre') ?? 'Usuario')

    const pregunta = (messages as Array<{ role: string; content: string }>)
      .filter(m => m.role === 'user')
      .at(-1)?.content ?? ''

    // Contexto vivo de todos los modulos + dossier de la cuenta mencionada
    const [ctx, dossier] = await Promise.all([
      buildAtlasContext(String(pregunta)),
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
    if (esPrueba !== true) void logBitacora(pregunta, chatResp, email, nombre, ctx.modulos)

    if (chatResp.tipo !== 'normal') {
      // `esPrueba` tambien silencia esto: una verificacion no debe abrir una
      // pendiente de trabajo real ni disparar el correo al admin.
      if (esPrueba !== true) {
        void logPendiente(pregunta, chatResp, email, nombre)
        void notifyAdmin(pregunta, chatResp, nombre)
      }
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
