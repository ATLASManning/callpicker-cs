'use client'
/**
 * Gross Revenue Churn — sustituye al módulo LTV (17 sep 2026).
 *
 * Dirección: «elimina la información de LTV y construye lo nuevo». Lo que vive
 * en Facturación es ahora lo que presenta el tablero «DASHBOARD GROSS REVENUE
 * CHURN (%) - 2025 Y 2026», alimentado por el export semanal del detalle.
 *
 * ── LA DECISIÓN QUE SOSTIENE LA PANTALLA ───────────────────────────────────
 * La pérdida del mes vivo se pinta SIEMPRE en tres canastas, nunca en una:
 *
 *   · Baja verificada  — la base la da de baja. Pérdida real.
 *   · Desmentida       — el corte la marca de baja y la base dice que sigue
 *                        activa o en riesgo. 61 cuentas, $546,811.
 *   · Sin verificar    — no está en la cartera; no hay contra qué cotejarla.
 *                        1,021 filas, $1,129,219.
 *
 * El porqué está en los números: de las cuentas marcadas como baja, solo 64
 * están en la cartera y se pueden comprobar — y 61 de esas 64 siguen vivas. De
 * las 1,021 que no se pueden comprobar, todas menos una traen exactamente la
 * misma firma (MRR fin en cero, pérdida igual al MRR inicio) que las que ya se
 * desmintieron.
 *
 * De ahí se derivan tres reglas que esta pantalla no puede romper:
 *
 *   1. Toda tabla que reparta la pérdida tiene que mostrar las TRES canastas,
 *      para que sume la pérdida del mes. Una tabla que no cierra miente sin
 *      decirlo.
 *   2. Lo que no se midió se escribe «sin medir» o «sin cotejar», nunca cero y
 *      nunca igualado a otra cosa. Los meses cerrados NO tienen columna de
 *      verificado: su detalle no viene en el export.
 *   3. El GRC solo se calcula sobre el mes completo. Con un filtro puesto el
 *      denominador se encoge y el cociente deja de ser un GRC, así que la
 *      pantalla pinta «—».
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TrendingDown, TrendingUp, DollarSign, AlertTriangle, HelpCircle, ShieldCheck,
  RefreshCw, Search, Layers, CalendarRange, Users, Target,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import CustomSelect from '@/components/CustomSelect'

const AZUL = '#1B3FCC', VERDE = '#15803D', ROJO = '#B91C1C', AMBAR = '#B45309'
const GRIS = '#64748B'
/** Piso de contraste sobre blanco: #64748B da 4.76:1. Nada más claro lleva texto. */
const TENUE = '#64748B'

const f$ = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : '$' + Math.round(n).toLocaleString('es-MX')
const nf = (n: number) => n.toLocaleString('es-MX')
const fp = (n: number | null | undefined, d = 1) =>
  n === null || n === undefined ? '—' : n.toFixed(d) + '%'

/** La base guarda tokens; la pantalla no los enseña crudos. */
const ESTADO: Record<string, string> = {
  activo: 'Activo', en_riesgo: 'En riesgo', hibernacion: 'Hibernación',
  cancelado: 'Cancelado', dormida: 'Dormida',
}
const estadoTxt = (e: string | null) => (e ? ESTADO[e] ?? e.replace(/_/g, ' ') : 'sin estado')

type Mes = {
  mes: string; cerrado: boolean; origen: string
  mrrInicio: number; mrrFin: number | null
  churn: number; downgrade: number; perdida: number; perdidaGlobal: number | null
  ganado: number | null
  churnBaja: number | null; churnViva: number | null; churnSinVerificar: number | null
  cuentasViva: number | null; cuentasSinVerificar: number | null
  grcMensual: number; grcSinDesmentidas: number; grcVerificado: number | null
  grcAcumulado: number; grcAcumVerificado: number | null
}
type Grupo = {
  clave: string; n: number; mrrInicio: number; ganado: number; acumulado: number
  churn: number; downgrade: number; perdida: number
  churnBaja: number; churnViva: number; churnSinVerificar: number
  grc: number; grcVerificado: number
  fueraDeCartera?: boolean
  objetivo?: number | null; montoMaximo?: number | null
  objetivoVsReal?: number | null; cumple?: boolean | null; cumpleSiTodoFueraReal?: boolean
}
type Fila = {
  cliente: string; clasif: string | null; facturas: number; meses: number
  acumulado: number; mrrIni: number; mrrFin: number; ganado: number
  movimiento: string | null; perdida: number; fraude: number; rango: string | null
  consecutivo: string | null; asesor: string | null; cid: string | null
  estadoBase: string | null; enCartera: boolean; firma: boolean
  verificacion: 'baja' | 'sigue_viva' | 'sin_verificar' | 'na'
}
type Datos = {
  meta: {
    origen: string; mesVivo: string; filas: number; clientes: number; enCartera: number
    descuadre: number; churnBaja: number; churnViva: number; churnSinVerificar: number
    cuentasBaja: number; cuentasViva: number; cuentasSinVerificar: number
    reactivacionesHasta: string; mesesConDetalle: string[]
    sinFuente: string[]; advertencia: string
  }
  serie: Mes[]
  detallePerdida: { mes: string; filas: { movimiento: string; perdida: number; fraude: number }[] }[]
  reactivaciones: { mes: string; monto: number }[]
  alcance: {
    filas: number; clientes: number; enCartera: number
    mrrInicio: number; mrrFin: number; ganado: number; acumulado: number
    downgrade: number; churnBaja: number; churnViva: number; churnSinVerificar: number
    perdida: number; cuentasBaja: number; cuentasViva: number; cuentasSinVerificar: number
    grcMensual: number | null; grcSinDesmentidas: number | null; grcVerificado: number | null
    hayFiltro: boolean
    omitidas: { filas: number; perdida: number; conPerdida: number; sinVerificar: number }
  }
  porRango: Grupo[]; porClasif: Grupo[]; porMovimiento: Grupo[]; porAsesor: Grupo[]
  detalle: Fila[]; desmentidas: Fila[]
  opciones: { clasif: string[]; movimiento: string[]; rango: string[]; asesor: string[] }
}

