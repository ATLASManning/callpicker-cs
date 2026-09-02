import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { TipoSeguimiento } from '@/lib/types'
import { detectDataGaps, CAMPOS_GAP_SELECT, type CuentaGapInput } from '@/lib/data-gaps'
import { contarRespuestasRadar, preguntasRadarFaltantes } from '@/lib/radar'
import {
  evaluarElegibilidad, CAMPOS_ELEGIBILIDAD_SELECT, MSG,
  type CuentaElegibilidadInput, type ResultadoElegibilidad,
} from '@/lib/elegibilidad'
import { evaluarCierre } from '@/lib/actividades/cierre'

export const dynamic = 'force-dynamic'

/**
 * Re-valida la elegibilidad en el momento de actuar sobre la actividad.
 * Una cuenta puede haber cambiado de estatus DESPUÉS de que se generó la
 * actividad; iniciar o completar sobre una cuenta ya dormida/cancelada/en
 * churn no debe ser posible. Fail-closed: si no se puede leer la cuenta,
 * se bloquea.
 *
 * No consulta Zoho aquí (esa llamada tarda y este endpoint es interactivo):
 * se pasa un Set vacío, con lo que siguen aplicando estado, GRC-AAA-2026,
 * alertas de cancelación y completitud de contacto. La conciliación con Zoho
 * es responsabilidad del generador semanal.
 */
async function revalidarCuenta(cuentaId: string, tipo: string): Promise<ResultadoElegibilidad> {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select(CAMPOS_ELEGIBILIDAD_SELECT)
    .eq('id', cuentaId)
    .single()

  if (error || !data) {
    return { elegible: false, codigo: 'estatus_no_validable', motivo: MSG.estatus_no_validable, contactoFaltante: [] }
  }
  return evaluarElegibilidad(data as unknown as CuentaElegibilidadInput, new Set<string>(), tipo)
}

/** Bloquea la actividad en BD cuando su cuenta dejó de ser elegible. */
async function bloquearActividad(actividadId: string, motivo: string) {
  try {
    await supabaseAdmin
      .from('actividades')
      .update({ estado: 'bloqueada', motivo_pendiente: motivo, actualizado_en: new Date().toISOString() })
      .eq('id', actividadId)
  } catch (e) {
    console.warn(`[Actividades ${actividadId}] No se pudo bloquear:`, e)
  }
}

function mapTipo(tipo: string): TipoSeguimiento {
  const m: Record<string, TipoSeguimiento> = {
    llamada: 'llamada', reunion: 'reunion',
    analisis: 'nota', kam: 'nota', upsell: 'upsell',
    tickets: 'nota', pagos: 'nota', validacion: 'nota',
  }
  return m[tipo] ?? 'nota'
}

// ── Detección de intención de cancelación en el texto que escribe el asesor ──
// No cambia la cuenta a "cancelado" solo por una palabra — eso requiere
// confirmación humana. Sube el estado a "en_riesgo" (si estaba "activo") y
// deja una nota visible en Observaciones KAM para que el KAM/supervisor lo
// verifique. Ver [[atlas_dashboard_contrast_architecture]]-style: detectar y
// avisar, nunca ejecutar la baja de forma automática.
const RX_CANCELACION = /cancelar|cancelaci[oó]n|dar(?:se)? de baja|no (?:va|van) a renovar|no renovar[áa]?|quiere(?:n)? (?:darse de )?baja|termin(?:ar|ó) (?:el )?(?:servicio|contrato)|cerrar (?:la )?cuenta/i

async function etiquetarSiHayIntencionDeCancelacion(cuentaId: string, texto: string, actividadId: string) {
  if (!texto || !RX_CANCELACION.test(texto)) return
  try {
    const { data: cuenta } = await supabaseAdmin
      .from('cuentas')
      .select('estado, observaciones_kam')
      .eq('id', cuentaId)
      .single()
    if (!cuenta) return

    const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    const nota  = `🔴 [Detectado automáticamente ${fecha} · actividad] Posible intención de cancelación en el reporte del asesor — verificar con el cliente antes de dar de baja. Texto: "${texto.slice(0, 240)}"`
    const observacionesNuevas = cuenta.observaciones_kam
      ? `${nota}\n\n${cuenta.observaciones_kam}`
      : nota

    const patch: Record<string, unknown> = { observaciones_kam: observacionesNuevas }
    if (cuenta.estado === 'activo') patch.estado = 'en_riesgo'

    await supabaseAdmin.from('cuentas').update(patch).eq('id', cuentaId)
  } catch (e) {
    console.warn(`[Actividades ${actividadId}] No se pudo etiquetar intención de cancelación:`, e)
  }
}

