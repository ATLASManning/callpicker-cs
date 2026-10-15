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

/** Las tres familias. Separarlas importa: piden trabajos distintos. */
export type Familia =
  | 'ceguera'      // no podemos VER la cuenta — se resuelve capturando
  | 'riesgo'       // el cliente se está yendo — se resuelve hablando
  | 'oportunidad'  // hay dinero sobre la mesa
/* Eran cuatro. `abandono` —«la soltamos nosotros»— se retiró el 8 oct 2026 con
   el generador SAC, porque sus dos tipos no medían la cuenta sino nuestra
   contabilidad interna del lote semanal: `asignada_sin_cerrar` pedía cerrar una
   actividad en una pantalla que ya no existe, y `nunca_asignada` decía que «la
   cola de focos ya la pone delante» de una cola que ya no drena. Una alerta
   cuya acción es imposible es peor que ninguna: entrena a no mirarlas.

   Medido antes de quitarlas: las 69 cuentas que las traían llevaban TODAS al
   menos otra alerta, así que ninguna se quedó muda, y el veredicto de ALERTAS
   cubre las 192 por su cuenta. Lo que esas dos querían decir —que nadie está
   cuidando la cuenta— lo dicen ahora `no_la_vemos` y `sin_auditar` del motor de
   veredictos, que lo miden sobre el cliente y no sobre nuestra fila. */

export type TipoAlerta =
  | 'sin_consumo_medible'
  | 'sin_radar'
  | 'sin_contactos'
  | 'sin_ficha'
  | 'sin_datos_auditables'
  | 'caida_consumo'
  | 'desplome_consumo'
  | 'consumo_cero'
  | 'uso_bajo'
  | 'baja_declarada'
  | 'riesgo_escrito'
  | 'reduccion_declarada'
  | 'sin_interlocutor'
  | 'silencio_60'
  | 'silencio_30'
  | 'nunca_contactada'
  | 'rebasa_bolsa'
  /* ── LA MESA DE AYUDA, QUE NO LLEGABA AL MOTOR ──────────────────────────
   *
   * Dirección, 9 oct 2026: «habrá que reforzar, robustecer las alarmas de las
   * cuentas, darles mayor peso a tus hallazgos».
   *
   * Medido el 9 oct: el `health_score` correlaciona con `fallas` en **+0.121**
   * y con `tickets` en **+0.098** — EN POSITIVO. Más incidencias, mejor
   * puntaje, porque no existe ninguna ruta de código de la mesa al número.
   * GRUPO TORRES CORZO lleva un folio escalado **155 días** —156 sin que nadie
   * lo mueva— sobre $316,541 al mes, el 14.3% de la cartera, y el tablero lo
   * ponía en el lugar 16. Y la causa raíz del riesgo de baja mejor documentado
   * de la cartera, Polak Grupo, es INTERNA: descontinuación de Legacy, meses de
   * llamadas caídas. El servicio que falla es el motivo de baja mejor
   * documentado que tiene este proyecto, y era el único que no disparaba nada.
   *
   * OJO CON POLAK: esta prosa decía «el único churn confirmado de la cartera»
   * y es FALSO. Dirección lo corrigió el 14 oct 2026: «aún está vivo, aún no
   * se tramita su churn definitivo». La cuenta está `activo` en la ficha, con
   * asesor, y el 14 oct encendió `llamadas_perdidas_masivas`. Darla por
   * perdida en los comentarios es cómo se suelta una cuenta recuperable — y
   * [[feedback-conciliacion-churn]] es tajante: ninguna baja sin autorización,
   * y una baja es pasar a Dormida, nunca darla por hecha. */
  | 'sac_fuera_sla'
  | 'sac_atraso_cronico'
  | 'sac_fallas_recurrentes'
  /* La octava fuente era la única que se medía, se publicaba en la tabla de
     huecos del tablero y no encendía ninguna luz. */
  | 'sin_importe'
  /* ── LA ATENCIÓN TELEFÓNICA, QUE ES NUESTRO PROPIO SERVICIO ─────────────
   *
   * Instrucción de dirección, 14 oct 2026: «tu objetivo es que nutras las
   * alertas con toda la data que tiene cada cuenta y con la información que se
   * les alimenta».
   *
   * La auditoría de PROBEMEDIC ya había escrito el hueco, con estas palabras:
   * «el motor de alertas no evalúa la atención telefónica en absoluto·…·la
   * atención telefónica se mide bien y se pinta bien, pero no tiene ningún
   * detector que la saque de la ficha. Una cuenta así sólo se descubre si
   * alguien la abre, y nadie abre una cuenta que no sale en ninguna lista».
   * Esa cuenta llevaba nueve meses con cuatro de cada diez llamadas sin llegar
   * a una persona y CERO alertas.
   *
   * Medido con `scripts/mide-fuentes-sin-alerta.py` antes de escribir nada:
   * 180 de las 193 cuentas vivas tienen lectura medible —el 93%, $1,633,640 de
   * MRR institucional— y el detector no abría el archivo ni una vez. Es la
   * fuente más grande de las que ignoraba.
   *
   * SON DOS TIPOS PORQUE SON DOS PROBLEMAS, y la curva lo enseña:
   *
   *   tasa >= 40%          17 cuentas (8.8%)   $191,377
   *   >= 10,000 perdidas   11 cuentas (5.7%)   añade 9 y $133,060
   *
   * La tasa dice que la cuenta atiende mal; el volumen dice cuánta gente se
   * queda sin respuesta. Con la tasa sola, Alianza Multimarca —40,935 llamadas
   * perdidas al 55%— y una cuenta grande que pierde veinte mil al 35% se
   * tratarían igual, y la segunda no saldría en ninguna lista. Veinte mil
   * personas que no consiguieron hablar con nadie son veinte mil pase lo que
   * pase con el porcentaje.
   *
   * El umbral del 40% no es un gusto: deja 17 cuentas, el mismo calibre que
   * `sac_fallas_recurrentes` (16, 8.3%). Con el 30% serían 42 —el 21.8% de la
   * cartera— y con el 10%, 147: un color de fondo, no una alarma. */
  | 'llamadas_sin_contestar'
  | 'llamadas_perdidas_masivas'

