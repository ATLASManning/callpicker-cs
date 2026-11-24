import type { AuditoriaCase } from './types'

/**
 * AGUA INMACULADA · C17 · CID 333
 *
 * ── POR QUÉ ESTA VERSIÓN 2.0 CAMBIA LAS CIFRAS DE LA 1.0 ───────────────────
 * La v1.0 publicaba «8,791 llamadas no atendidas» y «1 de cada 3», dos cifras
 * que no cierran entre sí (su propia cronología sumaba 5,298) y que ninguna
 * fuente sostiene. El reporte entregado en noviembre de 2026 publicaba otra
 * cosa: 7,895 y el 51.3%, «más de la mitad de las llamadas entrantes».
 *
 * Las dos están mal, y por la MISMA razón: el reporte llama «no atendida» a
 * toda llamada que no tomó un agente, y ahí dentro van las que resolvió el
 * autoservicio y las que dejaron recado en buzón. Medido contra
 * `data/analisis-llamadas.json` (CID 333, corte 12 oct 2026): las perdidas de
 * verdad son 4,972 de 15,384 entrantes — el 32.3%. La alerta
 * `llamadas_perdidas_masivas` de la propia cuenta mide 32.1% sobre ene–14 sep,
 * que es la misma lectura.
 *
 * Los totales entrantes y las atendidas del reporte coinciden AL RÉCORD con
 * nuestra fuente, así que la diferencia no es «otro corte»: es la definición.
 *
 * Lo mide `scripts/concilia-auditoria-agua-inmaculada.py` y lo publica
 * `scripts/publica-auditoria-agua-inmaculada.py`. Las 13 roturas de
 * `prueba-conciliadores-al-reves.py agua-inmaculada` prueban que sabe fallar.
 *
 * ── LO QUE NO SE PUEDE MEDIR, DICHO CON PALABRAS ───────────────────────────
 * Los minutos facturables (plan de 10,000; consumos de 9,150 y 9,910) vienen
 * de la exportación de la plataforma que acompaña al reporte. El CID 333 NO
 * tiene filas en `data/cortes-facturacion.xlsx` y la cuenta lleva abierta la
 * alerta crítica `sin_consumo_medible`. La aritmética interna de esas cifras
 * cierra; su origen es el cliente, no nosotros.
 */

