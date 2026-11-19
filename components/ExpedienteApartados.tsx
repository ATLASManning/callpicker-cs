'use client'
import { useEffect, useState } from 'react'
import { pastillaSobrePagina } from '@/lib/contraste'
import { leeJson, mensajeDeError } from '@/lib/respuesta-json'

/**
 * LA ETIQUETA Y LOS 20 APARTADOS, DONDE SE MIRA LA CUENTA
 * ========================================================
 *
 * Instrucción de dirección (18 nov 2026): los 20 puntos **tienen que estar en
 * la ficha del cliente**, con una etiqueta que diga si es **Cliente** o es una
 * **Cuenta**. Así que esto vive aquí y no en una sección aparte: se filtra por
 * cliente —un clic— y la ficha ya trae la etiqueta y el expediente.
 *
 * Es UN solo bloque, usado por la ficha de Activaciones 2.0 y por el buscador
 * de la puerta. Si cada una pintara los apartados a su manera, un día dirían
 * cosas distintas del mismo expediente y las dos parecerían ciertas.
 *
 * ── POR QUÉ EL CONTADOR NO DICE «x/20» ───────────────────────────────────────
 *
 * Porque 3 de los 20 no existen en ninguna fuente y 1 no es medible con el
 * corte de tickets que hay. Un «6/20» leería como un 30% de cumplimiento y
 * castigaría a quien entrega por cuatro cosas que el sistema no le puede dar.
 */

export type Estado = 'completo' | 'falta' | 'otra_fuente' | 'sin_fuente' | 'no_medible'
export type Distintivo = 'cliente' | 'cuenta'
export type MotivoCuenta = 'incompleta' | 'fuera' | 'no_medido'

export interface Faltante { campo: string; etiqueta: string; critico: boolean; dueno: string }

export interface Clasificacion {
  distintivo: Distintivo
  motivo: MotivoCuenta | null
  faltan: Faltante[]
  faltanOpcionales: Faltante[]
  porque: string
}

export interface ApartadoVivo {
  clave: string; titulo: string; estado: Estado
  valor: string; nota?: string; detalle?: string; fuente: string
}

export interface Expediente {
  id: string; cid: string; cliente: string
  apartados: ApartadoVivo[]
  clasificacion: Clasificacion
  resumen: {
    completos: number; faltan: number; otraFuente: number
    sinFuente: number; noMedibles: number; total: number
  }
  fuentes: {
    /** `false` = esta cuenta NO tiene fila en Activaciones 2.0. Son 138 de las
     *  224 de cartera, medido el 18 nov 2026 con `npm run mide:universo`. */
    enLaHoja?: boolean
    cuentaEnCartera: boolean; cuentaError: string | null
    enGrc: boolean; conContrato: boolean; didsEncontrados: number
  }
}

const TX     = '#202E3B'
const TX_MID = '#3D4B5C'
const TX_SUA = '#6A7889'
const BORDE  = '#DFE8EF'

/* Los tonos se CALCULAN contra el fondo real de la página. */
export const COLOR: Record<Estado, string> = {
  completo: '#15803D', falta: '#B45309', otra_fuente: '#1D6CAA',
  sin_fuente: '#6D28D9', no_medible: '#52606D',
}
export const ETIQUETA: Record<Estado, string> = {
  completo: 'completo', falta: 'falta', otra_fuente: 'otra fuente',
  sin_fuente: 'sin fuente', no_medible: 'no medible',
}
/* Un guion no dice POR QUÉ está vacío. La ausencia se marca con palabras. */
export const VACIO: Record<Estado, string> = {
  completo: '—',
  falta: 'no está capturado',
  otra_fuente: 'lo cierra otra fuente del sistema',
  sin_fuente: 'no existe en ninguna fuente — se captura o se declara no disponible',
  no_medible: 'la fuente existe pero no mide esto',
}

/** Un solo lugar para los cuatro tonos del distintivo. Las pastillas de la
 *  ficha y las barras del buscador salen de aquí: un espejo tecleado a mano
 *  deja de ser espejo en cuanto alguien cambia un hex en un solo archivo. */
export const COLOR_DISTINTIVO = {
  cliente:    '#15803D',
  incompleta: '#B45309',
  fuera:      '#52606D',
  no_medido:  '#6D28D9',
} as const

