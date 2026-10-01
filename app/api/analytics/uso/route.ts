import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, traerPorPaginas } from '@/lib/supabase'
import { puedeVerUsoDashboard } from '@/lib/auth'

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
  // `puedeVerUsoDashboard` y no `esAdminDelTablero`: desde el 24 sep 2026 esta
  // pantalla tiene su propia lista, más ancha que la de Gestión de Usuarios.
  // Tiene que ser EL MISMO predicado que usa el middleware — si se separan, o
  // la página rebota teniendo permiso, o la API abre de más.
  if (!puedeVerUsoDashboard(req.headers.get('x-user-email'))) {
    return NextResponse.json(
      { error: 'No tienes acceso a la analítica de uso del tablero.' },
      { status: 403 },
    )
  }
  const { searchParams } = new URL(req.url)
  const email  = searchParams.get('email')
  const asesor = searchParams.get('asesor')

  if (!email && !asesor) return NextResponse.json({ error: 'email or asesor required' }, { status: 400 })

  /* Por páginas, no en una sola lectura. PostgREST corta en mil filas sin error
     y sin bandera, y aquí YA cortaba: medido el 30 sep 2026, el correo
     josel@callpicker.com tiene 1,240 registros de navegación y llegaban 1,000 —
     240 visitas que no existían para el análisis. Las tres asesoras todavía
     caben (359, 354 y 279), así que esto no es prevención: la administración
     veía su propio uso incompleto desde hace meses. */
  const filas = await traerPorPaginas<Record<string, unknown>>((desde, hasta) => {
    const q = supabaseAdmin.from('uso_dashboard').select('*')
    return (email ? q.eq('email', email) : q.eq('asesor', asesor!))
      .order('created_at', { ascending: true })
      .range(desde, hasta)
  })

  return NextResponse.json({ rows: filas })
}
