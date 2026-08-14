import type { AuditoriaCase } from './types'

export const JASON_DE_MEXICO: AuditoriaCase = {
  id:     'jason-de-mexico',
  asesor: 'Dan',

  nombre:               'Jason de México',
  sector:               'Logística / Distribución industrial · Mangueras y componentes industriales (Grupo AMMEGA)',
  fecha_periodo:        '02 ene – 14 ago 2026',
  fecha_auditoria:      'Ago 2026',
  tipo_cliente:         'VIP · CID 135582 · Consecutivo D7 · 25 Ext. Visibilidad y Control Ilimitado · MRR $17,225',
  descripcion_contexto: 'Reporte de Análisis de Llamadas · 1,778 registros · Alerta de continuidad en curso · Ticket #113092',
  estado:               'en_riesgo',
  clasificacion:        'CONFIDENCIAL',
  version:              '1.0',

  /* ── KPIs ─────────────────────────────────────────────────────── */
  kpis: [
    { label: 'Llamadas entrantes (7.4 meses)', value: '1,778',        color: '#6366f1' },
    { label: 'Tasa de contestación',           value: '85.0%',        color: '#22c55e' },
    { label: 'Concentración pérdida (1 agente)', value: '24.6%',      color: '#ef4444' },
    { label: 'MRR en riesgo',                  value: '$17,225/mes',  color: '#f59e0b' },
  ],

  /* ── Resumen ejecutivo ────────────────────────────────────────── */
  resumen_ejecutivo: 'Jason de México (CID 135582), distribuidor de mangueras y componentes industriales del grupo AMMEGA, es cliente de Callpicker desde febrero de 2023. El 13 de agosto de 2026 abrió el ticket #113092 de revisión de continuidad, motivado por centralización de decisiones de TI desde la matriz corporativa en Europa. Tras la reunión del 14 de agosto con Gaboxtec Mu, se confirmó que no es una baja formalizada — es una evaluación de proveedor con fecha límite operativa clara (corte del 4 de septiembre).\n\nEl propio cliente confirmó en la reunión que el servicio "ha funcionado correctamente y de manera estable", con un volumen de 190 a 220 llamadas contestadas al mes. El análisis del CDR valida esa percepción: el promedio real de llamadas contestadas en meses completos es de 206/mes — exactamente dentro del rango que el cliente citó de memoria.\n\nHallazgo más relevante: el Health Score de 95/100 no anticipó ni reflejó el riesgo de cancelación. Esto no es un defecto del cliente — es una brecha metodológica del score, que pondera indicadores administrativos pero no captura riesgo estructural (fusiones, centralizaciones, decisiones de TI tomadas fuera del país).\n\nLa operación de llamadas, en cambio, no respalda una narrativa de insatisfacción por servicio: 85.0% contestadas, 7.2% de pérdida general, solo 2 tickets en más de tres años. El problema no es operativo. Es corporativo.',

  resultado_positivo: 'El cliente confirmó en reunión que el servicio funciona correctamente. Ventana de retención abierta hasta el 4 de septiembre. Reunión de seguimiento ya agendada para el martes próximo. Integración con Salesforce confirmada como necesidad concreta en la reunión del 14 de agosto — propuesta de retención lista para presentar. 74.8% del tráfico es de contactos recurrentes, argumento de continuidad operativa sólido.',

  hallazgos: [
    'Health Score de 95/100 no predijo la solicitud de cancelación — el score actual mide cumplimiento administrativo, no riesgo estructural corporativo.',
    'El agente Juan Pablo Matías recibió 114 llamadas y perdió 28 (24.6%), una tasa 3.4× superior al promedio de la cuenta (7.2%). Referencia: Misael Salas, 459 llamadas con solo 0.9% de pérdida.',
    'El archivo de llamadas cubre solo una línea Callpicker — (55) 89-50-62-54 — que coincide con el teléfono del Director de cuenta. No hay certeza sobre el comportamiento de las 25 extensiones restantes contratadas.',
    'Cero adopción registrada en CRM de cualquier módulo adicional en 3 años: Chat, IA de Voz, IA de Chat, Integración API, Pago Automático, Panel Administrador — la cuenta nunca fue expandida ni profundizada.',
    'Un número (55 1452 5766) generó 147 llamadas = 8.3% del tráfico total, con 96.6% de contestación. Su identidad no fue posible confirmar — puede ser un cliente o proveedor clave.',
    '74.8% del tráfico proviene de contactos recurrentes (188 números con ≥3 llamadas), lo que indica una base de clientes/proveedores que depende de esta línea para coordinación logística industrial.',
    'Gaboxtec Mu (gaboxtec@gmail.com), interlocutor de la reunión del 14 ago, no es el contacto Director registrado en CRM (Luis Armando Durán Rejón, @ammega.com). Su nivel real de autoridad de decisión debe ser confirmado por Dan.',
  ],

  /* ── Cronología ───────────────────────────────────────────────── */
  cronologia: [
    { fecha: 'Feb 2023',    responsable: 'Dan Domínguez',    evento: 'Inicio de la relación. Plan 25 Extensiones Visibilidad y Control Ilimitado a $17,225/mes.', tipo: 'ok' },
    { fecha: '2024',        responsable: 'Dan Domínguez',    evento: 'Actividad saliente se detiene completamente. Cuenta opera 100% inbound desde este punto.', tipo: 'neutral' },
    { fecha: '13 Ago 2026', responsable: 'Jason de México',  evento: 'Apertura del Ticket Zoho Desk #113092 — solicitud de revisión de continuidad por centralización corporativa.', tipo: 'problema' },
    { fecha: '14 Ago 2026', responsable: 'Dan Domínguez',    evento: 'Reunión con Gaboxtec Mu (Gaboxtec): no es cancelación formalizada — es evaluación de proveedor por decisión corporativa. Gaboxtec confirma integración Salesforce como necesidad. Ventana: corte del 4 sep; portabilidad requiere 15 días de aviso, sin penalización.', tipo: 'pivote' },
    { fecha: 'Mar 2026',    responsable: 'Sistema',           evento: 'Seguimiento programado: reunión con Gaboxtec Mu / Dan. Propuesta de retención debe presentarse antes de este contacto.', tipo: 'neutral' },
    { fecha: '4 Sep 2026',  responsable: 'Jason de México',  evento: 'Fecha límite operativa de corte. Portabilidad requiere 15 días de aviso previo. Ventana de retención cierra antes de esta fecha.', tipo: 'problema' },
  ],

  /* ── Perfil del cliente ──────────────────────────────────────── */
  perfil_campos: [
    { label: 'Razón social',         value: 'Jason de México S.A. de C.V.' },
    { label: 'Grupo corporativo',     value: 'AMMEGA (matriz en Países Bajos / Partners Group)' },
    { label: 'Sector',                value: 'Distribución industrial — mangueras y componentes hidráulicos' },
    { label: 'Plan contratado',       value: '25 Extensiones Visibilidad y Control Ilimitado · MRR $17,225' },
    { label: 'CID Zoho Desk',         value: '135582' },
    { label: 'Consecutivo',           value: 'D7' },
    { label: 'Antigüedad',            value: 'Cliente desde febrero de 2023 (3+ años)' },
    { label: 'Director de cuenta CRM', value: 'Luis Armando Durán Rejón · armando.duran@ammega.com' },
    { label: 'Interlocutor reunión',  value: 'Gaboxtec Mu · gaboxtec@gmail.com (rol a confirmar)' },
    { label: 'KAM Callpicker',        value: 'Dan Domínguez' },
    { label: 'Historial de pagos',    value: 'Perfecto — sin incidencias registradas' },
    { label: 'Tickets de soporte',    value: '2 tickets en +3 años de relación (carga mínima)' },
  ],

  necesidad_negocio: 'Centro de recepción de llamadas industrial puro: 100% inbound, 13 agentes/colas, coordinación logística con base estable de clientes y proveedores recurrentes. La cuenta no usa la línea para prospección ni ventas salientes — es un canal de operación, no de crecimiento. Su necesidad real es garantizar que cada llamada entrante de sus contactos recurrentes llegue a la persona correcta sin pérdida.',

  potencial_corto: [
    'Propuesta de retención: Salesforce + Chat + Asistente Virtual al mismo MRR de $17,225 — hay que presentarla antes del martes.',
    'Corrección inmediata del agente Juan Pablo Matías (24.6% de pérdida) — hallazgo que el cliente puede descubrir solo antes de la reunión.',
    'Confirmación de rol de Gaboxtec Mu y si Dan debe escalar a Luis Armando Durán Rejón directamente.',
  ],
  potencial_largo: [
    'Integración con herramientas de TI que la matriz AMMEGA defina como estándar de grupo — posiciona a Callpicker dentro de la nueva arquitectura corporativa.',
    'Explorar si existen más extensiones/líneas de Jason en otras sedes que no estén siendo gestionadas desde Callpicker.',
    'Proponer reporte mensual de desempeño por agente como parte permanente de la oferta — valor gratuito de alto impacto para la gestión interna del cliente.',
  ],

  tacticas: [
    {
      nombre:      'Apertura con datos validados',
      descripcion: 'Abrir la reunión del martes confirmando el dato que el cliente ya cree cierto: el volumen que ellos mismos reportaron (190–220/mes) coincide exactamente con el dato medido en CDR (206/mes contestadas). Esto construye autoridad antes de presentar la propuesta.',
      impacto:     'Alto — el cliente verifica que Callpicker conoce su operación mejor que ellos mismos; cambia el tono de "convénzanme" a "aquí está lo que perderían".',
    },
    {
      nombre:      'Salesforce primero, luego Chat + IA',
      descripcion: 'Presentar la integración Salesforce como primer punto — es la única necesidad confirmada por el cliente en la reunión (comprometido el video). Chat y Asistente Virtual se presentan después como evolución natural del paquete, no como venta adicional.',
      impacto:     'Alto — ancla la conversación en una necesidad ya declarada, no en una propuesta no solicitada.',
    },
    {
      nombre:      'Argumento de costo de migración',
      descripcion: 'Señalar el costo real de reconstruir desde cero con un nuevo proveedor: integraciones (Salesforce), portabilidad, re-configuración de los 13 agentes y colas, posible discontinuidad operativa durante la transición. Vs. Callpicker que ya tiene esa integración lista.',
      impacto:     'Medio — aplica especialmente si el equipo de TI global de AMMEGA aún no tiene proveedor definido.',
    },
  ],

  senal_alarma: 'EVALUACIÓN DE PROVEEDOR ACTIVA. Ticket #113092 abierto el 13 ago 2026. Fecha límite operativa: 4 sep 2026 (portabilidad requiere 15 días previos). La decisión no es del director local — viene desde la corporación en Europa. El argumento de retención debe dirigirse a demostrar valor dentro de la nueva estructura, no a defender el servicio como lo conocen hoy.',

  /* ── Problema Raíz ───────────────────────────────────────────── */
  problema_raiz:        'Decisión corporativa de centralización TI — no insatisfacción operativa',
  problema_raiz_detalle:'Jason de México fue adquirida por el grupo AMMEGA (Países Bajos, respaldado por Partners Group Suiza). La centralización de decisiones de TI y telecomunicaciones a nivel corporativo genera una revisión de todos los proveedores locales, independientemente de su desempeño. El servicio de Callpicker no tiene problemas operativos — la tasa de contestación es sana (85%), los pagos están al corriente y el historial de soporte es mínimo. El riesgo de cancelación existe porque la decisión se toma fuera de México, sin que el equipo local tenga autonomía para mantener al proveedor.',

  flujo_real: [
    { fase: '1',  area: 'Corporativo AMMEGA',   accion: 'Centralización de decisiones TI/telecom a nivel grupo', resultado: 'Revisión de todos los proveedores de telefonía locales en México' },
    { fase: '2',  area: 'Jason de México',       accion: 'Apertura de ticket de revisión de continuidad Zoho Desk #113092', resultado: 'Señal de riesgo llega a Callpicker por primera vez' },
    { fase: '3',  area: 'CS Callpicker (Dan)',   accion: 'Reunión del 14 ago con Gaboxtec Mu', resultado: 'Confirmación: no es baja formalizada; hay ventana de retención hasta el 4 de septiembre' },
    { fase: '4',  area: 'CS Callpicker (Dan)',   accion: 'Preparar y enviar propuesta de retención (Salesforce + Chat + IA)', resultado: 'Pendiente — debe enviarse antes del martes' },
    { fase: '5',  area: 'Reunión de seguimiento', accion: 'Presentar propuesta y confirmar decisión final de continuidad', resultado: 'Pendiente — martes próximo' },
  ],

  comparativo: [
    { metrica: 'Llamadas contestadas',    real: '85.0% · 1,511 de 1,778',   ideal: '≥80% · Dentro del rango saludable' },
    { metrica: 'Tasa de pérdida general', real: '7.2% · 128 llamadas',       ideal: '<10% · Manejable pero con concentración crítica' },
    { metrica: 'Pérdida agente crítico',  real: '24.6% · Juan Pablo Matías', ideal: '<10% · Requiere corrección inmediata' },
    { metrica: 'Adopción de módulos',     real: '0 de 7 módulos disponibles', ideal: 'Mín. 2-3 módulos en cuenta VIP de 3 años' },
    { metrica: 'Tickets de soporte',      real: '2 tickets en 3+ años',       ideal: 'Perfecto — una de las cuentas más sanas' },
    { metrica: 'Health Score predictivo', real: '95/100 — no anticipó riesgo', ideal: 'Un HS efectivo habría detectado señales estructurales' },
  ],

  /* ── Plan de Acción ──────────────────────────────────────────── */
  plan_inmediato: [
    { accion: 'Enviar respuestas formales a las dudas del ticket #113092 sobre corte y proceso de portabilidad de números', responsable: 'Dan Domínguez', criterio: 'Antes del lunes — comprometido en reunión del 14 ago' },
    { accion: 'Enviar propuesta de retención formal: Salesforce + Chat + Asistente Virtual al mismo MRR ($17,225)', responsable: 'Dan Domínguez', criterio: 'Antes del lunes — comprometido en reunión del 14 ago' },
    { accion: 'Compartir video de integración Callpicker–Salesforce con Gaboxtec Mu', responsable: 'Dan Domínguez / José Manuel', criterio: 'Antes del martes — comprometido por José Manuel en la reunión' },
    { accion: 'Revisar configuración del agente Juan Pablo Matías (24.6% pérdida) y aplicar ajuste o coaching', responsable: 'Dan Domínguez + Soporte Técnico', criterio: 'Antes de la reunión del martes — no esperar a que el cliente lo detecte' },
  ],
  plan_mediano: [
    { accion: 'Confirmar con cliente el alcance real de extensiones activas más allá de la línea (55) 89-50-62-54', responsable: 'Dan Domínguez', criterio: 'En la reunión del martes — limitación crítica de datos de este reporte' },
    { accion: 'Identificar al contacto de 147 llamadas (55 1452 5766) y evaluar si es cuenta estratégica del cliente', responsable: 'Dan Domínguez', criterio: 'Dentro de los primeros 15 días post-reunión' },
    { accion: 'Confirmar rol de Gaboxtec Mu: ¿integrador externo o personal interno? ¿Tiene mandato real de decisión?', responsable: 'Dan Domínguez', criterio: 'En la reunión del martes — condiciona si hay que escalar a Luis Armando Durán Rejón' },
    { accion: 'Proponer reporte mensual de desempeño por agente como parte permanente del servicio', responsable: 'Dan Domínguez', criterio: 'Presentar como valor gratuito en la reunión del martes' },
  ],
  plan_estrategico: [
    { accion: 'Si la cuenta se retiene: explorar integración con herramientas que la matriz AMMEGA defina como estándar de grupo', responsable: 'Dan Domínguez + Producto', criterio: 'Condicionado a confirmación de permanencia — 60+ días' },
    { accion: 'Actualizar fórmula de Health Score para detectar riesgo corporativo/estructural (fusiones, cambios de sede, cambios de contacto)', responsable: 'Producto / CS', criterio: 'Este caso es evidencia directa de la brecha metodológica actual' },
    { accion: 'Documentar este caso como playbook de cuenta en riesgo por decisión corporativa externa — para otros casos similares en el portafolio', responsable: 'Equipo Experiencia al Cliente', criterio: 'Post-cierre del caso (sea retención o salida documentada)' },
  ],
  areas_oportunidad: [
    { area: 'Integración Salesforce', impacto: 'Necesidad confirmada en reunión — argumento de retención más fuerte disponible', responsable: 'Dan Domínguez + Producto' },
    { area: 'Reportes de desempeño por agente', impacto: 'Resuelve el punto ciego del agente crítico; valor tangible gratuito para la reunión del martes', responsable: 'Dan Domínguez' },
    { area: 'Chat + Asistente Virtual', impacto: 'Cobertura adicional en picos y fuera de horario; argumento de evolución tecnológica ante matriz corporativa', responsable: 'Dan Domínguez (post-Salesforce)' },
  ],

  /* ── Perfiles de Actores ─────────────────────────────────────── */
  perfiles: [
    {
      nombre: 'Gaboxtec Mu',
      rol:    'Interlocutor de la reunión del 14 ago · Rol a confirmar (¿integrador externo o personal interno?)',
      color:  '#f59e0b',
      campos: [
        { label: 'Email',        value: 'gaboxtec@gmail.com' },
        { label: 'Observación',  value: 'No es el contacto Director registrado en CRM. Confirmar con Dan si tiene mandato de decisión real o si hay que escalar a Luis Armando.' },
        { label: 'Confirmó',     value: 'No es cancelación formalizada — evaluación de proveedor. Necesidad de integración Salesforce.' },
      ],
    },
    {
      nombre: 'Luis Armando Durán Rejón',
      rol:    'Director de cuenta (CRM) · Contacto oficial Jason de México',
      color:  '#6366f1',
      campos: [
        { label: 'Email',        value: 'armando.duran@ammega.com (dominio corporativo AMMEGA)' },
        { label: 'Observación',  value: 'No estuvo en la reunión del 14 ago. La sesión de retención formal debe incluirlo o escalar hasta él.' },
        { label: 'Señal relevante', value: 'Usa dominio @ammega.com, no @jasonindustrial.com — integración administrativa con corporativo ya en marcha.' },
      ],
    },
    {
      nombre: 'Juan Pablo Matías',
      rol:    'Agente / Cola interna con mayor tasa de pérdida',
      color:  '#ef4444',
      campos: [
        { label: 'Llamadas recibidas', value: '114 (6.4% del total)' },
        { label: 'Tasa de pérdida',    value: '24.6% — 3.4× el promedio de la cuenta (7.2%)' },
        { label: 'Acción requerida',   value: 'Revisión de configuración o coaching antes de la reunión del martes — no esperar a que el cliente lo detecte.' },
      ],
    },
    {
      nombre: 'Misael Salas',
      rol:    'Agente de mayor volumen y mejor desempeño — referencia interna',
      color:  '#22c55e',
      campos: [
        { label: 'Llamadas recibidas', value: '459 (25.8% del total del periodo)' },
        { label: 'Tasa de pérdida',    value: '0.9% — referencia de buen desempeño' },
        { label: 'Relevancia',         value: 'Demuestra que la plataforma sí funciona bien cuando está bien configurada.' },
      ],
    },
  ],

  /* ── FODA ────────────────────────────────────────────────────── */
  foda: {
    fortalezas: [
      'Tasa de contestación saludable: 85.0% sobre 1,778 llamadas entrantes',
      'Soporte técnico prácticamente sin incidentes en 3 años (2 tickets total)',
      '74.8% del tráfico proviene de contactos recurrentes — base fiel de clientes/proveedores',
      'Misael Salas: agente de mayor volumen (25.8%) con desempeño ejemplar (0.9% pérdida)',
      'Historial de pagos perfecto sin incidencias',
    ],
    oportunidades: [
      'Integración Salesforce: necesidad confirmada por el cliente en reunión — propuesta lista para presentar',
      'Reunión de seguimiento ya agendada para el martes — ventana abierta',
      '4 de septiembre como fecha límite: 15 días mínimos de aviso para portabilidad — aún hay tiempo de actuar',
      'El equipo de TI global de AMMEGA puede no tener aún un proveedor estándar definido — ventana de posicionamiento',
      'Espacio de adopción no explorado en 3 años: Chat, IA, Integraciones — argumento de evolución tecnológica',
    ],
    debilidades: [
      'Agente Juan Pablo Matías: 24.6% de pérdida — 3.4× el promedio de la cuenta',
      'Cero adopción de módulos adicionales en 3 años: la cuenta nunca fue expandida',
      'Datos disponibles cubren solo 1 línea de las 25 extensiones contratadas',
      'No se tiene certeza sobre el rol y autoridad real de Gaboxtec Mu para decidir',
      'Health Score de 95/100 no detectó el riesgo — brecha metodológica del score',
    ],
    amenazas: [
      'Decisión de cancelación motivada por reestructuración corporativa fuera del control de Callpicker',
      'Matriz AMMEGA en movimiento estratégico activo (Partners Group evaluando opciones en oct 2024)',
      'Posible reubicación física o reorganización de la operación en México desde Europa/Italia',
      'Interlocutor real de decisión puede ser alguien distinto a los contactos actuales disponibles',
      'Fecha límite operativa del 4 de septiembre — ventana de retención muy corta',
    ],
  },

  /* ── Conclusión ──────────────────────────────────────────────── */
  conclusion: 'Esta cuenta no está en riesgo por el servicio de Callpicker. Está en riesgo por una decisión de consolidación tomada fuera de México, en la matriz AMMEGA. El análisis operativo es sano: 85% de contestación, pagos perfectos, soporte mínimo. El problema es estructural y corporativo.\n\nLa ventana de retención es real y está abierta: el cliente confirmó en reunión que no hay cancelación formalizada, que la integración con Salesforce es una necesidad concreta, y que hay una reunión de seguimiento para el martes. Dan tiene los argumentos, la propuesta y el tiempo para actuar — el trabajo de campo ya está hecho.',
  pierde: [
    '$17,225/mes de MRR (cuenta VIP, 3 años de relación)',
    'Caso de éxito de cliente de distribución industrial de largo plazo',
    'Precedente: una cuenta con HS de 95/100 puede cancelar sin señal previa en el sistema',
  ],
  gana: [
    'Si se retiene: primer caso documentado de propuesta Salesforce + Chat + IA activado por análisis forense de llamadas',
    'Si se retiene con mismo MRR: margen de confianza del cliente ampliado sin inversión adicional',
    'En cualquier escenario: playbook de manejo de riesgo corporativo/estructural para el portafolio',
  ],
  recomendacion_central: 'Enviar antes del lunes: (1) respuestas formales al ticket #113092, (2) propuesta de retención Salesforce + Chat + IA al mismo MRR, (3) video de integración Salesforce comprometido por José Manuel. En la reunión del martes: abrir con el dato validado de 206 llamadas contestadas/mes (coincide con lo que el cliente dijo), confirmar rol de Gaboxtec Mu, y posicionar a Callpicker dentro de la nueva arquitectura tecnológica de AMMEGA — no como proveedor a reemplazar, sino como el que ya tiene construido lo que la corporación necesita.',
}
