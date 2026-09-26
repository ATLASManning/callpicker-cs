/**
 * lib/estado-cuenta.ts — lo que hay que saber de una cuenta ANTES de llamarla.
 *
 * INSTRUCCIÓN DE DIRECCIÓN (25 sep 2026)
 * --------------------------------------
 * «Considero que debes construir el globo o ventana, y que al abrir cada cuenta
 * le digas su último contacto, su último ticket, si tiene análisis de llamadas
 * menciónalo, si tiene auditoría menciona el estado, si ha tenido o no
 * actividades SAC, etc.»
 *
 * EL PROBLEMA QUE RESUELVE
 * ------------------------
 * La ficha tiene toda esa información, pero repartida en once paneles y abajo
 * del pliegue. El asesor que entra treinta segundos antes de una llamada no la
 * lee: abre, ve el health score y marca. Esto la junta en un solo bloque que se
 * lee en diez segundos.
 *
 * DOS REGLAS QUE NO SE NEGOCIAN
 * -----------------------------
 * 1. **No agrega ni una consulta.** Todo lo que necesita ya lo carga la página.
 *    Se recibe como parámetro y se compone; si esto disparara sus propias
 *    lecturas, abrir una cuenta costaría el doble por un resumen.
 *
 * 2. **Un hueco se dice con palabras, nunca con un cero.** «Sin lectura de
 *    llamadas» no es lo mismo que «atiende bien», y «nunca ha tenido una
 *    actividad SAC» no es lo mismo que «no tiene pendientes». Es la lección de
 *    los tickets: el export de Zoho solo trae cerrados, y colapsar eso a «0
 *    abiertos» hizo que el tablero afirmara que GRUPO 2711 no tenía nada
 *    mientras su folio llevaba 21 días fuera de SLA.
 */

export type TonoLinea = 'grave' | 'aviso' | 'bien' | 'neutro' | 'hueco'

export interface LineaEstado {
  /** Nombre del icono de lucide-react que le corresponde. */
  icono: string
  titulo: string
  texto: string
  tono: TonoLinea
}

export interface EstadoCuenta {
  /** La frase de arriba: lo más importante, en una línea. */
  encabezado: string
  tonoEncabezado: TonoLinea
  lineas: LineaEstado[]
  /** Cuántas cosas piden acción. Es el número que va en el globo cerrado. */
  pendientes: number
}

/* ── Entradas. Todas opcionales: la página puede no tener alguna y el resumen
      tiene que salir igual, diciendo qué le faltó. ───────────────────────── */
