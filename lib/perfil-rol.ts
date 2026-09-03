/**
 * Perfil del rol Customer Success Manager / KAM Senior.
 *
 * Fuente: documento de vacante v2.0, Área de Satisfacción y Éxito del Cliente.
 * Es el EJE del trabajo del equipo: cada actividad que genera el dashboard debe
 * poder rastrearse a una de estas responsabilidades. Si una actividad no
 * responde a ninguna, sobra.
 *
 * Este archivo es contenido, no lógica: se muestra en /perfil-rol y sirve de
 * referencia para el generador de actividades y para la evaluación de gestión.
 */

export interface Responsabilidad {
  clave:   string
  titulo:  string
  puntos:  string[]
  /** Cómo se materializa hoy en el dashboard. Vacío = todavía no instrumentado. */
  enDashboard: string[]
}

export const OBJETIVO_PUESTO = {
  titulo: 'Customer Success Manager / KAM Senior',
  area:   'Satisfacción y Éxito del Cliente',
  reportaA: 'Dirección de Satisfacción al Cliente',
  objetivo:
    'Ser el titular ejecutivo de una cartera de cuentas estratégicas. Anticipar riesgos, contener churn, ' +
    'incrementar adopción, detectar oportunidades legítimas de expansión y ser el traductor entre lo que el ' +
    'cliente necesita en su negocio y lo que la plataforma puede resolver.',
  noEs:
    'El objetivo no es "atender". Es que cada cuenta opere con salud sostenida, obtenga valor demostrable y ' +
    'perciba a la empresa como un aliado con criterio, no como un proveedor con soporte.',
  metricaAncla:
    'Mantener el churn del portafolio asignado por debajo del umbral definido por Dirección, medido en cuentas y en MRR/ARR.',
}

/** Los tres desplazamientos que definen el puesto. */
export const POSTURA = [
  {
    de: 'Reactivo', a: 'Proactivo',
    texto: 'No esperas la llamada del cliente. Convocas, preparas, propones. Cuando el cliente llama con un ' +
           'problema, tú ya sabías que estaba por aparecer y ya tienes una lectura sobre qué hacer.',
  },
  {
    de: 'Atención post-venta', a: 'Titular de cuenta',
    texto: 'Coordinas a soporte, implementación, producto y ventas alrededor del cliente. No te limitas a ' +
           'canalizar: tomas responsabilidad sobre el resultado.',
  },
  {
    de: 'Actividad', a: 'Resultado',
    texto: 'Te mide la retención, la expansión calificada, la salud del portafolio y la satisfacción del ' +
           'cliente. Las reuniones, los correos y los tickets son medio, no fin.',
  },
]

