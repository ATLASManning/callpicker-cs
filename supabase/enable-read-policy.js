/**
 * Disable RLS restrictions for read access on all CS tables.
 * Run once: node supabase/enable-read-policy.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

async function main() {
  // Test read with anon key to confirm RLS is the issue
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  const { data: anonData, error: anonError } = await anonClient
    .from('cuentas')
    .select('id', { count: 'exact', head: true })

  console.log('Anon key count:', anonData, 'error:', anonError?.message)

  const { count: serviceCount } = await supabase
    .from('cuentas')
    .select('id', { count: 'exact', head: true })

  console.log('Service key count:', serviceCount)

  if (anonError) {
    console.log('\n→ RLS is blocking anon reads. This is why Vercel shows wrong data.')
    console.log('→ Run this SQL in Supabase SQL Editor to fix:')
    console.log(`
ALTER TABLE cuentas          DISABLE ROW LEVEL SECURITY;
ALTER TABLE seguimientos     DISABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades    DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets          DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mensajes    DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_score_historial DISABLE ROW LEVEL SECURITY;
    `)
  } else {
    console.log('\nAnon reads work — RLS is not the issue.')
    console.log('Anon sees', anonData, 'records vs service role sees', serviceCount)
  }
}

main().catch(console.error)
