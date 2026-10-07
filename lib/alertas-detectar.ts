import { supabaseAdmin, traerPorPaginas } from '@/lib/supabase'
import { todosLosCortes } from '@/lib/cortes-cuenta'
import { mapaFacturacion, importeDeCuenta, type ImporteCuenta } from '@/lib/facturacion-cuenta'
import { baseMinutos } from '@/lib/plan-minutos'
import { hoyEnMexico } from '@/lib/fecha-local'
import { CANALES_CONTACTO, llegoAlCliente } from '@/lib/contacto-cuenta'
import { senalesEscritas, type TextoCuenta } from '@/lib/senal-escrita'
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

/** Las TOP: las 25 de mayor facturación. «El cliente 25 ya factura 20,000». */
const N_TOP = 25

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
export async function detectarAlertas(opciones?: { asesor?: string }): Promise<Alerta[]> {
  /* `hoyEnMexico()`, NO `hoyLocal()`. Este código corre en el servidor y Vercel
     va en UTC: de 18:00 a 23:59 de México, `hoyLocal()` ya devuelve el día
     siguiente. Cada tarde, durante seis horas, todas las antigüedades salían un
     día infladas y los umbrales se cruzaban una jornada antes de tiempo. Ver
     [[feedback-fechas-zona-mexico]]. */
  const hoy = hoyEnMexico()

  let q = supabaseAdmin.from('cuentas').select(CAMPOS).in('estado', ['activo', 'en_riesgo'])
  if (opciones?.asesor) q = q.eq('asesor', opciones.asesor)
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
    /* `asesor` y `semana_inicio` entran aquí el 6 oct 2026, y no son adorno:
       sin ellos la alerta `asignada_sin_cerrar` le cobraba al asesor ACTUAL de
       la cuenta un trabajo que pudo haber recibido otra persona hace meses, sin
       ventana de tiempo y con severidad crítica. */
    traerPorPaginas<{ cuenta_id: string; completada: boolean | null; estado: string | null
                      asesor: string | null; semana_inicio: string | null }>((d, h) =>
      supabaseAdmin.from('actividades')
        .select('cuenta_id, completada, estado, asesor, semana_inicio')
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
  const escritas = senalesEscritas(textos)

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
  /* Se cuentan, no solo se marcan: la evidencia de `asignada_sin_cerrar` tiene
     que poder decir CUÁNTAS se asignaron. «Se le asignó trabajo y no se cerró»
     es una queja; «se le asignaron 7 y no se cerró ninguna» es un dato. */
  const nAsignadas = new Map<string, number>()
  const cerradas = new Set<string>()
  /** Desde cuándo y a nombre de quién, para que la herencia se vea. */
  const asignDesde = new Map<string, string>()
  const asignA = new Map<string, Set<string>>()
  for (const a of actRows) {
    if (!a.cuenta_id) continue
    nAsignadas.set(a.cuenta_id, (nAsignadas.get(a.cuenta_id) ?? 0) + 1)
    if (a.completada || a.estado === 'completada') cerradas.add(a.cuenta_id)
    const f = String(a.semana_inicio ?? '').slice(0, 10)
    if (f && (!asignDesde.has(a.cuenta_id) || f < asignDesde.get(a.cuenta_id)!)) {
      asignDesde.set(a.cuenta_id, f)
    }
    if (a.asesor) {
      const s = asignA.get(a.cuenta_id) ?? new Set<string>()
      s.add(a.asesor)
      asignA.set(a.cuenta_id, s)
    }
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
     nadie la actualiza. Ver [[feedback-fuente-unica-cuentas]]. */
  const mrrDe = (c: CuentaAlerta) => importes.get(c.id)?.mrr ?? (c.facturacion ?? 0)
  const top = new Set(
    [...cuentas].sort((a, b) => mrrDe(b) - mrrDe(a))
      .slice(0, N_TOP).map(c => c.id))

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

    // ── Abandono: es nuestro, no del cliente ─────────────────────────────
    const nAsig = nAsignadas.get(c.id) ?? 0
    if (nAsig > 0 && !cerradas.has(c.id)) {
      // El verbo concuerda con el número, no solo el sustantivo: «se le
      // asignaron 1 actividad» salía en 26 de las 69 alertas de abandono.
      /* La evidencia DICE desde cuándo y a nombre de quién. Sin eso, una cuenta
         que cambió de cartera le endosa al nuevo asesor una crítica que nunca
         recibió, y él no tiene forma de saberlo mirando el tablero. */
      const desde = asignDesde.get(c.id)
      const dDesde = diasDesde(desde ?? null, hoy)
      const nombres = Array.from(asignA.get(c.id) ?? [])
      const heredada = nombres.length > 0 && c.asesor != null && !nombres.includes(c.asesor)
      add('asignada_sin_cerrar', c,
          (nAsig === 1 ? 'Se le asignó 1 actividad' : `Se le asignaron ${nAsig} actividades`)
          + (desde ? ` desde el ${desde}` : '')
          + (dDesde !== null ? ` (hace ${dDesde} días)` : '')
          + ` y no se ha cerrado ninguna, en una cuenta de `
          + `${cuantoPaga(c)}.`
          + (heredada
              ? ` OJO: ${nombres.length === 1 ? 'se asignó a' : 'se asignaron a'} `
                + `${nombres.join(' y ')}, no a ${c.asesor} — viene heredada con la cartera.`
              : ''),
          dDesde)
    } else if (nAsig === 0) {
      add('nunca_asignada', c,
          `Cero actividades en todo el historial, y paga ${cuantoPaga(c)}.`)
    }
  }

  return alertas.sort((a, b) =>
    b.prioridad - a.prioridad || b.mrr - a.mrr || a.empresa.localeCompare(b.empresa, 'es'))
}
