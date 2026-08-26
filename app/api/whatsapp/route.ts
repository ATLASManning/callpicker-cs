import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Bandeja de conversaciones de WhatsApp.
 *
 * MÓDULO DE SOLA OBSERVACIÓN: aquí no existe —ni existirá— endpoint para
 * editar o eliminar mensajes. La tabla wa_mensajes además lo bloquea con
 * triggers a nivel de motor (ver scripts/migracion-whatsapp.sql).
 */

interface ConversacionRow {
  id: string; nombre: string; tipo: string; cuenta_id: string | null
  total_mensajes: number; primer_mensaje: string | null; ultimo_mensaje: string | null
  riesgo: number; participantes: string[] | null; origen: string
}

export async function GET(req: NextRequest) {
  const sp    = req.nextUrl.searchParams
  const modo  = sp.get('modo') ?? 'bandeja'

  try {
    /* ── Señales pendientes (warnings del Dashboard) ─────────────────── */
    if (modo === 'senales') {
      const { data, error } = await supabaseAdmin
        .from('wa_senales')
        .select('*, wa_conversaciones!inner(nombre, tipo, cuenta_id, archivada)')
        .eq('atendida', false)
        .eq('wa_conversaciones.archivada', false)
        .order('creado_en', { ascending: false })
        .limit(200)

      if (error) return NextResponse.json({ error: error.message, migracionPendiente: true }, { status: 200 })

      const orden: Record<string, number> = { critica: 0, alta: 1, media: 2, info: 3 }
      const senales = (data ?? []).sort(
        (a, b) => (orden[a.severidad] ?? 9) - (orden[b.severidad] ?? 9)
      )
      return NextResponse.json({ senales, total: senales.length })
    }

    /* ── Bandeja: conversaciones + cuenta vinculada ──────────────────── */
    const { data: convs, error } = await supabaseAdmin
      .from('wa_conversaciones')
      .select('*')
      .eq('archivada', false)
      .order('riesgo', { ascending: false })
      .order('ultimo_mensaje', { ascending: false })

    if (error) return NextResponse.json({ conversaciones: [], migracionPendiente: true, error: error.message })

    const lista = (convs ?? []) as ConversacionRow[]
    const ids   = lista.map(c => c.cuenta_id).filter(Boolean) as string[]

    // Enriquecer con datos de la cuenta: TOP se deriva de facturación, igual
    // que en el resto del Dashboard — no se guarda como bandera aparte.
    let cuentasMap = new Map<string, Record<string, unknown>>()
    if (ids.length) {
      const { data: cuentas } = await supabaseAdmin
        .from('cuentas')
        .select('id, consecutivo, empresa, asesor, estado, health_score, facturacion, score_adopcion')
        .in('id', ids)
      cuentasMap = new Map((cuentas ?? []).map(c => [c.id as string, c]))
    }

    // Conteo de señales pendientes por conversación
    const { data: sen } = await supabaseAdmin
      .from('wa_senales')
      .select('conversacion_id, severidad')
      .eq('atendida', false)

    const senPorConv = new Map<string, { criticas: number; total: number }>()
    for (const s of sen ?? []) {
      const cur = senPorConv.get(s.conversacion_id) ?? { criticas: 0, total: 0 }
      cur.total++
      if (s.severidad === 'critica') cur.criticas++
      senPorConv.set(s.conversacion_id, cur)
    }

    const conversaciones = lista.map(c => {
      const cta = c.cuenta_id ? cuentasMap.get(c.cuenta_id) : null
      const fact = Number(cta?.facturacion ?? 0)
      const adop = Number(cta?.score_adopcion ?? 0)
      return {
        ...c,
        cuenta: cta ?? null,
        esTop:  Boolean(cta) && (fact >= 3000 || adop >= 70),
        senalesPendientes: senPorConv.get(c.id)?.total ?? 0,
        senalesCriticas:   senPorConv.get(c.id)?.criticas ?? 0,
      }
    })

    return NextResponse.json({
      conversaciones,
      total: conversaciones.length,
      grupos: conversaciones.filter(c => c.tipo === 'grupo').length,
      top:    conversaciones.filter(c => c.esTop).length,
      conRiesgo: conversaciones.filter(c => c.senalesCriticas > 0).length,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
