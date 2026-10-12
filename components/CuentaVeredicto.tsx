import Link from 'next/link'
import { AlertTriangle, Gift, Search, ArrowUpRight, Phone, ClipboardList, Ear, History } from 'lucide-react'
import { SITUACION, LUZ, type Veredicto, type ClaseHallazgo } from '@/lib/alertas-veredicto'
import { tonoSobreClaro, tonoSobreFondo, pastillaClara } from '@/lib/contraste'
import type { Guion } from '@/lib/alertas-guion'
import type { Movimiento, Sentido } from '@/lib/alertas-movimiento'

/**
 * components/CuentaVeredicto.tsx — EL VEREDICTO DE LA CUENTA, EN SU PROPIA FICHA
 *
 * ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * Pregunta de dirección, 8 oct 2026: «¿y dónde están las ALERTAS para los
 * asesores en sus módulos?». La respuesta honesta era: en ningún sitio. El
 * módulo existía y estaba en el menú, pero al retirar el generador SAC quité el
 * botón de Actividades de la tarjeta del asesor y el panel de la ficha, y no
 * puse nada en su lugar. Las alertas ENLAZABAN a la ficha —las anclas
 * `#contactos`, `#radar`, `#ficha` siguen ahí— y la ficha no contestaba nada.
 *
 * ── ESTE PANEL ES UNA ISLA CLARA, Y ESO MANDA SOBRE TODOS SUS COLORES ──────
 *
 * La primera versión lo pinté con letra blanca y se publicó ilegible: José
 * Manuel lo reportó con una captura en la que el texto sólo se leía
 * SELECCIONÁNDOLO, que es exactamente como llegaron las siete rondas
 * anteriores del mismo bug.
 *
 * La dirección es al revés de lo que sugiere una captura del tablero. La
 * PÁGINA es clara —`#EFF6FF`—; las `.cp-card` son las islas OSCURAS. Y la
 * ficha de cuenta no tiene ni una `.cp-card`: comprobado, cero coincidencias en
 * `app/cuentas/[id]/page.tsx`. O sea que todo lo que se dibuje aquí está a
 * nivel de página.
 *
 * La regla, con las palabras con que la pidió: **fondo claro letra oscura, y
 * viceversa**. Dentro de una tarjeta oscura, letra clara; a nivel de página,
 * letra oscura — azul marino. Ver [[atlas-dashboard-contrast-architecture]].
 *
 * Los tonos de color NO se eligen a ojo: `tonoSobreClaro` y `pastillaClara`
 * oscurecen cada matiz hasta que mide 4.5:1 sobre su propio fondo. El ámbar
 * `#F59E0B` a pelo da 1.93:1 sobre claro — se ve, pero no se lee.
 */

/** Azul marino de la casa para el texto a nivel de página. */
const MARINO   = '#122E5E'
const TX_CUERPO = '#334155'
const TX_SUAVE  = '#64748B'
const BORDE     = '#E2E8F0'

/* Los fondos tintados de las tres cajas, declarados aparte PORQUE el tono del
   texto se calcula contra ellos. `tonoSobreClaro` asume blanco, y usarlo aquí
   fue justo el error de la primera medición: la etiqueta ámbar daba 4.34:1
   sobre el `#FFFBEB` de su caja y la roja 4.41:1 sobre el `#FEF2F2` de la
   suya. Pasaban sobre blanco y fallaban donde de verdad se pintan. Para eso
   existe `tonoSobreFondo`, con el objetivo de texto —4.5— y no el de 3 que
   trae por defecto para objetos gráficos. */
const BG_PEDIR   = '#FFFBEB'
const BG_CUIDADO = '#FEF2F2'
const BG_PREGUNTAS = '#F0FDF4'

const CLASES: Array<{ k: ClaseHallazgo; etiqueta: string; tono: string; Icono: typeof AlertTriangle }> = [
  { k: 'riesgo',   etiqueta: 'Riesgo',              tono: '#DC2626', Icono: AlertTriangle },
  { k: 'entrega',  etiqueta: 'Para enseñarle',      tono: '#2563EB', Icono: Gift },
  { k: 'analisis', etiqueta: 'Nos falta a nosotros', tono: '#D97706', Icono: Search },
]

