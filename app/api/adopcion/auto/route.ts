/**
 * POST /api/adopcion/auto
 * Evalúa la ADOPCIÓN DE PRODUCTO con datos duros (plan facturado, consumo y
 * uso del panel) y la registra SOLO donde el módulo está vacío.
 *
 * Garantías:
 *  · nunca sobrescribe una evaluación existente — se salta los pares
 *    (cuenta, producto) que ya tienen fila, sin importar quién la puso;
 *  · nunca inventa: si no hay evidencia para un producto, no emite nada;
 *  · dry-run por defecto: `dryRun: false` explícito para escribir.
 *
 * Solo administradores.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cortesDeCuenta } from '@/lib/cortes-cuenta'
import { evaluarAdopcion } from '@/lib/adopcion-auto'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const AUTOR = 'Atlas (evaluación automática)'

export async function POST(req: NextRequest) {
  const rol = req.headers.get('x-user-rol') ?? 'viewer'
  if (rol !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as
    { cuentaIds?: string[]; asesor?: string; limite?: number; dryRun?: boolean }
  const dryRun = body.dryRun !== false
  const limite = Math.min(Math.max(body.limite ?? 40, 1), 250)

  let q = supabaseAdmin.from('cuentas').select('id, consecutivo, empresa, asesor, cid, estado')
  if (body.cuentaIds?.length) q = q.in('id', body.cuentaIds)
  else                        q = q.in('estado', ['activo', 'en_riesgo'])
  if (body.asesor)            q = q.eq('asesor', body.asesor)

  const { data: cuentas, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const lote = (cuentas ?? []).slice(0, limite)
  if (!lote.length) return NextResponse.json({ ok: true, evaluadas: 0, filas: [] })

  // Pares (cuenta, producto) que YA tienen evaluación: intocables.
  const { data: existentes } = await supabaseAdmin
    .from('adopcion_producto')
    .select('cuenta_id, producto')
    .in('cuenta_id', lote.map(c => c.id))
  const yaEvaluado = new Set((existentes ?? []).map(e => `${e.cuenta_id}|${e.producto}`))

  const filas: Array<Record<string, unknown>> = []
  const detalle: Array<Record<string, unknown>> = []
  let sinCortes = 0, sinEvidencia = 0, respetadas = 0

  for (const c of lote) {
    const cortes = await cortesDeCuenta(c.cid, 6)
    if (!cortes.length) { sinCortes++; continue }

    const evaluaciones = evaluarAdopcion(cortes)
    if (!evaluaciones.length) { sinEvidencia++; continue }

    const nuevas = evaluaciones.filter(e => !yaEvaluado.has(`${c.id}|${e.producto}`))
    respetadas += evaluaciones.length - nuevas.length
    if (!nuevas.length) continue

    for (const e of nuevas) {
      filas.push({
        cuenta_id: c.id, producto: e.producto, nivel: e.nivel,
        fecha: new Date().toISOString().slice(0, 10),
        asesor: AUTOR, notas: e.notas,
      })
    }
    detalle.push({
      consecutivo: c.consecutivo, empresa: c.empresa, asesor: c.asesor,
      evaluados: nuevas.map(e => `${e.producto}=${e.nivel}`),
    })
  }

  if (!dryRun && filas.length) {
    const { error: insErr } = await supabaseAdmin.from('adopcion_producto').insert(filas)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    aviso: dryRun
      ? 'Vista previa: no se escribió nada. Repite con dryRun:false para registrar.'
      : 'Evaluaciones registradas. No se tocó ninguna evaluación existente.',
    cuentas_revisadas: lote.length,
    evaluaciones_nuevas: filas.length,
    cuentas_con_evaluacion: detalle.length,
    sin_cortes: sinCortes,
    sin_evidencia: sinEvidencia,
    respetadas_del_asesor: respetadas,
    detalle: detalle.slice(0, 40),
  })
}