/**
 * QUIÉN PUEDE CERRAR LA ALERTA. No es lo mismo que de quién es la cuenta.
 *
 * Nace de medir el tablero el 6 oct 2026: de las 85 alertas críticas de
 * Claudia, 24 NO las puede cerrar ella; de las 77 de Dan, 24; de las 65 de
 * Fátima, 26. Y lo más caro: **las nueve alertas de mayor prioridad de todo el
 * tablero son `sin_consumo_medible`**, cuyo guion dice literalmente «pedir a
 * Ingeniería que la incluya». Lo primero que ve un ejecutivo al abrir el
 * tablero es trabajo que no puede hacer.
 *
 * Así murió el Radar —0 de 192 completo— y así quedaron las 383 acciones de
 * auditoría sin seguir: lo que se percibe como imposible se abandona, y se
 * lleva por delante la credibilidad de lo que sí era accionable.
 *
 * Se deriva del catálogo, así que no cuesta captura ni mantenimiento: es una
 * propiedad del TIPO de alerta, no de la cuenta ni de la persona.
 *
 * `cliente` no es una excusa. El ejecutivo tiene que llamar igual; lo que no
 * controla es que el cliente vuelva a consumir. Se trabaja, no se suelta.
 */
/* ── POR QUÉ YA NO HAY UN CUBO «cliente» ──────────────────────────────────
 *
 * Lo hubo durante unas horas el 6 oct 2026 y una revisión adversarial lo tumbó
 * con el argumento correcto: el reparto se estaba aplicando con DOS criterios
 * distintos a la misma situación.
 *
 *   `silencio_60` estaba en `asesor` — y el ejecutivo puede marcar, pero no
 *   puede hacer que le contesten; el reloj sólo lo reinicia un contacto que
 *   LLEGÓ al cliente.
 *
 *   `caida_consumo` estaba en `cliente` — y su guion dice «Llamar y preguntar
 *   qué cambió en su operación», que es exactamente la misma clase de acción.
 *
 * La misma situación en dos cubos distintos. Y el delator fue un comentario que
 * yo mismo tuve que escribir: «`cliente` no es una excusa, el ejecutivo tiene
 * que llamar igual». Cuando hay que explicar que una etiqueta no se lea como se
 * lee, la etiqueta está mal.
 *
 * Son DOS EJES, no uno: de quién es la ACCIÓN (siempre del ejecutivo, salvo
 * bloqueo real) y de qué depende el CIERRE (a veces del cliente). El segundo ya
 * vive donde debe, en el texto de `accion` de cada tipo.
 */
export type Dueno =
  | 'asesor'      // la acción es suya, aunque el cierre dependa del cliente
  | 'ingenieria'  // NO la puede cerrar: hace falta otro equipo
  | 'direccion'   // NO la puede cerrar: hace falta una decisión que nadie más toma

export const ETIQUETA_DUENO: Record<Dueno, string> = {
  asesor: 'La trabaja el ejecutivo',
  ingenieria: 'Bloqueada en Ingeniería',
  direccion: 'Necesita decisión de dirección',
}

export const ETIQUETA_DUENO_CORTA: Record<Dueno, string> = {
  asesor: 'suyas', ingenieria: 'Ingeniería', direccion: 'dirección',
}

/** Las que el ejecutivo NO puede cerrar por sí mismo. */
export const BLOQUEADA: ReadonlySet<Dueno> = new Set<Dueno>(['ingenieria', 'direccion'])

