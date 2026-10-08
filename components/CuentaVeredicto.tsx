import Link from 'next/link'
import { AlertTriangle, Gift, Search, ArrowUpRight, Phone, ClipboardList, Ear } from 'lucide-react'
import { SITUACION, LUZ, type Veredicto, type ClaseHallazgo } from '@/lib/alertas-veredicto'
import type { Guion } from '@/lib/alertas-guion'

/**
 * components/CuentaVeredicto.tsx — EL VEREDICTO DE LA CUENTA, EN SU PROPIA FICHA
 *
 * ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * Pregunta de dirección, 8 oct 2026: «¿y dónde están las ALERTAS para los
 * asesores en sus módulos?». La respuesta honesta era: en ningún sitio. El
 * módulo ALERTAS existía y estaba en el menú, pero al retirar el generador SAC
 * quité el botón de Actividades de la tarjeta del asesor y el panel de la
 * ficha, y no puse nada en su lugar. Las alertas ENLAZABAN a la ficha —las
 * anclas `#contactos`, `#radar`, `#ficha` siguen ahí— y la ficha no contestaba
 * nada: el asesor abría una cuenta y no sabía qué le pasaba.
 *
 * Esto lo cierra. Parado en la cuenta, el asesor ve su veredicto, la única
 * acción que le toca, el guion con el que hacerla, y los hallazgos que la
 * sostienen repartidos en las tres clases que nombró dirección.
 *
 * ── Y EL GUION ─────────────────────────────────────────────────────────────
 *
 * «Al igual que en actividades, dales sugerencias de un auténtico profesional
 * de SAC». El veredicto dice QUÉ hacer en una línea; el guion dice CÓMO: qué
 * revisar antes de marcar, qué preguntar con esas palabras, qué tiene que
 * quedar capturado y cuál es el error que arruina esa conversación. Cada línea
 * va anclada a una cifra medida de ESTA cuenta — ver `lib/alertas-guion.ts`,
 * donde una línea cuyo dato no existe no se rellena: se cae.
 */

const CLASES: Array<{ k: ClaseHallazgo; etiqueta: string; color: string; Icono: typeof AlertTriangle }> = [
  { k: 'riesgo',   etiqueta: 'Riesgo',           color: '#F87171', Icono: AlertTriangle },
  { k: 'entrega',  etiqueta: 'Para enseñarle',   color: '#60A5FA', Icono: Gift },
  { k: 'analisis', etiqueta: 'Nos falta a nosotros', color: '#FBBF24', Icono: Search },
]

/** Color inline SIEMPRE con `background`: `globals.css` pinta de blanco todo
 *  `span` que no lo declare, y esta ficha es una isla oscura. Ver
 *  [[atlas-dashboard-contrast-architecture]]. */
const C = (color: string, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ color, background: 'transparent', ...extra })

function Bloque({ icono: Icono, titulo, color, children }: {
  icono: typeof Phone; titulo: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icono size={12} style={{ color, flexShrink: 0 }} />
        <span style={C(color, { fontSize: 10, fontWeight: 800, letterSpacing: 0.4 })}>
          {titulo.toUpperCase()}
        </span>
      </div>
      {children}
    </div>
  )
}