export interface EntradaEstado {
  empresa: string
  ultimoContacto?: string | null
  estado?: string | null
  bloqueada?: boolean
  motivosBloqueo?: string[]
  seguimientos?: Array<{ fecha?: string | null; tipo?: string | null; resultado?: string | null }> | null
  actividades?: Array<{
    tipo?: string | null; completada?: boolean | null; estado?: string | null
    fecha_programada?: string | null; creado_en?: string | null
  }> | null
  /** De `soporteDeCuenta`. */
  soporte?: {
    historia?: { total?: number; ultimoCierre?: string | null } | null
    vencidos?: unknown[] | null
    peorDiasSLA?: number | null
    reincideEnMesa?: boolean
    frase?: string
  } | null
  /** Último ticket conocido del export de Zoho. */
  ultimoTicket?: { fecha?: string | null; categoria?: string | null; folio?: string | number | null } | null
  /** De `leerLlamadas`. `null` = esa cuenta no tiene lectura. */
  llamadas?: { etiqueta?: string; veredicto?: string; portada?: string } | null
  /** Del registry de auditorías + su caso. */
  auditoria?: { nombre?: string; estado?: string | null; fecha?: string | null } | null
  /** Personas con nombre registradas en la ficha. */
  personas?: Array<{ nombre: string; cargo: string; telUtil: boolean }> | null
  /** Último corte de facturación, si lo hay. */
  corte?: { mes?: string | null; pct?: number | null; plan?: string | null } | null
  /** Día de hoy en México, `AAAA-MM-DD`. Se recibe para no calcular husos aquí. */
  hoy: string
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/**
 * El día de México de una marca de tiempo, `AAAA-MM-DD`.
 *
 * Las aperturas de ticket del export de Zoho vienen en UTC
 * (`2026-02-18T19:16:00.000Z`) y México va seis horas atrás todo el año: un
 * ticket abierto a las 19:16 UTC se abrió a las 13:16 del MISMO día, pero uno
 * de las 03:00 UTC se abrió a las 21:00 del día ANTERIOR. Cortar la cadena en
 * los primeros diez caracteres corre esas fechas un día, que es exactamente el
 * error que el módulo de Tickets vino a corregir.
 *
 * Una fecha que ya viene sin hora se devuelve intacta: no hay nada que mover.
 */
function diaMexico(v: string | null | undefined): string {
  const s = String(v ?? '')
  if (!s.includes('T')) return s.slice(0, 10)
  const t = Date.parse(s)
  if (!isFinite(t)) return s.slice(0, 10)
  return new Date(t - 6 * 3600000).toISOString().slice(0, 10)
}

/**
 * `AAAA-MM-DD` → `21 sep 2026`, SIN pasar por `new Date` para formatear.
 *
 * `new Date('2026-09-21')` se interpreta como medianoche UTC y al pintarlo en
 * México sale el día anterior. La fecha ya viene en partes: se formatea con
 * ellas. Lo que NO reconoce se devuelve tal cual — `fecha_auditoria` es un
 * texto como «Jun 2026» y tiene que sobrevivir intacto.
 */
function fmt(iso: string | null | undefined): string {
  const d = diaMexico(iso)
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  if (!m) return String(iso ?? '')
  return `${parseInt(m[3], 10)} ${MESES[parseInt(m[2], 10) - 1] ?? m[2]} ${m[1]}`
}

/** Días entre dos fechas, por partes y sin husos. `desde` puede traer hora. */
function dias(desde: string | null | undefined, hasta: string): number | null {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(diaMexico(desde))
  const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(hasta)
  if (!a || !b) return null
  const ms = Date.UTC(+b[1], +b[2] - 1, +b[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])
  return Math.floor(ms / 86400000)
}

/** Nadie debe pasar de aquí sin contacto. Mismo umbral que lib/focos-riesgo.ts. */
const DIAS_LIMITE = 60

export function estadoDeCuenta(e: EntradaEstado): EstadoCuenta {
  const L: LineaEstado[] = []
  let pendientes = 0
  const suma = (l: LineaEstado) => {
    L.push(l)
    if (l.tono === 'grave' || l.tono === 'hueco') pendientes++
  }

  /* ── 1. ÚLTIMO CONTACTO ───────────────────────────────────────────
     Va primero porque es la señal más fuerte que tenemos: de las cuentas
     sin seguimiento registrado se dio de baja el 28%, contra el 13% de las
     que sí lo tienen. */
  const fechasSeg = (e.seguimientos ?? [])
    .map(s => String(s?.fecha ?? '').slice(0, 10))
    .filter(Boolean)
    .sort()
  const ultimoSeg = fechasSeg.length ? fechasSeg[fechasSeg.length - 1] : null
  const refContacto = ultimoSeg ?? (e.ultimoContacto ? String(e.ultimoContacto).slice(0, 10) : null)
  const d = dias(refContacto, e.hoy)

  if (!refContacto) {
    suma({
      icono: 'PhoneOff', titulo: 'Último contacto',
      texto: 'NUNCA se le ha registrado un contacto. No hay una sola conversación en su historia.',
      tono: 'hueco',
    })
  } else if (d !== null && d > DIAS_LIMITE) {
    suma({
      icono: 'PhoneOff', titulo: 'Último contacto',
      texto: `${fmt(refContacto)} — hace ${d} días. Pasa del límite de ${DIAS_LIMITE}.`,
      tono: 'grave',
    })
  } else {
    suma({
      icono: 'Phone', titulo: 'Último contacto',
      texto: `${fmt(refContacto)}${d !== null ? ` — hace ${d} día${d === 1 ? '' : 's'}` : ''}.` +
             `${fechasSeg.length ? ` ${fechasSeg.length} seguimiento${fechasSeg.length === 1 ? '' : 's'} registrado${fechasSeg.length === 1 ? '' : 's'} en total.` : ''}`,
      tono: d !== null && d > 30 ? 'aviso' : 'bien',
    })
  }

  /* ── 2. ACTIVIDADES SAC ───────────────────────────────────────────
     «Si ha tenido o no actividades SAC». El «o no» importa: una cuenta a la
     que el sistema nunca le pidió trabajo es distinta de una que lo recibió
     y no se hizo. ALTERNET pidió la baja sin haber tenido NUNCA una. */
  const acts = e.actividades ?? []
  const abiertas = acts.filter(a => a && a.completada !== true).length
  const cerradas = acts.filter(a => a && a.completada === true).length
  if (acts.length === 0) {
    suma({
      icono: 'ClipboardX', titulo: 'Actividades SAC',
      texto: 'NUNCA ha tenido una actividad SAC asignada. El sistema jamás le ha pedido a nadie ' +
             'que la siguiera.',
      tono: 'hueco',
    })
  } else {
    suma({
      icono: 'ClipboardCheck', titulo: 'Actividades SAC',
      texto: `${acts.length} en total: ${cerradas} cerrada${cerradas === 1 ? '' : 's'} y ` +
             `${abiertas} abierta${abiertas === 1 ? '' : 's'}.`,
      tono: abiertas > 0 ? 'aviso' : 'neutro',
    })
  }

  /* ── 3. TICKETS ───────────────────────────────────────────────────
     Se usa la frase de `soporteDeCuenta`, que ya sabe no decir «0 abiertos»
     cuando lo que hay es ausencia de medición. */
  const s = e.soporte
  const vencidos = Array.isArray(s?.vencidos) ? s!.vencidos!.length : 0
  if (vencidos > 0) {
    suma({
      icono: 'AlertTriangle', titulo: 'Tickets',
      texto: `${vencidos} FUERA DE SLA` +
             (s?.peorDiasSLA ? `, el peor con ${s.peorDiasSLA} días de atraso` : '') +
             (s?.reincideEnMesa ? '. Reincide: aparece con vencidos en varios cortes.' : '.') +
             (e.ultimoTicket?.fecha ? ` Último ticket: ${fmt(e.ultimoTicket.fecha)}.` : ''),
      tono: 'grave',
    })
  } else if (e.ultimoTicket?.fecha) {
    const dt = dias(e.ultimoTicket.fecha, e.hoy)
    suma({
      icono: 'Ticket', titulo: 'Último ticket',
      texto: `${fmt(e.ultimoTicket.fecha)}${dt !== null ? ` — hace ${dt} días` : ''}` +
             (e.ultimoTicket.categoria ? `, «${e.ultimoTicket.categoria}»` : '') + '.' +
             (s?.historia?.total ? ` ${s.historia.total} en su historia.` : ''),
      tono: 'neutro',
    })
  } else {
    suma({
      icono: 'Ticket', titulo: 'Tickets',
      texto: 'Sin tickets cruzados en el export de Zoho. Puede operar bajo otro CID — no ' +
             'significa que no haya tenido ninguno.',
      tono: 'hueco',
    })
  }

  /* ── 4. ANÁLISIS DE LLAMADAS ──────────────────────────────────────
     «Si tiene análisis de llamadas, menciónalo.» Y si NO lo tiene también,
     porque son 33 de las 179 cuentas vivas y ahí no se puede afirmar nada. */
  if (!e.llamadas) {
    suma({
      icono: 'PhoneMissed', titulo: 'Análisis de llamadas',
      texto: 'NO tiene lectura. Su CID no aparece en las extracciones, así que no sabemos cómo le ' +
             'están contestando el teléfono. Hay que sacarlas de Callpicker.',
      tono: 'hueco',
    })
  } else {
    const v = String(e.llamadas.veredicto ?? '')
    suma({
      icono: 'PhoneCall', titulo: `Análisis de llamadas — ${e.llamadas.etiqueta ?? v}`,
      texto: String(e.llamadas.portada ?? '').trim() || 'Tiene lectura de llamadas en la ficha.',
      tono: v === 'en_silencio' || v === 'llama' ? 'grave'
        : v === 'vigilar' ? 'aviso'
        : v === 'estable' ? 'bien' : 'neutro',
    })
  }

  /* ── 5. AUDITORÍA ─────────────────────────────────────────────────
     «Si tiene auditoría, menciona el estado.» Nace de ALTERNET: auditoría
     entregada en junio, baja pedida en septiembre, y en medio siete semanas
     sin un solo seguimiento. */
  if (e.auditoria) {
    const est = String(e.auditoria.estado ?? '').trim()
    const enRiesgo = ['en_riesgo', 'rescatable', 'en_recuperacion'].includes(est)
    suma({
      icono: 'FileSearch', titulo: 'Auditoría',
      texto: `Tiene auditoría entregada${e.auditoria.fecha ? ` el ${fmt(e.auditoria.fecha)}` : ''}` +
             (est ? `, estado «${est.replace(/_/g, ' ')}»` : '') + '. ' +
             (enRiesgo ? 'Ábrela antes de llamar: la cuenta sigue en riesgo.' : 'Ábrela antes de llamar.'),
      tono: enRiesgo ? 'grave' : 'aviso',
    })
  } else {
    suma({
      icono: 'FileSearch', titulo: 'Auditoría',
      texto: 'No tiene auditoría entregada.',
      tono: 'neutro',
    })
  }

  /* ── 6. QUIÉN CONTESTA ────────────────────────────────────────────
     128 de 179 cuentas vivas cuelgan de una sola persona. No avisa poco a
     poco: se manifiesta de golpe el día que esa persona no contesta. */
  const p = e.personas ?? []
  if (p.length === 0) {
    suma({
      icono: 'UserX', titulo: 'Con quién hablar',
      texto: 'Sin una sola persona con nombre registrada. No sabemos a quién llamar.',
      tono: 'hueco',
    })
  } else if (p.length === 1) {
    suma({
      icono: 'UserX', titulo: 'Con quién hablar',
      texto: `Cuelga de UNA sola persona: ${p[0].nombre}` +
             (p[0].cargo ? ` (${p[0].cargo})` : ' — sin cargo registrado') +
             (p[0].telUtil ? '.' : ', y sin teléfono marcable: el correo es el único canal.'),
      tono: 'grave',
    })
  } else {
    /* CONTAR PERSONAS NO BASTA, y se comprobó con Clikauto: tiene DOS
       registradas y el globo la daba por sana. Ninguna de las dos tiene
       teléfono marcable, así que el correo es el único canal — y desde junio
       nadie responde. Una cuenta a la que solo se le puede escribir depende de
       que el otro quiera contestar.

       Lo mismo con el cargo: sin cargo no se sabe quién decide, y dos contactos
       operativos no son un mapa de decisores, son la misma dependencia
       repartida. */
    const conTel = p.filter(x => x.telUtil).length
    const conCargo = p.filter(x => x.cargo).length
    const lista = p.map(x => x.nombre + (x.cargo ? ` (${x.cargo})` : ' — sin cargo')).join(' · ')
    if (conTel === 0) {
      suma({
        icono: 'UserX', titulo: 'Con quién hablar',
        texto: `${p.length} personas registradas y NINGUNA con teléfono marcable: ${lista}. ` +
               'El correo es el único canal, así que depende de que contesten cuando quieran.',
        tono: 'grave',
      })
    } else if (conCargo === 0) {
      suma({
        icono: 'Users', titulo: 'Con quién hablar',
        texto: `${p.length} personas registradas, ninguna con cargo: ${lista}. ` +
               'Sin cargo no se sabe quién decide.',
        tono: 'aviso',
      })
    } else {
      const sinTel = p.length - conTel
      suma({
        icono: 'Users', titulo: 'Con quién hablar',
        texto: `${p.length} personas registradas: ${lista}.` +
               (sinTel ? ` ${sinTel} sin teléfono marcable.` : ''),
        tono: 'neutro',
      })
    }
  }

  /* ── 7. CONSUMO ───────────────────────────────────────────────────── */
  if (e.corte?.mes) {
    const pct = typeof e.corte.pct === 'number' ? e.corte.pct : null
    suma({
      icono: 'Gauge', titulo: `Corte de ${e.corte.mes}`,
      texto: pct === null
        ? `Plan «${e.corte.plan ?? 'sin nombre'}», sin base de minutos medible.`
        : `Usa el ${Math.round(pct)}% de su plan «${e.corte.plan ?? 'sin nombre'}».`,
      tono: pct !== null && pct < 20 ? 'grave' : pct !== null && pct < 40 ? 'aviso' : 'neutro',
    })
  } else {
    suma({
      icono: 'Gauge', titulo: 'Consumo',
      texto: 'Sin cortes de facturación cruzados por su CID.',
      tono: 'hueco',
    })
  }

  /* ── El encabezado: lo más grave que haya, dicho en una línea ────── */
  const grave = L.find(x => x.tono === 'grave') ?? L.find(x => x.tono === 'hueco')
  let encabezado: string
  let tonoEncabezado: TonoLinea
  if (e.bloqueada) {
    encabezado = (e.motivosBloqueo ?? []).join(' ') ||
      'Esta cuenta está bloqueada para actividades comerciales.'
    tonoEncabezado = 'grave'
  } else if (grave) {
    encabezado = `${grave.titulo}: ${grave.texto}`
    tonoEncabezado = grave.tono
  } else {
    encabezado = `${e.empresa} no tiene señales encendidas hoy. Aprovecha para trabajar crecimiento.`
    tonoEncabezado = 'bien'
  }

  return { encabezado, tonoEncabezado, lineas: L, pendientes }
}
