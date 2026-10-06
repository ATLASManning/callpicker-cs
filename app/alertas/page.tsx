import Link from 'next/link'
import { headers } from 'next/headers'
import { AlertTriangle, ArrowRight, EyeOff, TrendingDown, UserX, Sparkles, Lock } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { detectarAlertas, UMBRALES } from '@/lib/alertas-detectar'
import {
  resumir, ETIQUETA_SEVERIDAD, COLOR_SEVERIDAD, ETIQUETA_FAMILIA, ETIQUETA_DUENO, BLOQUEADA,
  type Alerta, type Familia, type Severidad, type Dueno,
} from '@/lib/alertas'
import { hoyEnPalabras } from '@/lib/fecha-local'

/**
 * /alertas — el expediente completo de riesgo de la cartera.
 *
 * ── POR QUÉ AGRUPA POR CUENTA Y NO LISTA ALERTAS ─────────────────────────
 *
 * Medido en producción: 607 alertas sobre 184 cuentas. Una lista de 607
 * renglones no se lee, y además MIENTE sobre la forma del problema: una cuenta
 * con cinco señales encendidas no son cinco problemas, es UNA cuenta en
 * problemas, y repetirla cinco veces la hace parecer cinco veces más grande de
 * lo que es.
 *
 * El sujeto es la cuenta —como en Custify y ChurnZero—, y sus alertas son lo
 * que le pasa. El MRR aparece UNA vez por cuenta, y el orden lo da la alerta
 * más grave que tiene.
 *
 * ── LOS FILTROS SON ENLACES, NO ESTADO ───────────────────────────────────
 *
 * Así la pantalla se puede compartir: el enlace que dirección le manda a un
 * ejecutivo abre exactamente lo que dirección estaba viendo. Y mantiene la
 * página como componente de servidor, sin un segundo viaje a la API.
 */
export const dynamic = 'force-dynamic'

const PANEL = '#0D1829'
const BORDER = 'rgba(255,255,255,0.08)'
const TX_HI = 'rgba(255,255,255,0.94)'
const TX_MID = 'rgba(255,255,255,0.72)'
const TX_LOW = 'rgba(255,255,255,0.48)'

const ICONO_FAMILIA: Record<Familia, typeof EyeOff> = {
  ceguera: EyeOff, riesgo: TrendingDown, abandono: UserX, oportunidad: Sparkles,
}
const COLOR_FAMILIA: Record<Familia, string> = {
  ceguera: '#A78BFA', riesgo: '#F87171', abandono: '#FB923C', oportunidad: '#4ADE80',
}
const COLOR_DUENO: Record<Dueno, string> = {
  asesor: '#4ADE80', cliente: '#FBBF24', ingenieria: '#A78BFA', direccion: '#7AA2FF',
}

/** Cuántas cuentas se dibujan. El resto se declara, no se esconde. */
const TOPE_CUENTAS = 120

const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')
const miles = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `$${Math.round(n / 1000)}K` : pesos(n)

function C({ c, b, children }: { c: string; b?: boolean; children: React.ReactNode }) {
  return (
    <span style={{ background: 'transparent', color: c, fontWeight: b ? 700 : undefined }}>
      {children}
    </span>
  )
}

function Chip({ href, activo, color, children }: {
  href: string; activo: boolean; color: string; children: React.ReactNode
}) {
  return (
    <Link href={href}
      style={{ fontSize: 11.5, fontWeight: 600, padding: '6px 12px', borderRadius: 999,
               color: activo ? '#071018' : color,
               background: activo ? color : 'rgba(255,255,255,0.05)',
               border: `1px solid ${activo ? color : BORDER}`, whiteSpace: 'nowrap' }}>
      {children}
    </Link>
  )
}

interface Grupo {
  cuentaId: string
  empresa: string
  consecutivo: string | null
  asesor: string | null
  mrr: number
  esTop: boolean
  alertas: Alerta[]
  prioridad: number
}

