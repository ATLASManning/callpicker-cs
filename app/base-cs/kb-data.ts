// ── Base de Conocimiento CS — Datos ──────────────────────────────────────────
// Añadir nuevos artículos aquí sin tocar la UI

export interface Consideracion { texto: string; tipo?: 'warning' | 'info' | 'error' }
export interface TarificacionFila { tipo: string; destino?: string; regla: string; nivel: 'green' | 'amber' | 'red' }
export interface Modalidad { nombre: string; descripcion: string }
export interface ApiItem   { nombre: string; descripcion: string }

export interface Articulo {
  id:             string
  pdfUrl?:        string   // ruta relativa a /public, p.ej. "/docs/archivo.pdf"
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
        titulo: 'Agente Virtual de Voz',
        descripcion: 'Permite construir Agentes Virtuales para interactuar vía telefónica de manera conversacional. Puede consultar múltiples fuentes para obtener información y formular respuestas.',
        utilidad: 'Atención fuera de horario y disminución de llamadas atendidas por personas.',
        consideraciones: [
          { texto: 'El costo del minuto varía dependiendo del modelo y voz elegida.', tipo: 'info' },
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
    ],
  },

  // ── SOPORTE ───────────────────────────────────────────────────────────────
  {
    id: 'soporte', label: 'Soporte', color: '#F97316',
    articulos: [
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
]