export interface DefinicionAlerta {
  tipo: TipoAlerta
  familia: Familia
  severidad: Severidad
  /** Quién puede cerrarla. Ver `Dueno`. */
  dueno: Dueno
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
    tipo: 'sin_consumo_medible', familia: 'ceguera', severidad: 'critica', dueno: 'ingenieria',
    titulo: 'No podemos ver su consumo',
    accion: 'La cuenta no aparece en el archivo de cortes. Confirmar su CID y pedir '
          + 'a Ingeniería que la incluya: sin esto no hay forma de saber si usa el servicio.',
    enlaceEtiqueta: 'Abrir ficha y verificar CID',
  },
  sin_radar: {
    tipo: 'sin_radar', familia: 'ceguera', severidad: 'alta', dueno: 'asesor',
    titulo: 'Sin una sola respuesta de Radar',
    accion: 'Responder las 12 preguntas del Radar. Son cinco minutos y es lo que '
          + 'convierte la cuenta de una fila en un diagnóstico.',
    enlaceEtiqueta: 'Responder el Radar', ancla: 'radar',
  },
  sin_contactos: {
    tipo: 'sin_contactos', familia: 'ceguera', severidad: 'alta', dueno: 'asesor',
    titulo: 'Sin un solo contacto registrado',
    accion: 'Capturar al menos un contacto con nombre, cargo y teléfono. Si mañana '
          + 'esta cuenta llama a cancelar, hoy no sabemos a quién marcarle.',
    enlaceEtiqueta: 'Capturar contactos', ancla: 'contactos',
  },
  sin_ficha: {
    tipo: 'sin_ficha', familia: 'ceguera', severidad: 'media', dueno: 'asesor',
    titulo: 'Ficha sin observaciones del KAM',
    accion: 'Escribir qué sabemos de esta cuenta: para qué la usan, quién decide, qué les duele.',
    enlaceEtiqueta: 'Completar la ficha', ancla: 'ficha',
  },
  /* Pedida por dirección el 12 oct 2026, con estas palabras: «si en alguna no
     se te facilita por falta de datos indicanos en ALERTAS para requisitar los
     campos faltantes».

     POR QUE ES SU PROPIA ALERTA Y NO UNA MAS DE `sin_ficha`
     ------------------------------------------------------
     `sin_ficha` mira UN campo —`observaciones_kam`— y pide prosa. Esta mira los
     datos DUROS sin los cuales una auditoría no se puede escribir: el giro, el
     servicio contratado y desde cuándo es cliente. Sin ellos no hay forma de
     decir si 2,000 llamadas al mes son muchas o pocas, si el consumo cuadra con
     lo contratado, ni si un deterioro es nuevo o de siempre. Y la diferencia
     que importa: un campo vacío NO es un valor neutro. Sin `giro`, la auditoría
     no puede decir «sector genérico» — tiene que decir «no se capturó», y eso
     es tarea de alguien. [[feedback-cero-sin-medicion]]

     NO SE SOLAPA con las otras tres de ceguera a propósito: `sin_radar` cubre
     el Radar, `sin_contactos` los contactos y `sin_ficha` las observaciones. Si
     esta también los contara, una cuenta recién dada de alta encendería cuatro
     alertas que dicen lo mismo y nadie leería ninguna. */
  sin_datos_auditables: {
    tipo: 'sin_datos_auditables', familia: 'ceguera', severidad: 'alta', dueno: 'asesor',
    titulo: 'Faltan datos para poder auditarla',
    accion: 'Capturar los campos que la evidencia nombra. Mientras falten, cualquier '
          + 'análisis de esta cuenta es opinión: no hay contra qué comparar sus números.',
    enlaceEtiqueta: 'Requisitar los campos', ancla: 'ficha',
  },

  // ── RIESGO ─────────────────────────────────────────────────────────────
  caida_consumo: {
    tipo: 'caida_consumo', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'Consumo cayendo tres meses seguidos',
    accion: 'Llamar y preguntar qué cambió en su operación. Una caída sostenida '
          + 'precede a la reducción de plan, no al revés.',
    enlaceEtiqueta: 'Ver la cuenta',
  },
  desplome_consumo: {
    tipo: 'desplome_consumo', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
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
    tipo: 'consumo_cero', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'Paga y no usa el servicio en absoluto',
    accion: 'Contacto inmediato con quien firma, no con el usuario operativo. Cero '
          + 'minutos en todo el periodo medido no es uso bajo: es un servicio que ya '
          + 'nadie ocupa y que se cae solo en la próxima revisión de gastos.',
    enlaceEtiqueta: 'Ver consumo y adopción', ancla: 'adopcion',
  },
  uso_bajo: {
    tipo: 'uso_bajo', familia: 'riesgo', severidad: 'alta', dueno: 'asesor',
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
    tipo: 'sin_interlocutor', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'Se llamó varias veces y no hay nadie del otro lado',
    accion: 'No es falta de seguimiento: es que ya no tenemos interlocutor. Buscar a '
          + 'otra persona por otra vía —el firmante de la factura, cobranza, el correo '
          + 'del dominio, LinkedIn— y actualizar el contacto. Una cuenta sin a quién '
          + 'marcarle se entera de que existimos el día que decide cancelar.',
    enlaceEtiqueta: 'Actualizar contactos', ancla: 'contactos',
  },
  silencio_60: {
    tipo: 'silencio_60', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'Más de 60 días sin contacto',
    accion: 'Llamar. Dos meses de silencio en una cuenta viva es una relación que '
          + 'dejó de existir.',
    enlaceEtiqueta: 'Registrar seguimiento', ancla: 'seguimientos',
  },
  silencio_30: {
    tipo: 'silencio_30', familia: 'riesgo', severidad: 'media', dueno: 'asesor',
    titulo: 'Más de 30 días sin contacto',
    accion: 'Agendar contacto esta semana antes de que se vuelva silencio largo.',
    enlaceEtiqueta: 'Registrar seguimiento', ancla: 'seguimientos',
  },
  /* El título dice «contactado» y no «seguimiento» desde el 6 oct 2026, y la
   * diferencia no es de estilo. Al dejar de contar las notas internas y los
   * tickets como contacto, esta alerta pasó de 37 a 51 cuentas: las 14 nuevas
   * SÍ tienen seguimientos escritos —hasta varios—, pero ninguno es una
   * llamada, un correo, un WhatsApp ni una reunión. Decirles «nunca se le ha
   * dado un seguimiento» a quien escribió cinco notas hace que cierre la
   * alerta por falsa, y con ella deje de creerse las demás. */
  nunca_contactada: {
    tipo: 'nunca_contactada', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'Nunca se le ha contactado',
    accion: 'Primer contacto por un canal real: llamada, correo, WhatsApp o reunión. '
          + 'Escribir notas sobre una cuenta no es haber hablado con ella.',
    enlaceEtiqueta: 'Registrar el primer contacto', ancla: 'seguimientos',
  },

  /* ── LO QUE EL EQUIPO YA ESCRIBIÓ Y NADIE LEYÓ ───────────────────────────
   *
   * Daniel Martínez: «apoyarse en IA para lo cualitativo». Nace del caso
   * Biolaboratorio Sadat, donde la propia asesora escribió «alto riesgo de
   * descontinuación» el 25 de julio y el cliente pidió la baja el 6 de octubre.
   * Setenta y tres días con la respuesta escrita en la ficha.
   *
   * Son las alertas con la evidencia más fuerte que puede haber: una CITA
   * textual de alguien del equipo, con su fecha. No hay umbral que discutir.
   * Ver `lib/senal-escrita.ts` para las cinco guardas que evitan que esto se
   * llene de falsos positivos. */
  baja_declarada: {
    tipo: 'baja_declarada', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'Alguien escribió que el cliente pidió la baja',
    accion: 'Es lo más urgente que hay en la cartera: el cliente ya lo dijo y está '
          + 'escrito. Llamar hoy a quien firma, entender qué se rompió y poner una '
          + 'contraoferta sobre la mesa antes de que la baja se procese.',
    enlaceEtiqueta: 'Ver la cuenta',
  },
  riesgo_escrito: {
    tipo: 'riesgo_escrito', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'El propio equipo escribió que la cuenta está en riesgo',
    accion: 'Alguien de la casa ya diagnosticó el riesgo por escrito y la cuenta sigue '
          + 'ahí. Releer la nota, confirmar si lo que la motivó sigue vigente y actuar '
          + 'sobre eso — no sobre una señal nueva.',
    enlaceEtiqueta: 'Ver la cuenta',
  },
  reduccion_declarada: {
    tipo: 'reduccion_declarada', familia: 'riesgo', severidad: 'alta', dueno: 'asesor',
    titulo: 'Pidió dar de baja parte del servicio',
    accion: 'No es la baja de la cuenta, y por eso no es crítica — pero una reducción '
          + 'es el ensayo de una salida. Entender qué dejó de servirle antes de que la '
          + 'siguiente reducción sea la última.',
    enlaceEtiqueta: 'Ver la cuenta',
  },

  // ── OPORTUNIDAD ────────────────────────────────────────────────────────
  rebasa_bolsa: {
    tipo: 'rebasa_bolsa', familia: 'oportunidad', severidad: 'oportunidad', dueno: 'asesor',
    titulo: 'Rebasa su bolsa de minutos',
    accion: 'Consume por encima de su plan y se le está cobrando el excedente. '
          + 'Proponer el plan que le corresponde antes de que lo note en la factura.',
    enlaceEtiqueta: 'Ver consumo',
  },

  // ── LA MESA DE AYUDA ───────────────────────────────────────────────────
  //
  // Las tres salen del «Reporte Diario Mesa de Ayuda» (`lib/mesa-ayuda.ts`,
  // 20 cortes). Los umbrales se midieron ANTES de escribirlas, con
  // `scripts/mide-alarmas-sac.py`, porque una alarma que salta en el 80% de
  // la cartera no es una alarma: es un color de fondo.
  sac_fuera_sla: {
    tipo: 'sac_fuera_sla', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'Tiene un ticket fuera de SLA',
    accion: 'Llamar al cliente HOY para decirle que lo sabemos, y escalar el folio '
          + 'con fecha comprometida. Un ticket vencido que nadie menciona se '
          + 'convierte en el motivo de la baja, y el cliente ya lo sabe.',
    enlaceEtiqueta: 'Ver la mesa de ayuda',
  },
  sac_atraso_cronico: {
    tipo: 'sac_atraso_cronico', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'Arrastra tickets vencidos corte tras corte',
    accion: 'Esto no es un mal día: es un patrón. Pedir a la mesa la revisión '
          + 'completa de la cuenta y presentarle al cliente qué se va a cambiar, '
          + 'no sólo qué se va a cerrar.',
    enlaceEtiqueta: 'Ver la mesa de ayuda',
  },
  sac_fallas_recurrentes: {
    tipo: 'sac_fallas_recurrentes', familia: 'riesgo', severidad: 'alta', dueno: 'asesor',
    titulo: 'Ha reportado varias fallas del servicio',
    accion: 'Primero estabilizar: con fallas abiertas no se propone nada. '
          + 'Revisar con Ingeniería si son la misma causa y llevarle al cliente '
          + 'el diagnóstico, no una disculpa.',
    enlaceEtiqueta: 'Ver sus tickets',
  },

  // ── LA OCTAVA FUENTE ───────────────────────────────────────────────────
  sin_importe: {
    tipo: 'sin_importe', familia: 'ceguera', severidad: 'alta', dueno: 'ingenieria',
    titulo: 'No sabemos cuánto paga',
    accion: 'La cuenta está viva y no tiene importe en ninguna fuente: ni en el '
          + 'GRC por CID, ni en su propia ficha. Confirmar el CID y pedir que se '
          + 'incluya en facturación — sin esto, esta cuenta no pesa en ninguna '
          + 'decisión que se tome por dinero.',
    enlaceEtiqueta: 'Abrir ficha y verificar CID',
  },

  // ── LA ATENCIÓN TELEFÓNICA ─────────────────────────────────────────────
  //
  // Las dos salen de `data/analisis-llamadas.json` por CID, con el mismo
  // criterio que el panel de la ficha: el denominador son las ENTRANTES, la
  // pérdida saliente no se suma —marcar y no conectar es normal— y
  // `Self_service` va del lado atendido, porque el menú sí resolvió.
  //
  // Son `riesgo` y no `ceguera`: aquí se ve perfectamente, y lo que se ve es
  // que le estamos fallando. Pero NO entran en `TIPOS_RIESGO` — ver el
  // comentario de ese conjunto.
  llamadas_sin_contestar: {
    tipo: 'llamadas_sin_contestar', familia: 'riesgo', severidad: 'critica', dueno: 'asesor',
    titulo: 'Casi la mitad de sus llamadas no las contesta nadie',
    accion: 'Mirar la pérdida POR DESTINO antes de llamar: en la mayoría de los '
          + 'casos no es falta de personal, son números que ya no apuntan a '
          + 'ningún sitio. Llevarle al cliente qué extensiones están muertas y '
          + 'qué se propone, no el porcentaje. Quien pierde la llamada es su '
          + 'cliente, no él, y por eso no se queja: no lo sabe.',
    enlaceEtiqueta: 'Ver sus llamadas', ancla: 'llamadas',
  },
  llamadas_perdidas_masivas: {
    tipo: 'llamadas_perdidas_masivas', familia: 'riesgo', severidad: 'alta', dueno: 'asesor',
    titulo: 'Miles de llamadas entrantes sin respuesta',
    accion: 'La tasa no es alarmante pero el volumen sí: son miles de personas '
          + 'que llamaron y no hablaron con nadie. Revisar el enrutamiento y los '
          + 'horarios de la cuenta, y presentarle el conteo — es la cifra que '
          + 'convierte una conversación de precio en una de servicio.',
    enlaceEtiqueta: 'Ver sus llamadas', ancla: 'llamadas',
  },
}

