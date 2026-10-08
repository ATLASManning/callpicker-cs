import { supabaseAdmin, traerPorPaginas, esTablaInexistente } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'
import { CONDICION, type Alerta, type Condicion, type Severidad } from '@/lib/alertas'

/**
 * lib/alertas-episodios.ts — LA MEMORIA DE LAS ALERTAS
 *
 * El detector dice QUÉ está encendido hoy. Esto dice DESDE CUÁNDO, que es lo
 * que separa anticipar de contar. Sin ello el tablero no puede distinguir una
 * alerta de ayer de una que lleva dos meses, y ésa era la primera petición de
 * los fundadores.
 *
 * ── LA APLICACIÓN TIENE QUE FUNCIONAR SIN LA TABLA ───────────────────────
 *
 * Si `alertas_episodios` no existe —PostgREST devuelve PGRST205, no 42P01—, o
 * si la sincronización falla, se devuelve un mapa vacío y las alertas se ven
 * exactamente como antes. Lo que NO se hace es inventar un «0 días»: la
 * pantalla dice que la antigüedad no se está midiendo. Un cero ahí significaría
 * «esto acaba de empezar» sobre una cuenta que lleva meses.
 *
 * ── POR QUÉ UNA CORRIDA PARCIAL NO PUEDE CERRAR NADA ─────────────────────
 *
 * `/api/alertas?asesor=` acota a una cartera, y un asesor que abre su panel ve
 * sólo sus cuentas. Si esa corrida pudiera cerrar, cerraría como «remitidas»
 * todas las alertas de los otros dos ejecutivos, que simplemente no estaban en
 * su consulta. Sólo `alcance: 'completo'` cierra.
 *
 * ── Y POR QUÉ HAY COMPUERTA DE QUÓRUM ADEMÁS DE LA VENTANA DE GRACIA ─────
 *
 * La gracia protege de un hueco de un día; el quórum, de una fuente que se cae
 * a medias. Si `todosLosCortes()` devuelve un mapa vacío —y lo devuelve en
 * silencio cuando falta el archivo—, el detector deja de ver TODAS las alertas
 * de consumo a la vez. Sin quórum, dos corridas así cerrarían medio tablero
 * como «remitido» y la historia de antigüedad se perdería sin que nadie lo
 * note. Con él, la corrida escribe lo que vio y NO cierra: se queda con los dos
 * números para que la diferencia salte.
 */

/** Días que una condición puede no verse antes de darla por apagada. */
export const DIAS_GRACIA = 2

/** Si lo detectado cae por debajo de esta fracción de lo abierto, no se cierra. */
export const QUORUM = 0.6

/** Hasta aquí una alerta es «nueva». Se deriva de la edad, no de si alguien la
 *  miró: la vista no se puede medir sin vigilar, y lo que no se puede medir no
 *  se publica como si se midiera. */
export const DIAS_NUEVA = 7

export interface Antiguedad {
  /** Días que lleva encendida la condición. `null` = no se está midiendo. */
  dias: number | null
  nueva: boolean
  /** Cuántas veces ha vuelto esta condición en esta cuenta. */
  recurrencia: number
  severidadPeor: Severidad
  /** Desde qué día, para poder enseñarlo sin recalcular. */
  desde: string | null
}

export interface ResultadoSync {
  antiguedad: Map<string, Antiguedad>
  abiertos: number
  detectados: number
  nuevos: number
  cerrados: number
  /** Por qué no se cerró nada, cuando no se cerró. */
  sinCerrar: string | null
  /** La tabla no existe o falló: la antigüedad NO se está midiendo. */
  falla: string | null
}

interface Episodio {
  id: string
  cuenta_id: string
  condicion: Condicion
  tipo: string
  estado: string
  abierto_en: string
  condicion_desde: string | null
  confirmada_el: string
  ausente_desde: string | null
  severidad_actual: string
  severidad_peor: string
  recurrencia: number
}

const vacio = (falla: string | null): ResultadoSync => ({
  antiguedad: new Map(), abiertos: 0, detectados: 0, nuevos: 0, cerrados: 0,
  sinCerrar: null, falla,
})

