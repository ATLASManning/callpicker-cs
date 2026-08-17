'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Filter, RefreshCw, Plus, ArrowUpDown, AlertCircle,
  Ticket, AlertTriangle, ArrowUpRight, Archive,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'
import AsesorBadge from '@/components/AsesorBadge'
import CustomSelect, { type SelectOption } from '@/components/CustomSelect'
import type { Cuenta, Asesor, Semaforo } from '@/lib/types'
import { getSemaforo, formatMXN } from '@/lib/types'

const ASESORES: Asesor[] = ['Fátima', 'Dan', 'Claudia']
const SEMAFOROS: Semaforo[] = ['rojo', 'naranja', 'amarillo', 'azul', 'verde']

const TOP_RANGES: Record<string, number> = { F: 46, D: 38, C: 43 }
function isTopCustomer(consecutivo: string | null): boolean {
  if (!consecutivo) return false
  const prefix = consecutivo[0]
  const num = parseInt(consecutivo.slice(1), 10)
  return !!TOP_RANGES[prefix] && num >= 1 && num <= TOP_RANGES[prefix]
}

type DataWarning = 'FALTA_TC' | 'FALTA_HS' | null

function getDataWarning(c: Cuenta): DataWarning {
  if (!c.notas) return null
  if (c.notas.includes('[FALTA_TC]')) return 'FALTA_TC'
  if (c.notas.includes('[FALTA_HS]')) return 'FALTA_HS'
  return null
}

// ── Estado clasificación (0–4) ────────────────────────────────────────────────
const ESTADO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  '0': { label: '0 - Factura Futura', color: '#6366F1', bg: '#6366F110' },
  '1': { label: '1 - Activo',         color: '#22C55E', bg: '#22C55E10' },
  '2': { label: '2 - Riesgo',         color: '#F59E0B', bg: '#F59E0B10' },
  '3': { label: '3 - Alerta',         color: '#F97316', bg: '#F9731610' },
  '4': { label: '4 - Dormido',        color: '#94A3B8', bg: '#94A3B810' },
}

function getEstadoKey(c: Cuenta): string {
  if (!c.facturacion || c.facturacion === 0) return '0'
  if (c.estado === 'hibernacion' || c.estado === 'cancelado') return '4'
  const hs = c.health_score
  if (hs >= 60) return '1'
  if (hs >= 40) return '2'
  if (hs >= 20) return '3'
  return '4'
}

