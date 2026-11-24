'use client'
/* ═══════════════════════════════════════════════════════════════════════════
   CHURN A NIVEL CUENTA
   Informe «Gross Revenue Churn por clasificación de cuenta · Ene–Oct 2026».

   LO QUE ESTA PANTALLA TIENE QUE DEJAR CLARO, Y ES LA RAZÓN DE QUE EXISTA
   ----------------------------------------------------------------------
   El informe audita una cifra que NOSOTROS enseñamos: el «GRC acumulado
   24.7%» de la tabla de origen —el mismo número que publica la tarjeta del
   corte de Análisis DATA— es una SUMA ARITMÉTICA de las tasas mensuales, no
   la porción de cartera perdida. Las tres lecturas del mismo año salen de los
   mismos datos y se enseñan juntas, nunca una sola.
   [[feedback-metricas-derivadas-origen]]

   NOVIEMBRE VA APARTE EN TODA LA PANTALLA. Es mes en tránsito: el propio
   informe se niega a concluir sobre él. Ninguna tarjeta del periodo cerrado
   lo suma. [[regla-churn-mes-vencido]]

   COLOR — esta pantalla es SUPERFICIE CLARA (página `#F5F8FB`, tarjetas
   blancas), así que la letra va oscura y los tonos vivos sólo rellenan.
   Los `_TX` los calcula `tonoSobreClaro` contra el tinte real.
   [[atlas-dashboard-contrast-architecture]]
═══════════════════════════════════════════════════════════════════════════ */
import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  AlertTriangle, ArrowUpDown, CalendarClock, Layers, Users, Clock,
  ListTree, Target, Sigma, Search, ChevronLeft, ChevronRight, Info,
  ExternalLink,
} from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import { CHURN_CUENTA_META as M, CUENTAS_CHURN } from '@/app/churn/cuenta-data'
import { tonoSobreClaro } from '@/lib/contraste'

/* ── Paleta ──────────────────────────────────────────────────────────────
   Los vivos rellenan barras, puntos y bordes. Como LETRA no sirven sobre
   blanco: para eso están las variantes `_TX`, oscurecidas hasta medir 4.5:1
   contra su propio tinte al 22%. */
const RED    = '#ef4444'
const AMBER  = '#f59e0b'
const MARINO = '#10355D'
const AZUL   = '#1D6CAA'
const TEAL   = '#0d9488'
const RED_TX   = tonoSobreClaro(RED, 0.22)
const AMBER_TX = tonoSobreClaro(AMBER, 0.22)
const TEAL_TX  = tonoSobreClaro(TEAL, 0.22)
/* El azul vivo sobre su propio tinte al 12% no mide: la pastilla de familia
   del plan usa esta variante, no `AZUL`. `AZUL` a secas sólo vale sobre
   blanco (5.56:1), que es donde se usa como acento de rótulo. */
const AZUL_TX  = tonoSobreClaro(AZUL, 0.12)

/* El tinte del mapa de calor es UN solo tono (marino) y se topa en 0.28.
   Medido sobre blanco: a 0.30 la tinta secundaria `#3D4B5C` todavía mide
   4.93:1 y la principal `#202E3B`, 7.67:1. Por debajo del tope, más. */
const TINTE_MAX = 0.28

const fmt  = (n: number) => '$' + n.toLocaleString('es-MX', { maximumFractionDigits: 0 })
const fmtF = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct  = (n: number, d = 1) => n.toFixed(d) + '%'

/* ── Lo que la pantalla mide, no lo que le cuentan ───────────────────────
   Todo lo de aquí se recalcula de la rejilla del informe. Un número que la
   pantalla tecleara a mano dejaría de ser un espejo del dato en cuanto el
   corte cambiara. [[feedback-verificar-antes-asegurar]] */
const NC    = M.mesesCerrados              // 10 → ene..oct cerrados
const CLASES = M.clases                     // AAA · AA · A · B · C — es una ESCALA
const MESES  = M.meses
const CER    = M.cerrado
const TRA    = M.transito

type Clase = (typeof CLASES)[number]

/* ── LA REJILLA TIENE CINCO CLASES Y LAS CUENTAS TIENEN MÁS ──────────────
   El informe agrega por AAA · AA · A · B · C, pero una cuenta puede traer
   una clasificación COMPUESTA porque cambió de banda dentro del año
   («AA/AAA»). Si los filtros y las tablas de cuentas sólo conocen las cinco,
   esa cuenta queda inalcanzable por filtro y su dinero se cae de los
   subtotales SIN QUE NADA FALLE: la tabla sumaría 120 de 121 y se vería
   perfecta. De ahí que las clases de las CUENTAS se deriven del dato y que
   cada tabla agregada lleve su fila de cierre.
   [[feedback-tablas-deben-cerrar]] */
const CLASES_CUENTA: string[] = (() => {
  const vistas = Array.from(new Set(CUENTAS_CHURN.map(c => c.cl)))
  /* `cl` es una ESCALA, no texto: de la A a la Z «AA» iría antes que «AAA».
     Lo que no está en la escala va al final, nunca colado arriba. */
  return vistas.sort((a, b) => {
    const ia = CLASES.indexOf(a as Clase), ib = CLASES.indexOf(b as Clase)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'es')
  })
})()
const ordenClase = (cl: string) => {
  const i = CLASES.indexOf(cl as Clase)
  return i < 0 ? 99 : i
}

/* `as const` en el dataset vuelve cada número un tipo literal, así que las
   sumas se anotan explícitamente como `number`. */
const sc = (c: Clase, k: 'ch' | 'dg' | 'nch' | 'ndg' | 'fr', a: number, b: number) =>
  M.cell[c][k].slice(a, b).reduce<number>((s, x) => s + x, 0)
const sx = (k: 'ch' | 'dg' | 'nch' | 'ndg' | 'fr', a: number, b: number) =>
  CLASES.reduce<number>((s, c) => s + sc(c, k, a, b), 0)

/** Pérdida del periodo CERRADO por clasificación, con todo lo que se deriva. */
const PorClase = CLASES.map(c => {
  const ch = sc(c, 'ch', 0, NC)
  const dg = sc(c, 'dg', 0, NC)
  const nch = sc(c, 'nch', 0, NC)
  const ndg = sc(c, 'ndg', 0, NC)
  return {
    clase: c,
    ch, dg, nch, ndg,
    perdida: ch + dg,
    fraude: sc(c, 'fr', 0, NC),
    cuota: (ch + dg) / CER.bruta * 100,
    /* Puntos porcentuales sobre el MRR TOTAL, nunca «% del segmento»: el
       archivo no trae MRR inicial por clasificación, así que una tasa propia
       por segmento no se puede calcular. Se dice con palabras abajo. */
    pp: (ch + dg) / CER.base * 100,
    cuotaBajas: nch / sx('nch', 0, NC) * 100,
    medioPorBaja: nch ? ch / nch : 0,
    dgShare: (ch + dg) ? dg / (ch + dg) * 100 : 0,
  }
})

/** Las cuentas que bajaron de plan y DESPUÉS cancelaron dentro del cerrado. */
const VENTANA = CUENTAS_CHURN.filter(
  c => c.dgch && c.ev.some(e => e[0] <= NC && e[1] === 'C'))
const VENTANA_MRR = VENTANA.reduce((s, c) => s + c.lOct, 0)

