import type { CuentaConVeredicto } from '@/lib/alertas-estado'
import type { Situacion } from '@/lib/alertas-veredicto'

/**
 * lib/alertas-guion.ts — CÓMO SE HACE, NO SÓLO QUÉ HACER
 *
 * ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * Instrucción de dirección, 8 oct 2026: «al igual que en actividades, dales
 * sugerencias de un auténtico profesional de SAC».
 *
 * El veredicto dice la acción en una línea —«Llamar esta semana y confirmar qué
 * está pasando»— y eso basta para priorizar, pero no para trabajar. Las
 * actividades SAC que esto sustituye sí traían el oficio: qué revisar antes de
 * marcar, qué preguntar con esas palabras, qué tenía que quedar capturado. Al
 * retirarlas se perdió, y lo que quedó fue un imperativo seco.
 *
 * ── LA REGLA QUE LO HACE ÚTIL ──────────────────────────────────────────────
 *
 * Cada línea va anclada a una cifra MEDIDA de esta cuenta. Una frase que
 * valdría para cualquier cliente —«mantén una buena relación»— no se escribe:
 * se lee una vez, no dice nada, y entrena a saltarse el panel entero.
 *
 * De ahí la mecánica de las marcas. El texto se escribe con `{consumoPct}`,
 * `{perdidas}`, `{evidenciaRiesgo}`, y aquí se sustituyen por el dato real de
 * la cuenta. Y lo importante: **si el dato no existe, la línea NO se rellena
 * con un cero ni con una vaguedad — se cae**. Un guion que dice «llevan null
 * días sin contacto» es peor que uno más corto. Ver
 * [[feedback-cero-sin-medicion]] y [[feedback-contexto-ia-sin-huecos]].
 *
 * Los textos salieron de un trabajo de redacción con crítica adversarial: cada
 * situación la escribió un redactor y la revisó otro con el encargo de cazar
 * relleno, marcas inventadas, instrucciones imposibles y preguntas que un
 * cliente contestaría a la defensiva.
 */

export interface Guion {
  /** En mayúsculas, corto. Es el nombre de la gestión. */
  titulo: string
  /** Qué tiene que haber conseguido el ejecutivo al colgar. Una frase. */
  objetivo: string
  /** Qué revisar ANTES de marcar, cada cosa con su razón en números. */
  antes: string[]
  /** Preguntas literales, para leerlas tal cual. */
  preguntas: string[]
  /** Qué tiene que quedar capturado, y dónde. */
  registrar: string[]
  /** El error que arruina esta conversación. */
  cuidado: string
}

/* ── Las marcas ────────────────────────────────────────────────────────────
 *
 * `null` significa NO MEDIDO y hace caer la línea que la use. Por eso los
 * formatos se construyen aquí y no en el texto: un `0` legítimo —cero fallas,
 * cero reuniones— tiene que llegar como "0" y sobrevivir, mientras que un dato
 * ausente tiene que llegar como `null` y tumbar su línea. Colapsar los dos
 * sería justo el error que esta casa tiene prohibido.
 */
type Marcas = Record<string, string | null>

const num = (n: number | null | undefined): string | null =>
  n === null || n === undefined ? null : n.toLocaleString('es-MX')

const pct = (n: number | null | undefined): string | null =>
  n === null || n === undefined ? null : `${Math.round(n)}%`

function marcasDe(c: CuentaConVeredicto): Marcas {
  const d = c.datos
  /* El riesgo más grave que la cuenta tiene encima, de sus propios hallazgos.
     Se toma el PRIMERO porque `hallazgosDe` empuja las alertas en el orden en
     que vienen, y `detectarAlertas` ya las devuelve ordenadas por prioridad. */
  const riesgo = c.veredicto.hallazgos.find(h => h.clase === 'riesgo') ?? null
  return {
    empresa:         c.empresa || null,
    mrr:             c.mrr === null ? null
                       : `$${c.mrr.toLocaleString('es-MX', { maximumFractionDigits: 0 })} al mes`,
    diasSinContacto: num(d.diasSinContacto),
    consumoPct:      pct(d.consumoPct),
    perdidas:        num(d.perdidas),
    pctPerdidas:     pct(d.pctPerdidas),
    tickets:         num(d.tickets),
    fallas:          num(d.fallas),
    reuniones:       num(d.reuniones),
    candidatura:     d.candidatura,
    fuentes:         String(d.fuentes),
    tituloRiesgo:    riesgo?.titulo ?? null,
    evidenciaRiesgo: riesgo?.prueba ?? null,
  }
}

