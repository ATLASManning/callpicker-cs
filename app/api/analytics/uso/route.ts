import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email  = searchParams.get('email')
  const asesor = searchParams.get('asesor')

  if (!email && !asesor) return NextResponse.json({ error: 'email or asesor required' }, { status: 400 })

  let q = supabaseAdmin.from('uso_dashboard').select('*')
  if (email)  q = q.eq('email', email)
  else        q = q.eq('asesor', asesor!)

  const { data, error } = await q.order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rows: data ?? [] })
}
