'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Filter, RefreshCw, Plus, ArrowUpDown, AlertCircle,
  Ticket, AlertTriangle, ArrowUpRight,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'
import AsesorBadge from '@/components/AsesorBadge'
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

// ── Formatear fecha corta ────────────────────────────────────────────────────
function fmtFecha(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
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

// ── Columna Días sin actividad ───────────────────────────────────────────────
function DiasCell({ dias }: { dias: number }) {
  const cls = dias > 30 ? 'text-rojo font-bold' : dias > 14 ? 'text-naranja font-semibold' : 'text-textMid'
  return <span className={`text-xs ${cls}`}>{dias}d</span>
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
    .filter(c => !warningFilter || getDataWarning(c) === warningFilter)
    .filter(c => !topFilter    || isTopCustomer(c.consecutivo))

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

  // ── Totales rápidos ───────────────────────────────────────────────────────
  const totalFac = sorted.reduce((s, c) => s + (c.mrr_zoho ?? c.facturacion ?? 0), 0)
  const totalTickets = sorted.reduce((s, c) => s + (c.zoho_tickets?.total ?? 0), 0)
  const totalFallas  = sorted.reduce((s, c) => s + (c.zoho_tickets?.fallas ?? 0), 0)

  // ── Header de columna ─────────────────────────────────────────────────────
  function Th({ label, field, right }: { label: string; field?: keyof Cuenta; right?: boolean }) {
    return (
      <th onClick={field ? () => toggleSort(field) : undefined}
        className={field ? 'cursor-pointer select-none' : ''}>
        <span className={`flex items-center gap-1 ${right ? 'justify-end' : ''}`}>
          {label}
          {field && <ArrowUpDown size={10} className="opacity-40 flex-shrink-0" />}
        </span>
      </th>
    )
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Cuentas Estratégicas"
        subtitle={`${sorted.length} de ${cuentas.length} cuentas`}
        actions={
          <Link href="/cuentas/nueva" className="cp-btn cp-btn-primary">
            <Plus size={14} /> Nueva cuenta
          </Link>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 px-6 pb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow" />
          <input className="cp-input pl-8 w-56" placeholder="Buscar empresa…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select className="cp-select" value={asesorFilter} onChange={e => setAsesorFilter(e.target.value)}>
          <option value="">Todos los asesores</option>
          {ASESORES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select className="cp-select" value={semaforoFilter} onChange={e => setSemaforoFilter(e.target.value)}>
          <option value="">Todos los semáforos</option>
          {SEMAFOROS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        <select className="cp-select" value={warningFilter} onChange={e => setWarningFilter(e.target.value as '' | 'FALTA_TC' | 'FALTA_HS')}>
          <option value="">Todas las fichas</option>
          <option value="FALTA_TC">⚠ Falta ficha Top Customer</option>
          <option value="FALTA_HS">⚠ Falta Health Score Callpicker</option>
        </select>

        <button onClick={() => setTopFilter(t => !t)}
          className={`cp-btn text-xs font-semibold border transition-colors ${
            topFilter ? 'bg-cp/20 text-cp border-cp/50' : 'cp-btn-ghost border-cp/30 text-cp hover:bg-cp/10'
          }`}>
          ⭐ Solo Top Customer
        </button>

        <button onClick={fetchCuentas} className="cp-btn cp-btn-ghost">
          <RefreshCw size={14} /> Actualizar
        </button>

        {(search || asesorFilter || semaforoFilter || warningFilter || topFilter) && (
          <button onClick={() => { setSearch(''); setAsesorFilter(''); setSemaforoFilter(''); setWarningFilter(''); setTopFilter(false) }}
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
                  <col style={{ width: '70px' }} />   {/* # */}
                  <col style={{ width: '220px' }} />  {/* Empresa */}
                  <col style={{ width: '110px' }} />  {/* Asesor */}
                  <col style={{ width: '120px' }} />  {/* Facturación */}
                  <col style={{ width: '120px' }} />  {/* Health Score */}
                  <col style={{ width: '120px' }} />  {/* Semáforo */}
                  <col style={{ width: '100px' }} />  {/* Días sin act. */}
                  <col style={{ width: '150px' }} />  {/* Tickets Zoho */}
                  <col style={{ width: '80px' }} />   {/* Acción */}
                </colgroup>
                <thead>
                  <tr>
                    <Th label="#"                   field="consecutivo" />
                    <Th label="Empresa"             field="empresa" />
                    <Th label="Asesor"              field="asesor" />
                    <Th label="Facturación"         field="facturacion" />
                    <Th label="Health Score"        field="health_score" />
                    <Th label="Semáforo" />
                    <Th label="Días sin actividad"  field="dias_sin_actividad" />
                    <Th label="Tickets Zoho Desk" />
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

                        {/* Facturación — MRR desde Zoho (con fallback a Supabase) */}
                        <td>
                          <div>
                            <span className="text-sm font-bold text-textHi tabular-nums">
                              {formatMXN(c.mrr_zoho ?? c.facturacion)}
                            </span>
                            {c.mrr_zoho != null && (
                              <p className="text-[9px] text-cp/60 mt-0.5">mensual · Zoho</p>
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

                        {/* Días sin actividad */}
                        <td>
                          <DiasCell dias={c.dias_sin_actividad} />
                        </td>

                        {/* Tickets Zoho Desk — datos reales */}
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