type Tab = 'serie' | 'rango' | 'cortes' | 'detalle' | 'desmentidas'

export default function GrossRevenueChurnPage() {
  const [d, setD] = useState<Datos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('serie')

  const [clasif, setClasif] = useState('')
  const [mov, setMov] = useState('')
  const [rango, setRango] = useState('')
  const [asesor, setAsesor] = useState('')
  const [verif, setVerif] = useState('')
  const [cartera, setCartera] = useState(false)
  const [q, setQ] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    const p = new URLSearchParams()
    if (clasif) p.set('clasif', clasif)
    if (mov) p.set('movimiento', mov)
    if (rango) p.set('rango', rango)
    if (asesor) p.set('asesor', asesor)
    if (verif) p.set('verificacion', verif)
    if (cartera) p.set('cartera', '1')
    if (q.trim()) p.set('q', q.trim())
    try {
      const r = await fetch('/api/grc?' + p.toString())
      const j = await r.json()
      if (!r.ok || j.error) { setError(j.error ?? 'No se pudo cargar.'); setD(null) }
      else setD(j)
    } catch (e) { setError(String(e)) } finally { setCargando(false) }
  }, [clasif, mov, rango, asesor, verif, cartera, q])

  useEffect(() => { const t = setTimeout(cargar, q ? 350 : 0); return () => clearTimeout(t) }, [cargar, q])

  const a = d?.alcance
  const m = d?.meta
  const hayFiltro = !!(clasif || mov || rango || asesor || verif || cartera || q.trim())
  const vivo = d?.serie.find(x => !x.cerrado)

  /* El promedio histórico se calcula, no se escribe a mano: un literal en el
   * texto se desfasa del número de la tabla al primer export nuevo. */
  const promHist = useMemo(() => {
    const cerr = (d?.serie ?? []).filter(x => x.cerrado)
    return cerr.length ? cerr.reduce((s, x) => s + x.grcMensual, 0) / cerr.length : null
  }, [d])

  const selCls = 'cp-select w-full'

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Gross Revenue Churn"
        subtitle={m
          ? `Pérdida bruta de ingreso recurrente · mes en curso: ${m.mesVivo} · ${nf(m.clientes)} clientes`
          : 'Pérdida bruta de ingreso recurrente'}
      />

      {error && (
        <div className="rounded-xl px-4 py-3 mb-5" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
          <p className="text-sm font-semibold" style={{ color: ROJO }}>{error}</p>
          <p className="text-xs mt-1" style={{ color: '#7F1D1D' }}>
            Se alimenta de <code>data/grc-zoho.json</code>. Se regenera con el export del mes: en el tablero GRC,
            clic derecho sobre el MRR inicio del mes → «Ver datos subyacentes» → Más → Exportar Vista, y después
            {' '}<code>python scripts/gen-grc-zoho.py &lt;archivo&gt;</code>.
          </p>
        </div>
      )}

      {/* ── El aviso va arriba, no al pie: es lo que evita leer $1.7M de pérdida
             que en su única muestra verificable resultó 95% falsa. ────────── */}
      {m && vivo && m.cuentasViva > 0 && (
        <div className="rounded-xl px-4 py-3 mb-5" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <p className="text-sm font-bold mb-1" style={{ color: '#92400E' }}>
            {m.mesVivo} está en curso — la pérdida va en tres canastas y no se suma en una
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: '#92400E' }}>
            El corte marca «Churn confirmado» a todo contrato que aún no se factura. De esas cuentas solo
            <strong> {m.cuentasBaja + m.cuentasViva}</strong> están en la cartera y se pueden cotejar contra la base:
            <strong> {m.cuentasViva} siguen activas o en riesgo</strong> ({f$(m.churnViva)}). Las otras
            <strong> {nf(m.cuentasSinVerificar)}</strong> ({f$(m.churnSinVerificar)}) no se pueden verificar, y traen
            la misma firma —MRR fin en cero y pérdida exactamente igual al MRR inicio— que las que sí se desmintieron.
            {' '}El GRC publicado de {m.mesVivo} es <strong>{fp(vivo.grcMensual)}</strong>; quitando solo las
            desmentidas, <strong>{fp(vivo.grcSinDesmentidas)}</strong>; contando nada más lo cotejado,
            {' '}<strong>{fp(vivo.grcVerificado)}</strong>.
            {promHist !== null && <> Los meses cerrados promedian <strong>{fp(promHist)}</strong>.</>}
          </p>
        </div>
      )}

      {/* ── Indicadores. Las tres lecturas del GRC van juntas y del mismo
             tamaño: si una fuera más grande, sería la que se lee. ────────── */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))' }}>
        <Kpi icon={DollarSign} color={AZUL}
          label={hayFiltro ? 'MRR inicio de lo filtrado' : 'MRR inicio del mes'}
          valor={f$(a?.mrrInicio)} nota={a ? `Cierre: ${f$(a.mrrFin)}` : undefined} />
        <Kpi icon={TrendingDown} color={ROJO} label="GRC publicado"
          valor={fp(a?.grcMensual)}
          nota={a ? (a.hayFiltro ? 'No se calcula sobre una selección' : `${f$(a.perdida)} de pérdida`) : undefined} />
        <Kpi icon={AlertTriangle} color={AMBAR} label="GRC sin las desmentidas"
          valor={fp(a?.grcSinDesmentidas)}
          nota={a ? `Quitando ${f$(a.churnViva)} que la base contradice` : undefined} />
        <Kpi icon={ShieldCheck} color={VERDE} label="GRC cotejado"
          valor={fp(a?.grcVerificado)}
          nota={a ? `${f$(a.churnBaja)} de baja + ${f$(a.downgrade)} de downgrade` : undefined} />
        <Kpi icon={HelpCircle} color={GRIS} label="Sin cotejar"
          valor={f$(a?.churnSinVerificar)}
          nota={a ? `${nf(a.cuentasSinVerificar)} filas fuera de cartera` : undefined} />
        <Kpi icon={TrendingUp} color="#7C3AED" label="Ingreso ganado"
          valor={f$(a?.ganado)} nota="Upsell, reactivaciones y altas" />
      </div>

      {/* ── Filtros. Los CustomSelect llevan wrapperClassName con ancho fijo:
             como hijos directos de una fila flex, su width:100% se resuelve
             contra la fila entera y se comen el renglón. ─────────────────── */}
      <div className="flex gap-2 flex-wrap items-center mb-4">
        <div className="relative" style={{ minWidth: 230 }}>
          <Search size={14} className="absolute left-3 top-2.5" style={{ color: '#94A3B8' }} />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Cliente, CID o consecutivo…" className="w-full text-sm"
            style={{ padding: '7px 12px 7px 32px', borderRadius: 9, border: '1.5px solid #E2E8F0', color: '#0F172A', background: '#fff' }} />
        </div>
        <CustomSelect className={selCls} wrapperClassName="w-56 flex-shrink-0"
          value={verif} onChange={setVerif} placeholder="Toda verificación"
          options={[
            { value: '', label: 'Toda verificación' },
            { value: 'baja', label: 'Baja cotejada' },
            { value: 'sigue_viva', label: 'Desmentida (sigue viva)' },
            { value: 'sin_verificar', label: 'Sin cotejar' },
          ]} />
        <CustomSelect className={selCls} wrapperClassName="w-56 flex-shrink-0"
          value={clasif} onChange={setClasif} placeholder="Toda clasificación"
          options={[{ value: '', label: 'Toda clasificación' }, ...(d?.opciones.clasif ?? []).map(v => ({ value: v, label: v }))]} />
        <CustomSelect className={selCls} wrapperClassName="w-52 flex-shrink-0"
          value={mov} onChange={setMov} placeholder="Todo movimiento"
          options={[{ value: '', label: 'Todo movimiento' }, ...(d?.opciones.movimiento ?? []).map(v => ({ value: v, label: v }))]} />
        <CustomSelect className={selCls} wrapperClassName="w-52 flex-shrink-0"
          value={rango} onChange={setRango} placeholder="Todo rango"
          options={[{ value: '', label: 'Todo rango' }, ...(d?.opciones.rango ?? []).map(v => ({ value: v, label: v }))]} />
        <CustomSelect className={selCls} wrapperClassName="w-52 flex-shrink-0"
          value={asesor} onChange={setAsesor} placeholder="Todo asesor" searchable
          options={[{ value: '', label: 'Todo asesor' }, ...(d?.opciones.asesor ?? []).map(v => ({ value: v, label: v }))]} />
        <button onClick={() => setCartera(c => !c)} style={{
          padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          border: `1.5px solid ${cartera ? AZUL : '#E2E8F0'}`,
          background: cartera ? AZUL : '#fff', color: cartera ? '#fff' : '#475569',
        }}>Solo mi cartera</button>
        {hayFiltro && (
          <button onClick={() => { setClasif(''); setMov(''); setRango(''); setAsesor(''); setVerif(''); setCartera(false); setQ('') }}
            style={{ padding: '7px 12px', borderRadius: 9, fontSize: 12.5, border: '1.5px solid #E2E8F0', background: '#fff', color: ROJO, cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
        <button onClick={cargar} title="Recargar"
          style={{ padding: '7px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} style={{ color: '#475569' }} />
        </button>
      </div>

      {hayFiltro && (
        <p className="text-[11px] mb-3 leading-relaxed" style={{ color: TENUE }}>
          Con un filtro puesto los porcentajes se apagan: el GRC es pérdida sobre el MRR del mes completo, y si el
          denominador se encoge el cociente deja de significar eso. La serie mensual y los cortes tampoco cambian —
          son la foto del mes entero, y si se movieran al filtrar dejarían de poder compararse entre sí.
        </p>
      )}

      {/* ── Pestañas ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          ['serie', 'Serie mensual', CalendarRange],
          ['rango', 'Por rango y objetivo', Target],
          ['cortes', 'Cómo se reparte', Layers],
          ['detalle', `Detalle (${a ? nf(a.filas) : 0})`, Users],
          ['desmentidas', `Desmentidas (${a?.cuentasViva ?? 0})`, AlertTriangle],
        ] as const).map(([k, lbl, Icon]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10,
            border: `1.5px solid ${tab === k ? AZUL : '#E2E8F0'}`,
            background: tab === k ? AZUL : '#fff', color: tab === k ? '#fff' : '#475569',
            cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
          }}><Icon size={14} /> {lbl}</button>
        ))}
      </div>

      {cargando && !d && <p className="text-sm" style={{ color: TENUE }}>Cargando…</p>}

      {d && tab === 'serie' && (
        <div className="grid gap-4">
          <Tarjeta titulo="Gross Revenue Churn 2026"
            sub="Los meses cerrados vienen tal como los publicó Zoho: su detalle no está en el export, así que no se pueden recalcular ni cotejar contra la base. El mes en curso se calcula fila por fila. El acumulado es la suma de los porcentajes mensuales, que es como lo define el tablero.">
            <TablaSerie serie={d.serie} promHist={promHist} />
          </Tarjeta>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))' }}>
            <Tarjeta titulo="Detalle de pérdida por movimiento"
              sub="Cómo se reparte la pérdida de cada mes según lo que le pasó al contrato. Ojo: aquí el total del mes incluye churn mensual y financiero, que la serie de arriba no cuenta — por eso enero son $121,979 aquí y $94,931 allá.">
              <TablaDetallePerdida series={d.detallePerdida} meses={d.serie.map(x => x.mes)} />
            </Tarjeta>
            <Tarjeta titulo="Reactivaciones 2026"
              sub={`El export no trae columna de reactivación, así que esto no se puede continuar: lo publicado llega hasta ${d.meta.reactivacionesHasta}. Los meses siguientes no van en cero — van sin medir, que no es lo mismo.`}>
              <TablaReactivaciones filas={d.reactivaciones} meses={d.serie.map(x => x.mes)}
                hasta={d.meta.reactivacionesHasta} />
            </Tarjeta>
          </div>
        </div>
      )}

      {d && tab === 'rango' && (
        <Tarjeta titulo="GRC por rango de MRR, contra su objetivo"
          sub="Cada banda tiene su propio techo de pérdida: mientras más chica la cuenta, más tolerancia. El semáforo se evalúa sobre la pérdida cotejada, que es lo único que se sabe cierto — y avisa cuando la banda cumple hoy pero se pasaría si lo que no se pudo cotejar resultara real.">
          <TablaRango filas={d.porRango} />
        </Tarjeta>
      )}

      {d && tab === 'cortes' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))' }}>
          <Tarjeta titulo="Por clasificación de cliente" sub="AAA, AA, A, B y C.">
            <TablaGrupo filas={d.porClasif} />
          </Tarjeta>
          <Tarjeta titulo="Por movimiento del MRR" sub="Lo que le pasó al contrato este mes.">
            <TablaGrupo filas={d.porMovimiento} />
          </Tarjeta>
          <Tarjeta titulo="Por asesor"
            sub="Incluye el renglón de lo que está fuera de la cartera gestionada. Sin él la tabla cerraría en un tercio de la pérdida del mes y se leería como si fuera el total.">
            <TablaGrupo filas={d.porAsesor} />
          </Tarjeta>
        </div>
      )}

      {d && tab === 'detalle' && (
        <Tarjeta titulo="Detalle por cliente"
          sub={`Las ${nf(d.detalle.length)} de mayor pérdida del corte. Es la pregunta operativa —a quién hay que llamar—, por eso ordena por pérdida y no por antigüedad. Esto el tablero de Zoho no lo da cruzado con asesor y CID.`}>
          <TablaDetalle filas={d.detalle} omitidas={d.alcance.omitidas} total={d.alcance.perdida} />
        </Tarjeta>
      )}

      {d && tab === 'desmentidas' && (
        <Tarjeta titulo="Marcadas como baja, y la base dice que siguen vivas"
          sub={`${d.desmentidas.length} cuentas que el corte clasifica «Churn confirmado» y que siguen activas o en riesgo. Antes de reportar cualquiera como baja hay que confirmarla: el mes todavía corre.`}>
          <TablaDesmentidas filas={d.desmentidas} />
        </Tarjeta>
      )}

      {d && (
        <div className="rounded-xl px-4 py-3 mt-5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <p className="text-[11.5px] font-bold mb-1.5" style={{ color: '#334155' }}>
            Lo que este módulo NO puede decir, y por qué
          </p>
          <ul className="text-[11px] leading-relaxed" style={{ color: TENUE, paddingLeft: 16, listStyle: 'disc' }}>
            {d.meta.sinFuente.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <p className="text-[11px] mt-2 leading-relaxed" style={{ color: TENUE }}>{d.meta.advertencia}</p>
          <p className="text-[10.5px] mt-2" style={{ color: TENUE }}>
            Origen: {d.meta.origen} · {nf(d.meta.filas)} filas · {d.meta.enCartera} en cartera ·
            el mes cierra con {f$(Math.abs(d.meta.descuadre))} de descuadre.
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Piezas ───────────────────────────────────────────────────────────── */

const th: React.CSSProperties = {
  padding: '7px 9px', color: TENUE, fontWeight: 700, fontSize: 10.5,
  whiteSpace: 'nowrap', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left',
}
/* En un th sticky el borde de celda se queda atrás al hacer scroll porque
 * border-collapse lo pinta en la tabla, no en la celda. La sombra interior sí
 * viaja con la celda desplazada. */
const thSticky: React.CSSProperties = {
  ...th, position: 'sticky', top: 0, background: '#fff',
  borderBottom: 'none', boxShadow: 'inset 0 -1.5px 0 #E2E8F0',
}
const td: React.CSSProperties = { padding: '6px 9px', color: '#334155', whiteSpace: 'nowrap' }
const tdNum: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }
const filaTotal: React.CSSProperties = { borderTop: '2px solid #E2E8F0', background: '#F8FAFC' }

function Kpi({ icon: Icon, label, valor, nota, color }: {
  icon: React.ElementType; label: string; valor: string; nota?: string; color: string
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '13px 16px' }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color }} />
        <span className="text-[11px] font-semibold" style={{ color: TENUE }}>{label}</span>
      </div>
      <p className="text-xl font-extrabold tabular-nums" style={{ color, margin: 0 }}>{valor}</p>
      {nota && <p className="text-[10px] mt-0.5" style={{ color: TENUE }}>{nota}</p>}
    </div>
  )
}

function Tarjeta({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px' }}>
      <p className="text-sm font-bold" style={{ color: '#0F172A', marginBottom: 3 }}>{titulo}</p>
      {sub && <p className="text-[11.5px] leading-relaxed mb-3" style={{ color: TENUE }}>{sub}</p>}
      {children}
    </div>
  )
}

function TablaSerie({ serie, promHist }: { serie: Mes[]; promHist: number | null }) {
  const cerrados = serie.filter(m => m.cerrado)
  const tot = {
    mrr: serie.reduce((s, m) => s + m.mrrInicio, 0),
    churn: serie.reduce((s, m) => s + m.churn, 0),
    down: serie.reduce((s, m) => s + m.downgrade, 0),
    per: serie.reduce((s, m) => s + m.perdida, 0),
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
        <thead><tr>
          {['Mes', 'MRR inicio', 'Churn', 'Downgrade', 'Pérdida', 'GRC % mensual',
            'GRC % acumulado', 'GRC % cotejado', 'Origen'].map((h, i) => (
            <th key={h} style={{ ...th, textAlign: i === 0 || i === 8 ? 'left' : 'right' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {serie.map(m => (
            <tr key={m.mes} style={{
              borderBottom: '1px solid #F1F5F9', background: m.cerrado ? undefined : '#FFFBEB',
            }}>
              <td style={{ ...td, fontWeight: m.cerrado ? 600 : 800, color: '#0F172A' }}>{m.mes}</td>
              <td style={tdNum}>{f$(m.mrrInicio)}</td>
              <td style={{ ...tdNum, color: m.churn > 0 ? ROJO : TENUE }}>{f$(m.churn)}</td>
              <td style={{ ...tdNum, color: m.downgrade > 0 ? AMBAR : TENUE }}>{f$(m.downgrade)}</td>
              <td style={{ ...tdNum, fontWeight: 700 }}>{f$(m.perdida)}</td>
              <td style={{ ...tdNum, fontWeight: 800, color: m.grcMensual > 5 ? ROJO : '#334155' }}>
                {fp(m.grcMensual)}
              </td>
              <td style={{ ...tdNum, color: TENUE }}>{fp(m.grcAcumulado)}</td>
              <td style={{
                ...tdNum, fontWeight: m.grcVerificado !== null ? 800 : 400,
                color: m.grcVerificado !== null ? VERDE : TENUE,
                fontStyle: m.grcVerificado === null ? 'italic' : undefined,
              }}>
                {m.grcVerificado === null ? 'sin cotejar' : fp(m.grcVerificado)}
              </td>
              <td style={{ ...td, fontSize: 10.5, color: m.cerrado ? TENUE : AMBAR }}>
                {m.cerrado ? 'Zoho · cerrado' : `${m.origen} · en curso`}
              </td>
            </tr>
          ))}
          <tr style={filaTotal}>
            <td style={{ ...td, fontWeight: 800, color: '#0F172A' }}>Total</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(tot.mrr)}</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(tot.churn)}</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(tot.down)}</td>
            <td style={{ ...tdNum, fontWeight: 800 }}>{f$(tot.per)}</td>
            <td style={{ ...tdNum, fontWeight: 800 }}>{tot.mrr ? fp((100 * tot.per) / tot.mrr) : '—'}</td>
            <td style={tdNum} />
            <td style={{ ...tdNum, color: TENUE, fontStyle: 'italic' }}>sin cotejar</td>
            <td style={td} />
          </tr>
        </tbody>
      </table>
      <p className="text-[11px] mt-3 leading-relaxed" style={{ color: TENUE }}>
        Los {cerrados.length} meses cerrados promedian <strong>{fp(promHist)}</strong> de GRC. El porcentaje del
        renglón Total incluye el mes en curso con toda su pérdida sin cotejar, así que sirve para reconciliar con
        el tablero de Zoho, no para juzgar el año. La columna «cotejado» solo existe para el mes en curso: los
        meses cerrados no se revisaron contra la base porque su detalle no viene en el export — van sin medir, no
        en 100%.
      </p>
    </div>
  )
}

function TablaRango({ filas }: { filas: Grupo[] }) {
  const conObjetivo = filas.filter(f => f.objetivo != null)
  const enRiesgo = conObjetivo.filter(f => f.cumple && f.cumpleSiTodoFueraReal === false)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
        <thead><tr>
          {['Rango de MRR', 'Objetivo', 'MRR inicio', 'Tope de pérdida', 'Cotejada', 'Desmentida',
            'Sin cotejar', 'Holgura', 'GRC publicado', 'GRC cotejado', 'Cumple objetivo'].map((h, i) => (
            <th key={h} style={{ ...th, textAlign: i === 0 || i === 10 ? 'left' : 'right' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {filas.map(f => {
            const cotejada = f.churnBaja + f.downgrade
            const sinObj = f.objetivo == null
            const estado = sinObj ? null
              : !f.cumple ? { txt: '⛔ Se pasa', col: ROJO }
                : f.cumpleSiTodoFueraReal === false ? { txt: '✅ Cumple · en riesgo', col: AMBAR }
                  : { txt: '✅ Cumple', col: VERDE }
            return (
              <tr key={f.clave} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ ...td, fontWeight: 600, color: '#0F172A' }}>{f.clave}</td>
                <td style={{ ...tdNum, color: TENUE }}>{sinObj ? '—' : fp(f.objetivo, 2)}</td>
                <td style={tdNum}>{f$(f.mrrInicio)}</td>
                <td style={{ ...tdNum, color: TENUE }}>{f$(f.montoMaximo)}</td>
                <td style={{ ...tdNum, color: cotejada > 0 ? ROJO : TENUE }}>{f$(cotejada)}</td>
                <td style={{ ...tdNum, color: f.churnViva > 0 ? AMBAR : TENUE }}>{f$(f.churnViva)}</td>
                <td style={{ ...tdNum, color: TENUE }}>{f$(f.churnSinVerificar)}</td>
                <td style={{ ...tdNum, fontWeight: 700, color: sinObj ? TENUE : (f.cumple ? VERDE : ROJO) }}>
                  {f$(f.objetivoVsReal)}
                </td>
                <td style={{ ...tdNum, fontWeight: 700 }}>{fp(f.grc, 2)}</td>
                <td style={tdNum}>{fp(f.grcVerificado, 2)}</td>
                <td style={{ ...td, fontSize: 11, fontWeight: 700, color: estado?.col ?? TENUE }}>
                  {estado?.txt ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-[11px] mt-3 leading-relaxed" style={{ color: TENUE }}>
        El «tope de pérdida» es el MRR de la banda por su objetivo, y la «holgura» lo que queda contra la pérdida
        cotejada. Los objetivos exactos son 11.25 / 11.25 / 8.75 / 7.5 / 3.75 / 3 / 2 / 2 / 2 / 2 — el tablero los
        pinta redondeados pero los calcula así, y solo con estos cuadra el tope al centavo.
        {enRiesgo.length > 0 && (
          <> <strong style={{ color: AMBAR }}>{enRiesgo.length} de {conObjetivo.length} bandas</strong> cumplen hoy
          pero se pasarían si lo que no se pudo cotejar resultara pérdida real; van marcadas «en riesgo».</>
        )}
      </p>
    </div>
  )
}

/** Cotejada + Desmentida + Sin cotejar = Pérdida. Si faltara una, no cerraría. */
function TablaGrupo({ filas }: { filas: Grupo[] }) {
  const t = filas.reduce((s, f) => ({
    n: s.n + f.n, mrr: s.mrr + f.mrrInicio, per: s.per + f.perdida,
    cot: s.cot + f.churnBaja + f.downgrade, viva: s.viva + f.churnViva,
    sin: s.sin + f.churnSinVerificar,
  }), { n: 0, mrr: 0, per: 0, cot: 0, viva: 0, sin: 0 })
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
        <thead><tr>
          {['', 'Clientes', 'MRR inicio', 'Pérdida', 'Cotejada', 'Desmentida', 'Sin cotejar', 'GRC'].map((h, i) => (
            <th key={h} style={{ ...th, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {filas.map(f => (
            <tr key={f.clave} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{
                ...td, fontWeight: 600, color: f.fueraDeCartera ? TENUE : '#0F172A',
                fontStyle: f.fueraDeCartera ? 'italic' : undefined,
                maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{f.clave}</td>
              <td style={tdNum}>{nf(f.n)}</td>
              <td style={tdNum}>{f$(f.mrrInicio)}</td>
              <td style={{ ...tdNum, fontWeight: 700, color: f.perdida > 0 ? ROJO : TENUE }}>{f$(f.perdida)}</td>
              <td style={{ ...tdNum, color: ROJO }}>{f$(f.churnBaja + f.downgrade)}</td>
              <td style={{ ...tdNum, color: f.churnViva > 0 ? AMBAR : TENUE }}>{f$(f.churnViva)}</td>
              <td style={{ ...tdNum, color: TENUE }}>{f$(f.churnSinVerificar)}</td>
              <td style={tdNum}>{fp(f.grc)}</td>
            </tr>
          ))}
          <tr style={filaTotal}>
            <td style={{ ...td, fontWeight: 800 }}>Total</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{nf(t.n)}</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(t.mrr)}</td>
            <td style={{ ...tdNum, fontWeight: 800 }}>{f$(t.per)}</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(t.cot)}</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(t.viva)}</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(t.sin)}</td>
            <td style={{ ...tdNum, fontWeight: 800 }}>{t.mrr ? fp((100 * t.per) / t.mrr) : '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function TablaDetallePerdida({ series, meses }: { series: Datos['detallePerdida']; meses: string[] }) {
  const mapa = new Map(series.map(s => [s.mes, s.filas]))
  return (
    <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
        <thead><tr>
          {['Mes / Movimiento', 'Ingreso perdido', 'Por fraude'].map((h, i) => (
            <th key={h} style={{ ...thSticky, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {meses.map(mes => {
            const fs = mapa.get(mes)
            if (!fs) {
              return [
                <tr key={mes} style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ ...td, fontWeight: 800, color: '#0F172A' }}>{mes}</td>
                  <td style={{ ...tdNum, color: TENUE, fontStyle: 'italic' }} colSpan={2}>
                    Zoho no publicó el desglose de este mes
                  </td>
                </tr>,
              ]
            }
            /* Se devuelve un arreglo, no un fragmento: un <> dentro de un map
             * necesitaría key y no la admite sin React.Fragment. */
            return [
              <tr key={mes} style={{ background: '#F8FAFC' }}>
                <td style={{ ...td, fontWeight: 800, color: '#0F172A' }}>{mes}</td>
                <td style={{ ...tdNum, fontWeight: 700 }}>{f$(fs.reduce((a, f) => a + f.perdida, 0))}</td>
                <td style={{ ...tdNum, fontWeight: 700 }}>{f$(fs.reduce((a, f) => a + f.fraude, 0))}</td>
              </tr>,
              ...fs.map((f, i) => (
                <tr key={mes + i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ ...td, paddingLeft: 24, color: '#475569' }}>{f.movimiento}</td>
                  <td style={{ ...tdNum, color: f.perdida > 0 ? ROJO : TENUE }}>{f$(f.perdida)}</td>
                  <td style={{ ...tdNum, color: f.fraude > 0 ? AMBAR : TENUE }}>{f$(f.fraude)}</td>
                </tr>
              )),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}

function TablaReactivaciones({ filas, meses, hasta }: {
  filas: { mes: string; monto: number }[]; meses: string[]; hasta: string
}) {
  const mapa = new Map(filas.map(f => [f.mes, f.monto]))
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
      <thead><tr>
        {['Mes', 'Reactivaciones'].map((h, i) => (
          <th key={h} style={{ ...th, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {meses.map(m => {
          const v = mapa.get(m)
          return (
            <tr key={m} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ ...td, fontWeight: 600, color: '#0F172A' }}>{m}</td>
              <td style={{
                ...tdNum, fontWeight: v != null ? 700 : 400,
                color: v != null ? VERDE : TENUE, fontStyle: v == null ? 'italic' : undefined,
              }}>
                {v != null ? f$(v) : 'sin medir'}
              </td>
            </tr>
          )
        })}
        <tr style={filaTotal}>
          <td style={{ ...td, fontWeight: 800 }}>Total hasta {hasta}</td>
          <td style={{ ...tdNum, fontWeight: 800, color: VERDE }}>
            {f$(filas.reduce((s, f) => s + f.monto, 0))}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

const CHIP: Record<string, { txt: string; bg: string; col: string }> = {
  baja: { txt: 'baja cotejada', bg: '#FEE2E2', col: ROJO },
  sigue_viva: { txt: 'sigue viva', bg: '#FEF3C7', col: AMBAR },
  sin_verificar: { txt: 'sin cotejar', bg: '#E2E8F0', col: '#475569' },
  na: { txt: '—', bg: 'transparent', col: TENUE },
}

function TablaDetalle({ filas, omitidas, total }: {
  filas: Fila[]; omitidas: Datos['alcance']['omitidas']; total: number
}) {
  if (filas.length === 0) {
    return <p className="text-sm" style={{ color: TENUE }}>Ninguna fila con este filtro.</p>
  }
  return (
    <div>
      <div style={{ overflowX: 'auto', maxHeight: 620, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <thead><tr>
            {['Cliente', 'Asesor', 'Clasif.', 'Meses', 'MRR inicio', 'MRR fin',
              'Pérdida', 'Ganado', 'Movimiento', 'Verificación', 'Rango'].map((h, i) => (
              <th key={h} style={{ ...thSticky, textAlign: i >= 3 && i <= 7 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filas.map((f, i) => {
              const c = CHIP[f.verificacion]
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ ...td, fontWeight: 600, color: '#0F172A', maxWidth: 230, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.consecutivo && <span style={{ color: AZUL, fontWeight: 700, marginRight: 6 }}>{f.consecutivo}</span>}
                    {f.cliente}
                  </td>
                  <td style={{ ...td, color: f.asesor ? '#475569' : TENUE, fontStyle: f.asesor ? undefined : 'italic' }}>
                    {f.asesor ?? 'sin asesor'}
                  </td>
                  <td style={td}>{f.clasif ?? '—'}</td>
                  <td style={{ ...tdNum, fontWeight: f.meses >= 60 ? 700 : 400, color: f.meses >= 60 ? AMBAR : '#334155' }}>{f.meses}</td>
                  <td style={tdNum}>{f$(f.mrrIni)}</td>
                  <td style={tdNum}>{f$(f.mrrFin)}</td>
                  <td style={{ ...tdNum, fontWeight: 700, color: f.perdida > 0 ? ROJO : TENUE }}>{f$(f.perdida)}</td>
                  <td style={{ ...tdNum, color: f.ganado > 0 ? VERDE : TENUE }}>{f$(f.ganado)}</td>
                  <td style={{ ...td, fontSize: 10.5, color: '#475569' }}>{f.movimiento ?? '—'}</td>
                  <td style={td}>
                    {f.verificacion === 'na' ? <span style={{ color: TENUE }}>—</span> : (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 700, background: c.bg, color: c.col }}>
                        {c.txt}
                      </span>
                    )}
                  </td>
                  <td style={{ ...td, fontSize: 10.5, color: TENUE }}>{f.rango ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {omitidas.filas > 0 && (
        <p className="text-[11px] mt-3 leading-relaxed" style={{ color: TENUE }}>
          Quedan fuera <strong>{nf(omitidas.filas)} filas</strong> que suman <strong>{f$(omitidas.perdida)}</strong>
          {total > 0 && <> — el {((100 * omitidas.perdida) / total).toFixed(1)}% de la pérdida del corte</>},
          de las cuales {nf(omitidas.conPerdida)} tienen pérdida y {nf(omitidas.sinVerificar)} son de la canasta sin
          cotejar. Para verlas, filtra: la lista no se corta en silencio.
        </p>
      )}
    </div>
  )
}

function TablaDesmentidas({ filas }: { filas: Fila[] }) {
  if (filas.length === 0) return <p className="text-sm" style={{ color: TENUE }}>Ninguna con este filtro.</p>
  const viejas = filas.filter(f => f.meses >= 60)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr>
          {['#', 'Cliente', 'Asesor', 'Estado en base', 'Meses activo', 'Lo que declararía perdido'].map((h, i) => (
            <th key={h} style={{ ...th, textAlign: i > 3 ? 'right' : 'left' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={td}>{f.consecutivo ?? '—'}</td>
              <td style={{ ...td, fontWeight: 600, color: '#0F172A' }}>{f.cliente}</td>
              <td style={{ ...td, color: f.asesor ? '#475569' : TENUE, fontStyle: f.asesor ? undefined : 'italic' }}>
                {f.asesor ?? 'sin asesor'}
              </td>
              <td style={td}>
                <span style={{
                  fontSize: 10.5, padding: '2px 8px', borderRadius: 6, fontWeight: 700,
                  background: f.estadoBase === 'activo' ? '#DCFCE7' : '#FEF3C7',
                  color: f.estadoBase === 'activo' ? VERDE : AMBAR,
                }}>{estadoTxt(f.estadoBase)}</span>
              </td>
              <td style={{ ...tdNum, fontWeight: f.meses >= 60 ? 700 : 400, color: f.meses >= 60 ? AMBAR : '#334155' }}>{f.meses}</td>
              <td style={{ ...tdNum, fontWeight: 700, color: AMBAR }}>{f$(f.perdida)}</td>
            </tr>
          ))}
          <tr style={filaTotal}>
            <td style={{ ...td, fontWeight: 800, color: '#0F172A' }} colSpan={5}>Total desmentido</td>
            <td style={{ ...tdNum, fontWeight: 800, color: AMBAR }}>
              {f$(filas.reduce((s, f) => s + f.perdida, 0))}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-[11px] mt-3 leading-relaxed" style={{ color: TENUE }}>
        Las de 60 meses o más van resaltadas: <strong>{viejas.length} de {filas.length}</strong> llevan cinco años o
        más. Una cuenta con esa antigüedad no se da de baja en silencio, y su aparición aquí es la señal más clara de
        que la etiqueta del corte va adelantada al mes.
      </p>
    </div>
  )
}
