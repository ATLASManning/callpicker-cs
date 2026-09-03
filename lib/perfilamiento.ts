/**
 * Perfilamiento comercial — el método que convierte el vocabulario técnico
 * en una conversación de negocio.
 *
 * El diccionario (lib/glosario.ts) por sí solo produce vendedores que repiten
 * siglas. Lo que cambia una venta es la pregunta que se hace después de
 * entender el término. Por eso Atlas tiene instrucción de no soltar la
 * definición y ya: pregunta para qué se necesita y encamina hacia el
 * descubrimiento del proceso que puede automatizarse.
 *
 * La regla institucional: el vendedor no necesita programar una API, pero sí
 * debe ser capaz de hacer las preguntas que revelan si hay un proceso
 * automatizable detrás.
 */

export const REGLA_COMERCIAL =
  'El vendedor no necesita programar una API, pero sí debe saber preguntar. Estas preguntas cambian por completo una conversación comercial: dejan de vender "telefonía" y empiezan a descubrir procesos de negocio susceptibles de automatización.'

/* ── Los 12 que todo comercial debe dominar ──────────────────────────────── */

export const DOCE_ESENCIALES = [
  'VoIP', 'Cloud PBX', 'SIP', 'SIP Trunk', 'UCaaS', 'Omnicanalidad',
  'IVR', 'API', 'Webhook', 'CTI', 'CRM', 'Agente de IA',
] as const

/** La segunda capa, una vez dominados los doce. */
export const SEGUNDA_OLA = [
  'STT', 'TTS', 'LLM', 'RAG', 'Function Calling', 'Webhook', 'Screen Pop',
  'Call Recording', 'Transcripción', 'Conversation Analytics',
] as const

/* ── Preguntas de descubrimiento ─────────────────────────────────────────── */

export interface BloquePreguntas {
  bloque:    string
  /** Qué decide o revela este bloque. */
  revela:    string
  preguntas: string[]
}

export const PREGUNTAS_PERFILAMIENTO: BloquePreguntas[] = [
  {
    bloque: 'Situación actual',
    revela: 'Dónde está hoy el cliente en la escala de evolución y qué infraestructura hay que respetar o migrar.',
    preguntas: [
      '¿Qué CRM utilizan actualmente?',
      '¿Qué volumen de llamadas y conversaciones manejan?',
      '¿Qué sucede hoy cuando un agente termina una llamada?',
    ],
  },
  {
    bloque: 'Alcance de la integración',
    revela: 'Si el proyecto es registrar actividad o rediseñar el proceso. Cambia por completo el tamaño del trato.',
    preguntas: [
      '¿Necesitan solamente registrar llamadas o también originarlas desde el CRM?',
      '¿Quieren registrar voz, WhatsApp y chat dentro del mismo historial del cliente?',
      '¿Necesitan screen pop cuando entra una llamada?',
      '¿La integración debe crear actividades, tickets u oportunidades?',
    ],
  },
  {
    bloque: 'Inteligencia sobre la conversación',
    revela: 'Si hay caso para transcripción, resumen y analítica — donde vive el valor que el cliente no sabía que podía pedir.',
    preguntas: [
      '¿Necesitan grabación y transcripción?',
      '¿Quieren que la IA solamente responda o también ejecute acciones?',
      '¿La IA necesita consultar información del CRM?',
      '¿Debe escribir información nuevamente en el CRM?',
    ],
  },
  {
    bloque: 'Viabilidad técnica',
    revela: 'Si el proyecto es realizable como native integration, requiere desarrollo a la medida, o hay un bloqueo real.',
    preguntas: [
      '¿La integración será en tiempo real?',
      '¿Existe API disponible en el CRM?',
      '¿Existen webhooks?',
    ],
  },
  {
    bloque: 'Telefonía heredada y numeración',
    revela: 'El calendario y el riesgo de la migración. Aquí se decide si hay gateway de por medio y si la portabilidad marca la fecha.',
    preguntas: [
      '¿Qué tienen hoy: líneas analógicas, E1/PRI o troncal SIP?',
      '¿Cuántas llamadas simultáneas necesitan realmente, más allá de cuántos números tienen?',
      '¿Los números actuales deben conservarse?',
      '¿Qué número quieren que vea el cliente cuando reciba una llamada de sus agentes?',
      '¿Hay equipos analógicos que deban seguir funcionando (fax, conmutador, porteros)?',
    ],
  },
]

/* ── Escala de evolución ─────────────────────────────────────────────────── */

