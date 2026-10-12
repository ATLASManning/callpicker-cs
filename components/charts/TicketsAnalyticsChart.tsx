'use client'
import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Brush,
} from 'recharts'
import ChartCard from '@/components/charts/ChartCard'
import { ChartTooltip, ChartLegend, fondoConTrama, Segmentado } from '@/components/charts/primitivos'
import * as TEMA from '@/lib/chart-theme'
import { hoyEnMexico } from '@/lib/fecha-local'

/* ── TICKETS, EN EL TEMA DEL DASHBOARD (12 oct 2026) ─────────────────────
 *
 * Era la última tarjeta con paleta propia: cian y rojo sobre `#0F2040`, con
 * sus propios tokens copiados de `app/page.tsx`. Ahora:
 *
 *   · ATENCIÓN en plata, FALLAS en naranja con trama. Las fallas son lo que
 *     hay que ver, así que llevan el único acento; y la trama las distingue
 *     sin color —impresión en gris, daltonismo—.
 *   · La leyenda ENCIENDE Y APAGA series. Con las fallas solas, el ranking de
 *     clientes cambia de forma: quién reporta más fallas no es quién más
 *     tickets abre.
 *   · Clientes y servicios se ORDENAN por total o por fallas.
 *   · La tendencia lleva un deslizador de rango cuando hay más de seis meses.
 *
 * Los datos y sus universos NO cambian: siguen siendo los tickets de
 * CLIENTES, con los internos (CID 0 y 1) contados aparte. Ver
 * [[tickets-fuente]] — el archivo sólo trae CERRADOS, y la tendencia va por
 * mes de APERTURA (lo arma `app/page.tsx`).
 */

export interface TicketsAnalyticsData {
  topClientes:  { empresa: string; total: number; fallas: number }[]
  porCategoria: { categoria: string; total: number; fallas: number }[]
  reincidentes: { empresa: string; categoria: string; count: number; fallas: number }[]
  tendencia:    { mes: string; label: string; total: number; fallas: number; otros: number }[]
  /** Tickets DE CLIENTES — el mismo universo que dibujan las cuatro pestañas. */
  totalTickets: number
  /** Fallas dentro de ese mismo universo, no dentro del archivo entero. */
  totalFallas:  number
  /** Los internos (CID 0 y 1) existen y se dicen, pero no se mezclan. */
  totalInternos: number
  /** Cuántas combinaciones empresa × categoría reinciden en total, para que la
   *  lista de doce no se lea como si fueran todas. */
  reincidentesTotal: number
  /** Lo que queda FUERA del top-10, para cerrar la cuenta con palabras. No va
   *  como barra: vale 5,151 contra un máximo de 186 y aplastaría a las diez. */
  restoTickets: number
  restoCuentas: number
}

type TabKey = 'clientes' | 'servicio' | 'reincidencia' | 'tendencia'
type Orden = 'total' | 'fallas'

const COLOR = { otros: TEMA.SILVER[300], fallas: TEMA.ORANGE[500] } as const
const NOMBRE = { otros: 'Atención', fallas: 'Fallas' } as const
const TRAMA_ID = 'trama-fallas-tickets'
const n = (x: number) => x.toLocaleString('es-MX')

/* El total se reconstruye sumando lo que SÍ está dibujado. Había un tooltip
   que buscaba `dataKey === 'total'` —una serie que no se dibuja— y decía
   «Total: 0» en dos de las cuatro pestañas. */
function TooltipTickets({ active, payload, label }: {
  active?: boolean; label?: string
  payload?: { dataKey?: string; value?: number; payload?: Record<string, number> }[]
}) {
  if (!active || !payload?.length) return null
  const fila = payload[0]?.payload ?? {}
  const otros = Number(fila.otros) || 0
  const fallas = Number(fila.fallas) || 0
  const total = otros + fallas
  return (
    <ChartTooltip
      titulo={String(label ?? '')}
      lineas={[
        { etiqueta: 'Tickets', valor: n(total) },
        { etiqueta: NOMBRE.otros, valor: n(otros), color: COLOR.otros },
        { etiqueta: NOMBRE.fallas, valor: n(fallas), color: COLOR.fallas,
          delta: total > 0 ? `${((fallas / total) * 100).toFixed(1)}%` : undefined },
      ]}
    />
  )
}

