import type { AuditoriaCase } from './types'

export const HOSPITAL_SANTA_ROSA: AuditoriaCase = {
  id:                    'hospital-santa-rosa',
  nombre:                'Hospital Santa Rosa',
  sector:                'Salud / Hospitales Privados',
  fecha_periodo:         'Enero – Julio 2026',
  fecha_auditoria:       'Jul 2026',
  tipo_cliente:          'Mediana · 51–200 empleados · 1 oficina',
  descripcion_contexto:  'Unidad hospitalaria privada · Querétaro, Qro. · CID 81735 · Asesora: Claudia Hernández',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Pérdida comunicación interna',   value: '22–25%',     color: '#ef4444' },
    { label: 'Pérdida salientes externas',      value: '39.0%',      color: '#f97316' },
    { label: 'MRR (plan ilimitado)',            value: '$20,953',    color: '#6366f1' },
    { label: 'Health Score CRM',               value: '50 / 100',   color: '#f59e0b' },
  ],

  resumen_ejecutivo:
    'Hospital Santa Rosa es una cuenta con Health Score de 50/100, activa desde septiembre de 2021 (1,784 días). ' +
    'El análisis forense de 55,638 registros de tráfico (enero–julio 2026) revela que el problema más grave no está en la atención al paciente externo — que apenas pierde 4.9% de sus llamadas — sino en la comunicación interna entre departamentos: 1 de cada 4 intentos de comunicación interna (22–25%) no se completa. ' +
    'En extensiones críticas como Jefatura de Enfermería (ext. 502) y Enfermería de Urgencias (ext. 509) esa tasa sube a 35%, representando 1,458 comunicaciones internas fallidas solo en esas dos extensiones. ' +
    'Adicionalmente, las llamadas salientes hacia el exterior (pacientes, laboratorios, proveedores) pierden 39.0% — cifra alta y sostenida sin tendencia de mejora en seis meses. ' +
    'El contacto KAM de la cuenta (Guillermo Peña) dejó de laborar en el hospital hace aproximadamente cuatro años, lo que significa que nadie en Callpicker tenía interlocutor válido para reportar estos hallazgos. La actualización de contacto a Ernesto es reciente (21-jul-2026).',

  resultado_positivo:
    'Atención a pacientes externos: solo 4.9% de pérdida en 9,766 llamadas entrantes genuinas — por debajo del promedio del sector. ' +
    '24.5% del tráfico externo se resuelve por autoservicio (IVR), validando un caso de negocio sólido para Agente de Voz IA sin necesidad de hipótesis.',

  hallazgos: [
    'Crisis de comunicación interna: 80% del tráfico saliente y 67% del entrante es interno (ext↔ext). De ese volumen, 24.7% (salientes) y 22.5% (entrantes) no logra conectar — patrón estructural de 6 meses consecutivos.',
    'Enfermería de Urgencias (ext. 509): 2,036 intentos de contacto interno, 34.9% de pérdida — más de 700 comunicaciones fallidas hacia el área más crítica del hospital.',
    'Jefatura de Enfermería (ext. 502): 2,135 intentos, 35.0% de pérdida — el mayor punto de fricción operativa combinado por volumen y tasa.',
    'Biomédica Gerencia (ext. 599): 85% de pérdida con 60 intentos. Tococirugía Quirófano (ext. 534): 66.2% de pérdida.',
    'Salientes externas: 39.0% de pérdida (personal contactando pacientes, laboratorios, proveedores) — estable entre 35.2% y 44.8% mes a mes, sin mejora.',
    '484 marcaciones anómalas (números de 1, 2, 4, 5, 7, 8 ó 9 dígitos): 99.8% terminan perdidas — errores de marcación o accesos directos mal configurados.',
    'Contacto KAM inactivo 4 años: Guillermo Peña ya no labora en el hospital. Ernesto (Administrador) es el nuevo contacto, actualizado el 21-jul-2026.',
    '22,043 minutos reales de conversación en el período (plan ilimitado — indicador de uso, no de facturación variable).',
  ],

  cronologia: [
    { fecha: 'Sep 2021',    responsable: 'Callpicker',        evento: 'Alta de cuenta — servicio Extensión VyC con SIM + Extensión VyC. Contacto registrado: Guillermo Peña.', tipo: 'ok' },
    { fecha: '2021–2022',   responsable: 'Callpicker / KAM',  evento: 'Adopción estable de Voz VyC y Pago Automático. Cero adopción en IA de Voz, IA de Chat, Callpicker Chat e Integración API.', tipo: 'neutral' },
    { fecha: 'Circa 2022',  responsable: 'Hospital',           evento: 'Guillermo Peña deja de laborar en el hospital. El equipo de Callpicker no tiene notificación del cambio de contacto — brecha KAM de ~4 años.', tipo: 'problema' },
    { fecha: 'Ene 2026',    responsable: 'Análisis forense',   evento: 'Inicia el período analizado (203 días). Volumen estable: ~1,800–2,400 llamadas/mes, sin estacionalidad marcada.', tipo: 'neutral' },
    { fecha: 'Ene–Jun 2026',responsable: 'Plataforma',         evento: 'Tasa de pérdida interna sostenida: 22–25% mensual. Ext. 502 y 509 acumulan 1,458 comunicaciones internas fallidas.', tipo: 'problema' },
    { fecha: '21 Jul 2026', responsable: 'Claudia Hernández',  evento: 'Actualización de contacto a Ernesto (Administrador de la cuenta) — primer interlocutor válido en ~4 años.', tipo: 'pivote' },
    { fecha: '23 Jul 2026', responsable: 'Callpicker / ATLAS', evento: 'Emisión de auditoría forense con 55,638 registros analizados. Hallazgo central: crisis de comunicación interna, oportunidad de IA de Voz.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',       value: 'Hospital Santa Rosa' },
    { label: 'CID Zoho',          value: '81735' },
    { label: 'Sector',             value: 'Unidad hospitalaria privada — atención especializada, cirugía, maternidad, urgencias e imagenología' },
    { label: 'Tamaño',            value: 'Mediana · 51–200 empleados · 1 oficina' },
    { label: 'Cliente desde',      value: 'Septiembre 2021 (1,784 días)' },
    { label: 'Servicio contratado',value: 'Extensión VyC con SIM + Extensión VyC (plan ilimitado)' },
    { label: 'Contacto principal', value: 'Ernesto (Administrador) — actualizado 21-jul-2026' },
    { label: 'Contacto anterior',  value: 'Guillermo Peña — ya no labora (~4 años)' },
    { label: 'Asesora de cuenta',  value: 'Claudia Hernández' },
    { label: 'Tickets Zoho Desk',  value: '3 totales · 0 fallas técnicas · todos administrativos (voz)' },
    { label: 'Adopción IA/Chat',   value: '"No aplica" en CRM — desaprovechado pese a caso de uso validado' },
  ],

  necesidad_negocio:
    'El hospital requiere comunicación interna confiable entre departamentos críticos (urgencias, quirófano, enfermería, farmacia). ' +
    'La coordinación de atención al paciente depende de que las llamadas entre extensiones conecten — un fallo del 22–25% tiene costo clínico y operativo directo, no solo de productividad.',

  potencial_corto: [
    'Agente de Voz IA para atención externa de primer nivel (horarios, ubicación, confirmación de citas) — 24.5% del tráfico ya se resuelve por IVR, validando el caso de uso.',
    'Diagnóstico de configuración de extensiones: identificar y corregir extensiones con >30% de pérdida (inicio por ext. 502, 509, 599, 534).',
    'Reforzar cobertura de fin de semana: domingo 8.0% de pérdida vs. 4.5% promedio entre semana.',
    'Corrección de marcaciones anómalas: 484 llamadas con longitudes atípicas — posible capacitación o reconfiguración de teclas de marcación rápida.',
  ],

  potencial_largo: [
    'Enrutamiento inteligente / directorio interno: colas con reintento automático o notificación a extensión alterna cuando la principal no contesta en N segundos.',
    'Callpicker Chat para confirmación de citas y resultados de laboratorio — reduce dependencia de salientes externas con 39% de pérdida.',
    'Upsell IA de Chat: volumen de interacciones repetitivas (horarios, laboratorio, agenda consulta externa) es base ideal para automatización de canal digital.',
  ],

  tacticas: [
    {
      nombre:      'Sesión de hallazgos con Ernesto',
      descripcion: 'Presentar la tabla de extensiones críticas (ext. 502, 509, 599, 534) y el comparativo interno vs. externo para crear urgencia genuina.',
      impacto:     'Alto — activa la relación KAM y posiciona a Callpicker como partner estratégico, no solo proveedor.',
    },
    {
      nombre:      'Propuesta de Agente de Voz IA',
      descripcion: 'Usar el 24.5% de autoservicio como caso de negocio demostrado. "Ya tienen 2,395 interacciones mensuales en IVR — el salto a IA conversacional es el siguiente paso natural."',
      impacto:     'Alto — MRR incremental + diferenciación frente a competidores que no tienen estos datos.',
    },
    {
      nombre:      'Quick win: extensiones mal configuradas',
      descripcion: 'Validar con TI interno del hospital si extensiones 548 (100% pérdida) y 599 (85% pérdida) siguen activas o son residuos de configuración.',
      impacto:     'Medio — genera confianza al resolver algo concreto sin costo adicional para el cliente.',
    },
  ],

  senal_alarma:
    'Salientes externas con 39% de pérdida sin tendencia de mejora en 6 meses: si el cliente atribuye este indicador a falla de plataforma (vs. a su dinámica interna), existe riesgo de rotación hacia competidor.',

  problema_raiz:        'Brecha de comunicación interna no detectada por 4+ años',
  problema_raiz_detalle:
    'El 80% del tráfico saliente del hospital es interno (ext↔ext). Sin un contacto KAM válido desde ~2022, ningún hallazgo operativo pudo retroalimentarse al cliente. ' +
    'El resultado: una tasa de pérdida interna del 22–25% sostenida por al menos 6 meses completos, con picos de 35% en las extensiones más críticas del hospital. ' +
    'El problema no está en la infraestructura de Callpicker sino en la configuración de extensiones, la carga de trabajo por área y la falta de supervisión por parte del cliente.',

  flujo_real: [
    { fase: 'Llamada interna', area: 'Cualquier extensión', accion: 'Personal del hospital intenta comunicarse entre departamentos (ext↔ext)', resultado: '22–25% no conecta — sin notificación ni reintento automático' },
    { fase: 'Ext. críticas',   area: 'Urgencias / Enfermería', accion: 'Intentos de contacto hacia ext. 502 y 509', resultado: '35% de pérdida — 1,458 comunicaciones fallidas en el período' },
    { fase: 'Saliente externa',area: 'Personal del hospital', accion: 'Llama a pacientes, laboratorios o proveedores', resultado: '39.0% de pérdida — sin mejora mes a mes' },
    { fase: 'Llamada entrante',area: 'Recepción / Admisión',  accion: 'Paciente externo llama al hospital', resultado: 'Solo 4.9% de pérdida — punto fuerte de la cuenta' },
    { fase: 'Autoservicio',    area: 'IVR',                   accion: 'Paciente resuelve su consulta sin agente', resultado: '24.5% del tráfico externo (2,395 llamadas) — caso de uso IA validado' },
  ],

  comparativo: [
    { metrica: 'Pérdida comunicación interna',    real: '22–25% (hasta 85% en ext. 599)', ideal: '< 5%' },
    { metrica: 'Pérdida salientes externas',       real: '39.0%',                          ideal: '< 15%' },
    { metrica: 'Pérdida entrantes externas',       real: '4.9%',                           ideal: '< 8% — ✅ dentro de rango' },
    { metrica: 'Contacto KAM activo',             real: 'Sin contacto válido ~4 años',    ideal: 'Revisión trimestral mínima' },
    { metrica: 'Adopción IA / Chat',              real: '0% (marcado "No aplica")',        ideal: 'Propuesta formal pendiente' },
    { metrica: 'Marcaciones anómalas',            real: '484 registros (99.8% perdidas)', ideal: '0 — corregibles con capacitación' },
  ],

  plan_inmediato: [
    { accion: 'Confirmar contacto Ernesto y agendar sesión de hallazgos', responsable: 'Claudia Hernández', criterio: 'Reunión agendada antes del 31 Jul 2026' },
    { accion: 'Presentar tabla de extensiones críticas (ext. 502, 509, 534, 599) con impacto operativo hospitalario', responsable: 'Claudia Hernández', criterio: 'Presentación entregada y comentarios recibidos' },
    { accion: 'Validar con equipo técnico Callpicker la unidad de total_minutes (min vs. seg) antes de usar en reporte formal', responsable: 'Equipo técnico Callpicker', criterio: 'Confirmación documentada' },
  ],

  plan_mediano: [
    { accion: 'Propuesta formal de Agente de Voz IA usando 24.5% de autoservicio como caso de negocio', responsable: 'José Manuel / Comercial', criterio: 'Propuesta enviada y apertura de conversación confirmada' },
    { accion: 'Validar con cliente si ext. 548 y 599 siguen activas o son configuraciones residuales', responsable: 'Claudia Hernández', criterio: 'Extensiones corregidas o confirmadas como inactivas' },
    { accion: 'Revisar configuración de marcación rápida / capacitar a TI interno del hospital para reducir 484 marcaciones anómalas', responsable: 'Cliente (TI) con soporte Callpicker', criterio: 'Reducción > 50% de marcaciones anómalas en siguiente auditoría' },
  ],

  plan_estrategico: [
    { accion: 'Implementar Agente de Voz IA para primer nivel de atención externa', responsable: 'Equipo comercial + técnico Callpicker', criterio: 'Prueba piloto activa en 90 días' },
    { accion: 'Proponer enrutamiento inteligente interno (cola con reintento automático hacia ext. 502 y 509)', responsable: 'Equipo técnico Callpicker', criterio: 'Reducción de pérdida interna a < 10% en ext. críticas' },
    { accion: 'Integrar Callpicker Chat para confirmación de citas y resultados (canal alternativo a saliente externa)', responsable: 'Claudia Hernández + comercial', criterio: 'Propuesta presentada y evaluada por el cliente' },
  ],

  areas_oportunidad: [
    { area: 'Agente de Voz IA',           impacto: 'Alto — 24.5% del tráfico ya en autoservicio, caso de uso demostrado sin hipótesis', responsable: 'Comercial + Técnico' },
    { area: 'Enrutamiento interno',       impacto: 'Alto — reducir 22–25% de pérdida interna tiene impacto clínico y operativo directo', responsable: 'Técnico Callpicker' },
    { area: 'Callpicker Chat',            impacto: 'Medio — alternativa a salientes externas con 39% de pérdida para confirmaciones y recordatorios', responsable: 'KAM + Comercial' },
    { area: 'Cobertura fin de semana',    impacto: 'Medio — domingo 8.0% de pérdida (casi 2× el promedio entre semana)', responsable: 'Cliente (operaciones)' },
    { area: 'Capacitación marcación',     impacto: 'Bajo — 484 registros anómalos, todos terminan perdidos, corregibles sin costo de plataforma', responsable: 'Cliente (TI) + Callpicker' },
  ],

  perfiles: [
    {
      nombre: 'Ernesto',
      rol:    'Administrador de cuenta — contacto vigente (actualizado 21-jul-2026)',
      color:  '#2563eb',
      campos: [
        { label: 'Rol',             value: 'Administrador de la cuenta' },
        { label: 'Contacto desde',  value: '21 de julio de 2026' },
        { label: 'Institución',     value: 'Hospital Santa Rosa, Querétaro' },
        { label: 'Relevancia',      value: 'Primer interlocutor válido de la cuenta en ~4 años' },
      ],
    },
    {
      nombre: 'Guillermo Peña',
      rol:    'Contacto histórico — ya no labora en el hospital',
      color:  '#6b7280',
      campos: [
        { label: 'Rol original',    value: 'Contacto principal registrado en Callpicker' },
        { label: 'Status',          value: 'Ya no labora en Hospital Santa Rosa (desde ~2022)' },
        { label: 'Impacto',         value: 'Brecha KAM de ~4 años — ningún hallazgo operativo se retroalimentó al cliente' },
      ],
    },
    {
      nombre: 'Claudia Hernández',
      rol:    'Asesora de cuenta Callpicker',
      color:  '#7c3aed',
      campos: [
        { label: 'Responsabilidad', value: 'Seguimiento comercial y relacional de la cuenta' },
        { label: 'Acción inmediata',value: 'Agendar sesión de hallazgos con Ernesto' },
        { label: 'Oportunidad',     value: 'Posicionar propuesta de IA de Voz con datos forenses como respaldo' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Atención a llamadas externas entrantes sólida: 95.1% de conexión, muy por encima del promedio observado en otras auditorías Callpicker.',
      'Volumen de tráfico estable y predecible mes a mes — comportamiento estructural, no episódico.',
      'Cliente de larga permanencia (desde 2021) con adopción alta y consistente de Voz VyC y Pago Automático.',
      '24.5% de autoservicio ya validado — base de uso real para un caso de negocio de IA de Voz sin necesidad de hipótesis.',
    ],
    oportunidades: [
      'Agente de Voz IA para primer nivel de atención externa: capitaliza el 24.5% que ya usa autoservicio.',
      'Mejora de enrutamiento interno / directorio inteligente para reducir la pérdida de comunicación entre departamentos (especialmente ext. 502 y 509).',
      'Reactivar relación KAM con Ernesto (contacto vigente) para convertir los hallazgos en un plan de acción conjunto.',
      'Callpicker Chat como canal alternativo a salientes externas (39% de pérdida) para confirmaciones y resultados de laboratorio.',
    ],
    debilidades: [
      'Comunicación interna estructuralmente frágil: 22–25% de pérdida sostenida seis meses, sin evidencia de que el cliente lo haya detectado o abordado.',
      'Salientes externas con 39% de pérdida — el peor indicador cuantitativo de la cuenta, sin mejora en seis meses.',
      'Cero adopción de IA de Voz, IA de Chat y Callpicker Chat pese a tener un caso de uso ya validado por el propio comportamiento de sus pacientes.',
      'Brecha KAM de ~4 años: sin retroalimentación, el cliente nunca supo de estos problemas operativos.',
    ],
    amenazas: [
      'Riesgo reputacional y de continuidad clínica si la fricción de comunicación interna afecta tiempos de respuesta en urgencias o quirófano.',
      'Sin un contacto KAM activo y consistente, el cliente puede atribuir los problemas a fallas de plataforma en vez de a su dinámica interna.',
      'Competencia puede posicionar soluciones de IA de voz aprovechando que Callpicker aún no ha propuesto formalmente ese salto a este cliente.',
    ],
  },

  conclusion:
    'Hospital Santa Rosa es una cuenta con fundamentos sólidos en atención a pacientes externos (4.9% de pérdida) y un volumen de tráfico estable desde 2021. ' +
    'El problema central — una tasa de pérdida interna del 22–25% sostenida por seis meses — es tratable y no requiere inversión en infraestructura adicional, sino en configuración y enrutamiento inteligente. ' +
    'La oportunidad comercial más clara es el Agente de Voz IA: el propio comportamiento del hospital (24.5% de autoservicio) ya demostró que el caso de uso es real y el volumen es suficiente. ' +
    'La prioridad inmediata es consolidar la relación con Ernesto y presentar estos hallazgos como un diagnóstico de valor agregado, no como una crítica al cliente.',

  pierde: [
    '~9,600 comunicaciones internas fallidas en el periodo — tiempo de personal y coordinación clínica comprometida.',
    '~1,775 intentos de contacto externo fallidos (salientes) — pacientes, laboratorios y proveedores sin respuesta.',
    'Oportunidad de upsell de IA de Voz sin propuesta formal durante 4+ años de relación comercial.',
    'Relación KAM sin interlocutor válido durante ~4 años — confianza y profundidad de relación perdidas.',
  ],

  gana: [
    'Primer diagnóstico forense completo de la cuenta — base objetiva para cualquier conversación de upsell.',
    'Contacto vigente (Ernesto) para retomar la relación KAM de forma estructurada.',
    'Caso de negocio de IA de Voz respaldado por datos reales, sin necesidad de hipótesis.',
    'Posición de autoridad como partner estratégico que detecta y reporta problemas antes de que el cliente los perciba.',
  ],

  recomendacion_central:
    'No abrir las tres conversaciones de upsell (IA de Voz, enrutamiento interno, Callpicker Chat) en paralelo. ' +
    'El punto de entrada con más fuerza demostrativa y menor fricción es el autoservicio ya validado (24.5%): es la base natural para proponer el Agente de Voz IA. ' +
    'La conversación sobre comunicación interna conviene abordarla como hallazgo de valor agregado en la misma sesión — no como venta separada.',
}
