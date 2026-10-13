import type { AuditoriaCase } from './types'

/**
 * GRUPO TORRES CORZO (D1 Â· CID 130723) â€” la cuenta MAYOR de la cartera.
 *
 * Primera auditorÃ­a, 12 oct 2026. Se pudo escribir porque ese mismo dÃ­a entrÃ³
 * la lectura de llamadas de esta cuenta: hasta entonces el tablero decÃ­a Â«no
 * tenemos sus llamadasÂ» y mandaba al asesor a pedirle el Excel al cliente.
 *
 * TODAS las cifras salen de fuente y estÃ¡n verificadas una por una:
 *   Â· llamadas  â†’ app/cuentas/llamadas-data.ts, CID 130723 (entrega oct-2026)
 *   Â· tickets   â†’ lib/tickets-data.json, 203 filas de Â«GTC Contact CenterÂ»
 *   Â· alertas   â†’ alertas_episodios, 3 abiertos
 *   Â· ficha     â†’ tabla `cuentas`, registro completo
 *   Â· el grupo  â†’ gtc-mx.com y prensa de Nissan Mexicana
 */
export const TORRES_CORZO: AuditoriaCase = {
  id: 'torres-corzo',
  asesor: 'Dan',
  nombre: 'Grupo Torres Corzo Automotriz (GTC)',
  sector: 'Automotriz â€” red de concesionarias Nissan, 5 estados',
  fecha_periodo: 'Marzo 2021 â€“ Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA â€” la MAYOR de la cartera',
  descripcion_contexto: '56 meses de cliente Â· $316,541 al mes, el 14.8% de la cartera Â· 208,255 llamadas entrantes y 594,523 salientes medidas Â· 203 tickets Â· AuditorÃ­a de atenciÃ³n telefÃ³nica + servicio',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.1',

  kpis: [
    { label: 'Sin contestar Â· septiembre', value: '24,341 de 43,860 Â· 55.5%', color: '#ef4444' },
    { label: 'Contra su propia base',      value: '+35.2 pts (era 20.3%)',    color: '#ef4444' },
    { label: 'LÃ­nea de autos nuevos',      value: '372 de 13,177 Â· 2.8%',     color: '#f97316' },
    { label: 'Folio 106428 sin moverse',   value: '155 dÃ­as fuera de SLA',    color: '#f59e0b' },
    { label: 'FacturaciÃ³n en juego',       value: '$316,541 MXN / mes',       color: '#6366f1' },
  ],

  resumen_ejecutivo: 'Grupo Torres Corzo es la cuenta mÃ¡s grande de la cartera: $316,541 al mes, el 14.8% de todo lo que factura Customer Success, y cliente desde marzo de 2021. Opera concesionarias Nissan en cinco estados con 32 oficinas y unos 1,200 empleados. Su contrato con Callpicker es de Agentes Virtuales, y su operaciÃ³n telefÃ³nica no es un servicio de soporte: es el canal por el que entra quien quiere comprar un coche.\n\nEn septiembre de 2026 esa operaciÃ³n se rompiÃ³. Entraron 43,860 llamadas â€”el doble de su media de enero a agostoâ€” y 24,341 se quedaron sin contestar: 55 de cada 100. Su propia base previa era del 20.3%. Son 35.2 puntos de deterioro en un solo mes, y no es un efecto del volumen: de las 22 cuentas de esta misma entrega, la mediana se moviÃ³ 0.94x en septiembre, y otra que tambiÃ©n doblÃ³ su trÃ¡fico mantuvo su tasa de pÃ©rdida intacta. AquÃ­ no es que entraran mÃ¡s llamadas: es que no pudieron tomarlas.\n\nEl desglose por destino dice dÃ³nde. Tres extensiones llamadas Â«Nuevos Asesor 1, 2 y 3 ForumÂ» â€”la lÃ­nea de venta de autos nuevosâ€” recibieron 13,177 llamadas de 12,732 nÃºmeros distintos y contestaron 372. El 2.8%. No es lentitud de respuesta: es una lÃ­nea comercial que prÃ¡cticamente no se atiende.\n\nY hay una secuencia documentada en los propios registros de la cuenta. En agosto la mesa de ayuda cerrÃ³ 53 tickets, el pico del aÃ±o y el doble del mes anterior. El 4 de septiembre, en la Ãºnica reuniÃ³n registrada con el cliente, Daniel MartÃ­nez informa de una incidencia de WhatsApp atribuida a Meta que obliga a PAUSAR LAS CAMPAÃ‘AS DE MARKETING. WhatsApp es, segÃºn el propio sitio del grupo, el canal por el que se cotiza en lÃ­nea. El archivo no afirma que una cosa cause la otra, y esta auditorÃ­a tampoco lo afirma â€” pero la pregunta de si el trÃ¡fico se volcÃ³ al telÃ©fono cuando se cerrÃ³ el canal digital es la primera que hay que hacerle al cliente.\n\nDebajo de todo esto hay una cuenta que Callpicker no ve: cero contactos capturados, cero de doce preguntas del Radar respondidas, una sola reuniÃ³n y un solo seguimiento en 56 meses de relaciÃ³n. El Health Score es 47 y su componente relacional, 32.',

  resultado_positivo: 'La cuenta paga y paga bien: 0 incidencias de pago, al corriente, y 56 meses de permanencia ininterrumpida desde marzo de 2021. El cliente no se estÃ¡ yendo por precio ni por cobranza.\n\nLa adopciÃ³n del producto es real y estÃ¡ medida: el panel de administraciÃ³n registra 927 visitas promedio al mes a configuraciÃ³n y reportes, y la evaluaciÃ³n automÃ¡tica de adopciÃ³n califica ALTO tanto en IA de Voz como en uso del panel. Es un cliente que SÃ usa lo que comprÃ³ â€” lo cual significa que el problema de septiembre no es de desuso ni de desinterÃ©s, sino de capacidad.\n\nY hay un interlocutor activo y tÃ©cnico: Jorge GarcÃ­a, coordinador de desarrollo de proyectos, con correo y telÃ©fono registrados. La reuniÃ³n del 4 de septiembre fue sustantiva â€” se hablÃ³ de incidencias, de una propuesta de ofuscador y de costos de desarrollo. Hay con quiÃ©n hablar; lo que no hay es un mapa de quiÃ©n decide.',

  hallazgos: [
    'ATENCIÃ“N â€” Septiembre 2026: 24,341 de 43,860 entrantes sin contestar (55.5%), contra una base propia de 20.3% de enero a agosto. Deterioro de 35.2 puntos. Son 15,441 llamadas perdidas MÃS de las que esta cuenta normalmente pierde.',
    'ATENCIÃ“N â€” El salto NO es del archivo ni del mercado: medido contra las otras 21 cuentas de la misma entrega, la razÃ³n mediana de septiembre contra su media previa es 0.94x. SÃ³lo 3 de 22 doblaron volumen, y de Ã©sas, el CID 164410 doblÃ³ (2.75x) manteniendo su tasa de pÃ©rdida en 17.2%. Torres Corzo doblÃ³ el volumen Y triplicÃ³ la pÃ©rdida.',
    'COMERCIAL â€” Â«Nuevos Asesor 1 ForumÂ», Â«Nuevos Asesor 2 ForumÂ» y Â«Nuevos Asesor 3 ForumÂ» recibieron 13,177 llamadas de 12,732 nÃºmeros distintos y contestaron 372. El 2.8%. Es la lÃ­nea de venta de autos nuevos de una concesionaria: cada llamada sin contestar es un comprador que llamÃ³ y colgÃ³.',
    'ATENCIÃ“N â€” El lunes concentra 53,392 llamadas (el 25.6% de la semana) y pierde el 43.3%, contra el 27.5% de la cuenta. Es su dÃ­a de mayor trÃ¡fico y el peor atendido a la vez. El domingo, con 3,589, es el mÃ¡s flojo â€” coherente con el horario de fin de semana de la red.',
    'MEDICIÃ“N â€” 11,498 llamadas perdidas (el 20.1% de todo lo no contestado) no traen destino registrado: entraron y no llegaron a ninguna extensiÃ³n. El archivo no dice por quÃ©. No se le puede atribuir causa sin revisarlo con soporte.',
    'SERVICIO â€” 53 de 203 tickets (26.1%) son la MISMA subcategorÃ­a: Â«Ajuste en Flujo (voz)Â». Una actividad de anÃ¡lisis del 13 de agosto, escrita por el propio equipo, ya lo decÃ­a: Â«la cuenta muestra en todas sus interacciones solicitando ajustes, cambios o reportes a SACÂ». Ocho meses pidiendo el mismo tipo de ajuste es una configuraciÃ³n que nunca quedÃ³, o una capacitaciÃ³n que no se dio.',
    'SERVICIO â€” Agosto 2026 cerrÃ³ 53 tickets, el pico del aÃ±o y el doble de julio (29). El mes siguiente la operaciÃ³n telefÃ³nica colapsÃ³. La secuencia estÃ¡ en el registro; la causalidad no, y no se afirma.',
    'SERVICIO â€” El folio 106428, Â«Revisar apertura de conversaciÃ³n con plantillaÂ», lo abriÃ³ Ariana Agundis GarcÃ­a. VencÃ­a el 3 de mayo de 2026 y su Ãºltima actividad es del 2 de mayo: esa fecha estÃ¡ CONGELADA en los 20 cortes consecutivos, del 3 de septiembre al 5 de octubre. No es que se atienda despacio â€” es que nadie lo ha tocado en 156 dÃ­as.',
    'SERVICIO â€” Es la cuenta que MÃS tickets levanta de toda la cartera: 203 de 6,394, el 3.17%, lugar 1 de 1,647 CIDs. Y aparece con vencidos en los 20 de 20 cortes de la mesa; en dos de ellos (18 y 21 de septiembre) concentrÃ³ 4 de los 11 vencidos de TODA la mesa de ayuda: el 36%.',
    'SERVICIO â€” 39 de 203 tickets (19.2%) tardaron mÃ¡s de 7 dÃ­as en cerrarse. La mediana real es de 42.2 horas, pero la media sube a 203.6 por casos extremos: el #104448 estuvo abierto 3,522 horas (147 dÃ­as) y otros cuatro superaron los 96 dÃ­as.',
    'SERVICIO â€” SÃ³lo 17 de 203 tickets (8.4%) son fallas del servicio. El 91.6% restante es asistencia y ajustes. El problema de esta cuenta no es que el producto falle: es que requiere intervenciÃ³n constante para operar.',
    'RELACIÃ“N â€” EL MAPA DE DECISORES YA ESTÃ ESCRITO Y NADIE LO CAPTURÃ“. `contactos_json` estÃ¡ vacÃ­o, pero en la prosa de la cuenta y de la mesa hay TRES nombres, dos de ellos marcados como decisores: Jorge GarcÃ­a (coordinador de desarrollo de proyectos), Christian Torres (DM) y Ariana Agundis GarcÃ­a (DM) â€” Ã©sta Ãºltima es quien abriÃ³ el folio 106428. El trabajo de capturarlos es de media hora y lleva meses sin hacerse.',
    'RELACIÃ“N â€” El Health Score 47 estÃ¡ medido AL 15%. Tres de sus cuatro bloques â€”actividad, adopciÃ³n y pagoâ€” traen 50, que es el marcador por omisiÃ³n, no una mediciÃ³n. SÃ³lo el relacional (32) estÃ¡ calculado. Y `health_score_historial` tiene cero filas para esta cuenta: no hay con quÃ© comparar si mejora o empeora.',
    'RIESGO ESTRUCTURAL â€” La reuniÃ³n del 4 de septiembre dejÃ³ por escrito un riesgo que no es de uso sino de OFERTA: el agotamiento del plan nacional de numeraciÃ³n. Â«DespuÃ©s de ese bloque ya no podremos seguir ofreciendo nuevas asignaciones bajo este esquemaÂ». Una red de 32 oficinas que crece necesita nÃºmeros.',
    'COMERCIAL â€” De esa misma reuniÃ³n quedÃ³ una decisiÃ³n de inversiÃ³n ABIERTA y sin fecha: $96,250 MXN + IVA por 77 horas de desarrollo en 4 semanas (el ofuscador), con DIDs a $99 por nÃºmero como alternativa. Cinco semanas despuÃ©s no hay registro de que se haya decidido.',
    'RELACIÃ“N â€” 0 de 12 preguntas del Radar respondidas. Alerta abierta desde el 6 de octubre, severidad alta.',
    'RELACIÃ“N â€” UNA sola reuniÃ³n y UN solo seguimiento en 56 meses de relaciÃ³n. El score relacional es 32 sobre 100, el componente mÃ¡s bajo del Health Score (47).',
    'TRABAJO â€” 4 de las 7 actividades registradas quedaron SIN COMPLETAR: dos llamadas (26 jun, 23 jul), una de tickets (16 jul) y una de KAM (3 jul). Las tres que sÃ­ se cerraron son de anÃ¡lisis, no de contacto.',
    'CONSUMO â€” Su consumo cayÃ³ 40.43% en nueve meses: 63,898 minutos en enero contra 38,063 en septiembre, sobre una bolsa de 50,000 del plan Â«AV Agentes VirtualesÂ». Enero (127.8%) y febrero (102.0%) REBASARON la bolsa â€”excedente que se cobraâ€” y desde marzo no ha vuelto a acercarse. Ninguna alerta lo ve: el detector de caÃ­da mira los Ãºltimos cinco cortes y la caÃ­da ocurriÃ³ antes.',
    'FACTURACIÃ“N â€” La cuenta SÃ aparece en Gross Revenue FacturaciÃ³n, en 19 lÃ­neas Â«GTC - â€¦Â», pero NINGUNA tiene CID asignado. Por eso el cruce automÃ¡tico falla y la ficha dice que no aparece. No es que no estÃ©: es que el tablero no la encuentra.',
    'FACTURACIÃ“N â€” El GRC vigente pone las 13 lÃ­neas activas del grupo en CERO y las marca Â«Churn confirmadoÂ» con verificaciÃ³n `sin_verificar`: $272,436.10 dados de baja sin que nadie lo haya comprobado. En el respaldo del 2 de octubre las mismas lÃ­neas estaban vivas. Esto se revisa ANTES de cualquier conclusiÃ³n de churn.',
    'FACTURACIÃ“N â€” De los 104 CID que cortan el 1 de septiembre, 103 reaparecen el 1 de octubre. El Ãºnico ausente es el 130723. La cuenta desapareciÃ³ del Ãºltimo Informe de Cortes y es la Ãºnica de su cohorte que lo hizo.',
    'FACTURACIÃ“N â€” El importe de $316,541 sale de `cuentas.facturacion`, escrito por un script que suma por ACRÃ“NIMO (Â«GTCÂ») y no por CID, y que usa el `mrr_limpio` de la vista LTV de Zoho â€” que es acumulado Ã· meses, o sea un PROMEDIO DE VIDA y no el mes vigente. Con el mismo mÃ©todo hoy darÃ­a $323,584: la cifra guardada estÃ¡ $7,043 desactualizada.',
    'CONTEXTO â€” El grupo opera concesionarias Nissan en Ciudad de MÃ©xico, San Luis PotosÃ­, Guanajuato, Zacatecas y Aguascalientes, con mÃ¡s de 34 aÃ±os de sociedad con la marca. Los destinos del archivo de llamadas son sus agencias: Forum, Insur CDMX, NIS TLPN, Carretera 57. La operaciÃ³n telefÃ³nica es multi-sede y centralizada.',
  ],

  cronologia: [
    { fecha: '08 Mar 2021', responsable: 'Callpicker',            evento: 'Alta de la cuenta. Servicio contratado: AV Agentes Virtuales. 56 meses de relaciÃ³n ininterrumpida hasta hoy.', tipo: 'ok' },
    { fecha: 'Eneâ€“Ago 2026', responsable: 'OperaciÃ³n GTC',        evento: 'Comportamiento estable: entre 16,493 y 22,609 entrantes al mes, con 16.5%â€“32.2% sin contestar. Base del periodo: 20.3%.', tipo: 'neutral' },
    { fecha: '10 May 2026', responsable: 'Mesa de ayuda',         evento: 'Se abre el folio 106428. A fecha de esta auditorÃ­a lleva 155 dÃ­as fuera de SLA y 156 sin movimiento, en estado Escalado.', tipo: 'problema' },
    { fecha: 'Jun 2026',    responsable: 'Dan',                   evento: 'Actividad de llamada programada para el 26 de junio. NO se completÃ³.', tipo: 'problema' },
    { fecha: 'Jul 2026',    responsable: 'Dan',                   evento: 'Tres actividades programadas â€”KAM el 3, tickets el 16, llamada el 23â€” y ninguna se completÃ³. La del 10 de julio, de anÃ¡lisis, sÃ­: Â«llamadas Ãºnicamente informativas sobre los servicios automotrices que ofrecen, con buen tiempo de atenciÃ³nÂ».', tipo: 'problema' },
    { fecha: '06 Ago 2026', responsable: 'Dan',                   evento: 'AnÃ¡lisis cerrado: Â«SLA cumplido, no se ha detectado errores consistentes o faltos de atenciÃ³n en las solicitudesÂ». Es la Ãºltima lectura positiva antes del deterioro.', tipo: 'neutral' },
    { fecha: '13 Ago 2026', responsable: 'Dan',                   evento: 'AnÃ¡lisis cerrado: Â«la cuenta muestra en todas sus interacciones solicitando ajustes, cambios o reportes a SACÂ». El patrÃ³n se nombra por escrito seis semanas antes del colapso.', tipo: 'problema' },
    { fecha: 'Ago 2026',    responsable: 'Mesa de ayuda',         evento: '53 tickets cerrados, el pico del aÃ±o y el doble de julio. El #104448 llevaba 147 dÃ­as abierto.', tipo: 'problema' },
    { fecha: '14 Ago 2026', responsable: 'GTC / Callpicker',      evento: 'Ãšltimo contacto registrado en la ficha antes de la reuniÃ³n de septiembre.', tipo: 'neutral' },
    { fecha: '04 Sep 2026', responsable: 'Daniel MartÃ­nez / GTC', evento: 'ReuniÃ³n Â«Callpicker <> GTCÂ». Incidencia en el servicio de WhatsApp atribuida a Meta: error en mensajes salientes. ACUERDO: pausar las campaÃ±as de marketing. Se propone un ofuscador y se discuten costos de desarrollo.', tipo: 'pivote' },
    { fecha: 'Sep 2026',    responsable: 'OperaciÃ³n GTC',         evento: '43,860 entrantes â€”el doble de su mediaâ€” y 24,341 sin contestar: 55.5%. El peor mes registrado, con diferencia.', tipo: 'problema' },
    { fecha: '14 Sep 2026', responsable: 'Daniel MartÃ­nez',       evento: 'Seguimiento por correo: asignar nÃºmeros nuevos es costoso y lento por regulaciÃ³n IFT. Se recomienda una soluciÃ³n alterna.', tipo: 'neutral' },
    { fecha: '06 Oct 2026', responsable: 'Motor de alertas',      evento: 'Se abren dos alertas de severidad alta: cero contactos capturados y 0 de 12 del Radar.', tipo: 'problema' },
    { fecha: '12 Oct 2026', responsable: 'Callpicker',            evento: 'Entra por primera vez la lectura de llamadas de esta cuenta. Hasta hoy el tablero no podÃ­a medir su atenciÃ³n telefÃ³nica y pedÃ­a el archivo al cliente.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'RazÃ³n social',          value: 'Grupo Torres Corzo Automotriz' },
    { label: 'Giro',                  value: 'Venta de vehÃ­culos â€” red de concesionarias Nissan' },
    { label: 'FundaciÃ³n',             value: '1987 Â· mÃ¡s de 34 aÃ±os de sociedad con Nissan Mexicana' },
    { label: 'Cobertura',             value: 'CDMX, San Luis PotosÃ­, Guanajuato, Zacatecas y Aguascalientes' },
    { label: 'Agencias identificadas',value: 'Nissan Nava, Carretera 57, Carranza (SLP) Â· Rioverde Â· Matehuala Â· Forum Â· Centro Max (LeÃ³n) Â· Insur y TLPN (CDMX)' },
    { label: 'TamaÃ±o',                value: 'Grande â€” 1,200 empleados, 32 oficinas' },
    { label: 'Domicilio fiscal',      value: 'Av. Dr. Salvador Nava MartÃ­nez #205, Col. Capricornio, San Luis PotosÃ­, S.L.P., C.P. 78399' },
    { label: 'Sitio',                 value: 'gtc-mx.com â€” cotizaciÃ³n en lÃ­nea con respuesta por WhatsApp' },
    { label: 'Contacto registrado',   value: 'Jorge GarcÃ­a â€” coordinador de desarrollo de proyectos Â· 55 9752 5075 Â· SIN correo en la ficha' },
    { label: 'Interlocutor en junta', value: 'Daniel MartÃ­nez (reuniÃ³n del 4 sep 2026). NO estÃ¡ capturado como contacto.' },
    { label: 'Cliente desde',         value: '8 de marzo de 2021 â€” 56 meses' },
    { label: 'Servicio contratado',   value: 'AV Agentes Virtuales' },
    { label: 'FacturaciÃ³n mensual',   value: '$316,541 MXN â€” el 14.8% de la cartera' },
    { label: 'Salud de pago',         value: 'Al corriente Â· 0 incidencias de pago' },
    { label: 'Health Score',          value: '47 Â· relacional 32, actividad 50, adopciÃ³n 50, pago 50' },
  ],

  necesidad_negocio: 'GTC no usa telefonÃ­a como soporte: la usa para VENDER. Su sitio ofrece cotizaciÃ³n en lÃ­nea con respuesta por WhatsApp, y los destinos de su conmutador son las recepciones y las lÃ­neas de asesores de nuevos de cada agencia â€”Forum, Insur CDMX, NIS TLPN, Carretera 57â€”. Cada llamada entrante es, con alta probabilidad, alguien preguntando por un coche, por una refacciÃ³n o por su servicio.\n\nEso cambia lo que significa una llamada no contestada. En una cuenta de soporte, perder una llamada es un cliente molesto; aquÃ­ es una unidad que no se vendiÃ³. Con 24,341 llamadas sin contestar en septiembre y un ticket promedio automotriz, la conversaciÃ³n con este cliente no es sobre calidad de servicio telefÃ³nico: es sobre cuÃ¡nto dinero dejÃ³ de entrar por el telÃ©fono.\n\nLa necesidad real que tiene hoy es capacidad y enrutamiento: que las llamadas lleguen a alguien que las tome, y que cuando el canal digital se caiga â€”como pasÃ³ con WhatsApp en septiembreâ€” el telÃ©fono aguante el desvÃ­o.',

  potencial_corto: [
    'Enrutamiento y desborde de las tres lÃ­neas Â«Nuevos AsesorÂ» de Forum: hoy contestan el 2.8% de 13,177 llamadas. Cualquier mejora ahÃ­ se mide en unidades vendidas, no en puntos de SLA.',
    'Refuerzo del lunes: concentra el 25.6% del trÃ¡fico semanal y pierde el 43.3%. Es el dÃ­a con mayor retorno por cada agente adicional.',
    'Cerrar el folio 106428 y los 39 tickets que pasaron de 7 dÃ­as. La cuenta aparece con vencidos en los 20 de 20 cortes de la mesa.',
    'Resolver de raÃ­z el Â«Ajuste en Flujo (voz)Â»: 53 tickets de la misma subcategorÃ­a en ocho meses. Una capacitaciÃ³n o una configuraciÃ³n definitiva cierra el 26% de su volumen de tickets.',
  ],

  potencial_largo: [
    'Callpicker Chat e IA de Chat: no los tiene contratados y su canal de cotizaciÃ³n es WhatsApp. La incidencia de septiembre demostrÃ³ que ese canal no tiene respaldo.',
    'IntegraciÃ³n API con su CRM (usan Zoho): hoy no la tienen. Cada llamada perdida es un lead que no queda registrado en ningÃºn sitio.',
    'Panel por agencia: operan 32 oficinas en 5 estados contra una sola cuenta. Medir Forum contra Insur contra Carretera 57 convierte el dato en gestiÃ³n para el cliente.',
    'Pago automÃ¡tico: no lo tienen activo pese a 56 meses sin una sola incidencia de pago.',
  ],

  tacticas: [
    { nombre: 'Llevarle sus propios nÃºmeros', descripcion: 'Presentar el desglose por destino: cuÃ¡ntas llamadas recibiÃ³ cada agencia y cuÃ¡ntas contestÃ³. Son SUS datos, generados por nuestra plataforma, y hoy no los ve.', impacto: 'Convierte una conversaciÃ³n de servicio en una de negocio. El 2.8% de la lÃ­nea de nuevos no se discute: se mira.' },
    { nombre: 'Anclar al septiembre', descripcion: 'Comparar septiembre contra su propia base de enero a agosto, no contra un estÃ¡ndar de la industria. 20.3% â†’ 55.5% es su propio deterioro.', impacto: 'Evita la respuesta Â«asÃ­ es este negocioÂ»: el punto de comparaciÃ³n es la propia cuenta.' },
    { nombre: 'Preguntar por WhatsApp sin acusar', descripcion: 'La reuniÃ³n del 4 de septiembre documenta que se pausaron las campaÃ±as. Preguntar si el trÃ¡fico se volcÃ³ al telÃ©fono, no afirmarlo.', impacto: 'Si lo confirma, abre la conversaciÃ³n de respaldo de canal; si lo niega, hay otra causa que encontrar.' },
    { nombre: 'Cerrar el 106428 antes de la junta', descripcion: 'Llegar con un folio de 155 dÃ­as abierto a hablar de calidad de atenciÃ³n le entrega al cliente el argumento.', impacto: 'Quita de la mesa la Ãºnica objeciÃ³n que no se puede contestar con datos.' },
  ],

  senal_alarma: 'Una cuenta de $316,541 al mes, el 14.8% de la cartera, con 56 meses de permanencia, cero contactos capturados, cero de doce del Radar, una sola reuniÃ³n en todo el historial y un folio escalado sin moverse desde mayo. Si esta cuenta decide irse, Callpicker se entera el dÃ­a que lo diga.',

  problema_raiz: 'La cuenta se gestionÃ³ como un servicio que funciona, no como una operaciÃ³n que vende. Nadie estaba midiendo su telÃ©fono.',

  problema_raiz_detalle: 'Durante 56 meses GTC pagÃ³ puntualmente, no abriÃ³ conflictos comerciales y usÃ³ el producto de forma intensiva â€”927 visitas al mes al panelâ€”. Eso produjo la lectura de una cuenta sana, y el 6 de agosto de 2026 quedÃ³ escrita: Â«SLA cumplido, no se ha detectado errores consistentesÂ».\n\nPero el tablero no tenÃ­a su lectura de llamadas. Hasta el 12 de octubre de 2026, esta cuenta figuraba como Â«no la vemosÂ»: la ficha pedÃ­a al asesor que le solicitara al cliente un Excel de llamadas entrantes y salientes. O sea que durante todo el deterioro de septiembre â€”43,860 llamadas, 24,341 sin contestarâ€” el Ãºnico indicador disponible era que la cuenta no se quejaba.\n\nEl segundo nivel del problema es que lo que SÃ se veÃ­a se leyÃ³ al revÃ©s. 203 tickets en ocho meses, con el 26.1% pidiendo el mismo ajuste de flujo, se interpretÃ³ como un cliente demandante y no como un cliente cuya configuraciÃ³n nunca quedÃ³ resuelta. El 13 de agosto el propio equipo escribiÃ³ que Â«en todas sus interaccionesÂ» pedÃ­a ajustes â€” y la acciÃ³n que siguiÃ³ fue una actividad de anÃ¡lisis, no una intervenciÃ³n tÃ©cnica.\n\nEl tercero es de relaciÃ³n. Cero contactos capturados y cero del Radar significa que no hay mapa: no se sabe quiÃ©n decide el presupuesto de telefonÃ­a, quiÃ©n dirige a los asesores de nuevos ni quiÃ©n responderÃ­a si Nissan Mexicana preguntara por el desempeÃ±o del contact center. Hay un interlocutor tÃ©cnico â€”Jorge GarcÃ­aâ€” y uno que apareciÃ³ en la junta de septiembre â€”Daniel MartÃ­nezâ€” que ni siquiera estÃ¡ registrado como contacto.',

  flujo_real: [
    { fase: 'Entra la llamada',        area: 'Cliente final',       accion: 'Marca a la agencia buscando un coche, una refacciÃ³n o su servicio', resultado: '208,255 entrantes medidas de ene a oct 2026' },
    { fase: 'Enrutamiento',            area: 'Plataforma Callpicker', accion: 'La llamada se dirige al destino configurado: recepciÃ³n o lÃ­nea de asesores', resultado: '11,498 perdidas (20.1%) no llegan a ningÃºn destino registrado' },
    { fase: 'AtenciÃ³n',                area: 'Agencia GTC',         accion: 'Un asesor toma la llamada', resultado: 'Las tres lÃ­neas Â«Nuevos Asesor ForumÂ» contestan 372 de 13,177 â€” el 2.8%' },
    { fase: 'La llamada se pierde',    area: 'â€”',                   accion: 'Nadie contesta; el cliente cuelga', resultado: 'No queda registro del lead: la cuenta no tiene integraciÃ³n con su CRM' },
    { fase: 'GTC pide un ajuste',      area: 'Mesa de ayuda',       accion: 'Se abre ticket Â«Ajuste en Flujo (voz)Â»', resultado: '53 veces en ocho meses â€” el 26.1% de todos sus tickets' },
    { fase: 'El ticket se atiende',    area: 'Mesa de ayuda',       accion: 'Se resuelve el caso puntual', resultado: 'Mediana de 42.2 h, pero 39 tickets (19.2%) pasan de 7 dÃ­as; el 106428 lleva 155' },
    { fase: 'Callpicker evalÃºa',       area: 'SAC',                 accion: 'Actividad de anÃ¡lisis sobre la cuenta', resultado: 'Â«SLA cumplidoÂ» el 6 de agosto, seis semanas antes del colapso de septiembre' },
  ],

  comparativo: [
    { metrica: 'Entrantes sin contestar Â· septiembre', real: '55.5% (24,341 de 43,860)', ideal: 'Su propia base eneâ€“ago: 20.3%' },
    { metrica: 'LÃ­nea de venta de autos nuevos (3 destinos Forum)', real: '2.8% contestadas (372 de 13,177)', ideal: 'Una lÃ­nea comercial atendida: >80%' },
    { metrica: 'Lunes â€” su dÃ­a de mayor trÃ¡fico', real: '43.3% sin contestar', ideal: 'Al nivel de su martes: 17.2%' },
    { metrica: 'Contactos capturados', real: '0 en `contactos_json`', ideal: 'Quien decide, quien opera y quien paga: mÃ­nimo 3' },
    { metrica: 'Radar de 12 preguntas', real: '0 respondidas', ideal: '12 de 12 en una cuenta AAA' },
    { metrica: 'Reuniones en 56 meses', real: '1', ideal: 'Trimestral para una cuenta de este tamaÃ±o: 18' },
    { metrica: 'Tickets por encima de 7 dÃ­as', real: '39 de 203 (19.2%)', ideal: '<5%' },
    { metrica: 'Folio mÃ¡s antiguo sin moverse', real: '155 dÃ­as (106428, Escalado)', ideal: 'Ninguno fuera de SLA' },
    { metrica: 'Consumo de su bolsa de 50,000 min', real: '38,063 min en sep (76.1%) â€” cayÃ³ 40.43% desde enero', ideal: 'Estable o creciendo; enero fue 63,898 (127.8%)' },
    { metrica: 'Presencia en el Ãºltimo Informe de Cortes', real: 'AUSENTE â€” Ãºnica de 104 CID que no reapareciÃ³', ideal: 'Los 104 cortan cada mes' },
    { metrica: 'LÃ­neas del grupo con CID asignado en el GRC', real: '0 de 19', ideal: '19 de 19 â€” sin CID el tablero no las cruza' },
    { metrica: 'Bloques del Health Score realmente medidos', real: '1 de 4 (sÃ³lo el relacional)', ideal: '4 de 4' },
  ],

  plan_inmediato: [
    { accion: 'Cerrar o escalar formalmente el folio 106428 antes de cualquier contacto comercial', responsable: 'Mesa de ayuda / Dan', criterio: 'El folio cambia de estado o tiene fecha comprometida por escrito, antes de la llamada' },
    { accion: 'Llamar a Jorge GarcÃ­a y a Daniel MartÃ­nez con el desglose por destino en la mano, y preguntar quÃ© atiende cada lÃ­nea Â«Nuevos Asesor ForumÂ»', responsable: 'Dan', criterio: 'Queda por escrito quiÃ©n contesta esas tres extensiones y en quÃ© horario' },
    { accion: 'Preguntar si el trÃ¡fico de septiembre se volcÃ³ al telÃ©fono al pausar las campaÃ±as de WhatsApp', responsable: 'Dan', criterio: 'Respuesta del cliente registrada en seguimiento, confirmando o descartando la relaciÃ³n' },
    { accion: 'PARAR el churn marcado sin verificar: el GRC vigente da de baja las 13 lÃ­neas activas del grupo â€”$272,436.10â€” con verificaciÃ³n `sin_verificar`, y en el respaldo del 2 de octubre estaban vivas', responsable: 'DirecciÃ³n / FacturaciÃ³n', criterio: 'Las 13 lÃ­neas quedan verificadas una por una, confirmadas o revertidas, antes del siguiente corte' },
    { accion: 'Averiguar por quÃ© el CID 130723 desapareciÃ³ del Informe de Cortes del 1 de octubre, siendo el Ãºnico de 104 que no reapareciÃ³', responsable: 'FacturaciÃ³n', criterio: 'Se confirma si cambiÃ³ de CID, si se facturÃ³ por otro contrato o si quedÃ³ fuera del export' },
    { accion: 'Capturar los tres decisores que YA estÃ¡n escritos en la prosa de la cuenta: Jorge GarcÃ­a, Christian Torres (DM) y Ariana Agundis GarcÃ­a (DM)', responsable: 'Dan', criterio: 'Los tres en `contactos_json` con puesto, correo y telÃ©fono' },
    { accion: 'Cerrar la decisiÃ³n del ofuscador: $96,250 + IVA, 77 horas, 4 semanas â€” abierta desde el 4 de septiembre sin fecha', responsable: 'Dan', criterio: 'El cliente aprueba, rechaza o pone fecha, y queda registrado' },
  ],

  plan_mediano: [
    { accion: 'Resolver de raÃ­z el Â«Ajuste en Flujo (voz)Â»: una sesiÃ³n tÃ©cnica que deje la configuraciÃ³n cerrada', responsable: 'Mesa de ayuda / IngenierÃ­a', criterio: 'Cero tickets de esa subcategorÃ­a durante 60 dÃ­as' },
    { accion: 'Contestar las 12 preguntas del Radar con el cliente, en una sola sesiÃ³n', responsable: 'Dan', criterio: '12 de 12 respondidas en la ficha' },
    { accion: 'Revisar con soporte las 11,498 llamadas que no llegaron a ningÃºn destino', responsable: 'IngenierÃ­a', criterio: 'Se explica el origen de ese 20.1% o se descarta que sea un problema de configuraciÃ³n' },
    { accion: 'Proponer refuerzo de capacidad para el lunes y desborde para la lÃ­nea de nuevos', responsable: 'Dan', criterio: 'Propuesta entregada con el cÃ¡lculo de llamadas recuperables por agente' },
  ],

  plan_estrategico: [
    { accion: 'Panel de desempeÃ±o por agencia: Forum contra Insur contra Carretera 57', responsable: 'Producto / Dan', criterio: 'El cliente recibe un reporte mensual por sede, no agregado' },
    { accion: 'IntegraciÃ³n con su CRM Zoho para que la llamada perdida deje lead', responsable: 'IngenierÃ­a / Dan', criterio: 'Propuesta tÃ©cnica y costo entregados' },
    { accion: 'Respaldo de canal: Callpicker Chat e IA de Chat para que WhatsApp no sea un punto Ãºnico de falla', responsable: 'Dan', criterio: 'Propuesta presentada citando la incidencia del 4 de septiembre' },
    { accion: 'Gobernanza de la cuenta: reuniÃ³n trimestral fija con minuta y acuerdos', responsable: 'Dan / DirecciÃ³n', criterio: 'Primera reuniÃ³n agendada con fecha y asistentes confirmados' },
  ],

  areas_oportunidad: [
    { area: 'Recuperar la lÃ­nea de venta de autos nuevos', impacto: '12,805 llamadas perdidas en la lÃ­nea comercial de una concesionaria', responsable: 'Dan + GTC' },
    { area: 'Capacidad del lunes', impacto: '23,125 llamadas perdidas sÃ³lo ese dÃ­a de la semana', responsable: 'GTC' },
    { area: 'Chat e IA de Chat', impacto: 'Canal de cotizaciÃ³n sin respaldo; ya fallÃ³ una vez en septiembre', responsable: 'Dan' },
    { area: 'IntegraciÃ³n API con Zoho CRM', impacto: 'Hoy ninguna llamada perdida genera lead', responsable: 'IngenierÃ­a' },
    { area: 'Cierre estructural del ajuste de flujo', impacto: '26.1% del volumen de tickets de la cuenta', responsable: 'Mesa de ayuda' },
    { area: 'Pago automÃ¡tico', impacto: '56 meses sin incidencias y sin domiciliaciÃ³n', responsable: 'AdministraciÃ³n' },
  ],

  perfiles: [
    {
      nombre: 'Jorge GarcÃ­a', rol: 'Coordinador de desarrollo de proyectos â€” GTC', color: '#6366f1',
      campos: [
        { label: 'TelÃ©fono',  value: '55 9752 5075' },
        { label: 'Correo',    value: 'jorge.garcia@grupotorrescorzo.com (en el campo de nombre, NO en el de correo â€” la ficha lo tiene mal capturado)' },
        { label: 'Rol real',  value: 'Es el Ãºnico contacto registrado de la cuenta' },
        { label: 'Riesgo',    value: 'Punto Ãºnico de contacto en una cuenta de $316,541 al mes' },
      ],
    },
    {
      nombre: 'Christian Torres', rol: 'Decisor (DM) â€” GTC', color: '#ef4444',
      campos: [
        { label: 'Aparece en', value: 'Prosa de la cuenta, marcado Â«(DM)Â» â€” decision maker' },
        { label: 'Estado',     value: 'NO capturado en `contactos_json`. El mapa existe y nadie lo pasÃ³ a la ficha.' },
      ],
    },
    {
      nombre: 'Ariana Agundis GarcÃ­a', rol: 'Decisora (DM) â€” GTC Â· quien abriÃ³ el folio 106428', color: '#ef4444',
      campos: [
        { label: 'AbriÃ³',      value: 'Folio 106428 Â«Revisar apertura de conversaciÃ³n con plantillaÂ»' },
        { label: 'Sin mover',  value: 'Ãšltima actividad 2 may 2026 â€” congelada en los 20 cortes' },
        { label: 'Estado',     value: 'NO capturada en `contactos_json`. Es quien tiene el problema abierto.' },
      ],
    },
    {
      nombre: 'Daniel MartÃ­nez', rol: 'Interlocutor en la reuniÃ³n del 4 sep 2026', color: '#f59e0b',
      campos: [
        { label: 'Aparece en', value: 'ReuniÃ³n Â«Callpicker <> GTCÂ» y seguimiento del 14 sep' },
        { label: 'Temas',      value: 'Incidencia de WhatsApp, pausa de campaÃ±as, ofuscador ($96,250 + IVA), regulaciÃ³n IFT' },
        { label: 'Estado',     value: 'NO estÃ¡ capturado como contacto en la ficha' },
      ],
    },
    {
      nombre: 'Dan', rol: 'Asesor SAC de la cuenta â€” Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades',  value: '7 registradas Â· 3 completadas (todas de anÃ¡lisis) Â· 4 sin completar (2 llamadas, 1 tickets, 1 KAM)' },
        { label: 'Ãšltimo anÃ¡lisis', value: '13 ago 2026 â€” identificÃ³ por escrito el patrÃ³n de ajustes constantes' },
        { label: 'Contexto',     value: 'Suspendido del tablero del 6 oct al 12 oct 2026 por instrucciÃ³n de direcciÃ³n' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '56 meses de permanencia ininterrumpida desde marzo de 2021',
      'Cero incidencias de pago y pagos al corriente',
      'AdopciÃ³n ALTA medida: 927 visitas al mes al panel de administraciÃ³n',
      'Grupo consolidado: 1,200 empleados, 32 oficinas, 5 estados, 34 aÃ±os con Nissan',
      'Hay interlocutor tÃ©cnico activo y una reuniÃ³n sustantiva reciente',
    ],
    oportunidades: [
      'La lÃ­nea de venta de nuevos contesta el 2.8%: el margen de mejora es casi todo el volumen',
      'No tiene Chat, IA de Chat, API ni pago automÃ¡tico contratados',
      'OperaciÃ³n multi-sede sin reporte por agencia',
      'Su canal de cotizaciÃ³n es WhatsApp y no tiene respaldo',
    ],
    debilidades: [
      '55.5% de llamadas sin contestar en septiembre contra su base de 20.3%',
      'Cero contactos capturados y 0 de 12 del Radar en 56 meses',
      'Score relacional 32 â€” el componente mÃ¡s bajo de su Health Score',
      '26.1% de sus tickets son el mismo ajuste sin resolver de raÃ­z',
      'No aparece en el Informe de Cortes: su consumo no es medible',
    ],
    amenazas: [
      'Cada llamada sin contestar en la lÃ­nea de nuevos es una venta que se va a otra concesionaria',
      'EL GRC VIGENTE YA LA DA DE BAJA: 13 lÃ­neas en cero, $272,436.10 marcados Â«Churn confirmadoÂ» con verificaciÃ³n `sin_verificar`. Si eso se publica sin revisar, el grupo aparece perdido en el reporte de direcciÃ³n sin que nadie lo haya comprobado.',
      'DesapareciÃ³ del Informe de Cortes del 1 de octubre, Ãºnica de 104 CID. O cambiÃ³ algo en su facturaciÃ³n, o se cayÃ³ del export: las dos cosas hay que saberlas.',
      'El consumo cayÃ³ 40.43% en nueve meses y ninguna alerta lo vio, porque el detector sÃ³lo mira los Ãºltimos cinco cortes',
      'Folio escalado 156 dÃ­as sin moverse â€” argumento servido si el cliente cuestiona el servicio',
      'Nissan Mexicana es su socio de marca: un desempeÃ±o telefÃ³nico asÃ­ es auditable por el fabricante',
      'Agotamiento del plan nacional de numeraciÃ³n: una red de 32 oficinas que crece y no podrÃ¡ pedir nÃºmeros bajo el esquema actual',
    ],
  },

  conclusion: 'GTC no es una cuenta en riesgo de churn por insatisfacciÃ³n: es una cuenta en riesgo de descubrir sola cuÃ¡nto le estÃ¡ costando su telÃ©fono. Paga puntualmente, usa el producto a diario y no se ha quejado â€” y ese silencio fue justo lo que se leyÃ³ como salud durante 56 meses.\n\nLos nÃºmeros de septiembre cambian la conversaciÃ³n. 24,341 llamadas sin contestar en el mes, 12,805 de ellas en las lÃ­neas de venta de autos nuevos, en un grupo que vive de vender coches. El dÃ­a que GTC mida eso por su cuenta â€”o que se lo pregunte Nissan Mexicanaâ€” la conversaciÃ³n ya no la abre Callpicker.\n\nLa ventaja es que esos nÃºmeros los tiene Callpicker primero, y desde hoy. Llegar con ellos antes de que los descubran convierte un problema de servicio en una propuesta de capacidad.',

  pierde: [
    'Callpicker pierde $316,541 al mes â€” el 14.8% de la cartera de Customer Success â€” si la cuenta se va.',
    'GTC pierde las ventas de las 12,805 llamadas no contestadas en su lÃ­nea de autos nuevos, mÃ¡s lo que se pierda cada mes que siga asÃ­.',
    'Se pierde la referencia: es socio de Nissan Mexicana con 34 aÃ±os de relaciÃ³n de marca.',
    'Se pierde el caso de uso multi-sede mÃ¡s grande de la cartera: 32 oficinas en 5 estados.',
  ],

  gana: [
    'Si se recupera la lÃ­nea de nuevos, el retorno se mide en unidades vendidas y lo mide el cliente, no Callpicker.',
    'La cuenta no tiene contratados Chat, IA de Chat, API ni pago automÃ¡tico: la base para crecer estÃ¡ entera.',
    'Un panel por agencia convierte a Callpicker en herramienta de gestiÃ³n del grupo, no en proveedor de conmutador.',
    'Es la cuenta donde una intervenciÃ³n bien hecha se nota mÃ¡s: cualquier mejora sobre 208,255 llamadas es visible desde el primer mes.',
  ],

  recomendacion_central: 'Hay DOS urgencias y no son del mismo tipo. La de dentro: el GRC vigente ya marca las 13 lÃ­neas activas del grupo como Â«Churn confirmadoÂ» â€”$272,436.10â€” con verificaciÃ³n `sin_verificar`, y la cuenta desapareciÃ³ del Informe de Cortes del 1 de octubre siendo la Ãºnica de 104. Eso se revisa ANTES de que llegue a un reporte de direcciÃ³n, porque hoy el tablero puede estar dando por perdida a la cuenta mÃ¡s grande de la cartera sin que nadie lo haya comprobado.\n\nLa de fuera: llamar esta semana con el desglose por destino en la mano y abrir con una sola pregunta â€” Â«Â¿quiÃ©n contesta las tres lÃ­neas de Nuevos Asesor de Forum?Â». No se abre con el 55.5% ni con el SLA. Se abre mostrÃ¡ndole al cliente que de 13,177 personas que marcaron buscando un coche, 372 encontraron a alguien. Y antes de esa llamada, mover el folio 106428, que lleva 156 dÃ­as con la misma fecha de Ãºltima actividad: llegar a hablar de atenciÃ³n con eso abierto es entregarle al cliente el Ãºnico argumento que no se puede contestar con datos.',

  auditoria_servicio: {
    fuente: 'Zoho Desk â€” 203 tickets de Â«GTC Contact CenterÂ» (CID 130723) en lib/tickets-data.json',
    periodo: 'Febrero 2026 â€“ Octubre 2026 Â· la fuente trae SÃ“LO tickets CERRADOS, asÃ­ que Â«abiertosÂ» no es medible aquÃ­',
    diagnostico: 'El producto no le falla a GTC: sÃ³lo 17 de 203 tickets (8.4%) son fallas. Lo que ocurre es que su operaciÃ³n requiere intervenciÃ³n constante para funcionar. El 26.1% de todos sus tickets â€”53 de 203â€” son la misma subcategorÃ­a, Â«Ajuste en Flujo (voz)Â», repetida durante ocho meses. El propio equipo lo escribiÃ³ el 13 de agosto: la cuenta Â«en todas sus interaccionesÂ» pide ajustes. Agosto cerrÃ³ 53 tickets, el pico del aÃ±o, y el mes siguiente su telÃ©fono colapsÃ³.',
    metricas: [
      { metrica: 'Tickets totales',          valor: '203 (febâ€“oct 2026)',   lectura: 'La cuenta con mÃ¡s volumen de la cartera, acorde a su tamaÃ±o' },
      { metrica: 'Fallas del servicio',      valor: '17 Â· 8.4%',            lectura: 'El producto responde. El problema no es estabilidad' },
      { metrica: 'Mediana de resoluciÃ³n',    valor: '42.2 horas',           lectura: 'Razonable. La media (203.6 h) estÃ¡ inflada por los casos extremos' },
      { metrica: 'Tickets de mÃ¡s de 7 dÃ­as', valor: '39 Â· 19.2%',           lectura: 'Uno de cada cinco se queda semanas; ahÃ­ vive la insatisfacciÃ³n' },
      { metrica: 'El mÃ¡s largo',             valor: '#104448 Â· 3,522 h (147 dÃ­as)', lectura: 'Cerrado en agosto. Otros cuatro superaron los 96 dÃ­as' },
      { metrica: 'Folio abierto mÃ¡s antiguo',valor: '#106428 Â· 155 dÃ­as fuera de SLA', lectura: 'Escalado desde el 10 de mayo. Nadie lo ha movido en 156 dÃ­as' },
      { metrica: 'Cortes con vencidos',      valor: '20 de 20',             lectura: 'No es un mal mes: es el comportamiento normal de esta cuenta' },
      { metrica: 'Pico mensual',             valor: 'Agosto Â· 53 tickets',  lectura: 'El doble de julio (29). El mes anterior al colapso telefÃ³nico' },
    ],
    reincidencias: [
      { patron: 'Ajuste en Flujo (voz)',       veces: '53 Â· 26.1%', causa: 'La configuraciÃ³n del flujo nunca quedÃ³ cerrada, o nadie en GTC fue capacitado para hacerla. Ocho meses del mismo pedido.' },
      { patron: 'Plantillas Verificadas (chat)', veces: '29 Â· 14.3%', causa: 'Mismo patrÃ³n que se documentÃ³ en FINSUS: una capacitaciÃ³n de WhatsApp que no se dio.' },
      { patron: 'EnvÃ­o Masivo WhatsApp (chat)', veces: '22 Â· 10.8%', causa: 'Junto con las plantillas, el 25% de los tickets es WhatsApp â€” el canal que fallÃ³ en septiembre.' },
      { patron: 'DiDs (voz)',                   veces: '17 Â· 8.4%',  causa: 'Coincide con el seguimiento del 14 sep: asignar nÃºmeros nuevos es lento y caro por regulaciÃ³n IFT.' },
    ],
    hallazgos: [
      'El 51.2% de los tickets recae en tres agentes: Pablo S. (53), Mario H. (37) y Paola B. (31). NÃ©stor C. suma otros 31.',
      'La prioridad declarada no refleja el impacto: 106 de 203 tickets estÃ¡n marcados Â«LowÂ» en una cuenta cuyo telÃ©fono perdiÃ³ 24,341 llamadas en un mes.',
      'Un tercio del volumen es de chat (69 de asistencia + 9 de falla), pese a que la cuenta NO tiene contratados Callpicker Chat ni IA de Chat segÃºn su ficha. Hay que confirmar por quÃ©.',
      'Entre los cinco tickets mÃ¡s largos hay uno de Â«Falla Web (chat)Â» de 97 dÃ­as marcado como falla. Un problema reconocido que tardÃ³ tres meses en cerrarse.',
    ],
  },
}
