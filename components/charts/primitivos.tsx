'use client'
/**
 * Piezas compartidas de las gráficas del Dashboard.
 *
 * ── POR QUÉ LAS FILAS NO SON RECHARTS ─────────────────────────────────────
 * `FilaApilada` se dibuja con divs. No es capricho: la apilada tiene que
 * garantizar tres cosas que recharts no da en una barra apilada horizontal —
 * un ancho MÍNIMO PINTADO por segmento (hoy hay situaciones con 1 cuenta de
 * 193, que a escala real es medio píxel), un área de CLIC de 24px
 * independiente de ese ancho (WCAG 2.5.8), y la etiqueta DENTRO del segmento
 * cuando cabe. Recharts sigue usándose donde sí encaja: columnas con brush.
 */
import { useId, useState } from 'react'
import {
  NAVY, BORDE, TX, SILVER, ORANGE, FUENTE, MOTION, MINIMOS, TABULAR,
} from '@/lib/chart-theme'

/* ── Tramas ───────────────────────────────────────────────────────────────
   No depender sólo del color. La trama sobrevive a una impresión en gris, a
   un daltonismo y a mirar la pantalla desde dos metros. */
export function TramaRayas({ id, color }: { id: string; color: string }) {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)">
          <rect width="6" height="6" fill={color} />
          <line x1="0" y1="0" x2="0" y2="6" stroke={NAVY[900]} strokeWidth="2"
            opacity="0.42" />
        </pattern>
      </defs>
    </svg>
  )
}

/** La misma trama, como fondo CSS — para los divs de las filas. */
export function fondoConTrama(color: string, trama: boolean): string {
  if (!trama) return color
  return `repeating-linear-gradient(45deg, ${color} 0 3px, rgba(11,31,58,0.42) 3px 5px)`
}

/* ── Tooltip ──────────────────────────────────────────────────────────── */
export interface LineaTooltip {
  etiqueta: string
  valor: string
  color?: string
  /** Comparativo contra el periodo anterior, cuando lo hay. */
  delta?: string
}

export function ChartTooltip({ titulo, lineas, pie }: {
  titulo: string; lineas: LineaTooltip[]; pie?: string
}) {
  return (
    <div style={{
      background: NAVY[900], border: `1px solid ${BORDE}`, borderRadius: 12,
      padding: '10px 14px', fontSize: FUENTE.cuerpo, minWidth: 190,
      boxShadow: '0 12px 32px rgba(0,0,0,0.45)', pointerEvents: 'none',
    }}>
      <p style={{ color: TX.hi, fontWeight: 800, marginBottom: 8 }}>{titulo}</p>
      {lineas.map(l => (
        <div key={l.etiqueta} style={{
          display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4,
        }}>
          <span style={{ background: 'transparent', color: TX.low, display: 'flex',
            alignItems: 'center', gap: 6 }}>
            {l.color && (
              <i style={{
                width: 9, height: 9, borderRadius: 2, background: l.color,
                display: 'inline-block', flexShrink: 0,
              }} />
            )}
            {l.etiqueta}
          </span>
          <span style={{ background: 'transparent', color: TX.hi, fontWeight: 700, ...TABULAR }}>
            {l.valor}
            {l.delta && (
              <em style={{ color: TX.low, fontStyle: 'normal', fontWeight: 500, marginLeft: 6 }}>
                {l.delta}
              </em>
            )}
          </span>
        </div>
      ))}
      {pie && (
        <p style={{ color: TX.low, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>{pie}</p>
      )}
    </div>
  )
}

/* ── Leyenda interactiva ──────────────────────────────────────────────── */
export interface ItemLeyenda {
  k: string
  label: string
  color: string
  trama?: boolean
}

export function ChartLegend({ items, apagados, onAlternar, nota }: {
  items: ItemLeyenda[]
  apagados: Set<string>
  onAlternar: (k: string) => void
  nota?: string
}) {
  return (
    <div>
      <ul style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px 14px', listStyle: 'none',
        margin: 0, padding: 0,
      }}>
        {items.map(it => {
          const off = apagados.has(it.k)
          return (
            <li key={it.k}>
              <button
                type="button"
                className="dash-foco"
                onClick={() => onAlternar(it.k)}
                aria-pressed={!off}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '4px 2px', minHeight: MINIMOS.areaClic,
                  fontSize: FUENTE.etiqueta, color: off ? SILVER[500] : TX.mid,
                  textDecoration: off ? 'line-through' : 'none',
                  transition: `color ${MOTION.rapido}ms`,
                }}
              >
                <i aria-hidden style={{
                  width: 11, height: 11, borderRadius: 3, flexShrink: 0,
                  background: off ? 'transparent' : fondoConTrama(it.color, !!it.trama),
                  border: off ? `1px solid ${SILVER[500]}` : 'none',
                }} />
                {it.label}
              </button>
            </li>
          )
        })}
      </ul>
      {nota && (
        <p style={{ fontSize: 12, color: TX.low, marginTop: 8, lineHeight: 1.5 }}>{nota}</p>
      )}
    </div>
  )
}

