'use client'
/**
 * Análisis de Llamadas — consulta profunda sobre 4.2 millones de llamadas.
 *
 * Es el hermano mayor del módulo que vive en la ficha de cuenta. Allá se
 * responde «qué le pasa a ESTE cliente» en 400px; aquí se explora: por cuenta,
 * por asesor, por mes, por día y por hora, con el cruce día×hora que en una
 * ficha sola no se justificaba y que con 148 cuentas sí es el hallazgo.
 *
 * Reglas de lectura que la pantalla respeta y declara:
 *  · Entrantes y salientes NUNCA se suman ni se comparan. Se elige dirección y
 *    las salientes se leen como «% que conectó», métrica invertida a propósito.
 *  · `Self_service` es una llamada que resolvió el menú: cuenta como atendida,
 *    no como falla.
 *  · Lo medido son llamadas y números distintos, nunca personas.
 *  · Lo que no se midió se dice. 31% de las entrantes vienen de una parte del
 *    archivo sin columna de destino, y el mes parcial se rotula.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { PhoneIncoming, PhoneOutgoing, RefreshCw, AlertTriangle, Users, Clock } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'

/* ── Tipos ─────────────────────────────────────────────────────────────── */
interface Meta {
  corte: string; desde: string; meses: string[]; cuentas: number
  entTotal: number; salTotal: number; entLost: number; salNoCon: number; sinCol: number
}
interface FilaCuenta {
  cid: string; empresa: string; corte: string; asesor: string; consecutivo: string
  ent: number; sal: number
}
interface Serie { mes: string; total: number; atendidas: number; ivr: number; buzon: number; perdidas: number; pct: number | null }
interface Rank { cid: string; empresa: string; corte: string; asesor: string; consecutivo: string; total: number; perdidas: number; pct: number }
interface Datos {
  meta: Meta
  alcance: {
    cuentas: number; dir: 'ent' | 'sal'; mes: string; cid: string; asesor: string
    desde: string | null; hasta: string | null
    total: number; perdidas: number; sinCol: number; pct: number | null
    matrizDelPeriodoCompleto: boolean
  }
  serie: Serie[]
  dh: number[]; dhL: number[]; dow: number[]; dowL: number[]; hora: number[]; horaL: number[]
  dia: { f: string; t: number; l: number }[]
  destinos: { d: string; l: number; c: number; min: number; n: number }[]
  ranking: Rank[]
  rankingBajoBase: number; rankingBaseMinima: number
}

