'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AlertTriangle, CalendarClock, ArrowRight, Pin, Clock } from 'lucide-react'
import { tonoSla, type Superficie } from '@/lib/sla-tonos'
import type { NivelSemaforo } from '@/lib/alertas-sla'

/**
 * EL SEMÁFORO DE VENCIMIENTO EN PANTALLA — banner, cola y bloque de la ficha
 *
 * ── TRES VISTAS, UN ARCHIVO ───────────────────────────────────────────────
 *
 * El banner, la cola y el bloque de la ficha pintan LO MISMO con tres
 * recortes. En tres archivos tendrían tres paletas y tres redacciones de la
 * misma frase, que es el patrón de «paletas gemelas» que ya costó una ronda de
 * contraste en este tablero: alguien corrige una y las otras dos se quedan
 * viejas sin que falle nada. [[atlas-dashboard-contrast-architecture]]
 *
 * ── LOS COLORES NO SE TECLEAN AQUÍ ────────────────────────────────────────
 *
 * Salen de `tonoSla(nivel, superficie)`, que los DERIVA contra el fondo real
 * con `lib/contraste.ts`. Y la superficie es un argumento obligatorio porque
 * las dos pantallas donde esto se monta son opuestas: `/alertas` es una isla
 * OSCURA y la ficha de cuenta es CLARA. Medidos en
 * `node scripts/mide-tonos-sla.mjs`.
 *
 * ── EL COLOR NUNCA VA SOLO ────────────────────────────────────────────────
 *
 * Cada pastilla lleva su palabra —«INCUMPLIDA», «Vence hoy», «En tiempo»— y
 * debajo la cuenta en días hábiles. Es requisito del encargo y además la única
 * forma de que esto sirva a quien no distingue el rojo del verde.
 *
 * ── Y LO QUE NO SE PUEDE HACER DESDE AQUÍ ─────────────────────────────────
 *
 * No hay botón de «cerrar», ni de borrar, ni de mover la fecha de generación.
 * No es que estén escondidos: no existen, ni aquí ni en la API. La atención se
 * cierra registrando la evidencia en la cuenta —un seguimiento, una reunión, una
 * corrección de ficha—, y la ALERTA no la cierra ninguna captura: la cierra que
 * la condición deje de verse en la fuente. Las dos frases van juntas en cada
 * renglón, porque confundirlas es lo que hace que un tablero se deje de mirar.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * LO QUE LA API DEVUELVE
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface Semaforo {
  nivel: NivelSemaforo
  etiqueta: string
  habiles: number
  vencida: boolean
  enTiempo: boolean | null
  orden: number
  fijada: boolean
}

export interface FilaSla {
  id: string
  cuenta_id: string
  empresa: string | null
  consecutivo: string | null
  dueno: string | null
  condicion: string
  titulo: string
  severidad: string
  severidad_base: string
  ajustes: string[] | null
  estado: string
  generada_en: string
  fecha_limite: string
  limite_original: string | null
  fecha_atendida: string | null
  reprogramaciones: number
  motivo_reprogramacion: string | null
  intentos_sin_respuesta: number
  reintento_limite: string | null
  nivel_escalamiento: number
  mrr: number | null
  semaforo: Semaforo
  etiquetaNivel: string
  escalamiento: { nivel: number; a: string; porque: string }
  accion_sugerida: string
  porque: string[]
  cierraAtencion: string
  noApagaLaAlerta: string
  laApaga: string | null
  evidencia_tipo: string | null
  evidencia_resumen: string | null
  enlace: string
}

export interface Resumen {
  asesor: string | null
  abiertas: number
  vencidas: number
  venceHoy: number
  incumplidas: number
  bloqueadas: number
  atendidas: number
  mrrEnRiesgo: number
  mrrVencido: number
  cuentas: number
  meta: { enTiempoPct: number; criticasVencidas: number }
}

interface Respuesta {
  rows?: FilaSla[]
  resumen?: Resumen
  noMedible?: string
  error?: string
  configuracion?: { condiciones: number; diasInhabiles: number; falla: string | null }
  hoy?: string
  version?: string
}

const dinero = (n: number | null | undefined) =>
  n === null || n === undefined
    ? 'sin importe'
    : `$${n.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`

/** Todo texto de color va en un `<span>` con `background` propio: `globals.css`
 *  fuerza a blanco cualquier `p`/`strong`/`td` que no lo declare dentro de una
 *  `.cp-card`. Ver [[atlas-dashboard-contrast-architecture]]. */
const C = (color: string, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ color, background: 'transparent', ...extra })

