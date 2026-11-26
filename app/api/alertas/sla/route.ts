import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, traerPorPaginas, esTablaInexistente } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'
import { normalizaAsesor, sesionDe, esRolAcotado, MENSAJE_SIN_CARTERA } from '@/lib/dueno'
import { CATALOGO, LO_QUE_LA_APAGA, type Condicion, type TipoAlerta } from '@/lib/alertas'
import { leeConfiguracion } from '@/lib/alertas-sla-sync'
import {
  semaforoDe, ordenaCola, escalamientoDe, frasesDeCierre, porQueSeGenero,
  parametro, ETIQUETA_NIVEL,
  type EstadoSla, type EvidenciaTipo, type NivelSemaforo, type Semaforo,
  type SeveridadSla,
} from '@/lib/alertas-sla'
import { jugadasPorCuenta, esSubutilizacion } from '@/lib/redimensionar-cuenta'

/**
 * GET /api/alertas/sla — LA COLA DE TRABAJO, CON SU SEMÁFORO
 *
 * ── EL FILTRO VA EN LA CONSULTA, NO EN LO QUE SE PINTA ────────────────────
 *
 * «Un filtro visual no es control de acceso». La cartera se aplica aquí, sobre
 * los `cuentas.id` del asesor, antes de que ninguna fila salga del servidor.
 * Recortar al final deja el dato en la respuesta y lo manda igual el día que
 * alguien añada un campo. [[auditoria-acceso-oct2026]]
 *
 * ── Y SE CRUZA CON `cuentas.asesor` AL LEER ──────────────────────────────
 *
 * No con `alertas_sla.asesor_apertura`, que es HISTORIA: dice qué cartera abrió
 * el compromiso. La cartera se rebalancea —Erick sustituyó a Claudia en 71
 * cuentas el 15 oct 2026— y los compromisos no se reasignan a mano. Filtrar por
 * la columna de apertura le habría escondido a Erick 71 colas de trabajo que
 * son suyas, y se las habría seguido mostrando a una persona que ya no está.
 *
 * ── EL RESUMEN ES DEL UNIVERSO QUE SE LISTA ──────────────────────────────
 *
 * Los filtros de `?semaforo=` y `?condicion=` recortan las filas y NO el
 * resumen: el banner tiene que decir cuántas alertas abiertas hay, no cuántas
 * quedaron después de filtrar. Pero el recorte por CARTERA sí entra en el
 * resumen, porque la pregunta del banner es «¿cuántas tengo YO?».
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Qué build sirve esta ruta. «Lo desplegué» no es «lo están viendo». */
const VERSION = '2026-11-25.1-sla-alertas'

interface FilaCruda {
  id: string
  episodio_id: string
  cuenta_id: string
  condicion: Condicion
  tipo: string
  severidad: SeveridadSla
  severidad_base: SeveridadSla
  ajustes: string[] | null
  estado: EstadoSla
  generada_en: string
  fecha_limite: string
  limite_original: string | null
  fecha_atendida: string | null
  fecha_cerrada: string | null
  cierre_motivo: string | null
  accion_sugerida: string
  evidencia_requerida: EvidenciaTipo[]
  evidencia_tipo: string | null
  evidencia_resumen: string | null
  reprogramaciones: number
  motivo_reprogramacion: string | null
  intentos_sin_respuesta: number
  reintento_limite: string | null
  nivel_escalamiento: number
  escalada_a: string | null
  validada_por: string | null
  rechazo_motivo: string | null
  dueno: string
  empresa: string | null
  consecutivo: string | null
  asesor_apertura: string | null
  mrr_en_riesgo: number | null
}

const CAMPOS =
  'id, episodio_id, cuenta_id, condicion, tipo, severidad, severidad_base, ajustes, estado, generada_en, fecha_limite, limite_original, fecha_atendida, fecha_cerrada, cierre_motivo, accion_sugerida, evidencia_requerida, evidencia_tipo, evidencia_resumen, reprogramaciones, motivo_reprogramacion, intentos_sin_respuesta, reintento_limite, nivel_escalamiento, escalada_a, validada_por, rechazo_motivo, dueno, empresa, consecutivo, asesor_apertura, mrr_en_riesgo'

