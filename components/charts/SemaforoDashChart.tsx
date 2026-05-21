'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { SemaforoAsesor } from '@/lib/types'

const COLORS = {
  verde: '#22C55E', azul: '#3B82F6', amarillo: '#EAB308',
  naranja: '#F97316', rojo: '#EF4444',
}

const TT_DARK = {
  background: '#0A1E35',
  border: '1px solid rgba(0,180,255,0.28)',
  borderRadius: 8,
  fontSize: 12,
  color: '#E8F4FF',
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
}

interface Props { data: SemaforoAsesor[] }

export default function SemaforoDashChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: d.asesor,
    Verde:    d.verde,
    Azul:     d.azul,
    Amarillo: d.amarillo,
    Naranja:  d.naranja,
    Rojo:     d.rojo,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(200,228,255,0.75)', fontSize: 12 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(200,228,255,0.45)', fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <Tooltip
          contentStyle={TT_DARK}
          labelStyle={{ color: '#E8F4FF', fontWeight: 700 }}
          cursor={{ fill: 'rgba(0,180,255,0.06)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          formatter={(value) => (
            <span style={{ color: 'rgba(200,228,255,0.75)' }}>{value}</span>
          )}
        />
        {Object.entries(COLORS).map(([key, color]) => (
          <Bar
            key={key}
            dataKey={key.charAt(0).toUpperCase() + key.slice(1)}
            stackId="a"
            fill={color}
            radius={key === 'verde' ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
