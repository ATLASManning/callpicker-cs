'use client'
import { useMemo, useState } from 'react'
import { BellRing, EyeOff } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import CustomSelect from '@/components/CustomSelect'
import type { PayloadTablero, FilaTablero } from '@/lib/alertas-tablero'

/**
 * EL DASHBOARD DEJA DE REPETIR LA LISTA Y PASA A ANALIZARLA.
 *
 * Instrucción de dirección, 8 oct 2026, con captura en la mano: *«lo que debe
 * existir en el Dashboard son gráficas del tema en cuestión, con los combos
 * que permita elegir datos para obtener data»*. Antes había aquí un
 * `PanelAlertas` que pintaba las mismas cifras y las mismas diez filas que
 * `/alertas`. Quien abría las dos pantallas veía dos veces lo mismo.
 *
 * `/alertas` contesta QUÉ CUENTA atender. Esto contesta de qué está hecha la
 * cartera, dónde está el dinero y qué nos falta para poder opinar.
 *
 * ── LAS TRES GRÁFICAS, Y POR QUÉ ESAS ────────────────────────────────────
 *
 * Las dimensiones se midieron contra producción ANTES de escribir una línea
 * de JSX (`scripts/mide-dimensiones-dashboard.py`), porque un indicador que
 * nunca cambia entrena a no mirarlo. Las tres que quedaron son las que de
 * verdad se mueven. Lo que se descartó por plano: `dueno` (vale 'asesor' en
 * las 192), `fallas` (mediana 0, p75 1) y `reuniones` (mediana 0, máx 4).
 *
 *   1 · EL CORTE ELEGIBLE — seis maneras de partir la cartera, apiladas por
 *       situación. Es el combo que pidió dirección: la misma pregunta vista
 *       por situación, por asesor, por tipo de hallazgo, por nivel de
 *       relación, por candidatura o por tamaño.
 *   2 · DE CUÁNTAS FUENTES SABEMOS — el histograma 1/8…8/8. Es literalmente
 *       «una gráfica de cuentas completas y aquellas que hagan falta
 *       información». Reparto medido: 3·5·12·63·51·41·11·6, mediana 5.
 *   3 · QUÉ FUENTE FALTA Y CUÁNTO DINERO TAPA — la mitad accionable: no dice
 *       «le faltan 4 fuentes», dice cuál y a quién pedírsela.
 *
 * ── UNA TRAMPA QUE HAY QUE CONOCER ANTES DE LEER ESTO ────────────────────
 *
 * «No la vemos» es el cubo peor medido POR DEFINICIÓN: `veredictoDe` mete ahí
 * una cuenta justamente cuando le faltan las llamadas o el consumo
 * (`alertas-veredicto.ts:412`). Que su mediana de fuentes sea la más baja no
 * es un hallazgo, es la definición. Lo que SÍ es un hecho —y por eso la
 * gráfica 1 arranca medida en dinero— es que ese cubo se lleva el 55.7% de la
 * facturación: la definición no dice nada del MRR.
 *
 * ── CONTRASTE ────────────────────────────────────────────────────────────
 *
 * Isla OSCURA sobre página clara: letra clara aquí dentro. Los catorce
 * rellenos se midieron contra el `#0F2040` real del panel y todos pasan el
 * 3:1 de objeto gráfico (el más justo es el morado de Fátima, 4.08:1). El
 * blanco al 45% que usan los paneles vecinos mide **4.31:1** sobre este fondo
 * y no se usa: aquí el tenue es 0.52. Ver [[atlas-dashboard-contrast-architecture]].
 */

const PANEL  = '#0F2040'
const BORDER = 'rgba(255,255,255,0.10)'
const TX_HI  = '#FFFFFF'
const TX_MID = 'rgba(255,255,255,0.70)'
/* 0.52 y no el 0.45 de los paneles vecinos: sobre este `#0F2040` el 45% mide
   4.31:1, por debajo del 4.5 de AA. El mínimo que pasa es 0.47; 0.52 da 5.4 y
   deja margen. Medido el 9 oct 2026. */
