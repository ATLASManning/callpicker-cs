import type { AuditoriaCase } from './types'

/**
 * CAMPESTRE LOS VIVEROS · Z35 · CID 38444 · Dan
 *
 * Alta del 26 nov 2026, a partir del reporte entregado
 * «Auditoría de llamadas · Campestre Los Viveros» (2 ene – 25 nov 2026).
 *
 * CONCILIADO contra nuestras fuentes antes de publicar:
 *   · `cuentas` Z35: asesor Dan, estado activo, contacto Victor Carden
 *     (Director operativo, único contacto), giro Inmobiliaria. El reporte
 *     dice «KAM: Dan» y coincide.
 *   · GRC (`data/grc-zoho.json`, corte GRF.xlsx, mes vivo Noviembre):
 *     clasif A, mrrIni = mrrFin = $1,069, movimiento «MRR estable».
 *     El reporte publica «MRR $1,069» y COINCIDE con el institucional.
 *     Ojo: `cuentas.facturacion` guarda 0.0 — no se usa ([[grc-fuente-zoho]]).
 *   · Los cinco repartos del `const D` del documento CIERRAN contra 782
 *     entrantes (mes, destino, periodo, día y hora), y cierran también las
 *     cuatro categorías de desenlace: 260 + 286 + 194 + 42 = 782.
 *
 * DOS CORRECCIONES que se aplicaron al documento publicado, visibles
 * dentro de él (ver `scripts/publica-auditorias-2026-11-26.py`):
 *   1. «17 llegaron entre medianoche y las 5 h y todas terminaron perdidas,
 *      SIN BUZÓN» — su propia serie horaria trae 7 llamadas a buzón en esa
 *      franja (h0 2, h1 2, h2 1, h5 2). Son 24 llamadas: 17 perdidas y 7 a
 *      buzón. Contradicción interna, que es el detector más barato
 *      ([[feedback-auditorias-verificar]]).
 *   2. «31% del plan de 400 min usado (último corte)» viene de la ficha
 *      («capacidad ociosa 69%»), no de la medición. El propio documento
 *      cuestiona esa ficha dos secciones más abajo. Medido: el mes de más
 *      consumo es enero con 111 min (27.8%) y el último mes cerrado,
 *      octubre, 107 min (26.8%).
 */
