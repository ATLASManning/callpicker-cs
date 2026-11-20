import { esIndicioDeBaja, CONDICION, type Alerta, type TipoAlerta } from '@/lib/alertas'

/**
 * lib/alertas-veredicto.ts — EL VEREDICTO DE UNA CUENTA, Y SU ÚNICA ACCIÓN
 *
 * ── POR QUÉ EXISTE, Y QUÉ CORRIGE ──────────────────────────────────────────
 *
 * Instrucción de dirección, 7 oct 2026: «la idea es volvernos eficientes con las
 * cuentas y no hacer tareas innecesarias, deben ser con inteligencia».
 *
 * Es una corrección a lo que yo había construido, y tiene razón. El generador de
 * huecos abría una tarea por CAMPO VACÍO: faltaba el correo, una tarea; faltaba
 * el NPS, otra; faltaba el consumo, otra. Tech People salía con tres tareas el
 * mismo lunes y GRUPO TORRES CORZO con cuatro. Eso no es trabajo, es una lista
 * de la compra — y una lista de la compra se archiva.
 *
 * Una cuenta con consumo en cero, noventa días sin contacto y un ticket fuera de
 * SLA no tiene tres problemas: tiene UNO, se está yendo, y las tres cosas son la
 * evidencia. El asesor necesita saber eso y llamar, no tachar tres casillas.
 *
 * ── CÓMO SE DECIDE ─────────────────────────────────────────────────────────
 *
 * Las situaciones están ORDENADAS y gana la primera que aplica. No se suman
 * puntos ni se pondera: un score oculta el porqué, y el porqué es lo único que
 * hace que alguien levante el teléfono. Cada veredicto sale con sus pruebas
 * citadas, de modo que se puede discutir cuenta por cuenta — que es lo que
 * dirección pidió cuando dijo «con total objetividad».
 *
 * ── LOS TRES TIPOS DE HALLAZGO ─────────────────────────────────────────────
 *
 * Dirección los nombró así: «todos los hallazgos que tienen las cuentas, tanto
 * de entrega al cliente como de trabajo en el análisis, riesgos».
 *
 *   · `riesgo`   — lo que amenaza la cuenta. Son los 18 tipos de alerta.
 *   · `entrega`  — lo que se le puede MOSTRAR al cliente y hoy no ve: sus
 *                  llamadas perdidas, sus horas pico, lo que paga y no usa.
 *                  Es la materia del Informe de Valor.
 *   · `analisis` — lo que nos falta a NOSOTROS para poder opinar: el archivo de
 *                  llamadas, la auditoría, el dato de ficha.
 *
 * Los tres se publican siempre. La acción sale de los tres juntos.
 */

/** Qué le pasa a esta cuenta, en una palabra. Ordenadas por urgencia. */
export type Situacion =
  | 'se_va'          // hay señal de salida, escrita o medida
  | 'apagandose'     // el uso cae o se detuvo, y nadie ha hablado con ella
  | 'no_la_vemos'    // faltan los datos para poder opinar
  | 'sin_auditar'    // hay datos, falta el análisis
  | 'hay_que_mostrarle' // hay material de valor sin presentar
  | 'oportunidad'    // la casa en orden y espacio para crecer
  | 'en_orden'       // nada que hacer esta semana

export type ClaseHallazgo = 'riesgo' | 'entrega' | 'analisis'

/**
 * CUÁNTO GRITA UN HALLAZGO. Por omisión no grita: `undefined` se pinta como
 * hasta ahora, así que ningún hallazgo existente cambia de aspecto.
 */
export type PesoHallazgo = 'critica' | 'alta' | 'media'

export interface Hallazgo {
  clase: ClaseHallazgo
  titulo: string
  /** La cifra o la frase que lo sostiene. Un hallazgo sin prueba no se publica. */
  prueba: string
  /** Opcional. Si viene, la ficha lo pinta con el peso que le corresponde. */
  peso?: PesoHallazgo
}

