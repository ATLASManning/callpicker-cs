import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  MENSAJE_SIN_CARTERA, firmaDeSesion, sesionDe, esRolAcotado, esSuya,
  carteraDeTrabajo,
} from '@/lib/dueno'

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

  /* Sus leads son su cola de trabajo, igual que en `/api/cuentas`: la lista
     abre con los suyos y un `?asesor=` explícito se respeta, porque consultar
     es libre (instrucción de dirección, 15 oct 2026).
   *
     El patrón que había era `rol === 'asesor' && asesor`, que parecía
     defensivo y era lo contrario: con el rol puesto y el nombre vacío la
     condición se caía, el `.eq()` no se aplicaba y salían los 500 leads de las
     tres carteras — o sea que al usuario a medio configurar se le daba MÁS que
     al bien configurado. Eso estaba mal con la lectura abierta o cerrada; hoy
     la decisión la toma `carteraDeTrabajo` en un solo sitio. */
  const cartera = carteraDeTrabajo(req.headers, req.nextUrl.searchParams.get('asesor'))
  if (!cartera.ok) return cartera.res
  if (cartera.asesor) q = q.eq('asesor', cartera.asesor)

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

  /* El lead lo firma quien lo captura. Sin esto un asesor capturaba un
     prospecto a nombre de otro, y el GET de arriba —que ya filtra por
     `asesor`— se lo entregaba al suplantado como trabajo suyo. */
  const firma = firmaDeSesion(req.headers, txt('asesor'))
  if (!firma.ok) return firma.res

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
      asesor:           firma.asesor,
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

  /* NO COMPROBABA NADA: un asesor editaba cualquier lead de la empresa, y
     `asesor` está en la lista blanca de abajo, así que podía además
     adjudicarse el prospecto de otro cambiándole el dueño. */
  const s = sesionDe(req.headers)
  if (esRolAcotado(s)) {
    if (!s.asesor) {
      return NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 })
    }
    const { data: duenoLead, error: errLead } = await supabaseAdmin
      .from('leads').select('asesor').eq('id', id).maybeSingle()
    if (errLead) return NextResponse.json({ error: errLead.message }, { status: 500 })
    if (!duenoLead || !esSuya(s, (duenoLead as { asesor: string | null }).asesor)) {
      return NextResponse.json({ error: 'No existe ese lead en tu cartera.' }, { status: 404 })
    }
    if ('asesor' in campos && !esSuya(s, String(campos.asesor ?? ''))) {
      return NextResponse.json(
        { error: 'No puedes pasar un lead a otra cartera.' }, { status: 403 })
    }
  }

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
