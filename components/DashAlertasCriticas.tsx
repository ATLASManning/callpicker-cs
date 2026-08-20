'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ArrowUpRight, Search, X, ArrowUpDown, ChevronUp, ChevronDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import CustomSelect from '@/components/CustomSelect'

/* ── Paleta de alerta ─────────────────────────────────────────────────── */
const RED       = '#EF4444'
const RED_DEEP  = '#7F1D1D'
const RED_BG    = 'rgba(239,68,68,0.09)'
const RED_LINE  = 'rgba(239,68,68,0.30)'
const PANEL     = '#0F1620'
const TX_HI     = '#FFFFFF'
const TX_MID    = 'rgba(255,255,255,0.68)'
const TX_LOW    = 'rgba(255,255,255,0.42)'
const LINE      = 'rgba(255,255,255,0.09)'

export interface CuentaAlerta {
  id: string
  consecutivo: string
  empresa: string
  asesor: string | null
  facturacion: number
  diasSinContacto: number | null
  faltantes: string[]
}

interface Props {
  cuentas: CuentaAlerta[]
  /** Total de cuentas evaluadas, para dar proporción */
  totalCuentas: number
}

type Dim = 'campo' | 'asesor' | 'antiguedad'
type Met = 'cuentas' | 'facturacion'

const DIMS: Record<Dim, string> = {
  campo:      'Dato faltante',
  asesor:     'Asesor',
  antiguedad: 'Antigüedad sin contacto',
}
const METS: Record<Met, { label: string; money: boolean }> = {
  cuentas:     { label: 'Nº de cuentas',      money: false },
  facturacion: { label: 'Facturación en juego', money: true },
}

const fmt  = (n: number) => '$' + n.toLocaleString('es-MX', { maximumFractionDigits: 0 })
const rango = (d: number | null) =>
  d === null ? 'Sin registro' : d > 90 ? '+90 días' : d > 60 ? '61–90 días' : d > 30 ? '31–60 días' : '0–30 días'

type Col = 'empresa' | 'asesor' | 'facturacion' | 'diasSinContacto' | 'faltantes'
const COLS: { col: Col; label: string; align: 'left' | 'right' }[] = [
  { col: 'empresa',         label: 'Cuenta',            align: 'left'  },
  { col: 'asesor',          label: 'Asesor',            align: 'left'  },
  { col: 'facturacion',     label: 'Facturación',       align: 'right' },
  { col: 'diasSinContacto', label: 'Sin contacto',      align: 'right' },
  { col: 'faltantes',       label: 'Datos que faltan',  align: 'left'  },
]

