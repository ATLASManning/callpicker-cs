/**
 * "Candidato a:" — a qué es candidata cada cuenta, con la evidencia que lo sostiene.
 *
 * Principio que pidió dirección: **entre más datos tiene una cuenta, mejor se
 * puede decir a qué es candidata.** Por eso cada resultado viaja con su nivel
 * de certeza y con cuántas señales lo sustentan. Una cuenta sin datos no
 * produce una recomendación floja: produce la instrucción de completarla.
 *
 * El objetivo no es vender: es **blindar la cuenta y prevenir el churn**. Por
 * eso la primera regla es que no se propone crecimiento sobre un problema sin
 * resolver — si hay fallas, deuda de adopción o la cuenta no se usa, lo que
 * corresponde es estabilizar o reactivar, no ofrecer más producto.
 *
 * Escalera de servicio (instrucción de dirección):
 *   Comunicación Empresarial ─► Visibilidad y Control
 *   Visibilidad y Control    ─► Callpicker Chat · Agentes Virtuales (IA de Voz)
 *                               · Integración API con CRM · Calltracking
 */

export type TipoCandidatura =
  | 'escalon'       // subir de familia de producto
  | 'cross_sell'    // agregar un producto complementario
  | 'ampliacion'    // más bolsa / más extensiones del mismo producto
  | 'blindaje'      // continuidad: proteger una cuenta sana y antigua
  | 'reactivacion'  // no la usan: recuperar el uso antes que cualquier venta
  | 'estabilizar'   // hay un problema abierto: primero se resuelve

export interface Candidatura {
  producto:      string
  tipo:          TipoCandidatura
  /** Por qué esta cuenta y no otra. Siempre anclado a un dato observado. */
  razon:         string
  /** Qué gana el cliente. Concreto, no folleto. */
  ventajas:      string[]
  siguientePaso: string
  /** Orden de presentación: menor = más urgente/valioso. */
  prioridad:     number
  /** Toca condiciones comerciales: exige VoBo de Dirección General. */
  requiereVoBo?: boolean
}

export interface EntradaCandidatura {
  id: string
  consecutivo: string
  empresa: string
  asesor: string | null
  estado: string | null
  facturacion: number
  healthScore: number | null
  activoDesde: string | null
  diasSinContacto: number | null
  giro: string | null
  numOficinas: string | null
  tieneContacto: boolean
  faltantesCount: number
  ticketsTotal: number
  ticketsFallas: number
  /** Del export de Zoho (solo cerrados): estructuralmente 0. No decide solo. */
  ticketsAbiertos: number
  /** Fuera de SLA en el último corte de la mesa de ayuda. Ésta sí se mide. */
  ticketsVencidos?: number
  peorDiasSLA?: number | null
  /** Del último corte de facturación. */
  plan: string | null
  /** Promedio de % de consumo de los últimos 3 cortes. */
  consumoPct: number | null
  /** Caída porcentual del consumo reciente contra su propia media histórica. */
  caidaConsumo: number | null
  /** Promedio de visitas a secciones del panel en los últimos cortes. */
  panelPromedio: number | null
  /** Nivel por producto, del módulo de Adopción. */
  adopcion: Record<string, string>

  /* ── Señales MEDIDAS (21 sep 2026) ────────────────────────────────────
   * Antes de éstas, el Asistente Virtual se justificaba con «parte de ese
   * volumen es repetitivo» y el Chat con «hoy el cliente final escribe tanto
   * como llama»: frases que valen para cualquier cuenta y por tanto no
   * sostienen ninguna. Éstas son del propio cliente.
   * Todas son `null` cuando no hay lectura — y `null` NO es cero. */

  /** Total de llamadas entrantes en la ventana medida. */
  entrantes: number | null
  /** De ésas, las que ninguna extensión contestó. */
  sinContestar: number | null
  pctSinContestar: number | null
  /** % que el menú resolvió sin agente. NO es un fallo: ya automatiza. */
  pctMenu: number | null
  /** El periodo que cubre la lectura, para poder declararlo. */
  ventanaLlamadas: string | null

