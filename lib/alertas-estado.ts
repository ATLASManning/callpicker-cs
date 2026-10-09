import { supabaseAdmin } from '@/lib/supabase'
import { detectarAlertas } from '@/lib/alertas-detectar'
import { mapaFacturacion, importeDeCuenta, topDeCartera } from '@/lib/facturacion-cuenta'
import { ultimoContactoEfectivoPorCuenta, diasSinContacto } from '@/lib/contacto-cuenta'
import { todosLosCortes } from '@/lib/cortes-cuenta'
import { resumenLlamadas } from '@/lib/llamadas-resumen'
import { ticketStatsCuenta } from '@/lib/tickets-cuenta'
import { relacionamientoDeCuentas } from '@/lib/relacionamiento'
import { candidatosDeCartera } from '@/lib/candidatos-cartera'
import { veredictoDe, type EstadoCuenta, type Veredicto } from '@/lib/alertas-veredicto'
import type { Alerta } from '@/lib/alertas'

/**
 * lib/alertas-estado.ts — TODO LO QUE SE SABE DE UNA CUENTA, EN UN SOLO SITIO
 *
 * ALERTAS deja de ser «las cuentas que dispararon algo» y pasa a ser el objetivo
 * de trabajo de SAC: el asesor abre Alertas de Cliente y eso ES su semana.
 * Instrucción de dirección, 7 oct 2026 — «debemos ser más eficientes con la
 * herramienta, la cual debe estar como objetivo de trabajo para SAC».
 *
 * Y la regla que gobierna el alcance, también suya: «en la medida que más
 * información tengas mayor es tu predicción; lo que haga falta deberás
 * solicitarlo al asesor o marcarlo en el apartado».
 *
 * ── LAS OCHO FUENTES ───────────────────────────────────────────────────────
 *
 *   facturación   `facturacion-cuenta`    MRR oficial, GRC por CID
 *   consumo       `cortes-cuenta`         minutos y % del plan, ya recalculado
 *   llamadas      `llamadas-resumen`      entrantes, perdidas, atendidas
 *   tickets       `tickets-cuenta`        total, fallas, último — sólo cerrados
 *   relación      `relacionamiento`       reuniones, contactos, actividades SAC
 *                                         y si la cuenta tiene auditoría
 *   contacto      `contacto-cuenta`       días desde que se habló, canal real
 *   riesgos       `alertas-detectar`      los 18 tipos
 *   ficha         `cuentas`               plan, giro, observaciones, NPS
 *
 * NINGUNA se reproduce: se leen de donde ya viven. Dos cifras de la misma cosa
 * es lo que dirección prohibió, y aquí habría ocho oportunidades de romperlo.
 *
 * Lo que una cuenta NO tiene se marca y se pide. Un dato ausente no es un cero:
 * es una petición con dueño. Ver [[feedback-cero-sin-medicion]].
 */

/** Cuántos CIDs tiene que traer el panel de cortes para creerle.
 *  Hay 146 cuentas vivas con corte; un mapa de un puñado significa que el .xlsx
 *  no viajó con esta lambda, no que nadie consuma. */
const CORTES_MINIMOS = 70

