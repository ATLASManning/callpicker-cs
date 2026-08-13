import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/chat/bitacora?fecha=YYYY-MM-DD
// Admin: todos los registros del dia. Asesor: solo los suyos.
export async function GET(req: NextRequest) {
  const rol    = req.headers.get('x-user-rol') ?? 'viewer'
  const email  = req.headers.get('x-user-email') ?? ''
  const fecha  = req.nextUrl.searchParams.get('fecha') ??
    new Date().toISOString().split('T')[0]

  let q = supabaseAdmin
    .from('atlas_bitacora')
    .select('id,fecha,usuario_email,usuario_nombre,pregunta,respuesta,tipo,confianza,modulos_contexto,created_at')
    .eq('fecha', fecha)
    .order('created_at', { ascending: true })

  if (rol !== 'admin') {
    q = q.eq('usuario_email', email)
  }

  const { data, error } = await q
  if (error) {
    // Tabla puede no existir aun
    return NextResponse.json({ entries: [], error: error.message })
  }
  return NextResponse.json({ entries: data ?? [] })
}

// GET /api/chat/bitacora/pendientes
// Solo admin
export async function POST(req: NextRequest) {
  const rol = req.headers.get('x-user-rol') ?? 'viewer'
  if (rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('atlas_pendientes')
    .select('*')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ pendientes: [], error: error.message })
  return NextResponse.json({ pendientes: data ?? [] })
}