export const RESPONSABILIDADES: Responsabilidad[] = [
  {
    clave: '4.1', titulo: 'Gestión de la cartera y retención',
    puntos: [
      'Ser el titular ejecutivo de una cartera de cuentas estratégicas, con clasificación por tier y ratios por segmento.',
      'Anticipar riesgos de cancelación y downgrade con base en señales de uso, adopción, tickets, cambios de contacto y retrasos en pago.',
      'Ejecutar acciones preventivas documentadas ANTES de que el cliente exprese intención de baja.',
      'Contener churn con planes de recuperación estructurados cuando el riesgo se materializa.',
    ],
    enDashboard: [
      'Actividades SAC semanales, seleccionadas por señal de riesgo',
      'Health Score y semáforo por cuenta',
      'Módulo Churn: GRC AAA 2026 y análisis de cancelaciones',
      'Candado de cierre: una baja declarada abre expediente, no cierra la actividad',
    ],
  },
  {
    clave: '4.2', titulo: 'Adopción y valor demostrable',
    puntos: [
      'Construir el plan de éxito de cada cuenta con el cliente: objetivos en su lenguaje, línea base y meta medible.',
      'Monitorear la adopción real del stack contratado y proponer intervenciones ante subutilización.',
      'Presentar periódicamente a los stakeholders el valor obtenido: qué se logró, qué se evitó, qué sigue.',
      'Traducir la operación técnica a impacto de negocio.',
    ],
    enDashboard: [
      'Módulo Adopción de Producto por cuenta (8 productos)',
      'Cortes de facturación: plan contratado, consumo y uso del panel',
      'Radar de Cuenta: 12 preguntas de valor',
    ],
  },
  {
    clave: '4.3', titulo: 'Facilitación y coordinación interna',
    puntos: [
      'Coordinar a Soporte, Implementación, Producto, Ingeniería, Servicios Profesionales y Ventas alrededor de la cuenta.',
      'Ser el punto único de contacto ejecutivo para el cliente.',
      'Escalar con criterio y con evidencia cuando la solución excede tu ámbito.',
      'Cerrar el ciclo con el cliente cada vez que la empresa entrega una solución.',
    ],
    enDashboard: [
      'Tickets Zoho por cuenta, con categoría, subcategoría, producto y prioridad',
      'Pendiente de instrumentar: registro de escalamientos',
    ],
  },
  {
    clave: '4.4', titulo: 'Análisis y valor por encima de la llamada',
    puntos: [
      'Producir análisis periódicos: uso, tendencias, comparativos y benchmarks de sector cuando existan datos.',
      'Investigar el sector del cliente para llegar con contexto de mercado, no solo con datos de plataforma.',
      'Preparar informes ejecutivos que un director pueda leer en cinco minutos y decidir.',
      'Entregar recomendaciones concretas y accionables, no observaciones vagas.',
      'Cada interacción debe dejar valor tangible: una reunión sin información, decisión o compromiso nuevo es una reunión perdida.',
    ],
    enDashboard: [
      'Atlas IA con dossier por cuenta y lectura comercial',
      'Datos enriquecidos: giro, sedes, franquicias, contactabilidad',
      'Auditoría de Cuentas con hallazgos y FODA',
    ],
  },
  {
    clave: '4.5', titulo: 'Detección y calificación de expansión',
    puntos: [
      'Identificar necesidades legítimas de expansión desde el problema de negocio, no desde el catálogo.',
      'Calificar cada hipótesis: necesidad confirmada, interlocutor con capacidad de decisión, impacto estimado y siguiente paso acordado.',
      'Traspasar a Ventas solo hipótesis calificadas y documentadas.',
      'Acompañar el proceso comercial protegiendo la relación de fondo.',
    ],
    enDashboard: [
      'Módulo Upsell y señales comerciales por cuenta',
      'Señal de red multi-sitio y franquicias',
    ],
  },
  {
    clave: '4.6', titulo: 'Voice of Customer y aporte al producto',
    puntos: [
      'Capturar de forma estructurada solicitudes, dolores y sugerencias.',
      'Consolidar mensualmente los insights más relevantes hacia Producto e Ingeniería, con contexto de impacto y frecuencia.',
      'Participar en sesiones de descubrimiento cuando Producto lo requiera.',
      'Ser voz honesta del cliente puertas adentro. Sin filtrar. Sin cosmético.',
    ],
    enDashboard: [
      'Pendiente de instrumentar: captura estructurada de Voice of Customer',
    ],
  },
  {
    clave: '4.7', titulo: 'Documentación y disciplina operativa',
    puntos: [
      'Mantener el expediente de cada cuenta completo y vigente.',
      'Registrar cada interacción relevante dentro de las 48 horas posteriores.',
      'Cumplir la cadencia de contacto acordada por tier.',
      'Producir minutas ejecutivas de cada reunión relevante.',
      'Sostener plan de éxito con menos de 30 días desde la última conversación real con el cliente.',
    ],
    enDashboard: [
      'Datos faltantes por cuenta, conciliados con lo que Atlas ya localizó',
      'Seguimientos KAM y último contacto',
      'Cronómetro y tiempo reportado por actividad',
    ],
  },
]

