'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, ArrowUpRight, AlertTriangle,
  DollarSign, LifeBuoy, Phone, Mail, Hash,
  Search, X, ArrowUpDown,
  Activity, Moon, TrendingDown, ArrowDownRight, Sparkles, UserX, ClipboardList,
} from 'lucide-react'
import type { ChurnAsesor } from '@/lib/churn-por-asesor'
import type { AuditoriasAsesor } from '@/lib/auditorias-por-asesor'
import type { Cuenta } from '@/lib/types'
import {
  getSemaforoCuenta, formatMXN, ASESOR_CONFIG,
  esCuentaSinServicio, esCuentaViva,
} from '@/lib/types'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'
import ActividadesBtn from '@/components/ActividadesBtn'
import { fechaLocal } from '@/lib/fecha-local'

// ── Paleta azul marino (header) ───────────────────────────────────────────────
const NAVY      = '#0A1628'
const NAVY_MID  = '#0F2040'
const NAVY_LINE = 'rgba(255,255,255,0.10)'
const TX_HI     = '#FFFFFF'
const TX_MID    = 'rgba(255,255,255,0.70)'
const TX_LOW    = 'rgba(255,255,255,0.45)'

// ── Paleta clara (tabla expandida) ────────────────────────────────────────────
const L_BG      = '#FFFFFF'
const L_BG2     = '#F8FAFC'
const L_BG3     = '#F1F5F9'
const L_LINE    = '#E2E8F0'
const L_TX      = '#0F172A'
const L_TX_MID  = '#475569'
const L_TX_LOW  = '#94A3B8'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface ZohoStats { total: number; fallas: number; ultima: string | null }
export type CuentaRich = Cuenta & { zoho_tickets: ZohoStats }

// ── Ordenamiento de la tabla ──────────────────────────────────────────────────
type ColOrden = 'consecutivo' | 'empresa' | 'facturacion' | 'health_score'
              | 'semaforo' | 'dias_sin_actividad' | 'tickets' | 'ultimo_contacto' | 'estado'

/** Columnas de texto: su primer clic ordena A→Z; las numéricas, de mayor a menor. */
const COLS_TEXTO: ColOrden[] = ['consecutivo', 'empresa', 'estado']

const COLUMNAS: { col: ColOrden | null; label: string }[] = [
  { col: 'consecutivo',        label: '#' },
  { col: 'empresa',            label: 'Empresa' },
  { col: 'facturacion',        label: 'Facturación' },
  { col: 'health_score',       label: 'Health Score' },
  { col: 'semaforo',           label: 'Semáforo' },
  { col: 'dias_sin_actividad', label: 'Días sin act.' },
  { col: 'tickets',            label: 'Tickets Zoho Desk' },
  { col: 'ultimo_contacto',    label: 'Último contacto' },
  { col: 'estado',             label: 'Estado' },
  { col: null,                 label: '' },
]

// `inactivo` va al final: una cuenta sin servicio no compite por atención con
// las vivas, pero tampoco debe colarse entre las sanas por su HS histórico.
const ORDEN_SEMAFORO: Record<string, number> = { rojo: 0, naranja: 1, amarillo: 2, azul: 3, verde: 4, inactivo: 5 }

function valorOrden(c: CuentaRich, col: ColOrden): string | number | null {
  switch (col) {
    case 'consecutivo':        return c.consecutivo ?? null
    case 'empresa':            return c.empresa ?? null
    case 'facturacion':        return c.factura_mensual_zoho ?? c.facturacion ?? null
    case 'health_score':       return c.health_score
    case 'semaforo':           return ORDEN_SEMAFORO[getSemaforoCuenta(c)] ?? 99
    case 'dias_sin_actividad': return c.dias_sin_actividad ?? null
    case 'tickets':            return c.zoho_tickets?.total ?? 0
    case 'ultimo_contacto':    return c.ultimo_contacto ?? null
    // Se ordena por la etiqueta visible, no por el estatus crudo: así el orden
    // A→Z de la columna es el que el asesor está leyendo (Activa, Dormida).
    case 'estado':             return estadoCartera(c).label
  }
}

