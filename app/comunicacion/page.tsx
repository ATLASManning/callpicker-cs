'use client'

/**
 * COMUNICACIÓN — el apartado desde el que se consulta el registro de
 * comunicaciones de una cuenta (tickets, llamadas, correos y WhatsApp).
 * ========================================================================
 *
 * QUÉ ES ESTO Y QUÉ NO ES, PARA QUE NADIE SE CONFUNDA
 *
 * Esta pantalla NO trae los datos al tablero: abre el conector `com-contexto`
 * en una pestaña, con la sesión de Google de quien la usa. Es deliberado y hoy
 * es lo único honesto que se puede hacer:
 *
 *   El conector responde **HTTP 200 con la pantalla de login** a cualquier
 *   petición sin sesión de navegador. Medido el 11 nov 2026: 745 bytes que
 *   dicen «Entrar», contra los 68,609 de una ficha real. Traerlo al servidor
 *   sin credencial haría que una cuenta sin permiso se viera como una cuenta
 *   sin actividad. Ver `lib/comunicaciones-conector.ts`, que ya tiene las
 *   compuertas puestas para cuando exista `CONECTOR_COMUNICACIONES_TOKEN`.
 *
 * O sea: la CONSULTA ya sirve hoy; la INGESTA —alertas de tickets abiertos,
 * columnas en cartera, contexto de Atlas— espera esa credencial.
 *
 * LA LIGA VA POR `?q=<CID>`, Y ESO SE MIDIÓ, NO SE SUPUSO
 *
 * El buscador del conector es un GET con el parámetro `q`, leído de su propio
 * formulario. Se probó con dos cuentas reales —CID 190271 Plastitabla, 35
 * registros; CID 26654 ABRL, 14— y con un CID inexistente, que devuelve «No
 * encontré nada» sin el rótulo de comunicaciones. Las 224 cuentas de cartera
 * tienen CID, así que no hay que cruzar por nombre ni una sola vez.
 *
 * EL CANDADO DE CARTERA LO PONE LA API, NO ESTA PANTALLA
 *
 * La lista sale de `/api/cuentas`, que ya aplica `lib/dueno.ts`. Esta pantalla
 * no vuelve a decidir quién ve qué —duplicar esa decisión es justo como se
 * abrieron las once fugas de octubre—. Si la API devuelve una cuenta, se
 * puede consultar. [[auditoria-acceso-oct2026]]
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import { ExternalLink, Search, MessageSquare, Info } from 'lucide-react'

/* La liga vive en `lib/comunicaciones-liga.ts`, NO aquí: un archivo de página
   no puede tener exports con nombre —`next build` lo rechaza aunque `tsc` lo
   dé por bueno— y además la van a usar la ficha de cuenta y Alertas. */
import { ligaConector } from '@/lib/comunicaciones-liga'

const INK    = '#202E3B'
const INK_M  = '#3D4B5C'
const AZUL   = '#2696F1'
const BORDE  = '#E3E9F0'
const FONDO  = '#F5F8FB'

interface Cuenta {
  id: string
  consecutivo: string | null
  cid: string | null
  empresa: string
  asesor: string | null
}

