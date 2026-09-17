'use client'
/**
 * LTV — reconstruido sobre la nueva fuente (17 sep 2026).
 *
 * Dirección sustituyó el origen: la vista de Zoho que alimentaba este módulo
 * traía datos incorrectos. Ahora viene del detalle del tablero GRC —el desglose
 * que abre la cifra de «MRR inicio» del mes— con las doce columnas que fijó:
 *
 *   Cliente · clasificacion_cliente · Facturas_2026 · Meses Activo ·
 *   Importe Acumulado Recurrente · MRR Inicio Contrato (BCY) ·
 *   MRR Fin Contrato (BCY) · Ingreso Ganado Contrato (BCY) · Movimiento MRR ·
 *   Ingreso Perdido Contrato (BCY) Real ·
 *   Ingreso Perdido Contrato (BCY) Fraude-Reestructura · Rango MRR Fin Contrato
 *
 * ── LA DECISIÓN DE DISEÑO QUE SOSTIENE TODO ────────────────────────────────
 * La pérdida se publica PARTIDA EN DOS y nunca junta. El corte se toma con el
 * mes en curso, y el archivo marca «Churn confirmado» a todo contrato que
 * todavía no se ha facturado: las 1,085 filas así marcadas traen MRR Fin en
 * cero y pérdida exactamente igual al MRR inicio, sin una sola parcial. De
 * ésas, 61 son cuentas que siguen activas o en riesgo en la propia base —una
 * con 95 meses de antigüedad— y suman $546,811.
 *
 * Una sola cifra de pérdida convertiría este módulo en una alarma falsa de
 * medio millón. Por eso el KPI grande es la confirmada, la provisional va al
 * lado con su propio color, y hay una pestaña que las nombra una por una.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  DollarSign, TrendingUp, TrendingDown, Users, AlertTriangle,
  RefreshCw, Search, Layers, Clock, ArrowUpRight,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import CustomSelect from '@/components/CustomSelect'

type Fila = {
  cliente: string; clasif: string | null; facturas: number; meses: number
  acumulado: number; mrrIni: number; mrrFin: number; ganado: number
  movimiento: string | null; perdidaReal: number; perdidaFraude: number
  rango: string | null; consecutivo: string | null; asesor: string | null
  cid: string | null; estadoBase: string | null; enCartera: boolean; provisional: boolean
}
type Grupo = { clave: string; n: number; acumulado: number; mrrIni: number; perdida: number }
type Datos = {
  meta: { mes: string | null; origen: string; filas: number; clientes: number
    mrrInicio: number; mrrFin: number; descuadre: number; provisionales: number
    provisionalMonto: number; advertencia: string }
  alcance: { filas: number; clientes: number; enCartera: number; acumulado: number
    mrrInicio: number; mrrFin: number; ganado: number
    perdidaConfirmada: number; perdidaProvisional: number; provisionales: number
    perdidaFraude: number }
  porClasif: Grupo[]; porMovimiento: Grupo[]; porRango: Grupo[]; porAsesor: Grupo[]
  top: Fila[]; provisionales: Fila[]
  opciones: { clasif: string[]; movimiento: string[]; rango: string[]; asesor: string[] }
}

const AZUL = '#1B3FCC', VERDE = '#15803D', ROJO = '#B91C1C', AMBAR = '#B45309'
const f$ = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')
const nf = (n: number) => n.toLocaleString('es-MX')

type Tab = 'clientes' | 'cortes' | 'provisional'

export default function LTVPage() {
  const [d, setD] = useState<Datos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('clientes')

  const [clasif, setClasif] = useState('')
  const [mov, setMov] = useState('')
  const [rango, setRango] = useState('')
  const [asesor, setAsesor] = useState('')
  const [cartera, setCartera] = useState(false)
  const [q, setQ] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    const p = new URLSearchParams()
    if (clasif) p.set('clasif', clasif)
    if (mov) p.set('movimiento', mov)
    if (rango) p.set('rango', rango)
    if (asesor) p.set('asesor', asesor)
    if (cartera) p.set('cartera', '1')
    if (q.trim()) p.set('q', q.trim())
    try {
      const r = await fetch('/api/ltv?' + p.toString())
      const j = await r.json()
      if (!r.ok || j.error) { setError(j.error ?? 'No se pudo cargar.'); setD(null) }
      else setD(j)
    } catch (e) { setError(String(e)) } finally { setCargando(false) }
  }, [clasif, mov, rango, asesor, cartera, q])

  useEffect(() => { const t = setTimeout(cargar, q ? 350 : 0); return () => clearTimeout(t) }, [cargar, q])

  const a = d?.alcance
  const hayFiltro = !!(clasif || mov || rango || asesor || cartera || q.trim())

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="LTV"
        subtitle={d?.meta.mes
          ? `Valor de vida por cliente · corte de ${d.meta.mes} · ${nf(d.meta.clientes)} clientes`
          : 'Valor de vida por cliente'}
      />

      {error && (
        <div className="rounded-xl px-4 py-3 mb-5" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
          <p className="text-sm font-semibold" style={{ color: '#B91C1C' }}>{error}</p>
          <p className="text-xs mt-1" style={{ color: '#7F1D1D' }}>
            El módulo se alimenta de <code>data/ltv-zoho.json</code>. Se genera con el export del mes:
            en el tablero GRC, clic derecho sobre el MRR inicio → «Ver datos subyacentes» → Más → Exportar Vista.
          </p>
        </div>
      )}

      {/* ── El aviso del mes en curso. Va arriba y no en una nota al pie:
             es lo que evita que alguien lea medio millón de pérdida falsa. ── */}
      {d && d.alcance.provisionales > 0 && (
        <div className="rounded-xl px-4 py-3 mb-5"
          style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <p className="text-sm font-bold mb-1" style={{ color: '#92400E' }}>
            El mes está en curso: {d.alcance.provisionales} cuentas marcadas como baja siguen vivas
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>
            El corte clasifica «Churn confirmado» a todo contrato que aún no se factura este mes —MRR Fin en cero
            y pérdida exactamente igual al MRR inicio, sin una sola parcial—. De esas cuentas,
            <strong> {d.alcance.provisionales} siguen activas o en riesgo</strong> en la base del tablero y suman
            <strong> {f$(d.alcance.perdidaProvisional)}</strong>. No están sumadas a la pérdida confirmada.
            Se listan una por una en la pestaña «Por confirmar».
          </p>
        </div>
      )}

      {/* ── Indicadores ────────────────────────────────────────────── */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
        <Kpi icon={DollarSign} color={AZUL} label="Acumulado recurrente"
          valor={a ? f$(a.acumulado) : '—'} nota="Lo que han pagado en toda su vida" />
        <Kpi icon={Users} color="#0891B2" label="Clientes"
          valor={a ? nf(a.clientes) : '—'} nota={a ? `${a.enCartera} en cartera gestionada` : undefined} />
        <Kpi icon={TrendingUp} color={VERDE} label="MRR inicio del mes"
          valor={a ? f$(a.mrrInicio) : '—'} nota={a ? `Fin: ${f$(a.mrrFin)}` : undefined} />
        <Kpi icon={TrendingDown} color={ROJO} label="Pérdida confirmada"
          valor={a ? f$(a.perdidaConfirmada) : '—'} nota="Cuentas que sí se fueron" />
        <Kpi icon={Clock} color={AMBAR} label="Por confirmar"
          valor={a ? f$(a.perdidaProvisional) : '—'} nota="Aún no facturado, no es baja" />
        <Kpi icon={ArrowUpRight} color="#7C3AED" label="Ingreso ganado"
          valor={a ? f$(a.ganado) : '—'} nota="Upsell y reactivaciones" />
      </div>

      {/* ── Filtros ────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap items-center mb-4">
        <div className="relative" style={{ minWidth: 230 }}>
          <Search size={14} className="absolute left-3 top-2.5" style={{ color: '#94A3B8' }} />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Cliente, CID o consecutivo…"
            className="w-full text-sm"
            style={{ padding: '7px 12px 7px 32px', borderRadius: 9, border: '1.5px solid #E2E8F0', color: '#0F172A', background: '#fff' }} />
        </div>
        <CustomSelect value={clasif} onChange={setClasif} placeholder="Toda clasificación"
          options={[{ value: '', label: 'Toda clasificación' }, ...(d?.opciones.clasif ?? []).map(v => ({ value: v, label: v }))]} />
        <CustomSelect value={mov} onChange={setMov} placeholder="Todo movimiento"
          options={[{ value: '', label: 'Todo movimiento' }, ...(d?.opciones.movimiento ?? []).map(v => ({ value: v, label: v }))]} />
        <CustomSelect value={rango} onChange={setRango} placeholder="Todo rango"
          options={[{ value: '', label: 'Todo rango' }, ...(d?.opciones.rango ?? []).map(v => ({ value: v, label: v }))]} />
        <CustomSelect value={asesor} onChange={setAsesor} placeholder="Todo asesor"
          options={[{ value: '', label: 'Todo asesor' }, ...(d?.opciones.asesor ?? []).map(v => ({ value: v, label: v }))]} />
        <button onClick={() => setCartera(c => !c)} style={{
          padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          border: `1.5px solid ${cartera ? AZUL : '#E2E8F0'}`,
          background: cartera ? AZUL : '#fff', color: cartera ? '#fff' : '#475569',
        }}>Solo mi cartera</button>
        {hayFiltro && (
          <button onClick={() => { setClasif(''); setMov(''); setRango(''); setAsesor(''); setCartera(false); setQ('') }}
            style={{ padding: '7px 12px', borderRadius: 9, fontSize: 12.5, border: '1.5px solid #E2E8F0', background: '#fff', color: '#B91C1C', cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
        <button onClick={cargar} title="Recargar"
          style={{ padding: '7px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} style={{ color: '#475569' }} />
        </button>
      </div>

      {/* ── Pestañas ───────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([['clientes', `Clientes (${a ? nf(a.filas) : 0})`, Users],
           ['cortes', 'Cómo se reparte', Layers],
           ['provisional', `Por confirmar (${a?.provisionales ?? 0})`, Clock]] as const).map(([k, lbl, Icon]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10,
            border: `1.5px solid ${tab === k ? AZUL : '#E2E8F0'}`,
            background: tab === k ? AZUL : '#fff', color: tab === k ? '#fff' : '#475569',
            cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
          }}><Icon size={14} /> {lbl}</button>
        ))}
      </div>

      {cargando && !d && <p className="text-sm" style={{ color: '#94A3B8' }}>Cargando…</p>}

      {d && tab === 'clientes' && (
        <Tarjeta titulo="Los 100 de mayor acumulado"
          sub="Ordenados por lo que han pagado en toda su vida, que es la pregunta de LTV — no por lo que pagan este mes. Las doce columnas son las del reporte de origen.">
          <TablaClientes filas={d.top} />
        </Tarjeta>
      )}

      {d && tab === 'cortes' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))' }}>
          <Tarjeta titulo="Por clasificación de cliente" sub="AAA, AA, A, B y C.">
            <TablaGrupo filas={d.porClasif} />
          </Tarjeta>
          <Tarjeta titulo="Por movimiento del MRR"
            sub="Lo que le pasó al contrato este mes. «Churn confirmado» incluye lo que aún no se factura — ver la pestaña Por confirmar.">
            <TablaGrupo filas={d.porMovimiento} />
          </Tarjeta>
          <Tarjeta titulo="Por rango de MRR fin" sub="El tamaño con el que cierran el mes.">
            <TablaGrupo filas={d.porRango} />
          </Tarjeta>
          {d.porAsesor.length > 0 && (
            <Tarjeta titulo="Por asesor" sub="Solo las cuentas que están en la cartera gestionada.">
              <TablaGrupo filas={d.porAsesor} />
            </Tarjeta>
          )}
        </div>
      )}

      {d && tab === 'provisional' && (
        <Tarjeta titulo="Marcadas como baja, pero siguen vivas"
          sub={`${d.provisionales.length} cuentas que el corte clasifica «Churn confirmado» y que siguen activas o en riesgo en la base del tablero. Antes de reportar cualquiera como baja hay que confirmarla: el mes todavía corre.`}>
          {d.provisionales.length === 0
            ? <p className="text-sm" style={{ color: '#94A3B8' }}>Ninguna con este filtro.</p>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>
                    {['#', 'Cliente', 'Asesor', 'Estado en base', 'Meses activo', 'Lo que declararía perdido'].map((h, i) => (
                      <th key={h} style={{ ...th, textAlign: i > 3 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {d.provisionales.map((f, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={td}>{f.consecutivo ?? '—'}</td>
                        <td style={{ ...td, fontWeight: 600, color: '#0F172A' }}>{f.cliente}</td>
                        <td style={td}>{f.asesor ?? '—'}</td>
                        <td style={td}>
                          <span style={{
                            fontSize: 10.5, padding: '2px 8px', borderRadius: 6, fontWeight: 700,
                            background: f.estadoBase === 'activo' ? '#DCFCE7' : '#FEF3C7',
                            color: f.estadoBase === 'activo' ? VERDE : AMBAR,
                          }}>{f.estadoBase}</span>
                        </td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: f.meses >= 60 ? 700 : 400, color: f.meses >= 60 ? AMBAR : '#334155' }}>{f.meses}</td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: AMBAR }}>{f$(f.perdidaReal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] mt-3 leading-relaxed" style={{ color: '#64748B' }}>
                  Las de 60 meses o más van resaltadas: una cuenta con esa antigüedad no se da de baja en silencio,
                  y su aparición aquí es la señal más clara de que la etiqueta del corte va adelantada.
                </p>
              </div>
            )}
        </Tarjeta>
      )}
    </div>
  )
}

/* ── Piezas ───────────────────────────────────────────────────────────── */

const th: React.CSSProperties = {
  padding: '7px 9px', color: '#64748B', fontWeight: 700, fontSize: 10.5,
  whiteSpace: 'nowrap', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left',
}
const td: React.CSSProperties = { padding: '6px 9px', color: '#334155', whiteSpace: 'nowrap' }

function Kpi({ icon: Icon, label, valor, nota, color }: {
  icon: React.ElementType; label: string; valor: string; nota?: string; color: string
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '13px 16px' }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color }} />
        <span className="text-[11px] font-semibold" style={{ color: '#64748B' }}>{label}</span>
      </div>
      <p className="text-xl font-extrabold tabular-nums" style={{ color, margin: 0 }}>{valor}</p>
      {nota && <p className="text-[10px] mt-0.5" style={{ color: '#94A3B8' }}>{nota}</p>}
    </div>
  )
}

