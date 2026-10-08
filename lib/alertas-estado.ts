import { supabaseAdmin } from '@/lib/supabase'
import { detectarAlertas } from '@/lib/alertas-detectar'
import { mapaFacturacion, importeDeCuenta } from '@/lib/facturacion-cuenta'
import { ultimoContactoEfectivoPorCuenta, diasSinContacto } from '@/lib/contacto-cuenta'
import { todosLosCortes } from '@/lib/cortes-cuenta'
import { resumenLlamadas } from '@/lib/llamadas-resumen'
import { ticketStatsCuenta } from '@/lib/tickets-cuenta'
import { relacionamientoDeCuentas } from '@/lib/relacionamiento'
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
    /** Cuántas de las ocho fuentes tienen dato para esta cuenta. Es la
     *  confianza de la predicción, dicha en números y no en adjetivos. */
    fuentes: number
  }
}

export interface MapaVeredictos {
  cuentas: CuentaConVeredicto[]
  falla: string | null
}

export async function veredictosDeCartera(
  filtro?: { asesor?: string },
): Promise<MapaVeredictos> {
  const fallos: string[] = []

  let q = supabaseAdmin.from('cuentas')
    .select('id, cid, empresa, asesor, estado, facturacion, consecutivo, giro, '
          + 'nps_score, observaciones_kam, notas, contactos_json, ultimo_contacto')
    .in('estado', ['activo', 'en_riesgo'])
  if (filtro?.asesor) q = q.eq('asesor', filtro.asesor)
  const { data: cuentas, error } = await q

  if (error || !cuentas) {
    return { cuentas: [], falla: `No se pudieron leer las cuentas: ${error?.message ?? 'sin filas'}` }
  }

  const [mapa, efectivo, cortes, alertas, relacion] = await Promise.all([
    mapaFacturacion(),
    ultimoContactoEfectivoPorCuenta(),
    todosLosCortes(),
    detectarAlertas(filtro?.asesor ? { asesor: filtro.asesor } : undefined),
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

  const cortesFiables = cortes.size >= CORTES_MINIMOS
  if (!cortesFiables) {
    fallos.push(`cortes: la fuente devolvió ${cortes.size} CID(s), menos de los `
              + `${CORTES_MINIMOS} mínimos. El consumo sale como no medido, que es `
              + `la verdad, pero el motivo es la fuente y no las cuentas.`)
  }

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

    /* Cuántas de las ocho fuentes hablan de esta cuenta. Es la confianza de la
       predicción dicha en números: con tres fuentes se opina distinto que con
       ocho, y el asesor tiene derecho a saber sobre qué se le está pidiendo
       actuar. */
    const fuentes = [
      mrr !== null,
      consumoPct !== null,
      !!llam,
      tk.total > 0,
      (rel?.conteos.reuniones ?? 0) > 0,
      diasSinContacto(efectivo.get(id) ?? null) !== null,
      !!rel?.conteos.tieneAuditoria,
      !!(c.observaciones_kam && String(c.observaciones_kam).trim() !== ''),
    ].filter(Boolean).length

    const e: EstadoCuenta = {
      cuentaId: id,
      empresa: String(c.empresa ?? ''),
      asesor: c.asesor ?? null,
      mrr,
      esTop: false,
      alertas: porCuenta.get(id) ?? [],
      consumoPct,
      diasSinContacto: diasSinContacto(efectivo.get(id) ?? null),
      tieneLlamadas: !!llam,
      perdidas: llam ? llam.sinContestar : null,
      pctPerdidas: llam ? llam.pctSinContestar : null,
      tieneAuditoria: !!rel?.conteos.tieneAuditoria,
      candidatura: null,
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
        fuentes,
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