/**
 * EL GRUPO DE ESCALAMIENTO de cada tipo. Es la llave de los episodios.
 *
 * Sale de la estructura del detector, no de una agrupación temática: dentro de
 * cada grupo los tipos están en un ÚNICO `if/else`, o sea que son mutuamente
 * excluyentes. Por eso pasar de uno a otro es la misma historia empeorando y no
 * una alerta nueva — `silencio_30 → silencio_60` y `uso_bajo → consumo_cero`
 * son el mismo episodio, y con el tipo como llave se habría dado por cerrado el
 * día que empeoró.
 *
 * Los siete valores están replicados en el CHECK de `alertas_episodios`. Si se
 * agrega un tipo aquí hay que mirarlos los dos.
 */
export type Condicion =
  | 'medicion' | 'consumo' | 'contacto' | 'radar' | 'contactos' | 'ficha'
  /* `trabajo` ya no lo emite ningún tipo —era el grupo de las dos alertas de
     abandono, retiradas con el generador SAC—, pero SE QUEDA en el tipo porque
     hay 69 episodios abiertos en `alertas_episodios` con ese valor y hay que
     poder leerlos para cerrarlos. Quitarlo del tipo mientras la tabla lo tiene
     sería declarar imposible algo que está en la base; cierran solos en la
     siguiente corrida completa (medido: quedan 544 condiciones contra un piso
     de quórum de 368, así que el guardián no se dispara). */
  | 'trabajo'
  /* La octava, de la capa cualitativa. Los tres tipos escritos son mutuamente
     excluyentes por cuenta —se queda el más fuerte— así que forman un grupo. */
  | 'escrito'
  /* La mesa de ayuda (9 oct 2026). Los tres tipos son mutuamente excluyentes
     por construcción en el detector —crónico gana a vencido, y vencido a
     fallas— porque son la misma historia empeorando: un folio que se atora,
     que se vuelve costumbre, y el servicio que falla debajo. */
  | 'mesa'
  /* Que no sepamos cuánto paga es su propia condición: una cuenta puede no
     tener importe Y no tener consumo a la vez, así que no cabe en `medicion`
     sin romper la regla de exclusividad del grupo. */
  | 'importe'
  /* La atención telefónica (14 oct 2026). Sus dos tipos son excluyentes en el
     detector —la tasa gana al volumen— porque son la misma historia: el
     cliente final llama y no le contesta nadie.

     Y NO cabe en `consumo`: una cuenta puede consumir su plan entero y no
     contestar la mitad de lo que entra. De hecho es el caso típico — el
     consumo mide los minutos que SÍ se hablaron. */
  | 'atencion'

