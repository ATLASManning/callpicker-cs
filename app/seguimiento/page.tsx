import { getCuentas } from '@/lib/supabase'
import { formatMXN, getSemaforo, SEMAFORO_CONFIG, ASESOR_CONFIG } from '@/lib/types'
import type { Asesor, Cuenta } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import {
  AlertTriangle, TrendingUp, LayoutDashboard, ChevronDown,
  CircleDot, CheckCircle2, HelpCircle, Banknote, TicketIcon,
  Brain, Info,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ── Helpers de ciclo de vida ──────────────────────────────────────────────────

function cicloVida(c: Cuenta): 'nuevo' | 'creciendo' | 'maduro' | 'veterano' {
  const dias = c.dias_como_cliente ?? 0
  if (dias < 90)  return 'nuevo'
  if (dias < 365) return 'creciendo'
  if (dias < 730) return 'maduro'
  return 'veterano'
}

function etiquetaCiclo(c: Cuenta): string {
  const m = { nuevo: '🆕 < 3 meses', creciendo: '📈 3-12 meses', maduro: '✅ 1-2 años', veterano: '⭐ 2+ años' }
  return m[cicloVida(c)]
}

function urgenciaChurn(c: Cuenta): 'crítica' | 'alta' | 'media' {
  if (c.health_score < 20 || (!c.pagos_al_corriente && c.health_score < 40)) return 'crítica'
  if (c.health_score < 35 || c.dias_sin_actividad > 21) return 'alta'
  return 'media'
}

// ── Generadores de Acciones y Preguntas ──────────────────────────────────────

function churnAcciones(c: Cuenta): string[] {
  const a: string[] = []
  const ciclo = cicloVida(c)
  const urgencia = urgenciaChurn(c)

  // Urgencia crítica — plan de rescate
  if (urgencia === 'crítica') {
    a.push(`⚠️ URGENTE — Elaborar plan de rescate documentado esta semana`)
    if (ciclo === 'veterano' || ciclo === 'maduro')
      a.push(`Cliente ${etiquetaCiclo(c)}: involucrar a dirección de CS antes de la próxima llamada`)
    if (c.facturacion > 5000)
      a.push(`Cuenta estratégica (${formatMXN(c.facturacion)}/mes) — escalar a gerencia comercial`)
  }

  // Contacto y cadencia
  if (c.dias_sin_actividad > 30)
    a.push(`Contacto urgente hoy — ${c.dias_sin_actividad} días sin actividad (llamada, no WhatsApp)`)
  else if (c.dias_sin_actividad > 14)
    a.push(`Programar llamada de reactivación — ${c.dias_sin_actividad} días sin contacto`)
  else if (c.dias_sin_actividad > 7)
    a.push('Enviar check-in vía WhatsApp con pregunta directa de satisfacción')

  // Pagos
  if (!c.pagos_al_corriente)
    a.push('Gestionar regularización de pago — definir fecha de compromiso por escrito con el cliente')
  if (c.incidencias_pago >= 2)
    a.push(`${c.incidencias_pago} incidencias de pago históricas — revisar con cobranza si hay patrón de riesgo`)

  // Tickets
  if (c.tiene_ticket_reincidente)
    a.push('Ticket reincidente: escalar a soporte N2, obtener fecha de resolución y comunicarla al cliente')
  else if (c.tickets_abiertos > 0)
    a.push(`Dar cierre a ${c.tickets_abiertos} ticket(s) abierto(s) — cliente puede estar esperando para evaluar renovación`)

  // Adopción
  if (c.score_adopcion < 30)
    a.push('Agendar sesión de onboarding acelerado — la baja adopción es el mayor predictor de churn')
  else if (c.score_adopcion < 50)
    a.push('Revisar con el cliente qué módulos no está usando y por qué')

  // Métricas de llamadas
  if (c.llamadas_cambio_pct < -40)
    a.push(`Caída crítica de llamadas (${c.llamadas_cambio_pct.toFixed(0)}%) — investigar si hay cambio operativo en el cliente`)
  else if (c.llamadas_cambio_pct < -20)
    a.push(`Caída de llamadas (${c.llamadas_cambio_pct.toFixed(0)}%) — preguntar en próximo contacto qué está cambiando`)

  if (c.llamadas_atendidas_pct < 40)
    a.push(`Solo ${c.llamadas_atendidas_pct.toFixed(0)}% de llamadas atendidas — revisar configuración de agentes y horarios`)

  // NPS
  if (c.nps_score !== null && c.nps_score !== undefined) {
    if (c.nps_score < 6)
      a.push(`NPS ${c.nps_score} (Detractor) — conversación de escucha activa prioritaria antes de cualquier venta`)
    else if (c.nps_score < 8)
      a.push(`NPS ${c.nps_score} (Neutral) — identificar 1 acción concreta que mejore la experiencia del cliente`)
  }

  // Ciclo nuevo — onboarding en riesgo
  if (ciclo === 'nuevo' && c.health_score < 50)
    a.push('Cliente nuevo con HS bajo — revisar si el onboarding inicial fue completo y efectivo')

  // Próximo contacto
  if (!c.proximo_contacto)
    a.push('Registrar fecha de próximo contacto en CRM antes de terminar el día')
  else
    a.push(`Confirmar agenda para el ${new Date(c.proximo_contacto).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} — preparar agenda con 3 puntos clave`)

  if (a.length <= 1)
    a.push('Mantener cadencia semanal y validar satisfacción del cliente con pregunta directa')

  return a
}

function churnPreguntas(c: Cuenta): string[] {
  const ciclo = cicloVida(c)
  const q: string[] = []

  // Diagnóstico causa raíz
  q.push(`¿Cuál es tu hipótesis sobre la causa raíz de la caída en ${c.empresa}? ¿Producto, relación, operación o precios?`)

  // Contacto y relación
  if (c.contacto_nombre)
    q.push(`¿Cuándo fue el último contacto directo con ${c.contacto_nombre}? ¿Cómo fue el tono de esa conversación?`)
  else
    q.push('¿Tienes identificado al tomador de decisiones actual? ¿Tienes contacto directo con él/ella?')

  // Intención de cancelación
  q.push(`¿${c.empresa} ha expresado intención de cancelar, reducir o congelar el servicio?`)

  // Plan documentado
  q.push('¿Tienes un plan de rescate documentado con compromisos y fechas? ¿Cuál es el siguiente hito?')

  // Según urgencia
  if (c.health_score < 20)
    q.push('¿Se ha escalado esta cuenta a dirección? ¿Cuánto tiempo tenemos antes de perderla?')

  // Pagos
  if (!c.pagos_al_corriente)
    q.push('¿Cuál es el estatus del adeudo? ¿Hay un compromiso de pago por escrito? ¿Cuándo?')

  // Ticket reincidente
  if (c.tiene_ticket_reincidente)
    q.push('¿Qué está causando el ticket reincidente? ¿El cliente está consciente de que ya se escaló?')

  // Sin actividad prolongada
  if (c.dias_sin_actividad > 20)
    q.push(`Con ${c.dias_sin_actividad} días sin actividad, ¿has logrado hablar con ellos? ¿Qué respuesta obtuviste?`)

  // Ciclo de vida — cliente nuevo en riesgo
  if (ciclo === 'nuevo')
    q.push('¿El cliente completó el onboarding? ¿Llegaron a tener un caso de uso claro del producto?')

  // Ciclo veterano — lealtad histórica
  if (ciclo === 'veterano')
    q.push('El cliente tiene más de 2 años con nosotros — ¿qué cambió recientemente en su relación con el equipo o el producto?')

  // Competencia
  q.push('¿Sabes si están evaluando competidores? ¿Qué está ofreciendo la competencia que los atrae?')

  return q
}

function upsellAcciones(c: Cuenta): string[] {
  const a: string[] = []
  const ciclo = cicloVida(c)

  // Solo explorar upsell si el cliente está sano — no vender a un cliente en riesgo
  if (c.health_score < 60) {
    a.push('Priorizar retención antes que expansión — no avanzar propuesta comercial hasta HS ≥ 60')
    return a
  }

  // Oportunidades registradas
  if (c.upsell_producto)
    a.push(`Avanzar propuesta de Upsell: ${c.upsell_producto} — preparar propuesta con ROI y caso de éxito`)
  if (c.crossell_producto)
    a.push(`Presentar propuesta de Cross-sell: ${c.crossell_producto} — vincular con una necesidad operativa del cliente`)
  if (!c.upsell_producto && !c.crossell_producto)
    a.push('En la próxima llamada, hacer 2 preguntas de exploración sobre necesidades no resueltas')

  // Valor estimado
  if (c.valor_upsell_estimado)
    a.push(`Dar seguimiento a oportunidad de ${formatMXN(c.valor_upsell_estimado)} — definir siguiente paso claro (demo, propuesta, decisor)`)

  // Decisor y calificación
  a.push('Confirmar quién es el decisor presupuestal — no avanzar sin él/ella en la conversación')
  a.push('Calificar urgencia: ¿el cliente tiene un problema activo que este producto resuelve ahora?')

  // Preparación
  if (ciclo === 'nuevo' || ciclo === 'creciendo')
    a.push('Cliente en crecimiento — compartir mapa de producto (roadmap) y qué módulos van siendo relevantes')
  else
    a.push('Preparar benchmarks del sector: ¿qué están adoptando empresas similares?')

  // Adopción como palanca
  if (!c.tiene_ia_voz && !c.tiene_ia_chat)
    a.push('Demostrar IA de voz o chat como upsell natural — son el complemento lógico de Callpicker')
  if (!c.tiene_integracion_api && c.facturacion > 3000)
    a.push('Proponer integración vía API — es el paso natural para empresas medianas de su tamaño')

  // Cierre
  a.push('Definir fecha estimada de decisión y registrar en CRM con probabilidad de cierre')

  return a
}

function upsellPreguntas(c: Cuenta): string[] {
  const q: string[] = []

  if (c.health_score < 60) {
    q.push('¿Por qué consideras que esta cuenta es candidata a upsell si el HS está por debajo de 60?')
    q.push('¿Qué tendría que pasar primero para que puedas avanzar una propuesta sin afectar la retención?')
    return q
  }

  q.push(`¿En qué etapa del proceso está la oportunidad con ${c.empresa}? ¿Hay un siguiente paso agendado?`)
  q.push('¿Tienes identificado al tomador de decisión presupuestal? ¿Has tenido conversación directa con él/ella?')
  q.push('¿Cuál es el problema específico del cliente que este producto/módulo resuelve?')
  q.push('¿Qué objeciones ha planteado el cliente? ¿Tienes respuesta preparada para cada una?')
  q.push('¿Hay competidores o alternativas internas que el cliente esté evaluando?')

  if (c.valor_upsell_estimado)
    q.push(`¿El cliente tiene presupuesto disponible para la oportunidad de ${formatMXN(c.valor_upsell_estimado)}? ¿Se lo has preguntado directamente?`)
  else
    q.push('¿Has estimado el valor de la oportunidad? ¿Se lo has presentado al cliente en términos de ROI?')

  q.push('¿Tienes una fecha de cierre estimada? ¿Qué necesitas para acortar el ciclo?')

  return q
}

function panelAcciones(c: Cuenta): string[] {
  const a: string[] = []
  const ciclo = cicloVida(c)

  // Dashboard
  if (!c.dashboard_revisado)
    a.push('Agendar sesión de 30 min para revisar el panel junto con el cliente — mostrar sus métricas reales')

  // Actividad
  if (c.dias_sin_actividad > 21)
    a.push('Enviar resumen de actividad de los últimos 30 días con comparativa — demostrar valor con datos')
  else if (c.dias_sin_actividad > 14)
    a.push('Enviar reporte de uso comparativo (mes actual vs. mes anterior) con comentario personalizado')

  // Módulos no adoptados
  if (!c.tiene_chat_activo)
    a.push('Activar Callpicker Chat — ofrece demo de 15 min mostrando cómo redujo tiempos de respuesta en otro cliente')
  if (!c.tiene_ia_voz && !c.tiene_ia_chat)
    a.push('Presentar IA de Voz o IA de Chat — usar un caso de éxito de sector similar al del cliente')
  if (!c.tiene_integracion_api)
    a.push(ciclo === 'nuevo'
      ? 'Preguntar qué CRM/ERP usa el cliente — documentarlo para propuesta de integración futura'
      : 'Proponer integración vía API con su CRM/ERP — preparar estimado de esfuerzo de implementación')
  if (!c.tiene_pago_automatico)
    a.push('Invitar a activar domiciliación — reducir fricción y eliminar riesgo de olvido de pago')

  // Llamadas atendidas bajas pero no en churn
  if (c.llamadas_atendidas_pct < 60 && c.health_score >= 60)
    a.push(`${c.llamadas_atendidas_pct.toFixed(0)}% de llamadas atendidas — revisar configuración de agentes y horarios con el cliente`)

  // Buena práctica siempre
  a.push('Compartir 1 tip de uso avanzado del panel en cada contacto — posiciona al asesor como experto')

  return a
}

function panelPreguntas(c: Cuenta): string[] {
  const q: string[] = []

  q.push(`¿${c.empresa} revisa activamente su panel? ¿Quién en su equipo lo usa y con qué frecuencia?`)
  q.push('¿Cuántos usuarios administradores tienen configurados? ¿El equipo del cliente sabe cómo sacarle provecho?')
  q.push('¿Han explorado reportes de llamadas, grabaciones y métricas de atención?')

  if (!c.tiene_chat_activo)
    q.push('¿Por qué no han activado el Chat? ¿Falta de recursos, falta de interés o no conocen la funcionalidad?')
  if (!c.tiene_ia_voz && !c.tiene_ia_chat)
    q.push('¿Has mostrado al cliente cómo la IA de Voz/Chat puede impactar su KPI de atención? ¿Cuál fue su reacción?')
  if (!c.dashboard_revisado)
    q.push('¿Cuándo fue la última sesión formal de revisión del panel con el cliente? ¿Qué impidió hacerla?')
  if (c.llamadas_atendidas_pct < 60)
    q.push('¿El cliente sabe que está atendiendo menos del 60% de sus llamadas? ¿Lo ve como un problema?')

  q.push('¿Qué función del panel les genera más valor hoy? ¿Y cuál les genera más fricción o confusión?')

  return q
}

// ── Mentoring One-on-One (nivel asesor, no cuenta) ────────────────────────────

function mentoringOneOnOne(asesor: string, lista: Cuenta[]): {
  contexto: string[]
  preguntas: string[]
} {
  const total         = lista.length
  const enRiesgo      = lista.filter(c => c.health_score < 40)
  const sinContacto14 = lista.filter(c => c.dias_sin_actividad > 14)
  const sinProximo    = lista.filter(c => !c.proximo_contacto)
  const conOportunidad = lista.filter(c => c.upsell_producto || c.crossell_producto || c.valor_upsell_estimado)
  const nuevos        = lista.filter(c => cicloVida(c) === 'nuevo')
  const veteranos     = lista.filter(c => cicloVida(c) === 'veterano')
  const sinPago       = lista.filter(c => !c.pagos_al_corriente)
  const bajaNPS       = lista.filter(c => c.nps_score !== null && c.nps_score !== undefined && c.nps_score < 7)
  const baja_adopcion = lista.filter(c => c.score_adopcion < 40)

  // Contexto del portafolio
  const ctx: string[] = []
  if (enRiesgo.length > 0)
    ctx.push(`${enRiesgo.length} de ${total} cuentas con HS < 40 — ${enRiesgo.map(c => c.empresa).join(', ')}`)
  if (sinContacto14.length > 0)
    ctx.push(`${sinContacto14.length} cuentas sin contacto en +14 días`)
  if (sinProximo.length > 0)
    ctx.push(`${sinProximo.length} cuentas sin fecha de próximo contacto registrada en CRM`)
  if (sinPago.length > 0)
    ctx.push(`${sinPago.length} cuentas con pagos fuera de corriente`)
  if (bajaNPS.length > 0)
    ctx.push(`${bajaNPS.length} clientes con NPS < 7 (detractores o pasivos)`)
  if (baja_adopcion.length > 0)
    ctx.push(`${baja_adopcion.length} cuentas con adopción de producto < 40`)
  if (ctx.length === 0)
    ctx.push(`Portafolio en buen estado — ${total} cuentas activas, sin alertas críticas`)

  // Preguntas de mentoring
  const q: string[] = []

  // Priorización
  q.push(`De tus ${total} cuentas, ¿cuáles son tus 3 prioridades esta semana y por qué esas específicamente?`)

  // Riesgo
  if (enRiesgo.length > 0)
    q.push(`Tienes ${enRiesgo.length} cuenta(s) en riesgo crítico — ¿cuál es tu plan concreto para cada una? ¿En qué necesitas apoyo?`)
  else
    q.push('¿Hay alguna cuenta que te preocupe aunque el HS no lo refleje todavía?')

  // Contacto y gestión del tiempo
  q.push('¿Cómo organizas tu semana para dividir tiempo entre retención, expansión y tareas operativas?')
  if (sinContacto14.length > 0)
    q.push(`Hay ${sinContacto14.length} cuentas sin contacto en más de 14 días — ¿qué fue lo que lo impidió?`)

  // CRM y registro
  if (sinProximo.length > 3)
    q.push(`${sinProximo.length} cuentas no tienen fecha de próximo contacto — ¿cómo estás gestionando tu agenda de seguimiento?`)

  // Expansión / Upsell
  if (conOportunidad.length > 0)
    q.push(`Tienes ${conOportunidad.length} oportunidad(es) de expansión activas — ¿cuál tiene mayor probabilidad de cerrar este mes y qué necesitas para lograrlo?`)
  else
    q.push('¿Identificaste alguna oportunidad de expansión en las conversaciones de esta semana? ¿Qué te impide avanzarla?')

  // Clientes nuevos
  if (nuevos.length > 0)
    q.push(`Tienes ${nuevos.length} cliente(s) nuevos (< 3 meses) — ¿cómo va su adopción? ¿Llegaron a tener su primer "momento de valor"?`)

  // Clientes veteranos
  if (veteranos.length > 0)
    q.push(`Tienes ${veteranos.length} cliente(s) con más de 2 años — ¿cuándo fue la última vez que tuvieron una conversación estratégica más allá del soporte?`)

  // Pagos
  if (sinPago.length > 0)
    q.push(`¿Cuál es el estatus de las ${sinPago.length} cuenta(s) con pago fuera de corriente? ¿Hay riesgo de cancelación vinculado a ello?`)

  // NPS / Satisfacción
  if (bajaNPS.length > 0)
    q.push(`Tienes ${bajaNPS.length} cliente(s) con NPS bajo — ¿has tenido una conversación de escucha activa con ellos? ¿Qué aprendiste?`)

  // Aprendizaje y mejora
  q.push('¿Qué fue lo más difícil de esta semana en la gestión de tus cuentas? ¿Cómo lo resolviste?')
  q.push('¿En qué necesitas apoyo del equipo o de herramientas para mejorar tu gestión este mes?')

  return { contexto: ctx, preguntas: q }
}

// ── Tarjeta de cuenta expandible ─────────────────────────────────────────────

function CuentaCard({ cuenta, acciones, preguntas }: {
  cuenta: Cuenta
  acciones: string[]
  preguntas: string[]
}) {
  const sem = getSemaforo(cuenta.health_score)
  const cfg = SEMAFORO_CONFIG[sem]

  return (
    <details
      className="group rounded-xl border overflow-hidden mb-2"
      style={{ borderColor: `${cfg.color}30`, background: `${cfg.color}04` }}
    >
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none
        hover:bg-black/[0.02] transition-colors">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
        <span className="font-mono text-[11px] text-textLow font-bold w-10 flex-shrink-0">
          {cuenta.consecutivo}
        </span>
        <span className="text-sm font-semibold text-textHi flex-1 truncate">
          {cuenta.empresa}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {cuenta.contacto_nombre && (
            <span className="hidden md:inline text-[10px] text-textLow truncate max-w-[110px]">
              {cuenta.contacto_nombre}
            </span>
          )}
          <span className="text-[10px] text-textLow">{formatMXN(cuenta.facturacion)}</span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${cfg.color}15`, color: cfg.color }}>
            HS {cuenta.health_score}
          </span>
          {!cuenta.pagos_al_corriente && (
            <span title="Pago pendiente"><Banknote size={13} className="text-rojo" /></span>
          )}
          {cuenta.tickets_abiertos > 0 && (
            <span title={`${cuenta.tickets_abiertos} ticket(s) abierto(s)`}>
              <TicketIcon size={13} className="text-naranja" />
            </span>
          )}
        </div>
        <ChevronDown size={14} className="text-textLow flex-shrink-0 ml-1
          transition-transform group-open:rotate-180" />
      </summary>

      <div className="px-4 pb-4 pt-3 grid sm:grid-cols-2 gap-5 border-t"
        style={{ borderColor: `${cfg.color}20` }}>
        {/* Acciones */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <CheckCircle2 size={13} className="text-cp" />
            <span className="text-[11px] font-bold text-cp uppercase tracking-wide">Acciones</span>
          </div>
          <ul className="space-y-2">
            {acciones.map((acc, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-textMid leading-relaxed">
                <CircleDot size={10} className="flex-shrink-0 mt-0.5 text-cp/40" />
                {acc}
              </li>
            ))}
          </ul>
        </div>
        {/* Preguntas */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <HelpCircle size={13} className="text-amarillo" />
            <span className="text-[11px] font-bold text-amarillo uppercase tracking-wide">Preguntas al asesor</span>
          </div>
          <ul className="space-y-2">
            {preguntas.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-textMid leading-relaxed">
                <span className="flex-shrink-0 font-bold text-[10px] text-amarillo/60 mt-0.5 w-3">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
        <div className="sm:col-span-2 flex justify-end pt-1 border-t border-border">
          <Link href={`/cuentas/${cuenta.id}`}
            className="text-[11px] text-cp hover:underline font-medium mt-2">
            Ver ficha completa →
          </Link>
        </div>
      </div>
    </details>
  )
}

// ── Bloque temático (Churn / Upsell / Panel) ─────────────────────────────────

function BloqueSection({ titulo, subtitulo, colorHex, cuentas: lista, getAcciones, getPreguntas, emptyMsg }: {
  titulo: string
  subtitulo: string
  colorHex: string
  cuentas: Cuenta[]
  getAcciones: (c: Cuenta) => string[]
  getPreguntas: (c: Cuenta) => string[]
  emptyMsg: string
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: colorHex }} />
        <div className="flex-1">
          <span className="text-sm font-bold mr-2" style={{ color: colorHex }}>{titulo}</span>
          <span className="text-[11px] text-textLow">{subtitulo}</span>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${colorHex}12`, color: colorHex }}>
          {lista.length}
        </span>
      </div>
      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-4 px-4 text-center text-xs text-textLow">
          {emptyMsg}
        </div>
      ) : (
        lista.map(c => (
          <CuentaCard key={c.id} cuenta={c} acciones={getAcciones(c)} preguntas={getPreguntas(c)} />
        ))
      )}
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default async function SeguimientoPage() {
  const cuentas = await getCuentas({ estado: 'activo' })

  const asesores: Asesor[] = ['Fátima', 'Dan', 'Claudia']
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const totalChurn   = cuentas.filter(c => c.health_score < 60).length
  const totalTickets = cuentas.reduce((s, c) => s + c.tickets_abiertos, 0)

  return (
    <div className="min-h-screen pb-16">
      <PageHeader
        title="Seguimiento y Mentoring"
        subtitle={`${today} · ${cuentas.length} cuentas activas`}
        actions={
          <div className="flex items-center gap-3 text-xs">
            {totalChurn > 0 && (
              <span className="flex items-center gap-1 text-rojo font-semibold">
                <AlertTriangle size={13} />
                {totalChurn} en riesgo
              </span>
            )}
            {totalTickets > 0 && (
              <span className="flex items-center gap-1 text-naranja font-semibold">
                <TicketIcon size={13} />
                {totalTickets} tickets abiertos
              </span>
            )}
          </div>
        }
      />

      <div className="px-6 space-y-4 mt-2">
        {asesores.map(asesor => {
          const ac = ASESOR_CONFIG[asesor]
          const lista = cuentas.filter(c => c.asesor === asesor)

          // Semáforo calculado localmente
          const verde    = lista.filter(c => c.health_score >= 80).length
          const azul     = lista.filter(c => c.health_score >= 60 && c.health_score < 80).length
          const amarillo = lista.filter(c => c.health_score >= 40 && c.health_score < 60).length
          const naranja  = lista.filter(c => c.health_score >= 20 && c.health_score < 40).length
          const rojo     = lista.filter(c => c.health_score < 20).length
          const facturacionTotal  = lista.reduce((s, c) => s + (c.facturacion ?? 0), 0)
          const facturacionRiesgo = lista.filter(c => c.health_score < 40)
            .reduce((s, c) => s + (c.facturacion ?? 0), 0)

          // Bloques
          const churnLista = [...lista]
            .filter(c => c.health_score < 60)
            .sort((a, b) => a.health_score - b.health_score)

          const conOportunidad = lista.filter(c =>
            c.upsell_producto || c.crossell_producto || c.valor_upsell_estimado
          )
          const upsellLista = conOportunidad.length > 0
            ? conOportunidad
            : [...lista]
                .filter(c => c.health_score >= 70)
                .sort((a, b) => b.facturacion - a.facturacion)
                .slice(0, 5)

          const panelLista = [...lista]
            .filter(c => !c.dashboard_revisado || !c.tiene_chat_activo || c.dias_sin_actividad > 14)
            .sort((a, b) => b.dias_sin_actividad - a.dias_sin_actividad)

          const semPills = [
            { v: verde,    c: '#22C55E' },
            { v: azul,     c: '#3B82F6' },
            { v: amarillo, c: '#EAB308' },
            { v: naranja,  c: '#F97316' },
            { v: rojo,     c: '#EF4444' },
          ].filter(s => s.v > 0)

          return (
            <details key={asesor} open
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: `${ac.color}30` }}>

              {/* Header asesor */}
              <summary
                className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none
                  hover:bg-black/[0.015] transition-colors group"
                style={{ background: `${ac.color}06` }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: `${ac.color}20`, color: ac.color, border: `2px solid ${ac.color}40` }}>
                  {ac.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-textHi">{asesor}</p>
                  <p className="text-xs text-textLow">
                    {lista.length} cuentas · {formatMXN(facturacionTotal)}
                    {facturacionRiesgo > 0 && (
                      <span className="text-rojo ml-1.5">
                        · {formatMXN(facturacionRiesgo)} en riesgo
                      </span>
                    )}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1 mr-2">
                  {semPills.map((s, i) => (
                    <span key={i}
                      className="text-[11px] font-bold px-2 py-0.5 rounded"
                      style={{ background: `${s.c}18`, color: s.c }}>
                      {s.v}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {churnLista.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-rojo">
                      <AlertTriangle size={11} />
                      {churnLista.length}
                    </span>
                  )}
                  <ChevronDown
                    size={15}
                    className="text-textLow transition-transform group-open:rotate-180"
                  />
                </div>
              </summary>

              {/* Contenido */}
              <div className="px-5 py-5 border-t" style={{ borderColor: `${ac.color}20` }}>

                {/* 1 — CHURN */}
                <BloqueSection
                  titulo="Retención y Churn"
                  subtitulo="Cuentas con health score < 60 — intervención prioritaria"
                  colorHex="#DC2626"
                  cuentas={churnLista}
                  getAcciones={churnAcciones}
                  getPreguntas={churnPreguntas}
                  emptyMsg="✓ Todas las cuentas superan 60 de health score. Sin riesgo de churn esta semana."
                />

                <div className="border-t border-border my-5" />

                {/* 2 — UPSELL / CROSS-SELL */}
                <BloqueSection
                  titulo="Upsell y Cross-sell"
                  subtitulo={
                    conOportunidad.length > 0
                      ? 'Oportunidades activas de expansión'
                      : `Sin oportunidades registradas — candidatos saludables (HS ≥ 70)`
                  }
                  colorHex="#A855F7"
                  cuentas={upsellLista}
                  getAcciones={upsellAcciones}
                  getPreguntas={upsellPreguntas}
                  emptyMsg="Sin oportunidades activas ni cuentas candidatas disponibles."
                />

                <div className="border-t border-border my-5" />

                {/* 3 — PANEL DE CONTROL */}
                <BloqueSection
                  titulo="Uso del Panel de Control"
                  subtitulo="Sin dashboard revisado, sin chat activo o con más de 14 días de inactividad"
                  colorHex="#0057FF"
                  cuentas={panelLista}
                  getAcciones={panelAcciones}
                  getPreguntas={panelPreguntas}
                  emptyMsg="✓ Todas las cuentas tienen el panel activo y revisado."
                />

                <div className="border-t border-border my-5" />

                {/* 4 — MENTORING ONE-ON-ONE */}
                {(() => {
                  const { contexto, preguntas } = mentoringOneOnOne(asesor, lista)
                  return (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: ac.color }} />
                        <div className="flex-1">
                          <span className="text-sm font-bold mr-2" style={{ color: ac.color }}>
                            Mentoring One-on-One
                          </span>
                          <span className="text-[11px] text-textLow">
                            Preguntas de diagnóstico para la sesión semanal con {asesor}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: `${ac.color}12`, color: ac.color }}>
                          <Brain size={10} /> {preguntas.length} preguntas
                        </span>
                      </div>

                      {/* Contexto del portafolio */}
                      {contexto.length > 0 && (
                        <div className="rounded-xl border p-3 mb-3 space-y-1.5"
                          style={{ borderColor: `${ac.color}25`, background: `${ac.color}05` }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Info size={11} style={{ color: ac.color }} />
                            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: ac.color }}>
                              Contexto del portafolio
                            </span>
                          </div>
                          {contexto.map((ctx, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-textMid">
                              <CircleDot size={9} className="flex-shrink-0 mt-0.5" style={{ color: ac.color }} />
                              {ctx}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Preguntas */}
                      <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${ac.color}25` }}>
                        {preguntas.map((q, i) => (
                          <div key={i}
                            className="flex items-start gap-3 px-4 py-3 text-xs border-b last:border-b-0"
                            style={{ borderColor: `${ac.color}15` }}>
                            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                              style={{ background: `${ac.color}18`, color: ac.color }}>
                              {i + 1}
                            </span>
                            <span className="text-textMid leading-relaxed">{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
