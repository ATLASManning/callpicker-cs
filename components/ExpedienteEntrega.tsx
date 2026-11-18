'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { pastillaSobrePagina } from '@/lib/contraste'
import { leeJson, mensajeDeError } from '@/lib/respuesta-json'

/**
 * LA PUERTA: POR DÓNDE ENTRAN LAS CUENTAS Y LOS CLIENTES
 * =======================================================
 *
 * Activaciones 2.0 es por donde se recibe todo, así que esta sección se usa
 * de pie y con prisa: se teclea un nombre, se ve el distintivo, se abre el
 * expediente. Primero lo que se hace; la explicación, a un clic.
 *
 * ── EL DISTINTIVO ────────────────────────────────────────────────────────────
 *
 * Regla de dirección (18 nov 2026): si falta información es **Cuenta**; si la
 * ficha del apartado Cuentas está completa, es **Cliente**. Qué cuenta como
 * «completa» no lo decide esta pantalla: sale de `lib/clasificacion-entrega.ts`,
 * que importa los requisitos del mismo catálogo que usa el motor de alertas.
 *
 * ── LA BÚSQUEDA VA AL SERVIDOR, Y NO ES UN CAPRICHO ─────────────────────────
 *
 * Antes el navegador recibía sólo las activaciones del año vivo —373 de
 * 2,820— y buscar por nombre sólo encontraba ésas: una activación de 2023
 * existía y no aparecía. Ahora se busca contra las 2,820 en
 * `/api/entregas/buscar` y sólo viajan los resultados.
 *
 * ── POR QUÉ EL CONTADOR DEL EXPEDIENTE NO DICE «x/20» ───────────────────────
 *
 * Porque 3 de los 20 apartados no existen en ninguna fuente y 1 no es medible
 * con el corte de tickets que hay. Un «6/20» leería como un 30% de cumplimiento
 * y castigaría a quien entrega por cuatro cosas que el sistema no le puede dar.
 */

type Estado = 'completo' | 'falta' | 'otra_fuente' | 'sin_fuente' | 'no_medible'
type Distintivo = 'cliente' | 'cuenta'
type MotivoCuenta = 'incompleta' | 'fuera' | 'no_medido'

interface Faltante { campo: string; etiqueta: string; critico: boolean; dueno: string }

interface Clasificacion {
  distintivo: Distintivo
  motivo: MotivoCuenta | null
  faltan: Faltante[]
  faltanOpcionales: Faltante[]
  porque: string
}

interface ResultadoBusqueda {
  id: string; cliente: string; ano: string; tipo: string
  clasificacion: Clasificacion
}

interface RespuestaBusqueda {
  resultados: ResultadoBusqueda[]
  totalEnLaHoja: number
  coincidencias: number
  devueltos: number
  recortado: boolean
  cuentasError: string | null
}

interface ApartadoVivo {
  clave: string; titulo: string; estado: Estado
  valor: string; nota?: string; detalle?: string; fuente: string
}

interface Respuesta {
  id: string; cid: string; cliente: string
  apartados: ApartadoVivo[]
  resumen: {
    completos: number; faltan: number; otraFuente: number
    sinFuente: number; noMedibles: number; total: number
  }
  fuentes: {
    cuentaEnCartera: boolean; cuentaError: string | null
    enGrc: boolean; conContrato: boolean; didsEncontrados: number
  }
}

/** Lo medido sobre las 2,820, en el servidor. */
export interface Puerta {
  total: number
  cliente: number
  incompleta: number
  fuera: number
  /** Qué falta, y en cuántas. No es un reparto: una puede faltarle varias. */
  porFaltante: Array<{ etiqueta: string; dueno: string; n: number }>
  error: string | null
}

export interface ClienteMultiCuenta {
  nombre: string; grafias: string[]
  cuentas: Array<{ id: string; ano: number | null }>
}

const TX     = '#202E3B'
const TX_MID = '#3D4B5C'
const TX_SUA = '#6A7889'
const BORDE  = '#DFE8EF'

/* Los tonos se CALCULAN contra el fondo real de la página. Es la única regla
 * que ha sobrevivido catorce rondas del mismo error. */
