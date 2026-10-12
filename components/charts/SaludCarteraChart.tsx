'use client'
/**
 * SALUD DE LA CARTERA — sustituye a TRES paneles que decían lo mismo.
 *
 * Hasta el 12 oct 2026 el Dashboard tenía, con los mismos datos de
 * `getSemaforoByAsesor`:
 *   · «Semáforo por Asesor», columnas apiladas en cinco colores;
 *   · «Distribución General», cinco barritas al lado con los mismos cinco;
 *   · «Distribución por Asesor · Rango de Salud», LÍNEAS uniendo categorías.
 *
 * Tres cosas mal a la vez, y ninguna de diseño:
 *
 *   1. EL ROJO Y EL NARANJA ERAN CERO POR CONSTRUCCIÓN. El Health Score más
 *      bajo de la cartera viva es 43, y el semáforo marcaba riesgo por debajo
 *      de 40. Dos de cinco colores no podían encenderse nunca. Dirección ya lo
 *      había corregido en el KPI «En Riesgo» (6 oct 2026): el riesgo lo decide
 *      el MOTOR DE ALERTAS —consumo cero, 60 días sin contacto, nadie que
 *      conteste, baja escrita, tickets fuera de SLA—. Aquí se usa ese mismo
 *      criterio, así que esta tarjeta y el KPI dicen el mismo número.
 *
 *   2. EL «IMPORTE» DE LAS LÍNEAS ERA INVENTADO: `cuentas × facturación media
 *      del asesor`. Una cuenta de $400 y una de $40,000 en el mismo rango
 *      valían lo mismo. Aquí el dinero es el de cada cuenta, sumado.
 *
 *   3. UNA LÍNEA ENTRE «Saludable» Y «Estable» NO SIGNIFICA NADA: son
 *      categorías, no momentos. La pendiente sugería una tendencia que no
 *      existe.
 *
 * Y el Health Score nulo se contaba como 50 —«Observación»— sin decirlo. Aquí
 * cae en la misma banda pero se nombra aparte. Ver [[feedback-cero-sin-medicion]].
 */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import ChartCard from '@/components/charts/ChartCard'
import { FilaApilada, ChartLegend, Segmentado } from '@/components/charts/primitivos'
import { useAsesorCompartido } from '@/lib/dash-filtros'
import {
  BANDA, ORDEN_BANDA, BANDA_TRAMA, type Banda,
  TX, FUENTE, MINIMOS, MOTION, ORANGE, NAVY, BORDE, TABULAR,
  ASESOR, SILVER, mxn, mxnCompacto,
} from '@/lib/chart-theme'

export interface FilaSalud {
  id: string
  consecutivo: string
  empresa: string
  asesor: string | null
  /** `null` = la cuenta no tiene Health Score. NO es 50. */
  hs: number | null
  /** `null` = no hay importe en ninguna fuente. NO es cero. */
  mrr: number | null
  /** Por qué la marca el motor, ya en palabras. Vacío si no la marca. */
  motivos: string[]
}

type Medida = 'cuentas' | 'mrr'
type Escala = 'real' | 'pct'

const ETIQUETA: Record<Banda, string> = {
  bajo:  'Sanas',
  medio: 'En observación',
  alto:  'En riesgo',
}
const DETALLE: Record<Banda, string> = {
  bajo:  'Health Score 60 o más, y el motor no la marca',
  medio: 'Health Score 40 a 59, o sin Health Score',
  alto:  'la marca el motor de alertas',
}

/** La banda de una cuenta. El motor MANDA sobre el Health Score: es la regla
 *  de dirección del 6 oct 2026, y la misma que usa el KPI «En Riesgo». */
export function bandaDe(f: FilaSalud): Banda {
  if (f.motivos.length > 0) return 'alto'
  if (f.hs !== null && f.hs < 40) return 'alto'
  if (f.hs !== null && f.hs >= 60) return 'bajo'
  return 'medio'
}

const TODA = '__toda__'

