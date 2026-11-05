import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, esTablaInexistente } from '@/lib/supabase'
import {
  BUCKET, esTema, motivoRechazo, mimeEfectivo, rutaEnBucket, type Anexo,
} from '@/lib/anexos'
import {
  sesionDe, acotaLectura, exigeDuenoDeCuenta, cuentaIdsDeAsesor,
  MENSAJE_SIN_CARTERA, ESCRITURA_FUERA_DE_CARTERA,
} from '@/lib/dueno'
import { interpretaValor, catalogoCuentas } from '@/lib/catalogo-cuentas'

export const dynamic = 'force-dynamic'
// La subida lee el archivo completo en memoria; el runtime Edge no sirve.
export const runtime = 'nodejs'

/* ── GET /api/anexos ─────────────────────────────────────────────────────
   Lista los anexos. Con `cuenta_id` filtra a esa cuenta (es lo que usa la
   ficha); sin él los devuelve todos, para la pantalla de Anexos.

   CONSULTAR ES LIBRE (instrucción de dirección, 15 oct 2026): el índice de
   documentos se entrega completo a cualquier sesión válida, como antes. Lo que
   cambia respecto al origen es que ESCRIBIR y BORRAR sí comprueban dueño —el
   borrado ya lo hacía, y esa asimetría fue el indicio de que a la subida le
   faltaba—.

   Si `LECTURA_LIBRE` se pone en false, el recorte vuelve y va EN LA CONSULTA,
   con los `cuenta_id` de la cartera: recortar después deja el dato viajando al
   cliente en cuanto alguien añada un campo. */
