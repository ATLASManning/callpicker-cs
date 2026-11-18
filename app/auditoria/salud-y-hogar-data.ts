import type { AuditoriaCase } from './types'

/* ─────────────────────────────────────────────────────────────────────────────
 * SALUD Y HOGAR · CID 946 · D3 · asesor Dan
 *
 * v2.0 — 17 nov 2026. Sustituye la v1.0 de junio con el corte de 35,743
 * llamadas de enero a noviembre. El documento entregado está colgado en la
 * pestaña Documentos.
 *
 * LAS CIFRAS DEL DOCUMENTO SE RECALCULARON ANTES DE ENTRAR AQUÍ con
 * `scripts/concilia-auditoria-salud-y-hogar.py`. Las sumas de llamadas, horas,
 * días de semana y minutos cierran al número, y coinciden mes por mes y columna
 * por columna con el corte vivo del tablero en enero–agosto. Lo que NO cerró
 * está corregido abajo y marcado dentro del propio documento:
 *
 *   1 · $32,026/mes era la factura de JUNIO. El MRR institucional es el del
 *       Gross Revenue y nada más: $23,480 sin IVA, «MRR estable», AAA — y la
 *       lista de servicios vigente de la cuenta suma exactamente lo mismo, que
 *       son dos fuentes independientes. (El campo `facturacion` de la cartera
 *       dice $12,982 y tampoco es la fuente: queda anotado como pendiente.)
 *   2 · El AV Voicebot YA NO SE FACTURA. El hallazgo 2 CRÍTICO del documento
 *       —«$3,000/mes con $0 de uso»— describe un cobro que ya no existe: no
 *       está en la lista viva y la bitácora del KAM registra la baja del
 *       Agente Virtual a finales de septiembre. Tampoco se facturan ya los
 *       tokens de Chatbot ($500) ni WhatsApp API ($817.75). Lo que SÍ sigue
 *       cobrándose sin uso documentado es CP Chat: $4,200/mes.
 *   3 · El −68% comparaba noviembre a 17 DÍAS contra enero completo. Entre
 *       meses completos (ene 4,561 → oct 2,799) son −39%, y al ritmo de
 *       noviembre −44%. La contracción es real y es grave; la cifra que se
 *       lleva a la llamada es −39%, la que el cliente no puede refutar.
 *   4 · El promedio de minutos «6,818/mes · 68.2%» dividía entre 11 metiendo
 *       ese mismo noviembre partido. Con los 10 meses completos son 7,217
 *       min/mes, 72.2% del plan. Ningún mes genera excedente: el máximo es
 *       enero con 9,726.
 *   5 · Dos repartos no cierran y NO se citan por línea: la composición por
 *       tipo de destino (74,930 min de 74,999 declarados; 35,824 llamadas de
 *       35,743) y el bloque nocturno (2,492 de 2,527). Los agregados se
 *       mantienen.
 *   6 · Dos conteos se contradecían entre secciones del documento: el FODA
 *       decía «36 DIDs dados de baja» cuando las bajas son 26 (36 es el número
 *       de DIDs rastreables), y el hallazgo 10 decía «7 sin resolver» cuando
 *       las 8 fallas del AV siguen las 8 abiertas.
 *
 * LO QUE EL DOCUMENTO NO TRAÍA Y CAMBIA LA LECTURA: la bitácora del KAM del 30
 * de septiembre dice que el cliente «se encuentra trabajando en un desarrollo
 * propio de la empresa» y que las funcionalidades que usa «podrían ser
 * sustituidas por su desarrollo interno». El escenario optimizado del documento
 * ($50,000–$55,000/mes) descansa entero en que el cliente nos compre esa
 * ingeniería. Eso no se puede dar por hecho, y va dicho con palabras abajo.
 *
 * EL ORDEN DE `hallazgos` NO ES ESTILO. `lib/atlas-context.ts` mete en el
 * dossier de la cuenta sólo los CUATRO primeros, recortados a 180 caracteres,
 * y `lib/seguimiento-auditoria.ts` mete los TRES primeros en la actividad SAC
 * que lee el asesor antes de llamar. Si el hallazgo del Voicebot se quedara
 * donde estaba, el asesor entraría a la llamada a plantearle al cliente un
 * cobro que ya se dio de baja. Cada uno de los cuatro primeros dice lo suyo
 * dentro de sus primeros 180 caracteres; lo compruebo con
 * `node scripts/revisa-dossier-auditoria.mjs salud-y-hogar`.
 * ───────────────────────────────────────────────────────────────────────────── */

