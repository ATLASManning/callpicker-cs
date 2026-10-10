import { supabaseAdmin, traerPorPaginas } from '@/lib/supabase'
import { todosLosCortes } from '@/lib/cortes-cuenta'
import {
  mapaFacturacion, importeDeCuenta, topDeCartera, type ImporteCuenta,
} from '@/lib/facturacion-cuenta'
import { baseMinutos } from '@/lib/plan-minutos'
import { hoyEnMexico } from '@/lib/fecha-local'
import { CANALES_CONTACTO, llegoAlCliente, llegoAlClienteActividad } from '@/lib/contacto-cuenta'
import { senalesEscritas, type TextoCuenta } from '@/lib/senal-escrita'
import { mesaDeCuenta } from '@/lib/mesa-ayuda'
import { ticketStatsCuenta } from '@/lib/tickets-cuenta'
import { construirAlerta, type Alerta, type TipoAlerta } from '@/lib/alertas'

/**
 * lib/alertas-detectar.ts — DETECCIÓN DETERMINISTA
 *
 * La detección NO la hace la IA, y es una decisión de diseño, no una
 * limitación: cuando el ejecutivo pregunte «¿por qué saltó esto?», la
 * respuesta tiene que ser una regla que se pueda leer, no la opinión de un
 * modelo. Es también lo que la vuelve defendible ante dirección.
 *
 * La IA viene después, encima de estas señales, para INTERPRETAR y
 * RECOMENDAR — nunca para detectar.
 *
 * Cada regla escribe su `evidencia` CON NÚMEROS. Una alerta sin su número no
 * se puede defender frente al cliente ni frente al equipo, y es exactamente
 * lo que convirtió las 383 acciones de auditoría en texto que nadie siguió.
 */

/**
 * Los umbrales de la mesa de ayuda, medidos ANTES de escribir las alarmas con
 * `scripts/mide-alarmas-sac.py`. Una alarma que salta en el 80% de la cartera
 * no es una alarma: es un color de fondo.
 *
 *   fuera de SLA, cualquier día   2 cuentas (1.0%)  $332,221  ← el 15% del dinero
 *   >= 3 de 20 cortes con vencidos 6 cuentas (3.1%)  $365,949
 *   >= 3 fallas en el histórico   16 cuentas (8.3%)  $590,633
 *
 * Con `>= 1 falla` serían 59 cuentas, el 30.7% — demasiado para que la palabra
 * «recurrente» signifique algo.
 */
export const MESA = {
  /** Cortes con vencidos a partir de los cuales deja de ser un mal día. */
  cortesCronico: 3,
  /** Fallas en el histórico para hablar de recurrencia. */
  fallas: 3,
}

/** Umbrales. Están juntos A PROPÓSITO: son la perilla del volumen. */
export const UMBRALES = {
  /** Meses consecutivos a la baja para declarar caída sostenida. */
  mesesCaida: 3,
  /** Pérdida mínima contra el punto de partida, en tanto por uno. */
  caidaMinima: 0.30,
  /** Por debajo de esto no se mira la caída: el ruido de una cuenta chica. */
  consumoMinimoParaMirar: 10,
  /** Desplome: venía de este nivel y cayó por debajo del otro. */
  desplomeDesde: 40,
  desplomeHasta: 10,
  /** Uso crónicamente bajo: nunca pasó de esto en todo el periodo. */
  usoBajo: 15,
  /** Debajo de esto el consumo es CERO, no bajo. No es 0 exacto para que un
   *  residuo de punto flotante —0.0000001%— no se lea como uso real. */
  consumoCero: 0.5,
  /** Silencio, contado desde el último contacto que LLEGÓ al cliente. */
  silencioLargo: 60,
  silencioCorto: 30,
  /** Intentos fallidos seguidos para declarar que no hay interlocutor.
   *  Dos, no tres: Biolaboratorio Sadat llevaba cuatro cuando ya era tarde. */
  intentosFallidos: 2,
  /** Rebase: por encima de esto se está cobrando excedente. */
  rebase: 100,
} as const

