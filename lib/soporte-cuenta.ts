/**
 * lib/soporte-cuenta.ts — la verdad completa de soporte de una cuenta.
 *
 * POR QUÉ EXISTE
 * --------------
 * El soporte de una cuenta vive partido en dos fuentes que no se hablaban:
 *
 *   HISTORIA  `lib/tickets-data.json` — el export de Zoho. 5,871 tickets con
 *             categoría, producto, propietario y duración. Solo CERRADOS: dos
 *             filas sin fecha de cierre en todo el archivo.
 *
 *   PRESENTE  `data/mesa-ayuda/*.json` — el corte diario de la tarea «Reporte
 *             Diario Mesa de Ayuda». Trae los tickets FUERA DE SLA con sus días
 *             de atraso, y los KPIs de abiertos y en espera.
 *
 * Mientras no se juntaban, el tablero afirmaba «0 abiertos» en 221 de 222
 * cuentas —porque leía la historia y la historia no tiene presente— y esa cifra
 * llegaba hasta el dossier que lee la IA. Al mismo tiempo `mesaDeCuenta()` ya
 * existía y NADIE la consumía fuera de la pantalla de Tickets.
 *
 * Este módulo es el único lugar donde se decide qué se puede afirmar sobre los
 * pendientes de una cuenta. Usa `fs` (vía mesa-ayuda), así que es SOLO SERVIDOR.
 *
 * LO QUE SE PUEDE AFIRMAR Y LO QUE NO
 * -----------------------------------
 *   SÍ  los tickets fuera de SLA de hoy, con días de atraso y reincidencia.
 *   NO  el total de abiertos por cuenta. La mesa da el total GLOBAL (139
 *       abiertos, 140 en espera al 24-sep) pero no lo reparte por cuenta, y el
 *       export no trae abiertos. Así que «pendientes» aquí significa
 *       «vencidos conocidos», y se dice con esas palabras.
 */
import { ticketStatsCuenta, type TicketStatsCuenta } from './tickets-cuenta'
import { mesaDeCuenta, resumenMesa, type TicketVencido, type EstadoMesaCuenta } from './mesa-ayuda'

export type SeveridadSoporte = 'sin_datos' | 'limpio' | 'atencion' | 'grave'

export interface SoporteCuenta {
  /** Lo que el export de Zoho sabe: historia de tickets cerrados. */
  historia: TicketStatsCuenta

  /* ── El presente, del corte de la mesa ── */
  vencidos:          TicketVencido[]
  /** Días fuera de SLA del peor folio. null si no hay vencidos. */
  peorDiasSLA:       number | null
  /** En cuántos cortes de la ventana ha tenido vencidos esta cuenta. */
  cortesConVencidos: number
  cortesTotales:     number
  fechaCorte:        string | null

  /**
   * Reincidencia MEDIDA, en sustitución de la columna `tiene_ticket_reincidente`
   * —que estaba en `false` en las 222 cuentas y nadie actualizaba nunca, aunque
   * la auditoría de Finsus documentara 35 tickets del mismo trámite en 8 meses.
   * Tres o más cortes con vencidos no es un mal día: es un patrón.
   */
  reincideEnMesa:    boolean

  /** Umbrales medidos sobre los 13 cortes reales (SLA de 1 a 144 días). */
  severidad:         SeveridadSoporte

  /** ¿Se puede afirmar cuántos tickets abiertos tiene? Hoy: no. */
  abiertosMedible:   boolean

  /** Frase única, para pantalla y para el contexto de la IA. Nunca dice «0
   *  abiertos» cuando lo que hay es ausencia de medición. */
  frase:             string
}

const REINCIDE_DESDE = 3    // cortes con vencidos
const GRAVE_DIAS     = 14   // días fuera de SLA
const GRAVE_RACHA    = 8    // cortes con vencidos

