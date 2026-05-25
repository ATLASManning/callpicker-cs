'use client'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import type { SemaforoAsesor } from '@/lib/types'
import { formatMXN } from '@/lib/types'
import { useState } from 'react'

const ASESOR_COLOR: Record<string, string> = {
  'Fátima':  '#A855F7',
  'Dan':     '#0EA5E9',
  'Claudia': '#F97316',
}

const RANGOS = [
  { key: 'verde',    label: 'Saludable',   color: '#22C55E' },
  { key: 'azul',     label: 'Estable',     color: '#3B82F6' },
  { key: 'amarillo', label: 'Observación', color: '#EAB308' },
  { key: 'naranja',  label: 'En Riesgo',   color: '#F97316' },
  { key: 'rojo',     label: 'Riesgo Alto', color: '#EF4444' },
]

const TT_DARK = {
  background: '#0A1E35',
  border: '1px solid rgba(0,180,255,0.28)',
  borderRadius: 10,
  fontSize: 12,
  color: '#E8F4FF',
  boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
  padding: '10px 14px',
}

// ── Tooltip ────────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null
  const rangoInfo = RANGOS.find(r => r.label === label)

  return (
    <div style={TT_DARK}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {rangoInfo && (
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: rangoInfo.color, display: 'inline-block',
          }} />
        )}
        <p style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>{label}</p>
      </div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 28, marginBottom: 4 }}>
          <span style={{ color: p.stroke }}>● {p.name}</span>
          <span style={{ fontWeight: 700, color: '#fff' }}>
            {mode === 'cuentas'
              ? `${p.value} cuentas`
              : formatMXN(p.value)
            }
          </span>
        </div>
      ))}
    </div>
  )
}

interface Props { data: SemaforoAsesor[] }

export default function AsesorLineasChart({ data }: Props) {
  const [mode, setMode] = useState<'cuentas' | 'importe'>('cuentas')

  // Pivot: por rango → cada asesor tiene su valor
  const chartData = RANGOS.map(({ key, label }) => {
    const row: Record<string, any> = { rango: label }
    data.forEach(d => {
      const cnt = d[key as keyof SemaforoAsesor] as number
      // Aproximar facturación por rango: proporcional al conteo
      const facPorCuenta = d.total > 0 ? d.facturacion_total / d.total : 0
      row[d.asesor]              = cnt
      row[`${d.asesor}_fac`]    = Math.round(cnt * facPorCuenta)
    })
    return row
  })

  const asesores = data.map(d => d.asesor)

  // Totales para el encabezado
  const totalesFac  = Object.fromEntries(data.map(d => [d.asesor, d.facturacion_total]))
  const totalesCnt  = Object.fromEntries(data.map(d => [d.asesor, d.total]))

  return (
    <div>
      {/* ── Toggle modo ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['cuentas', 'importe'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', transition: 'all 150ms',
                background: mode === m ? '#00B4FF' : 'rgba(255,255,255,0.07)',
                color:      mode === m ? '#001220' : 'rgba(200,228,255,0.60)',
                border:     mode === m ? 'none' : '1px solid rgba(255,255,255,0.10)',
              }}
            >
              {m === 'cuentas' ? '# Cuentas' : '$ Importe'}
            </button>
          ))}
        </div>
        {/* Leyenda rápida por asesor */}
        <div style={{ display: 'flex', gap: 14 }}>
          {asesores.map(a => (
            <div key={a} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: ASESOR_COLOR[a] }}>{a}</span>
              <span style={{ fontSize: 10, color: 'rgba(200,228,255,0.50)', fontVariantNumeric: 'tabular-nums' }}>
                {mode === 'cuentas'
                  ? `${totalesCnt[a]} total`
                  : formatMXN(totalesFac[a])
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gráfica de líneas ────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />

          {/* Bandas de color para rangos */}
          {RANGOS.map(({ label, color }) => (
            <ReferenceLine
              key={label}
              x={label}
              stroke={color}
              strokeOpacity={0.15}
              strokeWidth={28}
            />
          ))}

          <XAxis
            dataKey="rango"
            tick={{ fill: 'rgba(200,228,255,0.65)', fontSize: 11, fontWeight: 600 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tickFormatter={v =>
              mode === 'cuentas' ? String(v) : `$${(v / 1000).toFixed(0)}k`
            }
            tick={{ fill: 'rgba(200,228,255,0.40)', fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip mode={mode} />}
            cursor={{ stroke: 'rgba(0,180,255,0.20)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            formatter={(value) => (
              <span style={{ color: ASESOR_COLOR[value] ?? 'rgba(200,228,255,0.65)' }}>{value}</span>
            )}
          />

          {asesores.map(a => (
            <Line
              key={a}
              type="monotone"
              dataKey={mode === 'cuentas' ? a : `${a}_fac`}
              name={a}
              stroke={ASESOR_COLOR[a] ?? '#fff'}
              strokeWidth={2.5}
              dot={{ fill: ASESOR_COLOR[a] ?? '#fff', r: 5, strokeWidth: 2, stroke: '#0A1628' }}
              activeDot={{ r: 7, stroke: ASESOR_COLOR[a] ?? '#fff', strokeWidth: 2, fill: '#0A1628' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