const dia = (v: unknown): string => String(v ?? '').slice(0, 10)

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const s = sesionDe(req.headers)
  const hoy = hoyEnMexico()

  /* FALLA CERRADO: un rol `asesor` sin cartera no recibe datos. Con el patrón
     viejo —`rolAsesor && suyo`— a quien se le olvidaba el nombre no se le veía
     menos: se le veía TODO. */
  if (esRolAcotado(s) && !s.asesor) {
    return NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 })
  }
  const pedido = sp.get('asesor')?.trim() || ''
  /* Un asesor ve SU cartera aunque pida otra. Esta pantalla es cola de trabajo,
     no consulta: `LECTURA_LIBRE` abre la CONSULTA de una ficha, no la cola de
     otra persona — ahí lo que se vería es a quién le toca qué, que es
     exactamente lo que el candado de cartera separa. */
  const asesor = esRolAcotado(s) ? s.asesor : pedido

  try {
    const cfg = await leeConfiguracion()

    /* ── La cartera, EN LA CONSULTA ─────────────────────────────────────── */
    let ids: string[] | null = null
    if (asesor) {
      const { data, error } = await supabaseAdmin
        .from('cuentas').select('id, asesor')
      if (error) throw error
      const suyo = normalizaAsesor(asesor)
      ids = (data ?? [])
        .filter(r => normalizaAsesor((r as { asesor: string | null }).asesor) === suyo)
        .map(r => String((r as { id: unknown }).id))
      /* Una cartera sin cuentas devuelve una cola vacía, no la de todos: sin
         este corte, un `in()` con lista vacía en PostgREST no filtra nada. */
      if (ids.length === 0) {
        return NextResponse.json({
          rows: [], resumen: resumenVacio(asesor), hoy,
          configuracion: diagnostico(cfg), version: VERSION,
        })
      }
    }

    /* `?cuenta=` para el bloque de la ficha. VA EN LA CONSULTA, igual que la
       cartera: recortar al pintar deja la cola entera viajando por la red para
       enseñar cuatro renglones. Y se CRUZA con el corte de cartera en vez de
       sustituirlo —`.in()` y luego `.eq()` se aplican los dos—, así que pedir
       una cuenta ajena por la URL devuelve vacío y no la cuenta. */
    const cuentaPedida = sp.get('cuenta')?.trim() || ''

    let filas: FilaCruda[]
    try {
      filas = await traerPorPaginas<FilaCruda>((d, h) => {
        let q = supabaseAdmin.from('alertas_sla').select(CAMPOS)
        if (ids) q = q.in('cuenta_id', ids)
        if (cuentaPedida) q = q.eq('cuenta_id', cuentaPedida)
        return q.range(d, h)
      })
    } catch (e) {
      if (esTablaInexistente(e)) {
        /* La tabla no está: se DICE, no se devuelve una cola vacía. Una cola
           vacía se lee como «no tienes nada pendiente», que sobre un asesor con
           alertas abiertas es una mentira en pantalla. */
        return NextResponse.json({
          rows: [], resumen: resumenVacio(asesor),
          noMedible: 'Los compromisos de atención no se están midiendo: falta '
                   + 'correr scripts/migracion-alertas-sla.sql en Supabase.',
          hoy, configuracion: diagnostico(cfg), version: VERSION,
        })
      }
      throw e
    }

    const inhabiles = cfg.calendario.inhabiles

    /* ── La prosa de cada compromiso ────────────────────────────────────── */
    const episodios = await episodiosDe(filas.map(f => f.episodio_id))

    /* ── LA JUGADA DE REDIMENSIONAR, SÓLO PARA SU CLASE ──────────────────
       Instrucción de dirección del 26 nov 2026. Se pide SÓLO para las cuentas
       de subutilización, no para las 240: abrir el Excel de cortes y la
       escalera para una alerta de tickets sería pagar la lectura entera por
       un dato que esa alerta no usa. */
    const deSubutilizacion = filas.filter(f => esSubutilizacion(f.tipo))
    const jugadas = await jugadasPorCuenta(deSubutilizacion.map(f => ({
      id: String(f.cuenta_id),
      mrr: f.mrr_en_riesgo === null ? null : Number(f.mrr_en_riesgo),
    })))

    const enriquecidas = filas.map(f => {
      const semaforo: Semaforo = semaforoDe(
        { estado: f.estado, severidad: f.severidad,
          fechaLimite: dia(f.fecha_limite),
          fechaAtendida: f.fecha_atendida ? dia(f.fecha_atendida) : null },
        hoy, inhabiles, cfg.parametros)
      const ep = episodios.get(f.episodio_id)
      const def = CATALOGO[f.tipo as TipoAlerta]
      const cierre = frasesDeCierre(f.condicion, f.evidencia_requerida ?? [])
      return {
        ...f,
        fecha_limite: dia(f.fecha_limite),
        generada_en: dia(f.generada_en),
        fecha_atendida: f.fecha_atendida ? dia(f.fecha_atendida) : null,
        mrr: f.mrr_en_riesgo === null ? null : Number(f.mrr_en_riesgo),
        semaforo,
        etiquetaNivel: ETIQUETA_NIVEL[semaforo.nivel],
        escalamiento: escalamientoDe(semaforo),
        titulo: def?.titulo ?? f.tipo,
        /* Por qué se generó: 2-3 señales concretas, todas del episodio. No se
           recalcula nada aquí — una lectura nueva daría una segunda cifra del
           mismo hecho. */
        porque: ep ? porQueSeGenero(ep, hoy) : [],
        /* Las DOS frases, siempre juntas: qué cierra la atención, y que eso NO
           apaga la alerta. */
        cierraAtencion: cierre.atencion,
        noApagaLaAlerta: cierre.alerta,
        laApaga: LO_QUE_LA_APAGA[f.condicion] ?? null,
        enlace: `/cuentas/${f.cuenta_id}${def?.ancla ? '#' + def.ancla : ''}`,
        /* «Paga más de lo que usa»: la clase que dirección puso primera, con
           la jugada de redimensionamiento ya resuelta. Para el resto va
           `false` y `null` — no `undefined`, que en JSON desaparece y en
           pantalla se confunde con «no se pudo calcular». */
        subutilizacion: esSubutilizacion(f.tipo),
        jugada: jugadas.get(String(f.cuenta_id))?.jugada ?? null,
      }
    })

    /* ── El resumen, antes de los filtros de pantalla ───────────────────── */
    const abiertas = enriquecidas.filter(x => x.estado !== 'cerrada')
    const resumen = {
      asesor: asesor || null,
      abiertas: abiertas.length,
      vencidas: abiertas.filter(x => x.semaforo.vencida).length,
      venceHoy: abiertas.filter(x => x.semaforo.nivel === 'naranja').length,
      incumplidas: abiertas.filter(x => x.semaforo.nivel === 'rojo_intenso').length,
      bloqueadas: abiertas.filter(x => x.semaforo.nivel === 'bloqueada').length,
      atendidas: abiertas.filter(x => x.semaforo.nivel === 'atendida').length,
      /* EL DINERO SE CUENTA UNA VEZ POR CUENTA, no por alerta. Si una cuenta de
         $20,000 tiene cuatro compromisos, lo que está en riesgo son $20,000 —no
         $80,000—, y es la cifra que va al banner. Es la misma regla que
         `resumir()` en lib/alertas.ts. */
      mrrEnRiesgo: sumaPorCuenta(abiertas),
      mrrVencido: sumaPorCuenta(abiertas.filter(x => x.semaforo.vencida)),
      /* LA CLASE QUE VA PRIMERA, contada aparte. Su dinero también se suma por
         CUENTA y no por alerta: una cuenta con `uso_bajo` y `caida_consumo`
         abiertos pierde su MRR una vez, no dos. */
      subutilizacion: (() => {
        const suyas = abiertas.filter(x => x.subutilizacion)
        const conJugada = suyas.filter(x => x.jugada?.medible === true)
        return {
          cuentas: new Set(suyas.map(x => x.cuenta_id)).size,
          alertas: suyas.length,
          mrr: sumaPorCuenta(suyas),
          vencidas: suyas.filter(x => x.semaforo.vencida).length,
          /* Cuántas traen una propuesta con números y cuántas no. Publicarlo es
             lo que impide que la pantalla parezca completa cuando no lo está.
             [[feedback-cero-sin-medicion]] */
          conPropuesta: conJugada.length,
          sinPropuesta: suyas.length - conJugada.length,
        }
      })(),
      porSemaforo: contarPor(abiertas, x => x.semaforo.nivel),
      porCondicion: contarPor(abiertas, x => x.condicion),
      porSeveridad: contarPor(abiertas, x => x.severidad),
      cuentas: new Set(abiertas.map(x => x.cuenta_id)).size,
      meta: {
        enTiempoPct: parametro(cfg.parametros, 'meta_en_tiempo'),
        criticasVencidas: parametro(cfg.parametros, 'meta_criticas_vencidas'),
      },
    }

    /* ── Los filtros de pantalla, que NO tocan el resumen ───────────────── */
    let lista = enriquecidas
    if (sp.get('abiertas') !== '0') lista = lista.filter(x => x.estado !== 'cerrada')
    const semaforo = sp.get('semaforo')
    const condicion = sp.get('condicion')
    const severidad = sp.get('severidad')
    if (semaforo) lista = lista.filter(x => x.semaforo.nivel === semaforo)
    if (condicion) lista = lista.filter(x => x.condicion === condicion)
    if (severidad) lista = lista.filter(x => x.severidad === severidad)

    /* ── EL ORDEN: LA SUBUTILIZACIÓN PRIMERO ─────────────────────────────
       Instrucción de dirección del 26 nov 2026: «la alerta de mayor riesgo que
       tenemos», porque de ahí salen la cancelación y el downgrade y porque es
       la única que el asesor puede ADELANTARSE a blindar.

       Va como grupo propio delante, no fundida en el orden por dinero. Si se
       fundiera, una cuenta que ya escribió que se va quedaría por debajo de
       una que sólo tiene el plan grande, y las dos son urgentes por motivos
       distintos. Dentro de cada grupo manda el orden de siempre: semáforo y
       después dinero descendente. */
    const cola = [...ordenaCola(lista.filter(x => x.subutilizacion)),
                  ...ordenaCola(lista.filter(x => !x.subutilizacion))]

    return NextResponse.json({
      rows: cola,
      mostradas: lista.length,
      resumen,
      hoy,
      configuracion: diagnostico(cfg),
      version: VERSION,
      generado: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? 'No se pudo leer la cola de atención' },
      { status: 500 })
  }
}