export function soporteDeCuenta(cid: string | null | undefined, empresa: string): SoporteCuenta {
  const historia = ticketStatsCuenta(cid ?? null, empresa)
  const mesa = mesaDeCuenta(cid)

  const peor = mesa.peor?.diasSLA ?? null
  const reincide = mesa.cortesConVencidos >= REINCIDE_DESDE

  let severidad: SeveridadSoporte
  if (mesa.cortesTotales === 0)      severidad = 'sin_datos'
  else if (mesa.vencidos.length === 0) severidad = 'limpio'
  else if ((peor ?? 0) >= GRAVE_DIAS || mesa.cortesConVencidos >= GRAVE_RACHA) severidad = 'grave'
  else severidad = 'atencion'

  return {
    historia,
    vencidos:          mesa.vencidos,
    peorDiasSLA:       peor,
    cortesConVencidos: mesa.cortesConVencidos,
    cortesTotales:     mesa.cortesTotales,
    fechaCorte:        mesa.fechaCorte,
    reincideEnMesa:    reincide,
    severidad,
    abiertosMedible:   historia.abiertosMedible,
    frase:             fraseSoporte(historia, mesa, severidad),
  }
}

/**
 * La frase, en un solo lugar, para que la pantalla, el generador de actividades
 * y el dossier de la IA digan exactamente lo mismo.
 */
function fraseSoporte(
  h: TicketStatsCuenta,
  m: EstadoMesaCuenta,
  sev: SeveridadSoporte,
): string {
  const partes: string[] = []

  // Historia
  if (h.comoCruzo === 'ninguno') {
    partes.push('Sin tickets cruzados por CID ni por nombre en el export de Zoho ' +
      '(puede que la cuenta opere con otro CID: eso NO significa que no tenga soporte)')
  } else {
    partes.push(`${h.total} tickets históricos, ${h.fallas} marcados como falla` +
      (h.fallasCategoria > h.fallas ? ` (${h.fallasCategoria} clasificados como falla por la mesa)` : '') +
      (h.ultima ? `, el último el ${h.ultima}` : ''))
  }

  // Presente — lo que NO se sabe se dice
  if (!h.abiertosMedible) {
    partes.push('Tickets abiertos: NO MEDIBLE — el export de Zoho solo trae cerrados')
  }

  if (m.cortesTotales === 0) {
    partes.push('Sin cortes de mesa de ayuda disponibles')
  } else if (m.vencidos.length === 0) {
    partes.push(`Sin tickets fuera de SLA en el corte del ${m.fechaCorte}` +
      (m.cortesConVencidos > 0
        ? ` (pero apareció en ${m.cortesConVencidos} de los ${m.cortesTotales} cortes anteriores)`
        : ''))
  } else {
    const peor = m.peor
    partes.push(
      `${m.vencidos.length} ticket(s) FUERA DE SLA al corte del ${m.fechaCorte}` +
      (peor?.diasSLA != null ? `, el peor con ${peor.diasSLA} días de atraso` : '') +
      (peor?.folio ? ` (folio #${peor.folio})` : '') +
      ` — presente en ${m.cortesConVencidos} de ${m.cortesTotales} cortes`)
  }

  if (sev === 'grave') partes.push('SEVERIDAD: grave')
  else if (sev === 'atencion') partes.push('SEVERIDAD: requiere atención')

  return partes.join('. ') + '.'
}

/** El encabezado del módulo: el estado global de la mesa, con su fecha. */
export function resumenSoporteGlobal() {
  const r = resumenMesa()
  return {
    hay: r.hay,
    fechaCorte: r.fecha,
    cortes: r.cortes,
    vencidos: r.vencidos,
    abiertosGlobales: r.abiertos,
    enEsperaGlobales: r.enEspera,
    /** Se repite a propósito: el total global NO se puede repartir por cuenta. */
    nota: 'Los abiertos y en espera son totales de la mesa; no vienen desglosados por cuenta.',
  }
}
