'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, Users, BarChart2, AlertCircle, RefreshCw,
  Search, ChevronLeft, ChevronRight, Wifi, WifiOff,
} from 'lucide-react'

/* ── Tipos ─────────────────────────────────────────────────────────────────── */
interface FactRow {
  CID: string
  'Nombre del Cliente': string
  'Fecha de corte': string
  Periodo: string
  'Nombre del Plan': string
  'Minutos Incluidos': number | null
  'Minutos Consumidos': number | null
  'Monto del plan': number | null
  '% Consumo': number | null
  'Extensiones ilimitadas': string
  'Clasificación de empresa': string
  'Toggle Status': number | null
  'Total de interacciones': number | null
  '% Llamadas entrantes': number | null
  '% Llamadas salientes': number | null
  'Uso Principal de llamadas': string
}

interface Periodo { fecha: string; count: number; mrr: number }

interface Stats {
  total: number
  totalMrr: number
  avgConsumo: number
  sinUso: number
  conUso: number
  byClas: Record<string, { count: number; mrr: number }>
  topPlanes: { plan: string; count: number; mrr: number }[]
  bins?: number[]
  usoPrincipal?: Record<string, number>
  source: string
}

interface ListResult { total: number; page: number; size: number; rows: FactRow[]; source: string }

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const fmt$ = (n: number | null | undefined) =>
  n == null ? '—' : '$' + Math.round(n).toLocaleString('es-MX')

const fmtPct = (n: number | null | undefined) =>
  n == null ? '—' : n.toFixed(1) + '%'