function resumenVacio(asesor: string | null) {
  return {
    asesor: asesor || null, abiertas: 0, vencidas: 0, venceHoy: 0,
    incumplidas: 0, bloqueadas: 0, atendidas: 0,
    mrrEnRiesgo: 0, mrrVencido: 0,
    porSemaforo: {}, porCondicion: {}, porSeveridad: {}, cuentas: 0,
    meta: { enTiempoPct: 90, criticasVencidas: 0 },
  }
}

/**
 * El estado de la configuración, publicado SIEMPRE.
 *
 * Si `sla_config` está vacía o el calendario no se pudo leer, no se abre ningún
 * compromiso — y entonces una cola vacía no significa «nada pendiente». Hay que
 * poder distinguirlo de un vistazo, no deducirlo de que todo esté en cero. Es
 * la misma razón por la que `/api/alertas` publica el estado de la memoria de
 * episodios.
 */
function diagnostico(cfg: Awaited<ReturnType<typeof leeConfiguracion>>) {
  return {
    condiciones: cfg.config.length,
    diasInhabiles: cfg.calendario.cuantos,
    falla: cfg.falla,
  }
}

function sumaPorCuenta(
  filas: ReadonlyArray<{ cuenta_id: string; mrr: number | null }>,
): number {
  const vistas = new Map<string, number>()
  for (const f of filas) vistas.set(f.cuenta_id, f.mrr ?? 0)
  let t = 0
  for (const v of Array.from(vistas.values())) t += v
  return t
}

