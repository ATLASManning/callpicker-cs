import { NextRequest, NextResponse } from 'next/server'
import { getSeguimientos, addSeguimiento, updateSeguimientoResultado, supabaseAdmin } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'
import { exigeDuenoDeCuenta, firmaDeSesion, sesionDe, esRolAcotado, MENSAJE_SIN_CARTERA } from '@/lib/dueno'

/**
 * `String(e)` sobre un error de Supabase imprime «[object Object]».
 *
 * Y con eso el cliente no puede decir nada útil: el 2 nov 2026, con el CHECK
 * de `tipo` rechazando `solicitud_cancelacion`, la API contestaba
 * `{"error":"[object Object]"}` y el formulario solo podía decir «no se guardó
 * (500)». El mensaje real —`violates check constraint
 * "seguimientos_tipo_check"`— es justo el que dice QUÉ hacer. Son errores de
 * esquema, no traen datos de cliente.
 */
function mensajeDeError(e: unknown): string {
  if (typeof e === 'string') return e
  if (e && typeof e === 'object') {
    const o = e as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }
    /* `details` SE QUEDA FUERA: PostgREST mete ahí la fila entera —«Failing row
       contains (…)»—, que repite lo que el asesor acaba de escribir y alarga el
       aviso sin añadir nada. El nombre del constraint, que es lo que dice qué
       hacer, viene en `message`. */
    const partes = [o.message, o.hint]
      .filter(v => typeof v === 'string' && v.trim() !== '') as string[]
    if (partes.length) {
      return (o.code ? `${o.code}: ` : '') + partes.join(' · ')
    }
    try { return JSON.stringify(e) } catch { /* cae al String de abajo */ }
  }
  return String(e)
}

export async function GET(req: NextRequest) {
  const cuentaId = req.nextUrl.searchParams.get('cuenta_id')
  if (!cuentaId) return NextResponse.json({ error: 'cuenta_id required' }, { status: 400 })
  const corta = await exigeDuenoDeCuenta(req.headers, cuentaId, 'lectura')
  if (corta) return corta
  const data = await getSeguimientos(cuentaId)
  return NextResponse.json(data)
}

/**
 * PATCH — cierra un seguimiento con su resultado.
 *
 * El dueño se comprueba por la CUENTA del seguimiento, que hay que ir a buscar:
 * el cuerpo sólo trae el `id` del seguimiento, y sin esta consulta un asesor
 * cerraba la gestión de otra persona. No estaba en los siete puntos de la
 * auditoría —que citaba el POST— pero es la misma clase.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { id, resultado } = await req.json()
    if (!id || !resultado) return NextResponse.json({ error: 'id y resultado requeridos' }, { status: 400 })

    const s = sesionDe(req.headers)
    if (esRolAcotado(s)) {
      if (!s.asesor) {
        return NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 })
      }
      const { data, error } = await supabaseAdmin
        .from('seguimientos')
        .select('cuenta_id')
        .eq('id', id)
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data?.cuenta_id) {
        return NextResponse.json({ error: 'No existe ese seguimiento.' }, { status: 404 })
      }
      const corta = await exigeDuenoDeCuenta(req.headers, String(data.cuenta_id), 'escritura')
      if (corta) return NextResponse.json({ error: 'No existe ese seguimiento.' }, { status: 404 })
    }

    await updateSeguimientoResultado(id, resultado)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: mensajeDeError(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body?.cuenta_id) {
      return NextResponse.json({ error: 'cuenta_id requerido' }, { status: 400 })
    }

    const corta = await exigeDuenoDeCuenta(req.headers, String(body.cuenta_id), 'escritura')
    if (corta) return corta

    /* QUIÉN FIRMA LO DICE LA SESIÓN, NO EL CUERPO. Aceptar `body.asesor` dejaba
       escribir en cartera ajena firmado con el nombre de otra persona, que es
       peor que escribir sin permiso: deja rastro falso en la bitácora de la
       cuenta y el asesor suplantado responde por una gestión que no hizo. */
    const firma = firmaDeSesion(req.headers, body?.asesor)
    if (!firma.ok) return firma.res

    const s = await addSeguimiento({ ...body, asesor: firma.asesor })

    /* `ultimo_contacto` se escribe DIRECTO contra la tabla y ya no con un
       `fetch` a `/api/cuentas/[id]`. Ese salto interno no llevaba las cabeceras
       de sesión, así que ahora que el PATCH comprueba dueño habría respondido
       404 y el contacto se habría perdido en silencio — un arreglo de seguridad
       rompiendo una función. Y de paso deja de depender de `req.nextUrl.origin`,
       que en Vercel no siempre es alcanzable desde la propia función. */
    await supabaseAdmin
      .from('cuentas')
      .update({ ultimo_contacto: hoyEnMexico() })
      .eq('id', body.cuenta_id)

    return NextResponse.json(s, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: mensajeDeError(e) }, { status: 500 })
  }
}