function Bloque({ icono: Icono, titulo, tono, children }: {
  icono: typeof Phone; titulo: string; tono: string; children: React.ReactNode
}) {
  const c = tonoSobreClaro(tono, 0)
  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icono size={12} style={{ color: c, flexShrink: 0 }} />
        <span style={{ color: c, fontSize: 10, fontWeight: 800, letterSpacing: 0.4 }}>
          {titulo.toUpperCase()}
        </span>
      </div>
      {children}
    </div>
  )
}

function Lista({ items, tono }: { items: string[]; tono: string }) {
  const c = tonoSobreClaro(tono, 0)
  return (
    <ul className="space-y-1.5 pl-0" style={{ listStyle: 'none' }}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-[11.5px] leading-snug" style={{ color: TX_CUERPO }}>
          <span style={{ color: c, flexShrink: 0, fontWeight: 800 }}>·</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

/* ── EL MOVIMIENTO ────────────────────────────────────────────────────────
 *
 * Dirección, 12 oct 2026: que la ficha diga, cada vez que alguien captura
 * algo, si la alerta CONTINÚA, GENERA RIESGO o DISMINUYE.
 *
 * Los tonos son los de ESTA pantalla —la ficha es clara y ya usa este juego—
 * y no los de la paleta cerrada del Dashboard. Mezclar los dos juegos de
 * tokens es exactamente como vuelve el bug de contraste.
 */
const MOV: Record<Sentido, { etiqueta: string; tono: string }> = {
  nace:      { etiqueta: 'Nueva',      tono: '#D97706' },
  agrava:    { etiqueta: 'Agravó',     tono: '#DC2626' },
  disminuye: { etiqueta: 'Va a menos', tono: '#059669' },
  continua:  { etiqueta: 'Sigue igual', tono: '#475569' },
}

function BloqueMovimiento({ movs }: { movs: Movimiento[] }) {
  return (
    <div className="mt-3.5 pt-3" style={{ borderTop: `1px solid ${BORDE}` }}>
      <div className="flex items-center gap-1.5 mb-2">
        <History size={12} style={{ color: tonoSobreClaro('#475569', 0), flexShrink: 0 }} />
        <span style={{ color: tonoSobreClaro('#475569', 0), fontSize: 10,
                       fontWeight: 800, letterSpacing: 0.4 }}>
          QUÉ CAMBIÓ CON LO QUE CAPTURAMOS
        </span>
      </div>

      <ul className="space-y-2 pl-0" style={{ listStyle: 'none' }}>
        {movs.map(m => {
          const cfg = MOV[m.sentido]
          const c = tonoSobreClaro(cfg.tono, 0)
          return (
            <li key={m.condicion} style={{ borderLeft: `2px solid ${c}`, paddingLeft: 8 }}>
              <p className="text-[11.5px] leading-snug" style={{ color: TX_CUERPO }}>
                <span style={{ color: c, fontWeight: 800 }}>{cfg.etiqueta}. </span>
                {m.frase}
              </p>
              {/* La evidencia con la que saltó, en pequeño: sin ella la frase
                  de arriba dice que algo lleva 74 días abierto sin decir qué. */}
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: TX_SUAVE }}>
                {m.titulo}
              </p>

              {m.cuentan.length > 0 && (
                <p className="text-[11px] leading-snug mt-1" style={{ color: TX_SUAVE }}>
                  Cuenta para esta alerta:{' '}
                  {m.cuentan.slice(0, 3).map(c2 => `${c2.fecha} ${c2.que}`).join(' · ')}
                  {m.cuentan.length > 3 && ` · y ${m.cuentan.length - 3} más`}
                </p>
              )}

              {/* Lo que NO la toca va CON el porqué. Sin esa frase, un «no
                  cuenta» se lee como que el sistema no registró el trabajo —
                  y eso es lo que hace que la gente deje de capturar. */}
              {m.noCuentan.length > 0 && (
                <p className="text-[11px] leading-snug mt-0.5" style={{ color: TX_SUAVE }}>
                  No la mueve:{' '}
                  {m.noCuentan.slice(0, 2).map(c2 => `${c2.fecha} ${c2.que}`).join(' · ')}
                  {m.noCuentan.length > 2 && ` · y ${m.noCuentan.length - 2} más`}
                  {'. '}
                  <span style={{ fontWeight: 700 }}>Esta se apaga con {m.laApaga}.</span>
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function CuentaVeredicto({
  veredicto, guion, movimiento, fuentes, verTodas = '/alertas',
}: {
  veredicto: Veredicto
  /** `null` cuando la situación no tiene guion escrito. No se inventa uno. */
  guion: Guion | null
  /**
   * Qué le pasó a cada alerta desde que se abrió, y qué de lo capturado la
   * toca. `null` = la memoria de episodios no está disponible, que NO es lo
   * mismo que «no hubo cambios»: en ese caso el bloque no se dibuja.
   */
  movimiento?: Movimiento[] | null
  /** De cuántas de las ocho fuentes hay dato. Es la confianza, en números. */
  fuentes: number
  verTodas?: string
}) {
  const cfg = SITUACION[veredicto.situacion]
  const luz = LUZ[veredicto.luz]
  /* El color de la luz, oscurecido hasta que se LEE sobre blanco. El punto
     redondo de al lado conserva el tono vivo: un objeto gráfico puede ser
     brillante, el texto no. */
  const tonoLuz = tonoSobreClaro(luz.color, 0)
  const porClase = (k: ClaseHallazgo) => veredicto.hallazgos.filter(h => h.clase === k)

  return (
    /* `cp-light` no hace falta hoy —esta ficha no tiene ninguna `.cp-card`—
       pero va puesta a propósito: si mañana alguien mete este panel dentro de
       una tarjeta oscura, la cascada lo pintaría todo de blanco sobre este
       fondo blanco y volveríamos a la captura de hoy. */
    <div className="cp-light rounded-xl p-4"
      style={{ background: '#FFFFFF', border: `1px solid ${BORDE}`,
               borderLeft: `4px solid ${luz.color}`, color: TX_CUERPO }}>

      {/* ── El veredicto ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: 999, background: luz.color,
                         display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: tonoLuz, fontSize: 13.5, fontWeight: 800 }}>{cfg.titulo}</span>
        </div>
        <Link href={verTodas} className="flex items-center gap-1 text-[10.5px] hover:opacity-70"
          style={{ color: TX_SUAVE }}>
          <span>Ver todas mis alertas</span>
          <ArrowUpRight size={11} />
        </Link>
      </div>

      <p className="mt-2 text-[13.5px] font-bold leading-snug" style={{ color: MARINO }}>
        {veredicto.accion}
      </p>
      <p className="mt-1 text-[11.5px] leading-snug" style={{ color: TX_CUERPO }}>
        {veredicto.porque}
      </p>

      {veredicto.pedir && (
        <div className="mt-2.5 rounded-lg px-3 py-2"
             style={{ background: BG_PEDIR, border: '1px solid #FDE68A' }}>
          <span style={{ color: tonoSobreFondo('#D97706', BG_PEDIR, 4.5), fontSize: 10,
                         fontWeight: 800, letterSpacing: 0.4 }}>
            HAY QUE CONSEGUIR
          </span>
          <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: '#78350F' }}>
            {veredicto.pedir}
          </p>
        </div>
      )}

      {/* ── Qué cambió ─────────────────────────────────────────────────────
          Va ANTES del guion a propósito: el guion dice qué hacer hoy, y esto
          dice si lo que ya se hizo movió algo. Leerlos al revés hace que el
          ejecutivo prepare otra llamada sin saber que la anterior ya contó. */}
      {movimiento && movimiento.length > 0 && <BloqueMovimiento movs={movimiento} />}

      {/* ── El guion ───────────────────────────────────────────────────── */}
      {guion && (
        <div className="mt-3.5 pt-3" style={{ borderTop: `1px solid ${BORDE}` }}>
          <span style={{ color: tonoLuz, fontSize: 11.5, fontWeight: 800 }}>{guion.titulo}</span>
          <p className="mt-1 text-[11.5px] leading-snug" style={{ color: TX_CUERPO }}>
            <span style={{ color: TX_SUAVE, fontWeight: 700 }}>Objetivo: </span>
            {guion.objetivo}
          </p>

          {guion.antes.length > 0 && (
            <Bloque icono={ClipboardList} titulo="Antes de marcar" tono="#2563EB">
              <Lista items={guion.antes} tono="#2563EB" />
            </Bloque>
          )}

          {guion.preguntas.length > 0 && (
            <Bloque icono={Phone} titulo="Qué preguntar" tono="#059669">
              {/* Van en su propia caja: son lo único de todo el panel que se
                  lee en voz alta, y hay que poder encontrarlas de un vistazo
                  con el cliente ya en la línea. */}
              <ul className="space-y-1.5 pl-0 rounded-lg px-3 py-2" style={{
                listStyle: 'none', background: BG_PREGUNTAS, border: '1px solid #BBF7D0' }}>
                {guion.preguntas.map((q, i) => (
                  <li key={i} className="text-[11.5px] leading-snug" style={{ color: '#14532D' }}>{q}</li>
                ))}
              </ul>
            </Bloque>
          )}

          {guion.registrar.length > 0 && (
            <Bloque icono={Ear} titulo="Qué dejar registrado" tono="#7C3AED">
              <Lista items={guion.registrar} tono="#7C3AED" />
            </Bloque>
          )}

          {guion.cuidado && (
            <p className="mt-2.5 text-[11px] leading-snug rounded-lg px-2.5 py-1.5"
               style={{ background: BG_CUIDADO, border: '1px solid #FECACA', color: '#7F1D1D' }}>
              <span style={{ color: tonoSobreFondo('#DC2626', BG_CUIDADO, 4.5), fontWeight: 800 }}>Cuidado: </span>
              {guion.cuidado}
            </p>
          )}
        </div>
      )}

      {/* ── Los hallazgos, en las tres clases ──────────────────────────── */}
      <div className="mt-3.5 pt-3 grid grid-cols-1 md:grid-cols-3 gap-3"
           style={{ borderTop: `1px solid ${BORDE}` }}>
        {CLASES.map(({ k, etiqueta, tono, Icono }) => {
          const hs = porClase(k)
          const pill = pastillaClara(tono)
          return (
            <div key={k}>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 mb-1.5"
                style={{ background: pill.background, border: `1px solid ${pill.borderColor}` }}>
                <Icono size={11} style={{ color: pill.color, flexShrink: 0 }} />
                <span style={{ color: pill.color, fontSize: 10, fontWeight: 800, letterSpacing: 0.3 }}>
                  {etiqueta.toUpperCase()} ({hs.length})
                </span>
              </span>
              {hs.length === 0 ? (
                /* `TX_SUAVE` y no un gris más claro: `#94A3B8` medía 2.56:1
                   sobre blanco. Un «Nada» que no se lee es un hueco, y un
                   hueco se confunde con que la sección no cargó. */
                <p className="text-[11px]" style={{ color: TX_SUAVE }}>Nada</p>
              ) : (
                <ul className="space-y-1.5 pl-0" style={{ listStyle: 'none' }}>
                  {hs.map((h, i) => (
                    <li key={i}>
                      <p className="text-[11.5px] font-semibold leading-tight" style={{ color: MARINO }}>
                        {h.titulo}
                      </p>
                      {/* La prueba SIEMPRE visible. Un hallazgo sin su cifra no
                          mueve a nadie, y es la regla de la casa. */}
                      <p className="text-[10.5px] leading-snug" style={{ color: TX_SUAVE }}>{h.prueba}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* La confianza, dicha en números y no en adjetivos. */}
      <p className="mt-3 text-[10.5px]" style={{ color: TX_SUAVE }}>
        Este juicio se apoya en {fuentes} de las 8 fuentes (facturación, consumo,
        llamadas, tickets, relación, contacto, riesgos y ficha).
        {fuentes < 3 && ' Con menos de tres no se emite juicio: se pide lo que falta.'}
      </p>
    </div>
  )
}