function agrupar(alertas: Alerta[]): Grupo[] {
  const m = new Map<string, Grupo>()
  for (const a of alertas) {
    let g = m.get(a.cuentaId)
    if (!g) {
      g = { cuentaId: a.cuentaId, empresa: a.empresa, consecutivo: a.consecutivo,
            asesor: a.asesor, mrr: a.mrr, esTop: a.esTop, alertas: [], prioridad: 0 }
      m.set(a.cuentaId, g)
    }
    g.alertas.push(a)
    // La prioridad de la cuenta es la de su alerta MÁS GRAVE, no la suma: una
    // cuenta con seis avisos medios no es más urgente que una con uno crítico.
    if (a.prioridad > g.prioridad) g.prioridad = a.prioridad
  }
  return [...m.values()].sort((x, y) =>
    y.prioridad - x.prioridad || y.mrr - x.mrr || x.empresa.localeCompare(y.empresa, 'es'))
}

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: { familia?: string; severidad?: string; asesor?: string; dueno?: string }
}) {
  const h = headers()
  const rol = h.get('x-user-rol') ?? 'viewer'
  const suyo = decodeURIComponent(h.get('x-user-asesor') ?? '')
  const esAsesor = rol === 'asesor' && !!suyo

  /* Un asesor ve SU cartera aunque el enlace diga otra cosa. El filtro de la
     barra es una comodidad para dirección, no un permiso. */
  const asesorPedido = esAsesor ? suyo : (searchParams.asesor || '')

  let alertas: Alerta[] = []
  let falla: string | null = null
  try {
    alertas = await detectarAlertas(asesorPedido ? { asesor: asesorPedido } : undefined)
  } catch (e) {
    falla = (e as Error)?.message || 'una fuente no respondió'
  }

  // El resumen es del UNIVERSO consultado, antes de los filtros de la barra:
  // así el total de la cabecera no se mueve al picar un chip, que es lo que
  // hace que dos personas lean dos cifras distintas del mismo tablero.
  const resumen = resumir(alertas)

  const famSel = (searchParams.familia || '') as Familia | ''
  const sevSel = (searchParams.severidad || '') as Severidad | ''
  const dueSel = (searchParams.dueno || '') as Dueno | ''
  let visibles = alertas
  if (famSel) visibles = visibles.filter(a => a.familia === famSel)
  if (sevSel) visibles = visibles.filter(a => a.severidad === sevSel)
  if (dueSel) visibles = visibles.filter(a => a.dueno === dueSel)

  const grupos = agrupar(visibles)
  const dibujados = grupos.slice(0, TOPE_CUENTAS)
  const ocultos = grupos.length - dibujados.length
  const mrrOculto = grupos.slice(TOPE_CUENTAS).reduce((s, g) => s + g.mrr, 0)

  const q = (cambio: Record<string, string>) => {
    const p = new URLSearchParams()
    const base: Record<string, string> = {
      familia: famSel, severidad: sevSel, dueno: dueSel,
      asesor: esAsesor ? '' : asesorPedido,
    }
    for (const [k, v] of Object.entries({ ...base, ...cambio })) if (v) p.set(k, v)
    const s = p.toString()
    return '/alertas' + (s ? `?${s}` : '')
  }

  const fam: Familia[] = ['ceguera', 'riesgo', 'abandono', 'oportunidad']
  const sev: Severidad[] = ['critica', 'alta', 'media', 'oportunidad']
  const due: Dueno[] = ['asesor', 'cliente', 'ingenieria', 'direccion']
  const asesores = Object.entries(resumen.porAsesor).sort((a, b) => b[1].mrr - a[1].mrr)

  return (
    <div>
      <PageHeader
        title="Alertas de cliente"
        subtitle={
          falla
            ? 'No se pudieron calcular — ver el aviso abajo'
            : `${resumen.total} alertas sobre ${resumen.cuentas} cuentas · `
              + `${miles(resumen.mrrEnRiesgo)} de MRR en riesgo · ${hoyEnPalabras()}`
        }
      />

      {falla && (
        <div className="mx-6 mb-5" style={{ background: PANEL,
              border: '1px solid rgba(217,119,6,0.45)', borderRadius: 14, padding: 18,
              display: 'flex', gap: 13, alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13.5, margin: '0 0 4px' }}>
              <C c={TX_HI} b>No se pudieron calcular las alertas.</C>
            </p>
            <p style={{ fontSize: 11.5, margin: 0, lineHeight: 1.55 }}>
              <C c={TX_MID}>{falla}</C>
              <C c={TX_LOW}>
                {' '}— esto <C c={TX_MID} b>no significa que no haya riesgo</C>, significa que
                hoy no se midió.
              </C>
            </p>
          </div>
        </div>
      )}

      {!falla && (
        <>
          {/* ── Cabecera: el dinero y las particiones ───────────────────── */}
          <div className="mx-6 mb-4" style={{ background: PANEL, border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 11,
                          flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ background: 'transparent', fontSize: 40, fontWeight: 800,
                             letterSpacing: '-0.03em', color: '#F87171', lineHeight: 1 }}>
                {miles(resumen.mrrEnRiesgo)}
              </span>
              <span style={{ background: 'transparent', fontSize: 13.5, color: TX_MID }}>
                de MRR en riesgo · {resumen.cuentas} cuentas · {resumen.total} alertas
              </span>
              {resumen.topEnRiesgo > 0 && (
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px',
                               borderRadius: 999, color: '#1B1200', background: '#FBBF24' }}>
                  {resumen.topEnRiesgo} de las 25 TOP
                </span>
              )}
            </div>
            <p style={{ fontSize: 11.5, margin: '0 0 16px', lineHeight: 1.55, maxWidth: 680 }}>
              <C c={TX_LOW}>
                El dinero se cuenta <C c={TX_MID} b>una vez por cuenta</C>. Las cifras de arriba
                son del universo completo{asesorPedido ? ` de ${asesorPedido}` : ''} y
                <C c={TX_MID} b> no cambian al filtrar</C>: los filtros mueven la lista, no el total.
              </C>
            </p>

            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 9 }}>
              <Chip href={q({ familia: '' })} activo={!famSel} color="#7AA2FF">
                Todas las familias
              </Chip>
              {fam.map(f => {
                const Icono = ICONO_FAMILIA[f]
                return (
                  <Chip key={f} href={q({ familia: famSel === f ? '' : f })}
                    activo={famSel === f} color={COLOR_FAMILIA[f]}>
                    <Icono size={11} style={{ display: 'inline', verticalAlign: '-1px',
                                              marginRight: 5 }} />
                    {ETIQUETA_FAMILIA[f]} · {resumen.porFamilia[f].n}
                  </Chip>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 9 }}>
              <Chip href={q({ severidad: '' })} activo={!sevSel} color="#7AA2FF">
                Toda severidad
              </Chip>
              {sev.map(s => (
                <Chip key={s} href={q({ severidad: sevSel === s ? '' : s })}
                  activo={sevSel === s} color={COLOR_SEVERIDAD[s].fg}>
                  {ETIQUETA_SEVERIDAD[s]} · {resumen.porSeveridad[s].n}
                </Chip>
              ))}
            </div>

            {/* ── Quién puede cerrarla ───────────────────────────────── */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap',
                          marginBottom: asesores.length > 1 && !esAsesor ? 9 : 0 }}>
              <Chip href={q({ dueno: '' })} activo={!dueSel} color="#7AA2FF">
                Quien sea que la cierre
              </Chip>
              {due.map(k => (
                <Chip key={k} href={q({ dueno: dueSel === k ? '' : k })}
                  activo={dueSel === k} color={COLOR_DUENO[k]}>
                  {BLOQUEADA.has(k) && (
                    <Lock size={10} style={{ display: 'inline', verticalAlign: '-1px',
                                             marginRight: 4 }} />
                  )}
                  {ETIQUETA_DUENO[k]} · {resumen.porDueno[k].n}
                </Chip>
              ))}
            </div>

            {!esAsesor && asesores.length > 1 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <Chip href={q({ asesor: '' })} activo={!asesorPedido} color="#94A3B8">
                  Toda la cartera
                </Chip>
                {asesores.map(([n, d]) => (
                  <Chip key={n} href={q({ asesor: asesorPedido === n ? '' : n })}
                    activo={asesorPedido === n} color="#94A3B8">
                    {n} · {miles(d.mrr)}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {/* ── Las cuentas ─────────────────────────────────────────────── */}
          <div className="mx-6 pb-6" style={{ display: 'grid', gap: 10 }}>
            {dibujados.map(g => (
              <div key={g.cuentaId} style={{ background: PANEL, border: `1px solid ${BORDER}`,
                    borderRadius: 14, padding: '15px 17px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9,
                              flexWrap: 'wrap', marginBottom: 11 }}>
                  {g.esTop && (
                    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em',
                                   padding: '2px 7px', borderRadius: 4, color: '#1B1200',
                                   background: '#FBBF24' }}>TOP</span>
                  )}
                  <Link href={`/cuentas/${g.cuentaId}`}
                    style={{ background: 'transparent', fontSize: 15, fontWeight: 700,
                             color: TX_HI }}>
                    {g.empresa}
                  </Link>
                  {g.consecutivo && (
                    <span style={{ background: 'transparent', fontSize: 11, color: TX_LOW }}>
                      {g.consecutivo}
                    </span>
                  )}
                  {g.asesor && (
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px',
                                   borderRadius: 999, color: '#CBD5E1',
                                   background: 'rgba(255,255,255,0.07)' }}>
                      {g.asesor}
                    </span>
                  )}
                  <span style={{ background: 'transparent', fontSize: 13.5, fontWeight: 700,
                                 color: '#FBBF24', marginLeft: 'auto' }}>
                    {pesos(g.mrr)}<C c={TX_LOW}>/mes</C>
                  </span>
                  <span style={{ background: 'transparent', fontSize: 11, color: TX_LOW }}>
                    {g.alertas.length} {g.alertas.length === 1 ? 'alerta' : 'alertas'}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  {g.alertas.map(a => {
                    const col = COLOR_SEVERIDAD[a.severidad]
                    const Icono = ICONO_FAMILIA[a.familia]
                    return (
                      <div key={a.id}
                        style={{ background: 'rgba(255,255,255,0.035)',
                                 borderLeft: `3px solid ${col.fg}`, borderRadius: 8,
                                 padding: '9px 12px', display: 'flex', gap: 12,
                                 alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7,
                                        flexWrap: 'wrap', marginBottom: 2 }}>
                            <Icono size={12} style={{ color: COLOR_FAMILIA[a.familia],
                                                      flexShrink: 0 }} />
                            <span style={{ background: 'transparent', fontSize: 12.5,
                                           fontWeight: 700, color: col.fg }}>{a.titulo}</span>
                            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 7px',
                                           borderRadius: 999, color: col.fg, background: col.bg }}>
                              {ETIQUETA_SEVERIDAD[a.severidad]}
                            </span>
                            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 7px',
                                           borderRadius: 999, color: COLOR_DUENO[a.dueno],
                                           background: 'rgba(255,255,255,0.06)' }}>
                              {BLOQUEADA.has(a.dueno) && (
                                <Lock size={9} style={{ display: 'inline',
                                                        verticalAlign: '-1px', marginRight: 3 }} />
                              )}
                              {ETIQUETA_DUENO[a.dueno]}
                            </span>
                            {a.dias !== null && (
                              <span style={{ background: 'transparent', fontSize: 10.5,
                                             color: TX_LOW }}>
                                {a.dias} días
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 11.5, margin: '0 0 2px', lineHeight: 1.45 }}>
                            <C c={TX_MID}>{a.evidencia}</C>
                          </p>
                          <p style={{ fontSize: 11, margin: 0, lineHeight: 1.45 }}>
                            <C c={TX_LOW}>{a.accion}</C>
                          </p>
                        </div>
                        <Link href={a.enlace}
                          style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center',
                                   gap: 5, fontSize: 11, fontWeight: 600, color: '#7AA2FF',
                                   background: 'rgba(122,162,255,0.10)',
                                   border: '1px solid rgba(122,162,255,0.28)',
                                   borderRadius: 8, padding: '6px 10px', whiteSpace: 'nowrap' }}>
                          {a.enlaceEtiqueta} <ArrowRight size={11} />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {grupos.length === 0 && (
              <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14,
                            padding: '34px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13.5, margin: 0 }}>
                  <C c={TX_HI} b>
                    {famSel || sevSel
                      ? 'Ningún aviso con este filtro.'
                      : 'Sin alertas abiertas en esta cartera.'}
                  </C>
                </p>
              </div>
            )}

            {/* El resto NO se esconde: se declara con su dinero. */}
            {ocultos > 0 && (
              <p style={{ fontSize: 11.5, margin: '2px 0 0', lineHeight: 1.55,
                          textAlign: 'center' }}>
                <C c={TX_LOW}>
                  Se dibujan las <C c={TX_MID} b>{TOPE_CUENTAS}</C> cuentas de mayor prioridad.
                  Quedan <C c={TX_MID} b>{ocultos}</C> más, con{' '}
                  <C c={TX_MID} b>{miles(mrrOculto)}</C> de MRR entre todas — filtrá por familia
                  o severidad para llegar a ellas.
                </C>
              </p>
            )}
          </div>

          {/* ── Las reglas, a la vista ──────────────────────────────────── */}
          <div className="mx-6 mb-6" style={{ background: PANEL, border: `1px solid ${BORDER}`,
                borderRadius: 14, padding: '15px 18px' }}>
            <p style={{ background: 'transparent', fontSize: 10.5, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.07em', color: TX_LOW,
                        margin: '0 0 7px' }}>
              Con qué umbrales se levantan
            </p>
            <p style={{ fontSize: 11.5, margin: 0, lineHeight: 1.65 }}>
              <C c={TX_MID}>
                Caída sostenida: {UMBRALES.mesesCaida} meses consecutivos a la baja con al menos{' '}
                {Math.round(UMBRALES.caidaMinima * 100)}% de pérdida, partiendo de un consumo
                de {UMBRALES.consumoMinimoParaMirar}% o más. Desplome: venía de{' '}
                {UMBRALES.desplomeDesde}% y cayó por debajo de {UMBRALES.desplomeHasta}%.
                Consumo cero: ni un minuto en todo el periodo medido, que se separa del uso
                bajo porque no es lo mismo aprovechar poco el plan que no usarlo. Uso
                crónicamente bajo: nunca pasó de {UMBRALES.usoBajo}%. Silencio:{' '}
                {UMBRALES.silencioCorto} y {UMBRALES.silencioLargo} días, contados desde el
                último contacto que <strong style={{ background: 'transparent',
                  color: 'rgba(255,255,255,0.94)' }}>llegó al cliente</strong> — una llamada que
                nadie contestó no reinicia el reloj. Sin interlocutor:{' '}
                {UMBRALES.intentosFallidos} intentos fallidos seguidos. Rebase: por encima
                del {UMBRALES.rebase}% de la bolsa.
              </C>
              <C c={TX_LOW}>
                {' '}Las reglas son deterministas y se leen en <code>lib/alertas-detectar.ts</code>:
                ninguna alerta la decide un modelo. Cambiar un umbral cambia el volumen de todo
                el equipo, así que se mueve de común acuerdo con dirección.
              </C>
            </p>
          </div>
        </>
      )}
    </div>
  )
}