/** Los tokens de cada superficie. Pedirlos por función evita el juego cruzado. */
function tema(superficie: Superficie) {
  return superficie === 'oscura'
    ? { panel: '#0D1829', borde: 'rgba(255,255,255,0.08)',
        hi: 'rgba(255,255,255,0.94)', mid: 'rgba(255,255,255,0.72)',
        low: 'rgba(255,255,255,0.55)' }
    : { panel: '#FFFFFF', borde: '#DFE8EF',
        hi: '#202E3B', mid: '#3D4B5C', low: '#667384' }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LA LECTURA
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lee la respuesta como JSON, y cuando NO lo es dice qué pasó en español.
 *
 * ── POR QUÉ NO BASTA CON `r.json()` ───────────────────────────────────────
 *
 * `middleware.ts` de este proyecto sirve la pantalla de LOGIN con **HTTP 200**
 * para toda ruta protegida, `/api/*` incluida. O sea que una sesión caducada no
 * llega aquí como 401: llega como un 200 con HTML dentro, y `r.json()` revienta
 * con «Unexpected token '<', "<!DOCTYPE "... is not valid JSON».
 *
 * Eso se vio EN PANTALLA, no en una prueba: los tres bloques de /alertas
 * pintaban esa cadena tal cual. Decía la verdad —no se midió— pero en un idioma
 * que no es el de nadie, y escondía la única acción que resuelve el problema,
 * que es volver a entrar. Un mensaje de error genérico convierte cada fallo en
 * una investigación. [[feedback-verificar-antes-asegurar]]
 */
async function leeJson(r: Response): Promise<Record<string, unknown>> {
  const texto = await r.text()
  const cabeza = texto.trimStart().slice(0, 1)
  if (cabeza === '<') {
    throw new Error(
      'La sesión caducó: el servidor devolvió la pantalla de acceso en vez de '
      + 'los datos. Vuelve a entrar y recarga.',
    )
  }
  try {
    return JSON.parse(texto) as Record<string, unknown>
  } catch {
    /* Ni JSON ni login. Se dice el código y el principio del cuerpo, que es lo
       que permite distinguir un 502 del proxy de un error de la ruta. */
    throw new Error(
      `El servidor respondió algo que no es JSON (HTTP ${r.status}): `
      + `${texto.slice(0, 120) || '(cuerpo vacío)'}`,
    )
  }
}

function useCompromisos(query: string) {
  const [d, setD] = useState<Respuesta | null>(null)
  const [cargando, setCargando] = useState(true)

  const leer = useCallback(() => {
    setCargando(true)
    fetch(`/api/alertas/sla${query}`)
      .then(leeJson)
      .then((j) => setD(j as Respuesta))
      /* Una falla de red NO se pinta como «no hay nada»: se dice. Una cola
         vacía por error se lee igual que una cola vacía de verdad, y eso es
         justo lo que esta casa tiene prohibido colapsar. */
      .catch(e => setD({ error: String(e?.message ?? e) }))
      .finally(() => setCargando(false))
  }, [query])

  useEffect(() => { leer() }, [leer])
  return { d, cargando, recargar: leer }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 1 · EL BANNER
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * El banner de entrada: cuántas, de quién y cuánto dinero.
 *
 * NO se pinta en verde cuando hay una vencida, ni se oculta cuando no hay
 * ninguna: que no haya nada pendiente es información y se dice con palabras.
 * Lo único que no hace nunca es enseñar un cero cuando la tabla no se pudo
 * leer — ahí sale el aviso de que no se está midiendo.
 */
export function BannerSla({ superficie = 'clara', asesor }:
  { superficie?: Superficie; asesor?: string }) {
  const q = asesor ? `?asesor=${encodeURIComponent(asesor)}` : ''
  const { d, cargando } = useCompromisos(q)
  const t = tema(superficie)

  if (cargando) {
    return (
      <div style={caja(t)}>
        <span style={C(t.low, { fontSize: 12 })}>Leyendo los compromisos de atención…</span>
      </div>
    )
  }
  if (d?.error || d?.noMedible) {
    const tono = tonoSla('amarillo', superficie)
    return (
      <div style={{ ...caja(t), ...filoIzquierdo(tono.trazo, 4) }}>
        <span style={C(tono.texto, { fontSize: 12, fontWeight: 600 })}>
          <AlertTriangle size={13} style={{ display: 'inline', marginRight: 6 }} />
          No se está midiendo el vencimiento de las alertas
        </span>
        <div style={C(t.mid, { fontSize: 11.5, marginTop: 4, lineHeight: 1.6 })}>
          {d.noMedible ?? d.error}
        </div>
      </div>
    )
  }

  const r = d?.resumen
  if (!r) return null

  /* El nivel del banner es el PEOR que haya, no un promedio: una incumplida
     entre cuarenta en tiempo no es «casi todo bien».

     Y OJO CON `sobreRelleno` EN LAS LÍNEAS DE ABAJO: aquí SÍ es correcto,
     porque cuando el nivel es `rojo_intenso` el fondo de TODA la caja pasa a
     ser `tono.relleno` —el mismo contra el que ese tono está medido—. Sólo
     vale donde el relleno se pinta de verdad; ponerlo sobre una tarjeta blanca
     es blanco sobre blanco, y ese bug ya estuvo escrito tres pantallas más
     abajo. [[atlas-dashboard-contrast-architecture]] */
  const nivel: NivelSemaforo =
    r.incumplidas > 0 ? 'rojo_intenso'
    : r.vencidas > 0 ? 'rojo'
    : r.venceHoy > 0 ? 'naranja'
    : r.abiertas > 0 ? 'verde' : 'cerrada'
  const tono = tonoSla(nivel, superficie)
  const grave = nivel === 'rojo_intenso' || nivel === 'rojo'

  return (
    <div style={{
      /* El orden importa: el marco de los cuatro lados primero y el filo del
         semáforo DESPUÉS, para que el izquierdo acabe del color del nivel. */
      ...caja(t, nivel === 'rojo_intenso' ? (tono.relleno ?? t.borde) : t.borde),
      ...filoIzquierdo(tono.trazo, 4),
      ...(nivel === 'rojo_intenso' ? { background: tono.relleno ?? t.panel } : {}),
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={C(nivel === 'rojo_intenso' ? (tono.sobreRelleno ?? '#FFFFFF') : tono.texto,
                       { fontSize: 13, fontWeight: 700 })}>
          {r.abiertas === 0
            ? 'No tienes alertas pendientes de atender'
            : `${r.abiertas} ${r.abiertas === 1 ? 'alerta' : 'alertas'} que atender`}
        </span>
        {r.abiertas > 0 && (
          <span style={C(nivel === 'rojo_intenso' ? (tono.sobreRelleno ?? '#FFFFFF') : t.mid,
                         { fontSize: 12 })}>
            en {r.cuentas} {r.cuentas === 1 ? 'cuenta' : 'cuentas'} · {dinero(r.mrrEnRiesgo)} al mes
          </span>
        )}
      </div>

      {r.abiertas > 0 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Dato etq="incumplidas" n={r.incumplidas} nivel="rojo_intenso" superficie={superficie} t={t} />
          <Dato etq="vencidas" n={r.vencidas} nivel="rojo" superficie={superficie} t={t} />
          <Dato etq="vencen hoy" n={r.venceHoy} nivel="naranja" superficie={superficie} t={t} />
          <Dato etq="atendidas, por validar" n={r.atendidas} nivel="atendida" superficie={superficie} t={t} />
          <Dato etq="bloqueadas" n={r.bloqueadas} nivel="bloqueada" superficie={superficie} t={t} />
        </div>
      )}

      {grave && (
        <div style={C(nivel === 'rojo_intenso' ? (tono.sobreRelleno ?? '#FFFFFF') : t.mid,
                      { fontSize: 11.5, marginTop: 6, lineHeight: 1.6 })}>
          {dinero(r.mrrVencido)} al mes están en cuentas con el plazo ya vencido.
          La meta es {r.meta.enTiempoPct}% en tiempo y {r.meta.criticasVencidas} críticas vencidas.
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <Link href="/alertas" style={{ textDecoration: 'none' }}>
          <span style={C(nivel === 'rojo_intenso' ? (tono.sobreRelleno ?? '#FFFFFF') : tono.texto,
                         { fontSize: 11.5, fontWeight: 600 })}>
            Ver la cola de trabajo <ArrowRight size={12} style={{ display: 'inline' }} />
          </span>
        </Link>
      </div>
    </div>
  )
}

function Dato({ etq, n, nivel, superficie, t }: {
  etq: string; n: number; nivel: NivelSemaforo; superficie: Superficie
  t: ReturnType<typeof tema>
}) {
  /* UN CERO SÍ SE PINTA. «0 vencidas» es el dato que uno viene a buscar, y
     esconderlo deja la duda de si se midió. [[feedback-cero-sin-medicion]] */
  const tono = tonoSla(nivel, superficie)
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'baseline' }}>
      <span style={C(n > 0 ? tono.texto : t.low, { fontSize: 15, fontWeight: 700 })}>{n}</span>
      <span style={C(t.low, { fontSize: 10.5 })}>{etq}</span>
    </span>
  )
}

/**
 * El marco, lado por lado y SIN ATAJOS.
 *
 * ── POR QUÉ NO `border: '1px solid X'` ────────────────────────────────────
 *
 * Porque encima se le pone un `borderLeft` de color para el semáforo, y React
 * **se niega a mezclar un atajo con su versión por lado**: avisa en consola
 * «Removing borderLeft border» y, al repintar, QUITA el borde izquierdo. O sea
 * que el filete de color —que es el indicador gráfico del nivel— desaparecía en
 * cuanto el componente se volvía a renderizar: al filtrar por asesor, al
 * recargar la cola, al reprogramar. En la primera pintura se veía bien, así que
 * una captura lo daba por bueno.
 *
 * Salió del AVISO DE CONSOLA, no de mirar: el cambio es invisible hasta que algo
 * dispara el segundo render. Por eso se leen los mensajes, no sólo la pantalla.
 *
 * `borderColor` y `borderStyle` tampoco valen: son atajos de los cuatro lados y
 * chocan igual con `borderLeftColor`. Van los doce longhands.
 */
function marco(color: string, ancho = 1): React.CSSProperties {
  return {
    borderTopWidth: ancho, borderTopStyle: 'solid', borderTopColor: color,
    borderRightWidth: ancho, borderRightStyle: 'solid', borderRightColor: color,
    borderBottomWidth: ancho, borderBottomStyle: 'solid', borderBottomColor: color,
    borderLeftWidth: ancho, borderLeftStyle: 'solid', borderLeftColor: color,
  }
}

/** Sólo el lado izquierdo, para pintarlo del color del nivel. */
function filoIzquierdo(color: string, ancho: number): React.CSSProperties {
  return {
    borderLeftWidth: ancho, borderLeftStyle: 'solid', borderLeftColor: color,
  }
}

function caja(t: ReturnType<typeof tema>, color?: string): React.CSSProperties {
  return {
    background: t.panel,
    ...marco(color ?? t.borde),
    borderRadius: 12, padding: '12px 16px',
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 2 · LA COLA DE TRABAJO
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * La cola completa, en el orden que manda el encargo.
 *
 * EL ORDEN NO SE RECALCULA AQUÍ: lo trae la API con `ordenaCola()`. Reordenar
 * en el cliente sería una segunda implementación de la misma regla, y la que
 * decide sería la que alguien edite primero.
 */
export function ColaSla({ superficie = 'oscura', asesor, rol }:
  { superficie?: Superficie; asesor?: string; rol?: string }) {
  const q = asesor ? `?asesor=${encodeURIComponent(asesor)}` : ''
  const { d, cargando, recargar } = useCompromisos(q)
  const t = tema(superficie)

  if (cargando) {
    return <div style={caja(t)}>
      <span style={C(t.low, { fontSize: 12 })}>Leyendo la cola…</span>
    </div>
  }
  if (d?.error || d?.noMedible) {
    return <div style={caja(t)}>
      <span style={C(tonoSla('amarillo', superficie).texto, { fontSize: 12 })}>
        {d.noMedible ?? d.error}
      </span>
    </div>
  }

  const filas = d?.rows ?? []
  if (filas.length === 0) {
    return (
      <div style={caja(t)}>
        <span style={C(t.mid, { fontSize: 12.5 })}>
          Ninguna alerta con compromiso abierto.
        </span>
        {d?.configuracion && (
          <div style={C(t.low, { fontSize: 10.5, marginTop: 4 })}>
            {d.configuracion.condiciones} condiciones con plazo configurado ·{' '}
            {d.configuracion.diasInhabiles} días inhábiles cargados.
            {d.configuracion.falla && ` Falla: ${d.configuracion.falla}`}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {filas.map(f => (
        <RenglonSla key={f.id} f={f} superficie={superficie} rol={rol}
                    hecho={recargar} conCuenta />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 3 · EL BLOQUE DE LA FICHA
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Los compromisos de UNA cuenta, para la ficha.
 *
 * Enseña los abiertos y, debajo, el historial de los cerrados con su evidencia:
 * sin el historial, una cuenta que se atendió cuatro veces en el mes se ve igual
 * que una que nadie tocó.
 */
export function CompromisosDeCuenta({ cuentaId, superficie = 'clara', rol }:
  { cuentaId: string; superficie?: Superficie; rol?: string }) {
  const { d, cargando, recargar } =
    useCompromisos(`?cuenta=${encodeURIComponent(cuentaId)}&abiertas=0`)
  const t = tema(superficie)

  if (cargando) {
    return <div style={caja(t)}>
      <span style={C(t.low, { fontSize: 12 })}>Leyendo los compromisos de esta cuenta…</span>
    </div>
  }
  if (d?.error || d?.noMedible) {
    return (
      <div style={caja(t)}>
        <span style={C(tonoSla('amarillo', superficie).texto, { fontSize: 12, fontWeight: 600 })}>
          Alertas activas: no medible
        </span>
        <div style={C(t.mid, { fontSize: 11.5, marginTop: 4, lineHeight: 1.6 })}>
          {d.noMedible ?? d.error}
        </div>
      </div>
    )
  }

  const todas = d?.rows ?? []
  const abiertas = todas.filter(f => f.estado !== 'cerrada')
  const cerradas = todas.filter(f => f.estado === 'cerrada')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <span style={C(t.hi, { fontSize: 13, fontWeight: 700 })}>
          Alertas activas de esta cuenta
        </span>
        <span style={C(t.low, { fontSize: 11, marginLeft: 8 })}>
          {abiertas.length === 0
            ? 'ninguna abierta'
            : `${abiertas.length} abierta${abiertas.length === 1 ? '' : 's'}`}
          {cerradas.length > 0 && ` · ${cerradas.length} atendida${cerradas.length === 1 ? '' : 's'} y cerrada${cerradas.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {abiertas.length === 0 && (
        <div style={caja(t)}>
          <span style={C(t.mid, { fontSize: 12 })}>
            Esta cuenta no tiene alertas con compromiso de atención abierto. No es
            «sin riesgo»: es que hoy ninguna condición del catálogo está disparada.
          </span>
        </div>
      )}

      {abiertas.map(f => (
        <RenglonSla key={f.id} f={f} superficie={superficie} rol={rol} hecho={recargar} />
      ))}

      {cerradas.length > 0 && (
        <details style={{ marginTop: 2 }}>
          <summary style={{ cursor: 'pointer' }}>
            <span style={C(t.low, { fontSize: 11 })}>
              Historial: {cerradas.length} atención{cerradas.length === 1 ? '' : 'es'} cerrada{cerradas.length === 1 ? '' : 's'}, con su evidencia
            </span>
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {cerradas.map(f => {
              const tono = tonoSla('cerrada', superficie)
              return (
                <div key={f.id} style={{ ...caja(t), padding: '8px 12px' }}>
                  <span style={C(t.hi, { fontSize: 12, fontWeight: 600 })}>{f.titulo}</span>
                  <span style={C(tono.texto, { fontSize: 11, marginLeft: 8 })}>
                    {f.semaforo.enTiempo === null
                      ? 'cerrada'
                      : f.semaforo.enTiempo ? 'cerrada en tiempo' : 'cerrada fuera de plazo'}
                  </span>
                  <div style={C(t.low, { fontSize: 11, marginTop: 2, lineHeight: 1.6 })}>
                    Plazo {f.fecha_limite}
                    {f.fecha_atendida ? ` · atendida el ${f.fecha_atendida}` : ''}
                    {f.evidencia_tipo ? ` · evidencia: ${f.evidencia_tipo}` : ' · sin evidencia registrada'}
                  </div>
                  {f.evidencia_resumen && (
                    <div style={C(t.mid, { fontSize: 11, marginTop: 2, lineHeight: 1.6 })}>
                      {f.evidencia_resumen}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 4 · EL TABLERO DE CUMPLIMIENTO
 * ═══════════════════════════════════════════════════════════════════════════ */

interface Cumplimiento {
  asesor: string | null
  periodo: { desde: string | null; hasta: string | null; que: string }
  universo: { total: number; abiertas: number; cerradas: number
              atendidas: number; cuentas: number }
  cumplimiento: {
    enTiempo: { parte: number; de: number; pct: number | null }
    meta: number; cumpleMeta: boolean | null; tarde: number
    retrasoMedioDiasHabiles: number | null
    retrasoMaximoDiasHabiles: number | null
  }
  vencidasHoy: { cuantas: number; criticas: number; metaCriticas: number
                 cumpleMeta: boolean; mrr: number }
  reprogramaciones: { alertas: number; total: number; deDos: number }
  sinRespuesta: { alertas: number; intentos: number; escaladas: number }
  evidenciaRechazada:
    | { medible: true; rechazos: number; alertas: number }
    | { medible: false; porque: string }
  resueltasSinIntervencion: { parte: number; de: number; pct: number | null; que: string }
  porAsesor: Record<string, { total: number; atendidas: number; enTiempo: number
                              vencidas: number; criticasVencidas: number
                              enTiempoPct: number | null }>
  porCondicion: Record<string, { total: number; atendidas: number
                                 enTiempo: number; vencidas: number
                                 enTiempoPct: number | null }>
  noMedible?: string
  error?: string
  vacio?: boolean
}

/**
 * El cumplimiento, con sus denominadores.
 *
 * NINGÚN PORCENTAJE SE PINTA SOLO: va con «de N», siempre. Un «100% en tiempo»
 * sobre dos alertas y sobre doscientas no es la misma frase, y este tablero ya
 * publicó una vez un «24.7% acumulado» que era una suma de tasas.
 * [[churn-nivel-cuenta]]
 */
export function PanelCumplimiento({ superficie = 'oscura', asesor, verAsesores }:
  { superficie?: Superficie; asesor?: string; verAsesores?: boolean }) {
  const [d, setD] = useState<Cumplimiento | null>(null)
  const [cargando, setCargando] = useState(true)
  const t = tema(superficie)

  useEffect(() => {
    const q = asesor ? `?asesor=${encodeURIComponent(asesor)}` : ''
    fetch(`/api/alertas/sla/metricas${q}`)
      .then(leeJson)
      /* Por `unknown`: `leeJson` promete un objeto sin forma —es lo honesto,
         no ha validado nada— y TypeScript no deja saltar de ahí a `Cumplimiento`
         de un paso. El cast dice «confío en la ruta», que es justo lo que es. */
      .then(j => setD(j as unknown as Cumplimiento))
      .catch(e => setD({ error: String(e?.message ?? e) } as Cumplimiento))
      .finally(() => setCargando(false))
  }, [asesor])

  if (cargando) {
    return <div style={caja(t)}>
      <span style={C(t.low, { fontSize: 12 })}>Calculando el cumplimiento…</span>
    </div>
  }
  if (!d || d.error || d.noMedible || d.vacio) {
    return (
      <div style={caja(t)}>
        <span style={C(tonoSla('amarillo', superficie).texto, { fontSize: 12 })}>
          {d?.noMedible ?? d?.error
           ?? 'No hay cartera que medir con este filtro.'}
        </span>
      </div>
    )
  }

  const cum = d.cumplimiento
  const nivelMeta: NivelSemaforo =
    cum.cumpleMeta === null ? 'bloqueada' : cum.cumpleMeta ? 'verde' : 'rojo'
  const nivelCriticas: NivelSemaforo =
    d.vencidasHoy.cumpleMeta ? 'verde' : 'rojo_intenso'

  return (
    <div style={{ ...caja(t), display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <span style={C(t.hi, { fontSize: 13, fontWeight: 700 })}>
          Cumplimiento{d.asesor ? ` · ${d.asesor}` : ' · toda la cartera'}
        </span>
        {/* EL PERIODO SE DICE. Sin esta línea, un cumplimiento histórico se lee
            como el del mes y nadie puede notar la diferencia. */}
        <div style={C(t.low, { fontSize: 10.5, marginTop: 2 })}>{d.periodo.que}</div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Metrica t={t} etq="atendidas en tiempo" nivel={nivelMeta} superficie={superficie}
          valor={cum.enTiempo.pct === null ? 'sin medición' : `${cum.enTiempo.pct}%`}
          detalle={`${cum.enTiempo.parte} de ${cum.enTiempo.de} atendidas · meta ${cum.meta}%`} />
        <Metrica t={t} etq="críticas vencidas hoy" nivel={nivelCriticas} superficie={superficie}
          valor={String(d.vencidasHoy.criticas)}
          detalle={`meta ${d.vencidasHoy.metaCriticas} · ${d.vencidasHoy.cuantas} vencidas en total · ${dinero(d.vencidasHoy.mrr)}`} />
        <Metrica t={t} etq="retraso medio" nivel="naranja" superficie={superficie}
          valor={cum.retrasoMedioDiasHabiles === null
            ? 'ninguna tarde'
            : `${cum.retrasoMedioDiasHabiles} d`}
          detalle={cum.tarde === 0
            ? 'ninguna atendida fuera de plazo'
            : `${cum.tarde} fuera de plazo · peor caso ${cum.retrasoMaximoDiasHabiles} días hábiles`} />
        <Metrica t={t} etq="reprogramadas" nivel="amarillo" superficie={superficie}
          valor={String(d.reprogramaciones.alertas)}
          detalle={`${d.reprogramaciones.total} movimientos · ${d.reprogramaciones.deDos} agotaron las dos`} />
        <Metrica t={t} etq="sin respuesta" nivel="naranja" superficie={superficie}
          valor={String(d.sinRespuesta.alertas)}
          detalle={`${d.sinRespuesta.intentos} intentos · ${d.sinRespuesta.escaladas} escaladas al líder`} />
        <Metrica t={t} etq="evidencia devuelta" nivel="rojo" superficie={superficie}
          valor={d.evidenciaRechazada.medible
            ? String(d.evidenciaRechazada.alertas) : 'no medible'}
          detalle={d.evidenciaRechazada.medible
            ? `${d.evidenciaRechazada.rechazos} rechazos en la bitácora`
            : d.evidenciaRechazada.porque} />
      </div>

      {/* ── LA MÉTRICA QUE ACUSA AL TABLERO, con su frase pegada ────────── */}
      <div style={{ paddingTop: 8, borderTop: `1px solid ${t.borde}` }}>
        <span style={C(t.hi, { fontSize: 12, fontWeight: 600 })}>
          Resueltas sin que nadie interviniera:{' '}
          {d.resueltasSinIntervencion.pct === null
            ? 'sin cerradas que medir'
            : `${d.resueltasSinIntervencion.pct}% (${d.resueltasSinIntervencion.parte} de ${d.resueltasSinIntervencion.de} cerradas)`}
        </span>
        <div style={C(t.mid, { fontSize: 11, marginTop: 3, lineHeight: 1.6 })}>
          {d.resueltasSinIntervencion.que}
        </div>
      </div>

      {/* ── El desglose por persona, sólo para quien ve más de una cartera ─ */}
      {verAsesores && Object.keys(d.porAsesor).length > 1 && (
        <div style={{ paddingTop: 8, borderTop: `1px solid ${t.borde}` }}>
          <span style={C(t.low, { fontSize: 10, fontWeight: 700, letterSpacing: 0.4 })}>
            POR EJECUTIVO
          </span>
          {Object.entries(d.porAsesor).map(([nombre, v]) => (
            <div key={nombre} style={{ marginTop: 3 }}>
              <span style={C(t.hi, { fontSize: 11.5, fontWeight: 600 })}>
                {nombre || 'sin asesor'}
              </span>
              <span style={C(t.mid, { fontSize: 11 })}>
                {' '}· {v.enTiempoPct === null
                  ? 'sin atendidas que medir'
                  : `${v.enTiempoPct}% en tiempo (${v.enTiempo} de ${v.atendidas})`}
                {' '}· {v.total} compromisos
              </span>
              {v.vencidas > 0 && (
                <span style={C(tonoSla(v.criticasVencidas > 0 ? 'rojo_intenso' : 'rojo',
                                       superficie).texto, { fontSize: 11 })}>
                  {' '}· {v.vencidas} vencidas
                  {v.criticasVencidas > 0 && `, ${v.criticasVencidas} críticas`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Y por condición: dónde se incumple, que no es lo mismo que quién ─ */}
      {Object.keys(d.porCondicion).length > 0 && (
        <div style={{ paddingTop: 8, borderTop: `1px solid ${t.borde}` }}>
          <span style={C(t.low, { fontSize: 10, fontWeight: 700, letterSpacing: 0.4 })}>
            POR CONDICIÓN
          </span>
          {Object.entries(d.porCondicion).map(([cond, v]) => (
            <div key={cond} style={{ marginTop: 3 }}>
              <span style={C(t.hi, { fontSize: 11.5 })}>{cond}</span>
              <span style={C(t.mid, { fontSize: 11 })}>
                {' '}· {v.total} compromisos · {v.enTiempoPct === null
                  ? 'ninguna atendida'
                  : `${v.enTiempoPct}% en tiempo`}
                {v.vencidas > 0 && ` · ${v.vencidas} vencidas hoy`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Metrica({ etq, valor, detalle, nivel, superficie, t }: {
  etq: string; valor: string; detalle: string; nivel: NivelSemaforo
  superficie: Superficie; t: ReturnType<typeof tema>
}) {
  const tono = tonoSla(nivel, superficie)
  return (
    <div style={{ minWidth: 170, flex: '1 1 170px' }}>
      <div style={C(tono.texto, { fontSize: 18, fontWeight: 700 })}>{valor}</div>
      <div style={C(t.hi, { fontSize: 11, fontWeight: 600 })}>{etq}</div>
      {/* EL DENOMINADOR, siempre. Nunca un porcentaje a secas. */}
      <div style={C(t.low, { fontSize: 10.5, lineHeight: 1.5 })}>{detalle}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * EL RENGLÓN
 * ═══════════════════════════════════════════════════════════════════════════ */

function RenglonSla({ f, superficie, rol, hecho, conCuenta }: {
  f: FilaSla; superficie: Superficie; rol?: string
  hecho: () => void; conCuenta?: boolean
}) {
  const t = tema(superficie)
  const tono = tonoSla(f.semaforo.nivel, superficie)
  const intenso = f.semaforo.nivel === 'rojo_intenso'
  const [abierto, setAbierto] = useState(false)

  return (
    <div style={{
      background: t.panel,
      /* Marco por lados y DESPUES el filo del semaforo. Mezclar `border` con
         `borderLeft` hace que React quite el segundo al repintar. */
      ...marco(intenso ? (tono.relleno ?? t.borde) : t.borde),
      ...filoIzquierdo(tono.trazo, intenso ? 6 : 3),
      borderRadius: 12, padding: '12px 16px',
      /* Una INCUMPLIDA se marca también con el aro, no sólo con el color: un
         borde grueso se ve en escala de grises y en una captura comprimida. */
      boxShadow: intenso ? `0 0 0 2px ${tono.trazo}55` : 'none',
    }}>
      {/* ── La pastilla del semáforo, SIEMPRE con palabras ─────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          {conCuenta && (
            <Link href={`/cuentas/${f.cuenta_id}`} style={{ textDecoration: 'none' }}>
              <span style={C(t.hi, { fontSize: 13.5, fontWeight: 700 })}>
                {f.empresa ?? 'cuenta sin nombre'}
              </span>
            </Link>
          )}
          <span style={C(t.low, { fontSize: 11, marginLeft: conCuenta ? 8 : 0 })}>
            {f.consecutivo ? `${f.consecutivo} · ` : ''}
            {f.dueno || 'sin asesor'} · {dinero(f.mrr)} al mes
          </span>
          <div style={C(t.hi, { fontSize: 12.5, fontWeight: 600, marginTop: 2 })}>
            {f.titulo}
          </div>
        </div>

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          background: intenso ? (tono.relleno ?? 'transparent') : tono.tinte,
          border: `1px solid ${tono.trazo}`,
        }}>
          {intenso && <Pin size={11} style={{ color: tono.sobreRelleno ?? '#FFFFFF' }} />}
          <span style={C(intenso ? (tono.sobreRelleno ?? '#FFFFFF') : tono.texto,
                         { fontSize: 11, fontWeight: 700, letterSpacing: 0.3 })}>
            {f.etiquetaNivel}
          </span>
        </span>
      </div>

      {/* ── CUÁNDO. En días hábiles y con la fecha, nunca sólo el color ── */}
      <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center',
                    flexWrap: 'wrap' }}>
        <CalendarClock size={12} style={{ color: tono.trazo, flexShrink: 0 }} />
        {/* `tono.texto` SIEMPRE, también cuando es INCUMPLIDA.
            Aquí decía `intenso ? tono.sobreRelleno : tono.texto` y era blanco
            sobre la tarjeta BLANCA de la ficha: la línea con la fecha de
            vencimiento —la más importante del renglón— sólo se leía
            seleccionándola. `sobreRelleno` está medido contra el RELLENO ROJO y
            sólo vale donde ese relleno se pinta: la pastilla, el banner
            completo y el contador del menú. Esta línea va sobre la tarjeta.

            Es la Variante B de [[atlas-dashboard-contrast-architecture]]: un
            color cuyo valor sólo es correcto cuando algo más le pone el fondo
            debajo. No lo cazó ningún detector ni el compilador — lo cazó
            MIRAR la reproducción estática (`scripts/repro-tonos-sla.mjs`), que
            es el método que ha cerrado todas las rondas de este bug. */}
        <span style={C(tono.texto, { fontSize: 11.5, fontWeight: 600 })}>
          {f.semaforo.etiqueta}
        </span>
        <span style={C(t.low, { fontSize: 11 })}>
          · severidad {f.severidad}
          {f.severidad !== f.severidad_base && ` (subió de ${f.severidad_base})`}
          {f.ajustes && f.ajustes.length > 0 && `: ${f.ajustes.join('; ')}`}
        </span>
      </div>

      {/* ── LA ACCIÓN. Verbo, objetivo, fecha y con qué se cierra ──────── */}
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <ArrowRight size={14} style={{ color: tono.trazo, flexShrink: 0, marginTop: 3 }} />
        <div>
          <div style={C(t.hi, { fontSize: 12.5, fontWeight: 600, lineHeight: 1.6 })}>
            {f.accion_sugerida}
          </div>
          {/* LAS DOS FRASES VAN JUNTAS. Separarlas es lo que hace creer que
              registrar un seguimiento apaga la alerta. */}
          <div style={C(t.mid, { fontSize: 11, marginTop: 4, lineHeight: 1.6 })}>
            {f.cierraAtencion}
          </div>
          <div style={C(tonoSla('amarillo', superficie).texto,
                        { fontSize: 11, marginTop: 2, lineHeight: 1.6 })}>
            {f.noApagaLaAlerta}
          </div>
        </div>
      </div>

      {/* ── POR QUÉ SE GENERÓ: 2-3 señales, todas del episodio ─────────── */}
      {f.porque.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <span style={C(t.low, { fontSize: 10, fontWeight: 700, letterSpacing: 0.4 })}>
            POR QUÉ ESTÁ ABIERTA
          </span>
          {f.porque.map((p, i) => (
            <div key={i} style={C(t.mid, { fontSize: 11, marginTop: 2, lineHeight: 1.6 })}>
              · {p}
            </div>
          ))}
        </div>
      )}

      {/* ── Los reintentos y las reprogramaciones, dichas ──────────────── */}
      {(f.intentos_sin_respuesta > 0 || f.reprogramaciones > 0) && (
        <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {f.intentos_sin_respuesta > 0 && (
            <span style={C(tonoSla('naranja', superficie).texto, { fontSize: 11 })}>
              <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
              {f.intentos_sin_respuesta} intento{f.intentos_sin_respuesta === 1 ? '' : 's'} sin
              respuesta{f.reintento_limite ? ` · reintento el ${f.reintento_limite}` : ''}
            </span>
          )}
          {f.reprogramaciones > 0 && (
            <span style={C(t.low, { fontSize: 11 })}>
              Reprogramada {f.reprogramaciones} de 2
              {f.limite_original && ` (el plazo original era el ${f.limite_original})`}
              {f.motivo_reprogramacion && `: ${f.motivo_reprogramacion}`}
            </span>
          )}
          {f.nivel_escalamiento > 0 && (
            <span style={C(tonoSla('rojo', superficie).texto, { fontSize: 11 })}>
              Escalada nivel {f.nivel_escalamiento}: {f.escalamiento.porque}
            </span>
          )}
        </div>
      )}

      {/* ── LO QUE SE PUEDE HACER DESDE AQUÍ, y sólo eso ───────────────── */}
      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap',
                    alignItems: 'center' }}>
        <Link href={f.enlace} style={{ textDecoration: 'none' }}>
          <span style={C(t.hi, { fontSize: 11, fontWeight: 600, padding: '4px 10px',
                                 borderRadius: 8, border: `1px solid ${t.borde}` })}>
            Abrir la cuenta y registrar la evidencia
          </span>
        </Link>
        {f.estado !== 'cerrada' && (
          <button onClick={() => setAbierto(a => !a)}
                  style={{ background: 'transparent', border: `1px solid ${t.borde}`,
                           borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                           color: t.mid, fontSize: 11 }}>
            {abierto ? 'Cerrar' : 'Reprogramar'}
          </button>
        )}
        {rol === 'admin' && f.estado === 'atendida_pendiente_validacion' && (
          <Validacion sla={f} t={t} superficie={superficie} hecho={hecho} />
        )}
      </div>

      {abierto && <Reprogramar sla={f} t={t} superficie={superficie}
                               hecho={() => { setAbierto(false); hecho() }} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * REPROGRAMAR — y por qué el formulario no decide nada
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El mínimo del motivo, el tope de dos y los días que se suman los decide el
 * SERVIDOR (`reprograma()` en `lib/alertas-sla.ts`, con sus parámetros en
 * `sla_parametros`). Aquí sólo se avisa antes de mandar, para no hacerle perder
 * el viaje a quien captura. Si esta cuenta de caracteres y la del servidor se
 * separan, la que manda es la del servidor — y eso es lo correcto.
 */
function Reprogramar({ sla, t, superficie, hecho }: {
  sla: FilaSla; t: ReturnType<typeof tema>; superficie: Superficie; hecho: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [falla, setFalla] = useState<string | null>(null)
  const corto = motivo.trim().length < 20

  async function manda() {
    setEnviando(true); setFalla(null)
    try {
      const r = await fetch(`/api/alertas/sla/${sla.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'reprogramar', motivo }),
      })
      const j = await leeJson(r)
      if (!r.ok) { setFalla(String(j?.mensaje ?? j?.error ?? `HTTP ${r.status}`)); return }
      hecho()
    } catch (e) {
      setFalla(String((e as Error)?.message ?? e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${t.borde}` }}>
      <div style={C(t.mid, { fontSize: 11, lineHeight: 1.6 })}>
        La fecha se mueve dos días hábiles desde el plazo ACTUAL ({sla.fecha_limite}),
        no desde hoy: contarlo desde hoy daría más margen a una alerta vencida que a
        una al día. Queda en la bitácora y cuenta en tus métricas.
        {sla.reprogramaciones >= 1 && ' Ya usaste una: la siguiente la autoriza administración.'}
      </div>
      <textarea
        className="cp-light"
        value={motivo}
        onChange={e => setMotivo(e.target.value)}
        placeholder="Por qué hace falta mover la fecha (mínimo 20 caracteres)"
        rows={2}
        style={{ width: '100%', marginTop: 6, fontSize: 12, padding: 8,
                 borderRadius: 8, border: `1px solid ${t.borde}`,
                 background: '#FFFFFF', color: '#0F172A' }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
        <button onClick={manda} disabled={corto || enviando}
                style={{ background: 'transparent',
                         border: `1px solid ${tonoSla('naranja', superficie).trazo}`,
                         borderRadius: 8, padding: '4px 12px', fontSize: 11,
                         cursor: corto || enviando ? 'not-allowed' : 'pointer',
                         opacity: corto || enviando ? 0.5 : 1,
                         color: tonoSla('naranja', superficie).texto }}>
          {enviando ? 'Guardando…' : 'Mover la fecha'}
        </button>
        <span style={C(t.low, { fontSize: 10.5 })}>
          {motivo.trim().length}/20 caracteres
        </span>
      </div>
      {falla && (
        <div style={C(tonoSla('rojo', superficie).texto,
                      { fontSize: 11, marginTop: 6, lineHeight: 1.6 })}>
          {falla}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * VALIDAR O RECHAZAR — sólo administración
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El botón sólo se pinta para `admin`, y eso NO es el control: el control está
 * en la API, que devuelve 403 a cualquier otro rol. Un botón escondido es una
 * cortesía; la regla vive en el servidor. [[auditoria-acceso-oct2026]]
 */
function Validacion({ sla, t, superficie, hecho }: {
  sla: FilaSla; t: ReturnType<typeof tema>; superficie: Superficie; hecho: () => void
}) {
  const [modo, setModo] = useState<null | 'rechazar'>(null)
  const [motivo, setMotivo] = useState('')
  const [falla, setFalla] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function manda(accion: 'validar' | 'rechazar') {
    setEnviando(true); setFalla(null)
    try {
      const r = await fetch(`/api/alertas/sla/${sla.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion, motivo }),
      })
      const j = await leeJson(r)
      if (!r.ok) { setFalla(String(j?.mensaje ?? j?.error ?? `HTTP ${r.status}`)); return }
      hecho()
    } catch (e) {
      setFalla(String((e as Error)?.message ?? e))
    } finally { setEnviando(false) }
  }

  const verde = tonoSla('verde', superficie)
  const rojo = tonoSla('rojo', superficie)

  if (modo === 'rechazar') {
    return (
      <div style={{ flexBasis: '100%', marginTop: 6 }}>
        <textarea
          className="cp-light"
          value={motivo} onChange={e => setMotivo(e.target.value)}
          rows={2}
          placeholder="Qué falta en la evidencia (mínimo 20 caracteres). La fecha límite NO se reinicia."
          style={{ width: '100%', fontSize: 12, padding: 8, borderRadius: 8,
                   border: `1px solid ${t.borde}`, background: '#FFFFFF', color: '#0F172A' }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button onClick={() => manda('rechazar')}
                  disabled={motivo.trim().length < 20 || enviando}
                  style={botonito(rojo.texto, rojo.trazo,
                                  motivo.trim().length < 20 || enviando)}>
            Devolver al ejecutivo
          </button>
          <button onClick={() => setModo(null)}
                  style={botonito(t.mid, t.borde, false)}>Cancelar</button>
        </div>
        {falla && (
          <div style={C(rojo.texto, { fontSize: 11, marginTop: 6 })}>{falla}</div>
        )}
      </div>
    )
  }

  return (
    <>
      <button onClick={() => manda('validar')} disabled={enviando}
              style={botonito(verde.texto, verde.trazo, enviando)}>
        Validar la evidencia
      </button>
      <button onClick={() => setModo('rechazar')}
              style={botonito(rojo.texto, rojo.trazo, false)}>
        Devolver
      </button>
      {falla && <span style={C(rojo.texto, { fontSize: 11 })}>{falla}</span>}
    </>
  )
}

function botonito(color: string, borde: string, inerte: boolean): React.CSSProperties {
  return {
    background: 'transparent', border: `1px solid ${borde}`, borderRadius: 8,
    padding: '4px 12px', fontSize: 11, color,
    cursor: inerte ? 'not-allowed' : 'pointer', opacity: inerte ? 0.5 : 1,
  }
}