/* ══════════════════════════════════════════════════════════════════════════
   PROTOCOLO DE BAJA, DOWNGRADE Y RECUPERACIÓN DEL INGRESO
   ══════════════════════════════════════════════════════════════════════════
   Instrucción de dirección (1 Sep 2026), explícita: una cancelación no pasa
   al cajón de los olvidados. El trabajo del KAM no termina al registrar la
   baja — ahí empieza la parte que se evalúa.

   Lo que cambia respecto a como se venía trabajando: el plan de recuperación
   del ingreso NO se redacta después de perder la cuenta. Se prepara cuando la
   cuenta entra en riesgo, mientras todavía se puede contener.
   ══════════════════════════════════════════════════════════════════════════ */

export interface FaseProtocolo {
  fase:      string
  cuando:    string
  titulo:    string
  proposito: string
  entregables: string[]
  /** Qué impide el sistema si esto no está. */
  candado?:  string
}

export const PRINCIPIO_BAJA =
  'Una baja o cancelación de servicio NO pasa al cajón de los olvidados. Toda cuenta perdida exige ' +
  'historial, evidencia de lo que se hizo, causa raíz y un plan de recuperación del ingreso. ' +
  'No es siempre responsabilidad del asesor que un cliente cancele; sí lo es no haber actuado, ' +
  'no haber prevenido y no haber alertado a tiempo.'

export const PROTOCOLO_BAJA: FaseProtocolo[] = [
  {
    fase: 'ANTES',
    cuando: 'En cuanto la cuenta muestra señal de riesgo — no cuando el cliente avisa',
    titulo: 'Plan de contención y recuperación anticipado',
    proposito:
      'Esta es la actividad que más pesa y la que antes no existía. Cuando una cuenta entra en riesgo ' +
      'se abre una actividad P1 que exige tener listo, por escrito, cómo se contiene la pérdida y —si ' +
      'aun así ocurre— de dónde se recupera el ingreso. Redactarlo cuando la cuenta ya se fue es tarde: ' +
      'ya no hay con quién negociar ni información fresca.',
    entregables: [
      'Señal detectada, con fecha y evidencia (caída de consumo, panel sin uso, tickets, silencio del contacto)',
      'Monto de MRR en riesgo',
      'Hipótesis de causa y qué la confirmaría o descartaría',
      'Decisor económico identificado, no solo el contacto operativo',
      'Acciones de contención con fecha y responsable',
      'Plan de recuperación del ingreso ya redactado, por si la contención falla',
      'Fecha de revisión del plan',
    ],
  },
  {
    fase: 'DURANTE',
    cuando: 'Cuando el cliente expresa la intención de baja o de reducir servicio',
    titulo: 'Expediente obligatorio del evento',
    proposito:
      'Declarar una baja no cierra la actividad: abre expediente. La cuenta no cambia de estatus por lo ' +
      'que escriba el asesor — lo valida Dirección con la evidencia registrada. No se aceptan respuestas ' +
      'como "no contesta", "se cambió la persona" o "ya no es cliente" sin el análisis detrás.',
    entregables: [
      'Motivo real de la decisión, en palabras del cliente',
      'Fecha de la primera señal y fecha en que el cliente comunicó la decisión',
      'Historial completo: qué se hizo entre esa primera señal y hoy, con fechas y resultado de cada acción',
      '¿Existió plan? ¿Existió estrategia? Si no existieron, decirlo con todas sus letras',
      'Con quién se habló y en qué calidad: ¿decide o solo opera?',
      'Escalamientos realizados a soporte, producto, finanzas o Dirección, con fecha',
      'Evidencia: folio de ticket, correo, minuta o reunión',
      'Qué se pudo hacer antes y no se hizo',
    ],
    candado:
      'El sistema no permite cerrar la actividad mientras el expediente no esté sustentado.',
  },
  {
    fase: 'DESPUÉS',
    cuando: 'Baja o downgrade confirmado',
    titulo: 'Plan de recuperación del ingreso perdido',
    proposito:
      'La cancelación no se considera cerrada hasta que existe el análisis de pérdida y el plan de ' +
      'recuperación del monto. La cuenta permanece asignada al KAM durante el periodo de análisis: no ' +
      'desaparece de su cartera ni de sus indicadores.',
    entregables: [
      'Monto de MRR/ARR perdido, con el valor anterior y el posterior',
      'Objetivo de recuperación y plazo',
      'Estrategia: recuperar la misma cuenta · reactivar · expandir otra cuenta asignada · oportunidad nueva · recuperación parcial · no recuperable con justificación',
      'Cuentas u oportunidades concretas candidatas, con nombre',
      'Evidencia de que existe una necesidad verificable en esas cuentas',
      'Actividades concretas con fecha de primer avance',
      'Aprendizaje: qué señal se nos pasó y cómo se detecta antes la próxima vez',
    ],
    candado:
      'Un plan no puede consistir en "buscar nuevos clientes" o "dar seguimiento". Sin cuentas, fechas ' +
      'y acciones, no es un plan. Ninguna condición comercial, precio o descuento se ofrece sin VoBo de Dirección.',
  },
]

