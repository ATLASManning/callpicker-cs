/**
 * GET /api/admin/migrate-password
 * Ruta one-time: agrega las columnas password_hash y password_expira a la tabla usuarios.
 * Llámala UNA VEZ desde el browser como admin, luego puede borrarse.
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const steps: string[] = []
  let errors: string[] = []

  /* Verificar que la tabla existe */
  const { data: check, error: checkErr } = await supabaseAdmin
    .from('usuarios').select('id').limit(1)
  if (checkErr) {
    return NextResponse.json({ ok: false, error: 'No se pudo conectar a la tabla usuarios: ' + checkErr.message })
  }
  steps.push('✅ Tabla usuarios accesible')

  /* Intentar insertar fila temporal con los nuevos campos para forzar la creación
     NOTA: esto no funcionará — necesitas correr el SQL manual en Supabase */
  const SQL = `
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS password_hash    TEXT,
  ADD COLUMN IF NOT EXISTS password_expira  TIMESTAMPTZ;
`
  return NextResponse.json({
    ok: false,
    mensaje: 'Las columnas NO se pueden crear automáticamente desde aquí. Por favor ejecuta el siguiente SQL en el Editor SQL de Supabase (supabase.com → tu proyecto → SQL Editor):',
    sql: SQL.trim(),
    steps,
  })
}