/**
 * LA BRECHA ENTRE EL PLAN Y EL CONSUMO, EN TRAMOS.
 *
 * ── POR QUÉ UNA ESCALA Y NO UN UMBRAL ──────────────────────────────────────
 * Hasta el 20 nov 2026 esto era UNA condición: por debajo del 40% se encendía
 * «Está pagando por minutos que no usa» y por encima no se decía nada. Dos
 * cosas lo rompían.
 *
 * La primera es que el 40% dejaba fuera a cuentas que sí tienen la brecha: una
 * que usa el 55% de lo que paga está desaprovechando casi la mitad del plan y
 * la ficha callaba. Dirección pidió el 20 nov 2026 que se cubran **todos los
 * casos donde el consumo va por debajo del plan**, no un tramo.
 *
 * La segunda es que un solo umbral pinta igual a quien no enciende el teléfono
 * y a quien usa el 38%. Son conversaciones distintas: a la primera se le
 * rescata la adopción o se le sustituye el producto, a la segunda se le ajusta
 * el plan. Un color plano para las dos no ayuda a elegir por cuál empezar.
 *
 * ── POR QUÉ EL ÚLTIMO TRAMO NO ES UNA ALARMA ───────────────────────────────
 * Medido el 20 nov 2026 sobre la cartera viva: **137 de 148 cuentas medibles
 * —el 93%— consumen por debajo de su plan.** Si las 137 se pintaran en rojo, el
 * rojo dejaría de distinguir nada. Y entre el 70% y el 95% el plan está BIEN
 * dimensionado: decirle a esa cuenta que paga minutos que no usa sería falso.
 * Por eso ese tramo lleva `sobra: false` — se cubre, que es lo que se pidió,
 * pero no como una alarma.
 *
 * ── QUIÉN ALARMA, DESDE EL 20 NOV 2026 ─────────────────────────────────────
 * No esta escala: el DETECTOR. Dirección reclasificó la brecha como indicio de
 * downgrade, y `consumo_cero`, `uso_bajo` y `plan_sobrado` la emiten como
 * ALERTA de 0% a 70% —el mismo 70 que separa aquí `sobra` de bien
 * dimensionado—, así que llegan a la ficha por el bucle de alertas, en clase
 * `riesgo` y con su peso. Esta escala se quedó con el oficio de PONER LAS
 * PALABRAS, y sólo se publica cuando el detector no ha dicho nada.
 *
 * El 70 vive en los dos sitios —aquí y en `UMBRALES.planSobrado`— porque son
 * dos capas distintas, y `scripts/mide-brecha-colores.mjs` falla si se
 * separan. Un espejo que nadie comprueba deja de ser espejo.
 *
 * ── DÓNDE ACABA ESTA ESCALA, Y POR QUÉ NO EN 100 ───────────────────────────
 * Cierra en **95**, no en 100, porque a partir del 95% ya habla otra tarjeta:
 * «Se está acercando al límite de su plan», unas líneas más abajo. Si esta
 * escala llegara a 100, una cuenta al 97% publicaría A LA VEZ «su plan está
 * bien dimensionado» y «se está acercando al límite» — dos frases que se
 * contradicen en la misma columna de la misma ficha. Entre 95 y 100 manda la
 * del límite, que es la que trae la consecuencia (rebasar se cobra).
 *
 * El tramo se elige por el PRIMER `hasta` que el porcentaje no alcanza, así que
 * la lista tiene que ir de menor a mayor. `scripts/mide-brecha-colores.mjs` lo
 * comprueba, y comprueba también que no quede un hueco entre dos tramos: un
 * hueco dejaría cuentas sin tarjeta sin que fallara nada.
 */
export const BRECHA_CONSUMO: ReadonlyArray<{
  hasta: number
  /** ¿Le sobra plan? En el último tramo NO: ahí está bien dimensionado, y
   *  decirle que paga minutos que no usa sería falso. */
  sobra: boolean
  titulo: string
}> = [
  { hasta: 1,  sobra: true,  titulo: 'No está usando el plan que paga' },
  { hasta: 15, sobra: true,  titulo: 'Está pagando por minutos que casi no usa' },
  { hasta: 40, sobra: true,  titulo: 'Está pagando por minutos que no usa' },
  { hasta: 70, sobra: true,  titulo: 'Su plan le queda grande' },
  { hasta: 95, sobra: false, titulo: 'Su plan está bien dimensionado' },
]

/** Donde empieza a mandar la tarjeta del límite. La escala de arriba cierra
 *  justo aquí, y el medidor falla si los dos números se separan. */
export const UMBRAL_CERCA_DEL_LIMITE = 95

/** El tramo de la escala al que cae un porcentaje, o `null` si rebasa. */
export function tramoBrecha(pct: number) {
  return BRECHA_CONSUMO.find(t => pct < t.hasta) ?? null
}

/** El semáforo de ALERTAS. Cinco estados, y NO cuelga del Health Score. */
export type Luz = 'rojo' | 'naranja' | 'amarillo' | 'azul' | 'verde' | 'gris'

export interface Veredicto {
  situacion: Situacion
  luz: Luz
  /** Lo que hay que hacer, en imperativo y en una línea. Una sola. */
  accion: string
  /** De quién es: el asesor, o dirección cuando la plataforma tiene que cambiar. */
  dueno: 'asesor' | 'direccion'
  /** Por qué, citando las pruebas. Es lo que se discute en la junta. */
  porque: string
  hallazgos: Hallazgo[]
  /** Qué falta por conseguir, si falta algo. Una petición, no nueve. */
  pedir: string | null
}

/**
 * Lo que se sabe de una cuenta cuando se va a juzgar.
 *
 * Todo `null` significa NO MEDIDO, nunca cero. La diferencia decide el
 * veredicto: una cuenta con consumo 0 se está apagando; una con consumo `null`
 * no se sabe, y confundirlas manda al asesor a pelear con el cliente equivocado.
 * Ver [[feedback-cero-sin-medicion]].
 */
export interface EstadoCuenta {
  cuentaId: string
  empresa: string
  asesor: string | null
  mrr: number | null
  esTop: boolean
  alertas: Alerta[]
  /** % de la bolsa consumido en el último corte. `null` = sin corte. */
  consumoPct: number | null
  /** Días desde el último contacto POR CANAL REAL. `null` = nunca hubo. */
  diasSinContacto: number | null
  /** `true` si hay lectura de llamadas de esta cuenta. */
  tieneLlamadas: boolean
  /** Llamadas perdidas y su parte, cuando hay lectura. */
  perdidas: number | null
  pctPerdidas: number | null
  /** `true` si existe un caso de auditoría para esta cuenta. */
  tieneAuditoria: boolean
  /** Candidatura de crecimiento detectada. */
  candidatura: string | null
  /** Productos contratados sin uso, si se sabe. */
  productosSinUso: number | null
  /** Tickets cerrados en el histórico. `null` = la cuenta no pasa por la mesa. */
  tickets: number | null
  /** Fallas registradas por la mesa. Una falla es distinta de una consulta. */
  fallas: number
  /** Reuniones con el cliente. Cero no es lo mismo que nunca haberlo visto:
   *  es que no se registró ninguna. */
  reuniones: number
  /** Qué tan construida está la relación, 0-100, de `lib/relacionamiento.ts`. */
  relacionPct: number
  /** De cuántas de las ocho fuentes hay dato. Es la confianza de la predicción
   *  dicha en números, y entra en el veredicto: con dos fuentes no se acusa a
   *  nadie de nada, se pide el resto. */
  fuentes: number
}

