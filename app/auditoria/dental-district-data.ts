import type { AuditoriaCase } from './types'

export const DENTAL_DISTRICT: AuditoriaCase = {
  id:                    'dental-district',
  asesor:                'Claudia',

  nombre:                'Dental District',
  sector:                'Salud · Clínica Dental · Zona Fronteriza',
  fecha_periodo:         'Enero – Julio 2026',
  fecha_auditoria:       'Jul 2026',
  tipo_cliente:          'SMB · Plan 1,100 min/mes · CID 162151 · HS 50',
  descripcion_contexto:  '4,574 llamadas analizadas · Asesor: Claudia Hernández · 2 extensiones activas · Operación mixta con predominancia saliente (3.1 sal/ent) · Tijuana (LADA 664) · 86.9% tráfico transfronterizo USA/Canadá',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Pérdida entrantes',       value: '28.0%',  color: '#ef4444' },
    { label: 'Caída salientes (jul)',    value: '−74%',   color: '#f97316' },
    { label: 'Pérdida en apertura',      value: '91.1%',  color: '#ef4444' },
    { label: 'Sobreconsumo mayo',        value: '+22%',   color: '#f59e0b' },
  ],

  resumen_ejecutivo: 'Dental District opera un esquema mixto con fuerte peso saliente: por cada llamada entrante se generan 3.1 salientes. El hallazgo de mayor severidad es la brecha de apertura — entre las 8:00 y 9:59 se pierde el 91–100% de las llamadas entrantes, mientras el equipo aún no está en cobertura. El volumen saliente cayó −74% desde febrero tras la salida del asesor Christopher (última actividad: 11 mayo), sin compensación de los dos agentes restantes. En mayo 2026, la cuenta operó con 21–22% de sobreconsumo de su bolsa de 1,100 minutos; enero, febrero y marzo rozaron el límite del plan (97–102%), dado que el 86.9% del tráfico es transfronterizo y se cobra por minuto real.',

  resultado_positivo: 'La tasa de contestación saliente es alta y estable (87.2%). El canal entrante mostró mejora en el último bimestre: junio registró la menor pérdida del período (16.8%). El equipo opera con cobertura parcial de sábado. La brecha de apertura es un problema de horario — acotado y corregible con automatización puntual.',

  hallazgos: [
    'CRÍTICO — Brecha de apertura: 91.1% de pérdida entrante a las 9:00 y 100% a las 8:00. La cobertura efectiva comienza ~90 minutos después de que los pacientes llaman.',
    'Caída saliente de −74% desde el pico de febrero (24.2 llamadas/día) hasta julio (6.3/día), directamente vinculada a la salida de Christopher (11 mayo). Manuel y Jazmin no compensaron el volumen.',
    'Sobreconsumo en mayo 2026: entre 1,329 y 1,347 minutos estimados contra plan de 1,100 (21–22% sobre plan). Enero–marzo también al límite (97–102%).',
    '86.9% del tráfico entrante y 94.7% del saliente corresponden a números de EE.UU./Canadá, facturados por minuto real — patrón de clientela transfronteriza ("turismo dental").',
    'Manuel Orantes: 34.2% pérdida en recepción vs. 24.8% de Jazmin, pese a recibir menor volumen. Posible conflicto de capacidad: 1,804 salientes simultáneamente.',
    'Cierre de jornada con pérdida elevada: 48.5% a las 19:00. El flujo real de pacientes supera el horario de cobertura humana también al cierre.',
    'Health Score 50/100 sin evaluación real: los cuatro componentes muestran exactamente 50 — valor por defecto sin calibración activa.',
    'Perfil de cuenta incompleto en el panel: sin fecha de inicio de contrato, contacto principal ni servicios capturados.',
  ],

  cronologia: [
    { fecha: 'Enero 2026',       responsable: 'Operación Dental District',   evento: '18.45 salientes/día · 4.97 entrantes/día. Operación arranca el año dentro del límite del plan (102% estimado).', tipo: 'neutral' },
    { fecha: 'Febrero 2026',     responsable: 'Christopher + Manuel + Jazmin', evento: 'Pico de volumen saliente: 24.18 llamadas/día. Mejor mes del equipo completo. Plan al 97% estimado.', tipo: 'ok' },
    { fecha: 'Marzo 2026',       responsable: 'Operación Dental District',   evento: '21.61 salientes/día. Plan al 98%. Volumen entrante crece a 5.16/día.', tipo: 'neutral' },
    { fecha: 'Abril 2026',       responsable: 'Operación Dental District',   evento: 'Primera caída notable: 15.07 salientes/día (−38% vs. pico). Plan al 77% — único mes con holgura real.', tipo: 'problema' },
    { fecha: '11 Mayo 2026',     responsable: 'Christopher',                  evento: 'Último registro de actividad de Christopher. Su salida elimina ~215 llamadas salientes que no son redistribuidas.', tipo: 'problema' },
    { fecha: 'Mayo 2026',        responsable: 'Operación Dental District',   evento: 'Mayor sobreconsumo del período: 1,329–1,347 minutos vs. plan 1,100 (21–22% excedente). Mayo 2026 es el único mes con evidencia clara de cargos adicionales.', tipo: 'problema' },
    { fecha: 'Junio 2026',       responsable: 'Manuel + Jazmin',              evento: '11.20 salientes/día (−54% vs. pico). Mejor mes en pérdida entrante: 16.8%. Plan al 84%.', tipo: 'neutral' },
    { fecha: 'Julio 2026',       responsable: 'Manuel + Jazmin',              evento: 'Corte al día 24: 6.33 salientes/día (−74% vs. pico). Mínimo histórico del período. Volumen entrante relativamente estable (5.75/día).', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Dental District' },
    { label: 'CID Zoho',             value: '162151' },
    { label: 'Sector',               value: 'Clínica dental · Zona fronteriza (Tijuana, LADA 664)' },
    { label: 'Plan contratado',      value: 'Bolsa de 1,100 minutos/mes compartidos' },
    { label: 'DIDs activos',         value: 'TDD/USA/4027 (número EE.UU.) · TDD/MEX/0024 (número México)' },
    { label: 'Tráfico transfronterizo', value: '86.9% entrantes y 94.7% salientes a EE.UU./Canadá' },
    { label: 'Equipo de atención',   value: 'Manuel Orantes · Jazmin Mendoza · Christopher (inactivo desde 11 mayo)' },
    { label: 'Período analizado',    value: '1 enero – 24 julio 2026 (205 días operativos)' },
  ],

  necesidad_negocio: 'Dental District necesita resolver dos ventanas de riesgo específicas (apertura 8:00–10:00 y cierre 19:00) y recuperar el volumen de seguimiento saliente perdido tras la salida de Christopher. Adicionalmente, requiere validar si mayo 2026 generó cargos por excedente de minutos y si el plan actual (1,100 min/mes) es suficiente para la operación real dado el perfil transfronterizo.',

  potencial_corto: [
    'Configurar IVR o Asistente de Voz para la ventana 8:00–10:00: recupera hasta ~45 llamadas/mes perdidas hoy en ese bloque.',
    'Validar con el cliente si mayo (y posiblemente enero–marzo) generaron cargos por excedente y presentar análisis como valor diferencial de Callpicker.',
    'Completar el perfil de cuenta: fecha de inicio, contacto principal, giro, servicios, MRR real.',
  ],
  potencial_largo: [
    'IA de Voz para absorber recordatorios/confirmaciones de citas: libera a Manuel y Jazmin de la dependencia de cobertura humana en horas pico y fuera de horario.',
    'Upgrade de plan a bolsa mayor o plan ilimitado si el análisis de consumo confirma sobreconsumo recurrente. Argumento: cliente ya paga excedentes sin visibilidad.',
    'Unificar el DID saliente (actualmente 90.6% del saliente sale por la línea USA) para reforzar identidad de marca ante el paciente transfronterizo.',
  ],

  tacticas: [
    {
      nombre:      'Activar cobertura temprana con IA de Voz (8:00–10:00)',
      descripcion: 'Configurar un flujo IVR o Asistente de Voz que capture y agende llamadas en la primera hora antes de que el equipo humano esté disponible. La pérdida de 91% en ese bloque es completamente evitable.',
      impacto:     'Recupera ~45 llamadas/mes en la ventana más crítica del día. Costo: configuración de flujo sin costo adicional de plan.',
    },
    {
      nombre:      'Análisis de consumo + propuesta de plan',
      descripcion: 'Presentar al cliente el análisis de minutos mes a mes: mayo en sobreconsumo 21–22%, enero–marzo al límite. Ofrecer upgrade de plan que elimine el riesgo de cargos inesperados.',
      impacto:     'Oportunidad de upsell con argumento de datos propios del cliente. El cliente probablemente no tiene visibilidad de este patrón.',
    },
    {
      nombre:      'Reactivar volumen saliente con protocolo estructurado',
      descripcion: 'Establecer con el cliente un objetivo diario de llamadas salientes por asesor para recuperar el ritmo pre-mayo (15–24/día). La caída no fue de demanda sino de cobertura interna.',
      impacto:     'Reducción del riesgo de inasistencias y citas no confirmadas. Mejora indirecta en la percepción de valor de la plataforma.',
    },
  ],

  senal_alarma: 'La salida de Christopher en mayo 2026 no fue absorbida por el equipo, y el volumen saliente cayó −74% sin reacción documentada ni intervención de KAM. El sobreconsumo de minutos en mayo operó sin visibilidad del cliente.',

  problema_raiz:        'Desfase entre horario de apertura declarado y cobertura real, combinado con pérdida de capacidad saliente no gestionada tras la salida de un asesor.',
  problema_raiz_detalle:'La operación efectiva comienza ~90 minutos después de que los pacientes llaman (brecha 8:00–10:00). La pérdida del 28% en entrantes no es pareja en todo el día — se concentra en ventanas acotadas y corregibles. Paralelamente, la salida de Christopher eliminó el 15–20% del volumen saliente del equipo; sin redistribución ni automatización, el seguimiento a pacientes se redujo a mínimos históricos. El plan de bolsa de minutos nunca fue ajustado al perfil real de tráfico transfronterizo de la cuenta.',

  flujo_real: [
    { fase: 'Apertura',       area: 'Cobertura humana',    accion: 'Pacientes llaman desde las 8:00 AM',              resultado: '100% de pérdida a las 8:00 · 91.1% a las 9:00. El equipo no está disponible.' },
    { fase: 'Operación',      area: 'Manuel + Jazmin',     accion: 'Cobertura efectiva arranca ~10:00 AM',             resultado: 'Pérdida cae a 35.3% a las 10:00 y mejora a 13.5% a las 13:00 (mejor hora del día).' },
    { fase: 'Seguimiento',    area: 'Equipo completo',     accion: 'Marcación saliente para confirmaciones y citas',   resultado: 'Pico saliente en 11:00–14:00 — misma franja que el mayor volumen entrante. Compiten por la misma capacidad.' },
    { fase: 'Post-mayo',      area: 'Manuel + Jazmin',     accion: 'Christopher sale el 11 de mayo. Sin reemplazo.',  resultado: 'Salientes caen de 24.2/día (feb) a 6.3/día (jul): −74%. Seguimiento a pacientes en mínimos históricos.' },
    { fase: 'Cierre',         area: 'Cobertura humana',    accion: 'Flujo de pacientes continúa hasta las 19:00+',    resultado: '48.5% de pérdida a las 19:00. El equipo cierra actividad antes de que pare la demanda.' },
  ],

  comparativo: [
    { metrica: 'Pérdida entrantes',          real: '28.0% (315 de 1,127)',          ideal: '<10% para clínica de salud' },
    { metrica: 'Pérdida en apertura 9:00',   real: '91.1% (41 de 45)',              ideal: '<20% — requiere cobertura o IVR' },
    { metrica: 'Volumen saliente jul vs. feb', real: '6.3/día vs. 24.2/día (−74%)', ideal: 'Mantener >15/día para agenda activa' },
    { metrica: 'Consumo plan mayo',          real: '1,329–1,347 min (122% del plan)', ideal: '≤100% del plan (1,100 min)' },
    { metrica: 'Pérdida saliente por asesor',real: 'Manuel 12.1% · Jazmin 11.8%',  ideal: '<10% — ambos asesores cerca del objetivo' },
  ],

  plan_inmediato: [
    { accion: 'Configurar IVR para ventana 8:00–10:00 que capture y agende llamadas antes de cobertura humana.', responsable: 'Claudia + Soporte/Ingeniería', criterio: 'Pérdida en bloque 8:00–9:59 cae por debajo del 30%.' },
    { accion: 'Validar con el cliente si mayo 2026 generó cargos por excedente (confirmar factura real). Presentar análisis de consumo mes a mes.', responsable: 'Claudia', criterio: 'Cliente confirma o descarta sobreconsumo documentado. Primer paso para propuesta de upgrade de plan.' },
    { accion: 'Completar perfil de cuenta en el panel: fecha de inicio, contacto principal, giro, servicios, MRR real.', responsable: 'Claudia', criterio: 'Perfil 100% completo. Health Score recalibrado con evaluación real (no valores de 50 por defecto).' },
  ],
  plan_mediano: [
    { accion: 'Proponer upgrade de plan a bolsa mayor o plan sin límite de minutos. Argumento: tráfico transfronterizo crónico lleva la cuenta al límite mensual.', responsable: 'Claudia', criterio: 'Cliente aprueba ajuste de plan. Sobreconsumo eliminado.' },
    { accion: 'Establecer protocolo diario de salientes por asesor (objetivo: recuperar >15 llamadas/día). Investigar posibilidad de contratar cobertura de reemplazo.', responsable: 'Claudia + cliente', criterio: 'Volumen saliente vuelve a >15/día sostenido por 30 días.' },
    { accion: 'Resolver pérdida en cierre de jornada (19:00): extender cobertura humana 30 minutos o activar IVR de buzón estructurado para el bloque 19:00–20:00.', responsable: 'Claudia + Ingeniería', criterio: 'Pérdida a las 19:00 baja de 48.5% a <25%.' },
  ],
  plan_estrategico: [
    { accion: 'Implementar IA de Voz para confirmaciones y recordatorios de citas — libera a Manuel y Jazmin de la dependencia de cobertura humana en horarios críticos.', responsable: 'Claudia + UX/Producto', criterio: 'Adopción verificada. Reducción de pérdida entrante global por debajo del 15%.' },
    { accion: 'Unificar DID saliente: el 90.6% del saliente ya sale por la línea USA — consolidar para reforzar identidad de marca ante clientela transfronteriza.', responsable: 'Ingeniería + cliente', criterio: 'Un solo número de salida. Mejora en tasa de contestación (el destinatario reconoce el número).' },
  ],

  areas_oportunidad: [
    { area: 'Automatización apertura',  impacto: '~45 llamadas/mes recuperadas en bloque 8:00–10:00',           responsable: 'Ingeniería + Claudia' },
    { area: 'Upgrade plan minutos',     impacto: 'Elimina sobreconsumo y riesgo de cargos inesperados',          responsable: 'Claudia (upsell)' },
    { area: 'Recuperación salientes',   impacto: 'Regreso a 15–24 llamadas/día: agenda de pacientes más activa', responsable: 'Claudia + cliente' },
    { area: 'IA de Voz',               impacto: 'Escalabilidad sin dependencia de cobertura humana',             responsable: 'Producto + Claudia' },
  ],

  perfiles: [
    {
      nombre: 'Manuel Orantes',
      rol:    'Asesor principal · Mayor volumen saliente',
      color:  '#3b82f6',
      campos: [
        { label: 'Entrantes recibidas',  value: '380' },
        { label: 'Pérdida entrantes',    value: '34.2% (130 perdidas)' },
        { label: 'Salientes generadas',  value: '1,804' },
        { label: 'Pérdida salientes',    value: '12.1%' },
        { label: 'Nota',                 value: 'Mayor volumen saliente del equipo. La carga simultánea puede explicar su mayor pérdida en entrantes.' },
      ],
    },
    {
      nombre: 'Jazmin Mendoza',
      rol:    'Asesora principal · Mayor volumen de recepción',
      color:  '#8b5cf6',
      campos: [
        { label: 'Entrantes recibidas',  value: '742 (mayor volumen)' },
        { label: 'Pérdida entrantes',    value: '24.8%' },
        { label: 'Salientes generadas',  value: '1,428' },
        { label: 'Pérdida salientes',    value: '11.8%' },
        { label: 'Nota',                 value: 'Mejor tasa de pérdida entrante. Distribución más equilibrada entre recepción y salida.' },
      ],
    },
    {
      nombre: 'Christopher',
      rol:    'Asesor saliente (inactivo desde 11 mayo)',
      color:  '#6b7280',
      campos: [
        { label: 'Entrantes recibidas',  value: '0' },
        { label: 'Salientes generadas',  value: '215 (13 ene – 11 may)' },
        { label: 'Pérdida salientes',    value: '24.7% (doble que sus compañeros)' },
        { label: 'Última actividad',     value: '11 de mayo de 2026' },
        { label: 'Impacto de su salida', value: 'Volumen saliente total cae −74% sin redistribución.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Tasa de contestación saliente alta y estable: 87.2%.',
      'Dos asesores con permanencia estable durante todo el período (Manuel y Jazmin).',
      'Cobertura parcial de fin de semana (sábado): 80 entrantes + 201 salientes.',
      'Mejora visible en pérdida entrante en junio–julio vs. primer semestre.',
    ],
    oportunidades: [
      'Corregir brecha de apertura 8:00–10:00 con IVR o IA de Voz — problema acotado y corregible.',
      'Recuperar volumen saliente perdido desde mayo: oportunidad de seguimiento a agenda de pacientes.',
      'Upsell de plan por sobreconsumo documentado: argumento basado en datos propios del cliente.',
      'IA de Voz para escalar cobertura sin depender de capacidad humana en horas pico.',
    ],
    debilidades: [
      'Pérdida entrante de 28.0% — alta para servicios de salud donde cada llamada es una cita potencial.',
      'Sin cobertura efectiva 8:00–10:00: 91–100% de pérdida en la primera hora.',
      'Dependencia de dos asesores sin plan de contingencia tras la salida de Christopher.',
      'Perfil de cuenta incompleto y Health Score sin calibración real (50/100 por defecto).',
    ],
    amenazas: [
      'Cada llamada perdida en apertura es probable agenda llenada por otro proveedor dental de la zona.',
      'La caída de seguimiento saliente incrementa riesgo de inasistencias y cancelaciones tardías.',
      'Sobreconsumo mensual no visible para el cliente puede generar sorpresas en factura.',
    ],
  },

  conclusion: 'Dental District tiene una operación con estructura sólida (dos asesores estables, plan definido, operación mixta activa), pero con dos vulnerabilidades muy concretas y corregibles: la brecha de apertura (8:00–10:00) y la caída del volumen saliente tras la salida de Christopher. La tasa de pérdida del 28% en entrantes no es consecuencia de una operación deficiente en general — es consecuencia de un problema de horario muy específico que ocurre antes de que el equipo esté disponible. Ambos problemas tienen solución de bajo costo relativo. La cuenta también presenta una oportunidad de upsell clara: el análisis de consumo de minutos demuestra que opera al límite o por encima del plan en 4 de los 6 meses completos analizados.',

  pierde: [
    'Agendar y confirmar citas de pacientes que llaman en la primera hora del día.',
    'Seguimiento activo a pacientes desde mayo 2026 (−74% de volumen saliente).',
    'Visibilidad sobre sobreconsumo: el cliente probablemente no sabe que mayo excedió su plan 21–22%.',
  ],
  gana: [
    'Cobertura de apertura con IVR de bajo costo: recupera hasta 45 llamadas/mes perdidas hoy.',
    'Propuesta de upgrade de plan fundamentada en datos reales del cliente.',
    'Gestión activa de la caída saliente: impacto directo en la agenda de la clínica.',
  ],
  recomendacion_central: 'Implementar cobertura de apertura automatizada (IVR o IA de Voz) para el bloque 8:00–10:00 y presentar análisis de consumo de minutos al cliente como base para un upgrade de plan — ambas acciones generan valor inmediato y posicionan a Callpicker como asesor estratégico, no solo proveedor de minutos.',
}
