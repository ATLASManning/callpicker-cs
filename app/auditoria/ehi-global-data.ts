import type { AuditoriaCase } from './types'

/**
 * EHI GLOBAL (Grupo Antyr · marca Enterprise) · D8 · CID 147935 · Dan
 *
 * Alta del 26 nov 2026, a partir del reporte entregado
 * «Auditoría de llamadas · EHI Global (Grupo Antyr) · CID 147935».
 *
 * CONCILIADO contra nuestras fuentes antes de publicar:
 *   · `cuentas` D8: empresa «EHI GLOBAL», asesor Dan, estado activo, cliente
 *     desde el 11 abr 2024, giro renta de vehículos, 73 oficinas, 1,100
 *     empleados, sede fiscal en La Paz B.C.S., pagos al corriente. Último
 *     contacto 29 oct 2026. 2 episodios de alerta abiertos.
 *   · MRR: el GRC la trae AAA con `movimiento = 'MRR estable'`, mrrIni =
 *     mrrFin = $15,099, 11 facturas, 31 meses, $481,287 acumulados. Y
 *     `servicios_json` suma EXACTAMENTE eso: Troncal SIP con integración a
 *     Bitrix ($15,000) + DiD Nacional 3314540864 ($99). El importe fijo de
 *     $15,099 que publica el reporte queda verificado al peso.
 *     `cuentas.facturacion` guarda $15,607: desalineada por $508
 *     ([[grc-fuente-zoho]], [[feedback-fuente-unica-cuentas]]).
 *   · El DID del Bitrix (3314540864) está en `servicios_json` con su renta, y
 *     es el mismo número 33 1454 0864 que el reporte identifica como la cola
 *     que sí resuelve. Coincide.
 *   · La bitácora del KAM del 15 oct 2026 respalda H3 palabra por palabra: el
 *     cliente manifestó satisfacción con Callpicker «como operador principal
 *     de salida» e interés en portar los números que siguen en la troncal de
 *     Telmex, con cancelación de Telmex condicionada a completar la
 *     portabilidad. El listado de números sigue pendiente de la Ing. Jati.
 *
 * VERIFICADO A MANO sobre los datos embebidos del reporte (`const D`):
 *   · El universo CIERRA al dígito en tres caminos independientes:
 *     contestadas 12,946 + internas contestadas 1,081 + pérdidas brutas 2,619
 *     = 16,646 entrantes; y 14,027 − 29 abandonos de menú − 2 buzón = 13,996,
 *     las contestadas que cita el bloque de calidad.
 *   · Tráfico interno: 1,983 llamadas y 902 pérdidas, exactamente la
 *     diferencia entre las pérdidas brutas (2,619) y las reales (1,717).
 *     Tasa bruta 15.73% → 11.71% sin ellas. Ambas cifras del reporte exactas.
 *   · Línea 0404: 1,491 pérdidas en la serie mensual, 86.84% de las 1,717
 *     reales, con 23.85% del tráfico real. Exacto.
 *   · Las franjas del mapa de calor se reconstruyen al dígito: 8 h = 137 de
 *     146, 15 h = 211 de 295, 16 h = 265 de 297, 19–21 h = 177 de 207 y el fin
 *     de semana 325 de 325 (cien por ciento perdido).
 *   · Salientes: 85,037 a teléfono, 56,317 conectadas = 66.23%; 52,745 minutos
 *     internacionales de 116,558 = 45.25%. Minutos totales de 16,242 en enero
 *     a 10,664 en octubre = −34.3%. Todo exacto.
 *
 * CORRECCIÓN marcada dentro del documento publicado
 * (ver `scripts/publica-auditorias-2026-11-26.py`):
 *   «En la franja que sí se cubre (9–14 h, lunes a viernes) se pierde 25.6%».
 *   El 25.6% es una cuenta correcta, pero NO de esa población: sale de sumar
 *   los SIETE días (550 de 2,147), y el fin de semana pierde el 100% — el
 *   mismo fin de semana que el párrafo cita aparte como «325 de 325». De
 *   lunes a viernes, 9–14 h, el mapa de calor da 349 de 1,946 = 17.9%. Es el
 *   error clásico de un porcentaje calculado sobre un conjunto distinto al que
 *   lo rotula ([[feedback-metricas-derivadas-origen]]), y corregirlo REFUERZA
 *   el argumento: la franja cubierta está mejor de lo publicado y el fin de
 *   semana es un problema propio, que es justo lo que resuelve el desborde a
 *   Bitrix.
 *
 * DOS HUECOS DECLARADOS, no resueltos:
 *   1. El inventario. El reporte clasifica 109 números (3 activos críticos,
 *      3 activos hasta corte, 76 de bajo uso y 27 sólo de pruebas) y la
 *      bitácora del KAM del 15 oct habla de «105 números contratados». Son dos
 *      conteos del mismo inventario; el listado de Telmex que cerraría el
 *      cruce sigue pendiente del cliente desde esa fecha.
 *   2. Valor de negocio. No se conoce el valor de una reserva ni la tasa de
 *      conversión por llamada de EHI, así que las 666 personas no recuperadas
 *      NO se pueden traducir a ingreso perdido. Se pide, no se estima
 *      ([[feedback-contexto-ia-sin-huecos]]).
 */
