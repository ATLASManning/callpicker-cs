import { supabaseAdmin } from '@/lib/supabase'
import { ahoraEnMexico, fechaLocal } from '@/lib/fecha-local'
import { mapaFacturacion, importeDeCuenta } from '@/lib/facturacion-cuenta'
import { ultimoContactoEfectivoPorCuenta, diasSinContacto } from '@/lib/contacto-cuenta'
import { todosLosCortes } from '@/lib/cortes-cuenta'
import { resumenLlamadas } from '@/lib/llamadas-resumen'
import { detectarAlertas } from '@/lib/alertas-detectar'
import { tareasDeHuecos, type ClaveHueco } from '@/lib/prediccion/huecos'

/**
 * lib/prediccion/snapshot.ts — LA MEMORIA QUE EL TABLERO NO TIENE
 *
 * ── POR QUE ESTO ES LO UNICO URGENTE DEL PLAN PREDICTIVO ───────────────────
 *
 * Todo lo demas se puede construir despues. Esto no. Medido en la Fase 1:
 *
 *   · `health_score_historial` tiene OCHO filas, de ocho cuentas, en cuatro
 *     fechas sueltas. Se escribe solo cuando alguien edita una cuenta a mano.
 *   · `cuentas.health_score` es `GENERATED ALWAYS` sobre cuatro sub-scores que
 *     se SOBREESCRIBEN. No hay forma de saber que valia el mes pasado.
 *   · El tablero recalcula todo en cada peticion.
 *
 * Hay 18 eventos de baja fechados y entrenables contra los 30 que pide el
 * documento. La brecha se cierra esperando — pero solo si alguien guarda. Cada
 * semana sin snapshot es una semana que nunca se podra entrenar, y no se puede
 * reconstruir hacia atras porque el dato de origen ya se sobreescribio.
 *
 * ── NO REPRODUCE NINGUNA REGLA ─────────────────────────────────────────────
 *
 * El §SEG-05 del documento permite dos caminos: leer el resultado de una logica
 * existente, o reproducirla. Aqui se LEE, siempre, y por una razon que no es de
 * estilo: reproducir la regla del MRR o la del contacto crearia una segunda
 * cifra de la misma cosa. Direccion fue explicita — «no puede haber dos cifras».
 *
 *   MRR          -> `mapaFacturacion` + `importeDeCuenta`  (GRC por CID)
 *   contacto     -> `ultimoContactoEfectivoPorCuenta`      (solo canales reales)
 *   consumo      -> `todosLosCortes` + `pctConsumo`        (recalculado, nunca
 *                                                           el % del archivo)
 *   alertas      -> `detectarAlertas`                      (los 18 tipos)
 *
 * ── SE ESCRIBE SOLO EN `prediccion` ────────────────────────────────────────
 *
 * Ni un UPDATE a `public`. El esquema lo crea
 * `scripts/migracion-prediccion-snapshot.sql`, que ejecuta una persona.
 */

/** Cuantas tareas de hueco se le abren a cada asesor por semana.
 *
 *  DIEZ, igual que la cadencia de seguimientos que fijo direccion. No es un
 *  numero elegido a gusto: si se abrieran todas las que existen, un asesor
 *  recibiria mas de doscientas el primer lunes y aprenderia a no mirarlas. El
 *  orden es por dinero a ciegas, asi que las diez de la semana son las diez que
 *  mas tapan. Ver [[feedback-actividades-sac]]. */
const TAREAS_POR_ASESOR = 10

/** Cuantas cuentas de cada asesor son poblacion primaria.
 *
 *  Decision de direccion, 7 oct 2026: las 25 principales de CADA asesor. Son 75
 *  cuentas y $1,655,430 — el 74.6% de la cartera. */
const TOP_POR_ASESOR = 25