function Barras({ datos, clave, apagadas, horizontal, alto }: {
  datos: Record<string, string | number>[]
  clave: string
  apagadas: Set<string>
  horizontal: boolean
  alto: number
}) {
  const ancho = horizontal
    ? Math.min(220, Math.max(110, ...datos.map(d => String(d[clave]).length * 7)))
    : 0
  const series = (['otros', 'fallas'] as const).filter(s => !apagadas.has(s))
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos} layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
        {/* La trama de las fallas, como `<defs>` CRUDO. recharts descarta los
            hijos que no reconoce: un componente propio que devolviera este
            mismo `<defs>` no llegaba al SVG, y las fallas salían sin pintar
            (pasó, lo cazó el arnés local). Y va DENTRO de este SVG: un
            `<pattern>` de otro SVG no es alcanzable por `url(#id)`. */}
        <defs>
          <pattern id={TRAMA_ID} width="6" height="6" patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)">
            <rect width="6" height="6" fill={COLOR.fallas} />
            <line x1="0" y1="0" x2="0" y2="6" stroke={TEMA.NAVY[900]} strokeWidth="2" opacity="0.42" />
          </pattern>
        </defs>
        <CartesianGrid stroke={TEMA.GRID} horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...TEMA.EJE_COMUN} />
            <YAxis type="category" dataKey={clave} width={ancho} {...TEMA.EJE_COMUN}
              tick={{ fill: TEMA.TX.mid, fontSize: TEMA.FUENTE.eje }}
              tickFormatter={(v: string) => v.length > 30 ? v.slice(0, 29) + '…' : v} />
          </>
        ) : (
          <>
            <XAxis dataKey={clave} {...TEMA.EJE_COMUN} />
            <YAxis {...TEMA.EJE_COMUN} width={44} />
          </>
        )}
        <Tooltip content={<TooltipTickets />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        {series.map(s => (
          <Bar key={s} dataKey={s} name={NOMBRE[s]} stackId="t"
            fill={s === 'fallas' ? `url(#${TRAMA_ID})` : COLOR[s]}
            stroke={TEMA.NAVY[700]} strokeWidth={1}
            maxBarSize={horizontal ? 18 : 44}
            animationDuration={TEMA.MOTION.entrada} />
        ))}
        {!horizontal && datos.length > 6 && (
          /* El rango arranca en los últimos seis meses: es lo que se mira a
             diario, y el resto queda a un arrastre. */
          <Brush dataKey={clave} height={22} stroke={TEMA.SILVER[500]}
            fill={TEMA.NAVY[900]} travellerWidth={10}
            startIndex={Math.max(0, datos.length - 6)}
            tickFormatter={() => ''} />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function TicketsAnalyticsChart({ data }: { data: TicketsAnalyticsData }) {
  const [tab, setTab] = useState<TabKey>('clientes')
  const [orden, setOrden] = useState<Orden>('total')
  const [apagadas, setApagadas] = useState<Set<string>>(new Set())

  const fallaPct = data.totalTickets > 0 ? (data.totalFallas / data.totalTickets) * 100 : 0

  const clientes = useMemo(() => data.topClientes
    .map(d => ({ empresa: d.empresa, otros: d.total - d.fallas, fallas: d.fallas, total: d.total }))
    .sort((a, b) => orden === 'fallas' ? b.fallas - a.fallas || b.total - a.total : b.total - a.total),
  [data.topClientes, orden])

  const servicios = useMemo(() => data.porCategoria
    .map(d => ({ categoria: d.categoria, otros: d.total - d.fallas, fallas: d.fallas, total: d.total }))
    .sort((a, b) => orden === 'fallas' ? b.fallas - a.fallas || b.total - a.total : b.total - a.total),
  [data.porCategoria, orden])

  /* ── El hallazgo de cada pestaña, calculado. `null` si no hay nada. ───── */
  const insight = useMemo(() => {
    if (tab === 'tendencia') {
      /* SE COMPARAN MESES CERRADOS. La primera versión comparaba el último
         contra el anterior y, a 12 de octubre, publicaba «oct: 70% menos que
         sep» — un mes a medias contra uno entero. Es el mismo error que el
         churn del mes vivo: ver [[regla-churn-mes-vencido]]. El mes en curso
         se dice aparte, con lo que lleva. */
      const mesVivo = hoyEnMexico().slice(0, 7)
      const cerrados = data.tendencia.filter(x => x.mes < mesVivo)
      const vivo = data.tendencia.find(x => x.mes === mesVivo)
      const enCurso = vivo ? ` ${vivo.label} va en ${n(vivo.total)}, y aún no cierra.` : ''
      if (cerrados.length < 2) return enCurso.trim() || null
      const u = cerrados[cerrados.length - 1], p = cerrados[cerrados.length - 2]
      if (p.total === 0) return enCurso.trim() || null
      const d = Math.round(((u.total - p.total) / p.total) * 100)
      const cambio = Math.abs(d) < 5 ? 'casi igual que' : d > 0 ? `${d}% más que` : `${-d}% menos que`
      return `${u.label} cerró con ${n(u.total)} tickets, ${cambio} ${p.label}.${enCurso}`
    }
    if (tab === 'clientes' && data.totalTickets > 0) {
      const top = data.totalTickets - data.restoTickets
      return `Diez clientes abren el ${Math.round((top / data.totalTickets) * 100)}% de los tickets;`
        + ` las otras ${n(data.restoCuentas)} cuentas, el resto.`
    }
    if (tab === 'servicio' && servicios.length > 0) {
      const peor = [...servicios].sort((a, b) => b.fallas - a.fallas)[0]
      if (!peor || peor.fallas === 0 || data.totalFallas === 0) return null
      return `${peor.categoria} concentra ${n(peor.fallas)} fallas, el `
        + `${Math.round((peor.fallas / data.totalFallas) * 100)}% de todas.`
    }
    if (tab === 'reincidencia' && data.reincidentes[0]) {
      const r = data.reincidentes[0]
      return `${r.empresa} ha pedido ${r.count} veces ayuda con ${r.categoria}.`
    }
    return null
  }, [tab, data, servicios])

  const exportar = () => {
    let cab: string[] = [], filas: (string | number)[][] = []
    if (tab === 'clientes') { cab = ['cliente', 'tickets', 'fallas']; filas = clientes.map(c => [c.empresa, c.total, c.fallas]) }
    if (tab === 'servicio') { cab = ['servicio', 'tickets', 'fallas']; filas = servicios.map(c => [c.categoria, c.total, c.fallas]) }
    if (tab === 'reincidencia') { cab = ['cliente', 'servicio', 'tickets', 'fallas']; filas = data.reincidentes.map(r => [r.empresa, r.categoria, r.count, r.fallas]) }
    if (tab === 'tendencia') { cab = ['mes', 'tickets', 'fallas']; filas = data.tendencia.map(t => [t.mes, t.total, t.fallas]) }
    const csv = [cab, ...filas].map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `tickets-${tab}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const reestablecer = () => { setTab('clientes'); setOrden('total'); setApagadas(new Set()) }

  const nota = (t: string) => (
    <p style={{ marginTop: 10, lineHeight: 1.55 }}>
      <span style={{ background: 'transparent', color: TEMA.TX.low, fontSize: 12 }}>{t}</span>
    </p>
  )

  return (
    <ChartCard
      titulo="Análisis de tickets"
      subtitulo={`${n(data.totalTickets)} tickets de clientes · ${n(data.totalFallas)} fallas `
        + `(${fallaPct.toFixed(1)}%)`
        + (data.totalInternos > 0 ? ` · ${n(data.totalInternos)} internos, fuera de estas vistas` : '')}
      ayuda="Tickets de Zoho Desk. El archivo sólo trae los CERRADOS, así que no hay «abiertos»
        que contar. La vista por mes los pone en el mes en que se ABRIERON, y por eso el mes en
        curso sale corto: sólo trae lo que ya se cerró. Los CID 0 y 1 son internos y se cuentan
        aparte. Clic en la leyenda para dejar sólo las fallas."
      insight={insight}
      descripcion={`Tickets de clientes por ${tab}. ${n(data.totalTickets)} en total, `
        + `${n(data.totalFallas)} fallas.`}
      vacio={data.totalTickets === 0 ? 'No llegó ningún ticket. Revisa la carga de Zoho Desk antes de leer esto como «cero problemas».' : null}
      onReestablecer={reestablecer}
      onExportar={exportar}
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <Segmentado etiqueta="Ver"
          opciones={[['clientes', 'Clientes'], ['servicio', 'Servicio'],
                     ['reincidencia', 'Reincidencia'], ['tendencia', 'Por mes']]}
          valor={tab} onCambio={v => setTab(v as TabKey)} />
        {(tab === 'clientes' || tab === 'servicio') && (
          <Segmentado etiqueta="Ordenar por"
            opciones={[['total', 'Tickets'], ['fallas', 'Fallas']]}
            valor={orden} onCambio={v => setOrden(v as Orden)} />
        )}
      </div>

      {tab !== 'reincidencia' && (
        <div style={{ marginBottom: 8 }}>
          <ChartLegend
            items={[
              { k: 'otros', label: 'Atención', color: COLOR.otros },
              { k: 'fallas', label: 'Fallas reportadas', color: COLOR.fallas, trama: true },
            ]}
            apagados={apagadas}
            onAlternar={k => setApagadas(prev => {
              const s = new Set(prev)
              if (s.has(k)) s.delete(k)
              /* Nunca las dos apagadas: una gráfica sin series parece rota. */
              else if (s.size === 0) s.add(k)
              return s
            })}
          />
        </div>
      )}

      {tab === 'clientes' && (
        <>
          <Barras datos={clientes} clave="empresa" apagadas={apagadas} horizontal
            alto={Math.max(240, clientes.length * 32)} />
          {data.restoCuentas > 0 && nota(
            `Estas diez son ${n(data.totalTickets - data.restoTickets)} de ${n(data.totalTickets)} tickets. `
            + `Las otras ${n(data.restoCuentas)} cuentas suman ${n(data.restoTickets)}.`
            + (orden === 'fallas' ? ' Ordenado por fallas DENTRO de las diez de más tickets.' : ''))}
        </>
      )}

      {tab === 'servicio' && (
        <>
          <Barras datos={servicios} clave="categoria" apagadas={apagadas} horizontal
            alto={Math.max(240, servicios.length * 30)} />
          {nota(`${servicios.length} tipos de servicio con tickets.`)}
        </>
      )}

      {tab === 'tendencia' && (
        <>
          <Barras datos={data.tendencia} clave="label" apagadas={apagadas} horizontal={false} alto={300} />
          {nota(data.tendencia.length > 6
            ? 'Arrastra los extremos de la franja de abajo para cambiar el rango de meses.'
            : 'Cada columna es un mes, por fecha de apertura.')}
        </>
      )}

      {tab === 'reincidencia' && (
        <Reincidencia datos={data.reincidentes} total={data.reincidentesTotal} />
      )}
    </ChartCard>
  )
}

/* ── Reincidencia: lista ordenada, no gráfica ─────────────────────────────
   Son pares cliente × servicio; una barra por par necesita dos rótulos y no
   caben en un eje. La lista lleva su barra de proporción y la falla, si la
   hay, en naranja con trama — el mismo código que el resto de la tarjeta. */
function Reincidencia({ datos, total }: {
  datos: TicketsAnalyticsData['reincidentes']; total: number
}) {
  const max = datos[0]?.count ?? 1
  return (
    <div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex',
                   flexDirection: 'column', gap: 10 }}>
        {datos.map((r, i) => (
          <li key={`${r.empresa}-${r.categoria}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: 'transparent', width: 22, textAlign: 'right', flexShrink: 0,
                           fontSize: TEMA.FUENTE.etiqueta, fontWeight: 800,
                           color: i < 3 ? TEMA.ORANGE[400] : TEMA.TX.low }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                <span style={{ background: 'transparent', minWidth: 0, overflow: 'hidden',
                               textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                               fontSize: TEMA.FUENTE.cuerpo, color: TEMA.TX.hi, fontWeight: 700 }}>
                  {r.empresa}
                  <span style={{ background: 'transparent', color: TEMA.TX.low, fontWeight: 500,
                                 fontSize: TEMA.FUENTE.etiqueta }}> · {r.categoria}</span>
                </span>
                <span style={{ background: 'transparent', flexShrink: 0, display: 'flex', gap: 10,
                               alignItems: 'baseline', ...TEMA.TABULAR }}>
                  {r.fallas > 0 && (
                    <span style={{ background: 'transparent', color: TEMA.ORANGE[400],
                                   fontSize: TEMA.FUENTE.etiqueta, fontWeight: 700 }}>
                      {r.fallas} falla{r.fallas > 1 ? 's' : ''}
                    </span>
                  )}
                  <span style={{ background: 'transparent', color: TEMA.TX.hi,
                                 fontSize: TEMA.FUENTE.valor, fontWeight: 800 }}>{r.count}</span>
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)',
                            overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${((r.count - r.fallas) / max) * 100}%`, background: COLOR.otros }} />
                <div style={{ width: `${(r.fallas / max) * 100}%`, background: fondoConTrama(COLOR.fallas, true) }} />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p style={{ marginTop: 12 }}>
        <span style={{ background: 'transparent', color: TEMA.TX.low, fontSize: 12 }}>
          Cliente × tipo de soporte con 3 o más tickets · {datos.length} de {total} combinaciones
          que reinciden, ordenadas por volumen.
        </span>
      </p>
    </div>
  )
}
