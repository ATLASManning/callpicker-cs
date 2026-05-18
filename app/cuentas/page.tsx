'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, RefreshCw, Plus, ArrowUpDown, AlertCircle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'
import AsesorBadge from '@/components/AsesorBadge'
import type { Cuenta, Asesor, Semaforo } from '@/lib/types'
import { getSemaforo, formatMXN } from '@/lib/types'

const ASESORES: Asesor[] = ['Fátima', 'Dan', 'Claudia']
const SEMAFOROS: Semaforo[] = ['rojo', 'naranja', 'amarillo', 'azul', 'verde']

// Rangos oficiales Top Customer según Concentrado
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

function DataWarningBadge({ warning }: { warning: DataWarning }) {
  if (!warning) return null
  const isFaltaTC = warning === 'FALTA_TC'
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5 ${
      isFaltaTC
        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
    }`}>
      <AlertCircle size={9} />
      {isFaltaTC ? 'Falta Top Customer (ficha)' : 'Falta Health Score Callpicker'}
    </span>
  )
}

function CuentasPageInner() {
  const searchParams = useSearchParams()
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [asesorFilter, setAsesorFilter] = useState('')
  const [semaforoFilter, setSemaforoFilter] = useState('')
  const [sortField, setSortField] = useState<keyof Cuenta>('facturacion')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [warningFilter, setWarningFilter] = useState<'' | 'FALTA_TC' | 'FALTA_HS'>(
    (searchParams.get('warning') as '' | 'FALTA_TC' | 'FALTA_HS') || ''
  )
  const [topFilter, setTopFilter] = useState(searchParams.get('top') === '1')

  const fetchCuentas = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (asesorFilter) params.set('asesor', asesorFilter)
    if (semaforoFilter) params.set('semaforo', semaforoFilter)
    const res = await fetch(`/api/cuentas?${params}`)
    const data = await res.json()
    setCuentas(data)
    setLoading(false)
  }, [search, asesorFilter, semaforoFilter])

  useEffect(() => { fetchCuentas() }, [fetchCuentas])

  const filtered = cuentas
    .filter(c => !warningFilter || getDataWarning(c) === warningFilter)
    .filter(c => !topFilter || isTopCustomer(c.consecutivo))

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

  const th = (label: string, field?: keyof Cuenta) => (
    <th onClick={field ? () => toggleSort(field) : undefined}
      className={field ? 'cursor-pointer select-none' : ''}>
      <span className="flex items-center gap-1">
        {label}
        {field && <ArrowUpDown size={10} className="opacity-40" />}
      </span>
    </th>
  )

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
      <div className="flex flex-wrap gap-3 px-6 pb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow" />
          <input
            className="cp-input pl-8 w-56"
            placeholder="Buscar empresa…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
          <option value="FALTA_TC">⚠ Falta Top Customer (ficha)</option>
          <option value="FALTA_HS">⚠ Falta Health Score Callpicker</option>
        </select>

        <button
          onClick={() => setTopFilter(t => !t)}
          className={`cp-btn text-xs font-semibold border transition-colors ${
            topFilter
              ? 'bg-cp/20 text-cp border-cp/50 hover:bg-cp/30'
              : 'cp-btn-ghost border-cp/30 text-cp hover:bg-cp/10'
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

      {/* Tabla */}
      <div className="px-6 pb-6">
        <div className="cp-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-textLow text-sm gap-2">
                <RefreshCw size={16} className="animate-spin" /> Cargando…
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-textLow text-sm gap-2">
                <Filter size={24} />
                No hay cuentas con estos filtros
              </div>
            ) : (
              <table className="cp-table">
                <thead>
                  <tr>
                    {th('#', 'consecutivo')}
                    {th('Empresa', 'empresa')}
                    {th('Asesor', 'asesor')}
                    {th('Facturación', 'facturacion')}
                    {th('Health Score', 'health_score')}
                    {th('Semáforo')}
                    {th('Días sin actividad', 'dias_sin_actividad')}
                    {th('Llamadas Δ', 'llamadas_cambio_pct')}
                    {th('Tickets', 'tickets_abiertos')}
                    {th('Último contacto', 'ultimo_contacto')}
                    {th('Upsell')}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(c => {
                    const semaforo = getSemaforo(c.health_score)
                    const warning = getDataWarning(c)
                    const llamadaCls = c.llamadas_cambio_pct > 0 ? 'text-verde' :
                      c.llamadas_cambio_pct < -30 ? 'text-rojo' : 'text-naranja'
                    return (
                      <tr key={c.id}>
                        <td className="font-mono text-xs font-bold">
                          <span className={isTopCustomer(c.consecutivo) ? 'text-cp' : 'text-textLow'}>
                            {c.consecutivo}
                          </span>
                          {isTopCustomer(c.consecutivo) && (
                            <span className="ml-1 text-[9px] text-amber-400">TOP</span>
                          )}
                        </td>
                        <td>
                          <div>
                            <Link href={`/cuentas/${c.id}`}
                              className="text-sm font-semibold text-textHi hover:text-cpTeal transition-colors">
                              {c.empresa}
                            </Link>
                            {c.giro && <p className="text-[11px] text-textLow truncate max-w-[180px]">{c.giro}</p>}
                            <DataWarningBadge warning={warning} />
                          </div>
                        </td>
                        <td><AsesorBadge asesor={c.asesor} /></td>
                        <td className="font-semibold text-sm">{formatMXN(c.facturacion)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <HealthScoreRing score={c.health_score} size={36} strokeWidth={4} showLabel={false} />
                            <span className="text-sm font-bold text-textHi">{c.health_score}</span>
                          </div>
                        </td>
                        <td><SemaforoBadge semaforo={semaforo} size="sm" /></td>
                        <td>
                          <span className={`text-xs font-medium ${c.dias_sin_actividad > 10 ? 'text-rojo font-bold' : 'text-textMid'}`}>
                            {c.dias_sin_actividad}d
                          </span>
                        </td>
                        <td className={`text-xs font-semibold ${llamadaCls}`}>
                          {c.llamadas_cambio_pct > 0 ? '+' : ''}{c.llamadas_cambio_pct.toFixed(0)}%
                        </td>
                        <td>
                          <span className={`text-xs font-medium ${c.tickets_abiertos > 0 ? 'text-naranja' : 'text-textLow'}`}>
                            {c.tickets_abiertos}
                          </span>
                        </td>
                        <td className="text-xs text-textLow whitespace-nowrap">
                          {c.ultimo_contacto ? new Date(c.ultimo_contacto).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'}
                        </td>
                        <td>
                          {c.upsell_producto
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cpTeal/10 text-cpTeal text-[10px] font-medium border border-cpTeal/20">
                                ↑ {c.upsell_producto}
                              </span>
                            : c.crossell_producto
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-medium border border-purple-500/20">
                                ⇄ {c.crossell_producto}
                              </span>
                            : <span className="text-textLow text-xs">—</span>
                          }
                        </td>
                        <td>
                          <Link href={`/cuentas/${c.id}`}
                            className="cp-btn cp-btn-ghost text-xs py-1 px-3">
                            Ver
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
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
