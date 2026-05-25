'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from 'recharts'
import type { SemaforoAsesor } from '@/lib/types'
import { formatMXN } from '@/lib/types'

const SEM = {
  verde:    { color: '#22C55E', label: 'Saludable' },
  azul:     { color: '#3B82F6', label: 'Estable' },
  amarillo: { color: '#EAB308', label: 'Observación' },
  naranja:  { color: '#F97316', label: 'En Riesgo' },
  rojo:     { color: '#EF4444', label: 'Riesgo Alto' },
}

const ASESOR_COLOR: Record<string, string> = {
  'Fátima':  '#A855F7',
  'Dan':     '#0EA5E9',
  'Claudia': '#F97316',
}

const TT_DARK = {
  background: '#0A1E35',
  border: '1px solid rgba(0,180,255,0.28)',
  borderRadius: 10,
  fontSize: 12,
  color: '#E8F4FF',
  boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
  padding: '10px 14px',
}

// ── Tooltip enriquecido ────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  const riesgo = row.Naranja + row.Rojo
  const pctRiesgo = row.total > 0 ? Math.round((riesgo / row.total) * 100) : 0
  const saludables = row.Verde + row.Azul
  const pctSalud = row.total > 0 ? Math.round((saludables / row.total) * 100) : 0

  return (
    <div style={TT_DARK}>
      <p style={{ fontWeight: 800, fontSize: 13, color: ASESOR_COLOR[label] ?? '#00B4FF', marginBottom: 8 }}>
        {label}
      </p>
      {/* Semáforos */}
      {Object.entries(SEM).map(([key, { color, label: lbl }]) => (
        row[key.charAt(0).toUpperCase() + key.slice(1)] > 0 && (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 3 }}>
            <span style={{ color: 'rgba(200,228,255,0.65)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 5 }} />
              {lbl}
            </span>
            <span style={{ fontWeight: 700, color: '#fff' }}>
              {row[key.charAt(0).toUpperCase() + key.slice(1)]} cuentas
            </span>
          </div>
        )
      ))}
      {/* Separador */}
      <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.10)' }} />
      {/* Totales */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 4 }}>
        <span style={{ color: 'rgba(200,228,255,0.65)' }}>Total cuentas</span>
        <span style={{ fontWeight: 700, color: '#fff' }}>{row.total}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 4 }}>
        <span style={{ color: 'rgba(200,228,255,0.65)' }}>Facturación total</span>
        <span style={{ fontWeight: 700, color: '#00B4FF' }}>{formatMXN(row.facturacionTotal)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 4 }}>
        <span style={{ color: '#22C55E' }}>Saludables + Estables</span>
        <span style={{ fontWeight: 700, color: '#22C55E' }}>{saludables} ({pctSalud}%)</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
        <span style={{ color: '#EF4444' }}>En riesgo / crítico</span>
        <span style={{ fontWeight: 700, color: '#EF4444' }}>{riesgo} ({pctRiesgo}%)</span>
      </div>
      {row.facturacionRiesgo > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 3 }}>
          <span style={{ color: 'rgba(200,228,255,0.5)', fontSize: 11 }}>Facturación en riesgo</span>
          <span style={{ fontWeight: 600, color: '#FCA5A5', fontSize: 11 }}>{formatMXN(row.facturacionRiesgo)}</span>
        </div>
      )}
    </div>
  )
}

interface Props { data: SemaforoAsesor[] }

export default function SemaforoDashChart({ data }: Props) {
  const chartData = data.map(d => ({
    name:              d.asesor,
    Verde:             d.verde,
    Azul:              d.azul,
    Amarillo:          d.amarillo,
    Naranja:           d.naranja,
    Rojo:              d.rojo,
    total:             d.total,
    facturacionTotal:  d.facturacion_total,
    facturacionRiesgo: d.facturacion_en_riesgo,
  }))

  // Máximo de facturación para escalar el eje derecho
  const maxFac = Math.max(...data.map(d => d.facturacion_total), 1)

  return (
    <div>
      {/* ── Mini KPIs por asesor ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {data.map(d => {
          const riesgo   = d.naranja + d.rojo
          const pctRiesgo = d.total > 0 ? Math.round((riesgo / d.total) * 100) : 0
          const color     = ASESOR_COLOR[d.asesor] ?? '#00B4FF'
          return (
            <div key={d.asesor} style={{
              flex: 1, padding: '10px 14px', borderRadius: 10,
              background: `${color}12`, border: `1px solid ${color}30`,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{d.asesor}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{d.total}</p>
              <p style={{ fontSize: 10, color: 'rgba(200,228,255,0.55)', marginTop: 2 }}>cuentas</p>
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${color}20` }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#00B4FF', fontVariantNumeric: 'tabular-nums' }}>
                  {formatMXN(d.facturacion_total)}
                </p>
                {riesgo > 0 && (
                  <p style={{ fontSize: 10, color: '#FCA5A5', marginTop: 2 }}>
                    {riesgo} en riesgo ({pctRiesgo}%)
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Gráfica compuesta barras + línea facturación ──────────────── */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgba(200,228,255,0.75)', fontSize: 12, fontWeight: 600 }}
            axisLine={false} tickLine={false}
          />
          {/* Eje izquierdo: número de cuentas */}
          <YAxis
            yAxisId="left"
            tick={{ fill: 'rgba(200,228,255,0.40)', fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          {/* Eje derecho: facturación */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, maxFac * 1.1]}
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fill: 'rgba(0,180,255,0.55)', fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,180,255,0.06)' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            formatter={(value) => (
              <span style={{ color: 'rgba(200,228,255,0.65)' }}>{value}</span>
            )}
          />

          {/* Barras apiladas por semáforo */}
          {Object.entries(SEM).map(([key, { color }], i) => (
            <Bar
              key={key}
              yAxisId="left"
              dataKey={key.charAt(0).toUpperCase() + key.slice(1)}
              stackId="s"
              fill={color}
              maxBarSize={72}
              radius={i === 0 ? [4, 4, 0, 0] : undefined}
            >
              <LabelList
                dataKey={key.charAt(0).toUpperCase() + key.slice(1)}
                position="center"
                style={{ fontSize: 10, fontWeight: 700, fill: 'rgba(255,255,255,0.85)' }}
                formatter={(v: number) => (v > 0 ? v : '')}
              />
            </Bar>
          ))}

          {/* Línea de facturación total */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="facturacionTotal"
            stroke="#00B4FF"
            strokeWidth={2.5}
            dot={{ fill: '#00B4FF', r: 5, strokeWidth: 2, stroke: '#0A1628' }}
            activeDot={{ r: 7, stroke: '#00B4FF', strokeWidth: 2, fill: '#0A1628' }}
            name="Facturación"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
