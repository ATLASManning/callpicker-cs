import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const URL_SB  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const ref     = URL_SB.match(/https:\/\/([^.]+)\./)?.[1]

if (!URL_SB || !SERVICE) { console.error('Faltan env vars'); process.exit(1) }

// Supabase Management API — ejecuta SQL directo
async function runSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query: sql }),
  })
  const body = await res.text()
  return { status: res.status, body }
}

// Alternativa: usar PostgREST rpc si existe función exec_sql
const sb = createClient(URL_SB, SERVICE, { auth: { persistSession: false } })

// Intentar crear tabla vía SQL directo
const sql = `
CREATE TABLE IF NOT EXISTS public.reuniones (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha          DATE        NOT NULL,
  tipo           TEXT        NOT NULL DEFAULT 'junta_semanal',
  titulo         TEXT        NOT NULL,
  participantes  TEXT        DEFAULT '',
  resumen        TEXT        DEFAULT '',
  acuerdos       TEXT        DEFAULT '',
  proximos_pasos TEXT        DEFAULT '',
  creado_en      TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
`

console.log('Intentando crear tabla reuniones...')
const r = await runSQL(sql)
console.log('Management API response:', r.status, r.body)

// Verificar que se pueda leer
const { data, error } = await sb.from('reuniones').select('id').limit(1)
if (error) {
  console.log('\n❌ La tabla no existe aún. Crea manualmente en Supabase Dashboard > SQL Editor:\n')
  console.log(sql)
} else {
  console.log('✅ Tabla reuniones accesible. Filas:', data?.length ?? 0)
}
