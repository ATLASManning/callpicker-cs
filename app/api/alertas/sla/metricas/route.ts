import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, traerPorPaginas, esTablaInexistente } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'
import { normalizaAsesor, sesionDe, esRolAcotado, MENSAJE_SIN_CARTERA } from '@/lib/dueno'
import { leeConfiguracion } from '@/lib/alertas-sla-sync'
import {
  semaforoDe, diasDeRetraso, parametro,
  type EstadoSla, type SeveridadSla,
} from '@/lib/alertas-sla'
import type { Condicion } from '@/lib/alertas'

/**
 * GET /api/alertas/sla/metricas — EL TABLERO DE CUMPLIMIENTO
 *
 * ── LA RUTA ESTÁTICA GANA A LA DINÁMICA ───────────────────────────────────
 *
 * Esto convive con `/api/alertas/sla/[id]`. Next resuelve el segmento literal
 * antes que el dinámico, así que `metricas` nunca se lee como un id —y un id
 * con ese texto no puede existir, son UUID—. Se dice porque el día que alguien
 * añada otra ruta aquí tiene que saberlo.
 *
 * ── QUIÉN VE QUÉ ──────────────────────────────────────────────────────────
 *
 * Un asesor ve SU cumplimiento. Administración ve el de todos, y desglosado por
 * persona. El recorte va en la consulta, igual que en la cola: un porcentaje
 * calculado sobre toda la empresa y servido a un asesor le diría de pasada
 * cómo va la cartera de sus compañeros.
 *
 * ── LA MÉTRICA QUE HAY QUE MIRAR CON MÁS CUIDADO ──────────────────────────
 *
 * «Alertas resueltas sin intervención» la pide el encargo con estas palabras:
 * *señal de que el motor o el asesor no agregan valor*. Es la única métrica de
 * esta ruta cuyo número alto acusa al TABLERO y no a la persona: una condición
 * que se apaga sola antes de que a nadie le toque atenderla, o nunca debió
 * abrir un compromiso, o el plazo que tiene es demasiado largo. Va con su
 * frase, para que no se lea como productividad.
 *
 * ── Y EL DENOMINADOR SE DICE SIEMPRE ──────────────────────────────────────
 *
 * Ningún porcentaje viaja solo: cada uno lleva `de` con el número de casos que
 * lo forman. «100% en tiempo» sobre dos alertas y sobre doscientas no es la
 * misma afirmación, y un porcentaje sin denominador es lo que convirtió una
 * suma de tasas en el «24.7% de churn acumulado» de este mismo tablero.
 * [[churn-nivel-cuenta]] [[feedback-metricas-derivadas-origen]]
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VERSION = '2026-11-25.1-cumplimiento-sla'

interface Fila {
  id: string
  cuenta_id: string
  condicion: Condicion
  severidad: SeveridadSla
  estado: EstadoSla
  generada_en: string
  fecha_limite: string
  fecha_atendida: string | null
  fecha_cerrada: string | null
  cierre_motivo: string | null
  reprogramaciones: number
  intentos_sin_respuesta: number
  nivel_escalamiento: number
  rechazo_motivo: string | null
  mrr_en_riesgo: number | null
}

/* UNA SOLA CADENA LITERAL, y no concatenada ni en una constante aparte:
   supabase-js resuelve el tipo de `select()` leyendo el literal, y en cuanto se
   le pasa un `string` cualquiera colapsa el genérico a `GenericStringError[]` y
   la fila deja de tener tipo. Ya pasó una vez en este repo. */
const CAMPOS = 'id, cuenta_id, condicion, severidad, estado, generada_en, fecha_limite, fecha_atendida, fecha_cerrada, cierre_motivo, reprogramaciones, intentos_sin_respuesta, nivel_escalamiento, rechazo_motivo, mrr_en_riesgo' as const

const dia = (v: string | null) => (v ? String(v).slice(0, 10) : null)

