/**
 * Diccionario técnico-comercial de comunicaciones.
 *
 * Para qué existe: el asesor no necesita programar una API, pero sí necesita
 * entender qué permite hacer — porque la diferencia entre vender "telefonía" y
 * descubrir un proceso de negocio automatizable está en el vocabulario.
 *
 * Cada término trae la definición técnica y, cuando cambia la conversación
 * comercial, su traducción a lo que el cliente entiende. Los campos `ojo`
 * marcan las confusiones que cuestan dinero al dimensionar una solución.
 *
 * Atlas usa esta fuente para responder consultas de terminología, y tiene
 * instrucción de no soltar la definición y ya: pregunta para qué se necesita
 * el término y encamina hacia el perfilamiento (ver lib/perfilamiento.ts).
 */

export interface CategoriaGlosario {
  id:    string
  label: string
  color: string
  /** Qué agrupa, en una línea. */
  nota:  string
}

export interface TerminoGlosario {
  /** Nombre principal del término. */
  t:     string
  /** Expansión de la sigla, cuando aplica. */
  sig?:  string
  /** Variantes y sinónimos — se usan para buscar, no se muestran como título. */
  alias?: string[]
  cat:   string
  /** Definición técnica. */
  def:   string
  /** Para qué sirve. Se usa sobre todo en plataformas y productos de terceros. */
  sirve?: string
  /** Traducción comercial: qué significa para el cliente. */
  com?:  string
  ej?:   string
  /** Precisión que evita un error comercial o técnico frecuente. */
  ojo?:  string
}

export const CATEGORIAS_GLOSARIO: CategoriaGlosario[] = [
  { id: 'plataformas', label: 'Plataformas y productos',      color: '#F43F5E', nota: 'Lo que el cliente ya tiene instalado. Reconocer el nombre es el primer paso del descubrimiento.' },
  { id: 'nube',        label: 'Telefonía en la nube',        color: '#0057FF', nota: 'La plataforma, las extensiones y los protocolos que las sostienen.' },
  { id: 'tradicional', label: 'Telefonía tradicional y migración', color: '#B45309', nota: 'E1, troncales, analógico y el puente hacia IP. Aparece en casi toda migración.' },
  { id: 'numeracion',  label: 'Numeración e identificación', color: '#0EA5E9', nota: 'Números, identificadores de llamada y registros. Aquí viven los errores de dimensionamiento.' },
  { id: 'red',         label: 'Calidad de llamada y red',    color: '#22C55E', nota: 'Por qué una llamada se escucha bien o mal, y cómo se mide.' },
  { id: 'uc',          label: 'Comunicaciones unificadas',   color: '#8B5CF6', nota: 'Voz, video, chat y presencia en un mismo entorno.' },
  { id: 'cc',          label: 'Contact Center',              color: '#F59E0B', nota: 'Distribución, colas, enrutamiento e indicadores de operación.' },
  { id: 'ia',          label: 'IA conversacional y modelos', color: '#A855F7', nota: 'Chatbot, asistente y agente no son lo mismo. Aquí está la diferencia.' },
  { id: 'iavoz',       label: 'IA aplicada a voz',           color: '#EC4899', nota: 'Cómo la voz se vuelve texto, se razona y regresa como voz.' },
  { id: 'api',         label: 'APIs e integración',          color: '#0D9488', nota: 'El vocabulario que abre la conversación de automatización.' },
  { id: 'crm',         label: 'CRM y CTI',                   color: '#2563EB', nota: 'Dónde se conecta la conversación con el proceso comercial.' },
  { id: 'texto',       label: 'Canales de texto y WhatsApp', color: '#16A34A', nota: 'Mensajería empresarial, plantillas, consentimiento y omnicanalidad real.' },
  { id: 'analitica',   label: 'Analítica de conversaciones', color: '#D946EF', nota: 'Transcripción, resumen, intención y calidad — lo que convierte llamadas en datos.' },
  { id: 'seguridad',   label: 'Seguridad y disponibilidad',  color: '#DC2626', nota: 'Autenticación, cifrado, continuidad y datos personales.' },
]

