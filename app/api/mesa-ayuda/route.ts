import { NextRequest, NextResponse } from 'next/server'
import { resumenMesa, mesaDeCuenta, ultimoCorte } from '@/lib/mesa-ayuda'

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
    // La lista completa del último corte, para la pestaña «Fuera de SLA».
    vencidosDetalle: u?.ticketsVencidos ?? [],
  })
}
