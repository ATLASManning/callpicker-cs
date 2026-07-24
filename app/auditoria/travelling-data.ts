import type { AuditoriaCase } from './types'

export const TRAVELLING: AuditoriaCase = {
  id:                    'travelling',
  asesor:                'Claudia',
  nombre:                'Travelling (Grupo Mundo Joven)',
  sector:                'Agencias de Viajes / Travel Arrangements',
  fecha_periodo:         'Enero – Julio 2026',
  fecha_auditoria:       'Jul 2026',
  tipo_cliente:          'Mediana · 43 oficinas (22 propias, 21 franquicias)',
  descripcion_contexto:  'Grupo Mundo Joven · CID 176205 · Visibilidad y Control Callcenter · Asesora: Claudia Hernández',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Pérdida saliente promedio (7 meses)', value: '54.5%',    color: '#ef4444' },
    { label: 'Caída de volumen Ene → Jun/Jul',      value: '−98.7%',   color: '#ef4444' },
    { label: 'MRR actual',                          value: '$14,655',  color: '#6366f1' },
    { label: 'Health Score CRM',                    value: '53 / 100', color: '#f59e0b' },
  ],

  resumen_ejecutivo:
    'Travelling opera con un modelo fuertemente orientado a la llamada saliente: por cada llamada entrante genera ~15 salientes. ' +
    'El hallazgo más grave es estructural: 54.5% de las 4,439 llamadas salientes registradas entre enero y julio de 2026 se perdieron (Lost), y esa tasa se mantuvo prácticamente constante — entre 47.8% y 58.5% — durante los siete meses, independientemente del volumen. ' +
    'Esto descarta la hipótesis de "sobrecarga operativa": incluso a 23 llamadas en junio (un mes completo), la mitad se pierde. La causa raíz es de calidad de base de datos, horario de marcación y/o script.\n\n' +
    'El segundo hallazgo crítico es de concentración de riesgo: una sola asesora (Dulce Estephanya Juárez Pérez) generó el 25.4% de todo el volumen saliente del semestre con 82.4% de pérdida. ' +
    'Travelling Puebla concentra el 35% del volumen saliente con 73.0% de pérdida — el cuello de botella más costoso de la cuenta.\n\n' +
    'El tercer hallazgo conecta con la nota KAM del 23-jul: el volumen saliente colapsó de 1,807 llamadas en enero a 23 en junio y 23 en julio (−98.7%). ' +
    'El equipo activo actual se reduce en la práctica a dos personas: Omar de Jesús Tegoma Aguilar y Haniel Domínguez Ríos, que juntos sostienen el 73% de toda la actividad saliente reciente.',

  resultado_positivo:
    'IVR de autoservicio funcional: 43.7% de las llamadas entrantes se resuelve sin necesidad de un asesor. ' +
    'Travelling Monterrey demuestra que 18.5% de pérdida saliente es alcanzable dentro de la misma operación (benchmark interno). ' +
    'Francisco González combina alto volumen con la mejor tasa de contacto del equipo: 83.4% de éxito. ' +
    'Omar de Jesús Tegoma Aguilar mejoró su tasa de pérdida individual de 44.3% (ene–abr) a 24.2% (may–jul) en el período más difícil.',

  hallazgos: [
    'Pérdida saliente estructural del 54.5%: se mantiene estable entre 47.8% y 58.5% durante 7 meses sin importar el volumen. No es sobrecarga — es un problema de base de contactos, horario o script.',
    'Dulce Estephanya Juárez Pérez: 25.4% de todo el volumen saliente del semestre con 82.4% de pérdida — casi el doble del promedio de la cuenta. Si convergiera al promedio, se recuperarían ~300 contactos adicionales sin llamadas extra.',
    'Travelling Puebla: 35% del volumen saliente total con 73.0% de pérdida — mayor volumen y peor desempeño simultáneamente.',
    'Colapso de actividad: de 1,807 llamadas salientes en enero a 23 en junio (−98.7%), correlacionado con la reducción de personal reportada por el cliente (liquidaciones, IMSS/Infonavit).',
    'Concentración extrema: solo Omar Tegoma y Haniel Domínguez sostienen el 73% de la actividad saliente de mayo–julio. Una ausencia puede llevar la operación a cero.',
    'Franja 18:00 h: 510 llamadas (2° volumen horario más alto) con 72.4% de pérdida — posible efecto de "marcación por inercia" al cierre de turno.',
    'Sábado: 482 llamadas con 69.7% de pérdida — el peor día operativo con volumen relevante.',
    '213 llamadas registradas bajo extensiones "Vacante" / "VACANTE SLP" / "VacanteXLP" — higiene de datos deficiente, coherente con "Uso del Panel Administrador: Bajo" en CRM.',
    'Entrantes: 26.6% de quienes llaman no logra ni autoservicio ni contacto humano (Lost + Voicemail combinados).',
    'Health Score 53/100: componente Actividad 33/100 (35% del peso total) — el más débil y el que más impacta el score general. Los datos de tráfico confirman esta calibración.',
  ],

  cronologia: [
    { fecha: 'Oct 2025',    responsable: 'Callpicker',          evento: 'Alta de cuenta — servicio Visibilidad y Control Callcenter. Contacto: Guillermo Ataxca (Consultor Independiente).', tipo: 'ok' },
    { fecha: 'Ene 2026',    responsable: 'Travelling',          evento: 'Operación a plena capacidad: 1,807 llamadas salientes. Tasa de pérdida: 55.0% desde el primer mes — señal de problema estructural desde el inicio.', tipo: 'problema' },
    { fecha: 'Ene–Mar 2026',responsable: 'Plataforma / KAM',    evento: 'Volumen alto mantenido (1,807 → 1,330 → 704 llamadas). Tasa de pérdida oscila entre 52–58.5% — sin acciones correctivas documentadas.', tipo: 'neutral' },
    { fecha: 'Abr–May 2026',responsable: 'Travelling',          evento: 'Inicio del colapso de personal: liquidaciones y ajuste presupuestal obligan a reducción significativa de colaboradores. Volumen cae de 438 (abril) a 114 (mayo).', tipo: 'problema' },
    { fecha: 'Jun 2026',    responsable: 'Travelling',          evento: 'Volumen saliente en mínimo histórico: 23 llamadas en el mes completo (−98.7% vs. enero). Solo Omar Tegoma y Haniel Domínguez activos.', tipo: 'problema' },
    { fecha: '23 Jul 2026', responsable: 'Claudia Hernández',   evento: 'Nota KAM: cliente reporta dificultades de pago y contexto de reducción de personal. Claudia inicia análisis de consumo para evaluar ajuste de plan.', tipo: 'pivote' },
    { fecha: '23 Jul 2026', responsable: 'Callpicker / ATLAS',  evento: 'Emisión de auditoría forense (4,439 salientes + 293 entrantes analizados). Los datos de tráfico confirman y cuantifican la narrativa del cliente.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'Travelling / Grupo Mundo Joven' },
    { label: 'CID Zoho',           value: '176205' },
    { label: 'Sector',              value: 'Travel Arrangements / Agencia de viajes' },
    { label: 'Tamaño',             value: 'Mediana · 43 oficinas (22 propias, 21 franquicias)' },
    { label: 'Cliente desde',       value: 'Octubre 2025 (~295 días)' },
    { label: 'Servicio contratado', value: 'Visibilidad y Control Callcenter' },
    { label: 'Contacto principal',  value: 'Guillermo Ataxca — Consultor Independiente' },
    { label: 'Asesora de cuenta',   value: 'Claudia Hernández' },
    { label: 'MRR actual',         value: '$14,655 MXN' },
    { label: 'Tickets Zoho Desk',   value: '20 totales · 1 falla real — bajo nivel de incidencias técnicas' },
    { label: 'Situación financiera',value: 'Dificultades de pago: liquidaciones y obligaciones IMSS/Infonavit por reducción de personal' },
  ],

  necesidad_negocio:
    'Travelling necesita recuperar su capacidad de prospección saliente de forma eficiente y sostenible. ' +
    'Con solo 2 personas activas y una tasa de pérdida del 54.5%, cada llamada tiene menos probabilidad de éxito que cara en un volado. ' +
    'La solución no es simplemente más volumen — es mejorar la calidad de la base de contactos, el horario de marcación y la formación del equipo antes de escalar de nuevo.',

  potencial_corto: [
    'Redistribuir carga de Puebla (73.0% pérdida) hacia Monterrey (18.5% pérdida) mientras se investiga la causa de la brecha.',
    'Documentar el método de Francisco González (83.4% de éxito) y usar a Monterrey como benchmark interno para reentrenar al equipo.',
    'Revisar la operación en la franja 17:00–19:00 h — especialmente 18:00 h con 72.4% de pérdida.',
    'Limpiar extensiones "Vacante" en el panel administrador antes de escalar de nuevo.',
  ],

  potencial_largo: [
    'Ajuste de plan consistente con el consumo real: el plan actual fue diseñado para una operación de ~1,800 llamadas/mes — la realidad actual es 23/mes.',
    'Implementar revisión mensual de tasa de pérdida saliente como KPI central (no solo volumen) — para detectar deterioro antes de que se acumule.',
    'Aprovechar adopción de Callpicker Chat (marcada como "Alto" en CRM) para dar seguimiento asíncrono a prospectos no contactados por voz.',
  ],

  tacticas: [
    {
      nombre:      'Presentar hallazgo Puebla + Dulce al cliente',
      descripcion: 'Mostrar el contraste Puebla (73% pérdida, 35% del volumen) vs. Monterrey (18.5% pérdida) como ejemplo de lo que es alcanzable dentro de su propia operación.',
      impacto:     'Alto — el cliente ve una solución inmediata sin inversión adicional.',
    },
    {
      nombre:      'Cerrar análisis de ajuste de plan',
      descripcion: 'Incorporar los datos de auditoría: el ajuste de plan resuelve el problema de consumo, no el de conversión. Ambas conversaciones deben ir juntas.',
      impacto:     'Alto — alinea el MRR a la realidad operativa y reduce el riesgo de cancelación por presión financiera.',
    },
    {
      nombre:      'Plan de contingencia de personal',
      descripcion: 'Con 2 personas sosteniendo el 73% de la actividad, proponer al cliente un plan mínimo de respaldo para evitar que la operación caiga a cero.',
      impacto:     'Medio — protege el LTV de la cuenta ante cualquier nueva baja de personal.',
    },
  ],

  senal_alarma:
    'Health Score 53/100 con Actividad en 33/100 y dificultades financieras reportadas: la cuenta está en zona de churn. ' +
    'Si el ajuste de plan no se cierra pronto y la tasa de pérdida no mejora, el cliente puede optar por cancelar el servicio en lugar de renegociar.',

  problema_raiz:        'Tasa de pérdida saliente estructural independiente del volumen',
  problema_raiz_detalle:
    'La hipótesis inicial de "sobrecarga operativa" queda descartada por los datos: incluso a 23 llamadas en un mes completo (junio), la tasa de pérdida es 52.2%. ' +
    'Esto indica que el problema está en el proceso de marcación — base de contactos desactualizada, horarios incorrectos o scripts con baja tasa de contacto — no en la capacidad operativa del equipo. ' +
    'Adicionalmente, la concentración de volumen y pérdida en Puebla y en Dulce Estephanya sugiere que hay factores locales (gestión de la sucursal, formación individual) que multiplican el problema base.',

  flujo_real: [
    { fase: 'Marcación saliente',  area: 'Toda la operación',      accion: 'Asesor marca desde extensión asignada', resultado: '54.5% termina como Lost — sin conversación' },
    { fase: 'Sucursal Puebla',     area: 'Travelling Puebla',      accion: '35% del volumen total marcado desde Puebla', resultado: '73.0% de pérdida — el cuello de botella más costoso' },
    { fase: 'Asesora Dulce',       area: 'Extensión individual',   accion: '25.4% del volumen semestral concentrado en 1 asesora', resultado: '82.4% de pérdida — ~4× peor que Francisco González' },
    { fase: 'Franja 18:00 h',     area: 'Cierre de turno',        accion: '510 llamadas en la segunda franja de mayor volumen', resultado: '72.4% de pérdida — posible inercia de fin de jornada' },
    { fase: 'Equipo activo May–Jul',area: 'Omar + Haniel',         accion: 'Solo 2 personas sostienen el 73% de la actividad reciente', resultado: 'Omar mejora a 24.2% de pérdida · Haniel en 56.9%' },
    { fase: 'Canal entrante',      area: 'IVR + Agentes',         accion: 'Paciente / prospecto llama a Travelling', resultado: '43.7% resuelta por autoservicio · 23.9% Lost · 29.7% transferida a asesor' },
  ],

  comparativo: [
    { metrica: 'Pérdida saliente general',            real: '54.5% (7 meses constante)',   ideal: '< 25% (benchmark Monterrey: 18.5%)' },
    { metrica: 'Pérdida Dulce Estephanya',            real: '82.4%',                        ideal: '< 40% (promedio cuenta)' },
    { metrica: 'Pérdida Travelling Puebla',           real: '73.0%',                        ideal: '< 30% (benchmark Monterrey)' },
    { metrica: 'Pérdida franja 18:00 h',             real: '72.4%',                        ideal: '< 55% (promedio horario diurno)' },
    { metrica: 'Pérdida entrantes (no atendidas)',    real: '26.6% (Lost + Voicemail)',     ideal: '< 10%' },
    { metrica: 'Actividad saliente Jun 2026 vs Ene', real: '23 llamadas (−98.7%)',         ideal: 'Operación sostenida mínima ~200/mes' },
    { metrica: 'Health Score — Actividad',           real: '33 / 100',                     ideal: '> 60' },
  ],

  plan_inmediato: [
    { accion: 'Presentar al cliente el hallazgo Puebla + Dulce E. Juárez como el punto de mayor apalancamiento', responsable: 'Claudia Hernández', criterio: 'Sesión con Guillermo Ataxca antes del 1 Ago 2026' },
    { accion: 'Confirmar estatus de extensiones "Vacante", "VACANTE SLP" y "VacanteXLP": ¿puestos por cubrir o error de configuración?', responsable: 'Claudia Hernández + cliente', criterio: 'Respuesta documentada del cliente' },
    { accion: 'Validar con equipo técnico Callpicker la definición exacta de "Lost" vs. "Redirected" en reporte saliente para usar definición oficial con el cliente', responsable: 'Equipo técnico Callpicker', criterio: 'Confirmación documentada antes de siguiente reunión' },
  ],

  plan_mediano: [
    { accion: 'Documentar el método de Francisco González y de sucursal Monterrey para usarlo como referencia de entrenamiento', responsable: 'Claudia Hernández + cliente', criterio: 'Guía de mejores prácticas documentada y compartida con el equipo' },
    { accion: 'Revisar operación de la franja 17:00–19:00 h: ¿hay causa operativa identificable para la caída de desempeño en cierre de turno?', responsable: 'Cliente (ops) + Callpicker', criterio: 'Cambio de protocolo en franja 18:00 h implementado' },
    { accion: 'Cerrar análisis de ajuste de plan incorporando que el ajuste resuelve el consumo, no la conversión — ambas conversaciones van juntas', responsable: 'Claudia Hernández + Comercial', criterio: 'Acuerdo firmado antes del 15 Ago 2026' },
  ],

  plan_estrategico: [
    { accion: 'Proponer plan de contingencia de personal: con solo 2 personas activas, cualquier ausencia paraliza la operación saliente', responsable: 'Claudia Hernández + Guillermo Ataxca', criterio: 'Plan de respaldo mínimo documentado' },
    { accion: 'Monitorear mensualmente la tasa de pérdida saliente como KPI central — no solo el volumen', responsable: 'Claudia Hernández', criterio: 'Dashboard de tasa de pérdida actualizado en cada ciclo KAM' },
    { accion: 'Capitalizar adopción de Callpicker Chat (marcada como "Alto") para seguimiento asíncrono de prospectos no contactados por voz', responsable: 'Claudia Hernández + Comercial', criterio: 'Propuesta de uso de Chat enviada al cliente' },
  ],

  areas_oportunidad: [
    { area: 'Redistribución de carga Puebla → Monterrey',   impacto: 'Alto — recupera ~300+ contactos sin llamadas adicionales', responsable: 'Cliente (ops) + Claudia' },
    { area: 'Formación basada en benchmark Francisco González', impacto: 'Alto — si la brecha de Dulce se cierra al promedio, la cuenta recupera eficiencia sin más personal', responsable: 'Cliente (ops)' },
    { area: 'Ajuste de plan a consumo real',                 impacto: 'Alto — reduce riesgo de cancelación por presión financiera', responsable: 'Claudia Hernández' },
    { area: 'Revisión horario de marcación (18:00 h)',       impacto: 'Medio — 72.4% de pérdida en segunda franja de mayor volumen es corregible con protocolo', responsable: 'Cliente (ops)' },
    { area: 'Callpicker Chat para seguimiento asíncrono',    impacto: 'Medio — reduce dependencia de saliente voz y da cobertura cuando el equipo es mínimo', responsable: 'KAM + Comercial' },
  ],

  perfiles: [
    {
      nombre: 'Guillermo Ataxca',
      rol:    'Contacto principal — Consultor Independiente',
      color:  '#2563eb',
      campos: [
        { label: 'Rol',                value: 'Consultor Independiente (no empleado directo de Travelling)' },
        { label: 'Interlocutor',       value: 'Único contacto registrado en CRM de la cuenta' },
        { label: 'Relevancia',         value: 'Receptor del análisis de consumo y ajuste de plan que gestiona Claudia' },
      ],
    },
    {
      nombre: 'Dulce Estephanya Juárez Pérez',
      rol:    'Asesora — mayor volumen y peor desempeño del equipo',
      color:  '#ef4444',
      campos: [
        { label: 'Volumen semestral',  value: '1,126 llamadas (25.4% del total de la cuenta)' },
        { label: 'Tasa de pérdida',   value: '82.4% — casi duplica el promedio de la cuenta' },
        { label: 'Status May–Jul',    value: 'Prácticamente inactiva (15 llamadas en el período)' },
        { label: 'Acción',            value: 'Investigar causa de la brecha: base de contactos, guion o formación' },
      ],
    },
    {
      nombre: 'Francisco González',
      rol:    'Asesora — benchmark interno de mejor desempeño',
      color:  '#22c55e',
      campos: [
        { label: 'Volumen semestral',  value: '356 llamadas (4° lugar en volumen)' },
        { label: 'Tasa de contacto',  value: '83.4% de éxito — la mejor del equipo' },
        { label: 'Status May–Jul',    value: 'Sin actividad registrada en el período reciente' },
        { label: 'Oportunidad',       value: 'Documentar y replicar su método de trabajo en el resto del equipo' },
      ],
    },
    {
      nombre: 'Omar de Jesús Tegoma Aguilar',
      rol:    'Asesora — sostiene la operación actual con mejora progresiva',
      color:  '#7c3aed',
      campos: [
        { label: 'Volumen May–Jul',   value: '66 llamadas (73% de la actividad reciente junto a Haniel)' },
        { label: 'Tasa pérdida Ene–Abr', value: '44.3%' },
        { label: 'Tasa pérdida May–Jul', value: '24.2% — mejora notable en el período más difícil' },
        { label: 'Oportunidad',       value: 'Investigar qué cambió en su método y replicarlo' },
      ],
    },
    {
      nombre: 'Claudia Hernández',
      rol:    'Asesora de cuenta Callpicker',
      color:  '#0891b2',
      campos: [
        { label: 'Gestión activa',    value: 'Análisis de consumo en curso para ajuste de plan' },
        { label: 'Nota KAM 23-Jul',   value: 'Documentó contexto de reducción de personal y dificultades financieras' },
        { label: 'Acción inmediata',  value: 'Presentar hallazgos y cerrar ajuste de plan en una sola conversación' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'IVR de autoservicio funcional: 43.7% de llamadas entrantes resueltas sin asesor.',
      'Travelling Monterrey: 18.5% de pérdida saliente con volumen comparable — benchmark interno demostrado.',
      'Francisco González: 83.4% de tasa de contacto con alto volumen — el mejor desempeño individual del equipo.',
      'Pago (90/100 en Health Score): los atrasos se han resuelto sin impago sostenido hasta la fecha.',
      'Bajo nivel de incidencias técnicas reales (1 falla de 20 tickets Zoho Desk).',
      'Omar Tegoma: mejoró de 44.3% a 24.2% de pérdida en el período más difícil — dato de resiliencia.',
    ],
    oportunidades: [
      'Redistribuir carga de Puebla y de Dulce hacia Monterrey y Francisco González mientras se reorganiza el equipo.',
      'Usar la ventana de bajo volumen para limpiar extensiones vacantes y reentrenar antes de escalar.',
      'Reforzar cobertura en franja 17:00–19:00 h — especialmente 18:00 h con 72.4% de pérdida.',
      'Callpicker Chat para seguimiento asíncrono de prospectos no contactados por voz (adopción "Alto" en CRM).',
      'El ajuste de plan que Claudia evalúa es consistente con la caída real de consumo — hay espacio legítimo para renegociar.',
    ],
    debilidades: [
      'Pérdida saliente estructural del 54.5%, estable en 7 meses sin importar el volumen.',
      '25.4% del volumen concentrado en una asesora con 82.4% de pérdida.',
      'Colapso de actividad: −98.7% de volumen saliente entre enero y junio/julio.',
      'Puebla: mayor volumen (35%) y peor desempeño (73.0%) al mismo tiempo.',
      'Franja 18:00 h: 72.4% de pérdida en la segunda franja de mayor volumen del día.',
      'Actividad 33/100 en Health Score — el componente de mayor peso (35%) y el más débil.',
      '213 llamadas bajo extensiones "Vacante" — higiene de datos deficiente.',
      'Dependencia crítica en 2 personas para sostener el 73% de la actividad reciente.',
    ],
    amenazas: [
      'Riesgo de mayor impago o cancelación si persisten las dificultades financieras (liquidaciones, IMSS/Infonavit).',
      'Con solo 2 personas activas, cualquier ausencia adicional puede llevar la operación saliente a cero.',
      'Health Score 53/100 sostenido es zona de alerta de churn, especialmente con Actividad en 33/100.',
      'Si el consumo sigue cayendo sin mejorar la tasa de conversión, el ajuste de plan solo administrará el declive, no lo revertirá.',
    ],
  },

  conclusion:
    'Travelling está en una encrucijada: el colapso de personal es un hecho documentado, no una percepción, y los datos de tráfico lo confirman con exactitud (−98.7% de volumen saliente). ' +
    'Sin embargo, la tasa de pérdida del 54.5% es independiente del volumen — existía desde el primer mes y persiste hoy con 23 llamadas mensuales. ' +
    'El ajuste de plan que Claudia está negociando resuelve el problema financiero de corto plazo, pero no el operativo. ' +
    'Ambas conversaciones deben cerrarse juntas: si el cliente reduce el plan sin mejorar la tasa de conversión, el LTV de la cuenta seguirá deteriorándose.',

  pierde: [
    '~2,418 contactos salientes fallidos en el semestre — prospectos o clientes que no recibieron llamada.',
    'LTV a largo plazo si la tasa de pérdida no se corrige antes de que la operación escale de nuevo.',
    'Confianza del cliente si el ajuste de plan se presenta sin el diagnóstico operativo — puede percibirse como gestión solo del cobro, no de su problema real.',
  ],

  gana: [
    'Credibilidad de Callpicker como partner estratégico al presentar un análisis forense que el cliente no tenía capacidad de generar por sí mismo.',
    'Apertura para una conversación ampliada: ajuste de plan + mejora operativa + Callpicker Chat en una sola reunión.',
    'Reducción del riesgo de churn si el ajuste de plan y el diagnóstico operativo se cierran de forma integrada.',
    'Caso de éxito interno (Omar Tegoma: 44.3% → 24.2% de pérdida) como argumento de que la mejora es posible dentro de la misma operación.',
  ],

  recomendacion_central:
    'Cerrar el análisis de ajuste de plan incorporando el diagnóstico operativo de esta auditoría en una sola conversación con el cliente. ' +
    'El punto de entrada es el hallazgo de Puebla vs. Monterrey: muestra que el problema tiene solución interna, sin inversión adicional, y posiciona a Callpicker como el único actor que tenía estos datos.',
}