/* ── Paleta y formato ──────────────────────────────────────────────────── */
const BLU = '#1B3FCC', IND = '#6366f1', GRY = '#94a3b8', RED = '#ef4444', AMB = '#f59e0b'
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const nf = (n: number) => n.toLocaleString('es-MX')
const mesLabel = (m: string) => `${MES_C[parseInt(m.slice(5, 7), 10) - 1]} ${m.slice(0, 4)}`
const fechaCorta = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${parseInt(d, 10)} ${MES_C[parseInt(m, 10) - 1].toLowerCase()} ${y}`
}

const DC: React.CSSProperties = { background: '#0D1829', borderRadius: 14, padding: 18, border: '1px solid rgba(255,255,255,0.08)' }
const DT: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }
const DS: React.CSSProperties = { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }

export default function AnalisisLlamadas() {
  const [filtros, setFiltros] = useState<{ meta: Meta; cuentas: FilaCuenta[]; asesores: string[]; meses: string[] } | null>(null)
  const [d, setD]       = useState<Datos | null>(null)
  const [dir, setDir]   = useState<'ent' | 'sal'>('ent')
  const [cid, setCid]   = useState('')
  const [mes, setMes]   = useState('')
  const [ases, setAses] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/analisis-llamadas?mode=filtros').then(r => r.json()).then(setFiltros).catch(() => setFiltros(null))
  }, [])

  useEffect(() => {
    setCargando(true)
    const p = new URLSearchParams({ dir })
    if (cid)  p.set('cid', cid)
    if (mes)  p.set('mes', mes)
    if (ases) p.set('asesor', ases)
    fetch(`/api/analisis-llamadas?${p}`).then(r => r.json())
      .then(x => setD(x.error ? null : x))
      .catch(() => setD(null))
      .finally(() => setCargando(false))
  }, [dir, cid, mes, ases])

  const esEnt = dir === 'ent'
  const cuentaSel = useMemo(() => filtros?.cuentas.find(c => c.cid === cid), [filtros, cid])

  if (!filtros) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <RefreshCw size={26} style={{ color: BLU, animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#64748B', fontSize: 13 }}>Cargando análisis de llamadas…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const m = filtros.meta
  return (
    <div style={{ padding: '26px 30px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Encabezado ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Análisis de Llamadas</h1>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
            {nf(m.entTotal + m.salTotal)} llamadas de {m.cuentas} cuentas · {fechaCorta(m.desde)} al {fechaCorta(m.corte)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {([['ent', 'Entrantes', PhoneIncoming], ['sal', 'Salientes', PhoneOutgoing]] as const).map(([k, lbl, Icon]) => (
            <button key={k} onClick={() => setDir(k)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
              border: `1.5px solid ${dir === k ? (k === 'ent' ? BLU : AMB) : '#e2e8f0'}`,
              background: dir === k ? (k === 'ent' ? BLU : AMB) : '#fff',
              color: dir === k ? '#fff' : '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}>
              <Icon size={14} /> {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Campo label="Cliente o CID" ancho={330}>
          <CustomSelect
            value={cid}
            onChange={v => { setCid(v); if (v) setAses('') }}
            options={[{ value: '', label: `Todas las cuentas (${filtros.cuentas.length})` },
              ...filtros.cuentas.map(c => ({
                value: c.cid,
                label: `${c.consecutivo ? c.consecutivo + ' · ' : ''}${c.empresa} — CID ${c.cid}`,
              }))]}
            placeholder="Buscar cliente o CID…"
            searchable
          />
        </Campo>
        <Campo label="Asesor" ancho={190}>
          <CustomSelect
            value={ases}
            onChange={v => { setAses(v); if (v) setCid('') }}
            options={[{ value: '', label: 'Todos los asesores' }, ...filtros.asesores.map(a => ({ value: a, label: a }))]}
          />
        </Campo>
        <Campo label="Mes" ancho={170}>
          <CustomSelect
            value={mes}
            onChange={setMes}
            options={[{ value: '', label: 'Todo el periodo' }, ...filtros.meses.map(x => ({ value: x, label: mesLabel(x) }))]}
          />
        </Campo>
        {(cid || mes || ases) && (
          <button onClick={() => { setCid(''); setMes(''); setAses('') }} style={{
            padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff',
            color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>Limpiar</button>
        )}
      </div>

      {cargando && <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>Calculando…</p>}

      {d && (
        <>
          {/* ── KPIs ───────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
            <Kpi label={esEnt ? 'Entrantes' : 'Salientes'} valor={nf(d.alcance.total)}
              sub={`${d.alcance.cuentas} cuenta${d.alcance.cuentas === 1 ? '' : 's'}`} color={esEnt ? BLU : AMB} icon={esEnt ? PhoneIncoming : PhoneOutgoing} />
            <Kpi label={esEnt ? 'Sin contestar' : 'No conectó'} valor={nf(d.alcance.perdidas)}
              sub={d.alcance.pct !== null ? `${d.alcance.pct.toFixed(1)}% del total` : '—'} color={RED} icon={AlertTriangle} />
            {esEnt
              ? <Kpi label="Resueltas por el menú" valor={nf(d.serie.reduce((s, x) => s + x.ivr, 0))}
                  sub="el IVR las atendió · no son falla" color={IND} icon={Users} />
              : <Kpi label="Conectó" valor={d.alcance.pct !== null ? `${(100 - d.alcance.pct).toFixed(1)}%` : '—'}
                  sub="métrica invertida a propósito" color="#22c55e" icon={Users} />}
            <Kpi label="Periodo" valor={d.alcance.desde ? fechaCorta(d.alcance.desde) : '—'}
              sub={d.alcance.hasta ? `al ${fechaCorta(d.alcance.hasta)}` : ''} color={GRY} icon={Clock} />
          </div>

          {cuentaSel && (
            <p style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>
              <strong>{cuentaSel.empresa}</strong> · CID {cuentaSel.cid}
              {cuentaSel.consecutivo && ` · ${cuentaSel.consecutivo}`} · asesor {cuentaSel.asesor} ·
              entrega de {cuentaSel.corte === '0-40' ? 'consumo 0 a 40% del plan' : 'consumo mayor al 40%'}
            </p>
          )}

          {/* ── Serie mensual ──────────────────────────────────────── */}
          <div style={{ ...DC, marginBottom: 14 }}>
            <p style={DT}>{esEnt ? 'Desenlace de las entrantes, mes a mes' : 'Marcación saliente, mes a mes'}</p>
            <p style={DS}>
              {esEnt
                ? 'Las cuatro franjas suman exactamente las entrantes del mes. El % encima es lo que quedó sin contestar — etiqueta directa, no hay segundo eje.'
                : 'Lo que no conectó incluye Lost y Lost_by_agent. Nunca se compara con las entrantes.'}
            </p>
            <SerieMensual serie={d.serie} esEnt={esEnt} corte={m.corte} />
          </div>

          {/* ── Día × hora ─────────────────────────────────────────── */}
          <div style={{ ...DC, marginBottom: 14 }}>
            <p style={DT}>Cuándo se cae: día de la semana contra hora</p>
            <p style={DS}>
              % {esEnt ? 'sin contestar' : 'que no conectó'} en cada celda. Las celdas con menos de 30 llamadas
              van en gris: sin base no hay porcentaje.
              {d.alcance.matrizDelPeriodoCompleto && (
                <strong style={{ color: AMB }}> El filtro de mes no aplica a esta rejilla: cubre todo el periodo.</strong>
              )}
            </p>
            <Heatmap dh={d.dh} dhL={d.dhL} />
          </div>

          {/* ── Día y hora por separado ────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 14, marginBottom: 14 }}>
            <div style={DC}>
              <p style={DT}>Por día de la semana</p>
              <p style={DS}>Altura = volumen · rojo = lo {esEnt ? 'no contestado' : 'que no conectó'}</p>
              <Barras etiquetas={DIAS} total={d.dow} perd={d.dowL} />
            </div>
            <div style={DC}>
              <p style={DT}>Por hora del día</p>
              <p style={DS}>Hora tal como viene en el archivo; no trae zona horaria</p>
              <Barras etiquetas={Array.from({ length: 24 }, (_, i) => String(i))} total={d.hora} perd={d.horaL} compacto />
            </div>
          </div>

          {/* ── Serie diaria ───────────────────────────────────────── */}
          <div style={{ ...DC, marginBottom: 14 }}>
            <p style={DT}>Día a día</p>
            <p style={DS}>{d.dia.length} días con registro. Los huecos son días sin llamadas en el archivo, no ceros medidos.</p>
            <SerieDiaria dia={d.dia} />
          </div>

          {/* ── Destinos y ranking ─────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: esEnt ? '1fr 1fr' : '1fr', gap: 14 }}>
            {esEnt && (
              <div style={DC}>
                <p style={DT}>A dónde entran las que no se contestan</p>
                <p style={DS}>
                  Nombres tal como los configuró el cliente. El archivo no dice qué hay detrás de cada uno.
                  {d.alcance.sinCol > 0 && ` ${nf(d.alcance.sinCol)} entrantes vienen de una parte del archivo que no exportó el destino.`}
                </p>
                <Tabla cabeceras={['Destino', 'Sin contestar', 'Contestadas', 'Números']}
                  filas={d.destinos.map(x => [x.d, nf(x.l), nf(x.c), x.n > 0 ? nf(x.n) : '—'])} />
              </div>
            )}
            <div style={DC}>
              <p style={DT}>{cid ? 'Cuenta seleccionada' : 'Cuentas ordenadas por % ' + (esEnt ? 'sin contestar' : 'que no conectó')}</p>
              <p style={DS}>
                {cid ? 'Quita el filtro de cliente para comparar contra el resto.' : 'Cada cuenta se mide contra su propio volumen. No es un ranking de desempeño del asesor.'}
                {!cid && d.rankingBajoBase > 0 && (
                  <> Quedan fuera {d.rankingBajoBase} cuenta{d.rankingBajoBase === 1 ? '' : 's'} con menos
                    de {d.rankingBaseMinima} llamadas en este corte: un porcentaje sobre esa base no dice nada.</>
                )}
              </p>
              <Tabla cabeceras={['Cuenta', 'Asesor', 'Total', esEnt ? 'Sin contestar' : 'No conectó', '%']}
                filas={d.ranking.map(r => [
                  `${r.consecutivo ? r.consecutivo + ' · ' : ''}${r.empresa}`,
                  r.asesor, nf(r.total), nf(r.perdidas), `${r.pct.toFixed(1)}%`,
                ])} destacarUltima />
            </div>
          </div>

          {/* ── Pie de método ──────────────────────────────────────── */}
          <p style={{ fontSize: 10, color: '#64748B', lineHeight: 1.7, marginTop: 16 }}>
            Dos entregas con criterio distinto y cero CIDs en común: clientes con consumo de 0 a 40% de su plan
            y el resto de la cartera medida. Juntas cubren {m.cuentas} de las 219 cuentas con asesor y CID.
            «Sin contestar» = entró la llamada y ninguna extensión la tomó; las que resolvió el menú (Self_service)
            cuentan como atendidas. Entrantes y salientes miden cosas distintas y nunca se suman: las salientes
            se leen como «% que conectó». Lo medido son llamadas y números distintos, nunca personas.
            {m.sinCol > 0 && ` ${nf(m.sinCol)} entrantes (${(100 * m.sinCol / m.entTotal).toFixed(0)}%) vienen de una parte del archivo sin columna de destino: de esas no se sabe a dónde entraron, que no es lo mismo que no haber llegado a ninguna extensión.`}
            {' '}Corte del archivo: {fechaCorta(m.corte)}.
          </p>
        </>
      )}
    </div>
  )
}

/* ── Piezas ────────────────────────────────────────────────────────────── */
function Campo({ label, ancho, children }: { label: string; ancho: number; children: React.ReactNode }) {
  return (
    <div style={{ width: ancho }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
      {children}
    </div>
  )
}

function Kpi({ label, valor, sub, color, icon: Icon }: {
  label: string; valor: string; sub: string; color: string; icon: React.ElementType
}) {
  return (
    <div style={{ ...DC, padding: 14 }}>
      <Icon size={13} style={{ color, marginBottom: 6 }} />
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{valor}</p>
      <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>{sub}</p>
    </div>
  )
}

/** Barras apiladas por mes. Un solo eje: el % va como etiqueta directa. */
function SerieMensual({ serie, esEnt, corte }: { serie: Serie[]; esEnt: boolean; corte: string }) {
  const W = 900, H = 230, PL = 46, PR = 8, PT = 26, PB = 26
  const iw = W - PL - PR, ih = H - PT - PB
  const max = Math.max(...serie.map(s => s.total), 1) * 1.1
  const bw = iw / Math.max(serie.length, 1), bar = bw * 0.68
  const h = (v: number) => (ih * v) / max
  const mesCorte = corte.slice(0, 7)

  return (
    <>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 6 }}>
        {(esEnt
          ? [[BLU, 'Atendidas por un agente'], [IND, 'Resueltas por el menú (IVR)'], [GRY, 'Buzón'], [RED, 'Sin contestar']]
          : [[AMB, 'Conectó'], [RED, 'No conectó']]
        ).map(([c, t]) => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
            <i style={{ width: 9, height: 9, borderRadius: 2, background: c as string, display: 'inline-block' }} />{t}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Llamadas por mes">
        {[0, 1, 2, 3].map(i => {
          const y = PT + ih - (ih * i) / 3
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={PL - 7} y={y + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.45)">
                {(max * i / 3) >= 1000 ? `${Math.round(max * i / 3 / 1000)}k` : Math.round(max * i / 3)}
              </text>
            </g>
          )
        })}
        {serie.map((s, i) => {
          const x = PL + i * bw + (bw - bar) / 2
          const parcial = s.mes === mesCorte
          const op = parcial ? 0.55 : 1
          let y = PT + ih
          const segs: [number, string][] = esEnt
            ? [[s.perdidas, RED], [s.buzon, GRY], [s.ivr, IND], [s.atendidas, BLU]]
            : [[s.perdidas, RED], [s.total - s.perdidas, AMB]]
          return (
            <g key={s.mes}>
              <title>{`${mesLabel(s.mes)}: ${nf(s.total)} llamadas · ${nf(s.perdidas)} ${esEnt ? 'sin contestar' : 'no conectaron'}`}</title>
              {segs.map(([v, c], k) => {
                if (v <= 0) return null
                const hh = Math.max(h(v), 1); y -= hh
                return <g key={k}>
                  <rect x={x} y={y} width={bar} height={hh} fill={c} opacity={op} rx={k === segs.length - 1 ? 3 : 0} />
                  <line x1={x} y1={y} x2={x + bar} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                </g>
              })}
              {s.pct !== null && s.total >= 30 && (
                <text x={x + bar / 2} y={PT + ih - h(s.total) - 6} textAnchor="middle" fontSize="10" fontWeight="800"
                  fill={esEnt ? RED : '#22c55e'} opacity={op}>
                  {esEnt ? `${Math.round(s.pct)}%` : `${Math.round(100 - s.pct)}%`}
                </text>
              )}
              <text x={x + bar / 2} y={H - 9} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">
                {mesLabel(s.mes).split(' ')[0]}{parcial ? ' ·p' : ''}
              </text>
            </g>
          )
        })}
      </svg>
      <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
        «·p» marca el mes parcial: el archivo corta a media marcha y su volumen no es comparable con un mes completo.
      </p>
    </>
  )
}

/** Rejilla 7×24. Una sola rampa de color; sin base suficiente, gris. */
function Heatmap({ dh, dhL }: { dh: number[]; dhL: number[] }) {
  const pcts = dh.map((t, i) => (t >= 30 ? (100 * dhL[i]) / t : null))
  const max = Math.max(...pcts.filter((x): x is number => x !== null), 1)
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `36px repeat(24, minmax(26px, 1fr))`, gap: 2, minWidth: 700 }}>
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{h}</div>
        ))}
        {DIAS.map((dnom, di) => (
          // Fragmento con key: son celdas hermanas dentro de un mismo grid,
          // no se pueden envolver en un <div> sin romper la rejilla.
          <React.Fragment key={dnom}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center' }}>{dnom}</div>
            {Array.from({ length: 24 }, (_, h) => {
              const i = di * 24 + h
              const p = pcts[i]
              const a = p === null ? 0 : 0.10 + 0.90 * (p / max)
              return (
                <div key={i}
                  title={`${dnom} ${h}:00 — ${nf(dh[i])} llamadas · ${nf(dhL[i])} sin contestar${p !== null ? ` (${p.toFixed(1)}%)` : ' · base insuficiente'}`}
                  style={{
                    height: 22, borderRadius: 3,
                    background: p === null ? 'rgba(148,163,184,0.10)' : `rgba(239,68,68,${a.toFixed(2)})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, color: p !== null && a > 0.55 ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}>
                  {p === null ? '' : Math.round(p)}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function Barras({ etiquetas, total, perd, compacto }: {
  etiquetas: string[]; total: number[]; perd: number[]; compacto?: boolean
}) {
  const max = Math.max(...total, 1)
  const H = 150
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: compacto ? 2 : 6, height: H + 26 }}>
      {etiquetas.map((e, i) => {
        const ht = Math.max((H * total[i]) / max, total[i] > 0 ? 2 : 0)
        const hp = (ht * perd[i]) / Math.max(total[i], 1)
        const pct = total[i] > 0 ? (100 * perd[i]) / total[i] : 0
        return (
          <div key={e} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
            title={`${e} — ${nf(total[i])} llamadas · ${nf(perd[i])} sin contestar (${pct.toFixed(1)}%)`}>
            <div style={{ height: H, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%' }}>
              <div style={{ height: ht - hp, background: 'rgba(27,63,204,0.55)', borderRadius: '3px 3px 0 0' }} />
              <div style={{ height: hp, background: RED, borderRadius: hp === ht ? '3px 3px 0 0' : 0 }} />
            </div>
            <span style={{ fontSize: compacto ? 8 : 10, color: 'rgba(255,255,255,0.5)' }}>{e}</span>
            {!compacto && <span style={{ fontSize: 9, fontWeight: 700, color: RED }}>{pct.toFixed(0)}%</span>}
          </div>
        )
      })}
    </div>
  )
}

