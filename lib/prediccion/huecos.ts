/**
 * lib/prediccion/huecos.ts — UN HUECO DE DATOS NO ES UN «NO MEDIBLE»: ES UNA TAREA
 *
 * Instrucción de dirección, 7 oct 2026, textual: «SI NO HAY INFORMACIÓN ES TAREA
 * O ACTIVIDAD O PARA EL ASESOR O PARA DANIEL MARTÍNEZ».
 *
 * Hasta hoy, cuando faltaba un dato el tablero escribía «no medible» y ahí
 * acababa. Es honesto y es insuficiente: nadie queda a cargo de conseguirlo, así
 * que el hueco sobrevive al informe que lo denunció. Las 46 cuentas sin corte de
 * facturación llevan meses así, y son $772,557 de MRR sin medición de consumo.
 *
 * ── LA REGLA DE RUTEO, Y POR QUÉ SON DOS DUEÑOS Y NO TRES ──────────────────
 *
 * La pregunta que decide el dueño es una sola: **¿alguien puede conseguir este
 * dato sin que la plataforma cambie?**
 *
 *   · SÍ  → `asesor`. Lo pide al cliente, o pide un export que ya existe.
 *   · NO  → `direccion`. Hace falta que la plataforma exponga algo que hoy no
 *           entrega, y eso se le pide a Daniel Martínez.
 *
 * El catálogo de alertas tiene tres dueños (`asesor | ingenieria | direccion`)
 * porque ahí sí hay trabajo técnico interno. Aquí no: un hueco de dato o lo
 * levanta quien habla con el cliente, o lo abre quien puede cambiar el producto.
 *
 * ── EL ALCANCE, QUE EVITA 192 TAREAS IDÉNTICAS ─────────────────────────────
 *
 * `alcance: 'cuenta'` genera una tarea POR CUENTA: el NPS de Tech People es una
 * conversación distinta de la de Sección Amarilla.
 *
 * `alcance: 'cartera'` genera UNA sola tarea, con el dinero que ciega pegado.
 * El tiempo de timbrado no existe para ninguna de las 192, y abrir 192 tareas
 * para pedir una vez lo mismo no es rigor: es ruido, y el ruido se ignora. Es la
 * misma razón por la que el aviso de archivo vencido de llamadas está en 200
 * días y no en 45 — un aviso que grita todo el tiempo enseña a no mirarlo.
 */

/** Quién lo consigue. Ver la regla de ruteo arriba. */
export type DuenoHueco = 'asesor' | 'direccion'

/** Una tarea por cuenta, o una sola para toda la cartera. */
export type AlcanceHueco = 'cuenta' | 'cartera'

export type ClaveHueco =
  // Lo que el asesor puede conseguir
  | 'sin_consumo'
  | 'sin_llamadas'
  | 'sin_nps'
  | 'sin_rol_contacto'
  | 'sin_correo'
  | 'sin_segundo_contacto'
  | 'sin_obs_kam'
  | 'sin_giro'
  | 'sin_importe'
  // Lo que sólo puede resolver la plataforma
  | 'sin_timbrado'
  | 'tickets_abiertos'
  | 'sin_uso_por_usuario'
  | 'sin_grabacion'
  | 'fuera_del_panel'

export interface DefinicionHueco {
  dueno: DuenoHueco
  alcance: AlcanceHueco
  /** Lo que se le pide, en imperativo y en una línea. Es el título de la tarea. */
  pedir: string
  /** Por qué importa. Va en el cuerpo: una tarea sin motivo se archiva. */
  porque: string
  /** A quién se le pregunta o dónde se consigue. */
  donde: string
  /** Qué queda bloqueado mientras falte. Lo que da prioridad. */
  bloquea: string
}

