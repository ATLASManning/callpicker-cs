/**
 * setup-atlas-ia.mjs — Crea las tablas atlas_bitacora y atlas_pendientes en Supabase.
 * Ejecutar UNA VEZ: node scripts/setup-atlas-ia.mjs
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Lee las credenciales de .env.local o variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  console.error('   Ejecuta: node -r dotenv/config scripts/setup-atlas-ia.mjs')
  process.exit(1)
}

const SQL_BITACORA = `
CREATE TABLE IF NOT EXISTS public.atlas_bitacora (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha            DATE          NOT NULL DEFAULT CURRENT_DATE,
  usuario_email    TEXT          NOT NULL DEFAULT '',
  usuario_nombre   TEXT          NOT NULL DEFAULT '',
  pregunta         TEXT          NOT NULL,
  respuesta        TEXT          NOT NULL,
  tipo             TEXT          NOT NULL DEFAULT 'normal',
  confianza        TEXT          DEFAULT 'alta',
  modulos_contexto TEXT[]        DEFAULT '{}',
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha  ON public.atlas_bitacora(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_email  ON public.atlas_bitacora(usuario_email);
ALTER TABLE public.atlas_bitacora ENABLE ROW LEVEL SECURITY;
`

const SQL_PENDIENTES = `
CREATE TABLE IF NOT EXISTS public.atlas_pendientes (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  pregunta       TEXT         NOT NULL,
  motivo         TEXT,
  usuario_email  TEXT         DEFAULT '',
  usuario_nombre TEXT         DEFAULT '',
  estado         TEXT         DEFAULT 'pendiente',
  respuesta_final TEXT,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  resuelto_en    TIMESTAMPTZ
);
ALTER TABLE public.atlas_pendientes ENABLE ROW LEVEL SECURITY;
`

async function runSQL(sql, label) {
  // Intenta via pg/query (endpoint interno de Supabase Studio)
  try {
    const res = await fetch(`${SUPABASE_URL}/pg/query`, {
      method:  'POST',
      headers: {
        apikey:          SERVICE_KEY,
        Authorization:   `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ query: sql }),
    })
    if (res.ok) {
      console.log(`✅ ${label}: creada correctamente`)
      return true
    }
    const txt = await res.text()
    console.warn(`⚠️  ${label}: endpoint /pg/query no disponible (${res.status}): ${txt}`)
  } catch (e) {
    console.warn(`⚠️  ${label}: fetch error: ${e.message}`)
  }

  // Fallback: usa rpc exec_sql si existe
  try {
    const { createClient } = require('@supabase/supabase-js')
    const sb = createClient(SUPABASE_URL, SERVICE_KEY)
    const { error } = await sb.rpc('exec_sql', { sql })
    if (!error) { console.log(`✅ ${label}: creada via rpc exec_sql`); return true }
    console.warn(`⚠️  ${label}: rpc exec_sql: ${error.message}`)
  } catch {}

  return false
}

async function main() {
  console.log('Atlas IA — Setup de tablas Supabase\n')

  const ok1 = await runSQL(SQL_BITACORA,    'atlas_bitacora')
  const ok2 = await runSQL(SQL_PENDIENTES,  'atlas_pendientes')

  if (!ok1 || !ok2) {
    console.log('\n──────────────────────────────────────────────────────────────')
    console.log('Ejecuta el siguiente SQL manualmente en Supabase Dashboard > SQL Editor:')
    console.log('──────────────────────────────────────────────────────────────\n')
    if (!ok1) console.log(SQL_BITACORA)
    if (!ok2) console.log(SQL_PENDIENTES)
  }
}

main().catch(console.error)
