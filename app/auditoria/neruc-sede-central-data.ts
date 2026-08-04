import type { AuditoriaCase } from './types'

export const NERUC_SEDE_CENTRAL: AuditoriaCase = {
  id:     'neruc-sede-central',
  asesor: 'Claudia',

  nombre:               'NERUC Sede Central',
  sector:               'Agencia de Performance Marketing / Reseller Callpicker (Co-Branding)',
  fecha_periodo:        '26 Jun – 25 Jul 2026',
  fecha_auditoria:      'Ago 2026',
  tipo_cliente:         'Reseller Co-Branding · CID 73660 · Consecutivo C9',
  descripcion_contexto: 'Auditoría Forense de Tráfico · CALLPICKER · 8,355 registros individuales · Entrantes + Salientes · 30 días',
  estado:               'en_riesgo',
  clasificacion:        'CONFIDENCIAL',
  version:              '1.0',

  /* ── KPIs ─────────────────────────────────────────────────────── */
  kpis: [
    { label: 'Consumo total real',         value: '12,764 min · 127.6%', color: '#ef4444' },
    { label: 'Reportado en Slack',         value: '8,850 min (solo Entrantes)', color: '#f59e0b' },
    { label: 'DIDs activos / contratados', value: '56 / 123 (45.5%)',    color: '#6366f1' },
    { label: 'Concentración Kia Corregidora', value: '56.1% del consumo total', color: '#00B4FF' },
  ],

  /* ── Resumen ejecutivo ────────────────────────────────────────── */
  resumen_ejecutivo: 'El archivo real de llamadas (8,355 registros) contradice la cifra que llegó a la mesa de decisión. El mensaje de Daniel/Mario en Slack (8,850 min, "cercanos al plan") corresponde exactamente a la suma de tráfico ENTRANTE — no incluye ni un minuto de tráfico SALIENTE.\n\nSumando ambos sentidos, el consumo real del periodo es 12,764 min contra un plan de 10,000 min → 127.6% de utilización. La cuenta lleva un mes SOBRE el límite de su plan sin que nadie en el equipo lo hubiera detectado. Esa diferencia (3,914 min salientes omitidos) equivale al 30.7% del consumo total.\n\nMás allá de la cifra, la auditoría identifica cuatro hallazgos adicionales: concentración extrema del 56.1% en una sola sub-cuenta (Kia Corregidora 1), 54.5% del pool de DIDs contratado sin actividad, patrón de marcación saliente con tasa de conexión débil, y una cifra "corregida" en el CRM que no puede reconciliarse con las reglas disponibles.',

  resultado_positivo: 'El cliente es un reseller con modelo validado: sus clientes finales ya reconocen y confían en Callpicker, lo que elimina la necesidad de co-branding. Factura de agosto pagada al corriente ($15,705.21). La reunión del 04 ago reveló un proyecto de alto valor estratégico: Neruc Prime OS — sistema empresarial propio (CRM + SMS + IA + automatización) que usará a Callpicker como motor de telefonía backend vía API/webhooks. Hay un pipeline de crecimiento concreto: 5 agencias Mazda EdoMex + separación de Kia Corregidora en cuenta propia.',

  hallazgos: [
    'HALLAZGO 1 — Reporte subestimó el consumo en 30.7%: El Slack de Daniel/Mario reporta 8,850 min ("cercanos al plan"). Esa cifra coincide exactamente con la suma de la hoja Entrantes — el reporte de soporte no incorporó tráfico saliente. El archivo muestra 3,914 min salientes (4,016 llamadas), concentrados en Kia Corregidora 1 y Suzuki Campestre 2 con campañas de marcación activas. Consumo real: 12,764 min / 127.6%.',
    'HALLAZGO 2 — Cifra "corregida" del CRM (11,794 min) no reconciliable: La nota del CRM registra "ent 7,880 min + sal 3,914 min = 11,794 min" aplicando fijo=1min/llamada. El componente saliente coincide exacto. El entrante (7,880) no se pudo reproducir: la hipótesis más cercana (600 llamadas tipo "fixed" facturadas a 1min en vez de su duración real) da 7,855 min, a 25 min del valor reportado. Pendiente confirmar con Claudia la regla exacta. Cifra verificable y defendible: 12,764 min.',
    'HALLAZGO 3 — Concentración extrema: Kia Corregidora 1 = 56.1% del consumo: 7,160 min en el periodo (4,192 entrantes + 2,968 salientes). Las top 5 sub-cuentas concentran el 89.5% del tráfico; las otras 51 sub-cuentas activas se reparten solo el 10.5% restante. Esto valida de forma independiente la decisión de separar Kia en cuenta propia ya tomada en la reunión del 04 ago.',
    'HALLAZGO 4 — Solo 45.5% del pool de DIDs contratado tuvo actividad: 123 DIDs contratados (121 nacionales + 2 internacionales). Solo 56 números (45.5%) registraron al menos una llamada en el periodo. Los 67 restantes (54.5%) no tuvieron tráfico alguno. Evidencia directa y objetiva que respalda la solicitud de baja de DIDs ya iniciada por el cliente.',
    'HALLAZGO 5 — Marcación saliente con baja tasa de conexión: Kia Corregidora 1: 2,823 llamadas salientes, 69.1% de conexión, 1.52 min promedio. Suzuki Campestre 2: 1,163 llamadas, 44.8% de conexión, 1.68 min promedio. Patrón de alto volumen + baja conexión + llamadas cortas — requiere confirmar directamente con el cliente qué herramienta o campaña genera ese volumen saliente antes de la próxima reunión.',
  ],

  /* ── Cronología ──────────────────────────────────────────────── */
  cronologia: [
    { fecha: '26 Jun 2026',   responsable: 'Sistema Callpicker',          evento: 'Inicio del periodo auditado. 8,355 llamadas registradas en el mes (Entrantes + Salientes).', tipo: 'neutral' },
    { fecha: '22 Jul 2026',   responsable: 'Axél Moreno-Nesme',           evento: 'Ticket Zoho #111336 — Axél pregunta cuántos minutos usa de su bolsa de 10,000 distribuidos entre clientes. Señal de falta de visibilidad del consumo real.', tipo: 'problema' },
    { fecha: '31 Jul 2026',   responsable: 'Axél Moreno-Nesme',           evento: 'Solicitud formal de baja de 55 DIDs (15 Sede Central + 40 Neruc One) vía Ticket Zoho #111336. Mario H. ejecuta 39 bajas de inmediato.', tipo: 'problema' },
    { fecha: '02 Ago 2026',   responsable: 'Sistema bancario',            evento: 'Cuarto fallo de tarjeta en el periodo visible (TARJ541121FAIL $15,705.24). Patrón: 4 fallos con tarjeta, rescate vía PayPal.', tipo: 'problema' },
    { fecha: '03 Ago 2026',   responsable: 'Neruc / Axél Moreno-Nesme',   evento: 'Factura 192270 pagada ($15,705.21, TARJ421284PASS). Cuenta al corriente. Saldo $0.', tipo: 'ok' },
    { fecha: '04 Ago 2026',   responsable: 'Daniel M. / Claudia / JML',   evento: 'Reunión "Revisión de servicios Grupo NERUC" (Axél, Andrea, Pablo G., Alejandro F., Rodrigo S. por Neruc). Acuerdos: reestructuración de cuentas, eliminación de co-branding, Neruc Prime OS como upsell API. Axél estima consumo en ~9,300 min (27% menor al real verificado).', tipo: 'pivote' },
    { fecha: '04 Ago 2026',   responsable: 'ATLAS / KAM',                 evento: 'Generación de auditoría forense. Hallazgo crítico: reporte Slack subestimó consumo en 30.7%. Consumo real verificado: 12,764 min / 127.6%.', tipo: 'neutral' },
    { fecha: '18 Ago 2026',   responsable: 'Claudia (CS)',                 evento: 'Próxima reunión de seguimiento programada. Claudia retoma la cuenta.', tipo: 'neutral' },
  ],

  /* ── Perfil de la cuenta ─────────────────────────────────────── */
  perfil_campos: [
    { label: 'Razón social',         value: 'AXEL MORENO NESME · RFC MONA970305MVA' },
    { label: 'CID / Consecutivo',    value: 'CID 73660 · Consecutivo C9' },
    { label: 'Giro',                 value: 'Agencia de performance marketing · Reseller Callpicker con Co-Branding' },
    { label: 'Modelo de negocio',    value: 'Revenden Callpicker a sus clientes finales bajo su propia marca. Pagan plan alto para tener dominios propios (admin/my.voice.neruc.app).' },
    { label: 'Servicios (ago 2026)', value: 'Calltracking Co-Branding 10,000 min · 121 DIDs Nacionales MX · 2 DIDs Internacionales Zihuatanejo' },
    { label: 'MRR actual',           value: '$15,705.21 MXN (Factura 192270 — pagada 03 ago 2026)' },
    { label: 'Contacto principal',   value: 'Axél Moreno-Nesme — Director General · axel.nesme@gruponeruc.com' },
    { label: 'Contacto alternativo', value: 'Andrea Nesme — Directora actual · andrea.nesme@gruponeruc.com' },
    { label: 'Operaciones',          value: 'Alejandro Fuentes · alejandro.fuentes@gruponeruc.com' },
    { label: 'Dominios propios CP',  value: 'admin.voice.neruc.app · my.voice.neruc.app' },
    { label: 'Proyecto interno',     value: 'Neruc Prime OS — CRM + SMS + IA + automatización. Usarán Callpicker como motor de telefonía backend vía API/webhooks.' },
    { label: 'Asesor',               value: 'Claudia Hernández · Callpicker Customer Success' },
  ],

  necesidad_negocio: 'Neruc opera como agencia de performance marketing y reseller de Callpicker. Su negocio depende de la telefonía como pieza central del producto que venden a sus clientes finales (autos, hoteles, empresas). La necesidad inmediata es tener visibilidad real del consumo de minutos por sub-cuenta — el problema que causó toda esta auditoría: Axél no sabía cuántos minutos consumían y el reporte interno tampoco era completo.\n\nEl proyecto Neruc Prime OS eleva la relación: de "compra líneas a Callpicker" a "Callpicker es el motor de telefonía de mi plataforma empresarial propia." Esa transición es la apuesta de largo plazo del cliente y representa la mayor oportunidad de stickiness que existe en esta cuenta.',

  potencial_corto: [
    'Confirmar metodología "fijo=1min" y establecer cifra de consumo oficial: 12,764 min (127.6%). Elimina ambigüedad antes de la reunión del 18 ago.',
    'Usar evidencia de 67 DIDs sin actividad (54.5%) como argumento objetivo para el right-sizing del plan — no solo la percepción del cliente.',
    'Preguntar directamente sobre herramienta de marcación saliente (Kia 69.1%, Suzuki 44.8% conexión) antes del 18 ago para tener la respuesta lista.',
    'Alex Rendón: resolver líneas bloqueadas en Sembia/Sirena (WhatsApp API) — impacta directamente las bajas de DIDs pendientes.',
    'Confirmar bajo qué CID opera Montajes Mecánicos — no aparece en el archivo de Sede Central.',
  ],
  potencial_largo: [
    'Neruc Prime OS · API/Developer plan: posicionar Callpicker como infraestructura crítica del sistema propio de Neruc. Stickiness máxima — reemplazarlos tiene costo muy alto.',
    'Panel por sub-cuenta + alertas de consumo (API en tiempo real hacia Power BI, Make, n8n/Zapier): resuelve la causa raíz confirmada por el propio Axél en la reunión.',
    'Cuenta nueva Mazda EdoMex (5 agencias): call tracking + grabación + menús + extensiones. MRR incremental con bolsa de minutos propia y visibilidad desde el día uno.',
    'Kia Corregidora como cuenta independiente: su 56.1% del consumo actual se convierte en MRR propio medible; right-sizing del plan Sede Central posterior.',
    'Revisión de calidad de marcación saliente: IA de voz + análisis de grabaciones para Kia Corregidora y Suzuki Campestre 2 (tasas de conexión del 69.1% y 44.8%).',
  ],

  tacticas: [
    {
      nombre: 'Dashboard de consumo en tiempo real',
      descripcion: 'Integrar la API de Callpicker con Power BI, Make o n8n para mostrar consumo de minutos por sub-cuenta, con alertas de umbral. Daniel confirmó en la reunión que la API ya lo permite.',
      impacto: 'Elimina la causa raíz identificada: falta de visibilidad que generó el error de reporte y la incertidumbre del cliente sobre su propio consumo.',
    },
    {
      nombre: 'Right-sizing del plan post-reestructuración',
      descripcion: 'Una vez que Kia Corregidora (56.1% del consumo) migre a cuenta propia, el plan base de Sede Central se puede redimensionar a los ~4,000-5,000 min reales remanentes. Proponer plan adecuado con precio ajustado.',
      impacto: 'Retiene al cliente con un plan más racional, elimina la "situación financiera desafiante" como argumento de cancelación, y crea espacio para crecer de nuevo.',
    },
    {
      nombre: 'Propuesta Neruc Prime OS · Plan API',
      descripcion: 'Formalizar oferta de plan API/Developer para Neruc Prime OS: webhooks, consumo de minutos en tiempo real, integración de grabaciones y análisis. Esto eleva la relación de proveedor a infraestructura crítica.',
      impacto: 'Mayor stickiness, menor riesgo de churn, posible incremento de MRR por consumo de API.',
    },
    {
      nombre: 'Cotización Mazda EdoMex basada en datos reales',
      descripcion: 'Usar el patrón de Kia Corregidora (consumo real por concesionaria activa) como base para dimensionar el plan de las 5 agencias Mazda — no la proyección de 25,000 min que Axél y Daniel calificaron de excesiva.',
      impacto: 'Evita repetir el mismo problema de sub/sobreestimación que motivó esta auditoría. Propuesta credible y defendible con datos.',
    },
  ],
  senal_alarma: 'Axél declaró "situación financiera desafiante" como motivador de toda la reestructuración. Si la separación de Kia Corregidora y la eliminación de co-branding se ejecutan sin nuevas cuentas que compensen, el MRR puede bajar de $15,705 a ~$5,000-6,000. Monitorear que el crecimiento (Mazda + API) avance en paralelo a las bajas.',

  /* ── Problema raíz ───────────────────────────────────────────── */
  problema_raiz: 'Reporte de consumo incompleto — solo tráfico entrante',
  problema_raiz_detalle: 'El proceso de soporte (Mario) generó el reporte de consumo sumando únicamente la hoja "Entrantes" del Excel. Esa es exactamente la cifra (8,850 min) que Daniel comunicó al equipo y que Axél usó como referencia en la reunión (estimó ~9,300 min). El tráfico saliente (3,914 min, 30.7% del total) nunca fue incluido. Resultado: la cuenta lleva un mes sobre su plan de 10,000 min sin que nadie lo supiera — ni el cliente ni el equipo de CS.',

  flujo_real: [
    { fase: 'Reporte',      area: 'Soporte (Mario)',      accion: 'Suma solo hoja Entrantes del Excel',             resultado: '8,850 min — subestimación del 30.7%' },
    { fase: 'Comunicación', area: 'KAM (Daniel)',          accion: 'Reporta 8,850 min como "cercanos al plan"',      resultado: 'Todo el equipo opera con dato incorrecto' },
    { fase: 'Reunión',      area: 'Axél / Daniel',         accion: 'Axél estima ~9,300 min propios',                 resultado: 'Aún 27% por debajo del consumo real' },
    { fase: 'Auditoría',    area: 'ATLAS',                 accion: 'Cruza Entrantes + Salientes desde el raw',       resultado: '12,764 min real · 127.6% del plan' },
    { fase: 'CRM',          area: 'CS (Claudia)',          accion: 'Aplica corrección fijo=1min → 11,794 min',       resultado: 'Cifra intermedia no reconciliable con metodología disponible' },
  ],

  comparativo: [
    { metrica: 'Consumo reportado (Slack)',      real: '8,850 min',   ideal: '12,764 min (completo)' },
    { metrica: '% utilización comunicado',       real: '"cercanos al plan"', ideal: '127.6% — sobre el límite' },
    { metrica: 'DIDs activos en periodo',        real: '56 de 123',   ideal: 'Deberíamos saber esto antes de cualquier reunión de right-sizing' },
    { metrica: 'Estimación del cliente (Axél)',  real: '~9,300 min',  ideal: 'Dato real: 12,764 min (+37%)' },
    { metrica: 'Tasa conexión saliente Suzuki',  real: '44.8%',       ideal: '≥ 70%' },
  ],

  /* ── Plan de acción ──────────────────────────────────────────── */
  plan_inmediato: [
    { accion: 'Confirmar con Claudia la regla exacta usada para "fijo=1min" (7,880 min entrantes) antes de usar 11,794 min en cualquier comunicación', responsable: 'Daniel / Claudia', criterio: 'Cifra reconciliada y documentada antes del 18 ago' },
    { accion: 'Sustituir 8,850 min por 12,764 min (127.6%) en todas las comunicaciones internas y externas a partir de ahora', responsable: 'Daniel / CS', criterio: 'Ningún documento o mensaje nuevo cita 8,850 min como consumo total' },
    { accion: 'Alex Rendón: resolver líneas bloqueadas en Sembia/Sirena (WhatsApp API) — impacta bajas de DIDs pendientes de Grupo Vanguardia', responsable: 'Alex Rendón (Colpicker Chat)', criterio: 'DIDs liberados para procesar la baja solicitada por Axél' },
    { accion: 'Axél: confirmar desglose de los 55 DIDs solicitados vs los 67 sin actividad detectados en la auditoría — evitar duplicar trabajo', responsable: 'Axél / Daniel', criterio: 'Lista única reconciliada de números a dar de baja' },
  ],

  plan_mediano: [
    { accion: 'Ejecutar reestructuración acordada: Kia Corregidora en cuenta propia, Mazda EdoMex en cuenta nueva, Sede Central reducida', responsable: 'Daniel / Axél', criterio: 'Diagrama de Axél recibido · Propuesta formal enviada antes del 18 ago' },
    { accion: 'Cancelar cuenta Streark: gestionar baja definitiva y detener cobros asociados', responsable: 'Axél', criterio: 'Cuenta Streark cerrada en sistema' },
    { accion: 'Redimensionar plan base Sede Central post-migración de Kia: ~4,000-5,000 min reales remanentes', responsable: 'Daniel / Pricing', criterio: 'Plan propuesto con precio validado interno antes de la reunión del 18 ago' },
    { accion: 'Cotizar Mazda EdoMex (5 agencias) usando consumo real de Kia Corregidora como referencia — no los 25,000 min estimados por Axél', responsable: 'Daniel', criterio: 'Propuesta formal enviada antes del 18 ago' },
  ],

  plan_estrategico: [
    { accion: 'Neruc Prime OS: formalizar oferta API/Developer plan — webhooks, consumo en tiempo real, integración con Power BI / Make / n8n', responsable: 'Daniel / Producto', criterio: 'Propuesta API presentada en reunión del 18 ago o la siguiente' },
    { accion: 'Panel por sub-cuenta + alertas de consumo: resuelve la causa raíz de falta de visibilidad confirmada por Axél en reunión', responsable: 'Daniel / Producto CP', criterio: 'Demo o acceso habilitado para Neruc antes de sep 2026' },
    { accion: 'Revisar calidad de marcación saliente (Kia 69.1%, Suzuki 44.8%) con el cliente: identificar herramienta, proponer IA de voz o ajuste de campaña', responsable: 'Claudia / Daniel', criterio: 'Pregunta directa en reunión 18 ago · Respuesta documentada' },
  ],

  areas_oportunidad: [
    { area: 'API / Neruc Prime OS',               impacto: 'Callpicker como infraestructura crítica del sistema propio del cliente — stickiness máxima',       responsable: 'Daniel' },
    { area: 'Cuenta nueva Mazda EdoMex (5 ags)',  impacto: 'MRR incremental estimado ~$7,500-$10,000 MXN/mes según consumo real comparable',                   responsable: 'Daniel' },
    { area: 'Panel de consumo en tiempo real',     impacto: 'Resuelve causa raíz confirmada en reunión — reduce riesgo de churn por opacidad de datos',          responsable: 'Claudia' },
    { area: 'Right-sizing plan Sede Central',      impacto: 'Retención a precio justo post-reestructuración; elimina argumento de "costo innecesario"',          responsable: 'Daniel' },
  ],

  /* ── Actores ─────────────────────────────────────────────────── */
  perfiles: [
    {
      nombre: 'Axél Moreno-Nesme',
      rol:    'Director General · Razón Social · Callpicker CID 73660',
      color:  '#00B4FF',
      campos: [
        { label: 'Email',      value: 'axel.nesme@gruponeruc.com' },
        { label: 'RFC',        value: 'MONA970305MVA' },
        { label: 'Rol real',   value: 'Tomador de decisiones y contacto técnico-comercial principal. Su hermana Andrea aparece como directora pero Axél conduce las reuniones.' },
        { label: 'Contexto',   value: 'Declaró "situación financiera desafiante" — motivador de la reestructuración. Estima consumo en ~9,300 min (27% menor al real). Comprometió diagrama de reestructuración por WA.' },
      ],
    },
    {
      nombre: 'Andrea Nesme',
      rol:    'Directora (aparece como directora actual — cambio reciente)',
      color:  '#6366f1',
      campos: [
        { label: 'Email', value: 'andrea.nesme@gruponeruc.com' },
        { label: 'Nota',  value: 'Asistió a la reunión del 04 ago. Axél sigue siendo el interlocutor principal.' },
      ],
    },
    {
      nombre: 'Alejandro Fuentes / Rodrigo Saucedo',
      rol:    'Coordinación operativa Neruc',
      color:  '#f59e0b',
      campos: [
        { label: 'Alejandro', value: 'alejandro.fuentes@gruponeruc.com — espejo operativo en la reestructuración' },
        { label: 'Rodrigo',   value: 'rodrigo.saucedo@gruponeruc.com — coordinación operativa' },
      ],
    },
    {
      nombre: 'Daniel Martínez',
      rol:    'KAM Callpicker · Conducción del caso',
      color:  '#22C55E',
      campos: [
        { label: 'Acciones', value: 'Evaluar y enviar propuesta Mazda. Lista de números a cancelar + consumo estimado. Propuesta formal de reestructuración.' },
        { label: 'Nota',     value: 'Comunicó 8,850 min como consumo total basándose en el reporte de soporte (solo Entrantes).' },
      ],
    },
    {
      nombre: 'Claudia Hernández',
      rol:    'Asesora de cuenta · Seguimiento post-reunión',
      color:  '#a855f7',
      campos: [
        { label: 'Email',  value: 'claudia@callpicker.com' },
        { label: 'Acción', value: 'Dar seguimiento a la cuenta cuando regrese. Confirmar metodología "fijo=1min" (7,880 min entrantes) para reconciliar cifra CRM con datos del archivo.' },
      ],
    },
  ],

  /* ── FODA ────────────────────────────────────────────────────── */
  foda: {
    fortalezas: [
      'Relación de 5+ años; modelo reseller validado — sus clientes finales reconocen Callpicker sin necesitar el paquete co-branding.',
      'Factura de agosto pagada al corriente ($15,705.21). Los 4 fallos de tarjeta se resolvieron vía PayPal — no hay mora impaga.',
      'Pipeline de expansión concreto y no especulativo: Mazda EdoMex (5 agencias) + Kia Corregidora como cuenta independiente.',
      'Neruc Prime OS: posicionamiento estratégico donde Callpicker pasa de proveedor de líneas a infraestructura crítica del producto propio del cliente.',
    ],
    oportunidades: [
      'API/Developer plan para Neruc Prime OS: integración de telefonía backend con CRM, SMS, automatización e IA propios de Neruc.',
      'Panel de consumo en tiempo real (API → Power BI / Make / n8n): resuelve la causa raíz de falta de visibilidad que el propio Axél confirmó en reunión.',
      'Cuentas nuevas con bolsa propia: Kia Corregidora independiente + Mazda EdoMex = MRR incremental medible desde el día uno.',
      'Separación de cuentas = visibilidad real por cliente: elimina el problema estructural de consumo compartido no trazable.',
    ],
    debilidades: [
      'Reporte de consumo llegó incompleto a decisión (8,850 vs 12,764 min reales) — origen interno del proceso de soporte, no del cliente.',
      'Falta de trazabilidad de consumo en Neruc One reconocida por el propio Axél en la reunión — causa raíz confirmada del error de reporte.',
      'Inconsistencia entre la descripción del CRM ("Sede Central = uso interno") y la realidad del archivo (tráfico de clientes finales: Kia, Mazda, Stellantis).',
      'Cifra "corregida" del CRM (11,794 min) no reconciliable con metodología disponible — no usar hasta confirmar con Claudia.',
    ],
    amenazas: [
      'Situación financiera "desafiante" declarada por Axél — mayor sensibilidad al precio. Ya se ve en solicitud de baja de co-branding y de DIDs.',
      'Si la reestructuración reduce cuentas sin que crezcan las nuevas (Mazda, API), el MRR puede caer de $15,705 a ~$5,000-$6,000.',
      'Cotización de Mazda sobre 25,000 min (proyección excesiva) — riesgo de subvalorar el servicio y repetir el patrón de disputa de datos.',
      'Montajes Mecánicos (mencionado como estable en reunión) no aparece en el archivo auditado — no verificable desde esta fuente. Puede tener problemas no detectados.',
    ],
  },

  /* ── Conclusión ──────────────────────────────────────────────── */
  conclusion: 'La auditoría revela un problema de proceso interno más que un cliente perdido. El dato que llevó a la mesa de decisión estaba incompleto — no porque nadie mintiera, sino porque el reporte de soporte sumó solo un sentido de tráfico. Esa diferencia de 3,914 minutos (30.7%) cambió completamente la lectura: la cuenta no está "cerca del límite", lleva un mes sobre él.\n\nA pesar de eso, el cliente está pagando, tiene un proyecto estratégico en desarrollo (Neruc Prime OS) y un pipeline de nuevas cuentas concreto. El riesgo real es que la "situación financiera desafiante" que Axél declaró en la reunión genere reducciones de plan que no se compensen a tiempo con el crecimiento.',

  pierde: [
    'MRR de co-branding (~$6,100/mes) si se aprueba la eliminación del paquete',
    'Visión de Sede Central como cuenta estable — en realidad su consumo está distribuido en clientes finales que se van a separar',
    '16 DIDs pendientes de dar de baja (de los 55 solicitados, 39 ya ejecutados por Mario H.)',
    'Tiempo de CS: este caso requirió auditoría completa por un error de reporte que se puede sistematizar',
  ],
  gana: [
    'Neruc Prime OS: contrato de API como infraestructura backend — stickiness que ningún competidor puede replicar fácilmente',
    '5 cuentas Mazda EdoMex: MRR incremental estimado $7,500–$10,000 MXN/mes',
    'Kia Corregidora como cuenta independiente: la mayor sub-cuenta (56.1% del consumo) se convierte en MRR propio medible',
    'Confianza del cliente en datos: entregar esta auditoría directamente demuestra transparencia y diferencia al equipo de CS de cualquier proveedor estándar',
    'Proceso mejorado: establecer reporte de consumo bidireccional como estándar en todos los clientes con tráfico saliente activo',
  ],

  recomendacion_central: 'Entregar esta auditoría directamente a Axél en la reunión del 18 ago como acto de transparencia: "Encontramos que el número que usamos estaba incompleto — te compartimos el análisis completo para que tomes decisiones con el dato real." Eso convierte un error interno en un diferenciador de servicio. Desde ahí, proponer el panel en tiempo real (resuelve su problema confirmado), formalizar la propuesta Neruc Prime OS (API) y cerrar el dimensionamiento correcto para Mazda EdoMex.',
}
