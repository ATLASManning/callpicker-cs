// ── Base de Conocimiento CS — Datos ──────────────────────────────────────────
// Añadir nuevos artículos aquí sin tocar la UI

export interface Consideracion { texto: string; tipo?: 'warning' | 'info' | 'error' }
export interface TarificacionFila { tipo: string; destino?: string; regla: string; nivel: 'green' | 'amber' | 'red' }
export interface Modalidad { nombre: string; descripcion: string }
export interface ApiItem   { nombre: string; descripcion: string }

export interface Bloque {
  tipo:    'parrafo' | 'seccion' | 'lista' | 'cita' | 'firma' | 'codigo'
  titulo?: string
  texto?:  string
  items?:  string[]
}

export interface Articulo {
  id:             string
  pdfUrl?:        string
  linkUrl?:       string
  linkLabel?:     string
  titulo:         string
  descripcion:    string
  ubicacion?:     string
  utilidad?:      string
  badge?:         'roto' | 'pronto' | 'avanzado' | 'nuevo'
  tarificacion?:  TarificacionFila[]
  funcionamiento?: string[]
  consideraciones?: Consideracion[]
  modalidades?:   Modalidad[]
  acciones?:      string[]
  graficas?:      string[]
  apis?:          ApiItem[]
  subtitulos?:    { titulo: string; items: string[] }[]
  bloques?:       Bloque[]
}

export interface Categoria {
  id:       string
  label:    string
  color:    string
  articulos: Articulo[]
}