const llave = (cuentaId: string, c: Condicion) => `${cuentaId}:${c}`

function diasEntre(desde: string, hasta: string): number {
  const a = Date.UTC(+desde.slice(0, 4), +desde.slice(5, 7) - 1, +desde.slice(8, 10))
  const b = Date.UTC(+hasta.slice(0, 4), +hasta.slice(5, 7) - 1, +hasta.slice(8, 10))
  return Math.max(0, Math.round((b - a) / 86400000))
}

/** Resta días a una fecha «YYYY-MM-DD» sin pasar por la zona del servidor. */
function restarDias(fecha: string, dias: number): string {
  const t = Date.UTC(+fecha.slice(0, 4), +fecha.slice(5, 7) - 1, +fecha.slice(8, 10))
    - dias * 86400000
  const d = new Date(t)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
       + `-${String(d.getUTCDate()).padStart(2, '0')}`
}

/**
 * Sincroniza los episodios contra lo que el detector ve HOY y devuelve la
 * antigüedad de cada alerta, indexada por su `id` estable.
 */
export async function sincronizarEpisodios(
  alertas: Alerta[],
  opciones: { alcance: 'completo' | 'parcial' },
): Promise<ResultadoSync> {
  const hoy = hoyEnMexico()

  /* Una sola alerta por (cuenta, condición): dentro de un grupo los tipos son
     mutuamente excluyentes, así que si llegaran dos sería un error del
     detector y no algo que esta capa deba inventarse cómo resolver. Se queda
     la de mayor prioridad, que es la que el panel enseñaría. */
  const porLlave = new Map<string, Alerta>()
  for (const a of alertas) {
    const k = llave(a.cuentaId, CONDICION[a.tipo])
    const prev = porLlave.get(k)
    if (!prev || a.prioridad > prev.prioridad) porLlave.set(k, a)
  }

  let abiertos: Episodio[]
  try {
    abiertos = await traerPorPaginas<Episodio>((d, h) =>
      supabaseAdmin.from('alertas_episodios')
        .select('id, cuenta_id, condicion, tipo, estado, abierto_en, condicion_desde, '
              + 'confirmada_el, ausente_desde, severidad_actual, severidad_peor, recurrencia')
        .eq('estado', 'abierta').range(d, h))
  } catch (e) {
    if (esTablaInexistente(e)) {
      return vacio('La tabla alertas_episodios no existe todavía: '
                 + 'correr scripts/migracion-alertas-episodios.sql')
    }
    return vacio((e as Error)?.message ?? 'no se pudieron leer los episodios')
  }

  const porId = new Map<string, Episodio>()
  for (const e of abiertos) porId.set(llave(e.cuenta_id, e.condicion), e)

  // ── Lo que sigue encendido: se confirma, y se anota si escaló ────────────
  const confirmar: Array<Record<string, unknown>> = []
  const insertar: Array<Record<string, unknown>> = []

  for (const [k, a] of porLlave) {
    const ep = porId.get(k)
    if (ep) {
      /* Si ya se confirmó HOY y nada cambió, no se escribe. Sin este corte,
         cada render de la portada disparaba 607 UPDATE sueltos contra la base
         —y la portada, /alertas y la API son tres entradas distintas—. El
         trabajo real es el del primer render del día; el resto es ruido. */
      const igual = ep.confirmada_el === hoy
                 && ep.tipo === a.tipo
                 && ep.severidad_actual === a.severidad
                 && !ep.ausente_desde
      if (igual) continue
      confirmar.push({
        id: ep.id,
        tipo: a.tipo,
        severidad_actual: a.severidad,
        mrr_actual: a.mrr,
        es_top_actual: a.esTop,
        evidencia_actual: a.evidencia,
        confirmada_el: hoy,
        ausente_desde: null,
        ...(ep.tipo !== a.tipo ? { escalo_en: hoy } : {}),
      })
      continue
    }
    /* Nace. `condicion_desde` se SIEMBRA HACIA ATRÁS con lo que el detector ya
       sabe: para un silencio de 74 días, el episodio nace diciendo 74. Sin
       esto, el día de la migración todas las alertas empezarían en cero y el
       tablero acusaría a tres personas de no haber hecho nada. */
    insertar.push({
      condicion: CONDICION[a.tipo],
      tipo: a.tipo, tipo_apertura: a.tipo,
      familia: a.familia, dueno: a.dueno,
      cuenta_id: a.cuentaId, consecutivo: a.consecutivo,
      empresa: a.empresa, asesor_apertura: a.asesor,
      abierto_en: hoy,
      condicion_desde: a.dias !== null ? restarDias(hoy, a.dias) : null,
      confirmada_el: hoy,
      severidad_apertura: a.severidad, severidad_actual: a.severidad,
      severidad_peor: a.severidad,
      mrr_apertura: a.mrr, mrr_actual: a.mrr,
      es_top_apertura: a.esTop, es_top_actual: a.esTop,
      evidencia_apertura: a.evidencia, evidencia_actual: a.evidencia,
    })
  }

  // ── Lo que ya no se ve ───────────────────────────────────────────────────
  let cerrados = 0
  let sinCerrar: string | null = null
  const apagados = abiertos.filter(e => !porLlave.has(llave(e.cuenta_id, e.condicion)))

  if (opciones.alcance !== 'completo') {
    if (apagados.length) sinCerrar = 'corrida parcial: sólo una corrida completa cierra'
  } else if (abiertos.length > 0 && porLlave.size < abiertos.length * QUORUM) {
    sinCerrar = `quórum: se detectaron ${porLlave.size} condiciones contra `
              + `${abiertos.length} abiertas. Una caída así suele ser una fuente que `
              + `no cargó, no medio tablero resolviéndose de golpe.`
  }

  /* ── TODA ESCRITURA SE MIRA ─────────────────────────────────────────────
   *
   * `supabase-js` NO LANZA: devuelve `{ data, error }`. Las cuatro escrituras
   * de aquí se hacían con un `await` suelto dentro de un try/catch, así que el
   * catch nunca se enteraba de nada y un rechazo de la base era invisible.
   *
   * Se vio en producción el 7 oct 2026: durante un día entero el diagnóstico
   * publicó «nuevos: 4, abiertos: 607, falla: null» en CADA corrida, con los
   * mismos cuatro episodios intentándose y fallando una y otra vez porque el
   * CHECK de la tabla todavía no admitía la condición `escrito`. Cuatro
   * alertas nuevas que se veían en pantalla y no envejecían nunca, sin una
   * sola señal de que algo iba mal.
   *
   * Es exactamente el mismo error que el del respaldo del GRC el día anterior:
   * confundir un fallo con un hallazgo. La diferencia es que allí el `catch` sí
   * atrapaba y yo me lo tragaba a propósito; aquí ni atrapaba. */
  const fallos: string[] = []
  const mirar = (etq: string, r: { error: { message?: string } | null }) => {
    if (r?.error) fallos.push(`${etq}: ${r.error.message ?? 'error sin mensaje'}`)
    return !r?.error
  }

  for (const c of confirmar) {
    const { id, ...resto } = c as { id: string } & Record<string, unknown>
    mirar('confirmar', await supabaseAdmin.from('alertas_episodios')
      .update(resto).eq('id', id))
  }

  if (insertar.length) {
    /* Payload homogéneo: supabase-js arma un solo INSERT con las columnas de
       la PRIMERA fila, así que una clave ausente en otra entra como NULL en
       silencio. `condicion_desde` es justo la que a veces falta. */
    const claves = Array.from(new Set(insertar.flatMap(o => Object.keys(o))))
    const homogeneo = insertar.map(o =>
      Object.fromEntries(claves.map(k => [k, o[k] ?? null])))
    mirar('abrir', await supabaseAdmin.from('alertas_episodios').insert(homogeneo))
  }

  if (!sinCerrar) {
    for (const e of apagados) {
      if (!e.ausente_desde) {
        mirar('gracia', await supabaseAdmin.from('alertas_episodios')
          .update({ ausente_desde: hoy }).eq('id', e.id))
        continue
      }
      if (diasEntre(e.ausente_desde, hoy) < DIAS_GRACIA) continue
      /* `cerrado_en` es el último día en que SE VIO, no hoy: la gracia y los
         huecos del cron son nuestros, no del cliente. Y el motivo: las
         condiciones de captura se apagan porque alguien capturó —eso es
         `resuelta`—; las de consumo y medición se apagan solas, y llamarlas
         resueltas sería atribuirle al equipo un mérito que no tuvo. */
      /* `trabajo` SALE de aquí el 8 oct 2026, y no es un detalle de estilo.
         Sus dos tipos de alerta —`asignada_sin_cerrar`, `nunca_asignada`— se
         retiraron con el generador SAC, así que sus 69 episodios abiertos van
         a dejar de verse en la próxima corrida completa y a cerrarse. Con
         `trabajo` en esta lista se cerraban como `resuelta`, que en esta tabla
         significa «alguien la atendió»: habrían sido las PRIMERAS 69 resueltas
         de la historia del registro, y las 69 falsas. Nadie las atendió; les
         quitamos el tipo. Cierran como `remitio`, que está documentado como
         «NO es éxito del ejecutivo: se apagó sola». */
      const deCaptura = e.condicion === 'radar' || e.condicion === 'contactos'
                     || e.condicion === 'ficha'
      const ok = mirar('cerrar', await supabaseAdmin.from('alertas_episodios').update({
        estado: 'cerrada',
        cerrado_en: e.confirmada_el,
        cierre_motivo: deCaptura ? 'resuelta' : 'remitio',
      }).eq('id', e.id))
      if (ok) cerrados++
    }
  }

  /* La antigüedad se CALCULA AL LEER, nunca se guarda: así es inmune a que el
     cron se salte un día y no hay una columna que pueda quedarse vieja. */
  const antiguedad = new Map<string, Antiguedad>()
  for (const [k, a] of porLlave) {
    const ep = porId.get(k)
    const desde = ep ? (ep.condicion_desde ?? ep.abierto_en)
                     : (a.dias !== null ? restarDias(hoy, a.dias) : hoy)
    const dias = diasEntre(desde, hoy)
    antiguedad.set(a.id, {
      dias, desde,
      nueva: dias <= DIAS_NUEVA,
      recurrencia: ep?.recurrencia ?? 0,
      severidadPeor: (ep?.severidad_peor ?? a.severidad) as Severidad,
    })
  }

  return {
    antiguedad, abiertos: abiertos.length, detectados: porLlave.size,
    /* `nuevos` es lo que SE ABRIÓ, no lo que se intentó. Publicar el intento
       fue justo lo que escondió el rechazo de la base durante un día. */
    nuevos: fallos.some(f => f.startsWith('abrir')) ? 0 : insertar.length,
    cerrados, sinCerrar,
    falla: fallos.length
      ? `${fallos.length} escritura(s) rechazada(s) — ${fallos.slice(0, 3).join(' · ')}`
      : null,
  }
}

/**
 * Las alertas YA con su antigüedad. **Es la puerta que deben usar todos.**
 *
 * La primera versión conectó la sincronización sólo a `/api/alertas`, y la
 * portada y `/alertas` siguieron llamando a `detectarAlertas()` por su cuenta
 * —son componentes de servidor y no pasan por la API—. Resultado: la memoria se
 * escribía bien y la antigüedad no se veía en ninguna pantalla. Tres entradas,
 * dos comportamientos.
 *
 * `alcance` se deriva aquí y no se pide: una consulta acotada a una cartera es
 * PARCIAL por definición, y una parcial no cierra nada.
 */
export async function alertasConMemoria(
  detectar: () => Promise<Alerta[]>,
  opciones?: { asesor?: string },
): Promise<{ alertas: Alerta[]; memoria: ResultadoSync }> {
  const alertas = await detectar()
  const memoria = await sincronizarEpisodios(alertas, {
    alcance: opciones?.asesor ? 'parcial' : 'completo',
  })
  for (const a of alertas) {
    const ant = memoria.antiguedad.get(a.id)
    if (!ant) continue
    a.diasAbierta = ant.dias
    a.nueva = ant.nueva
    a.recurrencia = ant.recurrencia
  }
  return { alertas, memoria }
}