export default function DashAlertasCriticas({ cuentas, totalCuentas }: Props) {
  const [dim, setDim]       = useState<Dim>('campo')
  const [met, setMet]       = useState<Met>('cuentas')
  const [fAsesor, setFAsesor] = useState('')
  const [busca, setBusca]   = useState('')
  const [orden, setOrden]   = useState<{ col: Col; dir: 'asc' | 'desc' }>({ col: 'facturacion', dir: 'desc' })

  const asesores = useMemo(() =>
    Array.from(new Set(cuentas.map(c => c.asesor).filter(Boolean))).sort() as string[], [cuentas])

  const base = useMemo(() =>
    fAsesor ? cuentas.filter(c => c.asesor === fAsesor) : cuentas, [cuentas, fAsesor])

  /* ── Datos del gráfico ── */
  const chart = useMemo(() => {
    const acc = new Map<string, { n: number; fac: number }>()
    const add = (k: string, fac: number) => {
      const cur = acc.get(k) ?? { n: 0, fac: 0 }
      cur.n += 1; cur.fac += fac
      acc.set(k, cur)
    }
    for (const c of base) {
      if (dim === 'campo') c.faltantes.forEach(f => add(f, c.facturacion))
      else if (dim === 'asesor') add(c.asesor ?? 'Sin asignar', c.facturacion)
      else add(rango(c.diasSinContacto), c.facturacion)
    }
    return Array.from(acc.entries())
      .map(([name, v]) => ({ name, value: met === 'cuentas' ? v.n : v.fac }))
      .sort((a, b) => b.value - a.value)
  }, [base, dim, met])

  /* ── Tabla ── */
  const filas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const f = q
      ? base.filter(c => norm(c.empresa).includes(norm(q)) || c.consecutivo.toLowerCase().includes(q))
      : [...base]
    const d = orden.dir === 'asc' ? 1 : -1
    return f.sort((a, b) => {
      let va: string | number | null, vb: string | number | null
      if (orden.col === 'faltantes') { va = a.faltantes.length; vb = b.faltantes.length }
      else { va = a[orden.col] as string | number | null; vb = b[orden.col] as string | number | null }
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return d * (va - vb)
      return d * String(va).localeCompare(String(vb), 'es')
    })
  }, [base, busca, orden])

  const toggle = (col: Col) => setOrden(p =>
    p.col === col ? { col, dir: p.dir === 'asc' ? 'desc' : 'asc' }
                  : { col, dir: col === 'empresa' || col === 'asesor' ? 'asc' : 'desc' })

  const sinContacto30 = base.filter(c => c.diasSinContacto === null || c.diasSinContacto > 30)
  const facEnJuego    = base.reduce((s, c) => s + c.facturacion, 0)
  const pct           = totalCuentas ? Math.round((cuentas.length / totalCuentas) * 100) : 0

  return (
    <div className="px-6 pb-5">
      <div style={{ background: PANEL, border: `2px solid ${RED}`, borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(239,68,68,0.18)' }}>

        {/* Cabecera roja */}
        <div style={{ background: RED_DEEP, padding: '14px 20px', display: 'flex',
                      alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <AlertTriangle size={19} style={{ color: '#FECACA', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: TX_HI }}>
              Alertas críticas · Información faltante y cuentas sin contacto
            </p>
            <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)', marginTop: 2 }}>
              {cuentas.length} de {totalCuentas} cuentas ({pct}%) requieren captura de datos o contacto inmediato
            </p>
          </div>
          <Link href="/cuentas" style={{ fontSize: 12, color: '#FECACA', fontWeight: 600,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            Ir a Cuentas <ArrowUpRight size={12} />
          </Link>
        </div>

        {/* KPIs de alerta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                      gap: 1, background: LINE }}>
          {[
            { v: String(sinContacto30.length), l: 'Sin contacto en +30 días', s: 'incluye las que nunca registran contacto' },
            { v: String(base.filter(c => c.faltantes.length >= 3).length), l: 'Con 3+ datos faltantes', s: 'perfil severamente incompleto' },
            { v: fmt(facEnJuego), l: 'Facturación involucrada', s: 'suma de las cuentas en alerta' },
            { v: String(base.filter(c => c.diasSinContacto === null).length), l: 'Nunca contactadas', s: 'sin un solo seguimiento' },
          ].map((k, i) => (
            <div key={i} style={{ background: PANEL, padding: '13px 18px' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: RED, lineHeight: 1.1,
                          fontVariantNumeric: 'tabular-nums' }}>{k.v}</p>
              <p style={{ fontSize: 11.5, color: TX_MID, marginTop: 3, fontWeight: 600 }}>{k.l}</p>
              <p style={{ fontSize: 10, color: TX_LOW, marginTop: 1 }}>{k.s}</p>
            </div>
          ))}
        </div>

        {/* Gráfico configurable */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                        gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_HI }}>
                {METS[met].label} por {DIMS[dim].toLowerCase()}
              </p>
              <p style={{ fontSize: 11, color: TX_LOW, marginTop: 2 }}>
                Cambia el eje y la métrica para ver dónde se concentra el problema
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 150 }}>
                <CustomSelect value={dim} onChange={v => setDim(v as Dim)}
                  options={Object.entries(DIMS).map(([k, v]) => ({ value: k, label: v }))}
                  className="cp-select text-xs" />
              </div>
              <div style={{ minWidth: 150 }}>
                <CustomSelect value={met} onChange={v => setMet(v as Met)}
                  options={Object.entries(METS).map(([k, v]) => ({ value: k, label: v.label }))}
                  className="cp-select text-xs" />
              </div>
              <div style={{ minWidth: 130 }}>
                <CustomSelect value={fAsesor} onChange={setFAsesor}
                  options={[{ value: '', label: 'Todos los asesores' }, ...asesores.map(a => ({ value: a, label: a }))]}
                  className="cp-select text-xs" />
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={Math.max(180, chart.length * 30)}>
            <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 60, left: 6, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={{ fill: TX_LOW, fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => METS[met].money ? fmt(v) : String(v)} />
              <YAxis type="category" dataKey="name" tick={{ fill: TX_MID, fontSize: 11 }}
                axisLine={false} tickLine={false} width={170} />
              <Tooltip
                formatter={(v: number) => [METS[met].money ? fmt(v) : String(v), METS[met].label]}
                contentStyle={{ background: '#111A26', border: `1px solid ${RED_LINE}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: TX_HI }} cursor={{ fill: RED_BG }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {chart.map((_, i) => <Cell key={i} fill={RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla */}
        <div style={{ borderTop: `1px solid ${LINE}` }}>
          <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: 11, color: TX_LOW }}>
              {busca ? `${filas.length} de ${base.length}` : `${base.length}`} cuentas · clic en un encabezado para ordenar
            </span>
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%',
                        transform: 'translateY(-50%)', color: TX_LOW, pointerEvents: 'none' }} />
              <input value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="Buscar cuenta o consecutivo…"
                style={{ width: '100%', fontSize: 12, padding: '6px 26px 6px 30px', borderRadius: 8,
                         border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.05)',
                         color: TX_HI, outline: 'none' }} />
              {busca && (
                <button onClick={() => setBusca('')} aria-label="Limpiar"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                           background: 'none', border: 0, cursor: 'pointer', color: TX_LOW, padding: 2, lineHeight: 0 }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 780 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: '#141D28' }}>
                  {COLS.map(({ col, label, align }) => {
                    const on = orden.col === col
                    return (
                      <th key={col} style={{ padding: 0, borderBottom: `1px solid ${LINE}` }}>
                        <button onClick={() => toggle(col)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 4,
                          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
                          padding: '9px 14px', background: on ? RED_BG : 'transparent',
                          border: 0, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.07em',
                          color: on ? '#FCA5A5' : TX_LOW, whiteSpace: 'nowrap',
                        }}>
                          {label}
                          {on ? (orden.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
                              : <ArrowUpDown size={9} style={{ opacity: 0.45 }} />}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '30px 14px', textAlign: 'center', color: TX_LOW }}>
                    Sin resultados
                  </td></tr>
                )}
                {filas.map(c => {
                  const critico = c.diasSinContacto === null || c.diasSinContacto > 60
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                      <td style={{ padding: '9px 14px' }}>
                        <Link href={`/cuentas/${c.id}`} style={{ textDecoration: 'none' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#60A5FA', marginRight: 7 }}>
                            {c.consecutivo}
                          </span>
                          <span style={{ color: TX_HI, fontWeight: 600 }}>{c.empresa}</span>
                        </Link>
                      </td>
                      <td style={{ padding: '9px 14px', color: TX_MID }}>{c.asesor ?? '—'}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', color: TX_MID,
                                   fontVariantNumeric: 'tabular-nums' }}>
                        {c.facturacion > 0 ? fmt(c.facturacion) : '—'}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700,
                                   fontVariantNumeric: 'tabular-nums',
                                   color: critico ? RED : c.diasSinContacto! > 30 ? '#FBBF24' : TX_MID }}>
                        {c.diasSinContacto === null ? 'nunca' : `${c.diasSinContacto}d`}
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {c.faltantes.map(f => (
                            <span key={f} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                    background: RED_BG, color: '#FCA5A5', border: `1px solid ${RED_LINE}`,
                                    whiteSpace: 'nowrap' }}>{f}</span>
                          ))}
                          {c.faltantes.length === 0 && <span style={{ color: TX_LOW, fontSize: 11 }}>—</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