function Lista({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-1 pl-0" style={{ listStyle: 'none' }}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-[11.5px] leading-snug">
          <span style={C(color, { flexShrink: 0 })}>·</span>
          <span style={C('rgba(255,255,255,0.78)')}>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export default function CuentaVeredicto({
  veredicto, guion, fuentes, verTodas = '/alertas',
}: {
  veredicto: Veredicto
  /** `null` cuando la situación no tiene guion escrito. No se inventa uno. */
  guion: Guion | null
  /** De cuántas de las ocho fuentes hay dato. Es la confianza, en números. */
  fuentes: number
  verTodas?: string
}) {
  const cfg = SITUACION[veredicto.situacion]
  const luz = LUZ[veredicto.luz]
  const porClase = (k: ClaseHallazgo) => veredicto.hallazgos.filter(h => h.clase === k)

  return (
    <div className="rounded-xl border p-4"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: `${luz.color}55` }}>

      {/* ── El veredicto ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: 999, background: luz.color,
                         display: 'inline-block', flexShrink: 0 }} />
          <span style={C(luz.color, { fontSize: 13.5, fontWeight: 800 })}>{cfg.titulo}</span>
        </div>
        <Link href={verTodas} className="flex items-center gap-1 text-[10.5px] hover:opacity-80">
          <span style={C('rgba(255,255,255,0.55)')}>Ver todas mis alertas</span>
          <ArrowUpRight size={11} style={{ color: 'rgba(255,255,255,0.55)' }} />
        </Link>
      </div>

      <p className="mt-2 text-[13px] font-semibold leading-snug"
         style={C('#FFFFFF')}>{veredicto.accion}</p>
      <p className="mt-1 text-[11.5px] leading-snug"
         style={C('rgba(255,255,255,0.68)')}>{veredicto.porque}</p>

      {veredicto.pedir && (
        <div className="mt-2.5 rounded-lg px-3 py-2"
             style={{ background: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.30)' }}>
          <span style={C('#EAB308', { fontSize: 10, fontWeight: 800, letterSpacing: 0.4 })}>
            HAY QUE CONSEGUIR
          </span>
          <p className="mt-0.5 text-[11.5px] leading-snug"
             style={C('rgba(255,255,255,0.80)')}>{veredicto.pedir}</p>
        </div>
      )}

      {/* ── El guion ───────────────────────────────────────────────────── */}
      {guion && (
        <div className="mt-3.5 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <span style={C(luz.color, { fontSize: 11.5, fontWeight: 800 })}>{guion.titulo}</span>
          <p className="mt-1 text-[11.5px] leading-snug" style={C('rgba(255,255,255,0.72)')}>
            <span style={C('rgba(255,255,255,0.45)', { fontWeight: 700 })}>Objetivo: </span>
            {guion.objetivo}
          </p>

          {guion.antes.length > 0 && (
            <Bloque icono={ClipboardList} titulo="Antes de marcar" color="#93C5FD">
              <Lista items={guion.antes} color="#93C5FD" />
            </Bloque>
          )}

          {guion.preguntas.length > 0 && (
            <Bloque icono={Phone} titulo="Qué preguntar" color="#6EE7B7">
              <ul className="space-y-1 pl-0" style={{ listStyle: 'none' }}>
                {guion.preguntas.map((q, i) => (
                  <li key={i} className="text-[11.5px] leading-snug italic"
                      style={C('rgba(255,255,255,0.82)')}>{q}</li>
                ))}
              </ul>
            </Bloque>
          )}

          {guion.registrar.length > 0 && (
            <Bloque icono={Ear} titulo="Qué dejar registrado" color="#C4B5FD">
              <Lista items={guion.registrar} color="#C4B5FD" />
            </Bloque>
          )}

          {guion.cuidado && (
            <p className="mt-2.5 text-[11px] leading-snug rounded-lg px-2.5 py-1.5"
               style={{ ...C('rgba(255,255,255,0.78)'), background: 'rgba(248,113,113,0.10)' }}>
              <span style={C('#F87171', { fontWeight: 800 })}>Cuidado: </span>
              {guion.cuidado}
            </p>
          )}
        </div>
      )}

      {/* ── Los hallazgos, en las tres clases ──────────────────────────── */}
      <div className="mt-3.5 pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-3"
           style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {CLASES.map(({ k, etiqueta, color, Icono }) => {
          const hs = porClase(k)
          return (
            <div key={k}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icono size={11} style={{ color, flexShrink: 0 }} />
                <span style={C(color, { fontSize: 10, fontWeight: 800, letterSpacing: 0.3 })}>
                  {etiqueta.toUpperCase()} ({hs.length})
                </span>
              </div>
              {hs.length === 0 ? (
                <p className="text-[11px]" style={C('rgba(255,255,255,0.35)')}>Nada</p>
              ) : (
                <ul className="space-y-1.5 pl-0" style={{ listStyle: 'none' }}>
                  {hs.map((h, i) => (
                    <li key={i}>
                      <p className="text-[11.5px] font-semibold leading-tight"
                         style={C('rgba(255,255,255,0.88)')}>{h.titulo}</p>
                      {/* La prueba SIEMPRE visible. Un hallazgo sin su cifra no
                          mueve a nadie, y es la regla de la casa. */}
                      <p className="text-[10.5px] leading-snug"
                         style={C('rgba(255,255,255,0.52)')}>{h.prueba}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* La confianza, dicha en números y no en adjetivos. */}
      <p className="mt-3 text-[10.5px]" style={C('rgba(255,255,255,0.40)')}>
        Este juicio se apoya en {fuentes} de las 8 fuentes (facturación, consumo,
        llamadas, tickets, relación, contacto, riesgos y ficha).
        {fuentes < 3 && ' Con menos de tres no se emite juicio: se pide lo que falta.'}
      </p>
    </div>
  )
}