export const CAMPESTRE_LOS_VIVEROS: AuditoriaCase = {
  id: 'campestre-los-viveros',
  asesor: 'Dan',
  nombre: 'Campestre Los Viveros',
  sector: 'Inmobiliaria · desarrollo y postventa · Morelia, Michoacán',
  fecha_periodo: '2 ene – 25 nov 2026',
  fecha_auditoria: 'Nov 2026',
  tipo_cliente: 'Clasificación A · CID 38444 · Z35 · MRR $1,069 (GRC)',
  descripcion_contexto:
    '782 llamadas entrantes y 81 salientes · Z35 · CID 38444 · Asesor: Dan · ' +
    'Contacto único: Victor Carden (Director operativo) · Cliente desde may 2020',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'No llega a una persona', value: '66.8% · 522 de 782',          color: '#ef4444' },
    { label: 'Números sin respuesta',  value: '354 de 569 (62%)',            color: '#dc2626' },
    { label: 'Devoluciones',           value: '0 en 782 entrantes',          color: '#f59e0b' },
    { label: 'Plan de 400 min',        value: '27.8% en su mejor mes',       color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'Campestre Los Viveros es la cuenta más pequeña de las auditadas: $1,069 de MRR al mes en el GRC, ' +
    'clasificación A, estable, con un plan de Visibilidad y Control de 400 minutos y dos extensiones. ' +
    'Su tamaño es justo lo que la vuelve delicada: el costo de perderla es bajo para el cliente y el ' +
    'margen para invertir en ella es mínimo. Todo lo que la sostenga tiene que ser gratis o casi.\n\n' +
    'De 782 llamadas entrantes en once meses, 260 llegaron con un agente. 522 terminaron perdidas (286), ' +
    'abandonadas en el menú (194) o en buzón (42). La atención cayó de 53% (ene–may) a 11% (jun–jul) y ' +
    'se recuperó sólo hasta 31% tras la reestructura del flujo del 26 de agosto. Ese 31% es el techo de hoy.\n\n' +
    'El hallazgo que cambia la conversación no es la tasa: es que 354 de los 569 números que llamaron en ' +
    'el año NUNCA fueron atendidos, y que el campo de devolución está en cero en las 782 entrantes. Para ' +
    'una inmobiliaria, cada uno de esos números es un prospecto o un cliente de postventa sin respuesta.\n\n' +
    'El riesgo competitivo está declarado por el propio cliente: le interesa integrarse con GoHighLevel, ' +
    'que trae telefonía propia (LC Phone) y proveedores que ya venden integración nativa. Con 0 de 6 ' +
    'módulos activados y un plan al 27.8% de uso, el costo de salida es prácticamente cero.',

  resultado_positivo:
    'La reestructura del flujo del 26 de agosto sí funcionó en lo que se propuso: las llamadas perdidas ' +
    'bajaron de 64.6% (jun–jul) a 28.2% (26 ago – 25 nov). El cliente no está pasivo — reconfiguró sus ' +
    'destinos, cerró Ventas, Veronesa y Campestre, y abrió BDC.\n\n' +
    'Y arrancó marcación saliente el 23 de octubre: 81 llamadas con 63% de contacto efectivo, la señal ' +
    'de adopción más valiosa del año. Esa misma capacidad es la que puede convertirse en rutina de ' +
    'devolución de perdidas usando los minutos que ya paga y no usa. Seis años de cliente, pagos al ' +
    'corriente, cero incidencias de cobranza y 12 tickets todos de asistencia, cero fallas de plataforma.',

  hallazgos: [
    '66.8% de las entrantes no llega a una persona: 522 de 782 acaban perdidas, abandonadas en el menú o en buzón. En horario hábil (L–V 9–19 h) la atención sigue en 35.7%.',
    '354 de los 569 números que llamaron en el año (62%) nunca fueron atendidos, y generaron 418 llamadas. Para una inmobiliaria cada número es un prospecto o una postventa.',
    'Cero devoluciones: el campo de devolución está en 0 en las 782 entrantes. Desde que arrancó la saliente (23 oct) solo 2 de 54 no atendidas recibieron regreso, a 7 y 11 dias.',
    'Riesgo competitivo declarado por el cliente: pidió integracion con GoHighLevel, que trae telefonia propia (LC Phone). Con 0 de 6 modulos el costo de salida es cero.',
    'La reestructura del 26 ago movió la fuga de sitio, no la cerró: las perdidas bajaron de 64.6% a 28.2%, pero el abandono en el menú subió de 13.3% (ene–jul) a 35.7%. Hoy 1 de cada 4 llamadas muere en el menú y no sabemos si resuelve o expulsa.',
    'El destino «Constructora HYG» es una línea muerta: 14 llamadas de febrero a noviembre y las 14 cayeron a buzón. Es la marca del sitio web registrado en la ficha (constructorahyg.com). Si es la línea corporativa, el cliente no lo sabe.',
    'El único contacto de la cuenta vive la falla en carne propia: el número de Victor Carden aparece 14 veces — 8 perdidas (7 en Ventas) y 4 abandonos de menú en 12 minutos el 25 de agosto, el mismo día del ticket de ajuste de flujo. Su percepción del servicio se está formando con esas pruebas.',
    'Junio–julio fue un colapso, no una caída de demanda: de 178 entrantes solo 19 se atendieron (10.7%) y 115 se perdieron, mientras el volumen SUBÍA (113 entrantes en julio). El titular lo explicó al KAM como cambios en su plantilla.',
    'Fuera de horario no hay nada: 76 entrantes antes de las 9 o después de las 19 h, 4 atendidas y 51 perdidas. El domingo pierde 62% (28 de 45).',
    'Encuesta casi sin uso: 11 calificaciones de 260 atendidas (4.2%), 8 positivas y 3 negativas. En 52% de las atendidas el ejecutivo colgó sin pasar a encuesta: no hay voz del cliente final con la que defender la calidad.',
    'Un activo pagado y sin uso: la ficha lista «Paquete 100 min entrante 8002141114» ($90) y en `data/dids.json` ese 800 aparece etiquetado «Available». Verificar antes de cualquier propuesta: lo que el cliente paga y no usa es el primer argumento de una baja.',
    'CONCILIACIÓN · el MRR del documento SÍ es el institucional: $1,069, clasif A, movimiento «MRR estable» en el GRC. `cuentas.facturacion` guarda 0.0 y no se usa.',
    'CORRECCIÓN aplicada al documento: decía que las 17 llamadas de medianoche a 5 h «terminaron perdidas, sin buzón»; su propia serie horaria trae 7 a buzón en esa franja. Son 24 llamadas: 17 perdidas y 7 a buzón.',
    'CORRECCIÓN aplicada al documento: el «31% del plan de 400 min» venía de la ficha («capacidad ociosa 69%»), no de la medición. Medido: enero 111 min (27.8%) es el mes de más consumo y octubre, último cerrado, 107 min (26.8%).',
    'VERIFICADO: los cinco repartos del documento (mes, destino, periodo, día, hora) cierran contra las 782 entrantes, y los cuatro desenlaces suman exactamente el total. No hubo que marcar ninguna tabla por no cerrar.',
  ],

  cronologia: [
    { fecha: '08 may 2020', responsable: 'Operación',            evento: 'Campestre Los Viveros inicia como cliente. Plan Visibilidad y Control 400 minutos + 2 Extensiones VyC + paquete de 100 min entrantes al 800 2141114.', tipo: 'neutral' },
    { fecha: 'Ene–may 2026', responsable: 'Operación cliente',   evento: '227 entrantes con 53.3% de atención (121 atendidas). Es el mejor periodo del año y el punto de comparación de todo lo que sigue.', tipo: 'ok' },
    { fecha: 'Jun–jul 2026', responsable: 'Operación cliente',   evento: 'Colapso de atención: 178 entrantes, 19 atendidas (10.7%), 115 perdidas. La demanda SUBE (113 en julio) mientras baja la capacidad.', tipo: 'problema' },
    { fecha: '16 jul 2026',  responsable: 'Soporte Callpicker',  evento: 'Ticket «Ajuste en Flujo». Primero de los tres del periodo.', tipo: 'neutral' },
    { fecha: '20 ago 2026',  responsable: 'Dan (KAM)',           evento: 'Último contacto registrado en la ficha. El titular explica la baja de llamadas por cambios internos en su plantilla y declara interés en integrar GoHighLevel.', tipo: 'pivote' },
    { fecha: '25 ago 2026',  responsable: 'Victor Carden',       evento: 'El propio Director operativo llama a su línea: 4 abandonos de menú en 12 minutos, el mismo día del ticket de ajuste de flujo. Ventas, Veronesa y Campestre reciben su última llamada.', tipo: 'problema' },
    { fecha: '24–25 ago 2026', responsable: 'Soporte Callpicker', evento: 'Dos tickets «Ajuste en Flujo» consecutivos. El ruteo se rediseña hacia un solo destino.', tipo: 'pivote' },
    { fecha: '27 ago 2026',  responsable: 'Operación cliente',   evento: 'BDC recibe su primera llamada. Las perdidas bajan de 64.6% a 28.2%, pero el abandono en menú sube de 13.3% a 35.7%: la fuga cambia de sitio.', tipo: 'pivote' },
    { fecha: '23 oct 2026',  responsable: 'Operación cliente',   evento: 'Arranca marcación saliente: 32 llamadas ese día y 37 el 27 de octubre (69 de las 81 del año en dos tardes). Mismo día: 3 tickets (Login, WhatsApp, Duda operativa).', tipo: 'ok' },
    { fecha: '25 nov 2026',  responsable: 'SAC',                 evento: 'Cierre del periodo auditado. 782 entrantes, 260 atendidas, 0 devoluciones registradas.', tipo: 'neutral' },
    { fecha: '26 nov 2026',  responsable: 'SAC',                 evento: 'Expediente dado de alta con el reporte conciliado contra `cuentas` y GRC. Dos correcciones aplicadas y visibles en el documento.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'CAMPESTRE LOS VIVEROS' },
    { label: 'Consecutivo · CID',   value: 'Z35 · 38444' },
    { label: 'Asesor',              value: 'Dan' },
    { label: 'Sector',              value: 'Inmobiliaria — desarrollo y postventa' },
    { label: 'Marcas en el flujo',  value: 'Campestre, Veronesa, Constructora HYG (constructorahyg.com)' },
    { label: 'Contacto único',      value: 'Victor Carden · Director operativo · mercadotecnia@constructorahyg.com' },
    { label: 'Cliente desde',       value: '8 de mayo de 2020 (6 años)' },
    { label: 'MRR institucional',   value: '$1,069 — GRC, clasif A, «MRR estable». La ficha guarda 0.0 y no se usa.' },
    { label: 'Plan contratado',     value: 'Visibilidad y Control 400 min + 2 Extensiones VyC + 100 min entrantes al 800' },
    { label: 'Consumo medido',      value: '692 min en 11 meses (629 entrantes + 63 salientes). Mejor mes: 111 min = 27.8% del plan.' },
    { label: 'Adopción',            value: '0 de 6 módulos. Sin Chat, sin IA de Voz, sin API, sin pago automático.' },
    { label: 'Último contacto',     value: '20 de agosto de 2026' },
    { label: 'Estado en cartera',   value: 'activo (`cuentas.estado`), con 5 episodios de alerta colgados' },
  ],

  necesidad_negocio:
    'Una inmobiliaria vive de la llamada entrante: el prospecto que vio un anuncio y el cliente de ' +
    'postventa que reporta un problema de su casa. Las dos cosas llegan por teléfono y las dos tienen ' +
    'ventana corta. Campestre no necesita más minutos — usa el 27.8% de los que paga en su mejor mes. ' +
    'Necesita que la llamada que entra termine con alguien, y que la que no termine se devuelva el mismo día.',

  potencial_corto: [
    'Rutina diaria de devolución de perdidas con los minutos ociosos del plan: cero costo incremental, usa capacidad ya pagada.',
    'Corregir el destino «Constructora HYG» (14 de 14 a buzón) y confirmar a qué extensión debe ir.',
    'Revisión del menú con el cliente: 194 llamadas murieron ahí, 140 desde agosto.',
    'Activar el paquete de 100 min del 800 2141114 o darlo de baja: hoy el DID aparece «Available».',
  ],

  potencial_largo: [
    'Agente de voz con IA para fuera de horario y desborde en el pico de 12–14 h: 76 llamadas fuera de horario y 45 en domingo sin nadie del otro lado.',
    'Callpicker Chat / WhatsApp para la demanda de fin de semana y la postventa rutinaria.',
    'Multimarca: Campestre, Veronesa y Constructora HYG pueden tener número y reporte propios — tres marcas, una sola lectura hoy.',
    'Integración con su CRM: el interés en GoHighLevel es una puerta de entrada a Producto, no sólo una amenaza.',
  ],

  tacticas: [
    {
      nombre: 'Entrar con los 354 números, no con la tasa',
      descripcion: 'La tasa de 66.8% es una abstracción que el cliente puede discutir. «354 personas le llamaron este año y nunca hablaron con nadie» no se discute. Es el dato con el que se abre la sesión.',
      impacto: 'Convierte una conversación de servicio en una conversación de ingreso perdido, que es la que autoriza presupuesto.',
    },
    {
      nombre: 'Usar su propia llamada como evidencia',
      descripcion: 'Victor Carden llamó 14 veces a su línea y 8 se perdieron, 4 de ellas abandonando el menú en 12 minutos el 25 de agosto. Enseñarle su propio registro evita la discusión de si el dato es nuestro o suyo.',
      impacto: 'El decisor deja de ser auditor del reporte y pasa a ser testigo del problema.',
    },
    {
      nombre: 'Devolución antes de venta',
      descripcion: 'La propuesta de IA de Voz llega después de la rutina de devolución, no antes. Con un plan al 27.8% la primera recomendación tiene que ser gratis: usar lo que ya paga.',
      impacto: 'Quita el argumento de «me quieren vender más de lo que uso» en una cuenta de $1,069.',
    },
    {
      nombre: 'Tomar el interés en GoHighLevel como requerimiento, no como amenaza',
      descripcion: 'Canalizarlo a Producto/Ingeniería con el caso de uso levantado (registrar llamadas, crear prospectos, marcar desde el CRM) y volver con una respuesta formal.',
      impacto: 'Una respuesta formal, aunque sea un no, retiene mejor que el silencio frente a un competidor que ya trae telefonía incluida.',
    },
  ],

  senal_alarma:
    'El cliente pidió integración con GoHighLevel, que incluye telefonía propia (LC Phone) y tiene ' +
    'proveedores vendiendo integración nativa. Con 0 de 6 módulos activados, un plan al 27.8% de uso, ' +
    'un solo contacto y último contacto del 20 de agosto, esta cuenta puede irse sin que nadie lo vea venir.',

  problema_raiz:
    'Nadie le ha mostrado al cliente que el problema es de capacidad humana y no de plataforma, así que ' +
    'cada reestructura del flujo mueve la fuga de sitio en vez de cerrarla, y el único contacto de la ' +
    'cuenta se está formando su opinión del servicio probando su propia línea.',

  problema_raiz_detalle:
    'La secuencia está documentada y es coherente: en junio y julio el cliente pierde plantilla y la ' +
    'atención cae al 10.7% mientras la demanda sube. En julio y agosto pide tres «Ajustes en Flujo». El ' +
    '26 de agosto el ruteo pasa de cuatro destinos a BDC. Las perdidas bajan de 64.6% a 28.2% — el ajuste ' +
    'técnico funcionó. Pero el abandono en el menú sube de 13.3% a 35.7%: la gente que antes esperaba a ' +
    'que alguien contestara ahora cuelga antes de llegar. Dos extensiones VyC registradas en la ficha para ' +
    'cinco destinos, y soporte con 12 tickets y cero fallas de plataforma, dejan una sola hipótesis fuerte: ' +
    'falta gente conectada, no falta tecnología.\n\n' +
    'Lo que convierte eso en riesgo de cancelación es la ausencia de rutina de devolución. Con 0 ' +
    'devoluciones en 782 entrantes, una llamada perdida es una llamada cerrada. De 522 no atendidas sólo ' +
    '110 volvieron a intentar en 24 h y 35 lo lograron: el prospecto nuevo recibe la peor experiencia de ' +
    'la cuenta, y nadie lo sabe porque no hay encuesta (4.2% de cobertura) ni reuniones registradas.',

  flujo_real: [
    { fase: '1. Entra la llamada',        area: 'Flujo Callpicker',     accion: 'Hasta el 25 ago reparte a Ventas, Postventa, Veronesa, Campestre y Constructora HYG; desde el 27 ago, a BDC', resultado: 'Ventas perdió 130 de 247 (52.6%); Postventa 46 de 91 (50.5%); BDC pierde 38.5%.' },
    { fase: '2. El menú filtra',          area: 'IVR del cliente',      accion: 'Sin destino asignado: 234 llamadas, 194 colgaron dentro del menú',                                            resultado: '1 de cada 4 llamadas del año muere en el menú. 140 de ellas desde agosto. No sabemos si el menú resuelve o expulsa.' },
    { fase: '3. Nadie contesta',          area: 'Operación cliente',    accion: '2 extensiones VyC registradas para 5 destinos; sin turnos fuera de 9–19 h ni en domingo',                     resultado: '286 perdidas, 76 fuera de horario (4 atendidas), domingo al 62% de pérdida.' },
    { fase: '4. Nadie devuelve',          area: 'Operación cliente',    accion: 'Ninguna rutina de devolución; la saliente del 23–27 oct fue campaña, no rescate',                             resultado: '0 devoluciones en 782 entrantes. Solo 4 de los 61 números marcados en la campaña habían llamado antes.' },
    { fase: '5. Nadie mide la calidad',   area: 'Operación cliente',    accion: 'Encuesta activa pero el ejecutivo cuelga antes en 52% de las atendidas',                                      resultado: '11 calificaciones de 260 atendidas. Sin voz del cliente final con la que discutir la calidad.' },
    { fase: '6. Nadie habla con nosotros', area: 'Callpicker · KAM',    accion: 'Último contacto 20 ago 2026; 0 reuniones registradas en la cuenta',                                           resultado: 'El interés en GoHighLevel quedó anotado en la ficha y sin respuesta formal durante tres meses.' },
  ],

  comparativo: [
    { metrica: 'Llamadas que llegan con una persona', real: '33.2% (260 de 782)',                ideal: '≥ 60% con cobertura de desborde y fuera de horario' },
    { metrica: 'Números atendidos al menos una vez',  real: '215 de 569 (38%)',                   ideal: '≥ 85% — el resto, devuelto el mismo día' },
    { metrica: 'Devolución de perdidas en < 24 h',    real: '0 de 522',                           ideal: '≥ 80% con lista diaria para BDC' },
    { metrica: 'Abandono en el menú',                 real: '24.8% del total (35.7% desde ago)',  ideal: '< 15% con menú de 3 opciones medido por opción' },
    { metrica: 'Uso del plan de 400 min',             real: '27.8% en su mejor mes (111 min)',    ideal: 'Los minutos ociosos convertidos en devoluciones, no en un downgrade' },
    { metrica: 'Cobertura de encuesta',               real: '4.2% (11 de 260)',                   ideal: '≥ 30% para tener voz del cliente medible' },
    { metrica: 'Contactos en la cuenta',              real: '1 (Victor Carden)',                  ideal: '≥ 2, con el responsable de BDC identificado' },
  ],

  plan_inmediato: [
    { accion: 'Sesión de resultados con Victor Carden con tres cifras y un caso: 66.8% no atendido, 354 números sin respuesta, 0 devoluciones, y el destino Constructora HYG con 14 de 14 a buzón.', responsable: 'Dan (KAM)',          criterio: 'Reunión registrada en la cuenta y un segundo contacto identificado (responsable de BDC).' },
    { accion: 'Corregir el destino «Constructora HYG»: confirmar con el cliente a qué extensión o número debe ir.',                                                                                 responsable: 'Soporte + cliente',  criterio: 'Buzón de ese destino en 0 en el siguiente corte.' },
    { accion: 'Dimensionar extensiones contra destinos activos: preguntar cuántas personas atienden hoy BDC y en qué horario.',                                                                      responsable: 'Dan + Comercial',    criterio: 'Perdidas de BDC por debajo del 20%.' },
    { accion: 'Responder por escrito el interés en GoHighLevel: levantar el caso de uso y canalizarlo a Producto/Ingeniería.',                                                                       responsable: 'SAC → Producto',     criterio: 'Respuesta formal al cliente, aunque sea un no, antes de cerrar diciembre.' },
  ],

  plan_mediano: [
    { accion: 'Rutina diaria de devolución: lista de perdidas del día anterior para BDC a una hora fija, con los minutos ociosos del plan.', responsable: 'SAC configura, BDC ejecuta', criterio: '% de perdidas devueltas en < 24 h, medido en el corte de diciembre.' },
    { accion: 'Revisión del menú: escuchar el árbol en vivo y mapear cada opción; dejar máximo tres.',                                        responsable: 'Soporte + cliente',         criterio: 'Abandono en menú por debajo del 15%.' },
    { accion: 'Resolver el paquete de 100 min del 800 2141114: activarlo con un uso real o darlo de baja.',                                   responsable: 'Dan + Facturación',         criterio: 'El DID deja de aparecer como «Available» o desaparece de la factura.' },
    { accion: 'Encuesta al final de llamada: ajustar el flujo para que el ejecutivo no cuelgue antes.',                                       responsable: 'Soporte',                   criterio: 'Cobertura de encuesta por encima del 30%.' },
  ],

  plan_estrategico: [
    { accion: 'Piloto de agente de voz con IA para fuera de horario y desborde del pico de 12–14 h, dimensionado con el volumen real (76 fuera de horario, 45 en domingo).', responsable: 'Comercial + SAC', criterio: 'Atención total por encima del 60%.' },
    { accion: 'Propuesta multimarca: número y reporte propios para Campestre, Veronesa y Constructora HYG.',                                                                  responsable: 'Comercial',       criterio: 'Al menos una marca con reporte separado.' },
    { accion: 'Ajustar la métrica de «sin contestar» del tablero para separar menú y buzón de las perdidas reales, una vez validado qué hace el menú.',                        responsable: 'SAC (ATLAS)',     criterio: 'La métrica del tablero coincide con el detalle de llamadas.' },
  ],

  areas_oportunidad: [
    { area: 'Devolución de perdidas con minutos ociosos', impacto: '522 llamadas no atendidas hoy sin ninguna rutina de rescate; cero costo incremental', responsable: 'Dan + SAC' },
    { area: 'Rediseño del menú',                          impacto: '194 llamadas murieron en el menú, 140 desde agosto; se corrige sin costo de licencia', responsable: 'Soporte' },
    { area: 'IA de Voz / Chat fuera de horario',           impacto: '76 entrantes fuera de horario y 45 en domingo sin cobertura',                           responsable: 'Comercial' },
    { area: 'Integración con CRM (GoHighLevel)',          impacto: 'Convierte la amenaza competitiva en requerimiento de producto',                         responsable: 'SAC → Producto' },
    { area: 'Segundo interlocutor',                        impacto: 'Hoy la cuenta depende de una persona que además vive la falla',                         responsable: 'Dan' },
  ],

  perfiles: [
    {
      nombre: 'Victor Carden',
      rol: 'Director operativo · único contacto de la cuenta',
      color: '#ef4444',
      campos: [
        { label: 'Correo',               value: 'mercadotecnia@constructorahyg.com' },
        { label: 'Teléfono',             value: '4431733524' },
        { label: 'Lo que vive',          value: 'Su número aparece 14 veces en el detalle: 8 perdidas (7 en Ventas) y 4 abandonos de menú en 12 minutos el 25 ago.' },
        { label: 'Lo que declaró',       value: 'La baja de llamadas se debió a cambios internos en su plantilla. Le interesa integrar GoHighLevel.' },
        { label: 'Riesgo',               value: 'Si atribuye a la plataforma lo que es capacidad interna, y nadie le enseña el dato, la decisión la toma solo.' },
      ],
    },
    {
      nombre: 'Dan',
      rol: 'KAM de la cuenta',
      color: '#6366f1',
      campos: [
        { label: 'Último contacto',      value: '20 de agosto de 2026' },
        { label: 'Reuniones registradas', value: '0' },
        { label: 'Lo que tiene a favor',  value: 'La reestructura de agosto y la campaña saliente de octubre son dos hechos suyos que el cliente reconoce.' },
        { label: 'Lo que le falta',       value: 'Un segundo contacto y una respuesta formal al requerimiento de GoHighLevel.' },
      ],
    },
    {
      nombre: 'BDC',
      rol: 'Destino único del flujo desde el 27 ago 2026',
      color: '#f59e0b',
      campos: [
        { label: 'Volumen',              value: '148 llamadas, 82 atendidas, 57 perdidas, 9 a buzón' },
        { label: 'Pérdida',              value: '38.5% (perdidas) · 44.6% contando buzón' },
        { label: 'Duración media',        value: '1.7 min (mediana 1) contra 2.7 en Ventas y 3.2 en Postventa' },
        { label: 'Lectura',               value: 'Consistente con un rol de calificación y transferencia; falta confirmar si la transferencia posterior se mide.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '6 años como cliente, pagos al corriente, cero incidencias de cobranza.',
      'Demanda real y creciente: 569 números únicos y pico de 138 entrantes en agosto.',
      'Cliente activo con su propio flujo: reestructuró destinos y abrió BDC.',
      'Arrancó marcación saliente el 23 oct con 63% de contacto efectivo.',
      'Plataforma estable: 12 tickets, todos de asistencia, cero fallas.',
      'Los cinco repartos del reporte cierran contra el total: la base de la conversación es sólida.',
    ],
    oportunidades: [
      'Rutina diaria de devolución con los minutos ociosos del plan.',
      'Agente de voz con IA para fuera de horario y desborde en el pico.',
      'Rediseño del menú medido semana a semana.',
      'Extensiones adicionales o grupo de timbrado para BDC.',
      'Multimarca: Campestre, Veronesa y Constructora HYG con números y reportes propios.',
      'El interés en GoHighLevel canalizado a Producto como requerimiento.',
    ],
    debilidades: [
      '66.8% de entrantes no llega a una persona; 354 números nunca atendidos.',
      'Cero devoluciones de llamadas perdidas en 782 entrantes.',
      'Menú con 24.8% de abandono, que casi se triplicó tras el rediseño (13.3% → 35.7%).',
      'Destino Constructora HYG con 14 de 14 llamadas a buzón.',
      '2 extensiones registradas para 5 destinos; sin cobertura fuera de horario ni en domingo.',
      'Encuesta al 4.2%; 0 de 6 módulos activados; un solo contacto.',
      'Un paquete de 100 min del 800 pagado con el DID etiquetado «Available».',
    ],
    amenazas: [
      'GoHighLevel, el CRM que le interesa, trae telefonía propia (LC Phone) y proveedores que ya venden integración nativa.',
      'Costo de salida bajo: sin módulos ni integraciones que la retengan.',
      'El director atribuye a la plataforma lo que es capacidad interna si nadie le muestra los datos.',
      'La rotación de plantilla es repetible: el colapso de jun–jul puede volver.',
      'Plan al 27.8% de uso: solicitud de plan menor sobre un MRR que ya es de $1,069.',
      'Dependencia de un único contacto, que además es quien vive la falla.',
    ],
  },

  conclusion:
    'Campestre Los Viveros no es una cuenta que esté fallando por falta de plataforma: 12 tickets, cero ' +
    'fallas, y una reestructura de flujo que hizo exactamente lo que se le pidió. Está fallando porque ' +
    'nadie contesta y nadie devuelve. Dos tercios de lo que entra no llega a una persona, el 62% de quienes ' +
    'llamaron nunca habló con nadie, y el campo de devolución está en cero en las 782 entrantes del año.\n\n' +
    'Es la cuenta más pequeña de las ocho auditadas en noviembre — $1,069 de MRR — y eso define la ' +
    'estrategia: la primera recomendación tiene que ser gratis. Hay 290 minutos de plan sin usar cada mes ' +
    'y una capacidad saliente que el cliente acaba de estrenar. Convertir eso en rutina de devolución no ' +
    'cuesta nada y ataca el único hallazgo que el cliente puede traducir a dinero.\n\n' +
    'El reloj lo pone GoHighLevel. El cliente ya pidió la integración, el competidor ya trae telefonía ' +
    'incluida, y nadie ha hablado con él desde el 20 de agosto.',

  pierde: [
    '$1,069 de MRR al mes · $12,828 al año si cancela.',
    'Tres marcas (Campestre, Veronesa, Constructora HYG) que podían ser tres líneas facturables.',
    'La referencia en un sector —inmobiliario de Michoacán— donde hoy no tenemos otra cuenta auditada.',
    'La campaña saliente recién estrenada, que es la única adopción nueva del año.',
  ],

  gana: [
    'Una cuenta estable con demanda creciente y seis años de pagos al corriente.',
    'Un caso de devolución de perdidas construido sobre minutos ya pagados, replicable en toda la cartera chica.',
    'Un requerimiento de integración con CRM levantado formalmente, que sirve para más de una cuenta.',
    'Tres marcas que pueden crecer a número y reporte propios.',
  ],

  recomendacion_central:
    'Entrar con los 354 números que nunca fueron atendidos, no con la tasa de 66.8%, y llevar una sola ' +
    'propuesta a esa primera sesión: rutina diaria de devolución con los minutos que ya paga y no usa. ' +
    'Corregir en la misma reunión el destino Constructora HYG (14 de 14 a buzón) y responder por escrito ' +
    'el requerimiento de GoHighLevel. La venta de IA de Voz va después, nunca antes.',

  documentos: [
    {
      nombre: 'Auditoría de llamadas · Campestre Los Viveros · 2026',
      ruta: '/auditorias/Auditoria-Campestre-Los-Viveros-2026.html',
      descripcion:
        'Reporte interactivo del corte del 2 ene al 25 nov 2026 sobre 782 entrantes y 81 salientes del ' +
        'CID 38444: desenlace por mes, destino, día y hora, mapa de calor, cruce con el tablero, FODA y ' +
        'plan de acción. Publicado con dos correcciones visibles dentro del documento (la franja de 0–5 h ' +
        'y el 31% del plan) y con el MRR verificado contra el GRC.',
    },
  ],
}
