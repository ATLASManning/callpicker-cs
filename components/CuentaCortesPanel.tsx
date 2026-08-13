'use client'
import { useEffect, useState } from 'react'
import { BarChart2, Loader2, AlertTriangle, Zap, TrendingUp, ExternalLink } from 'lucide-react'

interface CorteRow {
  cid: string; cliente: string; fechaCorte: string; periodo: string
  plan: string; minutosIncl: number; minutosConsum: number
  monto: number; pctConsumo: number; clasificacion: string
  pctEntrantes: number; pctSalientes: number; usoPrincipal: string
  eventosAnal: string
}

interface ByMes {
  [mes: string]: { count: number; monto: number; consumo: number; min: number; minC: number }
}

interface CortesResult { rows: CorteRow[]; byMes: ByMes; total: number }

const fmt$   = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')
const fmtMes = (ym: string) => {
  if (!ym) return ym
  const [y, m] = ym.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${meses[parseInt(m) - 1]} ${y}`
}

function pctColor(p: number) {
  if (p === 0)  return '#ef4444'
  if (p <= 20)  return '#f97316'
  if (p <= 60)  return '#f59e0b'
  if (p <= 100) return '#22c55e'
  return '#6366f1'
}

export default function CuentaCortesPanel({ cid, empresa }: { cid: string | null; empresa: string }) {
  const [data,    setData]    = useState<CortesResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [open,    setOpen]    = useState(false)

  useEffect(() => {
    const p = new URLSearchParams({ mode: 'by-cid' })
    if (cid)    p.set('cid',    cid)
    if (empresa) p.set('nombre', empresa)
    fetch(`/api/cortes?${p}`)
      .then(r => r.json())
      .then((d: CortesResult) => { setData(d) })
      .catch(() => setData({ rows: [], byMes: {}, total: 0 }))
      .finally(() => setLoading(false))
  }, [cid, empresa])

  if (loading) return (
    <div className="cp-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', justifyContent: 'center', color: '#94a3b8' }}>
        <Loader2 size={14} className="animate-spin" />
        <span style={{ fontSize: 11 }}>Consultando cortes…</span>
      </div>
    </div>
  )

  const noData = !data || data.total === 0
  const meses  = Object.entries(data?.byMes ?? {}).sort((a, b) => b[0].localeCompare(a[0]))
  const ultimo = meses[0]
  const promConsumo = ultimo
    ? (ultimo[1].consumo / Math.max(ultimo[1].count, 1))
    : null
  const montoTotal = meses.reduce((s, [, v]) => s + v.monto, 0)
  const planActual = data?.rows?.[0]?.plan ?? ''
  const usoPrincipal = data?.rows?.[0]?.usoPrincipal ?? ''

  return (
    <div className="cp-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={13} className="text-textMid" />
          <h3 style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Cortes de Facturación
          </h3>
          {!noData && (
            <span style={{ fontSize: 10, background: '#1B3FCC15', color: '#1B3FCC', fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>
              {data!.total} cortes
            </span>
          )}
        </div>
        <a href="/facturacion/cortes" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#1B3FCC', textDecoration: 'none' }}>
          Ver informe <ExternalLink size={10} />
        </a>
      </div>

      {noData ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8' }}>
          <AlertTriangle size={18} style={{ margin: '0 auto 6px' }} />
          <p style={{ fontSize: 12 }}>Sin cortes de facturación registrados</p>
          {!cid && <p style={{ fontSize: 11, marginTop: 4, color: '#f59e0b' }}>Configura el CID para búsqueda exacta</p>}
        </div>
      ) : (
        <>
          {/* KPIs rápidos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              {
                icon: Zap, label: 'Consumo',
                value: promConsumo != null ? `${promConsumo.toFixed(0)}%` : '—',
                color: promConsumo != null ? pctColor(promConsumo) : '#94a3b8',
                sub: 'último corte',
              },
              {
                icon: TrendingUp, label: 'Monto acum.',
                value: fmt$(montoTotal),
                color: '#1B3FCC',
                sub: `${meses.length} periodos`,
              },
              {
                icon: BarChart2, label: 'Uso princ.',
                value: usoPrincipal || '—',
                color: usoPrincipal === 'entrantes' ? '#1B3FCC' : usoPrincipal === 'salientes' ? '#f59e0b' : '#6366f1',
                sub: 'llamadas',
              },
            ].map(({ icon: Icon, label, value, color, sub }) => (
              <div key={label} style={{ padding: '10px 12px', borderRadius: 10, background: color + '08', border: `1px solid ${color}18` }}>
                <Icon size={11} style={{ color, marginBottom: 4 }} />
                <p style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Plan actual */}
          {planActual && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 10 }}>
              <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Plan vigente</p>
              <p style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{planActual}</p>
            </div>
          )}

          {/* Historial de meses */}
          <button
            onClick={() => setOpen(v => !v)}
            style={{ width: '100%', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginBottom: open ? 8 : 0, padding: 0 }}>
            {open ? '▴' : '▾'} Historial por mes ({meses.length} periodos)
          </button>

          {open && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 10 }}>Mes</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600, fontSize: 10 }}>Cortes</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600, fontSize: 10 }}>Monto</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600, fontSize: 10 }}>% Consumo</th>
                  </tr>
                </thead>
                <tbody>
                  {meses.map(([mes, v]) => {
                    const avg = v.count ? v.consumo / v.count : 0
                    return (
                      <tr key={mes} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px', color: '#374151', fontWeight: 600 }}>{fmtMes(mes)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b' }}>{v.count}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#1B3FCC' }}>{fmt$(v.monto)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: pctColor(avg) }}>{avg.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