interface CuentaAlerta {
  id: string
  cid: string | null
  consecutivo: string | null
  empresa: string
  asesor: string | null
  estado: string | null
  facturacion: number | null
  ultimo_contacto: string | null
  observaciones_kam: string | null
  notas: string | null
  contactos_json: unknown
}

const CAMPOS =
  'id, cid, consecutivo, empresa, asesor, estado, facturacion, ultimo_contacto, ' +
  'observaciones_kam, notas, contactos_json'

function diasDesde(fecha: string | null | undefined, hoy: string): number | null {
  if (!fecha) return null
  const f = String(fecha).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return null
  const a = Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10))
  const b = Date.UTC(+hoy.slice(0, 4), +hoy.slice(5, 7) - 1, +hoy.slice(8, 10))
  return Math.max(0, Math.round((b - a) / 86400000))
}

function cuantosContactos(v: unknown): number {
  try {
    const arr = Array.isArray(v) ? v : (typeof v === 'string' && v ? JSON.parse(v) : [])
    return Array.isArray(arr) ? arr.length : 0
  } catch { return 0 }
}

const dinero = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')

/**
 * Todas las alertas de la cartera viva, ya ordenadas por prioridad.
 *
 * Lee de fuentes vivas y NO guarda estado: el `id` de cada alerta es estable
 * (`tipo:cuentaId`), así que cuando se agregue la tabla de seguimiento, la
 * misma condición detectada mañana empata con la fila de hoy y la alerta
 * envejece en vez de renacer.
 */
