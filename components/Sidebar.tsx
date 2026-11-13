'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, MessageSquare, TrendingUp,
  Settings, ChevronRight, Activity, BookOpenCheck,
  CalendarDays, ClipboardList, TrendingDown, Ticket, Receipt, Paperclip, FileSignature,
  Clock, ChevronDown, Zap, Library, LogOut, ShieldCheck, UserCheck, Eye,
  Archive, BarChart2, Target, MessageCircle, PhoneCall, Inbox, BellRing,
  Headphones, ArrowDownRight,
} from 'lucide-react'
import LogoCallpicker from '@/components/LogoCallpicker'
import type { SessionPayload } from '@/lib/auth'
import { esAdminDelTablero, puedeVerUsoDashboard } from '@/lib/auth'

/* ── EL DEGRADADO DEL HERO, TAMBIÉN EN EL ÍNDICE ──────────────────────────────
 *
 * Instrucción de dirección (12 nov 2026): el índice de apartados deja el marino
 * plano y lleva el color del hero, con los círculos corporativos y el texto en
 * blanco brillante.
 *
 * ESTO NO ES «CAMBIAR UN FONDO». El marino plano era `#0D1829`, casi negro; el
 * degradado termina en `#1F6A90`, mucho más claro. Toda medición hecha contra
 * el marino CADUCA, y no avisa — es lo mismo que pasó cuando `.cp-card` pasó de
 * `#0D1829` a `#082742` y un alfa que medía bien cayó a 4.41 sin que nadie
 * tocara una línea. [[atlas-dashboard-contrast-architecture]]
 *
 * Medido con `scripts/mide-paleta-sidebar.py` contra el extremo CLARO, que es
 * el que aprieta: **OCHO colores de este archivo dejaban de servir**.
 *
 *   blanco al 50%  4.62 → 2.71      rol admin   #60A5FA  5.52 → 2.34
 *   blanco al 55%  5.25 → 2.97      rol asesor  #34D399  7.30 → 3.10
 *   blanco al 60%  5.98 → 3.22      rol viewer  #FBBF24  8.40 → 3.57
 *   blanco al 75%  8.47 → 4.14      rol perfil. #A855F7  3.55 → 1.51
 *
 * El morado de Perfilamiento YA FALLABA sobre el marino (3.55 < 4.5): la
 * medición lo destapó de paso.
 *
 * QUÉ SE HIZO, Y POR QUÉ NO SE «ACLARARON» LOS CUATRO COLORES DE ROL:
 * derivarlos hacia el blanco los deja en pasteles al filo (4.50–4.55) que ya no
 * se distinguen entre sí. El color del rol se muda al CÍRCULO del avatar, que
 * es un relleno SÓLIDO —ahí el color se ve entero— y la letra de encima la
 * elige `textoSobreSolido()`. El rótulo del rol pasa a texto claro medido.
 *
 * Los blancos translúcidos que quedan son FONDOS y BORDES, no texto: un tinte
 * no se mide como letra.
 */
import { SIDEBAR, HERO_PILL, HERO_LEAD, HERO_BORDE } from '@/lib/paleta-cs'
import { textoSobreSolido } from '@/lib/contraste'

const SB   = SIDEBAR
const SB_D = 'rgba(255,255,255,0.10)'   // borde; no es texto
const SB_H = 'rgba(255,255,255,0.14)'   // hover; no es texto
const SB_A = 'rgba(255,255,255,0.22)'   // activo; no es texto
const TX   = '#FFFFFF'                  // 14.03 / 5.96 — el blanco brillante
const TX_M = '#FFFFFF'
const IC_A = '#FFFFFF'
const IC   = '#FFFFFF'
/* Secundarios: ya NO son blancos translúcidos. Son los tonos del hero, que
   están medidos contra ESTE degradado. */
const TX_SEC   = HERO_PILL   // 12.22 / 5.19
const TX_SEC_2 = HERO_LEAD   // 11.09 / 4.71

/* EL AVATAR DEL ROL. El color del rol es ahora un relleno SÓLIDO, y la letra de
   encima la calcula `textoSobreSolido()` contra ESE relleno — no se teclea. */
const ARO_BORDE  = '1px solid #FFFFFF21'
const ARO_SOMBRA = '0 0 0 70px #FFFFFF09, 0 0 0 145px #FFFFFF06'

// ── Definición de nav ─────────────────────────────────────────────────────────
import { puedeVerModulo, definicionRol } from '@/lib/permisos'