export function colorDistintivo(c: Clasificacion): string {
  if (c.distintivo === 'cliente') return COLOR_DISTINTIVO.cliente
  if (c.motivo === 'fuera') return COLOR_DISTINTIVO.fuera
  if (c.motivo === 'no_medido') return COLOR_DISTINTIVO.no_medido
  return COLOR_DISTINTIVO.incompleta
}
export function textoDistintivo(c: Clasificacion): string {
  if (c.distintivo === 'cliente') return 'CLIENTE'
  if (c.motivo === 'no_medido') return 'SIN MEDIR'
  return 'CUENTA'
}

export function PastillaDistintivo({ c, grande = false }: { c: Clasificacion; grande?: boolean }) {
  const p = pastillaSobrePagina(colorDistintivo(c), 0.18)
  return (
    <span
      title={c.porque}
      style={{
        fontSize: grande ? 12 : 11, fontWeight: 800, letterSpacing: '0.04em',
        padding: grande ? '3px 11px' : '2px 8px', borderRadius: 999,
        background: p.background, color: p.color,
        border: `1px solid ${p.borderColor}`, whiteSpace: 'nowrap',
      }}
    >
      {textoDistintivo(c)}
    </span>
  )
}

export function Pastilla({ color, texto }: { color: string; texto: string }) {
  const p = pastillaSobrePagina(color, 0.16)
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
      background: p.background, color: p.color,
      border: `1px solid ${p.borderColor}`, whiteSpace: 'nowrap',
    }}>
      {texto}
    </span>
  )
}

/**
 * Carga y pinta el expediente de una activación.
 *
 * `plegado` arranca cerrado y deja ver sólo la etiqueta y el contador: en la
 * ficha de un cliente con varios registros, veinte apartados por registro
 * serían una pared. La etiqueta —que es lo que se vino a ver— queda siempre a
 * la vista.
 */
export default function ExpedienteApartados({
  id, plegado = true,
}: { id: string; plegado?: boolean }) {
  const [exp, setExp] = useState<Expediente | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [abierto, setAbierto] = useState(!plegado)

  useEffect(() => {
    let vivo = true
    setExp(null); setError(null)
    ;(async () => {
      try {
        const r = await fetch(`/api/entregas/expediente?id=${encodeURIComponent(id)}`)
        /* No se llama a `r.json()` a secas: con la sesión caducada el
           middleware sirve el LOGIN con HTTP 200. [[lib/respuesta-json.ts]] */
        const d = await leeJson<Expediente>(r)
        if (vivo) setExp(d)
      } catch (e) {
        if (vivo) setError(mensajeDeError(e))
      }
    })()
    return () => { vivo = false }
  }, [id])

  if (error) {
    return (
      <p style={{ fontSize: 12, color: '#7C2D12', marginTop: 8 }}>
        No se pudo leer el expediente de entrega: {error}
      </p>
    )
  }
  if (!exp) {
    return <p style={{ fontSize: 12, color: TX_SUA, marginTop: 8 }}>Leyendo el expediente…</p>
  }

  const r = exp.resumen
  const cierran = r.completos + r.faltan
  const pct = cierran > 0 ? (r.completos / cierran) * 100 : null

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        padding: '10px 12px', borderRadius: 10,
        background: '#F5F8FB', border: `1px solid ${BORDE}`,
      }}>
        <PastillaDistintivo c={exp.clasificacion} grande />
        <span style={{ fontSize: 12.5, color: TX_MID, background: 'transparent' }}>
          {exp.clasificacion.porque}
        </span>
      </div>

      <button
        onClick={() => setAbierto(v => !v)}
        style={{
          marginTop: 10, padding: '6px 11px', fontSize: 11.5, fontWeight: 700,
          color: TX_MID, background: '#FFFFFF',
          border: `1px solid ${BORDE}`, borderRadius: 8, cursor: 'pointer',
        }}
      >
        {abierto ? 'Ocultar los 20 puntos de la entrega' : 'Ver los 20 puntos de la entrega'}
        {' · '}
        {/* `background` explícito: la regla de globals.css fuerza a blanco el
            color de un <strong> dentro de .cp-card si no lo declara. */}
        <strong style={{ color: TX, background: 'transparent' }}>{r.completos} de {cierran}</strong>
        {pct !== null ? ` (${pct.toFixed(0)}%)` : ''}
      </button>

      {abierto && <ListaApartados exp={exp} />}
    </div>
  )
}

