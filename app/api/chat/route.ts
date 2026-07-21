import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { KB } from '@/app/base-cs/kb-data'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' })

// ── Serializar la Base de Conocimiento a texto plano ─────────────────────────
function kbToText(): string {
  const lines: string[] = []

  for (const cat of KB) {
    const arts = cat.articulos.filter(a => a.badge !== 'roto')
    if (!arts.length) continue

    lines.push(`\n## ${cat.label.toUpperCase()}`)

    for (const art of arts) {
      lines.push(`\n### ${art.titulo}`)
      lines.push(art.descripcion)

      if (art.ubicacion) lines.push(`Ubicación en plataforma: ${art.ubicacion}`)
      if (art.utilidad)  lines.push(`Utilidad: ${art.utilidad}`)

      if (art.tarificacion?.length) {
        lines.push('Tarificación:')
        for (const t of art.tarificacion) {
          const tag = t.nivel === 'red' ? '⚠️' : t.nivel === 'amber' ? 'ℹ️' : '✅'
          lines.push(`  ${tag} ${t.tipo}: ${t.regla}`)
        }
      }

      if (art.modalidades?.length) {
        lines.push('Modalidades:')
        for (const m of art.modalidades) {
          lines.push(`  - ${m.nombre}: ${m.descripcion}`)
        }
      }

      if (art.funcionamiento?.length) {
        lines.push('Funcionamiento:')
        for (const f of art.funcionamiento) lines.push(`  - ${f}`)
      }

      if (art.acciones?.length) {
        lines.push(`Acciones disponibles: ${art.acciones.join(' | ')}`)
      }

      if (art.apis?.length) {
        lines.push('APIs:')
        for (const a of art.apis) lines.push(`  - ${a.nombre}: ${a.descripcion}`)
      }

      if (art.graficas?.length) {
        lines.push(`Gráficas disponibles: ${art.graficas.join(', ')}`)
      }

      if (art.subtitulos?.length) {
        for (const s of art.subtitulos) {
          lines.push(`${s.titulo}:`)
          for (const item of s.items) lines.push(`  - ${item}`)
        }
      }

      if (art.consideraciones?.length) {
        lines.push('Consideraciones importantes:')
        for (const c of art.consideraciones) {
          const tag = c.tipo === 'warning' ? '⚠️' : c.tipo === 'error' ? '🚫' : c.tipo === 'info' ? 'ℹ️' : '•'
          lines.push(`  ${tag} ${c.texto}`)
        }
      }

      if (art.bloques?.length) {
        for (const b of art.bloques) {
          if (b.tipo === 'parrafo' && b.texto)              lines.push(b.texto)
          else if (b.tipo === 'seccion' && b.titulo)        lines.push(`\n**${b.titulo}**`)
          else if (b.tipo === 'lista' && b.items)           b.items.forEach(i => lines.push(`  - ${i}`))
          else if (b.tipo === 'cita' && b.texto)            lines.push(`"${b.texto}"`)
          else if (b.tipo === 'codigo' && b.texto)          lines.push(`Código: ${b.texto}`)
          else if (b.tipo === 'firma' && b.texto)           lines.push(`— ${b.texto}`)
        }
      }
    }
  }

  return lines.join('\n')
}

// ── System prompt ─────────────────────────────────────────────────────────────
const KB_TEXT = kbToText()

const SYSTEM_PROMPT = `Eres Atlas, el asistente de IA de Customer Success de Callpicker.

CONTEXTO DE CALLPICKER:
Callpicker es una plataforma mexicana de telefonía empresarial (cloud PBX / UCaaS) con 19 años en el mercado.
Productos clave: Extensiones VyC, Callpicker Chat (omnicanalidad), IA de Voz, IA de Chat, Integraciones API, Callpicker Pay, Calltracking.

MODELO DE HEALTH SCORE:
- Bloque A — Actividad en plataforma (35%): login, volumen llamadas, app móvil
- Bloque B — Adopción de features (30%): Chat, grabación, extensiones, dashboard
- Bloque C — Comportamiento de pago (20%): pagos al corriente, incidencias
- Bloque D — Señales relacionales (15%): responde contactos, tickets abiertos

SEMÁFOROS:
- 🟢 Verde 80-100: Saludable → monitoreo mensual
- 🔵 Azul 60-79: Estable → check-in mensual
- 🟡 Amarillo 40-59: Observación → contacto en 5 días
- 🟠 Naranja 20-39: Riesgo → llamada 48 horas
- 🔴 Rojo 0-19: Riesgo Alto → intervención HOY

DATOS DE CHURN:
- La cancelación no es un evento — es un proceso de 30-60 días.
- El 32% cancela por uso no sostenido. El 18.6% por problemas de pago (recuperable).
- El 40% del churn ocurre en clientes de más de 24 meses.

OPORTUNIDADES DE UPSELL/CROSS-SELL:
- Upsell: más extensiones, más minutos, IA de voz, Callcenter
- Cross-sell: Callpicker Chat, Callpicker Pay, Integraciones API, módulo de IA

─────────────────────────────────────────────────────────────────────────────
BASE DE CONOCIMIENTO — PRODUCTOS Y FUNCIONALIDADES
─────────────────────────────────────────────────────────────────────────────
${KB_TEXT}
─────────────────────────────────────────────────────────────────────────────

TU ROL:
1. Responder preguntas de producto usando la Base de Conocimiento como fuente principal
2. Analizar cuentas y dar recomendaciones concretas de retención
3. Sugerir scripts de comunicación según el perfil del cliente
4. Ayudar a identificar oportunidades de upsell/cross-sell
5. Calcular y explicar health scores
6. Orientar en protocolos de soporte y escalación

REGLAS DE RESPUESTA:
- Responde siempre en español, de forma concisa y accionable
- Usa emojis de semáforo (🟢🔵🟡🟠🔴) cuando hables de estatus
- Cuando sugieras contacto con el cliente, incluye un script de WhatsApp o llamada
- Si la información no está en tu contexto, dilo claramente: "No tengo esa información — es bueno validarla con el equipo"
- No inventes precios, reglas técnicas ni funcionalidades; cíñete a la información que tienes`

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, cuentaContext } = await req.json()

    const systemMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
    ]

    if (cuentaContext) {
      systemMessages.push({
        role: 'system' as const,
        content: `CUENTA EN CONTEXTO:\n${JSON.stringify(cuentaContext, null, 2)}`,
      })
    }

    const response = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [...systemMessages, ...messages],
      temperature: 0.4,
      max_tokens:  1200,
    })

    return NextResponse.json({ reply: response.choices[0].message.content })
  } catch (e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Error al procesar la respuesta' }, { status: 500 })
  }
}