function SerieDiaria({ dia }: { dia: { f: string; t: number; l: number }[] }) {
  const W = 900, H = 120
  const max = Math.max(...dia.map(x => x.t), 1)
  const bw = W / Math.max(dia.length, 1)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Llamadas por día">
      {dia.map((x, i) => {
        const ht = Math.max((H - 14) * x.t / max, 1)
        const hp = ht * x.l / Math.max(x.t, 1)
        return (
          <g key={x.f}>
            <title>{`${fechaCorta(x.f)} — ${nf(x.t)} llamadas · ${nf(x.l)} sin contestar`}</title>
            <rect x={i * bw} y={H - 14 - ht} width={Math.max(bw - 0.4, 0.6)} height={ht - hp} fill="rgba(27,63,204,0.5)" />
            <rect x={i * bw} y={H - 14 - hp} width={Math.max(bw - 0.4, 0.6)} height={hp} fill={RED} opacity={0.85} />
          </g>
        )
      })}
      {dia.length > 0 && [0, Math.floor(dia.length / 2), dia.length - 1].map((i, k) => (
        <text key={k} x={Math.min(Math.max(i * bw, 26), W - 26)} y={H - 2} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.42)">
          {fechaCorta(dia[i].f)}
        </text>
      ))}
    </svg>
  )
}

function Tabla({ cabeceras, filas, destacarUltima }: {
  cabeceras: string[]; filas: (string | number)[][]; destacarUltima?: boolean
}) {
  if (!filas.length) return <p style={{ fontSize: 11, color: '#94a3b8' }}>Sin datos para este filtro.</p>
  return (
    <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            {cabeceras.map((c, i) => (
              <th key={c} style={{
                padding: '6px 8px', textAlign: i === 0 || i === 1 ? 'left' : 'right',
                color: '#94a3b8', fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap',
                borderBottom: '1px solid rgba(255,255,255,0.12)', position: 'sticky', top: 0, background: '#0D1829',
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {f.map((v, j) => (
                <td key={j} style={{
                  padding: '5px 8px', textAlign: j === 0 || j === 1 ? 'left' : 'right',
                  color: destacarUltima && j === f.length - 1 ? RED : 'rgba(255,255,255,0.75)',
                  fontWeight: destacarUltima && j === f.length - 1 ? 700 : 400,
                  maxWidth: j === 0 ? 240 : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={String(v)}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
