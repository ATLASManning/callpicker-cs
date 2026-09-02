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