const COLOR: Record<Estado, string> = {
  completo: '#15803D', falta: '#B45309', otra_fuente: '#1D6CAA',
  sin_fuente: '#6D28D9', no_medible: '#52606D',
}
const ETIQUETA: Record<Estado, string> = {
  completo: 'completo', falta: 'falta', otra_fuente: 'otra fuente',
  sin_fuente: 'sin fuente', no_medible: 'no medible',
}
/* Un guion no dice POR QUÉ está vacío. La ausencia se marca con palabras. */
const VACIO: Record<Estado, string> = {
  completo: '—',
  falta: 'no está capturado',
  otra_fuente: 'lo cierra otra fuente del sistema',
  sin_fuente: 'no existe en ninguna fuente — se captura o se declara no disponible',
  no_medible: 'la fuente existe pero no mide esto',
}

const COLOR_CLIENTE    = '#15803D'
const COLOR_INCOMPLETA = '#B45309'
const COLOR_FUERA      = '#52606D'

function colorDe(c: Clasificacion): string {
  if (c.distintivo === 'cliente') return COLOR_CLIENTE
  if (c.motivo === 'fuera') return COLOR_FUERA
  if (c.motivo === 'no_medido') return '#6D28D9'
  return COLOR_INCOMPLETA
}
function textoDe(c: Clasificacion): string {
  if (c.distintivo === 'cliente') return 'CLIENTE'
  if (c.motivo === 'no_medido') return 'sin medir'
  return 'CUENTA'
}

type Filtro = 'todas' | 'cliente' | 'incompleta' | 'fuera'