const RX_MARCA = /\{([a-zA-Z]+)\}/g

/** Sustituye las marcas. Devuelve `null` si alguna no tiene dato. */
function resolver(texto: string, m: Marcas): string | null {
  let falta = false
  const out = texto.replace(RX_MARCA, (_, k: string) => {
    const v = m[k]
    if (v === null || v === undefined) { falta = true; return '' }
    return v
  })
  return falta ? null : out
}

/** Las líneas que SÍ se pueden decir. Las demás no se rellenan: se caen. */
const resolverLista = (xs: string[], m: Marcas): string[] =>
  xs.map(t => resolver(t, m)).filter((t): t is string => t !== null)

/* ── Los guiones ──────────────────────────────────────────────────────────
 *
 * Uno por situación. El de `en_orden` es el más corto a propósito: su acción
 * declarada es «nada esta semana» y dirección pidió expresamente no inventar
 * tareas, así que ahí el guion no manda llamar — dice qué vigilar para que esa
 * cuenta no se apague sin avisar.
 */
const GUIONES: Record<Situacion, Guion> = {

  se_va: {
    titulo: 'LLAMADA DE RETENCIÓN HOY',
    objetivo: 'Colgar sabiendo si la salida de {empresa} ya está decidida o todavía '
            + 'hay tiempo, con el nombre de quien firma esa decisión y la fecha en que se toma.',
    antes: [
      'Lee su alerta antes de marcar — «{tituloRiesgo}»: {evidenciaRiesgo}. Son {mrr} '
      + 'en riesgo: llévate las cifras apuntadas, pero no se las leas al cliente. Eso es '
      + 'para que no te sorprenda, no para echárselo encima.',
      'Llevan {diasSinContacto} días sin contacto real y {consumoPct} de su bolsa de '
      + 'minutos consumido. Si el consumo va bajo, ya movieron tráfico a otro lado y la '
      + 'salida va avanzada; si va alto, siguen operando con nosotros y lo que se rompió '
      + 'es la relación, no el servicio. Los días te los van a reclamar: reconócelos en '
      + 'una frase, sin excusas de carga de trabajo, y sigue.',
      'Abre Tickets: {tickets} atendidos, {fallas} por falla del servicio. Si no es cero, '
      + 'reconócelo en los primeros 30 segundos y con el número en la mano. Si es cero no '
      + 'cantes victoria: puede ser que dejaran de reportar — pregunta qué problemas '
      + 'tuvieron que no nos levantaron.',
      'Abre su ficha: {reuniones} reuniones registradas. Si son cero o una, el hueco es la '
      + 'relación y la llamada abre reconociendo el silencio, no vendiendo.',
    ],
    preguntas: [
      '«¿La decisión de dejar el servicio ya está tomada, o todavía estamos en tiempo de corregir?»',
      '«¿Cuándo fue la primera vez que pensaron en cambiarnos, y qué estaba pasando en ese momento?»',
      '«¿Qué tendría que pasar de nuestro lado, concretamente, para que esto no se cancele?»',
      '«¿Quién más tiene que decir sí para que esto siga, y para qué día necesitan tenerlo decidido?»',
    ],
    registrar: [
      'El seguimiento en la ficha de {empresa}, hoy mismo y con sus palabras: si la decisión '
      + 'está tomada, el nombre de quien decide, la fecha que te dio y, si nombró a otro '
      + 'proveedor, el nombre tal cual lo dijo. Si mañana no está escrito, la llamada no existió.',
      'Si confirmó intención de salida: avísale a supervisión antes de 24 horas y hablado, no '
      + 'por correo. Una cuenta de {mrr} no se escala el lunes.',
      'El compromiso que le diste, con responsable y día exacto, nunca «la próxima semana». Y si '
      + 'lo que te dijo que falló no aparece en el Radar de 12 preguntas de su ficha, contéstalo '
      + 'hoy: ésa es la pregunta que se nos quedó sin ver.',
    ],
    cuidado: 'Resolverlo por correo o abrir ofreciendo descuento: cuando la decisión ya está '
           + 'tomada el correo no se contesta, y el precio sólo le confirma que lo único que '
           + 'teníamos era precio.',
  },

  apagandose: {
    titulo: 'LLAMADA DE DIAGNÓSTICO DE USO',
    objetivo: 'Colgar sabiendo si lo de {empresa} es técnico, operativo o de negocio, y con '
            + 'fecha acordada para lo que toque: revisión con soporte, sesión de uso con su '
            + 'equipo o junta con quien aprueba el gasto.',
    antes: [
      'Lee dos cosas de la ficha antes de marcar: la alerta —{tituloRiesgo}: '
      + '«{evidenciaRiesgo}»— y el último seguimiento, porque con {diasSinContacto} días sin '
      + 'contacto lo que quedó pendiente ahí es lo primero que el cliente te va a cobrar. '
      + 'Apúntate la cifra de la evidencia y dila tal cual: si preguntas en general, te '
      + 'contestan en general.',
      'Pon el consumo junto al precio: {consumoPct} de la bolsa contra {mrr}. En la serie mes '
      + 'a mes distingue si es un mes malo o el tercero a la baja: uno es temporada, tres es '
      + 'una decisión que ya tomaron sin contarte. Y los minutos que no consumió no se guardan '
      + 'para el mes siguiente, se perdieron.',
      'Abre Análisis de Llamadas y distingue qué cayó: si sigue recibiendo y se le quedan '
      + '{perdidas} sin contestar ({pctPerdidas}), no se apagó el servicio, se apagó quien '
      + 'contesta —eso es operativo, no técnico. Fíjate si se juntan en una franja de horas, '
      + 'que es falta de gente en ese turno, o están repartidas todo el día, que es '
      + 'configuración y ahí entra soporte.',
      'Revisa Tickets: {tickets} atendidos, {fallas} por falla del servicio. Con fallas entras '
      + 'reconociéndolas antes de que te las saquen; con cero tickets y el uso caído no cantes '
      + 'victoria —o ya nadie lo usa, o reportan por fuera de la mesa, y eso se pregunta.',
    ],
    preguntas: [
      '«Su consumo del periodo cerró en {consumoPct} de los minutos que tiene contratados. '
      + '¿Qué está pasando en su operación que nosotros no estemos viendo?»',
      '«¿Qué les ha dejado de funcionar últimamente y no nos lo han reportado? Prefiero '
      + 'enterarme por usted que por el reporte.»',
      '«¿Quién está usando hoy el sistema de su lado, y quién lo usaba hace tres meses?»',
      '«¿Quién revisa de su lado los {mrr} que paga por el servicio? Quiero llevarle a esa '
      + 'persona sus números del periodo: ¿qué día de las próximas dos semanas nos puede recibir?»',
    ],
    registrar: [
      'El seguimiento en la ficha el mismo día, con la causa en una palabra —técnico, operativo '
      + 'o de negocio—, la cifra que te dio el cliente y la fecha que quedó. La alerta se '
      + 'calcula de los datos de la cuenta, no se cierra a mano.',
      'Nombre y puesto de quien aprueba el gasto, en Contactos de la ficha. Si no está, el día '
      + 'que alguien de su lado revise los {mrr} no hay a quién llamarle y la cuenta se '
      + 'defiende sola.',
      'Las respuestas del Radar que esta llamada te dejó contestar, en la misma ficha. Si la '
      + 'llamada no deja ni una respuesta nueva, no fue diagnóstico: fue cortesía.',
    ],
    cuidado: 'Dar por sentado que es precio y ofrecer descuento: si la causa era que nadie sabe '
           + 'usarlo, le bajas el precio y la cuenta se apaga igual, nomás más barata —y el '
           + 'precio no se recupera.',
  },

  no_la_vemos: {
    titulo: 'LLAMADA DE LEVANTAMIENTO DE DATOS',
    objetivo: 'Colgar con el mapa de {empresa} en la mano —qué áreas usan el teléfono, a qué '
            + 'números entran las llamadas que no se pueden perder, quién las contesta y quién '
            + 'decide— y con fecha puesta para regresarle sus propios números.',
    antes: [
      'Anota con nombre y apellido cuáles de las ocho fuentes vienen vacías. Hoy traen dato '
      + '{fuentes} de 8, y no es lo mismo que falte el consumo de minutos que que falten las '
      + 'reuniones: lo primero lo saca la plataforma, lo segundo sólo lo arreglas tú. Llega '
      + 'sabiendo qué falta, no preguntándolo.',
      'Saca TÚ el reporte en Análisis de Llamadas antes de marcar: el tráfico lo genera nuestra '
      + 'plataforma, es nuestro, no se le pide al cliente. Y en Facturación → Informe de Cortes '
      + 'apunta cuántas extensiones y DIDs le cobramos a {empresa} por sus {mrr}; ése es el '
      + 'número que vas a contrastar con las que de verdad usa alguien, porque una extensión '
      + 'asignada a quien ya no trabaja ahí es costo desperdiciado PARA EL CLIENTE.',
      'Contactos de la ficha: llevan {diasSinContacto} días sin contacto. Manda antes un correo '
      + 'o WhatsApp corto para confirmar que la persona registrada sigue en la empresa. Con ese '
      + 'tiempo encima lo más probable es que haya rotado, y gastar la semana marcando a un '
      + 'número muerto es lo que mantiene ciega a esta cuenta.',
      'Tickets y la ficha: {tickets} tickets atendidos y {reuniones} reuniones registradas. Si '
      + 'los dos andan en el piso no significa que todo esté bien, significa que no hay '
      + 'relación: la llamada es de presentación y así la abres, no como seguimiento de algo '
      + 'que nunca pasó.',
    ],
    preguntas: [
      '«¿Qué áreas de su empresa usan hoy el teléfono con clientes y cuántas personas hay en '
      + 'cada una? Se lo pregunto porque si hay extensiones asignadas a gente que ya salió, '
      + 'usted las está pagando cada mes.»',
      '«¿A qué número entran las llamadas que no se pueden perder, y quién las contesta? ¿Qué '
      + 'pasa con una de esas llamadas si nadie la toma: alguien la regresa, o ahí se queda?»',
      '«¿Cómo sabe hoy si su equipo está contestando todo lo que entra? ¿Qué dato revisa y cada '
      + 'cuándo lo revisa?»',
      '«Cuando le lleve los números de su propia operación, ¿quién más tiene que estar: quien '
      + 'dirige al equipo que contesta, quien aprueba el presupuesto de telefonía? Déme nombre '
      + 'y puesto para incluirlo.»',
    ],
    registrar: [
      'Lo que te dijo de áreas, personas y números, en el Radar de 12 preguntas de la ficha de '
      + '{empresa}, pregunta por pregunta y no como párrafo suelto. Es lo único que queda de '
      + 'esta llamada: sin eso la cuenta reaparece la semana que entra con las mismas {fuentes} '
      + 'de 8 fuentes y la siguiente ejecutiva va a marcar a preguntar lo mismo.',
      'Nombre, puesto, correo y celular de quien decide y de quien dirige al equipo que '
      + 'contesta, en Contactos. Una cuenta con un solo contacto registrado vuelve a quedarse '
      + 'ciega el día que esa persona rota.',
      'El reporte que sacaste en Anexos, y en el seguimiento la fecha comprometida de la cita '
      + 'más las extensiones o DIDs que te dijo que ya nadie usa, para cruzarlos contra el '
      + 'Informe de Cortes. Un pendiente sin dueño ni fecha nadie lo cobra.',
    ],
    cuidado: 'Convertir la llamada en un cuestionario y pedirle al cliente el tráfico que ya '
           + 'está en nuestra plataforma: quedas como el proveedor que no sabe a quién le '
           + 'vende, y cuelgas con la cuenta igual de ciega otro mes.',
  },

  sin_auditar: {
    titulo: 'ARMAR LA AUDITORÍA Y AGENDARLA',
    objetivo: 'Colgar con fecha, hora y el nombre y puesto de quién va a estar en la sesión '
            + 'donde le presentas a {empresa} los hallazgos de su propia operación.',
    antes: [
      'Análisis de Llamadas: {perdidas} entrantes sin contestar, {pctPerdidas} de las que '
      + 'recibe. Arriba del 15% es un problema operativo que el cliente todavía no sabe que '
      + 'nosotros medimos. Apunta la hora pico y en qué DID se concentran: un hallazgo con hora '
      + 'y número se discute, un porcentaje solo suena a regaño.',
      'Facturación → Informe de Cortes: lleva {consumoPct} de su bolsa. Son 1,500 minutos por '
      + 'extensión, los minutos no se acumulan al mes siguiente y lo que rebasa se cobra. '
      + 'Debajo del 50% paga extensiones que nadie usa; arriba del 90% el próximo corte le '
      + 'llega con cargo extra. Los dos lados son hallazgo, y los dos se dicen en pesos contra '
      + 'los {mrr} que paga.',
      'Tickets: {tickets} en el histórico, {fallas} por falla del servicio. Si el peso está en '
      + 'las fallas, la auditoría abre reconociéndolas o no te van a creer lo demás. Si está en '
      + 'dudas de uso y un mismo motivo se lleva más de un tercio, no es un cliente demandante: '
      + 'es algo que nadie resolvió de raíz, y eso es capacitación, no soporte.',
      'Ficha de {empresa}: {diasSinContacto} días sin contacto y {reuniones} reuniones '
      + 'registradas. Con la relación fría o sin una sola reunión, esta llamada sólo pide la '
      + 'sesión — el número gordo se guarda para la pantalla. Y revisa qué preguntas del Radar '
      + 'están en blanco: mete dos o tres en la conversación, no las doce.',
    ],
    preguntas: [
      '«Le marco porque revisé los números de su operación de los últimos meses y salieron tres '
      + 'cosas que vale la pena que vea con calma, no por teléfono. ¿Le aparto media hora esta '
      + 'semana, o la siguiente le acomoda mejor?»',
      '«De las llamadas que les entran y no alcanzan a contestar, ¿qué pasa hoy con esas? '
      + '¿alguien las regresa, o se quedan ahí?»',
      '«¿Cuántas personas contestan hoy y en qué horario? Quiero cruzarlo contra la hora en que '
      + 'más les marcan, porque es ahí donde se están cayendo.»',
      '«Además de usted, ¿quién tendría que estar en esa sesión para que lo que acordemos no se '
      + 'quede en el aire? Y si de ahí sale un ajuste al servicio, ¿con quién se autoriza?»',
    ],
    registrar: [
      'El caso en Auditoría de Cuentas con las cuatro partes cerradas: hallazgos, problema raíz, '
      + 'plan de acción con responsable y criterio —en sus tres tiempos, inmediato, mediano y '
      + 'estratégico— y perfiles de los actores con el nombre y el rol que te dieron. Sin '
      + 'responsable y criterio no es auditoría, es un reporte.',
      'De cuántas de las ocho fuentes hubo dato ({fuentes}) y cuáles faltaron, escrito con '
      + 'palabras dentro del caso: un hueco no es un cero, y quien lo lea después va a suponer '
      + 'que ahí no pasa nada.',
      'La fecha y hora de la sesión como seguimiento en la ficha de {empresa}, y el material que '
      + 'vas a enseñar cargado como anexo ahí mismo, no en tu escritorio. Si la cuenta cambia de '
      + 'asesor, lo que no está en la ficha no existió.',
    ],
    cuidado: 'Colgar sin fecha en el calendario: la auditoría que se queda escrita y nunca se '
           + 'presenta no mueve nada, y la cuenta te vuelve a salir la semana que entra con los '
           + 'mismos números.',
  },

  oportunidad: {
    titulo: 'CASO DE CRECIMIENTO · {candidatura}',
    objetivo: 'Colgar con fecha de cita para presentar el caso de {candidatura} y con el nombre '
            + 'de quien autoriza el gasto, escrito en Contactos de la ficha.',
    antes: [
      'Atención de llamadas: {perdidas} entrantes sin contestar, {pctPerdidas} de todo lo que le '
      + 'timbra. Apunta el periodo que declara la pantalla —no es el mismo en todas las cuentas— '
      + 'y si la última barra está a media opacidad, ese mes no cerró: no uses esa cifra. El '
      + 'caso de {candidatura} son sus llamadas, no el folleto.',
      'Consumo de bolsa: {consumoPct}. No te quedes con el número suelto: mira si viene subiendo '
      + 'o si un solo mes lo infló. Arriba del 85% el argumento es capacidad —no hay rollover y '
      + 'el excedente se le cobra—. Abajo del 50% no menciones minutos, el tema es cobertura de '
      + 'las llamadas que ya recibe. Y lo que propongas tiene que caber junto a los {mrr} que ya paga.',
      'Tickets: {tickets} atendidos, {fallas} por falla del servicio. Abre los dos de cierre más '
      + 'reciente y sácate un hecho concreto de su operación para citarlo. Si hubo fallas, '
      + 'nómbralo tú al abrir: dicho por ti es un servicio que respondió; dicho por él, es un '
      + 'reclamo y la venta se cae ahí mismo.',
      'Ficha: {diasSinContacto} días sin contacto y {reuniones} reuniones registradas. Si llevas '
      + 'meses sin hablarle, esta llamada no abre pidiendo cita de presentación. En el Radar, las '
      + 'que deciden aquí son la relación directa con quien autoriza el gasto, el Champion que '
      + 'conserve influencia, y la respuesta con evidencia si Finanzas pregunta por qué siguen '
      + 'pagando: lo que esté en blanco ahí es exactamente lo que vas a preguntar.',
    ],
    preguntas: [
      '«De todo lo que les timbra, {perdidas} llamadas se quedaron sin que nadie las contestara: '
      + '{pctPerdidas} del total. ¿Qué pasa de su lado cuando una de ésas no se contesta?»',
      '«¿Cuánto vale para ustedes una llamada que entra y sí se contesta? Se lo pregunto porque '
      + 'con ese número y esas {perdidas}, el caso lo arma usted y no yo.»',
      '«Si le muestro con sus propios números cuántas de esas llamadas se pueden recuperar, ¿con '
      + 'quién tendríamos que sentarnos para que eso se decida?»',
      '«¿En qué mes arman el presupuesto del área? Prefiero llevarle los números antes de esa '
      + 'fecha, no después.»',
    ],
    registrar: [
      'Nombre y puesto de quien autoriza el gasto, en Contactos de la ficha con su cargo '
      + 'capturado: Contactos no tiene marca de «decisor», el cargo es lo único que lo distingue '
      + 'del usuario operativo. Sin ese nombre la oportunidad de {candidatura} todavía no existe, '
      + 'aunque el usuario esté encantado.',
      'La frase textual con que el cliente describió el problema, en un seguimiento de la ficha. '
      + 'Esa frase —no la nuestra— es la que abre la presentación de {candidatura}.',
      'La fecha de la cita y, en el mismo seguimiento, las cifras que vas a usar como evidencia '
      + '({perdidas}, {pctPerdidas}): el panel de llamadas no exporta nada, así que lo que no '
      + 'quede escrito se pierde. El documento súbelo a Anexos. Si no hubo cita, escribe en una '
      + 'línea qué lo detuvo.',
    ],
    cuidado: 'Soltar un precio de {candidatura}: ninguna condición comercial se ofrece sin VoBo '
           + 'de Dirección, y en cuanto hay número sin el caso armado con sus {perdidas} y sin '
           + 'quien autoriza el gasto enterado, la plática se vuelve comparar cotizaciones — '
           + 'donde pierdes la única ventaja que tienes: tú ves sus llamadas y el competidor no.',
  },

  hay_que_mostrarle: {
    titulo: 'PRESENTAR HALLAZGOS DE SU OPERACIÓN',
    objetivo: 'Que al colgar quede fecha en firme para corregir la cifra que más le cuesta a '
            + '{empresa}, después de mostrarle tres números de su propia operación que él no '
            + 'tiene medidos.',
    antes: [
      'Análisis de Llamadas: anota las {perdidas} entrantes que no se alcanzaron a contestar, el '
      + '{pctPerdidas} que representan y la hora pico. Arriba del 15% hay un hueco de atención '
      + 'que el cliente no mide y nosotros sí; con la hora pico ya sabes a qué turno le falta '
      + 'gente. Llévate la captura, no el número reteclado: un dígito mal puesto te tumba la '
      + 'junta completa.',
      'Facturación → Informe de Cortes: {consumoPct} de bolsa consumido y la fecha del próximo '
      + 'corte. Abajo del 60% paga capacidad que se le vence cada mes —los minutos no se '
      + 'acumulan—, y la salida no es bajarle el plan ni venderle algo: es preguntar qué áreas '
      + 'siguen fuera de las extensiones que ya paga. Arriba del 90% va a rebasar y el excedente '
      + 'se cobra, así que avísale con la fecha del corte en la mano, porque un cargo sorpresa '
      + 'regresa convertido en ticket.',
      'Tickets: {tickets} atendidos y cerrados, {fallas} por falla del servicio. Si las fallas '
      + 'son parte chica, la lámina va: la resta son dudas, altas y configuraciones que '
      + 'resolvimos por él y que no tiene en la cabeza. Si pesan, esa cifra no se presenta suelta '
      + '—va junto con lo que se corrigió— o no va. Y no le digas que no trae pendientes: la '
      + 'pantalla sólo ve los cerrados.',
      'Ficha: relee tu auditoría y las {reuniones} reuniones registradas, y tacha los hallazgos '
      + 'que ya le presentaste, porque repetir lámina te quema la junta en los primeros cinco '
      + 'minutos. Mira los {diasSinContacto} días desde el último contacto: si son muchos, no '
      + 'entres como si hubieran hablado ayer. Hay dato en {fuentes} de las ocho fuentes, y lo '
      + 'que no aparece ahí no se afirma en la junta.',
    ],
    preguntas: [
      '«Nuestro tablero registró {perdidas} llamadas entrantes que no se alcanzaron a contestar, '
      + '{pctPerdidas} de todo lo que ustedes reciben. ¿A qué número o a qué área entran esas '
      + 'llamadas, y quién las está atendiendo en ese horario?»',
      '«Hoy están ocupando {consumoPct} de los minutos que pagan cada mes. ¿Cuántas personas '
      + 'están tomando llamadas hoy, y cuántas eran cuando arrancaron con nosotros?»',
      '«De las cifras que le acabo de mostrar, ¿cuál le pega más a su operación hoy, y qué '
      + 'tendría que pasar en los próximos treinta días para moverla?»',
      '«Si de aquí sale un cambio en su telefonía, ¿quién más de su empresa tendría que estar de '
      + 'acuerdo? ¿Cómo se llama y qué puesto tiene?»',
    ],
    registrar: [
      'En seguimientos de la ficha: las cifras que presentaste, la reacción textual del cliente a '
      + 'cada una y la fecha en firme que quedó, con quién se comprometió a qué. La cifra que le '
      + 'movió el gesto es por donde se abre la siguiente conversación.',
      'En anexos de la cuenta: la lámina o la captura que llevaste, con fecha. Si no queda ahí, '
      + 'para el resto de la casa esa reunión no existió y la próxima vez le van a repetir las '
      + 'mismas cifras.',
      'En contactos: nombre y puesto de quien aprueba cambios de telefonía, aunque no haya estado '
      + 'en la junta. Y contesta en el Radar las preguntas que el cliente te acabó de aclarar, '
      + 'con sus palabras, no con tu suposición.',
    ],
    cuidado: 'Abrir con «¿cómo va todo?»: el cliente contesta «bien, sin novedades», la junta se '
           + 'vuelve cortesía y tus cifras se quedan en la carpeta — entra con las {perdidas} '
           + 'llamadas sin contestar en la primera lámina, no en la última.',
  },

  en_orden: {
    titulo: 'SIN TAREA — QUÉ VIGILAR',
    objetivo: 'Dejar {empresa} con su línea base escrita para que la próxima vez que abras la '
            + 'ficha sepas en diez segundos si subió o bajó. No hay que llamarle esta semana.',
    antes: [
      'Análisis de Llamadas, las últimas 4 semanas comparadas una contra otra: {perdidas} '
      + 'perdidas, {pctPerdidas} de las que recibe, y la hora pico. Si pasa del 15%, tiene un '
      + 'problema de operación que nadie le ha dicho, y ése es el único hallazgo que justifica '
      + 'marcarle esta semana.',
      'Facturación → Informe de Cortes: paga {mrr}, verifica que su último corte esté liquidado. '
      + 'Un vencido del mes vivo todavía es cobranza y se arregla con un recordatorio a quien '
      + 'paga; dos cortes seguidos ya no, y eso se alcanza a ver aquí antes que en cualquier '
      + 'otra pantalla.',
      'Tickets: {tickets} atendidos, {fallas} por falla del servicio. Esa pantalla sólo trae '
      + 'cerrados, así que no concluyas nada de un «no hay abiertos»; mira la proporción — si las '
      + 'fallas pesan más de la tercera parte, la cuenta está en orden por paciencia del cliente, '
      + 'no por calidad del servicio, y la paciencia se termina en la siguiente caída.',
      'Radar de 12 preguntas: cuenta cuántas siguen en blanco, y cuántas de las ocho fuentes '
      + 'traen dato ({fuentes}). Con {reuniones} reuniones registradas, cada hueco del Radar es '
      + 'una pregunta que no vas a poder contestar el día que dirección pregunte por esta cuenta.',
    ],
    preguntas: [
      '«¿Qué número de su operación telefónica revisa usted cada semana, y en dónde lo consulta?»',
      '«¿Quién más de su equipo debería estar recibiendo el reporte de llamadas, además de usted?»',
      '«¿Qué cambios tienen previstos en los próximos tres meses —aperturas, campañas, temporada— '
      + 'que puedan mover su volumen de llamadas?»',
      '«Si se les cae la línea un viernes a las seis de la tarde, ¿a quién le marca usted?»',
    ],
    registrar: [
      'La línea base de hoy —{consumoPct} de bolsa, {pctPerdidas} de llamadas sin contestar y la '
      + 'fecha— en el análisis de la cuenta, dentro de Auditoría de Cuentas: ahí es donde la vas '
      + 'a comparar la próxima vez, no en tu libreta.',
      'Las preguntas del Radar que puedas contestar sin molestar al cliente, con lo que ya está '
      + 'en la ficha. Es trabajo que no cuesta una llamada y que evita la siguiente.',
    ],
    cuidado: 'Convertir esto en una llamada de cortesía para sentir que hiciste algo: dirección '
           + 'pidió expresamente no inventar tareas, y marcarle sin nada que decirle gasta el '
           + 'único crédito que vas a necesitar el día que sí haya algo.',
  },
}

