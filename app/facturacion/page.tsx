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
  RefreshCw, Search, Layers, CalendarRange, Users, Target, Columns3,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import CustomSelect from '@/components/CustomSelect'

/* Paleta sobre FONDO OSCURO. La regla es fondo oscuro -> letra clara, y al
 * reves: por eso aqui van los tonos CLAROS de cada color (#F87171 y no
 * #B91C1C). Un rojo oscuro sobre #0D1829 no se lee.
 *
 * AZUL_SOLIDO es la excepcion: se usa como RELLENO de botones y pestanas
 * activas, con letra blanca encima — ahi el que va oscuro es el fondo. */
const AZUL = '#60A5FA', VERDE = '#4ADE80', ROJO = '#F87171', AMBAR = '#FBBF24'
/* Para pintar SOBRE blanco: los botones y las pestanas son islas claras
 * dentro del fondo oscuro, y ahi el texto tiene que ir oscuro. */
const AZUL_SOLIDO = '#1B3FCC', ROJO_OSCURO = '#B91C1C'
/* Neutro para el KPI de «sin cotejar»: va en hexadecimal y no en rgba porque
 * la tarjeta arma el fondo del icono concatenando `color + '22'`, y un rgba
 * concatenado no es un color válido. */
const NEUTRO = '#94A3B8'
/* Texto sobre superficie CLARA o transparente: todo lo que vive FUERA de
 * una .cp-card —el encabezado, los avisos, las notas al pie de los
 * filtros—. Ahi el fondo de la pagina es claro y la letra va azul marino;
 * los tonos claros de arriba solo sirven dentro de las tarjetas oscuras. */
const MARINO = '#122E5E', MARINO_TENUE = '#3A5085'
const TXT_HI = 'rgba(255,255,255,0.92)'
const TXT_MID = 'rgba(255,255,255,0.72)'
/** El mas tenue que se admite sobre #0D1829. Nada por debajo lleva texto. */
const TENUE = 'rgba(255,255,255,0.48)'
const FONDO_TENUE = 'rgba(255,255,255,0.04)'

/**
 * Color semantico dentro de una .cp-card.
 *
 * globals.css fuerza a blanco `!important` todo <span> que NO declare
 * `background` en su atributo style (regla `.cp-card span:not([style*=
 * "background"])`), y lo mismo con cada <td>. Declarar el background
 * —aunque sea transparente— es la salida que el propio sistema dejo para
 * conservar un color. Sin esto, cada cifra en rojo o en verde de esta
 * pantalla se pintaria blanca y el color dejaria de decir nada.
 */
