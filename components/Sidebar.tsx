'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, MessageSquare, TrendingUp,
  Settings, ChevronRight, Phone, Activity, BookOpenCheck,
  CalendarDays, ClipboardList, TrendingDown, Ticket, Receipt,
  Clock, ChevronDown,
} from 'lucide-react'

// ── Textura acero azul claro ───────────────────────────────────────────────────
const SB_TEXTURE = `
  repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 2px,
    rgba(255,255,255,0.55) 2px,
    rgba(255,255,255,0.55) 3px
  ),
  linear-gradient(
    135deg,
    rgba(255,255,255,0.0)  0%,
    rgba(255,255,255,0.30) 38%,
    rgba(255,255,255,0.08) 55%,
    rgba(180,210,240,0.12) 100%
  ),
  linear-gradient(
    180deg,
    #C2D9F4 0%,
    #AECAE8 40%,
    #9BB8DC 75%,
    #8AAAD0 100%
  )
`.replace(/\s+/g, ' ').trim()

const SB   = SB_TEXTURE
const SB_D = 'rgba(80,130,190,0.30)'
const SB_H = 'rgba(255,255,255,0.40)'
const SB_A = 'rgba(255,255,255,0.55)'
const TX   = '#0A1628'
const TX_M = 'rgba(10,22,60,0.62)'
const IC_A = '#0A1628'
const IC   = 'rgba(10,22,60,0.50)'

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
        borderLeft:  active && !indent ? '3px solid #0A1628' : '3px solid transparent',
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
          style={{ background: 'rgba(10,22,60,0.12)', color: 'rgba(10,22,60,0.70)' }}>
          {children.length}
        </span>

        <ChevronDown
          size={13}
          style={{
            color: 'rgba(10,22,60,0.45)',
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
          style={{ borderLeft: '1px solid rgba(10,22,60,0.18)' }}>
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
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${SB_D}`, background: 'rgba(255,255,255,0.18)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(10,22,80,0.18)', border: '1px solid rgba(10,40,120,0.22)', boxShadow: '0 2px 8px rgba(10,22,80,0.18)' }}>
            <Phone size={16} style={{ color: '#0A1628' }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: '#0A1628' }}>Callpicker</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(10,22,60,0.55)' }}>
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
      <div className="px-4 py-4" style={{ borderTop: `1px solid ${SB_D}`, background: 'rgba(255,255,255,0.18)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(10,22,80,0.18)', border: '1px solid rgba(10,40,120,0.20)' }}>
            <span className="text-xs font-bold" style={{ color: '#0A1628' }}>CS</span>
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
