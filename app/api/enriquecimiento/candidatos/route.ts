/**
 * GET /api/enriquecimiento/candidatos
 * Cola de revisión. RBAC: un asesor solo ve los candidatos de SU cartera;
 * el administrador ve todo y puede filtrar por KAM.
 *
 * Filtros: ?asesor= &estado= &matching= &confianza_min= &campo= &cuenta_id= &limite=
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const rol           = req.headers.get('x-user-rol') ?? 'viewer'
  const asesorSesion  = decodeURIComponent(req.headers.get('x-user-asesor') ?? '')
  const sp            = req.nextUrl.searchParams

  let q = supabaseAdmin
    .from('enriquecimiento_candidatos')
    .select(`id, cuenta_id, asesor, campo, valor_original_snapshot, valor_candidato,
             confianza_score, confianza_nivel, estado_verificacion, fuente_tipo,
             fuente_nombre, fuente_url, evidencia, consultado_en, matching_status,
             proposed_action, review_status, revisado_por, revisado_en, nota_revision,
             cuentas!inner(consecutivo, empresa, estado)`)
    .order('confianza_score', { ascending: false })
    .limit(Math.min(parseInt(sp.get('limite') ?? '300', 10) || 300, 1000))

  // Aislamiento de cartera: el asesor nunca ve cuentas de otro KAM
  if (rol !== 'admin') {
    if (!asesorSesion) {
      return NextResponse.json({ candidatos: [], total: 0, aviso: 'Tu usuario no tiene cartera asignada.' })
    }
    q = q.eq('asesor', asesorSesion)
  } else if (sp.get('asesor')) {
    q = q.eq('asesor', sp.get('asesor')!)
  }

  if (sp.get('estado'))    q = q.eq('review_status', sp.get('estado')!)
  if (sp.get('matching'))  q = q.eq('matching_status', sp.get('matching')!)
  if (sp.get('campo'))     q = q.eq('campo', sp.get('campo')!)
  if (sp.get('cuenta_id')) q = q.eq('cuenta_id', sp.get('cuenta_id')!)
  const min = parseInt(sp.get('confianza_min') ?? '', 10)
  if (Number.isFinite(min)) q = q.gte('confianza_score', min)

  const { data, error } = await q
  if (error) {
    // La tabla puede no existir todavía (migración pendiente)
    return NextResponse.json({ candidatos: [], total: 0, error: error.message })
  }
  return NextResponse.json({ candidatos: data ?? [], total: (data ?? []).length })
}
