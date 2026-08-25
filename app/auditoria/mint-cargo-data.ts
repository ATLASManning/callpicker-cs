import type { AuditoriaCase } from './types'

/**
 * Fuente: "Reporte_Ejecutivo_Mint_Cargo_Extensiones Ilimitadas.docx"
 * Elaborado por el Equipo de Experiencia al Cliente · Ago 2026.
 *
 * Nota de fidelidad al documento: el reporte NO estima impacto económico
 * (la fuente no incluye valor de oportunidad, motivo de llamada ni resultado
 * de negocio) y NO recomienda ampliar extensiones — el plan ya las contempla
 * ilimitadas. Ambas restricciones se respetan aquí tal cual.
 */
export const MINT_CARGO: AuditoriaCase = {
  id:                    'mint-cargo',
  asesor:                'Claudia',
  nombre:                'MINT CARGO',
  sector:                'Transporte, logística, cadena de suministro y almacenamiento',
  fecha_periodo:         '4 Mayo – 24 Agosto 2026',
  fecha_auditoria:       'Ago 2026',
  tipo_cliente:          'Operación logística · plan con extensiones ilimitadas',
  descripcion_contexto:  'CID 164518 · Consecutivo Z58 · 81.6% llamadas entrantes · Asesora: Claudia Hernández',
  estado:                'activo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Llamadas analizadas',        value: '1,319',              color: '#6366f1' },
    { label: 'Lost entrantes',             value: '156 (14.5%)',        color: '#f59e0b' },
    { label: 'Lost salientes',             value: '78 (32.1%)',         color: '#ef4444' },
    { label: 'Extensiones',                value: 'Ilimitadas',         color: '#22c55e' },
  ],

  resumen_ejecutivo:
    'MINT CARGO presenta una operación telefónica predominantemente inbound: 1,076 llamadas entrantes (81.6%) frente a 243 salientes (18.4%), sobre una base analizada de 1,319 llamadas entre el 4 de mayo y el 24 de agosto de 2026.\n\n' +
    'El dato decisivo para la conversación comercial es que el plan actual ya contempla extensiones ilimitadas. La oportunidad no está en incrementar extensiones contratadas, sino en aprovechar mejor la capacidad disponible mediante enrutamiento, continuidad, medición, seguimiento e integración.\n\n' +
    'La presencia de destinos como Recepción, Fuera de Horario, FTL y LTL indica que el teléfono funciona como punto de coordinación para distintos tipos de demanda de la cadena logística, lo que exige reglas de atención diferenciadas y no solo más líneas.',

  resultado_positivo:
    'La cuenta tiene volumen suficiente para sostener indicadores de calidad: 1,319 llamadas en el periodo dan base estadística para grabación, reportería y monitoreo. ' +
    'La segmentación por destinos (Recepción, Fuera de Horario, FTL, LTL y usuarios específicos) ya existe, lo que significa que hay una estructura de enrutamiento sobre la cual construir en vez de partir de cero. ' +
    'Las extensiones ilimitadas incluidas en el plan son capacidad instalada disponible: MINT CARGO puede reorganizar grupos, áreas y rutas sin costo adicional por cantidad de extensiones.',

  hallazgos: [
    'Predominio inbound: 1,076 llamadas entrantes (81.6%). La disponibilidad del canal de entrada es crítica para la operación.',
    'Lost inbound: 156 llamadas (14.5%). Debe determinarse si corresponden a abandonos, no disponibilidad o reglas de enrutamiento — el significado exacto de "Lost" está pendiente de validar con el cliente.',
    'Lost outbound: 78 llamadas (32.1%). Casi 1 de cada 3 llamadas salientes aparece como Lost; existe oportunidad de seguimiento, sujeta a validar la causa.',
    'Concentración horaria en el mediodía: máximo de 145 llamadas a las 12:00 y 121 a las 13:00. Ventana prioritaria para capacidad y desborde.',
    'Martes es el día de mayor volumen con 324 llamadas: conviene revisar cobertura y carga en esa jornada.',
    'La duración no está capturada de forma homogénea en todos los registros, por lo que no se puede usar como KPI global de productividad.',
    'Extensiones ilimitadas ya incluidas en el plan: la oportunidad está en utilización y gestión, no en agregar extensiones.',
  ],

  cronologia: [
    { fecha: '4 Oct 2024',            responsable: 'Callpicker',                        evento: 'Alta de la cuenta MINT CARGO (CID 164518, consecutivo Z58).', tipo: 'ok' },
    { fecha: '4 May – 24 Ago 2026',   responsable: 'Callpicker / Análisis de datos',    evento: 'Periodo analizado: 1,319 llamadas registradas — 1,076 entrantes y 243 salientes.', tipo: 'neutral' },
    { fecha: 'Ago 2026',              responsable: 'Equipo Experiencia al Cliente',     evento: 'Se emite el reporte ejecutivo de análisis de llamadas entrantes y salientes bajo la premisa de extensiones ilimitadas.', tipo: 'pivote' },
    { fecha: 'Pendiente',             responsable: 'MINT CARGO / Claudia Hernández',    evento: 'Sesión de diagnóstico con Operación/SAC, Comercial y Sistemas para validar causas de Lost, mapear flujos críticos y definir un piloto con KPI de éxito.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',             value: 'MINT CARGO' },
    { label: 'CID Zoho',                 value: '164518' },
    { label: 'Consecutivo',              value: 'Z58' },
    { label: 'Sector',                   value: 'Transporte, logística, cadena de suministro y almacenamiento' },
    { label: 'Cliente desde',            value: 'Octubre 2024' },
    { label: 'Plan actual',              value: 'Extensiones ilimitadas' },
    { label: 'Contacto principal',       value: 'Arturo Garza — Coordinador de TI' },
    { label: 'Asesora de cuenta',        value: 'Claudia Hernández' },
    { label: 'Modalidad de operación',   value: '81.6% entrantes · 18.4% salientes' },
    { label: 'Destinos configurados',    value: 'Recepción · Fuera de Horario · FTL · LTL · usuarios específicos' },
    { label: 'Periodo analizado',        value: '4 May – 24 Ago 2026 (1,319 llamadas)' },
  ],

  necesidad_negocio:
    'MINT CARGO necesita disponibilidad, distribución correcta de llamadas, continuidad, seguimiento y trazabilidad. ' +
    'Su dependencia telefónica es alta: el teléfono participa tanto en la atención como en la coordinación de la cadena logística. ' +
    'El patrón es operativo–reactivo con componente de coordinación; la presencia de una ruta de Fuera de Horario y el peso del inbound hacen que la continuidad del servicio sea el eje del valor. ' +
    'El valor incremental no puede venir de más extensiones —ya son ilimitadas— sino de optimización y soluciones complementarias.',

  potencial_corto: [
    'Validar qué significa "Lost" en la operación del cliente y separar sus causas: es el KPI que puede estar ocultando problemas de naturaleza distinta.',
    'Revisar cobertura en la franja 11:00–16:00 y en particular los martes, que concentran 324 llamadas.',
    'Revisar la ruta de Fuera de Horario y las reglas de desborde: hay tráfico específico llegando por ahí.',
  ],

  potencial_largo: [
    'Reorganizar grupos, áreas y rutas aprovechando que las extensiones ilimitadas ya están incluidas en el plan.',
    'Implementar grabación, reportería y monitoreo: hay volumen suficiente para generar indicadores confiables.',
    'Estructurar un proceso de seguimiento para el outbound Lost (32.1%), tratándolo como proceso de recuperación de contacto y no como volumen de llamadas.',
    'Evaluar integración con CRM/TMS/ERP según el proceso real, para que la llamada no quede aislada del resto de la operación logística.',
    'Piloto de IA de voz o chat en un proceso repetitivo, con automatización selectiva y medible.',
  ],

  tacticas: [
    { nombre: 'Conmutador empresarial/virtual', descripcion: 'Candidatura MUY ALTA. Predominio inbound con múltiples destinos: optimizar IVR, grupos, colas, horarios y desborde.', impacto: 'Más continuidad y menor fricción.' },
    { nombre: 'Grabación y reportes',           descripcion: 'Candidatura MUY ALTA. Volumen suficiente y necesidad de trazabilidad: medir, auditar y revisar conversaciones.', impacto: 'Calidad y coaching.' },
    { nombre: 'Sígueme / continuidad',          descripcion: 'Candidatura ALTA. Usuarios y riesgo de indisponibilidad: rutas alternativas según horario y persona.', impacto: 'Menos llamadas Lost.' },
    { nombre: 'Calidad y monitoreo',            descripcion: 'Candidatura ALTA. Necesidad de conocer causas y desempeño mediante scorecards y monitoreo.', impacto: 'Mejora continua.' },
    { nombre: 'Seguimiento inteligente',        descripcion: 'Candidatura ALTA. El outbound Lost llega a 32.1%: cadencias y recuperación de contacto.', impacto: 'Mayor contacto efectivo.' },
    { nombre: 'Integraciones API / webhooks',   descripcion: 'Candidatura ALTA. Unir comunicación y operación logística enviando resultados y eventos a sistemas.', impacto: 'Trazabilidad y automatización.' },
    { nombre: 'IA de voz / asistentes',         descripcion: 'Candidatura MEDIA-ALTA. Fuera de Horario y consultas repetitivas: atención inicial 24/7, captura y transferencia.', impacto: 'Cobertura y productividad.' },
    { nombre: 'Callpicker Chat / omnicanalidad',descripcion: 'Candidatura MEDIA-ALTA. Derivar consultas no críticas a digital: WhatsApp, chat web y redes.', impacto: 'Experiencia consistente.' },
    { nombre: 'IA de chat',                     descripcion: 'Candidatura MEDIA. Consultas y captura estructurada para automatizar interacciones textuales.', impacto: 'Escalabilidad.' },
  ],

  senal_alarma:
    'NO recomendar ampliar extensiones como propuesta de valor: el plan ya las contempla de forma ilimitada. ' +
    'Proponer más extensiones a esta cuenta destruye credibilidad, porque el cliente ya paga por capacidad que no está usando. ' +
    'La conversación debe migrar hacia cómo administrar mejor esas extensiones y qué soluciones adicionales convierten esa capacidad en resultados.',

  problema_raiz:
    'Capacidad instalada infrautilizada: el plan ya incluye extensiones ilimitadas, pero la operación no está estructurada para aprovecharlas.',

  problema_raiz_detalle:
    'MINT CARGO no tiene un problema de falta de capacidad —tiene extensiones ilimitadas incluidas— sino de administración de esa capacidad. ' +
    'El 14.5% de las llamadas entrantes y el 32.1% de las salientes aparecen como Lost sin que exista hoy una diferenciación de causas, lo que impide saber si se trata de abandono del cliente, indisponibilidad de la operación o reglas de enrutamiento mal ajustadas. ' +
    'A eso se suma que la duración no se captura de forma uniforme, por lo que no hay un KPI global de productividad, y que no existe medición de calidad sobre las conversaciones. ' +
    'El resultado es una operación con volumen y estructura de destinos, pero sin el instrumental para diagnosticar dónde se está perdiendo el contacto ni para demostrar mejora.',

  flujo_real: [
    { fase: 'Entrada',          area: 'Recepción / FTL / LTL',   accion: 'La llamada entra y se enruta a uno de los destinos configurados.',            resultado: '1,076 llamadas entrantes en el periodo; 156 quedan en estado Lost (14.5%).' },
    { fase: 'Pico de demanda',  area: 'Operación',               accion: 'El tráfico se concentra entre las 11:00 y 16:00, con máximo a las 12:00.',     resultado: '145 llamadas a las 12:00 y 121 a las 13:00; martes acumula 324 llamadas.' },
    { fase: 'Fuera de horario', area: 'Ruta Fuera de Horario',   accion: 'Las llamadas fuera de la jornada caen en una ruta específica.',                resultado: 'Existe tráfico real por esa vía; falta definir qué se hace con él.' },
    { fase: 'Salientes',        area: 'Seguimiento',             accion: 'Se marca para coordinación y seguimiento.',                                    resultado: '243 llamadas salientes; 78 en estado Lost (32.1%), sin proceso de recuperación.' },
    { fase: 'Registro',         area: 'Sistemas',                accion: 'No se ha confirmado si las llamadas se registran en CRM, TMS o ERP.',          resultado: 'Riesgo de que la llamada quede aislada del proceso logístico.' },
  ],

  comparativo: [
    { metrica: 'Llamadas entrantes',            real: '1,076 (81.6%)',        ideal: 'Canal principal — requiere disponibilidad garantizada' },
    { metrica: 'Llamadas salientes',            real: '243 (18.4%)',          ideal: 'Proceso de seguimiento medido, no volumen suelto' },
    { metrica: 'Lost entrantes',                real: '156 (14.5%)',          ideal: 'Causa diferenciada y reducida vía desborde y continuidad' },
    { metrica: 'Lost salientes',                real: '78 (32.1%)',           ideal: 'Cadencia de recuperación de contacto definida' },
    { metrica: 'Duración de llamada',           real: 'No homogénea',         ideal: 'Capturada de forma uniforme para servir de KPI' },
    { metrica: 'Extensiones',                   real: 'Ilimitadas, sin estructura clara de grupos/rutas', ideal: 'Grupos, áreas y rutas reorganizados sobre la capacidad ya incluida' },
    { metrica: 'Medición de calidad',           real: 'Sin grabación ni scorecards',  ideal: 'Grabación, reportería y monitoreo activos' },
  ],

  plan_inmediato: [
    { accion: 'Validar qué significa "Lost" para MINT CARGO y separar sus causas.',      responsable: 'Claudia Hernández / MINT CARGO', criterio: 'Diagnóstico confiable: es el KPI que puede ocultar problemas distintos.' },
    { accion: 'Revisar cobertura en la franja 11:00–16:00 y los martes.',                 responsable: 'MINT CARGO (Operación)',         criterio: 'Menor riesgo de saturación en las ventanas de alta actividad.' },
    { accion: 'Revisar la ruta de Fuera de Horario y las reglas de desborde.',            responsable: 'Claudia Hernández / Soporte',    criterio: 'Continuidad: hay tráfico específico llegando por esa ruta.' },
  ],

  plan_mediano: [
    { accion: 'Reorganizar grupos, áreas y rutas aprovechando las extensiones ilimitadas.', responsable: 'Callpicker / MINT CARGO',      criterio: 'Mejor utilización del plan ya contratado.' },
    { accion: 'Implementar grabación, reportería y monitoreo.',                             responsable: 'Callpicker',                   criterio: 'Calidad y trazabilidad: existe volumen para generar indicadores.' },
    { accion: 'Estructurar el seguimiento del outbound Lost.',                              responsable: 'MINT CARGO (Comercial)',       criterio: 'Recuperación de contactos: hoy 32.1% aparece como Lost.' },
    { accion: 'Evaluar integración con CRM/TMS/ERP según el proceso real.',                 responsable: 'MINT CARGO (Sistemas)',        criterio: 'Trazabilidad: evita que la llamada quede aislada.' },
  ],

  plan_estrategico: [
    { accion: 'Piloto de IA de voz o chat en un proceso repetitivo.',                        responsable: 'Callpicker / MINT CARGO',      criterio: 'Capacidad adicional mediante automatización selectiva y medible.' },
    { accion: 'Sesión de diagnóstico con Operación/SAC, Comercial y Sistemas.',              responsable: 'Claudia Hernández',            criterio: 'Validar causas de Lost, mapear flujos críticos y definir un piloto con KPI de éxito.' },
  ],

  areas_oportunidad: [
    { area: 'Optimización del conmutador (IVR, grupos, colas, horarios, desborde)', impacto: 'Muy alto — responde directamente al predominio inbound con múltiples destinos.', responsable: 'Callpicker' },
    { area: 'Grabación y reportería',                                                impacto: 'Muy alto — habilita medición de calidad sobre un volumen que ya existe.',       responsable: 'Callpicker' },
    { area: 'Continuidad / Sígueme',                                                 impacto: 'Alto — reduce Lost por indisponibilidad.',                                     responsable: 'Callpicker' },
    { area: 'Seguimiento inteligente del outbound',                                  impacto: 'Alto — 32.1% de las salientes queda sin contacto efectivo.',                    responsable: 'MINT CARGO (Comercial)' },
    { area: 'Integración API / webhooks con TMS/ERP',                                impacto: 'Alto — conecta la llamada con el proceso logístico.',                           responsable: 'MINT CARGO (Sistemas)' },
    { area: 'IA de voz para Fuera de Horario',                                       impacto: 'Medio-alto — cobertura 24/7 y captura en consultas repetitivas.',               responsable: 'Callpicker' },
  ],

  perfiles: [
    {
      nombre: 'Arturo Garza',
      rol:    'Coordinador de TI — contacto principal',
      color:  '#6366f1',
      campos: [
        { label: 'Teléfono',  value: '(81) 2152-5780' },
        { label: 'Correo',    value: 'arturo.garza@mintcargo.com' },
        { label: 'Relevancia',value: 'Interlocutor técnico para enrutamiento, integraciones y reglas de desborde.' },
        { label: 'Pendiente', value: 'Confirmar si existen otros decisores en Operación y Comercial para la sesión de diagnóstico.' },
      ],
    },
    {
      nombre: 'Claudia Hernández',
      rol:    'Asesora de cuenta — Callpicker',
      color:  '#22c55e',
      campos: [
        { label: 'Responsabilidad', value: 'Conducir la sesión de diagnóstico y validar el significado de "Lost" con el cliente.' },
        { label: 'Enfoque',         value: 'Optimización del conmutador + reportería como primera propuesta; NO ampliación de extensiones.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Volumen significativo: 1,319 llamadas en el periodo analizado.',
      'Múltiples destinos ya configurados (Recepción, Fuera de Horario, FTL, LTL, usuarios).',
      'Extensiones ilimitadas ya incluidas en el plan: capacidad instalada para crecer sin contratar más.',
    ],
    oportunidades: [
      'Reducir llamadas Lost tanto entrantes como salientes.',
      'Optimizar el desborde y mejorar la ruta de Fuera de Horario.',
      'Activar grabación y trazabilidad sobre un volumen que ya lo justifica.',
      'Integrar la telefonía con los sistemas de operación logística.',
      'Automatizar consultas repetitivas mediante IA de voz o chat.',
    ],
    debilidades: [
      'Lost inbound (14.5%) y outbound (32.1%) sin causas diferenciadas.',
      'Duración de llamada capturada de forma incompleta: no sirve como KPI global.',
      'Sin medición de calidad sobre las conversaciones.',
    ],
    amenazas: [
      'Saturación en los picos de mediodía y los martes.',
      'Contactos críticos que llegan fuera de horario y pueden quedar sin atención.',
      'Pérdida de seguimiento en el outbound, con riesgo de retraso o fricción operativa.',
    ],
  },

  conclusion:
    'MINT CARGO cuenta con una base telefónica activa y un plan con extensiones ilimitadas que ofrece capacidad instalada suficiente para evolucionar la operación sin que el siguiente paso sea contratar más extensiones. ' +
    'La oportunidad está en administrar mejor esa capacidad: distribuir llamadas de acuerdo con la demanda, asegurar continuidad, recuperar contactos Lost, medir calidad, integrar resultados con los procesos de logística y automatizar interacciones repetitivas. ' +
    'El camino recomendado es progresivo: primero control y analítica, después optimización y finalmente automatización. ' +
    'La madurez operativa es media —hay volumen, segmentación de destinos y capacidad de extensiones— pero falta profundizar en medición de resultados y en las causas de las llamadas Lost.',

  pierde: [
    'Contactos entrantes que quedan en estado Lost sin que se conozca la causa (156 en el periodo).',
    'Seguimiento del outbound: 78 llamadas salientes Lost sin proceso de recuperación.',
    'Visibilidad de calidad: sin grabación ni scorecards no hay forma de saber qué ocurre dentro de la llamada.',
    'Utilización del plan: paga extensiones ilimitadas sin una estructura de grupos y rutas que las aproveche.',
  ],

  gana: [
    'Mayor disponibilidad del canal de entrada, que es su canal principal.',
    'Continuidad en horarios críticos y fuera de jornada.',
    'Trazabilidad de la llamada dentro del proceso logístico mediante integración.',
    'Capacidad adicional sin costo por extensión, reorganizando lo que ya tiene contratado.',
  ],

  recomendacion_central:
    'Presentar primero la combinación optimización del conmutador + reportería/analítica: es la que responde más directamente al comportamiento observado. ' +
    'Después, según las respuestas del cliente, continuidad/sígueme, seguimiento inteligente, integración y automatización. ' +
    'Disparadores: si el Lost inbound corresponde a clientes o proveedores críticos → continuidad + desborde + monitoreo; si Fuera de Horario contiene consultas repetitivas → IA de voz; si existen registros manuales → integración/API; si el outbound Lost es seguimiento comercial → seguimiento inteligente; si no se escucha ni evalúa la operación → grabación + calidad. ' +
    'En ningún escenario la propuesta es ampliar extensiones.',

  documentos: [
    {
      nombre:      'Reporte Ejecutivo · MINT CARGO — Extensiones Ilimitadas',
      ruta:        '/docs/Reporte_Ejecutivo_Mint_Cargo_Extensiones_Ilimitadas.docx',
      descripcion: 'Análisis de llamadas entrantes y salientes, 4 May – 24 Ago 2026. Equipo Experiencia al Cliente. Incluye las visualizaciones ejecutivas (distribución de destinos y concentración horaria de llamadas Lost).',
    },
  ],
}