/**
 * Los tipos de candidatura que son CRECIMIENTO. Los otros dos no lo son.
 *
 * `evaluarCandidato` devuelve las candidaturas ordenadas con lo que hay que
 * RESOLVER delante —`estabilizar` cuando hay un ticket abierto, `reactivacion`
 * cuando la cuenta no usa lo que paga— y el crecimiento detrás. Así que tomar
 * `candidaturas[0]` habría puesto «Estabilizar primero» como acción de una
 * situación que se llama Oportunidad y se pinta en verde: la cuenta con el
 * problema abierto saldría del tablero clasificada como la que va bien.
 *
 * Esos dos casos no se pierden: la cuenta que necesita estabilizarse ya trae
 * sus alertas de riesgo, y el veredicto se encarga de que no salga en verde.
 *
 * ESTE PÁRRAFO DECÍA OTRA COSA, Y ERA FALSO. Decía que «el veredicto la
 * resuelve mucho antes de llegar aquí —`se_va`, `apagandose`— o la manda a su
 * auditoría», y el código no lo cumplía: sus compuertas sólo miraban la salida
 * declarada, el consumo en cero y el silencio de noventa días, no las once
 * familias de riesgo del catálogo. Por eso VAEO salió en verde con dos alertas
 * críticas. Lo que lo cumple ahora es `riesgoVivo` en `alertas-veredicto.ts`,
 * que pregunta al catálogo en vez de a un umbral escrito aparte.
 *
 * Y ojo con la otra mitad: `evaluarCandidato` AGREGA la candidatura de
 * `estabilizar` sin suprimir las de crecimiento, así que filtrar por
 * CRECIMIENTO no basta por sí solo para saber que la casa está en orden. Hace
 * falta lo de arriba.
 */
const CRECIMIENTO = new Set(['escalon', 'cross_sell', 'ampliacion', 'blindaje'])

/** Las ocho fuentes, con el nombre que ve quien lee el tablero y a quién se le
 *  pide lo que falta. El orden es el del comentario de cabecera de este archivo
 *  y es el que usa la pantalla: una lista de fuentes escrita dos veces se
 *  desincroniza. */
export const FUENTES = [
  { k: 'facturacion', etiqueta: 'Facturación', pedirA: 'ya viene de GRC; si falta, es que el CID no cruza' },
  { k: 'consumo',     etiqueta: 'Consumo',     pedirA: 'Ingeniería — que incluya el CID en el archivo de cortes' },
  { k: 'llamadas',    etiqueta: 'Llamadas',    pedirA: 'el asesor — el Excel de entrantes y salientes' },
  { k: 'tickets',     etiqueta: 'Tickets',     pedirA: 'la mesa de ayuda; o la cuenta no pasa por ella' },
  { k: 'reuniones',   etiqueta: 'Reuniones',   pedirA: 'el asesor — registrar la junta cuando ocurre' },
  { k: 'contacto',    etiqueta: 'Contacto',    pedirA: 'el asesor — registrar llamada, correo, WhatsApp o reunión' },
  { k: 'auditoria',   etiqueta: 'Auditoría',   pedirA: 'el asesor — escribir el análisis de la cuenta' },
  { k: 'ficha',       etiqueta: 'Ficha',       pedirA: 'el asesor — las observaciones del KAM' },
] as const

export type ClaveFuente = typeof FUENTES[number]['k']
export type FuentesDetalle = Record<ClaveFuente, boolean>

export interface CuentaConVeredicto {
  cuentaId: string
  cid: string | null
  empresa: string
  asesor: string | null
  mrr: number | null
  esTop: boolean
  veredicto: Veredicto
  /** Lo medido, para que la ficha no vuelva a calcularlo ni a pedirlo. */
  datos: {
    consumoPct: number | null
    diasSinContacto: number | null
    entrantes: number | null
    perdidas: number | null
    pctPerdidas: number | null
    tickets: number | null
    fallas: number | null
    ultimoTicket: string | null
    reuniones: number
    contactos: number
    actividadesCerradas: number
    relacionPct: number
    relacionNivel: string
    tieneAuditoria: boolean
    plan: string | null
    /** A qué es candidata, si a algo de crecer. `null` = a nada hoy. */
    candidatura: string | null
    /** Cuántas candidaturas tiene en total, incluidas las de resolver primero.
     *  Se publica para que una cuenta con candidatura de `estabilizar` no
     *  parezca «sin oportunidad»: la tiene, pero antes hay que arreglar algo. */
    candidaturasTotal: number
    /** Cuántas de las ocho fuentes tienen dato para esta cuenta. Es la
     *  confianza de la predicción, dicha en números y no en adjetivos.
     *  Se DERIVA de `fuentesDetalle`: no son dos cuentas distintas. */
    fuentes: number
    /** Cuáles de las ocho, para poder decir qué falta y a quién pedírselo. */
    fuentesDetalle: FuentesDetalle
  }
}

