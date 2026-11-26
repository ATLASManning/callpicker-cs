import { supabaseAdmin, traerPorPaginas, esTablaInexistente } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'
import {
  esIndicioDeBaja, type Condicion, type TipoAlerta,
} from '@/lib/alertas'
import { importeDeCuenta, mapaFacturacion } from '@/lib/facturacion-cuenta'
import { cargaDiasInhabiles } from '@/lib/dias-inhabiles-fuente'
import type { Calendario, Dia } from '@/lib/dias-habiles'
import {
  plazoDe, fechaLimiteDe, semaforoDe, escalamientoDe, tocaNotificar,
  accionSugerida, parametro,
  type Ajuste, type EstadoSla, type EvidenciaTipo, type FilaConfig,
  type Parametros, type SeveridadSla,
} from '@/lib/alertas-sla'

/**
 * lib/alertas-sla-sync.ts — QUIEN ESCRIBE LOS COMPROMISOS
 *
 * `lib/alertas-sla.ts` decide; esto persiste. La separación no es estética: la
 * mitad que decide se prueba entera con `npm run test:sla` y sin base de datos,
 * y eso sólo es posible si no arrastra `lib/supabase.ts`.
 *
 * ── EL UNIVERSO ES EL MISMO QUE EL DEL PANEL, Y ESO IMPORTA ───────────────
 *
 * Sólo se abre compromiso para los episodios cuyo tipo es INDICIO DE BAJA
 * (`esIndicioDeBaja`), que es exactamente lo que `/api/alertas` lista desde el
 * 16 nov 2026 por instrucción de dirección. Si el compromiso cubriera más, un
 * asesor tendría fechas límite sobre alertas que su panel no le enseña — dos
 * tableros del mismo día, que es el defecto que esa misma instrucción vino a
 * cerrar. Y si cubriera menos, habría alertas listadas sin fecha, que se leen
 * como atendidas por omisión.
 *
 * La puerta es la función, no una lista tecleada aquí: `esIndicioDeBaja` es «la
 * ÚNICA puerta» por decisión escrita en `lib/alertas.ts`.
 *
 * ── UNA CORRIDA PARCIAL NO CIERRA NADA ───────────────────────────────────
 *
 * Misma regla que los episodios, y por la misma razón: `/api/alertas?asesor=`
 * acota a una cartera, así que una corrida así no ha visto los episodios de los
 * demás y los cerraría como resueltos sin intervención. Sólo `alcance:
 * 'completo'` cierra.
 *
 * ── SIN CALENDARIO NO SE CREA NINGÚN COMPROMISO ──────────────────────────
 *
 * Si `dias_inhabiles` no se puede leer, un plazo nuevo saldría demasiado
 * temprano y acusaría a alguien de un incumplimiento que no cometió. No se
 * inventa un calendario de fines de semana: se devuelve `falla`, no se crea
 * nada, y la corrida siguiente —diaria— lo intenta otra vez. Lo que ya existe
 * no se toca: su fecha está guardada.
 */

export interface ResultadoSla {
  /** Compromisos abiertos al terminar la corrida. */
  abiertos: number
  nuevos: number
  cerrados: number
  escalados: number
  /** Episodios que alertan y NO tienen plazo configurado para su condición. */
  sinConfigurar: Array<{ condicion: string; cuantos: number }>
  /** Por qué no se cerró nada, cuando no se cerró. */
  sinCerrar: string | null
  falla: string | null
}

interface FilaEpisodio {
  id: string
  cuenta_id: string
  condicion: Condicion
  tipo: string
  dueno: string
  estado: string
  consecutivo: string | null
  empresa: string | null
  asesor_apertura: string | null
  abierto_en: string
  condicion_desde: string | null
  severidad_actual: string
  severidad_peor: string
  mrr_actual: number | null
  evidencia_actual: string | null
  recurrencia: number | null
  cierre_motivo: string | null
  cerrado_en: string | null
}

interface FilaSla {
  id: string
  episodio_id: string
  cuenta_id: string
  condicion: Condicion
  severidad: SeveridadSla
  estado: EstadoSla
  fecha_limite: string
  fecha_atendida: string | null
  nivel_escalamiento: number
  notificada_el: string | null
  evidencia_tipo: string | null
  asesor_apertura: string | null
  mrr_en_riesgo: number | null
}