function C({ c, b, i, children }: {
  c: string; b?: boolean; i?: boolean; children: React.ReactNode
}) {
  return (
    <span style={{
      background: 'transparent', color: c,
      fontWeight: b ? 700 : undefined, fontStyle: i ? 'italic' : undefined,
    }}>{children}</span>
  )
}

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
  /* Abre en Detalle: es la primera de la fila y la pregunta operativa.
     Abrir en la cuarta pestaña obligaba a un clic para llegar al dato. */
  const [tab, setTab] = useState<Tab>('detalle')

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
      {/* Sin `dark`: el encabezado va sobre el fondo claro de la pagina. */}
      <PageHeader
        title="Gross Revenue Churn"
        subtitle={m
          ? `Pérdida bruta de ingreso recurrente · mes en curso: ${m.mesVivo} · ${nf(m.clientes)} clientes`
          : 'Pérdida bruta de ingreso recurrente'}
      />

      {error && (
        <div className="rounded-xl px-4 py-3 mb-5"
          style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
          <p className="text-sm font-semibold" style={{ color: ROJO_OSCURO }}>{error}</p>
          <p className="text-xs mt-1" style={{ color: MARINO }}>
            Se alimenta de <code>data/grc-zoho.json</code>. Se regenera con el export del mes: en el tablero GRC,
            clic derecho sobre el MRR inicio del mes → «Ver datos subyacentes» → Más → Exportar Vista, y después
            {' '}<code>python scripts/gen-grc-zoho.py &lt;archivo&gt;</code>.
          </p>
        </div>
      )}

      {/* ── El aviso va arriba, no al pie: es lo que evita leer $1.7M de pérdida
             que en su única muestra verificable resultó 95% falsa. ────────── */}
      {m && vivo && m.cuentasViva > 0 && (
        <div className="rounded-xl px-4 py-3 mb-5"
          style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <p className="text-sm font-bold mb-1" style={{ color: MARINO }}>
            {m.mesVivo} está en curso — la pérdida va en tres canastas y no se suma en una
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: MARINO }}>
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
        <Kpi icon={HelpCircle} color={NEUTRO} label="Sin cotejar"
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
          border: `1.5px solid ${cartera ? AZUL_SOLIDO : '#E2E8F0'}`,
          background: cartera ? AZUL_SOLIDO : '#fff', color: cartera ? '#fff' : '#475569',
        }}>Solo mi cartera</button>
        {hayFiltro && (
          <button onClick={() => { setClasif(''); setMov(''); setRango(''); setAsesor(''); setVerif(''); setCartera(false); setQ('') }}
            style={{ padding: '7px 12px', borderRadius: 9, fontSize: 12.5, border: '1.5px solid #E2E8F0', background: '#fff', color: ROJO_OSCURO, cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
        <button onClick={cargar} title="Recargar"
          style={{ padding: '7px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} style={{ color: '#475569' }} />
        </button>
      </div>

      {hayFiltro && (
        <p className="text-[11px] mb-3 leading-relaxed" style={{ color: MARINO_TENUE }}>
          Con un filtro puesto los porcentajes se apagan: el GRC es pérdida sobre el MRR del mes completo, y si el
          denominador se encoge el cociente deja de significar eso. La serie mensual y los cortes tampoco cambian —
          son la foto del mes entero, y si se movieran al filtrar dejarían de poder compararse entre sí.
        </p>
      )}

      {/* ── Pestañas ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          /* Orden fijado por dirección: primero el detalle, que es la pregunta
             operativa —a quién hay que llamar—, y al final la serie, que es
             contexto. Las desmentidas cierran porque son la excepción. */
          ['detalle', `Detalle (${a ? nf(a.filas) : 0})`, Users],
          ['rango', 'Por rango y objetivo', Target],
          ['cortes', 'Cómo se reparte', Layers],
          ['serie', 'Serie mensual', CalendarRange],
          ['desmentidas', `Desmentidas (${a?.cuentasViva ?? 0})`, AlertTriangle],
        ] as const).map(([k, lbl, Icon]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10,
            border: `1.5px solid ${tab === k ? AZUL_SOLIDO : '#E2E8F0'}`,
            background: tab === k ? AZUL_SOLIDO : '#fff', color: tab === k ? '#fff' : '#475569',
            boxShadow: tab === k ? '0 2px 8px rgba(27,63,204,0.30)' : '0 1px 3px rgba(0,0,0,0.20)',
            cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
          }}><Icon size={14} /> {lbl}</button>
        ))}
      </div>

      {cargando && !d && <p className="text-sm" style={{ color: MARINO_TENUE }}>Cargando…</p>}

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
        <Tarjeta titulo={`Detalle del export — las ${nf(d.detalle.length)} filas, cliente por cliente`}
          sub="Es el archivo que compartiste, completo, con sus doce columnas y con los títulos tal como vienen en él, en su mismo orden. Está ordenado por pérdida porque esa es la pregunta operativa: a quién hay que llamar. Las tres últimas columnas no vienen del export —las aporta el cruce con la cartera— y por eso van separadas al final.">
          <TablaDetalle filas={d.detalle} mes={d.meta.mesVivo} />
        </Tarjeta>
      )}

      {d && tab === 'desmentidas' && (
        <Tarjeta titulo="Marcadas como baja, y la base dice que siguen vivas"
          sub={`${d.desmentidas.length} cuentas que el corte clasifica «Churn confirmado» y que siguen activas o en riesgo. Antes de reportar cualquiera como baja hay que confirmarla: el mes todavía corre.`}>
          <TablaDesmentidas filas={d.desmentidas} />
        </Tarjeta>
      )}

      {d && (
        <div className="cp-card rounded-xl px-4 py-3 mt-5">
          <p className="text-[11.5px] font-bold mb-1.5" style={{ color: TXT_HI }}>
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
  padding: '8px 9px', color: TENUE, fontWeight: 700, fontSize: 10.5,
  whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.07)',
  textAlign: 'left', background: FONDO_TENUE,
}
/* En un th sticky el borde de celda se queda atrás al hacer scroll porque
 * border-collapse lo pinta en la tabla, no en la celda. La sombra interior sí
 * viaja con la celda desplazada. */
