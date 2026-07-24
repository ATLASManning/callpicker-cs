import type { AuditoriaCase } from './types'

export const CLICKBALANCE: AuditoriaCase = {
  id: 'clickbalance',
  asesor: 'Claudia',
  nombre: 'ClickBalance ERP',
  sector: 'SaaS / ERP para PyMEs mexicanas — Tecnología B2B',
  fecha_periodo: '26 Ene – 25 Jun 2026',
  fecha_auditoria: 'Jul 2026',
  tipo_cliente: 'B2B SaaS · +5,000 clientes activos · Holding GC1 · Culiacán, Sinaloa · CID 117416',
  descripcion_contexto: 'Auditoría Forense de Comunicaciones · 4,141 llamadas analizadas (3,017 entrantes + 1,124 salientes) · 150 días operativos · 2 números Callpicker',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Tasa pérdida (jun)',      value: '43.8% → ↑ desde 21.1%',  color: '#ef4444' },
    { label: 'Clientes únicos perdidos', value: '375 · 45 intentaron 5+', color: '#f59e0b' },
    { label: 'Contestación jun 2026',   value: '27.7% (era 77.2% en ene)', color: '#ef4444' },
    { label: 'Min. consumidos (mix)',   value: '~2,936 · ~587/mes',       color: '#1B3FCC' },
  ],

  resumen_ejecutivo: 'ClickBalance ERP no está frente a una falla puntual del PBX: está frente a un deterioro estructural del canal telefónico. En los últimos 5 meses el ecosistema procesó 4,141 llamadas con un patrón inequívoco: mientras el volumen entrante se multiplicó por 13 (66 llamadas en enero → 881 en junio), la capacidad humana de contestar se contrajo de 77.2% a 27.7%. Es la firma de una operación que no absorbió su propio crecimiento comercial.\n\nEvolución mensual de contestación:\n• Enero: 66 llamadas · 77.2% contestación\n• Febrero: 283 llamadas · 63.3% contestación\n• Marzo: 524 llamadas · 51.6% contestación\n• Abril: 597 llamadas · 51.3% contestación\n• Mayo: 666 llamadas · 39.6% contestación\n• Junio: 881 llamadas · 27.7% contestación\n\nEl punto de quiebre operativo ocurrió entre marzo y abril 2026. A partir de ese momento, con volumen >500 llamadas/mes, la contestación cayó bajo el 52% y no se recuperó. Para junio: 1 de cada 4 clientes que necesitaba hablar con un humano lo consiguió.',

  resultado_positivo: 'Los 4,141 registros de llamadas llegan correctamente al sistema, se enrutan y quedan trazables — la infraestructura Callpicker funciona técnicamente. El Self_service (IVR) creció de 9 a 437 llamadas mensuales, absorbiendo consultas repetitivas y funcionando como válvula de descompresión. Daniela Benítez tiene solo 6.9% de pérdida con conversaciones de alta calidad (6.8 min promedio) — perfil modelo replicable. Adilene Vizcarra, cuando contesta, tiene 9.3 min de conversación promedio — la conversación de mayor valor del equipo. ClickBalance está en modo de expansión real (volumen ×13): esto es una oportunidad de crecer con el cliente, no solo de rescatar la operación.',

  hallazgos: [
    'Deterioro estructural de contestación: de 77.2% (enero) a 27.7% (junio) mientras el volumen se multiplica por 13. El canal se está rompiendo bajo su propio éxito. En junio, 72.3% de quienes necesitaban hablar con un humano no lo consiguieron.',
    'Cola / extensión de Leticia Vázquez 100% rota: 103 llamadas asignadas · 0 contestadas. No es problema de la persona — es problema de configuración de cola, extensión inactiva o desvío mal definido. Corrección posible en 24 horas.',
    'Destino "-" absorbe 345 llamadas perdidas (11.4% del total entrante): llamadas que llegan al conmutador sin destino asignado. Falla de diseño del IVR o cola de desborde no definida.',
    'Adilene Vizcarra con 55% de pérdida pero 9.3 min de conversación promedio: la extensión de mayor valor cuando contesta tiene también la segunda mayor tasa de pérdida. No es problema de capacidad — es sobreasignación o enrutamiento que la satura.',
    '375 clientes únicos abandonaron sin ser atendidos alguna vez · 143 reintentaron 2+ veces · 45 lo intentaron 5+ veces. El número más insistente marcó 35 veces. Cada uno es un churn silencioso en proceso o un prospecto caliente que se enfrió.',
    'Ventanas horarias críticas: 15:00–16:00 con 56.2% de pérdida (240 llamadas · 91 perdidas) y 16:00–17:00 con 51.9% de pérdida (320 llamadas · 112 perdidas). El punto de mayor volumen histórico es exactamente donde más falla la contestación.',
    'Sábados sin cobertura humana: 192 llamadas (105 buzón, 86 perdidas, 0 contestadas). Política de fin de semana sin alternativa de captura.',
    'Viernes con mayor tasa de pérdida entre semana (48.9%) — posible fatiga de agentes o rotación de turnos mal cubierta hacia el cierre semanal.',
    'Outbound de baja calidad: Josue Miguel Gutierrez concentra el 39% del volumen saliente (440 llamadas) con solo 56.4% de conexión y 1.2 min promedio. Diana Vega: 47.2% conexión · 1.04 min. Aida Cruz: 59.3% · 1.06 min. Firma de marcación masiva sin calificación previa — no hay descubrimiento consultivo.',
    'Bolsa de minutos subestimada: consumo actual ~587 min/mes (mix 70/30). Si se recuperan las 889 llamadas perdidas, el consumo se dispara a 1,500–1,800 min/mes — sin alerta ni propuesta de ajuste activa.',
  ],

  cronologia: [
    { fecha: 'Ene 2026',         responsable: 'Operación ClickBalance',    evento: '66 llamadas entrantes · 77.2% contestación · tasa pérdida 21.1%. Operación en equilibrio.', tipo: 'ok' },
    { fecha: 'Feb 2026',         responsable: 'Operación ClickBalance',    evento: '283 llamadas entrantes · 63.3% contestación · 87 perdidas. Primera señal de presión sobre la capacidad.', tipo: 'neutral' },
    { fecha: 'Mar 2026',         responsable: 'Operación ClickBalance',    evento: '524 llamadas entrantes · 51.6% contestación · 164 perdidas. PUNTO DE QUIEBRE: el volumen cruzó los 500/mes y la contestación cayó bajo el 52%. No volvió a recuperarse.', tipo: 'problema' },
    { fecha: 'Abr 2026',         responsable: 'Operación ClickBalance',    evento: '597 llamadas entrantes · 51.3% contestación · 215 perdidas. El deterioro se consolida — la operación no absorbió el crecimiento.', tipo: 'problema' },
    { fecha: 'May 2026',         responsable: 'Operación ClickBalance',    evento: '666 llamadas entrantes · 39.6% contestación · 216 perdidas + 43 voicemail. IVR Self_service crece a 237 — válvula de descompresión activa pero insuficiente.', tipo: 'problema' },
    { fecha: 'Jun 2026',         responsable: 'Operación ClickBalance',    evento: '881 llamadas entrantes (×13 vs enero) · 27.7% contestación — mínimo histórico. 321 llamadas humanas fallidas (195 perdidas + 126 voicemail). IVR absorbe 437.', tipo: 'problema' },
    { fecha: 'Jul 2026',         responsable: 'SAC Callpicker',            evento: 'Generación de auditoría forense (4,141 llamadas analizadas). Reporte preparado para sesión consultiva con dirección de ClickBalance.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Empresa',             value: 'ClickBalance ERP — plataforma SaaS 100% en la nube para PyMEs mexicanas' },
    { label: 'Holding',             value: 'GC1 — tecnología, servicios financieros, agricultura, arquitectura, bienes raíces, productos del mar' },
    { label: 'Sede',                value: 'Culiacán, Sinaloa' },
    { label: 'Trayectoria',         value: '+25 años en el mercado · +5,000 clientes · +1,000 empresas activas declaradas' },
    { label: 'Competidores',        value: 'Aspel, Contpaqi, Bind ERP, Oracle NetSuite, Odoo, Microsoft Dynamics' },
    { label: 'Portafolio',          value: 'Facturación CFDI, contabilidad, inventarios, CRM, nómina, BI, CB Rutas, asistente conversacional' },
    { label: 'Números Callpicker',  value: '(800) 611-1242 (2,858 entrantes) · (55) 89-50-54-23 (157 entrantes + salientes)' },
    { label: 'CID Callpicker',      value: 'CID 117416 · Consecutivo C43' },
    { label: 'Agentes activos',     value: '8 en entrantes · 8 en salientes (Josue Miguel, Adilene, Diana, Daniela, Karla, Aida, Rebeca, Saul)' },
  ],

  necesidad_negocio: 'ClickBalance compite en un mercado ERP SaaS altamente saturado donde la retención de clientes y la calidad del soporte son diferenciadores primarios. El teléfono no es un canal secundario para su base PyME: es el eslabón donde el cliente llega cuando algo no funciona en el ERP en producción. Que 4 de cada 10 llamadas de necesidad humana se pierdan es un indicador de riesgo de churn directo sobre una base de +5,000 clientes activos.\n\nClickBalance está en modo de expansión (volumen ×13 en 5 meses). La infraestructura telefónica no está acompañando ese crecimiento. La necesidad inmediata es de estabilización: corregir las colas rotas, rescatar los 375 clientes no atendidos y redimensionar la capacidad para el ClickBalance de junio 2026, no para el de enero.',

  potencial_corto: [
    'Corrección de cola Leticia Vázquez (0 contestaciones · 103 pérdidas) — acción de configuración en 24 horas, sin costo',
    'Corrección de destino "-" (345 llamadas sin destino) — revisión de flujo IVR / cola de desborde. Recupera 11.4% del tráfico perdido',
    'Sesión consultiva con ClickBalance: presentar las 3 verdades del reporte — deterioro de contestación, colas rotas, 375 clientes no atendidos',
    'Cruzar top 50 de números más insistentes con CRM de ClickBalance para identificar cuentas AAA en riesgo y ejecutar rescate dirigido en 5 días hábiles',
    'Configurar mensaje conversacional de sábado con captura de intención (nombre, empresa, motivo)',
  ],
  potencial_largo: [
    'Implementar Virtual Voice Agent (VVA) para absorber consultas repetitivas (estado de cuenta, agenda de asesor, soporte N1) — el Self_service ya crece orgánicamente, darle formalidad con IA',
    'WhatsApp Business API integrado al conmutador para desviar consultas asíncronas y descomprimir el canal de voz',
    'Rediseño de bolsa: pasar de bolsa fija a escalonada con proyección de crecimiento (1,500–1,800 min/mes cuando se recupere la contestación)',
    'Ampliación temporal de licencias SIP para cubrir picos 10:00–12:00 y 15:00–17:00',
    'Contact center formal con SLA de contestación (<20 seg) y tasa de abandono (<10%) — métrica de nivel de servicio',
    'Integración CTI Callpicker ↔ CRM ClickBalance para trazabilidad de cada llamada al cliente y tickets automáticos',
    'Dashboard operativo en tiempo real con alerta cuando la tasa de pérdida cruce umbral (>25%)',
    'Programa de auditorías forenses trimestrales — este reporte como primer entregable de ciclo recurrente',
  ],

  tacticas: [
    { nombre: 'Absorción silenciosa de crecimiento', descripcion: 'El volumen crece ×13 en 5 meses sin que la operación detecte o comunique el punto de quiebre. El deterioro ocurre sin alertas.', impacto: 'Contestación cae de 77.2% a 27.7% en 5 meses — sin intervención, el patrón continúa en julio y agosto' },
    { nombre: 'IVR como anestesia estadística', descripcion: 'El crecimiento del Self_service (9 → 437 llamadas/mes) puede leerse como éxito del autoservicio o como clientes que se rindieron de esperar humano. Sin métrica de resolución, ambas lecturas son válidas.', impacto: 'Si el IVR frustra en lugar de resolver, parte del 42.8% de "autoservicio" es churn silencioso no cuantificado' },
    { nombre: 'Outbound de volumen sin calidad', descripcion: '440 llamadas salientes de Josue Miguel con 1.2 min promedio — verificación de identidad, no conversación consultiva. El canal saliente está midiendo cantidad de intentos, no calidad de contacto.', impacto: '43.6% no conectadas + conversaciones ultracortas = pipeline que no avanza' },
  ],
  senal_alarma: 'Si la tasa de contestación mensual cae bajo 25% en julio → la operación está al borde del colapso del canal telefónico. Si el volumen de sábados supera 50 llamadas/mes sin cobertura → hay demanda real no capturada. Si el top 10 de números insistentes cruza con clientes de facturación >$X en CRM → churn inminente de cuentas clave.',

  problema_raiz: 'La arquitectura telefónica está diseñada para el ClickBalance de enero 2026, no para el de junio 2026 — el canal no se redimensionó al crecer el negocio',
  problema_raiz_detalle: 'Son tres capas de problema simultáneas: (1) configuración rota — Leticia Vázquez con 0 contestaciones y destino "-" con 345 llamadas perdidas son errores de arquitectura correc­ibles en 48 horas; (2) capacidad insuficiente — el volumen ×13 sin contratar licencias adicionales ni ajustar turnos es el núcleo del deterioro; (3) ausencia de monitoreo — nadie detectó el punto de quiebre en marzo porque no había dashboard de tasa de contestación con umbral de alerta. Los tres problemas tienen solución concreta y secuenciada: primero corregir lo roto, después escalar la capacidad, después instrumentar el monitoreo.',

  flujo_real: [
    { fase: '1. Llamada entra (800) 611-1242',     area: 'Llamante externo',          accion: 'Cliente o prospecto marca el número publicado de ClickBalance',          resultado: '1 de cada 4 consigue hablar con humano en junio. Los otros 3 van a buzón, IVR o pérdida' },
    { fase: '2. IVR distribuye',                    area: 'Callpicker IVR',            accion: '42.8% se resuelve en Self_service; el resto intenta llegar a agente',     resultado: 'Sin métrica de resolución — no sabemos si Self_service resuelve o frustra' },
    { fase: '3. Cola Leticia Vázquez',              area: 'Destino mal configurado',   accion: '103 llamadas enrutadas a extensión inactiva o cola rota',                 resultado: '100% pérdida — 103 clientes sin atender por error de configuración' },
    { fase: '4. Destino "-" absorbe desborde',     area: 'Falla de diseño IVR',       accion: '345 llamadas sin destino definido terminan en estado perdido',            resultado: '11.4% del volumen total desaparece sin traza humana' },
    { fase: '5. Pico 15:00–17:00',                 area: 'Equipo comercial',          accion: '560 llamadas en 2 horas · >50% de pérdida',                              resultado: '203 clientes no atendidos en el periodo de mayor actividad post-comida' },
    { fase: '6. Cliente insistente',                area: 'Cliente frustrado',         accion: 'Reintenta 5, 10, 35 veces sin conseguir hablar con nadie',               resultado: '45 clientes con 5+ intentos fallidos = 45 churns silenciosos en proceso' },
    { fase: '7. Outbound sin calidad',              area: 'Josue Miguel / Diana',      accion: 'Llamada saliente promedio: 1.2 min · 43% no conectadas',                  resultado: 'El teléfono no genera pipeline — solo verifica existencia del contacto' },
  ],

  comparativo: [
    { metrica: 'Tasa de contestación',          real: '27.7% en junio 2026 (era 77.2% en enero)',                                    ideal: '≥75% de contestación humana en horario laboral declarado' },
    { metrica: 'Cola Leticia Vázquez',          real: '0 contestaciones · 103 pérdidas (100% error)',                               ideal: 'Extensión activa o cola redirigida a agente disponible · corrección en 24 h' },
    { metrica: 'Destino "-"',                   real: '345 llamadas sin destino (11.4% del total)',                                  ideal: 'Cola de desborde definida con destino de respaldo o buzón etiquetado' },
    { metrica: 'Cobertura hora pico 15-17h',    real: '56.2% y 51.9% de pérdida — las peores horas del día',                       ideal: 'Refuerzo de turno o callback automático activado en espera >30 seg' },
    { metrica: 'Cobertura sábados',             real: '192 llamadas · 0 atendidas · sin mensaje de alternativa',                   ideal: 'Mensaje conversacional de captura (nombre, empresa, motivo) o IVR de agenda' },
    { metrica: 'Calidad outbound',              real: '1.2 min promedio (Josue) · 1.04 min (Diana) — marcación masiva sin calidad', ideal: '≥3 min promedio con script consultivo · calificación previa de contactos' },
    { metrica: 'Monitoreo de contestación',     real: 'Sin dashboard de tasa de pérdida · quiebre de marzo no fue detectado',      ideal: 'Dashboard en tiempo real con alerta cuando tasa de pérdida cruce >25%' },
    { metrica: 'Dimensionamiento de bolsa',     real: '~587 min/mes actuales · sin alerta de proyección de crecimiento',           ideal: 'Bolsa escalonada 1,500–1,800 min/mes con proyección de crecimiento incluida' },
  ],

  plan_inmediato: [
    { accion: 'Diagnóstico y corrección de cola / extensión de Leticia Vázquez: reconfigurar destino o desactivar el desvío roto', responsable: 'SAC Callpicker técnico', criterio: 'Cero llamadas perdidas por ese destino en las siguientes 48 horas' },
    { accion: 'Corrección del destino "-": revisar flujo IVR y definir cola de desborde con destino de respaldo o buzón etiquetado', responsable: 'SAC Callpicker + ClickBalance', criterio: 'Eliminar el estado "-" del reporte de llamadas — toda llamada debe tener destino nombrado' },
    { accion: 'Sesión consultiva con dirección de ClickBalance: presentar las 3 verdades del reporte (deterioro de contestación, colas rotas, 375 clientes no atendidos)', responsable: 'Ejecutivo comercial Callpicker', criterio: 'Sesión realizada con acuerdos documentados · próximos pasos firmados' },
    { accion: 'Cruzar top 50 de números más insistentes con CRM de ClickBalance: identificar cuentas AAA en riesgo y ejecutar rescate telefónico dirigido', responsable: 'ClickBalance + SAC', criterio: 'Rescate ejecutado en 5 días hábiles · tasa de contacto del rescate documentada' },
    { accion: 'Configurar mensaje conversacional de sábado con captura de intención (nombre, empresa, motivo, mejor horario de contacto)', responsable: 'SAC Callpicker', criterio: 'Mensaje activo antes del próximo sábado · leads capturados en cola de seguimiento lunes' },
  ],

  plan_mediano: [
    { accion: 'Ampliar licencias SIP temporales para cubrir picos 10:00–12:00 y 15:00–17:00 — con objetivo de contestación ≥60% en esas franjas', responsable: 'SAC Callpicker + ClickBalance', criterio: 'Tasa de pérdida en franjas pico ≤25% al mes 1' },
    { accion: 'Coaching de outbound hacia perfiles de conversación consultiva — usar Adilene Vizcarra (2.22 min) y Karla Maleny (4.62 min) como modelos vs Josue Miguel (1.2 min)', responsable: 'Dirección ClickBalance', criterio: 'Duración promedio de salientes ≥2.5 min en toda la extensión en mes 2' },
    { accion: 'Rediseño de bolsa de minutos: proyección de crecimiento a 1,500–1,800 min/mes con estructura escalonada · alertar antes de que ocurra el excedente', responsable: 'SAC Callpicker comercial', criterio: 'Propuesta de bolsa enviada y aprobada antes de que el consumo cruce el plan actual' },
    { accion: 'Implementar Virtual Voice Agent para absorber consultas repetitivas (estado de cuenta, agenda de asesor, soporte N1) — formalizar el crecimiento orgánico del Self_service', responsable: 'JMLD Producto', criterio: 'VVA activo con 3 flujos base · métricas de resolución vs frustración disponibles' },
    { accion: 'Configurar dashboard operativo con alerta de tasa de pérdida en tiempo real (umbral: >25% activa notificación)', responsable: 'SAC Callpicker técnico', criterio: 'Dashboard activo y visible para director de operaciones de ClickBalance' },
  ],

  plan_estrategico: [
    { accion: 'WhatsApp Business API integrado al conmutador para desviar consultas asíncronas y descomprimir el canal de voz en picos', responsable: 'SAC Callpicker + ClickBalance', criterio: 'Integración activa · reducción medible del volumen entrante en voz en picos' },
    { accion: 'Contact center formal con SLA de contestación (<20 seg) y tasa de abandono (<10%): definición de estructura, turnos y protocolos de escalamiento', responsable: 'ClickBalance + Callpicker consultoría', criterio: 'SLA firmado y métricas operativas activas al mes 3' },
    { accion: 'Integración CTI Callpicker ↔ CRM ClickBalance: trazabilidad de cada llamada al registro del cliente y creación automática de tickets de soporte', responsable: 'Ingeniería Callpicker + ClickBalance IT', criterio: 'Integración en producción · 0 llamadas sin trazabilidad al CRM' },
    { accion: 'Programa de auditorías forenses trimestrales: este reporte como Q1, entrega Q2 en octubre 2026, Q3 en enero 2027', responsable: 'SAC Callpicker Dir. Experiencia', criterio: 'Cronograma de auditorías firmado · primer reporte Q2 entregado en fecha' },
  ],

  areas_oportunidad: [
    { area: 'Corrección de colas rotas (costo cero)',          impacto: 'Recupera ~448 llamadas/periodo (345 destino "-" + 103 Leticia Vázquez) en 48 horas sin inversión adicional', responsable: 'SAC Callpicker técnico' },
    { area: 'Rescate de 375 clientes únicos no atendidos',    impacto: 'Top 50 cruzado con CRM = 5 días de trabajo para recuperar ingresos ya facturados · 45 churns silenciosos en proceso', responsable: 'ClickBalance + SAC' },
    { area: 'Virtual Voice Agent',                             impacto: 'Absorbe consultas repetitivas · libera agentes para conversaciones de valor · Self_service crece orgánicamente ya', responsable: 'JMLD Producto' },
    { area: 'WhatsApp Business API',                           impacto: 'Descomprime el canal de voz en picos · captura consultas asíncronas · nueva bolsa de conversaciones facturables', responsable: 'SAC Callpicker' },
    { area: 'Ampliación de bolsa (crecimiento consultivo)',   impacto: 'Conversación de crecimiento antes de que el excedente sorprenda al cliente · de 587 min/mes a 1,500–1,800 proyectados', responsable: 'Ejecutivo comercial Callpicker' },
    { area: 'Auditorías forenses trimestrales',               impacto: 'Diferencial consultivo de Callpicker · ciclo recurrente de valor que justifica renovación y expansión', responsable: 'Dir. Experiencia al Cliente' },
  ],

  perfiles: [
    {
      nombre: 'Daniela Benítez', rol: 'Agente modelo — alta contestación, baja pérdida', color: '#22c55e',
      campos: [
        { label: 'Métricas entrante', value: '228 contestadas · 17 perdidas · 6.9% pérdida · 6.8 min promedio — el perfil más sólido del equipo' },
        { label: 'Palanca',           value: 'Modelo a replicar para distribución de llamadas y capacitación del equipo. Su patrón operativo es el objetivo de los otros 7 agentes.' },
      ],
    },
    {
      nombre: 'Adilene Vizcarra', rol: 'Mayor valor de conversación · 55% pérdida por sobreasignación', color: '#f59e0b',
      campos: [
        { label: 'Métricas entrante', value: '157 contestadas · 192 perdidas · 55% pérdida · 9.3 min promedio — la conversación más larga del equipo' },
        { label: 'Métricas saliente', value: '2.22 min promedio saliente — uno de los perfiles consultivos de outbound, junto con Karla Maleny' },
        { label: 'Diagnóstico',       value: 'No es problema de capacidad — es sobreasignación o enrutamiento que la satura. Cuando contesta, genera la mayor profundidad de conversación.' },
        { label: 'Acción',            value: 'Revisar configuración de cola. Reducir asignaciones concurrentes. Su tiempo es el más valioso del equipo.' },
      ],
    },
    {
      nombre: 'Karla Maleny García', rol: 'Motor principal — alto volumen pero sobrecargada', color: '#1B3FCC',
      campos: [
        { label: 'Métricas',  value: '383 contestadas (41% del total atendido) · 210 perdidas · 35.4% pérdida · 4.62 min saliente promedio' },
        { label: 'Diagnóstico', value: 'Concentra demasiada carga. La pérdida absoluta más alta del equipo no es fallo de la agente — es consecuencia del volumen que absorbe.' },
        { label: 'Acción',    value: 'Redistribuir carga con licencias SIP adicionales. Es el perfil que más pierde porque es el que más recibe.' },
      ],
    },
    {
      nombre: 'Leticia Vázquez', rol: 'CRÍTICO — extensión o cola 100% rota', color: '#ef4444',
      campos: [
        { label: 'Métricas',    value: '0 llamadas contestadas · 103 perdidas · 100% pérdida' },
        { label: 'Diagnóstico', value: 'No es un problema de la persona. La extensión está inactiva, la cola mal configurada o el desvío apunta a un destino muerto.' },
        { label: 'Acción',      value: 'Corrección en configuración Callpicker en máximo 24 horas. Primera prioridad técnica del reporte.' },
      ],
    },
    {
      nombre: 'Josue Miguel Gutiérrez', rol: 'Mayor volumen outbound · calidad baja', color: '#8b5cf6',
      campos: [
        { label: 'Métricas saliente', value: '440 llamadas salientes (39% del total) · 56.4% conexión · 1.2 min promedio' },
        { label: 'Métricas entrante', value: '9 contestadas · 6 perdidas · 19.3 min promedio cuando sí contesta — perfil técnico de alta profundidad en entrantes' },
        { label: 'Diagnóstico',       value: 'Paradoja: en salientes genera marcación masiva sin calidad consultiva. En entrantes muestra la conversación más larga del equipo (19.3 min). El perfil técnico debe redirigirse hacia entrantes complejas y outbound calificado, no volumétrico.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cliente SaaS B2B con base declarada de +5,000 clientes activos — alto LTV potencial por retención',
      'Crecimiento real de demanda ×13 en 5 meses — el producto está captando mercado activamente',
      'Infraestructura Callpicker técnicamente funcional: 4,141 llamadas trazadas correctamente',
      'Self_service (IVR) creciendo orgánicamente de 9 a 437 llamadas/mes — demanda de automatización ya probada',
      'Daniela Benítez como perfil modelo replicable (6.9% pérdida · 6.8 min de conversación)',
      'Adilene Vizcarra y Karla Maleny como modelos consultivos de outbound (2.22 y 4.62 min promedio)',
      'Holding GC1 con presencia diversificada — potencial de expansión dentro del grupo',
    ],
    oportunidades: [
      'Corrección de colas rotas en 48 h recupera 448 llamadas perdidas sin inversión adicional',
      'Rescate de 45 clientes más insistentes puede detener 45 churns silenciosos en proceso',
      'VVA para formalizar el crecimiento del IVR y liberar agentes para conversaciones de valor',
      'WhatsApp Business API para desviar consultas asíncronas y descomprimir el canal de voz',
      'Conversación consultiva de bolsa antes de que el crecimiento genere excedentes sorpresa',
      'Auditorías forenses trimestrales como diferencial de retención y expansión de cuenta',
      'Integración CTI ↔ CRM para trazabilidad completa y tickets automáticos de soporte',
    ],
    debilidades: [
      'Cola de Leticia Vázquez rota: 103 llamadas perdidas por error de configuración, no de capacidad',
      'Destino "-" consume 11.4% del tráfico total sin destino ni registro de escalamiento',
      'Sin dashboard de tasa de contestación en tiempo real — el quiebre de marzo no fue detectado',
      'Sin bolsa dimensionada para el ClickBalance de junio — consumo actual vs proyectado sin alerta',
      'Cobertura de sábados inexistente sin mensaje de captura alternativa',
      'Outbound de bajo rendimiento consultivo en 5 de 8 extensiones (<1.5 min promedio)',
      'Concentración de contestación en Karla Maleny (41% del total) sin redundancia',
    ],
    amenazas: [
      'Si el deterioro continúa sin acción: julio y agosto con contestación <20% — punto de no retorno de confianza',
      '45 clientes con 5+ intentos fallidos — cada semana que pasa aumenta la probabilidad de churn irrecuperable',
      'Competidores ERP (Aspel, Contpaqi, Bind) con soporte nativo activo pueden capturar clientes insatisfechos',
      'El crecimiento del volumen sin redimensionamiento seguirá agravando la tasa de pérdida mes a mes',
      'Si el excedente de bolsa llega sin propuesta previa → conversación reactiva de costo vs valor percibido bajo',
      'Un incidente técnico de conectividad en Culiacán sin failover documentado puede dejar la línea muerta',
    ],
  },

  conclusion: 'ClickBalance ERP no está frente a una crisis de producto — está frente a un canal que no se redimensionó mientras el negocio crecía. La buena noticia: dos de los mayores problemas (cola de Leticia Vázquez + destino "-") son errores de configuración corregibles en 48 horas que recuperan 448 llamadas perdidas por período sin inversión adicional.\n\nEl diferencial de Callpicker no es tener el conmutador. Es leer lo que el conmutador dice del negocio del cliente. Este reporte es esa lectura. La secuencia correcta: primero corregir lo roto, después escalar la capacidad, después instrumentar el monitoreo. No cierre con propuesta económica en la primera reunión — cierre con dos compromisos: (1) corregir las configuraciones rotas en 5 días, (2) entregar el mapa de rescate de los 45 clientes más frustrados con guion sugerido. Después de eso, la conversación de VVA, WhatsApp API y crecimiento de bolsa tiene sentido natural.',

  pierde: [
    'Si la cola de Leticia Vázquez y el destino "-" no se corrigen esta semana → siguen cayendo ~100 llamadas evitables por mes',
    'Si los 45 clientes más insistentes no son contactados proactivamente → 45 churns de ERP en producción con dolor sin atender',
    'Si el volumen de julio y agosto sigue sin refuerzo → contestación puede caer bajo 20% y generar crisis de confianza irrecuperable',
    'Si la conversación de bolsa no ocurre antes de que el consumo cruce el plan → cliente recibe excedente por sorpresa y percibe a Callpicker como caro, no como partner',
    'Si los sábados siguen sin captura de leads → demanda B2B de fin de semana se va a WhatsApp de competidores',
    'Si el deterioro continúa sin dashboard de alerta → nadie detectará el próximo punto de quiebre hasta que ya sea crisis',
  ],
  gana: [
    'Corrección de colas rotas en 48 h → 448 llamadas recuperadas por período, confianza técnica inmediata, sin costo',
    'Rescate de 45 clientes más insistentes → detención de churns de ERP en producción, percepción de Callpicker como partner proactivo',
    'VVA activo → Self_service formal con métricas · agentes liberados para conversaciones de valor · crecimiento sin contratar más personas',
    'Dashboard de tasa de pérdida en tiempo real → ClickBalance detecta su propio quiebre antes de que ocurra',
    'Conversación consultiva de bolsa → crecimiento de MRR natural, sin sorpresas de excedente, renovación fortalecida',
    'WhatsApp API activo → canal asíncrono que descomprime voz en picos y genera nueva bolsa facturable',
    'Auditorías trimestrales → Callpicker se posiciona como advisor, no solo como proveedor de PBX',
  ],
  recomendacion_central: 'Dos pasos esta semana, sin propuesta comercial de por medio. (1) En 48 horas: corrección técnica de la cola de Leticia Vázquez y el destino "-" — recupera 448 llamadas perdidas de forma inmediata y demuestra valor sin facturar. (2) En 5 días hábiles: entregar a ClickBalance el mapa de rescate de sus 45 clientes más insistentes con guion de llamada sugerido y priorización por valor en CRM. Después de esas dos acciones con resultado medible, la conversación de Virtual Voice Agent, WhatsApp API y crecimiento de bolsa tiene momentum natural — no es venta de catálogo, es consecuencia de resultados.',
}
