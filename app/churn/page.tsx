'use client'
import { useState } from 'react'
import PageHeader from '@/components/PageHeader'
import {
  TrendingDown, AlertTriangle, XCircle, ArrowDownRight,
  Clock, DollarSign, BarChart3, CalendarDays, ChevronDown, ChevronUp,
} from 'lucide-react'

/* ─── Tipos ─────────────────────────────────────────────────────────── */
type SemaforoChurn = 'cancelado' | 'pendiente' | 'downgrade'
type Tab = 'resumen' | 'pendiente' | 'cancelados' | 'downgrades' | 't1'

/* ─── Paleta ─────────────────────────────────────────────────────────── */
const RED    = '#ef4444'
const ORANGE = '#f97316'
const AMBER  = '#f59e0b'
const BLUE   = '#3b82f6'
const INDIGO = '#6366f1'
const GRAY   = '#6b7280'

const SEMAFORO_MAP: Record<SemaforoChurn, { color: string; label: string; dot: string }> = {
  cancelado: { color: RED,    label: 'Cancelado',            dot: '🔴' },
  pendiente: { color: ORANGE, label: 'Pendiente Facturar',   dot: '🟠' },
  downgrade: { color: AMBER,  label: 'Downgrade',            dot: '🟡' },
}

/* ─── Datos ──────────────────────────────────────────────────────────── */
const PENDIENTES = [
  { cliente: 'Diprosa',             monto: 687,     mesesActivo: 24,  ultimaFactura: '25/03/2026' },
  { cliente: 'Emporio Inmobiliario',monto: 1599,    mesesActivo: 48,  ultimaFactura: '19/03/2026' },
  { cliente: 'GLOBAL BIENES RAICES',monto: 979,     mesesActivo: 1,   ultimaFactura: '26/03/2026' },
  { cliente: 'SE DUEÑO',            monto: 1587,    mesesActivo: 43,  ultimaFactura: '25/03/2026' },
  { cliente: 'Housebook Real Estate',monto: 973.90, mesesActivo: 28,  ultimaFactura: '16/03/2026' },
  { cliente: 'Ambientec',           monto: 986,     mesesActivo: 49,  ultimaFactura: '25/03/2026' },
  { cliente: 'jemmoma',             monto: 2634,    mesesActivo: 89,  ultimaFactura: '25/03/2026' },
  { cliente: 'Quality 360G',        monto: 489,     mesesActivo: 113, ultimaFactura: '25/03/2026' },
]

const CANCELADOS = [
  { cliente: 'JAD Suministros',          mrr: 4023,   mesesActivo: 75, acumulado: 552266.81 },
  { cliente: 'ZD - Grupo RH',            mrr: 3642,   mesesActivo: 10, acumulado: 36200.98 },
  { cliente: 'Remax Lafueya',            mrr: 2597.41,mesesActivo: 73, acumulado: 179257.55 },
  { cliente: 'Filo',                     mrr: 2256,   mesesActivo: 4,  acumulado: 17474 },
  { cliente: 'TRIBECA HAIR STUDIO',      mrr: 1767,   mesesActivo: 48, acumulado: 97228 },
  { cliente: 'Hospital Merlos',          mrr: 1450,   mesesActivo: 22, acumulado: 36350 },
  { cliente: 'IT GREEN',                 mrr: 1119,   mesesActivo: 1,  acumulado: 2238 },
  { cliente: 'Valdi abogados',           mrr: 989,    mesesActivo: 25, acumulado: 25696.68 },
  { cliente: 'ROYAL HOME',               mrr: 979,    mesesActivo: 43, acumulado: 43076 },
  { cliente: 'Neek Tulum',               mrr: 500,    mesesActivo: 55, acumulado: 28000 },
  { cliente: 'Price Logistics',          mrr: 489,    mesesActivo: 20, acumulado: 10269 },
  { cliente: 'Estradata',               mrr: 489,    mesesActivo: 14, acumulado: 7335 },
  { cliente: 'Boma Coaching & Analysis', mrr: 489,    mesesActivo: 9,  acumulado: 4401 },
  { cliente: 'CITUR',                    mrr: 489,    mesesActivo: 7,  acumulado: 3912 },
  { cliente: 'Estradata MH',             mrr: 415.65, mesesActivo: 59, acumulado: 22029.45 },
  { cliente: 'EXTIN-SON',               mrr: 359,    mesesActivo: 19, acumulado: 6428 },
  { cliente: '10 Experiences Tour',      mrr: 279,    mesesActivo: 64, acumulado: 17019 },
  { cliente: 'KINDEMEX',                 mrr: 195,    mesesActivo: 3,  acumulado: 780 },
  { cliente: 'BDM LAB',                  mrr: 169,    mesesActivo: 39, acumulado: 5971 },
]

