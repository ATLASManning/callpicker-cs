import type { AuditoriaCase } from './types'

/**
 * ECODELI (C2 · CID 164581) — la cuenta que mejor funciona y con la que menos
 * hablamos.
 *
 * Sexta del TOP 50, y la primera de la serie que NO tiene un problema de
 * servicio. Al revés: 289,238 llamadas entrantes en ocho meses y medio con
 * 211 sin contestar —el 0.07%—, cero tickets en veinticuatro meses de
 * relación, y el importe de la ficha coincidiendo al peso con el del GRC.
 * Después de Torres Corzo (55.5% de pérdida), de Sección Amarilla (sin una
 * sola línea de facturación encontrable) y de IMPAS (sin un registro desde
 * enero), ésta es la que está bien.
 *
 * Y JUSTAMENTE POR ESO HAY QUE MIRARLA DOS VECES
 * ----------------------------------------------
 * El 0.07% no es un logro de atención: es que contesta una MÁQUINA. El perfil
 * horario no deja lugar a duda —el 32.3% de todo el día entra a las 08:00 y el
 * 18.1% a las 16:00, con el mediodía muerto y la noche en cero—, la duración
 * media son 1.02 minutos clavados en los dos destinos, sólo hay 177 números
 * distintos para 289,238 llamadas, y uno de los destinos se llama «Voice App».
 *
 * Eso no es una línea de clientes. Es una CHECADORA TELEFÓNICA: el personal de
 * limpieza marca desde el sitio del cliente al entrar y al salir del turno.
 *
 * LO QUE ESO CAMBIA, Y ES TODO
 * ----------------------------
 * Deja de ser una cuenta de telefonía y pasa a ser una dependencia operativa.
 * Si el sistema falla a las 08:00, miles de trabajadores repartidos en más de
 * treinta sucursales no pueden registrar su asistencia. Es la retención más
 * fuerte que existe y, a la vez, la responsabilidad más grande — y la tenemos
 * sin una sola reunión en dos años.
 *
 * UNA HIPÓTESIS MÍA QUE EL DATO TUMBÓ, y se deja escrita
 * ------------------------------------------------------
 * Supuse que las 211 pérdidas serían el techo de canales tocándose en el pico.
 * Es falso: a las 08:00 la pérdida es 0.071%, igual que la media del periodo.
 * Las tasas más altas caen en las horas MUERTAS (12:00 con 0.652% sobre 2,912
 * llamadas). No hay evidencia de saturación hoy. Lo que sí falta es saber
 * cuántos canales compró, porque el contrato no lo dice.
 *
 * TODAS las cifras salen de fuente y están verificadas:
 *   · llamadas  → app/cuentas/llamadas-data.ts, CID 164581
 *   · importe   → GRC por CID: $32,740, «MRR estable», y COINCIDE con la ficha
 *   · tickets   → lib/tickets-data.json: CERO filas
 *   · alertas   → alertas_episodios, 4 abiertas (2 críticas)
 *   · la empresa → LinkedIn (Grupo Ecodeli), Dunsguide y ecodeli.com
 */
