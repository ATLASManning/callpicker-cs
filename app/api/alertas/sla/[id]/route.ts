import { NextRequest, NextResponse } from 'next/server'
import { sesionDe, esSuya, MENSAJE_SIN_CARTERA, esRolAcotado } from '@/lib/dueno'
import { hoyEnMexico } from '@/lib/fecha-local'
import { reprograma } from '@/lib/alertas-sla'
import {
  compromisoPorId, aplicaReprogramacion, validaAtencion, leeConfiguracion,
} from '@/lib/alertas-sla-sync'

/**
 * POST /api/alertas/sla/[id] — las TRES acciones que un compromiso admite.
 *
 * ── LAS QUE NO EXISTEN, Y NO EXISTEN A PROPÓSITO ──────────────────────────
 *
 * El encargo lo dice con esas palabras: «Prohibido: cierre manual sin
 * evidencia, borrado de alertas, edición de la fecha de generación. Estas
 * acciones no existen en la UI ni en la API».
 *
 * Así que aquí NO hay `DELETE`, no hay una acción `cerrar` y no hay forma de
 * tocar `generada_en`. Y no se queda en que esta ruta no las ofrezca: la base
 * las rechaza por su cuenta —`trg_sla_reloj` bloquea mover `generada_en` y
 * `sla_atendida_con_evidencia` rechaza una atendida sin evidencia—, porque una
 * regla que sólo vive en la ruta se salta con el siguiente endpoint que alguien
 * escriba. Ver `scripts/migracion-alertas-sla.sql`.
 *
 * LA ESCOTILLA es administración por SQL, que deja rastro en `pg_stat` y no en
 * la bitácora: eso es exactamente lo que se quiere de una escotilla —que se
 * pueda, y que se note—. [[feedback-sin-peros]]
 *
 * ── LAS TRES QUE SÍ ───────────────────────────────────────────────────────
 *
 *   · `reprogramar` — la pide el dueño de la cuenta. Una vez; la segunda la
 *                     autoriza administración. Lo decide `reprograma()`.
 *   · `validar`     — cierra la atención. SÓLO administración.
 *   · `rechazar`    — la reabre con el MISMO límite original. SÓLO administración.
 *
 * ── POR QUÉ VALIDAR NO LO PUEDE HACER EL ASESOR ───────────────────────────
 *
 * Porque entonces la validación no existe: quien registra la evidencia sería
 * quien decide que es suficiente, y «cerrada» querría decir «el asesor dijo que
 * sí». El rol `lider` del encargo HOY ES `admin` —`usuarios.rol` admite
 * admin | asesor | viewer | perfilamiento | activaciones | sac y no hay
 * `lider`—, y se dice aquí en vez de inventar un rol que nadie puede asignar.
 */
export const dynamic = 'force-dynamic'

const VERSION = '2026-11-25.1-acciones-sla'

interface Ctx { params: { id: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  const s = sesionDe(req.headers)
  const body = await req.json().catch(() => ({}))
  const accion = String(body?.accion ?? '').trim()

  const sla = await compromisoPorId(params.id)
  if (!sla) {
    return NextResponse.json(
      { error: 'No existe ese compromiso de atención.', version: VERSION },
      { status: 404 })
  }

  /* El dueño se comprueba contra `alertas_sla.dueno`, que `compromisoPorId` trae
     de `cuentas.asesor` al leer —no de `asesor_apertura`, que es historia: Erick
     sustituyó a Claudia en 71 cuentas y mirar la apertura le negaría las suyas.
     Un asesor no toca compromisos de cartera ajena, ni para reprogramarlos. */
  if (esRolAcotado(s)) {
    if (!s.asesor) {
      return NextResponse.json({ error: MENSAJE_SIN_CARTERA, version: VERSION },
                               { status: 403 })
    }
    if (!esSuya(s, sla.dueno)) {
      /* 404 y no 403: distinguirlos confirmaría que el id existe. */
      return NextResponse.json(
        { error: 'No existe ese compromiso de atención.', version: VERSION },
        { status: 404 })
    }
  }

  const esAdmin = s.rol === 'admin'

