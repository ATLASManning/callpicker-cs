'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  BarChart,
} from 'recharts'
import { formatMXN } from '@/lib/types'

// ── Paleta ────────────────────────────────────────────────────────────────────
const BG       = '#0A1628'
const PANEL    = 'rgba(255,255,255,0.04)'
const BORDER   = 'rgba(255,255,255,0.08)'
const ACCENT   = '#00B4FF'
const TX       = '#E8F4FF'
const TX_MID   = 'rgba(200,228,255,0.65)'
const TX_LOW   = 'rgba(200,228,255,0.40)'

const VENDEDOR_COLOR: Record<string, string> = {
  'Fátima':       '#A855F7',
  'Dan':          '#0EA5E9',
  'Claudia':      '#F97316',
  'Monse':        '#22C55E',
  'José':         '#F59E0B',
  'Sin vendedor': '#64748B',
  'Otro':         '#94A3B8',
}

const CUENTA_COLOR: Record<string, string> = {
  'micro':    '#3B82F6',
  'pequeña':  '#22C55E',
  'mediana':  '#F97316',
  'grande':   '#A855F7',
}

const TT_STYLE = {
  background: '#0A1E35',
  border: '1px solid rgba(0,180,255,0.28)',
  borderRadius: 10,
  fontSize: 13,
  color: TX,
  boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
  padding: '12px 16px',
}

// ── Sub-tipos ─────────────────────────────────────────────────────────────────
export interface MesDato    { mes: string; count: number; facturacion: number }
export interface VendedorDato { vendedor: string; count: number; facturacion: number }
export interface TamanoDato  { tamano: string; count: number }
export interface Reciente    {
  id: string; cliente: string; fechaArranque: string
  vendedor: string; tamanoCuenta: string; primerPago: number
}

export interface ActivacionesData {
  total:            number
  facturacionTotal: number
  promedioPago:     number
  pctSinVendedor:   number
  porMes:           MesDato[]
  porVendedor:      VendedorDato[]
  porTamanoCuenta:  TamanoDato[]
  porTamanoEmpresa: TamanoDato[]
  recientes:        Reciente[]
  updatedAt:        string
}

// ── Tooltip genérico ──────────────────────────────────────────────────────────
function TooltipMes({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={TT_STYLE}>
      <p style={{ fontWeight: 800, color: ACCENT, marginBottom: 8 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 28, marginBottom: 4 }}>
          <span style={{ color: p.color ?? TX_MID }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: TX, fontVariantNumeric: 'tabular-nums' }}>
            {p.name === 'Activaciones' ? `${p.value}` : formatMXN(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function TooltipVendedor({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={TT_STYLE}>
      <p style={{ fontWeight: 800, color: VENDEDOR_COLOR[label] ?? ACCENT, marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28, marginBottom: 4 }}>
        <span style={{ color: TX_MID }}>Activaciones</span>
        <span style={{ fontWeight: 700, color: TX }}>{d?.count}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28 }}>
        <span style={{ color: TX_MID }}>Facturación</span>
        <span style={{ fontWeight: 700, color: ACCENT }}>{formatMXN(d?.facturacion ?? 0)}</span>
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = ACCENT }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      flex: 1, padding: '16px 20px', borderRadius: 12,
      background: PANEL, border: `1px solid ${BORDER}`,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: TX_MID, marginTop: 6 }}>{sub}</p>}
    </div>
  )
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ children, title, sub }: { children: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ padding: '20px 24px', borderRadius: 14, background: PANEL, border: `1px solid ${BORDER}` }}>
      <p style={{ fontSize: 15, fontWeight: 800, color: TX, marginBottom: sub ? 2 : 16 }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: TX_MID, marginBottom: 16 }}>{sub}</p>}
      {children}
    </div>
  )
}

