'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import type { SemaforoAsesor } from '@/lib/types'

const COLORS = {
  verde: '#22C55E', azul: '#3B82F6', amarillo: '#EAB308', naranja: '#F97316', rojo: '#EF4444',
}

interface Props { data: SemaforoAsesor[] }

export default function SemaforoDashChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: d.asesor,
    Verde: d.verde,
    Azul: d.azul,
    Amarillo: d.amarillo,
    Naranja: d.naranja,
    Rojo: d.rojo,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4B5E82', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#0F1E38', border: '1px solid #263352', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#F0F6FF', fontWeight: 600 }}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
        {Object.entries(COLORS).map(([key, color]) => (
          <Bar key={key} dataKey={key.charAt(0).toUpperCase() + key.slice(1)}
            stackId="a" fill={color} radius={key === 'verde' ? [4,4,0,0] : undefined} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
