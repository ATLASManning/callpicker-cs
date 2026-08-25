import type { AuditoriaCase } from './types'

/**
 * Fuente: "Reporte_Ejecutivo_Cargo_Lift_Analisis_Llamadas.docx"
 * Elaborado por el Equipo de Experiencia al Cliente · Ago 2026.
 *
 * Nota de fidelidad al documento: la clasificación entrante/saliente es un
 * SUPUESTO METODOLÓGICO (los archivos fuente no traen columna de dirección);
 * "Redirected" se interpreta como conectada, "Lost" como no atendida y
 * "Self_service" como resuelta por autoservicio. El reporte no infiere
 * facturación, causa raíz ni impacto económico sin evidencia adicional.
 * Esas restricciones se respetan aquí tal cual.
 */
export const CARGO_LIFT: AuditoriaCase = {
  id:                    'cargo-lift',
  asesor:                'Dan',
  nombre:                'Cargo Lift',
  sector:                'Comercializadora · productos de izaje y sujeción de carga + servicios',
  fecha_periodo:         '2 Enero – 31 Julio 2026',
  fecha_auditoria:       'Ago 2026',
  tipo_cliente:          'Operación híbrida distribuida · ecosistema Callpicker avanzado (VyC, WhatsApp API, Webhook, Payments PCI)',
  descripcion_contexto:  'CID 439 · Consecutivo D5 · 83.9% llamadas entrantes · Asesor: Dan Domínguez',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Llamadas analizadas (7 meses)', value: '5,379',           color: '#6366f1' },
    { label: 'Pérdida entrante',              value: '566 (12.5%)',     color: '#f59e0b' },
    { label: 'Pérdida saliente',              value: '376 (43.4%)',     color: '#ef4444' },
    { label: 'Autoservicio (Self_service)',   value: '654',             color: '#22c55e' },
  ],

  resumen_ejecutivo:
    'Cargo Lift presenta una operación telefónica claramente mixta: 4,512 llamadas entrantes (83.9%) y 867 salientes (16.1%) sobre una base de 5,379 llamadas analizadas entre el 2 de enero y el 31 de julio de 2026.\n\n' +
    'El principal riesgo está en el canal saliente: 376 llamadas clasificadas como Lost (43.4%) — el flujo saliente pierde proporcionalmente 3.5 veces más llamadas que el entrante. En entrantes se perdieron 566 (12.5%), mientras 654 quedaron en Self_service: la automatización ya forma parte del recorrido del cliente y puede escalarse de manera controlada.\n\n' +
    'Cargo Lift ya cuenta con VyC, WhatsApp API, Webhook, Payments PCI y desarrollo de Agentes Virtuales: su madurez tecnológica es superior a la madurez de gobierno operativo de la telefonía. La prioridad consultiva no es agregar canales, sino integrar telefonía, automatización y analítica para reducir pérdidas, mejorar el seguimiento saliente y convertir la información de contacto en acciones operativas.',

  resultado_positivo:
    'La automatización ya demostró tracción: 654 interacciones entrantes se resolvieron por Self_service, prueba de que puede absorber parte de la demanda. ' +
    'El cliente ya contrató Webhook, WhatsApp API, Payments PCI y tiene desarrollo parcial de Agentes Virtuales — la conversación puede ser de optimización y adopción, no de introducción tecnológica. ' +
    'Las llamadas conectadas son cortas (2.7 min entrantes, 2.5 min salientes; mediana de 2 min), compatible con una operación de coordinación y resolución rápida. ' +
    'La cobertura nacional con 22 números de entrada y servicios 800 confirma una operación geográficamente distribuida ya montada sobre Callpicker.',

  hallazgos: [
    'Pérdida saliente crítica: 376 de 867 llamadas outbound (43.4%) quedaron en Lost — 3.5 veces la tasa del entrante. Es el gap prioritario: sugiere revisar cadencias, disponibilidad y propósito de la llamada.',
    'Pérdida entrante moderada: 566 de 4,512 (12.5%), con ventanas peores a las 17:00 (17.4%), 15:00 (16.2%) y 11:00 (14.4%).',
    'Autoservicio ya operando: 654 eventos Self_service en inbound — falta medir qué motivos resuelve y dónde todavía transfiere a agente.',
    'Alta concentración en pocos destinos: María del Pilar Pérez Sánchez (565 llamadas), María de Lourdes Eugenio Reyes (539), Verónica Pérez (271), Ana Elia Hernández García (267) y Heber García (228). Un problema de disponibilidad en cualquiera de ellos afecta desproporcionadamente el servicio.',
    'Jueves es el día de mayor volumen (1,170 llamadas) y el pico horario global ronda las 11:00 con 801 llamadas — ventanas claras para staffing y monitoreo diferenciado.',
    'En horario saliente, las 17:00 pierden el 54.8% (63 de 115), las 08:00 el 52.3% y las 14:00 el 49.1%.',
    'Los datos no registran el motivo de cada pérdida: sin causa raíz, cualquier decisión operativa ataca síntomas.',
  ],

  cronologia: [
    { fecha: '23 Oct 2015',           responsable: 'Callpicker',                     evento: 'Alta de la cuenta Cargo Lift (CID 439, consecutivo D5). Cliente con más de 10 años de antigüedad.', tipo: 'ok' },
    { fecha: '2 Ene – 31 Jul 2026',   responsable: 'Callpicker / Análisis de datos', evento: 'Periodo analizado: 5,379 llamadas en dos exportaciones — 4,512 entrantes y 867 salientes (clasificación por supuesto metodológico: los archivos no traen columna de dirección).', tipo: 'neutral' },
    { fecha: 'Ago 2026',              responsable: 'Equipo Experiencia al Cliente',  evento: 'Se emite el reporte ejecutivo de análisis de llamadas para comité ejecutivo y uso interno del asesor de SAC.', tipo: 'pivote' },
    { fecha: 'Pendiente',             responsable: 'Cargo Lift / Dan Domínguez',     evento: 'Plan de optimización de 30-60 días con medición semanal de pérdida inbound/outbound, recuperación de llamadas, desempeño por horario y concentración por destino.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',            value: 'Cargo Lift' },
    { label: 'CID Zoho',                value: '439' },
    { label: 'Consecutivo',             value: 'D5' },
    { label: 'Sector',                  value: 'Comercializadora — productos para movimiento/izaje y sujeción de carga + servicios (inspecciones, pruebas, capacitación)' },
    { label: 'Cliente desde',           value: 'Octubre 2015 (10+ años)' },
    { label: 'MRR reportado',           value: '$10,655 MXN/mes' },
    { label: 'Contacto principal',      value: 'Ricardo Barroso — Director' },
    { label: 'Asesor de cuenta',        value: 'Dan Domínguez' },
    { label: 'Health Score CRM',        value: '64 / 100 · estado En Riesgo' },
    { label: 'Ecosistema contratado',   value: 'VyC · WhatsApp API · Webhook · Payments PCI · Agentes Virtuales (en desarrollo)' },
    { label: 'Cobertura',               value: '22 números de entrada (geográficos + 800) · operación distribuida por plazas' },
    { label: 'Periodo analizado',       value: '2 Ene – 31 Jul 2026 (5,379 llamadas)' },
  ],

  necesidad_negocio:
    'Cargo Lift necesita orquestar mejor la demanda y convertir el volumen de contactos en atención y seguimiento medible. ' +
    'Su dependencia telefónica es alta: más de 5,000 interacciones en siete meses evidencian un canal operativo recurrente que acompaña coordinación comercial, logística, servicio y proveedores/clientes. ' +
    'La fricción está principalmente en las llamadas salientes no conectadas y en la administración de múltiples puntos de entrada. ' +
    'Su preparación para automatizar es alta: ya cuenta con WhatsApp API, Webhook, Payments PCI y desarrollo de Agentes Virtuales — el reto no es tecnología, es gobierno operativo.',

  potencial_corto: [
    'Crear un tablero operativo de llamadas perdidas por día, hora, número y destino: la pérdida ya es medible y accionable.',
    'Identificar las 5 extensiones/destinos de mayor carga y establecer cobertura secundaria para reducir la dependencia de personas clave.',
    'Establecer una regla de recuperación para llamadas salientes Lost — el 43.4% de pérdida outbound es el principal gap.',
  ],

  potencial_largo: [
    'Implementar alertas de pérdida y SLA interno por horario pico (11:00, 15:00 y 17:00 concentran la peor tasa).',
    'Integrar los eventos de Callpicker vía Webhook con el CRM/operación para que la llamada no quede aislada del proceso comercial.',
    'Mapear los motivos de Self_service y Lost: automatizar con causa, no por intuición.',
    'Escalar Agentes Virtuales en motivos repetitivos de alto volumen — ya existe desarrollo parcial y evidencia de autoservicio.',
    'Diseñar el modelo omnicanal voz + WhatsApp con continuidad de contexto, aprovechando la WhatsApp API ya contratada.',
  ],

  tacticas: [
    { nombre: 'Visibilidad y Control / analítica',   descripcion: 'Candidatura MUY ALTA. El volumen y la pérdida requieren seguimiento por línea, horario, destino y equipo: convertir datos en alertas, KPI y acciones.', impacto: 'Mayor control operativo y capacidad de gestión.' },
    { nombre: 'Webhook / integraciones',             descripcion: 'Candidatura MUY ALTA. Ya existe Webhook y una operación con múltiples contactos: disparar eventos hacia CRM/operación.', impacto: 'Trazabilidad de punta a punta.' },
    { nombre: 'Agentes Virtuales / automatización',  descripcion: 'Candidatura MUY ALTA. Ya existe Self_service (654 eventos) y desarrollo parcial de Agentes Virtuales: resolver motivos repetitivos y encaminar demanda.', impacto: 'Escalabilidad y atención 24/7 en casos definidos.' },
    { nombre: 'Seguimiento inteligente / Sígueme',   descripcion: 'Candidatura ALTA. La pérdida outbound (43.4%) y la concentración de destinos justifican reglas de continuidad.', impacto: 'Mayor continuidad y menor riesgo de contacto perdido.' },
    { nombre: 'Conmutador empresarial/virtual',      descripcion: 'Candidatura ALTA. 22 números y múltiples destinos requieren orquestación consistente: centralizar reglas, horarios, rutas y cobertura.', impacto: 'Experiencia homogénea y mejor capacidad de respuesta.' },
    { nombre: 'Grabación + calidad/monitoreo',       descripcion: 'Candidatura ALTA. Interacciones cortas y críticas pueden auditarse para identificar causas de pérdida y calidad.', impacto: 'Mejora de servicio, coaching y control.' },
    { nombre: 'WhatsApp API / omnicanal',            descripcion: 'Candidatura ALTA. El cliente ya tiene WhatsApp API: continuar la conversación fuera de voz cuando convenga.', impacto: 'Menor fricción y continuidad del cliente.' },
  ],

  senal_alarma:
    'El canal saliente pierde proporcionalmente 3.5 veces más llamadas que el entrante (43.4% vs 12.5%). ' +
    'Sin asumir que todas las pérdidas son oportunidades comerciales, la diferencia es suficientemente amplia para convertirla en la pregunta de negocio prioritaria de la reunión. ' +
    'Ojo también con la concentración: dos personas (María del Pilar Pérez Sánchez y María de Lourdes Eugenio Reyes) reciben 1,104 llamadas entre ambas — un punto único de falla puede deteriorar la experiencia de forma desproporcionada.',

  problema_raiz:
    'Madurez tecnológica superior a la madurez de gobierno operativo: infraestructura amplia contratada, sin la disciplina de atención, seguimiento y medición que la convierta en resultados.',

  problema_raiz_detalle:
    'Cargo Lift no tiene un problema de canales — tiene VyC, WhatsApp API, Webhook, Payments PCI, 22 números de entrada y Agentes Virtuales en desarrollo. ' +
    'Lo que los datos evidencian es la brecha entre esa capacidad tecnológica y su gobierno: el 43.4% del flujo saliente se pierde sin regla formal de recuperación, la experiencia depende de un conjunto reducido de destinos de alta concentración, las múltiples líneas carecen de un gobierno coordinado que garantice experiencias consistentes entre plazas, y los datos no registran el motivo de cada pérdida — de modo que las decisiones operativas atacan síntomas y no causas. ' +
    'La oportunidad de mayor valor está en pasar de "tener canales" a "orquestar conversaciones" con reglas, alertas, automatización e integración.',

  flujo_real: [
    { fase: 'Entrada',           area: '22 números geográficos + 800',  accion: 'La demanda entra distribuida por plazas y servicios.',                              resultado: '4,512 llamadas entrantes; 3,270 conectadas (Redirected), 566 Lost (12.5%), 654 Self_service.' },
    { fase: 'Concentración',     area: 'Destinos / extensiones',        accion: 'El tráfico se concentra en pocas personas.',                                         resultado: 'Top 2 destinos absorben 1,104 llamadas; top 5 más de 1,870.' },
    { fase: 'Pico de demanda',   area: 'Operación',                     accion: 'La carga se concentra entre semana, con jueves como día máximo.',                     resultado: 'Jueves: 1,170 llamadas · pico global a las 11:00 con 801.' },
    { fase: 'Salientes',         area: 'Seguimiento / gestión',         accion: 'Se marca para seguimiento comercial y coordinación.',                                 resultado: '867 llamadas; 491 conectadas y 376 Lost (43.4%), sin regla de recuperación.' },
    { fase: 'Registro',          area: 'Sistemas',                      accion: 'No está confirmado en qué CRM queda registrado el resultado de cada llamada.',        resultado: 'Riesgo de que la actividad telefónica quede aislada del proceso de negocio pese a tener Webhook contratado.' },
  ],

  comparativo: [
    { metrica: 'Llamadas entrantes',          real: '4,512 (83.9%) · 12.5% Lost',   ideal: 'Pérdida monitoreada por hora, línea y destino, con ventanas 15:00–17:00 reforzadas' },
    { metrica: 'Llamadas salientes',          real: '867 (16.1%) · 43.4% Lost',     ideal: 'Cola de recuperación medible: Lost convertido en seguimiento con cadencia' },
    { metrica: 'Autoservicio',                real: '654 eventos sin mapa de motivos', ideal: 'Motivos mapeados; automatización escalada con causa' },
    { metrica: 'Duración promedio conectada', real: '2.7 min in · 2.5 min out',     ideal: 'Consultas repetitivas automatizadas; asesor concentrado en casos de valor' },
    { metrica: 'Concentración de destinos',   real: 'Top 2 personas = 1,104 llamadas', ideal: 'Cobertura secundaria definida para los 5 destinos de mayor carga' },
    { metrica: 'Gobierno de líneas',          real: '22 números sin analítica por línea', ideal: 'Gobierno centralizado con KPI y experiencia homogénea entre plazas' },
    { metrica: 'Causa de pérdida',            real: 'No registrada',                 ideal: 'Motivo de pérdida capturado para decidir con causa raíz' },
  ],

  plan_inmediato: [
    { accion: 'Crear tablero operativo de llamadas perdidas por día, hora, número y destino.',            responsable: 'Callpicker (VyC) / Dan Domínguez', criterio: 'Visibilidad inmediata del riesgo: la pérdida ya es medible y accionable.' },
    { accion: 'Identificar las 5 extensiones/destinos de mayor carga y establecer cobertura secundaria.',  responsable: 'Cargo Lift (Operación)',           criterio: 'Menor dependencia de personas clave: existe concentración de tráfico.' },
    { accion: 'Establecer una regla de recuperación para llamadas salientes Lost.',                        responsable: 'Cargo Lift (Comercial/Operación)', criterio: 'Mayor tasa de contacto efectivo: el 43.4% outbound es el principal gap.' },
  ],

  plan_mediano: [
    { accion: 'Implementar alertas de pérdida y SLA interno por horario pico.',                            responsable: 'Callpicker',                        criterio: 'Respuesta más rápida a incidencias en las ventanas donde se concentra la demanda.' },
    { accion: 'Integrar eventos Callpicker vía Webhook con el CRM/operación.',                             responsable: 'Cargo Lift (Sistemas) / Callpicker',criterio: 'Trazabilidad de contacto y seguimiento: evita que la llamada quede aislada.' },
    { accion: 'Mapear los motivos de Self_service y Lost.',                                                responsable: 'Cargo Lift / Callpicker',           criterio: 'Automatización con causa, no por intuición: la tecnología ya está presente.' },
  ],

  plan_estrategico: [
    { accion: 'Escalar Agentes Virtuales en motivos repetitivos de alto volumen.',                          responsable: 'Callpicker / Cargo Lift',          criterio: 'Menor presión sobre agentes y atención continua: ya existe desarrollo parcial.' },
    { accion: 'Diseñar el modelo omnicanal voz + WhatsApp con continuidad de contexto.',                    responsable: 'Callpicker / Cargo Lift',          criterio: 'Mejor experiencia y menor fricción: WhatsApp API ya es parte del ecosistema contratado.' },
    { accion: 'Plan de optimización de 30-60 días con línea base semanal (pérdida, recuperación, horario, concentración).', responsable: 'Dan Domínguez', criterio: 'Demostrar mejora cuantificable antes de ampliar el alcance tecnológico.' },
  ],

  areas_oportunidad: [
    { area: 'Recuperación del outbound Lost',                       impacto: 'Muy alto — 376 llamadas (43.4%) sin regla de seguimiento.',                         responsable: 'Cargo Lift (Comercial)' },
    { area: 'Analítica y alertas VyC por línea/horario/destino',    impacto: 'Muy alto — convierte capacidad ya contratada en control operativo.',                 responsable: 'Callpicker' },
    { area: 'Integración Webhook → CRM',                            impacto: 'Muy alto — cierra la trazabilidad desde el contacto hasta la gestión.',              responsable: 'Cargo Lift (Sistemas)' },
    { area: 'Cobertura secundaria en destinos de alta concentración', impacto: 'Alto — elimina puntos únicos de falla en la experiencia.',                          responsable: 'Cargo Lift (Operación)' },
    { area: 'Escalamiento de Agentes Virtuales',                    impacto: 'Alto — 654 Self_service prueban que la automatización absorbe demanda.',             responsable: 'Callpicker' },
    { area: 'Omnicanal voz + WhatsApp',                             impacto: 'Medio-alto — continuidad de contexto sobre API ya contratada.',                      responsable: 'Callpicker' },
  ],

  perfiles: [
    {
      nombre: 'Ricardo Barroso',
      rol:    'Director — contacto principal',
      color:  '#6366f1',
      campos: [
        { label: 'Teléfono',   value: '55 5536 6542' },
        { label: 'Correo',     value: 'ric.barroso@gmail.com' },
        { label: 'Relevancia', value: 'Decisor. El mensaje central para la reunión: "Cargo Lift ya cuenta con tecnología suficiente; el siguiente paso no es sumar herramientas aisladas, sino usar las que ya tiene para reducir pérdidas, asegurar seguimiento y automatizar lo repetitivo."' },
      ],
    },
    {
      nombre: 'María del Pilar Pérez Sánchez / María de Lourdes Eugenio Reyes',
      rol:    'Destinos de mayor concentración de tráfico (565 y 539 llamadas)',
      color:  '#f59e0b',
      campos: [
        { label: 'Riesgo',    value: 'Entre ambas absorben 1,104 llamadas entrantes: puntos de entrada críticos sin respaldo confirmado.' },
        { label: 'Pendiente', value: 'Validar con el cliente qué equipos/extensiones tienen respaldo y cuáles no.' },
      ],
    },
    {
      nombre: 'Dan Domínguez',
      rol:    'Asesor de cuenta — Callpicker',
      color:  '#22c55e',
      campos: [
        { label: 'Responsabilidad', value: 'Conducir la reunión con las 7 preguntas de seguimiento del reporte (regla de devolución de llamada, extensiones con respaldo, motivos de Self_service, CRM de registro, números estratégicos, horarios de presión).' },
        { label: 'Enfoque',         value: 'Empezar por control y seguimiento (VyC + continuidad + alertas); después automatización e integración. Demostrar mejora cuantificable antes de ampliar alcance.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cobertura nacional y múltiples puntos de entrada (22 números + 800).',
      'Uso de VyC y capacidad de reporte/visibilidad ya contratada.',
      'Autoservicio ya presente: 654 eventos Self_service.',
      'WhatsApp API + Webhook + Payments PCI disponibles; Agentes Virtuales en desarrollo.',
    ],
    oportunidades: [
      'Reducir la pérdida saliente con seguimiento inteligente y alertas.',
      'Optimizar las ventanas pico por día/hora y por destino.',
      'Escalar Agentes Virtuales para motivos repetitivos.',
      'Conectar eventos de llamada con CRM/operación vía Webhook.',
    ],
    debilidades: [
      '43.4% de pérdida en el flujo saliente.',
      'Dependencia de destinos/extensiones de alta concentración.',
      'Múltiples líneas que requieren gobierno coordinado.',
      'Los datos no registran el motivo de cada pérdida.',
    ],
    amenazas: [
      'Fuga de oportunidades o retrasos si las llamadas de seguimiento no se recuperan.',
      'Un punto único de falla puede deteriorar la experiencia de forma desproporcionada.',
      'Experiencias distintas entre números/plazas por falta de gobierno central.',
      'Decisiones operativas sin causa raíz que atacan síntomas.',
    ],
  },

  conclusion:
    'El reto de Cargo Lift no es la ausencia de canales; es la capacidad de convertir una operación telefónica distribuida en una operación orquestada, medible y recuperable. ' +
    'El diferencial inmediato está en atacar la pérdida saliente (43.4%), asegurar continuidad en los puntos de alta carga y aprovechar la infraestructura ya contratada para automatizar y conectar la voz con el proceso de negocio. ' +
    'La recomendación es iniciar con un plan de optimización de 30-60 días que mida semanalmente pérdida inbound/outbound, recuperación de llamadas, desempeño por horario y concentración por destino; con esa línea base, la siguiente etapa es automatización e integración priorizando casos que reduzcan trabajo repetitivo y aumenten trazabilidad.',

  pierde: [
    'Seguimiento saliente: 376 llamadas outbound Lost (43.4%) sin regla de recuperación — el peor gap medido.',
    'Contactos entrantes en ventanas pico: hasta 17.4% de pérdida a las 17:00.',
    'Trazabilidad: sin integración activa, el resultado de la llamada no llega al CRM pese a tener Webhook contratado.',
    'Resiliencia: la experiencia depende de pocos destinos de alta concentración sin respaldo confirmado.',
  ],

  gana: [
    'Una cola de recuperación medible que convierte el Lost saliente en seguimiento efectivo.',
    'Visibilidad operativa por línea, horario, destino y equipo con la analítica VyC ya contratada.',
    'Escalabilidad vía Agentes Virtuales y WhatsApp sobre infraestructura que ya paga.',
    'Trazabilidad de punta a punta conectando la llamada con el proceso comercial/operativo.',
  ],

  recomendacion_central:
    'Comenzar por una capa de control y seguimiento (VyC + reglas de continuidad + alertas) y después profundizar automatización (Agente Virtual/WhatsApp) e integración vía Webhook. ' +
    'El objetivo es demostrar primero una mejora cuantificable sobre llamadas perdidas y seguimiento antes de ampliar el alcance tecnológico. ' +
    'Guía hallazgo→solución para la reunión: "perdemos salientes y nadie las recupera" → seguimiento inteligente + alertas; "hay extensiones saturadas" → conmutador + Sígueme; "muchas consultas repetitivas" → Agente Virtual + WhatsApp; "la llamada no queda en el CRM" → Webhook/integración; "no sabemos por qué se pierden" → VyC + grabación + calidad.',

  documentos: [
    {
      nombre:      'Reporte Ejecutivo · Cargo Lift — Análisis de Llamadas',
      ruta:        '/docs/Reporte_Ejecutivo_Cargo_Lift_Analisis_Llamadas.docx',
      descripcion: 'Análisis de llamadas entrantes y salientes, 2 Ene – 31 Jul 2026. Equipo Experiencia al Cliente. Incluye las 8 visualizaciones ejecutivas (distribución por dirección, top destinos, día de semana, tendencia semanal, horarios, resultado de entrantes).',
    },
  ],
}