// ─────────────────────────────────────────────────────────────────────────────
export const KB: Categoria[] = [

  // ── MINUTOS ─────────────────────────────────────────────────────────────
  {
    id: 'minutos', label: 'Minutos', color: '#A855F7',
    articulos: [
      {
        id: 'minutos-planes',
        titulo: 'Planes de Bolsa de Minutos',
        descripcion: 'Cantidad de minutos que incluye el plan para ser usados entre todas las extensiones de la cuenta, tanto para llamadas entrantes como salientes, a destinos nacionales, EEUU y Canadá.',
        ubicacion: 'Parte inferior izquierda del menú lateral',
        tarificacion: [
          { tipo: 'Saliente a fijo / contestada en fijo',               regla: '1 min (sin importar duración)', nivel: 'green' },
          { tipo: 'Saliente a celular / contestada en celular',          regla: 'Por minuto (real)',             nivel: 'red'   },
          { tipo: 'Contestada en SIP',                                   regla: '1 min (sin importar duración)', nivel: 'green' },
          { tipo: 'EEUU/Canadá — saliente o entrante',                   regla: 'Por minuto (real)',             nivel: 'amber' },
        ],
        consideraciones: [
          { texto: 'Los minutos no consumidos NO se pasan al siguiente corte (no son rollover).', tipo: 'warning' },
          { texto: 'Si el plan lo especifica, las llamadas recibidas vía SIP no consumen minutos.' },
          { texto: 'Si se agotan los minutos incluidos, no se corta el servicio; el excedente se cobra al precio establecido en el plan.' },
          { texto: 'Las llamadas atendidas por buzón de voz del celular también se contabilizan.', tipo: 'warning' },
          { texto: 'El minuto entrante 800 comienza a contabilizarse desde que conecta la llamada (menú, Agente Virtual u otro destino).' },
          { texto: 'En llamadas entre extensiones, se contabiliza solo el segundo enlace.' },
        ],
      },
      {
        id: 'minutos-entre-ext',
        titulo: 'Minutos entre Extensiones',
        descripcion: 'Reglas específicas de contabilización de minutos cuando la llamada se realiza de una extensión a otra.',
        tarificacion: [
          { tipo: 'Ext. SIP → Ext. SIP',                     regla: '1 min (sin importar duración)', nivel: 'green' },
          { tipo: 'Ext. App/my → Ext. SIP',                  regla: '1 min (sin importar duración)', nivel: 'green' },
          { tipo: 'Ext. SIP → Ext. con número celular',       regla: 'Totalidad de minutos reales',   nivel: 'red'   },
          { tipo: 'Ext. SIP → Ext. con número fijo',          regla: '1 min (sin importar duración)', nivel: 'green' },
        ],
        consideraciones: [
          { texto: 'El escenario de mayor consumo es cuando la extensión destino tiene número celular: se descuenta la totalidad de minutos reales.', tipo: 'warning' },
        ],
      },
    ],
  },

  // ── EXTENSIONES ─────────────────────────────────────────────────────────
  {
    id: 'extensiones', label: 'Extensiones', color: '#0EA5E9',
    articulos: [
      {
        id: 'ext-bolsa',
        titulo: 'Extensiones de Bolsa de Minutos',
        descripcion: 'Tipo de extensión que para hacer o recibir llamadas consume de la bolsa de minutos del plan.',
        ubicacion: 'Configuración > Extensiones',
        consideraciones: [
          { texto: 'El número de extensión puede ser de 3 o 4 dígitos.' },
          { texto: 'Puede tener hasta un máximo de 2 redirecciones a PSTN (celular, fijo).' },
          { texto: 'No se puede limitar el consumo por extensión.', tipo: 'warning' },
          { texto: 'No se cuenta con restricciones o códigos de marcación.' },
        ],
      },
      {
        id: 'ext-ilimitadas',
        pdfUrl: '/docs/Política de Uso Justo.pdf',
        titulo: 'Extensiones con Llamadas Ilimitadas',
        descripcion: 'Tipo de extensión con llamadas ilimitadas para hacer y recibir llamadas en destinos nacionales, EEUU y Canadá.',
        ubicacion: 'Configuración > Extensiones',
        consideraciones: [
          { texto: 'El número de extensión puede ser de 3 o 4 dígitos.' },
          { texto: 'Están sujetas a política de uso justo.', tipo: 'warning' },
        ],
      },
      {
        id: 'usuarios-admin',
        titulo: 'Usuarios Administradores',
        descripcion: 'Tipo de usuario para el portal admin.callpicker.com',
        ubicacion: 'Empresa > Perfil',
        acciones: [
          'Consultar y escuchar llamadas',
          'Consultar y modificar configuración',
          'Consultar y modificar datos fiscales',
        ],
        consideraciones: [
          { texto: 'No pueden crear más administradores.', tipo: 'warning' },
          { texto: 'No pueden modificar la información del titular de la cuenta.', tipo: 'warning' },
        ],
      },
    ],
  },

  // ── LÍNEAS Y CANALES ─────────────────────────────────────────────────────
  {
    id: 'lineas', label: 'Líneas y Canales', color: '#22C55E',
    articulos: [
      {
        id: 'numeros',
        titulo: 'Números Telefónicos',
        descripcion: 'Número fijo nacional o internacional (troncal/DID) que se emplea para hacer o recibir llamadas en la plataforma de Callpicker.',
        ubicacion: 'Empresa > Perfil',
        consideraciones: [
          { texto: 'Los números 800 solo permiten recibir llamadas, no realizar.', tipo: 'warning' },
          { texto: 'No se pueden incorporar números celulares como troncal de entrada o salida de llamadas.', tipo: 'warning' },
          { texto: 'Se puede brindar numeración fija de las ciudades donde se cuenta cobertura.' },
          { texto: 'Se pueden recibir portabilidades de números fijos nacionales o internacionales cumpliendo los requisitos y proceso indicado.' },
        ],
      },
      {
        id: 'canales',
        titulo: 'Canales de Voz',
        descripcion: 'Los canales son las llamadas simultáneas que se pueden establecer. Por cada canal del plan, se brinda uno en cada categoría: entrante, saliente y API. Con 5 canales: recibir 5, hacer 5 y establecer 5 vía API a la vez.',
        ubicacion: 'Empresa > Perfil',
        consideraciones: [
          { texto: 'De los canales incluidos, no se pueden pasar entre categorías.', tipo: 'warning' },
          { texto: 'Los canales en esquema por extensión se comparten entre todas.' },
          { texto: 'Las llamadas entre extensiones NO consumen canales.' },
          { texto: 'Las transferencias no consumen más canales de los ya establecidos.' },
          { texto: 'Los canales para Campañas se habilitan junto con ese módulo.' },
        ],
      },
    ],
  },

  // ── FUNCIONALIDADES ──────────────────────────────────────────────────────
  {
    id: 'funcbasicas', label: 'Funcionalidades', color: '#F59E0B',
    articulos: [
      {
        id: 'app-movil',
        titulo: 'App Móvil',
        descripcion: 'Aplicación para Android e iOS que permite consultar y realizar llamadas vía Callpicker, editar contactos, programar llamadas, entre otros.',
        consideraciones: [
          { texto: 'No se puede tener más de una sesión abierta con las mismas credenciales.', tipo: 'warning' },
          { texto: 'Android 8 o superior, iOS 12 o superior (actualización 14 de Agosto de 2025).' },
          { texto: 'Para recibir llamadas NO es necesario contar con Internet.' },
          { texto: 'Para realizar llamadas SÍ se requiere datos móviles o WiFi, aunque la llamada no viaje por Internet — se necesita conexión para enviar instrucciones al sistema.', tipo: 'info' },
        ],
      },
      {
        id: 'navegador',
        titulo: 'Llamadas desde el Navegador',
        descripcion: 'Posibilidad de hacer y recibir llamadas directamente en el navegador de Internet.',
        consideraciones: [
          { texto: 'Disponible en https://dialer.callpicker.com/ usando las mismas credenciales SIP.' },
        ],
      },
      {
        id: 'softphone',
        pdfUrl: '/docs/Venta Equipos IP.pdf',
        titulo: 'Softphone + Compatibilidad SIP',
        descripcion: 'Callpicker es compatible con Softphone para Windows y Mac, y teléfonos IP bajo el estándar SIP.',
        consideraciones: [
          { texto: 'Existen Softphone gratuitos y de paga. Callpicker provee uno sin costo para Windows; en Mac se puede usar la app Telephone nativa del sistema.' },
          { texto: 'Consultar los requisitos para el correcto funcionamiento del softphone.' },
          { texto: 'Corroborar la compatibilidad del equipo IP a configurar.' },
        ],
      },
      {
        id: 'transferencia',
        titulo: 'Transferencia de Llamadas',
        descripcion: 'En una llamada activa (entrante o saliente), permite transferir la llamada a otra extensión u otro destino previamente establecido como "Código de Destino".',
        modalidades: [
          { nombre: 'Transferencia asistida', descripcion: 'Permite tener una conversación privada entre la extensión origen y destino antes de ejecutar la transferencia.' },
          { nombre: 'Transferencia ciega',    descripcion: 'Transfiere la llamada inmediatamente a la extensión destino.' },
        ],
        consideraciones: [
          { texto: 'En una transferencia ciega, si la extensión destino no contesta, se enlaza nuevamente con la extensión original.' },
        ],
      },
      {
        id: 'espera',
        titulo: 'Llamada en Espera',
        descripcion: 'Permite poner a la llamada activa en modo espera; la persona escuchará música por defecto o el audio personalizado.',
        funcionamiento: [
          'Teclear **99 para poner la llamada en espera.',
          'Presionar cualquier tecla numérica para recuperar la llamada.',
        ],
      },
      {
        id: 'desvio',
        titulo: 'Desvío de Llamadas',
        descripcion: 'Permite que la extensión pueda contestar llamadas en una línea fija o celular usando el campo Redirección.',
        consideraciones: [
          { texto: 'Dependiendo de la modalidad contratada, puede estar restringido o limitado a máximo 2 redirecciones por extensión.', tipo: 'warning' },
        ],
      },
      {
        id: 'directorio',
        titulo: 'Directorio de Extensiones',
        descripcion: 'Habilita dentro de la App y my.callpicker.com el listado de extensiones de la cuenta, con posibilidad de clic para iniciar la marcación.',
        consideraciones: [
          { texto: 'En App iOS no está funcionando el buscador — ya fue reportado.', tipo: 'error' },
        ],
      },
      {
        id: 'agendar',
        titulo: 'Agendar Llamada',
        descripcion: 'Programa una llamada de manera individual desde admin.callpicker.com (Administrador) o desde my.callpicker.com / App (Extensión).',
        funcionamiento: [
          'Cuando llega el día y la hora, se envía una llamada a la extensión.',
          'Una vez que la extensión contesta, se enlaza con el destino programado.',
        ],
        consideraciones: [
          { texto: 'Esto NO es Campañas (llamadas programadas masivas).', tipo: 'warning' },
        ],
      },
      {
        id: 'etiquetas',
        titulo: 'Etiquetas y Notas en Llamadas',
        descripcion: 'Desde my.callpicker.com o la App, al seleccionar un contacto, permite agregar etiquetas, agregar notas y agendar llamadas.',
      },
      {
        id: 'ventana-emergente',
        titulo: 'Ventana Emergente de Llamada',
        descripcion: 'Al recibir o hacer una llamada vía Callpicker, se abre la ventana emergente del Contacto en my.callpicker.com.',
        consideraciones: [
          { texto: 'Si se hace o recibe una nueva llamada, reemplaza la ventana emergente previa.' },
        ],
      },
      {
        id: 'contactos',
        titulo: 'Contactos',
        descripcion: 'Permite consultar y editar los contactos con los que se ha tenido interacción telefónica. También permite añadir un contacto de manera individual o importar masivamente a través de un archivo CSV.',
      },
      {
        id: 'salas-conferencia',
        titulo: 'Salas de Conferencia',
        descripcion: 'Permite crear salas de conferencias telefónicas donde los participantes se unen llamando vía telefónica. Las extensiones pueden unirse usando un "Código de Destino".',
        funcionamiento: [
          'Al ingresar, se le pide al participante que diga su nombre.',
          'Al entrar, se informa cuántas personas están ya en la sala.',
          'A los participantes existentes se les anuncia el nombre de quien se incorpora.',
        ],
        consideraciones: [
          { texto: 'No brinda canales adicionales a los del plan.', tipo: 'warning' },
          { texto: 'Se debe incorporar a un flujo para ingresar (ej. opción de Menú o Código de Destino).' },
          { texto: 'La cantidad máxima de personas está limitada por los canales de voz de la cuenta.' },
          { texto: 'Si una extensión se une vía Código de Marcación, NO consume canal de voz.' },
        ],
      },
      {
        id: 'audios-sistema',
        titulo: 'Personalizar Audios del Sistema',
        descripcion: 'Permite personalizar los audios predeterminados del sistema a nivel cuenta.',
        subtitulos: [
          { titulo: 'Audios personalizables', items: [
            'Música de timbrado — mientras el cliente espera ser enlazado.',
            'Música en espera — cuando una llamada es puesta en espera.',
            'Extensión ocupada — cuando se acaba el tiempo de timbrado o la extensión está no disponible.',
            'Calificar Llamada — al finalizar, permite recibir 1 o 2.',
            'Comentario tras Calificar — permite dejar un mensaje de audio.',
            'Regresar con asesor — tiene prioridad sobre el audio de encuesta regular.',
            'Al contestar una extensión — requiere "Anunciar una llamada de una extensión" activado.',
          ]},
        ],
        consideraciones: [
          { texto: 'Los audios del sistema son a nivel cuenta; no se pueden diferenciar por número telefónico u otro parámetro.', tipo: 'warning' },
          { texto: 'El audio "Regresar con asesor" sustituye a "Calificar Llamada" y no permite dejar retroalimentación.' },
          { texto: 'Los audios son generados con IA o pueden subirse manualmente (formato: WAV, 8 bits, mono, 8000Hz).' },
        ],
      },
    ],
  },

  // ── FLUJO ────────────────────────────────────────────────────────────────
  {
    id: 'flujo', label: 'Flujo', color: '#EC4899',
    articulos: [
      {
        id: 'grupos-ext',
        titulo: 'Grupos de Extensiones',
        descripcion: 'Permite agrupar extensiones para que timbren todas a la vez o en un orden dado. Se especifica el tiempo de timbrado y el destino si ninguna contesta.',
        ubicacion: 'Configuración > Grupos de extensiones',
        subtitulos: [
          { titulo: 'Modalidades incluidas en todos los planes', items: [
            'Todos a la vez (ring all).',
            'Secuencia (cacería / hunt).',
          ]},
        ],
      },
      {
        id: 'timbrado-equitativo',
        titulo: 'Timbrado Equitativo en Grupos',
        descripcion: 'Distribuye las llamadas que se envían a un grupo de manera equitativa (carrusel) entre las extensiones pertenecientes.',
        funcionamiento: [
          'La 1ª llamada va para la extensión 1 del grupo, la 2ª para la extensión 2, y así sucesivamente.',
          'Si la extensión en turno no contesta, se pasa a la siguiente.',
        ],
        consideraciones: [
          { texto: 'Si se modifican las extensiones del grupo, puede afectarse el orden de distribución inicial.', tipo: 'warning' },
          { texto: 'Se está documentando un issue para evitar que se reinicie el orden.', tipo: 'info' },
        ],
      },
      {
        id: 'calendario',
        titulo: 'Calendario de Eventos',
        descripcion: 'Sección donde se configuran Eventos Permanentes y Eventos Únicos que alteran el flujo de llamadas dependiendo de la hora y el día.',
        ubicacion: 'Flujo > Calendarios',
      },
      {
        id: 'ivr',
        titulo: 'Menú de Opciones (IVR)',
        descripcion: 'Elemento que agrupa uno o varios audios informativos con opciones que se pueden teclear, y un destino default si no se teclea nada.',
        ubicacion: 'Flujo > Menús',
        consideraciones: [
          { texto: 'Los audios son generados con IA, no grabados por humanos. El usuario puede subir su propio audio (WAV, 8 bits, mono, 8000Hz).' },
          { texto: 'Las opciones de menú solo pueden contener números; no se pueden agregar símbolos como # o *.', tipo: 'warning' },
        ],
      },
      {
        id: 'submenus',
        titulo: 'Creación de Submenús',
        descripcion: 'Posibilidad de anidar menús: una opción de menú puede llevar a otro menú.',
        ubicacion: 'Flujo > Menús',
      },
      {
        id: 'codigos-destino',
        titulo: 'Códigos de Destino',
        descripcion: 'Códigos numéricos que al ingresar internamente envían a un destino especificado (extensión, grupo, menú, etc.).',
        funcionamiento: [
          'Al transferir una llamada.',
          'Marcándolo directamente desde una extensión.',
        ],
        consideraciones: [
          { texto: 'El código puede ser de máximo 4 números.' },
          { texto: 'El código destino tiene precedencia sobre números de extensión.', tipo: 'warning' },
        ],
      },
    ],
  },

  // ── FUNCIONES AVANZADAS ──────────────────────────────────────────────────
  {
    id: 'avanzadas', label: 'Avanzadas', color: '#EF4444',
    articulos: [
      {
        id: 'grabacion',
        titulo: 'Grabación de Llamadas',
        descripcion: 'Permite reproducir y descargar individualmente los audios de las llamadas.',
        consideraciones: [
          { texto: 'Se puede restringir para que las extensiones no escuchen las llamadas (App y my.callpicker.com).' },
          { texto: 'No se puede hacer exportación masiva de audios.', tipo: 'warning' },
        ],
      },
      {
        id: 'exportar-excel',
        titulo: 'Exportar Llamadas a Excel',
        descripcion: 'Exporta registros de llamadas entrantes o salientes a un archivo CSV, con filtros de fecha y otros campos. Disponible en admin.callpicker.com y my.callpicker.com.',
        consideraciones: [
          { texto: 'Se pueden exportar máximo 25,000 registros a la vez.', tipo: 'info' },
        ],
      },
      {
        id: 'bloqueos',
        titulo: 'Bloqueos y Excepciones',
        descripcion: 'Control de qué números pueden llamar (origen) o ser marcados (destino).',
        subtitulos: [
          { titulo: 'Tipos de bloqueo', items: [
            'Bloqueo de Origen: impide recibir llamadas de un número o patrón. La persona escuchará tonos de ocupado.',
            'Bloqueo de Destino: impide realizar llamadas a un número o patrón. La extensión escucha un audio informativo.',
            'Excepción de Origen: permite recibir llamadas de un número dentro de un bloqueo.',
            'Excepción de Destino: permite realizar llamadas a un número dentro de un bloqueo.',
          ]},
        ],
      },
      {
        id: 'amd',
        titulo: 'Detección de Máquinas (AMD)',
        descripcion: 'Al activarse, si se detecta que una llamada es contestada por una máquina en lugar de un humano, la cuelga automáticamente.',
        utilidad: 'Aplica en llamadas originadas desde Campañas o vía API donde el primer leg tiene destino PSTN.',
        consideraciones: [
          { texto: 'Porcentaje de éxito en identificación: 80–90% aproximadamente.', tipo: 'info' },
          { texto: 'Para consultar si la llamada fue terminada por AMD, expandir la llamada en el historial.' },
          { texto: 'Los contactos de campañas detectados como máquina salen como "Timeout".', tipo: 'warning' },
        ],
      },
      {
        id: 'enmascaramiento',
        titulo: 'Enmascaramiento de Llamadas',
        descripcion: 'Mecanismo para evitar que los números sean marcados como SPAM, y para propagar el CallerID en redirecciones.',
        subtitulos: [
          { titulo: 'Salientes', items: [
            'Cuando la extensión realiza una llamada, la persona que recibe ve un número aleatorio de un rango no asignado, de la misma LADA del número marcado.',
          ]},
          { titulo: 'Entrantes', items: [
            'Permite propagar el CallerID cuando se contesta en una redirección PSTN. El inconveniente es que la persona no sabe que la llamada es vía Callpicker.',
          ]},
        ],
        consideraciones: [
          { texto: 'Actualmente solo puede ser activado por personal de Soporte de Callpicker.', tipo: 'warning' },
          { texto: 'Algunos operadores como AT&T no permiten recibir llamadas de números no asignados.', tipo: 'warning' },
        ],
      },
      {
        id: 'jalar-sip',
        titulo: 'Jalar Llamada SIP',
        descripcion: 'Permite crear agrupaciones de extensiones para que cuando esté timbrando una extensión del grupo, otro miembro pueda tomarla.',
        utilidad: 'Pensado para equipos físicamente cercanos que necesitan tomar llamadas de compañeros.',
        consideraciones: [
          { texto: 'Es independiente de los Grupos de Extensiones.', tipo: 'info' },
          { texto: 'Solo funciona en extensiones SIP; no funciona para redirecciones PSTN (celular, fijo).', tipo: 'warning' },
          { texto: 'Una extensión solo puede estar en un grupo.' },
        ],
      },
      {
        id: 'alertas-perdidas',
        titulo: 'Alertas Personalizadas de Llamadas Perdidas',
        descripcion: 'Genera alertas vía email a uno o más correos cuando una Extensión o Grupo pierde una llamada o una cantidad especificada, dentro de un período de tiempo dado.',
      },
      {
        id: 'ruteo-lada',
        titulo: 'Rutear Llamadas por LADA de Origen',
        descripcion: 'Especifica el destino de una llamada entrante en base a la LADA del teléfono origen.',
        consideraciones: [
          { texto: 'Solo funciona para LADAs de México.', tipo: 'warning' },
          { texto: 'El desvío agrupa LADAs a nivel Estado. Ej: Celaya (461), Irapuato (462) y León (477) → Guanajuato.' },
        ],
      },
      {
        id: 'encuesta-calidad',
        titulo: 'Encuesta de Calidad de Atención',
        descripcion: 'Permite que quien llama evalúe la atención al final de la llamada. Respuestas: bien atendido (1) o mal atendido (2), más mensaje de retroalimentación.',
        utilidad: 'Si se recibe mala evaluación, permite tomar acciones inmediatas. Envía email al destino especificado.',
        funcionamiento: [
          'La extensión termina la atención e invita a permanecer en línea para la encuesta.',
          'Al colgar la extensión, la persona es enviada a la encuesta.',
          'Si no desea contestar, solo cuelga.',
        ],
        consideraciones: [
          { texto: 'La evaluación y retroalimentación se visualizan en el historial de llamadas.' },
        ],
      },
      {
        id: 'encuesta-sms',
        titulo: 'Enviar Encuesta vía SMS',
        descripcion: 'Funcionalidad pendiente de descripción.',
        badge: 'roto',
      },
      {
        id: 'prog-llamada-perdida',
        titulo: 'Programar Llamada Perdida a los 15 min',
        descripcion: 'Cuando una Extensión o Grupo pierde una llamada, se programa automáticamente una llamada saliente de retorno.',
        consideraciones: [
          { texto: 'Si la persona después se comunica o le llaman, aún así programa la llamada automática.', tipo: 'warning' },
          { texto: 'Se solicitará que bajo esa condición ya no se genere la llamada programada — pendiente.' },
        ],
      },
      {
        id: 'enlazar-ultimo',
        titulo: 'Enlazar Llamadas con su Último Ejecutivo',
        descripcion: 'Cuando se vuelve a recibir una llamada de un número que había marcado previamente, se canaliza directamente con quien le había atendido.',
        utilidad: 'Cuando se busca que las personas que llamen siempre sean atendidas por la misma persona, sin teclear opciones.',
        consideraciones: [
          { texto: 'Es nivel cuenta: aplica para todas las llamadas.', tipo: 'info' },
        ],
      },
      {
        id: 'enlazar-devuelta',
        titulo: 'Enlazar Llamada Devuelta con su Ejecutivo',
        descripcion: 'Si una extensión intenta comunicarse sin éxito y posteriormente esa persona regresa la llamada, se redirige con quien le estaba marcando.',
        utilidad: 'Enlaza una llamada devuelta directamente con quien intentó contactar a la persona.',
        consideraciones: [
          { texto: 'Es nivel cuenta: aplica para todas las llamadas.', tipo: 'info' },
        ],
      },
    ],
  },

  // ── CALL CENTER ──────────────────────────────────────────────────────────
  {
    id: 'callcenter', label: 'Call Center', color: '#06B6D4',
    articulos: [
      {
        id: 'panel-actividad',
        titulo: 'Panel de Actividad',
        descripcion: 'Sección en admin.callpicker.com que permite ver llamadas activas, estadísticas del día, consultar estatus y escuchar llamadas en curso.',
      },
      {
        id: 'fila-sip',
        titulo: 'Fila SIP (Queues)',
        descripcion: 'Crea filas de espera donde se especifican las extensiones pertenecientes. Las llamadas se asignan a las disponibles según el criterio de distribución.',
        ubicacion: 'Flujo > Fila SIP',
        subtitulos: [
          { titulo: 'Estrategias de distribución', items: [
            'Con menos llamadas contestadas.',
            'Con mayor tiempo sin recibir llamadas.',
            'Aleatoriamente.',
            'En orden específico.',
          ]},
        ],
        consideraciones: [
          { texto: 'Solo aplica a extensiones con conexión SIP; no funciona con PSTN.', tipo: 'warning' },
          { texto: 'No confundir con Grupos de Extensiones.', tipo: 'warning' },
        ],
      },
      {
        id: 'motivos-desconexion',
        titulo: 'Motivos de Desconexión',
        descripcion: 'Permite personalizar el motivo por el que una extensión se coloca como no disponible en my.callpicker.com (ej. comida, capacitación, vacaciones). El reporte se envía por correo al día siguiente.',
        consideraciones: [
          { texto: 'Falta incorporarlo a la App.', tipo: 'info' },
        ],
      },
      {
        id: 'campanas',
        pdfUrl: '/docs/Guía Campañas 2024.pdf',
        titulo: 'Campañas',
        descripcion: 'Módulo para cargar una base de teléfonos y generarles llamadas en un rango de tiempo establecido, ya sea para mensajes automáticos, enlazar con extensiones o agentes virtuales.',
        ubicacion: 'Flujo > Campañas',
      },
      {
        id: 'reportes-sla',
        titulo: 'Reportes SLA',
        descripcion: 'Reporte enviado por correo electrónico donde se define el horario de atención y umbral de tiempo (SLA). Permite filtrar por extensiones y troncales específicas.',
        ubicacion: 'Reportes > Envíos',
      },
    ],
  },

  // ── INFORMES ─────────────────────────────────────────────────────────────
  {
    id: 'informes', label: 'Informes', color: '#84CC16',
    articulos: [
      {
        id: 'panel-graficas',
        titulo: 'Panel de Gráficas',
        descripcion: 'Conjunto de gráficas predefinidas con información de llamadas y filtros aplicables.',
        ubicacion: 'Reportes > Insights',
        graficas: [
          'Llamadas Recibidas', 'Llamadas Recibidas por Número Telefónico',
          'Llamadas Recibidas desde Números Nuevos', 'Tiempo de Espera',
          'Llamadas Recibidas por Estado de la República', 'Llamadas Salientes por Estado de la República',
          'Llamadas Recibidas por Hora', 'Llamadas Recibidas por Día de la Semana',
          'Llamadas Recibidas por Día del Mes', 'Llamadas Recibidas por Extensión',
          'Duración Promedio de Llamadas', 'Duración Promedio de Llamadas Salientes',
          'Llamadas Salientes por Extensión', 'Llamadas Recibidas por Área',
          'Llamadas Recibidas por Área por Día del Mes', 'Llamadas Recibidas por Área por Hora',
          'Procedencia de Llamadas Recibidas', 'Destino de Llamadas de Salida',
          'Etiquetas de Llamadas', 'Llamadas Programadas de Salida',
          'Llamadas Evaluadas', 'Calificación de Llamadas Evaluadas',
        ],
        consideraciones: [
          { texto: 'Es común recibir reclamos de discrepancias entre gráficas e historial; se debe a que usan criterios diferentes ya que su finalidad es distinta.', tipo: 'info' },
        ],
      },
      {
        id: 'reportes-email',
        titulo: 'Reportes por Email',
        descripcion: 'Reportes enviados automáticamente vía email.',
        ubicacion: 'Reportes > Envíos',
        subtitulos: [
          { titulo: 'Reportes disponibles', items: [
            'Reporte gráfico mensual.',
            'Reporte diario de nuevos clientes y en seguimiento.',
            'Reporte diario de clientes no atendidos y con mala evaluación.',
            'Reporte de efectividad de llamadas salientes.',
            'Reporte de actividad por extensión.',
          ]},
        ],
      },
      {
        id: 'alerta-sms-perdida',
        titulo: 'Enviar Alerta de Llamada Perdida vía SMS',
        descripcion: 'Funcionalidad pendiente de descripción.',
        badge: 'roto',
      },
    ],
  },

  // ── IA & ASISTENTE VIRTUAL ───────────────────────────────────────────────
  {
    id: 'ia', label: 'IA & Asistente Virtual', color: '#F97316',
    articulos: [
      {
        id: 'agente-virtual',
        pdfUrl: '/docs/Callpicker_Agentes_Virtuales_OnePager_Confidencial.pdf',
        titulo: 'Agente Virtual de Voz',
        descripcion: 'Permite construir Agentes Virtuales para interactuar vía telefónica de manera conversacional. Puede consultar múltiples fuentes para obtener información y formular respuestas. Opera de forma nativa dentro del ecosistema Callpicker.',
        utilidad: 'Atención fuera de horario y disminución de llamadas atendidas por personas.',
        subtitulos: [
          { titulo: 'Funcionalidades disponibles', items: [
            'Transferencia a destinos Callpicker: extensiones, grupos, colas, guardias u otros destinos configurados.',
            'Activación del Agente Virtual solo en ciertos días y horarios.',
            'Extensiones del cliente pueden transferir llamadas hacia el Agente Virtual.',
            'Envío de mensajes vía WhatsApp mediante Callpicker Chat al terminar la llamada.',
            'Operación omnicanal entre voz, WhatsApp y mensajería unificada.',
            'Mejor trazabilidad sobre llamadas, transferencias, eventos y escalamiento humano.',
            'Continuidad operativa con rutas alternas, horarios, disponibilidad y reglas de negocio.',
          ]},
        ],
        consideraciones: [
          { texto: 'El costo del minuto varía dependiendo del modelo y voz elegida.', tipo: 'info' },
          { texto: 'Al operar de forma nativa, no requiere homologar protocolos, codecs, señalización ni comportamientos de carriers externos.', tipo: 'info' },
          { texto: 'Soporte centralizado: el cliente no triangula entre múltiples proveedores.', tipo: 'info' },
        ],
      },
      {
        id: 'agente-virtual-saldo-mxn',
        titulo: 'Cambio de Contador: Minutos → Saldo MXN en Agente Virtual de Voz',
        badge: 'nuevo',
        pdfUrl: '/docs/CAMBIO IMPORTANTE EN EL CONTADOR DE AGENTE VIRTUAL.pdf',
        descripcion: 'El consumo del Agente Virtual de Voz ahora se mide en saldo en pesos mexicanos (MXN) en lugar de minutos. Este cambio da mayor transparencia sobre el costo real por llamada, considerando que cada voz y modelo de procesamiento puede tener un precio diferente.',
        utilidad: 'Permite al cliente visualizar con precisión el impacto económico de cada configuración de su Agente Virtual y controlar mejor su inversión.',
        bloques: [
          { tipo: 'parrafo', texto: 'Hasta ahora, el consumo del Agente Virtual de Voz se mostraba en minutos dentro de la plataforma. Con la habilitación de distintas voces y modelos de procesamiento — cuyos costos pueden variar — el esquema basado únicamente en minutos ya no reflejaba con precisión el costo real del servicio.' },
          { tipo: 'seccion', titulo: '¿Qué cambia?' },
          { tipo: 'lista', items: [
            'El consumo del Agente Virtual de Voz ahora se mide en saldo en pesos mexicanos (MXN).',
            'El saldo se descuenta automáticamente conforme al uso y según las configuraciones seleccionadas (voz, modelo, duración, etc.).',
            'El consumo previo en minutos fue convertido automáticamente a saldo MXN — no se pierde el valor asignado.',
            'En los cargos recurrentes aparecerá el concepto: "Saldo de Agente Virtual de Voz".',
          ]},
          { tipo: 'seccion', titulo: 'Beneficios del cambio' },
          { tipo: 'lista', items: [
            'Mayor transparencia en el costo real por llamada.',
            'Mejor visibilidad del impacto de cada configuración (voz o modelo).',
            'Mayor control y previsibilidad en la inversión.',
          ]},
          { tipo: 'parrafo', texto: 'Este cambio no requiere ninguna acción por parte del cliente. El cambio ya está reflejado y aplicado en su cuenta.' },
          { tipo: 'cita', texto: 'Esta actualización no modifica la cantidad de minutos asignados mientras no se realicen cambios en la configuración del Agente Virtual.' },
          { tipo: 'firma', texto: 'Equipo Callpicker' },
        ],
        consideraciones: [
          { texto: 'El saldo en MXN varía según la voz y el modelo de procesamiento seleccionados. Configuraciones con modelos de mayor calidad consumen más saldo por minuto.', tipo: 'info' },
          { texto: 'El equipo de soporte puede orientar al cliente sobre cómo optimizar su configuración para maximizar el rendimiento del saldo asignado.', tipo: 'info' },
        ],
      },
      {
        id: 'ia-externa-protocolo',
        pdfUrl: '/docs/Callpicker_Agentes_Virtuales_OnePager_Confidencial.pdf',
        titulo: 'Protocolo: Cliente solicita integrar IA externa a Callpicker',
        badge: 'avanzado',
        descripcion: 'Cuando un cliente solicita conectar una plataforma de Agentes de IA de terceros (ej. Retell, Vapi, Bland, ElevenLabs, etc.) con Callpicker, se deben presentar primero los Agentes Virtuales nativos y, si el cliente insiste, iniciar el proceso formal de homologación.',
        utilidad: 'Guía interna para manejar correctamente la solicitud, evitar compromisos informales y proteger a Callpicker de responsabilidades sobre plataformas externas.',
        funcionamiento: [
          'Presentar primero la propuesta de Agentes Virtuales Callpicker nativos y sus ventajas (disponibilidad, soporte, costo, menor riesgo técnico).',
          'Si el cliente insiste en usar su plataforma externa, explicar que es necesario un proceso formal de integración.',
          'Iniciar con la sesión de Discovery y Homologación ($5,000 MXN, tomados a cuenta del desarrollo final si el proyecto avanza).',
          'Si el cliente desea una solución más rápida/económica, evaluar la opción de conexión vía SIP como extensión (alcance limitado, sin soporte garantizado sobre el tercero).',
          'En ambos casos, informar el costo operativo de $2 MXN por minuto por la interconexión.',
        ],
        modalidades: [
          {
            nombre: 'Agentes Virtuales Callpicker (Recomendado)',
            descripcion: 'Sin desarrollo de integración externo. Costo según plan contratado. Soporte incluido bajo alcance Callpicker. Menor riesgo técnico y operativo.',
          },
          {
            nombre: 'Integración externa homologada',
            descripcion: 'Discovery inicial de $5,000 MXN (tomado a cuenta del desarrollo final). Costo operativo: $2 MXN por minuto entrante y saliente. Soporte según alcance de integración acordado.',
          },
          {
            nombre: 'SIP como extensión (alcance limitado)',
            descripcion: 'Sin costo de desarrollo, salvo requerimientos especiales. Costo operativo: $2 MXN por minuto. Soporte limitado; diagnóstico especializado puede generar costo adicional.',
          },
        ],
        subtitulos: [
          { titulo: 'Áreas que se validan en el Discovery', items: [
            'Arquitectura — APIs, SIP, webhooks, eventos, conectividad, autenticación y seguridad.',
            'Flujo de llamadas — Entrantes, salientes, transferencias, colgado, reintentos, grabaciones y continuidad.',
            'Compatibilidad telefónica — Señalización, codecs, DTMF, SIP headers, RTP, NAT, TLS/SRTP, session timers y early media.',
            'Capacidades del tercero — Transferencias, latencia, concurrencia, disponibilidad, failover y manejo de errores.',
            'Soporte — Responsabilidades por proveedor, monitoreo, escalamiento, diagnóstico y mantenimiento.',
          ]},
          { titulo: 'Riesgos de conexión SIP no homologada', items: [
            'Compatibilidad SIP — El estándar implementado por el proveedor externo puede variar y no ser totalmente compatible.',
            'Autenticación — Callpicker no se hace responsable por mecanismos o restricciones de autenticación del tercero.',
            'Latencia y calidad — No se garantiza latencia, estabilidad ni calidad de audio extremo a extremo.',
            'Codecs — Puede haber incompatibilidad por codecs soportados, transcodificación o negociación de audio.',
            'DTMF — No se garantiza el correcto envío o recepción de tonos DTMF.',
            'Transferencias — Transferencias ciegas, asistidas, REFER, re-INVITE u otros métodos pueden no comportarse correctamente.',
            'Audio RTP / red — Problemas con NAT, firewalls, puertos RTP, jitter, pérdida de paquetes o audio unidireccional.',
            'Reportes y métricas — Las llamadas gestionadas por terceros pueden limitar visibilidad, trazabilidad y grabaciones.',
            'Continuidad — Fallas o indisponibilidad del tercero quedan fuera del control operativo de Callpicker.',
          ]},
        ],
        consideraciones: [
          { texto: 'Las conexiones SIP no homologadas formalmente no incluyen soporte estándar de Callpicker sobre el comportamiento del proveedor externo.', tipo: 'warning' },
          { texto: 'Cualquier diagnóstico, ajuste técnico, revisión de trazas o soporte especializado relacionado con la conexión externa podrá generar costos adicionales.', tipo: 'warning' },
          { texto: 'Callpicker no se hace responsable por fallas, incompatibilidades o incidencias originadas en la plataforma externa, carrier externo, red del cliente o proveedor tercero.', tipo: 'error' },
        ],
      },
      {
        id: 'transcripcion',
        titulo: 'Transcripción de Llamadas',
        descripcion: 'Genera un archivo TXT con la transcripción de la llamada (entrante o saliente), descargable desde el Historial de Llamadas.',
        consideraciones: [
          { texto: 'Con costo, se pueden hacer desarrollos para insertar transcripciones y análisis en otros sistemas.', tipo: 'info' },
        ],
      },
    ],
  },

  // ── DESARROLLADOR ────────────────────────────────────────────────────────
  {
    id: 'desarrollador', label: 'Desarrollador', color: '#8B5CF6',
    articulos: [
      {
        id: 'teams',
        titulo: 'Integración con Microsoft Teams',
        descripcion: 'Permite recibir y realizar llamadas vía Teams registradas y grabadas en Callpicker, además de transferencias.',
        consideraciones: [
          { texto: 'El cliente debe contar con el licenciamiento requerido de Microsoft.' },
          { texto: 'Requiere el plugin "Teams Phone Standard Add-on".' },
          { texto: 'El cliente debe tener acceso al "Microsoft 365 admin center" para la configuración.' },
        ],
      },
      {
        id: 'apis',
        titulo: 'APIs de Callpicker',
        descripcion: 'Conjunto de APIs para integrar Callpicker con otros sistemas.',
        apis: [
          { nombre: 'Dial API',     descripcion: 'Realiza llamadas entre destinos Callpicker (extensiones, grupos) y números de clientes.' },
          { nombre: 'Contacts API', descripcion: 'Agrega, actualiza, busca y elimina contactos.' },
          { nombre: 'ICN API',      descripcion: 'Consulta respuestas de ICN y realiza configuraciones.' },
          { nombre: 'Records API',  descripcion: 'Agrega, actualiza, busca y elimina audios de menú y Filas SIP.' },
          { nombre: 'Webhooks API', descripcion: 'Crea URLs de Webhooks para recibir eventos.' },
        ],
      },
      {
        id: 'webhooks',
        titulo: 'Webhooks',
        descripcion: 'Mecanismo que permite el envío de datos entre aplicaciones web al ocurrir un evento en Callpicker.',
        ubicacion: 'Desarrolladores > Destinos de eventos',
      },
      {
        id: 'historial-webhooks',
        titulo: 'Monitoreo y Reenvío de Webhooks',
        descripcion: 'Sección para consultar el historial de eventos y hacer reenvíos manuales.',
        ubicacion: 'Desarrolladores > Historial de eventos',
      },
    ],
  },

  // ── FUNCIONES OPERATIVAS ─────────────────────────────────────────────────
  {
    id: 'operativas', label: 'Funciones Operativas', color: '#14B8A6',
    articulos: [
      {
        id: 'regresar-autoatendidas',
        titulo: 'Regresar Llamadas Autoatendidas',
        descripcion: 'Si una llamada es colgada antes de canalizarse a una extensión (Autoatendida/abandonada), y posterior se tiene comunicación con ese número, el estatus cambia a Devuelta.',
        utilidad: 'Evitar contactar a alguien con quien ya se tuvo comunicación en listas de llamadas abandonadas.',
      },
      {
        id: 'anunciar-llamada',
        titulo: 'Anunciar Llamada a la Extensión',
        descripcion: 'Cuando la extensión contesta una llamada, escucha primero un audio predefinido antes de participar en la conversación.',
        utilidad: 'Avisar al agente que la llamada proviene de cierta cuenta o proyecto.',
      },
      {
        id: 'eleccion-troncal',
        titulo: 'Elección de Troncal de Salida',
        descripcion: 'Con múltiples números telefónicos, al realizar una llamada desde App o my.callpicker.com, permite elegir por cuál número salir (el que verá quien recibe la llamada).',
        consideraciones: [
          { texto: 'Si no se especifica, la llamada sale por la "mejor ruta", buscando un número de la misma LADA del destino marcado.' },
        ],
      },
      {
        id: 'enrutar-redirecciones',
        titulo: 'Enrutar Redirecciones por Troncal de Entrada',
        descripcion: 'Al recibir una llamada vía PSTN (celular/fijo) con redirección, hace que la llamada provenga del mismo número por el que entró.',
        utilidad: 'Con múltiples números para distintos propósitos, el agente puede distinguir el origen para mayor contexto.',
      },
    ],
  },

  // ── CHAT ─────────────────────────────────────────────────────────────────
  {
    id: 'chat', label: 'Chat', color: '#EC4899',
    articulos: [],
  },

  // ── SEGURIDAD ─────────────────────────────────────────────────────────────
  {
    id: 'seguridad', label: 'Seguridad', color: '#22D3EE',
    articulos: [
      {
        id: 'seguridad-datos',
        pdfUrl: '/docs/Seguridad Callpicker.pdf',
        titulo: 'Seguridad de Datos y Red',
        descripcion: 'Callpicker soporta TLS 1.2 para encriptar el tráfico de red entre la aplicación del cliente y los servidores. Para tráfico de voz se ofrecen múltiples opciones de cifrado.',
        subtitulos: [
          { titulo: 'Opciones de seguridad para tráfico de voz', items: [
            'WebRTC: señalización sobre TLS.',
            'SIP: TLS.',
            'VPN IPSEC: disponible para clientes que lo requieran.',
          ]},
          { titulo: 'Política de contraseñas (NIST SP 800-63-3)', items: [
            'Mínimo 8 caracteres alfanuméricos.',
            'Uso de caracteres especiales requerido.',
            'Verificación en 2 pasos (2FA) obligatoria para panel de administrador.',
            'Bloqueo de cuenta tras múltiples intentos fallidos.',
          ]},
        ],
        consideraciones: [
          { texto: 'Callpicker NO puede garantizar que todas las conexiones con operadores telefónicos estén encriptadas, debido a la naturaleza de las interconexiones telefónicas y la regulación vigente.', tipo: 'warning' },
        ],
      },
      {
        id: 'seguridad-audit',
        titulo: 'Registro de Auditoría (Audit Logging)',
        descripcion: 'El cliente tiene acceso al historial de actividad de su cuenta. Dependiendo del plan contratado, incluye registro de historial de señalización de llamadas y eventos, incluyendo intentos de acceso no autorizados.',
      },
      {
        id: 'seguridad-fisica',
        pdfUrl: '/docs/Seguridad Callpicker.pdf',
        titulo: 'Seguridad Física e Infraestructura',
        descripcion: 'La infraestructura de Callpicker se encuentra hospedada en Amazon Web Services (AWS) bajo controles de seguridad física certificados.',
        subtitulos: [
          { titulo: 'Certificaciones y cumplimiento', items: [
            'Compatible con PCI/DSS para Callpicker® Pay.',
            'Acceso web: SSL obligatorio SHA-256.',
            'Acceso API: SSL obligatorio SHA-256.',
            'Almacenamiento por bloques: Cifrado SHA-256.',
            'Almacenamiento por objetos: Cifrado SHA-256.',
          ]},
          { titulo: 'Subprocesadores', items: [
            'Amazon Web Services (EUA) — Hosting, almacenamiento, conectividad.',
            'Meta (EUA) — Conectividad con Messenger® y WhatsApp®.',
            'OpenAI (EUA) — Agente virtual, análisis y clasificación de interacciones.',
            'HubSpot (EUA) — Registro de llamadas e interacción con clientes.',
          ]},
        ],
        consideraciones: [
          { texto: 'Resolución de título de Concesión: P/IFT/210824/299.' },
          { texto: 'Aviso de privacidad: https://callpicker.com/aviso-de-privacidad.html', tipo: 'info' },
        ],
      },
    ],
  },

  // ── INTEGRACIONES ─────────────────────────────────────────────────────────
  {
    id: 'integraciones', label: 'Integraciones', color: '#A855F7',
    articulos: [
      {
        id: 'integraciones-hubspot',
        pdfUrl: '/docs/Listado de integraciones - Sheet1.pdf',
        titulo: 'HubSpot',
        descripcion: 'Tres modalidades de integración con HubSpot para marcación, registro y sincronización de contactos.',
        subtitulos: [
          { titulo: 'Integraciones disponibles', items: [
            'Marcación de llamadas y envío de WhatsApp — Realiza llamadas desde HubSpot con un clic; envía mensajes WhatsApp con plantillas precargadas.',
            'Registro de llamadas y creación de leads — Registra todas las llamadas (incluyendo audios) en el contacto correspondiente; crea lead nuevo si no existe el número.',
            'Sincronización de contactos HubSpot → Callpicker — Al crear un contacto en HubSpot, se registra automáticamente en Callpicker para identificar llamadas entrantes.',
          ]},
          { titulo: 'Variables de Callpicker requeridas', items: [
            'Customer ID · Teléfono(s) Callpicker · Extension ID · Extension Hash',
          ]},
        ],
      },
      {
        id: 'integraciones-zoho',
        pdfUrl: '/docs/Listado de integraciones - Sheet1.pdf',
        titulo: 'Zoho CRM',
        descripcion: 'Cuatro modalidades de integración con Zoho CRM para marcación automática, registro y apertura automática.',
        subtitulos: [
          { titulo: 'Integraciones disponibles', items: [
            'Auto call — Genera una llamada automática cuando un prospecto se registra en Zoho. Permite filtrar por origen (formulario, red social).',
            'Registro de llamadas y creación de leads — Registra todas las llamadas en Zoho; crea prospecto nuevo si no existe el número.',
            'Abrir Zoho automáticamente al recibir llamadas — La extensión de Chrome abre Zoho y muestra información del número que llamó.',
            'Llamada programada — Programa llamadas desde Zoho que se detonan en Callpicker.',
          ]},
          { titulo: 'Variables requeridas', items: [
            'Client ID · Client Secret · Customer ID · Extension ID · Extension Hash · *Habilitar Callpicker Dial API',
          ]},
        ],
      },
      {
        id: 'integraciones-otras',
        pdfUrl: '/docs/Listado de integraciones - Sheet1.pdf',
        titulo: 'Otras Integraciones CRM',
        descripcion: 'Callpicker se integra con múltiples plataformas además de HubSpot y Zoho.',
        subtitulos: [
          { titulo: 'Plataformas disponibles', items: [
            'Zendesk — Registro de llamadas + apertura automática con info del cliente al recibir una llamada.',
            'SalesForce — Registro de llamadas entrantes y salientes con audios; crea lead si no existe el número.',
            'Bitrix24 — Hacer y recibir llamadas desde Bitrix web, escritorio y móvil; registro y flujos configurables.',
            'Sirena App — Registro de llamadas con audios; crea lead automáticamente evitando duplicados.',
            'SalesUp — Registro de llamadas como seguimiento; crea prospecto nuevo con origen personalizable.',
            'AmoCRM — Registro de llamadas y sincronización de contactos; crea contacto+lead vinculados.',
            'Monday.com — Registra llamadas como items dentro del tablero especificado.',
            'Odoo — Registra llamadas como nota dentro de oportunidades.',
            'Active Campaign — Marcación desde Active Campaign; apertura automática al recibir llamada.',
            'Zapier — Marcación automática al crear un lead o al llenar un formulario.',
          ]},
        ],
        consideraciones: [
          { texto: 'Para Bitrix24 se requieren credenciales SIP (Servidor, Usuario, Contraseña).', tipo: 'info' },
          { texto: 'Para Zapier se requiere habilitar el uso de API y contar con Client ID, Client Secret, Extension IDs.', tipo: 'info' },
        ],
      },

      // ── Catálogo oficial 2026 ────────────────────────────────────────────
      // Fuente: "APIs e Integraciones Callpicker 2026.pdf". Cada alcance
      // conserva su URL de documentación oficial — la UI las vuelve clicables.
      {
        id: 'integraciones-catalogo-2026',
        pdfUrl: '/docs/APIs e Integraciones Callpicker 2026.pdf',
        badge: 'nuevo',
        titulo: 'Catálogo de Integraciones 2026',
        descripcion: 'Listado oficial de plataformas integradas con Callpicker, con el alcance exacto de cada flujo y su documentación. Es la referencia a citar cuando un cliente pregunta "¿se integra con…?".',
        utilidad: 'Responder con precisión qué hace y qué NO hace cada integración antes de comprometer un alcance con el cliente.',
        subtitulos: [
          { titulo: 'Zoho CRM', items: [
            'Todas las llamadas Callpicker se registran en Zoho: busca un registro con el número telefónico y anexa una nota con la información de la llamada. Si no encuentra registro, crea un nuevo Prospecto y lo asigna al usuario Zoho que corresponde con la extensión Callpicker. https://cutt.ly/sw0vfvKR',
          ]},
          { titulo: 'Zendesk', items: [
            'Registrar en Zendesk las llamadas entrantes y salientes de Callpicker como un ticket. https://cutt.ly/NemVlubQ',
          ]},
          { titulo: 'HubSpot', items: [
            '1. Registrar llamadas entrantes y salientes de Callpicker en HubSpot junto con los audios. https://cutt.ly/Beg00ci8',
            '2. Registrar los contactos de HubSpot en Callpicker para saber quién te llama. https://cutt.ly/ieHpUjcO',
            '3. Marcador (click2call): realizar llamadas salientes Callpicker desde HubSpot. https://cutt.ly/IeVRs8rr',
          ]},
          { titulo: 'Get Sirena', items: [
            'Las llamadas entrantes y salientes se registran en Get Sirena incluyendo los audios de las llamadas. https://cutt.ly/DeHpYwfe',
          ]},
          { titulo: 'Aastra y Mitel', items: [
            'Directorio de contactos Callpicker en teléfono IP. https://cutt.ly/ZF34uPM',
          ]},
          { titulo: 'Bitrix24', items: [
            'Hacer y recibir llamadas desde Bitrix24 web, aplicación de escritorio o aplicación móvil. Todas las llamadas se registran en Bitrix y los flujos de llamadas y audios se pueden configurar en Bitrix. https://cutt.ly/3vURDWi',
          ]},
          { titulo: 'Salesforce', items: [
            'Las llamadas entrantes y salientes se registran en Salesforce incluyendo los audios de las llamadas. https://cutt.ly/Teg2qUF7',
          ]},
          { titulo: 'Odoo', items: [
            '1. Marcación desde Odoo: permite efectuar llamadas Callpicker desde Odoo mediante la tecnología webRTC de Callpicker. https://cutt.ly/3eg2TSUY',
            '2. Las llamadas de Callpicker se registran como notas dentro de las oportunidades. https://cutt.ly/veepunf0',
          ]},
          { titulo: 'Zapier', items: [
            'Generar una llamada automáticamente desde Zapier. Útil para que, al recibir un lead en Zapier, se le marque de forma inmediata. https://cutt.ly/make_call',
          ]},
          { titulo: 'Upnify (antes SalesUP)', items: [
            'Las llamadas entrantes y salientes se registran en SalesUP incluyendo los audios de las llamadas. https://cutt.ly/MWhX8Yp',
          ]},
          { titulo: 'Kommo', items: [
            '1. Todas las llamadas de Callpicker se registran en Kommo. https://cutt.ly/IeiITWQB',
            '2. Sincronizar los contactos de Kommo con Callpicker para ver en Callpicker quién te llama, si ese contacto había sido previamente registrado en Kommo. https://cutt.ly/wwhqLnvP',
            '3. Click2call: realizar llamadas Callpicker desde el CRM de Kommo. https://cutt.ly/AeeoCZYr',
          ]},
          { titulo: 'Pipedrive (a través de Zapier)', items: [
            'Registrar como notas las llamadas dentro de las Personas. https://cutt.ly/fT6aRNy',
            'Crear nuevas Personas. https://cutt.ly/sO1nTB2',
            'Crear nuevos deals. https://cutt.ly/IwJAZq3V',
          ]},
          { titulo: 'Monday', items: [
            '1. Registrar las llamadas de Callpicker dentro de un tablero de Monday.com',
            '2. Click2call desde Monday',
          ]},
          { titulo: 'Zoho Desk', items: [
            'Creación de tickets en Zoho Desk a partir de llamadas Callpicker. Al ocurrir una llamada se registrará en Zoho Desk dentro de un ticket. Se puede elegir entre crear siempre un ticket o usar tickets abiertos (si existen).',
          ]},
          { titulo: 'Clientify', items: [
            'Registro de llamadas y creación de contactos (leads). https://cutt.ly/xeHpWGea',
          ]},
          { titulo: 'Microsoft Teams', items: [
            'Habilita llamadas entrantes y salientes a la red telefónica pública (PSTN) desde la aplicación de Microsoft Teams de cada usuario, mediante la infraestructura telefónica de Callpicker.',
          ]},
        ],
        consideraciones: [
          { texto: 'Aastra/Mitel, Bitrix24 y Microsoft Teams requieren revisión previa con el área comercial para cotización. No comprometer tiempos ni alcance con el cliente antes de esa revisión.', tipo: 'warning' },
          { texto: 'Zoho CRM: la asignación automática del Prospecto solo funciona si el nombre de la extensión en Callpicker es EXACTAMENTE el mismo nombre de usuario en Zoho. Es la causa más común de "las llamadas no se asignan a nadie".', tipo: 'warning' },
          { texto: 'Pipedrive no es una integración nativa: opera a través de Zapier, por lo que hereda los requisitos y límites de esa plataforma.', tipo: 'info' },
        ],
      },
      {
        id: 'integraciones-gohighlevel',
        badge: 'nuevo',
        linkUrl: 'https://callpicker.getoutline.com/s/d05de540-1737-4493-805a-2c1e2c35dddb',
        linkLabel: 'Documentación GoHighLevel',
        titulo: 'GoHighLevel',
        descripcion: 'Integración que mantiene al CRM del cliente como fuente única de verdad: crea contactos automáticamente y deja trazabilidad completa de cada llamada.',
        subtitulos: [
          { titulo: 'Alcances', items: [
            '1. Sincronización automática de leads — Cada vez que se genera una nueva llamada en Callpicker, se crea instantáneamente un nuevo Contacto en la subcuenta de GoHighLevel.',
            '2. Trazabilidad de llamadas — Cada llamada realizada o recibida queda registrada automáticamente. Como GHL no tiene un objeto nativo de "Llamadas" externo, el flujo se resuelve creando Notas detalladas dentro de la ficha del contacto, con duración, resultado y link a la grabación (si aplica).',
          ]},
        ],
        consideraciones: [
          { texto: 'GoHighLevel no cuenta con un objeto nativo de "Llamadas" para fuentes externas. Si el cliente espera ver un tab de llamadas como en HubSpot o Zoho, hay que alinear esa expectativa desde el inicio: la información vive en Notas dentro del contacto.', tipo: 'warning' },
        ],
      },
      {
        id: 'integraciones-apis-publicas',
        pdfUrl: '/docs/APIs e Integraciones Callpicker 2026.pdf',
        badge: 'nuevo',
        titulo: 'APIs Públicas Callpicker',
        descripcion: 'APIs abiertas para que el cliente construya su propia integración cuando no existe una nativa para su plataforma.',
        utilidad: 'Alternativa a proponer cuando el CRM del cliente no está en el catálogo de integraciones.',
        apis: [
          { nombre: 'ICN (Eventos)',      descripcion: 'Webhook o Push API. Por cada llamada entrante o saliente se genera un POST a una URL donde Callpicker notifica, al final de cada llamada, la información de la misma. https://api.callpicker.com/docs/icn.html' },
          { nombre: 'Marcación (Dial)',   descripcion: 'Dial API: realiza llamadas a través de tu cuenta Callpicker hacia PSTN. https://api.callpicker.com/docs/dial.html' },
          { nombre: 'Contactos',          descripcion: 'Operaciones de agregar, editar, actualizar y eliminar los contactos de Callpicker. https://api.callpicker.com/docs/contacts.html' },
          { nombre: 'Click to Call',      descripcion: 'Permite programar un objeto dentro de un sitio o herramienta para detonar llamadas mediante Callpicker. https://docs.google.com/document/u/0/d/e/2PACX-1vQLhTJ2EO744nBP4CdEUhLqapnOA6xHuUPkSa3q0RfPG-Lk6gJiDGehvAN3jc2XFKqpQ-BioHpIK1x7/pub?pli=1' },
          { nombre: 'Extensiones',        descripcion: 'Agrega, edita, actualiza y elimina extensiones. https://api.callpicker.com/docs/extensions.html' },
          { nombre: 'Redirecciones',      descripcion: 'Administra redirecciones en Callpicker fácilmente. https://api.callpicker.com/docs/redirections.html' },
          { nombre: 'Grupos de extensión',descripcion: 'Agrega, edita y elimina Grupos de extensión. https://api.callpicker.com/docs/ring_groups.html' },
        ],
      },
    ],
  },

  // ── CALLPICKER SAC ───────────────────────────────────────────────────────
  {
    id: 'callpicker-sac', label: 'Callpicker SAC', color: '#0057FF',
    articulos: [
      {
        id: 'cx-antes-de-sac',
        titulo: 'La Experiencia del Cliente Empieza Antes de que SAC Conteste.',
        descripcion: 'Reflexión estratégica para equipos de Customer Success: la experiencia del cliente es el resultado acumulado de decisiones internas que el cliente nunca ve, pero siempre siente.',
        badge: 'nuevo',
        bloques: [
          {
            tipo: 'parrafo',
            texto: 'Muchas organizaciones invierten en tecnología de voz, automatizan flujos y capacitan a sus equipos de atención. Y aun así, el cliente cancela. No porque el asesor haya fallado en la llamada, sino porque la experiencia ya estaba rota antes de que esa llamada ocurriera.',
          },
          {
            tipo: 'parrafo',
            texto: 'La percepción del cliente no nace en el ticket. Nace en la primera configuración que se hizo bien o mal. En si el agente virtual respondió con criterio o bloqueó la llamada. En si la factura reflejó lo que se prometió. En si alguien de la organización le ahorró un paso o le sumó uno.',
          },
          {
            tipo: 'cita',
            texto: 'La experiencia del cliente es el resultado acumulado de decisiones internas que el cliente nunca ve, pero siempre siente.',
          },
          {
            tipo: 'seccion',
            titulo: 'Lo que los datos confirman',
          },
          {
            tipo: 'parrafo',
            texto: 'Esto no es intuición de servicio. Tiene respaldo ejecutivo.',
          },
          {
            tipo: 'parrafo',
            texto: 'Bain & Company documentó que las empresas que sobresalen en experiencia del cliente crecen entre 4 % y 8 % por encima de su mercado. La razón es estructural: los clientes permanecen donde encuentran predictibilidad, confianza y resolución efectiva. No donde encuentran el precio más bajo.',
          },
          {
            tipo: 'parrafo',
            texto: 'El Zendesk CX Trends 2025, con base en más de 10,000 consumidores y líderes empresariales, confirma que las compañías con mejores resultados no eligen entre automatización y criterio humano: combinan ambos. La tecnología acelera; la confianza aparece cuando el cliente percibe que alguien entiende su contexto y actúa con responsabilidad.',
          },
          {
            tipo: 'parrafo',
            texto: 'En Callpicker, esa combinación ya existe como posibilidad. La pregunta es si se está ejecutando de forma coordinada o por partes.',
          },
          {
            tipo: 'seccion',
            titulo: 'Los factores que definen si la experiencia funciona o falla',
          },
          {
            tipo: 'parrafo',
            texto: 'Desde una perspectiva operativa, gestionar la experiencia del cliente en una plataforma de telefonía cloud exige revisar variables concretas:',
          },
          {
            tipo: 'lista',
            items: [
              'Tiempo de respuesta ante incidentes → ¿el cliente espera horas o recibe atención en minutos?',
              'Calidad del seguimiento → ¿los compromisos se cumplen o se repiten sin resolverse?',
              'Precisión de la información → ¿el cliente recibió lo que se le prometió en ventas, o SAC hereda una promesa que no puede sostener?',
              'Facilidad de contacto → ¿el cliente puede llegar a alguien con autoridad para resolver, o rebota entre áreas?',
              'Velocidad de recuperación ante errores → ¿la organización detecta la falla antes que el cliente, o el cliente es quien la reporta?',
            ],
          },
          {
            tipo: 'parrafo',
            texto: 'Cada uno de estos factores influye en una sola decisión: quedarse o irse.',
          },
          {
            tipo: 'seccion',
            titulo: 'Por qué esto no es solo un problema de SAC',
          },
          {
            tipo: 'parrafo',
            texto: 'Las empresas que construyen experiencias consistentes entienden que ningún equipo de atención puede compensar lo que otras áreas no hicieron bien.',
          },
          {
            tipo: 'parrafo',
            texto: 'En Callpicker, la lógica es la misma:',
          },
          {
            tipo: 'lista',
            items: [
              'Comercial vende una promesa.',
              'Implementación define si esa promesa arranca bien.',
              'Producto determina si la plataforma facilita o complica.',
              'Facturación decide si el cliente entiende lo que paga.',
              'SAC recibe todo lo anterior y tiene que sostenerlo en tiempo real.',
            ],
          },
          {
            tipo: 'parrafo',
            texto: 'Cuando estas piezas no están alineadas, SAC se convierte en el área que absorbe los errores del sistema. Cuando sí lo están, SAC se convierte en el área que consolida la confianza.',
          },
          {
            tipo: 'parrafo',
            texto: 'La experiencia del cliente no pertenece a un departamento. Es un sistema de gestión que alinea personas, procesos y decisiones alrededor de un objetivo común: facilitarle la vida al cliente.',
          },
          {
            tipo: 'seccion',
            titulo: 'La lectura de negocio',
          },
          {
            tipo: 'parrafo',
            texto: 'Las organizaciones que comprenden esta lógica dejan de competir únicamente por precio o por funcionalidades. Comienzan a diferenciarse por algo más difícil de copiar: la calidad con la que resuelven lo que realmente importa.',
          },
          {
            tipo: 'parrafo',
            texto: 'En un mercado donde los competidores pueden replicar características en meses, la experiencia del cliente es la ventaja que tarda años en construirse y que el cliente no cambia fácilmente.',
          },
          {
            tipo: 'cita',
            texto: 'Callpicker tiene la plataforma. Tiene los casos. Tiene el equipo. Lo que esta herramienta construye es el sistema que los conecta.',
          },
          {
            tipo: 'firma',
            texto: 'Dirección de experiencia al cliente.',
          },
        ],
      },
    ],
  },

  // ── SOPORTE ───────────────────────────────────────────────────────────────
  {
    id: 'soporte', label: 'Soporte', color: '#F97316',
    articulos: [
      {
        id: 'ticket-a-nombre-cliente',
        titulo: 'Levantar un Ticket a Nombre del Cliente',
        badge: 'nuevo',
        descripcion: 'Cuando el ticket se levanta desde el correo del equipo, el titular queda registrado como interno en lugar del cliente. Dos métodos para registrar al cliente como titular desde el inicio.',
        linkUrl: 'https://forms.zohopublic.com/jadelriogdig1/form/Nuevoticket/formperma/NujUVJ5Mw5WyeXRaoEgXuEHx0OfZNBhozp_D8WfGSXs',
        linkLabel: 'Abrir formulario Zoho',
        bloques: [
          {
            tipo: 'seccion',
            titulo: 'Método 1 — Formulario directo',
          },
          {
            tipo: 'parrafo',
            texto: 'Usa el formulario habilitado para levantar el ticket directamente a nombre del cliente, sin tener que hacer ajustes posteriores en Zoho Desk. El enlace al formulario también está disponible en la sección de Marcadores.',
          },
          {
            tipo: 'seccion',
            titulo: 'Método 2 — Reenvío de correo con etiqueta',
          },
          {
            tipo: 'parrafo',
            texto: 'Si recibes un correo del cliente y lo quieres reenviar a ayuda@callpicker.com para su atención, agrega la siguiente línea al inicio del cuerpo del correo antes de enviarlo:',
          },
          {
            tipo: 'codigo',
            texto: '#original_sender {correo@cliente.com}',
          },
          {
            tipo: 'parrafo',
            texto: 'Sustituye correo@cliente.com por la dirección real del cliente. Zoho Desk detecta la etiqueta automáticamente y asigna al contacto correcto como titular del ticket.',
          },
        ],
        consideraciones: [
          { texto: 'La etiqueta #original_sender debe ir en la primera línea del cuerpo del correo, antes de cualquier otro texto.', tipo: 'warning' },
          { texto: 'El formulario también está disponible en el tab "🎫 Nuevo Ticket" dentro del módulo de Tickets del dashboard.', tipo: 'info' },
        ],
      },
      {
        id: 'ticket-automatico',
        titulo: 'Generación automática de Ticket al hacer/recibir una llamada',
        badge: 'nuevo',
        descripcion: 'Alineando a tener un mejor registro del tiempo. Cuando origen o destino de una llamada corresponde a alguno de los DIDs listados, se genera automáticamente un ticket en Zoho Desk.',
        subtitulos: [
          {
            titulo: 'DIDs con esta funcionalidad activa',
            items: [
              '5550180649 — Funcionalidad Premium',
              '5550220001 — Soporte CDMX',
              '4421610188 — Soporte QRO',
              '5512070510 — CDMX',
              '5550118919 — Soporte chat',
            ],
          },
        ],
        funcionamiento: [
          'Cuando se recibe o se hace una llamada a un teléfono cuyo contacto está asociado a un correo.',
          'Cuando se recibe o se hace una llamada a un teléfono que no tiene un correo asociado.',
        ],
        consideraciones: [
          { texto: 'Se agregó una regla para que no lleguen avisos de apertura/cierre de dichos tickets.' },
          { texto: 'Se establece automáticamente que el canal del ticket es Phone.' },
          { texto: 'Manualmente en ese ticket hay que registrar la entrada de tiempo.', tipo: 'error' },
          { texto: 'Para que la llamada se asigne correctamente al Agente, el nombre de la extensión en Callpicker Conmutador debe ser idéntico al nombre del agente en Zoho Desk. No editen su nombre en el conmutador.', tipo: 'error' },
        ],
      },
    ],
  },

  // ── COBERTURA Y DIDS ──────────────────────────────────────────────────────
  {
    id: 'cobertura', label: 'Cobertura y DIDs', color: '#F59E0B',
    articulos: [
      {
        id: 'cobertura-mexico',
        pdfUrl: '/docs/Callpicker - Cobertura de Números Telefónicos - cobertura.pdf',
        titulo: 'Cobertura de Números en México',
        descripcion: 'Callpicker ofrece numeración fija en las principales ciudades de la República Mexicana. La activación y renta estándar es de $250 MXN por número.',
        subtitulos: [
          { titulo: 'Cobertura por estado (principales ciudades)', items: [
            'Aguascalientes — Aguascalientes (449), Rincón de Romos (465), Calvillo (495)',
            'Baja California — Tijuana (664), Mexicali (686), Ensenada (646), Rosarito (661), Tecate (665)',
            'Chihuahua — Chihuahua (614), Juárez (656), Parral (627), Cuauhtémoc (625)',
            'Coahuila — Saltillo (844), Torreón (871), Monclova (866), Piedras Negras (878)',
            'Guanajuato — León (477), Celaya (461), Irapuato (462), Guanajuato (473), Salamanca (464)',
            'Jalisco — Guadalajara (33), Puerto Vallarta (322), Lagos de Moreno (474)',
            'Nuevo León — Monterrey (81), Monterrey área (81)',
            'Querétaro — Santiago de Querétaro (442), San Juan del Río (427)',
            'Quintana Roo — Cancún (998), Playa del Carmen (984), Tulum (984), Chetumal (983)',
            'Sonora — Hermosillo (662), Nogales (631), Guaymas (622), Ciudad Obregón (644)',
            'Tamaulipas — Tampico (833), Reynosa (899), Matamoros (868), Nuevo Laredo (867)',
            'Veracruz — Veracruz (229), Xalapa (228), Coatzacoalcos (921), Orizaba (272)',
            'CDMX — Ciudad de México (55)',
            'Yucatán — Mérida (999)',
            'Y muchos más estados: Campeche, Chiapas, Colima, Durango, Guerrero, Hidalgo, Michoacán, Morelos, Nayarit, Oaxaca, Puebla, San Luis Potosí, Sinaloa, Tabasco, Tlaxcala, Zacatecas',
          ]},
        ],
        consideraciones: [
          { texto: 'Los números 800 solo permiten recibir llamadas, no realizar.', tipo: 'warning' },
          { texto: 'No se pueden incorporar números celulares como troncal de entrada o salida.' },
          { texto: 'Se aceptan portabilidades de números fijos nacionales cumpliendo los requisitos indicados.' },
        ],
      },
      {
        id: 'dids-internacionales',
        pdfUrl: '/docs/DIDs Internacionales - Costos DID Internacionales.pdf',
        titulo: 'DIDs Internacionales — Precios y Cobertura',
        descripcion: 'Callpicker ofrece numeración en más de 60 países con disponibilidad de líneas locales, números nacionales, móviles y líneas 800/toll-free. Todos los precios están en MXN.',
        subtitulos: [
          { titulo: 'América Latina y el Caribe', items: [
            'Argentina — Buenos Aires y 20+ ciudades · $250 activación / $250 renta · Toll-free $1,400 / $550',
            'Brasil — São Paulo, Río y 30+ ciudades · $250 / $250 · Toll-free $300 / $300',
            'Chile — Santiago, Valparaíso y 15+ ciudades · $250 / $250 · Toll-free $450 / $450',
            'Colombia — Bogotá, Medellín, Cali, Barranquilla · $450 / $450 · Toll-free $1,000 / $350',
            'México — Cobertura nacional · $250 / $250 · Toll-free $250 / $250',
            'Panamá — $300 / $300 · Toll-free $600 / $600',
            'Perú — Lima y 5 ciudades · $250 / $250',
            'Venezuela — Caracas y 14 ciudades · $450 / $450',
            'Guatemala, El Salvador, Ecuador, Nicaragua, Paraguay, Uruguay — disponibles',
            'Rep. Dominicana, Puerto Rico — disponibles',
          ]},
          { titulo: 'América del Norte', items: [
            'Estados Unidos — 500+ ciudades · $200 / $200 · Toll-free (800/888/877/866/855/844/833) $200 / $200',
            'Nota: Nueva York (212/718) y otras ciudades premium · $3,200 activación / $800 renta',
            'Canadá — 400+ ciudades · $200 / $200 · Toll-free $200 / $200',
            'Nota: Toronto (416) · $3,200 activación / $800 renta',
          ]},
          { titulo: 'Europa', items: [
            'España — Madrid, Barcelona y 50+ ciudades · $200 / $200 · Toll-free $250 / $250',
            'Francia — París, Lyon y ciudades principales · $200 / $200',
            'Alemania — Berlín, Múnich y 100+ ciudades · $200 / $200 · Toll-free $2,700 / $200',
            'Italia — Roma, Milán y 200+ ciudades · $200 / $200 · Toll-free $200 / $200',
            'Reino Unido — Londres y 500+ ciudades · $200 / $200 · Toll-free $200 / $200',
            'Nota: Londres (207) · $3,200 activación / $800 renta',
            'Portugal, Bélgica, Holanda, Suiza, Polonia, Suecia, Noruega, otros países europeos — disponibles',
          ]},
          { titulo: 'Asia, Oceanía y África', items: [
            'Australia — Sydney, Melbourne y 25+ ciudades · $200 / $200 · Toll-free $2,000 / $350',
            'China — Shanghai, Beijing · $600 / $600',
            'Japón — Tokio, Osaka y 5 ciudades · $250 / $250 · Toll-free $750 / $850',
            'Hong Kong, Singapur, India, Tailandia, Indonesia, Vietnam — disponibles',
            'Israel, Emiratos Árabes, Arabia Saudita, Kenia, Uganda, Sudáfrica, Ghana — disponibles',
          ]},
        ],
        consideraciones: [
          { texto: 'Todos los DIDs internacionales incluyen 2 canales de voz estándar (salvo los metered/300 canales para toll-free).', tipo: 'info' },
          { texto: 'Los números Metered (ej. Filipinas, Alemania national) incluyen 300 canales con costo por uso.', tipo: 'info' },
          { texto: 'Para consultar precios de un país específico o solicitar un DID, contactar al equipo de soporte.', tipo: 'info' },
          { texto: 'Los números toll-free 800 solo reciben llamadas; no permiten marcar salientes.', tipo: 'warning' },
        ],
      },
    ],
  },

  // ── ASISTENTE VIRTUAL — REPORTERÍA ───────────────────────────────────────
  {
    id: 'asistente-virtual', label: 'Asistente Virtual', color: '#0D9488',
    articulos: [

      // ── 1. ¿Qué es? ──────────────────────────────────────────────────────
      {
        id: 'av-que-es',
        titulo: '¿Qué son los Reportes Semanales de Agentes Virtuales de Voz?',
        descripcion: 'Automatización que genera cada lunes un reporte de desempeño semanal (lun–dom, Ciudad de México) para cada agente virtual activo, considerando hasta 300 llamadas por reporte.',
        bloques: [
          {
            tipo: 'parrafo',
            texto: 'El sistema corre solo, sin intervención manual. Los reportes aparecen en el dashboard del agente y pueden compartirse con un enlace público.',
          },
          { tipo: 'seccion', titulo: 'Secciones de métricas que incluye' },
          {
            tipo: 'lista',
            items: [
              '🤖 Insights (Avanzado) — Las intenciones y desenlaces más frecuentes.',
              '📞 Disposición (Básico) — Indicadores operativos: duración, latencia, uso de herramientas.',
              '🤖 Calidad de las Conversaciones (Avanzado) — Sentimiento, resolución, adherencia al prompt, entre otras.',
            ],
          },
          { tipo: 'seccion', titulo: 'Tipos de reporte' },
        ],
        modalidades: [
          {
            nombre: 'Básico 📞 — Sin costo ($)',
            descripcion: 'Resumen general + indicadores operativos de los sistemas. Sin evaluación de IA.',
          },
          {
            nombre: 'Avanzado 🤖 — Con costo ($)',
            descripcion: 'Todo lo del Básico + calidad de conversación e Insights generados por IA.',
          },
        ],
        consideraciones: [
          { texto: 'URL de ejemplo de un reporte: https://connectors.callpicker.com/integrations/virtual_agents_reports/r/{id-del-reporte}/', tipo: 'info' },
          { texto: 'Revisar que la URL contenga /integrations, /r y el identificador del reporte escrito correctamente.', tipo: 'warning' },
        ],
      },

      // ── 2. Alta de agente ─────────────────────────────────────────────────
      {
        id: 'av-alta',
        titulo: 'Dar de Alta un Agente en Reportería',
        descripcion: 'Proceso para que un agente comience a generar reportes semanales. Se hace desde un formulario interno de dos pasos a prueba de errores.',
        linkUrl: 'https://n8nw.connectors.callpicker.com/form/a8e04b74-e62b-47fb-aca9-d4c3beceb1bb',
        linkLabel: 'Abrir formulario de alta',
        funcionamiento: [
          'Ingresar el Customer ID → el sistema lista los agentes de la cuenta que aún NO tienen reportería activa (los ya dados de alta no aparecen para evitar duplicados).',
          'Elegir el Agente del desplegable (formato "ID - Nombre", ej. "1203 - AV Ventas") y el Tipo de reporte (Básico / Avanzado).',
          'Enviar el formulario.',
        ],
        subtitulos: [
          {
            titulo: 'Verificación tras el alta',
            items: [
              'Abrir la vista de credenciales: https://connectors.callpicker.com/integrations/virtual_agents_reports/credentials',
              'Iniciar sesión con las credenciales del cliente (Client ID y Secret ID de la API de Callpicker).',
              'Confirmar que el agente recién dado de alta aparece en el listado de Agentes con reportería semanal activa.',
              'Si aún no ha corrido ningún corte, es normal que no haya datos: se verá poblado tras el próximo corte semanal o tras lanzar un reporte manual.',
            ],
          },
        ],
      },

      // ── 3. Reporte manual ─────────────────────────────────────────────────
      {
        id: 'av-reporte-manual',
        titulo: 'Lanzar un Reporte Manual o Histórico',
        descripcion: 'Para casos como "quiero el reporte de las semanas de febrero 2026" o "reprocesa la semana pasada". Se hace desde un formulario interno.',
        linkUrl: 'https://n8nw.connectors.callpicker.com/form/1d42a863-1a3f-4858-a1ac-06f3d26b4066',
        linkLabel: 'Abrir formulario de reporte manual',
        funcionamiento: [
          'Ingresar el Customer ID.',
          'El sistema busca los agentes de esa cuenta con reportería activa.',
          'Elegir el Agente del desplegable (formato "ID - Nombre"; solo aparecen los agentes con reportería activa).',
          'Ingresar la Fecha de Inicio y la Fecha de Fin del periodo que se quiere cubrir.',
          'Enviar: aparecerá una confirmación en segundos.',
        ],
        consideraciones: [
          { texto: 'El reporte siempre cierra en domingo. Si el rango incluye varios domingos, se genera un reporte por cada uno.', tipo: 'info' },
          { texto: 'Ejemplo: del 1 al 28 de febrero 2026 genera ~4 reportes (uno por semana). Para una sola semana, pon cualquier rango que incluya un único domingo.', tipo: 'info' },
          { texto: 'El rango no puede exceder 31 días y debe incluir al menos un domingo.', tipo: 'warning' },
          { texto: 'Cada reporte puede tardar entre 1 y 35 minutos en generarse en segundo plano (depende del número de llamadas). No es necesario mantener la ventana abierta.', tipo: 'info' },
          { texto: 'Es seguro reprocesar: volver a correr una semana sobrescribe el reporte anterior, no lo duplica.', tipo: 'info' },
        ],
      },

      // ── 4. Leer el dashboard ──────────────────────────────────────────────
      {
        id: 'av-dashboard',
        titulo: 'Cómo leer el Dashboard de un Reporte',
        descripcion: 'El reporte abre con un encabezado y una barra de totales siempre visible, seguidos de contenedores desplegables. Un reporte Básico muestra solo Resumen General; uno Avanzado añade Insights y Calidad de Conversaciones.',
        subtitulos: [
          {
            titulo: '💼 Encabezado del reporte',
            items: [
              'Agente y modelo evaluado.',
              'Periodo de la semana (lunes–domingo).',
              'Tipo de reporte (Básico / Avanzado) y arquitectura del agente.',
            ],
          },
          {
            titulo: '📅 Barra de fechas (línea del tiempo)',
            items: [
              'Cada punto es una semana, marcado con su fecha y agrupado por mes; el punto resaltado es la semana activa.',
              'Las flechas llevan a semanas más recientes o más antiguas.',
              'Al hacer clic en una semana, todo el reporte se actualiza a ese periodo.',
            ],
          },
          {
            titulo: '📊 Barra de totales (fija al hacer scroll)',
            items: [
              'Total llamadas — todas las del periodo.',
              'Atendidas — con interacción real; es la base para calidad e insights.',
              'Sin interacción — buzón de voz, contestadora o sin audio captado.',
              'Duración prom. — de las llamadas atendidas.',
            ],
          },
          {
            titulo: '💡 Insights — Hallazgos (solo Avanzado)',
            items: [
              'Motivos de Llamada: ranking de por qué llamó la gente, con % y nivel de resolución (al pasar el cursor por la "i").',
              '¿Qué lograron las llamadas?: ranking de desenlaces (cotización entregada, cita agendada, transferencia a asesor, etc.).',
              'Aspectos destacados: lo más relevante del periodo, redactado para el cliente.',
            ],
          },
          {
            titulo: '📊 Resumen General (siempre visible)',
            items: [
              'Procesamiento de Llamadas — Disposición: Contenidas (el Agente las llevó hasta el final), Transferidas (en vivo a persona) y Abandonadas (cortadas por inactividad).',
              'Duración: promedio general, promedio de atendidas y la más larga.',
              'Latencia del agente: TTFA (qué tan rápido empieza a hablar), LLM p50 y ejecución de herramientas en ms (más bajo es mejor).',
              'Uso de herramientas: cuántas usa por llamada y, por herramienta, % de conversaciones en que se usó y veces en promedio.',
            ],
          },
          {
            titulo: '💬 Calidad de Conversaciones (solo Avanzado)',
            items: [
              'Puntajes: Adherencia al prompt (1–5) y Calidad de Conversación (1–5).',
              'Tasas de desempeño: Flujo correcto, Intención resuelta e Información no verificable.',
              'Sentimiento y resolución: Trayectoria de sentimiento (mejoró / se mantuvo / se deterioró) y Resolución (Resuelto / No resuelto / Inconcluso).',
              'Casi cada métrica tiene un ícono "i": pásale el cursor para ver su definición dentro del propio dashboard.',
            ],
          },
        ],
        consideraciones: [
          { texto: 'La evaluación de Calidad es generada por IA: los indicadores son orientativos para una lectura cualitativa, complementables con auditoría manual.', tipo: 'warning' },
        ],
      },

      // ── 5. FAQ ────────────────────────────────────────────────────────────
      {
        id: 'av-faq',
        titulo: 'Preguntas Frecuentes',
        descripcion: 'Respuestas a las dudas más comunes sobre la reportería de Agentes Virtuales de Voz.',
        subtitulos: [
          {
            titulo: 'Preguntas y respuestas',
            items: [
              '¿Qué tan atrás puedo pedir histórico? → Hasta donde haya datos en Retell y Callpicker. Si una semana muy antigua sale vacía, probablemente ya no hay registro de esas llamadas.',
              'Una semana salió con 0 llamadas, ¿es un error? → No. Una semana sin llamadas se guarda igual y el dashboard muestra "sin llamadas en el periodo". Es un resultado válido, no una falla.',
              'Reprocesé una semana y cambiaron algunos números. ¿Por qué? → Normal: la evaluación de IA puede variar ligeramente entre corridas, y un reproceso puede capturar más llamadas. El reporte se sobrescribe con el más reciente.',
              '¿A quién acudo si un reporte no aparece tras ~15 minutos? → Al equipo técnico, con el Customer ID, Agent ID y el domingo (fecha de cierre) del reporte.',
            ],
          },
        ],
      },

    ],
  },
]
