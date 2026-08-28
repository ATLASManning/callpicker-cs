import type { AuditoriaCase } from './types'

/**
 * POST-MORTEM de churn. Caso generado por auditoría interna (28 Ago 2026).
 * Fuentes: oportunidad Zoho CRM "CP 189168 - Invest Vacay Group" (José
 * Galván, con notas de perfilamiento y cierre), fila LTV de RDS ELITE CONDOS
 * PDC (1 factura · LTV 5-Mínimo · semáforo 2-Riesgo · 0 meses activo),
 * registros KAM del 28 Ago de la llamada de cancelación (Ricardo Straffon
 * con Claudia Hernández y José Manuel López) y ticket de cancelación en
 * Zoho Desk.
 *
 * Nota de precisión: el resumen de la llamada es una síntesis de reunión, no
 * transcripción verbatim; las tasas de respuesta (20-30% → 6-10%) son cifras
 * DICHAS POR EL CLIENTE sobre sus campañas, no mediciones nuestras.
 *
 * Caso hermano: 'sofia' (F66) — la cuenta viva del mismo grupo.
 */
export const RDS_INVEST_VACAY: AuditoriaCase = {
  id:                    'rds-invest-vacay',
  asesor:                'Claudia',
  nombre:                'RDS / Invest Vacay Group',
  sector:                'Inmobiliario turístico — propiedades fraccionales y clubes vacacionales (Quintana Roo)',
  fecha_periodo:         '10 Julio – 28 Agosto 2026 (venta) · 6 meses la cuenta original',
  fecha_auditoria:       'Ago 2026',
  tipo_cliente:          'CHURN CONSUMADO · 2 cuentas a nombre de RDS ELITE CONDOS PDC SA DE CV · competidor operando',
  descripcion_contexto:  'Oportunidad CP 189168 · Sin consecutivo propio (grupo Sofia F66) · Post-mortem de venta y cancelación',
  estado:                'perdido',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Vida de la venta de julio',    value: '39 días',         color: '#ef4444' },
    { label: 'Facturas emitidas',            value: '1 ($2,387)',      color: '#ef4444' },
    { label: 'Respuesta de pautas (cliente)',value: '20-30% → 6-10%',  color: '#f59e0b' },
    { label: 'Clasificación LTV',            value: '5 - Mínimo',      color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'El 28 de agosto Ricardo Straffon canceló las DOS cuentas a nombre de RDS ELITE CONDOS PDC SA DE CV: la original con 6 meses de uso (dos líneas + siete líneas/tres usuarios) y la vendida el 20 de julio como "CP 189168 - Invest Vacay Group", que vivió exactamente 39 días y facturó una sola vez: $2,387, LTV clasificado Mínimo, 0 meses activo, semáforo en Riesgo.\n\n' +
    'El motivo declarado no fue el producto — "el servicio general de Callpicker fue muy bueno" — sino el colapso del modelo del cliente: sus pautas publicitarias orientadas a llamadas dejaron de ser rentables cuando la tasa de respuesta cayó (según sus propias cifras) de 20-30% a 6-10%. Sus campañas migran a clic-a-WhatsApp y ya contrataron a un competidor, Bambete, que administra llamadas, IA, mensajes y redes sociales — y que ya estaba operando cuando Claudia ofreció ajuste de plan y Callpicker Chat en la misma llamada de cancelación.\n\n' +
    'Este post-mortem documenta las dos lecciones que la venta dejó: se cerró en 10 días con promo de descuento y sin una sola indagatoria de Chat o Asistente Virtual — pese a que el cliente pedía integración con su CRM y su necesidad terminó siendo exactamente omnicanal — y se perdió sin alerta previa, porque el decisor real nunca estuvo mapeado.',

  resultado_positivo:
    'El cliente validó el producto en su despedida: "el servicio general de Callpicker fue muy bueno a pesar de la problemática con las llamadas". La objeción fue de modelo de campaña, no de plataforma — eso deja a Ricardo Straffon como recontactable con una solución de contactabilidad u omnicanal. ' +
    'La atención de la cancelación fue correcta: Claudia ofreció las dos contraofertas disponibles (ajuste de plan y Chat), abrió el ticket de alcance el mismo día y documentó el incidente completo en KAM. ' +
    'Y la cuenta madre del grupo (Sofia, F66) sobrevivió a esta ronda con el mejor consumo de su segmento — el caso hermano documenta cómo blindarla.',

  hallazgos: [
    'Venta de 39 días: lead el 10 Jul (SEO/landing), demo el 14, contrato firmado el 20, única factura el 21, cancelación el 28 Ago. El funnel completo funcionó en velocidad — y en nada más.',
    'Cero indagatoria omnicanal en toda la oportunidad: el flujo de Zoho CRM (perfilamiento → calificación → demo → cierre) no registra una sola exploración de Callpicker Chat ni Asistente Virtual. El cliente pedía "integración con Zoho para llamadas" y terminó comprándole a un competidor precisamente llamadas + IA + mensajes + redes.',
    'La promo como acelerador, no como ancla: se ofreció 2º mes al 50% "si se contrata antes del 15 de julio". El cliente firmó el 20 y canceló 39 días después — el descuento compró velocidad de cierre, no permanencia.',
    'La decisión nunca estuvo en la mesa: el perfilamiento registró que la autoridad era "Dirección" y el contacto operativo era Julio Pech (sistemas, jefe de departamento). Quien canceló fue Ricardo Straffon — un nombre que no aparece en toda la oportunidad.',
    'Sin uso auditado antes del churn: LTV Mínimo, 0 meses activo, semáforo en Riesgo desde el tablero — la cuenta nueva nunca llegó a operar de forma medible antes de morir.',
    'Causa declarada por el cliente (no medida por nosotros): tasa de respuesta de sus pautas telefónicas de 20-30% a 6-10%. El formato de campaña por llamada "dejó de ser económicamente viable" — problema del canal telefónico como medio publicitario, no del servicio.',
    'Competidor con ventaja de tiempo: Bambete ya estaba contratado Y operando cuando hicimos la primera contraoferta. La retención en la llamada de cancelación es teatro si la siembra no ocurrió antes.',
    'Pendiente contractual activo: el ticket de cancelación aún debe confirmar si la baja aplica a toda la razón social o solo a RDS ELITE CONDOS PDC — el riesgo de arrastre se audita en el caso Sofia.',
  ],

  cronologia: [
    { fecha: '~Feb 2026',      responsable: 'Grupo RDS',                  evento: 'Opera la cuenta original de RDS (dos líneas; luego siete líneas/tres usuarios) dentro del grupo Sofia. 6 meses de uso al momento de la baja.', tipo: 'neutral' },
    { fecha: '10 Jul 2026',    responsable: 'Perfilamiento CP',            evento: 'Lead Invest Vacay por SEO/landing: inmobiliaria turística, 3 extensiones, integración de llamadas con Zoho CRM, implementación urgente (1-3 semanas). Nota del funnel: "Es una cuenta activa Callpicker". Dos intentos de contacto el mismo día; se pide apoyo por WhatsApp.', tipo: 'neutral' },
    { fecha: '10 Jul 2026',    responsable: 'José Galván',                 evento: 'Interés confirmado en VyC Ilimitado para 3 usuarios + 3 DIDs. Se ofrece promo: 2º mes al 50% si contrata antes del 15 de julio.', tipo: 'problema' },
    { fecha: '14 Jul 2026',    responsable: 'José Galván',                 evento: 'Demo activada; el prospecto evalúa la integración con Zoho. Prioridad P1-Alta en el CRM. En ningún punto se indaga Chat/AV.', tipo: 'problema' },
    { fecha: '20 Jul 2026',    responsable: 'Ventas',                      evento: 'Contrato firmado — Cierre logrado, $2,387, probabilidad 100%. Facturación a nombre de RDS ELITE CONDOS PDC SA DE CV (cotejo de cierre: Joaquín Martínez, 28 Jul).', tipo: 'neutral' },
    { fecha: '21 Jul 2026',    responsable: 'Facturación',                 evento: 'ÚNICA factura emitida de la cuenta nueva. En el tablero LTV queda: $2,387 acumulado · 5-Mínimo · semáforo 2-Riesgo · 0 meses activo.', tipo: 'problema' },
    { fecha: '28 Ago 2026',    responsable: 'Ricardo Straffon',            evento: 'Cancelación de AMBAS cuentas RDS en llamada con Claudia y José Manuel: respuesta de pautas desplomada (20-30% → 6-10%, cifras del cliente), migración a clic-a-WhatsApp, Bambete contratado y operando. Rechaza ajuste de plan y Callpicker Chat. "El servicio de Callpicker fue muy bueno".', tipo: 'problema' },
    { fecha: '28 Ago 2026',    responsable: 'Claudia Hernández',           evento: 'Ticket de cancelación abierto; compromiso de notificación formal por escrito. Pendiente: confirmar alcance (¿toda la razón social o solo RDS?) — seguimiento en el caso Sofia.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social de facturación', value: 'RDS ELITE CONDOS PDC SA DE CV' },
    { label: 'Nombre comercial',            value: 'Invest Vacay Group (IVG)' },
    { label: 'Oportunidad Zoho CRM',        value: 'CP 189168 · propietario José Galván · fase final "Contrato Firmado - Cierre Logrado"' },
    { label: 'Pertenencia',                 value: 'Grupo Sofia (F66, CID 178011) — sin consecutivo propio en cartera' },
    { label: 'Propiedad',                   value: 'MISMO DUEÑO que Sofia: el decisor de esta cancelación controla también la cuenta viva del grupo' },
    { label: 'Giro',                        value: 'Inmobiliario turístico: propiedades fraccionales y clubes vacacionales, Quintana Roo · 11-50 empleados' },
    { label: 'Origen del lead',             value: 'SEO (google.com) · landing · 10 Jul 2026' },
    { label: 'Necesidad declarada',         value: 'Integración de llamadas con Zoho CRM · historial de ventas salientes · 3 extensiones VyC + 3 DIDs nuevos' },
    { label: 'Oferta vendida',              value: '3 Extensiones Visibilidad y Control IL · $2,387 · promo 2º mes al 50%' },
    { label: 'Resultado LTV',               value: '1 factura ($2,387) · LTV 5-Mínimo · semáforo 2-Riesgo · 0 meses activo · última factura 21 Jul 2026' },
    { label: 'Cuentas canceladas',          value: '2 — la original (6 meses: dos líneas + siete líneas/tres usuarios) y la nueva (39 días)' },
    { label: 'Contacto operativo',          value: 'Julio Pech — Sistemas (jefe de departamento) · sistemas@investvacaygroup.com · 9831804118' },
    { label: 'Decisor real (no mapeado)',   value: 'Ricardo Straffon — decidió la cancelación de ambas cuentas' },
    { label: 'Competidor',                  value: 'Bambete — llamadas + IA + mensajes + redes sociales · contratado y operando antes de nuestra contraoferta' },
    { label: 'Atendió la cancelación',      value: 'Claudia Hernández + José Manuel López · 28 Ago 2026' },
  ],

  necesidad_negocio:
    'IVG/RDS compraba llamadas como insumo publicitario: sus pautas generaban leads que se convertían por teléfono, y Callpicker era la infraestructura de ese último tramo. Cuando el canal telefónico como medio publicitario se degradó (la gente contesta cada vez menos, en palabras del cliente), su necesidad real mutó de "más llamadas" a "conversación multicanal": clic-a-WhatsApp, mensajería, IA de atención. ' +
    'Esa necesidad mutada estaba visible desde el perfilamiento — pedían integración con su CRM y trazabilidad de contacto — pero la venta la leyó como una venta de extensiones. El competidor la leyó completa.',

  potencial_corto: [
    'Cerrar dignamente: notificación formal de baja de las 2 cuentas (compromiso de Claudia) y confirmación del alcance acotado — el arrastre se gestiona en el caso Sofia.',
    'Registrar el post-mortem en el proceso comercial: esta oportunidad es el ejemplo de manual de cierre veloz sin anclas.',
  ],

  potencial_largo: [
    'El recontacto NO es frío: el dueño de RDS es el mismo dueño de Sofia (F66), que sigue siendo cliente activo con consumo del 90%+. Cada interacción de cartera con Sofia es también la relación con este decisor — la recuperación de RDS y la retención de Sofia son la misma conversación.',
    'Recontacto formal a Ricardo Straffon en 90-120 días con solución de contactabilidad/omnicanal madura: su objeción fue de modelo, validó el servicio, y Bambete tendrá que demostrar en producción lo que prometió en venta.',
    'La regla comercial que este caso obliga: toda oportunidad de contactación indaga Chat/AV antes del cierre, y las promos de descuento se sustituyen por promos de adopción (el 2º mes al 50% compró un cierre de 39 días).',
  ],

  tacticas: [
    { nombre: 'Cierre formal y alcance acotado',        descripcion: 'Candidatura MUY ALTA (higiene). Notificación escrita de baja de las 2 cuentas y confirmación de que NO cubre la razón social completa.', impacto: 'Cierra el expediente sin dejar la puerta del contagio abierta.' },
    { nombre: 'Post-mortem al proceso de ventas',       descripcion: 'Candidatura MUY ALTA. Llevar este caso a la mesa comercial: 10 días de funnel, promo de descuento, cero omnicanal, decisor nunca mapeado, vida de 39 días.', impacto: 'La lección de $2,387 protege cierres futuros.' },
    { nombre: 'Recontacto programado a Straffon',       descripcion: 'Candidatura MEDIA-ALTA. En 90-120 días, con caso de contactabilidad (reputación de números) u omnicanal propio — cuando Bambete ya tenga que estar demostrando.', impacto: 'Convierte un churn limpio en pipeline de recuperación.' },
    { nombre: 'Alerta de venta a grupos existentes',    descripcion: 'Candidatura MEDIA. La nota del funnel decía "Es una cuenta activa Callpicker": una venta nueva dentro de un grupo existente debería activar al asesor de cartera desde el día 1, no enterarse en la cancelación.', impacto: 'Ventas y SAC dejan de operar en paralelo sobre el mismo cliente.' },
  ],

  senal_alarma:
    'LECCIÓN CENTRAL DEL POST-MORTEM: la velocidad de cierre no es salud de venta. Esta oportunidad tuvo todo lo que un dashboard comercial premia — lead calificado en horas, demo en 4 días, cierre en 10, prioridad P1, probabilidad 100% — y murió en 39 días porque nada de eso construyó permanencia: sin omnicanal indagado, sin decisor real en la mesa, con descuento como único argumento. ' +
    'PRECAUCIÓN DOCUMENTAL: las tasas de respuesta (20-30% → 6-10%) son cifras declaradas por el cliente sobre sus campañas, no mediciones nuestras; el resumen de la llamada es síntesis, no transcripción. Usarlas como contexto, no como dato auditado.',

  problema_raiz:
    'Venta leída como transacción de extensiones cuando el cliente compraba un modelo de contactación: el funnel optimizó velocidad de cierre (promo, 10 días) y omitió las dos preguntas que definían el caso — ¿qué canal necesita mañana? y ¿quién decide de verdad?',

  problema_raiz_detalle:
    'El expediente comercial es impecable en forma y hueco en fondo. En forma: perfilamiento completo, calificación BANT, demo activada, notas al día, cotejo de cierre. En fondo: (1) la necesidad declarada — integración con CRM, trazabilidad de llamadas de venta — era la descripción de un cliente evaluando su MODELO de contactación, y nadie preguntó por los canales no-voz que ese modelo ya estaba considerando; (2) la autoridad registrada era "Dirección" y aun así toda la relación se construyó con el contacto de sistemas — el decisor que ejecutó la cancelación jamás apareció en la oportunidad; (3) el único incentivo ofrecido fue precio con fecha límite, que aceleró la firma y no ancló nada. ' +
    'Cuando el modelo del cliente hizo crisis (respuesta telefónica desplomada), no había ni relación con el decisor ni módulos sembrados ni conversación omnicanal previa — solo una factura de $2,387 y un competidor que sí había tenido esa conversación.',

  flujo_real: [
    { fase: '1. Lead (10 Jul)',        area: 'Perfilamiento',      accion: 'Lead SEO calificado el mismo día; urgencia de 2 semanas detectada.',                        resultado: 'Velocidad correcta; necesidad leída superficialmente ("3 extensiones").' },
    { fase: '2. Oferta (10-14 Jul)',   area: 'José Galván',        accion: 'VyC Ilimitado + 3 DIDs; promo 2º mes 50% con fecha límite; demo activada.',                  resultado: 'Cierre acelerado por precio; cero indagatoria Chat/AV.' },
    { fase: '3. Cierre (20-21 Jul)',   area: 'Ventas/Facturación', accion: 'Contrato firmado; factura única a RDS ELITE CONDOS PDC.',                                     resultado: 'Cuenta nace sin anclas: sin módulos, sin decisor, sin plan de adopción.' },
    { fase: '4. Silencio (ago)',       area: 'Nadie',              accion: 'Sin onboarding registrado, sin uso auditado, sin contacto de cartera pese a ser grupo existente.', resultado: 'LTV Mínimo · 0 meses activo · semáforo Riesgo.' },
    { fase: '5. Churn (28 Ago)',       area: 'Ricardo Straffon',   accion: 'Cancela ambas cuentas: modelo migra a clic-a-WhatsApp; Bambete operando.',                    resultado: 'Contraofertas llegan dentro de la llamada de cancelación. Baja aceptada.' },
  ],

  comparativo: [
    { metrica: 'Ciclo de vida de la venta',    real: '39 días (20 Jul → 28 Ago)',                          ideal: 'Cliente anclado con adopción medible el primer trimestre' },
    { metrica: 'Indagatoria omnicanal',        real: 'Cero menciones de Chat/AV en toda la oportunidad',   ideal: 'Obligatoria antes del cierre en cualquier venta de contactación' },
    { metrica: 'Incentivo de cierre',          real: 'Descuento con fecha límite (2º mes al 50%)',         ideal: 'Promo de adopción (mes de Chat/módulo incluido)' },
    { metrica: 'Decisor en la relación',       real: 'Contacto de sistemas; "Dirección" nunca en la mesa', ideal: 'Decisor real identificado y tocado antes de firmar' },
    { metrica: 'Coordinación Ventas-Cartera',  real: 'Nota "cuenta activa Callpicker" sin activar al asesor del grupo', ideal: 'Venta a grupo existente notifica a SAC desde el día 1' },
    { metrica: 'Detección del churn',          real: 'En la llamada de cancelación, con competidor operando', ideal: 'Señal previa por decisor mapeado y uso auditado' },
  ],

  plan_inmediato: [
    { accion: 'Enviar la notificación formal de baja de las 2 cuentas RDS (compromiso adquirido en la llamada).',      responsable: 'Claudia Hernández',    criterio: 'Notificación enviada; expediente cerrado en Zoho Desk.' },
    { accion: 'Confirmar por escrito el alcance acotado (solo RDS, no la razón social) — ejecución en el caso Sofia.', responsable: 'Claudia Hernández',    criterio: 'Confirmación documentada.' },
  ],

  plan_mediano: [
    { accion: 'Presentar este post-mortem en la mesa comercial con las dos reglas propuestas (indagatoria omnicanal + promos de adopción).', responsable: 'Dirección SAC → Dirección Comercial', criterio: 'Caso presentado; reglas aceptadas o rechazadas con registro.' },
    { accion: 'Programar el recontacto a Ricardo Straffon (90-120 días) con solución de contactabilidad/omnicanal.',                          responsable: 'Claudia / Comercial',                  criterio: 'Recordatorio con dueño y fecha en CRM.' },
  ],

  plan_estrategico: [
    { accion: 'Regla comercial permanente: toda oportunidad de contactación explora Chat/AV antes del cierre.',                    responsable: 'Dirección Comercial', criterio: 'Regla operando y auditable en Zoho CRM.' },
    { accion: 'Protocolo de venta a grupos existentes: la nota "cuenta activa Callpicker" dispara aviso automático al asesor de cartera.', responsable: 'Dirección SAC',      criterio: 'Protocolo activo; el asesor se entera al abrir la oportunidad, no al cancelar.' },
  ],

  areas_oportunidad: [
    { area: 'Reglas de cierre (omnicanal + adopción)',      impacto: 'Muy alto — evita fabricar el próximo churn de 39 días.',                       responsable: 'Dirección Comercial' },
    { area: 'Protocolo ventas ↔ cartera en grupos',         impacto: 'Alto — SAC deja de enterarse de sus propios clientes por la cancelación.',      responsable: 'Dirección SAC' },
    { area: 'Recontacto Straffon con omnicanal propio',     impacto: 'Medio-alto — churn validado como recuperable por el propio cliente.',           responsable: 'Claudia / Comercial' },
    { area: 'Servicio de contactabilidad (reputación)',     impacto: 'Medio — la causa raíz (respuesta telefónica desplomada) afecta a más clientes de pauta.', responsable: 'Producto / Dirección' },
  ],

  perfiles: [
    {
      nombre: 'Ricardo Straffon',
      rol:    'Decisor de la cancelación — nunca mapeado en la oportunidad',
      color:  '#ef4444',
      campos: [
        { label: 'Hecho',        value: 'Canceló ambas cuentas el 28 Ago con argumento de modelo: respuesta de pautas 20-30% → 6-10% (sus cifras), migración a clic-a-WhatsApp, Bambete operando.' },
        { label: 'Señal',        value: '"El servicio general de Callpicker fue muy bueno" — objeción de canal publicitario, no de plataforma.' },
        { label: 'Siguiente paso', value: 'Recontacto programado en 90-120 días con solución de contactabilidad/omnicanal.' },
      ],
    },
    {
      nombre: 'Julio Pech',
      rol:    'Sistemas IVG — el único contacto de toda la relación',
      color:  '#94a3b8',
      campos: [
        { label: 'Contacto', value: 'sistemas@investvacaygroup.com · 9831804118 · jefe de departamento' },
        { label: 'Lección',  value: 'El perfilamiento registró que la autoridad era "Dirección"; la relación nunca subió de sistemas. El churn lo decidió alguien a quien no conocíamos.' },
      ],
    },
    {
      nombre: 'José Galván',
      rol:    'Propietario de la oportunidad — Ventas',
      color:  '#f59e0b',
      campos: [
        { label: 'Ejecución', value: 'Funnel veloz e impecable en forma: calificación, demo, notas, cierre en 10 días con promo de fecha límite.' },
        { label: 'Hueco',     value: 'Cero indagatoria de Chat/AV y decisor real fuera de la mesa — los dos factores que definieron el churn.' },
      ],
    },
    {
      nombre: 'Claudia Hernández',
      rol:    'Atendió la cancelación — Cartera',
      color:  '#22c55e',
      campos: [
        { label: 'Gestión', value: 'Ofreció ajuste de plan y Callpicker Chat en la llamada; abrió el ticket de alcance y documentó el incidente íntegro el mismo día.' },
        { label: 'Límite',  value: 'La retención en la llamada de cancelación no puede ganar contra un competidor que ya opera — la siembra debía ocurrir en la venta.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Producto validado por el cliente en su propia despedida ("muy bueno").',
      'Atención de cancelación profesional: contraofertas, ticket y registro el mismo día.',
      'Expediente comercial completo — el post-mortem se puede auditar paso a paso.',
    ],
    oportunidades: [
      'Recontacto a Straffon cuando Bambete tenga que demostrar en producción.',
      'Convertir el caso en las dos reglas comerciales que faltan (omnicanal + adopción).',
      'Protocolo ventas↔cartera para grupos existentes — este caso lo justifica solo.',
      'La causa raíz (contactación telefónica degradada) es oportunidad de un servicio de reputación de números.',
    ],
    debilidades: [
      'Venta sin anclas: sin módulos, sin onboarding registrado, sin decisor, con descuento como único argumento.',
      'Cero coordinación con cartera pese a la nota "es una cuenta activa Callpicker".',
      'La cuenta nueva nunca tuvo uso auditado: LTV Mínimo y 0 meses activo desde el tablero.',
    ],
    amenazas: [
      'Bambete queda con caso de éxito dentro del grupo y del sector inmobiliario turístico.',
      'La migración de pauta telefónica a clic-a-WhatsApp es tendencia de mercado: más clientes de este perfil harán la misma crisis.',
      'El alcance de la baja sigue sin confirmar por escrito (riesgo gestionado en el caso Sofia).',
    ],
  },

  conclusion:
    'RDS/Invest Vacay es el post-mortem de una venta que hizo todo rápido y nada profundo: 10 días del lead a la firma, 39 días de la firma a la cancelación, una factura de $2,387 y un competidor operando antes de nuestra primera contraoferta. No perdimos contra Bambete en producto — el cliente validó el nuestro — perdimos en lectura: él compraba la evolución de su modelo de contactación y nosotros le vendimos extensiones con descuento. ' +
    'El valor del caso está en sus dos reglas: ninguna venta de contactación cierra sin indagatoria omnicanal, y ninguna venta a un grupo existente ocurre sin su asesor de cartera enterado. La recuperación queda programada: Straffon validó el servicio y Bambete aún tiene todo por demostrar.',

  pierde: [
    'Las 2 cuentas RDS: la original de 6 meses y la venta de julio ($2,387 · 1 factura).',
    'El costo comercial completo del funnel de julio (perfilamiento, demo, cierre) con retorno de una factura.',
    'La primera posición frente a Bambete en un grupo y un sector donde ya opera con caso propio.',
  ],

  gana: [
    'Dos reglas comerciales pagadas con $2,387 que protegen todos los cierres futuros.',
    'Un recontacto programado con un decisor que validó el servicio.',
    'El mapa completo del incidente para blindar la cuenta viva del grupo (caso Sofia).',
  ],

  recomendacion_central:
    'Cerrar el expediente con higiene (notificación formal + alcance acotado por escrito) y cobrar la lección donde vale: llevar este post-mortem a la mesa comercial y dejar instaladas las dos reglas — indagatoria omnicanal obligatoria en ventas de contactación, y aviso automático al asesor de cartera cuando la oportunidad diga "cuenta activa Callpicker". ' +
    'Programar el recontacto a Ricardo Straffon en 90-120 días con la solución de contactabilidad/omnicanal — recordando que no es una puerta cerrada ni fría: el mismo dueño sigue siendo cliente activo a través de Sofia (F66), y el trato que reciba esa cuenta ES la campaña de recuperación de esta.',
}