export const SALUD_Y_HOGAR: AuditoriaCase = {
  id: 'salud-y-hogar',
  asesor: 'Dan',
  nombre: 'Salud y Hogar',
  sector: 'Salud – Equipos Médicos / Franquicias Nacionales',
  fecha_periodo: 'Enero – Noviembre 2026',
  fecha_auditoria: 'Nov 2026',
  tipo_cliente: 'Enterprise AAA – 9 años de relación comercial',
  descripcion_contexto: 'CID 946 · Auditoría Forense Integral v2.0 · MRR $23,480/mes (GRC) · 35,743 llamadas ene–nov',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '2.0',

  kpis: [
    { label: 'MRR vigente (GRC)',        value: '$23,480',   color: '#6366f1' },
    { label: 'Contracción ene→oct',      value: '−39%',      color: '#ef4444' },
    { label: 'CP Chat sin uso',          value: '$4,200',    color: '#ef4444' },
    { label: 'Fallas del AV abiertas',   value: '8 de 8',    color: '#f59e0b' },
  ],

  resumen_ejecutivo: 'Segunda auditoría de la cuenta Salud y Hogar (CID 946), cliente activo desde julio de 2018 y clasificación AAA del Gross Revenue. Cubre 35,743 llamadas de enero a noviembre de 2026 —noviembre a 17 días, rotulado como parcial— además de facturación, tickets, los DIDs dados de baja, el Agente Virtual y la bitácora del KAM.\n\nLA SITUACIÓN DE JUNIO NO OCURRIÓ. La v1.0 cerraba con un Soft Suspend el 15 de junio y una ventana de menos de 10 días hábiles. Cinco meses después la cuenta está activa, al corriente, sin incidencias de pago, y el Gross Revenue la marca «MRR estable». El riesgo de esta cuenta es comercial, no de cobranza, y eso cambia por completo la conversación.\n\nLO QUE SÍ PASÓ ES UNA EROSIÓN. El MRR bajó de $27,510 a $23,480 cuando el cliente dio de baja el Agente Virtual a finales de septiembre. Las llamadas llevan ONCE MESES consecutivos a la baja: −39% de enero a octubre, el último mes completo. Las 8 fallas del AV que el cliente documentó el 6 de mayo siguen las 8 abiertas. Y la bitácora del KAM dice que el cliente está construyendo su propio desarrollo.\n\nNo hay una fecha de corte que fuerce la urgencia. Hay una cuenta que se está yendo despacio, y una sesión técnica que lleva seis meses sin agendarse.',

  resultado_positivo: 'Salud y Hogar no es un cliente en churn pasivo ni está en problemas de pago: paga puntual por Stripe, lleva 119 meses facturados y $1,604,239 acumulados. El canal telefónico sigue siendo misión crítica —28,121 llamadas atendidas en once meses, 78.7% de atención— y el AV de chat es lo único que CRECE en toda la cuenta: 3,057 eventos de autoservicio en el periodo, con máximo histórico en octubre (423) y tendencia ascendente los últimos tres meses. El consumo real es del 72.2% del plan sobre los meses completos, así que el plan está bien calibrado y no hay excedentes que cobrar. El cliente es técnicamente maduro: documentó 8 fallas en 7 páginas y declaró disposición de inversión. Lo que queda por ver es si esa inversión se queda con nosotros o se va a su desarrollo interno, y eso se decide en una sesión técnica que todavía no existe.',

  hallazgos: [
    /* Los cuatro primeros son los que cambian una decisión, y cada uno dice lo
       suyo ANTES del corte de 180 caracteres de Atlas: ninguno depende de la
       segunda mitad de su frase. El detalle operativo va después a propósito —
       eso se lee en la pantalla. Lo mide `revisa-dossier-auditoria.mjs`. */
    'CRÍTICO — El MRR es $23,480/mes, no $32,026: esa cifra era la factura de junio. El GRC lo marca «MRR estable» y la lista de servicios vigente suma lo mismo. No citar la vieja. Toda la proyección del documento entregado (de $32,026 a $50,000–$55,000) está escalada sobre el número viejo, así que sus porcentajes no se sostienen; el campo `facturacion` de la cartera dice $12,982 y tampoco es la fuente.',
    'CRÍTICO — No plantearle al cliente el cobro del Voicebot: ya no se factura, la baja se ejecutó a finales de septiembre. Lo que sí sigue cobrándose sin uso es CP Chat, $4,200/mes. El documento entregado trae ese cobro como su hallazgo 2 CRÍTICO porque leyó el desglose de junio; levantarlo en la llamada convierte una gestión de retención en una discusión sobre un cargo inexistente. Tampoco se facturan ya los tokens de Chatbot ($500) ni WhatsApp API ($817.75).',
    'CRÍTICO — El cliente está construyendo un desarrollo propio: lo dice la bitácora del KAM del 30 de septiembre, y por eso dio de baja el AV y DIDs. Es el churn de esta cuenta. El documento entregado no recoge esa frase: su escenario optimizado de $50,000–$55,000/mes descansa entero en que nos compre la ingeniería del AV, y eso no se puede dar por hecho.',
    'CRÍTICO — La contracción es de −39% (ene 4,561 → oct 2,799), no de −68%: esa lectura comparaba noviembre a 17 días contra enero completo. Once meses seguidos a la baja. Al ritmo de noviembre el mes daría 2,538 llamadas, −44%. La cifra que se lleva a la llamada es −39%: un número que el cliente puede refutar cuesta la conversación entera.',
    'ALTO — Las 8 fallas del AV de chat que el cliente documentó el 6 de mayo siguen las 8 abiertas seis meses después (6 «sin resolver», 1 «pendiente», 1 «requiere ingeniería»). La sesión de asesoría técnica sigue sin fecha. El documento entregado decía «7 sin resolver»: son 8.',
    'ALTO — 26 DIDs con tráfico activo dados de baja sin análisis previo: los 36 rastreables suman 15,665 llamadas en 5 meses con 85.0% de atención media. Oxígeno GDL solo tenía 1,547 llamadas con 85.6% de atención. «Cierre de campaña» no cuadra con líneas de Enfermería, Oxígeno y Camas, que son servicio médico core. Ese reporte de tráfico es la palanca de confianza de la próxima llamada: entregarlo como valor, no como reproche.',
    'ALTO — 2 números de WhatsApp atrapados en API externa: 523314545205 y 523315798431. Requieren liberación por parte del cliente; no se pueden liberar desde nuestro lado. Callpicker tiene que comunicarlo activamente y guiar el proceso, porque es operación del cliente que puede estar caída sin que él sepa por qué.',
    'ALTO — Luis Carlos Hernández Espinosa, el técnico que configuró y mantiene el AV, sigue sin estar registrado como contacto de la cuenta. Sin él ninguna sesión técnica avanza, y es el riesgo de dependencia más alto del caso. El documento entregado lista además un «Presidente Ejecutivo» y un COO que nuestras fuentes NO confirman: no se registran hasta confirmarlos, porque un contacto del lado equivocado es peor que un hueco.',
    'MEDIO — La situación de suspensión de la v1.0 no ocurrió. El documento de junio cerraba con Soft Suspend el 15 de junio, Hard el 20 y aviso de cancelación el 25. Cinco meses después la cuenta está activa y al corriente. Conviene saberlo antes de volver a usar una fecha de corte como palanca de urgencia con este cliente.',
    'MEDIO — SOMNOX: 9 DIDs cancelados que recibían ~2,500 llamadas en 5 meses con más del 88% de atención. Opera como marca diferenciada en GDL, CDMX, MTY, Chihuahua, QRO, Puebla, Mérida y España. El argumento de campaña puntual no se sostiene con esas tasas; destino desconocido, probablemente migrada o cerrada como unidad.',
    'MEDIO — 498 llamadas médicas perdidas en horario nocturno (20h–8h) y 17.3% de pérdida los domingos, el peor día de la semana. El autoservicio del AV no descuenta minutos del plan, así que la cobertura 24/7 es el único caso de negocio cuantificable que esta cuenta todavía tiene sin explotar.',
    'INTERNO — Tres cifras del documento entregado no cierran contra sus propias partes y quedan marcadas dentro de él: la composición por tipo de destino (74,930 min de 74,999; 35,824 llamadas de 35,743), el bloque nocturno (2,492 de 2,527) y el total con IVA de junio ($114.84, que son $99 antes de IVA, un DID). Los agregados se publican; los repartos por línea no se citan.',
  ],

  cronologia: [
    { fecha: 'Ene 2017',    responsable: 'Ventas Callpicker',               evento: 'Primera oportunidad Zoho — Upsale Salud y Hogar. Fuente: Ad Google.', tipo: 'neutral' },
    { fecha: 'Jul 2018',    responsable: 'Callpicker',                      evento: 'Cuenta activa. Inicio de relación de 9 años de permanencia. 119 meses facturados, $1,604,239 acumulados.', tipo: 'ok' },
    { fecha: '29 Abr 2026', responsable: 'Dan D. + Daniel M. (CP) / Cristian + Luis Carlos (cliente)', evento: 'Reunión técnica AV. Se confirma: AV de voz ya descontinuado. Luis Carlos identificado como técnico operativo real. 4 compromisos adquiridos.', tipo: 'pivote' },
    { fecha: '6 May 2026',  responsable: 'Luis Carlos Hernández (cliente)',  evento: 'Ticket AV #106587 + reporte de 7 páginas. Cliente documentó 8 fallas. Callpicker tardó 21 días en entregar el prompt a desarrollo.', tipo: 'problema' },
    { fecha: '19 May 2026', responsable: 'Callpicker interno',               evento: 'Definición: asesoría a $2,500/hr. 13 días de espera para definir ruta que además agrega costo al cliente.', tipo: 'problema' },
    { fecha: '27 May 2026', responsable: 'Callpicker — Ingeniería',          evento: 'Prompt entregado a desarrollo — 21 días después del reporte.', tipo: 'problema' },
    { fecha: '1 Jun 2026',  responsable: 'Cliente / Daniel M. (CP)',         evento: 'Solicitud de baja de 45 DIDs — Ticket #107714. Daniel M. advierte tráfico activo. Recomendación correcta, ejecutada tarde.', tipo: 'problema' },
    { fecha: '2 Jun 2026',  responsable: 'Callpicker Operaciones',           evento: 'Baja de 26 DIDs confirmada (72 → 46). 2 números WA atrapados en API. Sin análisis de impacto presentado al cliente.', tipo: 'problema' },
    { fecha: '15 Jun 2026', responsable: 'Sistema Callpicker',               evento: 'EL SOFT SUSPEND NO OCURRIÓ. La v1.0 lo daba por programado, con cancelación el 25 de junio. La cuenta siguió activa y al corriente los cinco meses siguientes.', tipo: 'ok' },
    { fecha: '31 Ago 2026', responsable: 'Conciliación de cartera',          evento: 'Subcuenta Salud y Hogar — USA (Z38, CID 96443) integrada a D3 por conciliación de dirección. Hoy en el GRC con MRR 0 y «Desactivado».', tipo: 'neutral' },
    { fecha: '~30 Sep 2026', responsable: 'Cliente / Dan (bitácora KAM)',    evento: 'EL PIVOTE. El cliente pide la baja del Agente Virtual y de DIDs adicionales «debido a que actualmente se encuentran trabajando en un desarrollo propio de la empresa». El MRR baja de $27,510 a $23,480.', tipo: 'pivote' },
    { fecha: 'Oct 2026',    responsable: 'Plataforma',                       evento: 'Máximo histórico de autoservicio del AV de chat: 423 eventos. Es lo único que crece en la cuenta.', tipo: 'ok' },
    { fecha: '10 Nov 2026', responsable: 'Dan (bitácora KAM)',               evento: 'Cristian reporta dos incidencias de configuración; la de llamadas desviadas a buzón queda resuelta. Se registra downgrade en Chat y asistentes virtuales. Próxima acción: correo a Cristian para una reunión de seguimiento.', tipo: 'neutral' },
    { fecha: '17 Nov 2026', responsable: 'VP Investigación de Business SAC', evento: 'Auditoría forense v2.0 sobre 35,743 llamadas. Cifras conciliadas contra el GRC y la lista de servicios vigente: seis correcciones aplicadas al documento entregado antes de publicarlo.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'CID / RFC',             value: 'CID 946 · D3 | SALUD Y HOGAR | SHO070129R64' },
    { label: 'Actividad',             value: 'Consultas médicas, equipo médico (Oxígeno, Camas, Enfermería, Sillas de ruedas)' },
    { label: 'Marca asociada',        value: 'SOMNOX (bienestar/sueño) — operación multi-plaza e internacional' },
    { label: 'Tamaño',                value: 'Mediana · 51–200 empleados · fundada 1992' },
    { label: 'Sedes confirmadas',     value: '7 confirmadas + posible 8ª plaza (CUN histórico, sin confirmar)' },
    { label: 'Presencia geográfica',  value: 'GDL, CDMX, MTY, Puebla, Chihuahua, QRO, Mérida · Internacional: España (SOMNOX)' },
    { label: 'MRR vigente',           value: '$23,480 sin IVA — fuente: Gross Revenue de Zoho, «MRR estable», clasificación AAA. NO es $32,026: ésa era la factura de junio' },
    { label: 'Historial de cobro',    value: '13 facturas · 119 meses · $1,604,239 acumulados · al corriente, 0 incidencias' },
    { label: 'Plan activo',           value: 'Visibilidad y Control 10,000 min — consumo real 72.2% sobre meses completos, sin excedentes' },
    { label: 'Pago',                  value: 'Stripe activo | VISA ...2919' },
    { label: 'Relación comercial',    value: '9 años (activo desde julio 2018)' },
    { label: 'Subcuenta',             value: 'Salud y Hogar — USA (CID 96443) integrada a D3 el 31 ago 2026; hoy desactivada' },
  ],

  necesidad_negocio: 'Salud y Hogar opera una red médica multiproducto (oxígeno, camas, enfermería, sillas de ruedas) con 7 sedes nacionales y presencia internacional a través de SOMNOX. El canal telefónico es misión crítica: 35,743 llamadas en once meses con 78.7% de atención, y 2,527 de ellas fuera de horario, donde una llamada perdida es un paciente con una necesidad médica sin respuesta.\n\nEl cliente busca transformar su operación con un Agente Virtual que perfile al paciente desde el primer contacto, consulte stock en tiempo real, recomiende productos y facilite la venta sin intervención humana inicial. El 29 de abril declaró: «no tenemos inconveniente en asumir los costos si el agente virtual funciona». La condición era única: que funcione.\n\nSEIS MESES DESPUÉS ESO SIGUE SIN RESOLVERSE, y la bitácora del KAM del 30 de septiembre dice que el cliente está construyendo su propio desarrollo. La necesidad no desapareció: se la está resolviendo él. Ésa es la diferencia entre esta auditoría y la de junio.',

  potencial_corto: [
    'Entregar el reporte de tráfico de los 26 DIDs dados de baja — el dato que el cliente no tiene y que ya está medido',
    'Resolver los 2 números WA atrapados en API externa, guiando al cliente en la liberación',
    'Agendar la sesión de asesoría técnica con Luis Carlos Y Cristian en convocatoria, seis meses después del reporte',
    'Resolver internamente los $4,200/mes de CP Chat sin uso documentado antes de que el cliente lo detecte',
  ],
  potencial_largo: [
    'Proyecto de ingeniería AV: sincronización BD + stock + CRM — $15,000–$25,000, CONDICIONADO a que el cliente no lo haya resuelto ya por dentro',
    'Reactivación del AV de voz para cobertura nocturna y dominical (498 perdidas nocturnas, 17.3% de pérdida en domingo)',
    'SOMNOX como cuenta separada, SI no migró definitivamente: 9 DIDs, cinco ciudades y España',
    'El escenario optimizado del documento entregado ($50,000–$55,000/mes en dic 2026) NO se adopta como pronóstico: supone que el cliente nos compra la ingeniería, y su bitácora dice que la está construyendo. Se cita como techo teórico, no como proyección',
  ],

  tacticas: [
    { nombre: 'Sustitución por desarrollo propio', descripcion: 'La bitácora del KAM del 30 de septiembre lo dice textual: el cliente «se encuentra trabajando en un desarrollo propio» y las funcionalidades que usa «podrían ser sustituidas por su desarrollo interno». La baja del AV y de DIDs es la primera entrega de ese desarrollo', impacto: 'Es el mecanismo real de churn de esta cuenta. No es insatisfacción ni precio: es que el cliente dejó de necesitarnos para una parte, y la pregunta abierta es cuántas partes más.' },
    { nombre: 'Reducción silenciosa', descripcion: 'Cancela DIDs justificando «cierre de campaña» cuando incluyen Oxígeno, Enfermería y Camas — servicio médico core, no marketing, con 85% de atención media', impacto: 'Señal de reconversión operativa. SOMNOX, con 9 DIDs cancelados y tráfico real por encima del 88% de atención, probablemente ya migró.' },
    { nombre: 'Documentación rigurosa como presión', descripcion: 'Entregó un reporte de 7 páginas con 8 fallas documentadas del AV el 6 de mayo. El cliente hizo el análisis; Callpicker debe responderlo punto a punto, no con respuestas genéricas', impacto: 'Alto nivel de madurez técnica. Seis meses después las 8 siguen abiertas, y eso es precisamente lo que justifica construir en casa.' },
  ],
  senal_alarma: 'La señal de esta cuenta ya no es una fecha de corte: es la frase «desarrollo propio» en la bitácora del 30 de septiembre, seguida de la baja del AV. Cuando un cliente técnicamente maduro documenta 8 fallas, espera seis meses y empieza a construirlo él, el siguiente paso no es pedir una baja: es dejar de renovar por partes. El MRR ya bajó $4,030 por esa vía sin que ninguna alerta se levantara.',

  problema_raiz: 'Seis meses de silencio técnico frente a un cliente que documentó el problema, y que entretanto empezó a resolverlo por su cuenta',
  problema_raiz_detalle: 'La v1.0 nombró el problema correctamente —cuatro actores internos sin responsable único— y nada cambió. Las 8 fallas que el cliente documentó el 6 de mayo siguen las 8 abiertas. La sesión de asesoría nunca se agendó. En ese hueco el cliente tomó una decisión que no nos consultó: construir su propio desarrollo, y dar de baja el AV que nos pagaba. El MRR cayó $4,030/mes sin que ninguna alerta se levantara, y el documento de noviembre seguía facturando el servicio dado de baja porque leía el desglose de junio. La cadena completa es la misma de junio, un semestre más vieja: el cliente se mueve más rápido que nosotros en cada punto.',

  flujo_real: [
    { fase: '1. Reunión 29 Abr',       area: 'Dan D. + Daniel M.',            accion: '4 compromisos adquiridos: consultar automatizaciones, enviar orden de pago, feedback de ingeniería, contactar a Cristian', resultado: 'Ninguno cumplido. Seis meses después la sesión técnica sigue sin agendarse.' },
    { fase: '2. Reporte 6 May',        area: 'Luis Carlos (cliente)',          accion: 'Entrega reporte de 7 páginas con 8 fallas del AV documentadas con detalle técnico', resultado: '21 días para entregar el prompt a desarrollo. Al 17 de noviembre, las 8 fallas siguen abiertas.' },
    { fase: '3. Tarifación tardía',    area: 'Callpicker comercial',           accion: 'Después de 13 días define que la asesoría costará $2,500/hr', resultado: 'Agrega fricción de costo en lugar de agendar la sesión. La sesión nunca se agendó.' },
    { fase: '4. Baja de DIDs',         area: 'Cliente / Operaciones CP',       accion: 'Cliente pide baja de 45 DIDs. Callpicker ejecuta 26 sin entregar el análisis de tráfico activo', resultado: '15,665 llamadas en 5 meses dadas de baja. Daniel M. advirtió tarde. 2 números WA atrapados.' },
    { fase: '5. El pivote (~30 Sep)',  area: 'Cliente',                        accion: 'Pide la baja del Agente Virtual y de DIDs adicionales: está construyendo su propio desarrollo', resultado: 'MRR de $27,510 a $23,480. Ninguna alerta se levantó; el documento de noviembre seguía cobrando el AV.' },
    { fase: '6. Nov 2026',             area: 'Dan (KAM)',                      accion: 'Registra el downgrade en Chat y asistentes virtuales. Próxima acción declarada: correo a Cristian pidiendo reunión', resultado: 'Correcto, y es el primer movimiento proactivo del semestre. Pero un correo no sustituye la sesión técnica que se debe desde mayo.' },
    { fase: '7. Auditoría v2.0',       area: 'VP Investigación Business SAC',  accion: 'Auditoría de 35,743 llamadas + facturación + AV + DIDs, conciliada contra el GRC y los servicios vivos', resultado: 'Seis correcciones al documento entregado. El diagnóstico está listo; la sesión técnica sigue siendo lo único que falta.' },
  ],

  comparativo: [
    { metrica: 'MRR citado en el documento entregado',  real: '$32,026 con IVA — factura de junio 2026',   ideal: '$23,480 sin IVA · Gross Revenue, «MRR estable», AAA' },
    { metrica: 'AV Voicebot',                            real: 'El documento lo cobra: $3,000 con $0 de uso', ideal: 'Dado de baja a finales de septiembre. NO se le menciona al cliente' },
    { metrica: 'CP Chat — evidencia de uso',             real: '12 agentes × $350 = $4,200/mes, vivo en la lista de servicios', ideal: 'Validar uso real y resolver antes de que el cliente lo detecte' },
    { metrica: 'Contracción de volumen',                 real: 'El documento declaraba −68% (17 días vs. 31)', ideal: '−39% entre meses completos (ene 4,561 → oct 2,799)' },
    { metrica: 'Consumo del plan',                       real: 'El documento declaraba 68.2% (dividía entre 11)', ideal: '72.2% sobre los 10 meses completos. Sin excedentes' },
    { metrica: 'Fallas del AV documentadas',             real: '8 abiertas seis meses después del reporte',  ideal: 'Respuesta punto a punto en una sesión con Luis Carlos presente' },
    { metrica: 'Sesión de asesoría técnica',             real: 'Sin fecha desde el 6 de mayo',               ideal: 'Dentro de 5 días hábiles del reporte del cliente' },
  ],

  plan_inmediato: [
    { accion: 'Llamada directa a Cristian López — por teléfono, no por ticket. Escuchar la causa de la contracción y qué alcance tiene su desarrollo propio', responsable: 'Dan + VP SAC', criterio: 'Llamada realizada esta semana. Queda escrito qué parte piensa resolver por dentro y qué parte no.' },
    { accion: 'Exportar y entregar el reporte de tráfico de los 26 DIDs dados de baja — como valor, no como reproche', responsable: 'Daniel M.', criterio: 'Reporte entregado al cliente el mismo día de la llamada' },
    { accion: 'NO mencionar el cobro del Voicebot: se dio de baja a finales de septiembre. La posición interna que hay que definir es sobre CP Chat ($4,200/mes sin uso documentado)', responsable: 'Dirección + Dan', criterio: 'Posición sobre CP Chat definida ANTES de la llamada. Cero menciones al Voicebot.' },
    { accion: 'Agendar la sesión de asesoría técnica con Luis Carlos Y Cristian en la convocatoria. Sin Luis Carlos, reagendar', responsable: 'Dan + Comercial', criterio: 'Fecha confirmada en la misma llamada. Seis meses de espera no admiten otra ronda de definiciones internas.' },
    { accion: 'Comunicar y guiar la liberación de los 2 números WA atrapados en API externa (523314545205 y 523315798431)', responsable: 'Técnico / Daniel M.', criterio: 'Cliente informado de qué tiene que hacer y quién lo hace de su lado' },
    { accion: 'Registrar a Luis Carlos Hernández Espinosa como contacto técnico de la cuenta, con correo y teléfono. No registrar al «Presidente Ejecutivo» ni al COO que lista el documento hasta confirmarlos', responsable: 'Dan', criterio: 'Luis Carlos en la ficha antes de la sesión. Los otros dos, confirmados o descartados por escrito.' },
  ],
  plan_mediano: [
    { accion: 'Entregar propuesta AV que responda las 8 fallas punto a punto, con scope, horas y costo — y que compita de frente con el desarrollo interno del cliente', responsable: 'Ingeniería + Comercial', criterio: 'Propuesta entregada en la sesión. Si el cliente ya lo resolvió por dentro, se dice y se cambia de objetivo.' },
    { accion: 'Verificar si los 12 agentes de CP Chat tienen uso activo y resolver los $4,200/mes', responsable: 'Daniel M. / Técnico', criterio: 'Situación resuelta antes de que el cliente la detecte' },
    { accion: 'Corregir el campo `facturacion` de la cartera: dice $12,982 y el Gross Revenue dice $23,480', responsable: 'SAC / Datos', criterio: 'Campo alineado al GRC o retirado de la vista' },
    { accion: 'Investigar qué pasó con SOMNOX y sus 9 DIDs cancelados con tráfico real por encima del 88% de atención', responsable: 'Dan', criterio: 'Diagnóstico escrito: migrada, cerrada o reconvertible. Compartido con Dirección.' },
  ],
  plan_estrategico: [
    { accion: 'Levantar una alerta de cliente por contracción sostenida: once meses a la baja y un MRR que cayó $4,030 sin que ninguna alerta se disparara', responsable: 'VP SAC', criterio: 'La condición queda en el motor de alertas, no en este documento' },
    { accion: 'Proponer el AV de voz para cobertura nocturna y dominical: 498 llamadas médicas perdidas de noche, 17.3% de pérdida en domingo, y el autoservicio no descuenta minutos del plan', responsable: 'SAC + Producto', criterio: 'Propuesta entregada post-sesión, con la tasa de pérdida nocturna como métrica de cierre' },
    { accion: 'Cadencia mensual de revisión de cuenta — pasar de reactivo a consultivo en las cuentas AAA', responsable: 'VP SAC', criterio: 'Primer review mensual agendado dentro del mes' },
  ],
  areas_oportunidad: [
    { area: 'AV de chat como agente comercial completo (BD + stock + CRM)',   impacto: 'Es la única expansión grande que queda, y está en disputa con el desarrollo interno del cliente. Hay que ganarla, no esperarla.', responsable: 'Ingeniería + SAC' },
    { area: 'Cobertura nocturna y dominical con AV de voz',                   impacto: '498 llamadas médicas nocturnas perdidas + 17.3% de pérdida dominical = caso de negocio cuantificable y propio, que no depende de la ingeniería en disputa.', responsable: 'Producto + SAC' },
    { area: 'SOMNOX como cuenta separada',                                    impacto: 'Si no migró definitivamente: 9 DIDs, cinco ciudades y España. Primero hay que averiguar si existe todavía.', responsable: 'Ventas + Dan' },
    { area: 'Detección de contracción sostenida',                             impacto: 'Once meses de caída y una baja de $4,030/mes sin una sola alerta. Esta cuenta es el caso que justifica la condición en el motor.', responsable: 'VP SAC' },
  ],

  perfiles: [
    {
      nombre: 'Ing. Cristian López', rol: 'Cliente (Salud y Hogar) — Gerente TI / Sistemas · Contacto operativo principal', color: '#3b82f6',
      campos: [
        { label: 'Correo',             value: 'gerencia.sistemas@cgsi.com.mx' },
        { label: 'Rol en el caso',     value: 'Abrió ambos tickets del AV y las dos incidencias de noviembre. Autoriza la inversión técnica.' },
        { label: 'Motivación',         value: 'Resolver el AV. Lleva seis meses esperando y mientras tanto su empresa construye la alternativa por dentro.' },
        { label: 'Lo último que hizo', value: 'Noviembre 2026: reportó dos incidencias de configuración; la de llamadas desviadas a buzón quedó resuelta por soporte.' },
        { label: 'Clave de gestión',   value: 'Llamar por teléfono directo, no por ticket. Llevar el reporte de tráfico de los DIDs dados de baja. Y preguntar por el desarrollo propio: es la pregunta que decide la cuenta.' },
      ],
    },
    {
      nombre: 'Luis Carlos Hernández Espinosa', rol: 'Cliente (Salud y Hogar) — Implementador técnico AV (autodidacta) · CRÍTICO', color: '#ef4444',
      campos: [
        { label: 'Rol real',           value: 'Configuró y mantiene el AV de chat. Conoce cada una de las 8 fallas que documentó.' },
        { label: 'Riesgo',             value: 'Sigue sin estar registrado como contacto de la cuenta, seis meses después de que la v1.0 lo señalara. Sin él ninguna sesión técnica avanza.' },
        { label: 'Cumplimiento',       value: 'Entregó su reporte de 7 páginas el 6 de mayo — cumplió su compromiso del 29 de abril. Callpicker no cumplió ninguno de los cuatro suyos.' },
        { label: 'Instrucción clave',  value: 'TODA sesión de asesoría debe incluirlo explícitamente en la convocatoria. Si él está construyendo el desarrollo propio, es también quien sabe cuánto ya no nos necesita.' },
      ],
    },
    {
      nombre: 'Héctor A. Hernández Mejía', rol: 'Cliente (Salud y Hogar) — Director General · Titular de la cuenta', color: '#f59e0b',
      campos: [
        { label: 'Teléfono',           value: '3322693333' },
        { label: 'Correo',             value: 'sistemas.ti@cgsi.com.mx' },
        { label: 'Posición',           value: 'Titular de la cuenta. Solo se involucra si la situación escala a nivel directivo.' },
        { label: 'Recomendación',      value: 'No involucrar hasta que el caso esté resuelto operativamente. Usarlo solo para formalizar un contrato de expansión.' },
      ],
    },
    {
      nombre: 'Dos contactos SIN CONFIRMAR', rol: 'Los lista el documento entregado; nuestras fuentes no los respaldan', color: '#8b5cf6',
      campos: [
        { label: 'Qué dice el documento', value: 'José Eduardo López Delgadillo como «Presidente Ejecutivo · máxima autoridad · DID directo en plataforma», y Santiago Arriaga como COO.' },
        { label: 'Qué dicen las fuentes', value: 'Ninguno aparece en los contactos de la cuenta. En los DIDs del CID 946 hay dos etiquetas, «Eduardo López - Directo» y «Casa Eduardo», pero la etiqueta de un DID es nuestra, no el cargo de nadie. Y la v1.0 de este mismo expediente usa «Eduardo» para ingeniería de CALLPICKER.' },
        { label: 'Por qué no se registran', value: 'Un contacto del lado equivocado es peor que un hueco: ya pasó en este proyecto, con un «Daniel Martínez» que era nuestro y figuraba como decisor del cliente. Se confirman con Cristian antes de registrarlos.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Clasificación AAA en el Gross Revenue, con «MRR estable» en el corte vigente',
      '9 años de relación · 119 meses facturados · $1,604,239 acumulados',
      'Pagador puntual — Stripe activo, cero incidencias de pago, cuenta al corriente',
      'El Soft Suspend que la v1.0 daba por inevitable NUNCA ocurrió',
      'AV de chat en crecimiento: 3,057 eventos de autoservicio, máximo histórico en octubre (423)',
      'Cliente técnicamente maduro — documentó 8 fallas del AV en 7 páginas',
      '78.7% de atención sobre 35,743 llamadas — la operación telefónica funciona',
      'Consumo del plan al 72.2% sobre meses completos: bien calibrado, sin excedentes',
    ],
    oportunidades: [
      '498 llamadas médicas nocturnas perdidas + 17.3% de pérdida dominical = caso de negocio para AV de voz 24/7, y no depende de la ingeniería en disputa',
      'El autoservicio del AV no descuenta minutos del plan: la cobertura extra sale gratis al cliente',
      'Las 8 fallas están documentadas con detalle técnico: el scope del proyecto ya está escrito por el cliente',
      'Integración de stock/BD como ingeniería cotizable ($15,000–$25,000), SI el cliente no la resolvió ya por dentro',
      'SOMNOX: posible cuenta separada con 9 DIDs, cinco ciudades y España — si todavía existe',
      'El KAM ya declaró en noviembre la próxima acción correcta: reunión de seguimiento con Cristian',
    ],
    debilidades: [
      'Once meses consecutivos de contracción: −39% de enero a octubre, sin detectar a tiempo',
      'El MRR cayó de $27,510 a $23,480 (−$4,030/mes) sin que ninguna alerta se levantara',
      '$4,200/mes en CP Chat (12 agentes) sin evidencia de uso documentada — y sigue vivo en la lista de servicios',
      'Las 8 fallas del AV que el cliente documentó el 6 de mayo siguen las 8 abiertas',
      'Sesión de asesoría técnica sin fecha desde hace seis meses',
      'Luis Carlos sigue sin estar registrado como contacto, seis meses después de señalarlo',
      '26 DIDs con tráfico activo dados de baja sin análisis previo (15,665 llamadas, 85% de atención)',
      'El campo `facturacion` de la cartera dice $12,982 contra los $23,480 del Gross Revenue',
    ],
    amenazas: [
      'EL CLIENTE ESTÁ CONSTRUYENDO SU PROPIO DESARROLLO — lo dice la bitácora del KAM del 30 de septiembre, y por eso dio de baja el AV',
      'La sustitución es por partes, no de golpe: el AV ya se fue, y nada dice que sea la última',
      'SOMNOX posiblemente ya migrado a otra plataforma (9 DIDs cancelados con más del 88% de atención)',
      'Percepción de cobro por servicio no entregado: $4,200/mes de CP Chat',
      '2 números WA atrapados en API externa — operación del cliente posiblemente afectada sin que él sepa por qué',
      'Seis meses de silencio técnico frente a un cliente que documentó todo con nombre, fecha y detalle',
      'Sin una fecha de corte que fuerce la conversación, la erosión no tiene freno automático',
    ],
  },

  conclusion: 'La auditoría de junio pronosticaba una cancelación en diez días hábiles y se equivocó: la cuenta sigue activa, al corriente y clasificada AAA cinco meses después. Lo que sí pasó es peor de diagnosticar y más difícil de revertir. El cliente dejó de esperarnos. Documentó 8 fallas el 6 de mayo, no recibió respuesta técnica en seis meses, y a finales de septiembre pidió la baja del Agente Virtual porque está construyendo su propio desarrollo: $4,030/mes menos, sin una sola alerta. El canal telefónico lleva once meses cayendo, −39% de enero a octubre. Y el único indicador que crece en toda la cuenta es el AV de chat, que es justo lo que el cliente está aprendiendo a hacerse solo.\n\nNo se pierde por insatisfacción declarada ni por precio: se pierde por partes, cada vez que su desarrollo interno cubre una función que nos pagaba. La conversación pendiente no es de retención: es averiguar cuánto de su operación piensa resolver por dentro, y pelear la ingeniería del AV de frente, con una propuesta que responda las 8 fallas punto a punto. Eso lleva seis meses de retraso y es lo único que falta.',

  pierde: [
    '$23,480/mes de MRR vigente, clasificación AAA, y la relación más larga del portafolio de Dan',
    '9 años y 119 meses de permanencia — un referente de retención en la cartera',
    'El proyecto de ingeniería del AV ($15,000–$25,000) y con él el único camino de expansión que queda',
    'SOMNOX como cuenta separada con potencial internacional (España), si todavía existe',
    'La confianza de Luis Carlos — el técnico que documentó todo, cumplió su compromiso y hoy construye la alternativa',
  ],
  gana: [
    'Retención de los $23,480/mes y la posibilidad de recuperar lo que bajó en septiembre',
    'El proyecto de ingeniería del AV ganado DE FRENTE a un desarrollo interno, que es un caso de venta mucho más fuerte que uno sin competencia',
    'Cobertura nocturna y dominical: pacientes atendidos en los horarios donde hoy se pierden 498 llamadas',
    'Una condición de alerta por contracción sostenida que esta cuenta demuestra que falta',
    'El caso de cómo responderle a un cliente que entrega 8 fallas en 7 páginas — antes de que se las resuelva él',
  ],
  recomendacion_central: 'Esta semana: llamada telefónica directa a Cristian con el reporte de tráfico de los 26 DIDs en la mano, y una sola pregunta de fondo — qué alcance tiene su desarrollo propio y qué parte piensa resolver por dentro. Cero menciones al cobro del Voicebot: se dio de baja en septiembre, y levantarlo convierte una gestión de retención en una discusión sobre un cargo inexistente. La posición interna que hay que definir antes de llamar es la de CP Chat, $4,200/mes sin uso documentado. En la misma llamada, fecha de la sesión técnica con Luis Carlos en la convocatoria. Dentro del mes: la propuesta del AV respondiendo las 8 fallas punto a punto, compitiendo de frente con el desarrollo interno. Y el MRR que se cita en cualquier conversación es $23,480, el del Gross Revenue — nunca los $32,026 de junio.',

  documentos: [
    {
      nombre:      'Salud y Hogar · Auditoría Forense Integral — Actualización 17 nov 2026',
      ruta:        '/auditorias/Salud_y_Hogar_Auditoria_Forense_2026-11-17.html',
      descripcion:
        'Reporte completo e interactivo del corte del 17 nov 2026 sobre 35,743 llamadas del CID 946 ' +
        '(1 ene – 17 nov 2026, noviembre parcial y rotulado como tal), con el desglose por hora y por ' +
        'día de la semana, la evolución del autoservicio del AV, la política de contabilización de ' +
        'minutos, el tráfico de los DIDs dados de baja, las 8 fallas del AV documentadas por el ' +
        'cliente, el FODA, los 12 hallazgos, el plan de acción, los tres escenarios y el guion de la ' +
        'llamada con Cristian. ' +
        'LLEVA DENTRO LA NOTA DE CONCILIACIÓN: seis correcciones aplicadas antes de publicarlo —el MRR ' +
        'de junio, el Voicebot ya dado de baja, el −68% medido contra un mes de 17 días, el promedio de ' +
        'minutos, dos repartos que no cierran y dos conteos que se contradecían—, cada una marcada ' +
        'también en el sitio donde aparece la cifra. Se recalcula con ' +
        'scripts/concilia-auditoria-salud-y-hogar.py.',
    },
  ],
}