/* ── Chips de filtro activo ───────────────────────────────────────────── */
export function ChipsFiltro({ filtros, onQuitar, onLimpiar }: {
  filtros: { dim: string; valor: string; etiqueta: string }[]
  onQuitar: (dim: string, valor: string) => void
  onLimpiar: () => void
}) {
  if (filtros.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {filtros.map(f => (
        <span key={`${f.dim}-${f.valor}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 6px 4px 10px', borderRadius: 999,
          background: 'rgba(255,122,26,0.16)', border: `1px solid ${ORANGE[500]}`,
          fontSize: FUENTE.etiqueta, color: ORANGE[400], fontWeight: 650,
        }}>
          {f.etiqueta}
          <button
            type="button"
            className="dash-foco"
            onClick={() => onQuitar(f.dim, f.valor)}
            aria-label={`Quitar el filtro ${f.etiqueta}`}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18, borderRadius: 999, border: 'none',
              background: 'rgba(255,122,26,0.22)', color: ORANGE[400],
              cursor: 'pointer', fontSize: 12, lineHeight: 1,
            }}
          >×</button>
        </span>
      ))}
      <button
        type="button"
        className="dash-foco"
        onClick={onLimpiar}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: FUENTE.etiqueta, color: TX.low, textDecoration: 'underline',
          padding: '4px 2px',
        }}
      >Limpiar todo</button>
    </div>
  )
}

/* ── La fila apilada: el corazón de la gráfica A ──────────────────────── */
export interface SegmentoFila {
  k: string
  etiqueta: string
  valor: number
  color: string
  trama?: boolean
}

export function FilaApilada({
  titulo, acento, segmentos, total, formato, indice,
  resaltado, onResaltar, onClicSegmento, activo,
}: {
  titulo: string
  /** La tira de color a la izquierda: codifica la posición en el orden. */
  acento: string
  segmentos: SegmentoFila[]
  /** Denominador para el ancho. Es el MAYOR total de todas las filas, no el
   *  de ésta: así las filas se comparan entre sí, que es el punto. */
  total: number
  formato: (n: number) => string
  indice: number
  resaltado: string | null
  onResaltar: (k: string | null) => void
  onClicSegmento: (k: string) => void
  activo: boolean
}) {
  const suma = segmentos.reduce((s, x) => s + x.valor, 0)
  const idT = useId()

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        minHeight: MINIMOS.altoFila,
        opacity: activo ? 1 : 0.45,
        transition: `opacity ${MOTION.rapido}ms`,
      }}
    >
      {/* Tira de acento: posición en el orden de riesgo */}
      <i aria-hidden style={{
        width: MINIMOS.tiraAcento, alignSelf: 'stretch', borderRadius: 2,
        background: acento, flexShrink: 0,
      }} />

      <span style={{
        width: 148, flexShrink: 0, fontSize: FUENTE.etiqueta, color: TX.mid,
        background: 'transparent', lineHeight: 1.3,
      }}>{titulo}</span>

      <div
        className="dash-anima"
        style={{
          flex: 1, display: 'flex', alignItems: 'center',
          height: MINIMOS.altoBarra, minWidth: 0,
          background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden',
        }}
        role="img"
        aria-labelledby={idT}
      >
        <span id={idT} className="sr-only">
          {titulo}: {segmentos.map(s => `${s.etiqueta} ${formato(s.valor)}`).join(', ')}.
          Total {formato(suma)}.
        </span>

        {segmentos.filter(s => s.valor > 0).map(s => {
          const pct = total > 0 ? (s.valor / total) * 100 : 0
          const atenuado = resaltado !== null && resaltado !== s.k
          return (
            <button
              key={s.k}
              type="button"
              className="dash-foco"
              onMouseEnter={() => onResaltar(s.k)}
              onMouseLeave={() => onResaltar(null)}
              onFocus={() => onResaltar(s.k)}
              onBlur={() => onResaltar(null)}
              onClick={() => onClicSegmento(s.k)}
              aria-label={`${s.etiqueta} en ${titulo}: ${formato(s.valor)}. Clic para ver sus cuentas.`}
              style={{
                /* El ancho PINTADO nunca baja de `anchoSegmento`: con 1 cuenta
                   de 193 el porcentaje real es medio píxel y el segmento
                   desaparecería. El tooltip dice el valor verdadero. */
                width: `max(${MINIMOS.anchoSegmento}px, ${pct}%)`,
                height: '100%', flexShrink: 0,
                background: fondoConTrama(s.color, !!s.trama),
                border: 'none', padding: 0, cursor: 'pointer',
                opacity: atenuado ? 0.3 : 1,
                /* El área de clic NO es el ancho pintado: WCAG 2.5.8 pide
                   24×24, así que la fila entera mide eso de alto y el botón la
                   ocupa completa. */
                minHeight: MINIMOS.areaClic,
                marginTop: -(MINIMOS.areaClic - MINIMOS.altoBarra) / 2,
                marginBottom: -(MINIMOS.areaClic - MINIMOS.altoBarra) / 2,
                transition: `opacity ${MOTION.rapido}ms`,
                animation: `dash-entra-x ${MOTION.entrada}ms ${MOTION.ease} both`,
                animationDelay: `${indice * MOTION.stagger}ms`,
                transformOrigin: 'left center',
              }}
            />
          )
        })}
      </div>

      {/* Etiqueta directa al final de la barra, como pide el encargo. */}
      <span style={{
        width: 92, flexShrink: 0, textAlign: 'right',
        fontSize: FUENTE.valor, fontWeight: 750, color: TX.hi,
        background: 'transparent', ...TABULAR,
      }}>{formato(suma)}</span>
    </div>
  )
}

/* ── Control segmentado ─────────────────────────────────────────────────
   Botones a la vista en vez de un combo: con dos a cinco opciones, un
   desplegable esconde lo que se puede elegir y obliga a un clic de más para
   descubrirlo. */
export function Segmentado({ etiqueta, opciones, valor, onCambio }: {
  etiqueta: string
  opciones: [string, string][]
  valor: string
  onCambio: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ background: 'transparent', color: TX.low, fontSize: 12 }}>{etiqueta}</span>
      <div role="group" aria-label={etiqueta} style={{
        display: 'flex', gap: 2, padding: 2, borderRadius: 9,
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDE}`,
      }}>
        {opciones.map(([v, l]) => {
          const on = v === valor
          return (
            <button key={v} type="button" className="dash-foco" aria-pressed={on}
              onClick={() => onCambio(v)}
              style={{
                padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                minHeight: MINIMOS.areaClic, fontSize: FUENTE.etiqueta, fontWeight: 700,
                background: on ? ORANGE[500] : 'transparent',
                color: on ? NAVY[900] : TX.mid,
                transition: `background ${MOTION.rapido}ms, color ${MOTION.rapido}ms`,
              }}>{l}</button>
          )
        })}
      </div>
    </div>
  )
}
