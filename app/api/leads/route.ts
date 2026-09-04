import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Leads — prospectos capturados desde Upsell & Cross-sell.
 *
 * Un lead todavía no es cuenta: no tiene CID ni cartera. Por eso vive en su
 * propia tabla y no en `oportunidades`, que exige `cuenta_id`.
 *
 *   GET    → lista (admin ve todos; un asesor solo los suyos)
 *   POST   → alta
 *   PATCH  → actualiza estado, asesor o notas
 *   DELETE → borra uno (solo admin)
 */

/** El error de tabla inexistente se traduce a algo accionable. */
const FALTA_TABLA = 'La tabla `leads` todavía no existe. Corre scripts/migracion-leads.sql en Supabase → SQL Editor.'
const esTablaFaltante = (msg: string) =>
  msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('relation')

export async function GET(req: NextRequest) {
  const rol    = req.headers.get('x-user-rol') ?? 'viewer'
  const asesor = decodeURIComponent(req.headers.get('x-user-asesor') ?? '')

  let q = supabaseAdmin
    .from('leads')
    .select('id,consecutivo,empresa,contacto,telefono,email,interes_servicio,asesor,estado,notas,creado_por,created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (rol === 'asesor' && asesor) q = q.eq('asesor', asesor)

  const { data, error } = await q
  if (error) {
    return NextResponse.json({
      leads: [],
      error: esTablaFaltante(error.message) ? FALTA_TABLA : error.message,
    })
  }
  return NextResponse.json({ leads: data ?? [] })
}

export async function POST(req: NextRequest) {
  const email = req.headers.get('x-user-email') ?? ''
  const body  = await req.json() as Record<string, unknown>

  const txt = (k: string) => String(body[k] ?? '').trim()
  const empresa = txt('empresa')

  // El nombre de la empresa es lo único sin lo cual el registro no sirve para
  // nada: sin él no hay a quién buscar después.
  if (!empresa) {
    return NextResponse.json({ error: 'El nombre de la empresa es obligatorio.' }, { status: 400 })
  }

  const correo = txt('email')
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return NextResponse.json({ error: 'El correo no tiene un formato válido.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      empresa,
      contacto:         txt('contacto')         || null,
      telefono:         txt('telefono')         || null,
      email:            correo                  || null,
      interes_servicio: txt('interes_servicio') || null,
      asesor:           txt('asesor')           || null,
      notas:            txt('notas')            || null,
      estado:           txt('estado')           || 'nuevo',
      creado_por:       email                   || null,
    })
    .select()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({
        error: 'Ya existe un lead con ese correo. Búscalo en la lista antes de volver a capturarlo.',
      }, { status: 409 })
    }
    return NextResponse.json({
      error: esTablaFaltante(error.message) ? FALTA_TABLA : error.message,
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true, lead: data?.[0] ?? null })
}

export async function PATCH(req: NextRequest) {
  const { id, ...campos } = await req.json() as Record<string, unknown> & { id?: string }
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Lista blanca: el resto de las columnas no se tocan desde el cliente.
  const permitidos = ['estado', 'asesor', 'notas', 'contacto', 'telefono', 'email', 'interes_servicio', 'empresa']
  const update: Record<string, unknown> = {}
  for (const k of permitidos) if (k in campos) update[k] = String(campos[k] ?? '').trim() || null
  if (!Object.keys(update).length) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('leads').update(update).eq('id', id).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, lead: data?.[0] ?? null })
}

export async function DELETE(req: NextRequest) {
  const rol = req.headers.get('x-user-rol') ?? 'viewer'
  if (rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabaseAdmin.from('leads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
