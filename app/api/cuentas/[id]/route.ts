import { NextRequest, NextResponse } from 'next/server'
import {
  getCuentaById, updateCuenta, saveHealthSnapshot, deleteCuenta,
  supabaseAdmin, esTablaInexistente,
} from '@/lib/supabase'
import { sesionDe, esSuya, puedeConsultar, firmaDeSesion } from '@/lib/dueno'
import { hoyEnMexico } from '@/lib/fecha-local'
import { diffDeCampos, validaEdicion, limiteDeReintento } from '@/lib/alertas-sla'
import {
  compromisoPorId, vinculaEvidencia, leeConfiguracion,
} from '@/lib/alertas-sla-sync'

interface Ctx { params: { id: string } }

/* `getCuentaById` acepta UUID o consecutivo, así que el dueño se comprueba
   SOBRE LA CUENTA YA RESUELTA y no con `exigeDuenoDeCuenta`, que busca por
   `id`: pedir la cuenta por su consecutivo se habría saltado el candado. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const cuenta = await getCuentaById(params.id)
  if (!cuenta) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  /* CONSULTAR ES LIBRE (instrucción de dirección, 15 oct 2026): un asesor abre
     la ficha de cualquier cuenta. La comprobación se queda escrita porque es la
     escotilla —`LECTURA_LIBRE = false` en lib/dueno.ts la vuelve a cerrar—, y
     entonces responde 404 y no 403 para no confirmar que el id es real. */
  if (!puedeConsultar(sesionDe(req.headers), cuenta.asesor)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(cuenta)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const s = sesionDe(req.headers)

  if (s.rol !== 'admin' && s.rol !== 'asesor')
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  /* COMPROBAR EL ROL NO ES COMPROBAR EL DUEÑO, y aquí estaba sólo el rol: un
     asesor editaba cualquier cuenta de la empresa. Es la ruta que `/api/
     seguimientos` llama para mover `ultimo_contacto`, así que era además la
     forma de tocar cartera ajena sin que lo pareciera. */
  const actual = await getCuentaById(params.id)
  if (!actual) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!esSuya(s, actual.asesor)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()

    /* Un asesor no reasigna la cuenta: ni se la queda ni se la pasa a otro.
       Administración sí, que mover cartera es su trabajo. */
    if (s.rol === 'asesor' && 'asesor' in (body ?? {})) {
      const firma = firmaDeSesion(req.headers, null)
      if (!firma.ok) return firma.res
      if (!esSuya(s, body.asesor)) {
        return NextResponse.json(
          { error: 'No puedes mover una cuenta a otra cartera.' },
          { status: 403 })
      }
    }

    /* ════════════════════════════════════════════════════════════════════════
     * QUÉ CAMBIÓ — y si eso cierra la atención de una alerta
     * ════════════════════════════════════════════════════════════════════════
     *
     * EL DIFF SE CALCULA ANTES DEL UPDATE, porque después ya no hay con qué
     * comparar: `actual` es la fila como estaba, y es el único momento en que
     * existe. No se recalcula leyendo otra vez, que daría un diff vacío.
     *
     * `alerta_sla_id` NO ENTRA EN EL DIFF ni en el update: es el amarre con el
     * compromiso, no un campo de la cuenta. Sin quitarlo, mandar el id sería por
     * sí mismo «un cambio real» y cualquier guardado cerraría la alerta — la
     * trampa exacta que `validaEdicion` existe para cerrar. */
    const slaId = String(body?.alerta_sla_id ?? '').trim() || null
    const campos: Record<string, unknown> = { ...(body ?? {}) }
    delete campos.alerta_sla_id

    const diff = diffDeCampos(
      actual as unknown as Record<string, unknown>, campos)

    let sla = null
    if (slaId) {
      sla = await compromisoPorId(slaId)
      if (!sla) {
        return NextResponse.json(
          { error: 'No existe ese compromiso de atención.' }, { status: 404 })
      }
      if (String(sla.cuenta_id) !== String(actual.id)) {
        return NextResponse.json(
          { error: 'No existe ese compromiso de atención.' }, { status: 404 })
      }
      if (sla.estado === 'cerrada') {
        return NextResponse.json(
          { error: 'Ese compromiso ya está cerrado. La ficha se puede editar '
                 + 'sin vincularla.' }, { status: 409 })
      }
      const v = validaEdicion(diff)
      if (!v.ok) {
        return NextResponse.json({
          error: 'evidencia_insuficiente',
          faltan: v.faltan,
          mensaje: 'Esta edición no cierra la alerta: ' + v.faltan.join(' '),
        }, { status: 422 })
      }
    }

    const updated = await updateCuenta(params.id, campos)

    // Auto-save health score snapshot when scores change
    const scoreKeys = ['score_actividad','score_adopcion','score_pago','score_relacional']
    if (scoreKeys.some(k => k in campos)) {
      await saveHealthSnapshot(params.id, updated)
    }

    /* LA BITÁCORA DE EDICIONES SE ESCRIBE AUNQUE NO HAYA ALERTA, y por eso vale:
       el día que alguien pregunte quién cambió el MRR de una cuenta, la
       respuesta no puede depender de que esa edición cerrara una alerta.
       Mejor esfuerzo: si la tabla todavía no existe —migración sin correr— el
       PATCH no se cae, que es una pantalla en uso. Lo que no se hace es cerrar
       la alerta en ese caso: se dice. */
    let bitacora: Record<string, unknown> | null = null
    if (Object.keys(diff).length > 0) {
      const { data: fila, error: eDiff } = await supabaseAdmin
        .from('cuentas_ediciones')
        .insert({
          cuenta_id: actual.id,
          alerta_sla_id: slaId,
          usuario: s.asesor ?? s.rol ?? 'sin firma',
          rol: s.rol ?? null,
          diff,
        })
        .select('id')
        .single()
      bitacora = eDiff
        ? { ok: false, error: eDiff.message,
            falta_migracion: esTablaInexistente(eDiff) }
        : { ok: true, id: fila?.id, campos: Object.keys(diff) }
    }

    let atencion: Record<string, unknown> | null = null
    if (sla) {
      const idBitacora = bitacora && bitacora.ok === true ? String(bitacora.id) : null
      if (!idBitacora) {
        /* Sin asiento en la bitácora no hay evidencia a la que apuntar, y
           `alertas_sla.evidencia_id` apuntaría al vacío. Se dice. */
        atencion = {
          ok: false,
          error: 'La edición se guardó en la cuenta, pero no se pudo registrar el '
               + 'cambio en la bitácora, así que la alerta sigue abierta: sin '
               + 'asiento no hay evidencia que enseñar. '
               + String((bitacora as { error?: unknown } | null)?.error ?? ''),
        }
      } else {
        const cfg = await leeConfiguracion()
        const r = await vinculaEvidencia({
          sla,
          evidenciaTipo: 'edicion',
          evidenciaId: idBitacora,
          resumen: 'Campos corregidos: ' + Object.keys(diff).join(', '),
          resultado: null,
          efecto: 'cierra',
          usuario: s.asesor ?? s.rol ?? 'sin firma',
          rol: s.rol ?? null,
          inhabiles: cfg.calendario.inhabiles,
          parametros: cfg.parametros,
          reintentoLimite: limiteDeReintento(hoyEnMexico(), cfg.calendario.inhabiles),
        })
        atencion = r.ok
          ? { ok: true, estado: r.estado, campos: Object.keys(diff),
              mensaje: 'Corrección registrada, pendiente de validación. Esto NO '
                     + 'apaga la alerta: la apaga que la fuente siguiente traiga '
                     + 'el dato corregido.' }
          : { ok: false, error: r.error }
      }
    }

    return NextResponse.json({ ...updated, bitacora, atencion })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const rol = req.headers.get('x-user-rol') ?? 'viewer'
  if (rol !== 'admin')
    return NextResponse.json({ error: 'Solo administradores pueden eliminar cuentas' }, { status: 403 })
  try {
    await deleteCuenta(params.id)
    return NextResponse.json({ ok: true, deleted: params.id })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