export const HUECOS: Record<ClaveHueco, DefinicionHueco> = {
  /* ── DEL ASESOR ──────────────────────────────────────────────────────── */

  sin_consumo: {
    dueno: 'asesor', alcance: 'cuenta',
    pedir: 'Pedir el Excel de llamadas entrantes y salientes de los últimos 3 a 6 meses',
    porque: 'Esta cuenta no aparece en el Informe de Cortes, así que su consumo '
          + 'no se mide: ni minutos, ni % de bolsa, ni tendencia. Son 46 cuentas '
          + 'y $772,557 de MRR, y el hueco está sesgado hacia las grandes.',
    donde: 'El export por cuenta y periodo. Tiene que incluir la columna '
         + '`destination_data_1`, o se pierde el análisis de a dónde entraron '
         + 'las llamadas, que es lo más útil del informe.',
    bloquea: 'El consumo pesa 25% del riesgo, es la familia con más historia '
           + '(once meses) y es la única vía que fecha una baja.',
  },

  sin_llamadas: {
    dueno: 'asesor', alcance: 'cuenta',
    pedir: 'Pedir el Excel de llamadas de los últimos 3 a 6 meses',
    porque: 'No hay ninguna lectura de llamadas de esta cuenta, así que no se '
          + 'sabe si contesta, si pierde llamadas ni en qué horario.',
    donde: 'El mismo export que `sin_consumo`: una sola petición cubre los dos.',
    bloquea: 'Sin llamadas no hay Informe de Valor: los bloques 1, 2 y 3 son '
           + 'justamente eso.',
  },

  sin_nps: {
    dueno: 'asesor', alcance: 'cuenta',
    pedir: 'Levantar el NPS en la próxima llamada: «del 1 al 10, qué tan '
         + 'probable es que recomienden Callpicker», y la razón de su número',
    porque: 'El NPS está vacío en las 192 cuentas vivas. No es que salga mal: '
          + 'nunca se ha preguntado.',
    donde: 'Al contacto con el que ya se habla. La razón del número vale más que '
         + 'el número.',
    bloquea: 'Toda la lectura de lealtad, y el evento «pasar a detractor» que '
           + 'dirección quiere predecir.',
  },

  sin_rol_contacto: {
    dueno: 'asesor', alcance: 'cuenta',
    pedir: 'Marcar quién DECIDE y quién OPERA entre los contactos de la cuenta',
    porque: 'Se sabe el nombre y el cargo, pero no quién firma y quién usa el '
          + 'servicio. Son dos lealtades distintas, y la baja llega cuando el '
          + 'que opera está harto y el que firma no lo sabe.',
    donde: 'El asesor ya lo sabe de trato; falta registrarlo.',
    bloquea: 'La brecha Decisor–Operativo. Hoy sólo 70 de 192 cuentas tienen '
           + 'dos o más contactos, así que ni con el rol llegaría a toda la '
           + 'cartera.',
  },

  sin_correo: {
    dueno: 'asesor', alcance: 'cuenta',
    pedir: 'Conseguir el correo directo del contacto principal',
    porque: 'Sólo el 58.3% de las cuentas vivas tiene correo. Es el canal por el '
          + 'que viaja una encuesta y por el que llega un informe.',
    donde: 'Al contacto, en la próxima conversación.',
    bloquea: 'La encuesta de NPS alcanza como máximo a 112 de 192 cuentas.',
  },

  sin_segundo_contacto: {
    dueno: 'asesor', alcance: 'cuenta',
    pedir: 'Levantar un segundo contacto: nombre, cargo, teléfono y correo',
    porque: '90 de 192 cuentas vivas no tienen ni un contacto además del '
          + 'principal. Si esa persona se va, la cuenta se queda sin puerta.',
    donde: 'Al contacto actual: «¿quién más participa en las decisiones sobre '
         + 'la herramienta?»',
    bloquea: 'El mapa de decisores, y cualquier lectura por rol.',
  },

  sin_obs_kam: {
    dueno: 'asesor', alcance: 'cuenta',
    pedir: 'Escribir las observaciones de la cuenta: compromisos vigentes, '
         + 'situaciones especiales, riesgos',
    porque: 'La capa cualitativa LEE ese texto, y es lo que detectó el caso de '
          + 'Biolaboratorio Sadat 73 días antes de la baja. Donde nadie escribe, '
          + 'no hay nada que leer.',
    donde: 'El asesor, de lo que ya sabe.',
    bloquea: 'La única fuente de señal cualitativa que existe hoy. Encuentra '
           + 'riesgo escrito en 6 de 192 cuentas — no porque el resto esté bien, '
           + 'sino porque nadie lo escribió.',
  },

  sin_giro: {
    dueno: 'asesor', alcance: 'cuenta',
    pedir: 'Registrar a qué se dedica la empresa',
    porque: 'Diez cuentas vivas no tienen giro.',
    donde: 'Al contacto, o del sitio web de la empresa.',
    bloquea: 'El comparativo contra cuentas parecidas en el Informe de Valor.',
  },

  sin_importe: {
    dueno: 'asesor', alcance: 'cuenta',
    pedir: 'Confirmar cuánto factura esta cuenta al mes',
    porque: 'No tiene importe en NINGUNA fuente: ni en el Gross Revenue por CID '
          + 'ni en la columna de la cartera. Son diez cuentas vivas.',
    donde: 'Con facturación, o con el CID correcto si el que está es el '
         + 'equivocado.',
    bloquea: 'Todo. Sin importe la cuenta no se puede priorizar, no entra en '
           + 'ninguna suma y no se puede decir qué dinero está en riesgo.',
  },

  /* ── DE LA PLATAFORMA: para Daniel Martínez ──────────────────────────── */

  sin_timbrado: {
    dueno: 'direccion', alcance: 'cartera',
    pedir: 'Pedir a plataforma el TIEMPO DE TIMBRADO por llamada: cuánto sonó '
         + 'antes de que la tomaran o se perdiera',
    porque: 'Los minutos de conversación sí vienen (`total_minutes`, 2.49 por '
          + 'llamada atendida). Lo que no existe en ninguna capa es cuánto '
          + 'esperó el cliente. Las de salientes traen `start_time`/`end_time`; '
          + 'las de ENTRANTES no.',
    donde: 'Daniel Martínez → equipo de plataforma.',
    bloquea: 'El tiempo de espera y el abandono, que es la mitad de la pregunta '
           + 'de eficiencia que pidió dirección: «que la misma eficiencia que '
           + 'ibas teniendo la estés perdiendo».',
  },

  tickets_abiertos: {
    dueno: 'direccion', alcance: 'cartera',
    pedir: 'Pedir que el reporte de Zoho Desk incluya los tickets ABIERTOS, con '
         + 'su fecha de apertura y su antigüedad',
    porque: 'El export está filtrado a cerrados: 6,326 de 6,328 filas traen '
          + 'fecha de cierre. Así que «0 abiertos» no es un cero, es ceguera.',
    donde: 'Daniel Martínez → mesa de ayuda.',
    bloquea: 'Un cliente que lleva tres semanas esperando se ve hoy igual que '
           + 'uno sin incidencias. Es el único hueco donde no tenemos nada en su '
           + 'lugar.',
  },

  sin_uso_por_usuario: {
    dueno: 'direccion', alcance: 'cartera',
    pedir: 'Pedir cuántas extensiones o usuarios estuvieron ACTIVOS en el mes, y '
         + 'cuántos no se conectaron nunca',
    porque: 'Se sabe qué contrató cada cuenta y cuántos números tiene (2,777 en '
          + '183 cuentas vivas), pero no cuántos se usan.',
    donde: 'Daniel Martínez → plataforma. Probablemente el dato ya está dentro '
         + '(quién inició sesión, qué extensión registró actividad) y es '
         + 'cuestión de exponerlo, no de construirlo. Conviene preguntarlo así.',
    bloquea: 'La señal de churn más temprana que existe: una cuenta que contrató '
           + '13 extensiones y ocupa 2 se va a ir, y hoy se ve idéntica a una '
           + 'que ocupa 13.',
  },

  sin_grabacion: {
    dueno: 'direccion', alcance: 'cartera',
    pedir: 'Abrir la conversación por grabación o transcripción de llamadas, con '
         + 'el consentimiento que corresponda',
    porque: 'Dirección pide que la IA lea lo cualitativo, y la fuente más rica '
          + '—lo que el cliente dice en la llamada— no existe para nosotros. El '
          + 'sustituto es la prosa del asesor, que cubre 6 de 192 cuentas.',
    donde: 'Daniel Martínez, con el visto bueno legal.',
    bloquea: 'Es el hueco que explica a los demás. Pero necesita consentimiento, '
           + 'criterio legal, almacenamiento y una canalización de IA, así que '
           + 'NO va primero: si entra en el mismo paquete que los otros tres, '
           + 'los tres se detienen detrás de él.',
  },

  fuera_del_panel: {
    dueno: 'direccion', alcance: 'cuenta',
    pedir: 'Averiguar por qué esta cuenta activa dejó de aparecer en el Informe '
         + 'de Cortes',
    porque: 'La cuenta está viva en la cartera y su CID no aparece en el panel '
          + 'de facturación desde hace meses. O es un hueco del archivo, o está '
          + 'facturando y nadie lo está viendo.',
    donde: 'Daniel Martínez → facturación. No es del asesor: él no puede '
         + 'arreglar un hueco del export.',
    bloquea: 'El consumo de la cuenta, y la posibilidad de fechar su baja si '
           + 'llegara. Justo lleva sin aparecer desde enero con $13,947 al mes.',
  },
}