const thSticky: React.CSSProperties = {
  /* Opaco a proposito: el encabezado fijo tiene que tapar las filas que
     pasan por debajo, y un rgba translucido las deja ver. */
  ...th, position: 'sticky', top: 0, background: '#16233A',
  borderBottom: 'none', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.10)',
}
const td: React.CSSProperties = { padding: '7px 9px', color: TXT_MID, whiteSpace: 'nowrap' }
const tdNum: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }
const filaTotal: React.CSSProperties = {
  borderTop: '2px solid rgba(255,255,255,0.14)', background: FONDO_TENUE,
}
/** Para el menu de columnas, que es una isla clara dentro de la tarjeta. */
const botonClaro: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
  border: '1px solid #E2E8F0', background: '#fff', color: '#1B3FCC',
}
const botonChico: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.08)',
  color: TXT_MID,
}

function Kpi({ icon: Icon, label, valor, nota, color }: {
  icon: React.ElementType; label: string; valor: string; nota?: string; color: string
}) {
  return (
    <div className="cp-card" style={{ borderRadius: 14, padding: '14px 16px' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{
          background: color + '22', borderRadius: 8, padding: 5,
          display: 'inline-flex', lineHeight: 0,
        }}><Icon size={13} style={{ color }} /></span>
        <span className="text-[10.5px] font-bold uppercase"
          style={{ background: 'transparent', color: TENUE, letterSpacing: '0.05em' }}>{label}</span>
      </div>
      {/* El valor va dentro de <C>: un <p> suelto en .cp-card sale blanco. */}
      <p className="text-xl font-extrabold tabular-nums" style={{ margin: 0 }}>
        <C c={color} b>{valor}</C>
      </p>
      {nota && <p className="text-[10px] mt-1" style={{ color: TENUE }}>{nota}</p>}
    </div>
  )
}

function Tarjeta({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="cp-card" style={{ borderRadius: 14, padding: '18px 20px' }}>
      <p className="text-sm font-bold" style={{ color: TXT_HI, marginBottom: 3 }}>{titulo}</p>
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
      {/* Se quitaron «GRC % cotejado» y «Origen». La primera repetía «sin
          cotejar» en ocho de nueve renglones y su único dato vivo —el 1.4% de
          septiembre— ya está arriba como KPI y dentro del aviso ámbar. La
          segunda decía «Zoho · cerrado» ocho veces, y cuál es el mes en curso
          se ve solo: va resaltado. Ninguna de las dos servía para operar. */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr>
          {['Mes', 'MRR inicio', 'Churn', 'Downgrade', 'Pérdida', 'GRC % mensual',
            'GRC % acumulado'].map((h, i) => (
            <th key={h} style={{ ...th, fontSize: 11.5, padding: '10px 14px',
              textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {serie.map(m => (
            /* El mes vivo va con un tinte ámbar OSCURO. Con el #FFFBEB de antes
               quedaba un parche claro encima de la tabla oscura. */
            <tr key={m.mes} style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: m.cerrado ? undefined : 'rgba(251,191,36,0.09)',
            }}>
              <td style={{ ...td, padding: '9px 14px', fontWeight: m.cerrado ? 600 : 800 }}>
                <C c={TXT_HI}>{m.mes}</C>
                {!m.cerrado && (
                  <span style={{
                    background: 'rgba(251,191,36,0.20)', color: '#FCD34D', marginLeft: 8,
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                  }}>en curso</span>
                )}
              </td>
              <td style={{ ...tdNum, padding: '9px 14px' }}>{f$(m.mrrInicio)}</td>
              <td style={{ ...tdNum, padding: '9px 14px' }}><C c={m.churn > 0 ? ROJO : TENUE}>{f$(m.churn)}</C></td>
              <td style={{ ...tdNum, padding: '9px 14px' }}><C c={m.downgrade > 0 ? AMBAR : TENUE}>{f$(m.downgrade)}</C></td>
              <td style={{ ...tdNum, padding: '9px 14px', fontWeight: 700 }}>{f$(m.perdida)}</td>
              <td style={{ ...tdNum, fontWeight: 800 }}><C c={m.grcMensual > 5 ? ROJO : TXT_HI}>
                {fp(m.grcMensual)}
              </C></td>
              <td style={{ ...tdNum }}><C c={TENUE}>{fp(m.grcAcumulado)}</C></td>
            </tr>
          ))}
          <tr style={filaTotal}>
            <td style={{ ...td, fontWeight: 800 }}><C c={TXT_HI}>Total</C></td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(tot.mrr)}</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(tot.churn)}</td>
            <td style={{ ...tdNum, fontWeight: 700 }}>{f$(tot.down)}</td>
            <td style={{ ...tdNum, fontWeight: 800 }}>{f$(tot.per)}</td>
            <td style={{ ...tdNum, fontWeight: 800 }}>{tot.mrr ? fp((100 * tot.per) / tot.mrr) : '—'}</td>
            <td style={tdNum} />
          </tr>
        </tbody>
      </table>
      <p className="text-[11px] mt-3 leading-relaxed" style={{ color: TENUE }}>
        Los {cerrados.length} meses cerrados promedian <strong>{fp(promHist)}</strong> de GRC. El porcentaje del
        renglón Total incluye el mes en curso con toda su pérdida sin cotejar, así que sirve para reconciliar con
        el tablero de Zoho, no para juzgar el año. Los meses cerrados vienen tal como los publicó Zoho; el mes en
        curso —resaltado— se calcula del export, y sus tres lecturas de GRC están en los indicadores de arriba.
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
              <tr key={f.clave} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ ...td, fontWeight: 600 }}><C c={TXT_HI}>{f.clave}</C></td>
                <td style={{ ...tdNum }}><C c={TENUE}>{sinObj ? '—' : fp(f.objetivo, 2)}</C></td>
                <td style={tdNum}>{f$(f.mrrInicio)}</td>
                <td style={{ ...tdNum }}><C c={TENUE}>{f$(f.montoMaximo)}</C></td>
                <td style={{ ...tdNum }}><C c={cotejada > 0 ? ROJO : TENUE}>{f$(cotejada)}</C></td>
                <td style={{ ...tdNum }}><C c={f.churnViva > 0 ? AMBAR : TENUE}>{f$(f.churnViva)}</C></td>
                <td style={{ ...tdNum }}><C c={TENUE}>{f$(f.churnSinVerificar)}</C></td>
                <td style={{ ...tdNum, fontWeight: 700 }}><C c={sinObj ? TENUE : (f.cumple ? VERDE : ROJO)}>
                  {f$(f.objetivoVsReal)}
                </C></td>
                <td style={{ ...tdNum, fontWeight: 700 }}>{fp(f.grc, 2)}</td>
                <td style={tdNum}>{fp(f.grcVerificado, 2)}</td>
                <td style={{ ...td, fontSize: 11, fontWeight: 700 }}><C c={estado?.col ?? TENUE}>
                  {estado?.txt ?? '—'}
                </C></td>
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
          <> <C c={AMBAR} b>{enRiesgo.length} de {conObjetivo.length} bandas</C> cumplen hoy
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
            <tr key={f.clave} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{
                ...td, fontWeight: 600,
                fontStyle: f.fueraDeCartera ? 'italic' : undefined,
                maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}><C c={f.fueraDeCartera ? TENUE : TXT_HI}>{f.clave}</C></td>
              <td style={tdNum}>{nf(f.n)}</td>
              <td style={tdNum}>{f$(f.mrrInicio)}</td>
              <td style={{ ...tdNum, fontWeight: 700 }}><C c={f.perdida > 0 ? ROJO : TENUE}>{f$(f.perdida)}</C></td>
              <td style={{ ...tdNum }}><C c={ROJO}>{f$(f.churnBaja + f.downgrade)}</C></td>
              <td style={{ ...tdNum }}><C c={f.churnViva > 0 ? AMBAR : TENUE}>{f$(f.churnViva)}</C></td>
              <td style={{ ...tdNum }}><C c={TENUE}>{f$(f.churnSinVerificar)}</C></td>
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
                <tr key={mes} style={{ background: FONDO_TENUE, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ ...td, fontWeight: 800 }}><C c={TXT_HI}>{mes}</C></td>
                  <td style={{ ...tdNum, fontStyle: 'italic'  }} colSpan={2}><C c={TENUE}>
                    Zoho no publicó el desglose de este mes
                  </C></td>
                </tr>,
              ]
            }
            /* Se devuelve un arreglo, no un fragmento: un <> dentro de un map
             * necesitaría key y no la admite sin React.Fragment. */
            return [
              <tr key={mes} style={{ background: FONDO_TENUE }}>
                <td style={{ ...td, fontWeight: 800 }}><C c={TXT_HI}>{mes}</C></td>
                <td style={{ ...tdNum, fontWeight: 700 }}>{f$(fs.reduce((a, f) => a + f.perdida, 0))}</td>
                <td style={{ ...tdNum, fontWeight: 700 }}>{f$(fs.reduce((a, f) => a + f.fraude, 0))}</td>
              </tr>,
              ...fs.map((f, i) => (
                <tr key={mes + i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ ...td, paddingLeft: 24 }}><C c={TXT_MID}>{f.movimiento}</C></td>
                  <td style={{ ...tdNum }}><C c={f.perdida > 0 ? ROJO : TENUE}>{f$(f.perdida)}</C></td>
                  <td style={{ ...tdNum }}><C c={f.fraude > 0 ? AMBAR : TENUE}>{f$(f.fraude)}</C></td>
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
            <tr key={m} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ ...td, fontWeight: 600 }}><C c={TXT_HI}>{m}</C></td>
              <td style={{
                ...tdNum, fontWeight: v != null ? 700 : 400, fontStyle: v == null ? 'italic' : undefined }}><C c={v != null ? VERDE : TENUE}>
                {v != null ? f$(v) : 'sin medir'}
              </C></td>
            </tr>
          )
        })}
        <tr style={filaTotal}>
          <td style={{ ...td, fontWeight: 800 }}>Total hasta {hasta}</td>
          <td style={{ ...tdNum, fontWeight: 800 }}><C c={VERDE}>
            {f$(filas.reduce((s, f) => s + f.monto, 0))}
          </C></td>
        </tr>
      </tbody>
    </table>
  )
}

