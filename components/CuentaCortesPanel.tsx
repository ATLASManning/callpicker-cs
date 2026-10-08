'use client'
import { useEffect, useState } from 'react'
import { BarChart2, Loader2, AlertTriangle, Zap, TrendingUp, ExternalLink } from 'lucide-react'

interface CorteRow {
  cid: string; cliente: string; fechaCorte: string; periodo: string
  plan: string; minutosIncl: number; minutosConsum: number
  monto: number; pctConsumo: number; clasificacion: string
  /** Si es `false`, `pctConsumo` vale 0 pero no significa «no consumió». */
  medible: boolean
  pctEntrantes: number; pctSalientes: number; usoPrincipal: string
  eventosAnal: string
}

interface ByMes {
  [mes: string]: { count: number; monto: number; consumo: number; medibles: number; min: number; minC: number }
}

interface CortesResult { rows: CorteRow[]; byMes: ByMes; total: number }

const fmt$   = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')
const fmtNum = (n: number) => n.toLocaleString('es-MX')
const fmtMes = (ym: string) => {
  if (!ym) return ym
  const [y, m] = ym.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${meses[parseInt(m) - 1]} ${y}`
}

function pctColor(p: number) {
  if (p === 0)  return '#ef4444'
  if (p <= 20)  return '#f97316'
  if (p <= 60)  return '#f59e0b'
  if (p <= 100) return '#22c55e'
  return '#6366f1'
}

/* Variantes CLARAS de la paleta, porque estas pastillas se pintan dentro de la
   tarjeta azul marino: el `#1B3FCC` de antes daba azul sobre azul (~2:1) y el
   fondo de la pastilla es el mismo color al 9%, así que no ayudaba. Mismos
   valores que usa app/facturacion/cortes/page.tsx en su tabla oscura. */
const CLAS_COLOR: Record<string, string> = {
  'AAA': '#60A5FA', 'Grande': '#818CF8', 'Mediana': '#FBBF24',
  'Pequeña': '#4ADE80', 'Micro': '#94A3B8',
}
const USO_COLOR: Record<string, string> = {
  'entrantes': '#60A5FA', 'salientes': '#FBBF24', 'mixtas': '#A78BFA',
}

/** El respaldo de Gross Revenue: `undefined` mientras se consulta, `null` si
 *  tampoco está ahí. Son tres estados distintos y los tres se dicen distinto. */
interface GrcCuenta { mrr: number; filas: number; agrupadas: number; mes: string | null }

export default function CuentaCortesPanel({ cid, empresa }: { cid: string | null; empresa: string }) {
  const [data,        setData]        = useState<CortesResult | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [openDetalle, setOpenDetalle] = useState(false)
  const [openMes,     setOpenMes]     = useState(false)
  const [grc,         setGrc]         = useState<GrcCuenta | null | undefined>(undefined)

  const informeHref = `/facturacion/cortes?q=${encodeURIComponent(cid || empresa)}&tab=detalle`

  useEffect(() => {
    const p = new URLSearchParams({ mode: 'by-cid' })
    if (cid)     p.set('cid',    cid)
    if (empresa) p.set('nombre', empresa)
    fetch(`/api/cortes?${p}`)
      .then(r => r.json())
      .then((d: CortesResult) => {
        setData(d)
        /* Sólo si NO hay corte se va a buscar el importe a Gross Revenue. Pedirlo
           siempre traería una segunda cifra al lado de la del corte, y dos
           cifras del mismo concepto en la misma ficha es peor que ninguna. */
        if (!d || d.total === 0) {
          const q = new URLSearchParams()
          if (cid) q.set('cid', cid)
          if (empresa) q.set('nombre', empresa)
          q.set('mode', 'cuenta')
          fetch(`/api/grc?${q}`)
            .then(r => r.json())
            .then((g: { encontrado?: boolean; mrrFin?: number; filas?: number
                        mes?: string | null; incluye?: unknown[] }) => {
              setGrc(g?.encontrado && (g.mrrFin ?? 0) > 0
                ? { mrr: g.mrrFin ?? 0, filas: g.filas ?? 1,
                    agrupadas: (g.incluye ?? []).length, mes: g.mes ?? null }
                : null)
            })
            .catch(() => setGrc(null))
        }
      })
      .catch(() => { setData({ rows: [], byMes: {}, total: 0 }); setGrc(null) })
      .finally(() => setLoading(false))
  }, [cid, empresa])

  if (loading) return (
    <div className="cp-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', justifyContent: 'center', color: '#94a3b8' }}>
        <Loader2 size={14} className="animate-spin" />
        <span style={{ fontSize: 11 }}>Consultando cortes…</span>
      </div>
    </div>
  )

  const noData      = !data || data.total === 0
  const meses       = Object.entries(data?.byMes ?? {}).sort((a, b) => b[0].localeCompare(a[0]))
  const ultimo      = meses[0]
  /* `null` cuando el mes no trae un solo corte medible — la pantalla ya
     distingue el nulo, y así no se anuncia un 0% que nadie midió. */
  const promConsumo = ultimo && ultimo[1].medibles > 0
    ? ultimo[1].consumo / ultimo[1].medibles
    : null
  const montoTotal  = meses.reduce((s, [, v]) => s + v.monto, 0)
  const planActual  = data?.rows?.[0]?.plan ?? ''
  const usoPrincipal = data?.rows?.[0]?.usoPrincipal ?? ''

  const filas = Array.from(data?.rows ?? []).sort((a, b) => b.fechaCorte.localeCompare(a.fechaCorte))

  return (
    <div className="cp-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={13} className="text-textMid" />
          <h3 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Cortes de Facturación
          </h3>
          {!noData && (
            {/* `#1B3FCC` es el azul de marca de la PÁGINA clara, y esta
                pastilla vive en la tarjeta oscura: azul marino sobre azul casi
                negro, 2.14:1. `#60A5FA` es el azul que el propio archivo ya
                eligió para `CLAS_COLOR['AAA']` y al que globals redirige los
                enlaces de tarjeta oscura — 6.5:1. */}
            <span style={{ fontSize: 10, background: '#60A5FA20', color: '#60A5FA', fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>
              {data!.total} cortes
            </span>
          )}
        </div>
        <a href={informeHref} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#1B3FCC', textDecoration: 'none' }}>
          Ver informe <ExternalLink size={10} />
        </a>
      </div>

      {noData ? (
        /* No hay corte. Antes el panel se quedaba aquí y la ficha no decía de
           cuánto es la cuenta por ningún lado — y son 46 de las 192 vivas.
           Instrucción de dirección del 6 oct 2026: donde no haya corte, el
           importe se toma de Gross Revenue Facturación, que es donde está
           todo. Se enseña diciendo de dónde salió, porque no es lo mismo un
           importe medido contra su consumo que uno tomado de la facturación. */
        <div style={{ textAlign: 'center', padding: '14px 0', color: '#94a3b8' }}>
          <AlertTriangle size={18} style={{ margin: '0 auto 6px' }} />
          <p style={{ fontSize: 12, marginBottom: grc === undefined ? 0 : 10 }}>
            Sin cortes de facturación registrados
          </p>
          {grc === undefined && (
            <p style={{ fontSize: 11, marginTop: 6 }}>Consultando Gross Revenue…</p>
          )}
          {grc !== undefined && grc !== null && (
            /* Este panel vive dentro de una `.cp-card`, que es una isla oscura:
               globals.css fuerza a blanco todo <p> y todo <span> que no declare
               `background`. Por eso cada texto con color va en un <span> con su
               fondo —vale `transparent`— y los colores son claros, no oscuros.
               Ver [[atlas-dashboard-contrast-architecture]]. */
            <div style={{ background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                          padding: '11px 14px', margin: '0 auto', maxWidth: 340 }}>
              <p style={{ marginBottom: 3 }}>
                <span style={{ background: 'transparent', fontSize: 10, color: '#94A3B8',
                               textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Importe · Gross Revenue Facturación
                </span>
              </p>
              <p style={{ lineHeight: 1.1 }}>
                <span style={{ background: 'transparent', fontSize: 22, fontWeight: 800,
                               color: '#FFFFFF' }}>
                  ${Math.round(grc.mrr).toLocaleString('es-MX')}
                </span>
                <span style={{ background: 'transparent', fontSize: 12, fontWeight: 600,
                               color: '#94A3B8' }}> /mes</span>
              </p>
              <p style={{ marginTop: 4, lineHeight: 1.45 }}>
                <span style={{ background: 'transparent', fontSize: 10.5, color: '#94A3B8' }}>
                  No hay corte que medir contra su consumo, así que el importe sale de
                  facturación{grc.filas > 1
                    ? ` —suma de ${grc.filas} líneas del mismo cliente${
                        grc.agrupadas > 0 ? `, ${grc.agrupadas} agrupada${grc.agrupadas > 1 ? 's' : ''} a este CID` : ''}—`
                    : ''}{grc.mes ? `, corte de ${grc.mes}` : ''}.
                </span>
              </p>
            </div>
          )}
          {grc === null && (
            <p style={{ marginTop: 6 }}>
              <span style={{ background: 'transparent', fontSize: 11, color: '#FBBF24' }}>
                Tampoco aparece en Gross Revenue Facturación: el importe de esta cuenta
                no está en ninguna fuente.
              </span>
            </p>
          )}
          {!cid && (
            <p style={{ marginTop: 8 }}>
              <span style={{ background: 'transparent', fontSize: 11, color: '#FBBF24' }}>
                Configura el CID para búsqueda exacta
              </span>
            </p>
          )}
        </div>
      ) : (
        <>
          {/* KPIs rápidos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              {
                icon: Zap, label: 'Consumo',
                value: promConsumo != null ? `${promConsumo.toFixed(0)}%` : '—',
                color: promConsumo != null ? pctColor(promConsumo) : '#94a3b8',
                sub: 'último corte',
              },
              {
                icon: TrendingUp, label: 'Monto acum.',
                value: fmt$(montoTotal),
                color: '#1B3FCC',
                sub: `${meses.length} periodos`,
              },
              {
                icon: BarChart2, label: 'Uso princ.',
                value: usoPrincipal || '—',
                color: usoPrincipal === 'entrantes' ? '#1B3FCC' : usoPrincipal === 'salientes' ? '#f59e0b' : '#6366f1',
                sub: 'llamadas',
              },
            ].map(({ icon: Icon, label, value, color, sub }) => (
              <div key={label} style={{ padding: '10px 12px', borderRadius: 10, background: color + '08', border: `1px solid ${color}18` }}>
                <Icon size={11} style={{ color, marginBottom: 4 }} />
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Plan actual */}
          {planActual && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 }}>
              <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Plan vigente</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{planActual}</p>
            </div>
          )}

          {/* Detalle de cortes individuales */}
          <button
            onClick={() => setOpenDetalle(v => !v)}
            style={{ width: '100%', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginBottom: openDetalle ? 8 : 4, padding: 0 }}>
            {openDetalle ? '▴' : '▾'} Detalle de cortes ({filas.length} registros)
          </button>

          {openDetalle && (
            <div style={{ overflowX: 'auto', marginBottom: 10, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left',   color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>Periodo</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left',   color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>Plan</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right',  color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>Min. Inc.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right',  color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>Min. Cons.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right',  color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>% Consumo</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right',  color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>Monto</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>Clasif.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((r, i) => {
                    const clasColor = CLAS_COLOR[r.clasificacion] ?? '#94a3b8'
                    const usoColor  = USO_COLOR[r.usoPrincipal]   ?? '#6366f1'
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '5px 8px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>{r.periodo}</td>
                        <td style={{ padding: '5px 8px', color: 'rgba(255,255,255,0.45)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.plan}>{r.plan}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{fmtNum(r.minutosIncl)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{fmtNum(r.minutosConsum)}</td>
                        {/* Sin base de minutos no hay porcentaje: se dice, no
                            se pinta un 0% en rojo que acusa un desuso falso. */}
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: r.medible ? pctColor(r.pctConsumo) : 'rgba(255,255,255,0.35)' }}
                          title={r.medible ? undefined : 'El plan no incluye minutos de voz: no hay base contra la cual medir el consumo'}>
                          {r.medible ? `${r.pctConsumo.toFixed(1)}%` : 's/med.'}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#1B3FCC' }}>{fmt$(r.monto)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          <span style={{ background: clasColor + '18', color: clasColor, fontWeight: 700, padding: '2px 6px', borderRadius: 99, whiteSpace: 'nowrap', fontSize: 9 }}>
                            {r.clasificacion || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          <span style={{ background: usoColor + '18', color: usoColor, fontWeight: 700, padding: '2px 6px', borderRadius: 99, whiteSpace: 'nowrap', fontSize: 9 }}>
                            {r.usoPrincipal || '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Historial de meses */}
          <button
            onClick={() => setOpenMes(v => !v)}
            style={{ width: '100%', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginBottom: openMes ? 8 : 0, padding: 0 }}>
            {openMes ? '▴' : '▾'} Historial por mes ({meses.length} periodos)
          </button>

          {openMes && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left',  color: '#94a3b8', fontWeight: 600, fontSize: 10 }}>Mes</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600, fontSize: 10 }}>Cortes</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600, fontSize: 10 }}>Monto</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600, fontSize: 10 }}>% Consumo</th>
                  </tr>
                </thead>
                <tbody>
                  {meses.map(([mes, v]) => {
                    const avg = v.medibles ? v.consumo / v.medibles : null
                    return (
                      <tr key={mes} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{fmtMes(mes)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.45)' }}>{v.count}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#1B3FCC' }}>{fmt$(v.monto)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: avg === null ? 'rgba(255,255,255,0.35)' : pctColor(avg) }}>
                          {avg === null ? 's/med.' : `${avg.toFixed(1)}%`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
