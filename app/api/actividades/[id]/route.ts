import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { TipoSeguimiento } from '@/lib/types'

export const dynamic = 'force-dynamic'

function mapTipo(tipo: string): TipoSeguimiento {
  const m: Record<string, TipoSeguimiento> = {
    llamada: 'llamada', reunion: 'reunion',
    analisis: 'nota', kam: 'nota', upsell: 'upsell',
  }
  return m[tipo] ?? 'nota'
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from('actividades')
      .update({ ...body, actualizado_en: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Si se marcó como completada: crear seguimiento KAM + actualizar ultimo_contacto
    if (body.completada && data.cuenta_id) {
      const today = new Date().toISOString().split('T')[0]

      await supabaseAdmin.from('seguimientos').insert({
        cuenta_id:    data.cuenta_id,
        fecha:        today,
        tipo:         mapTipo(data.tipo),
        descripcion:  data.descripcion,
        resultado:    body.resultado ?? null,
        asesor:       data.asesor,
        duracion_min: null,
      })

      await supabaseAdmin
        .from('cuentas')
        .update({ ultimo_contacto: today })
        .eq('id', data.cuenta_id)
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
