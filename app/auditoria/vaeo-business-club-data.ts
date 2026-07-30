import type { AuditoriaCase } from './types'

export const VAEO_BUSINESS_CLUB: AuditoriaCase = {
  id: 'vaeo-business-club',
  asesor: 'Claudia',
  nombre: 'VAEO Business Club',
  sector: 'Centro de Negocios Premium Multi-Inquilino — Servicios a Empresas B2B',
  fecha_periodo: '22 Abr – 29 Jul 2026',
  fecha_auditoria: 'Jul 2026',
  tipo_cliente: 'Business Center Premium · 220 extensiones · 1 sub-cuenta · CID 180631 · Consecutivo C51',
  descripcion_contexto: 'Auditoría Forense de Comunicaciones · 9,470 interacciones analizadas (7,828 entrantes + 1,642 salientes) · 99 días operativos · Modelo multi-inquilino: VAEO revende infraestructura de recepción/PBX a empresas hospedadas',
  estado: 'activo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Tasa pérdida entrante',    value: '64.7% · 5,063 de 7,828 llamadas', color: '#ef4444' },
    { label: 'Cola Concierge Sales',     value: '92.3% pérdida · 241 de 261',       color: '#ef4444' },
    { label: 'Pérdida dominical',        value: '100% · 352 llamadas sin contestar', color: '#f59e0b' },
    { label: 'MRR / Health Score',       value: '$21,327 MXN · 60 "Estable"',       color: '#1B3FCC' },
  ],

  resumen_ejecutivo: 'VAEO Business Club presenta un problema de modelo de cobertura, no de infraestructura técnica. En 99 días operativos (22 Abr – 29 Jul 2026) el sistema procesó 9,470 interacciones — 7,828 entrantes y 1,642 salientes — con una tasa de pérdida entrante del 64.7% (5,063 llamadas). La plataforma Callpicker funciona correctamente: 0 fallas técnicas en 6 tickets del periodo. El problema es que VAEO opera un centro de negocios premium donde la recepción telefónica es parte de lo que vende a sus inquilinos corporativos, y esa recepción tiene una tasa de respuesta efectiva del 35.3%.\n\nDistribución de 7,828 llamadas entrantes:\n• Pérdidas (Lost): 5,063 · 64.7%\n• Atendidas por humano: 2,599 · 33.2%\n• Autoservicio / Voicemail: 166 · 1.9%\n• Salientes (1,642 adicionales): 58.8% contestadas · 41.2% sin respuesta\n\nEl hallazgo más crítico es que la propia cola comercial de VAEO ("Concierge Sales") pierde el 92.3% de sus llamadas entrantes — el canal por donde el centro de negocios debería capturar nuevos clientes e inquilinos está prácticamente cerrado.',

  resultado_positivo: 'La infraestructura Callpicker es técnicamente estable: 0 fallas registradas en 6 tickets del periodo, todos de baja o media prioridad salvo uno de asistencia de voz. La cola "Concierge Manager" es el punto más sólido del centro con 53.8% de pérdida entrante — evidencia de buenas prácticas replicables internamente. El agente Juan Luis Cabrera muestra 87.4% de contestación en salientes, el mejor perfil del equipo y una referencia clara para estandarizar el proceso. El modelo del inquilino MTY TNH (24.4% de pérdida, apoyado en autoservicio intensivo con 132 de 299 llamadas en IVR) es la prueba interna más sólida del reporte: dentro del mismo sistema, con el mismo personal, un modelo de atención diferente reduce la pérdida en 40 puntos porcentuales frente al promedio general. El pago está al 100% y la relación contractual está sana.',

  hallazgos: [
    'Tasa de pérdida entrante del 64.7% en 99 días: 5,063 de 7,828 llamadas sin atender. Esto incluye la ventana hábil de 09:00–18:00 (59.8% pérdida), lo que confirma que el problema no es solo de cobertura de horario — hay insuficiencia estructural en la dotación humana durante el horario declarado.',
    'Cola "Concierge Sales" con 92.3% pérdida entrante (241 de 261) y 45.0% pérdida saliente (18 de 40): el canal comercial de VAEO, por donde el centro de negocios capta nuevos inquilinos y oportunidades, está operando con cobertura prácticamente nula. Es el hallazgo de mayor impacto directo en el negocio del cliente.',
    'Cero cobertura dominical: el 100% de las 352 llamadas registradas en domingo se perdieron. No hay evidencia de ningún recurso humano ni de IA de voz contestando ese día. Los sábados registran 86.0% de pérdida. El tráfico de fin de semana existe y no tiene respuesta.',
    'Fuera del horario hábil (antes de 08:00, después de 19:00): 94.7% de pérdida sobre 1,084 llamadas. Las "zonas de transición" (08:00 con 89.6%, y 19:00 con 94.3%) confirman que la cobertura humana se retira exactamente cuando el tráfico todavía llega.',
    'Inquilinos de mayor exposición: NOVAENERGIA (1,613 llamadas · 76.9% pérdida — mayor volumen del centro), QROWORX (776 llamadas · 85.8%), PICH-AGUILERA ARQUITECTOS (77.5%), WHM Events (81.5%). Cada llamada perdida de estos inquilinos de alto perfil es un riesgo de no renovación de su contrato de subarrendamiento con VAEO.',
    'Concentración del 63.4% del tráfico entrante en la cola general "VAEO Business Club" sin segmentación por prioridad de inquilino o tipo de solicitud. Dificulta cualquier gestión diferenciada y hace invisible la urgencia relativa de cada llamada.',
    'Dispersión de desempeño saliente por agente: Juan Luis Cabrera 87.4% de contestación (mejor práctica) vs. Jorge Antonio Rodríguez Ramírez 43.8% (peor). Villagomez 49.1% y "Concierge and Sales" 48.6%. El desempeño depende más de la persona que del proceso — no hay estandarización.',
    'Sin control de calidad: el campo "Evaluación" del CDR está vacío en prácticamente la totalidad de los registros. No existe hoy medición de calidad de la llamada atendida — solo del hecho de haberla contestado o no.',
    'Cuenta sin seguimiento de adopción: los 8 indicadores de adopción de producto (Voz CE, Voz VyC, Chat, Integración API, Pago automático, IA de Voz, IA de Chat, Uso del panel) están sin dato desde el alta de la cuenta, y sin observaciones registradas por el KAM en 99 días.',
    'Incertidumbre en consumo de minutos para junio y julio: el escenario mínimo es 1,449 min/mes (72.5% bolsa en junio) y el máximo teórico sube a 2,311 min/mes (115.6% — excedente). Si más del 63.9% del tráfico saliente ambiguo conectó a celulares, VAEO ya excedió su plan de 2,000 min/mes en junio y/o julio. Se requiere el reporte de facturación real para cerrar esta cifra.',
  ],

  cronologia: [
    { fecha: '22 Abr 2026',   responsable: 'Alta de cuenta',             evento: 'VAEO Business Club inicia operaciones en Callpicker. CID 180631 · Consecutivo C51. Plan: 2,000 min/mes · 220 extensiones · 1 sub-cuenta. Periodo parcial: 8 días hábiles. Consumo estimado: 284–306 min (14.2–15.3% de bolsa). Tasa de pérdida no determinada para el periodo corto.', tipo: 'neutral' },
    { fecha: 'May 2026',       responsable: 'Operación VAEO',             evento: 'Primer mes completo. Consumo 962–1,441 min (48.1–72.1% de bolsa). Tráfico entrante con tasa de pérdida elevada ya presente pero sin intervención consultiva. 8 indicadores de adopción sin dato.', tipo: 'neutral' },
    { fecha: 'Jun 2026',       responsable: 'Operación VAEO',             evento: 'Consumo mínimo confirmado: 1,449 min (72.5% bolsa). Escenario máximo: 2,311 min (115.6% — posible excedente). La incertidumbre sobre si junio excedió la bolsa no puede resolverse sin el reporte de facturación real de Callpicker. Cola Concierge Sales en situación crítica.', tipo: 'problema' },
    { fecha: '1–29 Jul 2026',  responsable: 'Operación VAEO',             evento: 'Periodo casi completo (29 de 31 días). Consumo mínimo: 1,363 min (68.2%). Escenario máximo: 2,324 min (116.2% — posible excedente). Tasa de pérdida entrante: 64.7% acumulado. Tasa de pérdida dominical: 100%.', tipo: 'problema' },
    { fecha: '29 Jul 2026',    responsable: 'SAC Callpicker',             evento: 'Generación de auditoría forense (9,470 interacciones analizadas · 99 días). Sin una sola observación de KAM registrada en el periodo. Reporte preparado para sesión consultiva de retención con VAEO.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Empresa',            value: 'VAEO Business Club — centro de negocios premium multi-inquilino' },
    { label: 'Modelo de negocio',  value: 'VAEO revende infraestructura de recepción/PBX a empresas hospedadas (co-working y oficinas). La calidad de la contestación telefónica es parte de su propuesta de valor premium.' },
    { label: 'CID / Consecutivo',  value: 'CID 180631 · Consecutivo C51 · Asesor SAC: Claudia' },
    { label: 'Plan contratado',    value: '2,000 min/mes · 220 extensiones · 1 sub-cuenta · sin rollover de minutos' },
    { label: 'MRR',                value: '$21,327 MXN · Health Score: 60 ("Estable") · Pago: 100%' },
    { label: 'Colas principales',  value: 'VAEO Business Club general (4,960 llamadas) · Concierge Front Desk · Concierge Manager · Concierge Sales' },
    { label: 'Top inquilinos',     value: 'NOVAENERGIA (1,613 llamadas) · QROWORX (776) · MTY TNH (299) · WHM Events · Pich-Aguilera · KPMG · aseguradoras' },
    { label: 'Periodo analizado',  value: '22 Abr – 29 Jul 2026 · 99 días · 9,470 interacciones totales' },
  ],

  necesidad_negocio: 'VAEO no usa la telefonía para sí mismo únicamente — la revende como parte de su propuesta de valor "premium" a sus inquilinos corporativos (Novaenergia, KPMG, aseguradoras, arquitectos). Cada llamada perdida de un inquilino es una llamada que el cliente de VAEO no atendió, lo que erosiona directamente la razón por la que ese inquilino paga por tener recepción en el centro de negocios. El problema de VAEO no es técnico — es de modelo de cobertura y de dotación por horario. La necesidad es ampliar la capacidad de respuesta sin contratar más personal a tiempo completo, especialmente en los tramos críticos: antes de las 08:00, después de las 19:00, los sábados y los domingos.',

  potencial_corto: [
    'Diagnóstico y corrección inmediata de la cola "Concierge Sales" (92.3% pérdida entrante) — identificar si hay ausencia de personal asignado, cola sin operador o configuración incorrecta. Es el punto de mayor impacto en el negocio directo de VAEO.',
    'Activar respuesta automatizada básica (IVR o mensaje con IA de voz) para franjas de 100% pérdida: antes de 08:00, después de 19:00 y domingos completos. Captura de identidad y motivo de llamada en cientos de interacciones hoy perdidas sin registro.',
    'Solicitar al equipo de facturación de Callpicker el desglose real fijo/celular de junio y julio para cerrar la incertidumbre de consumo de minutos antes de comprometer nuevas capas de servicio.',
    'Sesión de retención con los inquilinos de mayor riesgo (QROWORX 85.8%, Novaenergia 76.9%, Pich-Aguilera 77.5%, WHM Events 81.5%) — VAEO debe saber que sus propios clientes tienen esta tasa de pérdida antes de su próxima renovación.',
    'Reactivar seguimiento KAM mensual: 99 días sin una sola observación registrada. Programar revisión de Health Score, adopción y consumo de minutos como ciclo mensual.',
  ],
  potencial_largo: [
    'IA de Voz para cobertura extendida: cerrar la brecha del 94.7%–100% de pérdida fuera de horario y fines de semana con asistente de IA capaz de agendar, capturar intención y derivar. En abril y mayo hay holgura de bolsa confirmada — en junio/julio validar primero el consumo real.',
    'Enrutamiento inteligente / sígueme para las colas de mayor tráfico en horas pico (09:00–13:00, viernes): desvío a móviles de respaldo antes de que se pierdan las llamadas.',
    'Replicar el modelo de autoservicio de MTY TNH (24.4% de pérdida) hacia inquilinos de volumen similar — es el argumento interno más sólido: no es una promesa externa, es una práctica que ya funciona en el mismo conmutador.',
    'Estandarización del desempeño saliente: llevar al equipo al nivel de Juan Luis Cabrera (87.4% de contestación) sin inversión tecnológica — gestión del desempeño y mejores prácticas replicables.',
    'Grabación y evaluación de calidad: activar el campo de evaluación del CDR para medir calidad de la atención, no solo tasa de contestación.',
    'Chat / omnicanal para inquilinos de mayor volumen: canal alterno que reduce presión sobre las colas de voz en horas de saturación.',
    'Clasificación fijo/celular en reportes: resolver la brecha de la Sección 5 del análisis de forma estructural para todos los cortes futuros.',
  ],

  tacticas: [
    { nombre: 'Cuenta operativamente huérfana',         descripcion: '99 días de operación, 0 observaciones de KAM registradas. El Health Score de 60 ("Estable") con Actividad y Adopción en 50% no refleja la realidad operativa del canal telefónico.', impacto: 'VAEO puede concluir, sin haber recibido intervención consultiva, que el problema de contestación es del proveedor y no de su propio modelo de dotación — y escalar hacia churn de cuenta' },
    { nombre: 'Modelo premium con cobertura básica',    descripcion: 'VAEO vende recepción corporativa de alto nivel a sus inquilinos pero opera con 0% de cobertura los domingos y <5% efectiva fuera del horario 09:00–18:00.', impacto: 'Cada llamada perdida de NOVAENERGIA, KPMG o una aseguradora es una erosión de la propuesta de valor que VAEO les cobró — riesgo de no renovación de subarrendamiento que VAEO puede atribuir a Callpicker' },
    { nombre: 'Cola comercial sin guardia',              descripcion: 'La cola "Concierge Sales" (92.3% pérdida entrante) es el canal por donde VAEO debería capturar nuevos inquilinos. No tiene dotación visible.', impacto: 'El crecimiento orgánico del centro de negocios depende de ese canal. Con 92.3% de pérdida, prácticamente ninguna oportunidad comercial telefónica se materializa' },
  ],
  senal_alarma: 'Si en agosto la tasa de pérdida entrante supera el 70% → el modelo operativo de VAEO está en deterioro activo. Si el reporte de facturación confirma excedente en junio y/o julio → conversación urgente de ajuste de bolsa antes de que VAEO reciba cargo sorpresa. Si cualquier inquilino de alto volumen (Novaenergia, QROWORX) no renueva → posible efecto dominó de salida de inquilinos que VAEO atribuirá a la calidad del servicio de recepción.',

  problema_raiz: 'La cobertura telefónica de VAEO está diseñada para horario hábil de lunes a viernes — no para el modelo premium multi-inquilino que opera 7 días a la semana',
  problema_raiz_detalle: 'Son tres capas de problema simultáneas: (1) ausencia de cobertura en franjas críticas — domingos al 100%, fuera de horario al 94.7%, y la propia cola comercial al 92.3%; son huecos de dotación, no fallas de la plataforma; (2) cola de ventas sin personal dedicado — "Concierge Sales" opera con la peor tasa del centro en ambas direcciones, evidencia de ausencia de guardia comercial; (3) ausencia de seguimiento KAM — 99 días sin una observación registrada significa que nadie de Callpicker ha tenido visibilidad de estos indicadores hasta hoy. Los tres problemas tienen solución: cobertura extendida con IA de voz, reasignación de personal en cola de ventas, y reactivación inmediata del ciclo KAM mensual.',

  flujo_real: [
    { fase: '1. Llamada entra a VAEO Business Club',  area: 'Inquilino / Cliente externo',   accion: 'Empresa hospedada o su cliente marca el número de VAEO para ser atendida por la recepción del centro de negocios',              resultado: '64.7% de las llamadas entrantes no tienen respuesta. 1 de cada 3 llamadas consigue atención humana.' },
    { fase: '2. Cola general absorbe 63.4%',           area: 'Cola VAEO Business Club',      accion: '4,960 llamadas van a la cola general sin segmentación por urgencia, tipo de solicitud o prioridad de inquilino',                resultado: '67.2% de esas llamadas se pierden. No hay diferenciación entre una llamada de KPMG y una consulta de bajo valor.' },
    { fase: '3. Horario hábil 09:00–18:00',            area: 'Equipo de recepción',          accion: 'El único período con cobertura humana real. Incluso aquí la pérdida es del 59.8%',                                            resultado: 'El equipo está saturado en horario hábil. Pico viernes y mediodía con mayor volumen y sin refuerzo.' },
    { fase: '4. Fuera de horario y fines de semana',   area: 'Sin cobertura',                accion: 'Antes de 08:00, después de 19:00 y los 7 días de fin de semana: cero respuesta humana, cero IVR de captura',                  resultado: '94.7% de pérdida fuera de horario · 100% de pérdida dominical · 352 llamadas en domingo sin ningún tipo de respuesta' },
    { fase: '5. Cola "Concierge Sales"',               area: 'Canal comercial VAEO',         accion: '261 llamadas entrantes al canal donde VAEO capta nuevos inquilinos. Sin personal visible asignado.',                           resultado: '92.3% pérdida entrante (241/261) · 45.0% pérdida saliente. El canal de crecimiento del negocio está prácticamente cerrado.' },
    { fase: '6. Inquilino pierde su propia llamada',   area: 'Novaenergia / QROWORX / otros',accion: 'El cliente del inquilino llama al número de VAEO asignado a esa empresa hospedada y no consigue respuesta',                   resultado: 'Novaenergia: 76.9% pérdida sobre 1,613 llamadas. QROWORX: 85.8% sobre 776. Riesgo de no renovación de espacio con VAEO.' },
    { fase: '7. KAM sin seguimiento activo',           area: 'SAC Callpicker',               accion: '99 días de operación sin una sola observación de KAM registrada. Health Score estático en 60 sin revisión.',                  resultado: 'VAEO no ha recibido ninguna intervención consultiva. El problema puede atribuirse al proveedor sin que Callpicker haya tenido oportunidad de presentar los datos.' },
  ],

  comparativo: [
    { metrica: 'Tasa de pérdida entrante',      real: '64.7% acumulado (7,828 llamadas · 5,063 perdidas)',                              ideal: '≤30% de pérdida en horario hábil · ≤50% total incluyendo fin de semana con IA de voz activa' },
    { metrica: 'Cola "Concierge Sales"',         real: '92.3% pérdida entrante (241/261) · 45.0% pérdida saliente',                     ideal: 'Personal dedicado con guardia en horario comercial · pérdida entrante ≤25%' },
    { metrica: 'Cobertura dominical',            real: '100% pérdida · 352 llamadas sin respuesta · 0 humanos · 0 IVR',                 ideal: 'IA de Voz o mensaje de captura activo · 0 llamadas sin respuesta automática' },
    { metrica: 'Cobertura fuera de horario',     real: '94.7% pérdida en 1,084 llamadas antes de 08:00 y después de 19:00',            ideal: 'Asistente de IA de voz para captura de intención y agendamiento en 100% de esas llamadas' },
    { metrica: 'Inquilino MTY TNH',              real: '24.4% pérdida · 132/299 en autoservicio — modelo interno validado',             ideal: 'Replicar este modelo a NOVAENERGIA y QROWORX — mismo sistema, resultado 3× mejor' },
    { metrica: 'Desempeño saliente (agentes)',   real: 'Juan Luis 87.4% → Jorge Antonio 43.8% — brecha de 43 puntos en el mismo equipo', ideal: 'Estandarizar al nivel de Juan Luis Cabrera con gestión del desempeño (sin inversión tecnológica)' },
    { metrica: 'Seguimiento KAM',               real: '0 observaciones registradas en 99 días · 8 indicadores de adopción sin dato',   ideal: 'Revisión mensual de Health Score, adopción y consumo de minutos con observación registrada' },
    { metrica: 'Control de calidad de llamada', real: 'Campo "Evaluación" vacío en prácticamente todos los registros',                 ideal: 'Grabación + evaluación activa · métricas de calidad por agente y por inquilino' },
    { metrica: 'Consumo de minutos (jun–jul)',   real: '1,449–2,311 min/mes en junio (72.5%–115.6% bolsa) · incertidumbre fijo/celular', ideal: 'Desglose real confirmado con facturación · bolsa ajustada si se activan capas nuevas' },
  ],

  plan_inmediato: [
    { accion: 'Diagnóstico y corrección de la cola "Concierge Sales": identificar si hay ausencia de personal asignado, extensión inactiva o configuración incorrecta. Prioridad máxima — es el canal comercial de VAEO.', responsable: 'SAC Callpicker técnico + VAEO', criterio: 'Cola con personal asignado y operativo · pérdida entrante ≤25% en las siguientes 2 semanas' },
    { accion: 'Activar respuesta automática (IVR o mensaje de captura) para los domingos completos y las franjas antes de 08:00 y después de 19:00 — captura de identidad, empresa y motivo de llamada.', responsable: 'SAC Callpicker', criterio: '0 llamadas fuera de horario sin algún tipo de respuesta automática en el siguiente corte' },
    { accion: 'Solicitar a facturación de Callpicker el desglose real fijo/celular de junio y julio para cerrar la incertidumbre de consumo de minutos. Cinco extensiones concentran 91.7% de la brecha: 2503 Mariana Rendón, 1084 Villagómez, 2506 Marhec Vega, 1000 VAEO Business Club, 2502 Concierge Manager.', responsable: 'SAC Callpicker facturación', criterio: 'Reporte de minutos reales entregado y comparado contra la bolsa de 2,000 min/mes' },
    { accion: 'Sesión de presentación de auditoría con VAEO: enmarcar el problema como de modelo de cobertura, no de plataforma — 0 fallas técnicas en 6 tickets del periodo. Presentar el caso MTY TNH como evidencia interna.', responsable: 'Claudia (Asesor SAC)', criterio: 'Sesión realizada · acuerdos de acción documentados · fecha de revisión programada' },
    { accion: 'Registrar observación KAM en la cuenta y programar revisión mensual de Health Score, adopción y consumo de minutos.', responsable: 'Claudia (Asesor SAC)', criterio: 'Observación registrada en CRM · próxima revisión agendada en los siguientes 30 días' },
  ],

  plan_mediano: [
    { accion: 'Implementar IA de Voz para cobertura extendida nocturna y de fin de semana: agendamiento básico, captura de intención, derivación. En abril y mayo la holgura de bolsa es confirmada; para junio/julio validar primero el consumo real.', responsable: 'SAC Callpicker producto + VAEO', criterio: 'IA de Voz activa en franjas de 0% cobertura · reducción de pérdida dominical a ≤30%' },
    { accion: 'Implementar enrutamiento inteligente / sígueme para las colas de mayor tráfico en horas pico (09:00–13:00, viernes), con monitoreo de consumo de minutos activo desde el primer mes para no generar excedente.', responsable: 'SAC Callpicker técnico', criterio: 'Tasa de pérdida en horario hábil ≤40% al mes 2 · consumo de minutos monitoreado semanalmente' },
    { accion: 'Documentar y replicar el modelo de autoservicio del inquilino MTY TNH (24.4% pérdida) hacia NOVAENERGIA y QROWORX. Presentar a VAEO la comparativa interna como argumento.', responsable: 'Claudia + equipo técnico VAEO', criterio: 'Plan de replicación acordado con VAEO · implementación activa en inquilinos prioritarios al mes 2' },
    { accion: 'Estandarizar desempeño saliente tomando a Juan Luis Cabrera (87.4% contestación) como modelo. Sesión de gestión del desempeño con los agentes por debajo del 55%: Villagomez, Jorge Antonio Rodríguez Ramírez.', responsable: 'VAEO operaciones', criterio: 'Tasa de contestación saliente ≥70% en todos los agentes al mes 2' },
    { accion: 'Activar evaluación de calidad en el CDR: pasar de medir solo si la llamada fue contestada a medir cómo fue atendida — por agente y por inquilino.', responsable: 'SAC Callpicker', criterio: 'Campo de evaluación con datos reales en el siguiente corte mensual' },
  ],

  plan_estrategico: [
    { accion: 'Migrar la cobertura nocturna y de fin de semana a un asistente de IA de Voz con capacidad de agendamiento y derivación a sala de reuniones, gestor de cuenta y agenda del Concierge.', responsable: 'SAC Callpicker producto', criterio: 'IA de Voz activa 7×24 · tasa de pérdida total ≤35% incluyendo fin de semana' },
    { accion: 'Integrar un canal de chat / omnicanal para los inquilinos de mayor volumen (Novaenergia, QROWORX) para reducir presión sobre las colas de voz en horas de saturación.', responsable: 'SAC Callpicker + VAEO', criterio: 'Canal alterno activo · reducción del volumen entrante en voz en horas pico medible' },
    { accion: 'Formalizar revisión mensual de Health Score, adopción (8 indicadores hoy en blanco) y consumo de minutos como parte del ciclo de vida de la cuenta.', responsable: 'Claudia (Asesor SAC)', criterio: 'Revisión mensual con observación registrada · 8 indicadores de adopción con dato al mes 3' },
    { accion: 'Implementar clasificación fijo/celular en reportes de CDR saliente de forma estructural para que el análisis de consumo de minutos sea exacto en todos los cortes futuros.', responsable: 'Callpicker producto / ingeniería', criterio: 'Próximo reporte de auditoría con cifra exacta de consumo, sin rango de incertidumbre' },
    { accion: 'Proponer a VAEO un programa de auditorías forenses trimestrales como diferencial consultivo de Callpicker — este reporte como Q1.', responsable: 'Claudia + Dir. Experiencia al Cliente', criterio: 'Cronograma de auditorías acordado · entrega Q2 en octubre 2026' },
  ],

  areas_oportunidad: [
    { area: 'Corrección de cola "Concierge Sales"',   impacto: 'Recupera el canal comercial de VAEO (92.3% pérdida) · impacto directo en la capacidad de captar nuevos inquilinos · costo de corrección bajo', responsable: 'SAC Callpicker técnico' },
    { area: 'IA de Voz para horario extendido',       impacto: 'Cierra la brecha del 100% dominical y 94.7% fuera de horario · en abril/mayo hay holgura de bolsa confirmada para implementar sin excedente', responsable: 'SAC Callpicker producto' },
    { area: 'Replicación modelo MTY TNH',             impacto: 'De 24.4% a ≤30% de pérdida en inquilinos de alto volumen · evidencia interna probada · sin necesidad de hipótesis externas', responsable: 'VAEO + SAC técnico' },
    { area: 'Estandarización agente saliente',        impacto: 'De 43.8%–87.4% de contestación a un estándar de ≥70% · sin inversión tecnológica · solo gestión del desempeño', responsable: 'VAEO operaciones' },
    { area: 'Validación de consumo de minutos',       impacto: 'Cierra la incertidumbre de excedente en junio/julio · define si se puede activar sígueme y IA de Voz sin riesgo de cargos adicionales', responsable: 'SAC Callpicker facturación' },
    { area: 'Reactivación ciclo KAM mensual',         impacto: 'Previene que VAEO atribuya el problema al proveedor · posiciona a Callpicker como advisor consultivo · retención de cuenta MRR $21,327', responsable: 'Claudia' },
  ],

  perfiles: [
    {
      nombre: 'Juan Luis Cabrera', rol: 'Agente modelo saliente — mejor práctica del equipo', color: '#22c55e',
      campos: [
        { label: 'Métricas salientes',  value: '87.4% de contestación en salientes — el perfil más sólido del equipo en el canal saliente' },
        { label: 'Palanca',             value: 'Modelo a replicar. La brecha entre su desempeño (87.4%) y el peor del equipo (43.8% Jorge Antonio) es de 43 puntos — cerrable con gestión del desempeño, no con tecnología adicional.' },
      ],
    },
    {
      nombre: 'Jorge Antonio Rodríguez Ramírez', rol: 'Menor contestación saliente del equipo', color: '#ef4444',
      campos: [
        { label: 'Métricas salientes', value: '43.8% de contestación en salientes — el perfil de mayor área de mejora del equipo' },
        { label: 'Diagnóstico',        value: 'No es un problema de capacidad de la plataforma. Es brecha de práctica de gestión comercial frente al estándar de Juan Luis Cabrera.' },
        { label: 'Acción',             value: 'Sesión de coaching con base en los datos de contestación. Modelo de referencia: Juan Luis Cabrera y el protocolo de seguimiento de llamadas no contestadas.' },
      ],
    },
    {
      nombre: 'Villagomez', rol: 'Agente saliente por debajo del promedio', color: '#f59e0b',
      campos: [
        { label: 'Métricas salientes', value: '49.1% de contestación en salientes — por debajo del promedio del centro' },
        { label: 'Nota de incertidumbre', value: 'Extensión 1084 Villagómez está entre las 5 con mayor concentración de incertidumbre de minutos (139 min de brecha mín/máx). Si tiene número celular asociado, podría explicar parte de la brecha de facturación de junio/julio.' },
      ],
    },
    {
      nombre: 'MTY TNH (inquilino modelo)', rol: 'Mejor práctica interna — autoservicio intensivo', color: '#1B3FCC',
      campos: [
        { label: 'Métricas',      value: '299 llamadas entrantes · 24.4% pérdida (vs 64.7% promedio) · 132 de 299 llamadas en autoservicio (44.1%)' },
        { label: 'Evidencia',     value: 'Es la prueba más sólida del reporte: dentro del mismo sistema Callpicker, con el mismo personal de VAEO, un modelo de atención con más autoservicio reduce la pérdida en 40 puntos porcentuales. No es una hipótesis — está en los propios datos de VAEO.' },
        { label: 'Recomendación', value: 'Presentar a VAEO como argumento comercial para replicar el modelo hacia NOVAENERGIA y QROWORX. Es un cierre basado en datos del propio cliente.' },
      ],
    },
    {
      nombre: 'NOVAENERGIA DE MEXICO', rol: 'Inquilino de mayor riesgo — máximo volumen con alta pérdida', color: '#ef4444',
      campos: [
        { label: 'Métricas',          value: '1,613 llamadas (mayor volumen del centro) · 76.9% pérdida entrante' },
        { label: 'Riesgo para VAEO',  value: 'Es el cliente de VAEO con mayor volumen telefónico. Si NOVAENERGIA concluye que la recepción del centro no responde a sus clientes, el riesgo de no renovar su contrato de subarrendamiento es muy alto.' },
        { label: 'Acción sugerida',   value: 'VAEO debe ser informado de esta tasa de pérdida antes de que NOVAENERGIA llegue a la conversación de renovación. Callpicker puede ofrecer la segmentación de cola como solución inmediata.' },
      ],
    },
    {
      nombre: 'QROWORX', rol: 'Inquilino de mayor tasa de pérdida con volumen relevante', color: '#ef4444',
      campos: [
        { label: 'Métricas',         value: '776 llamadas · 85.8% pérdida — segunda mayor tasa entre inquilinos de volumen relevante' },
        { label: 'Riesgo para VAEO', value: 'Combinado con Pich-Aguilera (77.5%) y WHM Events (81.5%), estos tres inquilinos concentran riesgo reputacional alto para VAEO frente a su propio portafolio de clientes.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Marca de centro de negocios premium ya consolidada con cartera de inquilinos corporativos de alto perfil (KPMG, aseguradoras, arquitectos, empresas tecnológicas)',
      'Cola "Concierge Manager" con el mejor desempeño relativo (53.8% pérdida entrante) — evidencia de buenas prácticas replicables internamente',
      'Cero fallas técnicas en 6 tickets del periodo — la plataforma Callpicker es estable y el problema es de modelo operativo, no de la herramienta',
      'Pago 100% al día — relación contractual sana con MRR de $21,327 MXN',
      'Juan Luis Cabrera como modelo de desempeño saliente replicable al equipo (87.4% contestación)',
      'MTY TNH como evidencia interna de que un modelo con más autoservicio funciona: 24.4% pérdida vs 64.7% promedio general',
    ],
    oportunidades: [
      'IA de Voz para cerrar la brecha de 94.7%–100% de pérdida fuera de horario y domingos — en abril y mayo hay holgura de bolsa confirmada',
      'Modelo de autoservicio validado internamente (MTY TNH) replicable a NOVAENERGIA y QROWORX sin necesidad de argumentos externos',
      'Reactivar seguimiento KAM mensual: 99 días sin observación registrada — la próxima visita consultiva genera valor diferencial inmediato',
      'Diferenciar y proteger la cola "Concierge Sales" (92.3% pérdida) — corrección de impacto directo en el crecimiento de VAEO',
      'Estandarizar desempeño saliente hacia el nivel de Juan Luis Cabrera — mejora de 43 puntos sin inversión tecnológica',
      'Conversación consultiva sobre bolsa de minutos antes de que el excedente (si existe) llegue como sorpresa en la factura',
    ],
    debilidades: [
      'Cero cobertura dominical (100% pérdida · 352 llamadas) y cobertura mínima en fines de semana (86.0% pérdida el sábado)',
      '63.4% del tráfico entrante en cola general sin priorización por inquilino o tipo de solicitud — no hay diferenciación entre cuentas de alto y bajo valor',
      'Sin control de calidad: campo de evaluación vacío en ambas direcciones — no se sabe si las llamadas atendidas resuelven o frustran',
      'Ocho indicadores de adopción de producto sin dato desde el alta de la cuenta',
      'CDR saliente no distingue destinos fijo/celular — imposible cerrar con certeza si junio/julio están dentro o fuera de la bolsa de 2,000 min',
      'Brecha de 43 puntos entre el mejor y el peor agente saliente sin estandarización activa',
    ],
    amenazas: [
      'Inquilinos de alto volumen (NOVAENERGIA 76.9%, QROWORX 85.8%, Pich-Aguilera 77.5%, WHM Events 81.5%) con riesgo de no renovar espacio con VAEO por mala experiencia de recepción',
      'La cola "Concierge Sales" con 92.3% pérdida entrante amenaza directamente el crecimiento y la ocupación del centro de negocios',
      'Posible excedente no detectado sobre la bolsa de minutos en junio/julio — riesgo financiero silencioso mientras no se valide con facturación real',
      'Riesgo de que VAEO perciba el problema de contestación como falla de Callpicker, no de su modelo operativo, sin haber recibido intervención consultiva en 99 días',
      'Si algún inquilino de alto perfil (KPMG, aseguradora) reclama formalmente a VAEO por pérdida de llamadas de sus clientes → riesgo reputacional y legal para VAEO que puede escalar hacia el proveedor',
    ],
  },

  conclusion: 'VAEO Business Club no está frente a un problema técnico — la plataforma tiene 0 fallas en 99 días de operación. Está frente a un desajuste entre la propuesta de valor que vende (recepción corporativa premium) y la cobertura real que ofrece (64.7% de pérdida, 100% los domingos, cola comercial al 92.3%). La buena noticia: el problema es de modelo operativo y de dotación, no de infraestructura, y los datos internos ya tienen la solución: MTY TNH muestra que con más autoservicio la pérdida cae de 64.7% a 24.4% dentro del mismo conmutador.\n\nEl diferencial de Callpicker no es el PBX — es la lectura de lo que el PBX dice del negocio del cliente. Este reporte es esa lectura, y llega después de 99 días sin ninguna observación de KAM registrada. La primera conversación no debe empezar con una propuesta económica. Debe empezar con tres datos: 100% de pérdida los domingos, 92.3% en la cola de ventas, y el caso MTY TNH. Esos tres datos son la apertura para la conversación de IA de Voz, sígueme, y ajuste de bolsa — no al revés.',

  pierde: [
    'Si la cola "Concierge Sales" no se corrige urgentemente → VAEO sigue perdiendo el 92.3% de las oportunidades comerciales telefónicas entrantes cada semana',
    'Si los domingos siguen sin respuesta automática → 352+ llamadas/mes perdidas sin ningún registro · inquilinos sin servicio el día de la semana donde la recepción es más diferenciadora',
    'Si el excedente de junio/julio se confirma sin conversación previa → VAEO recibe un cargo sorpresa y percibe a Callpicker como caro en lugar de como advisor',
    'Si NOVAENERGIA o QROWORX no renuevan el espacio con VAEO → VAEO puede atribuir la pérdida a la calidad del servicio de recepción de Callpicker',
    'Si los 99 días sin KAM continúan → VAEO concluye solo que el problema es del proveedor · riesgo de churn de una cuenta sana de $21,327 MRR',
    'Si el equipo saliente no se estandariza → la brecha de 43 puntos entre agentes persiste y el canal outbound sigue funcionando a la mitad de su potencial real',
  ],
  gana: [
    'Corrección de cola "Concierge Sales" → canal comercial de VAEO operativo · nuevos inquilinos captados · propuesta de valor premium coherente con la realidad',
    'IA de Voz activa en fines de semana y horario nocturno → 352 llamadas dominicales con respuesta · cobertura 7×24 sin contratar personal · argumento de retención de inquilinos premium',
    'Presentación de auditoría con datos de MTY TNH → posiciona a Callpicker como advisor consultivo · cierre de conversación de autoservicio / IA sin hipótesis externas',
    'Validación de minutos con facturación real → certeza sobre excedente · propuesta de bolsa ajustada antes de que llegue el cargo · conversación proactiva, no reactiva',
    'Reactivación de ciclo KAM mensual → 8 indicadores de adopción con dato · seguimiento activo · Health Score real, no un 60 estático de 99 días',
    'Estandarización del equipo saliente hacia Juan Luis Cabrera → de 43.8%–87.4% a un estándar de ≥70% · sin inversión tecnológica · pipeline saliente más efectivo',
  ],
  recomendacion_central: 'Tres pasos, en este orden. (1) Esta semana: corregir la cola "Concierge Sales" y activar mensaje automático de captura para domingos y fuera de horario — son las dos palancas de mayor impacto inmediato sin inversión. (2) En los próximos 5 días: presentar la auditoría a VAEO enmarcando el problema como de modelo de cobertura, no de plataforma, y mostrando el caso MTY TNH (24.4% vs 64.7%) como la solución ya probada internamente. (3) Después de esa sesión: abrir la conversación de IA de Voz para horario extendido — con el dato real de facturación de junio/julio ya validado, no antes. La secuencia importa: primero demostrar valor sin propuesta comercial, después monetizar desde la confianza.',
}