/**
 * Estado de cartera que muestra la columna «Estado»: Activa o Dormida.
 *
 * Lo decide `esCuentaSinServicio`, EL MISMO predicado que apaga el semáforo a
 * «Sin servicio» y que cuenta el aviso de arriba («N están dormidas o
 * canceladas»). Si esta columna tuviera su propio criterio, una fila podría
 * decir «Activa» junto a un semáforo gris y el panel se contradiría solo.
 *
 * El tercer caso no sobra. `lib/types` es explícito en que un estatus vacío o
 * desconocido NO está vivo pero tampoco se puede dar por muerto, así que no se
 * elige ninguna de las dos etiquetas: se marca el hueco. Hoy no hay ninguna
 * cuenta así de las 222; si aparece una mal capturada, se ve como lo que es en
 * vez de colarse como «Activa».
 */
function estadoCartera(c: { estado?: string | null }): {
  label: string; color: string; bg: string; borde: string
} {
  if (esCuentaSinServicio(c.estado)) {
    return { label: 'Dormida', color: '#475569', bg: '#F1F5F9', borde: '#CBD5E1' }
  }
  if (esCuentaViva(c.estado)) {
    return { label: 'Activa', color: '#047857', bg: '#ECFDF5', borde: '#A7F3D0' }
  }
  return { label: 'Sin estatus', color: '#92400E', bg: '#FFF7ED', borde: '#FED7AA' }
}

interface SemaforoResumen {
  verde: number; azul: number; amarillo: number; naranja: number; rojo: number
  facturacion_total: number
}

interface Props {
  asesor:      string
  cuentas:     CuentaRich[]
  resumen:     SemaforoResumen
  /**
   * Cuentas del asesor que NO entran en la cartera viva (canceladas o
   * dormidas). No se listan aquí — se trabajan desde Cuentas > Dormidas — pero
   * se declara el número para que la exclusión sea visible y no un hueco mudo.
   */
  fueraDeCartera?: number
  /** Churn y Downgrade del año atribuidos a este asesor. Lo calcula la página
   *  con `churnPorAsesor`, que es la fuente única — no se recalcula aquí. */
  churn?: ChurnAsesor
  /** Qué período cubre ese churn, para que el número no flote sin fecha. */
  periodoChurn?: string
  /** Auditorías del asesor y su estatus. Lo calcula la página en el servidor:
   *  los 33 casos pesan ~1 MB y aquí solo llega el resumen. */
  auditorias?: AuditoriasAsesor
  defaultOpen?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SEMAFORO_META = [
  { key: 'verde',    label: 'Saludable',   color: '#22C55E' },
  { key: 'azul',     label: 'Estable',     color: '#3B82F6' },
  { key: 'amarillo', label: 'Observación', color: '#EAB308' },
  { key: 'naranja',  label: 'En Riesgo',   color: '#F97316' },
  { key: 'rojo',     label: 'Riesgo Alto', color: '#EF4444' },
] as const

function fmtFecha(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function TicketCellLight({ zt }: { zt: ZohoStats }) {
  if (zt.total === 0) return <span style={{ fontSize: 12, color: L_TX_LOW }}>—</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: zt.total > 10 ? '#F97316' : L_TX, fontVariantNumeric: 'tabular-nums' }}>
          {zt.total}
        </span>
        {zt.fallas > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 99, background: '#FEF2F2', color: '#EF4444', fontSize: 10, fontWeight: 600, border: '1px solid #FECACA' }}>
            <AlertTriangle size={8} /> {zt.fallas}
          </span>
        )}
      </div>
      {zt.ultima && (
        <span style={{ fontSize: 10, color: L_TX_LOW }}>Últ: {fmtFecha(zt.ultima)}</span>
      )}
    </div>
  )
}

// ── KpiCard — tarjeta KPI para la zona oscura ─────────────────────────────────
function KpiCard({
  icon, label, value, accent, sub,
}: {
  icon: React.ReactNode; label: string; value: string; accent: string; sub?: string
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl flex-1 min-w-[110px]"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="flex items-center gap-1.5">
        <span style={{ color: accent }} className="opacity-80">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: TX_LOW }}>{label}</span>
      </div>
      <p className="text-xl font-black tabular-nums leading-none" style={{ color: TX_HI }}>{value}</p>
      {sub && <p className="text-[10px] leading-tight" style={{ color: TX_LOW }}>{sub}</p>}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