  /** Visitas a la sección DESARROLLADORES del panel. La señal de API. */
  visitasDesarrolladores: number | null
  /** Extensiones declaradas en el nombre del plan. */
  extensiones: number | null
  /** Minutos consumidos ÷ extensiones. La referencia del plan IL es 1,500. */
  minPorExtension: number | null

  /** Números (DIDs) que tiene contratados. */
  dids: number | null
  /** De ésos, los que traen etiqueta de canal digital en el propio panel. */
  didsDigital: number | null
  /** Y los que siguen con la etiqueta por defecto, sin asignar. */
  didsLibres: number | null
}

export interface ResultadoCandidato {
  id: string
  consecutivo: string
  empresa: string
  asesor: string | null
  facturacion: number
  antiguedadMeses: number | null
  candidaturas: Candidatura[]
  /** Cuántas de las señales posibles tiene esta cuenta. */
  senales: number
  senalesTotales: number
  certeza: 'alta' | 'media' | 'baja'
  /** Cuando no hay con qué concluir, se dice — no se recomienda a ciegas. */
  motivoSinRecomendacion?: string
}

const RX_CE  = /comunicaci[oó]n\s+empresarial/i
const RX_VYC = /visibilidad\s+y\s+control/i
const RX_AV  = /(^|\s)av[\s.]|\(av\s+ia\)|agentes?\s+virtual/i
const RX_CHAT = /cp\s*chat|callpicker\s+chat|agentes?\s+cp\s+chat/i
const RX_API  = /minutos\s+api|whatsapp\s+api/i
const RX_CALLTRACKING = /calltracking/i

/**
 * Giros donde el rastreo de campañas rinde de inmediato.
 *
 * OJO: es un MODULADOR, nunca un disparador. El reporte de crecimiento del 17
 * de septiembre concluyó, cuenta por cuenta, que «WhatsApp y las integraciones
 * se están deduciendo del sector y no del registro». Y el campo tampoco
 * agrupa: 189 cuentas con valor escrito de 183 formas distintas. Solo entra
 * acompañado de una señal medida.
 */
const RX_GIRO_CAMPANAS = /marketing|publicidad|inmobili|automotr|educa|turismo|viaje|seguros|credito|financ/i

/** % de entrantes sin contestar desde el que se propone un Asistente Virtual. */
const PCT_SIN_CONTESTAR = 20
/** Por encima de esto, la cuenta YA automatiza: la conversación es otra. */
const PCT_MENU_ALTO = 50

const fmt = (n: number) => n.toLocaleString('es-MX')

const SENALES_TOTALES = 12

function mesesDesde(fecha: string | null): number | null {
  if (!fecha) return null
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return null
  return Math.max(0, Math.round((Date.now() - d.getTime()) / (30 * 86400000)))
}

function contarSenales(c: EntradaCandidatura): number {
  let n = 0
  if (c.plan)                          n++
  if (c.consumoPct !== null)           n++
  if (c.panelPromedio !== null)        n++
  if (Object.keys(c.adopcion).length)  n++
  if (c.ticketsTotal > 0)              n++
  if (c.activoDesde)                   n++
  if (c.tieneContacto)                 n++
  if (c.giro)                          n++
  if (c.numOficinas)                   n++
  /* Las tres medidas. Se cuentan aparte porque son las que de verdad suben la
     certeza: una cuenta con lectura de llamadas admite una recomendación que
     una sin ella no admite. */
  if (c.pctSinContestar !== null)      n++
  if (c.dids !== null)                 n++
  if (c.extensiones !== null)          n++
  return n
}