/* Los tipos de alerta que significan SALIDA, no deterioro. Se separan a
   propósito: una baja escrita por el asesor no es lo mismo que un consumo bajo,
   y tratarlas igual retrasa la llamada que sí urge. */
const SALIDA: ReadonlySet<TipoAlerta> = new Set([
  'baja_declarada', 'riesgo_escrito', 'reduccion_declarada',
] as TipoAlerta[])

const UMBRAL_SILENCIO = 60      // días sin contacto real que ya preocupan
const UMBRAL_SILENCIO_GRAVE = 90
const UMBRAL_CONSUMO_BAJO = 10  // % de la bolsa

function dinero(n: number | null): string {
  return n === null ? 'un importe que no está en ninguna fuente'
                    : `$${n.toLocaleString('es-MX', { maximumFractionDigits: 0 })} al mes`
}

/** Los hallazgos de la cuenta, en las tres clases que pidió dirección. */
export function hallazgosDe(e: EstadoCuenta): Hallazgo[] {
  const h: Hallazgo[] = []

  /* ── Las alertas ya detectadas, cada una en SU clase ───────────────────
   *
   * La clase sale de la FAMILIA del catálogo, no de un «todo es riesgo». Las
   * tres familias caen limpias en las tres clases que nombró dirección:
   * `riesgo` es que el cliente se está yendo, `ceguera` es exactamente «lo que
   * nos falta a NOSOTROS para poder opinar», y `oportunidad` —hoy sólo
   * `rebasa_bolsa`— es algo que mostrarle.
   *
   * Antes entraban TODAS como riesgo, y se veía: en la ficha de Salud y Hogar
   * el guion citaba «Sin una sola respuesta de Radar» como su amenaza más
   * grave cuando lo que de verdad la tiene a punto de irse es una frase
   * escrita por su asesor. Un hueco de captura nuestro no es una señal de que
   * el cliente se vaya, y mezclarlos entierra la que sí lo es.
   *
   * No mueve ninguna compuerta del veredicto: el riesgo lo decide `riesgoVivo`
   * sobre las alertas, y el umbral de entrega cuenta la clase `entrega`. */
  /* 16 NOV 2026 — LA CLASE `riesgo` LA DECIDE `esIndicioDeBaja`, NO LA FAMILIA.
   *
   * Dirección acotó las alertas a «indicios que puedan favorecer una solicitud
   * de baja o downgrade», y la ficha tiene que decir lo mismo que el panel: si
   * en `/alertas` una cuenta no sale y al abrirla su ficha la pinta en rojo,
   * son dos tableros distintos del mismo día.
   *
   * Lo que se mueve de `riesgo` a `analisis` son dos tipos de la familia
   * `riesgo` que hablan de NOSOTROS y no del cliente: `nunca_contactada` —que
   * salta en 91 de 189 cuentas— y `silencio_30`. Siguen en la ficha, con su
   * prueba, bajo «lo que nos falta».
   *
   * OJO, Y ESTO NO ES UNA INCOHERENCIA: `riesgoVivo` más abajo SIGUE mirando la
   * familia, así que esos dos tipos siguen bloqueando la luz verde igual que
   * antes. Son dos preguntas distintas —«¿sobre qué alertamos?» y «¿puedo
   * declarar esta cuenta en orden?»— y la segunda se contesta con más cautela
   * que la primera. El 8 oct 2026 una luz verde se pintó sobre tres cuentas con
   * alerta crítica por relajar justo esto; no se vuelve a tocar a la baja. */
  /* EL PESO VISUAL DE UNA ALERTA ES SU PROPIA SEVERIDAD, traducida.
   *
   * Son dos vocabularios y a propósito no se unificaron en un tipo: la
   * severidad del catálogo ordena el TRABAJO —`prioridad()` la multiplica por
   * el MRR— y el peso sólo decide cuánto grita la ficha. Mezclarlos haría que
   * tocar un color moviera la cola del lunes.
   *
   * `oportunidad` no aparece aquí a propósito, y no es un olvido: una alerta de
   * esa severidad nunca es indicio de baja —hoy es `rebasa_bolsa`, que es una
   * venta— así que sale por la rama `entrega` y no llega a pedir peso. El
   * `?? undefined` de abajo lo deja sin pintar si algún día llegara. */
  const PESO_DE_SEVERIDAD: Record<string, PesoHallazgo | undefined> = {
    critica: 'critica', alta: 'alta', media: 'media',
  }
  for (const a of e.alertas) {
    const clase: ClaseHallazgo = esIndicioDeBaja(a) ? 'riesgo'
                               : a.familia === 'oportunidad' ? 'entrega'
                               : 'analisis'
    /* Sólo las que son indicio pesan. Un hueco de captura nuestro —`analisis`—
       no se pinta en rojo aunque el catálogo lo tenga por crítico: es crítico
       para nosotros, no para el cliente, y es justo la distinción que dirección
       trazó el 16 nov 2026. */
    h.push({ clase, titulo: a.titulo, prueba: a.evidencia,
             peso: clase === 'riesgo' ? PESO_DE_SEVERIDAD[a.severidad] : undefined })
  }

  /* ── UN HECHO SE DICE UNA VEZ ──────────────────────────────────────────
   *
   * Lo que sigue son comprobaciones propias del veredicto, y dos de ellas
   * repiten con otras palabras algo que el CATÁLOGO ya acaba de decir en el
   * bucle de arriba. Medido el 8 oct 2026 sobre las 192 cuentas vivas:
   *
   *   «No hay medición de consumo»          49 cuentas, y las 49 llevaban
   *   «No podemos ver su consumo»           también ésta. Cero excepciones.
   *
   *   «No hay un solo contacto registrado» 101 cuentas, y las 93 que llevan
   *   «Nunca se le ha contactado»           la de riesgo llevaban las DOS.
   *
   * O sea 142 fichas afirmando lo mismo dos veces, y —lo que de verdad
   * importa— dos barras en cualquier gráfica que agregue por hallazgo, que se
   * leen como un error de conteo. No es que sobre una de las dos medidas: es
   * que son LA MISMA medida contada por dos caminos.
   *
   * No se borra la comprobación, se calla cuando su gemela ya habló: las 8
   * cuentas que tienen el hueco de contacto sin que la alerta de riesgo haya
   * disparado SÍ lo dicen, porque ahí nadie más lo está diciendo.
   *
   * El mapa va por título y no por tipo porque el catálogo entra aquí ya
   * aplanado a `{clase, titulo, prueba}` — el `TipoAlerta` se pierde en el
   * push de arriba. Si algún día hace falta algo más fino, lo que hay que
   * cambiar es eso, no esto. */
  const GEMELA: Record<string, string> = {
    'No hay medición de consumo':         'No podemos ver su consumo',
    'Sin historial de conversaciones':    'Nunca se le ha contactado',
  }
  const yaDicho = new Set(h.map(x => x.titulo))
  const anota = (x: Hallazgo) => {
    const g = GEMELA[x.titulo]
    if (g && yaDicho.has(g)) return
    h.push(x)
    yaDicho.add(x.titulo)
  }

  /* ── ENTREGA: lo que se le puede MOSTRAR y hoy no ve ──────────────────── */
  if (e.tieneLlamadas && e.perdidas !== null && e.perdidas > 0) {
    h.push({
      clase: 'entrega',
      titulo: 'Llamadas que se le están escapando',
      prueba: `${e.perdidas.toLocaleString('es-MX')} entrantes sin contestar`
            + (e.pctPerdidas !== null ? `, el ${e.pctPerdidas.toFixed(0)}% de las que recibe` : ''),
    })
  }
  if (e.productosSinUso !== null && e.productosSinUso > 0) {
    h.push({
      clase: 'entrega',
      titulo: 'Capacidades que paga y no aprovecha',
      prueba: `${e.productosSinUso} producto(s) contratados sin uso registrado`,
    })
  }
  /* ── LA BRECHA ENTRE EL PLAN Y EL CONSUMO ─────────────────────────────────
   *
   * Desde el 20 nov 2026 la brecha es un INDICIO DE DOWNGRADE por decisión de
   * dirección, y lo que la emite es el DETECTOR: `consumo_cero`, `uso_bajo` y
   * `plan_sobrado` cubren de 0% a 70% y ya entraron arriba, en clase `riesgo`,
   * con su peso. Esta comprobación se queda para lo que ninguna de las tres
   * dice.
   *
   * Y SE CALLA CUANDO SU GEMELA YA HABLÓ, que es la regla de este bloque. Las
   * dos miden la brecha por caminos distintos —el detector mira el PICO de los
   * cinco cortes, esto mira el ÚLTIMO— así que publicadas juntas darían dos
   * porcentajes distintos del mismo hecho en la misma columna. Es exactamente
   * lo que pasó con «No hay medición de consumo» en 49 fichas.
   *
   * Cuando el detector NO ha hablado, esto sí dice algo que nadie más dice: una
   * cuenta con pico del 80% y último mes al 24% no abre alerta —su plan está
   * bien dimensionado para su mes bueno— y aun así cerró el periodo usando una
   * cuarta parte. Eso es información para la llamada, no una alarma.
   *
   * El silencio se decide por CONDICIÓN y no por una lista de títulos: los
   * cinco tipos de consumo son los que `CONDICION` manda a `'consumo'`, y
   * preguntárselo a ese mapa es lo que hace que un tipo nuevo —como lo fue
   * `plan_sobrado` hoy mismo— entre solo, sin que nadie se acuerde de añadirlo
   * aquí. Una lista tecleada aparte es la que se queda corta sin fallar. */
  const yaHabloElDetector = e.alertas.some(a => CONDICION[a.tipo] === 'consumo')
  if (e.consumoPct !== null && !yaHabloElDetector) {
    const t = tramoBrecha(e.consumoPct)
    if (t) {
      anota({
        clase: 'entrega',
        titulo: t.titulo,
        prueba: `consume el ${e.consumoPct.toFixed(0)}% de su bolsa`
              + (t.sobra ? `; le sobra el ${(100 - e.consumoPct).toFixed(0)}%` : ''),
        /* Sin peso: la alarma la lleva la alerta, en `riesgo`. Si esto también
           gritara, una misma cuenta tendría dos cajas rojas por un solo hecho. */
      })
    }
  }
  if (e.consumoPct !== null && e.consumoPct >= UMBRAL_CERCA_DEL_LIMITE) {
    h.push({
      clase: 'entrega',
      titulo: 'Se está acercando al límite de su plan',
      prueba: `consume el ${e.consumoPct.toFixed(0)}% de su bolsa; rebasar se cobra`,
      peso: 'media',
    })
  }

  /* ── ANÁLISIS: lo que nos falta a NOSOTROS para poder opinar ──────────── */
  if (!e.tieneLlamadas) {
    h.push({ clase: 'analisis', titulo: 'No hay lectura de sus llamadas',
             prueba: 'esta cuenta no aparece en el reporte; su atención es no medible' })
  }
  if (e.consumoPct === null) {
    anota({ clase: 'analisis', titulo: 'No hay medición de consumo',
            prueba: 'sin corte de facturación: no se sabe cuánto de su plan usa' })
  }
  if (!e.tieneAuditoria) {
    anota({ clase: 'analisis', titulo: 'La cuenta no tiene auditoría',
            prueba: 'nadie ha escrito el análisis de esta cuenta' })
  }
  /* El título decía «No hay un solo contacto registrado» y el catálogo tiene
     «Sin un solo contacto registrado» para algo DISTINTO: aquél es que no hay
     una conversación en el historial, éste que no hay una PERSONA capturada en
     la ficha. Dos hechos que no se implican —25 cuentas tienen conversaciones
     y ninguna persona, 35 al revés— con dos títulos que sólo se diferencian en
     la primera palabra. Como etiqueta de una barra eran indistinguibles. */
  if (e.diasSinContacto === null) {
    anota({ clase: 'analisis', titulo: 'Sin historial de conversaciones',
            prueba: 'ni llamada, ni correo, ni WhatsApp, ni reunión en el historial' })
  }
  if (e.tickets === null || e.tickets === 0) {
    h.push({ clase: 'analisis', titulo: 'No pasa por la mesa de ayuda',
             prueba: 'cero tickets en el histórico: o no tiene incidencias, o se '
                   + 'atienden por fuera y no se ven' })
  }
  if (e.reuniones === 0) {
    h.push({ clase: 'analisis', titulo: 'Nunca se ha registrado una reunión',
             prueba: 'no hay junta con el cliente en el historial' })
  }

  /* ── RIESGO que no viene del catálogo de alertas ──────────────────────── */
  if (e.fallas > 0) {
    h.push({
      clase: 'riesgo',
      titulo: 'Ha reportado fallas del servicio',
      prueba: `${e.fallas} ${e.fallas === 1 ? 'falla registrada' : 'fallas registradas'} `
            + `en la mesa de ayuda`,
    })
  }
  if (e.relacionPct < 30 && e.fuentes >= 3) {
    h.push({
      clase: 'riesgo',
      titulo: 'La relación está sin construir',
      prueba: `${e.relacionPct}% de relacionamiento: pocos contactos, pocas `
            + `reuniones y poco rastro de trabajo sobre la cuenta`,
    })
  }

  /* ── ENTREGA que sale de la mesa ──────────────────────────────────────── */
  if (e.tickets !== null && e.tickets > 0) {
    h.push({
      clase: 'entrega',
      titulo: 'Lo que le hemos resuelto',
      prueba: `${e.tickets} ${e.tickets === 1 ? 'ticket atendido' : 'tickets atendidos'}`
            + (e.fallas > 0 ? `, ${e.fallas} de ellos por falla` : ''),
    })
  }

  return h
}

