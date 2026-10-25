'use client'

/**
 * Cuentas → Contratos.
 *
 * Pedido por dirección (24 oct 2026): conciliar la hoja de contratos con las
 * cuentas TOP, una ventana con los próximos a vencer, la lista de todos y una
 * gráfica con selección de dimensión.
 *
 * ── LO QUE ESTA PANTALLA SE NIEGA A HACER ─────────────────────────────────
 *
 * 1. NO cuenta como «sin vencimiento» lo que simplemente no tiene fecha. Son
 *    27 de 60 contratos: decir que no vencen sería afirmar algo que la hoja no
 *    dice. Van en su propio renglón, con esas palabras.
 * 2. NO esconde los 36 contratos que no cruzan con la cartera. Cuando se parte
 *    por giro, tamaño o facturación —dimensiones que sólo existen para los que
 *    cruzan— caen en un cubo «fuera de la cartera CS» y el reparto cierra.
 * 3. NO pinta el color de la hoja como si fuera un estado: el mismo estatus
 *    aparece en negro, azul y rojo.
 *
 * La página es clara y sin `.cp-card`: letra oscura sobre fondo claro.
 * [[atlas-dashboard-contrast-architecture]]
 */
import { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import SoloEnCliente from '@/components/charts/SoloEnCliente'
import {
  DIMENSIONES, ETIQUETA_ESTADO, repartir,
  type Dimension, type RespuestaContratos, type ContratoCruzado,
} from '@/lib/contratos-norm'

const MARINO = '#10355D'
const CIAN   = '#39ABD8'
const LINEA  = '#DFE8EF'
const LAVADO = '#F5F8FB'
const TX_ALTO = '#202E3B'
const TX_MED  = '#3D4B5C'
const TX_BAJO = '#667384'
const ROJO_TX = '#A4262C'
const AMBAR_TX = '#8A5200'

const pesos = (n: number | null) =>
  n === null || n === undefined ? '—'
    : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

/** «2026-10-24» → «24 oct 2026». Sin `toISOString`: ya viene anclada. */
function fechaCorta(iso: string | null): string {
  if (!iso) return '—'
  const M = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${+iso.slice(8, 10)} ${M[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`
}

export default function ContratosPage() {
  const [d, setD] = useState<RespuestaContratos | null>(null)
  const [falla, setFalla] = useState<string | null>(null)
  const [dim, setDim] = useState<Dimension>('estado')
  const [soloCartera, setSoloCartera] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/contratos')
      .then(async r => {
        /* UN 403 NO ES UN FALLO DE LECTURA, ES UN PERMISO — y se dice con
           esas palabras. `/api/contratos` no está en la lista del rol
           `perfilamiento`, mientras que la PÁGINA sí le toca porque
           `/cuentas` se concede por prefijo. Sin este mensaje, ese rol vería
           «no se pudo cargar» y nadie sabría que lo que falta es un permiso
           y no el dato. [[project-callpicker-auth-pending]] */
        if (r.status === 403) {
          throw new Error('Tu rol no tiene acceso a los contratos. '
                        + 'No es que no haya datos: es un permiso.')
        }
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
        return j
      })
      .then(setD)
      .catch(e => setFalla(String(e.message ?? e)))
  }, [])

  const base = useMemo(
    () => (d?.contratos ?? []).filter(c => !soloCartera || c.enCartera),
    [d, soloCartera],
  )

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const xs = q
      ? base.filter(c =>
          c.cuenta.toLowerCase().includes(q) ||
          (c.empresaCartera ?? '').toLowerCase().includes(q) ||
          (c.consecutivo ?? '').toLowerCase().includes(q) ||
          (c.cid ?? '').includes(q))
      : base
    /* Los que vencen primero arriba; los que no tienen fecha, al final — no
       mezclados entre medias como si vencieran en el año 0. */
    return [...xs].sort((a, b) => {
      if (a.diasParaVencer === null && b.diasParaVencer === null) return a.cuenta.localeCompare(b.cuenta, 'es')
      if (a.diasParaVencer === null) return 1
      if (b.diasParaVencer === null) return -1
      return a.diasParaVencer - b.diasParaVencer
    })
  }, [base, busca])

  const vencen = useMemo(() => {
    const con = base.filter(c => c.diasParaVencer !== null)
    return {
      vencidos: con.filter(c => (c.diasParaVencer as number) < 0),
      en30:  con.filter(c => (c.diasParaVencer as number) >= 0 && (c.diasParaVencer as number) <= 30),
      en90:  con.filter(c => (c.diasParaVencer as number) > 30 && (c.diasParaVencer as number) <= 90),
    }
  }, [base])

  const reparto = useMemo(() => (d ? repartir(base, dim) : []), [d, base, dim])
  const maxN = Math.max(1, ...reparto.map(r => r.n))

  if (falla) {
    return (
      <div style={{ padding: 32 }}>
        <PageHeader title="Contratos" subtitle="Cuentas · contratos con clientes" />
        <div style={{ margin: '24px 0', padding: 16, borderRadius: 12,
                      background: '#FEF2F2', border: '1px solid #FECACA', color: ROJO_TX }}>
          <strong>No se pudo cargar.</strong> {falla}
          <p style={{ fontSize: 12, marginTop: 6, color: TX_MED }}>
            Esto es un fallo de lectura, no un resultado: no significa que no haya contratos.
          </p>
        </div>
      </div>
    )
  }
  if (!d) {
    return (
      <div style={{ padding: 32 }}>
        <PageHeader title="Contratos" subtitle="Cuentas · contratos con clientes" />
        <p style={{ color: TX_BAJO, marginTop: 24 }}>Cargando contratos…</p>
      </div>
    )
  }

  const m = d.meta

  return (
    <div style={{ minHeight: '100%' }}>
      <PageHeader
        title="Contratos"
        subtitle={`${m.total} contratos · ${m.porEstado.firmado ?? 0} firmados · `
                + `${m.enCartera} cruzan con la cartera y ${m.fueraDeCartera} no · `
                + `hoja del ${fechaCorta(m.generado.slice(0, 10))}`}
      />

      {/* ═══ LA VENTANA DE VENCIMIENTOS ═══════════════════════════════════ */}
      <div style={{ padding: '20px 32px 0' }}>
        <div style={{ borderRadius: 14, border: `1px solid ${vencen.vencidos.length ? '#FECACA' : LINEA}`,
                      background: vencen.vencidos.length ? '#FFF7F7' : LAVADO, padding: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
            <Caja n={vencen.vencidos.length} label="YA VENCIDOS"      color={ROJO_TX} />
            <Caja n={vencen.en30.length}     label="VENCEN EN 30 DÍAS" color={AMBAR_TX} />
            <Caja n={vencen.en90.length}     label="ENTRE 31 Y 90 DÍAS" color={MARINO} />
            <Caja n={m.sinVencimiento}       label="SIN VENCIMIENTO"   color={TX_BAJO}
                  pie="plazo «libre»" />
            <Caja n={m.noMedibles}           label="NO SE SABE"        color={TX_BAJO}
                  pie="ni fecha ni plazo libre" />
          </div>

          {/* La frase que impide la lectura cómoda. */}
          <p style={{ fontSize: 12, color: TX_MED, lineHeight: 1.65, marginTop: 14,
                      borderTop: `1px solid ${LINEA}`, paddingTop: 12 }}>
            Los vencimientos se cuentan <strong>sólo sobre los {m.conFin} contratos que traen
            fecha de término</strong>. Otros {m.sinVencimiento} tienen plazo «libre», que no vence
            por definición. Y <strong>{m.noMedibles} no traen ni fecha ni plazo libre</strong>: de
            ésos no se sabe cuándo vencen, que no es lo mismo que decir que no vencen. Se arregla
            capturando la fecha en la hoja de origen.
          </p>

          {vencen.vencidos.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: ROJO_TX, marginBottom: 8 }}>
                Los {vencen.vencidos.length} que ya vencieron, del más antiguo:
              </p>
              <div style={{ display: 'grid', gap: 6 }}>
                {[...vencen.vencidos]
                  .sort((a, b) => (a.diasParaVencer as number) - (b.diasParaVencer as number))
                  .map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12.5,
                                          alignItems: 'baseline', color: TX_ALTO }}>
                      <span style={{ fontWeight: 700, minWidth: 230 }}>{c.cuenta}</span>
                      {c.consecutivo && <Pastilla texto={c.consecutivo} />}
                      {c.esTop && <Pastilla texto="TOP" fuerte />}
                      <span style={{ color: TX_MED }}>venció el {fechaCorta(c.fin)}</span>
                      <span style={{ color: ROJO_TX, fontWeight: 700 }}>
                        hace {Math.abs(c.diasParaVencer as number)} días
                      </span>
                      <span style={{ color: TX_BAJO }}>{ETIQUETA_ESTADO[c.estado]}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ LAS TOP SIN CONTRATO ═════════════════════════════════════════ */}
      <div style={{ padding: '18px 32px 0' }}>
        <div style={{ borderRadius: 14, border: `1px solid ${LINEA}`, background: '#FFFFFF', padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: TX_ALTO, marginBottom: 4 }}>
            Cuentas TOP y su contrato
          </h3>
          <p style={{ fontSize: 12.5, color: TX_MED, lineHeight: 1.65, marginBottom: 12 }}>
            De las <strong>{m.topTotal} cuentas TOP</strong> de la cartera,{' '}
            <strong style={{ color: MARINO }}>{m.topConContrato} tienen contrato firmado</strong> y{' '}
            <strong style={{ color: ROJO_TX }}>{d.topSinContrato.length} no</strong>. Esto se calcula
            desde la cartera y no desde la hoja: mirando sólo los contratos nunca se vería a quien
            no tiene ninguno.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: LAVADO }}>
                  {['Cuenta', 'Consec.', 'Asesor', 'Estado', 'Facturación'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Facturación' ? 'right' : 'left',
                                         padding: '8px 10px', color: TX_BAJO, fontWeight: 700,
                                         fontSize: 11, textTransform: 'uppercase',
                                         borderBottom: `1px solid ${LINEA}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.topSinContrato.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${LINEA}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: TX_ALTO }}>{t.empresa}</td>
                    <td style={{ padding: '8px 10px', color: TX_MED }}>{t.consecutivo ?? '—'}</td>
                    <td style={{ padding: '8px 10px', color: TX_MED }}>{t.asesor ?? 'sin asesor'}</td>
                    <td style={{ padding: '8px 10px', color: TX_MED }}>{t.estado ?? '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: TX_ALTO,
                                 fontVariantNumeric: 'tabular-nums' }}>{pesos(t.mrr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ LA GRÁFICA, CON SELECTOR DE DIMENSIÓN ════════════════════════ */}
      <div style={{ padding: '18px 32px 0' }}>
        <div style={{ borderRadius: 14, border: `1px solid ${LINEA}`, background: '#FFFFFF', padding: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: TX_ALTO }}>Reparto de contratos</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <select value={dim} onChange={e => setDim(e.target.value as Dimension)}
                      style={{ fontSize: 12.5, padding: '6px 10px', borderRadius: 8,
                               border: `1px solid ${LINEA}`, color: TX_ALTO, background: '#FFF' }}>
                {DIMENSIONES.map(x => (
                  <option key={x.id} value={x.id}>
                    {x.label}{x.soloCartera ? ' (sólo cartera)' : ''}
                  </option>
                ))}
              </select>
              <label style={{ fontSize: 12, color: TX_MED, display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={soloCartera}
                       onChange={e => setSoloCartera(e.target.checked)} />
                sólo los que cruzan con la cartera
              </label>
            </div>
          </div>

          <SoloEnCliente>
            <div style={{ display: 'grid', gap: 9 }}>
              {reparto.map(r => (
                <div key={r.clave}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                fontSize: 12.5, marginBottom: 3, gap: 12 }}>
                    {/* `cuentas.giro` es TEXTO LIBRE y hay valores de más de
                        ochenta caracteres («Correduría / Despacho de Seguros
                        Independiente - Ramos: Auto, Vida, GMM…»). Se recorta
                        la ETIQUETA, nunca el dato: el valor completo queda en
                        el `title` y el reparto sigue contando sobre el
                        original. Inventar categorías para que quepan sería
                        meter una clasificación que nadie acordó. */}
                    <span style={{ color: TX_ALTO, fontWeight: 600, overflow: 'hidden',
                                   textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={r.clave}>{r.clave}</span>
                    <span style={{ color: TX_MED, fontVariantNumeric: 'tabular-nums' }}>
                      {r.n} · {Math.round((r.n / base.length) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: LAVADO, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999,
                                  width: `${(r.n / maxN) * 100}%`,
                                  background: r.clave.startsWith('fuera de la cartera') ? TX_BAJO
                                            : r.clave.includes('sin ') ? '#B9C4D0' : MARINO }} />
                  </div>
                </div>
              ))}
            </div>
          </SoloEnCliente>

          {/* EL REPARTO CIERRA, Y SE DICE. */}
          <p style={{ fontSize: 11.5, color: TX_BAJO, marginTop: 12, lineHeight: 1.6,
                      borderTop: `1px solid ${LINEA}`, paddingTop: 10 }}>
            Las {reparto.length} partes suman{' '}
            <strong style={{ color: TX_MED }}>{reparto.reduce((s, r) => s + r.n, 0)} de {base.length}</strong>{' '}
            contratos: ninguno se queda fuera del reparto.
            {DIMENSIONES.find(x => x.id === dim)?.soloCartera && !soloCartera && (
              <> Esta dimensión sale de la cartera, así que los {m.fueraDeCartera} contratos que no
              cruzan van en su propio cubo en vez de desaparecer.</>
            )}
            {dim === 'giro' && (
              <> El giro se captura como <strong>texto libre</strong> en la ficha de cada cuenta, no
              con un catálogo, así que casi cada cuenta trae el suyo y las barras salen de una en
              una. Pasa el cursor para leer el valor completo. Agrupar esto pide decidir un catálogo
              de sectores, que es de dirección.</>
            )}
          </p>
        </div>
      </div>

      {/* ═══ LA LISTA DE TODOS ════════════════════════════════════════════ */}
      <div style={{ padding: '18px 32px 32px' }}>
        <div style={{ borderRadius: 14, border: `1px solid ${LINEA}`, background: '#FFFFFF',
                      overflow: 'hidden' }}>
          <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12,
                        alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: `1px solid ${LINEA}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: TX_ALTO }}>
              Todos los contratos ({lista.length})
            </h3>
            <input value={busca} onChange={e => setBusca(e.target.value)}
                   placeholder="Buscar por cuenta, consecutivo o CID…"
                   style={{ fontSize: 12.5, padding: '7px 11px', borderRadius: 8, minWidth: 260,
                            border: `1px solid ${LINEA}`, color: TX_ALTO }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: LAVADO }}>
                  {['Cuenta', 'Consec.', 'Estatus', 'Plazo', 'Inicio', 'Fin', 'Vence', 'Asesor', 'Doc.']
                    .map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: TX_BAJO,
                                           fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                                           borderBottom: `1px solid ${LINEA}`, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((c, i) => <Fila key={i} c={c} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Caja({ n, label, color, pie }: {
  n: number; label: string; color: string; pie?: string
}) {
  return (
    <div style={{ minWidth: 128 }}>
      <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em',
                  color: TX_BAJO, marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color }}>{n}</p>
      {pie && <p style={{ fontSize: 11, color: TX_BAJO, marginTop: 3 }}>{pie}</p>}
    </div>
  )
}

function Pastilla({ texto, fuerte }: { texto: string; fuerte?: boolean }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                   background: fuerte ? MARINO : LAVADO,
                   color: fuerte ? '#FFFFFF' : TX_MED,
                   border: `1px solid ${fuerte ? MARINO : LINEA}` }}>{texto}</span>
  )
}

function Fila({ c }: { c: ContratoCruzado }) {
  const vence = c.diasParaVencer === null
    ? (c.sinVencimiento
        ? <span style={{ color: TX_BAJO }}>sin vencimiento</span>
        : <span style={{ color: TX_BAJO }}>no se sabe</span>)
    : c.diasParaVencer < 0
      ? <strong style={{ color: ROJO_TX }}>venció hace {Math.abs(c.diasParaVencer)} d</strong>
      : c.diasParaVencer <= 30
        ? <strong style={{ color: AMBAR_TX }}>en {c.diasParaVencer} d</strong>
        : <span style={{ color: TX_MED }}>en {c.diasParaVencer} d</span>

  return (
    <tr style={{ borderBottom: `1px solid ${LINEA}` }}>
      <td style={{ padding: '8px 10px', color: TX_ALTO }}>
        <span style={{ fontWeight: 600 }}>{c.cuenta}</span>
        {c.esTop && <> <Pastilla texto="TOP" fuerte /></>}
        {!c.enCartera && (
          <div style={{ fontSize: 11, color: TX_BAJO, marginTop: 2 }}>fuera de la cartera CS</div>
        )}
      </td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{c.consecutivo ?? '—'}</td>
      <td style={{ padding: '8px 10px', color: c.estado === 'firmado' ? TX_ALTO : AMBAR_TX }}>
        {ETIQUETA_ESTADO[c.estado]}
      </td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{c.plazo ?? '—'}</td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{fechaCorta(c.inicio)}</td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{fechaCorta(c.fin)}</td>
      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{vence}</td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{c.asesor ?? '—'}</td>
      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
        {c.gdoc && /^https?:\/\//.test(c.gdoc)
          ? <a href={c.gdoc} target="_blank" rel="noopener noreferrer"
               style={{ color: '#1D6CAA', fontWeight: 600 }}>ver</a>
          : <span style={{ color: TX_BAJO }}>—</span>}
      </td>
    </tr>
  )
}
