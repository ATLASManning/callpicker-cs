'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  BarChart3, CalendarDays, XCircle, DollarSign, AlertTriangle,
  ChevronDown, ChevronUp, CheckCircle2, ArrowUpDown, Users,
} from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import { AAA_GRC_2026, AAA_GRC_FLAT } from '@/app/churn/aaa-grc-data'
import type { AAAGrcRow } from '@/app/churn/aaa-grc-data'
import { normalizarNombre } from '@/lib/elegibilidad'
import {
  GRC_BASE_MRR, GRC_VERIFICACION, GRC_RESUMEN_REPORTE,
  GRC_BASE_PROVISIONAL, GRC_RESUMEN_CERRADOS, GRC_MES_EN_CURSO,
  GRC_RECUPERACION_PAGOS,
} from '@/app/churn/grc-reporte'

const fmt = (n: number) => '$' + n.toLocaleString('es-MX', { maximumFractionDigits: 0 })
const fmtF = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* ── Dimensiones y métricas del gráfico ──────────────────────────────── */
type Dimension = 'mes' | 'clas' | 'movimiento' | 'rango'
type Metrica   = 'perdido' | 'perdido2' | 'perdidoTotal' | 'clientes' | 'mrrInicio' | 'mrrFin' | 'mesesProm'

const DIMENSIONES: Record<Dimension, { label: string; get: (r: typeof AAA_GRC_FLAT[number]) => string }> = {
  mes:        { label: 'Mes',                    get: r => r.mes },
  clas:       { label: 'Clasificación',          get: r => r.clas || 'Sin dato' },
  movimiento: { label: 'Tipo de movimiento',     get: r => r.movimiento || 'Sin dato' },
  rango:      { label: 'Rango de MRR',           get: r => r.rango || 'Sin dato' },
}

const METRICAS: Record<Metrica, { label: string; color: string; money: boolean }> = {
  perdido:      { label: 'Ingreso perdido real',        color: '#DC2626', money: true },
  perdido2:     { label: 'Perdido por fraude',          color: '#EA580C', money: true },
  perdidoTotal: { label: 'Pérdida total',               color: '#B91C1C', money: true },
  clientes:     { label: 'Número de clientes',          color: '#7C3AED', money: false },
  mrrInicio:    { label: 'MRR inicio de contrato',      color: '#2563EB', money: true },
  mrrFin:       { label: 'MRR fin de contrato',         color: '#0891B2', money: true },
  mesesProm:    { label: 'Antigüedad promedio (meses)', color: '#059669', money: false },
}

/* Los meses del corte se derivan de los datos, en orden natural de calendario:
   así incorporar un mes nuevo es sólo regenerar aaa-grc-data.ts — el título,
   el KPI de meses y las series de las gráficas se mueven solos. */
const CALENDARIO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const ORDEN_MES = CALENDARIO.filter(m => AAA_GRC_2026.some(x => x.mes === m))
const ABREV: Record<string, string> = {
  Enero: 'Ene', Febrero: 'Feb', Marzo: 'Mar', Abril: 'Abr', Mayo: 'May', Junio: 'Jun',
  Julio: 'Jul', Agosto: 'Ago', Septiembre: 'Sep', Octubre: 'Oct', Noviembre: 'Nov', Diciembre: 'Dic',
}
const MES_INI = ORDEN_MES[0] ?? ''
const MES_FIN = ORDEN_MES[ORDEN_MES.length - 1] ?? ''
const PERIODO = `${MES_INI} a ${MES_FIN} 2026`
const PERIODO_CORTO = `${ABREV[MES_INI] ?? MES_INI}–${ABREV[MES_FIN] ?? MES_FIN} 2026`

/* Columnas del detalle mensual. `largo` es el nombre EXACTO del campo en el
   export de Zoho y se muestra como tooltip al pasar el cursor, igual que en
   el Excel. La columna destacada es "Ingreso Perdido Contrato (BCY) Real":
   es la que alimenta el Gross Revenue Churn. */
type ClaveMes = 'cliente' | 'clas' | 'movimiento' | 'mrrInicio' | 'mrrFin'
              | 'perdido' | 'perdido2' | 'perdidaTotal' | 'acumulado' | 'meses' | 'facturas'

const COLUMNAS_MES: { corto: string; largo: string; clave: ClaveMes; destacada?: boolean }[] = [
  { corto: 'Cliente',           largo: 'Cliente', clave: 'cliente' },
  { corto: 'Clas.',             largo: 'clasificacion_cliente', clave: 'clas' },
  { corto: 'Movimiento',        largo: 'Movimiento MRR', clave: 'movimiento' },
  { corto: 'MRR Inicio',        largo: 'MRR Inicio Contrato (BCY)', clave: 'mrrInicio' },
  { corto: 'MRR Fin',           largo: 'MRR Fin Contrato (BCY)', clave: 'mrrFin' },
  { corto: 'Ing. Perdido Real', largo: 'Ingreso Perdido Contrato (BCY) Real', clave: 'perdido', destacada: true },
  { corto: 'Fraude',            largo: 'Ingreso Perdido Contrato (BCY) Fraude-Reestructura', clave: 'perdido2' },
  { corto: 'Pérdida Total',     largo: 'Real + Fraude-Reestructura — cálculo del dashboard, no es un campo del export', clave: 'perdidaTotal' },
  { corto: 'Acumulado',         largo: 'Importe Acumulado Recurrente', clave: 'acumulado' },
  { corto: 'Meses',             largo: 'Meses Activo', clave: 'meses' },
  { corto: 'Facts.',            largo: 'Facturas_2026', clave: 'facturas' },
]

/** Columnas que se leen como texto: su primer clic ordena A→Z. Las de dinero y
 *  conteo arrancan de mayor a menor, que es como se busca una pérdida. */
const CLAVES_TEXTO: ClaveMes[] = ['cliente', 'movimiento']

type OrdenMes = { clave: ClaveMes; dir: 'asc' | 'desc' }

