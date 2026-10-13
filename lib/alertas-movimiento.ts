import { supabaseAdmin, traerPorPaginas, esTablaInexistente } from '@/lib/supabase'
import { hoyEnMexico } from '@/lib/fecha-local'
import { PESO_SEVERIDAD, type Condicion } from '@/lib/alertas'
import { CANALES_CONTACTO } from '@/lib/contacto-cuenta'
import { esConElCliente } from '@/lib/reuniones-tipo'

/**
 * lib/alertas-movimiento.ts — QUÉ LE HIZO A ESTA ALERTA LO QUE ACABAS DE CAPTURAR
 *
 * ── EL ENCARGO ────────────────────────────────────────────────────────────
 *
 * Dirección, 12 oct 2026: «si alguno de nosotros ingresa información en
 * Reuniones, Observaciones, seguimientos etc, en alguna cuenta debes tener la
 * capacidad para poder establecer la actualización si continúa o genera riesgo
 * o disminuye según corresponda».
 *
 * El tablero ya recalcula: la ficha es `force-dynamic` y las cifras del guion
 * —{reuniones}, {tickets}, {diasSinContacto}— son vivas. Lo que NO existía es
 * la frase que dice qué cambió y por qué. Una pantalla que sólo publica el
 * estado de hoy obliga a recordar el de ayer, y nadie lo recuerda: por eso se
 * captura una reunión, la alerta sigue ahí, y el ejecutivo concluye que
 * capturar no sirve de nada.
 *
 * ── «SEGÚN CORRESPONDA» ES LA PARTE DIFÍCIL, Y ES UNA TABLA ───────────────
 *
 * La tentación es dejar que cualquier captura calme cualquier alerta. Eso
 * reconstruiría justo lo que dirección retiró el 8 oct con el generador SAC:
 * un sistema donde registrar trabajo apaga avisos sin que la situación del
 * cliente haya cambiado.
 *
 * Así que cada condición declara QUÉ la apaga, y una captura sólo puede
 * moverla si es de ese tipo. Una reunión apaga un silencio; no apaga una caída
 * de consumo, porque el consumo lo mueve el cliente usando el servicio. Y
 * decirlo en voz alta es la mitad del valor: «esta reunión apaga el silencio
 * de 74 días; NO toca la caída de consumo del 62%, que sigue abierta».
 *
 * ── DE DÓNDE SALE EL MOVIMIENTO ───────────────────────────────────────────
 *
 * De `alertas_episodios`, que ya lleva la memoria: desde cuándo está abierta,
 * cuál ha sido su peor severidad, cuántas veces ha vuelto. Nada de esto se
 * recalcula aquí ni se guarda nuevo: se LEE lo que la sincronización ya
 * escribe, que es la única fuente que sobrevive a que el cron se salte un día.
 *
 * Si la tabla no está, se devuelve `null` y la ficha no enseña el bloque. NO
 * se inventa un «sin cambios»: no haber medido y no haber cambiado son cosas
 * distintas, y colapsarlas es lo que esta casa tiene prohibido.
 */

/** Lo que una persona captura sobre una cuenta. */
export type TipoCaptura = 'reunion' | 'seguimiento' | 'observacion' | 'actividad'

/** Qué apaga cada condición, dicho para leerlo en pantalla. */
const LO_QUE_LA_APAGA: Record<Condicion, string> = {
  contacto:  'hablar con el cliente',
  escrito:   'lo que el equipo escriba sobre esta cuenta',
  radar:     'contestar el Radar de la ficha',
  contactos: 'capturar contactos en la ficha',
  ficha:     'completar la ficha',
  consumo:   'que el cliente vuelva a usar el servicio',
  medicion:  'que llegue el reporte de llamadas',
  importe:   'que la cuenta aparezca en el corte de facturación',
  mesa:      'que la mesa de ayuda cierre el folio',
  trabajo:   'nada: este tipo de alerta se retiró',
}

/**
 * Qué captura puede mover cada condición. Lo que no está aquí, NO la mueve —
 * y la pantalla lo dice en vez de callárselo.
 *
 * `escrito` admite las cuatro porque las cuatro llevan prosa, y la prosa es su
 * única fuente: una reunión cuyo resumen dice «confirmó la cancelación» tiene
 * que poder encender `baja_declarada` igual que un seguimiento.
 *
 * `consumo`, `medicion`, `importe` y `mesa` no admiten NINGUNA: las mueve el
 * cliente o la factura, no nosotros. Que estén vacías es el punto.
 */
