import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, esTablaInexistente } from '@/lib/supabase'
import { llevaCuenta, exigeCuenta } from '@/lib/reuniones-tipo'
import { interpretaValor, catalogoCuentas } from '@/lib/catalogo-cuentas'

export const dynamic = 'force-dynamic'

/* ── GET /api/reuniones ─────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams
  const tipo     = sp.get('tipo')
  const empresa  = sp.get('empresa')
  const cuentaId = sp.get('cuenta_id')

  let query = supabaseAdmin
    .from('reuniones')
    .select('*')
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false })

  if (tipo)     query = query.eq('tipo', tipo)
  // El vínculo autoritativo es cuenta_id; `empresa` sólo se usa como filtro
  // de texto para búsquedas sueltas, nunca como llave.
  if (cuentaId) query = query.eq('cuenta_id', cuentaId)
  if (empresa)  query = query.ilike('empresa', `%${empresa}%`)

  const { data, error } = await query

  if (error) {
    if (esTablaInexistente(error)) return NextResponse.json({ rows: [], tableExists: false })
    // Columna empresa no existe aún — ignorar filtro, devolver todo
    if (error.code === '42703') {
      const { data: all, error: e2 } = await supabaseAdmin
        .from('reuniones')
        .select('*')
        .order('fecha', { ascending: false })
        .order('creado_en', { ascending: false })
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
      return NextResponse.json({ rows: all ?? [], tableExists: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [], tableExists: true })
}

/* ── POST /api/reuniones ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { fecha, tipo, titulo, participantes, resumen, acuerdos, proximos_pasos,
          empresa, cuenta_id, cid, cuenta_valor } = body

  if (!fecha || !titulo?.trim()) {
    return NextResponse.json({ error: 'fecha y titulo son requeridos' }, { status: 400 })
  }
  const tipoFinal = tipo ?? 'junta_semanal'

  /* LA CUENTA PUEDE VENIR DE DOS SITIOS, y el formulario dice de cuál:
       · `cuenta:<uuid>` — está en la cartera CS; se amarra por FK.
       · `cid:<cid>`     — sólo existe en el padrón de facturación, así que
                           `cuenta_id` va en NULL y el amarre es el CID.
     La columna `reuniones.cuenta_id` ya era nullable (ver la migración), así
     que esto no necesita tocar el esquema. Se sigue aceptando el `cuenta_id`
     suelto de antes. */
  const elegida = interpretaValor(cuenta_valor)
    ?? (cuenta_id ? { cuentaId: String(cuenta_id), cid: null } : null)

  // Una reunión de cliente sin cuenta vinculada no sirve para nada aguas
  // abajo: no alimenta el relacionamiento ni aparece en la ficha. Se exige.
  //
  // «Vinculada» es a la CUENTA o al CID: una reunión con ProMujer, que no está
  // en la cartera, queda igual de amarrada por su CID. Exigir el uuid dejaría
  // fuera a 2,556 clientes por no tener ficha en `cuentas` —medido con
  // scripts/verifica-catalogo-cuentas.py, no estimado—.
  if (exigeCuenta(tipoFinal) && !elegida) {
    // El mensaje decía siempre «reunión con cliente», aunque el tipo fuera
    // estrategia o junta semanal — y entonces el usuario no entiende qué le
    // están pidiendo, porque él no capturó una reunión con cliente.
    return NextResponse.json({
      error: 'cuenta_requerida',
      mensaje: `Una reunión de tipo "${tipoFinal}" debe vincularse a una cuenta. `
             + 'Sólo las de One To One pueden guardarse sin ella.',
    }, { status: 400 })
  }

  // El vínculo se GUARDA en todo tipo que lo ofrezca, no sólo en las de
  // cliente. Antes esta línea decía `tipo === 'cliente' ? cuenta_id : null` y
  // el formulario —que muestra el combo en todos los tipos salvo One To One—
  // prometía por escrito que contaría en el relacionamiento. El servidor lo
  // tiraba y devolvía 200: 55 reuniones quedaron huérfanas sin un solo error.
  // La regla ahora es una sola, en lib/reuniones-tipo.ts, y la usan los dos.
  const vincula = llevaCuenta(tipoFinal)

  /* EL NOMBRE Y EL CID SE TOMAN DE LA FUENTE, no del cuerpo de la petición.
     Lo que el formulario mande en `empresa` es lo que tenía pintado cuando lo
     abrieron; si entre tanto cambió el nombre de la cuenta, se guardaría el
     viejo y las dos capturas del mismo cliente dejarían de leerse igual. */
  let cuentaIdFinal: string | null = null
  let cidFinal: string | null = null
  let empresaFinal: string | null = null

  if (vincula && elegida) {
    if (elegida.cuentaId) {
      cuentaIdFinal = elegida.cuentaId
      cidFinal = cid ?? null
      empresaFinal = empresa ?? null
    } else {
      let cat
      try {
        cat = await catalogoCuentas()
      } catch (e: unknown) {
        /* Sin catálogo no se puede comprobar el CID, y aceptarlo a ciegas
           amarraría la reunión a un cliente que quizá no existe. Falla
           cerrado. [[feedback-verificar-antes-asegurar]] */
        return NextResponse.json({
          error: 'catalogo_no_disponible',
          mensaje: 'No se pudo comprobar el cliente contra el padrón de facturación, '
                 + `así que la reunión no se guardó: ${String(e)}`,
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
  }

  const { data, error } = await supabaseAdmin
    .from('reuniones')
    .insert({
      fecha,
      tipo:           tipoFinal,
      titulo:         titulo.trim(),
      participantes:  participantes ?? '',
      resumen:        resumen ?? '',
      acuerdos:       acuerdos ?? '',
      proximos_pasos: proximos_pasos ?? '',
      cuenta_id:      cuentaIdFinal,
      cid:            cidFinal,
      empresa:        empresaFinal,
    })
    .select()
    .single()

  if (error) {
    if (esTablaInexistente(error)) return NextResponse.json({ error: 'table_not_found', tableExists: false }, { status: 503 })

    // Faltan las columnas de vínculo (migración pendiente).
    //
    // ANTES esto reintentaba el insert SIN esas columnas y devolvía 200: la
    // reunión se guardaba sin cuenta y el usuario creía haberla vinculado. Ésa
    // es la razón de que las 18 reuniones de cliente quedaran huérfanas.
    //
    // La condición para rechazar es «SE PIDIÓ UN VÍNCULO», no «es de tipo
    // cliente»: una junta de estrategia con cuenta elegida se perdería igual de
    // silenciosamente. Sólo se reintenta sin columnas cuando no había nada que
    // vincular, y ahí no se pierde nada.
    if (error.code === '42703' || error.message.includes("'empresa'")) {
      // `elegida` y no `cuenta_id`: con el amarre por CID el uuid viene vacío,
      // y preguntar por él dejaría pasar al reintento SIN columnas justo a las
      // reuniones de cuentas fuera de cartera — que se guardarían huérfanas
      // devolviendo 200, que es el fallo que este bloque existe para impedir.
      if (vincula && elegida) {
        return NextResponse.json({
          error: 'migracion_pendiente',
          mensaje: 'Falta ejecutar scripts/migracion-reuniones-cuenta.sql: la tabla reuniones '
                 + 'no tiene las columnas cuenta_id, cid y empresa. Sin ellas la reunión se '
                 + 'guardaría sin vínculo con la cuenta.',
        }, { status: 503 })
      }
      const { data: data2, error: e2 } = await supabaseAdmin
        .from('reuniones')
        .insert({ fecha, tipo: tipoFinal, titulo: titulo.trim(), participantes: participantes ?? '', resumen: resumen ?? '', acuerdos: acuerdos ?? '', proximos_pasos: proximos_pasos ?? '' })
        .select()
        .single()
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
      return NextResponse.json({ row: data2 })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ row: data })
}
