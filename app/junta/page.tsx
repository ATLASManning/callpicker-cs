import { getCuentas, getSemaforoByAsesor } from '@/lib/supabase'
import {
  formatMXN, getSemaforo, SEMAFORO_CONFIG, ASESOR_CONFIG,
} from '@/lib/types'
import type { Asesor, Cuenta, SemaforoAsesor } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import {
  AlertTriangle, TrendingUp, LayoutDashboard, ChevronDown,
  CircleDot, CheckCircle2, HelpCircle, Phone, CalendarDays,
  Banknote, TicketIcon, Activity,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ── Generadores de Acciones ──────────────────────────────────────────────────

function churnAcciones(c: Cuenta): string[] {
  const a: string[] = []

  if (c.dias_sin_actividad > 30)
    a.push(`Contacto urgente — ${c.dias_sin_actividad} días sin actividad registrada`)
  else if (c.dias_sin_actividad > 14)
    a.push(`Programar llamada de reactivación (${c.dias_sin_actividad} días sin contacto)`)
  else if (c.dias_sin_actividad > 7)
    a.push('Check-in rápido vía WhatsApp o correo electrónico')

  if (!c.pagos_al_corriente)
    a.push('Gestionar regularización de pagos — coordinar con cobranza')

  if (c.tickets_abiertos > 0)
    a.push(`Escalar y dar cierre a ${c.tickets_abiertos} ticket${c.tickets_abiertos > 1 ? 's' : ''} abierto${c.tickets_abiertos > 1 ? 's' : ''}`)

  if (c.tiene_ticket_reincidente)
    a.push('Ticket reincidente: escalar a soporte N2 con análisis de causa raíz')

  if (c.score_adopcion < 40)
    a.push('Sesión de reactivación — revisar adopción de producto con el cliente')

  if (c.llamadas_atendidas_pct < 50)
    a.push(`Analizar calidad de atención — ${c.llamadas_atendidas_pct.toFixed(0)}% llamadas atendidas`)

  if (!c.proximo_contacto)
    a.push('Registrar fecha de próximo contacto en CRM')
  else
    a.push(`Confirmar agenda para el ${new Date(c.proximo_contacto).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`)

  if (c.health_score < 20)
    a.push('Elaborar plan de rescate por escrito y presentarlo al equipo de CS')

  if (a.length === 0)
    a.push('Mantener cadencia de contacto semanal y validar satisfacción del cliente')

  return a
}

function churnPreguntas(c: Cuenta): string[] {
  const q = [
    `¿Cuál es la causa raíz de la caída en el health score de ${c.empresa}?`,
    c.contacto_nombre
      ? `¿Cuándo fue el último contacto directo con ${c.contacto_nombre}?`
      : '¿Quién es el tomador de decisiones actual en esta cuenta?',
    `¿${c.empresa} ha expresado intención de cancelar o reducir el servicio?`,
    '¿Tienes un plan de rescate documentado para esta cuenta?',
  ]
  if (!c.pagos_al_corriente)
    q.push('¿Cuál es el estatus del adeudo y el compromiso de pago del cliente?')
  if (c.health_score < 20)
    q.push('¿Se ha escalado esta situación a dirección de CS o comercial?')
  if (c.tiene_ticket_reincidente)
    q.push('¿Cuál es la causa del ticket reincidente y cuándo se resuelve definitivamente?')
  if (c.dias_sin_actividad > 30)
    q.push('¿Has logrado hablar con el cliente en este período? ¿Cuál fue su respuesta?')
  return q
}

function upsellAcciones(c: Cuenta): string[] {
  const a: string[] = []
  if (c.upsell_producto)
    a.push(`Avanzar propuesta de Upsell: ${c.upsell_producto}`)
  if (c.crossell_producto)
    a.push(`Presentar propuesta de Cross-sell: ${c.crossell_producto}`)
  if (!c.upsell_producto && !c.crossell_producto)
    a.push('Identificar necesidad de expansión en la próxima llamada de negocio')
  if (c.valor_upsell_estimado)
    a.push(`Dar seguimiento a oportunidad estimada en ${formatMXN(c.valor_upsell_estimado)}`)
  a.push('Calificar al decisor e identificar nivel de urgencia')
  a.push('Preparar caso de éxito o cálculo de ROI para el producto objetivo')
  a.push('Agendar demo o presentación ejecutiva con el equipo del cliente')
  return a
}

function upsellPreguntas(c: Cuenta): string[] {
  const q = [
    `¿En qué etapa del proceso de venta está la oportunidad con ${c.empresa}?`,
    '¿Tienes identificado al tomador de decisión para esta compra?',
    '¿Hay competidores o alternativas que el cliente esté evaluando?',
    '¿Tienes una fecha estimada de cierre para esta oportunidad?',
    '¿Qué objeciones ha planteado el cliente y cómo planeas resolverlas?',
  ]
  if (c.valor_upsell_estimado)
    q.push(`¿El cliente ha aprobado internamente el presupuesto de ${formatMXN(c.valor_upsell_estimado)}?`)
  else
    q.push('¿Has estimado y cotizado el valor de la oportunidad al cliente?')
  return q
}

function panelAcciones(c: Cuenta): string[] {
  const a: string[] = []
  if (!c.dashboard_revisado)
    a.push('Agendar sesión de revisión del panel de control con el cliente')
  if (c.dias_sin_actividad > 14)
    a.push('Enviar reporte de uso comparativo (mes actual vs. mes anterior)')
  if (!c.tiene_chat_activo)
    a.push('Activar y configurar el módulo de Chat para esta cuenta')
  if (!c.tiene_ia_voz && !c.tiene_ia_chat)
    a.push('Demostrar los módulos de IA de voz y chat al equipo del cliente')
  if (!c.tiene_integracion_api)
    a.push('Evaluar integración vía API con el CRM/ERP del cliente')
  if (!c.tiene_pago_automatico)
    a.push('Invitar al cliente a activar domiciliación de pago automático')
  a.push('Compartir guía de mejores prácticas y casos de uso del panel')
  if (a.length <= 1)
    a.push('Validar que el cliente revise sus métricas de llamadas semanalmente')
  return a
}

function panelPreguntas(c: Cuenta): string[] {
  const q = [
    `¿${c.empresa} revisa activamente su panel de control?`,
    '¿Cuántos usuarios administradores tiene configurados en la plataforma?',
    '¿Han explorado los reportes de llamadas, métricas y grabaciones?',
    '¿Hay alguna función del panel que les genere duda o fricción?',
  ]
  if (!c.tiene_chat_activo)
    q.push('¿Por qué aún no han activado el módulo de Chat?')
  if (!c.tiene_ia_voz && !c.tiene_ia_chat)
    q.push('¿Han considerado implementar IA para mejorar su atención?')
  if (!c.dashboard_revisado)
    q.push('¿Cuándo fue la última vez que el cliente revisó sus estadísticas?')
  return q
}

// ── Componente de tarjeta de cuenta ─────────────────────────────────────────

function CuentaCard({
  cuenta,
  acciones,
  preguntas,
}: {
  cuenta: Cuenta
  acciones: string[]
  preguntas: string[]
}) {
  const sem = getSemaforo(cuenta.health_score)
  const cfg = SEMAFORO_CONFIG[sem]

  return (
    <details className="group rounded-xl border overflow-hidden mb-2 transition-all open:shadow-sm"
      style={{ borderColor: `${cfg.color}30`, background: `${cfg.color}04` }}>
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none list-none
        hover:bg-black/[0.02] transition-colors">
        {/* Indicador semáforo */}
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: cfg.color }} />

        {/* Consecutivo + empresa */}
        <span className="font-mono text-[11px] text-textLow font-bold w-10 flex-shrink-0">
          {cuenta.consecutivo}
        </span>
        <span className="text-sm font-semibold text-textHi flex-1 truncate">
          {cuenta.empresa}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {cuenta.contacto_nombre && (
            <span className="hidden sm:inline text-[10px] text-textLow truncate max-w-[120px]">
              {cuenta.contacto_nombre}
            </span>
          )}
          <span className="text-[10px] font-medium text-textLow">
            {formatMXN(cuenta.facturacion)}
          </span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${cfg.color}15`, color: cfg.color }}>
            HS {cuenta.health_score}
          </span>
          {!cuenta.pagos_al_corriente && (
            <span title="Pago pendiente">
              <Banknote size={13} className="text-rojo" />
            </span>
          )}
          {cuenta.tickets_abiertos > 0 && (
            <span title={`${cuenta.tickets_abiertos} ticket(s) abierto(s)`}>
              <TicketIcon size={13} className="text-naranja" />
            </span>
          )}
        </div>

        <ChevronDown size={14} className="text-textLow flex-shrink-0 transition-transform group-open:rotate-180 ml-1" />
      </summary>

      {/* Detalle expandido */}
      <div className="px-4 pb-4 pt-2 grid sm:grid-cols-2 gap-4 border-t"
        style={{ borderColor: `${cfg.color}20` }}>

        {/* Acciones */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={13} className="text-cp" />
            <span className="text-[11px] font-bold text-cp uppercase tracking-wide">Acciones</span>
          </div>
          <ul className="space-y-1.5">
            {acciones.map((acc, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-textMid">
                <CircleDot size={10} className="flex-shrink-0 mt-0.5 text-cp/50" />
                {acc}
              </li>
            ))}
          </ul>
        </div>

        {/* Preguntas */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <HelpCircle size={13} className="text-amarillo" />
            <span className="text-[11px] font-bold text-amarillo uppercase tracking-wide">Preguntas al asesor</span>
          </div>
          <ul className="space-y-1.5">
            {preguntas.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-textMid">
                <span className="flex-shrink-0 font-bold text-[10px] text-amarillo/70 mt-0.5">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer con link */}
        <div className="sm:col-span-2 flex items-center justify-end pt-1">
          <Link href={`/cuentas/${cuenta.id}`}
            className="text-[11px] text-cp hover:underline font-medium flex items-center gap-1">
            Ver ficha completa →
          </Link>
        </div>
      </div>
    </details>
  )
}

// ── Bloque temático (Churn / Upsell / Panel) ─────────────────────────────────

function BloqueSection({
  titulo, subtitulo, icon: Icon, color, cuentas: lista,
  getAcciones, getPreguntas, emptyMsg,
}: {
  titulo: string
  subtitulo: string
  icon: React.ElementType
  color: string
  cuentas: Cuenta[]
  getAcciones: (c: Cuenta) => string[]
  getPreguntas: (c: Cuenta) => string[]
  emptyMsg: string
}) {
  return (
    <div className="mb-6">
      {/* Bloque header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color }}>{titulo}</p>
          <p className="text-[11px] text-textLow">{subtitulo}</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}12`, color }}>
          {lista.length} cuenta{lista.length !== 1 ? 's' : ''}
        </span>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-5 px-4 text-center text-xs text-textLow">
          {emptyMsg}
        </div>
      ) : (
        <div>
          {lista.map(c => (
            <CuentaCard
              key={c.id}
              cuenta={c}
              acciones={getAcciones(c)}
              preguntas={getPreguntas(c)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export default async function JuntaSemanalPage() {
  const [cuentas, resumen] = await Promise.all([
    getCuentas({ estado: 'activo' }),
    getSemaforoByAsesor(),
  ])

  const asesores: Asesor[] = ['Fátima', 'Dan', 'Claudia']
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // Totales globales de alerta
  const totalChurn = cuentas.filter(c => c.health_score < 60).length
  const totalTickets = cuentas.reduce((s, c) => s + c.tickets_abiertos, 0)

  return (
    <div className="min-h-screen pb-16">
      <PageHeader
        title="Junta Semanal de Mentoring"
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

      <div className="px-6 space-y-5 mt-2">
        {asesores.map(asesor => {
          const ac = ASESOR_CONFIG[asesor]
          const sData = resumen.find(r => r.asesor === asesor) as SemaforoAsesor | undefined
          const lista = cuentas.filter(c => c.asesor === asesor)

          // Clasificación de cuentas
          const churnLista = [...lista]
            .filter(c => c.health_score < 60)
            .sort((a, b) => a.health_score - b.health_score)

          // Upsell: primero las que tienen dato, luego saludables como candidatos
          const conOportunidad = lista.filter(c =>
            c.upsell_producto || c.crossell_producto || c.valor_upsell_estimado
          )
          const upsellLista = conOportunidad.length > 0
            ? conOportunidad
            : [...lista].filter(c => c.health_score >= 70)
                .sort((a, b) => b.facturacion - a.facturacion)
                .slice(0, 6)

          const upsellSubtitulo = conOportunidad.length > 0
            ? 'Oportunidades activas de expansión'
            : `Sin oportunidades registradas — mostrando ${upsellLista.length} cuentas saludables como candidatos`

          // Panel: sin dashboard revisado, sin chat, o inactivos
          const panelLista = [...lista]
            .filter(c => !c.dashboard_revisado || !c.tiene_chat_activo || c.dias_sin_actividad > 14)
            .sort((a, b) => b.dias_sin_actividad - a.dias_sin_actividad)

          return (
            <details key={asesor} open
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: `${ac.color}30` }}>

              {/* ── Header del asesor ── */}
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none list-none
                hover:bg-black/[0.015] transition-colors group"
                style={{ background: `${ac.color}06` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: `${ac.color}20`,
                    color: ac.color,
                    border: `2px solid ${ac.color}40`,
                  }}>
                  {ac.initial}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-textHi">{asesor}</p>
                  <p className="text-xs text-textLow">
                    {lista.length} cuentas
                    {sData && ` · ${formatMXN(sData.facturacion_total)}`}
                    {sData?.facturacion_en_riesgo ? (
                      <span className="text-rojo ml-1.5">
                        · {formatMXN(sData.facturacion_en_riesgo)} en riesgo
                      </span>
                    ) : null}
                  </p>
                </div>

                {/* Semáforo mini pills */}
                {sData && (
                  <div className="hidden sm:flex items-center gap-1 mr-3">
                    {[
                      { v: sData.verde,    c: '#22C55E', l: 'V' },
                      { v: sData.azul,     c: '#3B82F6', l: 'A' },
                      { v: sData.amarillo, c: '#EAB308', l: 'Am' },
                      { v: sData.naranja,  c: '#F97316', l: 'N' },
                      { v: sData.rojo,     c: '#EF4444', l: 'R' },
                    ].filter(s => s.v > 0).map((s, i) => (
                      <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded"
                        style={{ background: `${s.c}18`, color: s.c }}>
                        {s.v}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {churnLista.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-rojo">
                      <AlertTriangle size={11} />
                      {churnLista.length} riesgo
                    </span>
                  )}
                  <ChevronDown size={15} className="text-textLow transition-transform group-open:rotate-180" />
                </div>
              </summary>

              {/* ── Contenido del asesor ── */}
              <div className="px-5 py-5 border-t" style={{ borderColor: `${ac.color}20` }}>

                {/* 1. CHURN */}
                <BloqueSection
                  titulo="Retención y Churn"
                  subtitulo="Cuentas con health score < 60 — intervención prioritaria"
                  icon={AlertTriangle}
                  color="#DC2626"
                  cuentas={churnLista}
                  getAcciones={churnAcciones}
                  getPreguntas={churnPreguntas}
                  emptyMsg="✓ Todas las cuentas de este asesor están por encima de 60 de health score. Sin riesgo de churn esta semana."
                />

                {/* Divider */}
                <div className="border-t border-border mb-6" />

                {/* 2. UPSELL / CROSSELL */}
                <BloqueSection
                  titulo="Upsell y Cross-sell"
                  subtitulo={upsellSubtitulo}
                  icon={TrendingUp}
                  color="#A855F7"
                  cuentas={upsellLista}
                  getAcciones={upsellAcciones}
                  getPreguntas={upsellPreguntas}
                  emptyMsg="Sin oportunidades activas ni cuentas saludables candidatas registradas."
                />

                {/* Divider */}
                <div className="border-t border-border mb-6" />

                {/* 3. PANEL DE CONTROL */}
                <BloqueSection
                  titulo="Uso del Panel de Control"
                  subtitulo="Cuentas sin dashboard revisado, sin chat activo o con más de 14 días de inactividad"
                  icon={LayoutDashboard}
                  color="#0057FF"
                  cuentas={panelLista}
                  getAcciones={panelAcciones}
                  getPreguntas={panelPreguntas}
                  emptyMsg="✓ Todas las cuentas de este asesor tienen el panel activo y revisado."
                />

              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
