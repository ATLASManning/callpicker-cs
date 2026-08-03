'use client'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, Line, Cell,
} from 'recharts'
import { Ticket, AlertTriangle, RepeatIcon, TrendingUp, RefreshCw } from 'lucide-react'

/* ── Tokens (match app/page.tsx dark palette) ───────────────────────── */
const PANEL   = '#0F2040'
const BORDER  = 'rgba(255,255,255,0.10)'
const BORDER2 = 'rgba(255,255,255,0.06)'
const TX_HI   = '#FFFFFF'
const TX_MID  = 'rgba(255,255,255,0.70)'
const TX_LOW  = 'rgba(255,255,255,0.45)'
const CYAN    = '#00B4FF'
const RED     = '#EF4444'
const AMBER   = '#F59E0B'

const TT_STYLE = {
  background: '#0A1E35', border: '1px solid rgba(0,180,255,0.25)',
  borderRadius: 10, fontSize: 12, color: TX_HI,
  boxShadow: '0 4px 24px rgba(0,0,0,0.55)', padding: '10px 14px',
}

/* ── Types ───────────────────────────────────────────────────────────── */
export interface TicketsAnalyticsData {
  topClientes:  { empresa: string; total: number; fallas: number }[]
  porCategoria: { categoria: string; total: number; fallas: number }[]
  reincidentes: { empresa: string; categoria: string; count: number; fallas: number }[]
  tendencia:    { mes: string; label: string; total: number; fallas: number; otros: number }[]
  totalTickets: number
  totalFallas:  number
}

type TabKey = 'clientes' | 'servicio' | 'reincidencia' | 'tendencia'

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'clientes',     label: 'Top Clientes',  icon: Ticket        },
  { key: 'servicio',     label: 'Por Servicio',   icon: RefreshCw     },
  { key: 'reincidencia', label: 'Reincidencia',   icon: RepeatIcon    },
  { key: 'tendencia',    label: 'Tendencia',       icon: TrendingUp    },
]

/* ── Tooltip shared ─────────────────────────────────────────────────── */
function HBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const total  = payload.find((p: any) => p.dataKey === 'total')?.value ?? 0
  const fallas = payload.find((p: any) => p.dataKey === 'fallas')?.value ?? 0
  const pct    = total > 0 ? ((fallas / total) * 100).toFixed(1) : '0'
  return (
    <div style={TT_STYLE}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: TX_HI }}>{label}</p>
      <p style={{ color: CYAN }}>Total: <strong>{total}</strong></p>
      {fallas > 0 && <p style={{ color: RED }}>Fallas: <strong>{fallas}</strong> ({pct}%)</p>}
    </div>
  )
}

function StackedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const otros  = payload.find((p: any) => p.dataKey === 'otros')?.value ?? 0
  const fallas = payload.find((p: any) => p.dataKey === 'fallas')?.value ?? 0
  const total  = otros + fallas
  const pct    = total > 0 ? ((fallas / total) * 100).toFixed(1) : '0'
  return (
    <div style={TT_STYLE}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: TX_HI }}>{label}</p>
      <p style={{ color: CYAN }}>Total: <strong>{total}</strong></p>
      {fallas > 0 && <p style={{ color: RED }}>Fallas: <strong>{fallas}</strong> ({pct}%)</p>}
    </div>
  )
}

