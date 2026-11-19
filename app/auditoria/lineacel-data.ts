import type { AuditoriaCase } from './types'

/**
 * LINEACEL · C · CID 180969 · asesor Erick · AAA · alta 7 may 2026
 *
 * ── DE DÓNDE SALE CADA CIFRA ──────────────────────────────────────────────
 * El reporte entregado («LINEACEL — Auditoría de llamadas salientes», 12 nov
 * 2026) lleva TODAS sus cifras en un `const D` de JavaScript. Se recalculan con
 *   python -I scripts/concilia-auditoria-lineacel.py
 * que lee el documento publicado en `public/auditorias/`, suma cada reparto
 * contra el total, reconstruye los agregados que el texto cita y lo contrasta
 * con GRC, Supabase, dids.json, la mesa de ayuda y la fuente de Chat.
 *
 * Las 11 roturas de `scripts/prueba-conciliadores-al-reves.py lineacel` —más su
 * control positivo— prueban que ese guion sabe ponerse en rojo. El conteo no se
 * teclea aquí: el guion lo imprime.
 *
 * ── LO QUE EL REPORTE TRAÍA MAL, Y ESTÁ CORREGIDO Y VISIBLE EN EL DOCUMENTO ─
 * 1. El responsable del plan decía «KAM (Claudia / suplente)». La cuenta es de
 *    Erick desde el 15 oct 2026, y el reporte está fechado el 12 nov.
 * 2. «Health Score de pagos 100» — la ficha dice 50.
 * 3. «Último contacto de valor hace 42 días», contados hasta una NOTA interna
 *    del 1 de octubre. El último contacto que llegó al cliente es del 8 de
 *    septiembre: 65 días a la fecha del reporte, 72 hoy.
 * 4. «Chat contratado y sin uso» — no está medido: la cuenta no tiene ni una
 *    fila en la fuente de Callpicker Chat.
 * 5. Dos superlativos que la serie completa contradice: «Peor: 12:00» (las
 *    18:00 están en 29.2%) y «el miércoles es el día más bajo» (el sábado está
 *    en 4.3%, y el propio hallazgo 7 lo explica aparte).
 *
 * ── Y LA CIFRA QUE EL REPORTE NO PODÍA VER ─────────────────────────────────
 * Su metodología dice que los datos de cuenta «vienen de la ficha del tablero
 * SAC», y la ficha guarda $13,802. El corte vivo del GRC factura $37,222.
 */
