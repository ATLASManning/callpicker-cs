'use client'
import { useState } from 'react'
import { pastillaSobrePagina } from '@/lib/contraste'
import { leeJson, mensajeDeError } from '@/lib/respuesta-json'

/**
 * EL EXPEDIENTE DE ENTREGA, DENTRO DE ACTIVACIONES 2.0
 * =====================================================
 *
 * Los 20 apartados que hay que entregar al cerrar una activación, para la
 * activación que se elija. Cada uno con lo que el sistema YA sabe y, cuando no
 * sabe, con la razón escrita.
 *
 * La hoja no se toca: esto lee `data/activaciones.xlsx` y lo cruza con
 * `cuentas`, el GRC, los contratos y los DIDs. El catálogo de apartados vive en
 * `lib/entrega-apartados.ts`; el cruce, en `/api/entregas/expediente`.
 *
 * ── POR QUÉ EL CONTADOR NO DICE «x/20» ───────────────────────────────────────
 *
 * Porque 3 de los 20 no existen en ninguna fuente y 1 no es medible con el
 * corte de tickets que tenemos. Un «6/20» leería como un 30% de cumplimiento y
 * castigaría a quien entrega por cuatro apartados que el sistema no le puede
 * dar. Se cuenta sobre los que SÍ se pueden contestar, y los otros cuatro se
 * dicen aparte, con palabras.
 */

export interface ItemActivacion { id: string; cliente: string }

type Estado = 'completo' | 'falta' | 'otra_fuente' | 'sin_fuente' | 'no_medible'

interface ApartadoVivo {
  clave:  string
  titulo: string
  estado: Estado
  valor:  string
  nota?:  string
  detalle?: string
  fuente: string
}

interface Respuesta {
  id: string
  cid: string
  cliente: string
  apartados: ApartadoVivo[]
  resumen: {
    completos: number; faltan: number; otraFuente: number
    sinFuente: number; noMedibles: number; total: number
  }
  fuentes: {
    cuentaEnCartera: boolean
    cuentaError: string | null
    enGrc: boolean
    conContrato: boolean
    didsEncontrados: number
  }
}

const TX     = '#202E3B'
const TX_MID = '#3D4B5C'
const TX_SUA = '#6A7889'
const BORDE  = '#DFE8EF'

/* Un color por estado. El TONO DE LA LETRA no se teclea: lo calcula
 * `pastillaSobrePagina` contra el fondo real de la página, que es la única
 * regla que ha sobrevivido catorce rondas del mismo error. */
const COLOR: Record<Estado, string> = {
  completo:    '#15803D',
  falta:       '#B45309',
  otra_fuente: '#1D6CAA',
  sin_fuente:  '#6D28D9',
  no_medible:  '#52606D',
}
/* Qué se escribe cuando el apartado no trae valor. Se distingue el hueco
 * («falta», hay dónde ponerlo y no está) de la ausencia de fuente (no hay dónde
 * ponerlo) y de lo que la fuente no mide. Las tres se veían igual con un «—». */
const VACIO: Record<Estado, string> = {
  completo:    '—',
  falta:       'no está capturado',
  otra_fuente: 'lo cierra otra fuente del sistema',
  sin_fuente:  'no existe en ninguna fuente — se captura o se declara no disponible',
  no_medible:  'la fuente existe pero no mide esto',
}

const ETIQUETA: Record<Estado, string> = {
  completo:    'completo',
  falta:       'falta',
  otra_fuente: 'otra fuente',
  sin_fuente:  'sin fuente',
  no_medible:  'no medible',
}

