import type { AuditoriaCase } from './types'

/**
 * Fuente: "Auditoria_Arkansas_v2.0.docx" — Dirección de Satisfacción al Cliente,
 * actualización del 8 de septiembre de 2026.
 *
 * QUÉ CAMBIA EN LA v2.0: la v1.0 cubría sólo la Fase 1 (marzo–abril 2026), la
 * crisis de 35 días resuelta el 14 de abril. Esta versión incorpora la Fase 2
 * (mayo – 7 de septiembre) a partir del canal de Slack #arkansas-cq. La cuenta
 * se mantuvo operativa y sin una crisis de la magnitud de Fase 1, pero se
 * documentan CUATRO FRENTES ABIERTOS DE FORMA SIMULTÁNEA que replican en nuevos
 * dominios el mismo patrón raíz: compromisos comunicados al cliente antes de
 * una validación técnica completa.
 *
 * LIMITACIÓN DE FUENTE (se conserva del documento): el extracto de Slack
 * corresponde a la ventana de mayo al 7 de septiembre de 2026, pero los
 * mensajes individuales sólo conservan HORA DEL DÍA, no fecha de calendario.
 * Por eso la cronología de Fase 2 se presenta POR TEMA (frente de trabajo)
 * dentro de esa ventana, y no como línea de tiempo fechada día por día. No se
 * deben inventar fechas para esos eventos.
 *
 * Las etiquetas de confianza del documento — [VERIFICADO], [HIPÓTESIS],
 * [VACÍO] — se conservan tal cual: marcan qué se sostiene en evidencia y qué no.
 */
