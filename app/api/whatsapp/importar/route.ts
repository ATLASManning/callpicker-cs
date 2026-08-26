import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'
import {
  parseExportacionWhatsApp, nombreDesdeArchivo, analizarConversacion,
  riesgoConversacion, type MensajeWA,
} from '@/lib/whatsapp-analisis'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

/**
 * Ingesta de conversaciones vía "Exportar chat" de WhatsApp.
 *
 * Es la ÚNICA vía compatible con los Términos de Servicio de WhatsApp para
 * leer GRUPOS: la Cloud API oficial de Meta no expone grupos en absoluto, y
 * las librerías no oficiales (whatsapp-web.js, Baileys) violan el ToS y
 * exponen la cuenta a bloqueo.
 *
 * SOLO INSERTA. No actualiza ni borra mensajes: el dedup por hash hace que
 * reimportar el mismo chat no duplique nada, y los mensajes nuevos se suman.
 */

/** Alias del lado Callpicker, para distinguir quién habla en el análisis. */
const NUESTROS_DEFECTO = ['Fátima González', 'Fatima Gonzalez', 'Dan Domínguez', 'Dan Dominguez',
  'Claudia Hernández', 'Claudia Hernandez', 'José Manuel Delgadillo', 'Jose Manuel Delgadillo',
  'Daniel Martínez', 'Daniel Martinez', 'Callpicker', 'Soporte Callpicker']

function hashMensaje(m: MensajeWA): string {
  return createHash('sha1').update(`${m.enviadoEn}|${m.autor}|${m.texto}`).digest('hex').slice(0, 32)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      nombreArchivo?: string
      contenido?:     string
      nombre?:        string
      tipo?:          'individual' | 'grupo'
      cuentaId?:      string | null
      nuestros?:      string[]
    }

    if (!body.contenido || !body.contenido.trim())
      return NextResponse.json({ error: 'No se recibió el contenido del chat exportado.' }, { status: 400 })

    const mensajes = parseExportacionWhatsApp(body.contenido)
    const reales   = mensajes.filter(m => !m.esSistema && m.texto.trim() !== '')

    if (!reales.length)
      return NextResponse.json({
        error: 'No se reconoció ningún mensaje en el archivo. Verifica que sea el .txt que genera WhatsApp con "Exportar chat" (sin archivos multimedia).',
      }, { status: 400 })

    const nombre = (body.nombre?.trim()) || nombreDesdeArchivo(body.nombreArchivo ?? '')
    const nuestros = body.nuestros?.length ? body.nuestros : NUESTROS_DEFECTO
    const nuestrosSet = new Set(nuestros.map(n => n.trim().toLowerCase()))

    // Grupo si hay 3+ interlocutores distintos, salvo que se indique explícito.
    const participantes = Array.from(new Set(reales.map(m => m.autor)))
    const tipo = body.tipo ?? (participantes.length >= 3 ? 'grupo' : 'individual')

    const analisis = analizarConversacion(reales, nuestros)
    const riesgo   = riesgoConversacion(analisis.senales)

    /* ── Conversación: crear o reutilizar (nunca se pisa el histórico) ── */
    const { data: existente } = await supabaseAdmin
      .from('wa_conversaciones')
      .select('id, total_mensajes')
      .ilike('nombre', nombre)
      .maybeSingle()

    let conversacionId: string
    if (existente) {
      conversacionId = existente.id
      await supabaseAdmin.from('wa_conversaciones').update({
        tipo, participantes, riesgo,
        cuenta_id:      body.cuentaId ?? undefined,
        primer_mensaje: analisis.primerMensaje,
        ultimo_mensaje: analisis.ultimoMensaje,
        actualizado_en: new Date().toISOString(),
      }).eq('id', conversacionId)
    } else {
      const { data: nueva, error: errConv } = await supabaseAdmin
        .from('wa_conversaciones')
        .insert({
          nombre, tipo, participantes, riesgo,
          cuenta_id:      body.cuentaId ?? null,
          origen:         'exportacion',
          primer_mensaje: analisis.primerMensaje,
          ultimo_mensaje: analisis.ultimoMensaje,
        })
        .select('id')
        .single()
      if (errConv || !nueva)
        return NextResponse.json({
          error: errConv?.message ?? 'No se pudo crear la conversación',
          migracionPendiente: /relation .* does not exist/i.test(errConv?.message ?? ''),
        }, { status: 500 })
      conversacionId = nueva.id
    }

    /* ── Mensajes: solo INSERT, dedup por hash ─────────────────────────── */
    const filas = reales.map(m => ({
      conversacion_id: conversacionId,
      autor:      m.autor,
      texto:      m.texto,
      enviado_en: m.enviadoEn,
      es_nuestro: nuestrosSet.has(m.autor.trim().toLowerCase()),
      hash:       hashMensaje(m),
    }))

    let insertados = 0
    for (let i = 0; i < filas.length; i += 500) {
      const lote = filas.slice(i, i + 500)
      const { data, error } = await supabaseAdmin
        .from('wa_mensajes')
        .upsert(lote, { onConflict: 'conversacion_id,hash', ignoreDuplicates: true })
        .select('id')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      insertados += data?.length ?? 0
    }

    const { count } = await supabaseAdmin
      .from('wa_mensajes')
      .select('id', { count: 'exact', head: true })
      .eq('conversacion_id', conversacionId)

    await supabaseAdmin.from('wa_conversaciones')
      .update({ total_mensajes: count ?? reales.length })
      .eq('id', conversacionId)

    /* ── Señales ───────────────────────────────────────────────────────── */
    if (analisis.senales.length) {
      const senales = analisis.senales.map(s => ({
        conversacion_id: conversacionId,
        cuenta_id:  body.cuentaId ?? null,
        tipo: s.tipo, severidad: s.severidad, titulo: s.titulo,
        evidencia: s.evidencia, autor: s.autor,
        enviado_en: s.enviadoEn, accion: s.accion,
      }))
      await supabaseAdmin.from('wa_senales')
        .upsert(senales, { onConflict: 'conversacion_id,tipo,enviado_en,autor', ignoreDuplicates: true })
    }

    return NextResponse.json({
      conversacionId, nombre, tipo,
      mensajesEnArchivo: reales.length,
      mensajesNuevos:    insertados,
      totalEnBase:       count ?? reales.length,
      participantes,
      riesgo,
      senales: analisis.senales,
      periodo: { desde: analisis.primerMensaje, hasta: analisis.ultimoMensaje },
      diasSinRespuesta: analisis.diasSinRespuesta,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