export default function SaludCarteraChart({ filas }: { filas: FilaSalud[] }) {
  const [medida, setMedida] = useState<Medida>('mrr')
  const [escala, setEscala] = useState<Escala>('real')
  const [apagadas, setApagadas] = useState<Set<string>>(new Set())
  const [resaltada, setResaltada] = useState<string | null>(null)
  const [sel, setSel] = useState<{ fila: string; banda: Banda } | null>(null)
  const [verTodas, setVerTodas] = useState(false)
  const [asesor, setAsesor] = useAsesorCompartido()

  const asesores = useMemo(() =>
    Array.from(new Set(filas.map(f => f.asesor ?? 'sin asesor'))).sort(), [filas])

  const vale = (f: FilaSalud) => medida === 'mrr' ? (f.mrr ?? 0) : 1
  const fmt = (n: number) => medida === 'mrr' ? mxnCompacto(n)
    : `${Math.round(n)} ${Math.round(n) === 1 ? 'cuenta' : 'cuentas'}`

  /* Una fila para la cartera completa —la referencia— y una por asesor. */
  const grupos = useMemo(() => {
    const def = [{ k: TODA, titulo: 'Toda la cartera', de: filas }]
    for (const a of asesores) {
      def.push({ k: a, titulo: a, de: filas.filter(f => (f.asesor ?? 'sin asesor') === a) })
    }
    return def.map(g => {
      const por: Record<Banda, number> = { bajo: 0, medio: 0, alto: 0 }
      const n: Record<Banda, number> = { bajo: 0, medio: 0, alto: 0 }
      for (const f of g.de) { const b = bandaDe(f); por[b] += vale(f); n[b] += 1 }
      const total = por.bajo + por.medio + por.alto
      return { ...g, por, n, total, sinImporte: g.de.filter(f => f.mrr === null).length }
    })
  }, [filas, asesores, medida])

  /* EL ASSERT DE CIERRE. Las bandas son una partición: si las de un asesor no
     suman lo que tiene, la tarjeta lo dice en vez de dibujar algo que miente.
     Ver [[feedback-tablas-deben-cerrar]]. */
  const descuadre = useMemo(() => {
    const cartera = grupos[0]
    const sumaAsesores = grupos.slice(1).reduce((s, g) => s + g.total, 0)
    return Math.abs(sumaAsesores - cartera.total) > 0.5
      ? `los asesores suman ${fmt(sumaAsesores)} y la cartera ${fmt(cartera.total)}` : null
  }, [grupos])

  const maxTotal = Math.max(1, ...grupos.map(g => g.total))

  const segmentos = (g: typeof grupos[number]) => ORDEN_BANDA
    .filter(b => !apagadas.has(b))
    .map(b => ({ k: b, etiqueta: ETIQUETA[b], valor: g.por[b], color: BANDA[b], trama: BANDA_TRAMA[b] }))

  /* ── El hallazgo, calculado ─────────────────────────────────────────────
     Quién tiene más proporción en riesgo, contra quién menos. Sólo si la
     diferencia es de verdad (10 puntos o más): una frase que compara 21% con
     23% enseña a leer ruido. */
  const insight = useMemo(() => {
    const xs = grupos.slice(1).filter(g => g.total > 0)
      .map(g => ({ k: g.titulo, p: g.por.alto / g.total }))
      .sort((a, b) => b.p - a.p)
    if (xs.length < 2) return null
    const alto = xs[0], bajo = xs[xs.length - 1]
    if (alto.p - bajo.p < 0.10) return null
    const que = medida === 'mrr' ? 'de su dinero' : 'de sus cuentas'
    return `${alto.k} tiene el ${Math.round(alto.p * 100)}% ${que} en riesgo; `
      + `${bajo.k}, el ${Math.round(bajo.p * 100)}%.`
  }, [grupos, medida])

  const hsMin = useMemo(() => {
    const xs = filas.map(f => f.hs).filter((x): x is number => x !== null)
    return xs.length ? Math.min(...xs) : null
  }, [filas])
  const sinScore = filas.filter(f => f.hs === null).length

  /* ── El desglose: la lista detrás de un segmento ───────────────────────
     Es lo que convierte la gráfica en algo que se USA: clic en el naranja de
     Dan y aparecen las cuentas, con su motivo y un enlace a la ficha. */
  const detalle = useMemo(() => {
    if (!sel) return null
    const g = grupos.find(x => x.k === sel.fila)
    if (!g) return null
    const cuentas = g.de.filter(f => bandaDe(f) === sel.banda)
      .sort((a, b) => (b.mrr ?? -1) - (a.mrr ?? -1))
    return { g, cuentas }
  }, [sel, grupos])

  /* Los motivos de la banda alta, contados: qué empuja el riesgo. */
  const motivosAlto = useMemo(() => {
    const base = asesor ? filas.filter(f => (f.asesor ?? 'sin asesor') === asesor) : filas
    const n = new Map<string, number>()
    for (const f of base) if (bandaDe(f) === 'alto') {
      for (const m of f.motivos.length ? f.motivos : ['Health Score bajo 40']) {
        n.set(m, (n.get(m) ?? 0) + 1)
      }
    }
    return Array.from(n.entries()).sort((a, b) => b[1] - a[1])
  }, [filas, asesor])

  const exportar = () => {
    const base = detalle ? detalle.cuentas : filas
    const cab = ['consecutivo', 'cuenta', 'asesor', 'banda', 'health_score', 'mrr', 'motivos']
    const lineas = base.map(f => [
      f.consecutivo, f.empresa, f.asesor ?? '', ETIQUETA[bandaDe(f)],
      f.hs ?? '', f.mrr ?? '', f.motivos.join(' | '),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const blob = new Blob(['﻿' + [cab.join(','), ...lineas].join('\n')],
      { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = detalle
      ? `salud-${detalle.g.titulo}-${ETIQUETA[sel!.banda]}.csv`.replace(/\s+/g, '-').toLowerCase()
      : 'salud-cartera.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const reestablecer = () => {
    setMedida('mrr'); setEscala('real'); setApagadas(new Set()); setSel(null)
    setAsesor(''); setVerTodas(false)
  }

  const clicSegmento = (fila: string, banda: string) => {
    setVerTodas(false)
    setSel(s => s && s.fila === fila && s.banda === banda ? null : { fila, banda: banda as Banda })
  }

  const sinImporteCartera = grupos[0].sinImporte

  return (
    <ChartCard
      titulo="Salud de la cartera"
      subtitulo="Cada fila, partida en sanas, en observación y en riesgo · clic en un tramo para ver sus cuentas"
      ayuda={`Sanas: Health Score 60 o más. En observación: 40 a 59, o sin Health Score`
        + `${sinScore > 0 ? ` (hoy ${sinScore})` : ''}. En riesgo: la marca el motor de alertas — `
        + `consumo cero, más de 60 días sin contacto, nadie que conteste, baja o riesgo escrito, `
        + `tickets fuera de SLA. El motor manda sobre el Health Score`
        + `${hsMin !== null ? `: el más bajo de esta cartera es ${hsMin}, así que por Health Score `
          + `nadie estaría en riesgo` : ''}.`}
      insight={insight}
      descripcion={`Barras apiladas de salud por asesor. ` + grupos.map(g =>
        `${g.titulo}: ${ORDEN_BANDA.map(b => `${ETIQUETA[b]} ${fmt(g.por[b])}`).join(', ')}`).join('. ')}
      vacio={filas.length === 0 ? 'No llegó ninguna cuenta viva que medir. Eso no es una cartera sana: es una lectura que no ocurrió.' : null}
      onReestablecer={reestablecer}
      onExportar={exportar}
    >
      {/* ── Controles ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
                    marginBottom: 16 }}>
        <Segmentado etiqueta="Ver la cartera de"
          opciones={[['', 'Todos'], ...asesores.map(a => [a, a] as [string, string])]}
          valor={asesor} onCambio={v => { setAsesor(v); setSel(null) }} />
        <Segmentado etiqueta="Medir en"
          opciones={[['mrr', 'Dinero'], ['cuentas', 'Cuentas']]}
          valor={medida} onCambio={v => setMedida(v as Medida)} />
        <Segmentado etiqueta="Escala"
          opciones={[['real', 'Tamaño real'], ['pct', 'Cada fila al 100%']]}
          valor={escala} onCambio={v => setEscala(v as Escala)} />
      </div>

      {descuadre && (
        <p style={{ marginBottom: 8 }}>
          <span style={{ background: 'transparent', color: ORANGE[400], fontSize: FUENTE.etiqueta }}>
            Las bandas no cierran — {descuadre}. No te fíes de esta tarjeta hasta que cuadre.
          </span>
        </p>
      )}

      {/* ── Las filas ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {grupos.map((g, i) => (
          <div key={g.k}>
            <FilaApilada
              titulo={g.titulo}
              acento={g.k === TODA ? TX.hi : (ASESOR[g.k] ?? SILVER[500])}
              segmentos={segmentos(g)}
              total={escala === 'pct' ? Math.max(g.total, 1) : maxTotal}
              formato={fmt}
              indice={i}
              resaltado={resaltada}
              onResaltar={setResaltada}
              onClicSegmento={k => clicSegmento(g.k, k)}
              activo={!asesor || g.k === TODA || g.k === asesor}
            />
            {/* El reparto en porcentaje, debajo de la barra y alineado con
                ella: es lo que el ojo busca al comparar asesores de tamaños
                distintos, y escrito no hay que adivinarlo por el largo. */}
            <p style={{ margin: '2px 0 0', paddingLeft: MINIMOS.tiraAcento + 10 + 148 + 10 }}>
              <span style={{ background: 'transparent', color: TX.low, fontSize: 12, ...TABULAR }}>
                {ORDEN_BANDA.filter(b => g.n[b] > 0).map(b =>
                  `${ETIQUETA[b].toLowerCase()} ${g.total > 0 ? Math.round(g.por[b] / g.total * 100) : 0}%`
                  + ` (${g.n[b]})`).join(' · ')}
                {g === grupos[0] && i === 0 && (
                  <span style={{ background: 'transparent', color: TX.low }}> — referencia</span>
                )}
              </span>
            </p>
            {g.k === TODA && <div style={{ height: 1, background: BORDE, margin: '10px 0 4px' }} />}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <ChartLegend
          items={ORDEN_BANDA.map(b => ({
            k: b, label: `${ETIQUETA[b]} · ${DETALLE[b]}`, color: BANDA[b], trama: BANDA_TRAMA[b],
          }))}
          apagados={apagadas}
          onAlternar={k => setApagadas(prev => {
            const s = new Set(prev)
            if (s.has(k)) s.delete(k); else s.add(k)
            return s
          })}
          nota={medida === 'mrr' && sinImporteCartera > 0
            ? `Medido en dinero, ${sinImporteCartera} ${sinImporteCartera === 1 ? 'cuenta no tiene' : 'cuentas no tienen'} importe en ninguna fuente y no mueven la barra. «Cuentas» las cuenta.`
            : 'Clic en la leyenda para apagar o encender una banda.'}
        />
      </div>

      {/* ── Qué empuja el riesgo ──────────────────────────────────────── */}
      {motivosAlto.length > 0 && !detalle && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDE}` }}>
          <p style={{ marginBottom: 8 }}>
            <span style={{ background: 'transparent', color: TX.mid, fontSize: FUENTE.etiqueta,
                           fontWeight: 700 }}>
              Por qué están en riesgo{asesor ? ` · cartera de ${asesor}` : ''}
            </span>
            <span style={{ background: 'transparent', color: TX.low, fontSize: 12 }}>
              {' '}— una cuenta puede tener varios motivos
            </span>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {motivosAlto.map(([m, n]) => (
              <span key={m} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 10px', borderRadius: 8,
                background: 'rgba(255,122,26,0.10)', border: `1px solid rgba(255,122,26,0.35)`,
                color: TX.mid, fontSize: FUENTE.etiqueta,
              }}>
                <span style={{ background: 'transparent', color: ORANGE[400], fontWeight: 800, ...TABULAR }}>{n}</span>
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── El desglose del tramo elegido ─────────────────────────────── */}
      {detalle && sel && (
        <div className="dash-anima" style={{
          marginTop: 16, padding: 16, borderRadius: 12,
          background: NAVY[900], border: `1px solid ${ORANGE[500]}`,
          animation: `dash-entra-y ${MOTION.normal}ms ${MOTION.ease} both`,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                        gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <p>
              <span style={{ background: 'transparent', color: TX.hi, fontSize: FUENTE.cuerpo, fontWeight: 800 }}>
                {ETIQUETA[sel.banda]} · {detalle.g.k === TODA ? 'toda la cartera' : detalle.g.titulo}
              </span>
              <span style={{ background: 'transparent', color: TX.low, fontSize: FUENTE.etiqueta }}>
                {' '}— {detalle.cuentas.length} {detalle.cuentas.length === 1 ? 'cuenta' : 'cuentas'} ·{' '}
                {mxn(detalle.cuentas.reduce((s, f) => s + (f.mrr ?? 0), 0))} al mes
              </span>
            </p>
            <button type="button" className="dash-foco" onClick={() => setSel(null)}
              style={{ background: 'transparent', border: `1px solid ${BORDE}`, borderRadius: 8,
                       padding: '4px 10px', cursor: 'pointer', color: TX.low,
                       fontSize: FUENTE.etiqueta, minHeight: MINIMOS.areaClic }}>
              Cerrar
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: FUENTE.etiqueta }}>
              <thead>
                <tr>
                  {['Cuenta', 'Asesor', 'Health', 'Al mes', sel.banda === 'alto' ? 'Por qué' : ''].map(h => (
                    <th key={h} style={{ textAlign: h === 'Al mes' || h === 'Health' ? 'right' : 'left',
                                         padding: '6px 8px', fontSize: 12, fontWeight: 700,
                                         borderBottom: `1px solid ${BORDE}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(verTodas ? detalle.cuentas : detalle.cuentas.slice(0, 12)).map(f => (
                  <tr key={f.id}>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${BORDE}` }}>
                      <Link href={`/cuentas/${f.id}`} className="hover:underline">
                        <span style={{ background: 'transparent', color: ORANGE[400], fontWeight: 700 }}>
                          {f.empresa}
                        </span>
                      </Link>
                      {f.consecutivo && (
                        <span style={{ background: 'transparent', color: TX.low, marginLeft: 6, fontSize: 12 }}>
                          {f.consecutivo}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${BORDE}` }}>{f.asesor ?? '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: `1px solid ${BORDE}`, ...TABULAR }}>
                      {f.hs ?? <span style={{ background: 'transparent', color: TX.low }}>sin score</span>}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: `1px solid ${BORDE}`, ...TABULAR }}>
                      {f.mrr !== null ? mxn(f.mrr)
                        : <span style={{ background: 'transparent', color: TX.low }}>sin importe</span>}
                    </td>
                    {sel.banda === 'alto' ? (
                      <td style={{ padding: '6px 8px', borderBottom: `1px solid ${BORDE}` }}>
                        <span style={{ background: 'transparent', color: TX.low, fontSize: 12 }}>
                          {f.motivos.length ? f.motivos.join(' · ') : 'Health Score bajo 40'}
                        </span>
                      </td>
                    ) : <td style={{ borderBottom: `1px solid ${BORDE}` }} />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {detalle.cuentas.length > 12 && (
            <button type="button" className="dash-foco" onClick={() => setVerTodas(v => !v)}
              style={{ marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer',
                       color: ORANGE[400], fontSize: FUENTE.etiqueta, fontWeight: 700,
                       minHeight: MINIMOS.areaClic, padding: 0 }}>
              {verTodas ? 'Ver sólo las 12 de más dinero' : `Ver las ${detalle.cuentas.length}`}
            </button>
          )}
        </div>
      )}
    </ChartCard>
  )
}
