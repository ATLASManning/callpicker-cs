import type { AuditoriaCase } from './types'

export const ALIANZA: AuditoriaCase = {
  id: 'alianza',
  nombre: 'Alianza Multimarca',
  sector: 'Sector Financiero · Seguros y Servicios',
  fecha_periodo: 'Enero – Junio 2026',
  fecha_auditoria: 'Jun 2026',
  tipo_cliente: 'Cuenta Enterprise · 38 sucursales · CID 149651',
  descripcion_contexto: '85,381 llamadas analizadas · Asesor: Dan · Contacto: Mario López · Auditoría de comunicaciones H1 2026',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Abandono entrante',   value: '60.5% (32,043)',  color: '#ef4444' },
    { label: 'Abandono 9:00 AM',    value: '91.4% crítico',   color: '#dc2626' },
    { label: 'CP Chat contratado',  value: '20 agentes / 0 uso', color: '#f59e0b' },
    { label: 'Total llamadas H1',   value: '85,381 registros', color: '#6366f1' },
  ],

  resumen_ejecutivo: 'Alianza Multimarca genera 85,381 registros de llamadas en el primer semestre 2026, con una tasa de abandono entrante del 60.5%: 6 de cada 10 clientes que llaman no son atendidos. Este nivel de deserción operativa se mantiene durante 6 meses consecutivos y representa una fuga estructural de demanda.\n\nEl hallazgo más grave es el colapso de apertura: a las 9:00 AM el abandono llega al 91.4% (2,184 llamadas — solo 188 atendidas). El problema no es técnico: la plataforma registra y enruta correctamente. El origen está en la capacidad de respuesta y en la configuración de horarios y grupos de atención.\n\nAdicional y urgente: Alianza paga 20 agentes de CP Chat con uso registrado prácticamente nulo — riesgo activo de cancelación si el cliente percibe que no obtiene valor del servicio.',

  resultado_positivo: 'La operación saliente muestra solidez relativa: 68.4% de contacto con 3.9 minutos promedio por llamada exitosa. Cuatro agentes TOP superan el 73% de efectividad (Marisol Gaitán 77%, Eduardo Vega 78.4%, Edgar García 74.6%, Liceth Rubio 73.4%), lo que demuestra que el estándar de desempeño excelente es alcanzable dentro del mismo equipo.\n\nEl autoservicio IVR funciona con 4,160 interacciones (7.9% del entrante) — base sólida para escalar como canal de desbordamiento en horas pico.',

  hallazgos: [
    '60.5% de abandono entrante sostenido durante 6 meses consecutivos — 32,043 clientes sin atención en H1 2026.',
    'Colapso de apertura 9:00 AM: 91.4% de abandono (2,184 llamadas, solo 188 atendidas). Los agentes no están logueados al inicio del turno o el IVR tiene flujo demasiado largo.',
    'Lunes es el día más crítico: mayor volumen (12,234 llamadas) + 65.3% de abandono. Demanda del fin de semana se acumula y desborda el lunes sin cobertura reforzada.',
    'CP Chat pagado sin uso operativo real: 20 agentes contratados, uso calificado como "Bajo" en revisión del 15 de mayo. Riesgo activo de cancelación.',
    'Caída del 56% en volumen saliente: de 7,259 llamadas en enero a 3,176 en junio. Tendencia lineal sin explicación documentada — requiere validación con Mario López.',
    '45.4% de llamadas salientes "exitosas" duran menos de 1 minuto — posible sobreestimación del 68.4% de contacto real. La tasa productiva real (5+ min) sería ~26.4%.',
    'Vanessa Medina: 6,476 llamadas entrantes con 24% de atención — responsable del 15.4% del abandono global del semestre. Probable cola sin suficientes agentes asignados.',
    'Extensiones "Disp.ATC / Fuera Horario": 1,296 llamadas con ~0% de atención. Tráfico real dirigido a colas no configuradas.',
    'Domingo sin cobertura efectiva: 86.5% de abandono (564 llamadas). IVR no informa horarios ni ofrece alternativas — cliente abandona tras 89 segundos de espera.',
    '45% de llamadas salientes duran menos de 1 minuto — buzones automáticos y cuelgues inflan el indicador de contacto.',
    'Voicemail sin protocolo: 603 registros en 6 meses, sin respuesta estructurada. Canal de rescate desaprovechado con 32,043 llamadas perdidas de fondo.',
    'Franja 14:00–15:00h: 73.3% y 66.6% de abandono post-comida — regreso incompleto de turno sin cobertura de transición.',
  ],

  cronologia: [
    { fecha: 'Ene 2026',  responsable: 'Operación / Dan',    evento: 'Enero pico máximo: 11,584 entrantes, 64.1% abandono. Volumen más alto del semestre con peor tasa de atención — la infraestructura no escala con la demanda.', tipo: 'problema' },
    { fecha: 'Ene 2026',  responsable: 'Área de Chat',       evento: 'CP Chat con uso nulo desde el primer mes del período analizado. 20 agentes contratados sin activación operativa.', tipo: 'problema' },
    { fecha: 'Feb 2026',  responsable: 'Operación',          evento: 'Abandono mejora a 57.3% — única reducción mensual significativa. Volumen cae a 8,829 entrantes. Mejora correlacionada con menor demanda, no con mejora operativa.', tipo: 'neutral' },
    { fecha: 'Mar 2026',  responsable: 'Operación',          evento: 'Abandono regresa a 63.8% con 9,739 entrantes. La mejora de febrero no sostenida — confirma que no hubo intervención estructural.', tipo: 'problema' },
    { fecha: '15 May 2026', responsable: 'Equipo Callpicker', evento: 'Revisión interna detecta uso "Bajo" de CP Chat. Problema identificado internamente — no comunicado formalmente al cliente.', tipo: 'problema' },
    { fecha: 'May 2026',  responsable: 'Operación',          evento: 'Mayo: 4,735 llamadas salientes — primera caída notable vs enero (7,259). Abandono saliente 34.7% — tendencia ascendente confirmada.', tipo: 'problema' },
    { fecha: 'Jun 2026',  responsable: 'Dan / Dir. SAC',     evento: 'Auditoría de comunicaciones H1 2026 generada. 85,381 registros analizados. Entrega del diagnóstico al asesor SAC para presentación a Mario López.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Alianza Multimarca' },
    { label: 'CID Zoho',             value: '149651' },
    { label: 'Sector',               value: 'Sector Financiero — Seguros y Servicios' },
    { label: 'Asesor SAC',           value: 'Dan' },
    { label: 'Contacto principal',   value: 'Mario López' },
    { label: 'Sucursales',           value: '38 ubicaciones' },
    { label: 'Agentes únicos activos', value: '38 en llamadas salientes' },
    { label: 'Servicio contratado',  value: 'Callpicker + CP Chat (20 agentes)' },
    { label: 'Total llamadas H1',    value: '85,381 registros (52,980 ent + 32,401 sal)' },
  ],

  necesidad_negocio: 'Alianza Multimarca es una empresa financiera con 38 sucursales que depende de su operación telefónica como canal principal de atención a clientes, renovaciones y gestión de siniestros. La necesidad central es mantener la disponibilidad de atención en horarios laborales y en puntos de contacto críticos (apertura de turno, lunes, fin de semana).\n\nLa plataforma Callpicker fue contratada para centralizar y optimizar esta operación. El hallazgo central es que la plataforma funciona técnicamente — el problema es que la operación no está configurada para aprovecharla.',

  potencial_corto: [
    'Configurar grupo de apertura con prioridad 9AM — recuperar ~655 contactos adicionales por semestre',
    'Activar onboarding de CP Chat con supervisor de contact center — proteger inversión ya pagada',
    'Revisar extensión Vanessa Medina y cola "Fuera de Horario" — corrección técnica, no de personal',
    'Proponer IVR de desbordamiento en franjas 14:00–15:00h — recuperar ~300–400 llamadas/mes',
    'Establecer protocolo de voicemail con respuesta <4h — canal de rescate inmediato',
  ],
  potencial_largo: [
    'Chat como canal de desbordamiento en horas pico — si captura 10% del abandono = 3,200 contactos/semestre',
    'IA de Voz para apertura 8:45–10:00h y domingo — cobertura sin costo de personal',
    'Entrega mensual de reporte de desempeño por agente — Callpicker como socio estratégico',
    'Reducción abandono entrante de 60.5% a <35% en 90 días con configuración correcta',
    'Modelo de planificación de capacidad basado en datos históricos — anticipar picos semanales',
  ],

  tacticas: [
    { nombre: 'Volumen como justificación',  descripcion: 'El cliente puede interpretar el alto abandono como problema de capacidad o de plataforma, no de configuración', impacto: 'Riesgo de atribuir fallas operativas a Callpicker — argumento de cancelación' },
    { nombre: 'Chat sin percepción de valor', descripcion: 'Con 20 agentes CP Chat sin uso registrado, el cliente ya tiene base para solicitar baja del servicio en cualquier renovación', impacto: 'Churn parcial de facturación CP Chat si no se interviene antes de la próxima revisión de contrato' },
    { nombre: 'Comparación de canales', descripcion: 'Alianza puede estar usando WhatsApp Business o email como canal primario ante el abandono telefónico — migración silenciosa en curso', impacto: 'Reducción orgánica de uso de la plataforma sin cancelación formal' },
  ],
  senal_alarma: 'Si el cliente menciona que "la gente no puede contactarnos por teléfono" o que "el sistema no funciona", es señal de atribución del abandono a la plataforma. Dan debe llegar primero con los datos y el diagnóstico — antes de que Mario López los descubra solo.',

  problema_raiz: 'La operación de Alianza Multimarca vive en modo reactivo: la demanda llega en oleadas predecibles (lunes, apertura de turno) que la cobertura no anticipa ni gestiona. La plataforma tiene los datos — la operación no los usa para planear.',
  problema_raiz_detalle: 'El abandono del 60.5% no es un problema de tecnología. La evidencia es clara: los agentes TOP del equipo (Marisol, Eduardo, Edgar, Liceth) demuestran que 73–78% de efectividad saliente es posible. El IVR captura 7.9% en autoservicio. El problema es que la capacidad de atención no está configurada para los momentos donde la demanda es más alta y más urgente: las 9AM del lunes, el inicio de semana con demanda acumulada, la hora de comida sin relevo, el domingo sin cobertura.',

  flujo_real: [
    { fase: '1. Apertura de turno (9AM)', area: 'Operación / Sin grupo dedicado', accion: 'Clientes llaman al abrir — agentes no logueados o IVR retiene el tráfico', resultado: '91.4% de abandono. 2,184 llamadas en el semestre, solo 188 atendidas.' },
    { fase: '2. Lunes — demanda acumulada', area: 'Toda la operación', accion: 'Fin de semana acumula demanda no resuelta que desborda el lunes', resultado: '65.3% de abandono con 12,234 llamadas — el día más crítico de la semana.' },
    { fase: '3. Franja 14–16h', area: 'Equipo de atención', accion: 'Rotación de comidas sin cobertura de transición', resultado: '73.3% abandono a 14h, 66.6% a 15h. ~400 llamadas perdidas en esa franja cada mes.' },
    { fase: '4. CP Chat sin activar', area: 'Supervisor contact center', accion: '20 agentes contratados — sin onboarding, sin uso operativo real', resultado: 'Canal pagado sin valor percibido. Riesgo activo de cancelación en renovación.' },
    { fase: '5. Domingo sin IVR informativo', area: 'Configuración IVR', accion: 'IVR abierto recibe llamadas sin cobertura ni mensaje de horarios', resultado: '86.5% de abandono. Clientes esperan 89s sin información y cuelgan.' },
    { fase: '6. Voicemail sin protocolo', area: 'Operación / Dan', accion: '603 voicemails registrados sin respuesta estructurada', resultado: 'Canal de rescate desaprovechado. Clientes que dejaron mensaje se pierden igual.' },
  ],

  comparativo: [
    { metrica: 'Abandono entrante',        real: '60.5% (32,043 perdidas)',           ideal: '<35% con configuración de grupos y desbordamiento' },
    { metrica: 'Abandono 9AM',             real: '91.4% (2,184 intentos)',            ideal: '<55% con grupo de apertura dedicado' },
    { metrica: 'Abandono lunes',           real: '65.3% (7,994 perdidas)',            ideal: '<45% con refuerzo de inicio de semana' },
    { metrica: 'CP Chat',                  real: '0 uso operativo (20 agentes)',      ideal: '>1 agente activo con onboarding completado' },
    { metrica: 'Voicemail',                real: 'Sin protocolo de respuesta',        ideal: 'Flujo activo con respuesta <4h' },
    { metrica: 'Contacto saliente productivo', real: '~26.4% real (5+ min)',         ideal: '>35% con sesiones de coaching a agentes críticos' },
    { metrica: 'Cobertura domingo',        real: 'IVR abierto, 86.5% abandono',      ideal: 'IVR informativo con horarios + opción voicemail' },
  ],

  plan_inmediato: [
    { accion: 'Presentar los datos del 60.5% de abandono a Mario López. No como problema técnico — como problema de negocio medible con solución específica.', responsable: 'Dan', criterio: 'Reunión agendada con Mario López en los próximos 7 días' },
    { accion: 'Revisar configuración de extensión Vanessa Medina y colas "Disp.ATC / Fuera Horario". Puede ser desbordamiento faltante o asignación de agentes incorrecta.', responsable: 'Dan + Técnico Callpicker', criterio: 'Configuración revisada y documentada. Impacto: ~15% del abandono global' },
    { accion: 'Agendar onboarding de CP Chat con supervisor de contact center de Alianza. 1 hora guiada para activar el canal como desbordamiento en horas pico.', responsable: 'Dan', criterio: 'Al menos 1 agente CP Chat activo en las siguientes 2 semanas' },
  ],

  plan_mediano: [
    { accion: 'Configurar grupo de apertura con prioridad para 8:45–10:00h. Puede incluir regla de enrutamiento o agente virtual que tome el tráfico inicial.', responsable: 'Técnico Callpicker + Dan', criterio: 'Abandono 9AM < 60% en el siguiente mes medido' },
    { accion: 'Activar regla de desbordamiento en franja 14:00–16:00h para cubrir rotación de comidas.', responsable: 'Técnico Callpicker', criterio: 'Abandono 14–16h < 50% en 30 días' },
    { accion: 'Crear flujo de voicemail estructurado con protocolo de callback <4h. Activar especialmente para franjas fuera de horario y fin de semana.', responsable: 'Dan + Técnico', criterio: 'Protocolo de voicemail documentado y activo' },
    { accion: 'Investigar causa de caída de 56% en salientes (ene→jun). Validar con Mario López si hubo reducción de headcount, cambio de estrategia o migración de canal.', responsable: 'Dan', criterio: 'Causa documentada en CRM con acción definida' },
  ],

  plan_estrategico: [
    { accion: 'Implementar entrega mensual de reporte de desempeño por agente. Mario López no tiene esta visibilidad — posiciona a Callpicker como socio estratégico de dato.', responsable: 'Dan + Dir. SAC', criterio: 'Primer reporte entregado en reunión mensual de julio' },
    { accion: 'Proponer IA de Voz para cobertura de apertura (8:45–10h) y domingo. ROI directo: recuperar el 30% del abandono de 9AM = 655 contactos/semestre adicionales.', responsable: 'Dan + Ventas', criterio: 'Demo presentada a Mario López' },
    { accion: 'Diseñar programa de coaching peer-to-peer: TOP performers (Marisol, Eduardo) trabajan protocolo con agentes en zona crítica (Tizoc, Axel).', responsable: 'Dan + Supervisor Alianza', criterio: 'Sesión agendada con equipo Alianza' },
    { accion: 'Configurar IVR domingo con mensaje de horarios + opción de voicemail. Eliminar llamadas que esperan 89s sin información.', responsable: 'Técnico Callpicker', criterio: 'IVR domingo activo en las siguientes 2 semanas' },
  ],

  areas_oportunidad: [
    { area: 'CP Chat activado',           impacto: '20 agentes ya pagados. Si captura 10% del abandono = 3,200 contactos adicionales/semestre sin costo extra.', responsable: 'Dan + Supervisor contact center' },
    { area: 'IA de Voz apertura + domingo', impacto: 'Recuperar 30% del abandono 9AM = 655 contactos/semestre. Domingo: captura 86.5% actual de abandono con 0 personal adicional.', responsable: 'Dan + Ventas' },
    { area: 'Reporte mensual de agentes', impacto: 'Diferencia de 77.4 puntos entre mejor y peor agente. Coaching basado en datos = mejora sin contratar.', responsable: 'Dan' },
    { area: 'Protocolo voicemail activo', impacto: '603 mensajes sin respuesta estructurada = 603 clientes que ya mostraron disposición de contacto. Tasa de conversión alta si hay callback <4h.', responsable: 'Dan + Operación' },
  ],

  perfiles: [
    {
      nombre: 'Mario López', rol: 'Director — Decisor principal de la cuenta', color: '#3b82f6',
      campos: [
        { label: 'Perfil',          value: 'Director de operaciones. Tiene visión del negocio pero probablemente no tiene acceso a los datos de la plataforma a este nivel de detalle.' },
        { label: 'Comunicación',    value: 'La conversación debe abrir con el dato de negocio (32,043 clientes sin atención), no con el dato técnico (configuración de colas).' },
        { label: 'Argumento clave', value: 'Su equipo TOP prueba que 78% de efectividad es posible. El problema no es la plataforma — es la configuración y la cobertura.' },
        { label: 'Propuesta',       value: 'Callpicker como socio que entrega datos y propone soluciones concretas — no solo como proveedor de plataforma.' },
      ],
    },
    {
      nombre: 'Dan', rol: 'Asesor SAC — Gestor de cuenta', color: '#22c55e',
      campos: [
        { label: 'Prioridad',       value: 'Llegar a Mario López con el diagnóstico antes de que el cliente lo descubra solo. Posicionarse como analista, no como reactivo.' },
        { label: 'Script sugerido', value: '"Mario, revisamos la actividad del primer semestre — 85 mil llamadas. El dato más crítico: 6 de cada 10 personas que llaman no son atendidas. A las 9AM el abandono llega al 91%. Queremos ayudarte a corregir eso esta semana."' },
        { label: 'Acción urgente',  value: 'Onboarding de CP Chat antes de la renovación — protege facturación y evita argumento de cancelación.' },
        { label: 'Arma principal',  value: 'Los agentes TOP del propio equipo de Alianza son el mejor argumento — 78% de efectividad es alcanzable. El problema es la distribución de cobertura.' },
      ],
    },
    {
      nombre: 'Marisol Gaitán / Eduardo Vega / Edgar García', rol: 'Agentes TOP salientes (73–78% efectividad)', color: '#f59e0b',
      campos: [
        { label: 'Relevancia',      value: 'Son el argumento de que la excelencia es posible dentro de la misma operación. Comparar con agentes en zona crítica (35–39% efectividad).' },
        { label: 'Propuesta',       value: 'Programa de mentoreo peer-to-peer con agentes en zona de riesgo (Tizoc, Axel). Reproducir el protocolo de los mejores sin contratar.' },
      ],
    },
    {
      nombre: 'M. Amanda Mosco / Liceth Rubio / Araceli Martínez', rol: 'Excelentes en entrante (87–91%), riesgo en saliente', color: '#8b5cf6',
      campos: [
        { label: 'Paradoja',        value: '91.2%, 90.9% y 87.2% de atención en entrante con duración promedio de 16–17 minutos. Pero en saliente, Mosco y Martínez tienen <50% de efectividad.' },
        { label: 'Diagnóstico',     value: 'Perfil de servicio profundo, no de cadencia de marcación predictiva. Candidatos a roles híbridos o especializados en retención.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Plataforma funcionando correctamente — registra y enruta sin fallas técnicas reportadas',
      'Cuatro agentes TOP con 73–78% de efectividad saliente — modelo de excelencia interno',
      'IVR de autoservicio activo: 4,160 interacciones (7.9% del tráfico entrante)',
      '38 agentes únicos activos en operación saliente — capacidad de equipo sólida',
      'Promedio saliente productivo: 3.9 min/llamada — calidad de conversación aceptable en el núcleo de alto desempeño',
      'Volumen total significativo: 85,381 registros — cuenta enterprise de alto tráfico',
      'CP Chat ya contratado — infraestructura disponible sin costo adicional para activar',
    ],
    oportunidades: [
      'Onboarding CP Chat: canal ya pagado que puede capturar 10% del abandono entrante',
      'IA de Voz para apertura 9AM y domingo: ROI directo sin headcount adicional',
      'Entrega mensual de reporte por agente: posiciona a Callpicker como socio estratégico',
      'Coaching peer-to-peer con TOP performers: mejora sin costo de contratación',
      'Regla de desbordamiento 14–16h: recupera 300–400 llamadas/mes con configuración',
      'IVR informativo de domingo: elimina 86.5% de abandono con mensaje de horarios + voicemail',
      'Protocolo de voicemail activo: rescata contactos que ya mostraron intención de comunicarse',
    ],
    debilidades: [
      '60.5% de abandono entrante sostenido 6 meses — sin intervención documentada',
      'CP Chat con 20 agentes pagados sin uso operativo real — riesgo de cancelación latente',
      'Sin protocolo de voicemail — 603 mensajes sin respuesta estructurada',
      'Cobertura de apertura no configurada — 91.4% de abandono a las 9AM',
      'Sin refuerzo de lunes — 65.3% de abandono con mayor volumen semanal',
      'Extensión Vanessa Medina sin optimización — 6,476 llamadas con 24% de atención',
      'Dispersión extrema en desempeño de agentes: 78% vs 35% en el mismo equipo',
      'Sin visibilidad ejecutiva de datos — Mario López no recibe reporte periódico',
      'Caída 56% en salientes sin causa documentada — señal de cambio operativo no gestionado',
    ],
    amenazas: [
      'Cliente puede atribuir abandono a la plataforma si Dan no llega primero con el diagnóstico',
      'Renovación de CP Chat en riesgo si el cliente evalúa valor percibido vs costo',
      'Migración silenciosa a WhatsApp o email si el canal telefónico sigue con 60% de abandono',
      'Caída de 56% en salientes puede indicar reducción de personal o cambio estratégico que afecte la cuenta',
      'Sin grupo de apertura: cada semana que pasa son ~90 llamadas adicionales perdidas a las 9AM',
      'Competidores de contact center pueden proponer soluciones si el cliente identifica el problema por su cuenta',
    ],
  },

  conclusion: 'Alianza Multimarca tiene el volumen y la infraestructura de una cuenta enterprise. La plataforma funciona. El equipo tiene agentes de excelencia. El problema es que 6 de cada 10 clientes no son atendidos, y ningún mecanismo de configuración, coaching o datos se ha activado para corregirlo.\n\nLa ventana de intervención es ahora: antes de que el cliente descubra por sí solo el 60.5% de abandono, antes de la renovación de CP Chat, y antes de que la caída del 56% en salientes se convierta en argumento de reducción de facturación. Dan tiene en este análisis todo lo necesario para convertir una conversación de soporte en una conversación de resultados.',

  pierde: [
    'CP Chat cancelado si no hay activación antes de la próxima revisión de contrato',
    'Mario López descubre el abandono por su cuenta — Callpicker pierde posición de confianza',
    'Vanessa Medina sin intervención = 4,919 llamadas perdidas cada semestre continuando',
    'Abandono 9AM sigue en 91.4% — la primera impresión de la empresa ante sus clientes',
    'Caída saliente sin investigar = operación reduciéndose sin visibilidad de la causa',
    'Agentes en zona crítica (35–39% efectividad) sin coaching — desempeño sin mejorar',
    'Dan sin datos para la reunión con Mario = conversación de soporte, no de estrategia',
  ],
  gana: [
    'CP Chat activado: protege facturación y genera canal adicional de contacto',
    'Grupo de apertura 9AM: recupera 655+ contactos semestrales. Primera mejora visible para Mario López',
    'Reporte mensual de agentes entregado a dirección: Callpicker como socio de dato',
    'Regla de desbordamiento 14–16h y domingo: mejora medible en 30 días sin inversión adicional',
    'Coaching peer-to-peer TOP performers: mejora sistémica sin contratar',
    'Dan llega primero con el diagnóstico: posición de autoridad analítica ante el cliente',
    'Abandono entrante objetivo < 35% en 90 días — cuenta estabilizada y expandible',
  ],
  recomendacion_central: 'Dan debe presentar esta auditoría a Mario López en los próximos 7 días, encuadrándola como un análisis de oportunidad operativa — no como un reporte de problemas. El argumento central: la plataforma ya funciona, sus agentes TOP ya demuestran que el estándar de excelencia existe, y con 3 ajustes de configuración medibles, Alianza puede reducir el abandono a la mitad en 90 días. La acción más urgente no es técnica: es llegar primero.',
}