export interface NivelEvolucion {
  n:        number
  titulo:   string
  que:      string
  /** Señal que indica que el cliente está en este nivel. */
  senal:    string
}

export const NIVELES_EVOLUCION: NivelEvolucion[] = [
  { n: 1, titulo: 'Telefonía',            que: 'Llamar y recibir llamadas.',
    senal: 'Hablan de líneas, extensiones y conmutador. Nadie menciona el CRM.' },
  { n: 2, titulo: 'UCaaS',                que: 'Voz + video + chat + colaboración.',
    senal: 'Ya tienen herramientas de colaboración, pero la telefonía vive aparte.' },
  { n: 3, titulo: 'Omnicanalidad',        que: 'Voz + WhatsApp + SMS + chat.',
    senal: 'Atienden por varios canales, pero cada uno con su propia bandeja y sin contexto compartido.' },
  { n: 4, titulo: 'Integración',          que: 'Comunicaciones ↔ CRM.',
    senal: 'El agente copia y pega datos entre la llamada y el CRM. El ACW es largo.' },
  { n: 5, titulo: 'Inteligencia',         que: 'Transcripción + resumen + analytics.',
    senal: 'Graban llamadas pero nadie las escucha; el QA es muestral y manual.' },
  { n: 6, titulo: 'Agentes IA',           que: 'Conversación → razonamiento → API → acción.',
    senal: 'Tienen bots que responden pero escalan a un humano para cualquier trámite real.' },
  { n: 7, titulo: 'Automatización comercial', que: 'El cliente habla → la IA entiende → consulta el CRM → el proceso se ejecuta → el CRM se actualiza → el humano interviene solo cuando agrega valor.',
    senal: 'Es el marco comercial objetivo: no se presenta telefonía ni WhatsApp por separado, sino la capacidad de conectar conversaciones + datos + CRM + IA + automatización.' },
]

/* ── De dónde viene cada cosa ────────────────────────────────────────────── */

export const TABLA_EVOLUCION: Array<{ antes: string; despues: string }> = [
  { antes: 'Línea analógica',      despues: 'Telefonía IP' },
  { antes: 'E1 / PRI',             despues: 'SIP Trunk' },
  { antes: 'PBX física',           despues: 'IP-PBX' },
  { antes: 'IP-PBX',               despues: 'Cloud PBX / UCaaS' },
  { antes: 'Teléfono físico',      despues: 'Softphone / App / WebRTC' },
  { antes: 'IVR tradicional',      despues: 'IVR conversacional / Voicebot' },
  { antes: 'Grabación',            despues: 'Transcripción + Analytics' },
  { antes: 'Agente telefónico',    despues: 'Agent Assist' },
  { antes: 'Bot',                  despues: 'Asistente IA' },
  { antes: 'Asistente IA',         despues: 'Agente IA conectado mediante APIs' },
  { antes: 'Telefonía aislada',    despues: 'Telefonía + CRM' },
  { antes: 'CRM + telefonía',      despues: 'CRM + voz + texto + IA + automatización' },
]

/* ── Precisiones que evitan errores comerciales ──────────────────────────── */

export interface Precision {
  titulo:      string
  confusion:   string
  correccion:  string
  ejemplo?:    string
}