const DOWNGRADES = [
  {
    cliente: 'Ancona Autopartes',
    perdida: 4583,
    nota: 'Redujo plan Agente CP Chat de $17,762 a $13,919 (-$3,843). Churn de Extension CE + Extension VyC (-$11,860). Entrada de Extensión VyC min IP (+$11,120).',
  },
  {
    cliente: 'ESDIE',
    perdida: 3000,
    nota: 'Paquete Min Voicebot cancelado de su facturación.',
  },
  {
    cliente: 'Finsus Cobranza',
    perdida: 2880,
    nota: 'Extension Callcenter reducida de $8,268 a $5,388.',
  },
  {
    cliente: 'Finaura',
    perdida: 2333.20,
    nota: 'Ofuscador $4,276→$3,000 · Paquete Min VyC $2,557→$1,794 · Paquete Campañas $984→$690. Facturación total pasa de $7,817.20 a $5,484.',
  },
]

const T1_CLIENTES = [
  { cliente: 'GDA - Genética',          perdida: 12812,  tipo: 'Churn confirmado', mes: 'Enero' },
  { cliente: 'GDA - Polab',             perdida: 5800,   tipo: 'Churn confirmado', mes: 'Enero' },
  { cliente: 'GDA - Family Labs',       perdida: 4580,   tipo: 'Churn confirmado', mes: 'Enero' },
  { cliente: 'MB Signature Properties', perdida: 9697.03,tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'Servidiesel',             perdida: 7065,   tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'Campus Residencias',      perdida: 6459,   tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'TYR International',       perdida: 3969,   tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'ZIBAHOME',               perdida: 3830,   tipo: 'Downgrade',        mes: 'Febrero' },
  { cliente: 'Velfare',                 perdida: 13780,  tipo: 'Churn confirmado', mes: 'Marzo' },
  { cliente: 'WOLFTOWERS',              perdida: 7876,   tipo: 'Churn confirmado', mes: 'Marzo' },
  { cliente: 'GTC - TLALPAN',           perdida: 6760,   tipo: 'Churn confirmado', mes: 'Marzo' },
  { cliente: 'Coristylo',               perdida: 6249,   tipo: 'Churn confirmado', mes: 'Marzo' },
  { cliente: 'GTC - LA JOYA',           perdida: 5986,   tipo: 'Churn confirmado', mes: 'Marzo' },
  { cliente: 'GTC - CROSSING',          perdida: 4042,   tipo: 'Churn confirmado', mes: 'Marzo' },
  { cliente: 'Robotix',                 perdida: 3886,   tipo: 'Churn confirmado', mes: 'Marzo' },
]

/* ─── Helpers ────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

function SemaforoDot({ tipo }: { tipo: SemaforoChurn }) {
  const s = SEMAFORO_MAP[tipo]
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
      style={{ background: `${s.color}15`, color: s.color, borderColor: `${s.color}35` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }:
  { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Leyenda de semáforo ────────────────────────────────────────────── */
function SemaforoLeyenda() {
  return (
    <div className="flex flex-wrap gap-3">
      {(Object.entries(SEMAFORO_MAP) as [SemaforoChurn, typeof SEMAFORO_MAP[SemaforoChurn]][]).map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />
          {v.dot} {v.label}
        </span>
      ))}
    </div>
  )
}

/* ─── Fila expandible (downgrades) ──────────────────────────────────── */
function DowngradeRow({ d }: { d: typeof DOWNGRADES[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr
        className="border-b border-gray-100 cursor-pointer hover:bg-amber-50/40 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <td className="py-3 pr-4 text-sm font-medium text-gray-900">{d.cliente}</td>
        <td className="py-3 pr-4 font-semibold text-sm" style={{ color: AMBER }}>{fmt(d.perdida)}</td>
        <td className="py-3 pr-4"><SemaforoDot tipo="downgrade" /></td>
        <td className="py-3 text-gray-400">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-gray-100 bg-amber-50/30">
          <td colSpan={4} className="px-4 py-3 text-xs text-gray-600 leading-relaxed">{d.nota}</td>
        </tr>
      )}
    </>
  )
}

/* ─── Página ─────────────────────────────────────────────────────────── */
const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'resumen',    label: 'Resumen',                  color: INDIGO },
  { id: 'pendiente',  label: `🟠 Pendientes (${PENDIENTES.length})`,  color: ORANGE },
  { id: 'cancelados', label: `🔴 Cancelados (${CANCELADOS.length})`,  color: RED },
  { id: 'downgrades', label: `🟡 Downgrades (${DOWNGRADES.length})`,  color: AMBER },
  { id: 't1',         label: 'Resumen T1 2026',           color: BLUE },
]

