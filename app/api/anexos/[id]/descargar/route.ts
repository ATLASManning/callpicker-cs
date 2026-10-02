import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { BUCKET, type Anexo } from '@/lib/anexos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/* ── GET /api/anexos/[id]/descargar ──────────────────────────────────────
 *
 * LA RUTA NO TERMINA EN EXTENSIÓN, Y ESO NO ES ESTILO.
 *
 * `middleware.ts` deja pasar SIN SESIÓN toda ruta que case con `/\.\w+$/` —es
 * lo que los recursos estáticos necesitan—. Si esta ruta fuera
 * `/api/anexos/[id]/documento.pdf`, cualquiera con la URL se bajaría un
 * contrato de cliente sin estar autenticado, y el bucket privado no serviría
 * de nada porque quien lee el objeto es el servidor, con la llave de servicio.
 *
 * El nombre real del archivo viaja en `Content-Disposition`, que es donde debe
 * ir: el navegador lo guarda con su nombre y su extensión igual.
 *
 * El archivo NUNCA se sirve con una URL firmada de Supabase. Una URL firmada
 * es un enlace que funciona para cualquiera que lo tenga, y una vez copiada ya
 * no pasa por esta puerta. Aquí el servidor lee el objeto y lo entrega él.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('anexos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'La tabla `anexos` no existe.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'No existe ese anexo.' }, { status: 404 })

  const anexo = data as Anexo
  const { data: objeto, error: errBajar } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(anexo.archivo_ruta)

  if (errBajar || !objeto) {
    return NextResponse.json(
      { error: 'El archivo ya no está en el almacenamiento.', detalle: errBajar?.message },
      { status: 404 })
  }

  /* El nombre va entre comillas y además en `filename*` codificado: un
     documento llamado «Análisis Petroil.pdf» tiene acentos y espacios, y sin
     esto el navegador lo guarda truncado o con el nombre roto. */
  const nombre = anexo.archivo_nombre || `${anexo.nombre_documento}`
  const seguro = nombre.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '')

  return new NextResponse(await objeto.arrayBuffer(), {
    headers: {
      'Content-Type': anexo.archivo_tipo || 'application/octet-stream',
      'Content-Disposition':
        `attachment; filename="${seguro}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      'Content-Length': String(anexo.archivo_bytes),
      // Documento de cliente: que no quede en cachés intermedias.
      'Cache-Control': 'private, no-store',
      // Nunca se interpreta como HTML, aunque el MIME viniera mal.
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