type NavItem   = { href: string; label: string; icon: React.ElementType }
type NavGroup  = { group: string; icon: React.ElementType; children: NavItem[] }
type NavEntry  = NavItem | NavGroup

function isGroup(e: NavEntry): e is NavGroup { return 'group' in e }

const NAV_ENTRADAS: NavEntry[] = [
  // ── Grupo: Asesores ──────────────────────────────────────────────────────
  // «Perfil del Rol» entra aquí por instrucción de dirección (12 oct 2026):
  // «intégralo al apartado de Asesores, que quede dentro de su apartado».
  //
  // Va de TERCERO, por la misma razón que la auditoría dentro de Cuentas:
  // «Panel Asesores» y «Seguimiento» son las dos pantallas de TRABAJO y se
  // leen como un par —cómo va cada uno y qué está haciendo—; el perfil no es
  // una tercera pantalla de trabajo, es la referencia que define en qué
  // consiste el puesto. Se consulta, no se opera.
  //
  // La RUTA no se mueve. `/perfil-rol` la cita `lib/actividades/cierre.ts` en
  // su bloque 4.7 y la registra `components/PageTracker.tsx` para el conteo de
  // Uso Dashboard; cambiarla a `/asesores/perfil-rol` rompería ese registro y
  // partiría la serie histórica de visitas en dos. Lo que pidió dirección es
  // dónde VIVE en el menú.
  {
    group: 'Asesores',
    icon: Activity,
    children: [
      { href: '/asesores',    label: 'Panel Asesores',   icon: Activity },
      { href: '/seguimiento', label: 'Seguimiento',      icon: BookOpenCheck },
      { href: '/perfil-rol',  label: 'Perfil del Rol',   icon: Target },
    ],
  },

  { href: '/activaciones',    label: 'Activaciones 2.0',     icon: Zap },
  { href: '/alertas',         label: 'Alertas de Cliente',   icon: BellRing },
  { href: '/analisis-llamadas', label: 'Análisis de Llamadas', icon: PhoneCall },
  // ── Grupo: Atlas IA ──────────────────────────────────────────────────────
  // Instrucción de dirección, 9 oct 2026: «Base de Conocimiento debe vivir
  // dentro de ATLAS IA». Tienen sentido juntas: la base es exactamente el
  // material que Atlas lee para contestar, y estaban en extremos opuestos del
  // menú por el orden alfabético.
  //
  // El hijo se llama «Chat con Atlas» y no «Chat» a secas porque en este menú
  // ya vive «Callpicker Chat», que es un producto del cliente y no esta
  // pantalla. Dos entradas llamadas «Chat» en la misma barra es una pregunta
  // que nadie debería tener que hacerse.
  {
    group: 'Atlas IA',
    icon: MessageSquare,
    children: [
      { href: '/chat',    label: 'Chat con Atlas',        icon: MessageSquare },
      { href: '/base-cs', label: 'Base de Conocimiento',  icon: Library },
    ],
  },
  { href: '/churn',           label: 'Churn',             icon: TrendingDown },
  { href: '/callpicker-chat', label: 'Callpicker Chat',   icon: MessageCircle },
  // ── Comunicación ─────────────────────────────────────────────────────────
  // Entrada propia y no hija de «Cuentas»: lo que se consulta aquí es la
  // conversación con el cliente —tickets, llamadas, correos y WhatsApp en una
  // sola línea de tiempo—, no un estado de la cartera. Se llama «Comunicación»
  // a secas, como lo pidió dirección.
  //
  // El icono es `Headphones` y no `MessageSquare` ni `MessageCircle` porque
  // esos dos ya están tomados en esta misma barra por «Atlas IA» y por
  // «Callpicker Chat». Tres globos de diálogo distintos en un menú de veinte
  // renglones no distinguen nada.
  { href: '/comunicacion',    label: 'Comunicación',      icon: Headphones },
  { href: '/buzon',           label: 'Buzón del Cliente', icon: Inbox },
  {
    group: 'Facturación',
    icon: Receipt,
    children: [
      { href: '/facturacion',        label: 'Gross Revenue Facturación', icon: Receipt },
      { href: '/facturacion/cortes', label: 'Informe de Cortes', icon: BarChart2  },
    ],
  },
  // ── Grupo: Cuentas ───────────────────────────────────────────────────────
  // Instrucción de dirección, 9 oct 2026: «el apartado auditoría de cuentas
  // debe vivir dentro del apartado Cuentas».
  //
  // Va de TERCERA y no entre las dos primeras: «Activas» y «Dormidas» son los
  // dos estados de la cartera y se leen como un par; la auditoría no es un
  // tercer estado, es el análisis que se escribe sobre cualquiera de los dos.
  // El orden de los hijos no lo toca el alfabeto a propósito — ver la nota de
  // `NAV` más abajo.
  //
  // La RUTA no se mueve. `/auditoria` está enlazada desde la portada, desde el
  // catálogo de alertas y desde los 30 expedientes de `app/auditoria/*-data.ts`;
  // cambiarla a `/cuentas/auditoria` sería tocar decenas de archivos y dejar
  // enlaces viejos rotos, a cambio de nada que se vea. Lo que pidió dirección
  // es dónde vive en el menú.
  {
    group: 'Cuentas',
    icon: Users,
    /* ALFABÉTICO, por instrucción de dirección (24 oct 2026). El orden venía
       de cuándo se fue añadiendo cada pantalla, que no le dice nada a quien
       busca una. Se ordena por la ETIQUETA que se ve, no por la ruta:
       «Auditoría» vive en `/auditoria` y por ruta caería en otro sitio.
       Con acentos y en español — `localeCompare('es')` es lo que pone la A
       con tilde donde la busca un lector, no donde la deja un `sort` ASCII. */
    children: [
      { href: '/cuentas',           label: 'Activas',   icon: Users         },
      /* «Activas con Downgrade» cae AQUÍ sola: dirección la pidió entre
         «Activas» y «Auditoría» (13 nov 2026) y ésa es exactamente su casilla
         alfabética — «Activas» < «Activas con Downgrade» < «Auditoría». No hay
         que tocar el orden, que es justo lo que protege la regla de arriba.

         El icono es `ArrowDownRight` y NO `TrendingDown`, que es el que ya
         lleva «Churn» en esta misma barra. Mismo criterio que la nota de
         «Comunicación» de arriba: dos iconos iguales en un menú de veinte
         renglones no distinguen nada — y aquí además confundirían justo lo que
         esta pantalla separa, porque un downgrade NO es un churn. */
      { href: '/cuentas/downgrade', label: 'Activas con Downgrade', icon: ArrowDownRight },
      { href: '/auditoria',         label: 'Auditoría', icon: ClipboardList },
      { href: '/cuentas/contratos', label: 'Contratos', icon: FileSignature },
      { href: '/cuentas/dormidas',  label: 'Dormidas',  icon: Archive       },
    ],
  },
  { href: '/customer-tenure', label: 'Customer Tenure',   icon: Clock },
  { href: '/',                label: 'Dashboard',         icon: LayoutDashboard },
  {
    group: 'Reuniones',
    icon: CalendarDays,
    children: [
      { href: '/reuniones',        label: 'Reuniones', icon: CalendarDays },
      { href: '/reuniones/anexos', label: 'Anexos',    icon: Paperclip    },
    ],
  },
  { href: '/tickets',         label: 'Tickets',           icon: Ticket },
  { href: '/upsell',          label: 'Upsell / Cross',    icon: TrendingUp },
]

