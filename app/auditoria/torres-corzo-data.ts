import type { AuditoriaCase } from './types'

/**
 * GRUPO TORRES CORZO (D1 · CID 130723) — la cuenta MAYOR de la cartera.
 *
 * Primera auditoría, 12 oct 2026. Se pudo escribir porque ese mismo día entró
 * la lectura de llamadas de esta cuenta: hasta entonces el tablero decía «no
 * tenemos sus llamadas» y mandaba al asesor a pedirle el Excel al cliente.
 *
 * TODAS las cifras salen de fuente y están verificadas una por una:
 *   · llamadas  â†’ app/cuentas/llamadas-data.ts, CID 130723 (entrega oct-2026)
 *   · tickets   â†’ lib/tickets-data.json, 203 filas de «GTC Contact Center»
 *   · alertas   â†’ alertas_episodios, 3 abiertos
 *   · ficha     â†’ tabla `cuentas`, registro completo
 *   · el grupo  â†’ gtc-mx.com y prensa de Nissan Mexicana
 */
export const TORRES_CORZO: AuditoriaCase = {
  id: 'torres-corzo',
  asesor: 'Dan',
  nombre: 'Grupo Torres Corzo Automotriz (GTC)',
  sector: 'Automotriz — red de concesionarias Nissan, 5 estados',
  fecha_periodo: 'Marzo 2021 â€“ Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA — la MAYOR de la cartera',
  descripcion_contexto: '56 meses de cliente · $316,541 al mes, el 14.8% de la cartera · 208,255 llamadas entrantes y 594,523 salientes medidas · 203 tickets · Auditoría de atención telefónica + servicio',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.1',

  kpis: [
    { label: 'Sin contestar · septiembre', value: '24,341 de 43,860 · 55.5%', color: '#ef4444' },
    { label: 'Contra su propia base',      value: '+35.2 pts (era 20.3%)',    color: '#ef4444' },
    { label: 'Línea de autos nuevos',      value: '372 de 13,177 · 2.8%',     color: '#f97316' },
    { label: 'Folio 106428 sin moverse',   value: '155 días fuera de SLA',    color: '#f59e0b' },
    { label: 'Facturación en juego',       value: '$316,541 MXN / mes',       color: '#6366f1' },
  ],

  resumen_ejecutivo: 'Grupo Torres Corzo es la cuenta más grande de la cartera: $316,541 al mes, el 14.8% de todo lo que factura Customer Success, y cliente desde marzo de 2021. Opera concesionarias Nissan en cinco estados con 32 oficinas y unos 1,200 empleados. Su contrato con Callpicker es de Agentes Virtuales, y su operación telefónica no es un servicio de soporte: es el canal por el que entra quien quiere comprar un coche.\n\nEn septiembre de 2026 esa operación se rompió. Entraron 43,860 llamadas —el doble de su media de enero a agosto— y 24,341 se quedaron sin contestar: 55 de cada 100. Su propia base previa era del 20.3%. Son 35.2 puntos de deterioro en un solo mes, y no es un efecto del volumen: de las 22 cuentas de esta misma entrega, la mediana se movió 0.94x en septiembre, y otra que también dobló su tráfico mantuvo su tasa de pérdida intacta. Aquí no es que entraran más llamadas: es que no pudieron tomarlas.\n\nEl desglose por destino dice dónde. Tres extensiones llamadas «Nuevos Asesor 1, 2 y 3 Forum» —la línea de venta de autos nuevos— recibieron 13,177 llamadas de 12,732 números distintos y contestaron 372. El 2.8%. No es lentitud de respuesta: es una línea comercial que prácticamente no se atiende.\n\nY hay una secuencia documentada en los propios registros de la cuenta. En agosto la mesa de ayuda cerró 53 tickets, el pico del año y el doble del mes anterior. El 4 de septiembre, en la única reunión registrada con el cliente, Daniel Martínez informa de una incidencia de WhatsApp atribuida a Meta que obliga a PAUSAR LAS CAMPAÑAS DE MARKETING. WhatsApp es, según el propio sitio del grupo, el canal por el que se cotiza en línea. El archivo no afirma que una cosa cause la otra, y esta auditoría tampoco lo afirma — pero la pregunta de si el tráfico se volcó al teléfono cuando se cerró el canal digital es la primera que hay que hacerle al cliente.\n\nDebajo de todo esto hay una cuenta que Callpicker no ve: cero contactos capturados, cero de doce preguntas del Radar respondidas, una sola reunión y un solo seguimiento en 56 meses de relación. El Health Score es 47 y su componente relacional, 32.',

  resultado_positivo: 'La cuenta paga y paga bien: 0 incidencias de pago, al corriente, y 56 meses de permanencia ininterrumpida desde marzo de 2021. El cliente no se está yendo por precio ni por cobranza.\n\nLa adopción del producto es real y está medida: el panel de administración registra 927 visitas promedio al mes a configuración y reportes, y la evaluación automática de adopción califica ALTO tanto en IA de Voz como en uso del panel. Es un cliente que SÃ usa lo que compró — lo cual significa que el problema de septiembre no es de desuso ni de desinterés, sino de capacidad.\n\nY hay un interlocutor activo y técnico: Jorge García, coordinador de desarrollo de proyectos, con correo y teléfono registrados. La reunión del 4 de septiembre fue sustantiva — se habló de incidencias, de una propuesta de ofuscador y de costos de desarrollo. Hay con quién hablar; lo que no hay es un mapa de quién decide.',

  hallazgos: [
    'ATENCIÓN — Septiembre 2026: 24,341 de 43,860 entrantes sin contestar (55.5%), contra una base propia de 20.3% de enero a agosto. Deterioro de 35.2 puntos. Son 15,441 llamadas perdidas MÃS de las que esta cuenta normalmente pierde.',
    'ATENCIÓN — El salto NO es del archivo ni del mercado: medido contra las otras 21 cuentas de la misma entrega, la razón mediana de septiembre contra su media previa es 0.94x. Sólo 3 de 22 doblaron volumen, y de ésas, el CID 164410 dobló (2.75x) manteniendo su tasa de pérdida en 17.2%. Torres Corzo dobló el volumen Y triplicó la pérdida.',
    'COMERCIAL — «Nuevos Asesor 1 Forum», «Nuevos Asesor 2 Forum» y «Nuevos Asesor 3 Forum» recibieron 13,177 llamadas de 12,732 números distintos y contestaron 372. El 2.8%. Es la línea de venta de autos nuevos de una concesionaria: cada llamada sin contestar es un comprador que llamó y colgó.',
    'ATENCIÓN — El lunes concentra 53,392 llamadas (el 25.6% de la semana) y pierde el 43.3%, contra el 27.5% de la cuenta. Es su día de mayor tráfico y el peor atendido a la vez. El domingo, con 3,589, es el más flojo — coherente con el horario de fin de semana de la red.',
    'MEDICIÓN — 11,498 llamadas perdidas (el 20.1% de todo lo no contestado) no traen destino registrado: entraron y no llegaron a ninguna extensión. El archivo no dice por qué. No se le puede atribuir causa sin revisarlo con soporte.',
    'SERVICIO — 53 de 203 tickets (26.1%) son la MISMA subcategoría: «Ajuste en Flujo (voz)». Una actividad de análisis del 13 de agosto, escrita por el propio equipo, ya lo decía: «la cuenta muestra en todas sus interacciones solicitando ajustes, cambios o reportes a SAC». Ocho meses pidiendo el mismo tipo de ajuste es una configuración que nunca quedó, o una capacitación que no se dio.',
    'SERVICIO — Agosto 2026 cerró 53 tickets, el pico del año y el doble de julio (29). El mes siguiente la operación telefónica colapsó. La secuencia está en el registro; la causalidad no, y no se afirma.',
    'SERVICIO — El folio 106428, «Revisar apertura de conversación con plantilla», lo abrió Ariana Agundis García. Vencía el 3 de mayo de 2026 y su última actividad es del 2 de mayo: esa fecha está CONGELADA en los 20 cortes consecutivos, del 3 de septiembre al 5 de octubre. No es que se atienda despacio — es que nadie lo ha tocado en 156 días.',
    'SERVICIO — Es la cuenta que MÃS tickets levanta de toda la cartera: 203 de 6,394, el 3.17%, lugar 1 de 1,647 CIDs. Y aparece con vencidos en los 20 de 20 cortes de la mesa; en dos de ellos (18 y 21 de septiembre) concentró 4 de los 11 vencidos de TODA la mesa de ayuda: el 36%.',
    'SERVICIO — 39 de 203 tickets (19.2%) tardaron más de 7 días en cerrarse. La mediana real es de 42.2 horas, pero la media sube a 203.6 por casos extremos: el #104448 estuvo abierto 3,522 horas (147 días) y otros cuatro superaron los 96 días.',
    'SERVICIO — Sólo 17 de 203 tickets (8.4%) son fallas del servicio. El 91.6% restante es asistencia y ajustes. El problema de esta cuenta no es que el producto falle: es que requiere intervención constante para operar.',
    'RELACIÓN — EL MAPA DE DECISORES YA ESTÃ ESCRITO Y NADIE LO CAPTURÓ. `contactos_json` está vacío, pero en la prosa de la cuenta y de la mesa hay TRES nombres, dos de ellos marcados como decisores: Jorge García (coordinador de desarrollo de proyectos), Christian Torres (DM) y Ariana Agundis García (DM) — ésta última es quien abrió el folio 106428. El trabajo de capturarlos es de media hora y lleva meses sin hacerse.',
    'RELACIÓN — El Health Score 47 está medido AL 15%. Tres de sus cuatro bloques —actividad, adopción y pago— traen 50, que es el marcador por omisión, no una medición. Sólo el relacional (32) está calculado. Y `health_score_historial` tiene cero filas para esta cuenta: no hay con qué comparar si mejora o empeora.',
    'RIESGO ESTRUCTURAL — La reunión del 4 de septiembre dejó por escrito un riesgo que no es de uso sino de OFERTA: el agotamiento del plan nacional de numeración. «Después de ese bloque ya no podremos seguir ofreciendo nuevas asignaciones bajo este esquema». Una red de 32 oficinas que crece necesita números.',
    'COMERCIAL — De esa misma reunión quedó una decisión de inversión ABIERTA y sin fecha: $96,250 MXN + IVA por 77 horas de desarrollo en 4 semanas (el ofuscador), con DIDs a $99 por número como alternativa. Cinco semanas después no hay registro de que se haya decidido.',
    'RELACIÓN — 0 de 12 preguntas del Radar respondidas. Alerta abierta desde el 6 de octubre, severidad alta.',
    'RELACIÓN — UNA sola reunión y UN solo seguimiento en 56 meses de relación. El score relacional es 32 sobre 100, el componente más bajo del Health Score (47).',
    'TRABAJO — 4 de las 7 actividades registradas quedaron SIN COMPLETAR: dos llamadas (26 jun, 23 jul), una de tickets (16 jul) y una de KAM (3 jul). Las tres que sí se cerraron son de análisis, no de contacto.',
    'CONSUMO — Su consumo cayó 40.43% en nueve meses: 63,898 minutos en enero contra 38,063 en septiembre, sobre una bolsa de 50,000 del plan «AV Agentes Virtuales». Enero (127.8%) y febrero (102.0%) REBASARON la bolsa —excedente que se cobra— y desde marzo no ha vuelto a acercarse. Ninguna alerta lo ve: el detector de caída mira los últimos cinco cortes y la caída ocurrió antes.',
    'FACTURACIÓN — La cuenta SÃ aparece en Gross Revenue Facturación, en 19 líneas «GTC - …», pero NINGUNA tiene CID asignado. Por eso el cruce automático falla y la ficha dice que no aparece. No es que no esté: es que el tablero no la encuentra.',
    'FACTURACIÓN — El GRC vigente pone las 13 líneas activas del grupo en CERO y las marca «Churn confirmado» con verificación `sin_verificar`: $272,436.10 dados de baja sin que nadie lo haya comprobado. En el respaldo del 2 de octubre las mismas líneas estaban vivas. Esto se revisa ANTES de cualquier conclusión de churn.',
    'FACTURACIÓN — De los 104 CID que cortan el 1 de septiembre, 103 reaparecen el 1 de octubre. El único ausente es el 130723. La cuenta desapareció del último Informe de Cortes y es la única de su cohorte que lo hizo.',
    'FACTURACIÓN — El importe de $316,541 sale de `cuentas.facturacion`, escrito por un script que suma por ACRÓNIMO («GTC») y no por CID, y que usa el `mrr_limpio` de la vista LTV de Zoho — que es acumulado ÷ meses, o sea un PROMEDIO DE VIDA y no el mes vigente. Con el mismo método hoy daría $323,584: la cifra guardada está $7,043 desactualizada.',
    'CONTEXTO — El grupo opera concesionarias Nissan en Ciudad de México, San Luis Potosí, Guanajuato, Zacatecas y Aguascalientes, con más de 34 años de sociedad con la marca. Los destinos del archivo de llamadas son sus agencias: Forum, Insur CDMX, NIS TLPN, Carretera 57. La operación telefónica es multi-sede y centralizada.',
  ],

  cronologia: [
    { fecha: '08 Mar 2021', responsable: 'Callpicker',            evento: 'Alta de la cuenta. Servicio contratado: AV Agentes Virtuales. 56 meses de relación ininterrumpida hasta hoy.', tipo: 'ok' },
    { fecha: 'Eneâ€“Ago 2026', responsable: 'Operación GTC',        evento: 'Comportamiento estable: entre 16,493 y 22,609 entrantes al mes, con 16.5%â€“32.2% sin contestar. Base del periodo: 20.3%.', tipo: 'neutral' },
    { fecha: '10 May 2026', responsable: 'Mesa de ayuda',         evento: 'Se abre el folio 106428. A fecha de esta auditoría lleva 155 días fuera de SLA y 156 sin movimiento, en estado Escalado.', tipo: 'problema' },
    { fecha: 'Jun 2026',    responsable: 'Dan',                   evento: 'Actividad de llamada programada para el 26 de junio. NO se completó.', tipo: 'problema' },
    { fecha: 'Jul 2026',    responsable: 'Dan',                   evento: 'Tres actividades programadas —KAM el 3, tickets el 16, llamada el 23— y ninguna se completó. La del 10 de julio, de análisis, sí: «llamadas únicamente informativas sobre los servicios automotrices que ofrecen, con buen tiempo de atención».', tipo: 'problema' },
    { fecha: '06 Ago 2026', responsable: 'Dan',                   evento: 'Análisis cerrado: «SLA cumplido, no se ha detectado errores consistentes o faltos de atención en las solicitudes». Es la última lectura positiva antes del deterioro.', tipo: 'neutral' },
    { fecha: '13 Ago 2026', responsable: 'Dan',                   evento: 'Análisis cerrado: «la cuenta muestra en todas sus interacciones solicitando ajustes, cambios o reportes a SAC». El patrón se nombra por escrito seis semanas antes del colapso.', tipo: 'problema' },
    { fecha: 'Ago 2026',    responsable: 'Mesa de ayuda',         evento: '53 tickets cerrados, el pico del año y el doble de julio. El #104448 llevaba 147 días abierto.', tipo: 'problema' },
    { fecha: '14 Ago 2026', responsable: 'GTC / Callpicker',      evento: 'Último contacto registrado en la ficha antes de la reunión de septiembre.', tipo: 'neutral' },
    { fecha: '04 Sep 2026', responsable: 'Daniel Martínez / GTC', evento: 'Reunión «Callpicker <> GTC». Incidencia en el servicio de WhatsApp atribuida a Meta: error en mensajes salientes. ACUERDO: pausar las campañas de marketing. Se propone un ofuscador y se discuten costos de desarrollo.', tipo: 'pivote' },
    { fecha: 'Sep 2026',    responsable: 'Operación GTC',         evento: '43,860 entrantes —el doble de su media— y 24,341 sin contestar: 55.5%. El peor mes registrado, con diferencia.', tipo: 'problema' },
    { fecha: '14 Sep 2026', responsable: 'Daniel Martínez',       evento: 'Seguimiento por correo: asignar números nuevos es costoso y lento por regulación IFT. Se recomienda una solución alterna.', tipo: 'neutral' },
    { fecha: '06 Oct 2026', responsable: 'Motor de alertas',      evento: 'Se abren dos alertas de severidad alta: cero contactos capturados y 0 de 12 del Radar.', tipo: 'problema' },
    { fecha: '12 Oct 2026', responsable: 'Callpicker',            evento: 'Entra por primera vez la lectura de llamadas de esta cuenta. Hasta hoy el tablero no podía medir su atención telefónica y pedía el archivo al cliente.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'Grupo Torres Corzo Automotriz' },
    { label: 'Giro',                  value: 'Venta de vehículos — red de concesionarias Nissan' },
    { label: 'Fundación',             value: '1987 · más de 34 años de sociedad con Nissan Mexicana' },
    { label: 'Cobertura',             value: 'CDMX, San Luis Potosí, Guanajuato, Zacatecas y Aguascalientes' },
    { label: 'Agencias identificadas',value: 'Nissan Nava, Carretera 57, Carranza (SLP) · Rioverde · Matehuala · Forum · Centro Max (León) · Insur y TLPN (CDMX)' },
    { label: 'Tamaño',                value: 'Grande — 1,200 empleados, 32 oficinas' },
    { label: 'Domicilio fiscal',      value: 'Av. Dr. Salvador Nava Martínez #205, Col. Capricornio, San Luis Potosí, S.L.P., C.P. 78399' },
    { label: 'Sitio',                 value: 'gtc-mx.com — cotización en línea con respuesta por WhatsApp' },
    { label: 'Contacto registrado',   value: 'Jorge García — coordinador de desarrollo de proyectos · 55 9752 5075 · SIN correo en la ficha' },
    { label: 'Interlocutor en junta', value: 'Daniel Martínez (reunión del 4 sep 2026). NO está capturado como contacto.' },
    { label: 'Cliente desde',         value: '8 de marzo de 2021 — 56 meses' },
    { label: 'Servicio contratado',   value: 'AV Agentes Virtuales' },
    { label: 'Facturación mensual',   value: '$316,541 MXN — el 14.8% de la cartera' },
    { label: 'Salud de pago',         value: 'Al corriente · 0 incidencias de pago' },
    { label: 'Health Score',          value: '47 · relacional 32, actividad 50, adopción 50, pago 50' },
  ],

  necesidad_negocio: 'GTC no usa telefonía como soporte: la usa para VENDER. Su sitio ofrece cotización en línea con respuesta por WhatsApp, y los destinos de su conmutador son las recepciones y las líneas de asesores de nuevos de cada agencia —Forum, Insur CDMX, NIS TLPN, Carretera 57—. Cada llamada entrante es, con alta probabilidad, alguien preguntando por un coche, por una refacción o por su servicio.\n\nEso cambia lo que significa una llamada no contestada. En una cuenta de soporte, perder una llamada es un cliente molesto; aquí es una unidad que no se vendió. Con 24,341 llamadas sin contestar en septiembre y un ticket promedio automotriz, la conversación con este cliente no es sobre calidad de servicio telefónico: es sobre cuánto dinero dejó de entrar por el teléfono.\n\nLa necesidad real que tiene hoy es capacidad y enrutamiento: que las llamadas lleguen a alguien que las tome, y que cuando el canal digital se caiga —como pasó con WhatsApp en septiembre— el teléfono aguante el desvío.',

  potencial_corto: [
    'Enrutamiento y desborde de las tres líneas «Nuevos Asesor» de Forum: hoy contestan el 2.8% de 13,177 llamadas. Cualquier mejora ahí se mide en unidades vendidas, no en puntos de SLA.',
    'Refuerzo del lunes: concentra el 25.6% del tráfico semanal y pierde el 43.3%. Es el día con mayor retorno por cada agente adicional.',
    'Cerrar el folio 106428 y los 39 tickets que pasaron de 7 días. La cuenta aparece con vencidos en los 20 de 20 cortes de la mesa.',
    'Resolver de raíz el «Ajuste en Flujo (voz)»: 53 tickets de la misma subcategoría en ocho meses. Una capacitación o una configuración definitiva cierra el 26% de su volumen de tickets.',
  ],

  potencial_largo: [
    'Callpicker Chat e IA de Chat: no los tiene contratados y su canal de cotización es WhatsApp. La incidencia de septiembre demostró que ese canal no tiene respaldo.',
    'Integración API con su CRM (usan Zoho): hoy no la tienen. Cada llamada perdida es un lead que no queda registrado en ningún sitio.',
    'Panel por agencia: operan 32 oficinas en 5 estados contra una sola cuenta. Medir Forum contra Insur contra Carretera 57 convierte el dato en gestión para el cliente.',
    'Pago automático: no lo tienen activo pese a 56 meses sin una sola incidencia de pago.',
  ],

  tacticas: [
    { nombre: 'Llevarle sus propios números', descripcion: 'Presentar el desglose por destino: cuántas llamadas recibió cada agencia y cuántas contestó. Son SUS datos, generados por nuestra plataforma, y hoy no los ve.', impacto: 'Convierte una conversación de servicio en una de negocio. El 2.8% de la línea de nuevos no se discute: se mira.' },
    { nombre: 'Anclar al septiembre', descripcion: 'Comparar septiembre contra su propia base de enero a agosto, no contra un estándar de la industria. 20.3% â†’ 55.5% es su propio deterioro.', impacto: 'Evita la respuesta «así es este negocio»: el punto de comparación es la propia cuenta.' },
    { nombre: 'Preguntar por WhatsApp sin acusar', descripcion: 'La reunión del 4 de septiembre documenta que se pausaron las campañas. Preguntar si el tráfico se volcó al teléfono, no afirmarlo.', impacto: 'Si lo confirma, abre la conversación de respaldo de canal; si lo niega, hay otra causa que encontrar.' },
    { nombre: 'Cerrar el 106428 antes de la junta', descripcion: 'Llegar con un folio de 155 días abierto a hablar de calidad de atención le entrega al cliente el argumento.', impacto: 'Quita de la mesa la única objeción que no se puede contestar con datos.' },
  ],

  senal_alarma: 'Una cuenta de $316,541 al mes, el 14.8% de la cartera, con 56 meses de permanencia, cero contactos capturados, cero de doce del Radar, una sola reunión en todo el historial y un folio escalado sin moverse desde mayo. Si esta cuenta decide irse, Callpicker se entera el día que lo diga.',

  problema_raiz: 'La cuenta se gestionó como un servicio que funciona, no como una operación que vende. Nadie estaba midiendo su teléfono.',

  problema_raiz_detalle: 'Durante 56 meses GTC pagó puntualmente, no abrió conflictos comerciales y usó el producto de forma intensiva —927 visitas al mes al panel—. Eso produjo la lectura de una cuenta sana, y el 6 de agosto de 2026 quedó escrita: «SLA cumplido, no se ha detectado errores consistentes».\n\nPero el tablero no tenía su lectura de llamadas. Hasta el 12 de octubre de 2026, esta cuenta figuraba como «no la vemos»: la ficha pedía al asesor que le solicitara al cliente un Excel de llamadas entrantes y salientes. O sea que durante todo el deterioro de septiembre —43,860 llamadas, 24,341 sin contestar— el único indicador disponible era que la cuenta no se quejaba.\n\nEl segundo nivel del problema es que lo que SÃ se veía se leyó al revés. 203 tickets en ocho meses, con el 26.1% pidiendo el mismo ajuste de flujo, se interpretó como un cliente demandante y no como un cliente cuya configuración nunca quedó resuelta. El 13 de agosto el propio equipo escribió que «en todas sus interacciones» pedía ajustes — y la acción que siguió fue una actividad de análisis, no una intervención técnica.\n\nEl tercero es de relación. Cero contactos capturados y cero del Radar significa que no hay mapa: no se sabe quién decide el presupuesto de telefonía, quién dirige a los asesores de nuevos ni quién respondería si Nissan Mexicana preguntara por el desempeño del contact center. Hay un interlocutor técnico —Jorge García— y uno que apareció en la junta de septiembre —Daniel Martínez— que ni siquiera está registrado como contacto.',

  flujo_real: [
    { fase: 'Entra la llamada',        area: 'Cliente final',       accion: 'Marca a la agencia buscando un coche, una refacción o su servicio', resultado: '208,255 entrantes medidas de ene a oct 2026' },
    { fase: 'Enrutamiento',            area: 'Plataforma Callpicker', accion: 'La llamada se dirige al destino configurado: recepción o línea de asesores', resultado: '11,498 perdidas (20.1%) no llegan a ningún destino registrado' },
    { fase: 'Atención',                area: 'Agencia GTC',         accion: 'Un asesor toma la llamada', resultado: 'Las tres líneas «Nuevos Asesor Forum» contestan 372 de 13,177 — el 2.8%' },
    { fase: 'La llamada se pierde',    area: '—',                   accion: 'Nadie contesta; el cliente cuelga', resultado: 'No queda registro del lead: la cuenta no tiene integración con su CRM' },
    { fase: 'GTC pide un ajuste',      area: 'Mesa de ayuda',       accion: 'Se abre ticket «Ajuste en Flujo (voz)»', resultado: '53 veces en ocho meses — el 26.1% de todos sus tickets' },
    { fase: 'El ticket se atiende',    area: 'Mesa de ayuda',       accion: 'Se resuelve el caso puntual', resultado: 'Mediana de 42.2 h, pero 39 tickets (19.2%) pasan de 7 días; el 106428 lleva 155' },
    { fase: 'Callpicker evalúa',       area: 'SAC',                 accion: 'Actividad de análisis sobre la cuenta', resultado: '«SLA cumplido» el 6 de agosto, seis semanas antes del colapso de septiembre' },
  ],

  comparativo: [
    { metrica: 'Entrantes sin contestar · septiembre', real: '55.5% (24,341 de 43,860)', ideal: 'Su propia base eneâ€“ago: 20.3%' },
    { metrica: 'Línea de venta de autos nuevos (3 destinos Forum)', real: '2.8% contestadas (372 de 13,177)', ideal: 'Una línea comercial atendida: >80%' },
    { metrica: 'Lunes — su día de mayor tráfico', real: '43.3% sin contestar', ideal: 'Al nivel de su martes: 17.2%' },
    { metrica: 'Contactos capturados', real: '0 en `contactos_json`', ideal: 'Quien decide, quien opera y quien paga: mínimo 3' },
    { metrica: 'Radar de 12 preguntas', real: '0 respondidas', ideal: '12 de 12 en una cuenta AAA' },
    { metrica: 'Reuniones en 56 meses', real: '1', ideal: 'Trimestral para una cuenta de este tamaño: 18' },
    { metrica: 'Tickets por encima de 7 días', real: '39 de 203 (19.2%)', ideal: '<5%' },
    { metrica: 'Folio más antiguo sin moverse', real: '155 días (106428, Escalado)', ideal: 'Ninguno fuera de SLA' },
    { metrica: 'Consumo de su bolsa de 50,000 min', real: '38,063 min en sep (76.1%) — cayó 40.43% desde enero', ideal: 'Estable o creciendo; enero fue 63,898 (127.8%)' },
    { metrica: 'Presencia en el último Informe de Cortes', real: 'AUSENTE — única de 104 CID que no reapareció', ideal: 'Los 104 cortan cada mes' },
    { metrica: 'Líneas del grupo con CID asignado en el GRC', real: '0 de 19', ideal: '19 de 19 — sin CID el tablero no las cruza' },
    { metrica: 'Bloques del Health Score realmente medidos', real: '1 de 4 (sólo el relacional)', ideal: '4 de 4' },
  ],

  plan_inmediato: [
    { accion: 'Cerrar o escalar formalmente el folio 106428 antes de cualquier contacto comercial', responsable: 'Mesa de ayuda / Dan', criterio: 'El folio cambia de estado o tiene fecha comprometida por escrito, antes de la llamada' },
    { accion: 'Llamar a Jorge García y a Daniel Martínez con el desglose por destino en la mano, y preguntar qué atiende cada línea «Nuevos Asesor Forum»', responsable: 'Dan', criterio: 'Queda por escrito quién contesta esas tres extensiones y en qué horario' },
    { accion: 'Preguntar si el tráfico de septiembre se volcó al teléfono al pausar las campañas de WhatsApp', responsable: 'Dan', criterio: 'Respuesta del cliente registrada en seguimiento, confirmando o descartando la relación' },
    { accion: 'PARAR el churn marcado sin verificar: el GRC vigente da de baja las 13 líneas activas del grupo —$272,436.10— con verificación `sin_verificar`, y en el respaldo del 2 de octubre estaban vivas', responsable: 'Dirección / Facturación', criterio: 'Las 13 líneas quedan verificadas una por una, confirmadas o revertidas, antes del siguiente corte' },
    { accion: 'Averiguar por qué el CID 130723 desapareció del Informe de Cortes del 1 de octubre, siendo el único de 104 que no reapareció', responsable: 'Facturación', criterio: 'Se confirma si cambió de CID, si se facturó por otro contrato o si quedó fuera del export' },
    { accion: 'Capturar los tres decisores que YA están escritos en la prosa de la cuenta: Jorge García, Christian Torres (DM) y Ariana Agundis García (DM)', responsable: 'Dan', criterio: 'Los tres en `contactos_json` con puesto, correo y teléfono' },
    { accion: 'Cerrar la decisión del ofuscador: $96,250 + IVA, 77 horas, 4 semanas — abierta desde el 4 de septiembre sin fecha', responsable: 'Dan', criterio: 'El cliente aprueba, rechaza o pone fecha, y queda registrado' },
  ],

  plan_mediano: [
    { accion: 'Resolver de raíz el «Ajuste en Flujo (voz)»: una sesión técnica que deje la configuración cerrada', responsable: 'Mesa de ayuda / Ingeniería', criterio: 'Cero tickets de esa subcategoría durante 60 días' },
    { accion: 'Contestar las 12 preguntas del Radar con el cliente, en una sola sesión', responsable: 'Dan', criterio: '12 de 12 respondidas en la ficha' },
    { accion: 'Revisar con soporte las 11,498 llamadas que no llegaron a ningún destino', responsable: 'Ingeniería', criterio: 'Se explica el origen de ese 20.1% o se descarta que sea un problema de configuración' },
    { accion: 'Proponer refuerzo de capacidad para el lunes y desborde para la línea de nuevos', responsable: 'Dan', criterio: 'Propuesta entregada con el cálculo de llamadas recuperables por agente' },
  ],

  plan_estrategico: [
    { accion: 'Panel de desempeño por agencia: Forum contra Insur contra Carretera 57', responsable: 'Producto / Dan', criterio: 'El cliente recibe un reporte mensual por sede, no agregado' },
    { accion: 'Integración con su CRM Zoho para que la llamada perdida deje lead', responsable: 'Ingeniería / Dan', criterio: 'Propuesta técnica y costo entregados' },
    { accion: 'Respaldo de canal: Callpicker Chat e IA de Chat para que WhatsApp no sea un punto único de falla', responsable: 'Dan', criterio: 'Propuesta presentada citando la incidencia del 4 de septiembre' },
    { accion: 'Gobernanza de la cuenta: reunión trimestral fija con minuta y acuerdos', responsable: 'Dan / Dirección', criterio: 'Primera reunión agendada con fecha y asistentes confirmados' },
  ],

  areas_oportunidad: [
    { area: 'Recuperar la línea de venta de autos nuevos', impacto: '12,805 llamadas perdidas en la línea comercial de una concesionaria', responsable: 'Dan + GTC' },
    { area: 'Capacidad del lunes', impacto: '23,125 llamadas perdidas sólo ese día de la semana', responsable: 'GTC' },
    { area: 'Chat e IA de Chat', impacto: 'Canal de cotización sin respaldo; ya falló una vez en septiembre', responsable: 'Dan' },
    { area: 'Integración API con Zoho CRM', impacto: 'Hoy ninguna llamada perdida genera lead', responsable: 'Ingeniería' },
    { area: 'Cierre estructural del ajuste de flujo', impacto: '26.1% del volumen de tickets de la cuenta', responsable: 'Mesa de ayuda' },
    { area: 'Pago automático', impacto: '56 meses sin incidencias y sin domiciliación', responsable: 'Administración' },
  ],

  perfiles: [
    {
      nombre: 'Jorge García', rol: 'Coordinador de desarrollo de proyectos — GTC', color: '#6366f1',
      campos: [
        { label: 'Teléfono',  value: '55 9752 5075' },
        { label: 'Correo',    value: 'jorge.garcia@grupotorrescorzo.com (en el campo de nombre, NO en el de correo — la ficha lo tiene mal capturado)' },
        { label: 'Rol real',  value: 'Es el único contacto registrado de la cuenta' },
        { label: 'Riesgo',    value: 'Punto único de contacto en una cuenta de $316,541 al mes' },
      ],
    },
    {
      nombre: 'Christian Torres', rol: 'Decisor (DM) — GTC', color: '#ef4444',
      campos: [
        { label: 'Aparece en', value: 'Prosa de la cuenta, marcado «(DM)» — decision maker' },
        { label: 'Estado',     value: 'NO capturado en `contactos_json`. El mapa existe y nadie lo pasó a la ficha.' },
      ],
    },
    {
      nombre: 'Ariana Agundis García', rol: 'Decisora (DM) — GTC · quien abrió el folio 106428', color: '#ef4444',
      campos: [
        { label: 'Abrió',      value: 'Folio 106428 «Revisar apertura de conversación con plantilla»' },
        { label: 'Sin mover',  value: 'Última actividad 2 may 2026 — congelada en los 20 cortes' },
        { label: 'Estado',     value: 'NO capturada en `contactos_json`. Es quien tiene el problema abierto.' },
      ],
    },
    {
      nombre: 'Daniel Martínez', rol: 'Interlocutor en la reunión del 4 sep 2026', color: '#f59e0b',
      campos: [
        { label: 'Aparece en', value: 'Reunión «Callpicker <> GTC» y seguimiento del 14 sep' },
        { label: 'Temas',      value: 'Incidencia de WhatsApp, pausa de campañas, ofuscador ($96,250 + IVA), regulación IFT' },
        { label: 'Estado',     value: 'NO está capturado como contacto en la ficha' },
      ],
    },
    {
      nombre: 'Dan', rol: 'Asesor SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades',  value: '7 registradas · 3 completadas (todas de análisis) · 4 sin completar (2 llamadas, 1 tickets, 1 KAM)' },
        { label: 'Último análisis', value: '13 ago 2026 — identificó por escrito el patrón de ajustes constantes' },
        { label: 'Contexto',     value: 'Suspendido del tablero del 6 oct al 12 oct 2026 por instrucción de dirección' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '56 meses de permanencia ininterrumpida desde marzo de 2021',
      'Cero incidencias de pago y pagos al corriente',
      'Adopción ALTA medida: 927 visitas al mes al panel de administración',
      'Grupo consolidado: 1,200 empleados, 32 oficinas, 5 estados, 34 años con Nissan',
      'Hay interlocutor técnico activo y una reunión sustantiva reciente',
    ],
    oportunidades: [
      'La línea de venta de nuevos contesta el 2.8%: el margen de mejora es casi todo el volumen',
      'No tiene Chat, IA de Chat, API ni pago automático contratados',
      'Operación multi-sede sin reporte por agencia',
      'Su canal de cotización es WhatsApp y no tiene respaldo',
    ],
    debilidades: [
      '55.5% de llamadas sin contestar en septiembre contra su base de 20.3%',
      'Cero contactos capturados y 0 de 12 del Radar en 56 meses',
      'Score relacional 32 — el componente más bajo de su Health Score',
      '26.1% de sus tickets son el mismo ajuste sin resolver de raíz',
      'No aparece en el Informe de Cortes: su consumo no es medible',
    ],
    amenazas: [
      'Cada llamada sin contestar en la línea de nuevos es una venta que se va a otra concesionaria',
      'EL GRC VIGENTE YA LA DA DE BAJA: 13 líneas en cero, $272,436.10 marcados «Churn confirmado» con verificación `sin_verificar`. Si eso se publica sin revisar, el grupo aparece perdido en el reporte de dirección sin que nadie lo haya comprobado.',
      'Desapareció del Informe de Cortes del 1 de octubre, única de 104 CID. O cambió algo en su facturación, o se cayó del export: las dos cosas hay que saberlas.',
      'El consumo cayó 40.43% en nueve meses y ninguna alerta lo vio, porque el detector sólo mira los últimos cinco cortes',
      'Folio escalado 156 días sin moverse — argumento servido si el cliente cuestiona el servicio',
      'Nissan Mexicana es su socio de marca: un desempeño telefónico así es auditable por el fabricante',
      'Agotamiento del plan nacional de numeración: una red de 32 oficinas que crece y no podrá pedir números bajo el esquema actual',
    ],
  },

  conclusion: 'GTC no es una cuenta en riesgo de churn por insatisfacción: es una cuenta en riesgo de descubrir sola cuánto le está costando su teléfono. Paga puntualmente, usa el producto a diario y no se ha quejado — y ese silencio fue justo lo que se leyó como salud durante 56 meses.\n\nLos números de septiembre cambian la conversación. 24,341 llamadas sin contestar en el mes, 12,805 de ellas en las líneas de venta de autos nuevos, en un grupo que vive de vender coches. El día que GTC mida eso por su cuenta —o que se lo pregunte Nissan Mexicana— la conversación ya no la abre Callpicker.\n\nLa ventaja es que esos números los tiene Callpicker primero, y desde hoy. Llegar con ellos antes de que los descubran convierte un problema de servicio en una propuesta de capacidad.',

  pierde: [
    'Callpicker pierde $316,541 al mes — el 14.8% de la cartera de Customer Success — si la cuenta se va.',
    'GTC pierde las ventas de las 12,805 llamadas no contestadas en su línea de autos nuevos, más lo que se pierda cada mes que siga así.',
    'Se pierde la referencia: es socio de Nissan Mexicana con 34 años de relación de marca.',
    'Se pierde el caso de uso multi-sede más grande de la cartera: 32 oficinas en 5 estados.',
  ],

  gana: [
    'Si se recupera la línea de nuevos, el retorno se mide en unidades vendidas y lo mide el cliente, no Callpicker.',
    'La cuenta no tiene contratados Chat, IA de Chat, API ni pago automático: la base para crecer está entera.',
    'Un panel por agencia convierte a Callpicker en herramienta de gestión del grupo, no en proveedor de conmutador.',
    'Es la cuenta donde una intervención bien hecha se nota más: cualquier mejora sobre 208,255 llamadas es visible desde el primer mes.',
  ],

  recomendacion_central: 'Hay DOS urgencias y no son del mismo tipo. La de dentro: el GRC vigente ya marca las 13 líneas activas del grupo como «Churn confirmado» —$272,436.10— con verificación `sin_verificar`, y la cuenta desapareció del Informe de Cortes del 1 de octubre siendo la única de 104. Eso se revisa ANTES de que llegue a un reporte de dirección, porque hoy el tablero puede estar dando por perdida a la cuenta más grande de la cartera sin que nadie lo haya comprobado.\n\nLa de fuera: llamar esta semana con el desglose por destino en la mano y abrir con una sola pregunta — «¿quién contesta las tres líneas de Nuevos Asesor de Forum?». No se abre con el 55.5% ni con el SLA. Se abre mostrándole al cliente que de 13,177 personas que marcaron buscando un coche, 372 encontraron a alguien. Y antes de esa llamada, mover el folio 106428, que lleva 156 días con la misma fecha de última actividad: llegar a hablar de atención con eso abierto es entregarle al cliente el único argumento que no se puede contestar con datos.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 203 tickets de «GTC Contact Center» (CID 130723) en lib/tickets-data.json',
    periodo: 'Febrero 2026 â€“ Octubre 2026 · la fuente trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí',
    diagnostico: 'El producto no le falla a GTC: sólo 17 de 203 tickets (8.4%) son fallas. Lo que ocurre es que su operación requiere intervención constante para funcionar. El 26.1% de todos sus tickets —53 de 203— son la misma subcategoría, «Ajuste en Flujo (voz)», repetida durante ocho meses. El propio equipo lo escribió el 13 de agosto: la cuenta «en todas sus interacciones» pide ajustes. Agosto cerró 53 tickets, el pico del año, y el mes siguiente su teléfono colapsó.',
    metricas: [
      { metrica: 'Tickets totales',          valor: '203 (febâ€“oct 2026)',   lectura: 'La cuenta con más volumen de la cartera, acorde a su tamaño' },
      { metrica: 'Fallas del servicio',      valor: '17 · 8.4%',            lectura: 'El producto responde. El problema no es estabilidad' },
      { metrica: 'Mediana de resolución',    valor: '42.2 horas',           lectura: 'Razonable. La media (203.6 h) está inflada por los casos extremos' },
      { metrica: 'Tickets de más de 7 días', valor: '39 · 19.2%',           lectura: 'Uno de cada cinco se queda semanas; ahí vive la insatisfacción' },
      { metrica: 'El más largo',             valor: '#104448 · 3,522 h (147 días)', lectura: 'Cerrado en agosto. Otros cuatro superaron los 96 días' },
      { metrica: 'Folio abierto más antiguo',valor: '#106428 · 155 días fuera de SLA', lectura: 'Escalado desde el 10 de mayo. Nadie lo ha movido en 156 días' },
      { metrica: 'Cortes con vencidos',      valor: '20 de 20',             lectura: 'No es un mal mes: es el comportamiento normal de esta cuenta' },
      { metrica: 'Pico mensual',             valor: 'Agosto · 53 tickets',  lectura: 'El doble de julio (29). El mes anterior al colapso telefónico' },
    ],
    reincidencias: [
      { patron: 'Ajuste en Flujo (voz)',       veces: '53 · 26.1%', causa: 'La configuración del flujo nunca quedó cerrada, o nadie en GTC fue capacitado para hacerla. Ocho meses del mismo pedido.' },
      { patron: 'Plantillas Verificadas (chat)', veces: '29 · 14.3%', causa: 'Mismo patrón que se documentó en FINSUS: una capacitación de WhatsApp que no se dio.' },
      { patron: 'Envío Masivo WhatsApp (chat)', veces: '22 · 10.8%', causa: 'Junto con las plantillas, el 25% de los tickets es WhatsApp — el canal que falló en septiembre.' },
      { patron: 'DiDs (voz)',                   veces: '17 · 8.4%',  causa: 'Coincide con el seguimiento del 14 sep: asignar números nuevos es lento y caro por regulación IFT.' },
    ],
    hallazgos: [
      'El 51.2% de los tickets recae en tres agentes: Pablo S. (53), Mario H. (37) y Paola B. (31). Néstor C. suma otros 31.',
      'La prioridad declarada no refleja el impacto: 106 de 203 tickets están marcados «Low» en una cuenta cuyo teléfono perdió 24,341 llamadas en un mes.',
      'Un tercio del volumen es de chat (69 de asistencia + 9 de falla), pese a que la cuenta NO tiene contratados Callpicker Chat ni IA de Chat según su ficha. Hay que confirmar por qué.',
      'Entre los cinco tickets más largos hay uno de «Falla Web (chat)» de 97 días marcado como falla. Un problema reconocido que tardó tres meses en cerrarse.',
    ],
  },
}
