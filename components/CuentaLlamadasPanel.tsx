/**
 * Atención de llamadas — módulo de la ficha de cuenta, debajo de Cortes de Facturación.
 *
 * Server component con SVG en línea en vez de recharts: la gráfica viaja ya
 * dibujada en el HTML, no pesa en el bundle del cliente y sus valores se pueden
 * verificar leyendo la página. Los tooltips van como <title> nativos del SVG.
 *
 * Todo el juicio vive en lib/llamadas-cuenta.ts. Aquí solo se pinta.
 *
 * Color — codifica el DESENLACE de la llamada, nunca la gravedad:
 *   #1B3FCC atendida por un agente · #6366f1 resuelta por el menú ·
 *   #94a3b8 buzón · #ef4444 sin contestar · #f59e0b salientes.
 * #f97316 queda prohibido en todo el módulo: en CuentaCortesPanel ya significa
 * «consumo ≤20%» y reusarlo aquí rompería la lectura de la ficha.
 */
import { PhoneIncoming, AlertTriangle, TrendingUp, CalendarClock, HelpCircle } from 'lucide-react'
import {
  serieMensual, mesLargo, fechaCorta, U,
  type LecturaLlamadas, type LlamadasMeta,
} from '@/lib/llamadas-cuenta'

const RED = '#ef4444', BLU = '#1B3FCC', IND = '#6366f1', GRY = '#94a3b8', AMB = '#f59e0b', GRN = '#22c55e'
const DIA_INI = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const nf = (x: number) => x.toLocaleString('es-MX')

/* ── Tarjeta de una línea para las cuentas sin lectura ────────────────────── */
export function LlamadasSinLectura({ cid, meta }: { cid: string | null; meta: LlamadasMeta }) {
  return (
    <div className="cp-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <PhoneIncoming size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />
        <h3 style={ttl}>Atención de llamadas</h3>
        <span style={bdg(GRY)}>SIN LECTURA</span>
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, margin: 0 }}>
        Esta cuenta no viene en el archivo de llamadas ({meta.cuentas} de 220 cuentas con asesor).
        No hay medición — no es que no tenga llamadas.
      </p>
      {!cid && (
        <p style={{ fontSize: 11, marginTop: 4, color: AMB }}>Configura el CID para búsqueda exacta</p>
      )}
    </div>
  )
}

