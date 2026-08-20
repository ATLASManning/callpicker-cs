'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import CustomSelect from '@/components/CustomSelect'
import { formatMXN } from '@/lib/types'

/* ── Paleta — igual que DashMetricasSection (sección contigua) ──────────── */
const PANEL   = '#0F2040'
const BORDER  = 'rgba(255,255,255,0.10)'
const TX_HI   = '#FFFFFF'
const TX_MID  = 'rgba(255,255,255,0.70)'
const TX_LOW  = 'rgba(255,255,255,0.45)'
const CYAN    = '#00B4FF'

export interface CuentaRank {
  id: string
  consecutivo: string
  empresa: string
  asesor: string | null
  facturacion: number
  healthScore: number
  activoDesde: string | null
  diasSinContacto: number | null
  ticketsTotal: number
  ticketsFallas: number
  upsellValor: number
  adopcionPct: number | null
  faltantesCount: number
}

interface Props {
  data: CuentaRank[]
}

type Dim =
  | 'antiguas' | 'recientes' | 'facMayor' | 'facMenor' | 'upsell'
  | 'sinMovimiento' | 'masTickets' | 'masFallas' | 'menosTickets'
  | 'healthBajo' | 'healthAlto' | 'adopcionBaja' | 'perfilIncompleto'

interface DimDef {
  label: string
  color: string
  dir: 'asc' | 'desc'
  money?: boolean
  value: (r: CuentaRank) => number | null
  fmt: (v: number) => string
}

const NUNCA = 999999
const diasDesde = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null
const fmtDias = (v: number) => v >= 365 ? `${(v / 365).toFixed(1)} años` : `${v} días`

const DIMS: Record<Dim, DimDef> = {
  antiguas: {
    label: 'Cuentas más antiguas', color: CYAN, dir: 'desc',
    value: r => diasDesde(r.activoDesde), fmt: fmtDias,
  },
  recientes: {
    label: 'Cuentas más recientes', color: '#22C55E', dir: 'asc',
    value: r => diasDesde(r.activoDesde), fmt: fmtDias,
  },
  facMayor: {
    label: 'Mayor facturación', color: CYAN, dir: 'desc', money: true,
    value: r => r.facturacion, fmt: formatMXN,
  },
  facMenor: {
    label: 'Menor facturación', color: '#F97316', dir: 'asc', money: true,
    value: r => r.facturacion, fmt: formatMXN,
  },
  upsell: {
    label: 'Mayor oportunidad upsell/cross-sell', color: '#A855F7', dir: 'desc', money: true,
    value: r => r.upsellValor, fmt: formatMXN,
  },
  sinMovimiento: {
    label: 'Más días sin contacto', color: '#EF4444', dir: 'desc',
    value: r => r.diasSinContacto ?? NUNCA, fmt: v => v >= NUNCA ? 'nunca contactada' : `${v} días`,
  },
  masTickets: {
    label: 'Más tickets', color: CYAN, dir: 'desc',
    value: r => r.ticketsTotal, fmt: v => `${v} tickets`,
  },
  masFallas: {
    label: 'Más fallas reportadas', color: '#EF4444', dir: 'desc',
    value: r => r.ticketsFallas, fmt: v => `${v} fallas`,
  },
  menosTickets: {
    label: 'Menos tickets (bajo compromiso)', color: '#94A3B8', dir: 'asc',
    value: r => r.ticketsTotal, fmt: v => `${v} tickets`,
  },
  healthBajo: {
    label: 'Menor Health Score (mayor riesgo)', color: '#EF4444', dir: 'asc',
    value: r => r.healthScore, fmt: v => `${Math.round(v)} pts`,
  },
  healthAlto: {
    label: 'Mayor Health Score (casos de éxito)', color: '#22C55E', dir: 'desc',
    value: r => r.healthScore, fmt: v => `${Math.round(v)} pts`,
  },
  adopcionBaja: {
    label: 'Menor adopción de producto', color: '#F97316', dir: 'asc',
    value: r => r.adopcionPct, fmt: v => `${Math.round(v)}%`,
  },
  perfilIncompleto: {
    label: 'Perfil más incompleto', color: '#EAB308', dir: 'desc',
    value: r => r.faltantesCount, fmt: v => `${v} datos faltantes`,
  },
}