/**
 * Ordena las filas de UN mes. El orden elegido se aplica a todos los meses
 * abiertos, que es lo que se pidió: un clic en el encabezado ordena la tabla
 * en cualquier mes, no solo en el que se tocó.
 *
 * `Clas.` NO se ordena alfabéticamente: AAA · AA · A · B · C es una escala, y
 * de la A a la Z pondría «AA» antes que «AAA». Lo desconocido va al final en
 * vez de colarse arriba.
 */
function ordenarMes<T extends AAAGrcRow>(filas: T[], orden: OrdenMes | null): T[] {
  if (!orden) return filas
  const valor = (r: AAAGrcRow): string | number => {
    switch (orden.clave) {
      case 'cliente':      return r.cliente ?? ''
      case 'movimiento':   return r.movimiento ?? ''
      case 'clas':         { const i = ORDEN_CLAS.indexOf(r.clas); return i < 0 ? 99 : i }
      case 'mrrInicio':    return r.mrrInicio ?? 0
      case 'mrrFin':       return r.mrrFin ?? 0
      case 'perdido':      return r.perdido ?? 0
      case 'perdido2':     return r.perdido2 ?? 0
      case 'perdidaTotal': return (r.perdido ?? 0) + (r.perdido2 ?? 0)
      case 'acumulado':    return r.acumulado ?? 0
      case 'meses':        return r.meses ?? 0
      case 'facturas':     return r.facturas ?? 0
    }
  }
  const signo = orden.dir === 'asc' ? 1 : -1
  // Copia: `filas` viene de los datos estáticos y ordenarlo en el sitio
  // reordenaría el módulo importado para todo el resto de la página.
  return [...filas].sort((a, b) => {
    const va = valor(a), vb = valor(b)
    if (typeof va === 'string' || typeof vb === 'string') {
      return signo * String(va).localeCompare(String(vb), 'es')
    }
    return signo * (va - vb)
  })
}

const ORDEN_CLAS = ['AAA','AA','A','B','C']
const ORDEN_RANGO = ['$1 - $300','$301 - $500','$501 - $1,000','$1,001 - $3,000',
  '$3,001 - $5,000','$5,001 - $10,000','$10,001 - $20,000','$20,001 - $40,000','$40,001 - $80,000']

