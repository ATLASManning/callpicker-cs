import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { esAdminDelTablero } from '@/lib/auth'

/**
 * ESCRITURA de la analítica de navegación. Abierta a todos los roles a
 * propósito: es la que registra la navegación de cada quien, y cerrarla dejaría
 * de alimentar la tabla que lee Uso Dashboard.
 *
 * EL CANDADO DE PERTENENCIA (24 sep 2026)
 * ---------------------------------------
 * «Abierta a todos» no es lo mismo que «cada quien puede tocar lo de los
 * demás». Hasta hoy la actualización de duración solo pedía un `id`, así que
 * cualquiera con sesión podía reescribir la duración de un registro AJENO —
 * inflar el suyo o poner a cero el de otro— y el tablero de uso lo habría
 * contado como bueno. Nadie lo explotó: el `id` es un UUID que no se adivina y
 * no hay ruta que los liste. Pero apoyarse en eso es apoyarse en el secreto del
 * identificador, no en un permiso.
 *
 * Ahora una fila solo la actualiza su dueño: el `UPDATE` lleva el correo de la
 * sesión en el `WHERE`, de modo que la comprobación y la escritura son la misma
 * operación y no hay hueco entre leer quién es el dueño y escribir.
 *
 * LA ESCOTILLA, QUE ES DELIBERADA
 * -------------------------------
 * La administración del tablero (`esAdminDelTablero`) escribe sobre cualquier
 * fila. Un candado que también le cierre la puerta a quien lo pidió deja de ser
 * un candado y pasa a ser un estorbo: el día que haya que corregir un dato a
 * mano, la respuesta no puede ser «no se puede». El permiso se comprueba con el
 * mismo predicado que Gestión de Usuarios, no con el rol.
 */

/** El correo de la sesión, que inyecta el middleware en cada request. */
function correoDeSesion(): string {
  return (headers().get('x-user-email') ?? '').trim().toLowerCase()
}

/**
 * Actualiza la duración de una visita, comprobando la pertenencia en el propio
 * `WHERE`. Devuelve la respuesta ya armada.
 */
async function actualizarDuracion(id: string, duracion_seg: unknown) {
  const email = correoDeSesion()
  // Sin correo no se escribe. Antes esto no se miraba siquiera; ahora un
  // request sin sesión no puede tocar nada, y se dice en vez de fallar callando.
  if (!email) {
    return NextResponse.json({ error: 'sin sesión' }, { status: 401 })
  }

  // `duracion_seg` viene del navegador: se valida en vez de confiar. Un valor
  // absurdo desplazaría las medianas del módulo de uso.
  const segs = Number(duracion_seg)
  if (!Number.isFinite(segs) || segs < 0 || segs > 86400) {
    return NextResponse.json({ error: 'duración fuera de rango' }, { status: 400 })
  }

  let q = supabaseAdmin
    .from('uso_dashboard')
    .update({ duracion_seg: Math.round(segs) })
    .eq('id', id)

  // El dueño, o la administración del tablero. Se filtra en el UPDATE y no con
  // un SELECT previo: así no hay ventana entre comprobar y escribir.
  if (!esAdminDelTablero(email)) q = q.eq('email', email)

  const { data, error } = await q.select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Cero filas = o el id no existe, o es de otro. No se distingue a propósito:
  // decir cuál sería confirmarle a quien prueba que ese id existe.
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'no encontrado' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

// POST — nueva visita a página (retorna { id })
// POST con campo `id` — actualizar duración (enviado via sendBeacon)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // sendBeacon no puede enviar PATCH; detectar si es un update por presencia de `id`
    if (body.id && body.duracion_seg !== undefined) {
      return await actualizarDuracion(String(body.id), body.duracion_seg)
    }

    const email  = correoDeSesion()
    const asesor = decodeURIComponent(headers().get('x-user-asesor') ?? '')

    const { ruta, seccion } = body as { ruta: string; seccion: string }
    if (!ruta || !seccion || !email) return NextResponse.json({ error: 'missing' }, { status: 400 })

    // El correo sale de la SESIÓN, nunca del cuerpo del request: si viniera del
    // cliente, cualquiera podría escribir visitas a nombre de otro.
    const { data, error } = await supabaseAdmin
      .from('uso_dashboard')
      .insert({ email, asesor, ruta, seccion })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id })
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

// PATCH — actualizar duración al salir de la página (cuando no hay sendBeacon)
export async function PATCH(req: NextRequest) {
  try {
    const { id, duracion_seg } = await req.json()
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    // Misma función que el POST: dos verbos que hacen lo mismo tienen que
    // tener el mismo candado, o el flojo es el que manda.
    return await actualizarDuracion(String(id), duracion_seg)
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
