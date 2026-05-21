'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, BarChart3, MessageSquare, TrendingUp,
  Settings, ChevronRight, Phone, Activity, BookOpenCheck,
  CalendarDays, ClipboardList, TrendingDown, Ticket, Receipt,
  Clock, ChevronDown,
} from 'lucide-react'

// ── Colores del sidebar ────────────────────────────────────────────────────────
const SB   = '#0A1628'
const SB_D = '#071020'
const SB_H = 'rgba(255,255,255,0.10)'
const SB_A = 'rgba(255,255,255,0.16)'
const TX   = 'rgba(255,255,255,0.92)'
const TX_M = 'rgba(255,255,255,0.55)'
const IC_A = '#FFFFFF'
const IC   = 'rgba(255,255,255,0.50)'

// ── Definición de nav ─────────────────────────────────────────────────────────
type NavItem   = { href: string; label: string; icon: React.ElementType }
type NavGroup  = { group: string; icon: React.ElementType; children: NavItem[] }
type NavEntry  = NavItem | NavGroup

function isGroup(e: NavEntry): e is NavGroup { return 'group' in e }

const NAV: NavEntry[] = [
  { href: '/',              label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/cuentas',       label: 'Cuentas',          icon: Users },
  { href: '/reuniones',     label: 'Reuniones',        icon: CalendarDays },

  // ── Grupo: Asesores ──────────────────────────────────────────────────────
  {
    group: 'Asesores',
    icon: Activity,
    children: [
      { href: '/asesores',    label: 'Panel Asesores',   icon: Activity },
      { href: '/seguimiento', label: 'Seguimiento',      icon: BookOpenCheck },
    ],
  },

  { href: '/metricas',      label: 'Métricas',         icon: BarChart3 },
  { href: '/chat',          label: 'Atlas IA',          icon: MessageSquare },
  { href: '/upsell',        label: 'Upsell / Cross',    icon: TrendingUp },
  { href: '/churn',         label: 'Churn',             icon: TrendingDown },
  { href: '/tickets',       label: 'Tickets',           icon: Ticket },
  { href: '/facturacion',   label: 'Corte Facturación', icon: Receipt },
  { href: '/customer-tenure', label: 'Customer Tenure', icon: Clock },
  { href: '/auditoria',     label: 'Auditoría Cuentas', icon: ClipboardList },
]

// ── NavLink simple ────────────────────────────────────────────────────────────
function NavLink({ href, label, icon: Icon, indent = false }: NavItem & { indent?: boolean }) {
  const path   = usePathname()
  const active = path === href || (href !== '/' && path.startsWith(href))

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg text-sm font-medium transition-all"
      style={{
        padding:     indent ? '8px 10px 8px 32px' : '10px 12px',
        background:  active ? SB_A : 'transparent',
        color:       active ? TX : TX_M,
        borderLeft:  active && !indent ? '3px solid rgba(255,255,255,0.85)' : '3px solid transparent',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = SB_H
          ;(e.currentTarget as HTMLElement).style.color = TX
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = TX_M
        }
      }}
    >
      <Icon size={indent ? 13 : 16} style={{ color: active ? IC_A : IC, flexShrink: 0 }} />
      <span className="flex-1 truncate">{label}</span>
      {active && !indent && (
        <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.5)' }} />
      )}
    </Link>
  )
}

// ── NavGroupItem (expandible) ─────────────────────────────────────────────────
function NavGroupItem({ group, icon: Icon, children }: NavGroup) {
  const path     = usePathname()
  const anyActive = children.some(c => path === c.href || path.startsWith(c.href))
  const [open, setOpen] = useState(anyActive)

  // Si la ruta cambia y algún hijo queda activo, abrir el grupo
  useEffect(() => { if (anyActive) setOpen(true) }, [anyActive])

  return (
    <div>
      {/* Cabecera del grupo */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{
          color:      anyActive ? TX : TX_M,
          background: anyActive ? 'rgba(255,255,255,0.07)' : 'transparent',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = SB_H
          ;(e.currentTarget as HTMLElement).style.color = TX
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = anyActive ? 'rgba(255,255,255,0.07)' : 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = anyActive ? TX : TX_M
        }}
      >
        <Icon size={16} style={{ color: anyActive ? IC_A : IC, flexShrink: 0 }} />
        <span className="flex-1 text-left truncate">{group}</span>

        {/* Badge con conteo de hijos */}
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
          {children.length}
        </span>

        <ChevronDown
          size={13}
          style={{
            color: 'rgba(255,255,255,0.45)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms',
            marginLeft: 4,
          }}
        />
      </button>

      {/* Hijos — animación con overflow hidden */}
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? `${children.length * 48}px` : '0px',
        transition: 'max-height 250ms ease-in-out',
      }}>
        {/* Línea vertical guía */}
        <div className="ml-5 pl-3 py-0.5 space-y-0.5"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.10)' }}>
          {children.map(child => (
            <NavLink key={child.href} {...child} indent />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sidebar principal ─────────────────────────────────────────────────────────
export default function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{ background: SB, borderRight: `1px solid ${SB_D}` }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${SB_D}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
            <Phone size={16} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: '#FFFFFF' }}>Callpicker</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.50)' }}>
              Customer Success
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {NAV.map((entry, i) =>
          isGroup(entry)
            ? <NavGroupItem key={entry.group} {...entry} />
            : <NavLink key={entry.href} {...entry} />
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: `1px solid ${SB_D}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.16)' }}>
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
