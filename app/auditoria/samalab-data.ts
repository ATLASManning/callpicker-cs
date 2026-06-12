import type { AuditoriaCase } from './types'

export const SAMALAB: AuditoriaCase = {
  id: 'samalab',
  nombre: 'SAMALAB',
  sector: 'Salud – Centro Radiológico / Laboratorios de Imagen',
  fecha_periodo: 'Marzo 2024 – Junio 2026',
  fecha_auditoria: 'Jun 2026',
  tipo_cliente: 'Mid-Market – 10 sucursales · ~50 empleados',
  descripcion_contexto: 'CID 156135 · Auditoría Definitiva · AV en pausa · Exposición contractual activa',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '2.0 — Definitiva (con respuesta del cliente)',

  kpis: [
    { label: 'Factura mensual',      value: '$31,386',  color: '#ef4444' },
    { label: 'Score del AV',         value: '6.3 / 10', color: '#f59e0b' },
    { label: 'Tools bloqueadas',     value: '180',      color: '#ef4444' },
    { label: 'Estado del AV',        value: 'PAUSADO',  color: '#6366f1' },
  ],

  resumen_ejecutivo: 'SAMALAB (CID 156135) es un Centro Radiológico con 10 sucursales que contrató el Agente Virtual de Callpicker en mayo de 2025. El AV fue puesto en producción el 20 de marzo de 2026 y suspendido técnicamente el 9 de junio de 2026 — por decisión del cliente.\n\nEl 9 de junio, Ari (Araceli Vergara) confirmó por escrito la Opción A: pausa del AV + baja de extensión adicional. El mismo día reportó que la factura era de $31,386.29 y que el contrato firmado no menciona el modelo de cobro por saldo. Esta es la exposición crítica activa: 48 horas para revisar el contrato con Joaquín, generar el desglose de factura y responder formalmente.\n\nLa cuenta base de telefonía opera con normalidad ($2,067/mes). El caso no está cerrado — está pausado. La puerta a la reactivación estará abierta cuando el CRM interno de SAMALAB esté listo para integración.',

  resultado_positivo: 'El AV funcionaba técnicamente: tono alto, transferencias sin falla, capacidad de cotizar cuando el catálogo respondía. Lo que falló fue el proceso que lo rodeó. Ari sigue respondiendo correos, eligió con información y usó el canal formal — señal de cliente deteriorado pero preservado. La relación puede recuperarse. "SAMALAB puede volver" es la conclusión del equipo interno.',

  hallazgos: [
    'CRÍTICO — El contrato firmado posiblemente no documenta el modelo de cobro por saldo/tokens. Ari lo reportó por escrito el 9 jun: "Al revisar el contrato firmado no hemos encontrado dónde se menciona este esquema de cobro bajo consumo de saldo del Agente Virtual." Exposición comercial y potencialmente legal activa. Revisión urgente con Joaquín en 48 hrs.',
    'CRÍTICO — Brecha de precio 10x no anticipada: plan base $3,000/mes (~1,000 min) para un laboratorio con 10 sucursales y 4,841 min/mes de consumo real. El costo real fue $14,500–$31,386/mes. Nadie en el proceso de venta verificó el volumen de llamadas antes de cerrar el contrato.',
    'ALTO — 180 tools bloqueadas detectadas 11 semanas después del lanzamiento (reporte ATC del 3 jun). El AV contestaba "No encontramos el estudio solicitado" en el 41.6% de casos — por sinónimos de estudios no registrados en el catálogo. Sin monitoreo post-lanzamiento.',
    'ALTO — CRM del cliente en desarrollo no contemplado en la propuesta técnica. David asumió Google Calendar como solución definitiva. El objetivo real del cliente incluía integración CRM para automatizar el flujo completo de citas.',
    'ALTO — Incidencia del 23 de mayo: el AV cotizó $3,370 por una "tomografía contrastada" que no existe en el catálogo de estudios. ID 3479054742. Resuelta, pero reflejó la falta de control de catálogo.',
    'MEDIO — Sin área ni criterio centralizado de precios para el AV. Comercial es juez y parte. José Manuel: "4 años operando así está muy cañón." Mismo problema detectado en Finsus (funcionalidad cotizada a precios distintos en diferentes departamentos).',
    'SISTÉMICO — El mismo patrón existe en otras cuentas de AV activas: Salud y Hogar (AV sin configuración adecuada), LABSUS (cliente que contrató ya no labora), Finsus (downgrade forzado). David Avilés: "De todos los agentes virtuales que tenemos, por ninguno prevalece."',
  ],

  cronologia: [
    { fecha: 'Mar 2024',    responsable: 'J. Negrete (Ventas)',            evento: 'Activación de cuenta SAMALAB en #ventas-activaciones.', tipo: 'ok' },
    { fecha: 'May 2024',    responsable: 'Enrique Gudiño',                 evento: 'Ticket cerrado CID 156135. Manuel Díaz como contacto inicial.', tipo: 'ok' },
    { fecha: 'Oct 2024',    responsable: 'Pablo Soto',                     evento: 'Portabilidad normal (ID 15613). Estatus final por confirmar.', tipo: 'neutral' },
    { fecha: 'Mar 2025',    responsable: 'SAMALAB',                        evento: 'Cancelación por falta de pago. Manuel Díaz ya no labora. Faviola Sánchez nueva admin. Resuelto.', tipo: 'problema' },
    { fecha: 'May 2025',    responsable: 'J. Negrete + Toño',              evento: 'Reunión Discovery IA — $5,000 MXN pagados. Inicio del proceso de venta del AV.', tipo: 'ok' },
    { fecha: 'Nov 2025',    responsable: 'David Avilés (Ingeniería)',       evento: 'Proyecto AV Etapa 1 creado. Estimación: 38 hrs. Plataforma sin módulo de integración al momento.', tipo: 'ok' },
    { fecha: 'Ene 2026',    responsable: 'David Avilés',                   evento: 'Desarrollo iniciado — 6 meses de retrasos por parte del cliente en entregar información del catálogo.', tipo: 'neutral' },
    { fecha: '20 Mar 2026', responsable: 'Ingeniería Callpicker',          evento: 'AV de Voz Etapa 1 puesto en producción. Lanzamiento formal.', tipo: 'ok' },
    { fecha: '23 Mar 2026', responsable: 'SAMALAB — reporte',              evento: 'AV no identifica pregunta sobre sucursales Texcoco. Error no resuelto antes de la pausa.', tipo: 'problema' },
    { fecha: 'Abr 2026',    responsable: 'Ari (SAMALAB)',                  evento: 'Solicita flujo dedicado de promociones — fuera del alcance original. Sin cotización formal.', tipo: 'problema' },
    { fecha: '22 Abr 2026', responsable: 'Ari',                            evento: 'Primera solicitud de baja de extensión adicional VyC. Sin procesar.', tipo: 'problema' },
    { fecha: '19 May 2026', responsable: 'Ari',                            evento: 'Reporte de variaciones en factura: $3,480 → $10,819 → $20,044. Explicado en reunión.', tipo: 'problema' },
    { fecha: '23 May 2026', responsable: 'AV / Catálogo SAMALAB',          evento: 'Incidencia: AV cotizó $3,370 por "tomografía contrastada" inexistente. ID 3479054742. Resuelta.', tipo: 'problema' },
    { fecha: '28 May 2026', responsable: 'Ingeniería + Activaciones',      evento: 'Reunión: consumo confirmado en 4,841 min/mes ≈ $14,500. Brecha vs. plan base de $3,000 documentada.', tipo: 'pivote' },
    { fecha: '29 May 2026', responsable: 'David Avilés',                   evento: 'Estimación formal: 12 hrs para reconfiguración del AV. No aprobada por el cliente — sin presupuesto.', tipo: 'problema' },
    { fecha: '3 Jun 2026',  responsable: 'Reporte ATC',                    evento: '433 llamadas · 49% objetivo logrado · 180 tools bloqueadas · Score 6.3. Datos revelados 11 semanas después del lanzamiento.', tipo: 'problema' },
    { fecha: '9 Jun AM',    responsable: 'Ingeniería + SAC (reunión)',      evento: 'Decisión interna: suspender el AV. Diagnóstico compartido.', tipo: 'pivote' },
    { fecha: '9 Jun PM',    responsable: 'Ari (Araceli Vergara)',           evento: 'Confirma Opción A por correo: pausa del AV + baja extensión adicional. Decisión escrita formal del cliente.', tipo: 'ok' },
    { fecha: '9 Jun PM',    responsable: 'Ari — correo',                   evento: 'Reporta factura $31,386.29 y que el contrato firmado no menciona el modelo de saldo/tokens. Exposición contractual activada.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social / RFC',   value: 'Laboratorios SAMALAB · CRS2301264SA · CID 156135' },
    { label: 'Actividad',            value: 'Centro Radiológico de Estudios Especiales · 10 sucursales' },
    { label: 'Segmento',             value: 'Mediana empresa · ~50 empleados · Salud' },
    { label: 'Contacto principal',   value: 'Ari (Araceli Vergara)' },
    { label: 'KAM asignada',         value: 'Fátima González — seguimiento mensual requerido' },
    { label: 'MRR base activo',      value: '$2,067 MXN · 3 Extensiones VyC IL' },
    { label: 'Última factura',       value: '$31,386.29 MXN — 9 Jun 2026' },
    { label: 'Pagos de desarrollo',  value: '3 de 6 pendientes — mantener en fechas acordadas' },
  ],

  necesidad_negocio: 'SAMALAB contrató el Agente Virtual para automatizar el flujo de atención telefónica en sus 10 sucursales radiológicas: recibir solicitudes de estudios, cotizar en tiempo real desde su catálogo y agendar citas. El objetivo implícito — mencionado en el Discovery pero no documentado formalmente — era la integración del AV con el CRM interno del cliente (en desarrollo al momento de la venta).\n\nEl modelo de negocio del AV requería que el catálogo de estudios fuera mantenido activamente por el cliente (sinónimos, precios, disponibilidad). Este requisito no fue comunicado ni aceptado formalmente. Resultado: 180 bloqueos de catálogo detectados 11 semanas después del lanzamiento.',

  potencial_corto: ['Resolver exposición contractual en 48 hrs (Joaquín + desglose Daniel)', 'Ejecutar pausa técnica del AV (David Avilés esta semana)', 'Procesar baja de extensión adicional — segunda solicitud formal de Ari'],
  potencial_largo: ['Reactivación del AV cuando el CRM interno de SAMALAB esté listo para integración', 'Ejecutivo de Satisfacción post-lanzamiento como garantía de proceso mejorado', 'SAMALAB como caso de éxito de rescate si la reactivación se ejecuta correctamente'],

  tacticas: [
    { nombre: 'Elección documentada y formal',     descripcion: 'Ari confirmó Opción A por correo con tono profesional. No hay amenaza ni hostilidad — solo una decisión informada ante datos que el cliente procesó por su cuenta', impacto: 'Cliente deteriorado pero preservado. La puerta a reactivar está abierta. La próxima interacción define si se cierra.' },
    { nombre: 'Señal contractual como palanca',    descripcion: '"Al revisar el contrato firmado no hemos encontrado dónde se menciona este esquema de cobro" — Ari, 9 jun 2026', impacto: 'No es una amenaza legal directa. Es una señal de que el cliente se sintió sorprendido. La respuesta en 48 hrs define si esa sorpresa se convierte en disputa.' },
    { nombre: 'Paciencia de 6 meses en discovery', descripcion: 'El cliente tardó 6 meses en entregar el catálogo de información necesaria para construir el AV. A pesar de eso, no canceló — siguió esperando', impacto: 'Alta tolerancia a retrasos cuando hay compromiso percibido. Tiene hambre de que funcione.' },
  ],
  senal_alarma: 'Si Callpicker no responde formalmente a Ari en 48 horas sobre el contrato y la factura, la relación pasa de "deteriorada pero preservada" a "deteriorada e irrecuperable". El silencio post-elección es el mayor riesgo actual.',

  problema_raiz: 'Proceso comercial roto en 7 eslabones — desde la estimación de preventa hasta el seguimiento post-lanzamiento',
  problema_raiz_detalle: '"SAMALAB no es un problema de producto. Es el resultado de un proceso comercial roto en múltiples eslabones." — Conclusión reunión interna, 9 jun 2026.\n\nEl AV funcionaba. Lo que no funcionó: (1) nadie verificó el volumen de llamadas antes de vender; (2) el modelo de saldo no quedó documentado en el contrato; (3) el CRM en desarrollo no se incluyó en el alcance; (4) no hubo monitoreo en las primeras 11 semanas de producción; (5) los 180 bloqueos de catálogo se detectaron demasiado tarde; (6) sin área de precios centralizada, el comercial fijó una expectativa de $3K que el cliente interpretó como costo tope.',

  flujo_real: [
    { fase: '1. Preventa sin discovery técnico',   area: 'Ventas — J. Negrete',         accion: 'Vendió AV sin verificar volumen de llamadas ni número de estudios del catálogo', resultado: 'Plan base $3K/mes para 4,841 min/mes de consumo real. Expectativa de precio 10x menor.' },
    { fase: '2. Contrato sin modelo de saldo',      area: 'Comercial / Legal',            accion: 'El contrato no documenta el esquema de cobro por saldo/tokens ni el costo por minuto', resultado: 'Exposición contractual activa descubierta el 9 jun 2026 por el cliente, no por Callpicker.' },
    { fase: '3. CRM no contemplado en alcance',    area: 'David Avilés — Discovery',     accion: 'Cliente mencionó CRM en desarrollo. Se implementó Google Calendar como alternativa sin documentarlo como Fase 2', resultado: 'El objetivo real del cliente no fue entregado. El AV quedó a medio camino de lo que necesitaban.' },
    { fase: '4. Lanzamiento sin monitoreo activo', area: 'Ingeniería / SAC',             accion: 'AV lanzado el 20 mar sin seguimiento activo en las primeras semanas de producción', resultado: '180 bloqueos de catálogo acumulados 11 semanas. Score 6.3. 49% de objetivo logrado.' },
    { fase: '5. Catálogo sin mantenimiento',       area: 'SAMALAB (cliente)',            accion: 'El cliente no monitoreó ni actualizó sinónimos de estudios en el catálogo', resultado: '41.6% de bloqueos era evitable. El cliente nunca entendió que era su responsabilidad.' },
    { fase: '6. Respuesta tardía a señales',       area: 'SAC / Comercial',              accion: 'Las variaciones de factura (may), la solicitud de baja de extensión (abr) y el error de Texcoco (mar) no se atendieron con urgencia', resultado: 'Acumulación de fricciones que culminó en la decisión del 9 jun.' },
    { fase: '7. Decisión y exposición contractual', area: 'Ari (cliente) + Callpicker',  accion: 'Cliente decide pausar el AV. Descubre que el contrato no documenta el modelo de cobro', resultado: 'Exposición activa. 48 horas para responder formalmente.' },
  ],

  comparativo: [
    { metrica: 'Consumo esperado (preventa)',       real: '~1,000 min/mes ($3,000/mes)',     ideal: 'Estimación real previa: 4,841 min/mes ($14,500/mes)' },
    { metrica: 'Costo real último mes',            real: '$31,386.29 MXN (factura jun)',    ideal: 'Expectativa del cliente: ~$3,000–$5,000/mes' },
    { metrica: 'Score del AV al cierre',           real: '6.3 / 10 — 49% objetivo',        ideal: 'Meta mínima esperada: 8.0 / 10 — 80% objetivo' },
    { metrica: 'Tools bloqueadas detectadas',      real: '180 — semana 11 post-lanzamiento', ideal: '0 en las primeras 2 semanas con Ejecutivo de Satisfacción' },
    { metrica: 'Modelo de saldo en contrato',      real: 'No documentado — exposición activa', ideal: 'Cláusula explícita con costo por minuto (~$3) y mecánica de excedentes' },
    { metrica: 'Estado del AV',                    real: 'Pausado — Opción A elegida',      ideal: 'Activo con integración CRM completada' },
  ],

  plan_inmediato: [
    { accion: 'Revisar contrato firmado SAMALAB — verificar si incluye el modelo de saldo/tokens', responsable: 'Joaquín + José Manuel', criterio: 'Revisión completada en máx. 48 hrs. Posición definida antes de responder a Ari.' },
    { accion: 'Generar desglose exacto de factura $31,386.29 por concepto y período', responsable: 'Daniel Martínez', criterio: 'Desglose listo en 48 hrs para incluir en respuesta formal a Ari' },
    { accion: 'Enviar respuesta formal a Ari sobre contrato y factura — no dejar el silencio post-elección', responsable: 'VP SAC + Joaquín', criterio: 'Correo formal enviado máx. 48 hrs post-elección del 9 jun' },
    { accion: 'Ejecutar pausa técnica del AV', responsable: 'David Avilés', criterio: 'Pausa confirmada técnicamente y comunicada a Ari esta semana' },
    { accion: 'Procesar baja de extensión adicional VyC — segunda solicitud formal (primera: 22 abr)', responsable: 'Soporte / Toño del Río', criterio: 'Baja procesada y fecha de aplicación confirmada a Ari esta semana' },
  ],
  plan_mediano: [
    { accion: 'Sesión con liderazgo de ventas (Nacho, Ricardo): discovery técnico, fijación de precios y documentación del modelo de saldo en contratos', responsable: 'José Manuel + Joaquín', criterio: 'Sesión ejecutada la próxima semana. Protocolo actualizado.' },
    { accion: 'Implementar Ejecutivo de Satisfacción post-lanzamiento — piloto con Frisa y TEC de Monterrey', responsable: 'David + Satisfacción', criterio: 'Piloto activo esta semana. Métricas definidas.' },
    { accion: 'Auditar todas las cuentas activas de AV — identificar cuántos clientes están en situación similar a SAMALAB', responsable: 'Daniel Martínez + SAC', criterio: 'Auditoría completada esta semana. Salud y Hogar como prioritaria.' },
    { accion: 'Formalizar protocolo de verificación de volumen antes de vender AV — Ricardo ya lo está incorporando', responsable: 'Ricardo + Producto', criterio: 'Requisito no negociable en todas las ventas de AV desde esta semana' },
  ],
  plan_estrategico: [
    { accion: 'Contacto mensual con Fátima González (KAM) y Ari para seguimiento de estado del CRM interno de SAMALAB', responsable: 'Fátima González', criterio: 'Llamada mensual agendada. SAMALAB no se abandona.' },
    { accion: 'Cuando el CRM de SAMALAB esté listo: evaluar integración AV ↔ CRM, estimar horas con Joaquín y aplicar el proceso del Ejecutivo de Satisfacción desde el día 1', responsable: 'David Avilés + Joaquín + SAC', criterio: 'Propuesta lista en < 5 días hábiles desde que el cliente notifique disponibilidad del CRM' },
    { accion: 'Documentar SAMALAB como caso de lecciones aprendidas y difundir a Ventas, Ingeniería y SAC', responsable: 'VP SAC + José Manuel', criterio: 'Documento distribuido en la sesión de liderazgo de la próxima semana' },
    { accion: 'Evaluar criterio centralizado de precios para el AV — comercial no puede seguir siendo juez y parte', responsable: 'Dirección + Finanzas', criterio: 'Propuesta de estructura de precios presentada a Dirección este trimestre' },
  ],
  areas_oportunidad: [
    { area: 'Ejecutivo de Satisfacción post-lanzamiento como producto de retención',   impacto: '180 bloqueos detectados en semana 11 → habrían sido detectados en semana 1. Previene el próximo SAMALAB.', responsable: 'David + SAC (piloto: Frisa y TEC)' },
    { area: 'Documentación del modelo de saldo en todos los contratos de AV',           impacto: 'Elimina la exposición contractual. El cliente no puede decir que no lo sabía.', responsable: 'Legal + Comercial — revisión urgente' },
    { area: 'Reactivación SAMALAB cuando CRM esté listo',                              impacto: 'Cliente con catálogo actualizado, CRM integrado y proceso mejorado = caso de éxito real.', responsable: 'Fátima + David + Joaquín' },
    { area: 'Área de precios centralizada para el AV',                                  impacto: 'Elimina las discrepancias entre vendedores. Alineación de expectativas desde la preventa.', responsable: 'Dirección + Finanzas (este trimestre)' },
  ],

  perfiles: [
    {
      nombre: 'Ari (Araceli Vergara)', rol: 'Cliente (SAMALAB) — Contacto principal · Decisora operativa', color: '#3b82f6',
      campos: [
        { label: 'Comportamiento',     value: 'Profesional y documentada. Eligió por correo, no por teléfono. Usó el canal formal.' },
        { label: 'Motivación',         value: 'Un AV que realmente funcione para cotizar y agendar estudios en 10 sucursales.' },
        { label: 'Estado emocional',   value: 'Desilusionada, no hostil. "Deteriorada pero preservada" — sigue respondiendo.' },
        { label: 'Señal positiva',     value: 'Eligió pausar, no cancelar. La cuenta base sigue activa. La puerta no está cerrada.' },
        { label: 'Clave de gestión',   value: 'Respuesta formal en 48 hrs sobre contrato y factura. El silencio aquí es lo peor que puede pasar.' },
      ],
    },
    {
      nombre: 'David Avilés', rol: 'Callpicker — Ingeniería · Responsable técnico del AV', color: '#8b5cf6',
      campos: [
        { label: 'Rol en el caso',     value: 'Constructor y responsable técnico del AV. Tomó la decisión interna de suspenderlo el 9 jun.' },
        { label: 'Diagnóstico propio', value: '"De todos los agentes virtuales que tenemos, por ninguno prevalece." — honestidad crítica y valiosa.' },
        { label: 'Acierto',            value: 'Fue quien identificó que Google Sheets podía ser punto de partida y el CRM la Fase 2. Propuesta técnica correcta pero tardía.' },
        { label: 'Acción pendiente',   value: 'Ejecutar pausa técnica del AV esta semana. Confirmar por correo a Ari.' },
      ],
    },
    {
      nombre: 'Fátima González', rol: 'Callpicker — KAM asignada para seguimiento post-pausa', color: '#22c55e',
      campos: [
        { label: 'Responsabilidad',    value: 'Seguimiento mensual con Ari. SAMALAB no debe perderse de vista mientras espera el CRM.' },
        { label: 'Objetivo',           value: 'Mantener la relación activa y detectar cuando el CRM de SAMALAB esté listo para reactivar.' },
        { label: 'Instrucción clave',  value: 'Primera llamada de seguimiento: semana después de la respuesta formal sobre el contrato.' },
      ],
    },
    {
      nombre: 'José Manuel López', rol: 'Callpicker — Liderazgo · Diagnóstico sistémico del caso', color: '#f59e0b',
      campos: [
        { label: 'Frase clave',        value: '"A fin de año: ¿cuántos agentes hiciste? Veinte. ¿De esos veinte, cuántos están vivos? Dos." — 9 jun 2026' },
        { label: 'Diagnóstico',        value: '"4 años operando sin área de precios centralizada está muy cañón." — Señal de problema estructural, no puntual.' },
        { label: 'Responsabilidad',    value: 'Liderar sesión con Nacho y Ricardo para abordar fijación de precios y discovery técnico en todas las ventas de AV.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cuenta base activa y pagando — $2,067/mes en telefonía sin fricción',
      'Ari eligió pausar, no cancelar — relación preservada',
      'AV técnicamente funcional: tono alto, transferencias sin falla, cotizaciones correctas cuando el catálogo respondía',
      '3 de 6 pagos de desarrollo realizados — compromiso financiero del cliente',
      'KAM asignada (Fátima González) — canal de contacto mensual activo',
      'Disposición a reactivar cuando el CRM esté listo — ventana de oportunidad real',
    ],
    oportunidades: [
      'Integración AV ↔ CRM cuando el sistema interno esté listo — objetivo original del cliente',
      'Ejecutivo de Satisfacción como diferenciador competitivo para reactivación',
      'SAMALAB como caso de éxito de rescate si se ejecuta correctamente',
      'Catálogo actualizado por el cliente mientras espera — base sólida para la Fase 2',
      'Piloto del Ejecutivo de Satisfacción (Frisa + TEC) como validación del nuevo proceso',
    ],
    debilidades: [
      'Contrato sin modelo de saldo documentado — exposición comercial y potencialmente legal activa',
      'Brecha de precio 10x: expectativa $3K/mes vs. costo real $14,500–$31,386/mes',
      'Sin monitoreo post-lanzamiento: 180 bloqueos detectados en semana 11',
      'Sin área de precios centralizada — comercial es juez y parte',
      'CRM del cliente no contemplado formalmente en el alcance original',
      '41.6% de bloqueos de catálogo eran evitables con mantenimiento básico',
    ],
    amenazas: [
      'Silencio post-elección — si no se responde en 48 hrs, la cuenta puede escalar de preservada a perdida',
      'Exposición contractual del modelo de saldo — riesgo de disputa si no se aborda proactivamente',
      'Patrón sistémico: mismo problema en Salud y Hogar, LABSUS y Finsus — si no se corrige, hay más casos en camino',
      '3 pagos de desarrollo pendientes — si el cliente decide no pagar al ver la situación, disputa contractual ampliada',
      'Percepción de ser cobrado por un servicio que no funcionó como se prometió',
    ],
  },

  conclusion: 'SAMALAB no se perdió porque el producto no funcione. Se perdió porque el proceso que lo rodea no estaba a la altura del producto. El AV funcionaba — el tono era alto, las transferencias sin falla. Lo que no era recuperable era la expectativa de precio ($3K) vs. el costo real ($31K) sin que nadie en el proceso lo hubiera anticipado, comunicado ni documentado contractualmente.\n\nEl caso tiene dos hilos críticos abiertos que deben cerrarse en 48 horas: la revisión del contrato y el desglose de la factura. La promesa a Ari se cumple o se pierde definitivamente la cuenta. No hay un tercer camino.',

  pierde: [
    'La confianza de Ari — si no se responde en 48 hrs sobre contrato y factura',
    'Los 3 pagos de desarrollo pendientes — si la disputa contractual escala',
    'La oportunidad de reactivación cuando el CRM esté listo',
    'La credibilidad en el sector de salud y laboratorios — donde la referencia negativa circula rápido',
  ],
  gana: [
    'Respuesta formal impecable en 48 hrs = confianza preservada y puerta a reactivación abierta',
    'Proceso de Ejecutivo de Satisfacción implementado = nunca más un SAMALAB',
    'Documentación correcta del modelo de saldo en contratos = eliminación de sorpresas de precio',
    'Caso de rescate documentado cuando el CRM esté listo = marketing interno y externo',
  ],
  recomendacion_central: 'Dos acciones no delegables en las próximas 48 horas: (1) Joaquín revisa el contrato y define posición, (2) Daniel genera el desglose de $31,386.29. Sin estos dos datos, no se puede responder a Ari. Con estos datos, la respuesta puede ser honesta, profesional y recuperar la confianza. Todo lo demás es consecuencia de si se cumple este plazo.',
}