/**
 * Las dos reglas que no admiten excepción, por instrucción de dirección.
 * Van aparte porque son las que cierran las dos salidas que quedaban.
 */
export const REGLAS_DURAS = [
  {
    titulo: 'La cuenta no cambia de estatus hasta que esté documentado',
    texto:
      'Una baja o un downgrade no se registran por lo que diga el asesor. La cuenta permanece en su ' +
      'estatus actual —marcada en riesgo y visible para Dirección— hasta que el expediente esté completo: ' +
      'causa real, historial de lo que se hizo, si existió plan y estrategia, evidencia y plan de ' +
      'recuperación del ingreso. No existe la baja no documentada: mientras falte, la cuenta sigue ' +
      'contando en la cartera del KAM y en sus indicadores.',
  },
  {
    titulo: '"No había manera de saberlo" no es una defensa',
    texto:
      'El dashboard muestra las señales antes de que el cliente avise: caída de consumo contra su propia ' +
      'media, panel sin uso, tickets recurrentes, silencio del contacto, incidencias de pago y pérdida de ' +
      'contactabilidad. Si la baja ocurre sin que se haya actuado, la revisión no pregunta si el asesor ' +
      'sabía: verifica si la información estaba disponible y qué se hizo con ella. Cuando efectivamente ' +
      'no hubo señal detectable, el propio registro lo demuestra y la pérdida se clasifica como no ' +
      'prevenible — eso protege al asesor tanto como lo expone.',
  },
]

/** Respuestas que dejaron de ser aceptables al cerrar una actividad. */
export const RESPUESTAS_NO_ACEPTADAS = [
  { frase: '"No contesta"',              porque: 'No es un desenlace: es el inicio de una secuencia. Si además no hay a quién más contactar, ese vacío es el hallazgo de la cuenta.' },
  { frase: '"Ya no es la persona"',      porque: 'El cambio de decisor es una de las causas más frecuentes de baja. Exige saber quién quedó, desde cuándo y qué se hizo al enterarnos.' },
  { frase: '"Se dio de baja"',           porque: 'Abre expediente, no cierra la actividad. Sin causa, historial y evidencia no se registra la pérdida.' },
  { frase: '"Se dio seguimiento"',       porque: 'No describe ninguna gestión. No permite saber qué pasó con la cuenta.' },
  { frase: '"Sin novedades" · "Todo bien"', porque: 'La ausencia de información no es evidencia de salud.' },
]

/** Cómo se evalúa la gestión cuando ocurre una pérdida. Nunca se usa "culpa". */
export const EVALUACION_PERDIDA = [
  { etiqueta: 'Gestión preventiva documentada',  criterio: 'Riesgo identificado a tiempo, acciones oportunas con evidencia, contacto con quien decide, escalamiento cuando correspondía y plan de recuperación.' },
  { etiqueta: 'Gestión preventiva parcial',       criterio: 'Hubo acciones, pero tardías, incompletas, sin continuidad, sin decisor o sin evidencia.' },
  { etiqueta: 'Gestión preventiva insuficiente',  criterio: 'Sin seguimiento, sin contacto relevante, sin revisión de adopción, sin escalamiento, con compromisos vencidos o con explicaciones genéricas.' },
  { etiqueta: 'Causa externa comprobada',         criterio: 'Cierre del negocio, consolidación corporativa, fuerza mayor o decisión externa documentada.' },
  { etiqueta: 'En evaluación',                    criterio: 'Faltan datos para concluir. No se cierra el juicio hasta documentar causa, señales, acciones y evidencia.' },
]