export const LINEACEL: AuditoriaCase = {
  id: 'lineacel',

  nombre: 'LINEACEL',
  sector: 'Telecomunicaciones · venta de líneas BAIT / Movistar',
  fecha_periodo: '13 Mayo – 12 Noviembre 2026 (126 días con actividad)',
  fecha_auditoria: 'Nov 2026',
  tipo_cliente: 'AAA · 6 meses de relación · 8 licencias VyC Callcenter + 25,000 min',
  descripcion_contexto:
    'Marca lo mismo y conecta menos: 19 puntos de caída con el volumen clavado · Pero el riesgo no está en el teléfono: la factura de noviembre subió $23,420 y nadie ha hablado con el cliente desde el 8 de septiembre · C · CID 180969 · Asesor: Erick Sánchez',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',
  asesor: 'Erick',

  kpis: [
    { label: 'MRR institucional · la ficha dice $13,802', value: '$37,222',    color: '#ef4444' },
    { label: 'Conexión · era 70% en jun–jul',             value: '50.6% sep',  color: '#f59e0b' },
    { label: 'Sin que un contacto llegue al cliente',     value: '72 días',    color: '#6366f1' },
    { label: 'Tickets con falla de servicio',             value: '0 de 12',    color: '#22c55e' },
  ],

  resumen_ejecutivo:
    'LINEACEL es una cuenta de SEIS MESES, banda AAA, que opera un call center de venta de líneas BAIT y Movistar desde Toluca: 181,816 llamadas salientes en 126 días con actividad, ~1,443 por día operado, sin un mes en blanco. El reporte de tráfico que se le entregó el 12 de noviembre tiene razón en su tesis —no hay problema de volumen, hay problema de eficiencia— y está bien medido: los cinco meses que comparte con nuestra propia fuente de llamadas cuadran AL RECORD, registro por registro, una vez descontados los cinco sin desenlace que el reporte excluye.\n\nPERO EL RIESGO DE ESTA CUENTA NO ESTÁ EN EL TELÉFONO, Y ESO EL REPORTE NO PODÍA VERLO. Su metodología dice que los datos de cuenta «vienen de la ficha del tablero SAC», y la ficha guarda $13,802. El corte vivo de Gross Revenue Facturación factura $37,222: los $13,802 son el `mrrIni` de ese mismo corte, o sea el importe del mes ANTERIOR. El alza son $23,420 en un solo mes, y el acumulado creció exactamente eso en el sexto mes, así que SÍ se facturó. El propio GRC la etiqueta «Upsell por confirmar (corte de datos)», que es su manera de decir que no da por confirmado que sea durable — y conviene no publicarla como MRR cerrado. Tampoco es la primera vez que este importe se mueve: el corte del 2 de octubre registró un Downgrade de $23,420 a $13,802, y el de noviembre un alza del MISMO importe al peso.\n\nAHORA JÚNTELO CON LO QUE EL PROPIO REPORTE DICE. El plan de 25,000 minutos se usó al 98.7% en el corte de julio y al 93.5% en el de octubre. El FODA pone como AMENAZA que «rebasar el plan en un corte alto genera cobros que el cliente no espera». Esa amenaza ya está en una factura. Y el 1 de octubre el cliente nos escribió —quedó en nuestra propia ficha— pidiendo confirmar su fecha de corte y de pago, con una fricción abierta por el cobro proporcional de Chat. Desde el 8 de septiembre ningún contacto nuestro ha llegado a Roberto Estrada. Van 72 días, con `silencio_60` CRÍTICA escalada el 8 de noviembre.\n\nLO QUE SÍ FUNCIONA, Y HAY QUE DECIRLO PRIMERO EN LA REUNIÓN. Doce tickets en la mesa de ayuda y CERO fallas del servicio — ni una. El marcador automático vía API mueve el 83% del volumen y conecta al 65.2%, y su adopción está calificada «alta». Las ocho licencias están ocupadas: ocho posiciones activas en octubre, sin asientos ociosos. Y el alcance es amplio: 103,499 números distintos, el 79.2% contactado al menos una vez, 1.76 intentos por número.\n\nLA CAÍDA, MEDIDA. La conexión pasó de 70.0% en junio y 70.2% en julio a 50.6% en septiembre —19.6 puntos— y repuntó a 58.5% en octubre, con el volumen entre 30 y 36 mil llamadas al mes todo el tramo. La candidata que el reporte propone se sostiene: la marcación manual (SIP) creció de 358 llamadas en junio a 11,322 en septiembre, el 34.3% del mes, y conecta al 33.3% contra el 65.2% del marcador. Todas las posiciones la adoptaron a la vez en septiembre, lo que apunta a una decisión operativa y no individual. El reporte lo marca como HIPÓTESIS y así hay que presentarlo.\n\nY HAY UN ARREGLO QUE ES GRATIS. Desde el 14 de octubre hay disparos diarios a las 9:00, 9:20 y 9:40 sin agentes conectados: 529 llamadas, de las cuales 522 —el 98.7%— quedaron «perdidas por agente». El prospecto contesta y no hay nadie. Es mover un horario.\n\nUNA ÚLTIMA COSA SOBRE LO QUE NO LE VENDEMOS. El reporte propone «Demo de IA de Voz» y «activar WhatsApp API» como si fueran ideas nuestras. En octubre el cliente abrió TRES tickets en la mesa: dos de Chat (APIs/Webhooks y Plantillas Verificadas) y uno de Agente Virtual (voz). Ya lo está intentando solo. La conversación no es venderlo: es terminar de prenderlo.',

  resultado_positivo:
    'Doce tickets en la mesa y CERO fallas del servicio en seis meses. El marcador automático vía API mueve el 83% del volumen al 65.2% de conexión, con adopción calificada «alta», y las ocho licencias contratadas están ocupadas. 103,499 números distintos alcanzados, el 79.2% contactado al menos una vez. Y las tablas del propio reporte cierran: la de posiciones suma al récord sus 181,816 llamadas y sus 118,924 minutos gracias a un cubo «Otros / campañas» que casi nadie se acuerda de poner.',

  hallazgos: [
    'La factura de noviembre es $37,222, no los $13,802 de la ficha: subió $23,420 en un mes. Y el último contacto que llegó al cliente es del 8 de septiembre, hace 72 días. Ésa es la reunión.',
    'Contratan lo mismo y conectan menos: de 70.0% en junio a 50.6% en septiembre, 19.6 puntos, con el volumen clavado en 30–36 mil llamadas al mes. No es capacidad, es eficiencia.',
    'Cuatro alertas abiertas y una CRÍTICA: `silencio_60` escaló el 8 nov. Las cuatro ya marcan la cuenta como TOP, y al abrirse NO lo era: entró cuando el importe pasó a $37,222.',
    'Campañas disparando a las 9:00, 9:20 y 9:40 sin agentes conectados: 522 de 529 llamadas (98.7%) quedaron «perdidas por agente». Es mover un horario, y sale gratis.',
    'NO le vendamos lo que ya está pidiendo. El reporte propone «Demo de IA de Voz» y «activar WhatsApp API» como ideas nuestras. En octubre el cliente abrió TRES tickets: dos de Chat (APIs/Webhooks y Plantillas Verificadas) y uno de Agente Virtual (voz). Lo está intentando solo y se atasca con soporte. La conversación es terminar de prenderlo, no presentárselo.',
    'La marcación manual explica la caída, como HIPÓTESIS y no como hecho: SIP pasó de 358 llamadas en junio a 11,322 en septiembre (34.3% del mes) y conecta al 33.3% contra el 65.2% del marcador API. Todas las posiciones la adoptaron a la vez en septiembre, lo que apunta a una decisión operativa, no individual. Hay que preguntarle por qué empezaron a marcar a mano.',
    'El plan va pegado al techo y eso ya tiene consecuencia: 24,680 minutos en el corte de julio (98.7% de 25,000) y 23,387 en el de octubre (93.5%). Ningún corte COMPLETO lo ha rebasado todavía. El FODA pone esto como amenaza futura —«cobros que el cliente no espera»— y el GRC ya facturó $23,420 más en noviembre.',
    'Uno de cada cuatro minutos facturados va a números que ya habían contestado: 36,165 llamadas (19.9%) y 30,935 minutos (26.0% del total); 2,145 números recibieron 5 o más intentos. Puede ser seguimiento comercial legítimo — hay que validarlo con el cliente ANTES de llamarlo desperdicio.',
    '«Chat sin uso» no está medido, y la diferencia importa. Esta cuenta no tiene NI UNA fila en la fuente de Callpicker Chat: no hay lectura, ni buena ni mala. El reporte lo publica como desuso y lo convierte en oportunidad de venta. Un hueco de medición no es un cliente que dejó de usar algo.',
    'La ficha dice score de pago 50, y el FODA del reporte publicó «Health Score de pagos 100». El Health Score global es 52 (actividad 50 · adopción 67 · pago 50 · relacional 27). Lo que sí consta es `pagos_al_corriente = true` y cero incidencias: una fortaleza real, pero no un 100.',
    'El consecutivo de esta cuenta es «C», sin número: es la ÚNICA de las 224 de cartera así. El siguiente libre del prefijo C es C71. Mientras no se complete, `app/auditoria/registry.ts` tiene que apuntar a «C» — y el día que se renumere hay que cambiarlo ahí también, o el botón de Auditoría desaparece de la ficha sin que nada falle.',
    'La cuenta también RECIBE llamadas y el reporte no las mide, porque sólo cubre salientes: nuestra fuente registra 26 entrantes entre el 17 de julio y el 7 de octubre, con 20 sin contestar. Son pocas y se dicen en número, no como tendencia — pero el propio reporte propone «IA de Voz para atender a quien regresa la llamada» sin medir que esas devoluciones ya están entrando y casi todas se caen.',
    'Dos superlativos del reporte que la serie completa contradice, corregidos y anotados en el documento publicado: «Peor: 12:00 (51.5%)» —las 18:00 están en 29.2%, sobre 24 llamadas— y «el miércoles es el día más bajo (53.2%)», cuando el sábado está en 4.3% y el propio hallazgo 7 lo explica aparte. Los dos son ciertos SÓLO entre las horas y los días con volumen, y así quedan dichos.',
    'Tres repartos del reporte no cierran, todos chicos y todos declarados en el documento: la tabla de canal de origen cubre 181,810 de 181,816 llamadas (faltan 6), el histograma de duración cubre 109,467 de las 109,680 conectadas (faltan 213, el 0.19%) y la gráfica de cortes deja fuera los 42 minutos del 13 de mayo, porque el primer corte arranca el 27. No mueven ninguna conclusión; un recorte sin declarar se lee como cobertura completa.',
    'Dos focos operativos concretos para la reunión. «Ale Fabián» perdió por agente 1,209 de sus 3,634 llamadas (33.3%) y ya no está activo —su última llamada es del 24 de septiembre—, pero la campaña «Campaña todas» perdió 192 de 264 (72.7%) y SIGUIÓ marcando en noviembre. Y el 29 de agosto se marcaron 1,896 llamadas en sábado con 2.1% de conexión: ese solo día es el 95.4% del volumen sabatino y explica prácticamente todo el 4.3% del sábado — los otros tres sábados conectan al 50%.',
  ],

  cronologia: [
    { fecha: '7 May 2026',    responsable: 'Callpicker',       evento: 'Alta de la cuenta. Primer pago el 27 de mayo ($6,552), activación en 4 días, ticket cerrado el 31 de mayo. Ejecutivo de activación: Enrique. Vendedor: Monse.', tipo: 'ok' },
    { fecha: '13 May 2026',   responsable: 'Cliente',          evento: 'Primera marcación: 38 llamadas. El call center arranca de verdad el 2 de junio.', tipo: 'neutral' },
    { fecha: 'Jun–Jul 2026',  responsable: 'Cliente',          evento: 'El mejor tramo de la cuenta: 70.0% y 70.2% de conexión sobre 30,133 y 34,547 llamadas. El corte del 27 jun–26 jul consume 24,680 minutos, el 98.7% del plan.', tipo: 'ok' },
    { fecha: '21 Jul 2026',   responsable: 'Mesa de ayuda',    evento: 'Primer ticket: apoyo para configuración de extensiones. Escalado.', tipo: 'neutral' },
    { fecha: '29 Jul 2026',   responsable: 'KAM',              evento: 'Adopción capturada: Integración API «alta», Voz VyC «medio», Panel Administrador «medio».', tipo: 'ok' },
    { fecha: '24 Ago 2026',   responsable: 'Cliente',          evento: 'Contrata Callpicker Chat (WhatsApp API). Queda activo a finales de septiembre. Nuestra fuente de Chat nunca ha tenido una fila de esta cuenta, así que su uso no está medido.', tipo: 'neutral' },
    { fecha: '29 Ago 2026',   responsable: 'Cliente',          evento: 'Campaña de sábado: 1,896 llamadas con 2.1% de conexión. Probablemente programada sin agentes. Es el 95.4% de todo el volumen sabatino del periodo.', tipo: 'problema' },
    { fecha: 'Sep 2026',      responsable: 'Cliente',          evento: 'La marcación manual salta a 11,322 llamadas (34.3% del mes) en todas las posiciones a la vez, y la conexión toca su mínimo: 50.6%. Seis tickets ese mes, ninguno por falla.', tipo: 'problema' },
    { fecha: '7–8 Sep 2026',  responsable: 'Soporte + KAM',    evento: 'Reunión de integración de llamadas. Mario Hdez. (Soporte) resuelve las dudas de campañas y Néstor (Chat) las de su canal. ÚLTIMO contacto que llega al cliente.', tipo: 'pivote' },
    { fecha: '1 Oct 2026',    responsable: 'Cliente',          evento: 'El cliente escribe: quiere confirmar su fecha de corte y de pago, con dudas sobre el cobro proporcional de Chat. Queda registrado como NOTA interna —Monse pidiendo a Daniel que contacte a Roberto—, no como contacto. Nadie volvió.', tipo: 'problema' },
    { fecha: '6 Oct 2026',    responsable: 'Motor de alertas',  evento: 'Abren `sin_ficha`, `sin_radar`, `sin_contactos` y `nunca_asignada`. La última se cierra el 8 de octubre.', tipo: 'problema' },
    { fecha: '9 Oct 2026',    responsable: 'Motor de alertas',  evento: 'Abre `silencio_30` sobre el 8 de septiembre.', tipo: 'problema' },
    { fecha: '14 Oct 2026',   responsable: 'Cliente',          evento: 'Empiezan los disparos diarios a las 9:00, 9:20 y 9:40 sin agentes conectados: 529 llamadas y 522 perdidas por agente.', tipo: 'problema' },
    { fecha: '15 Oct 2026',   responsable: 'Dirección',        evento: 'La cartera de Claudia Hernández pasa a Erick Sánchez. Esta cuenta entra en la cartera de Erick.', tipo: 'pivote' },
    { fecha: '2 Oct 2026',    responsable: 'Facturación',      evento: 'El corte del GRC registra un DOWNGRADE: de $23,420 a $13,802, pérdida de $9,618.', tipo: 'problema' },
    { fecha: '8 Nov 2026',    responsable: 'Motor de alertas',  evento: '`silencio_60` ESCALA a crítica. Dos meses sin que un contacto nuestro llegue al cliente.', tipo: 'problema' },
    { fecha: '12 Nov 2026',   responsable: 'SAC',              evento: 'Se entrega la auditoría de llamadas salientes. Atribuía el plan a «KAM (Claudia / suplente)», publicaba un score de pago de 100 y contaba el silencio desde una nota interna.', tipo: 'neutral' },
    { fecha: '16 Nov 2026',   responsable: 'Facturación',      evento: 'El corte del GRC registra un alza de $23,420 —el MISMO importe del downgrade de octubre— y deja el MRR en $37,222, etiquetado «Upsell por confirmar (corte de datos)». La cuenta entra al TOP.', tipo: 'pivote' },
    { fecha: '19 Nov 2026',   responsable: 'Callpicker',       evento: 'Se carga el expediente al módulo de Auditoría con el documento conciliado: 10 correcciones aplicadas y visibles, 7 desfases declarados por clave.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'LINEACEL · Calle Rafael M. Hidalgo 510, Col. Cuauhtémoc, C.P. 50130, Toluca de Lerdo, Estado de México' },
    { label: 'Sector',               value: 'Telecomunicaciones y servicios · venta de líneas BAIT y Movistar por teléfono' },
    { label: 'Contacto principal',   value: 'Roberto Estrada · Gerente · roberto.estrada@lineacel.com.mx · 725 118 5761' },
    { label: 'Tamaño',               value: '20 empleados · 10 oficinas · pequeña' },
    { label: 'Servicio contratado',  value: '8 licencias VyC Callcenter · 25,000 minutos · corte de facturación el día 27. Un solo número de entrada: +52 55 9764 6956 (confirmado en dids.json). Callpicker Chat (WhatsApp API) contratado el 24 ago y sin medición.' },
    { label: 'MRR institucional',    value: '$37,222 MXN en el corte vivo del GRC (AAA, 6 meses, 7 facturas, acumulado $129,652). La ficha guarda $13,802, que es el `mrrIni` de ese mismo corte: el importe del mes anterior. El alza de $23,420 está etiquetada «Upsell por confirmar (corte de datos)» — se facturó, pero el GRC no la da por durable. Y en el corte del 2 de octubre el movimiento era el inverso: Downgrade de $23,420 a $13,802.' },
    { label: 'Health Score',         value: '52 — actividad 50 · adopción 67 · pago 50 · relacional 27. `pagos_al_corriente = true`, cero incidencias de pago. El reporte entregado publicaba «Health Score de pagos 100»: eso quedó corregido.' },
    { label: 'Tipo de cliente',      value: 'AAA · 6 meses · rango $20,001–$40,000 · estado `activo` en la ficha, con cuatro alertas abiertas y una crítica' },
  ],

  necesidad_negocio:
    'LINEACEL vende líneas de telefonía móvil —BAIT y Movistar— llamando a una base de prospectos desde Toluca. Su negocio se mide en contactos útiles por día: ocho posiciones marcando ~1,440 llamadas diarias, con una conversación mediana de 36 segundos porque lo que se busca es calificar y pasar, no conversar. Por eso el consumo de su plan crece con el NÚMERO de llamadas y no con la duración: cada llamada conectada pesa al menos un minuto facturado. Callpicker no es una herramienta de soporte para esta cuenta; es la línea de producción. Si la conexión baja un punto, el cliente vende menos con el mismo costo, y por eso una caída de 19 puntos sin explicación es, para él, una pregunta sobre nuestra plataforma antes que sobre su operación.',

  potencial_corto: [
    'Mover las campañas de 9:00/9:20/9:40 a las 10:00, o condicionar su arranque a que haya agentes conectados: 522 llamadas perdidas por agente que se recuperan sin gastar nada.',
    'Revisar el tiempo de timbrado del marcador. Las no contestadas cortan a los 15 segundos de mediana (p25 13 s, p75 17 s) y un celular suele timbrar más antes de mandar a buzón. Probar 25 s en una campaña piloto.',
    'Concentrar la marcación manual en las dos mejores horas: 10:00 (63.7%) y 16:00 (65.0%), en vez de las 12:00 (51.5%).',
    'Terminar de prender Callpicker Chat, que ya paga y no usa, apoyándose en los dos tickets que el propio cliente abrió en octubre.',
  ],

  potencial_largo: [
    'Reglas de reintento y enfriamiento en la integración API: 26% de los minutos van a números que ya habían contestado. Si una parte es recontacto innecesario, son minutos que vuelven al plan sin comprar más.',
    'Agente Virtual de voz para precalificar o atender a quien devuelve la llamada. El cliente ya abrió un ticket al respecto en octubre, y las devoluciones ya están entrando: 26 entrantes y 20 sin contestar en nuestra propia medición.',
    'Dimensionar el plan con el cliente ANTES de que un corte lo rebase, con la serie de los seis cortes delante. El de julio llegó al 98.7%.',
    'Entender su embudo: no sabemos su tasa de venta ni cuántos contactos necesita por venta. Sin eso no se puede calcular su costo por venta, que es la única cifra con la que esta cuenta decide si seguimos.',
  ],

  tacticas: [
    {
      nombre: 'Entrar por la factura, no por la gráfica',
      descripcion: 'La reunión no empieza con la caída de conexión: empieza explicando el importe. El cliente va a recibir —o ya recibió— una factura de $37,222 contra los $13,802 del mes anterior, y el 1 de octubre ya nos había escrito para confirmar su fecha de corte y de pago. Llevar el desglose y la serie de los seis cortes de minutos.',
      impacto: 'Es la diferencia entre una revisión de uso y una conversación de retención. Un cliente de seis meses en etapa de valor percibido que descubre solo un cargo de ese tamaño asocia el aumento con la plataforma.',
    },
    {
      nombre: 'Separar el hecho de la hipótesis, en voz alta',
      descripcion: 'La caída de 19 puntos está MEDIDA. Su causa no: el reporte propone la marcación manual, el desgaste de la base y el posible etiquetado del número como spam, y las tres son hipótesis. Presentarlas como tales y pedirle al cliente la pieza que nos falta: por qué empezaron a marcar a mano en septiembre.',
      impacto: 'Un diagnóstico presentado como certeza y luego desmentido por el cliente cuesta más que no haberlo presentado. Y la respuesta sólo la tiene él.',
    },
    {
      nombre: 'Lo gratis primero',
      descripcion: 'El cambio de horario de las campañas de 9:00 y la revisión del tiempo de timbrado no cuestan nada, no necesitan aprobación de nadie y se miden en dos semanas. Ponerlos en marcha ANTES de la reunión, para llegar con un resultado en vez de una propuesta.',
      impacto: '522 llamadas perdidas por agente eliminadas, y una demostración de que miramos la cuenta sin que nos lo pidan.',
    },
    {
      nombre: 'No vender lo que ya pidió',
      descripcion: 'Antes de proponer una demo, mirar la mesa de ayuda. En octubre el cliente abrió tickets de APIs/Webhooks de Chat, de Plantillas Verificadas y de Agente Virtual de voz. El movimiento es acompañarlo a terminar lo que empezó.',
      impacto: 'Convierte una venta en una activación, que es más rápida y no necesita presupuesto nuevo.',
    },
  ],

  senal_alarma:
    'Una cuenta AAA de SEIS MESES —la etapa en que se decide si el cliente percibe valor— cuya conexión cayó 19 puntos, cuya factura de noviembre subió $23,420 sin que nadie le avise, que el 1 de octubre nos escribió para confirmar su fecha de corte y de pago y no recibió respuesta, y en la que ningún contacto nuestro ha llegado al cliente desde el 8 de septiembre. Cuatro alertas abiertas, una crítica escalada el 8 de noviembre, cero reuniones vinculadas, cero de doce del Radar y cero observaciones del KAM. La ficha la sigue marcando `activo`.',

  problema_raiz:
    'La cuenta se midió por el canal que el tablero mide bien —el teléfono— mientras el riesgo real crecía en el canal que nadie estaba mirando: la factura. Y la razón por la que nadie la mira es que el importe de la ficha es $13,802 y el institucional $37,222, así que durante semanas esta cuenta no pesaba lo suficiente para subir a la cola de nadie.',

  problema_raiz_detalle:
    'La primera capa es de dato. `cuentas.facturacion` guardaba $13,802 cuando el corte vivo del GRC facturaba $37,222. Esos $13,802 no son un error de captura: son el `mrrIni` del mismo corte, es decir el importe del mes anterior, y la ficha se actualizó por última vez el 16 de octubre. Con $13,802 esta cuenta no era TOP y sus cuatro alertas se abrieron sin esa marca; con $37,222 las cuatro la llevan. Es decir: el motor de alertas la ascendió a TOP sólo cuando el GRC movió el importe, no cuando el riesgo apareció.\n\nLa segunda es de definición, y es la que más daño hace porque fabrica tranquilidad. El reporte entregado publicó «último contacto de valor hace 42 días». Esos 42 días se cuentan hasta el 1 de octubre, y lo que hay el 1 de octubre es una NOTA INTERNA: Monse pidiéndole a Daniel que contacte a Roberto porque el cliente tiene dudas de su fecha de corte y de pago. Eso no es haber hablado con el cliente — es el registro de que alguien debía hablarle. El último seguimiento que de verdad llegó al cliente es la reunión de integración del 8 de septiembre. La diferencia son 23 días, y es exactamente la diferencia entre un número que no dispara nada y uno que dispara `silencio_60` en crítica.\n\nLa tercera es de alcance, y no es culpa de quien escribió el reporte. Se le pidió una auditoría de llamadas SALIENTES y la hizo bien: sus cinco meses coincidentes con nuestra fuente cuadran al récord. Pero una cuenta no se decide en un canal. La mesa de ayuda tiene doce tickets y cero fallas —una fortaleza que el reporte no cuenta— y tres tickets de octubre que cambian el plan de acción: el cliente ya está intentando prender el Chat y ya preguntó por el Agente Virtual. Y nuestra fuente de llamadas registra 26 entrantes con 20 sin contestar, que son las devoluciones que el propio reporte propone atender con IA sin haberlas medido.\n\nLa cuarta es de medición ausente presentada como medición. «Callpicker Chat contratado y sin uso» suena a dato y no lo es: esta cuenta no tiene NI UNA fila en la fuente de Chat. No hay lectura. Publicar eso como desuso y convertirlo en oportunidad comercial manda al asesor a ofrecerle al cliente que empiece a usar algo que quizá ya esté usando, y que desde luego ya intentó configurar dos veces con soporte.\n\nY la quinta es de identidad, pequeña pero rara: el consecutivo de esta cuenta es «C», sin número. Es la única de las 224 de cartera así. No rompe nada hoy, pero cualquier cosa que ordene o agrupe por consecutivo la trata distinto, y el día que se complete a C71 hay que acordarse de `registry.ts` o el botón de Auditoría desaparece de su ficha sin que nada falle.',

  flujo_real: [
    { fase: 'May 2026',      area: 'Activación',    accion: 'Alta en 4 días, pago en 4, ticket cerrado el 31 de mayo', resultado: 'Arranque limpio. El cliente opera desde el 2 de junio.' },
    { fase: 'Jun–Jul 2026',  area: 'Cliente',       accion: 'Marcador API al 83% del volumen, 70% de conexión, plan al 98.7%', resultado: 'El mejor tramo de la cuenta — y nadie lo documentó como línea base.' },
    { fase: 'Sep 2026',      area: 'Cliente',       accion: 'Todas las posiciones pasan a marcación manual a la vez (34.3% del mes)', resultado: 'La conexión cae a 50.6%. Nadie preguntó por qué cambiaron.' },
    { fase: '8 Sep 2026',    area: 'Soporte + KAM', accion: 'Reunión de integración: Soporte y Chat resuelven las dudas del cliente', resultado: 'Satisfactoria — y es el ÚLTIMO contacto que llega al cliente.' },
    { fase: '1 Oct 2026',    area: 'Interno',       accion: 'El cliente pregunta por su fecha de corte y el cobro proporcional de Chat', resultado: 'Se registra como nota interna. Nadie le responde. El reporte lo contará después como «contacto de valor».' },
    { fase: '14 Oct 2026',   area: 'Cliente',       accion: 'Campañas automáticas a las 9:00 sin agentes conectados', resultado: '522 de 529 llamadas perdidas por agente durante un mes.' },
    { fase: 'Oct 2026',      area: 'Mesa de ayuda', accion: 'El cliente abre tickets de APIs/Webhooks de Chat, Plantillas Verificadas y Agente Virtual', resultado: 'Tres señales de intención de uso que no llegaron al plan comercial.' },
    { fase: '12 Nov 2026',   area: 'SAC',           accion: 'Se entrega la auditoría de salientes', resultado: 'Bien medida en su alcance, con el asesor y el importe heredados de una ficha desactualizada.' },
    { fase: '16 Nov 2026',   area: 'Facturación',   accion: 'El GRC factura $37,222: +$23,420 en un mes', resultado: 'La amenaza que el FODA ponía a futuro ya es una factura, y el cliente lleva 72 días sin oírnos.' },
  ],

  comparativo: [
    { metrica: 'Importe en la ficha',          real: '$13,802 — el `mrrIni` del corte vivo, o sea el mes anterior', ideal: '$37,222 — el `mrrFin` del corte vivo del GRC' },
    { metrica: 'Días de silencio publicados',  real: '42, contados hasta una nota interna del 1 de octubre',        ideal: '65 a la fecha del reporte, 72 hoy — desde el 8 de septiembre' },
    { metrica: 'Score de pago publicado',      real: '100',                                                          ideal: '50 (Health Score global 52)' },
    { metrica: 'Conexión',                     real: '50.6% en septiembre, 58.5% en octubre',                        ideal: '70% — su propio nivel de junio y julio, sin más llamadas ni más licencias' },
    { metrica: 'Campañas antes de las 10:00',  real: '529 llamadas, 522 perdidas por agente (98.7%)',                 ideal: 'cero disparos sin agentes conectados' },
    { metrica: 'Minutos a números ya contactados', real: '30,935 min (26.0% del total)',                              ideal: 'con tope de intentos y enfriamiento, recontactos por debajo del 10% del volumen' },
    { metrica: 'Estado de Callpicker Chat',    real: 'publicado como «sin uso»',                                      ideal: 'SIN MEDICIÓN — la cuenta no tiene fila en la fuente de Chat, y hay dos tickets de configuración en octubre' },
    { metrica: 'Radar del cliente',            real: '0 de 12 preguntas respondidas',                                 ideal: 'respondido, y con reunión vinculada a la ficha' },
  ],

  plan_inmediato: [
    { accion: 'Llamar a Roberto Estrada y abrir por la FACTURA: el importe de noviembre, el desglose y la serie de los seis cortes de minutos. Cerrar también el cobro proporcional de Chat que preguntó el 1 de octubre y nadie le contestó.', responsable: 'Erick', criterio: 'Contacto registrado en seguimientos con tipo distinto de «nota», y `silencio_60` cerrada contra un contacto real' },
    { accion: 'Mover los disparos de 9:00/9:20/9:40 a las 10:00, o condicionarlos a agentes conectados', responsable: 'Soporte (Integración) + cliente', criterio: 'Cero «perdidas por agente» antes de las 10:00 en la semana siguiente' },
    { accion: 'Apagar o reasignar la campaña «Campaña todas», que perdió 192 de 264 llamadas por agente y siguió marcando en noviembre aunque «Ale Fabián» dejó de operar el 24 de septiembre', responsable: 'Soporte + cliente', criterio: 'Toda campaña activa con agentes asignados y conectados' },
    { accion: 'Corregir `cuentas.facturacion` a $37,222 y anotar en la ficha que el GRC lo marca «Upsell por confirmar (corte de datos)», con el histórico del Downgrade de octubre', responsable: 'Erick / Facturación', criterio: 'Leído de vuelta desde la ficha y contrastado contra `data/grc-zoho.json`' },
  ],

  plan_mediano: [
    { accion: 'Probar 25 segundos de timbrado en una campaña piloto contra los 15 actuales, en A/B de dos semanas', responsable: 'Soporte', criterio: '+5 puntos de conexión en el piloto, o descartar la hipótesis con dato' },
    { accion: 'Acordar reglas de reintento: tope de intentos por número y enfriamiento para números ya contactados', responsable: 'Cliente (integración API) + Soporte', criterio: 'Recontactos por debajo del 10% del volumen' },
    { accion: 'Terminar de prender Callpicker Chat retomando los dos tickets de octubre del cliente, y dejar la primera medición en la fuente de Chat', responsable: 'Erick + Soporte (Chat)', criterio: 'La cuenta aparece con fila y lectura válida en la fuente de Chat' },
    { accion: 'Responder el Radar con el cliente y vincular la reunión a la ficha; capturar observaciones del KAM, que están en cero', responsable: 'Erick', criterio: '12 de 12 del Radar y `sin_ficha`, `sin_radar` y `sin_contactos` cerradas' },
    { accion: 'Completar el consecutivo de la cuenta —es «C» a secas, la única así de 224— al siguiente libre, C71, y actualizar `app/auditoria/registry.ts` en el mismo cambio', responsable: 'Callpicker (datos)', criterio: '`scripts/revisa-registro-auditorias.py` sigue cruzando este caso por CID después del cambio' },
  ],

  plan_estrategico: [
    { accion: 'Dimensionar el plan con el cliente delante de la serie de cortes, antes de que uno lo rebase: 98.7% en julio y 93.5% en octubre', responsable: 'Erick', criterio: 'Plan ajustado o regla de consumo acordada por escrito' },
    { accion: 'Levantar su embudo: tasa de venta y contactos necesarios por venta, para poder hablar de costo por venta y no de minutos', responsable: 'Erick + cliente', criterio: 'Costo por venta calculado y aceptado por el cliente' },
    { accion: 'Demostrar el Agente Virtual sobre su propio caso —atender a quien devuelve la llamada— con las 26 entrantes y 20 perdidas de nuestra medición como punto de partida', responsable: 'Erick + Preventa', criterio: 'Un módulo nuevo activado antes del corte de diciembre' },
    { accion: 'Investigar si el 800 288 2248 es una línea operativa de proveedor o un error de marcación: 493 intentos, 232 conectados, 1,785 minutos desde el 3 de julio, creciendo a 129 llamadas en octubre', responsable: 'Erick', criterio: 'Causa documentada en Observaciones KAM' },
  ],

  areas_oportunidad: [
    { area: 'Retención del importe',       impacto: 'Una factura de $37,222 contra $13,802 el mes anterior, en una cuenta de 6 meses que ya preguntó por su corte y no recibió respuesta', responsable: 'Erick' },
    { area: 'Recuperar 19 puntos de conexión', impacto: 'Volver al 70% de jun–jul sin aumentar llamadas ni licencias',                                                                      responsable: 'Erick + Soporte' },
    { area: 'Minutos que vuelven al plan', impacto: '26% de los minutos van a números ya contactados; con reglas de reintento una parte se libera',                                           responsable: 'Soporte (Integración)' },
    { area: 'Callpicker Chat sin arrancar', impacto: 'Contratado desde el 24 de agosto, con dos tickets de configuración del cliente y cero medición nuestra',                                responsable: 'Erick + Soporte (Chat)' },
    { area: 'Agente Virtual de voz',       impacto: 'El cliente ya lo preguntó en octubre; 40% de sus llamadas no contestan y las devoluciones se están cayendo',                             responsable: 'Erick + Preventa' },
  ],

  perfiles: [
    {
      nombre: 'Roberto Estrada',
      rol: 'Gerente · único contacto registrado',
      color: '#ef4444',
      campos: [
        { label: 'Contacto',        value: 'roberto.estrada@lineacel.com.mx · 725 118 5761' },
        { label: 'Qué decide',      value: 'El plan, el presupuesto y si la operación sigue en Callpicker' },
        { label: 'Último contacto', value: '8 de septiembre de 2026, en la reunión de integración. 72 días.' },
        { label: 'Qué preguntó',    value: 'El 1 de octubre: su fecha de corte y de pago, y el cobro proporcional de Chat. No se le respondió — quedó como nota interna.' },
        { label: 'Por qué importa', value: 'Es la única persona de este cliente que existe en nuestra ficha, y está a punto de ver una factura $23,420 más alta sin que nadie se lo haya anticipado.' },
      ],
    },
    {
      nombre: 'Las ocho posiciones',
      rol: 'Operación diaria del call center',
      color: '#6366f1',
      campos: [
        { label: 'Activas en octubre', value: 'Elsa López, Alexa Torres, Daniela Martínez, Alejandra Oliver, Mercedes López, Ivonne Arzate, Alondra Olivares y Paula Torres — exactamente las 8 licencias contratadas' },
        { label: 'Las que mejor conectan', value: 'Elsa López 64.0% sobre 26,249 llamadas · Alexa Torres 63.8% sobre 24,841 · Mercedes López 63.6% sobre 22,169' },
        { label: 'La que más baja',    value: 'Daniela Martínez: 53.8% sobre 24,415 llamadas, con el mismo volumen que las de arriba' },
        { label: 'Salieron',           value: 'Valeria (71.8%, la mejor tasa del periodo, hasta el 18 ago) y Wendy (69.4%, hasta el 11 ago). Su salida coincide con el inicio de la caída.' },
        { label: 'Cuidado al medir',   value: 'En septiembre se renombraron las extensiones («Elsa» → «Elsa López»). El reporte consolida ambas etiquetas por posición; cualquier medición nueva tiene que hacer lo mismo o contará personas de más.' },
      ],
    },
    {
      nombre: '«Ale Fabián» y «Campaña todas»',
      rol: 'Los dos focos de pérdida por agente',
      color: '#f59e0b',
      campos: [
        { label: 'Ale Fabián',      value: '1,209 de 3,634 llamadas perdidas por agente (33.3%). Ya no está activo: su última llamada es del 24 de septiembre.' },
        { label: 'Campaña todas',   value: '192 de 264 perdidas por agente (72.7%) — y siguió marcando en noviembre, 24 llamadas.' },
        { label: 'El resto',        value: 'Por debajo del 5% de pérdida por agente. El problema no está repartido.' },
        { label: 'La regla',        value: 'Toda campaña nueva tiene que llevar agentes asignados Y conectados. Una campaña que sobrevive a la persona que la operaba sigue quemando prospectos.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Doce tickets en la mesa de ayuda y CERO fallas del servicio en seis meses.',
      'Uso intensivo y constante: ~1,443 llamadas por día operado durante 126 días, sin un mes en blanco.',
      'Marcador automático vía API maduro: 83% del volumen al 65.2% de conexión, con adopción calificada «alta».',
      'Las 8 licencias están ocupadas: 8 posiciones activas en octubre, sin asientos ociosos.',
      'Alcance amplio: 103,499 números distintos, el 79.2% contactado al menos una vez, 1.76 intentos por número.',
      'Pagos al corriente y cero incidencias de pago (`score_pago` 50 — no el 100 que publicaba el reporte).',
    ],
    oportunidades: [
      'Volver al 70% de conexión de jun–jul sin aumentar llamadas ni licencias.',
      'Terminar de prender Callpicker Chat, que paga desde el 24 de agosto y sobre el que el propio cliente abrió dos tickets en octubre.',
      'Agente Virtual de voz para atender a quien devuelve la llamada — el cliente ya lo preguntó en la mesa en octubre.',
      'Reglas de reintento y enfriamiento: hasta un 26% de los minutos va a números que ya habían contestado.',
      'Dimensionar el plan antes de que un corte lo rebase, con la serie de los seis cortes delante.',
    ],
    debilidades: [
      'La conexión bajó 19.6 puntos: 70.0% en junio → 50.6% en septiembre; 58.5% en octubre y 54.7% en el parcial de noviembre.',
      'La marcación manual creció de 358 llamadas en junio a 11,322 en septiembre (34.3%) y conecta la mitad que el marcador.',
      'Campañas disparando a las 9:00/9:20/9:40 sin agentes: 522 de 529 llamadas perdidas por agente.',
      'Cero reuniones vinculadas, cero de doce del Radar, cero observaciones del KAM y el último contacto que llegó al cliente es del 8 de septiembre.',
      'Llamadas muy cortas (mediana conectada 36 s): el consumo depende del número de llamadas, no de la conversación.',
      'El consecutivo de la cuenta es «C», sin número: la única así de las 224 de cartera.',
    ],
    amenazas: [
      'Cuenta de seis meses, en plena etapa de valor percibido: si asocia la caída de conexión con la plataforma, sube el riesgo de cancelación.',
      'La factura de noviembre son $37,222 contra $13,802 el mes anterior, y el cliente preguntó por su corte el 1 de octubre sin recibir respuesta.',
      'Fricción abierta por el cobro proporcional de Chat, sin cierre documentado.',
      'El importe de esta cuenta no es estable: Downgrade de $23,420 en el corte del 2 de octubre y alza del mismo importe en el del 16 de noviembre.',
      'Marcación masiva a celulares puede elevar el etiquetado del número como spam y bajar aún más la contestación (hipótesis a validar).',
      'Rotación de asientos y renombres de extensiones dificultan medir desempeño por persona.',
    ],
  },

  conclusion:
    'El reporte que se le entregó a LINEACEL el 12 de noviembre acierta en su tesis y está bien medido: no hay problema de volumen, hay problema de eficiencia. Marca lo mismo que en junio —~1,440 llamadas diarias— y conecta 19.6 puntos menos. Y la validación es sólida: los cinco meses que ese documento comparte con nuestra propia fuente de llamadas cuadran al récord, registro por registro, descontando los cinco sin desenlace que excluye. Eso no es poco: casi ningún reporte entregado soporta ese contraste.\n\nLo que hay que añadir es lo que su alcance no le permitía ver, y pesa más que la gráfica. La factura de noviembre son $37,222 y la ficha de la que el reporte tomó sus datos de cuenta decía $13,802. El alza son $23,420 en un mes, ya facturados. El propio FODA del reporte pone como amenaza futura que «rebasar el plan genera cobros que el cliente no espera»; esa amenaza ya ocurrió. Y el 1 de octubre el cliente nos había escrito justamente para confirmar su fecha de corte y de pago, con una fricción abierta por el cobro proporcional de Chat. Se quedó sin respuesta, registrado como nota interna. Desde el 8 de septiembre ningún contacto nuestro ha llegado a Roberto Estrada: van 72 días, con `silencio_60` crítica desde el 8 de noviembre.\n\nY hay que empezar por lo que funciona, porque es verdad y porque es poco común: doce tickets y cero fallas del servicio en seis meses. El marcador automático mueve el 83% del volumen y conecta al 65.2%. Las ocho licencias están ocupadas. Esta cuenta no tiene un problema con el producto.\n\nLa lección es la de la ficha, otra vez, pero con un giro. En ODONTOPREV el importe de la ficha era un promedio de vida y escondía una cuenta grande. Aquí es el `mrrIni` del corte vigente —el mes anterior— y escondió una cuenta que acababa de triplicar su factura. Con $13,802 esta cuenta no era TOP y sus cuatro alertas se abrieron sin esa marca; con $37,222 las cuatro la llevan. El motor no la ascendió cuando apareció el riesgo: la ascendió cuando el GRC movió el número. Y el reporte que la auditó heredó de esa misma ficha el importe, el score de pago y hasta el nombre de la asesora que dejó la cartera un mes antes.\n\nNada de eso es culpa de quien escribió el documento. Es que la ficha no obliga a nada, y un reporte que declara honestamente de dónde saca sus datos de cuenta —«vienen de la ficha del tablero SAC»— hereda también sus errores. Por eso este expediente lleva las diez correcciones aplicadas y visibles dentro del propio documento publicado, y por eso el guion que las vigila sabe ponerse en rojo: se probó rompiéndolo de once maneras y las cazó todas.',

  pierde: [
    'Un cliente AAA de seis meses que factura $37,222 al mes y está en la etapa en que se decide si percibe valor.',
    'La relación con el único contacto que tenemos, que preguntó algo el 1 de octubre y no obtuvo respuesta.',
    'La oportunidad de que la factura la explique Callpicker antes de que el cliente la descubra solo.',
    'Dos módulos que el cliente ya intentó encender por su cuenta —Chat y Agente Virtual— y que se le quedaron a medias con soporte.',
  ],

  gana: [
    '19 puntos de conexión recuperables sin vender una licencia más, con el nivel de junio y julio como prueba de que la operación puede.',
    'Una conversación de dimensionamiento que llega antes del excedente y no después, con la serie de los seis cortes como evidencia.',
    'Hasta un 26% de los minutos liberables con reglas de reintento y enfriamiento en la integración.',
    'Un caso de IA de voz que no hay que vender porque el cliente ya lo pidió, y que se sostiene con sus propias devoluciones perdidas.',
  ],

  recomendacion_central:
    'Llamar a Roberto Estrada esta semana y abrir por la factura, no por la gráfica: el importe de noviembre, su desglose, la serie de los seis cortes de minutos y la respuesta a lo que preguntó el 1 de octubre. Llevar primero lo que funciona —cero fallas del servicio en seis meses— y después la caída de 19 puntos, presentando su causa como HIPÓTESIS y pidiéndole la pieza que sólo él tiene: por qué todas sus posiciones empezaron a marcar a mano en septiembre. Y llegar con el cambio de horario de las campañas de las 9:00 ya hecho, porque cuesta cero y devuelve 522 llamadas.',

  documentos: [
    {
      nombre: 'Auditoría de llamadas salientes 2026 · conciliada (HTML)',
      ruta: '/auditorias/Auditoria-LINEACEL-Salientes-2026.html',
      descripcion: 'El reporte entregado el 12 nov 2026, con 10 correcciones aplicadas y VISIBLES dentro del documento y 7 desfases declarados por clave. Recalculable con `scripts/concilia-auditoria-lineacel.py`.',
    },
  ],
}
