'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BarChart3,
  MessageSquare, TrendingUp, Settings, ChevronRight,
  Phone, Activity, BookOpenCheck, CalendarDays, ClipboardList, TrendingDown, Ticket,
} from 'lucide-react'

const NAV = [
  { href: '/',              label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/cuentas',       label: 'Cuentas',           icon: Users },
  { href: '/seguimiento',   label: 'Seguimiento',       icon: BookOpenCheck },
  { href: '/reuniones',     label: 'Reuniones',         icon: CalendarDays },
  { href: '/asesores',      label: 'Asesores',          icon: Activity },
  { href: '/metricas',      label: 'Métricas',          icon: BarChart3 },
  { href: '/chat',          label: 'Atlas IA',          icon: MessageSquare },
  { href: '/upsell',        label: 'Upsell / Cross',    icon: TrendingUp },
  { href: '/churn',         label: 'Churn',             icon: TrendingDown },
  { href: '/tickets',       label: 'Tickets',           icon: Ticket },
  { href: '/auditoria',     label: 'Auditoría Cuentas', icon: ClipboardList },
]

// Azul marino del sidebar: #0A1628
const SB   = '#0A1628'
const SB_D = '#071020'   // borde / divisor (más oscuro)
const SB_H = 'rgba(255,255,255,0.12)'  // hover
const SB_A = 'rgba(255,255,255,0.18)'  // active bg
const TX   = 'rgba(255,255,255,0.92)'  // texto principal
const TX_M = 'rgba(255,255,255,0.60)'  // texto secundario
const IC_A = '#FFFFFF'                 // ícono activo
const IC   = 'rgba(255,255,255,0.55)'  // ícono normal

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{ background: SB, borderRight: `1px solid ${SB_D}` }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${SB_D}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <Phone size={16} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: '#FFFFFF' }}>Callpicker</p>
            <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Customer Success
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={active
                ? { background: SB_A, color: TX, borderLeft: '3px solid rgba(255,255,255,0.9)', paddingLeft: 10 }
                : { color: TX_M }
              }
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = SB_H
                  ;(e.currentTarget as HTMLElement).style.color = TX
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = ''
                  ;(e.currentTarget as HTMLElement).style.color = TX_M
                }
              }}
            >
              <Icon size={16} style={{ color: active ? IC_A : IC, flexShrink: 0 }} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" style={{ color: 'rgba(255,255,255,0.6)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: `1px solid ${SB_D}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)' }}>
            <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>CS</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: TX }}>Equipo UX</p>
            <p className="text-[10px] truncate" style={{ color: TX_M }}>callpicker.com</p>
          </div>
          <Link href="/settings" className="ml-auto" style={{ color: TX_M }}>
            <Settings size={14} />
          </Link>
        </div>
      </div>
    </aside>
  )
}
