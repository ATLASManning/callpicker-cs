/**
 * POST /api/admin/migrate
 * Crea la tabla adopcion_producto si no existe, usando una función SQL
 * que se auto-instala en Supabase la primera vez.
 *
 * Se llama una sola vez desde el componente cuando detecta que la tabla falta.
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const CREATE_EXEC_FN = `
CREATE OR REPLACE FUNCTION _run_migration(sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN EXECUTE sql; END;
$$;
`

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS adopcion_producto (
  id          bigserial    PRIMARY KEY,
  cuenta_id   bigint       NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  producto    text         NOT NULL,
  nivel       text         NOT NULL CHECK (nivel IN ('alto','medio','bajo','no_aplica')),
  fecha       date         NOT NULL DEFAULT CURRENT_DATE,
  asesor      text,
  notas       text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_adopcion_cuenta_id ON adopcion_producto(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_adopcion_cuenta_producto
  ON adopcion_producto(cuenta_id, producto, created_at DESC);
ALTER TABLE adopcion_producto ENABLE ROW LEVEL SECURITY;
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'adopcion_producto' AND policyname = 'service_role_all'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role_all" ON adopcion_producto FOR ALL USING (true)';
  END IF;
END $do$;
`

export async function POST() {
  // Paso 1 — intentar crear la función helper
  const step1 = await supabaseAdmin.rpc('_run_migration', { sql: 'SELECT 1' })

  if (step1.error?.code === 'PGRST202') {
    // La función no existe — necesitamos crearla primero
    // Intentar con el endpoint de query directo
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Supabase expone /pg/query con service role en proyectos recientes
    const r = await fetch(`${url}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'apikey': key,
      },
      body: JSON.stringify({ query: CREATE_EXEC_FN + CREATE_TABLE }),
    })

    if (!r.ok) {
      const body = await r.text()
      return NextResponse.json({
        ok: false,
        method: 'pg/query',
        status: r.status,
        error: body,
        sql: CREATE_TABLE.trim(),  // devolver el SQL para que el usuario lo pegue
      }, { status: 200 })  // 200 para que el cliente pueda leer el SQL
    }

    return NextResponse.json({ ok: true, method: 'pg/query' })
  }

  // Paso 2 — la función existe, usarla para crear la tabla
  const step2 = await supabaseAdmin.rpc('_run_migration', { sql: CREATE_TABLE })
  if (step2.error) {
    return NextResponse.json({
      ok: false,
      method: 'rpc',
      error: step2.error.message,
      sql: CREATE_TABLE.trim(),
    }, { status: 200 })
  }

  return NextResponse.json({ ok: true, method: 'rpc' })
}
