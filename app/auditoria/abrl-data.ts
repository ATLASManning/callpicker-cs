import type { AuditoriaCase } from './types'

/**
 * ABRL Sistemas & Proyectos · C11 · CID 26654 · asesor Erick
 *
 * Fuente: "ABRL_Analisis_Llamadas_2026_FODA.html" (SAC, 9 nov 2026) — dos
 * archivos de detalle de llamadas del CID 26654: 5,127 entrantes y 6,961
 * salientes, del 1 ene al 9 nov 2026. Los datos de plan, facturación y
 * antigüedad vienen del expediente de la cuenta, NO de los archivos.
 *
 * LO QUE ESTE EXPEDIENTE NO PUEDE AFIRMAR, y se deja dicho con palabras en vez
 * de rellenarlo:
 *   · El archivo NO trae campo de causa. La atribución del apagón al cambio del
 *     servidor SIP del 29 oct se sostiene por la coincidencia exacta de fechas,
 *     por el contraste con las salientes y por lo que documenta el ticket
 *     #119317 — no por un dato de causa raíz.
 *   · NO se puede convertir a pesos. Las 725 llamadas perdidas no tienen valor
 *     económico asignable sin información de ABRL sobre el valor de un
 *     contacto. Cualquier cifra en dinero aquí sería inventada.
 *   · 157 registros de entrantes y 197 de salientes NO traen número Callpicker
 *     asociado, y tienen desenlaces peores que el promedio: pueden sesgar
 *     ligeramente los agregados globales.
 *   · Las horas vienen SIN zona horaria y se leen tal como están.
 *   · Noviembre es mes incompleto (1–9) y solo se compara por llamadas/día.
 *   · Diferencia con el tablero: la ficha reporta 4,400 entrantes al 14 sep y
 *     los archivos dan 4,457 (57 registros, 1.3%, probablemente del corte de la
 *     ventana). NO se ajustó ninguna cifra para igualarlas.
 *   · Los nombres de los destinos son los que configuró el cliente. El archivo
 *     no dice qué hay detrás de cada uno, así que no se clasifica ninguno.
 *
 * DOS CUADRES QUE CIERRAN (control del propio reporte): los agregados por día
 * de la semana suman 5,013 entrantes y 627 perdidas; los totales del año son
 * 5,127 y 725. Las diferencias son 114 y 98, que son exactamente las llamadas y
 * las pérdidas de la ventana 30 oct – 5 nov que el método declara excluida.
 * [[feedback-tablas-deben-cerrar]]
 *
 * DOCUMENTO INTERNO. Las secciones de FODA, lectura comercial y guion de la
 * llamada son estrategia de retención. Para enviar algo a ABRL hace falta una
 * versión sin esas tres secciones.
 */