/* ── El módulo ───────────────────────────────────────────────────────────── */
export default function CuentaLlamadasPanel({ l, meta }: { l: LecturaLlamadas; meta: LlamadasMeta }) {
  const d = l.datos
  const serie = serieMensual(d, meta)
  const conf = l.confirmar
  const sinVol = l.veredicto === 'sin_volumen'
  const pctCon = d.sal && d.sal.total > 0 ? (100 * (d.sal.total - d.sal.noCon)) / d.sal.total : null
  const kcol = conf || sinVol ? GRY
    : l.delta === null ? 'rgba(255,255,255,0.75)'
    : l.delta >= U.PTS_LLAMA ? RED : l.delta <= -U.PTS_LLAMA ? GRN : 'rgba(255,255,255,0.75)'

  return (
    <div className="cp-card">
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PhoneIncoming size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />
          <h3 style={ttl}>Atención de llamadas</h3>
          {d.ent && <span style={bdg(BLU)}>{nf(d.ent.total)} entrantes</span>}
          {d.sal && <span style={bdg(AMB)}>{nf(d.sal.total)} salientes</span>}
          <span style={bdg(l.color)}>{l.etiqueta}</span>
        </div>
        <span style={{ fontSize: 10, color: GRY, whiteSpace: 'nowrap' }}>
          {fechaCorta(meta.meses[0] + '-01')} – {fechaCorta(meta.corte)}
        </span>
      </div>

      {l.archivoViejo && (
        <p style={{ fontSize: 10, color: GRY, marginBottom: 8 }}>
          Datos al {fechaCorta(meta.corte)}. El archivo no se ha vuelto a extraer: este módulo
          sigue hablando de {mesLargo(meta.mesCerrado)}.
        </p>
      )}

      {/* Destino por confirmar — va arriba porque cambia el sentido de todo lo demás */}
      {conf && (
        <div style={{ borderLeft: `3px solid ${GRY}`, background: 'rgba(148,163,184,0.07)', borderRadius: '0 8px 8px 0', padding: '9px 11px', marginBottom: 11 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, margin: 0 }}>
            <HelpCircle size={11} style={{ display: 'inline', verticalAlign: -1, marginRight: 5, color: GRY }} />
            El {Math.round((100 * conf.l) / (d.ent?.lost || 1))}% de lo no contestado entra a un solo
            destino: <strong style={{ color: '#fff' }}>«{conf.d}»</strong> — {nf(conf.l)} llamadas
            de {nf(conf.n)} números distintos, ninguna registrada como conversación y cero minutos.
            La cifra se publica completa; la alarma queda apagada hasta que alguien confirme qué
            atiende ahí. El archivo no lo dice.
          </p>
        </div>
      )}

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, margin: '0 0 11px' }}>
        {l.portada}
      </p>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Kpi icon={AlertTriangle} label="Sin contestar" color={kcol}
          value={sinVol || l.pctCerrado === null ? (d.ent ? nf(d.ent.total) : '—') : `${l.pctCerrado.toFixed(1)}%`}
          sub={sinVol ? 'entrantes en la ventana'
            : d.cerrado ? `${nf(d.cerrado.l)} de ${nf(d.cerrado.t)} · ${mesLargo(meta.mesCerrado)}`
            : `sin entrantes en ${mesLargo(meta.mesCerrado)}`} />
        <Kpi icon={TrendingUp} label="Contra sí misma" color={kcol}
          value={l.delta === null ? '—' : `${l.delta >= 0 ? '+' : ''}${l.delta.toFixed(1)} pts`}
          sub={l.delta === null ? 'base insuficiente' : `su base previa: ${l.pctBase!.toFixed(1)}%`} />
        <Kpi icon={CalendarClock} label="Última llamada"
          color={l.diasSinLlamada === null ? GRY : l.diasSinLlamada > U.DIAS_SILENCIO ? RED : l.diasSinLlamada <= 7 ? GRN : GRY}
          value={d.ultima ? fechaCorta(d.ultima) : '—'}
          sub={l.diasSinLlamada === null ? 'sin registro'
            : l.diasSinLlamada <= 1 ? 'al corte del archivo'
            : `hace ${l.diasSinLlamada} días al corte`} />
      </div>

      {/* Entrantes */}
      <p style={sec}>Entrantes · lo que le llega a tu cliente</p>
      <div style={{ display: 'flex', gap: 11, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 5 }}>
        <Chip c={BLU} t="Atendidas por un agente" />
        <Chip c={IND} t="Resueltas por el menú (IVR)" />
        <Chip c={GRY} t="Buzón" />
        <Chip c={RED} t="Sin contestar" rayado={!!conf} />
      </div>
      <Grafica serie={serie} conf={!!conf} sinVol={sinVol} base={l.pctBase} />
      <p style={{ ...nota, marginBottom: 12 }}>
        El % encima de cada barra es la etiqueta directa: no existe un segundo eje. Las cuatro
        franjas suman exactamente las entrantes del mes.
        {serie.some(s => s.parcial) && ` La barra de ${serie[serie.length - 1].label} va al 55% de opacidad porque el mes está incompleto.`}
      </p>

      {/* Salientes */}
      <p style={sec}>Marcación saliente — se mide aparte, no se suma con las entrantes</p>
      {pctCon === null ? (
        <p style={{ ...nota, marginBottom: 12 }}>
          No registra llamadas salientes en el periodo. No se dibuja una barra en cero.
        </p>
      ) : (
        <>
          <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', margin: '5px 0 4px' }}>
            <div style={{ height: '100%', width: `${pctCon}%`, background: AMB, borderRadius: 5 }} />
            <div style={{ position: 'absolute', top: -2, left: `${meta.baseSalCon}%`, width: 2, height: 14, background: '#fff' }} />
          </div>
          <p style={{ ...nota, marginBottom: 12 }}>
            {pctCon.toFixed(1)}% de sus {nf(d.sal!.total)} salientes conectó · la marca blanca es {meta.baseSalCon}%,
            la línea base del archivo. Métrica invertida a propósito: no se puede restar contra el indicador de arriba.
          </p>
        </>
      )}

      {/* Días y horas */}
      {l.hall && d.ent && (
        <>
          <p style={sec}>Días y horas</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, margin: '0 0 8px' }}>{l.hall.frase}</p>
          <TiraDias ent={d.ent} peor={l.hall.peorDia?.i ?? -1} conf={!!conf} />
          <TiraHoras ent={d.ent} hallazgo={l.hall.horas.map(h => h.h)} />
          <p style={{ ...nota, marginBottom: 12 }}>
            Horas de 7 a 20 · la altura es cuántas llamadas entraron y el rojo marca la hora que
            califica como hallazgo. Fuera de 7–20 h: {nf(l.hall.fuera.total)} entrantes,{' '}
            {nf(l.hall.fuera.lost)} sin contestar. Horas tal como vienen en el archivo; no trae zona horaria.
          </p>
        </>
      )}

      {/* Destinos */}
      {d.ent && d.ent.dest.length > 0 && (
        <>
          <p style={sec}>A dónde se fueron las no contestadas</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ ...th, textAlign: 'left' }}>Destino</th>
                  <th style={th}>Sin contestar</th>
                  <th style={th}>Contestadas</th>
                  <th style={th}>Números</th>
                </tr>
              </thead>
              <tbody>
                {d.ent.dest.map((x, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ ...td, textAlign: 'left', color: x.d.startsWith('(') || x.d === 'otros destinos' ? GRY : 'rgba(255,255,255,0.85)', maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={x.d}>
                      {x.d}{x.otros ? ` (${x.otros})` : ''}
                    </td>
                    <td style={{ ...td, color: RED, fontWeight: 700 }}>{nf(x.l)}</td>
                    <td style={td}>{nf(x.c)}</td>
                    <td style={td}>{x.n < 0 ? '—' : nf(x.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...nota, marginTop: 5 }}>
            Nombres tal como los tiene configurados el cliente. El archivo no dice qué hay detrás de
            cada uno — por eso no se clasifica ninguno.
          </p>
        </>
      )}

      {/* Qué le digo al cliente */}
      {l.decir.length > 0 && (
        <div style={{ borderLeft: `3px solid ${BLU}`, background: 'rgba(27,63,204,0.07)', borderRadius: '0 8px 8px 0', padding: '9px 11px', margin: '11px 0 0' }}>
          <p style={{ ...sec, marginBottom: 5 }}>Qué le digo al cliente</p>
          {l.decir.map((s, i) => (
            <p key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, margin: '0 0 4px' }}>· {s}</p>
          ))}
        </div>
      )}

      {/* Pie de método */}
      <p style={{ fontSize: 9, color: GRY, lineHeight: 1.6, margin: '11px 0 0', paddingTop: 9, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {meta.fuente} · {nf(meta.entTotal + meta.salTotal)} llamadas del {fechaCorta(meta.meses[0] + '-01')} al {fechaCorta(meta.corte)} · {meta.cuentas} de 220 cuentas con asesor.
        «Sin contestar» = entró la llamada y ninguna extensión la tomó; las resueltas por el menú NO
        cuentan como falla. Los porcentajes son de entrantes y nunca se suman con los de marcación saliente.
        El {meta.baseEnt}% general es la <strong style={{ color: 'rgba(255,255,255,0.6)' }}>línea base del archivo</strong>, no de la cartera.
        {l.via === 'nombre' && ' Esta cuenta se concilió por nombre de cliente, no por CID.'}
        {l.nombreDifiere && ` Empresa en el archivo: «${d.empresa}».`}
      </p>
    </div>
  )
}

