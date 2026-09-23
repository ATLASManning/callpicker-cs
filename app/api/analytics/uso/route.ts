import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { esAdminDelTablero } from '@/lib/auth'

/**
 * LECTURA de la analítica de navegación. Cerrada a la administración del
 * tablero (23 sep 2026), igual que la pantalla que la consume.
 *
 * No estaba: `/api/analytics` entero vive en COMUNES_APIS de lib/permisos.ts,
 * así que cualquier rol podía pedir el uso de CUALQUIER persona con solo poner
 * el correo en la URL. Cerrar «Uso Dashboard» en el menú y dejar esto abierto
 * habría sido cerrar la puerta y dejar la ventana.
 *
 * OJO: esto es la ruta de LECTURA. `/api/analytics/pageview` —la que escribe—
 * tiene que seguir abierta a todos: es la que registra la navegación de cada
 * quien, y cerrarla dejaría de alimentar la tabla.
 *
 * Se lee `req.headers`, NO `headers()` de next/headers: es el patrón que usa
 * todo el repo —/api/cuentas, /api/actividades— y por tanto el único que aquí
 * está probado en producción. El middleware inyecta estas cabeceras con
 * `res.headers.set()`, una vía poco común, y no es el sitio para estrenar una
 * forma distinta de leerlas.
 */
export async function GET(req: NextRequest) {
  if (!esAdminDelTablero(req.headers.get('x-user-email'))) {
    return NextResponse.json(
      { error: 'Solo la administración del tablero puede consultar el uso.' },
      { status: 403 },
    )
  }
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