  if (accion === 'reprogramar') {
    if (sla.estado === 'cerrada') {
      return NextResponse.json(
        { error: 'Un compromiso cerrado no se reprograma.', version: VERSION },
        { status: 409 })
    }
    const cfg = await leeConfiguracion()
    /* Si el calendario no se pudo leer, NO se reprograma: `sumaDiasHabiles` sin
       festivos daría una fecha que cae en día inhábil, y entonces el vencimiento
       acusaría un incumplimiento en un día en que nadie trabaja. Falla cerrado y
       se dice por qué. [[feedback-verificar-antes-asegurar]] */
    if (cfg.calendario.falla) {
      return NextResponse.json({
        error: 'calendario_no_disponible',
        mensaje: 'No se pudo leer la tabla de días inhábiles, así que no se puede '
               + 'calcular una fecha hábil nueva: ' + cfg.calendario.falla,
        version: VERSION,
      }, { status: 503 })
    }

    const motivo = String(body?.motivo ?? '')
    const r = reprograma(
      {
        reprogramaciones: sla.reprogramaciones ?? 0,
        motivo,
        limiteActual: String(sla.fecha_limite).slice(0, 10),
        esAdmin,
      },
      hoyEnMexico(),
      cfg.calendario.inhabiles,
      cfg.parametros,
    )
    if (!r.ok) {
      return NextResponse.json(
        { error: 'reprogramacion_rechazada', mensaje: r.porque, version: VERSION },
        { status: 422 })
    }

    const w = await aplicaReprogramacion({
      sla, nuevoLimite: r.nuevoLimite, motivo: motivo.trim(),
      usuario: s.asesor || s.rol, rol: s.rol,
    })
    if (!w.ok) {
      return NextResponse.json({ error: w.error, version: VERSION }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      fecha_limite: r.nuevoLimite,
      reprogramaciones: (sla.reprogramaciones ?? 0) + 1,
      /* Se le dice al asesor que esto CUENTA, en el momento en que lo hace y no
         al final del mes en una métrica que ya no puede cambiar. */
      mensaje: `Nueva fecha: ${r.nuevoLimite}. Queda en la bitácora y cuenta como `
             + `reprogramación ${(sla.reprogramaciones ?? 0) + 1} de 2.`,
      version: VERSION,
    })
  }

  if (accion === 'validar' || accion === 'rechazar') {
    if (!esAdmin) {
      return NextResponse.json({
        error: 'solo_administracion',
        mensaje: 'La evidencia la valida administración. Quien la registró no '
               + 'puede además declararla suficiente.',
        version: VERSION,
      }, { status: 403 })
    }
    if (sla.estado !== 'atendida_pendiente_validacion') {
      return NextResponse.json({
        error: 'nada_que_validar',
        mensaje: `Este compromiso está en «${sla.estado}», no en espera de `
               + 'validación. Sólo se valida una atención con evidencia registrada.',
        version: VERSION,
      }, { status: 409 })
    }
    const w = await validaAtencion({
      sla, acepta: accion === 'validar',
      motivo: String(body?.motivo ?? ''),
      usuario: s.asesor || s.rol, rol: s.rol,
    })
    if (!w.ok) {
      /* Un rechazo sin motivo es 422 y no 500: lo que falta es el cuerpo, no el
         servidor. `validaAtencion` devuelve el mismo `ok: false` en los dos
         casos, así que se distingue por si trae mensaje de regla. */
      const esRegla = (w.error ?? '').startsWith('Un rechazo sin motivo')
      return NextResponse.json({ error: w.error, version: VERSION },
                               { status: esRegla ? 422 : 500 })
    }
    return NextResponse.json({
      ok: true,
      estado: accion === 'validar' ? 'cerrada' : 'reabierta',
      mensaje: accion === 'validar'
        ? 'Atención cerrada. Esto NO apaga la alerta: la alerta se apaga cuando '
        + 'la condición deja de verse en la fuente.'
        : `Reabierta con la MISMA fecha límite (${String(sla.fecha_limite).slice(0, 10)}). `
        + 'Un rechazo no es una prórroga.',
      version: VERSION,
    })
  }

  return NextResponse.json({
    error: 'accion_desconocida',
    mensaje: 'Acciones válidas: reprogramar, validar, rechazar. No existe una '
           + 'acción de cierre manual ni de borrado, por diseño.',
    version: VERSION,
  }, { status: 400 })
}
