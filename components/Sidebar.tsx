'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BarChart3,
  MessageSquare, TrendingUp, Settings, ChevronRight,
  Phone, Activity, BookOpenCheck,
} from 'lucide-react'

const NAV = [
  { href: '/',              label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/cuentas',       label: 'Cuentas',         icon: Users },
  { href: '/seguimiento',   label: 'Seguimiento',     icon: BookOpenCheck },
  { href: '/asesores',      label: 'Asesores',        icon: Activity },
  { href: '/metricas',      label: 'Métricas',        icon: BarChart3 },
  { href: '/chat',          label: 'Atlas IA',        icon: MessageSquare },
  { href: '/upsell',        label: 'Upsell / Cross',  icon: TrendingUp },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full" style={{ background: '#1E3A5F', borderRight: '1px solid #2D4D73' }}>
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid #2D4D73' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cp flex items-center justify-center shadow-glow-cp">
            <Phone size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: '#F0F7FF' }}>Callpicker</p>
            <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: '#38BDF8' }}>Customer Success</p>
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
                  ? 'border-l-2 border-cp pl-[10px]'
                  : ''
                }`}
              style={active
                ? { background: 'rgba(0,87,255,0.18)', color: '#38BDF8' }
                : { color: '#94BBDD' }
              }
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = '#2D4D73'; (e.currentTarget as HTMLElement).style.color = '#F0F7FF' } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = '#94BBDD' } }}
            >
              <Icon size={16} style={{ color: active ? '#3B82F6' : '#6B8FAF' }} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" style={{ color: '#3B82F6' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid #2D4D73' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,87,255,0.25)' }}>
            <span className="text-xs font-bold" style={{ color: '#3B82F6' }}>CS</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#F0F7FF' }}>Equipo UX</p>
            <p className="text-[10px] truncate" style={{ color: '#6B8FAF' }}>callpicker.com</p>
          </div>
          <Link href="/settings" className="ml-auto" style={{ color: '#6B8FAF' }}>
            <Settings size={14} />
          </Link>
        </div>
      </div>
    </aside>
  )
}