/**
 * El menú se ordena SOLO, no a mano.
 *
 * Instrucción de dirección (17 sep 2026): los apartados en orden alfabético.
 * Se hace por código y no reacomodando el arreglo porque un orden fijado a
 * mano dura hasta la siguiente entrada: quien agregue un módulo lo va a pegar
 * al final —como pasó con Buzón del Cliente, que quedó después de Callpicker
 * Chat— y el alfabeto se rompe otra vez sin que nadie lo note.
 *
 * `localeCompare` con locale 'es' y sensibilidad 'base' es lo que hace que
 * «Análisis» caiga entre «Activaciones» y «Asesores»: compara ignorando el
 * acento en vez de mandar las palabras acentuadas al final, que es lo que
 * haría un ordenamiento por código de carácter.
 *
 * Los sub-items de cada grupo conservan su orden: dentro de Facturación, Gross
 * Revenue Facturación es la vista principal y el Informe de Cortes su detalle.
 * Ese orden dice algo que el alfabeto no.
 */
const etiquetaDe = (e: NavEntry) => (isGroup(e) ? e.group : e.label)

const NAV: NavEntry[] = [...NAV_ENTRADAS].sort((a, b) =>
  etiquetaDe(a).localeCompare(etiquetaDe(b), 'es', { sensitivity: 'base', numeric: true }),
)

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
        <ChevronRight size={13} style={{ color: TX_SEC }} />
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

        {/* Badge con conteo de hijos.
            EL FONDO DEL BADGE ERA BLANCO AL 15%, y eso ACLARA el degradado: su
            tinte compuesto sobre el extremo claro da #4080A0, donde ni el blanco
            puro alcanza 4.5 (mide 4.10). Un fondo translúcido claro sobre un
            fondo ya medio-claro deja sin margen a la letra de encima. Se
            invierte: el velo es NEGRO, oscurece el sitio y el blanco vuelve a
            medir. Es el mismo razonamiento que el borde de las pastillas del
            hero — un translúcido se mide por lo que resulta, no por su hex. */}
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.25)', color: '#FFFFFF' }}>
          {children.length}
        </span>

        <ChevronDown
          size={13}
          style={{
            color: TX_SEC_2,
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

  const RolIcon  = me?.rol === 'admin' ? ShieldCheck : me?.rol === 'asesor' ? UserCheck : Eye
  const rolColor = definicionRol(me?.rol).color
  const rolLabel = definicionRol(me?.rol).label

  /* Filtrar nav segun rol. Los grupos se podan por dentro: si a un rol le
     quedan cero hijos visibles, el grupo entero desaparece — antes se mostraba
     el encabezado aunque no llevara a ningun lado.

     ── LA REGLA DEL VIEWER SE APLICA A LOS HIJOS TAMBIÉN ─────────────────
     Estaba escrita sólo en la rama de los items PLANOS, y eso la hacía
     depender de dónde cuelga cada entrada en el menú y no de quién mira.
     Consecuencias medidas el 9 oct 2026:

       · `/seguimiento` lleva tiempo dentro del grupo «Asesores», así que la
         regla NUNCA se ejecutaba para él: el viewer ya lo veía.
       · Y al mover `/auditoria` dentro de «Cuentas» —lo que pidió dirección—
         habría pasado exactamente lo mismo, en silencio y el mismo día.

     Un permiso que se cae solo al reacomodar un menú no es un permiso. Ahora
     es un predicado y se aplica en las dos ramas.

     Que quede claro lo que esto es y lo que no: `viewer` tiene `paginas: null`
     en `lib/permisos.ts`, o sea que PUEDE abrir las dos páginas escribiendo la
     URL. Esto ordena el menú, no cierra una puerta. Ver
     [[auditoria-acceso-oct2026]]: ocultar un enlace no protege nada por sí
     solo, y el candado de verdad está en el middleware. */
  const VIEWER_NO_VE = ['/seguimiento', '/auditoria']
  const visible = (href: string) =>
    puedeVerModulo(me!.rol, href)
    && !(me!.rol === 'viewer' && VIEWER_NO_VE.includes(href))

  const navFiltered = NAV.reduce<NavEntry[]>((acc, entry) => {
    if (!me || me.rol === 'admin') { acc.push(entry); return acc }

    if (isGroup(entry)) {
      const hijos = entry.children.filter(c => visible(c.href))
      if (hijos.length) acc.push({ ...entry, children: hijos })
      return acc
    }

    const item = entry as NavItem
    if (!visible(item.href)) return acc
    acc.push(item)
    return acc
  }, [])

  return (
    // `position: relative` + z-index: la aurora del Dashboard es un elemento
    // fijo dentro de <main>, y sin esto pintaría por encima del menú — un
    // elemento posicionado gana a uno de flujo normal aunque esté en z-index 0.
    <aside className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{
        background: SB,
        borderRight: `1px solid ${SB_D}`,
        position: 'relative',
        zIndex: 20,
        /* Los aros se salen de la columna a propósito; sin esto asomarían por
           encima del contenido de <main>. */
        overflow: 'hidden',
      }}>

      {/* ── LOS AROS CORPORATIVOS ─────────────────────────────────────────
          El mismo recurso del hero (`components/HeroModulo.tsx`): un aro de
          1px y dos anillos más hechos con `box-shadow` de radio creciente, con
          alfas de 0x09 y 0x06 — tan tenues que no compiten con el texto.

          `zIndex: 0` Y el contenido en `zIndex: 1` NO SON DECORACIÓN DEL
          CÓDIGO: un elemento posicionado le gana a uno de flujo normal aunque
          los dos estén en z-index 0, así que sin esto los aros taparían el
          menú. Es la misma razón por la que esta barra lleva `zIndex: 20`
          contra la aurora del Dashboard.

          `pointerEvents: 'none'` para que no se coman un clic del menú. */}
      <div aria-hidden="true"
        style={{
          position: 'absolute', width: 300, height: 300, right: -135, top: 54,
          border: ARO_BORDE, borderRadius: '50%', boxShadow: ARO_SOMBRA,
          pointerEvents: 'none', zIndex: 0,
        }} />
      <div aria-hidden="true"
        style={{
          position: 'absolute', width: 210, height: 210, left: -115, bottom: 96,
          border: ARO_BORDE, borderRadius: '50%', boxShadow: ARO_SOMBRA,
          pointerEvents: 'none', zIndex: 0,
        }} />

      {/* ── Logotipo ──────────────────────────────────────────────────────
          El vector oficial de la marca sustituye al icono de teléfono y al
          «Callpicker» escrito a mano que había aquí.

          EN BLANCO, NO EN EL AZUL DE MARCA: el menú es azul marino (#1B3FCC)
          y el #2696F1 del logotipo original encima queda apagado —se lee,
          pero sin fuerza—. `LogoCallpicker` pinta con `currentColor`, así que
          el color se dice una sola vez, aquí.

          «Customer Success» se queda debajo: el logotipo dice de quién es la
          herramienta, el rótulo dice cuál es. */}
      <div className="px-5 py-5"
        style={{ borderBottom: `1px solid ${SB_D}`, position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#FFFFFF' }}>
          <LogoCallpicker alto={21} />
          <p className="text-[10px] font-semibold tracking-widest uppercase mt-1.5"
            style={{ color: TX_SEC }}>
            Customer Success
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto"
        style={{ position: 'relative', zIndex: 1 }}>
        {navFiltered.map((entry) =>
          isGroup(entry)
            ? <NavGroupItem key={entry.group} {...entry} />
            : <NavLink key={(entry as NavItem).href} {...(entry as NavItem)} />
        )}
        {/* Administración del tablero — solo los correos de dirección.
            Antes se mostraba con `rol === 'admin'`, que funcionaba de
            casualidad: los dos únicos admin eran justo esos correos. Con el rol
            bastaba darle `admin` a alguien desde esta misma pantalla para que
            se viera. Ahora va por correo, y el menú usa EL MISMO predicado que
            el middleware — ocultar el enlace no protege nada por sí solo, pero
            si el menú y el guardia no coinciden aparece un enlace que lleva a
            una pantalla que rebota. */}
        {/* DOS COMPUERTAS, no una (24 sep 2026). «Uso Dashboard» se abrió a
            Daniel y «Usuarios» no, así que cada enlace pregunta por su propio
            predicado —el MISMO que usa el middleware, o aparecería un enlace
            que lleva a una pantalla que rebota. */}
        {esAdminDelTablero(me?.email) && (
          <NavLink href="/admin/usuarios" label="Usuarios" icon={Users} />
        )}
        {puedeVerUsoDashboard(me?.email) && (
          <NavLink href="/admin/uso" label="Uso Dashboard" icon={Activity} />
        )}
      </nav>

      {/* Footer: usuario + logout */}
      <div className="px-3 py-3"
        style={{ borderTop: `1px solid ${SB_D}`, position: 'relative', zIndex: 1 }}>
        {me && (
          <div className="flex items-center gap-2 mb-2 px-1">
            {/* EL COLOR DEL ROL VIVE AQUÍ, EN EL RELLENO.
                Los cuatro colores de rol son tonos pensados para fondo oscuro y
                sobre el extremo claro del degradado se caen todos (2.34, 3.10,
                3.57 y 1.51). Aclararlos los convierte en pasteles al filo que ya
                no se distinguen entre sí, así que el color se muda al círculo
                —donde es RELLENO y se ve entero— y el icono de encima lo elige
                `textoSobreSolido()` contra ese relleno. El rótulo del rol pasa a
                texto claro medido. */}
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: rolColor, border: `1px solid ${HERO_BORDE}` }}>
              <RolIcon size={13} style={{ color: textoSobreSolido(rolColor) }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: TX }}>{me.nombre}</p>
              <p className="text-[10px] truncate" style={{ color: TX_SEC_2 }}>
                <span style={{ color: TX, fontWeight: 700 }}>{rolLabel}</span>
                {me.asesor_nombre ? ` · ${me.asesor_nombre}` : ''}
              </p>
            </div>
            <button onClick={logout} title="Cerrar sesión"
              className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
              style={{ color: TX_SEC }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = TX_SEC)}>
              <LogOut size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 px-1">
          <Link href="/settings" className="p-1.5 rounded-lg transition-colors"
            style={{ color: TX_SEC }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = TX_SEC)}>
            <Settings size={13} />
          </Link>
        </div>
      </div>
    </aside>
  )
}