/* ── Chart: Top Clientes (horizontal bars) ──────────────────────────── */
function TopClientesChart({ data }: { data: TicketsAnalyticsData['topClientes'] }) {
  const chartData = data.map(d => ({ ...d, otros: d.total - d.fallas }))
  const maxLen = Math.max(...data.map(d => d.empresa.length))
  const yWidth = Math.min(maxLen * 6.5, 160)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={BORDER2} strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fill: TX_LOW, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="empresa" width={yWidth}
          tick={{ fill: TX_MID, fontSize: 11 }}
          tickFormatter={v => v.length > 22 ? v.slice(0, 21) + '…' : v}
          axisLine={false} tickLine={false} />
        <Tooltip content={<HBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="otros" name="Tickets" stackId="t" fill={CYAN} fillOpacity={0.85}
          radius={[0, 0, 0, 0]} barSize={14} />
        <Bar dataKey="fallas" name="Fallas" stackId="t" fill={RED} fillOpacity={0.9}
          radius={[0, 3, 3, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Chart: Por Servicio (horizontal bars) ──────────────────────────── */
function PorServicioChart({ data }: { data: TicketsAnalyticsData['porCategoria'] }) {
  const chartData = data.map(d => ({ ...d, otros: d.total - d.fallas }))
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={BORDER2} strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fill: TX_LOW, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="categoria" width={160}
          tick={{ fill: TX_MID, fontSize: 11 }}
          tickFormatter={v => v.length > 24 ? v.slice(0, 23) + '…' : v}
          axisLine={false} tickLine={false} />
        <Tooltip content={<HBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="otros" name="Tickets" stackId="s" fill={CYAN} fillOpacity={0.85}
          radius={[0, 0, 0, 0]} barSize={14} />
        <Bar dataKey="fallas" name="Fallas" stackId="s" fill={RED} fillOpacity={0.9}
          radius={[0, 3, 3, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Reincidencia: ranked list ───────────────────────────────────────── */
function ReincidenciaList({ data }: { data: TicketsAnalyticsData['reincidentes'] }) {
  const max = data[0]?.count ?? 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((r, i) => {
        const pct = Math.round((r.count / max) * 100)
        const hasFallas = r.fallas > 0
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Rank */}
            <span style={{ fontSize: 12, fontWeight: 800, color: i < 3 ? AMBER : TX_LOW, width: 20, textAlign: 'right', flexShrink: 0 }}>
              {i + 1}
            </span>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TX_HI, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.empresa}
                  </span>
                  <span style={{ fontSize: 11, color: TX_LOW, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    · {r.categoria}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {hasFallas && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.14)', color: RED, border: '1px solid rgba(239,68,68,0.25)' }}>
                      {r.fallas} falla{r.fallas > 1 ? 's' : ''}
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 800, color: CYAN, width: 28, textAlign: 'right' }}>{r.count}</span>
                </div>
              </div>
              {/* Bar */}
              <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: hasFallas ? RED : CYAN, opacity: 0.8 }} />
              </div>
            </div>
          </div>
        )
      })}
      <p style={{ fontSize: 11, color: TX_LOW, marginTop: 4 }}>
        Combinaciones empresa × tipo de soporte con 3 o más tickets · ordenado por volumen
      </p>
    </div>
  )
}

/* ── Chart: Tendencia mensual (stacked bars) ────────────────────────── */
function TendenciaChart({ data }: { data: TicketsAnalyticsData['tendencia'] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={BORDER2} strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fill: TX_LOW, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: TX_LOW, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<StackedTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="otros" name="Atención" stackId="m" fill={CYAN} fillOpacity={0.80}
          radius={[0, 0, 0, 0]} barSize={40} />
        <Bar dataKey="fallas" name="Fallas" stackId="m" fill={RED} fillOpacity={0.90}
          radius={[3, 3, 0, 0]} barSize={40} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* ── Leyenda compartida ─────────────────────────────────────────────── */
function Leyenda() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: TX_MID }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: CYAN, display: 'inline-block' }} />
        Tickets de atención
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: TX_MID }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: RED, display: 'inline-block' }} />
        Fallas reportadas
      </span>
    </div>
  )
}

/* ── Panel principal ─────────────────────────────────────────────────── */
export default function TicketsAnalyticsChart({ data }: { data: TicketsAnalyticsData }) {
  const [tab, setTab] = useState<TabKey>('clientes')
  const fallaPct = data.totalTickets > 0
    ? ((data.totalFallas / data.totalTickets) * 100).toFixed(1) : '0'

  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: TX_MID }}>
            Análisis de Tickets
          </p>
          <p style={{ fontSize: 12, color: TX_LOW, marginTop: 2 }}>
            {data.totalTickets.toLocaleString()} tickets totales ·&nbsp;
            <span style={{ color: RED, fontWeight: 700 }}>{data.totalFallas} fallas ({fallaPct}%)</span>
          </p>
        </div>
        <Leyenda />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: active ? 700 : 500,
                background: active ? `${CYAN}20` : 'rgba(255,255,255,0.05)',
                color: active ? CYAN : TX_MID,
                outline: active ? `1px solid ${CYAN}40` : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
              <t.icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {tab === 'clientes' && (
        <>
          <p style={{ fontSize: 12, color: TX_LOW, marginBottom: 12 }}>
            Top 10 clientes por volumen de tickets — barras apiladas: atención (azul) + fallas (rojo)
          </p>
          <TopClientesChart data={data.topClientes} />
        </>
      )}

      {tab === 'servicio' && (
        <>
          <p style={{ fontSize: 12, color: TX_LOW, marginBottom: 12 }}>
            Distribución por tipo de servicio · {data.porCategoria.length} categorías activas
          </p>
          <PorServicioChart data={data.porCategoria} />
        </>
      )}

      {tab === 'reincidencia' && (
        <>
          <p style={{ fontSize: 12, color: TX_LOW, marginBottom: 16 }}>
            Clientes con mayor repetición de solicitudes en un mismo tipo de soporte
          </p>
          <ReincidenciaList data={data.reincidentes} />
        </>
      )}

      {tab === 'tendencia' && (
        <>
          <p style={{ fontSize: 12, color: TX_LOW, marginBottom: 12 }}>
            Volumen mensual de tickets · barras apiladas por tipo (atención + fallas)
          </p>
          <TendenciaChart data={data.tendencia} />
        </>
      )}
    </div>
  )
}