// ── Leyenda personalizada para Pie ────────────────────────────────────────────
function PieLegend({ items, colorMap }: { items: TamanoDato[]; colorMap: Record<string, string> }) {
  const total = items.reduce((s, i) => s + i.count, 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
      {items.map(({ tamano, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const color = colorMap[tamano] ?? '#94A3B8'
        return (
          <div key={tamano} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: TX_MID, flex: 1, textTransform: 'capitalize' }}>{tamano}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: TX, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
            <span style={{ fontSize: 11, color: TX_LOW, width: 32, textAlign: 'right' }}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ActivacionesCharts({ data }: { data: ActivacionesData }) {
  const {
    total, facturacionTotal, promedioPago, pctSinVendedor,
    porMes, porVendedor, porTamanoCuenta, porTamanoEmpresa,
    recientes, updatedAt,
  } = data

  const maxFac = Math.max(...porMes.map(m => m.facturacion), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16 }}>
        <KPI
          label="Total Activaciones"
          value={total.toLocaleString('es-MX')}
          sub={`Actualizado ${new Date(updatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`}
        />
        <KPI
          label="Facturación Total"
          value={formatMXN(facturacionTotal)}
          sub="Suma de primer pago"
          color="#22C55E"
        />
        <KPI
          label="Promedio 1er Pago"
          value={formatMXN(promedioPago)}
          color="#F59E0B"
        />
        <KPI
          label="Sin Vendedor Asignado"
          value={`${pctSinVendedor.toFixed(1)}%`}
          sub={`de ${total.toLocaleString('es-MX')} activaciones`}
          color={pctSinVendedor > 30 ? '#EF4444' : '#64748B'}
        />
      </div>

      {/* ── Fila 2: Mes + Vendedor ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>

        {/* Activaciones por Mes */}
        <Panel
          title="Activaciones por Mes"
          sub="Cantidad de nuevas cuentas y facturación acumulada por período"
        >
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={porMes} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="mes"
                tick={{ fill: TX_MID, fontSize: 11, fontWeight: 600 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: TX_LOW, fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, maxFac * 1.1]}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: 'rgba(0,180,255,0.50)', fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<TooltipMes />} cursor={{ fill: 'rgba(0,180,255,0.06)' }} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                formatter={(v) => <span style={{ color: TX_MID }}>{v}</span>}
              />
              <Bar
                yAxisId="left"
                dataKey="count"
                name="Activaciones"
                fill={ACCENT}
                fillOpacity={0.85}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="facturacion"
                name="Facturación"
                stroke="#22C55E"
                strokeWidth={2.5}
                dot={{ fill: '#22C55E', r: 4, strokeWidth: 2, stroke: BG }}
                activeDot={{ r: 6, stroke: '#22C55E', strokeWidth: 2, fill: BG }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        {/* Por Vendedor */}
        <Panel
          title="Por Vendedor"
          sub="Activaciones y facturación por ejecutivo"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={porVendedor}
              layout="vertical"
              margin={{ top: 4, right: 60, left: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                type="number"
                tick={{ fill: TX_LOW, fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="vendedor"
                tick={{ fill: TX_MID, fontSize: 12, fontWeight: 600 }}
                axisLine={false} tickLine={false}
                width={90}
              />
              <Tooltip content={<TooltipVendedor />} cursor={{ fill: 'rgba(0,180,255,0.06)' }} />
              <Bar dataKey="count" name="Activaciones" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {porVendedor.map(({ vendedor }) => (
                  <Cell key={vendedor} fill={VENDEDOR_COLOR[vendedor] ?? '#94A3B8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ── Fila 3: Tamaño Cuenta + Empresa ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Tamaño de Cuenta */}
        <Panel title="Por Tamaño de Cuenta" sub="Distribución de activaciones por segmento">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <PieChart width={180} height={180}>
              <Pie
                data={porTamanoCuenta}
                dataKey="count"
                nameKey="tamano"
                cx="50%" cy="50%"
                innerRadius={52} outerRadius={82}
                paddingAngle={3}
              >
                {porTamanoCuenta.map(({ tamano }) => (
                  <Cell key={tamano} fill={CUENTA_COLOR[tamano] ?? '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any, n: string) => [v, n]}
                contentStyle={TT_STYLE}
                itemStyle={{ color: TX }}
              />
            </PieChart>
            <div style={{ flex: 1 }}>
              <PieLegend items={porTamanoCuenta} colorMap={CUENTA_COLOR} />
            </div>
          </div>
        </Panel>

        {/* Tamaño de Empresa */}
        <Panel title="Por Tamaño de Empresa" sub="Rango de personas en la organización del cliente">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={porTamanoEmpresa}
              layout="vertical"
              margin={{ top: 0, right: 50, left: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                type="number"
                tick={{ fill: TX_LOW, fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="tamano"
                tick={{ fill: TX_MID, fontSize: 11 }}
                axisLine={false} tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={TT_STYLE}
                itemStyle={{ color: TX }}
                cursor={{ fill: 'rgba(0,180,255,0.06)' }}
              />
              <Bar dataKey="count" name="Activaciones" fill="#A855F7" fillOpacity={0.85} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ── Tabla de recientes ────────────────────────────────────────────── */}
      <Panel title="Últimas Activaciones" sub="20 registros más recientes por fecha de arranque">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['CID', 'Cliente', 'Fecha Arranque', 'Vendedor', 'Tamaño Cuenta', '1er Pago'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 12px',
                    color: TX_LOW, fontWeight: 700, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: `1px solid ${BORDER}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recientes.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '9px 12px', color: TX_LOW, fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{r.id}</td>
                  <td style={{ padding: '9px 12px', color: TX, fontWeight: 600 }}>{r.cliente}</td>
                  <td style={{ padding: '9px 12px', color: TX_MID, fontVariantNumeric: 'tabular-nums' }}>{r.fechaArranque}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      color: VENDEDOR_COLOR[r.vendedor] ?? TX_MID,
                      background: `${VENDEDOR_COLOR[r.vendedor] ?? '#64748B'}18`,
                    }}>{r.vendedor}</span>
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      textTransform: 'capitalize',
                      color: CUENTA_COLOR[r.tamanoCuenta] ?? TX_MID,
                      background: `${CUENTA_COLOR[r.tamanoCuenta] ?? '#94A3B8'}18`,
                    }}>{r.tamanoCuenta || '—'}</span>
                  </td>
                  <td style={{
                    padding: '9px 12px', color: '#22C55E', fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{r.primerPago > 0 ? formatMXN(r.primerPago) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