export const GLOSARIO: TerminoGlosario[] = [

  /* ── Plataformas y productos que un comercial debe reconocer ─────────────
   * Estos no son conceptos: son cosas que el cliente ya compró. Reconocer el
   * nombre en la primera llamada es lo que separa "le platico de telefonía" de
   * "¿cómo quiere que las llamadas lleguen a su Pipedrive?".
   */
  { t: 'Pipedrive', cat: 'plataformas',
    def: 'Plataforma CRM de ventas orientada a la administración del pipeline comercial. Es una solución SaaS accesible desde web y aplicaciones móviles.',
    sirve: 'Gestionar leads, contactos, oportunidades, actividades, seguimientos, automatizaciones y procesos de venta.',
    com: 'Si un cliente dice "usamos Pipedrive", hay que investigar cómo quiere integrar llamadas, WhatsApp, SMS, grabaciones, actividades o IA con ese CRM. Pipedrive dispone de integraciones y API.' },

  { t: 'Salesforce', cat: 'plataformas',
    def: 'Plataforma CRM empresarial.',
    sirve: 'Gestiona ventas, clientes, servicio, marketing, procesos y ecosistemas de aplicaciones.',
    com: 'Es frecuente encontrar proyectos donde telefonía, WhatsApp o un Contact Center necesitan registrar automáticamente interacciones en Salesforce.' },

  { t: 'HubSpot', cat: 'plataformas',
    def: 'Plataforma CRM con capacidades comerciales, de marketing y de servicio.',
    sirve: 'Centraliza contactos, ventas, actividades y relaciones con clientes.',
    com: 'Un CRM no es simplemente una agenda: centraliza información e interacciones del cliente y puede automatizar procesos.' },

  { t: 'Microsoft Dynamics 365', alias: ['Dynamics'], cat: 'plataformas',
    def: 'Familia de aplicaciones empresariales de Microsoft que incluye CRM y ERP.',
    sirve: 'Ventas, servicio, operaciones, finanzas y procesos empresariales.',
    com: 'Puede requerir integración con telefonía, Contact Center, Teams, WhatsApp o aplicaciones externas.' },

  { t: 'Zoho CRM', cat: 'plataformas',
    def: 'Plataforma CRM orientada a la administración de ventas y relaciones con clientes.',
    sirve: 'Leads, contactos, oportunidades, automatización y seguimiento.',
    com: 'Otro CRM que puede convertirse en sistema maestro para integraciones de comunicaciones.' },

  { t: 'Zenvia Conversion', cat: 'plataformas',
    def: 'Plataforma que centraliza conversaciones de distintos canales para atención y ventas. Su documentación menciona WhatsApp, Facebook Messenger, Instagram y Webchat.',
    sirve: 'Centralizar conversaciones, asignarlas y gestionar equipos comerciales o de atención.',
    com: 'Es un ejemplo de plataforma conversacional.',
    ojo: 'No debe confundirse automáticamente con una PBX ni con un CRM tradicional.' },

  { t: 'Sirena', cat: 'plataformas',
    def: 'Nombre que requiere contextualización. Zenvia identifica a Zenvia Conversion como "previamente Sirena"; además, Sirena México fue incorporada por Zenvia México en 2024.',
    sirve: 'Históricamente asociado con gestión de conversaciones y procesos comerciales, especialmente WhatsApp y otros canales.',
    com: 'Si un prospecto dice "tenemos Sirena", hay que preguntar qué producto o versión utiliza actualmente.',
    ojo: 'No asumir. Existe además un sitio sirena.chat que comercializa un CRM para WhatsApp, Facebook e Instagram, así que el nombre puede resultar ambiguo.' },

  /* ── Telefonía en la nube ────────────────────────────────────────────── */
  { t: 'Cloud Telephony', alias: ['telefonía en la nube'], cat: 'nube',
    def: 'Telefonía cuya plataforma de control, extensiones y servicios reside en infraestructura cloud en lugar de una central física en las instalaciones.',
    com: 'Permite operar extensiones y números desde cualquier ubicación sin mantener una PBX tradicional.' },

  { t: 'PBX', sig: 'Private Branch Exchange', alias: ['central telefónica', 'conmutador'], cat: 'nube',
    def: 'Central telefónica que administra extensiones, llamadas entrantes, salientes y reglas de marcación.',
    com: 'Es el "cerebro" de la telefonía empresarial.' },

  { t: 'Cloud PBX', alias: ['Hosted PBX', 'PBX en la nube'], cat: 'nube',
    def: 'PBX alojada en la nube y administrada como servicio.',
    com: 'Reduce infraestructura local y facilita crecer o disminuir usuarios.' },

  { t: 'IP-PBX', cat: 'nube',
    def: 'Central telefónica que utiliza redes IP para transportar llamadas.',
    com: 'Lleva la telefonía tradicional al entorno de datos e Internet.' },

  { t: 'VoIP', sig: 'Voice over Internet Protocol', cat: 'nube',
    def: 'Tecnología para transportar voz mediante redes IP.',
    com: 'Permite realizar llamadas utilizando infraestructura de Internet o redes privadas.' },

  { t: 'Extensión', cat: 'nube',
    def: 'Identificador interno asignado a un usuario, área o dispositivo dentro de una PBX.',
    com: 'Permite localizar colaboradores sin usar directamente números externos.',
    ej: 'Extensión 201 = José.',
    ojo: 'No necesariamente tiene un DID propio. Extensión ≠ número ≠ canal.' },

  { t: 'Número virtual', cat: 'nube',
    def: 'Número telefónico que no está asociado obligatoriamente a una línea física.',
    com: 'Puede recibirse en aplicaciones, sucursales, home office o contact centers.' },

  { t: 'SIP', sig: 'Session Initiation Protocol', cat: 'nube',
    def: 'Protocolo utilizado para establecer, modificar y finalizar sesiones de comunicación IP.',
    com: 'Es uno de los estándares fundamentales de la telefonía IP.' },

  { t: 'SIP Trunk', alias: ['troncal SIP'], cat: 'nube',
    def: 'Enlace lógico que conecta una PBX con la red telefónica mediante SIP.',
    com: 'Sustituye múltiples líneas telefónicas físicas por conectividad IP. Es el sucesor natural de muchas troncales E1/PRI.' },

  { t: 'SIP Registration', alias: ['registro SIP'], cat: 'nube',
    def: 'Proceso mediante el cual un dispositivo o plataforma se autentica ante un servidor SIP.',
    com: 'Permite que una extensión o sistema quede disponible para realizar y recibir llamadas.' },

  { t: 'SBC', sig: 'Session Border Controller', cat: 'nube',
    def: 'Dispositivo o software que protege y controla comunicaciones SIP entre diferentes redes. Puede hacer seguridad, control de sesiones, interoperabilidad, NAT traversal, normalización SIP, cifrado y políticas.',
    com: 'Es un punto de control especializado entre ambientes de comunicaciones SIP.',
    ojo: 'No conviene llamarlo "firewall de voz": técnicamente es una simplificación excesiva.' },

  { t: 'PSTN', sig: 'Public Switched Telephone Network', alias: ['red telefónica pública'], cat: 'nube',
    def: 'Red telefónica pública tradicional que interconecta teléfonos fijos, móviles y plataformas empresariales.',
    com: 'Es la infraestructura que permite comunicarse con teléfonos convencionales y móviles.',
    ej: 'Cloud PBX → carrier → PSTN → teléfono celular.' },

  { t: 'Softphone', cat: 'nube',
    def: 'Aplicación que convierte una computadora o smartphone en una extensión telefónica.',
    com: 'El usuario puede atender su extensión desde cualquier lugar.' },

  { t: 'WebRTC', cat: 'nube',
    def: 'Tecnología que permite voz, video y comunicaciones en tiempo real directamente desde un navegador o aplicación web.',
    com: 'Permite llamar desde una página web sin instalar un teléfono tradicional.' },

  /* ── Telefonía tradicional y migración ───────────────────────────────── */
  { t: 'Troncal telefónica', cat: 'tradicional',
    def: 'Enlace que conecta una PBX con la red de un operador o con otra central. Puede ser analógica, digital o IP.',
    com: 'Es la "carretera" por donde entran y salen varias llamadas de la empresa.' },

  { t: 'E1', cat: 'tradicional',
    def: 'Enlace digital de 2.048 Mbps, ampliamente utilizado fuera de Norteamérica. Compuesto por 32 timeslots; normalmente hasta 30 canales pueden usarse para voz, según la señalización.',
    com: 'Forma tradicional de entregar múltiples llamadas simultáneas a una PBX.',
    ojo: 'Si el cliente menciona un E1, hay infraestructura tradicional y probablemente una oportunidad de migración.' },

  { t: 'Canal', cat: 'tradicional',
    def: 'Unidad lógica de capacidad utilizada para transportar una comunicación.',
    com: 'Con 30 canales de voz se soportan aproximadamente 30 llamadas simultáneas, sujeto a la arquitectura.' },

  { t: 'E1 PRI', cat: 'tradicional',
    def: 'E1 con señalización ISDN PRI. Habitualmente 30 canales B para voz/datos, un canal D para señalización y un timeslot de sincronización.',
    com: 'Una de las formas clásicas de conectar una PBX empresarial al operador.' },

  { t: 'PRI', sig: 'Primary Rate Interface', cat: 'tradicional',
    def: 'Interfaz de ISDN utilizada para transportar múltiples llamadas digitales y su señalización.',
    com: 'Tecnología anterior a SIP Trunk, todavía presente en instalaciones empresariales.' },

  { t: 'ISDN', sig: 'Integrated Services Digital Network', alias: ['RDSI'], cat: 'tradicional',
    def: 'Tecnología digital para transportar voz y datos sobre infraestructura telefónica.',
    com: 'Generación anterior a la telefonía IP.' },

  { t: 'E1 R2', alias: ['MFC-R2'], cat: 'tradicional',
    def: 'Variante de E1 que utiliza señalización R2, usada históricamente por operadores y PBX en varios países de Latinoamérica.',
    com: 'Un "E1 R2" indica infraestructura telefónica tradicional, candidata a migración.' },

  { t: 'T1', cat: 'tradicional',
    def: 'Estándar digital usado principalmente en Norteamérica y Japón, con capacidad aproximada de 1.544 Mbps y 24 canales digitales.',
    com: 'Conceptualmente similar a un E1, pero con diferente capacidad y estándar.' },

  { t: 'Troncal analógica', cat: 'tradicional',
    def: 'Conjunto de líneas analógicas conectadas a una PBX.',
    com: 'Tecnología tradicional donde cada línea física suele representar una llamada simultánea.' },

  { t: 'Troncal digital', cat: 'tradicional',
    def: 'Troncal que utiliza tecnologías digitales como E1, T1 o PRI.',
    com: 'Permite concentrar varias llamadas sobre un mismo enlace físico.' },

  { t: 'Canales SIP', cat: 'tradicional',
    def: 'Número de llamadas simultáneas permitidas sobre una troncal SIP.',
    com: 'Una troncal SIP puede tener 10, 30, 50, 100 o más llamadas simultáneas.',
    ojo: 'La cantidad de canales no implica la misma cantidad de números.' },

  { t: 'Concurrencia', cat: 'tradicional',
    def: 'Número de comunicaciones que pueden mantenerse simultáneamente.',
    com: 'Es lo que realmente dimensiona la solución.',
    ojo: 'Hay que distinguir cantidad de números de cantidad de llamadas simultáneas.' },

  { t: 'FXS', sig: 'Foreign Exchange Subscriber', cat: 'tradicional',
    def: 'Puerto que proporciona tono, alimentación y señalización hacia un dispositivo analógico.',
    com: 'Es donde se conecta un teléfono analógico, fax o dispositivo similar.',
    ej: 'FXS entrega servicio a un teléfono analógico.' },

  { t: 'FXO', sig: 'Foreign Exchange Office', cat: 'tradicional',
    def: 'Puerto que recibe la línea proveniente de una central o proveedor analógico.',
    com: 'Es donde se conecta la línea analógica del operador hacia un gateway o PBX.',
    ej: 'FXO recibe una línea telefónica analógica.' },

  { t: 'Gateway de voz', alias: ['Voice Gateway', 'Gateway VoIP'], cat: 'tradicional',
    def: 'Equipo que convierte entre tecnologías de telefonía diferentes: E1/PRI → SIP, FXO → SIP, SIP → FXS.',
    com: 'Clave en migraciones donde el cliente quiere telefonía cloud sin eliminar de golpe su infraestructura tradicional.' },

  { t: 'ATA', sig: 'Analog Telephone Adapter', cat: 'tradicional',
    def: 'Dispositivo utilizado para conectar un teléfono o equipo analógico a una plataforma VoIP.',
    ej: 'Fax o teléfono analógico → ATA → red IP → plataforma de telefonía.' },

  { t: 'Gateway E1/SIP', cat: 'tradicional',
    def: 'Equipo o software que interconecta una infraestructura E1 con una plataforma SIP.',
    com: 'Sirve como etapa transitoria durante una migración.',
    ej: 'Carrier E1 → Gateway → SIP → Cloud PBX.' },

  { t: 'On-Premise', cat: 'tradicional',
    def: 'Infraestructura instalada físicamente dentro de las instalaciones o data center del cliente.',
    ej: 'PBX física en el corporativo.' },

  { t: 'Hosted', cat: 'tradicional',
    def: 'Infraestructura alojada por un tercero pero dedicada o administrada para el cliente, según el modelo.' },

  { t: 'Híbrido', cat: 'tradicional',
    def: 'Combinación de tecnologías locales y cloud.',
    com: 'Frecuente durante procesos de migración.',
    ej: 'PBX actual + SIP + aplicación cloud + CRM.' },

  { t: 'Carrier', alias: ['operador'], cat: 'tradicional',
    def: 'Empresa autorizada que proporciona servicios de telecomunicaciones y acceso a redes telefónicas.',
    ojo: 'Plataforma de telefonía ≠ carrier. Una empresa puede dar el software mientras otra provee numeración, terminación, originación y acceso PSTN.' },

  { t: 'Voice Origination', alias: ['originación'], cat: 'tradicional',
    def: 'Servicio mediante el cual las llamadas de la red pública llegan hacia la plataforma del cliente.',
    ej: 'PSTN → empresa.' },

  { t: 'Voice Termination', alias: ['terminación'], cat: 'tradicional',
    def: 'Servicio mediante el cual una llamada originada desde la plataforma se entrega hacia la red telefónica pública.',
    ej: 'Empresa → PSTN.' },

  { t: 'Hunt Group', alias: ['grupo de timbrado'], cat: 'tradicional',
    def: 'Grupo de extensiones configuradas para recibir llamadas siguiendo determinada estrategia.',
    ej: 'Llamada → 201 → si no contesta → 202 → 203.' },

  { t: 'Ring Group', cat: 'tradicional',
    def: 'Grupo donde una llamada puede hacer sonar simultánea o secuencialmente varias extensiones.' },

  { t: 'Blind Transfer', alias: ['transferencia ciega'], cat: 'tradicional',
    def: 'El agente transfiere una llamada sin hablar previamente con quien la recibirá.' },

  { t: 'Attended Transfer', alias: ['transferencia atendida'], cat: 'tradicional',
    def: 'El agente primero habla con el receptor y posteriormente entrega la llamada.' },

  { t: 'DTMF', sig: 'Dual-Tone Multi-Frequency', cat: 'tradicional',
    def: 'Tonos generados cuando se presionan las teclas del teléfono.',
    ej: '"Marque 1 para ventas" — ese 1 viaja como DTMF.',
    ojo: 'En VoIP hay distintos métodos para transportarlo; puede volverse una consideración técnica en integraciones.' },

  /* ── Numeración e identificación ─────────────────────────────────────── */
  { t: 'DID', sig: 'Direct Inward Dialing', cat: 'numeracion',
    def: 'Número telefónico público que puede direccionarse directamente hacia una extensión, cola o aplicación.',
    com: 'Permite darle a cada área o usuario un número directo, sin que una recepcionista transfiera manualmente.',
    ej: '33 1234 5678 → DID → extensión 205.' },

  { t: 'DDI', sig: 'Direct Dial-In', cat: 'numeracion',
    def: 'Otro término para marcación directa entrante. Según país y proveedor puede usarse como equivalente práctico de DID.' },

  { t: 'DOD', sig: 'Direct Outward Dialing', cat: 'numeracion',
    def: 'Capacidad de una extensión para realizar llamadas hacia la red pública directamente.' },

  { t: 'ANI', sig: 'Automatic Number Identification', cat: 'numeracion',
    def: 'Identifica el número desde el que se origina una llamada.',
    com: 'ANI = quién llama. Es la llave para buscar al cliente en el CRM y disparar el screen pop.' },

  { t: 'DNIS', sig: 'Dialed Number Identification Service', cat: 'numeracion',
    def: 'Identifica el número al que llamó el cliente.',
    com: 'DNIS = a qué número llamó. Clave cuando la empresa maneja varias campañas o números.',
    ej: 'Con 800 Ventas, 800 Soporte y 800 Renovaciones llegando al mismo contact center, el DNIS permite aplicar un flujo distinto a cada uno.' },

  { t: 'Caller ID', alias: ['CLI'], cat: 'numeracion',
    def: 'Información del número que se presenta como origen de una llamada.',
    com: 'Pregunta comercial directa: ¿qué número quiere que vea el cliente cuando lo llamen sus agentes?' },

  { t: 'Número telefónico', cat: 'numeracion',
    def: 'Identificador público utilizado para recibir o realizar llamadas mediante la PSTN.',
    ojo: 'Tener 100 números no significa poder realizar 100 llamadas simultáneas.' },

  { t: 'Línea telefónica', cat: 'numeracion',
    def: 'Servicio que proporciona acceso a la red telefónica. En ambientes tradicionales puede estar asociado a un par físico y un número.',
    ojo: 'No debe confundirse automáticamente con extensión, canal o DID.' },

  { t: 'Portabilidad numérica', alias: ['portabilidad'], cat: 'numeracion',
    def: 'Proceso para conservar un número telefónico al cambiar de operador o plataforma, según la regulación aplicable.',
    com: 'El cliente migra sin perder sus números conocidos.',
    ojo: 'Pregunta crítica: ¿los números actuales deben conservarse? La respuesta cambia el alcance y el calendario de la migración.' },

  { t: 'Numeración 800', cat: 'numeracion',
    def: 'Número donde quien recibe la llamada absorbe determinados costos de comunicación, conforme al servicio contratado con el carrier.',
    com: 'Puede tener reglas de distribución, horarios, regiones, contingencia y enrutamiento.' },

  { t: 'Call ID', cat: 'numeracion',
    def: 'Identificador único asignado a una llamada.',
    com: 'Útil para soporte, auditoría, troubleshooting, búsqueda de grabaciones y APIs.' },

  { t: 'Conversation ID', cat: 'numeracion',
    def: 'Identificador único asignado a una conversación.',
    com: 'Permite rastrear técnicamente una interacción entre múltiples sistemas.' },

  { t: 'CDR', sig: 'Call Detail Record', cat: 'numeracion',
    def: 'Registro técnico de una llamada: origen, destino, fecha, hora, duración, estado, agente e identificador.',
    ojo: 'El CDR es la información de la llamada; la grabación es el contenido. No son lo mismo y el CDR no contiene el audio.' },

  /* ── Calidad de llamada y red ────────────────────────────────────────── */
  { t: 'Latencia', cat: 'red',
    def: 'Tiempo que tarda un paquete en viajar entre origen y destino.',
    com: 'Una latencia elevada genera conversaciones incómodas y retrasos.' },

  { t: 'Jitter', cat: 'red',
    def: 'Variación en el tiempo de llegada de los paquetes de voz.',
    com: 'Produce voz entrecortada o irregular.' },

  { t: 'Packet Loss', alias: ['pérdida de paquetes'], cat: 'red',
    def: 'Pérdida de paquetes durante la transmisión.',
    com: 'Genera palabras incompletas, cortes y mala calidad.' },

  { t: 'MOS', sig: 'Mean Opinion Score', cat: 'red',
    def: 'Indicador utilizado para estimar la calidad percibida de una llamada.',
    com: 'Permite medir objetivamente la experiencia de voz en lugar de discutirla.' },

  { t: 'QoS', sig: 'Quality of Service', cat: 'red',
    def: 'Priorización del tráfico sensible, como voz y video, dentro de una red.',
    com: 'Protege las llamadas cuando hay congestión de Internet.' },

  { t: 'Codec', cat: 'red',
    def: 'Algoritmo que comprime y descomprime audio. Ejemplos: G.711, G.729, Opus.',
    com: 'Determina consumo de ancho de banda y calidad de audio.' },

  { t: 'G.711', cat: 'red',
    def: 'Codec tradicional de alta calidad que utiliza aproximadamente 64 kbps de audio, sin considerar overhead de red.',
    com: 'Muy utilizado en telefonía empresarial.' },

  { t: 'G.729', cat: 'red',
    def: 'Codec diseñado para consumir menos ancho de banda que G.711, con características distintas de calidad, procesamiento y licenciamiento histórico.' },

  { t: 'Opus', cat: 'red',
    def: 'Codec moderno y flexible utilizado ampliamente en comunicaciones IP, WebRTC y aplicaciones multimedia.' },

  { t: 'RTP', sig: 'Real-time Transport Protocol', cat: 'red',
    def: 'Transporta el audio o video de una comunicación.',
    ojo: 'SIP controla la llamada; RTP normalmente transporta la voz. Son capas distintas.' },

  { t: 'SRTP', sig: 'Secure RTP', cat: 'red',
    def: 'Versión cifrada de RTP.',
    com: 'Protege el contenido de las conversaciones.' },

  { t: 'Failover', cat: 'red',
    def: 'Cambio automático hacia una conexión, servidor o ruta alternativa cuando existe una falla.',
    com: 'Evita que una caída deje incomunicada a la organización.' },

  { t: 'Redundancia', cat: 'red',
    def: 'Existencia de componentes alternos para evitar un punto único de falla.',
    com: 'Reduce riesgo operativo.' },

  { t: 'High Availability', alias: ['HA', 'alta disponibilidad'], cat: 'red',
    def: 'Arquitectura diseñada para mantener un servicio disponible aun cuando falla algún componente.',
    com: 'Fundamental donde la telefonía es crítica para operar.' },

  /* ── Comunicaciones unificadas ───────────────────────────────────────── */
  { t: 'UC', sig: 'Unified Communications', alias: ['comunicaciones unificadas'], cat: 'uc',
    def: 'Integración de diferentes herramientas de comunicación dentro de un mismo entorno: voz, videollamadas, chat, mensajería, presencia, reuniones, transferencia de archivos, directorio y colaboración.' },

  { t: 'UCaaS', sig: 'Unified Communications as a Service', cat: 'uc',
    def: 'Comunicaciones unificadas ofrecidas desde la nube bajo un esquema de servicio.' },

  { t: 'Omnicanalidad', cat: 'uc',
    def: 'Integración coordinada de diferentes canales manteniendo el contexto durante la interacción con el cliente.',
    ojo: 'No es poner varios canales en una pantalla. Si el contexto no viaja entre canales, es multicanalidad.' },

  { t: 'Multicanalidad', cat: 'uc',
    def: 'Utilización de varios canales que pueden funcionar de manera independiente.' },

  { t: 'Presencia', cat: 'uc',
    def: 'Estado de disponibilidad de un usuario: disponible, ocupado, ausente, etcétera.' },

  { t: 'Click-to-Call', cat: 'uc',
    def: 'Función que inicia una llamada haciendo clic desde el CRM, el navegador o una aplicación.' },

  { t: 'Screen Pop', cat: 'uc',
    def: 'Apertura automática de la ficha del cliente cuando entra una llamada.',
    com: 'Es de las funciones que más rápido se perciben en una demo: el agente ya sabe con quién habla antes de saludar.' },

  { t: 'Call Transfer', alias: ['transferencia'], cat: 'uc',
    def: 'Transferencia de una llamada hacia otra extensión, usuario o departamento.' },

  { t: 'Call Forwarding', alias: ['desvío'], cat: 'uc',
    def: 'Redireccionamiento automático de llamadas hacia otro destino.',
    ej: 'Extensión → celular.' },

  { t: 'Conference Call', cat: 'uc',
    def: 'Comunicación simultánea entre varios participantes.' },

  { t: 'Call Recording', alias: ['grabación de llamadas'], cat: 'uc',
    def: 'Grabación de las conversaciones. El archivo de audio asociado a una llamada.',
    ojo: 'CDR = información de la llamada. Recording = contenido de la llamada.' },

  { t: 'Call Monitoring', cat: 'uc',
    def: 'Supervisión de llamadas en tiempo real.' },

  /* ── Contact Center ──────────────────────────────────────────────────── */
  { t: 'ACD', sig: 'Automatic Call Distributor', cat: 'cc',
    def: 'Sistema que distribuye automáticamente las llamadas entre agentes usando reglas como disponibilidad, prioridad, horario, habilidades, departamento o idioma.' },

  { t: 'IVR', sig: 'Interactive Voice Response', cat: 'cc',
    def: 'Sistema automático que interactúa con el usuario mediante menús de voz o teclado.',
    ej: '"Para ventas marque 1. Para soporte marque 2."',
    ojo: 'Un IVR, un chatbot y un asistente de IA no son lo mismo. El IVR sigue un menú; el asistente interpreta.' },

  { t: 'Cola de llamadas', alias: ['Queue'], cat: 'cc',
    def: 'Espacio lógico donde esperan las llamadas mientras un agente queda disponible. Puede incorporar música, mensajes, posición, prioridad, agentes, métricas y SLA.',
    ojo: 'A diferencia de un grupo de timbrado, la cola mantiene al cliente esperando mientras busca agente disponible.' },

  { t: 'Skill-Based Routing', alias: ['enrutamiento por habilidades'], cat: 'cc',
    def: 'Enrutamiento basado en las habilidades del agente.',
    ej: 'Un cliente pide soporte técnico avanzado y la plataforma lo dirige solo a agentes especializados.' },

  { t: 'Call Routing', alias: ['enrutamiento'], cat: 'cc',
    def: 'Reglas utilizadas para decidir hacia dónde debe enviarse una llamada.' },

  { t: 'Overflow', cat: 'cc',
    def: 'Mecanismo que redirecciona llamadas cuando una cola supera determinada capacidad o tiempo de espera.' },

  { t: 'Callback', cat: 'cc',
    def: 'Permite que el cliente solicite una llamada posterior en lugar de permanecer esperando.' },

  { t: 'SLA', sig: 'Service Level Agreement', cat: 'cc',
    def: 'Indicador o compromiso sobre el nivel de atención.',
    ej: '"80% de llamadas atendidas antes de 20 segundos."' },

  { t: 'Abandonment Rate', alias: ['tasa de abandono'], cat: 'cc',
    def: 'Porcentaje de personas que cuelgan antes de ser atendidas.' },

  { t: 'ASA', sig: 'Average Speed of Answer', cat: 'cc',
    def: 'Tiempo promedio que tarda un agente en contestar.' },

  { t: 'AHT', sig: 'Average Handle Time', cat: 'cc',
    def: 'Tiempo promedio requerido para completar una interacción.' },

  { t: 'FCR', sig: 'First Contact Resolution', cat: 'cc',
    def: 'Porcentaje de solicitudes solucionadas durante el primer contacto.' },

  { t: 'ACW', sig: 'After Call Work', cat: 'cc',
    def: 'Actividades que realiza el agente después de terminar la llamada: clasificación, notas, actualización del CRM.',
    com: 'Es el trabajo administrativo que una buena integración elimina. Pregunta obligada: ¿qué pasa hoy cuando un agente cuelga?' },

  /* ── IA conversacional y modelos ─────────────────────────────────────── */
  { t: 'Chatbot', cat: 'ia',
    def: 'Programa diseñado para responder mediante texto siguiendo reglas, flujos o modelos de lenguaje.' },

  { t: 'Voicebot', cat: 'ia',
    def: 'Bot especializado en conversaciones mediante voz.' },

  { t: 'Asistente Virtual IA', alias: ['AI Assistant', 'asistente de IA'], cat: 'ia',
    def: 'Sistema capaz de comprender solicitudes, mantener contexto y consultar información. Principalmente informa, responde y ayuda.',
    ej: '"¿Cuál es el horario de atención?"',
    ojo: 'Asistente = conocimiento. Agente = conocimiento + razonamiento + ejecución.' },

  { t: 'Agente de IA', alias: ['AI Agent'], cat: 'ia',
    def: 'Además de responder, ejecuta acciones en sistemas externos.',
    com: 'Es el salto comercial: deja de informar y empieza a resolver.',
    ej: '"Cancela mi cita" → identifica usuario → consulta CRM → localiza la cita → cancela → registra actividad → confirma.',
    ojo: 'La diferencia con el asistente no es de calidad de respuesta, es de capacidad de ejecutar.' },

  { t: 'IA', sig: 'Inteligencia Artificial', alias: ['AI'], cat: 'ia',
    def: 'Sistemas capaces de ejecutar tareas relacionadas con percepción, razonamiento, lenguaje, predicción o generación de contenido.' },

  { t: 'Generative AI', alias: ['IA generativa'], cat: 'ia',
    def: 'IA capaz de crear contenido nuevo como texto, audio, imágenes o código.' },

  { t: 'LLM', sig: 'Large Language Model', cat: 'ia',
    def: 'Modelo entrenado con grandes cantidades de información para comprender y generar lenguaje.' },

  { t: 'NLP', sig: 'Natural Language Processing', cat: 'ia',
    def: 'Disciplina que permite a sistemas informáticos procesar lenguaje humano.' },

  { t: 'NLU', sig: 'Natural Language Understanding', cat: 'ia',
    def: 'Capacidad de interpretar la intención y el significado de una expresión.' },

  { t: 'Intent', alias: ['intención'], cat: 'ia',
    def: 'Objetivo que intenta lograr el usuario.' },

  { t: 'Entity', alias: ['entidad'], cat: 'ia',
    def: 'Información específica identificada dentro de una conversación.' },

  { t: 'Context', alias: ['contexto'], cat: 'ia',
    def: 'Información previa utilizada para mantener coherencia durante una conversación.' },

  { t: 'Prompt', cat: 'ia',
    def: 'Instrucción proporcionada a un modelo de IA.' },

  { t: 'System Prompt', cat: 'ia',
    def: 'Reglas principales que determinan cómo debe comportarse un asistente.' },

  { t: 'Tokens', cat: 'ia',
    def: 'Unidades en las que un modelo procesa el lenguaje.',
    ojo: 'No confundir con el token de acceso de una API: son conceptos completamente diferentes.' },

  { t: 'Alucinación', alias: ['Hallucination'], cat: 'ia',
    def: 'Respuesta generada por una IA que parece correcta pero contiene información falsa o no sustentada.',
    com: 'Es el riesgo que justifica RAG y Function Calling: si el dato existe en un sistema, la IA debe consultarlo, no inventarlo.' },

  { t: 'Guardrails', cat: 'ia',
    def: 'Reglas que limitan lo que un asistente puede responder o ejecutar.' },

  { t: 'RAG', sig: 'Retrieval-Augmented Generation', cat: 'ia',
    def: 'Arquitectura que permite que una IA consulte fuentes externas antes de responder: base de conocimiento, catálogo, políticas, manuales, CRM o documentos internos.',
    com: 'Reduce la dependencia del conocimiento genérico del modelo y lo ancla a la información de la empresa.' },

  { t: 'Function Calling', alias: ['Tool Calling'], cat: 'ia',
    def: 'Capacidad de un modelo de IA para solicitar la ejecución de una función externa.',
    ej: '"¿Cuál es mi saldo?" → la IA no lo inventa: IA → herramienta/API → sistema financiero → saldo → IA → cliente.',
    ojo: 'Es el concepto fundamental para diseñar agentes empresariales confiables.' },

  { t: 'Knowledge Base', alias: ['base de conocimiento'], cat: 'ia',
    def: 'Repositorio estructurado de información utilizado por colaboradores, clientes o sistemas de IA: FAQs, productos, procedimientos, políticas y manuales.' },

  /* ── IA aplicada a voz ───────────────────────────────────────────────── */
  { t: 'STT', sig: 'Speech-to-Text', alias: ['ASR', 'Automatic Speech Recognition'], cat: 'iavoz',
    def: 'Convierte voz en texto.',
    ej: 'Cliente habla → STT → texto.' },

  { t: 'TTS', sig: 'Text-to-Speech', cat: 'iavoz',
    def: 'Convierte texto generado por el sistema en audio.',
    ej: 'IA genera respuesta → TTS → el cliente escucha voz.' },

  { t: 'Flujo de agente de voz IA', cat: 'iavoz',
    def: 'Cliente habla → STT/ASR → la IA interpreta la intención → consulta sistemas o APIs → genera respuesta → TTS → el cliente escucha.',
    com: 'Entender este flujo permite explicar dónde se conecta cada sistema del cliente y dónde puede fallar.' },

  /* ── APIs e integración ──────────────────────────────────────────────── */
  { t: 'API', sig: 'Application Programming Interface', cat: 'api',
    def: 'Conjunto de reglas que permite que dos sistemas intercambien información o ejecuten acciones.',
    com: 'Es probablemente el término más importante para un comercial de comunicaciones: es lo que convierte una llamada en un registro de negocio.',
    ej: 'Telefonía → API → Salesforce: una llamada genera contacto, actividad, fecha, duración, agente, grabación y resultado.' },

  { t: 'Endpoint', cat: 'api',
    def: 'Dirección específica de una API utilizada para realizar una operación. Cada endpoint puede cumplir una función diferente.',
    ej: '/api/customers · /api/calls · /api/messages' },

  { t: 'REST API', cat: 'api',
    def: 'Arquitectura ampliamente utilizada para comunicación entre aplicaciones mediante HTTP. Operaciones frecuentes: GET consulta, POST crea, PUT/PATCH actualiza, DELETE elimina.',
    com: 'El comercial no necesita programarlas, pero sí comprender qué permiten hacer.' },

  { t: 'JSON', cat: 'api',
    def: 'Formato utilizado para intercambiar información entre sistemas. Es uno de los más usados por APIs modernas.',
    ej: '{ "cliente": "Empresa ABC", "telefono": "5555555555", "status": "prospecto" }' },

  { t: 'Webhook', cat: 'api',
    def: 'Mecanismo mediante el cual un sistema avisa automáticamente a otro cuando ocurre un evento.',
    ej: 'Se recibe una llamada → la plataforma genera un webhook → el CRM recibe teléfono, agente, duración y resultado.',
    ojo: 'La diferencia es fundamental: con API un sistema pregunta; con webhook un sistema avisa.' },

  { t: 'Middleware', cat: 'api',
    def: 'Capa intermedia que conecta dos o más sistemas. Puede transformar información, aplicar reglas o coordinar procesos.',
    ej: 'Telefonía → Middleware → CRM.' },

  { t: 'iPaaS', sig: 'Integration Platform as a Service', cat: 'api',
    def: 'Plataforma cloud utilizada para integrar múltiples aplicaciones.',
    ej: 'CRM + telefonía + ERP + WhatsApp + marketing + IA.' },

  { t: 'Native Integration', alias: ['integración nativa'], cat: 'api',
    def: 'Integración desarrollada directamente entre dos productos. Normalmente requiere menos desarrollo.' },

  { t: 'Custom Integration', alias: ['integración a la medida'], cat: 'api',
    def: 'Integración desarrollada específicamente para las necesidades de una empresa usando APIs, webhooks u otras tecnologías.' },

  { t: 'Authentication', alias: ['autenticación'], cat: 'api',
    def: 'Mecanismo utilizado para verificar quién intenta utilizar una aplicación o API.' },

  { t: 'API Key', cat: 'api',
    def: 'Credencial utilizada por una aplicación para autenticarse frente a una API.',
    ojo: 'Debe tratarse como información confidencial.' },

  { t: 'OAuth 2.0', cat: 'api',
    def: 'Estándar utilizado para autorizar acceso entre aplicaciones sin compartir directamente las credenciales principales del usuario.',
    com: 'Muy habitual en Google, Microsoft, Salesforce, HubSpot y aplicaciones SaaS.' },

  { t: 'Token de acceso', cat: 'api',
    def: 'Credencial temporal utilizada para consumir determinados recursos de una API.',
    ojo: 'No confundir con los tokens de un LLM. Son conceptos completamente diferentes.' },

  { t: 'Rate Limit', cat: 'api',
    def: 'Número máximo de solicitudes que una API permite dentro de determinado periodo.',
    com: 'Muy importante en proyectos de integración de alto volumen.' },

  { t: 'API Request', cat: 'api',
    def: 'Petición enviada desde un sistema hacia una API.' },

  { t: 'API Response', cat: 'api',
    def: 'Información que devuelve la API después de procesar una solicitud.' },

  { t: 'HTTP Status Code', cat: 'api',
    def: 'Código que indica el resultado de una solicitud. 200 correcto · 201 creado · 400 solicitud incorrecta · 401 no autenticado · 403 sin autorización · 404 no encontrado · 429 demasiadas solicitudes · 500 error del servidor.' },

  { t: 'Logging', cat: 'api',
    def: 'Registro técnico de eventos producidos por una aplicación. Es fundamental para diagnosticar errores.',
    ojo: 'Ante un incidente, la pregunta correcta es "¿existe un log del evento?" antes de afirmar que la plataforma falló.' },

  { t: 'Audit Trail', alias: ['bitácora de auditoría'], cat: 'api',
    def: 'Registro histórico de quién realizó determinada acción, cuándo y, cuando aplica, qué cambió.',
    com: 'Importante para seguridad, control y cumplimiento.' },

  /* ── CRM y CTI ───────────────────────────────────────────────────────── */
  { t: 'CRM', sig: 'Customer Relationship Management', cat: 'crm',
    def: 'Sistema utilizado para administrar prospectos, clientes, oportunidades, actividades, llamadas, seguimientos, ventas y servicio.',
    ej: 'Salesforce, HubSpot, Microsoft Dynamics, Zoho, entre otros.' },

  { t: 'CTI', sig: 'Computer Telephony Integration', cat: 'crm',
    def: 'Integración entre telefonía y aplicaciones empresariales.',
    com: 'Es la tecnología detrás de "CRM → clic → llamada" y de "entra llamada → CRM identifica al cliente → abre expediente". Concepto central para la venta consultiva.' },

  { t: 'Integración CRM + voz', cat: 'crm',
    def: 'Llamada entrante → identificación del ANI → búsqueda en CRM → identificación del cliente → screen pop → el agente atiende → grabación → transcripción IA → resumen → clasificación → actividad registrada automáticamente en el CRM.',
    com: 'Este flujo tiene valor comercial considerable porque elimina trabajo administrativo.' },

  { t: 'CRM Object', cat: 'crm',
    def: 'Entidad de información dentro de un CRM: Contact, Lead, Account, Opportunity, Ticket, Case.' },

  { t: 'Field Mapping', alias: ['mapeo de campos'], cat: 'crm',
    def: 'Definición de qué campo de un sistema corresponde con cuál campo del otro.',
    ej: 'Telefonía caller_number → CRM phone.',
    ojo: 'Sin un buen mapeo, una integración puede funcionar técnicamente y ser comercialmente inútil.' },

  { t: 'Data Sync', alias: ['sincronización'], cat: 'crm',
    def: 'Sincronización de información entre sistemas. Puede ser unidireccional, bidireccional, en tiempo real o periódica.' },

  { t: 'Real-Time Integration', cat: 'crm',
    def: 'Integración donde los eventos se transfieren prácticamente cuando ocurren.',
    ej: 'Entra la llamada → el CRM abre inmediatamente al cliente.' },

  { t: 'Batch Integration', cat: 'crm',
    def: 'Intercambio de información por bloques en intervalos determinados.',
    ej: 'Cada noche se transfieren todos los CDR del día.' },

  /* ── Canales de texto y WhatsApp ─────────────────────────────────────── */
  { t: 'WhatsApp Business Platform', alias: ['WhatsApp API', 'WhatsApp Business API'], cat: 'texto',
    def: 'Infraestructura empresarial de Meta para integrar WhatsApp con plataformas de atención, automatización y sistemas externos. Permite múltiples agentes, automatización, bots, IA, CRM, plantillas, campañas autorizadas, APIs y analítica.',
    ojo: 'No debe confundirse con la aplicación WhatsApp Business instalada en un teléfono.' },

  { t: 'Template', alias: ['plantilla de mensaje'], cat: 'texto',
    def: 'Mensaje previamente definido utilizado en determinados escenarios de mensajería empresarial. Puede usar variables.',
    ej: 'Hola {nombre}, tu pedido {folio} ha sido enviado.' },

  { t: 'Session', alias: ['Conversation', 'conversación'], cat: 'texto',
    def: 'Periodo lógico dentro del cual se agrupan mensajes relacionados con una interacción.',
    ojo: 'La definición exacta y las reglas de tarificación varían según el proveedor y el canal.' },

  { t: 'Opt-in', cat: 'texto',
    def: 'Consentimiento del usuario para recibir determinado tipo de comunicaciones.',
    com: 'Especialmente importante en WhatsApp, SMS, campañas y comunicaciones automatizadas.' },

  { t: 'Opt-out', cat: 'texto',
    def: 'Solicitud del usuario para dejar de recibir comunicaciones.',
    ej: '"No deseo recibir más mensajes."' },

  { t: 'Integración omnicanal', cat: 'texto',
    def: 'Busca conservar cliente + identidad + conversación + historial + contexto entre canales.',
    ej: 'El cliente inicia por WhatsApp y continúa por llamada; el agente conoce el contexto anterior.',
    ojo: 'No significa solamente colocar diferentes canales en una pantalla.' },

  { t: 'Identidad omnicanal', cat: 'texto',
    def: 'Proceso para determinar que diferentes interacciones pertenecen al mismo cliente.',
    ej: 'WhatsApp +52 55… · llamada +52 55… · CRM cliente 38422 — el sistema debe relacionar las tres identidades.' },

  /* ── Analítica de conversaciones ─────────────────────────────────────── */
  { t: 'Transcripción', cat: 'analitica',
    def: 'Conversión del audio de una conversación a texto.',
    com: 'Habilita búsquedas, análisis, QA, resúmenes, clasificación e inteligencia comercial.' },

  { t: 'Call Summary', alias: ['resumen de llamada'], cat: 'analitica',
    def: 'Resumen automático de una conversación, frecuentemente generado mediante IA. Puede registrar motivo, necesidad, acuerdos, objeciones y siguiente paso.',
    com: 'Para un CRM tiene un valor enorme: sustituye la nota que el agente no escribe.' },

  { t: 'Sentiment Analysis', alias: ['análisis de sentimiento'], cat: 'analitica',
    def: 'Análisis automatizado que intenta identificar señales de sentimiento en una conversación: positivo, neutral o negativo.',
    ojo: 'Debe utilizarse como indicador probabilístico, no como verdad absoluta.' },

  { t: 'Intent Detection', cat: 'analitica',
    def: 'Identificación automática del objetivo del cliente: comprar, soporte, cancelar, pagar, consultar factura, reagendar.' },

  { t: 'Topic Detection', cat: 'analitica',
    def: 'Identificación automática de los temas mencionados en una conversación.',
    ej: 'Una aseguradora podría identificar siniestro, póliza, renovación, cobertura y reclamación.' },

  { t: 'Entity Extraction', cat: 'analitica',
    def: 'Extracción automática de información específica de la conversación.',
    ej: '"Quiero cambiar mi cita del 18 de septiembre para Guadalajara" → acción: cambiar cita · fecha: 18 septiembre · ciudad: Guadalajara.' },

  { t: 'Speech Analytics', cat: 'analitica',
    def: 'Tecnología que analiza conversaciones de voz. Puede buscar palabras, frases, temas, silencios, duración, interrupciones, cumplimiento de guiones y objeciones.' },

  { t: 'Conversation Analytics', cat: 'analitica',
    def: 'Concepto más amplio que Speech Analytics porque analiza voz y texto en conjunto.',
    com: 'Permite analizar llamadas, chats y mensajería con el mismo criterio.' },

  { t: 'QA', sig: 'Quality Assurance', cat: 'analitica',
    def: 'Proceso de evaluación de calidad de las interacciones de agentes.',
    com: 'Tradicionalmente exige escuchar llamadas manualmente; con IA puede automatizarse parcialmente sobre grandes volúmenes.' },

  { t: 'Agent Assist', cat: 'analitica',
    def: 'IA que ayuda al agente humano durante una conversación: sugiere respuestas, documentación, promociones, procesos, preguntas y siguiente acción.',
    ojo: 'No sustituye necesariamente al agente. La IA ayuda al humano.' },

  { t: 'Next Best Action', cat: 'analitica',
    def: 'Recomendación automatizada sobre la siguiente acción más conveniente: ofrecer renovación, escalar a soporte, solicitar información, agendar seguimiento, enviar documentación.' },

  /* ── Seguridad y disponibilidad ──────────────────────────────────────── */
  { t: 'SLA técnico', cat: 'seguridad',
    def: 'Compromiso establecido sobre disponibilidad, soporte, tiempos de respuesta y recuperación.',
    ojo: 'No debe confundirse con una promesa comercial genérica.' },

  { t: 'Uptime', alias: ['disponibilidad'], cat: 'seguridad',
    def: 'Porcentaje de tiempo que un servicio permanece disponible.',
    ojo: '99%, 99.9% y 99.99% no son equivalentes. La diferencia se mide en horas de caída al año.' },

  { t: 'RTO', sig: 'Recovery Time Objective', cat: 'seguridad',
    def: 'Tiempo máximo objetivo para restablecer un servicio después de una interrupción.' },

  { t: 'RPO', sig: 'Recovery Point Objective', cat: 'seguridad',
    def: 'Cantidad de información que una organización considera aceptable perder después de una contingencia.',
    com: 'Más usado en datos y recuperación ante desastre que en telefonía pura.' },

  { t: 'MFA', sig: 'Multi-Factor Authentication', cat: 'seguridad',
    def: 'Solicita más de un factor para autenticar al usuario.',
    ej: 'Contraseña + código móvil.' },

  { t: 'SSO', sig: 'Single Sign-On', cat: 'seguridad',
    def: 'Permite acceder a diferentes aplicaciones utilizando una misma identidad corporativa.',
    ej: 'Microsoft Entra ID → plataforma de comunicaciones.' },

  { t: 'Encryption', alias: ['cifrado'], cat: 'seguridad',
    def: 'Cifrado de información para impedir que terceros puedan interpretarla sin autorización. Puede aplicarse en tránsito y en reposo.' },

  { t: 'Data at Rest', alias: ['datos en reposo'], cat: 'seguridad',
    def: 'Información almacenada.',
    ej: 'Grabaciones guardadas.' },

  { t: 'Data in Transit', alias: ['datos en tránsito'], cat: 'seguridad',
    def: 'Información mientras se mueve entre sistemas.',
    ej: 'Audio transmitiéndose durante una llamada.' },

  { t: 'PII', sig: 'Personally Identifiable Information', cat: 'seguridad',
    def: 'Información que permite identificar directa o indirectamente a una persona: nombre, teléfono, correo, identificadores.',
    com: 'Su tratamiento debe contemplarse en cualquier proyecto de CRM, grabación o IA.' },
]

/** Búsqueda por término, sigla o alias. Devuelve el término o `null`. */
export function buscarTermino(q: string): TerminoGlosario | null {
  const n = (s: string) => s.toLowerCase().normalize('NFD')
    .split('').filter(c => { const x = c.codePointAt(0) ?? 0; return x < 0x0300 || x > 0x036f }).join('')
    .replace(/[^a-z0-9]/g, '')
  const k = n(q)
  if (!k) return null
  return GLOSARIO.find(t =>
    n(t.t) === k || (t.sig && n(t.sig) === k) || t.alias?.some(a => n(a) === k),
  ) ?? null
}
