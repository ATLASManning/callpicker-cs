/**
 * POST /api/enriquecimiento/run
 * Lanza una corrida de enriquecimiento. Por defecto en DRY-RUN: devuelve la
 * vista previa de lo que se guardaría, sin escribir una sola fila.
 *
 * Solo administradores. La escritura real exige `dryRun: false` explícito.
 */
import { NextRequest, NextResponse } from 'next/server'
import { ejecutarEnriquecimiento } from '@/lib/enriquecimiento/servicio'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const rol    = req.headers.get('x-user-rol') ?? 'viewer'
  const email  = req.headers.get('x-user-email') ?? ''
  if (rol !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden lanzar enriquecimiento' }, { status: 403 })
  }

  let body: { asesor?: string; cuentaIds?: string[]; limite?: number; dryRun?: boolean } = {}
  try { body = await req.json() } catch { /* body opcional */ }

  const dryRun = body.dryRun !== false

  try {
    const resultado = await ejecutarEnriquecimiento({
      ejecutadoPor: email,
      asesor:       body.asesor,
      cuentaIds:    body.cuentaIds,
      limite:       body.limite ?? 10,
      dryRun,
    })

    return NextResponse.json({
      ok: true,
      dry_run: resultado.dry_run,
      aviso: resultado.dry_run
        ? 'Vista previa: no se escribió ninguna fila. Para persistir, repite con dryRun:false.'
        : 'Candidatos guardados. Ningún campo de la tabla cuentas fue modificado.',
      run_id:     resultado.run_id,
      resumen:    resultado.resumen,
      candidatos: resultado.candidatos,
      decisores:  resultado.decisores,
    })
  } catch (e) {
    console.error('[enriquecimiento/run]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 500 })
  }
}