export const AGUA_INMACULADA: AuditoriaCase = {
  id: 'agua-inmaculada',
  asesor: 'Erick',
  nombre: 'Agua Inmaculada',
  sector: 'Franquicias – Distribución de Agua / Red Nacional',
  fecha_periodo: 'Datos del reporte: Enero – Abril 2026 · medición propia al 14 sep 2026',
  fecha_auditoria: 'Nov 2026 (v2.0 · conciliada el 23 nov)',
  tipo_cliente: 'Mid-Market AAA – Red de Franquicias · CID 333 · MRR $12,500 (GRC)',
  descripcion_contexto: 'Consumo y atención telefónica · reporte de noviembre reconciliado contra las fuentes',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '2.0',

  /* Los cuatro que cambian una decisión. El reporte titulaba con el 51.3% y
     con «+17.8% de crecimiento», que es verdad y no decide nada. */
  kpis: [
    { label: 'Llamadas perdidas (ene–abr)', value: '4,972',   color: '#ef4444' },
    { label: 'Tasa real de pérdida',        value: '32.3%',   color: '#f59e0b' },
    { label: 'Efecto del ajuste de junio',  value: '−1.8 pts', color: '#6366f1' },
    { label: 'Sin contacto desde 23 jun',   value: '153 días', color: '#ef4444' },
  ],

  resumen_ejecutivo: 'En noviembre de 2026 se entregó un reporte de telefonía de esta cuenta con datos de enero a abril. Su aritmética interna casi toda cierra —el promedio de 9,150 minutos facturables, el 91.5% de utilización, el 99.1% de abril y el +17.8% de crecimiento del volumen se reconstruyen desde sus propias series—, y sus totales entrantes coinciden al récord con nuestra fuente de llamadas. Pero su cifra titular mide otra cosa de la que dice.\n\nEl reporte llama «no atendidas» a todas las llamadas que no tomó un agente, y publica «7,895 — más de la mitad de las llamadas entrantes no fueron atendidas». Dentro de ese número van 2,359 llamadas que resolvió el autoservicio y 564 que dejaron recado en buzón. Las perdidas de verdad son 4,972 de 15,384: el 32.3%, una de cada tres. Es un problema grande y es la mitad del que se le iba a plantear al cliente.\n\nY hay un problema de fecha que pesa más que las cifras. El análisis es de enero–abril y las acciones que propone se acordaron en la reunión del 2 de junio de 2026. La principal —configurar las extensiones para atender una llamada a la vez— ya se aplicó el 23 de junio (ticket #107776), su efecto ya se puede medir, y no bastó: la tasa de pérdida pasó del 32.6% (ene–may) al 30.7% (jul al 14 sep). Bajó 1.8 puntos y ahí sigue. El reporte no lo dice porque su ventana termina en abril.\n\nEl último contacto que llegó al cliente es de ese mismo 23 de junio, hace 153 días, con una alerta crítica de silencio abierta desde el 6 de octubre.',

  resultado_positivo: 'La conciliación evitó llevarle al cliente una cifra que no se sostiene contra nuestra propia plataforma, y rescató el dato que el reporte no podía ver: que el ajuste de configuración de junio sí sirvió, midió 1.8 puntos, y no resolvió el problema. Eso convierte la conversación de «le vendemos más minutos» en «sabemos exactamente qué funcionó, cuánto, y qué falta» — que es la única que aguanta 153 días de silencio. El documento publicado lleva las once aclaraciones visibles dentro, y el detector que las vigila está probado contra trece roturas.',

  /* EL ORDEN NO ES DE ESTILO: `lib/atlas-context.ts` se lleva los CUATRO
     primeros recortados a 180 caracteres, y `lib/seguimiento-auditoria.ts` los
     TRES primeros ENTEROS a la actividad que el asesor lee antes de llamar.
     Los tres primeros son, por eso: la cifra real, el ajuste que ya se hizo y
     no bastó, y los 153 días de silencio. [[auditoria-modulo]] */
  hallazgos: [
    'Las llamadas perdidas reales son 4,972 de 15,384 (32.3%), no las 7,895 del reporte: ahí dentro van 2,359 que resolvió el autoservicio y 564 de buzón. No es «más de la mitad».',
    'El ajuste de timbrado que el reporte propone ya se aplicó el 23 jun 2026 (ticket #107776). La tasa bajó del 32.6% (ene–may) al 30.7% (jul–14 sep): sirvió 1.8 puntos y no bastó.',
    'El último contacto que llegó al cliente es del 23 jun 2026, hace 153 días, con alerta crítica de silencio abierta. Ninguna acción del reporte puede presentarse como «en curso».',
    'El reporte parte de «plan actual $10,500/mes» y el GRC dice $12,500 (AAA, estable). Los «+$4,000 / +$8,000» no son lo que subiría su factura hasta cuadrarlo con facturación.',
    'En junio el cliente pidió un ajuste de plan porque consideraba que usaba MENOS de lo contratado (ticket #107227). La propuesta de noviembre va en dirección contraria, y eso hay que plantearlo de frente, no esquivarlo.',
    'El incremento a 12,000 minutos —la Opción A del reporte— ya se aprobó evaluarlo en la reunión del 2 jun 2026. No es una propuesta nueva: lleva abierta casi seis meses sin cerrarse.',
    'Más minutos no recuperan llamadas perdidas. Ampliar la bolsa resuelve el riesgo de excedente de abril (99.1% del plan) y no toca la tasa de pérdida, que es capacidad de atención. Son dos decisiones con dos justificaciones, y el reporte las presenta juntas.',
    'Los minutos facturables no se pueden verificar contra ninguna fuente nuestra: el CID 333 no tiene filas en el archivo de cortes y la cuenta lleva abierta la alerta crítica `sin_consumo_medible` («0 de 5 meses con dato de consumo»). El dato es del cliente.',
    'El reparto de minutos salientes por tipo es un techo del 98.9%: los tres tipos suman 28,064 minutos y la tabla mensual declara 28,386. Faltan 322 sin cubo «otros», y la tabla rotula su total como «100%».',
    'La serie por hora no es del mismo periodo que el resto del documento: suma 9,486 llamadas contra las 7,895 de ene–abr, y su pie decía «ene–abr» y «(incluye mayo parcial)» en la misma frase. El 55% de la franja 09:00–13:00 sale de esas 9,486.',
    'La misma holgura se publicaba con dos valores: «21% sobre el pico histórico» en la tarjeta (2,090/9,910 = 21.1%) y «20.9% margen real sobre pico» en la tabla, que divide entre el plan viejo. Las correctas son 21.1% y 51.4%.',
    'Dos repartos por LLAMADAS que ninguna tabla del documento sostiene: «el celular es solo el 30-35% de las llamadas» y «el 28% de sus llamadas salientes» van a fijo o extensión. Todo el desglose publicado está en minutos; ahí fijo más extensión son el 25.7%.',
    'Las salientes a celular se llevan entre el 70.4% y el 76.4% de los minutos facturables salientes y la proporción sube cada mes: es el destino que más pesa en la bolsa y el único optimizable por configuración.',
    'El Radar de la cuenta está en 0 de 12 preguntas respondidas, con alerta de severidad alta abierta desde el 6 oct 2026, en una cuenta de $12,500 al mes. No hay diagnóstico propio con el que contrastar lo que diga el cliente.',
  ],

  cronologia: [
    { fecha: 'Dic 2014', responsable: 'Agua Inmaculada', evento: 'Alta de la cuenta. Al cierre de noviembre de 2026 lleva 143 meses facturados y $1,507,069 acumulados en el GRC.', tipo: 'ok' },
    { fecha: 'Ene–Abr 2026', responsable: 'Operación Agua Inmaculada', evento: 'Volumen entrante de 3,524 a 4,151 llamadas al mes (+17.8%). Perdidas reales: 1,041 · 1,207 · 1,339 · 1,385 — del 29.5% al 33.4%. Minutos facturables del 88.6% al 99.1% del plan.', tipo: 'problema' },
    { fecha: '2 jun 2026', responsable: 'José Manuel, Claudia y Javier Peña', evento: 'Reunión de análisis de tráfico. Se identifica la saturación y el problema de enrutamiento. Se aprueba EVALUAR el incremento a 12,000 minutos y se acuerdan el ajuste de extensiones, el monitoreo periódico y el grupo de WhatsApp.', tipo: 'pivote' },
    { fecha: '23 jun 2026', responsable: 'Soporte Callpicker (ticket #107776)', evento: 'Se configuran TODAS las extensiones activas para atender una sola llamada a la vez — la causa principal del abandono identificada en la reunión. Mismo día: el cliente pide un ajuste de plan por usar MENOS de lo contratado (#107227).', tipo: 'ok' },
    { fecha: 'Jul–14 sep 2026', responsable: 'Medición propia (analisis-llamadas, corte 12 oct)', evento: 'El efecto del ajuste, medido: la tasa de pérdida pasa del 32.6% (ene–may) al 30.7%. Bajó 1.8 puntos y se queda ahí. Julio 32.7%, agosto 27.8%, septiembre 32.2%. Sirvió y no bastó.', tipo: 'problema' },
    { fecha: '6 oct 2026', responsable: 'Alertas de Cliente', evento: 'Se abren tres alertas: silencio de más de 60 días (CRÍTICA, condición desde el 23 jun), Radar en 0 de 12 (ALTA) y `sin_consumo_medible` (CRÍTICA, dueño Ingeniería).', tipo: 'problema' },
    { fecha: '14 oct 2026', responsable: 'Alertas de Cliente', evento: 'Se abre `llamadas_perdidas_masivas` (ALTA): 10,983 entrantes sin respuesta sobre 34,222 en ene–14 sep, el 32.1%. Por debajo del umbral del 40% de tasa, pero son 10,983 personas que no hablaron con nadie.', tipo: 'problema' },
    { fecha: '15 oct 2026', responsable: 'SAC', evento: 'La cartera pasa de Claudia a Erick. Las 71 cuentas incluyen esta; los registros de junio siguen a nombre de Claudia porque son suyos.', tipo: 'neutral' },
    { fecha: 'Nov 2026', responsable: 'Reporte entregado', evento: 'Se entrega el análisis de telefonía con datos de ene–abr y dos propuestas de plan (12,000 y 15,000 minutos). Su cifra titular cuenta el autoservicio y el buzón como «no atendidas».', tipo: 'problema' },
    { fecha: '23 nov 2026', responsable: 'SAC — conciliación', evento: 'Se concilia el documento contra el GRC y la fuente de llamadas: 11 aclaraciones dentro del documento, 8 desfases declarados por clave. Se publica la v2.0 del expediente con las cifras medidas.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'Agua Inmaculada' },
    { label: 'Consecutivo / CID',   value: 'C17 · CID 333 · cliente desde dic 2014' },
    { label: 'Sector',              value: 'Franquicias – Distribución de Agua / Red Nacional' },
    { label: 'Contacto principal',  value: 'Javier Peña — Director TI · sistemas@aguainmaculada.com' },
    { label: 'Red',                 value: 'Más de 1,800 sucursales/franquicias y 8 CEDIS en México' },
    { label: 'Servicio',            value: 'Visibilidad y Control' },
    { label: 'MRR institucional',   value: '$12,500/mes (GRC, banda AAA, estable). El reporte usa $10,500 como «plan actual»: sin cuadrar.' },
    { label: 'Plan de minutos',     value: '10,000 min/mes según la exportación del cliente. No verificable: el CID no está en el archivo de cortes.' },
    { label: 'Health Score',        value: '53 · semáforo naranja · 4 alertas abiertas (2 críticas)' },
    { label: 'Ejecutivo SAC',       value: 'Erick (desde el 15 oct 2026; antes Claudia, que llevó la reunión de junio)' },
  ],

  necesidad_negocio: 'Agua Inmaculada opera una red de más de 1,800 sucursales y franquicias y 8 centros de distribución, y el canal telefónico es como esa red habla con la coordinación central. El volumen entrante creció un 17.8% de enero a abril de 2026 conforme la red se expande.\n\nSu necesidad no es tener más minutos: es que cada franquicia que llama hable con alguien. El consumo lleva meses dentro del plan, y en junio de 2026 el propio cliente abrió un ticket para pedir un ajuste porque consideraba que usaba menos de lo contratado. Lo que le duele, medido, es que una de cada tres llamadas entrantes se pierde, y que el ajuste de configuración que pidió y recibió en junio sólo movió esa cifra 1.8 puntos.',

  potencial_corto: [
    'Recuperar el contacto: 153 días de silencio con una alerta crítica abierta',
    'Cerrar la decisión del incremento a 12,000 minutos, abierta desde el 2 jun 2026',
    'Cuadrar la base de facturación: $10,500 del reporte contra $12,500 del GRC',
    'Pasar el CID 333 al archivo de cortes para poder medir su consumo (Ingeniería)',
  ],
  potencial_largo: [
    'Atacar la pérdida con capacidad de atención, no con bolsa: cola inteligente y desbordamiento en 09:00–13:00',
    'Asistente virtual de primer nivel, que es lo único que puede mover el 30.7% restante',
    'Extensiones móviles para cubrir la franja pico sin contratar personal',
    'Reporte mensual de atención por extensión como herramienta de gestión del cliente',
  ],

  tacticas: [
    { nombre: 'Cuestionamiento de valor (jun 2026)', descripcion: 'Ticket #107227: el cliente pidió un ajuste de plan porque consideraba que el uso era MENOR a las capacidades contratadas.', impacto: 'Correcto en dirección y al revés de lo que propone el reporte de noviembre. Plantear un alza sin reconocer ese ticket es lo que rompe la credibilidad.' },
    { nombre: 'Apertura a los datos', descripcion: 'En la reunión del 2 de junio aceptó el análisis, aprobó evaluar el incremento a 12,000 minutos y se comprometió a revisar el reporte de llamadas perdidas.', impacto: 'Perfil receptivo y técnico. Lo que no hubo después fue seguimiento nuestro: la decisión lleva casi seis meses abierta.' },
    { nombre: 'Silencio de cinco meses', descripcion: 'Desde el 23 de junio no hay un contacto registrado que llegara al cliente. Las tres actividades posteriores son internas, y una quedó bloqueada.', impacto: 'El riesgo no está en el reporte: está en reaparecer a los cinco meses con una propuesta de subirle el plan. La reapertura se hace con el dato del ajuste medido, no con la propuesta.' },
  ],
  senal_alarma: 'Si el cliente pregunta «¿y esto no me lo dijeron en junio?», la respuesta honesta es que sí y que no se le dio seguimiento. La señal grave es distinta: si compara con PBX tradicional o pide cancelar extensiones, lo que está diciendo es que sigue creyendo que paga capacidad que no usa — exactamente lo del ticket #107227 — y entonces la conversación de upsell está muerta hasta resolver la pérdida.',

  problema_raiz: 'Una pérdida de llamadas que el ajuste de configuración sólo movió 1.8 puntos, y cinco meses sin que nadie volviera a mirarla',
  problema_raiz_detalle: 'La causa que se diagnosticó en junio de 2026 era de configuración: las extensiones timbraban aunque el agente ya estuviera en otra llamada, y eso inflaba el abandono. Se corrigió el 23 de junio en todas las extensiones activas. Se puede medir el resultado: la tasa de pérdida pasó del 32.6% (ene–may) al 30.7% (jul al 14 sep).\n\nEso significa dos cosas. Que el diagnóstico era bueno —1.8 puntos sobre 15,000 llamadas al mes son cientos de llamadas rescatadas— y que la causa principal era otra. Con 1,800 franquicias llamando en la franja 09:00–13:00 contra una plantilla de atención que no creció al ritmo del +17.8% de volumen, lo que queda es un problema de capacidad: más minutos en la bolsa no lo tocan, y una configuración ya no lo mueve. Lo que lo mueve es desbordamiento, cola inteligente o atención automatizada de primer nivel.\n\nY encima nadie volvió a mirarlo. El reporte de noviembre es el análisis de junio con fecha de noviembre: propone el ajuste que ya se hizo y no mide el único dato nuevo que existe.',

  flujo_real: [
    { fase: '1. Crecimiento de la red', area: 'Red de 1,800+ franquicias', accion: 'El volumen entrante sube de 3,524 a 4,151 llamadas al mes (+17.8%, ene→abr)', resultado: 'Presión creciente sobre la atención, sin que la capacidad crezca al mismo ritmo.' },
    { fase: '2. Diagnóstico de junio', area: 'Reunión del 2 jun · Claudia y José Manuel', accion: 'Se identifica el timbrado simultáneo en extensiones ocupadas como causa principal del abandono', resultado: 'Se acuerda el ajuste y se aprueba evaluar el incremento a 12,000 minutos.' },
    { fase: '3. El ajuste, aplicado', area: 'Soporte · ticket #107776 (23 jun)', accion: 'Todas las extensiones activas pasan a atender una sola llamada a la vez', resultado: 'La tasa de pérdida baja del 32.6% al 30.7%. Sirvió 1.8 puntos.' },
    { fase: '4. El techo del ajuste', area: 'Medición propia jul–14 sep', accion: 'La tasa se queda en 30.7% y no sigue bajando: jul 32.7%, ago 27.8%, sep 32.2%', resultado: 'La causa que queda no es de configuración ni de minutos. Nadie lo midió hasta hoy.' },
    { fase: '5. Cinco meses de silencio', area: 'SAC', accion: 'Sin contacto que llegue al cliente desde el 23 jun. Tres actividades internas, una bloqueada', resultado: 'Alerta crítica de silencio abierta el 6 oct. La decisión de los 12,000 minutos sigue sin cerrarse.' },
    { fase: '6. El reporte de noviembre', area: 'Documento entregado', accion: 'Se entrega el análisis de ene–abr con dos propuestas de plan y la cifra titular inflada', resultado: 'Conciliado el 23 nov: 11 aclaraciones dentro del documento y la cifra titular corregida antes de que llegue al cliente.' },
  ],

  comparativo: [
    { metrica: 'Llamadas perdidas (ene–abr)',        real: '4,972 de 15,384 — 32.3%',                   ideal: 'El reporte publicaba 7,895 y 51.3%: contaba autoservicio y buzón' },
    { metrica: 'Tasa de pérdida hoy (jul–14 sep)',   real: '30.7% · bajó 1.8 pts tras el ajuste',        ideal: 'Por debajo del 20% exige desbordamiento o atención de primer nivel' },
    { metrica: 'Consumo mensual promedio',           real: '9,150 min — 91.5% del plan (dato del cliente)', ideal: 'Medible por nosotros: el CID 333 debe entrar al archivo de cortes' },
    { metrica: 'Riesgo de excedente',                real: 'Real: abril cerró al 99.1% del plan',        ideal: 'Es una decisión SEPARADA de la pérdida de llamadas' },
    { metrica: 'MRR institucional',                  real: '$12,500/mes (GRC, AAA, estable)',            ideal: 'El reporte parte de $10,500: cuadrar antes de hablar de incrementos' },
    { metrica: 'Último contacto con el cliente',     real: '23 jun 2026 — 153 días',                     ideal: 'Alerta crítica abierta: reapertura antes de cualquier propuesta' },
    { metrica: 'Radar de la cuenta',                 real: '0 de 12 preguntas respondidas',              ideal: 'Sin diagnóstico propio no hay con qué contrastar al cliente' },
  ],

  plan_inmediato: [
    { accion: 'Reabrir el contacto con Javier Peña con el dato del ajuste medido —1.8 puntos— y no con la propuesta de plan. Reconocer de frente los cinco meses y el ticket #107227', responsable: 'Erick — SAC', criterio: 'Contacto registrado que llegue al cliente y alerta de silencio cerrada' },
    { accion: 'No presentar los «+$4,000 / +$8,000» hasta cuadrar la base: el reporte parte de $10,500 y el GRC dice $12,500', responsable: 'Erick + Facturación', criterio: 'Base confirmada por escrito y propuesta re-expresada sobre ella' },
    { accion: 'Separar las dos decisiones en la conversación: la bolsa de minutos (riesgo de excedente, abril al 99.1%) y la pérdida de llamadas (capacidad de atención)', responsable: 'Erick — SAC', criterio: 'Las dos planteadas con su propia justificación y su propio cierre' },
    { accion: 'Cerrar la decisión del incremento a 12,000 minutos, aprobada para evaluación el 2 jun 2026', responsable: 'Erick + Javier Peña', criterio: 'Decisión tomada: alta, baja o se queda, con fecha' },
  ],
  plan_mediano: [
    { accion: 'Dar de alta el CID 333 en el archivo de cortes de facturación para poder medir su consumo con fuente propia', responsable: 'Ingeniería (dueño de `sin_consumo_medible`)', criterio: 'Alerta crítica cerrada y al menos 3 meses con dato de consumo' },
    { accion: 'Responder el Radar de 12 preguntas de la cuenta antes de la siguiente propuesta', responsable: 'Erick — SAC', criterio: '12 de 12 respondidas y alerta `sin_radar` cerrada' },
    { accion: 'Probar cola inteligente o desbordamiento en la franja 09:00–13:00, que concentra el 55% de las llamadas sin agente', responsable: 'Soporte Técnico + Javier Peña', criterio: 'Tasa de pérdida por debajo del 25% en 60 días de medición' },
    { accion: 'Revisar las salientes a celular, que se llevan del 70.4% al 76.4% de los minutos salientes y suben cada mes', responsable: 'Erick + operación del cliente', criterio: 'Propuesta de optimización por configuración, con el ahorro cuantificado' },
  ],
  plan_estrategico: [
    { accion: 'Evaluar asistente virtual de primer nivel: es lo único que puede mover el 30.7% que el ajuste de configuración no movió', responsable: 'Producto + SAC', criterio: 'Prueba acotada con medición antes y después, no una estimación' },
    { accion: 'Monitoreo mensual de consumo y atención, el acuerdo de la reunión del 2 jun que nunca arrancó', responsable: 'Erick — SAC', criterio: 'Ningún mes supera el 85% del plan sin aviso previo al cliente' },
    { accion: 'Conciliar todo reporte de cliente contra el GRC y la fuente de llamadas antes de entregarlo, no después', responsable: 'SAC', criterio: 'Conciliador y prueba al revés en verde antes de cada entrega' },
  ],
  areas_oportunidad: [
    { area: 'Medir el efecto de lo que ya se implementó', impacto: 'El ajuste de junio movió 1.8 puntos y nadie lo sabía. Ese dato vale más para la relación que una propuesta nueva.', responsable: 'SAC — Erick' },
    { area: 'Definición única de «llamada no atendida»', impacto: 'Tres documentos de esta cuenta publican tres cifras distintas de lo mismo. Autoservicio y buzón no son abandono.', responsable: 'SAC + Producto' },
    { area: 'Cortes de facturación con cobertura completa', impacto: 'Sin el CID en el archivo, toda conversación de plan se apoya en la exportación del cliente.', responsable: 'Ingeniería' },
    { area: 'Desbordamiento para redes de franquicias', impacto: 'Captura la llamada en la franja pico sin contratar personal. Caso replicable en cuentas con red distribuida.', responsable: 'Producto + Activaciones' },
  ],

  perfiles: [
    {
      nombre: 'Javier Peña', rol: 'Cliente (Agua Inmaculada) — Director TI / Decisor técnico', color: '#3b82f6',
      campos: [
        { label: 'Motivación primaria',  value: 'Que el presupuesto de telecomunicaciones esté justificado por la operación' },
        { label: 'Lo que pidió en junio',value: 'Ticket #107227: un ajuste de plan porque consideraba que usaba MENOS de lo contratado' },
        { label: 'Estilo negociador',    value: 'Directo y técnico. Aceptó el análisis sin resistencia y se comprometió a revisar el reporte de perdidas.' },
        { label: 'Compromiso abierto',   value: 'Evaluar el incremento a 12,000 minutos, aprobado en la reunión del 2 jun 2026. Sigue sin resolverse.' },
        { label: 'Riesgo del reencuentro', value: '153 días sin que nadie le hablara. Reaparecer con una propuesta de subirle el plan, sin reconocer el #107227, es lo que rompe la credibilidad.' },
        { label: 'Recomendación',        value: 'Abrir con lo medido —el ajuste que pidió sirvió 1.8 puntos y no bastó— y separar la bolsa de minutos de la pérdida de llamadas.' },
      ],
    },
    {
      nombre: 'Erick', rol: 'Callpicker SAC — Ejecutivo de Satisfacción al Cliente (desde el 15 oct 2026)', color: '#22c55e',
      campos: [
        { label: 'Lo que hereda',       value: 'Una cuenta AAA de $12,500/mes con cuatro alertas abiertas, dos críticas, y una decisión de plan parada desde junio' },
        { label: 'Lo que NO es suyo',   value: 'La reunión del 2 jun y los tickets #107227 y #107776 son de Claudia. El expediente v1.0 se los atribuía a él: corregido.' },
        { label: 'Próximo paso',        value: 'Reapertura del contacto con el dato del ajuste medido. La propuesta de plan va después, y con la base cuadrada.' },
        { label: 'Lo que tiene a favor', value: 'El cliente es receptivo y la medición le da algo que decir que no es una venta: qué funcionó, cuánto, y qué falta.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cliente desde diciembre de 2014: 143 meses facturados y $1,507,069 acumulados en el GRC',
      'MRR estable de $12,500/mes en banda AAA, al corriente de pagos y sin incidencias',
      'El diagnóstico de junio era bueno y el ajuste aplicado sí movió la tasa: 1.8 puntos medidos',
      'Interlocutor técnico receptivo, que acepta datos y pide ajustes por escrito',
    ],
    oportunidades: [
      'La medición del ajuste de junio da una conversación que no es una venta: lo que funcionó y cuánto',
      'La franja 09:00–13:00 concentra el 55%: un desbordamiento acotado ahí es medible en 60 días',
      'Las salientes a celular se llevan hasta el 76.4% de los minutos salientes — optimizable por configuración',
      'Red de 1,800+ franquicias y 8 CEDIS: el canal telefónico crece con el negocio',
    ],
    debilidades: [
      '153 días sin un contacto que llegue al cliente, con alerta crítica de silencio abierta',
      'El consumo de esta cuenta no se puede medir con fuente propia: el CID no está en el archivo de cortes',
      'Radar en 0 de 12: no hay diagnóstico nuestro con el que contrastar lo que diga el cliente',
      'Tres documentos de la cuenta han publicado tres cifras distintas de las llamadas no atendidas',
    ],
    amenazas: [
      'Reaparecer tras cinco meses con una propuesta de subirle el plan, cuando en junio pidió lo contrario',
      'Que el 30.7% de pérdida se lea como «Callpicker no lo resolvió» en vez de «falta capacidad de atención»',
      'Abril cerró al 99.1% del plan: sin rollover, el excedente se cobra y llega sin aviso',
      'Si compara con PBX tradicional o pide cancelar extensiones, la conversación de expansión está muerta hasta resolver la pérdida',
    ],
  },

  conclusion: 'Esta cuenta no tiene un problema de minutos. Tiene una pérdida de llamadas de la que ya sabemos tres cosas medidas: que es de una de cada tres y no de más de la mitad, que el ajuste de configuración de junio la movió 1.8 puntos, y que ahí se quedó. Lo que falta no es bolsa: es capacidad de atención en la franja 09:00–13:00.\n\nY tiene un problema nuestro. El reporte de noviembre es el análisis de junio con fecha de noviembre, propone la acción que ya se ejecutó, no mide el único dato nuevo que existía, y llega después de 153 días en los que nadie le habló al cliente. La conversación que aguanta eso no empieza por una propuesta de plan: empieza por decirle qué funcionó de lo que él pidió, cuánto, y qué falta.',

  pierde: [
    'La credibilidad, si se le presenta como hallazgo nuevo el ajuste que se le aplicó en junio',
    'La credibilidad otra vez, si se le dice «más de la mitad de sus llamadas no se atienden» y lo contrasta con su plataforma',
    'La decisión de los 12,000 minutos, aprobada para evaluación hace casi seis meses y sin cerrar',
    'Una cuenta AAA de $12,500/mes y 143 meses de relación, por silencio y no por precio',
  ],
  gana: [
    'Una reapertura con dato propio: el ajuste que el cliente pidió sirvió 1.8 puntos, medidos por nosotros',
    'Dos decisiones limpias en vez de una confusa: la bolsa de minutos y la capacidad de atención',
    'Un camino real contra el 30.7% restante —desbordamiento o atención de primer nivel— con medición antes y después',
    'La cuenta en condiciones de medirse: CID en el archivo de cortes y Radar respondido',
  ],
  recomendacion_central: 'Reabrir el contacto con lo medido y no con la propuesta: el ajuste que el cliente pidió en junio se aplicó, bajó la pérdida 1.8 puntos y no bastó. Y separar las dos decisiones que el reporte presenta juntas — la bolsa de minutos resuelve el riesgo de excedente de abril, y no toca la tasa de pérdida. Antes de hablar de precios, cuadrar la base: el reporte parte de $10,500 y el importe institucional es $12,500.',

  documentos: [
    {
      nombre: 'Auditoría de Telefonía · Agua Inmaculada 2026 (conciliada)',
      ruta: '/auditorias/Auditoria-Agua-Inmaculada-2026.html',
      descripcion: 'El reporte entregado con las 11 aclaraciones de conciliación visibles dentro y 8 desfases declarados por clave. La cifra titular y la frase «más de la mitad de las llamadas entrantes no fueron atendidas» están corregidas sobre el texto, no sólo anotadas. Lo vigila scripts/concilia-auditoria-agua-inmaculada.py, probado contra 13 roturas.',
    },
  ],
}