/* ── Gráfica mensual apilada ─────────────────────────────────────────────── */
function Grafica({ serie, conf, sinVol, base }: {
  serie: ReturnType<typeof serieMensual>; conf: boolean; sinVol: boolean; base: number | null
}) {
  const W = 660, H = 176, PL = 40, PR = 6, PT = 22, PB = 20
  const iw = W - PL - PR, ih = H - PT - PB
  const max = Math.max(...serie.map(s => s.t), 1) * 1.08
  const bw = iw / serie.length, bar = bw * 0.72
  const h = (v: number) => (ih * v) / max
  const ticks = [0, 1, 2, 3].map(i => (max * i) / 3)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img"
      aria-label="Llamadas entrantes por mes, apiladas por desenlace">
      <defs>
        <pattern id="rayado-llamadas" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
        </pattern>
      </defs>
      {ticks.map((v, i) => {
        const y = PT + ih - ih * (i / 3)
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <text x={PL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.45)">
              {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
            </text>
          </g>
        )
      })}
      {serie.map((s, i) => {
        const x = PL + i * bw + (bw - bar) / 2
        const op = s.parcial ? 0.55 : 1
        let y = PT + ih
        const segs: [number, string][] = [[s.l, RED], [s.v, GRY], [s.s, IND], [s.r, BLU]]
        const rects = segs.map(([v, col], k) => {
          if (v <= 0) return null
          const hh = Math.max(h(v), 1)
          y -= hh
          return (
            <g key={k}>
              <rect x={x} y={y} width={bar} height={hh} fill={col} opacity={op} rx={k === 3 ? 3 : 0} />
              <line x1={x} y1={y} x2={x + bar} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            </g>
          )
        })
        const etiqueta = !sinVol && s.etiquetable && s.pct !== null
        const col = conf ? GRY
          : base !== null && s.pct !== null && s.pct - base >= U.PTS_LLAMA ? RED
          : base !== null && s.pct !== null && base - s.pct >= U.PTS_LLAMA ? GRN
          : 'rgba(255,255,255,0.70)'
        return (
          <g key={s.mes}>
            <title>{`${s.label}: ${nf(s.t)} entrantes · ${nf(s.l)} sin contestar · ${nf(s.r)} atendidas · ${nf(s.s)} por el menú · ${nf(s.v)} buzón`}</title>
            {rects}
            {conf && s.l > 0 && (
              <rect x={x} y={PT + ih - h(s.l)} width={bar} height={h(s.l)} fill="url(#rayado-llamadas)" opacity={op} />
            )}
            {etiqueta && (
              <text x={x + bar / 2} y={PT + ih - h(s.t) - 5} textAnchor="middle" fontSize="10" fontWeight="800" fill={col} opacity={op}>
                {Math.round(s.pct!)}%
              </text>
            )}
            {!etiqueta && s.t > 0 && !sinVol && (
              <text x={x + bar / 2} y={PT + ih - h(s.t) - 5} textAnchor="middle" fontSize="9" fill={GRY}>n&lt;{U.MES_ETIQUETA}</text>
            )}
            <text x={x + bar / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">{s.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Tira de días ────────────────────────────────────────────────────────── */
function TiraDias({ ent, peor, conf }: { ent: NonNullable<LecturaLlamadas['datos']['ent']>; peor: number; conf: boolean }) {
  const pcts = ent.dow.map((t, i) => (t > 0 ? (100 * ent.dowL[i]) / t : 0))
  const validos = pcts.filter((_, i) => ent.dow[i] >= U.N_MINIMO_DIA).sort((a, b) => a - b)
  const mediana = validos.length ? validos[Math.floor(validos.length / 2)] : 20
  const ref = Math.max(2 * mediana, 35)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 9 }}>
      {ent.dow.map((t, i) => {
        const chico = t < U.N_MINIMO_DIA
        const a = chico ? 0 : 0.12 + 0.88 * Math.min(pcts[i] / ref, 1)
        return (
          <div key={i} style={{
            borderRadius: 5, padding: '4px 2px', textAlign: 'center',
            background: chico ? 'rgba(148,163,184,0.16)' : `rgba(239,68,68,${a.toFixed(2)})`,
            border: `1px solid ${i === peor && !conf ? RED : 'transparent'}`,
          }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{DIA_INI[i]}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: '1px 0 0' }}>
              {chico ? '—' : `${Math.round(pcts[i])}%`}
            </p>
            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{nf(t)}</p>
          </div>
        )
      })}
    </div>
  )
}

/* ── Tira de horas ───────────────────────────────────────────────────────── */
function TiraHoras({ ent, hallazgo }: { ent: NonNullable<LecturaLlamadas['datos']['ent']>; hallazgo: number[] }) {
  const W = 660, H = 62
  const horas = Array.from({ length: 14 }, (_, i) => 7 + i)
  const max = Math.max(...horas.map(h => ent.hora[h]), 1)
  const bw = W / horas.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img"
      aria-label="Llamadas entrantes por hora del día">
      {horas.map((h, i) => {
        const t = ent.hora[h], l = ent.horaL[h]
        const pct = t > 0 ? (100 * l) / t : 0
        const hall = hallazgo.includes(h)
        const bh = Math.max(((H - 16) * t) / max, 1)
        const x = i * bw + bw * 0.18, y = H - 16 - bh
        return (
          <g key={h}>
            <title>{`${h}:00 — ${nf(t)} entrantes, ${nf(l)} sin contestar (${pct.toFixed(1)}%)`}</title>
            <rect x={x} y={y} width={bw * 0.64} height={bh} rx="2" fill={hall ? RED : BLU} opacity={hall ? 0.95 : 0.45} />
            {hall && (
              <text x={x + bw * 0.32} y={y - 2} textAnchor="middle" fontSize="8" fontWeight="700" fill={RED}>
                {Math.round(pct)}%
              </text>
            )}
            <text x={x + bw * 0.32} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.42)">{h}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Piezas chicas ───────────────────────────────────────────────────────── */
function Kpi({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string
}) {
  const suave = color.startsWith('rgba')
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 10,
      background: suave ? 'rgba(255,255,255,0.05)' : `${color}0E`,
      border: `1px solid ${suave ? 'rgba(255,255,255,0.10)' : `${color}2E`}`,
    }}>
      <Icon size={11} style={{ color, marginBottom: 4 }} />
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 9, color: GRY, marginTop: 2 }}>{sub}</p>
    </div>
  )
}

function Chip({ c, t, rayado }: { c: string; t: string; rayado?: boolean }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>
      <i style={{
        width: 8, height: 8, borderRadius: 2, display: 'inline-block', background: c,
        backgroundImage: rayado ? 'repeating-linear-gradient(45deg,rgba(255,255,255,.5) 0 2px,transparent 2px 4px)' : undefined,
      }} />
      {t}{rayado ? ' · destino por confirmar' : ''}
    </span>
  )
}

const ttl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
  textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
}
const sec: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: GRY, textTransform: 'uppercase',
  letterSpacing: '0.06em', margin: '0 0 7px',
}
const nota: React.CSSProperties = { fontSize: 9, color: GRY, lineHeight: 1.5, margin: '2px 0 0' }
const th: React.CSSProperties = { padding: '5px 6px', color: GRY, fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '4px 6px', textAlign: 'right', color: 'rgba(255,255,255,0.72)' }
const bdg = (c: string): React.CSSProperties => ({
  fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99,
  whiteSpace: 'nowrap', background: `${c}22`, color: c === GRY ? GRY : c,
})
