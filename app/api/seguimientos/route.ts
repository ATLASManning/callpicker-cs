import { NextRequest, NextResponse } from 'next/server'
import { getSeguimientos, addSeguimiento, updateSeguimientoResultado, supabaseAdmin } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'
import { exigeDuenoDeCuenta, firmaDeSesion, sesionDe, esRolAcotado, MENSAJE_SIN_CARTERA } from '@/lib/dueno'
import { CANALES_CONTACTO } from '@/lib/contacto-cuenta'
import {
  validaSeguimiento, efectoDeResultado, limiteDeReintento,
} from '@/lib/alertas-sla'
import {
  compromisoPorId, vinculaEvidencia, leeConfiguracion,
} from '@/lib/alertas-sla-sync'

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

    /* ══════════════════════════════════════════════════════════════════════
     * ¿ESTE SEGUIMIENTO CIERRA LA ATENCIÓN DE UNA ALERTA?
     * ══════════════════════════════════════════════════════════════════════
     *
     * SE COMPRUEBA ANTES DE INSERTAR, y el orden importa: si se insertara
     * primero y la validación fallara después, quedaría en la cuenta un
     * seguimiento flojo que el asesor cree que cerró su alerta. Peor que
     * rechazarlo: queda escrito y no cuenta.
     *
     * LAS TRES COSAS QUE SE EXIGEN, y ninguna se puede quitar:
     *
     *   1. Que el compromiso EXISTA. Un `alerta_sla_id` inventado no cierra.
     *   2. Que sea de ESTA MISMA CUENTA. Sin esto, un seguimiento sobre una
     *      cuenta cualquiera cerraría la alerta de otra — y eso no es un error
     *      de captura, es la forma más fácil de vaciar el tablero.
     *   3. Que la evidencia cumpla: canal real, con quién se habló y su puesto,
     *      resumen de 80 caracteres, resultado y próximo paso con fecha. Lo
     *      valida `validaSeguimiento`, en el SERVIDOR. Un formulario valida
     *      para ayudar; el servidor valida para que la regla exista.
     *
     * Y la cuarta, que la pone el esquema: `fecha_atendida >= generada_en`.
     */
    const slaId = String(body?.alerta_sla_id ?? '').trim() || null
    let sla = null
    if (slaId) {
      sla = await compromisoPorId(slaId)
      if (!sla) {
        return NextResponse.json(
          { error: 'No existe ese compromiso de atención.' }, { status: 404 })
      }
      if (String(sla.cuenta_id) !== String(body.cuenta_id)) {
        /* 404 y no 403: un mensaje distinguible confirmaría que el id es real y
           de qué cuenta. Misma regla que `exigeDuenoDeCuenta`. */
        return NextResponse.json(
          { error: 'No existe ese compromiso de atención.' }, { status: 404 })
      }
      if (sla.estado === 'cerrada') {
        return NextResponse.json(
          { error: 'Ese compromiso ya está cerrado. El seguimiento se puede '
                 + 'registrar sin vincularlo.' }, { status: 409 })
      }
      const cfgPrevia = await leeConfiguracion()
      const v = validaSeguimiento(body, CANALES_CONTACTO, cfgPrevia.parametros)
      if (!v.ok) {
        return NextResponse.json({
          error: 'evidencia_insuficiente',
          /* Se devuelven TODAS las faltas, no la primera: un formulario que
             pide una cosa por intento se abandona a la tercera. */
          faltan: v.faltan,
          mensaje: 'Este seguimiento no cierra la alerta todavía. '
                 + 'Falta: ' + v.faltan.join(' '),
        }, { status: 422 })
      }
    }

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

    /* ── Y AHORA SÍ: se vincula la evidencia ────────────────────────────────
     *
     * Después del insert porque hace falta el `id` del seguimiento, que es la
     * evidencia. El `efecto` decide qué pasa con el reloj, y el caso que importa
     * es `sin_respuesta`: NO cierra. Si cerrara, Biolaboratorio Sadat —cuatro
     * intentos fallidos entre el 4 y el 25 de julio, baja el 6 de octubre—
     * habría salido del tablero cuatro veces. */
    let atencion: Record<string, unknown> | null = null
    if (sla) {
      const cfg = await leeConfiguracion()
      const efecto = efectoDeResultado(body?.resultado)
      const r = await vinculaEvidencia({
        sla,
        evidenciaTipo: 'seguimiento',
        evidenciaId: String((s as { id: unknown }).id),
        resumen: String(body?.descripcion ?? '').slice(0, 500),
        resultado: body?.resultado ?? null,
        efecto,
        usuario: firma.asesor ?? sesionDe(req.headers).asesor ?? 'sin firma',
        rol: req.headers.get('x-user-rol'),
        inhabiles: cfg.calendario.inhabiles,
        parametros: cfg.parametros,
        reintentoLimite: limiteDeReintento(hoyEnMexico(), cfg.calendario.inhabiles),
      })
      atencion = r.ok
        ? {
            ok: true, estado: r.estado, efecto,
            /* Se dice en la respuesta, para que el formulario lo enseñe y no lo
               improvise: la atención se cierra, la ALERTA no. */
            mensaje: efecto === 'reintento'
              ? 'Queda registrado el intento. La alerta SIGUE ABIERTA y hay un '
              + 'reintento a un día hábil: «sin respuesta» no es haber atendido.'
              : 'Atención registrada, pendiente de validación. Esto NO apaga la '
              + 'alerta: sigue en la lista hasta que la condición se apague.',
          }
        : { ok: false, error: r.error }
    }

    /* 201 aunque la vinculación falle: el seguimiento SÍ se guardó, y devolver
       un error haría que el formulario lo reintentara y lo duplicara. Lo que no
       se hace es esconderlo — `atencion.ok` lo dice. */
    return NextResponse.json({ ...s, atencion }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: mensajeDeError(e) }, { status: 500 })
  }
}
