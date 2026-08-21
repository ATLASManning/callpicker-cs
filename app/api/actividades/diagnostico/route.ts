import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'
import { detectDataGaps, CAMPOS_GAP_SELECT, type CuentaGapInput } from '@/lib/data-gaps'

export const dynamic = 'force-dynamic'

interface CuentaMin extends CuentaGapInput {
  id: string
  consecutivo: string
  empresa: string
  health_score: number
  estado: string
}

export async function GET(req: NextRequest) {
  const h       = headers()
  const rol     = h.get('x-user-rol') ?? 'viewer'
  const asesorH = decodeURIComponent(h.get('x-user-asesor') ?? '')

  const { searchParams } = new URL(req.url)
  const asesor = searchParams.get('asesor')

  if (!asesor) return NextResponse.json({ error: 'asesor requerido' }, { status: 400 })

  if (rol === 'asesor' && asesorH !== asesor) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select(`id, consecutivo, empresa, health_score, estado, ${CAMPOS_GAP_SELECT}`)
    .eq('asesor', asesor)
    .in('estado', ['activo', 'en_riesgo'])
    .order('health_score', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const TOTAL_CAMPOS = 11

  const result = (data ?? []).map(c => {
    const gaps = detectDataGaps(c as CuentaMin)
    return {
      id:           c.id,
      consecutivo:  c.consecutivo,
      empresa:      c.empresa,
      health_score: c.health_score,
      estado:       c.estado,
      gaps,
      criticos:     gaps.filter(g => g.nivel === 'critico').length,
      importantes:  gaps.filter(g => g.nivel === 'importante').length,
      deseables:    gaps.filter(g => g.nivel === 'deseable').length,
      pct_completo: Math.round((1 - gaps.length / TOTAL_CAMPOS) * 100),
    }
  }).sort((a, b) => {
    const scoreA = a.criticos * 3 + a.importantes
    const scoreB = b.criticos * 3 + b.importantes
    return scoreB - scoreA
  })

  return NextResponse.json(result)
}