/**
 * El veredicto. Gana la PRIMERA situación que aplica — no se suman puntos.
 *
 * El orden es el de la urgencia real, y está pensado para que el asesor abra la
 * lista y lea de arriba abajo sin tener que decidir él qué es más grave.
 */
export function veredictoDe(e: EstadoCuenta): Veredicto {
  const hallazgos = hallazgosDe(e)
  const pruebas = (cls: ClaseHallazgo) => hallazgos.filter(x => x.clase === cls)

  const salida = e.alertas.filter(a => SALIDA.has(a.tipo))
  /* TODA alerta que el CATÁLOGO clasifica como «el cliente se está yendo».
   *
   * No es lo mismo que las compuertas de consumo y silencio de más abajo, y
   * esa diferencia costó una mentira en pantalla el 8 oct 2026: los umbrales
   * de aquí se escribieron a mano y se separaron de los que de verdad emiten
   * las alertas. El detector dispara `silencio_60` pasados los SESENTA días y
   * la compuerta del paso 2 pedía NOVENTA, así que el tramo 61-89 se colaba
   * entero; `consumo_cero` salta por debajo de 0.5% y la compuerta pedía <= 0;
   * y `nunca_contactada` deja `diasSinContacto` en `null`, con lo que se
   * saltaba todas las compuertas de silencio, que están guardadas con
   * `!== null`.
   *
   * Resultado medido: VAEO salía en VERDE diciendo «sin señal de riesgo» con
   * dos alertas críticas —consumo de 81% a 48% en tres meses, y nunca
   * contactada— listadas en rojo en su misma tarjeta. Tres de las seis
   * «oportunidades» estaban así.
   *
   * La deriva se arregla no teniendo dos definiciones: quien dice si una
   * cuenta tiene riesgo es el catálogo, que es quien emitió la alerta. */
  const riesgoVivo = e.alertas.filter(a => a.familia === 'riesgo')
  const silencio = e.diasSinContacto
  const consumoCero = e.consumoPct !== null && e.consumoPct <= 0
  const consumoBajo = e.consumoPct !== null && e.consumoPct < UMBRAL_CONSUMO_BAJO

  /* ── 1. SE VA ─────────────────────────────────────────────────────────── */
  if (salida.length) {
    return {
      situacion: 'se_va', luz: 'rojo', dueno: 'asesor',
      accion: 'Llamar esta semana y confirmar qué está pasando',
      porque: `Hay señal de salida escrita: «${salida[0].evidencia}». `
            + `Son ${dinero(e.mrr)}.`,
      hallazgos, pedir: null,
    }
  }
  if (consumoCero && silencio !== null && silencio >= UMBRAL_SILENCIO) {
    return {
      situacion: 'se_va', luz: 'rojo', dueno: 'asesor',
      accion: 'Llamar esta semana: dejó de usar el servicio y nadie ha hablado con ella',
      porque: `Consumo en cero y ${silencio} días sin un contacto real. `
            + `Son ${dinero(e.mrr)}. Las dos cosas juntas son la firma de una baja `
            + `que todavía no se ha dicho en voz alta.`,
      hallazgos, pedir: null,
    }
  }

  /* ── 2. APAGÁNDOSE ────────────────────────────────────────────────────── */
  if (consumoCero || (consumoBajo && silencio !== null && silencio >= UMBRAL_SILENCIO)) {
    return {
      situacion: 'apagandose', luz: 'naranja', dueno: 'asesor',
      accion: 'Revisar con el cliente por qué bajó el uso, y qué le falta para volver',
      porque: consumoCero
        ? `No registra consumo en su último corte` + (silencio !== null ? ` y lleva ${silencio} días sin contacto.` : '.')
        : `Consume el ${e.consumoPct!.toFixed(0)}% de su plan y lleva ${silencio} días sin contacto.`,
      hallazgos, pedir: null,
    }
  }
  if (silencio !== null && silencio >= UMBRAL_SILENCIO_GRAVE) {
    return {
      situacion: 'apagandose', luz: 'naranja', dueno: 'asesor',
      accion: 'Retomar el contacto: lleva más de tres meses sin que hablemos con ella',
      porque: `${silencio} días sin una llamada, correo, WhatsApp ni reunión. `
            + `Son ${dinero(e.mrr)}.`,
      hallazgos, pedir: null,
    }
  }

  /* ── 2bis. CON POCAS FUENTES NO SE ACUSA: SE PIDE ──────────────────────
   *
   * «En la medida que más información tengas mayor es tu predicción» —
   * dirección, 7 oct 2026. El corolario es el que importa y es el que faltaba:
   * con POCA información la predicción vale menos, y afirmarla igual es
   * inventar.
   *
   * Las dos situaciones de arriba —se va, apagándose— se sostienen en hechos
   * duros: una frase escrita por el asesor, un consumo en cero. Ésas se
   * declaran con las fuentes que haya, porque el hecho ya está.
   *
   * De aquí para abajo el veredicto es un JUICIO, y un juicio con dos fuentes
   * de ocho no es un juicio: es una corazonada con tipografía de tablero. Una
   * cuenta así no se clasifica «en orden» ni «hay que mostrarle» — se pide lo
   * que falta, que es la única acción honesta.
   *
   * Tres de ocho es el piso. Por debajo sólo se sabe que paga. */
  const MIN_FUENTES = 3
  if (e.fuentes < MIN_FUENTES) {
    return {
      situacion: 'no_la_vemos', luz: 'amarillo', dueno: 'asesor',
      /* MISMA REGLA QUE ABAJO: el Excel sólo se nombra si de verdad falta.
         Esta rama también lo pedía a ciegas, y `llamadas` es una de las ocho
         fuentes — una cuenta puede llegar aquí CON su lectura de llamadas y
         sin casi nada más, y entonces pedírselo es pedir lo que ya dio. */
      accion: e.tieneLlamadas
        ? 'Completar la ficha: hoy no alcanza para opinar de esta cuenta'
        : 'Pedir el Excel de llamadas y completar la ficha: hoy no alcanza para opinar',
      porque: `Sólo ${e.fuentes} de ocho fuentes tienen dato de esta cuenta. `
            + `Con eso no se puede decir si está bien o mal, y decirlo igual `
            + `sería inventar. Son ${dinero(e.mrr)}.`
            + (e.tieneLlamadas
                ? ' Sus llamadas SÍ las tenemos: lo que falta es el resto.'
                : ''),
      hallazgos,
      pedir: e.tieneLlamadas
        ? 'Los datos de ficha que estén vacíos. El Excel de llamadas NO: esta '
        + 'cuenta ya aparece en Análisis de Llamadas.'
        : 'El export de llamadas de 3 a 6 meses CON la columna '
        + '`destination_data_1`, y los datos de ficha que estén vacíos.',
    }
  }

  /* ── 3. NO LA VEMOS ───────────────────────────────────────────────────── */
  /* UNA petición, no una por campo. Es la corrección que pidió dirección: el
     asesor hace una gestión —pedir el archivo— y se destraban varias cosas a la
     vez. Nueve tareas para la misma cuenta el mismo lunes no es rigor, es ruido. */
  if (!e.tieneLlamadas || e.consumoPct === null) {
    const falta: string[] = []
    if (!e.tieneLlamadas) falta.push('sus llamadas')
    if (e.consumoPct === null) falta.push('su consumo')

    /* ── LA ACCIÓN DEPENDE DE QUÉ FALTA, Y ANTES NO ────────────────────────
     *
     * La condición de arriba es un O, pero la acción estaba FIJA en «Pedir el
     * Excel de llamadas». Así que a una cuenta con lectura de llamadas y sin
     * consumo se le pedía igual el archivo.
     *
     * Lo vio dirección el 12 oct 2026 en GRUPO FRISA: su ficha pedía el Excel
     * mientras el módulo de Análisis de Llamadas traía 1,827 entrantes y 6,803
     * salientes de esa misma cuenta.
     *
     * MEDIDO con `scripts/mide-pedido-llamadas.py` sobre la cartera: de las
     * 118 cuentas que caen aquí, **56 tenían ya sus llamadas** y sólo les
     * faltaba el consumo — $1,102,008 al mes. Casi la mitad de las cuentas y
     * más de la mitad del dinero de este cubo, pidiéndole al cliente un
     * archivo que ya está en el tablero.
     *
     * Y el error es doble, porque el consumo NO ES DEL CLIENTE: sale de
     * `todosLosCortes()`, que es nuestro Informe de Cortes de Facturación. Ahí
     * la gestión es interna —averiguar por qué esa cuenta no aparece en el
     * corte— y no una llamada a pedirle nada a nadie.
     *
     * Pedir lo que ya se tiene no es sólo trabajo de más: enseña al cliente
     * que no miramos lo que nos dio.
     */
    const soloConsumo = e.tieneLlamadas && e.consumoPct === null

    if (soloConsumo) {
      return {
        situacion: 'no_la_vemos', luz: 'amarillo',
        /* Dirección y no asesor: quien puede destrabar un hueco del Informe de
           Cortes es quien maneja facturación, no quien lleva la cuenta. */
        dueno: 'direccion',
        accion: 'Revisar por qué esta cuenta no aparece en el Informe de Cortes',
        porque: `De esta cuenta sí tenemos sus llamadas, pero falta su consumo `
              + `de minutos, y ése sale de NUESTRO corte de facturación — no `
              + `del cliente. Son ${dinero(e.mrr)} sin medición de uso. `
              + `No hay nada que pedirle: hay que encontrar el hueco en el corte.`,
        hallazgos,
        pedir: 'El Informe de Cortes con esta cuenta dentro. Si no aparece, '
             + 'confirmar con Facturación si cambió de CID, si se facturó por '
             + 'otro contrato, o si quedó fuera del export.',
      }
    }

    return {
      situacion: 'no_la_vemos', luz: 'amarillo', dueno: 'asesor',
      accion: 'Pedir el Excel de llamadas entrantes y salientes de los últimos 3 a 6 meses',
      porque: `No se puede opinar de esta cuenta: falta ${falta.join(' y ')}. `
            + `Son ${dinero(e.mrr)} sin medición.`
            /* Cuando faltan las DOS, se dice que la segunda no se le pide a
               él: si no, el asesor sale de la llamada creyendo que el cliente
               le va a resolver el consumo. */
            + (falta.length > 1
                ? ' El consumo no se le pide al cliente: ése sale de nuestro '
                + 'Informe de Cortes, y va aparte.'
                : ''),
      hallazgos,
      pedir: 'El export por cuenta y periodo, CON la columna `destination_data_1` '
           + '— sin ella se pierde a dónde entraron las llamadas, que es lo más útil.',
    }
  }

  const entregables = pruebas('entrega')

  /* ── 4. SIN AUDITAR ───────────────────────────────────────────────────── */
  /* LA AUDITORÍA NO COMPITE CON EL ACERCAMIENTO AL CLIENTE: ES SU PREPARACIÓN.
   *
   * La primera versión ponía `sin_auditar` por encima de `hay_que_mostrarle` y
   * eso enterraba el material del cliente detrás de una tarea interna. Medido
   * sobre producción: de las 88 cuentas sin auditoría, SESENTA Y NUEVE —el 78%,
   * $518,372— ya tienen dos o más hallazgos entregables. A esas no se les manda
   * «escribe un documento»: se les manda escribirlo CON eso y llevárselo.
   *
   * Es lo que pidió dirección — que los hallazgos se presenten al cliente y sean
   * parte del acercamiento, «romper lo cotidiano y darle valor agregado». Una
   * auditoría que se escribe y se archiva no rompe nada. */
  if (!e.tieneAuditoria) {
    const conMaterial = entregables.length >= 2
    return {
      situacion: 'sin_auditar', luz: 'amarillo', dueno: 'asesor',
      accion: conMaterial
        ? 'Escribir su auditoría con estos hallazgos y agendar para presentárselos'
        : 'Escribir la auditoría de la cuenta con lo que ya se sabe de ella',
      porque: conMaterial
        ? `Hay ${entregables.length} cosas de su propia operación que el cliente `
          + `no ve: ${entregables.map(x => x.titulo.toLowerCase()).join(', ')}. `
          + `Nadie ha escrito su análisis, y ese análisis es justo lo que se le `
          + `lleva a la reunión.`
        : `Hay datos suficientes —llamadas, consumo y contacto— y nadie ha `
          + `escrito el análisis. Dirección pidió que TODAS las cuentas lo tengan.`,
      hallazgos, pedir: null,
    }
  }

  /* ── 5. OPORTUNIDAD ───────────────────────────────────────────────────────
   *
   * VA ANTES DE «hay que mostrarle», Y ESO SE MIDIÓ.
   *
   * Estaba detrás, y con eso la situación era inalcanzable en la práctica. El
   * 8 oct 2026, recién enganchada la candidatura, el reparto de las 192 cuentas
   * se agotaba en los cinco primeros pasos: 6 + 22 + 71 + 81 + 12 = 192, y
   * `oportunidad` salía CERO. No por los datos —86 cuentas traen candidatura de
   * crecimiento— sino porque el paso de entregables se lo comía todo.
   *
   * La razón es el umbral: entre los hallazgos de entrega están «lo que le hemos
   * resuelto» (tiene tickets) y «paga minutos que no usa» (consume menos del
   * 40%), que son casi universales. Dos de dos, así que toda cuenta sana cumplía
   * «hay dos cosas que mostrarle» y ninguna llegaba más abajo.
   *
   * Y puesta en el orden correcto la pregunta se responde sola: una cuenta que
   * llegó hasta aquí ya sobrevivió salida, apagón, falta de datos y falta de
   * auditoría — está medida, atendida y auditada. Si además tiene espacio para
   * crecer, la acción fuerte es proponérselo, y los hallazgos van en la MISMA
   * visita, no en una distinta. Es lo que pidió dirección: que los hallazgos
   * sean parte del acercamiento y rompan lo cotidiano. Presentar números y no
   * proponer nada es justo lo cotidiano.
   *
   * Los entregables no se pierden: siguen publicados en `hallazgos` y se nombran
   * en el `porque`, para que la reunión lleve las dos cosas. */
  /* LA LUZ VERDE NO SE DA CON UNA ALERTA DE RIESGO ABIERTA. Ni aquí ni en «en
     orden», y por eso la comprobación está antes de las dos.

     Una cuenta con riesgo vivo y material que enseñar vuelve a «hay qué
     mostrarle», que es donde estaba antes del reordenamiento: azul, y sin
     afirmar nada sobre el riesgo. La candidatura no se pierde —se nombra en la
     acción— pero no pinta la tarjeta de verde. */
  if (e.candidatura && !riesgoVivo.length) {
    return {
      situacion: 'oportunidad', luz: 'verde', dueno: 'asesor',
      accion: entregables.length
        ? `Proponer ${e.candidatura}, y llevarle sus hallazgos a la misma reunión`
        : `Proponer ${e.candidatura}`,
      /* Dice lo que SE COMPROBÓ, no «sin señal de riesgo» a secas. La frase
         amplia era falsa para una cuenta con fallas en la mesa, que siguen
         saliendo en rojo en esta misma tarjeta aunque no sean una alerta. */
      porque: `Está medida, auditada, sin ninguna alerta de riesgo abierta, y `
            + `tiene espacio para crecer. Son ${dinero(e.mrr)} hoy.`
            + (e.fallas > 0
                ? ` Ojo: ${e.fallas} ${e.fallas === 1 ? 'falla registrada' : 'fallas registradas'} `
                  + `en la mesa — conviene abrir por ahí, no por la propuesta.`
                : '')
            + (entregables.length
                ? ` Con qué abrir la conversación: ${entregables.map(x => x.titulo.toLowerCase()).join(', ')}.`
                : ''),
      hallazgos, pedir: null,
    }
  }

  /* ── 6. HAY QUE MOSTRARLE ─────────────────────────────────────────────── */
  /* Ya auditada y con material nuevo, pero sin nada que proponerle todavía:
     toca presentar lo que hay. */
  if (entregables.length >= 2) {
    return {
      situacion: 'hay_que_mostrarle', luz: 'azul', dueno: 'asesor',
      accion: e.candidatura
        ? `Presentarle sus hallazgos, y de paso proponer ${e.candidatura}`
        : 'Presentarle los hallazgos de su operación en la próxima reunión',
      porque: `Hay ${entregables.length} cosas de su propia operación que el `
            + `cliente no ve en su día a día: ${entregables.map(x => x.titulo.toLowerCase()).join(', ')}.`
            + (riesgoVivo.length
                ? ` Y antes de proponerle nada: ${riesgoVivo[0].titulo.toLowerCase()} `
                  + `— «${riesgoVivo[0].evidencia}».`
                : ''),
      hallazgos, pedir: null,
    }
  }

  /* ── 7. CON RIESGO ABIERTO Y SIN MATERIAL QUE ENSEÑAR ─────────────────── */
  /* El único sitio al que puede llegar una cuenta con alerta de riesgo que
     ninguna compuerta de arriba atrapó. Antes caía en «en orden» y salía
     verde; ahora se nombra el riesgo, que es lo que hay. */
  if (riesgoVivo.length) {
    return {
      situacion: 'apagandose', luz: 'naranja', dueno: 'asesor',
      accion: 'Atender la alerta abierta antes de cualquier otra cosa',
      porque: `${riesgoVivo[0].titulo}: «${riesgoVivo[0].evidencia}». `
            + (riesgoVivo.length > 1 ? `Y ${riesgoVivo.length - 1} alerta(s) más. ` : '')
            + `Son ${dinero(e.mrr)}.`,
      hallazgos, pedir: null,
    }
  }

  /* ── 8. EN ORDEN ──────────────────────────────────────────────────────── */
  return {
    situacion: 'en_orden', luz: 'verde', dueno: 'asesor',
    accion: 'Nada esta semana',
    porque: 'Consume, se le ha contactado y no tiene ninguna alerta de riesgo '
          + 'abierta. Una cuenta en orden no necesita una tarea inventada.'
          + (e.fallas > 0
              ? ` Lo único: ${e.fallas} ${e.fallas === 1 ? 'falla registrada' : 'fallas registradas'} `
                + `en la mesa de ayuda.`
              : ''),
    hallazgos, pedir: null,
  }
}

