import type { AuditoriaCase } from './types'

export const AZYCO: AuditoriaCase = {
  id: 'azyco',
  asesor: 'Fátima',
  nombre: 'Azyco Guadalajara',
  sector: 'Comercio · Venta de Loseta y Accesorios para Baño',
  fecha_periodo: 'Enero – Junio 2026',
  fecha_auditoria: 'Jun 2026',
  tipo_cliente: '115 extensiones · 16 sucursales · CID 162499 · HS 61',
  descripcion_contexto: '37,003 llamadas analizadas · Asesor: Fátima González · Contacto: César Arellano (Encargado Sistemas) · Cliente desde agosto 2024',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Abandono saliente',   value: '34.9% en escalada (37.5% jun)', color: '#ef4444' },
    { label: 'ANA ISABEL crisis',   value: '58.9% abandono · 1,235 llamadas', color: '#dc2626' },
    { label: 'Hora 15h zona muerta', value: '43.6% abandono · 1,648 llamadas', color: '#f59e0b' },
    { label: 'Cluster excelencia',  value: '7 agentes < 10% abandono',       color: '#22c55e' },
  ],

  resumen_ejecutivo: 'Azyco Guadalajara opera con 115 extensiones en 16 sucursales y genera 37,003 registros de llamadas en H1 2026 (28,443 entrantes + 8,560 salientes). El health score de 61/100 refleja una cuenta con operación real pero con problemas identificables de configuración y gestión.\n\nEl hallazgo más importante es la coexistencia de excelencia e ineficiencia dentro de la misma cuenta: 7 agentes con menos del 10% de abandono (Álvaro Ovalle: 0.5%, Mónica Flores: 0.6%) y 9 agentes con más del 40% de abandono (Gina García: 77.9%, Alicia Reyes: 77.4%). Esta dispersión de 77 puntos porcentuales entre el mejor y el peor agente no es normal — demuestra que el problema es de configuración y gestión, no de tecnología.\n\nLa anomalía más urgente es ANA ISABEL: 1,235 llamadas entrantes con 58.9% de abandono y 34 voicemails activos. Un desbordamiento sin configurar o IVR con flujo muerto puede explicar el colapso de una sola extensión de alto volumen.',

  resultado_positivo: 'Los 7 agentes estrella de Azyco son el argumento más poderoso disponible para la conversación SAC: Álvaro Ovalle (208 llamadas, 0.5% abandono), Mónica Flores (162 llamadas, 0.6%), Pedro Castillo (161 llamadas, 1.2%), César Arellano (378 llamadas, 2.1%), Fátima Rivera (674 llamadas, 5.0%), Nohemi Villegas (251 llamadas, 5.6%) y Michell Guerrero (567 llamadas, 9.0%).\n\nEsto demuestra sin ambigüedad que la plataforma funciona perfectamente cuando está bien configurada. El contacto principal, César Arellano, opera personalmente con 2.1% de abandono — conoce la plataforma y puede entender el impacto de lo que ocurre en otras extensiones.\n\nEl self-service IVR procesa 2,180 llamadas (7.7% del tráfico) sin intervención humana — base validada para escalar la automatización.',

  hallazgos: [
    'ANA ISABEL: 1,235 llamadas entrantes con 58.9% de abandono y 34 voicemails activos. Mayor riesgo individual del análisis — posible IVR sin salida válida (dead-end), extensión compartida sin turnos o desbordamiento no configurado.',
    'VENTAS MOSTRADOR: 1,012 llamadas con 48.1% de abandono — segunda extensión de alto volumen con colapso operativo.',
    'MOSTRADOR PERIFÉRICO: 320 llamadas con 57.5% de abandono — posiblemente misma causa que ANA ISABEL.',
    'Abandono saliente en escalada: 33.2% en enero → 37.5% en junio, sin ningún mes bajo 33%. Indica ausencia de estrategia de reintentos y gestión de agenda.',
    'Hora 15h zona muerta: 43.6% de abandono con 1,648 llamadas — ausencia de personal en rotación de comidas. Una regla de desbordamiento puede recuperar ~300 llamadas mensuales.',
    'Llamadas 7–8h sin cobertura: 139 llamadas (95.7% y 64.7% de abandono) — apertura sin personal ni IVR informativo.',
    'Dispersión extrema entre agentes: 77.4 puntos entre mejor (0.5%) y peor (77.9%) dentro de la misma cuenta — ausencia de estándares de configuración unificados.',
    'Número 3313109796: 22 marcaciones salientes con solo 1 contestada — probable número desconectado en la agenda.',
    'Número 3331154814: 1,077 llamadas entrantes con 41.8% de abandono — posible cliente o proveedor estratégico no atendido correctamente.',
    'Abril 2026 anomalía: 913 llamadas salientes vs promedio de 1,343/mes — caída sin justificación documentada ni ticket de soporte.',
    'Pedro Castillo y Álvaro Ovalle: excelentes en entrante (0.5–1.2%) pero críticos en saliente (43.8–49.4%) — perfiles diferenciados por tipo de flujo.',
    'Sábado con operación real (2,391 entrantes, 777 salientes) sin cobertura diferenciada — 26.5% abandono entrante sábado.',
  ],

  cronologia: [
    { fecha: 'Ago 2024',    responsable: 'Equipo Callpicker',    evento: 'AZYCO inicia como cliente. 115 extensiones, 16 sucursales en Guadalajara. Health Score inicial no documentado.', tipo: 'neutral' },
    { fecha: 'Ene 2026',    responsable: 'Operación / Fátima',   evento: 'Enero: 6,752 entrantes con 35.8% de abandono — pico de volumen y peor tasa del período. Paradoja: más volumen = peor atención.', tipo: 'problema' },
    { fecha: 'Feb 2026',    responsable: 'Operación',            evento: 'Febrero: mejora a 23.2% de abandono con 4,771 entrantes — reducción de volumen correlacionada con mejora. Sin intervención documentada.', tipo: 'neutral' },
    { fecha: 'Abr 2026',    responsable: 'Operación / Fátima',   evento: 'Abril: solo 913 llamadas salientes vs promedio de 1,343/mes. Sin ticket de soporte registrado. Anomalía no investigada.', tipo: 'problema' },
    { fecha: 'Sem 14 (Abr 2026)', responsable: 'Operación',     evento: 'Semana 14: abandono semanal sube a 40.9% — el pico más alto post año nuevo. Coincide con el mes de menor volumen saliente. Sin explicación documentada.', tipo: 'problema' },
    { fecha: 'Ene–Jun 2026', responsable: 'Operación saliente', evento: 'Abandono saliente sube consistentemente: 33.2% → 33.8% → 36.2% → 35.7% → 34.7% → 37.5%. Ningún mes cierra bajo 33%.', tipo: 'problema' },
    { fecha: 'Jun 2026',    responsable: 'Dir. SAC / Fátima',   evento: 'Auditoría H1 2026 generada. ANA ISABEL y dispersión de agentes identificados. Plan de acción entregado para presentación a César Arellano.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',           value: 'Azyco Guadalajara' },
    { label: 'CID Zoho',               value: '162499' },
    { label: 'Giro',                   value: 'Comercio — Venta de loseta y accesorios para baño' },
    { label: 'Extensiones',            value: '115 extensiones activas' },
    { label: 'Sucursales',             value: '16 puntos de venta en Guadalajara' },
    { label: 'Asesor SAC',             value: 'Fátima González' },
    { label: 'Contacto principal',     value: 'César Arellano — Encargado de Sistemas' },
    { label: 'Cliente desde',          value: 'Agosto 2024' },
    { label: 'Health Score',           value: '61/100 · Actividad: 85 · Adopción: 13 · Pago: 100 · Relacional: 50' },
    { label: 'Total llamadas H1',      value: '37,003 (28,443 ent + 8,560 sal) · 52,161 minutos totales' },
    { label: 'Self-service IVR',       value: '2,180 interacciones (7.7% del entrante)' },
    { label: 'Pago automático',        value: '100 — sin riesgo de cartera' },
  ],

  necesidad_negocio: 'Azyco es una cadena comercial de 16 sucursales que depende de su operación telefónica para coordinar entre puntos de venta, atender clientes, gestionar proveedores y manejar el tráfico inter-sucursal (tráfico interno 1002–1005 representa la mayoría del volumen saliente externo).\n\nLa necesidad central es que cada sucursal pueda comunicarse con clientes y con la operación central sin pérdidas. El problema identificado no es de infraestructura — es de configuración y de estandarización entre las 115 extensiones. César Arellano entiende la plataforma (2.1% de abandono personal) pero la disparidad entre extensiones indica que no hay un proceso de configuración unificado aplicado a todas las sucursales.',

  potencial_corto: [
    'Revisar ANA ISABEL y MOSTRADOR PERIFÉRICO — corrección técnica que puede recuperar 728+ llamadas perdidas por período',
    'Depurar número 3313109796 — 21 marcaciones fallidas sobre número posiblemente inactivo',
    'Activar regla de desbordamiento 14:30–16:30h — recuperar ~300 llamadas mensuales de la zona muerta',
    'Investigar anomalía de abril salientes con datos internos de Azyco',
    'Identificar número 3331154814 (1,077 llamadas, 41.8% abandono) — probable cliente o proveedor estratégico',
  ],
  potencial_largo: [
    'Capacitación interna con Álvaro Ovalle / Pedro Castillo / César Arellano para replicar el protocolo de los 7 agentes estrella',
    'Configurar IVR de apertura 7–9h con mensaje de horarios + voicemail — recupera 139 llamadas por período',
    'Voicemail estructurado nocturno — captura 361 llamadas fuera de horario actualmente perdidas',
    'Revisión mensual formal con reporte de KPIs por extensión — sin registro de revisión activa en el sistema',
    'Verificar portabilidad de números por sucursal — garantiza visibilidad completa del tráfico real',
  ],

  tacticas: [
    { nombre: 'Atribución de problemas a tecnología', descripcion: 'Si el cliente interpreta la dispersión de rendimiento entre agentes como inconsistencia de la plataforma, puede generar desconfianza.', impacto: 'Los 7 agentes estrella son la respuesta — la plataforma funciona igual para todos, el problema es la configuración.' },
    { nombre: 'Comparación de herramientas', descripcion: 'Con 115 extensiones, el cliente puede haber considerado o estar evaluando soluciones de PBX tradicional o alternativas de VoIP más simples.', impacto: 'Mostrar el valor diferencial del análisis y del reporte de datos como capacidad que otras plataformas no ofrecen.' },
  ],
  senal_alarma: 'Si César Arellano menciona que extensiones específicas "tienen problemas" pero no puede identificar cuáles ni por qué, es señal de que no tiene visibilidad de los datos de la plataforma. Fátima puede proponer una revisión mensual de reporte como solución inmediata a esa brecha de información.',

  problema_raiz: 'La configuración de las 115 extensiones no está estandarizada. Los 7 agentes estrella con menos del 10% de abandono demuestran que la plataforma funciona — pero el proceso de configuración inicial no se replicó uniformemente a todas las extensiones y sucursales.',
  problema_raiz_detalle: 'La evidencia más clara es ANA ISABEL: 1,235 llamadas con 58.9% de abandono no es un agente de bajo desempeño — es una extensión mal configurada (IVR sin salida, desbordamiento faltante o extensión compartida sin turnos). La paradoja de Pedro Castillo y Álvaro Ovalle (0.5–1.2% en entrante, 43.8–49.4% en saliente) refuerza esto: el problema no es la persona sino el tipo de configuración aplicada según el flujo.\n\nLa ausencia de revisión mensual de datos significa que estas discrepancias llevan meses sin ser detectadas por el cliente. César Arellano no sabe que su propia extensión (2.1%) tiene 77 puntos de ventaja sobre Gina García (77.9%).',

  flujo_real: [
    { fase: '1. Configuración no estandarizada', area: 'Onboarding / Técnico Callpicker', accion: 'Alta de 115 extensiones sin proceso unificado de configuración por tipo de flujo', resultado: 'Dispersión de 77pp entre mejor y peor agente — configuraciones heterogéneas.' },
    { fase: '2. ANA ISABEL — colapso sin detección', area: 'Extensión ANA ISABEL', accion: 'IVR sin salida válida o desbordamiento sin configurar — 58.9% abandono acumulado', resultado: '728 clientes perdidos por período sin que nadie lo detecte.' },
    { fase: '3. Hora 15h — zona muerta operativa', area: 'Toda la operación', accion: 'Rotación de comidas sin cobertura de relevo ni desbordamiento automático', resultado: '43.6% abandono en 1,648 llamadas. ~300 perdidas por mes en ese horario.' },
    { fase: '4. Salientes sin estrategia de reintentos', area: 'Equipo saliente', accion: 'Números incorrectos en agenda y sin protocolo de agenda para horarios de contacto', resultado: 'Abandono saliente en escalada: 33.2% → 37.5% en 6 meses.' },
    { fase: '5. Sin revisión mensual documentada', area: 'Fátima / César Arellano', accion: 'Ningún mes con revisión de panel registrada en el sistema', resultado: 'Todos los problemas detectados en esta auditoría estaban disponibles antes — sin visibilidad del cliente.' },
    { fase: '6. Apertura sin cobertura (7–8h)', area: 'Operación completa', accion: 'IVR recibe 139 llamadas de apertura sin mensaje de horarios ni alternativa', resultado: '64–95% de abandono. 139 clientes esperando sin información en 6 meses.' },
  ],

  comparativo: [
    { metrica: 'Dispersión de abandono agentes', real: '77.4pp (0.5% → 77.9%) misma cuenta',      ideal: 'Todos los agentes con < 20% con configuración estandarizada' },
    { metrica: 'ANA ISABEL (entrante)',          real: '58.9% abandono · 728 perdidas/período',    ideal: '< 25% con desbordamiento o IVR correctamente configurado' },
    { metrica: 'Abandono saliente',              real: '34.9% (escalada a 37.5% en jun)',           ideal: '< 28% con estrategia de reintentos y depuración de agenda' },
    { metrica: 'Hora 15h',                       real: '43.6% abandono · 1,648 llamadas',           ideal: '< 30% con regla de desbordamiento 14:30–16:30h' },
    { metrica: 'Apertura 7–8h',                  real: '64–95% abandono · 139 llamadas',            ideal: 'IVR informativo con opción de voicemail activo' },
    { metrica: 'Número 3313109796',              real: '22 intentos · 1 contestada',                ideal: 'Número depurado o reemplazado en agenda' },
    { metrica: 'Revisión mensual de KPIs',       real: 'Sin registro de revisión activa',           ideal: 'QBR mensual con César Arellano + reporte de extensiones' },
  ],

  plan_inmediato: [
    { accion: 'Revisar configuración de ANA ISABEL y MOSTRADOR PERIFÉRICO. Verificar: ¿hay desbordamiento configurado? ¿El IVR tiene salida válida? ¿Es extensión compartida sin turnos definidos? Impacto estimado: recuperar 728+ llamadas perdidas.', responsable: 'Fátima + Técnico Callpicker', criterio: 'Configuración revisada y corregida. Tasa de atención de ANA ISABEL > 60% en los siguientes 7 días.' },
    { accion: 'Identificar si el número 3313109796 está activo. 22 marcaciones salientes con 1 contestada — probable número desconectado o incorrecto en la agenda. Solicitar a César Arellano verificación inmediata.', responsable: 'Fátima + César Arellano', criterio: 'Número verificado. Si inactivo: depurado de la agenda en 48h.' },
    { accion: 'Activar regla de desbordamiento en franja 14:30–16:30h. Puede ser cola de espera con mensaje de posición o desvío a extensión de respaldo. Impacto: recuperar ~300 llamadas mensuales de la zona muerta.', responsable: 'Técnico Callpicker', criterio: 'Regla activa. Abandono 15h < 35% en medición mensual.' },
  ],

  plan_mediano: [
    { accion: 'Presentar a César Arellano el análisis de extensiones. Abrir con sus propias métricas (2.1% abandono) y comparar con el equipo. La diferencia de 77 puntos es el argumento que no necesita explicación.', responsable: 'Fátima', criterio: 'Reunión realizada. César informado del estado real de sus 115 extensiones.' },
    { accion: 'Configurar IVR de apertura 7–9h con mensaje de horarios + opción de voicemail. Las 139 llamadas que llegan antes de apertura no deben quedarse sin respuesta — un mensaje de 20 segundos resuelve el 64–95% de abandono en esa franja.', responsable: 'Técnico + Fátima', criterio: 'IVR activo. Abandono 7–8h reducido a < 30% en el siguiente mes.' },
    { accion: 'Investigar anomalía de abril salientes (913 vs 1,343 promedio). Cruzar con registros internos de Azyco para determinar si fue operativo, vacacional o un problema de plataforma. Cerrar la brecha de información.', responsable: 'Fátima + César Arellano', criterio: 'Causa documentada en CRM con nota de seguimiento.' },
    { accion: 'Verificar portabilidad de números por sucursal. Si hay sucursales con números no portados a Callpicker, el tráfico real de esas ubicaciones no está siendo capturado en el análisis.', responsable: 'César Arellano + Fátima', criterio: 'Lista de sucursales con estado de portabilidad documentada.' },
  ],

  plan_estrategico: [
    { accion: 'Diseñar sesión de capacitación interna con Álvaro Ovalle, Pedro Castillo y César Arellano. Los 3 mejores agentes en entrante de la cuenta comparten su protocolo con las extensiones con > 40% de abandono. Sesión interna de Azyco con apoyo de Callpicker.', responsable: 'Fátima + César Arellano', criterio: 'Sesión agendada y realizada. Reporte de mejora en 30 días.' },
    { accion: 'Activar flujo de voicemail estructurado fuera de horario. 361 llamadas perdidas nocturnas por período que hoy no tienen alternativa. Capturar el contacto y devolver la llamada el día hábil siguiente.', responsable: 'Técnico + Fátima', criterio: 'Flujo activo. Protocolo de callback documentado.' },
    { accion: 'Implementar revisión mensual de reporte de extensiones con César Arellano. La dispersión de 77pp fue acumulada durante meses sin que el cliente lo supiera. Una revisión mensual de 30 minutos es la solución preventiva.', responsable: 'Fátima', criterio: 'Primera revisión mensual agendada en julio 2026.' },
  ],

  areas_oportunidad: [
    { area: 'Capacitación agentes con > 40% abandono', impacto: '9 extensiones con abandono crítico. Si cada una mejora 20pp, recuperan ~1,500 llamadas adicionales por período sin inversión adicional.', responsable: 'Fátima + César Arellano' },
    { area: 'IVR apertura + nocturno',                 impacto: '139 llamadas de apertura (64–95% abandono) + 361 nocturnas. Total: 500 contactos recuperables por período con IVR + voicemail.', responsable: 'Técnico + Fátima' },
    { area: 'Desbordamiento hora 15h',                 impacto: '~300 llamadas/mes recuperables con una sola regla de desbordamiento. ROI inmediato y medible.', responsable: 'Técnico Callpicker' },
    { area: 'Depuración de agenda saliente',           impacto: '3313109796 con 21/22 llamadas fallidas es el caso obvio. Revisión completa de agenda puede mejorar abandono saliente del 37.5%.', responsable: 'César Arellano + Fátima' },
  ],

  perfiles: [
    {
      nombre: 'César Arellano', rol: 'Encargado de Sistemas — Contacto principal y benchmark interno', color: '#22c55e',
      campos: [
        { label: 'Métricas propias',    value: '378 llamadas entrantes con 2.1% de abandono. El mejor contacto técnico posible — entiende la plataforma y puede entender el impacto de lo que pasa en otras extensiones.' },
        { label: 'Argumento de apertura', value: '"César, tus métricas en la plataforma son de las mejores del equipo — 2.1% de abandono. Eso muestra que entiendes cómo funciona. Hay extensiones que están perdiendo entre 45% y 77% de sus llamadas, y eso lo podemos corregir juntos."' },
        { label: 'Propuesta',           value: 'Co-auditor de la operación: César conoce el negocio, Fátima trae los datos. La revisión mensual puede ser una sesión de trabajo conjunto.' },
      ],
    },
    {
      nombre: 'ANA ISABEL', rol: 'Extensión de alto volumen en colapso — Prioridad técnica #1', color: '#ef4444',
      campos: [
        { label: 'Situación',           value: '1,235 llamadas entrantes · 58.9% abandono · 34 voicemails activos. La extensión con mayor riesgo individual de la cuenta.' },
        { label: 'Diagnóstico probable', value: 'IVR sin salida válida (dead-end), extensión compartida sin turnos definidos, o desbordamiento no configurado. Requiere revisión técnica urgente — no es problema del agente.' },
        { label: 'Impacto si se corrige', value: 'Recuperar 728 llamadas perdidas por período. Reducir abandono de cuenta de 28% a ~25% solo con esta corrección.' },
      ],
    },
    {
      nombre: 'Álvaro Ovalle / Mónica Flores / Pedro Castillo', rol: 'Agentes estrella entrantes (0.5–1.2% abandono)', color: '#3b82f6',
      campos: [
        { label: 'Relevancia',          value: 'Los tres agentes con mejor desempeño en entrantes de la cuenta. Álvaro: 208 llamadas · 0.5% abandono. Mónica: 162 llamadas · 0.6%. Pedro: 161 llamadas · 1.2%.' },
        { label: 'Paradoja',            value: 'Pedro Castillo y Álvaro Ovalle tienen 43.8–49.4% de abandono en salientes. Son excelentes en entrante, críticos en saliente — perfil de flujo diferenciado.' },
        { label: 'Propuesta',           value: 'Sesión interna donde comparten su protocolo de atención entrante con las 9 extensiones en zona crítica (> 40% abandono).' },
      ],
    },
    {
      nombre: 'Fátima González', rol: 'Asesora SAC — Gestora de la cuenta', color: '#6366f1',
      campos: [
        { label: 'Prioridad inmediata', value: '1. Coordinar revisión técnica de ANA ISABEL esta semana. 2. Llevar análisis a César Arellano. 3. Activar regla de desbordamiento 15h.' },
        { label: 'Argumento central',   value: '"Los 7 agentes estrella de su propia empresa demuestran que el 2% de abandono es posible con Callpicker. El problema no es la plataforma — es por qué el resto no lo logra todavía, y eso lo revisamos juntos."' },
        { label: 'Franja de tiempo',    value: 'Las acciones de configuración (ANA ISABEL, desbordamiento 15h, número 3313109796) pueden ejecutarse esta semana sin coordinar con el cliente. Fátima llega a la reunión ya con las correcciones hechas.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '7 agentes estrella con < 10% de abandono — modelo interno de excelencia replicable',
      'Self-service IVR activo: 2,180 interacciones validadas (7.7% del tráfico)',
      'César Arellano como contacto técnico: 2.1% abandono, entiende la plataforma',
      'Pago automático 100/100 — sin riesgo de cartera ni fricción de cobro',
      'Actividad 85/100 — operación con alta frecuencia de uso de plataforma',
      'Tráfico inter-sucursal via plataforma — integración operativa real entre puntos de venta',
      'Voicemail capturado: 190 mensajes — el canal existe, solo falta el protocolo de respuesta',
      'Cliente desde agosto 2024 — relación joven con potencial de maduración',
    ],
    oportunidades: [
      'Corrección ANA ISABEL: recupera 728+ llamadas/período con configuración técnica',
      'Desbordamiento 15h: ~300 llamadas/mes recuperables con una regla — ROI inmediato',
      'IVR apertura 7–9h: recupera 139 llamadas/período con mensaje de 20 segundos',
      'Voicemail nocturno estructurado: 361 llamadas fuera de horario capturables',
      'Capacitación interna TOP performers: mejora sistémica sin costo de contratación',
      'Depuración de agenda saliente: mejora abandono 37.5% con limpieza de números inactivos',
      'Revisión mensual formal: el cliente no tiene visibilidad — Fátima puede ser el canal de datos',
      'Verificación de portabilidad: puede revelar tráfico no capturado en el análisis',
    ],
    debilidades: [
      'ANA ISABEL sin intervención técnica — 728 llamadas perdidas por período acumulándose',
      'Dispersión extrema de configuración: 77pp entre mejor y peor extensión en la misma cuenta',
      'Abandono saliente en escalada sin estrategia de reintentos ni auditoría de agenda',
      'Hora 15h zona muerta sin desbordamiento — 300 llamadas/mes perdidas en la misma franja cada mes',
      'Sin revisión mensual de KPIs — cliente sin visibilidad de su propia operación',
      'Apertura 7–8h sin IVR informativo — 139 llamadas sin alternativa de contacto',
      'Anomalía de abril sin investigar — señal sin respuesta documentada',
      'Número inactivo 3313109796 en agenda activa — 21 marcaciones fallidas sistémicas',
    ],
    amenazas: [
      'ANA ISABEL sin corrección: 728+ llamadas perdidas cada período continuando indefinidamente',
      'Abandono saliente en escalada puede señalar base de contactos degradada o estrategia de canal cambiando',
      'Dispersión de 77pp entre agentes puede generar percepción de inconsistencia de la plataforma si no se explica correctamente',
      'Sin revisión mensual: el cliente puede descubrir los problemas por su cuenta antes que Fátima los presente',
      'Adopción 13/100 puede mejorar si hay coaching pero puede deteriorarse si los problemas de ANA ISABEL no se resuelven',
      'Competidores de telefonía en nube pueden atraer con propuestas de configuración más simple',
    ],
  },

  conclusion: 'Azyco tiene una operación real de 37,003 llamadas con 115 extensiones en 16 sucursales. El health score de 61/100 con pago automático al 100% es la base de una cuenta estabilizable. El problema no es la plataforma — los 7 agentes estrella lo demuestran. El problema es que la configuración no está estandarizada y el cliente no tiene visibilidad de esa disparidad.\n\nFátima tiene acceso al argumento más poderoso en la conversación SAC: el contacto principal de Azyco, César Arellano, opera personalmente con 2.1% de abandono. Él sabe que la plataforma funciona. La conversación es sobre por qué el resto del equipo no llega al mismo estándar — y esa es exactamente la conversación que Fátima puede liderar con datos.',

  pierde: [
    'ANA ISABEL sin corrección: 728 llamadas perdidas por período, mes tras mes',
    'Abandono saliente llega a 40%+ en julio si no se audita la configuración de ruteo',
    'César descubre la dispersión de 77pp por su cuenta — Fátima pierde posición analítica',
    'Número 3313109796 sigue en agenda — 21+ marcaciones fallidas mensuales',
    'Anomalía de abril sin investigar — señal de cambio operativo no gestionado',
    'Sin revisión mensual — el cliente toma decisiones sin datos de la plataforma',
    'Adopción se estanca en 13/100 — sin ruta clara de mejora ni propuesta de valor',
  ],
  gana: [
    'ANA ISABEL corregida esta semana: 728 llamadas recuperadas — primera mejora visible y medible',
    'César recibe análisis con sus propias métricas: posición de confianza y autoridad analítica para Fátima',
    'Desbordamiento 15h activo: ~300 llamadas/mes recuperadas. Resultado medible en 30 días',
    'Depuración de agenda: abandono saliente < 33% — primer mes bajo ese umbral en el período',
    'Revisión mensual iniciada: cliente con visibilidad, Fátima como canal de datos permanente',
    'Sesión de capacitación TOP performers: dispersión de 77pp reducida sistemáticamente',
    'Health Score objetivo > 70/100 en 90 días con configuración correcta',
  ],
  recomendacion_central: 'Fátima debe presentar el análisis a César Arellano en los próximos 7 días, usando sus propias métricas (2.1% abandono) como punto de partida. Antes de esa reunión, debe haber corregido ya ANA ISABEL y el número inactivo — llegar con las acciones hechas, no con las intenciones. La narrativa es: "La plataforma ya funciona para 7 de tus extensiones. Hoy resolvemos por qué el resto no llega al mismo estándar."',
}
