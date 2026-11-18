import type { AuditoriaCase } from './types'

/**
 * CINTAS COVE · D14 · CID 23870 — v2.0, corte del 17 nov 2026.
 * ============================================================
 *
 * Sustituye la v1.0 (jul 2026, 6 meses, 3,468 entrantes). El periodo nuevo son
 * 10.5 meses y 4,850 entrantes, y la lectura CAMBIA DE SIGNO: en julio esto era
 * una cuenta con tensiones operativas; hoy es una cuenta que las está
 * corrigiendo sola. La atención efectiva por agente pasó de 16.5% a 56.2% y el
 * outbound se multiplicó por diez en sept-oct sin que nadie se lo pidiera.
 *
 * CUATRO CORRECCIONES SOBRE EL DOCUMENTO ENTREGADO, aplicadas y visibles dentro
 * de él. Las vigila `scripts/concilia-auditoria-cintas-cove.py`:
 *
 *  1. EL MRR. El expediente v1.0 decía «$13,965 · VIP · Semáforo Zoho: Riesgo».
 *     El institucional es el del Gross Revenue y nada más: **$13,560**, «MRR
 *     estable», **AAA**, 11 facturas, 87 meses, $1,212,560 acumulados. Los
 *     $13,965 son `cuentas.facturacion`, que no es la fuente. El documento
 *     nuevo no afirma MRR —§18 declara que no tiene el plan vigente—, así que
 *     el error estaba del lado del expediente, no del reporte.
 *  2. LA TENDENCIA NO REMATA EN NOVIEMBRE. 17 días y 118 llamadas no son un
 *     mes. Entre meses completos: 27.0% (ene) → 20.3% (oct), suelo 12.6% (ago).
 *     Y octubre SUBIÓ frente a septiembre: eso también se dice.
 *  3. LAS 4,850 NO SON DEL NÚMERO PRINCIPAL. Son los tres DIDs más 30 sin
 *     identificar. Al principal entraron 4,755.
 *  4. LA HORA 08:00 RECUPERA ~7/MES, NO ~15. Solo se pierden 6.9 al mes ahí.
 *
 * Y un desfase que NO se puede cerrar sin los registros crudos, declarado en el
 * documento por clave: el reparto 514/561 de perdidas dentro/fuera de horario
 * contradice su propia tabla horaria (826 entre 08:00 y 17:00). El agregado de
 * 1,075 sí está verificado; el reparto no se cita por línea.
 *
 * LO QUE SÍ CERRÓ, y es mucho: la tabla mensual en sus tres columnas, las
 * cuatro categorías de entrantes, los 22 porcentajes mensuales, los minutos
 * facturables fila por fila, los salientes por agente, el ranking y los DIDs.
 * Y el ancla de verdad: **enero–agosto coincide EXACTAMENTE, mes por mes y
 * columna por columna, con `data/analisis-llamadas.json`**. De septiembre en
 * adelante el reporte tiene MÁS dato que nuestro corte (truncado el 12 oct).
 *
 * EL ORDEN DE `hallazgos` NO ES ESTILO, ES PRODUCTO. `lib/atlas-context.ts` se
 * lleva los CUATRO primeros recortados a 180 caracteres y
 * `lib/seguimiento-auditoria.ts` se lleva los TRES primeros ENTEROS a la
 * actividad SAC que el asesor lee ANTES de llamar. Por eso el puesto 2 es «esta
 * cuenta mejoró, no entres con marco de problema»: entrar a señalar fallos a un
 * cliente que acaba de triplicar su atención es la peor llamada posible.
 */
