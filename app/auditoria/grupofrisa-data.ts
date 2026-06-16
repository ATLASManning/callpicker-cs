import type { AuditoriaCase } from './types'

export const GRUPOFRISA: AuditoriaCase = {
  id: 'grupofrisa',
  nombre: 'Grupo FRISA / ACISA',
  sector: 'Desarrollo Inmobiliario — Comercial, Industrial, Residencial, Turístico',
  fecha_periodo: 'Marzo 2025 – Junio 2026',
  fecha_auditoria: 'Jun 2026',
  tipo_cliente: 'Enterprise — Cuenta Estratégica Activa · CID 168973',
  descripcion_contexto: '15 meses documentados · Auditoría Integral · AV Voz + Chat + Salesforce + WA API · +50 plazas en +15 estados',
  estado: 'activo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'MRR activo',           value: '$13,955 + IVA',  color: '#1B3FCC' },
    { label: 'Horas proyecto',       value: '159 / 160 hrs',  color: '#ef4444' },
    { label: 'Scope creep episodes', value: '7 documentados', color: '#f59e0b' },
    { label: 'Health Score',         value: '50 / 100',       color: '#f97316' },
  ],

  resumen_ejecutivo: 'Grupo FRISA es una de las cuentas más complejas y estratégicamente valiosas del portafolio de Callpicker. No es una cuenta en riesgo de churn — es una cuenta con fricciones activas que, si no se gestionan con precisión, pueden convertirse en desgaste irreparable.\n\nEl problema no es técnico. La tecnología funciona: el AV opera, la integración con Salesforce está entregada, y el AV Chat está al 95% listo para producción. El problema es de gobierno de cuenta: ausencia de un protocolo claro de alcances, comunicación fragmentada, y un cliente que aprendió que la presión informal produce resultados.\n\nAl 15 de junio de 2026: AV Chat listo para producción (pendiente VoBo final), AV Voz pausado al 90%, integración Salesforce operativa. Contrato activo hasta dic 2026. Presupuesto 2027 ya en conversación.',

  resultado_positivo: 'El cliente siempre ha pagado a tiempo y en su totalidad, incluyendo un pago extraordinario de $305,800 MXN en cheque (feb 2026). Aprobó la renovación de contrato y el upsale de mayo 2026 sin objeción mayor. A pesar de las fricciones, mantiene la relación activa y no ha amenazado con cancelar el servicio.\n\nEl equipo técnico de Callpicker demostró capacidad para resolver proyectos de alta complejidad: migración de Landbot a AV inteligente, integración Salesforce bidireccional, catálogo dinámico vía Google Sheets, 13 calendarios, multi-destino de voz. La nueva política de tolerancia cero para trabajo fuera de alcance (desde 29 abr 2026) es la respuesta correcta y ya está implementada.',

  hallazgos: [
    'Patrón de expansión de alcance progresiva sin autorización: 7 episodios documentados en 15 meses. El cliente presenta solicitudes fuera de alcance como si fueran compromisos previos o funcionalidades evidentes.',
    'Crisis de 32 horas ejecutadas sin autorización explícita (abr 2026) — scope creep aplicado sobre AV Voz dentro de proyecto AV Outbound. Se absorbió internamente con nueva política de tolerancia cero.',
    'Horas del proyecto casi agotadas (159/160) con AV Voz pausado al 90% — margen cero para imprevistos. El saldo adicional de 65 hrs está intacto pero no cubre completar AV Voz sin cotización nueva.',
    'AV Outbound con 47.7% de no contestadas (abr-jun 2026) — casi la mitad de las 1,872 llamadas salientes. Requiere análisis de franja horaria y perfil de base de datos.',
    'Tasa de pérdida entrante escaló a 14.5% (mar) y 15.0% (abr) — coincide exactamente con crisis "Real del Lago" (AV con transferencias fallidas). La mejora a 6.5% en mayo confirma que los ajustes funcionaron.',
    'Único punto de contacto crítico: solo José Antonio Romero. Si sale, la relación se fragiliza sin interlocutor calificado.',
    'Comunicación dispersa en múltiples canales simultáneos: WhatsApp directo con ingeniería, correo con PM, tickets Zoho Desk, llamadas directas a asesores — sin canal único acordado.',
    'Health Score 50/100 — zona de alerta sin revisión activa reciente. Campos de adopción en blanco en CRM.',
    '64.2% de las llamadas entrantes (643 de 1,002) son gestionadas por el AV sin transferir a humano — indicativo de que el AV filtra prospectos reales. Las llamadas ≤1 min representan el 52.2% del tráfico.',
    'Fuente de datos personalizada de conciliación solicitada como condición para salir a producción (jun 2026) — nuevo scope creep negociado: lanzar AV Chat primero, levantar requerimiento después.',
    'Desarrollo improvisado "Real del Lago" añadido al prompt sin integración Salesforce generó fallas de transferencia en producción (mar 2026).',
    'José Galván concentra demasiados roles: comercial, soporte e ingeniería. Genera dependencia y cuello de botella. Fátima González aparece poco después de los primeros meses — rol difuso.',
  ],

  cronologia: [
    { fecha: 'Mar 2025',       responsable: 'Galván / Equipo',          evento: 'Apertura de cuenta CID 168973. Canal Slack creado. Proyecto en 3 etapas: Config CP+Chat, AV básico, Integración Salesforce. Pago inicial recibido.', tipo: 'ok' },
    { fecha: 'Mar–Abr 2025',   responsable: 'Equipo técnico',           evento: 'Activación conmutador y CP Chat. Contrato sin firmar por cláusula Décima Primera (pena convencional 50% excesiva). WhatsApp activo: 5588544458.', tipo: 'neutral' },
    { fecha: 'Abr–May 2025',   responsable: 'Cliente / Ingeniería',     evento: 'Primer scope creep: AV básico configurado como IVR pero cliente quiere AV 1.0 primero. 13 calendarios configurados. AV instalado en pruebas.', tipo: 'problema' },
    { fecha: 'May–Jun 2025',   responsable: 'David Avilés',             evento: 'Primera versión del AV en producción. VoBo del documento de alcance obtenido con dificultad. Cliente ya muestra patrón de pedir fuera de alcance ("como en Acciona").', tipo: 'neutral' },
    { fecha: 'Jul–Sep 2025',   responsable: 'Ingeniería / Cliente',     evento: 'Entrega integración Chat-Salesforce y AV Voz. Bugs: asignación de propietarios incorrecta. AV dice "H,O,L,A" en lugar de "Hola". Scope creep asignación bidireccional absorbido.', tipo: 'problema' },
    { fecha: 'Oct–Nov 2025',   responsable: 'Ingeniería',               evento: 'Problemas recurrentes con AV de Voz: palabras clave mal interpretadas (Sayaves vs Sayavedra). Chat Bot con WA QR presenta intermitencias. Landbot muestra limitaciones.', tipo: 'problema' },
    { fecha: 'Dic 2025',       responsable: 'Ingeniería / Cliente',     evento: 'Diagnóstico: mensajes FB Ads no llegan a CP Chat por librería QR desactualizada. Plan de migración a WA API inicia. Cliente presiona cambios en Landbot sin pagar.', tipo: 'problema' },
    { fecha: 'Ene–Feb 2026',   responsable: 'David / Galván',           evento: 'Reunión Fathom (27 feb): causa raíz FB Ads confirmada. Plan: migrar a WA API oficial. VoBo del cliente recibido. Pago $240,000 + $65,800 de saldo adicional recibido.', tipo: 'pivote' },
    { fecha: 'Mar 2026',       responsable: 'Fathom / Ingeniería',      evento: 'Reunión Fathom (30 mar): falla "Real del Lago" en AV de Voz — desarrollo improvisado sin Salesforce. Solución: catálogo dinámico Google Sheets. AV Chat migrado de Landbot.', tipo: 'problema' },
    { fecha: 'Abr 2026',       responsable: 'Equipo / Galván',          evento: 'CRISIS: 32 horas del presupuesto extra usadas sin autorización. Reunión Fathom (29 abr): absorber horas, reasignar 25 al proyecto base, cubrir 7 a costo. Nueva política tolerancia cero.', tipo: 'problema' },
    { fecha: 'May–Jun 2026',   responsable: 'David / Cliente',          evento: 'Desarrollo activo: AV Chat al 95%, AV Voz pausado al 90%. Horas casi agotadas (159/160). Nuevo scope creep: fuente de datos conciliación. Negociado: lanzar AV Chat primero.', tipo: 'neutral' },
    { fecha: '15 Jun 2026',    responsable: 'Dir. Experiencia al Cliente', evento: 'Estado al cierre de auditoría: AV Chat listo para producción (pendiente VoBo final). AV Voz pausado. Integración Salesforce operativa. MRR $13,955. Contrato activo dic 2026.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Grupo FRISA / ACISA' },
    { label: 'Sector',               value: 'Desarrollo Inmobiliario — Comercial, Industrial, Residencial, Turístico' },
    { label: 'Sede corporativa',     value: 'Blvd. Magnocentro 26, Piso 5, Interlomas, Huixquilucan, Edo.Méx.' },
    { label: 'Presencia nacional',   value: '+50 plazas en +15 estados | Marcas: Plaza Sendero, Paseo, City Center, Explanada' },
    { label: 'Contacto principal',   value: 'José Antonio Romero Reyes ("Pepe Toño") — Gerente de Sistemas / TI' },
    { label: 'Email / Tel',          value: 'jaromero@grupofrisa.com | +52 55 5102 3829' },
    { label: 'CID Callpicker',       value: 'CID 168973 (activo con AV) | CID ~171 (legacy Locales Comerciales)' },
    { label: 'Contrato vigente',     value: 'Activo hasta diciembre 2026. Renovación ene-dic 2027 en conversación.' },
    { label: 'MRR total',            value: '$13,955 + IVA | Pago extraordinario: $305,800 MXN en cheque (feb 2026)' },
  ],

  necesidad_negocio: 'Grupo FRISA requiere un ecosistema de comunicación integral para su operación inmobiliaria a escala nacional: gestión de prospectos entrantes vía AV de Voz con transferencia inteligente a asesores, seguimiento de leads en Salesforce, campañas de prospección vía AV Outbound, y atención por WhatsApp API.\n\nEl objetivo al contratar Callpicker fue centralizar la operación omnicanal (Voz + Chat + WhatsApp) en una plataforma única integrada con Salesforce — su CRM corporativo. La escala del cliente (+50 plazas, múltiples marcas) exige un AV robusto que no haga quedar mal a FRISA frente a sus propios prospectos.',

  potencial_corto: [
    'Lanzar AV Chat a producción con VoBo formal esta semana — recupera confianza tangible',
    'Estimar horas restantes para AV Voz y presentar cotización adicional en 7 días',
    'Coordinar migración WA API (upsale ya autorizado) al retorno del cliente de vacaciones',
    'Agendar sesión de levantamiento para fuente de datos de conciliación (10 días)',
    'Actualizar Health Score y campos de adopción en CRM — tarea inmediata de Fátima',
  ],
  potencial_largo: [
    'Renovación anual 2027 (ene-dic): intención confirmada — ~$167,460 MXN/año asegurado',
    'Migración WA API oficial: upsale en MRR ya con VoBo del cliente',
    'Nuevo DID + integración Salesforce: cotización pendiente',
    'Fuente de datos personalizada de conciliación: nuevo proyecto facturado',
    'Calendario de guardias en CP Chat: módulo/add-on documentado',
    'Cuenta legacy Centros Comerciales (CID ~171): análisis + propuesta de integración',
    'Replicar modelo AV complejo en otras plazas o unidades de negocio del grupo',
  ],

  tacticas: [
    { nombre: 'Reescritura de historia', descripcion: 'Presenta solicitudes fuera de alcance como compromisos previos o funcionalidades evidentes. Cuando Callpicker cede sin documentación, el cliente lo interpreta como precedente.', impacto: '7 episodios de scope creep — 32 hrs absorbidas sin costo en el más crítico (abr 2026)' },
    { nombre: 'Benchmark ACCIONA', descripcion: 'Usa "como en Acciona" o "así lo tenían en Acciona" como argumento en al menos 4 momentos para solicitar funcionalidades fuera de alcance.', impacto: 'Expectativa de servicio que puede no corresponder al alcance contratado — pero también ventana de upsale si la funcionalidad existe' },
    { nombre: 'Urgencia informal', descripcion: 'Presiona con informalidad (WhatsApp directo a ingeniería) y urgencia para obtener trabajo fuera de alcance antes de que se formalice el cambio.', impacto: 'Desvía recursos de ingeniería sin pasar por proceso comercial. Nuevo protocolo tolerancia cero mitiga esto.' },
    { nombre: 'Canal fragmentado', descripcion: 'Usa simultáneamente WhatsApp con ingeniería, correo con PM, tickets Zoho Desk y llamadas directas — sin canal único acordado.', impacto: 'El equipo no sabe a quién escalar; el cliente tampoco. Genera retrasos y malentendidos.' },
  ],
  senal_alarma: 'Cuando el cliente menciona "esto debería estar incluido", "como en Acciona", o solicita cambios dentro de una sesión de demostración sin estimación previa — señal de inicio de scope creep. Tratar como escalación inmediata: estimación en horas + costo + VoBo escrito ANTES de ejecutar. Sin excepción.',

  problema_raiz: 'Ausencia de protocolo formal de gobierno de alcances — el cliente aprendió en 15 meses que la presión informal produce resultados',
  problema_raiz_detalle: 'No fue un error aislado: fue un patrón que se consolidó en 7 episodios documentados. Cada vez que el cliente presentó una solicitud fuera de alcance como si fuera obvia o prometida, el equipo cedió o absorbió el costo sin VoBo escrito. El equipo lo reconoce explícitamente: "se sabe que FRISA aprovecha las brechas del proceso" (Fathom 29 abr 2026). La política de tolerancia cero implementada el 29 abr 2026 es correcta — el desafío es sostenerla con un cliente que presiona con informalidad y urgencia. La comunicación fragmentada en múltiples canales agrava el problema: sin canal único, no hay registro auditble de qué se acordó.',

  flujo_real: [
    { fase: '1. Apertura (Mar 2025)',         area: 'Galván / Cliente',        accion: 'Cuenta abierta, proyecto en 3 etapas bien definidas',             resultado: 'Base técnica sólida. Pero sin protocolo de cambios desde el inicio.' },
    { fase: '2. Primer scope creep (Abr 2025)', area: 'Cliente',               accion: 'AV básico configurado como IVR — cliente pide AV 1.0',            resultado: 'Se absorbe el cambio. El patrón queda establecido.' },
    { fase: '3. Bugs y fricciones (Jul–Nov 2025)', area: 'Ingeniería / Cliente', accion: 'Errores en AV Voz, asignación bidireccional absorbida, Landbot con limitaciones', resultado: 'Desgaste acumulado. Cliente molesto por demoras.' },
    { fase: '4. Nuevo proyecto (Feb 2026)',    area: 'Galván / David',          accion: 'Pago $305,800 recibido. AV Outbound + migración Bot a AV Chat iniciados', resultado: 'Relación renovada. Pero sin VoBo más estricto desde el inicio.' },
    { fase: '5. Crisis 32 hrs (Abr 2026)',    area: 'Ingeniería sin supervisión', accion: '32 hrs ejecutadas sin autorización dentro de proyecto AV Outbound', resultado: 'CRISIS comercial. Absorción de costo. Nueva política tolerancia cero.' },
    { fase: '6. Cierre de auditoría (Jun 2026)', area: 'David / Cliente',       accion: 'AV Chat 95%, AV Voz pausado, Salesforce operativo',               resultado: 'Cuenta activa y con potencial, pero en zona de alerta por horas agotadas.' },
  ],

  comparativo: [
    { metrica: 'Protocolo de cambios',       real: 'Verbal o por WhatsApp — sin VoBo escrito antes de ejecutar',    ideal: 'Estimación + costo + VoBo escrito firmado ANTES de iniciar cualquier trabajo fuera de alcance' },
    { metrica: 'Canal de comunicación',      real: 'WhatsApp directo a ingeniería + correo + tickets + llamadas',   ideal: 'Canal único acordado (grupo WhatsApp oficial) con registro auditble' },
    { metrica: 'Health Score',               real: '50/100 — campos de adopción en blanco',                          ideal: 'Revisión formal con HS actualizado y campos de adopción completos' },
    { metrica: 'Horas proyecto',             real: '159/160 agotadas — AV Voz al 90% sin completar',                ideal: 'Cotización adicional presentada ANTES de agotar horas' },
    { metrica: 'AV Outbound no contestadas', real: '47.7% no contestadas (893 de 1,872 llamadas)',                   ideal: 'Análisis de franja horaria + perfil de base de datos para optimizar' },
    { metrica: 'Contactos en la cuenta',     real: 'Solo José Antonio Romero — sin contacto secundario registrado', ideal: 'Contacto secundario o sucesor TI identificado y registrado en CRM' },
    { metrica: 'Reporte al cliente',         real: 'Sin dashboard o reporte de conciliación para su dirección',      ideal: 'Reporte semanal de actividad AV (aunque sea manual al inicio)' },
  ],

  plan_inmediato: [
    { accion: 'Lanzar AV Chat a producción con protocolo de soporte inmediato post-go-live (primeras 72 horas críticas)', responsable: 'David Avilés + José Galván', criterio: 'VoBo firmado del cliente + soporte en standby primera semana' },
    { accion: 'Estimar horas restantes para completar AV Voz al 100% y presentar cotización adicional formal', responsable: 'David Avilés', criterio: 'Estimación enviada al cliente en máximo 7 días' },
    { accion: 'Actualizar Health Score y completar campos de adopción en CRM de Callpicker', responsable: 'Fátima González', criterio: 'HS actualizado con todos los campos de adopción completos — esta semana' },
    { accion: 'Consolidar comunicación de soporte en canal único: grupo WhatsApp oficial acordado con el cliente', responsable: 'Fátima González', criterio: 'Canal único activo y comunicado al cliente esta semana' },
  ],

  plan_mediano: [
    { accion: 'Coordinar migración WA API con el cliente al retorno de vacaciones — upsale ya autorizado', responsable: 'José Galván / Fátima González', criterio: 'Fecha de inicio confirmada y agenda técnica enviada' },
    { accion: 'Agendar sesión de levantamiento de requerimientos para fuente de datos de conciliación', responsable: 'Fátima González + David Avilés', criterio: 'Sesión realizada y requerimiento formal documentado en 10 días' },
    { accion: 'Análisis de tasa de no contestadas en AV Outbound — reporte con recomendaciones de franja horaria y perfil de base', responsable: 'David Avilés / Ingeniería', criterio: 'Reporte entregado al cliente en 14 días' },
    { accion: 'Registrar contacto secundario en Grupo FRISA para continuidad de la relación', responsable: 'José Galván', criterio: 'Contacto secundario TI identificado y registrado en CRM en próxima reunión' },
  ],

  plan_estrategico: [
    { accion: 'Presentar propuesta formal de renovación 2027 (ene-dic) antes de octubre — con propuesta de valor documentada', responsable: 'José Galván + Dir. SAC', criterio: 'Propuesta enviada antes del 31 oct 2026 — intención confirmada = contrato firmado' },
    { accion: 'Entregar dashboard o reporte semanal de conciliación de actividad AV (manual al inicio)', responsable: 'David Avilés / Fátima', criterio: 'Primer reporte enviado dentro de 15 días — elimina principal fuente de ansiedad del cliente' },
    { accion: 'Aplicar política de tolerancia cero con consistencia: estimación + VoBo escrito ANTES de cualquier trabajo fuera de alcance, sin excepción', responsable: 'José Galván + Dir. Experiencia al Cliente', criterio: 'Cero trabajo no autorizado en los próximos 90 días' },
    { accion: 'Analizar e integrar cuenta legacy Centros Comerciales (CID ~171) — propuesta de consolidación o migración', responsable: 'José Galván', criterio: 'Análisis presentado y propuesta comercial definida en 60 días' },
  ],

  areas_oportunidad: [
    { area: 'Migración WA API oficial',                   impacto: 'Upsale en MRR ya con VoBo dado — pendiente sólo la coordinación de fechas post-vacaciones', responsable: 'Galván / Fátima' },
    { area: 'Nuevo DID + integración Salesforce',         impacto: 'Cotización pendiente — segunda línea de negocio del grupo', responsable: 'David + Galván' },
    { area: 'Fuente de datos personalizada conciliación', impacto: 'Nuevo proyecto facturado — elimina principal objeción del cliente para adopción plena', responsable: 'David + Fátima' },
    { area: 'Calendario de guardias en CP Chat',          impacto: 'Requerimiento documentado — módulo o add-on potencial', responsable: 'Producto / Ingeniería' },
    { area: 'Renovación anual 2027',                      impacto: '~$167,460 MXN/año asegurado — intención confirmada. Propuesta formal oct-nov 2026.', responsable: 'Galván + Dir. SAC' },
    { area: 'Cuenta Centros Comerciales (CID ~171)',      impacto: 'Sin estrategia activa — potencial de integración o migración al ecosistema actual', responsable: 'Galván' },
  ],

  perfiles: [
    {
      nombre: 'José Antonio Romero Reyes ("Pepe Toño")', rol: 'Gerente de Sistemas / TI — Único contacto y tomador de decisiones', color: '#1B3FCC',
      campos: [
        { label: 'Tipo de decisor',      value: 'Técnico-operativo con autoridad presupuestaria dentro de TI. Motivación principal: demostrar resultados tangibles a su gerencia interna.' },
        { label: 'Mayor miedo',          value: 'Perder control sobre el presupuesto o el alcance del proyecto — y que el AV haga quedar mal a FRISA frente a sus prospectos.' },
        { label: 'Estilo comunicacional',value: 'Directo, informal, prefiere WhatsApp sobre correo formal. Señal de molestia: silencio prolongado seguido de mensaje contundente con ejemplos concretos.' },
        { label: 'Señal de confianza',   value: 'Tono ligero, humor, uso de "tocayo" con José Galván. Tono colaborativo en WhatsApp con ingeniería (jun 2026).' },
        { label: 'Benchmark clave',      value: 'ACCIONA — compara constantemente contra esa experiencia previa. Riesgo y oportunidad simultánea.' },
        { label: 'Lo que dice → necesita', value: '"No me dan seguimiento" → actualizaciones proactivas para reportar a su gerencia. "Cambios obvios" → delimitación formal de alcance ANTES de que los pida. "Autorizo mis horas" → visibilidad en tiempo real de consumo presupuestal.' },
        { label: 'Palancas de influencia', value: '1) Visibilidad ejecutiva — reportes de resultados para su dirección. 2) Control y transparencia — estado del proyecto en tiempo real. 3) Velocidad en soporte — "lo estoy revisando" vale más que una solución tardía. 4) Cumplimiento exacto de plazos.' },
      ],
    },
    {
      nombre: 'David Avilés', rol: 'PM / Ingeniería — Ejecuta y documenta correctamente', color: '#22c55e',
      campos: [
        { label: 'Fortaleza',       value: 'Mantiene cadencia semanal de status reports por correo desde abr 2026. Resolvió problemas complejos: migración Landbot → AV, integración SF bidireccional, catálogo dinámico.' },
        { label: 'Vulnerabilidad',  value: 'Negocia alcances sin respaldo comercial cuando está solo frente al cliente. Necesita soporte de Galván o Dir. SAC para blindar cambios de alcance.' },
        { label: 'Rol óptimo',      value: 'Ejecutor y documentador técnico — no negociador de alcances. Toda solicitud de cambio debe pasar primero por canal comercial.' },
      ],
    },
    {
      nombre: 'José Galván', rol: 'Ejecutivo Comercial — Cuello de botella multirrol', color: '#f97316',
      campos: [
        { label: 'Patrón crítico',  value: 'Principal punto de contacto pero concentra comercial + soporte + ingeniería. Crea dependencia y cuello de botella. Debe acotarse a su rol comercial.' },
        { label: 'Fortaleza',       value: 'Relación de confianza sólida con el cliente ("tocayo"). Conoce la historia de la cuenta.' },
        { label: 'Riesgo',          value: 'Si actúa como intermediario de soporte técnico, genera retrasos y pérdida de contexto. Alejandro Rendón con acceso revocado a Landbot genera fricciones innecesarias.' },
      ],
    },
    {
      nombre: 'Fátima González', rol: 'Ejecutiva de Satisfacción — Rol difuso', color: '#8b5cf6',
      campos: [
        { label: 'Estado actual',   value: 'Subreportada en canales de la cuenta después de los primeros meses. Rol difuso.' },
        { label: 'Rol requerido',   value: 'Debe activarse como punto único de contacto para soporte y consolidar comunicación en canal acordado. Actualización de HS y adopción: tarea inmediata.' },
        { label: 'Potencial',       value: 'Liderar las sesiones quincenales que el cliente solicitó. Consolidar el canal de soporte único.' },
      ],
    },
    {
      nombre: 'Paola Bárcenas', rol: 'Soporte CP Chat — Alta proactividad', color: '#3b82f6',
      campos: [
        { label: 'Aportación',      value: 'Alta proactividad en detección de bugs del bot. Valiosa para el cliente aunque no sea su contacto directo.' },
        { label: 'Nota',            value: 'Su valor debe ser visible para el cliente — integrarla en el reporte de actividad.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cliente estratégico: holding inmobiliario con presencia nacional (+50 plazas, +15 estados)',
      'Pago puntual y en cheque — sin incidencias de cobranza. Pago extraordinario $305,800 MXN (feb 2026)',
      'MRR sólido: $13,955 + IVA con tendencia de crecimiento',
      'LTV en construcción: $305,800 en un solo pago en 2026',
      'Ecosistema multi-producto: Voz + Chat + AV + Salesforce + WA API',
      'Interés genuino en expandir el servicio hacia 2027 — intención de renovación anual confirmada',
      'Caso de uso complejo y diferenciador para el portafolio de Callpicker',
      'Capacidad técnica acreditada: AV multi-destino, 13 calendarios, integración Salesforce bidireccional',
      'Nueva política de tolerancia cero (29 abr 2026) ya implementada',
    ],
    oportunidades: [
      'Presupuesto 2027 ya en conversación: ~$167,460 MXN/año — propuesta formal oct-nov 2026',
      'Migración WA API pendiente — upsale ya autorizado por el cliente',
      'Nuevo DID para segunda línea de negocio + integración Salesforce',
      'Fuente de datos de conciliación — nuevo proyecto facturado',
      'Calendario de asignación de guardias en CP Chat — requerimiento documentado',
      'Cuenta legacy Centros Comerciales (CID ~171): potencial integración o migración',
      'Replicar modelo AV complejo en otras plazas o unidades de negocio del grupo',
    ],
    debilidades: [
      'Único contacto crítico: solo José Antonio Romero — sin contacto secundario registrado',
      'Patrón de expansión de alcance sin VoBo — 7 episodios — riesgo recurrente',
      'Comunicación dispersa en múltiples canales sin punto único acordado',
      'AV Voz con fallas recurrentes no 100% resuelto (Sayaves, Real del Lago)',
      '47.7% de no contestadas en AV Outbound — eficiencia cuestionable',
      'Health Score 50/100 — zona de alerta sin revisión activa reciente',
      'Adopción sin registro formal — todos los campos en blanco en CRM',
      'Horas de proyecto agotadas (159/160) con AV Voz al 90% sin completar',
    ],
    amenazas: [
      'Nuevo episodio de scope creep puede escalar a disputa formal si no se aplica la política de tolerancia cero',
      'Si el AV Chat sale a producción con fallas → crisis de confianza irreparable',
      'Agotamiento de horas deja margen cero para imprevistos del AV Voz sin cotización adicional',
      'Dependencia de un solo contacto: si José Antonio sale, la relación se fragiliza',
      'AV Outbound con 47.7% no contestadas puede percibirse como herramienta ineficiente',
      'Competidor con propuesta para Salesforce nativo (sin middleware Callpicker)',
      'Presupuesto 2026 del cliente es fijo — cualquier imprevisto técnico afecta la relación',
    ],
  },

  conclusion: 'Grupo FRISA no es una cuenta en churn. Es una cuenta que Callpicker tiene el potencial de convertir en referencia de portafolio — si eleva la calidad de su gobierno comercial al nivel de la complejidad técnica que ya demostró poder entregar.\n\nJosé Antonio Romero no es un cliente difícil. Es un cliente que lleva tecnología a una organización corporativa grande, con presión de dirección para justificar resultados, y con experiencia previa (ACCIONA) que le genera expectativas específicas. Lo que percibe como "falta de seguimiento" es ausencia de visibilidad. Lo que llama "cambios obvios" son funcionalidades que asume incluidas porque nadie las delimitó formalmente antes de que las pidiera.\n\nLas tres acciones de mayor impacto en los próximos 90 días: (1) lanzar AV Chat sin incidentes en las primeras 72 horas, (2) entregar un reporte semanal de conciliación aunque sea manual, (3) presentar propuesta formal de renovación 2027 antes de octubre.',

  pierde: [
    'Si AV Chat sale con fallas en primeras 72 horas → crisis de confianza irreparable',
    'Si se permite nuevo scope creep sin VoBo → la política de tolerancia cero queda sin efecto',
    'Si José Antonio sale de la empresa sin contacto secundario registrado → pérdida de la relación',
    'Si no se presenta cotización para completar AV Voz → el proyecto queda incompleto indefinidamente',
    'Si no hay propuesta 2027 antes de octubre → el cliente evalúa alternativas en silencio',
    'Si el AV Outbound no mejora su tasa de 47.7% sin contestar → el cliente percibe la herramienta como ineficiente',
  ],
  gana: [
    'AV Chat en producción sin incidentes → recupera confianza y abre la puerta a expansión 2027',
    'Reporte de conciliación semanal → elimina principal fuente de ansiedad del cliente',
    'Propuesta 2027 formal → ~$167,460 MXN/año asegurado antes de que evalúe alternativas',
    'WA API migración completada → upsale en MRR ya con VoBo',
    'Fuente de datos de conciliación entregada → nuevo proyecto facturado, adopción plena del ecosistema',
    'Cuenta Centros Comerciales activada → expansión del grupo dentro de Callpicker',
    'Callpicker como referencia de portafolio: caso de éxito AV + Salesforce a escala inmobiliaria nacional',
  ],
  recomendacion_central: 'REGLA ABSOLUTA: sin VoBo escrito, sin ejecución. Ningún trabajo fuera del alcance firmado puede iniciarse sin estimación en horas, costo asociado (aunque sea cero por decisión comercial) y aprobación explícita del cliente por escrito. Esta regla ya existe — el desafío es ejecutarla con consistencia frente a un cliente que presiona con informalidad y urgencia. La oportunidad estratégica es real: el cliente paga, renueva y quiere crecer. Callpicker solo necesita elevar su gobierno de cuenta al nivel de la complejidad técnica que ya demostró poder entregar.',
}
