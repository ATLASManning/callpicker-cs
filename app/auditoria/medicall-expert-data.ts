import type { AuditoriaCase } from './types'

export const MEDICALL_EXPERT: AuditoriaCase = {
  id:                    'medicall-expert',
  asesor:                'Dan',

  nombre:                'Medicall Expert',
  sector:                'Salud · Servicios Médicos Integrales · Naucalpan, EdoMx',
  fecha_periodo:         'Enero – Julio 2026',
  fecha_auditoria:       'Jul 2026',
  tipo_cliente:          'SMB · Plan Ilimitado · CID 162474 · MRR $6,831 · HS 61',
  descripcion_contexto:  '33,957 llamadas analizadas · Asesor: Dan Domínguez · 39 agentes activos · Plan Visibilidad y Control + Chat (IL) · Cliente desde jul 2024 (753 días) · Operación outbound-first: 98.1% del tráfico es saliente',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Pérdida saliente global',    value: '58.0%',  color: '#ef4444' },
    { label: 'Crecimiento volumen',         value: '7.5×',   color: '#f59e0b' },
    { label: 'Brecha entre asesores',       value: '34 pts', color: '#f97316' },
    { label: 'Adopción de producto',        value: '25/100', color: '#ef4444' },
  ],

  resumen_ejecutivo: 'Medicall Expert registró 33,326 llamadas salientes y 631 entrantes entre enero y julio 2026. El hallazgo central es una tasa de pérdida saliente de 58.0% sostenida — casi 6 de cada 10 llamadas no logran conectar con el paciente. Esta tasa no mejoró con el tiempo: pasó de 43.5% en enero a 61.1% en marzo y se ha mantenido entre 57–61% desde entonces, mientras el volumen creció 7.5× (de 984 llamadas en enero a 8,364 en junio). El problema escala junto con la operación, no se diluye. Ningún módulo de adopción está verificado en el panel (adopción 25/100) y no hay registro de seguimiento KAM activo en 753 días de relación. La cuenta es operativamente crítica para el cliente pero invisible desde la gestión de Callpicker.',

  resultado_positivo: 'La operación es real, activa y en crecimiento (7.5× en 6 meses). El cliente tiene 753 días de relación con pago puntual (100/100 en componente de pago). Existe un grupo de asesores con desempeño relativamente bueno (Fernando 44.2%, Gaby 43.1%) que prueba que la tasa de pérdida actual no es un límite técnico sino operativo — hay margen de mejora con el equipo existente.',

  hallazgos: [
    'CRÍTICO — 58.0% de pérdida saliente sostenida desde marzo: 19,319 de 33,326 llamadas no conectaron. La tasa empeoró con el crecimiento del volumen y se estabilizó en nivel crítico.',
    'La tasa de pérdida no puede atribuirse al plan (ilimitado, sin bolsa de minutos): es puramente operativa — llamadas que se intentan y no logran conectar.',
    'Brecha de 34 puntos entre el mejor asesor (Gaby: 43.1%) y el peor con volumen significativo (Jahir: 77.2%). La infraestructura técnica no explica la brecha: app-direct y SIP tienen tasas casi idénticas (57.9% vs. 58.4%).',
    'Ventana crítica 14:00–15:00: concentra 41.2% del volumen total (13,740 llamadas) con las peores tasas del día (60.9–61.8%). Saturación operativa en la hora de mayor tráfico.',
    'Adopción de producto en 25/100: Voz CE, Voz VyC, Chat, IA de Voz/Chat y Panel Administrador sin módulo verificado en el panel. Cero actividad KAM registrada en 753 días.',
    'Solo 1 ticket de soporte en toda la relación, pese a una tasa de pérdida crítica y sostenida — el cliente probablemente no mide internamente su pérdida de contacto.',
    '89.7% del canal entrante se resuelve vía IVR/autoservicio sin llegar a un asesor. Pendiente validar si resuelve la necesidad real del paciente o genera abandono silencioso.',
    'Caso puntual de marcación repetitiva: el mismo número recibió 22 llamadas el 18 de marzo y 7 el 30 de junio. Requiere validación con el cliente.',
  ],

  cronologia: [
    { fecha: 'Julio 2024',        responsable: 'Ventas Callpicker',             evento: 'Alta de cuenta Medicall Expert. Servicio Visibilidad y Control + Chat (IL). MRR $6,831. Inicio de 753 días de relación sin seguimiento KAM registrado.', tipo: 'neutral' },
    { fecha: 'Enero 2026',        responsable: 'Operación Medicall Expert',      evento: '984 salientes. Tasa de pérdida: 43.5% — el mejor mes del período. Volumen bajo, equipo en proceso de arranque o ajuste.', tipo: 'neutral' },
    { fecha: 'Feb–Mar 2026',      responsable: 'Operación Medicall Expert',      evento: 'Crecimiento acelerado: de 2,057 a 3,021 salientes. Tasa de pérdida sube de 56.5% a 61.1% — el deterioro se instala mientras el volumen escala.', tipo: 'problema' },
    { fecha: '18 Mar 2026',       responsable: 'Operación (asesor desconocido)', evento: 'Un mismo número recibe 22 llamadas en un solo día. Patrón atípico que requiere validación con el cliente.', tipo: 'problema' },
    { fecha: 'Abr–May 2026',      responsable: 'Operación Medicall Expert',      evento: '5,397 y 6,017 salientes respectivamente. Tasa de pérdida se consolida en 57–58%: la operación escaló sin mejorar eficiencia de conexión.', tipo: 'problema' },
    { fecha: 'Junio 2026',        responsable: 'Operación Medicall Expert',      evento: 'Pico del período: 8,364 salientes. Tasa de pérdida 61.4% — el volumen más alto coincide con la peor tasa de pérdida del semestre.', tipo: 'problema' },
    { fecha: 'Jul 2026 (al día 24)', responsable: 'Operación Medicall Expert',   evento: '7,347 salientes en 24 días — ritmo que mantendría un nuevo récord mensual. Tasa de pérdida: 57.5%. Sin señales de mejora estructural.', tipo: 'neutral' },
    { fecha: 'Jul 2026 (auditoría)', responsable: 'Callpicker Equipo EaC',       evento: 'Primera auditoría formal de la cuenta en 753 días. Sin registro de seguimiento KAM previo ni módulos de adopción verificados.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Medicall Expert' },
    { label: 'CID Zoho',             value: '162474' },
    { label: 'Sector',               value: 'Servicios médicos integrales · Naucalpan de Juárez, Estado de México' },
    { label: 'Servicio contratado',  value: 'Visibilidad y Control + Chat (IL) · Plan ilimitado de llamadas' },
    { label: 'MRR',                  value: '$6,831 MXN' },
    { label: 'Antigüedad',           value: '753 días activos (desde julio 2024)' },
    { label: 'Equipo de atención',   value: '39 asesores activos en canal saliente' },
    { label: 'Modelo de operación',  value: 'Outbound-first: 98.1% del tráfico es saliente (contacto proactivo con pacientes)' },
    { label: 'Health Score',         value: '61/100 (adopción 25/100 · pago 100/100)' },
  ],

  necesidad_negocio: 'Medicall Expert necesita reducir su tasa de pérdida saliente del 58% actual a niveles operativamente aceptables para una clínica de salud (<35%). La operación es de contacto proactivo con pacientes — confirmaciones, seguimiento clínico, gestión de citas — y cada llamada perdida es potencialmente una cita no confirmada o un seguimiento clínico que no llegó al paciente. Con 39 agentes y +8,000 llamadas/mes, la escala requiere proceso y tecnología de soporte, no solo más marcación.',

  potencial_corto: [
    'Auditoría de asesores con peor desempeño (Jahir 77.2%, Andrei 71.0%, Santiago 69.9%): coaching basado en brecha real documentada.',
    'Redistribuir carga de la ventana 14:00–15:00 (41.2% del volumen) a franjas de menor saturación (8:00–12:00 tiene tasa ~45–55%).',
    'Activar seguimiento KAM formal y registrar en CRM — la cuenta lleva 753 días sin gestión documentada.',
  ],
  potencial_largo: [
    'IA de Voz para absober la ventana de confirmaciones/recordatorios en 14:00–15:00: alivia saturación del equipo humano sin escalar headcount.',
    'Integración con Zoho CRM (ya en uso por el cliente) para depurar listas de marcación y medir conversión real por campaña.',
    'Módulos de grabación y monitoreo de calidad para cerrar la brecha de 34 puntos entre el mejor y el peor asesor.',
  ],

  tacticas: [
    {
      nombre:      'Cierre de brecha de asesores: coaching dirigido',
      descripcion: 'Priorizar a Jahir (77.2%), Andrei (71.0%) y Santiago (69.9%) con sesiones de escucha de llamadas y protocolo de marcación. El mejor referente interno es Fernando (44.2%) — la infraestructura técnica es idéntica para todos.',
      impacto:     'Si los 3 asesores de peor desempeño alcanzan el promedio del grupo (58%), se recuperan ~2,000–3,000 conexiones mensuales.',
    },
    {
      nombre:      'Redistribuir carga fuera de la ventana 14:00–15:00',
      descripcion: 'La franja 14:00–15:00 concentra el 41.2% del volumen con las peores tasas de pérdida. Distribuir marcación en horario de mañana (8:00–12:00, tasas 45–55%) reduce saturación y mejora conexión.',
      impacto:     'Mejora potencial en tasa de conexión del 3–5% redistribuyendo solo ese bloque horario.',
    },
    {
      nombre:      'Auditar calidad de listas de marcación',
      descripcion: 'El caso de 22 llamadas al mismo número en un día y 16,288 números únicos con 2.05 intentos promedio sugieren higiene de lista razonable pero con excepciones. Validar con el cliente si ciertas bases tienen tasas de pérdida sistemáticamente mayores.',
      impacto:     'Elimina marcación a listas de baja calidad que inflan el volumen sin mejorar contactos efectivos.',
    },
    {
      nombre:      'IA de Voz para franja de saturación',
      descripcion: 'Implementar IA de Voz para el bloque 14:00–15:00 para absorber confirmaciones de cita y recordatorios rutinarios. Libera a asesores humanos para llamadas de mayor complejidad.',
      impacto:     'Reduce saturación en la hora crítica y mejora la tasa de contacto efectivo del equipo humano.',
    },
  ],

  senal_alarma: 'La cuenta lleva 753 días activa con un solo ticket de soporte abierto, adopción en 25/100 sin ningún módulo verificado y cero seguimiento KAM registrado. La tasa de pérdida de 58% ha coexistido con un crecimiento de 7.5× — el cliente está escalando su operación sobre una plataforma que no está midiendo correctamente su desempeño.',

  problema_raiz:        'Operación outbound de alto volumen escalada sin proceso, capacitación ni tecnología de soporte proporcionales al crecimiento.',
  problema_raiz_detalle:'El problema no es de infraestructura (app-direct y SIP tienen tasas idénticas) ni de plan (ilimitado, sin incentivo a racionar llamadas). La tasa de pérdida empeoró al escalar el volumen y se estabilizó en nivel crítico: patrón típico de una operación que creció en personas y volumen sin escalar proceso, monitoreo de calidad ni automatización. La brecha de 34 puntos entre asesores (Gaby 43.1% vs. Jahir 77.2%) confirma que el problema es de ejecución individual y proceso, no sistémico. La saturación de la franja 14:00–15:00 (41% del volumen, peor tasa del día) agrava el impacto.',

  flujo_real: [
    { fase: 'Marcación',       area: '39 asesores',                      accion: 'Equipo marca de 8:00 a 19:00, concentración extrema en 14:00–15:00 (41% del volumen)',          resultado: '58% de los intentos no conectan. Peor resultado en la hora de mayor carga.' },
    { fase: 'Saturación pico', area: 'Franja 14:00–15:00',               accion: '13,740 llamadas en 2 horas — 4 de cada 10 llamadas del período se concentran aquí',          resultado: '60.9–61.8% de pérdida. El sistema humano no puede absorber ese volumen.' },
    { fase: 'Calidad asesor',  area: 'Asesores individuales',            accion: 'Jahir, Andrei y Santiago marcan con el mismo sistema técnico que Fernando y Gaby',            resultado: '34 puntos de brecha entre el mejor y el peor: diferencia de proceso, no de infraestructura.' },
    { fase: 'IVR entrantes',   area: 'Canal entrante (631 llamadas)',    accion: '89.7% de llamadas entrantes resueltas en IVR autoservicio sin llegar a un asesor',           resultado: 'Solo 7.4% se transfieren. No hay visibilidad de si el IVR resuelve o abandona la necesidad del paciente.' },
    { fase: 'KAM',             area: 'Callpicker · Dan Domínguez',       accion: 'Sin seguimiento KAM registrado en 753 días. Sin módulos de adopción verificados',             resultado: 'Cliente con alta tasa de pérdida crítica opera sin visibilidad de gestión activa de Callpicker.' },
  ],

  comparativo: [
    { metrica: 'Pérdida saliente',           real: '58.0% (19,319 de 33,326)',   ideal: '<30% para operación de contact proactivo' },
    { metrica: 'Adopción de producto',        real: '25/100 (0 módulos verificados)', ideal: '>60/100 con al menos 3 módulos activos' },
    { metrica: 'Brecha entre asesores',       real: '34 puntos (43.1% – 77.2%)', ideal: '<10 puntos con protocolo uniforme' },
    { metrica: 'Volumen hora crítica (14:00)', real: '41.2% del total diario',    ideal: '<20% — distribuir carga en franja matutina' },
    { metrica: 'Seguimiento KAM',             real: '0 actividades en 753 días', ideal: 'Mínimo 1 revisión mensual documentada' },
  ],

  plan_inmediato: [
    { accion: 'Realizar sesión de escucha de llamadas con Jahir, Andrei y Santiago — identificar patrones de marcación que explican la brecha de 34 puntos vs. Fernando/Gaby.', responsable: 'Dan Domínguez', criterio: 'Sesión realizada. Plan de coaching con 3 acciones concretas documentado.' },
    { accion: 'Validar con el cliente qué representa el 72.5% de llamadas de ≤1 minuto: si son confirmaciones breves (eficiencia) o desconexiones tempranas (problema de calidad).', responsable: 'Dan Domínguez', criterio: 'Cliente confirma propósito de marcación. Ajuste de análisis si es necesario.' },
    { accion: 'Investigar caso de 22 llamadas al mismo número el 18 de marzo con el cliente. Validar si es caso clínico o error de lista/dialer.', responsable: 'Dan Domínguez + Soporte', criterio: 'Caso documentado y aclarado con el cliente.' },
  ],
  plan_mediano: [
    { accion: 'Redistribuir carga de marcación fuera de la ventana 14:00–15:00. Proponer al cliente protocolo de distribución horaria basado en tasas de conexión por franja.', responsable: 'Dan Domínguez + cliente', criterio: 'Tasa de pérdida en franja 14:00–15:00 baja de 61% a <52% en 60 días.' },
    { accion: 'Activar módulos de adopción: verificar qué servicios del plan VyC + Chat están en uso real. Documentar en panel.', responsable: 'Dan Domínguez + Ingeniería', criterio: 'Adopción sube de 25/100 a ≥50/100. Al menos 2 módulos verificados activos.' },
    { accion: 'Establecer seguimiento KAM mensual con agenda de métricas: tasa de conexión, top asesores, distribución horaria.', responsable: 'Dan Domínguez', criterio: 'Primera reunión de revisión realizada. Frecuencia mensual comprometida.' },
  ],
  plan_estrategico: [
    { accion: 'Implementar IA de Voz para absorber confirmaciones/recordatorios en franja 14:00–15:00 — alivia saturación del equipo sin escalar headcount.', responsable: 'Dan + UX/Producto', criterio: 'IA de Voz activa en hora crítica. Tasa de pérdida global baja de 58% a <45%.' },
    { accion: 'Integrar Zoho CRM (ya en uso por el cliente) con Callpicker para depurar listas y medir conversión real por campaña de marcación.', responsable: 'Ingeniería + cliente IT', criterio: 'Integración activa. Primer reporte de conversión por campaña compartido con el cliente.' },
  ],

  areas_oportunidad: [
    { area: 'Coaching de asesores',         impacto: '~2,000–3,000 conexiones adicionales/mes si los 3 peores alcanzan el promedio', responsable: 'Dan Domínguez' },
    { area: 'Redistribución horaria',        impacto: '+3–5% tasa de conexión al aliviar saturación 14:00–15:00',                    responsable: 'Dan + cliente' },
    { area: 'IA de Voz (hora crítica)',      impacto: 'Escala operación sin escalar headcount en la franja de mayor saturación',      responsable: 'Producto + Dan' },
    { area: 'Activación módulos adopción',   impacto: 'Sube adopción de 25/100 a ≥60/100 — reduce riesgo silencioso de churn',       responsable: 'Dan + Ingeniería' },
  ],

  perfiles: [
    {
      nombre: 'Fernando',
      rol:    'Mejor asesor por tasa de conexión',
      color:  '#22c55e',
      campos: [
        { label: 'Llamadas salientes', value: '613' },
        { label: 'Pérdida',           value: '44.2% — mejor del equipo con volumen significativo' },
        { label: 'Nota',              value: 'Referente interno para coaching. Su protocolo debe documentarse y replicarse.' },
      ],
    },
    {
      nombre: 'Gaby',
      rol:    'Segunda mejor tasa de conexión',
      color:  '#3b82f6',
      campos: [
        { label: 'Llamadas salientes', value: '248' },
        { label: 'Pérdida',           value: '43.1%' },
        { label: 'Nota',              value: 'Confirma que la tasa promedio de 58% no es un límite técnico — hay margen de mejora.' },
      ],
    },
    {
      nombre: 'Jahir',
      rol:    'Asesor con mayor brecha de desempeño',
      color:  '#ef4444',
      campos: [
        { label: 'Llamadas salientes', value: '1,208' },
        { label: 'Pérdida',           value: '77.2% — 34 puntos sobre el mejor' },
        { label: 'Nota',              value: 'Prioridad 1 para coaching. Alto volumen + peor tasa = mayor impacto negativo en la operación.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Operación saliente consolidada y en uso diario intensivo (33,326 llamadas en 7 meses).',
      'Crecimiento real y sostenido del volumen: 7.5× entre enero y junio 2026.',
      '39 asesores con base para distribuir carga y replicar buenas prácticas (Fernando/Gaby).',
      '753 días de relación con pago puntual: 100/100 en componente de pago del Health Score.',
    ],
    oportunidades: [
      'Brecha de 34 puntos entre asesores: el potencial de mejora está en proceso y coaching, sin inversión tecnológica adicional.',
      'IA de Voz para la franja 14:00–15:00: alivia el cuello de botella más crítico del día.',
      'Canal entrante en crecimiento (7.5× en entrantes también) como oportunidad de captura mejorada.',
      'Integración Zoho CRM: el cliente ya usa la herramienta — la integración está a la mano.',
    ],
    debilidades: [
      '58.0% pérdida saliente sostenida — casi 6 de cada 10 intentos de contacto con pacientes fallan.',
      'Adopción de producto en 25/100 sin ningún módulo verificado en 753 días de relación.',
      'Cero seguimiento KAM documentado y un solo ticket de soporte abierto en toda la historia de la cuenta.',
      '72.5% de llamadas conectadas duran ≤1 minuto — sin confirmación de si resuelven la necesidad del paciente.',
    ],
    amenazas: [
      'Riesgo clínico/reputacional: la pérdida de contacto puede afectar confirmaciones de cita y seguimiento clínico.',
      'El problema se agrava si el volumen sigue creciendo sin intervención de proceso.',
      'Cuenta con alto volumen y buen historial de pago expuesta a fuga silenciosa por falta de gestión activa visible.',
    ],
  },

  conclusion: 'Medicall Expert es una cuenta crítica que opera en silencio: alto volumen, MRR real, crecimiento sostenido y pago puntual, pero con una tasa de pérdida de 58% que el cliente probablemente no está midiendo, y sin gestión KAM documentada en 753 días. El problema es de proceso y distribución operativa, no de infraestructura ni de plan. La brecha de 34 puntos entre asesores es la oportunidad de mejora inmediata más concreta: sin inversión adicional, replicar el protocolo de Fernando y Gaby en el equipo completo puede recuperar miles de conexiones mensuales. Esta cuenta necesita pasar de invisible a prioritaria en la agenda de gestión.',

  pierde: [
    'Contactar casi 6 de cada 10 pacientes en su canal de trabajo principal.',
    'Confirmaciones de cita y seguimiento clínico que no llegan al paciente.',
    'Visibilidad de qué módulos contratados están realmente en uso.',
  ],
  gana: [
    'Plan de coaching documentado con referente interno (Fernando/Gaby) — sin costo adicional.',
    'Redistribución de carga horaria que puede mejorar 3–5% la tasa de conexión en 30 días.',
    'Primera revisión KAM formal después de 753 días: el cliente percibirá valor inmediato de la atención.',
  ],
  recomendacion_central: 'Agendar sesión de revisión operativa con Medicall Expert esta semana — es la primera en 753 días. Presentar el análisis de pérdida por asesor y por franja horaria. Proponer plan de coaching a los 3 asesores con mayor brecha y redistribución de la carga de la ventana 14:00–15:00. En paralelo, verificar y documentar qué módulos del plan están realmente activos para subir la adopción de 25/100.',
}
