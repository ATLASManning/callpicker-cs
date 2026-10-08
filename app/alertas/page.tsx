import Link from 'next/link'
import { headers } from 'next/headers'
import { ArrowRight, Lock } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { veredictosDeCartera, type CuentaConVeredicto } from '@/lib/alertas-estado'
import { SITUACION, LUZ, type Situacion, type ClaseHallazgo } from '@/lib/alertas-veredicto'
import { hoyEnPalabras } from '@/lib/fecha-local'

/**
 * /alertas — EL OBJETIVO DE TRABAJO DE SAC
 *
 * Instrucción de dirección, 7 oct 2026: ALERTAS sustituye a las actividades SAC
 * y «debe estar como objetivo de trabajo para SAC». El asesor abre esta pantalla
 * y esto ES su semana. No hay un generador que le reparta tareas aparte.
 *
 * ── QUÉ CAMBIÓ RESPECTO A LA VERSIÓN ANTERIOR ────────────────────────────
 *
 * Antes listaba las cuentas que habían disparado una alerta. Ahora están LAS
 * 192, porque una cuenta tranquila y una cuenta invisible se veían igual —las
 * dos ausentes— y son lo contrario la una de la otra. La que está en orden lo
 * dice, y dice también que no se le invente trabajo.
 *
 * ── UNA ACCIÓN POR CUENTA, NO UNA POR CAMPO VACÍO ────────────────────────
 *
 * «No hacer tareas innecesarias, deben ser con inteligencia» — dirección. Una
 * cuenta con consumo en cero, noventa días sin contacto y un ticket fuera de
 * SLA no tiene tres problemas: tiene uno, se está yendo, y las tres cosas son
 * la evidencia. Aquí se pinta la acción, y debajo las pruebas.
 *
 * ── EL SEMÁFORO NO CUELGA DEL HEALTH SCORE ───────────────────────────────
 *
 * Sale de la situación. El Health Score se apoya en dato real un 58% en
 * promedio y ocho cuentas lo tienen 100% fabricado: sigue siendo una señal,
 * deja de ser la etiqueta. Hay un semáforo, no dos.
 *
 * ── LOS FILTROS SON ENLACES ──────────────────────────────────────────────
 *
 * Para que la pantalla se pueda compartir: el enlace que dirección le manda a
 * un asesor abre exactamente lo que dirección estaba viendo. Y mantiene esto
 * como componente de servidor, sin un segundo viaje a la API.
 */
export const dynamic = 'force-dynamic'

const PANEL = '#0D1829'
const BORDER = 'rgba(255,255,255,0.08)'
const TX_HI = 'rgba(255,255,255,0.94)'
const TX_MID = 'rgba(255,255,255,0.72)'
const TX_LOW = 'rgba(255,255,255,0.48)'

/** Todo texto de color va en un `<span>` que declara su propio `background`:
 *  `globals.css` pinta de blanco cualquier `<p>`/`<strong>` que no lo haga, y
 *  esta pantalla es una isla oscura. Ver [[atlas-dashboard-contrast-architecture]]. */
const C = (color: string, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ color, background: 'transparent', ...extra })

const dinero = (n: number | null) =>
  n === null ? 'sin importe' : `$${n.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`

const CLASES: Array<{ k: ClaseHallazgo; etiqueta: string; color: string }> = [
  { k: 'riesgo',   etiqueta: 'Riesgo',             color: '#F87171' },
  { k: 'entrega',  etiqueta: 'Para enseñarle',     color: '#60A5FA' },
  { k: 'analisis', etiqueta: 'Nos falta',          color: '#FBBF24' },
]

