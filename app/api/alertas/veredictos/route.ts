import { NextRequest, NextResponse } from 'next/server'
import { veredictosDeCartera } from '@/lib/alertas-estado'
import { SITUACION } from '@/lib/alertas-veredicto'

/**
 * GET /api/alertas/veredictos — las 192 cuentas, cada una con su lectura.
 *
 * El cambio de alcance de ALERTAS: deja de listar «las cuentas que dispararon
 * una alerta» y pasa a cubrir la cartera entera. Una cuenta sin una sola alerta
 * también sale, con su veredicto — «en orden», o «no la vemos» cuando lo que
 * falta son los datos. Hoy esas dos se ven igual porque ambas están ausentes de
 * la lista, y son lo contrario la una de la otra.
 *
 * Existe antes que la pantalla A PROPÓSITO: hay que ver cómo se reparten las 192
 * entre las siete situaciones antes de dibujar nada. Si salieran 180 en «no la
 * vemos» el diseño estaría mal y lo barato es enterarse ahora.
 * Ver [[feedback-kpi-con-fuente]].
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

/** Qué build sirve esta ruta. Se sube a mano con cada cambio que haya que poder
 *  confirmar desde fuera, por la misma razón que en `/api/alertas`: sin esto no
 *  se distingue «el código no está en línea» de «el código está mal», y depurar
 *  las dos a la vez ya me costó dos rondas. */
const VERSION = '2026-10-09.03-dinero-tapado-sin-medir'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const rolAsesor = req.headers.get('x-user-rol') === 'asesor'
  const suyo = decodeURIComponent(req.headers.get('x-user-asesor') ?? '')

  /* FALLA CERRADO, igual que `/api/alertas`: un rol de asesor sin cartera
     asignada no recibe datos. Un permiso incompleto se resuelve negando. */
  if (rolAsesor && !suyo) {
    return NextResponse.json(
      { error: 'La sesión tiene rol de asesor pero no trae asignada una cartera. '
             + 'Pedir a administración que complete el usuario.' },
      { status: 403 })
  }
  const asesor = rolAsesor ? suyo : (sp.get('asesor') || undefined)

  try {
    const { cuentas, falla } = await veredictosDeCartera(asesor ? { asesor } : undefined)

    /* El reparto por situación y el dinero de cada una. Es el encabezado de la
       pantalla y la cifra con la que se discute en la junta. */
    const porSituacion: Record<string, { cuentas: number; mrr: number; sinImporte: number }> = {}
    for (const c of cuentas) {
      const k = c.veredicto.situacion
      porSituacion[k] = porSituacion[k] ?? { cuentas: 0, mrr: 0, sinImporte: 0 }
      porSituacion[k].cuentas += 1
      if (c.mrr === null) porSituacion[k].sinImporte += 1
      else porSituacion[k].mrr += c.mrr
    }

    const filtro = sp.get('situacion')
    const rows = filtro ? cuentas.filter(c => c.veredicto.situacion === filtro) : cuentas

    return NextResponse.json({
      rows,
      total: cuentas.length,
      mostradas: rows.length,
      porSituacion,
      /* El orden y el nombre de cada situación viajan con la respuesta para que
         la pantalla no los vuelva a declarar. Una lista de estados escrita dos
         veces se desincroniza. */
      catalogo: SITUACION,
      falla,
      version: VERSION,
      generado: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? 'No se pudieron calcular los veredictos' },
      { status: 500 })
  }
}
