import type { AuditoriaCase } from './types'

/**
 * Sellomatic Impresores · D27 · CID 43584 · Dan
 *
 * Alta del 26 nov 2026, a partir del reporte entregado
 * «Auditoría de llamadas · Sellomatic Impresores · CID 43584».
 *
 * CONCILIADO contra nuestras fuentes antes de publicar:
 *   · `cuentas` D27: empresa «Sellomatic Impresores», asesor Dan, estado
 *     en_riesgo, cliente desde el 24 jun 2020, 2 oficinas, giro servicios de
 *     impresión, pagos al corriente, 0 tickets abiertos. Los tres contactos
 *     del reporte (Minerva Ochoa, Jorge Anaya, Karina Zavala) coinciden uno a
 *     uno con `contactos_json`, y la observación del KAM del 10 nov 2026
 *     confirma la vía por la que apareció Karina.
 *   · `servicios_json` confirma la lectura del reporte sobre extensiones:
 *     plan Visibilidad y Control 3,400 min ($4,039) + Extensión VyC con SIM
 *     ($337 × 6 = $2,022) + Complemento de datos móviles ($212 × 6 = $1,272).
 *     Son SEIS extensiones con SIM y SEIS complementos, y el archivo de
 *     llamadas sólo enseña DOS personas atendiendo. La suma de los tres
 *     conceptos da $7,333, EXACTAMENTE el `mrrIni` del GRC — lo que valida la
 *     ficha de servicios y deja a `cuentas.facturacion` ($7,264) desalineada
 *     por $69 ([[feedback-fuente-unica-cuentas]]).
 *   · El DID de la cuenta en `data/dids.json` es 52 55 5578 2805, el mismo que
 *     la ficha guarda como teléfono de la apoderada legal: la observación del
 *     reporte («llamar a la titular es llamar al conmutador») queda verificada.
 *   · Las cifras del reporte cierran contra su propio universo: 9,922 entrantes
 *     + 610 salientes = 10,532, el total que declara su §10. Recuperación
 *     consistente (22.7% en 24 h ≤ 34.4% recuperado alguna vez). Plan:
 *     2,259 / 3,400 = 66.4%; pico de abril 2,556 = 75.2%.
 *
 * LO MÁS GRAVE, y el reporte no lo trae porque no mira el GRC:
 *   El GRC (corte GRF.xlsx, mes vivo Noviembre) trae la cuenta como
 *   clasificación AAA con `movimiento = 'Churn confirmado'`, `mrrFin = 0.0` y
 *   `perdida = 7333.0`, sobre 10 facturas y 76 meses ($552,400 acumulados).
 *   Y al mismo tiempo `verificacion = 'sigue_viva'`, verificada por cartera.
 *   La cuenta paga al corriente, usa el 66% de su plan y tuvo contacto el
 *   26 nov 2026. Una señal de churn en el GRC NO es autorización de baja
 *   ([[feedback-conciliacion-churn]], [[regla-churn-mes-vencido]]): se declara
 *   y se sube a dirección. No se toca el estado de la cuenta desde aquí.
 *
 * CORRECCIONES marcadas dentro del documento publicado
 * (ver `scripts/publica-auditorias-2026-11-26.py`):
 *   · El veredicto dice que el número 9032 «genera el 61% de las "sin
 *     contestar"», pero el §10 define «sin atender» como perdida + abandono en
 *     menú, y el dato medido es 60.8% de las PERDIDAS (59.0% de los abandonos).
 *     Un combinado caería entre las dos cifras, no en 60.8%.
 *   · El guion para el cliente dice «una llamada de regreso el mismo día»; lo
 *     medido es «en ≤ 24 h», que no es lo mismo. Se corrige la palabra.
 */