/** El lunes de la semana en curso, en hora de Mexico.
 *
 *  `ahoraEnMexico()` devuelve una fecha ya trasladada, asi que `getDay()` sobre
 *  ella SI es seguro — es justo el par que usa el generador semanal. Hacerlo con
 *  `new Date()` pelado daria el lunes equivocado entre las 18:00 y la medianoche
 *  de Mexico, porque Vercel va en UTC. Ver [[feedback-fechas-zona-mexico]]. */
export function lunesDeEstaSemana(base: Date = new Date()): string {
  const mx = ahoraEnMexico(base)
  const dow = mx.getDay()                   // 0 domingo … 6 sabado
  const atras = dow === 0 ? 6 : dow - 1     // el domingo pertenece a su lunes anterior
  mx.setDate(mx.getDate() - atras)
  return fechaLocal(mx)
}

export interface ResultadoSnapshot {
  semana: string
  cuentasVistas: number
  filasEscritas: number
  tareasAbiertas: number
  tareasCerradas: number
  /** `null` = termino bien. Con texto = termino, y hay que leerlo.
   *
   *  Existe porque supabase-js NO LANZA: devuelve `{data, error}`. Este proyecto
   *  publico durante un dia entero `nuevos: 4, falla: null` mientras los mismos
   *  cuatro episodios fallaban en silencio. Cada escritura de aqui se mira. */
  falla: string | null
  porAsesor: Record<string, { cuentas: number; tareas: number }>
}

interface FilaSnapshot {
  semana: string
  cuenta_id: string
  cid: string | null
  empresa: string
  asesor: string | null
  estado: string
  es_top_asesor: boolean
  mrr: number | null
  mrr_origen: string
  mrr_medible: boolean
  consumo_pct: number | null
  minutos_incluidos: number | null
  minutos_consumidos: number | null
  consumo_base: string | null
  consumo_medible: boolean
  mes_del_corte: string | null
  panel_visitas: number | null
  panel_desarrolladores: number | null
  pago_exitoso: boolean | null
  dias_sin_contacto: number | null
  contacto_medible: boolean
  health_score: number | null
  hs_pct_real: number | null
  alertas_abiertas: number
  alertas_familias: string[]
  condicion_mas_vieja_dias: number | null
  huecos: string[]
}

/**
 * Que porcentaje del Health Score se apoya en dato capturado.
 *
 * ES UNA APROXIMACION Y SE DICE: los cuatro sub-scores nacen en 50 y se quedan
 * ahi si nadie los captura, asi que lo unico observable es si valen 50 o no. Un
 * sub-score capturado que de verdad valga 50 se cuenta como fabricado, de modo
 * que esta cifra SUBESTIMA el dato real. El sesgo va en una sola direccion y
 * conviene saberlo antes de usarla como feature.
 *
 * Los pesos son los de `lib/health-score.ts`, no otros.
 */
function pctRealDelHealthScore(c: {
  score_actividad?: number | null; score_adopcion?: number | null
  score_pago?: number | null; score_relacional?: number | null
}): number | null {
  const PESOS: Array<[number | null | undefined, number]> = [
    [c.score_actividad, 0.35], [c.score_adopcion, 0.30],
    [c.score_pago, 0.20], [c.score_relacional, 0.15],
  ]
  let real = 0, total = 0
  for (const [v, p] of PESOS) {
    total += p
    if (v !== null && v !== undefined && v !== 50) real += p
  }
  return total > 0 ? Math.round((100 * real) / total) : null
}

