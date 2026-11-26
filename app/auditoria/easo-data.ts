import type { AuditoriaCase } from './types'

/**
 * EASO (Transportes EASO) · C14 · CID 31044 · Erick
 *
 * Alta del 26 nov 2026, a partir del reporte entregado
 * «EASO pierde 1 de cada 10 llamadas · CID 31044».
 *
 * CONCILIADO contra nuestras fuentes antes de publicar:
 *   · `cuentas` C14: empresa «EASO», asesor Erick, estado en_riesgo, cliente
 *     desde el 10 mar 2020, giro transporte y logística, 5,000–10,000
 *     empleados, pagos al corriente, 0 incidencias. 7 episodios de alerta
 *     abiertos. `score_adopcion` 2 y `score_relacional` 4 sobre 100.
 *   · Las TRES líneas del reporte coinciden una a una con `data/dids.json`:
 *     52 55 5015 0291 «Teléfono Monitoreo», 52 55 8854 6660 «Teléfono
 *     Operaciones» y 52 55 5899 8800 «Teléfono Operadora».
 *   · El GRC (corte GRF.xlsx, mes vivo Noviembre) la trae AAA con
 *     `movimiento = 'MRR estable'`, mrrIni = mrrFin = $13,021, 11 facturas,
 *     80 meses y $868,311 acumulados. `cuentas.facturacion` guarda $10,678:
 *     desalineada por $2,343. El institucional es el del GRC
 *     ([[grc-fuente-zoho]], [[feedback-fuente-unica-cuentas]]).
 *
 * VERIFICADO A MANO sobre los datos embebidos del reporte (`const D`):
 *   · La serie mensual CIERRA exacto: n = 155,406, perdidas = 15,928.
 *   · La serie por hora CIERRA exacto: n = 155,406, perdidas = 15,928.
 *   · La serie por día de la semana CIERRA exacto en las dos columnas.
 *   · Los tres incidentes se reconstruyen al dígito: 20 nov 11–16 h = 172 de
 *     223 (77.1%) y el día cierra en 199 de 517 = 38.49%; 30 jun 5–9 h = 163
 *     de 206 (79.1%).
 *   · La línea Operadora cierra en 15,019 llamadas y 9,753 abandonos de menú.
 *   · Los destinos muertos se confirman: Operaciones 3 (69/69) y Contabilidad
 *     y Finanzas (35/35) = 104 llamadas y cero contestadas; Operaciones 2
 *     317/488 = 64.96%; SAC Jesús Santos 37.0% y SAC Yetsi Pérez 33.7%.
 *   · Los minutos: 277,041 en once meses; septiembre es el mes cerrado más
 *     bajo con 23,412 (120.1% de 19,500) y enero el más alto con 28,995
 *     (148.7%). Todos los meses cerrados rebasan el plan.
 *
 * CUATRO MARCADOS aplicados al documento publicado, visibles dentro de él
 * (ver `scripts/publica-auditorias-2026-11-26.py`):
 *   1. El KPI de portada compara el 53.4% de Bitácora 1 de NOVIEMBRE contra el
 *      16.8% de enero, cuando el propio §Método dice que noviembre es mes en
 *      tránsito y «no se compara como mes cerrado». El dato cerrado es el
 *      59.4% de octubre.
 *   2. La tabla por destino suma 142,205 entrantes contra las 155,406 del
 *      encabezado, y no declara su universo. La diferencia (13,201) son casi
 *      todos los 13,129 abandonos de menú, que por definición no tienen
 *      destino — quedan 72 llamadas (0.05%) sin explicar. El universo se
 *      declara en el documento ([[feedback-tablas-deben-cerrar]]).
 *   3. «9,753 terminaron en el menú y sólo 4,548 llegaron a una persona» sobre
 *      15,019 llamadas deja 718 llamadas (4.8% de la línea) fuera de la frase:
 *      son las perdidas de esa línea. Se declaran.
 *   4. La tabla de evaluaciones suma 4,379 (4,059 positivas + 320 negativas)
 *      contra las 4,409 que declara el texto: faltan 30, y el 92.4% publicado
 *      es 92.7% sobre lo que la tabla enseña. Se declara el recorte.
 *   · Además: «contestadas» aparece como 126,331 en el bloque de encuesta,
 *     mientras la resta de las series cerradas da 126,349. Diferencia de 18
 *     sobre la misma cantidad; se declara en el documento.
 *
 * HUECO QUE NO SE PUEDE CERRAR DESDE NUESTRO LADO:
 *   El plan de 19,500 minutos del reporte sale de «13 extensiones × 1,500 min»
 *   ([[reglas-minutos-callpicker]]), y el conteo de 13 extensiones NO tiene
 *   respaldo en nuestras fuentes: `servicios_json` de C14 está VACÍO y
 *   `cuentas.servicio` dice «Visibilidad y Control» sin minutos. Toda la
 *   lectura de «120%–149% sobre plan» cuelga de ese denominador, y el propio
 *   reporte señala que la ficha de facturación da 161% con otra base. No se
 *   puede proponer un cambio de plan antes de conciliarlo
 *   ([[brecha-plan-consumo]], [[feedback-metricas-derivadas-origen]]).
 */