export const EHI_GLOBAL: AuditoriaCase = {
  id: 'ehi-global',
  asesor: 'Dan',
  nombre: 'EHI Global (Grupo Antyr · Enterprise)',
  sector: 'Renta de vehículos · 73 oficinas en 36–37 ciudades · 1,100 empleados',
  fecha_periodo: '1 ene – 31 oct 2026 (cerrado) · nov 1–26 en tránsito',
  fecha_auditoria: 'Nov 2026',
  tipo_cliente: 'Clasificación AAA · CID 147935 · D8 · MRR $15,099 (GRC, estable)',
  descripcion_contexto:
    '16,646 llamadas entrantes y 86,051 salientes · 109 números clasificados · Troncal SIP con Bitrix · ' +
    'D8 · CID 147935 · Asesor: Dan · Cliente desde abr 2024 · 31 meses facturados · $481,287 acumulados',
  estado: 'activo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Pérdidas en una sola línea',  value: '86.8% · 1,491 de 1,717',  color: '#ef4444' },
    { label: 'Línea 0404 sin contestar',    value: '42.6% · 1,491 de 3,497',  color: '#dc2626' },
    { label: 'La cola Bitrix',              value: '1.4% · 6,858 llamadas',   color: '#22c55e' },
    { label: 'Devolución en 24 h',          value: '0.3% de las pérdidas',    color: '#f59e0b' },
  ],

  resumen_ejecutivo:
    'La operación de EHI Global no falla: falla una puerta de entrada. De las 1,717 pérdidas reales del ' +
    'año, 1,491 —el 86.8%— están en una sola línea, la 0404, que mueve apenas el 23.8% del tráfico. Esa ' +
    'línea pierde 42.6% de sus 3,497 llamadas y la tasa no mejora en ningún mes del año: entre 29% en ' +
    'marzo y 53% en febrero.\n\n' +
    'El patrón es de horario, no de técnica. En la franja que su equipo cubre (9–14 h de lunes a viernes) ' +
    'la línea pierde 17.9%. Fuera de ella queda sola y el resultado es mecánico: a las 8 h pierde 137 de ' +
    '146, a las 15 h 211 de 295, a las 16 h 265 de 297, de 19 a 21 h 177 de 207 y el fin de semana 325 de ' +
    '325 — el cien por ciento.\n\n' +
    'La solución ya existe dentro de la cuenta. La cola de Bitrix (33 1454 0864) recibe 6,858 llamadas ' +
    'con 1.4% sin contestar, los siete días de la semana de 7 a 21 h, y su equipo opera sábado y domingo ' +
    '(19,893 salientes en fin de semana) mientras la 0404 pierde el 100% de esos mismos días. El 69% de ' +
    'las pérdidas de la 0404 —1,030 de 1,491— ocurre en días y horas que Bitrix ya está cubriendo.\n\n' +
    'Dos lecturas más que cambian la conversación. Una tercera parte de las pérdidas brutas no son ' +
    'clientes: 29 números —pruebas de disponibilidad hechas por el TI del propio cliente— generan 1,983 ' +
    'llamadas y 902 pérdidas; sin ellas la tasa bruta de la cuenta baja de 15.7% a 11.7%. Y la caída de ' +
    'entrantes no es deterioro del servicio: el tráfico de las oficinas se fue a la troncal de Telmex ' +
    'entre abril y julio, con el cliente satisfecho con Callpicker como operador de salida y pidiendo ' +
    'portar los números que siguen en Telmex. La entrada de 70+ oficinas es la oportunidad, no una ' +
    'pérdida consumada.',

  resultado_positivo:
    'La cuenta tiene su propia prueba de que el modelo funciona: la cola de Bitrix atiende 6,858 llamadas ' +
    'con 1.4% sin contestar, de 7 a 21 h, los siete días. Es la misma plataforma, la misma empresa y el ' +
    'mismo periodo. No hay que diseñar una solución — hay que extender la que ya opera.\n\n' +
    'La salida está sana: 85,037 llamadas a teléfono (≈258 por día en 330 días con actividad), 66.2% de ' +
    'conexión estable entre 63.9% y 68.3% mes a mes, y un pico de sólo 15 canales simultáneos. El cliente ' +
    'declaró su satisfacción con Callpicker como operador principal de salida el 15 de octubre y pidió ' +
    'portar los números que aún operan por Telmex, por fallas de códecs con ese proveedor. Y su área de ' +
    'TI quiere métricas por API para su propio Grafana: un cliente técnico que quiere integrarse más, no ' +
    'menos.',

  hallazgos: [
    'Una sola línea, la 0404, concentra el 86.8% de las pérdidas reales con el 23.8% del tráfico: 1,491 de sus 3,497 llamadas sin contestar (42.6%), de 1,698 números distintos.',
    'La cola Bitrix ya resuelve lo que la 0404 pierde: 6,858 llamadas con 1.4% sin contestar, de 7 a 21 h los 7 días. El 69% de las pérdidas de la 0404 cae en horas que Bitrix cubre.',
    'Un tercio de las pérdidas brutas son pruebas internas del propio cliente: 29 números generan 1,983 llamadas y 902 pérdidas. Sin ellas la tasa baja de 15.7% a 11.7%.',
    'La entrada de 70+ oficinas se fue a Telmex entre abril y julio: no se perdió. El cliente está satisfecho con la salida y quiere portar. Es la oportunidad, no una baja consumada.',
    'El patrón de la 0404 es de horario, no de técnica, y se reconstruye al dígito: en la franja cubierta (9–14 h, L–V) pierde 17.9%; a las 8 h pierde 137 de 146, a las 15 h 211 de 295, a las 16 h 265 de 297, de 19 a 21 h 177 de 207 y el fin de semana 325 de 325. Las franjas de 15–16 h coinciden con comida o cambio de turno y las 8 h con la apertura antes de que entre el equipo.',
    'Devolución casi nula: sólo el 0.3% de las pérdidas recibe una llamada saliente contestada en 24 h. De 799 números que se quedaron sin respuesta, 666 (83%) no lograron hablar con EHI en las 72 h siguientes por ningún canal visible en Callpicker; 111 insistieron tres veces o más y un número acumuló 34 intentos sin respuesta.',
    'MARCADO en el documento · «en la franja que sí se cubre (9–14 h, lunes a viernes) se pierde 25.6%» está calculado sobre los SIETE días (550 de 2,147), no sobre lunes a viernes. De lunes a viernes el mapa de calor da 349 de 1,946 = 17.9%, y el fin de semana —que pierde el 100%— ya se cuenta aparte en el mismo párrafo. Corregido en el documento: la franja cubierta está mejor de lo publicado y el fin de semana es un problema propio.',
    'Las pruebas internas son identificables y hay que separarlas, no borrarlas: 28 números que marcaron a 10 o más líneas distintas más el número de contacto de la Ing. Jati. Tres números de La Paz (612 247 0716, 0789 y 0812) recorren 25 líneas en secuencia con minutos de diferencia, 96% sin contestar y sin minutos de conversación, concentrados en días puntuales (27–28 mar, 23–24 jun, 2 jul). Mientras no se separen, cualquier tablero mostrará la cuenta peor de lo que está: la extensión 8803 pasa de 16.1% a 2.9% de pérdida.',
    'La salida de las oficinas tiene fecha: cuatro líneas que recibían 3,690 llamadas de clientes de enero a abril (624 142 1022, 624 104 9100, 624 104 9102 y 624 142 2524) dejan de recibir por completo entre el 27 y el 29 de abril. El resto se apaga gradualmente y la última ronda de pruebas internas ocurre del 16 al 21 de julio, el mismo día de los dos tickets de «Falla (voz)». Desde el 22 de julio sólo tres números reciben llamadas de clientes.',
    'Riesgo de margen que nadie ha medido: 39,362 salientes (46.3%) y 52,745 minutos (45.3%) van a números internacionales, casi todos +1 de Estados Unidos y Canadá —coherente con clientes extranjeros que rentan auto en México—. La troncal se factura en $15,000 al mes. Si la tarifa no contempla terminación +1, este volumen erosiona el margen de la cuenta. Hay que validarlo con Facturación ANTES de cualquier conversación comercial.',
    'Consumo a la baja con importe fijo: los minutos totales caen de 16,242 en enero a 10,664 en octubre (−34%), con entrantes −54% por la salida de las oficinas y salientes −29%. Con $15,099 fijos al mes, la cuenta paga lo mismo por menos uso. Hoy no es un problema — es el argumento exacto que un comprador usaría en una renovación.',
    'No hay dato de calidad, sólo de disponibilidad: sólo 13 de 13,996 entrantes contestadas tienen evaluación (0.1%). No se puede sostener ninguna afirmación sobre calidad de atención de esta cuenta.',
    'HUECO DECLARADO · el valor de una reserva y la tasa de conversión por llamada de EHI no existen en ninguna fuente nuestra. Sin esos dos datos del cliente, las 666 personas no recuperadas NO se pueden traducir a ingreso perdido. Se piden; no se estiman.',
    'HUECO DECLARADO · hay dos conteos del mismo inventario: el reporte clasifica 109 números (3 activos críticos, 3 activos hasta corte, 76 de bajo uso y 27 sólo de pruebas) y la bitácora del KAM del 15 de octubre habla de 105 números contratados. El listado de Telmex que cerraría el cruce sigue pendiente del cliente desde esa fecha, y sin él no se puede decir qué número público corresponde a cada línea Callpicker.',
    'DETALLE QUE IMPORTA PARA LA PORTABILIDAD · la serie semanal de llamadas de clientes a líneas de oficina está en cero desde el 26 de julio, pero registra una llamada en la semana del 15 de noviembre y otra en la del 22. No están del todo apagadas: antes de clasificar un número como «sólo pruebas / sin tráfico» para depurarlo, hay que mirar esas dos.',
    'DIFERENCIA DE FICHA · el MRR institucional es $15,099 y queda verificado por dos caminos: el GRC y la suma de `servicios_json` ($15,000 de troncal + $99 del DID). `cuentas.facturacion` guarda $15,607: desalineada por $508.',
    'RIESGO DE RELACIÓN · toda la cuenta pasa por una sola persona técnica, la Ing. Jati Rodríguez (Redes), y la bitácora del 2 de octubre documenta que no hay número directo con ella: los disponibles son líneas generales y el WhatsApp registrado responde de forma automática. No hay interlocutor en reservaciones ni en firma. `score_relacional` 31 de 100.',
    'CORRIGE UNA LECTURA NUESTRA · la bitácora del 2 de octubre calificó la cuenta como crítica por «bajo rendimiento del conmutador en la recepción de llamadas». Esta auditoría explica el fenómeno completo: una línea mal cubierta más las pruebas internas del cliente más la salida planeada del tráfico de oficinas. El conmutador no tiene bajo rendimiento.',
  ],

  cronologia: [
    { fecha: '11 abr 2024',   responsable: 'Operación',          evento: 'EHI Global inicia como cliente con Troncal SIP integrada a Bitrix ($15,000) más un DID nacional ($99). 31 meses facturados y $481,287 acumulados al corte.', tipo: 'neutral' },
    { fecha: 'Ene–abr 2026',  responsable: 'Operación cliente',  evento: 'Las líneas de oficina reciben 3,690 llamadas de clientes. Las entrantes mensuales están en su máximo (1,797 y 2,465 contestadas en enero y febrero).', tipo: 'neutral' },
    { fecha: '27–29 abr 2026', responsable: 'Cliente',           evento: 'Cuatro líneas de oficina (624 142 1022, 624 104 9100, 624 104 9102 y 624 142 2524) dejan de recibir por completo. El cliente regresó la entrada a la troncal de Telmex o quitó el desvío.', tipo: 'pivote' },
    { fecha: '16–21 jul 2026', responsable: 'TI del cliente',    evento: 'Última ronda de pruebas internas de disponibilidad de líneas, el mismo día en que se registran los dos tickets de «Falla (voz)».', tipo: 'problema' },
    { fecha: '22 jul 2026',   responsable: '—',                  evento: 'Desde esta fecha sólo tres números reciben llamadas de clientes. La caída de entrantes (−54% en minutos) queda explicada y no es deterioro del servicio.', tipo: 'neutral' },
    { fecha: '10 ago 2026',   responsable: 'Soporte',            evento: 'La Ing. Jati reporta intermitencias y cortes en llamadas. Soporte atiende y resuelve, sin respuesta posterior de la cliente.', tipo: 'problema' },
    { fecha: '02 oct 2026',   responsable: 'Dan (KAM)',          evento: 'Bitácora: la cuenta se considera crítica por bajo rendimiento del conmutador en recepción, y se documenta que no hay número de contacto directo con la Ing. Jati. Esta auditoría explica el fenómeno: no es el conmutador.', tipo: 'problema' },
    { fecha: '14 oct 2026',   responsable: 'Dan (KAM)',          evento: 'Primer análisis telefónico de la cuenta sobre 28,062 registros de jul–oct. Se identifica la concentración en Bitrix y el volumen de estatus «Lost».', tipo: 'ok' },
    { fecha: '15 oct 2026',   responsable: 'Dan + Daniel Martínez + Ing. Jati', evento: 'Sesión de seguimiento. El cliente declara satisfacción con Callpicker como operador principal de salida, pide portar los números que siguen en Telmex por fallas de códecs, y solicita métricas por API para su Grafana. Queda pendiente de su lado el listado de números.', tipo: 'pivote' },
    { fecha: '29 oct 2026',   responsable: 'Dan (KAM)',          evento: 'Último contacto registrado. El listado de Telmex sigue sin llegar.', tipo: 'neutral' },
    { fecha: '26 nov 2026',   responsable: 'SAC',                evento: 'Expediente dado de alta. Universo verificado al dígito por tres caminos; una corrección marcada en el documento (el 25.6% de la franja cubierta, que es 17.9% de lunes a viernes); dos huecos declarados.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'EHI GLOBAL · Grupo Antyr (marca Enterprise)' },
    { label: 'Consecutivo · CID',   value: 'D8 · 147935' },
    { label: 'Asesor',              value: 'Dan' },
    { label: 'Clasificación GRC',   value: 'AAA · rango $10,001–$20,000 · 11 facturas · 31 meses · $481,287 acumulados · movimiento «MRR estable»' },
    { label: 'Giro',                value: 'Renta de vehículos · ~70–73 oficinas en 36–37 ciudades, con presencia fuerte en aeropuertos y puntos urbanos' },
    { label: 'Tamaño',              value: 'Mediana · 1,100 empleados · grupo empresarial' },
    { label: 'Sede fiscal',         value: 'La Paz, B.C.S. — lo que hace coherente que las pruebas internas vengan de números 612' },
    { label: 'Cliente desde',       value: '11 de abril de 2024' },
    { label: 'MRR institucional',   value: '$15,099 (GRC), verificado también por la suma de servicios: Troncal SIP $15,000 + DID nacional $99. `cuentas.facturacion` guarda $15,607: desalineada por $508.' },
    { label: 'Servicio',            value: 'Troncal SIP con integración a Bitrix + DID nacional 33 1454 0864' },
    { label: 'Consumo medido',      value: '16,646 entrantes y 86,051 salientes en el periodo · minutos totales de 16,242 (ene) a 10,664 (oct), −34%' },
    { label: 'Inventario',          value: '109 números clasificados en el reporte contra 105 «contratados» en la bitácora del 15 oct: dos conteos del mismo inventario, sin cerrar' },
    { label: 'Contacto',            value: 'Un solo interlocutor: Ing. Jati Rodríguez (Redes). Sin número directo; las líneas disponibles son generales y el WhatsApp responde de forma automática.' },
    { label: 'Adopción',            value: 'Sin Chat, sin IA de Voz, sin IA de Chat, sin integración API activa, sin pago automático · `score_adopcion` 50 / 100' },
    { label: 'Relación',            value: '5 seguimientos · 1 reunión · `score_relacional` 31 / 100 · 2 episodios de alerta abiertos' },
    { label: 'Pagos',               value: 'Al corriente · 0 incidencias de pago · 0 tickets abiertos' },
    { label: 'Último contacto',     value: '29 de octubre de 2026' },
  ],

  necesidad_negocio:
    'EHI Global renta autos a clientes que en casi la mitad de los casos llaman desde Estados Unidos y ' +
    'Canadá, y que llegan a 73 oficinas repartidas en aeropuertos y puntos urbanos. En ese negocio la ' +
    'llamada entrante es una reserva o un cliente ya en destino con un problema, y los dos tienen hora: ' +
    'a las 8 de la mañana antes de abrir, a las 3 de la tarde, el domingo. Justo las franjas en las que la ' +
    'línea 0404 no contesta. Y el canal de salida —85 mil llamadas al año, 99% desde Bitrix— demuestra que ' +
    'el cliente sabe operar por teléfono: lo que no tiene es cobertura de entrada en los bordes.',

  potencial_corto: [
    'Desborde de la 0404 a la cola Bitrix cuando nadie contesta en 20–25 s, y enrutamiento directo a Bitrix sábado, domingo, 8 h, 15–16 h y después de 19 h.',
    'Separar las pruebas internas: que el TI del cliente pruebe desde un número etiquetado, y entregarle las métricas por API para su Grafana.',
    'Pedir de nuevo el listado Telmex (pendiente desde el 15 oct) y cruzarlo con la clasificación de 109 números.',
    'Revisar el margen de los minutos internacionales (+1) contra la tarifa de la troncal, antes de cualquier conversación comercial.',
    'Ampliar interlocutores: llegar a quien opera reservaciones y a quien firma.',
  ],

  potencial_largo: [
    'WhatsApp automático ante llamada perdida en la 0404 («te devolvemos la llamada / reserva aquí»): el propio cliente lo pidió el 15 de octubre.',
    'IA de Voz para la 0404 fuera de horario: toma datos, confirma reservas y deriva emergencias. Cobertura 24/7 sin contratar personal.',
    'Portabilidad de los números que siguen en Telmex: la entrada de 70+ oficinas es la oportunidad real de la cuenta.',
    'Integración por API de métricas técnicas (fallas, desconexiones, códecs) para el Grafana del cliente: refuerza la confianza técnica y amarra la relación.',
  ],

  tacticas: [
    {
      nombre: 'Llevar el mapa de calor, no la tasa',
      descripcion: '«Su línea 0404 pierde 42.6%, pero el 69% de esas pérdidas cae en horas que su propia cola de Bitrix ya cubre.» La conversación deja de ser sobre una falla y pasa a ser sobre una regla de enrutamiento.',
      impacto: 'Convierte un hallazgo incómodo en una propuesta de configuración que el cliente puede aprobar en la misma reunión.',
    },
    {
      nombre: 'Devolverle sus propias pruebas internas',
      descripcion: 'Entregar la lista de los 29 números detectados para que el cliente confirme cuáles son suyos, y ofrecerle las métricas por API que pidió para su Grafana. El 34.4% de las pérdidas no son clientes.',
      impacto: 'Refuerza la confianza técnica con la Ing. Jati, limpia las métricas de ambos lados y responde a algo que el cliente ya solicitó.',
    },
    {
      nombre: 'Decir en voz alta que la caída de entrantes no es deterioro',
      descripcion: 'El tráfico de oficinas se fue a Telmex entre abril y julio, y el cliente lo dijo él mismo: está satisfecho con la salida y quiere portar. Presentarlo como pérdida consumada sería leer el dato al revés.',
      impacto: 'Evita una conversación de churn donde en realidad hay un proyecto de consolidación de 70+ oficinas abierto.',
    },
    {
      nombre: 'Resolver el margen antes de proponer',
      descripcion: '52,745 minutos a +1 sobre una troncal de $15,000 fijos. Si la tarifa no contempla terminación internacional, cualquier propuesta comercial se construye sobre un margen que no existe.',
      impacto: 'Evita llegar a una renovación con margen negativo, y evita proponer volumen adicional que empeore la cuenta.',
    },
    {
      nombre: 'Romper la dependencia de una sola persona',
      descripcion: 'Pedirle a la Ing. Jati que convoque al responsable de la 0404 a la revisión del desborde. Hoy no hay número directo con ella y el WhatsApp responde automático.',
      impacto: 'Reduce el riesgo de que una cuenta AAA de $15,099 dependa de un canal que ya falló dos veces este año.',
    },
  ],

  senal_alarma:
    'El consumo cae 34% con un importe fijo de $15,099: la cuenta paga lo mismo por menos uso, y ése es ' +
    'exactamente el argumento que un comprador usa en una renovación. A eso se suma que toda la relación ' +
    'pasa por una sola persona técnica con la que no hay número directo, y que casi la mitad de los ' +
    'minutos de salida van a +1 sobre una tarifa cuyo margen nadie ha verificado. Ninguna de las tres ' +
    'cosas es una baja hoy; las tres juntas son la conversación de la renovación.',

  problema_raiz:
    'Una sola línea de entrada quedó sin cobertura en los bordes del día y el fin de semana completo, ' +
    'mientras la cola que sí resuelve —Bitrix, al 1.4% de pérdida y operando los siete días— nunca se ' +
    'conectó con ella.',

  problema_raiz_detalle:
    'El diagnóstico es de una limpieza poco común porque la cuenta contiene su propio control. La línea ' +
    '0404 concentra el 86.8% de las pérdidas reales con el 23.8% del tráfico, y su patrón es de horario, ' +
    'no de técnica: dentro de la franja que su equipo cubre pierde 17.9%, y fuera de ella el resultado es ' +
    'mecánico hasta llegar al 100% en sábado y domingo. Al mismo tiempo, la cola de Bitrix recibe 6,858 ' +
    'llamadas con 1.4% sin contestar de 7 a 21 h los siete días, y su equipo trabaja fin de semana —19,893 ' +
    'salientes— justo cuando la 0404 pierde todo. El 69% de las pérdidas de la 0404 cae en días y horas ' +
    'que Bitrix ya cubre. No falta tecnología ni personal: falta una regla.\n\n' +
    'Encima de eso hay dos fenómenos que distorsionaban la lectura y que no son fallas. Primero, una ' +
    'tercera parte de las pérdidas brutas son pruebas de disponibilidad hechas por el TI del propio ' +
    'cliente: 29 números, 1,983 llamadas y 902 pérdidas, identificables por una regla objetiva (marcaron a ' +
    '10 o más líneas distintas) y concentradas en días puntuales. Sin ellas, la tasa de la cuenta cae de ' +
    '15.7% a 11.7% y la extensión 8803 de 16.1% a 2.9%. Segundo, la caída de entrantes no es deterioro: el ' +
    'tráfico de las oficinas volvió a la troncal de Telmex entre el 27 de abril y el 22 de julio, y el ' +
    'cliente lo explicó él mismo el 15 de octubre — está satisfecho con Callpicker como operador de salida ' +
    'y quiere portar los números que siguen en Telmex por fallas de códecs.\n\n' +
    'Eso corrige una lectura nuestra. La bitácora del 2 de octubre llamó a la cuenta crítica por «bajo ' +
    'rendimiento del conmutador en la recepción de llamadas». El conmutador no tiene bajo rendimiento: hay ' +
    'una línea mal cubierta, un bloque de pruebas internas y una migración planeada de la entrada. Tres ' +
    'cosas distintas que sumadas parecían una sola.',

  flujo_real: [
    { fase: '1. Entra por 109 números',        area: 'Troncal SIP',          accion: 'Clasificados: 3 activos críticos, 3 activos hasta corte, 76 de bajo uso, 27 sólo pruebas', resultado: 'Desde el 22 de julio sólo TRES números reciben llamadas de clientes.' },
    { fase: '2. La 0404 recibe la demanda',    area: 'Línea 0404',           accion: 'Cobertura de equipo 9–14 h, lunes a viernes',                                               resultado: '3,497 llamadas de 1,698 números distintos. 1,491 sin contestar (42.6%).' },
    { fase: '3. Fuera de la franja, sola',     area: 'Línea 0404',           accion: 'Sin desborde a ninguna otra cola',                                                           resultado: '8 h: 137 de 146 · 15 h: 211 de 295 · 16 h: 265 de 297 · 19–21 h: 177 de 207 · fin de semana: 325 de 325.' },
    { fase: '4. Nadie devuelve',               area: 'Operación cliente',     accion: 'Sin regla de devolución ni canal alterno',                                                   resultado: '0.3% de las pérdidas recibe saliente contestada en 24 h. 666 de 799 números no hablan con EHI en 72 h; uno insistió 34 veces.' },
    { fase: '5. Bitrix sí resuelve',           area: 'Cola 33 1454 0864',     accion: 'Equipo de 7 a 21 h, los siete días, con devolución desde el mismo número',                    resultado: '6,858 llamadas con 1.4% sin contestar. 92% de quienes llaman ahí habían sido marcados antes desde ese número.' },
    { fase: '6. TI prueba las líneas',          area: 'TI del cliente',        accion: '29 números recorriendo 10 o más líneas en secuencia',                                        resultado: '1,983 llamadas y 902 pérdidas (34.4% de lo «sin contestar»). Ensucia todo tablero que no las separe.' },
    { fase: '7. La entrada vuelve a Telmex',    area: 'Cliente',               accion: 'Cuatro líneas se apagan 27–29 abr; el resto, gradualmente, hasta el 21 jul',                 resultado: 'Entrantes −54% en minutos. No es churn: es una migración que el cliente quiere revertir portando a Callpicker.' },
    { fase: '8. La salida carga el peso',       area: 'Troncal · 99% Bitrix',  accion: '85,037 llamadas a teléfono, 66.2% de conexión',                                              resultado: '46.3% de las salientes y 45.3% de los minutos van a +1. Margen sin verificar sobre una troncal de $15,000 fijos.' },
  ],

  comparativo: [
    { metrica: 'Pérdida de la línea 0404',            real: '42.6% (1,491 de 3,497)',       ideal: '≤ 5%, el nivel que ya logra la cola Bitrix' },
    { metrica: 'Pérdida de la 0404 en franja cubierta', real: '17.9% (349 de 1,946, L–V 9–14 h)', ideal: '≤ 5% con desborde a los 20–25 s' },
    { metrica: 'Pérdida de la 0404 en fin de semana',  real: '100% (325 de 325)',            ideal: '0 — enrutamiento directo a Bitrix, que ya opera sábado y domingo' },
    { metrica: 'Devolución en 24 h',                   real: '0.3% de las pérdidas',         ideal: '≥ 80% con WhatsApp automático o cola de rellamada' },
    { metrica: 'Números sin contacto en 72 h',         real: '666 de 799 (83%)',             ideal: '≤ 10%' },
    { metrica: 'Pérdidas que son pruebas internas',    real: '902 de 2,619 brutas (34.4%)',  ideal: '0 en la métrica, con TI probando desde un número etiquetado' },
    { metrica: 'Líneas de oficina que reciben',        real: '3 de 109',                     ideal: 'Las que el cliente decida portar, con el listado Telmex cruzado' },
    { metrica: 'Cobertura de evaluación',              real: '13 de 13,996 (0.1%)',          ideal: '≥ 20% para poder hablar de calidad y no sólo de disponibilidad' },
    { metrica: 'Minutos totales por mes',              real: '16,242 (ene) → 10,664 (oct)',  ideal: 'Recuperar volumen con la portabilidad de la entrada, no bajar el importe' },
  ],

  plan_inmediato: [
    { accion: 'Desborde de la 0404 a la cola Bitrix cuando nadie contesta en 20–25 s, y enrutamiento directo a Bitrix sábado, domingo, 8 h, 15–16 h y después de 19 h. El 69% de las pérdidas (1,030 de 1,491) ocurre en días y horas que Bitrix ya cubre.', responsable: 'Dan Domínguez (KAM) + Soporte', criterio: 'Presentar el mapa de calor a la Ing. Jati, obtener aprobación de la regla, configurar y medir 30 días.' },
    { accion: 'Enviar al cliente la lista de los 29 números detectados como pruebas internas para que confirme cuáles son suyos, y acordar que TI pruebe desde un número etiquetado.',                                                                        responsable: 'Soporte + Ing. Jati',           criterio: 'Confirmación del cliente por escrito y los números etiquetados fuera de la métrica.' },
    { accion: 'Revisar el margen de los minutos internacionales (+1) contra la tarifa de la troncal: 52,745 minutos del periodo contra el costo de terminación.',                                                                                            responsable: 'Facturación',                   criterio: 'Dictamen antes de cualquier conversación comercial. Evitar una renovación con margen negativo.' },
    { accion: 'Pedir de nuevo el listado Telmex a la Ing. Jati, pendiente desde el 15 de octubre, y cerrar los dos conteos del inventario (109 clasificados contra 105 contratados).',                                                                       responsable: 'Dan Domínguez',                 criterio: 'Listado recibido y cruzado: qué número público corresponde a cada línea Callpicker.' },
  ],

  plan_mediano: [
    { accion: 'WhatsApp automático ante llamada perdida en la 0404 («te devolvemos la llamada / reserva aquí»), cotizado con el volumen real (~140 pérdidas al mes).', responsable: 'Dan Domínguez + Comercial', criterio: 'Piloto propuesto y aceptado. Atender a las 666 personas que hoy no vuelven a hablar con EHI.' },
    { accion: 'Usar la clasificación de 109 números para la portabilidad acordada el 15 de octubre: conservar 3 activos, decidir sobre 3 activos hasta abril y depurar 103 — revisando antes las dos llamadas de noviembre a líneas de oficina.', responsable: 'Daniel Martínez + Dan Domínguez', criterio: 'Inventario ordenado con decisión por número y el compromiso del 15 oct cumplido.' },
    { accion: 'Entregar las métricas técnicas por API (fallas, desconexiones, códecs) para el Grafana del cliente, que la Ing. Jati pidió el 15 de octubre.',           responsable: 'Dan Domínguez + Ingeniería', criterio: 'Documentación entregada y primer tablero del cliente consumiendo datos.' },
    { accion: 'Ampliar interlocutores: pedir a la Ing. Jati que convoque al responsable de la 0404 y llegar a quien firma.',                                            responsable: 'Dan Domínguez',             criterio: '3 o más contactos registrados en la cuenta, incluidos operación de reservaciones y firma.' },
  ],

  plan_estrategico: [
    { accion: 'IA de Voz para la 0404 fuera de horario: toma datos, confirma reservas y deriva emergencias. Cobertura 24/7 sin contratar personal. Fase 2, después del desborde.', responsable: 'Comercial + SAC', criterio: 'Piloto con la pérdida fuera de horario medida antes y después.' },
    { accion: 'Portabilidad de la entrada de las 70+ oficinas que hoy operan por Telmex, con la cancelación de Telmex condicionada a completar la migración.',                      responsable: 'Dan Domínguez + Comercial', criterio: 'Números portados y la entrada recuperada: es la oportunidad real de crecimiento de la cuenta.' },
    { accion: 'Pedir al cliente el valor de una reserva y su tasa de conversión por llamada, para poder traducir las pérdidas a ingreso.',                                          responsable: 'Dan Domínguez',   criterio: 'Los dos datos registrados en la cuenta. Hasta entonces, no se estima ninguna cifra de ingreso perdido.' },
  ],

  areas_oportunidad: [
    { area: 'Desborde de la 0404 a Bitrix',        impacto: '1,030 de 1,491 pérdidas ocurren en horas que Bitrix ya cubre al 1.4%',                  responsable: 'Dan + Soporte' },
    { area: 'Fin de semana',                        impacto: '325 de 325 llamadas perdidas, mientras el equipo de Bitrix opera sábado y domingo',      responsable: 'Soporte' },
    { area: 'Devolución',                           impacto: '0.3% en 24 h y 666 números sin contacto en 72 h, con el WhatsApp ya pedido por el cliente', responsable: 'Dan + Comercial' },
    { area: 'Separar las pruebas internas',         impacto: '34.4% de lo «sin contestar» no son clientes; la ext. 8803 pasa de 16.1% a 2.9%',          responsable: 'Soporte + Ing. Jati' },
    { area: 'Portabilidad de la entrada',           impacto: '70+ oficinas que hoy entran por Telmex: el crecimiento real de la cuenta',               responsable: 'Dan + Comercial' },
    { area: 'Margen internacional',                  impacto: '52,745 minutos a +1 sobre una troncal de $15,000 fijos, sin verificar',                  responsable: 'Facturación' },
    { area: 'Interlocución',                         impacto: 'Una sola persona técnica, sin número directo, con WhatsApp automático',                  responsable: 'Dan' },
  ],

  perfiles: [
    {
      nombre: 'Ing. Jati Rodríguez',
      rol: 'Redes · el único interlocutor de la cuenta',
      color: '#6366f1',
      campos: [
        { label: 'Contacto',      value: 'jati.rodriguez@ehiglobal.mx. La bitácora del 2 oct documenta que no hay número directo: los disponibles son líneas generales y el WhatsApp registrado responde de forma automática.' },
        { label: 'Lo que quiere', value: 'Métricas técnicas por API (fallas, desconexiones, códecs) para su propio Grafana, y automatizaciones como WhatsApp ante llamada perdida. Lo pidió el 15 de octubre.' },
        { label: 'Lo que debe',   value: 'El listado de números Telmex, pendiente desde el 15 de octubre. Sin él no se puede cerrar el inventario ni la portabilidad.' },
        { label: 'Riesgo',        value: 'Toda una cuenta AAA de $15,099 pasa por una persona con la que el canal ya falló dos veces este año.' },
      ],
    },
    {
      nombre: 'La cola Bitrix · 33 1454 0864',
      rol: 'La solución que ya está dentro de la cuenta',
      color: '#22c55e',
      campos: [
        { label: 'Volumen',   value: '6,858 llamadas de clientes' },
        { label: 'Pérdida',   value: '1.4% sin contestar' },
        { label: 'Horario',   value: 'Todos los días de la semana, de 7 a 21 h. Su equipo opera sábado y domingo: 19,893 salientes en fin de semana.' },
        { label: 'Cómo opera', value: '92% de quienes llaman ahí habían sido marcados antes desde ese mismo número: son devoluciones de salientes. Es una cola con disciplina de seguimiento.' },
      ],
    },
    {
      nombre: 'La línea 0404',
      rol: 'La puerta que falla',
      color: '#ef4444',
      campos: [
        { label: 'Volumen',          value: '3,497 llamadas de 1,698 números distintos · 23.8% del tráfico real' },
        { label: 'Pérdida',          value: '1,491 sin contestar (42.6%) · el 86.8% de todas las pérdidas reales de la cuenta' },
        { label: 'Sin mejora',       value: 'Entre 29% (marzo) y 53% (febrero): la tasa no mejora en ningún mes del año.' },
        { label: 'Dónde se pierde',  value: '8 h, 15–16 h, 19–21 h y el fin de semana completo. En la franja cubierta (L–V 9–14 h) pierde 17.9%.' },
      ],
    },
    {
      nombre: 'Los 29 números de pruebas',
      rol: 'El ruido que ensuciaba la métrica',
      color: '#f59e0b',
      campos: [
        { label: 'Regla objetiva', value: '28 números que marcaron a 10 o más líneas distintas de EHI, más el número de contacto de la Ing. Jati. Revisable, y el cliente debe confirmarla.' },
        { label: 'Volumen',        value: '1,983 llamadas y 902 pérdidas: 34.4% de todo lo «sin contestar»' },
        { label: 'Firma del patrón', value: 'Tres números de La Paz (612 247 0716, 0789 y 0812) recorren 25 líneas en secuencia, minutos entre una y otra, 96% sin contestar y sin minutos de conversación.' },
        { label: 'Efecto de separarlos', value: 'La tasa bruta cae de 15.7% a 11.7% y la extensión 8803 de 16.1% a 2.9%.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'La cuenta contiene su propia prueba de que el modelo funciona: la cola Bitrix atiende 6,858 llamadas con 1.4% sin contestar, siete días a la semana.',
      'Salida sana y estable: 85,037 llamadas a teléfono con 66.2% de conexión, entre 63.9% y 68.3% todos los meses.',
      'Capacidad de sobra: pico de sólo 15 canales simultáneos.',
      'MRR estable y verificado por dos caminos independientes: $15,099 en el GRC y la misma suma en los servicios contratados.',
      'Satisfacción declarada por el cliente con Callpicker como operador principal de salida (15 oct 2026).',
      'Un interlocutor técnico que quiere integrarse más: pidió métricas por API para su propio Grafana.',
      'Proyecto de consolidación abierto: el cliente quiere portar los números que siguen en Telmex.',
    ],
    oportunidades: [
      'Desborde de la 0404 a Bitrix: resuelve el 69% de sus pérdidas con una regla de configuración.',
      'WhatsApp automático ante llamada perdida, que el propio cliente ya pidió.',
      'IA de Voz para la 0404 fuera de horario: cobertura 24/7 sin contratar personal.',
      'Portabilidad de la entrada de 70+ oficinas que hoy operan por Telmex.',
      'Integración por API de métricas técnicas para el Grafana del cliente.',
      'Separar las pruebas internas y entregarle al cliente su propio tablero limpio.',
    ],
    debilidades: [
      'La línea 0404 pierde 42.6% y concentra el 86.8% de las pérdidas reales con el 23.8% del tráfico.',
      'Fin de semana completo sin cobertura en esa línea: 325 de 325 llamadas perdidas.',
      'Devolución casi nula: 0.3% en 24 h; 666 de 799 números sin contacto en 72 h.',
      'Sin dato de calidad: sólo 13 de 13,996 contestadas tienen evaluación (0.1%).',
      'Consumo a la baja (−34% en minutos) con importe fijo de $15,099.',
      'Un solo interlocutor técnico, sin número directo y con WhatsApp automático.',
      'El inventario no cierra: 109 números clasificados contra 105 «contratados», y el listado Telmex pendiente desde el 15 de octubre.',
    ],
    amenazas: [
      'Pagar lo mismo por 34% menos uso es el argumento exacto de un comprador en la renovación.',
      '52,745 minutos a +1 sobre una troncal de $15,000 fijos: si la tarifa no contempla terminación internacional, el margen puede ser negativo y nadie lo ha medido.',
      'Dependencia de una sola persona técnica con la que el canal de contacto ya falló dos veces este año.',
      'Sin interlocutor en reservaciones ni en firma: nadie del lado del negocio conoce el valor de Callpicker.',
      'Si la portabilidad no avanza, la entrada de 70+ oficinas se queda en Telmex de forma definitiva.',
      'Mientras las pruebas internas no se separen, cualquier tablero —el nuestro y el del cliente— mostrará la cuenta peor de lo que está.',
    ],
  },

  conclusion:
    'EHI Global no es una cuenta que se esté deteriorando: es una cuenta con una puerta de entrada mal ' +
    'cubierta y dos fenómenos que distorsionaban su lectura. La línea 0404 concentra el 86.8% de las ' +
    'pérdidas reales con el 23.8% del tráfico, y su patrón es puramente de horario: dentro de la franja ' +
    'que su equipo cubre pierde 17.9%, y fuera de ella llega al 100% en sábado y domingo. Al mismo tiempo, ' +
    'la cola de Bitrix recibe 6,858 llamadas con 1.4% sin contestar, los siete días, con un equipo que ' +
    'trabaja fin de semana. El 69% de las pérdidas de la 0404 cae en horas que Bitrix ya cubre. No falta ' +
    'tecnología ni personal: falta una regla.\n\n' +
    'Los dos fenómenos que había que separar antes de juzgar la cuenta: una tercera parte de las pérdidas ' +
    'brutas son pruebas de disponibilidad hechas por el TI del propio cliente, y la caída de entrantes es ' +
    'una migración que el cliente decidió y quiere revertir portando a Callpicker. Eso corrige nuestra ' +
    'propia lectura del 2 de octubre: el conmutador no tiene bajo rendimiento.\n\n' +
    'Quedan dos cosas que no se pueden resolver con el dato que hay. Una es nuestra: 52,745 minutos a +1 ' +
    'sobre una troncal de $15,000 fijos, con un margen que nadie ha verificado y que debe dictaminarse ' +
    'antes de cualquier propuesta. La otra es del cliente: sin el valor de una reserva ni su tasa de ' +
    'conversión, las 666 personas que no volvieron a hablar con EHI no se pueden traducir a ingreso ' +
    'perdido. Se piden. No se estiman.',

  pierde: [
    '$15,099 de MRR institucional en una cuenta AAA con 31 meses y $481,287 acumulados.',
    'La única integración con Bitrix de la cartera, y un caso de cola de devolución al 1.4% que sirve de referencia para todos.',
    'El proyecto de portabilidad de la entrada de 70+ oficinas, que es la mayor oportunidad de crecimiento abierta en esta cuenta.',
    'Un cliente técnico que quiere consumir nuestras métricas por API: el tipo de amarre que no se compra con precio.',
  ],

  gana: [
    'Una regla de desborde replicable en cualquier cuenta que tenga una cola sana y una línea descubierta.',
    'Un caso de WhatsApp ante llamada perdida pedido por el propio cliente, dimensionado con ~140 pérdidas al mes reales.',
    'La entrada de 70+ oficinas portada desde Telmex, con la cancelación de Telmex condicionada a la migración.',
    'Interlocutores en reservaciones y en firma, donde hoy sólo hay una persona de Redes.',
  ],

  recomendacion_central:
    'Llevarle a la Ing. Jati el mapa de calor de la 0404 y pedir una sola cosa concreta: aprobar el ' +
    'desborde a la cola de Bitrix a los 20–25 segundos, y enrutamiento directo a Bitrix sábado, domingo, ' +
    '8 h, 15–16 h y después de las 19 h. Es el 69% de las pérdidas de esa línea y el equipo de Bitrix ya ' +
    'opera esos días y esas horas al 1.4%. En la misma sesión devolverle sus 29 números de pruebas para ' +
    'que los confirme y ofrecerle las métricas por API que pidió el 15 de octubre, que es lo que convierte ' +
    'una auditoría en una relación técnica. Antes de hablar de dinero, dos cosas de casa: Facturación ' +
    'dictamina el margen de los 52,745 minutos a +1, y se pide otra vez el listado de Telmex para cerrar ' +
    'el inventario y arrancar la portabilidad de la entrada — que es donde está el crecimiento real de ' +
    'esta cuenta, no en el importe.',

  documentos: [
    {
      nombre: 'Auditoría de llamadas · EHI Global · 2026',
      ruta: '/auditorias/Auditoria-EHI-Global-2026.html',
      descripcion:
        'Reporte interactivo del CID 147935 sobre 16,646 entrantes y 86,051 salientes, 1 ene – 26 nov 2026 ' +
        'con análisis cerrado a octubre: los seis hallazgos (la línea 0404, las pruebas internas, la salida ' +
        'del tráfico de oficinas, la cola Bitrix, las salientes internacionales y el consumo a la baja), ' +
        'mapa de calor por día y hora de la 0404, clasificación de los 109 números para la portabilidad, ' +
        'FODA y siete propuestas con dueño. Publicado con una corrección visible dentro del documento ' +
        '—el 25.6% de la franja cubierta estaba calculado sobre los siete días; de lunes a viernes es ' +
        '17.9%— y con los dos huecos declarados: el inventario que no cierra (109 contra 105) y la ' +
        'ausencia del valor de una reserva, que impide traducir las pérdidas a ingreso.',
    },
  ],
}
