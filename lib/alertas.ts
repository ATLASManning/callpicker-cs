/**
 * lib/alertas.ts — ALERTAS DE CLIENTE
 *
 * Sustituye al concepto «Actividad SAC». No es un cambio de nombre: es un
 * cambio de sujeto. La actividad medía al ejecutivo —cuántas hizo—; la alerta
 * mide a la CUENTA —cuánto dinero está en riesgo y desde cuándo—.
 *
 * Instrucción de dirección, 6 oct 2026: «el objetivo debe ser evitar el churn
 * de las cuentas TOP… no medir cuántas hizo cada ejecutivo, sino conocer
 * cuántas alertas tiene, de qué cuentas, de qué tipo, el riesgo en dinero».
 *
 * ── LO QUE DECIDIÓ EL DISEÑO: 584 AVISOS SOBRE 192 CUENTAS ────────────────
 *
 * Medido antes de escribir una línea: con las doce señales candidatas, el 96%
 * de la cartera encendía algo. Un panel que marca en rojo 184 de 192 cuentas
 * no es una alarma, es ruido — y ya sabemos cómo termina: el Radar lleva 0 de
 * 192 completos y las auditorías dejaron 383 acciones que nadie siguió.
 *
 * Tres reglas salieron de ahí, y las tres están en el código:
 *
 *   1. CADA ALERTA TRAE SU ENLACE DE SOLUCIÓN. Una alerta que se cierra en dos
 *      minutos con un clic admite volumen; una que exige investigar, no. Por
 *      eso `enlace` es obligatorio en el tipo: no se puede declarar una alerta
 *      sin decir a dónde ir a resolverla.
 *   2. EL ID ES ESTABLE (`tipo:cuentaId`). La misma condición la semana que
 *      viene es la MISMA alerta envejeciendo, no una nueva. Sin eso no se
 *      puede decir «esta cuenta lleva 47 días en riesgo», que es la única
 *      forma de anticipar en vez de contar.
 *   3. EL ORDEN ES POR DINERO, no por fecha ni por tipo. `prioridad()` pesa
 *      severidad × MRR y empuja las TOP arriba.
 *
 * ── LA CEGUERA ES LA ALERTA MÁS GRAVE, NO LA MENOS ───────────────────────
 *
 * Instrucción explícita: «lo que mencionas de no tener información del cliente
 * debe ser aún mayor la alerta». Y los datos le dan la razón: de las 25
 * cuentas de mayor facturación, 18 NO aparecen en el archivo de cortes —
 * $858,762 de MRR del que no podemos ver un solo minuto de consumo. Una cuenta
 * que no se ve es peor que una que se ve caer: de la segunda sabemos que cae.
 */

export type Severidad = 'critica' | 'alta' | 'media' | 'oportunidad'

/** Las cuatro familias. Separarlas importa: piden trabajos distintos. */
export type Familia =
  | 'ceguera'      // no podemos VER la cuenta — se resuelve capturando
  | 'riesgo'       // el cliente se está yendo — se resuelve hablando
  | 'abandono'     // la soltamos nosotros — se resuelve trabajándola
  | 'oportunidad'  // hay dinero sobre la mesa

export type TipoAlerta =
  | 'sin_consumo_medible'
  | 'sin_radar'
  | 'sin_contactos'
  | 'sin_ficha'
  | 'caida_consumo'
  | 'desplome_consumo'
  | 'consumo_cero'
  | 'uso_bajo'
  | 'sin_interlocutor'
  | 'silencio_60'
  | 'silencio_30'
  | 'nunca_contactada'
  | 'asignada_sin_cerrar'
  | 'nunca_asignada'
  | 'rebasa_bolsa'

export interface DefinicionAlerta {
  tipo: TipoAlerta
  familia: Familia
  severidad: Severidad
  /** Qué pasa, en una frase que se entiende sin contexto. */
  titulo: string
  /** El guion: qué hacer. Es el «playbook» de Gainsight, en una línea. */
  accion: string
  /** Texto del botón que lleva a resolverla. */
  enlaceEtiqueta: string
  /** Ancla dentro de la ficha de cuenta, si la solución se captura ahí. */
  ancla?: string
}

