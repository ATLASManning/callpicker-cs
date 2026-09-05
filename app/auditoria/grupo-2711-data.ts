import type { AuditoriaCase } from './types'

/**
 * Fuente: "Auditoria_Corporativa_Integral_Grupo2711_v3.docx"
 * Elaborado por José Manuel López Delgadillo — Coordinador de Dirección de UX /
 * Director SAC, Callpicker · 4 de septiembre de 2026.
 *
 * QUÉ CAMBIA EN LA v3 respecto de las versiones anteriores:
 * el 4 de septiembre el informe v2 se presentó directamente al cliente
 * (Automotriz Maver). Esta versión incorpora esa sesión: validación externa de
 * las cifras principales, antecedentes históricos del cliente (16 meses,
 * 48 reportes) no vistos antes, DOS hallazgos críticos nuevos —el Agente
 * Virtual interceptando llamadas ya atendidas, y una inversión de ~$25,000 MXN
 * en hardware que no resolvió el problema real—, una disculpa formal de la
 * dirección de Callpicker, y un cambio de enfoque hacia indicadores de negocio.
 *
 * CINCO FUENTES: (a) auditoría histórica de 46 tickets; (b) bitácora de 19
 * eventos (27 Jul–2 Sep); (c) CDR de Callpicker (15,858 entrantes + 4,012
 * salientes = 19,870 llamadas); (d) dos sesiones internas (26-27 Ago);
 * (e) sesión de presentación al cliente (4 Sep).
 *
 * Los resúmenes de reunión son síntesis de terceros, NO transcripciones
 * verbatim, y se tratan con un nivel de confianza menor al de los datos de
 * ticketing y CDR. La §19 del documento lista los límites de los datos; se
 * conservan íntegros en la Conclusión.
 *
 * NOTA DE ACTUALIZACIÓN: la v1 de este caso incluía una precaución documental
 * sobre un señalamiento de posible desconexión intencional de personal del
 * cliente. Ese señalamiento no aparece en la v3 y se retiró de este caso: no
 * tenía ticket, fecha ni nombre que lo sustentara, y la relación pasó a un
 * plan de acción conjunto.
 */
