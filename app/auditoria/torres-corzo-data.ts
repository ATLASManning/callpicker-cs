import type { AuditoriaCase } from './types'

/**
 * GRUPO TORRES CORZO (D1 · CID 130723) — la cuenta MAYOR de la cartera.
 *
 * Primera auditoría, 12 oct 2026. Se pudo escribir porque ese mismo día entró
 * la lectura de llamadas de esta cuenta: hasta entonces el tablero decía «no
 * tenemos sus llamadas» y mandaba al asesor a pedirle el Excel al cliente.
 *
 * v1.2 — LO QUE CAMBIÓ Y POR QUÉ
 * ------------------------------
 * Dirección aportó el dato que reordena el expediente entero: el cliente pidió
 * DESCENTRALIZAR su cuenta, y hoy cada agencia responde por su propia
 * comunicación. La v1.1 leía los mismos números como un colapso de servicio.
 * Con la descentralización encima son la foto de una transición a medio hacer,
 * y tres hechos que estaban sueltos encajan: la capacidad de atender plana, las
 * 19 líneas de facturación sin CID, y el CID que desapareció del corte.
 *
 * Y se corrigieron TRES cifras que la v1.1 daba por buenas:
 *
 *   1. El MRR. La v1.1 decía «$316,541 según la ficha, $323,584 según el GRC,
 *      que es la fuente buena». Falso: los $323,584 salen de sumar
 *      `acumulado ÷ meses` de las 19 líneas, que es el MISMO promedio de vida
 *      que la propia auditoría critica — refrescado, no corregido. El mes
 *      vigente de verdad son $272,436, y lo confirman DOS cortes: es el
 *      `mrrFin` del respaldo del 2 oct y el `mrrIni` del corte del 11 oct.
 *
 *   2. El peso en la cartera. «14.8%» exigía un denominador de $2,138,791 que
 *      ya no existe. Hoy: $1,356,442 en 132 cuentas activas, o sea el 23.3%.
 *      Sobre las 223 cuentas de todos los estados, el 15.4%. Se dice cuál.
 *
 *   3. El giro. «Red de concesionarias Nissan» se queda corto: las líneas de
 *      facturación nombran BMW, MG e INFINITI además de Nissan.
 *
 * TODAS las cifras salen de fuente y están verificadas una por una:
 *   · llamadas  → app/cuentas/llamadas-data.ts, CID 130723 (entrega oct-2026)
 *   · tickets   → lib/tickets-data.json, 203 filas de «GTC Contact Center»
 *   · alertas   → alertas_episodios, 3 abiertos
 *   · ficha     → tabla `cuentas`, registro completo
 *   · facturación → data/grc-zoho.json (11 oct) contra su respaldo del 2 oct,
 *                   19 líneas «GTC - …». Se leen las DOS: el corte vigente por
 *                   sí solo dice que esta cuenta paga cero.
 *   · el grupo  → gtc-mx.com y prensa de Nissan Mexicana
 *
 * NOTA DE MÉTODO, porque costó. El nombre de la ficha es «GRUPO TORRES CORZO»
 * y en el GRC se llama «GTC - <agencia>». No comparten UN SOLO token
 * distintivo: «corzo» aparece en CERO nombres del corte y «torres» en cuatro
 * que son de otras cuentas. Ningún cruce automático por nombre la encontrará
 * nunca, y el cruce por CID tampoco, porque las 19 líneas no traen CID. Esta
 * cuenta sólo se encuentra a mano. Es el hallazgo de facturación, no una nota
 * al pie.
 */
