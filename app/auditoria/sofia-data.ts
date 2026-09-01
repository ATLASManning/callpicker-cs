import type { AuditoriaCase } from './types'

/**
 * Caso generado por auditoría interna (28 Ago 2026). Fuentes: ficha CRM de
 * Sofia (F66), 7 cortes de facturación ene-ago 2026, 20 tickets Zoho Desk,
 * Radar ATLAS automático, registros KAM del 28 Ago y ticket de cancelación
 * del grupo RDS (Zoho Desk) cuyo alcance sigue sin confirmar.
 *
 * Caso hermano: 'rds-invest-vacay' — el post-mortem de las 2 cuentas RDS
 * canceladas el 28 Ago. Este caso audita la cuenta VIVA del grupo.
 */
export const SOFIA: AuditoriaCase = {
  id:                    'sofia',
  asesor:                'Claudia',
  nombre:                'Sofia',
  sector:                'Inmobiliario turístico — grupo con 3 subcuentas',
  fecha_periodo:         'Enero – Agosto 2026 (7 cortes de facturación)',
  fecha_auditoria:       'Ago 2026',
  tipo_cliente:          'Cuenta madre de grupo · $11,744 MRR · consumo intensivo saliente',
  descripcion_contexto:  'CID 178011 · Consecutivo F66 · Última cuenta del grupo RDS · Asesora: Claudia Hernández',
  estado:                'perdido',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.1',

  kpis: [
    { label: 'MRR del grupo',              value: '$11,744',         color: '#6366f1' },
    { label: 'Consumo último corte',       value: '90.3%',           color: '#22c55e' },
    { label: 'Sobreconsumos en 7 meses',   value: '2 (112% · 103%)', color: '#f59e0b' },
    { label: 'Perfil registrado',          value: '1/8 campos',      color: '#ef4444' },
  ],

  resumen_ejecutivo:
    'ACTUALIZACIÓN 31 AGO 2026 — PRONÓSTICO CONFIRMADO: el cliente solicitó la baja del servicio también de Sofia. La cuenta fue etiquetada como cancelada en cartera y sus actividades SAC bloqueadas. La pregunta que este caso dejó abierta ("¿la baja aplica a toda la razón social?") quedó respondida: sí. El texto siguiente se conserva como estaba al momento de la auditoría (28 Ago), tres días antes de la confirmación.\n\n' +
    'Sofia (F66) es la cuenta madre viva de un grupo de 3 subcuentas con $11,744 de MRR — el mismo grupo que el 28 de agosto canceló sus 2 cuentas a nombre de RDS ELITE CONDOS PDC (auditadas por separado en el caso RDS/Invest Vacay). Este caso audita lo que queda, y lo que queda es una paradoja:\n\n' +
    'Operativamente, Sofia es de las cuentas más sanas de la cartera: consume en promedio ~91% de su bolsa de 6,500 minutos, rebasó el 100% en dos de siete cortes (112.1% en marzo, 103.3% en mayo), su uso es intensivo en salientes, paga sin una sola incidencia y tiene contacto KAM esta misma semana. La capacidad ociosa es de apenas 9.7%: el siguiente sobreconsumo es cuestión de semanas.\n\n' +
    'Administrativamente, es de las más ciegas: 1 de 8 campos de perfil registrados, cero módulos activados en 7 meses, mapa de decisores vacío, observaciones KAM vacías, Radar de asesora 0/12 y la actividad SAC "Completar Perfil" de esta semana aún pendiente.\n\n' +
    'El agravante que define el caso: SOFIA Y RDS/INVEST VACAY SON DEL MISMO DUEÑO. El riesgo no es de "contagio" entre clientes distintos — es la misma persona que el 28 de agosto ya decidió cancelar 2 cuentas, ya declaró la migración a clic-a-WhatsApp y ya tiene a Bambete operando. El ticket abierto que pregunta si la baja aplica a toda la razón social no es un trámite: es preguntarle al mismo decisor si también apaga esta cuenta. Mientras esa respuesta no exista por escrito, los $11,744 completos penden de una decisión que su dueño ya tomó una vez.',

  resultado_positivo:
    'El perfil de consumo es el caso de upsell más limpio de la cartera: ~91% promedio, dos sobreconsumos ya facturados y tendencia +5.8% en los últimos 3 cortes contra los 3 anteriores. No hay que convencer a nadie de que use más: ya usa más de lo que contrató. ' +
    'Pagos al corriente 7 de 7 meses. Solo 1 falla real en 20 tickets — el resto es asistencia: la cuenta pregunta, no se queja. ' +
    'Y la relación está activa: 4 registros KAM esta semana y la asesora atendió la crisis del grupo el mismo día con contraofertas y ticket de seguimiento.',

  hallazgos: [
    'Consumo intensivo sostenido: 96.2% → 112.1% → 68.7% → 103.3% → 97.2% → 71.6% → 90.3%. Dos cortes por ENCIMA del 100% ya pagados como excedente. El plan creció una vez (5,000 → 6,500 min) y volvió a quedar corto.',
    'Capacidad ociosa de 9.7% con tendencia de consumo +5.8%: sin propuesta de ampliación, el próximo excedente se vivirá como cobro sorpresa en lugar de como upsell conversado.',
    'Perfil crítico: 1/8 campos registrados. Sin tamaño de empresa, sin dirección, sin decisores, sin observaciones KAM. El sistema marca dos CRÍTICOS simultáneos (Información y Módulos) en una cuenta que factura $11,744 de grupo.',
    '0/6 módulos activados en 7 meses: una cuenta que consume el 90%+ de su voz no tiene ni un ancla adicional — costo de salida bajo en el peor momento posible (competidor operando en el grupo).',
    '20 tickets en 5 meses, 16 de "Asistencia (voz)" con cadencia casi semanal may-jul: demanda clara de capacitación que nadie convirtió en plan de adopción.',
    'MISMO DUEÑO que las cuentas canceladas: Sofia y RDS/Invest Vacay pertenecen al mismo propietario. El ticket del 28 Ago que pregunta si la baja aplica "de acuerdo a la razón social, o únicamente RDS ELITE CONDOS PDC" se responde en el escritorio de quien ya canceló una vez. La diferencia es $2,387 vs $11,744.',
    'El decisor que canceló las cuentas hermanas (Ricardo Straffon) no estaba en el mapa de esta cuenta — y el mapa sigue vacío hoy. La actividad SAC que lo corregiría está pendiente desde el lunes.',
  ],

  cronologia: [
    { fecha: '6 Ene 2026',      responsable: 'Callpicker',              evento: 'Alta de Sofia (F66, CID 178011). Plan inicial VyC 5,000 minutos.', tipo: 'ok' },
    { fecha: 'Feb–Mar 2026',    responsable: 'Operación del cliente',   evento: 'Primeros cortes al límite: 96.2% y 112.1% (sobreconsumo). El plan sube a 6,500 minutos.', tipo: 'neutral' },
    { fecha: 'May 2026',        responsable: 'Operación del cliente',   evento: 'Segundo sobreconsumo: 103.3% de la bolsa ampliada. Nadie propone el siguiente escalón.', tipo: 'problema' },
    { fecha: 'May–Jul 2026',    responsable: 'Soporte',                 evento: 'Cadencia casi semanal de tickets de asistencia de voz (16 en el periodo) — apetito de capacitación sin plan de adopción.', tipo: 'neutral' },
    { fecha: '24 Ago 2026',     responsable: 'Ritual SAC',              evento: 'Se asigna la actividad "Completar Perfil" (perfil 1/8, Radar 0/12). Sigue PENDIENTE.', tipo: 'problema' },
    { fecha: '28 Ago 2026',     responsable: 'Grupo RDS / Claudia',     evento: 'El grupo cancela sus 2 cuentas RDS (ver caso hermano). Claudia abre ticket de alcance: ¿la baja cubre toda la razón social o solo RDS? SIN RESPUESTA ESCRITA AÚN.', tipo: 'pivote' },
    { fecha: 'Esta semana',     responsable: 'Claudia / Dirección SAC', evento: 'VENTANA: acotar la baja por escrito, completar perfil y decisores, y presentar la ampliación de bolsa sobre consumo demostrado.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Nombre de cuenta',     value: 'Sofia' },
    { label: 'CID Zoho',             value: '178011' },
    { label: 'Consecutivo',          value: 'F66' },
    { label: 'Grupo',                value: '3 subcuentas · $11,744 MRR · última factura Ago 2026 · mismo grupo de las cuentas RDS canceladas' },
    { label: 'Sector',               value: 'Inmobiliario turístico (Quintana Roo)' },
    { label: 'Cliente desde',        value: 'Enero 2026 (7 meses)' },
    { label: 'Plan vigente',         value: 'Visibilidad y Control 6,500 minutos · $5,850/mes (antes 5,000 min)' },
    { label: 'Consumo',              value: '90.3% último corte · ~91% promedio · 2 sobreconsumos · tendencia +5.8% · uso principal SALIENTES' },
    { label: 'Health Score',         value: '66 · Pagos 100 · KAM 100 · Información CRÍTICO (1/8) · Módulos CRÍTICO (0/6)' },
    { label: 'Radar ATLAS',          value: '73 OPTIMIZE · 3 alertas: decisores sin contactos · adopción sin datos · observaciones KAM vacías' },
    { label: 'Soporte',              value: '20 tickets · 1 falla · 16 de asistencia (voz) en cadencia semanal may-jul' },
    { label: 'Asesora',              value: 'Claudia Hernández · contacto esta semana · actividad SAC "Completar Perfil" PENDIENTE' },
    { label: 'Propiedad',            value: 'MISMO DUEÑO que RDS/Invest Vacay — el decisor que canceló las 2 cuentas el 28 Ago y contrató a Bambete' },
    { label: 'Riesgo externo',       value: 'Ticket de alcance de la cancelación RDS abierto · competidor Bambete operando con el mismo dueño' },
  ],

  necesidad_negocio:
    'La operación de Sofia vive de llamadas salientes y ya rebasó dos veces la bolsa que paga: su necesidad operativa inmediata es capacidad — el escalón siguiente de minutos, propuesto por nosotros antes del tercer excedente. ' +
    'Su necesidad de relación es ser conocida: hoy facturamos $11,744 a un grupo del que tenemos 1 campo de 8, cero decisores y cero contexto documentado — y ese grupo acaba de demostrar (caso RDS) que decide migraciones sin avisarnos. ' +
    'Y su necesidad estratégica es el ancla: con 0/6 módulos, lo único que nos une es la bolsa de voz; el grupo ya compró omnicanalidad fuera (Bambete). Cada módulo activado es costo de salida real.',

  potencial_corto: [
    'Cerrar el ticket de alcance con confirmación escrita: la baja cubre solo las 2 cuentas RDS. Nada se negocia antes de acotar la exposición.',
    'Completar HOY la actividad SAC pendiente: perfil 8/8, Radar 12/12 y mapa de decisores con Ricardo Straffon incluido.',
    'Presentar la ampliación de bolsa con los 7 cortes como evidencia: 2 sobreconsumos pagados y tendencia +5.8% hacen la propuesta irrefutable.',
  ],

  potencial_largo: [
    'Plan de adopción sobre la demanda real: convertir la cadencia de tickets de asistencia en capacitación y activación de módulos (objetivo inicial: panel administrador + un canal digital).',
    'Contraoferta omnicanal al grupo (Chat + IA + clic-a-WhatsApp) con decisores mapeados — la defensa directa frente a Bambete.',
    'Monitoreo de grupo en el Informe de Cortes: consumo y tickets por subcuenta con alerta de caída, para que el próximo movimiento no llegue por llamada.',
  ],

  tacticas: [
    { nombre: 'Acotar el alcance de la baja (prioridad 1)', descripcion: 'Candidatura MUY ALTA. Confirmación escrita de que la cancelación RDS no arrastra la razón social. Es un ticket abierto, no una negociación.', impacto: 'Contiene la exposición en $2,387 en lugar de $11,744.' },
    { nombre: 'Upsell de bolsa sobre consumo demostrado',   descripcion: 'Candidatura MUY ALTA. ~91% promedio, 2 excedentes pagados, ociosa 9.7%, tendencia +5.8%. Proponer el escalón siguiente ANTES del tercer sobreconsumo.', impacto: 'MRR incremental y conversación de valor en lugar de cobro sorpresa.' },
    { nombre: 'Perfil + decisores (SAC pendiente)',         descripcion: 'Candidatura ALTA. 1/8 campos y mapa vacío en la cuenta que queda del grupo que acaba de cancelar 2. La actividad ya está asignada — solo falta ejecutarla.', impacto: 'La próxima decisión del grupo se ve venir.' },
    { nombre: 'Adopción sobre los 20 tickets',              descripcion: 'Candidatura ALTA. 16 tickets de asistencia = apetito de capacitación; 0/6 módulos = nada que ancle. Un plan de onboarding tardío vale más que 16 respuestas sueltas.', impacto: 'Menos fricción y costo de salida real.' },
    { nombre: 'Omnicanal del grupo vs. Bambete',            descripcion: 'Candidatura MEDIA-ALTA. Chat + IA + clic-a-WhatsApp presentado a decisores reales. Después de acotar la baja y ampliar la bolsa — no antes.', impacto: 'Cierra la puerta por la que el grupo ya salió una vez.' },
  ],

  senal_alarma:
    'PRONÓSTICO: la cuenta se define en dos semanas, y la decisión está en manos de alguien que ya canceló una vez. Sofia y las cuentas RDS son DEL MISMO DUEÑO: el propietario ya declaró la migración a clic-a-WhatsApp, ya contrató a Bambete y ya ejecutó la baja de 2 cuentas — la única razón por la que Sofia sigue viva es que su operación de salientes (90%+ de consumo) todavía le funciona. Si el ticket de alcance queda sin acotar y el dueño consolida su migración, los $11,744 siguen el mismo camino — y con 0/6 módulos, nada técnico lo impide. ' +
    'La paradoja que debe quedar en actas: la cuenta con 90% de consumo y pagos perfectos está a una decisión de su propio dueño —que ya la tomó una vez— de convertirse en el churn más grande del trimestre. Facturar mucho no es conocer al cliente.',

  problema_raiz:
    'Cuenta facturada a ciegas: 7 meses de consumo intensivo y pagos perfectos convivieron con perfil vacío, cero decisores y cero módulos — el grupo decidió la cancelación de sus cuentas hermanas sin que existiera nadie mapeado a quién llamar antes.',

  problema_raiz_detalle:
    'El expediente muestra una cuenta que hizo todo lo que un cliente sano hace — usar el servicio al límite, pagar a tiempo, pedir ayuda por tickets — y una gestión que no capitalizó ninguna de esas señales: los dos sobreconsumos no dispararon propuesta de ampliación; los 16 tickets de asistencia no dispararon plan de capacitación; los 7 meses no produjeron ni perfil (1/8) ni decisores (0) ni módulos (0/6). ' +
    'Cuando el grupo decidió migrar su estrategia de contactación (caso RDS), la decisión la tomó una persona que no estaba en nuestro CRM, con un competidor que ya operaba, y nos enteramos en la llamada. La cuenta madre sobrevivió a esa ronda por inercia de su propio uso — no por gestión nuestra. ' +
    'Ese es el problema a corregir: Sofia no necesita rescate, necesita ser gestionada al nivel de lo que factura.',

  flujo_real: [
    { fase: 'Uso',        area: 'Operación Sofia',        accion: 'Salientes intensivas: 90%+ de la bolsa mes tras mes, 2 excedentes pagados.',            resultado: 'Cliente demostrando necesidad de capacidad — sin propuesta nuestra.' },
    { fase: 'Soporte',    area: 'Mesa Callpicker',        accion: '20 tickets resueltos, 16 de asistencia en cadencia semanal.',                            resultado: 'Fricción atendida una a una; apetito de capacitación sin plan.' },
    { fase: 'Gestión',    area: 'CRM / SAC',              accion: '7 meses sin capturar perfil, decisores ni observaciones; 0 módulos sembrados.',          resultado: 'Grupo de $11,744 administrativamente invisible.' },
    { fase: 'Crisis',     area: 'Grupo RDS (28 Ago)',     accion: 'El grupo cancela 2 cuentas hermanas con competidor operando.',                           resultado: 'Sofia queda expuesta: ticket de alcance abierto sobre la razón social.' },
    { fase: 'Hoy',        area: 'Claudia / Dirección',    accion: 'Acotar la baja + completar perfil + proponer ampliación.',                               resultado: 'PENDIENTE — define expansión o contagio.' },
  ],

  comparativo: [
    { metrica: 'Consumo vs. plan',        real: '~91% promedio · 2 meses >100% · ociosa 9.7%',      ideal: 'Escalón siguiente de bolsa propuesto antes del 3er excedente' },
    { metrica: 'Perfil',                  real: '1/8 campos · CRÍTICO',                              ideal: '8/8 — la actividad SAC pendiente lo exige esta semana' },
    { metrica: 'Decisores',               real: '0 mapeados (Straffon decidió sin existir para nosotros)', ideal: 'Mínimo 2 por entidad del grupo' },
    { metrica: 'Módulos',                 real: '0/6 en 7 meses',                                    ideal: 'Panel + 1 canal digital activados como primeras anclas' },
    { metrica: 'Tickets de asistencia',   real: '16 en cadencia semanal, resueltos uno a uno',       ideal: 'Plan de capacitación que baje la cadencia y suba adopción' },
    { metrica: 'Exposición contractual',  real: 'Ticket de alcance de la baja ABIERTO',              ideal: 'Confirmación escrita acotada a las 2 cuentas RDS' },
  ],

  plan_inmediato: [
    { accion: 'Cerrar el ticket de alcance con confirmación escrita: la baja cubre únicamente las 2 cuentas RDS.',        responsable: 'Claudia Hernández',   criterio: 'Notificación formal enviada y aceptada.' },
    { accion: 'Completar la actividad SAC pendiente: perfil 8/8, Radar 12/12, decisores con Straffon incluido.',           responsable: 'Claudia Hernández',   criterio: 'Actividad completada esta semana.' },
    { accion: 'Preparar la propuesta de ampliación de bolsa con los 7 cortes como evidencia.',                             responsable: 'Claudia / SAC',       criterio: 'Propuesta lista antes del corte de septiembre.' },
  ],

  plan_mediano: [
    { accion: 'Plan de adopción sobre la demanda de soporte: capacitación + activación de panel administrador y un canal digital.', responsable: 'SAC',            criterio: 'Primer módulo activado; cadencia de tickets a la baja.' },
    { accion: 'Sesión con decisores del grupo: contraoferta omnicanal (Chat + IA + clic-a-WhatsApp) frente a Bambete.',             responsable: 'Claudia / Dirección SAC', criterio: 'Reunión con al menos un decisor real del grupo.' },
  ],

  plan_estrategico: [
    { accion: 'Monitoreo de grupo en cortes: consumo y tickets por subcuenta con alerta de caída.',                        responsable: 'Dirección SAC',  criterio: 'El próximo movimiento del grupo se detecta antes de la llamada.' },
    { accion: 'Regla de cartera: 2 sobreconsumos consecutivos disparan propuesta de ampliación automática — Sofia como caso testigo.', responsable: 'Dirección SAC', criterio: 'Regla operando sobre el Informe de Cortes.' },
  ],

  areas_oportunidad: [
    { area: 'Acotar el alcance de la cancelación',   impacto: 'Muy alto — contiene la exposición en $2,387 vs $11,744.',             responsable: 'Claudia Hernández' },
    { area: 'Ampliación de bolsa',                   impacto: 'Muy alto — upsell sobre 2 excedentes ya pagados y tendencia +5.8%.',  responsable: 'Claudia / Comercial' },
    { area: 'Perfil + decisores',                    impacto: 'Alto — elimina la ceguera que hizo invisible la crisis del grupo.',   responsable: 'Claudia Hernández' },
    { area: 'Adopción sobre tickets',                impacto: 'Alto — convierte fricción semanal en anclas de permanencia.',         responsable: 'SAC' },
    { area: 'Omnicanal del grupo',                   impacto: 'Medio-alto — defensa frente a Bambete, después de acotar y ampliar.', responsable: 'Comercial / SAC' },
  ],

  perfiles: [
    {
      nombre: 'Ricardo Straffon',
      rol:    'Decisor del grupo — NO mapeado en esta cuenta',
      color:  '#ef4444',
      campos: [
        { label: 'Hecho',     value: 'Decidió la cancelación de las 2 cuentas hermanas (RDS) el 28 Ago sin existir en el mapa de decisores de Sofia.' },
        { label: 'Pendiente', value: 'Incorporarlo al mapa esta semana: cualquier decisión futura del grupo pasa por él.' },
      ],
    },
    {
      nombre: 'Claudia Hernández',
      rol:    'Asesora de la cuenta — Callpicker',
      color:  '#22c55e',
      campos: [
        { label: 'Al día',     value: 'Atendió la crisis del grupo el mismo día (contraofertas + ticket de alcance + registro KAM íntegro).' },
        { label: 'Pendientes', value: 'Actividad SAC "Completar Perfil" (desde el lunes) · confirmación escrita del alcance · propuesta de ampliación de bolsa.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'El mejor perfil de consumo de su segmento: ~91% promedio, 2 sobreconsumos pagados, uso saliente intensivo.',
      'Pagos impecables 7/7 meses y KAM activo esta semana.',
      'Solo 1 falla real en 20 tickets: la cuenta pregunta, no se queja.',
      'Evidencia de upsell irrefutable: los cortes hablan solos.',
    ],
    oportunidades: [
      'Ampliación de bolsa antes del tercer excedente — la propuesta más fácil de la cartera.',
      'Adopción sobre demanda real: 16 tickets de asistencia son apetito de capacitación.',
      'Anclar la cuenta con módulos (0/6 hoy) mientras el grupo evalúa su migración.',
      'Blindaje del grupo: acotar la baja y mapear decisores convierte la crisis en control.',
    ],
    debilidades: [
      'Perfil 1/8, decisores 0, observaciones vacías, Radar 0/12 — a ciegas sobre $11,744.',
      '0/6 módulos: la bolsa de voz es lo único que nos une.',
      'La actividad SAC que corregiría todo lleva una semana pendiente — en plena crisis del grupo.',
      'Dos sobreconsumos sin propuesta: el upsell más obvio de la cartera sigue sin presentarse.',
    ],
    amenazas: [
      'El ticket de alcance abierto puede extender la baja de RDS a toda la razón social.',
      'Bambete opera en el grupo con caso de éxito propio; la migración a clic-a-WhatsApp es estrategia declarada.',
      'El tercer sobreconsumo sin propuesta previa se vive como cobro sorpresa y abre la conversación equivocada.',
      'Costo de salida bajo: sin módulos, migrar es solo portar números.',
    ],
  },

  conclusion:
    'Sofia es la prueba de que facturar mucho no es conocer al cliente: la cuenta con el mejor consumo de su segmento y pagos perfectos estuvo a una pregunta sin responder de convertirse en el churn más grande del trimestre, porque en 7 meses nadie capturó su perfil, sus decisores ni un solo módulo. ' +
    'La buena noticia es que todo lo que falta está a una semana de distancia: el ticket de alcance se cierra con un correo, el perfil con la actividad SAC ya asignada, y la ampliación de bolsa con los 7 cortes que la cuenta misma escribió. Ejecutado eso, Sofia pasa de "superviviente por inercia" a la cuenta de expansión mejor documentada de la cartera.',

  pierde: [
    'Hasta $11,744/mes si el alcance de la baja no se acota por escrito.',
    'El excedente del próximo corte como upsell conversado, si la propuesta no llega antes.',
    'La relación de grupo, si la siguiente decisión vuelve a tomarse sin que tengamos a quién llamar.',
  ],

  gana: [
    'MRR incremental inmediato por ampliación de bolsa sobre consumo demostrado.',
    'Un grupo blindado: baja acotada, decisores mapeados, perfil completo.',
    'Anclas reales (módulos + capacitación) en la cuenta que hoy solo nos compra minutos.',
  ],

  recomendacion_central:
    'Tres movimientos en orden estricto esta semana: (1) confirmación escrita de que la cancelación cubre únicamente las 2 cuentas RDS — nada se propone antes de acotar la exposición; (2) actividad SAC completada: perfil 8/8, Radar 12/12 y Ricardo Straffon en el mapa; (3) propuesta de ampliación de bolsa presentada con los 7 cortes como evidencia, antes del corte de septiembre. ' +
    'La contraoferta omnicanal frente a Bambete viene después, con la baja acotada — y se presenta AL DUEÑO, no a un operativo: es la misma persona que canceló RDS, y la conversación de retención de Sofia y la de recuperación de RDS son una sola conversación.',
}