/**
 * El render de los 20 apartados, SIN la carga.
 *
 * Lo usan el bloque de arriba (que trae el expediente por `id`) y el detalle
 * del buscador de la puerta, que ya lo tiene cargado. Antes cada uno tenía su
 * propia lista tecleada: dos renders del mismo expediente se separan sin avisar
 * y los dos siguen pareciendo ciertos.
 */
export function ListaApartados({ exp }: { exp: Expediente }) {
  const r = exp.resumen
  const cierran = r.completos + r.faltan
  const pct = cierran > 0 ? (r.completos / cierran) * 100 : null

  return (
    <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <Pastilla color={exp.fuentes.cuentaEnCartera ? COLOR.completo : COLOR.no_medible}
              texto={exp.fuentes.cuentaEnCartera ? 'en la cartera de CS' : 'fuera de la cartera de CS'} />
            <Pastilla color={exp.fuentes.enGrc ? COLOR.completo : COLOR.falta}
              texto={exp.fuentes.enGrc ? 'en el GRC' : 'no está en el GRC'} />
            <Pastilla color={exp.fuentes.conContrato ? COLOR.completo : COLOR.no_medible}
              texto={exp.fuentes.conContrato ? 'con contrato en el archivo' : 'sin contrato en el archivo'} />
            <Pastilla color={exp.fuentes.didsEncontrados ? COLOR.completo : COLOR.falta}
              texto={exp.fuentes.didsEncontrados ? `${exp.fuentes.didsEncontrados} DID(s)` : 'sin DIDs localizados'} />
          </div>

          {exp.fuentes.cuentaError && (
            <div style={{
              marginTop: 10, padding: '10px 12px', borderRadius: 10,
              background: '#FFF7ED', border: '1px solid #FED7AA',
            }}>
              <span style={{ fontSize: 12, color: '#7C2D12' }}>
                La ficha de la cuenta NO SE PUDO LEER, así que los apartados 05 a
                08 y el 11 no están medidos — que es distinto de estar vacíos:
                {' '}{exp.fuentes.cuentaError}
              </span>
            </div>
          )}

          <p style={{ fontSize: 12.5, color: TX_MID, marginTop: 12, lineHeight: 1.7 }}>
            {/* El denominador honesto: 3 sin fuente y 1 no medible quedan fuera
                del contador en vez de contar como incumplimiento. */}
            <span style={{ fontWeight: 800, color: TX, background: 'transparent' }}>
              {r.completos} de {cierran}
            </span>{' '}
            apartados contestados.{' '}
            {r.sinFuente > 0 && <>Otros {r.sinFuente} no existen en ninguna fuente </>}
            {r.noMedibles > 0 && <>y {r.noMedibles} no es medible con el corte de tickets actual</>}
            {(r.sinFuente > 0 || r.noMedibles > 0) &&
              ', así que quedan fuera del contador.'}
          </p>

          <ol style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
            {exp.apartados.map(a => (
              <li key={a.clave} style={{ padding: '10px 0', borderBottom: `1px solid ${BORDE}` }}>
                <div style={{ display: 'flex', gap: 9, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: TX_SUA, background: 'transparent', minWidth: 18 }}>
                    {a.clave}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: TX, background: 'transparent' }}>
                    {a.titulo}
                  </span>
                  <Pastilla color={COLOR[a.estado]} texto={ETIQUETA[a.estado]} />
                </div>
                <p style={{ fontSize: 12.5, color: TX_MID, marginTop: 5, lineHeight: 1.6 }}>
                  {a.valor || VACIO[a.estado]}
                </p>
                {(a.detalle || a.nota) && (
                  <p style={{ fontSize: 11, color: TX_SUA, marginTop: 3, lineHeight: 1.55 }}>
                    {a.detalle ?? a.nota}
                  </p>
                )}
              </li>
            ))}
          </ol>
    </>
  )
}