/** Cadencia esperada. La de AAA es quincenal; la de Mid, mensual. */
export const CADENCIA = [
  { periodo: 'Diaria', detalle: 'Revisión de alertas, atención de urgencias, bloques de trabajo profundo, reuniones con clientes y cierre del día con próximos pasos actualizados.' },
  { periodo: 'Semanal', detalle: 'Planificación de lunes con priorización del portafolio, revisión de excepciones con el equipo el miércoles, cierre de viernes con actualización y reflexión operativa.' },
  { periodo: 'Quincenal', detalle: 'Reunión operativa con champion en cuentas AAA.' },
  { periodo: 'Mensual', detalle: 'Reunión con champion en cuentas Mid, revisión del portafolio con Dirección y contribución consolidada de Voice of Customer.' },
  { periodo: 'Trimestral', detalle: 'Revisión ejecutiva con dirección del cliente AAA, evaluación de desempeño con Dirección y actualización de plan personal.' },
]

export const INDICADORES_ANCLA = [
  { nombre: 'Churn de portafolio', definicion: 'Cuentas y MRR perdidos como porcentaje del portafolio asignado', meta: 'Por debajo del umbral definido' },
  { nombre: 'Net Revenue Retention (NRR)', definicion: 'Revenue del portafolio en T+12 sobre revenue en T, incluye expansión y contracción', meta: 'Por encima del umbral definido' },
  { nombre: 'Adopción del stack contratado', definicion: 'Uso real como porcentaje de lo contratado por cuenta', meta: 'Sostenida o creciente' },
  { nombre: 'Time-to-first-expansion', definicion: 'Días desde el ingreso de la cuenta hasta la primera hipótesis calificada entregada a Ventas', meta: 'Dentro del rango definido' },
  { nombre: 'CSAT / NPS del portafolio', definicion: 'Encuesta trimestral a champions y decisores', meta: 'Por encima del umbral definido' },
]

export const INDICADORES_DISCIPLINA = [
  'Expediente completo',
  'Cadencia cumplida',
  'Planes de éxito vigentes',
  'Acciones preventivas documentadas antes de eventos de baja',
  'Planes de recuperación activos cuando aplica',
]

export const COMPROMISOS = [
  'Operar cada cuenta bajo la metodología definida por el área.',
  'Mantener expediente completo y vigente para cada cuenta.',
  'Cumplir la cadencia acordada por tier.',
  'Registrar en el sistema dentro de la ventana de 48 horas.',
  'Escalar a tiempo cuando tu criterio no es suficiente.',
  'Proteger la relación con el cliente por encima de la métrica del mes.',
  'Aportar Voice of Customer con honestidad y frecuencia.',
  'Nunca comprometer condiciones comerciales, precios, descuentos o promesas no autorizadas.',
  'Nunca ocultar información desfavorable sobre una cuenta a Dirección.',
]

/** El anti-perfil, tal cual el documento. Sirve para calibrar la evaluación. */
export const ANTI_PERFIL = [
  'Perfil de servicio pasivo que espera instrucciones del cliente.',
  'Perfil vendedor ansioso que empuja producto por cumplir cuota.',
  'Perfil administrativo que confunde llenar el sistema con hacer trabajo.',
  'Perfil complaciente que evita conversaciones incómodas.',
  'Perfil que confunde cercanía con confianza excesiva o falta de límites.',
  'Perfil que necesita que alguien más piense por él o le diga qué priorizar cada semana.',
]
