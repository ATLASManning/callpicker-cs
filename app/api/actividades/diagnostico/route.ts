import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'
import {
  detectDataGaps, conciliarGaps, CAMPOS_GAP_SELECT,
  type CuentaGapInput, type CandidatoParaConciliar,
} from '@/lib/data-gaps'

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

  /* Lo que Atlas ya localizó, para no pedirle al KAM un dato que ya existe.
   * Si la tabla aún no está creada, la conciliación simplemente no aplica. */
  const porCuenta = new Map<string, CandidatoParaConciliar[]>()
  try {
    const { data: cands } = await supabaseAdmin
      .from('enriquecimiento_candidatos')
      .select('cuenta_id, campo, valor_candidato, confianza_score, fuente_nombre')
      .eq('asesor', asesor)
      .neq('review_status', 'incorrecto')
    for (const c of cands ?? []) {
      const arr = porCuenta.get(c.cuenta_id) ?? []
      arr.push(c as unknown as CandidatoParaConciliar)
      porCuenta.set(c.cuenta_id, arr)
    }
  } catch { /* sin enriquecimiento: se reporta el hueco tal cual */ }

  const TOTAL_CAMPOS = 11

  const result = (data ?? []).map(c => {
    const gaps = conciliarGaps(detectDataGaps(c as CuentaMin), porCuenta.get(c.id) ?? [])
    const porConseguir = gaps.filter(g => !g.localizado)
    const porConfirmar = gaps.filter(g => g.localizado)
    return {
      id:           c.id,
      consecutivo:  c.consecutivo,
      empresa:      c.empresa,
      health_score: c.health_score,
      estado:       c.estado,
      gaps,
      por_conseguir: porConseguir.length,
      por_confirmar: porConfirmar.length,
      criticos:     porConseguir.filter(g => g.nivel === 'critico').length,
      importantes:  porConseguir.filter(g => g.nivel === 'importante').length,
      deseables:    porConseguir.filter(g => g.nivel === 'deseable').length,
      // La completitud real cuenta como resuelto lo que Atlas ya localizó,
      // aunque siga pendiente de confirmar con el cliente.
      pct_completo: Math.round((1 - porConseguir.length / TOTAL_CAMPOS) * 100),
      pct_capturado: Math.round((1 - gaps.length / TOTAL_CAMPOS) * 100),
    }
  }).sort((a, b) => {
    const scoreA = a.criticos * 3 + a.importantes
    const scoreB = b.criticos * 3 + b.importantes
    return scoreB - scoreA
  })

  return NextResponse.json(result)
}
