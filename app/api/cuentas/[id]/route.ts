import { NextRequest, NextResponse } from 'next/server'
import { getCuentaById, updateCuenta, saveHealthSnapshot, deleteCuenta } from '@/lib/supabase'
import { sesionDe, esSuya, puedeConsultar, firmaDeSesion } from '@/lib/dueno'

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

    const updated = await updateCuenta(params.id, body)

    // Auto-save health score snapshot when scores change
    const scoreKeys = ['score_actividad','score_adopcion','score_pago','score_relacional']
    if (scoreKeys.some(k => k in body)) {
      await saveHealthSnapshot(params.id, updated)
    }

    return NextResponse.json(updated)
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
