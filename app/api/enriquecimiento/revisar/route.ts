/**
 * POST /api/enriquecimiento/revisar
 * Registra la decisión humana sobre un candidato. Toda acción queda auditada.
 *
 * Acciones: aprobado_adicional | incorrecto | pospuesto | fusionado_manual
 *
 * NINGUNA de ellas escribe en `cuentas`. "aprobado_adicional" marca el dato
 * como bueno para que el KAM lo tenga a la vista y lo capture donde
 * corresponda; "fusionado_manual" deja constancia de que el KAM ya lo integró
 * él mismo. La sustitución directa del valor del KAM existe solo como acción
 * excepcional de administrador, apagada por defecto (ver más abajo).
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CAMPOS_OPERATIVOS } from '@/lib/enriquecimiento/tipos'
import type { CampoEnriquecible } from '@/lib/enriquecimiento/tipos'

export const dynamic = 'force-dynamic'

const ACCIONES = ['aprobado_adicional', 'incorrecto', 'pospuesto', 'fusionado_manual'] as const
type Accion = (typeof ACCIONES)[number]

export async function POST(req: NextRequest) {
  const rol          = req.headers.get('x-user-rol') ?? 'viewer'
  const email        = req.headers.get('x-user-email') ?? ''
  const asesorSesion = decodeURIComponent(req.headers.get('x-user-asesor') ?? '')

  const body = await req.json().catch(() => ({})) as {
    id?: string; accion?: string; nota?: string
    aplicar_a_cuenta?: boolean; confirmar?: boolean
  }

  if (!body.id || !body.accion || !ACCIONES.includes(body.accion as Accion)) {
    return NextResponse.json(
      { error: `id y accion requeridos. Acciones válidas: ${ACCIONES.join(', ')}` }, { status: 400 })
  }

  const { data: cand, error: errCand } = await supabaseAdmin
    .from('enriquecimiento_candidatos')
    .select('id, cuenta_id, asesor, campo, valor_candidato, valor_original_snapshot, fuente_url, review_status')
    .eq('id', body.id).single()

  if (errCand || !cand) return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 })

  // Aislamiento: un asesor solo revisa su propia cartera
  if (rol !== 'admin' && cand.asesor !== asesorSesion) {
    return NextResponse.json({ error: 'Ese candidato pertenece a otra cartera' }, { status: 403 })
  }

  const ahora = new Date().toISOString()
  const { error: errUpd } = await supabaseAdmin
    .from('enriquecimiento_candidatos')
    .update({
      review_status: body.accion, revisado_por: email,
      revisado_en: ahora, nota_revision: body.nota ?? null,
    })
    .eq('id', body.id)
  if (errUpd) return NextResponse.json({ error: errUpd.message }, { status: 500 })

  await supabaseAdmin.from('enriquecimiento_auditoria').insert({
    cuenta_id: cand.cuenta_id, entidad_tipo: 'candidato', entidad_id: cand.id,
    accion: body.accion, valor_previo: cand.valor_original_snapshot,
    valor_propuesto: cand.valor_candidato, fuente_url: cand.fuente_url,
    ejecutado_por: email,
  })

  /* ── Sustitución manual excepcional ──────────────────────────────────────
   * Apagada salvo que exista ENRIQUECIMIENTO_PERMITIR_APLICAR=1. Exige rol
   * admin y confirmación explícita, y deja el valor anterior en la auditoría.
   * Es la única ruta del sistema capaz de tocar `cuentas`, y por eso vive aquí
   * — a la vista y con tres candados — y no dentro del motor.
   */
  if (body.aplicar_a_cuenta) {
    if (process.env.ENRIQUECIMIENTO_PERMITIR_APLICAR !== '1') {
      return NextResponse.json({
        ok: true, review_status: body.accion,
        aviso: 'Revisión registrada. La sustitución directa está deshabilitada por configuración: ' +
               'el dato del KAM permanece intacto.',
      })
    }
    if (rol !== 'admin' || body.confirmar !== true) {
      return NextResponse.json(
        { error: 'La sustitución requiere rol admin y confirmar:true' }, { status: 403 })
    }
    // El campo debe ser uno del alcance operativo: nunca se permite escribir
    // en nps_score, observaciones_kam ni en ninguna columna arbitraria.
    if (!CAMPOS_OPERATIVOS.includes(cand.campo as CampoEnriquecible)) {
      return NextResponse.json(
        { error: `El campo "${cand.campo}" no admite sustitución` }, { status: 400 })
    }

    const { data: antes } = await supabaseAdmin
      .from('cuentas').select(`id, ${cand.campo}`).eq('id', cand.cuenta_id).single()
    const previo = antes ? String((antes as Record<string, unknown>)[cand.campo] ?? '') : ''

    const { error: errAplica } = await supabaseAdmin
      .from('cuentas').update({ [cand.campo]: cand.valor_candidato }).eq('id', cand.cuenta_id)
    if (errAplica) return NextResponse.json({ error: errAplica.message }, { status: 500 })

    await supabaseAdmin.from('enriquecimiento_auditoria').insert({
      cuenta_id: cand.cuenta_id, entidad_tipo: 'cuenta', entidad_id: cand.cuenta_id,
      accion: 'aplicado_a_cuenta', valor_previo: previo,
      valor_propuesto: cand.valor_candidato, fuente_url: cand.fuente_url,
      ejecutado_por: email,
    })

    return NextResponse.json({
      ok: true, review_status: body.accion, aplicado: true,
      aviso: `Campo "${cand.campo}" sustituido por decisión explícita de ${email}. ` +
             `Valor anterior conservado en la auditoría.`,
    })
  }

  return NextResponse.json({ ok: true, review_status: body.accion })
}
