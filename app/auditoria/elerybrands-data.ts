import type { AuditoriaCase } from './types'

export const ELERY_BRANDS: AuditoriaCase = {
  id: 'elerybrands',
  asesor: null,
  nombre: 'Elery Brands · Clínicas del Hombre',
  sector: 'HealthTech · Salud Masculina · Urología y Cirugía Electiva · O2O',
  fecha_periodo: '13 Ene – 12 Jun 2026',
  fecha_auditoria: 'Jul 2026',
  tipo_cliente: 'HealthTech en expansión · 4 sedes call center · 25+ clínicas físicas · Forbes 30 Promesas · CID 85220',
  descripcion_contexto: 'Auditoría Forense · 38,330 llamadas totales (20,963 entrantes + 17,367 salientes) · 151 días activos · 4 DIDs regionales · CDMX · MTY · GDL · Puebla',
  estado: 'activo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Llamadas totales',       value: '38,330 · 151 días',      color: '#1B3FCC' },
    { label: 'Contestación entrante',  value: '66.9% · 15.8% pérdida',  color: '#22c55e' },
    { label: 'Pérdida saliente',       value: '39.5% — estructural',    color: '#ef4444' },
    { label: 'AV retención efectiva',  value: '88.4% · 12.6% tráfico',  color: '#6366f1' },
  ],

  resumen_ejecutivo: 'Elery Brands (Clínicas del Hombre) tiene una base saludable en atención entrante (66.9% de contestación), un componente creciente de autoservicio IA (16.5% del tráfico resuelto por Agente Virtual) y una infraestructura Callpicker que absorbe correctamente 38,330 llamadas en 151 días. Sin embargo, dos frentes concentran el mayor costo de oportunidad no visible: la pérdida saliente estructural del 39.5% sostenida durante 5 meses sin variación, y una ventana crítica a las 14:00 donde la contestación entrante cae del 71.5% al 53.4%.\n\nEstos no son problemas tecnológicos de plataforma — son problemas operativos del cliente que Callpicker está en posición privilegiada para acompañar. En un modelo de healthtech con plan de expansión a 30 sucursales al 2030 (Forbes México · 30 Promesas de Negocios), cada punto porcentual de pérdida evitado hoy se multiplica con el crecimiento.\n\nRanking de pérdida saliente por sede:\n• Puebla: 53.1% pérdida (DID prácticamente inactivo)\n• CDMX: 43.2% pérdida\n• GDL: 32.6% pérdida\n• MTY: 34.8% pérdida (operación más madura)',

  resultado_positivo: 'Las 11,919 llamadas entrantes contestadas en SIP generaron un ahorro implícito de 36,705 minutos en el período (~7,341 min/mes que el cliente no paga adicional) — argumento tangible para renovación. El Agente Virtual de Callpicker atiende 2,653 llamadas con 88.4% de retención efectiva — ya es un pilar operativo del centro de atención. Monterrey es la operación de mayor madurez: 69.3% contestación entrante y solo 34.8% pérdida saliente. Mónica Huerta lidera outbound con 2,071 salidas y apenas 22.4% de pérdida — la referencia interna de benchmarking para proceso.',

  hallazgos: [
    'Pérdida saliente estructural del 39.5% sostenida durante 5 meses consecutivos sin variación mensual (37.7%–41.7%) — descarta evento aislado, confirma problema de proceso. ~6,850 conversaciones perdidas en el período.',
    'Ventana crítica 14:00 hrs: contestación cae de 71.5% a 53.4% — 349 llamadas acumuladas perdidas en esa franja. Causa probable: hora de comida sin cobertura escalonada. Es el punto de quiebre operativo más accionable.',
    'Clínicas físicas con 42.7% de pérdida saliente vs 34.8% del call center central (7.9 pp de diferencia). Con duración promedio de 1.8 min (vs 2.5 min del call center), el patrón indica base de contactos deteriorada o llamadas de confirmación en horarios donde el paciente no contesta.',
    'Sábados con 20.1% pérdida entrante — la tasa más alta de la semana, 5 pp sobre el promedio laboral. ~100 llamadas adicionales perdidas por mes en el día donde el paciente electivo toma decisiones de agenda.',
    'Puebla: DID prácticamente inactivo — 30 llamadas entrantes y 32 salientes en 5 meses (< 1 llamada/semana). 53.1% pérdida saliente. Decisión pendiente: activar o depurar.',
    'Apertura tardía hora 08:00: 21.1% de pérdida. La operación efectiva arranca ~09:00. 105 llamadas perdidas antes de esa hora.',
    'Solo 24% de llamadas con evaluación registrada (5,011 de 20,963 entrantes) — base insuficiente para inteligencia de calidad conversacional.',
    'Clínica Iztapalapa con 57.6% pérdida saliente (peor del top 20). Clínicas Condesa (45.9%), Mixcoac (45.2%), Lindavista (45.3%) y Polanco (43.5%) con patrón regional CDMX consistente — no es problema aislado por clínica.',
    'Yessica Puc: contraste entre entrante (2,210 llamadas · perfil alta rotación) y saliente (43.0% pérdida — 20 pp peor que Mónica Huerta con volumen similar). Sugiere problema de listas o horario de llamada, no de habilidad.',
    '5 de los 10 días críticos de mayor pérdida ocurren en marzo (mes de mayor volumen) — estrés operativo por saturación. El 17-mar-2026 es el peor: 75 perdidas de 278 entrantes (27%).',
  ],

  cronologia: [
    { fecha: 'Ene 2026',            responsable: 'Operación CDH',               evento: '3,372 entrantes · 15.5% pérdida in · 2,853 salientes · 41.5% pérdida out. Arranque del período auditado. Agente Virtual ya operativo con 3 flujos identificados.', tipo: 'neutral' },
    { fecha: 'Feb 2026',            responsable: 'Operación CDH',               evento: 'Pico de volumen: 4,493 entrantes · 16.1% pérdida. Salientes: 3,733 · 38.4% pérdida. Mayor mes del período.', tipo: 'neutral' },
    { fecha: 'Mar 2026',            responsable: 'Operación CDH',               evento: '4,620 entrantes (máximo histórico) · 16.5% pérdida. 17-mar: peor día del período (75 perdidas de 278). 5 días críticos concentrados en este mes — estrés operativo por saturación.', tipo: 'problema' },
    { fecha: 'Abr 2026',            responsable: 'Operación CDH',               evento: '3,638 entrantes · 14.0% pérdida (mejor mes). Semana Santa impacta volumen. Salientes: 2,547 · 37.7% pérdida — menor tasa de pérdida saliente del período.', tipo: 'ok' },
    { fecha: 'May 2026',            responsable: 'Operación CDH',               evento: '3,464 entrantes · 17.4% pérdida (peor mes entrantes). Posible estrés acumulado del pico feb-mar. 3,083 salientes · 39.5% pérdida.', tipo: 'problema' },
    { fecha: '1–12 Jun 2026',       responsable: 'Operación CDH',               evento: 'Corte parcial (12 días): 1,376 entrantes · 14.1% pérdida. 1,385 salientes · 41.7% pérdida. La pérdida saliente regresa a niveles de enero — patrón estructural confirmado.', tipo: 'neutral' },
    { fecha: 'Jul 2026',            responsable: 'SAC Callpicker',              evento: 'Generación de auditoría forense (38,330 llamadas). Reporte preparado para sesión consultiva con equipo de operaciones de Elery Brands.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Elery Brands Inc.' },
    { label: 'Marca operativa',      value: 'Clínicas del Hombre (CDH) · Clínicas del Dolor · Clínicas de la Columna' },
    { label: 'Sector',               value: 'HealthTech · Salud masculina · Urología · Cirugía electiva · Modelo O2O' },
    { label: 'Sede corporativa',     value: 'Monterrey, Nuevo León' },
    { label: 'Fundación',            value: '2020 · Forbes México 30 Promesas de Negocios (nov 2024)' },
    { label: 'Financiamiento',       value: '~$1M USD · Blue Zone Ventures, Kalei Ventures, KSK Angel Fund, ENLACE+' },
    { label: 'Expansión declarada',  value: '30 sucursales al 2030 · 10 millones de personas a su red de salud' },
    { label: 'Red física actual',    value: '25+ clínicas activas como extensiones (CDMX, EdoMex, MTY, GDL, Puebla)' },
    { label: 'Sedes call center',    value: 'CDMX (53.4% tráfico) · MTY (28.4%) · GDL (17.3%) · Puebla (0.14%)' },
    { label: 'CID Callpicker',       value: 'CID 85220 · Consecutivo C22' },
    { label: 'Agente Virtual',       value: '4 flujos activos · 2,653 llamadas · 88.4% retención · 12.6% del tráfico útil' },
    { label: 'Ahorro SIP implícito', value: '~7,341 min/mes no cobrados adicionales por esquema de bolsa SIP' },
  ],

  necesidad_negocio: 'Elery Brands opera un modelo O2O (online-to-offline) de captación de pacientes donde el teléfono es el puente entre la demanda digital y la consulta presencial. Con una consulta de referencia de $1,150 MXN, cada llamada saliente recuperada es un ticket de agenda real. La operación multi-sede (25+ clínicas físicas + 4 call centers regionales) exige infraestructura de comunicaciones escalable que acompañe su crecimiento a 30 sucursales al 2030.\n\nLa necesidad inmediata es doble: (1) estabilizar la pérdida saliente del 39.5% — el canal de outbound es su principal mecanismo de captación/confirmación de citas — y (2) cubrir las ventanas horarias críticas (14:00, sábados, 08:00) donde se escapan pacientes que ya demostraron interés marcando.',

  potencial_corto: [
    'Ajustar esquema de turnos para cubrir ventana 13:00–15:00 con hora de comida escalonada — recuperación estimada 250–300 llamadas contestadas/mes sin costo técnico',
    'Auditar y depurar base de datos de contactos en clínicas físicas (42.7% pérdida saliente) — segmentar por antigüedad, validar con muestra estadística — potencial reducción de 5–10 pp en pérdida outbound',
    'Reforzar cobertura de sábados — ~100 llamadas adicionales recuperadas/mes en el día de mayor toma de decisión para consulta electiva',
    'Definir estatus de Puebla: activar campaña comercial o migrar número a redirección centralizada — decisión operativa pendiente',
    'Sesión de trabajo de 60 min con líder de operaciones CDH para validar hallazgos y definir plan de acción a 90 días',
  ],
  potencial_largo: [
    'Escalar Agente Virtual al 20–25% del tráfico (desde 12.6% actual) en picos 10:00–13:00 — la IA ya demuestra 88.4% retención efectiva',
    'Activar encuestas post-llamada como estándar (hoy solo 24% con evaluación) para inteligencia de calidad conversacional agente por agente',
    'Plan de crecimiento de bolsa anticipado: de 4,706–7,049 min/mes actuales a escala de 30 sedes en 2030 — conversación consultiva antes de que el volumen sorprenda',
    'Modelo de benchmarking interno: replicar proceso de Mónica Huerta (22.4% pérdida saliente) y Monterrey (34.8%) en CDMX y clínicas físicas',
    'Nuevos flujos AV para autoservicio de agendamiento y confirmación en picos horarios — reduce carga humana sin contratar agentes adicionales',
    'Dashboard operativo en tiempo real con alertas de tasa de pérdida por sede y hora — prevención de los 10 días críticos detectados en el análisis',
    'Integración CTI Callpicker ↔ CRM de Elery Brands para trazabilidad paciente ↔ llamada y agenda automática desde el conmutador',
  ],

  tacticas: [
    { nombre: 'Pérdida saliente estructural', descripcion: 'La tasa de 39.5% no varía entre meses (rango 37.7%–41.7%) a pesar de cambios de volumen. Es un problema de proceso —base de contactos deteriorada + criterios de marcación — no de capacidad ni de plataforma.', impacto: '~6,850 conversaciones perdidas en 5 meses. A $1,150 MXN/consulta, cada punto recuperado tiene impacto directo en revenue' },
    { nombre: 'Degradación de cobertura 14:00', descripcion: 'El patrón de caída simultánea de contestación durante la hora de comida se repite sistemáticamente mes a mes sin corrección operativa. No hay rotación escalonada de turnos.', impacto: '349 llamadas acumuladas perdidas en esa franja · 1 de cada 5 llamadas de las 14:00 no es atendida' },
    { nombre: 'Disparidad CDMX vs MTY', descripcion: 'La sede con mayor volumen (CDMX · 53.4% del tráfico) tiene la peor pérdida saliente (43.2%) vs la sede más madura (MTY · 34.8%). El proceso que funciona en MTY no está replicado en la capital.', impacto: 'CDMX genera 8,153 llamadas salientes al período — mejorar 5 pp = ~400 conversaciones adicionales' },
  ],
  senal_alarma: 'Si la pérdida saliente supera 45% en cualquier mes → las bases de contactos de clínicas físicas alcanzaron punto de deterioro crítico — auditoría inmediata de la BD. Si la contestación de las 14:00 cae bajo 45% → el problema de turnos no se corrigió y está escalando. Si el volumen de Guadalajara (hoy 60.1% contestación, peor sede entrante) baja más → riesgo de deserción de pacientes en esa región.',

  problema_raiz: 'La pérdida saliente del 39.5% es un problema de proceso —no de plataforma— con dos causas simultáneas: base de datos de contactos deteriorada en clínicas físicas y ausencia de criterios de marcación por horario y perfil de paciente',
  problema_raiz_detalle: 'El diagnóstico se sostiene en tres evidencias: (1) la tasa de pérdida saliente es estructuralmente rígida (37.7%–41.7%) sin variación mensual, lo que descarta causas externas o coyunturales; (2) las clínicas físicas (42.7%) pierden 7.9 pp más que el call center central (34.8%) con duraciones de 1.8 min vs 2.5 min — firma de llamadas de confirmación o recordatorio que encuentran números caídos o pacientes no disponibles; (3) el contraste entre Mónica Huerta (22.4% pérdida, proceso mejor definido) y extensiones de CDMX (43–57%) indica que la solución existe dentro del propio equipo y no requiere inversión adicional de plataforma. La ventana crítica de las 14:00 tiene una causa distinta y más simple: hora de comida sin rotación escalonada de agentes — accionable con un cambio de gestión sin costo técnico.',

  flujo_real: [
    { fase: '1. Captación digital',              area: 'Marketing Elery Brands',    accion: 'Anuncio digital / web captura interés del paciente potencial → deja número',             resultado: 'Llamada entrante llega al número publicado de CDH' },
    { fase: '2. IVR / AV filtra',               area: 'Callpicker AV',             accion: '16.5% se resuelve en autoservicio (12.6% AV + IVR). Resto pasa a agente humano',       resultado: 'AV retiene 88.4% de lo que toca — pilar operativo efectivo' },
    { fase: '3. Agente contesta (66.9%)',        area: 'Call center CDH',           accion: 'Agente agenda consulta — conversación promedio 3.8–5.6 min (perfiles Yessica/Mónica)', resultado: 'Paciente agendado. Pero las 14:00 tienen 53.4% de contestación — 349 perdidas' },
    { fase: '4. Clínica intenta confirmar',      area: 'Extensión clínica física',  accion: 'Clínica marca al paciente para confirmar cita (1.8 min promedio)',                       resultado: '42.7% pérdida — probable número caído o paciente no disponible en ese horario' },
    { fase: '5. Call center hace outbound',      area: 'Agentes call center',       accion: 'Ejecutivo marca lista de leads o pacientes (2.5 min promedio)',                           resultado: '34.8% pérdida — mejor que clínicas pero sigue siendo estructuralmente alto' },
    { fase: '6. Sábado sin refuerzo',            area: 'Operación fin de semana',   accion: 'Paciente electivo llama sábado para agendar — 2,029 llamadas en el período',            resultado: '20.1% pérdida · ~100 pacientes adicionales perdidos por mes vs día laboral' },
  ],

  comparativo: [
    { metrica: 'Pérdida saliente global',        real: '39.5% sostenida 5 meses · sin variación',                                   ideal: '≤25% con depuración de BD + criterios de marcación por horario y perfil' },
    { metrica: 'Pérdida saliente clínicas físicas', real: '42.7% · Iztapalapa 57.6% · patrón CDMX >43%',                          ideal: '≤30% post-auditoría de BD · modelo MTY (34.8%) como referencia' },
    { metrica: 'Contestación 14:00 hrs',         real: '53.4% — caída desde 71.5% a las 12:00',                                     ideal: '≥65% con hora de comida escalonada · recuperación estimada 250–300 llam/mes' },
    { metrica: 'Cobertura sábados',              real: '20.1% pérdida — 5 pp sobre promedio laboral',                               ideal: '≤15% con refuerzo moderado de staffing sabatino' },
    { metrica: 'Agente Virtual (carga actual)',  real: '12.6% del tráfico útil · 88.4% retención',                                  ideal: '20–25% del tráfico en picos 10:00–13:00 con flujos adicionales' },
    { metrica: 'Evaluaciones de calidad',        real: '24% de llamadas evaluadas (5,011 de 20,963)',                               ideal: '≥70% con encuesta automática post-llamada activada como estándar' },
    { metrica: 'Duración promedio outbound',     real: 'Clínicas físicas: 1.8 min · Call center: 2.5 min',                         ideal: '≥2.5 min en toda la operación con script consultivo en clínicas físicas' },
    { metrica: 'Sede Puebla',                    real: '30 in + 32 out en 5 meses · 53.1% pérdida saliente',                       ideal: 'DID activado con campaña local O depurado con redirección centralizada' },
  ],

  plan_inmediato: [
    { accion: 'Ajustar esquema de turnos del call center para cubrir la ventana 13:00–15:00 con hora de comida escalonada — al menos 2 agentes siempre disponibles en ese bloque', responsable: 'Dirección de operaciones CDH', criterio: 'Contestación hora 14:00 ≥65% en las primeras 2 semanas · recuperación de 250–300 llamadas/mes' },
    { accion: 'Auditar y depurar la base de datos de contactos outbound de clínicas físicas — segmentar por antigüedad del registro, marcar con muestra estadística antes de campaña masiva', responsable: 'Operaciones clínicas + SAC Callpicker', criterio: 'Pérdida saliente de clínicas físicas ≤35% en 30 días tras depuración' },
    { accion: 'Reforzar cobertura de sábados con al menos 1 agente adicional o activar flujo AV de captura de intención para sábados (nombre, sede, motivo, horario preferido)', responsable: 'Dirección de operaciones CDH', criterio: 'Pérdida entrante sábados ≤15% — a nivel de días laborales' },
    { accion: 'Definir estatus de DID Puebla: activar campaña comercial local O redirigir el número a call center central O dar de baja el DID', responsable: 'Dirección comercial Elery Brands', criterio: 'Decisión documentada y ejecutada en 10 días hábiles' },
    { accion: 'Sesión de trabajo 60 min con líder de operaciones CDH y SAC Callpicker para validar hallazgos, priorizar 6 recomendaciones y definir plan de acción a 90 días', responsable: 'Ejecutivo SAC Callpicker', criterio: 'Sesión realizada · acuerdos documentados · KPIs de mejora firmados' },
  ],

  plan_mediano: [
    { accion: 'Escalar Agente Virtual al 20–25% del tráfico en picos 10:00–13:00 con flujos adicionales de autoservicio: agendamiento automático, confirmación de cita, rescate de llamada perdida', responsable: 'SAC Callpicker + Elery Brands IT', criterio: 'AV absorbiendo 20%+ del tráfico útil en 30 días · tasa de retención ≥85%' },
    { accion: 'Activar encuestas post-llamada automáticas como estándar para alcanzar ≥70% de evaluación (desde 24% actual)', responsable: 'SAC Callpicker', criterio: 'Cobertura de evaluación ≥70% al mes 2 · primer reporte de calidad conversacional por agente' },
    { accion: 'Implementar protocolo de marcación outbound diferenciado por perfil: horario óptimo por tipo de paciente, script diferenciado clínicas físicas vs call center, criterio de reintentos', responsable: 'Dirección de operaciones CDH', criterio: 'Pérdida saliente global ≤30% al mes 2' },
    { accion: 'Replicar proceso de Monterrey (34.8% pérdida saliente) en CDMX — sesión de benchmarking interno con el equipo MTY', responsable: 'Dirección de operaciones CDH', criterio: 'CDMX ≤38% pérdida saliente al mes 2' },
    { accion: 'Corregir apertura tardía 08:00 — arranque efectivo con al menos 1 agente disponible a las 08:00 o activar AV de captura hasta las 09:00', responsable: 'Dirección de operaciones CDH', criterio: 'Pérdida hora 08:00 ≤12% · recuperar ~100 llamadas adicionales en 6 meses' },
  ],

  plan_estrategico: [
    { accion: 'Dashboard operativo en tiempo real con alertas cuando tasa de pérdida por sede o franja supere umbral (>20%) — prevención de los 10 días críticos', responsable: 'SAC Callpicker técnico', criterio: 'Dashboard activo y visible para director de operaciones de CDH' },
    { accion: 'Integración CTI Callpicker ↔ CRM de Elery Brands para trazabilidad completa paciente-llamada y agenda automática desde el conmutador', responsable: 'Ingeniería Callpicker + Elery IT', criterio: 'Integración en producción · 0 llamadas sin trazabilidad al CRM' },
    { accion: 'Plan de capacidad Callpicker para expansión a 30 sucursales 2030: proyección de volumen, licencias SIP, DIDs regionales y flujos AV necesarios por sede nueva', responsable: 'Ejecutivo comercial Callpicker + Elery CFO', criterio: 'Plan de crecimiento a 3 años presentado y firmado antes de dic 2026' },
    { accion: 'Programa de auditorías forenses trimestrales como entregable recurrente — este análisis como Q1 2026', responsable: 'SAC Callpicker Dir. Experiencia al Cliente', criterio: 'Cronograma de auditorías firmado · siguiente entrega: oct 2026' },
  ],

  areas_oportunidad: [
    { area: 'Ajuste de turnos 13:00–15:00',         impacto: '250–300 llamadas recuperadas/mes · costo técnico cero · ROI primera semana',                    responsable: 'Operaciones CDH' },
    { area: 'Depuración BD outbound clínicas',       impacto: '5–10 pp de reducción en pérdida saliente física · miles de llamadas de confirmación rescatadas', responsable: 'Operaciones clínicas + SAC' },
    { area: 'Refuerzo cobertura sábados',            impacto: '~100 llamadas entrantes rescatadas/mes · día de mayor decisión de agenda electiva',             responsable: 'Operaciones CDH' },
    { area: 'Escalamiento AV 20–25% del tráfico',   impacto: 'Libera agentes humanos para casos complejos · crecimiento sin contratar personal adicional',    responsable: 'SAC Callpicker Producto' },
    { area: 'Encuestas post-llamada estándar',       impacto: 'De 24% a ≥70% cobertura de evaluación · inteligencia de calidad por agente disponible',        responsable: 'SAC Callpicker' },
    { area: 'Benchmarking MTY → CDMX',              impacto: 'Replicar los 8.4 pp de ventaja de Monterrey en CDMX = ~400 conversaciones adicionales/período', responsable: 'Operaciones CDH' },
    { area: 'Plan de capacidad expansión 2030',      impacto: 'Posicionamiento de Callpicker como proveedor estratégico para el crecimiento a 30 sedes',      responsable: 'Ejecutivo comercial Callpicker' },
  ],

  perfiles: [
    {
      nombre: 'Mónica Huerta', rol: 'Referencia interna — mejor proceso entrante y saliente', color: '#22c55e',
      campos: [
        { label: 'Métricas entrante', value: '1,857 llamadas contestadas · 5.6 min promedio · 10,370 min acumulados — la ejecutiva de mayor tiempo conversacional. Conversaciones profundas / casos complejos.' },
        { label: 'Métricas saliente', value: '2,071 salidas · solo 22.4% pérdida — la mejor tasa del período. 17 pp mejor que el promedio.' },
        { label: 'Uso estratégico',   value: 'Modelo de benchmarking para el equipo. Su proceso outbound debe analizarse y replicarse en Yessica Puc y las clínicas físicas de CDMX.' },
      ],
    },
    {
      nombre: 'Yessica Puc', rol: 'Mayor volumen entrante · pérdida saliente anómala', color: '#f59e0b',
      campos: [
        { label: 'Métricas entrante', value: '2,210 llamadas contestadas (mayor volumen) · 3.8 min promedio · perfil de alta rotación de casos.' },
        { label: 'Métricas saliente', value: '1,304 salidas · 43.0% pérdida — 20 pp peor que Mónica Huerta pese a volumen similar.' },
        { label: 'Diagnóstico',       value: 'No es problema de habilidad — es problema de asignación de listas o criterio de horario de llamada. La misma agente que exige las entrantes no está optimizada en las salientes.' },
      ],
    },
    {
      nombre: 'Dayanara Gaxiola', rol: 'Tercer lugar en volumen — perfil equilibrado', color: '#1B3FCC',
      campos: [
        { label: 'Métricas',  value: '1,399 llamadas contestadas · 4.7 min promedio · 6,614 min acumulados.' },
        { label: 'Perfil',    value: 'Equilibrio entre volumen y profundidad de conversación. Puede absorber redistribución de carga de Karla Maleny.' },
      ],
    },
    {
      nombre: 'Fernanda Porras', rol: 'Perfil consultivo en entrantes', color: '#6366f1',
      campos: [
        { label: 'Métricas', value: '750 llamadas contestadas · 5.0 min promedio — conversaciones de valor.' },
        { label: 'Potencial', value: 'Candidata para flujos de mayor complejidad y cross-sell de servicios adicionales de la clínica.' },
      ],
    },
    {
      nombre: 'Clínica Iztapalapa', rol: 'Sede con mayor riesgo en outbound — 57.6% pérdida', color: '#ef4444',
      campos: [
        { label: 'Métricas',    value: '57.6% pérdida saliente — la peor del top 20 de extensiones. Parte del patrón regional CDMX pero en el extremo más crítico.' },
        { label: 'Hipótesis',   value: 'Base de contactos con alta proporción de números inactivos o pacientes históricos que ya no responden.' },
        { label: 'Acción',      value: 'Auditoría inmediata de la base de contactos de esta clínica antes de próxima campaña de confirmaciones.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'HealthTech en expansión real con respaldo venture y reconocimiento Forbes 30 Promesas — cliente estratégico de alto LTV potencial',
      'Red multi-sede (25+ clínicas) operando sobre infraestructura Callpicker sin incidentes reportados en 38,330 llamadas',
      'Agente Virtual con 88.4% de retención efectiva — la IA ya es pilar operativo, no prueba piloto',
      'Ahorro implícito de ~7,341 min/mes por esquema SIP — argumento tangible para renovación',
      'Monterrey como operación modelo: 69.3% contestación entrante · 34.8% pérdida saliente',
      'Mónica Huerta como referencia interna de proceso: 22.4% pérdida saliente — la solución existe dentro del equipo',
      'Contestación entrante global del 66.9% — base saludable para un call center médico de este volumen',
    ],
    oportunidades: [
      'Ajuste de turnos 13:00–15:00 recupera 250–300 llamadas/mes sin ningún costo de plataforma',
      'Depuración de BD outbound de clínicas físicas puede reducir 5–10 pp la pérdida saliente estructural',
      'Escalamiento AV al 20–25% del tráfico aprovecha la retención probada del 88.4% sin contratar agentes',
      'Plan de capacidad Callpicker para 30 sedes 2030 como conversación estratégica de largo plazo',
      'Benchmarking MTY → CDMX: el modelo que funciona ya existe, solo hay que replicarlo',
      'Encuestas post-llamada estándar abren inteligencia conversacional completamente ausente hoy (76% sin evaluación)',
    ],
    debilidades: [
      'Pérdida saliente del 39.5% estructuralmente rígida durante 5 meses — patrón de proceso no resuelto',
      'Clínicas físicas con 42.7% pérdida saliente (vs 34.8% call center) — bases de contactos sin auditoría',
      'Caída sistemática de contestación en ventana 14:00 sin rotación escalonada corregida',
      'Puebla inactiva: DID sin activación comercial ni decisión de baja',
      'Solo 24% de llamadas evaluadas — inteligencia de calidad conversacional prácticamente inexistente',
      'Yessica Puc con 43% pérdida saliente (20 pp peor que Mónica Huerta) sin ajuste de proceso',
      'Guadalajara con peor contestación entrante (60.1%) y menor ratio salidas/entradas (0.47)',
    ],
    amenazas: [
      'Si la pérdida saliente no mejora con la expansión a 30 sedes → el problema escala a 30 sedes en 2030',
      'Los 10 días críticos de alto volumen sin cobertura reforzada se repetirán — sin dashboard de alertas, llegarán por sorpresa',
      'Pacientes con 14:00 como única ventana de llamada encuentran 53.4% de contestación → migran a competidor de urología',
      'Si Puebla no se activa ni depura → DID convirtiéndose en ruido operativo sin ROI',
      'Sin integración CTI ↔ CRM, el crecimiento de la red genera pérdida de trazabilidad paciente que Callpicker no puede visibilizar',
      'Competidores de telecomunicaciones pueden presentar propuestas de contact center cuando el cliente empiece la expansión 2025–2030',
    ],
  },

  conclusion: 'Elery Brands es exactamente el tipo de cliente que Callpicker debe cuidar como estratégico: healthtech en expansión con financiamiento venture, red multi-sitio creciente y necesidad estructural de infraestructura de comunicaciones escalable. La plataforma ya demuestra que puede soportar el volumen (38,330 llamadas sin incidentes). El trabajo pendiente no es tecnológico — es consultivo.\n\nLos tres mensajes que deben llegar en la sesión con el cliente: (1) la contestación entrante del 66.9% es una base saludable — el AV es un pilar que ya funciona; (2) la pérdida saliente del 39.5% no es un problema de plataforma, es un problema de proceso que existe también en el mejor competidor cuando no tiene Callpicker como aliado; (3) el ajuste de turnos de las 14:00 recupera 250–300 llamadas/mes esta semana, sin propuesta comercial, sin costo.\n\nPrimero el orden, después el crecimiento. Y el crecimiento tiene nombre: 30 sedes al 2030.',

  pierde: [
    'Si la pérdida saliente del 39.5% no se aborda → con 30 sedes en 2030 serán ~41,000 conversaciones perdidas/período en lugar de 6,850',
    'Si la ventana 14:00 sigue sin cobertura → 349 llamadas perdidas por período se multiplican con el crecimiento',
    'Si Puebla no se activa ni depura → DID con 53.1% pérdida saliente sigue siendo ruido sin ROI',
    'Si no hay plan de capacidad para la expansión → en 2027 llegará un RFP de contact center que Callpicker no tiene documentado que puede ganar',
    'Si el AV no se escala → el crecimiento de volumen colapsará la capacidad humana exactamente como ocurrió entre enero y junio de este año',
    'Si los 10 días críticos se repiten sin dashboard de alertas → el cliente tendrá una crisis de atención sin que Callpicker pueda anticiparla',
  ],
  gana: [
    'Ajuste de turnos 14:00 ejecutado esta semana → 250–300 llamadas rescatadas/mes, confianza inmediata, cero costo',
    'Depuración BD outbound clínicas → pérdida saliente ≤30% → impacto tangible en agenda de consultas a $1,150 MXN c/u',
    'AV escalado al 20–25% del tráfico → crecimiento absorbido sin contratar agentes · IA como diferenciador frente a competidores',
    'Plan de capacidad Callpicker para 2030 presentado → posicionamiento como socio estratégico de la expansión, no solo proveedor de PBX',
    'Benchmarking MTY → CDMX documentado → cliente ve que Callpicker lee su operación con granularidad y propone con evidencia',
    'Programa de auditorías trimestrales activo → retención de cuenta garantizada por ciclo de valor recurrente',
  ],
  recomendacion_central: 'Abrir la sesión con el cliente con lo positivo (66.9% de contestación · AV con 88.4% de retención · 7,341 min/mes de ahorro SIP no cobrado) antes de presentar los puntos de quiebre. Cerrar con dos acciones concretas sin propuesta comercial: (1) ajuste de turnos 13:00–15:00 ejecutado en 7 días, y (2) auditoría de BD outbound de clínicas físicas iniciada en 10 días. La conversación de escalar el AV, nuevos flujos y plan de expansión 2030 viene sola después de esos primeros resultados medibles.',
}
