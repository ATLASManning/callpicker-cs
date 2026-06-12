import type { AuditoriaCase } from './types'

export const LABSUS: AuditoriaCase = {
  id: 'labsus',
  nombre: 'LABSUS Centro Diagnóstico',
  sector: 'Salud – Laboratorio Clínico / Imagenología Regional',
  fecha_periodo: '15 Feb – Jun 2026',
  fecha_auditoria: 'Jun 2026',
  tipo_cliente: 'Mid-Market – 3 sucursales · Monclova, Coahuila',
  descripcion_contexto: 'Grupo Huisu · 110 días activo · 4,044 llamadas analizadas · Competidores a la puerta',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Llamadas perdidas',     value: '513 (12.7%)',  color: '#ef4444' },
    { label: 'Pérdida ext. "juan"',   value: '97.9%',        color: '#ef4444' },
    { label: 'Pérdida a las 19h',     value: '79.2%',        color: '#f59e0b' },
    { label: 'Pérdida en Castaños',   value: '0%',           color: '#22c55e' },
  ],

  resumen_ejecutivo: 'LABSUS Centro Diagnóstico (Grupo Huisu S.A. de C.V.) es un laboratorio clínico con 38 años de trayectoria regional en Monclova, Coahuila. Cliente activo desde el 15 de febrero de 2026 — 110 días de operación analizada con 4,044 llamadas entrantes.\n\nEl análisis forense de llamadas revela un patrón crítico: la cuenta pierde el 12.7% de sus llamadas por problemas de configuración corregibles en 48 horas, no por capacidad insuficiente. La extensión "juan" (colaborador que ya no trabaja) acumula 97.9% de pérdida y 1 minuto útil en 110 días sin que nadie lo detectara. RECEPCION pierde el 38.3% por timbrado secuencial. Mientras tanto, Castaños opera al 0% de pérdida con la misma plataforma.\n\nEl riesgo inmediato: la alta dirección (estructura familiar) tiene propuestas de competidores con precios significativamente menores. La reunión del lunes define si LABSUS se retiene o se pierde a precio.',

  resultado_positivo: 'Castaños opera al 0% de pérdida y Miriam al 4%. La solución existe dentro de LABSUS — no requiere nueva inversión, solo replicar la configuración correcta. El análisis de 4,044 llamadas es el activo más poderoso para la reunión del lunes: nadie puede refutar los propios números del cliente. El argumento no es precio — es el costo de cambiar de proveedor sin historial, sin contexto y sin la mejora que ya está en marcha.',

  hallazgos: [
    'CRÍTICO — Extensión "juan" con 97.9% de pérdida: el colaborador ya no trabaja en la empresa. La extensión nunca fue desactivada. 48 llamadas, 1 minuto útil en 110 días. Nadie revisó el panel ni detectó el problema. Confirma ausencia total de ownership del sistema en el cliente.',
    'CRÍTICO — Timbrado secuencial en RECEPCION causa el 38.3% de pérdida: cada agente asume que el siguiente tomará la llamada. Jennyffer y Claudia ya acordaron cambiar a timbrado simultáneo por grupos. Corrección ejecutable en horas.',
    'ALTO — Horario 18:00–19:00h: 79.2% de pérdida (40 de 108 llamadas). Los pacientes que salen del trabajo no encuentran respuesta. Ese ingreso no regresa — llaman al siguiente laboratorio.',
    'ALTO — Domingos: 62.2% de pérdida (28 de 45 llamadas). Demanda real sin cobertura. Patrón perfecto para AI Voice Agent de agendamiento.',
    'ALTO — AI Voice Agent ya contratado pero no configurado correctamente. Parte del problema de llamadas perdidas en horario nocturno ya debía estar resuelto con herramientas que el cliente paga y no usa.',
    'ALTO — Competidores con precios significativamente inferiores ya cotizaron a la alta dirección. El lunes Callpicker no compite contra el mercado — compite contra esa cotización específica.',
    'MEDIO — Plan de 5,000 min subutilizado: el cliente usaba menos del 50%. La reducción a 2,500 fue la decisión correcta propuesta por José Manuel — mantiene el control de la narrativa.',
    'MEDIO — 98.3% de las llamadas sin evaluación de calidad (solo 69 de 4,044 evaluadas). Operación ciega: no se puede mejorar lo que no se mide.',
  ],

  cronologia: [
    { fecha: '15 Feb 2026',  responsable: 'Callpicker',                    evento: 'LABSUS activa como cliente. Inicio de los 110 días analizados. Plan de 5,000 min.', tipo: 'ok' },
    { fecha: 'Feb–May 2026', responsable: 'Operación LABSUS',              evento: 'Operación con extensión "juan" activa (colaborador que ya no trabaja). 97.9% de pérdida acumulando silenciosamente.', tipo: 'problema' },
    { fecha: 'Abr 2026',     responsable: 'Análisis de consumo',           evento: 'Plan de 5,000 min subutilizado — menos del 50% usado. Señal de que el plan original no correspondía al volumen real.', tipo: 'neutral' },
    { fecha: 'May–Jun 2026', responsable: 'Alta dirección LABSUS (familia)', evento: 'Alta dirección recibe propuestas de competidores con precios significativamente inferiores. Riesgo competitivo activado.', tipo: 'problema' },
    { fecha: 'Pre-lunes',    responsable: 'Jennyffer Soto / José Manuel', evento: 'Reunión de revisión de consumo. Confirmaciones críticas: "juan" sin desactivar, timbrado secuencial como causa de pérdida en RECEPCION, AV no configurado.', tipo: 'pivote' },
    { fecha: 'Pre-lunes',    responsable: 'José Manuel López',             evento: 'Decisión de reducir plan a 2,500 min — correcta y propuesta por Callpicker. Mantiene el control de la narrativa.', tipo: 'ok' },
    { fecha: 'Lunes (pending)', responsable: 'José Manuel + Claudia + Jennyffer', evento: 'Reunión de retención con demostración de valor basada en datos. Equipo de Chat para demo de WhatsApp. Próximo paso con fecha y responsable nominado.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'Grupo Huisu S.A. de C.V. — LABSUS Centro Diagnóstico' },
    { label: 'Giro',                  value: 'Lab clínico, imagenología, biología molecular, ultrasonido, Rayos X, ocupacional, ECG' },
    { label: 'Trayectoria',           value: 'Desde 1988 — 38 años como referente regional de Coahuila' },
    { label: 'Sucursales activas',    value: 'Matriz Tecnológico (Monclova) · San Buenaventura · Castaños' },
    { label: 'Número principal',      value: '(866) 190-6007' },
    { label: 'Digital',               value: 'Web con Lorem ipsum en /servicios/. Facebook 5,500 likes. CTA principal: "Agendar por WhatsApp"' },
    { label: 'Contacto operativo',    value: 'Jennyffer Soto — campeona interna (no decide)' },
    { label: 'Decisor real',          value: 'Alta dirección familiar — no estará en la reunión del lunes' },
    { label: 'Plan activo',           value: '2,500 min/mes (reducido de 5,000) — decisión de José Manuel' },
  ],

  necesidad_negocio: 'LABSUS es un laboratorio de diagnóstico clínico que depende del teléfono para convertir pacientes: el 100% de las citas pasa por llamada o WhatsApp. Cada llamada perdida es potencialmente un estudio que se fue con la competencia. Con un ticket promedio de $300–$1,500 MXN por estudio, las 513 llamadas perdidas en 110 días representan entre $46,000 y $230,000 MXN en ingreso no capturado (estimado 30% de intención real de estudio).\n\nEl cliente no percibe este costo porque no mide. Solo el 1.7% de las llamadas tienen evaluación de calidad. La reducción de costos que propone no es el problema real — es el síntoma de que no ven el valor. Cuando vean el valor, la conversación cambia.',

  potencial_corto: ['Desactivar extensión "juan" y activar timbrado simultáneo en RECEPCION antes del lunes', 'Reunión de retención con datos + demo de WhatsApp/Chat el lunes', 'Configurar AI Voice Agent para horario 18–20h y domingos — ya está contratado'],
  potencial_largo: ['CRM clínico-comercial: pacientes recurrentes, médicos referidores, empresas B2B', 'Bandeja omnicanal unificada (5 canales activos: Facebook, Instagram, TikTok, WhatsApp, voz)', 'Integración con sistema SAS si tiene API disponible — continuidad de contrato 12+ meses'],

  tacticas: [
    { nombre: 'Propuesta de reducción de costos como señal de valor no percibido', descripcion: 'El cliente propone recortar servicios — no porque el dinero no exista, sino porque no conecta el costo de Callpicker con el ingreso que protege', impacto: 'La respuesta correcta no es defenderse en precio. Es mostrar cuánto vale lo que ya paga con sus propios números.' },
    { nombre: 'Jennyffer como escudo de la dirección familiar', descripcion: 'No decide pero necesita argumentos para justificar la continuidad ante su dirección. Lenguaje: "convertir proveedores en aliados estratégicos", "justificar la continuidad"', impacto: 'Darle munición, no cotizaciones. Un brief de 1 página con ROI, riesgo de cambio y prueba interna (Castaños) es el entregable clave.' },
    { nombre: 'Competidor ya cotizó — precio específico, no rumor', descripcion: 'La alta dirección tiene una cotización concreta de un competidor con precio significativamente inferior. Jennyffer lo confirmó.', impacto: 'El argumento ganador: Callpicker ofrece 110 días de datos reales. Cambiar = empezar desde cero sin historial, sin contexto, sin la mejora en marcha.' },
  ],
  senal_alarma: 'Si Jennyffer llega al lunes sin haber visto los quick wins ejecutados (juan desactivado, timbrado simultáneo activo), Callpicker pierde credibilidad antes de abrir la presentación. Llegar con resultados — no con promesas.',

  problema_raiz: 'Ausencia de ownership y monitoreo del sistema — configuración incorrecta no detectada en 110 días',
  problema_raiz_detalle: 'La extensión "juan" acumuló 97.9% de pérdida durante 110 días sin que nadie en el cliente ni en Callpicker lo detectara. Eso confirma dos cosas: (1) el cliente no tiene ownership del sistema, nadie revisa el panel; (2) Callpicker tampoco tiene monitoreo proactivo de cuentas con destinos no funcionales. La diferencia entre Castaños (0% pérdida) y RECEPCION (38.3%) no es el producto — es la configuración. El mismo sistema, resultados opuestos. La solución existe dentro del cliente y es ejecutable en 48 horas.',

  flujo_real: [
    { fase: '1. Alta con plan sobredimensionado', area: 'Ventas / Activaciones',    accion: 'Contrato con 5,000 min/mes para laboratorio que consume menos del 50%', resultado: 'Subutilización evidente — argumento fácil para pedir reducción o cambio de proveedor.' },
    { fase: '2. Extensión muerta sin detectar',   area: 'LABSUS + Callpicker SAC', accion: '97.9% de pérdida en extensión de colaborador que ya no trabaja. Sin monitoreo ni alerta.', resultado: '48 llamadas perdidas, 1 min útil. Nadie revisa el panel — ni el cliente ni Callpicker.' },
    { fase: '3. Config secuencial en RECEPCION',  area: 'LABSUS',                  accion: 'Timbrado secuencial hace que los agentes asuman que el siguiente tomará la llamada', resultado: '38.3% de pérdida evitable. Confirmado y acordado en reunión pre-lunes.' },
    { fase: '4. AV contratado sin configurar',    area: 'Activaciones Callpicker', accion: 'AI Voice Agent pagado pero no funcionando correctamente. Horario nocturno sin cobertura.', resultado: '79.2% de pérdida a las 19h y 62.2% dominical sin resolución con herramienta ya contratada.' },
    { fase: '5. Competidor entra con precio',     area: 'Mercado / Alta dirección', accion: 'Cotización de competidor con precio inferior llega a la dirección familiar directamente', resultado: 'El valor de Callpicker no es visible porque nunca se midió ni se presentó en datos.' },
    { fase: '6. Reunión del lunes — momento bisagra', area: 'José Manuel + Claudia + Jennyffer', accion: 'Presentación de análisis de 4,044 llamadas + quick wins ya ejecutados + propuesta ajustada', resultado: 'Define si LABSUS renueva, reduce o cancela.' },
  ],

  comparativo: [
    { metrica: 'Extensión "juan" — pérdida',       real: '97.9% · 48 llamadas · 1 min útil',     ideal: '0% tras desactivación — ejecutable en minutos' },
    { metrica: 'RECEPCION — pérdida',              real: '38.3% con timbrado secuencial',         ideal: '<10% con timbrado simultáneo (modelo Castaños)' },
    { metrica: 'Horario 18–19h — pérdida',         real: '79.2% (40 de 108 llamadas)',            ideal: '<20% con AI Voice Agent nocturno (ya contratado)' },
    { metrica: 'Domingos — pérdida',               real: '62.2% (28 de 45 llamadas)',             ideal: '<15% con bot de agendamiento dominical' },
    { metrica: 'Llamadas con evaluación QA',       real: '1.7% (69 de 4,044)',                    ideal: '100% con grabación + evaluación automática' },
    { metrica: 'Ingreso potencial recuperable',    real: '$0 — 513 pacientes perdidos',           ideal: '~$92,000 MXN si 30% era intención real de estudio' },
  ],

  plan_inmediato: [
    { accion: 'Desactivar / redirigir extensión "juan" antes del lunes', responsable: 'José Manuel + Claudia', criterio: 'Extensión desactivada. Confirmación a Jennyffer antes de la reunión.' },
    { accion: 'Activar timbrado simultáneo en grupos de RECEPCION antes del lunes', responsable: 'José Manuel + Claudia', criterio: 'Config aplicada. Jennyffer puede verificarlo en su panel antes de la reunión.' },
    { accion: 'Revisar estado real del AI Voice Agent — qué está configurado y qué falta', responsable: 'Claudia Hernández', criterio: 'Respuesta clara antes del lunes. Si llegan sin esta respuesta y el cliente lo menciona, se pierde credibilidad.' },
    { accion: 'Preparar propuesta 2,500 min con argumento de ROI — no solo precio', responsable: 'Claudia (propuesta formal)', criterio: 'Propuesta lista antes del lunes. Incluye costo de Callpicker vs. ingreso perdido por 513 llamadas.' },
    { accion: 'Preparar brief de 1 página para Jennyffer: ROI, riesgo de cambio y prueba interna (Castaños)', responsable: 'José Manuel', criterio: 'Documento listo antes del lunes. Jennyffer lo usa con su dirección familiar.' },
    { accion: 'Confirmar equipo de Chat para demo de WhatsApp e integraciones en la misma sesión del lunes', responsable: 'José Manuel (coordinación)', criterio: 'Demo confirmada. Es la apertura más importante de negocio nuevo en la cuenta.' },
  ],
  plan_mediano: [
    { accion: 'Configurar AI Voice Agent para cobertura nocturna (18–20h) y dominical (62.2% de pérdida)', responsable: 'Activaciones + Jennyffer', criterio: 'AV nocturno activo en la semana post-reunión. Confirmar reducción de pérdida en primera semana.' },
    { accion: 'Verificar si el sistema SAS (sasslabsus.dyndns.org) tiene API pública disponible — integración como palanca de contrato 12 meses', responsable: 'Jennyffer (investigación) + apoyo José Manuel', criterio: 'Respuesta definida. Si hay API: propuesta de integración = continuidad garantizada.' },
    { accion: 'Documentar procesos de administración del sistema para evitar pérdida de conocimiento (riesgo "juan" futuro)', responsable: 'Jennyffer + Linda', criterio: 'Manual básico de configuración entregado al cliente en la semana post-reunión.' },
    { accion: 'Activar evaluación y grabación de llamadas — pasar de 1.7% a 100% de llamadas evaluadas', responsable: 'Claudia + Activaciones', criterio: 'Config activa. Primer dashboard de QA compartido con Jennyffer en 2 semanas.' },
  ],
  plan_estrategico: [
    { accion: 'Propuesta de CRM clínico-comercial: pacientes recurrentes (top 15 con 8–14 llamadas), médicos referidores, empresas B2B', responsable: 'José Manuel + Comercial', criterio: 'Propuesta entregada 30 días post-reunión si la cuenta se retiene.' },
    { accion: 'Bandeja omnicanal unificada: chat + redes + WhatsApp + voz — actualmente 5 canales fragmentados', responsable: 'Equipo de Chat + SAC', criterio: 'Demo ejecutada el lunes. Propuesta formal en 2 semanas si hay apertura.' },
    { accion: 'Documentar LABSUS como caso de retención por valor demostrado con datos — replicable en cuentas con propuestas de competidores', responsable: 'VP SAC', criterio: 'Caso documentado 60 días post-reunión si la retención fue exitosa.' },
  ],
  areas_oportunidad: [
    { area: 'Replicar modelo Castaños (0% pérdida) en Monclova y San Buenaventura',   impacto: 'Sin costo adicional. Solo configuración. Reducción de pérdida de 38.3% → <10% en RECEPCION.', responsable: 'José Manuel + Claudia — antes del lunes' },
    { area: 'AI Voice Agent nocturno y dominical (ya contratado)',                      impacto: 'Cubre 79.2% de pérdida a las 19h y 62.2% dominical con herramienta existente. Costo: $0 adicional.', responsable: 'Activaciones — post-reunión' },
    { area: 'CRM clínico con 3 pipelines: pacientes, médicos referidores, empresas B2B', impacto: '513 pacientes perdidos rastreables. Top 15 con 8–14 llamadas sin gestión = base de CRM lista.', responsable: 'Comercial + José Manuel' },
    { area: 'Integración con sistema SAS si tiene API',                                 impacto: 'Si se confirma: continuidad de contrato por 12 meses garantizada. Callpicker se vuelve indispensable.', responsable: 'Jennyffer (verificación) + Ingeniería CP' },
  ],

  perfiles: [
    {
      nombre: 'Jennyffer Soto', rol: 'Cliente (LABSUS) — Campeona interna · No decide · Opera bajo estructura familiar', color: '#3b82f6',
      campos: [
        { label: 'Rol real',           value: 'Quiere que Callpicker gane pero no puede defenderlo solo con precio. Necesita munición para su dirección.' },
        { label: 'Lenguaje clave',     value: '"Aliados estratégicos", "justificar la continuidad", "convertir proveedores en aliados"' },
        { label: 'Qué necesita',       value: 'Argumentos para su dirección familiar: ROI claro, riesgo de cambio, prueba interna (Castaños). No una cotización — armas para defender.' },
        { label: 'Riesgo',             value: 'Si llega al lunes sin quick wins visibles, no puede defender a Callpicker ante su dirección.' },
        { label: 'Entregable clave',   value: 'Brief de 1 página: ROI vs. ingreso perdido + riesgo de cambiar + Castaños como prueba interna irrefutable.' },
      ],
    },
    {
      nombre: 'Alta Dirección LABSUS (familia)', rol: 'Cliente (LABSUS) — Decide · No estará en la reunión del lunes', color: '#ef4444',
      campos: [
        { label: 'Perfil decisor',     value: 'Estructura familiar. Comparan por precio pero deciden por riesgo y confianza.' },
        { label: 'Qué necesitan escuchar', value: 'ROI claro: costo de Callpicker vs. ingreso perdido por llamadas. Riesgo de cambiar: sin historial, sin contexto, sin soporte. Prueba interna: Castaños ya funciona.' },
        { label: 'Argumento ganador',  value: '"La competencia ofrece un precio. Callpicker ofrece 110 días de datos reales de su operación. Cambiar significa empezar desde cero."' },
        { label: 'Canal de acceso',    value: 'Solo a través de Jennyffer. El brief que se le entregue a ella es lo que llega a la dirección.' },
      ],
    },
    {
      nombre: 'Claudia Hernández', rol: 'Callpicker SAC — Ejecutivo de cuenta · Prepara la propuesta del lunes', color: '#22c55e',
      campos: [
        { label: 'Rol crítico',        value: 'Debe llegar alineada en narrativa, no solo en precio. El tema del AV no configurado requiere respuesta antes de la reunión.' },
        { label: 'Pendiente urgente',  value: 'Verificar estado real del AI Voice Agent antes del lunes. Sin esta respuesta: riesgo de credibilidad.' },
        { label: 'Propuesta',          value: 'Propuesta 2,500 min con argumento de ROI. No defender precio — mostrar valor demostrado con datos.' },
      ],
    },
    {
      nombre: 'José Manuel López', rol: 'Callpicker — Liderazgo · Coordina la reunión del lunes', color: '#f59e0b',
      campos: [
        { label: 'Acierto ejecutado',  value: 'Propuso la reducción a 2,500 min antes de que el cliente lo pidiera. Mantiene el control de la narrativa.' },
        { label: 'Rol en la reunión',  value: 'Presentar los datos de 4,044 llamadas. Coordinar la demo de WhatsApp/Chat. Cerrar con siguiente paso con fecha y responsable.' },
        { label: 'Instrucción clave',  value: 'No competir en precio contra la oferta del competidor. Ese es un juego perdido. El argumento es el riesgo de cambiar + valor demostrado.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Castaños: 0% de pérdida — prueba interna irrefutable de que el sistema funciona',
      'Miriam (agente ancla): 4% de pérdida en 2,535 llamadas — rendimiento óptimo',
      '110 días de datos reales que ningún competidor puede ofrecer',
      'AI Voice Agent ya contratado — inversión ya hecha, solo falta configuración',
      'José Manuel tomó la delantera en reducir el plan — narrativa de aliado, no de proveedor',
      'Jennyffer como campeona interna dispuesta a defender Callpicker con los argumentos correctos',
    ],
    oportunidades: [
      'Quick wins antes del lunes (juan + timbrado simultáneo) = credibilidad inmediata sin costo',
      'AI Voice Agent nocturno: 79.2% pérdida a las 19h y 62.2% dominical — caso de negocio cuantificable',
      'CRM clínico: top 15 pacientes con 8–14 llamadas sin gestión = base de datos lista',
      'Integración con SAS si tiene API = continuidad de contrato garantizada por 12 meses',
      'WhatsApp + omnicanal: CTA principal del sitio sin pipeline ni métricas — oportunidad de transformación',
      '38 años de trayectoria + vacante de "Asistente de mkt y ventas" = señal de intención de crecer',
    ],
    debilidades: [
      'AV contratado y no configurado correctamente — cliente paga sin recibir el beneficio',
      'Extensión "juan" activa durante 110 días sin detección — ausencia de monitoreo proactivo',
      'Solo 1.7% de llamadas evaluadas — operación ciega sin QA ni métricas de calidad',
      'Plan de 5,000 min sobredimensionado desde la venta — argumento fácil para reducción',
      'Portal sasslabsus.dyndns.org en dominio dinámico — riesgo de disponibilidad para datos de salud',
    ],
    amenazas: [
      'Cotización específica de competidor ya en manos de la alta dirección familiar',
      'Decisión tomada por familia que no estará en la reunión — el filtro es Jennyffer',
      'Si los quick wins no están ejecutados antes del lunes, la credibilidad cae antes de empezar',
      'Conocimiento del sistema concentrado en Jennyffer sin documentación — riesgo de otro "juan" en 3 meses',
      'WhatsApp como canal principal sin pipeline ni SLA — pérdida silenciosa de conversiones',
    ],
  },

  conclusion: 'LABSUS no se pierde porque el producto sea inferior. Se pierde si Callpicker llega al lunes a defender un precio en lugar de presentar 110 días de datos que el competidor no puede ofrecer. La diferencia entre Castaños (0% pérdida) y RECEPCION (38.3%) es la misma plataforma con diferente configuración. Si eso se demuestra el lunes — con los quick wins ya ejecutados y el argumento del riesgo de cambiar — Jennyffer tiene todo lo que necesita para defender Callpicker ante su dirección familiar.',

  pierde: [
    'Una cuenta activa de $2,500 min/mes con potencial de expansión a CRM + omnicanal',
    'La credibilidad si el competidor puede ofrecer lo mismo a menor precio sin ser rebatido con datos',
    'El caso de éxito de retención más claro del portafolio — datos + quick wins + narrativa',
    '38 años de referente regional que puede volverse una referencia negativa si sale mal',
  ],
  gana: [
    'Retención de la cuenta con expansión a AI Voice Agent nocturno + WhatsApp + CRM clínico',
    'Jennyffer como defensora interna con argumentos sólidos ante la dirección familiar',
    'Metodología de retención por valor demostrado con datos — replicable en cualquier cuenta con propuestas de competidores',
    'Caso de éxito: Callpicker como aliado estratégico que detectó problemas antes que el propio cliente',
  ],
  recomendacion_central: 'Antes del lunes: desactivar "juan", activar timbrado simultáneo en RECEPCION, verificar el AI Voice Agent. En la reunión del lunes: no defender precio — presentar los datos, mostrar el costo de las 513 llamadas perdidas, entregar a Jennyffer el brief de 1 página para su dirección. Cerrar con un siguiente paso con fecha y responsable nominado. Si se sale del lunes sin ese compromiso, el competidor cierra.',
}