export default function ExpedienteEntrega({
  ano, clientesMulti = [], puerta,
}: {
  ano: number | null
  clientesMulti?: ClienteMultiCuenta[]
  puerta: Puerta
}) {
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [lista, setLista] = useState<RespuestaBusqueda | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [errorLista, setErrorLista] = useState<string | null>(null)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exp, setExp] = useState<Respuesta | null>(null)
  const [comoSeDecide, setComoSeDecide] = useState(false)

  /* El teclazo no dispara una petición por letra: se espera a que la persona
     pare. Sin esto, escribir «medicall» son ocho lecturas del .xlsx. */
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  const busca = useCallback(async (texto: string) => {
    setBuscando(true); setErrorLista(null)
    try {
      const r = await fetch(`/api/entregas/buscar?q=${encodeURIComponent(texto)}`)
      setLista(await leeJson<RespuestaBusqueda>(r))
    } catch (e) {
      setErrorLista(mensajeDeError(e))
    } finally {
      setBuscando(false)
    }
  }, [])

  useEffect(() => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => { void busca(q) }, 280)
    return () => { if (temporizador.current) clearTimeout(temporizador.current) }
  }, [q, busca])

  async function abre(id: string) {
    setCargando(true); setError(null); setExp(null)
    try {
      const r = await fetch(`/api/entregas/expediente?id=${encodeURIComponent(id)}`)
      /* No se llama a `r.json()` a secas: con la sesión caducada el middleware
         sirve el LOGIN con HTTP 200. [[lib/respuesta-json.ts]] */
      setExp(await leeJson<Respuesta>(r))
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setCargando(false)
    }
  }

  const visibles = (lista?.resultados ?? []).filter(r => {
    if (filtro === 'todas') return true
    if (filtro === 'cliente') return r.clasificacion.distintivo === 'cliente'
    if (filtro === 'fuera') return r.clasificacion.motivo === 'fuera'
    return r.clasificacion.motivo === 'incompleta'
  })

  return (
    <section style={{ marginTop: 40 }}>
      <div style={{
        padding: '20px 24px', borderRadius: 16,
        background: '#FFFFFF', border: `1px solid ${BORDE}`,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: TX, letterSpacing: '-0.01em' }}>
          La puerta: Cuenta o Cliente
        </h2>
        <p style={{ fontSize: 13, color: TX_MID, marginTop: 8, lineHeight: 1.7 }}>
          Por aquí entra todo. Si falta información es <strong>Cuenta</strong>;
          si su ficha del apartado Cuentas está completa, es{' '}
          <strong>Cliente</strong>. Busca una activación —de cualquier año— y
          abre su expediente de entrega.
        </p>

        {/* ── La barra: el reparto de las 2,820, de un vistazo ─────────────── */}
        <BarraPuerta p={puerta} filtro={filtro} alFiltrar={setFiltro} />

        {/* ── El buscador ──────────────────────────────────────────────────── */}
        <div style={{ marginTop: 16 }}>
          <input
            id="exp-busca"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Escribe un nombre o un ID — p. ej. Medicall o 162474"
            aria-label="Buscar una activación por nombre o por ID"
            style={{
              width: '100%', maxWidth: 520, padding: '11px 14px', fontSize: 15,
              color: TX, background: '#FFFFFF',
              border: `1px solid ${BORDE}`, borderRadius: 12, outline: 'none',
            }}
          />
          <p style={{ fontSize: 11.5, color: TX_SUA, marginTop: 6 }}>
            {buscando ? 'Buscando…' : lista ? (
              <>
                {/* Las tres cifras por separado: con una sola, un recorte
                    parece un total. */}
                {lista.coincidencias.toLocaleString('es-MX')} de{' '}
                {lista.totalEnLaHoja.toLocaleString('es-MX')} activaciones
                {lista.recortado && <> · se muestran las primeras {lista.devueltos}</>}
                {filtro !== 'todas' && <> · filtro aplicado sobre esas {lista.devueltos}</>}
              </>
            ) : 'Se busca contra las 2,820, no sólo contra el año vivo.'}
          </p>
        </div>

        {errorLista && <Aviso texto={errorLista} />}
        {lista?.cuentasError && (
          <Aviso texto={`El apartado Cuentas NO SE PUDO LEER, así que el distintivo de estos resultados no está medido —que es distinto de ser «Cuenta»—: ${lista.cuentasError}`} />
        )}

        {/* ── Los resultados ───────────────────────────────────────────────── */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}>
          {visibles.map(r => (
            <li key={r.id}>
              <button
                onClick={() => abre(r.id)}
                title={r.clasificacion.porque}
                style={{
                  display: 'flex', width: '100%', gap: 10, alignItems: 'center',
                  flexWrap: 'wrap', textAlign: 'left',
                  padding: '9px 10px', marginBottom: 4,
                  background: exp?.id === r.id ? '#F5F8FB' : 'transparent',
                  border: `1px solid ${exp?.id === r.id ? BORDE : 'transparent'}`,
                  borderRadius: 10, cursor: 'pointer',
                }}
              >
                <Pastilla color={colorDe(r.clasificacion)} texto={textoDe(r.clasificacion)} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: TX, background: 'transparent' }}>
                  {r.cliente}
                </span>
                <span style={{ fontSize: 12, color: TX_SUA, background: 'transparent' }}>
                  {r.id}{r.ano ? ` · ${r.ano}` : ''}{r.tipo ? ` · ${r.tipo}` : ''}
                </span>
                {r.clasificacion.faltan.length > 0 && (
                  <span style={{ fontSize: 11.5, color: TX_MID, background: 'transparent' }}>
                    falta: {r.clasificacion.faltan.map(f => f.etiqueta).join(', ')}
                  </span>
                )}
              </button>
            </li>
          ))}
          {!buscando && lista && !visibles.length && (
            <li style={{ fontSize: 13, color: TX_MID, padding: '10px 0' }}>
              {lista.coincidencias === 0
                ? 'Ninguna activación coincide con ese texto, en ningún año.'
                : 'Hay coincidencias, pero ninguna de las mostradas cae en este filtro.'}
            </li>
          )}
        </ul>

        {/* ── Cómo se decide: a un clic, no encima ─────────────────────────── */}
        <button
          onClick={() => setComoSeDecide(v => !v)}
          style={{
            marginTop: 10, padding: '5px 10px', fontSize: 11.5, fontWeight: 700,
            color: TX_MID, background: '#F5F8FB',
            border: `1px solid ${BORDE}`, borderRadius: 8, cursor: 'pointer',
          }}
        >
          {comoSeDecide ? 'Ocultar cómo se decide' : 'Cómo se decide el distintivo'}
        </button>
        {comoSeDecide && <ComoSeDecide p={puerta} />}

        {cargando && (
          <p style={{ fontSize: 13, color: TX_MID, marginTop: 18 }}>Leyendo las fuentes…</p>
        )}
        {error && <Aviso texto={error} />}

        {exp && (
          <Detalle
            exp={exp}
            clasificacion={visibles.find(r => r.id === exp.id)?.clasificacion ?? null}
            /* La cuenta abierta puede ser una de varias del mismo cliente. El
               expediente se entrega POR CUENTA —cada una tiene su ticket, sus
               DIDs y su aceptación—, pero quien lo lee tiene que saber que está
               viendo una parte del cliente, no el cliente. */
            hermano={clientesMulti.find(c => c.cuentas.some(x => x.id === exp.id)) ?? null}
            abre={abre} />
        )}
      </div>
    </section>
  )
}