export const PRECISIONES: Precision[] = [
  {
    titulo: 'Número ≠ extensión ≠ canal ≠ troncal',
    confusion: 'Se asume que tener muchos números permite muchas llamadas simultáneas.',
    correccion: 'El número es el identificador público, la extensión es el usuario interno, el canal es la capacidad de una llamada simultánea y la troncal es el enlace que los transporta.',
    ejemplo: 'Una organización puede tener 100 DID, 250 extensiones y una troncal SIP de 40 canales: 250 usuarios, 100 números públicos y solo 40 llamadas simultáneas.',
  },
  {
    titulo: 'API ≠ Webhook',
    confusion: 'Se usan como sinónimos al describir una integración.',
    correccion: 'Con una API un sistema pregunta. Con un webhook un sistema avisa cuando ocurre un evento.',
  },
  {
    titulo: 'CDR ≠ grabación',
    confusion: 'Se promete "el detalle de la llamada" pensando en el audio.',
    correccion: 'El CDR es la información de la llamada (origen, destino, duración, agente). La grabación es el contenido. El CDR no contiene audio.',
  },
  {
    titulo: 'Asistente de IA ≠ Agente de IA',
    confusion: 'Se vende un asistente prometiendo que resolverá trámites.',
    correccion: 'Asistente = conocimiento. Agente = conocimiento + razonamiento + ejecución en sistemas externos.',
    ejemplo: '"¿Cuál es el horario?" lo resuelve un asistente. "Cancela mi cita" requiere un agente conectado por API.',
  },
  {
    titulo: 'IVR ≠ chatbot ≠ asistente de IA',
    confusion: 'Se presentan como niveles del mismo producto.',
    correccion: 'El IVR sigue un menú fijo; el chatbot responde por texto siguiendo reglas o modelo; el asistente interpreta la intención y mantiene contexto.',
  },
  {
    titulo: 'Tokens de LLM ≠ token de acceso',
    confusion: 'Se mezclan al hablar de costos o de seguridad.',
    correccion: 'Los tokens de un LLM son unidades de procesamiento de lenguaje. Un token de acceso es una credencial temporal de API. No tienen relación.',
  },
  {
    titulo: 'El SBC no es "un firewall de voz"',
    confusion: 'Se simplifica para explicarlo rápido.',
    correccion: 'Es un punto de control especializado entre ambientes SIP: seguridad, control de sesiones, interoperabilidad, NAT traversal, normalización y cifrado.',
  },
  {
    titulo: 'Omnicanalidad ≠ varios canales en una pantalla',
    confusion: 'Se llama omnicanal a una bandeja unificada.',
    correccion: 'Omnicanal real conserva cliente + identidad + conversación + historial + contexto al cambiar de canal. Sin eso es multicanalidad.',
  },
  {
    titulo: 'Plataforma ≠ carrier',
    confusion: 'Se asume que quien da el software da también la numeración.',
    correccion: 'Una empresa puede proveer la plataforma mientras otro operador provee numeración, originación, terminación y acceso PSTN.',
  },
  {
    titulo: 'WhatsApp Business App ≠ WhatsApp Business Platform',
    confusion: 'Se cotiza automatización sobre la app del teléfono.',
    correccion: 'La Platform (API) es la infraestructura empresarial de Meta: múltiples agentes, bots, IA, CRM, plantillas y analítica. La app instalada en un teléfono no hace eso.',
  },
  {
    titulo: 'SLA técnico ≠ promesa comercial',
    confusion: 'Se ofrece "disponibilidad total" sin respaldo.',
    correccion: 'El SLA técnico compromete disponibilidad, soporte, tiempos de respuesta y recuperación. Además, 99%, 99.9% y 99.99% no son equivalentes.',
  },
  {
    titulo: 'Una integración puede funcionar y ser inútil',
    confusion: 'Se da por exitosa una integración porque "ya conecta".',
    correccion: 'Sin un buen field mapping, los datos llegan al campo equivocado y nadie los usa. El mapeo se define antes, no después.',
  },
]

/* ── Cómo debe conducirse Atlas ──────────────────────────────────────────── */

/**
 * Instrucción de dirección: el diccionario no es para lucirse, es para
 * perfilar. Atlas responde el término y devuelve la conversación al negocio.
 */
export const CONDUCTA_ATLAS_GLOSARIO = [
  'Da la definición completa y en corto: qué es, y qué significa comercialmente.',
  'Pregunta siempre para qué lo necesita: si es una objeción de un cliente, una cotización, una llamada por venir o estudio propio. La respuesta útil cambia según el caso.',
  'Si es para una cuenta o una oportunidad, pide el nombre y usa lo que ya sabes de esa cuenta antes de opinar.',
  'Entrega máximo tres preguntas de descubrimiento que el asesor pueda hacerle al cliente sobre ese tema, tomadas de los bloques de perfilamiento.',
  'Cuando el término tenga una confusión conocida asociada, dila sin que se la pidan: son las que cuestan dinero al dimensionar.',
  'Ubica al cliente en la escala de evolución cuando haya datos para hacerlo, y nombra el siguiente nivel realista — no el nivel 7 siempre.',
  'No inventes capacidades de la plataforma ni condiciones comerciales. Si no lo sabes, dilo y ofrece investigarlo.',
  'Cuando el asesor nombre una plataforma que el cliente YA tiene (Pipedrive, Salesforce, HubSpot, Dynamics, Zoho, Zenvia, Sirena): no des una clase sobre el producto. Reconócelo en una línea y pasa de inmediato a qué se quiere integrar con él — llamadas, WhatsApp, SMS, grabaciones, actividades o IA — y en qué dirección viaja el dato.',
  'Con nombres ambiguos como Sirena, la primera respuesta es una pregunta: qué producto o versión usan hoy. Nunca asumas cuál es.',
] as const