const LA_MUEVEN: Record<Condicion, ReadonlySet<TipoCaptura>> = {
  contacto:  new Set<TipoCaptura>(['reunion', 'seguimiento', 'actividad']),
  escrito:   new Set<TipoCaptura>(['reunion', 'seguimiento', 'observacion', 'actividad']),
  radar:     new Set<TipoCaptura>([]),
  contactos: new Set<TipoCaptura>([]),
  ficha:     new Set<TipoCaptura>(['observacion']),
  consumo:   new Set<TipoCaptura>([]),
  medicion:  new Set<TipoCaptura>([]),
  importe:   new Set<TipoCaptura>([]),
  mesa:      new Set<TipoCaptura>([]),
  trabajo:   new Set<TipoCaptura>([]),
}

export type Sentido = 'nace' | 'continua' | 'agrava' | 'disminuye'

export interface Captura {
  tipo: TipoCaptura
  fecha: string
  que: string
}

export interface Movimiento {
  /** La condición a la que se refiere. Es la clave del episodio. */
  condicion: Condicion
  /** De qué va, en una línea: la evidencia que el episodio guardó. */
  titulo: string
  sentido: Sentido
  /** La frase de pantalla. Lleva los números dentro: sin ellos no se defiende. */
  frase: string
  /** Lo capturado desde que esta alerta se movió por última vez, y que SÍ la toca. */
  cuentan: Captura[]
  /**
   * Lo capturado que NO la toca. Va acompañado de qué sí la apagaría, porque
   * un «esto no cuenta» sin el porqué se lee como que el sistema no registró
   * el trabajo.
   */
  noCuentan: Captura[]
  /** Qué tendría que pasar para que se apague. */
  laApaga: string
}

function diasEntre(desde: string, hasta: string): number {
  const a = Date.UTC(+desde.slice(0, 4), +desde.slice(5, 7) - 1, +desde.slice(8, 10))
  const b = Date.UTC(+hasta.slice(0, 4), +hasta.slice(5, 7) - 1, +hasta.slice(8, 10))
  return Math.max(0, Math.round((b - a) / 86400000))
}

interface FilaEpisodio {
  cuenta_id: string
  condicion: Condicion
  tipo: string
  evidencia_actual: string | null
  condicion_desde: string | null
  abierto_en: string
  severidad_actual: string
  severidad_peor: string
  escalo_en: string | null
  desescalo_en: string | null
  recurrencia: number | null
}

/**
 * Lo que el equipo capturó sobre esta cuenta, de las cuatro vías, ordenado de
 * lo más reciente a lo más viejo.
 *
 * Las observaciones de la ficha NO guardan fecha —`cuentas.observaciones_kam`
 * es una columna de texto— así que entran con la fecha de hoy y se rotulan
 * como «sin fecha» aguas arriba. Inventarles una las haría parecer recientes
 * siempre, que es peor que decir que no se sabe.
 */