const extraeEntero = (s: string | null): number | null => {
  const m = String(s ?? '').match(/\d[\d,]*/)
  if (!m) return null
  const n = parseInt(m[0].replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

/**
 * Determina a qué es candidata una cuenta.
 * Devuelve las candidaturas ordenadas: primero lo que hay que resolver, después
 * lo que se puede crecer.
 */
export function evaluarCandidato(c: EntradaCandidatura): ResultadoCandidato {
  const senales = contarSenales(c)
  const meses   = mesesDesde(c.activoDesde)
  const base = {
    id: c.id, consecutivo: c.consecutivo, empresa: c.empresa,
    asesor: c.asesor, facturacion: c.facturacion,
    antiguedadMeses: meses, senales, senalesTotales: SENALES_TOTALES,
    certeza: (senales >= 7 ? 'alta' : senales >= 4 ? 'media' : 'baja') as 'alta' | 'media' | 'baja',
  }

  const out: Candidatura[] = []
  const plan = c.plan ?? ''
  const consumo = c.consumoPct
  const panel   = c.panelPromedio
  const sitios  = extraeEntero(c.numOficinas) ?? 0

  /* ── 0. Bloqueos: nunca se propone crecimiento sobre un problema abierto ── */

  if (c.estado === 'cancelado' || c.estado === 'hibernacion') {
    out.push({
      producto: 'Reactivación de la cuenta', tipo: 'reactivacion', prioridad: 0,
      razon: `La cuenta está en estado "${c.estado}". Cualquier propuesta comercial es prematura.`,
      ventajas: ['Recuperar el ingreso perdido es más barato que conseguir una cuenta nueva'],
      siguientePaso: 'Validar si la empresa sigue operando y quién quedó como responsable antes de cualquier acercamiento.',
    })
    return { ...base, candidaturas: out }
  }

  if (!c.tieneContacto) {
    out.push({
      producto: 'Recuperar contactabilidad', tipo: 'estabilizar', prioridad: 0,
      razon: 'No hay correo ni teléfono localizable del responsable: no hay a quién proponerle nada.',
      ventajas: ['Sin canal de contacto, una baja se entera cuando ya ocurrió'],
      siguientePaso: 'Ubicar al responsable actual por el conmutador o por el sitio de la empresa, y registrar correo y teléfono directos.',
    })
  }

  // `ticketsAbiertos` sale del export de Zoho, que solo trae cerrados: valía 0
  // en toda la cartera, así que esta regla se apoyaba solo en su segunda mitad.
  // Los vencidos vienen del corte de la mesa de ayuda, que sí mide el presente.
  const vencidos = c.ticketsVencidos ?? 0
  const problemaAbierto = vencidos > 0 || c.ticketsAbiertos > 0
    || (c.ticketsFallas >= 2 && (c.healthScore ?? 100) < 60)
  if (problemaAbierto) {
    const evidencia = vencidos > 0
      ? `${vencidos} ticket(s) FUERA DE SLA` +
        (c.peorDiasSLA ? ` (el peor con ${c.peorDiasSLA} días de atraso)` : '') +
        ` y ${c.ticketsFallas} falla(s) registradas`
      : `${c.ticketsFallas} falla(s) registradas y Health Score bajo`
    out.push({
      producto: 'Estabilizar antes de proponer', tipo: 'estabilizar', prioridad: 1,
      razon: `${evidencia}. Proponer producto sobre una incidencia sin cerrar deteriora la relación.`,
      ventajas: ['Resolver la fricción es el argumento de retención más fuerte que existe'],
      siguientePaso: 'Cerrar el ciclo de las incidencias con el cliente y confirmar que la operación quedó estable.',
    })
  }

  /* ── 1. No usan el servicio: reactivación con contrapartida ─────────────── */

  const sinUso = (consumo !== null && consumo < 10) || (panel !== null && panel === 0)
  if (sinUso && !problemaAbierto) {
    const detalle = [
      consumo !== null ? `consumo de ${consumo.toFixed(1)}% de la bolsa contratada` : null,
      panel === 0 ? 'cero entradas al panel administrador' : null,
      c.caidaConsumo && c.caidaConsumo >= 50 ? `caída de ${c.caidaConsumo.toFixed(0)}% contra su propia media` : null,
    ].filter(Boolean).join(', ')
    out.push({
      producto: 'Plan de reactivación y blindaje', tipo: 'reactivacion', prioridad: 1,
      razon: `Paga por un servicio que no está usando: ${detalle}. Es la antesala de una baja.`,
      ventajas: [
        'Recuperar el uso antes de que el cliente concluya que no lo necesita',
        'Una capacitación o una sesión de configuración cuesta menos que perder la cuenta',
        'Si el uso no se recupera, la conversación de continuidad llega con evidencia y no con improvisación',
      ],
      siguientePaso:
        'Sesión de diagnóstico con el administrador: entender si migraron la operación, si les faltó capacitación ' +
        'o si el servicio quedó mal configurado. Evaluar internamente incluir capacitación o un módulo adicional ' +
        'dentro de un acuerdo de permanencia de 12 a 24 meses.',
      requiereVoBo: true,
    })
  }

  /* ── 2. Escalón de producto ─────────────────────────────────────────────── */

  const usaBien = consumo !== null && consumo >= 30 && !sinUso

  if (RX_CE.test(plan) && !RX_VYC.test(plan) && usaBien) {
    out.push({
      producto: 'Visibilidad y Control', tipo: 'escalon', prioridad: 2,
      razon: `Opera con "${plan}" y consume ${consumo!.toFixed(0)}% de su bolsa: usa la telefonía de verdad, ` +
             `pero sin trazabilidad de lo que ocurre en cada llamada.`,
      ventajas: [
        'Grabación de llamadas: evidencia ante una queja, un acuerdo o una auditoría',
        'Tablero de monitoreo en vivo: quién contesta, quién no, y en cuánto tiempo',
        'Reportes por agente y por número: el dato deja de ser una percepción',
        'Historial completo para resolver disputas con clientes finales',
      ],
      siguientePaso:
        'Mostrar el tablero con sus propios números del último corte y preguntar qué decisión tomaría ' +
        'si tuviera esa información cada semana.',
    })
  }

  if (RX_VYC.test(plan) && usaBien) {
    /* Chat: solo con evidencia REGISTRADA en sus propios números. Etiquetas
       como «WhatsApp», «Campaña» o «Landing» las escribió el cliente en su
       panel; eso es un hecho suyo, no una generalidad del mercado. */
    if (!RX_CHAT.test(plan) && c.adopcion['Callpicker Chat'] !== 'alto' && (c.didsDigital ?? 0) > 0) {
      out.push({
        producto: 'Callpicker Chat', tipo: 'cross_sell', prioridad: 3,
        razon: `De sus ${c.dids} números, ${c.didsDigital} están etiquetados como canal digital en su ` +
               `propio panel: ya operan campañas y mensajería, hoy por fuera de Callpicker.`,
        ventajas: [
          'WhatsApp, webchat y redes en la misma bandeja que la telefonía',
          'Un solo historial por cliente, sin importar por dónde llegó',
          'Los mismos agentes atienden más consultas sin aumentar plantilla',
        ],
        siguientePaso: 'Preguntar cuántas consultas les llegan hoy por WhatsApp personal de los agentes y quién las responde.',
      })
    }
    /* Asistente Virtual: lo decide cuánto NO se contesta, no cuánto entra.
       Por debajo del umbral no se propone, y sin lectura tampoco: no medir
       no es medir cero. */
    if (!RX_AV.test(plan) && c.adopcion['IA de Voz'] !== 'alto'
        && c.pctSinContestar !== null && c.pctSinContestar >= PCT_SIN_CONTESTAR) {
      const yaAutomatiza = (c.pctMenu ?? 0) >= PCT_MENU_ALTO
      out.push({
        producto: 'Agentes Virtuales (IA de Voz)', tipo: 'cross_sell', prioridad: 2,
        razon: `${fmt(c.sinContestar!)} de sus ${fmt(c.entrantes!)} llamadas entrantes se quedaron sin ` +
               `contestar (${c.pctSinContestar.toFixed(0)}%) entre ${c.ventanaLlamadas}. Eso es negocio que ` +
               `llegó y nadie atendió.` +
               (yaAutomatiza
                 ? ` Ya resuelve el ${c.pctMenu!.toFixed(0)}% por menú: la conversación es ampliar lo que ya automatiza.`
                 : ''),
        ventajas: [
          'Atención fuera de horario sin contratar turnos',
          'Filtrado y clasificación antes de llegar al agente',
          'Las llamadas repetitivas dejan de consumir tiempo del equipo',
        ],
        siguientePaso: `Mostrarle esas ${fmt(c.sinContestar!)} llamadas y preguntar qué pasa con un cliente ` +
                       `que llama y no obtiene respuesta.`,
      })
    }
    /* API: la señal es haber entrado a la sección Desarrolladores del panel.
       Límite conocido y heredado del reporte V4: una a tres visitas no son un
       proyecto, son una pregunta pendiente. Abre la conversación, no la cierra. */
    if (!RX_API.test(plan) && c.adopcion['Integración API'] !== 'alto'
        && (c.visitasDesarrolladores ?? 0) > 0) {
      out.push({
        producto: 'Integración API con CRM', tipo: 'cross_sell', prioridad: 4,
        razon: `Entró ${c.visitasDesarrolladores} vez(ces) a la sección Desarrolladores del panel: ` +
               `hay interés técnico registrado. La información de llamadas sigue viviendo separada de su CRM.`,
        ventajas: [
          'La llamada queda registrada en el expediente del cliente sin captura manual',
          'Marcación desde el CRM: menos errores y menos tiempo por contacto',
          'Reportes que cruzan actividad telefónica con resultado comercial',
        ],
        siguientePaso: 'Confirmar qué CRM usan y quién lo administra; validar la integración disponible antes de proponer.',
      })
    }
  }

  /* ── 3. Ampliación por consumo ──────────────────────────────────────────── */

  if (consumo !== null && consumo >= 85) {
    out.push({
      producto: 'Ampliación de bolsa o plan superior', tipo: 'ampliacion', prioridad: 2,
      razon: `Consume ${consumo.toFixed(0)}% de su bolsa. El sobreconsumo se factura aparte y a peor tarifa.`,
      ventajas: [
        'Costo por minuto menor al del excedente',
        'Previsibilidad de la factura mensual',
        'Capacidad de crecer sin renegociar cada mes',
      ],
      siguientePaso: 'Mostrar los últimos cortes con el excedente facturado y comparar contra el plan superior.',
    })
  }

  /* ── 4. Red multi-sitio ─────────────────────────────────────────────────── */

  if (sitios >= 3 && !sinUso) {
    out.push({
      producto: 'Calltracking por sucursal', tipo: 'cross_sell', prioridad: 4,
      razon: `Opera ${sitios} ubicaciones. Hoy no se puede saber qué sede genera qué demanda.`,
      ventajas: [
        'Un número rastreable por sede o por campaña',
        'Comparativo de desempeño entre ubicaciones',
        'Atribución real de dónde viene cada cliente',
      ],
      siguientePaso: 'Preguntar cómo miden hoy qué sucursal recibe más contactos y con qué dato lo deciden.',
    })
  } else if ((c.didsDigital ?? 0) > 0 && sitios >= 3) {
    /* El giro ya NO dispara solo. Hace falta evidencia registrada —números
       etiquetados como campaña o canal digital en su propio panel— y el giro
       queda como contexto de la frase, que es para lo que sirve. */
    const ctx = RX_GIRO_CAMPANAS.test(String(c.giro ?? '')) ? ` Su giro, "${c.giro}", vive de eso.` : ''
    out.push({
      producto: 'Calltracking de campañas', tipo: 'cross_sell', prioridad: 5,
      razon: `${c.didsDigital} de sus ${c.dids} números están etiquetados como campaña o canal digital, ` +
             `repartidos en ${sitios} ubicaciones: ya invierten en generar demanda.${ctx}`,
      ventajas: ['Atribución por campaña', 'Presupuesto de marketing defendible con datos'],
      siguientePaso: 'Validar si tienen campañas activas y quién decide el presupuesto de marketing.',
    })
  }

  /* Números que se pagan y nadie asignó. No es una venta: es dinero visible en
     la primera llamada, y abre la conversación sin pedir presupuesto.
     Indicio, no prueba: la etiqueta dice que nadie lo nombró en el panel, no
     que el número no timbre — eso necesitaría cruzar con llamadas, y el export
     de DIDs no trae todavía la columna que lo permite. */
  const pctLibres = (c.dids ?? 0) > 0 ? (100 * (c.didsLibres ?? 0)) / c.dids! : 0
  // Piso absoluto de 3 Y además que pese: la mitad de sus números, o cinco.
  // Tres sueltos de cien no sostienen una llamada al cliente, y un aviso que
  // no aguanta la llamada se vuelve ruido que el asesor aprende a ignorar.
  if ((c.didsLibres ?? 0) >= 3 && (pctLibres >= 50 || (c.didsLibres ?? 0) >= 5)) {
    const pct = pctLibres
    out.push({
      producto: 'Revisar números sin asignar', tipo: 'estabilizar', prioridad: 2,
      razon: `Paga ${c.didsLibres} de sus ${c.dids} números sin asignar (${pct.toFixed(0)}%): ` +
             `siguen con la etiqueta por defecto en su panel.`,
      ventajas: [
        'O se asignan a una sede, campaña o área, o se liberan del cobro',
        'Es una conversación de servicio, no de venta: construye credibilidad',
      ],
      siguientePaso: 'Llevarle la lista de esos números y decidir con él cuáles usa y cuáles suelta.',
    })
  }

  /* ── 5. Antigüedad: onboarding o blindaje ───────────────────────────────── */

  if (meses !== null && meses < 6) {
    out.push({
      producto: 'Consolidar la adopción inicial', tipo: 'estabilizar', prioridad: 2,
      razon: `Lleva ${meses} mes(es) con Callpicker. El valor todavía no está demostrado; vender más ahora es prematuro.`,
      ventajas: ['Los primeros meses definen si la cuenta se queda años o se va en el primero'],
      siguientePaso: 'Revisar que la configuración inicial esté completa y que el equipo sepa usar lo que ya contrató.',
    })
  } else if (meses !== null && meses >= 24 && usaBien && !problemaAbierto) {
    out.push({
      producto: 'Continuidad con plazo (blindaje)', tipo: 'blindaje', prioridad: 3,
      razon: `${Math.floor(meses / 12)} años como cliente con ${consumo!.toFixed(0)}% de consumo. ` +
             `El 40% del churn ocurre en cuentas de más de 24 meses: la antigüedad no protege sola.`,
      ventajas: [
        'Previsibilidad para el cliente y para Callpicker',
        'Consolidar el valor acumulado antes de que alguien lo cuestione',
        'Espacio para incluir mejoras que hoy no tiene',
      ],
      siguientePaso:
        'Preparar internamente un Plan de Continuidad de 12 a 24 meses con el valor entregado documentado. ' +
        'Cualquier ajuste comercial se evalúa internamente y requiere VoBo previo de Dirección General: ' +
        'no se presenta al cliente como condición aprobada.',
      requiereVoBo: true,
    })
  }

  /* ── Sin datos suficientes: se dice, no se inventa ──────────────────────── */

  if (!out.length) {
    const falta = [
      !c.plan ? 'plan contratado' : null,
      consumo === null ? 'consumo de la bolsa' : null,
      !Object.keys(c.adopcion).length ? 'evaluación de adopción' : null,
      !c.activoDesde ? 'antigüedad' : null,
    ].filter(Boolean)
    return {
      ...base, candidaturas: [],
      motivoSinRecomendacion:
        falta.length
          ? `No hay evidencia suficiente para concluir. Falta: ${falta.join(', ')}.`
          : 'La cuenta opera de forma estable y no muestra una necesidad verificable en este corte.',
    }
  }

  out.sort((a, b) => a.prioridad - b.prioridad)
  return { ...base, candidaturas: out }
}

/** Etiquetas y color por tipo, para la interfaz. */
export const TIPO_CFG: Record<TipoCandidatura, { label: string; color: string }> = {
  escalon:      { label: 'Escalón de producto', color: '#22C55E' },
  cross_sell:   { label: 'Cross-sell',          color: '#0EA5E9' },
  ampliacion:   { label: 'Ampliación',          color: '#A855F7' },
  blindaje:     { label: 'Blindaje',            color: '#0057FF' },
  reactivacion: { label: 'Reactivación',        color: '#F59E0B' },
  estabilizar:  { label: 'Estabilizar primero', color: '#F87171' },
}
