/**
 * POST /api/admin/migrate-contactos
 * Agrega columnas contactos_json y servicios_json a la tabla cuentas (se llama una sola vez).
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SQL = `
ALTER TABLE cuentas
  ADD COLUMN IF NOT EXISTS contactos_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS servicios_json  jsonb DEFAULT '[]'::jsonb;
`

export async function POST() {
  // Intentar via RPC helper (instalada por la migración anterior)
  const rpc = await supabaseAdmin.rpc('_run_migration', { sql: SQL })

  if (!rpc.error) {
    return NextResponse.json({ ok: true, method: 'rpc' })
  }

  // Fallback — pg/query directo
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const r = await fetch(`${url}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key,
    },
    body: JSON.stringify({ query: SQL }),
  })

  if (!r.ok) {
    return NextResponse.json({
      ok: false,
      sql: SQL.trim(),
      hint: 'Ejecuta este SQL manualmente en Supabase → SQL Editor',
    }, { status: 200 })
  }

  return NextResponse.json({ ok: true, method: 'pg/query' })
}