/**
 * El guion de esta cuenta, con sus cifras ya puestas.
 *
 * Devuelve `null` si al resolver no queda nada que decir — pasa cuando a la
 * cuenta le faltan casi todos los datos, y entonces es más honesto no dibujar
 * el bloque que dibujarlo vacío.
 */
export function guionDe(c: CuentaConVeredicto): Guion | null {
  const base = GUIONES[c.veredicto.situacion]
  if (!base) return null
  const m = marcasDe(c)

  const antes     = resolverLista(base.antes, m)
  const preguntas = resolverLista(base.preguntas, m)
  const registrar = resolverLista(base.registrar, m)
  if (!antes.length && !preguntas.length && !registrar.length) return null

  /* El título, el objetivo y el cuidado no se caen: son la cabecera del bloque
     y sin ellos lo demás queda huérfano. Si traen una marca sin dato se recorta
     la marca y la frase sigue leyéndose — nunca se inventa el número. */
  const sinMarcas = (t: string) =>
    t.replace(RX_MARCA, (_, k: string) => m[k] ?? '').replace(/\s{2,}/g, ' ').trim()

  return {
    titulo:   sinMarcas(base.titulo),
    objetivo: sinMarcas(base.objetivo),
    cuidado:  sinMarcas(base.cuidado),
    antes, preguntas, registrar,
  }
}
