import type { AuditoriaCase } from './types'

export const GRUPOFRISA: AuditoriaCase = {
  id: 'grupofrisa',
  nombre: 'Grupo FRISA / ACISA',
  sector: 'Desarrollo Inmobiliario — Comercial, Industrial, Residencial, Turístico',
  fecha_periodo: 'Marzo 2025 – Julio 2026',
  fecha_auditoria: 'Jul 2026',
  tipo_cliente: 'Enterprise — Cuenta Estratégica Activa · CID 168973',
  descripcion_contexto: '16 meses documentados · Auditoría Integral v2.0 · AV Voz + AV Chat + Salesforce + WA API · +50 plazas en +15 estados · Flujo residencial/rentas en pruebas activas',
  estado: 'activo',
  clasificacion: 'CONFIDENCIAL',
  version: '2.0',

  kpis: [
    { label: 'MRR activo',           value: '$13,955 + IVA',  color: '#1B3FCC' },
    { label: 'Horas proyecto',       value: '159 / 160 hrs',  color: '#ef4444' },
    { label: 'Scope creep episodes', value: '7 documentados', color: '#f59e0b' },
    { label: 'Health Score',         value: '50 / 100',       color: '#f97316' },
  ],

  resumen_ejecutivo: 'Grupo FRISA es una de las cuentas más complejas y estratégicamente valiosas del portafolio de Callpicker. No es una cuenta en riesgo de churn — es una cuenta con fricciones activas, dobles, que si no se gestionan con precisión pueden convertirse en desgaste irreparable. La tecnología funciona: el AV Chat está al 95%, la integración Salesforce está entregada, y el flujo residencial/rentas ya está en pruebas activas. El problema es de gobierno de cuenta — y esta actualización v2.0 confirma que ese gobierno falla en dos direcciones, no solo una.\n\nDónde está la cuenta hoy (23 jul 2026):\n• AV Chat (CID 168973): listo para producción, pendiente VoBo final\n• AV Voz proyecto base: pausado al 90%, horas casi agotadas (159/160)\n• Flujo residencial/rentas (CID por confirmar): en pruebas activas — 7 defectos detectados 22–23 jul, 3 resueltos, 4 abiertos\n• Integración Salesforce: operativa, con defecto de tipificación abierto en flujo residencial\n• Gobierno interno Callpicker: fragmentado — 2 frentes (Galván/David vs. Mario/Paola) sin canal único\n• Contrato activo hasta dic 2026 · Renovación 2027 (~$167,460 MXN/año) en conversación · +3 usuarios agregados, pendiente validar facturación',

  resultado_positivo: 'El cliente siempre ha pagado a tiempo y en su totalidad, incluyendo un pago extraordinario de $305,800 MXN en cheque (feb 2026). Aprobó la renovación de contrato y el upsale de mayo 2026 sin objeción mayor. A pesar de las fricciones, mantiene la relación activa y no ha amenazado con cancelar el servicio.\n\nEl equipo técnico de Callpicker demostró capacidad para resolver proyectos de alta complejidad: migración de Landbot a AV inteligente, integración Salesforce bidireccional, catálogo dinámico vía Google Sheets, 13 calendarios, multi-destino de voz. La respuesta a los 7 defectos nuevos del bloque residencial (3 resueltos en menos de 24 horas) confirma que esa capacidad se sostiene. La nueva política de tolerancia cero para trabajo fuera de alcance (desde 29 abr 2026) es la respuesta correcta y ya está implementada.',

  hallazgos: [
    'Patrón de expansión de alcance progresiva sin autorización: 7 episodios documentados en 16 meses. El cliente presenta solicitudes fuera de alcance como si fueran compromisos previos o funcionalidades evidentes.',
    'Crisis de 32 horas ejecutadas sin autorización explícita (abr 2026) — scope creep aplicado sobre AV Voz dentro de proyecto AV Outbound. Se absorbió internamente con nueva política de tolerancia cero.',
    'Horas del proyecto casi agotadas (159/160) con AV Voz pausado al 90% — margen cero para imprevistos. El saldo adicional de 65 hrs está intacto pero no cubre completar AV Voz sin cotización nueva.',
    'AV Outbound con 47.7% de no contestadas (abr-jun 2026) — casi la mitad de las 1,872 llamadas salientes. Requiere análisis de franja horaria y perfil de base de datos.',
    'Tasa de pérdida entrante escaló a 14.5% (mar) y 15.0% (abr) — coincide exactamente con crisis "Real del Lago". La mejora a 6.5% en mayo confirma que los ajustes funcionaron.',
    'Único punto de contacto crítico: solo José Antonio Romero. Si sale, la relación se fragiliza sin interlocutor calificado.',
    'Comunicación dispersa en múltiples canales simultáneos: WhatsApp directo con ingeniería, correo con PM, tickets Zoho Desk, llamadas directas a asesores — sin canal único acordado.',
    'Health Score 50/100 — zona de alerta sin revisión activa reciente. Campos de adopción en blanco en CRM.',
    '64.2% de las llamadas entrantes (643 de 1,002) son gestionadas por el AV sin transferir a humano — indicativo de que el AV filtra prospectos reales. Las llamadas ≤1 min representan el 52.2% del tráfico.',
    'Fuente de datos personalizada de conciliación solicitada como condición para salir a producción (jun 2026) — nuevo scope creep negociado: lanzar AV Chat primero, levantar requerimiento después.',
    'Desarrollo improvisado "Real del Lago" añadido al prompt sin integración Salesforce generó fallas de transferencia en producción (mar 2026).',
    'José Galván concentra demasiados roles: comercial, soporte e ingeniería. Genera dependencia y cuello de botella.',
    '[v2.0] 7 defectos técnicos en el flujo de voz residencial/rentas — 3 resueltos en <24 h, 4 abiertos al 23 jul 2026, incluyendo pérdida de un prospecto de 9 MDP sin alternativa ofrecida y tipificación incorrecta en Salesforce.',
    '[v2.0] Fragmentación interna de Callpicker: dos frentes comerciales (Galván/David vs. Mario/Paola) ofreciendo entregables distintos al mismo cliente sin coordinarse — la confusión sobre el "panel con costo" no la generó el cliente.',
    '[v2.0] 3 usuarios adicionales agregados al contrato de AV Chat/Voz sin cuantificar ni confirmar impacto en facturación.',
    '[v2.0] Proyecto "Grupo FRAM" (solicitado en mayo 2026) sin ficha de alcance ni dueño interno definido.',
    '[v2.0] Cotización de "reporte avanzado de AV" sin respuesta comercial ante dos seguimientos de Paola — riesgo de repetir el patrón que generó la crisis de abril.',
    '[v2.0] Gestión del número API de AV Outbound depende de una agencia de marketing externa sin protocolo definido de soporte ni facturación.',
  ],

  cronologia: [
    { fecha: 'Mar 2025',                  responsable: 'Galván / Equipo',              evento: 'Apertura de cuenta CID 168973. Canal Slack creado. Proyecto en 3 etapas: Config CP+Chat, AV básico, Integración Salesforce. Pago inicial recibido.', tipo: 'ok' },
    { fecha: 'Mar–Abr 2025',              responsable: 'Equipo técnico',               evento: 'Activación conmutador y CP Chat. Contrato sin firmar por cláusula Décima Primera (pena convencional 50% excesiva). WhatsApp activo: 5588544458.', tipo: 'neutral' },
    { fecha: 'Abr–May 2025',              responsable: 'Cliente / Ingeniería',          evento: 'Primer scope creep: AV básico configurado como IVR pero cliente quiere AV 1.0 primero. 13 calendarios configurados. AV instalado en pruebas.', tipo: 'problema' },
    { fecha: 'May–Jun 2025',              responsable: 'David Avilés',                  evento: 'Primera versión del AV en producción. VoBo del documento de alcance obtenido con dificultad. Cliente ya muestra patrón de pedir fuera de alcance ("como en Acciona").', tipo: 'neutral' },
    { fecha: 'Jul–Sep 2025',              responsable: 'Ingeniería / Cliente',          evento: 'Entrega integración Chat-Salesforce y AV Voz. Bugs: asignación de propietarios incorrecta. AV dice "H,O,L,A". Scope creep asignación bidireccional absorbido.', tipo: 'problema' },
    { fecha: 'Oct–Nov 2025',              responsable: 'Ingeniería',                    evento: 'Problemas recurrentes con AV de Voz: palabras clave mal interpretadas (Sayaves vs Sayavedra). Chat Bot con WA QR presenta intermitencias. Landbot muestra limitaciones.', tipo: 'problema' },
    { fecha: 'Dic 2025',                  responsable: 'Ingeniería / Cliente',          evento: 'Diagnóstico: mensajes FB Ads no llegan a CP Chat por librería QR desactualizada. Plan de migración a WA API inicia. Cliente presiona cambios en Landbot sin pagar.', tipo: 'problema' },
    { fecha: 'Ene–Feb 2026',              responsable: 'David / Galván',                evento: 'Reunión Fathom (27 feb): causa raíz FB Ads confirmada. Plan: migrar a WA API oficial. VoBo del cliente recibido. Pago $240,000 + $65,800 de saldo adicional recibido.', tipo: 'pivote' },
    { fecha: 'Mar 2026',                  responsable: 'Fathom / Ingeniería',           evento: 'Reunión Fathom (30 mar): falla "Real del Lago" en AV de Voz — desarrollo improvisado sin Salesforce. Solución: catálogo dinámico Google Sheets. AV Chat migrado de Landbot.', tipo: 'problema' },
    { fecha: 'Abr 2026',                  responsable: 'Equipo / Galván',               evento: 'CRISIS: 32 horas del presupuesto extra usadas sin autorización. Reunión Fathom (29 abr): absorber horas, reasignar 25 al proyecto base, cubrir 7 a costo. Nueva política tolerancia cero.', tipo: 'problema' },
    { fecha: 'May–Jun 2026',              responsable: 'David / Cliente',               evento: 'Desarrollo activo: AV Chat al 95%, AV Voz pausado al 90%. Horas casi agotadas (159/160). Nuevo scope creep: fuente de datos conciliación. Negociado: lanzar AV Chat primero.', tipo: 'neutral' },
    { fecha: '15 Jun 2026',               responsable: 'Dir. Experiencia al Cliente',   evento: 'Cierre auditoría v1.0. AV Chat listo para producción (pendiente VoBo final). AV Voz pausado. Integración Salesforce operativa. MRR $13,955. Contrato activo dic 2026.', tipo: 'ok' },
    { fecha: '22 Jul 2026, 17:16–17:18',  responsable: 'David Ingeniería',              evento: '[v2.0] Flujo residencial/rentas: reporta y corrige salto de sondeo y falta de pregunta local/isla. 2 defectos resueltos en menos de 24 h.', tipo: 'ok' },
    { fecha: '23 Jul 2026, 08:54–08:59',  responsable: 'José Antonio / David',          evento: '[v2.0] Se define regla de datos obligatorios para Centros Comerciales antes de poder transferir. Tercer defecto resuelto. Regla de negocio documentada por escrito.', tipo: 'ok' },
    { fecha: '23 Jul 2026, 09:19–09:59',  responsable: 'José Antonio / David',          evento: '[v2.0] HALLAZGOS GRAVES: loop de insistencia al responder "no sé" sobre pago, prospecto de 9 MDP despedido sin alternativa, tipificación incorrecta en Salesforce (2 casos).', tipo: 'problema' },
    { fecha: '23 Jul 2026, 10:10–10:12',  responsable: 'José Antonio',                  evento: '[v2.0] Reporta falla en detección de motivo "no interesa", silencio en Condado de Sayavedra (funciona con "terrenos"), y ruido de fondo tipo tecleo en pausas del AV.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Grupo FRISA / ACISA' },
    { label: 'Sector',               value: 'Desarrollo Inmobiliario — Comercial, Industrial, Residencial, Turístico' },
    { label: 'Sede corporativa',     value: 'Blvd. Magnocentro 26, Piso 5, Interlomas, Huixquilucan, Edo.Méx.' },
    { label: 'Presencia nacional',   value: '+50 plazas en +15 estados | Marcas: Plaza Sendero, Paseo, City Center, Explanada' },
    { label: 'Contacto principal',   value: 'José Antonio Romero Reyes ("Pepe Toño") — Gerente de Sistemas / TI' },
    { label: 'Email / Tel',          value: 'jaromero@grupofrisa.com | +52 55 5102 3829' },
    { label: 'CID Callpicker',       value: 'CID 168973 (activo con AV) | CID ~171 (legacy Locales Comerciales) — vínculo con flujo residencial/rentas pendiente de confirmar' },
    { label: 'Contrato vigente',     value: 'Activo hasta diciembre 2026. Renovación ene-dic 2027 en conversación. +3 usuarios adicionales sin ajuste de MRR confirmado.' },
    { label: 'MRR total',            value: '$13,955 + IVA | Pago extraordinario: $305,800 MXN en cheque (feb 2026)' },
  ],

  necesidad_negocio: 'Grupo FRISA requiere un ecosistema de comunicación integral para su operación inmobiliaria a escala nacional: gestión de prospectos entrantes vía AV de Voz con transferencia inteligente a asesores, seguimiento de leads en Salesforce, campañas de prospección vía AV Outbound, y atención por WhatsApp API.\n\nEl objetivo al contratar Callpicker fue centralizar la operación omnicanal (Voz + Chat + WhatsApp) en una plataforma única integrada con Salesforce — su CRM corporativo. La escala del cliente (+50 plazas, múltiples marcas) exige un AV robusto que no haga quedar mal a FRISA frente a sus propios prospectos. La incorporación confirmada del flujo residencial/rentas (Condado de Sayavedra, La Floresta y otros desarrollos) amplía esa necesidad hacia un vertical adicional, lo cual valida la tesis comercial pero también multiplica la superficie de riesgo operativo si no se gobierna con el mismo rigor.',

  potencial_corto: [
    'Lanzar AV Chat a producción con VoBo formal y soporte standby las primeras 72 horas — recupera confianza tangible',
    'Cerrar los 4 defectos abiertos del flujo residencial (loop, 9 MDP, tipificación, Sayavedra) antes de salir a producción',
    'Estimar horas restantes para AV Voz y presentar cotización adicional en 7 días',
    'Designar responsable único de verdad comercial para toda promesa u oferta a FRISA',
    'Responder la cotización pendiente de "reporte avanzado de AV" esta semana — evitar repetir patrón de abril',
    'Confirmar CID exacto del flujo residencial/rentas y ajuste de MRR por 3 usuarios adicionales',
    'Actualizar Health Score y campos de adopción en CRM — tarea inmediata de Fátima',
    'Consolidar comunicación de soporte en canal único acordado con el cliente',
  ],
  potencial_largo: [
    'Renovación anual 2027 (ene-dic): intención confirmada — ~$167,460 MXN/año asegurado',
    'Migración WA API oficial: upsale en MRR ya con VoBo del cliente',
    'Nuevo DID + integración Salesforce: cotización pendiente para segunda línea del grupo',
    'Fuente de datos personalizada de conciliación: nuevo proyecto facturado — elimina principal objeción del cliente',
    'Línea residencial/rentas estabilizada: si los 4 defectos se cierran, es caso de éxito adicional para la propuesta 2027',
    'Reporte avanzado de AV: cotización pendiente de respuesta — ingreso adicional si se formaliza',
    'Cuenta legacy Centros Comerciales (CID ~171): potencial integración al ecosistema actual, ahora con evidencia de uso activo',
    'Replicar modelo AV complejo en otras plazas o unidades de negocio del grupo',
  ],

  tacticas: [
    { nombre: 'Reescritura de historia', descripcion: 'Presenta solicitudes fuera de alcance como si fueran compromisos previos o funcionalidades evidentes. Cuando Callpicker cede sin documentación, el cliente lo interpreta como precedente.', impacto: '7 episodios de scope creep — 32 hrs absorbidas sin costo en el más crítico (abr 2026)' },
    { nombre: 'Benchmark ACCIONA', descripcion: 'Usa "como en Acciona" o "así lo tenían en Acciona" como argumento en al menos 4 momentos para solicitar funcionalidades fuera de alcance.', impacto: 'Expectativa de servicio que puede no corresponder al alcance contratado — pero también ventana de upsale si la funcionalidad existe' },
    { nombre: 'Urgencia informal', descripcion: 'Presiona con informalidad (WhatsApp directo a ingeniería) y urgencia para obtener trabajo fuera de alcance antes de que se formalice el cambio.', impacto: 'Desvía recursos de ingeniería sin pasar por proceso comercial. Nuevo protocolo tolerancia cero mitiga esto.' },
    { nombre: 'Canal fragmentado', descripcion: 'Usa simultáneamente WhatsApp con ingeniería, correo con PM, tickets Zoho Desk y llamadas directas — sin canal único acordado.', impacto: 'El equipo no sabe a quién escalar; el cliente tampoco. Genera retrasos y malentendidos.' },
  ],
  senal_alarma: 'Cuando el cliente menciona "esto debería estar incluido", "como en Acciona", o solicita cambios dentro de una sesión de demostración sin estimación previa — señal de inicio de scope creep. Tratar como escalación inmediata: estimación en horas + costo + VoBo escrito ANTES de ejecutar. Sin excepción. [v2.0] También: si el cliente menciona algo que Callpicker mostró y el responsable comercial de la cuenta no lo conoce — señal de fractura interna que debe resolverse antes de responder al cliente.',

  problema_raiz: 'Ausencia de protocolo formal de gobierno de alcances — el cliente aprendió en 16 meses que la presión informal produce resultados',
  problema_raiz_detalle: 'No fue un error aislado: fue un patrón que se consolidó en 7 episodios documentados. Cada vez que el cliente presentó una solicitud fuera de alcance como si fuera obvia o prometida, el equipo cedió o absorbió el costo sin VoBo escrito. El equipo lo reconoce explícitamente: "se sabe que FRISA aprovecha las brechas del proceso" (Fathom 29 abr 2026). La política de tolerancia cero implementada el 29 abr 2026 es correcta — el desafío es sostenerla.\n\n[v2.0] Ampliación crítica: la ausencia de gobierno de alcances no es unidireccional. El cliente presiona con informalidad porque ha aprendido que funciona — pero Callpicker internamente tampoco tiene un canal único de verdad comercial para esta cuenta. La confusión sobre el "panel con costo" no la inventó el cliente: se la generó el propio equipo de Callpicker en una sesión de la que el responsable comercial no tenía registro. Mientras exista más de un frente de Callpicker autorizado a prometer cosas a FRISA sin coordinarse, la política de tolerancia cero aplicada solo del lado del cliente tiene un límite estructural.',

  flujo_real: [
    { fase: '1. Apertura (Mar 2025)',               area: 'Galván / Cliente',              accion: 'Cuenta abierta, proyecto en 3 etapas bien definidas',                                          resultado: 'Base técnica sólida. Pero sin protocolo de cambios desde el inicio.' },
    { fase: '2. Primer scope creep (Abr 2025)',      area: 'Cliente',                       accion: 'AV básico configurado como IVR — cliente pide AV 1.0',                                        resultado: 'Se absorbe el cambio. El patrón queda establecido.' },
    { fase: '3. Bugs y fricciones (Jul–Nov 2025)',   area: 'Ingeniería / Cliente',          accion: 'Errores en AV Voz, asignación bidireccional absorbida, Landbot con limitaciones',            resultado: 'Desgaste acumulado. Cliente molesto por demoras.' },
    { fase: '4. Nuevo proyecto (Feb 2026)',           area: 'Galván / David',               accion: 'Pago $305,800 recibido. AV Outbound + migración Bot a AV Chat iniciados',                    resultado: 'Relación renovada. Pero sin VoBo más estricto desde el inicio.' },
    { fase: '5. Crisis 32 hrs (Abr 2026)',           area: 'Ingeniería sin supervisión',    accion: '32 hrs ejecutadas sin autorización dentro de proyecto AV Outbound',                          resultado: 'CRISIS comercial. Absorción de costo. Nueva política tolerancia cero.' },
    { fase: '6. Cierre v1.0 (Jun 2026)',             area: 'David / Cliente',               accion: 'AV Chat 95%, AV Voz pausado, Salesforce operativo',                                          resultado: 'Cuenta activa y con potencial, pero en zona de alerta por horas agotadas.' },
    { fase: '7. [v2.0] Defectos residencial (Jul)', area: 'José Antonio / David Ingeniería', accion: '7 defectos detectados en pruebas del flujo residencial/rentas (22–23 jul)',                resultado: '3 resueltos en <24 h — velocidad buena. 4 abiertos incluyendo fuga de 9 MDP.' },
    { fase: '8. [v2.0] Fractura interna',            area: 'Galván / Mario / Paola',        accion: 'Dos frentes de Callpicker ofrecen cosas distintas al cliente sin coordinarse',             resultado: 'Cliente confundido sobre alcance real. Cotización pendiente sin respuesta.' },
  ],

  comparativo: [
    { metrica: 'Protocolo de cambios (cliente)',    real: 'Verbal o por WhatsApp — sin VoBo escrito antes de ejecutar',                                      ideal: 'Estimación + costo + VoBo escrito firmado ANTES de iniciar cualquier trabajo fuera de alcance' },
    { metrica: '[v2.0] Protocolo de cambios (interno)', real: 'Distintos frentes de Callpicker ofrecen cosas distintas sin coordinarse',                    ideal: 'Un responsable único de verdad comercial por cuenta, con visibilidad de todo lo ofrecido' },
    { metrica: 'Canal de comunicación',             real: 'WhatsApp directo a ingeniería + correo + tickets + llamadas',                                      ideal: 'Canal único acordado (grupo WhatsApp oficial) con registro auditable' },
    { metrica: 'Health Score',                      real: '50/100 — campos de adopción en blanco',                                                            ideal: 'Revisión formal con HS actualizado y campos de adopción completos' },
    { metrica: 'Horas proyecto',                    real: '159/160 agotadas — AV Voz al 90% sin completar',                                                   ideal: 'Cotización adicional presentada ANTES de agotar horas' },
    { metrica: 'AV Outbound no contestadas',        real: '47.7% no contestadas (893 de 1,872 llamadas)',                                                     ideal: 'Análisis de franja horaria + perfil de base de datos para optimizar' },
    { metrica: '[v2.0] Defectos técnicos (residencial)', real: 'Gestionados por WhatsApp sin folio ni bitácora — 3/7 resueltos, 4/7 abiertos',             ideal: 'Bitácora formal con folio, responsable y fecha de cierre por defecto' },
    { metrica: '[v2.0] Manejo de leads calificados', real: 'AV despide prospectos de alto valor sin alternativa ni registro de motivo',                     ideal: 'Protocolo de retención mínima: ofrecer transferencia o alternativa antes de despedir' },
    { metrica: 'Contactos en la cuenta',            real: 'Solo José Antonio Romero — sin contacto secundario registrado',                                   ideal: 'Contacto secundario o sucesor TI identificado y registrado en CRM' },
    { metrica: 'Reporte al cliente',                real: 'Sin dashboard o reporte de conciliación para su dirección',                                        ideal: 'Reporte semanal de actividad AV (aunque sea manual al inicio)' },
  ],

  plan_inmediato: [
    { accion: 'Lanzar AV Chat a producción con protocolo de soporte inmediato post-go-live (primeras 72 horas críticas)', responsable: 'David Avilés + José Galván', criterio: 'VoBo firmado del cliente + soporte en standby primera semana' },
    { accion: '[v2.0] Confirmar CID exacto del flujo residencial/rentas (168973 vs. legacy ~171 vs. CID nuevo)', responsable: 'José Galván', criterio: 'CID confirmado y reflejado en CRM' },
    { accion: '[v2.0] Corregir loop de insistencia (defecto #3) y despedida sin alternativa ante presupuestos altos (defecto #4 — prospecto 9 MDP)', responsable: 'David Ingeniería', criterio: 'Casos re-probados sin recurrencia' },
    { accion: '[v2.0] Diagnosticar y corregir tipificación incorrecta en Salesforce (defecto #5)', responsable: 'David Ingeniería', criterio: 'Causa identificada y corregida' },
    { accion: '[v2.0] Designar responsable único de verdad comercial para toda promesa u oferta a FRISA — comunicarlo al equipo interno', responsable: 'José Galván + Dir. SAC', criterio: 'Punto único comunicado internamente esta semana' },
    { accion: '[v2.0] Responder la cotización pendiente de "reporte avanzado de AV" (2 seguimientos sin respuesta de Paola)', responsable: 'José Galván', criterio: 'Respuesta formal enviada esta semana' },
    { accion: 'Estimar horas restantes para completar AV Voz al 100% y presentar cotización adicional formal', responsable: 'David Avilés', criterio: 'Estimación enviada al cliente en máximo 7 días' },
    { accion: 'Actualizar Health Score y completar campos de adopción en CRM de Callpicker', responsable: 'Fátima González', criterio: 'HS actualizado con todos los campos completos esta semana' },
    { accion: 'Consolidar comunicación de soporte en canal único acordado con el cliente', responsable: 'Fátima González', criterio: 'Canal único activo y comunicado al cliente esta semana' },
  ],

  plan_mediano: [
    { accion: 'Coordinar migración WA API con el cliente al retorno de vacaciones — upsale ya autorizado', responsable: 'José Galván / Fátima González', criterio: 'Fecha de inicio confirmada y agenda técnica enviada' },
    { accion: 'Agendar sesión de levantamiento de requerimientos para fuente de datos de conciliación', responsable: 'Fátima González + David Avilés', criterio: 'Sesión realizada y requerimiento formal documentado en 10 días' },
    { accion: 'Análisis de tasa de no contestadas en AV Outbound — reporte con recomendaciones', responsable: 'David Avilés / Ingeniería', criterio: 'Reporte entregado al cliente en 14 días' },
    { accion: 'Registrar contacto secundario en Grupo FRISA para continuidad de la relación', responsable: 'José Galván', criterio: 'Contacto secundario TI identificado y registrado en CRM' },
    { accion: '[v2.0] Levantar ficha de alcance del proyecto "Grupo FRAM" — determinar si es cuenta separada, submarca o variante de FRISA', responsable: 'José Galván', criterio: 'Ficha con VoBo o descartado formalmente' },
    { accion: '[v2.0] Definir protocolo con la agencia de marketing externa para el número API de AV Outbound', responsable: 'José Galván + David', criterio: 'Protocolo escrito y validado' },
    { accion: '[v2.0] Diagnosticar silencio intermitente en Condado de Sayavedra y ruido de fondo tipo tecleo — escalar a NOC si aplica', responsable: 'David Ingeniería', criterio: 'Causa identificada y resuelta' },
  ],

  plan_estrategico: [
    { accion: 'Presentar propuesta formal de renovación 2027 (ene-dic) antes de octubre — con propuesta de valor documentada incluyendo vertical residencial', responsable: 'José Galván + Dir. SAC', criterio: 'Propuesta enviada antes del 31 oct 2026 — intención confirmada = contrato firmado' },
    { accion: 'Entregar dashboard o reporte semanal de conciliación de actividad AV (manual al inicio)', responsable: 'David Avilés / Fátima', criterio: 'Primer reporte enviado dentro de 15 días — elimina principal fuente de ansiedad del cliente' },
    { accion: 'Aplicar política de tolerancia cero con consistencia — del lado del cliente Y del lado interno de Callpicker: estimación + VoBo escrito ANTES de cualquier trabajo fuera de alcance, sin excepción', responsable: 'José Galván + Dir. Experiencia al Cliente', criterio: 'Cero trabajo no autorizado en ambas direcciones en los próximos 90 días' },
    { accion: 'Analizar e integrar cuenta legacy Centros Comerciales (CID ~171) — propuesta de consolidación o migración', responsable: 'José Galván', criterio: 'Análisis presentado y propuesta comercial definida en 60 días' },
  ],

  areas_oportunidad: [
    { area: 'Migración WA API oficial',                   impacto: 'Upsale en MRR ya con VoBo dado — pendiente sólo la coordinación de fechas post-vacaciones', responsable: 'Galván / Fátima' },
    { area: 'Nuevo DID + integración Salesforce',         impacto: 'Cotización pendiente — segunda línea de negocio del grupo', responsable: 'David + Galván' },
    { area: 'Fuente de datos personalizada conciliación', impacto: 'Nuevo proyecto facturado — elimina principal objeción del cliente para adopción plena', responsable: 'David + Fátima' },
    { area: 'Renovación anual 2027',                      impacto: '~$167,460 MXN/año asegurado — intención confirmada. Propuesta formal oct-nov 2026.', responsable: 'Galván + Dir. SAC' },
    { area: '[v2.0] Línea residencial/rentas estabilizada', impacto: 'Si los 4 defectos abiertos se cierran, es evidencia operativa para la propuesta 2027 y expansión de vertical', responsable: 'David Ingeniería' },
    { area: '[v2.0] Reporte avanzado de AV',              impacto: 'Cotización pendiente de respuesta — ingreso adicional si se formaliza. Dos seguimientos sin respuesta.', responsable: 'Galván' },
    { area: 'Cuenta Centros Comerciales (CID ~171)',      impacto: 'Sin estrategia activa — potencial de integración con evidencia de uso activo confirmada en pruebas residenciales', responsable: 'Galván' },
  ],

  perfiles: [
    {
      nombre: 'José Antonio Romero Reyes ("Pepe Toño")', rol: 'Gerente de Sistemas / TI — Único contacto y tomador de decisiones', color: '#1B3FCC',
      campos: [
        { label: 'Tipo de decisor',       value: 'Técnico-operativo con autoridad presupuestaria dentro de TI. Motivación principal: demostrar resultados tangibles a su gerencia interna.' },
        { label: 'Mayor miedo',           value: 'Perder control sobre el presupuesto o el alcance del proyecto — y que el AV haga quedar mal a FRISA frente a sus prospectos.' },
        { label: 'Estilo comunicacional', value: 'Directo, informal, prefiere WhatsApp sobre correo formal. Señal de molestia: silencio prolongado seguido de mensaje contundente con ejemplos concretos.' },
        { label: 'Señal de confianza',    value: 'Tono ligero, humor, uso de "tocayo" con José Galván. Tono colaborativo en WhatsApp con ingeniería (jun–jul 2026).' },
        { label: 'Benchmark clave',       value: 'ACCIONA — compara constantemente contra esa experiencia previa. Riesgo y oportunidad simultánea.' },
        { label: 'Lo que dice → necesita', value: '"No me dan seguimiento" → actualizaciones proactivas para reportar a su gerencia. "Cambios obvios" → delimitación formal de alcance ANTES de que los pida. "Autorizo mis horas" → visibilidad en tiempo real de consumo presupuestal.' },
        { label: 'Palancas de influencia', value: '1) Visibilidad ejecutiva — reportes de resultados para su dirección. 2) Control y transparencia — estado del proyecto en tiempo real. 3) Velocidad en soporte. 4) Cumplimiento exacto de plazos.' },
      ],
    },
    {
      nombre: 'David Avilés', rol: 'PM / Ingeniería proyecto base (CID 168973) — Ejecuta y documenta correctamente', color: '#22c55e',
      campos: [
        { label: 'Fortaleza',      value: 'Mantiene cadencia semanal de status reports por correo desde abr 2026. Resolvió problemas complejos: migración Landbot → AV, integración SF bidireccional, catálogo dinámico.' },
        { label: 'Vulnerabilidad', value: 'Negocia alcances sin respaldo comercial cuando está solo frente al cliente. Necesita soporte de Galván o Dir. SAC para blindar cambios de alcance.' },
        { label: 'Rol óptimo',     value: 'Ejecutor y documentador técnico — no negociador de alcances. Toda solicitud de cambio debe pasar primero por canal comercial.' },
      ],
    },
    {
      nombre: 'David Ingeniería', rol: '[v2.0] Soporte técnico de primera línea para flujo residencial/rentas', color: '#10b981',
      campos: [
        { label: 'Fortaleza',      value: 'Responde con velocidad (minutos a horas) y explica causas técnicas con claridad. 3 de 7 defectos del bloque residencial resueltos en menos de 24 h.' },
        { label: 'Vulnerabilidad', value: 'Gestiona casos por WhatsApp sin bitácora formal — mismo patrón de comunicación fragmentada ya señalado como debilidad estructural de la cuenta.' },
        { label: 'Pendiente',      value: '4 defectos abiertos incluyendo loop de insistencia, prospecto 9 MDP sin alternativa, tipificación Salesforce y silencio en Sayavedra.' },
      ],
    },
    {
      nombre: 'José Galván', rol: 'Ejecutivo Comercial — Cuello de botella multirrol', color: '#f97316',
      campos: [
        { label: 'Patrón crítico', value: 'Principal punto de contacto pero concentra comercial + soporte + ingeniería. [v2.0] No tenía visibilidad de lo que Mario/Paola ofrecieron al cliente. Dejó sin respuesta dos seguimientos de Paola sobre cotización pendiente.' },
        { label: 'Fortaleza',      value: 'Relación de confianza sólida con el cliente ("tocayo"). Conoce la historia de la cuenta.' },
        { label: 'Riesgo',         value: 'Si actúa como intermediario de soporte técnico, genera retrasos y pérdida de contexto. La fragmentación interna de la cuenta (2 frentes) tiene a Galván como eslabón roto.' },
      ],
    },
    {
      nombre: 'Fátima González', rol: 'Ejecutiva de Satisfacción — Rol difuso', color: '#8b5cf6',
      campos: [
        { label: 'Estado actual', value: 'Subreportada en canales de la cuenta después de los primeros meses. Rol difuso.' },
        { label: 'Rol requerido', value: 'Debe activarse como punto único de contacto para soporte y consolidar comunicación en canal acordado. Actualización de HS y adopción: tarea inmediata.' },
        { label: 'Potencial',     value: 'Liderar las sesiones quincenales que el cliente solicitó. Consolidar el canal de soporte único.' },
      ],
    },
    {
      nombre: 'Paola Bárcenas', rol: 'Soporte CP Chat — Alta proactividad', color: '#3b82f6',
      campos: [
        { label: 'Aportación', value: '[v2.0] Da seguimiento activo a cotizaciones y reportes pendientes, incluso cuando no recibe respuesta comercial oportuna. Dos seguimientos sin respuesta de Galván.' },
        { label: 'Nota',       value: 'Su valor debe ser visible para el cliente. Integrarla en el reporte de actividad. Es parte del segundo frente interno que, sin coordinación, generó confusión al cliente.' },
      ],
    },
    {
      nombre: 'Mario (601)', rol: '[v2.0] Perfil en construcción — información insuficiente', color: '#6b7280',
      campos: [
        { label: 'Evidencia',   value: 'Mencionado en una sesión con el cliente donde se mostró un panel "con costo" que generó interés. Parte del segundo frente comercial interno.' },
        { label: 'Pendiente',   value: 'Información insuficiente en fuentes disponibles para evaluar su rol de forma completa — requiere contexto adicional de Galván / Dir. SAC.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cliente estratégico: holding inmobiliario con presencia nacional (+50 plazas, +15 estados)',
      'Pago puntual y en cheque — sin incidencias de cobranza. Pago extraordinario $305,800 MXN (feb 2026)',
      'MRR sólido: $13,955 + IVA con tendencia de crecimiento',
      'Ecosistema multi-producto: Voz + Chat + AV + Salesforce + WA API, ahora con vertical residencial confirmado',
      'Interés genuino en expandir el servicio hacia 2027 — intención de renovación anual confirmada',
      'Capacidad técnica acreditada: AV multi-destino, 13 calendarios, integración Salesforce bidireccional',
      '[v2.0] Tiempo de respuesta de ingeniería a defectos reportados: 3 de 7 resueltos en <24 h',
      'Nueva política de tolerancia cero (29 abr 2026) ya implementada',
    ],
    oportunidades: [
      'Presupuesto 2027 ya en conversación: ~$167,460 MXN/año — propuesta formal oct-nov 2026',
      'Migración WA API pendiente — upsale ya autorizado por el cliente',
      '[v2.0] Línea residencial/rentas en pruebas activas — si se estabiliza, evidencia operativa concreta para la propuesta 2027',
      '[v2.0] 3 usuarios adicionales ya incorporados al contrato — validar ajuste de MRR pendiente de facturar',
      'Fuente de datos de conciliación — nuevo proyecto facturable',
      'Cuenta legacy Centros Comerciales: potencial integración, ahora con evidencia de uso activo',
      'Replicar modelo AV complejo en otras plazas o unidades de negocio del grupo',
    ],
    debilidades: [
      'Único contacto crítico: solo José Antonio Romero — sin contacto secundario registrado',
      'Patrón de expansión de alcance sin VoBo — 7 episodios del lado del cliente',
      'Comunicación dispersa en múltiples canales sin punto único acordado',
      'Horas de proyecto agotadas (159/160) con AV Voz al 90% sin completar',
      '[v2.0] Fragmentación de gobierno comercial también interna: 2 frentes de Callpicker sin canal único de coordinación',
      '[v2.0] Fuga de pipeline comercial no cuantificada: AV despide prospectos calificados sin registro de motivo (caso 9 MDP)',
      '[v2.0] Cotizaciones pendientes de respuesta comercial — riesgo de repetir el patrón que generó la crisis de abril',
      'Health Score 50/100 — zona de alerta sin revisión activa reciente',
    ],
    amenazas: [
      'Nuevo episodio de scope creep puede escalar a disputa formal si no se aplica la política de tolerancia cero',
      'Si el AV Chat o el flujo residencial salen a producción con fallas visibles → crisis de confianza irreparable',
      'Dependencia de un solo contacto: si José Antonio sale, la relación se fragiliza',
      '[v2.0] Si el defecto de tipificación en Salesforce no se corrige, el reporte de conciliación nacería con datos poco confiables',
      '[v2.0] Dependencia de una agencia de marketing externa sin protocolo definido para el número API de AV Outbound',
      'Competidor con propuesta para Salesforce nativo (sin middleware Callpicker)',
      'Presupuesto 2026 del cliente es fijo — cualquier imprevisto técnico afecta la relación',
    ],
  },

  conclusion: 'Grupo FRISA no es una cuenta en churn. Es una cuenta que Callpicker tiene el potencial de convertir en referencia de portafolio — si eleva la calidad de su gobierno comercial al nivel de la complejidad técnica que ya demostró poder entregar.\n\n[v2.0] La actualización de julio 2026 añade una dimensión que no estaba en la v1.0: el problema de gobierno no es solo del cliente hacia Callpicker, también es interno. El "panel con costo" que el cliente vio sin que el responsable comercial lo supiera, y la cotización sin respuesta ante dos seguimientos, son señales de que la cuenta necesita un único interlocutor de verdad comercial, no solo una política de tolerancia cero hacia afuera.\n\nLas tres acciones de mayor impacto en los próximos 90 días: (1) designar un responsable único de verdad comercial para toda promesa u oferta a FRISA, (2) lanzar AV Chat sin incidentes y cerrar los 4 defectos del flujo residencial antes de llevarlo a producción, (3) presentar propuesta formal de renovación 2027 antes de octubre.',

  pierde: [
    'Si AV Chat sale con fallas en primeras 72 horas → crisis de confianza irreparable',
    'Si se permite nuevo scope creep sin VoBo — del cliente o internamente → la política de tolerancia cero queda sin efecto',
    'Si José Antonio sale de la empresa sin contacto secundario registrado → pérdida de la relación',
    'Si no se presenta cotización para completar AV Voz → el proyecto queda incompleto indefinidamente',
    'Si no hay propuesta 2027 antes de octubre → el cliente evalúa alternativas en silencio',
    '[v2.0] Si el defecto del prospecto de 9 MDP se repite sin corrección → fuga de pipeline de alto valor sin que FRISA lo sepa',
    '[v2.0] Si la fragmentación interna (2 frentes) no se resuelve → el cliente percibirá inconsistencia y perderá confianza en la propuesta de valor',
  ],
  gana: [
    'AV Chat en producción sin incidentes → recupera confianza y abre la puerta a expansión 2027',
    'Flujo residencial estabilizado (4 defectos cerrados) → evidencia operativa adicional para la propuesta 2027',
    'Reporte de conciliación semanal → elimina principal fuente de ansiedad del cliente',
    'Propuesta 2027 formal → ~$167,460 MXN/año asegurado antes de que evalúe alternativas',
    'WA API migración completada → upsale en MRR ya con VoBo',
    'Fuente de datos de conciliación entregada → nuevo proyecto facturado, adopción plena del ecosistema',
    'Responsable único de verdad comercial designado → elimina el riesgo de promesas cruzadas sin coordinación',
    'Callpicker como referencia de portafolio: caso de éxito AV + Salesforce + residencial a escala inmobiliaria nacional',
  ],
  recomendacion_central: '[v2.0] DOS REGLAS ABSOLUTAS: (1) Sin VoBo escrito, sin ejecución — del lado del cliente. (2) Sin responsable único de verdad, sin promesa al cliente — del lado interno de Callpicker. La política de tolerancia cero es la correcta y ya funciona del lado del cliente. El siguiente paso es aplicarla también internamente: un único interlocutor que sepa todo lo que se ha ofrecido, prometido o cotizado a FRISA, y que sea el único autorizado a comprometer recursos. La oportunidad estratégica es real: el cliente paga, renueva y quiere crecer. Callpicker solo necesita que su gobierno de cuenta sea tan robusto como la tecnología que ya demostró poder entregar.',
}