const totalPendiente  = PENDIENTES.reduce((s, c) => s + c.monto, 0)
const totalCancelados = CANCELADOS.reduce((s, c) => s + c.mrr, 0)
const totalDowngrades = DOWNGRADES.reduce((s, c) => s + c.perdida, 0)
const totalT1         = 300510
const totalT1Rel      = 102791.03

export default function ChurnPage() {
  const [tab, setTab] = useState<Tab>('resumen')

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Churn"
        subtitle="Análisis de pérdida de clientes · DATA → Dirección de Satisfacción al Cliente"
      />

      {/* KPI Cards */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={Clock}         label="Pendiente de Facturar"  value={fmt(totalPendiente)}  sub="8 clientes · Abril 2026"      color={ORANGE} />
        <KpiCard icon={XCircle}       label="MRR Cancelado"          value={fmt(totalCancelados)} sub="19 clientes · Abril 2026"     color={RED}    />
        <KpiCard icon={ArrowDownRight}label="Ingreso Perdido Downgrade" value={fmt(totalDowngrades)} sub="4 clientes · Abril 2026"  color={AMBER}  />
        <KpiCard icon={TrendingDown}  label="Pérdida Total T1 2026"  value={fmt(totalT1)}         sub="34.2% en 15 clientes clave"   color={INDIGO} />
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto shadow-sm">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={tab === t.id
                ? { background: t.color, color: '#fff' }
                : { color: '#6b7280' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

        {/* ── RESUMEN ─────────────────────────────────────────────── */}
        {tab === 'resumen' && (
          <>
            {/* Semáforo general */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Semáforo de Churn — Abril 2026</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Análisis elaborado por el área de DATA</p>
                </div>
                <SemaforoLeyenda />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Pendiente */}
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${ORANGE}50`, background: `${ORANGE}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: ORANGE }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ORANGE }}>Pendiente de Facturar</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalPendiente)}</p>
                  <p className="text-xs text-gray-500 mt-1">{PENDIENTES.length} clientes en riesgo</p>
                  <p className="text-xs mt-3 text-gray-600">Deben facturarse esta semana para evitar churn. Acción inmediata requerida.</p>
                </div>
                {/* Cancelados */}
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${RED}50`, background: `${RED}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: RED }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: RED }}>Cancelados</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalCancelados)}</p>
                  <p className="text-xs text-gray-500 mt-1">{CANCELADOS.length} clientes — última factura marzo</p>
                  <p className="text-xs mt-3 text-gray-600">Cuentas que cancelaron. MRR perdido en abril. Acumulado histórico relevante.</p>
                </div>
                {/* Downgrades */}
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${AMBER}50`, background: `${AMBER}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: AMBER }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: AMBER }}>Downgrades</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalDowngrades)}</p>
                  <p className="text-xs text-gray-500 mt-1">{DOWNGRADES.length} clientes con reducción de plan</p>
                  <p className="text-xs mt-3 text-gray-600">Ingreso mensual perdido por reducción de planes o cancelación parcial de productos.</p>
                </div>
              </div>
            </div>

            {/* Impacto total */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Impacto Total Abril 2026</h3>
              <div className="space-y-3">
                {[
                  { label: 'MRR en riesgo (pendiente de facturar)',   monto: totalPendiente,  color: ORANGE, pct: (totalPendiente / (totalPendiente + totalCancelados + totalDowngrades)) * 100 },
                  { label: 'MRR cancelado definitivo',                 monto: totalCancelados, color: RED,    pct: (totalCancelados / (totalPendiente + totalCancelados + totalDowngrades)) * 100 },
                  { label: 'Ingreso perdido por downgrades',           monto: totalDowngrades, color: AMBER,  pct: (totalDowngrades / (totalPendiente + totalCancelados + totalDowngrades)) * 100 },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{r.label}</span>
                      <span className="font-semibold" style={{ color: r.color }}>{fmt(r.monto)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 flex justify-between">
                  <span className="text-sm font-semibold text-gray-800">Total impacto abril</span>
                  <span className="text-sm font-bold text-gray-900">
                    {fmt(totalPendiente + totalCancelados + totalDowngrades)}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen T1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Contexto T1 2026</h3>
              <p className="text-xs text-gray-500 mb-4">El 34.2% de la pérdida trimestral se concentró en 15 clientes clave</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3" style={{ background: `${INDIGO}06`, borderColor: `${INDIGO}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pérdida Total T1</p>
                  <p className="text-xl font-bold mt-1" style={{ color: INDIGO }}>{fmt(totalT1)}</p>
                </div>
                <div className="rounded-lg border p-3" style={{ background: `${RED}06`, borderColor: `${RED}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">15 Clientes Relevantes</p>
                  <p className="text-xl font-bold mt-1" style={{ color: RED }}>{fmt(totalT1Rel)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">34.2% del total T1</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── PENDIENTES ──────────────────────────────────────────── */}
        {tab === 'pendiente' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${ORANGE}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Pendientes de Facturación — Abril 2026</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Clientes que deben facturarse esta semana para evitar churn · Total en riesgo: <strong>{fmt(totalPendiente)}</strong>
                </p>
              </div>
              <SemaforoDot tipo="pendiente" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Por Facturar</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meses Activo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Última Factura</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {PENDIENTES.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: ORANGE }}>{fmt(c.monto)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.mesesActivo >= 40 ? 'bg-green-100 text-green-700' :
                          c.mesesActivo >= 12 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {c.mesesActivo} meses
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{c.ultimaFactura}</td>
                      <td className="py-3 px-4 text-center"><SemaforoDot tipo="pendiente" /></td>
                    </tr>
                  ))}
                  <tr className="bg-orange-50/50 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: ORANGE }}>{fmt(totalPendiente)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CANCELADOS ──────────────────────────────────────────── */}
        {tab === 'cancelados' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${RED}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Cancelados — Abril 2026</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cuentas con última factura en marzo · MRR perdido: <strong>{fmt(totalCancelados)}</strong>
                </p>
              </div>
              <SemaforoDot tipo="cancelado" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">MRR Perdido</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meses Activo</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acumulado</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {CANCELADOS.sort((a, b) => b.mrr - a.mrr).map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-red-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: RED }}>{fmt(c.mrr)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.mesesActivo >= 40 ? 'bg-green-100 text-green-700' :
                          c.mesesActivo >= 12 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {c.mesesActivo} meses
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-500">{fmt(c.acumulado)}</td>
                      <td className="py-3 px-4 text-center"><SemaforoDot tipo="cancelado" /></td>
                    </tr>
                  ))}
                  <tr className="bg-red-50/50 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: RED }}>{fmt(totalCancelados)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DOWNGRADES ──────────────────────────────────────────── */}
        {tab === 'downgrades' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${AMBER}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Downgrades — Abril 2026</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Clientes con reducción de plan o cancelación parcial · Ingreso perdido: <strong>{fmt(totalDowngrades)}</strong>
                </p>
              </div>
              <SemaforoDot tipo="downgrade" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ingreso Perdido</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {DOWNGRADES.map((d, i) => <DowngradeRow key={i} d={d} />)}
                  <tr className="bg-amber-50/50 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: AMBER }}>{fmt(totalDowngrades)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-100">
              Haz clic en cada fila para ver el detalle del downgrade.
            </p>
          </div>
        )}

        {/* ── T1 2026 ─────────────────────────────────────────────── */}
        {tab === 't1' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[140px] rounded-lg border p-3" style={{ background: `${INDIGO}06`, borderColor: `${INDIGO}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pérdida Total T1 2026</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: INDIGO }}>{fmt(totalT1)}</p>
                </div>
                <div className="flex-1 min-w-[140px] rounded-lg border p-3" style={{ background: `${RED}06`, borderColor: `${RED}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Clientes Relevantes (15)</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: RED }}>{fmt(totalT1Rel)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">34.2% del total trimestral</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Los 15 clientes con mayor impacto concentran el 34.2% de toda la pérdida del trimestre.
                Distribución: enero (3 clientes GDA), febrero (4 clientes), marzo (8 clientes).
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100" style={{ background: `${INDIGO}08` }}>
                <h3 className="font-semibold text-sm text-gray-900">15 Clientes de Mayor Impacto — T1 2026</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ingreso Perdido</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {T1_CLIENTES.sort((a, b) => b.perdida - a.perdida).map((c, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 text-xs text-gray-400 font-medium">{i + 1}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                        <td className="py-3 px-4 text-right font-semibold" style={{ color: c.tipo === 'Downgrade' ? AMBER : RED }}>
                          {fmt(c.perdida)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.mes === 'Enero'   ? 'bg-blue-100 text-blue-700' :
                            c.mes === 'Febrero' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>{c.mes}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <SemaforoDot tipo={c.tipo === 'Downgrade' ? 'downgrade' : 'cancelado'} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-indigo-50/50 font-bold">
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4 text-gray-900">TOTAL RELEVANTES</td>
                      <td className="py-3 px-4 text-right" style={{ color: INDIGO }}>{fmt(totalT1Rel)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
