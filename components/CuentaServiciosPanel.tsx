/**
 * Panel de servicios contratados en la ficha de cuenta — Capa 1.
 *
 * Muestra los tres estados que NO son lo mismo y que el tablero venía
 * mezclando: contratado · en uso · sano. Y distingue «no se usa» de «no hay
 * cómo medirlo», que es la diferencia entre un hallazgo y un hueco de datos.
 *
 * Server component: recibe el inventario ya resuelto desde la página.
 */
import {
  Phone, MessageCircle, Bot, Hash, Network, Radio, Grid3x3, PhoneForwarded,
  CircleSlash, AlertTriangle, CheckCircle2, HelpCircle,
} from 'lucide-react'
import type { InventarioCuenta, ServicioCuenta, EstadoServicio, FamiliaServicio } from '@/lib/servicios-cuenta'

const ICONO: Record<FamiliaServicio, React.ElementType> = {
  'Voz · Visibilidad y Control':    Phone,
  'Voz · Comunicación Empresarial': Phone,
  'Voz · Plan Emprendedor':         Phone,
  'Chat':                           MessageCircle,
  'Asistente Virtual':              Bot,
  'DID':                            Hash,
  'Troncal SIP':                    Network,
  'Calltracking':                   Radio,
  'Conmutador Virtual':             Grid3x3,
  'Números Virtuales':              PhoneForwarded,
}

const ESTADO: Record<EstadoServicio, { label: string; color: string; icon: React.ElementType }> = {
  sano:         { label: 'En uso',         color: '#22C55E', icon: CheckCircle2 },
  bajo:         { label: 'Uso bajo',       color: '#F97316', icon: AlertTriangle },
  sin_uso:      { label: 'Sin uso',        color: '#EF4444', icon: CircleSlash },
  sin_medicion: { label: 'Sin medición',   color: '#64748B', icon: HelpCircle },
  no_medible:   { label: 'No medible hoy', color: '#475569', icon: HelpCircle },
}

export default function CuentaServiciosPanel({ inv }: { inv: InventarioCuenta }) {
  if (!inv.servicios.length) {
    return (
      <div className="cp-card">
        <p className="text-sm font-bold mb-1" style={{ color: '#fff' }}>Servicios contratados</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          No se pudo identificar ningún servicio para esta cuenta: ni su ficha lo declara, ni
          aparece en los cortes de facturación, ni tiene registro de chat.
        </p>
      </div>
    )
  }

  const conProblema = inv.servicios.filter(s => s.estado === 'sin_uso' || s.estado === 'bajo').length

  return (
    <div className="cp-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold" style={{ color: '#fff' }}>
            Servicios contratados
            <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full align-middle"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#93C5FD' }}>
              {inv.total}
            </span>
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {inv.conMedicion} con medición de uso
            {inv.noMedibles > 0 && ` · ${inv.noMedibles} sin fuente que los mida`}
            {inv.total > 1 && ' · cuenta multi-servicio: más expuesta, más exigente'}
          </p>
        </div>
        {conProblema > 0 && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0"
            style={{ background: 'rgba(249,115,22,0.18)', color: '#FDBA74' }}>
            {conProblema} requiere{conProblema > 1 ? 'n' : ''} atención
          </span>
        )}
      </div>

      <div className="space-y-2">
        {inv.servicios.map(s => <Fila key={s.familia} s={s} />)}
      </div>

      {inv.planUltimoCorte && (
        <p className="text-[11px] mt-3 pt-3" style={{ color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          Plan del último corte ({inv.mesUltimoCorte}): <span style={{ color: 'rgba(255,255,255,0.65)' }}>{inv.planUltimoCorte}</span>.
          El corte trae una sola línea de plan, así que no lista todos los servicios de la cuenta —
          por eso el inventario se arma cruzando la ficha, los cortes y la hoja de chat.
        </p>
      )}
    </div>
  )
}

function Fila({ s }: { s: ServicioCuenta }) {
  const e = ESTADO[s.estado]
  const Icon = ICONO[s.familia] ?? Phone
  const EstadoIcon = e.icon
  return (
    <div className="rounded-xl px-3.5 py-3"
      style={{ background: 'rgba(255,255,255,0.045)', border: `1px solid ${e.color}33` }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${e.color}1F` }}>
          <Icon size={15} style={{ color: e.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold" style={{ color: '#fff' }}>{s.familia}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: `${e.color}22`, color: e.color }}>
              <EstadoIcon size={10} />{e.label}
            </span>
          </div>
          <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.68)' }}>{s.detalle}</p>
          {s.evidencia.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {s.evidencia.map((ev, i) => (
                <li key={i} className="text-[10px] flex gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span>·</span>{ev}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