export const ABRL: AuditoriaCase = {
  id:     'abrl',

  nombre:               'ABRL Sistemas & Proyectos',
  sector:               'Desarrollo de software y soluciones empresariales (aplicaciones móviles)',
  fecha_periodo:        '1 de enero – 9 de noviembre de 2026',
  fecha_auditoria:      'Nov 2026',
  tipo_cliente:         'VyC Callcenter · CID 26654 · 35 extensiones · 7 años de relación',
  descripcion_contexto:
    'Un apagón de entrantes que duró cuatro días hábiles, una ruta que recibió 334 llamadas y no contestó ' +
    'ninguna, y una cuenta que se vacía desde enero. El cliente ya cuestionó por escrito la continuidad de Callpicker.',
  estado:               'en_riesgo',
  clasificacion:        'CONFIDENCIAL',
  version:              '1.0',
  asesor:               'Erick',

  kpis: [
    { label: 'Apagón de entrantes · 30 oct – 5 nov', value: '98 de 114 perdidas · 86.0%', color: '#ef4444' },
    { label: 'Perdidas del año en la ruta «Disponible»', value: '334 de 725 · 46.1%',      color: '#f59e0b' },
    { label: 'Consumo del plan en octubre',            value: '9.8% · 39,461 min ociosos', color: '#6366f1' },
    { label: 'Conexión saliente (nunca se rompió)',    value: '78.9% en el año',           color: '#22c55e' },
  ],

  resumen_ejecutivo:
    'ABRL Sistemas & Proyectos (C11, CID 26654) es cliente desde el 29 de octubre de 2019 y paga $12,603 al mes por ' +
    'VyC Callcenter con 35 extensiones y un plan de 43,750 minutos. En el año entraron 5,127 llamadas y se atendieron ' +
    '4,164 (81.2%); 725 (14.1%) no las tomó ninguna extensión. Hasta ahí la cuenta se lee normal. Lo que la pone en ' +
    'riesgo son tres cosas que el ticket no dice y los archivos sí. ' +
    'Primero, el apagón: el 29 de octubre la cuenta cerró un día normal —19 llamadas, 17 atendidas, 5.3% sin ' +
    'contestar— y al día siguiente entraron 17 y se perdieron 17. El patrón duró hasta el 4 de noviembre; en la ' +
    'ventana del 30 de octubre al 5 de noviembre entraron 114 llamadas de 38 números distintos, se perdieron 98 ' +
    '(86.0%) y la operación entrante produjo 104 minutos de conversación en toda la semana. ' +
    'Segundo, y es lo estructural: el destino configurado como «Disponible» recibió 334 llamadas en 2026 y perdió las ' +
    '334 —ninguna atendida, ningún minuto—, o sea el 46.1% de todas las pérdidas del año. Descontando esa ruta, la ' +
    'caída real de los agentes en octubre fue de 9.8%, no del 25.7% que marca el indicador. Y no empezó con el ' +
    'incidente: esa ruta ya perdía 34 llamadas en agosto y 25 en septiembre. ' +
    'Tercero, el consumo: las entrantes por día pasaron de 32.6 en enero a 12.9 en octubre (-60.4%), los minutos ' +
    'cayeron -68.9% y el uso del plan bajó de 31.6% a 9.8%. Con el MRR actual, el minuto efectivamente usado en ' +
    'octubre salió a $2.94. Es exactamente el cálculo que hará su área de finanzas cuando revise el contrato.',

  resultado_positivo:
    'La operación saliente no se degradó en ningún momento: 78.9% de conexión en el año y 76.2% sobre 168 marcaciones ' +
    'durante el propio incidente. Esa asimetría descarta la infraestructura del cliente como causa y corrige el ' +
    'diagnóstico inicial sin necesidad de discutirlo. El servicio recuperó su nivel el 6 de noviembre, con 11.1% sin ' +
    'contestar. Y la demanda insiste: de 468 reintentos dentro de las 24 horas siguientes a una llamada perdida, 261 ' +
    'sí lograron ser atendidas, lo que deja una campaña de recuperación medible sobre los 84 números que perdieron ' +
    'tres o más llamadas.',

  hallazgos: [
    'EL APAGÓN. Del 30 de octubre al 4 de noviembre entraron 76 llamadas a la operación de ABRL y solo 1 fue atendida. El 30 de octubre se perdieron las 17 que entraron: el cien por ciento.',
    'LA PRUEBA TÉCNICA ES LA ASIMETRÍA. En esos mismos días las salientes conectaron 76.2% sobre 168 marcaciones, contra 78.9% del resto del año. Un problema del lado del cliente habría degradado las dos direcciones; solo cayó la recepción.',
    'EL SEGUNDO INDICIO. El 96.6% de las llamadas perdidas del año murieron con cero minutos registrados. No hay abandono por espera: hay corte.',
    'UNA RUTA QUE NUNCA CONTESTÓ. El destino «Disponible» recibió 334 llamadas en 2026 y perdió las 334. Esa sola ruta explica el 46.1% de las pérdidas del año, y lleva así desde agosto por lo menos (34 en agosto, 25 en septiembre, 59 en octubre, 60 en los primeros nueve días de noviembre).',
    'EL INDICADOR MIENTE SOBRE LA GENTE. Octubre cerró con 25.7% sin contestar, pero descontando «Disponible» la caída real de los agentes fue de 9.8%. El problema no es el equipo del cliente: es a dónde se mandan las llamadas y qué pasa cuando ninguna extensión está alcanzable.',
    'LA CUENTA SE VACÍA DESDE ENERO. Entrantes por día de 32.6 a 12.9 (-60.4%), salientes -56.2%, minutos -68.9%, y los números distintos que llaman de 187 a 97 (-48.1%). El uso del plan bajó de 31.6% a 9.8% y el minuto usado en octubre salió a $2.94.',
    'NOVIEMBRE ES UN ESPEJISMO. Promedia 20.7 entrantes por día, más que octubre, pero no es demanda que regresa: en el apagón 38 números generaron 114 intentos. Es la misma gente marcando otra vez porque no entra.',
    'EL FIN DE SEMANA ESTÁ ABIERTO AL PÚBLICO Y CERRADO POR DENTRO. El sábado pierde 31.2% de 279 llamadas y el domingo 46.7% de 45, contra 9.1% del miércoles. Pero el sábado sí hay agentes: 61 de sus pérdidas cayeron en «Disponible». Otra vez enrutamiento, no personas.',
    'EL LUNES ES EL PEOR DÍA HÁBIL con 14.0% (129 de 922): el patrón clásico de acumulación de lo que no se atendió el fin de semana.',
    'LOS BORDES DE LA JORNADA. Entre las 8 y las 18 horas la pérdida agregada es de 11.3%; fuera de esa franja sube a 44.2% sobre 181 llamadas. Las 7 de la mañana pierden 69.0%, las 19 horas 39.3% y las 22 horas 78%.',
    'Y UN VALLE DENTRO DE LA JORNADA: las 13 horas pierden 16.4% frente a 8.4% de las 11. La hora de comida no tiene relevo.',
    'LOS AGENTES CONTESTAN. Los destinos con nombre propio pierden entre 1.9% y 10%: Roger Ku 1.9% sobre 515 llamadas, Gimena Chan 2.9% sobre 554, Arturo Herrera 3.1% sobre 520.',
    'PERO HAY CONCENTRACIÓN. Cinco destinos absorben el 55.0% de las entrantes atendidas. Es eficiencia y a la vez riesgo de dependencia.',
    'Y OCHO DESTINOS PIERDEN MÁS DE UNA DE CADA CUATRO: Carlos Mayo 75.6% (34 de 45), Geiely Cordova 75.0%, Luis Ojeda 72.7%, Antonio Gonzalez 39.6%, Armando Sanchez 31.8%, Guardia 30.0%, y Leo Contreras y Ana Arias al 100% sobre 4 y 1 llamadas. El archivo no dice qué hay detrás de cada nombre, así que no se clasifica ninguno.',
    '308 LLAMADAS NO TRAEN DESTINO REGISTRADO y 70 de ellas (22.7%) se perdieron.',
    'LA DEMANDA ES RECUPERABLE. 468 llamadas son un reintento del mismo número dentro de las 24 horas siguientes a una perdida: 261 fueron atendidas y 195 se volvieron a perder. Los 12 restantes no caen en ninguno de los dos grupos y el reporte no los desglosa.',
    '200 NÚMEROS DISTINTOS perdieron al menos una llamada en el año; 84 de ellos perdieron tres o más y suman 576 pérdidas. Es una lista de contactos identificables, no una abstracción.',
    '12 EXTENSIONES CONTRATADAS SIN TRÁFICO EN OCTUBRE: 23 con tráfico de 35 contratadas. El conteo es contra octubre, no contra el año — en todo 2026 aparecen 32 destinos distintos, con un promedio de 23.4 por mes.',
    'EL EXPEDIENTE ESTABA VACÍO: sin reuniones vinculadas, sin documentos anexos y con observaciones del KAM en blanco hasta el 6 de noviembre. No había evidencia capturada para defender la cuenta.',
    'CERO DE SEIS MÓDULOS EN SIETE AÑOS. IA de voz, IA de chat, integración por API, chat y pago automático siguen sin tocar. El Health Score es 47/100, y el desglose dice dónde: adopción 8 y relacional 4, contra pago 100.',
  ],

  cronologia: [
    { fecha: '29 oct 2019', responsable: 'ABRL · Callpicker',
      evento: 'Alta de la cuenta. Siete años de relación continua, pagos al corriente y sin incidencias de cobranza.',
      tipo: 'ok' },
    { fecha: 'Ene 2026', responsable: 'Operación ABRL',
      evento: 'Mes más alto del año: 32.6 entrantes por día, 187 números distintos llamando y 31.6% del plan consumido.',
      tipo: 'neutral' },
    { fecha: 'Ago 2026', responsable: 'Enrutamiento Callpicker',
      evento: 'La ruta «Disponible» pierde 34 llamadas en el mes. El defecto ya está operando y nadie lo mira; la tasa de la cuenta sube a 15.9%.',
      tipo: 'problema' },
    { fecha: 'Sep 2026', responsable: 'Enrutamiento Callpicker',
      evento: '25 llamadas más perdidas en la misma ruta. La tasa del mes llega a 17.5%.',
      tipo: 'problema' },
    { fecha: '14 sep 2026', responsable: 'Tablero ATLAS',
      evento: 'La ficha reporta 4,400 entrantes acumuladas; los archivos de detalle dan 4,457. La diferencia de 57 registros (1.3%) probablemente viene del corte de la ventana y NO se ajustó ninguna cifra para igualarlas.',
      tipo: 'neutral' },
    { fecha: '29 oct 2026', responsable: 'Callpicker',
      evento: 'Actualización del servidor SIP que modificó el tamaño de los paquetes, sin notificación previa al cliente. Ese día la cuenta cerró normal: 19 llamadas, 17 atendidas, 5.3% sin contestar.',
      tipo: 'problema' },
    { fecha: '30 oct 2026', responsable: 'Operación ABRL',
      evento: 'Entran 17 llamadas y se pierden 17: el cien por ciento. Empieza el apagón de entrantes.',
      tipo: 'problema' },
    { fecha: '30 oct – 4 nov 2026', responsable: 'Cliente (ABRL)',
      evento: 'Cuatro días hábiles con el mismo patrón: 76 llamadas entraron y 1 fue atendida. Se detectó porque el cliente reclamó, no porque Callpicker lo viera; el incidente queda documentado en el ticket #119317 (la fuente no trae su fecha de apertura). El diagnóstico inicial señaló la infraestructura del cliente.',
      tipo: 'problema' },
    { fecha: '5 nov 2026', responsable: 'Operación ABRL',
      evento: 'Último día del episodio, con 66% sin contestar. En la ventana completa: 114 llamadas de 38 números, 98 perdidas (86.0%) y 104 minutos de conversación entrante en toda la semana.',
      tipo: 'problema' },
    { fecha: '6 nov 2026', responsable: 'Callpicker · KAM',
      evento: 'El servicio recupera su nivel: 11.1% sin contestar. Se captura la primera observación del KAM en el expediente, que hasta ese día estaba en blanco.',
      tipo: 'pivote' },
    { fecha: '1–9 nov 2026', responsable: 'Enrutamiento Callpicker',
      evento: 'La ruta «Disponible» ya acumula 60 pérdidas en nueve días, más que en todo octubre (59). El defecto estructural sigue abierto después de que el incidente se cerró.',
      tipo: 'problema' },
    { fecha: '9 nov 2026', responsable: 'SAC Callpicker',
      evento: 'Análisis de los 5,127 registros de entrantes y 6,961 de salientes del año. Sale el hallazgo que el ticket no contenía: el 46.1% de las pérdidas del año está en una sola ruta de enrutamiento.',
      tipo: 'pivote' },
    { fecha: 'Pendiente', responsable: 'Cliente (ABRL)',
      evento: 'El cliente pide por escrito plan de prevención, monitoreo de salud del servicio y protocolo de comunicación ante cambios — y cuestiona la continuidad de Callpicker como proveedor.',
      tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'ABRL Sistemas & Proyectos' },
    { label: 'Cuenta',              value: 'C11 · CID 26654 · asesor Erick' },
    { label: 'Servicio contratado', value: 'VyC Callcenter · 35 extensiones · plan de 43,750 minutos al mes' },
    { label: 'MRR',                 value: '$12,603 al mes (columna de la ficha; no viene del archivo de llamadas)' },
    { label: 'Cliente desde',       value: '29 de octubre de 2019 — siete años' },
    { label: 'Sector',              value: 'Desarrollador de software y soluciones empresariales con foco en aplicaciones móviles' },
    { label: 'Ubicación y tamaño',  value: 'Cancún, Quintana Roo · 51–200 empleados' },
    { label: 'Contacto en el expediente',
      value: 'La ficha trae «Lizbeth Hernández» con el correo esosa@abrhil.com y el teléfono 99 8166 9143: el nombre y el correo NO son de la misma persona. Quien interviene en el incidente es Edgar Sosa, de Infraestructura y Sistemas. Hay que corregir el dato antes de usarlo para contactar.' },
    { label: 'Health Score',        value: '47 / 100 — actividad 69 · adopción 8 · pago 100 · relacional 4' },
    { label: 'Módulos activos',     value: 'Ninguno de seis: sin chat, sin IA de voz, sin IA de chat, sin integración por API, sin pago automático' },
    { label: 'Cobranza',            value: 'Pagos al corriente, sin incidencias' },
    { label: 'Tickets abiertos',    value: '0 en el tablero. El incidente del apagón se documenta en el ticket #119317' },
  ],

  necesidad_negocio:
    'El cliente ya escribió la especificación de lo que necesita, y no es una disculpa: pidió plan de prevención, ' +
    'monitoreo de salud del servicio y protocolo de comunicación ante cambios. Eso es un servicio gestionado que hoy ' +
    'no paga y que Callpicker no está entregando — el apagón se detectó porque el cliente reclamó, no porque alguien ' +
    'lo viera desde aquí. Debajo de la petición hay una necesidad operativa concreta: ABRL atiende por teléfono a una ' +
    'base de contactos recurrente (804 números marcados, 346 de ellos cinco o más veces, que concentran el 87% del ' +
    'tráfico saliente) y cada llamada entrante que no se toma es un contacto de negocio que se cae. Y hay interlocutor ' +
    'técnico capaz de evaluar una respuesta de arquitectura: el cliente es desarrollador de software con VPN propia.',

  potencial_corto: [
    'Reparar la ruta «Disponible»: es un defecto de enrutamiento corregible esta semana que devuelve el 46.1% de las pérdidas del año.',
    'Entregar la lista de los 84 números con tres o más llamadas perdidas (576 pérdidas) como campaña de devolución medible y atribuible a la intervención.',
    'Cubrir los bordes de jornada y el relevo de la hora de comida: 44.2% de pérdida fuera de 8–18 h sobre 181 llamadas, y 16.4% a las 13 h.',
    'Resolver la cobertura de fin de semana sin contratar a nadie: 61 de las 87 pérdidas del sábado cayeron en «Disponible».',
    'Convertir las tres peticiones del cliente —prevención, monitoreo, protocolo de aviso— en entregables con fecha, responsable y forma de verificarlos.',
    'Corregir el contacto del expediente (nombre y correo no coinciden) y empezar a capturar evidencia: reuniones, anexos y observaciones del KAM.',
  ],

  potencial_largo: [
    'Monitoreo de salud del servicio como producto: lo pidió el cliente y hoy no existe para esta cuenta. Es la diferencia entre detectar un apagón en cuatro días o en cuatro minutos.',
    'Los seis módulos sin tocar en siete años —IA de voz, IA de chat, API, chat y pago automático— son la vía natural de expansión y cada uno sube el costo de salida.',
    'Atención automatizada para los bordes de jornada y el fin de semana, donde hoy se pierde casi la mitad de lo que entra.',
    'Rightsizing honesto del plan (12 extensiones sin tráfico en octubre y 39,461 minutos ociosos) — DESPUÉS de que el servicio esté estable y documentado, no antes.',
    'Reporte recurrente de pérdida por destino y por ruta como entregable periódico, en lugar de auditorías puntuales cuando ya hay reclamo.',
  ],

  tacticas: [
    { nombre:      'Abrir reconociendo con número, no con adjetivo',
      descripcion: 'Decir primero que del 30 de octubre al 4 de noviembre entraron 76 llamadas a su operación y una fue atendida. Antes de que lo diga él.',
      impacto:     'Cambia quién controla la conversación' },
    { nombre:      'Cerrar el tema de la culpa con la asimetría',
      descripcion: 'Sus salientes nunca se degradaron: 76.2% de conexión durante el incidente contra 78.9% histórico. Eso descarta su infraestructura como causa.',
      impacto:     'Corrige el diagnóstico inicial sin discutirlo' },
    { nombre:      'Entregarle el hallazgo que no conoce',
      descripcion: 'La ruta «Disponible» lleva 334 llamadas perdidas en el año y jamás contestó una. Es reparable esta semana.',
      impacto:     'Valor que se le regala en la misma llamada donde se le pide confianza' },
    { nombre:      'Darle la razón donde la tiene',
      descripcion: 'Dijo que es recurrente. La ruta perdió 34 llamadas en agosto, 25 en septiembre y 59 en octubre: el archivo le da la razón.',
      impacto:     'Confirmarlo con el dato vale más que cualquier compromiso genérico' },
    { nombre:      'Convertir su propia petición en el siguiente paso',
      descripcion: 'Pidió prevención, monitoreo y protocolo de aviso. Llevar las tres con fecha, responsable y forma de verificarlo.',
      impacto:     'Entregable, no promesa' },
    { nombre:      'Dejar la campaña de recuperación sobre la mesa',
      descripcion: 'Ofrecer la lista de los 84 números que perdieron tres o más llamadas.',
      impacto:     'Demuestra que el proveedor cuida su negocio, no su factura' },
    { nombre:      'NO abrir la conversación de rightsizing en esta llamada',
      descripcion: 'Usa 9.8% de su plan y eso tarde o temprano llega a finanzas, pero tocarlo hoy convierte una reparación de confianza en una negociación de precio. Va después de que el servicio esté estable y documentado.',
      impacto:     'Protege la reparación de la cuenta de volverse un descuento' },
  ],

  senal_alarma:
    'El cliente ya cuestionó por escrito la continuidad de Callpicker como proveedor: el riesgo está declarado, no ' +
    'inferido. Y el costo de salida es bajo — un solo servicio, cero de seis módulos y uso al 9.8% del plan: nada ' +
    'técnico lo retiene. Según el propio contacto ya hay quejas internas en ABRL, así que el desgaste no está solo en ' +
    'el área de sistemas. Riesgo asumido de la estrategia de esta auditoría: reconocer el apagón con números expone su ' +
    'magnitud real, que el cliente quizá no había cuantificado. Se asume a propósito, porque si lo descubre después y ' +
    'por su cuenta el costo es la cuenta completa.',

  problema_raiz:
    'El enrutamiento, no la gente. Y nadie del lado de Callpicker estaba mirando.',

  problema_raiz_detalle:
    'Hay dos fallas y se confundieron en una. La visible es el apagón: cuatro días hábiles en los que la recepción ' +
    'dejó de funcionar, atribuible al cambio del servidor SIP del 29 de octubre. La estructural es anterior y sigue ' +
    'abierta: el destino configurado como «Disponible» recibió 334 llamadas en 2026, perdió las 334 y nunca generó un ' +
    'minuto. Esa ruta explica el 46.1% de todas las pérdidas del año y ya perdía 34 llamadas en agosto y 25 en ' +
    'septiembre, antes de que existiera el incidente. Lo que eso significa para el indicador: octubre cerró con 25.7% ' +
    'sin contestar, pero descontando esa ruta la caída real de los agentes fue de 9.8%. El equipo de ABRL contesta — ' +
    'los destinos con nombre propio pierden entre 1.9% y 10% —; lo que falla es a dónde se mandan las llamadas y qué ' +
    'pasa cuando ninguna extensión está alcanzable. ' +
    'La segunda capa del problema raíz es de operación nuestra, no del cliente: el apagón se detectó porque el ' +
    'cliente reclamó, el diagnóstico inicial señaló su infraestructura cuando el contraste entrantes-contra-salientes ' +
    'ya apuntaba al lado de la recepción, no hubo notificación previa del cambio en el servidor, y el expediente ' +
    'estaba vacío —sin reuniones, sin anexos y con observaciones del KAM en blanco hasta el 6 de noviembre—, así que ' +
    'no había evidencia capturada para defender la cuenta. ' +
    'LÍMITE DE ESTA ATRIBUCIÓN, Y HAY QUE DECIRLO EN LA LLAMADA SI PREGUNTAN: el archivo NO trae campo de causa. Que ' +
    'el apagón venga del cambio del servidor SIP se sostiene por la coincidencia exacta de fechas, por el contraste ' +
    'con las salientes —que no se movieron— y por lo que documenta el ticket #119317. No por un dato de causa raíz. ' +
    'El segundo indicio sí es del archivo y es fuerte: el 96.6% de las llamadas perdidas del año murieron con cero ' +
    'minutos registrados, o sea que no hay abandono por espera, hay corte.',

  flujo_real: [
    { fase: 'Entra la llamada',                        area: 'DID de ABRL',                      accion: '5,127 entrantes del 1 ene al 9 nov 2026',                        resultado: '4,164 atendidas (81.2%) · 725 sin contestar (14.1%) · el resto lo resolvió el menú' },
    { fase: 'Se enruta a un destino con nombre',       area: '32 destinos con tráfico en el año', accion: 'Roger Ku 515 · Gimena Chan 554 · Arturo Herrera 520 · Christian Aguayo 408 · Mauricio Rodriguez 366', resultado: 'Pérdida de 1.9% a 4.6%. El equipo del cliente sí contesta' },
    { fase: 'Se enruta al destino «Disponible»',       area: 'Ruta configurada en la plataforma', accion: '334 llamadas en 2026',                                            resultado: '334 perdidas · 0 atendidas · 0 minutos · el 46.1% de las pérdidas del año' },
    { fase: 'Llega sin destino registrado',            area: 'Sin dato en el archivo',            accion: '308 llamadas',                                                    resultado: '70 perdidas (22.7%). El archivo no dice dónde cayeron' },
    { fase: 'Entra fuera de la franja 8–18 h',         area: 'Bordes de jornada',                 accion: '181 llamadas',                                                    resultado: '44.2% sin contestar · 69.0% a las 7 h · 39.3% a las 19 h · 78% a las 22 h' },
    { fase: 'Entra en fin de semana',                  area: 'Sábado y domingo',                  accion: '279 llamadas el sábado, 45 el domingo',                            resultado: 'Sábado 31.2% y domingo 46.7%, contra 9.1% del miércoles. 61 de las pérdidas del sábado cayeron en «Disponible»' },
    { fase: 'Entra durante el apagón (30 oct – 5 nov)',area: 'Recepción',                         accion: '114 llamadas de 38 números distintos',                             resultado: '98 perdidas (86.0%) y 104 minutos de conversación entrante en toda la semana' },
    { fase: 'El mismo número reintenta en 24 h',       area: 'Demanda que insiste',               accion: '468 reintentos tras una llamada perdida',                          resultado: '261 atendidas y 195 vueltas a perder. Los 12 restantes no caen en ninguno de los dos grupos y el reporte no los desglosa' },
    { fase: 'Nadie lo detecta desde Callpicker',       area: 'Monitoreo y expediente',            accion: 'Sin monitoreo de salud del servicio, sin aviso previo del cambio de servidor', resultado: 'Cuatro días hábiles de apagón detectados por el reclamo del cliente; expediente sin reuniones ni anexos hasta el 6 de noviembre' },
  ],

  comparativo: [
    { metrica: 'Entrantes sin contestar · año',                      real: '14.1% (725 de 5,127)',                      ideal: '< 10% sostenido' },
    { metrica: 'Entrantes sin contestar · apagón (30 oct – 5 nov)',  real: '86.0% (98 de 114)',                         ideal: 'Sin interrupción, y detectada por monitoreo propio' },
    { metrica: 'Pérdidas del año concentradas en una sola ruta',     real: '46.1% en «Disponible» (334 llamadas, 0 atendidas)', ideal: '0 — ninguna ruta sin extensión alcanzable' },
    { metrica: 'Pérdida de octubre, con y sin esa ruta',             real: '25.7% con · 9.8% sin',                      ideal: 'Que el indicador mida a los agentes, no al enrutamiento' },
    { metrica: 'Fuera de la franja 8–18 h',                          real: '44.2% sin contestar (181 llamadas)',        ideal: '< 15% con atención automatizada o guardia' },
    { metrica: 'Fin de semana',                                      real: 'Sábado 31.2% · domingo 46.7%',              ideal: '< 15% — el sábado sí tiene agentes' },
    { metrica: 'Consumo del plan',                                   real: '9.8% en octubre (31.6% en enero)',          ideal: '> 50% o plan ajustado al uso real' },
    { metrica: 'Extensiones con tráfico',                            real: '23 de 35 contratadas en octubre',           ideal: 'Que lo contratado coincida con lo operado' },
    { metrica: 'Concentración de la atención',                       real: '5 destinos absorben 55.0% de las atendidas', ideal: '< 40% — reducir dependencia' },
    { metrica: 'Módulos del portafolio activos',                     real: '0 de 6 en siete años',                      ideal: '≥ 2 — cada módulo sube el costo de salida' },
    { metrica: 'Evidencia capturada en el expediente',               real: 'Sin reuniones, sin anexos, KAM en blanco hasta el 6 nov', ideal: 'Reuniones y anexos al día: sin evidencia no se defiende una cuenta' },
    { metrica: 'Detección de una caída de servicio',                 real: '4 días hábiles, y por reclamo del cliente', ideal: 'Minutos, por monitoreo propio — es justo lo que el cliente pidió' },
  ],

  plan_inmediato: [
    { accion: 'Revisar y reparar el destino «Disponible»: a dónde manda, qué pasa cuando ninguna extensión está alcanzable, y por qué 334 llamadas murieron ahí sin un minuto',
      responsable: 'Erick + equipo técnico Callpicker',
      criterio: 'Cero llamadas con desenlace Lost en esa ruta en la semana siguiente al cambio. Es el 46.1% de las pérdidas del año y es corregible esta semana' },
    { accion: 'Llevar a la llamada con el cliente el contraste entrantes-contra-salientes (76.2% de conexión durante el incidente vs 78.9% histórico) para cerrar el tema de la causa',
      responsable: 'Erick + SAC',
      criterio: 'Que el diagnóstico inicial que señaló la infraestructura del cliente quede corregido con dato, sin discutirlo' },
    { accion: 'Entregar las tres peticiones del cliente con fecha, responsable y forma de verificarlas: plan de prevención, monitoreo de salud del servicio y protocolo de aviso ante cambios',
      responsable: 'Erick + Operaciones Callpicker',
      criterio: 'Documento firmado por ambas partes. El cliente ya escribió la especificación; lo que falta es el compromiso verificable' },
    { accion: 'Corregir el contacto del expediente (la ficha mezcla el nombre de Lizbeth Hernández con el correo de Edgar Sosa) y cargar reuniones y anexos de la cuenta',
      responsable: 'Erick',
      criterio: 'Expediente con contacto correcto, reunión del incidente capturada y el reporte de llamadas anexado. Sin evidencia no se defiende una cuenta en riesgo' },
  ],

  plan_mediano: [
    { accion: 'Campaña de devolución sobre los 84 números que perdieron tres o más llamadas (576 pérdidas acumuladas)',
      responsable: 'Erick + operación de ABRL',
      criterio: 'Lista entregada y contactos devueltos medidos. 261 de 468 reintentos ya se convierten solos: la demanda insiste' },
    { accion: 'Cubrir los bordes de jornada y el relevo de la hora de comida: las 7 h, las 19–22 h y el valle de las 13 h',
      responsable: 'Erick + cliente',
      criterio: 'Pérdida fuera de 8–18 h por debajo de 15%, desde 44.2%' },
    { accion: 'Resolver la cobertura de fin de semana por enrutamiento antes que por dotación: el sábado sí tiene agentes y 61 de sus 87 pérdidas cayeron en «Disponible»',
      responsable: 'Erick + equipo técnico Callpicker',
      criterio: 'Sábado por debajo de 15% sin contratar personal nuevo' },
    { accion: 'Instalar reporte de pérdida por destino y por ruta como entregable periódico de la cuenta',
      responsable: 'SAC + Erick',
      criterio: 'Pasar de detectar lo crónico en una auditoría puntual a verlo cada mes. La ruta llevaba desde agosto y nadie la vio' },
  ],

  plan_estrategico: [
    { accion: 'Convertir el monitoreo de salud del servicio en lo que el cliente paga, no en lo que se le promete: es la especificación de un servicio gestionado que hoy no tiene',
      responsable: 'Erick + Comercial',
      criterio: 'Propuesta presentada una vez que el servicio lleve dos meses estable y documentado' },
    { accion: 'Abrir la escalera de producto: cero de seis módulos en siete años. Atención automatizada para los bordes de jornada es la entrada natural dada la pérdida de 44.2% fuera de horario',
      responsable: 'Erick + Comercial',
      criterio: 'Al menos un módulo activo. Cada uno sube el costo de salida, que hoy es bajo' },
    { accion: 'Rightsizing honesto del plan: 12 extensiones sin tráfico en octubre y 39,461 minutos ociosos, con el minuto usado a $2.94',
      responsable: 'Erick + Comercial',
      criterio: 'DESPUÉS de la reparación, nunca en la misma conversación: hacerlo antes convierte una reparación de confianza en una negociación de precio. Y su área de finanzas va a hacer ese cálculo sola' },
  ],

  areas_oportunidad: [
    { area: 'Reparación de la ruta «Disponible»',              impacto: 'Crítica — 46.1% de las pérdidas del año',            responsable: 'Derivado del análisis de datos' },
    { area: 'Monitoreo de salud del servicio',                 impacto: 'Alta — es lo que el cliente pidió por escrito',      responsable: 'Solicitado por el cliente' },
    { area: 'Protocolo de aviso ante cambios de plataforma',   impacto: 'Alta — el cambio del 29 oct no se notificó',         responsable: 'Solicitado por el cliente' },
    { area: 'Plan de prevención documentado',                  impacto: 'Alta — cierra la petición del cliente',              responsable: 'Solicitado por el cliente' },
    { area: 'Campaña de devolución a 84 números',              impacto: 'Media-Alta — recuperación medible y atribuible',     responsable: 'Derivado del análisis de datos' },
    { area: 'Cobertura de bordes de jornada y fin de semana',  impacto: 'Media-Alta — 44.2% fuera de horario',                responsable: 'Derivado del análisis de datos' },
    { area: 'Escalera de producto (0 de 6 módulos)',           impacto: 'Alta — sube el costo de salida, hoy bajo',           responsable: 'Oportunidad comercial' },
    { area: 'Rightsizing del plan',                            impacto: 'Media — defensivo, no ofensivo',                     responsable: 'Va después de la estabilidad' },
    { area: 'Expediente de la cuenta y contacto correcto',     impacto: 'Media — gobernanza; sin evidencia no se defiende',   responsable: 'Erick' },
    { area: 'Reducir la concentración en 5 destinos (55.0%)',  impacto: 'Media — riesgo de dependencia operativa',            responsable: 'Cliente, con el dato de Callpicker' },
  ],

  perfiles: [
    {
      nombre: 'Edgar Sosa',
      rol:    'Infraestructura y Sistemas de ABRL — decisor técnico del incidente',
      color:  '#c23b32',
      campos: [
        { label: 'Lo que dijo',        value: 'Que estas situaciones son recurrentes. El archivo le da la razón: la ruta «Disponible» perdió 34 llamadas en agosto, 25 en septiembre, 59 en octubre y 60 en los primeros nueve días de noviembre' },
        { label: 'Por qué importa',    value: 'Es desarrollador de software con VPN propia: puede evaluar una respuesta de arquitectura, no solo una disculpa. Y puede verificar por sí mismo que el patrón viene de agosto' },
        { label: 'Riesgo que trae',    value: 'Ya cuestionó por escrito la continuidad de Callpicker como proveedor, y según él mismo ya hay quejas internas en ABRL' },
        { label: 'Cómo tratarlo',      value: 'Darle la razón donde la tiene y entregarle el hallazgo de la ruta, que no conoce. Es el decisor natural para validar la solución' },
      ],
    },
    {
      nombre: 'Erick',
      rol:    'Asesor de la cuenta (C11)',
      color:  '#0EA5E9',
      campos: [
        { label: 'Lo que tiene en contra', value: 'El expediente estaba vacío hasta el 6 de noviembre: sin reuniones, sin anexos y con observaciones del KAM en blanco. Y la ficha mezcla el nombre de un contacto con el correo de otro' },
        { label: 'Lo que tiene a favor',   value: 'La asimetría entrantes-salientes y el hallazgo de la ruta son dos datos que el cliente no tiene y que llegan antes de la llamada' },
        { label: 'Acción inmediata',       value: 'Pedir la reparación de la ruta, llevar las tres peticiones del cliente como entregable con fecha, y dejar la campaña de los 84 números sobre la mesa. NO abrir el rightsizing en esa llamada' },
      ],
    },
    {
      nombre: 'La operación de atención de ABRL',
      rol:    'Los destinos configurados por el cliente — no se clasifica ninguno',
      color:  '#2e7d57',
      campos: [
        { label: 'Qué dice el dato',  value: 'Los destinos con nombre propio pierden entre 1.9% y 10%: Roger Ku 1.9% sobre 515 llamadas, Gimena Chan 2.9% sobre 554, Arturo Herrera 3.1% sobre 520. En jornada la pérdida agregada es de 11.3%' },
        { label: 'La concentración',  value: 'Cinco destinos absorben el 55.0% de las entrantes atendidas: eficiencia y riesgo de dependencia a la vez' },
        { label: 'Los que pierden',   value: 'Ocho destinos pierden más de una de cada cuatro llamadas: Carlos Mayo 75.6% (34 de 45), Geiely Cordova 75.0%, Luis Ojeda 72.7%, Antonio Gonzalez 39.6%, Armando Sanchez 31.8%, Guardia 30.0%, y Leo Contreras y Ana Arias al 100% sobre 4 y 1 llamadas' },
        { label: 'LÍMITE DEL DATO',   value: 'Los nombres son los que configuró el cliente y el archivo no dice qué hay detrás de cada uno — puede ser una persona, un grupo o una cola. Por eso no se clasifica ninguno y esta sección NO se presenta como evaluación de personal' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'El equipo del cliente contesta: los destinos con nombre propio pierden entre 2% y 10%, y en jornada la pérdida agregada es de 11.3%.',
      'Siete años de relación continua, pagos al corriente y sin incidencias de cobranza.',
      'La operación saliente no se ha roto en todo el año: 78.9% de conexión, incluso durante el incidente.',
      'Base de contactos madura y recurrente: 804 números marcados, 346 de ellos cinco o más veces, que concentran 87% del tráfico saliente.',
      'El cliente es desarrollador de software con VPN propia: hay interlocutor técnico capaz de evaluar una respuesta de arquitectura, no solo una disculpa.',
    ],
    oportunidades: [
      'El cliente ya pidió por escrito plan de prevención, monitoreo de salud del servicio y protocolo de comunicación ante cambios. Eso es la especificación de un servicio gestionado que hoy no paga.',
      'Cero de seis módulos en siete años. IA de voz, IA de chat, integración por API y pago automático siguen sin tocar, y cada uno sube el costo de salida.',
      '12 extensiones contratadas sin tráfico en octubre y 39,461 minutos ociosos: espacio para un rightsizing honesto que compre credibilidad en lugar de perder el contrato completo.',
      '84 números con tres o más llamadas perdidas: una campaña de devolución medible que el cliente puede atribuir a la intervención.',
      'Edgar Sosa, de Infraestructura y Sistemas, ya está involucrado y es el decisor técnico natural para validar la solución.',
    ],
    debilidades: [
      'La ruta Disponible lleva 334 llamadas perdidas en el año, el 46.1% del total, sin haber contestado una sola. Es un defecto de diseño que nadie revisó en meses.',
      'El apagón de entrantes duró cuatro días hábiles y se detectó porque el cliente reclamó, no porque Callpicker lo viera.',
      'El diagnóstico inicial señaló la infraestructura del cliente. El contraste entrantes contra salientes ya apuntaba al lado de la recepción.',
      'No hubo notificación previa de un cambio en el servidor SIP que modificó el tamaño de los paquetes.',
      'Expediente vacío: sin reuniones vinculadas, sin documentos anexos y con observaciones del KAM en blanco hasta el 6 de noviembre. No hay evidencia capturada para defender la cuenta.',
      'Concentración operativa: cinco extensiones absorben 55.0% de las entrantes atendidas.',
    ],
    amenazas: [
      'El cliente ya cuestionó por escrito la continuidad de Callpicker como proveedor. El riesgo está declarado, no inferido.',
      'Costo de salida bajo: un solo servicio, cero módulos y uso al 9.8% del plan. Nada técnico lo retiene.',
      'La caída de consumo es sostenida, no un bache: -60.4% en entrantes por día y -48.1% en números únicos entre enero y octubre.',
      'El cliente puede verificar por sí mismo que el patrón viene de agosto. Si la conversación se plantea como un incidente aislado, la pierde quien lo diga.',
      'Reincidencia percibida más ausencia de monitoreo propio: cualquier caída nueva, por menor que sea, dispara la cancelación.',
      'Ya hay quejas internas en ABRL por el servicio, según el propio contacto. El desgaste no está solo en el área de sistemas.',
    ],
  },

  conclusion:
    'ABRL no es una cuenta que se vaya por precio: es una cuenta que se va por confianza, y el apagón del 30 de ' +
    'octubre solo puso fecha a algo que venía desde agosto. Lo que la salva o la pierde es cómo se cuente. Si la ' +
    'conversación se plantea como un incidente aislado y ya resuelto, el cliente —que es desarrollador de software y ' +
    'puede verificarlo solo— va a encontrar las 34 pérdidas de agosto y las 25 de septiembre en su propio historial, ' +
    'y entonces la discusión deja de ser sobre un servidor y pasa a ser sobre la credibilidad del proveedor. ' +
    'Si en cambio se llega con el dato que él no tiene —que el 46.1% de sus pérdidas del año está en una sola ruta de ' +
    'enrutamiento que jamás contestó, y que eso es reparable esta semana—, la misma información que lo haría cancelar ' +
    'es la que demuestra que alguien de este lado por fin está mirando su cuenta. ' +
    'El reloj corre por el otro flanco: usa 9.8% de un plan de 43,750 minutos y el minuto efectivamente usado salió a ' +
    '$2.94 en octubre. Ese cálculo lo va a hacer su área de finanzas con o sin nosotros, y cuando llegue conviene que ' +
    'el servicio ya esté estable y documentado — no al revés.',

  pierde: [
    '725 llamadas entrantes en el año que nadie tomó, de las cuales 334 murieron en una ruta que jamás contestó. No se pueden convertir a pesos sin información de ABRL sobre el valor de un contacto, y poner una cifra aquí sería inventarla.',
    '98 contactos de negocio perdidos en cuatro días hábiles, con la operación entrante produciendo 104 minutos de conversación en toda una semana.',
    '576 llamadas perdidas concentradas en 84 números que ya habían intentado tres o más veces: clientes o prospectos que insistieron y no entraron.',
    '39,461 minutos de un plan de 43,750 que se pagan y no se usan, y 12 de 35 extensiones contratadas sin un solo minuto de tráfico en octubre.',
    'La oportunidad de haber detectado el apagón desde aquí: cuatro días hábiles de ventaja regalados a quien venga a ofrecerle monitoreo.',
  ],

  gana: [
    'Credibilidad: llegar con el hallazgo de la ruta Disponible es entregarle al cliente un diagnóstico que él no tiene y que su proveedor actual —nosotros— tampoco tenía hasta hoy.',
    'La causa cerrada con dato propio: 76.2% de conexión saliente durante el incidente contra 78.9% histórico descarta su infraestructura y corrige el diagnóstico inicial sin pelearlo.',
    'Una reparación de impacto inmediato y verificable por el cliente: el 46.1% de las pérdidas del año sale de una sola ruta corregible esta semana.',
    'Las tres peticiones del cliente convertidas en servicio: prevención, monitoreo y protocolo de aviso son la especificación de algo que hoy no paga.',
    'Una campaña de recuperación con nombre y apellido: 84 números, 576 pérdidas, y 261 de 468 reintentos que ya se convierten solos.',
  ],

  recomendacion_central:
    'Una sola llamada, con este orden y sin saltarse ninguno: reconocer con número (76 llamadas entraron del 30 de ' +
    'octubre al 4 de noviembre y una fue atendida), cerrar la causa con la asimetría de las salientes, entregar el ' +
    'hallazgo de la ruta «Disponible», darle la razón en que es recurrente, y convertir sus tres peticiones en ' +
    'entregables con fecha y responsable. Dejar la campaña de los 84 números sobre la mesa como prueba de que se le ' +
    'cuida el negocio y no la factura. ' +
    'Y NO abrir el rightsizing en esa llamada, aunque el 9.8% de consumo lo esté pidiendo: hoy convierte una ' +
    'reparación de confianza en una negociación de precio. Va después, con el servicio estable y documentado.',

  documentos: [
    {
      nombre:      'ABRL · Análisis de llamadas 2026 y FODA',
      ruta:        '/auditorias/ABRL_Analisis_Llamadas_2026_FODA.html',
      descripcion:
        'Reporte completo de SAC (9 nov 2026) sobre 5,127 llamadas entrantes y 6,961 salientes del CID 26654, ' +
        '1 ene – 9 nov 2026, con las gráficas del apagón, de la ruta Disponible, de la tendencia anual, por día de la ' +
        'semana y por hora, más la tabla completa de los 33 destinos. DOCUMENTO INTERNO: las secciones de FODA, ' +
        'lectura comercial y guion de la llamada son estrategia de retención y no se comparten con el cliente. Para ' +
        'enviarle algo a ABRL hace falta una versión sin esas tres secciones. Cierra con «Cómo se midió y qué no se ' +
        'puede afirmar con estos datos», que es la parte que hay que leer antes de citar cualquier cifra.',
    },
  ],
}
