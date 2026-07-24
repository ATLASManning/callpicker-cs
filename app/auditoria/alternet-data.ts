import type { AuditoriaCase } from './types'

export const ALTERNET: AuditoriaCase = {
  id: 'alternet',
  asesor: 'Claudia',
  nombre: 'ALTERNET',
  sector: 'Telecomunicaciones · ISP Fibra Óptica · Comunidades Rurales',
  fecha_periodo: 'Enero – Junio 2026',
  fecha_auditoria: 'Jun 2026',
  tipo_cliente: 'Pequeña empresa · 11–50 empleados · CID 122421 · Zona de riesgo HS 56',
  descripcion_contexto: '13,234 llamadas analizadas · Asesor: Claudia · Contacto: Anahí Santiago Vega · Pedro Escobedo, Querétaro',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Health Score',        value: '56 / 100 · Zona riesgo',  color: '#ef4444' },
    { label: 'Adopción plataforma', value: '2 / 100 (ningún módulo)', color: '#dc2626' },
    { label: 'Abandono saliente',   value: '58.2% sostenido 6 meses', color: '#f59e0b' },
    { label: 'Mejora entrante',     value: '65.8% → 28.8% (−37pp)',   color: '#22c55e' },
  ],

  resumen_ejecutivo: 'ALTERNET es un ISP de fibra óptica para comunidades rurales en Querétaro que opera con 11–50 empleados y MRR de $8,541 MXN. El análisis cubre 13,234 llamadas del H1 2026 y presenta una historia de dos velocidades.\n\nLas llamadas entrantes muestran una mejora real y acelerada: la tasa de pérdida cayó 37 puntos porcentuales en 6 meses (65.8% → 28.8%). Esta es la señal positiva más importante de la cuenta y debe ser comunicada formalmente al cliente antes de que cualquier conversación de riesgo ocurra.\n\nLas llamadas salientes tienen un problema estructural: 58.2% de pérdida constante durante los 6 meses sin variación mensual. Este comportamiento descarta problemas coyunturales y apunta a falla de configuración de ruteo. Ningún asesor ha intervenido en esta falla en 6 meses.\n\nEl hallazgo más crítico: adopción de 2/100. Ningún módulo adicional está activo — sin IA de Voz, sin IA de Chat, sin API, sin pago automático. El cliente paga por una plataforma que usa al 2% de su capacidad.',

  resultado_positivo: 'La mejora de entrantes es genuina y medible: de 65.8% de pérdida en enero a 28.8% en junio, con junio ya superando el mejor mes anterior (71.1% de atención vs 68.9% de mayo). En 6 meses, Alternet aprendió a usar el canal inbound. El benchmark es Ximena Araujo: 3,083 llamadas entrantes con 78% de atención — el estándar interno que el resto del equipo puede replicar.\n\nEl crecimiento orgánico de demanda refuerza la narrativa: el volumen de entrantes creció 70% entre enero y mayo (990 → 1,692). La plataforma ha soportado ese crecimiento sin degradación del servicio.',

  hallazgos: [
    'Adopción en 2/100: ningún módulo adicional activado en 4 años de relación. Sin IA de Voz, sin IA de Chat, sin API, sin pago automático, sin revisión de panel.',
    'Tasa de pérdida saliente en 58.2% constante durante 6 meses — falla estructural de configuración de ruteo, no de agentes individuales.',
    'Tres agentes con 0% de atención en entrantes: Osiel Martínez (325 llamadas), Maricruz Martínez (524) y Víctor Marchán (125) = 974 oportunidades perdidas. No están configurados en el grupo entrante.',
    'Fin de semana sin cobertura: 75.4% de pérdida el domingo y 71.7% el sábado. Para un ISP de comunidades rurales, esto son fallas de conectividad sin atención en los dos días más críticos.',
    'Zayra Cerón concentra el 42.7% del volumen total saliente (2,140 llamadas) con solo 44.8% de efectividad — el agente con mayor impacto en el resultado global saliente.',
    'Sub-cuenta inactiva sin factura en junio 2026 — sin seguimiento activo KAM, esta cuenta puede perderse sin que nadie lo detecte.',
    'Duración promedio de llamadas muy corta: 1.88 min en salientes exitosas y 1.18 min en entrantes. Para un ISP de soporte técnico, este tiempo es insuficiente para resolver problemas reales.',
    'Madrugada (1–5h): 100% de pérdida con 8 llamadas — sin ninguna cobertura ni mensaje alternativo.',
    'Franja 18–20h: 60–81% de pérdida — cierre de jornada sin cobertura y sin IVR informativo.',
    'Panel administrador sin revisión mensual registrada — el cliente no monitorea su propia operación.',
    'Ticket de capacitación abierto el 1 de junio 2026 — el cliente muestra intención de mejorar. Momentum que debe ser aprovechado de inmediato.',
  ],

  cronologia: [
    { fecha: 'Jul 2022',      responsable: 'Operación',             evento: 'ALTERNET inicia como cliente de Callpicker. Servicio: Visibilidad y Control IL + CP Chat + DIDs. Desde el primer día sin activación de módulos adicionales.', tipo: 'neutral' },
    { fecha: 'Ene 2026',      responsable: 'Operación / Claudia',   evento: 'Enero: 990 entrantes con 65.8% de pérdida. 827 salientes con 61.5% de pérdida. Los dos problemas simultáneos desde el inicio del período analizado.', tipo: 'problema' },
    { fecha: 'Ene–Jun 2026',  responsable: 'Operación saliente',    evento: 'Salientes: 55.6%–61.5% de pérdida constante en los 6 meses. Ninguna variación mensual significativa. Falla estructural de configuración no intervenida.', tipo: 'problema' },
    { fecha: 'Ene–Jun 2026',  responsable: 'Equipo Alternet',       evento: 'Entrantes: mejora progresiva y sostenida. 65.8% → 60.4% → 52.7% → 48.5% → 31.0% → 28.8%. El equipo aprendió a usar la plataforma inbound.', tipo: 'ok' },
    { fecha: 'May 2026',      responsable: 'Operación',             evento: 'Mayo: 1,692 entrantes — pico de volumen del período. Tasa de pérdida en 31%. El crecimiento se acelera y la plataforma lo soporta.', tipo: 'ok' },
    { fecha: '1 Jun 2026',    responsable: 'Anahí Santiago / Equipo', evento: 'Ticket de capacitación en Voz abierto por el cliente. Señal directa de intención de mejora. Momentum de aprendizaje activo.', tipo: 'pivote' },
    { fecha: 'Jun 2026*',     responsable: 'Equipo Alternet',       evento: 'Junio: 28.8% de pérdida en entrantes al 16 del mes — el mejor registro histórico. Junio ya supera todos los meses anteriores en tasa de atención.', tipo: 'ok' },
    { fecha: 'Jun 2026',      responsable: 'Dir. SAC / Claudia',    evento: 'Auditoría generada. Sub-cuenta inactiva sin factura de junio detectada. Tres agentes con 0% en entrantes identificados. Análisis entregado para acción.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',           value: 'ALTERNET' },
    { label: 'CID Zoho',               value: '122421' },
    { label: 'Giro',                   value: 'Telecomunicaciones / ISP Fibra Óptica (comunidades rurales)' },
    { label: 'Tamaño',                 value: 'Pequeña empresa · 11–50 empleados' },
    { label: 'Oficinas',               value: '1 punto físico · Pedro Escobedo, Querétaro' },
    { label: 'Asesor SAC',             value: 'Claudia' },
    { label: 'Contacto principal',     value: 'Anahí Santiago Vega — Jefa de Operaciones · anahi@alternet.io · 4482510220' },
    { label: 'Servicio contratado',    value: 'Visibilidad y Control IL + CP Chat + DIDs' },
    { label: 'Cliente desde',          value: 'Julio 2022 (1,428 días)' },
    { label: 'MRR',                    value: '$8,541 MXN (cuenta) / $10,722 MXN (grupo)' },
    { label: 'Health Score',           value: '56 / 100 — Sub-scores: Actividad s/d · Adopción 2 · Pago s/d · Relacional s/d' },
    { label: 'Sub-cuentas',            value: '2 totales · 1 activa en junio 2026' },
  ],

  necesidad_negocio: 'ALTERNET presta servicio de internet a comunidades rurales en Querétaro, lo que implica una operación 7 días a la semana con demanda de soporte técnico en cualquier horario. Sus clientes reportan fallas de conectividad y requieren atención inmediata — cada llamada perdida en fin de semana o fuera de horario es un cliente sin internet.\n\nLa necesidad de negocio central es: disponibilidad de atención extendida sin incrementar costo de personal. Exactamente el caso de uso ideal para IA de Voz y canales automatizados de soporte. El cliente paga por estas capacidades pero no las usa.',

  potencial_corto: [
    'Corregir configuración de 3 agentes con 0% en entrantes — recuperar 974 llamadas perdidas por período sin costo adicional',
    'Auditar configuración de salientes — corregir ruteo o disponibilidad de destinos que causan 58.2% de pérdida',
    'Presentar mejora 65.8% → 28.8% a Anahí como victoria compartida — abrir conversación de expansión desde datos positivos',
    'Activar sub-cuenta inactiva o documentar su estado antes de que genere churn silencioso',
    'Aprovechar ticket de capacitación abierto el 1 de junio — momentum de intención activo',
  ],
  potencial_largo: [
    'IA de Voz para fin de semana y horario nocturno — atiende reportes de fallas, consulta de estado y enrutamiento básico sin personal',
    'IA de Chat para soporte de primer nivel — ISP con problemas técnicos repetibles es el caso de uso ideal',
    'Capacitación diferenciada: Ximena Araujo (78% atención) comparte protocolo con el equipo',
    'Revisión mensual formal con reporte de datos — ningún mes ha tenido revisión documentada',
    'Expansión a segunda oficina o sucursal si ALTERNET sigue creciendo organicamente',
  ],

  tacticas: [
    { nombre: 'Adopción como argumento de valor', descripcion: 'El cliente puede no percibir la plataforma como herramienta de gestión sino como línea de teléfono. Si no ve el valor de los módulos, no contratará expansión y puede buscar alternativas más simples.', impacto: 'Riesgo de no-renovación o downgrade si no se activa adopción antes de la revisión de contrato' },
    { nombre: 'Sub-cuenta inactiva como señal de alerta', descripcion: 'Una sub-cuenta sin factura en junio puede ser el precursor de cancelación o reducción de servicio. Sin seguimiento KAM activo, la pérdida puede ocurrir sin aviso.', impacto: 'Churn parcial o total si la sub-cuenta no se gestiona en las próximas 2 semanas' },
  ],
  senal_alarma: 'Si la sub-cuenta inactiva lleva más de 60 días sin factura y sin contacto del cliente, es señal de churn en proceso. Claudia debe identificar el estado de esa cuenta y el nombre del contacto responsable antes de la próxima interacción con Anahí.',

  problema_raiz: 'ALTERNET usa la plataforma al 2% de su capacidad durante 4 años porque nadie del equipo Callpicker ha hecho una presentación formal de valor de los módulos adicionales en el contexto específico de un ISP rural.',
  problema_raiz_detalle: 'La falla de salientes (58.2% constante) es un problema técnico de configuración que ningún asesor ha escalado al equipo técnico en 6 meses. La adopción en 2/100 no es resistencia del cliente — es ausencia de propuesta con contexto: un ISP de comunidades rurales con demanda 7 días y soporte técnico repetible es el caso de uso más obvio para IA de Voz y Chat. Nadie lo ha planteado así.\n\nEl cliente abrió un ticket de capacitación el 1 de junio. Esa es la señal más clara posible de que hay disposición de mejorar. El timing es ahora.',

  flujo_real: [
    { fase: '1. Adopción en 2/100 durante 4 años',   area: 'Claudia / Equipo SAC',    accion: 'Sin presentación formal de módulos adicionales en contexto ISP rural', resultado: 'Cliente paga 4 años por plataforma que usa al 2% de capacidad.' },
    { fase: '2. Falla saliente sin intervención',    area: 'Técnico Callpicker',       accion: 'Configuración de ruteo saliente nunca auditada — 58.2% de pérdida constante', resultado: '6 meses de problema estructural sin escalamiento técnico.' },
    { fase: '3. Tres agentes sin configurar',        area: 'Equipo Alternet / Claudia', accion: 'Osiel, Maricruz y Víctor no asignados al grupo entrante', resultado: '974 llamadas perdidas por período sin que sea problema de agentes.' },
    { fase: '4. Fin de semana sin cobertura',        area: 'Operación Alternet',       accion: 'Sin turnos de fin de semana ni canal automatizado de respaldo', resultado: '75.4% abandono domingo — ISP sin atención los días de mayor falla de red.' },
    { fase: '5. Ticket de capacitación (1 jun)',     area: 'Anahí Santiago',           accion: 'Cliente abre ticket de capacitación en Voz — señal de intención activa', resultado: 'Momentum disponible que caduca si no se activa en las próximas 2 semanas.' },
    { fase: '6. Sub-cuenta inactiva sin seguimiento', area: 'Claudia',                 accion: 'Sub-cuenta sin factura de junio — sin acción documentada', resultado: 'Churn silencioso posible sin que nadie lo detecte.' },
  ],

  comparativo: [
    { metrica: 'Adopción de módulos',        real: '2/100 — ningún módulo activo',              ideal: 'IA Voz + Chat activados para soporte 24/7' },
    { metrica: 'Tasa de pérdida saliente',   real: '58.2% constante (6 meses)',                  ideal: '<35% con auditoría de configuración de ruteo' },
    { metrica: 'Cobertura fin de semana',    real: '75.4% abandono domingo, 71.7% sábado',       ideal: 'IA de Voz activa para reportes de fallas y consultas' },
    { metrica: 'Agentes configurados',       real: '3 agentes con 0% en entrantes (974 perdidas)', ideal: 'Todos asignados correctamente al grupo entrante' },
    { metrica: 'Tasa de pérdida entrante',   real: '28.8% junio (mejora real)',                  ideal: '<20% con capacitación completada' },
    { metrica: 'Seguimiento sub-cuenta',     real: 'Sin factura jun 2026 — sin acción',          ideal: 'Estado documentado + acción definida en 7 días' },
    { metrica: 'Revisión mensual',           real: 'Sin revisión de panel documentada',           ideal: 'QBR mensual con Anahí + reporte de KPIs' },
  ],

  plan_inmediato: [
    { accion: 'Escalar con técnico Callpicker la configuración de ruteo saliente. Con 58.2% de pérdida constante en 6 meses, el problema no son los agentes — es la arquitectura de cola. Acción interna que no requiere aprobación del cliente.', responsable: 'Claudia + Técnico Callpicker', criterio: 'Diagnóstico técnico completado y resultado documentado en la semana' },
    { accion: 'Revisar configuración de Osiel Martínez, Maricruz Martínez y Víctor Marchán. Verificar asignación al grupo entrante, estado de extensión y desvío habilitado. 974 llamadas perdidas recuperables sin costo.', responsable: 'Claudia + Técnico', criterio: 'Tres agentes correctamente configurados. Verificar atención en las siguientes 48h' },
    { accion: 'Identificar estado de sub-cuenta inactiva. Nombre del contacto responsable y motivo de inactividad en junio 2026. Acción de prevención de churn silencioso.', responsable: 'Claudia', criterio: 'Estado documentado en CRM en los próximos 7 días' },
  ],

  plan_mediano: [
    { accion: 'Presentar a Anahí la mejora de entrantes (65.8% → 28.8%) como resultado de valor medible. Llevar el dato en formato visual antes de que el cliente lo descubra por su cuenta. Base perfecta para abrir conversación de expansión.', responsable: 'Claudia', criterio: 'Reunión realizada. Anahí informada formalmente del resultado.' },
    { accion: 'Proponer IA de Voz para cobertura de fin de semana y horario nocturno. Argumento de negocio: ISP rural con 75.4% de abandono el domingo y 71.7% el sábado. La plataforma ya tiene la capacidad — el cliente no la usa.', responsable: 'Claudia + Ventas', criterio: 'Demo presentada a Anahí. Propuesta formal enviada.' },
    { accion: 'Capitalizar el ticket de capacitación de voz del 1 de junio. Agendar sesión con el equipo Alternet donde Ximena Araujo (78% de atención) comparte su protocolo con el resto.', responsable: 'Claudia', criterio: 'Sesión de capacitación realizada. Benchmark interno activo.' },
  ],

  plan_estrategico: [
    { accion: 'Activar revisión mensual formal con Anahí. Panel administrador sin revisión documentada = cliente sin visibilidad de su propia operación. Proponer reunión mensual de 30 min con reporte de KPIs.', responsable: 'Claudia', criterio: 'Primera reunión mensual agendada a más tardar en julio 2026' },
    { accion: 'Proponer cobertura de franja 18–20h del lunes con desbordamiento o IVR informativo. Lunes concentra 25.9% del volumen semanal con 44.1% de pérdida en ese horario.', responsable: 'Técnico + Claudia', criterio: 'Configuración activa. Medición de impacto en 30 días.' },
    { accion: 'Presentar hoja de ruta de adopción de módulos a 6 meses. IA Voz → IA Chat → API → pago automático. Contexto ISP rural: cada módulo tiene caso de uso inmediato y concreto.', responsable: 'Claudia + Dir. SAC', criterio: 'Hoja de ruta presentada y aceptada por Anahí.' },
  ],

  areas_oportunidad: [
    { area: 'IA de Voz (fin de semana + noche)',   impacto: 'ISP rural con 75.4% abandono domingo. Atención automática de reportes de fallas es el upsell más obvio y urgente de la cuenta.', responsable: 'Claudia + Ventas' },
    { area: 'IA de Chat para soporte técnico',     impacto: 'Problemas de conectividad repetibles son el caso de uso ideal para chat automatizado. Reduce carga del equipo y mejora NPS.', responsable: 'Claudia + Ventas' },
    { area: 'Capacitación diferenciada',           impacto: 'Ximena Araujo: 3,083 llamadas con 78% de atención. Su protocolo es replicable. Sesión interna = mejora sin costo.', responsable: 'Claudia' },
    { area: 'Pago automático',                     impacto: 'No configurado. Para empresa de 11–50 empleados con facturación mensual recurrente, es reducción directa de fricción administrativa.', responsable: 'Claudia' },
  ],

  perfiles: [
    {
      nombre: 'Anahí Santiago Vega', rol: 'Jefa de Operaciones — Decisora principal', color: '#3b82f6',
      campos: [
        { label: 'Contacto',        value: 'anahi@alternet.io · Tel. 4482510220' },
        { label: 'Perfil',          value: 'Responsable de la operación técnica y el equipo de agentes. Tiene visibilidad de los problemas del día a día. Abrió el ticket de capacitación — hay disposición de mejorar.' },
        { label: 'Argumento clave', value: 'La mejora de entrantes (65.8% → 28.8%) la muestra como parte del resultado positivo — el equipo aprendió. Ahora viene la siguiente etapa: resolver salientes y activar módulos.' },
        { label: 'Apertura sugerida', value: '"Anahí, revisamos la actividad del semestre. El dato más importante: sus entrantes mejoraron 37 puntos en 6 meses. Su equipo está aprendiendo a usar la plataforma. Pero hay un problema que nadie ha podido resolver en 6 meses: las salientes pierden el 58% — y eso lo podemos arreglar esta semana sin que el equipo haga nada diferente."' },
      ],
    },
    {
      nombre: 'Ximena Araujo Bacilio', rol: 'Agente benchmark — 3,083 entrantes, 78% de atención', color: '#22c55e',
      campos: [
        { label: 'Relevancia',      value: 'Mayor volumen de la cuenta en entrantes Y mejor tasa de atención. Demuestra que calidad y volumen no son contradictorios.' },
        { label: 'Propuesta',       value: 'Sesión interna donde comparte su protocolo con el resto del equipo. Especialmente crítico para los agentes con <50% de atención saliente.' },
      ],
    },
    {
      nombre: 'Osiel M. / Maricruz M. / Víctor Marchán', rol: 'Agentes con 0% de atención en entrantes', color: '#ef4444',
      campos: [
        { label: 'Situación',       value: '974 llamadas perdidas entre los tres. No es problema de desempeño personal — es configuración incorrecta de enrutamiento.' },
        { label: 'Acción',          value: 'Verificar asignación al grupo entrante y estado de extensión. Corrección técnica que resuelve ~10% del abandono sin ningún cambio de personal.' },
      ],
    },
    {
      nombre: 'Zayra Cerón Martínez', rol: 'Agente con mayor impacto en salientes (42.7% del volumen)', color: '#f59e0b',
      campos: [
        { label: 'Situación',       value: '2,140 llamadas salientes (42.7% del total) con 44.8% de efectividad. Su desempeño tiene más impacto en el resultado saliente global que cualquier otro agente.' },
        { label: 'Diagnóstico',     value: 'Puede ser problema de configuración de cola o de protocolo de contacto. Requiere revisión específica de su flujo de trabajo en plataforma.' },
      ],
    },
    {
      nombre: 'Claudia', rol: 'Asesor SAC — Gestora de la cuenta', color: '#6366f1',
      campos: [
        { label: 'Prioridades',     value: '1. Escalar falla técnica de salientes a equipo técnico AHORA. 2. Presentar mejora de entrantes a Anahí. 3. Activar ticket de capacitación. 4. Verificar sub-cuenta.' },
        { label: 'Arma principal',  value: 'El dato positivo de entrantes es el mejor abre-puertas para una conversación de expansión. Usarlo primero — antes de llevar los problemas.' },
        { label: 'Ventana de tiempo', value: 'El ticket de capacitación del 1 de junio da 2–3 semanas de momentum activo. Después del ticket sin respuesta, el cliente pierde la disposición.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Mejora real de 37pp en tasa de pérdida entrante en 6 meses — aprendizaje y adopción inbound ocurriendo',
      'Ximena Araujo: benchmark interno con 78% de atención en mayor volumen de la cuenta',
      'Crecimiento orgánico de demanda: entrantes +70% de enero a mayo — cliente en expansión',
      'Junio mejor mes histórico: 71.1% de atención en entrantes — tendencia se acelera',
      'Ticket de capacitación abierto: disposición activa del cliente de mejorar',
      'Relación de 1,428 días — antigüedad que facilita conversaciones difíciles',
      'MRR grupal: $10,722 MXN — subcuenta adicional con potencial de activación',
    ],
    oportunidades: [
      'IA de Voz: cobertura de fin de semana para ISP rural — caso de uso obvio y no activado',
      'IA de Chat: soporte técnico de primer nivel en problemas repetibles de conectividad',
      'Corrección de ruteo saliente: puede reducir 58.2% a <35% sin costo de personal',
      'Corrección de 3 agentes con 0%: recupera 974 llamadas perdidas por período de forma inmediata',
      'Sub-cuenta inactiva: activación o documentación de estado evita churn silencioso',
      'Capacitación sesión Ximena: protocolo benchmark replicable a todo el equipo',
      'Pago automático: reduces fricción administrativa para empresa pequeña con pago mensual recurrente',
    ],
    debilidades: [
      'Adopción en 2/100 durante 4 años — ningún módulo adicional activado en toda la relación',
      'Falla de salientes (58.2%) no escalada a equipo técnico en 6 meses',
      'Sin revisión mensual de panel documentada — cliente sin visibilidad de su propia operación',
      'Tres agentes con 0% de atención en entrantes sin corrección de configuración',
      'Fin de semana sin cobertura ni canal automatizado — 75.4% abandono domingo',
      'Sub-cuenta inactiva sin seguimiento documentado',
      'Duración promedio muy corta en ambos flujos (1.18–1.88 min) — posible cierre prematuro de llamadas',
    ],
    amenazas: [
      'Health Score en 56/100 — zona de riesgo que puede deteriorarse si no hay intervención en 30 días',
      'Sub-cuenta inactiva puede representar churn silencioso en proceso',
      'Cliente en crecimiento puede evaluar plataformas con mayor oferta de módulos activados',
      'Sin atención de fin de semana: ISP rural con fallas sin soporte = NPS crítico de clientes finales',
      'Ticket de capacitación sin respuesta en 2–3 semanas = pérdida de momentum de adopción',
      'Renovación en riesgo si adopción sigue en 2/100 — cliente no percibe valor diferenciado',
    ],
  },

  conclusion: 'ALTERNET es una cuenta con una narrativa de dos velocidades. Las entrantes mejoran de forma acelerada y documentan que el equipo está aprendiendo. Las salientes tienen un problema técnico que nadie ha intervenido en 6 meses. La adopción en 2/100 representa una oportunidad de expansión intacta en una cuenta de 4 años.\n\nLa ventana de intervención es clara: el ticket de capacitación del 1 de junio es la señal más explícita de disposición que un cliente puede dar. Claudia tiene 2 semanas para capitalizarla antes de que el momentum se disipe. La primera acción no requiere al cliente: escalar la falla de salientes al equipo técnico. La segunda tampoco: corregir los 3 agentes con 0%. Ambas pueden ejecutarse esta semana.',

  pierde: [
    'Ticket de capacitación sin respuesta → cliente pierde disposición de mejora',
    'Falla de salientes sin intervención → 58.2% de pérdida permanente 7 meses, 8 meses...',
    'Sub-cuenta inactiva sin seguimiento → churn silencioso confirmado',
    'Fin de semana sin IA de Voz → ISP rural con 75.4% abandono domingo indefinidamente',
    'Adopción en 2/100 en renovación → cliente evalúa plataformas con más valor percibido',
    'Health Score 56 sin intervención → deteriora en siguiente cálculo',
  ],
  gana: [
    'Falla saliente resuelta esta semana → primera mejora técnica en 6 meses, sin costo',
    'Tres agentes corregidos → 974 llamadas recuperadas por período inmediatamente',
    'Anahí recibe datos positivos de entrantes → conversación de expansión abierta',
    'Ticket de capacitación capitalizado → Ximena comparte protocolo, equipo mejora',
    'IA de Voz propuesta y demostrada → cobertura de fin de semana, upsell inmediato',
    'Sub-cuenta documentada → churn silencioso prevenido o confirmado con tiempo',
    'QBR mensual iniciado → Claudia posicionada como asesora estratégica, no reactiva',
  ],
  recomendacion_central: 'Claudia debe actuar en dos frentes esta semana. Frente interno: escalar la falla técnica de salientes con el equipo de Callpicker y corregir la configuración de los 3 agentes con 0%. Ambas son acciones internas que no requieren al cliente. Frente externo: capitalizar el ticket de capacitación como punto de entrada para presentar la mejora de entrantes, abrir la conversación de IA de Voz y resolver el estado de la sub-cuenta. El cliente ya mostró disposición. El movimiento es de Claudia.',
}
