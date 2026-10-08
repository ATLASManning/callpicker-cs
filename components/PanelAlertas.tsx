import Link from 'next/link'
import { AlertTriangle, ArrowRight, EyeOff, TrendingDown, Sparkles, Lock } from 'lucide-react'
import {
  ETIQUETA_SEVERIDAD, COLOR_SEVERIDAD, ETIQUETA_FAMILIA, ETIQUETA_DUENO_CORTA, BLOQUEADA,
  type Alerta, type ResumenAlertas, type Familia,
} from '@/lib/alertas'

/**
 * PANEL DE ALERTAS DE CLIENTE — lo primero que se ve al abrir el tablero.
 *
 * Sustituye a «Cumplimiento SAC Semanal», que medía cuántas actividades había
 * cerrado cada ejecutivo. Instrucción de dirección del 6 oct 2026: «no medir
 * cuántas hizo cada ejecutivo, sino conocer cuántas alertas tiene, de qué
 * cuentas, de qué tipo, el riesgo en dinero».
 *
 * ── POR QUÉ EL DINERO VA ARRIBA Y GRANDE ─────────────────────────────────
 * Es el único número que un fundador puede usar para decidir. «184 cuentas en
 * riesgo» no dice si hay que actuar hoy; «$1.78M de MRR en riesgo, 23 de las
 * 25 más grandes» sí. El resto del panel explica ese número.
 *
 * ── POR QUÉ CADA FILA TRAE UN BOTÓN ──────────────────────────────────────
 * Una alerta sin enlace es una queja. El botón lleva exactamente a donde se
 * resuelve —el Radar, los contactos, el seguimiento— porque el costo de
 * cerrarla es lo que decide si se cierra. Es la diferencia con las 383
 * acciones de auditoría que quedaron escritas y sin seguir.
 *
 * ── LOS COLORES VAN EN EL ELEMENTO, NO HEREDADOS ─────────────────────────
 * El panel vive sobre el fondo oscuro de la portada y globals.css fuerza a
 * blanco con !important todo `span` que NO declare `background` en su style.
 * Por eso cada cifra en color declara su fondo, aunque sea transparente. Ver
 * [[atlas-dashboard-contrast-architecture]].
 */

const PANEL = '#0D1829'
const BORDER = 'rgba(255,255,255,0.08)'
const TX_HI = 'rgba(255,255,255,0.94)'
const TX_MID = 'rgba(255,255,255,0.72)'
const TX_LOW = 'rgba(255,255,255,0.48)'

const ICONO_FAMILIA: Record<Familia, typeof EyeOff> = {
  ceguera: EyeOff, riesgo: TrendingDown, oportunidad: Sparkles,
}
const COLOR_FAMILIA: Record<Familia, string> = {
  ceguera: '#A78BFA', riesgo: '#F87171', oportunidad: '#4ADE80',
}

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

