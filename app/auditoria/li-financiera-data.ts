import type { AuditoriaCase } from './types'

/**
 * Caso generado por auditoría interna de datos (27 Ago 2026) — sin documento
 * fuente externo. Fuentes cruzadas: CRM Supabase (cuenta F61), Informe de
 * Cortes dic 2025 – ago 2026 (9 cortes), Zoho Desk (14 tickets), Radar de
 * Cuenta 12/12 respondido por Dan el 26 Ago 2026, actividad SAC de la semana
 * del 24 Ago (410 min medidos), y verificación negativa contra GRC-AAA-2026,
 * cancelaciones de Análisis DATA y downgrades de junio.
 */
export const LI_FINANCIERA: AuditoriaCase = {
  id:                    'li-financiera',
  asesor:                'Dan',
  nombre:                'LI FINANCIERA',
  sector:                'Servicios Financieros',
  fecha_periodo:         'Diciembre 2025 – Agosto 2026 (9 cortes de facturación)',
  fecha_auditoria:       'Ago 2026',
  tipo_cliente:          'Mediana · 150 empleados · plan 50 extensiones VyC con 12,500 minutos',
  descripcion_contexto:  'CID 176219 · Consecutivo F61 · Sobrecapacidad crónica extrema · Asesor: Dan Domínguez',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Consumo promedio (9 meses)',   value: '4.0%',            color: '#ef4444' },
    { label: 'Extensiones contratadas',      value: '50',              color: '#f59e0b' },
    { label: 'Tendencia de consumo',         value: '6.8% → 2.3%',     color: '#ef4444' },
    { label: 'MRR expuesto',                 value: '$9,720',          color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'LI FINANCIERA es el expediente más claro de sobrecapacidad crónica de toda la cartera: un plan de 50 extensiones Visibilidad y Control con 12,500 minutos incluidos del que la operación consume en promedio el 4% — alrededor de 500 minutos al mes entre las 50 extensiones, unos 10 minutos por extensión. En nueve cortes consecutivos (diciembre 2025 a agosto 2026) el consumo nunca superó el 6.8% y cayó hasta el mínimo histórico de 2.3% en julio.\n\n' +
    'No es una cuenta enferma de servicio: 14 tickets en 11 meses y solo 1 falla —del lado del cliente—; el clúster de tickets fue de configuración en febrero-marzo y después silencio. Es una venta sobredimensionada que nunca tuvo plan de adopción: bajo SLA de llamadas entrantes documentado, sin chat, sin integración API, sin pago automático y adopción de 35/100. La señal CONSUMO_CRITICO ya está en sus notas y el Radar de Cuenta respondido por Dan el 26 de agosto lo nombra sin rodeos: "probable downgrade — fuerte posibilidad de que deseen reducir el número de extensiones".\n\n' +
    'La lectura estratégica: es el perfil exacto del Patrón A del análisis de downgrades de junio (GBS, MKG, Salud y Hogar) — el cliente que un día abre su corte, ve 4% de consumo y recorta él solo. La ventana para dirigir nosotros el ajuste es corta y ya está abierta: Dan estableció contacto por WhatsApp con el titular y está gestionando una reunión urgente.',

  resultado_positivo:
    'Hay base para rescatar la relación, no solo el MRR: el Radar confirma flujo financiero ("tenemos respaldo de que la cuenta tiene flujo, es más un problema de adopción"), cero competencia reportada, cero fricción normalizada y cero shadow workflow — los números Callpicker siguen posicionados en sus carriers. ' +
    'El titular Jorge Armando Contreras (Director de Operaciones) conserva la decisión y ya respondió por WhatsApp. ' +
    'Dan invirtió 410 minutos medidos esta semana y dejó el perfil al 100% y el Radar 12/12 — es la primera cuenta de la cartera con el ritual SAC nuevo ejecutado completo. ' +
    'El mapa de decisores tiene segundo contacto: David Gallegos Tejeda, Encargado Regional en Aguascalientes.',

  hallazgos: [
    'Consumo promedio de 4.0% sobre 12,500 minutos durante 9 cortes consecutivos: máximo 6.8% (dic 2025), mínimo 2.3% (jul 2026). Las 50 extensiones consumen juntas ~500 min/mes — 10 minutos por extensión.',
    'La tendencia es descendente: 6.8 → 4.2 → 4.8 → 4.6 → 4.5 → 4.4 → 3.2 → 2.3 → 3.2%. No hay un solo mes de recuperación sostenida.',
    'El servicio funciona: 14 tickets en 11 meses, 1 sola falla (causa del cliente), el resto asistencia y configuración concentrados en feb-mar (10 de 14) — fase de arranque, luego silencio. El problema no es técnico, es de uso.',
    'Bajo SLA de llamadas entrantes documentado en el Radar: el equipo del cliente no contesta las llamadas que sí llegan — la telefonía nunca se integró a la operación diaria.',
    'Adopción 35/100 y cero módulos de valor activos: sin chat, sin integración API, sin pago automático. NPS nunca capturado.',
    'El propio Radar del asesor pronostica el riesgo: predictiva = "probable_downgrade" y señal de reducción = "usuarios", ambas por el bajo SLA de entrantes.',
    'Cuenta de difícil contacto: 2 intentos de llamada sin respuesta el 25-26 de agosto; el canal que funcionó fue WhatsApp directo con el titular.',
    'Verificación negativa completa: no aparece en GRC-AAA-2026, ni en cancelaciones de Análisis DATA, ni en los 69 downgrades de junio — el recorte aún no ocurre. La ventana sigue abierta.',
  ],

  cronologia: [
    { fecha: '3 Oct 2025',            responsable: 'Callpicker / Comercial',  evento: 'Alta de LI FINANCIERA (CID 176219, F61) con plan de 50 extensiones VyC y 12,500 minutos — dimensionado para una operación que nunca llegó a usarlo.', tipo: 'neutral' },
    { fecha: 'Dic 2025',              responsable: 'Operación del cliente',   evento: 'Primer corte: 852 minutos consumidos (6.8%) — el máximo histórico de la cuenta ya era sobrecapacidad severa.', tipo: 'problema' },
    { fecha: 'Feb–Mar 2026',          responsable: 'Soporte Callpicker',      evento: 'Clúster de configuración: 10 de los 14 tickets históricos (teléfonos IP, DIDs, dudas operativas). Fase de arranque sin plan de adopción posterior.', tipo: 'neutral' },
    { fecha: 'Jul 2026',              responsable: 'Operación del cliente',   evento: 'Mínimo histórico de consumo: 291 minutos (2.3%). Único ticket de falla del periodo — causa del lado del cliente.', tipo: 'problema' },
    { fecha: '25–26 Ago 2026',        responsable: 'Dan Domínguez',           evento: 'Ritual SAC completo: 2 intentos de llamada sin respuesta, contacto logrado por WhatsApp con el titular, perfil capturado al 100%, Radar 12/12, actividad completada con 410 min medidos. Se gestiona reunión urgente.', tipo: 'pivote' },
    { fecha: 'Próximas 2 semanas',    responsable: 'Dan / Dirección SAC',     evento: 'VENTANA CRÍTICA: concretar la reunión con propuesta de right-sizing dirigido antes de que el cliente descubra su 4% de consumo y pida el recorte él mismo.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'LI FINANCIERA' },
    { label: 'CID Zoho',              value: '176219' },
    { label: 'Consecutivo',           value: 'F61' },
    { label: 'Sector',                value: 'Servicios Financieros' },
    { label: 'Tamaño',                value: 'Mediana · 150 empleados · 1 oficina · lif.com.mx' },
    { label: 'Cliente desde',         value: 'Octubre 2025 (11 meses)' },
    { label: 'Plan contratado',       value: '50 Extensiones Visibilidad y Control · 12,500 minutos incluidos · $6,800/mes (plan principal)' },
    { label: 'MRR total CRM',         value: '$9,720.60/mes' },
    { label: 'Health Score CRM',      value: '64 / 100 · en_riesgo — engañoso: el HS no incorpora el % de consumo del corte' },
    { label: 'Score de adopción',     value: '35 / 100 · sin chat, sin API, sin pago automático' },
    { label: 'Contacto principal',    value: 'Jorge Armando Contreras Patiño — Director de Operaciones (Decision Maker) · 4491630542 · jorge.contreras@lif.com.mx' },
    { label: 'Contacto secundario',   value: 'David Gallegos Tejeda — Encargado Regional Aguascalientes · unidadespecializada@lif.com.mx' },
    { label: 'Asesor de cuenta',      value: 'Dan Domínguez · último contacto 26 Ago 2026 (WhatsApp exitoso)' },
    { label: 'Señales del sistema',   value: 'CONSUMO_CRITICO (notas) · Radar: probable_downgrade por reducción de usuarios' },
  ],

  necesidad_negocio:
    'LI FINANCIERA no necesita 50 extensiones: necesita que las llamadas que recibe se contesten. Su dolor operativo real es el bajo SLA de entrantes — una financiera con 150 empleados donde la telefonía nunca se integró a la operación diaria. ' +
    'La necesidad de fondo es un plan de adopción con dimensionamiento honesto: el número de extensiones que su operación realmente usa, capacitación del equipo receptor, y visibilidad de resultados para el Director de Operaciones. ' +
    'El Radar confirma que hay flujo financiero y que el problema "es más de adopción" — el presupuesto no es la barrera; el valor percibido sí.',

  potencial_corto: [
    'Concretar la reunión urgente ya gestionada por WhatsApp con Jorge Armando Contreras — llegar con la propuesta procesada, no con diagnóstico abierto.',
    'Presentar el right-sizing dirigido: ajuste de 50 extensiones al número real de uso, compensado con el plan de adopción que el propio Radar identificó (sesión de adopción + health check técnico + presentación de resultados + sesión ejecutiva).',
    'Levantar el SLA de entrantes como el KPI de la relación: es el dolor que el cliente sí siente.',
  ],

  potencial_largo: [
    'Re-expansión sobre uso real: una cuenta bien dimensionada que sube su SLA vuelve a crecer extensiones con base en datos, no en promesas de venta.',
    'Módulos de valor hoy en cero: chat, integración API y pago automático — una financiera con 150 empleados es candidata natural a los tres.',
    'Convertir el caso en precedente interno del playbook de right-sizing proactivo (recomendación #2 del análisis de downgrades de junio): 3 meses consecutivos <30% de consumo disparan intervención nuestra, no del cliente.',
  ],

  tacticas: [
    { nombre: 'Right-sizing dirigido (prioridad 1)',      descripcion: 'Candidatura MUY ALTA. Ajustar 50 → extensiones reales de uso ANTES de que el cliente lo pida, compensando MRR con módulos de adopción. Es la jugada que GBS y MKG hicieron solos en junio — aquí todavía podemos dirigirla nosotros.', impacto: 'Conserva la relación y la narrativa; convierte un recorte inevitable en un ajuste con ruta de regreso.' },
    { nombre: 'Plan de adopción / capacitación',          descripcion: 'Candidatura MUY ALTA. Sesión de adopción, health check técnico, presentación de resultados y sesión ejecutiva — ya identificadas por Dan en el Radar. El equipo del cliente no contesta sus entrantes: eso se entrena.', impacto: 'Ataca la causa raíz (uso), no el síntoma (costo).' },
    { nombre: 'Reportería ejecutiva de SLA',              descripcion: 'Candidatura ALTA. Reporte mensual de entrantes/contestadas al Director de Operaciones: visibilidad que hoy no existe y que sostiene la conversación de valor.', impacto: 'El titular ve resultados en su lenguaje — retención por evidencia.' },
    { nombre: 'Callpicker Chat / omnicanalidad',          descripcion: 'Candidatura MEDIA. Financiera con atención a clientes y cero canal digital integrado. Solo DESPUÉS de estabilizar el right-sizing — proponerlo antes sonaría a vender más a quien usa 4%.', impacto: 'Nueva superficie de valor cuando la confianza esté restablecida.' },
    { nombre: 'Integración API / pago automático',        descripcion: 'Candidatura MEDIA. Ambos en cero. El pago automático además blinda la cobranza de una cuenta que ya es de difícil contacto.', impacto: 'Fricción administrativa a la baja; señal de permanencia.' },
  ],

  senal_alarma:
    'PRONÓSTICO: downgrade masivo autoiniciado en el corto plazo si la reunión no se concreta. El consumo de julio (2.3%) fue el mínimo histórico, el Radar del propio asesor pronostica "probable_downgrade" por reducción de usuarios, y la cuenta es de difícil contacto — si el siguiente contacto lo inicia el cliente, será para recortar, y el que recorta solo aprende a recortarnos (patrón GBS/MKG, junio 2026). ' +
    'El HS de 64 es un falso tranquilizador: no incorpora consumo, por lo que esta cuenta luce estable en el Dashboard mientras acumula 9 meses de evidencia para pedir la tijera. Exposición: hasta $9,720/mes de MRR.',

  problema_raiz:
    'Venta sobredimensionada sin plan de adopción: 50 extensiones para una operación que consume el 4%, con un equipo que no contesta sus llamadas entrantes.',

  problema_raiz_detalle:
    'La cuenta nació en octubre de 2025 con un plan calibrado para una operación que nunca se materializó: desde el primer corte (6.8%) ya estaba en sobrecapacidad severa, y en nueve meses jamás cruzó el 7%. ' +
    'El ciclo de vida lo confirma: 10 de los 14 tickets son de configuración en feb-mar (arranque) y después silencio — no hubo fase de adopción, capacitación ni seguimiento de uso. ' +
    'El síntoma visible es el consumo; la causa operativa es el bajo SLA de entrantes: la telefonía no está integrada al flujo de trabajo de los 150 empleados. ' +
    'Y la causa comercial es estructural: nadie en el proceso detectó —ni actuó sobre— nueve cortes consecutivos de consumo crítico que estaban en nuestro propio Informe de Cortes. La señal CONSUMO_CRITICO existía; el playbook para actuar sobre ella, no.',

  flujo_real: [
    { fase: 'Venta (Oct 2025)',       area: 'Comercial',              accion: 'Se contratan 50 extensiones VyC con 12,500 minutos.',                              resultado: 'Dimensionamiento nunca validado contra la operación real del cliente.' },
    { fase: 'Arranque (Feb-Mar)',     area: 'Soporte',                accion: 'Configuración de teléfonos IP, DIDs y dudas operativas (10 tickets).',             resultado: 'Cuenta técnicamente funcional; sin plan de adopción posterior.' },
    { fase: 'Operación (Dic-Jul)',    area: 'Cliente',                accion: 'Uso marginal: ~500 min/mes entre 50 extensiones; entrantes sin contestar.',        resultado: 'Consumo 6.8% → 2.3%. Nueve cortes de CONSUMO_CRITICO sin intervención.' },
    { fase: 'Detección (24-26 Ago)',  area: 'Dan / ritual SAC',       accion: 'Actividad de perfil + Radar 12/12: se documenta el bajo SLA y el riesgo de reducción.', resultado: 'Pronóstico interno: probable_downgrade. Contacto logrado por WhatsApp; reunión urgente en gestión.' },
    { fase: 'Ventana (hoy)',          area: 'Dan / Dirección SAC',    accion: 'Reunión con propuesta de right-sizing + adopción, antes del reclamo del cliente.', resultado: 'PENDIENTE — define si el ajuste lo dirigimos nosotros o nos lo imponen.' },
  ],

  comparativo: [
    { metrica: 'Minutos consumidos / incluidos',   real: '~500 de 12,500 (4.0% promedio)',        ideal: 'Plan dimensionado a uso real con holgura sana (40-70%)' },
    { metrica: 'Extensiones activas en la práctica', real: '50 contratadas · ~10 min/ext/mes',      ideal: 'Número validado en sitio contra puestos que realmente llaman/contestan' },
    { metrica: 'SLA de llamadas entrantes',        real: 'Bajo — documentado en Radar',            ideal: 'KPI mensual reportado al Director de Operaciones' },
    { metrica: 'Módulos de valor',                 real: 'Chat, API y pago automático en cero',    ideal: 'Al menos un módulo de valor activo compensando el ajuste de plan' },
    { metrica: 'Detección interna',                real: '9 cortes CONSUMO_CRITICO sin intervención', ideal: 'Right-sizing proactivo al 3er mes <30% (playbook junio)' },
    { metrica: 'Salud reportada',                  real: 'HS 64 (sin variable de consumo)',        ideal: 'HS que incorpore % de consumo — cambio ya recomendado en el análisis de downgrades' },
  ],

  plan_inmediato: [
    { accion: 'Concretar la reunión urgente con Jorge Armando Contreras (ya en gestión por WhatsApp).',                        responsable: 'Dan Domínguez',       criterio: 'Reunión agendada dentro de las próximas 2 semanas — la ventana crítica.' },
    { accion: 'Preparar la propuesta de right-sizing con números procesados: extensiones reales de uso + costo del ajuste + plan de adopción compensatorio.', responsable: 'Dan / Dirección SAC', criterio: 'Propuesta lista ANTES de la reunión; no se llega con diagnóstico abierto.' },
    { accion: 'Validar con facturación el desglose del MRR ($9,720 CRM vs $6,800 del plan principal) para conocer el margen real de la negociación.', responsable: 'Dirección SAC',       criterio: 'Desglose confirmado por artículo.' },
  ],

  plan_mediano: [
    { accion: 'Ejecutar el plan de adopción: sesión de adopción, health check técnico, capacitación del equipo receptor.',      responsable: 'Dan / SAC',           criterio: 'SLA de entrantes con mejora medible en 60 días.' },
    { accion: 'Instalar la reportería ejecutiva mensual de SLA para el Director de Operaciones.',                               responsable: 'SAC',                 criterio: 'Primer reporte entregado y comentado con el titular.' },
  ],

  plan_estrategico: [
    { accion: 'Formalizar el playbook de right-sizing proactivo: 3 meses consecutivos <30% de consumo disparan intervención nuestra.', responsable: 'Dirección SAC',  criterio: 'Regla operando sobre el Informe de Cortes para toda la cartera.' },
    { accion: 'Incorporar el % de consumo al Health Score (LI FINANCIERA con HS 64 y 4% de consumo es la prueba del hueco).',          responsable: 'Dirección SAC',  criterio: 'HS recalculado con la variable de consumo.' },
    { accion: 'Re-expansión basada en uso: revisar en 6 meses si el SLA levantado justifica crecer extensiones o activar chat/API.',   responsable: 'Dan / Comercial', criterio: 'Decisión documentada con datos de cortes post-ajuste.' },
  ],

  areas_oportunidad: [
    { area: 'Right-sizing dirigido + plan de adopción',   impacto: 'Muy alto — define si conservamos la cuenta bien dimensionada o perdemos el MRR a un recorte impuesto.', responsable: 'Dan / Dirección SAC' },
    { area: 'Reportería de SLA al titular',               impacto: 'Alto — construye la relación con el Decision Maker en su lenguaje.',                                     responsable: 'SAC' },
    { area: 'Chat + API + pago automático',               impacto: 'Medio — superficie de valor post-estabilización; hoy los tres en cero.',                                 responsable: 'Comercial / SAC' },
    { area: 'Playbook de consumo crítico para la cartera', impacto: 'Alto — LI FINANCIERA es el caso testigo; la regla protege al resto de las cuentas del mismo patrón.',   responsable: 'Dirección SAC' },
  ],

  perfiles: [
    {
      nombre: 'Jorge Armando Contreras Patiño',
      rol:    'Director de Operaciones — Decision Maker',
      color:  '#6366f1',
      campos: [
        { label: 'Contacto',   value: '4491630542 · jorge.contreras@lif.com.mx' },
        { label: 'Influencia', value: 'Titular; conserva la decisión (confirmado en Radar).' },
        { label: 'Canal',      value: 'Difícil por teléfono (2 intentos sin respuesta 25-26 Ago); responde por WhatsApp.' },
        { label: 'Siguiente paso', value: 'Reunión urgente en gestión — destinatario de la propuesta de right-sizing + adopción.' },
      ],
    },
    {
      nombre: 'David Gallegos Tejeda',
      rol:    'Encargado Regional en Aguascalientes — contacto secundario',
      color:  '#94a3b8',
      campos: [
        { label: 'Contacto', value: '4491627186 · unidadespecializada@lif.com.mx' },
        { label: 'Valor',    value: 'Respaldo operativo del mapa de decisores; canal alterno si el titular no responde.' },
      ],
    },
    {
      nombre: 'Dan Domínguez',
      rol:    'Asesor de cuenta — Callpicker',
      color:  '#22c55e',
      campos: [
        { label: 'Trabajo reciente', value: 'Ritual SAC completo la semana del 24 Ago: perfil 100%, Radar 12/12, 410 minutos medidos, contacto por WhatsApp logrado.' },
        { label: 'Enfoque',          value: 'Llegar a la reunión con la propuesta procesada. El mensaje no es "usas poco" sino "te sobra plan y te falta adopción — así lo arreglamos".' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Servicio técnicamente impecable: 1 sola falla en 11 meses, y fue del lado del cliente.',
      'Flujo financiero confirmado: el presupuesto no es la barrera (Radar, pregunta de finanzas).',
      'Mapa de decisores completo (titular + regional) y perfil/Radar al 100% — primera cuenta con el ritual SAC nuevo ejecutado completo.',
      'Canal de contacto encontrado: WhatsApp directo con el Decision Maker.',
    ],
    oportunidades: [
      'Right-sizing dirigido por nosotros: convertir el downgrade inevitable en un ajuste con narrativa y ruta de regreso.',
      'Plan de adopción sobre el dolor real (SLA de entrantes) — ya identificado por el propio Radar.',
      'Tres módulos de valor en cero (chat, API, pago automático) como superficie de re-expansión.',
      'Caso testigo para el playbook de consumo crítico de toda la cartera.',
    ],
    debilidades: [
      'Consumo promedio 4% en 9 cortes — sobrecapacidad extrema nunca intervenida pese a estar en nuestro propio Informe de Cortes.',
      'Adopción 35/100: la telefonía no está integrada a la operación de los 150 empleados.',
      'Cuenta de difícil contacto: la relación con el titular apenas se está construyendo.',
      'HS 64 engañoso — sin variable de consumo, el Dashboard la pinta más sana de lo que está.',
    ],
    amenazas: [
      'Downgrade masivo autoiniciado: el cliente descubre su 4% y recorta solo (patrón GBS/MKG de junio).',
      'Julio marcó el mínimo histórico (2.3%) — la tendencia sigue cayendo.',
      'Si la reunión no se concreta, el siguiente contacto lo iniciará el cliente — y será para recortar.',
      'Exposición de hasta $9,720/mes de MRR en una cuenta de solo 11 meses de antigüedad.',
    ],
  },

  conclusion:
    'LI FINANCIERA no es una cuenta en riesgo de cancelación: es una cuenta en riesgo de recorte masivo por sobrecapacidad nunca intervenida. Nueve cortes consecutivos con consumo entre 2.3% y 6.8% sobre un plan de 50 extensiones son la evidencia que cualquier cliente convertiría en una solicitud de reducción — y el Radar del propio asesor ya lo pronostica. ' +
    'La diferencia entre perder $6,800-9,720 de MRR a un recorte impuesto y conservar una cuenta bien dimensionada con ruta de re-expansión es una sola cosa: quién dirige el ajuste. Dan ya abrió la puerta por WhatsApp; la reunión de las próximas dos semanas con la propuesta de right-sizing + adopción es la jugada completa de este caso. ' +
    'Y hacia adentro, LI FINANCIERA es la prueba de dos huecos ya señalados en el análisis de downgrades de junio: el Health Score no ve el consumo, y la señal CONSUMO_CRITICO no dispara ningún playbook. Este caso debe cerrar ambos.',

  pierde: [
    'Hasta $9,720/mes de MRR si el recorte lo dirige el cliente.',
    'La narrativa de asesoría: nueve meses de consumo crítico visibles en nuestro propio informe sin una sola intervención.',
    'Una financiera de 150 empleados como referencia del sector si la relación se degrada a negociación de precio.',
  ],

  gana: [
    'Una cuenta bien dimensionada, con SLA de entrantes como KPI compartido y ruta de re-expansión basada en datos.',
    'La relación con un Decision Maker que hoy apenas se está construyendo — entrando con solución, no con reclamo.',
    'El caso testigo que instala el playbook de right-sizing proactivo para toda la cartera.',
  ],

  recomendacion_central:
    'Dirigir nosotros el ajuste antes de que lo pida el cliente. La reunión urgente que Dan gestiona debe llevar la propuesta procesada: ajustar las 50 extensiones al número real de uso, compensar con el plan de adopción que el propio Radar identificó (sesión de adopción + health check técnico + presentación de resultados + sesión ejecutiva) y fijar el SLA de entrantes como el KPI de la relación. ' +
    'El mensaje al titular no es "usas poco": es "te sobra plan y te falta adopción — así lo arreglamos, esto cuesta y esto te devuelve". Si esa reunión no ocurre en dos semanas, tratar la cuenta como downgrade en curso y escalar a retención.',
}