/**
 * EL CATÁLOGO. Toda alerta nace de aquí, con su guion y su enlace.
 *
 * El orden del objeto no importa; el que manda es `PESO_SEVERIDAD`.
 */
export const CATALOGO: Record<TipoAlerta, DefinicionAlerta> = {
  // ── CEGUERA ────────────────────────────────────────────────────────────
  sin_consumo_medible: {
    tipo: 'sin_consumo_medible', familia: 'ceguera', severidad: 'critica',
    titulo: 'No podemos ver su consumo',
    accion: 'La cuenta no aparece en el archivo de cortes. Confirmar su CID y pedir '
          + 'a Ingeniería que la incluya: sin esto no hay forma de saber si usa el servicio.',
    enlaceEtiqueta: 'Abrir ficha y verificar CID',
  },
  sin_radar: {
    tipo: 'sin_radar', familia: 'ceguera', severidad: 'alta',
    titulo: 'Sin una sola respuesta de Radar',
    accion: 'Responder las 12 preguntas del Radar. Son cinco minutos y es lo que '
          + 'convierte la cuenta de una fila en un diagnóstico.',
    enlaceEtiqueta: 'Responder el Radar', ancla: 'radar',
  },
  sin_contactos: {
    tipo: 'sin_contactos', familia: 'ceguera', severidad: 'alta',
    titulo: 'Sin un solo contacto registrado',
    accion: 'Capturar al menos un contacto con nombre, cargo y teléfono. Si mañana '
          + 'esta cuenta llama a cancelar, hoy no sabemos a quién marcarle.',
    enlaceEtiqueta: 'Capturar contactos', ancla: 'contactos',
  },
  sin_ficha: {
    tipo: 'sin_ficha', familia: 'ceguera', severidad: 'media',
    titulo: 'Ficha sin observaciones del KAM',
    accion: 'Escribir qué sabemos de esta cuenta: para qué la usan, quién decide, qué les duele.',
    enlaceEtiqueta: 'Completar la ficha', ancla: 'ficha',
  },

  // ── RIESGO ─────────────────────────────────────────────────────────────
  caida_consumo: {
    tipo: 'caida_consumo', familia: 'riesgo', severidad: 'critica',
    titulo: 'Consumo cayendo tres meses seguidos',
    accion: 'Llamar y preguntar qué cambió en su operación. Una caída sostenida '
          + 'precede a la reducción de plan, no al revés.',
    enlaceEtiqueta: 'Ver la cuenta',
  },
  desplome_consumo: {
    tipo: 'desplome_consumo', familia: 'riesgo', severidad: 'critica',
    titulo: 'Desplome de consumo',
    accion: 'Contacto inmediato. Pasó de usar su plan a casi no usarlo: o cambió su '
          + 'operación o ya está usando otra cosa.',
    enlaceEtiqueta: 'Ver la cuenta',
  },
  /* Nace el 6 oct 2026 de una revisión de la redacción en producción. Ocho
   * cuentas salían como `uso_bajo` con la evidencia «nunca pasó del 0% de su
   * plan» — y entre ellas una TOP de $38,123 al mes. Cero no es «bajo»: una
   * cuenta que no consumió un minuto en cinco meses no está sub-aprovechando
   * el plan, está pagando por algo que ya no usa, y eso se cancela en la
   * siguiente revisión de gastos. Son $72,634 de MRR que estaban archivados
   * como severidad alta cuando son lo más crítico de la cartera. */
  consumo_cero: {
    tipo: 'consumo_cero', familia: 'riesgo', severidad: 'critica',
    titulo: 'Paga y no usa el servicio en absoluto',
    accion: 'Contacto inmediato con quien firma, no con el usuario operativo. Cero '
          + 'minutos en todo el periodo medido no es uso bajo: es un servicio que ya '
          + 'nadie ocupa y que se cae solo en la próxima revisión de gastos.',
    enlaceEtiqueta: 'Ver consumo y adopción', ancla: 'adopcion',
  },
  uso_bajo: {
    tipo: 'uso_bajo', familia: 'riesgo', severidad: 'alta',
    titulo: 'Paga mucho más de lo que usa',
    accion: 'Sesión de adopción: mostrar qué del plan no está usando. Es la cuenta '
          + 'que al apretarse el presupuesto pide bajar de plan.',
    enlaceEtiqueta: 'Ver adopción', ancla: 'adopcion',
  },
  /* EL CASO BIOLABORATORIO SADAT, 6 oct 2026. Esta alerta nace de una cuenta
   * concreta y conviene que se recuerde cuál.
   *
   * Cronología: el 4 de julio se descubre que Paulina, la contacto registrada,
   * ya no trabaja ahí. El 11 y el 17 de julio, dos intentos más sin respuesta.
   * El 25 de julio la propia asesora escribe en la ficha «alto riesgo de
   * descontinuación». El 6 de octubre el cliente llama para pedir la baja del
   * servicio de voz.
   *
   * Al 25 de julio llevaba CUATRO intentos fallidos seguidos, y eso ya estaba
   * en la base de datos. Nadie se lo dijo a nadie.
   *
   * POR QUÉ NO BASTABA `silencio_60`. Porque el silencio mide cuánto hace que
   * NOSOTROS no llamamos, y aquí sí se llamó: tres veces en tres semanas. Lo
   * que no hubo fue nadie del otro lado. Son dos problemas distintos y se
   * arreglan distinto: el silencio se resuelve marcando; esto se resuelve
   * BUSCANDO A OTRA PERSONA, porque el teléfono que tenemos ya no sirve.
   * Mientras se confundan, la cuenta que se queda sin interlocutor parece una
   * cuenta atendida. */
  sin_interlocutor: {
    tipo: 'sin_interlocutor', familia: 'riesgo', severidad: 'critica',
    titulo: 'Se llamó varias veces y no hay nadie del otro lado',
    accion: 'No es falta de seguimiento: es que ya no tenemos interlocutor. Buscar a '
          + 'otra persona por otra vía —el firmante de la factura, cobranza, el correo '
          + 'del dominio, LinkedIn— y actualizar el contacto. Una cuenta sin a quién '
          + 'marcarle se entera de que existimos el día que decide cancelar.',
    enlaceEtiqueta: 'Actualizar contactos', ancla: 'contactos',
  },
  silencio_60: {
    tipo: 'silencio_60', familia: 'riesgo', severidad: 'critica',
    titulo: 'Más de 60 días sin contacto',
    accion: 'Llamar. Dos meses de silencio en una cuenta viva es una relación que '
          + 'dejó de existir.',
    enlaceEtiqueta: 'Registrar seguimiento', ancla: 'seguimientos',
  },
  silencio_30: {
    tipo: 'silencio_30', familia: 'riesgo', severidad: 'media',
    titulo: 'Más de 30 días sin contacto',
    accion: 'Agendar contacto esta semana antes de que se vuelva silencio largo.',
    enlaceEtiqueta: 'Registrar seguimiento', ancla: 'seguimientos',
  },
  nunca_contactada: {
    tipo: 'nunca_contactada', familia: 'riesgo', severidad: 'critica',
    titulo: 'NUNCA se le ha dado un seguimiento',
    accion: 'Primer contacto. Es una cuenta que paga y con la que nadie ha hablado.',
    enlaceEtiqueta: 'Registrar el primer seguimiento', ancla: 'seguimientos',
  },

  // ── ABANDONO — es nuestro, no del cliente ──────────────────────────────
  asignada_sin_cerrar: {
    tipo: 'asignada_sin_cerrar', familia: 'abandono', severidad: 'critica',
    titulo: 'Asignada y sin un solo seguimiento cerrado',
    accion: 'Se le asignó trabajo y no se cerró ninguno. Cerrar o explicar por qué no.',
    enlaceEtiqueta: 'Ver la cuenta',
  },
  nunca_asignada: {
    tipo: 'nunca_asignada', familia: 'abandono', severidad: 'media',
    titulo: 'Nunca ha entrado a un lote de trabajo',
    accion: 'Entra al próximo lote. Una cuenta viva que nunca se trabajó es una '
          + 'cuenta que nadie está cuidando.',
    enlaceEtiqueta: 'Ver la cuenta',
  },

  // ── OPORTUNIDAD ────────────────────────────────────────────────────────
  rebasa_bolsa: {
    tipo: 'rebasa_bolsa', familia: 'oportunidad', severidad: 'oportunidad',
    titulo: 'Rebasa su bolsa de minutos',
    accion: 'Consume por encima de su plan y se le está cobrando el excedente. '
          + 'Proponer el plan que le corresponde antes de que lo note en la factura.',
    enlaceEtiqueta: 'Ver consumo',
  },
}