/* ── La barra del reparto, que además filtra ─────────────────────────────────
   Es una gráfica y es un control: se ve el reparto y se toca para ver quiénes
   son. Los anchos salen de las cifras medidas, no de un diseño. */
function BarraPuerta({ p, filtro, alFiltrar }: {
  p: Puerta; filtro: Filtro; alFiltrar: (f: Filtro) => void
}) {
  if (p.error) {
    return <Aviso texto={`El reparto Cuenta/Cliente NO SE PUDO MEDIR: ${p.error}. No hay cifra, y eso no es un cero.`} />
  }
  const total = Math.max(1, p.total)
  const tramos = [
    { f: 'cliente'    as Filtro, n: p.cliente,    color: COLOR_CLIENTE,    label: 'Cliente' },
    { f: 'incompleta' as Filtro, n: p.incompleta, color: COLOR_INCOMPLETA, label: 'Cuenta · falta información' },
    { f: 'fuera'      as Filtro, n: p.fuera,      color: COLOR_FUERA,      label: 'Cuenta · fuera del apartado Cuentas' },
  ]
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden',
        border: `1px solid ${BORDE}`,
      }}>
        {tramos.map(t => (
          <div
            key={t.f}
            title={`${t.label}: ${t.n.toLocaleString('es-MX')}`}
            style={{
              width: `${(t.n / total) * 100}%`, background: t.color,
              /* Un tramo de 31 sobre 2,820 es el 1.1% y desaparecería. Se le
                 deja un mínimo visible: esconder al que importa por pequeño
                 sería justo lo contrario de lo que hace esta pantalla. */
              minWidth: t.n > 0 ? 6 : 0,
            }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        <Chip activo={filtro === 'todas'} color="#1D6CAA"
              texto={`Todas · ${p.total.toLocaleString('es-MX')}`}
              alPulsar={() => alFiltrar('todas')} />
        {tramos.map(t => (
          <Chip key={t.f} activo={filtro === t.f} color={t.color}
                texto={`${t.label} · ${t.n.toLocaleString('es-MX')}`}
                alPulsar={() => alFiltrar(t.f)} />
        ))}
      </div>
    </div>
  )
}

function ComoSeDecide({ p }: { p: Puerta }) {
  return (
    <div style={{
      marginTop: 10, padding: '12px 14px', borderRadius: 12,
      background: '#F5F8FB', border: `1px solid ${BORDE}`,
    }}>
      <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.7 }}>
        <strong style={{ color: TX }}>Completa no lo decide esta pantalla.</strong>{' '}
        Es la lista que el sistema ya usa para encender sus alarmas de ceguera:
        los tres campos sin los que no se puede escribir una auditoría —giro,
        servicio contratado y fecha de alta—, más al menos un contacto y las
        observaciones del KAM. El tamaño de empresa y las notas se piden en la
        misma visita, pero <strong>no degradan</strong> a Cuenta: el catálogo
        dice que su ausencia no enciende ninguna alerta por sí sola.
      </p>
      <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.7, marginTop: 8 }}>
        <strong style={{ color: TX }}>Hay dos razones distintas para «Cuenta»</strong>, y
        piden cosas distintas: que <strong>falte información</strong> de una
        ficha que sí existe —{p.incompleta.toLocaleString('es-MX')} casos, y es
        trabajo del asesor— o que la cuenta{' '}
        <strong>no esté en el apartado Cuentas</strong> —
        {p.fuera.toLocaleString('es-MX')}, que no las gestiona CS—. Y una
        tercera que no es ninguna de las dos: si la base no se puede leer, el
        distintivo sale <strong>sin medir</strong>, nunca «Cuenta».
      </p>
      {p.porFaltante.length > 0 && (
        <>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: TX, marginTop: 10 }}>
            Qué falta en las {p.incompleta} que sí están en Cuentas
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
            {p.porFaltante.map(f => (
              <li key={f.etiqueta} style={{ fontSize: 12, color: TX_MID, padding: '3px 0' }}>
                <strong style={{ color: TX }}>{f.n}</strong> · {f.etiqueta}{' '}
                <span style={{ color: TX_SUA, background: 'transparent' }}>({f.dueno})</span>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 11, color: TX_SUA, marginTop: 6, lineHeight: 1.5 }}>
            Una activación puede faltarle más de una cosa, así que esta lista{' '}
            <strong>no suma</strong> {p.incompleta}: no es un reparto.
          </p>
        </>
      )}
    </div>
  )
}