export default function ComunicacionPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cargando, setCargando] = useState(true)
  const [busca, setBusca] = useState('')
  const [asesor, setAsesor] = useState('')
  const [libre, setLibre] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const c = await fetch('/api/cuentas').then(r => r.json()).catch(() => [])
      const lista = Array.isArray(c) ? c : (c?.data ?? [])
      setCuentas(
        lista.map((x: Record<string, unknown>) => ({
          id: String(x.id),
          consecutivo: (x.consecutivo as string) ?? null,
          cid: (x.cid as string) ?? null,
          empresa: String(x.empresa ?? ''),
          asesor: (x.asesor as string) ?? null,
        })),
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const asesores = useMemo(
    () => [...new Set(cuentas.map(c => c.asesor).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'es')),
    [cuentas],
  )

  const visibles = useMemo(() => {
    const t = busca.trim().toLowerCase()
    return cuentas
      .filter(c => (asesor ? c.asesor === asesor : true))
      .filter(c =>
        !t ||
        c.empresa.toLowerCase().includes(t) ||
        (c.consecutivo ?? '').toLowerCase().includes(t) ||
        (c.cid ?? '').includes(t),
      )
      .sort((a, b) => a.empresa.localeCompare(b.empresa, 'es'))
  }, [cuentas, busca, asesor])

  /* CUÁNTAS SE PUEDEN CONSULTAR Y CUÁNTAS NO — con palabras, no con un cero.
     Una cuenta sin CID no es una cuenta sin comunicaciones: es una cuenta que
     no sabemos preguntar. [[feedback-cero-sin-medicion]] */
  const sinCid = visibles.filter(c => !c.cid).length

  const abrir = (q: string) => window.open(ligaConector(q), '_blank', 'noopener,noreferrer')

  return (
    <div style={{ background: FONDO, minHeight: '100vh' }}>
      <PageHeader
        title="Comunicación"
        subtitle="Tickets, llamadas, correos y WhatsApp de cada cuenta, en una sola línea de tiempo"
      />

      <div style={{ padding: '0 24px 32px', maxWidth: 1200 }}>

        {/* ── Qué es esto ─────────────────────────────────────────────── */}
        <div
          style={{
            background: '#fff', border: `1px solid ${BORDE}`, borderRadius: 12,
            padding: '16px 18px', marginBottom: 20, display: 'flex', gap: 12,
          }}
        >
          <Info size={18} color={AZUL} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: INK_M, lineHeight: 1.65 }}>
            <div style={{ color: INK, fontWeight: 600, marginBottom: 4 }}>
              La consulta abre el Registro de comunicaciones con tu sesión de Callpicker.
            </div>
            Se abre en una pestaña nueva y entra con tu cuenta de Google
            (@callpicker.com). Todavía <strong><span style={{ background: 'transparent', color: INK }}>no</span></strong>{' '}
            traemos estos datos al tablero: falta una credencial de servicio, y sin ella
            una cuenta sin permiso se vería igual que una cuenta sin actividad.
            Por eso se consulta en su fuente y no se copia a medias.
          </div>
        </div>

        {/* ── Búsqueda libre ──────────────────────────────────────────── */}
        <div
          style={{
            background: '#fff', border: `1px solid ${BORDE}`, borderRadius: 12,
            padding: '18px 20px', marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 10, letterSpacing: 0.3 }}>
            BUSCAR EN EL REGISTRO
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={libre}
              onChange={e => setLibre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && libre.trim()) abrir(libre) }}
              placeholder="Correo, teléfono de 10 dígitos, CID o ID de Zoho"
              style={{
                flex: '1 1 320px', border: `1px solid ${BORDE}`, borderRadius: 8,
                padding: '10px 12px', fontSize: 14, color: INK, outline: 'none',
              }}
            />
            <button
              onClick={() => libre.trim() && abrir(libre)}
              disabled={!libre.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: libre.trim() ? AZUL : '#B8C4D0', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600,
                cursor: libre.trim() ? 'pointer' : 'default',
              }}
            >
              <Search size={15} /> Buscar
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: INK_M, marginTop: 8, lineHeight: 1.6 }}>
            Sirve también para quien no está en cartera — un prospecto, un número que llamó.
          </div>
        </div>

        {/* LAS CUATRO TARJETAS DE CANAL SE QUITARON (instrucción, 12 nov 2026):
            «sólo van a confundir a quien los vea». Y tenía razón — describían
            lo que el conector trae, en una pantalla cuyo trabajo es LLEVARTE
            ahí. Lo que se va a ver son los detalles de la comunicación entre
            el cliente y Callpicker, y eso se ve al abrirlo, no se resume de
            antemano. El inventario de canales sigue, donde sí sirve, en el
            artículo de la Base de Conocimiento. */}

        {/* ── Cartera ─────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: `1px solid ${BORDE}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDE}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: 'transparent', color: INK, fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>
              TUS CUENTAS
            </span>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Filtrar por empresa, consecutivo o CID"
              style={{
                flex: '1 1 240px', border: `1px solid ${BORDE}`, borderRadius: 8,
                padding: '8px 11px', fontSize: 13, color: INK, outline: 'none',
              }}
            />
            {asesores.length > 1 && (
              <select
                value={asesor}
                onChange={e => setAsesor(e.target.value)}
                style={{
                  border: `1px solid ${BORDE}`, borderRadius: 8, padding: '8px 11px',
                  fontSize: 13, color: INK, background: '#fff', outline: 'none',
                }}
              >
                <option value="">Todos los asesores</option>
                {asesores.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
          </div>

          {cargando ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: INK_M }}>
              Cargando cartera…
            </div>
          ) : visibles.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: INK_M }}>
              {cuentas.length === 0
                ? 'No se pudo leer la cartera. No es que no haya cuentas: es que la consulta no respondió.'
                : 'Ninguna cuenta coincide con el filtro.'}
            </div>
          ) : (
            <>
              <div style={{ maxHeight: 560, overflowY: 'auto' }}>
                {visibles.map(c => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 20px', borderBottom: `1px solid ${BORDE}`,
                    }}
                  >
                    <span
                      style={{
                        background: FONDO, color: INK_M, fontSize: 11, fontWeight: 700,
                        padding: '3px 7px', borderRadius: 5, minWidth: 44, textAlign: 'center',
                      }}
                    >
                      {c.consecutivo ?? '—'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.empresa}
                      </div>
                      <div style={{ fontSize: 11, color: INK_M }}>
                        {c.asesor ?? 'sin asesor'}{c.cid ? ` · CID ${c.cid}` : ''}
                      </div>
                    </div>
                    {c.cid ? (
                      <button
                        onClick={() => abrir(c.cid as string)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: '#fff', color: AZUL, border: `1px solid ${AZUL}`,
                          borderRadius: 7, padding: '6px 12px', fontSize: 12.5,
                          fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        <MessageSquare size={13} /> Ver comunicaciones
                        <ExternalLink size={11} />
                      </button>
                    ) : (
                      /* SIN CID NO SE PUEDE PREGUNTAR, y eso se escribe con
                         palabras. No es una cuenta callada. */
                      <span
                        style={{
                          background: FONDO, color: INK_M, fontSize: 11.5,
                          padding: '6px 11px', borderRadius: 7, flexShrink: 0,
                        }}
                      >
                        sin CID · no se puede consultar
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 20px', fontSize: 11.5, color: INK_M, background: FONDO }}>
                {visibles.length} cuenta{visibles.length === 1 ? '' : 's'}
                {sinCid > 0 && ` · ${sinCid} sin CID, que no se pueden consultar`}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