const NUESTRAS = CUENTAS_CHURN.filter(c => !!c.cons)
const NUESTRAS_MRR = NUESTRAS.reduce((s, c) => s + c.lOct, 0)

const ORDEN_PERDIDA = [...CUENTAS_CHURN].sort((a, b) => b.lOct - a.lOct)
const acumTop = (n: number) =>
  ORDEN_PERDIDA.slice(0, n).reduce((s, c) => s + c.lOct, 0) / CER.bruta * 100
/** Cuántas cuentas hacen falta para explicar el `objetivo`% de la pérdida. */
function cuentasPara(objetivo: number) {
  let acc = 0
  for (let i = 0; i < ORDEN_PERDIDA.length; i++) {
    acc += ORDEN_PERDIDA[i].lOct
    if (acc / CER.bruta * 100 >= objetivo) return i + 1
  }
  return ORDEN_PERDIDA.length
}

const PROM_MES_CERRADO = CER.bruta / NC

type Sub = 'resumen' | 'clase' | 'antiguedad' | 'cuentas' | 'cartera' | 'transito' | 'hallazgos'

const SUBS: { id: Sub; label: string; icon: React.ReactNode }[] = [
  { id: 'resumen',    label: 'Resumen',            icon: <Sigma size={13} /> },
  { id: 'clase',      label: 'Por clasificación',  icon: <Layers size={13} /> },
  { id: 'antiguedad', label: 'Por antigüedad',     icon: <Clock size={13} /> },
  { id: 'cuentas',    label: 'Cuentas',            icon: <ListTree size={13} /> },
  { id: 'cartera',    label: 'Nuestra cartera',    icon: <Users size={13} /> },
  { id: 'transito',   label: 'Noviembre',          icon: <CalendarClock size={13} /> },
  { id: 'hallazgos',  label: 'Hallazgos y plan',   icon: <Target size={13} /> },
]

/* ═══════════════════════════════════════════════════════════════════════════
   PIEZAS
═══════════════════════════════════════════════════════════════════════════ */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function Titulo({ icon, children, nota }: { icon?: React.ReactNode; children: React.ReactNode; nota?: string }) {
  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{children}</span>
      </div>
      {nota && <p className="text-xs text-gray-500 mt-1">{nota}</p>}
    </div>
  )
}

function Kpi({ label, valor, pie, color = MARINO }: {
  label: string; valor: string; pie?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
      style={{ borderTop: `3px solid ${color}` }}>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1 text-gray-900">{valor}</p>
      {pie && <p className="text-xs text-gray-500 mt-1 leading-snug">{pie}</p>}
    </div>
  )
}

/** Un bloque de lectura del informe. Es prosa del origen, y se rotula. */
function Lectura({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-600 leading-relaxed px-4 py-3 border-t border-gray-100">
      <span className="font-semibold" style={{ color: AZUL }}>Lectura del informe · </span>
      {children}
    </p>
  )
}

