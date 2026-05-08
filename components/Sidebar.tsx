'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, CalendarCheck, BarChart3,
  MessageSquare, TrendingUp, Settings, ChevronRight,
  Phone, Activity
} from 'lucide-react'

const NAV = [
  { href: '/',          label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/cuentas',   label: 'Cuentas',         icon: Users },
  { href: '/junta',     label: 'Junta Semanal',   icon: CalendarCheck },
  { href: '/asesores',  label: 'Asesores',        icon: Activity },
  { href: '/metricas',  label: 'Métricas',        icon: BarChart3 },
  { href: '/chat',      label: 'Atlas IA',        icon: MessageSquare },
  { href: '/upsell',    label: 'Upsell / Cross',  icon: TrendingUp },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 bg-bgAlt border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cp flex items-center justify-center shadow-glow-cp">
            <Phone size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-textHi leading-tight">Callpicker</p>
            <p className="text-[10px] text-cpTeal font-medium tracking-wide uppercase">Customer Success</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                ${active
                  ? 'bg-cp/15 text-cpTeal border-l-2 border-cp pl-[10px]'
                  : 'text-textMid hover:bg-surface hover:text-textHi'
                }`}
            >
              <Icon size={16} className={active ? 'text-cp' : 'text-textLow group-hover:text-textMid'} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-cp opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cp/20 flex items-center justify-center">
            <span className="text-xs font-bold text-cp">CS</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-textHi truncate">Equipo UX</p>
            <p className="text-[10px] text-textLow truncate">callpicker.com</p>
          </div>
          <Link href="/settings" className="ml-auto text-textLow hover:text-textMid">
            <Settings size={14} />
          </Link>
        </div>
      </div>
    </aside>
  )
}
