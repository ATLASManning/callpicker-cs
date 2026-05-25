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
  fontSize: 13,
  color: '#E8F4FF',
  boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
  padding: '12px 16px',
  minWidth: 200,
}

function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null
  const rangoInfo = RANGOS.find(r => r.label === label)

  return (
    <div style={TT_DARK}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        {rangoInfo && (
          <span style={{
            width: 11, height: 11, borderRadius: '50%',
            background: rangoInfo.color, display: 'inline-block', flexShrink: 0,
          }} />
        )}
        <p style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{label}</p>
      </div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 32, marginBottom: 5 }}>
          <span style={{ color: p.stroke, fontWeight: 600, fontSize: 13 }}>● {p.name}</span>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
            {mode === 'cuentas' ? `${p.value} cuentas` : formatMXN(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface Props { data: SemaforoAsesor[] }

export default function AsesorLineasChart({ data }: Props) {
  const [mode, setMode] = useState<'cuentas' | 'importe'>('cuentas')

  const chartData = RANGOS.map(({ key, label }) => {
    const row: Record<string, any> = { rango: label }
    data.forEach(d => {
      const cnt = d[key as keyof SemaforoAsesor] as number
      const facPorCuenta = d.total > 0 ? d.facturacion_total / d.total : 0
      row[d.asesor]           = cnt
      row[`${d.asesor}_fac`] = Math.round(cnt * facPorCuenta)
    })
    return row
  })

  const asesores      = data.map(d => d.asesor)
  const totalesFac    = Object.fromEntries(data.map(d => [d.asesor, d.facturacion_total]))
  const totalesCnt    = Object.fromEntries(data.map(d => [d.asesor, d.total]))

  return (
    <div>
      {/* ── Cabecera: toggle + totales por asesor ────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>

        {/* Toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['cuentas', 'importe'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '6px 16px', borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 150ms',
                background: mode === m ? '#00B4FF' : 'rgba(255,255,255,0.07)',
                color:      mode === m ? '#001220' : 'rgba(200,228,255,0.65)',
                border:     mode === m ? 'none'    : '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {m === 'cuentas' ? '# Cuentas' : '$ Importe'}
            </button>
          ))}
        </div>

        {/* Totales por asesor */}
        <div style={{ display: 'flex', gap: 28 }}>
          {asesores.map(a => (
            <div key={a} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: ASESOR_COLOR[a] }}>{a}</span>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: 'rgba(255,255,255,0.85)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {mode === 'cuentas'
                  ? `${totalesCnt[a]} cuentas`
                  : formatMXN(totalesFac[a])
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gráfica ──────────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />

          {RANGOS.map(({ label, color }) => (
            <ReferenceLine
              key={label}
              x={label}
              stroke={color}
              strokeOpacity={0.13}
              strokeWidth={32}
            />
          ))}

          <XAxis
            dataKey="rango"
            tick={{ fill: 'rgba(200,228,255,0.80)', fontSize: 13, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tickFormatter={v =>
              mode === 'cuentas' ? String(v) : `$${(v / 1000).toFixed(0)}k`
            }
            tick={{ fill: 'rgba(200,228,255,0.50)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip
            content={<CustomTooltip mode={mode} />}
            cursor={{ stroke: 'rgba(0,180,255,0.20)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 13, fontWeight: 700, paddingTop: 14 }}
            formatter={(value) => (
              <span style={{ color: ASESOR_COLOR[value] ?? 'rgba(200,228,255,0.75)', fontWeight: 700 }}>
                {value}
              </span>
            )}
          />

          {asesores.map(a => (
            <Line
              key={a}
              type="monotone"
              dataKey={mode === 'cuentas' ? a : `${a}_fac`}
              name={a}
              stroke={ASESOR_COLOR[a] ?? '#fff'}
              strokeWidth={3}
              dot={{ fill: ASESOR_COLOR[a] ?? '#fff', r: 6, strokeWidth: 2.5, stroke: '#0A1628' }}
              activeDot={{ r: 8, stroke: ASESOR_COLOR[a] ?? '#fff', strokeWidth: 2.5, fill: '#0A1628' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