async function capturasDe(
  cuentaId: string | null, desde: string,
): Promise<Map<string, Captura[]>> {
  /* `cuentaId: null` trae la CARTERA ENTERA en dos consultas.
   *
   * Es lo que hace que `/alertas` sea viable: esa pantalla pinta 193 cuentas
   * y pedir sus capturas una por una serían 386 consultas. El coste de traer
   * todo de golpe es el mismo que el de traer una, porque `seguimientos` y
   * `reuniones` son tablas de cientos de filas, no de millones — y si algún
   * día dejan de serlo, el corte por `desde` ya está puesto. */
  const porCuenta = new Map<string, Captura[]>()
  const mete = (id: string | null | undefined, c: Captura) => {
    if (!id) return
    const l = porCuenta.get(id)
    if (l) l.push(c)
    else porCuenta.set(id, [c])
  }

  /* El `select` va SIEMPRE como literal, nunca como variable: `supabase-js`
     parsea esa cadena a nivel de tipos y con una variable el genérico colapsa
     a `GenericStringError[]`. Un helper que lo recibiera por parámetro ahorra
     seis líneas y mete dos errores de tipo — y en este repo `next.config.js`
     lleva `ignoreBuildErrors`, así que un error de tipo no rompe el build:
     rompe el NAVEGADOR, que es peor. */
  const sinTabla = (e: unknown) => {
    if (esTablaInexistente(e)) return true
    throw e
  }

  let reuniones: Array<{ cuenta_id: string | null; fecha: string | null
                         tipo: string | null; titulo: string | null }> = []
  try {
    reuniones = await traerPorPaginas<{ cuenta_id: string | null; fecha: string | null
                                        tipo: string | null; titulo: string | null }>(
      (d, h) => {
        const q = supabaseAdmin.from('reuniones').select('cuenta_id, fecha, tipo, titulo')
        return (cuentaId ? q.eq('cuenta_id', cuentaId) : q).range(d, h)
      })
  } catch (e) { sinTabla(e) }
  for (const r of reuniones) {
    const f = String(r.fecha ?? '').slice(0, 10)
    if (!f || f < desde) continue
    mete(r.cuenta_id, {
      tipo: 'reunion',
      fecha: f,
      /* El TIPO va en el texto porque decide si cuenta: una de estrategia es
         SOBRE la cuenta y una de cliente es CON la cuenta, y en la pantalla
         tiene que verse por qué una suma y la otra no. */
      que: `${esConElCliente(r.tipo) ? 'Reunión con el cliente' : 'Reunión interna'}`
         + (r.titulo ? `: ${r.titulo}` : ''),
    })
  }

  let segs: Array<{ cuenta_id: string | null; fecha: string | null
                    tipo: string | null; descripcion: string | null }> = []
  try {
    segs = await traerPorPaginas<{ cuenta_id: string | null; fecha: string | null
                                   tipo: string | null; descripcion: string | null }>(
      (d, h) => {
        const q = supabaseAdmin.from('seguimientos')
          .select('cuenta_id, fecha, tipo, descripcion')
        return (cuentaId ? q.eq('cuenta_id', cuentaId) : q).range(d, h)
      })
  } catch (e) { sinTabla(e) }
  for (const s of segs) {
    const f = String(s.fecha ?? '').slice(0, 10)
    if (!f || f < desde) continue
    const canal = CANALES_CONTACTO.has(String(s.tipo ?? '').toLowerCase())
    mete(s.cuenta_id, {
      tipo: 'seguimiento',
      fecha: f,
      /* 40 letras, no 90. Estos textos son pegados de WhatsApp y de correo
         —«Hola @Daniel Martínez Loyola - 904 te acabamos de reasignar el…»—
         y a 90 el renglón se come el bloque entero. Aquí sólo hace falta
         reconocer CUÁL captura es; el contenido se lee en Seguimientos. */
      que: `${canal ? 'Seguimiento' : 'Nota interna'}`
         + (s.tipo ? ` (${s.tipo})` : '')
         + (s.descripcion ? `: ${s.descripcion.replace(/\s+/g, ' ').trim().slice(0, 40)}…` : ''),
    })
  }

  /* `Array.from` y no `for...of` sobre el iterador: el `target` de este repo
     no lleva `downlevelIteration` y recorrer un `MapIterator` directamente es
     un TS2802. */
  Array.from(porCuenta.values()).forEach((l: Captura[]) => {
    l.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
  })
  return porCuenta
}

/**
 * El movimiento de cada alerta abierta de una cuenta.
 *
 * `null` cuando la memoria no está disponible: ver la cabecera.
 */
export async function movimientoDeAlertas(
  cuentaId: string,
): Promise<Movimiento[] | null> {
  const mapa = await movimientoDeCartera(cuentaId)
  if (mapa === null) return null
  return mapa.get(cuentaId) ?? []
}

/**
 * Lo mismo para TODA la cartera, en tres consultas en vez de 3×N.
 *
 * Lo necesita `/alertas`, que pinta las 193 cuentas: la versión por cuenta
 * eran 579 consultas por carga de pantalla. Las tablas implicadas son de
 * cientos de filas, así que traerlas enteras cuesta lo mismo que traer una.
 *
 * `cuentaId` acota a una sola — es lo que usa la ficha.
 */