const SIN_CHURN: ChurnAsesor = {
  churns: 0, mrrChurn: 0, downgrades: 0, mrrDowngrade: 0, mrrTotal: 0,
}
const SIN_AUDITORIAS: AuditoriasAsesor = { total: 0, porEstado: [], abiertas: 0 }

/* Un solo estilo para los cinco botones del encabezado. Antes cada uno
   repetía la clase completa y dos ya habían quedado con tamaños distintos. */
const BTN_ACCION = 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg '
  + 'text-[11px] font-bold text-white shadow-sm transition-all duration-150 '
  + 'whitespace-nowrap hover:brightness-110'

export default function AsesorCard({
  asesor, cuentas, resumen, fueraDeCartera = 0,
  churn = SIN_CHURN, periodoChurn = '—', auditorias = SIN_AUDITORIAS,
  defaultOpen = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden]       = useState<{ col: ColOrden; dir: 'asc' | 'desc' }>({ col: 'health_score', dir: 'asc' })

  // Búsqueda por nombre, consecutivo o CID · ordenamiento por cualquier columna
  const cuentasVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const filtradas = q
      ? cuentas.filter(c =>
          norm(c.empresa ?? '').includes(norm(q)) ||
          (c.consecutivo ?? '').toLowerCase().includes(q) ||
          (c.cid ?? '').toLowerCase().includes(q) ||
          norm(c.giro ?? '').includes(norm(q)))
      : [...cuentas]

    const d = orden.dir === 'asc' ? 1 : -1
    return filtradas.sort((a, b) => {
      const va = valorOrden(a, orden.col)
      const vb = valorOrden(b, orden.col)
      if (va == null && vb == null) return 0
      if (va == null) return 1          // los vacíos siempre al final
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return d * (va - vb)
      return d * String(va).localeCompare(String(vb), 'es')
    })
  }, [cuentas, busqueda, orden])

  const toggleOrden = (col: ColOrden) => setOrden(prev =>
    prev.col === col
      ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: COLS_TEXTO.includes(col) ? 'asc' : 'desc' })

  const ac = ASESOR_CONFIG[asesor as keyof typeof ASESOR_CONFIG] ?? {
    color: '#94A3B8', initial: '?', fullName: asesor, ext: '—', email: '—',
  }

  const totalTix    = cuentas.reduce((s, c) => s + c.zoho_tickets.total,  0)
  const totalFallas = cuentas.reduce((s, c) => s + c.zoho_tickets.fallas, 0)

  /* ── Los KPIs de la carátula ────────────────────────────────────────────
     Se retiraron tres que estaban muertos y hacían ruido: «En Riesgo» marcaba
     0 para los tres asesores porque ninguna cuenta baja de HS 40;
     «Oportunidades» tenía 1 en toda la empresa; y «Saludables/Observación»
     repetía lo que el mini-semáforo de abajo ya desglosa. Un indicador que
     siempre dice lo mismo no informa: ocupa lugar y entrena a no mirarlo.

     Lo que entra en su lugar tiene fuente comprobada y se mueve: estado real
     de la cartera, lo que se le fue por churn y downgrade, y lo que sumó. */
  const activas  = cuentas.filter(c => esCuentaViva(c.estado)).length
  const dormidas = cuentas.filter(c => esCuentaSinServicio(c.estado)).length
  const pctViva  = cuentas.length ? Math.round((activas / cuentas.length) * 100) : 0

  /* Altas del último año. Se mide con `activo_desde`, que tienen 218 de las
     222 cuentas. NO se usa la columna «Ejecutivo» del archivo de activaciones:
     ésa trae al ejecutivo que EJECUTA la activación (Cecilia, Pepe Toño…), no
     al Ejecutivo CS dueño de la cuenta. Son dos roles distintos. */
  const haceUnAnio = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    return fechaLocal(d)
  }, [])
  const nuevas = cuentas.filter(c => (c.activo_desde ?? '') >= haceUnAnio).length

  /* Perfiles sin un contacto localizable: es justo lo que bloquea las
     Actividades SAC, así que es trabajo pendiente, no una curiosidad. */
  const sinContacto = cuentas.filter(c =>
    !(c.contacto_nombre && c.contacto_email && c.contacto_tel)).length

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg"
      style={{ border: `1px solid ${NAVY_LINE}`, borderLeft: `4px solid ${ac.color}` }}>

      {/* ════════════════════════════════════════════════════════════════════════
          HEADER — fondo azul marino
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_MID} 100%)` }}>

        {/* ── Fila superior: identidad + acciones ────────────────────────── */}
        <div className="px-6 pt-5 pb-4 flex items-start gap-6 flex-wrap">

          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center
            text-3xl font-black flex-shrink-0 select-none"
            style={{
              background: `${ac.color}25`,
              border: `2px solid ${ac.color}50`,
              color: ac.color,
              boxShadow: `0 4px 16px ${ac.color}30`,
            }}>
            {ac.initial}
          </div>

          {/* Identidad + datos de contacto */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-black leading-tight" style={{ color: TX_HI }}>
                {ac.fullName}
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
                style={{ background: `${ac.color}25`, color: ac.color, border: `1px solid ${ac.color}40` }}>
                Ejecutivo CS
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', color: TX_MID }}>
                {cuentas.length} cuentas
              </span>

              {/* ── Acciones, en línea ──────────────────────────────────────
                  Antes vivían en una columna fija de 280px a la derecha, que
                  dejaba muerto todo el ancho intermedio y empujaba la tarjeta
                  a lo alto. Aquí siguen al contador de cuentas y bajan solas
                  cuando no caben. Un separador las distingue de las etiquetas,
                  que informan y no se tocan. */}
              <span aria-hidden className="self-stretch w-px mx-1"
                style={{ background: 'rgba(255,255,255,0.14)' }} />

              <a href="https://ayuda.callpicker.com/" target="_blank" rel="noopener noreferrer"
                className={BTN_ACCION} style={{ background: '#0F766E' }}>
                <LifeBuoy size={12} /> Centro de Ayuda
              </a>
              <a href="https://callpicker.slack.com" target="_blank" rel="noopener noreferrer"
                className={BTN_ACCION} style={{ background: '#4A154B' }}>
                <SlackIcon size={12} /> Slack Callpicker
              </a>
              <a href="https://my.callpicker.com/" target="_blank" rel="noopener noreferrer"
                className={BTN_ACCION} style={{ background: '#0E30CC' }}>
                <Phone size={12} /> Callpicker
              </a>
              <button onClick={() => setExpanded(v => !v)}
                className={BTN_ACCION} style={{ background: ac.color }}>
                {expanded
                  ? <><ChevronUp size={12} /> Compactar</>
                  : <><ChevronDown size={12} /> Ver cuentas</>}
              </button>
              <ActividadesBtn asesor={asesor} acColor={ac.color} inline />
            </div>

            {/* Datos de contacto */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: TX_MID }}>
                <Hash size={12} style={{ color: ac.color, opacity: 0.8 }} />
                Ext. {ac.ext}
              </span>
              <a href={`mailto:${ac.email}`}
                className="flex items-center gap-1.5 text-xs hover:opacity-90 transition-opacity"
                style={{ color: TX_MID }}>
                <Mail size={12} style={{ color: ac.color, opacity: 0.8 }} />
                {ac.email}
              </a>
              {ac.tel && (
                <a href={`tel:${ac.tel.replace(/\s/g,'')}`}
                  className="flex items-center gap-1.5 text-xs hover:opacity-90 transition-opacity"
                  style={{ color: TX_MID }}>
                  <Phone size={12} style={{ color: ac.color, opacity: 0.8 }} />
                  {ac.tel}
                </a>
              )}
            </div>
          </div>

        </div>

        {/* ── Fila KPIs ─────────────────────────────────────────────────── */}
        <div className="px-6 pb-5 flex gap-3 flex-wrap">
          <KpiCard icon={<DollarSign size={14} />} label="Facturación viva"
            value={formatMXN(resumen.facturacion_total)} accent="#3B82F6"
            sub={`${activas} cuenta${activas !== 1 ? 's' : ''} facturando`} />
          <KpiCard icon={<Activity size={14} />} label="Activas"
            value={String(activas)} accent="#22C55E"
            sub={`${pctViva}% de su cartera`} />
          <KpiCard icon={<Moon size={14} />} label="Dormidas"
            value={String(dormidas)} accent="#8B5CF6"
            sub={dormidas > 0 ? 'siguen siendo suyas' : 'ninguna de baja'} />
          <KpiCard icon={<TrendingDown size={14} />} label="Churn"
            value={String(churn.churns)} accent="#EF4444"
            sub={churn.churns > 0 ? `${formatMXN(churn.mrrChurn)} · ${periodoChurn}` : periodoChurn} />
          <KpiCard icon={<ArrowDownRight size={14} />} label="Downgrades"
            value={String(churn.downgrades)} accent="#F59E0B"
            sub={churn.downgrades > 0 ? `${formatMXN(churn.mrrDowngrade)} · ${periodoChurn}` : periodoChurn} />
          <KpiCard icon={<Sparkles size={14} />} label="Nuevas"
            value={String(nuevas)} accent="#14B8A6" sub="altas en 12 meses" />
          {totalTix > 0 && (
            <KpiCard
              icon={<AlertTriangle size={14} />}
              label={totalFallas > 0 ? `Tickets · ${totalFallas} fallas` : 'Tickets Zoho'}
              value={String(totalTix)}
              accent={totalFallas > 0 ? '#EF4444' : '#F97316'}
            />
          )}
          {sinContacto > 0 && (
            <KpiCard icon={<UserX size={14} />} label="Sin contacto"
              value={String(sinContacto)} accent="#F97316"
              sub="bloquean actividades SAC" />
          )}
          {auditorias.total > 0 && (
            <KpiCard icon={<ClipboardList size={14} />} label="Auditorías"
              value={String(auditorias.total)} accent="#6366F1"
              sub={auditorias.abiertas > 0
                ? `${auditorias.abiertas} sin cerrar`
                : 'todas cerradas'} />
          )}
        </div>

        {/* ── Auditorías por estatus ─────────────────────────────────────
             El número solo no dice nada: diez auditorías «activo» y diez
             «perdido» son dos realidades opuestas. El desglose va con el
             color del estatus, que es el mismo que usa el módulo Auditoría.
             El `background` en línea es obligatorio: dentro de una tarjeta
             oscura el CSS global fuerza a blanco el texto de los `<span>` y
             solo respeta los que declaran fondo propio. */}
        {auditorias.total > 0 && (
          <div className="px-6 pb-5 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: TX_LOW }}>Auditorías</span>
            {auditorias.porEstado.map(e => (
              <span key={e.estado}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${e.color}22`, color: e.color, border: `1px solid ${e.color}44` }}>
                {e.n} {e.label}
              </span>
            ))}
          </div>
        )}

        {/* ── Mini semáforo ─────────────────────────────────────────────── */}
        <div className="px-6 pb-5 flex gap-2 flex-wrap">
          {SEMAFORO_META.map(s => {
            const cnt = resumen[s.key]
            if (cnt === 0) return null
            return (
              <div key={s.key}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                style={{
                  background: `${s.color}18`,
                  border: `1px solid ${s.color}35`,
                  color: s.color,
                }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="font-bold tabular-nums">{cnt}</span>
                <span className="text-[10px]" style={{ opacity: 0.8 }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>
      {/* ── FIN HEADER ───────────────────────────────────────────────────────── */}

      {/* ════════════════════════════════════════════════════════════════════════
          TABLA colapsable — paleta clara
          ════════════════════════════════════════════════════════════════════════ */}
      {/* La altura se anima con grid-template-rows en vez de max-h: un tope fijo
          recortaba la lista (79 cuentas necesitan ~6,500px y el tope era 3,000). */}
      <div className="transition-all duration-300 ease-in-out"
        style={{
          display: 'grid',
          gridTemplateRows: expanded ? '1fr' : '0fr',
          opacity: expanded ? 1 : 0,
        }}>
       <div style={{ overflow: 'hidden', minHeight: 0 }}>

        <div style={{ borderTop: `1px solid ${L_LINE}`, background: L_BG }}>
          {/* Sub-header — buscador + conteo */}
          <div style={{ padding: '10px 24px', background: L_BG3, borderBottom: `1px solid ${L_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: L_TX_LOW, fontWeight: 500 }}>
              {busqueda
                ? <>{cuentasVisibles.length} de {cuentas.length} cuentas</>
                : <>{cuentas.length} cuentas</>}
              {' · '}clic en un encabezado para ordenar
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', minWidth: 250 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: L_TX_LOW, pointerEvents: 'none' }} />
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por empresa, CID o consecutivo…"
                  style={{
                    width: '100%', fontSize: 12, padding: '7px 28px 7px 30px',
                    borderRadius: 8, border: `1px solid ${L_LINE}`,
                    background: L_BG, color: L_TX, outline: 'none',
                  }}
                />
                {busqueda && (
                  <button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda"
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: L_TX_LOW, padding: 2, lineHeight: 0 }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <Link href="/cuentas"
                className="text-[11px] text-cp hover:text-cpTeal font-medium transition-colors flex items-center gap-1 whitespace-nowrap">
                Ver en Cuentas <ArrowUpRight size={11} />
              </Link>
            </div>
          </div>

          {fueraDeCartera > 0 && (
            <p style={{
              margin: '0 0 10px', padding: '7px 11px', borderRadius: 8,
              background: '#F1F5F9', border: `1px solid ${L_LINE}`,
              fontSize: 11, color: L_TX_MID, lineHeight: 1.5,
            }}>
              De estas cuentas, <strong style={{ color: L_TX }}>{fueraDeCartera}</strong>{' '}
              {fueraDeCartera === 1 ? 'está dormida o cancelada' : 'están dormidas o canceladas'}
              {' '}— {fueraDeCartera === 1 ? 'aparece' : 'aparecen'} en la lista con semáforo gris
              {' '}<strong style={{ color: L_TX }}>Sin servicio</strong>. Siguen siendo tuyas para
              recuperación, pero no reciben actividades SAC ni suman a la facturación.
            </p>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <colgroup>
                <col style={{ width: '72px' }} />
                <col style={{ minWidth: '180px' }} />
                <col style={{ width: '115px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '95px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '52px' }} />
              </colgroup>
              <thead>
                <tr style={{ background: L_BG2 }}>
                  {COLUMNAS.map(({ col, label }, i) => {
                    const activa = col !== null && orden.col === col
                    if (col === null) {
                      return <th key={i} style={{ padding: '10px 14px', borderBottom: `1px solid ${L_LINE}` }} />
                    }
                    return (
                      <th key={i} style={{ padding: 0, borderBottom: `1px solid ${L_LINE}` }}>
                        <button
                          onClick={() => toggleOrden(col)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 4,
                            padding: '10px 14px', background: activa ? '#EFF6FF' : 'transparent',
                            border: 0, cursor: 'pointer', textAlign: 'left',
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.07em', whiteSpace: 'nowrap',
                            color: activa ? '#1B3FCC' : L_TX_LOW,
                          }}>
                          {label}
                          {activa
                            ? (orden.dir === 'asc'
                                ? <ChevronUp size={11} style={{ color: '#1B3FCC' }} />
                                : <ChevronDown size={11} style={{ color: '#1B3FCC' }} />)
                            : <ArrowUpDown size={9} style={{ color: '#CBD5E1' }} />}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {cuentasVisibles.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '36px 14px', textAlign: 'center', fontSize: 12, color: L_TX_LOW }}>
                      Sin resultados para &quot;{busqueda}&quot;
                    </td>
                  </tr>
                )}
                {cuentasVisibles.map((c, ri) => {
                  const semaforo = getSemaforoCuenta(c)
                  const estadoDeFila = estadoCartera(c)
                  // 'inactivo' explícito: sin este caso caía en el `else` y
                  // pintaba de ROJO ("riesgo alto") una cuenta ya dada de baja.
                  const hsColor = semaforo === 'inactivo' ? '#64748B'
                    : ['verde', 'azul'].includes(semaforo) ? '#22C55E'
                    : semaforo === 'amarillo' ? '#EAB308' : '#EF4444'
                  const rowBg = ri % 2 === 0 ? L_BG : L_BG2
                  const cell: React.CSSProperties = { padding: '11px 14px', borderBottom: `1px solid ${L_LINE}`, verticalAlign: 'middle' }
                  return (
                    <tr key={c.id} style={{ background: rowBg }} onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')} onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                      <td style={cell}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#1B3FCC' }}>{c.consecutivo}</span>
                      </td>
                      <td style={cell}>
                        <Link href={`/cuentas/${c.id}`}
                          style={{ fontSize: 13, fontWeight: 600, color: L_TX, textDecoration: 'none', display: 'block', lineHeight: 1.3 }}
                          className="hover:text-cp transition-colors">
                          {c.empresa}
                        </Link>
                        {c.giro && <span style={{ fontSize: 11, color: L_TX_LOW }}>{c.giro}</span>}
                      </td>
                      <td style={cell}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: L_TX, fontVariantNumeric: 'tabular-nums' }}>
                          {formatMXN(c.factura_mensual_zoho ?? c.facturacion)}
                        </span>
                      </td>
                      <td style={cell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <HealthScoreRing score={c.health_score} size={32} strokeWidth={4} showLabel={false} estado={c.estado} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: hsColor, fontVariantNumeric: 'tabular-nums' }}>
                            {c.health_score}
                          </span>
                        </div>
                      </td>
                      <td style={cell}><SemaforoBadge semaforo={semaforo} size="sm" /></td>
                      <td style={cell}>
                        <span style={{ fontSize: 12, fontWeight: c.dias_sin_actividad > 30 ? 700 : 500, color: c.dias_sin_actividad > 30 ? '#EF4444' : c.dias_sin_actividad > 14 ? '#F97316' : L_TX_MID }}>
                          {c.dias_sin_actividad}d
                        </span>
                      </td>
                      <td style={cell}><TicketCellLight zt={c.zoho_tickets} /></td>
                      <td style={cell}>
                        <span style={{ fontSize: 12, color: L_TX_LOW, whiteSpace: 'nowrap' }}>
                          {fmtFecha(c.ultimo_contacto)}
                        </span>
                      </td>
                      <td style={cell}>
                        <Link href={`/cuentas/${c.id}`}
                          title={`Abrir la ficha de ${c.empresa} — ${estadoDeFila.label}`}
                          style={{ textDecoration: 'none', display: 'inline-block' }}
                          className="hover:opacity-75 transition-opacity">
                          {/* El `background` en línea NO es decoración: dentro de una
                              `.cp-card` el CSS global fuerza a blanco el texto de los
                              `<span>` y solo respeta los que declaran fondo propio.
                              Sin él, la etiqueta se vería en blanco sobre blanco.
                              Ver la arquitectura de contraste del proyecto. */}
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                            background: estadoDeFila.bg, color: estadoDeFila.color,
                            border: `1px solid ${estadoDeFila.borde}`,
                            whiteSpace: 'nowrap', display: 'inline-block',
                          }}>
                            {estadoDeFila.label}
                          </span>
                        </Link>
                      </td>
                      <td style={cell}>
                        <Link href={`/cuentas/${c.id}`}
                          className="inline-flex items-center gap-0.5 text-xs text-cp hover:text-cpTeal font-medium transition-colors">
                          Ver <ArrowUpRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer tabla */}
          <div style={{ padding: '8px 24px', background: L_BG3, borderTop: `1px solid ${L_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: L_TX_LOW }}>{cuentas.length} cuentas · {formatMXN(resumen.facturacion_total)} total cartera</span>
            {totalTix > 0 && (
              <span style={{ fontSize: 11, color: L_TX_LOW, display: 'flex', alignItems: 'center', gap: 6 }}>
                {totalTix} tickets
                {totalFallas > 0 && <span style={{ color: '#EF4444', fontWeight: 600 }}>· {totalFallas} fallas</span>}
              </span>
            )}
          </div>
        </div>
       </div>
      </div>

    </div>
  )
}

// ── SlackIcon SVG oficial ─────────────────────────────────────────────────────
function SlackIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 122.8 122.8" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"/>
      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"/>
      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"/>
      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"/>
    </svg>
  )
}