function Detalle({ exp, clasificacion, hermano, abre }: {
  exp: Respuesta
  clasificacion: Clasificacion | null
  hermano: ClienteMultiCuenta | null
  abre: (id: string) => void
}) {
  const r = exp.resumen
  const cierran = r.completos + r.faltan
  const pct = cierran > 0 ? (r.completos / cierran) * 100 : null
  const otras = hermano ? hermano.cuentas.filter(x => x.id !== exp.id) : []

  return (
    <div style={{ marginTop: 22, borderTop: `1px solid ${BORDE}`, paddingTop: 20 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: TX }}>{exp.cliente}</h3>
        {clasificacion && (
          <Pastilla color={colorDe(clasificacion)} texto={textoDe(clasificacion)} />
        )}
      </div>
      <p style={{ fontSize: 12, color: TX_SUA, marginTop: 4 }}>
        ID {exp.id}{exp.cid && exp.cid !== exp.id ? ` · CID ${exp.cid}` : ''}
      </p>
      {clasificacion && (
        <p style={{ fontSize: 12.5, color: TX_MID, marginTop: 6, lineHeight: 1.6 }}>
          {clasificacion.porque}
        </p>
      )}

      {otras.length > 0 && (
        <div style={{
          marginTop: 12, padding: '11px 13px', borderRadius: 10,
          background: '#F5F8FB', border: `1px solid ${BORDE}`,
        }}>
          <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.7 }}>
            <strong style={{ color: TX }}>Esta cuenta es una de {hermano!.cuentas.length}</strong>{' '}
            de <strong style={{ color: TX }}>{hermano!.nombre}</strong>. El
            expediente se entrega por cuenta —cada una tiene su ticket, sus DIDs
            y su aceptación—, así que lo de abajo NO describe al cliente entero.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {otras.slice().sort((a, b) => (a.ano ?? 0) - (b.ano ?? 0)).map(x => (
              <button key={x.id} onClick={() => abre(x.id)} style={{
                padding: '4px 10px', fontSize: 12, fontWeight: 700,
                color: TX_MID, background: '#FFFFFF',
                border: `1px solid ${BORDE}`, borderRadius: 8, cursor: 'pointer',
              }}>
                {x.id}{x.ano ? ` · ${x.ano}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

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
        <Aviso texto={`La ficha de la cuenta NO SE PUDO LEER, así que los apartados 05 a 08 y el 11 no están medidos — que es distinto de estar vacíos: ${exp.fuentes.cuentaError}`} />
      )}

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
              Otros <span style={{ fontWeight: 700, color: TX, background: 'transparent' }}>{r.sinFuente}</span>{' '}
              no existen en ninguna fuente{' '}
            </>
          )}
          {r.noMedibles > 0 && (
            <>
              y <span style={{ fontWeight: 700, color: TX, background: 'transparent' }}>{r.noMedibles}</span>{' '}
              no es medible con el corte de tickets actual
            </>
          )}
          {(r.sinFuente > 0 || r.noMedibles > 0) &&
            ', así que quedan fuera del contador en vez de contar como incumplimiento.'}
        </p>
      </div>

      <ol style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
        {exp.apartados.map(a => (
          <li key={a.clave} style={{ padding: '12px 0', borderBottom: `1px solid ${BORDE}` }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: TX_SUA, background: 'transparent', minWidth: 20 }}>
                {a.clave}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: TX, background: 'transparent' }}>
                {a.titulo}
              </span>
              <Pastilla color={COLOR[a.estado]} texto={ETIQUETA[a.estado]} />
            </div>
            <p style={{ fontSize: 13, color: TX_MID, marginTop: 6, lineHeight: 1.6 }}>
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

function Chip({ activo, color, texto, alPulsar }: {
  activo: boolean; color: string; texto: string; alPulsar: () => void
}) {
  const p = pastillaSobrePagina(color, activo ? 0.24 : 0.1)
  return (
    <button
      onClick={alPulsar}
      aria-pressed={activo}
      style={{
        fontSize: 11.5, fontWeight: 700, padding: '5px 11px', borderRadius: 999,
        background: p.background, color: p.color,
        border: `1px solid ${activo ? p.color : p.borderColor}`,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {texto}
    </button>
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

function Aviso({ texto }: { texto: string }) {
  return (
    <div style={{
      marginTop: 12, padding: '10px 12px', borderRadius: 10,
      background: '#FFF7ED', border: '1px solid #FED7AA',
    }}>
      <span style={{ fontSize: 12.5, color: '#7C2D12' }}>{texto}</span>
    </div>
  )
}
