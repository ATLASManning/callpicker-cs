'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, MessageSquare, TrendingUp,
  Settings, ChevronRight, Phone, Activity, BookOpenCheck,
  CalendarDays, ClipboardList, TrendingDown, Ticket, Receipt,
  Clock, ChevronDown, Zap, Library, LogOut, ShieldCheck, UserCheck, Eye,
  Archive,
} from 'lucide-react'
import type { SessionPayload } from '@/lib/auth'

// ── Navy oscuro profundo ──────────────────────────────────────────────────────
const SB   = '#0D1829'
const SB_D = 'rgba(255,255,255,0.07)'
const SB_H = 'rgba(255,255,255,0.12)'
const SB_A = 'rgba(255,255,255,0.18)'
const TX   = '#FFFFFF'
const TX_M = '#FFFFFF'
const IC_A = '#FFFFFF'
const IC   = '#FFFFFF'

// ── Definición de nav ─────────────────────────────────────────────────────────
type NavItem   = { href: string; label: string; icon: React.ElementType }
type NavGroup  = { group: string; icon: React.ElementType; children: NavItem[] }
type NavEntry  = NavItem | NavGroup

function isGroup(e: NavEntry): e is NavGroup { return 'group' in e }

const NAV: NavEntry[] = [
  // ── Grupo: Asesores ──────────────────────────────────────────────────────
  {
    group: 'Asesores',
    icon: Activity,
    children: [
      { href: '/asesores',    label: 'Panel Asesores',   icon: Activity },
      { href: '/seguimiento', label: 'Seguimiento',      icon: BookOpenCheck },
    ],
  },

  { href: '/activaciones',    label: 'Activaciones 2.0',     icon: Zap },
  { href: '/base-cs',         label: 'Base de Conocimiento', icon: Library },
  { href: '/chat',            label: 'Atlas IA',          icon: MessageSquare },
  { href: '/auditoria',       label: 'Auditoría Cuentas', icon: ClipboardList },
  { href: '/churn',           label: 'Churn',             icon: TrendingDown },
  { href: '/facturacion',     label: 'Facturación',       icon: Receipt },
  {
    group: 'Cuentas',
    icon: Users,
    children: [
      { href: '/cuentas',          label: 'Activas',  icon: Users    },
      { href: '/cuentas/dormidas', label: 'Dormidas', icon: Archive  },
    ],
  },
  { href: '/customer-tenure', label: 'Customer Tenure',   icon: Clock },
  { href: '/',                label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/reuniones',       label: 'Reuniones',         icon: CalendarDays },
  { href: '/tickets',         label: 'Tickets',           icon: Ticket },
  { href: '/upsell',          label: 'Upsell / Cross',    icon: TrendingUp },
]

// ── NavLink simple ────────────────────────────────────────────────────────────
function NavLink({ href, label, icon: Icon, indent = false }: NavItem & { indent?: boolean }) {
  const path   = usePathname()
  const active = path === href || (href !== '/' && path.startsWith(href))

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg text-sm font-semibold transition-all"
      style={{
        padding:     indent ? '8px 10px 8px 32px' : '10px 12px',
        background:  active ? SB_A : 'transparent',
        color:       active ? TX : TX_M,
        borderLeft:  active && !indent ? '3px solid rgba(255,255,255,0.90)' : '3px solid transparent',
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
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
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
          style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}>
          {children.length}
        </span>

        <ChevronDown
          size={13}
          style={{
            color: 'rgba(255,255,255,0.50)',
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
          style={{ borderLeft: '1px solid rgba(255,255,255,0.18)' }}>
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
  const router   = useRouter()
  const [me, setMe] = useState<SessionPayload | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(setMe)
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/acceso')
  }

  const rolIcon = me?.rol === 'admin' ? ShieldCheck : me?.rol === 'asesor' ? UserCheck : Eye
  const RolIcon = rolIcon
  const rolColor = me?.rol === 'admin' ? '#60A5FA' : me?.rol === 'asesor' ? '#34D399' : '#FBBF24'
  const rolLabel = me?.rol === 'admin' ? 'Admin' : me?.rol === 'asesor' ? 'Asesor' : 'Viewer'

  // Filtrar nav según rol
  const navFiltered = NAV.filter(entry => {
    // Admin ve todo
    if (!me || me.rol === 'admin') return true
    // Asesores y viewers NO ven ciertas secciones
    if (isGroup(entry)) return true // los grupos los mostramos siempre
    const item = entry as NavItem
    // Viewers no ven seguimiento ni auditoria
    if (me.rol === 'viewer' && ['/seguimiento', '/auditoria'].includes(item.href)) return false
    return true
  })

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{ background: SB, borderRight: `1px solid ${SB_D}` }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${SB_D}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)', boxShadow: '0 2px 8px rgba(0,0,0,0.20)' }}>
            <Phone size={16} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: '#FFFFFF' }}>Callpicker</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              Customer Success
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {navFiltered.map((entry) =>
          isGroup(entry)
            ? <NavGroupItem key={entry.group} {...entry} />
            : <NavLink key={(entry as NavItem).href} {...(entry as NavItem)} />
        )}
        {/* Admin: gestión de usuarios + reporte de uso */}
        {me?.rol === 'admin' && (
          <>
            <NavLink href="/admin/usuarios" label="Usuarios"       icon={Users} />
            <NavLink href="/admin/uso"      label="Uso Dashboard"  icon={Activity} />
          </>
        )}
      </nav>

      {/* Footer: usuario + logout */}
      <div className="px-3 py-3" style={{ borderTop: `1px solid ${SB_D}` }}>
        {me && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.18)' }}>
              <RolIcon size={13} style={{ color: '#fff' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{me.nombre}</p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <span style={{ color: rolColor, fontWeight: 700 }}>{rolLabel}</span>
                {me.asesor_nombre ? ` · ${me.asesor_nombre}` : ''}
              </p>
            </div>
            <button onClick={logout} title="Cerrar sesión"
              className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
              <LogOut size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 px-1">
          <Link href="/settings" className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
            <Settings size={13} />
          </Link>
        </div>
      </div>
    </aside>
  )
}
