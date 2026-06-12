import type { AuditoriaCase } from './types'

export const AGUA_INMACULADA: AuditoriaCase = {
  id: 'agua-inmaculada',
  nombre: 'Agua Inmaculada',
  sector: 'Franquicias – Distribución de Agua / Red Nacional',
  fecha_periodo: 'Enero – Mayo 2026',
  fecha_auditoria: 'Jun 2026',
  tipo_cliente: 'Mid-Market – Red de Franquicias',
  descripcion_contexto: 'Análisis de consumo y atención telefónica · 10 líneas activas',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Llamadas no atendidas',  value: '8,791',   color: '#ef4444' },
    { label: 'Uso máximo del plan',    value: '99.1%',   color: '#f59e0b' },
    { label: 'Tasa de pérdida (Abr)',  value: '33.4%',   color: '#6366f1' },
    { label: 'Crecimiento de volumen', value: '+17.8%',  color: '#22c55e' },
  ],

  resumen_ejecutivo: 'El presente informe nació de una conversación honesta: Javier Peña (Coordinador de Sistemas) expresó que sentía que el servicio no estaba siendo aprovechado al nivel del costo. Eso derivó en un análisis llamada por llamada, minuto por minuto, del periodo enero–abril 2026.\n\nEl análisis tiene dos caras. La primera es alentadora: aplicando las reglas reales de contabilización de la plataforma, el consumo facturable promedio es de 9,150 minutos al mes — dentro del plan contratado de 10,000. La percepción del cliente era correcta en términos de valor entregado.\n\nLa segunda cara requiere atención inmediata. En los últimos cuatro meses, 8,791 llamadas no fueron atendidas — 1 de cada 3 llamadas entrantes. La tendencia va en aumento: de 29.5% en enero a 33.4% en abril. Además, abril alcanzó el 99.1% de uso del plan, y con un crecimiento de volumen del +17.8%, junio podría generar cargos adicionales no presupuestados.',

  resultado_positivo: 'El análisis permitió corregir la percepción inicial del cliente: el consumo real está dentro del plan contratado, y el costo es justificable. Al mismo tiempo, se identificó el problema operativo real — 8,791 llamadas sin atención que representan oportunidades de servicio perdidas para su red de más de 1,800 franquicias. La auditoría entregó dos propuestas concretas y basadas en datos, posicionando a Callpicker como aliado estratégico y no solo como proveedor.',

  hallazgos: [
    'El consumo facturable promedio es de 9,150 min/mes — dentro del plan de 10,000 — pero abril llegó al 99.1% (9,910 min). Con el crecimiento actual de +17.8%, mayo o junio superarán ese límite.',
    '8,791 llamadas no fueron atendidas en 4 meses (1 de cada 3). La tasa de pérdida aumentó de 29.5% en enero a 33.4% en abril — 4 puntos porcentuales en 4 meses.',
    'El 55% de las llamadas no atendidas se concentra en 5 horas específicas: 09:00, 10:00, 11:00, 12:00 y 13:00 — exactamente las horas de mayor actividad operativa de las franquicias.',
    'Tres extensiones de asistencia concentran el núcleo del problema: Efraín (49.2% tasa de pérdida), Luz María (40.6%) y Pedro (28.6%). Son los puntos de contacto más demandados y los más saturados.',
    'Las llamadas salientes a celulares representan el 32–35% de las llamadas pero consumen el 70–76% de todos los minutos facturables salientes — el destino que más pesa en la bolsa del cliente.',
  ],

  cronologia: [
    { fecha: 'Ene 2026', responsable: 'Operación Agua Inmaculada', evento: 'Consumo: 8,856 min (88.6% del plan). Llamadas no atendidas: 1,030 (29.5%). Volumen base establecido.', tipo: 'neutral' },
    { fecha: 'Feb 2026', responsable: 'Operación Agua Inmaculada', evento: 'Consumo: 9,060 min (90.6%). No atendidas: 1,124 (30.4%). Tendencia de pérdida inicia ascenso.', tipo: 'neutral' },
    { fecha: 'Mar 2026', responsable: 'Operación Agua Inmaculada', evento: 'Volumen sube pero consumo baja a 8,772 min (87.7%). No atendidas saltan a 1,503 (37.4%). Señal de saturación de agentes.', tipo: 'problema' },
    { fecha: 'Abr 2026', responsable: 'Operación Agua Inmaculada', evento: 'Plan al 99.1% (9,910 min). No atendidas: 1,641 (39.5%). Abril es el mes crítico — al límite del plan y con la mayor tasa de pérdida.', tipo: 'problema' },
    { fecha: 'Jun 2026', responsable: 'Claudia Hernández — SAC',   evento: 'Se realiza auditoría completa de cuenta. Se entrega informe a Javier Peña con dos opciones de plan. Iniciativa proactiva de Callpicker.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'Agua Inmaculada' },
    { label: 'Sector',              value: 'Franquicias – Distribución de Agua / Red Nacional' },
    { label: 'Contacto principal',  value: 'Javier Peña — Coordinador de Sistemas' },
    { label: 'Líneas activas',      value: '10' },
    { label: 'Plan actual',         value: '10,000 minutos / mes — $12,500 MXN/mes' },
    { label: 'Tipo de cliente',     value: 'Mid-Market – Red de 1,800+ franquicias' },
    { label: 'Ejecutivo SAC',       value: 'Claudia Hernández — Ejecutivo de Satisfacción al Cliente' },
  ],

  necesidad_negocio: 'Agua Inmaculada opera una red de más de 1,800 franquicias que dependen del canal telefónico para comunicación operativa con su coordinación central. El volumen de llamadas está creciendo (+17.8% en 4 meses) a medida que la red se expande.\n\nEl cliente contrató Callpicker para manejar la comunicación centralizada de su red. Su principal necesidad es asegurar que cada franquicia que llama reciba atención — sin exceder el presupuesto del plan contratado. La pregunta que llevó a esta auditoría fue si el costo mensual estaba justificado por el valor real del servicio.',

  potencial_corto: ['Decisión de plan (Opción A o B) antes de fin de junio', 'Evitar cargos por excedente en julio', 'Reducir tasa de llamadas no atendidas por debajo del 20%'],
  potencial_largo: ['Asistente virtual de desbordamiento para capturar el 100% de llamadas fuera de horario', 'Expansión de líneas conforme crece la red de franquicias', 'Reportes semanales por extensión como herramienta de gestión operativa'],

  tacticas: [
    { nombre: 'Cuestionamiento de valor',    descripcion: '"Siento que el servicio no está siendo aprovechado al nivel del costo" — percepción subjetiva que detonó la revisión', impacto: 'Correcto en dirección, incorrecto en diagnóstico. El problema real no era el consumo sino las llamadas perdidas.' },
    { nombre: 'Apertura a soluciones',       descripcion: 'Javier mostró disposición para recibir el informe y evaluar opciones concretas. Sin resistencia a los datos.', impacto: 'Perfil receptivo. El informe construyó credibilidad al validar su percepción antes de proponer una solución.' },
    { nombre: 'Decisión pendiente de datos', descripcion: 'El cliente no puede decidir sin números claros sobre el ROI de cada opción', impacto: 'El próximo paso es la presentación de este informe y la definición del plan antes de que llegue un mes con excedente.' },
  ],
  senal_alarma: 'Si el cliente comienza a comparar costos con soluciones de telefonía tradicional o PBX, es señal de que no tiene claridad sobre el valor diferencial del asistente virtual y los reportes analíticos de Callpicker. Regresar al dato de las 8,791 llamadas perdidas como ancla de la propuesta.',

  problema_raiz: 'Crecimiento de volumen sin escalamiento de capacidad de atención',
  problema_raiz_detalle: 'La red de franquicias de Agua Inmaculada está creciendo — el volumen de llamadas subió un 17.8% de enero a abril. Sin embargo, la capacidad de atención (número de agentes y extensiones) no creció al mismo ritmo. El resultado es una tasa de pérdida que escala cada mes (+1 punto porcentual en promedio). No es un problema de minutos — es un problema de capacidad. Y sin intervención, el problema no se estabiliza: se acumula.',

  flujo_real: [
    { fase: '1. Crecimiento silencioso',    area: 'Red de franquicias',           accion: '+17.8% en volumen de llamadas entrantes (ene→abr)', resultado: 'Presión creciente sobre los agentes de asistencia sin señal de alerta visible.' },
    { fase: '2. Saturación de extensiones', area: 'Asistencia (Efraín/Luz/Pedro)', accion: 'Las 3 extensiones de asistencia reciben más llamadas de las que pueden procesar', resultado: '49.2%, 40.6% y 28.6% de tasa de pérdida respectivamente. Núcleo del problema.' },
    { fase: '3. Concentración horaria',      area: '09:00–13:00 h',               accion: '55% de llamadas no atendidas en solo 5 horas al día', resultado: 'Los momentos de mayor actividad de franquicias coinciden con el cuello de botella.' },
    { fase: '4. Plan al límite',             area: 'Plan 10,000 min/mes',          accion: 'Abril cierra al 99.1% — el primero en casi rebasar el techo', resultado: 'Sin intervención, junio generará cargos por excedente no presupuestados.' },
    { fase: '5. Alerta proactiva de SAC',    area: 'Claudia Hernández – Callpicker',accion: 'Auditoría proactiva basada en los datos del cliente', resultado: 'Informe entregado con dos opciones concretas. Cliente posicionado para decidir.' },
  ],

  comparativo: [
    { metrica: 'Consumo mensual promedio',         real: '9,150 min (91.5% del plan)',        ideal: 'Plan Opción B: 15,000 min — margen del 51%' },
    { metrica: 'Tasa de pérdida de llamadas',      real: '32.7% promedio (33.4% en abril)',   ideal: 'Meta con asistente virtual: < 10%' },
    { metrica: 'Llamadas perdidas por mes',        real: '1,325 promedio / 1,641 en abril',   ideal: '< 400 con desbordamiento automático' },
    { metrica: 'Riesgo de excedente mensual',      real: 'Inminente — junio/julio en riesgo', ideal: 'Eliminado con plan de 15,000 min' },
    { metrica: 'Costo mensual',                    real: '$12,500 MXN',                       ideal: 'Opción B: $18,500 MXN (+$6,000)' },
    { metrica: 'Horas críticas sin cobertura',     real: '09:00–13:00 h (55% de pérdidas)',   ideal: 'Asistente virtual activo en desbordamiento' },
  ],

  plan_inmediato: [
    { accion: 'Presentar el informe en reunión con Javier Peña y revisar las dos opciones de plan', responsable: 'Claudia Hernández', criterio: 'Reunión agendada antes del 20 de junio' },
    { accion: 'Obtener decisión de plan (Opción A o B) antes del cierre de mayo para evitar excedente en junio', responsable: 'Claudia Hernández + Javier Peña', criterio: 'Contrato actualizado firmado' },
    { accion: 'Revisar asignación de extensiones de asistencia — especialmente Efraín, Luz María y Pedro', responsable: 'Javier Peña (operativo)', criterio: 'Plan de distribución de carga compartido con SAC' },
  ],
  plan_mediano: [
    { accion: 'Activar asistente virtual de desbordamiento en horario 09:00–13:00 h (si elige Opción B)', responsable: 'Activaciones + Javier Peña', criterio: 'Asistente operativo y capturando llamadas antes del 1 de julio' },
    { accion: 'Configurar cola inteligente por extensión para distribuir carga en horas pico', responsable: 'Soporte Técnico Callpicker', criterio: 'Tasa de pérdida en extensiones de asistencia < 25% en 30 días' },
    { accion: 'Emitir primer reporte mensual por extensión con alerta semanal', responsable: 'Claudia Hernández', criterio: 'Primer reporte enviado semana 1 de julio' },
  ],
  plan_estrategico: [
    { accion: 'Revisión trimestral de consumo y crecimiento para ajuste proactivo de plan', responsable: 'Claudia Hernández – SAC', criterio: 'Ningún mes supera el 85% del plan sin alerta previa' },
    { accion: 'Evaluar expansión de líneas conforme crece la red de franquicias', responsable: 'Ventas + SAC', criterio: 'Propuesta de crecimiento lista para Q4 2026' },
    { accion: 'Documentar Agua Inmaculada como caso de éxito de auditoría proactiva', responsable: 'SAC + Marketing', criterio: 'Caso documentado internamente para replicar metodología' },
  ],
  areas_oportunidad: [
    { area: 'Auditoría proactiva como metodología estándar SAC',           impacto: 'Convierte el momento de queja en momento de expansión de contrato. ROI inmediato.', responsable: 'SAC – Claudia Hernández' },
    { area: 'Asistente virtual de desbordamiento para redes de franquicias', impacto: 'Captura el 20–30% de llamadas perdidas sin contratar personal adicional. Caso replicable.', responsable: 'Producto + Activaciones' },
    { area: 'Alertas automáticas de consumo al 80% del plan',              impacto: 'Elimina la sorpresa del excedente. El cliente confía en que Callpicker lo cuida.', responsable: 'Ingeniería – Producto' },
    { area: 'Reporte por extensión como producto de retención',            impacto: 'El cliente usa los datos para gestionar a sus agentes — Callpicker se vuelve indispensable.', responsable: 'SAC + Producto' },
  ],

  perfiles: [
    {
      nombre: 'Javier Peña', rol: 'Cliente (Agua Inmaculada) — Coordinador de Sistemas / Decisor técnico', color: '#3b82f6',
      campos: [
        { label: 'Motivación primaria',  value: 'Asegurar que el presupuesto de telecomunicaciones esté justificado operativamente' },
        { label: 'Motivación secundaria',value: 'Evitar sorpresas en la facturación (excedentes) y reportar mejoras a su dirección' },
        { label: 'Estilo negociador',    value: 'Directo y basado en datos. Planteó su preocupación sin rodeos. Receptivo cuando los números son claros.' },
        { label: 'Táctica observada',    value: 'Cuestionamiento legítimo de valor — no como presión sino como necesidad real de entender su operación' },
        { label: 'Señal positiva',       value: 'Mostró apertura total al informe y a los datos. No hay resistencia — hay decisión pendiente.' },
        { label: 'Recomendación',        value: 'Presentar Opción B con énfasis en las 8,791 llamadas perdidas = franquicias sin respuesta. El ROI es claro.' },
      ],
    },
    {
      nombre: 'Claudia Hernández', rol: 'Callpicker SAC — Ejecutivo de Satisfacción al Cliente', color: '#22c55e',
      campos: [
        { label: 'Aportación clave',    value: 'Transformó una queja sobre el costo en una auditoría proactiva que revela oportunidad de upsell con datos' },
        { label: 'Metodología',         value: 'Análisis llamada por llamada con reglas reales de contabilización — entregó credibilidad antes de proponer' },
        { label: 'Fortaleza ejecutada', value: '"No venimos a venderle más minutos que no necesita. Venimos a mostrarle lo que sus datos dicen." — postura consultiva' },
        { label: 'Próximo paso',        value: 'Agendar reunión de presentación del informe y cerrar decisión de plan antes de que llegue el excedente' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Consumo facturable promedio controlado: 9,150/10,000 min (91.5%)',
      'Cliente receptivo y orientado a datos — no hay conflicto, hay una decisión pendiente',
      'SAC tomó iniciativa proactiva de auditoría antes de que el problema escale',
      'Red de 1,800+ franquicias representa potencial de crecimiento significativo',
    ],
    oportunidades: [
      'Opción B ($18,500/mes) resuelve consumo Y atención — ROI justificable con las 8,791 llamadas perdidas',
      'Asistente virtual como diferenciador: captura llamadas sin contratar personal',
      'Metodología de auditoría proactiva replicable en otros clientes de red de franquicias',
      'Reportes por extensión como herramienta de gestión operativa para el cliente',
    ],
    debilidades: [
      'Tasa de pérdida en ascenso: 29.5% → 33.4% en 4 meses sin señal de estabilización',
      '3 extensiones de asistencia saturadas sin plan de distribución de carga',
      'Las llamadas a celular consumen el 70–76% de minutos salientes — optimizable',
      'Sin alerta automática de consumo al 80% del plan — cliente no tuvo señal previa',
    ],
    amenazas: [
      'Junio o julio pueden generar el primer excedente si no se actualiza el plan antes de fin de mes',
      'Si el cliente percibe lentitud en la respuesta, puede comparar con alternativas de PBX más baratas',
      'El crecimiento de la red (+17.8% de volumen) puede superar cualquier plan sin asistente virtual',
      'Sin acción en extensiones saturadas, la tasa de pérdida puede superar el 40% en Q3',
    ],
  },

  conclusion: 'El caso Agua Inmaculada es un ejemplo de cómo una queja legítima sobre el valor del servicio puede convertirse en una oportunidad de expansión de contrato cuando SAC responde con datos en lugar de defensas. El consumo está bajo control — pero la operación está llegando a su límite de capacidad. La próxima llamada de Javier Peña no debería ser para reportar un cargo por excedente, sino para confirmar que eligió el plan que le permite crecer sin preocupaciones.',

  pierde: [
    'La confianza del cliente si junio genera un cargo inesperado por excedente',
    'La oportunidad de upsell a Opción B — que se vuelve reactiva en lugar de proactiva',
    'La credibilidad ganada con el informe si no se da seguimiento inmediato',
    'Una red de 1,800+ franquicias que podría migrar a una solución PBX más barata',
  ],
  gana: [
    'Contrato actualizado a $14,500 o $18,500/mes — retención y crecimiento',
    'Cliente que usa Callpicker como herramienta de gestión operativa, no solo como telefonía',
    'Caso de éxito de auditoría proactiva replicable en clientes de redes de franquicias',
    'Asistente virtual como producto core que resuelve el problema de las 8,791 llamadas perdidas',
  ],
  recomendacion_central: 'La auditoría proactiva de Agua Inmaculada debe convertirse en un proceso estándar de SAC: revisar consumo, llamadas perdidas y tendencias antes de que el cliente lo note, y llegar a la reunión con datos — no con propuestas. Ese posicionamiento consultivo es lo que diferencia a Callpicker de un proveedor de minutos.',
}
