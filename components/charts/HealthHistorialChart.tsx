'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface Props {
  data: { fecha: string; health_score: number; semaforo?: string | null }[]
}

export default function HealthHistorialChart({ data }: Props) {
  const chartData = data.map(d => {
    const dt = new Date(d.fecha)
    return {
      fecha: isNaN(dt.getTime()) ? d.fecha : dt.toLocaleDateString('es-MX', { month:'short', day:'numeric' }),
      score: d.health_score,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
        <XAxis dataKey="fecha" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#FFFFFF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 11, boxShadow: '0 2px 8px rgba(0,87,255,0.1)' }}
          labelStyle={{ color: '#64748B' }}
        />
        <ReferenceLine y={60} stroke="#BFDBFE" strokeDasharray="3 3" />
        <ReferenceLine y={40} stroke="#FCA5A5" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="score" stroke="#0057FF" strokeWidth={2}
          dot={{ fill: '#0057FF', r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
