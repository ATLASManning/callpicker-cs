import { NextRequest, NextResponse } from 'next/server'
import { resumenMesa, mesaDeCuenta, ultimoCorte } from '@/lib/mesa-ayuda'
import { TICKETS } from '@/lib/tickets-norm'

/**
 * El estado VIVO de la mesa de ayuda — lo que el export de Zoho no trae.
 *
 * `lib/tickets-data.json` solo contiene tickets CERRADOS (2 de 5,871 sin
 * fecha de cierre), así que el módulo Tickets cuenta historia y no ve el
 * presente. Esto sirve la otra mitad: los cortes diarios que genera la tarea
 * «Reporte Diario Mesa de Ayuda», con los tickets fuera de SLA.
 *
 * La lectura es de disco (`data/mesa-ayuda/*.json`), así que va como ruta y no
 * como import del cliente: la pantalla de Tickets es `'use client'`.
 *
 * SIEMPRE devuelve la FECHA DEL CORTE. Un dato sin fecha se lee como si fuera
 * de hoy, y puede ser del viernes pasado — o no existir, si la tarea no corrió.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid')

  if (cid) {
    return NextResponse.json(mesaDeCuenta(cid))
  }

  const resumen = resumenMesa()
  const u = ultimoCorte()
  return NextResponse.json({
    ...resumen,
    // La lista completa del último corte, para la pestaña «Fuera de SLA»,
    // con el desenlace que el corte no pudo saber (ver abajo).
    vencidosDetalle: (u?.ticketsVencidos ?? []).map(conDesenlace),
  })
}

/**
 * EL CORTE SE CONGELA; EL EXPORT SIGUE. Cruzarlos es la única forma de saber
 * si un folio que la mesa dejó ardiendo ya se apagó.
 *
 * El 31 oct 2026 la pestaña publicaba los cuatro vencidos del corte del 5 de
 * octubre como «Abierto», y dos de ellos ya habían cerrado —EMPODERA SALUD el
 * 29 y Grupo Inmobiliario MJAP el 19—. La corrección estaba en el MISMO
 * proceso, en `lib/tickets-data.json`, y nadie la miraba. Una cifra superada
 * que se publica sin su corrección es la regla 1 de
 * [[feedback-auditorias-verificar]].
 *
 * CUIDADO CON EL FOLIO: `num` NO identifica al ticket —conviven dos series de
 * numeración y hay 3 folios repartidos en 7 filas—, así que un folio con más
 * de una fila NO se declara cerrado: se marca `ambiguo` y la pantalla lo dice.
 * Dar por cerrado el ticket de otra empresa sería peor que no cruzar nada.
 * Ver [[tickets-fuente]].
 *
 * Lo mismo lo comprueba por línea de comandos `scripts/mesa-pendientes-cerraron.py`.
 */
type Desenlace = { cerro: string; dias: number | null } | { ambiguo: number } | null

function conDesenlace<T extends { folio?: string }>(v: T): T & { desenlace: Desenlace } {
  const folio = String(v.folio ?? '').trim()
  const filas = folio ? TICKETS.filter(t => String(t.num ?? '').trim() === folio) : []
  if (filas.length === 0)  return { ...v, desenlace: null }          // sigue abierto
  if (filas.length > 1)    return { ...v, desenlace: { ambiguo: filas.length } }
  const t = filas[0]
  const ms = t.cierre && t.apertura ? Date.parse(t.cierre) - Date.parse(t.apertura) : NaN
  return {
    ...v,
    desenlace: {
      cerro: (t.cierre ?? '').slice(0, 10),
      /* FLOOR, no round: son DÍAS CUMPLIDOS. Con `Math.round`, MJAP salía
         27 aquí y 26 en `mesa-pendientes-cerraron.py`, que usa el `.days`
         de Python (truncado). Dos herramientas de la casa midiendo lo mismo
         y discrepando en uno es justo la contradicción interna que hay que
         evitar. [[feedback-auditorias-verificar]] */
      dias: Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : null,
    },
  }
}