const DIM_ORDER: Dim[] = [
  'healthBajo', 'healthAlto', 'sinMovimiento', 'perfilIncompleto', 'adopcionBaja',
  'facMayor', 'facMenor', 'upsell',
  'antiguas', 'recientes',
  'masTickets', 'masFallas', 'menosTickets',
]

const N_OPTS = [5, 10, 15, 20]

export default function TopCuentasVersatil({ data }: Props) {
  const [dim, setDim]   = useState<Dim>('healthBajo')
  const [topN, setTopN] = useState(10)
  const [fAsesor, setFAsesor] = useState('')

  const asesores = useMemo(() =>
    Array.from(new Set(data.map(r => r.asesor).filter(Boolean))).sort() as string[], [data])

  const def = DIMS[dim]

  const rows = useMemo(() => {
    const base = fAsesor ? data.filter(r => r.asesor === fAsesor) : data
    return base
      .map(r => ({ r, v: def.value(r) }))
      .filter((x): x is { r: CuentaRank; v: number } => x.v !== null)
      .sort((a, b) => def.dir === 'asc' ? a.v - b.v : b.v - a.v)
      .slice(0, topN)
  }, [data, def, fAsesor, topN])

  const chartData = rows.map(({ r, v }) => ({ name: r.empresa, value: v, id: r.id }))

  return (
    <div className="px-6 pb-5">
      <div className="rounded-2xl p-5" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>

        {/* Header + combos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                      gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={13} style={{ color: '#EAB308' }} />
              <h3 className="text-xs font-bold uppercase tracking-[0.10em]" style={{ color: TX_HI }}>
                Top Cuentas · Ranking Versátil
              </h3>
            </div>
            <p style={{ fontSize: 11, color: TX_LOW, marginTop: 3 }}>
              {def.label} — cada asesor debe conocer sus propios extremos, no solo el promedio
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 220 }}>
              <CustomSelect value={dim} onChange={v => setDim(v as Dim)}
                options={DIM_ORDER.map(k => ({ value: k, label: DIMS[k].label }))}
                className="cp-select text-xs" />
            </div>
            <div style={{ minWidth: 90 }}>
              <CustomSelect value={String(topN)} onChange={v => setTopN(Number(v))}
                options={N_OPTS.map(n => ({ value: String(n), label: `Top ${n}` }))}
                className="cp-select text-xs" />
            </div>
            <div style={{ minWidth: 130 }}>
              <CustomSelect value={fAsesor} onChange={setFAsesor}
                options={[{ value: '', label: 'Todos los asesores' }, ...asesores.map(a => ({ value: a, label: a }))]}
                className="cp-select text-xs" />
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <p style={{ fontSize: 12, color: TX_LOW, padding: '24px 0', textAlign: 'center' }}>
            Sin datos suficientes capturados para esta métrica todavía.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 28)}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: TX_LOW, fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => def.money ? `$${(v / 1000).toFixed(0)}k` : String(Math.round(v))} />
                <YAxis type="category" dataKey="name" tick={{ fill: TX_MID, fontSize: 10 }}
                  axisLine={false} tickLine={false} width={150}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                <Tooltip
                  formatter={(v: number) => [def.fmt(v), def.label]}
                  contentStyle={{ background: '#0A1628', border: `1px solid ${def.color}40`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: TX_HI, fontWeight: 700 }}
                  itemStyle={{ color: TX_HI }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {chartData.map((_, i) => <Cell key={i} fill={def.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Tabla de contexto */}
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['#', 'Cuenta', 'Asesor', def.label, 'Facturación', 'Health'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Facturación' || h === 'Health' ? 'right' : 'left',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: TX_LOW, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ r, v }, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '7px 10px', color: TX_LOW }}>{i + 1}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <Link href={`/cuentas/${r.id}`} style={{ textDecoration: 'none' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#60A5FA', marginRight: 6 }}>
                            {r.consecutivo}
                          </span>
                          <span style={{ color: TX_HI, fontWeight: 600 }}>{r.empresa}</span>
                        </Link>
                      </td>
                      <td style={{ padding: '7px 10px', color: TX_MID }}>{r.asesor ?? '—'}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: def.color }}>{def.fmt(v)}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: TX_MID, fontVariantNumeric: 'tabular-nums' }}>
                        {formatMXN(r.facturacion)}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                        color: r.healthScore < 40 ? '#EF4444' : r.healthScore < 60 ? '#EAB308' : '#22C55E' }}>
                        {Math.round(r.healthScore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