export async function detectarAlertas(
  opciones?: { asesor?: string; cuentaId?: string },
): Promise<Alerta[]> {
  /* `hoyEnMexico()`, NO `hoyLocal()`. Este código corre en el servidor y Vercel
     va en UTC: de 18:00 a 23:59 de México, `hoyLocal()` ya devuelve el día
     siguiente. Cada tarde, durante seis horas, todas las antigüedades salían un
     día infladas y los umbrales se cruzaban una jornada antes de tiempo. Ver
     [[feedback-fechas-zona-mexico]]. */
  const hoy = hoyEnMexico()

  let q = supabaseAdmin.from('cuentas').select(CAMPOS).in('estado', ['activo', 'en_riesgo'])
  if (opciones?.asesor) q = q.eq('asesor', opciones.asesor)
  /* `cuentaId` existe para la FICHA, que necesita el veredicto de UNA cuenta.
     Se filtra aquí arriba y no al final a propósito: todo lo de abajo —radar,
     seguimientos, actividades, cortes— se consulta con `in('cuenta_id', ids)`,
     así que acotar la lista de cuentas acota la corrida entera en vez de
     calcular las 192 para tirar 191. */
  if (opciones?.cuentaId) q = q.eq('id', opciones.cuentaId)
  const { data: cuentasRaw, error } = await q
  if (error) throw error
  const cuentas = (cuentasRaw ?? []) as unknown as CuentaAlerta[]
  if (!cuentas.length) return []

  const ids = cuentas.map(c => c.id)

  const [radarRows, segRows, actRows, cortes] = await Promise.all([
    traerPorPaginas<{ cuenta_id: string }>((d, h) =>
      supabaseAdmin.from('radar_respuestas').select('cuenta_id').in('cuenta_id', ids).range(d, h)),
    traerPorPaginas<{ cuenta_id: string; fecha: string; tipo: string | null;
                      resultado: string | null; descripcion: string | null }>((d, h) =>
      supabaseAdmin.from('seguimientos')
        .select('cuenta_id, fecha, tipo, resultado, descripcion')
        .in('cuenta_id', ids).range(d, h)),
    /* `tipo`, las dos fechas, `resultado` y `descripcion` entran el 7 oct 2026,
       y no son adorno: sin ellos este detector no podía ver que una actividad
       de tipo `llamada` CERRADA es un contacto real, y acusaba de «nunca
       contactada» a quince cuentas a las que sí se llamó. Ver el detalle en
       `lib/contacto-cuenta.ts`.

       `estado`, `asesor` y `semana_inicio` salen el 8 oct 2026: entraron para
       que `asignada_sin_cerrar` pudiera decir desde cuándo y a nombre de quién,
       y esa alerta ya no existe. Esta consulta ahora sirve a UNA cosa —el reloj
       de contacto— y pide solo lo que esa cosa lee. */
    traerPorPaginas<{ cuenta_id: string; completada: boolean | null
                      tipo: string | null; completada_en: string | null
                      fecha_programada: string | null; resultado: string | null
                      descripcion: string | null }>((d, h) =>
      supabaseAdmin.from('actividades')
        .select('cuenta_id, completada, tipo, '
              + 'completada_en, fecha_programada, resultado, descripcion')
        .in('cuenta_id', ids).range(d, h)),
    todosLosCortes(),
  ])

  const conRadar = new Set(radarRows.map(r => r.cuenta_id))

  /* La prosa del equipo, de sus tres fuentes. Los seguimientos ya vienen de la
     consulta de arriba; la ficha aporta `observaciones_kam` y `notas`, que no
     guardan fecha — y eso se DICE en la evidencia en vez de inventar una. */
  const textos: TextoCuenta[] = []
  for (const s of segRows) {
    if (s.cuenta_id && s.descripcion) {
      textos.push({ cuentaId: s.cuenta_id, fecha: String(s.fecha ?? '').slice(0, 10) || null,
                    origen: 'seguimiento', autor: null, texto: s.descripcion })
    }
  }
  for (const c of cuentas) {
    if (c.observaciones_kam) {
      textos.push({ cuentaId: c.id, fecha: null, origen: 'observaciones_kam',
                    autor: c.asesor, texto: c.observaciones_kam })
    }
    if (c.notas) {
      textos.push({ cuentaId: c.id, fecha: null, origen: 'notas',
                    autor: c.asesor, texto: c.notas })
    }
  }
  const escritas = senalesEscritas(textos, opciones?.asesor ?? 'cartera-completa')

  /* ── QUÉ ES UN CONTACTO, Y CUÁNDO LLEGÓ AL CLIENTE ──────────────────────
   *
   * Dos filtros, y el primero importa más que el segundo.
   *
   * 1. SÓLO LOS CANALES CUENTAN. De los 445 seguimientos registrados, 193 son
   *    `nota` y 38 son `ticket`: actividad interna y enlaces a Zoho, no
   *    contacto con nadie. Hasta hoy reiniciaban el reloj del silencio igual
   *    que una llamada, así que escribir una nota diciendo «esta cuenta está
   *    en riesgo» la hacía parecer recién atendida. Quedan 212 contactos de
   *    verdad.
   *
   * 2. DE ESOS, CUÁLES LLEGARON. `resultado` no es un enum —junto a 'exitoso'
   *    y 'sin_respuesta' hay frases escritas a mano—, así que se define lo que
   *    NO llegó y todo lo demás cuenta. Medido: 49 de 212, el 23%.
   *
   * `pendiente` NO basta por sí solo para declarar un fallo, y se comprobó
   * mirando las filas: entre las marcadas así hay una reunión con el cliente y
   * varias notas de trabajo. Lo que delata el fallo es el TEXTO —«no fue
   * posible», «se continuará intentando», «ya no forma parte de la empresa»—,
   * y eso es lo que se busca.
   *
   * El sesgo va a propósito hacia la alarma: tomar un contacto real por
   * fallido cuesta un aviso de más; tomar un fallido por real esconde una
   * cuenta que se está yendo. */
  /* La definición de «llegó al cliente» NO vive aquí: vive en
     lib/contacto-cuenta.ts y la comparten este motor y `getCuentas`. Tenerla
     dos veces fue exactamente lo que produjo que Sección Amarilla saliera con
     96 días en una pantalla y 36 en otra. */

  /** Por cuenta, SÓLO los canales de contacto: el último, el último que LLEGÓ,
   *  y la racha de intentos fallidos consecutivos al final del historial. */
  const porCuenta = new Map<string, typeof segRows>()
  const notasInternas = new Map<string, number>()
  for (const s of segRows) {
    if (!s.cuenta_id || !s.fecha) continue
    if (!CANALES_CONTACTO.has(String(s.tipo ?? '').toLowerCase())) {
      notasInternas.set(s.cuenta_id, (notasInternas.get(s.cuenta_id) ?? 0) + 1)
      continue
    }
    const arr = porCuenta.get(s.cuenta_id) ?? []
    arr.push(s)
    porCuenta.set(s.cuenta_id, arr)
  }
  const ultimoSeg = new Map<string, string>()
  const ultimoEfectivo = new Map<string, string>()
  const rachaFallida = new Map<string, number>()
  for (const [id, arr] of porCuenta) {
    arr.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    ultimoSeg.set(id, String(arr[arr.length - 1].fecha).slice(0, 10))
    for (const s of arr) {
      if (!llegoAlCliente(s)) continue
      const f = String(s.fecha).slice(0, 10)
      if (f > (ultimoEfectivo.get(id) ?? '')) ultimoEfectivo.set(id, f)
    }
    let n = 0
    for (let i = arr.length - 1; i >= 0 && !llegoAlCliente(arr[i]); i--) n++
    rachaFallida.set(id, n)
  }

  /* ── LAS ACTIVIDADES SAC CERRADAS TAMBIÉN SON CONTACTO ───────────────────
   *
   * Los dos relojes de arriba se arman SÓLO con `seguimientos`, y eso costó
   * caro: 100 de las 192 cuentas vivas no tienen ni un seguimiento de canal
   * real, y QUINCE de ellas tienen una actividad SAC cerrada de llamada —
   * ODONTOPREV, LOGYMEX, Medicall Expert, KW-Pedregal, JAZAK TRUCKS, REJAMEX,
   * ESDIE, CH Desarrollos y siete más, $47,322. El tablero les decía a las
   * asesoras que habían abandonado cuentas a las que sí llamaron.
   *
   * Pasa por el MISMO `llegoAlCliente`: una llamada cerrada con resultado «no
   * contestó» tampoco llegó, venga de donde venga. Y se descartan las que no
   * están cerradas: una actividad programada y no hecha es una intención.
   *
   * La fecha sale de `fecha_programada` porque `completada_en` está vacío en
   * las 87 cerradas de canal — es la semana en que tocaba, no el día exacto, y
   * para un reloj que cuenta en decenas de días no cambia ninguna decisión. */
  for (const a of actRows) {
    if (!a.cuenta_id || !a.completada) continue
    /* `...Actividad` y no `llegoAlCliente`: la `descripcion` de una actividad es
       la plantilla que generamos nosotros, y la de la llamada preventiva dice
       «¿Existe algún ticket pendiente sin respuesta?» — que el filtro leía como
       «el cliente no contestó». 36 llamadas reales de 32 cuentas se caían por el
       texto de su propio libreto. */
    if (!llegoAlClienteActividad(a)) continue
    const f = String(a.completada_en ?? a.fecha_programada ?? '').slice(0, 10)
    if (!f) continue
    if (f > (ultimoSeg.get(a.cuenta_id) ?? '')) ultimoSeg.set(a.cuenta_id, f)
    if (f > (ultimoEfectivo.get(a.cuenta_id) ?? '')) ultimoEfectivo.set(a.cuenta_id, f)
  }
  const nSeguimientos = new Map<string, number>()
  for (const s of segRows) {
    if (!s.cuenta_id) continue
    nSeguimientos.set(s.cuenta_id, (nSeguimientos.get(s.cuenta_id) ?? 0) + 1)
  }

  /* ── EL IMPORTE DE CADA CUENTA, RESUELTO UNA SOLA VEZ ──────────────────
   *
   * Instrucción de dirección: la facturación sale de Gross Revenue, y de ahí
   * se toma lo que a la cuenta le falte. Importa aquí más que en ninguna otra
   * pantalla porque este archivo pondera por dinero: `prioridad()` ordena con
   * él y el TOP 25 se calcula con él. Una cuenta en cero no es una cuenta
   * barata, es una cuenta invisible — se iba al fondo de todas las listas.
   *
   * Medido el 6 oct 2026: 55 cuentas cambian de importe y la cartera viva pasa
   * de $1,884,241 a $2,167,114. Entran cuatro al TOP 25, y la mayor —IMPAS
   * Municipio Chihuahua, $65,640 al mes— figuraba en CERO. */
  const facturacion = await mapaFacturacion()
  const importes = new Map<string, ImporteCuenta>()
  for (const c of cuentas) importes.set(c.id, importeDeCuenta(c, facturacion))
  /** La cuenta tal como la ve el resto del archivo, ya con el importe bueno. */
  const conImporte = (c: CuentaAlerta): CuentaAlerta =>
    ({ ...c, facturacion: importes.get(c.id)?.mrr ?? c.facturacion })

  /* Diez cuentas vivas no tienen importe en NINGUNA fuente. Escribir «$0 al
     mes» en su evidencia sería decir que no valen nada, cuando lo que pasa es
     que no lo sabemos. Se dice con palabras. [[feedback-cero-sin-medicion]] */
  const cuantoPaga = (c: CuentaAlerta): string => {
    const i = importes.get(c.id)
    if (!i || i.origen === 'sin_dato') return 'un importe que no está en ninguna fuente'
    return `${dinero(i.mrr)} al mes`
  }

  /* Las TOP salen del dinero, no de una lista a mano: la lista envejece y
     nadie la actualiza. Ver [[feedback-fuente-unica-cuentas]].

     Y salen de la CARTERA COMPLETA, no de las cuentas que esta llamada cargó.
     Se calculaban aquí mismo sobre `cuentas`, que con un filtro de asesora son
     sólo las suyas: a Fátima «TOP» le significaba sus 25 mayores y al tablero
     las 25 de la empresa, con la misma palabra en los dos sitios. La prioridad
     de una alerta multiplica por 1.6 si la cuenta es TOP, así que el orden de
     la cola de un asesor dependía de a quién pertenecía la cuenta. */
  const top = await topDeCartera(facturacion)

  const alertas: Alerta[] = []
  const add = (tipo: TipoAlerta, c: CuentaAlerta, ev: string, dias: number | null = null) =>
    alertas.push(construirAlerta(tipo, conImporte(c), ev, top.has(c.id), dias))

  for (const c of cuentas) {
    // ── Consumo: la serie de la cuenta, de su propio corte ───────────────
    const serie = (c.cid ? cortes.get(String(c.cid)) : null) ?? []
    const pcts = serie
      .map(x => {
        const b = baseMinutos(x.plan, x.incl)
        return b.base && b.base > 0
          ? { mes: x.mes, pct: (100 * x.cons) / b.base }
          : null
      })
      .filter((x): x is { mes: string; pct: number } => x !== null)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-5)

    if (pcts.length < 3) {
      // CEGUERA, y es la más grave: 18 de las 25 TOP caen aquí.
      add('sin_consumo_medible', c,
          c.cid
            ? `El CID ${c.cid} tiene ${pcts.length} de 5 meses con dato de consumo: no `
              + `alcanza para una serie, y factura ${cuantoPaga(c)}.`
            : `La cuenta no tiene CID capturado, así que no cruza con ningún corte: `
              + `${cuantoPaga(c)} sin un solo minuto medible.`)
    } else {
      const ult = pcts[pcts.length - 1]
      const prev = pcts.slice(0, -1)
      const maxPrev = Math.max(...prev.map(p => p.pct))
      const n = UMBRALES.mesesCaida
      const tramo = pcts.slice(-n)
      const bajando = tramo.length === n && tramo.every((p, i) => i === 0 || p.pct < tramo[i - 1].pct)
      const caida = tramo.length === n && tramo[0].pct > 0
        ? (tramo[0].pct - ult.pct) / tramo[0].pct : 0

      if (bajando && tramo[0].pct >= UMBRALES.consumoMinimoParaMirar
          && caida >= UMBRALES.caidaMinima) {
        add('caida_consumo', c,
            `Consumo de ${tramo.map(p => `${p.pct.toFixed(0)}%`).join(' → ')} `
            + `entre ${tramo[0].mes} y ${ult.mes}: ${(caida * 100).toFixed(0)}% menos.`)
      } else if (maxPrev >= UMBRALES.desplomeDesde && ult.pct < UMBRALES.desplomeHasta) {
        add('desplome_consumo', c,
            `Llegó a usar el ${maxPrev.toFixed(0)}% de su plan y en ${ult.mes} usó `
            + `el ${ult.pct.toFixed(0)}%.`)
      } else if (Math.max(...pcts.map(p => p.pct)) < UMBRALES.consumoCero) {
        /* ANTES de `uso_bajo` a propósito: sin esta rama, una cuenta con cero
           minutos salía con la evidencia «nunca pasó del 0% de su plan», que
           es una frase sin sentido y una severidad equivocada. */
        add('consumo_cero', c,
            `Cero minutos consumidos en los ${pcts.length} meses medidos `
            + `(${pcts[0].mes} a ${ult.mes}), y paga ${cuantoPaga(c)}.`)
      } else if (Math.max(...pcts.map(p => p.pct)) < UMBRALES.usoBajo) {
        add('uso_bajo', c,
            `Nunca pasó del ${Math.max(...pcts.map(p => p.pct)).toFixed(0)}% de su plan en `
            + `${pcts.length} meses, y paga ${cuantoPaga(c)}.`)
      } else if (ult.pct > UMBRALES.rebase) {
        add('rebasa_bolsa', c,
            `En ${ult.mes} consumió el ${ult.pct.toFixed(0)}% de su bolsa: el excedente se cobra.`)
      }
    }

    /* ── Contacto ─────────────────────────────────────────────────────────
     *
     * El reloj del silencio lo reinicia un contacto que LLEGÓ al cliente, no
     * cualquier renglón del historial. Medido el 6 oct 2026: con el criterio
     * viejo había 25 cuentas en silencio largo; con éste aparecen 9 más que
     * estaban tapadas por actividad que nunca alcanzó a nadie —$53,640 de MRR,
     * entre ellas SW Sapien, contactada «hace 11 días» y sin un contacto real
     * desde hace 90—. */
    const racha = rachaFallida.get(c.id) ?? 0
    const fEfectivo = ultimoEfectivo.get(c.id) ?? null
    /* `cuentas.ultimo_contacto` NO se usa, ni siquiera como último recurso.
     *
     * Esa columna la escribe el cierre de CUALQUIER actividad, incluidas las
     * que no hablan con nadie: `app/api/actividades/[id]/route.ts` pone
     * `ultimo_contacto = hoy` también al cerrar una de tipo `validacion`,
     * `analisis`, `kam`, `tickets` o `pagos`. O sea que revisar unos datos
     * marcaba la cuenta como contactada hoy.
     *
     * Y no se pierde nada al soltarla: esa misma ruta —y `/api/seguimientos`—
     * insertan SIEMPRE la fila en `seguimientos` antes de tocar la columna, así
     * que `seguimientos` es un superconjunto. La columna sólo añadía ruido.
     * Fuente única, ver [[feedback-fuente-unica-cuentas]]. */
    const fCualquiera = ultimoSeg.get(c.id) ?? null
    const dEfectivo = diasDesde(fEfectivo, hoy)
    const dCualquiera = diasDesde(fCualquiera, hoy)

    if (dCualquiera === null) {
      /* Se dice lo que se sabe Y lo que no. Son 100 de las 192 cuentas vivas,
         y en 49 de ellas la ficha SÍ trae una fecha en `ultimo_contacto`. Esa
         fecha no prueba una conversación —la escribe también el cierre de una
         tarea de validación— pero tampoco prueba lo contrario. Callarla sería
         acusar; darla por buena sería lo que veníamos haciendo. Se enseña y se
         dice de dónde viene. Ver [[feedback-contexto-ia-sin-huecos]]. */
      const nNotas = notasInternas.get(c.id) ?? 0
      const trozos: string[] = [
        `Cero contactos registrados por un canal real —ni llamada, ni correo, `
        + `ni WhatsApp, ni reunión— en una cuenta de ${cuantoPaga(c)}.`,
      ]
      if (nNotas > 0) {
        trozos.push(`Hay ${nNotas} ${nNotas === 1 ? 'nota interna' : 'notas internas'}, `
                    + `que documentan la cuenta pero no son haber hablado con ella.`)
      }
      if (c.ultimo_contacto) {
        trozos.push(`La ficha marca ${String(c.ultimo_contacto).slice(0, 10)} como último `
                    + `contacto, pero esa fecha la escribe también el cierre de tareas `
                    + `internas: no acredita una conversación.`)
      }
      add('nunca_contactada', c, trozos.join(' '))
    } else if (racha >= UMBRALES.intentosFallidos) {
      const desde = (porCuenta.get(c.id) ?? []).slice(-racha)[0]
      const dDesde = diasDesde(desde ? String(desde.fecha).slice(0, 10) : null, hoy)
      add('sin_interlocutor', c,
          `${racha} intentos de contacto seguidos sin que nadie respondiera, `
          + `desde el ${desde ? String(desde.fecha).slice(0, 10) : '—'}`
          + (dDesde !== null ? ` (hace ${dDesde} días)` : '')
          + `. El último que llegó al cliente fue `
          + (fEfectivo ? `el ${fEfectivo}.` : 'ninguno de los registrados.'),
          dDesde)
    } else {
      // Si nunca hubo uno efectivo, el reloj corre desde el intento: no se
      // premia con un reloj a cero a quien marcó y no le contestaron.
      const d = dEfectivo ?? dCualquiera
      const base = fEfectivo ?? fCualquiera
      const matiz = fEfectivo && fCualquiera && fEfectivo !== fCualquiera
        ? ` Hubo actividad más reciente —el ${fCualquiera}—, pero no llegó al cliente.`
        : ''
      if (d > UMBRALES.silencioLargo) {
        add('silencio_60', c, `Último contacto que llegó al cliente: ${base}, `
            + `hace ${d} días.${matiz}`, d)
      } else if (d > UMBRALES.silencioCorto) {
        add('silencio_30', c, `Último contacto que llegó al cliente: ${base}, `
            + `hace ${d} días.${matiz}`, d)
      }
    }

    // ── Ceguera de ficha ─────────────────────────────────────────────────
    if (!conRadar.has(c.id)) {
      add('sin_radar', c,
          `0 de 12 preguntas del Radar respondidas, en una cuenta de `
          + `${cuantoPaga(c)}.`)
    }
    if (cuantosContactos(c.contactos_json) === 0) {
      add('sin_contactos', c,
          `Cero contactos capturados en una cuenta de ${cuantoPaga(c)}.`)
    }
    if (!(c.observaciones_kam ?? '').trim()) {
      const ns = nSeguimientos.get(c.id) ?? 0
      add('sin_ficha', c,
          `Cero observaciones del KAM en una cuenta de ${cuantoPaga(c)}, `
          + `con ${ns} ${ns === 1 ? 'seguimiento' : 'seguimientos'} en el historial.`)
    }

    /* ── Lo que el equipo YA ESCRIBIÓ ─────────────────────────────────────
     * La única alerta cuya evidencia es una CITA. Las guardas que evitan los
     * falsos positivos viven en lib/senal-escrita.ts, y las cinco salieron de
     * mirar el texto real, no de imaginarlo. */
    const se = escritas.get(c.id)
    if (se) {
      const cuando = se.fecha
        ? `Escrito el ${se.fecha}` + (se.autor ? ` por ${se.autor}` : '')
        : `Escrito en ${se.origen === 'notas' ? 'las notas' : 'la ficha'}`
            + (se.autor ? ` por ${se.autor}` : '') + ' (sin fecha)'
      const d = diasDesde(se.fecha, hoy)
      add(se.tipo, c,
          `${cuando}${d !== null ? `, hace ${d} días` : ''}: «${se.frase}»`,
          d)
    }

    /* Aquí vivía la familia ABANDONO: `asignada_sin_cerrar` y `nunca_asignada`.
       Se retiraron el 8 oct 2026 con el generador SAC. Las dos medían nuestra
       contabilidad del lote, no la cuenta: la primera pedía cerrar una
       actividad en una pantalla que ya borramos, la segunda prometía una cola
       que ya no drena. «Nadie está cuidando esta cuenta» lo dice ahora el motor
       de veredictos con `no_la_vemos` y `sin_auditar`, sobre el cliente.

       Lo que NO se fue: el bucle de arriba que mete las actividades cerradas de
       canal en el reloj de contacto. Esas 87 filas son evidencia de que alguien
       llamó, y son la razón por la que el tablero dejó de acusar a 32 cuentas
       de abandono cuando sí se les había llamado. */

    /* ── LA MESA DE AYUDA ──────────────────────────────────────────────────
     *
     * Dirección, 9 oct 2026: «reforzar, robustecer las alarmas de las cuentas,
     * darles mayor peso a tus hallazgos».
     *
     * Hasta hoy el detector no abría `lib/mesa-ayuda.ts` ni una vez. Medido el
     * mismo día: el `health_score` correlaciona con `fallas` en +0.121 y con
     * `tickets` en +0.098 —EN POSITIVO—, porque no existe ninguna ruta de
     * código de la mesa al número. GRUPO TORRES CORZO arrastra el folio 106428
     * escalado 155 días, 156 sin que nadie lo mueva, sobre $316,541 al mes, y
     * salía en el lugar 16 del tablero.
     *
     * LOS TRES SON EXCLUYENTES, y en ese orden, porque comparten grupo de
     * episodio (`CONDICION[...] = 'mesa'`) y dentro de un grupo los tipos
     * tienen que serlo: son la misma historia empeorando. Crónico gana a
     * vencido porque arrastrarlo veinte cortes dice más que tenerlo hoy. */
    const mesa = mesaDeCuenta(c.cid)
    const peor = mesa.peor
    if (mesa.cortesConVencidos >= MESA.cortesCronico && mesa.cortesTotales > 0) {
      add('sac_atraso_cronico', c,
          `Aparece con tickets vencidos en ${mesa.cortesConVencidos} de los `
        + `${mesa.cortesTotales} cortes de la mesa`
        + (peor
            ? `. Hoy el peor es el folio ${peor.folio} con ${peor.diasSLA} días fuera `
              + `de SLA y ${peor.diasSinMover} sin que nadie lo mueva (${peor.estado})`
            : `. Hoy no tiene ninguno abierto`)
        + `. Corte del ${mesa.fechaCorte}`,
          peor?.diasSLA ?? null)
    } else if (peor) {
      add('sac_fuera_sla', c,
          `Folio ${peor.folio} con ${peor.diasSLA} días fuera de SLA y `
        + `${peor.diasSinMover} sin que nadie lo mueva (${peor.estado}`
        + (peor.responsable ? `, ${peor.responsable}` : '') + `). `
        + `«${peor.asunto}». Corte del ${mesa.fechaCorte}`,
          peor.diasSLA)
    } else {
      /* Las fallas son del histórico de la mesa, NO de una ventana de 60 días:
         `ticketStatsCuenta` no la publica. Se dice así en la evidencia, porque
         «3 fallas en 60 días» y «3 fallas en el histórico» no son lo mismo y la
         diferencia la discute el cliente. */
      const tk = ticketStatsCuenta(c.cid ?? null, c.empresa)
      if (tk.fallas >= MESA.fallas) {
        add('sac_fallas_recurrentes', c,
            `${tk.fallas} fallas del servicio registradas en el histórico de la `
          + `mesa, sobre ${tk.total} tickets atendidos`
          + (tk.ultima ? `. El último, el ${tk.ultima}` : ''))
      }
    }

    /* ── LA OCTAVA FUENTE, que se medía y no encendía nada ─────────────── */
    if (importes.get(c.id)?.origen === 'sin_dato') {
      add('sin_importe', c,
          'La cuenta está viva y no tiene importe ni en el GRC por CID ni en su '
        + 'propia ficha: no pesa en ninguna cifra de dinero del tablero')
    }
  }

  return alertas.sort((a, b) =>
    b.prioridad - a.prioridad || b.mrr - a.mrr || a.empresa.localeCompare(b.empresa, 'es'))
}
