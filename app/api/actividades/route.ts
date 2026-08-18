import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
