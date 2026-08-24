import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  evaluarElegibilidad, CAMPOS_ELEGIBILIDAD_SELECT, MSG, LIMITE_SEMANAL,
  type CuentaElegibilidadInput,
} from '@/lib/elegibilidad'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp     = req.nextUrl.searchParams
  const asesor = sp.get('asesor')
  const semana = sp.get('semana')  // YYYY-MM-DD (lunes de la semana)

  let q = supabaseAdmin
    .from('actividades')
    .select('*')
    .order('fecha_programada', { ascending: true })
    .order('creado_en',        { ascending: true })

  if (asesor) q = q.eq('asesor', asesor)
  if (semana) q = q.eq('semana_inicio', semana)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-bloquear actividades pendientes cuya fecha_vencimiento ya pasó
  const today   = new Date().toISOString().split('T')[0]
  const vencidas = (data ?? []).filter(
    (a: Record<string, unknown>) => a.estado === 'pendiente' && typeof a.fecha_vencimiento === 'string' && a.fecha_vencimiento < today
  )
  if (vencidas.length > 0) {
    const ids = vencidas.map((a: Record<string, unknown>) => a.id)
    await supabaseAdmin
      .from('actividades')
      .update({ estado: 'bloqueada', actualizado_en: new Date().toISOString() })
      .in('id', ids)
    const bloqueadasSet = new Set(ids)
    for (const a of data ?? []) {
      if (bloqueadasSet.has((a as Record<string, unknown>).id)) {
        ;(a as Record<string, unknown>).estado = 'bloqueada'
      }
    }
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validar que el asesor de la actividad sea el dueño real de la cuenta.
    // Sin esta guarda se podía crear una actividad para un asesor sobre una
    // cuenta de otro (incidente Medicall Expert, 18 Ago 2026 — ahí el origen
    // fue un duplicado en `cuentas`, pero este endpoint permitía el mismo
    // error de forma directa al insertar el body sin comprobar nada).
    const filas = Array.isArray(body) ? body : [body]
    for (const f of filas) {
      if (!f?.cuenta_id || !f?.asesor) continue
      const { data: cuenta } = await supabaseAdmin
        .from('cuentas')
        .select('asesor, empresa, consecutivo')
        .eq('id', f.cuenta_id)
        .single()
      if (cuenta && cuenta.asesor !== f.asesor) {
        return NextResponse.json({
          error: `La cuenta ${cuenta.consecutivo} (${cuenta.empresa}) está asignada a ${cuenta.asesor}, no a ${f.asesor}. Corrige el asesor de la cuenta en Supabase o asigna la actividad al asesor correcto.`,
        }, { status: 409 })
      }

      // Elegibilidad: no se crea una actividad sobre una cuenta que no es
      // cliente activo con contacto localizable. Misma regla que el generador.
      const { data: cuentaEleg, error: elegErr } = await supabaseAdmin
        .from('cuentas')
        .select(CAMPOS_ELEGIBILIDAD_SELECT)
        .eq('id', f.cuenta_id)
        .single()

      if (elegErr || !cuentaEleg) {
        return NextResponse.json({ error: MSG.estatus_no_validable, codigo: 'estatus_no_validable' }, { status: 409 })
      }

      const eleg = evaluarElegibilidad(cuentaEleg as unknown as CuentaElegibilidadInput, new Set<string>(), f.tipo)
      if (!eleg.elegible) {
        return NextResponse.json({
          error: eleg.motivo, codigo: eleg.codigo, contactoFaltante: eleg.contactoFaltante,
        }, { status: 409 })
      }

      // Tope semanal por cuenta.
      if (f.semana_inicio) {
        const { count } = await supabaseAdmin
          .from('actividades')
          .select('id', { count: 'exact', head: true })
          .eq('cuenta_id', f.cuenta_id)
          .eq('semana_inicio', f.semana_inicio)
        if ((count ?? 0) >= LIMITE_SEMANAL) {
          return NextResponse.json({ error: MSG.limite_semanal, codigo: 'limite_semanal' }, { status: 409 })
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('actividades')
      .insert(body)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
