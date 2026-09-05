import type { AuditoriaCase } from './types'

/**
 * Fuente: "Analisis_Cuenta_TecMonterrey_U4P.docx"
 * Fecha de corte: 4 de septiembre de 2026.
 *
 * NOTA METODOLÓGICA — se conserva íntegra del documento original.
 * El análisis se construyó con TRES fuentes: (1) historial del canal de Slack
 * #tec-de-mty (oct-2024 a la fecha), (2) captura de facturación de la cuenta
 * "University 4 People", (3) minuta de la reunión interna del 4-sep-2026.
 * NO hubo acceso a CDR, al contrato firmado, a Zoho Desk ni a un SLA formal.
 *
 * Cada hallazgo conserva su etiqueta de confianza:
 *   [VERIFICADO]           sustentado en texto explícito de las fuentes.
 *   [HIPÓTESIS]            inferencia razonable, NO confirmada por evidencia directa.
 *   [VACÍO / A CONFIRMAR]  dato ausente, contradictorio o que requiere validación
 *                          antes de usarse frente al cliente o a dirección.
 *
 * Estas etiquetas NO deben eliminarse al citar el caso: la §9 del documento deja
 * 5 preguntas abiertas cuya respuesta cambia lo que puede afirmarse hacia afuera.
 */
export const UNIVERSITY_4_PEOPLE: AuditoriaCase = {
  id:                    'university-4-people',
  asesor:                'Dan',
  nombre:                'University 4 People (Tec de Monterrey)',
  sector:                'Educación superior — Educación Continua / institución educativa privada',
  fecha_periodo:         'Octubre 2024 – 4 Septiembre 2026',
  fecha_auditoria:       'Sep 2026',
  tipo_cliente:          'Enterprise · Clasificación LTV 1-VIP · integración a la medida con Salesforce',
  descripcion_contexto:  'CID 180839 · Consecutivo D58 · Análisis de cuenta con etiquetas de confianza · Asesor SAC: Dan Domínguez · Ejecutivo de venta: José Galván',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'MRR reportado',              value: '$58,975 MXN',   color: '#6366f1' },
    { label: 'Acumulado recaudado',        value: '$648,720 MXN',  color: '#22c55e' },
    { label: 'Frentes técnicos abiertos',  value: '4',             color: '#ef4444' },
    { label: 'Causa raíz OAuth',           value: 'Sin confirmar', color: '#f59e0b' },
  ],

  resumen_ejecutivo:
    'Cuenta Enterprise con clasificación LTV 1-VIP, MRR cercano a $59K MXN y acumulado recaudado de $648,720 MXN. El proyecto es una integración de click-to-call entre Salesforce (nube del cliente) y Callpicker mediante una extensión de Chrome desarrollada a la medida, con ofuscación de Caller ID: las llamadas salen con el número celular del asesor, no con un DID de Callpicker.\n\n' +
    'El desarrollo se entregó formalmente y pasó a producción entre agosto y septiembre de 2026, pero la estabilización post-lanzamiento está siendo accidentada: fallas recurrentes de token OAuth con Salesforce (HTTP 401), registros duplicados/faltantes de llamadas en el CRM, y problemas de conectividad SIP para asesores en home-office. El 4 de septiembre de 2026 el equipo interno de Callpicker se reunió para ordenar el diagnóstico —sin causa raíz confirmada todavía— y decidió replicar el formato de bitácora de incidentes que se usa para Grupo 2711.\n\n' +
    'Lectura del análisis: esta es una cuenta VIP en una ventana de riesgo real. NO es todavía una cuenta en crisis de cancelación como Kombitec o SAMALAB, pero tiene los mismos ingredientes tempranos: problemas técnicos no resueltos, ambigüedad sobre si la causa es de Callpicker o del entorno del cliente, y un cliente institucional con procesos de gobierno de TI estrictos que puede escalar internamente si no ve avance rápido.\n\n' +
    '⚠ ADVERTENCIA DE USO: el documento fuente deja 5 preguntas abiertas (ver Conclusión) y marca cada hallazgo con su nivel de evidencia. Nada etiquetado [HIPÓTESIS] o [VACÍO / A CONFIRMAR] debe presentarse al cliente ni a dirección como hecho establecido.',

  resultado_positivo:
    'El pase a producción se ejecutó sin incidentes mayores pese a hacerse fuera de horario (lunes 6pm) y con disponibilidad limitada del equipo —se resolvió con David Avilés como respaldo. ' +
    'La entrega formal se cumplió conforme a los lineamientos de gobierno de TI del cliente: código fuente en el GitHub institucional del Tec, calificación mínima "A" en SonarQube for Cloud y cero issues abiertos en Dependabot, más manual de usuario, manual técnico y diagrama de arquitectura entregados vía Outline/SharePoint. ' +
    'El equipo de desarrollo tiene trazabilidad real del incidente OAuth: revisión de logs con la secuencia exacta de renovación de tokens, y dos parches previos ya documentados. ' +
    'Y la reunión del 4-sep produjo una decisión de método correcta —adoptar la bitácora de incidentes formato Grupo 2711— con 8 acciones repartidas y responsables nombrados.',

  hallazgos: [
    '[HIPÓTESIS] "Meses Activo: 11" no cuadra con la cronología de Slack, que arranca en oct-2024 (~23 meses) con fases de pausa por presupuesto y reactivación. Es probable que el campo cuente desde el inicio de facturación, no desde el primer contacto comercial —lo que ubicaría el arranque de cobro entre oct-2025 y nov-2025. Confirmar la fecha exacta antes de reportar antigüedad de cuenta.',
    '[VERIFICADO] El MRR ($58,975) está 9.1% por encima de la factura mensual ($54,060). Ambas cifras aparecen en el dashboard sin recálculo; el documento NO determina cuál es la recurrente real —es una de las 5 preguntas abiertas.',
    '[VERIFICADO] Error HTTP 401 "INVALID_AUTH_HEADER" contra la API de Salesforce, reproducido al menos dos veces documentadas (2 y 3 de septiembre, ~13:05–19:55h). El access token se renovó bien al primer intento; al segundo Salesforce no devolvió refresh token; al tercero ya no fue posible renovar.',
    '[VERIFICADO] Un usuario del cliente (Mario - 601, Tec) reporta que "lo ajustaron para que se actualice cada año" — el propio cliente reconoce haber tocado configuración de rotación de tokens, aunque sin admitir vínculo con la falla.',
    '[VERIFICADO] Ya se aplicaron DOS parches previos fuera del alcance original para mitigar este comportamiento: recuperar el refresh token en cada renovación de access token, y manejo de rotación forzada por política de Salesforce.',
    '[HIPÓTESIS] Causa más probable del 401: una política de seguridad de Salesforce del lado del cliente (rotación de tokens / restricción de IP / límite de tokens activos por usuario), no un defecto de la plataforma Callpicker. Consistente con el patrón: mismo error, mismo tipo de sesión, ocurre en producción pero no en Sandbox/UAT.',
    '[VERIFICADO] Los registros duplicados/triplicados afectan solo a ~3 usuarios específicos, no a toda la base. Desarrollo lo usa como evidencia de que no es un bug sistémico: "si fuera error de nosotros como desarrollo, le ocurriría a todos los usuarios".',
    '[HIPÓTESIS] Paola Bárcenas y Mario Hernández cuestionaron abiertamente en la reunión del 4-sep la explicación de "doble clic humano" —dicen que "no se ve real" que se den varios clics. El equipo interno NO tiene consenso sobre la causa, pese a que la comunicación hacia el cliente ya se dio como explicación cerrada. Hay riesgo de contradecirse si el cliente presiona con más evidencia.',
    '[VERIFICADO] Lista de ~10 asesores (compartida por Blanca) cuyas interacciones NO se registran en Salesforce — ticket #114553, en investigación por Mario Hernández y Pablo Soto.',
    '[VERIFICADO] Limitación estructural de diseño, reconocida desde el inicio y NO una falla: si el destinatario no contesta y devuelve la llamada, ésta entra directo al celular del asesor sin pasar por Callpicker, y por tanto no genera registro.',
    '[VERIFICADO] El área de Arquitectura del Tec cuestionó el proyecto por permisos "api_enabled" que exponen información de accesos, almacenamiento en base de datos externa, y la solución operando en n8n expuesta como extensión de Chrome. David Avilés valida que la objeción "puede que tenga un motivo válido".',
    '[VACÍO / A CONFIRMAR] No hay evidencia de que esa objeción de Arquitectura se haya cerrado formalmente (memo de mitigación o aceptación explícita). Si el proyecto ya opera en producción es probable que se resolviera, pero no está documentado.',
    '[VACÍO / A CONFIRMAR] No se localizó el contrato firmado ni el documento de alcance final —solo referencias en el chat. Debe localizarse ANTES de cualquier discusión de "fuera de alcance" con el cliente, porque ya ha sido invocado varias veces.',
    '[VERIFICADO] Total contratado: 90 horas, por encima de las 56 de desarrollo + 16 de pruebas estimadas originalmente —presumiblemente por el ajuste de logging y otros extras.',
    '[VERIFICADO] El cliente exige atención vía Teams por política interna (no permite WhatsApp con proveedores), lo que choca con el estándar de soporte de Callpicker. Toño instruyó explícitamente no dar soporte por Teams.',
  ],

  cronologia: [
    { fecha: '30 Oct 2024',        responsable: 'Toño del Río',              evento: '[VERIFICADO] Se crea el canal #tec-de-mty. Toño comparte un audio de Paola Olvera (WhatsApp) pidiendo dar seguimiento a un requerimiento del cliente.', tipo: 'neutral' },
    { fecha: 'Oct 2024',           responsable: 'Cliente (Tec)',             evento: '[VERIFICADO] Requerimiento original: el cliente NO quería "Callpicker como tal", sino un plugin de navegador para marcar desde Salesforce conservando el celular de cada asesor como Caller ID ("ofuscador").', tipo: 'neutral' },
    { fecha: 'Nov 2024',           responsable: 'Daniel Martínez Loyola',    evento: '[VERIFICADO] Aclara que sin involucrar la plataforma Callpicker de fondo no es viable — se requiere ingeniería para evaluar una implementación híbrida.', tipo: 'pivote' },
    { fecha: 'Nov – Dic 2024',     responsable: 'José Galván / Ricardo Cacique', evento: '[VERIFICADO] José Galván (comercial/PM) toma la relación con Paola Olvera. Ricardo Cacique plantea la solución viable: asignar un número por asesor y forzar el Caller ID del celular vía base de datos.', tipo: 'ok' },
    { fecha: 'Dic 2024 – Ene 2025',responsable: 'Comercial Callpicker',      evento: '[VERIFICADO] Alcance inicial: 170 usuarios, ofuscador por usuario, renta mensual con y sin plazo, plan de pago anual. Estimado confirmado por Ricardo Cacique: 56 h de desarrollo + 16 h de pruebas.', tipo: 'ok' },
    { fecha: '2025',               responsable: 'Cliente (Tec)',             evento: '[VERIFICADO] El proyecto se detiene: "optaron por NO avanzar con el proyecto por temas presupuestarios" (José Galván).', tipo: 'problema' },
    { fecha: '2025 (posterior)',   responsable: 'José Galván',               evento: '[VERIFICADO] Se reactiva con el mismo alcance. El cliente expresa además interés en soluciones de IA de Callpicker (sin evidencia de seguimiento en las fuentes).', tipo: 'pivote' },
    { fecha: '2026',               responsable: 'Edgar / Yadira (Tec)',      evento: '[VERIFICADO] Revisión de contrato con 3 puntos críticos: (a) el Tec es dueño del código de la extensión —Callpicker entrega fuente y documentación, mantenimiento futuro NO incluido salvo cotización aparte; (b) el resumen automatizado de llamadas tiene costo extra; (c) NO es integración SAML 2.0 nativa, la extensión aprovecha la sesión activa de Salesforce.', tipo: 'neutral' },
    { fecha: '2026',               responsable: 'David Avilés',              evento: '[VERIFICADO] Advierte internamente sobre el riesgo de que el cliente asuma que "cualquier cosa que ocurra a futuro" será resuelta gratis. Deja explícito que la entrega es única, sin mantenimiento continuo.', tipo: 'problema' },
    { fecha: '2026',               responsable: 'Gobierno TI del Tec',       evento: '[VERIFICADO] El cliente exige que el código cumpla sus lineamientos: repositorio en GitHub institucional, calificación mínima "A" en SonarQube for Cloud y cero issues abiertos en Dependabot al momento de la entrega.', tipo: 'neutral' },
    { fecha: '2026',               responsable: 'Callpicker (interno)',      evento: '[VERIFICADO] Total contratado queda en 90 horas. [VACÍO / A CONFIRMAR] No se localiza el contrato firmado ni el documento de alcance final.', tipo: 'problema' },
    { fecha: '2026',               responsable: 'Desarrollo Callpicker',     evento: '[VERIFICADO] Flujo funcional final: clic en teléfono en Salesforce → llamada al celular del asesor vía Callpicker → enlace con el destinatario, que ve el Caller ID del celular del asesor. Se genera registro en Salesforce con estatus, fecha, hora, duración y extensión.', tipo: 'ok' },
    { fecha: '2026',               responsable: 'David Avilés',              evento: '[VERIFICADO] Entrega formal: código en el GitHub institucional del Tec y documentación vía Outline/SharePoint. Constancia expresa: "la entrega de la extensión es entrega única, no es un servicio del que nos encarguemos de hacer actualizaciones ni mantenimiento".', tipo: 'ok' },
    { fecha: '2026',               responsable: 'Cliente / Callpicker',      evento: '[VERIFICADO] Fricción por el diagrama de arquitectura: el cliente pidió más detalle sobre servidores e IPs; Callpicker se negó por seguridad y complementó con un esquema por capas.', tipo: 'problema' },
    { fecha: 'Jul – Ago 2026',     responsable: 'David Avilés',              evento: '[VERIFICADO] Fricción recurrente de ambientes: el cliente pide probar en UAT en paralelo a producción. No es posible con la arquitectura actual —ambos ambientes apuntarían al mismo Client ID/Secret (mismo CID) y activar UAT tira producción. La única solución es una segunda cuenta Callpicker: fuera de alcance, requiere cotización nueva.', tipo: 'problema' },
    { fecha: 'Ago 2026 (lunes 6pm)', responsable: 'David Avilés (respaldo)', evento: '[VERIFICADO] Pase a producción fuera de horario de oficina, con disponibilidad limitada del equipo (José en cita médica). Salió sin incidentes mayores según los mensajes de esa sesión.', tipo: 'ok' },
    { fecha: '2 – 3 Sep 2026',     responsable: 'José Abraham Raymundo García', evento: '[VERIFICADO] Error HTTP 401 "INVALID_AUTH_HEADER" reproducido dos veces (~13:05–19:55h). Logs: token renovado al primer intento, sin refresh token en el segundo, imposible renovar en el tercero. Conclusión del equipo: algo del lado de Salesforce del cliente fuerza renovaciones con frecuencia anómala.', tipo: 'problema' },
    { fecha: 'Sep 2026',           responsable: 'Blanca Mata / Mario Hernández / Pablo Soto', evento: '[VERIFICADO] Lista de ~10 asesores cuyas interacciones no se registran en Salesforce — ticket #114553, en investigación.', tipo: 'problema' },
    { fecha: '4 Sep 2026',         responsable: 'Reunión interna Callpicker', evento: '[VERIFICADO] Se decide concentrar el análisis en los casos de ESTA semana y adoptar el formato de bitácora de incidentes de Grupo 2711 (un caso por renglón). Se reparten 8 acciones entre Dan Domínguez, David Avilés, Daniel Martínez y Mario Hernández.', tipo: 'pivote' },
    { fecha: '4 Sep 2026',         responsable: 'Callpicker / Cliente',      evento: '[VERIFICADO] Pendiente crítico: la sesión conjunta de diagnóstico de 1 hora con Blanca y Aarón (administrador de Salesforce del cliente) sigue SIN fecha confirmada al cierre de la reunión.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social',            value: 'University 4 People' },
    { label: 'Identificación completa', value: 'Tecnológico de Monterrey — Educación Continua / "University 4 People (U4P)"' },
    { label: 'CID Zoho',                value: '180839' },
    { label: 'Consecutivo',             value: 'D58' },
    { label: 'Segmento',                value: 'Enterprise · Clasificación LTV 1 - VIP' },
    { label: 'Factura mensual',         value: '$54,060 MXN' },
    { label: 'MRR',                     value: '$58,975 MXN — ⚠ 9.1% por encima de la factura mensual' },
    { label: 'Acumulado recaudado',     value: '$648,720 MXN' },
    { label: 'Semáforo',                value: '0 - Factura Futura — ⚠ requiere confirmar significado exacto' },
    { label: 'Meses activo',            value: '11 — ⚠ no concuerda con la cronología de Slack (~23 meses desde oct-2024)' },
    { label: 'Última factura',          value: '01 marzo 2027 — ⚠ fecha futura respecto al corte del análisis' },
    { label: 'Contacto principal',      value: 'Blanca Ofelia Mata Villanueva — blancamata@tec.mx · 442 395 9259' },
    { label: 'Contacto técnico (cliente)', value: 'Aarón — administrador de Salesforce del Tec (sesión de diagnóstico pendiente de agendar)' },
    { label: 'Contacto original',       value: 'Paola Olvera (relación inicial, oct-2024)' },
    { label: 'Ejecutivo de venta',      value: 'José Galván (comercial / PM del proyecto)' },
    { label: 'Asesor SAC',              value: 'Dan Domínguez' },
    { label: 'Solución en uso',         value: 'Extensión de Chrome a la medida: click-to-call Salesforce → Callpicker con ofuscación de Caller ID (celular del asesor) · registro de llamada en Salesforce' },
    { label: 'Alcance contratado',      value: '90 horas (originalmente 56 h desarrollo + 16 h pruebas) · 170 usuarios · propiedad del código: el Tec' },
    { label: 'Ambientes del cliente',   value: '3 ambientes de Salesforce (Sandbox, UAT, Producción) con usuarios y permisos distintos' },
    { label: 'Canal exigido por el cliente', value: 'Microsoft Teams — política interna que no permite WhatsApp con proveedores' },
  ],

  necesidad_negocio:
    'El Tec de Monterrey / U4P necesita que su fuerza de Educación Continua marque desde Salesforce con un solo clic, conservando el número celular del asesor como identificador de llamada, y que cada interacción quede registrada en el CRM con estatus, fecha, hora, duración y extensión. ' +
    'La necesidad NO era una plataforma de telefonía: era un plugin de navegador. Callpicker determinó que sin la plataforma de fondo no era viable y construyó una solución híbrida a la medida. ' +
    'Eso define el perfil real de la cuenta: es un cliente de integración, no de producto estándar, con gobierno de TI formal (GitHub institucional, SonarQube, Dependabot, tres ambientes) y con un área de Arquitectura que ya emitió objeciones de seguridad. ' +
    'Hoy la necesidad inmediata no es funcionalidad nueva sino estabilidad: que la autenticación no se caiga, que los registros no se dupliquen ni se pierdan, y que los asesores en home-office conecten al primer clic.',

  potencial_corto: [
    'Cerrar la sesión de diagnóstico conjunto de 1 hora con Blanca + Aarón (admin. Salesforce del cliente) — el único paso que puede confirmar o descartar la hipótesis de política de rotación de tokens/IP.',
    'Localizar el contrato firmado y el documento de alcance de 90 horas antes de la próxima conversación de "fuera de alcance".',
    'Cerrar el ticket #114553 (~10 asesores sin registro de interacciones en Salesforce).',
    'Actualizar a Callpicker versión 3.20.6 en los equipos de los asesores, para poder editar los parámetros de conexión que recomienda el diagnóstico de Pablo Soto.',
    'Asegurar acceso persistente y verificado de Dan Domínguez al canal de Teams del cliente.',
  ],

  potencial_largo: [
    'Segunda cuenta Callpicker para el ambiente UAT — hoy identificada como fuera de alcance y con cotización nueva; es una necesidad real y recurrente del cliente, no un capricho.',
    'Contrato de mantenimiento/soporte de la extensión: la entrega actual es única y sin mantenimiento; el propio equipo advierte que el cliente puede asumir lo contrario. Formalizarlo convierte un riesgo en ingreso.',
    'Soluciones de IA de Callpicker — el cliente expresó interés durante la reactivación de 2025, sin evidencia de seguimiento posterior en las fuentes.',
    'Mensajes personalizados de ocupado / no contesta — identificado como fuera de alcance; cotizable.',
    'Bloqueo de clics repetidos: propuesto pero NO recomendado por Callpicker (costo, nuevo paso por SonarQube/Dependabot y reinstalación de la extensión a todos los asesores). Solo si la capacitación no resuelve el patrón.',
  ],

  tacticas: [
    { nombre: 'Sesión de diagnóstico conjunto (Blanca + Aarón)', descripcion: 'Una hora con el administrador de Salesforce del cliente para revisar la política de rotación de tokens, restricción de IP y límite de tokens activos por usuario. Sin esta sesión, todo lo demás es diagnóstico unilateral de Callpicker.', impacto: 'Es el único camino que cierra la causa raíz del 401. Todo el resto es análisis interno sin contraparte.' },
    { nombre: 'Bitácora de incidentes formato Grupo 2711',       descripcion: 'Ya decidida en la reunión del 4-sep. La recomendación del documento es aplicarla desde ahora y de forma permanente, no solo a los "casos de esta semana".', impacto: 'Si el patrón se repite en 30-60 días, hay evidencia acumulada consistente para escalar o para defender el trabajo de Callpicker.' },
    { nombre: 'Recuperación documental del contrato',            descripcion: 'Localizar contrato firmado, alcance de 90 horas y manuales. Ya se invocó "fuera de alcance" varias veces sin poder citarlo con precisión.', impacto: 'Convierte una discusión de memoria del equipo en una discusión con documento — imprescindible con un cliente de gobierno de TI formal.' },
    { nombre: 'Capacitación de asesores antes que desarrollo',   descripcion: 'La postura actual de Callpicker sobre los duplicados es capacitación, no bloqueo de clics. Pero el equipo interno no tiene consenso sobre la causa.', impacto: 'Bajo costo si la causa es humana; alto riesgo de contradicción si el cliente aporta evidencia de que no lo es.' },
    { nombre: 'Estandarización de conectividad de asesores',     descripcion: 'Home-office con Telmex/Megacable, algunos con VPN. WebRTC (dialer.callpicker.com) probado como alternativa al softphone MicroSIP: viable en prueba aislada, sin confirmar compatibilidad con la extensión.', impacto: 'Reduce la intermitencia estructural, pero no la elimina sin control sobre la red del cliente.' },
  ],

  senal_alarma:
    '⚠ El equipo interno de Callpicker NO tiene consenso sobre la causa de los registros duplicados, pero la explicación de "doble clic humano" YA se comunicó hacia afuera como cerrada. Paola Bárcenas y Mario Hernández la cuestionaron abiertamente en la reunión del 4-sep ("no se ve real" que se den varios clics). Existe riesgo concreto de contradecirse si el cliente presiona con más evidencia.\n\n' +
    '⚠ Es una cuenta institucional con visibilidad interna alta: Arquitectura, Infraestructura y Seguridad del Tec ya están al tanto del proyecto. Un problema de producción sin resolver durante semanas se vuelve visible para mucha más gente que en una cuenta PyME.\n\n' +
    '⚠ PRECAUCIÓN DOCUMENTAL: los datos financieros del dashboard tienen tres inconsistencias sin resolver (MRR 9.1% por encima de la factura, "Meses activo 11" contra ~23 meses de cronología, y última factura fechada 01-mar-2027). Ninguno debe usarse en un reporte a dirección sin confirmarse antes con Finanzas.',

  problema_raiz:
    'La cuenta pasó a producción con la causa raíz del incidente crítico sin confirmar y sin contraparte técnica del cliente sentada a la mesa: el diagnóstico de Callpicker es unilateral, la sesión con el administrador de Salesforce sigue sin fecha, y el contrato que delimita el alcance no está localizado.',

  problema_raiz_detalle:
    'Hay tres capas superpuestas y conviene no confundirlas.\n\n' +
    'La primera es técnica y probablemente NO es de Callpicker: la evidencia apunta [HIPÓTESIS] a una política de seguridad de Salesforce del lado del cliente —rotación de tokens, restricción de IP o límite de tokens activos por usuario— porque el error ocurre en producción y no en Sandbox/UAT, y porque el propio usuario del cliente (Mario - 601) reconoce que "lo ajustaron para que se actualice cada año". Callpicker ya aplicó dos parches fuera de alcance para mitigarlo. Pero mientras Aarón no se siente a revisar la configuración real, esto es una hipótesis, no un hallazgo.\n\n' +
    'La segunda es de método: el equipo comunicó una explicación (doble clic) que internamente no está acordada. Eso no es un problema de producto, es un problema de disciplina de comunicación —y con un cliente institucional es exactamente el tipo de cosa que erosiona credibilidad técnica cuando aparece evidencia contraria.\n\n' +
    'La tercera es contractual: el alcance de 90 horas ya se invocó varias veces frente al cliente sin poder citarlo con precisión, hay al menos 3 solicitudes que el cliente sigue planteando como si debieran estar incluidas (bloqueo de doble clic, segunda cuenta para UAT, mensajes personalizados de ocupado/no contesta), y la redacción sobre SSO/SAML 2.0 quedó pendiente de cerrar. Sumado a la advertencia de David Avilés sobre "entrega única sin mantenimiento", el riesgo real no es perder la cuenta hoy: es acumular trabajo no cobrado hasta que la relación se vuelva insostenible.\n\n' +
    'Y hay una cuarta capa fuera del control de Callpicker: los asesores trabajan en home-office con Telmex y Megacable, algunos por VPN. El diagnóstico de Pablo Soto es consistente con renovación de sesión SIP/NAT —al reiniciar la app se re-registra la extensión y se limpian sesiones vencidas o mal asociadas por el router. Ese patrón, como en el caso "Cebra", no se elimina del todo sin estandarizar la conexión del lado del cliente.',

  flujo_real: [
    { fase: 'Marcación',      area: 'Asesor U4P en Salesforce',       accion: 'Da clic en el teléfono dentro de Salesforce (Sales Cloud Lightning, licenciamiento Unlimited).',                     resultado: 'Callpicker llama al celular del asesor y lo enlaza con el destinatario, que ve el Caller ID del celular del asesor.' },
    { fase: 'Registro',       area: 'Extensión de Chrome → Salesforce', accion: 'Se escribe el registro de la llamada con estatus contestada/no contestada, fecha, hora, duración y extensión.',      resultado: 'En ~3 usuarios el registro se duplica o triplica; en ~10 asesores no se registra en absoluto (ticket #114553).' },
    { fase: 'Autenticación',  area: 'OAuth Callpicker ↔ Salesforce',   accion: 'Renovación de access token contra la API de Salesforce.',                                                              resultado: 'HTTP 401 INVALID_AUTH_HEADER: renueva al 1er intento, sin refresh token al 2°, imposible al 3°. Sin causa raíz confirmada.' },
    { fase: 'Devolución',     area: 'Celular del asesor',              accion: 'El destinatario no contesta y devuelve la llamada al número que vio.',                                                 resultado: 'Entra directo al celular sin pasar por Callpicker — sin registro. Limitación de diseño acordada, NO una falla.' },
    { fase: 'Conectividad',   area: 'Home-office (Telmex / Megacable)', accion: 'El asesor marca desde su red doméstica, algunos vía VPN.',                                                             resultado: 'La llamada no conecta al primer clic; reiniciar la app lo resuelve temporalmente (renovación de sesión SIP/NAT).' },
    { fase: 'Pruebas',        area: 'Ambientes del cliente',           accion: 'El cliente pide probar en UAT en paralelo a producción.',                                                              resultado: 'No es posible: mismo Client ID/Secret (mismo CID). Activar UAT tira producción. Requiere segunda cuenta — fuera de alcance.' },
    { fase: 'Escalamiento',   area: 'Callpicker ↔ Cliente',            accion: 'El cliente exige atención por Teams; Callpicker sostiene su canal oficial y Dan no tuvo acceso al canal por semanas.', resultado: 'Dependencia de "triangulación" con David Avilés — el ejecutivo de satisfacción sin visibilidad directa durante parte de la crisis.' },
  ],

  comparativo: [
    { metrica: 'Causa raíz del error 401',            real: '[HIPÓTESIS] política de tokens del cliente — sin confirmar',                    ideal: 'Confirmada o descartada en sesión conjunta con Aarón (admin. Salesforce del cliente)' },
    { metrica: 'Sesión de diagnóstico conjunto',      real: 'Sin fecha confirmada al 4-sep-2026',                                            ideal: '1 hora agendada con Blanca + Aarón, con agenda técnica previa' },
    { metrica: 'Consenso interno sobre duplicados',   real: 'Explicación comunicada al cliente sin acuerdo interno',                          ideal: 'Causa acordada internamente ANTES de comunicarse hacia afuera' },
    { metrica: 'Contrato y alcance de 90 h',          real: 'No localizado — se invoca de memoria del equipo',                                ideal: 'Documento a la mano, citable con precisión en cada discusión de alcance' },
    { metrica: 'Objeción de Arquitectura del cliente',real: 'Sin cierre formal documentado (api_enabled, BD externa, n8n)',                    ideal: 'Memo de mitigación o aceptación explícita por escrito' },
    { metrica: 'Registro de interacciones',           real: '~10 asesores sin registro (#114553) · ~3 con duplicados',                        ideal: 'Registro 1:1 por llamada para toda la base de usuarios' },
    { metrica: 'Canal de soporte',                    real: 'El cliente exige Teams; Callpicker sostiene su canal oficial',                    ideal: 'Canal acordado por escrito, con Dan con acceso persistente y verificado' },
    { metrica: 'Datos financieros del dashboard',     real: 'MRR 9.1% > factura · meses activo 11 vs ~23 · última factura 01-mar-2027',       ideal: 'Cifras conciliadas con Finanzas antes de reportarse a dirección' },
  ],

  plan_inmediato: [
    { accion: 'Agendar y ejecutar la sesión de diagnóstico conjunto de 1 hora con Blanca Mata y Aarón (admin. Salesforce del cliente), con agenda técnica previa sobre rotación de tokens, restricción de IP y límite de tokens activos.', responsable: 'Dan Domínguez / David Avilés', criterio: 'Sesión realizada con la política de seguridad del cliente identificada por escrito.' },
    { accion: 'Localizar el contrato firmado, el documento de alcance de 90 horas y los manuales entregados.',                                                                                                                              responsable: 'Dan Domínguez / José Galván',  criterio: 'Documentos en poder del equipo antes de la próxima conversación de "fuera de alcance".' },
    { accion: 'Abrir la bitácora de incidentes formato Grupo 2711 (un caso por renglón) y cargar en ella los casos de esta semana.',                                                                                                        responsable: 'Mario Hernández',              criterio: 'Bitácora activa con los eventos del 2 y 3 de septiembre ya registrados.' },
    { accion: 'Cerrar el ticket #114553 — ~10 asesores cuyas interacciones no se registran en Salesforce.',                                                                                                                                 responsable: 'Mario Hernández / Pablo Soto', criterio: 'Causa identificada y registro restablecido para la lista completa de Blanca.' },
    { accion: 'Alinear internamente la explicación de los registros duplicados ANTES de volver a comunicarla al cliente.',                                                                                                                  responsable: 'Daniel Martínez / David Avilés', criterio: 'Postura única acordada entre desarrollo y SAC, con la evidencia que la sustenta.' },
    { accion: 'Confirmar el resultado del ajuste al "temporizador" hecho por la desconexión reportada a la 1:00pm.',                                                                                                                        responsable: 'David Avilés',                 criterio: 'Confirmación de éxito o falla documentada en la bitácora.' },
    { accion: 'Crear el directorio de contactos del cliente (Blanca, Aarón, Mario-601, Edgar, Yadira, área de Arquitectura).',                                                                                                              responsable: 'Dan Domínguez',                criterio: 'Directorio compartido con rol y canal de cada contacto.' },
  ],

  plan_mediano: [
    { accion: 'Confirmar con Finanzas el significado real de "Semáforo: 0 - Factura Futura", la fecha de última factura (01-mar-2027) y cuál de las dos cifras —$54,060 o $58,975— es la recurrente real.', responsable: 'Dirección SAC / Finanzas', criterio: 'Cifras conciliadas antes de usarse en cualquier reporte a dirección.' },
    { accion: 'Confirmar la fecha exacta de inicio de facturación para resolver la discrepancia de "Meses activo: 11" contra los ~23 meses de cronología.',                                                  responsable: 'Finanzas',                 criterio: 'Antigüedad de cuenta correcta registrada en el CRM.' },
    { accion: 'Obtener o emitir el cierre formal de la objeción de Arquitectura del cliente sobre permisos api_enabled, almacenamiento en BD externa y operación en n8n.',                                   responsable: 'David Avilés',             criterio: 'Memo de mitigación o aceptación explícita por escrito en el expediente.' },
    { accion: 'Cerrar por escrito con el cliente qué cubre y qué no cubre el contrato de 90 horas, incluyendo la redacción pendiente sobre SSO/SAML 2.0.',                                                   responsable: 'José Galván / Dirección',  criterio: 'Anexo de alcance firmado o correo de confirmación del cliente.' },
    { accion: 'Asegurar acceso persistente y verificado de Dan Domínguez al canal de Teams del cliente, sin depender de solicitudes repetidas.',                                                             responsable: 'Dan Domínguez / José Galván', criterio: 'Acceso activo y verificado, con respaldo nombrado.' },
    { accion: 'Definir la postura formal sobre soporte por Teams: canal oficial, excepciones y responsable, dado el tamaño de la cuenta.',                                                                   responsable: 'Dirección SAC',            criterio: 'Política escrita y comunicada al cliente sin fricción.' },
  ],

  plan_estrategico: [
    { accion: 'Cotizar la segunda cuenta Callpicker para el ambiente UAT del cliente — hoy fuera de alcance, pero es una necesidad recurrente y documentada.',                                          responsable: 'José Galván',          criterio: 'Cotización presentada con alcance y costo explícitos.' },
    { accion: 'Formalizar un contrato de mantenimiento/soporte de la extensión, dado que la entrega actual es única y el cliente puede asumir lo contrario.',                                            responsable: 'Dirección Comercial',  criterio: 'Propuesta entregada antes de que se acumule más trabajo no cobrado.' },
    { accion: 'Retomar el interés del cliente en soluciones de IA de Callpicker, expresado durante la reactivación de 2025 y sin seguimiento documentado.',                                              responsable: 'José Galván / Dan Domínguez', criterio: 'Conversación reabierta una vez estabilizada la operación.' },
    { accion: 'Mantener la bitácora de incidentes de forma permanente, no solo para los "casos de esta semana", para acumular evidencia consistente a 30-60 días.',                                      responsable: 'Dan Domínguez',        criterio: 'Bitácora viva con revisión semanal.' },
    { accion: 'Definir un estándar interno para clientes de integración a la medida con gobierno de TI formal: documentación contractual localizable, contraparte técnica nombrada y canal acordado desde el arranque.', responsable: 'Dirección Callpicker', criterio: 'Estándar incorporado al proceso de proyectos a la medida.' },
  ],

  areas_oportunidad: [
    { area: 'Sesión conjunta con el admin. de Salesforce del cliente', impacto: 'Crítico — es el único paso que cierra la causa raíz del 401; sin él, todo es diagnóstico unilateral.', responsable: 'Dan Domínguez / David Avilés' },
    { area: 'Recuperación del contrato y del alcance de 90 h',         impacto: 'Muy alto — protege contra trabajo no cobrado en al menos 3 solicitudes ya identificadas fuera de alcance.', responsable: 'José Galván' },
    { area: 'Segunda cuenta Callpicker (ambiente UAT)',                impacto: 'Alto — necesidad real y recurrente del cliente, hoy sin cotizar.', responsable: 'Comercial' },
    { area: 'Contrato de mantenimiento de la extensión',               impacto: 'Alto — convierte en ingreso el riesgo que David Avilés ya advirtió internamente.', responsable: 'Dirección Comercial' },
    { area: 'Soluciones de IA',                                        impacto: 'Medio — interés expresado por el cliente en 2025, sin seguimiento documentado.', responsable: 'José Galván / Dan Domínguez' },
    { area: 'Bitácora de incidentes permanente',                       impacto: 'Medio-alto — es la defensa documental de Callpicker si el patrón se repite en 30-60 días.', responsable: 'Dan Domínguez' },
    { area: 'Conciliación de cifras financieras',                      impacto: 'Medio — tres inconsistencias del dashboard bloquean cualquier reporte confiable a dirección.', responsable: 'Finanzas / Dirección SAC' },
  ],

  perfiles: [
    {
      nombre: 'Blanca Ofelia Mata Villanueva',
      rol:    'Contacto principal — University 4 People (Tec de Monterrey)',
      color:  '#0057FF',
      campos: [
        { label: 'Contacto',      value: 'blancamata@tec.mx · 442 395 9259' },
        { label: 'Aporte',        value: 'Compartió la lista de ~10 asesores cuyas interacciones no se registran en Salesforce (ticket #114553).' },
        { label: 'Siguiente paso',value: 'Es la contraparte que debe convocar la sesión de diagnóstico conjunto de 1 hora junto con Aarón.' },
      ],
    },
    {
      nombre: 'Aarón',
      rol:    'Administrador de Salesforce — cliente (Tec)',
      color:  '#ef4444',
      campos: [
        { label: 'Peso',   value: 'Pieza indispensable: solo él puede confirmar qué política de seguridad de Salesforce está activa.' },
        { label: 'Estado', value: '[VACÍO / A CONFIRMAR] La sesión conjunta con él sigue pendiente de agendar al 4-sep-2026.' },
      ],
    },
    {
      nombre: 'Mario - 601',
      rol:    'Usuario del cliente (Tec)',
      color:  '#f59e0b',
      campos: [
        { label: 'Declaración', value: '[VERIFICADO] Reporta que "lo ajustaron para que se actualice cada año" — el cliente reconoce haber tocado la configuración de rotación de tokens.' },
        { label: 'Alcance',     value: 'No admite vínculo directo con la falla; es un indicio, no una confirmación de causa.' },
      ],
    },
    {
      nombre: 'Área de Arquitectura (Tec)',
      rol:    'Gobierno de TI del cliente',
      color:  '#94a3b8',
      campos: [
        { label: 'Objeción', value: 'Permisos "api_enabled" que exponen información de accesos, almacenamiento en base de datos externa y la solución operando en n8n expuesta como extensión de Chrome.' },
        { label: 'Postura de Callpicker', value: 'David Avilés valida que la objeción "puede que tenga un motivo válido" — no la descarta como fricción burocrática.' },
        { label: 'Estado',   value: '[VACÍO / A CONFIRMAR] Sin evidencia de cierre formal en las fuentes disponibles.' },
      ],
    },
    {
      nombre: 'Dan Domínguez',
      rol:    'Asesor SAC — ejecutivo de seguimiento de la cuenta',
      color:  '#22c55e',
      campos: [
        { label: 'Rol',    value: 'Punto de continuidad de la cuenta VIP; responsable de varias de las 8 acciones repartidas el 4-sep.' },
        { label: 'Riesgo', value: '[HIPÓTESIS] Por varias semanas el cliente no le dio acceso al canal de Teams — dependía de triangulación con David Avilés. Debilidad operativa durante parte de la crisis.' },
      ],
    },
    {
      nombre: 'David Avilés',
      rol:    'Ingeniería Callpicker — responsable técnico del proyecto',
      color:  '#6366f1',
      campos: [
        { label: 'Aporte',    value: 'Documentó los dos parches previos de manejo de tokens; explicó la imposibilidad técnica de UAT en paralelo; respaldó el pase a producción fuera de horario.' },
        { label: 'Advertencia', value: 'Dejó constancia expresa de que la entrega de la extensión es única, sin actualizaciones ni mantenimiento incluidos.' },
      ],
    },
    {
      nombre: 'José Galván',
      rol:    'Ejecutivo de venta — comercial / PM del proyecto',
      color:  '#0057FF',
      campos: [
        { label: 'Historia', value: 'Tomó la relación con Paola Olvera en oct-2024; reportó la pausa por presupuesto y gestionó la reactivación.' },
        { label: 'Pendiente',value: 'Cerrar por escrito el alcance de las 90 horas y la redacción sobre SSO/SAML 2.0.' },
      ],
    },
    {
      nombre: 'José Abraham Raymundo García',
      rol:    'Desarrollo Callpicker',
      color:  '#f59e0b',
      campos: [
        { label: 'Aporte', value: 'Revisión de logs del error 401: token renovado al 1er intento, sin refresh token al 2°, imposible renovar al 3°.' },
      ],
    },
    {
      nombre: 'Pablo Soto',
      rol:    'Soporte técnico Callpicker — diagnóstico de conectividad',
      color:  '#22c55e',
      campos: [
        { label: 'Diagnóstico',   value: 'Comportamiento consistente con renovación de sesión SIP/NAT: al reiniciar se re-registra la extensión y se limpian sesiones vencidas o mal asociadas por el router.' },
        { label: 'Recomendación', value: 'Actualizar a Callpicker versión 3.20.6 para poder editar los parámetros de conexión necesarios.' },
      ],
    },
    {
      nombre: 'Paola Bárcenas / Mario Hernández',
      rol:    'Mesa SAC Callpicker — voces disidentes en la reunión del 4-sep',
      color:  '#ef4444',
      campos: [
        { label: 'Postura',   value: '[HIPÓTESIS] Cuestionan la explicación de "doble clic humano" — "no se ve real" que se den varios clics para el volumen reportado.' },
        { label: 'Analogía',  value: 'Paola compara el patrón de conectividad con el caso previo "Cebra": a mayor dispersión geográfica de los asesores, mayor probabilidad estructural de fallas de red.' },
        { label: 'Implicación', value: 'No hay consenso interno pese a que la explicación ya se comunicó hacia afuera como cerrada.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cuenta Enterprise LTV 1-VIP con $648,720 MXN acumulados y MRR cercano a $59K — el valor a 12 meses adicionales ronda $700K MXN si se mantiene el ritmo.',
      'Entrega formal cumplida bajo los lineamientos de gobierno de TI del cliente: GitHub institucional, SonarQube "A", cero issues en Dependabot, manuales y diagrama de arquitectura.',
      'Pase a producción ejecutado sin incidentes mayores pese a hacerse fuera de horario y con equipo reducido.',
      'Trazabilidad técnica real del incidente OAuth: logs revisados, secuencia de fallo identificada y dos parches previos documentados.',
      'Decisión de método correcta en la reunión del 4-sep: bitácora de incidentes formato Grupo 2711, con 8 acciones y responsables nombrados.',
    ],
    oportunidades: [
      'Segunda cuenta Callpicker para el ambiente UAT — necesidad recurrente y documentada del cliente, hoy sin cotizar.',
      'Contrato de mantenimiento/soporte de la extensión: convierte en ingreso el riesgo que ya se advirtió internamente.',
      'Soluciones de IA de Callpicker, con interés expresado por el cliente en 2025 y sin seguimiento documentado.',
      'Mensajes personalizados de ocupado/no contesta, hoy clasificados como fuera de alcance y cotizables.',
      'Base instalada de 170 usuarios en una institución educativa grande, con potencial de referencia interna si la estabilización se resuelve bien.',
    ],
    debilidades: [
      'Sin consenso interno sobre la causa de los registros duplicados, pese a que la explicación ya se comunicó al cliente como cerrada.',
      'Contrato firmado y documento de alcance de 90 horas no localizados, tras invocarse varias veces frente al cliente.',
      'El ejecutivo de satisfacción (Dan) estuvo semanas sin acceso directo al canal oficial de comunicación con el cliente.',
      'Choque de canal: el cliente exige Teams por política interna; Callpicker sostiene WhatsApp/teléfono/correo.',
      'Tres inconsistencias en los datos financieros del dashboard que bloquean cualquier reporte confiable a dirección.',
      'La redacción contractual sobre SSO/SAML 2.0 quedó pendiente de cerrar — el tipo de ambigüedad que genera reclamos de alcance.',
    ],
    amenazas: [
      'Riesgo de percepción de marca: cuenta institucional con Arquitectura, Infraestructura y Seguridad ya enteradas del proyecto. Un problema sin resolver por semanas se vuelve visible para mucha más gente que en una PyME.',
      'Riesgo de alcance: al menos 3 solicitudes fuera de alcance que el cliente sigue planteando como si debieran estar incluidas.',
      'Objeción de Arquitectura sobre api_enabled, BD externa y n8n sin cierre formal documentado — puede reabrirse en cualquier momento.',
      'Cultura de control de cambios estricta: cualquier parche o función nueva requiere pasar de nuevo por sandbox → UAT → producción.',
      'Intermitencia de conectividad estructural en home-office que no se elimina sin estandarizar la red del cliente — fuera del control contractual de Callpicker.',
    ],
  },

  conclusion:
    'University 4 People es una cuenta VIP en ventana de riesgo, no en crisis. La diferencia importa: todavía hay margen para actuar antes de que el patrón se consolide. Los ingredientes tempranos están presentes —problemas técnicos sin resolver, ambigüedad sobre el origen de la causa, y un cliente institucional con gobierno de TI estricto que puede escalar internamente— pero la evidencia técnica disponible apunta [HIPÓTESIS] a que la causa del incidente crítico está del lado del cliente, no de la plataforma.\n\n' +
    'El paso que desbloquea todo lo demás es uno solo: sentar a Aarón, el administrador de Salesforce del cliente, en una sesión de una hora junto con Blanca. Sin esa sesión, Callpicker sigue haciendo diagnóstico unilateral sobre una configuración que no puede ver.\n\n' +
    '⚠ CINCO PREGUNTAS ABIERTAS que el documento fuente exige responder ANTES de que este análisis se use fuera del expediente interno:\n' +
    '1. ¿De dónde sale "Campus Querétaro"? ¿Hay otra fuente (CRM, contrato) que lo confirme? Si no se puede sustentar, usar únicamente "Tecnológico de Monterrey — Educación Continua / U4P" como identificación de la cuenta.\n' +
    '2. ¿La fecha de última factura (01-mar-2027) es un error de dashboard o un campo que significa "próxima factura programada"?\n' +
    '3. ¿Cuál de las dos cifras —Factura Mensual $54,060 o MRR $58,975— es la que se reporta como recurrente real a dirección?\n' +
    '4. ¿Existe ya un cierre formal (memo o correo) de la objeción de Arquitectura sobre permisos api_enabled y almacenamiento externo, o sigue abierta de forma informal?\n' +
    '5. ¿La sesión de diagnóstico conjunto con Aarón ya tiene fecha, o sigue pendiente de agendar?',

  pierde: [
    'Horas de ingeniería absorbidas en parches fuera del alcance original para mitigar una configuración que probablemente es del cliente (ya van dos documentados).',
    'Credibilidad técnica si el cliente aporta evidencia que contradiga la explicación de "doble clic" que ya se comunicó sin consenso interno.',
    'Trabajo no cobrado si no se cierra por escrito qué cubre el contrato de 90 horas — hay al menos 3 solicitudes en esa zona gris.',
    'Visibilidad de marca ante un cliente institucional donde Arquitectura, Infraestructura y Seguridad ya observan el proyecto.',
    'Capacidad de reporte a dirección mientras las tres inconsistencias financieras del dashboard sigan sin conciliar.',
  ],

  gana: [
    'Una cuenta Enterprise LTV 1-VIP estabilizada, con ~$700K MXN de valor a 12 meses adicionales si se mantiene el ritmo actual.',
    'Cotización de la segunda cuenta Callpicker para UAT y del contrato de mantenimiento de la extensión — dos ingresos hoy identificados y sin gestionar.',
    'La puerta abierta a soluciones de IA que el propio cliente expresó en 2025.',
    'Un expediente documental sólido (bitácora formato Grupo 2711 + contrato localizado) que defiende el trabajo de Callpicker si el patrón se repite.',
    'Un estándar replicable para clientes de integración a la medida con gobierno de TI formal.',
  ],

  recomendacion_central:
    'Agendar esta semana la sesión de diagnóstico conjunto de 1 hora con Blanca Mata y Aarón: es el único paso que puede confirmar o descartar la hipótesis de política de rotación de tokens/IP del lado del cliente, y sin él todo lo demás es diagnóstico unilateral de Callpicker. ' +
    'En paralelo, localizar el contrato firmado y el alcance de 90 horas antes de la próxima conversación sobre "fuera de alcance", y alinear internamente la explicación de los registros duplicados antes de volver a comunicarla al cliente. ' +
    'Aplicar la bitácora de incidentes formato Grupo 2711 de forma permanente, no solo a los casos de esta semana. ' +
    'Y no usar hacia afuera —ni con el cliente ni en reporte a dirección— ningún dato marcado [HIPÓTESIS] o [VACÍO / A CONFIRMAR] hasta que las 5 preguntas abiertas estén respondidas.',

  documentos: [
    {
      nombre:      'Análisis de Cuenta · Tecnológico de Monterrey — U4P',
      ruta:        '/docs/Analisis_Cuenta_TecMonterrey_U4P.docx',
      descripcion: 'Corte 4 de septiembre de 2026. Construido con tres fuentes: canal de Slack #tec-de-mty (oct-2024 a la fecha), captura de facturación de la cuenta y minuta de la reunión interna del 4-sep-2026. Sin acceso a CDR, contrato firmado, Zoho Desk ni SLA formal. Cada hallazgo lleva etiqueta de confianza [VERIFICADO] / [HIPÓTESIS] / [VACÍO / A CONFIRMAR].',
    },
  ],
}