const vacio = (falla: string | null): ResultadoSla => ({
  abiertos: 0, nuevos: 0, cerrados: 0, escalados: 0,
  sinConfigurar: [], sinCerrar: null, falla,
})

/** Si lo visto cae por debajo de esta fracción de lo abierto, no se cierra. */
const QUORUM = 0.6

/* ═══════════════════════════════════════════════════════════════════════════
 * LA CONFIGURACIÓN
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface Configuracion {
  config: FilaConfig[]
  parametros: Parametros
  calendario: Calendario
  falla: string | null
}

/**
 * Lee las tres piezas de configuración de una vez.
 *
 * Si `sla_config` está vacía o no existe, `falla` lo dice y NO se cae a unos
 * plazos por omisión: un plazo que nadie configuró es una política de la casa
 * que nadie ha tomado, y ponerla por nuestra cuenta es inventarla.
 */
export async function leeConfiguracion(): Promise<Configuracion> {
  const calendario = await cargaDiasInhabiles()
  let config: FilaConfig[] = []
  let parametros: Parametros = {}
  let falla: string | null = calendario.falla

  try {
    const { data, error } = await supabaseAdmin
      .from('sla_config')
      .select('condicion, severidad_base, plazo_dias, evidencia, porque')
    if (error) throw error
    config = (data ?? []) as unknown as FilaConfig[]
  } catch (e) {
    const msg = esTablaInexistente(e)
      ? 'La tabla sla_config no existe todavía: correr scripts/migracion-alertas-sla.sql'
      : ((e as Error)?.message ?? 'no se pudo leer sla_config')
    falla = falla ? `${falla} · ${msg}` : msg
  }

  if (!falla && config.length === 0) {
    falla = 'sla_config está vacía: sin plazos configurados no se abre ningún '
          + 'compromiso. No se usan valores por omisión a propósito.'
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('sla_parametros')
      .select('clave, valor')
    if (error) throw error
    const m: Record<string, number> = {}
    for (const r of data ?? []) {
      const f = r as { clave: string; valor: unknown }
      m[f.clave] = Number(f.valor)
    }
    parametros = m
  } catch {
    /* Los parámetros tienen PISO en `lib/alertas-sla.ts`, así que su ausencia
       no abre ninguna puerta: sólo deja de poder ajustarse desde la base. No se
       suma a `falla` por eso. */
  }

  return { config, parametros, calendario, falla }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LOS DOS AJUSTES DE SEVERIDAD DEL ENCARGO
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Las cuentas del 20% de mayor facturación DE CADA CARTERA.
 *
 * ── NO ES `esTop`, Y LOS DOS NOMBRES SON DISTINTOS A PROPÓSITO ────────────
 *
 * `topDeCartera` de `lib/facturacion-cuenta.ts` son las 25 de mayor facturación
 * DE LA EMPRESA, y ese archivo explica por qué se definió así: «TOP» se
 * calculaba antes dentro de `detectarAlertas` sobre las cuentas que esa llamada
 * había cargado, de modo que con un filtro de asesora encima significaba otra
 * cosa — «una cifra que cambia de significado con un filtro».
 *
 * El encargo pide expresamente el otro corte: «el top 20% de facturación de la
 * cartera del asesor». Es una medida legítima y distinta, y se implementa con
 * un nombre distinto —`prioritaria_en_su_cartera`— para que nadie las confunda.
 * Con la del encargo, el asesor de cuentas chicas tiene cuentas prioritarias;
 * con la de la empresa, no tendría ninguna y su cola no se ordenaría nunca.
 *
 * El importe sale del GRC vía `importeDeCuenta`, nunca de
 * `cuentas.facturacion` a secas: esa columna tiene huecos y correcciones
 * pendientes, y el MRR institucional es el del GRC.
 */
export async function prioritariasPorCartera(): Promise<Map<string, boolean>> {
  const fuera = new Map<string, boolean>()
  const mapa = await mapaFacturacion()
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('id, cid, facturacion, asesor')
    .in('estado', ['activo', 'en_riesgo'])
  /* Sin lectura NO se marca nada como prioritario. Un mapa vacío significa
     «ningún ajuste», que es el lado seguro: un ajuste de más APRIETA el plazo
     de una cuenta que no le toca. */
  if (error || !data) return fuera

  const porAsesor = new Map<string, Array<{ id: string; mrr: number }>>()
  for (const c of data) {
    const f = c as { id: unknown; cid: string | null
                     facturacion: number | null; asesor: string | null }
    const k = (f.asesor ?? '').trim() || '(sin asesor)'
    const l = porAsesor.get(k) ?? []
    l.push({ id: String(f.id), mrr: importeDeCuenta(f, mapa).mrr })
    porAsesor.set(k, l)
  }
  for (const lista of Array.from(porAsesor.values())) {
    lista.sort((a, b) => b.mrr - a.mrr)
    /* `ceil`: con una cartera de 3 cuentas el 20% es 0.6, y un redondeo a la
       baja dejaría la cartera entera sin cuenta prioritaria. Al menos una. */
    const cuantas = Math.max(1, Math.ceil(lista.length * 0.2))
    for (const c of lista.slice(0, cuantas)) fuera.set(c.id, true)
  }
  return fuera
}

/**
 * Las cuentas con un ticket de falla ABIERTO.
 *
 * ── AQUÍ HAY UN HUECO DE FUENTE Y SE DICE EN VEZ DE TAPARLO ──────────────
 *
 * El encargo pide subir un nivel «si la cuenta tiene tickets de falla abiertos
 * en Zoho Desk». Nuestra fuente de tickets **sólo trae CERRADOS** —está
 * documentado en `lib/tickets-norm.ts` y es la razón por la que «abiertos» es
 * una magnitud NO MEDIBLE en este tablero—. Preguntarle a esa fuente por
 * abiertos devolvería cero siempre, y un cero sin medición es peor que un
 * hueco: se lee como «no tiene ninguno».
 *
 * Lo que SÍ se mide es el «Reporte Diario Mesa de Ayuda», que es de donde salen
 * `sac_fuera_sla` y `sac_atraso_cronico`. Así que el ajuste se aplica cuando la
 * cuenta tiene un episodio ABIERTO de condición `mesa`: eso es, literalmente,
 * un folio fuera de SLA vigente, medido por la misma fuente que lo alertó.
 *
 * Lo que esto NO cubre: un ticket de falla abierto que la mesa no haya marcado
 * fuera de SLA. Esa cuenta no sube de nivel, y no se puede saber cuántas son
 * hasta que el conector de comunicaciones tenga credencial de servicio — que es
 * la fuente que sí trae los tickets abiertos.
 */
function conFallaAbierta(episodios: readonly FilaEpisodio[]): Set<string> {
  const s = new Set<string>()
  for (const e of episodios) {
    if (e.estado === 'abierta' && e.condicion === 'mesa') s.add(e.cuenta_id)
  }
  return s
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LA SINCRONIZACIÓN
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Traduce el final del episodio al vocabulario del compromiso. */
function cierreDesdeEpisodio(
  motivoEpisodio: string | null, teniaEvidencia: boolean,
): 'atendida' | 'resuelta_sin_intervencion' | 'baja_autorizada' | 'suspendida' {
  if (motivoEpisodio === 'baja_autorizada') return 'baja_autorizada'
  if (motivoEpisodio === 'suspendida') return 'suspendida'
  /* `resuelta` del episodio significa «alguien capturó y por eso se apagó», y
     `remitio` «se apagó sola». Para el COMPROMISO la pregunta es otra: ¿hubo
     evidencia vinculada? Sin ella se cierra como `resuelta_sin_intervencion`
     aunque el episodio diga `resuelta`, porque contarla como atendida sería
     darle al equipo un mérito que no está documentado — y el % en tiempo es lo
     que dirección va a mirar. */
  return teniaEvidencia ? 'atendida' : 'resuelta_sin_intervencion'
}

export async function sincronizarCompromisos(opciones?: {
  alcance?: 'completo' | 'parcial'
  /** Para no releer la configuración cuando quien llama ya la tiene. */
  configuracion?: Configuracion
}): Promise<ResultadoSla> {
  const hoy = hoyEnMexico()
  const alcance = opciones?.alcance ?? 'completo'
  const cfg = opciones?.configuracion ?? await leeConfiguracion()

  if (cfg.falla) return vacio(cfg.falla)
  const inhabiles = cfg.calendario.inhabiles

  /* ── Lo que hay ────────────────────────────────────────────────────────── */
  let episodios: FilaEpisodio[]
  let compromisos: FilaSla[]
  try {
    episodios = await traerPorPaginas<FilaEpisodio>((d, h) =>
      supabaseAdmin.from('alertas_episodios')
        /* En UNA sola cadena: `supabase-js` parsea el `select` a nivel de tipos
           y partirlo con `+` colapsa el genérico a `GenericStringError[]`. */
        .select('id, cuenta_id, condicion, tipo, dueno, estado, consecutivo, empresa, asesor_apertura, abierto_en, condicion_desde, severidad_actual, severidad_peor, mrr_actual, evidencia_actual, recurrencia, cierre_motivo, cerrado_en')
        .range(d, h))
    compromisos = await traerPorPaginas<FilaSla>((d, h) =>
      supabaseAdmin.from('alertas_sla')
        .select('id, episodio_id, cuenta_id, condicion, severidad, estado, fecha_limite, fecha_atendida, nivel_escalamiento, notificada_el, evidencia_tipo, asesor_apertura, mrr_en_riesgo')
        .range(d, h))
  } catch (e) {
    if (esTablaInexistente(e)) {
      return vacio('Falta alguna tabla del SLA: correr scripts/migracion-alertas-sla.sql')
    }
    return vacio((e as Error)?.message ?? 'no se pudieron leer los compromisos')
  }

  const porEpisodio = new Map<string, FilaSla>()
  for (const c of compromisos) porEpisodio.set(c.episodio_id, c)

  const abiertosEp = episodios.filter(e => e.estado === 'abierta')
  const prioritarias = await prioritariasPorCartera()
  const conFalla = conFallaAbierta(abiertosEp)

  /* ── TODA ESCRITURA SE MIRA ─────────────────────────────────────────────
   *
   * `supabase-js` NO LANZA: devuelve `{ data, error }`. Un `await` suelto
   * dentro de un try/catch deja el rechazo invisible, y este proyecto publicó
   * «nuevos: 4, falla: null» durante un día entero por exactamente eso,
   * mientras los mismos cuatro episodios se rechazaban una y otra vez. */
  const fallos: string[] = []
  const mirar = (etq: string, r: { error: { message?: string } | null }) => {
    if (r?.error) fallos.push(`${etq}: ${r.error.message ?? 'error sin mensaje'}`)
    return !r?.error
  }

  /* ── 1 · NACEN ─────────────────────────────────────────────────────────── */
  const sinConfigurar = new Map<string, number>()
  let nuevos = 0

  for (const ep of abiertosEp) {
    if (porEpisodio.has(ep.id)) continue
    /* El universo es el del panel. Ver la cabecera. */
    if (!esIndicioDeBaja({ tipo: ep.tipo as TipoAlerta })) continue

    const esPrioritaria = prioritarias.get(ep.cuenta_id) === true
    const p = plazoDe(
      ep.condicion,
      { esTop: esPrioritaria, ticketAbierto: conFalla.has(ep.cuenta_id) },
      cfg.config,
    )
    if (p.sinConfigurar) {
      sinConfigurar.set(ep.condicion, (sinConfigurar.get(ep.condicion) ?? 0) + 1)
      continue
    }

    const fila = cfg.config.find(f => f.condicion === ep.condicion)!
    const limite = fechaLimiteDe(hoy, p.dias, inhabiles)
    /* El dueño decide si el reloj corre contra el ejecutivo. `sin_consumo_medible`
       y `sin_importe` son de Ingeniería, y un día las nueve alertas de mayor
       prioridad del tablero fueron justamente ésas: un plazo sobre trabajo que
       no puede hacer es cómo se entrena a no mirar el tablero. */
    const bloqueada = ep.dueno !== 'asesor'

    /* Los nombres de los ajustes se renombran para la base: `top_cartera` del
       módulo puro es el 20% de SU cartera, que NO es `esTop` de la empresa. */
    const ajustes: Ajuste[] = p.ajustes
    const etiquetas = ajustes.map(a =>
      a === 'top_cartera' ? 'prioritaria_en_su_cartera' : a)

    const ok = mirar('abrir', await supabaseAdmin.from('alertas_sla').insert({
      episodio_id: ep.id,
      cuenta_id: ep.cuenta_id,
      condicion: ep.condicion,
      tipo: ep.tipo,
      consecutivo: ep.consecutivo,
      empresa: ep.empresa,
      asesor_apertura: ep.asesor_apertura,
      dueno: ep.dueno,
      severidad_base: p.severidadBase,
      severidad: p.severidad,
      ajustes: etiquetas,
      mrr_en_riesgo: ep.mrr_actual,
      accion_sugerida: accionSugerida(
        ep.tipo as TipoAlerta, limite, fila.evidencia as EvidenciaTipo[]),
      evidencia_requerida: fila.evidencia,
      generada_en: hoy,
      fecha_limite: limite,
      estado: bloqueada ? 'bloqueada' : 'nueva',
    }))
    if (!ok) continue
    nuevos++
    await anota({
      slaId: null, episodioId: ep.id, cuentaId: ep.cuenta_id,
      usuario: 'cron', rol: 'sistema', evento: 'generada',
      detalle: {
        condicion: ep.condicion, tipo: ep.tipo,
        severidad_base: p.severidadBase, severidad: p.severidad,
        ajustes: etiquetas, plazo_dias: p.dias, fecha_limite: limite,
        bloqueada,
      },
    })
  }

  /* ── 2 · MUEREN con su episodio ────────────────────────────────────────── */
  let cerrados = 0
  let sinCerrar: string | null = null

  const porId = new Map<string, FilaEpisodio>()
  for (const e of episodios) porId.set(e.id, e)

  const porCerrar = compromisos.filter(c => {
    if (c.estado === 'cerrada') return false
    const ep = porId.get(c.episodio_id)
    return !!ep && ep.estado === 'cerrada'
  })

  if (alcance !== 'completo') {
    if (porCerrar.length) {
      sinCerrar = 'corrida parcial: sólo una corrida completa cierra compromisos'
    }
  } else if (compromisos.length > 0
             && abiertosEp.length < compromisos.length * QUORUM) {
    /* La misma compuerta que los episodios, y por el mismo motivo: si una
       fuente no cargó, el detector deja de ver muchas condiciones a la vez y
       sin quórum medio tablero se cerraría como «resuelto sin intervención».
       Se escribe lo que se vio y NO se cierra. */
    sinCerrar = `quórum: ${abiertosEp.length} episodios abiertos contra `
              + `${compromisos.length} compromisos. Una caída así suele ser una `
              + `fuente que no cargó, no medio tablero resolviéndose de golpe.`
  }

  if (!sinCerrar) {
    for (const c of porCerrar) {
      const ep = porId.get(c.episodio_id)!
      const motivo = cierreDesdeEpisodio(ep.cierre_motivo, !!c.evidencia_tipo)
      const ok = mirar('cerrar', await supabaseAdmin.from('alertas_sla').update({
        estado: 'cerrada',
        /* El día en que la condición dejó de VERSE, no hoy: la ventana de
           gracia y los huecos del cron son nuestros, no del cliente. */
        fecha_cerrada: ep.cerrado_en ?? hoy,
        cierre_motivo: motivo,
      }).eq('id', c.id))
      if (!ok) continue
      cerrados++
      await anota({
        slaId: c.id, episodioId: c.episodio_id, cuentaId: c.cuenta_id,
        usuario: 'cron', rol: 'sistema', evento: 'cerrada',
        detalle: { motivo, cierre_episodio: ep.cierre_motivo,
                   tenia_evidencia: !!c.evidencia_tipo },
      })
    }
  }

  /* ── 3 · ESCALAN ───────────────────────────────────────────────────────── */
  let escalados = 0
  for (const c of compromisos) {
    if (c.estado === 'cerrada' || c.estado === 'bloqueada') continue
    if (porCerrar.some(x => x.id === c.id) && !sinCerrar) continue

    const sem = semaforoDe(
      { estado: c.estado, severidad: c.severidad,
        fechaLimite: String(c.fecha_limite).slice(0, 10),
        fechaAtendida: c.fecha_atendida ? String(c.fecha_atendida).slice(0, 10) : null },
      hoy, inhabiles, cfg.parametros)
    const esc = escalamientoDe(sem)
    if (esc.nivel === 0) continue
    if (!tocaNotificar(esc.nivel, c.notificada_el
          ? String(c.notificada_el).slice(0, 10) : null, hoy)) continue

    const subio = esc.nivel > (c.nivel_escalamiento ?? 0)
    const ok = mirar('escalar', await supabaseAdmin.from('alertas_sla').update({
      nivel_escalamiento: Math.max(esc.nivel, c.nivel_escalamiento ?? 0),
      escalada_a: esc.a,
      escalada_en: hoy,
      notificada_el: hoy,
      /* `escalada` sólo se pone cuando llega a dirección: los niveles 1 y 2 son
         avisos y no cambian en qué estado está el compromiso. Si el nivel 1
         cambiara el estado, una alerta que vence hoy dejaría de ser `nueva` sin
         que nadie la hubiera tocado. */
      ...(esc.nivel === 3 && c.estado !== 'escalada' ? { estado: 'escalada' } : {}),
    }).eq('id', c.id))
    if (!ok) continue
    escalados++
    await anota({
      slaId: c.id, episodioId: c.episodio_id, cuentaId: c.cuenta_id,
      usuario: 'cron', rol: 'sistema',
      evento: esc.nivel === 3 ? 'escalada' : 'notificada',
      detalle: { nivel: esc.nivel, a: esc.a, porque: esc.porque,
                 semaforo: sem.nivel, dias_habiles: sem.habiles, subio },
    })
  }

  const abiertos = compromisos.filter(c => c.estado !== 'cerrada').length
                 + nuevos - cerrados

  return {
    abiertos, nuevos, cerrados, escalados,
    sinConfigurar: Array.from(sinConfigurar.entries())
      .map(([condicion, cuantos]) => ({ condicion, cuantos })),
    sinCerrar,
    falla: fallos.length
      ? `${fallos.length} escritura(s) rechazada(s) — ${fallos.slice(0, 3).join(' · ')}`
      : null,
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LA BITÁCORA
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface Asiento {
  slaId: string | null
  episodioId?: string | null
  cuentaId: string | null
  /** Sale de la SESIÓN, nunca del cuerpo de la petición. */
  usuario: string
  rol: string | null
  evento: string
  detalle: Record<string, unknown>
  /**
   * `true` para el único asiento que NO cuelga de un compromiso: el aviso
   * diario por correo, que es un hecho del DÍA —un resumen por persona, no uno
   * por alerta—. Se pide EXPLÍCITAMENTE para que un `slaId` que llega nulo por
   * error siga cayendo en el aviso de abajo en vez de escribirse huérfano; la
   * base lo exige igual con `bitacora_sin_sla_solo_aviso`.
   */
  deDia?: true
}

/**
 * Escribe un asiento. Nunca lanza: una bitácora que no se puede escribir no
 * debe tumbar la gestión que estaba documentando — pero tampoco se calla.
 *
 * Cuando `slaId` es `null` —el asiento de `generada`, que ocurre antes de
 * conocer el id— se resuelve por el episodio. Si tampoco se puede, se deja
 * constancia en consola: el asiento perdido es información, y perderla en
 * silencio es cómo se construye una bitácora que miente por omisión.
 */
export async function anota(a: Asiento): Promise<void> {
  let slaId = a.slaId
  if (!slaId && a.episodioId) {
    const { data } = await supabaseAdmin
      .from('alertas_sla').select('id').eq('episodio_id', a.episodioId).maybeSingle()
    slaId = data ? String((data as { id: unknown }).id) : null
  }
  if (!slaId && !a.deDia) {
    console.error('[sla bitácora] asiento sin compromiso:', a.evento, a.episodioId)
    return
  }
  const { error } = await supabaseAdmin.from('alertas_sla_bitacora').insert({
    sla_id: slaId, cuenta_id: a.cuentaId,
    usuario: a.usuario, rol: a.rol, evento: a.evento, detalle: a.detalle,
  })
  if (error) console.error('[sla bitácora] rechazada:', error.message, a.evento)
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ATENDER, REPROGRAMAR, VALIDAR
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface Compromiso extends FilaSla {
  tipo: string
  evidencia_requerida: EvidenciaTipo[]
  reprogramaciones: number
  intentos_sin_respuesta: number
  dueno: string
  empresa: string | null
  consecutivo: string | null
  generada_en: string
  accion_sugerida: string
  ajustes: string[] | null
  limite_original: string | null
  motivo_reprogramacion: string | null
  reintento_limite: string | null
  cierre_motivo: string | null
  fecha_cerrada: string | null
  evidencia_id: string | null
  evidencia_resumen: string | null
  validada_por: string | null
  rechazo_motivo: string | null
  escalada_a: string | null
}

const CAMPOS_SLA =
  'id, episodio_id, cuenta_id, condicion, tipo, severidad, severidad_base, ajustes, estado, generada_en, fecha_limite, limite_original, fecha_atendida, fecha_cerrada, cierre_motivo, accion_sugerida, evidencia_requerida, evidencia_tipo, evidencia_id, evidencia_resumen, reprogramaciones, motivo_reprogramacion, intentos_sin_respuesta, reintento_limite, nivel_escalamiento, escalada_a, escalada_en, notificada_el, validada_por, validada_en, rechazo_motivo, dueno, empresa, consecutivo, asesor_apertura, mrr_en_riesgo'

/** Un compromiso por su id. `null` si no existe. */
export async function compromisoPorId(id: string): Promise<Compromiso | null> {
  const { data, error } = await supabaseAdmin
    .from('alertas_sla').select(CAMPOS_SLA).eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as unknown as Compromiso
}

/** Los compromisos abiertos de una cuenta, para la ficha. */
export async function compromisosDeCuenta(cuentaId: string): Promise<Compromiso[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('alertas_sla').select(CAMPOS_SLA).eq('cuenta_id', cuentaId)
      .order('fecha_limite', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Compromiso[]
  } catch {
    /* Sin la tabla la ficha no enseña el bloque. NO se devuelve «sin
       compromisos»: no haber medido y no tener ninguno son cosas distintas, y
       colapsarlas es lo que esta casa tiene prohibido. */
    return []
  }
}

/**
 * Vincula la evidencia y marca la atención.
 *
 * NO comprueba el contenido de la evidencia: eso lo hace
 * `validaSeguimiento`/`validaReunion` en la ruta, que es donde está el cuerpo
 * de la petición. Aquí se persiste lo ya validado y se decide qué pasa con el
 * reloj según el RESULTADO:
 *
 *   · `sin_respuesta`      → NO cierra. Sube el contador y pone un reintento a
 *                            un día hábil, sin tocar `fecha_limite`. Al tercero
 *                            escala.
 *   · `riesgo_confirmado`  → cierra esta atención. La alerta crítica de
 *                            retención la abre la capa cualitativa en la
 *                            corrida siguiente, al leer la prosa del
 *                            seguimiento: no se fabrica aquí un episodio sin
 *                            condición detrás, que la primera corrida completa
 *                            cerraría como «remitió».
 *   · cualquier otro       → atendida, pendiente de validación.
 */
export async function vinculaEvidencia(p: {
  sla: Compromiso
  evidenciaTipo: EvidenciaTipo
  evidenciaId: string
  resumen: string
  resultado: string | null
  efecto: 'cierra' | 'reintento' | 'riesgo_confirmado'
  usuario: string
  rol: string | null
  inhabiles: ReadonlySet<Dia>
  parametros: Parametros
  reintentoLimite: Dia
}): Promise<{ ok: true; estado: EstadoSla } | { ok: false; error: string }> {
  const hoy = hoyEnMexico()

  if (p.efecto === 'reintento') {
    const intentos = (p.sla.intentos_sin_respuesta ?? 0) + 1
    const tope = parametro(p.parametros, 'intentos_sin_respuesta_escala')
    const escala = intentos >= tope
    const { error } = await supabaseAdmin.from('alertas_sla').update({
      estado: 'en_proceso',
      intentos_sin_respuesta: intentos,
      reintento_limite: p.reintentoLimite,
      /* La evidencia se guarda aunque no cierre: el intento es trabajo y se
         documenta. Lo que NO se pone es `fecha_atendida`, que es lo que haría
         al compromiso pasar por atendido. */
      evidencia_tipo: p.evidenciaTipo,
      evidencia_id: p.evidenciaId,
      evidencia_resumen: p.resumen.slice(0, 500),
      ...(escala ? {
        nivel_escalamiento: Math.max(2, p.sla.nivel_escalamiento ?? 0),
        escalada_a: 'asesor_y_lider',
        escalada_en: hoy,
      } : {}),
    }).eq('id', p.sla.id)
    if (error) return { ok: false, error: error.message }
    await anota({
      slaId: p.sla.id, cuentaId: p.sla.cuenta_id, usuario: p.usuario, rol: p.rol,
      evento: 'sin_respuesta',
      detalle: { intentos, tope, reintento_limite: p.reintentoLimite, escala,
                 evidencia_tipo: p.evidenciaTipo, evidencia_id: p.evidenciaId },
    })
    return { ok: true, estado: 'en_proceso' }
  }

  const { error } = await supabaseAdmin.from('alertas_sla').update({
    estado: 'atendida_pendiente_validacion',
    fecha_atendida: hoy,
    evidencia_tipo: p.evidenciaTipo,
    evidencia_id: p.evidenciaId,
    evidencia_resumen: p.resumen.slice(0, 500),
  }).eq('id', p.sla.id)
  if (error) return { ok: false, error: error.message }

  await anota({
    slaId: p.sla.id, cuentaId: p.sla.cuenta_id, usuario: p.usuario, rol: p.rol,
    evento: 'atendida',
    detalle: {
      evidencia_tipo: p.evidenciaTipo, evidencia_id: p.evidenciaId,
      resultado: p.resultado, efecto: p.efecto,
      fecha_limite: p.sla.fecha_limite, fecha_atendida: hoy,
      en_tiempo: hoy <= String(p.sla.fecha_limite).slice(0, 10),
      /* Cuando el resultado es «riesgo confirmado» se anota que la crítica de
         retención la abrirá la capa cualitativa, no esta escritura. Sin esta
         línea, dentro de un mes nadie sabría por qué no se creó aquí. */
      ...(p.efecto === 'riesgo_confirmado'
        ? { retencion: 'la abre lib/senal-escrita.ts en la corrida siguiente, '
                     + 'al leer la prosa del seguimiento' }
        : {}),
    },
  })
  return { ok: true, estado: 'atendida_pendiente_validacion' }
}

/** Mueve la fecha. Lo que se puede o no se puede lo decide `reprograma()`. */
export async function aplicaReprogramacion(p: {
  sla: Compromiso
  nuevoLimite: Dia
  motivo: string
  usuario: string
  rol: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin.from('alertas_sla').update({
    fecha_limite: p.nuevoLimite,
    reprogramaciones: (p.sla.reprogramaciones ?? 0) + 1,
    motivo_reprogramacion: p.motivo,
    /* `limite_original` lo pone el trigger `trg_sla_reloj` la primera vez, para
       que una corrección hecha a mano por SQL también lo conserve. */
  }).eq('id', p.sla.id)
  if (error) return { ok: false, error: error.message }
  await anota({
    slaId: p.sla.id, cuentaId: p.sla.cuenta_id, usuario: p.usuario, rol: p.rol,
    evento: 'reprogramada',
    detalle: { de: p.sla.fecha_limite, a: p.nuevoLimite, motivo: p.motivo,
               numero: (p.sla.reprogramaciones ?? 0) + 1 },
  })
  return { ok: true }
}

/**
 * El líder valida o rechaza la evidencia.
 *
 * Al rechazar, la fecha límite NO se reinicia: el reloj original sigue siendo
 * el que cuenta. Reiniciarlo convertiría un rechazo en una prórroga, y entonces
 * una evidencia floja sería la forma más rápida de ganar días.
 */
export async function validaAtencion(p: {
  sla: Compromiso
  acepta: boolean
  motivo?: string
  usuario: string
  rol: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const hoy = hoyEnMexico()
  if (p.acepta) {
    const { error } = await supabaseAdmin.from('alertas_sla').update({
      estado: 'cerrada', fecha_cerrada: hoy, cierre_motivo: 'atendida',
      validada_por: p.usuario, validada_en: hoy, rechazo_motivo: null,
    }).eq('id', p.sla.id)
    if (error) return { ok: false, error: error.message }
    await anota({
      slaId: p.sla.id, cuentaId: p.sla.cuenta_id, usuario: p.usuario, rol: p.rol,
      evento: 'cerrada',
      detalle: { motivo: 'atendida', validada_por: p.usuario,
                 en_tiempo: String(p.sla.fecha_atendida ?? hoy).slice(0, 10)
                            <= String(p.sla.fecha_limite).slice(0, 10) },
    })
    return { ok: true }
  }
  if (!p.motivo || p.motivo.trim().length < 20) {
    return { ok: false, error: 'Un rechazo sin motivo no es un rechazo: hacen '
                            + 'falta al menos 20 caracteres que digan qué falta.' }
  }
  const { error } = await supabaseAdmin.from('alertas_sla').update({
    estado: 'reabierta', fecha_atendida: null,
    rechazo_motivo: p.motivo, validada_por: p.usuario, validada_en: hoy,
  }).eq('id', p.sla.id)
  if (error) return { ok: false, error: error.message }
  await anota({
    slaId: p.sla.id, cuentaId: p.sla.cuenta_id, usuario: p.usuario, rol: p.rol,
    evento: 'evidencia_rechazada',
    detalle: { motivo: p.motivo,
               fecha_limite: p.sla.fecha_limite,
               nota: 'la fecha límite NO se reinicia: el reloj original sigue' },
  })
  return { ok: true }
}
