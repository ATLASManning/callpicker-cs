'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import {
  Search, RefreshCw, ArrowUpDown, AlertTriangle, ArrowUpRight,
  Archive, ChevronLeft, Users,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'
import AsesorBadge from '@/components/AsesorBadge'
import type { Cuenta, Asesor } from '@/lib/types'
import { getSemaforo, formatMXN } from '@/lib/types'

const ASESORES: Asesor[] = ['Fátima', 'Dan', 'Claudia']

// ── Motivo dormido ────────────────────────────────────────────────────────────
function getMotivo(c: Cuenta): { label: string; color: string } {
  if (c.estado === 'cancelado')                 return { label: 'Cancelado',       color: '#EF4444' }
  if (c.estado === 'hibernacion')               return { label: 'Hibernación',     color: '#8B5CF6' }
  if (c.semaforo_zoho === '4 - Dormido')        return { label: 'Dormido Zoho',    color: '#64748B' }
  if (!c.facturacion || c.facturacion === 0)    return { label: 'Sin facturación', color: '#6366F1' }
  if (c.health_score < 20)                      return { label: 'HS Crítico',      color: '#F97316' }
  return                                               { label: 'Dormido',         color: '#94A3B8' }
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

// ── Tickets cell ─────────────────────────────────────────────────────────────
function TicketsCell({ cuenta }: { cuenta: Cuenta }) {
  const zt = cuenta.zoho_tickets
  if (!zt || zt.total === 0) return <span className="text-xs text-textLow">—</span>
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-bold text-textHi">{zt.total}</span>
      {zt.fallas > 0 && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
          bg-rojo/10 text-rojo text-[10px] font-semibold border border-rojo/20">
          <AlertTriangle size={9} /> {zt.fallas}
        </span>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
function DormidasPageInner() {
  const [cuentas, setCuentas]   = useState<Cuenta[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [asesorFilter, setAsesorFilter] = useState('')
  const [motivoFilter, setMotivoFilter] = useState('')
  const [sortField, setSortField] = useState<keyof Cuenta>('health_score')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc')

  const fetchCuentas = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)       params.set('search', search)
    if (asesorFilter) params.set('asesor', asesorFilter)
    const res  = await fetch(`/api/cuentas?${params}`)
    const data = await res.json()
    // Solo las dormidas
    const dormidas = (data as Cuenta[]).filter(c => getEstadoKey(c) === '4')
    setCuentas(dormidas)
    setLoading(false)
  }, [search, asesorFilter])

  useEffect(() => { fetchCuentas() }, [fetchCuentas])

  const filtered = cuentas.filter(c => {
    if (!motivoFilter) return true
    return getMotivo(c).label === motivoFilter
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
    else { setSortField(field); setSortDir('asc') }
  }

  // Conteos por motivo
  const porMotivo = cuentas.reduce<Record<string, number>>((acc, c) => {
    const m = getMotivo(c).label
    acc[m] = (acc[m] ?? 0) + 1
    return acc
  }, {})

  const totalFac = sorted.reduce((s, c) =>
    s + (c.factura_mensual_zoho ?? c.mrr_zoho ?? c.facturacion ?? 0), 0)

  // Header de columna
  function Th({ label, field }: { label: string; field?: keyof Cuenta }) {
    const active = field && sortField === field
    return (
      <th
        onClick={field ? () => toggleSort(field) : undefined}
        className={`px-3 py-2.5 text-left ${field ? 'cursor-pointer select-none' : ''}`}
      >
        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
          active ? 'text-cp' : 'text-textLow'
        }`}>
          {label}
          {field && <ArrowUpDown size={9} className={active ? 'opacity-100 text-cp' : 'opacity-30'} />}
        </span>
      </th>
    )
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Cuentas Dormidas"
        subtitle={`${sorted.length} cuentas${cuentas.length !== sorted.length ? ` de ${cuentas.length}` : ''}`}
        actions={
          <Link href="/cuentas"
            className="cp-btn cp-btn-ghost text-sm flex items-center gap-1.5">
            <ChevronLeft size={14} /> Cuentas Activas
          </Link>
        }
      />

      {/* Resumen por motivo */}
      {!loading && cuentas.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 pb-4">
          {Object.entries(porMotivo).map(([motivo, count]) => {
            const color = getMotivo(cuentas.find(c => getMotivo(c).label === motivo)!).color
            const isActive = motivoFilter === motivo
            return (
              <button
                key={motivo}
                onClick={() => setMotivoFilter(isActive ? '' : motivo)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                style={{
                  background: isActive ? `${color}20` : 'transparent',
                  color,
                  borderColor: `${color}40`,
                }}>
                <Archive size={10} />
                {motivo}
                <span className="ml-0.5 font-bold">{count}</span>
              </button>
            )
          })}
          {motivoFilter && (
            <button onClick={() => setMotivoFilter('')}
              className="text-xs text-textLow px-2 py-1 hover:text-textHi transition-colors">
              × Limpiar
            </button>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 px-6 pb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textLow" />
          <input className="cp-input pl-8 w-56" placeholder="Buscar empresa…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select className="cp-select" value={asesorFilter}
          onChange={e => setAsesorFilter(e.target.value)}>
          <option value="">Todos los asesores</option>
          {ASESORES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <button onClick={fetchCuentas} className="cp-btn cp-btn-ghost">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Tabla */}
      <div className="px-6 pb-6">
        <div className="cp-card p-0 overflow-hidden"
          style={{ borderColor: '#94A3B830' }}>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-textLow text-sm gap-2">
                <RefreshCw size={16} className="animate-spin" /> Cargando…
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Users size={28} className="text-textLow opacity-40" />
                <p className="text-textLow text-sm">No hay cuentas dormidas con estos filtros</p>
              </div>
            ) : (
              <table className="cp-table">
                <colgroup>
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '210px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '115px' }} />
                  <col style={{ width: '115px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '75px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th label="#"             field="consecutivo" />
                    <Th label="Empresa"       field="empresa"     />
                    <Th label="Asesor"        field="asesor"      />
                    <Th label="Facturación"   field="facturacion" />
                    <Th label="Health Score"  field="health_score"/>
                    <Th label="Semáforo"                          />
                    <Th label="Motivo"                            />
                    <Th label="Tickets Zoho"                      />
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(c => {
                    const semaforo = getSemaforo(c.health_score)
                    const motivo   = getMotivo(c)
                    return (
                      <tr key={c.id} style={{ opacity: 0.85 }}>

                        {/* # */}
                        <td>
                          <span className="font-mono text-xs font-bold text-textLow">
                            {c.consecutivo}
                          </span>
                        </td>

                        {/* Empresa */}
                        <td>
                          <Link href={`/cuentas/${c.id}`}
                            className="text-sm font-semibold text-textHi hover:text-cp transition-colors block leading-tight">
                            {c.empresa}
                          </Link>
                          {c.giro && (
                            <p className="text-[11px] text-textLow truncate max-w-[190px] mt-0.5">{c.giro}</p>
                          )}
                        </td>

                        {/* Asesor */}
                        <td><AsesorBadge asesor={c.asesor} /></td>

                        {/* Facturación */}
                        <td>
                          <span className="text-sm font-bold text-textHi tabular-nums">
                            {c.factura_mensual_zoho != null
                              ? formatMXN(c.factura_mensual_zoho)
                              : c.facturacion
                                ? formatMXN(c.facturacion)
                                : '—'}
                          </span>
                        </td>

                        {/* Health Score */}
                        <td>
                          <div className="flex items-center gap-2">
                            <HealthScoreRing score={c.health_score} size={32} strokeWidth={4} showLabel={false} />
                            <span className="text-sm font-bold text-textHi tabular-nums">{c.health_score}</span>
                          </div>
                        </td>

                        {/* Semáforo */}
                        <td><SemaforoBadge semaforo={semaforo} size="sm" /></td>

                        {/* Motivo */}
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 99,
                            background: `${motivo.color}15`,
                            color: motivo.color,
                            fontSize: 10, fontWeight: 700,
                            border: `1px solid ${motivo.color}30`,
                            whiteSpace: 'nowrap',
                          }}>
                            <Archive size={9} />
                            {motivo.label}
                          </span>
                        </td>

                        {/* Tickets */}
                        <td><TicketsCell cuenta={c} /></td>

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

          {/* Footer */}
          {!loading && sorted.length > 0 && (
            <div className="border-t px-5 py-3 flex items-center justify-between text-xs text-textLow"
              style={{ borderColor: '#94A3B820', background: '#94A3B805' }}>
              <span className="flex items-center gap-1.5">
                <Archive size={11} />
                {sorted.length} cuentas dormidas
                {totalFac > 0 && <> · <span className="font-semibold text-textMid">{formatMXN(totalFac)}</span> facturación potencial</>}
              </span>
              <Link href="/cuentas" className="flex items-center gap-1 hover:text-textHi transition-colors">
                <ChevronLeft size={11} /> Volver a Cuentas Activas
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DormidasPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-40 text-textLow text-sm">Cargando…</div>
    }>
      <DormidasPageInner />
    </Suspense>
  )
}