export default async function AlertasPage({
  searchParams,
}: { searchParams?: { asesor?: string; situacion?: string } }) {
  /* El asesor que entra ve SU cartera y nada más. Un rol de asesor sin nombre
     asignado no ve nada: un permiso incompleto se resuelve negando, nunca
     concediendo. Es el mismo candado de `/api/alertas`. */
  const h = headers()
  const rolAsesor = h.get('x-user-rol') === 'asesor'
  const suyo = decodeURIComponent(h.get('x-user-asesor') ?? '')
  if (rolAsesor && !suyo) {
    return (
      <div style={{ padding: 24 }}>
        <PageHeader titulo="Alertas de Cliente" />
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <p style={C(TX_HI)}>
            <Lock size={14} style={{ display: 'inline', marginRight: 6 }} />
            Tu usuario tiene rol de asesor pero no trae asignada una cartera.
            Pídele a administración que lo complete.
          </p>
        </div>
      </div>
    )
  }
  const asesorFiltro = rolAsesor ? suyo : (searchParams?.asesor || undefined)
  const sitFiltro = (searchParams?.situacion || undefined) as Situacion | undefined

  const { cuentas, falla } = await veredictosDeCartera(
    asesorFiltro ? { asesor: asesorFiltro } : undefined)

  /* El reparto se calcula sobre TODO lo que se leyó, no sobre lo filtrado: un
     total que encoge al filtrar diría que hay menos trabajo del que hay. */
  const porSituacion = new Map<Situacion, { n: number; mrr: number; sinImporte: number }>()
  for (const c of cuentas) {
    const k = c.veredicto.situacion
    const e = porSituacion.get(k) ?? { n: 0, mrr: 0, sinImporte: 0 }
    e.n += 1
    if (c.mrr === null) e.sinImporte += 1
    else e.mrr += c.mrr
    porSituacion.set(k, e)
  }
  const orden = (Object.keys(SITUACION) as Situacion[])
    .sort((a, b) => SITUACION[a].orden - SITUACION[b].orden)

  const lista = sitFiltro ? cuentas.filter(c => c.veredicto.situacion === sitFiltro) : cuentas
  const asesores = Array.from(new Set(cuentas.map(c => c.asesor).filter(Boolean) as string[])).sort()

  const enlace = (p: { asesor?: string; situacion?: string }) => {
    const q = new URLSearchParams()
    const a = p.asesor !== undefined ? p.asesor : asesorFiltro
    const s = p.situacion !== undefined ? p.situacion : sitFiltro
    if (a) q.set('asesor', a)
    if (s) q.set('situacion', s)
    const t = q.toString()
    return t ? `/alertas?${t}` : '/alertas'
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader titulo="Alertas de Cliente" />

      <p style={C(TX_MID, { fontSize: 12, margin: 0 })}>
        Las {cuentas.length} cuentas vivas{asesorFiltro ? ` de ${asesorFiltro}` : ''}, cada una con
        su lectura y una sola acción. {hoyEnPalabras()}.
      </p>

      {falla && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
                      borderRadius: 10, padding: '10px 14px' }}>
          <span style={C('#FCA5A5', { fontSize: 12 })}>
            Una fuente no cargó, y eso cambia lo que se puede afirmar: {falla}
          </span>
        </div>
      )}

      {/* ── EL SEMÁFORO: el reparto de la cartera ───────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {orden.map(k => {
          const e = porSituacion.get(k)
          if (!e) return null
          const activo = sitFiltro === k
          const col = LUZ[SITUACION[k].luz].color
          return (
            <Link key={k} href={enlace({ situacion: activo ? '' : k })}
                  style={{ textDecoration: 'none', flex: '1 1 150px', minWidth: 150 }}>
              <div style={{
                background: activo ? `${col}22` : PANEL,
                border: `1px solid ${activo ? col : BORDER}`,
                borderLeft: `3px solid ${col}`, borderRadius: 10, padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={C(col, { fontSize: 22, fontWeight: 700 })}>{e.n}</span>
                  <span style={C(TX_LOW, { fontSize: 10 })}>
                    {e.n === 1 ? 'cuenta' : 'cuentas'}
                  </span>
                </div>
                <div style={C(TX_HI, { fontSize: 12, fontWeight: 600 })}>{SITUACION[k].titulo}</div>
                <div style={C(TX_LOW, { fontSize: 11 })}>
                  {dinero(e.mrr)}
                  {/* Las cuentas sin importe NO se suman como cero: se declaran
                      aparte. Un cero sin medición no es un cero. */}
                  {e.sinImporte > 0 && ` · ${e.sinImporte} sin importe`}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── FILTRO POR ASESOR ───────────────────────────────────────────── */}
      {!rolAsesor && asesores.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Link href={enlace({ asesor: '' })} style={{ textDecoration: 'none' }}>
            <span style={{ ...C(!asesorFiltro ? TX_HI : TX_LOW, { fontSize: 11, padding: '4px 10px',
                           borderRadius: 999, border: `1px solid ${!asesorFiltro ? TX_LOW : BORDER}` }) }}>
              Toda la cartera
            </span>
          </Link>
          {asesores.map(a => (
            <Link key={a} href={enlace({ asesor: a })} style={{ textDecoration: 'none' }}>
              <span style={{ ...C(asesorFiltro === a ? TX_HI : TX_LOW, { fontSize: 11, padding: '4px 10px',
                             borderRadius: 999, border: `1px solid ${asesorFiltro === a ? TX_LOW : BORDER}` }) }}>
                {a}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ── LA COLA DE TRABAJO ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lista.map(c => <Ficha key={c.cuentaId} c={c} />)}
      </div>

      {lista.length === 0 && (
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <span style={C(TX_MID, { fontSize: 13 })}>No hay cuentas en esta situación.</span>
        </div>
      )}

      <p style={C(TX_LOW, { fontSize: 10, lineHeight: 1.7 })}>
        El semáforo sale de la situación de la cuenta, no del Health Score: ese número se
        apoya en dato real un 58% en promedio. «Fuentes» dice de cuántas de las ocho
        —facturación, consumo, llamadas, tickets, relación, contacto, riesgos y ficha— hay
        dato; por debajo de tres no se emite juicio, se pide lo que falta.
      </p>
    </div>
  )
}

function Ficha({ c }: { c: CuentaConVeredicto }) {
  const v = c.veredicto
  const col = LUZ[v.luz].color
  const d = c.datos

  return (
    <div style={{
      background: PANEL, border: `1px solid ${BORDER}`,
      borderLeft: `3px solid ${col}`, borderRadius: 12, padding: '12px 16px',
    }}>
      {/* Encabezado: quién, cuánto, y de cuántas fuentes se sabe */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Link href={`/cuentas/${c.cuentaId}`} style={{ textDecoration: 'none' }}>
            <span style={C(TX_HI, { fontSize: 14, fontWeight: 600 })}>{c.empresa}</span>
          </Link>
          <span style={C(TX_LOW, { fontSize: 11, marginLeft: 8 })}>
            {c.asesor ?? 'sin asesor'} · {dinero(c.mrr)} al mes
          </span>
        </div>
        <span style={C(col, { fontSize: 11, fontWeight: 600 })}>{SITUACION[v.situacion].titulo}</span>
      </div>

      {/* LA ACCIÓN. Es lo único que el asesor tiene que hacer con esta cuenta. */}
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <ArrowRight size={14} style={{ color: col, flexShrink: 0, marginTop: 3 }} />
        <div>
          <div style={C(TX_HI, { fontSize: 13, fontWeight: 600 })}>{v.accion}</div>
          <div style={C(TX_MID, { fontSize: 11, marginTop: 2, lineHeight: 1.6 })}>{v.porque}</div>
          {v.pedir && (
            <div style={C('#FBBF24', { fontSize: 11, marginTop: 4, lineHeight: 1.6 })}>
              Qué pedir: {v.pedir}
            </div>
          )}
        </div>
      </div>

      {/* Las cifras, para que la acción se pueda discutir sin abrir la ficha */}
      <div style={{ marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Cifra etq="consumo" val={d.consumoPct === null ? null : `${d.consumoPct.toFixed(0)}%`} />
        <Cifra etq="sin contacto" val={d.diasSinContacto === null ? null : `${d.diasSinContacto} d`} />
        <Cifra etq="perdidas" val={d.perdidas === null ? null
                 : `${d.perdidas.toLocaleString('es-MX')}${d.pctPerdidas !== null ? ` (${d.pctPerdidas.toFixed(0)}%)` : ''}`} />
        <Cifra etq="tickets" val={d.tickets === null ? null : String(d.tickets)} />
        <Cifra etq="reuniones" val={String(d.reuniones)} />
        <Cifra etq="relación" val={`${d.relacionPct}%`} />
        <Cifra etq="auditoría" val={d.tieneAuditoria ? 'sí' : 'no'} />
        <Cifra etq="fuentes" val={`${d.fuentes}/8`} />
      </div>

      {/* Los tres tipos de hallazgo, como los nombró dirección */}
      {CLASES.map(({ k, etiqueta, color }) => {
        const hs = v.hallazgos.filter(x => x.clase === k)
        if (!hs.length) return null
        return (
          <div key={k} style={{ marginTop: 8 }}>
            <span style={C(color, { fontSize: 10, fontWeight: 700, letterSpacing: 0.4 })}>
              {etiqueta.toUpperCase()}
            </span>
            {hs.map((x, i) => (
              <div key={i} style={{ marginTop: 3 }}>
                <span style={C(TX_HI, { fontSize: 11.5 })}>{x.titulo}</span>
                <span style={C(TX_LOW, { fontSize: 11 })}> — {x.prueba}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/** Una cifra, o la palabra que dice que no se midió. Nunca un cero inventado. */
function Cifra({ etq, val }: { etq: string; val: string | null }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'baseline' }}>
      <span style={C(TX_LOW, { fontSize: 10 })}>{etq}</span>
      <span style={C(val === null ? '#FBBF24' : TX_MID, { fontSize: 11, fontWeight: 600 })}>
        {val === null ? 'sin dato' : val}
      </span>
    </span>
  )
}