function contarPor<T>(filas: readonly T[], sel: (x: T) => string): Record<string, number> {
  const m: Record<string, number> = {}
  for (const f of filas) {
    const k = sel(f)
    m[k] = (m[k] ?? 0) + 1
  }
  return m
}

interface FilaEpisodioLeve {
  id: string
  evidencia_actual: string | null
  condicion_desde: string | null
  abierto_en: string
  severidad_peor: string | null
  severidad_actual: string | null
  recurrencia: number | null
}

/** Los episodios de un lote, en UNA consulta. Por alerta serían N. */
async function episodiosDe(ids: readonly string[]): Promise<Map<string, FilaEpisodioLeve>> {
  const fuera = new Map<string, FilaEpisodioLeve>()
  if (ids.length === 0) return fuera
  try {
    const filas = await traerPorPaginas<FilaEpisodioLeve>((d, h) =>
      supabaseAdmin.from('alertas_episodios')
        .select('id, evidencia_actual, condicion_desde, abierto_en, severidad_peor, severidad_actual, recurrencia')
        .in('id', Array.from(ids)).range(d, h))
    for (const f of filas) fuera.set(f.id, f)
  } catch {
    /* Sin episodios, el «por qué se generó» sale vacío y la pantalla lo dice.
       No se improvisa una razón: un motivo inventado sobre una alerta es
       exactamente lo que la vuelve indefendible delante del cliente. */
  }
  return fuera
}

/** Un `NivelSemaforo` es un valor cerrado; se exporta el tipo para la pantalla. */
export type { NivelSemaforo }
