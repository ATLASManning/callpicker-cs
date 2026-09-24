/**
 * /api/buzon — Buzón del Cliente.
 *
 * Las reglas de coherencia viven en la base como CHECK constraints y se
 * repiten AQUÍ a propósito. No es duplicación ociosa: la base protege el dato
 * pase lo que pase, y el API devuelve un mensaje que una persona entiende en
 * vez del texto de un constraint de Postgres. Si alguna vez discrepan, la
 * base gana — por eso los mensajes citan la misma regla.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { EntradaBuzon } from '@/lib/buzon'
import { hoyEnMexico } from '@/lib/fecha-local'

export const dynamic = 'force-dynamic'

const PRIORIDADES = ['alta', 'media', 'baja']
const AREAS = ['administracion', 'ingenieria', 'producto', 'soporte']
const CANALES = ['whatsapp', 'telefono', 'email', 'meeting', 'ticket']
const ESTADOS = ['recibida', 'en_analisis', 'comprometida', 'entregada', 'no_procede']

const texto = (v: unknown) => String(v ?? '').trim()

/** Devuelve el problema en palabras, o null si el registro es coherente. */
function validar(b: Partial<EntradaBuzon>, parcial = false): string | null {
  if (!parcial) {
    if (!texto(b.cliente))   return 'Falta el cliente.'
    if (!texto(b.solicitud)) return 'Falta la solicitud: sin ella el registro no sirve de nada.'
    if (!b.area)  return 'Falta el área responsable.'
    if (!b.canal) return 'Falta por dónde entró la solicitud.'
  }
  if (b.prioridad && !PRIORIDADES.includes(b.prioridad)) return 'Prioridad inválida.'
  if (b.area && !AREAS.includes(b.area))                 return 'Área inválida.'
  if (b.canal && !CANALES.includes(b.canal))             return 'Canal inválido.'
  if (b.estado && !ESTADOS.includes(b.estado))           return 'Estado inválido.'

  // Mismas coherencias que los CHECK de la migración 20260917.
  if (b.estado === 'entregada') {
    if (!b.fecha_entrega) return 'Para marcarla entregada hace falta la fecha de entrega.'
  }
  if (b.estado === 'no_procede' && !texto(b.motivo_respuesta)) {
    return 'Un «no procede» necesita su motivo: negarse sin explicar no es una respuesta, y es justo lo que hay que poder decirle al cliente.'
  }
  if (b.avisado_al_cliente && b.estado && !['entregada', 'no_procede'].includes(b.estado)) {
    return 'No se puede haber avisado de algo que todavía no cierra.'
  }
  if (b.fecha_compromiso && b.fecha_solicitud && b.fecha_compromiso < b.fecha_solicitud) {
    return 'La fecha comprometida no puede ser anterior a la solicitud.'
  }
  if (b.fecha_entrega && b.fecha_solicitud && b.fecha_entrega < b.fecha_solicitud) {
    return 'La fecha de entrega no puede ser anterior a la solicitud.'
  }
  return null
}

/** El estado manda sobre `solucion`: nulo mientras el ciclo siga abierto. */
function derivarSolucion(estado: string | undefined): 'si' | 'no' | null {
  if (estado === 'entregada')   return 'si'
  if (estado === 'no_procede')  return 'no'
  return null
}

/**
 * PGRST205 = PostgREST no encuentra la tabla. Pasa mientras la migración
 * 20260917_buzon_cliente.sql no se haya corrido en Supabase, y NO es un fallo
 * del módulo: es una instalación a medias. Se responde con un aviso que dice
 * qué falta, en vez de un 500 que deja la pantalla rota sin explicar nada.
 */
const SIN_TABLA = 'PGRST205'

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams
    let q = supabaseAdmin.from('buzon_cliente').select('*')
    for (const [campo, valor] of [
      ['cuenta_id', p.get('cuenta_id')], ['cid', p.get('cid')],
      ['area', p.get('area')], ['estado', p.get('estado')],
      ['prioridad', p.get('prioridad')], ['canal', p.get('canal')],
    ] as const) {
      if (valor) q = q.eq(campo, valor)
    }
    const { data, error } = await q.order('fecha_solicitud', { ascending: false })
    if (error) {
      if ((error as { code?: string }).code === SIN_TABLA) {
        return NextResponse.json({
          sinTabla: true,
          error: 'Falta crear la tabla. Ejecuta supabase/migrations/20260917_buzon_cliente.sql en el SQL Editor de Supabase.',
        }, { status: 200 })
      }
      throw error
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const mal = validar(b)
    if (mal) return NextResponse.json({ error: mal }, { status: 400 })

    const estado = b.estado || 'recibida'
    const fila = {
      cuenta_id: b.cuenta_id || null,
      cid: texto(b.cid) || null,
      cliente: texto(b.cliente),
      solicitud: texto(b.solicitud),
      tema: texto(b.tema) || null,
      prioridad: b.prioridad || 'media',
      area: b.area,
      canal: b.canal,
      estado,
      seguimiento: texto(b.seguimiento) || null,
      fecha_solicitud: b.fecha_solicitud || hoyEnMexico(),
      fecha_compromiso: b.fecha_compromiso || null,
      fecha_entrega: b.fecha_entrega || null,
      solucion: derivarSolucion(estado),
      motivo_respuesta: texto(b.motivo_respuesta) || null,
      avisado_al_cliente: !!b.avisado_al_cliente,
      fecha_aviso: b.avisado_al_cliente ? (b.fecha_aviso || hoyEnMexico()) : null,
      registrado_por: texto(b.registrado_por) || null,
      asesor: texto(b.asesor) || null,
    }
    const { data, error } = await supabaseAdmin.from('buzon_cliente').insert(fila).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...cambios } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 })

    // Se valida contra el registro COMPLETO ya fusionado. Validar solo el
    // parche dejaría pasar un «entregada» sin fecha cuando la fecha venía en
    // la fila y el parche solo trae el estado — o al revés.
    const { data: actual, error: e1 } = await supabaseAdmin
      .from('buzon_cliente').select('*').eq('id', id).single()
    if (e1 || !actual) return NextResponse.json({ error: 'No existe ese registro.' }, { status: 404 })

    const fusion = { ...actual, ...cambios }
    const mal = validar(fusion, true)
    if (mal) return NextResponse.json({ error: mal }, { status: 400 })

    if (cambios.estado) {
      fusion.solucion = derivarSolucion(cambios.estado)
      if (!['entregada', 'no_procede'].includes(cambios.estado)) {
        fusion.avisado_al_cliente = false
        fusion.fecha_aviso = null
      }
    }
    if (cambios.avisado_al_cliente && !fusion.fecha_aviso) {
      fusion.fecha_aviso = hoyEnMexico()
    }
    delete (fusion as Record<string, unknown>).created_at
    fusion.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('buzon_cliente').update(fusion).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 })
    const { error } = await supabaseAdmin.from('buzon_cliente').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