/** Un porcentaje NUNCA sin su denominador. */
function pct(parte: number, de: number) {
  return { parte, de, pct: de === 0 ? null : Math.round((parte / de) * 1000) / 10 }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const s = sesionDe(req.headers)
  const hoy = hoyEnMexico()

  if (esRolAcotado(s) && !s.asesor) {
    return NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 })
  }
  const asesor = esRolAcotado(s) ? s.asesor : (sp.get('asesor')?.trim() || '')
  /* El periodo se declara. Sin `desde`, lo que se mide es TODO lo generado, y
     eso hay que poder leerlo en la respuesta: un cumplimiento histórico y el de
     este mes son dos cifras distintas del mismo nombre. */
  const desde = sp.get('desde')?.trim() || null
  const hasta = sp.get('hasta')?.trim() || null

  try {
    const cfg = await leeConfiguracion()

    /* ── La cartera y el dueño de cada cuenta, en una sola lectura ───────── */
    const { data: cs, error: eCs } = await supabaseAdmin
      .from('cuentas').select('id, asesor, empresa')
    if (eCs) throw eCs
    const duenoDe = new Map<string, string>()
    const empresaDe = new Map<string, string>()
    for (const c of (cs ?? []) as Array<{ id: string; asesor: string | null; empresa: string | null }>) {
      duenoDe.set(String(c.id), c.asesor ?? '')
      empresaDe.set(String(c.id), c.empresa ?? '')
    }

    let ids: string[] | null = null
    if (asesor) {
      const suyo = normalizaAsesor(asesor)
      ids = Array.from(duenoDe.entries())
        .filter(([, d]) => normalizaAsesor(d) === suyo)
        .map(([id]) => id)
      if (ids.length === 0) {
        return NextResponse.json({ vacio: true, asesor, hoy, version: VERSION })
      }
    }

    let filas: Fila[]
    try {
      filas = await traerPorPaginas<Fila>((d, h) => {
        let q = supabaseAdmin.from('alertas_sla').select(CAMPOS)
        if (ids) q = q.in('cuenta_id', ids)
        if (desde) q = q.gte('generada_en', desde)
        if (hasta) q = q.lte('generada_en', hasta)
        return q.range(d, h)
      })
    } catch (e) {
      if (esTablaInexistente(e)) {
        return NextResponse.json({
          noMedible: 'No hay tablero de cumplimiento porque no hay compromisos: '
                   + 'falta correr scripts/migracion-alertas-sla.sql en Supabase.',
          hoy, version: VERSION,
        })
      }
      throw e
    }

    /* ── Los rechazos y las reprogramaciones salen de la BITÁCORA ──────────
       No de un contador en la fila: `reprogramaciones` dice cuántas veces se
       movió la fecha, pero una alerta reabierta y vuelta a atender no deja
       rastro en ninguna columna. La bitácora es insertable y nada más, así que
       es la única fuente que no se puede haber sobrescrito. */
    let rechazos = 0
    let reabiertas = new Set<string>()
    let bitacoraFalla: string | null = null
    try {
      const asientos = await traerPorPaginas<{ alerta_sla_id: string; evento: string }>(
        (d, h) => supabaseAdmin.from('alertas_sla_bitacora')
          .select('alerta_sla_id, evento')
          .eq('evento', 'evidencia_rechazada')
          .range(d, h))
      const mios = new Set(filas.map(f => f.id))
      for (const a of asientos) {
        if (!mios.has(String(a.alerta_sla_id))) continue
        rechazos++
        reabiertas.add(String(a.alerta_sla_id))
      }
    } catch (e) {
      /* Se DICE que no se pudo leer en vez de publicar cero rechazos: un cero
         sin medición no es un cero. [[feedback-cero-sin-medicion]] */
      bitacoraFalla = (e as Error)?.message ?? 'no se pudo leer la bitácora'
    }

    const inhabiles = cfg.calendario.inhabiles

    /* ── El universo, partido como el encargo lo pide ────────────────────── */
    const abiertas = filas.filter(f => f.estado !== 'cerrada')
    const cerradas = filas.filter(f => f.estado === 'cerrada')
    /* «Atendidas» incluye las cerradas y las que esperan validación: el trabajo
       se hizo y la fecha en que se hizo es la que cuenta. Esperar la validación
       para contarlo mediría la velocidad de administración, no la del asesor. */
    const atendidas = filas.filter(f => f.fecha_atendida !== null)
    const enTiempo = atendidas.filter(
      f => dia(f.fecha_atendida)! <= dia(f.fecha_limite)!)
    const tarde = atendidas.filter(
      f => dia(f.fecha_atendida)! > dia(f.fecha_limite)!)

    const retrasos = tarde.map(
      f => diasDeRetraso(dia(f.fecha_limite)!, dia(f.fecha_atendida)!, inhabiles))
    const retrasoMedio = retrasos.length === 0
      ? null
      : Math.round((retrasos.reduce((a, b) => a + b, 0) / retrasos.length) * 10) / 10

    /* Vencidas HOY: se calcula, no se lee. `vencida` no es un estado guardado
       —el semáforo es una resta de fechas— y guardarlo obligaría a reescribir
       la tabla cada medianoche. */
    const semaforoDeFila = (f: Fila) => semaforoDe(
      { estado: f.estado, severidad: f.severidad,
        fechaLimite: dia(f.fecha_limite)!,
        fechaAtendida: dia(f.fecha_atendida) },
      hoy, inhabiles, cfg.parametros)

    const vencidasHoy = abiertas.filter(f => semaforoDeFila(f).vencida)
    const criticasVencidas = vencidasHoy.filter(f => f.severidad === 'critica')

    const sinIntervencion = cerradas.filter(
      f => f.cierre_motivo === 'resuelta_sin_intervencion')

    const conReprogramacion = filas.filter(f => (f.reprogramaciones ?? 0) > 0)
    const conIntentos = filas.filter(f => (f.intentos_sin_respuesta ?? 0) > 0)

    /* ── El desglose. Por persona sólo si quien pregunta puede verlo ─────── */
    const porAsesor = new Map<string, { total: number; atendidas: number
                                        enTiempo: number; vencidas: number
                                        criticasVencidas: number }>()
    for (const f of filas) {
      const d = duenoDe.get(String(f.cuenta_id)) || 'sin asesor'
      const e = porAsesor.get(d)
        ?? { total: 0, atendidas: 0, enTiempo: 0, vencidas: 0, criticasVencidas: 0 }
      e.total++
      if (f.fecha_atendida) {
        e.atendidas++
        if (dia(f.fecha_atendida)! <= dia(f.fecha_limite)!) e.enTiempo++
      }
      if (f.estado !== 'cerrada' && semaforoDeFila(f).vencida) {
        e.vencidas++
        if (f.severidad === 'critica') e.criticasVencidas++
      }
      porAsesor.set(d, e)
    }

    const porCondicion = new Map<string, { total: number; atendidas: number
                                           enTiempo: number; vencidas: number }>()
    for (const f of filas) {
      const e = porCondicion.get(f.condicion)
        ?? { total: 0, atendidas: 0, enTiempo: 0, vencidas: 0 }
      e.total++
      if (f.fecha_atendida) {
        e.atendidas++
        if (dia(f.fecha_atendida)! <= dia(f.fecha_limite)!) e.enTiempo++
      }
      if (f.estado !== 'cerrada' && semaforoDeFila(f).vencida) e.vencidas++
      porCondicion.set(f.condicion, e)
    }

    const metaPct = parametro(cfg.parametros, 'meta_en_tiempo')
    const metaCriticas = parametro(cfg.parametros, 'meta_criticas_vencidas')
    const cumplimiento = pct(enTiempo.length, atendidas.length)

    return NextResponse.json({
      asesor: asesor || null,
      periodo: {
        desde, hasta,
        /* Se dice CON PALABRAS cuando no hay recorte, en vez de dos `null` que
           alguien lea como «este mes». */
        que: desde || hasta
          ? `generadas entre ${desde ?? 'el principio'} y ${hasta ?? 'hoy'}`
          : 'TODAS las generadas desde que existe el módulo, sin recorte de fechas',
      },
      hoy,
      universo: {
        total: filas.length,
        abiertas: abiertas.length,
        cerradas: cerradas.length,
        atendidas: atendidas.length,
        cuentas: new Set(filas.map(f => f.cuenta_id)).size,
      },
      cumplimiento: {
        enTiempo: cumplimiento,
        meta: metaPct,
        cumpleMeta: cumplimiento.pct === null ? null : cumplimiento.pct >= metaPct,
        tarde: tarde.length,
        retrasoMedioDiasHabiles: retrasoMedio,
        retrasoMaximoDiasHabiles: retrasos.length ? Math.max(...retrasos) : null,
      },
      vencidasHoy: {
        cuantas: vencidasHoy.length,
        criticas: criticasVencidas.length,
        metaCriticas,
        cumpleMeta: criticasVencidas.length <= metaCriticas,
        /* El dinero se cuenta UNA VEZ POR CUENTA. Cuatro compromisos de una
           cuenta de $20,000 son $20,000 en riesgo, no $80,000. */
        mrr: Array.from(new Map(vencidasHoy.map(
          f => [String(f.cuenta_id), Number(f.mrr_en_riesgo ?? 0)])).values())
          .reduce((a, b) => a + b, 0),
      },
      reprogramaciones: {
        alertas: conReprogramacion.length,
        total: conReprogramacion.reduce((a, f) => a + (f.reprogramaciones ?? 0), 0),
        deDos: conReprogramacion.filter(f => (f.reprogramaciones ?? 0) >= 2).length,
      },
      sinRespuesta: {
        alertas: conIntentos.length,
        intentos: conIntentos.reduce((a, f) => a + (f.intentos_sin_respuesta ?? 0), 0),
        escaladas: conIntentos.filter(f => (f.nivel_escalamiento ?? 0) >= 2).length,
      },
      evidenciaRechazada: bitacoraFalla
        ? { medible: false, porque: bitacoraFalla }
        : { medible: true, rechazos, alertas: reabiertas.size },
      resueltasSinIntervencion: {
        ...pct(sinIntervencion.length, cerradas.length),
        /* La frase va PEGADA al número, no en la documentación: sin ella este
           porcentaje se lee como eficiencia. */
        que: 'Se apagaron solas antes de que nadie las atendiera. Un número alto '
           + 'NO es productividad: dice que el motor abrió un compromiso que no '
           + 'hacía falta, o que su plazo es más largo que la vida de la '
           + 'condición. Acusa al tablero, no a la persona.',
      },
      /* El desglose por persona SÓLO para quien ve más de una cartera. A un
         asesor se le devuelve su propia fila y nada más —filtrada en la
         consulta—, así que esto no le añade nada que no tenga. */
      porAsesor: Object.fromEntries(
        Array.from(porAsesor.entries())
          .map(([k, v]) => [k, { ...v, enTiempoPct: pct(v.enTiempo, v.atendidas).pct }])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'es'))),
      porCondicion: Object.fromEntries(
        Array.from(porCondicion.entries())
          .map(([k, v]) => [k, { ...v, enTiempoPct: pct(v.enTiempo, v.atendidas).pct }])
          .sort((a, b) => (b[1] as { total: number }).total - (a[1] as { total: number }).total)),
      configuracion: {
        condiciones: cfg.config.length,
        diasInhabiles: cfg.calendario.cuantos,
        falla: cfg.falla,
      },
      version: VERSION,
    })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error)?.message ?? 'No se pudo calcular el cumplimiento' },
      { status: 500 })
  }
}