const TX_LOW = 'rgba(255,255,255,0.52)'

/** Todo texto de color va en un `<span>` que declara su propio `background`:
 *  `globals.css` fuerza a blanco cualquiera que no lo haga, y esto es una
 *  isla oscura. */
const C = (color: string, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ color, background: 'transparent', ...extra })

const COLOR_ASESOR: Record<string, string> = {
  'Fátima': '#A855F7', 'Dan': '#0EA5E9', 'Claudia': '#F97316',
}
const COLOR_CLASE: Record<string, string> = {
  riesgo: '#F87171', entrega: '#60A5FA', analisis: '#FBBF24',
}
const GRIS = '#64748B'
const VERDE = '#22C55E'

const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')
const miles = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `$${Math.round(n / 1000)}K` : pesos(n)

type Medida = 'cuentas' | 'mrr'
type Corte = 'situacion' | 'hallazgo' | 'asesor' | 'relacion' | 'candidatura' | 'tamano'

const CORTES: Record<Corte, { label: string; pregunta: string; particion: boolean }> = {
  situacion:   { label: 'Situación de la cuenta', particion: true,
                 pregunta: 'En qué estado está la cartera, y de quién es cada parte' },
  hallazgo:    { label: 'Tipo de hallazgo',       particion: false,
                 pregunta: 'De qué está hecho el trabajo que tiene encima el equipo' },
  asesor:      { label: 'Asesor',                 particion: true,
                 pregunta: 'Cómo se reparte la cartera entre los tres, y con qué mezcla' },
  relacion:    { label: 'Nivel de relación',      particion: true,
                 pregunta: 'Cuánta cartera tiene relación construida, y cuánta no' },
  candidatura: { label: 'Candidatura de crecimiento', particion: true,
                 pregunta: 'A qué es candidata la cartera, y qué parte no lo es a nada hoy' },
  tamano:      { label: 'Tamaño (las 25 TOP)',    particion: true,
                 pregunta: 'Si las cuentas grandes están mejor atendidas que el resto' },
}

/** Cuántas filas del corte se pintan antes de agrupar el resto.
 *  «Tipo de hallazgo» tiene 26 valores y una gráfica de 26 barras no se lee;
 *  el resto va a un cubo «otros» que SE DECLARA, nunca se tira. */
const TOPE_FILAS = 12

