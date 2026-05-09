'use client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import type { SemaforoAsesor } from '@/lib/types'
import { formatMXN } from '@/lib/types'

interface Props {
  data: {
    semaforoAsesor: SemaforoAsesor[]
    dist: { verde: number; azul: number; amarillo: number; naranja: number; rojo: number }
    top10: { empresa: string; facturacion: number; consecutivo: string }[]
  }
}

const SEM_COLORS = { verde:'#22C55E', azul:'#3B82F6', amarillo:'#EAB308', naranja:'#F97316', rojo:'#EF4444' }
const TT_STYLE = { background: '#FFFFFF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,87,255,0.1)' }

export default function MetricasCharts({ data }: Props) {
  const pieData = Object.entries(data.dist).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
    color: SEM_COLORS[k as keyof typeof SEM_COLORS],
  })).filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Distribución semáforo doughnut */}
      <div className="cp-card">
        <h3 className="text-sm font-semibold text-textHi mb-4">Distribución Semáforo</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
              dataKey="value" paddingAngle={2}>
              {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v} cuentas`]} />
            <Legend iconType="circle" iconSize={10}
              formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 Facturación */}
      <div className="cp-card">
        <h3 className="text-sm font-semibold text-textHi mb-4">Top 10 Facturación</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.top10} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="empresa" width={110}
              tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v} />
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [formatMXN(v)]} labelStyle={{ color: '#0F172A' }} />
            <Bar dataKey="facturacion" fill="#0057FF" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Semáforo por asesor stacked */}
      <div className="cp-card lg:col-span-2">
        <h3 className="text-sm font-semibold text-textHi mb-4">Semáforo por Asesor (detalle)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.semaforoAsesor.map(d => ({ name: d.asesor, ...d }))} margin={{ top:0, right:10, left:-20, bottom:0 }}>
            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT_STYLE} cursor={{ fill: 'rgba(0,87,255,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="verde"    stackId="a" fill={SEM_COLORS.verde}    name="Verde" />
            <Bar dataKey="azul"     stackId="a" fill={SEM_COLORS.azul}     name="Azul" />
            <Bar dataKey="amarillo" stackId="a" fill={SEM_COLORS.amarillo} name="Amarillo" />
            <Bar dataKey="naranja"  stackId="a" fill={SEM_COLORS.naranja}  name="Naranja" />
            <Bar dataKey="rojo"     stackId="a" fill={SEM_COLORS.rojo}     name="Rojo" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