export const CONDICION: Record<TipoAlerta, Condicion> = {
  sin_consumo_medible: 'medicion',
  caida_consumo: 'consumo', desplome_consumo: 'consumo',
  consumo_cero: 'consumo', uso_bajo: 'consumo', rebasa_bolsa: 'consumo',
  nunca_contactada: 'contacto', sin_interlocutor: 'contacto',
  silencio_60: 'contacto', silencio_30: 'contacto',
  sin_radar: 'radar',
  sin_contactos: 'contactos',
  sin_ficha: 'ficha',
  sin_datos_auditables: 'ficha',
  baja_declarada: 'escrito', riesgo_escrito: 'escrito', reduccion_declarada: 'escrito',
  sac_atraso_cronico: 'mesa', sac_fuera_sla: 'mesa', sac_fallas_recurrentes: 'mesa',
  sin_importe: 'importe',
  llamadas_sin_contestar: 'atencion', llamadas_perdidas_masivas: 'atencion',
}

/* ── PENDIENTE EN SUPABASE, Y NO ES OPCIONAL ───────────────────────────────
 *
 * El CHECK de `alertas_episodios.condicion` sigue con los siete valores
 * originales: ya rechaza `mesa` e `importe`, y ahora también `atencion`. Esas
 * alertas se detectan, se ordenan y se pintan, pero NO ABREN EPISODIO — o sea
 * que de ellas no se puede decir «lleva 47 días así», que es la única forma de
 * anticipar en vez de contar.
 *
 * El `ALTER TABLE` está en `scripts/migracion-alertas-episodios.sql` y hay que
 * correrlo a mano en el editor de Supabase. Mientras no se corra, `diasAbierta`
 * y `recurrencia` llegan en `undefined` para estas cinco, y la pantalla dice
 * que la antigüedad no se está midiendo — que es lo correcto: un 0 ahí diría
 * «acaba de empezar» sobre una cuenta que lleva meses. [[alertas-movimiento]]
 */

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
  ceguera: 'No la vemos', riesgo: 'Se está yendo', oportunidad: 'Oportunidad',
}