/** Cómo se llama cada situación en pantalla, y de qué color. */
export const SITUACION: Record<Situacion, { titulo: string; luz: Luz; orden: number }> = {
  se_va:            { titulo: 'Se está yendo',        luz: 'rojo',     orden: 1 },
  apagandose:       { titulo: 'Se está apagando',     luz: 'naranja',  orden: 2 },
  no_la_vemos:      { titulo: 'No la vemos',          luz: 'amarillo', orden: 3 },
  sin_auditar:      { titulo: 'Falta su auditoría',   luz: 'amarillo', orden: 4 },
  /* El orden de PANTALLA no es el de decisión: aquí «hay qué mostrarle» va
     antes porque es trabajo pendiente de entrega y `oportunidad` es una cuenta
     sana. En `veredictoDe` la oportunidad se evalúa primero, por el motivo que
     está explicado ahí. Los dos órdenes responden preguntas distintas: aquél
     cuál gana, éste en qué fila se lee. */
  hay_que_mostrarle:{ titulo: 'Hay qué mostrarle',    luz: 'azul',     orden: 5 },
  oportunidad:      { titulo: 'Oportunidad',          luz: 'verde',    orden: 6 },
  en_orden:         { titulo: 'En orden',             luz: 'verde',    orden: 7 },
}

export const LUZ: Record<Luz, { label: string; color: string }> = {
  rojo:     { label: 'Se está yendo',    color: '#EF4444' },
  naranja:  { label: 'Se está apagando', color: '#F97316' },
  amarillo: { label: 'Nos falta ver',    color: '#EAB308' },
  azul:     { label: 'Hay qué mostrarle',color: '#3B82F6' },
  verde:    { label: 'En orden',         color: '#22C55E' },
  gris:     { label: 'Sin servicio',     color: '#64748B' },
}