export const ARKANSAS: AuditoriaCase = {
  id: 'arkansas',
  asesor: 'Fátima',
  nombre: 'Arkansas State University Campus Querétaro',
  sector: 'Educación Superior – Universidad Privada',
  fecha_periodo: 'Marzo – 7 Septiembre 2026 · Fase 1: mar–abr · Fase 2: may–7 sep',
  fecha_auditoria: 'Sep 2026',
  tipo_cliente: 'Enterprise AAA · Rescatable',
  descripcion_contexto: 'Callpicker Chat + Genjo vía WhatsApp API · v2.0 incorpora la Fase 2: cuatro frentes abiertos simultáneamente tras la estabilización',
  estado: 'rescatable',
  clasificacion: 'CONFIDENCIAL',
  version: '2.0',

  kpis: [
    { label: 'Duración crisis inicial (Fase 1)',   value: '35 días',   color: '#ef4444' },
    { label: 'Pivotes técnicos (Fase 1)',          value: '4',         color: '#f59e0b' },
    { label: 'Valor en riesgo histórico (Fase 1)', value: '$147k',     color: '#6366f1' },
    { label: 'Abiertos simultáneamente (Fase 2)',  value: '4 frentes', color: '#ef4444' },
  ],

  resumen_ejecutivo:
    'La Fase 1 (marzo–abril 2026) expuso fallas sistémicas en preventa, activación e implementación que derivaron en una crisis operativa de 35 días, resuelta mediante la intervención de la Dirección de Satisfacción al Cliente el 14 de abril de 2026. Lo que se presentó comercialmente como una conexión de "10 minutos" se transformó en una integración de arquitectura personalizada con cuatro pivotes técnicos y una cotización de $147,000 MXN rechazada por el cliente.\n\n' +
    'Esta actualización (Fase 2) incorpora evidencia del canal de Slack #arkansas-cq correspondiente a mayo–7 de septiembre de 2026. La cuenta se mantuvo operativa y SIN una crisis de la magnitud de Fase 1, pero se documentan cuatro frentes abiertos de forma simultánea —facturación de WhatsApp, integración con Salesforce, funcionalidad de marcación tipo Genesys, y escalabilidad de un nuevo proyecto de telefonía— que replican en nuevos dominios el mismo patrón raíz de Fase 1: compromisos comunicados al cliente antes de una validación técnica completa.\n\n' +
    '⚠ LIMITACIÓN DE FUENTE: el extracto de Slack cubre de mayo al 7 de septiembre de 2026, pero los mensajes individuales sólo conservan hora del día, no fecha de calendario. La cronología de Fase 2 se presenta por tema (frente de trabajo) dentro de esa ventana, no como línea de tiempo fechada día por día.',

  resultado_positivo:
    'A partir de la intervención de la Dirección de Satisfacción al Cliente, el proyecto de mensajería se estabilizó: Ingeniería entregó documentación técnica completa, se activó el autoservicio de plantillas y la arquitectura fue simplificada (modelo "In-the-Wire"). El cliente mantuvo la disposición de formalizar un contrato a largo plazo e integrar el canal de voz. ' +
    'En Fase 2 aparecen además dos comportamientos internos que conviene institucionalizar: la resolución rápida de temas de configuración sin escalar —el caso de asignación automática, resuelto por Paola Bárcenas el mismo día de la consulta— y la comunicación temprana de límites de alcance sin sobreprometer, cuando se dijo al cliente de forma directa que el alcance actual de Salesforce "no resuelve su requerimiento". ' +
    'Esa estabilización, sin embargo, no impidió la apertura de nuevos frentes de fricción en los meses siguientes.',

  hallazgos: [
    '01 · (Fase 1) La promesa de implementación en "10 minutos" por parte de Ventas, sin validación técnica previa, generó una deuda moral que el cliente instrumentalizó durante la negociación. [VERIFICADO]',
    '02 · (Fase 1) La plataforma carecía de webhooks de estado de entrega/lectura (DLR), funcionalidad estándar de la industria, descubierta hasta avanzado el proyecto. [VERIFICADO]',
    '03 · (Fase 1) Soporte y Activaciones trataron un proyecto de integración personalizada con estándares de soporte reactivo. [VERIFICADO]',
    '04 · (Fase 1) La ausencia de un proceso de Discovery formal es la causa raíz de todos los problemas subsecuentes del informe original. [VERIFICADO]',
    '05 · (Fase 2 — NUEVO) El patrón de "expectativa no alineada antes de la reunión" se repitió: una sesión de capacitación de plataforma escaló a un reclamo formal por Salesforce porque el objetivo no se comunicó de forma consistente al cliente. Documentado por Enrique Gudiño. [VERIFICADO]',
    '06 · (Fase 2 — NUEVO) La disputa de facturación de WhatsApp (mensajes cobrados vs. enviados según el cliente) sigue abierta: Callpicker envió documentación de conciliación más de una vez sin confirmación explícita de cierre. [VERIFICADO] en el envío repetido · [HIPÓTESIS] en si el cliente quedó conforme.',
    '07 · (Fase 2 — NUEVO) El alcance actual de Salesforce (sólo registrar la llamada al evento "completed") no cubre el requerimiento real del cliente; falta desarrollo cuya viabilidad no ha sido evaluada. Confirmado por Paola Bárcenas. [VERIFICADO]',
    '08 · (Fase 2) Tres preguntas técnicas del proyecto de telefonía permanecen SIN respuesta documentada: importación de 180,000 contactos de una sola vez o escalonada; catálogo de estados de llamada consultables; y automatización de rotación de 25 DIDs por lada de destino con recepción en esas mismas líneas. [VACÍO]',
    '09 · (Fase 2) El método que usa el cliente internamente para contar sus propios envíos de WhatsApp no está documentado en el extracto: la disputa de facturación no puede cerrarse contra una metodología que no se conoce. [VACÍO]',
  ],

  cronologia: [
    /* ── FASE 1 · marzo–abril 2026, con fechas verificables ─────────── */
    { fecha: 'Mar 11',    responsable: 'José Galván (Ventas)',     evento: 'FASE 1 — Apertura del caso. Se promete al cliente que la conexión Genjo + CP Chat tomará "10 minutos" sin validación técnica previa.', tipo: 'problema' },
    { fecha: 'Mar 11-14', responsable: 'Edith Balderas (Soporte)', evento: 'FASE 1 — Se trata el proyecto como una activación estándar. Falla silenciosa: el número Twilio no se activa.', tipo: 'problema' },
    { fecha: 'Mar 15-25', responsable: 'Soporte / Cliente',        evento: 'FASE 1 — El número Twilio no aparece en el portafolio de Meta. Se descubre que Genjo actúa como intermediario. Sin escalamiento a Ingeniería.', tipo: 'problema' },
    { fecha: 'Mar 25',    responsable: 'Daniel García (Cliente)',  evento: 'FASE 1 — El cliente comparte 6 puntos de dolor vía WhatsApp y comienza a presionar por soluciones sin costo.', tipo: 'problema' },
    { fecha: 'Mar 27',    responsable: 'UX + Ingeniería',          evento: 'FASE 1 — Primera sesión interna. Se descubre la verdadera complejidad: requiere integración personalizada.', tipo: 'pivote' },
    { fecha: 'Mar 31',    responsable: 'Ricardo / David Avilés',   evento: 'FASE 1 — Se descarta el webhook dual de Twilio. Se propone el "Orquestador": 98 horas / $147,000 MXN.', tipo: 'problema' },
    { fecha: 'Abr 8',     responsable: 'Callpicker + Arkansas',    evento: 'FASE 1 — El cliente rechaza el costo del Orquestador en la sesión de revisión de los 6 puntos de dolor.', tipo: 'problema' },
    { fecha: 'Abr 9-13',  responsable: 'Ricardo / David',          evento: 'FASE 1 — Pivote técnico: se abandona el Orquestador y se adopta el modelo "In-the-Wire" (Callpicker controla el número Twilio/Meta).', tipo: 'pivote' },
    { fecha: 'Abr 14',    responsable: 'David Avilés',             evento: 'FASE 1 — Entrega de documentación API completa. Se activa el autoservicio de plantillas en Admin Chat. Proyecto estabilizado.', tipo: 'ok' },
    { fecha: 'Abr 14',    responsable: 'Genjo (David Dettmer)',    evento: 'FASE 1 — Genjo evalúa la documentación entregada. Estimado de presupuesto de desarrollo pendiente de entrega al cliente.', tipo: 'neutral' },

    /* ── FASE 2 · may–7 sep 2026. SIN FECHA: el extracto de Slack sólo
         conserva hora del día. Se ordena por frente de trabajo. ──────── */
    { fecha: 'Fase 2 · frente 1', responsable: 'Daniel García / Guillermo Nava (Cliente)', evento: 'FACTURACIÓN WHATSAPP — El cliente cuestiona en más de una ocasión que se le cobran mensajes que, según su propio conteo, no fueron enviados. [VERIFICADO]', tipo: 'problema' },
    { fecha: 'Fase 2 · frente 1', responsable: 'Callpicker',                                evento: 'FACTURACIÓN WHATSAPP — Se aclara explícitamente que no se cobran mensajes no enviados. Se interpretó que el cliente buscaba aplicar tarifas de su proveedor anterior; se descartó sin negociar descuento. [VERIFICADO]', tipo: 'neutral' },
    { fecha: 'Fase 2 · frente 1', responsable: 'Fátima González',                           evento: 'FACTURACIÓN WHATSAPP — Elabora y envía el documento de conciliación (Arkansas.xlsx), el mismo que sustenta el informe de verificación ya entregado al cliente: corte de junio 2026 con 7,549 mensajes facturables sobre 13,294 enviados. [VERIFICADO]', tipo: 'ok' },
    { fecha: 'Fase 2 · frente 1', responsable: 'Joaquín A. Martínez F.',                    evento: 'FACTURACIÓN WHATSAPP — Se acuerda separar en factura el costo de plantilla cobrado por Meta, el fee de plataforma y el costo por envío. Referencia a conversación de ~agosto. [VERIFICADO] el acuerdo · [HIPÓTESIS] su participación, conocida sólo por referencia de terceros.', tipo: 'pivote' },
    { fecha: 'Fase 2 · frente 2', responsable: 'Paola Bárcenas',                            evento: 'SALESFORCE — Alcance actual: sólo se registra la llamada en Salesforce al recibir el evento "completed". Ese alcance NO resuelve el requerimiento real del cliente; se requiere desarrollo adicional y validación de viabilidad, sin dimensionar en horas ni costo. [VERIFICADO]', tipo: 'problema' },
    { fecha: 'Fase 2 · frente 2', responsable: 'José Galván',                               evento: 'SALESFORCE — Ambigüedad interna no resuelta sobre el modelo de trabajo: ¿desarrolla Callpicker o el cliente vía API? Se reconoce "teléfono descompuesto" en la comunicación de este punto. [HIPÓTESIS]', tipo: 'problema' },
    { fecha: 'Fase 2 · frente 2', responsable: 'Enrique Gudiño',                            evento: 'SALESFORCE — Una sesión agendada como "recorrido de plataforma" escaló, a petición del cliente en vivo, a un reclamo por no abordar Salesforce. Documentado de forma proactiva. [VERIFICADO]', tipo: 'problema' },
    { fecha: 'Fase 2 · frente 3', responsable: 'Cliente / Toño del Río',                    evento: 'DIALER DE VOZ — El cliente solicita llamadas consecutivas automáticas al agente disponible más integración con su CRM, replicando Genesys Interaction Dialer. Callpicker no cuenta de forma nativa con esa función; "Campaña Avanzada" es lo más cercano pero no cubre marcación consecutiva inmediata. [VERIFICADO]', tipo: 'problema' },
    { fecha: 'Fase 2 · frente 3', responsable: 'Toño del Río',                              evento: 'DIALER DE VOZ — Se documenta resistencia histórica de clientes al módulo de Campañas: no es un caso aislado. El cliente señala además que la carga masiva de contactos por archivo no le resulta práctica. [VERIFICADO]', tipo: 'neutral' },
    { fecha: 'Fase 2 · frente 4', responsable: 'Ingeniería (pendiente)',                    evento: 'TELEFONÍA / CONMUTADOR — Tres preguntas técnicas sin respuesta documentada: importación de 180,000 contactos de una vez o escalonada; catálogo de estados de llamada consultables; automatización de rotación de 25 DIDs por lada con recepción en esas mismas líneas. [VACÍO]', tipo: 'problema' },
    { fecha: 'Fase 2 · frente 4', responsable: 'Pepe Toño Villaseñor',                      evento: 'TELEFONÍA / CONMUTADOR — Se abre ticket de activación de demo (#113740, fusionado con #113739), con Guillermo Nava como contacto del cliente. RIESGO: si el proyecto avanza comercialmente antes de responder las tres preguntas, se reproduce la secuencia "venta sin Discovery técnico" que originó la crisis de marzo–abril. [VERIFICADO]', tipo: 'problema' },
    { fecha: 'Fase 2 · frente 5', responsable: 'Paola Bárcenas',                            evento: 'CAMPAÑAS DE CHAT — Al reabrirse una conversación por respuesta a campaña no se asignaba automáticamente a un ejecutivo. Causa: faltaba activar "Asignación automática" en la bandeja; no fue falla de plataforma. Resuelto el mismo día de la consulta. [VERIFICADO]', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'Arkansas State University Campus Querétaro' },
    { label: 'Consecutivo',         value: 'F45' },
    { label: 'Sector',              value: 'Educación Superior – Universidad Privada' },
    { label: 'Contacto principal',  value: 'Daniel García Rojas Reyes – Director de Sistemas / Proyecto' },
    { label: 'Contacto operativo',  value: 'Guillermo Nava – usuario operativo (nuevo en Fase 2)' },
    { label: 'Contacto técnico',    value: 'Ana Pilar Cuellar Cabello – TI' },
    { label: 'Integrador externo',  value: 'Genjo (Court Avenue) – David Dettmer / Graham Vaughn' },
    { label: 'Plataforma anterior', value: 'Genesys (Voz) + Twilio + Apify Cloud (WhatsApp)' },
    { label: 'Tipo de cliente',     value: 'Enterprise AAA – Alto potencial de upsell' },
    { label: 'Frentes abiertos',    value: 'Facturación WhatsApp · Salesforce · Dialer de voz · Telefonía/Conmutador' },
    { label: 'Gestor de los 4 frentes', value: 'José Galván, en solitario — punto único de falla comercial' },
    { label: 'Conciliación de junio', value: '7,549 mensajes facturables sobre 13,294 enviados (Arkansas.xlsx)' },
  ],

  necesidad_negocio:
    'Arkansas State University conduce una transformación digital de su proceso de captación de estudiantes. Su modelo operativo combina campañas masivas de WhatsApp (gestionadas por el bot de IA de Genjo), seguimiento personalizado de ejecutivos humanos, y campañas de voz gestionadas por Genesys.\n\n' +
    'El objetivo central al contratar Callpicker Chat fue centralizar toda la operación de contactación digital en una sola plataforma, que permitiera a los agentes humanos retomar conversaciones iniciadas por el bot de IA, con visibilidad total y control de plantillas.\n\n' +
    'En Fase 2 la necesidad se amplía a tres dominios nuevos: registrar llamadas en Salesforce con un alcance que hoy no cubre su requerimiento, marcación consecutiva automática equivalente a Genesys Interaction Dialer, y un proyecto de telefonía con exigencias de escala —180,000 contactos y rotación de 25 DIDs— que todavía no tienen respuesta técnica.',

  potencial_corto: [
    'Cerrar por escrito la conciliación de facturación de WhatsApp: la evidencia ya existe y está entregada.',
    'Definir con el cliente el alcance real de Salesforce y agendar sesión específica con automatizaciones.',
    'Responder formalmente las tres preguntas de escalabilidad de telefonía antes de continuar la activación del Conmutador.',
    'Resolver las dudas técnicas de Ana Pilar (prefijo wa_, multimedia, API de nombres), pendientes desde Fase 1.',
  ],

  potencial_largo: [
    'Migración del canal de Voz desde Genesys (octubre 2026).',
    'Contrato a 5 años con ingresos recurrentes garantizados.',
    'Proyecto de telefonía / Conmutador, si se resuelve la escalabilidad antes de venderlo.',
    'Función de marcación consecutiva (dialer progresivo) como producto: la brecha es recurrente frente a clientes ex-Genesys, no exclusiva de Arkansas.',
    'El informe de verificación de facturación como plantilla replicable para otros clientes Enterprise.',
  ],

  tacticas: [
    { nombre: 'Activación de deuda moral (Fase 1)',        descripcion: 'Cita repetidamente "ustedes dijeron 10 minutos" para invalidar cotizaciones.', impacto: 'Pérdida de leverage comercial; el equipo cedió en márgenes.' },
    { nombre: 'Triangulación de autoridad (Fase 1)',       descripcion: 'Menciona a su jefa y a la Presidencia como figura intransigente ("ella no aprobará más inversión").', impacto: 'Urgencia artificial; equipo técnico bajo presión innecesaria.' },
    { nombre: 'Promesa de zanahoria (Fase 1)',             descripcion: 'Ofrece la migración de Genesys en octubre si se resuelve WhatsApp sin costo.', impacto: 'Incentivó concesiones técnicas de Ingeniería y Soporte.' },
    { nombre: 'Urgencia recurrente (confirmada en Fase 2)', descripcion: 'Reporta "aún no se resuelve" y presiona por contacto directo. José Galván describe el patrón como presión "por todos lados".', impacto: 'Consistente con la táctica ya documentada en Fase 1: no es nueva, es sostenida.' },
    { nombre: 'Inasistencia a reuniones (NUEVO en Fase 2)', descripcion: 'Daniel García no se conectó a una llamada agendada; el equipo esperó 15 minutos y reagendó. Daniel Martínez Loyola confirma que es recurrente.', impacto: 'Consume tiempo del equipo y desplaza los compromisos sin costo para el cliente.' },
    { nombre: 'Escalación en vivo (NUEVO en Fase 2)',      descripcion: 'Usa una sesión ya agendada para introducir un reclamo distinto al acordado — Salesforce durante una capacitación—, forzando respuesta sin preparación.', impacto: 'Obliga a improvisar frente al cliente. Se contrarresta confirmando agenda y alcance por escrito ANTES de cada sesión.' },
    { nombre: 'Contención sin sobreprometer (POSITIVO, Fase 2)', descripcion: 'En Salesforce, Paola Bárcenas comunicó de forma directa y temprana que el alcance actual "no resuelve su requerimiento", sin prometer una solución antes de tener claridad técnica.', impacto: 'Es el comportamiento a institucionalizar: exactamente lo contrario de la promesa de "10 minutos".' },
  ],

  senal_alarma:
    'Cuando el cliente menciona "mi jefa" o "Presidencia", está usando presión artificial para acelerar concesiones. Tratar como señal de escalación, no como urgencia real.\n\n' +
    '🔴 RIESGO PRINCIPAL DE FASE 2: si el proyecto de telefonía avanza comercialmente antes de responder las tres preguntas de escalabilidad, se reproduce la secuencia "venta sin Discovery técnico" que originó la crisis de marzo–abril, esta vez en una escala mayor.\n\n' +
    '⚠ Los cuatro frentes abiertos están concentrados en un solo gestor comercial (José Galván). Es un punto único de falla: cualquier ausencia o saturación suya deja los cuatro sin conductor.\n\n' +
    '⚠ No dar por cerrada la disputa de facturación sin confirmación ESCRITA del cliente. El documento de conciliación se envió más de una vez y no hay constancia de que el cliente quedara conforme; su propio método de conteo sigue sin documentarse.',

  problema_raiz:
    'Ausencia de proceso formal de Discovery para proyectos de integración con terceros y cuentas Enterprise — y, en Fase 2, la constatación de que el Discovery aplicado fue puntual al proyecto de mensajería, no sistémico a la cuenta ni a la empresa.',

  problema_raiz_detalle:
    'No se trató de un error aislado de una persona, sino de una cadena de decisiones tomadas bajo la lógica del "soporte reactivo" cuando la situación demandaba "arquitectura proactiva". La ausencia de un Discovery técnico previo a la venta fue el punto de origen de todos los problemas de Fase 1.\n\n' +
    'CONFIRMACIÓN EN FASE 2: la recomendación central de Fase 1 se aplicó al proyecto de mensajería, pero NO se extendió a Salesforce, al dialer de voz ni al proyecto de telefonía. El mismo patrón reaparece en cada dominio nuevo, lo que indica que el arreglo fue puntual al proyecto y no sistémico a nivel de cuenta ni de empresa.\n\n' +
    'La diferencia entre ambas fases importa para el diagnóstico: la Fase 1 fue una crisis única y concentrada; la Fase 2 son múltiples frentes de menor intensidad individual pero abiertos de forma simultánea, coordinados en su mayoría por una sola persona. Un fallo así no se manifiesta como una explosión sino como desgaste, y por eso es más fácil de no ver a tiempo.',

  flujo_real: [
    { fase: 'F1 · 1. Venta',              area: 'José Galván',              accion: 'Promesa de "10 min" sin Discovery.',                                  resultado: 'Expectativa irreal. Deuda moral.' },
    { fase: 'F1 · 2. Activación',         area: 'Edith Balderas',           accion: 'Trata el proyecto especial como bandeja QR estándar.',                 resultado: 'Falla silenciosa durante 2 semanas.' },
    { fase: 'F1 · 3. Escalación tardía',  area: 'Soporte → Ingeniería',     accion: 'Sólo escala al amenazar el cliente con cancelación.',                  resultado: 'Ingeniería entra en modo "apagar incendio".' },
    { fase: 'F1 · 4. Ingeniería reactiva',area: 'D. Avilés / Ricardo',      accion: 'Propone el Orquestador (98 h); descubre la falta de webhooks DLR.',    resultado: '$147k rechazados. 4 pivotes técnicos.' },
    { fase: 'F1 · 5. Cliente presiona',   area: 'Daniel García',            accion: 'WhatsApp, correos y reuniones en paralelo.',                           resultado: '6 canales activos. Equipo fragmentado.' },
    { fase: 'F1 · 6. Estabilización',     area: 'José Manuel / D. Martínez',accion: 'Intervención como árbitro de alcances.',                               resultado: 'Proyecto rescatado.' },
    { fase: 'F2 · Salesforce',            area: 'Ventas / Activaciones',    accion: 'Sesión agendada como "recorrido de plataforma".',                      resultado: 'ABIERTO — el cliente reclama en vivo esperar tratar Salesforce.' },
    { fase: 'F2 · Dialer de voz',         area: 'Producto / CS',            accion: 'Demo de la plataforma nativa.',                                        resultado: 'ABIERTO — el cliente compara contra Genesys; brecha funcional.' },
    { fase: 'F2 · Telefonía/Conmutador',  area: 'Activaciones',             accion: 'Ticket de activación de demo (#113740).',                              resultado: 'ABIERTO, RIESGO LATENTE — preguntas de escalabilidad sin responder.' },
    { fase: 'F2 · Facturación WhatsApp',  area: 'SAC / Fátima González',    accion: 'Documento de conciliación enviado 2 o más veces.',                     resultado: 'EN SEGUIMIENTO — el cliente insiste sin exponer su metodología.' },
  ],

  comparativo: [
    { metrica: 'Duración del proyecto (Fase 1)',        real: '35 días en crisis',                      ideal: '30-45 días en orden' },
    { metrica: 'Horas de Ingeniería no facturadas',     real: '40+ horas (aprox. $6,000 USD)',          ideal: '10 horas sólo de Discovery — ahorro aprox. $5,000 USD' },
    { metrica: 'Canales de comunicación activos',       real: '6 simultáneos (Slack, WhatsApp, correo)', ideal: '2: canal principal + escalación a SAC' },
    { metrica: 'Alcance de Discovery aplicado',         real: 'Sólo al proyecto de mensajería',          ideal: 'Extendido a telefonía, CRM y campañas de voz' },
    { metrica: 'Frentes abiertos en paralelo (Fase 2)', real: '4, con un solo gestor comercial',         ideal: 'Tablero único con un dueño por frente' },
    { metrica: 'Cierre de la disputa de facturación',   real: 'Documento enviado 2+ veces, sin confirmación escrita', ideal: 'Confirmación escrita del cliente sobre los 7,549 mensajes facturables' },
    { metrica: 'Preguntas de escalabilidad de telefonía', real: '3 sin respuesta documentada',           ideal: 'Respuesta técnica escrita ANTES de avanzar comercialmente' },
    { metrica: 'Encuadre de sesiones con el cliente',   real: 'Agenda no confirmada; el cliente la redefine en vivo', ideal: 'Agenda y alcance confirmados por escrito antes de iniciar' },
  ],

  plan_inmediato: [
    { accion: 'Cerrar por escrito la conciliación de facturación de WhatsApp con Daniel García y Guillermo Nava, usando el informe ya elaborado (7,549 mensajes facturables).', responsable: 'José Manuel + Fátima González', criterio: 'Confirmación escrita del cliente.' },
    { accion: 'Confirmar con Daniel García el alcance real de Salesforce y agendar una sesión específica con automatizaciones, con agenda confirmada por escrito.',            responsable: 'José Galván + Daniel Martínez Loyola', criterio: 'Documento de alcance firmado.' },
    { accion: 'Responder formalmente las tres preguntas de escalabilidad de telefonía ANTES de continuar la activación del Conmutador.',                                        responsable: 'Ingeniería + Toño del Río',    criterio: 'Respuesta técnica escrita entregada.' },
    { accion: 'Resolver las dudas técnicas pendientes de Ana Pilar (prefijo wa_, multimedia, API de nombres), abiertas desde Fase 1.',                                          responsable: 'David Avilés + Ricardo + Soporte', criterio: 'Respuesta en 24 horas.' },
  ],

  plan_mediano: [
    { accion: 'Evaluar viabilidad y costo de la función de marcación consecutiva (dialer progresivo) y decidir si es desarrollo a medida o roadmap de producto.', responsable: 'Ingeniería – Producto',              criterio: 'Documento de factibilidad con estimado de horas.' },
    { accion: 'Formalizar el modelo de trabajo de Salesforce: ¿desarrolla Callpicker o el cliente vía API?',                                                     responsable: 'José Galván + Joaquín A. Martínez F.', criterio: 'Acuerdo documentado y compartido.' },
    { accion: 'Extender el Checklist de Discovery a telefonía, CRM y campañas de voz.',                                                                          responsable: 'Daniel Martínez Loyola + José Manuel', criterio: 'Checklist ampliado y confirmado por área.' },
    { accion: 'Confirmar el presupuesto de desarrollo de Genjo y validar la documentación técnica entregada.',                                                   responsable: 'José Galván',                        criterio: 'Presupuesto recibido, sin dudas adicionales.' },
  ],

  plan_estrategico: [
    { accion: 'Diseñar un hilo de seguimiento consolidado para los 4 frentes abiertos, en vez de que un solo gestor los sostenga por separado.', responsable: 'SAC + Ventas',          criterio: 'Tablero único con dueño por frente.' },
    { accion: 'Desarrollar los Webhooks DLR (entregado/leído) como producto core — pendiente desde Fase 1.',                                     responsable: 'Ingeniería – Producto', criterio: 'Feature disponible para toda la cartera.' },
    { accion: 'Usar el informe de verificación de facturación de Arkansas como plantilla replicable para otros clientes Enterprise.',            responsable: 'SAC',                   criterio: 'Plantilla documentada en repositorio.' },
    { accion: 'Documentar Arkansas como caso de "Discovery parcial": qué se corrigió y qué se repitió.',                                         responsable: 'SAC + Marketing',       criterio: 'Caso publicado internamente.' },
  ],

  areas_oportunidad: [
    { area: 'Cierre formal del frente de facturación',            impacto: 'Muy alto — la evidencia ya existe y está entregada; sólo falta la confirmación escrita del cliente.', responsable: 'José Manuel + Fátima González' },
    { area: 'Extensión del Discovery a telefonía, CRM y voz',     impacto: 'Muy alto — es lo que evita que el proyecto de Conmutador repita la crisis de marzo–abril a mayor escala.', responsable: 'Daniel Martínez Loyola + José Manuel' },
    { area: 'Hilo de seguimiento único para los 4 frentes',       impacto: 'Alto — elimina el punto único de falla que hoy representa un solo gestor comercial.', responsable: 'SAC + Ventas' },
    { area: 'Función de marcación consecutiva (dialer)',          impacto: 'Alto — la brecha frente a clientes ex-Genesys es recurrente, no exclusiva de Arkansas.', responsable: 'Ingeniería – Producto' },
    { area: 'Webhooks DLR (entrega/lectura)',                     impacto: 'Alto — estándar de industria aún no implementado, pendiente desde Fase 1.', responsable: 'Ingeniería (Producto Core)' },
    { area: 'Separación de factura (Meta + plataforma + envío)',  impacto: 'Medio-alto — mejora de transparencia aplicable a toda la cartera, no sólo a esta cuenta.', responsable: 'Dirección Comercial + Facturación' },
    { area: 'Encuadre escrito de cada sesión con el cliente',     impacto: 'Medio — neutraliza la escalación en vivo, patrón nuevo confirmado en Fase 2.', responsable: 'Ventas + SAC' },
  ],

  perfiles: [
    {
      nombre: 'Daniel García Rojas Reyes', rol: 'Cliente (Arkansas) — Director de Sistemas / Decisor operativo y presupuestal', color: '#ef4444',
      campos: [
        { label: 'Motivación primaria',   value: 'Salvar su reputación ante su directora y la Presidencia de la Universidad.' },
        { label: 'Motivación secundaria', value: 'Obtener el máximo valor de Callpicker con la menor inversión adicional posible.' },
        { label: 'Estilo negociador',     value: 'Sofisticado. Usa el "error inicial" como palanca. Empático en la forma; inflexible en el fondo.' },
        { label: 'Táctica observada',     value: 'Deuda moral + triangulación de autoridad + promesa de zanahoria (Voz en octubre).' },
        { label: 'Confirmado en Fase 2',  value: 'Patrón de inasistencia a reuniones agendadas; escalación en vivo de temas no acordados (Salesforce durante una capacitación). [VERIFICADO]' },
        { label: 'Señal de alarma',       value: 'Cuando menciona "mi jefa" o "Presidencia", está usando presión artificial para acelerar concesiones.' },
        { label: 'Recomendación',         value: 'Confirmar agenda y alcance de cada sesión POR ESCRITO antes de que inicie.' },
      ],
    },
    {
      nombre: 'Guillermo Nava', rol: 'Cliente (Arkansas) — Usuario operativo · NUEVO en Fase 2', color: '#f97316',
      campos: [
        { label: 'Rol observado',   value: 'Actúa como brazo operativo mientras Daniel García concentra la relación estratégica.' },
        { label: 'Solicitudes',     value: 'Pide agentes adicionales de chat y cuestiona directamente el reporte de consumo de WhatsApp.' },
        { label: 'Es además',       value: 'Contacto del cliente en el ticket de activación de demo del Conmutador (#113740).' },
        { label: 'Recomendación',   value: 'Incluirlo de forma explícita en la conciliación de facturación: hoy cuestiona sin estar en la mesa donde se resuelve.' },
      ],
    },
    {
      nombre: 'José Galván', rol: 'Ventas — Gestor de cuenta; primer punto de contacto comercial', color: '#f59e0b',
      campos: [
        { label: 'Error crítico (Fase 1)', value: '"Será cuestión de 10 minutos", dicho sin consultar a Ingeniería.' },
        { label: 'Estilo de trabajo',      value: 'Optimista y carismático. Promete antes de validar. Media tensiones con humor.' },
        { label: 'Confirmado en Fase 2',   value: 'Concentra en solitario la coordinación de los 4 frentes abiertos: riesgo de sobrecarga de un único punto de falla comercial. [VERIFICADO]' },
        { label: 'Reconocimiento propio',  value: 'Admite "teléfono descompuesto" en la comunicación del modelo de trabajo de Salesforce.' },
        { label: 'Área de mejora',         value: 'Discovery técnico pre-venta obligatorio; distribuir el seguimiento entre más de una persona.' },
      ],
    },
    {
      nombre: 'Paola Bárcenas', rol: 'Soporte / Producto — NUEVO en Fase 2', color: '#22c55e',
      campos: [
        { label: 'Aporte',                     value: 'Resuelve con rapidez temas de configuración: el caso de asignación automática se cerró el mismo día de la consulta, sin escalar.' },
        { label: 'Comunicación de límites',    value: 'Comunicó de forma directa y temprana que el alcance actual de Salesforce "no resuelve su requerimiento", sin prometer una solución antes de tener claridad técnica. [VERIFICADO]' },
        { label: 'Por qué importa',            value: 'Es exactamente lo contrario de la promesa de "10 minutos" que originó la crisis. Comportamiento a institucionalizar.' },
      ],
    },
    {
      nombre: 'Enrique Gudiño', rol: 'Activaciones — NUEVO en Fase 2', color: '#3b82f6',
      campos: [
        { label: 'Aporte',      value: 'Documenta con precisión y de forma proactiva la falla de alineación de expectativas previa a la sesión de Salesforce.' },
        { label: 'Conducta',    value: 'Escalamiento transparente, sin minimizar el problema.' },
        { label: 'Valor',       value: 'Gracias a ese registro el hallazgo 05 de Fase 2 es verificable y no una interpretación posterior.' },
      ],
    },
    {
      nombre: 'Alberto David Avilés Reyna', rol: 'Ingeniería — Consultor técnico y Project Manager', color: '#6366f1',
      campos: [
        { label: 'Estilo inicial (Fase 1)', value: 'Reactivo y bloqueador. Táctica: "no es nativo de Chatwoot" para invalidar solicitudes.' },
        { label: 'Giro (14 Abr)',           value: 'Entregó documentación técnica completa y activó el autoservicio de plantillas. Pasó de bloqueador a solucionador.' },
        { label: 'Pendiente en Fase 2',     value: 'Las dudas técnicas de Ana Pilar (prefijo wa_, multimedia, API de nombres) siguen abiertas desde Fase 1.' },
        { label: 'Área de mejora',          value: 'Proponer opciones (A, B, C) en lugar de cerrar con "no es posible".' },
      ],
    },
    {
      nombre: 'Antonio (Toño) del Río', rol: 'Operaciones / Customer Success — Supervisor y punto de escalación', color: '#8b5cf6',
      campos: [
        { label: 'Frase clave (Fase 1)',  value: '"Tengan cuidado de no volverse esclavos de los clientes".' },
        { label: 'Confirmado en Fase 2',  value: 'Identifica la brecha funcional del módulo de Campañas frente a Genesys y aporta el contexto de que es un patrón recurrente con otros clientes.' },
        { label: 'Implicación',           value: 'La brecha del dialer no es una objeción de Arkansas: es una carencia de producto que reaparece con cada cliente ex-Genesys.' },
      ],
    },
    {
      nombre: 'Daniel Martínez Loyola', rol: 'Director de UX — Árbitro de alcances', color: '#22c55e',
      campos: [
        { label: 'Aportación clave (Fase 1)', value: 'Invitó a José Manuel al canal de Slack, detonando la intervención de UX que salvó la cuenta.' },
        { label: 'Confirmado en Fase 2',      value: 'Cubre la cuenta durante ausencias de José Manuel; identifica el riesgo de "teléfono descompuesto" en el modelo de trabajo de Salesforce.' },
        { label: 'Potencial',                 value: 'Liderar la extensión del Discovery a telefonía, CRM y voz junto con José Manuel.' },
      ],
    },
    {
      nombre: 'Joaquín Alejandro Martínez Fernández', rol: 'Dirección Comercial — NUEVO en Fase 2', color: '#94a3b8',
      campos: [
        { label: 'Decisión atribuida', value: 'Autorizó la separación de factura en costo de Meta, fee de plataforma y costo por envío. Referencia a conversación de ~agosto.' },
        { label: 'Nivel de evidencia', value: '[HIPÓTESIS] — su participación se conoce sólo por referencia de terceros; no hay mensaje directo suyo en el extracto de Slack.' },
        { label: 'Qué falta',          value: 'Confirmar con él la decisión antes de citarla como acuerdo firme frente al cliente.' },
      ],
    },
    {
      nombre: 'José Manuel (920)', rol: 'Dirección de Satisfacción al Cliente', color: '#0057FF',
      campos: [
        { label: 'Continuidad',   value: 'Sigue siendo el punto de cierre de la disputa de facturación y de las quejas directas del cliente.' },
        { label: 'Delegación',    value: 'Delega en Daniel Martínez Loyola durante ausencias.' },
        { label: 'Acción a su cargo', value: 'Cerrar por escrito la conciliación de facturación junto con Fátima González, y extender el Checklist de Discovery.' },
      ],
    },
    {
      nombre: 'Edith Betzabet Balderas Padilla', rol: 'Soporte / Activaciones — Fase 1', color: '#3b82f6',
      campos: [
        { label: 'Error crítico',     value: 'Trató una integración personalizada (Genjo + Twilio) como una activación estándar de bandeja QR.' },
        { label: 'Impacto observado', value: 'El cliente percibió abandono. Edith recibió la fricción generada por decisiones de otras áreas.' },
        { label: 'Para Dirección',    value: 'Su agotamiento fue indicador de falla de sistema, no personal: faltaba un protocolo de escalación para cuentas Enterprise.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Lealtad emocional del cliente: "Nos encanta Callpicker".',
      'Adopción operativa alta: 30+ ejecutivos, 16+ bandejas activas.',
      'Alineación UX–Ingeniería, con UX como árbitro estratégico.',
      '(Nuevo, Fase 2) Resolución rápida de temas de configuración sin escalar — caso de asignación automática.',
      '(Nuevo, Fase 2) Comunicación de límites de alcance sin sobreprometer — caso Salesforce.',
    ],
    oportunidades: [
      'Migración de voz Genesys → Callpicker (octubre 2026).',
      'Contrato a 5 años con ingresos recurrentes garantizados.',
      '(Nuevo, Fase 2) Informe de verificación de facturación de WhatsApp ya elaborado y defendible: plantilla replicable.',
      '(Nuevo, Fase 2) Separación de factura (Meta + plataforma + envío) como mejora de transparencia aplicable a toda la cartera.',
    ],
    debilidades: [
      'Carencia de webhooks DLR: estándar de industria no implementado.',
      'Silos entre Ventas, Ingeniería y Soporte.',
      '(Nuevo, Fase 2) El Discovery institucionalizado en Fase 1 no se extendió a Salesforce, dialer de voz ni al proyecto de telefonía.',
      '(Nuevo, Fase 2) Falta de función de marcación consecutiva (dialer): brecha recurrente frente a clientes ex-Genesys.',
    ],
    amenazas: [
      'Genjo podría construir una solución propia y desplazar a Callpicker.',
      'Precedente: ceder en costos puede repetirse si no se sistematizan procesos.',
      '(Nuevo, Fase 2) La concentración de 4 frentes abiertos en un solo gestor comercial incrementa el riesgo de nuevos descuidos.',
      '(Nuevo, Fase 2) El proyecto de telefonía podría avanzar comercialmente antes de resolver las preguntas de escalabilidad.',
    ],
  },

  conclusion:
    'La Fase 1 demostró que la intervención de la Dirección de Satisfacción al Cliente puede rescatar una cuenta en crisis. La Fase 2 demuestra algo distinto y más importante desde una perspectiva sistémica: el arreglo aplicado en Fase 1 fue específico al proyecto de mensajería, no a la cuenta ni a la empresa.\n\n' +
    'El mismo patrón raíz —compromisos o sesiones mal encuadradas antes de una validación técnica— reaparece de forma independiente en Salesforce, en el dialer de voz y en el proyecto de telefonía, cada uno gestionado por distintas personas sin un hilo conductor único. Eso convierte a Arkansas en un caso de "Discovery parcial": vale tanto por lo que se corrigió como por lo que se repitió.\n\n' +
    '⚠ SOBRE EL USO DE ESTE INFORME: la cronología de Fase 2 no lleva fechas de calendario porque el extracto de Slack sólo conserva la hora del día. Nada de lo marcado [HIPÓTESIS] o [VACÍO] debe presentarse al cliente como hecho establecido — en particular, no debe darse por cerrada la disputa de facturación sin confirmación escrita, ni citarse como acuerdo firme la separación de factura atribuida a Dirección Comercial.',

  pierde: [
    'Un cliente Enterprise con potencial multianual y contrato a 5 años.',
    'La migración de Genesys (canal de voz) prevista para octubre.',
    'La credibilidad en el sector universitario.',
    'El proyecto de telefonía, si avanza sin resolver la escalabilidad y repite la crisis a mayor escala.',
    'Horas de equipo absorbidas por cuatro frentes sostenidos en paralelo por una sola persona.',
  ],

  gana: [
    'Contrato de 5 años con ingresos recurrentes.',
    'Expansión a voz, CRM e integración completa.',
    'Un Checklist de Discovery extendido a telefonía, CRM y voz — que evita la próxima crisis en toda la cartera, no sólo aquí.',
    'Webhooks DLR y marcación consecutiva como producto: dos carencias que hoy reaparecen con cada cliente ex-Genesys.',
    'El informe de verificación de facturación como plantilla replicable para clientes Enterprise.',
  ],

  recomendacion_central:
    '(1) Cerrar formalmente y por escrito el frente de facturación de WhatsApp, que ya cuenta con evidencia y documento de verificación suficientes — 7,549 mensajes facturables sobre 13,294 enviados en el corte de junio. ' +
    '(2) Extender el Checklist de Discovery, ya probado en el proyecto de mensajería, a telefonía, CRM y voz ANTES de que el proyecto de Conmutador o el requerimiento de dialer repitan, en una escala mayor, la crisis documentada en Fase 1. ' +
    'Y responder las tres preguntas de escalabilidad de telefonía antes de cualquier avance comercial: ése es hoy el riesgo latente más caro de la cuenta.',

  documentos: [
    {
      nombre:      'Auditoría Interna · Arkansas State University Campus Querétaro — v2.0',
      ruta:        '/docs/Auditoria_Arkansas_v2.0.docx',
      descripcion: 'Dirección de Satisfacción al Cliente, 8 Sep 2026. Integra la Fase 1 (mar–abr) con la Fase 2 (may–7 sep) reconstruida del canal de Slack #arkansas-cq. Documento de uso interno — no distribuir al cliente. Cada hallazgo lleva su etiqueta de confianza [VERIFICADO] / [HIPÓTESIS] / [VACÍO].',
    },
    {
      nombre:      'Arkansas.xlsx — Corte de junio, conciliación de mensajería WhatsApp',
      ruta:        '/docs/Auditoria_Arkansas_v2.0.docx',
      descripcion: 'Referencia citada en el informe: sustenta el Informe de Verificación de Facturación WhatsApp de junio 2026 entregado al cliente (7,549 mensajes facturables sobre 13,294 enviados). Otros documentos de referencia del caso: correo de envío del informe al cliente, diagramas de arquitectura (español e inglés), grabación de la sesión de capacitación (arkansas.mp4), manual de la integración Callpicker–Salesforce en Outline, transcripción del canal Slack #arkansas-cq y tickets #113739 / #113740.',
    },
  ],
}