/** Para ordenar. La ceguera pesa como el riesgo: una cuenta que no se ve es peor. */
export const PESO_SEVERIDAD: Record<Severidad, number> = {
  critica: 1000, alta: 300, media: 80, oportunidad: 40,
}

export const ETIQUETA_SEVERIDAD: Record<Severidad, string> = {
  critica: 'Crítica', alta: 'Alta', media: 'Media', oportunidad: 'Oportunidad',
}

export const COLOR_SEVERIDAD: Record<Severidad, { fg: string; bg: string }> = {
  critica:     { fg: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  alta:        { fg: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  media:       { fg: '#CA8A04', bg: 'rgba(202,138,4,0.12)' },
  oportunidad: { fg: '#059669', bg: 'rgba(5,150,105,0.12)' },
}

export const ETIQUETA_FAMILIA: Record<Familia, string> = {
  ceguera: 'No la vemos', riesgo: 'Se está yendo',
  abandono: 'La soltamos', oportunidad: 'Oportunidad',
}

export interface Alerta {
  /** ESTABLE entre cortes: la misma condición mañana es esta misma alerta. */
  id: string
  tipo: TipoAlerta
  familia: Familia
  severidad: Severidad
  cuentaId: string
  consecutivo: string | null
  cid: string | null
  empresa: string
  asesor: string | null
  /** Facturación mensual de la cuenta: el dinero que está en juego. */
  mrr: number
  /** Entre las 25 de mayor facturación. */
  esTop: boolean
  titulo: string
  /** Por qué saltó, CON NÚMEROS. Sin esto la alerta no se puede defender. */
  evidencia: string
  accion: string
  enlace: string
  enlaceEtiqueta: string
  /** Días que lleva la condición, cuando se puede saber. */
  dias: number | null
  prioridad: number
}

/**
 * El orden del panel: severidad × dinero, con las TOP empujadas arriba.
 *
 * El dinero entra por raíz cuadrada a propósito. Con el MRR crudo, una cuenta
 * de $316,000 aplasta a treinta de $3,000 y el panel se vuelve la lista de las
 * cinco grandes; con la raíz, el dinero manda dentro de cada severidad sin
 * borrar al resto de la cartera.
 */
export function prioridad(severidad: Severidad, mrr: number, esTop: boolean): number {
  return Math.round(PESO_SEVERIDAD[severidad] * (1 + Math.sqrt(Math.max(mrr, 0)) / 50)
                    * (esTop ? 1.6 : 1))
}

export function construirAlerta(
  tipo: TipoAlerta,
  cuenta: { id: string; consecutivo?: string | null; cid?: string | null; empresa: string;
            asesor?: string | null; facturacion?: number | null },
  evidencia: string,
  esTop: boolean,
  dias: number | null = null,
): Alerta {
  const d = CATALOGO[tipo]
  const mrr = cuenta.facturacion ?? 0
  return {
    id: `${tipo}:${cuenta.id}`,
    tipo, familia: d.familia, severidad: d.severidad,
    cuentaId: cuenta.id,
    consecutivo: cuenta.consecutivo ?? null,
    cid: cuenta.cid ?? null,
    empresa: cuenta.empresa,
    asesor: cuenta.asesor ?? null,
    mrr, esTop,
    titulo: d.titulo,
    evidencia,
    accion: d.accion,
    // El enlace SIEMPRE lleva a donde se resuelve, con ancla cuando la hay.
    enlace: `/cuentas/${cuenta.id}${d.ancla ? '#' + d.ancla : ''}`,
    enlaceEtiqueta: d.enlaceEtiqueta,
    dias,
    prioridad: prioridad(d.severidad, mrr, esTop),
  }
}

/** Resumen para la cabecera del panel. Las particiones CIERRAN. */
export interface ResumenAlertas {
  total: number
  cuentas: number
  mrrEnRiesgo: number
  porSeveridad: Record<Severidad, { n: number; mrr: number }>
  porFamilia: Record<Familia, { n: number; mrr: number }>
  porAsesor: Record<string, { n: number; mrr: number; criticas: number; top: number }>
  topEnRiesgo: number
}

export function resumir(alertas: Alerta[]): ResumenAlertas {
  const vacio = () => ({ n: 0, mrr: 0 })
  const porSeveridad = {
    critica: vacio(), alta: vacio(), media: vacio(), oportunidad: vacio(),
  } as Record<Severidad, { n: number; mrr: number }>
  const porFamilia = {
    ceguera: vacio(), riesgo: vacio(), abandono: vacio(), oportunidad: vacio(),
  } as Record<Familia, { n: number; mrr: number }>
  const porAsesor: ResumenAlertas['porAsesor'] = {}

  /* El MRR se cuenta UNA VEZ POR CUENTA, no por alerta. Si una cuenta de
     $20,000 enciende cuatro alertas, el dinero en riesgo son $20,000 — no
     $80,000. Sumarlo por alerta inflaría la cifra justo en el número que
     dirección va a llevar a los fundadores. */
  const cuentasVistas = new Set<string>()
  const mrrPorCuenta = new Map<string, number>()
  for (const a of alertas) {
    cuentasVistas.add(a.cuentaId)
    mrrPorCuenta.set(a.cuentaId, a.mrr)
    porSeveridad[a.severidad].n++
    porFamilia[a.familia].n++
    const k = a.asesor || '(sin asesor)'
    porAsesor[k] ??= { n: 0, mrr: 0, criticas: 0, top: 0 }
    porAsesor[k].n++
    if (a.severidad === 'critica') porAsesor[k].criticas++
  }
  // Y el MRR por corte también por cuenta única, con la misma razón.
  const unicaPor = <T extends string>(sel: (a: Alerta) => T,
                                      destino: Record<string, { n: number; mrr: number }>) => {
    const visto = new Map<string, Set<string>>()
    for (const a of alertas) {
      const k = sel(a)
      const s = visto.get(k) ?? new Set<string>()
      if (!s.has(a.cuentaId)) { s.add(a.cuentaId); destino[k].mrr += a.mrr }
      visto.set(k, s)
    }
  }
  unicaPor(a => a.severidad, porSeveridad as Record<string, { n: number; mrr: number }>)
  unicaPor(a => a.familia, porFamilia as Record<string, { n: number; mrr: number }>)
  const vistoAsesor = new Map<string, Set<string>>()
  for (const a of alertas) {
    const k = a.asesor || '(sin asesor)'
    const s = vistoAsesor.get(k) ?? new Set<string>()
    if (!s.has(a.cuentaId)) {
      s.add(a.cuentaId)
      porAsesor[k].mrr += a.mrr
      if (a.esTop) porAsesor[k].top++
    }
    vistoAsesor.set(k, s)
  }

  let mrr = 0
  for (const v of mrrPorCuenta.values()) mrr += v
  const topEnRiesgo = new Set(alertas.filter(a => a.esTop).map(a => a.cuentaId)).size

  return {
    total: alertas.length, cuentas: cuentasVistas.size, mrrEnRiesgo: mrr,
    porSeveridad, porFamilia, porAsesor, topEnRiesgo,
  }
}