export const GRUPO_2711: AuditoriaCase = {
  id:                    'grupo-2711',
  asesor:                'Claudia',
  nombre:                'GRUPO 2711',
  sector:                'Mantenimiento, reparación y servicio integral automotriz multimarcas',
  fecha_periodo:         '27 Julio – 2 Septiembre 2026 · CDR de 19,870 llamadas · 46 tickets históricos',
  fecha_auditoria:       'Sep 2026',
  tipo_cliente:          'Agente Virtual pagado y hoy no utilizable · 3 incidentes de plataforma en el periodo · plan de acción conjunto acordado con el cliente',
  descripcion_contexto:  'CID 12283 · Consecutivo C26 · Auditoría Corporativa Integral v3 — incorpora la sesión de presentación al cliente del 4 Sep 2026 · Automotriz Maver · Asesora: Claudia Hernández',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '3.0',

  kpis: [
    { label: 'Llamadas analizadas (CDR)',   value: '19,870',        color: '#6366f1' },
    { label: 'Incidentes de plataforma',    value: '3 de 19',       color: '#f59e0b' },
    { label: 'Agente Virtual',              value: 'Resta valor',   color: '#ef4444' },
    { label: 'Gasto evitable del cliente',  value: '~$25,000 MXN',  color: '#ef4444' },
  ],

  resumen_ejecutivo:
    'El 4 de septiembre este informe se presentó al cliente. Claudia Hernández expuso las cifras centrales —19,870 llamadas analizadas, 19 incidencias, solo 3 de origen de plataforma— y el cliente las recibió SIN objeción a los números, lo cual valida externamente el trabajo de las versiones anteriores. Pero la sesión sacó a la luz dos problemas que no estaban documentados ni en tickets ni en el CDR.\n\n' +
    'El primero: el Agente Virtual está interceptando llamadas que los ejecutivos YA estaban atendiendo, generando pérdidas en vez de evitarlas. El desarrollo ya fue pagado por el cliente y hoy no es utilizable de forma efectiva. El segundo: el cliente invirtió aproximadamente $25,000 MXN en diademas, equipo de cómputo y software nuevos para resolver fallas que, al final, se corrigieron creando una nueva extensión —es decir, con una acción de configuración, no de hardware.\n\n' +
    'La dirección de Callpicker (Joaquin Martinez) ofreció una disculpa formal, reconoció que las fallas NO son esporádicas y se comprometió a invertir en resolver la situación. Se acordó además un cambio de enfoque: dejar de medir el éxito solo por fallas técnicas resueltas y empezar a medirlo por indicadores de negocio del cliente —llamadas perdidas y ventas.\n\n' +
    'Un punto que amerita honestidad completa: el cliente presentó su propio historial de 16 meses (abril 2025 – agosto 2026, 48 reportes) donde identifica lunes Y viernes como los días de mayor recurrencia de llamadas perdidas. El análisis de CDR de 5-6 semanas (v2) mostró que el lunes es consistentemente el peor día, pero no encontró al viernes como atípico en ese periodo corto. Ambas cosas pueden ser ciertas a la vez: en una ventana más larga el viernes puede resurgir, y no hay contradicción real en recomendar seguir monitoreando ambos días en vez de descartar el viernes por completo.',

  resultado_positivo:
    'Las cifras centrales del informe fueron validadas externamente por el cliente, sin objeción, en la sesión del 4 de septiembre — el diagnóstico de las versiones anteriores resiste el escrutinio de la contraparte. ' +
    'Existe además una sucursal de referencia dentro de la misma cuenta: Gonher BSN opera con 1.5% de llamadas perdidas sobre 1,675 llamadas, frente al 35% de Saltillo. Eso demuestra que el servicio funciona bien cuando la infraestructura del cliente es adecuada, y da un patrón interno de buena práctica que se puede replicar. ' +
    'La dirección de Callpicker reconoció el problema abiertamente y comprometió inversión, lo que reduce el riesgo de que el cliente perciba evasiva. ' +
    'Y la relación cambió de etapa: de auditoría técnica a plan de acción conjunto, con visita física aprobada, plantilla de mapeo de extensiones en camino y una métrica de éxito que ambas partes ya aceptaron.',

  hallazgos: [
    '🔴 HALLAZGO NUEVO Y URGENTE — Según Rodolfo M. (Automotriz Maver), el Agente Virtual contesta llamadas que los ejecutivos YA estaban atendiendo, generando pérdidas en lugar de capturar llamadas que de otro modo se perderían. No es una falla de conectividad ni de infraestructura: es un problema de lógica de enrutamiento. El desarrollo ya fue pagado y hoy no es utilizable de forma efectiva.',
    '🔴 HALLAZGO NUEVO — Automotriz Maver invirtió ~$25,000 MXN en diademas, equipo de cómputo de mayor rendimiento y un programa nuevo para resolver fallas persistentes. La causa raíz real era de configuración: se resolvió creando una nueva extensión para los ejecutivos afectados (Josué Ortiz y Kelly Villanueva). Es un costo real, ya incurrido, que pudo evitarse con un diagnóstico de configuración más temprano.',
    'Los 3 incidentes de plataforma del periodo, con su duración y alcance: 5 Ago — falla masiva SIP en el servidor "collector", 10 min, 10 llamadas afectadas, por carga anormal en un clúster de BD interno · 29 Ago (#114229) — 130 min de demora/omisión en eventos vía API/webhook, no intermitencia de llamada · 2 Sep (#114451) — 9 min, 19 entrantes y 9 salientes afectadas, falla en SIP Legacy Collector, resuelta migrando a Atlas.',
    '⚠ INCONSISTENCIA A VALIDAR — Daniel Martinez citó que los 3 incidentes de plataforma representaron 0.8% del total de llamadas. Con las cifras dadas en la misma sesión (10 + 19 + 9 = 38 llamadas afectadas, más el evento de 130 min sin conteo) sobre 19,870 llamadas totales, el cálculo directo da ~0.19–0.24%, no 0.8%. No se cuenta con la metodología detrás del 0.8%. La conclusión cualitativa no cambia —el impacto de plataforma es una fracción muy pequeña del total—, solo la precisión del número.',
    'Disparidad brutal por sucursal: Saltillo 35% de llamadas perdidas y Guadalajara 23%, frente a Gonher BSN con 1.5%. Monterrey (Mty 9931) concentra el mayor volumen de la cuenta —6,238 llamadas— con 21% de pérdida. Las tres primeras fueron confirmadas por el cliente en la sesión del 4 Sep como las zonas de mayor afectación.',
    'La ventana de 19:00–20:00 sigue siendo el punto horario más crítico, con 52-73% de llamadas perdidas.',
    'FUENTE DISTINTA — Ismael Sádile presentó una recopilación propia de abril 2025 a agosto 2026: 48 reportes en 16 meses. NO es posible determinar cuánto se traslapa con los 46 tickets ya auditados por Callpicker; parecen conteos de alcance y posiblemente periodo distintos. Debe pedirse el desglose completo antes de usar esa cifra en cualquier comunicación.',
    'La redacción del resumen de sesión NO permite precisar si "problemas internos" en el historial de 16 meses se refiere a la operación del cliente o a la plataforma Callpicker. De esos 48 reportes, 14 fueron identificados como externos (del lado del cliente) por Callpicker.',
    'Hallazgos técnicos reportados por el cliente y no capturados en tickets: llamadas registradas como "contestadas" pero sin audio en ninguno de los dos sentidos · problemas de protocolo RTP, silencios y latencia alta · direcciones IP locales que aparecen justo en los momentos de falla y desaparecen al reconectar el equipo (consistente con el patrón NAT/IP del #113130) · casos donde el contacto parece colgar de inmediato al conectar, corroborados con pruebas en tiempo real.',
    'Falta de trazabilidad en llamadas que el sistema marca como "perdidas" pero que el cliente confirma como atendidas — afecta directamente su capacidad de auditar ventas y medir el desempeño de su personal.',
    'IMPACTO EN PERSONAL — Ismael Sádile describió un efecto negativo concreto en el call center: pérdida de oportunidades de venta y afectación de bonos ligados a desempeño, con riesgo de rotación de personal si no se resuelve. El costo no es solo técnico: es de retención de talento del cliente.',
    'El cliente confirmó las extensiones 158, 169 y 190 como puntos de concentración de afectaciones. Se acordó estandarizar un formato de mapeo entre extensión, ubicación física y rol (incluyendo home office) — Paola Bárcenas enviará la plantilla.',
    'Distribución de los 46 tickets históricos: 26% configuración operativa (12) · 20% consultas de nuevo contacto (9) · 20% conectividad/SIP/NAT (9) · 15% Agente Virtual/IA (7) · 9% facturación (4) · 9% calidad de audio/RTP (4) · 2% hardware (1).',
    'De los 19 eventos de la bitácora: 9 con causa en el origen del cliente, 3 de plataforma, 3 operativos, 2 de hardware (diademas Plantronics) y 2 indeterminados —uno porque el cliente no dio seguimiento a la solicitud de acceso remoto, otro porque no se logró replicar la falla.',
  ],

  cronologia: [
    { fecha: '29 Ago 2018',  responsable: 'Callpicker',              evento: 'Alta de la cuenta GRUPO 2711 (CID 12283, consecutivo C26). Cliente con 8 años de antigüedad.', tipo: 'ok' },
    { fecha: 'Abr 2025 – Ago 2026', responsable: 'Automotriz Maver (fuente propia)', evento: 'Historial propio del cliente: 48 reportes acumulados en 16 meses. Identifica lunes Y viernes como días de mayor recurrencia de llamadas perdidas. Sin reconciliar con los 46 tickets auditados por Callpicker.', tipo: 'neutral' },
    { fecha: 'Históricos',   responsable: 'Mesa SAC',                evento: 'Auditoría de 46 tickets: 26% configuración operativa · 20% consultas de nuevo contacto · 20% conectividad/SIP/NAT · 15% Agente Virtual · 9% facturación · 9% audio/RTP · 2% hardware.', tipo: 'neutral' },
    { fecha: '27 Jul · #111736', responsable: 'Origen (cliente)',    evento: 'App se "congela" en una extensión. Sin falla replicada; "expired" por pérdida de red / intermitencia local.', tipo: 'problema' },
    { fecha: '27 Jul · #111787', responsable: 'Hardware',            evento: 'Ext. 146 sin audio. Falla de micrófono en diadema Plantronics Blackwire C3210.', tipo: 'problema' },
    { fecha: '29 Jul · #111906', responsable: 'Hardware',            evento: 'Intermitencia general de audio. Botón de mute de diadema trabado físicamente.', tipo: 'problema' },
    { fecha: '29 Jul · #111999', responsable: 'Origen (cliente)',    evento: 'Cliente no escuchaba a la IA. Sin falla de conectividad/SIP/RTP; desconexión del lado del cliente / Agente Virtual.', tipo: 'problema' },
    { fecha: '30 Jul · #112096', responsable: 'Origen (cliente)',    evento: 'Llamada con audio cortado. Pérdida de paquetes de voz en el origen.', tipo: 'problema' },
    { fecha: '04 Ago · #112394', responsable: 'Origen (cliente)',    evento: 'Ext. 192, mayoría sin audio. Problema confirmado en el origen (quien marca).', tipo: 'problema' },
    { fecha: '05 Ago · #112532', responsable: 'Origen (cliente)',    evento: 'Ext. 199/192, mala recepción. Pérdida/retraso de paquetes de voz hacia el usuario.', tipo: 'problema' },
    { fecha: '05 Ago · sin ticket', responsable: 'PLATAFORMA',       evento: 'Falla masiva SIP (servidor collector): 10 min, 10 llamadas afectadas. Carga anormal en clúster de BD interno. Resuelta el mismo día.', tipo: 'problema' },
    { fecha: '08 Ago · #112684', responsable: 'Operativo',           evento: 'Alta de agente nuevo. Configuración inicial de extensión.', tipo: 'neutral' },
    { fecha: '14 Ago · #113130', responsable: 'Origen (cliente)',    evento: 'Intermitencia, llamada no llegó. La extensión enviaba la IP inválida 127.0.0.1 (configuración NAT).', tipo: 'problema' },
    { fecha: '15 Ago · sin ticket', responsable: 'Origen (cliente)', evento: 'No se escuchaba al operador virtual. El cliente confirmó error en su propia configuración.', tipo: 'problema' },
    { fecha: '19 Ago · #113516', responsable: 'Operativo',           evento: 'Llamadas no entran en equitativo. Grupo en equitativo con solo un par de extensiones disponibles.', tipo: 'neutral' },
    { fecha: '21 Ago · #113692', responsable: 'Origen (cliente)',    evento: 'Intermitencia general en viernes de alta demanda. Audio de origen y dispositivos; ext. 190/194/158/117/169.', tipo: 'problema' },
    { fecha: '25 Ago · sin ticket', responsable: 'Indeterminado',    evento: 'App congelada en pantalla de conexión. El cliente no dio seguimiento tras la solicitud de acceso remoto.', tipo: 'neutral' },
    { fecha: '26–27 Ago 2026', responsable: 'Dirección Callpicker',  evento: 'Dos sesiones internas: se decide exigir visita técnica presencial y encargado técnico del lado del cliente. Casos comparables citados: GTC y Polac.', tipo: 'pivote' },
    { fecha: '27 Ago · sin ticket', responsable: 'Indeterminado',    evento: 'Reporte general de llamadas que se siguen cortando. Sin pérdida de paquetes detectada; no se logró replicar la falla.', tipo: 'neutral' },
    { fecha: '28 Ago · sin ticket', responsable: 'Origen (destino)', evento: 'Clientes no escuchan al asesor en salientes. El destino colgaba al iniciar el asesor a hablar; sin falla de servicio.', tipo: 'problema' },
    { fecha: '29 Ago · #114229', responsable: 'PLATAFORMA',          evento: 'Cotización no se muestra en algunas llamadas: 130 min. Demora/omisión en eventos vía API/webhook — no intermitencia de llamada.', tipo: 'problema' },
    { fecha: '29 Ago · #114250', responsable: 'Operativo',           evento: 'Ajuste de softphone en ext. 169. Configuración de autorespuesta y bloqueo de ajustes.', tipo: 'neutral' },
    { fecha: '02 Sep · #114451', responsable: 'PLATAFORMA',          evento: 'Llamadas entrantes no enlazaban: 9 min, 19 entrantes y 9 salientes afectadas. Falla en SIP Legacy Collector; la migración a Atlas resolvió.', tipo: 'problema' },
    { fecha: '04 Sep 2026',  responsable: 'Claudia Hernández',       evento: 'Presentación del informe v2 al cliente. Expone 19,870 llamadas, 19 incidencias y solo 3 de plataforma. El cliente recibe las cifras SIN objeción — validación externa del diagnóstico.', tipo: 'ok' },
    { fecha: '04 Sep 2026',  responsable: 'Rodolfo M. (Maver)',      evento: 'HALLAZGO NUEVO: el Agente Virtual intercepta llamadas que los ejecutivos ya estaban atendiendo, generando pérdidas. Ya pagado por el cliente, hoy no utilizable de forma efectiva.', tipo: 'problema' },
    { fecha: '04 Sep 2026',  responsable: 'Automotriz Maver',        evento: 'HALLAZGO NUEVO: ~$25,000 MXN invertidos en diademas, cómputo y software para fallas cuya causa raíz era de configuración — se resolvieron creando una nueva extensión (Josué Ortiz y Kelly Villanueva).', tipo: 'problema' },
    { fecha: '04 Sep 2026',  responsable: 'Joaquin Martinez',        evento: 'La dirección de Callpicker ofrece disculpa formal, reconoce que las fallas NO son esporádicas y compromete inversión para resolver la situación.', tipo: 'pivote' },
    { fecha: '04 Sep 2026',  responsable: 'Ambas partes',            evento: 'Se acuerda cambiar la métrica de éxito: de fallas técnicas resueltas a indicadores de negocio del cliente (llamadas perdidas y ventas). Se aprueba la visita física de diagnóstico para 1-2 semanas.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'GRUPO 2711 — opera como Automotriz Maver' },
    { label: 'CID Zoho',              value: '12283' },
    { label: 'Consecutivo',           value: 'C26' },
    { label: 'Sector',                value: 'Mantenimiento, reparación y servicio integral automotriz multimarcas' },
    { label: 'Cliente desde',         value: 'Agosto 2018 (8 años)' },
    { label: 'MRR reportado',         value: '$7,485 MXN/mes' },
    { label: 'Volumen analizado',     value: '19,870 llamadas — 15,858 entrantes + 4,012 salientes (CDR del periodo)' },
    { label: 'Dirección general',     value: 'Marcelo — marcelo.mm@eamaver.com · abierto a invertir "si se le indica exactamente qué hacer"' },
    { label: 'Contacto técnico de facto', value: 'Ismael Sádile — reporta la mayoría de los eventos; presentó el historial de 16 meses' },
    { label: 'Asesora de cuenta',     value: 'Claudia Hernández' },
    { label: 'Productos en uso',      value: 'Conmutador + Agente Virtual (pagado, hoy no utilizable de forma efectiva por interceptar llamadas ya atendidas)' },
    { label: 'Infraestructura del cliente', value: 'Sin encargado de sistemas · equipos no homologados · enlaces domésticos en sitios remotos (incl. Saltillo) · ~$25,000 MXN ya gastados en hardware que no resolvió la causa real' },
    { label: 'Sucursal peor',         value: 'LTH Battery City Saltillo — 35% de llamadas perdidas sobre 749 llamadas' },
    { label: 'Sucursal de referencia',value: 'Gonher BSN — 1.5% de pérdida sobre 1,675 llamadas · mejor desempeño de toda la cuenta' },
    { label: 'Mayor volumen',         value: 'LTH Battery City Mty 9931 — 6,238 llamadas con 21% de pérdida' },
    { label: 'Extensiones críticas',  value: '158, 169 y 190 — confirmadas por el cliente el 4 Sep · también 117, 146, 169, 192, 194, 199' },
    { label: 'Ventana horaria crítica', value: '19:00–20:00 — 52-73% de llamadas perdidas' },
    { label: 'Servidor implicado',    value: 'SIP Legacy Collector — 2 de los 3 incidentes de plataforma · la migración a Atlas resolvió el del 2 Sep' },
  ],

  necesidad_negocio:
    'A partir del 4 de septiembre la necesidad del cliente dejó de expresarse en términos técnicos. Automotriz Maver no quiere un conteo de fallas resueltas: quiere que bajen las llamadas perdidas y suban las ventas. Ese cambio de métrica lo acordaron ambas partes en la sesión y redefine qué significa "éxito" en esta cuenta.\n\n' +
    'Debajo de eso hay tres necesidades concretas. Primera: que el Agente Virtual que ya pagaron funcione — hoy intercepta llamadas que los ejecutivos ya estaban atendiendo, de modo que el producto comprado para capturar llamadas perdidas está generando pérdidas. Segunda: que las tres sucursales críticas —Saltillo 35%, Guadalajara 23%, Monterrey 21%— alcancen algo parecido al 1.5% de Gonher BSN, que demuestra que el servicio sí opera bien cuando la infraestructura acompaña. Tercera: trazabilidad, porque hoy hay llamadas marcadas como "perdidas" que el cliente confirma como atendidas, y eso le impide auditar sus propias ventas y evaluar a su gente.\n\n' +
    'Y hay una necesidad que no es del sistema sino de las personas: los bonos del call center están ligados a un desempeño que las fallas técnicas distorsionan. Ismael Sádile advirtió riesgo de rotación. El costo de no resolver ya no es solo un ticket abierto.',

  potencial_corto: [
    'Corregir la lógica del Agente Virtual para que deje de interceptar llamadas ya atendidas — es la prioridad número uno de la v3 y no es una venta nueva: es hacer funcionar lo ya pagado.',
    'Confirmar la metodología detrás del 0.8% de afectación antes de reutilizar la cifra en cualquier comunicación.',
    'Ejecutar la visita técnica presencial ya aprobada (1-2 semanas), priorizando Saltillo, Guadalajara y Monterrey (Mty 9931).',
    'Recibir y aplicar la plantilla de mapeo extensión / ubicación física / rol home office que enviará Paola Bárcenas.',
    'Analizar la hora de grabaciones que entregará el cliente, con foco en la calidad de audio de la IA.',
  ],

  potencial_largo: [
    'Kit de equipo homologado con foco en Saltillo y Guadalajara — pero SOLO después de descartar causa de configuración, lección directa del gasto de $25,000 MXN.',
    'SLA diferenciado para solicitudes de integración de Agente Virtual.',
    'Evaluación técnica interna de migrar la cuenta completa del servidor Legacy Collector a Atlas — la migración ya resolvió el incidente del 2 de septiembre.',
    'Definir indicadores de negocio conjuntos (llamadas perdidas, ventas) como métrica formal de éxito del servicio, según lo acordado el 4 de septiembre.',
    'Establecer como requisito de venta, para cuentas de perfil similar, un responsable técnico designado desde la contratación.',
  ],

  tacticas: [
    { nombre: 'Reconfiguración del Agente Virtual',        descripcion: 'Corregir la lógica de enrutamiento para que capture llamadas perdidas en lugar de interceptar las ya atendidas. No es venta nueva: es hacer entregable un desarrollo ya pagado.', impacto: 'Convierte un gasto hundido en valor entregado y ataca justo el problema que el cliente contrató resolver.' },
    { nombre: 'Protocolo de diagnóstico antes de hardware', descripcion: 'Estandarizar el diagnóstico de extensiones problemáticas para descartar causa de configuración antes de recomendar cualquier gasto en equipo.', impacto: 'Evita repetir el patrón de los $25,000 MXN — es la recomendación que nace directamente de la frustración del cliente.' },
    { nombre: 'Visita técnica priorizada por sucursal',     descripcion: 'Aprobada en la sesión del 4 Sep, para 1-2 semanas. Foco en Saltillo (35%), Guadalajara (23%) y Monterrey Mty 9931 (21%, mayor volumen de la cuenta).', impacto: 'Ataca el 60% del problema medido, con Gonher BSN (1.5%) como referencia interna de qué se ve bien.' },
    { nombre: 'Mapeo extensión / ubicación / rol',          descripcion: 'Plantilla que enviará Paola Bárcenas, correlacionando cada extensión con ubicación física y rol, incluyendo home office. Ismael Sádile la completa con la información de red.', impacto: 'Elimina la ambigüedad que hoy hace difícil diagnosticar extensiones como la 158 y la 190.' },
    { nombre: 'Migración de Legacy Collector a Atlas',      descripcion: 'Dos de los tres incidentes de plataforma involucran el SIP Legacy Collector; la migración a Atlas ya resolvió el del 2 de septiembre.', impacto: 'Reduce la dependencia de un componente con fallas repetidas.' },
    { nombre: 'Métrica de negocio compartida',              descripcion: 'Medir el servicio por llamadas perdidas y ventas del cliente, no por fallas técnicas cerradas. Acordado por ambas partes el 4 Sep.', impacto: 'Alinea los objetivos y hace visible el avance en el lenguaje que le importa a la dirección del cliente.' },
  ],

  senal_alarma:
    '🔴 El Agente Virtual, ya pagado por el cliente, hoy RESTA valor: intercepta llamadas que los ejecutivos ya estaban atendiendo. Si no se corrige pronto, el cliente puede concluir con razón que pagó por una herramienta que empeora exactamente el problema que buscaba resolver. Es el riesgo reputacional más concreto de la cuenta.\n\n' +
    '🔴 Riesgo de rotación de personal del lado del cliente: los bonos del call center están ligados a un desempeño que las fallas técnicas distorsionan. Ismael Sádile lo planteó como consecuencia directa. El costo dejó de ser técnico.\n\n' +
    '⚠ El gasto de ~$25,000 MXN en hardware que no resolvió la causa real es un antecedente que el cliente va a recordar en la siguiente recomendación de compra. Cualquier nueva propuesta de equipo sin diagnóstico de configuración previo repetirá el patrón y quemará la credibilidad restante.\n\n' +
    '⚠ PRECAUCIÓN DE CIFRAS: el 0.8% de afectación citado al cliente no reconcilia aritméticamente con los conteos dados en la misma sesión (~0.19–0.24%). No repetir la cifra hasta confirmar la metodología. Y los 48 reportes del historial de 16 meses provienen de una recopilación propia del cliente, sin reconciliar con los 46 tickets auditados — no mezclar ambos conteos.',

  problema_raiz:
    'La cuenta tiene dos problemas raíz simultáneos y de naturaleza distinta: uno estructural del lado del cliente —infraestructura y gobernanza técnica ausentes— y uno propio de Callpicker: un producto ya cobrado que está mal configurado y una práctica de diagnóstico que llevó al cliente a gastar en hardware antes de descartar configuración.',

  problema_raiz_detalle:
    'La primera capa se sostiene con los datos y no cambió en la v3: de los 19 eventos de la bitácora, 9 tienen causa en el origen del cliente y solo 3 son de plataforma; el clúster técnico del histórico (conectividad/SIP/NAT 20% + audio/RTP 9% + hardware 2%) nunca se atribuyó a la plataforma tras análisis de trazados. La disparidad por sucursal lo confirma desde otro ángulo: Gonher BSN opera al 1.5% de pérdida mientras Saltillo está en 35%, con el mismo servicio detrás. La diferencia no está en Callpicker.\n\n' +
    'Pero la v3 añade una segunda capa que sí es responsabilidad de Callpicker, y conviene no diluirla. El Agente Virtual está mal configurado: intercepta llamadas que los ejecutivos ya estaban atendiendo, de modo que el producto vendido para capturar llamadas perdidas las está generando. Ya fue pagado. Y el cliente gastó ~$25,000 MXN en diademas, cómputo y software persiguiendo una falla cuya causa raíz era de configuración —se resolvió creando una nueva extensión para Josué Ortiz y Kelly Villanueva—. Ese gasto pudo evitarse con un diagnóstico más temprano, y el cliente lo dijo directamente en la sesión.\n\n' +
    'Hay además tres incidentes de plataforma reales en el periodo, no uno: 5 Ago (10 min, servidor collector), 29 Ago (130 min, eventos vía API/webhook) y 2 Sep (9 min, SIP Legacy Collector). Dos de los tres involucran el mismo componente de infraestructura. Joaquin Martinez lo reconoció ante el cliente: las fallas no son esporádicas.\n\n' +
    'La consecuencia comercial de la v3 es distinta a la de las versiones anteriores. Ya no basta con demostrar que la mayoría de las fallas vienen del cliente —eso el cliente lo aceptó sin objetar los números—. Lo que queda pendiente es la parte que sí corresponde a Callpicker, y es la que hoy define si la cuenta se estabiliza o se deteriora.',

  flujo_real: [
    { fase: 'Reporte',            area: 'Automotriz Maver (Ismael / Marcelo)', accion: 'Las incidencias se reportan por WhatsApp o ticket, concentradas en un canal informal sin encargado técnico formal.', resultado: 'Ismael Sádile reporta la mayoría de los 19 eventos; Marcelo reporta directo por WhatsApp.' },
    { fase: 'Diagnóstico',        area: 'Mesa SAC Callpicker',                accion: 'Análisis de trazados, espectro de audio y logs de registro por evento.',                                                resultado: '9 de 19 eventos con causa en el origen del cliente; 3 de plataforma; 2 indeterminados por falta de seguimiento o imposibilidad de réplica.' },
    { fase: 'Gasto evitable',     area: 'Cliente (decisión de compra)',       accion: 'Ante fallas persistentes en ciertas extensiones, el cliente invierte ~$25,000 MXN en diademas, cómputo y software.',      resultado: 'No resolvió. La causa era de configuración: se corrigió creando una nueva extensión para los ejecutivos afectados.' },
    { fase: 'Agente Virtual',     area: 'Producto ya pagado',                 accion: 'El AV contesta llamadas entrantes según su lógica de enrutamiento actual.',                                              resultado: 'Intercepta llamadas que los ejecutivos ya estaban atendiendo — genera pérdidas en lugar de evitarlas.' },
    { fase: 'Plataforma',         area: 'SIP Legacy Collector / API',         accion: 'Tres incidentes en el periodo: 5 Ago (10 min), 29 Ago (130 min), 2 Sep (9 min).',                                        resultado: '38 llamadas afectadas contabilizadas. La migración a Atlas resolvió el del 2 Sep.' },
    { fase: 'Trazabilidad',       area: 'Registro de llamadas',               accion: 'El sistema clasifica llamadas como "perdidas".',                                                                          resultado: 'El cliente confirma que varias fueron atendidas — no puede auditar ventas ni evaluar a su personal con esos datos.' },
    { fase: 'Impacto en personal',area: 'Call center del cliente',            accion: 'Los bonos están ligados a desempeño medido con esos registros.',                                                          resultado: 'Pérdida de oportunidades de venta, afectación de bonos y riesgo de rotación declarado por el cliente.' },
    { fase: 'Sesión con cliente', area: 'Callpicker ↔ Automotriz Maver',      accion: 'Presentación del informe v2 el 4 Sep; disculpa formal de dirección; acuerdo de cambio de métrica.',                       resultado: 'Cifras validadas sin objeción, dos hallazgos nuevos, visita física aprobada y plan de acción conjunto.' },
  ],

  comparativo: [
    { metrica: 'LTH Battery City Saltillo',        real: '749 llamadas · 35% perdidas — la peor de la cuenta',            ideal: '1.5% (Gonher BSN) · confirmada por el cliente como zona de mayor afectación' },
    { metrica: 'LTH Battery City Guadalajara',     real: '1,652 llamadas · 23% perdidas',                                  ideal: '1.5% (Gonher BSN) · confirmada por el cliente como sucursal de mayor afectación' },
    { metrica: 'Maver Las Torres 3108',            real: '114 llamadas · 23% perdidas',                                    ideal: 'Volumen bajo pero tasa igual de alta que Guadalajara — no dejarla fuera de la visita' },
    { metrica: 'LTH Battery City Mty 9931',        real: '6,238 llamadas · 21% perdidas — mayor volumen de la cuenta',     ideal: 'Prioridad por impacto absoluto: es donde el mismo % duele más' },
    { metrica: 'Maver Apodaca 9035',               real: '1,072 llamadas · 15% perdidas',                                  ideal: 'Segunda ola de la visita técnica' },
    { metrica: 'Grupo Maver (Churubusco/Cumbres/L. Cárdenas)', real: '~2,900 llamadas · 11% perdidas',                     ideal: 'Desempeño consistente y saludable — no requiere intervención inmediata' },
    { metrica: 'Gonher BSN',                       real: '1,675 llamadas · 1.5% perdidas',                                 ideal: 'ES el ideal — referencia interna de buena práctica dentro de la misma cuenta' },
    { metrica: 'Ventana 19:00–20:00',              real: '52-73% de llamadas perdidas',                                    ideal: 'El punto horario más crítico; cobertura de turno a revisar en la visita' },
    { metrica: 'Incidentes de plataforma',         real: '3 en el periodo (10 min · 130 min · 9 min)',                     ideal: 'Joaquin Martinez reconoció ante el cliente que no son esporádicos' },
    { metrica: 'Afectación de plataforma sobre el total', real: '0.8% citado al cliente · ~0.19–0.24% por cálculo directo', ideal: 'Metodología confirmada antes de repetir la cifra' },
    { metrica: 'Agente Virtual',                   real: 'Pagado y no utilizable — intercepta llamadas ya atendidas',      ideal: 'Capturando llamadas que de otro modo se perderían' },
    { metrica: 'Diagnóstico previo a compra de hardware', real: '~$25,000 MXN gastados antes de descartar configuración',  ideal: 'Protocolo obligatorio de diagnóstico de configuración antes de recomendar gasto' },
  ],

  plan_inmediato: [
    { accion: 'Revisar y corregir la lógica del Agente Virtual para que deje de interceptar llamadas ya atendidas por ejecutivos.', responsable: 'Ingeniería / Daniel Martínez Loyola', criterio: 'AV capturando llamadas perdidas en vez de generarlas — validado con el cliente.' },
    { accion: 'Confirmar la metodología detrás del 0.8% de afectación citado en la sesión, antes de reutilizar la cifra.',          responsable: 'Daniel Martinez',                     criterio: 'Metodología documentada o cifra corregida a ~0.19–0.24%.' },
    { accion: 'Compartir la presentación de hallazgos de la sesión para cotejo de datos interno del cliente.',                      responsable: 'Ismael Sádile (Maver)',               criterio: 'Presentación entregada y cotejada.' },
    { accion: 'Enviar la plantilla de mapeo de extensiones y la documentación del modelo de trabajo remoto.',                        responsable: 'Paola Bárcenas',                      criterio: 'Plantilla en manos del cliente.' },
    { accion: 'Actualizar el listado de extensiones con la información de red solicitada.',                                          responsable: 'Ismael Sádile (Maver)',               criterio: 'Listado completo con ubicación física y rol, incluido home office.' },
    { accion: 'Coordinar la logística de la visita física vía correo de soporte técnico, con copia a Claudia Hernández.',            responsable: 'El grupo',                            criterio: 'Fecha y agenda confirmadas.' },
    { accion: 'Entregar una hora de grabaciones para análisis de calidad de audio, con foco en los problemas de la IA.',             responsable: 'Automotriz Maver',                    criterio: 'Grabaciones recibidas y analizadas.' },
  ],

  plan_mediano: [
    { accion: 'Ejecutar la visita técnica ya aprobada (1-2 semanas), priorizando Saltillo, Guadalajara y Monterrey (Mty 9931).', responsable: 'Daniel Martínez Loyola', criterio: 'Visita realizada con inventario de infraestructura por sucursal documentado.' },
    { accion: 'Establecer un protocolo de diagnóstico de configuración obligatorio ANTES de recomendar cualquier gasto en hardware al cliente.', responsable: 'Dirección SAC', criterio: 'Protocolo escrito y aplicado — evita repetir el caso de los $25,000 MXN.' },
    { accion: 'Solicitar el desglose completo de los 48 reportes históricos (16 meses) para reconciliarlos con la auditoría de 46 tickets.', responsable: 'Claudia Hernández', criterio: 'Desglose recibido y traslape cuantificado; ambigüedad de "problemas internos" resuelta.' },
    { accion: 'Definir indicadores de negocio conjuntos (llamadas perdidas, ventas) como métrica de éxito del servicio.',        responsable: 'Dirección SAC / Cliente', criterio: 'Indicadores acordados y con línea base, según lo pactado el 4 de septiembre.' },
    { accion: 'Monitorear lunes Y viernes en el seguimiento continuo, sin cerrar el tema del viernes con la lectura corta de la v2.', responsable: 'Claudia Hernández', criterio: 'Reporte de recurrencia por día sobre ventana larga.' },
  ],

  plan_estrategico: [
    { accion: 'Evaluación técnica interna de migrar la cuenta del servidor Legacy Collector a Atlas.',                         responsable: 'Ingeniería Callpicker', criterio: 'Evaluación concluida — 2 de los 3 incidentes de plataforma involucran ese componente.' },
    { accion: 'Definir el SLA diferenciado para solicitudes de integración de Agente Virtual.',                                 responsable: 'Dirección SAC',        criterio: 'SLA publicado y comunicado al cliente.' },
    { accion: 'Establecer como requisito de venta, para cuentas de perfil similar, un responsable técnico designado desde la contratación.', responsable: 'Dirección Callpicker', criterio: 'Requisito incorporado al proceso comercial del siguiente ciclo.' },
    { accion: 'Consolidar el cambio de enfoque: reportar el servicio por impacto en el negocio del cliente, no por fallas cerradas.', responsable: 'Dirección Callpicker', criterio: 'Reporte mensual de la cuenta expresado en llamadas perdidas y ventas.' },
  ],

  areas_oportunidad: [
    { area: 'Reconfiguración del Agente Virtual',        impacto: 'Prioridad inmediata — no es venta nueva, es hacer funcionar lo ya pagado. Hoy resta valor.',                     responsable: 'Ingeniería / SAC' },
    { area: 'Visita técnica por sucursal',               impacto: 'Muy alto — Saltillo, Guadalajara y Mty 9931 concentran la pérdida; Gonher BSN prueba que el servicio funciona.', responsable: 'Daniel Martínez Loyola' },
    { area: 'Protocolo de diagnóstico antes de hardware', impacto: 'Alto — evita repetir el gasto evitable de $25,000 MXN y recupera credibilidad en las recomendaciones de compra.', responsable: 'Dirección SAC' },
    { area: 'Kit de equipo homologado',                  impacto: 'Alto, pero SOLO después de descartar configuración. Foco en Saltillo y Guadalajara.',                            responsable: 'Comercial / SAC' },
    { area: 'Migración de Legacy Collector a Atlas',     impacto: 'Alto — reduce la dependencia del componente implicado en 2 de los 3 incidentes de plataforma.',                   responsable: 'Ingeniería Callpicker' },
    { area: 'SLA de integraciones de Agente Virtual',    impacto: 'Medio — corrige la categoría con los cierres más largos de la cuenta.',                                           responsable: 'Dirección SAC' },
    { area: 'Trazabilidad de llamadas mal clasificadas', impacto: 'Medio-alto — habilita al cliente a auditar ventas y evaluar personal, base del nuevo enfoque de métricas.',       responsable: 'Ingeniería / SAC' },
  ],

  perfiles: [
    {
      nombre: 'Marcelo',
      rol:    'Dirección general — Automotriz Maver',
      color:  '#6366f1',
      campos: [
        { label: 'Contacto',       value: 'marcelo.mm@eamaver.com' },
        { label: 'Disposición',    value: 'Abierto a invertir "si se le indica exactamente qué hacer".' },
        { label: 'Canal',          value: 'Reporta incidencias directamente por WhatsApp.' },
        { label: 'Siguiente paso', value: 'Destinatario de la propuesta de infraestructura, una vez descartada la causa de configuración.' },
      ],
    },
    {
      nombre: 'Ismael Sádile',
      rol:    'Usuario técnico de facto — Automotriz Maver',
      color:  '#f59e0b',
      campos: [
        { label: 'Peso',        value: 'Reporta la mayoría de los eventos de la bitácora.' },
        { label: 'Aporte v3',   value: 'Presentó el historial propio de 16 meses (abr 2025 – ago 2026, 48 reportes) que identifica lunes Y viernes como días de mayor recurrencia.' },
        { label: 'Impacto',     value: 'Describió el efecto en el personal: pérdida de oportunidades de venta, afectación de bonos y riesgo de rotación.' },
        { label: 'Compromisos', value: 'Compartir la presentación de hallazgos y actualizar el listado de extensiones con información de red.' },
      ],
    },
    {
      nombre: 'Rodolfo M.',
      rol:    'Participante en la sesión del 4 Sep — Automotriz Maver',
      color:  '#ef4444',
      campos: [
        { label: 'Hallazgo crítico', value: 'Reportó que el Agente Virtual intercepta llamadas que los ejecutivos ya estaban atendiendo, generando pérdidas en lugar de evitarlas.' },
        { label: 'Implicación',      value: 'Convierte un desarrollo ya pagado en un pasivo operativo hasta que se corrija la lógica de enrutamiento.' },
      ],
    },
    {
      nombre: 'Joselyn',
      rol:    'Operación de línea / grupo RG Maver',
      color:  '#94a3b8',
      campos: [
        { label: 'Caso', value: 'Reportó la configuración de timbrado equitativo con solo un par de extensiones disponibles (#113516).' },
      ],
    },
    {
      nombre: 'Alberto David Avilés Reyna',
      rol:    'Invitado a la sesión del 4 Sep',
      color:  '#94a3b8',
      campos: [
        { label: 'Nota', value: 'Sin rol específico detallado en el resumen de la sesión.' },
      ],
    },
    {
      nombre: 'Joaquin Martinez',
      rol:    'Dirección Callpicker',
      color:  '#0057FF',
      campos: [
        { label: 'Acción v3',  value: 'Ofreció una disculpa formal al cliente el 4 de septiembre.' },
        { label: 'Reconoció',  value: 'Que las fallas NO son esporádicas, y comprometió inversión para resolver la situación.' },
        { label: 'Efecto',     value: 'Reduce el riesgo de que el cliente perciba evasiva — pero fija una expectativa que hay que cumplir.' },
      ],
    },
    {
      nombre: 'Daniel Martínez Loyola',
      rol:    'Director Customer Experience / Dirección SAC — Callpicker',
      color:  '#22c55e',
      campos: [
        { label: 'Compromiso', value: 'Coordinará la visita técnica en 1-2 semanas.' },
        { label: 'Enfoque',    value: 'Enfatizó el seguimiento por sucursal, extensión y horario.' },
        { label: 'Pendiente',  value: 'Confirmar la metodología detrás del 0.8% de afectación que citó en la sesión.' },
      ],
    },
    {
      nombre: 'Claudia Hernández',
      rol:    'Asesora de cuenta — presentó el análisis al cliente',
      color:  '#0057FF',
      campos: [
        { label: 'Aporte v3',   value: 'Presentó las 19,870 llamadas y las 19 incidencias en la sesión del 4 Sep.' },
        { label: 'Validación',  value: 'El cliente recibió sus cifras sin objeción — validación externa del diagnóstico de las versiones anteriores.' },
      ],
    },
    {
      nombre: 'Paola Bárcenas',
      rol:    'Mesa SAC Callpicker — 24% del volumen histórico',
      color:  '#22c55e',
      campos: [
        { label: 'Aclaración', value: 'Precisó duración y causa de la segunda falla de plataforma (API/webhook, 130 min).' },
        { label: 'Compromiso', value: 'Enviará la plantilla de mapeo de extensiones y la documentación del modelo de trabajo remoto.' },
      ],
    },
    {
      nombre: 'Pablo Soto',
      rol:    'Mesa SAC Callpicker — 24% del volumen histórico',
      color:  '#22c55e',
      campos: [
        { label: 'Hallazgo', value: 'Identificó la causa de puertos del ISP (Telmex 5060/4061) que acumula fallas menores por renovación de IP.' },
      ],
    },
    {
      nombre: 'Mario Hernández',
      rol:    'Mesa SAC Callpicker — 20% del volumen histórico',
      color:  '#22c55e',
      campos: [
        { label: 'Aporte', value: 'Atendió la mayoría de los casos de audio/RTP con análisis de trazados.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Las cifras centrales del informe fueron validadas externamente por el cliente, sin objeción, en la sesión del 4 de septiembre.',
      'Existe una sucursal de referencia dentro de la propia cuenta —Gonher BSN, 1.5% de pérdida— que demuestra que el servicio opera bien cuando la infraestructura del cliente es adecuada.',
      'La dirección de Callpicker reconoció el problema abiertamente y comprometió inversión, lo que reduce el riesgo de que el cliente perciba evasiva.',
      'Capacidad de diagnóstico demostrada: trazados, espectro de audio, logs de registro y CDR de 19,870 llamadas con causa raíz identificada en la mayoría de los eventos.',
    ],
    oportunidades: [
      'Reconfigurar el Agente Virtual para que capture llamadas perdidas en vez de interceptar las ya atendidas — convierte un gasto hundido en valor entregado.',
      'El cambio de enfoque acordado —medir por indicadores de negocio y no solo por fallas resueltas— alinea mejor los objetivos de ambas partes.',
      'La visita técnica ya programada (1-2 semanas) es la oportunidad de resolver Saltillo, Guadalajara y Monterrey con datos concretos en mano.',
      'La migración a Atlas ya probó que resuelve el tipo de falla del SIP Legacy Collector — hay un camino técnico validado.',
    ],
    debilidades: [
      'El Agente Virtual, ya pagado por el cliente, actualmente resta valor en lugar de sumarlo.',
      'Historial de diagnósticos que llevaron a un gasto de hardware evitable (~$25,000 MXN) cuando la causa era de configuración.',
      'Dependencia de un componente de infraestructura (SIP Legacy Collector) con fallas repetidas — 2 de los 3 incidentes de plataforma.',
      'Falta de trazabilidad en llamadas mal clasificadas como "perdidas", lo que impide al cliente auditar su propio desempeño de ventas.',
      'Sin responsable técnico interno del lado del cliente ni equipo homologado — causa estructural de la recurrencia.',
    ],
    amenazas: [
      'Riesgo de rotación de personal del lado del cliente por frustración y pérdida de bonos ligados a fallas técnicas.',
      'Si el Agente Virtual no se corrige pronto, el cliente puede percibir que pagó por una herramienta que empeora el problema que buscaba resolver.',
      'Nuevas inversiones en hardware sin diagnóstico de configuración previo podrían repetir el patrón de gasto evitable ya ocurrido.',
      'La disculpa formal y el compromiso de inversión fijan una expectativa: un avance lento después del 4 de septiembre se leerá como incumplimiento, no como demora.',
    ],
  },

  conclusion:
    'La presentación del 4 de septiembre confirma que el trabajo de diagnóstico de las versiones anteriores es correcto en sus números centrales, y añade dos hallazgos que cambian la prioridad de acción: el Agente Virtual necesita corrección urgente porque hoy resta valor a algo ya pagado, y el patrón de gasto en hardware sin diagnóstico de configuración previo debe evitarse hacia adelante.\n\n' +
    'La relación entra en una etapa distinta: de auditoría técnica a plan de acción conjunto, con una visita física en puerta y un cambio de enfoque hacia indicadores de negocio que ambas partes ya aceptaron como la métrica que importa.\n\n' +
    '⚠ LÍMITES DE LOS DATOS (§19 del documento — se conservan íntegros):\n' +
    '1. La cifra de 0.8% de afectación NO reconcilia aritméticamente con los conteos de llamadas afectadas dados en la misma sesión; se reporta con la inconsistencia señalada.\n' +
    '2. El historial de 48 reportes en 16 meses proviene de una fuente distinta —recopilación propia del cliente— y no se ha reconciliado con los 46 tickets ya auditados.\n' +
    '3. La redacción del resumen de la sesión no permite precisar si "problemas internos" en ese historial se refiere al cliente o a Callpicker.\n' +
    '4. El estado "Lost" en llamadas salientes sigue sin definición confirmada (pendiente desde la v2).\n' +
    '5. Los resúmenes de reunión son síntesis de terceros, no transcripciones verbatim.',

  pierde: [
    'El valor de un Agente Virtual ya cobrado que hoy genera pérdidas en lugar de evitarlas.',
    'Credibilidad en las recomendaciones de compra, tras un gasto de ~$25,000 MXN del cliente que no atacó la causa real.',
    'Horas de mesa SAC absorbidas por fallas cuyo origen está en la infraestructura del cliente (9 de 19 eventos recientes).',
    'Precisión de reporte mientras el 0.8% de afectación siga sin metodología confirmada.',
    'Margen de paciencia: la disculpa formal y el compromiso de inversión suben el costo de un avance lento.',
  ],

  gana: [
    'Una cuenta de 8 años estabilizada sobre un plan de acción conjunto que el cliente ya aceptó.',
    'Un Agente Virtual funcional que resuelve justo el problema que la cuenta viene documentando — sin necesidad de una venta nueva.',
    'La visita técnica aprobada como puerta de entrada al levantamiento de infraestructura y al kit homologado, con datos por sucursal en la mano.',
    'Una métrica compartida (llamadas perdidas y ventas) que hace visible el avance en el lenguaje de la dirección del cliente.',
    'Un protocolo de diagnóstico previo a hardware y un requisito comercial de responsable técnico, replicables a todo el ciclo de venta.',
  ],

  recomendacion_central:
    'La prioridad número uno de esta versión es corregir la lógica del Agente Virtual para que deje de interceptar llamadas ya atendidas: no es una venta nueva, es hacer funcionar lo que el cliente ya pagó, y es exactamente la solución al problema que este informe viene documentando. ' +
    'En paralelo, confirmar la metodología del 0.8% antes de volver a citarlo, y ejecutar la visita técnica aprobada en 1-2 semanas priorizando Saltillo (35%), Guadalajara (23%) y Monterrey Mty 9931 (21%, mayor volumen), con Gonher BSN (1.5%) como referencia de qué se ve bien. ' +
    'Antes de recomendar cualquier gasto en hardware, aplicar el protocolo de diagnóstico de configuración: el antecedente de los $25,000 MXN no admite una segunda vez. ' +
    'Y sostener el cambio de enfoque acordado el 4 de septiembre — reportar la cuenta por llamadas perdidas y ventas, no por tickets cerrados.',

  documentos: [
    {
      nombre:      'Auditoría Corporativa Integral · Grupo 2711 — v3',
      ruta:        '/docs/Auditoria_Corporativa_Integral_Grupo2711_v3.docx',
      descripcion: 'José Manuel López Delgadillo · 4 Sep 2026. Integra cinco fuentes: auditoría histórica de 46 tickets, bitácora de 19 eventos (27 Jul–2 Sep), CDR de 19,870 llamadas (15,858 entrantes + 4,012 salientes), dos sesiones internas (26-27 Ago) y la sesión de presentación al cliente del 4 Sep. Incluye las 8 figuras: volumen diario con incidentes marcados, pérdidas por día de la semana, pérdidas por hora, disparidad por sucursal, cronología de los 19 eventos, distribución por causa raíz, recurrencia de extensiones y distribución de los 46 tickets por agente SAC.',
    },
    {
      nombre:      'Auditoría Corporativa Integral de Tickets · Grupo 2711 — v1',
      ruta:        '/docs/Auditoria_Tickets_Corporativa_Integral_Grupo2711.docx',
      descripcion: 'Versión anterior (26 Ago 2026), conservada como antecedente: auditoría de 46 tickets, bitácora de 13 eventos y resumen de la sesión interna del 26 Ago.',
    },
  ],
}