function Tarjeta({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px' }}>
      <p className="text-sm font-bold" style={{ color: '#0F172A', marginBottom: 3 }}>{titulo}</p>
      {sub && <p className="text-[11.5px] leading-relaxed mb-3" style={{ color: '#64748B' }}>{sub}</p>}
      {children}
    </div>
  )
}

/** Las doce columnas del reporte de origen, en su orden. */
function TablaClientes({ filas }: { filas: Fila[] }) {
  const CAB = ['Cliente', 'Clasif.', 'Facturas 2026', 'Meses activo', 'Acumulado recurrente',
    'MRR inicio', 'MRR fin', 'Ingreso ganado', 'Movimiento MRR',
    'Pérdida real', 'Fraude / reestructura', 'Rango MRR fin']
  return (
    <div style={{ overflowX: 'auto', maxHeight: 620, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
        <thead><tr>
          {CAB.map((h, i) => (
            <th key={h} style={{ ...th, textAlign: i >= 2 && i !== 8 && i !== 11 ? 'right' : 'left', position: 'sticky', top: 0, background: '#fff' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ ...td, fontWeight: 600, color: '#0F172A', maxWidth: 230, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {f.consecutivo && <span style={{ color: AZUL, fontWeight: 700, marginRight: 6 }}>{f.consecutivo}</span>}
                {f.cliente}
              </td>
              <td style={td}>{f.clasif ?? '—'}</td>
              <td style={{ ...td, textAlign: 'right' }}>{f.facturas}</td>
              <td style={{ ...td, textAlign: 'right' }}>{f.meses}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: AZUL }}>{f$(f.acumulado)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{f$(f.mrrIni)}</td>
              <td style={{ ...td, textAlign: 'right' }}>{f$(f.mrrFin)}</td>
              <td style={{ ...td, textAlign: 'right', color: f.ganado > 0 ? VERDE : '#94A3B8' }}>{f$(f.ganado)}</td>
              <td style={td}>
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 600,
                  background: f.provisional ? '#FEF3C7' : '#F1F5F9',
                  color: f.provisional ? AMBAR : '#475569',
                }}>
                  {f.movimiento ?? '—'}{f.provisional ? ' · por confirmar' : ''}
                </span>
              </td>
              <td style={{ ...td, textAlign: 'right', color: f.perdidaReal > 0 ? (f.provisional ? AMBAR : ROJO) : '#94A3B8' }}>
                {f$(f.perdidaReal)}
              </td>
              <td style={{ ...td, textAlign: 'right', color: f.perdidaFraude > 0 ? AMBAR : '#94A3B8' }}>{f$(f.perdidaFraude)}</td>
              <td style={td}>{f.rango ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TablaGrupo({ filas }: { filas: Grupo[] }) {
  const total = filas.reduce((s, f) => s + f.acumulado, 0)
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
      <thead><tr>
        {['', 'Clientes', 'Acumulado', '% del total'].map((h, i) => (
          <th key={h} style={{ ...th, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {filas.map(f => (
          <tr key={f.clave} style={{ borderBottom: '1px solid #F1F5F9' }}>
            <td style={{ ...td, fontWeight: 600, color: '#0F172A' }}>{f.clave}</td>
            <td style={{ ...td, textAlign: 'right' }}>{nf(f.n)}</td>
            <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: AZUL }}>{f$(f.acumulado)}</td>
            <td style={{ ...td, textAlign: 'right', color: '#64748B' }}>
              {total > 0 ? ((100 * f.acumulado) / total).toFixed(1) + '%' : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