export interface MapaVeredictos {
  cuentas: CuentaConVeredicto[]
  falla: string | null
}

export async function veredictosDeCartera(
  filtro?: { asesor?: string; cuentaId?: string },
): Promise<MapaVeredictos> {
  const fallos: string[] = []

  /* Las seis columnas de la última línea entran el 8 oct 2026 para la
     CANDIDATURA: `candidatosDeCartera` necesita antigüedad, oficinas, salud y
     los datos de contacto para contar las señales de la ficha. Sin ellas el
     evaluador las leería como ausentes y bajaría la certeza de todas las
     cuentas por una carencia que es mía, no suya.

     `dias_sin_contacto` NO se pide aquí, aunque la candidatura lo use: no es
     columna de la tabla, es un campo que `getCuentas` calcula y pega en la
     fila. Pedírselo a PostgREST habría hecho fallar el select COMPLETO y con
     él la pantalla entera. Aquí ya se resuelve abajo con `efectivo`, que es la
     misma definición única de `lib/contacto-cuenta.ts`. */
  let q = supabaseAdmin.from('cuentas')
    .select('id, cid, empresa, asesor, estado, facturacion, consecutivo, giro, '
          + 'nps_score, observaciones_kam, notas, contactos_json, ultimo_contacto, '
          + 'activo_desde, num_oficinas, health_score, '
          + 'contacto_nombre, contacto_tel, contacto_email')
    .in('estado', ['activo', 'en_riesgo'])
  if (filtro?.asesor) q = q.eq('asesor', filtro.asesor)
  /* El filtro de UNA cuenta, para la ficha. Se pasa también al detector, que
     es quien de verdad cuesta: sin eso la ficha calcularía las 192 alertas
     para quedarse con las de una. El filtro de asesor SIGUE aplicándose
     encima, así que un asesor que teclee el id de una cuenta ajena recibe
     vacío — la regla de fallar cerrado no se relaja por abrir una ficha. */
  if (filtro?.cuentaId) q = q.eq('id', filtro.cuentaId)
  const { data: cuentas, error } = await q

  if (error || !cuentas) {
    return { cuentas: [], falla: `No se pudieron leer las cuentas: ${error?.message ?? 'sin filas'}` }
  }

  const [mapa, efectivo, cortes, alertas, relacion] = await Promise.all([
    mapaFacturacion(),
    ultimoContactoEfectivoPorCuenta(),
    todosLosCortes(),
    detectarAlertas(filtro?.asesor || filtro?.cuentaId
      ? { asesor: filtro.asesor, cuentaId: filtro.cuentaId } : undefined),
    /* Trae en UNA pasada reuniones, contactos, actividades SAC cerradas y si la
       cuenta tiene auditoría. Lo último por `consecutivo`, que es más fiable que
       cruzar el nombre de la empresa contra el título de un documento — es lo
       que yo hacía y mezclaba cuentas parecidas. */
    relacionamientoDeCuentas(cuentas.map(c => ({
      cuentaId: String(c.id),
      consecutivo: c.consecutivo ?? null,
      ultimoContacto: c.ultimo_contacto ?? null,
      contactosJson: c.contactos_json ?? null,
      observacionesKam: c.observaciones_kam ?? null,
      notas: c.notas ?? null,
    }))),
  ])
  if (mapa.falla) fallos.push(`facturación: ${mapa.falla}`)

  /* Las TOP de la EMPRESA, no las del filtro. Va después del `Promise.all`
     porque necesita el mapa de facturación ya resuelto, y hace su propia
     consulta justamente para no heredar el filtro de asesor: ver
     `topDeCartera`. Hasta hoy este campo entraba escrito a mano como `false`
     en las 192, así que nada aguas abajo podía distinguir una cuenta grande. */
  const top = await topDeCartera(mapa)

  const cortesFiables = cortes.size >= CORTES_MINIMOS
  if (!cortesFiables) {
    fallos.push(`cortes: la fuente devolvió ${cortes.size} CID(s), menos de los `
              + `${CORTES_MINIMOS} mínimos. El consumo sale como no medido, que es `
              + `la verdad, pero el motivo es la fuente y no las cuentas.`)
  }

  /* ── LA CANDIDATURA, de la misma derivación que la portada ───────────────
   *
   * Va DESPUÉS del `Promise.all` y no dentro porque necesita
   * `dias_sin_contacto`, que no es columna: lo calcula `efectivo`, que se
   * resuelve ahí arriba. Las cuatro fuentes que lee por debajo —cortes,
   * llamadas, DIDs, adopción— cachean por módulo, así que esto no vuelve a
   * leer ningún archivo que la detección ya haya abierto.
   *
   * El campo se llena de verdad por primera vez: hasta hoy entraba como `null`
   * a mano y la situación `oportunidad` del veredicto era inalcanzable. */
  const candidatos = await candidatosDeCartera(cuentas.map(c => ({
    id: String(c.id),
    cid: c.cid === null || c.cid === undefined ? null : String(c.cid).trim(),
    consecutivo: c.consecutivo ?? null,
    empresa: String(c.empresa ?? ''),
    asesor: c.asesor ?? null,
    estado: c.estado ?? null,
    facturacion: c.facturacion ?? null,
    health_score: c.health_score ?? null,
    activo_desde: c.activo_desde ?? null,
    dias_sin_contacto: diasSinContacto(efectivo.get(String(c.id)) ?? null),
    giro: c.giro ?? null,
    num_oficinas: c.num_oficinas ?? null,
    contacto_nombre: c.contacto_nombre ?? null,
    contacto_tel: c.contacto_tel ?? null,
    contacto_email: c.contacto_email ?? null,
    observaciones_kam: c.observaciones_kam ?? null,
    contactos_json: Array.isArray(c.contactos_json) ? c.contactos_json : null,
  })))

  const porCuenta = new Map<string, Alerta[]>()
  for (const a of alertas) {
    const k = String(a.cuentaId)
    if (!porCuenta.has(k)) porCuenta.set(k, [])
    porCuenta.get(k)!.push(a)
  }

  const salida: CuentaConVeredicto[] = []
  for (const c of cuentas) {
    const id = String(c.id)
    const cid = c.cid === null || c.cid === undefined ? null : String(c.cid).trim()
    const imp = importeDeCuenta(c, mapa)
    const mrr = imp.origen === 'sin_dato' ? null : imp.mrr

    const misCortes = cid && cortesFiables ? (cortes.get(cid) ?? []) : []
    const ultimo = misCortes.length ? misCortes[misCortes.length - 1] : null
    const consumoPct = ultimo && ultimo.origenBase !== 'sin_medicion'
      ? (ultimo.pct ?? null) : null

    const llam = await resumenLlamadas(cid)
    const tk = ticketStatsCuenta(cid, String(c.empresa ?? ''))
    const rel = relacion.get(id)
    const cand = candidatos.get(id)?.candidaturas ?? []

    /* CUÁLES de las ocho fuentes hablan de esta cuenta, y de ahí cuántas.
     *
     * Era sólo el número. Es la confianza de la predicción dicha en cifras —con
     * tres fuentes se opina distinto que con ocho— pero un «4 de 8» no dice qué
     * hay que conseguir, y lo que convierte el dato en trabajo es justamente
     * eso: a quién pedirle qué. El tablero lo necesita para poder contestar
     * «cuánto dinero está tapado por la falta de cortes» en vez de «hay 63
     * cuentas con 4 fuentes».
     *
     * EL CONTEO SE DERIVA DEL DETALLE, no se cuenta aparte. Dos listas de las
     * mismas ocho condiciones se desincronizan en cuanto alguien añade una
     * novena, y entonces el número y el desglose dirían cosas distintas sobre
     * la misma cuenta. Ver [[feedback-fuente-unica-cuentas]]. */
    const detalle: FuentesDetalle = {
      facturacion: mrr !== null,
      consumo:     consumoPct !== null,
      llamadas:    !!llam,
      tickets:     tk.total > 0,
      reuniones:   (rel?.conteos.reuniones ?? 0) > 0,
      contacto:    diasSinContacto(efectivo.get(id) ?? null) !== null,
      auditoria:   !!rel?.conteos.tieneAuditoria,
      ficha:       !!(c.observaciones_kam && String(c.observaciones_kam).trim() !== ''),
    }
    const fuentes = FUENTES.filter(f => detalle[f.k]).length

    const e: EstadoCuenta = {
      cuentaId: id,
      empresa: String(c.empresa ?? ''),
      asesor: c.asesor ?? null,
      mrr,
      esTop: top.has(id),
      alertas: porCuenta.get(id) ?? [],
      consumoPct,
      diasSinContacto: diasSinContacto(efectivo.get(id) ?? null),
      tieneLlamadas: !!llam,
      perdidas: llam ? llam.sinContestar : null,
      pctPerdidas: llam ? llam.pctSinContestar : null,
      tieneAuditoria: !!rel?.conteos.tieneAuditoria,
      /* La de mayor prioridad que sea CRECIMIENTO, no la primera de la lista:
         ver `CRECIMIENTO` arriba. Se publica el producto porque la acción del
         veredicto se lee «Proponer …» y ahí lo que sirve es el nombre de la
         cosa, no la etiqueta de la categoría. */
      candidatura: cand
        .filter(x => CRECIMIENTO.has(x.tipo))
        .sort((a, b) => a.prioridad - b.prioridad)[0]?.producto ?? null,
      productosSinUso: null,
      /* `null` cuando la cuenta no aparece en la mesa — que NO es cero tickets.
         Grupo Petroil ya enseñó la diferencia: su F32 tiene cero porque no pasa
         por la mesa, no porque esté sin incidencias. */
      tickets: tk.comoCruzo === 'ninguno' ? null : tk.total,
      reuniones: rel?.conteos.reuniones ?? 0,
      fallas: tk.fallas,
      relacionPct: rel?.pct ?? 0,
      fuentes,
    }

    salida.push({
      cuentaId: id, cid, empresa: e.empresa, asesor: e.asesor,
      mrr, esTop: e.esTop, veredicto: veredictoDe(e),
      datos: {
        consumoPct, diasSinContacto: e.diasSinContacto,
        entrantes: llam ? llam.entrantes : null,
        perdidas: e.perdidas, pctPerdidas: e.pctPerdidas,
        tickets: e.tickets, fallas: tk.fallas, ultimoTicket: tk.ultima,
        reuniones: rel?.conteos.reuniones ?? 0,
        contactos: rel?.conteos.contactos ?? 0,
        actividadesCerradas: rel?.conteos.actividadesCompletadas ?? 0,
        relacionPct: rel?.pct ?? 0,
        relacionNivel: rel?.nivel ?? 'Sin relación registrada',
        tieneAuditoria: e.tieneAuditoria,
        plan: ultimo?.plan ?? null,
        candidatura: e.candidatura,
        candidaturasTotal: cand.length,
        fuentes,
        fuentesDetalle: detalle,
      },
    })
  }

  const { SITUACION } = await import('@/lib/alertas-veredicto')
  salida.sort((a, b) => {
    const d = SITUACION[a.veredicto.situacion].orden - SITUACION[b.veredicto.situacion].orden
    if (d !== 0) return d
    if (a.mrr === null && b.mrr === null) return 0
    if (a.mrr === null) return 1
    if (b.mrr === null) return -1
    return b.mrr - a.mrr
  })

  return { cuentas: salida, falla: fallos.length ? fallos.join(' · ') : null }
}