const CHIP: Record<string, { txt: string; bg: string; col: string }> = {
  /* Tinte oscuro del color + letra clara del mismo tono. Con el fondo claro
     que tenian antes, el rojo claro quedaba sobre rosa claro y no se leia. */
  baja: { txt: 'baja cotejada', bg: 'rgba(248,113,113,0.18)', col: '#FCA5A5' },
  sigue_viva: { txt: 'sigue viva', bg: 'rgba(251,191,36,0.18)', col: '#FCD34D' },
  sin_verificar: { txt: 'sin cotejar', bg: 'rgba(255,255,255,0.10)', col: TXT_MID },
  na: { txt: '—', bg: 'transparent', col: TENUE },
}

/* Las doce columnas del export, en su orden, más las tres que aporta el cruce
 * con la cartera. La pantalla pagina de 300 en 300 —3,574 renglones de golpe
 * ahogan al navegador— pero el dato está completo en el cliente y la descarga
 * se lleva todo lo filtrado. */
/* LOS TÍTULOS SON LOS DEL EXPORT, LITERALES. Dirección los fijó así y no se
 * abrevian ni se acentúan «para que se vean mejor»: quien compare esta tabla
 * contra el archivo tiene que encontrar la misma palabra, sin traducir de
 * «Pérdida real» a «Ingreso Perdido Contrato (BCY) Real» en la cabeza. Van en
 * el orden del archivo. Las tres últimas no vienen del export: las aporta el
 * cruce con la cartera y por eso van al final, después de las doce.
 *
 * Las columnas son datos y no celdas escritas a mano, porque de aquí salen
 * cuatro cosas a la vez: los encabezados, el orden, el selector de columnas y
 * las cabeceras del CSV. Con celdas fijas, agregar una columna obligaba a
 * tocar los cuatro lugares y tarde o temprano uno se quedaba atrás. */