export const EASO: AuditoriaCase = {
  id: 'easo',
  asesor: 'Erick',
  nombre: 'EASO (Transportes EASO)',
  sector: 'Transporte y logística · centro de monitoreo 24/7 · 5,000–10,000 empleados',
  fecha_periodo: '1 ene – 31 oct 2026 (cerrado) · nov 1–26 en tránsito',
  fecha_auditoria: 'Nov 2026',
  tipo_cliente: 'Clasificación AAA · CID 31044 · C14 · MRR $13,021 (GRC, estable)',
  descripcion_contexto:
    '155,406 llamadas entrantes y 50,958 salientes en once meses · 3 líneas y 14 destinos · ' +
    'C14 · CID 31044 · Asesor: Erick · Cliente desde mar 2020 · 80 meses facturados · $868,311 acumulados',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Entrantes perdidas',        value: '10.2% · 15,928',          color: '#ef4444' },
    { label: 'Perdidas sin devolución',   value: '4,421 de 15,928',         color: '#dc2626' },
    { label: 'Bitácora 1 (oct, cerrado)', value: '59.4% · era 16.8% en ene', color: '#f59e0b' },
    { label: 'Pico vs capacidad',         value: '8 simultáneas de 13 ext',  color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'La plataforma tiene capacidad de sobra; el problema es de cobertura de puestos y de configuración. ' +
    'En once meses nunca hubo más de 8 llamadas activas al mismo tiempo sobre 13 extensiones, y la ' +
    'pérdida es MAYOR cuando hay poca carga (12.3%) que cuando hay mucha (3.5%). Eso descarta saturación ' +
    'y apunta a extensiones sin persona, softphones desconectados o reglas de ruteo que mandan llamadas a ' +
    'puestos vacíos.\n\n' +
    'Tres focos concentran el riesgo. Bitácora 1 se degradó durante el año: de 16.8% de pérdida en enero ' +
    'a 59.4% en octubre, mientras su volumen caía de 3,785 a 310 llamadas al mes — sigue recibiendo ' +
    'llamadas y casi nadie las contesta; en la semana del 23 de noviembre perdió 47 de 49. Bitácora 5 ' +
    'pierde entre 30% y 58% en el turno vespertino. Y la línea Operadora, por donde entran proveedores, ' +
    'candidatos y clientes, deja el 64.9% de sus llamadas en el menú: 9,753 de 15,019. Entre 9 y 17 h, ' +
    'con oficina abierta, el abandono sigue entre 57% y 68%.\n\n' +
    'A eso se suman tres incidentes de varias horas con más del 75% de pérdida: el 30 de junio (163 de ' +
    '206 entre 5 y 9 h), la ráfaga del 19 de noviembre a las 2 h (74 llamadas donde lo normal son ~10, ' +
    '59 perdidas) y el 20 de noviembre (172 de 223 entre 11 y 16 h, el peor día del año con 38.5%). El ' +
    'del 20 de noviembre afectó a todas las bitácoras a la vez y NO tiene ticket en Zoho Desk.\n\n' +
    'Para un centro de monitoreo de transporte, una llamada perdida no es una métrica de servicio: puede ' +
    'ser un reporte de ruta o una emergencia que no llegó. 4,421 de las 15,928 perdidas quedaron sin ' +
    'devolución, y donde sí se devolvió la mediana de espera fue de 3 h 37 min. Ése es el argumento de ' +
    'negocio para corregirlo ahora, antes de la renovación.',

  resultado_positivo:
    'El modelo funciona cuando el puesto está cubierto, y eso lo demuestra la propia cuenta: Bitácoras 2, ' +
    '3 y 4 sostienen entre 5% y 11% de pérdida todo el año sobre más de 110,000 llamadas entre las tres. ' +
    'No hay que rediseñar nada — hay que cubrir los dos puestos que se quedaron solos.\n\n' +
    'La devolución existe y funciona: 72.2% de las perdidas quedó con devolución exitosa y el 90.5% de ' +
    'los casos tuvo contacto en 24 horas, por devolución o porque el llamante volvió a marcar. Donde hay ' +
    'encuesta, el 92.4% de las evaluaciones es positiva. Y es una cuenta intensiva y crítica: 155 mil ' +
    'entrantes en once meses, operando 24/7, con seis años de pagos al corriente y consumo por encima del ' +
    'plan todos los meses cerrados.',

  hallazgos: [
    'No es saturación: el pico anual fue de 8 llamadas simultáneas en 13 extensiones, y se pierde MÁS con poca carga (12.3%) que con mucha (3.5%). Son puestos sin persona, no capacidad.',
    'Bitácora 1 pasó de 16.8% a 59.4% de pérdida mientras su volumen caía de 3,785 a 310 llamadas: sigue recibiendo y casi nadie contesta. La semana del 23 nov perdió 47 de 49.',
    'El 20 de noviembre se perdieron 172 de 223 llamadas entre 11 y 16 h (77%), en todas las bitácoras a la vez, y NO hay ticket de ese día. Es el peor día del año: 38.5%.',
    'Para un centro de monitoreo de transporte, una perdida puede ser un reporte de ruta o una emergencia. 4,421 de las 15,928 perdidas quedaron sin devolución.',
    'Bitácora 5 pierde entre 30% y 58% en el turno vespertino, con los peores bloques a las 21 h (58.1%), las 20 h (46.1%) y las 22 h (45.5%). Es el segundo puesto descubierto, y su volumen también se desplomó: de 1,729 llamadas en enero a 304 en octubre.',
    'En la línea Operadora, dos de cada tres llamadas se quedan en el menú: 9,753 de 15,019 (64.9%). A las 8 h y de 18 a 20 h el abandono supera el 90%, igual que sábado (82%) y domingo (91%) —probable mensaje de fuera de horario— pero entre 9 y 17 h, con oficina abierta, sigue entre 57% y 68%. Por ahí entran proveedores, candidatos y clientes de EASO.',
    'Hay destinos configurados donde nadie contesta, y se verifican al dígito: Operaciones 3 (69 de 69) y Contabilidad y Finanzas (35 de 35) recibieron 104 llamadas y no contestaron ninguna; Operaciones 2 pierde el 65% (317 de 488); y los dos puestos de SAC de EASO pierden más de un tercio (37.0% y 33.7%).',
    'La corrección más barata del reporte: 4,174 llamadas salientes salieron sin número Callpicker asignado y NINGUNA conectó (4,098 perdidas y 76 sin estatus). Son el 26% de todas las salientes fallidas, se repiten todos los meses y salen desde las bitácoras 1 a 4 y desde «supervisor». Es un identificador de salida mal configurado por extensión.',
    'La devolución funciona pero tarde: de las perdidas cruzadas con la siguiente saliente al mismo número en 24 h, 7,395 tuvieron devolución con una mediana de espera de 3 h 37 min, y sólo 1,823 (25%) se devolvieron en menos de 30 minutos. 1,521 no tuvieron contacto alguno en 24 horas.',
    'La pérdida sube en tres momentos predecibles: la hora de la comida (13–14 h), el cambio de turno de la noche (21 h, con 843 perdidas sobre 5,035 llamadas) y los jueves, el peor día de la semana (2,945 perdidas de 25,038).',
    'Dos tickets de «Falla Server» (28 abr y 5 sep) muestran 17% y 16% de pérdida ese día, por encima de la base pero lejos de los tres incidentes grandes. Y hay cuatro tickets de «Ajuste en flujo» en 2026: la configuración de la cuenta se está moviendo sin que el efecto se mida.',
    'La encuesta casi no existe: sólo 4,409 de 126,331 llamadas contestadas (3.5%) tienen evaluación, y en el 61% de los casos el ejecutivo cuelga antes de pasarla. Sin voz del cliente medible no hay forma de sostener una conversación de calidad.',
    'El perfil de quien llama no es el de un cliente final: 448 números con 50 llamadas o más generan el 87% de las entrantes, los 100 más activos el 46%, y el más frecuente sumó 2,157 llamadas (≈6.5 al día). Eso parece operadores o unidades reportando a la bitácora. Si es así —hay que validarlo con EASO— cada llamada perdida es un punto de control sin registro.',
    'DENOMINADOR NO VERIFICABLE · el plan de 19,500 minutos sale de «13 extensiones × 1,500 min», y el conteo de 13 extensiones no tiene respaldo en nuestras fuentes: el campo de servicios de la cuenta está VACÍO y la ficha sólo dice «Visibilidad y Control», sin minutos. La lectura de «120%–149% sobre plan» cuelga de ahí, y la ficha de facturación da 161% con otra base. Hay que conciliarlo ANTES de proponer un cambio de plan.',
    'DIFERENCIA DE FICHA · el MRR institucional es $13,021 (GRC, marcado «MRR estable»). `cuentas.facturacion` guarda $10,678: desalineada por $2,343. La cifra que se usa con el cliente y con dirección es la del GRC.',
    'MARCADO en el documento · el KPI de portada compara el 53.4% de Bitácora 1 de NOVIEMBRE contra el 16.8% de enero, cuando el propio método del reporte dice que noviembre es mes en tránsito y no se compara como mes cerrado. El dato cerrado es el 59.4% de octubre, y es peor.',
    'MARCADO en el documento · la tabla por destino suma 142,205 entrantes contra las 155,406 del encabezado sin declarar su universo. La diferencia son casi todos los 13,129 abandonos de menú, que no tienen destino; quedan 72 llamadas sin explicar. Declarado.',
    'MARCADO en el documento · «9,753 en el menú y sólo 4,548 llegaron a una persona» sobre 15,019 llamadas deja 718 fuera de la frase: son las perdidas de esa línea. Y la tabla de evaluaciones suma 4,379 contra las 4,409 del texto. Declarados los dos recortes.',
    'RIESGO DE RELACIÓN · un solo contacto registrado (Director TI), `contactos_json` vacío, cero seguimientos y cero reuniones en seis años, con `score_relacional` en 4 y `score_adopcion` en 2 sobre 100. Cero de seis módulos activados. Con siete episodios de alerta abiertos, es una cuenta AAA de $13,021 sostenida por inercia.',
  ],

  cronologia: [
    { fecha: '10 mar 2020',  responsable: 'Operación',         evento: 'EASO inicia como cliente. Hoy: tres líneas (Monitoreo, Operaciones, Operadora), 14 destinos y un centro de monitoreo 24/7.', tipo: 'neutral' },
    { fecha: 'Ene 2026',     responsable: 'Operación cliente', evento: 'Mes de mayor volumen y mayor pérdida del año: 17,436 entrantes, 2,478 perdidas (14.2%) y 28,995 minutos (149% del plan). Bitácora 1 está en 16.8% con 3,785 llamadas.', tipo: 'neutral' },
    { fecha: '19 ene 2026',  responsable: '—',                 evento: 'Pico anual de simultaneidad: 8 llamadas activas a las 10:28 h, sobre 13 extensiones. Es la prueba de que la capacidad nunca fue el cuello de botella.', tipo: 'ok' },
    { fecha: '30 jun 2026',  responsable: 'Plataforma / red',  evento: 'Primer incidente: 163 de 206 llamadas perdidas entre 5 y 9 h (79%). Ese día hay un ticket «Ajuste en flujo» de prioridad media.', tipo: 'problema' },
    { fecha: 'Jun–oct 2026', responsable: 'Operación cliente', evento: 'Bitácora 1 se degrada mes a mes (33.4% en junio, 45.4% en septiembre, 59.4% en octubre) mientras su volumen cae a 310 llamadas. Bitácora 5 llega a 49.3% en octubre con 304 llamadas.', tipo: 'problema' },
    { fecha: '28 abr · 5 sep', responsable: 'Soporte',         evento: 'Dos tickets de «Falla Server». La pérdida del día sube a 17% y 16%: por encima de la base, lejos de los incidentes grandes.', tipo: 'neutral' },
    { fecha: '19 nov 2026',  responsable: '—',                 evento: 'Ráfaga atípica a las 2 h: entraron 74 llamadas (lo normal a esa hora son ~10) y se perdieron 59. Mismo día: ticket «Ajuste en flujo».', tipo: 'problema' },
    { fecha: '20 nov 2026',  responsable: 'Plataforma / red',  evento: 'Peor día del año: 199 de 517 perdidas (38.5%), con 172 de 223 entre 11 y 16 h (77%), en todas las bitácoras a la vez. NO hay ticket de ese día.', tipo: 'problema' },
    { fecha: 'Semana 23 nov', responsable: 'Operación cliente', evento: 'Bitácora 1 pierde 47 de 49 llamadas. El puesto sigue en el ruteo sin nadie detrás.', tipo: 'problema' },
    { fecha: '26 nov 2026',  responsable: 'SAC',               evento: 'Expediente dado de alta. Series mensual, horaria y semanal verificadas al dígito; cuatro recortes marcados dentro del documento; el denominador del plan declarado no verificable.', tipo: 'neutral' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'EASO (Transportes EASO)' },
    { label: 'Consecutivo · CID',   value: 'C14 · 31044' },
    { label: 'Asesor',              value: 'Erick' },
    { label: 'Clasificación GRC',   value: 'AAA · rango $10,001–$20,000 · 11 facturas · 80 meses · $868,311 acumulados · movimiento «MRR estable»' },
    { label: 'Giro',                value: 'Transporte y logística · centro de monitoreo 24/7 · mínimo confirmado 3 instalaciones en México' },
    { label: 'Tamaño',              value: 'Grande · 5,000–10,000 empleados' },
    { label: 'Cliente desde',       value: '10 de marzo de 2020 (6 años)' },
    { label: 'MRR institucional',   value: '$13,021 (GRC). `cuentas.facturacion` guarda $10,678: desalineada por $2,343.' },
    { label: 'Líneas',              value: '52 55 5015 0291 Monitoreo (89% de las entrantes) · 52 55 8854 6660 Operaciones · 52 55 5899 8800 Operadora' },
    { label: 'Plan contratado',     value: 'Visibilidad y Control. El reporte usa 19,500 min (13 ext × 1,500), pero el campo de servicios de la cuenta está VACÍO: el conteo de extensiones no está respaldado por nuestras fuentes.' },
    { label: 'Consumo medido',      value: '277,041 minutos en once meses · todos los meses cerrados rebasan el plan: 120% (sep) a 149% (ene)' },
    { label: 'Contacto',            value: 'Un solo contacto: Director TI. `contactos_json` VACÍO, y el campo de nombre trae nombre y correo mezclados.' },
    { label: 'Adopción',            value: '0 de 6 módulos en 6 años · `score_adopcion` 2 / 100 · sin Chat, sin IA de Voz, sin API, sin pago automático' },
    { label: 'Relación',            value: '0 seguimientos · 0 reuniones · `score_relacional` 4 / 100 · 7 episodios de alerta abiertos' },
    { label: 'Pagos',               value: 'Al corriente · 0 incidencias · 9 tickets en 2026 (3 de falla, 4 de «Ajuste en flujo»)' },
    { label: 'Alianza',             value: 'Opera de forma independiente (empresa familiar) con alianza estratégica con Hub Group para intermodal y logística transfronteriza.' },
  ],

  necesidad_negocio:
    'EASO no usa el teléfono para vender: lo usa para operar. Las bitácoras son el punto de control donde ' +
    'las unidades y los operadores reportan ruta, y la línea de Monitoreo concentra el 89% de las 155 mil ' +
    'llamadas del año. En ese negocio la llamada perdida no cuesta una venta: cuesta un registro de ' +
    'control que no existe, y en el peor caso una emergencia que no llegó. Por eso 15,928 perdidas con ' +
    '4,421 sin devolución alguna no es un indicador de servicio — es un riesgo operativo del cliente, y ' +
    'el único argumento que mueve a un Director de TI antes de una renovación.',

  potencial_corto: [
    'Explicar el incidente del 20 de noviembre y la ráfaga del 19: hoy el cliente vivió una falla de cinco horas sin ticket y puede atribuírnosla.',
    'Corregir el identificador de salida en las extensiones que marcan sin DID: 4,174 salientes con 0% de conexión. Es la corrección más barata del reporte.',
    'Sacar del ruteo o cubrir Bitácora 1 y el turno vespertino de Bitácora 5.',
    'Depurar los destinos muertos: Operaciones 3, Contabilidad y Finanzas, Operaciones 2.',
    'Conciliar el denominador del plan (19,500 contra la base de la ficha) antes de hablar de minutos con el cliente.',
  ],

  potencial_largo: [
    'IA de Voz para tomar reportes de ruta en horas valle y en los huecos de 13–14 h y 21 h, con captura estructurada para la bitácora.',
    'Integración API con su plataforma de rastreo o TMS: una llamada perdida de una unidad se convierte en alerta dentro de su sistema.',
    'Callpicker Chat / WhatsApp para reportes rutinarios, liberando la voz para emergencias.',
    'Rediseño del menú de Operadora y devolución automática en menos de 15 minutos.',
    'Ajuste de plan al consumo real (120%–149%) con valor agregado, no sólo más minutos.',
  ],

  tacticas: [
    {
      nombre: 'Entrar por el riesgo operativo, no por el indicador',
      descripcion: '«Una llamada perdida en su bitácora puede ser un reporte de ruta o una emergencia. Este año 4,421 se quedaron sin devolución.» Es el único marco en el que el 10.2% deja de ser una métrica de proveedor.',
      impacto: 'Convierte una conversación de servicio telefónico en una de control operativo, que es la que decide un Director de TI.',
    },
    {
      nombre: 'Cerrar el argumento de capacidad antes de que se abra',
      descripcion: 'El pico anual fueron 8 llamadas simultáneas sobre 13 extensiones, y se pierde más con poca carga que con mucha. Si el cliente cree que le faltan líneas, nada de lo demás se entiende.',
      impacto: 'Quita de la mesa un upgrade que el dato no sostiene y deja el foco en cobertura de puestos, que es del cliente.',
    },
    {
      nombre: 'Llevar el incidente del 20 de noviembre con los datos por hora',
      descripcion: 'Cinco horas con 77% de pérdida, en todas las bitácoras a la vez, y sin ticket. Llegar nosotros con la hora exacta y la pregunta «¿lo detectaron?» es lo contrario a que el cliente nos lo reclame en la renovación.',
      impacto: 'Recupera iniciativa en una cuenta con score relacional de 4 sobre 100 y siete alertas abiertas.',
    },
    {
      nombre: 'Usar la comparación interna entre bitácoras',
      descripcion: 'Bitácoras 2, 3 y 4 sostienen 5%–11% todo el año sobre más de 110 mil llamadas. Bitácora 1 está en 59.4%. Misma plataforma, mismo ruteo, misma empresa.',
      impacto: 'Demuestra que el problema es de cobertura y no de herramienta, sin tener que decirlo.',
    },
    {
      nombre: 'No tocar el tema del plan hasta conciliar el denominador',
      descripcion: 'El 120%–149% sobre plan sale de un conteo de 13 extensiones que no está en nuestras fuentes, y la ficha da 161% con otra base. Dos cifras del mismo exceso destruyen la credibilidad del reporte completo.',
      impacto: 'Protege la conversación de valor. Un excedente mal sustentado se percibe como costo, no como valor.',
    },
  ],

  senal_alarma:
    'Una cuenta AAA de $13,021 al mes con seis años de antigüedad, cero módulos activados, cero reuniones ' +
    'registradas, un solo contacto y siete episodios de alerta abiertos. El costo de salida es bajo justo ' +
    'cuando cualquier competidor puede llegar con una oferta de IA de Voz. Y hay un incidente de cinco ' +
    'horas que el cliente vivió sin que nadie de nuestro lado lo registrara: si lo recuerda en la ' +
    'renovación, lo recordará como falla de Callpicker.',

  problema_raiz:
    'Dos puestos de bitácora se quedaron sin persona durante el año y siguen recibiendo llamadas, mientras ' +
    'nadie del lado de Callpicker estaba mirando una cuenta de $13,021 con cero reuniones en seis años.',

  problema_raiz_detalle:
    'El diagnóstico técnico es inusualmente limpio porque los datos lo permiten. La capacidad está ' +
    'descartada por dos vías independientes: el pico anual de simultaneidad (8 sobre 13 extensiones) y la ' +
    'relación invertida entre carga y pérdida (12.3% con poca carga contra 3.5% con mucha). Lo que queda ' +
    'son puestos sin persona, y se identifican uno por uno: Bitácora 1, que pasó de 16.8% a 59.4% mientras ' +
    'su volumen se desplomaba de 3,785 a 310 llamadas; Bitácora 5 en el turno vespertino; y cuatro ' +
    'destinos de la línea Operadora donde nadie contesta —dos de ellos con cero contestadas en 104 ' +
    'llamadas—. Que Bitácoras 2, 3 y 4 sostengan 5%–11% todo el año sobre más de 110 mil llamadas prueba ' +
    'que el modelo funciona cuando el puesto está cubierto.\n\n' +
    'Encima de eso hay tres cosas de configuración que no son del cliente: el menú de Operadora, que ' +
    'retiene el 64.9% de las llamadas y sigue entre 57% y 68% con la oficina abierta; los 4,174 salientes ' +
    'que salen sin número de identificación y por eso no conectan ninguna, repitiéndose todos los meses; y ' +
    'cuatro tickets de «Ajuste en flujo» en el año, que indican que la configuración se mueve sin que ' +
    'nadie mida el efecto.\n\n' +
    'Y hay una capa nuestra que explica por qué llegamos tarde: seis años, cero reuniones, cero ' +
    'seguimientos, un solo contacto —el Director de TI— y el campo de contactos de la ficha vacío. Un ' +
    'incidente de cinco horas pasó sin ticket. No es que el dato no estuviera: es que nadie lo estaba ' +
    'mirando.',

  flujo_real: [
    { fase: '1. Entra la llamada',          area: '3 líneas · 14 destinos',   accion: 'Monitoreo concentra el 89% de las 155,406 entrantes',          resultado: 'Volumen estable entre 12,911 y 17,436 al mes, 24/7, sin caída de demanda.' },
    { fase: '2. Reparte a cinco bitácoras', area: 'Teléfono Monitoreo',       accion: 'Ruteo a Bitácoras 1 a 5',                                      resultado: 'B2, B3 y B4 sostienen 5%–11%. B1 llega a 59.4% y B5 a 49.3%: los dos puestos se quedaron solos.' },
    { fase: '3. El menú retiene',            area: 'Línea Operadora',          accion: 'Menú sin revisar, con mensaje de fuera de horario',             resultado: '9,753 de 15,019 llamadas no pasan del menú (64.9%). Entre 9 y 17 h sigue en 57%–68%.' },
    { fase: '4. Destinos vacíos',            area: 'Operadora / Operaciones',  accion: 'Operaciones 3, Contabilidad y Finanzas, Operaciones 2 en ruteo', resultado: '104 llamadas con CERO contestadas en los dos primeros; 65% de pérdida en el tercero.' },
    { fase: '5. Los huecos de turno',        area: 'Operación cliente',        accion: 'Comida (13–14 h), cambio de turno nocturno (21 h) y jueves',    resultado: '1,323 perdidas a las 13 h, 843 a las 21 h, 2,945 el jueves. Son huecos predecibles, no aleatorios.' },
    { fase: '6. Los incidentes',             area: 'Plataforma / red',          accion: 'Tres eventos de varias horas con >75% de pérdida',              resultado: '20 nov (172 de 223, sin ticket), 30 jun (163 de 206), 19 nov 2 h (59 de 74).' },
    { fase: '7. La devolución llega tarde',  area: 'Operación cliente',        accion: 'Devolución manual, sin regla ni cola de rellamada',             resultado: '72.2% devueltas, mediana de 3 h 37 min, sólo 25% en menos de 30 min. 4,421 sin devolución y 1,521 sin contacto en 24 h.' },
    { fase: '8. Las salientes no salen',     area: 'Configuración',            accion: 'Extensiones marcando sin número Callpicker asignado',           resultado: '4,174 salientes, 0 conectadas. 26% de todas las salientes fallidas, todos los meses.' },
  ],

  comparativo: [
    { metrica: 'Pérdida de entrantes',                real: '10.2% (15,928 de 155,406)',  ideal: '≤ 5% cubriendo los dos puestos descubiertos' },
    { metrica: 'Pérdida de Bitácora 1',               real: '59.4% en octubre (16.8% en enero)', ideal: '≤ 12%, o el puesto fuera del ruteo' },
    { metrica: 'Pérdida de Bitácora 5 (vespertino)',  real: '30%–58% por hora',           ideal: '≤ 12% en todo el turno' },
    { metrica: 'Abandono en el menú de Operadora',    real: '64.9% · 57%–68% en horario hábil', ideal: '≤ 35% en horario hábil' },
    { metrica: 'Destinos con 0% de contestadas',      real: '2 (Operaciones 3, Contabilidad y Finanzas)', ideal: '0' },
    { metrica: 'Mediana de devolución',               real: '3 h 37 min · 25% en < 30 min', ideal: '≤ 15 min' },
    { metrica: 'Perdidas sin devolución',             real: '4,421 · 1,521 sin contacto en 24 h', ideal: '0 sin contacto en 24 h' },
    { metrica: 'Salientes sin número de salida',      real: '4,174 · 0 conectadas',        ideal: '0' },
    { metrica: 'Cobertura de encuesta',               real: '3.5% de las contestadas',     ideal: '≥ 30%' },
    { metrica: 'Módulos activados',                   real: '0 de 6 en 6 años',            ideal: '1 en piloto antes de la renovación' },
  ],

  plan_inmediato: [
    { accion: 'Explicar el incidente del 20 nov (11–16 h, 77% de pérdida, todas las bitácoras) y la ráfaga del 19 nov a las 2 h. Hoy no hay ticket de ese día.', responsable: 'SAC + Soporte',          criterio: 'Causa documentada y ticket abierto. Llamada al Director de TI con los datos por hora.' },
    { accion: 'Corregir el número de salida en las extensiones que marcan sin DID: 4,174 salientes con 0% de conexión, desde las bitácoras 1 a 4 y «supervisor».',  responsable: 'Soporte',                criterio: '0 salientes sin número asignado en el siguiente corte.' },
    { accion: 'Sacar del ruteo o cubrir Bitácora 1 y el turno vespertino de Bitácora 5, con sesión de operación: quién ocupa cada puesto y en qué horario.',        responsable: 'Erick (KAM) con el cliente', criterio: 'Pérdida de B1 y B5 por debajo del 12%.' },
    { accion: 'Depurar los destinos muertos (Operaciones 3, Contabilidad y Finanzas, Operaciones 2) confirmando extensión y responsable de cada uno.',               responsable: 'Erick + Soporte',        criterio: '0 destinos con 0% de contestadas.' },
    { accion: 'Conciliar el denominador del plan: el reporte usa 19,500 min (13 ext × 1,500) y el campo de servicios de la cuenta está vacío; la ficha da 161% con otra base.', responsable: 'SAC + Facturación',      criterio: 'Un solo número de minutos incluidos, con su fuente, antes de hablar de plan con el cliente.' },
  ],

  plan_mediano: [
    { accion: 'Rediseñar el menú de Operadora y medirlo por opción.',                                       responsable: 'SAC + cliente',       criterio: 'Abandono en horario hábil por debajo del 35%.' },
    { accion: 'Devolución en menos de 15 minutos para las perdidas: regla de devolución o cola de rellamada.', responsable: 'Cliente, con guía SAC', criterio: 'Mediana de devolución por debajo de 15 min y cero perdidas sin contacto en 24 h.' },
    { accion: 'Cubrir los tres huecos predecibles: comida (13–14 h), cambio de turno nocturno (21 h) y jueves.', responsable: 'Erick con el cliente', criterio: 'Pérdida de esas franjas alineada con la del resto del día.' },
    { accion: 'Encuesta al final de llamada sin que el ejecutivo pueda colgar antes.',                        responsable: 'Soporte',             criterio: 'Cobertura de evaluación por encima del 30%.' },
    { accion: 'Validar con EASO quién llama a Teléfono Monitoreo y qué se registra en cada bitácora.',        responsable: 'Erick',               criterio: 'Respuesta registrada en la cuenta. Si son reportes de ruta, el riesgo se eleva a dirección.' },
  ],

  plan_estrategico: [
    { accion: 'Mapa de decisores antes de la renovación: hoy hay un solo contacto y el campo de contactos está vacío.', responsable: 'Erick (KAM)', criterio: '3 o más contactos registrados, incluidos operación y presupuesto.' },
    { accion: 'IA de Voz para tomar reportes de ruta en horas valle y en los huecos de 13–14 h y 21 h, con captura estructurada para la bitácora.', responsable: 'Erick + Comercial', criterio: 'Un módulo en piloto antes de la renovación.' },
    { accion: 'Integración API con su plataforma de rastreo o TMS: llamada perdida de una unidad = alerta en su sistema.', responsable: 'Comercial + Ingeniería', criterio: 'Propuesta técnica entregada y decisión del cliente documentada.' },
    { accion: 'Ajuste de plan al consumo real (120%–149%) con valor agregado, no sólo más minutos — después de conciliar el denominador.', responsable: 'Erick + Facturación', criterio: 'Propuesta con una sola base de minutos y el excedente explicado como valor.' },
  ],

  areas_oportunidad: [
    { area: 'Cobertura de Bitácora 1 y Bitácora 5',  impacto: '59.4% y 49.3% de pérdida en octubre, con volumen desplomado: puestos en ruteo sin nadie detrás', responsable: 'Erick + cliente' },
    { area: 'Menú de la línea Operadora',             impacto: '9,753 de 15,019 llamadas no pasan del menú; 57%–68% incluso con oficina abierta',                responsable: 'SAC + cliente' },
    { area: 'Destinos muertos',                       impacto: '104 llamadas con cero contestadas y un destino al 65% de pérdida',                               responsable: 'Erick + Soporte' },
    { area: 'Identificador de salida',                impacto: '4,174 salientes con 0% de conexión, todos los meses: la corrección más barata del reporte',       responsable: 'Soporte' },
    { area: 'Velocidad de devolución',                impacto: 'Mediana de 3 h 37 min y 4,421 perdidas sin devolución, en un centro de monitoreo',               responsable: 'Cliente + SAC' },
    { area: 'El incidente sin ticket del 20 nov',     impacto: 'Cinco horas al 77% de pérdida que el cliente puede atribuir a Callpicker en la renovación',       responsable: 'SAC + Soporte' },
    { area: 'Denominador del plan',                   impacto: '19,500 contra 161% de la ficha: dos cifras del mismo exceso en una cuenta de $13,021',           responsable: 'SAC + Facturación' },
    { area: 'Relación y decisores',                   impacto: 'Un contacto, 0 reuniones y 0 módulos en 6 años, con 7 alertas abiertas',                          responsable: 'Erick' },
  ],

  perfiles: [
    {
      nombre: 'Director de TI',
      rol: 'El único contacto registrado',
      color: '#6366f1',
      campos: [
        { label: 'Lo que hay en la ficha', value: 'Un nombre y un correo mezclados en el mismo campo, y `contactos_json` vacío. Es el único interlocutor en seis años.' },
        { label: 'Qué le mueve',           value: 'No el 10.2%: el riesgo operativo. Una llamada perdida en la bitácora puede ser un reporte de ruta sin registro.' },
        { label: 'Riesgo',                 value: 'Decide sobre la herramienta, pero no necesariamente sobre el presupuesto. Hay que pedirle a los responsables de operación y de presupuesto antes de la renovación.' },
      ],
    },
    {
      nombre: 'Bitácora 1',
      rol: 'El puesto que se quedó solo',
      color: '#ef4444',
      campos: [
        { label: 'Degradación',  value: '16.8% de pérdida en enero → 33.4% en junio → 45.4% en septiembre → 59.4% en octubre' },
        { label: 'Volumen',      value: 'De 3,785 llamadas en enero a 310 en octubre. El ruteo sigue mandándole llamadas.' },
        { label: 'Lo más reciente', value: 'En la semana del 23 de noviembre perdió 47 de 49 llamadas.' },
        { label: 'Por hora',     value: 'Entre 20% y 34% de pérdida en todo el horario diurno: no es un hueco, es ausencia sostenida.' },
      ],
    },
    {
      nombre: 'Bitácoras 2, 3 y 4',
      rol: 'La prueba de que el modelo funciona',
      color: '#22c55e',
      campos: [
        { label: 'Volumen',   value: 'Más de 110,000 llamadas entre las tres en once meses' },
        { label: 'Pérdida',   value: 'Entre 5% y 11% sostenido todo el año' },
        { label: 'Para qué sirve', value: 'Misma plataforma, mismo ruteo, misma empresa. Demuestra que la pérdida de B1 y B5 es cobertura, no herramienta — y que no hay que rediseñar nada.' },
      ],
    },
    {
      nombre: 'Línea Operadora · 52 55 5899 8800',
      rol: 'La puerta por la que entra todo lo demás',
      color: '#f59e0b',
      campos: [
        { label: 'Volumen',  value: '15,019 llamadas en once meses' },
        { label: 'Abandono', value: '9,753 terminaron en el menú (64.9%). A las 8 h y de 18 a 20 h supera el 90%; sábado 82% y domingo 91%.' },
        { label: 'Lo grave', value: 'Entre 9 y 17 h, con oficina abierta, el abandono sigue entre 57% y 68%. No es horario: es el menú.' },
        { label: 'Quién entra', value: 'Proveedores, candidatos y clientes de EASO: Recepción, Recursos Humanos, Fiscal, SAC.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Uso intensivo y crítico: 155 mil entrantes en once meses, 24/7, en una operación de monitoreo.',
      'Bitácoras 2, 3 y 4 sostienen 5%–11% de pérdida todo el año: el modelo funciona cuando el puesto está cubierto.',
      '72.2% de devolución exitosa y 90.5% de contacto recuperado en 24 horas.',
      '92.4% de evaluaciones positivas donde hay encuesta.',
      '6 años como cliente, pagos al corriente, 0 incidencias de pago y consumo sobre plan todos los meses cerrados.',
      'Clasificación AAA con $868,311 acumulados en 80 meses y movimiento «MRR estable» en el GRC.',
      'La capacidad no es un problema: pico de 8 simultáneas sobre 13 extensiones.',
    ],
    oportunidades: [
      'IA de Voz para tomar reportes de ruta en horas valle y en los huecos de 13–14 h y 21 h, con captura estructurada para la bitácora.',
      'Integración API con su plataforma de rastreo o TMS: llamada perdida de una unidad = alerta en su sistema.',
      'Callpicker Chat / WhatsApp para reportes rutinarios, liberando la voz para emergencias.',
      'Rediseño del menú de Operadora y devolución automática en menos de 15 minutos.',
      'Ajuste de plan al consumo real (120%–149%) con valor agregado, una vez conciliado el denominador.',
      'Depuración de destinos y cobertura de puestos: mejora medible sin que el cliente compre nada.',
    ],
    debilidades: [
      'Bitácora 1 (59.4% en octubre) y Bitácora 5 (30%–58% en el vespertino) reciben llamadas sin cobertura.',
      'Destinos sin respuesta: Operaciones 3 y Contabilidad y Finanzas con cero contestadas; Operaciones 2 al 65%.',
      '64.9% de abandono en el menú de la línea Operadora, y 57%–68% incluso en horario hábil.',
      '4,174 salientes sin número de salida, 100% fallidas, repitiéndose todos los meses.',
      'Devolución lenta: mediana de 3 h 37 min y sólo 25% en menos de 30 minutos.',
      'Encuesta casi inexistente (3.5%): no hay voz del cliente medible.',
      'Tres huecos predecibles sin cubrir: comida, cambio de turno nocturno y jueves.',
    ],
    amenazas: [
      'Un incidente de cinco horas (20 nov) sin ticket: el cliente puede vivir la falla sin decírnoslo y atribuirla a Callpicker.',
      'Relación de un solo contacto (Director de TI), sin seguimientos ni reuniones en seis años y con el campo de contactos vacío.',
      '0 de 6 módulos activados en 6 años: costo de salida bajo frente a un competidor con oferta de IA.',
      '9 tickets en 2026, 3 de falla y 4 de «Ajuste en flujo»: la configuración se mueve sin que nadie mida el efecto.',
      'Si el consumo sobre plan se cobra como excedente sin explicarse, se percibe como costo y no como valor.',
      'El denominador del plan no está conciliado: dos cifras del mismo exceso (120%–149% y 161%) restan credibilidad a todo el reporte.',
      'Siete episodios de alerta abiertos en una cuenta AAA de $13,021: si se pierde, se pierde el 0.64% del MRR institucional de un golpe.',
    ],
  },

  conclusion:
    'EASO es una cuenta que funciona y a la que nadie estaba mirando. Los datos son inusualmente limpios ' +
    'y el diagnóstico es cerrado: la capacidad está descartada por dos vías independientes, y lo que queda ' +
    'son dos puestos de bitácora que se quedaron sin persona durante el año, cuatro destinos donde nadie ' +
    'contesta, un menú que retiene dos de cada tres llamadas y 4,174 salientes que no pueden conectar por ' +
    'un identificador mal configurado. Que Bitácoras 2, 3 y 4 sostengan 5%–11% sobre más de 110 mil ' +
    'llamadas prueba que no hay nada que rediseñar: hay que cubrir y depurar.\n\n' +
    'Lo que convierte esto en un asunto de negocio y no de soporte es qué es una llamada perdida aquí. En ' +
    'un centro de monitoreo de transporte puede ser un reporte de ruta o una emergencia, y 4,421 se ' +
    'quedaron sin devolución. Si los 448 números recurrentes que generan el 87% del tráfico son unidades ' +
    'reportando —hay que preguntárselo a EASO—, cada perdida es un punto de control sin registro.\n\n' +
    'Y hay dos cosas que no son del cliente. Una: un incidente de cinco horas con 77% de pérdida el 20 de ' +
    'noviembre, que no tiene ticket. Si el cliente lo recuerda en la renovación, lo recordará como falla ' +
    'nuestra. Dos: no se puede sostener una conversación de plan mientras existan dos cifras del mismo ' +
    'exceso —120%–149% del reporte contra 161% de la ficha— y el conteo de extensiones que sostiene el ' +
    'denominador no esté en ninguna fuente nuestra. Eso se concilia antes, no después.',

  pierde: [
    '$13,021 de MRR institucional en una cuenta AAA con 80 meses y $868,311 acumulados — el 0.64% del MRR de la casa.',
    'La única cuenta de la cartera con un centro de monitoreo 24/7 auditado: 155 mil llamadas de referencia operativa.',
    'El caso de uso más fuerte para IA de Voz con captura estructurada que existe hoy en la cartera.',
    'La puerta a Hub Group, con quien EASO mantiene alianza estratégica para intermodal y transfronterizo.',
  ],

  gana: [
    'Un caso de cobertura de puestos replicable en toda la cartera con operación por turnos.',
    'Una integración API con plataforma de rastreo o TMS que no existe hoy en ninguna cuenta.',
    'Tres contactos y un mapa de decisores en una cuenta que lleva seis años con uno solo.',
    'Un piloto de IA de Voz dimensionado con huecos de turno reales (13–14 h y 21 h), no con una estimación.',
  ],

  recomendacion_central:
    'Llegar con el incidente del 20 de noviembre antes de que el cliente lo traiga: cinco horas al 77% de ' +
    'pérdida, en todas las bitácoras, sin ticket. En la misma sesión cerrar el argumento de capacidad ' +
    '—8 simultáneas sobre 13 extensiones, y más pérdida con poca carga que con mucha— y poner la ' +
    'comparación interna: Bitácoras 2, 3 y 4 al 5%–11% contra Bitácora 1 al 59.4%. Pedir dos cosas que ' +
    'sólo EASO puede dar: quién ocupa cada puesto y por turno, y qué se registra en cada bitácora. Mientras ' +
    'eso ocurre, Soporte corrige el identificador de salida de las 4,174 salientes, que es gratis y se ' +
    'nota. Y no abrir la conversación de plan hasta que haya una sola cifra de minutos incluidos con su ' +
    'fuente: hoy el 120%–149% y el 161% de la ficha no pueden ser los dos ciertos.',

  documentos: [
    {
      nombre: 'Auditoría de llamadas · EASO · 2026',
      ruta: '/auditorias/Auditoria-EASO-2026.html',
      descripcion:
        'Reporte interactivo del CID 31044 sobre 155,406 entrantes y 50,958 salientes, 1 ene – 26 nov 2026 ' +
        'con análisis cerrado a octubre: pérdida semanal y por puesto, mapa de calor por día y hora, la ' +
        'prueba de que no es saturación, los tres incidentes reconstruidos hora por hora, la línea ' +
        'Operadora, destinos sin respuesta, devolución, salientes sin número de salida, encuesta, perfil de ' +
        'llamantes, minutos contra plan, FODA y plan de acción. Publicado con cuatro recortes declarados ' +
        'dentro del documento (el KPI de portada que usa el mes en tránsito, el universo de la tabla por ' +
        'destino, las 718 llamadas de la línea Operadora y las 30 evaluaciones de la tabla de calificación) ' +
        'y con el denominador del plan de 19,500 minutos declarado NO verificable contra nuestras fuentes.',
    },
  ],
}