export default function PanelAlertas({
  alertas, resumen, falla = null, verTodas = '/alertas',
}: {
  alertas: Alerta[]
  resumen: ResumenAlertas
  /** Motivo por el que NO se pudo medir. Nunca se dibuja un cero en su lugar. */
  falla?: string | null
  verTodas?: string
}) {
  const fam: Familia[] = ['ceguera', 'riesgo', 'oportunidad']
  /* Las cuentas sin asesor NO son una persona. `a.asesor || '(sin asesor)'` las
     agrupa bajo una llave que aquí se dibujaría como una tarjeta más —y la
     rejilla se dimensiona con `min(n, 3)`, así que una cuarta llave deja una
     tarjeta huérfana rompiendo la fila—. Se sacan del corte por ejecutivo y se
     cuentan aparte: que una cuenta viva no tenga dueño SÍ es una decisión de
     dirección, y se dice como tal. */
  const SIN_DUENO = '(sin asesor)'
  const asesores = Object.entries(resumen.porAsesor)
    .filter(([n]) => n !== SIN_DUENO)
    .sort((a, b) => b[1].mrr - a[1].mrr)
  const huerfanas = resumen.porAsesor[SIN_DUENO]
  const bloqueadas = resumen.porDueno.ingenieria.n + resumen.porDueno.direccion.n
  const mrrBloqueado = resumen.porDueno.ingenieria.mrr + resumen.porDueno.direccion.mrr

  /* Un cero sin medición no es un cero: si el motor falló, el panel lo dice en
     lugar de mostrar «$0 en riesgo», que se leería como buenas noticias. */
  if (falla) {
    return (
      <div style={{ background: PANEL, border: '1px solid rgba(217,119,6,0.45)',
                    borderRadius: 16, padding: 20, display: 'flex', gap: 13,
                    alignItems: 'flex-start' }}>
        <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13.5, margin: '0 0 4px' }}>
            <C c={TX_HI} b>No se pudieron calcular las alertas.</C>
          </p>
          <p style={{ fontSize: 11.5, margin: 0, lineHeight: 1.55 }}>
            <C c={TX_MID}>{falla}</C>
            <C c={TX_LOW}>
              {' '}— esto <C c={TX_MID} b>no significa que no haya riesgo</C>: significa que
              hoy no se midió. El resto del tablero sigue siendo válido.
            </C>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>

      {/* ── Encabezado: el dinero manda ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <p style={{ background: 'transparent', fontSize: 13, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.10em', color: TX_MID,
                      margin: '0 0 6px' }}>
            Alertas de cliente
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ background: 'transparent', fontSize: 38, fontWeight: 800,
                           letterSpacing: '-0.03em', color: '#F87171', lineHeight: 1 }}>
              {miles(resumen.mrrEnRiesgo)}
            </span>
            <span style={{ background: 'transparent', fontSize: 13, color: TX_MID }}>
              de MRR en riesgo · {resumen.cuentas} cuentas
            </span>
          </div>
          <p style={{ fontSize: 11.5, margin: '7px 0 0', lineHeight: 1.5, maxWidth: 560 }}>
            <C c={TX_LOW}>
              El dinero se cuenta <C c={TX_MID} b>una vez por cuenta</C>, no por alerta: una
              cuenta con cuatro señales encendidas sigue siendo su MRR, no cuatro veces.
            </C>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {resumen.topEnRiesgo > 0 && (
            <div style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
                          borderRadius: 11, padding: '10px 14px', minWidth: 104 }}>
              <div style={{ background: 'transparent', fontSize: 24, fontWeight: 800,
                            color: '#F87171', lineHeight: 1.1 }}>
                {resumen.topEnRiesgo}<span style={{ fontSize: 14, color: TX_LOW }}>/25</span>
              </div>
              <div style={{ background: 'transparent', fontSize: 10.5, color: TX_MID, marginTop: 3 }}>
                cuentas TOP tocadas
              </div>
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                        borderRadius: 11, padding: '10px 14px', minWidth: 104 }}>
            <div style={{ background: 'transparent', fontSize: 24, fontWeight: 800,
                          color: COLOR_SEVERIDAD.critica.fg, lineHeight: 1.1 }}>
              {resumen.porSeveridad.critica.n}
            </div>
            <div style={{ background: 'transparent', fontSize: 10.5, color: TX_MID, marginTop: 3 }}>
              alertas críticas
            </div>
          </div>
        </div>
      </div>

      {/* ── Las tres familias ───────────────────────────────────────────
           Eran cuatro: `abandono` se fue con el generador SAC el 8 oct 2026.
           La rejilla es `auto-fit`, así que no queda hueco. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(168px,1fr))',
                    gap: 10, marginBottom: 18 }}>
        {fam.map(f => {
          const Icono = ICONO_FAMILIA[f]
          const d = resumen.porFamilia[f]
          return (
            <Link key={f} href={`${verTodas}?familia=${f}`}
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
                       borderRadius: 11, padding: '11px 13px', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <Icono size={13} style={{ color: COLOR_FAMILIA[f], flexShrink: 0 }} />
                <span style={{ background: 'transparent', fontSize: 11, fontWeight: 700,
                               color: TX_MID }}>
                  {ETIQUETA_FAMILIA[f]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{ background: 'transparent', fontSize: 19, fontWeight: 800,
                               color: COLOR_FAMILIA[f], lineHeight: 1 }}>{d.n}</span>
                <span style={{ background: 'transparent', fontSize: 11, color: TX_LOW }}>
                  {miles(d.mrr)}
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Por ejecutivo: lo SUYO separado de lo que no puede cerrar ───
       *
       * Antes este bloque decía «Dan 218 · Claudia 213 · Fátima 176» a secas.
       * Medido el 6 oct 2026: de las 85 críticas de Claudia, 24 no las puede
       * cerrar ella; de las 77 de Dan, 24; de las 65 de Fátima, 26. Un número
       * que mezcla las dos cosas se lee como un reproche por trabajo de otros,
       * y un tablero que reprocha lo imposible se cierra y no se vuelve a
       * abrir — que es exactamente lo que pasó con el Radar y con las 383
       * acciones de auditoría.
       *
       * El total sigue ahí, porque la cuenta es suya y el riesgo también: nadie
       * se desentiende de un cliente porque el dato lo deba otro equipo. Lo que
       * cambia es que el número grande es el que SÍ puede trabajar.
       */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                    marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
        <p style={{ background: 'transparent', fontSize: 10.5, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.07em', color: TX_LOW,
                    margin: 0 }}>
          Riesgo por ejecutivo
        </p>
        <p style={{ fontSize: 10.5, margin: 0 }}>
          <C c={TX_LOW}>el número grande es lo que puede cerrar él mismo</C>
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(asesores.length, 3)}, 1fr)`,
                    gap: 10, marginBottom: 14 }}>
        {asesores.map(([nombre, d]) => (
          <Link key={nombre} href={`${verTodas}?asesor=${encodeURIComponent(nombre)}`}
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
                     borderRadius: 11, padding: '12px 14px', display: 'block' }}>
            <div style={{ background: 'transparent', fontSize: 12.5, fontWeight: 700,
                          color: TX_HI, marginBottom: 6 }}>{nombre}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ background: 'transparent', fontSize: 21, fontWeight: 800,
                             color: '#F87171', lineHeight: 1 }}>{d.propias}</span>
              <span style={{ background: 'transparent', fontSize: 11, color: TX_MID }}>
                suyas, {miles(d.mrr - d.mrrBloqueado)}
              </span>
            </div>
            <div style={{ fontSize: 10.5, marginTop: 5, lineHeight: 1.5 }}>
              <C c={COLOR_SEVERIDAD.critica.fg} b>{d.criticasPropias} críticas</C>
              {d.top > 0 && <><C c={TX_LOW}> · </C><C c="#FBBF24" b>{d.top} TOP</C></>}
            </div>
            {d.bloqueadas > 0 && (
              <div style={{ fontSize: 10, marginTop: 6, paddingTop: 6,
                            borderTop: `1px solid ${BORDER}`, lineHeight: 1.5 }}>
                <C c={TX_LOW}>
                  + <C c="#A78BFA" b>{d.bloqueadas}</C> que no puede cerrar
                  {d.mrrBloqueado > 0 && <> ({miles(d.mrrBloqueado)})</>}
                </C>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Cuentas vivas sin asesor asignado: eso SÍ es decisión de dirección. */}
      {huerfanas && huerfanas.n > 0 && (
        <Link href={`${verTodas}?asesor=${encodeURIComponent(SIN_DUENO)}`}
          style={{ display: 'block', background: 'rgba(122,162,255,0.10)',
                   border: '1px solid rgba(122,162,255,0.30)', borderRadius: 11,
                   padding: '11px 14px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ background: 'transparent', fontSize: 12.5, fontWeight: 700,
                           color: '#7AA2FF' }}>
              {huerfanas.n} alertas en cuentas SIN ejecutivo asignado
            </span>
            <span style={{ background: 'transparent', fontSize: 12, fontWeight: 700,
                           color: '#FBBF24' }}>{miles(huerfanas.mrr)}</span>
          </div>
          <p style={{ fontSize: 10.5, margin: '5px 0 0', lineHeight: 1.5 }}>
            <C c={TX_LOW}>
              No se le pueden cobrar a nadie porque no son de nadie.
              <C c={TX_MID} b> Asignarlas es la decisión.</C>
            </C>
          </p>
        </Link>
      )}

      {/* ── Lo que está bloqueado en otros equipos ───────────────────────
       *
       * Va APARTE y con nombre propio para que escale en vez de desaparecer.
       * Si se mezcla con lo demás, nadie lo mira: no es de nadie en la mesa.
       */}
      {bloqueadas > 0 && (
        <Link href={`${verTodas}?dueno=ingenieria`}
          style={{ display: 'block', background: 'rgba(167,139,250,0.10)',
                   border: '1px solid rgba(167,139,250,0.30)', borderRadius: 11,
                   padding: '11px 14px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
            <Lock size={12} style={{ color: '#A78BFA', flexShrink: 0, alignSelf: 'center' }} />
            <span style={{ background: 'transparent', fontSize: 12.5, fontWeight: 700,
                           color: '#A78BFA' }}>
              {bloqueadas} alertas que el equipo NO puede cerrar
            </span>
            <span style={{ background: 'transparent', fontSize: 12, fontWeight: 700,
                           color: '#FBBF24' }}>{miles(mrrBloqueado)}</span>
            <span style={{ background: 'transparent', fontSize: 11, color: TX_MID,
                           marginLeft: 'auto' }}>
              {resumen.porDueno.ingenieria.n > 0
                && `${resumen.porDueno.ingenieria.n} en Ingeniería`}
              {resumen.porDueno.ingenieria.n > 0 && resumen.porDueno.direccion.n > 0 && ' · '}
              {resumen.porDueno.direccion.n > 0
                && `${resumen.porDueno.direccion.n} esperan decisión`}
            </span>
          </div>
          <p style={{ fontSize: 10.5, margin: '5px 0 0', lineHeight: 1.5 }}>
            <C c={TX_LOW}>
              Ningún ejecutivo puede resolverlas por su cuenta, así que no se les cobran — pero
              tampoco desaparecen: <C c={TX_MID} b>son de la mesa de dirección</C>.
            </C>
          </p>
        </Link>
      )}

      {/* ── La lista: lo que pide acción hoy ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                    marginBottom: 9 }}>
        <p style={{ background: 'transparent', fontSize: 10.5, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.07em', color: TX_LOW, margin: 0 }}>
          Lo que pide acción primero
        </p>
        <Link href={verTodas} style={{ fontSize: 11.5, color: '#7AA2FF', fontWeight: 600 }}>
          Ver las {resumen.total} alertas →
        </Link>
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        {alertas.map(a => {
          const col = COLOR_SEVERIDAD[a.severidad]
          return (
            <div key={a.id}
              style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${BORDER}`,
                       borderLeft: `3px solid ${col.fg}`, borderRadius: 9,
                       padding: '10px 13px', display: 'flex', gap: 13,
                       alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7,
                              flexWrap: 'wrap', marginBottom: 3 }}>
                  {a.esTop && (
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
                                   padding: '1px 6px', borderRadius: 4, color: '#1B1200',
                                   background: '#FBBF24' }}>TOP</span>
                  )}
                  <span style={{ background: 'transparent', fontSize: 13, fontWeight: 700,
                                 color: TX_HI }}>{a.empresa}</span>
                  {a.consecutivo && (
                    <span style={{ background: 'transparent', fontSize: 10.5, color: TX_LOW }}>
                      {a.consecutivo}
                    </span>
                  )}
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 7px',
                                 borderRadius: 999, color: col.fg, background: col.bg }}>
                    {ETIQUETA_SEVERIDAD[a.severidad]}
                  </span>
                  {/* Si el ejecutivo no puede cerrarla, se dice AQUÍ y no al
                      final: las nueve de mayor prioridad del tablero son de
                      Ingeniería, y verlas arriba sin saberlo es lo que hace
                      que alguien cierre la pantalla. */}
                  {BLOQUEADA.has(a.dueno) && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 7px',
                                   borderRadius: 999, color: '#A78BFA',
                                   background: 'rgba(167,139,250,0.14)' }}>
                      {ETIQUETA_DUENO_CORTA[a.dueno]}
                    </span>
                  )}
                  {/* La ANTIGÜEDAD del episodio, que no es lo mismo que `a.dias`
                      —ésos son días SIN CONTACTO—. Por eso se rotulan distinto
                      y pueden convivir en la misma fila. */}
                  {a.nueva && (
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
                                   padding: '1px 6px', borderRadius: 4, color: '#052e16',
                                   background: '#4ADE80' }}>NUEVA</span>
                  )}
                  {!a.nueva && typeof a.diasAbierta === 'number' && (
                    <span style={{ background: 'transparent', fontSize: 10.5,
                                   fontWeight: 700, color: '#FB923C' }}>
                      abierta hace {a.diasAbierta} d
                    </span>
                  )}
                  <span style={{ background: 'transparent', fontSize: 11.5, fontWeight: 700,
                                 color: '#FBBF24', marginLeft: 'auto' }}>
                    {pesos(a.mrr)}<C c={TX_LOW}>/mes</C>
                  </span>
                </div>
                <p style={{ fontSize: 12, margin: '0 0 2px', lineHeight: 1.45 }}>
                  <C c={col.fg} b>{a.titulo}.</C> <C c={TX_MID}>{a.evidencia}</C>
                </p>
                <p style={{ fontSize: 11, margin: 0, lineHeight: 1.45 }}>
                  <C c={TX_LOW}>{a.accion}</C>
                </p>
              </div>
              <Link href={a.enlace}
                style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                         fontSize: 11.5, fontWeight: 600, color: '#7AA2FF',
                         background: 'rgba(122,162,255,0.10)',
                         border: '1px solid rgba(122,162,255,0.28)',
                         borderRadius: 8, padding: '7px 11px', whiteSpace: 'nowrap' }}>
                {a.enlaceEtiqueta} <ArrowRight size={12} />
              </Link>
            </div>
          )
        })}
      </div>

      {alertas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '26px 0' }}>
          <AlertTriangle size={22} style={{ color: '#4ADE80', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, margin: 0 }}><C c={TX_HI} b>Sin alertas abiertas.</C></p>
        </div>
      )}

      <p style={{ fontSize: 10.5, margin: '14px 0 0', lineHeight: 1.55 }}>
        <C c={TX_LOW}>
          Cada alerta dice <C c={TX_MID} b>por qué saltó, con su número</C>, y lleva al lugar
          donde se resuelve. El orden es por severidad y dinero, con las cuentas TOP arriba.
          Las reglas de detección son deterministas: ninguna la decide un modelo.
        </C>
      </p>
    </div>
  )
}
