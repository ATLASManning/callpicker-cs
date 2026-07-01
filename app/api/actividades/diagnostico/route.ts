import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

interface DataGapInfo {
  campo: string
  nivel: 'critico' | 'importante' | 'deseable'
}

interface CuentaMin {
  id: string
  consecutivo: string
  empresa: string
  health_score: number
  estado: string
  contacto_nombre: string | null
  contacto_cargo: string | null
  contacto_tel: string | null
  giro: string | null
  nps_score: number | null
  observaciones_kam: string | null
  total_empleados: string | null
  num_oficinas: string | null
  pagina_web: string | null
}

function detectDataGaps(c: CuentaMin): DataGapInfo[] {
  const gaps: DataGapInfo[] = []
  if (!c.contacto_nombre)   gaps.push({ campo: 'Contacto principal',    nivel: 'critico' })
  if (!c.contacto_cargo)    gaps.push({ campo: 'Cargo del contacto',    nivel: 'critico' })
  if (!c.contacto_tel)      gaps.push({ campo: 'Teléfono directo',      nivel: 'critico' })
  if (!c.giro)              gaps.push({ campo: 'Giro / Industria',      nivel: 'importante' })
  if (!c.nps_score)         gaps.push({ campo: 'NPS (satisfacción)',    nivel: 'importante' })
  if (!c.observaciones_kam) gaps.push({ campo: 'Observaciones KAM',    nivel: 'importante' })
  if (!c.total_empleados)   gaps.push({ campo: 'No. de empleados',      nivel: 'deseable' })
  if (!c.num_oficinas)      gaps.push({ campo: 'No. de sitios',         nivel: 'deseable' })
  if (!c.pagina_web)        gaps.push({ campo: 'Sitio web',             nivel: 'deseable' })
  return gaps
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
    .select('id, consecutivo, empresa, health_score, estado, contacto_nombre, contacto_cargo, contacto_tel, giro, nps_score, observaciones_kam, total_empleados, num_oficinas, pagina_web')
    .eq('asesor', asesor)
    .in('estado', ['activo', 'en_riesgo'])
    .order('health_score', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const TOTAL_CAMPOS = 9

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