/** Toma el snapshot de la semana y abre las tareas de los huecos. */
export async function tomarSnapshot(
  disparo: 'cron' | 'manual' = 'manual',
  base: Date = new Date(),
): Promise<ResultadoSnapshot> {
  const semana = lunesDeEstaSemana(base)
  const fallos: string[] = []
  const mirar = (etq: string, r: { error: { message?: string } | null } | null) => {
    if (r?.error) fallos.push(`${etq}: ${r.error.message ?? 'error sin mensaje'}`)
    return !r?.error
  }

  const corrida = await supabaseAdmin.schema('prediccion').from('corridas')
    .insert({ semana, disparo }).select('id').single()
  const corridaId = corrida.data?.id ?? null
  mirar('abrir corrida', corrida)

  /* ── LO QUE SE LEE, TODO DE SUS PROPIAS LIBRERIAS ─────────────────────── */
  const { data: cuentas, error: errCuentas } = await supabaseAdmin
    .from('cuentas')
    /* `facturacion` NO estaba en este select y costaba caro: `importeDeCuenta`
       usa el GRC por CID y, si ahi no hay nada, cae a esta columna. Sin pedirla
       la veia `undefined`, el respaldo no disparaba nunca y DIECIOCHO cuentas que
       SI tienen importe salian como `sin_dato`. En la primera corrida real eso
       dio 28 `sin_importe` donde la Fase 1 habia medido 10, y habria abierto
       dieciocho tareas pidiendo un dato que ya estaba. */
    .select('id, cid, empresa, asesor, estado, giro, facturacion, contacto_email, '
          + 'contactos_json, nps_score, observaciones_kam, health_score, '
          + 'score_actividad, score_adopcion, score_pago, score_relacional')
    .in('estado', ['activo', 'en_riesgo'])

  if (errCuentas || !cuentas) {
    const falla = `No se pudieron leer las cuentas: ${errCuentas?.message ?? 'sin filas'}`
    if (corridaId) {
      await supabaseAdmin.schema('prediccion').from('corridas')
        .update({ terminada_en: new Date().toISOString(), falla }).eq('id', corridaId)
    }
    return { semana, cuentasVistas: 0, filasEscritas: 0, tareasAbiertas: 0,
             tareasCerradas: 0, falla, porAsesor: {} }
  }

  const [mapa, efectivo, cortes, alertas] = await Promise.all([
    mapaFacturacion(),
    ultimoContactoEfectivoPorCuenta(),
    todosLosCortes(),
    detectarAlertas(),
  ])
  if (mapa.falla) fallos.push(`facturacion: ${mapa.falla}`)

  /* ── LA FUENTE DE CORTES NO CARGÓ CONTRA 192 CUENTAS SIN CORTE ──────────
   *
   * No son lo mismo y confundirlas aquí sale carísimo. `todosLosCortes()` abre
   * el .xlsx con una ruta armada en tiempo de ejecución, y si no lo encuentra
   * devuelve un mapa vacío SIN DECIRLO — exactamente el patrón que costó medio
   * día con el GRC. En una lambda nueva eso es verosímil.
   *
   * Si pasara, el snapshot marcaría `sin_consumo` en las 192 cuentas y la regla
   * de dirección del 7 de octubre —un hueco es una tarea— convertiría el fallo
   * de una fuente en una avalancha de tareas por un hueco inexistente. Peor que
   * no medir: medir mal y repartir trabajo.
   *
   * El umbral no es «cero». Hay 146 cuentas vivas con corte, así que un mapa con
   * un puñado de CIDs tampoco es creíble; se exige al menos la mitad. Y cuando
   * no se cree, NO se emite el hueco: se declara la falla y el consumo queda en
   * no medible, que es la verdad. */
  const CORTES_MINIMOS = 70
  const cortesConfiables = cortes.size >= CORTES_MINIMOS
  if (!cortesConfiables) {
    fallos.push(`cortes: la fuente devolvió ${cortes.size} CID(s), menos de los `
              + `${CORTES_MINIMOS} mínimos. No se emiten huecos de consumo: `
              + `probablemente el .xlsx no viajó con esta lambda.`)
  }

  /* ── LA POBLACION: las 25 principales de CADA asesor ──────────────────── */
  const importes = new Map(cuentas.map(c => [String(c.id), importeDeCuenta(c, mapa)]))
  const mrrDe = (id: string) => importes.get(id)?.mrr ?? 0
  const porAsesorLista = new Map<string, typeof cuentas>()
  for (const c of cuentas) {
    const a = String(c.asesor ?? '(sin asesor)')
    if (!porAsesorLista.has(a)) porAsesorLista.set(a, [])
    porAsesorLista.get(a)!.push(c)
  }
  const poblacion = new Set<string>()
  for (const lista of porAsesorLista.values()) {
    for (const c of [...lista].sort((x, y) => mrrDe(String(y.id)) - mrrDe(String(x.id)))
                              .slice(0, TOP_POR_ASESOR)) {
      poblacion.add(String(c.id))
    }
  }

  /* ── ALERTAS por cuenta ───────────────────────────────────────────────── */
  const porCuentaAlertas = new Map<string, { n: number; familias: Set<string>; maxDias: number | null }>()
  for (const a of alertas) {
    const k = String(a.cuentaId)
    const e = porCuentaAlertas.get(k) ?? { n: 0, familias: new Set<string>(), maxDias: null }
    e.n += 1
    e.familias.add(String(a.familia))
    const d = a.diasAbierta ?? null
    if (d !== null && (e.maxDias === null || d > e.maxDias)) e.maxDias = d
    porCuentaAlertas.set(k, e)
  }

  /* ── LA FILA DE CADA CUENTA, Y SUS HUECOS ─────────────────────────────── */
  const filas: FilaSnapshot[] = []
  const huecosPorCuenta: Array<{ clave: ClaveHueco; cuentaId: string; empresa: string
                                 asesor: string | null; mrr: number | null }> = []
  const ciegaCartera: Partial<Record<ClaveHueco, number>> = {}
  const sumarCiego = (k: ClaveHueco, mrr: number | null) => {
    if (mrr === null) return
    ciegaCartera[k] = (ciegaCartera[k] ?? 0) + mrr
  }

  for (const c of cuentas) {
    const id = String(c.id)
    const cid = c.cid === null || c.cid === undefined ? null : String(c.cid).trim()
    const imp = importes.get(id)!
    const huecos: ClaveHueco[] = []

    /* MRR */
    const mrrMedible = imp.origen !== 'sin_dato'
    if (!mrrMedible) huecos.push('sin_importe')

    /* CONSUMO: el ultimo corte del CID.
       `pct` YA viene recalculado contra la base real de minutos — el % del
       archivo no se usa nunca, publica cosas como 3,417,300%. No se vuelve a
       derivar aqui: `cortes-cuenta.ts` ya lo hizo con `plan-minutos.ts`.
       De paso se guardan `panel`, `desarrolladores` y `pagoExitoso`, que son las
       senales de adopcion y de pago que pide el §6.4 y que ya venian en el
       corte: no costaban nada y estaban sin usar. */
    const misCortes = cid ? (cortes.get(cid) ?? []) : []
    const ultimo = misCortes.length ? misCortes[misCortes.length - 1] : null
    let consumoPct: number | null = null
    let consumoBase: string | null = null
    let minIncl: number | null = null
    let minCons: number | null = null
    let panel: number | null = null
    let desarrolladores: number | null = null
    let pagoExitoso: boolean | null = null
    let mesDelCorte: string | null = null
    if (ultimo) {
      mesDelCorte = ultimo.mes ?? null
      minIncl = ultimo.base ?? null          // la base REAL, no la columna del archivo
      minCons = ultimo.cons ?? null
      consumoBase = ultimo.origenBase
      /* `sin_medicion` significa que no se pudo establecer contra que medir, y
         entonces `pct` no es una cifra: es un artefacto. Se deja en null. */
      consumoPct = ultimo.origenBase === 'sin_medicion' ? null : (ultimo.pct ?? null)
      panel = ultimo.panel ?? null
      desarrolladores = ultimo.desarrolladores ?? null
      /* `true` cuando el corte dice 1, y `null` en cualquier otro caso — NO
         `false`. En el archivo de origen esta columna viene vacia en 14,851 de
         21,567 filas y solo NUEVE dicen 1; `cortes-cuenta.ts` pasa los nulos por
         `num()`, que los vuelve 0, asi que para cuando llegan aqui un cero
         significa «no pago» O «nadie lo registro» y ya no se pueden separar.
         Guardarlo como `false` afirmaria lo primero sobre 14,851 filas que son
         lo segundo. Ver [[feedback-cero-sin-medicion]].
         Con esa cobertura la columna NO sirve hoy como feature, y eso es un
         hallazgo del origen, no algo que se arregle aqui. */
      pagoExitoso = ultimo.pagoExitoso === 1 ? true : null
    } else {
      consumoBase = 'sin_medicion'
      /* Sólo es un HUECO si la fuente cargó. Si no cargó, la cuenta no está
         «sin consumo»: no se midió, y la falla ya quedó declarada arriba. */
      if (cortesConfiables) {
        huecos.push('sin_consumo')
        sumarCiego('sin_consumo', mrrMedible ? imp.mrr : null)
      }
    }
    const consumoMedible = consumoPct !== null

    /* LLAMADAS: no va al snapshot como cifra —ya vive en su propio modulo—
       pero su ausencia SI es un hueco con dueno. */
    const llam = await resumenLlamadas(cid)
    if (!llam) {
      huecos.push('sin_llamadas')
      sumarCiego('sin_llamadas', mrrMedible ? imp.mrr : null)
    }

    /* CONTACTO: `null` cuando nunca hubo, jamas 0. */
    const dias = diasSinContacto(efectivo.get(id) ?? null)

    /* LOS HUECOS DE FICHA, que son los que el asesor consigue preguntando. */
    if (!c.nps_score) huecos.push('sin_nps')
    if (!c.contacto_email) huecos.push('sin_correo')
    const extras = Array.isArray(c.contactos_json) ? c.contactos_json.length : 0
    if (extras < 1) huecos.push('sin_segundo_contacto')
    const kam = String(c.observaciones_kam ?? '').trim()
    if (kam === '' || kam === '0') huecos.push('sin_obs_kam')
    if (!c.giro) huecos.push('sin_giro')
    /* El rol decisor/operativo no existe poblado en NINGUNA cuenta: la tabla
       `enriquecimiento_decisores` tiene las columnas y cero filas. Se marca solo
       donde hay con quien distinguirlo — sin dos contactos no hay dos roles, y
       pedirlo seria una tarea imposible de cerrar. */
    if (extras >= 1) huecos.push('sin_rol_contacto')

    const al = porCuentaAlertas.get(id)
    filas.push({
      semana, cuenta_id: id, cid, empresa: String(c.empresa ?? ''),
      asesor: c.asesor ?? null, estado: String(c.estado),
      es_top_asesor: poblacion.has(id),
      mrr: mrrMedible ? imp.mrr : null,
      mrr_origen: imp.origen,
      mrr_medible: mrrMedible,
      consumo_pct: consumoPct,
      minutos_incluidos: minIncl,
      minutos_consumidos: minCons,
      consumo_base: consumoBase,
      consumo_medible: consumoMedible,
      mes_del_corte: mesDelCorte,
      panel_visitas: panel,
      panel_desarrolladores: desarrolladores,
      pago_exitoso: pagoExitoso,
      dias_sin_contacto: dias,
      contacto_medible: dias !== null,
      health_score: c.health_score ?? null,
      hs_pct_real: pctRealDelHealthScore(c),
      alertas_abiertas: al?.n ?? 0,
      alertas_familias: al ? [...al.familias] : [],
      condicion_mas_vieja_dias: al?.maxDias ?? null,
      huecos,
    })

    /* Las tareas SOLO para la poblacion primaria. El resto de los huecos queda
       registrado en `huecos` y se puede ver, pero no abre tarea todavia: abrir
       las de las 192 el primer lunes sepultaria a los tres asesores. Es una
       decision de alcance, no de la regla — para cambiarla basta quitar el
       `if`. */
    if (poblacion.has(id)) {
      for (const clave of huecos) {
        huecosPorCuenta.push({ clave, cuentaId: id, empresa: String(c.empresa ?? ''),
                               asesor: c.asesor ?? null, mrr: mrrMedible ? imp.mrr : null })
      }
    }
  }

  /* ── ESCRIBIR EL SNAPSHOT. Upsert sobre (semana, cuenta_id): correr dos
        veces el mismo lunes reescribe, no duplica. ────────────────────────── */
  let filasEscritas = 0
  for (let i = 0; i < filas.length; i += 100) {
    const lote = filas.slice(i, i + 100)
    const r = await supabaseAdmin.schema('prediccion').from('snapshot_semanal')
      .upsert(lote, { onConflict: 'semana,cuenta_id' })
    if (mirar(`snapshot lote ${i / 100 + 1}`, r)) filasEscritas += lote.length
  }

  /* ── LAS TAREAS ───────────────────────────────────────────────────────── */

  /* Los huecos de CARTERA ciegan a todo el mundo, asi que su `mrrCiego` es el MRR
     medible completo. En la primera corrida real salieron las cuatro con el
     dinero en blanco, y ese campo es justo lo que les da prioridad cuando llegan
     a la mesa de Daniel: «no existe el tiempo de timbrado» es una frase, «no
     existe para $2,220,416 de cartera» es una decision.
     `sin_consumo` y `sin_llamadas` NO se tocan aqui: ya traen su suma real,
     acumulada cuenta por cuenta arriba. */
  const mrrMedibleTotal = filas.reduce((s, f) => s + (f.mrr ?? 0), 0)
  for (const clave of ['sin_timbrado', 'tickets_abiertos',
                       'sin_uso_por_usuario', 'sin_grabacion'] as ClaveHueco[]) {
    ciegaCartera[clave] = mrrMedibleTotal
  }

  const todas = tareasDeHuecos(huecosPorCuenta, ciegaCartera)

  /* Se recorta POR ASESOR, no en total: si se recortara en total, el asesor con
     las cuentas mas grandes se llevaria las diez y los otros dos ninguna. */
  const cupo = new Map<string, number>()
  const aAbrir = todas.filter(t => {
    if (t.alcance === 'cartera') return true          // una sola, siempre entra
    const a = String(t.asesor ?? '(sin asesor)')
    const n = cupo.get(a) ?? 0
    if (n >= TAREAS_POR_ASESOR) return false
    cupo.set(a, n + 1)
    return true
  })

  /* ── SE LEE LO ABIERTO Y SE INSERTA LO QUE FALTA, SIN `UPSERT` ───────────
   *
   * La primera version usaba `upsert` con `onConflict: 'clave,cuenta_id'` y
   * produccion lo rechazo en su primera corrida:
   *
   *     «there is no unique or exclusion constraint matching the ON CONFLICT
   *      specification»
   *
   * El indice es PARCIAL —`WHERE estado = 'abierta' AND cuenta_id IS NOT NULL`—
   * y Postgres solo usa un indice parcial para un `ON CONFLICT` si la sentencia
   * repite su predicado. PostgREST no deja expresar ese `WHERE`, asi que la
   * combinacion no existe.
   *
   * El indice parcial NO es el error y no se toca: es lo que permite tener una
   * tarea abierta por clave y cuenta Y conservar el historico de las cerradas.
   * Un indice total sobre (clave, cuenta_id) prohibiria para siempre una segunda
   * tarea de lo mismo en la misma cuenta, y entonces un hueco que reaparece —el
   * cliente cambia de contacto y vuelve a faltar el correo— no podria volver a
   * pedirse.
   *
   * Lo que sobraba era el upsert. Se lee lo que ya esta abierto y se inserta solo
   * lo que falta, que ademas es mas claro: una tarea que lleva tres semanas sin
   * hacerse conserva su `creada_en`, y eso es justo lo que dice cuanto lleva
   * pendiente. */
  const yaAbiertas = await supabaseAdmin.schema('prediccion').from('tareas_hueco')
    .select('id, clave, cuenta_id').eq('estado', 'abierta')
  mirar('leer tareas abiertas', yaAbiertas)
  const abiertaYa = new Set(
    (yaAbiertas.data ?? []).map(t => `${t.clave}|${t.cuenta_id ?? ''}`))

  const nuevas = aAbrir.filter(t => !abiertaYa.has(`${t.clave}|${t.cuentaId ?? ''}`))

  let tareasAbiertas = 0
  for (let i = 0; i < nuevas.length; i += 100) {
    const lote = nuevas.slice(i, i + 100).map(t => ({
      semana, clave: t.clave, dueno: t.dueno, alcance: t.alcance,
      cuenta_id: t.cuentaId, empresa: t.empresa, asesor: t.asesor,
      mrr_ciego: t.mrrCiego, pedir: t.pedir, porque: t.porque,
      donde: t.donde, bloquea: t.bloquea,
    }))
    const r = await supabaseAdmin.schema('prediccion').from('tareas_hueco').insert(lote)
    if (mirar(`tareas lote ${i / 100 + 1}`, r)) tareasAbiertas += lote.length
  }

  /* ── CERRAR LAS QUE YA SE RESOLVIERON ────────────────────────────────────
     Si el hueco ya no se detecta, la tarea se cierra sola y se firma como
     `snapshot`: el dato llego, no hace falta que nadie lo marque a mano. */
  const vigentes = new Set(
    huecosPorCuenta.map(h => `${h.clave}|${h.cuentaId}`))
  /* Se reusa la lectura de arriba en vez de volver a preguntar: es la misma
     pregunta y la respuesta no ha cambiado dentro de esta corrida. Las de
     CARTERA se dejan fuera del cierre automatico —`cuenta_id` nulo—: que el
     timbrado no exista no es algo que el snapshot pueda dar por resuelto, lo
     cierra una persona cuando la plataforma conteste. */
  const cerrar = (yaAbiertas.data ?? [])
    .filter(t => t.cuenta_id && !vigentes.has(`${t.clave}|${t.cuenta_id}`))
    .map(t => t.id)
  let tareasCerradas = 0
  if (cerrar.length) {
    const r = await supabaseAdmin.schema('prediccion').from('tareas_hueco')
      .update({ estado: 'resuelta', cerrada_en: new Date().toISOString(),
                cerrada_por: 'snapshot',
                cierre_nota: 'El dato apareció; el hueco ya no se detecta.' })
      .in('id', cerrar)
    if (mirar('cerrar tareas', r)) tareasCerradas = cerrar.length
  }

  /* ── CERRAR LA CORRIDA, CON LA FALLA SI LA HUBO ──────────────────────── */
  const falla = fallos.length
    ? `${fallos.length} operación(es) con error — ${fallos.join(' · ')}`
    : null
  if (corridaId) {
    await supabaseAdmin.schema('prediccion').from('corridas').update({
      terminada_en: new Date().toISOString(),
      cuentas_vistas: cuentas.length, filas_escritas: filasEscritas,
      tareas_abiertas: tareasAbiertas, tareas_cerradas: tareasCerradas, falla,
    }).eq('id', corridaId)
  }

  const porAsesor: Record<string, { cuentas: number; tareas: number }> = {}
  for (const f of filas) {
    const a = String(f.asesor ?? '(sin asesor)')
    porAsesor[a] = porAsesor[a] ?? { cuentas: 0, tareas: 0 }
    porAsesor[a].cuentas += 1
  }
  /* Se cuentan las que de verdad se escribieron, no las que se pensaba escribir.
     En la primera corrida esto decia «10 por asesor» mientras `tareasAbiertas`
     valia 0 porque el insert habia fallado: dos cifras de lo mismo en la misma
     respuesta, y la equivocada era la tranquilizadora. */
  if (tareasAbiertas > 0) {
    for (const t of nuevas) {
      if (t.alcance !== 'cuenta') continue
      const a = String(t.asesor ?? '(sin asesor)')
      porAsesor[a] = porAsesor[a] ?? { cuentas: 0, tareas: 0 }
      porAsesor[a].tareas += 1
    }
  }

  return { semana, cuentasVistas: cuentas.length, filasEscritas,
           tareasAbiertas, tareasCerradas, falla, porAsesor }
}
