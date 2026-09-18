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
        {/* Tooltip OSCURO, como los de DashAlertasCriticas y MetricasCharts.
            Recharts arma su contenido con un <p> y unos <span> sin background
            propio; esta gráfica vive dentro de una `.cp-card`, así que
            globals.css los fuerza a blanco con !important y le gana a
            labelStyle/itemStyle. Con el fondo blanco que tenía antes, el
            tooltip salía como una caja vacía. */}
        <Tooltip
          contentStyle={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, fontSize: 11, boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
          itemStyle={{ color: '#FFFFFF' }}
        />
        <ReferenceLine y={60} stroke="#BFDBFE" strokeDasharray="3 3" />
        <ReferenceLine y={40} stroke="#FCA5A5" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="score" stroke="#0057FF" strokeWidth={2}
          dot={{ fill: '#0057FF', r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
