'use client'
import { useEffect, useState } from 'react'
import { leeJson, mensajeDeError } from '@/lib/respuesta-json'
import ExpedienteApartados from '@/components/ExpedienteApartados'

/**
 * LA FICHA DE UNA CUENTA: EL ARCHIVO, LA ETIQUETA Y LOS 20 PUNTOS
 * ================================================================
 *
 * Vive en su propio archivo porque la abren DOS sitios —el panel de la puerta
 * y los filtros de las gráficas— y una ficha pintada de dos maneras acaba
 * diciendo dos cosas del mismo cliente.
 *
 * ── UNA CUENTA PUEDE NO ESTAR EN LA HOJA, Y SIGUE SIENDO UNA CUENTA ─────────
 *
 * Dirección buscó **CBS Compresores** (F24, CID 134358) y no aparecía: existe,
 * factura y tiene asesor, pero **no tiene fila en Activaciones 2.0**. Medido el
 * 18 nov 2026 con `npm run mide:universo`: **138 de las 224 cuentas de cartera
 * están en ese caso.**
 *
 * Por eso la ficha se pinta aunque el archivo no devuelva ningún registro: con
 * la cabecera, el aviso de que no hay fila, y el expediente —que sí responde,
 * porque sus otras fuentes no dependen de la hoja—. Antes, en ese caso, la
 * ficha decía «sin registros» y se acababa ahí: una cuenta viva leída como un
 * hueco.
 */

/* La paleta del Customer Success Operating System, los mismos hex que usa el
   resto del apartado. Se repiten aquí porque importarlos de
   `ActivacionesCharts` crearía un ciclo: ese archivo monta esta ficha. */
const BORDER = '#DFE8EF'
const ACCENT = '#1D6CAA'
const TX     = '#202E3B'
const TX_MID = '#3D4B5C'
const TX_LOW = '#6A7889'

interface CampoValor { campo: string; valor: string }
interface RegistroDetalle { cid: string; cliente: string; campos: CampoValor[] }
interface Detalle { registros: RegistroDetalle[]; columnasArchivo: number }

const LARGOS = new Set(['Comentarios Encuesta', 'contacto'])

export default function FichaActivacion({
  cid, cliente, titulo = 'Ficha del cliente — detalle completo del archivo',
}: {
  cid: string
  cliente: string
  titulo?: string
}) {
  const [data, setData]   = useState<Detalle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    setData(null); setError(null)
    const qs = cid !== 'todos'
      ? `cid=${encodeURIComponent(cid)}`
      : `cliente=${encodeURIComponent(cliente)}`
    ;(async () => {
      try {
        const r = await fetch(`/api/activaciones/detalle?${qs}`)
        /* No se llama a `r.json()` a secas. Con la sesión caducada el
           middleware sirve el LOGIN con HTTP 200 y text/html, y la ficha
           pintaba «Unexpected token '<'» en rojo, como si el dato estuviera
           mal. [[lib/respuesta-json.ts]] */
        const d = await leeJson<Detalle>(r)
        if (vivo) setData(d)
      } catch (e) {
        if (vivo) setError(mensajeDeError(e))
      }
    })()
    return () => { vivo = false }
  }, [cid, cliente])

  /* Sin fila en la hoja pero con CID: la ficha se pinta igual. El expediente
     responde desde las demás fuentes y el aviso dice por qué los apartados de
     la hoja salen en «falta». */
  const sinFila = Boolean(data && data.registros.length === 0 && cid !== 'todos')

  return (
    <div style={{ padding: '18px 20px', borderRadius: 14, background: '#FFFFFF', border: `1px solid ${BORDER}` }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: TX, marginBottom: 4 }}>{titulo}</p>

      {!data && !error && <p style={{ fontSize: 12, color: TX_LOW }}>Cargando detalles…</p>}
      {error && <p style={{ fontSize: 12, color: '#DC2626' }}>{error}</p>}

      {data && data.registros.length === 0 && cid === 'todos' && (
        <p style={{ fontSize: 12, color: TX_MID }}>Sin registros en el archivo para esta selección.</p>
      )}

      {sinFila && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: TX }}>{cliente || '(sin nombre)'}</span>
            <span style={{
              fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: ACCENT,
              background: `${ACCENT}14`, border: `1px solid ${ACCENT}30`, padding: '2px 9px', borderRadius: 99,
            }}>
              CID {cid}
            </span>
          </div>
          <div style={{
            padding: '10px 13px', borderRadius: 10,
            background: '#FFF7ED', border: '1px solid #FED7AA',
          }}>
            <span style={{ fontSize: 12.5, color: '#7C2D12' }}>
              Esta cuenta <strong>no tiene fila en Activaciones 2.0</strong>, así
              que no hay columnas del archivo que enseñar y los apartados que
              salen de la hoja aparecen abajo en «falta». No es trabajo sin
              hacer: es que la entrega nunca pasó por esa hoja. Son{' '}
              <strong>138 de las 224 cuentas de cartera</strong>.
            </span>
          </div>
          <ExpedienteApartados id={cid} plegado={false} />
        </div>
      )}

      {data && data.registros.map((r, i) => (
        <div key={`${r.cid}-${i}`} style={{
          marginTop: i === 0 ? 10 : 18, paddingTop: i === 0 ? 0 : 16,
          borderTop: i === 0 ? 'none' : `1px dashed ${BORDER}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: TX }}>{r.cliente}</span>
            <span style={{
              fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: ACCENT,
              background: `${ACCENT}14`, border: `1px solid ${ACCENT}30`, padding: '2px 9px', borderRadius: 99,
            }}>
              CID {r.cid}
            </span>
            {data.registros.length > 1 && (
              <span style={{ fontSize: 10.5, color: TX_LOW }}>registro {i + 1} de {data.registros.length}</span>
            )}
          </div>

          {/* LA ETIQUETA Y LOS 20 PUNTOS, ABIERTOS
              ──────────────────────────────────────
              Dirección (18 nov 2026): se tiene que saber de un clic quién es
              CLIENTE y quién es sólo una CUENTA, y «le hace falta ver en
              pantalla los 19 primeros puntos aunque habrá algunos que no tengan
              información». Un apartado vacío que no se ve no se captura nunca;
              el botón queda para plegarlos, no para abrirlos. */}
          <ExpedienteApartados id={r.cid} plegado={false} />

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
            gap: '8px 18px', marginTop: 16,
          }}>
            {r.campos.filter(c => !LARGOS.has(c.campo) && c.campo !== 'ID' && c.campo !== 'Cliente').map(c => (
              <div key={c.campo} style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 9.5, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: 1,
                }}>{c.campo}</p>
                <p style={{ fontSize: 12.5, color: TX, fontWeight: 600, overflowWrap: 'break-word' }}>{c.valor}</p>
              </div>
            ))}
          </div>
          {r.campos.filter(c => LARGOS.has(c.campo)).map(c => (
            <div key={c.campo} style={{
              marginTop: 12, padding: '10px 13px', background: '#F5F8FB',
              border: `1px solid ${BORDER}`, borderRadius: 9,
            }}>
              <p style={{
                fontSize: 9.5, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: 4,
              }}>{c.campo}</p>
              <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{c.valor}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
