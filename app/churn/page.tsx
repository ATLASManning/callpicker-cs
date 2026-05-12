'use client'
import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import {
  TrendingDown, AlertTriangle, XCircle, ArrowDownRight,
  Clock, DollarSign, BarChart3, CalendarDays, ChevronDown, ChevronUp,
  Plus, Trash2, X, ChevronLeft, ChevronRight, Check, Database, FileBarChart2,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════
   TIPOS
═══════════════════════════════════════════════════════════════════════ */
type SemaforoChurn = 'cancelado' | 'pendiente' | 'downgrade'
type Tab = 'resumen' | 'pendiente' | 'cancelados' | 'downgrades' | 't1'

interface ChurnPendiente  { cliente: string; monto: number; mesesActivo: number; ultimaFactura: string }
interface ChurnCancelado  { cliente: string; mrr: number;   mesesActivo: number; acumulado: number    }
interface ChurnDowngrade  { cliente: string; perdida: number; nota: string                            }

interface ChurnReporte {
  id:          string
  periodo:     string   // "Semana 20 – Mayo 2026"
  fecha:       string   // "12/05/2026"
  notas:       string
  pendientes:  ChurnPendiente[]
  cancelados:  ChurnCancelado[]
  downgrades:  ChurnDowngrade[]
}

/* ═══════════════════════════════════════════════════════════════════════
   PALETA
═══════════════════════════════════════════════════════════════════════ */
const RED    = '#ef4444'
const ORANGE = '#f97316'
const AMBER  = '#f59e0b'
const BLUE   = '#3b82f6'
const INDIGO = '#6366f1'
const GREEN  = '#22c55e'

const SEMAFORO_MAP: Record<SemaforoChurn, { color: string; label: string; dot: string }> = {
  cancelado: { color: RED,    label: 'Cancelado',          dot: '🔴' },
  pendiente: { color: ORANGE, label: 'Pendiente Facturar', dot: '🟠' },
  downgrade: { color: AMBER,  label: 'Downgrade',          dot: '🟡' },
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE BASE — ABRIL 2026 (hardcoded, no se puede eliminar)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_ABRIL_2026: ChurnReporte = {
  id:      'abril-2026',
  periodo: 'Abril 2026',
  fecha:   '30/04/2026',
  notas:   'Análisis elaborado por el área de DATA. 8 clientes pendientes de facturar, 19 cancelaciones confirmadas y 4 downgrades con impacto en MRR.',
  pendientes: [
    { cliente: 'Diprosa',              monto: 687,     mesesActivo: 24,  ultimaFactura: '25/03/2026' },
    { cliente: 'Emporio Inmobiliario', monto: 1599,    mesesActivo: 48,  ultimaFactura: '19/03/2026' },
    { cliente: 'GLOBAL BIENES RAICES', monto: 979,     mesesActivo: 1,   ultimaFactura: '26/03/2026' },
    { cliente: 'SE DUEÑO',             monto: 1587,    mesesActivo: 43,  ultimaFactura: '25/03/2026' },
    { cliente: 'Housebook Real Estate',monto: 973.90,  mesesActivo: 28,  ultimaFactura: '16/03/2026' },
    { cliente: 'Ambientec',            monto: 986,     mesesActivo: 49,  ultimaFactura: '25/03/2026' },
    { cliente: 'jemmoma',              monto: 2634,    mesesActivo: 89,  ultimaFactura: '25/03/2026' },
    { cliente: 'Quality 360G',         monto: 489,     mesesActivo: 113, ultimaFactura: '25/03/2026' },
  ],
  cancelados: [
    { cliente: 'JAD Suministros',          mrr: 4023,    mesesActivo: 75, acumulado: 552266.81 },
    { cliente: 'ZD - Grupo RH',            mrr: 3642,    mesesActivo: 10, acumulado: 36200.98  },
    { cliente: 'Remax Lafueya',            mrr: 2597.41, mesesActivo: 73, acumulado: 179257.55 },
    { cliente: 'Filo',                     mrr: 2256,    mesesActivo: 4,  acumulado: 17474     },
    { cliente: 'TRIBECA HAIR STUDIO',      mrr: 1767,    mesesActivo: 48, acumulado: 97228     },
    { cliente: 'Hospital Merlos',          mrr: 1450,    mesesActivo: 22, acumulado: 36350     },
    { cliente: 'IT GREEN',                 mrr: 1119,    mesesActivo: 1,  acumulado: 2238      },
    { cliente: 'Valdi abogados',           mrr: 989,     mesesActivo: 25, acumulado: 25696.68  },
    { cliente: 'ROYAL HOME',               mrr: 979,     mesesActivo: 43, acumulado: 43076     },
    { cliente: 'Neek Tulum',               mrr: 500,     mesesActivo: 55, acumulado: 28000     },
    { cliente: 'Price Logistics',          mrr: 489,     mesesActivo: 20, acumulado: 10269     },
    { cliente: 'Estradata',                mrr: 489,     mesesActivo: 14, acumulado: 7335      },
    { cliente: 'Boma Coaching & Analysis', mrr: 489,     mesesActivo: 9,  acumulado: 4401      },
    { cliente: 'CITUR',                    mrr: 489,     mesesActivo: 7,  acumulado: 3912      },
    { cliente: 'Estradata MH',             mrr: 415.65,  mesesActivo: 59, acumulado: 22029.45  },
    { cliente: 'EXTIN-SON',                mrr: 359,     mesesActivo: 19, acumulado: 6428      },
    { cliente: '10 Experiences Tour',      mrr: 279,     mesesActivo: 64, acumulado: 17019     },
    { cliente: 'KINDEMEX',                 mrr: 195,     mesesActivo: 3,  acumulado: 780       },
    { cliente: 'BDM LAB',                  mrr: 169,     mesesActivo: 39, acumulado: 5971      },
  ],
  downgrades: [
    { cliente: 'Ancona Autopartes', perdida: 4583,    nota: 'Redujo plan Agente CP Chat de $17,762 a $13,919 (-$3,843). Churn de Extension CE + Extension VyC (-$11,860). Entrada de Extensión VyC min IP (+$11,120).' },
    { cliente: 'ESDIE',             perdida: 3000,    nota: 'Paquete Min Voicebot cancelado de su facturación.' },
    { cliente: 'Finsus Cobranza',   perdida: 2880,    nota: 'Extension Callcenter reducida de $8,268 a $5,388.' },
    { cliente: 'Finaura',           perdida: 2333.20, nota: 'Ofuscador $4,276→$3,000 · Paquete Min VyC $2,557→$1,794 · Paquete Campañas $984→$690. Facturación total pasa de $7,817.20 a $5,484.' },
  ],
}

/* Clientes T1 (histórico fijo) */
const T1_CLIENTES = [
  { cliente: 'GDA - Genética',          perdida: 12812,   tipo: 'Churn confirmado', mes: 'Enero'   },
  { cliente: 'GDA - Polab',             perdida: 5800,    tipo: 'Churn confirmado', mes: 'Enero'   },
  { cliente: 'GDA - Family Labs',       perdida: 4580,    tipo: 'Churn confirmado', mes: 'Enero'   },
  { cliente: 'MB Signature Properties', perdida: 9697.03, tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'Servidiesel',             perdida: 7065,    tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'Campus Residencias',      perdida: 6459,    tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'TYR International',       perdida: 3969,    tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'ZIBAHOME',                perdida: 3830,    tipo: 'Downgrade',        mes: 'Febrero' },
  { cliente: 'Velfare',                 perdida: 13780,   tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'WOLFTOWERS',              perdida: 7876,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'GTC - TLALPAN',           perdida: 6760,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'Coristylo',               perdida: 6249,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'GTC - LA JOYA',           perdida: 5986,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'GTC - CROSSING',          perdida: 4042,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'Robotix',                 perdida: 3886,    tipo: 'Churn confirmado', mes: 'Marzo'   },
]
const TOTAL_T1     = 300510
const TOTAL_T1_REL = 102791.03

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
const fmt = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

const LS_KEY = 'churn_reportes'

function loadReportes(): ChurnReporte[] {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : [] }
  catch { return [] }
}
function saveReportes(list: ChurnReporte[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function emptyPendiente(): ChurnPendiente  { return { cliente: '', monto: 0, mesesActivo: 0, ultimaFactura: '' } }
function emptyCancelado(): ChurnCancelado  { return { cliente: '', mrr: 0, mesesActivo: 0, acumulado: 0 } }
function emptyDowngrade(): ChurnDowngrade  { return { cliente: '', perdida: 0, nota: '' } }

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENTES UI REUTILIZABLES
═══════════════════════════════════════════════════════════════════════ */
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

function DowngradeRow({ d }: { d: ChurnDowngrade }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr className="border-b border-gray-100 cursor-pointer hover:bg-amber-50/40 transition-colors"
        onClick={() => setOpen(v => !v)}>
        <td className="py-3 px-4 text-sm font-medium text-gray-900">{d.cliente}</td>
        <td className="py-3 px-4 text-right font-semibold text-sm" style={{ color: AMBER }}>{fmt(d.perdida)}</td>
        <td className="py-3 px-4"><SemaforoDot tipo="downgrade" /></td>
        <td className="py-3 px-4 text-gray-400">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
      </tr>
      {open && (
        <tr className="border-b border-gray-100 bg-amber-50/30">
          <td colSpan={4} className="px-4 py-3 text-xs text-gray-600 leading-relaxed">{d.nota}</td>
        </tr>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   FORMULARIO MULTI-PASO
═══════════════════════════════════════════════════════════════════════ */
const FORM_STEPS = ['Período & Notas', 'Pendientes', 'Cancelados', 'Downgrades']

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 bg-white'
const numCls   = `${inputCls} text-right`
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1'
const addBtnCls = 'flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 mt-2'
const delBtnCls = 'text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0'

function ChurnForm({ onClose, onSave }: { onClose: () => void; onSave: (r: ChurnReporte) => void }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<ChurnReporte>({
    id: '', periodo: '', fecha: '', notas: '',
    pendientes: [emptyPendiente()],
    cancelados: [emptyCancelado()],
    downgrades: [emptyDowngrade()],
  })

  const set = <K extends keyof ChurnReporte>(k: K, v: ChurnReporte[K]) =>
    setData(d => ({ ...d, [k]: v }))

  /* pendientes */
  const setPend = (i: number, f: keyof ChurnPendiente, v: string | number) =>
    setData(d => ({ ...d, pendientes: d.pendientes.map((r, j) => j === i ? { ...r, [f]: v } : r) }))
  const addPend  = () => setData(d => ({ ...d, pendientes: [...d.pendientes, emptyPendiente()] }))
  const delPend  = (i: number) => setData(d => ({ ...d, pendientes: d.pendientes.filter((_, j) => j !== i) }))

  /* cancelados */
  const setCanc  = (i: number, f: keyof ChurnCancelado, v: string | number) =>
    setData(d => ({ ...d, cancelados: d.cancelados.map((r, j) => j === i ? { ...r, [f]: v } : r) }))
  const addCanc  = () => setData(d => ({ ...d, cancelados: [...d.cancelados, emptyCancelado()] }))
  const delCanc  = (i: number) => setData(d => ({ ...d, cancelados: d.cancelados.filter((_, j) => j !== i) }))

  /* downgrades */
  const setDown  = (i: number, f: keyof ChurnDowngrade, v: string | number) =>
    setData(d => ({ ...d, downgrades: d.downgrades.map((r, j) => j === i ? { ...r, [f]: v } : r) }))
  const addDown  = () => setData(d => ({ ...d, downgrades: [...d.downgrades, emptyDowngrade()] }))
  const delDown  = (i: number) => setData(d => ({ ...d, downgrades: d.downgrades.filter((_, j) => j !== i) }))

  const canSave = data.periodo.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    const id = data.id.trim() || data.periodo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    onSave({ ...data, id })
  }

  /* Totales del resumen */
  const totPend = data.pendientes.reduce((s, r) => s + (Number(r.monto) || 0), 0)
  const totCanc = data.cancelados.reduce((s, r) => s + (Number(r.mrr)   || 0), 0)
  const totDown = data.downgrades.reduce((s, r) => s + (Number(r.perdida) || 0), 0)

  const renderStep = () => {
    /* ── PASO 0 ───────────────────────────────────────────────────── */
    if (step === 0) return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Período <span className="text-red-400">*</span></label>
            <input value={data.periodo} onChange={e => set('periodo', e.target.value)}
              placeholder="ej. Semana 20 – Mayo 2026" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Fecha del análisis</label>
            <input value={data.fecha} onChange={e => set('fecha', e.target.value)}
              placeholder="ej. 12/05/2026" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Notas del área DATA (opcional)</label>
          <textarea value={data.notas} onChange={e => set('notas', e.target.value)}
            placeholder="Observaciones generales, contexto, decisiones a tomar..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 bg-white resize-y min-h-[90px]" />
        </div>

        {/* Resumen de lo que se va a capturar */}
        <div className="rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50/60">
          <p className="text-xs font-semibold text-gray-500 mb-3">Resumen de captura (se actualiza en cada paso)</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pendientes',  val: fmt(totPend), count: data.pendientes.filter(r => r.cliente).length, color: ORANGE },
              { label: 'Cancelados',  val: fmt(totCanc), count: data.cancelados.filter(r => r.cliente).length, color: RED    },
              { label: 'Downgrades',  val: fmt(totDown), count: data.downgrades.filter(r => r.cliente).length, color: AMBER  },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-3 bg-white border border-gray-200 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: s.color }}>{s.label}</p>
                <p className="text-base font-bold text-gray-800">{s.val}</p>
                <p className="text-[10px] text-gray-400">{s.count} clientes</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )

    /* ── PASO 1: Pendientes ───────────────────────────────────────── */
    if (step === 1) return (
      <div>
        <p className="text-xs text-gray-500 mb-3">
          Clientes pendientes de facturar · Total: <strong style={{ color: ORANGE }}>{fmt(totPend)}</strong>
        </p>
        <div className="space-y-2">
          {/* header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 px-1">
            {['Cliente', 'Monto', 'Meses activo', 'Última factura', ''].map(h => (
              <p key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</p>
            ))}
          </div>
          {data.pendientes.map((r, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
              <input value={r.cliente} onChange={e => setPend(i, 'cliente', e.target.value)}
                placeholder="Nombre del cliente" className={inputCls} />
              <input type="number" value={r.monto || ''} onChange={e => setPend(i, 'monto', parseFloat(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              <input type="number" value={r.mesesActivo || ''} onChange={e => setPend(i, 'mesesActivo', parseInt(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              <input value={r.ultimaFactura} onChange={e => setPend(i, 'ultimaFactura', e.target.value)}
                placeholder="dd/mm/aaaa" className={inputCls} />
              {data.pendientes.length > 1
                ? <button type="button" onClick={() => delPend(i)} className={delBtnCls}><Trash2 size={13} /></button>
                : <div className="w-6" />}
            </div>
          ))}
          <button type="button" onClick={addPend} className={addBtnCls}><Plus size={13} /> Agregar cliente</button>
        </div>
      </div>
    )

    /* ── PASO 2: Cancelados ───────────────────────────────────────── */
    if (step === 2) return (
      <div>
        <p className="text-xs text-gray-500 mb-3">
          Clientes cancelados · MRR perdido: <strong style={{ color: RED }}>{fmt(totCanc)}</strong>
        </p>
        <div className="space-y-2">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 px-1">
            {['Cliente', 'MRR', 'Meses activo', 'Acumulado histórico', ''].map(h => (
              <p key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</p>
            ))}
          </div>
          {data.cancelados.map((r, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
              <input value={r.cliente} onChange={e => setCanc(i, 'cliente', e.target.value)}
                placeholder="Nombre del cliente" className={inputCls} />
              <input type="number" value={r.mrr || ''} onChange={e => setCanc(i, 'mrr', parseFloat(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              <input type="number" value={r.mesesActivo || ''} onChange={e => setCanc(i, 'mesesActivo', parseInt(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              <input type="number" value={r.acumulado || ''} onChange={e => setCanc(i, 'acumulado', parseFloat(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              {data.cancelados.length > 1
                ? <button type="button" onClick={() => delCanc(i)} className={delBtnCls}><Trash2 size={13} /></button>
                : <div className="w-6" />}
            </div>
          ))}
          <button type="button" onClick={addCanc} className={addBtnCls}><Plus size={13} /> Agregar cliente</button>
        </div>
      </div>
    )

    /* ── PASO 3: Downgrades ───────────────────────────────────────── */
    if (step === 3) return (
      <div>
        <p className="text-xs text-gray-500 mb-3">
          Clientes con reducción de plan · Ingreso perdido: <strong style={{ color: AMBER }}>{fmt(totDown)}</strong>
        </p>
        <div className="space-y-3">
          {data.downgrades.map((r, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 relative">
              {data.downgrades.length > 1 && (
                <button type="button" onClick={() => delDown(i)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-400"><Trash2 size={13} /></button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cliente</label>
                  <input value={r.cliente} onChange={e => setDown(i, 'cliente', e.target.value)}
                    placeholder="Nombre del cliente" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ingreso perdido</label>
                  <input type="number" value={r.perdida || ''} onChange={e => setDown(i, 'perdida', parseFloat(e.target.value) || 0)}
                    placeholder="0" className={numCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Detalle del downgrade</label>
                <textarea value={r.nota} onChange={e => setDown(i, 'nota', e.target.value)}
                  placeholder="Describe los cambios de plan, productos cancelados, etc."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 bg-white resize-y min-h-[60px]" />
              </div>
            </div>
          ))}
          <button type="button" onClick={addDown} className={addBtnCls}><Plus size={13} /> Agregar downgrade</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${INDIGO}15` }}>
            <Database size={16} style={{ color: INDIGO }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">Nuevo Análisis DATA</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Paso {step + 1} de {FORM_STEPS.length} — <span className="font-medium text-gray-700">{FORM_STEPS[step]}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-3 pb-1">
          <div className="flex gap-1.5">
            {FORM_STEPS.map((s, i) => (
              <button key={i} type="button" onClick={() => setStep(i)}
                className="flex-1 text-center transition-all"
                title={s}>
                <div className="h-1.5 rounded-full mb-1"
                  style={{ background: i <= step ? '#1B3FCC' : '#e5e7eb' }} />
                <span className="text-[9px] font-medium"
                  style={{ color: i === step ? '#1B3FCC' : '#9ca3af' }}>
                  {s}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button type="button" disabled={step === 0}
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={16} /> Anterior
          </button>

          {step < FORM_STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: '#1B3FCC' }}>
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleSave} disabled={!canSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: canSave ? '#22c55e' : '#9ca3af' }}>
              <Check size={16} /> Guardar Análisis
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   TABS CONFIG (dinámica según reporte seleccionado)
═══════════════════════════════════════════════════════════════════════ */
function buildTabs(r: ChurnReporte): { id: Tab; label: string; color: string }[] {
  return [
    { id: 'resumen',    label: 'Resumen',                                 color: INDIGO  },
    { id: 'pendiente',  label: `🟠 Pendientes (${r.pendientes.length})`,  color: ORANGE  },
    { id: 'cancelados', label: `🔴 Cancelados (${r.cancelados.length})`,  color: RED     },
    { id: 'downgrades', label: `🟡 Downgrades (${r.downgrades.length})`,  color: AMBER   },
    { id: 't1',         label: 'Resumen T1 2026',                          color: BLUE    },
  ]
}

/* ═══════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════════════ */
export default function ChurnPage() {
  const [userReportes, setUserReportes] = useState<ChurnReporte[]>([])
  const [selectedId,   setSelectedId]   = useState<string>('abril-2026')
  const [tab,          setTab]          = useState<Tab>('resumen')
  const [showForm,     setShowForm]     = useState(false)
  const [delConfirm,   setDelConfirm]   = useState<string | null>(null)

  useEffect(() => { setUserReportes(loadReportes()) }, [])

  const allReportes: ChurnReporte[] = [REPORTE_ABRIL_2026, ...userReportes]
  const reporte = allReportes.find(r => r.id === selectedId) ?? REPORTE_ABRIL_2026

  const { pendientes, cancelados, downgrades } = reporte
  const totalPendiente  = pendientes.reduce((s, c) => s + (Number(c.monto)   || 0), 0)
  const totalCancelados = cancelados.reduce((s, c) => s + (Number(c.mrr)     || 0), 0)
  const totalDowngrades = downgrades.reduce((s, c) => s + (Number(c.perdida) || 0), 0)
  const TABS = buildTabs(reporte)

  const handleSave = (r: ChurnReporte) => {
    const id = userReportes.some(x => x.id === r.id) ? `${r.id}-${Date.now()}` : r.id
    const updated = [...userReportes, { ...r, id }]
    setUserReportes(updated)
    saveReportes(updated)
    setSelectedId(id)
    setTab('resumen')
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = userReportes.filter(r => r.id !== id)
    setUserReportes(updated)
    saveReportes(updated)
    if (selectedId === id) setSelectedId('abril-2026')
    setDelConfirm(null)
  }

  /* Cambio de período → reset tab */
  const selectReporte = (id: string) => { setSelectedId(id); setTab('resumen') }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Churn"
        subtitle="Análisis de pérdida de clientes · DATA → Dirección de Satisfacción al Cliente"
      />

      {/* ── Selector de períodos ─────────────────────────────────────── */}
      <div className="px-6 pt-4 pb-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <FileBarChart2 size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Análisis DATA</span>
            <span className="ml-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {allReportes.length}
            </span>
            <div className="ml-auto">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: '#1B3FCC' }}
              >
                <Plus size={13} /> Nuevo Análisis DATA
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-1 p-2">
            {allReportes.map(r => {
              const active   = selectedId === r.id
              const isBase   = r.id === 'abril-2026'
              const totImpact = r.pendientes.reduce((s, x) => s + (Number(x.monto) || 0), 0)
                              + r.cancelados.reduce((s, x) => s + (Number(x.mrr)   || 0), 0)
                              + r.downgrades.reduce((s, x) => s + (Number(x.perdida) || 0), 0)
              return (
                <div key={r.id} className="relative group flex-shrink-0">
                  <button
                    onClick={() => selectReporte(r.id)}
                    className="flex flex-col items-start px-4 py-2.5 rounded-lg transition-all min-w-[160px] max-w-[220px] text-left"
                    style={active
                      ? { background: '#1B3FCC10', border: '1px solid #1B3FCC40' }
                      : { border: '1px solid transparent' }
                    }
                  >
                    <p className="text-xs font-semibold text-gray-800 truncate w-full"
                      style={{ color: active ? '#1B3FCC' : undefined }}>
                      {r.periodo}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{r.fecha || '—'}</span>
                      <span className="text-[9px] font-bold text-red-500">
                        {fmt(totImpact)}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${ORANGE}18`, color: ORANGE }}>
                        {r.pendientes.length} pend.
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${RED}18`, color: RED }}>
                        {r.cancelados.length} canc.
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${AMBER}18`, color: AMBER }}>
                        {r.downgrades.length} dg.
                      </span>
                    </div>
                  </button>

                  {!isBase && (
                    <button
                      onClick={e => { e.stopPropagation(); setDelConfirm(r.id) }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-0.5 rounded"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={Clock}          label="Pendiente de Facturar"    value={fmt(totalPendiente)}
          sub={`${pendientes.length} clientes · ${reporte.periodo}`}  color={ORANGE} />
        <KpiCard icon={XCircle}        label="MRR Cancelado"            value={fmt(totalCancelados)}
          sub={`${cancelados.length} clientes · ${reporte.periodo}`}  color={RED}    />
        <KpiCard icon={ArrowDownRight} label="Ingreso Perdido Downgrade" value={fmt(totalDowngrades)}
          sub={`${downgrades.length} clientes · ${reporte.periodo}`}  color={AMBER}  />
        <KpiCard icon={TrendingDown}   label="Pérdida Total T1 2026"    value={fmt(TOTAL_T1)}
          sub="34.2% en 15 clientes clave"                              color={INDIGO} />
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto shadow-sm">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={tab === t.id ? { background: t.color, color: '#fff' } : { color: '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

        {/* ── RESUMEN ──────────────────────────────────────────────── */}
        {tab === 'resumen' && (
          <>
            {/* Notas del período */}
            {reporte.notas && (
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm flex gap-3">
                <Database size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Análisis DATA · {reporte.periodo}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{reporte.notas}</p>
                </div>
              </div>
            )}

            {/* Semáforo general */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Semáforo de Churn — {reporte.periodo}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Análisis elaborado por el área de DATA</p>
                </div>
                <SemaforoLeyenda />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${ORANGE}50`, background: `${ORANGE}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: ORANGE }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ORANGE }}>Pendiente de Facturar</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalPendiente)}</p>
                  <p className="text-xs text-gray-500 mt-1">{pendientes.length} clientes en riesgo</p>
                  <p className="text-xs mt-3 text-gray-600">Deben facturarse esta semana para evitar churn. Acción inmediata requerida.</p>
                </div>
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${RED}50`, background: `${RED}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: RED }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: RED }}>Cancelados</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalCancelados)}</p>
                  <p className="text-xs text-gray-500 mt-1">{cancelados.length} clientes</p>
                  <p className="text-xs mt-3 text-gray-600">Cuentas que cancelaron. MRR perdido. Acumulado histórico relevante.</p>
                </div>
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${AMBER}50`, background: `${AMBER}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: AMBER }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: AMBER }}>Downgrades</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalDowngrades)}</p>
                  <p className="text-xs text-gray-500 mt-1">{downgrades.length} clientes con reducción de plan</p>
                  <p className="text-xs mt-3 text-gray-600">Ingreso mensual perdido por reducción de planes o cancelación parcial de productos.</p>
                </div>
              </div>
            </div>

            {/* Impacto total */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Impacto Total — {reporte.periodo}</h3>
              <div className="space-y-3">
                {(() => {
                  const total = totalPendiente + totalCancelados + totalDowngrades || 1
                  return [
                    { label: 'MRR en riesgo (pendiente de facturar)', monto: totalPendiente,  color: ORANGE },
                    { label: 'MRR cancelado definitivo',               monto: totalCancelados, color: RED    },
                    { label: 'Ingreso perdido por downgrades',          monto: totalDowngrades, color: AMBER  },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{r.label}</span>
                        <span className="font-semibold" style={{ color: r.color }}>{fmt(r.monto)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(r.monto / total) * 100}%`, background: r.color }} />
                      </div>
                    </div>
                  ))
                })()}
                <div className="pt-2 border-t border-gray-100 flex justify-between">
                  <span className="text-sm font-semibold text-gray-800">Total impacto</span>
                  <span className="text-sm font-bold text-gray-900">{fmt(totalPendiente + totalCancelados + totalDowngrades)}</span>
                </div>
              </div>
            </div>

            {/* Contexto T1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Contexto T1 2026</h3>
              <p className="text-xs text-gray-500 mb-4">El 34.2% de la pérdida trimestral se concentró en 15 clientes clave</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3" style={{ background: `${INDIGO}06`, borderColor: `${INDIGO}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pérdida Total T1</p>
                  <p className="text-xl font-bold mt-1" style={{ color: INDIGO }}>{fmt(TOTAL_T1)}</p>
                </div>
                <div className="rounded-lg border p-3" style={{ background: `${RED}06`, borderColor: `${RED}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">15 Clientes Relevantes</p>
                  <p className="text-xl font-bold mt-1" style={{ color: RED }}>{fmt(TOTAL_T1_REL)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">34.2% del total T1</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── PENDIENTES ───────────────────────────────────────────── */}
        {tab === 'pendiente' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${ORANGE}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Pendientes de Facturación — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Total en riesgo: <strong>{fmt(totalPendiente)}</strong></p>
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
                  {pendientes.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: ORANGE }}>{fmt(Number(c.monto))}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.mesesActivo >= 40 ? 'bg-green-100 text-green-700' :
                          c.mesesActivo >= 12 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{c.mesesActivo} meses</span>
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

        {/* ── CANCELADOS ───────────────────────────────────────────── */}
        {tab === 'cancelados' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${RED}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Cancelados — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">MRR perdido: <strong>{fmt(totalCancelados)}</strong></p>
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
                  {[...cancelados].sort((a, b) => Number(b.mrr) - Number(a.mrr)).map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-red-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: RED }}>{fmt(Number(c.mrr))}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.mesesActivo >= 40 ? 'bg-green-100 text-green-700' :
                          c.mesesActivo >= 12 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{c.mesesActivo} meses</span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-500">{fmt(Number(c.acumulado))}</td>
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

        {/* ── DOWNGRADES ───────────────────────────────────────────── */}
        {tab === 'downgrades' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${AMBER}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Downgrades — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Ingreso perdido: <strong>{fmt(totalDowngrades)}</strong></p>
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
                  {downgrades.map((d, i) => <DowngradeRow key={i} d={d} />)}
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

        {/* ── T1 2026 (histórico fijo) ─────────────────────────────── */}
        {tab === 't1' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[140px] rounded-lg border p-3" style={{ background: `${INDIGO}06`, borderColor: `${INDIGO}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pérdida Total T1 2026</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: INDIGO }}>{fmt(TOTAL_T1)}</p>
                </div>
                <div className="flex-1 min-w-[140px] rounded-lg border p-3" style={{ background: `${RED}06`, borderColor: `${RED}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Clientes Relevantes (15)</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: RED }}>{fmt(TOTAL_T1_REL)}</p>
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
                    {[...T1_CLIENTES].sort((a, b) => b.perdida - a.perdida).map((c, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 text-xs text-gray-400 font-medium">{i + 1}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                        <td className="py-3 px-4 text-right font-semibold"
                          style={{ color: c.tipo === 'Downgrade' ? AMBER : RED }}>{fmt(c.perdida)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.mes === 'Enero' ? 'bg-blue-100 text-blue-700' :
                            c.mes === 'Febrero' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>{c.mes}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <SemaforoDot tipo={c.tipo === 'Downgrade' ? 'downgrade' : 'cancelado'} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-indigo-50/50 font-bold">
                      <td className="py-3 px-4" /><td className="py-3 px-4 text-gray-900">TOTAL RELEVANTES</td>
                      <td className="py-3 px-4 text-right" style={{ color: INDIGO }}>{fmt(TOTAL_T1_REL)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Modal: formulario */}
      {showForm && <ChurnForm onClose={() => setShowForm(false)} onSave={handleSave} />}

      {/* Modal: confirmar eliminación */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-2">¿Eliminar análisis?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Se eliminará del almacenamiento local del navegador. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(delConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