// ── Formatear fecha corta ────────────────────────────────────────────────────
function fmtFecha(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

// ── Badge de advertencia de datos ────────────────────────────────────────────
function DataWarningBadge({ warning }: { warning: DataWarning }) {
  if (!warning) return null
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5 ${
      warning === 'FALTA_TC'
        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
    }`}>
      <AlertCircle size={9} />
      {warning === 'FALTA_TC' ? 'Falta ficha Top Customer' : 'Falta Health Score'}
    </span>
  )
}

// ── Columna Tickets Zoho ─────────────────────────────────────────────────────
function TicketsCell({ cuenta }: { cuenta: Cuenta }) {
  const zt = cuenta.zoho_tickets
  if (!zt || zt.total === 0) {
    return <span className="text-xs text-textLow">—</span>
  }
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-bold ${zt.total > 10 ? 'text-naranja' : 'text-textHi'}`}>
          {zt.total}
        </span>
        {zt.fallas > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
            bg-rojo/10 text-rojo text-[10px] font-semibold border border-rojo/20">
            <AlertTriangle size={9} /> {zt.fallas} falla{zt.fallas > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {zt.ultima && (
        <span className="text-[10px] text-textLow">Últ: {fmtFecha(zt.ultima)}</span>
      )}
    </div>
  )
}

// ── Columna Estado ───────────────────────────────────────────────────────────
function EstadoCell({ cuenta }: { cuenta: Cuenta }) {
  const key = getEstadoKey(cuenta)
  const cfg = ESTADO_LABELS[key]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 99,
      background: cfg.bg,
      color: cfg.color,
      fontSize: 10, fontWeight: 700,
      border: `1px solid ${cfg.color}30`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

// ── Columna Health Score ─────────────────────────────────────────────────────
function HSCell({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <HealthScoreRing score={score} size={34} strokeWidth={4} showLabel={false} />
      <span className="text-sm font-bold text-textHi tabular-nums">{score}</span>
    </div>
  )
}

// ── Inline select para headers ────────────────────────────────────────────────
function HeaderSelect({
  value, onChange, placeholder, options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: SelectOption[]
}) {
  return (
    <div
      className="relative mt-1"
      onClick={e => e.stopPropagation()}
    >
      <CustomSelect
        value={value}
        onChange={onChange}
        options={[{ value: '', label: placeholder }, ...options]}
        className="w-full text-[10px] font-medium pl-2 pr-5 py-1 rounded-md
          border border-border bg-surface text-textMid outline-none
          focus:border-cp/50 transition-colors"
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
function CuentasPageInner() {
  const searchParams = useSearchParams()
  const [cuentas, setCuentas]       = useState<Cuenta[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [asesorFilter, setAsesorFilter] = useState('')
  const [semaforoFilter, setSemaforoFilter] = useState('')
  const [warningFilter, setWarningFilter] = useState<'' | 'FALTA_TC' | 'FALTA_HS'>(
    (searchParams.get('warning') as '' | 'FALTA_TC' | 'FALTA_HS') || ''
  )
  const [topFilter, setTopFilter]   = useState(searchParams.get('top') === '1')
  const [sortField, setSortField]   = useState<keyof Cuenta>('facturacion')
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('desc')

  // ── Nuevos filtros de columna ─────────────────────────────────────────────
  const [estadoFilter, setEstadoFilter]         = useState('')
  const [facturacionFilter, setFacturacionFilter] = useState('')
  const [hsFilter, setHsFilter]                 = useState('')
  const [ticketsFilter, setTicketsFilter]       = useState('')

  const fetchCuentas = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)        params.set('search',  search)
    if (asesorFilter)  params.set('asesor',  asesorFilter)
    if (semaforoFilter) params.set('semaforo', semaforoFilter)
    const res  = await fetch(`/api/cuentas?${params}`)
    const data = await res.json()
    setCuentas(data)
    setLoading(false)
  }, [search, asesorFilter, semaforoFilter])

  useEffect(() => { fetchCuentas() }, [fetchCuentas])

  const filtered = cuentas
    .filter(c => getEstadoKey(c) !== '4')          // Dormidas van a su propia sección
    .filter(c => !warningFilter    || getDataWarning(c) === warningFilter)
    .filter(c => !topFilter        || isTopCustomer(c.consecutivo))
    .filter(c => !estadoFilter     || getEstadoKey(c) === estadoFilter)
    .filter(c => {
      if (!facturacionFilter) return true
      const f = c.factura_mensual_zoho ?? c.mrr_zoho ?? c.facturacion ?? 0
      if (facturacionFilter === 'lt5')  return f < 5000
      if (facturacionFilter === '5-15') return f >= 5000 && f < 15000
      if (facturacionFilter === 'gt15') return f >= 15000
      return true
    })
    .filter(c => {
      if (!hsFilter) return true
      const hs = c.health_score
      if (hsFilter === 'gt80')  return hs > 80
      if (hsFilter === '60-80') return hs >= 60 && hs <= 80
      if (hsFilter === '40-60') return hs >= 40 && hs < 60
      if (hsFilter === 'lt40')  return hs < 40
      return true
    })
    .filter(c => {
      if (!ticketsFilter) return true
      if (ticketsFilter === 'none')   return !c.zoho_tickets || c.zoho_tickets.total === 0
      if (ticketsFilter === 'fallas') return (c.zoho_tickets?.fallas ?? 0) > 0
      if (ticketsFilter === 'any')    return (c.zoho_tickets?.total ?? 0) > 0
      return true
    })

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortField] as number | string
    const bv = b[sortField] as number | string
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  function toggleSort(field: keyof Cuenta) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  function limpiarFiltros() {
    setSearch(''); setAsesorFilter(''); setSemaforoFilter(''); setWarningFilter('')
    setTopFilter(false); setEstadoFilter(''); setFacturacionFilter('')
    setHsFilter(''); setTicketsFilter('')
  }

  const hayFiltros = !!(search || asesorFilter || semaforoFilter || warningFilter ||
    topFilter || estadoFilter || facturacionFilter || hsFilter || ticketsFilter)

  // ── Totales rápidos ───────────────────────────────────────────────────────
  const totalFac      = sorted.reduce((s, c) => s + (c.factura_mensual_zoho ?? c.mrr_zoho ?? c.facturacion ?? 0), 0)
  const totalTickets  = sorted.reduce((s, c) => s + (c.zoho_tickets?.total ?? 0), 0)
  const totalFallas   = sorted.reduce((s, c) => s + (c.zoho_tickets?.fallas ?? 0), 0)

  // ── Header de columna con filtro inline ──────────────────────────────────
  function Th({
    label, field, right, filterEl,
  }: {
    label: string
    field?: keyof Cuenta
    right?: boolean
    filterEl?: ReactNode
  }) {
    const active = field && sortField === field
    return (
      <th className="align-top p-0">
        <div className="flex flex-col">
          <div
            onClick={field ? () => toggleSort(field) : undefined}
            className={`flex items-center gap-1 px-3 py-2.5 ${field ? 'cursor-pointer select-none hover:bg-white/5' : ''} ${right ? 'justify-end' : ''}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${active ? 'text-cp' : 'text-textLow'}`}>
              {label}
            </span>
            {field && (
              <ArrowUpDown size={9} className={`flex-shrink-0 ${active ? 'text-cp opacity-100' : 'opacity-30'}`} />
            )}
          </div>
          {filterEl && (
            <div className="px-2 pb-2">
              {filterEl}
            </div>
          )}
        </div>
      </th>
    )
  }

  const totalDormidas = cuentas.filter(c => getEstadoKey(c) === '4').length

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Cuentas Estratégicas"
        subtitle={`${sorted.length} cuentas activas`}
        actions={
          <Link href="/cuentas/nueva" className="cp-btn cp-btn-primary">
            <Plus size={14} /> Nueva cuenta
          </Link>
        }
      />

      {/* Banner acceso rápido a Dormidas */}
      {!loading && totalDormidas > 0 && (
        <div className="mx-6 mb-3 flex items-center justify-between px-4 py-2.5 rounded-xl border"
          style={{ background: '#94A3B808', borderColor: '#94A3B830' }}>
          <div className="flex items-center gap-2 text-sm text-textLow">
            <Archive size={14} className="text-textLow" />
            <span>
              <span className="font-bold text-textMid">{totalDormidas}</span>
              {' '}cuentas con estado Dormido están separadas en su propia sección
            </span>
          </div>
          <Link href="/cuentas/dormidas"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{ color: '#94A3B8', borderColor: '#94A3B830' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#94A3B815' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            Ver Dormidas →
          </Link>
        </div>
      )}

      {/* Filtros superiores */}
      <div className="flex flex-wrap gap-3 px-6 pb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow" />
          <input className="cp-input pl-8 w-56" placeholder="Buscar empresa…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <CustomSelect className="cp-select" value={warningFilter}
          onChange={v => setWarningFilter(v as '' | 'FALTA_TC' | 'FALTA_HS')}
          options={[
            { value: '', label: 'Todas las fichas' },
            { value: 'FALTA_TC', label: '⚠ Falta ficha Top Customer' },
            { value: 'FALTA_HS', label: '⚠ Falta Health Score Callpicker' },
          ]} />

        <button onClick={() => setTopFilter(t => !t)}
          className={`cp-btn text-xs font-semibold border transition-colors ${
            topFilter ? 'bg-cp/20 text-cp border-cp/50' : 'cp-btn-ghost border-cp/30 text-cp hover:bg-cp/10'
          }`}>
          ⭐ Solo Top Customer
        </button>

        <button onClick={fetchCuentas} className="cp-btn cp-btn-ghost">
          <RefreshCw size={14} /> Actualizar
        </button>

        {hayFiltros && (
          <button onClick={limpiarFiltros}
            className="cp-btn cp-btn-ghost text-xs text-rojo border-rojo/30 hover:bg-rojo/10">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* KPIs rápidos de la vista filtrada */}
      {!loading && sorted.length > 0 && (
        <div className="flex items-center gap-6 px-6 pb-4">
          <div className="flex items-center gap-2 text-xs text-textLow">
            <span className="font-semibold text-textHi text-sm">{formatMXN(totalFac)}</span>
            facturación total vista
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-textLow">
            <Ticket size={12} />
            <span className="font-semibold text-textHi">{totalTickets.toLocaleString()}</span>
            tickets Zoho
            {totalFallas > 0 && (
              <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
                bg-rojo/10 text-rojo text-[10px] font-semibold border border-rojo/20">
                <AlertTriangle size={9} /> {totalFallas} fallas
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="px-6 pb-6">
        <div className="cp-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-textLow text-sm gap-2">
                <RefreshCw size={16} className="animate-spin" /> Cargando cuentas…
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-textLow text-sm gap-2">
                <Filter size={24} />
                No hay cuentas con estos filtros
              </div>
            ) : (
              <table className="cp-table">
                <colgroup>
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '220px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '150px' }} />
                  <col style={{ width: '80px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th label="#" field="consecutivo" />

                    <Th label="Empresa" field="empresa" />

                    <Th
                      label="Asesor"
                      field="asesor"
                      filterEl={
                        <HeaderSelect value={asesorFilter} onChange={setAsesorFilter} placeholder="Todos los asesores"
                          options={ASESORES.map(a => ({ value: a, label: a }))} />
                      }
                    />

                    <Th
                      label="Facturación"
                      field="facturacion"
                      filterEl={
                        <HeaderSelect value={facturacionFilter} onChange={setFacturacionFilter} placeholder="Todos los montos"
                          options={[
                            { value: 'lt5', label: 'Menos de $5,000' },
                            { value: '5-15', label: '$5,000 – $15,000' },
                            { value: 'gt15', label: 'Más de $15,000' },
                          ]} />
                      }
                    />

                    <Th
                      label="Health Score"
                      field="health_score"
                      filterEl={
                        <HeaderSelect value={hsFilter} onChange={setHsFilter} placeholder="Todos los scores"
                          options={[
                            { value: 'gt80', label: 'Alto · >80' },
                            { value: '60-80', label: 'Bueno · 60–80' },
                            { value: '40-60', label: 'Medio · 40–60' },
                            { value: 'lt40', label: 'Bajo · <40' },
                          ]} />
                      }
                    />

                    <Th
                      label="Semáforo"
                      filterEl={
                        <HeaderSelect value={semaforoFilter} onChange={setSemaforoFilter} placeholder="Todos los semáforos"
                          options={SEMAFOROS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
                      }
                    />

                    <Th
                      label="Estado"
                      filterEl={
                        <HeaderSelect value={estadoFilter} onChange={setEstadoFilter} placeholder="Todos los estados"
                          options={Object.entries(ESTADO_LABELS)
                            .filter(([key]) => key !== '4')
                            .map(([key, cfg]) => ({ value: key, label: cfg.label }))} />
                      }
                    />

                    <Th
                      label="Tickets Zoho Desk"
                      filterEl={
                        <HeaderSelect value={ticketsFilter} onChange={setTicketsFilter} placeholder="Todos"
                          options={[
                            { value: 'any', label: 'Con tickets' },
                            { value: 'fallas', label: 'Con fallas' },
                            { value: 'none', label: 'Sin tickets' },
                          ]} />
                      }
                    />

                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(c => {
                    const semaforo = getSemaforo(c.health_score)
                    const warning  = getDataWarning(c)
                    const top      = isTopCustomer(c.consecutivo)
                    return (
                      <tr key={c.id}>

                        {/* # Consecutivo */}
                        <td>
                          <div className="flex flex-col items-start">
                            <span className={`font-mono text-xs font-bold ${top ? 'text-cp' : 'text-textLow'}`}>
                              {c.consecutivo}
                            </span>
                            {top && <span className="text-[9px] text-amber-400 font-bold tracking-wide">TOP</span>}
                          </div>
                        </td>

                        {/* Empresa */}
                        <td>
                          <div>
                            <Link href={`/cuentas/${c.id}`}
                              className="text-sm font-semibold text-textHi hover:text-cp transition-colors leading-tight block">
                              {c.empresa}
                            </Link>
                            {c.giro && (
                              <p className="text-[11px] text-textLow truncate max-w-[200px] mt-0.5">{c.giro}</p>
                            )}
                            {c.grupo_empresarial && (
                              <p className="text-[10px] text-cpTeal truncate max-w-[200px]">Grupo: {c.grupo_empresarial}</p>
                            )}
                            <DataWarningBadge warning={warning} />
                          </div>
                        </td>

                        {/* Asesor */}
                        <td>
                          <AsesorBadge asesor={c.asesor} />
                        </td>

                        {/* Facturación */}
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <div>
                              <p className="text-[9px] text-textLow font-medium">Factura mensual</p>
                              <span className="text-sm font-bold text-textHi tabular-nums">
                                {c.factura_mensual_zoho != null ? formatMXN(c.factura_mensual_zoho) : '—'}
                              </span>
                            </div>
                            {c.mrr_zoho != null && (
                              <div>
                                <p className="text-[9px] text-textLow font-medium">MRR</p>
                                <span className="text-xs font-semibold text-cp tabular-nums">
                                  {formatMXN(c.mrr_zoho)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Health Score */}
                        <td>
                          <HSCell score={c.health_score} />
                        </td>

                        {/* Semáforo */}
                        <td>
                          <SemaforoBadge semaforo={semaforo} size="sm" />
                        </td>

                        {/* Estado */}
                        <td>
                          <EstadoCell cuenta={c} />
                        </td>

                        {/* Tickets Zoho Desk */}
                        <td>
                          <TicketsCell cuenta={c} />
                        </td>

                        {/* Acción */}
                        <td>
                          <Link href={`/cuentas/${c.id}`}
                            className="inline-flex items-center gap-1 text-xs text-cp hover:text-cpTeal font-medium transition-colors">
                            Ver <ArrowUpRight size={12} />
                          </Link>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer con totales */}
          {!loading && sorted.length > 0 && (
            <div className="border-t border-border px-5 py-3 flex items-center justify-between text-xs text-textLow bg-surface/50">
              <span>{sorted.length} cuentas · {formatMXN(totalFac)} facturación total</span>
              <span className="flex items-center gap-1.5">
                <Ticket size={11} />
                {totalTickets} tickets Zoho Desk
                {totalFallas > 0 && (
                  <span className="text-rojo font-semibold">· {totalFallas} fallas</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CuentasPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40 text-textLow text-sm">Cargando…</div>}>
      <CuentasPageInner />
    </Suspense>
  )
}
