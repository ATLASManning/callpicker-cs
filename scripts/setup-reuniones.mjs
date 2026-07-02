/**
 * scripts/setup-reuniones.mjs
 * Crea la tabla reuniones en Supabase usando el service role key
 * Ejecutar: node scripts/setup-reuniones.mjs
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Leer .env.local
function loadEnv() {
  try {
    const env = readFileSync(join(__dir, '..', '.env.local'), 'utf-8')
    const vars = {}
    for (const line of env.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) vars[m[1].trim()] = m[2].trim()
    }
    return vars
  } catch { return {} }
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY
const PROJECT_REF  = SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1]

const SQL = `
CREATE TABLE IF NOT EXISTS public.reuniones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'junta_semanal',
  titulo TEXT NOT NULL,
  participantes TEXT DEFAULT '',
  resumen TEXT DEFAULT '',
  acuerdos TEXT DEFAULT '',
  proximos_pasos TEXT DEFAULT '',
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON public.reuniones TO anon, authenticated, service_role;
`

async function tryManagementApi() {
  console.log(`\n▶ Intentando Management API (project: ${PROJECT_REF})...`)
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: SQL }),
    }
  )
  const text = await res.text()
  console.log(`  Status: ${res.status}`)
  if (res.ok) {
    console.log('  ✅ Tabla creada via Management API')
    return true
  }
  console.log(`  ✗ ${text.slice(0, 200)}`)
  return false
}

async function tryRpc() {
  console.log('\n▶ Intentando RPC exec_sql...')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ sql: SQL }),
  })
  const text = await res.text()
  console.log(`  Status: ${res.status}`)
  if (res.ok) {
    console.log('  ✅ Tabla creada via RPC')
    return true
  }
  console.log(`  ✗ ${text.slice(0, 200)}`)
  return false
}

async function verifyTable() {
  console.log('\n▶ Verificando tabla...')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reuniones?select=count&limit=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
  })
  if (res.ok) {
    console.log('  ✅ Tabla reuniones existe y es accesible')
    return true
  }
  const text = await res.text()
  console.log(`  ✗ Tabla no existe aún: ${text.slice(0, 150)}`)
  return false
}

async function main() {
  console.log('═══════════════════════════════════════')
  console.log('  Setup: tabla reuniones en Supabase')
  console.log('═══════════════════════════════════════')
  console.log(`URL: ${SUPABASE_URL}`)
  console.log(`Key: ${SERVICE_KEY?.slice(0, 20)}...`)

  // Verificar si ya existe
  if (await verifyTable()) {
    console.log('\n✅ Ya está lista. No se requiere acción.')
    return
  }

  // Intentar creación
  const ok = await tryManagementApi() || await tryRpc()

  if (ok) {
    await verifyTable()
  } else {
    console.log('\n⚠  No fue posible crear la tabla automáticamente.')
    console.log('   Ejecuta este SQL manualmente en Supabase → SQL Editor:\n')
    console.log('─'.repeat(60))
    console.log(SQL)
    console.log('─'.repeat(60))
    console.log('\n   URL: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new')
  }
}

main().catch(console.error)