/** Los huecos que se le piden al asesor, en el orden en que conviene pedirlos. */
export const HUECOS_DE_ASESOR = (Object.keys(HUECOS) as ClaveHueco[])
  .filter(k => HUECOS[k].dueno === 'asesor')

/** Los que se le llevan a Daniel Martínez. */
export const HUECOS_DE_DIRECCION = (Object.keys(HUECOS) as ClaveHueco[])
  .filter(k => HUECOS[k].dueno === 'direccion')

export interface TareaDeHueco {
  clave: ClaveHueco
  dueno: DuenoHueco
  alcance: AlcanceHueco
  /** `null` en las de cartera. */
  cuentaId: string | null
  empresa: string | null
  asesor: string | null
  /** El MRR que queda a ciegas: de la cuenta, o la suma en las de cartera. */
  mrrCiego: number | null
  pedir: string
  porque: string
  donde: string
  bloquea: string
}

/**
 * Arma las tareas a partir de los huecos detectados.
 *
 * `porCuenta` es la lista de huecos de alcance cuenta, ya detectados por el
 * snapshot. `carteraCiega` dice, para cada hueco de cartera, cuánto MRR ciega —
 * lo que le da prioridad a la petición cuando llega a la mesa de Daniel.
 *
 * Los de cartera se emiten UNA vez cada uno, no una por cuenta. Ver el
 * encabezado del archivo.
 */