export default function DashAlertasGraficas({ datos }: { datos: PayloadTablero }) {
  const [medida, setMedida] = useState<Medida>('mrr')
  const [corte,  setCorte]  = useState<Corte>('situacion')
  const [quien,  setQuien]  = useState('')

  /* «sin asesor» ENTRA EN LA LISTA si existe alguna. Las series de las barras
     salen de aquí y el reparto se indexa por `f.asesor ?? 'sin asesor'`: si
     esa clave no tuviera su `<Bar>`, esas cuentas desaparecerían de la gráfica
     sin que nada fallara —el total de la cabecera seguiría cuadrando y las
     barras serían más cortas—. Hoy las 192 tienen asesor; esto es para el día
     que no. */
  const asesores = useMemo(() => {
    const vivos = Array.from(new Set(
      datos.filas.map(f => f.asesor).filter(Boolean))).sort() as string[]
    return datos.filas.some(f => !f.asesor) ? [...vivos, 'sin asesor'] : vivos
  }, [datos.filas])

  const filas = useMemo(
    () => quien ? datos.filas.filter(f => f.asesor === quien) : datos.filas,
    [datos.filas, quien])

  /* El dinero que NO se puede sumar. Diez cuentas vivas no tienen importe en
     ninguna fuente; meterlas como cero diría que no valen nada, cuando lo que
     pasa es que no lo sabemos. Se cuentan aparte y se dicen con palabras.
     Ver [[feedback-cero-sin-medicion]]. */
  const sinImporte = filas.filter(f => f.mrr === null).length
  const totalMrr   = filas.reduce((s, f) => s + (f.mrr ?? 0), 0)

  const vale = (f: FilaTablero) => medida === 'mrr' ? (f.mrr ?? 0) : 1
  const fmt  = (v: number) => medida === 'mrr' ? miles(v) : String(Math.round(v))
  const fmtLargo = (v: number) =>
    medida === 'mrr' ? pesos(v) : `${Math.round(v)} ${v === 1 ? 'cuenta' : 'cuentas'}`

  const def = CORTES[corte]

  /* ── GRÁFICA 1 · el corte elegido, apilado ───────────────────────────────
   *
   * Apilado por SITUACIÓN, que es el sujeto del módulo — salvo cuando el
   * corte YA es la situación, y entonces se apila por asesor: apilar algo
   * consigo mismo pinta una sola serie y desperdicia la dimensión. */
  const apilaPor: 'situacion' | 'asesor' = corte === 'situacion' ? 'asesor' : 'situacion'
  /* Sólo las situaciones PRESENTES. El catálogo tiene siete y hoy «En orden»
     no la tiene ninguna cuenta: pintarla daría una serie de altura cero y una
     pastilla en la leyenda prometiendo algo que no está. */
  const series = useMemo(() => {
    if (apilaPor === 'asesor') {
      return asesores.map(a => ({ k: a, label: a, color: COLOR_ASESOR[a] ?? GRIS }))
    }
    const presentes = new Set(filas.map(f => f.situacion))
    return datos.situaciones.filter(s => presentes.has(s.k))
      .map(s => ({ k: s.k as string, label: s.titulo, color: s.color }))
  }, [apilaPor, asesores, filas, datos.situaciones])

  const g1 = useMemo(() => {
    /* Cada fila del corte, con su reparto por serie. Una cuenta puede caer en
       VARIAS filas cuando el corte es por hallazgo —tiene ocho de media—, y
       por eso ese corte no es una partición y se declara como tal. */
    const cubo = new Map<string, { label: string; color: string; total: number; por: Record<string, number> }>()
    const mete = (clave: string, label: string, color: string, f: FilaTablero) => {
      let e = cubo.get(clave)
      if (!e) { e = { label, color, total: 0, por: {} }; cubo.set(clave, e) }
      const serie = apilaPor === 'asesor' ? (f.asesor ?? 'sin asesor') : f.situacion
      e.total += vale(f)
      e.por[serie] = (e.por[serie] ?? 0) + vale(f)
    }

    for (const f of filas) {
      if (corte === 'situacion') {
        const s = datos.situaciones.find(x => x.k === f.situacion)
        mete(f.situacion, s?.titulo ?? f.situacion, s?.color ?? GRIS, f)
      } else if (corte === 'asesor') {
        const a = f.asesor ?? 'sin asesor'
        mete(a, a, COLOR_ASESOR[a] ?? GRIS, f)
      } else if (corte === 'relacion') {
        mete(f.relacionNivel, f.relacionNivel, GRIS, f)
      } else if (corte === 'candidatura') {
        /* El `null` NO se tira: «hoy no es candidata a nada» es la respuesta
           de 106 de las 192 y es la fila más grande del corte. */
        const k = f.candidatura ?? 'Hoy no es candidata a nada'
        mete(k, k, f.candidatura ? VERDE : GRIS, f)
      } else if (corte === 'tamano') {
        mete(f.esTop ? 'top' : 'resto',
             f.esTop ? 'Las 25 más grandes' : 'El resto de la cartera',
             f.esTop ? '#EAB308' : GRIS, f)
      } else {
        for (const i of new Set(f.hallazgos)) {
          const h = datos.catalogo[i]
          if (h) mete(h.titulo, h.titulo, COLOR_CLASE[h.clase] ?? GRIS, f)
        }
      }
    }

    const todas = Array.from(cubo.values()).sort((a, b) => b.total - a.total)
    if (corte === 'situacion') {
      /* La situación se lee en el orden del catálogo —de peor a mejor—, no
         por tamaño: es un semáforo y un semáforo tiene su orden. */
      const pos = new Map(datos.situaciones.map((s, i) => [s.titulo, i]))
      todas.sort((a, b) => (pos.get(a.label) ?? 99) - (pos.get(b.label) ?? 99))
    }

    if (todas.length <= TOPE_FILAS) return { filas: todas, otros: null as null | { n: number; total: number } }

    /* TOPE + CUBO «OTROS», nunca un top-N a secas: tirar la cola miente sin
       decirlo. Ver [[feedback-tablas-deben-cerrar]]. */
    const visibles = todas.slice(0, TOPE_FILAS)
    const cola = todas.slice(TOPE_FILAS)
    const otros = {
      label: `Otros ${cola.length} tipos`, color: GRIS,
      total: cola.reduce((s, x) => s + x.total, 0),
      por: cola.reduce<Record<string, number>>((acc, x) => {
        for (const [k, v] of Object.entries(x.por)) acc[k] = (acc[k] ?? 0) + v
        return acc
      }, {}),
    }
    return { filas: [...visibles, otros], otros: { n: cola.length, total: otros.total } }
  }, [filas, corte, medida, apilaPor, datos.situaciones, datos.catalogo, asesores])

  /* El assert de cierre, para los cortes que SÍ son partición: la suma de los
     cubos tiene que ser el total. Si no cuadra se dice en pantalla, porque un
     descuadre silencioso es peor que ninguna gráfica. */
  const sumaG1 = g1.filas.reduce((s, f) => s + f.total, 0)
  const totalG1 = medida === 'mrr' ? totalMrr : filas.length
  const descuadre = def.particion && Math.abs(sumaG1 - totalG1) > 0.5
    ? `los cubos suman ${fmt(sumaG1)} y la cartera filtrada mide ${fmt(totalG1)}`
    : null

  const datosG1 = g1.filas.map(f => ({ name: f.label, ...f.por }))

  /* ── GRÁFICA 2 · de cuántas fuentes sabemos ──────────────────────────── */
  const g2 = useMemo(() => {
    const cubos = Array.from({ length: 9 }, (_, n) => ({
      n, cuentas: 0, valor: 0, por: {} as Record<string, number>,
    }))
    for (const f of filas) {
      const c = cubos[f.nFuentes]
      if (!c) continue
      c.cuentas += 1
      c.valor += vale(f)
      const a = f.asesor ?? 'sin asesor'
      c.por[a] = (c.por[a] ?? 0) + vale(f)
    }
    /* Los cubos vacíos de los extremos se quitan: hoy ninguna cuenta llega a
       0/8, y una columna de altura cero sólo añade ruido. Se quitan sólo de
       los BORDES — un hueco en medio sí se pinta, porque es información. */
    let i = 0, j = cubos.length - 1
    while (i < j && cubos[i].cuentas === 0) i++
    while (j > i && cubos[j].cuentas === 0) j--
    return cubos.slice(i, j + 1)
  }, [filas, medida, asesores])

  const medianaFuentes = useMemo(() => {
    if (!filas.length) return null
    const xs = filas.map(f => f.nFuentes).sort((a, b) => a - b)
    const m = Math.floor(xs.length / 2)
    return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2
  }, [filas])

  const datosG2 = g2.map(c => ({ name: `${c.n}/8`, ...c.por }))

  /* ── GRÁFICA 3 · qué fuente falta y cuánto dinero tapa ───────────────── */
  const g3 = useMemo(() => datos.fuentes.map((fu, i) => {
    let con = 0, sin = 0, dineroSin = 0, nSin = 0, nSinImporte = 0
    for (const f of filas) {
      if (f.fuentes[i]) { con += vale(f); continue }
      sin += vale(f)
      nSin += 1
      /* El dinero tapado NO suma las cuentas sin importe como cero. Se vio
         mirando la pantalla servida: la fila de «Facturación» decía «10 sin
         dato · $0», y leído así parece que ese hueco no esconde nada — cuando
         es justo el único hueco cuyo dinero no se puede conocer. Se cuentan
         aparte y la fila lo dice. */
      if (f.mrr === null) nSinImporte += 1
      else dineroSin += f.mrr
    }
    return { ...fu, con, sin, dineroSin, nSin, nSinImporte }
  }).sort((a, b) => b.dineroSin - a.dineroSin), [filas, medida, datos.fuentes])

  const tooltip = {
    contentStyle: { background: '#0A1628', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 },
    labelStyle: { color: TX_HI, fontWeight: 700 },
    itemStyle: { color: TX_HI },
    cursor: { fill: 'rgba(255,255,255,0.05)' },
  }

  return (
    <div className="px-6 pb-5">
      <div className="rounded-2xl p-5" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>

        {/* ── Cabecera + los tres combos ──────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                      gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div className="flex items-center gap-2">
              <BellRing size={13} style={{ color: '#F87171' }} />
              <h3 className="text-xs font-bold uppercase tracking-[0.10em]" style={C(TX_HI)}>
                Alertas de Cliente · análisis de la cartera
              </h3>
            </div>
            <p style={C(TX_LOW, { fontSize: 11, marginTop: 3 })}>
              {def.pregunta}. {quien ? `Cartera de ${quien}: ` : 'Cartera completa: '}
              <span style={C(TX_MID, { fontWeight: 600 })}>
                {filas.length} {filas.length === 1 ? 'cuenta' : 'cuentas'} · {pesos(totalMrr)} al mes
              </span>
              {sinImporte > 0 && (
                <span style={C('#FBBF24')}>
                  {' '}· {sinImporte} sin importe en ninguna fuente, fuera de esa suma
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 210 }}>
              <CustomSelect value={corte} onChange={v => setCorte(v as Corte)}
                options={(Object.keys(CORTES) as Corte[]).map(k => ({ value: k, label: CORTES[k].label }))}
                className="cp-select text-xs" />
            </div>
            <div style={{ minWidth: 150 }}>
              <CustomSelect value={medida} onChange={v => setMedida(v as Medida)}
                options={[{ value: 'mrr', label: 'Medir en dinero' },
                          { value: 'cuentas', label: 'Medir en cuentas' }]}
                className="cp-select text-xs" />
            </div>
            <div style={{ minWidth: 140 }}>
              <CustomSelect value={quien} onChange={setQuien}
                options={[{ value: '', label: 'Toda la cartera' },
                          ...asesores.map(a => ({ value: a, label: a }))]}
                className="cp-select text-xs" />
            </div>
          </div>
        </div>

        {datos.falla && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: 10, padding: '9px 13px', marginBottom: 14 }}>
            <span style={C('#FCA5A5', { fontSize: 11.5 })}>
              Una fuente no cargó, y eso cambia lo que se puede afirmar: {datos.falla}
            </span>
          </div>
        )}

        {/* ══ 1 · EL CORTE ELEGIDO ════════════════════════════════════════ */}
        <Titulo texto={def.label} nota={
          apilaPor === 'asesor' ? 'cada barra, repartida entre los tres asesores'
                                : 'cada barra, repartida por la situación de sus cuentas'} />

        {!def.particion && (
          <p style={C('#FBBF24', { fontSize: 10.5, marginBottom: 8, lineHeight: 1.5 })}>
            Una cuenta tiene {(datos.catalogo.length ? (filas.reduce((s, f) => s + new Set(f.hallazgos).size, 0) / Math.max(filas.length, 1)) : 0).toFixed(1)} hallazgos
            de media, así que aparece en varias barras. Esta columna NO suma la cartera: no es un reparto, es un recuento por tipo.
          </p>
        )}
        {descuadre && (
          <p style={C('#FCA5A5', { fontSize: 10.5, marginBottom: 8 })}>
            Los cubos no cierran — {descuadre}. No te fíes de esta gráfica hasta que cuadre.
          </p>
        )}

        <ResponsiveContainer width="100%" height={Math.max(150, datosG1.length * 30)}>
          <BarChart data={datosG1} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.52)', fontSize: 10 }}
              axisLine={false} tickLine={false} tickFormatter={fmt} />
            <YAxis type="category" dataKey="name" width={165}
              tick={{ fill: TX_MID, fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v: string) => v.length > 24 ? v.slice(0, 24) + '…' : v} />
            <Tooltip {...tooltip} formatter={(v: number, n: string) => [fmtLargo(v), n]} />
            {series.map((s, i) => (
              <Bar key={s.k} dataKey={s.k} name={s.label} stackId="a" fill={s.color}
                radius={i === series.length - 1 ? [0, 4, 4, 0] : undefined} maxBarSize={22} />
            ))}
          </BarChart>
        </ResponsiveContainer>

        <Leyenda items={series} />

        {g1.otros && (
          <p style={C(TX_LOW, { fontSize: 10.5, marginTop: 6 })}>
            Los {g1.otros.n} tipos restantes van agrupados en «Otros» y valen {fmtLargo(g1.otros.total)}.
            No se tiran: el total de arriba los incluye.
          </p>
        )}

        {/* ══ 2 · DE CUÁNTAS FUENTES SABEMOS ══════════════════════════════ */}
        <Separador />
        <Titulo texto="De cuántas fuentes sabemos de cada cuenta"
          nota="facturación · consumo · llamadas · tickets · reuniones · contacto · auditoría · ficha" />
        <p style={C(TX_LOW, { fontSize: 11, marginBottom: 10, lineHeight: 1.6 })}>
          Con tres fuentes de ocho no se emite juicio, se pide lo que falta.
          {medianaFuentes !== null && (
            <> La mediana de esta cartera está en <span style={C(TX_HI, { fontWeight: 700 })}>
              {medianaFuentes} de 8</span>.</>
          )}
        </p>

        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={datosG2} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: TX_MID, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.52)', fontSize: 10 }}
              axisLine={false} tickLine={false} tickFormatter={fmt} width={48} />
            <Tooltip {...tooltip} formatter={(v: number, n: string) => [fmtLargo(v), n]}
              labelFormatter={(l: string) => `${l} fuentes con dato`} />
            {asesores.map((a, i) => (
              <Bar key={a} dataKey={a} name={a} stackId="f" fill={COLOR_ASESOR[a] ?? GRIS}
                radius={i === asesores.length - 1 ? [4, 4, 0, 0] : undefined} maxBarSize={54} />
            ))}
            {medianaFuentes !== null && (
              <ReferenceLine x={`${Math.round(medianaFuentes)}/8`} stroke="rgba(255,255,255,0.45)"
                strokeDasharray="3 3" />
            )}
          </BarChart>
        </ResponsiveContainer>
        <Leyenda items={asesores.map(a => ({ k: a, label: a, color: COLOR_ASESOR[a] ?? GRIS }))} />

        {/* ══ 3 · QUÉ FUENTE FALTA, Y CUÁNTO DINERO TAPA ══════════════════ */}
        <Separador />
        <Titulo texto="Qué fuente falta, y cuánto dinero tapa"
          nota="ordenadas por el dinero que hay detrás del hueco, no por el alfabeto" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
          {g3.map(f => {
            const pct = filas.length ? (f.nSin / filas.length) * 100 : 0
            return (
              <div key={f.k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={C(TX_MID, { fontSize: 11, width: 92, flexShrink: 0 })}>{f.etiqueta}</span>
                <div style={{ flex: 1, height: 16, borderRadius: 4, overflow: 'hidden', display: 'flex',
                              background: 'rgba(255,255,255,0.05)' }}>
                  {/* Dos tramos opacos y un hueco de 2px entre ellos: el ojo
                      separa mejor por el hueco que por el borde. */}
                  <div style={{ width: `${100 - pct}%`, background: VERDE }} />
                  <div style={{ width: 2, background: PANEL }} />
                  <div style={{ width: `${pct}%`, background: GRIS }} />
                </div>
                <span style={C(pct > 50 ? '#FBBF24' : TX_MID,
                               { fontSize: 11, width: 108, textAlign: 'right', flexShrink: 0,
                                 fontVariantNumeric: 'tabular-nums' })}>
                  {f.nSin} sin dato
                </span>
                <span style={C(f.nSin > f.nSinImporte ? TX_HI : '#FBBF24',
                               { fontSize: 11, fontWeight: 700, width: 92, textAlign: 'right',
                                 flexShrink: 0, fontVariantNumeric: 'tabular-nums' })}
                      title={f.nSinImporte > 0
                        ? `${f.nSinImporte} de las ${f.nSin} sin este dato tampoco tienen importe en ninguna fuente`
                        : undefined}>
                  {f.nSin > f.nSinImporte ? miles(f.dineroSin) : 'sin medir'}
                  {f.nSinImporte > 0 && f.nSin > f.nSinImporte && (
                    <span style={C('#FBBF24', { fontSize: 9.5 })}> +{f.nSinImporte}</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Pastilla color={VERDE} texto="con dato" />
          <Pastilla color={GRIS} texto="sin dato" />
        </div>

        {/* A quién se le pide lo que más dinero tapa. Una alerta sin dueño es
            una queja; esto nombra a quién va dirigida. */}
        {g3[0] && g3[0].nSin > 0 && g3[0].dineroSin > 0 && (
          /* «Se pide a {pedirA}» daba «Se pide a el asesor»: los textos de
             `FUENTES.pedirA` ya empiezan por su sujeto —«el asesor —…»,
             «Ingeniería —…»— y la preposición sobraba. Se vio leyendo el HTML
             servido, no el código. */
          <p style={C(TX_LOW, { fontSize: 11, marginTop: 10, lineHeight: 1.6 })}>
            La fuente que más dinero tapa es <span style={C(TX_HI, { fontWeight: 700 })}>
              {g3[0].etiqueta.toLowerCase()}</span>: {g3[0].nSin} cuentas
            y {pesos(g3[0].dineroSin)} al mes sin ese dato.
            {' '}Quién lo consigue: {g3[0].pedirA}.
          </p>
        )}

        <p style={C(TX_LOW, { fontSize: 10, marginTop: 14, lineHeight: 1.7 })}>
          «No la vemos» es el cubo peor medido por construcción —una cuenta entra ahí justamente
          cuando le faltan las llamadas o el consumo—, así que su mediana baja de fuentes no es un
          hallazgo. Lo que sí lo es: ahí vive el {totalMrr > 0
            ? Math.round(filas.filter(f => f.situacion === 'no_la_vemos')
                .reduce((s, f) => s + (f.mrr ?? 0), 0) / totalMrr * 100)
            : 0}% de la facturación de esta vista, y de eso la definición no dice nada.
          {' '}Las cuentas sin importe nunca entran como cero en ninguna de las tres gráficas.
        </p>
      </div>
    </div>
  )
}

/* ── Piezas ──────────────────────────────────────────────────────────────── */

function Titulo({ texto, nota }: { texto: string; nota: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <h4 style={C(TX_HI, { fontSize: 12.5, fontWeight: 700 })}>{texto}</h4>
      <p style={C(TX_LOW, { fontSize: 10.5, marginTop: 1 })}>{nota}</p>
    </div>
  )
}

function Separador() {
  return <div style={{ height: 1, background: BORDER, margin: '20px 0 14px' }} />
}

function Leyenda({ items }: { items: { k: string; label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
      {items.map(i => <Pastilla key={i.k} color={i.color} texto={i.label} />)}
    </div>
  )
}

function Pastilla({ color, texto }: { color: string; texto: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={C(TX_MID, { fontSize: 10.5 })}>{texto}</span>
    </span>
  )
}

/** El hueco mientras el motor de veredictos calcula. Dice qué se está
 *  esperando: un bloque vacío se lee como una pantalla rota. */
export function GraficasCargando() {
  return (
    <div className="px-6 pb-5">
      <div className="rounded-2xl p-5" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <EyeOff size={13} style={{ color: TX_LOW }} />
          <span style={C(TX_MID, { fontSize: 12 })}>
            Leyendo las ocho fuentes de las cuentas vivas para armar el análisis…
          </span>
        </div>
      </div>
    </div>
  )
}