export async function GET(req: NextRequest) {
  const cuentaId = req.nextUrl.searchParams.get('cuenta_id')
  const tema     = req.nextUrl.searchParams.get('tema')

  const s = sesionDe(req.headers)
  if (acotaLectura(s) && !s.asesor) {
    return NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 })
  }

  if (cuentaId) {
    const corta = await exigeDuenoDeCuenta(req.headers, cuentaId, 'lectura')
    if (corta) return corta
  }

  let query = supabaseAdmin
    .from('anexos')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(500)

  if (cuentaId) query = query.eq('cuenta_id', cuentaId)
  else if (acotaLectura(s)) {
    /* Una cartera sin cuentas devuelve lista vacía, no «todas»: `in` con un
       arreglo vacío es justo donde un filtro se cae solo. */
    let mios: string[]
    try {
      mios = await cuentaIdsDeAsesor(s.asesor)
    } catch (e: unknown) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
    if (!mios.length) return NextResponse.json({ rows: [], tablaExiste: true })
    query = query.in('cuenta_id', mios)
  }
  if (tema && esTema(tema)) query = query.eq('tema', tema)

  const { data, error } = await query
  if (error) {
    // La tabla no existe todavía (falta correr la migración). Se dice con un
    // flag en vez de un 500, para que la pantalla pueda explicarlo en lugar de
    // mostrar un "sin anexos" que parece un dato real.
    if (esTablaInexistente(error)) return NextResponse.json({ rows: [], tablaExiste: false })
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
  const nombreDoc = String(form.get('nombre_documento') ?? '').trim()
  const tema     = String(form.get('tema') ?? '').trim()
  const notas    = String(form.get('notas') ?? '').trim()

  /* LA CUENTA PUEDE SER DE DOS CLASES, y el formulario dice CUÁL en vez de
     dejar que el servidor lo adivine por la forma del texto:
       · `cuenta:<uuid>` — está en la cartera CS, se amarra por FK.
       · `cid:<cid>`     — sólo existe en el padrón de facturación.
     Se sigue aceptando `cuenta_id` suelto para no romper nada que ya lo
     mande; se interpreta como de cartera, que es lo que siempre fue. */
  const bruto = String(form.get('cuenta_valor') ?? '').trim()
    || (form.get('cuenta_id') ? `cuenta:${String(form.get('cuenta_id')).trim()}` : '')
  const elegida = interpretaValor(bruto)

  if (!elegida) {
    return NextResponse.json(
      { error: 'cuenta_requerida', mensaje: 'Elige el cliente al que pertenece el documento.' },
      { status: 400 })
  }

  /* El dueño se comprueba antes de SUBIR, no sólo antes de insertar la fila:
     sin esto un asesor colgaba un documento de una cuenta de otra cartera, y el
     objeto quedaba en el bucket aunque la fila fallara después.

     Sobre una cuenta FUERA de cartera no hay dueño a quien suplantar, así que
     la comprobación no aplica; la decisión vive en `ESCRITURA_FUERA_DE_CARTERA`
     y no aquí, para que no haya que deducirla leyendo este `if`. */
  if (elegida.cuentaId) {
    const corta = await exigeDuenoDeCuenta(req.headers, elegida.cuentaId, 'escritura')
    if (corta) return corta
  } else if (!ESCRITURA_FUERA_DE_CARTERA) {
    return NextResponse.json({
      error: 'fuera_de_cartera_cerrado',
      mensaje: 'La captura sobre cuentas fuera de la cartera CS está cerrada. '
             + 'Ver ESCRITURA_FUERA_DE_CARTERA en lib/dueno.ts.',
    }, { status: 403 })
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
      { error: 'archivo_requerido', mensaje: 'Adjunta un archivo Word, Excel, PDF o HTML.' },
      { status: 400 })
  }

  const malo = motivoRechazo(archivo.name, archivo.type, archivo.size)
  if (malo) return NextResponse.json({ error: 'archivo_rechazado', mensaje: malo }, { status: 400 })

  /* LA CUENTA SE VERIFICA CONTRA SU FUENTE, no se cree lo que mandó el
     cliente. Sin esto, un `cuenta_id` inventado crearía un anexo colgando de
     una cuenta inexistente —y la FK lo rechazaría con un error de Postgres que
     nadie sabría leer—, y un CID inventado colgaría el documento de un cliente
     que no existe, donde nadie lo volvería a encontrar. De aquí salen también
     `cid` y `empresa`: copia de lo que la fuente dice HOY, no de lo que el
     formulario afirme. */
  let cuentaIdFinal: string | null = null
  let cidFinal: string | null = null
  let empresaFinal: string | null = null

  if (elegida.cuentaId) {
    const { data: cuenta, error: errCuenta } = await supabaseAdmin
      .from('cuentas')
      .select('id, cid, empresa')
      .eq('id', elegida.cuentaId)
      .maybeSingle()
    if (errCuenta) return NextResponse.json({ error: errCuenta.message }, { status: 500 })
    if (!cuenta) {
      return NextResponse.json(
        { error: 'cuenta_inexistente', mensaje: 'Esa cuenta no existe en la cartera.' },
        { status: 400 })
    }
    cuentaIdFinal = cuenta.id
    cidFinal = cuenta.cid ?? null
    empresaFinal = cuenta.empresa ?? null
  } else {
    let cat
    try {
      cat = await catalogoCuentas()
    } catch (e: unknown) {
      /* Si el catálogo no se puede leer NO se da por bueno el CID: eso sería
         aceptar cualquier cosa justo cuando se perdió la forma de comprobarla.
         Falla cerrado. [[feedback-verificar-antes-asegurar]] */
      return NextResponse.json({
        error: 'catalogo_no_disponible',
        mensaje: 'No se pudo comprobar el cliente contra el padrón de facturación, '
               + `así que el documento no se guardó: ${String(e)}`,
      }, { status: 503 })
    }
    const op = cat.opciones.find(o => !o.enCartera && o.cid === elegida.cid)
    if (!op) {
      return NextResponse.json({
        error: 'cliente_inexistente',
        mensaje: `El CID ${elegida.cid} no aparece en el padrón de facturación `
               + '(data/cortes-facturacion.xlsx).',
      }, { status: 400 })
    }
    cidFinal = op.cid
    empresaFinal = op.empresa
  }

  /* El tipo que se guarda es el NORMALIZADO: un .html que el navegador no
     supo tipar se almacenaria con '' y la descarga saldria como binario. */
  const tipo = mimeEfectivo(archivo.name, archivo.type)
  /* La carpeta del bucket se nombra con la llave que SÍ hay. Un cliente fuera
     de cartera no tiene uuid, y dejar que caiga en `undefined/` juntaría los
     documentos de todos ellos en una sola carpeta. */
  const ruta = rutaEnBucket(cuentaIdFinal ?? `cid-${cidFinal}`, archivo.name, Date.now())
  const bytes = Buffer.from(await archivo.arrayBuffer())

  const { error: errSubida } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(ruta, bytes, { contentType: tipo, upsert: false })
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
      cuenta_id: cuentaIdFinal,
      cid: cidFinal,
      empresa: empresaFinal,
      nombre_documento: nombreDoc,
      tema,
      archivo_nombre: archivo.name,
      archivo_ruta: ruta,
      archivo_tipo: tipo,
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
    if (esTablaInexistente(error)) {
      return NextResponse.json({
        error: 'migracion_pendiente',
        mensaje: 'Falta ejecutar scripts/migracion-anexos.sql en Supabase: la tabla `anexos` no existe.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ row: data as Anexo })
}
