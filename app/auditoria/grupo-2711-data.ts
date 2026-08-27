import type { AuditoriaCase } from './types'

/**
 * Fuente: "Auditoria Tickets_Corporativa_Integral_Grupo2711.docx"
 * Dirección SAC — Callpicker · 26 de agosto de 2026.
 *
 * Nota de fidelidad al documento: consolida TRES fuentes con niveles de
 * evidencia distintos — (1) auditoría histórica de 46 tickets, (2) bitácora
 * de 13 eventos (27 Jul–21 Ago 2026), (3) resumen de sesión interna del
 * 26 Ago (síntesis de un tercero, NO transcripción verbatim). El documento
 * marca explícitamente qué es hecho verificado y qué es señalamiento sin
 * sustento; esas marcas se conservan aquí. El señalamiento de posible
 * desconexión intencional NO debe usarse en ninguna comunicación con el
 * cliente sin evidencia concreta.
 */
export const GRUPO_2711: AuditoriaCase = {
  id:                    'grupo-2711',
  asesor:                'Claudia',
  nombre:                'GRUPO 2711',
  sector:                'Mantenimiento, reparación y servicio integral automotriz multimarcas',
  fecha_periodo:         '27 Julio – 21 Agosto 2026 (+ 46 tickets históricos)',
  fecha_auditoria:       'Ago 2026',
  tipo_cliente:          'Cuenta con Agente Virtual (Darwin) parcialmente desplegado · volumen de soporte sostenido',
  descripcion_contexto:  'CID 12283 · Consecutivo C26 · Auditoría corporativa integral de tickets · Asesora: Claudia Hernández',
  estado:                'activo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Evidencia combinada',            value: '46 + 13 tickets',  color: '#6366f1' },
    { label: 'Eventos causados por el cliente',value: '8 de 13',          color: '#f59e0b' },
    { label: 'Incidentes de plataforma',       value: '1 (10 min)',       color: '#22c55e' },
    { label: 'Cierre más largo (AV/LiveKit)',  value: '32 días',          color: '#ef4444' },
  ],

  resumen_ejecutivo:
    'Grupo 2711 es una cuenta con volumen de soporte sostenido —46 tickets históricos más 13 eventos en las últimas cuatro semanas— y un diagnóstico técnico consistente entre tres fuentes independientes: la causa dominante de las interrupciones reportadas está del lado del cliente (red, dispositivos y ausencia de un responsable técnico interno), no en la plataforma Callpicker. El propio equipo lo validó en la sesión interna del 26 de agosto: 8 de 13 eventos por el cliente, 2 por diademas, 2 operativos y 1 de plataforma resuelto en 10 minutos.\n\n' +
    'El hallazgo con mayor implicación estratégica no es técnico: la cuenta opera sin encargado de sistemas, con equipos no homologados y enlaces de internet domésticos para personal remoto (incluido un sitio en Saltillo). Esa combinación estructural es, con alta probabilidad, la explicación de fondo de la recurrencia en las extensiones 158 y 190 y del patrón de intermitencia en viernes de alta demanda — aunque este último se apoya todavía en solo dos observaciones.\n\n' +
    'La dirección de Callpicker ya tomó una decisión: autorizar una visita técnica integral y exigir, como condición de venta a futuro, que el cliente cuente con un responsable técnico designado. Este caso organiza la evidencia que sustenta esa decisión.',

  resultado_positivo:
    'Un solo incidente de plataforma en 59 días de evidencia combinada — la saturación del servidor SIP "collector" del 5 de agosto — resuelto por Ingeniería en 10 minutos. ' +
    'La capacidad de diagnóstico del equipo está demostrada: análisis de trazados, espectro de audio y logs de registro con causa raíz identificada en la mayoría de los casos. ' +
    'El Agente Virtual (Darwin) ya está parcialmente desplegado y en fase de ajuste, no de implementación desde cero. ' +
    'Y según la reunión interna, la dirección general del cliente (Marcelo) está abierta a invertir "si se le indica exactamente qué hacer" — una ventana comercial concreta.',

  hallazgos: [
    'El clúster técnico real de los 46 tickets históricos (conectividad/SIP/NAT 20% + audio/RTP 9% + hardware 2%) suma 14 casos —30% del volumen— sin que ningún análisis de trazados haya atribuido falla a la plataforma Callpicker.',
    'De los 13 eventos recientes: 8 con causa en el origen (cliente), 2 de hardware (diademas Plantronics: micrófono dañado y botón de mute trabado), 2 operativos y 1 de plataforma. Conteo validado de forma independiente por Claudia Hernández en la reunión interna.',
    '3 de los 4 tickets con cierre más largo (32, 30 y 21 días) están ligados al Agente Virtual (ajustes, LiveKit, N8N): el cuello de botella es la dependencia de ingeniería/integración, no la mesa de soporte de primer nivel.',
    'Las extensiones 158 y 190 concentran 3 apariciones cada una en el ticketing y fueron mencionadas de forma independiente en la sesión interna como los puntos de mayor recurrencia.',
    'Hallazgo técnico de Pablo Soto no visible en el ticketing: fallas menores recurrentes por renovación de IP/puertos en módems del proveedor (Telmex, puertos 5060/4061) que se acumulan y afectan la operación global.',
    'Interacción documentada entre el uso de altavoz y el Agente Virtual (Darwin): el altavoz dificulta la detección de voz de la IA — consistente con la falla de barge-in del ticket #111999.',
    'El 14 de agosto una extensión enviaba la IP inválida 127.0.0.1 (configuración NAT) — ejemplo concreto de la falta de gobernanza técnica del lado del cliente.',
  ],

  cronologia: [
    { fecha: '29 Ago 2018',        responsable: 'Callpicker',                    evento: 'Alta de la cuenta GRUPO 2711 (CID 12283, consecutivo C26). Cliente con 8 años de antigüedad.', tipo: 'ok' },
    { fecha: 'Históricos',         responsable: 'Mesa SAC',                      evento: 'Auditoría de 46 tickets: 26% configuración operativa, 20% consultas de nuevo contacto, 20% conectividad/SIP/NAT, 15% Agente Virtual, 9% facturación, 9% audio/RTP, 2% hardware.', tipo: 'neutral' },
    { fecha: '27 Jul – 21 Ago 2026', responsable: 'Soporte Callpicker',          evento: 'Bitácora de 13 eventos: 8 con causa en el origen del cliente, 2 de diademas, 2 operativos, 1 de plataforma.', tipo: 'neutral' },
    { fecha: '5 Ago 2026',         responsable: 'Ingeniería Callpicker',         evento: 'HECHO VERIFICADO — único evento de plataforma del periodo: saturación de 10 minutos (11:54–12:04) en el servidor SIP "collector" por carga anormal en un clúster de BD interno. Resuelto el mismo día. Sin evidencia de conexión causal con el reporte de audio del cliente de esa mañana (#112532, 10:49).', tipo: 'problema' },
    { fecha: '21 Ago 2026',        responsable: 'Grupo 2711 / Soporte',          evento: 'Intermitencia general en viernes de alta demanda (ext. 190/194/158/117/169) — segundo viernes con el mismo patrón; la hipótesis se apoya aún en solo dos observaciones.', tipo: 'problema' },
    { fecha: '26 Ago 2026',        responsable: 'Joaquín Martínez / Dirección',  evento: 'Sesión interna: se decide exigir visita técnica presencial y asignación de encargado técnico del lado del cliente como condiciones para asegurar el servicio. Casos comparables citados: GTC y Polac.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'GRUPO 2711' },
    { label: 'CID Zoho',              value: '12283' },
    { label: 'Consecutivo',           value: 'C26' },
    { label: 'Sector',                value: 'Mantenimiento, reparación y servicio integral automotriz multimarcas' },
    { label: 'Cliente desde',         value: 'Agosto 2018 (8 años)' },
    { label: 'MRR reportado',         value: '$7,485 MXN/mes' },
    { label: 'Health Score CRM',      value: '83 / 100 · estado Activo' },
    { label: 'Contacto principal (CRM)', value: 'Rodolfo Maldonado — Director' },
    { label: 'Asesora de cuenta',     value: 'Claudia Hernández' },
    { label: 'Productos en uso',      value: 'Conmutador + Agente Virtual (Darwin) parcialmente desplegado · integración LiveKit/N8N en ajuste' },
    { label: 'Infraestructura del cliente', value: 'Sin encargado de sistemas · equipos no homologados · enlaces de internet domésticos en sitios remotos (incl. Saltillo) — fuente: reunión interna 26 Ago' },
    { label: 'Extensiones críticas',  value: '158 y 190 (3 apariciones cada una) · también 117, 169, 192, 194, 199' },
  ],

  necesidad_negocio:
    'Grupo 2711 necesita continuidad operativa telefónica para su red de servicio automotriz multimarcas, con personal distribuido (incluido un sitio remoto en Saltillo) y un Agente Virtual en producción parcial. ' +
    'Su problema de fondo no es de producto: es de gobernanza técnica — no existe un responsable de sistemas, el equipo no está homologado y los enlaces residenciales introducen fallas de red que el cliente percibe como fallas de la plataforma. ' +
    'La necesidad real es un levantamiento de infraestructura con propuesta de corrección concreta, precedido por la visita técnica ya autorizada.',

  potencial_corto: [
    'Ejecutar la visita técnica ya autorizada, con foco en las extensiones 158 y 190 y en el levantamiento de red y equipo.',
    'Confirmar con el cliente la designación de un punto de contacto técnico, aunque sea informal, mientras se define el requisito formal.',
    'Marcaciones de prueba de Pablo Soto hacia la cuenta para validar el comportamiento del servicio.',
  ],

  potencial_largo: [
    'Propuesta formal de infraestructura y kit de equipo homologado (terminales IP, diademas, routers) a la dirección general, con alcance y costo explícitos.',
    'Ampliación del Agente Virtual (Darwin) ya validado parcialmente — el ajuste de barge-in y la recomendación de no usar altavoz son mejoras de configuración, no producto nuevo.',
    'SLA diferenciado para solicitudes de integración de Agente Virtual, la categoría con los cierres más largos de toda la cuenta (hasta 32 días).',
    'Establecer como requisito de venta, para cuentas de perfil similar, contar con responsable técnico designado desde la contratación.',
  ],

  tacticas: [
    { nombre: 'Kit de equipo homologado',            descripcion: 'Diademas, terminales IP y routers: responde directamente a los hallazgos de hardware y red doméstica identificados en tickets y en la reunión interna. Paola Bárcenas ya ofreció equipo alternativo.', impacto: 'Elimina la principal fuente de fallas percibidas como "de plataforma".' },
    { nombre: 'Ampliación de Agente Virtual (Darwin)', descripcion: 'Ya validado parcialmente. El ajuste de detección de voz (barge-in) y el protocolo de no usar altavoz son configuración, no implementación nueva.', impacto: 'Más capacidad de atención sin fricción de adopción.' },
    { nombre: 'SLA diferenciado para integraciones AV', descripcion: 'La categoría AV/LiveKit/N8N concentra los cierres más largos (32, 30, 21 días) por dependencia de ingeniería externa.', impacto: 'Expectativas correctas con el cliente y menor desgaste de la mesa SAC.' },
    { nombre: 'Referencia de conectividad empresarial', descripcion: 'FUERA del portafolio directo: si la visita confirma que el enlace es la limitante estructural, evaluar INTERNAMENTE una referencia a un área de conectividad — no se plantea al cliente todavía.', impacto: 'Ataca la causa raíz sin comprometer alcance de Callpicker.' },
  ],

  senal_alarma:
    'Riesgo reputacional: si la recurrencia de fallas se percibe públicamente como falla de plataforma cuando la evidencia de tres fuentes apunta a infraestructura del cliente, Callpicker paga el costo de un problema que no origina. ' +
    'Además, la mayoría de los reportes depende de un solo canal (Ismael, 8 de 13 eventos) sin encargado técnico formal que lo respalde. ' +
    'PRECAUCIÓN DOCUMENTAL: el señalamiento de posible desconexión intencional de personal operativo del cliente NO tiene ticket, fecha ni nombre que lo sustente — queda registrado como afirmación pendiente de verificar y no debe usarse en ninguna comunicación con el cliente.',

  problema_raiz:
    'Ausencia de gobernanza técnica del lado del cliente: sin responsable de sistemas, con equipo no homologado y enlaces domésticos, cada falla local se convierte en un ticket contra la plataforma.',

  problema_raiz_detalle:
    'Las tres fuentes convergen: el clúster técnico del histórico (30% del volumen) nunca se atribuyó a la plataforma tras análisis de trazados; la bitácora reciente carga 8 de 13 eventos al origen del cliente; y la sesión interna documentó la causa estructural — no hay encargado de sistemas, los equipos no están homologados y hay operación remota sobre internet doméstico, incluido Saltillo. ' +
    'A eso se suman dos agravantes técnicos concretos: la renovación de IP/puertos en módems Telmex (5060/4061) que acumula fallas menores, y una extensión que llegó a anunciar la IP inválida 127.0.0.1 por configuración NAT. ' +
    'El único evento real de plataforma en 59 días duró 10 minutos y se resolvió el mismo día. ' +
    'La consecuencia comercial: el cliente percibe inestabilidad, pero la corrección de fondo está en su propia infraestructura — por eso la decisión de dirección condiciona el futuro de la cuenta a la visita técnica y al encargado técnico designado.',

  flujo_real: [
    { fase: 'Reporte',        area: 'Grupo 2711 (Ismael / Marcelo)',  accion: 'Las incidencias se reportan por WhatsApp o ticket, concentradas en un solo canal informal.',            resultado: '8 de 13 eventos recientes reportados por Ismael; Marcelo reporta directo por WhatsApp.' },
    { fase: 'Diagnóstico',    area: 'Mesa SAC Callpicker',            accion: 'Análisis de trazados, espectro de audio y logs de registro por evento.',                                 resultado: 'Causa raíz identificada en la mayoría: origen del cliente, diademas o configuración local.' },
    { fase: 'Recurrencia',    area: 'Extensiones 158 y 190',          accion: 'Múltiples intervenciones sin resolución definitiva.',                                                    resultado: '3 apariciones cada una en el ticketing; confirmadas como puntos críticos en la sesión interna.' },
    { fase: 'Integración AV', area: 'Ingeniería externa (LiveKit/N8N)', accion: 'Solicitudes de ajuste del Agente Virtual pasan por dependencia de integración.',                       resultado: 'Cierres de 32, 30 y 21 días — los más largos de la cuenta.' },
    { fase: 'Decisión',       area: 'Dirección Callpicker',           accion: 'Sesión interna del 26 Ago: visita técnica + encargado técnico como condiciones.',                        resultado: 'Plan en marcha: Paola gestiona la visita, Pablo ejecuta marcaciones de prueba.' },
  ],

  comparativo: [
    { metrica: 'Eventos de plataforma (59 días)',    real: '1 — saturación de 10 min, resuelta el mismo día',       ideal: 'Es el nivel esperado; el dato desmiente la percepción de inestabilidad de plataforma' },
    { metrica: 'Causa raíz de eventos recientes',    real: '8 de 13 en el origen del cliente',                       ideal: 'Infraestructura del cliente homologada y con responsable técnico' },
    { metrica: 'Extensiones 158 y 190',              real: 'Sin resolución definitiva tras múltiples intervenciones', ideal: 'Revisión física en sitio (visita técnica ya autorizada)' },
    { metrica: 'Cierre de solicitudes de AV',        real: 'Hasta 32 días (LiveKit/N8N)',                            ideal: 'SLA diferenciado y comunicado para integraciones' },
    { metrica: 'Canal de reporte',                   real: 'Concentrado en Ismael (contacto técnico de facto)',      ideal: 'Encargado técnico designado formalmente por el cliente' },
    { metrica: 'Enlaces de sitios remotos',          real: 'Internet doméstico (incl. Saltillo), módems Telmex con renovación de IP/puertos', ideal: 'Conectividad empresarial o al menos equipo de red gestionado' },
  ],

  plan_inmediato: [
    { accion: 'Ejecutar la visita técnica presencial ya autorizada, con foco en extensiones 158 y 190 y levantamiento de red/equipo.', responsable: 'Paola Bárcenas', criterio: 'Visita realizada con inventario de infraestructura documentado.' },
    { accion: 'Realizar marcaciones de prueba hacia la cuenta para validar comportamiento del servicio.',                              responsable: 'Pablo Soto',     criterio: 'Resultados documentados que descarten fallas de comunicación.' },
    { accion: 'Confirmar con el cliente un punto de contacto técnico, aunque sea informal.',                                           responsable: 'Claudia Hernández', criterio: 'Nombre y canal acordados mientras se formaliza el requisito.' },
  ],

  plan_mediano: [
    { accion: 'Presentar a la dirección general (Marcelo) la propuesta formal de infraestructura y equipo homologado, con alcance y costo explícitos.', responsable: 'Dirección SAC / Comercial', criterio: 'Propuesta entregada aprovechando la disposición a invertir reportada en la reunión.' },
    { accion: 'Definir el SLA diferenciado para solicitudes de Agente Virtual.',                                                                        responsable: 'Dirección SAC',             criterio: 'SLA publicado y comunicado al cliente.' },
  ],

  plan_estrategico: [
    { accion: 'Establecer como requisito de venta, para cuentas de perfil similar, un responsable técnico designado desde la contratación.', responsable: 'Dirección Callpicker', criterio: 'Requisito incorporado al proceso comercial del siguiente ciclo.' },
    { accion: 'Definir los pasos técnicos y operativos para estabilizar el servicio (encargado técnico + infraestructura requerida).',        responsable: 'Equipo Callpicker',    criterio: 'Plan de requerimientos técnicos listo para presentar a dirección del cliente.' },
  ],

  areas_oportunidad: [
    { area: 'Visita técnica de levantamiento',       impacto: 'Muy alto — es la condición decidida por dirección y el precedente GTC/Polac muestra que resuelve el origen real.', responsable: 'Paola Bárcenas' },
    { area: 'Kit de equipo homologado',              impacto: 'Alto — ataca hardware y red doméstica, las dos causas más repetidas.',                                             responsable: 'Comercial / SAC' },
    { area: 'Ampliación de Agente Virtual',          impacto: 'Alto — Darwin ya está desplegado parcialmente; es ajuste, no venta desde cero.',                                    responsable: 'Ingeniería / SAC' },
    { area: 'SLA de integraciones AV',               impacto: 'Medio — corrige la peor métrica de cierre de la cuenta (32 días).',                                                 responsable: 'Dirección SAC' },
    { area: 'Referencia de conectividad empresarial', impacto: 'Por validar internamente — solo si la visita confirma el enlace como limitante estructural.',                      responsable: 'Dirección Callpicker' },
  ],

  perfiles: [
    {
      nombre: 'Marcelo',
      rol:    'Dirección general — Grupo 2711',
      color:  '#6366f1',
      campos: [
        { label: 'Disposición',  value: 'Abierto a invertir "si se le indica exactamente qué hacer" (según reunión interna del 26 Ago).' },
        { label: 'Canal',        value: 'Reporta incidencias directamente por WhatsApp.' },
        { label: 'Siguiente paso', value: 'Destinatario de la propuesta formal de infraestructura y equipo homologado.' },
      ],
    },
    {
      nombre: 'Ismael',
      rol:    'Usuario técnico de facto — Grupo 2711',
      color:  '#f59e0b',
      campos: [
        { label: 'Peso',   value: 'Reporta la mayoría de las incidencias (8 de 13 eventos de la bitácora).' },
        { label: 'Riesgo', value: 'Punto de contacto técnico no formal, sin rol de sistemas dedicado — canal único de reporte.' },
      ],
    },
    {
      nombre: 'Joselyn',
      rol:    'Operación de línea / grupo RG Maver — Grupo 2711',
      color:  '#94a3b8',
      campos: [
        { label: 'Caso', value: 'Reportó la configuración de timbrado equitativo con solo un par de extensiones disponibles (#113516).' },
      ],
    },
    {
      nombre: 'Paola Bárcenas / Pablo Soto',
      rol:    'Mesa SAC Callpicker — 24% del volumen histórico cada uno',
      color:  '#22c55e',
      campos: [
        { label: 'Paola',  value: 'Gestiona la visita técnica presencial; ofreció equipo alternativo (IP, diademas, routers).' },
        { label: 'Pablo',  value: 'Marcaciones de prueba; identificó la causa de puertos del ISP (Telmex 5060/4061).' },
      ],
    },
    {
      nombre: 'Claudia Hernández',
      rol:    'Asesora de cuenta — presentó el análisis de los 13 eventos',
      color:  '#0057FF',
      campos: [
        { label: 'Validación', value: 'Su conteo independiente (8 origen / 2 hardware / 2 operativos / 1 plataforma) coincide con la categorización del informe.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Un solo incidente de plataforma en 59 días de evidencia combinada, resuelto en 10 minutos.',
      'Capacidad de diagnóstico demostrada: trazados, espectro de audio y logs con causa raíz identificada.',
      'Agente Virtual (Darwin) ya parcialmente desplegado y en fase de ajuste, no de implementación.',
    ],
    oportunidades: [
      'Dirección general del cliente abierta a invertir si se le indica exactamente qué hacer.',
      'Expandir el Agente Virtual ya validado en lugar de reintroducirlo desde cero.',
      'Formalizar la visita técnica autorizada como punto de entrada al levantamiento y la propuesta de equipo homologado.',
      'Evaluar internamente una referencia de conectividad empresarial si la visita confirma el enlace como limitante.',
    ],
    debilidades: [
      'Sin responsable técnico interno ni equipo homologado — causa estructural de la recurrencia.',
      'Extensiones 158 y 190 sin resolución definitiva pese a múltiples intervenciones.',
      'Cierres de hasta 32 días en integraciones de Agente Virtual por dependencia de ingeniería externa.',
    ],
    amenazas: [
      'Resistencia documentada del cliente a visitas técnicas por temor a asumir el costo de corrección.',
      'Riesgo reputacional si la recurrencia se percibe como falla de plataforma cuando la evidencia apunta a infraestructura del cliente.',
      'Dependencia de un solo canal de reporte (Ismael) sin encargado técnico formal.',
    ],
  },

  conclusion:
    'La evidencia de tres fuentes distintas apunta en la misma dirección: la plataforma Callpicker no es la causa recurrente de las interrupciones en Grupo 2711. El problema de fondo es estructural — infraestructura y gobernanza técnica del lado del cliente — y ya tiene decisión y plan de acción interno en marcha: visita técnica presencial y encargado técnico designado como condiciones para asegurar el servicio. ' +
    'Este caso queda como base documental para la visita y para la propuesta de inversión que la dirección de Callpicker presentará a la dirección general del cliente, con los precedentes de GTC y Polac como referencia de que las visitas conjuntas resuelven el origen real de fallas similares.',

  pierde: [
    'Horas de mesa SAC absorbidas por fallas cuyo origen está en la infraestructura del cliente (30% del histórico + 8 de 13 recientes).',
    'Credibilidad técnica si la percepción de inestabilidad se consolida sin corregir la causa real.',
    'Velocidad en el Agente Virtual: la dependencia LiveKit/N8N mantiene cierres de hasta 32 días.',
  ],

  gana: [
    'Una cuenta de 8 años con HS 83 estabilizada sobre infraestructura corregida.',
    'Venta de kit homologado y ampliación de Darwin sobre una decisión de dirección ya tomada.',
    'Un precedente de requisito comercial (responsable técnico designado) aplicable a todo el ciclo de venta.',
  ],

  recomendacion_central:
    'Ejecutar la visita técnica en las próximas dos semanas con foco en las extensiones 158 y 190, llevar el inventario de infraestructura a una propuesta formal con alcance y costo para Marcelo, y condicionar la continuidad operativa al encargado técnico designado — exactamente como lo decidió la sesión interna del 26 de agosto. ' +
    'No usar en ninguna comunicación con el cliente el señalamiento de posible desconexión intencional: no tiene ticket, fecha ni nombre que lo sustente.',

  documentos: [
    {
      nombre:      'Auditoría Corporativa Integral de Tickets · Grupo 2711',
      ruta:        '/docs/Auditoria_Tickets_Corporativa_Integral_Grupo2711.docx',
      descripcion: 'Dirección SAC, 26 Ago 2026. Consolida la auditoría histórica de 46 tickets, la bitácora de 13 eventos (27 Jul–21 Ago) y el resumen de la sesión interna del 26 Ago. Incluye las 4 figuras (distribución por agente, cronología, causas y extensiones recurrentes).',
    },
  ],
}
