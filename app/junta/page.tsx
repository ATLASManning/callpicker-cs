import {
  getCuentas, getSemaforoByAsesor,
  getSeguimientosRango, getOportunidadesActivas, getTicketsAbiertos,
} from '@/lib/supabase'
import { formatMXN, ASESOR_CONFIG } from '@/lib/types'
import type { Asesor } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import JuntaAsesorPanel from '@/components/JuntaAsesorPanel'
import { AlertTriangle, Phone, MessageCircle, Mail, TrendingUp, TicketIcon, CalendarDays } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ── Semana actual (lunes → domingo) ─────────────────────────────────────────
function getWeekRange() {
  const now = new Date()
  const day = now.getDay() // 0=Dom, 1=Lun … 6=Sáb
  const toMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + toMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const fmtShort = (d: Date) =>
    d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  const desde = monday.toISOString().split('T')[0]
  const hasta = sunday.toISOString().split('T')[0]
  const label = `${fmtShort(monday)} – ${fmtShort(sunday)}, ${sunday.getFullYear()}`

  return { desde, hasta, label }
}

export default async function JuntaSemanalPage() {
  const { desde, hasta, label: weekLabel } = getWeekRange()

  const [cuentas, resumen, seguimientosAll, oportunidadesAll, ticketsAll] = await Promise.all([
    getCuentas({ estado: 'activo' }),
    getSemaforoByAsesor(),
    getSeguimientosRango(desde, hasta),
    getOportunidadesActivas(),
    getTicketsAbiertos(),
  ])

  const asesores: Asesor[] = ['Fátima', 'Dan', 'Claudia']
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const criticas = cuentas.filter(c => c.health_score < 20)

  // ── Totales globales de la semana ──────────────────────────────────────────
  const totalSeguimientos = seguimientosAll.length
  const totalLlamadas    = seguimientosAll.filter(s => s.tipo === 'llamada').length
  const totalWhatsapp    = seguimientosAll.filter(s => s.tipo === 'whatsapp').length
  const totalEmails      = seguimientosAll.filter(s => s.tipo === 'email').length
  const totalReuniones   = seguimientosAll.filter(s => s.tipo === 'reunion').length
  const totalUpsellSegs  = seguimientosAll.filter(s => s.tipo === 'upsell').length
  const totalTickets     = ticketsAll.length
  const totalOpps        = oportunidadesAll.length
  const valorOpps        = oportunidadesAll.reduce((s, o) => s + (o.valor_estimado ?? 0), 0)

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Junta Semanal"
        subtitle={`${today} · Semana ${weekLabel}`}
        actions={
          <div className="flex items-center gap-2 text-xs text-textLow">
            <CalendarDays size={14} />
            <span className="font-medium">{weekLabel}</span>
          </div>
        }
      />

      {/* ── Alertas críticas ── */}
      {criticas.length > 0 && (
        <div className="mx-6 mb-5 p-4 bg-rojo/8 border border-rojo/25 rounded-xl">
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle size={15} className="text-rojo flex-shrink-0" />
            <p className="text-sm font-semibold text-rojo">
              {criticas.length} cuenta{criticas.length > 1 ? 's' : ''} en Riesgo Alto — Intervención inmediata
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {criticas.map(c => (
              <Link key={c.id} href={`/cuentas/${c.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-rojo/12 border border-rojo/30 rounded-lg text-xs hover:bg-rojo/20 transition-colors">
                <span className="font-mono font-bold text-rojo">{c.consecutivo}</span>
                <span className="text-textHi">{c.empresa}</span>
                <span className="text-rojo font-bold">{c.health_score}</span>
                <span className="text-textLow">{formatMXN(c.facturacion)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── KPIs de la semana ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 px-6 mb-6">
        {[
          { label: 'Seguimientos',  value: totalSeguimientos, icon: CalendarDays,   color: '#0057FF' },
          { label: 'Llamadas',      value: totalLlamadas,      icon: Phone,          color: '#0057FF' },
          { label: 'WhatsApp',      value: totalWhatsapp,      icon: MessageCircle,  color: '#22C55E' },
          { label: 'Emails',        value: totalEmails,        icon: Mail,           color: '#6366F1' },
          { label: 'Reuniones',     value: totalReuniones,     icon: TrendingUp,     color: '#F97316' },
          { label: 'Upsell logs',   value: totalUpsellSegs,    icon: TrendingUp,     color: '#A855F7' },
          { label: 'Tickets open',  value: totalTickets,       icon: TicketIcon,     color: '#EF4444' },
          { label: 'Oportunidades', value: totalOpps,          icon: TrendingUp,     color: '#0EA5E9' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="cp-card p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Icon size={12} style={{ color }} />
              <span className="text-[10px] text-textLow uppercase tracking-wide font-medium">{label}</span>
            </div>
            <span className="text-xl font-bold" style={{ color: value > 0 ? color : '#CBD5E1' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Valor pipeline ── */}
      {valorOpps > 0 && (
        <div className="mx-6 mb-5 px-4 py-3 rounded-xl border border-cpTeal/30 bg-cpTeal/5 flex items-center gap-3">
          <TrendingUp size={16} className="text-cpTeal flex-shrink-0" />
          <p className="text-sm text-textMid">
            Pipeline activo de oportunidades:{' '}
            <span className="font-bold text-cpTeal">{formatMXN(valorOpps)}</span>
            {' '}en {totalOpps} oportunidad{totalOpps > 1 ? 'es' : ''}
          </p>
        </div>
      )}

      {/* ── Panel por asesor ── */}
      <div className="px-6 pb-8">
        {asesores.map(asesor => {
          const semaforoAsesor = resumen.find(r => r.asesor === asesor)
          const cuentasAsesor  = cuentas.filter(c => c.asesor === asesor)

          // Seguimientos: primero intenta por campo asesor; si está null, usa la cuenta
          const segsAsesor = seguimientosAll.filter(s =>
            s.asesor === asesor ||
            (s.asesor === null && s.cuentas?.asesor === asesor)
          )

          const ticketsAsesor = ticketsAll.filter(t => t.cuentas?.asesor === asesor)
          const oppsAsesor    = oportunidadesAll.filter(o => o.cuentas?.asesor === asesor)

          return (
            <JuntaAsesorPanel
              key={asesor}
              asesor={asesor}
              semaforo={semaforoAsesor}
              seguimientos={segsAsesor}
              tickets={ticketsAsesor}
              oportunidades={oppsAsesor}
              cuentas={cuentasAsesor}
              weekLabel={weekLabel}
            />
          )
        })}
      </div>
    </div>
  )
}
