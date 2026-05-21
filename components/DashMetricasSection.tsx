'use client'

/**
 * DashMetricasSection — panel estilo Mission Control / NASA
 * Se renderiza como sección inferior del Dashboard principal.
 * Toda la data llega desde el servidor (app/page.tsx).
 */

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import Link from 'next/link'
import {
  ShieldAlert, TrendingUp, BarChart3, Activity,
  ArrowUpRight, Zap,
} from 'lucide-react'
import { formatMXN } from '@/lib/types'

// ── Paleta azul marino — igual que AsesorCard y Dashboard ────────────────────
const PANEL    = '#0F2040'
const BORDER   = 'rgba(255,255,255,0.10)'
const BORDER_B = 'rgba(255,255,255,0.06)'
const TX_HI    = '#FFFFFF'
const TX_MID   = 'rgba(255,255,255,0.70)'
const TX_LOW   = 'rgba(255,255,255,0.45)'
const CYAN     = '#00B4FF'

// Tooltip oscuro para Recharts
const TT = {
  background: '#0A1628',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  fontSize: 12,
  color: TX_HI,
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
}

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface MetricasKPIs {
  facturacionRiesgo: number
  churnCount:        number
  valorUpsell:       number
  upsellCount:       number
  crossCount:        number
  retencionPct:      number
  totalCuentas:      number
}

export interface ChurnRow {
  id: string
  consecutivo: string
  empresa: string
  asesor: string
  facturacion: number
  health_score: number
  dias_sin_actividad: number
}

export interface Top10Row {
  empresa: string
  facturacion: number
  consecutivo: string
}

interface Props {
  kpis:      MetricasKPIs
  top10:     Top10Row[]
  churnRows: ChurnRow[]
  updatedAt: string   // ISO string
}

