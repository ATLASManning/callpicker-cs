import type { AuditoriaCase } from './types'

export const SALUD_Y_HOGAR: AuditoriaCase = {
  id: 'salud-y-hogar',
  asesor: 'Dan',
  nombre: 'Salud y Hogar',
  sector: 'Salud – Equipos Médicos / Franquicias Nacionales',
  fecha_periodo: 'Enero – Junio 2026',
  fecha_auditoria: 'Jun 2026',
  tipo_cliente: 'Enterprise – 9 años de relación comercial',
  descripcion_contexto: 'CID 946 · Auditoría Forense Integral · $32,026 MXN/mes · Soft Suspend: 15 Jun',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Factura mensual (IVA)',    value: '$32,026',   color: '#6366f1' },
    { label: 'DIDs dados de baja',       value: '72 → 46',   color: '#ef4444' },
    { label: 'AV Voicebot (uso real)',   value: '$0 / $3k',  color: '#ef4444' },
    { label: 'Soft Suspend',             value: '15 Jun',    color: '#f59e0b' },
  ],

  resumen_ejecutivo: 'La presente auditoría cubre la cuenta Salud y Hogar (CID 946), cliente activo de Callpicker desde julio de 2018 con más de 9 años de relación comercial. El análisis integra datos de facturación, tickets de soporte, reportes de 22,314 llamadas, documentación interna del cliente, transcripción de reunión del 29 de abril de 2026 y aplicación de la política oficial de contabilización de minutos.\n\nLa cuenta presenta señales que, analizadas en conjunto, configuran un escenario de riesgo alto de churn parcial o total si Callpicker no actúa antes del 12 de junio de 2026.\n\nCRÍTICO: Soft Suspend 15 Jun → Hard Suspend 20 Jun → Aviso de Cancelación 25 Jun. La ventana de intervención efectiva cierra en menos de 10 días hábiles desde la fecha de auditoría.',

  resultado_positivo: 'Salud y Hogar no es un cliente en churn pasivo. Es un cliente técnicamente maduro que documentó 8 fallas del AV en 7 páginas, tiene disposición declarada de inversión ("no tenemos inconveniente en asumir los costos si el agente virtual funciona") y usa WhatsApp API con 12,593 mensajes/mes. El uso real bajo política oficial es del 75.5% mensual — el plan está bien calibrado. La cuenta es recuperable y expandible hasta $50,000–$55,000/mes si Callpicker responde con velocidad, ownership claro y una propuesta técnica que atienda punto a punto las 8 fallas documentadas.',

  hallazgos: [
    'CRÍTICO — Voicebot cobrado ($3,000/mes) con $0 de uso: el AV de voz fue descontinuado por el cliente antes del 29 de abril. Se han cobrado 5+ semanas sin uso. Callpicker debe definir posición interna (crédito o justificación) antes de la llamada con el cliente.',
    'CRÍTICO — 26 DIDs con tráfico activo dados de baja sin análisis previo: los 36 DIDs rastreables suman 15,665 llamadas en 5 meses. El número de Oxígeno GDL solo tenía 1,547 llamadas con 85.6% de atención. La justificación "cierre de campaña" no es consistente con DIDs de Enfermería, Oxígeno y Camas.',
    'CRÍTICO — Sesión de asesoría técnica sin fecha: el cliente entregó un reporte de 7 páginas el 6 de mayo. Al 4 de junio llevan 29 días sin respuesta concreta. La fragmentación interna (4 actores: Dan D., Monse, David, Daniel M.) es la causa directa.',
    'ALTO — Dato de minutos incorrecto en panel: el panel reporta 1,048 min (10.5%). Aplicando la política oficial, solo enero genera 8,500 min (85.0%). El promedio real es 7,552 min/mes (75.5%). Este dato debe resolverse internamente antes de cualquier comunicación con el cliente.',
    'ALTO — 12 agentes CP Chat facturados ($4,200/mes) sin evidencia de uso documentada: la ficha UX registra "Callpicker Chat: NO". Si el cliente detecta esto antes que Callpicker, el impacto en la confianza es irreversible.',
    'ALTO — 2 números de WhatsApp atrapados en API externa: 523314545205 y 523315798431. Requieren liberación por parte del cliente. Callpicker debe comunicarlo activamente y guiar el proceso.',
    'ALTO — Luis Carlos Hernández Espinosa (técnico real del AV) no está registrado en el CRM de Callpicker. Sin él, ninguna sesión técnica avanza. Es el riesgo de dependencia más alto del caso.',
    'MEDIO — Contracción de -21% en volumen de llamadas desde enero (4,560 → 3,628 en mayo). Señal temprana de reconversión operativa que Callpicker no detectó.',
  ],

  cronologia: [
    { fecha: 'Ene 2017',    responsable: 'Ventas Callpicker',               evento: 'Primera oportunidad Zoho — Upsale Salud y Hogar. Fuente: Ad Google.', tipo: 'neutral' },
    { fecha: 'Jul 2018',    responsable: 'Callpicker',                      evento: 'Cuenta activa. Inicio de relación de 9 años de permanencia.', tipo: 'ok' },
    { fecha: '29 Abr 2026', responsable: 'Dan D. + Daniel M. (CP) / Cristian + Luis Carlos (cliente)', evento: 'Reunión técnica AV. Se confirma: AV de voz ya descontinuado. Luis Carlos identificado como técnico operativo real. 4 compromisos adquiridos.', tipo: 'pivote' },
    { fecha: '6 May 2026',  responsable: 'Luis Carlos Hernández (cliente)',  evento: 'Ticket AV #106587 + reporte de 7 páginas. Cliente documentó 8 fallas. Callpicker tardó 21 días en entregar el prompt a desarrollo.', tipo: 'problema' },
    { fecha: '19 May 2026', responsable: 'Callpicker interno',               evento: 'Definición: asesoría a $2,500/hr. 13 días de espera para definir ruta que además agrega costo al cliente.', tipo: 'problema' },
    { fecha: '27 May 2026', responsable: 'Callpicker — Ingeniería',          evento: 'Prompt entregado a desarrollo — 21 días después del reporte. Eduardo pendiente de revisar.', tipo: 'problema' },
    { fecha: '1 Jun 2026',  responsable: 'Cliente / Daniel M. (CP)',         evento: 'Solicitud de baja de 45 DIDs — Ticket #107714. Daniel M. advierte tráfico activo. Recomendación correcta, ejecutada tarde.', tipo: 'problema' },
    { fecha: '2 Jun 2026',  responsable: 'Callpicker Operaciones',           evento: 'Baja de 26 DIDs confirmada (72 → 46). 2 números WA atrapados en API. Sin análisis de impacto presentado al cliente.', tipo: 'problema' },
    { fecha: '4 Jun 2026',  responsable: 'VP Investigación de Business SAC', evento: 'Auditoría forense integral iniciada. Sin sesión agendada con el cliente. AV sin optimizar. Soft Suspend en 11 días.', tipo: 'neutral' },
    { fecha: '5 Jun 2026',  responsable: 'Stripe',                           evento: 'Fecha de corte de factura: $32,026 MXN con IVA.', tipo: 'neutral' },
    { fecha: '15 Jun 2026', responsable: 'Sistema Callpicker',               evento: 'SOFT SUSPEND programado. Ventana de intervención efectiva: antes de esta fecha.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'CID / RFC',             value: 'CID 946 | SALUD Y HOGAR | SHO070129R64' },
    { label: 'Actividad',             value: 'Consultas médicas, equipo médico (Oxígeno, Camas, Enfermería, Sillas de ruedas)' },
    { label: 'Marca asociada',        value: 'SOMNOX (bienestar/sueño) — operación multi-plaza e internacional' },
    { label: 'Sedes confirmadas',     value: '7 confirmadas + posible 8ª plaza (CUN histórico)' },
    { label: 'Presencia geográfica',  value: 'GDL, CDMX, MTY, Puebla, Chihuahua, QRO, Mérida · Internacional: España (SOMNOX)' },
    { label: 'Factura actual',        value: '$32,026 MXN/mes (IVA incluido)' },
    { label: 'Plan activo',           value: 'Visibilidad y Control 10,000 min (ID 4388)' },
    { label: 'Pago',                  value: 'Stripe activo | VISA ...2919 | Titular: Luis Enrique Ramírez Hernández' },
    { label: 'Relación comercial',    value: '9 años (activo desde julio 2018)' },
  ],

  necesidad_negocio: 'Salud y Hogar opera una red médica multiproducto (oxígeno, camas, enfermería, sillas de ruedas) con 7 sedes nacionales y presencia internacional a través de SOMNOX. El canal telefónico es misión crítica: 19,664 llamadas entrantes en 5 meses con 80.6% de tasa de atención. Las llamadas perdidas fuera de horario (298 nocturnas) representan pacientes con necesidades médicas urgentes sin respuesta.\n\nEl cliente busca transformar su operación con un Agente Virtual que perfile al paciente desde el primer contacto, consulte stock en tiempo real, recomiende productos y facilite la venta sin intervención humana inicial. El 29 de abril declaró: "no tenemos inconveniente en asumir los costos si el agente virtual funciona." La condición es única: que funcione.',

  potencial_corto: ['Resolver los 2 números WA atrapados en API', 'Agendar y ejecutar sesión de asesoría técnica con Luis Carlos + Cristian antes del 15 Jun', 'Definir posición interna sobre voicebot ($3,000/mes sin uso) y resolver proactivamente'],
  potencial_largo: ['Proyecto de ingeniería AV completo: sincronización BD + CRM + agente comercial — $15,000–$25,000', 'Facturación proyectada Dic 2026: $50,000–$55,000/mes (+72% vs. hoy)', 'Reactivación de AV de voz 24/7 para llamadas nocturnas y dominicales', 'SOMNOX como cuenta separada con potencial propio'],

  tacticas: [
    { nombre: 'Reducción silenciosa', descripcion: 'Cancela 45 DIDs justificando "cierre de campaña" cuando incluyen Oxígeno, Enfermería y Camas — servicios médicos core, no marketing', impacto: 'Señal de reconversión operativa. Posible migración de SOMNOX a otra plataforma ya en curso.' },
    { nombre: 'Documentación rigurosa como presión', descripcion: 'Entregó reporte de 7 páginas con 8 fallas documentadas del AV el 6 de mayo. Cliente hizo el análisis — Callpicker debe responderlo punto a punto, no con respuestas genéricas', impacto: 'Alto nivel de madurez técnica. Si la respuesta es vaga, el cliente perderá confianza definitivamente.' },
    { nombre: 'Condicionante de inversión declarada', descripcion: '"No tenemos inconveniente en asumir los costos si el agente virtual funciona" — 29 de abril 2026', impacto: 'Disposición real de expandir el contrato. La oportunidad de $50,000+/mes está activa pero tiene fecha de vencimiento.' },
  ],
  senal_alarma: 'Cuando el cliente solicita más bajas de DIDs sin análisis previo es señal de reconversión operativa silenciosa. Cada DID cancelado sin datos = oportunidad perdida de retención. SOMNOX con 9 DIDs cancelados y tráfico real probablemente ya migró a otra plataforma.',

  problema_raiz: 'Ausencia de ownership unificado y respuesta reactiva tardía en cuenta Enterprise de alto valor',
  problema_raiz_detalle: 'La cuenta tiene 4 actores internos (Dan D., Monse, David Ing., Daniel M.) sin coordinación ni responsable único. El resultado es una cadena de retrasos: 21 días para entregar prompt, 13 días para definir tarifa de asesoría, 29 días sin sesión agendada después del reporte del cliente. El cliente se movió más rápido que Callpicker en cada punto: documentó 8 fallas antes de que Callpicker respondiera, solicitó bajas de DIDs sin esperar el análisis que nunca llegó, y lleva semanas sin señal de vida del área comercial.',

  flujo_real: [
    { fase: '1. Reunión 29 Abr',    area: 'Dan D. + Daniel M.',             accion: '4 compromisos adquiridos: consultar automatizaciones, enviar orden de pago, feedback de ingeniería, contactar a Cristian', resultado: 'NINGUNO cumplido al 4 de junio. Cristian y Luis Carlos siguen esperando.' },
    { fase: '2. Reporte 6 May',     area: 'Luis Carlos (cliente)',           accion: 'Entrega reporte de 7 páginas con 8 fallas del AV documentadas con detalle técnico', resultado: 'Callpicker tardó 21 días en entregar el prompt a desarrollo. Eduardo aún no lo revisó.' },
    { fase: '3. Tarifación tardía', area: 'Callpicker comercial',            accion: 'Después de 13 días define que la asesoría costará $2,500/hr', resultado: 'Agrega fricción de costo en lugar de agendar la sesión directamente.' },
    { fase: '4. Baja de DIDs',      area: 'Cliente / Operaciones CP',        accion: 'Cliente pide baja de 45 DIDs. Callpicker ejecuta 26 sin entregar el análisis de tráfico activo', resultado: 'Se dan de baja 15,665 llamadas en 5 meses. Daniel M. advirtió tarde. 2 números WA atrapados.' },
    { fase: '5. Silencio post-baja', area: 'Callpicker — todos los actores', accion: 'Sin seguimiento después del 2 de junio. Sin sesión agendada. Soft Suspend en 11 días.', resultado: 'Cliente sin respuesta percibida. La ventana de confianza se cierra.' },
    { fase: '6. Auditoría forense', area: 'VP Investigación Business SAC',   accion: 'Auditoría completa de 22,314 llamadas + facturación + AV + DIDs', resultado: 'Diagnóstico completo disponible. Ventana de intervención: antes del 12 de junio.' },
  ],

  comparativo: [
    { metrica: 'Dato de minutos reportado al cliente',  real: '1,048 min (10.5% del plan)',          ideal: 'Dato correcto bajo política: 7,552 min/mes (75.5%)' },
    { metrica: 'AV Voicebot — uso / costo',             real: '$0 de uso / $3,000/mes cobrados',      ideal: 'Crédito proactivo o propuesta de reactivación con correcciones' },
    { metrica: 'CP Chat — evidencia de uso',            real: '12 agentes × $350 = $4,200 sin uso',   ideal: 'Validar uso real antes de que el cliente lo detecte' },
    { metrica: 'Tiempo de respuesta al reporte AV',     real: '29+ días sin sesión agendada',         ideal: 'Sesión dentro de 5 días hábiles del reporte' },
    { metrica: 'Facturación proyectada (Dic 2026)',     real: '$0 (escenario churn progresivo)',       ideal: '$50,000–$55,000/mes (escenario optimizado)' },
    { metrica: 'Valor anual en juego',                  real: '$0–$60,000 (cancelación)',             ideal: '$540,000–$660,000 (colaboración activa AV + ingeniería)' },
  ],

  plan_inmediato: [
    { accion: 'Llamada directa a Cristian López — por teléfono, no ticket. Escuchar, informar números WA atrapados, confirmar fecha de sesión', responsable: 'Dan D. + VP SAC', criterio: 'Llamada realizada antes del 6 de junio. Fecha de sesión confirmada.' },
    { accion: 'Exportar y enviar reporte de tráfico de los 26 DIDs dados de baja — presentar como valor, no como reproche', responsable: 'Daniel M.', criterio: 'Reporte entregado al cliente el mismo día de la llamada' },
    { accion: 'Crear grupo WhatsApp: Cliente (Cristian + Luis Carlos) + Ventas + SAC + Ingeniería', responsable: 'VP SAC', criterio: 'Grupo activo con primer mensaje de bienvenida y agenda de la semana' },
    { accion: 'Definir posición interna sobre voicebot ($3,000/mes con $0 de uso): crédito, ajuste o justificación', responsable: 'Dirección', criterio: 'Posición definida antes de la llamada con Cristian' },
    { accion: 'Validar internamente la discrepancia del dato de minutos (1,048 panel vs. 7,552 política real)', responsable: 'Técnico / Operaciones', criterio: 'Explicación interna lista — no comunicar al cliente hasta resolver' },
    { accion: 'Registrar a Luis Carlos Hernández Espinosa en el CRM como contacto técnico formal', responsable: 'Dan D.', criterio: 'Registrado con correo, teléfono y rol antes de la sesión' },
  ],
  plan_mediano: [
    { accion: 'Agendar y ejecutar sesión de asesoría técnica con Luis Carlos + Cristian (ambos en convocatoria obligatoria)', responsable: 'Dan D. + Comercial', criterio: 'Sesión ejecutada antes del 10 de junio. Sin Luis Carlos, reagendar.' },
    { accion: 'Entregar propuesta AV respondiendo las 8 fallas punto a punto — no una propuesta genérica', responsable: 'David Ing. + Eduardo', criterio: 'Propuesta entregada en la sesión con scope, horas y costo de desarrollo' },
    { accion: 'Verificar si los 12 agentes CP Chat tienen uso activo y resolver los $4,200/mes', responsable: 'Daniel M. / Técnico', criterio: 'Situación resuelta antes de que el cliente la detecte' },
    { accion: 'Investigar qué pasó con SOMNOX y los 9 DIDs cancelados con tráfico real', responsable: 'Dan D.', criterio: 'Diagnóstico: migrado, cerrado o reconvertible. Compartir con Dirección.' },
  ],
  plan_estrategico: [
    { accion: 'Ejecutar optimización del AV de chat: resolver 8 fallas documentadas + integración BD/stock', responsable: 'Ingeniería + Luis Carlos', criterio: 'AV de chat funcional como agente comercial antes de agosto 2026' },
    { accion: 'Proponer reactivación del AV de voz para cobertura nocturna (298 llamadas/mes sin atender)', responsable: 'SAC + Producto', criterio: 'Propuesta entregada post-sesión. Tasa de pérdida nocturna < 5%' },
    { accion: 'Establecer cadencia mensual de revisión de cuenta — cambiar modelo de reactivo a consultivo', responsable: 'VP SAC', criterio: 'Primer review mensual agendado para julio 2026' },
    { accion: 'Documentar Salud y Hogar como caso de retención de cuenta Enterprise con AV', responsable: 'SAC + Marketing', criterio: 'Caso documentado cuando la facturación supere $42,000/mes' },
  ],
  areas_oportunidad: [
    { area: 'AV de chat como agente comercial completo (BD + stock + CRM)',  impacto: 'Expansión de $32,026 a $50,000+/mes. El cliente ya autorizó la inversión verbalmente.', responsable: 'Ingeniería + SAC' },
    { area: 'Cobertura nocturna y dominical con AV de voz',                  impacto: '298 llamadas médicas nocturnas + 16.6% pérdida dominical = caso de negocio cuantificable.', responsable: 'Producto + SAC' },
    { area: 'SOMNOX como cuenta separada',                                    impacto: 'Si no migró definitivamente, es una cuenta con potencial propio de 9 DIDs y presencia en 5 ciudades + España.', responsable: 'Ventas + Dan D.' },
    { area: 'Ownership único de cuenta Enterprise',                           impacto: 'Elimina los 29 días de retraso. Un responsable, un canal, una propuesta.', responsable: 'Dirección + VP SAC' },
  ],

  perfiles: [
    {
      nombre: 'Ing. Cristian López', rol: 'Cliente (Salud y Hogar) — Gerente TI / Sistemas · Contacto operativo principal', color: '#3b82f6',
      campos: [
        { label: 'Correo',             value: 'gerencia.sistemas@cgsi.com.mx' },
        { label: 'Rol en el caso',     value: 'Abrió ambos tickets. Autoriza inversión técnica.' },
        { label: 'Motivación',         value: 'Resolver el AV con un partner confiable. No cambiar de plataforma si Callpicker responde.' },
        { label: 'Comportamiento',     value: 'Silencio post-solicitud de bajas desde el 2 de junio. Interpreta la falta de respuesta como falta de interés.' },
        { label: 'Clave de gestión',   value: 'Llamar por teléfono directo, no por ticket. Llevar datos — especialmente el reporte de tráfico de los DIDs dados de baja.' },
      ],
    },
    {
      nombre: 'Luis Carlos Hernández Espinosa', rol: 'Cliente (Salud y Hogar) — Implementador técnico AV (autodidacta) · CRÍTICO', color: '#ef4444',
      campos: [
        { label: 'Rol real',           value: 'Configuró y mantiene el AV de chat. Conoce cada falla técnica documentada.' },
        { label: 'Riesgo',             value: 'No está registrado en el CRM de Callpicker. Sin él, ninguna sesión técnica avanza.' },
        { label: 'Cumplimiento',       value: 'Entregó reporte de 7 páginas el 6 de mayo — CUMPLIÓ su compromiso del 29 de abril. Callpicker no cumplió los suyos.' },
        { label: 'Instrucción clave',  value: 'TODA sesión de asesoría debe incluirlo explícitamente en la convocatoria. Sin Luis Carlos = sin avance técnico.' },
      ],
    },
    {
      nombre: 'Héctor A. Hernández Mejía', rol: 'Cliente (Salud y Hogar) — Director General · Decisor de alto nivel', color: '#f59e0b',
      campos: [
        { label: 'Teléfono',           value: '3322693333' },
        { label: 'Posición',           value: 'Titular de la cuenta. Solo se involucra si la situación escala a nivel directivo.' },
        { label: 'Recomendación',      value: 'No involucrar hasta que el caso esté resuelto operativamente. Usarlo solo si se requiere formalizar un contrato de expansión.' },
      ],
    },
    {
      nombre: 'Dan D. / Daniel M.', rol: 'Callpicker — Comercial + UX · Responsables actuales del caso (fragmentados)', color: '#8b5cf6',
      campos: [
        { label: 'Problema central',   value: 'Sin ownership único. Los 4 actores (Dan, Monse, David, Daniel M.) no tienen un coordinador que unifique el caso.' },
        { label: 'Compromisos 29 Abr', value: '4 compromisos. 0 cumplidos al 4 de junio. El cliente esperó 29+ días sin respuesta.' },
        { label: 'Acierto de Daniel M',value: 'Advirtió tráfico activo en los DIDs antes de ejecutar la baja. La recomendación fue correcta — llegó tarde.' },
        { label: 'Acción requerida',   value: 'Designar UN responsable del caso que coordine a todos los actores y tenga autoridad para decidir.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '9 años de relación comercial activa — loyalty estructural',
      'Pagador puntual — Stripe activo y vigente (VISA ...2919, vence 5/2027)',
      'WhatsApp API con consumo real: 12,593 mensajes/mes',
      'Cliente técnicamente maduro — documentó 8 fallas del AV en 7 páginas',
      'Luis Carlos como técnico autodidacta comprometido con el proyecto',
      'Disposición declarada de inversión si el AV funciona (29 de abril)',
      '80.6% tasa de atención en llamadas entrantes — operación sólida',
      'Self-service mayo: 404 eventos (+2.5x) — el AV ya genera valor real',
    ],
    oportunidades: [
      'AV de chat: 8 fallas documentadas y lista de requerimientos lista para desarrollar',
      'AV de voz: reactivable con correcciones conductuales y técnicas documentadas',
      '298 llamadas nocturnas perdidas = caso de negocio para AV 24/7',
      'Integración de stock/BD = ingeniería adicional cotizable ($15,000–$25,000)',
      'SOMNOX: posible cuenta separada con potencial propio (9 DIDs, 5 ciudades + España)',
      'WhatsApp API creciente: 12,593 mensajes/mes = expansión natural',
      'Escenario optimizado: $50,000–$55,000/mes en Dic 2026 (+72% vs. hoy)',
    ],
    debilidades: [
      'Uso real 75.5%/mes — reportado incorrectamente al cliente como 10.5% (dato de panel)',
      'AV de voz descontinuado — $3,000/mes cobrados con $0 de uso real (5+ semanas)',
      '$4,200/mes en CP Chat (12 agentes) sin evidencia de uso documentada',
      '26 DIDs con tráfico activo dados de baja sin análisis previo (15,665 llamadas)',
      '21 días de delay para entregar prompt a desarrollo tras reporte del cliente',
      'Sin ownership único del caso — 4 actores sin coordinación ni responsable',
      'Luis Carlos no está registrado en el CRM de Callpicker',
    ],
    amenazas: [
      'Soft Suspend: 15 Jun → Hard: 20 Jun → Cancelación: 25 Jun — ventana < 10 días',
      'Cliente en silencio desde el 2 de junio post-solicitud de bajas',
      '2 números WA atrapados en API externa — operación activa posiblemente afectada',
      'SOMNOX posiblemente migrado a otra plataforma de telefonía',
      'Percepción de cobro por servicios no entregados ($7,200/mes sin uso)',
      'Contracción de -21% en llamadas desde enero — señal temprana no atendida',
      'Si el AV no mejora, el cliente tiene nombre, documento y fecha para irse a otro proveedor',
    ],
  },

  conclusion: 'El caso Salud y Hogar es el más crítico en el portafolio activo de Callpicker: $32,026/mes en riesgo de cancelación total, con un cliente que documentó sus problemas con más rigor que muchas empresas de tecnología, y que sigue esperando respuesta después de 29 días. La cuenta no se pierde por insatisfacción — se pierde por ausencia de respuesta percibida. La ventana de confianza está cerrándose. El diagnóstico está listo. Lo que falta es velocidad.',

  pierde: [
    '$32,026/mes en facturación activa (Stripe vigente hasta mayo 2027)',
    '9 años de relación comercial construida — un referente de permanencia en el portafolio',
    'El proyecto AV completo: $15,000–$25,000 en ingeniería + expansión a $50,000/mes',
    'SOMNOX como cuenta separada con potencial internacional (España)',
    'La confianza de Luis Carlos — el técnico que documentó todo y cumplió sus compromisos',
  ],
  gana: [
    'Retención de $32,026/mes y expansión progresiva a $50,000–$55,000/mes',
    'Proyecto de ingeniería AV como caso de éxito en sector salud / franquicias médicas',
    'Un proceso de ownership unificado para cuentas Enterprise que previene el próximo incendio',
    'Reactivación del AV de voz con cobertura 24/7 — pacientes atendidos en horarios críticos',
    'Caso documentado de cómo responder a un cliente que entregó 8 fallas en 7 páginas',
  ],
  recomendacion_central: 'Antes del 6 de junio: llamada telefónica directa a Cristian López, grupo WhatsApp multidisciplinario activo, posición interna sobre el voicebot definida. Antes del 10 de junio: sesión de asesoría ejecutada con Luis Carlos presente y propuesta técnica que responda las 8 fallas punto a punto. Antes del 15 de junio: contrato de expansión o carta de intención firmada. Todo lo demás es consecuencia.',
}