export function tareasDeHuecos(
  porCuenta: Array<{ clave: ClaveHueco; cuentaId: string; empresa: string;
                     asesor: string | null; mrr: number | null }>,
  carteraCiega: Partial<Record<ClaveHueco, number>> = {},
): TareaDeHueco[] {
  const salida: TareaDeHueco[] = []

  for (const h of porCuenta) {
    const d = HUECOS[h.clave]
    if (!d || d.alcance !== 'cuenta') continue
    salida.push({
      clave: h.clave, dueno: d.dueno, alcance: 'cuenta',
      cuentaId: h.cuentaId, empresa: h.empresa, asesor: h.asesor,
      mrrCiego: h.mrr,
      pedir: d.pedir, porque: d.porque, donde: d.donde, bloquea: d.bloquea,
    })
  }

  for (const clave of HUECOS_DE_DIRECCION) {
    const d = HUECOS[clave]
    if (d.alcance !== 'cartera') continue
    salida.push({
      clave, dueno: d.dueno, alcance: 'cartera',
      cuentaId: null, empresa: null, asesor: null,
      mrrCiego: carteraCiega[clave] ?? null,
      pedir: d.pedir, porque: d.porque, donde: d.donde, bloquea: d.bloquea,
    })
  }

  /* Orden: primero por dueño (el asesor actúa esta semana, dirección abre una
     conversación), y dentro de cada dueño por dinero a ciegas descendente. Un
     `null` en `mrrCiego` NO se trata como cero —sería mandarlo al final cuando
     lo que pasa es que no se sabe— sino que va justo después de los medidos. */
  return salida.sort((a, b) => {
    if (a.dueno !== b.dueno) return a.dueno === 'asesor' ? -1 : 1
    const x = a.mrrCiego, y = b.mrrCiego
    if (x === null && y === null) return 0
    if (x === null) return 1
    if (y === null) return -1
    return y - x
  })
}
