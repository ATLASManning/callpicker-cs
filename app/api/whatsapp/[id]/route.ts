import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Detalle de una conversación: mensajes (solo lectura) + señales.
 *
 * NO existe DELETE ni edición de mensajes en este módulo, por instrucción de
 * dirección: es de sola observación. wa_mensajes lo refuerza con triggers que
 * rechazan UPDATE y DELETE a nivel de motor.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: conv, error } = await supabaseAdmin
      .from('wa_conversaciones').select('*').eq('id', params.id).single()
    if (error || !conv)
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })

    const limite = Number(req.nextUrl.searchParams.get('limite') ?? 400)
    const { data: mensajes } = await supabaseAdmin
      .from('wa_mensajes')
      .select('id, autor, texto, enviado_en, es_nuestro')
      .eq('conversacion_id', params.id)
      .order('enviado_en', { ascending: false })
      .limit(limite)

    const { data: senales } = await supabaseAdmin
      .from('wa_senales')
      .select('*')
      .eq('conversacion_id', params.id)
      .order('creado_en', { ascending: false })

    let cuenta = null
    if (conv.cuenta_id) {
      const { data } = await supabaseAdmin
        .from('cuentas')
        .select('id, consecutivo, cid, empresa, asesor, estado, health_score, facturacion, score_adopcion, dias_sin_actividad')
        .eq('id', conv.cuenta_id).single()
      cuenta = data
    }

    return NextResponse.json({
      conversacion: conv,
      cuenta,
      mensajes: (mensajes ?? []).reverse(),  // cronológico ascendente para el hilo
      senales:  senales ?? [],
      soloLectura: true,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

/**
 * Únicas mutaciones permitidas, y ninguna toca el contenido de los mensajes:
 *  - vincular la conversación a una cuenta (metadato)
 *  - marcar una señal como atendida (flujo de trabajo)
 *  - archivar una importación equivocada (se oculta, no se destruye)
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json() as {
      accion: 'vincular' | 'atender_senal' | 'archivar'
      cuentaId?: string | null
      senalId?:  string
      usuario?:  string
      motivo?:   string
    }

    if (body.accion === 'vincular') {
      const { data, error } = await supabaseAdmin
        .from('wa_conversaciones')
        .update({ cuenta_id: body.cuentaId ?? null, actualizado_en: new Date().toISOString() })
        .eq('id', params.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      // Propagar la cuenta a sus señales, para que aparezcan en la ficha.
      await supabaseAdmin.from('wa_senales')
        .update({ cuenta_id: body.cuentaId ?? null }).eq('conversacion_id', params.id)
      return NextResponse.json(data)
    }

    if (body.accion === 'atender_senal') {
      if (!body.senalId) return NextResponse.json({ error: 'senalId requerido' }, { status: 400 })
      const { data, error } = await supabaseAdmin
        .from('wa_senales')
        .update({ atendida: true, atendida_por: body.usuario ?? null, atendida_en: new Date().toISOString() })
        .eq('id', body.senalId).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (body.accion === 'archivar') {
      const { data, error } = await supabaseAdmin
        .from('wa_conversaciones')
        .update({
          archivada: true, archivada_por: body.usuario ?? null,
          archivada_en: new Date().toISOString(),
          motivo_archivo: body.motivo ?? 'Sin motivo especificado',
        })
        .eq('id', params.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ...data, nota: 'La conversación se ocultó de la bandeja. Los mensajes NO se eliminaron: siguen siendo auditables.' })
    }

    return NextResponse.json({ error: 'Acción no permitida en un módulo de sola observación.' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