export default function GrcAaaSection() {
  const [dimension, setDimension] = useState<Dimension>('mes')
  const [metrica, setMetrica]     = useState<Metrica>('perdido')
  /* Arranca SIN filtro de clasificación: con 'AAA' por omisión el detalle de
     cada mes mostraba sólo una parte y no cuadraba con la tabla de Gross
     Revenue Churn, que es sobre todas las clasificaciones (junio: $93,136.05
     en AAA contra los $169,684.66 del GRC). */
  const [fClas, setFClas]         = useState('')
  const [fMov, setFMov]           = useState('')
  const [openMes, setOpenMes]     = useState<Record<string, boolean>>({})
  /* Un solo orden para TODOS los meses: se pidió poder ejecutarlo en todos, no
     ordenar mes por mes. `null` = el orden original del export. */
  const [ordenMes, setOrdenMes]   = useState<OrdenMes | null>(null)

  /* ── Asesor responsable de cada cuenta ──────────────────────────────────
     El export de GRC viene de Zoho Analytics y NO trae asesor ni CID, así que
     el único cruce posible es por nombre normalizado contra la cartera.
     `null` mientras carga: sin esa distinción, la tabla diría «sin asesor»
     para todos durante el primer render y eso se lee como un dato, no como una
     espera. Ver la regla de no rellenar huecos con un valor. */
  const [asesores, setAsesores] = useState<
    { porNombre: Record<string, { asesor: string; consecutivo: string }>; ambiguos: string[] } | null
  >(null)
  const [asesoresError, setAsesoresError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    fetch('/api/churn/asesores')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(d => { if (vivo) setAsesores({ porNombre: d.porNombre ?? {}, ambiguos: d.ambiguos ?? [] }) })
      .catch(e => { if (vivo) setAsesoresError(e instanceof Error ? e.message : 'error') })
    return () => { vivo = false }
  }, [])

  /** Asesor de un cliente del export, o null si no se puede afirmar. */
  const asesorDe = useMemo(() => (cliente: string): string | null => {
    if (!asesores) return null
    const k = normalizarNombre(cliente)
    return asesores.porNombre[k]?.asesor ?? null
  }, [asesores])

  /* ── Filtrado ── */
  const filas = useMemo(() => AAA_GRC_FLAT.filter(r =>
    (!fClas || r.clas === fClas) && (!fMov || r.movimiento === fMov)
  ), [fClas, fMov])

  /* ── Agregación para el gráfico ── */
  const chartData = useMemo(() => {
    const acc = new Map<string, { perdido: number; perdido2: number; clientes: number; mrrInicio: number; mrrFin: number; meses: number }>()
    for (const r of filas) {
      const k = DIMENSIONES[dimension].get(r)
      const cur = acc.get(k) ?? { perdido: 0, perdido2: 0, clientes: 0, mrrInicio: 0, mrrFin: 0, meses: 0 }
      cur.perdido += r.perdido; cur.perdido2 += r.perdido2; cur.clientes += 1
      cur.mrrInicio += r.mrrInicio; cur.mrrFin += r.mrrFin; cur.meses += r.meses
      acc.set(k, cur)
    }
    const valor = (v: NonNullable<ReturnType<typeof acc.get>>) => {
      switch (metrica) {
        case 'perdido':      return v.perdido
        case 'perdido2':     return v.perdido2
        case 'perdidoTotal': return v.perdido + v.perdido2
        case 'clientes':     return v.clientes
        case 'mrrInicio':    return v.mrrInicio
        case 'mrrFin':       return v.mrrFin
        case 'mesesProm':    return v.clientes ? Math.round(v.meses / v.clientes) : 0
      }
    }
    const arr = Array.from(acc.entries()).map(([name, v]) => ({ name, value: valor(v), clientes: v.clientes }))
    // Orden natural por dimensión; el resto por valor descendente
    const orden = dimension === 'mes' ? ORDEN_MES : dimension === 'clas' ? ORDEN_CLAS : dimension === 'rango' ? ORDEN_RANGO : null
    if (orden) return arr.sort((a, b) => orden.indexOf(a.name) - orden.indexOf(b.name))
    return arr.sort((a, b) => b.value - a.value)
  }, [filas, dimension, metrica])

  /* ── Serie comparativa MRR inicio vs fin por mes ── */
  const serieMrr = useMemo(() => ORDEN_MES.map(mes => {
    const f = filas.filter(r => r.mes === mes)
    return {
      mes: mes.slice(0, 3),
      inicio: Math.round(f.reduce((s, r) => s + r.mrrInicio, 0)),
      fin:    Math.round(f.reduce((s, r) => s + r.mrrFin, 0)),
    }
  }), [filas])

  /* ── Gross Revenue Churn oficial ─────────────────────────────────────
     Se calcula sobre TODAS las clasificaciones y con la pérdida REAL: es el
     reporte de dirección, no la vista filtrada de abajo. El fraude /
     reestructura queda fuera, igual que en el reporte GRC.
     La base de MRR no está en el Excel (sólo trae contratos afectados), así
     que viene de GRC_BASE_MRR; sin base, el mes no muestra porcentaje. */
  const grc = useMemo(() => {
    let acum = 0
    const filas = ORDEN_MES.map(mes => {
      const f = AAA_GRC_FLAT.filter(r => r.mes === mes)
      const churn     = f.filter(r => r.movimiento.includes('Churn')).reduce((s, r) => s + r.perdido, 0)
      const downgrade = f.filter(r => r.movimiento.includes('Downgrade')).reduce((s, r) => s + r.perdido, 0)
      const perdida   = churn + downgrade
      const base      = GRC_BASE_MRR[mes] ?? 0
      const pct       = base ? (perdida / base) * 100 : null
      if (pct !== null) acum += pct
      // Dos marcas distintas y no se deben mezclar: `provisional` es que el
      // denominador no salió del reporte oficial; `enCurso` es que el mes no
      // ha cerrado y por tanto su churn viene inflado.
      const provisional = GRC_BASE_PROVISIONAL.includes(mes)
      const enCurso     = mes === GRC_MES_EN_CURSO
      return { mes, base, churn, downgrade, perdida, pct, provisional, enCurso,
               acum: pct !== null ? acum : null }
    })
    const tot = filas.reduce((a, r) => ({
      base: a.base + r.base, churn: a.churn + r.churn,
      downgrade: a.downgrade + r.downgrade, perdida: a.perdida + r.perdida,
    }), { base: 0, churn: 0, downgrade: 0, perdida: 0 })
    return { filas, tot, pctGlobal: tot.base ? (tot.perdida / tot.base) * 100 : 0 }
  }, [])

  /* Contraste contra el reporte GRC: si al regenerar los datos algún mes deja
     de cuadrar, se dice en pantalla en vez de mostrar un número equivocado. */
  const descuadres = useMemo(() => {
    const cerca = (a: number, b: number) => Math.abs(a - b) < 0.005
    const porMes = grc.filas.flatMap(f => {
      const esperado = GRC_VERIFICACION.find(v => v.mes === f.mes)
      if (!esperado) return [`${f.mes}: sin fila de verificación en el reporte`]
      if (cerca(f.churn, esperado.churn) && cerca(f.downgrade, esperado.downgrade)
        && cerca(f.perdida, esperado.perdida)) return []
      return [`${f.mes}: dashboard ${fmtF(f.perdida)} vs reporte ${fmtF(esperado.perdida)}`]
    })
    const R = GRC_RESUMEN_REPORTE
    const totales = [
      ['base de MRR',  grc.tot.base,      R.base],
      ['churn',        grc.tot.churn,     R.churn],
      ['downgrade',    grc.tot.downgrade, R.downgrade],
      ['pérdida',      grc.tot.perdida,   R.perdida],
    ] as const
    return [
      ...porMes,
      ...totales.filter(([, a, b]) => !cerca(a, b))
        .map(([etq, a, b]) => `Resumen amplio · ${etq}: dashboard ${fmtF(a)} vs reporte ${fmtF(b)}`),
    ]
  }, [grc])

  /* ── KPIs ── */
  const kpi = useMemo(() => ({
    registros: filas.length,
    perdido:   filas.reduce((s, r) => s + r.perdido, 0),
    fraude:    filas.reduce((s, r) => s + r.perdido2, 0),
    churns:    filas.filter(r => r.movimiento.includes('Churn')).length,
    downgrades:filas.filter(r => r.movimiento.includes('Downgrade')).length,
  }), [filas])

  const movimientos = useMemo(() =>
    Array.from(new Set(AAA_GRC_FLAT.map(r => r.movimiento).filter(Boolean))).sort(), [])
  const cfgM = METRICAS[metrica]
  const esDinero = cfgM.money

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#7c3aed15' }}>
          <BarChart3 size={16} style={{ color: '#7c3aed' }} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-sm">GRC · Clientes {fClas || 'todas las clasificaciones'} — {PERIODO}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pérdida: Downgrade + Churn · Fuente: Zoho Analytics · {AAA_GRC_FLAT.length} registros en el período
          </p>
        </div>
      </div>

      {/* ── Gross Revenue Churn · tabla oficial de dirección ─────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Gross Revenue Churn — 2026 confirmado</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Todas las clasificaciones · pérdida real, sin fraude ni reestructura ·
              la base de MRR proviene del reporte GRC, no del export
            </p>
          </div>
          {descuadres.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
              style={{ background: '#05966915', color: '#059669' }}>
              <CheckCircle2 size={12} /> Conciliado con el reporte GRC
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
              style={{ background: '#DC262615', color: '#DC2626' }}>
              <AlertTriangle size={12} /> {descuadres.length} mes(es) sin cuadrar
            </span>
          )}
        </div>

        {descuadres.length > 0 && (
          <ul className="px-5 py-3 bg-red-50 border-b border-red-100 text-[11px] text-red-700 space-y-0.5">
            {descuadres.map(d => <li key={d}>· {d}</li>)}
          </ul>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 680 }}>
            <thead>
              <tr style={{ background: '#1D4ED8' }} className="text-white align-bottom">
                <th className="text-left  font-bold px-3 py-2.5">Mes</th>
                <th className="text-right font-bold px-3 py-2.5">MRR inicio</th>
                <th className="text-right font-bold px-3 py-2.5">Churn</th>
                <th className="text-right font-bold px-3 py-2.5">Downgrade</th>
                {/* Columna destacada: es la cifra que se reporta a dirección. */}
                <th className="text-right font-extrabold px-3 py-2.5"
                  style={{ background: '#1E40AF', whiteSpace: 'normal', minWidth: 108 }}>
                  Pérdida:<br />Downgrade + Churn
                </th>
                <th className="text-right font-bold px-3 py-2.5" style={{ whiteSpace: 'normal' }}>
                  GRC (%)<br />Mensual
                </th>
                <th className="text-right font-bold px-3 py-2.5" style={{ whiteSpace: 'normal' }}>
                  GRC (%)<br />Acumulado
                </th>
              </tr>
            </thead>
            <tbody>
              {grc.filas.map((f, i) => (
                <tr key={f.mes} className="border-b border-gray-100"
                  style={{ background: f.enCurso ? '#FFFBEB' : (i % 2 ? '#F8FAFC' : '#fff') }}>
                  <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">
                    {f.mes}
                    {f.enCurso && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: '#FDE68A', color: '#92400E' }}>mes en curso · provisional</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-600 whitespace-nowrap">
                    {f.base
                      ? <>{fmtF(f.base)}{f.provisional && (
                          <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: '#E0E7FF', color: '#3730A3' }}
                            title="Base tomada del export completo de septiembre, no del reporte GRC oficial">
                            provisional
                          </span>
                        )}</>
                      : <span className="text-gray-400">sin base</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap" style={{ color: '#DC2626' }}>{fmtF(f.churn)}</td>
                  <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap" style={{ color: '#D97706' }}>{fmtF(f.downgrade)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold whitespace-nowrap"
                    style={{ color: '#B91C1C', background: '#FEF2F2' }}>{fmtF(f.perdida)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-700">
                    {f.pct === null ? '—' : `${f.pct.toFixed(1)}%`}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-700">
                    {f.acum === null ? '—' : `${f.acum.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
              {/* La cifra comparable contra el histórico: el mismo resumen sin
                  el mes en curso, que es el único que trae churn inflado. */}
              {GRC_MES_EN_CURSO && (
                <tr style={{ background: '#F1F5F9' }} className="border-t-2">
                  <td className="px-3 py-2.5 font-bold text-gray-700 whitespace-nowrap">
                    Meses cerrados <span className="font-normal text-gray-500">(Ene–{GRC_RESUMEN_CERRADOS.hasta}):</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-700 whitespace-nowrap">{fmtF(GRC_RESUMEN_CERRADOS.base)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold whitespace-nowrap" style={{ color: '#DC2626' }}>{fmtF(GRC_RESUMEN_CERRADOS.churn)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold whitespace-nowrap" style={{ color: '#D97706' }}>{fmtF(GRC_RESUMEN_CERRADOS.downgrade)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold whitespace-nowrap"
                    style={{ color: '#B91C1C', background: '#FEF2F2' }}>{fmtF(GRC_RESUMEN_CERRADOS.perdida)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold text-gray-700">{GRC_RESUMEN_CERRADOS.pct.toFixed(1)}%</td>
                  <td className="px-3 py-2.5" />
                </tr>
              )}
              <tr style={{ background: '#EFF6FF' }} className="border-t-2" >
                <td className="px-3 py-2.5 font-bold text-gray-900 whitespace-nowrap">Resumen amplio:</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-gray-900 whitespace-nowrap">{fmtF(grc.tot.base)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-bold whitespace-nowrap" style={{ color: '#DC2626' }}>{fmtF(grc.tot.churn)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-bold whitespace-nowrap" style={{ color: '#D97706' }}>{fmtF(grc.tot.downgrade)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-extrabold whitespace-nowrap"
                  style={{ color: '#B91C1C', background: '#FEE2E2' }}>{fmtF(grc.tot.perdida)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-gray-900">{grc.pctGlobal.toFixed(1)}%</td>
                <td className="px-3 py-2.5" />
              </tr>
            </tbody>
          </table>
        </div>

        {GRC_MES_EN_CURSO && (
          <p className="px-5 py-2.5 text-[11px] border-t border-gray-100"
            style={{ background: '#FFFBEB', color: '#92400E' }}>
            <strong>{GRC_MES_EN_CURSO} no es el dato final: es cartera por cobrar.</strong> Zoho
            marca «Churn confirmado» todo contrato que todavía no factura, así que el mes vivo
            mide retraso de cobranza, no bajas. El churn real es el del <strong>mes vencido</strong>,
            y cada mes se afina con el tiempo conforme entran los pagos: entre el corte del 17 y
            el del 20 de septiembre, <strong>{GRC_RECUPERACION_PAGOS.cuentas} cuentas</strong>{' '}
            facturaron y salieron del churn — {fmtF(GRC_RECUPERACION_PAGOS.total)}, de los cuales{' '}
            {fmtF(GRC_RECUPERACION_PAGOS.porMes.find(m => m.mes === 'Agosto')?.monto ?? 0)} eran
            de agosto. Al cierre de mes quedará lo más cercano al número con el que cierra. Para
            comparar contra el histórico, usar el renglón de meses cerrados.
          </p>
        )}

        <p className="px-5 py-2.5 text-[11px] text-gray-400 border-t border-gray-100">
          El GRC acumulado es la suma de los porcentajes mensuales. El fraude y la reestructura
          se excluyen: en el periodo suman {fmtF(AAA_GRC_FLAT.reduce((s, r) => s + r.perdido2, 0))} y
          se reportan aparte. Esta tabla no se ve afectada por los filtros de abajo.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KpiMini icon={CalendarDays}  label="Meses"            value={String(ORDEN_MES.length)} sub={PERIODO_CORTO}     color="#7c3aed" />
        <KpiMini icon={XCircle}       label="Registros"        value={String(kpi.registros)}    sub={fClas ? `clasificación ${fClas}` : 'todas'} color="#DC2626" />
        <KpiMini icon={DollarSign}    label="Ingreso perdido"  value={fmt(kpi.perdido)}         sub="downgrade + churn" color="#EA580C" />
        <KpiMini icon={AlertTriangle} label="Churns"           value={String(kpi.churns)}       sub="bajas confirmadas" color="#DC2626" />
        <KpiMini icon={BarChart3}     label="Downgrades"       value={String(kpi.downgrades)}   sub="reducciones"       color="#D97706" />
      </div>

      {/* ── Gráfico versátil ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">
              {cfgM.label} por {DIMENSIONES[dimension].label.toLowerCase()}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">Combina el eje, la métrica y los filtros para construir la vista que necesites</p>
          </div>
        </div>

        {/* Combos */}
        <div className="grid gap-2.5 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <Combo label="Agrupar por" value={dimension} onChange={v => setDimension(v as Dimension)}
            options={Object.entries(DIMENSIONES).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Combo label="Medir" value={metrica} onChange={v => setMetrica(v as Metrica)}
            options={Object.entries(METRICAS).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Combo label="Clasificación" value={fClas} onChange={setFClas}
            options={[{ value: '', label: 'Todas' }, ...ORDEN_CLAS.map(c => ({ value: c, label: c }))]} />
          <Combo label="Movimiento" value={fMov} onChange={setFMov}
            options={[{ value: '', label: 'Todos' }, ...movimientos.map(m => ({ value: m, label: m }))]} />
        </div>

        <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 34)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 70, left: 10, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="#EEF2F7" />
            <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => esDinero ? fmt(v) : String(v)} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
              axisLine={false} tickLine={false} width={dimension === 'movimiento' ? 190 : 130} />
            <Tooltip
              formatter={(v: number) => [esDinero ? fmtF(v) : String(v), cfgM.label]}
              cursor={{ fill: 'rgba(124,58,237,.06)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((d, i) => <Cell key={i} fill={cfgM.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {chartData.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-8">Sin datos para esta combinación de filtros</p>
        )}
      </div>

      {/* ── MRR inicio vs fin ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 text-sm mb-0.5">Erosión de MRR mes a mes</h4>
        <p className="text-xs text-gray-500 mb-4">
          Con qué MRR entraron los contratos al mes y con cuál salieron{fClas ? ` · clasificación ${fClas}` : ''}
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={serieMrr} margin={{ top: 5, right: 20, left: 5, bottom: 0 }}>
            <CartesianGrid stroke="#EEF2F7" />
            <XAxis dataKey="mes" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
            <Tooltip formatter={(v: number) => fmtF(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="inicio" name="MRR inicio" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="fin"    name="MRR fin"    stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Detalle por mes ── */}
      {AAA_GRC_2026.map(mesData => {
        // El orden se aplica DESPUÉS de filtrar y sobre una copia, para que los
        // totales de abajo sigan sumando exactamente las mismas filas.
        const clientes = ordenarMes(
          mesData.clientes.filter(c =>
            (!fClas || c.clas === fClas) && (!fMov || c.movimiento === fMov)),
          ordenMes,
        )
        if (clientes.length === 0) return null
        const open = openMes[mesData.mes] ?? false
        /* "Ingreso Perdido Contrato (BCY) Real" y el fraude/reestructura se
           llevan por separado: el GRC se construye SÓLO con el real, así que
           mezclarlos aquí hacía que el mes no atara con la tabla de arriba. */
        const perdReal = clientes.reduce((s, c) => s + c.perdido, 0)
        const fraude   = clientes.reduce((s, c) => s + c.perdido2, 0)
        const perd     = perdReal + fraude
        const mrrIni = clientes.reduce((s, c) => s + c.mrrInicio, 0)
        const churns = clientes.filter(c => c.movimiento.includes('Churn')).length
        /* Cifra oficial del mes en la tabla GRC (sin filtros). Si la vista está
           filtrada se muestra al lado, para que nunca parezca que el mes
           contradice al GRC cuando en realidad está viendo un subconjunto. */
        const grcMes  = grc.filas.find(f => f.mes === mesData.mes)?.perdida ?? 0
        const filtrado = Boolean(fClas || fMov)

        return (
          <div key={mesData.mes} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors text-left"
              onClick={() => setOpenMes(p => ({ ...p, [mesData.mes]: !open }))}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
                style={{ background: '#7c3aed' }}>
                {mesData.mes.slice(0, 3).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 text-sm">{mesData.mes} 2026</span>
                  <Pill bg="#F3E8FF" fg="#6B21A8">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</Pill>
                  <Pill bg="#FEE2E2" fg="#B91C1C">Ing. perdido real {fmt(perdReal)}</Pill>
                  {fraude > 0 && <Pill bg="#FFEDD5" fg="#C2410C">+ fraude {fmt(fraude)}</Pill>}
                  {churns > 0 && <Pill bg="#FEF2F2" fg="#DC2626" border>{churns} churn{churns !== 1 ? 's' : ''}</Pill>}
                  {filtrado && <Pill bg="#EFF6FF" fg="#1D4ED8">GRC del mes {fmt(grcMes)}</Pill>}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  MRR inicio del período: {fmtF(mrrIni)}
                  {filtrado && ' · vista filtrada: no cuadra con el GRC hasta quitar los filtros'}
                </p>
              </div>
              {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                    : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
            </button>

            {open && (
              <div className="border-t border-gray-100 overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 960 }}>
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {COLUMNAS_MES.map((col, i) => {
                        const activa = ordenMes?.clave === col.clave
                        return (
                          <th key={col.corto} title={`${col.largo} — clic para ordenar`}
                            className={`py-2.5 px-3 font-semibold uppercase tracking-wide text-[10px] whitespace-nowrap
                              ${i >= 3 ? 'text-right' : 'text-left'}
                              ${col.destacada ? 'text-red-700' : 'text-gray-500'}`}
                            style={col.destacada ? { background: '#FEF2F2' } : undefined}>
                            <button
                              type="button"
                              onClick={() => setOrdenMes(prev => {
                                // Tercer clic: se vuelve al orden original del export.
                                if (prev?.clave === col.clave) {
                                  return prev.dir === (CLAVES_TEXTO.includes(col.clave) ? 'asc' : 'desc')
                                    ? { clave: col.clave, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                                    : null
                                }
                                return { clave: col.clave, dir: CLAVES_TEXTO.includes(col.clave) ? 'asc' : 'desc' }
                              })}
                              className={`inline-flex items-center gap-1 uppercase tracking-wide font-semibold
                                hover:opacity-70 transition-opacity cursor-pointer
                                ${i >= 3 ? 'flex-row-reverse' : ''}`}
                              style={{ color: 'inherit', background: 'transparent' }}>
                              {col.corto}
                              {activa
                                ? (ordenMes!.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
                                : <ArrowUpDown size={10} style={{ opacity: 0.35 }} />}
                            </button>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((c, i) => {
                      const esChurn = c.movimiento.includes('Churn')
                      const esFraude = c.movimiento.includes('Fraude')
                      const perdTotal = c.perdido + c.perdido2
                      return (
                        <tr key={i} className={`border-b border-gray-100 transition-colors ${esChurn ? 'bg-red-50/25 hover:bg-red-50/50' : 'hover:bg-gray-50/40'}`}>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{c.cliente}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{ background: c.clas === 'AAA' ? '#F3E8FF' : '#F1F5F9', color: c.clas === 'AAA' ? '#6B21A8' : '#475569' }}>
                              {c.clas}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                              style={esChurn ? { background: '#FEE2E2', color: '#B91C1C' }
                                    : esFraude ? { background: '#FFEDD5', color: '#C2410C' }
                                    : { background: '#FEF3C7', color: '#B45309' }}>
                              {c.movimiento}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums">{fmtF(c.mrrInicio)}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {c.mrrFin > 0 ? <span className="text-gray-700">{fmtF(c.mrrFin)}</span>
                                          : <span className="font-bold text-red-600">$0</span>}
                          </td>
                          {/* Ingreso Perdido Contrato (BCY) Real — el campo que alimenta el GRC */}
                          <td className="py-2.5 px-3 text-right font-bold tabular-nums"
                            title="Ingreso Perdido Contrato (BCY) Real"
                            style={{ color: c.perdido > 0 ? '#B91C1C' : '#CBD5E1', background: '#FEF2F2' }}>
                            {c.perdido > 0 ? fmtF(c.perdido) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums"
                            title="Ingreso Perdido Contrato (BCY) Fraude-Reestructura"
                            style={{ color: c.perdido2 > 0 ? '#C2410C' : '#CBD5E1' }}>
                            {c.perdido2 > 0 ? fmtF(c.perdido2) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold tabular-nums" style={{ color: perdTotal > 0 ? '#EA580C' : '#CBD5E1' }}>
                            {perdTotal > 0 ? fmtF(perdTotal) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-500 tabular-nums">{fmt(c.acumulado)}</td>
                          <td className="py-2.5 px-3 text-right text-gray-500 tabular-nums">{c.meses || '—'}</td>
                          <td className="py-2.5 px-3 text-right text-gray-500 tabular-nums">{c.facturas || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-purple-50/60 border-t-2 border-purple-100">
                      <td className="py-2.5 px-3 font-bold text-purple-800 text-[10px]" colSpan={3}>TOTAL {mesData.mes.toUpperCase()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 text-[10px] tabular-nums">{fmtF(mrrIni)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-700 text-[10px] tabular-nums">
                        {fmtF(clientes.reduce((s, c) => s + c.mrrFin, 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[10px] tabular-nums"
                        title="Ingreso Perdido Contrato (BCY) Real"
                        style={{ color: '#B91C1C', background: '#FEE2E2' }}>{fmtF(perdReal)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[10px] tabular-nums" style={{ color: '#C2410C' }}>
                        {fraude > 0 ? fmtF(fraude) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-orange-700 text-[10px] tabular-nums">{fmtF(perd)}</td>
                      <td className="py-2.5 px-3" colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {/* ── Total de los meses mostrados, para cerrar contra el GRC ───────── */}
      {(() => {
        const totReal   = filas.reduce((s, r) => s + r.perdido, 0)
        const totFraude = filas.reduce((s, r) => s + r.perdido2, 0)
        const totChurns = filas.filter(r => r.movimiento.includes('Churn')).length
        const cuadra    = Math.abs(totReal - grc.tot.perdida) < 0.005
        const filtrado  = Boolean(fClas || fMov)
        return (
          <div className="rounded-xl border shadow-sm overflow-hidden"
            style={{ borderColor: cuadra ? '#BBF7D0' : '#FDE68A', background: cuadra ? '#F0FDF4' : '#FFFBEB' }}>
            <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                style={{ background: cuadra ? '#059669' : '#D97706' }}>
                Σ
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 text-sm">
                    Total {ORDEN_MES.length} meses · {MES_INI} a {MES_FIN} 2026
                  </span>
                  <Pill bg="#F3E8FF" fg="#6B21A8">{filas.length} registros</Pill>
                  <Pill bg="#FEE2E2" fg="#B91C1C">Ing. perdido real {fmtF(totReal)}</Pill>
                  {totFraude > 0 && <Pill bg="#FFEDD5" fg="#C2410C">+ fraude {fmtF(totFraude)}</Pill>}
                  {totChurns > 0 && <Pill bg="#FEF2F2" fg="#DC2626" border>{totChurns} churns</Pill>}
                </div>
                <p className="text-[11px] mt-1" style={{ color: cuadra ? '#047857' : '#B45309' }}>
                  {cuadra
                    ? `Cuadra con el Gross Revenue Churn del periodo: ${fmtF(grc.tot.perdida)}`
                    : `Vista filtrada${filtrado ? '' : ''}: ${fmtF(totReal)} de los ${fmtF(grc.tot.perdida)} del Gross Revenue Churn. Quita los filtros para cerrar el periodo completo.`}
                </p>
              </div>
              {cuadra
                ? <CheckCircle2 size={18} style={{ color: '#059669' }} className="flex-shrink-0" />
                : <AlertTriangle size={18} style={{ color: '#D97706' }} className="flex-shrink-0" />}
            </div>
          </div>
        )
      })()}

      {/* ── Concentración AAA + AA, por asesor ─────────────────────────────
             Instrucción de dirección (22 sep 2026): el total de Churn
             confirmado y Downgrade SOLO de cuentas AAA y AA, con el asesor
             responsable. Sustituye al botón ACUMULADO de Análisis DATA.

             Se calcula sobre AAA_GRC_FLAT completo y NO sobre `filas`: los
             combos de arriba son para explorar, y este bloque tiene un recorte
             fijo que se declara en su propio título. Si dependiera de los
             filtros, el mismo encabezado mostraría cifras distintas según lo
             que alguien hubiera tocado antes. */}
      <ConcentracionAaaAa asesorDe={asesorDe} cargando={!asesores && !asesoresError}
        error={asesoresError} ambiguos={asesores?.ambiguos.length ?? 0} />

      <p className="text-[11px] text-gray-400 text-center">
        Fuente: GRC_AAA_2026.xlsx · Zoho Analytics · {PERIODO_CORTO} · {AAA_GRC_FLAT.length} registros
      </p>
    </div>
  )
}

/* ── Concentración AAA + AA ──────────────────────────────────────────── */

const MOV_CHURN = 'Churn confirmado'
const MOV_DOWNGRADE = 'Downgrade'

/** ¿La fila entra en la concentración? Solo AAA y AA, solo churn y downgrade. */
function esDeLaConcentracion(r: AAAGrcRow): 'churn' | 'downgrade' | null {
  if (r.clas !== 'AAA' && r.clas !== 'AA') return null
  const m = r.movimiento ?? ''
  // «Churn confirmado + Fraude» cuenta como churn: es la misma baja, con la
  // pérdida clasificada aparte. El importe de fraude se lleva en su columna.
  if (m.startsWith(MOV_CHURN)) return 'churn'
  if (m === MOV_DOWNGRADE) return 'downgrade'
  return null
}

function ConcentracionAaaAa({ asesorDe, cargando, error, ambiguos }: {
  asesorDe: (cliente: string) => string | null
  cargando: boolean
  error: string | null
  ambiguos: number
}) {
  const [abierto, setAbierto] = useState(false)

  const datos = useMemo(() => {
    const eventos = AAA_GRC_FLAT
      .map(r => ({ r, tipo: esDeLaConcentracion(r) }))
      .filter((x): x is { r: typeof AAA_GRC_FLAT[number]; tipo: 'churn' | 'downgrade' } => x.tipo !== null)
      .map(({ r, tipo }) => ({
        cliente: r.cliente, clas: r.clas, mes: r.mes, movimiento: r.movimiento,
        tipo, real: r.perdido, fraude: r.perdido2, mrrInicio: r.mrrInicio,
        asesor: asesorDe(r.cliente),
      }))

    // Roll-up por asesor. `null` (no está en la cartera) es su propio grupo y
    // se nombra: una cuenta sin asesor NO se reparte entre los que sí tienen.
    const porAsesor = new Map<string, {
      asesor: string; churn: number; dgs: number
      realChurn: number; realDg: number; fraude: number
    }>()
    for (const e of eventos) {
      const k = e.asesor ?? '\u0000sin'
      const cur = porAsesor.get(k) ?? {
        asesor: e.asesor ?? 'Sin asesor en la cartera',
        churn: 0, dgs: 0, realChurn: 0, realDg: 0, fraude: 0,
      }
      if (e.tipo === 'churn') { cur.churn++; cur.realChurn += e.real }
      else                    { cur.dgs++;   cur.realDg    += e.real }
      cur.fraude += e.fraude
      porAsesor.set(k, cur)
    }
    const filas = Array.from(porAsesor.values())
      .sort((a, b) => (b.realChurn + b.realDg) - (a.realChurn + a.realDg))

    const tot = {
      churn:     eventos.filter(e => e.tipo === 'churn').length,
      dgs:       eventos.filter(e => e.tipo === 'downgrade').length,
      realChurn: eventos.filter(e => e.tipo === 'churn').reduce((s, e) => s + e.real, 0),
      realDg:    eventos.filter(e => e.tipo === 'downgrade').reduce((s, e) => s + e.real, 0),
      fraude:    eventos.reduce((s, e) => s + e.fraude, 0),
      sinAsesor: eventos.filter(e => e.asesor === null).length,
    }
    // La tabla por asesor tiene que sumar lo mismo que el total: si un día se
    // filtra un grupo sin querer, esto lo delata en pantalla en vez de cuadrar
    // solo en apariencia.
    const cierra = filas.reduce((s, f) => s + f.churn + f.dgs, 0) === tot.churn + tot.dgs

    return { eventos, filas, tot, cierra }
  }, [asesorDe])

  const { eventos, filas, tot, cierra } = datos
  const totalReal = tot.realChurn + tot.realDg

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100" style={{ background: '#F5F3FF' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <Users size={15} style={{ color: '#6B21A8' }} />
          <h3 className="text-sm font-bold text-gray-900">
            Concentración por asesor — Churn confirmado y Downgrade
          </h3>
          <Pill bg="#F3E8FF" fg="#6B21A8">solo AAA y AA</Pill>
          <Pill bg="#EFF6FF" fg="#1D4ED8">{PERIODO_CORTO}</Pill>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">
          Recorte fijo: no lo cambian los combos de arriba. {eventos.length} evento
          {eventos.length !== 1 ? 's' : ''} de {AAA_GRC_FLAT.length} registros del período.
        </p>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        <KpiMini icon={XCircle} label="Churn confirmado" value={fmtF(tot.realChurn)}
          sub={`${tot.churn} cuenta${tot.churn !== 1 ? 's' : ''} AAA/AA`} color="#DC2626" />
        <KpiMini icon={AlertTriangle} label="Downgrade" value={fmtF(tot.realDg)}
          sub={`${tot.dgs} cuenta${tot.dgs !== 1 ? 's' : ''} AAA/AA`} color="#D97706" />
        <KpiMini icon={DollarSign} label="Ingreso perdido real" value={fmtF(totalReal)}
          sub="Churn + Downgrade · es lo que alimenta el GRC" color="#B91C1C" />
        <KpiMini icon={AlertTriangle} label="Fraude / reestructura" value={fmtF(tot.fraude)}
          sub="Va aparte: el GRC NO lo incluye" color="#C2410C" />
      </div>

      {/* Aviso de cobertura del asesor — el hueco se dice, no se rellena */}
      {(cargando || error || tot.sinAsesor > 0 || ambiguos > 0 || !cierra) && (
        <div className="mx-4 mb-3 rounded-lg px-3 py-2 text-[11px] leading-relaxed"
          style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>
          {cargando && 'Cargando la cartera para atribuir el asesor…'}
          {error && `No se pudo leer la cartera (${error}): la columna de asesor va vacía. El resto de las cifras no depende de ella.`}
          {!cargando && !error && tot.sinAsesor > 0 && (
            <>
              <strong>{tot.sinAsesor}</strong> de {eventos.length} evento{eventos.length !== 1 ? 's' : ''} no
              tiene asesor porque su cliente no está en la cartera CS —el export de GRC viene de Zoho sin
              CID y el cruce es por nombre—. Van en su propio grupo, <strong>no</strong> repartidos entre
              los asesores.
            </>
          )}
          {ambiguos > 0 && ` ${ambiguos} nombre(s) coinciden con más de una cuenta de distinto asesor: a ésos no se les atribuye ninguno.`}
          {!cierra && ' ⚠ La tabla por asesor NO suma el total: revisar antes de reportar.'}
        </div>
      )}

      {/* Por asesor */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ minWidth: 640 }}>
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {['Asesor', 'Churns', 'Perdido por churn', 'Downgrades', 'Perdido por downgrade', 'Total real'].map((h, i) => (
                <th key={h} className={`py-2.5 px-3 font-semibold uppercase tracking-wide text-[10px] text-gray-500 whitespace-nowrap ${i === 0 ? 'text-left' : 'text-right'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map(f => {
              const sinAsesor = f.asesor === 'Sin asesor en la cartera'
              return (
                <tr key={f.asesor} className="border-b border-gray-100 hover:bg-gray-50/40">
                  <td className="py-2.5 px-3 font-semibold" style={{ color: sinAsesor ? '#9A3412' : '#111827' }}>
                    {f.asesor}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{f.churn || '—'}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: f.realChurn > 0 ? '#B91C1C' : '#CBD5E1' }}>
                    {f.realChurn > 0 ? fmtF(f.realChurn) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{f.dgs || '—'}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: f.realDg > 0 ? '#D97706' : '#CBD5E1' }}>
                    {f.realDg > 0 ? fmtF(f.realDg) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-gray-900">
                    {fmtF(f.realChurn + f.realDg)}
                  </td>
                </tr>
              )
            })}
            <tr className="border-t-2 border-gray-200" style={{ background: '#F8FAFC' }}>
              <td className="py-3 px-3 font-bold text-gray-900">TOTAL AAA + AA</td>
              <td className="py-3 px-3 text-right tabular-nums font-bold text-gray-900">{tot.churn}</td>
              <td className="py-3 px-3 text-right tabular-nums font-bold" style={{ color: '#B91C1C' }}>{fmtF(tot.realChurn)}</td>
              <td className="py-3 px-3 text-right tabular-nums font-bold text-gray-900">{tot.dgs}</td>
              <td className="py-3 px-3 text-right tabular-nums font-bold" style={{ color: '#D97706' }}>{fmtF(tot.realDg)}</td>
              <td className="py-3 px-3 text-right tabular-nums font-bold text-gray-900">{fmtF(totalReal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detalle cuenta por cuenta */}
      <button onClick={() => setAbierto(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
        <span className="text-xs font-semibold text-gray-600">
          {abierto ? 'Ocultar' : 'Ver'} las {eventos.length} cuentas, una por una
        </span>
        {abierto ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {abierto && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 780 }}>
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {['Cliente', 'Clas.', 'Mes', 'Movimiento', 'Asesor', 'Perdido real', 'Fraude'].map((h, i) => (
                  <th key={h} className={`py-2.5 px-3 font-semibold uppercase tracking-wide text-[10px] text-gray-500 whitespace-nowrap ${i >= 5 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...eventos]
                .sort((a, b) => b.real - a.real)
                .map((e, i) => (
                  <tr key={`${e.cliente}-${e.mes}-${i}`}
                    className={`border-b border-gray-100 ${e.tipo === 'churn' ? 'bg-red-50/25' : ''} hover:bg-gray-50/40`}>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{e.cliente}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: '#F3E8FF', color: '#6B21A8' }}>{e.clas}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{e.mes}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                        style={e.tipo === 'churn' ? { background: '#FEE2E2', color: '#B91C1C' }
                                                  : { background: '#FEF3C7', color: '#B45309' }}>
                        {e.movimiento}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {e.asesor
                        ? <span className="font-medium text-gray-700">{e.asesor}</span>
                        : <span className="text-[11px]" style={{ color: '#9A3412' }}>
                            {cargando ? 'cargando…' : 'sin asesor en la cartera'}
                          </span>}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold" style={{ color: e.real > 0 ? '#B91C1C' : '#CBD5E1' }}>
                      {e.real > 0 ? fmtF(e.real) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: e.fraude > 0 ? '#C2410C' : '#CBD5E1' }}>
                      {e.fraude > 0 ? fmtF(e.fraude) : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Auxiliares ──────────────────────────────────────────────────────── */
function Combo({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <CustomSelect value={value} onChange={onChange} options={options} className="cp-select text-xs" />
    </div>
  )
}

function KpiMini({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-500 font-medium">{label}</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums truncate" style={{ color }}>{value}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function Pill({ children, bg, fg, border }: { children: React.ReactNode; bg: string; fg: string; border?: boolean }) {
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: bg, color: fg, border: border ? `1px solid ${fg}33` : undefined }}>
      {children}
    </span>
  )
}