export const CINTAS_COVE: AuditoriaCase = {
  id: 'cintascove',
  asesor: 'Dan',
  nombre: 'Cintas Cove S.A. de C.V.',
  sector: 'Fabricación y Comercialización de Cintas Adhesivas Industriales — B2B',
  fecha_periodo: '02 Ene – 17 Nov 2026',
  fecha_auditoria: 'Nov 2026',
  tipo_cliente: 'AAA · B2B Industrial · +3,000 clientes · origen 1983 · CID 23870',
  descripcion_contexto: 'Auditoría Forense de Tráfico Telefónico · 4,850 llamadas entrantes + 1,035 salientes · 3 números Callpicker · 10.5 meses de operación',
  estado: 'activo',
  clasificacion: 'CONFIDENCIAL',
  version: '2.0',

  kpis: [
    { label: 'Llamadas entrantes',    value: '4,850 · 10.5 meses',  color: '#1B3FCC' },
    { label: 'Tasa de pérdida',       value: '22.2% → 19.0% limpia', color: '#ef4444' },
    { label: 'Atención por agente',   value: '16.5% → 56.2%',       color: '#22c55e' },
    { label: 'Min. facturables/mes',  value: '~660 promedio',       color: '#6366f1' },
  ],

  resumen_ejecutivo: 'Cintas Cove publica un horario de atención lunes a viernes 08:00–17:00. Los datos indican que la operación real inicia cerca de las 09:30 y decae desde las 16:45. En la hora 08:00 se pierde el 47.7% de las llamadas. Esa es la primera lectura: no hay un problema de plataforma — hay una desalineación entre la promesa comercial y la ejecución operativa.\n\nEn 10.5 meses ingresaron 4,850 llamadas entrantes al servicio Callpicker, de ellas 4,755 al número principal (55) 5864-2880, el mismo publicado como línea comercial en cintascove.com. De cada 5 llamadas, una se perdió (22.2%; 19.0% filtrando robocalls).\n\nDistribución: 38.5% atendidas por agente (1,868) · 39.3% autoservicio IVR (1,907) · 22.2% perdidas + buzón (1,075).\n\nPERO EL TITULAR ES OTRO, Y ES BUENO: la operación está corrigiendo sola. La atención efectiva por agente pasó de 16.5% en enero a 56.2% en octubre —se triplicó— y la pérdida bajó de 27.0% a 20.3%, con suelo de 12.6% en agosto. Entre septiembre y octubre el equipo disparó el canal saliente de ~42 llamadas al mes a 660 en dos meses, sin que nadie se lo pidiera. La auditoría tiene que reconocerlo antes de recomendar nada.\n\nSobre el único retroceso: octubre (20.3%) empeoró frente a septiembre (16.9%). Noviembre marca 11.0%, pero son 17 días y 118 llamadas — no es un mes y no sostiene el extremo de la serie.',

  resultado_positivo: 'Cintas Cove es un cliente sano y, a diferencia del corte de julio, uno que ya está mejorando por su cuenta. 43 años desde su origen en 1983 (constituida en 1988), base instalada declarada de +3,000 clientes, ISO 9001 e ISO 14001, y un modelo comercial claro: cotización express, entrega nacional, recoge en 1 hora.\n\nMRR institucional (Gross Revenue): $13,560/mes, movimiento «MRR estable», clasificación AAA, 11 facturas en el año y 87 meses de relación con $1,212,560 acumulados. Con ~660 minutos facturables al mes, el consumo medido cabe de sobra en la relación comercial actual: aquí no hay una conversación de excedente, hay una de expansión.\n\nLa prueba más fuerte de que los datos del reporte son buenos: enero a agosto coincide EXACTAMENTE con nuestro propio corte de llamadas, mes por mes y columna por columna.',

  hallazgos: [
    'CRÍTICO — El MRR institucional es $13,560/mes (Gross Revenue, «MRR estable», AAA, 87 meses de relación), NO $13,965: esa cifra sale de `cuentas.facturacion`, que no es la fuente institucional. Esto además responde el pendiente que el propio reporte dejaba abierto en §13: con ~660 min facturables al mes, el consumo medido cabe de sobra en la relación comercial vigente. No hay conversación de excedente; hay una de expansión.',
    'CRÍTICO — No entrar con marco de problema: esta cuenta MEJORÓ sola. La atención por agente se triplicó (16.5% ene → 56.2% oct) y el outbound pasó de ~42 llamadas/mes a 660 en sept-oct sin intervención nuestra. La primera frase de la llamada tiene que reconocerlo. Señalarle fallos a un cliente que acaba de corregir su operación es la peor conversación posible, y además se le nota.',
    'CRÍTICO — No citar «11.0% en noviembre»: son 17 días y 118 llamadas, no un mes. Entre meses completos la serie va de 27.0% (ene) a 20.3% (oct) con suelo de 12.6% en agosto. Y octubre SUBIÓ frente al 16.9% de septiembre, así que la mejora es real pero no es monótona. Un número que el cliente puede refutar cuesta la conversación entera.',
    'El reparto 514/561 de perdidas dentro/fuera de horario NO CIERRA contra su propia tabla horaria, que suma 826 entre las 08:00 y las 17:00. Queda marcado dentro del documento y no debe citarse por línea. El agregado de 1,075 perdidas sí está verificado y cierra con la tabla mensual.',
    'Desalineación hora 08:00: de 151 llamadas en esa hora a lo largo de 10.5 meses se perdieron 72 (47.7%) — la peor hora del día, y es la hora que la empresa promete en cintascove.com. El volumen es pequeño (~7 llamadas/mes recuperables, no 15 como decía la versión entregada); lo que pesa es que falla justo donde el cliente mira primero.',
    'Fines de semana sin cola activa: 328 llamadas (297 sábados + 31 domingos) perdidas al 100% en 10.5 meses, ~31 al mes. Hay un WhatsApp comercial publicado (55 3240 1825) que no está integrado al teléfono. Es el hueco más grande y el más barato de tapar.',
    'Campaña de robocalls: 574 llamadas automatizadas (11.8% del volumen) con firma inequívoca — duración 0, 100% en Self_service o Lost, ráfagas, prefijos 5598-86xx/89xx y un único origen (5541530095) con 377 llamadas en 26 días laborales. Distorsionaron enero (1,262 vs ~460 de promedio real). Sin lista negra activa al corte.',
    'Concentración horaria 10:00–13:00: 51% del volumen del día en 4 horas (2,462 llamadas) con 18–20% de pérdida — 471 llamadas perdidas acumuladas en la franja de mayor demanda. Se pierde justo cuando más lo buscan.',
    'Autoservicio sin trazabilidad de resolución: 39.3% del tráfico (1,907 llamadas) termina en IVR sin métrica de «resolvió vs se frustró». Sin eso, el árbol de opciones no se puede optimizar y el churn silencioso no se puede cuantificar.',
    'Bases sucias en outbound: JOHAN LOPEZ (84.4% no conectada) y RODRIGUEZ BIBIANA (78.9%) sostienen un patrón de números desactualizados o cobranza dura con evasión. Validar la base antes de cualquier campaña masiva.',
    'Outbound aún concentrado: Frausto (386), Cynthia (240), Karina (177) y Gallardo (118) hacen el 89% del saliente. El cambio de régimen de sept-oct lo produjeron cuatro personas, no un proceso — por eso la pregunta estratégica es si fue campaña puntual o cambio permanente.',
    '28 de las 1,035 llamadas salientes (2.7%) no están atribuidas a ningún agente en la tabla de §10. Volumen residual, pero conviene saberlo antes de citar la tabla como si fuera el total.',
  ],

  cronologia: [
    { fecha: 'Ene 2026',       responsable: 'Origen externo',            evento: 'Pico anómalo: 1,262 llamadas entrantes contra ~460 de promedio real. 574 robocalls del origen 5541530095 y prefijos 5598-86xx/89xx. Pérdida 27.0%, atención por agente 16.5% — el peor mes del periodo.', tipo: 'problema' },
    { fecha: 'Feb – Abr 2026', responsable: 'Operación Cintas Cove',     evento: '523, 470 y 367 entrantes. Pérdida 24.3% → 26.8% → 21.3%. La atención ya salta a 42–46%: el equipo empieza a contestar mucho más, aunque la pérdida todavía no baja.', tipo: 'neutral' },
    { fecha: 'May – Jul 2026', responsable: 'Operación Cintas Cove',     evento: '372, 437 y 408 entrantes con pérdida de 17.7%, 21.1% y 21.1%. Mayo es el primer mes por debajo del 18%.', tipo: 'neutral' },
    { fecha: 'Ago 2026',       responsable: 'Operación Cintas Cove',     evento: '317 entrantes y 12.6% de pérdida — el MEJOR mes completo del periodo. Atención por agente 56.2%.', tipo: 'ok' },
    { fecha: 'Sep – Oct 2026', responsable: 'Equipo comercial Cintas Cove', evento: 'CAMBIO DE RÉGIMEN EN EL CANAL SALIENTE: de ~42 llamadas/mes a 278 en septiembre y 382 en octubre — 660 en dos meses, con 56% de conexión. Lo hicieron Frausto, Cynthia y Karina. Nadie se lo pidió.', tipo: 'ok' },
    { fecha: 'Oct 2026',       responsable: 'Operación Cintas Cove',     evento: 'Único retroceso del semestre: la pérdida sube a 20.3% desde el 16.9% de septiembre, con el volumen entrante más bajo del año (256). La atención se mantiene en 56.2%.', tipo: 'problema' },
    { fecha: '17 Nov 2026',    responsable: 'Dir. Business Development', evento: 'Corte de datos y auditoría forense v2.0 sobre 4,850 entrantes y 1,035 salientes. Noviembre entra PARCIAL (17 días, 118 llamadas) y queda rotulado como tal: no sostiene el extremo de ninguna serie.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'CINTAS COVE S.A. de C.V.' },
    { label: 'Origen',              value: '1983 — Distribuidora Barrueta S.A. de C.V. · Constituida 22 ago 1988' },
    { label: 'Sector',              value: 'Fabricación y comercialización de cintas adhesivas industriales, empaque y embalaje' },
    { label: 'Tamaño',              value: '51–200 empleados (LinkedIn) · ~206 registros Indeed' },
    { label: 'Sede',                value: 'Jacarandas 13, San Isidro, Cuautitlán Izcalli, EdoMex 54730' },
    { label: 'Clientes destacados', value: 'Mabe (Top Supplier), Grupo Concord, Televisa San Ángel, Grupo 4TREM' },
    { label: 'Portafolio',          value: 'Más de 70 tipos de cinta · más de 3,000 clientes activos' },
    { label: 'Certificaciones',     value: 'ISO 9001 · ISO 14001' },
    { label: 'Números Callpicker',  value: '(55) 5864-2880 principal, 4,755 entrantes · (55) 4000-1898 saliente, 990 salientes · (442) 454-5354 Querétaro · 30 ent y 31 sal sin DID identificado' },
    { label: 'CID Callpicker',      value: 'CID 23870 · Consecutivo D14 · Asesor Dan' },
    { label: 'MRR Callpicker',      value: '$13,560 · AAA · «MRR estable» · 11 facturas · 87 meses · $1,212,560 acumulados (fuente: Gross Revenue, NO cuentas.facturacion)' },
    { label: 'Contacto web',        value: 'ventas@cintascove.com · (55) 5864-2880 · WhatsApp 55 3240 1825' },
    { label: 'Horario declarado',   value: 'Lunes a viernes, 08:00 a 17:00' },
  ],

  necesidad_negocio: 'Cintas Cove opera un modelo B2B industrial de cotización rápida: "recoge en 1 hora, entrega nacional, corte a la medida". Su canal comercial depende fuertemente del teléfono y WhatsApp — el número (55) 5864-2880 es la cara comercial digital visible en su sitio web, Facebook, Google Business y LinkedIn. Cada llamada perdida en esa línea es una cotización que no ocurrió.\n\nLa necesidad ya NO es la misma que en julio. Entonces la lectura era "hay que corregir una operación". Hoy la operación se está corrigiendo sola: la atención por agente se triplicó y el canal saliente se activó sin que nadie lo pidiera. Lo que necesita esta cuenta ahora es que le reconozcan el avance y que le tapen los dos huecos que su propio esfuerzo no alcanza: el fin de semana (328 llamadas perdidas al 100%, ~31 al mes) y el ruido de robocalls que nadie ha bloqueado.\n\nEl consumo de ~660 min facturables/mes contra un MRR de $13,560 no plantea un problema de bolsa. Plantea una conversación de expansión: Asistente Virtual para el fin de semana y outbound estructurado sobre los +3,000 clientes.',

  potencial_corto: [
    'Bloqueo dinámico de robocalls en Callpicker: prefijos 5598-86xx/89xx + origen 5541530095, en modo cuarentena 2 semanas antes del bloqueo permanente → ~55 llamadas/mes de ruido fuera. Costo: cero. ROI: inmediato.',
    'Alineación operativa hora 08:00 con al menos 2 agentes al arranque → recupera ~7 llamadas/mes con fricción técnica cero. El volumen es pequeño; el valor es que falla en la hora que la web promete.',
    'Callback automatizado en franja pico 10:00–13:00 (espera >30 seg) → sobre 471 llamadas perdidas acumuladas en esa franja. Configuración incluida en la plataforma.',
    'Devolverle al cliente la respuesta del §13 que él mismo dejó abierta: su MRR es $13,560, su consumo ~660 min/mes, y eso no genera excedente. Llegar con esa cifra ya cotejada es media reunión ganada.',
    'Reconocer por escrito el cambio de régimen de sept-oct antes de proponer nada. Es el activo de confianza más barato que tenemos con esta cuenta.',
  ],
  potencial_largo: [
    'Asistente Virtual Callpicker + WhatsApp (55 3240 1825) para fines de semana y fuera de horario: 328 llamadas perdidas al 100% en 10.5 meses, ~31 al mes que ya marcan y no encuentran canal. Es el hueco más grande y el más barato.',
    'Outbound estructurado sobre la base de +3,000 clientes, usando como playbook lo que Frausto, Cynthia y Karina ya hicieron solos en sept-oct: 660 llamadas en 2 meses con 56% de conexión. No hay que inventar el método, hay que documentarlo.',
    'Grabación y rúbrica de evaluación: replicar el perfil consultivo de Cynthia G. García Ramírez (6.1 min promedio entrante, 960 min facturables en saliente) en el resto del equipo.',
    'Programa de cuenta clave para los recurrentes que los propios datos revelan: 5561692266 (53 llamadas), 5553526888 (28), 5591580500 (23), 5610658772 (20). Cruzarlos contra el CRM del cliente convierte volumen anónimo en lista nominal.',
    'Medición de resolución en el IVR: 1,907 llamadas (39.3%) terminan ahí sin saber si resolvieron o se frustraron.',
    'Connectivity Solutions, como conversación posterior: Peplink MultiSIM + failover en Cuautitlán Izcalli, Check Point perimetral y NOC 24/7 con alerta de línea silenciosa.',
  ],

  tacticas: [
    { nombre: 'Reconocer antes de recomendar', descripcion: 'El cliente corrigió su operación sin ayuda: atención de 16.5% a 56.2% y outbound de ~42 a 330 llamadas/mes. Si la reunión abre con los puntos de quiebre, el mensaje que recibe es que no lo miramos.', impacto: 'Es el único movimiento de la lista que cuesta cero y decide el tono de todo lo demás' },
    { nombre: 'El fin de semana como canal', descripcion: '328 llamadas en sábados y domingos perdidas al 100%. Hay un WhatsApp comercial publicado que no está conectado al teléfono. No es un problema de capacidad: es que no existe el camino.', impacto: '~31 leads/mes que ya marcan el número y encuentran la puerta cerrada' },
    { nombre: 'IVR como embudo oscuro', descripcion: '39.3% del tráfico se "resuelve" en autoservicio sin saber si la necesidad quedó satisfecha o si el cliente colgó frustrado.', impacto: 'Sin métrica de resolución, 1,907 llamadas al año pueden ser churn silencioso' },
  ],
  senal_alarma: 'Si la pérdida en la hora 08:00 supera 50% en cualquier semana — la alineación operativa retrocedió. Si el volumen saliente vuelve a ~42/mes después de sept-oct — el cambio de régimen fue campaña puntual y no cultura, y el pipeline se apaga con él. Si el volumen de enero se repite sin una campaña conocida — nueva ola de robocalls, bloquear prefijos de inmediato. Si JOHAN LOPEZ o RODRIGUEZ BIBIANA siguen con >75% de no conexión tras limpiar base — escalar a cobranza dura o revisar numeración.',

  problema_raiz: 'Dos huecos estructurales que el esfuerzo interno del cliente no alcanza a tapar —el fin de semana sin canal y el ruido automatizado sin bloquear— sobre una operación que, por lo demás, ya está corrigiendo sola',
  problema_raiz_detalle: 'No es un problema de plataforma ni, a estas alturas, de voluntad operativa. Entre enero y octubre el cliente triplicó su tasa de atención por agente y activó el canal saliente por su cuenta: lo que quedaba a su alcance, lo hizo.\n\nLo que no puede resolver solo son tres cosas: (1) el fin de semana, donde 328 llamadas se pierden al 100% porque no existe cola ni captura asíncrona, y donde el WhatsApp que ya tiene publicado no está integrado al teléfono; (2) las 574 llamadas automatizadas que nadie ha bloqueado, que consumen ciclos de IVR y distorsionan sus propios indicadores; (3) la primera hora del día, donde la web promete una disponibilidad que la operación arranca media hora tarde — volumen pequeño (~7/mes) pero es la hora que el mercado mira primero.\n\nLas tres tienen solución de costo cero o de configuración dentro de Callpicker. Ninguna exige que el cliente cambie lo que ya está haciendo bien.',

  flujo_real: [
    { fase: '1. Llamada entra (08:00)',          area: 'Llamante externo',        accion: 'Marca (55) 5864-2880 según el horario publicado en la web',          resultado: '47.7% se pierde — la operación real arranca cerca de las 09:30 (72 llamadas en 10.5 meses)' },
    { fase: '2. IVR filtra (Self_service)',      area: 'Callpicker IVR',          accion: '39.3% de las llamadas navegan el menú automático sin llegar a agente', resultado: '1,907 llamadas sin métrica de resolución — no sabemos si quedaron satisfechas' },
    { fase: '3. Robocalls saturan (ene)',        area: 'Origen fraudulento',      accion: '574 llamadas automatizadas con duración 0 golpean el IVR en ráfagas',  resultado: 'IVR congestionado y enero inflado a 1,262 contra ~460 de promedio real' },
    { fase: '4. Pico 10:00–13:00',               area: 'Equipo comercial',        accion: '51% del volumen del día se concentra en 4 horas (2,462 llamadas)',     resultado: '18–20% de pérdida en el bloque donde más los buscan: 471 llamadas acumuladas' },
    { fase: '5. Outbound (sept-oct)',            area: '4 extensiones activas',   accion: 'De ~42 llamadas/mes a 278 (sep) y 382 (oct) con 56% de conexión',      resultado: 'Lo mejor que pasó en el periodo, y lo hicieron ellos. Falta convertirlo en proceso' },
    { fase: '6. Sábado y domingo',               area: 'Nadie',                   accion: '328 llamadas entran sin cola activa, sin IVR con callback, sin captura', resultado: '100% perdidas. El WhatsApp comercial está publicado pero no conectado al teléfono' },
  ],

  comparativo: [
    { metrica: 'Horario operativo',            real: 'Operación real: 09:30–16:45 (aprox.)',                                     ideal: 'Alinear la operación al horario publicado 08:00–17:00, o actualizar la promesa de la web' },
    { metrica: 'Tasa de pérdida hora 08:00',   real: '47.7% — la peor hora del día (72 de 151 en 10.5 meses)',                  ideal: '≤20% con 2 agentes disponibles al arranque' },
    { metrica: 'Tasa de pérdida global',       real: '22.2% con robocalls · 19.0% limpia',                                      ideal: '≤14% con las acciones propuestas' },
    { metrica: 'Tendencia (meses completos)',  real: '27.0% ene → 20.3% oct, con suelo de 12.6% en agosto',                     ideal: 'Sostener por debajo del 14% tres meses seguidos, sin apoyarse en meses parciales' },
    { metrica: 'Atención por agente',          real: '16.5% ene → 56.2% oct — se triplicó sin intervención externa',            ideal: 'Sostenerlo: es el logro del cliente, no una meta nuestra' },
    { metrica: 'Fin de semana',                real: '328 llamadas perdidas al 100% · sin cola, sin IVR, sin captura',          ideal: 'Asistente Virtual + WhatsApp (55 3240 1825) ya publicado: captura asíncrona y callback el lunes' },
    { metrica: 'Bloqueo de robocalls',         real: 'Sin lista negra activa — 574 llamadas automatizadas en 10.5 meses',       ideal: 'Lista negra dinámica para 5598-86xx/89xx + origen 5541530095, en cuarentena primero' },
    { metrica: 'Canal outbound',               real: '1,035 llamadas · ~42/mes hasta agosto, 278 y 382 en sept-oct',            ideal: 'Convertir el pico de sept-oct en cadencia documentada, no dejarlo como campaña puntual' },
    { metrica: 'Trazabilidad IVR',             real: '1,907 llamadas (39.3%) sin métrica de resolución vs frustración',         ideal: 'Evento de salida del IVR con categoría: resolvió · se frustró · esperando agente' },
    { metrica: 'Calidad de bases outbound',    real: 'JOHAN 84.4% no conectada · BIBIANA 78.9% — bases sucias o cobranza dura', ideal: 'Validar y enriquecer antes de campaña; separar cobranza de prospección' },
    { metrica: 'Consumo vs relación comercial',real: '~660 min facturables/mes contra un MRR de $13,560 (AAA, estable)',        ideal: 'No hay conversación de excedente. La conversación correcta es de expansión' },
  ],

  plan_inmediato: [
    { accion: 'Abrir la reunión reconociendo el cambio: atención de 16.5% a 56.2% y outbound de ~42 a 330 llamadas/mes, logrado por ellos. Antes de cualquier punto de quiebre.', responsable: 'JMLD + Dan', criterio: 'El reconocimiento aparece en la minuta antes que el primer hallazgo' },
    { accion: 'Llevar cerrado el pendiente que el propio reporte dejó abierto en §13: MRR $13,560 (Gross Revenue, AAA, «MRR estable»), consumo ~660 min/mes, sin excedente', responsable: 'SAC Callpicker', criterio: 'Cifra cotejada contra el GRC y comunicada al cliente en la sesión' },
    { accion: 'Activar bloqueo por lista negra en Callpicker para prefijos 5598-86xx / 5598-89xx y origen 5541530095, en modo cuarentena 2 semanas para evitar falsos positivos', responsable: 'SAC Callpicker', criterio: '~55 llamadas/mes de ruido fuera · validar también 5547458452 y el formato inválido 2215558642880' },
    { accion: 'Alineación operativa de la hora 08:00: al menos 2 agentes disponibles al arranque del turno', responsable: 'Dirección comercial Cintas Cove', criterio: 'Pérdida en la hora 08:00 ≤20% en las primeras 2 semanas' },
  ],

  plan_mediano: [
    { accion: 'Piloto de Asistente Virtual + WhatsApp para fin de semana y fuera de horario — es el hueco más grande (328 llamadas al 100% de pérdida) y el de solución más directa', responsable: 'JMLD Producto', criterio: 'Captura ≥20 leads en el primer mes de sábados y domingos' },
    { accion: 'Entrevistar a Frausto, Cynthia y Karina sobre qué cambió en sept-oct para producir 660 llamadas salientes con 56% de conexión, y escribirlo como playbook', responsable: 'Cliente + JMLD', criterio: 'Playbook documentado y aplicable a extensiones nuevas en 30 días' },
    { accion: 'Callback automatizado para espera >30 seg en la franja 10:00–13:00 (51% del volumen, 471 perdidas acumuladas)', responsable: 'SAC Callpicker', criterio: 'Pérdida en la franja ≤15% a los 30 días' },
    { accion: 'Validación y limpieza de bases en las extensiones JOHAN LOPEZ (84.4% no conectada) y RODRIGUEZ BIBIANA (78.9%)', responsable: 'Dirección comercial Cintas Cove', criterio: 'No conexión de esas extensiones ≤50% tras la limpieza' },
    { accion: 'Cruce de los números recurrentes contra el CRM del cliente: 5561692266 (53), 5553526888 (28), 5591580500 (23), 5610658772 (20), y validar si 14184741124 (104, internacional) es cliente o proveedor', responsable: 'Cliente + SAC', criterio: 'Lista nominal de ≥15 cuentas clave en 60 días' },
  ],

  plan_estrategico: [
    { accion: 'Outbound estructurado sobre la base de +3,000 clientes, usando el playbook de sept-oct como método probado en vez de un objetivo inventado', responsable: 'Dirección comercial Cintas Cove', criterio: 'Cadencia sostenida ≥300 llamadas/mes tres meses seguidos, con tasa de conexión ≥50%' },
    { accion: 'Medición de resolución en el IVR: categorizar la salida de las 1,907 llamadas de autoservicio para poder optimizar el árbol', responsable: 'SAC Callpicker', criterio: 'Métrica disponible y primer informe de resolución en mes 3' },
    { accion: 'Programa de cuenta clave con SLA diferenciado para los recurrentes identificados en los datos', responsable: 'Dirección comercial Cintas Cove', criterio: 'Programa activo en mes 3' },
    { accion: 'Propuesta Connectivity Solutions como conversación independiente: Peplink MultiSIM + failover en Cuautitlán Izcalli, Check Point perimetral, NOC 24/7 con alerta de línea silenciosa', responsable: 'JMLD Connectivity Solutions', criterio: 'Presentada DESPUÉS de los primeros resultados medibles, no antes' },
    { accion: 'Reporte comparativo contra la línea base de esta auditoría a 90 días', responsable: 'JMLD SAC', criterio: 'Pérdida ≤14% sostenida · fin de semana con captura activa · robocalls en cero' },
  ],

  areas_oportunidad: [
    { area: 'Captura de fin de semana (el hueco mayor)', impacto: '328 llamadas perdidas al 100% en 10.5 meses, ~31/mes que ya marcan · el WhatsApp comercial ya está publicado', responsable: 'JMLD Producto' },
    { area: 'Bloqueo de robocalls (costo cero)',         impacto: '574 llamadas automatizadas fuera · IVR limpio · indicadores que vuelven a ser válidos',                     responsable: 'SAC Callpicker' },
    { area: 'Playbook del outbound de sept-oct',         impacto: 'Convertir en método lo que cuatro personas ya hicieron solas: 660 llamadas con 56% de conexión',            responsable: 'Cliente + JMLD' },
    { area: 'Alineación operativa hora 08:00',           impacto: '~7 llamadas/mes, fricción técnica cero · valor reputacional por ser la hora que promete la web',            responsable: 'Cintas Cove operación' },
    { area: 'Callback franja pico 10:00–13:00',          impacto: '471 llamadas perdidas acumuladas en el 51% del volumen diario · configuración incluida',                    responsable: 'SAC Callpicker' },
    { area: 'Medición de resolución en IVR',             impacto: '1,907 llamadas que hoy son una caja negra · sin la métrica no se puede optimizar el árbol',                 responsable: 'SAC Callpicker' },
    { area: 'Programa de cuentas clave',                 impacto: 'Convertir volumen recurrente anónimo en pipeline nominal y retención activa',                               responsable: 'Cintas Cove + JMLD SAC' },
    { area: 'Connectivity Solutions (diferido)',         impacto: 'Continuidad de la línea comercial + protección perimetral + NOC 24/7 · proponer tras los primeros resultados', responsable: 'JMLD Connectivity' },
  ],

  perfiles: [
    {
      nombre: 'Cynthia Gabriela García Ramírez', rol: 'Agente comercial — perfil consultivo · líder en profundidad', color: '#1B3FCC',
      campos: [
        { label: 'Perfil entrante',  value: '65 llamadas atendidas · 397 min facturables · 6.1 min promedio — la única que se aleja de la mediana de 2 min del equipo. Venta consultiva, no triage.' },
        { label: 'Perfil saliente',  value: '240 llamadas salientes · 126 conectadas (52.5%) · 960 min facturables — más minutos salientes que ningún otro, ~4 min por llamada conectada.' },
        { label: 'Palanca',          value: 'Estudiar sus grabaciones para replicar el patrón de cierre y upsell. Pieza natural del playbook de outbound que hay que documentar.' },
      ],
    },
    {
      nombre: 'FRAUSTO SANCHEZ VALERIA', rol: 'Líder del canal saliente del periodo', color: '#22c55e',
      campos: [
        { label: 'Saliente',  value: '386 llamadas · 216 conectadas (56.0%) · 405 min facturables — el mayor volumen outbound del periodo.' },
        { label: 'Entrante',  value: '148 llamadas atendidas · 437 min · 3.0 min promedio. Perfil mixto, de los pocos que sostienen los dos canales.' },
        { label: 'Por qué importa', value: 'Es quien produjo, con Cynthia y Karina, el cambio de régimen de sept-oct. La entrevista con ella es el primer paso del playbook, no un gesto.' },
      ],
    },
    {
      nombre: 'REYES ORDUÑO ITZEL MARISOL', rol: 'Mayor volumen entrante — cotización express', color: '#6366f1',
      campos: [
        { label: 'Métricas',   value: '369 llamadas atendidas · 693 min facturables · 1.9 min promedio — el mayor volumen del equipo al ritmo más rápido.' },
        { label: 'Perfil',     value: 'Cotización relámpago o triage a WhatsApp/portal, congruente con el modelo "recoge en 1 hora".' },
        { label: 'Potencial',  value: 'Volumen alto y ritmo alto: candidata natural para recibir el overflow de la franja 10:00–13:00.' },
      ],
    },
    {
      nombre: 'JOHAN LOPEZ GOMEZ y RODRIGUEZ CORONA BIBIANA ABIGAIL', rol: 'Alerta de bases sucias en outbound', color: '#ef4444',
      campos: [
        { label: 'Métricas',  value: 'JOHAN: 45 salientes, 7 conectadas (84.4% no conectada). BIBIANA: 19 salientes, 4 conectadas (78.9%). Los dos peores resultados del canal.' },
        { label: 'Hipótesis', value: 'Bases desactualizadas, o cobranza dura con evasión activa del llamante. El volumen es bajo, así que no distorsiona el total — pero marca un proceso.' },
        { label: 'Acción',    value: 'Validar y enriquecer su base ANTES de cualquier campaña masiva, y separar cobranza de prospección. Alternativa: secuencia de WhatsApp con acuse de lectura.' },
      ],
    },
    {
      nombre: 'Lo que NO se registra de este reporte', rol: 'Ausencias declaradas, no huecos', color: '#64748B',
      campos: [
        { label: 'Contactos del cliente', value: 'El documento no nombra a ningún directivo de Cintas Cove, y nuestras fuentes tampoco. No se inventa uno: el perfil de la empresa se construyó desde fuentes públicas (§18 supuesto 5) y no sustituye una entrevista con dirección comercial.' },
        { label: 'Nombres de agentes',    value: 'Los agentes listados son empleados del CLIENTE, no contactos de la cuenta. Aparecen por su desempeño medido, no como interlocutores. La v1.0 escribía «REYES ORDUÑA»; el corte nuevo dice «REYES ORDUÑO». No sabemos cuál es el correcto y no se corrige a ojo.' },
        { label: 'El reparto 514/561',    value: 'Declarado en el documento como NO CERRADO contra su propia tabla horaria (826). No se cita por línea hasta cotejarlo con los registros crudos.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'La operación está corrigiendo SOLA: atención por agente de 16.5% (ene) a 56.2% (oct), triplicada sin intervención externa',
      'El canal saliente se activó por decisión del cliente: de ~42 llamadas/mes a 660 en sept-oct, con 56% de conexión',
      '43 años desde 1983 y un modelo comercial sólido: cotización express + entrega nacional + corte a medida',
      '+3,000 clientes activos documentados — base instalada con alto potencial de outbound proactivo',
      'ISO 9001 e ISO 14001 · clientes enterprise como Mabe (Top Supplier) y Televisa San Ángel',
      'MRR $13,560 con clasificación AAA y movimiento «MRR estable» · 87 meses de relación, $1,212,560 acumulados',
      'Cynthia García (6.1 min promedio) y Frausto Sánchez (386 salientes) como modelos replicables dentro del propio equipo',
      'Canal WhatsApp (55 3240 1825) ya publicado y activo — la infraestructura para la captura asíncrona ya existe',
    ],
    oportunidades: [
      'Captura de fin de semana: 328 llamadas al 100% de pérdida, ~31/mes, con el WhatsApp ya publicado — el hueco más grande y el más barato',
      'Bloqueo de robocalls y alineación 08:00: costo cero, efecto inmediato sobre la calidad del dato y sobre la primera impresión',
      'Documentar el outbound de sept-oct como playbook en vez de inventar un objetivo: el método ya existe dentro de la casa',
      'Programa de cuenta clave sobre los recurrentes que los propios datos revelan (53, 28, 23 y 20 llamadas)',
      'Medición de resolución en el IVR para sacar 1,907 llamadas de la caja negra',
      'Connectivity Solutions como complemento natural (continuidad, protección perimetral, NOC) sin competir con Callpicker',
    ],
    debilidades: [
      'Fin de semana sin ningún mecanismo de captura: 328 llamadas perdidas al 100% y un WhatsApp publicado que no está conectado al teléfono',
      'Desalineación entre el horario publicado y el operado — el mercado lee 08:00, la operación entrega ~09:30',
      'Sin lista negra activa en Callpicker: 574 llamadas automatizadas en 10.5 meses sin filtrar',
      'Sin trazabilidad de resolución en el IVR (39.3% del tráfico, 1,907 llamadas)',
      'El cambio de régimen del outbound lo sostienen 4 personas, no un proceso: si se van o se cansan, se apaga con ellas',
      'Bases de datos sucias en al menos 2 extensiones outbound (>78% de no conexión)',
      'Octubre retrocedió a 20.3% desde el 16.9% de septiembre: la mejora es real pero no es monótona',
    ],
    amenazas: [
      'Que el pico de outbound de sept-oct fuera campaña puntual y no cambio cultural — el pipeline se apagaría con él',
      'Futuras campañas de robocall más agresivas saturando el IVR y bloqueando llamadas legítimas',
      'Cliente potencial marca a las 08:00 según la web, no le contestan, percibe desorganización y busca competidor',
      'Si el IVR frustra en lugar de resolver, el 39.3% del tráfico es churn silencioso no cuantificado',
      'Incidente de conectividad en Cuautitlán Izcalli dejando la línea comercial muerta durante horas, sin failover documentado',
      'Entrar a la reunión con marco de problema sobre un cliente que acaba de corregir su operación: se le nota, y quema el capital de la auditoría',
    ],
  },

  conclusion: 'Cintas Cove dejó de ser, entre julio y noviembre, una cuenta con una operación que corregir. La atención efectiva por agente se triplicó, el canal saliente se activó por decisión propia y el consumo de ~660 minutos facturables al mes cabe de sobra en un MRR de $13,560 clasificado AAA y «estable». Lo primero que tiene que pasar en la siguiente conversación es que alguien se lo diga.\n\nLo que queda no son fallos del cliente: son huecos que su esfuerzo interno no alcanza a tapar. El fin de semana, donde 328 llamadas se pierden al 100% teniendo un WhatsApp comercial publicado que nadie conectó al teléfono. Las 574 llamadas automatizadas que ninguna lista negra ha bloqueado. Y la primera hora del día, pequeña en volumen —unas 7 llamadas al mes— pero grande en lo que comunica, porque es la hora que su propia web promete.\n\nLas tres se resuelven con configuración o con un piloto, no con un catálogo. Y la palanca comercial más honesta que tenemos no es un producto: es documentar lo que Frausto, Cynthia y Karina ya hicieron solas en septiembre y octubre, y devolvérselo convertido en método.',

  pierde: [
    'Si la reunión abre con los puntos de quiebre en vez de con el reconocimiento → el cliente lee que no miramos lo que hizo, y la auditoría entera pierde autoridad',
    'Si el fin de semana sigue sin canal → ~31 leads/mes que ya marcan el número comercial siguen encontrándolo cerrado',
    'Si el bloqueo de robocalls no se activa → una ola más agresiva puede saturar el IVR y tirar llamadas legítimas',
    'Si el outbound de sept-oct no se documenta → se apaga con las cuatro personas que lo sostienen y no queda método',
    'Si la alineación 08:00 no ocurre → el mercado sigue encontrando cerrada la hora que la web promete',
    'Si el IVR frustra en el 39.3% del tráfico sin saberlo → churn silencioso que nadie cuantifica',
    'Si la línea comercial cae por un incidente de conectividad sin failover → la cara digital de la empresa desaparece durante horas',
  ],
  gana: [
    'Reconocer el avance primero → la conversación arranca con el cliente del mismo lado de la mesa, y eso no se compra con ningún descuento',
    'Llevar cerrado el §13 (MRR $13,560, ~660 min/mes, sin excedente) → el cliente ve que le resolvimos lo que él mismo dejó pendiente',
    'Captura de fin de semana → ~31 leads/mes nuevos desde cero, con infraestructura que ya está publicada',
    'Bloqueo de robocalls → IVR limpio, indicadores válidos y una ola futura desactivada antes de que ocurra',
    'Playbook del outbound sept-oct → cadencia sostenida sobre +3,000 clientes, con método probado dentro de la propia casa',
    'Alineación 08:00 → la primera impresión del prospecto cambia de "desorganizada" a "confiable" por ~7 llamadas al mes',
    'Reporte comparativo a 90 días → evidencia concreta antes de cualquier conversación de renovación o expansión',
  ],
  recomendacion_central: 'El primer movimiento de esta cuenta no es una propuesta: es un reconocimiento. La atención por agente se triplicó y el canal saliente se activó sin que nosotros interviniéramos, y eso tiene que ser la primera frase de la reunión. El segundo movimiento es llevar cerrado el pendiente que el propio reporte dejó abierto en §13 — MRR $13,560, consumo ~660 min/mes, sin excedente — porque llegar con esa cifra ya cotejada vale más que cualquier presentación. Después, y solo después, los dos quick wins de costo cero: bloqueo de robocalls y alineación de la hora 08:00. El Asistente Virtual para el fin de semana es la conversación de mes 2 y la de mayor retorno real; Connectivity Solutions es la de mes 3. La secuencia correcta es: reconocer → resolver lo que ya nos pidieron → acción medible → propuesta de expansión.',

  documentos: [
    {
      nombre:      'Cintas Cove · Auditoría Forense de Llamadas — 17 nov 2026',
      ruta:        '/auditorias/Cintas_Cove_Auditoria_Forense_2026-11-17.html',
      descripcion:
        'Reporte completo del corte del 17 nov 2026 sobre 4,850 llamadas entrantes y 1,035 ' +
        'salientes del CID 23870 (02 ene – 17 nov 2026, noviembre parcial y rotulado como tal), ' +
        'con el desglose por hora, por día, por agente y por mes, el análisis de la campaña de ' +
        'robocalls y la base de consumo facturable. Lleva dentro, visibles, las CUATRO ' +
        'correcciones aplicadas antes de publicarlo y el único reparto que no cierra, marcado ' +
        'como tal. Conciliado con `scripts/concilia-auditoria-cintas-cove.py`.',
    },
  ],
}
