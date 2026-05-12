import type { AuditoriaCase } from './types'

export const ARKANSAS: AuditoriaCase = {
  id: 'arkansas',
  nombre: 'Arkansas State University Campus Querétaro',
  sector: 'Educación Superior – Universidad Privada',
  fecha_periodo: 'Marzo – Abril 2026',
  fecha_auditoria: 'Abr 2026',
  tipo_cliente: 'Enterprise AAA',
  descripcion_contexto: 'Integración Genjo + Callpicker Chat via WhatsApp API',
  estado: 'rescatable',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Duración de la crisis', value: '35 días',     color: '#ef4444' },
    { label: 'Pivotes técnicos',      value: '4',           color: '#f59e0b' },
    { label: 'Valor en riesgo',       value: '$147k',       color: '#6366f1' },
    { label: 'Estado actual',         value: 'RESCATABLE',  color: '#22c55e' },
  ],

  resumen_ejecutivo: 'El presente informe documenta el caso Arkansas State University Campus Querétaro, cliente de Callpicker Chat desde marzo de 2026. El caso expone fallas sistémicas en los procesos de preventa, activación e implementación que derivaron en una crisis operativa, desgaste del equipo interno y riesgo real de cancelación del contrato.\n\nA lo largo de 35 días, lo que fue presentado comercialmente como una conexión de "10 minutos" se transformó en una integración de arquitectura personalizada con al menos cuatro pivotes técnicos, una cotización de $147,000 pesos rechazada por el cliente, y una relación que —gracias a la intervención estratégica de la Dirección de Satisfacción al Cliente— logró estabilizarse el 14 de abril de 2026.',

  resultado_positivo: 'A partir de la intervención de la Dirección de Satisfacción al Cliente, el proyecto logró estabilizarse. El 14 de abril de 2026, Ingeniería entregó documentación técnica completa, se activó la funcionalidad de autoservicio de plantillas y la arquitectura fue simplificada. El cliente mantiene la disposición de formalizar un contrato a largo plazo e integrar el canal de voz (migración de Genesys) en octubre de 2026.',

  hallazgos: [
    'La promesa de implementación en "10 minutos" por parte del área comercial, sin validación técnica previa, generó una deuda moral que el cliente instrumentalizó durante la parte final de la negociación.',
    'La plataforma carecía de webhooks de estado de entrega/lectura (DLR), funcionalidad estándar de la industria para WhatsApp API, descubierta únicamente hasta avanzado el proyecto.',
    'El equipo de Soporte y Activaciones trató un proyecto de integración personalizada con estándares de soporte reactivo, ampliando la fricción operativa.',
    'La ausencia de un proceso de Discovery formal es la causa raíz de todos los problemas subsecuentes documentados en este informe.',
  ],

  cronologia: [
    { fecha: 'Mar 11',    responsable: 'José Galván (Ventas)',          evento: 'Apertura del caso. Se promete al cliente que la conexión Genjo + CP Chat tomará "10 minutos" sin validación técnica previa.', tipo: 'problema' },
    { fecha: 'Mar 11-14', responsable: 'Edith Balderas (Soporte)',      evento: 'Se trata el proyecto como una activación estándar. Falla silenciosa — el número Twilio no se activa.', tipo: 'problema' },
    { fecha: 'Mar 15-25', responsable: 'Soporte / Cliente',             evento: 'El número Twilio no aparece en el portafolio de Meta. Se descubre que Genjo actúa como intermediario. Sin escalamiento a Ingeniería.', tipo: 'problema' },
    { fecha: 'Mar 25',    responsable: 'Daniel García (Cliente)',        evento: 'Cliente comparte 6 puntos de dolor vía WhatsApp. Comienza a presionar por soluciones sin costo.', tipo: 'problema' },
    { fecha: 'Mar 27',    responsable: 'UX + Ingeniería',               evento: 'Primera sesión interna. Se descubre la verdadera complejidad: requiere integración personalizada.', tipo: 'pivote' },
    { fecha: 'Mar 31',    responsable: 'Ricardo / David Avilés',        evento: 'Se descarta webhook dual de Twilio. Se propone el "Orquestador" como solución. Estimado: 98 horas / $147,000 MXN.', tipo: 'problema' },
    { fecha: 'Abr 8',     responsable: 'Callpicker + Arkansas',         evento: 'Cliente rechaza el costo del Orquestador en sesión de revisión de los 6 puntos de dolor.', tipo: 'problema' },
    { fecha: 'Abr 9-13',  responsable: 'Ricardo / David',               evento: 'Pivote técnico: se abandona el Orquestador. Se adopta modelo "In-the-Wire" (Callpicker controla número Twilio/Meta).', tipo: 'pivote' },
    { fecha: 'Abr 14',    responsable: 'David Avilés',                  evento: 'Entrega de documentación API completa. Se activa autoservicio de plantillas en Admin Chat. Proyecto estabilizado.', tipo: 'ok' },
    { fecha: 'Abr 14',    responsable: 'Genjo (David Dettmer)',         evento: 'Genjo evalúa documentación entregada. Estimado de presupuesto de desarrollo pendiente de entrega al cliente.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',       value: 'Arkansas State University Campus Querétaro' },
    { label: 'Sector',             value: 'Educación Superior – Universidad Privada' },
    { label: 'Contacto principal', value: 'Daniel García Rojas Reyes – Director de Sistemas / Proyecto' },
    { label: 'Contacto técnico',   value: 'Ana Pilar Cuellar Cabello – TI' },
    { label: 'Integrador externo', value: 'Genjo (Court Avenue) – David Dettmer / Graham Vaughn' },
    { label: 'Plataforma anterior',value: 'Genesys (Voz) + Twilio + Apify Cloud (WhatsApp)' },
    { label: 'Tipo de cliente',    value: 'Enterprise AAA – Alto potencial de upsell' },
  ],
  necesidad_negocio: 'Arkansas State University conduce actualmente una transformación digital de su proceso de captación de estudiantes. Su modelo operativo combina campañas masivas de WhatsApp (gestionadas por el bot de IA de Genjo), seguimiento personalizado de ejecutivos humanos, y campañas de voz gestionadas por Genesys.\n\nEl objetivo central al contratar Callpicker Chat fue: centralizar toda la operación de contactación digital en una sola plataforma, que permitiera a los agentes humanos retomar conversaciones iniciadas por el bot de IA, con visibilidad total y control de plantillas de comunicación.',
  potencial_corto: ['Contrato de 5 años de servicio WhatsApp', 'Autoservicio de plantillas activo', 'Integración Genjo + CP Chat operativa para julio'],
  potencial_largo: ['Migración canal de Voz desde Genesys (octubre 2026)', 'Integración CRM y análisis de llamadas', 'Caso de éxito replicable en sector universitario'],
  tacticas: [
    { nombre: 'Activación de deuda moral',   descripcion: 'Cita repetidamente "ustedes dijeron 10 minutos" para invalidar cotizaciones', impacto: 'Pérdida de leverage comercial; equipo cedió en márgenes' },
    { nombre: 'Triangulación de autoridad',  descripcion: 'Menciona a su jefa y Presidencia como figura intransigente ("ella no aprobará más inversión")', impacto: 'Urgencia artificial; equipo técnico bajo presión innecesaria' },
    { nombre: 'Promesa de zanahoria',        descripcion: 'Ofrece migración de Genesys en octubre si se resuelve WhatsApp sin costo', impacto: 'Incentivó concesiones técnicas de Ingeniería y Soporte' },
  ],
  senal_alarma: 'Cuando menciona "mi jefa" o "Presidencia", está usando presión artificial para acelerar concesiones. Tratar como señal de escalación, no como urgencia real.',

  problema_raiz: 'Ausencia de proceso formal de Discovery para proyectos de integración con terceros y cuentas Enterprise',
  problema_raiz_detalle: 'No se trató de un error aislado de una persona, sino de una cadena de decisiones tomadas bajo la lógica del "soporte reactivo" cuando la situación demandaba "arquitectura proactiva". La ausencia de un Discovery técnico previo a la venta fue el punto de origen de todos los problemas documentados.',
  flujo_real: [
    { fase: '1. Venta',              area: 'Ventas – José Galván',    accion: 'Promesa de "10 min" sin Discovery', resultado: 'Expectativa irreal. Deuda moral. Sin leverage comercial futuro.' },
    { fase: '2. Activación',          area: 'Soporte – Edith Balderas',accion: 'Trata proyecto especial como bandeja QR estándar', resultado: 'Falla silenciosa 2 semanas. Cliente invisible. Sin escalación.' },
    { fase: '3. Escalación tardía',   area: 'Soporte → Ingeniería',   accion: 'Solo escala cuando el cliente amenaza con cancelar', resultado: 'Ingeniería entra en modo "apagar incendio"' },
    { fase: '4. Ingeniería reactiva', area: 'David Avilés / Ricardo', accion: 'Propone Orquestador (98 hrs). Descubre falta de webhooks DLR', resultado: '$147k rechazados. 4 pivotes técnicos. Sin certeza para cliente.' },
    { fase: '5. Cliente presiona',    area: 'Daniel García',          accion: 'Usa WhatsApp directo, emails y reuniones para presionar', resultado: '6 canales de comunicación activos. Equipo fragmentado.' },
    { fase: '6. Estabilización UX',   area: 'José Manuel / Daniel Mtz',accion: 'Intervención como árbitro de alcances y comunicación', resultado: 'Proyecto rescatado. Arquitectura simplificada. Cliente en calma.' },
  ],
  comparativo: [
    { metrica: 'Duración del proyecto',           real: '35 días en crisis',                ideal: '30-45 días en orden' },
    { metrica: 'Horas Ingeniería no facturadas',  real: '40+ horas (aprox. $6,000 USD)',    ideal: '10 horas (solo Discovery) — Ahorro: ~$5,000 USD' },
    { metrica: 'Satisfacción estimada (1-10)',     real: '5/10 (riesgo de cancelación)',     ideal: '8/10 (cliente fidelizado)' },
    { metrica: 'Canales de comunicación activos', real: '6 simultáneos (Slack, WA, email)', ideal: '2 (canal principal + escalación UX)' },
    { metrica: 'Estrés del equipo (1-10)',         real: '9/10 (burnout Edith / Toño)',      ideal: '4/10 (proceso sostenible)' },
    { metrica: 'Replicabilidad del proceso',      real: 'No. Depende de SAC.',              ideal: 'Sí. Checklist estandarizado' },
  ],

  plan_inmediato: [
    { accion: 'Confirmar presupuesto de Genjo y validar que documentación API fue suficiente', responsable: 'José Galván', criterio: 'Presupuesto recibido; ninguna duda técnica adicional de Genjo' },
    { accion: 'Presentar propuesta formal a Daniel García: costo claro, responsabilidades de cada parte', responsable: 'José Galván + José Manuel', criterio: 'Acuerdo firmado o carta de intención formalizada' },
    { accion: 'Resolver dudas técnicas de Ana Pilar (prefijo wa_, multimedia, API de nombres)', responsable: 'David Avilés + Ricardo + Soporte', criterio: 'Respuesta escrita enviada en 24 horas' },
    { accion: 'Distribuir Checklist de Discovery a Ventas, Activaciones y Soporte', responsable: 'Daniel Martínez + José Manuel', criterio: 'Sesión de lectura confirmada con cada área' },
  ],
  plan_mediano: [
    { accion: 'Implementación y QA de integración Genjo + CP Chat', responsable: 'Ricardo + Ingeniería + UX', criterio: 'Conversación tripartita funcionando sin errores en sandbox' },
    { accion: 'Activar autoservicio de plantillas y validar con Ana Pilar', responsable: 'David Avilés + Edith', criterio: 'Cliente puede crear y usar plantillas sin soporte de Callpicker' },
    { accion: 'Sesiones de retroalimentación con todos los actores internos', responsable: 'David Avilés', criterio: 'Cada área confirma comprensión del proceso de Discovery' },
    { accion: 'Desarrollar y publicar documentación "Proyecto Especial – Checklist Oficial"', responsable: 'Daniel Martínez + José Manuel', criterio: 'Documento aprobado y en repositorio interno' },
  ],
  plan_estrategico: [
    { accion: 'Campañas de julio en producción y operativas para Arkansas', responsable: 'UX + Soporte', criterio: 'Cero incidentes durante la campaña de inscripciones' },
    { accion: 'Iniciar planificación formal de migración de Voz (Genesys → CP)', responsable: 'Ventas + Ingeniería', criterio: 'Propuesta técnica y comercial entregada antes de septiembre' },
    { accion: 'Desarrollar Webhooks DLR (entregado/leído) como producto core', responsable: 'Ingeniería – Producto', criterio: 'Feature disponible para todos los clientes de WhatsApp API' },
    { accion: 'Documentar Arkansas como caso de éxito Enterprise para sector universitario', responsable: 'SAC + Marketing', criterio: 'Caso publicado internamente; disponible para próximas ventas' },
  ],
  areas_oportunidad: [
    { area: 'Proceso formal de Discovery para proyectos especiales', impacto: 'Elimina el "pecado original". Propuestas con soporte técnico real.', responsable: 'Ventas + Ingeniería + UX' },
    { area: 'Clasificación de clientes Enterprise con SLA diferenciado', impacto: 'Escala sin burnout para Edith y Toño en clientes $50k+.', responsable: 'Operaciones + SAC' },
    { area: 'Webhooks DLR (entrega/lectura) en la plataforma', impacto: 'Funcionalidad estándar de industria. Integración masiva sin limitaciones.', responsable: 'Ingeniería (Producto Core)' },
    { area: 'API de plantillas con retorno de "nombre" (no solo ID)', impacto: 'Menos fricción para integradores externos como Genjo.', responsable: 'Ingeniería' },
    { area: 'LOI (Carta de Intención) para compromiso de Voz en octubre', impacto: 'Formaliza la zanahoria. Convierte promesa en compromiso comercial.', responsable: 'Ventas + Dirección Comercial' },
  ],

  perfiles: [
    {
      nombre: 'Daniel García Rojas Reyes', rol: 'Cliente (Arkansas) — Director de Sistemas / Decisor operativo y presupuestal', color: '#ef4444',
      campos: [
        { label: 'Motivación primaria',  value: 'Salvar su reputación ante su directora y la Presidencia de la Universidad' },
        { label: 'Motivación secundaria',value: 'Obtener el máximo valor de Callpicker con la menor inversión adicional posible' },
        { label: 'Estilo negociador',    value: 'Sofisticado. Usa el "error inicial" como palanca. Empático en la forma; inflexible en el fondo.' },
        { label: 'Táctica observada',    value: 'Activación de deuda moral + Triangulación de autoridad + Promesa de zanahoria (Voz en octubre)' },
        { label: 'Señal de alarma',      value: 'Cuando menciona "mi jefa" o "Presidencia", está usando presión artificial para acelerar concesiones' },
        { label: 'Fortaleza',            value: 'Es altamente leal y tiene visión de transformación digital a largo plazo' },
        { label: 'Recomendación',        value: 'Tratar a Daniel como socio estratégico. Documentar y formalizar todos los acuerdos por escrito.' },
      ],
    },
    {
      nombre: 'José Galván', rol: 'Ventas — Gestor de cuenta; primer punto de contacto comercial', color: '#f59e0b',
      campos: [
        { label: 'Motivación primaria',     value: 'Cierre rápido de contrato; expansión de cuenta (Voz en octubre)' },
        { label: 'Motivación secundaria',   value: 'Evitar conflicto interno; mantener relación cordial con todas las áreas' },
        { label: 'Estilo de trabajo',       value: 'Optimista y carismático. Promete antes de validar. Mediaba tensiones con humor.' },
        { label: 'Error crítico',           value: '"Será cuestión de 10 minutos" — dicho sin consultar a Ingeniería' },
        { label: 'Comportamiento presión',  value: 'Entra en modo mediador. Busca que todas las áreas digan "sí" en lugar de arbitrar.' },
        { label: 'Área de mejora',          value: 'Discovery técnico PRE-venta obligatorio para proyectos de integración.' },
      ],
    },
    {
      nombre: 'Alberto David Avilés Reyna', rol: 'Ingeniería — Consultor técnico y Project Manager', color: '#6366f1',
      campos: [
        { label: 'Motivación primaria',  value: 'Proteger la estabilidad de la plataforma y evitar scope creep de clientes' },
        { label: 'Estilo inicial',       value: 'Reactivo y bloqueador. Táctica: "no es nativo de Chatwoot" para invalidar solicitudes.' },
        { label: 'Giro (14 Abr)',        value: 'Entregó documentación técnica completa y activó autoservicio de plantillas. Pasó de bloqueador a solucionador.' },
        { label: 'Riesgo latente',       value: 'El giro puede ser temporal (por presión de directivos), no un cambio cultural genuino' },
        { label: 'Área de mejora',       value: 'Proponer opciones (Opción A, B, C) en lugar de cerrar con "no es posible"' },
      ],
    },
    {
      nombre: 'Edith Betzabet Balderas Padilla', rol: 'Soporte / Activaciones — Responsable de activaciones y soporte técnico directo', color: '#3b82f6',
      campos: [
        { label: 'Motivación primaria', value: 'Mantener control de su carga de trabajo; no ser responsable de fallos técnicos ajenos' },
        { label: 'Error crítico',       value: 'Trató una integración personalizada (Genjo + Twilio) como una activación estándar de bandeja QR' },
        { label: 'Impacto observado',   value: 'Cliente percibió abandono y falta de profesionalismo. Edith recibió la fricción generada por otros.' },
        { label: 'Para Dirección',      value: 'Edith necesita un protocolo claro de escalación para cuentas Enterprise. Su agotamiento es indicador de falla de sistema, no personal.' },
      ],
    },
    {
      nombre: 'Daniel Martínez Loyola', rol: 'Director de UX — Árbitro de alcances e intervención estratégica', color: '#22c55e',
      campos: [
        { label: 'Aportación clave',  value: 'Invitó a José Manuel al canal de Slack, detonando la intervención de UX que salvó la cuenta' },
        { label: 'Área de mejora',    value: 'La dupla UX–Ingeniería funciona cuando ambas áreas tienen el mismo peso. Debe formalizarse.' },
        { label: 'Potencial',         value: 'Liderar la implementación del Discovery Formal como política de empresa junto con José Manuel.' },
      ],
    },
    {
      nombre: 'Antonio (Toño) del Río', rol: 'Operaciones / Customer Success — Supervisor y punto de escalación', color: '#8b5cf6',
      campos: [
        { label: 'Frase clave',      value: '"Tengan cuidado de no volverse esclavos de los clientes"' },
        { label: 'Fortaleza',        value: 'Detectó tempranamente que Arkansas consumía recursos Premium pagando plan básico.' },
        { label: 'Recomendación',    value: 'Crear una política de SLA diferenciada para clientes Enterprise que Toño pueda aplicar sin arbitraje manual.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Lealtad emocional del cliente: "Nos encanta Callpicker"',
      'Adopción operativa alta: 30+ ejecutivos, 16+ bandejas activas',
      'Alineación UX–Ingeniería (UX como árbitro estratégico)',
      'Capacidad para simplificar arquitectura compleja',
      'Giro de David Avilés (14 Abr): de bloqueador a solucionador',
    ],
    oportunidades: [
      'Migración de voz Genesys → Callpicker (octubre 2026)',
      'Contrato a 5 años con ingresos recurrentes garantizados',
      'Caso de éxito replicable en sector universitario',
      'Webhooks DLR como diferenciador competitivo si se desarrollan',
    ],
    debilidades: [
      'Deuda moral: promesa de "10 minutos" sin validación técnica',
      'Carencia de webhooks DLR (estándar de industria no implementado)',
      'Silos entre Ventas, Ingeniería y Soporte (descoordinación)',
      'Ausencia de proceso formal de Discovery para proyectos especiales',
      'Burnout operativo en Soporte y Operaciones (Edith, Toño)',
    ],
    amenazas: [
      'Presupuesto de Genjo: si es alto, el cliente puede cancelar',
      'Deadline julio: campaña universitaria; sin margen para errores',
      'Genjo podría construir solución propia y desplazar a Callpicker',
      'Precedente: ceder en costos puede repetirse si no se sistematizan procesos',
    ],
  },

  conclusion: 'El caso Arkansas es, ante todo, un espejo que revela las fricciones sistémicas que existen entre las áreas de Ventas, Ingeniería, Soporte y la Dirección de Satisfacción al Cliente cuando se carece de procesos estandarizados para proyectos complejos.',
  pierde: [
    'Un cliente Enterprise con potencial multianual',
    'La migración de Genesys (canal de voz) en octubre',
    'La credibilidad en el sector universitario',
    'La confianza del equipo interno (burnout si se repite)',
  ],
  gana: [
    'Contrato de 5 años con ingresos recurrentes',
    'Expansión a voz, CRM e integración completa',
    'Caso de éxito documentado para replicar',
    'Un proceso de Discovery que evita la próxima crisis',
  ],
  recomendacion_central: 'El proceso de Discovery debe convertirse en política de empresa, no en una excepción que se aplica después del primer incendio. Cada proyecto de integración personalizada debe iniciar con una sesión técnica validada, un documento de alcance firmado y un árbitro de UX designado antes de cualquier promesa al cliente.',
}