/** Aviso de los que NO se pueden callar: el dato que cambia la conclusión. */
function Aviso({ tono = AMBER, titulo, children }: {
  tono?: string; titulo: string; children: React.ReactNode
}) {
  const tx = tono === RED ? RED_TX : tono === TEAL ? TEAL_TX : AMBER_TX
  return (
    <div className="rounded-xl p-4 border" style={{ background: tono + '14', borderColor: tono + '55' }}>
      <div className="flex items-start gap-2">
        <AlertTriangle size={15} style={{ color: tx, flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-bold" style={{ color: tx }}>{titulo}</p>
          <div className="text-xs text-gray-700 mt-1 leading-relaxed space-y-1">{children}</div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECCIÓN
═══════════════════════════════════════════════════════════════════════════ */
export default function ChurnCuentaSection() {
  const [sub, setSub] = useState<Sub>('resumen')

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 py-4 space-y-4">

        {/* Cabecera del módulo */}
        <Card>
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">{M.informe}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Corte al {M.corte} · periodo cerrado {M.periodoCerrado} ·{' '}
                {M.movimientos.toLocaleString('es-MX')} movimientos de pérdida sobre{' '}
                {M.cuentasFuente.toLocaleString('es-MX')} cuentas
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Fuente</p>
              <p className="text-xs text-gray-700 max-w-sm">{M.fuente}</p>
              {/* El informe entero, servido desde `public/auditorias/`: la
                  carpeta que el middleware exige sesión para entregar y que
                  el Service Worker NO precachea. Lleva 1,373 nombres de
                  cliente, así que dónde vive no es un detalle.
                  `AZUL` mide 5.56:1 sobre blanco; aquí no hay `.cp-card`. */}
              <a href={M.enlace} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold hover:underline"
                style={{ color: AZUL }}>
                <ExternalLink size={12} />
                Abrir el informe completo
              </a>
            </div>
          </div>
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {SUBS.map(s => (
              <button key={s.id} onClick={() => setSub(s.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                style={sub === s.id
                  ? { background: MARINO, color: '#fff' }
                  : { background: '#EAF0F5', color: '#3D4B5C' }}>
                {s.icon}{s.label}
              </button>
            ))}
          </div>
        </Card>

        {sub === 'resumen'    && <Resumen />}
        {sub === 'clase'      && <PorClasificacion />}
        {sub === 'antiguedad' && <Antiguedad />}
        {sub === 'cuentas'    && <Cuentas />}
        {sub === 'cartera'    && <Cartera />}
        {sub === 'transito'   && <Transito />}
        {sub === 'hallazgos'  && <Hallazgos />}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── RESUMEN ── */
function Resumen() {
  const serieMes = MESES.map((m, i) => ({
    mes: m,
    tasa: M.tasas[i],
    perdida: CLASES.reduce((s, c) => s + M.cell[c].ch[i] + M.cell[c].dg[i], 0),
    cerrado: i < NC,
  }))

  return (
    <div className="space-y-4">

      {/* EL HALLAZGO QUE TOCA A NUESTRO PROPIO TABLERO */}
      <Aviso tono={RED} titulo="El «24.7% acumulado» es una suma de tasas mensuales, no cartera perdida">
        <p>
          La tabla de origen —y la tarjeta «GRC acumulado 2026» de nuestro corte de
          Análisis DATA— publica <b>{pct(CER.sumaAritmetica, 2)}</b>. Ese número es{' '}
          {MESES.slice(0, NC).map((m, i) => `${M.tasas[i].toFixed(2)}`).join(' + ')}: la suma
          aritmética de las diez tasas mensuales. Sumar tasas de meses distintos no da la
          porción de cartera perdida, porque cada mes se mide sobre una base distinta.
        </p>
        <p>
          Lo que de verdad se perdió en los diez meses cerrados es{' '}
          <b>{fmtF(CER.bruta)}</b> sobre una base de <b>{fmtF(CER.base)}</b>:
          un <b>GRC ponderado de {pct(CER.ponderado, 2)}</b>. La lectura de retención
          compuesta —la que responde «qué fracción de la cartera de enero ya no está»— da{' '}
          <b>{pct(CER.compuesta, 2)}</b>. Son tres números del mismo año y el tablero
          enseñaba sólo el mayor.
        </p>
      </Aviso>

      {/* Las tres lecturas, lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Kpi label="GRC ponderado · ene–oct" valor={pct(CER.ponderado, 2)}
          color={MARINO}
          pie={`${fmtF(CER.bruta)} perdidos sobre ${fmt(CER.base)} de base acumulada. Es la proporción real del dinero.`} />
        <Kpi label="Retención compuesta" valor={pct(CER.compuesta, 2)}
          color={AZUL}
          pie="1 − Π(1 − tasa del mes). Responde «qué parte de la cartera de enero ya no está»." />
        <Kpi label="Suma aritmética (la publicada)" valor={pct(CER.sumaAritmetica, 2)}
          color={RED}
          pie="Las diez tasas mensuales sumadas. Es la cifra que enseña la tabla de origen y nuestra propia tarjeta." />
      </div>

      {/* Composición del periodo cerrado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Pérdida bruta ene–oct" valor={fmt(CER.bruta)} color={RED}
          pie={`${CER.bajas.toLocaleString('es-MX')} bajas y ${CER.downgradesN.toLocaleString('es-MX')} downgrades`} />
        <Kpi label="Cancelaciones" valor={fmt(CER.cancelaciones)} color={RED}
          pie={`${pct(CER.cancelaciones / CER.bruta * 100)} de la pérdida`} />
        <Kpi label="Downgrades" valor={fmt(CER.downgrades)} color={AMBER}
          pie={`${pct(CER.downgrades / CER.bruta * 100)} de la pérdida — erosión sin baja`} />
        <Kpi label="Fraude / reestructura" valor={fmt(CER.fraude)} color={TEAL}
          pie="EXCLUIDO del GRC confirmado. Con él dentro el ponderado sería 2.99%." />
      </div>

      {/* Tasa mensual */}
      <Card>
        <Titulo icon={<Sigma size={14} className="text-gray-400" />}
          nota="Cada mes sobre SU propia base de MRR inicial. Noviembre se pinta en ámbar porque es mes en tránsito: está para verlo, no para sumarlo.">
          Tasa de Gross Revenue Churn mes a mes
        </Titulo>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={serieMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#667384' }} />
              <YAxis tick={{ fontSize: 11, fill: '#667384' }}
                tickFormatter={(v: number) => v + '%'} />
              <Tooltip formatter={(v: number, _n, p) => [
                `${v.toFixed(2)}%  ·  ${fmtF((p.payload as { perdida: number }).perdida)}`,
                (p.payload as { cerrado: boolean }).cerrado ? 'Mes cerrado' : 'Mes en tránsito',
              ]} />
              <Bar dataKey="tasa" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {serieMes.map((d, i) => (
                  <Cell key={i} fill={d.cerrado ? (i === NC - 1 ? RED : MARINO) : AMBER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-2">
            <span className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, background: MARINO, borderRadius: 2, display: 'inline-block' }} />
              Mes cerrado
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, background: RED, borderRadius: 2, display: 'inline-block' }} />
              Octubre — el mes que rompe el patrón
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, background: AMBER, borderRadius: 2, display: 'inline-block' }} />
              Noviembre en tránsito — NO entra en ningún acumulado
            </span>
          </div>
        </div>
        <Lectura>{M.lectura.r2}</Lectura>
      </Card>

      {/* Octubre y noviembre, cada uno con su marco */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <Titulo icon={<AlertTriangle size={14} style={{ color: RED_TX }} />}>
            Octubre rompe el patrón
          </Titulo>
          <div className="p-4 text-xs text-gray-700 space-y-2 leading-relaxed">
            <p>
              <b className="text-gray-900">{fmtF(sx('ch', NC - 1, NC) + sx('dg', NC - 1, NC))}</b> en un solo mes:
              el {pct((sx('ch', NC - 1, NC) + sx('dg', NC - 1, NC)) / CER.bruta * 100)} de todo el periodo
              cerrado y {((sx('ch', NC - 1, NC) + sx('dg', NC - 1, NC)) / PROM_MES_CERRADO).toFixed(1)} veces
              el mes promedio.
            </p>
            <p>
              {sx('nch', NC - 1, NC).toLocaleString('es-MX')} bajas contra{' '}
              {(sx('nch', 0, NC - 1) / (NC - 1)).toFixed(0)} de promedio mensual en ene–sep. Las cancelaciones
              son {fmt(sx('ch', NC - 1, NC))}, el {pct(sx('ch', NC - 1, NC) / (sx('ch', NC - 1, NC) + sx('dg', NC - 1, NC)) * 100)} del mes.
            </p>
            <p className="text-gray-500">
              <b>Sin confirmar:</b> si es churn de mercado o un registro de bajas en bloque. Las cinco
              clasificaciones se duplican a la vez y el 60% de esas cuentas llevaba 9 facturas emitidas
              en 2026 — seguían facturándose el mes anterior. Falta motivo y fecha de solicitud.
            </p>
          </div>
        </Card>

        <Card>
          <Titulo icon={<CalendarClock size={14} style={{ color: AMBER_TX }} />}>
            {M.mesEnTransito} va aparte
          </Titulo>
          <div className="p-4 text-xs text-gray-700 space-y-2 leading-relaxed">
            <p>
              <b className="text-gray-900">{fmtF(TRA.perdida)}</b> preliminares —{pct(TRA.tasa, 2)} sobre
              su base— en {TRA.bajas.toLocaleString('es-MX')} bajas y {TRA.downgradesN} downgrades.
              Es el {pct(TRA.perdida / CER.bruta * 100)} de los diez meses cerrados juntos.
            </p>
            <p>
              <b>No se suma a nada de esta pantalla.</b> El churn del mes vivo mide retraso de cobranza
              tanto como pérdida: una cuenta que todavía no factura aparece marcada y puede pagar tarde.
            </p>
          </div>
        </Card>
      </div>

      {/* Concentración */}
      <Card>
        <Titulo icon={<ListTree size={14} className="text-gray-400" />}
          nota="Ordenadas por pérdida del periodo cerrado. Mide si el año se explica con unas pocas cuentas o con muchas.">
          ¿Está concentrada la pérdida?
        </Titulo>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[10, 25, 50, 100].map(n => (
            <div key={n} className="rounded-lg p-3" style={{ background: '#F5F8FB' }}>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Top {n} cuentas</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{pct(acumTop(n))}</p>
              <p className="text-[11px] text-gray-500">{fmt(ORDEN_PERDIDA.slice(0, n).reduce((s, c) => s + c.lOct, 0))}</p>
            </div>
          ))}
        </div>
        <p className="px-4 pb-4 text-xs text-gray-600 leading-relaxed">
          Hacen falta <b className="text-gray-900">{cuentasPara(50)}</b> cuentas para explicar la mitad de la
          pérdida y <b className="text-gray-900">{cuentasPara(80)}</b> para el 80%. No es una concentración
          puntual: es un patrón amplio. Las diez primeras sí son todas AAA.
        </p>
        <Lectura>{M.lectura.r5}</Lectura>
      </Card>
    </div>
  )
}

/* ──────────────────────────────────────────────────────── CLASIFICACIÓN ── */
function PorClasificacion() {
  /* El mapa de calor se tiñe con UN tono y el máximo del periodo CERRADO.
     Noviembre va sin teñir: medirlo con la misma escala sería pintarlo como
     si fuera comparable. */
  const maxCelda = Math.max(...CLASES.flatMap(c =>
    Array.from({ length: NC }, (_, i) => M.cell[c].ch[i] + M.cell[c].dg[i])))

  const datosBarra = PorClase.map(p => ({ clase: p.clase, perdida: p.perdida }))

  return (
    <div className="space-y-4">
      <Aviso tono={TEAL} titulo="Aquí no hay «tasa por clasificación», y no es un olvido">
        <p>
          El archivo sólo trae cuentas CON pérdida: no hay MRR inicial ni número de cuentas
          activas por segmento. Sin denominador propio, decir «AAA se cae más» sería inventarlo.
          Todo lo de abajo va en <b>puntos porcentuales sobre el MRR total</b> —cuánto aporta cada
          clase al {pct(CER.ponderado, 2)} del año— y en reparto de la pérdida, nunca en «% del segmento».
        </p>
      </Aviso>

      <Card>
        <Titulo icon={<Layers size={14} className="text-gray-400" />}
          nota={`Pérdida bruta del periodo cerrado (${M.periodoCerrado}). La longitud de la barra es el dato; el nombre lo dice el eje.`}>
          Pérdida por clasificación
        </Titulo>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={datosBarra} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#667384' }}
                tickFormatter={(v: number) => fmt(v)} />
              <YAxis type="category" dataKey="clase" width={48}
                tick={{ fontSize: 12, fill: '#3D4B5C' }} />
              <Tooltip formatter={(v: number) => [fmtF(v), 'Pérdida ene–oct']} />
              <Bar dataKey="perdida" fill={MARINO} radius={[0, 4, 4, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="py-2 px-3 text-left font-semibold">Clas.</th>
                <th className="py-2 px-3 text-right font-semibold">Pérdida ene–oct</th>
                <th className="py-2 px-3 text-right font-semibold">% de la pérdida</th>
                <th className="py-2 px-3 text-right font-semibold">Aporte al GRC (pp)</th>
                <th className="py-2 px-3 text-right font-semibold">Bajas</th>
                <th className="py-2 px-3 text-right font-semibold">% de las bajas</th>
                <th className="py-2 px-3 text-right font-semibold">MRR medio por baja</th>
                <th className="py-2 px-3 text-right font-semibold">Downgrades</th>
                <th className="py-2 px-3 text-right font-semibold">% de su pérdida que es downgrade</th>
              </tr>
            </thead>
            <tbody>
              {PorClase.map(p => (
                <tr key={p.clase} className="border-t border-gray-100">
                  <td className="py-2 px-3 font-bold text-gray-900">{p.clase}</td>
                  <td className="py-2 px-3 text-right text-gray-900">{fmtF(p.perdida)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{pct(p.cuota)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{p.pp.toFixed(2)} pp</td>
                  <td className="py-2 px-3 text-right text-gray-700">{p.nch.toLocaleString('es-MX')}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{pct(p.cuotaBajas)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{fmt(p.medioPorBaja)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{p.ndg.toLocaleString('es-MX')}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{pct(p.dgShare)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <td className="py-2 px-3 text-gray-900">TOTAL</td>
                <td className="py-2 px-3 text-right text-gray-900">{fmtF(CER.bruta)}</td>
                <td className="py-2 px-3 text-right text-gray-700">100.0%</td>
                <td className="py-2 px-3 text-right text-gray-700">{CER.ponderado.toFixed(2)} pp</td>
                <td className="py-2 px-3 text-right text-gray-700">{CER.bajas.toLocaleString('es-MX')}</td>
                <td className="py-2 px-3 text-right text-gray-700">100.0%</td>
                <td className="py-2 px-3 text-right text-gray-700">{fmt(CER.cancelaciones / CER.bajas)}</td>
                <td className="py-2 px-3 text-right text-gray-700">{CER.downgradesN.toLocaleString('es-MX')}</td>
                <td className="py-2 px-3 text-right text-gray-700">{pct(CER.downgrades / CER.bruta * 100)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Lectura>{M.lectura.r6}</Lectura>
        <Lectura>{M.lectura.r4}</Lectura>
      </Card>

      {/* Mapa de calor */}
      <Card>
        <Titulo icon={<Layers size={14} className="text-gray-400" />}
          nota="Pérdida bruta (cancelación + downgrade). El tinte se calcula contra el máximo del periodo CERRADO; noviembre va sin teñir a propósito, por ser mes en tránsito.">
          Clasificación × mes
        </Titulo>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="py-2 px-3 text-left font-semibold">Clas.</th>
                {MESES.map((m, i) => (
                  <th key={m} className="py-2 px-2 text-right font-semibold">
                    {m}{i >= NC ? ' *' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLASES.map(c => (
                <tr key={c} className="border-t border-gray-100">
                  <td className="py-2 px-3 font-bold text-gray-900">{c}</td>
                  {MESES.map((m, i) => {
                    const vivo = i >= NC
                    const v = M.cell[c].ch[i] + M.cell[c].dg[i]
                    /* UN solo tono y UNA sola expresión de fondo, siempre
                       clara: el tinte se topa en TINTE_MAX y el mes en
                       tránsito va con alfa 0, que es la forma de decir «este
                       no está en la escala» sin inventarle un color.
                       La cursiva y la tinta secundaria lo separan a la vista. */
                    const alfa = vivo ? 0 : Math.min(TINTE_MAX, v / maxCelda * TINTE_MAX)
                    return (
                      <td key={m} className="py-2 px-2 text-right tabular-nums"
                        style={{
                          background: `rgba(16,53,93,${alfa.toFixed(3)})`,
                          color: vivo ? '#3D4B5C' : '#202E3B',
                          fontStyle: vivo ? 'italic' : 'normal',
                          borderLeft: vivo ? '2px solid #DFE8EF' : undefined,
                        }}>
                        {v ? fmt(v) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <td className="py-2 px-3 text-gray-900">Tasa</td>
                {MESES.map((m, i) => (
                  <td key={m} className="py-2 px-2 text-right text-gray-700 tabular-nums">
                    {M.tasas[i].toFixed(2)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-[11px] text-gray-500">
          * {M.mesEnTransito}: mes en tránsito, sin escala de color y fuera de todo acumulado.
        </p>
        <Lectura>{M.lectura.rHeat}</Lectura>
        <Lectura>{M.lectura.r1}</Lectura>
        <Lectura>{M.lectura.r3}</Lectura>
      </Card>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────── ANTIGÜEDAD ── */
function Antiguedad() {
  const total = M.tenure.reduce((s, t) => s + t.l, 0)
  const datos = M.tenure.map(t => ({ tramo: t.b + ' meses', perdida: t.l, n: t.n }))
  const largos = M.tenure.filter(t => t.b === '25-48' || t.b === '49+')
  const mrrLargos = largos.reduce((s, t) => s + t.l, 0)

  return (
    <div className="space-y-4">
      <Aviso tono={RED} titulo="La antigüedad no protege">
        <p>
          <b>{fmtF(mrrLargos)}</b> —el {pct(mrrLargos / total * 100)} de la pérdida del periodo
          cerrado— viene de cuentas con <b>25 meses o más</b> de relación. Las de 49 meses o más,
          por sí solas, cargan el {pct(M.tenure[M.tenure.length - 1].l / total * 100)}. La idea de
          que el cliente viejo está seguro no se sostiene en este dato.
        </p>
      </Aviso>

      <Card>
        <Titulo icon={<Clock size={14} className="text-gray-400" />}
          nota="Meses activos de la cuenta al momento de la pérdida. Los tramos suman exactamente el periodo cerrado.">
          Pérdida por antigüedad
        </Titulo>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
              <XAxis dataKey="tramo" tick={{ fontSize: 11, fill: '#667384' }} />
              <YAxis tick={{ fontSize: 11, fill: '#667384' }} tickFormatter={(v: number) => fmt(v)} />
              <Tooltip formatter={(v: number) => [fmtF(v), 'Pérdida ene–oct']} />
              <Bar dataKey="perdida" fill={MARINO} radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="py-2 px-3 text-left font-semibold">Tramo</th>
                <th className="py-2 px-3 text-right font-semibold">Pérdida</th>
                <th className="py-2 px-3 text-right font-semibold">% del periodo</th>
                <th className="py-2 px-3 text-right font-semibold">Cancelación</th>
                <th className="py-2 px-3 text-right font-semibold">Downgrade</th>
                <th className="py-2 px-3 text-right font-semibold">Movimientos</th>
              </tr>
            </thead>
            <tbody>
              {M.tenure.map(t => (
                <tr key={t.b} className="border-t border-gray-100">
                  <td className="py-2 px-3 font-semibold text-gray-900">{t.b} meses</td>
                  <td className="py-2 px-3 text-right text-gray-900">{fmtF(t.l)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{pct(t.l / total * 100)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{fmt(t.ch)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{fmt(t.dg)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{t.n.toLocaleString('es-MX')}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <td className="py-2 px-3 text-gray-900">TOTAL</td>
                <td className="py-2 px-3 text-right text-gray-900">{fmtF(total)}</td>
                <td className="py-2 px-3 text-right text-gray-700">100.0%</td>
                <td className="py-2 px-3 text-right text-gray-700">{fmt(CER.cancelaciones)}</td>
                <td className="py-2 px-3 text-right text-gray-700">{fmt(CER.downgrades)}</td>
                <td className="py-2 px-3 text-right text-gray-700">
                  {M.tenure.reduce((s, t) => s + t.n, 0).toLocaleString('es-MX')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-gray-500 border-t border-gray-100 leading-relaxed">
          <b>Sin base activa por antigüedad no se puede calcular una tasa por tramo.</b> Lo de arriba
          es reparto de la pérdida, no probabilidad de irse.
        </p>
      </Card>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── CUENTAS ── */
type ColCuenta = 'n' | 'cl' | 'ten' | 'mrr' | 'lOct' | 'lNov'

function Cuentas() {
  const [q, setQ]           = useState('')
  const [fClase, setFClase] = useState('')
  const [fTipo, setFTipo]   = useState('')
  const [col, setCol]       = useState<ColCuenta>('lOct')
  const [dir, setDir]       = useState<'asc' | 'desc'>('desc')
  const [pag, setPag]       = useState(0)
  const POR_PAG = 50

  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase()
    return CUENTAS_CHURN.filter(c => {
      if (fClase && c.cl !== fClase) return false
      if (fTipo === 'cartera' && !c.cons) return false
      if (fTipo === 'ventana' && !(c.dgch && c.ev.some(e => e[0] <= NC && e[1] === 'C'))) return false
      if (fTipo === 'doble' && !c.ch2) return false
      if (fTipo === 'fraude' && !c.fr) return false
      if (texto && !c.n.toLowerCase().includes(texto)
        && !(c.cons ?? '').toLowerCase().includes(texto)) return false
      return true
    })
  }, [q, fClase, fTipo])

  const ordenadas = useMemo(() => {
    const signo = dir === 'asc' ? 1 : -1
    /* Copia: `CUENTAS_CHURN` es el módulo importado y ordenarlo en el sitio lo
       reordenaría para toda la página. Y `cl` es una ESCALA (AAA · AA · A · B ·
       C): de la A a la Z pondría «AA» antes que «AAA». */
    return [...filtradas].sort((a, b) => {
      if (col === 'n')  return signo * a.n.localeCompare(b.n, 'es')
      if (col === 'cl') return signo * (ordenClase(a.cl) - ordenClase(b.cl))
      return signo * ((a[col] as number) - (b[col] as number))
    })
  }, [filtradas, col, dir])

  const nPags = Math.max(1, Math.ceil(ordenadas.length / POR_PAG))
  const pagina = Math.min(pag, nPags - 1)
  const vista = ordenadas.slice(pagina * POR_PAG, (pagina + 1) * POR_PAG)
  const sumaFiltro = filtradas.reduce((s, c) => s + c.lOct, 0)

  const orden = (c: ColCuenta) => {
    if (col === c) setDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setCol(c); setDir(c === 'n' || c === 'cl' ? 'asc' : 'desc') }
    setPag(0)
  }
  const Th = ({ c, children, right }: { c: ColCuenta; children: React.ReactNode; right?: boolean }) => (
    <th className={`py-2 px-3 font-semibold cursor-pointer select-none ${right ? 'text-right' : 'text-left'}`}
      onClick={() => orden(c)}>
      <span className="inline-flex items-center gap-1">
        {children}<ArrowUpDown size={11} style={{ opacity: col === c ? 1 : 0.3 }} />
      </span>
    </th>
  )

  return (
    <div className="space-y-4">
      <Card>
        <Titulo icon={<ListTree size={14} className="text-gray-400" />}
          nota={`Las ${M.cuentasFuente.toLocaleString('es-MX')} cuentas del informe. «Ene–oct» es el periodo cerrado y «Nov» el mes en tránsito: nunca se suman entre sí.`}>
          Cuentas con pérdida
        </Titulo>

        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => { setQ(e.target.value); setPag(0) }}
              placeholder="Buscar cuenta o consecutivo…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 w-64"
              style={{ background: '#fff', color: '#202E3B' }} />
          </div>
          <CustomSelect value={fClase} onChange={v => { setFClase(v); setPag(0) }}
            wrapperClassName="w-40 flex-shrink-0"
            options={[{ value: '', label: 'Todas las clases' },
              ...CLASES_CUENTA.map(c => ({
                value: c,
                label: `${c} (${CUENTAS_CHURN.filter(x => x.cl === c).length})`,
              }))]} />
          <CustomSelect value={fTipo} onChange={v => { setFTipo(v); setPag(0) }}
            wrapperClassName="w-72 flex-shrink-0"
            options={[
              { value: '', label: 'Todas las cuentas' },
              { value: 'cartera', label: `Sólo cartera CS (${NUESTRAS.length})` },
              { value: 'ventana', label: `Downgrade y después baja (${VENTANA.length})` },
              { value: 'doble',   label: `Con dos bajas en el periodo (${CUENTAS_CHURN.filter(c => c.ch2).length})` },
              { value: 'fraude',  label: `Con fraude / reestructura (${CUENTAS_CHURN.filter(c => c.fr).length})` },
            ]} />
          <span className="text-xs text-gray-600 ml-auto">
            <b className="text-gray-900">{ordenadas.length.toLocaleString('es-MX')}</b> cuentas ·{' '}
            <b className="text-gray-900">{fmtF(sumaFiltro)}</b> de pérdida ene–oct
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <Th c="n">Cuenta</Th>
                <Th c="cl">Clas.</Th>
                <Th c="ten" right>Meses</Th>
                <Th c="mrr" right>MRR inicial</Th>
                <Th c="lOct" right>Pérdida ene–oct</Th>
                <Th c="lNov" right>Nov. en tránsito</Th>
                <th className="py-2 px-3 text-left font-semibold">Señales</th>
                <th className="py-2 px-3 text-left font-semibold">Cartera CS</th>
              </tr>
            </thead>
            <tbody>
              {vista.map((c, i) => (
                <tr key={`${c.n}-${i}`} className="border-t border-gray-100">
                  <td className="py-2 px-3 text-gray-900">{c.n}</td>
                  <td className="py-2 px-3 font-semibold text-gray-700">{c.cl}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{c.ten}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{fmt(c.mrr)}</td>
                  <td className="py-2 px-3 text-right text-gray-900 font-semibold">
                    {c.lOct ? fmtF(c.lOct) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: AMBER_TX }}>
                    {c.lNov ? fmtF(c.lNov) : '—'}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {c.dgch && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: AMBER + '22', color: AMBER_TX }}>
                          downgrade → baja
                        </span>
                      )}
                      {c.ch2 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: RED + '22', color: RED_TX }}>
                          dos bajas
                        </span>
                      )}
                      {!!c.fr && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: TEAL + '22', color: TEAL_TX }}>
                          fraude / reestructura {fmt(c.fr)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-gray-700">
                    {c.cons
                      ? <span><b className="text-gray-900">{c.cons}</b> · {c.asesor ?? 'sin asesor'}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
              {!vista.length && (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500">
                  Ninguna cuenta con esos filtros.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <span>
            {ordenadas.length
              ? `${(pagina * POR_PAG + 1).toLocaleString('es-MX')}–${Math.min((pagina + 1) * POR_PAG, ordenadas.length).toLocaleString('es-MX')} de ${ordenadas.length.toLocaleString('es-MX')}`
              : '0 de 0'}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPag(p => Math.max(0, p - 1))} disabled={pagina === 0}
              className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40">
              <ChevronLeft size={13} />
            </button>
            <span>Página {pagina + 1} de {nPags}</span>
            <button onClick={() => setPag(p => Math.min(nPags - 1, p + 1))} disabled={pagina >= nPags - 1}
              className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 text-xs text-gray-600 leading-relaxed space-y-2">
          <p className="flex items-start gap-2">
            <Info size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <span>
              <b className="text-gray-900">Lo que esta tabla no trae, porque el archivo no lo trae:</b> motivo de
              baja, producto que se soltó y responsable. No existen esas columnas. Tampoco hay CID ni ID de
              cuenta en el informe: el consecutivo y el asesor salen de un cruce por nombre contra el GRC,
              así que son indicativos y no mueven una cuenta por sí solos.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Info size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <span>
              <b className="text-gray-900">Todo esto es churn BRUTO.</b> La columna «Ingreso Ganado» viene en
              cero en los {M.movimientos.toLocaleString('es-MX')} movimientos: el archivo no registra expansión
              ni reactivación, así que no se puede calcular churn neto.
            </span>
          </p>
        </div>
      </Card>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── CARTERA ── */
function Cartera() {
  const porAsesor = useMemo(() => {
    const m = new Map<string, { n: number; mrr: number }>()
    for (const c of NUESTRAS) {
      const k = c.asesor ?? 'Sin asesor'
      const a = m.get(k) ?? { n: 0, mrr: 0 }
      a.n += 1; a.mrr += c.lOct
      m.set(k, a)
    }
    return [...m.entries()].map(([asesor, v]) => ({ asesor, ...v }))
      .sort((a, b) => b.mrr - a.mrr)
  }, [])

  /* La ventana es la MISMA definición que usa el resto del módulo: bajó de
     plan y canceló DENTRO del periodo cerrado. Las que bajaron de plan y
     cancelaron ya en noviembre van contadas aparte, porque ese mes no cierra
     y mezclarlas daría un número que no cuadra con nada. */
  const nuestraVentana = NUESTRAS.filter(
    c => c.dgch && c.ev.some(e => e[0] <= NC && e[1] === 'C'))
  const nuestraVentanaMrr = nuestraVentana.reduce((s, c) => s + c.lOct, 0)
  const marcadasDgch = NUESTRAS.filter(c => c.dgch).length

  /* Las clases se derivan de las cuentas, no de las cinco de la rejilla, y la
     tabla lleva fila de cierre: si sumara 120 de 121 se vería perfecta. */
  const porClase = CLASES_CUENTA
    .map(cl => {
      const filas = NUESTRAS.filter(c => c.cl === cl)
      return {
        clase: cl,
        n: filas.length,
        mrr: filas.reduce((s, c) => s + c.lOct, 0),
      }
    })
    .filter(p => p.n > 0)
  const cierraClase = porClase.reduce((s, p) => s + p.n, 0) === NUESTRAS.length

  return (
    <div className="space-y-4">
      <Aviso tono={RED} titulo={`El ${pct(NUESTRAS_MRR / CER.bruta * 100)} de la pérdida del año está en cartera nuestra`}>
        <p>
          <b>{NUESTRAS.length}</b> de las {M.cuentasFuente.toLocaleString('es-MX')} cuentas del informe
          tienen consecutivo y asesor en nuestra cartera, y cargan <b>{fmtF(NUESTRAS_MRR)}</b> de
          los {fmtF(CER.bruta)} del periodo cerrado. El informe no lo sabe: ese cruce es nuestro.
        </p>
        <p>
          Es un cruce <b>por nombre normalizado</b> contra las filas en cartera del GRC, porque el
          informe no trae CID. Sirve para priorizar, no para dar una cuenta por identificada.
        </p>
      </Aviso>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Cuentas nuestras" valor={String(NUESTRAS.length)} color={MARINO}
          pie={`de ${M.cuentasFuente.toLocaleString('es-MX')} del informe`} />
        <Kpi label="Pérdida ene–oct" valor={fmt(NUESTRAS_MRR)} color={RED}
          pie={`${pct(NUESTRAS_MRR / CER.bruta * 100)} del total del informe`} />
        <Kpi label="Bajaron de plan y cancelaron (ene–oct)" valor={String(nuestraVentana.length)} color={AMBER}
          pie={`${fmt(nuestraVentanaMrr)} — la señal más accionable del informe. ${marcadasDgch} traen la marca en todo el año; las otras ${marcadasDgch - nuestraVentana.length} cancelaron ya en noviembre, que no cierra.`} />
        <Kpi label="En noviembre, en tránsito" valor={fmt(NUESTRAS.reduce((s, c) => s + c.lNov, 0))} color={AMBER}
          pie="No se suma a la pérdida del periodo cerrado" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <Titulo icon={<Users size={14} className="text-gray-400" />}>Por asesor</Titulo>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="py-2 px-3 text-left font-semibold">Asesor</th>
                <th className="py-2 px-3 text-right font-semibold">Cuentas</th>
                <th className="py-2 px-3 text-right font-semibold">Pérdida ene–oct</th>
              </tr>
            </thead>
            <tbody>
              {porAsesor.map(a => (
                <tr key={a.asesor} className="border-t border-gray-100">
                  <td className="py-2 px-3 text-gray-900">{a.asesor}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{a.n}</td>
                  <td className="py-2 px-3 text-right text-gray-900">{fmtF(a.mrr)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <td className="py-2 px-3 text-gray-900">TOTAL</td>
                <td className="py-2 px-3 text-right text-gray-700">
                  {porAsesor.reduce((s, a) => s + a.n, 0)}
                </td>
                <td className="py-2 px-3 text-right text-gray-900">
                  {fmtF(porAsesor.reduce((s, a) => s + a.mrr, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card>
          <Titulo icon={<Layers size={14} className="text-gray-400" />}>Por clasificación</Titulo>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="py-2 px-3 text-left font-semibold">Clas.</th>
                <th className="py-2 px-3 text-right font-semibold">Cuentas</th>
                <th className="py-2 px-3 text-right font-semibold">Pérdida ene–oct</th>
              </tr>
            </thead>
            <tbody>
              {porClase.map(p => (
                <tr key={p.clase} className="border-t border-gray-100">
                  <td className="py-2 px-3 font-bold text-gray-900">{p.clase}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{p.n}</td>
                  <td className="py-2 px-3 text-right text-gray-900">{fmtF(p.mrr)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <td className="py-2 px-3 text-gray-900">TOTAL</td>
                <td className="py-2 px-3 text-right text-gray-700">
                  {porClase.reduce((s, p) => s + p.n, 0)}
                </td>
                <td className="py-2 px-3 text-right text-gray-900">
                  {fmtF(porClase.reduce((s, p) => s + p.mrr, 0))}
                </td>
              </tr>
            </tbody>
          </table>
          {!cierraClase && (
            <p className="px-4 py-2 text-xs font-bold" style={{ color: RED_TX }}>
              Esta tabla NO cierra contra las {NUESTRAS.length} cuentas: falta una
              clasificación por listar. No la leas hasta que cuadre.
            </p>
          )}
        </Card>
      </div>

      <Card>
        <Titulo icon={<Users size={14} className="text-gray-400" />}
          nota="Ordenadas por pérdida del periodo cerrado. «Eventos» es la secuencia real: D = downgrade, C = cancelación, con el mes.">
          Las {NUESTRAS.length} cuentas nuestras
        </Titulo>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="py-2 px-3 text-left font-semibold">#</th>
                <th className="py-2 px-3 text-left font-semibold">Cuenta</th>
                <th className="py-2 px-3 text-left font-semibold">Cons.</th>
                <th className="py-2 px-3 text-left font-semibold">Asesor</th>
                <th className="py-2 px-3 text-left font-semibold">Clas.</th>
                <th className="py-2 px-3 text-right font-semibold">Meses</th>
                <th className="py-2 px-3 text-right font-semibold">MRR inicial</th>
                <th className="py-2 px-3 text-right font-semibold">Pérdida ene–oct</th>
                <th className="py-2 px-3 text-left font-semibold">Eventos</th>
              </tr>
            </thead>
            <tbody>
              {[...NUESTRAS].sort((a, b) => b.lOct - a.lOct).map((c, i) => (
                <tr key={`${c.cons}-${i}`} className="border-t border-gray-100">
                  <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                  <td className="py-2 px-3 text-gray-900">{c.n}</td>
                  <td className="py-2 px-3 font-bold text-gray-900">{c.cons}</td>
                  <td className="py-2 px-3 text-gray-700">{c.asesor ?? '—'}</td>
                  <td className="py-2 px-3 font-semibold text-gray-700">{c.cl}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{c.ten}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{fmt(c.mrr)}</td>
                  <td className="py-2 px-3 text-right text-gray-900 font-semibold">{fmtF(c.lOct)}</td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {c.ev.map((e, j) => (
                        <span key={j} className="px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
                          style={e[1] === 'C'
                            ? { background: RED + '1E', color: RED_TX }
                            : { background: AMBER + '1E', color: AMBER_TX }}>
                          {MESES[e[0] - 1] ?? e[0]} {e[1] === 'C' ? 'baja' : 'downgrade'} {fmt(e[2])}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────── TRÁNSITO ── */
function Transito() {
  const cuentasNov = [...CUENTAS_CHURN].filter(c => c.lNov > 0).sort((a, b) => b.lNov - a.lNov)
  const nuestrasNov = cuentasNov.filter(c => c.cons)

  return (
    <div className="space-y-4">
      <Aviso tono={AMBER} titulo={`${M.mesEnTransito} no se suma a nada`}>
        <p>
          El mes vivo marca como pérdida toda cuenta que todavía no ha facturado, así que mide
          <b> retraso de cobranza tanto como churn</b>. El propio informe se niega a concluir sobre él:
          la mayoría de sus movimientos son de cuentas cuyo estatus de pago aún puede cambiar.
        </p>
        <p>
          Aquí se publica para verlo venir —es {pct(TRA.perdida / CER.bruta * 100)} de los diez meses
          cerrados juntos y {(TRA.perdida / PROM_MES_CERRADO).toFixed(1)} veces el mes promedio—, pero
          ninguna tarjeta del periodo cerrado lo incluye.
        </p>
      </Aviso>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Pérdida preliminar" valor={fmt(TRA.perdida)} color={AMBER}
          pie={`sobre una base de ${fmt(TRA.base)}`} />
        <Kpi label="Tasa del mes" valor={pct(TRA.tasa, 2)} color={AMBER}
          pie={`contra ${pct(M.tasas[NC - 1], 2)} en octubre y ${pct(CER.ponderado, 2)} ponderado del año`} />
        <Kpi label="Bajas" valor={TRA.bajas.toLocaleString('es-MX')} color={RED}
          pie={`${CER.bajas.toLocaleString('es-MX')} en los diez meses cerrados`} />
        <Kpi label="Downgrades" valor={String(TRA.downgradesN)} color={AMBER}
          pie={`${CER.downgradesN.toLocaleString('es-MX')} en los diez meses cerrados`} />
      </div>

      <Card>
        <Titulo icon={<CalendarClock size={14} className="text-gray-400" />}
          nota={`${cuentasNov.length.toLocaleString('es-MX')} cuentas con movimiento en noviembre, de las cuales ${nuestrasNov.length} son cartera nuestra. Cifra preliminar: cambia al cierre.`}>
          Cuentas del mes en tránsito
        </Titulo>
        <div className="overflow-x-auto" style={{ maxHeight: 520 }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0">
              <tr className="bg-gray-50 text-gray-600">
                <th className="py-2 px-3 text-left font-semibold">Cuenta</th>
                <th className="py-2 px-3 text-left font-semibold">Clas.</th>
                <th className="py-2 px-3 text-right font-semibold">Meses</th>
                <th className="py-2 px-3 text-right font-semibold">Nov. preliminar</th>
                <th className="py-2 px-3 text-right font-semibold">Ya perdido ene–oct</th>
                <th className="py-2 px-3 text-left font-semibold">Cartera CS</th>
              </tr>
            </thead>
            <tbody>
              {cuentasNov.slice(0, 120).map((c, i) => (
                <tr key={`${c.n}-${i}`} className="border-t border-gray-100">
                  <td className="py-2 px-3 text-gray-900">{c.n}</td>
                  <td className="py-2 px-3 font-semibold text-gray-700">{c.cl}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{c.ten}</td>
                  <td className="py-2 px-3 text-right font-semibold" style={{ color: AMBER_TX }}>{fmtF(c.lNov)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{c.lOct ? fmtF(c.lOct) : '—'}</td>
                  <td className="py-2 px-3 text-gray-700">
                    {c.cons ? <span><b className="text-gray-900">{c.cons}</b> · {c.asesor ?? 'sin asesor'}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cuentasNov.length > 120 && (
          <p className="px-4 py-2 text-[11px] text-gray-500 border-t border-gray-100">
            Se muestran las 120 mayores de {cuentasNov.length.toLocaleString('es-MX')}. El resto está en
            la pestaña «Cuentas», ordenando por «Nov. en tránsito».
          </p>
        )}
      </Card>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────── HALLAZGOS ── */
const TONO_GRUPO: Record<string, string> = {
  't-red': RED, 't-amb': AMBER, 't-nav': MARINO, 't-ok': TEAL,
}

function Hallazgos() {
  const campos: { k: 'q' | 'd' | 'm' | 'p' | 'u' | 'a'; label: string }[] = [
    { k: 'q', label: 'Qué ocurrió' },
    { k: 'd', label: 'Dónde y cuándo' },
    { k: 'm', label: 'Magnitud' },
    { k: 'p', label: 'Patrón' },
    { k: 'u', label: 'Sin confirmar' },
    { k: 'a', label: 'Decisión' },
  ]

  return (
    <div className="space-y-4">

      {/* La conciliación de la prosa del informe contra su propio archivo */}
      <Aviso tono={TEAL} titulo="Los hallazgos de abajo se reconstruyeron del archivo, uno por uno">
        <p>
          Cada cifra de estos ocho hallazgos se volvió a calcular desde la rejilla del informe y
          cuadra al centavo —octubre, AAA, el downgrade, el fraude, la antigüedad, la concentración—
          <b> salvo un conteo</b>.
        </p>
        <p>
          El hallazgo 7 publica «49 cuentas» que bajaron de plan y después cancelaron. El archivo da{' '}
          <b>{VENTANA.length}</b>, y son esas {VENTANA.length} las que cargan exactamente el dinero
          que el informe reporta ({fmtF(VENTANA_MRR)} = {pct(VENTANA_MRR / CER.bruta * 100)} de la
          pérdida). El importe reconstruye; el conteo no, y no hay criterio escrito que separe las
          tres de diferencia. Esta pantalla publica {VENTANA.length}.
        </p>
      </Aviso>

      {M.hallazgos.map(g => (
        <div key={g.g}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold"
              style={{
                background: (TONO_GRUPO[g.tag] ?? MARINO) + '22',
                color: g.tag === 't-red' ? RED_TX : g.tag === 't-amb' ? AMBER_TX
                  : g.tag === 't-ok' ? TEAL_TX : MARINO,
              }}>
              {g.g}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {g.items.map(f => (
              <Card key={f.t}>
                <div className="px-4 py-3 border-b border-gray-100"
                  style={{ borderLeft: `3px solid ${TONO_GRUPO[g.tag] ?? MARINO}` }}>
                  <h4 className="text-sm font-bold text-gray-900">{f.t}</h4>
                </div>
                <dl className="p-4 space-y-2">
                  {campos.map(c => (
                    <div key={c.k} className="grid grid-cols-[108px_1fr] gap-2">
                      <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        {c.label}
                      </dt>
                      <dd className={`text-xs leading-relaxed ${c.k === 'a' ? 'font-bold text-gray-900' : c.k === 'u' ? 'text-gray-500' : 'text-gray-700'}`}>
                        {f[c.k]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Tabla de decisión */}
      <Card>
        <Titulo icon={<Target size={14} className="text-gray-400" />}
          nota="Tal como la publica el informe: hallazgo, evidencia, implicación, acción, dueño e indicador de seguimiento.">
          Tabla de decisión
        </Titulo>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                {['Hallazgo', 'Evidencia', 'Implicación', 'Acción', 'Área responsable', 'Prioridad', 'Indicador de seguimiento']
                  .map(h => <th key={h} className="py-2 px-3 text-left font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {M.decision.map(d => (
                <tr key={d.hallazgo} className="border-t border-gray-100 align-top">
                  <td className="py-2 px-3 font-semibold text-gray-900">{d.hallazgo}</td>
                  <td className="py-2 px-3 text-gray-700">{d.evidencia}</td>
                  <td className="py-2 px-3 text-gray-700">{d.implicacion}</td>
                  <td className="py-2 px-3 text-gray-700">{d.accion}</td>
                  <td className="py-2 px-3 text-gray-700">{d.area}</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
                      style={d.prioridad === 'Alta'
                        ? { background: RED + '22', color: RED_TX }
                        : { background: AMBER + '22', color: AMBER_TX }}>
                      {d.prioridad}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-700">{d.indicador}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Plan 30 / 60 / 90 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {M.plan.map(f => (
          <Card key={f.plazo}>
            <div className="px-4 py-3 border-b border-gray-100" style={{ background: MARINO }}>
              <p className="text-sm font-bold text-white">{f.plazo}</p>
              <p className="text-xs" style={{ color: '#D7E7F2' }}>{f.lema}</p>
            </div>
            <div className="p-4 space-y-3">
              {f.acciones.map(a => (
                <div key={a.titulo}>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: AZUL + '1E', color: AZUL_TX }}>
                    {a.familia}
                  </span>
                  <p className="text-xs font-bold text-gray-900 mt-1">{a.titulo}</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">{a.detalle}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Lo que el informe no permite decidir */}
      <Card>
        <Titulo icon={<Info size={14} className="text-gray-400" />}
          nota="Un hueco que no se nombra se rellena con una suposición. Esto es lo que el informe deja abierto.">
          Lo que este informe NO permite decidir
        </Titulo>
        <ul className="p-4 space-y-2 text-xs text-gray-700 leading-relaxed">
          {[
            ['La tasa propia de cada clasificación', 'El archivo sólo trae cuentas con pérdida: sin MRR inicial ni cuentas activas por segmento, AAA pesa más sin que se sepa si su tasa es peor.'],
            ['Por qué octubre se dispara', 'Las cinco clasificaciones se duplican a la vez y el 60% de esas cuentas seguía facturándose el mes anterior. Falta motivo y fecha de solicitud para separar baja voluntaria de administrativa.'],
            ['El churn neto', '«Ingreso Ganado» viene en cero en todos los movimientos: no hay expansión ni reactivación, así que todo aquí es churn bruto.'],
            ['Motivo, producto y responsable de cada baja', 'No existen esas columnas en el archivo.'],
            ['Si las bajas repetidas son doble conteo', `${CUENTAS_CHURN.filter(c => c.ch2).length} cuentas registran dos bajas en el periodo. Se conservan para poder conciliar con la cifra oficial.`],
            ['Las etiquetas de las cuentas GTC', 'GTC-CARRANZA y GTC-LOMAS figuran como «Churn confirmado» pero su pérdida vive sólo en la columna de fraude/reestructura: la etiqueta y la columna se contradicen, y el criterio de «reestructura» no está documentado.'],
            ['Que nuestras cuentas sean exactamente éstas', 'El informe no trae CID. El cruce es por nombre normalizado: indicativo, no identidad.'],
            [`Por qué el hallazgo 7 cuenta 49 y el archivo ${VENTANA.length}`, `El dinero coincide al centavo (${fmtF(VENTANA_MRR)}); el conteo no, y ninguna definición alternativa que se probó quita esas tres cuentas.`],
          ].map(([t, d]) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: AZUL }} />
              <span><b className="text-gray-900">{t}.</b> {d}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