export const SELLOMATIC: AuditoriaCase = {
  id: 'sellomatic',
  asesor: 'Dan',
  nombre: 'Sellomatic Impresores',
  sector: 'Servicios de impresión y sellos · 2 oficinas · empresa familiar',
  fecha_periodo: '1 ene – 31 oct 2026 (cerrado) · nov 1–26 en tránsito',
  fecha_auditoria: 'Nov 2026',
  tipo_cliente: 'Clasificación AAA · CID 43584 · D27 · MRR $7,333 (GRC, marcado «Churn confirmado»)',
  descripcion_contexto:
    '10,532 llamadas (9,922 entrantes + 610 salientes) · un número concentra 20.6% del tráfico · ' +
    'D27 · CID 43584 · Asesor: Dan · Cliente desde jun 2020 · Plan Visibilidad y Control 3,400 min',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Atención en demanda real', value: '90.7% en horario',        color: '#22c55e' },
    { label: 'Intentos no recuperados',  value: '65.6% · 2 de cada 3',     color: '#ef4444' },
    { label: 'Un solo número',           value: '20.6% del tráfico',       color: '#f59e0b' },
    { label: 'Uso del plan',             value: '66% · 2,259 de 3,400 min', color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'La operación de Sellomatic está mejor de lo que dice su propio tablero, y la cuenta tiene dos ' +
    'problemas que nadie estaba mirando: uno operativo del cliente y uno institucional nuestro.\n\n' +
    'Lo primero que hay que separar es el ruido. Un único número, el 55 5530 9032, llamó 1,918 veces en ' +
    '252 días distintos entre el 15 de enero y el 29 de octubre: el 20.6% de todas las entrantes, el ' +
    '60.8% de las perdidas y el 59.0% de los abandonos en menú. Con ese número dentro, los indicadores ' +
    'de la cuenta no describen a sus clientes. Fuera de él y dentro del horario en que la empresa ' +
    'realmente contesta, Sellomatic atiende 9 de cada 10 llamadas (90.7%). La capacidad no es el ' +
    'problema: el bloque de mayor volumen, de 10 a 13 h, se atiende bien.\n\n' +
    'La fuga real es la recuperación. El 65.6% de quienes no logran comunicarse nunca vuelve a ser ' +
    'atendido, y cuando sí lo son es casi siempre porque el cliente volvió a llamar: Sellomatic devolvió ' +
    '14 llamadas en todo el año, el 1.4%. Hay 461 números, de 3,324 distintos, que llamaron y nunca ' +
    'hablaron con nadie. Para una imprenta con base recurrente —93 números con 10 o más llamadas en el ' +
    'año— cada uno es una cotización o un pedido en riesgo.\n\n' +
    'Y lo institucional, que el reporte no trae porque no mira el GRC: la cuenta aparece ahí como ' +
    '«Churn confirmado» con MRR final en $0 y una pérdida de $7,333, al mismo tiempo que paga al ' +
    'corriente, consume el 66% de su plan y tuvo contacto el 26 de noviembre. El propio GRC la marca ' +
    'como `sigue_viva`, verificada por cartera. Eso es una contradicción de fuente, no una baja: hay que ' +
    'resolverla con dirección antes de que un corte la arrastre.',

  resultado_positivo:
    'Seis años de relación, pagos al corriente, un solo ticket administrativo en todo ese tiempo y cero ' +
    'fricción con la plataforma. El volumen es estable (~740 llamadas reales al mes, ~31 por día hábil) ' +
    'con base recurrente de clientes, el pico de 10–13 h se cubre bien y el 86.8% de las evaluaciones es ' +
    'positiva cuando se mide.\n\n' +
    'Y el hallazgo más útil para la conversación: el 90.7% de atención en la demanda real desmiente la ' +
    'lectura automática de la ficha. Esta cuenta no es un caso de bajo uso ni de costo de salida bajo — ' +
    'es una cuenta sana que estaba siendo leída con el dato equivocado.',

  hallazgos: [
    'Un solo número (55 5530 9032) llamó 1,918 veces en 252 días: 20.6% de las entrantes y 60.8% de las perdidas. Sin él y dentro de horario, Sellomatic atiende 9 de cada 10 llamadas.',
    'La fuga real: 65.6% de quienes no logran comunicarse nunca vuelven a ser atendidos. La empresa devolvió 14 llamadas en todo el año (1.4%) y 461 números nunca hablaron con nadie.',
    'El GRC la marca «Churn confirmado» con MRR final $0 y pérdida de $7,333, mientras paga al corriente y usa el 66% del plan. Se resuelve con dirección; NO es autorización de baja.',
    'La ficha dice consumo 0 de 3,400 minutos; el archivo dice 2,259 al mes (66%). La columna guardada llamadas_atendidas_pct está en 0.0: es dato viejo, no una medición.',
    'La lectura automática de la cuenta tiene cinco afirmaciones que el detalle de llamadas desmiente, y cada una llevaría a una conversación equivocada con el cliente: «consumo 0% / capacidad ociosa 100%» contra 66% real; «peor día sábado con 26% sin contestar» contra 3.2% de perdidas en su horario; «a las 19 h se cae 68%» cuando a esa hora el negocio ya cerró y 79 de 132 llamadas son del número 9032; «agosto 10.3% sin contestar» contra 3.1% real; e «incremento en llamadas que se quedan en buzón» cuando el buzón cayó a casi cero desde septiembre.',
    'Lo que sí se está deteriorando es el abandono en el menú: de 2.5% en enero a picos de 9.9% en julio y 11.3% en octubre. Más gente cuelga antes de llegar a una persona. Las perdidas reales, en cambio, se mantienen en un rango sano de 2.4% a 5.9%.',
    'El buzón fuera de horario está apagado desde septiembre: quien llama cuando la empresa está cerrada ya no puede dejar mensaje, y nadie decidió eso de forma documentada. Hay que preguntar si fue un cambio del cliente o un efecto de la reconfiguración de ese mes.',
    'Un destino configurado sin nadie detrás: «Atención 1» apareció el 17 de septiembre y no ha contestado ninguna de sus 22 llamadas (100% perdidas).',
    'Seis extensiones con SIM y seis complementos de datos móviles facturados ($3,294 de los $7,333 del MRR), y en el archivo de llamadas sólo aparecen DOS personas atendiendo. Puede que los nombres sean grupos con varias extensiones —el archivo no lo dice— pero hasta validarlo es casi la mitad del MRR sin uso visible. Si el cliente lo descubre solo, la conversación será de recorte.',
    'Los bordes del turno son el punto débil, no la capacidad: el arranque (9 h), la última hora (18 h) y el viernes completo (12.4% sin atender). La hora de 18:00 de jueves y viernes supera el 22%.',
    'Dispersión entre los dos agentes visibles: Áaron Gómez pierde 5.7% contra 3.1% de Joel Velázquez, y el jueves se le dispara a 9.4%. Antes de leerlo como desempeño hay que descartar horario, comida, extensión móvil en ruta u orden en el grupo de timbrado.',
    'No existe vía directa al decisor: Minerva Ochoa, la apoderada legal, no tiene teléfono ni correo propios en la ficha — su teléfono es el conmutador de la empresa y su correo es el de Jorge Anaya. Karina Zavala es puerta de entrada operativa, no decisora, y los correos del 11 y del 26 de noviembre siguen sin respuesta.',
    'La voz del cliente casi no se escucha: sólo 3.4% de las llamadas atendidas se evalúa, aunque el 86.8% de esas evaluaciones es positiva. La muestra es demasiado pequeña para concluir nada.',
    'La saliente viene cayendo: de 118 llamadas en abril a 40 en octubre, con 71.3% de conexión (435 de 610). El canal de devolución existe y se está usando cada vez menos.',
    'HUECO DECLARADO · quién es el número 9032 no se puede saber desde el archivo. El patrón (alta frecuencia, horario completo, duración mínima de 1.7 min, 25% de contestación, cero salientes hacia él) es compatible con tres hipótesis que el dato no separa: la otra sucursal marcando al conmutador, un equipo mal configurado, o un proveedor insistente. Se resuelve con una pregunta al cliente, no con una inferencia.',
    'MARCADO en el documento · el veredicto atribuye al número 9032 «el 61% de las sin contestar», pero la definición del propio reporte suma perdidas y abandonos en menú, y lo medido es 60.8% de las perdidas y 59.0% de los abandonos. El combinado cae entre las dos, no en 60.8%.',
    'MARCADO en el documento · el guion para el cliente dice «una llamada de regreso el mismo día» donde lo medido es «en ≤ 24 h». Corregida la palabra.',
    'DIFERENCIA DE FICHA · `cuentas.facturacion` guarda $7,264 y la suma de los tres conceptos de `servicios_json` da $7,333, que es exactamente el MRR del GRC. La ficha está desalineada por $69: el institucional es el del GRC.',
  ],

  cronologia: [
    { fecha: '24 jun 2020',   responsable: 'Operación',          evento: 'Sellomatic inicia como cliente con Visibilidad y Control 3,400 min. Hoy el paquete suma $7,333 con 6 extensiones SIM y 6 complementos de datos.', tipo: 'neutral' },
    { fecha: '15 ene 2026',   responsable: '—',                  evento: 'Primera llamada del número 55 5530 9032. A partir de aquí llamará 1,918 veces en 252 días distintos y distorsionará todos los indicadores de la cuenta.', tipo: 'problema' },
    { fecha: 'Mar 2026',      responsable: '—',                  evento: 'El número 9032 empieza a aparecer también en formato de 12 dígitos, lo que sugiere un cambio en cómo entra la troncal.', tipo: 'neutral' },
    { fecha: 'Abr 2026',      responsable: 'Operación cliente',  evento: 'Pico de consumo del año: 2,556 minutos (75% del plan) y 118 llamadas salientes, el mejor mes de devolución.', tipo: 'ok' },
    { fecha: '17 sep 2026',   responsable: 'Configuración',      evento: 'Aparece el destino «Atención 1». No contestará ninguna de sus 22 llamadas. En el mismo mes el buzón fuera de horario cae a casi cero.', tipo: 'problema' },
    { fecha: 'Oct 2026',      responsable: 'Operación cliente',  evento: 'Pico de abandono en el menú: 11.3%, contra 2.5% en enero. Las perdidas reales siguen sanas (2.4%–5.9%): lo que se deteriora es el IVR.', tipo: 'problema' },
    { fecha: '29 oct 2026',   responsable: '—',                  evento: 'El número 9032 deja de llamar, sin explicación conocida. Nadie preguntó qué era mientras llamaba.', tipo: 'pivote' },
    { fecha: '10 nov 2026',   responsable: 'Dan (KAM)',          evento: 'Bitácora de la semana 46: volumen estable de 900–1,000 llamadas y se consigue el contacto de Karina Zavala para retomar el seguimiento.', tipo: 'ok' },
    { fecha: '11 nov 2026',   responsable: 'Dan (KAM)',          evento: 'Primer correo a Karina. Sin respuesta.', tipo: 'problema' },
    { fecha: '26 nov 2026',   responsable: 'SAC',                evento: 'Expediente dado de alta. Segundo correo pendiente. Se detecta que el GRC marca la cuenta «Churn confirmado» con MRR final $0 mientras paga al corriente: se sube a dirección sin tocar el estado.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'Sellomatic Impresores' },
    { label: 'Consecutivo · CID',   value: 'D27 · 43584' },
    { label: 'Asesor',              value: 'Dan' },
    { label: 'Clasificación GRC',   value: 'AAA · rango $5,001–$10,000 · 10 facturas · 76 meses · $552,400 acumulados' },
    { label: 'Giro',                value: 'Servicios de impresión y sellos · 2 oficinas · todo apunta a empresa familiar (por confirmar)' },
    { label: 'Cliente desde',       value: '24 de junio de 2020 (6 años)' },
    { label: 'MRR institucional',   value: '$7,333 (GRC). Marcado «Churn confirmado» con mrrFin $0 y pérdida $7,333, y a la vez `sigue_viva` verificada por cartera: contradicción abierta.' },
    { label: 'Plan contratado',     value: 'Visibilidad y Control 3,400 min ($4,039) + 6 Extensión VyC con SIM ($2,022) + 6 Complemento de datos móviles ($1,272) = $7,333' },
    { label: 'Consumo medido',      value: '2,259 min/mes promedio ene–oct (66% del plan) · pico 2,556 en abril (75%)' },
    { label: 'Número Callpicker',   value: '+52 55 5578 2805 — el mismo que la ficha guarda como teléfono de la apoderada legal' },
    { label: 'Adopción',            value: '0 de 6 módulos en 6 años · `tiene_chat_activo` false · sin IA de Voz, sin API, sin pago automático' },
    { label: 'Pagos',              value: 'Al corriente · 0 incidencias de pago · 1 solo ticket administrativo en 6 años' },
    { label: 'Reuniones',           value: '0 registradas en 6 años' },
    { label: 'Último contacto',     value: '26 de noviembre de 2026' },
    { label: 'Estado en cartera',   value: 'en_riesgo · señales CONSUMO_CRITICO y BAJA_ADOPCION, la primera basada en una columna guardada en 0.0' },
  ],

  necesidad_negocio:
    'Una imprenta de sellos y servicios gráficos vive de la cotización repetida: el mismo cliente vuelve ' +
    'cada mes por el siguiente pedido, y 93 números llamaron diez veces o más este año. En ese negocio la ' +
    'llamada no atendida no se pierde una vez: se pierde la recurrencia. Sellomatic contesta bien cuando ' +
    'contesta —9 de cada 10 en su horario— y no tiene problema de capacidad. Lo que no tiene es un ' +
    'mecanismo para que la llamada que no entró vuelva a entrar.',

  potencial_corto: [
    'Identificar el número 9032 y decidir: bloquear, reenrutar o resolver la causa. Hasta entonces todos los indicadores de la cuenta están contaminados.',
    'Revisar la configuración de septiembre: «Atención 1» sin nadie detrás, el buzón fuera de horario apagado y la regla del jueves.',
    'Corregir la ficha: consumo 0% contra 66% real, y teléfono y correo propios de la apoderada legal.',
    'Validar las 6 extensiones con SIM y los 6 complementos de datos: $3,294 al mes sin uso visible.',
    'Cobertura de los bordes del turno (9 h y 18 h) y del viernes, reasignando extensiones antes que perderlas.',
  ],

  potencial_largo: [
    'Flujo de devolución de llamadas perdidas (lista diaria o callback automático): hoy se devuelve el 1.4%.',
    'Callpicker Chat o IA de Voz como primer contacto fuera de horario (8 h y 19–20 h), donde el buzón ya ni captura.',
    'Rediseño o simplificación del IVR: el abandono en menú pasó de 2.5% a 11.3% en diez meses.',
    'Encuesta automática al final de llamada: hoy sólo se evalúa el 3.4% de las atendidas.',
  ],

  tacticas: [
    {
      nombre: 'Empezar reconociendo lo que hacen bien',
      descripcion: '«Su equipo atiende 9 de cada 10 llamadas en horario. Eso está bien.» Es cierto, lo demuestra el dato, y desmonta de entrada la lectura de bajo uso que la ficha habría puesto en la mesa.',
      impacto: 'Compra la atención del cliente para el dato que sí duele, y evita que la sesión arranque defendiéndose.',
    },
    {
      nombre: 'Llevar la cifra de los 461 números como asunto, no como anexo',
      descripcion: '«En el año, 461 números le llamaron y nunca hablaron con nadie. Y cuando alguien no logra comunicarse, sólo 1 de cada 70 recibe una llamada de regreso en 24 horas.» Es la frase que Karina puede llevarle a la dueña sin traducir.',
      impacto: 'Rompe el cuello de botella de interlocución: un correo genérico de «sesión personalizada» no compite con la operación diaria; un dato de su negocio sí.',
    },
    {
      nombre: 'Preguntar por el 9032 en voz alta',
      descripcion: '«Hay un número que les marcó casi 2,000 veces este año. ¿Saben quién es?» Es una pregunta que sólo el cliente puede contestar, y la respuesta cambia el diagnóstico de la cuenta.',
      impacto: 'Demuestra lectura real del dato en lugar de un reporte genérico, y resuelve en un minuto lo que el archivo no puede resolver.',
    },
    {
      nombre: 'Higiene de extensiones antes de cualquier propuesta',
      descripcion: 'Los $3,294 de extensiones SIM y datos móviles se inventarían con el cliente ANTES de proponer Chat o IA de Voz. Si sobran, se reasignan a cobertura de 9 y 18 h en lugar de perderse.',
      impacto: 'Convierte el argumento de recorte más barato que tiene el cliente en una mejora de cobertura — y protege casi la mitad del MRR.',
    },
    {
      nombre: 'Resolver la contradicción del GRC antes de que la resuelva un corte',
      descripcion: 'La cuenta está marcada «Churn confirmado» con MRR final $0 mientras paga al corriente. Si un corte la arrastra, aparecerá como baja de $7,333 sin que nadie la haya dado de baja.',
      impacto: 'Protege $7,333 de MRR institucional y evita que una contradicción de fuente se convierta en churn reportado.',
    },
  ],

  senal_alarma:
    'Seis años sin una sola reunión registrada, cero módulos adicionales, correos sin respuesta y sin vía ' +
    'directa al decisor. La relación se sostiene por inercia y es vulnerable a una oferta de precio. ' +
    'Encima, casi la mitad del MRR está en extensiones cuyo uso no se ve en el archivo: si el cliente ' +
    'llega primero a esa cuenta, la conversación será de recorte y no de valor. Y el GRC ya la trae ' +
    'marcada como churn con pérdida de $7,333.',

  problema_raiz:
    'Nadie estaba midiendo esta cuenta con el dato correcto: el ruido de un solo número y una columna de ' +
    'consumo guardada en cero la hacían parecer una cuenta ociosa que falla los sábados, cuando es una ' +
    'cuenta sana que no devuelve llamadas.',

  problema_raiz_detalle:
    'Hay dos capas y conviene no confundirlas. La del cliente es simple: Sellomatic atiende bien y no ' +
    'recupera nada. El 90.7% de atención en la demanda real convive con un 65.6% de intentos fallidos que ' +
    'nunca se recuperan y con 14 devoluciones en todo el año. La saliente, que es el único canal de ' +
    'recuperación visible, viene cayendo de 118 llamadas en abril a 40 en octubre. Y sobre eso se montan ' +
    'tres defectos de configuración concretos y fechables: «Atención 1» sin nadie detrás desde el 17 de ' +
    'septiembre, el buzón fuera de horario apagado desde el mismo mes y un IVR cuyo abandono se cuadruplicó ' +
    'en diez meses.\n\n' +
    'La capa nuestra es la que explica por qué nadie lo había visto. La ficha leía consumo 0 de 3,400 ' +
    'minutos —porque la columna guardada `llamadas_atendidas_pct` está en 0.0— y de ahí salían las ' +
    'señales CONSUMO_CRITICO y «costo de salida bajo». Las otras cuatro lecturas automáticas que el ' +
    'detalle desmiente (sábado, 19 h, agosto, buzón) tienen todas el mismo origen: estaban calculadas ' +
    'sobre el total de llamadas, con el número 9032 dentro y sin acotar el horario real de la empresa. ' +
    'Un indicador que no separa el ruido de la demanda describe al ruido.\n\n' +
    'Y una tercera cosa que no es de ninguna de las dos capas: el GRC marca la cuenta «Churn confirmado» ' +
    'con MRR final en $0, y a la vez la declara `sigue_viva`. Las dos afirmaciones no pueden ser ciertas. ' +
    'Mientras eso no se resuelva, cualquier cifra de churn que incluya a D27 está contando una baja que no ' +
    'ocurrió.',

  flujo_real: [
    { fase: '1. Entra la llamada',        area: 'Un número · +52 55 5578 2805', accion: 'IVR y grupo de timbrado configurados',                                       resultado: '9,922 entrantes en once meses, pero 20.6% de ellas vienen de un solo número que casi nunca se atiende.' },
    { fase: '2. El menú pierde gente',    area: 'IVR del cliente',              accion: 'Árbol sin revisar desde antes de enero',                                     resultado: 'Abandono en menú de 2.5% en enero a 11.3% en octubre. Más gente cuelga antes de llegar a una persona.' },
    { fase: '3. Timbra a dos personas',   area: 'Joel y Áaron',                 accion: '6 extensiones SIM facturadas, 2 destinos visibles',                           resultado: 'Perdidas sanas (3.1% y 5.7%), pero Áaron se dispara a 9.4% el jueves. El pico de 10–13 h se cubre bien.' },
    { fase: '4. Un destino vacío',        area: 'Configuración de septiembre',   accion: '«Atención 1» creado el 17 sep',                                               resultado: '22 llamadas timbradas, 22 perdidas, 100%. Nadie detrás.' },
    { fase: '5. Se cierra el turno',      area: 'Operación cliente',             accion: 'Horario real L–V 9–19 h y sábado 9:30–14 h',                                  resultado: 'Los bordes son el punto débil: 9 h, 18 h y el viernes completo (12.4%). 18:00 de jueves y viernes supera 22%.' },
    { fase: '6. Nadie deja mensaje',      area: 'Buzón',                         accion: 'Apagado desde septiembre',                                                   resultado: 'Quien llama fuera de horario ya no puede dejar recado, y no hay decisión documentada.' },
    { fase: '7. Nadie devuelve',          area: 'Operación cliente',             accion: 'Saliente en caída: 118 llamadas en abril, 40 en octubre',                     resultado: '65.6% de los intentos fallidos nunca se recupera. 14 devoluciones en ≤ 24 h en todo el año (1.4%). 461 números sin hablar con nadie.' },
  ],

  comparativo: [
    { metrica: 'Atención en demanda real en horario',  real: '90.7%',                        ideal: '≥ 93% cubriendo los bordes de turno' },
    { metrica: 'Recuperación de intentos fallidos',    real: '34.4% alguna vez · 22.7% en 24 h', ideal: '≥ 60% con lista diaria de perdidas' },
    { metrica: 'Devoluciones en ≤ 24 h',               real: '14 en el año (1.4%)',           ideal: '≥ 50% de las perdidas devueltas el mismo día' },
    { metrica: 'Abandono en el menú',                  real: '11.3% en octubre (2.5% en enero)', ideal: '≤ 5%, con máximo 3 opciones' },
    { metrica: 'Uso del plan',                         real: '66% (2,259 de 3,400 min)',      ideal: '70%–85%: sin excedente y sin capacidad ociosa' },
    { metrica: 'Extensiones con uso visible',          real: '2 de 6 facturadas',             ideal: 'Las 6 inventariadas y asignadas, o reasignadas a cobertura' },
    { metrica: 'Cobertura de encuesta',                real: '3.4% de las atendidas',         ideal: '≥ 30% para tener voz del cliente defendible' },
    { metrica: 'Reuniones ejecutivas en 6 años',       real: '0',                             ideal: 'Una revisión semestral con la dueña' },
  ],

  plan_inmediato: [
    { accion: 'Identificar el número 55 5530 9032 y decidir: bloquear, reenrutar o resolver la causa. Hasta entonces, ningún indicador de la cuenta describe a sus clientes.',                                                            responsable: 'Dan (KAM) + Soporte',   criterio: 'Pregunta directa a Karina en la próxima llamada. Si es interno, ruta ajustada con Soporte y constancia del cambio.' },
    { accion: 'Subir a dirección la contradicción del GRC: «Churn confirmado» con mrrFin $0 y pérdida $7,333 en una cuenta que paga al corriente, consume 66% del plan y está marcada `sigue_viva`. NO se toca el estado de la cuenta.', responsable: 'SAC + Dirección',       criterio: 'Decisión documentada antes del siguiente corte. Si no se corrige, D27 aparecerá como baja de $7,333 sin que nadie la haya dado de baja.' },
    { accion: 'Auditoría de enrutamiento de la cuenta y reporte de los cambios hechos en septiembre: «Atención 1», buzón fuera de horario, regla del jueves y horarios de 9 y 18 h.',                                                     responsable: 'Soporte / Ingeniería',  criterio: 'Lista de cambios de septiembre con fecha y autor, y los tres puntos resueltos o explicados.' },
    { accion: 'Corregir la ficha: teléfono y correo propios de la apoderada legal, y levantar incidencia por el consumo en 0% (la columna guardada está en 0.0 mientras el archivo mide 66%).',                                             responsable: 'Dan + BI / Facturación', criterio: 'Vía directa al decisor registrada en la cuenta y el consumo leyéndose de fuente viva.' },
    { accion: 'Inventario de las 6 extensiones con SIM y los 6 complementos de datos ($3,294/mes) con el cliente. Si sobran, reasignarlas a cobertura de 9 y 18 h antes que perderlas.',                                                   responsable: 'Dan',                   criterio: 'Las 6 extensiones con nombre y uso, o una decisión por escrito sobre cada una.' },
  ],

  plan_mediano: [
    { accion: 'Flujo de devolución de llamadas perdidas: lista diaria o callback automático, como piloto de 30 días medido con este mismo indicador.', responsable: 'Dan con SAC',       criterio: 'Recuperación a 24 h por encima del 50% al cierre del piloto.' },
    { accion: 'Rediseñar o simplificar el IVR: el abandono pasó de 2.5% a 11.3% en diez meses.',                                                       responsable: 'Soporte + cliente', criterio: 'Abandono en menú por debajo del 5% sostenido dos meses.' },
    { accion: 'Reactivar buzón o mensaje fuera de horario con captura, o Chat / IA de Voz para las 8 h y las 19–20 h.',                                 responsable: 'Dan + Comercial',   criterio: 'Las llamadas fuera de horario dejan rastro accionable, no se pierden en silencio.' },
    { accion: 'Encuesta automática al final de llamada.',                                                                                              responsable: 'Soporte',           criterio: 'Cobertura de evaluación por encima del 30%.' },
  ],

  plan_estrategico: [
    { accion: 'Primera reunión ejecutiva en 6 años con la dueña, con el dato de los 461 números como entrada.', responsable: 'Dan',             criterio: 'Reunión registrada en la cuenta, con minuta y dos acuerdos concretos.' },
    { accion: 'Demostración de Callpicker Chat o IA de Voz como primer contacto, presentada como opción y no como venta.', responsable: 'Dan + Comercial', criterio: 'Decisión del cliente documentada, cualquiera que sea.' },
    { accion: 'Revisión semestral de indicadores operativos (atención, recuperación, abandono de menú, uso del plan) con el cliente.', responsable: 'SAC', criterio: 'Dos revisiones al año aceptadas por el cliente y usadas en su operación.' },
  ],

  areas_oportunidad: [
    { area: 'Devolución de llamadas perdidas',        impacto: '65.6% de los intentos fallidos nunca se recupera; hoy se devuelve el 1.4%',          responsable: 'Cliente + SAC' },
    { area: 'Identificar y resolver el número 9032',  impacto: '20.6% del tráfico y 60.8% de las perdidas; contamina todos los indicadores',          responsable: 'Dan + Soporte' },
    { area: 'Configuración de septiembre',             impacto: '«Atención 1» con 22 de 22 perdidas y el buzón fuera de horario apagado',              responsable: 'Soporte' },
    { area: 'IVR',                                     impacto: 'Abandono de 2.5% a 11.3% en diez meses',                                              responsable: 'Soporte + cliente' },
    { area: 'Extensiones facturadas sin uso visible',  impacto: '$3,294/mes, casi la mitad del MRR, con sólo 2 destinos visibles de 6',                 responsable: 'Dan + Facturación' },
    { area: 'Contradicción del GRC',                   impacto: '$7,333 de MRR marcados como churn confirmado en una cuenta viva y al corriente',       responsable: 'SAC + Dirección' },
    { area: 'Acceso al decisor',                       impacto: 'La apoderada legal no tiene datos de contacto propios; 0 reuniones en 6 años',         responsable: 'Dan' },
  ],

  perfiles: [
    {
      nombre: 'Minerva Durdaney Ochoa García',
      rol: 'Apoderada legal · la decisora',
      color: '#6366f1',
      campos: [
        { label: 'Teléfono en la ficha', value: '55 5578 2805 — que es el propio número Callpicker de la empresa. Llamarla es llamar al conmutador: por eso el primer intento cayó en una sucursal.' },
        { label: 'Correo en la ficha',   value: 'El de Jorge Anaya. No tiene correo propio registrado.' },
        { label: 'Lectura',              value: 'Si es una empresa familiar, decide ella, rápido y por confianza, no por proceso. Un correo genérico no compite con su operación diaria; un dato de su negocio sí.' },
        { label: 'Riesgo',               value: 'Hoy no existe una vía directa al decisor. Conseguirla es parte de la acción 4.' },
      ],
    },
    {
      nombre: 'Karina Zavala',
      rol: 'Asistente general · la puerta de entrada',
      color: '#f59e0b',
      campos: [
        { label: 'Contacto',   value: 'sellomatic.compras@gmail.com · 55 1817 8461' },
        { label: 'Historia',   value: 'Aceptó en llamada recibir la información por escrito. El correo del 11 de noviembre no tuvo respuesta y el del 26 sigue pendiente.' },
        { label: 'Rol real',   value: 'Puerta de entrada, no decisora. Si el mensaje no le da algo concreto que llevarle a la dueña, se queda en su bandeja.' },
      ],
    },
    {
      nombre: 'Jorge Anaya O.',
      rol: 'Facturación · el contacto más estable',
      color: '#22c55e',
      campos: [
        { label: 'Correo',      value: 'jorge.anaya.o@gmail.com (Gmail personal — probable familiar o socio, no un área de compras formal)' },
        { label: 'Historial',   value: 'Paga al corriente desde hace 6 años, con 0 incidencias de pago y un solo ticket administrativo.' },
        { label: 'Para qué sirve', value: 'Es el único canal probado de la cuenta. Sirve para llegar a la dueña, no para discutir operación.' },
      ],
    },
    {
      nombre: 'El número 55 5530 9032',
      rol: 'El ruido que distorsionaba todo',
      color: '#ef4444',
      campos: [
        { label: 'Volumen',     value: '1,918 llamadas en 252 días distintos (15 ene – 29 oct), 7–8 por día activo, máximo 26 en un día' },
        { label: 'Patrón',      value: 'Cualquier hora entre 8 y 20 h, intervalos medianos de una hora, 25% contestadas, 1.7 min de duración media, cero salientes de Sellomatic hacia él' },
        { label: 'Impacto',     value: '20.6% de las entrantes, 60.8% de las perdidas y 59.0% de los abandonos en menú de ene–oct' },
        { label: 'Lo que NO se sabe', value: 'Quién es. El archivo no identifica números, y las tres hipótesis (otra sucursal, equipo mal configurado, proveedor insistente) no se separan con el dato. Se resuelve preguntando.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '90.7% de la demanda real en horario se atiende por un agente.',
      '6 años de antigüedad, pagos al corriente y un solo ticket administrativo: cero fricción con Callpicker.',
      'Volumen estable (~740 llamadas reales al mes, ~31 por día hábil) y base recurrente: 93 números con 10 o más llamadas.',
      '86.8% de evaluaciones positivas cuando se mide.',
      'El pico de 10–13 h está bien cubierto: la capacidad no es el problema.',
      'Uso del plan sano (66%), sin excedente y sin ociosidad: la cuenta no es de bajo uso.',
      'La suma de `servicios_json` cuadra exactamente con el MRR del GRC: la ficha de servicios es confiable.',
    ],
    oportunidades: [
      'Recuperar 461 números que nunca fueron atendidos con un flujo de devolución.',
      'Rediseñar o simplificar el IVR: el abandono se cuadruplicó en diez meses.',
      'Reactivar buzón o mensaje fuera de horario con captura (o Chat / IA de Voz para las 8 h y 19–20 h).',
      'Activar Callpicker Chat o IA de Voz como primer contacto: 0 de 6 módulos hoy.',
      'Encuesta automática al final de llamada para tener voz real del cliente.',
      'Reasignar las extensiones SIM sin uso visible a la cobertura de 9 y 18 h.',
      'Conversación ejecutiva con un dato que la dueña no tiene: cuántos clientes se le fueron sin hablar con nadie.',
    ],
    debilidades: [
      '65.6% de los intentos fallidos nunca se recupera; devoluciones en ≤ 24 h: 1.4%.',
      'Abandono en menú al alza: 11.3% en octubre contra 2.5% en enero.',
      'Bordes de turno (9 h, 18 h) y viernes débiles; 18:00 de jueves y viernes por encima de 22%.',
      'Áaron pierde casi el doble que Joel, sobre todo en jueves.',
      '«Atención 1» configurado sin respuesta y buzón apagado desde septiembre.',
      '6 extensiones SIM y 6 complementos facturados, 2 destinos visibles: $3,294/mes sin uso demostrado.',
      'Sólo 3.4% de las atendidas se evalúa.',
    ],
    amenazas: [
      'El GRC la trae como «Churn confirmado» con pérdida de $7,333: si un corte la arrastra, aparecerá como baja sin que nadie la haya dado de baja.',
      'Sin acceso directo al decisor: la titular no tiene datos de contacto propios.',
      'Lecturas automáticas erróneas (consumo 0%, «costo de salida bajo», «falla el sábado») que llevan a una conversación equivocada y restan credibilidad.',
      'Si el cliente descubre las extensiones sin uso por su cuenta, la conversación será de recorte y no de valor.',
      'Relación sostenida por inercia: 0 reuniones en 6 años, correos sin respuesta; vulnerable a una oferta de precio.',
      'El número 9032 sin identificar: si es una sucursal o un sistema propio, hay un problema operativo oculto que nadie está atendiendo.',
    ],
  },

  conclusion:
    'Sellomatic no era la cuenta que la ficha describía. No es una cuenta ociosa con capacidad al 100% ' +
    'que falla los sábados: es una cuenta que usa dos tercios de su plan, atiende 9 de cada 10 llamadas ' +
    'en su horario, paga al corriente desde hace seis años y tiene una sola fuga grande — no devuelve. El ' +
    '65.6% de quienes no logran comunicarse nunca vuelve a ser atendido, y 461 números llamaron este año ' +
    'sin hablar con nadie.\n\n' +
    'La razón por la que nadie lo había visto es instructiva: un solo número generaba un quinto del ' +
    'tráfico y tres quintos de las perdidas, y la columna de consumo de la ficha está en cero. Con esos ' +
    'dos defectos, los indicadores describían al ruido. Cinco afirmaciones de la lectura automática no ' +
    'resisten el contraste con el archivo, y cada una habría llevado a una conversación equivocada con el ' +
    'cliente.\n\n' +
    'Queda una cosa que no es del cliente y hay que resolver en casa: el GRC marca esta cuenta como ' +
    '«Churn confirmado» con MRR final en $0 y pérdida de $7,333, y a la vez la declara viva. Las dos no ' +
    'pueden ser ciertas. Mientras no se resuelva, cualquier cifra de churn que incluya a D27 cuenta una ' +
    'baja que no ocurrió — y nadie dio de baja esta cuenta.',

  pierde: [
    '$7,333 de MRR institucional en una cuenta AAA con 76 meses y $552,400 acumulados.',
    'Seis años de pagos puntuales sin una sola incidencia: una referencia de estabilidad en servicios de impresión.',
    'Un caso de uso sano del plan (66%) que sirve de contraste para toda la cartera con el indicador roto.',
    'Casi la mitad del MRR en extensiones SIM que, si se pierden, se pierden sin haberse usado nunca.',
  ],

  gana: [
    'Un piloto de devolución de perdidas medible con un indicador que ya está calculado y en cero.',
    'La corrección de la columna de consumo, que afecta a toda la cartera y no sólo a esta cuenta.',
    'Acceso a la dueña, que en seis años nunca se ha tenido.',
    'Una reunión ejecutiva donde el dato lo pone Callpicker y la decisión la toma el cliente.',
  ],

  recomendacion_central:
    'Entrar reconociendo el 90.7% —es cierto y desarma la lectura de bajo uso— y poner encima de la mesa ' +
    'los 461 números que llamaron sin hablar con nadie y el 1.4% de devolución. Hacer en la misma llamada ' +
    'las dos preguntas que sólo el cliente puede contestar: quién es el número que marcó 1,918 veces, y si ' +
    'fue decisión suya apagar el buzón fuera de horario en septiembre. Inventariar las seis extensiones SIM ' +
    'antes de proponer nada nuevo, porque son casi la mitad del MRR y hoy no se ven en el archivo. Y en ' +
    'paralelo, sin tocar el estado de la cuenta, subir a dirección la contradicción del GRC: $7,333 marcados ' +
    'como churn confirmado en una cuenta que paga, consume y acaba de tener contacto.',

  documentos: [
    {
      nombre: 'Auditoría de llamadas · Sellomatic Impresores · 2026',
      ruta: '/auditorias/Auditoria-Sellomatic-Impresores-2026.html',
      descripcion:
        'Reporte interactivo del CID 43584 sobre las 10,532 llamadas del archivo (9,922 entrantes + 610 ' +
        'salientes), 1 ene – 26 nov 2026 con análisis cerrado a octubre: el número que distorsiona la ' +
        'lectura, calidad de atención real, desempeño por destino, la fuga de recuperación, consumo contra ' +
        'plan, ficha contra llamadas, FODA y plan de acción. Publicado con dos correcciones visibles (el ' +
        '«61% de las sin contestar», que es 60.8% de las perdidas, y «el mismo día» por «en ≤ 24 h») y con ' +
        'la contradicción del GRC —«Churn confirmado» con MRR final $0 sobre una cuenta al corriente— ' +
        'declarada dentro del documento.',
    },
  ],
}
