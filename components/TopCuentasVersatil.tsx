'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
/* recharts ya no se importa aquí: el ranking pasó a lollipop dibujado con
   elementos propios. Con valores apiñados, lo que el ojo compara es la
   POSICIÓN DEL PUNTO, no la longitud de siete rectángulos casi iguales — y
   eso recharts no lo da sin pelearse con su layout. */
import CustomSelect from '@/components/CustomSelect'
import { formatMXN } from '@/lib/types'
import * as TEMA from '@/lib/chart-theme'
import ChartCard from '@/components/charts/ChartCard'

/**
 * El Health Score como anillo, no como número suelto.
 *
 * El número ya está: el anillo le añade la referencia contra 100, que es lo
 * que convierte «48» en «menos de la mitad». Y el color sale de la rampa del
 * tema, no de un verde/ámbar/rojo aparte.
 */
function AnilloHealth({ valor }: { valor: number }) {
  const v = Math.max(0, Math.min(100, Math.round(valor)))
  const R = 9
  const C = 2 * Math.PI * R
  /* Más score = menos riesgo = más plata; menos score = más naranja. */
  const paso = Math.round(((100 - v) / 100) * (TEMA.TIRA_RIESGO.length - 1))
  const color = TEMA.TIRA_RIESGO[paso]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end',
                   width: '100%' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
        <circle cx="12" cy="12" r={R} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(v / 100) * C} ${C}`} strokeLinecap="round"
          transform="rotate(-90 12 12)" />
      </svg>
      <span style={{ fontWeight: 700, color: TEMA.TX.hi, ...TEMA.TABULAR,
                     background: 'transparent' }}>{v}</span>
    </span>
  )
}

/* @contraste-padre: el fondo oscuro lo pinta ChartCard, que envuelve todo el
   componente con `cp-card` y `background: NAVY[700]`. Antes el envoltorio con
   fondo vivía aquí; al pasar a la tarjeta compartida, este archivo se quedó
   declarando letra clara sin superficie propia. */

/* ── Paleta — igual que DashMetricasSection (sección contigua) ──────────── */
const PANEL   = '#0F2040'
const BORDER  = 'rgba(255,255,255,0.10)'
const TX_HI   = '#FFFFFF'
const TX_MID  = 'rgba(255,255,255,0.70)'
const TX_LOW  = 'rgba(255,255,255,0.45)'
const CYAN    = '#00B4FF'

export interface CuentaRank {
  id: string
  consecutivo: string
  empresa: string
  asesor: string | null
  facturacion: number
  healthScore: number
  activoDesde: string | null
  diasSinContacto: number | null
  ticketsTotal: number
  ticketsFallas: number
  upsellValor: number
  adopcionPct: number | null
  faltantesCount: number
}

interface Props {
  data: CuentaRank[]
}

type Dim =
  | 'antiguas' | 'recientes' | 'facMayor' | 'facMenor' | 'upsell'
  | 'sinMovimiento' | 'masTickets' | 'masFallas' | 'menosTickets'
  | 'healthBajo' | 'healthAlto' | 'adopcionBaja' | 'perfilIncompleto'

interface DimDef {
  label: string
  color: string
  dir: 'asc' | 'desc'
  money?: boolean
  value: (r: CuentaRank) => number | null
  fmt: (v: number) => string
}

const NUNCA = 999999
const diasDesde = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null
const fmtDias = (v: number) => v >= 365 ? `${(v / 365).toFixed(1)} años` : `${v} días`

const DIMS: Record<Dim, DimDef> = {
  antiguas: {
    label: 'Cuentas más antiguas', color: CYAN, dir: 'desc',
    value: r => diasDesde(r.activoDesde), fmt: fmtDias,
  },
  recientes: {
    label: 'Cuentas más recientes', color: '#22C55E', dir: 'asc',
    value: r => diasDesde(r.activoDesde), fmt: fmtDias,
  },
  facMayor: {
    label: 'Mayor facturación', color: CYAN, dir: 'desc', money: true,
    value: r => r.facturacion, fmt: formatMXN,
  },
  facMenor: {
    label: 'Menor facturación', color: '#F97316', dir: 'asc', money: true,
    value: r => r.facturacion, fmt: formatMXN,
  },
  upsell: {
    label: 'Mayor oportunidad upsell/cross-sell', color: '#A855F7', dir: 'desc', money: true,
    value: r => r.upsellValor, fmt: formatMXN,
  },
  sinMovimiento: {
    label: 'Más días sin contacto', color: '#EF4444', dir: 'desc',
    value: r => r.diasSinContacto ?? NUNCA, fmt: v => v >= NUNCA ? 'nunca contactada' : `${v} días`,
  },
  masTickets: {
    label: 'Más tickets', color: CYAN, dir: 'desc',
    value: r => r.ticketsTotal, fmt: v => `${v} tickets`,
  },
  masFallas: {
    label: 'Más fallas reportadas', color: '#EF4444', dir: 'desc',
    value: r => r.ticketsFallas, fmt: v => `${v} fallas`,
  },
  menosTickets: {
    label: 'Menos tickets (bajo compromiso)', color: '#94A3B8', dir: 'asc',
    value: r => r.ticketsTotal, fmt: v => `${v} tickets`,
  },
  healthBajo: {
    label: 'Menor Health Score (mayor riesgo)', color: '#EF4444', dir: 'asc',
    value: r => r.healthScore, fmt: v => `${Math.round(v)} pts`,
  },
  healthAlto: {
    label: 'Mayor Health Score (casos de éxito)', color: '#22C55E', dir: 'desc',
    value: r => r.healthScore, fmt: v => `${Math.round(v)} pts`,
  },
  adopcionBaja: {
    label: 'Menor adopción de producto', color: '#F97316', dir: 'asc',
    value: r => r.adopcionPct, fmt: v => `${Math.round(v)}%`,
  },
  perfilIncompleto: {
    label: 'Perfil más incompleto', color: '#EAB308', dir: 'desc',
    value: r => r.faltantesCount, fmt: v => `${v} datos faltantes`,
  },
}

const DIM_ORDER: Dim[] = [
  'healthBajo', 'healthAlto', 'sinMovimiento', 'perfilIncompleto', 'adopcionBaja',
  'facMayor', 'facMenor', 'upsell',
  'antiguas', 'recientes',
  'masTickets', 'masFallas', 'menosTickets',
]

const N_OPTS = [5, 10, 15, 20]

export default function TopCuentasVersatil({ data }: Props) {
  const [dim, setDim]   = useState<Dim>('healthBajo')
  const [topN, setTopN] = useState(10)
  const [fAsesor, setFAsesor] = useState('')
  const [busca, setBusca] = useState('')
  /** La fila bajo el cursor. Sincroniza gráfica y tabla en las DOS
   *  direcciones: pasar por una barra resalta su renglón y al revés. */
  const [sobre, setSobre] = useState<string | null>(null)

  const asesores = useMemo(() =>
    Array.from(new Set(data.map(r => r.asesor).filter(Boolean))).sort() as string[], [data])

  const def = DIMS[dim]

  const rows = useMemo(() => {
    const base = fAsesor ? data.filter(r => r.asesor === fAsesor) : data
    return base
      .map(r => ({ r, v: def.value(r) }))
      .filter((x): x is { r: CuentaRank; v: number } => x.v !== null)
      .sort((a, b) => def.dir === 'asc' ? a.v - b.v : b.v - a.v)
      .slice(0, topN)
  }, [data, def, fAsesor, topN])

  /* ── BÚSQUEDA ────────────────────────────────────────────────────────
     Va DESPUÉS del recorte a Top N a propósito: busca dentro de lo que se
     está viendo, no en toda la cartera. Buscar sobre el universo y luego
     recortar devolvía resultados que el usuario no había pedido ver. */
  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(({ r }) =>
      r.empresa.toLowerCase().includes(q)
      || r.consecutivo.toLowerCase().includes(q)
      || (r.asesor ?? '').toLowerCase().includes(q))
  }, [rows, busca])

  /* ── EL PROBLEMA DE LAS BARRAS CASI IGUALES ──────────────────────────
     En «Health Score» los valores se apiñan —el esquema deja los bloques en
     50 por omisión— y siete barras del mismo largo no dicen nada. No se
     resuelve con color: se resuelve cambiando lo que se mide.

     Si el rango es menos del 15% de la mediana, se dibuja la DIFERENCIA
     CONTRA LA MEDIANA en vez del valor absoluto. Entonces sí hay variación
     útil, y la gráfica LO DICE — un eje truncado sin avisar es la forma más
     común de mentir con una gráfica. */
  const { mediana, apinado } = useMemo(() => {
    const vs = visibles.map(x => x.v).sort((a, b) => a - b)
    if (vs.length === 0) return { mediana: 0, apinado: false }
    const m = vs[Math.floor(vs.length / 2)]
    const rango = vs[vs.length - 1] - vs[0]
    return { mediana: m, apinado: m !== 0 && rango / Math.abs(m) < 0.15 && vs.length > 2 }
  }, [visibles])

  /* El color de cada fila sale de su POSICIÓN en el ranking, no de un color
     fijo para todas: plata (extremo bueno) → naranja (extremo a vigilar). */
  const colorDe = (i: number, n: number) => {
    if (n <= 1) return TEMA.TIRA_RIESGO[TEMA.TIRA_RIESGO.length - 1]
    const t = i / (n - 1)
    const paso = Math.round(t * (TEMA.TIRA_RIESGO.length - 1))
    /* `dir: 'desc'` ordena de mayor a menor, así que la primera fila es el
       extremo que la dimensión considera «más». Si ese extremo es el malo
       —health bajo, más fallas— el naranja va arriba; si es el bueno, abajo. */
    const invertir = dim === 'healthAlto' || dim === 'facMayor' || dim === 'antiguas'
    return TEMA.TIRA_RIESGO[invertir ? paso : TEMA.TIRA_RIESGO.length - 1 - paso]
  }

  /** El hallazgo, en una frase. `null` cuando no hay nada que destacar. */
  const insight = useMemo(() => {
    if (visibles.length === 0) return null
    if (apinado) {
      return `Las ${visibles.length} están dentro del 15% de la mediana: aquí no hay un `
        + `extremo claro, hay un bloque. Mirar la tabla antes de priorizar.`
    }
    const p = visibles[0]
    const dinero = visibles.reduce((s, x) => s + x.r.facturacion, 0)
    return `Encabeza ${p.r.empresa} con ${def.fmt(p.v)}`
      + (dinero > 0 ? `. Entre las ${visibles.length} suman ${formatMXN(dinero)} al mes.` : '.')
  }, [visibles, apinado, def])

  const exportarCsv = () => {
    const cab = ['#', 'consecutivo', 'cuenta', 'asesor', def.label, 'facturacion', 'health']
    const filas = visibles.map(({ r, v }, i) => [
      i + 1, r.consecutivo, r.empresa, r.asesor ?? '', v, r.facturacion, Math.round(r.healthScore),
    ])
    const csv = [cab, ...filas]
      .map(f => f.map(c => {
        const s = String(c)
        return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }).join(','))
      .join('\n')
    /* BOM: sin él, Excel en es-MX abre los acentos rotos. */
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `top-cuentas-${dim}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="px-6 pb-5" style={{ maxWidth: TEMA.ANCHO_MAX, margin: '0 auto' }}>
      <ChartCard
        titulo="Top cuentas · ranking versátil"
        subtitulo={`${def.label} — cada asesor debe conocer sus propios extremos, no solo el promedio`}
        ayuda={'Lollipop en lugar de barras: con valores parecidos el ojo compara mejor la '
          + 'posición de un punto que la longitud de siete rectángulos casi iguales. El color '
          + 'de cada fila sale de su posición en el ranking, de plata a naranja. Y si los '
          + 'valores se apiñan, la gráfica dibuja la diferencia contra la mediana y LO DICE: '
          + 'un eje truncado sin avisar es la forma más común de mentir con una gráfica.'}
        insight={insight}
        descripcion={`Ranking de ${def.label.toLowerCase()}. `
          + visibles.slice(0, 10).map(({ r, v }, i) => `${i + 1}. ${r.empresa}: ${def.fmt(v)}`).join('. ')}
        onExportar={exportarCsv}
        onReestablecer={() => { setDim('healthBajo'); setTopN(10); setFAsesor(''); setBusca('') }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 220 }}>
              <CustomSelect value={dim} onChange={v => setDim(v as Dim)}
                options={DIM_ORDER.map(k => ({ value: k, label: DIMS[k].label }))}
                className="cp-select text-xs" />
            </div>
            <div style={{ minWidth: 90 }}>
              <CustomSelect value={String(topN)} onChange={v => setTopN(Number(v))}
                options={N_OPTS.map(n => ({ value: String(n), label: `Top ${n}` }))}
                className="cp-select text-xs" />
            </div>
            <div style={{ minWidth: 130 }}>
              <CustomSelect value={fAsesor} onChange={setFAsesor}
                options={[{ value: '', label: 'Todos los asesores' }, ...asesores.map(a => ({ value: a, label: a }))]}
                className="cp-select text-xs" />
            </div>
          </div>
        </div>

        {/* Búsqueda rápida dentro de lo que se está viendo. */}
        <div style={{ marginBottom: 12 }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar cuenta, consecutivo o asesor…"
            aria-label="Buscar dentro del ranking"
            className="dash-foco"
            style={{
              width: '100%', maxWidth: 340, padding: '7px 12px', borderRadius: 8,
              fontSize: TEMA.FUENTE.cuerpo, color: TEMA.TX.hi,
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${TEMA.BORDE}`,
              outline: 'none',
            }}
          />
        </div>

        {visibles.length === 0 ? (
          <p style={{ fontSize: TEMA.FUENTE.cuerpo, color: TX_LOW, padding: '24px 0', textAlign: 'center' }}>
            {busca
              ? `Ninguna de las ${rows.length} cuentas de esta vista coincide con «${busca}».`
              : 'Sin datos suficientes capturados para esta métrica todavía.'}
          </p>
        ) : (
          <>
            {apinado && (
              <p style={{
                fontSize: TEMA.FUENTE.cuerpo, color: TEMA.ORANGE[400],
                marginBottom: 10, lineHeight: 1.55, fontWeight: 600,
              }}>
                Los valores están apiñados —el rango es menos del 15% de la mediana— así que
                aquí se dibuja la <strong>diferencia contra la mediana ({def.fmt(mediana)})</strong>,
                no el valor absoluto. Con el valor absoluto, estas {visibles.length} barras
                saldrían del mismo largo y no dirían nada.
              </p>
            )}

            {/* ── LOLLIPOP ──────────────────────────────────────────────
                Una línea fina y un punto, no una barra maciza. Con valores
                parecidos, lo que el ojo compara es la POSICIÓN DEL PUNTO, y
                eso se resuelve mejor que la longitud de siete rectángulos
                casi iguales. */}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="dash-anima">
              {visibles.map(({ r, v }, i) => {
                const dibuja = apinado ? v - mediana : v
                const tope = Math.max(...visibles.map(x => Math.abs(apinado ? x.v - mediana : x.v)), 1)
                const pct = (Math.abs(dibuja) / tope) * 100
                const color = colorDe(i, visibles.length)
                const act = sobre === null || sobre === r.id
                return (
                  <li
                    key={r.id}
                    onMouseEnter={() => setSobre(r.id)}
                    onMouseLeave={() => setSobre(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      minHeight: TEMA.MINIMOS.altoFila,
                      opacity: act ? 1 : 0.4,
                      transition: `opacity ${TEMA.MOTION.rapido}ms`,
                    }}
                  >
                    <span style={{
                      width: 22, flexShrink: 0, textAlign: 'right',
                      fontSize: TEMA.FUENTE.eje, color: TX_LOW, ...TEMA.TABULAR,
                    }}>{i + 1}</span>

                    <Link href={`/cuentas/${r.id}`} style={{
                      width: 170, flexShrink: 0, textDecoration: 'none',
                      fontSize: TEMA.FUENTE.etiqueta, color: TEMA.TX.mid,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }} title={`${r.consecutivo} · ${r.empresa}`}>{r.empresa}</Link>

                    <div style={{ flex: 1, position: 'relative', height: TEMA.MINIMOS.areaClic,
                                  display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      {/* La raya de referencia: con diferencias, el cero es la
                          mediana y hay que verlo. */}
                      {apinado && (
                        <i aria-hidden style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0, width: 1,
                          background: TEMA.SILVER[700],
                        }} />
                      )}
                      <i aria-hidden style={{
                        height: 2, width: `max(2px, ${pct}%)`, background: color,
                        borderRadius: 1, display: 'block',
                        animation: `dash-entra-x ${TEMA.MOTION.entrada}ms ${TEMA.MOTION.ease} both`,
                        animationDelay: `${i * TEMA.MOTION.stagger}ms`,
                        transformOrigin: 'left center',
                      }} />
                      <i aria-hidden style={{
                        width: 11, height: 11, borderRadius: 999, background: color,
                        flexShrink: 0, marginLeft: -1,
                        boxShadow: sobre === r.id ? `0 0 0 4px ${color}44` : 'none',
                        transition: `box-shadow ${TEMA.MOTION.rapido}ms`,
                      }} />
                    </div>

                    <span style={{
                      width: 104, flexShrink: 0, textAlign: 'right',
                      fontSize: TEMA.FUENTE.valor, fontWeight: 750, color: TEMA.TX.hi,
                      ...TEMA.TABULAR,
                    }}>
                      {apinado
                        ? `${v - mediana >= 0 ? '+' : ''}${def.fmt(v - mediana)}`
                        : def.fmt(v)}
                    </span>
                  </li>
                )
              })}
            </ul>

            {/* Tabla de contexto */}
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['#', 'Cuenta', 'Asesor', def.label, 'Facturación', 'Health'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Facturación' || h === 'Health' ? 'right' : 'left',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: TX_LOW, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibles.map(({ r, v }, i) => (
                    <tr key={r.id}
                      onMouseEnter={() => setSobre(r.id)}
                      onMouseLeave={() => setSobre(null)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: sobre === r.id ? 'rgba(255,122,26,0.10)' : 'transparent',
                        transition: `background ${TEMA.MOTION.rapido}ms`,
                      }}>
                      <td style={{ padding: '7px 10px', color: TX_LOW }}>{i + 1}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <Link href={`/cuentas/${r.id}`} style={{ textDecoration: 'none' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#60A5FA', marginRight: 6 }}>
                            {r.consecutivo}
                          </span>
                          <span style={{ color: TX_HI, fontWeight: 600 }}>{r.empresa}</span>
                        </Link>
                      </td>
                      <td style={{ padding: '7px 10px', color: TX_MID }}>{r.asesor ?? '—'}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: colorDe(i, visibles.length) }}>
                        {def.fmt(v)}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: TX_MID, ...TEMA.TABULAR }}>
                        {formatMXN(r.facturacion)}
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        <AnilloHealth valor={r.healthScore} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ChartCard>
    </div>
  )
}
