import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  BUCKET, esTema, motivoRechazo, rutaEnBucket, type Anexo,
} from '@/lib/anexos'

export const dynamic = 'force-dynamic'
// La subida lee el archivo completo en memoria; el runtime Edge no sirve.
export const runtime = 'nodejs'

/* ── GET /api/anexos ─────────────────────────────────────────────────────
   Lista los anexos. Con `cuenta_id` filtra a esa cuenta (es lo que usa la
   ficha); sin él los devuelve todos, para la pantalla de Anexos. */
export async function GET(req: NextRequest) {
  const cuentaId = req.nextUrl.searchParams.get('cuenta_id')
  const tema     = req.nextUrl.searchParams.get('tema')

  let query = supabaseAdmin
    .from('anexos')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(500)

  if (cuentaId) query = query.eq('cuenta_id', cuentaId)
  if (tema && esTema(tema)) query = query.eq('tema', tema)

  const { data, error } = await query
  if (error) {
    // 42P01 = la tabla no existe todavía (falta correr la migración). Se dice
    // con un flag en vez de un 500, para que la pantalla pueda explicarlo en
    // lugar de mostrar un "sin anexos" que parece un dato real.
    if (error.code === '42P01') return NextResponse.json({ rows: [], tablaExiste: false })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ rows: (data ?? []) as Anexo[], tablaExiste: true })
}

/* ── POST /api/anexos ────────────────────────────────────────────────────
   Sube un documento y lo registra. multipart/form-data. */
export async function POST(req: NextRequest) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'formato_invalido', mensaje: 'Se esperaba un envío de formulario con archivo.' },
      { status: 400 })
  }

  const archivo  = form.get('archivo')
  const cuentaId = String(form.get('cuenta_id') ?? '').trim()
  const nombreDoc = String(form.get('nombre_documento') ?? '').trim()
  const tema     = String(form.get('tema') ?? '').trim()
  const notas    = String(form.get('notas') ?? '').trim()

  if (!cuentaId) {
    return NextResponse.json(
      { error: 'cuenta_requerida', mensaje: 'Elige el cliente al que pertenece el documento.' },
      { status: 400 })
  }
  if (!nombreDoc) {
    return NextResponse.json(
      { error: 'nombre_requerido', mensaje: 'Escribe el nombre del documento.' },
      { status: 400 })
  }
  if (!esTema(tema)) {
    return NextResponse.json(
      { error: 'tema_invalido', mensaje: 'Elige un tema: Falla, Venta, Producto, Proyecto o Análisis.' },
      { status: 400 })
  }
  if (!(archivo instanceof File)) {
    return NextResponse.json(
      { error: 'archivo_requerido', mensaje: 'Adjunta un archivo Word, Excel o PDF.' },
      { status: 400 })
  }

  const malo = motivoRechazo(archivo.name, archivo.type, archivo.size)
  if (malo) return NextResponse.json({ error: 'archivo_rechazado', mensaje: malo }, { status: 400 })

  /* LA CUENTA SE VERIFICA CONTRA LA BASE, no se cree lo que mandó el cliente.
     Sin esto, un `cuenta_id` inventado crearía un anexo colgando de una cuenta
     inexistente — y la FK lo rechazaría con un error de Postgres que nadie
     sabría leer. Además de aquí salen `cid` y `empresa`, que son copia de lo
     que la cuenta dice HOY, no de lo que el formulario afirme. */
  const { data: cuenta, error: errCuenta } = await supabaseAdmin
    .from('cuentas')
    .select('id, cid, empresa')
    .eq('id', cuentaId)
    .maybeSingle()
  if (errCuenta) return NextResponse.json({ error: errCuenta.message }, { status: 500 })
  if (!cuenta) {
    return NextResponse.json(
      { error: 'cuenta_inexistente', mensaje: 'Esa cuenta no existe en la cartera.' },
      { status: 400 })
  }

  const ruta = rutaEnBucket(cuentaId, archivo.name, Date.now())
  const bytes = Buffer.from(await archivo.arrayBuffer())

  const { error: errSubida } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(ruta, bytes, { contentType: archivo.type, upsert: false })
  if (errSubida) {
    const msg = errSubida.message ?? ''
    if (/bucket/i.test(msg) && /not.*found/i.test(msg)) {
      return NextResponse.json({
        error: 'bucket_faltante',
        mensaje: `Falta crear el bucket privado "${BUCKET}" en Supabase Storage. `
               + 'Comprobar con scripts/verifica-bucket-anexos.py.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: 'subida_fallida', mensaje: msg }, { status: 500 })
  }

  const subidoPor = req.headers.get('x-user-email') ?? null

  const { data, error } = await supabaseAdmin
    .from('anexos')
    .insert({
      cuenta_id: cuenta.id,
      cid: cuenta.cid ?? null,
      empresa: cuenta.empresa ?? null,
      nombre_documento: nombreDoc,
      tema,
      archivo_nombre: archivo.name,
      archivo_ruta: ruta,
      archivo_tipo: archivo.type,
      archivo_bytes: archivo.size,
      notas: notas || null,
      subido_por: subidoPor,
    })
    .select()
    .single()

  if (error) {
    /* EL ARCHIVO YA ESTÁ ARRIBA Y EL REGISTRO FALLÓ. Si se deja así queda un
       objeto en el bucket que ninguna fila menciona: ocupa espacio, nadie lo
       ve y nadie lo puede borrar desde la aplicación. Se retira. */
    await supabaseAdmin.storage.from(BUCKET).remove([ruta])
    if (error.code === '42P01') {
      return NextResponse.json({
        error: 'migracion_pendiente',
        mensaje: 'Falta ejecutar scripts/migracion-anexos.sql en Supabase: la tabla `anexos` no existe.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ row: data as Anexo })
}