export default function ExpedienteEntrega({
  activaciones, ano,
}: { activaciones: ItemActivacion[]; ano: number | null }) {
  const [filtro,  setFiltro]  = useState('')
  const [cargando, setCargando] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [exp,     setExp]     = useState<Respuesta | null>(null)

  const q = filtro.trim().toLowerCase()
  const sugeridas = q
    ? activaciones.filter(a =>
        a.id.includes(q) || a.cliente.toLowerCase().includes(q)).slice(0, 12)
    : activaciones.slice(0, 12)

  async function abre(id: string) {
    setCargando(true); setError(null); setExp(null)
    try {
      const r = await fetch(`/api/entregas/expediente?id=${encodeURIComponent(id)}`)
      /* No se llama a `r.json()` a secas: con la sesión caducada el middleware
         sirve el LOGIN con HTTP 200, y el parser suelta un `SyntaxError` que
         para quien usa el tablero no significa nada. [[lib/respuesta-json.ts]] */
      setExp(await leeJson<Respuesta>(r))
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }

  return (
    <section style={{ marginTop: 40 }}>
      <div style={{
        padding: '20px 24px', borderRadius: 16,
        background: '#FFFFFF', border: `1px solid ${BORDE}`,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: TX, letterSpacing: '-0.01em' }}>
          Expediente de entrega
        </h2>
        <p style={{ fontSize: 13, color: TX_MID, marginTop: 8, lineHeight: 1.7 }}>
          Lo que hay que entregar al cerrar una activación, apartado por apartado.
          La hoja de Activaciones 2.0 sigue siendo la fuente y no se toca: esto
          lee lo que ya trae y lo cruza con la ficha de la cuenta, el GRC, los
          contratos y los DIDs. Donde no hay dato, lo dice —y dice por qué—
          en vez de dejar un hueco.
        </p>

        {/* ── Buscador ────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 18 }}>
          <label htmlFor="exp-busca" style={{
            display: 'block', fontSize: 11, fontWeight: 700, color: TX_SUA,
            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6,
          }}>
            Activación — por ID o por cliente
          </label>
          <input
            id="exp-busca"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="p. ej. 162474 o Medicall"
            style={{
              width: '100%', maxWidth: 420, padding: '9px 12px', fontSize: 14,
              color: TX, background: '#FFFFFF',
              border: `1px solid ${BORDE}`, borderRadius: 10, outline: 'none',
            }}
          />
          <p style={{ fontSize: 11, color: TX_SUA, marginTop: 6 }}>
            {/* Se dice qué hay en la lista y qué no: una lista recortada que no
                se declara se lee como «no existe». */}
            La lista sugiere las activaciones{ano ? ` de ${ano}` : ''} ({activaciones.length.toLocaleString('es-MX')}).
            Una de un año anterior se abre tecleando su ID completo.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {sugeridas.map(a => (
              <button
                key={a.id}
                onClick={() => abre(a.id)}
                style={{
                  padding: '5px 10px', fontSize: 12, fontWeight: 600,
                  color: TX_MID, background: '#F5F8FB',
                  border: `1px solid ${BORDE}`, borderRadius: 8, cursor: 'pointer',
                }}
              >
                {a.cliente} · {a.id}
              </button>
            ))}
            {q && !sugeridas.length && /^\d+$/.test(q) && (
              <button
                onClick={() => abre(q)}
                style={{
                  padding: '5px 10px', fontSize: 12, fontWeight: 700,
                  color: '#FFFFFF', background: '#1D6CAA',
                  border: '1px solid #1D6CAA', borderRadius: 8, cursor: 'pointer',
                }}
              >
                Buscar el ID {q}
              </button>
            )}
            {q && !sugeridas.length && !/^\d+$/.test(q) && (
              <span style={{ fontSize: 12, color: TX_SUA }}>
                Nada con ese texto en la lista sugerida.
              </span>
            )}
          </div>
        </div>

        {cargando && (
          <p style={{ fontSize: 13, color: TX_MID, marginTop: 18 }}>Leyendo las fuentes…</p>
        )}

        {error && (
          <div style={{
            marginTop: 18, padding: '12px 14px', borderRadius: 10,
            background: '#FFF7ED', border: '1px solid #FED7AA',
          }}>
            <span style={{ fontSize: 13, color: '#7C2D12' }}>{error}</span>
          </div>
        )}

        {exp && <Detalle exp={exp} />}
      </div>
    </section>
  )
}

function Detalle({ exp }: { exp: Respuesta }) {
  const r = exp.resumen
  const cierran = r.completos + r.faltan
  const pct = cierran > 0 ? (r.completos / cierran) * 100 : null

  return (
    <div style={{ marginTop: 22, borderTop: `1px solid ${BORDE}`, paddingTop: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: TX }}>
        {exp.cliente}
      </h3>
      <p style={{ fontSize: 12, color: TX_SUA, marginTop: 4 }}>
        ID {exp.id}{exp.cid && exp.cid !== exp.id ? ` · CID ${exp.cid}` : ''}
      </p>

      {/* ── De qué fuentes se pudo tirar, dicho antes de los apartados ───── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <Pastilla
          color={exp.fuentes.cuentaEnCartera ? COLOR.completo : COLOR.no_medible}
          texto={exp.fuentes.cuentaEnCartera
            ? 'en la cartera de CS'
            : 'fuera de la cartera de CS'} />
        <Pastilla color={exp.fuentes.enGrc ? COLOR.completo : COLOR.falta}
          texto={exp.fuentes.enGrc ? 'en el GRC' : 'no está en el GRC'} />
        <Pastilla color={exp.fuentes.conContrato ? COLOR.completo : COLOR.no_medible}
          texto={exp.fuentes.conContrato ? 'con contrato en el archivo' : 'sin contrato en el archivo'} />
        <Pastilla color={exp.fuentes.didsEncontrados ? COLOR.completo : COLOR.falta}
          texto={exp.fuentes.didsEncontrados
            ? `${exp.fuentes.didsEncontrados} DID(s)`
            : 'sin DIDs localizados'} />
      </div>

      {exp.fuentes.cuentaError && (
        <div style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 10,
          background: '#FFF7ED', border: '1px solid #FED7AA',
        }}>
          <span style={{ fontSize: 12, color: '#7C2D12' }}>
            {/* «No se pudo leer» NO es «no existe». Si esto se callara, una
                falla de la base se leería como una cuenta sin contactos. */}
            La ficha de la cuenta NO SE PUDO LEER, así que los apartados 05 a 08
            y el 11 no están medidos — que es distinto de estar vacíos: {exp.fuentes.cuentaError}
          </span>
        </div>
      )}

      {/* ── El contador, sobre el denominador honesto ────────────────────── */}
      <div style={{
        marginTop: 16, padding: '12px 14px', borderRadius: 12,
        background: '#F5F8FB', border: `1px solid ${BORDE}`,
      }}>
        <p style={{ fontSize: 13, color: TX_MID, lineHeight: 1.7 }}>
          <span style={{ fontWeight: 800, color: TX, background: 'transparent' }}>
            {r.completos} de {cierran}
          </span>{' '}
          apartados contestados{pct !== null ? ` (${pct.toFixed(0)}%)` : ''}.{' '}
          {r.sinFuente > 0 && (
            <>
              Otros <span style={{ fontWeight: 700, color: TX, background: 'transparent' }}>
                {r.sinFuente}
              </span>{' '}
              no existen en ninguna fuente{' '}
            </>
          )}
          {r.noMedibles > 0 && (
            <>
              y <span style={{ fontWeight: 700, color: TX, background: 'transparent' }}>
                {r.noMedibles}
              </span>{' '}
              no es medible con el corte de tickets actual
            </>
          )}
          {(r.sinFuente > 0 || r.noMedibles > 0) &&
            ', así que quedan fuera del contador en vez de contar como incumplimiento.'}
        </p>
      </div>

      {/* ── Los 20 ───────────────────────────────────────────────────────── */}
      <ol style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
        {exp.apartados.map(a => (
          <li key={a.clave} style={{
            padding: '12px 0', borderBottom: `1px solid ${BORDE}`,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: TX_SUA,
                background: 'transparent', minWidth: 20,
              }}>
                {a.clave}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: TX, background: 'transparent' }}>
                {a.titulo}
              </span>
              <Pastilla color={COLOR[a.estado]} texto={ETIQUETA[a.estado]} />
            </div>
            <p style={{ fontSize: 13, color: TX_MID, marginTop: 6, lineHeight: 1.6 }}>
              {/* UN GUION NO DICE POR QUÉ ESTÁ VACÍO. El 09, el 12 y el 20 no
                  tienen fuente y el 18 no se puede medir: ponerles el mismo «—»
                  que a un contacto que falta de verdad los hace indistinguibles,
                  y es justo la confusión que este expediente existe para evitar.
                  La ausencia se marca con palabras. */}
              {a.valor || VACIO[a.estado]}
            </p>
            {(a.detalle || a.nota) && (
              <p style={{ fontSize: 11.5, color: TX_SUA, marginTop: 4, lineHeight: 1.6 }}>
                {a.detalle ?? a.nota}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Pastilla({ color, texto }: { color: string; texto: string }) {
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