type ColDet = {
  h: string
  k: keyof Fila
  num?: boolean
  dinero?: boolean
  cruce?: boolean
  /** Para ordenar cuando el valor de pantalla no sirve de llave. */
  llave?: (f: Fila) => number | string
  celda?: (f: Fila) => React.ReactNode
}

/** El rango es texto pero se ordena por tamaño: alfabéticamente «$10,001» cae antes que «$3,001». */
const RANGO_ORDEN = ['$1 - $300', '$301 - $500', '$501 - $1,000', '$1,001 - $3,000',
  '$3,001 - $5,000', '$5,001 - $10,000', '$10,001 - $20,000', '$20,001 - $40,000',
  '$40,001 - $80,000', '$80,001 en adelante']

const COLUMNAS: ColDet[] = [
  {
    h: 'Cliente', k: 'cliente',
    celda: f => (
      <span style={{ background: 'transparent', fontWeight: 600, color: TXT_HI }}>
        {f.consecutivo && <span style={{ background: 'transparent', color: AZUL, fontWeight: 700, marginRight: 6 }}>{f.consecutivo}</span>}
        {f.cliente}
      </span>
    ),
  },
  { h: 'clasificacion_cliente', k: 'clasif' },
  { h: 'Facturas_2026', k: 'facturas', num: true },
  {
    h: 'Meses Activo', k: 'meses', num: true,
    celda: f => (
      <span style={{ background: 'transparent', fontWeight: f.meses >= 60 ? 700 : 400, color: f.meses >= 60 ? AMBAR : TXT_MID }}>
        {f.meses}
      </span>
    ),
  },
  {
    h: 'Importe Acumulado Recurrente', k: 'acumulado', num: true, dinero: true,
    celda: f => <span style={{ background: 'transparent', fontWeight: 700, color: AZUL }}>{f$(f.acumulado)}</span>,
  },
  { h: 'MRR Inicio Contrato (BCY)', k: 'mrrIni', num: true, dinero: true },
  { h: 'MRR Fin Contrato (BCY)', k: 'mrrFin', num: true, dinero: true },
  {
    h: 'Ingreso Ganado Contrato (BCY)', k: 'ganado', num: true, dinero: true,
    celda: f => <span style={{ background: 'transparent', color: f.ganado > 0 ? VERDE : TENUE }}>{f$(f.ganado)}</span>,
  },
  {
    h: 'Movimiento MRR', k: 'movimiento',
    celda: f => <span style={{ background: 'transparent', fontSize: 10.5, color: TXT_MID }}>{f.movimiento ?? '—'}</span>,
  },
  {
    h: 'Ingreso Perdido Contrato (BCY) Real', k: 'perdida', num: true, dinero: true,
    celda: f => <span style={{ background: 'transparent', fontWeight: 700, color: f.perdida > 0 ? ROJO : TENUE }}>{f$(f.perdida)}</span>,
  },
  {
    h: 'Ingreso Perdido Contrato (BCY) Fraude-Reestructura', k: 'fraude', num: true, dinero: true,
    celda: f => <span style={{ background: 'transparent', color: f.fraude > 0 ? AMBAR : TENUE }}>{f$(f.fraude)}</span>,
  },
  {
    h: 'Rango MRR Fin Contrato', k: 'rango',
    llave: f => RANGO_ORDEN.indexOf(f.rango ?? ''),
    celda: f => <span style={{ background: 'transparent', fontSize: 10.5, color: TENUE }}>{f.rango ?? '—'}</span>,
  },
  {
    h: 'Asesor', k: 'asesor', cruce: true,
    celda: f => (
      <span style={{ background: 'transparent', color: f.asesor ? TXT_MID : TENUE, fontStyle: f.asesor ? undefined : 'italic' }}>
        {f.asesor ?? 'sin asesor'}
      </span>
    ),
  },
  {
    h: 'Estado en base', k: 'estadoBase', cruce: true,
    llave: f => (f.enCartera ? estadoTxt(f.estadoBase) : 'zz'),
    celda: f => (
      <span style={{ background: 'transparent', fontSize: 10.5, color: f.enCartera ? TXT_MID : TENUE, fontStyle: f.enCartera ? undefined : 'italic' }}>
        {f.enCartera ? estadoTxt(f.estadoBase) : 'fuera de cartera'}
      </span>
    ),
  },
  {
    h: 'Verificación', k: 'verificacion', cruce: true,
    celda: f => {
      const c = CHIP[f.verificacion]
      if (f.verificacion === 'na') return <span style={{ background: 'transparent', color: TENUE }}>—</span>
      return (
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 700, background: c.bg, color: c.col }}>
          {c.txt}
        </span>
      )
    },
  },
]

