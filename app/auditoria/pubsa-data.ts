import type { AuditoriaCase } from './types'

export const PUBSA: AuditoriaCase = {
  id:                    'pubsa',
  asesor:                'Fátima',
  nombre:                'Publicidad en Buscadores (PUBSA / AdCentral)',
  sector:                'Agencia SEM/SEO · Call Tracking Multi-Cliente',
  fecha_periodo:         'Enero – Julio 2026',
  fecha_auditoria:       'Jul 2026',
  tipo_cliente:          'Agencia digital · 61 cuentas de clientes administradas',
  descripcion_contexto:  'Grupo PUBSA / AdCentral · CID 4987 · Hub de atribución de llamadas para campañas de medios pagados',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Pérdida Holders (peor cuenta)',    value: '54.2%',   color: '#ef4444' },
    { label: 'Pérdida familia Germany Clean',    value: '28–33.5%', color: '#f97316' },
    { label: 'Tráfico sin atribución (Self_svc)',value: '33.7%',   color: '#f59e0b' },
    { label: 'No conexión salientes equipo propio', value: '48.4%', color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'Publicidad en Buscadores (PUBSA / AdCentral) no opera Callpicker como una central telefónica corporativa tradicional. ' +
    'Lo usa como infraestructura de call tracking multi-cliente: cada línea/DID enruta las llamadas generadas por las campañas de Google Ads y otros medios pagados de al menos 61 cuentas distintas que la agencia administra para sus propios clientes. ' +
    'En paralelo, una línea independiente ("AdCentral Comercial") es usada por el equipo comercial interno de PUBSA para prospección saliente.\n\n' +
    'El hallazgo central es una brecha estructural de desempeño entre cuentas: mientras la familia "Asbestos y Aceros" opera con tasas de pérdida de 1.3%–3.2% (nivel de excelencia), la familia "Germany Clean" pierde entre 28% y 33.5% de sus llamadas, y la cuenta "Holders" pierde 54.2% — más de una de cada dos llamadas de un cliente pagando publicidad activa para generarlas. ' +
    'Esta dispersión se repite de forma consistente mes a mes, lo que apunta a un problema de enrutamiento, dotación de personal o configuración específico de esas cuentas, no a una falla generalizada de la plataforma.\n\n' +
    'Un segundo hallazgo relevante para el modelo de negocio de PUBSA: 33.7% de las llamadas entrantes (10,160 de 30,167) quedan clasificadas como "Self_service" sin ningún destino/cliente atribuido en los datos. ' +
    'Para una agencia cuyo producto es medir y atribuir el origen de cada contacto comercial de sus clientes, un tercio de las llamadas sin atribución es un vacío de valor que erosiona la propuesta que PUBSA vende a sus propios clientes.',

  resultado_positivo:
    'Asbestos y Aceros (4 sedes) opera con 1.3%–3.2% de pérdida — evidencia directa de que la plataforma y la infraestructura de PUBSA son capaces de excelencia operativa. ' +
    'El problema no es Callpicker: es la configuración y dotación de cuentas específicas. ' +
    'La tasa de pérdida agregada muestra tendencia de mejora en el semestre: 12.7% en enero → 12.3% en julio, lo que sugiere que ajustes puntuales sí tienen efecto medible.',

  hallazgos: [
    'Holders: 54.2% de pérdida — más de la mitad de las llamadas de un cliente pagando publicidad activa no logran contacto. El caso más crítico del portafolio.',
    'Familia Germany Clean: todas sus variantes (matriz 32.4%, lavado de alfombras 33.5%, lavado de salas 28.0%, Colchones 29.8%, lavado express CDMX 14.7%) superan el 25% de pérdida. Causa compartida: enrutamiento o dotación de personal del cliente final.',
    'Asbestos y Aceros (4 sedes): 1.3%–3.2% de pérdida con 9,910 llamadas (38.5% del tráfico atribuido) — benchmark de excelencia replicable en las cuentas críticas.',
    '33.7% de las llamadas entrantes (10,160 de 30,167) clasificadas como Self_service sin atribución de cuenta — un tercio del tráfico sin trazabilidad en una agencia cuyo producto ES la atribución.',
    'Equipo comercial saliente: 48.4% de no conexión (1,137 de 2,351 llamadas). Dispersión alta: Thomas Suárez 70.2% de no conexión vs. Rocío Domínguez 40.9%.',
    'La pérdida no se concentra en horario nocturno: el pico de llamadas perdidas sigue exactamente la curva de volumen (9:00–17:00). Es un problema de capacidad de atención en horario pico, no de cobertura fuera de horario.',
    'Actividad de sábado relevante: 7% del volumen semanal (2,110 llamadas) — confirmar si las cuentas activas ese día tienen cobertura de personal.',
    '37 llamadas con prefijo internacional distinto a MX/EEUU/Canadá (ej. +34 España) y 79 llamadas de número anónimo — volúmenes bajos pero relevantes para confirmar con el cliente.',
    'Health Score 50/100 sin seguimiento de adopción registrado en CRM — la cuenta opera sin visibilidad KAM activa.',
    '26.6% de los números únicos (5,268 de 19,821) llamaron 2 o más veces — compatible con reintentos de clientes no atendidos en primer intento.',
  ],

  cronologia: [
    { fecha: 'Ene 2026',     responsable: 'PUBSA / AdCentral',  evento: 'Inicio del periodo analizado. 61 cuentas activas. Tasa de pérdida 12.7% — Holders y Germany Clean ya en niveles críticos desde el inicio del año.', tipo: 'problema' },
    { fecha: 'Feb–Mar 2026', responsable: 'Equipo comercial',   evento: 'Actividad saliente casi nula (11 registros combinados) — arranque o piloto del equipo comercial en la plataforma.', tipo: 'neutral' },
    { fecha: 'Abr 2026',     responsable: 'Equipo comercial',   evento: 'Inicio de actividad saliente real: 2,337 de 2,351 registros totales generados entre abril y julio. Tasa de no conexión: 48.4%.', tipo: 'neutral' },
    { fecha: 'Ene–Jul 2026', responsable: 'PUBSA / AdCentral',  evento: 'Germany Clean y Holders mantienen tasa de pérdida crónica sin tendencia de mejora en todo el semestre — 7 meses sin intervención correctiva documentada.', tipo: 'problema' },
    { fecha: 'Jun 2026',     responsable: 'Plataforma',          evento: 'Pico mensual de volumen: 5,059 llamadas entrantes — el mes de mayor tráfico del semestre.', tipo: 'ok' },
    { fecha: 'Jul 2026',     responsable: 'Callpicker / ATLAS', evento: 'Emisión del análisis de 30,167 entrantes + 2,351 salientes. Brecha estructural entre cuentas documentada por primera vez con datos.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'Publicidad en Buscadores SA (PUBSA / AdCentral)' },
    { label: 'CID Zoho',             value: '4987' },
    { label: 'Modelo de negocio',     value: 'Agencia SEM/SEO — call tracking multi-cliente para campañas de medios pagados (Google Ads y otros)' },
    { label: 'Cuentas administradas', value: '61 cuentas/campañas distintas identificadas en los datos' },
    { label: 'Periodo analizado',     value: 'Entrantes: ene–jul 2026 · Salientes: abr–jul 2026 (actividad real)' },
    { label: 'Registros analizados',  value: '30,167 llamadas entrantes · 2,351 llamadas salientes' },
    { label: 'Consumo de minutos',    value: '49,817 minutos en 7 meses (plan contratado: no confirmado)' },
    { label: 'Health Score',         value: '50/100 — sin seguimiento de adopción registrado en CRM' },
    { label: 'Cuenta de referencia',  value: 'Asbestos y Aceros (4 sedes) — 9,910 llamadas con 1.3%–3.2% pérdida · benchmark del portafolio' },
    { label: 'Cuenta crítica',       value: 'Holders: 54.2% pérdida · Germany Clean (todas las variantes): 28%–33.5%' },
  ],

  necesidad_negocio:
    'PUBSA no necesita "más capacidad de atención" — necesita control granular y visibilidad por cuenta. ' +
    'Su negocio central es demostrar a sus clientes que la publicidad pagada genera contactos reales. ' +
    'Una llamada perdida en la cuenta de un cliente de PUBSA no es solo una llamada perdida: es presupuesto de medios pagado que no se convirtió en contacto, lo que eventualmente convierte en un cuestionamiento del cliente final sobre el ROI de su inversión publicitaria.',

  potencial_corto: [
    'Auditoría de enrutamiento y dotación específica para Germany Clean (todas las variantes) y Holders — replicar el modelo de Asbestos y Aceros.',
    'Confirmar con equipo técnico Callpicker el origen real de los 10,160 registros Self_service sin atribución.',
    'Coaching dirigido a Thomas Suárez (70.2% no conexión) y Humberto García (62.7%) con base en el benchmark de Rocío Domínguez (40.9%).',
  ],

  potencial_largo: [
    'Dashboard segmentado por cuenta con alertas cuando una cuenta individual supere 15% de pérdida — diferenciador comercial de PUBSA ante sus propios clientes.',
    'IA de Voz como respaldo en cuentas críticas durante horario pico (9:00–18:00) — el problema es de capacidad, no de cobertura nocturna.',
    'Estandarizar la configuración de Asbestos y Aceros como plantilla para incorporar nuevas cuentas al portafolio de PUBSA.',
    'Grabación y evaluación de calidad sistemática en la línea comercial saliente (campo "Evaluación" vacío en 100% de los registros actuales).',
    'Integración de datos de llamadas con el sistema de reporting de campañas de PUBSA para atribución completa.',
  ],

  tacticas: [
    {
      nombre:      'Abrir con Asbestos y Aceros como prueba de que el problema no es la plataforma',
      descripcion: '"Dentro de su propia infraestructura, Asbestos y Aceros opera con menos del 3.2% de pérdida. El estándar es alcanzable — el problema está en la configuración de cuentas específicas, no en Callpicker." Esto evita que el cliente perciba el reporte como una crítica al proveedor.',
      impacto:     'Alto — reencuadra la conversación hacia acción correctiva, no hacia defensa del proveedor.',
    },
    {
      nombre:      'Aterrizar Germany Clean y Holders en términos de negocio del cliente final',
      descripcion: '"Presupuesto de publicidad que no se está convirtiendo en contacto" — no solo "tasa de pérdida". El contraste visual Asbestos y Aceros vs. Holders suele generar la urgencia necesaria para autorizar presupuesto adicional.',
      impacto:     'Alto — conecta el hallazgo técnico con el riesgo reputacional de PUBSA frente a sus propios clientes.',
    },
    {
      nombre:      'Dashboard segmentado como primera propuesta comercial',
      descripcion: 'Sin visibilidad por cuenta, ni la IA de Voz ni el coaching comercial tienen forma de priorizarse con datos. El dashboard es la puerta de entrada de menor fricción y el que habilita todo lo demás.',
      impacto:     'Medio-Alto — PUBSA puede vender esa visibilidad como parte de su propio servicio a clientes finales.',
    },
  ],

  senal_alarma:
    'Clientes finales de PUBSA (Germany Clean, Holders) pueden cuestionar el ROI de su gasto publicitario por llamadas no atendidas, con riesgo de cancelación de esos contratos y, en cascada, riesgo para la relación de PUBSA con Callpicker si el Health Score no se recupera.',

  problema_raiz:        'Brecha no detectada entre cuentas de alto y bajo desempeño, con un tercio del tráfico sin atribución',
  problema_raiz_detalle:
    'El promedio de 8.7% de pérdida global oculta una dispersión que va de 1.3% (Asbestos y Aceros) a 54.2% (Holders). ' +
    'Sin un dashboard segmentado por cuenta, PUBSA no tiene visibilidad de estas diferencias, y Callpicker tampoco las registra en el CRM — el Health Score de 50/100 trata la cuenta como un todo, cuando en realidad son 61 negocios distintos con desempeños radicalmente diferentes. ' +
    'La brecha de atribución (33.7% en Self_service) agrava el problema: no solo hay llamadas que se pierden, hay un tercio del tráfico que PUBSA no puede asignar a ninguna campaña ni cliente.',

  flujo_real: [
    { fase: 'Campaña activa (cliente final)',   area: 'Google Ads / medios pagados',             accion: 'Usuario hace clic en anuncio y llama al número de seguimiento de AdCentral', resultado: '56.9% conecta · 8.7% se pierde · 33.7% Self_service sin atribución · 0.7% Voicemail' },
    { fase: 'Cuentas de referencia',            area: 'Asbestos y Aceros (4 sedes)',             accion: '9,910 llamadas enrutadas a través de la infraestructura de PUBSA', resultado: '1.3%–3.2% pérdida — benchmark de excelencia replicable' },
    { fase: 'Cuentas en crisis — Holders',      area: 'Línea/DID asignada a Holders',            accion: '367 llamadas de usuarios respondiendo a publicidad pagada', resultado: '54.2% pérdida — presupuesto publicitario sin conversión en contacto' },
    { fase: 'Cuentas en crisis — Germany Clean',area: 'Todas las variantes de la familia',       accion: 'Tráfico distribuido en 7 variantes de nombre de destino', resultado: '28%–33.5% pérdida en todas las variantes — causa compartida: enrutamiento o personal del cliente final' },
    { fase: 'Equipo comercial saliente',         area: 'Línea AdCentral Comercial (abr–jul)',    accion: 'Agentes marcan llamadas de prospección', resultado: '48.4% de no conexión · Thomas Suárez 70.2% vs. Rocío Domínguez 40.9%' },
    { fase: 'Horario pico (9:00–17:00)',         area: 'Toda la operación entrante',             accion: 'Bloque de mayor tráfico coincide con mayor pérdida', resultado: 'No es problema de cobertura nocturna — es capacidad de atención en pico' },
  ],

  comparativo: [
    { metrica: 'Pérdida Holders',               real: '54.2%',                              ideal: '< 10% (benchmark Asbestos y Aceros)' },
    { metrica: 'Pérdida Germany Clean (promedio)',real: '28%–33.5%',                         ideal: '< 10%' },
    { metrica: 'Pérdida global agregada',        real: '8.7% (promedio que oculta dispersión)', ideal: 'Monitoreo por cuenta, no por promedio' },
    { metrica: 'Atribución Self_service',        real: '33.7% sin cuenta asignada',          ideal: '0% sin atribución (negocio de PUBSA ES la atribución)' },
    { metrica: 'No conexión salientes (equipo)', real: '48.4% (Thomas Suárez: 70.2%)',      ideal: '< 35% (benchmark Rocío Domínguez: 40.9%)' },
    { metrica: 'Seguimiento KAM en CRM',        real: 'Sin registro de adopción',           ideal: 'Revisión trimestral documentada' },
    { metrica: 'Health Score',                  real: '50/100',                             ideal: '> 65/100' },
  ],

  plan_inmediato: [
    { accion: 'Auditoría de enrutamiento y dotación específica para Germany Clean (todas las variantes) y Holders', responsable: 'KAM + equipo técnico Callpicker', criterio: 'Tasa de pérdida de esas cuentas reducida a < 15% en los siguientes 30 días' },
    { accion: 'Confirmar con equipo técnico Callpicker el origen real del 33.7% de registros Self_service sin atribución', responsable: 'Equipo técnico Callpicker + KAM', criterio: 'Clarificación documentada: ¿límite del export o vacío real de trazabilidad?' },
    { accion: 'Coaching dirigido a Thomas Suárez (70.2% no conexión) y Humberto García (62.7%) con base en el método de los agentes de menor tasa', responsable: 'KAM + responsable del equipo comercial PUBSA', criterio: 'Reducción de tasa de no conexión a < 55% en ambos agentes' },
  ],

  plan_mediano: [
    { accion: 'Implementar dashboard segmentado por cuenta con alertas cuando una cuenta individual supere 15% de pérdida', responsable: 'Equipo técnico Callpicker + PUBSA', criterio: 'Dashboard activo y en uso por el equipo operativo de PUBSA' },
    { accion: 'Reactivar seguimiento de adopción de producto en CRM y actualizar Health Score con base en hallazgos reales', responsable: 'KAM', criterio: 'Health Score actualizado a > 60/100 con componentes documentados' },
    { accion: 'Piloto de IA de Voz en Germany Clean u Holders durante horario 9:00–13:00 (bloque de mayor pérdida)', responsable: 'Equipo comercial + técnico Callpicker', criterio: 'Propuesta formal presentada y evaluada por PUBSA' },
  ],

  plan_estrategico: [
    { accion: 'Estandarizar la configuración de enrutamiento de Asbestos y Aceros como plantilla para nuevas cuentas del portafolio de PUBSA', responsable: 'Equipo técnico Callpicker + PUBSA', criterio: 'Plantilla documentada y aplicada en siguiente alta de cuenta' },
    { accion: 'Activar grabación y evaluación de calidad en la línea comercial saliente (campo "Evaluación" vacío en 100% de los registros)', responsable: 'KAM + PUBSA', criterio: 'Al menos 50% de las llamadas salientes con evaluación registrada' },
    { accion: 'Confirmar el plan de minutos contratado y contrastar con consumo real (49,817 min en 7 meses) para validar dimensionamiento', responsable: 'KAM + PUBSA', criterio: 'Análisis de uso entregado al cliente antes del próximo ciclo de facturación' },
  ],

  areas_oportunidad: [
    { area: 'Dashboard segmentado por cuenta',          impacto: 'Alto — habilita toda la demás inteligencia operativa; diferenciador comercial de PUBSA ante sus clientes', responsable: 'Técnico + KAM' },
    { area: 'IA de Voz en cuentas críticas (pico)',    impacto: 'Alto — problema de capacidad en horario 9:00–18:00, no de cobertura nocturna; IA capta llamadas en pico sin personal adicional', responsable: 'Comercial + técnico' },
    { area: 'Grabación y evaluación calidad (salientes)',impacto: 'Medio — diagnóstico de causa raíz de la dispersión Thomas Suárez vs. Rocío Domínguez; sostiene coaching con evidencia', responsable: 'KAM + PUBSA' },
    { area: 'Sígueme / enrutamiento inteligente',       impacto: 'Medio — documentar y replicar la configuración de Asbestos y Aceros reduce tiempo de corrección en cuentas críticas', responsable: 'Técnico' },
    { area: 'Cierre de brecha Self_service (atribución)',impacto: 'Medio-Alto — un tercio del tráfico sin atribución erosiona el producto central de PUBSA (atribución de campañas)', responsable: 'Técnico Callpicker + PUBSA' },
  ],

  perfiles: [
    {
      nombre: 'PUBSA / AdCentral (operación)',
      rol:    'Agencia — orquestadora de enrutamiento para 61 cuentas de clientes',
      color:  '#2563eb',
      campos: [
        { label: 'Modelo',              value: 'Hub de atribución: no es el destino final de las llamadas, es el orquestador de enrutamiento para 61 negocios distintos' },
        { label: 'Cuenta referencia',   value: 'Asbestos y Aceros — 38.5% del tráfico atribuido con 1.3–3.2% pérdida' },
        { label: 'Cuentas en crisis',   value: 'Holders (54.2%), Germany Clean todas las variantes (28–33.5%), MONTACPARTES (32.2%)' },
        { label: 'Riesgo reputacional', value: 'Una llamada perdida = presupuesto publicitario pagado por el cliente final sin conversión en contacto' },
      ],
    },
    {
      nombre: 'Thomas Suárez',
      rol:    'Agente comercial — mayor tasa de no conexión del equipo',
      color:  '#ef4444',
      campos: [
        { label: 'Tasa no conexión', value: '70.2% — el peor desempeño individual del equipo saliente' },
        { label: 'Acción',           value: 'Coaching prioritario con base en método de los agentes de menor tasa' },
      ],
    },
    {
      nombre: 'Rocío Domínguez',
      rol:    'Agente comercial — mejor desempeño del equipo',
      color:  '#22c55e',
      campos: [
        { label: 'Tasa no conexión', value: '40.9% — benchmark interno del equipo comercial saliente' },
        { label: 'Oportunidad',      value: 'Documentar y replicar su método de trabajo y horario de marcación' },
      ],
    },
    {
      nombre: 'Humberto García',
      rol:    'Agente comercial — segundo mayor tasa de no conexión',
      color:  '#f97316',
      campos: [
        { label: 'Tasa no conexión', value: '62.7% — segundo peor desempeño del equipo' },
        { label: 'Acción',           value: 'Coaching junto a Thomas Suárez como prioridad inmediata' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Asbestos y Aceros (4 sedes) demuestra que < 10% de pérdida es alcanzable dentro de la misma infraestructura — el problema no es la plataforma.',
      'Volumen entrante sostenido y creciente en el semestre (pico en junio: 5,059 llamadas).',
      'Tasa de pérdida agregada con tendencia a la baja: 12.7% (enero) → 12.3% (julio).',
      'Portafolio diversificado de 61 cuentas reduce dependencia de un solo cliente.',
      'Baja concentración en un solo cliente: top 10 cuentas explican 76.1% del tráfico atribuido.',
    ],
    oportunidades: [
      'Replicar la configuración de Asbestos y Aceros en las cuentas críticas — solución ya demostrada dentro del propio portafolio.',
      'IA de Voz como respaldo en horario pico (9:00–18:00) para Germany Clean y Holders.',
      'Dashboards segmentados por cuenta como diferenciador comercial de PUBSA ante sus propios clientes finales.',
      'Cerrar la brecha de atribución del 33.7% en Self_service — si PUBSA lo resuelve, mejora su propio producto de reporting.',
      'Actividad de sábado (7% del volumen semanal) puede ser oportunidad de cobertura diferenciada para cuentas que atienden fin de semana.',
    ],
    debilidades: [
      'Pérdida crónica y uniforme en toda la familia Germany Clean (28%–33.5%) sin tendencia de mejora en 7 meses.',
      'Holders con 54.2% de pérdida — la cuenta más crítica del portafolio.',
      'Un tercio del tráfico (33.7%) sin atribución de cuenta — vacío en el negocio central de PUBSA (la atribución).',
      '48.4% de no conexión en llamadas salientes del equipo comercial propio, con dispersión de 70.2% a 40.9%.',
      'Sin seguimiento de adopción de producto registrado en CRM — relación KAM sin datos de visibilidad.',
      'Health Score 50/100 como promedio que oculta cuentas en crisis y cuentas en excelencia simultáneamente.',
    ],
    amenazas: [
      'Clientes finales de PUBSA (Germany Clean, Holders) pueden cuestionar el ROI de su gasto publicitario por llamadas no atendidas.',
      'Riesgo de churn en cascada: si un cliente final cancela con PUBSA por bajo desempeño, PUBSA puede reducir su propia contratación con Callpicker.',
      'Sin plan de minutos de referencia confirmado, no es posible descartar riesgo de sobreconsumo a futuro.',
      'Dependencia de un solo canal (voz) sin evidencia de omnicanalidad activa.',
      'La falta de dashboard segmentado convierte a PUBSA en dependiente de Callpicker para detectar sus propias crisis — lo que puede percibirse como una debilidad del proveedor.',
    ],
  },

  conclusion:
    'PUBSA opera un modelo sofisticado — call tracking multi-cliente para atribución de campañas — que Callpicker soporta como infraestructura, pero que hoy no está instrumentada para gestionarse a ese nivel de granularidad. ' +
    'El promedio de 8.7% de pérdida global es engañoso: detrás hay cuentas en excelencia (Asbestos y Aceros, 1.3%–3.2%) y cuentas en crisis silenciosa (Holders, 54.2%) que conviven sin que el Health Score de 50/100 lo refleje.\n\n' +
    'La oportunidad para Callpicker no está en vender más capacidad — está en convertirse en la capa de inteligencia que PUBSA necesita para gestionar 61 cuentas con desempeños radicalmente distintos, y que hoy no tiene.',

  pierde: [
    'Confianza de los clientes finales de PUBSA en las cuentas críticas — presupuesto de publicidad que no se convierte en contacto.',
    'Ventana de intervención en Germany Clean y Holders: 7 meses de pérdida crónica sin acción correctiva documentada.',
    'Valor de un tercio del tráfico (33.7%) sin atribución — vacío que erosiona el producto central de la agencia.',
  ],

  gana: [
    'Posición de autoridad como el único actor con visibilidad de la brecha entre las 61 cuentas — algo que PUBSA no tenía cuantificado.',
    'Conversación de dashboard segmentado como propuesta comercial natural, no como venta adicional.',
    'Caso de negocio de IA de Voz anclado en datos reales de pérdida en horario pico — no en hipótesis.',
    'Oportunidad de elevar la relación de reactiva a consultiva en una cuenta que hoy opera sin seguimiento KAM activo.',
  ],

  recomendacion_central:
    'Abrir la sesión con el contraste visual Asbestos y Aceros (1.3%–3.2%) vs. Holders (54.2%) — mismo proveedor, misma plataforma, desempeños opuestos. ' +
    'Esto convierte la conversación de auditoría en una conversación de acción: "el estándar es alcanzable dentro de su propia infraestructura, y aquí está el mapa de cómo llegar ahí." ' +
    'La primera propuesta a cerrar es el dashboard segmentado por cuenta — sin él, ni la IA ni el coaching comercial tienen forma de priorizarse con datos.',
}