const fmtDate = (s: string) => {
  if (!s) return '—'
  const parts = s.split('-')
  const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parts[2] ?? ''} ${meses[parseInt(parts[1])] ?? parts[1]} ${parts[0]}`
}

function ConsumoBar({ pct }: { pct: number | null }) {
  const v = Math.min(100, Math.max(0, pct ?? 0))
  const color = v === 0 ? '#94a3b8' : v < 40 ? '#22c55e' : v < 75 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 99 }}>
        <div style={{ width: `${v}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600, minWidth: 36 }}>{fmtPct(pct)}</span>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="cp-card" style={{ borderRadius: 14, padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ── Componente principal ──────────────────────────────────────────────────── */
export default function FacturacionPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [fechaActiva, setFechaActiva] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [list, setList] = useState<ListResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<'resumen' | 'clientes'>('resumen')

  useEffect(() => {
    setLoading(true)
    fetch('/api/facturacion?mode=periodos')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setPeriodos(d.periodos ?? [])
        setSource(d.source ?? '')
        if (d.periodos?.length) setFechaActiva(d.periodos[0].fecha)
      })
      .catch(() => setError('No se pudo conectar con la API'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!fechaActiva) return
    fetch(`/api/facturacion?mode=stats&fecha=${fechaActiva}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
  }, [fechaActiva])

  const fetchList = useCallback(() => {
    setLoadingList(true)
    const params = new URLSearchParams({
      mode: 'list', page: String(page), size: '20',
      ...(fechaActiva && { fecha: fechaActiva }),
      ...(q && { q }),
    })
    fetch(`/api/facturacion?${params}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setList(d) })
      .finally(() => setLoadingList(false))
  }, [fechaActiva, page, q])

  useEffect(() => { if (tab === 'clientes') fetchList() }, [tab, fetchList])

  const periodoActivo = periodos.find(p => p.fecha === fechaActiva)
  const totalPages = list ? Math.ceil(list.total / 20) : 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <RefreshCw size={28} style={{ color: '#1B3FCC', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#64748b', fontSize: 14 }}>Conectando con Zoho Analytics…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error || (!loading && periodos.length === 0)) return (
    <div style={{ padding: 32 }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: 28, maxWidth: 520 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <WifiOff size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Sin conexión a Zoho Analytics</p>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
              {error || 'No se encontraron datos. Verifica que las credenciales de Zoho estén configuradas y que el usuario tenga permisos sobre el workspace.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', background: '#f1f5f9', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Facturación</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            Consumo y MRR por período ·{' '}
            {source === 'zoho'
              ? <><Wifi size={11} style={{ color: '#22c55e' }} /><span style={{ color: '#22c55e', fontWeight: 600 }}>Zoho en vivo</span></>
              : <><WifiOff size={11} style={{ color: '#f59e0b' }} /><span style={{ color: '#f59e0b', fontWeight: 600 }}>Datos locales</span></>
            }
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 }}
        >
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* Selector de períodos */}
      <div className="cp-card" style={{ borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Período de corte — {periodos.length} fechas disponibles
        </p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {periodos.slice(0, 12).map(p => {
            const active = p.fecha === fechaActiva
            const parts = p.fecha.split('-')
            const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
            return (
              <button
                key={p.fecha}
                onClick={() => { setFechaActiva(p.fecha); setPage(1) }}
                style={{
                  flexShrink: 0, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                  border: active ? '2px solid #1B3FCC' : '1.5px solid #e2e8f0',
                  background: active ? '#1B3FCC' : '#fff',
                  color: active ? '#fff' : '#374151',
                  textAlign: 'center', minWidth: 90,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{meses[parseInt(parts[1])] ?? parts[1]} {parts[0]}</div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{p.count} cuentas</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 1 }}>${(p.mrr / 1000).toFixed(0)}k</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <KpiCard icon={DollarSign} label="MRR del período" value={fmt$(stats.totalMrr)} sub={`${stats.total} cuentas · ${periodoActivo?.fecha ?? ''}`} color="#1B3FCC" />
          <KpiCard icon={Users} label="Con actividad" value={String(stats.conUso)} sub={`${stats.sinUso} cuentas sin uso`} color="#22c55e" />
          <KpiCard icon={BarChart2} label="Consumo promedio" value={fmtPct(stats.avgConsumo)} sub="De minutos incluidos" color="#f59e0b" />
          <KpiCard icon={AlertCircle} label="Sin uso (Toggle=0)" value={String(stats.sinUso)} sub={`${stats.total ? ((stats.sinUso / stats.total) * 100).toFixed(1) : 0}% del total`} color="#ef4444" />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['resumen', 'clientes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === t ? '#1B3FCC' : '#fff',
            color: tab === t ? '#fff' : '#374151',
            boxShadow: tab === t ? '0 2px 8px rgba(27,63,204,0.25)' : '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            {t === 'resumen' ? 'Resumen' : 'Clientes'}
          </button>
        ))}
      </div>

      {/* ── Tab: Resumen ─────────────────────────────────────────────── */}
      {tab === 'resumen' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Por clasificación */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 22 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>MRR por clasificación</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(stats.byClas)
                .sort((a, b) => b[1].mrr - a[1].mrr)
                .map(([clas, v]) => {
                  const pct = stats.totalMrr ? (v.mrr / stats.totalMrr) * 100 : 0
                  return (
                    <div key={clas}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{clas || 'Sin clasificar'}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{fmt$(v.mrr)} · {v.count} ctas</span>
                      </div>
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#1B3FCC', borderRadius: 99 }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Top planes */}
          <div className="cp-card" style={{ borderRadius: 14, padding: 22 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Top planes por MRR</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.topPlanes.slice(0, 8).map((p, i) => (
                <div key={p.plan} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', minWidth: 16 }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 12, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plan}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1B3FCC' }}>{fmt$(p.mrr)}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.count} ctas</span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución consumo */}
          {stats.bins && (
            <div className="cp-card" style={{ borderRadius: 14, padding: 22 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Distribución de consumo de minutos</p>
              {[
                { label: '0% — Sin uso', color: '#94a3b8', val: stats.bins[0] },
                { label: '1% – 25%', color: '#22c55e', val: stats.bins[1] },
                { label: '26% – 50%', color: '#84cc16', val: stats.bins[2] },
                { label: '51% – 75%', color: '#f59e0b', val: stats.bins[3] },
                { label: '76% – 100%', color: '#f97316', val: stats.bins[4] },
                { label: 'Sobre límite', color: '#ef4444', val: stats.bins[5] },
              ].map(b => {
                const pct = stats.total ? (b.val / stats.total) * 100 : 0
                return (
                  <div key={b.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: '#374151' }}>{b.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{b.val} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: b.color, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Uso principal de llamadas */}
          {stats.usoPrincipal && (
            <div className="cp-card" style={{ borderRadius: 14, padding: 22 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Uso principal de llamadas</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(stats.usoPrincipal)
                  .sort((a, b) => b[1] - a[1])
                  .map(([uso, count]) => {
                    const pct = stats.total ? (count / stats.total) * 100 : 0
                    return (
                      <div key={uso}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: '#374151' }}>{uso || 'Sin datos'}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#1B3FCC' }}>{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#6366f1', borderRadius: 99 }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Clientes ─────────────────────────────────────────────── */}
      {tab === 'clientes' && (
        <div className="cp-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1) }}
                onKeyDown={e => e.key === 'Enter' && fetchList()}
                placeholder="Buscar por cliente, CID o plan…"
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button onClick={fetchList} style={{ padding: '8px 14px', borderRadius: 8, background: '#1B3FCC', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Buscar
            </button>
            {list && <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{list.total.toLocaleString()} registros</span>}
          </div>

          {loadingList
            ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Cargando…</div>
            : list && list.rows.length > 0
              ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['CID', 'Cliente', 'Plan', 'MRR', 'Consumo', 'Clasificación', 'Uso llamadas', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.rows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '9px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>{r.CID || '—'}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 600, color: '#0f172a', maxWidth: 180 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r['Nombre del Cliente'] || '—'}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{fmtDate(r['Fecha de corte'])}</div>
                          </td>
                          <td style={{ padding: '9px 12px', color: '#374151', maxWidth: 140 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r['Nombre del Plan'] || '—'}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{r['Minutos Incluidos'] != null ? `${r['Minutos Incluidos']} min inc.` : ''}</div>
                          </td>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1B3FCC' }}>{fmt$(r['Monto del plan'])}</td>
                          <td style={{ padding: '9px 12px', minWidth: 120 }}><ConsumoBar pct={r['% Consumo']} /></td>
                          <td style={{ padding: '9px 12px', color: '#374151' }}>{r['Clasificación de empresa'] || '—'}</td>
                          <td style={{ padding: '9px 12px', color: '#64748b' }}>{r['Uso Principal de llamadas'] || '—'}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                              background: r['Toggle Status'] ? '#dcfce7' : '#fee2e2',
                              color: r['Toggle Status'] ? '#16a34a' : '#dc2626',
                            }}>
                              {r['Toggle Status'] ? 'Activo' : 'Sin uso'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
              : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Sin resultados</div>
          }

          {list && totalPages > 1 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Página {page} de {totalPages}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={13} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