const CSV_CAB = [...COLUMNAS.map(c => c.h), 'Consecutivo', 'CID']
const LS_COLS = 'grc.detalle.columnas'

function descargaCsv(filas: Fila[], mes: string) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  /* La descarga sale del MISMO arreglo de columnas que la tabla, así que nunca
   * puede quedarse con una columna de menos. Va completa aunque en pantalla
   * haya columnas ocultas: lo que se esconde es la vista, no el dato. */
  const lineas = [CSV_CAB.join(',')]
  for (const f of filas) {
    lineas.push([...COLUMNAS.map(c => f[c.k]), f.consecutivo, f.cid].map(esc).join(','))
  }
  // BOM para que Excel abra los acentos bien en Windows.
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `GRC-detalle-${mes}-${filas.length}-filas.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

function TablaDetalle({ filas, mes }: { filas: Fila[]; mes: string }) {
  const PASO = 300
  const [visibles, setVisibles] = useState(PASO)
  const [orden, setOrden] = useState<{ h: string; desc: boolean }>({
    h: 'Ingreso Perdido Contrato (BCY) Real', desc: true,
  })
  const [ocultas, setOcultas] = useState<string[]>([])
  const [abrePicker, setAbrePicker] = useState(false)

  /* La elección de columnas es del lector, así que se recuerda. Va en un
   * efecto y no en el estado inicial para que el servidor y el cliente pinten
   * lo mismo en el primer render. */
  useEffect(() => {
    try {
      const g = window.localStorage.getItem(LS_COLS)
      if (g) setOcultas(JSON.parse(g))
    } catch { /* modo privado o almacenamiento bloqueado: se ven todas */ }
  }, [])
  const guardarOcultas = (v: string[]) => {
    setOcultas(v)
    try { window.localStorage.setItem(LS_COLS, JSON.stringify(v)) } catch { /* idem */ }
  }

  useEffect(() => { setVisibles(PASO) }, [filas, orden])

  const cols = COLUMNAS.filter(c => !ocultas.includes(c.h))

  const ordenadas = useMemo(() => {
    const col = COLUMNAS.find(c => c.h === orden.h)
    if (!col) return filas
    const llave = col.llave ?? ((f: Fila) => {
      const v = f[col.k]
      return v === null || v === undefined ? (col.num ? -Infinity : '') : (v as number | string)
    })
    const signo = orden.desc ? -1 : 1
    return [...filas].sort((a, b) => {
      const x = llave(a), y = llave(b)
      if (typeof x === 'number' && typeof y === 'number') return signo * (x - y)
      return signo * String(x).localeCompare(String(y), 'es', { sensitivity: 'base', numeric: true })
    })
  }, [filas, orden])

  if (filas.length === 0) {
    return <p className="text-sm" style={{ color: TENUE }}>Ninguna fila con este filtro.</p>
  }

  const mostradas = ordenadas.slice(0, visibles)
  const conPerdida = filas.filter(f => f.perdida > 0).length
  const clic = (h: string) =>
    setOrden(o => (o.h === h ? { h, desc: !o.desc } : { h, desc: true }))

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <p className="text-[11.5px]" style={{ color: TENUE }}>
          {nf(filas.length)} filas · {nf(conPerdida)} con pérdida ·
          {' '}{nf(filas.filter(f => f.enCartera).length)} en la cartera gestionada ·
          {' '}ordenado por <C c={TXT_HI} b>{orden.h}</C>
          {' '}{orden.desc ? 'de mayor a menor' : 'de menor a mayor'}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <div style={{ position: 'relative' }}>
            <button onClick={() => setAbrePicker(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 13px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1.5px solid ${ocultas.length ? AZUL_SOLIDO : '#E2E8F0'}`,
              background: '#fff', color: ocultas.length ? AZUL_SOLIDO : '#475569',
            }}>
              <Columns3 size={14} />
              Columnas ({cols.length} de {COLUMNAS.length})
            </button>
            {abrePicker && (
              <>
                {/* Capa para cerrar al hacer clic afuera, sin escuchar en document. */}
                <div onClick={() => setAbrePicker(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                {/* `cp-light` es la clase de escape del proyecto: sin ella,
                    globals.css fuerza a blanco el texto dentro de una
                    .cp-card y este menu queda blanco sobre blanco. El color
                    va en el contenedor y los hijos lo heredan. */}
                <div className="cp-light" style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 41,
                  color: '#0F172A',
                  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
                  boxShadow: '0 12px 28px rgba(15,23,42,.14)', padding: '12px 14px',
                  minWidth: 330, maxHeight: 420, overflowY: 'auto',
                }}>
                  <p className="text-[11px] font-bold mb-2" style={{ color: '#334155' }}>
                    Qué columnas se ven
                  </p>
                  {COLUMNAS.map(c => {
                    const visible = !ocultas.includes(c.h)
                    return (
                      <label key={c.h} className="flex items-start gap-2 py-1 cursor-pointer">
                        <input type="checkbox" checked={visible}
                          onChange={() => guardarOcultas(visible
                            ? [...ocultas, c.h]
                            : ocultas.filter(x => x !== c.h))}
                          style={{ marginTop: 2, accentColor: AZUL_SOLIDO }} />
                        <span className="text-[11.5px] leading-snug"
                          style={{ color: visible ? '#334155' : '#94A3B8' }}>
                          {c.h}
                          {c.cruce && (
                            <span style={{ color: AZUL_SOLIDO, fontSize: 10, marginLeft: 5 }}>· del cruce</span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                  <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid #E2E8F0' }}>
                    <button onClick={() => guardarOcultas([])} style={botonClaro}>Ver todas</button>
                    <button onClick={() => guardarOcultas(COLUMNAS.filter(c => c.cruce).map(c => c.h))}
                      style={botonClaro}>Solo las del export</button>
                  </div>
                  <p className="text-[10.5px] mt-2 leading-relaxed" style={{ color: '#64748B' }}>
                    Esconder una columna no la quita del dato: la descarga sale siempre completa.
                  </p>
                </div>
              </>
            )}
          </div>
          <button onClick={() => descargaCsv(ordenadas, mes)} style={{
            padding: '6px 13px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: `1.5px solid ${AZUL_SOLIDO}`, background: '#fff', color: AZUL_SOLIDO,
          }}>
            Descargar las {nf(filas.length)} filas (CSV)
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: 620, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <thead><tr>
            {cols.map((c, i) => {
              const activa = orden.h === c.h
              const primeraDelCruce = c.cruce && !cols[i - 1]?.cruce
              return (
                <th key={c.h} onClick={() => clic(c.h)} title={`Ordenar por ${c.h}`}
                  style={{
                    ...thSticky, cursor: 'pointer', userSelect: 'none',
                    textAlign: c.num ? 'right' : 'left',
                    color: activa ? AZUL : (c.cruce ? TXT_MID : TENUE),
                    borderLeft: primeraDelCruce ? '2px solid #E2E8F0' : undefined,
                  }}>
                  {c.h}
                  <span style={{ marginLeft: 4, opacity: activa ? 1 : 0.25 }}>
                    {activa ? (orden.desc ? '▼' : '▲') : '↕'}
                  </span>
                </th>
              )
            })}
          </tr></thead>
          <tbody>
            {mostradas.map((f, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {cols.map((c, j) => {
                  const primeraDelCruce = c.cruce && !cols[j - 1]?.cruce
                  return (
                    <td key={c.h} style={{
                      ...(c.num ? tdNum : td),
                      borderLeft: primeraDelCruce ? '2px solid #F1F5F9' : undefined,
                      maxWidth: c.k === 'cliente' ? 260 : undefined,
                      overflow: c.k === 'cliente' ? 'hidden' : undefined,
                      textOverflow: c.k === 'cliente' ? 'ellipsis' : undefined,
                    }}>
                      {c.celda
                        ? c.celda(f)
                        : c.dinero ? f$(f[c.k] as number)
                          : (f[c.k] === null || f[c.k] === undefined || f[c.k] === ''
                            ? <span style={{ background: 'transparent', color: TENUE }}>—</span>
                            : String(f[c.k]))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 flex-wrap mt-3">
        <p className="text-[11px]" style={{ color: TENUE }}>
          Mostrando {nf(mostradas.length)} de {nf(filas.length)}.
        </p>
        {visibles < filas.length && (
          <>
            <button onClick={() => setVisibles(v => v + PASO)} style={botonChico}>
              Ver {nf(Math.min(PASO, filas.length - visibles))} más
            </button>
            <button onClick={() => setVisibles(filas.length)} style={botonChico}>
              Ver las {nf(filas.length)}
            </button>
          </>
        )}
        {ocultas.length > 0 && (
          <p className="text-[11px]" style={{ color: AMBAR }}>
            {ocultas.length} {ocultas.length === 1 ? 'columna oculta' : 'columnas ocultas'} en la vista —
            la descarga las trae igual.
          </p>
        )}
      </div>
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
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={td}>{f.consecutivo ?? '—'}</td>
              <td style={{ ...td, fontWeight: 600 }}><C c={TXT_HI}>{f.cliente}</C></td>
              <td style={{ ...td, fontStyle: f.asesor ? undefined : 'italic'  }}><C c={f.asesor ? TXT_MID : TENUE}>
                {f.asesor ?? 'sin asesor'}
              </C></td>
              <td style={td}>
                <span style={{
                  fontSize: 10.5, padding: '2px 8px', borderRadius: 6, fontWeight: 700,
                  background: f.estadoBase === 'activo'
                    ? 'rgba(74,222,128,0.18)' : 'rgba(251,191,36,0.18)',
                  color: f.estadoBase === 'activo' ? '#86EFAC' : '#FCD34D',
                }}>{estadoTxt(f.estadoBase)}</span>
              </td>
              <td style={{ ...tdNum, fontWeight: f.meses >= 60 ? 700 : 400 }}><C c={f.meses >= 60 ? AMBAR : TXT_MID}>{f.meses}</C></td>
              <td style={{ ...tdNum, fontWeight: 700 }}><C c={AMBAR}>{f$(f.perdida)}</C></td>
            </tr>
          ))}
          <tr style={filaTotal}>
            <td style={{ ...td, fontWeight: 800 }} colSpan={5}><C c={TXT_HI}>Total desmentido</C></td>
            <td style={{ ...tdNum, fontWeight: 800 }}><C c={AMBAR}>
              {f$(filas.reduce((s, f) => s + f.perdida, 0))}
            </C></td>
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
