import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET'
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT_SET'
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || 'NOT_SET'

  // Test with service role key
  let serviceCount = 0
  let serviceError = null
  if (service !== 'NOT_SET') {
    const client = createClient(url, service)
    const { count, error } = await client
      .from('cuentas')
      .select('*', { count: 'exact', head: true })
    serviceCount = count ?? -1
    serviceError = error?.message ?? null
  }

  // Test with anon key
  let anonCount = 0
  let anonError = null
  if (anon !== 'NOT_SET') {
    const client = createClient(url, anon)
    const { count, error } = await client
      .from('cuentas')
      .select('*', { count: 'exact', head: true })
    anonCount = count ?? -1
    anonError = error?.message ?? null
  }

  return NextResponse.json({
    supabase_url: url,
    anon_key_prefix: anon.slice(0, 20),
    service_key_set: service !== 'NOT_SET',
    service_key_prefix: service !== 'NOT_SET' ? service.slice(0, 20) : 'NOT_SET',
    service_count: serviceCount,
    service_error: serviceError,
    anon_count: anonCount,
    anon_error: anonError,
  })
}