export async function movimientoDeCartera(
  cuentaId?: string,
): Promise<Map<string, Movimiento[]> | null> {
  const hoy = hoyEnMexico()

  /* TODO sale de la memoria del episodio y nada del detector. La primera
     versión recibía el `Alerta[]` de la ficha, y resultó que
     `CuentaConVeredicto` no lo publica: las alertas viven en `EstadoCuenta`,
     que es interno del motor. Pedírselas habría obligado a ensanchar un tipo
     público para que esta pantalla llegara a él. El episodio ya guarda el
     tipo, la severidad de hoy, la peor y la evidencia, así que no hacía
     falta. */
  let filas: FilaEpisodio[]
  try {
    filas = await traerPorPaginas<FilaEpisodio>((d, h) => {
      const q = supabaseAdmin
        .from('alertas_episodios')
        /* UNA SOLA CADENA, sin partirla con `+`: concatenar también destruye
           el tipo literal que `supabase-js` necesita. Es la misma razón por la
           que arriba no hay un helper con el `select` por parámetro. */
        .select('cuenta_id, condicion, tipo, evidencia_actual, condicion_desde, abierto_en, severidad_actual, severidad_peor, escalo_en, desescalo_en, recurrencia')
        .eq('estado', 'abierta')
      return (cuentaId ? q.eq('cuenta_id', cuentaId) : q).range(d, h)
    })
  } catch {
    /* Sin memoria no hay movimiento que contar. Se dice con `null`, no con un
       mapa vacío: «no hubo cambios» y «no se está midiendo» son distintos. */
    return null
  }

  if (filas.length === 0) return new Map()

  /* Las capturas se piden UNA vez, desde la fecha de apertura más antigua de
     todo el lote: pedirlas por alerta serían N consultas iguales. */
  const aperturas = filas
    .map(f => f.condicion_desde ?? f.abierto_en)
    .filter(Boolean) as string[]
  const masViejo = aperturas.length
    ? aperturas.reduce((a, b) => (a < b ? a : b))
    : hoy
  const porCuenta = await capturasDe(cuentaId ?? null, masViejo)

  const fuera = new Map<string, Movimiento[]>()
  for (const ep of filas) {
    const cond = ep.condicion
    const capturas = porCuenta.get(ep.cuenta_id) ?? []
    const laApaga = LO_QUE_LA_APAGA[cond] ?? 'que cambie la situación del cliente'
    const mueven = LA_MUEVEN[cond] ?? new Set<TipoCaptura>()

    /* Las capturas posteriores a la apertura de ESTA alerta, partidas en las
       que la tocan y las que no. Una captura del mismo día cuenta: el reloj
       del tablero va en días, no en horas. */
    const desde = ep.condicion_desde ?? ep.abierto_en
    const suyas = capturas.filter(c => c.fecha >= desde)
    const cuentan = suyas.filter(c => {
      if (!mueven.has(c.tipo)) return false
      /* Una reunión interna no es contacto, aunque el tipo `reunion` sí lo
         sea: la distinción vive en `esConElCliente` y aquí se respeta leyendo
         cómo se rotuló arriba. */
      if (cond === 'contacto' && c.tipo === 'reunion'
          && !c.que.startsWith('Reunión con el cliente')) return false
      if (cond === 'contacto' && c.tipo === 'seguimiento'
          && !c.que.startsWith('Seguimiento')) return false
      return true
    })
    const noCuentan = suyas.filter(c => !cuentan.includes(c))

    let sentido: Sentido
    let frase: string

    const dias = diasEntre(desde, hoy)
    const veces = ep.recurrencia ?? 0
    const sev = (s: string) =>
      PESO_SEVERIDAD[s as keyof typeof PESO_SEVERIDAD] ?? 0
    const peor = sev(ep.severidad_peor)
    const ahora = sev(ep.severidad_actual)

    /* `DIAS_NUEVA` vale 7 en la memoria de episodios y se deriva de la EDAD,
       no de si alguien la miró: la vista no se puede medir sin vigilar. Aquí
       se usa el mismo corte para no publicar dos definiciones de «nueva». */
    if (dias <= 7) {
      sentido = 'nace'
      /* Sin «es nueva» al final: la etiqueta de la izquierda ya lo dice y
         repetirlo en la misma línea se lee como relleno. */
      frase = dias > 0
        ? `Abierta hace ${dias} día${dias === 1 ? '' : 's'}.`
        : 'Abierta hoy.'
    } else if (ep.escalo_en && ahora >= peor) {
      sentido = 'agrava'
      frase = `Empeoró el ${ep.escalo_en}: lleva ${dias} días abierta y hoy `
            + `está en severidad ${ep.severidad_actual}.`
    } else if (ahora < peor) {
      sentido = 'disminuye'
      frase = `Llegó a severidad ${ep.severidad_peor} y hoy está en `
            + `${ep.severidad_actual}. Lleva ${dias} días abierta.`
    } else {
      sentido = 'continua'
      frase = `${dias} días abierta, sin cambio de severidad`
            + (cuentan.length
                ? `, y eso que desde entonces se capturaron ${cuentan.length} `
                + `cosa${cuentan.length === 1 ? '' : 's'} que sí la tocan.`
                : '.')
    }

    if (veces > 0) {
      frase += ` Ha vuelto ${veces} ${veces === 1 ? 'vez' : 'veces'} en esta cuenta.`
    }

    const mov: Movimiento = {
      condicion: cond,
      /* La evidencia que el episodio guardó, que es la frase CON NÚMEROS con
         la que saltó. Si falta —episodios viejos— se cae al tipo, que al
         menos nombra de qué va. */
      titulo: ep.evidencia_actual?.trim() || ep.tipo,
      sentido, frase, cuentan, noCuentan, laApaga,
    }
    const l = fuera.get(ep.cuenta_id)
    if (l) l.push(mov)
    else fuera.set(ep.cuenta_id, [mov])
  }

  /* Lo que MÁS se movió va primero: una alerta que agravó ayer pesa más que
     una que lleva tres meses igual, y en una lista de seis el orden es lo
     único que decide qué se lee. */
  const PESO_SENTIDO: Record<Sentido, number> = {
    agrava: 0, nace: 1, disminuye: 2, continua: 3,
  }
  Array.from(fuera.values()).forEach((l: Movimiento[]) => {
    l.sort((a, b) => PESO_SENTIDO[a.sentido] - PESO_SENTIDO[b.sentido])
  })

  return fuera
}