interface ActualRow {
  id: string; tipo: string; cuenta_id: string | null; empresa: string
  descripcion: string; asesor: string; completada: boolean
  iniciada_en?: string | null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    // Cronómetro (iniciada_en, tiempo_medido_min, tiempo_reportado_min) requiere
    // una migración en `actividades` que puede no haberse corrido todavía —
    // se lee/escribe con fallback para no romper el flujo de completar/no
    // realizar que ya funciona hoy en el resto de las actividades semanales.
    let actual: ActualRow | null = null
    {
      const { data, error } = await supabaseAdmin
        .from('actividades')
        .select('id, tipo, cuenta_id, empresa, descripcion, asesor, completada, iniciada_en')
        .eq('id', params.id)
        .single()
      if (error) {
        const { data: dataFallback, error: errFallback } = await supabaseAdmin
          .from('actividades')
          .select('id, tipo, cuenta_id, empresa, descripcion, asesor, completada')
          .eq('id', params.id)
          .single()
        if (errFallback || !dataFallback) return NextResponse.json({ error: errFallback?.message ?? 'Actividad no encontrada' }, { status: 404 })
        actual = dataFallback as ActualRow
      } else {
        actual = data as ActualRow
      }
    }
    if (!actual) return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })

    // ── Elegibilidad al momento de actuar ────────────────────────────────────
    // Se revalida antes de iniciar el cronómetro y antes de completar. Si la
    // cuenta cambió a un estado no activo desde que se generó la actividad,
    // ésta queda bloqueada de inmediato en lugar de ejecutarse.
    if ((body.accion === 'iniciar' || body.completada) && actual.cuenta_id) {
      const eleg = await revalidarCuenta(actual.cuenta_id, actual.tipo)
      if (!eleg.elegible) {
        await bloquearActividad(actual.id, eleg.motivo!)
        return NextResponse.json({
          error:  eleg.motivo,
          codigo: eleg.codigo,
          contactoFaltante: eleg.contactoFaltante,
          bloqueada: true,
        }, { status: 409 })
      }
    }

    // ── Iniciar cronómetro — clic en "Iniciar actividad" ─────────────────────
    if (body.accion === 'iniciar') {
      if (actual.iniciada_en) return NextResponse.json(actual) // ya estaba iniciada, no reiniciar el reloj
      const { data, error } = await supabaseAdmin
        .from('actividades')
        .update({ iniciada_en: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single()
      if (error) {
        // Columna aún no existe en Supabase (falta correr la migración) — no
        // rompemos la actividad, solo dejamos el reloj sin iniciar por ahora.
        return NextResponse.json({ ...actual, migracionPendiente: true })
      }
      return NextResponse.json(data)
    }

    // ── Marcar como completada ────────────────────────────────────────────────
    let extra: Record<string, unknown> = {}
    if (body.completada) {
      // Gate: "Completar Perfil" (Radar de Cuenta incluido) solo se puede cerrar
      // si los datos críticos de la cuenta y las 12 preguntas del Radar ya están
      // guardados de verdad — no basta con escribir un resultado.
      if (actual.tipo === 'validacion' && actual.cuenta_id) {
        const { data: cuenta } = await supabaseAdmin
          .from('cuentas')
          .select(CAMPOS_GAP_SELECT)
          .eq('id', actual.cuenta_id)
          .single()

        const { data: radarRow } = await supabaseAdmin
          .from('radar_respuestas')
          .select('respuestas')
          .eq('cuenta_id', actual.cuenta_id)
          .order('creado_en', { ascending: false })
          .limit(1)

        if (cuenta) {
          const gaps      = detectDataGaps(cuenta as CuentaGapInput)
          const criticos  = gaps.filter(g => g.nivel === 'critico')
          const respuestas = radarRow?.[0]?.respuestas ?? null
          const radarResp  = contarRespuestasRadar(respuestas)
          const radarFaltan = preguntasRadarFaltantes(respuestas)

          if (criticos.length > 0 || radarResp < 12) {
            return NextResponse.json({
              error: 'Esta actividad no se puede marcar como completada: aún faltan datos por registrar en la cuenta.',
              perfilFaltante: criticos.map(g => g.campo),
              radarFaltante:  radarFaltan.map(p => `${p.n}. ${p.texto}`),
              radarRespondidas: radarResp,
            }, { status: 409 })
          }
        }
      }

      /* ── Candado de calidad del cierre (1 Sep 2026) ────────────────────────
       * Antes bastaba cualquier texto para cerrar. Ahora una declaración de
       * baja abre expediente en vez de cerrar, "no contesta" abre secuencia, y
       * una respuesta sin análisis no pasa. Ver lib/actividades/cierre.ts.
       *
       * Importante: la cuenta NO cambia de estatus por lo que escriba el
       * asesor. Se etiqueta como riesgo y se avisa; la baja la valida
       * Dirección con la evidencia del expediente. */
      const veredicto = evaluarCierre({
        resultado: body.resultado,
        tipo: actual.tipo,
        expedienteAdjunto:   body.expediente_baja === true,
        secuenciaRegistrada: body.secuencia_contacto === true,
      })

      if (!veredicto.permitido) {
        // Una declaración de baja se registra aunque la actividad no cierre:
        // deja la cuenta en riesgo y la nota visible para el supervisor.
        if (
          (veredicto.codigo === 'declaracion_baja' || veredicto.codigo === 'declaracion_downgrade') &&
          actual.cuenta_id
        ) {
          await etiquetarSiHayIntencionDeCancelacion(actual.cuenta_id, String(body.resultado ?? ''), actual.id)
        }
        return NextResponse.json({
          error:     veredicto.mensaje,
          codigo:    veredicto.codigo,
          exige:     veredicto.exige,
          preguntas: veredicto.preguntas,
          cierreBloqueado: true,
        }, { status: 409 })
      }

      // Auto-reporte de tiempo — obligatorio para cerrar cualquier actividad.
      const tiempoReportado = Number(body.tiempo_reportado_min)
      if (!tiempoReportado || tiempoReportado <= 0) {
        return NextResponse.json({ error: 'Indica cuánto tiempo te tomó esta actividad antes de marcarla como completada.' }, { status: 400 })
      }

      const tiempoMedido = actual.iniciada_en
        ? Math.max(1, Math.round((Date.now() - new Date(actual.iniciada_en).getTime()) / 60000))
        : null

      extra = { tiempo_reportado_min: tiempoReportado, tiempo_medido_min: tiempoMedido }
    }

    // Campos de control del candado de cierre: viajan en el body pero NO son
    // columnas de `actividades`. Si se colaran al update, romperían el cierre.
    const { expediente_baja: _eb, secuencia_contacto: _sc, ...bodyColumnas } = body as Record<string, unknown>
    void _eb; void _sc

    let { data, error } = await supabaseAdmin
      .from('actividades')
      .update({ ...bodyColumnas, ...extra, actualizado_en: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error && Object.keys(extra).length > 0) {
      // Columnas de tiempo aún no existen en Supabase — reintenta sin ellas
      // para no bloquear el cierre de la actividad (que ya funcionaba antes).
      ;({ data, error } = await supabaseAdmin
        .from('actividades')
        .update({ ...bodyColumnas, actualizado_en: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single())
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Si se marcó como completada: crear seguimiento KAM + actualizar ultimo_contacto
    if (body.completada && data.cuenta_id) {
      const today = new Date().toISOString().split('T')[0]

      await supabaseAdmin.from('seguimientos').insert({
        cuenta_id:    data.cuenta_id,
        fecha:        today,
        tipo:         mapTipo(data.tipo),
        descripcion:  data.descripcion,
        resultado:    body.resultado ?? null,
        asesor:       data.asesor,
        duracion_min: data.tiempo_medido_min ?? null,
      })

      await supabaseAdmin
        .from('cuentas')
        .update({ ultimo_contacto: today })
        .eq('id', data.cuenta_id)
    }

    // Cualquier actividad (completada o no) puede traer una señal de baja en
    // el texto que escribió el asesor — se revisa siempre, no solo en "validación".
    if (data.cuenta_id) {
      const texto = body.completada ? body.resultado : body.motivo_pendiente
      if (texto) await etiquetarSiHayIntencionDeCancelacion(data.cuenta_id, String(texto), data.id)
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
