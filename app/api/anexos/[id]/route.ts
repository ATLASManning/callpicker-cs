import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { esAdminDelTablero } from '@/lib/auth'
import { BUCKET, type Anexo } from '@/lib/anexos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/* ── DELETE /api/anexos/[id] ─────────────────────────────────────────────
 *
 * Borra el registro Y el archivo. En ese orden importa poco, pero si el objeto
 * no se retira queda ocupando el bucket sin que nada lo mencione.
 *
 * QUIÉN PUEDE: la administración del tablero, o quien subió el documento.
 * Cerrado por correo y no por rol, que es la regla de dirección desde el 23
 * sep 2026 — ver `esAdminDelTablero` en lib/auth.ts. Un documento de cliente
 * que cualquier sesión pueda borrar es un documento que se pierde sin rastro.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const email = req.headers.get('x-user-email') ?? ''

  const { data, error } = await supabaseAdmin
    .from('anexos')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'No existe ese anexo.' }, { status: 404 })

  const anexo = data as Anexo
  const esDueno = !!email && !!anexo.subido_por
    && email.toLowerCase() === anexo.subido_por.toLowerCase()
  if (!esAdminDelTablero(email) && !esDueno) {
    return NextResponse.json({
      error: 'sin_permiso',
      mensaje: 'Sólo la administración del tablero o quien subió el documento pueden eliminarlo.',
    }, { status: 403 })
  }

  const { error: errBorrar } = await supabaseAdmin.from('anexos').delete().eq('id', id)
  if (errBorrar) return NextResponse.json({ error: errBorrar.message }, { status: 500 })

  // Si esto falla el registro ya no está, así que el objeto queda huérfano en
  // el bucket. Se reporta en la respuesta en vez de callarlo.
  const { error: errObjeto } = await supabaseAdmin.storage
    .from(BUCKET).remove([anexo.archivo_ruta])

  return NextResponse.json({
    ok: true,
    archivoRetirado: !errObjeto,
    ...(errObjeto ? { aviso: 'El registro se borró pero el archivo sigue en el almacenamiento.' } : {}),
  })
}