export interface Alerta {
  /** ESTABLE entre cortes: la misma condición mañana es esta misma alerta. */
  id: string
  tipo: TipoAlerta
  familia: Familia
  severidad: Severidad
  /** Quién puede cerrarla; se deriva del tipo, no de la cuenta. */
  dueno: Dueno
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

  /* ── Lo que aporta la memoria de episodios ─────────────────────────────
   * Los rellena `sincronizarEpisodios` y son OPCIONALES a propósito: si la
   * tabla no existe o falla, se quedan en `undefined` y la pantalla dice que
   * la antigüedad no se está midiendo. Un 0 ahí significaría «acaba de
   * empezar» sobre una cuenta que lleva meses.
   *
   * OJO con `dias`, que ya existía y significa OTRA cosa: días sin contacto.
   * Por eso la antigüedad se llama `diasAbierta` y en pantalla se rotulan
   * distinto — «60 días sin contacto» y «abierta hace 74 días» no son lo
   * mismo, y en la misma fila conviven. */
  diasAbierta?: number | null
  nueva?: boolean
  recurrencia?: number
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
    tipo, familia: d.familia, severidad: d.severidad, dueno: d.dueno,
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

/**
 * QUÉ CUENTA ESTÁ «EN RIESGO», de verdad.
 *
 * Instrucción de dirección, 6 oct 2026: «Una cuenta con 0% de consumo o más de
 * 60 días sin contacto se marca como riesgo aunque el Health Score diga
 * Observación».
 *
 * ── POR QUÉ HACÍA FALTA DECIRLO ──────────────────────────────────────────
 *
 * El tablero definía el riesgo como `health_score < 40`, y el health score
 * MÍNIMO de toda la cartera viva es 43. El indicador marcaba 0 cuentas y $0 en
 * riesgo, y lo iba a seguir marcando pasara lo que pasara con los clientes:
 * estaba muerto por construcción, no por falta de datos. Un indicador que nunca
 * cambia entrena a no mirarlo.
 *
 * ── POR QUÉ `nunca_contactada` NO ENTRA ──────────────────────────────────
 *
 * Porque metería 100 cuentas más y el indicador pasaría de marcar el 0% de la
 * cartera a marcar el 68%, que es la misma inutilidad por el otro lado. Y
 * además no es lo que dice: «no hay registro de un contacto» es un hueco de
 * REGISTRO —ceguera—, no una señal de que el cliente se esté yendo. Vive en su
 * familia, que para eso están separadas.
 *
 * `sin_interlocutor` sí entra aunque dirección no lo nombrara: son dos o más
 * intentos seguidos sin que nadie responda, que es estrictamente peor que
 * sesenta días de silencio. Es lo que tenía Biolaboratorio Sadat el día que
 * nadie lo vio.
 *
 * Medido: 33 cuentas de 192 (17%), $386,020, seis de ellas TOP.
 */
export const TIPOS_RIESGO: ReadonlySet<TipoAlerta> = new Set<TipoAlerta>([
  'consumo_cero', 'silencio_60', 'sin_interlocutor',
  /* Si alguien del equipo ESCRIBIÓ que el cliente pidió la baja o que la cuenta
     está en riesgo, no hace falta ninguna otra señal: es la evidencia más
     directa que puede haber. `reduccion_declarada` NO entra — una reducción
     duele pero no es que se vaya. */
  'baja_declarada', 'riesgo_escrito',
  /* LA MESA ENTRA AQUÍ, y no es una ampliación cosmética (9 oct 2026).
   *
   * El riesgo de baja mejor documentado de esta cartera —Polak Grupo— tiene
   * causa raíz INTERNA escrita en su propio expediente: descontinuación de
   * Legacy y meses de llamadas caídas. El servicio que falla es el motivo de
   * baja mejor documentado que tenemos, y no contaba como riesgo en ninguna
   * parte.
   *
   * ESTA PROSA DECÍA «el único churn confirmado de esta cartera —Polak Grupo,
   * contrato ya firmado con otro proveedor—» Y ERA FALSO. Corregido el 14 oct
   * 2026 por dirección —«aún está vivo, aún no se tramita su churn
   * definitivo»— y comprobado contra las tres fuentes el mismo día:
   *
   *   ficha de Supabase ........ estado `activo`, asesor Fátima
   *   cancelados publicados .... NO aparece
   *   Gross Revenue ............ `churn` nulo, y mrrIni $26,980 → mrrFin
   *                              $30,630: la facturación SUBIÓ un 13.5%
   *
   * Lo que sí dice su ficha es «No me atiende llamada, correo ni whatsapp
   * desde junio 2026», con último contacto el 12 de agosto. O sea: cuenta
   * viva, pagando más que antes, sin interlocutor desde hace meses y con
   * miles de llamadas entrantes perdiéndose. Ese es el retrato, y es peor
   * de trabajar que una baja: una baja ya no se puede evitar.
   *
   * Darla por perdida en un comentario es cómo se suelta una cuenta
   * recuperable. [[feedback-conciliacion-churn]]: ninguna baja sin
   * autorización, y una baja es pasar a Dormida, nunca darla por hecha.
   *
   * Entran los DOS de atraso: un folio fuera de SLA es que hoy le estamos
   * fallando, y arrastrarlo corte tras corte es que ya no lo notamos. No entra
   * `sac_fallas_recurrentes`: una falla es un problema de calidad y hay 16
   * cuentas con tres o más — meterlas aquí inflaría el KPI «En Riesgo» de 33
   * a 49 y lo volvería a hacer inútil por el otro lado, que es justo el error
   * que este conjunto estrecho existe para no repetir. Sigue siendo familia
   * `riesgo`, así que bloquea la luz verde y sale en rojo en la ficha. */
  'sac_fuera_sla', 'sac_atraso_cronico',
  /* LAS DE ATENCIÓN TELEFÓNICA NO ENTRAN, por la misma razón medida y por
     coherencia con la decisión de arriba (14 oct 2026).
     `llamadas_sin_contestar` son 17 cuentas y `llamadas_perdidas_masivas`
     añade 9: el KPI «En Riesgo» pasaría de 33 a 59 cuentas, el 31% de la
     cartera, y volvería a ser inútil por el otro lado. Es el calibre de
     `sac_fallas_recurrentes`, que se quedó fuera por lo mismo.

     No es que no sean riesgo —son familia `riesgo`, bloquean la luz verde y
     salen en rojo en la ficha—: es que el conjunto estrecho de dirección
     responde a «¿cuántas cuentas se están yendo?», y para eso hace falta que
     siga siendo una lista que alguien pueda recorrer el lunes. */
])

export interface CuentaEnRiesgo {
  cuentaId: string
  empresa: string
  asesor: string | null
  mrr: number
  esTop: boolean
  /** Por qué, para que el número se pueda defender cuenta por cuenta. */
  motivos: TipoAlerta[]
}

/** Las cuentas en riesgo, con su dinero y su motivo. El MRR es por cuenta. */
export function riesgoPorCuenta(alertas: Alerta[]): Map<string, CuentaEnRiesgo> {
  const m = new Map<string, CuentaEnRiesgo>()
  for (const a of alertas) {
    if (!TIPOS_RIESGO.has(a.tipo)) continue
    const prev = m.get(a.cuentaId)
    if (prev) { prev.motivos.push(a.tipo); continue }
    m.set(a.cuentaId, {
      cuentaId: a.cuentaId, empresa: a.empresa, asesor: a.asesor,
      mrr: a.mrr, esTop: a.esTop, motivos: [a.tipo],
    })
  }
  return m
}

/** Resumen para la cabecera del panel. Las particiones CIERRAN. */
export interface ResumenAlertas {
  total: number
  cuentas: number
  mrrEnRiesgo: number
  porSeveridad: Record<Severidad, { n: number; mrr: number }>
  porFamilia: Record<Familia, { n: number; mrr: number }>
  porDueno: Record<Dueno, { n: number; mrr: number }>
  /**
   * Por ejecutivo, con lo suyo separado de lo que no puede cerrar.
   *
   * `n` sigue siendo el total porque la cuenta es suya y el riesgo también:
   * nadie se desentiende de una cuenta porque el dato lo deba otro equipo. Lo
   * que cambia es que ya no se le reprocha el tiempo de lo ajeno.
   */
  porAsesor: Record<string, {
    n: number; mrr: number; criticas: number; top: number
    /** Las que puede cerrar por sí mismo, esta semana. */
    propias: number
    /** Críticas que puede cerrar por sí mismo: el número con el que se trabaja. */
    criticasPropias: number
    /** Las que NO puede cerrar: Ingeniería o decisión de dirección. */
    bloqueadas: number
    mrrBloqueado: number
  }>
  topEnRiesgo: number
}

export function resumir(alertas: Alerta[]): ResumenAlertas {
  const vacio = () => ({ n: 0, mrr: 0 })
  const porSeveridad = {
    critica: vacio(), alta: vacio(), media: vacio(), oportunidad: vacio(),
  } as Record<Severidad, { n: number; mrr: number }>
  const porFamilia = {
    ceguera: vacio(), riesgo: vacio(), oportunidad: vacio(),
  } as Record<Familia, { n: number; mrr: number }>
  const porDueno = {
    asesor: vacio(), ingenieria: vacio(), direccion: vacio(),
  } as Record<Dueno, { n: number; mrr: number }>
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
    porDueno[a.dueno].n++
    const k = a.asesor || '(sin asesor)'
    porAsesor[k] ??= { n: 0, mrr: 0, criticas: 0, top: 0,
                       propias: 0, criticasPropias: 0, bloqueadas: 0, mrrBloqueado: 0 }
    porAsesor[k].n++
    if (a.severidad === 'critica') porAsesor[k].criticas++
    if (BLOQUEADA.has(a.dueno)) {
      porAsesor[k].bloqueadas++
    } else {
      porAsesor[k].propias++
      if (a.severidad === 'critica') porAsesor[k].criticasPropias++
    }
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
  unicaPor(a => a.dueno, porDueno as Record<string, { n: number; mrr: number }>)
  const vistoAsesor = new Map<string, Set<string>>()
  const vistoBloq = new Map<string, Set<string>>()
  for (const a of alertas) {
    const k = a.asesor || '(sin asesor)'
    const s = vistoAsesor.get(k) ?? new Set<string>()
    if (!s.has(a.cuentaId)) {
      s.add(a.cuentaId)
      porAsesor[k].mrr += a.mrr
      if (a.esTop) porAsesor[k].top++
    }
    vistoAsesor.set(k, s)
    // El MRR bloqueado también por cuenta única: una cuenta con dos alertas de
    // Ingeniería es su MRR, no el doble. Misma razón que arriba.
    if (BLOQUEADA.has(a.dueno)) {
      const b = vistoBloq.get(k) ?? new Set<string>()
      if (!b.has(a.cuentaId)) { b.add(a.cuentaId); porAsesor[k].mrrBloqueado += a.mrr }
      vistoBloq.set(k, b)
    }
  }

  let mrr = 0
  for (const v of mrrPorCuenta.values()) mrr += v
  const topEnRiesgo = new Set(alertas.filter(a => a.esTop).map(a => a.cuentaId)).size

  return {
    total: alertas.length, cuentas: cuentasVistas.size, mrrEnRiesgo: mrr,
    porSeveridad, porFamilia, porDueno, porAsesor, topEnRiesgo,
  }
}