export const ECODELI: AuditoriaCase = {
  id: 'ecodeli',
  asesor: 'Claudia',
  nombre: 'ECODELI (Grupo Ecodeli — Comercial e Industrial)',
  sector: 'Limpieza profesional y servicios de facility — León, Guanajuato',
  fecha_periodo: 'Septiembre 2024 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Corporativo · 24 meses · 5,001–10,000 empleados',
  descripcion_contexto: 'La cuenta que mejor funciona de la cartera: 289,238 llamadas y 0.07% sin contestar · Pero no es una línea de clientes, es una CHECADORA — 32.3% del día a las 08:00 y 1.02 min por llamada · Y en 24 meses no ha habido una sola reunión, ni un contacto capturado, ni una pregunta del Radar',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Llamadas en 8.5 meses',          value: '289,238',  color: '#6366f1' },
    { label: 'Sin contestar — la mejor cifra', value: '0.07%',    color: '#22c55e' },
    { label: 'Del día entra a las 08:00',      value: '32.3%',    color: '#f97316' },
    { label: 'Duración media por llamada',     value: '1.02 min', color: '#f97316' },
    { label: 'Números distintos que llaman',   value: '177',      color: '#f97316' },
    { label: 'Reuniones en 24 meses',          value: 'NINGUNA',  color: '#ef4444' },
  ],

  resumen_ejecutivo: 'ECODELI es, con diferencia, la cuenta que mejor funciona de todas las que llevamos auditadas. 289,238 llamadas entrantes entre el 2 de enero y el 14 de septiembre, con 211 sin contestar: el 0.07%. Cero tickets en veinticuatro meses de relación. Pagos al corriente sin una incidencia. Y el importe de la ficha —$32,740— coincide exactamente con el del GRC, que después de cuatro auditorías seguidas corrigiendo esa columna es casi una rareza.\n\nPERO EL 0.07% NO SIGNIFICA LO QUE PARECE, Y ESO ORDENA TODO EL EXPEDIENTE. No es una proeza de atención telefónica: es que las llamadas las contesta una máquina. El perfil horario no admite otra lectura — el 32.3% de todo el tráfico del día entra a las 08:00 y el 18.1% a las 16:00, el mediodía está muerto y la noche en cero absoluto. Son dos cambios de turno. La duración media es de 1.02 minutos, idéntica hasta el segundo decimal en los dos destinos. Y hay sólo 177 números distintos para 289,238 llamadas: mil seiscientas por número. Uno de los destinos se llama, literalmente, «Voice App».\n\nEsto no es una línea de atención a clientes. **Es una checadora telefónica**: el personal de limpieza marca desde el teléfono del sitio donde trabaja, al entrar y al salir del turno, y una aplicación de voz registra el movimiento. Encaja con lo que es la empresa —una de las mayores de limpieza profesional de México, con entre 5,001 y 10,000 empleados repartidos en más de treinta sucursales— y encaja con lo que contrató: «Canales concurrentes + DiD Nacional», que es un producto de capacidad, no de extensiones.\n\nY ESO CAMBIA QUÉ CLASE DE CUENTA ES. Deja de ser telefonía y pasa a ser una dependencia operativa: si el sistema no responde a las 08:00, miles de trabajadores en decenas de sitios no pueden registrar su asistencia, y eso toca nómina, no comodidad. Es la forma de retención más fuerte que existe —un cliente no cambia su checadora a la ligera— y también la responsabilidad más grande que tenemos en la cartera.\n\nLA TENEMOS ASÍ DESDE HACE DOS AÑOS Y NO HEMOS HABLADO CON ELLOS. Cero contactos capturados en `contactos_json`. Cero reuniones en veinticuatro meses. Cero de doce preguntas del Radar. Cero registros de adopción. Un solo seguimiento en todo el historial, y las `notas` de la cuenta dicen literalmente «[FALTA_HS]», que es un marcador de pendiente, no una nota. El último contacto que llegó al cliente fue el 17 de julio: 88 días. Hay cuatro alertas abiertas, dos de ellas críticas.\n\nY HAY UNA CONTRADICCIÓN ENTRE DOS FUENTES NUESTRAS que conviene resolver antes de hablar con nadie: la alerta crítica `sin_consumo_medible` dice que esta cuenta tiene «0 de 5 meses con dato de consumo», mientras el archivo de llamadas registra 294,561 minutos de conversación en el mismo periodo. Una de las dos fuentes está equivocada sobre la cuenta que más tráfico mueve de toda la cartera.',

  resultado_positivo: 'Hay mucho que decir aquí, y conviene decirlo entero porque es la primera cuenta de la serie que no tiene un problema de producto.\n\nEL SERVICIO FUNCIONA, Y SE PUEDE DEMOSTRAR. 289,238 llamadas entrantes con 211 sin contestar. La tasa es de 0.07% y se mantiene plana mes a mes: enero 0.1%, febrero 0.1%, marzo 0.1%, y así los ocho meses. El volumen también es estable —entre 31,000 y 37,964 al mes, un 22.5% de variación entre el peor y el mejor—, lo cual para una operación de este tamaño es una señal de normalidad, no de estancamiento. Y la lectura contra su propia base sale a favor: el mes cerrado pierde 0.0654% contra una base de 0.0680%, o sea una llamada MENOS de las que normalmente pierde.\n\nCERO TICKETS EN VEINTICUATRO MESES. Ni uno. Es el único caso así de toda la cartera auditada: Torres Corzo levanta 203, Tech People y Sección Amarilla uno cada una, IMPAS uno. Una cuenta que mueve 34,000 llamadas al mes y nunca ha necesitado a la mesa de ayuda es una cuenta cuyo producto está bien montado.\n\nEL IMPORTE CUADRA. $32,740 en la ficha y $32,740 en el GRC, «MRR estable», sin pérdida declarada. Tras cuatro auditorías seguidas corrigiendo `cuentas.facturacion`, encontrar una donde las dos fuentes coinciden al peso vale la pena anotarlo.\n\nY LA FICHA TIENE CONTEXTO DE NEGOCIO ESCRITO, que tampoco es lo habitual: las observaciones KAM explican que Ecodeli es una de las empresas de limpieza profesional y facility services más grandes de México, que no sólo vende productos, y que opera dividida en dos unidades —Comercial e Industrial— del mismo grupo. Quien escribió eso entendió al cliente. Lo que falta no es comprensión: es relación.',

  hallazgos: [
    'NATURALEZA — NO ES UNA LÍNEA DE CLIENTES, ES UNA CHECADORA TELEFÓNICA. Cuatro evidencias independientes y todas apuntan al mismo sitio: el 32.3% del tráfico del día entra a las 08:00 y el 18.1% a las 16:00 —dos cambios de turno—, con el mediodía en torno al 1% por hora y la noche en CERO; la duración media es 1.02 minutos clavados, idéntica en los dos destinos hasta el segundo decimal; hay 177 números distintos para 289,238 llamadas, o sea 1,634 por número; y uno de los destinos se llama «Voice App». Ninguna de las cuatro por separado concluye; las cuatro juntas no dejan otra lectura.',
    'NATURALEZA — Y ESO LA CONVIERTE EN UNA DEPENDENCIA OPERATIVA, no en un servicio de comunicación. Si el sistema no responde a las 08:00, el personal desplegado en los sitios de cliente no puede registrar su entrada, y eso toca nómina. Es la retención más fuerte que hay en la cartera y la responsabilidad más grande: un cliente no cambia su checadora por precio, pero tampoco perdona una caída en el cambio de turno.',
    'ATENCIÓN — EL 0.07% ES LA MEJOR CIFRA DE LA CARTERA Y NO ES UN LOGRO DE ATENCIÓN: contesta la máquina. Lo cual está bien —es exactamente lo que el cliente compró— pero significa que este indicador NO mide calidad de servicio en esta cuenta. Leerlo como si lo hiciera es lo mismo que pasó en IMPAS y en OOAPAS con la firma inversa: el número es correcto y la interpretación por omisión es equivocada.',
    'CAPACIDAD — UNA HIPÓTESIS QUE EL DATO TUMBÓ, y se deja escrita porque el descarte vale tanto como el hallazgo. Supuse que las 211 pérdidas serían el techo de canales concurrentes tocándose en el pico de las 08:00. ES FALSO: a esa hora la pérdida es 0.071%, prácticamente igual a la media del periodo (0.073%). Las tasas más altas caen en las horas MUERTAS —12:00 con 0.652% sobre 2,912 llamadas, 19:00 con 0.398% sobre 754—, con denominadores tan pequeños que no sostienen ninguna conclusión. No hay evidencia de saturación de canales hoy.',
    'CAPACIDAD — PERO NO SABEMOS CUÁNTOS CANALES COMPRÓ. El servicio registrado es «Canales concurrentes + DiD Nacional» SIN cantidad, y `servicios_json` está vacío. Medido sobre 182 días hábiles, la hora de las 08:00 exige una cota inferior de 8.7 canales en promedio; pero las llamadas no llegan repartidas dentro de la hora, y si la mitad entra en diez minutos la concurrencia real ronda los 26. Sin el número contratado, no se puede decir si tiene holgura para crecer.',
    'MEDICIÓN — DOS FUENTES NUESTRAS SE CONTRADICEN SOBRE LA CUENTA DE MÁS TRÁFICO DE LA CARTERA. La alerta crítica `sin_consumo_medible` afirma que el CID 164581 tiene «0 de 5 meses con dato de consumo», mientras el archivo de llamadas registra 294,561 minutos en el mismo periodo. O la cuenta no está en el Informe de Cortes, o está con otro identificador. Hay que resolverlo antes de hablar con el cliente de cualquier cosa de consumo.',
    'MEDICIÓN — LA MITAD DEL TRÁFICO NO TRAE DESTINO. 136,544 de las 289,238 llamadas (el 47.2%) caen en «(destino no venía en el archivo)», contra 152,638 en «Voice App». Las dos mitades tienen exactamente el mismo perfil —1.02 min por llamada, 0.1% de pérdida—, así que probablemente son el mismo flujo partido por una etiqueta que falta. Probablemente no es seguro: hay que confirmarlo.',
    'RELACIÓN — VEINTICUATRO MESES SIN UNA SOLA REUNIÓN. Cero filas en `reuniones`. Es la cuenta que más volumen mueve de toda la cartera y nunca nos hemos sentado con ella.',
    'RELACIÓN — CERO CONTACTOS CAPTURADOS. `contactos_json` está vacío, y la alerta `sin_contactos` lleva abierta desde el 6 de octubre. Si mañana esta cuenta llama para cancelar, hoy no sabemos a quién marcarle.',
    'FICHA — EL ÚNICO CONTACTO QUE HAY ESTÁ MAL CAPTURADO, y es el mismo defecto que en Torres Corzo: el correo vive DENTRO del campo de nombre —«Juan Marzuca       juan.desarrollo@ecodeli-industrial.com»— mientras `contacto_email` está VACÍO. Y `contacto_tel` trae dos números pegados: «4776461024     800 849 9000». Un dato que existe pero está en el campo equivocado es invisible para cualquier automatismo.',
    'FICHA — LA CUENTA MEZCLA LAS DOS RAZONES SOCIALES DEL GRUPO. El domicilio fiscal registrado (Av. Restauradores 1001, Col. Los Arcos, León) corresponde a **Ecodeli Comercial**; la página web registrada y el correo del contacto son de **Ecodeli Industrial**. Son dos empresas distintas del mismo grupo, y la ficha lleva una de cada una bajo un solo CID. Para una renovación importa saber cuál firma.',
    'RELACIÓN — 0 de 12 preguntas del Radar y 0 registros de adopción de producto. Score relacional 31. Health Score 47 con tres de sus cuatro bloques en el 50 por omisión, o sea medido al 25%.',
    'RELACIÓN — 88 DÍAS SIN QUE NADA LLEGUE AL CLIENTE. Alerta `silencio_60` crítica desde el 18 de julio. El último contacto efectivo fue el 17 de julio y la propia actividad de ese día dice «no se logra contacto, se reintentará». Hubo actividad posterior —el 18— pero no llegó al cliente. De tres actividades registradas, una quedó sin completar.',
    'FICHA — LAS `notas` DE LA CUENTA SON LITERALMENTE «[FALTA_HS]». No es una nota: es un marcador de pendiente que lleva ahí desde la importación. Las observaciones KAM sí tienen contenido de negocio bueno, así que el hueco es de captura, no de entendimiento.',
    'SERVICIO — CERO TICKETS EN VEINTICUATRO MESES, el único caso de toda la cartera auditada. Con 34,000 llamadas al mes y nunca una incidencia en la mesa, el producto está bien montado. También significa que no existe ninguna vía de contacto operativa: no hay un ticket que dé pie a una conversación, como sí la dio en IMPAS.',
    'CONTEXTO — Grupo Ecodeli opera dos empresas: **Ecodeli Comercial**, distribuidora de productos de limpieza con domicilio en Av. Restauradores 1001, León, y **Ecodeli Industrial**, la rama de servicios. LinkedIn declara entre 5,001 y 10,000 empleados para el grupo, lo que coincide con lo capturado en la ficha. La rama de servicios es la que despliega personal en sitios de cliente — o sea, la que explica la checadora.',
    'CONTEXTO — EL NÚMERO DE SUCURSALES NO ESTÁ CONFIRMADO. La ficha dice «al menos 33 sucursales + 2 tiendas»; un directorio externo menciona 36 para la rama Industrial, pero su propia metadata indica que la publicación tiene más de diez años. Se anota lo que la ficha sostiene y se marca lo demás como no verificado, en vez de citar la cifra que suena mejor.',
    'OPERACIÓN — EL SÁBADO TRABAJA Y EL DOMINGO CASI NO. 7,600 llamadas en sábado contra 324 en domingo, frente a unas 55,000 por día entre semana. Es coherente con una plantilla de limpieza con turno sabatino parcial. El sábado además tiene la peor tasa de pérdida (0.250% contra 0.07% entre semana), aunque sobre sólo 19 llamadas: se anota, no se concluye.',
  ],

  cronologia: [
    { fecha: '30 Sep 2024',  responsable: 'Callpicker',        evento: 'Alta de la cuenta. Servicio: Canales concurrentes + DiD Nacional — un producto de capacidad, no de extensiones. 24 meses de relación ininterrumpida.', tipo: 'ok' },
    { fecha: 'Ene–Ago 2026', responsable: 'Operación Ecodeli', evento: 'Ocho meses completos de una estabilidad notable: entre 31,000 y 37,964 llamadas al mes, siempre con 0.1% sin contestar. La operación no da un solo sobresalto.', tipo: 'ok' },
    { fecha: '17 Jul 2026',  responsable: 'Claudia',           evento: 'Actividad de llamada: «No se logra contacto, se reintentará para actualizar información». Es el ÚLTIMO contacto que llegó al cliente — desde aquí se cuentan los 88 días.', tipo: 'problema' },
    { fecha: '18 Jul 2026',  responsable: 'Claudia',           evento: 'Seguimiento de llamada preventiva registrado, pero no llega al cliente. Se abre la alerta `silencio_60`.', tipo: 'problema' },
    { fecha: '23 Jul 2026',  responsable: 'Claudia',           evento: 'Actividad de llamada programada: NO se completó. Es la única sin cerrar de las tres registradas.', tipo: 'problema' },
    { fecha: '07 Ago 2026',  responsable: 'Claudia',           evento: 'Revisión KAM cerrada: «Estado de relación: Positivo. La cuenta presenta una relación estable y sin señales actuales de riesgo». Correcto en el servicio; el riesgo no estaba ahí.', tipo: 'neutral' },
    { fecha: 'Ago 2026',     responsable: 'Operación Ecodeli', evento: 'Mes cerrado: 35,146 llamadas, 23 perdidas (0.0654%), por DEBAJO de su propia base de 0.0680%. Una llamada menos de las que normalmente pierde.', tipo: 'ok' },
    { fecha: '06 Oct 2026',  responsable: 'Motor de alertas',  evento: 'Se abren tres alertas: `sin_consumo_medible` (crítica), `sin_radar` (alta) y `sin_contactos` (alta). La de consumo afirma «0 de 5 meses» sobre una cuenta con 294,561 minutos registrados.', tipo: 'problema' },
    { fecha: '13 Oct 2026',  responsable: 'Callpicker',        evento: 'Primera auditoría de la cuenta. El perfil horario revela que no es una línea de atención sino una checadora telefónica, y eso reordena qué clase de cuenta es.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Grupo',                 value: 'Grupo Ecodeli — DOS razones sociales: Ecodeli Comercial (distribución) y Ecodeli Industrial (servicios)' },
    { label: 'Giro',                  value: 'Limpieza profesional y servicios de facility' },
    { label: 'Tamaño',                value: 'Corporativo · 5,001–10,000 empleados (declarado en LinkedIn y coincidente con la ficha)' },
    { label: 'Cobertura',             value: 'Al menos 33 sucursales + 2 tiendas (lo que sostiene la ficha). Una fuente externa menciona 36 para Industrial, pero su publicación tiene más de diez años: NO verificado.' },
    { label: 'Domicilio fiscal',      value: 'Av. Restauradores 1001, int. 1, Col. Los Arcos, León, Gto. C.P. 37490 — corresponde a Ecodeli COMERCIAL' },
    { label: 'Sitio',                 value: 'ecodeli-industrial.com — corresponde a Ecodeli INDUSTRIAL. La ficha lleva una entidad en cada campo.' },
    { label: 'Contacto registrado',   value: 'Juan Marzuca, Gerente de Desarrollo Industrial · juan.desarrollo@ecodeli-industrial.com · 477 646 1024 / 800 849 9000. OJO: el correo está dentro del campo de nombre y `contacto_email` está vacío.' },
    { label: 'Cliente desde',         value: '30 de septiembre de 2024 — 24 meses' },
    { label: 'Servicio contratado',   value: 'Canales concurrentes + DiD Nacional. SIN cantidad registrada, y `servicios_json` vacío.' },
    { label: 'Facturación mensual',   value: '$32,740 MXN — ficha y GRC COINCIDEN al peso. «MRR estable», sin pérdida declarada.' },
    { label: 'Salud de pago',         value: 'Al corriente · 0 incidencias en 24 meses' },
    { label: 'Tickets en la mesa',    value: 'CERO en toda la relación — único caso de la cartera auditada' },
    { label: 'Uso real medido',       value: '289,238 llamadas · 294,561 minutos · 1.02 min por llamada · 177 números distintos' },
    { label: 'Health Score',          value: '47 · relacional 31, actividad 50, adopción 50, pago 50 (tres de cuatro por omisión)' },
  ],

  necesidad_negocio: 'Ecodeli vende limpieza profesional con personal desplegado en los sitios de sus clientes. Entre 5,001 y 10,000 empleados repartidos en más de treinta sucursales, trabajando en oficinas, naves industriales y hospitales que no son suyos. Su problema operativo de fondo no es comunicarse: es SABER QUIÉN ESTÁ DÓNDE, y a qué hora llegó.\n\nEso es lo que compró. No contrató extensiones ni un conmutador: contrató canales concurrentes y un DiD nacional, que es la forma de poner un número al que cualquiera puede marcar desde cualquier teléfono del país y que aguante muchas llamadas a la vez. El trabajador marca desde el teléfono del sitio al entrar y al salir, la aplicación de voz lo registra, y la llamada dura un minuto.\n\nY por eso el perfil es el que es: dos picos pegados al cambio de turno, el mediodía muerto, la noche en cero, el sábado a un séptimo del ritmo y el domingo apagado. Es el horario de una plantilla, no el de un público.\n\nLa necesidad que tiene hoy, y que nadie le ha preguntado, es de CAPACIDAD Y DE CERTEZA. Capacidad porque su operación entera se concentra en dos ventanas de una hora, y si crece la plantilla el pico crece con ella. Certeza porque un registro de asistencia que falla no es una molestia: es una discusión de nómina con un trabajador. Lo que se le puede ofrecer no es más telefonía — es la garantía, medida, de que esa ventana de las 08:00 aguanta.',

  potencial_corto: [
    'Decirle cuántos canales está usando en su pico y cuántos tiene contratados. Hoy no lo sabemos nosotros ni probablemente él, y es la pregunta que su operación tiene todos los días a las 08:00.',
    'Resolver la contradicción entre nuestras dos fuentes: 294,561 minutos registrados en llamadas contra «0 de 5 meses de consumo» en los cortes. Sin eso no se puede hablar de capacidad con cifras.',
    'Capturar contactos y hacer la primera reunión en 24 meses. No hace falta un pretexto comercial: llevarle su propio perfil horario ya es motivo suficiente.',
    'Corregir el contacto mal capturado —el correo está dentro del campo de nombre— y separar las dos razones sociales del grupo en la ficha.',
  ],

  potencial_largo: [
    'Reporte de asistencia por sitio y por turno: si la plataforma ya registra quién marca desde dónde y a qué hora, ese dato es materia de supervisión operativa para el cliente, no sólo un CDR.',
    'IA de Voz sobre el flujo de registro: podría identificar, confirmar y responder sin ocupar un canal el tiempo completo, que es justo lo que alivia un pico concentrado.',
    'Callpicker Chat: no lo tiene contratado. Una plantilla de miles de personas en campo es el caso natural de un canal de texto para incidencias.',
    'Integración API con su sistema de nómina o de recursos humanos: hoy `tiene_integracion_api` está en falso, y el dato de asistencia tiene que acabar en algún sitio.',
  ],

  tacticas: [
    { nombre: 'Llevarle su propio perfil horario', descripcion: 'Enseñarle la gráfica: 32.3% a las 08:00, 18.1% a las 16:00, mediodía muerto. Son SUS datos y describen su operación mejor que cualquier presentación.', impacto: 'Demuestra que entendemos su negocio y no sólo su factura. Abre la conversación de capacidad sin tener que venderla.' },
    { nombre: 'Entrar por la certeza, no por el precio', descripcion: 'La pregunta es «¿qué pasa en su operación si el registro de las 08:00 falla?». No es una amenaza: es el riesgo que el cliente ya tiene y nadie ha puesto en la mesa.', impacto: 'Convierte un servicio invisible en un servicio crítico, que es lo que de hecho es.' },
    { nombre: 'Aprovechar que NO hay quejas', descripcion: 'Cero tickets en 24 meses es la mejor credencial posible. Se entra desde la fortaleza, no a reparar nada.', impacto: 'Es la única cuenta de la serie donde la conversación puede empezar en positivo.' },
    { nombre: 'Preguntar cuál empresa firma', descripcion: 'El grupo tiene dos razones sociales y la ficha lleva una en el domicilio y otra en el sitio y el correo. Aclararlo antes de cualquier renovación.', impacto: 'Evita descubrirlo en el momento equivocado, que es cuando hay que firmar.' },
  ],

  senal_alarma: 'La cuenta que más tráfico mueve de toda la cartera —289,238 llamadas, 294,561 minutos— es una dependencia operativa de la que no tenemos un solo contacto capturado, ni una reunión en veinticuatro meses, ni una pregunta del Radar, ni un registro de adopción, y lleva 88 días sin que nada le llegue. Funciona tan bien que nadie ha tenido que mirarla, y por eso no hay nadie a quien llamar el día que deje de funcionar.',

  problema_raiz: 'Que una cuenta no dé problemas no es lo mismo que esté atendida. Ecodeli lleva dos años funcionando sin una sola incidencia, y ese silencio se leyó como salud en vez de como ausencia.',

  problema_raiz_detalle: 'El expediente de esta cuenta no tiene un fallo de servicio que explicar, y eso es precisamente lo que hay que explicar. 289,238 llamadas con 0.07% sin contestar, cero tickets en veinticuatro meses, pagos impecables y el importe cuadrado con el GRC. Todo lo que el tablero mide salió bien, y la última revisión KAM —del 7 de agosto— concluyó, con razón para lo que miraba: «relación estable y sin señales actuales de riesgo».\n\nLa primera capa del problema es que los indicadores que estaban bien NO cubren lo que importa en esta cuenta. El 0.07% sin contestar mide que una máquina respondió, no que el servicio sea bueno. Es correcto como dato y engañoso como señal, igual que en IMPAS pero con el signo contrario: allí el verde tapaba que nadie atendía, aquí el verde tapa que nadie habla con el cliente. Cuando el único semáforo que se mira es el de atención telefónica, una cuenta automatizada siempre saldrá en verde.\n\nLa segunda es que nunca se identificó QUÉ ES esta cuenta. Las observaciones KAM explican bien la empresa —las dos unidades de negocio, el tamaño, el sector— pero en ninguna parte está escrito para qué usa el cliente el servicio. Y el dato estaba disponible desde el primer mes: el perfil horario con dos picos de turno, la duración de un minuto, los 177 números. No hacía falta preguntarle al cliente para sospecharlo; hacía falta mirarlo. Sin esa lectura, la cuenta se gestionó como telefonía genérica y no como lo que es: la infraestructura con la que se registra la asistencia de miles de personas.\n\nLa tercera es de relación, y es la consecuencia de las dos anteriores. Veinticuatro meses, cero reuniones, cero contactos capturados, cero Radar, cero adopción, un seguimiento, una actividad sin completar y 88 días de silencio. No por descuido: porque una cuenta que no se queja nunca sube a la cola de nadie. El trabajo se dirige a lo que grita, y ésta nunca ha gritado.\n\nY la cuarta es de medición, y es la más fácil de arreglar: dos fuentes nuestras se contradicen sobre esta cuenta. El archivo de llamadas registra 294,561 minutos; el Informe de Cortes dice que no hay un solo mes con dato de consumo, y una alerta crítica lo publica. Mientras eso siga así, no se puede sostener ninguna conversación de capacidad — que es justamente la que esta cuenta necesita.',

  flujo_real: [
    { fase: 'Empieza el turno',        area: 'Personal de Ecodeli', accion: 'El trabajador marca al DiD nacional desde el teléfono del sitio de cliente', resultado: '93,288 llamadas a las 08:00 — el 32.3% de todo el día' },
    { fase: 'Contesta la plataforma',  area: 'Callpicker',          accion: 'La «Voice App» responde y registra el movimiento', resultado: '1.02 minutos por llamada · 0.07% sin contestar' },
    { fase: 'Termina el turno',        area: 'Personal de Ecodeli', accion: 'Marca otra vez al salir', resultado: '52,222 llamadas a las 16:00 — el 18.1%' },
    { fase: 'El resto del día',        area: '—',                   accion: 'Prácticamente nada: mediodía al 1% por hora, noche en CERO', resultado: 'El perfil de una plantilla, no el de un público' },
    { fase: 'El dato va a algún sitio',area: 'Ecodeli',             accion: 'Presumiblemente a su control de asistencia o nómina', resultado: 'NO SABEMOS — `tiene_integracion_api` está en falso y nadie lo ha preguntado' },
    { fase: 'El tablero lo evalúa',    area: 'Dashboard',           accion: 'Calcula el % sin contestar', resultado: '0.07%, la mejor cifra de la cartera — y mide que contestó una máquina' },
    { fase: 'SAC revisa la cuenta',    area: 'SAC',                 accion: 'Revisión KAM', resultado: '«Relación estable y sin señales actuales de riesgo». Cierto en el servicio; el riesgo estaba en la ausencia de relación.' },
  ],

  comparativo: [
    { metrica: 'Llamadas sin contestar', real: '0.07% (211 de 289,238)', ideal: 'Ya está. Es la mejor de la cartera.' },
    { metrica: 'Qué mide ese 0.07%', real: 'Que contestó una máquina', ideal: 'Que el indicador diga sobre qué tipo de flujo opina' },
    { metrica: 'Tickets en 24 meses', real: 'CERO', ideal: 'Ya está. Único caso de la cartera.' },
    { metrica: 'Importe ficha vs GRC', real: '$32,740 = $32,740', ideal: 'Ya está. Único caso de las cinco auditorías.' },
    { metrica: 'Canales concurrentes contratados', real: 'NO REGISTRADO — el servicio no trae cantidad', ideal: 'El número, para poder compararlo con el pico medido' },
    { metrica: 'Meses con dato de consumo', real: '0 de 5, contra 294,561 minutos registrados en llamadas', ideal: 'Que las dos fuentes digan lo mismo' },
    { metrica: 'Reuniones en 24 meses', real: 'NINGUNA', ideal: 'Trimestral en una cuenta de este volumen: 8' },
    { metrica: 'Contactos capturados', real: '0 en `contactos_json`', ideal: 'Quien opera, quien decide y quien paga: mínimo 3' },
    { metrica: 'Radar de 12 preguntas', real: '0 respondidas', ideal: '12 de 12' },
    { metrica: 'Registros de adopción', real: '0', ideal: 'Al menos el producto que realmente usa' },
    { metrica: 'Días desde el último contacto', real: '88', ideal: '<30, que es el umbral de la casa' },
    { metrica: 'Bloques del Health Score medidos', real: '1 de 4 (sólo el relacional)', ideal: '4 de 4' },
  ],

  plan_inmediato: [
    { accion: 'Resolver la contradicción entre fuentes: el archivo de llamadas registra 294,561 minutos y el Informe de Cortes dice «0 de 5 meses con dato de consumo». Una de las dos está equivocada sobre la cuenta de más tráfico de la cartera', responsable: 'Ingeniería', criterio: 'O la cuenta aparece en los cortes, o queda escrito por qué no puede aparecer' },
    { accion: 'Averiguar cuántos canales concurrentes tiene contratados: el servicio registrado no trae cantidad y `servicios_json` está vacío', responsable: 'Facturación / Claudia', criterio: 'El número en la ficha, comparado contra el pico medido de las 08:00' },
    { accion: 'Llamar: 88 días sin que nada llegue al cliente, con `silencio_60` crítica abierta. Abrir con su propio perfil horario, que describe su operación', responsable: 'Claudia', criterio: 'Contacto efectivo registrado y la alerta cerrada por trabajo, no por el paso del tiempo' },
    { accion: 'CONFIRMAR con el cliente para qué usa el servicio. El perfil dice checadora telefónica con cuatro evidencias, pero eso es nuestra lectura, no su palabra', responsable: 'Claudia', criterio: 'Queda escrito en la ficha para qué usa el cliente el servicio, en sus términos' },
    { accion: 'Corregir el contacto: el correo está DENTRO del campo de nombre y `contacto_email` está vacío; `contacto_tel` trae dos números pegados', responsable: 'Claudia', criterio: 'Los campos separados, y al menos tres contactos en `contactos_json`' },
    { accion: 'Aclarar cuál de las dos razones sociales del grupo es la contratante: la ficha lleva el domicilio de Ecodeli Comercial y el sitio y el correo de Ecodeli Industrial', responsable: 'Claudia / Facturación', criterio: 'La entidad contratante escrita en la ficha antes de cualquier renovación' },
  ],

  plan_mediano: [
    { accion: 'Primera reunión en 24 meses, con quien opera el registro de asistencia y con quien lo consume del lado de recursos humanos', responsable: 'Claudia', criterio: 'Reunión registrada con minuta, y el Radar contestado en la misma sesión' },
    { accion: 'Medir la concurrencia real dentro de la hora pico, no sólo el promedio horario. La cota inferior son 8.7 canales, pero si la mitad entra en diez minutos son unos 26', responsable: 'Ingeniería', criterio: 'Se publica el pico real y se compara contra lo contratado' },
    { accion: 'Aclarar por qué el 47.2% del tráfico cae en «(destino no venía en el archivo)». Tiene el mismo perfil que «Voice App», así que probablemente es el mismo flujo — pero probablemente no basta', responsable: 'Ingeniería', criterio: 'Todas las llamadas con destino identificado' },
    { accion: 'Capturar la adopción real: hoy hay cero registros en una cuenta con 289,238 llamadas', responsable: 'SAC', criterio: 'El producto que de verdad usa, registrado con su nivel' },
  ],

  plan_estrategico: [
    { accion: 'Reporte de asistencia por sitio y por turno. Si la plataforma ya sabe quién marcó desde dónde y a qué hora, ese dato es supervisión operativa para el cliente y no sólo un registro de llamadas', responsable: 'Producto / Claudia', criterio: 'Propuesta presentada con una muestra de sus propios datos' },
    { accion: 'IA de Voz sobre el flujo de registro, que es lo que alivia un pico tan concentrado sin vender más canales', responsable: 'Claudia', criterio: 'Propuesta con el cálculo de canales liberados en la ventana de las 08:00' },
    { accion: 'Integración API con su sistema de nómina o RH: el dato de asistencia tiene que acabar en algún sitio y hoy no sabemos en cuál', responsable: 'Ingeniería / Claudia', criterio: 'Se documenta a dónde va el dato hoy, y se propone la integración si no la hay' },
    { accion: 'QUE EL SEMÁFORO DE ATENCIÓN DIGA SOBRE QUÉ OPINA. En esta cuenta el 0.07% mide una máquina contestando y sale verde; en IMPAS el 0% sin contestar tapaba que nadie atendía. El mismo indicador no puede significar lo mismo en los dos casos', responsable: 'Producto / Dirección', criterio: 'La ficha distingue flujo automatizado de flujo atendido por personas' },
  ],

  areas_oportunidad: [
    { area: 'Capacidad en la ventana de las 08:00', impacto: 'El 32.3% de la operación diaria del cliente en una sola hora', responsable: 'Ingeniería / Claudia' },
    { area: 'Reporte de asistencia por sitio', impacto: 'Convierte un CDR en supervisión operativa para el cliente', responsable: 'Producto' },
    { area: 'Integración con nómina / RH', impacto: '`tiene_integracion_api` en falso sobre 289,238 registros al periodo', responsable: 'Ingeniería' },
    { area: 'IA de Voz en el flujo de registro', impacto: 'Alivia el pico sin vender más canales', responsable: 'Claudia' },
    { area: 'Primera reunión en 24 meses', impacto: 'La cuenta de mayor volumen de la cartera, sin relación', responsable: 'Claudia' },
    { area: 'Chat para personal en campo', impacto: 'Miles de empleados desplegados y ningún canal de texto', responsable: 'Claudia' },
  ],

  perfiles: [
    {
      nombre: 'Juan Marzuca', rol: 'Gerente de Desarrollo Industrial — Ecodeli', color: '#6366f1',
      campos: [
        { label: 'Correo',    value: 'juan.desarrollo@ecodeli-industrial.com' },
        { label: 'Teléfonos', value: '477 646 1024 · 800 849 9000' },
        { label: 'Estado',    value: 'Es el ÚNICO contacto de la cuenta, y está mal capturado: su correo vive dentro del campo de nombre y `contacto_email` está vacío.' },
        { label: 'Riesgo',    value: 'Punto único de contacto en la cuenta de mayor volumen de la cartera, y sin una reunión en 24 meses' },
      ],
    },
    {
      nombre: 'Quien opera el registro de asistencia', rol: 'SIN IDENTIFICAR — Ecodeli', color: '#ef4444',
      campos: [
        { label: 'Por qué importa', value: 'Es quien nota si el sistema falla a las 08:00, y quien decidiría cambiarlo' },
        { label: 'Qué sabemos',     value: 'Nada. `contactos_json` está vacío y no hay reuniones en 24 meses.' },
        { label: 'Dónde buscarlo',  value: 'Operaciones o Recursos Humanos de Ecodeli Industrial, que es la rama que despliega personal' },
      ],
    },
    {
      nombre: 'Claudia', rol: 'Asesora SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades',  value: '3 registradas · 2 completadas · 1 sin completar (llamada del 23 jul)' },
        { label: 'Lo que escribió bien', value: 'Las observaciones KAM explican el grupo, sus dos unidades de negocio y su tamaño. El entendimiento del cliente está.' },
        { label: 'Lo que faltó', value: 'Para qué usa el cliente el servicio. El perfil horario lo decía desde el primer mes.' },
        { label: 'Contexto',     value: 'Suspendida del tablero del 6 al 12 oct 2026 por instrucción de dirección' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '289,238 llamadas con 0.07% sin contestar — la mejor cifra de toda la cartera auditada',
      'CERO tickets en 24 meses: el único caso de la cartera',
      'Importe de la ficha y del GRC coincidentes al peso, «MRR estable»',
      'Cero incidencias de pago en dos años',
      'Volumen estable mes a mes (22.5% de variación entre el mejor y el peor)',
      'Las observaciones KAM tienen contexto de negocio real sobre el grupo',
    ],
    oportunidades: [
      'Reporte de asistencia por sitio y turno: el dato ya existe y hoy sólo se usa como CDR',
      'No tiene IA de Voz, Chat, IA de Chat ni integración API contratados',
      'El pico de las 08:00 concentra el 32.3% del día: es donde una propuesta de capacidad se justifica sola',
      'Miles de empleados en campo y ningún canal de texto',
    ],
    debilidades: [
      'Cero reuniones, cero contactos capturados, cero Radar y cero adopción en 24 meses',
      '88 días sin que nada llegue al cliente, con alerta crítica abierta',
      'No sabemos cuántos canales contrató ni cuánto consume: dos fuentes nuestras se contradicen',
      'El único contacto está mal capturado y la ficha mezcla las dos razones sociales del grupo',
      'Las `notas` de la cuenta son literalmente «[FALTA_HS]»',
      'Cero tickets significa también que no existe ninguna vía de contacto operativa',
    ],
    amenazas: [
      'ES UNA DEPENDENCIA OPERATIVA Y NADIE DEL LADO DEL CLIENTE NOS CONOCE. Si el registro falla en un cambio de turno, el problema es de nómina, y la conversación la abriría alguien con quien nunca hemos hablado.',
      'Un servicio que funciona solo es un servicio que se puede sustituir sin drama: no hay relación que lo defienda, y hoy una checadora se resuelve también con una app de móvil',
      'Si la plantilla crece, el pico de las 08:00 crece con ella — y no sabemos cuánta holgura de canales hay',
      'Dos razones sociales y un solo CID: una renovación puede encontrarse con que firma quien no esperábamos',
      'La cuenta no se queja nunca, así que no hay indicador que se encienda antes de la no renovación',
    ],
  },

  conclusion: 'Ecodeli es la mejor cuenta de las cinco auditadas y la que peor conocemos. 289,238 llamadas con 211 perdidas, cero tickets en dos años, pagos impecables y el importe cuadrando al peso con el GRC. Todo lo que el tablero mide sale bien, y la última revisión concluyó «relación estable y sin señales actuales de riesgo». Para lo que miraba, tenía razón.\n\nLo que no miraba es qué clase de cuenta es. El perfil horario —32.3% a las 08:00, 18.1% a las 16:00, el mediodía muerto, la noche en cero—, el minuto y dos segundos de duración media y los 177 números que repiten mil seiscientas veces dicen, los tres juntos, lo mismo: esto no es una línea de atención, es la checadora de una plantilla de miles de personas desplegadas en sitios de cliente. Y eso cambia la cuenta de categoría. Deja de ser telefonía y pasa a ser infraestructura de nómina.\n\nAhí está a la vez la mejor noticia y el riesgo. La mejor, porque una dependencia operativa es la retención más fuerte que existe: nadie cambia su control de asistencia por ahorrarse unos pesos. El riesgo, porque llevamos veinticuatro meses sin una reunión, sin un contacto capturado y sin una sola pregunta del Radar — de modo que el día que algo falle en el cambio de turno, la conversación la abrirá alguien a quien no conocemos, sobre un servicio que nunca le explicamos que era crítico.\n\nY queda una lección de la casa que no es sobre Ecodeli: el semáforo de atención telefónica salió verde aquí porque contesta una máquina, y en IMPAS salió verde porque contestaba otra. El mismo indicador, en las dos cuentas más automatizadas de la cartera, no dijo nada útil en ninguna de las dos. Una cuenta que no se queja no es una cuenta sana: es una cuenta de la que no estamos recibiendo información.',

  pierde: [
    'Callpicker pierde $32,740 al mes si esta cuenta no renueva — y con ella el mayor volumen de la cartera: 289,238 llamadas al periodo.',
    'Se pierde el caso de uso más demostrable que tenemos: una operación de miles de personas en campo funcionando con 0.07% de pérdida durante dos años.',
    'Se pierde sin aviso: cero tickets y cero quejas significan que no hay ningún indicador que se encienda antes de la no renovación.',
    'Y se pierde una referencia de sector: Ecodeli es uno de los grupos de limpieza profesional más grandes de México.',
  ],

  gana: [
    'No tiene contratados IA de Voz, Chat, IA de Chat ni integración API: la base para crecer está entera y el uso ya está probado.',
    'El pico de las 08:00 justifica por sí solo una conversación de capacidad, sin tener que inventar una necesidad.',
    'Un reporte de asistencia por sitio convierte un dato que ya generamos en una herramienta de supervisión para el cliente.',
    'Es la única cuenta de la serie donde la conversación puede abrirse desde la fortaleza: cero tickets en 24 meses es una credencial que no hay que argumentar.',
  ],

  recomendacion_central: 'LLAMAR, Y LLEVAR SU PROPIO PERFIL HORARIO EN LA MANO. No hay nada que reparar en esta cuenta, así que la conversación no es de servicio: es de negocio, y el mejor material que tenemos son sus propios datos. Enseñarle que el 32.3% de su tráfico diario entra a las 08:00 y el 18.1% a las 16:00 demuestra en una gráfica que entendemos su operación, y abre sola la única pregunta que importa — «¿qué pasa en su operación si ese registro falla en el cambio de turno?». No es una amenaza: es un riesgo que el cliente ya tiene y que nadie le ha puesto sobre la mesa en veinticuatro meses.\n\nANTES DE ESA LLAMADA, DOS COSAS DE CASA. La primera: resolver por qué el archivo de llamadas registra 294,561 minutos y el Informe de Cortes dice que esta cuenta no tiene un solo mes con dato de consumo. Son dos fuentes nuestras contradiciéndose sobre la cuenta de mayor tráfico de la cartera, y mientras no se resuelva no se puede sostener ninguna conversación de capacidad con cifras. La segunda: averiguar cuántos canales concurrentes contrató, porque el servicio registrado no trae cantidad — y sin ese número, el pico medido no se puede comparar contra nada.\n\nY CONFIRMAR LO QUE AQUÍ SE CONCLUYE. Que esto es una checadora telefónica lo sostienen cuatro evidencias independientes, pero sigue siendo nuestra lectura y no la palabra del cliente. Preguntárselo cuesta una frase y cambia cómo se gestiona la cuenta a partir de entonces: si se confirma, esta deja de ser una cuenta de telefonía en el tablero y pasa a ser una dependencia operativa, con el nivel de atención que eso exige.\n\nLo que NO hay que hacer es seguir leyendo el 0.07% como una buena noticia y dejarla tranquila otros veinticuatro meses. Ese número no dice que la cuenta esté bien atendida: dice que una máquina contesta el teléfono. Que una cuenta no se queje nunca no es salud — es ausencia de información.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — CERO tickets de ECODELI (CID 164581) en lib/tickets-data.json',
    periodo: 'Septiembre 2024 – Octubre 2026 · la fuente trae SÓLO tickets CERRADOS',
    diagnostico: 'No hay un solo ticket en veinticuatro meses de relación, y es el único caso de toda la cartera auditada: Torres Corzo levanta 203, Tech People, Sección Amarilla e IMPAS uno cada una. Para una cuenta que mueve 34,000 llamadas al mes, eso significa que el producto está bien montado y que el cliente no necesita ayuda para operarlo. Pero tiene una segunda lectura menos cómoda: la mesa de ayuda es, en varias de las cuentas de esta serie, la ÚNICA vía por la que el cliente se deja ver. En IMPAS un ticket de facturación fue lo que probó que el cliente estaba localizable. Aquí no hay ninguno, así que no existe ninguna vía de contacto operativa — y eso, sumado a cero reuniones y cero contactos capturados, es por qué esta cuenta lleva dos años en silencio total.',
    metricas: [
      { metrica: 'Tickets totales',     valor: 'CERO (sep 2024 – oct 2026)', lectura: 'Único caso de la cartera auditada' },
      { metrica: 'Llamadas por ticket', valor: '289,238 / 0',                lectura: 'No hay denominador: el producto no ha requerido intervención' },
      { metrica: 'Fallas del servicio', valor: '0',                          lectura: 'Nada que reparar' },
      { metrica: 'Vía de contacto operativa', valor: 'NINGUNA',              lectura: 'Sin tickets, sin reuniones y sin contactos, no hay por dónde entrar' },
    ],
    reincidencias: [],
    hallazgos: [
      'Cero tickets en 24 meses con 34,000 llamadas al mes es la credencial más fuerte de toda la cartera, y conviene usarla al abrir la conversación.',
      'También significa que no hay ninguna vía de contacto operativa: en IMPAS un ticket de facturación probó que el cliente respondía; aquí no existe ese hilo.',
      'Con denominador cero, ninguna métrica de servicio es calculable. Se publica el cero porque es el hallazgo, no porque se pueda interpretar.',
    ],
  },
}