// ── KpiBlock — tarjeta KPI oscura ────────────────────────────────────────────
function KpiBlock({
  icon: Icon, label, value, sub, accent, pulse = false,
}: {
  icon: React.ElementType; label: string; value: string
  sub: string; accent: string; pulse?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${PANEL} 0%, rgba(10,22,40,0.98) 100%)`,
        border: `1px solid ${accent}25`,
        boxShadow: `0 0 20px ${accent}10, 0 4px 16px rgba(0,0,0,0.4)`,
      }}>

      {/* Glow corner */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accent}12 0%, transparent 70%)` }} />

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: TX_LOW }}>{label}</span>
        {pulse && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-black tabular-nums leading-none tracking-tight"
          style={{ color: TX_HI }}>{value}</p>
        <p className="text-[11px] mt-1.5 leading-snug" style={{ color: TX_MID }}>{sub}</p>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashMetricasSection({ kpis, top10, churnRows, updatedAt }: Props) {
  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
  }

  const hsColor = (hs: number) =>
    hs < 30 ? '#FF4444' : hs < 40 ? '#F97316' : '#EAB308'

  // Colores para el bar chart Top 10
  const BAR_COLORS = [
    '#00B4FF','#0090D4','#006DAA','#004D80','#003D66',
    '#00B4FF','#0090D4','#006DAA','#004D80','#003D66',
  ]

  return (
    <section style={{ background: 'transparent' }}>

      {/* ── Separador de sección ──────────────────────────────────────────── */}
      <div className="px-6 pt-2 pb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} style={{ color: CYAN }} />
            <span className="text-xs font-black uppercase tracking-[0.10em]"
              style={{ color: TX_HI }}>
              Métricas · Resumen Operativo
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"
              style={{ boxShadow: '0 0 6px rgba(74,222,128,0.7)' }} />
            <span className="text-[10px] font-semibold" style={{ color: '#4ADE80' }}>En línea</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px]" style={{ color: TX_LOW }}>
          <span className="flex items-center gap-1.5">
            <Zap size={11} style={{ color: CYAN }} />
            Actualizado {fmtTime(updatedAt)}
          </span>
          <span>·</span>
          <span>{kpis.totalCuentas} cuentas en cartera</span>
          <Link href="/cuentas"
            className="flex items-center gap-1 hover:underline"
            style={{ color: CYAN }}>
            Ver todas <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-5">
        <KpiBlock
          icon={ShieldAlert}
          label="Facturación en Riesgo"
          value={formatMXN(kpis.facturacionRiesgo)}
          sub={`${kpis.churnCount} cuentas con Health Score < 40`}
          accent="#FF4444"
          pulse
        />
        <KpiBlock
          icon={TrendingUp}
          label="Pipeline Upsell"
          value={formatMXN(kpis.valorUpsell)}
          sub={`${kpis.upsellCount} oportunidades activas identificadas`}
          accent="#00E676"
        />
        <KpiBlock
          icon={Activity}
          label="Pipeline Cross-sell"
          value={String(kpis.crossCount)}
          sub="cuentas con oportunidad cross-sell"
          accent="#A855F7"
        />
        <KpiBlock
          icon={BarChart3}
          label="Índice de Retención"
          value={`${kpis.retencionPct}%`}
          sub={`${kpis.totalCuentas - kpis.churnCount} cuentas fuera de zona de riesgo`}
          accent="#00B4FF"
        />
      </div>

      {/* ── Top 10 Facturación ─────────────────────────────────────────────── */}
      <div className="px-6 pb-5">
        <div className="rounded-2xl p-5"
          style={{ background: PANEL, border: `1px solid ${BORDER}` }}>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.10em]"
              style={{ color: TX_HI }}>
              Top 10 · Mayor Facturación
            </h3>
            <span className="text-[10px]" style={{ color: TX_LOW }}>
              {formatMXN(top10.reduce((s, r) => s + r.facturacion, 0))} total
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={top10}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fill: TX_LOW, fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category" dataKey="empresa" width={130}
                tick={{ fill: TX_MID, fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + '…' : v}
              />
              <Tooltip
                contentStyle={TT}
                labelStyle={{ color: TX_HI, fontWeight: 700 }}
                formatter={(v: number) => [formatMXN(v), 'Facturación']}
                cursor={{ fill: 'rgba(0,180,255,0.06)' }}
              />
              <Bar dataKey="facturacion" radius={[0, 6, 6, 0]}>
                {top10.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i] ?? '#00B4FF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tabla: Cuentas Críticas HS < 40 ───────────────────────────────── */}
      {churnRows.length > 0 && (
        <div className="px-6 pb-6">
          <div className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid rgba(255,68,68,0.20)`, background: PANEL }}>

            {/* Header tabla */}
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,68,68,0.12)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"
                  style={{ boxShadow: '0 0 6px rgba(255,68,68,0.8)' }} />
                <h3 className="text-xs font-bold uppercase tracking-[0.10em]"
                  style={{ color: '#FF8080' }}>
                  Cuentas Críticas · Health Score &lt; 40
                </h3>
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,68,68,0.15)', color: '#FF6060' }}>
                  {churnRows.length}
                </span>
              </div>
              <Link href="/churn"
                className="text-[11px] flex items-center gap-1 hover:underline"
                style={{ color: CYAN }}>
                Ver análisis Churn <ArrowUpRight size={10} />
              </Link>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['#', 'Empresa', 'Asesor', 'Facturación', 'H/S', 'Días sin act.'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: TX_LOW, background: 'rgba(255,255,255,0.02)',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {churnRows.map((c, idx) => (
                    <tr key={c.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,180,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)')}
                    >
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#FF6060' }}>
                          {c.consecutivo}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <Link href={`/cuentas/${c.id}`}
                          className="hover:underline"
                          style={{ fontSize: 13, fontWeight: 600, color: TX_HI }}>
                          {c.empresa}
                        </Link>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: TX_MID }}>
                        {c.asesor}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums', color: TX_HI }}>
                        {formatMXN(c.facturacion)}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          fontSize: 14, fontWeight: 900,
                          fontVariantNumeric: 'tabular-nums',
                          color: hsColor(c.health_score),
                          textShadow: `0 0 8px ${hsColor(c.health_score)}60`,
                        }}>
                          {c.health_score}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: c.dias_sin_actividad > 30 ? '#FF4444'
                            : c.dias_sin_actividad > 14 ? '#F97316' : TX_MID,
                        }}>
                          {c.dias_sin_actividad}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,68,68,0.10)' }}>
              <span style={{ fontSize: 11, color: TX_LOW }}>
                {churnRows.length} cuentas en zona de riesgo alto ·{' '}
                {formatMXN(churnRows.reduce((s, c) => s + c.facturacion, 0))} en riesgo
              </span>
            </div>
          </div>
        </div>
      )}

    </section>
  )
}