export const TORRES_CORZO: AuditoriaCase = {
  id: 'torres-corzo',
  asesor: 'Dan',
  nombre: 'Grupo Torres Corzo Automotriz (GTC)',
  sector: 'Automotriz multimarca — Nissan, BMW, MG e INFINITI en 5 estados',
  fecha_periodo: 'Marzo 2021 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA — la MAYOR de la cartera · EN DESCENTRALIZACIÓN',
  descripcion_contexto: '56 meses de cliente · $272,436 al mes, el 23.3% de la cartera activa · DESCENTRALIZÁNDOSE a petición del cliente: 19 líneas de facturación, una por agencia · 208,255 llamadas entrantes y 594,523 salientes medidas · 203 tickets',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.2',

  kpis: [
    { label: 'Decisión del cliente',       value: 'DESCENTRALIZAR · 19 agencias', color: '#8b5cf6' },
    { label: 'Las 13 líneas activas, hoy', value: '$272,436 → $0 sin verificar',  color: '#ef4444' },
    { label: 'Sin contestar · septiembre', value: '24,341 de 43,860 · 55.5%',     color: '#ef4444' },
    { label: 'Capacidad de atender',       value: '8,584 → 8,714 (+130)',         color: '#f97316' },
    { label: 'Línea de autos nuevos',      value: '372 de 13,177 · 2.8%',         color: '#f97316' },
    { label: 'Peso en la cartera activa',  value: '23.3% · $272,436 / mes',       color: '#6366f1' },
  ],

  resumen_ejecutivo: 'LA CLAVE DE TODO ESTE EXPEDIENTE ES UNA DECISIÓN DEL CLIENTE: GTC pidió DESCENTRALIZAR su cuenta, y hoy cada agencia es responsable de su propia comunicación. Sin ese dato, los números de esta cuenta parecen un colapso de servicio. Con él, son la foto de una transición a medio hacer — y la pregunta deja de ser «por qué se cayó la atención» para ser «de las 19 agencias, cuántas siguen siendo nuestras».\n\nGrupo Torres Corzo es la cuenta más grande de la cartera: $272,436 al mes, el 23.3% de los $1,356,442 que facturan las 132 cuentas activas. Casi una quinta parte de la cartera depende de una sola conversación. Cliente desde marzo de 2021 —56 meses— con 32 oficinas, unos 1,200 empleados y, contra lo que decía la versión anterior de este expediente, NO sólo Nissan: sus líneas de facturación nombran BMW, MG e INFINITI. Su contrato es de Agentes Virtuales, y su teléfono no es un servicio de soporte: es el canal por el que entra quien quiere comprar un coche.\n\nLO PRIMERO, PORQUE ES DE ESTA SEMANA. El corte de Gross Revenue Facturación del 11 de octubre pone las 13 líneas activas del grupo en CERO y las marca «Churn confirmado». En el respaldo del 2 de octubre esas mismas 13 estaban vivas, sumaban $272,436 y once de ellas venían CRECIENDO («Upsell temporal»). Nueve días separan las dos lecturas y las 13 llevan verificación `sin_verificar`: nadie ha comprobado ninguna. Si la descentralización significa que cada agencia se recontrata por separado, esos ceros son un cambio de forma y no una pérdida. Si significa que se fueron, es el 20% de la cartera. Hoy el tablero no sabe cuál de las dos cosas es, y por omisión publicaría la segunda.\n\nEN SEPTIEMBRE EL NÚMERO CENTRAL SE ROMPIÓ. Entraron 43,860 llamadas —el doble de su media de enero a agosto— y 24,341 se quedaron sin contestar: 55 de cada 100, contra una base propia del 20.3%. Son 35.2 puntos en un solo mes, y no es efecto del volumen: de las 22 cuentas de la misma entrega la mediana se movió 0.94x, y otra que también dobló su tráfico mantuvo su pérdida en 17.2%.\n\nLo decisivo es CÓMO se rompió. La atención por una persona NO creció: 8,584 llamadas tomadas en agosto contra 8,714 en septiembre —ciento treinta más— mientras el volumen subía en 25,840. La capacidad de contestar se quedó exactamente donde estaba y todo el excedente cayó del lado perdido. El buzón se multiplicó por 5.5 contra su máximo previo. Eso no es un equipo que se satura: es un equipo que ya no está detrás de ese número. Y un equipo que ya no está detrás de un número es precisamente lo que deja una descentralización a medias.\n\nLas tres extensiones «Nuevos Asesor 1, 2 y 3 Forum» —la línea de venta de autos nuevos— recibieron 13,177 llamadas de 12,732 números distintos y contestaron 372: el 2.8%. Si Forum pasó a responder por su propia comunicación, esas tres extensiones quedaron colgando del conmutador central sin nadie asignado del lado nuevo. El archivo no lo afirma; la secuencia lo sugiere y es la primera pregunta para el cliente.\n\nY HAY UNA COSA QUE EL TABLERO NO PUEDE ARREGLAR SOLO. Las 19 líneas «GTC - …» no traen CID, y el nombre de la ficha —«GRUPO TORRES CORZO»— no comparte un solo token distintivo con «GTC - FORUM»: «corzo» aparece en cero nombres del corte. O sea que la cuenta más grande de la cartera es invisible para todo cruce automático, y seguirá siéndolo mientras facturación no le ponga CID a esas líneas. El CID central, 130723, además DESAPARECIÓ del Informe de Cortes del 1 de octubre, único de 104 que no reapareció.\n\nDebajo de todo esto hay una cuenta que Callpicker no ve: cero contactos capturados, cero de doce del Radar, una sola reunión y un solo seguimiento en 56 meses. El Health Score es 47 y está medido al 15%.',

  resultado_positivo: 'La cuenta paga y paga bien: 0 incidencias de pago, al corriente, y 56 meses de permanencia ininterrumpida desde marzo de 2021. El cliente no se está yendo por precio ni por cobranza.\n\nLa adopción del producto es real y está medida: el panel de administración registra 927 visitas promedio al mes a configuración y reportes, y la evaluación automática de adopción califica ALTO tanto en IA de Voz como en uso del panel. Es un cliente que SÍ usa lo que compró — lo cual significa que el problema de septiembre no es de desuso ni de desinterés, sino de capacidad.\n\nY hay un interlocutor activo y técnico: Jorge García, coordinador de desarrollo de proyectos, con correo y teléfono registrados. La reunión del 4 de septiembre fue sustantiva — se habló de incidencias, de una propuesta de ofuscador y de costos de desarrollo. Hay con quién hablar; lo que no hay es un mapa de quién decide.',

  hallazgos: [
    'ESTRUCTURA — EL CLIENTE PIDIÓ DESCENTRALIZAR: cada agencia responde hoy por su propia comunicación. Es el dato que reordena todo lo demás, y no estaba en el tablero: lo aportó dirección. Sin él, los números de esta cuenta se leen como un colapso de servicio; con él, son una transición a medio hacer. Toda conclusión de churn sobre esta cuenta tiene que pasar primero por esta pregunta: ¿de las 19 agencias, cuántas siguen siendo nuestras?',
    'ESTRUCTURA — La descentralización YA ESTÁ EN EL DINERO: el GRC trae 19 líneas «GTC - …», una por agencia —CENTRO MAX, NAVA, CARRANZA, FORUM, BMW, SENDERO, MG POLIFORUM, MG LOMAS, MATEHUALA, RIOVERDE, INFINITI QRO, INSUR, INFINITI LEÓN y seis más ya desactivadas—. Y NINGUNA de las 19 tiene CID asignado. Facturación ya factura por agencia; el tablero sigue viendo una sola cuenta.',
    'ESTRUCTURA — LA CAPACIDAD DE ATENDER NO CRECIÓ CUANDO SE DOBLÓ EL VOLUMEN: 8,584 llamadas tomadas por una persona en agosto contra 8,714 en septiembre —130 más— mientras entraban 25,840 llamadas adicionales. Un equipo que se satura contesta más y falla más; éste contestó lo mismo. Es la firma de un número del que ya nadie se hizo cargo, que es exactamente lo que deja una descentralización sin cerrar.',
    'ESTRUCTURA — El grupo NO es sólo Nissan, y la ficha lo dice mal. Las líneas de facturación nombran BMW, MG (Poliforum y Lomas) e INFINITI (Querétaro y León) además de las agencias Nissan. La v1.1 de esta auditoría repetía «red de concesionarias Nissan» porque eso dicen las `notas` de la ficha; el dinero dice multimarca. Importa para la conversación: son cuatro marcas con cuatro áreas comerciales distintas.',
    'ATENCIÓN — Septiembre 2026: 24,341 de 43,860 entrantes sin contestar (55.5%), contra una base propia de 20.3% de enero a agosto. Deterioro de 35.2 puntos. Son 15,441 llamadas perdidas MÁS de las que esta cuenta normalmente pierde.',
    'ATENCIÓN — El salto NO es del archivo ni del mercado: medido contra las otras 21 cuentas de la misma entrega, la razón mediana de septiembre contra su media previa es 0.94x. Sólo 3 de 22 doblaron volumen, y de ésas, el CID 164410 dobló (2.75x) manteniendo su tasa de pérdida en 17.2%. Torres Corzo dobló el volumen Y triplicó la pérdida.',
    'COMERCIAL — «Nuevos Asesor 1 Forum», «Nuevos Asesor 2 Forum» y «Nuevos Asesor 3 Forum» recibieron 13,177 llamadas de 12,732 números distintos y contestaron 372. El 2.8%. Es la línea de venta de autos nuevos de una concesionaria: cada llamada sin contestar es un comprador que llamó y colgó.',
    'ATENCIÓN — El lunes concentra 53,392 llamadas (el 25.6% de la semana) y pierde el 43.3%, contra el 27.5% de la cuenta. Es su día de mayor tráfico y el peor atendido a la vez. El domingo, con 3,589, es el más flojo — coherente con el horario de fin de semana de la red.',
    'MEDICIÓN — 11,498 llamadas perdidas (el 20.1% de todo lo no contestado) no traen destino registrado: entraron y no llegaron a ninguna extensión. El archivo no dice por qué. No se le puede atribuir causa sin revisarlo con soporte.',
    'SERVICIO — 53 de 203 tickets (26.1%) son la MISMA subcategoría: «Ajuste en Flujo (voz)». Una actividad de análisis del 13 de agosto, escrita por el propio equipo, ya lo decía: «la cuenta muestra en todas sus interacciones solicitando ajustes, cambios o reportes a SAC». Ocho meses pidiendo el mismo tipo de ajuste es una configuración que nunca quedó, o una capacitación que no se dio.',
    'SERVICIO — Agosto 2026 cerró 53 tickets, el pico del año y el doble de julio (29). El mes siguiente la operación telefónica colapsó. La secuencia está en el registro; la causalidad no, y no se afirma.',
    'SERVICIO — El folio 106428, «Revisar apertura de conversación con plantilla», lo abrió Ariana Agundis García. Vencía el 3 de mayo de 2026 y su última actividad es del 2 de mayo: esa fecha está CONGELADA en los 20 cortes consecutivos, del 3 de septiembre al 5 de octubre. No es que se atienda despacio — es que nadie lo ha tocado en 156 días.',
    'SERVICIO — Es la cuenta que MÁS tickets levanta de toda la cartera: 203 de 6,394, el 3.17%, lugar 1 de 1,647 CIDs. Y aparece con vencidos en los 20 de 20 cortes de la mesa; en dos de ellos (18 y 21 de septiembre) concentró 4 de los 11 vencidos de TODA la mesa de ayuda: el 36%.',
    'SERVICIO — 39 de 203 tickets (19.2%) tardaron más de 7 días en cerrarse. La mediana real es de 42.2 horas, pero la media sube a 203.6 por casos extremos: el #104448 estuvo abierto 3,522 horas (147 días) y otros cuatro superaron los 96 días.',
    'SERVICIO — Sólo 17 de 203 tickets (8.4%) son fallas del servicio. El 91.6% restante es asistencia y ajustes. El problema de esta cuenta no es que el producto falle: es que requiere intervención constante para operar.',
    'RELACIÓN — EL MAPA DE DECISORES YA ESTÁ ESCRITO Y NADIE LO CAPTURÓ. `contactos_json` está vacío, pero en la prosa de la cuenta y de la mesa hay TRES nombres, dos de ellos marcados como decisores: Jorge García (coordinador de desarrollo de proyectos), Christian Torres (DM) y Ariana Agundis García (DM) — ésta última es quien abrió el folio 106428. El trabajo de capturarlos es de media hora y lleva meses sin hacerse.',
    'RELACIÓN — El Health Score 47 está medido AL 15%. Tres de sus cuatro bloques —actividad, adopción y pago— traen 50, que es el marcador por omisión, no una medición. Sólo el relacional (32) está calculado. Y `health_score_historial` tiene cero filas para esta cuenta: no hay con qué comparar si mejora o empeora.',
    'RIESGO ESTRUCTURAL — La reunión del 4 de septiembre dejó por escrito un riesgo que no es de uso sino de OFERTA: el agotamiento del plan nacional de numeración. «Después de ese bloque ya no podremos seguir ofreciendo nuevas asignaciones bajo este esquema». Una red de 32 oficinas que crece necesita números.',
    'COMERCIAL — De esa misma reunión quedó una decisión de inversión ABIERTA y sin fecha: $96,250 MXN + IVA por 77 horas de desarrollo en 4 semanas (el ofuscador), con DIDs a $99 por número como alternativa. Cinco semanas después no hay registro de que se haya decidido.',
    'RELACIÓN — 0 de 12 preguntas del Radar respondidas. Alerta abierta desde el 6 de octubre, severidad alta.',
    'RELACIÓN — UNA sola reunión y UN solo seguimiento en 56 meses de relación. El score relacional es 32 sobre 100, el componente más bajo del Health Score (47).',
    'TRABAJO — 4 de las 7 actividades registradas quedaron SIN COMPLETAR: dos llamadas (26 jun, 23 jul), una de tickets (16 jul) y una de KAM (3 jul). Las tres que sí se cerraron son de análisis, no de contacto.',
    'CONSUMO — Su consumo cayó 40.43% en nueve meses: 63,898 minutos en enero contra 38,063 en septiembre, sobre una bolsa de 50,000 del plan «AV Agentes Virtuales». Enero (127.8%) y febrero (102.0%) REBASARON la bolsa —excedente que se cobra— y desde marzo no ha vuelto a acercarse. Ninguna alerta lo ve: el detector de caída mira los últimos cinco cortes y la caída ocurrió antes.',
    'FACTURACIÓN — La cuenta SÍ aparece en Gross Revenue Facturación, en 19 líneas «GTC - …», pero NINGUNA tiene CID asignado. Por eso el cruce automático falla y la ficha dice que no aparece. No es que no esté: es que el tablero no la encuentra.',
    'FACTURACIÓN — NINGÚN CRUCE AUTOMÁTICO PUEDE ENCONTRARLA, Y NO ES POR EL CID SOLAMENTE. El nombre de la ficha es «GRUPO TORRES CORZO» y en el GRC se llama «GTC - <agencia>»: no comparten un solo token distintivo. Medido sobre los 3,608 nombres del corte, «corzo» aparece en CERO y «torres» en cuatro que son de otras cuentas (TorresCabel, Mudanzas Torres, Grupo Torresa, Torres Livet). Cruzar por nombre aquí no da poco: da MAL. Mientras facturación no le ponga CID a las 19 líneas, esta cuenta sólo se encuentra a mano.',
    'FACTURACIÓN — EL CORTE DEL 11 DE OCTUBRE LA DA DE BAJA ENTERA. Las 13 líneas activas pasan de $272,436 a CERO, marcadas «Churn confirmado», las 13 con verificación `sin_verificar`. Nueve días antes, en el respaldo del 2 de octubre, esas mismas 13 estaban vivas por los mismos $272,436 y ONCE venían creciendo («Upsell temporal»; sólo INSUR estaba plana). Una cuenta no pasa de crecer a desaparecer en nueve días sin que haya ocurrido algo nombrable: o es la descentralización recontratando agencia por agencia, o es una baja real. Las dos explicaciones caben en el dato y el dato no distingue. Esto se resuelve ANTES de publicar cualquier churn.',
    'FACTURACIÓN — De los 104 CID que cortan el 1 de septiembre, 103 reaparecen el 1 de octubre. El único ausente es el 130723. La cuenta desapareció del último Informe de Cortes y es la única de su cohorte que lo hizo. Con la descentralización encima, la hipótesis razonable es que el consumo se movió a los contratos por agencia — pero sigue siendo hipótesis.',
    'FACTURACIÓN — EL MRR BUENO ES $272,436 Y LA COLUMNA IMPORTA. El GRC trae cuatro cifras por línea y sólo una contesta «cuánto paga este mes»: `mrrFin`, el recurrente al cierre del periodo. Los $316,541 de `cuentas.facturacion` son `acumulado ÷ meses`, o sea un PROMEDIO DE VIDA. Y OJO —la v1.1 de esta auditoría se equivocó aquí—: los «$323,584 del GRC» que citaba como la cifra buena salen de aplicar ESE MISMO promedio a las 19 líneas. Era el error refrescado, no corregido. Los $272,436 los confirman dos cortes independientes: es el `mrrFin` del 2 de octubre y el `mrrIni` del 11.',
    'FACTURACIÓN — El peso en la cartera también estaba mal. «14.8%» exigía un denominador de $2,138,791 que ya no existe. Las 132 cuentas activas facturan $1,356,442, así que GTC con $272,436 es el 23.3% — casi una quinta parte. Sobre las 223 cuentas de todos los estados ($2,060,693) es el 13.2%. Son lecturas distintas de cosas distintas y hay que decir cuál se está usando.',
    'CONTEXTO — El grupo opera en Ciudad de México, San Luis Potosí, Guanajuato, Zacatecas y Aguascalientes, con más de 34 años de sociedad con Nissan y, según sus propias líneas de facturación, también BMW, MG e INFINITI. Los destinos del archivo de llamadas son sus agencias: Forum, Insur CDMX, NIS TLPN, Carretera 57. La operación telefónica era multi-sede y CENTRALIZADA — y es justo eso lo que el cliente pidió cambiar.',
  ],

  cronologia: [
    { fecha: '08 Mar 2021', responsable: 'Callpicker',            evento: 'Alta de la cuenta. Servicio contratado: AV Agentes Virtuales. 56 meses de relación ininterrumpida hasta hoy.', tipo: 'ok' },
    { fecha: 'Ene–Ago 2026', responsable: 'Operación GTC',        evento: 'Comportamiento estable: entre 16,493 y 22,609 entrantes al mes, con 16.5%–32.2% sin contestar. Base del periodo: 20.3%.', tipo: 'neutral' },
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
    { fecha: '02 Oct 2026', responsable: 'Gross Revenue Fact.',   evento: 'Respaldo del corte: las 13 líneas activas del grupo suman $272,436 y ONCE vienen creciendo («Upsell temporal»). Es la última foto en la que la cuenta está entera.', tipo: 'ok' },
    { fecha: '06 Oct 2026', responsable: 'Motor de alertas',      evento: 'Se abren dos alertas de severidad alta: cero contactos capturados y 0 de 12 del Radar.', tipo: 'problema' },
    { fecha: '11 Oct 2026', responsable: 'Gross Revenue Fact.',   evento: 'El corte vigente pone las 13 líneas en CERO y las marca «Churn confirmado», las 13 con verificación `sin_verificar`. Nueve días después del respaldo donde crecían. Nadie las ha comprobado.', tipo: 'problema' },
    { fecha: '12 Oct 2026', responsable: 'Callpicker',            evento: 'Entra por primera vez la lectura de llamadas de esta cuenta. Hasta hoy el tablero no podía medir su atención telefónica y pedía el archivo al cliente.', tipo: 'pivote' },
    { fecha: '12 Oct 2026', responsable: 'Dirección',             evento: 'Dirección aporta el dato que faltaba: EL CLIENTE PIDIÓ DESCENTRALIZAR su cuenta y cada agencia responde ya por su propia comunicación. No estaba en ninguna fuente del tablero — ni en reuniones, ni en seguimientos, ni en observaciones. Es el marco de todo el expediente y llegó por fuera.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'Grupo Torres Corzo Automotriz' },
    { label: 'Giro',                  value: 'Venta de vehículos — grupo MULTIMARCA: Nissan, BMW, MG e INFINITI' },
    { label: 'Fundación',             value: '1987 · más de 34 años de sociedad con Nissan Mexicana' },
    { label: 'Cobertura',             value: 'CDMX, San Luis Potosí, Guanajuato, Zacatecas y Aguascalientes' },
    { label: 'Modelo de cuenta',      value: 'EN DESCENTRALIZACIÓN a petición del cliente — cada agencia responde por su propia comunicación' },
    { label: 'Agencias identificadas',value: 'Las 19 líneas del GRC: Centro Max, Nava, Carranza, Carranza-Lomas, Forum, BMW, Sendero, MG Poliforum, MG Lomas, Matehuala, Rioverde, Infiniti Querétaro, Insur, Infiniti León, Lomas, Crossing, La Joya, Tlalpan, Oleksei' },
    { label: 'Tamaño',                value: 'Grande — 1,200 empleados, 32 oficinas' },
    { label: 'Domicilio fiscal',      value: 'Av. Dr. Salvador Nava Martínez #205, Col. Capricornio, San Luis Potosí, S.L.P., C.P. 78399' },
    { label: 'Sitio',                 value: 'gtc-mx.com — cotización en línea con respuesta por WhatsApp' },
    { label: 'Contacto registrado',   value: 'Jorge García — coordinador de desarrollo de proyectos · 55 9752 5075 · SIN correo en la ficha' },
    { label: 'Interlocutor en junta', value: 'Daniel Martínez (reunión del 4 sep 2026). NO está capturado como contacto.' },
    { label: 'Cliente desde',         value: '8 de marzo de 2021 — 56 meses' },
    { label: 'Servicio contratado',   value: 'AV Agentes Virtuales' },
    { label: 'Facturación mensual',   value: '$272,436 MXN (GRC `mrrFin`, 2 oct) — el 23.3% de la cartera activa. La ficha dice $316,541, que es su promedio de vida.' },
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
    { nombre: 'Anclar al septiembre', descripcion: 'Comparar septiembre contra su propia base de enero a agosto, no contra un estándar de la industria. 20.3% → 55.5% es su propio deterioro.', impacto: 'Evita la respuesta «así es este negocio»: el punto de comparación es la propia cuenta.' },
    { nombre: 'Preguntar por WhatsApp sin acusar', descripcion: 'La reunión del 4 de septiembre documenta que se pausaron las campañas. Preguntar si el tráfico se volcó al teléfono, no afirmarlo.', impacto: 'Si lo confirma, abre la conversación de respaldo de canal; si lo niega, hay otra causa que encontrar.' },
    { nombre: 'Cerrar el 106428 antes de la junta', descripcion: 'Llegar con un folio de 155 días abierto a hablar de calidad de atención le entrega al cliente el argumento.', impacto: 'Quita de la mesa la única objeción que no se puede contestar con datos.' },
  ],

  senal_alarma: 'EL CLIENTE REORGANIZÓ SU CUENTA Y EL TABLERO NO SE ENTERÓ POR NINGUNA DE SUS FUENTES. La descentralización no aparece en reuniones, ni en seguimientos, ni en observaciones, ni en actividades: llegó por dirección, de viva voz. Es una cuenta del 23.3% de la cartera activa, con 56 meses de permanencia, cero contactos capturados, cero de doce del Radar, una sola reunión en todo el historial y un folio escalado sin moverse desde mayo. Y mientras tanto el corte del 11 de octubre ya la da de baja entera, sin verificar. Si esta cuenta decide irse, Callpicker se entera el día que lo diga.',

  problema_raiz: 'El cliente cambió el modelo de su cuenta y Callpicker no tenía dónde registrarlo. Se la siguió gestionando como un servicio centralizado que funciona.',

  problema_raiz_detalle: 'EMPECEMOS POR LO QUE NO ES. No es que nadie hiciera su trabajo: es que el trabajo que había que hacer cambió y no hubo forma de saberlo. El cliente pidió descentralizar —cada agencia responde por su propia comunicación— y ese hecho, que reordena absolutamente todo lo demás, NO ESTÁ EN NINGUNA FUENTE DEL TABLERO. No hay una reunión que lo registre, ni un seguimiento, ni una observación KAM, ni una actividad. Llegó por dirección el 12 de octubre, de viva voz, cuando esta auditoría ya estaba escrita y la había interpretado al revés.\n\nEso es el problema raíz, y es de diseño: el tablero sabe medir consumo, tickets y llamadas, pero no tiene dónde anotar «esta cuenta cambió de modelo». Un cambio así deja huellas en todos los indicadores a la vez —el consumo baja, la atención se cae, la facturación se parte en líneas— y cada indicador por separado parece un deterioro. La ficha de una cuenta necesita un campo que diga qué está pasando con ella, porque sin él los números cuentan la historia equivocada con toda precisión.\n\nDurante 56 meses GTC pagó puntualmente, no abrió conflictos comerciales y usó el producto de forma intensiva —927 visitas al mes al panel—. Eso produjo la lectura de una cuenta sana, y el 6 de agosto de 2026 quedó escrita: «SLA cumplido, no se ha detectado errores consistentes».\n\nPero el tablero no tenía su lectura de llamadas. Hasta el 12 de octubre de 2026, esta cuenta figuraba como «no la vemos»: la ficha pedía al asesor que le solicitara al cliente un Excel de llamadas entrantes y salientes. O sea que durante todo el deterioro de septiembre —43,860 llamadas, 24,341 sin contestar— el único indicador disponible era que la cuenta no se quejaba.\n\nEl segundo nivel del problema es que lo que SÍ se veía se leyó al revés. 203 tickets en ocho meses, con el 26.1% pidiendo el mismo ajuste de flujo, se interpretó como un cliente demandante y no como un cliente cuya configuración nunca quedó resuelta. El 13 de agosto el propio equipo escribió que «en todas sus interacciones» pedía ajustes — y la acción que siguió fue una actividad de análisis, no una intervención técnica.\n\nEl tercero es de relación. Cero contactos capturados y cero del Radar significa que no hay mapa: no se sabe quién decide el presupuesto de telefonía, quién dirige a los asesores de nuevos ni quién respondería si Nissan Mexicana preguntara por el desempeño del contact center. Hay un interlocutor técnico —Jorge García— y uno que apareció en la junta de septiembre —Daniel Martínez— que ni siquiera está registrado como contacto.',

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
    { metrica: 'El modelo de la cuenta, registrado en el tablero', real: 'EN NINGUNA PARTE — la descentralización llegó por dirección', ideal: 'Un campo en la ficha que diga qué está pasando con la cuenta' },
    { metrica: 'Las 13 líneas activas · corte del 11 oct', real: '$0, «Churn confirmado», `sin_verificar` las 13', ideal: '$272,436 como el 2 oct, o 13 verificaciones una por una' },
    { metrica: 'Capacidad de atender vs. volumen (ago→sep)', real: '+130 contestadas contra +25,840 entrantes', ideal: 'Que crezcan juntas, o que se sepa quién dejó el número' },
    { metrica: 'Entrantes sin contestar · septiembre', real: '55.5% (24,341 de 43,860)', ideal: 'Su propia base ene–ago: 20.3%' },
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
    { accion: 'MAPEAR LA DESCENTRALIZACIÓN: de las 19 agencias del GRC, cuáles siguen con Callpicker, cuáles contratan aparte y cuáles se fueron. Es la pregunta de la que dependen todas las demás de este expediente', responsable: 'Dan / Dirección', criterio: 'Las 19 líneas con un estado escrito y un interlocutor con nombre, no un agregado' },
    { accion: 'PARAR el churn marcado sin verificar: el corte del 11 oct da de baja las 13 líneas activas —$272,436— con verificación `sin_verificar`, y nueve días antes once de ellas venían creciendo', responsable: 'Dirección / Facturación', criterio: 'Las 13 líneas quedan verificadas una por una, confirmadas o revertidas, antes del siguiente corte' },
    { accion: 'Asignar CID a las 19 líneas «GTC - …» del GRC. Sin CID esta cuenta no la encuentra ningún cruce automático, y el nombre no sirve: «corzo» aparece en cero de los 3,608 nombres del corte', responsable: 'Facturación', criterio: 'Las 19 líneas con CID, y la ficha de D1 mostrando su facturación sin intervención manual' },
    { accion: 'Cerrar o escalar formalmente el folio 106428 antes de cualquier contacto comercial', responsable: 'Mesa de ayuda / Dan', criterio: 'El folio cambia de estado o tiene fecha comprometida por escrito, antes de la llamada' },
    { accion: 'Llamar a Jorge García y a Daniel Martínez con el desglose por destino en la mano y preguntar quién responde HOY por cada línea «Nuevos Asesor Forum» — preguntando, no señalando: si Forum ya se hace cargo de su comunicación, el 2.8% no es nuestra falla', responsable: 'Dan', criterio: 'Queda por escrito quién contesta esas tres extensiones, en qué horario y a qué agencia pertenecen ahora' },
    { accion: 'Preguntar si el tráfico de septiembre se volcó al teléfono al pausar las campañas de WhatsApp', responsable: 'Dan', criterio: 'Respuesta del cliente registrada en seguimiento, confirmando o descartando la relación' },
    { accion: 'Averiguar por qué el CID 130723 desapareció del Informe de Cortes del 1 de octubre, siendo el único de 104 que no reapareció — con la descentralización encima, la hipótesis es que el consumo se movió a los contratos por agencia', responsable: 'Facturación', criterio: 'Se confirma si cambió de CID, si se facturó por otro contrato o si quedó fuera del export' },
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
    { accion: 'DARLE AL TABLERO DÓNDE ANOTAR UN CAMBIO DE MODELO. La descentralización de GTC no cabía en ninguna fuente: ni reunión, ni seguimiento, ni observación. Un cambio estructural mueve todos los indicadores a la vez y cada uno por separado parece un deterioro', responsable: 'Producto / Dirección', criterio: 'La ficha tiene un campo de situación estructural, y la auditoría y las alertas lo leen antes de concluir' },
    { accion: 'Panel de desempeño por agencia: Forum contra Insur contra Carretera 57. Con la descentralización deja de ser un extra y pasa a ser el producto — es lo que cada agencia necesita para responder por su propia comunicación', responsable: 'Producto / Dan', criterio: 'El cliente recibe un reporte mensual por sede, no agregado' },
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
        { label: 'Riesgo',    value: 'Punto único de contacto en una cuenta de $272,436 al mes que se está partiendo en 19 agencias' },
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
      'El cambio de modelo que pidió el cliente no está registrado en ninguna fuente del tablero',
      'Cero contactos capturados en una cuenta que ahora se negocia agencia por agencia: 19 interlocutores y ningún nombre',
      '55.5% de llamadas sin contestar en septiembre contra su base de 20.3%',
      'La capacidad de atender no se movió cuando el volumen se dobló: +130 contra +25,840',
      '0 de 12 del Radar en 56 meses · score relacional 32, el componente más bajo de su Health Score',
      '26.1% de sus tickets son el mismo ajuste sin resolver de raíz',
      'Las 19 líneas del GRC sin CID: invisible para todo cruce automático, y el nombre no la encuentra',
      'Desapareció del Informe de Cortes del 1 de octubre: su consumo dejó de ser medible por ahí',
    ],
    amenazas: [
      'LA DESCENTRALIZACIÓN PUEDE SER UNA SALIDA POR ETAPAS Y VERSE IGUAL QUE UNA REORGANIZACIÓN. Si cada agencia elige su proveedor, Callpicker no pierde una cuenta: pierde diecinueve decisiones, una por una, y cada una con un interlocutor que hoy no está capturado. Es la amenaza que ordena a todas las demás.',
      'EL GRC VIGENTE YA LA DA DE BAJA: 13 líneas en cero, $272,436 marcados «Churn confirmado» con verificación `sin_verificar`. Nueve días antes once de ellas venían creciendo. Si eso se publica sin revisar, el 23.3% de la cartera activa aparece perdido en el reporte de dirección sin que nadie lo haya comprobado.',
      'Desapareció del Informe de Cortes del 1 de octubre, única de 104 CID. O el consumo se movió a los contratos por agencia, o se cayó del export: las dos cosas hay que saberlas.',
      'MIENTRAS LAS 19 LÍNEAS NO TENGAN CID, ESTA CUENTA ES INVISIBLE PARA EL TABLERO. No hay cruce por nombre que la salve: «corzo» aparece en cero de los 3,608 nombres del corte. Cada reporte automático que se genere seguirá dejándola fuera, y el único que la ve es quien la busca a mano sabiendo que existe.',
      'El consumo cayó 40.43% en nueve meses y ninguna alerta lo vio, porque el detector sólo mira los últimos cinco cortes',
      'Folio escalado 156 días sin moverse — argumento servido si el cliente cuestiona el servicio',
      'Nissan Mexicana es su socio de marca: un desempeño telefónico así es auditable por el fabricante',
      'Agotamiento del plan nacional de numeración: una red de 32 oficinas que crece y no podrá pedir números bajo el esquema actual',
    ],
  },

  conclusion: 'GTC no es una cuenta en riesgo de churn por insatisfacción. Es una cuenta que CAMBIÓ DE FORMA y que Callpicker siguió midiendo con la forma anterior. El cliente pidió descentralizar; cada agencia responde por su comunicación; la facturación ya se partió en 19 líneas y el teléfono central quedó atendido por el mismo número de personas que antes. Todos los indicadores se cayeron a la vez, y cada uno por separado parecía un deterioro del servicio.\n\nEso no vuelve inocuos los números de septiembre, y aquí está la parte incómoda: 24,341 llamadas sin contestar en el mes, 12,805 de ellas en las líneas de venta de autos nuevos, en un grupo que vive de vender coches. Si esas llamadas iban a agencias que ya se hacen cargo de sí mismas, el problema es del cliente y nuestro trabajo es mostrárselo. Si seguían siendo nuestras, el problema es nuestro. Hoy no se sabe cuál de las dos, y ESA es la pregunta de la llamada — no el 55.5%.\n\nLa ventaja es que esos números los tiene Callpicker primero, y desde hoy. Una descentralización es el momento en que un proveedor se vuelve prescindible o indispensable, y se decide en las primeras conversaciones: llegar con el desglose por agencia convierte a Callpicker en quien le ordena la transición al cliente, en vez de en el conmutador que quedó atrás.\n\nY hay una lección de la casa que no es sobre GTC: el dato que reordenó este expediente entero no estaba en ninguna fuente del tablero. Llegó por dirección, de viva voz, con la auditoría ya escrita y leída al revés.',

  pierde: [
    'Callpicker pierde $272,436 al mes — el 23.3% de la cartera activa de Customer Success — si el grupo entero se va. Y puede perderlo por partes: cada agencia es hoy una decisión aparte.',
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

  recomendacion_central: 'TODO SE ORDENA DETRÁS DE UNA PREGUNTA, Y NO ES SOBRE EL SERVICIO: de las 19 agencias, ¿cuántas siguen siendo nuestras? El cliente pidió descentralizar y cada agencia responde ya por su propia comunicación. Hasta que esa pregunta tenga respuesta por escrito, agencia por agencia, no se sabe si esta cuenta vale $272,436 al mes o diecinueve negociaciones distintas — y toda conclusión de churn sobre ella es prematura.\n\nHay DOS urgencias y no son del mismo tipo.\n\nLA DE DENTRO, esta semana: el corte del 11 de octubre pone las 13 líneas activas en cero y las marca «Churn confirmado», las 13 `sin_verificar`, nueve días después de un respaldo donde once venían creciendo. Eso NO puede llegar a un reporte de dirección sin verificar, porque hoy el tablero daría por perdido el 23.3% de la cartera activa sin que nadie lo haya comprobado. Y en la misma pasada, ponerle CID a las 19 líneas: mientras no lo tengan, esta cuenta no existe para ningún cruce automático y la siguiente persona que la busque volverá a concluir que no factura.\n\nLA DE FUERA: llamar con el desglose por destino en la mano y abrir con una sola pregunta — «¿quién contesta hoy las tres líneas de Nuevos Asesor de Forum?». No se abre con el 55.5% ni con el SLA, y sobre todo no se abre acusando: si Forum ya responde por su comunicación, el 2.8% no es una falla nuestra sino una extensión que quedó colgando del conmutador viejo, y decirlo al revés quema la conversación. Se abre mostrándole al cliente que de 13,177 personas que marcaron buscando un coche, 372 encontraron a alguien — y preguntando a quién debería llegarle ese número ahora.\n\nY antes de esa llamada, mover el folio 106428, que lleva 156 días con la misma fecha de última actividad. Llegar a hablar de atención con eso abierto es entregarle al cliente el único argumento que no se puede contestar con datos.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 203 tickets de «GTC Contact Center» (CID 130723) en lib/tickets-data.json',
    periodo: 'Febrero 2026 – Octubre 2026 · la fuente trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí',
    diagnostico: 'El producto no le falla a GTC: sólo 17 de 203 tickets (8.4%) son fallas. Lo que ocurre es que su operación requiere intervención constante para funcionar. El 26.1% de todos sus tickets —53 de 203— son la misma subcategoría, «Ajuste en Flujo (voz)», repetida durante ocho meses. El propio equipo lo escribió el 13 de agosto: la cuenta «en todas sus interacciones» pide ajustes. Agosto cerró 53 tickets, el pico del año, y el mes siguiente su teléfono colapsó.',
    metricas: [
      { metrica: 'Tickets totales',          valor: '203 (feb–oct 2026)',   lectura: 'La cuenta con más volumen de la cartera, acorde a su tamaño' },
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
