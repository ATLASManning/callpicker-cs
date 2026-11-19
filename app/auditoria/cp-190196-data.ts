import type { AuditoriaCase } from './types'

/**
 * CP 190196 · Ingeniería Mantenimiento y Desarrollo Informático
 * Anexo al diagnóstico del ciclo de compra · v1.0 (19 nov 2026)
 *
 * Documento entregado: «Una venta de 14 minutos que murió en 27 días»
 * (public/auditorias/Caso-CP-190196-Ciclo-de-Compra-2026.html). Fuentes que
 * declara: Zoho CRM (contacto y oportunidad), canal de Activaciones, Zoho Desk
 * #119093 y el análisis automático de llamada de la plataforma.
 *
 * ── POR QUÉ VA EN EL MISMO APARTADO QUE VIAJES MACULL ─────────────────────
 * Instrucción de dirección del 19 nov 2026. Y además es su pareja exacta: las
 * dos nacieron cancelando, ninguna llegó a `cuentas`, ninguna tiene
 * consecutivo ni KAM, y las dos son anexos del mismo diagnóstico del ciclo de
 * compra. `asesor: null` es el dato, no un hueco.
 *
 * ── POR QUÉ `en_riesgo` Y NO `perdido` ────────────────────────────────────
 * El cliente pidió la baja el 3 nov y rechazó la retención el 4 nov. Pero
 * NINGUNA fuente nuestra consuma la baja:
 *   · el GRC vivo trae la fila con `mrrFin: 0` y la rotula «Por confirmar
 *     (corte de datos)», que NO es pérdida sino falta de dato — y el cubo que
 *     la guarda agrega pérdida $0;
 *   · el folio #119093 no está en nuestra exportación de tickets, que sólo
 *     trae CERRADOS;
 *   · no está en `cuentas`, así que tampoco hay un `estado` que mover.
 * Escribir «perdido» aquí sería consumar una baja que nadie autorizó. Un
 * expediente documenta un riesgo; no da de baja a nadie. Pasa a `perdido` el
 * día que el GRC la rotule «Desactivado» o que el ticket cierre como baja.
 *
 * ── LO QUE LAS FUENTES NUESTRAS AÑADEN AL DOCUMENTO ───────────────────────
 * Medido el 19 nov 2026 sobre `data/grc-zoho.json` (corte GRF.xlsx, mes vivo
 * Noviembre, 3,670 filas), `data/activaciones.xlsx` (2,820 filas, 1,866
 * pagadas) y `lib/tickets-data.json` (8,281 tickets cerrados, aperturas hasta
 * el 14 nov 2026). El guion de medición vivió en el scratchpad de la sesión;
 * las cifras se reproducen con esas tres fuentes y los filtros que se declaran
 * en cada hallazgo.
 *
 *  1. LA FILA EXISTE Y NADIE LA CUENTA. En el GRC vivo:
 *       cliente «Ingeniera Mantenimiento y Desarrollo Informatico»
 *       clasif C · rango $1 - $300 · facturas 1 · meses 0
 *       acumulado $209 · mrrIni $209 · mrrFin $0 · perdida $209
 *       movimiento «Por confirmar (corte de datos)» · cid null · enCartera false
 *     El documento dice que la cuenta «no aparece en el corte de churn». Lo
 *     medido es más preciso: SÍ aparece, con su pérdida de $209 escrita en la
 *     fila — pero el cubo «Por confirmar (corte de datos)» (1,004 filas) suma
 *     pérdida $0 en el agregado. No está ausente: está sin confirmar. Es un
 *     matiz que cambia la acción — no hay que meterla al corte, hay que
 *     confirmarla.
 *
 *  2. NO ES UNA CUENTA, SON TREINTA Y SEIS. Filtrando el GRC vivo por
 *     `facturas == 1 && mrrIni > 0 && mrrFin == 0` salen 36 filas, 36 clientes
 *     distintos, sin un solo nombre repetido. Las 36 caen en el mismo cubo
 *     «Por confirmar (corte de datos)». Suman $42,753 de mrrIni. 35 tienen
 *     `meses: 0`. Sólo 2 están en cartera.
 *     CP 190196 es la número 30 por importe. Las once del rango $1-$300 suman
 *     $2,265: el 94.7% del dinero —$40,488— está en las otras 25, con BATTERY
 *     MART a $7,024 y Casa del Sol Apartments a $5,160. El caso se discute por
 *     $209 y el patrón que describe vale $42,753.
 *
 *  3. LA ACTIVACIÓN SALIÓ EN VERDE, Y ÉSE ES EL HALLAZGO. En
 *     `data/activaciones.xlsx`: Complejidad «sencillo», que es el 67.0% del
 *     corte (1,250 de 1,866); 8 días de activación; Ejecutivo Cecilia (647
 *     activaciones pagadas en el corte); Tipo pagada; Giro servicios;
 *     Portabilidad «no»; ticket abierto el 7 oct y cerrado el 15 oct.
 *     Es el ESPEJO de Viajes Macull, que murió con la complejidad «muy
 *     difícil» —15 de 1,866, el 0.8%— y 26 días. Dos cuentas que mueren igual,
 *     una con todas las alarmas encendidas y otra con todo en verde. La señal
 *     de activación no predice la muerte de la cuenta: eso no se podía decir
 *     con un solo caso.
 *
 *  4. LOS 8 DÍAS NO SON RÁPIDOS: SON NORMALES. El documento no los compara. La
 *     mediana histórica de las 1,866 pagadas es 14 días y el promedio 19.7, así
 *     que 8 parece bueno — pero la mediana de SU PROPIA COHORTE (33 pagadas con
 *     primer pago en octubre 2026) es 7 días. Contra su mes, 8 es del montón.
 *     Comparar contra la mediana histórica habría fabricado un elogio.
 *
 *  5. $209 ES EL SUELO DE SU COHORTE, Y NO ESTÁ SOLO AHÍ. Percentil 12 sobre
 *     las 1,866 pagadas (mediana $489). Dentro de la cohorte de octubre 2026:
 *     NINGUNA de las 33 pagó menos, y NUEVE pagaron exactamente $209 — el mismo
 *     CE60. La mediana de esa cohorte es $1,029. Si «venta de 14 minutos» es un
 *     patrón, tiene ocho hermanas del mismo mes y del mismo precio donde
 *     buscarlo.
 *
 *  6. «SIN VENDEDOR» NO ES UN HUECO DE ESTA FILA. El documento atribuye el
 *     cierre a Ventas con nota firmada; Activaciones 2.0 guarda Vendedor «Sin
 *     vendedor». No es contradicción: son dos sistemas. Pero el campo está
 *     vacío o en «Sin vendedor» en 549 de 1,866 pagadas —el 29.4%—, así que
 *     cualquier medición de «qué vendedor trae cuentas que mueren» arranca con
 *     tres de cada diez filas ciegas.
 *
 *  7. EL TICKET DE CANCELACIÓN: INDICIO, NO PRUEBA. El folio 119093 NO está en
 *     `lib/tickets-data.json`, que sólo trae CERRADOS y cubre aperturas hasta
 *     el 14 nov 2026 (folios del 280 al 120,276). Sus vecinos inmediatos 119089
 *     y 119094 SÍ están. Eso apunta a que el ticket seguía abierto al corte.
 *     NO es prueba: en la banda 119000-119200 falta el 43.3% de los folios
 *     (114 de 201 presentes), así que la ausencia admite otra lectura. Se dice
 *     como indicio porque medir la densidad fue lo que impidió venderlo como
 *     hallazgo.
 *
 * ── TRES CIFRAS DEL DOCUMENTO QUE NO SE REPRODUCEN TAL CUAL ───────────────
 *
 *  a) «7 de 7 llamadas salientes perdidas» (tarjeta y tabla del apartado 05)
 *     contra la cronología del mismo documento, que enumera OCHO salientes:
 *     1 el 14 sep, 1 el 18 sep, «tres llamadas» el 7 oct a las 10:06 y tres más
 *     de Ventas entre 10:17 y 10:19. El propio renglón de las 10:06 dice «tres
 *     llamadas» y lista sólo DOS duraciones («9 y 10 segundos»), que es
 *     probablemente de dónde sale la diferencia. No se puede resolver desde el
 *     documento. Lo que no cambia en ninguna lectura es el 100%: ninguna
 *     saliente conectó. El expediente publica el 100% y declara el desacuerdo.
 *
 *  b) «los 52 días del ciclo comercial». Del lead (12 sep) al cierre (7 oct)
 *     hay 25 días, que es lo que el propio documento usa dos tarjetas más
 *     abajo («8 intentos en 25 días»). Los 52 son del lead a la cancelación.
 *     El expediente dice 25 días de ciclo comercial y 52 de vida total.
 *
 *  c) «14:46 es todo el tiempo que alguien de Callpicker habló con este
 *     cliente». Es cierto dentro del ciclo comercial. Fuera de él hubo al menos
 *     una conversación más: la llamada de retención del 4 nov por WhatsApp. El
 *     expediente acota la frase al ciclo de venta.
 *
 * ── LO QUE NO SE PUDO MEDIR, DICHO CON PALABRAS ───────────────────────────
 * De Zoho CRM no tenemos fuente en el repositorio: los 8 intentos de
 * perfilamiento, las duraciones de 9 a 42 segundos, los 5 min 36 s en buzón,
 * el motivo «No hay asesores disponibles (no contestan)», los campos vacíos del
 * formulario y el análisis de IA de la llamada vienen del documento y se citan
 * como suyos. No están verificados contra una fuente nuestra y así se dicen.
 * El «32.3% de mortalidad de la cohorte 2026» pertenece al diagnóstico general
 * del ciclo de compra, que tampoco está en el repositorio: se atribuye, no se
 * reproduce como medición propia.
 * El margen de «unos $125 al 60%» es un supuesto del documento; $209 × 0.60 =
 * $125.40 cierra, pero el 60% no está verificado contra ninguna fuente.
 */
export const CP_190196: AuditoriaCase = {
  id:                    'cp-190196',
  asesor:                null,
  nombre:                'CP 190196 · Ingeniería Mantenimiento y Desarrollo Informático',
  sector:                'Servicios — microempresa de mantenimiento y desarrollo informático, 2 a 5 personas',
  fecha_periodo:         '12 Septiembre – 4 Noviembre 2026 · 52 días de vida, 27 desde el pago',
  fecha_auditoria:       'Nov 2026',
  tipo_cliente:          'NACIÓ CANCELANDO · CP 190196 · sin consecutivo, sin CID y fuera de cartera · una sola factura de $209',
  descripcion_contexto:  'Anexo al diagnóstico del ciclo de compra · Pago 07/Oct · baja pedida 03/Nov · retención rechazada 04/Nov',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  /* Los cuatro KPIs reutilizan los hexadecimales que ya usan los demás
     expedientes. No entra un color nuevo al sistema: el contraste de esta
     pantalla se calcula contra el fondo real y un tono inventado aquí se
     saltaría esa medición. */
  kpis: [
    { label: 'El patrón que este caso describe, medido en el GRC', value: '$42,753',  color: '#ef4444' },
    { label: 'Cuentas con UNA factura y nadie las cuenta',          value: '36',       color: '#f97316' },
    { label: 'Conversación comercial en todo el ciclo',             value: '14:46',    color: '#f59e0b' },
    { label: 'Ingreso total de la relación',                        value: '$209',     color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'Un lead de Facebook del 12 de septiembre tardó 25 días y ocho intentos en llegar a una conversación. Cuando llegó, duró catorce minutos y cuarenta y seis segundos, y la oportunidad se creó como Contrato Firmado dos minutos y veintidós segundos después de colgar. Se vendió un plan de telefonía de 60 minutos. Veintisiete días después, el cliente pidió la baja porque su operación no usa llamadas.\n\n' +
    'Eso ya estaba escrito el día de la venta. El análisis automático de la propia llamada —en el mismo expediente que el asesor usó para cerrar— dice que el interés era integrar CRM y WhatsApp. El formulario de la oportunidad tiene un campo llamado «¿Cuántas llamadas reciben y hacen al día?» y quedó vacío. El 4 de noviembre, para retenerlo, se le ofreció vincular la línea a WhatsApp: exactamente lo que el sistema había detectado veintiocho días antes.\n\n' +
    'Lo que las fuentes nuestras añaden es el tamaño. En el corte vivo del GRC hay 36 cuentas con UNA sola factura y facturación actual en cero, 36 clientes distintos, $42,753 entre todas. Las 36 están rotuladas «Por confirmar (corte de datos)», un cubo cuya pérdida agregada es $0. Ésta es la única de las 36 de la que existe trazabilidad completa, y por eso vale lo que vale: no documenta $209, documenta un punto ciego de $42,753 que nadie está contando.\n\n' +
    'Y hay una segunda lectura que un solo caso no permitía. Su activación salió en verde —complejidad «sencillo», que es el 67% del corte, ocho días, capacitación impartida y cliente agradecido— mientras Viajes Macull murió con la complejidad «muy difícil», el peor 0.8%, y 26 días. Dos cuentas que mueren igual con señales opuestas: la activación no predice nada, y ninguna de las dos se podía salvar desde ahí.',

  resultado_positivo:
    'La trazabilidad completa es el activo de este caso. Es la única de las 36 cuentas de una sola factura donde se puede reconstruir, con hora y nombre, cada paso desde el clic en Facebook hasta el correo de cancelación. Eso convierte una anécdota en evidencia utilizable para instalar reglas.\n\n' +
    'Activación hizo un trabajo correcto y documentado: capacitación, app instalada, ticket cerrado en ocho días sobre una complejidad que el sistema marcó «sencillo», y el cliente lo agradeció por escrito. No hay nada que corregir ahí, y decirlo importa: sin esta frase, el caso se lee como un reclamo a Activaciones.\n\n' +
    'Perfilamiento tampoco falló por falta de esfuerzo: ocho intentos en 25 días, cada uno registrado con su motivo. Y el sistema que detectó lo que el cliente quería —el análisis automático de la llamada— ya está pagado y ya funciona. No falta herramienta.',

  hallazgos: [
    /* EL ORDEN ES UNA DECISIÓN DE PRODUCTO, NO ESTÉTICA. `lib/atlas-context.ts`
       mete en el dossier SÓLO los primeros hallazgos y recorta cada uno; lo que
       cae fuera existe para una persona y no existe para el modelo. Los cuatro
       primeros están escritos para cerrar su afirmación dentro del recorte:
       el tamaño real del caso, que Activaciones no es la causa, qué falló en la
       venta, y que la baja NO está confirmada por ninguna fuente nuestra —que
       es lo único que impide que alguien escriba «perdida» y la consume.
       Lo comprueba `scripts/revisa-dossier-auditoria.mjs cp-190196`. */
    'DINERO — No es un caso de $209. El GRC vivo trae 36 cuentas con UNA factura y facturación en cero, $42,753 entre todas, en un cubo que agrega pérdida cero. Nadie las cuenta.',
    'ACTIVACIÓN NO ES LA CAUSA — Salió «sencillo», el 67% del corte: 8 días y cliente agradecido. Murió igual. Viajes Macull murió con «muy difícil», el 0.8%. No predice nada.',
    'LA VENTA — 14:46 de conversación y la oportunidad cerrada 2:22 después. La IA del mismo día dijo CRM y WhatsApp; se vendió telefonía. «¿Cuántas llamadas al día?» quedó vacío.',
    'LA BAJA NO ESTÁ CONFIRMADA — Ninguna fuente nuestra la consuma: el GRC la rotula «Por confirmar» y el folio 119093 falta en el export de CERRADOS. Indicio, no prueba.',

    'H5 · El embudo existe, está diseñado y se saltó entero. El CRM tiene definidas Calificación, Análisis de Necesidades, Propuesta, Prueba, Negociación y En espera de pago. Esta oportunidad pasó de calificación a «Contrato Firmado — Cierre Logrado» el mismo día. Y el catálogo de cierre perdido contiene, redactada por la empresa, la causa exacta de esta cancelación: «Su necesidad era otra».',
    'H6 · El campo que decidía todo quedó vacío. «¿Cuántas llamadas reciben y hacen al día?» está en el formulario, diseñado y disponible. La respuesta era «casi ninguna», y con ella un plan de 60 minutos no se vende. Junto a él quedaron vacíos «¿Requieren integración con Teams o CRM?» y «¿Requieren el servicio de CP Chat?», que son justo los dos temas que el análisis de la llamada había detectado.',
    'H7 · El sistema dijo lo que el cliente quería y nadie lo usó. El análisis automático del 7 de octubre registró: integrar CRM con líneas telefónicas y WhatsApp, con esos tres como temas recurrentes. El asesor escribió el mismo día «van iniciando y requieren algo básico. Se ofrece CE 60». La herramienta ya está pagada y ya corre: lo que falta no es tecnología, es que su lectura obligue a algo.',
    'H8 · Veintiocho días tarde, se ofreció lo correcto. El 4 de noviembre, para retener, se propuso vincular la línea a WhatsApp. Es la misma conclusión que el sistema había escrito el día de la venta. El cliente la rechazó: para entonces ya había decidido, y la razón que dio —«su operación no requiere, en su mayoría, del uso de llamadas»— es la misma que estaba en el formulario desde el primer día.',
    'H9 · «Sonar profesional». Alguien escribió eso en el campo «Rol del contacto en la compra». El campo está mal usado, pero el contenido es la declaración más precisa del expediente: el cliente no compraba capacidad de llamadas, compraba imagen. Una microempresa de dos personas que opera por correo y quiere un número que suene serio. Treinta días después canceló diciendo exactamente eso.',
    'H10 · La ironía operativa: una empresa que vende conmutadores perdió todas las llamadas que hizo. Según el documento, ninguna saliente conectó, con duraciones de 9 a 42 segundos; el prospecto llamó por su cuenta y pasó 5 minutos 36 segundos en un buzón; y Perfilamiento dejó escrito el motivo en el CRM: «No hay asesores disponibles (no contestan)». Un mes después hubo que buscarlo por WhatsApp «ya que en su línea directa no había contestación». Las dos únicas conversaciones las abrió el cliente.',
    'H11 · El conteo de salientes no cuadra consigo mismo, y se dice. La tarjeta y la tabla del documento dicen 7 de 7; la cronología del mismo documento enumera 8, y el renglón de las 10:06 dice «tres llamadas» listando dos duraciones. No se resuelve desde el documento y no se publica una de las dos como si fuera la buena. Lo que sobrevive a las dos lecturas es el 100%: ninguna saliente conectó.',
    'H12 · Ocho días de activación no son rápidos: son del montón. El documento no los compara. Contra las 1,866 activaciones pagadas del corte parecen buenos —mediana 14, promedio 19.7—, pero la mediana de su propia cohorte (33 pagadas con primer pago en octubre 2026) es 7. Elegir el denominador histórico habría fabricado un elogio.',
    'H13 · $209 es el suelo de su cohorte y hay nueve cuentas ahí. Percentil 12 sobre las 1,866 pagadas, cuya mediana es $489. Dentro de octubre 2026 ninguna de las 33 pagó menos y NUEVE pagaron exactamente $209, el mismo CE60; la mediana del mes es $1,029. Si «venta de 14 minutos» es un patrón, tiene ocho hermanas del mismo mes y del mismo precio donde comprobarlo.',
    'H14 · El 94.7% del dinero del patrón está en cuentas grandes, no en ésta. De los $42,753 de las 36 cuentas de una sola factura, las once del rango $1-$300 suman $2,265. Los otros $40,488 están en 25 cuentas mayores: BATTERY MART con $7,024, Casa del Sol Apartments con $5,160, JrIntercontrol con $3,439. Discutir el patrón con el caso de $209 subestima lo que vale corregirlo.',
    'H15 · «Sin vendedor» en el 29.4% de las activaciones pagadas. Activaciones 2.0 guarda Vendedor «Sin vendedor» en esta fila, mientras el documento atribuye el cierre a Ventas con nota firmada. No es contradicción —son dos sistemas—, pero el campo está vacío o en «Sin vendedor» en 549 de 1,866 filas, así que cualquier medición de qué vendedor trae cuentas que mueren arranca con tres de cada diez filas ciegas.',
    'H16 · No está en ninguna de nuestras tablas de cliente. No tiene fila en `cuentas`, ni contrato en `data/contratos.json`, ni números en `data/dids.json`, ni CID en el GRC —la fila se encuentra por nombre—. Se vendió y se perdió antes de asignarse a un KAM. Es el mismo patrón de Viajes Macull y de RDS: las cuentas que mueren antes de entrar a cartera no las mira nadie porque no son de nadie.',
  ],

  cronologia: [
    { fecha: '12/09 17:56', responsable: 'Marketing (Facebook Ads)', evento: 'Nace el lead por campaña pagada. Microempresa de 2 a 5 personas. Necesidad declarada: «número empresarial para poder comunicarse con sus clientes para ventas». Implementación de 1 a 3 semanas.', tipo: 'neutral' },
    { fecha: '14/09 08:14', responsable: 'Perfilamiento',            evento: 'Intento 1: llamada saliente perdida de 16 segundos, número ocupado. Se envía WhatsApp.', tipo: 'problema' },
    { fecha: '17/09',       responsable: 'Perfilamiento',            evento: 'Intento 3: se envía por WhatsApp la información del servicio. Sin respuesta. (El intento 2 no aparece enumerado en el documento.)', tipo: 'problema' },
    { fecha: '18/09 11:04', responsable: 'Perfilamiento',            evento: 'Intento 4: saliente perdida de 42 segundos. «Suena varias veces pero no contesta la llamada y los WhatsApp no los contestó.»', tipo: 'problema' },
    { fecha: '19/09 – 06/10', responsable: '—',                      evento: 'Diecinueve días sin un solo registro de actividad sobre un lead de campaña pagada.', tipo: 'problema' },
    { fecha: '07/10 10:06', responsable: 'Perfilamiento',            evento: 'El prospecto regresa por chat con otro número y PIDE que le llamen. Salientes perdidas de 9 y 10 segundos. «No pude comunicarme, pide que le marque otra vez y nuevamente dice que el número está ocupado.»', tipo: 'problema' },
    { fecha: '07/10 10:09', responsable: 'Recibe Perfilamiento',     evento: 'El cliente llama y cae en buzón de voz: 5 minutos y 36 segundos esperando, con tres grabaciones en el expediente.', tipo: 'problema' },
    { fecha: '07/10 10:17', responsable: 'Perfilamiento',            evento: 'Intento 8: se califica sin poder transferir. Motivo registrado en el CRM: «No hay asesores disponibles (no contestan)». Estado E4, SQL transferido.', tipo: 'problema' },
    { fecha: '07/10 10:17–10:19', responsable: 'Ventas',             evento: 'Tres salientes perdidas de 10, 10 y 9 segundos. «Número ocupado, se envía WA para iniciar contacto.»', tipo: 'problema' },
    { fecha: '07/10 10:19:52', responsable: 'Ventas',                evento: 'LA ÚNICA CONVERSACIÓN DEL CICLO. Entrante, la marca el cliente, contestada, 14 minutos y 46 segundos. Veinticinco días después de que entró el lead.', tipo: 'pivote' },
    { fecha: '07/10 ~10:35', responsable: 'Plataforma (análisis IA)', evento: 'El análisis automático de esa llamada queda en el expediente: interés en integrar CRM con líneas telefónicas y WhatsApp. Temas recurrentes: CRM, comunicación con clientes, WhatsApp.', tipo: 'pivote' },
    { fecha: '07/10 10:37', responsable: 'Ventas',                   evento: 'Oportunidad creada Y cerrada: Contrato Firmado, Cierre Logrado, 100%, $209. Dos minutos y veintidós segundos después de colgar. Nota completa: «Se resuelven dudas de uso y funcionalidad, sería para 2 personas, van iniciando y requieren algo básico. Se ofrece CE 60.»', tipo: 'problema' },
    { fecha: '07/10',       responsable: 'Activaciones 2.0',         evento: 'Fila 190196 abierta el mismo día del pago. Tipo pagada, $209, tamaño micro, giro servicios, Complejidad «sencillo», Ejecutivo Cecilia, Vendedor «Sin vendedor», Portabilidad «no».', tipo: 'neutral' },
    { fecha: '15/10',       responsable: 'Activaciones',             evento: 'Ticket cerrado a los 8 días: «Se activó cuenta brindando capacitación, se instaló app en CP. Cliente agradece el servicio y comenta que ya sería todo.» Trabajo correcto y documentado.', tipo: 'ok' },
    { fecha: '03/11 16:33', responsable: 'El cliente',               evento: 'Escribe a la mesa de ayuda (Zoho Desk #119093): «solicito de su ayuda para implementar la cancelación del servicio… debido a que no ocuparemos más la línea». 27 días después del pago.', tipo: 'problema' },
    { fecha: '03/11 16:58', responsable: 'SAC',                      evento: 'Se escala para intento de retención ofreciendo vincular la línea a WhatsApp. Constancia interna: «solo pagó una vez y prácticamente solo hizo pruebas, por lo que es importante la retro».', tipo: 'pivote' },
    { fecha: '04/11 13:51', responsable: 'SAC · retención',          evento: 'Hay que buscarlo por WhatsApp «ya que en su línea directa no había contestación». El cliente explica que se comunica por correo, que el uso fue muy bajo y que su operación no requiere, en su mayoría, del uso de llamadas. RECHAZA la alternativa de WhatsApp.', tipo: 'problema' },
    { fecha: '14/11',       responsable: 'Mesa de ayuda (medido)',   evento: 'Corte de la exportación de tickets CERRADOS. El folio 119093 no está en ella y sus vecinos 119089 y 119094 sí: indicio de que el ticket de cancelación seguía abierto, no prueba — en esa banda falta el 43% de los folios.', tipo: 'problema' },
    { fecha: '16/11',       responsable: 'GRC (medido)',             evento: 'El corte vivo ya trae la fila: una factura, cero meses, $209 de pérdida escrita, rotulada «Por confirmar (corte de datos)». El cubo que la guarda agrega pérdida $0. La baja no la consuma ninguna fuente nuestra.', tipo: 'problema' },
    { fecha: '19/11',       responsable: 'Dirección SAC',            evento: 'Expediente abierto. Decisión pendiente: confirmar o desmentir la baja de ésta y de las otras 35 cuentas de una sola factura, que suman $42,753 sin contarse.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Identificador',        value: 'CP 190196 · fila 190196 en Activaciones 2.0, Tipo pagada' },
    { label: 'Nombre en las fuentes', value: 'Activaciones y GRC lo guardan como «Ingeniera Mantenimiento y Desarrollo Informatico», sin acentos. El rótulo del expediente usa la ortografía correcta.' },
    { label: 'En cartera',           value: 'NO. Sin fila en `cuentas`, sin consecutivo, sin KAM y sin CID: en el GRC se encuentra por nombre, no por llave.' },
    { label: 'Giro',                 value: 'Servicios — mantenimiento y desarrollo informático. Microempresa de 2 a 5 personas que opera por correo.' },
    { label: 'Origen del lead',      value: 'Formulario de Facebook Ads · 12/Sep/2026 17:56 · «número empresarial para poder comunicarse con sus clientes para ventas»' },
    { label: 'Plan contratado',      value: 'Comunicación Empresarial 60 minutos (CE60) · $209 MXN · una sola factura' },
    { label: 'Primer pago',          value: '$209 el 07/Oct/2026 — percentil 12 de las 1,866 pagadas (mediana $489) y SUELO de su cohorte de octubre, empatado con otras ocho' },
    { label: 'Días de activación',   value: '8 · mediana histórica 14, promedio 19.7 — pero la mediana de su cohorte de octubre 2026 es 7' },
    { label: 'Complejidad registrada', value: '«Sencillo» — 1,250 de 1,866 pagadas (67.0%). El caso opuesto a Viajes Macull, que fue «muy difícil» (0.8%).' },
    { label: 'Ejecutivo de activación', value: 'Cecilia — 647 activaciones pagadas en el corte' },
    { label: 'Vendedor',             value: '«Sin vendedor» en Activaciones 2.0. No es exclusivo de esta fila: 549 de 1,866 pagadas (29.4%) están igual.' },
    { label: 'GRC · corte vivo',     value: 'clasif C · rango $1-$300 · facturas 1 · meses 0 · acumulado $209 · mrrIni $209 · mrrFin $0 · perdida $209 · movimiento «Por confirmar (corte de datos)»' },
    { label: 'Ticket de cancelación', value: 'Zoho Desk #119093, abierto el 03/Nov. NO MEDIBLE si se procesó: nuestra exportación sólo trae CERRADOS y no lo incluye.' },
    { label: 'Vida de la cuenta',    value: '52 días del lead a la cancelación · 27 días del pago a la solicitud de baja · 25 días de ciclo comercial' },
  ],

  necesidad_negocio:
    'La necesidad real está escrita tres veces en el expediente y ninguna se trabajó. En el formulario, el motivo de compra quedó anotado como «Sonar profesional»: una microempresa de dos personas que opera por correo y quiere un número que suene serio. En la llamada, el análisis automático detectó integrar CRM con líneas telefónicas y WhatsApp. Y en la cancelación, el cliente lo dijo en voz alta: su operación no requiere, en su mayoría, del uso de llamadas.\n\n' +
    'Las tres apuntan al mismo sitio y ninguna apunta a minutos de telefonía. Lo que se vendió —60 minutos de voz— es el único producto del catálogo que no resolvía nada de eso. No cambió de opinión en treinta días: nadie le preguntó cuántas llamadas hace al día, que es el campo que el formulario ya tenía y que habría cerrado la venta en otra dirección o la habría impedido.',

  potencial_corto: [
    'Confirmar o desmentir la baja de esta cuenta y de las otras 35 de una sola factura: hoy el GRC las rotula «Por confirmar» y el agregado las cuenta como pérdida cero, así que $42,753 no están en ninguna cifra de churn.',
    'Revisar las ocho cuentas que pagaron exactamente $209 en octubre 2026: si «venta de catorce minutos» es un patrón, es ahí donde se comprueba con datos y no con un caso.',
    'Volver a tocar esta cuenta una sola vez, sobre lo que el sistema ya detectó —CRM y WhatsApp—, no sobre el conmutador que no usa. Es una conversación distinta a la que rechazó el 4 de noviembre.',
    'Cerrar el folio 119093 con un desenlace explícito, para que la mesa de ayuda tenga registrado si la baja se procesó y en qué fecha.',
  ],

  potencial_largo: [
    'Un indicador de leads pagados que mueren antes de llegar a Ventas: ocho intentos y 25 días para una conversación que cerró en quince minutos. Hoy no se mide cuántos se pierden en ese tramo ni cuántas prospecciones se caen por no haber asesor disponible.',
    'Que el análisis automático de la llamada sea insumo del cierre y no adorno del expediente: la herramienta ya está pagada y ya corre, y su lectura no obliga a nada.',
    'Medir la cohorte de cuentas de una sola factura como una categoría propia, con dueño. Son 36 cuentas y $42,753 que hoy no aparecen en ninguna conversación de churn porque no están en cartera y no son de nadie.',
    'Vincular el campo de consumo declarado con el plan que se vende, para que un plan de minutos no se pueda cerrar sobre un consumo de «casi ninguna llamada».',
  ],

  tacticas: [
    { nombre: 'Confirmar las 36, no sólo ésta',
      descripcion: 'Tomar la lista del GRC vivo —una factura, facturación en cero— y resolver cada fila: baja real, error de corte o cuenta viva. Empezar por las cinco mayores, que concentran $23,000 de los $42,753.',
      impacto: 'Convierte un cubo de «por confirmar» en una cifra de churn que se puede defender, y saca del aire $42,753 que hoy cuentan como cero.' },
    { nombre: 'Una pregunta obligatoria antes de cerrar',
      descripcion: 'El campo «¿Cuántas llamadas reciben y hacen al día?» ya existe en el formulario. Si la respuesta es «casi ninguna», el sistema no debería permitir cerrar un plan de minutos.',
      impacto: 'En este caso esa sola pregunta cambia el desenlace: o no se vende, o se vende lo que el cliente pedía y se le ofreció veintiocho días tarde.' },
    { nombre: 'Que la lectura de la IA obligue a algo',
      descripcion: 'Hacer que el cierre exija confirmar o refutar lo que el análisis de la llamada detectó. No requiere desarrollo nuevo: requiere un campo y una regla sobre una herramienta que ya se paga.',
      impacto: 'Convierte un gasto que hoy es documentación en un control de calidad de la venta.' },
  ],

  senal_alarma:
    'La señal no es esta cuenta: son las otras treinta y cinco. El corte vivo del GRC tiene 36 filas con una sola factura y facturación actual en cero, $42,753 entre todas, y el cubo «Por confirmar (corte de datos)» que las contiene suma pérdida $0 en el agregado. Treinta y cinco tienen cero meses de permanencia. Sólo dos están en cartera, así que las otras treinta y cuatro no tienen KAM que las mire.\n\n' +
    'Y hay una fecha: esta cuenta pidió la baja el 3 de noviembre y al corte de tickets del 14 de noviembre el folio seguía sin aparecer entre los cerrados. Mientras no se confirme, el expediente no puede decir que está perdida, y el tablero no puede decir que está viva.',

  problema_raiz:
    'No existe una puerta que impida vender un plan de minutos a quien no hace llamadas, ni un dueño para las cuentas que mueren antes de entrar a cartera.',

  problema_raiz_detalle:
    'Las tres áreas hicieron su trabajo según su propia definición y la cuenta murió igual. Marketing trajo un lead pagado con intención declarada. Perfilamiento insistió ocho veces en 25 días y registró cada intento con su motivo. Ventas cerró en quince minutos lo que llevaba tres semanas atorado. Activación capacitó, instaló la app y cerró el ticket en ocho días sobre una complejidad marcada «sencillo», y el cliente lo agradeció por escrito. Nadie fue dueño del resultado.\n\n' +
    'El patrón se repite en cada punto: una señal apareció, quedó registrada, y no obligó a nada. El análisis de la llamada dijo CRM y WhatsApp y la venta siguió siendo de minutos. El campo de consumo quedó vacío y el cierre se permitió igual. El embudo tiene seis etapas diseñadas y se pasó de calificación a Cierre Logrado el mismo día. El catálogo de cierre perdido ya contiene la causa exacta —«Su necesidad era otra»— y faltó el paso que la habría detectado.\n\n' +
    'Después de la muerte, el mismo silencio: la cuenta no está en `cuentas`, así que no tiene KAM; no tiene CID, así que ningún cruce automático la encuentra; y su pérdida vive en un cubo que el agregado cuenta como cero. Una cuenta que nadie mira cuando vive tampoco se cuenta cuando muere.\n\n' +
    'Y la comparación con Viajes Macull cierra el argumento. Aquélla murió con todas las alarmas encendidas —complejidad «muy difícil», el peor 0.8% del corte, 26 días de activación, portabilidad atorada—. Ésta murió con todo en verde. Las dos en menos de un mes. La señal de activación no distingue a la que se va, así que buscar ahí la prevención es buscar donde no está.',

  flujo_real: [
    { fase: 'Captación',    area: 'Marketing',     accion: 'Lead pagado de Facebook con necesidad e intención declaradas',                                  resultado: 'Entrada correcta: el lead traía la información que hacía falta' },
    { fase: 'Perfilamiento', area: 'Perfilamiento', accion: 'Ocho intentos en 25 días, cada uno registrado; todas las salientes se caen',                    resultado: 'Esfuerzo documentado y cero conversación hasta que el cliente marcó' },
    { fase: 'Calificación', area: 'Perfilamiento', accion: 'Se califica sin poder transferir: «No hay asesores disponibles (no contestan)»',                 resultado: 'El motivo queda escrito en el CRM y no dispara nada' },
    { fase: 'Venta',        area: 'Ventas',        accion: 'Una conversación de 14:46 y cierre 2:22 después, sin llenar consumo, diagnóstico ni prueba',     resultado: 'Plan de minutos vendido a quien declaró no hacer llamadas' },
    { fase: 'Análisis',     area: 'Plataforma',    accion: 'El análisis automático registra CRM y WhatsApp como los temas centrales de la llamada',          resultado: 'Lectura correcta, archivada en el mismo expediente que se usó para cerrar' },
    { fase: 'Activación',   area: 'Activación',    accion: 'Capacitación, app instalada, ticket cerrado en 8 días sobre complejidad «sencillo»',             resultado: 'Trabajo correcto. La cuenta murió igual: llegó mal vendida' },
    { fase: 'Cancelación',  area: 'El cliente',    accion: 'Pide la baja por correo a los 27 días del pago',                                                 resultado: 'Motivo: «no ocuparemos más la línea»' },
    { fase: 'Retención',    area: 'SAC',           accion: 'Se ofrece vincular la línea a WhatsApp, 28 días después de que el sistema lo dijera',            resultado: 'Rechazado. La operación del cliente no usa llamadas y eso no cambió' },
    { fase: 'Registro',     area: 'GRC / Mesa',    accion: 'La pérdida queda rotulada «Por confirmar» y el ticket no aparece entre los cerrados',            resultado: '$209 que no cuentan, dentro de $42,753 que tampoco' },
  ],

  comparativo: [
    { metrica: 'Consumo declarado antes de vender un plan de minutos', real: 'Campo vacío',                                  ideal: 'Obligatorio, y bloqueante si la respuesta no sostiene el plan' },
    { metrica: 'Lectura del análisis de IA en el cierre',              real: 'Archivada, sin efecto',                        ideal: 'Confirmar o refutar lo detectado antes de poder cerrar' },
    { metrica: 'Etapas del embudo recorridas',                         real: 'De calificación a Cierre Logrado el mismo día', ideal: 'Prueba y confirmación de entendimiento, o justificación de por qué se omiten' },
    { metrica: 'Tiempo del lead a la primera conversación',            real: '25 días y 8 intentos',                         ideal: 'Medido y con umbral: hoy no existe el indicador' },
    { metrica: 'Llamadas salientes que conectan',                      real: '0% (7 u 8 según la fuente, ninguna conectó)',   ideal: 'Medido por campaña de prospección, con alerta cuando cae a cero' },
    { metrica: 'Destino de una cuenta que muere antes de cartera',     real: 'Sin KAM, sin CID y sin contarse',              ideal: 'Dueño asignado y cohorte propia que se revisa cada corte' },
    { metrica: 'Pérdida de $209 en el corte de churn',                 real: 'Rotulada «Por confirmar»; agrega cero',        ideal: 'Confirmada o desmentida antes de cerrar el mes' },
    { metrica: 'Días de activación',                                   real: '8',                                            ideal: '7 — la mediana de su propia cohorte de octubre 2026, no los 14 históricos' },
  ],

  plan_inmediato: [
    { accion: 'Resolver el folio 119093: confirmar si la baja se procesó y en qué fecha, y dejarlo cerrado con desenlace explícito', responsable: 'Mesa de ayuda', criterio: 'El folio aparece en la siguiente exportación de cerrados, con motivo de baja' },
    { accion: 'Sacar del GRC vivo la lista de las 36 cuentas con una sola factura y facturación en cero, y asignar quién resuelve cada una', responsable: 'Dirección SAC', criterio: 'Lista nominal con dueño por fila, empezando por las cinco mayores' },
    { accion: 'Decidir si esta cuenta se mueve a «perdido» o se mantiene en riesgo. Hoy ninguna fuente nuestra consuma la baja', responsable: 'Dirección SAC', criterio: 'Decisión escrita, con la fuente que la sostiene' },
    { accion: 'Revisar las otras ocho cuentas que pagaron exactamente $209 en octubre 2026 y comprobar si siguen facturando', responsable: 'Facturación', criterio: 'Las nueve del mes contrastadas contra el corte vivo' },
  ],

  plan_mediano: [
    { accion: 'Hacer obligatorio «¿Cuántas llamadas reciben y hacen al día?» antes de poder cerrar un plan de minutos', responsable: 'Comercial + Sistemas', criterio: 'Campo bloqueante en el CRM, no una recomendación' },
    { accion: 'Que el cierre exija confirmar o refutar lo que el análisis de IA detectó en la llamada', responsable: 'Proceso / Sistemas', criterio: 'Un campo y una regla sobre la herramienta que ya corre' },
    { accion: 'Registrar y reportar cuántas oportunidades saltan etapas del embudo, con nombre del asesor y motivo', responsable: 'Dirección Comercial', criterio: 'Indicador en el tablero, no una consulta a pedido' },
    { accion: 'Medir el tramo lead → primera conversación en leads pagados, y las prospecciones que se caen por no haber asesor disponible', responsable: 'Marketing + Operación', criterio: 'Dos indicadores con meta, visibles en el corte semanal' },
    { accion: 'Llenar el campo Vendedor en Activaciones 2.0 o retirarlo: hoy está vacío o en «Sin vendedor» en el 29.4% de las pagadas', responsable: 'Activaciones 2.0', criterio: 'Cobertura por encima del 95% o el campo deja de usarse para medir' },
  ],

  plan_estrategico: [
    { accion: 'Tratar «cuentas de una sola factura» como una cohorte con dueño, revisada en cada corte del GRC', responsable: 'Dirección SAC', criterio: 'Cifra propia en el reporte mensual, hoy escondida en un cubo que agrega cero' },
    { accion: 'Asignar dueño a las cuentas que mueren antes de entrar a cartera: hoy no están en `cuentas`, no tienen CID y no son de nadie', responsable: 'Dirección SAC', criterio: 'Regla escrita de a quién le tocan y en qué momento' },
    { accion: 'Medir el patrón con la cohorte completa antes de concluir que es un problema de Ventas: este caso y Viajes Macull son dos, no una tendencia', responsable: 'Dirección SAC', criterio: 'Cohorte de 90 días con datos, no anécdotas cruzadas entre áreas' },
    { accion: 'Exigir CID en el GRC para toda cuenta facturada: el 94% de las filas no lo trae y por eso ésta sólo se encuentra por nombre', responsable: 'Sistemas / Facturación', criterio: 'Cobertura de CID medida y creciendo corte a corte' },
  ],

  areas_oportunidad: [
    { area: 'Comercial',         impacto: 'Alto',  responsable: 'Cierre en 2:22 sin consumo, sin diagnóstico, sin prueba y contra lo que el análisis de la llamada acababa de detectar' },
    { area: 'Proceso / sistema', impacto: 'Raíz',  responsable: 'El embudo, el formulario y la IA existen y ninguno obliga a nada; el 29.4% de las activaciones no registra vendedor' },
    { area: 'Operación propia',  impacto: 'Alto',  responsable: 'Ninguna saliente conectó, el cliente esperó 5:36 en un buzón y el motivo quedó escrito: no había asesores disponibles' },
    { area: 'Dirección SAC',     impacto: 'Alto',  responsable: '36 cuentas y $42,753 de una sola factura sin dueño y sin contarse en ninguna cifra de churn' },
    { area: 'Activación',        impacto: 'Nulo',  responsable: 'Sin hallazgos: capacitó, instaló, cerró en 8 días sobre complejidad «sencillo» y el cliente lo agradeció' },
  ],

  perfiles: [
    { nombre: 'El contacto de CP 190196', rol: 'Quien compró y quien pidió la baja', color: '#f59e0b',
      campos: [
        { label: 'Evidencia',  value: 'Correo del 03/11 16:33 a la mesa de ayuda y conversación de retención del 04/11 por WhatsApp.' },
        { label: 'Lectura',    value: 'No es detractor y no canceló por precio ni por falla: su operación se comunica por correo y no usa llamadas. Lo dijo al cancelar y estaba escrito el día de la venta.' },
        { label: 'Qué hacer',  value: 'Si se vuelve a tocar, que sea sobre CRM y WhatsApp —lo que el sistema detectó—, no sobre el conmutador que ya rechazó.' },
        { label: 'Estado',     value: 'Nombre y cargo NO registrados en ninguna fuente nuestra. El documento no los publica.' },
      ] },
    { nombre: 'Director General (mencionado)', rol: 'Participante en la decisión, según el formulario', color: '#ef4444',
      campos: [
        { label: 'Evidencia',  value: 'Campo «¿Quién más participa?» del formulario de la oportunidad: «Director General».' },
        { label: 'Lectura',    value: 'Se identificó al decisor y nunca se le involucró: el campo «¿A quiénes hay que involucrar?» quedó vacío.' },
        { label: 'Estado',     value: 'VACÍO — sin nombre, sin cargo exacto y sin contacto.' },
      ] },
    { nombre: 'Cecilia', rol: 'Ejecutiva de activación', color: '#22c55e',
      campos: [
        { label: 'Evidencia',  value: 'Activaciones 2.0, fila 190196. 647 activaciones pagadas en el corte.' },
        { label: 'Lectura',    value: 'Cerró en 8 días con capacitación impartida, app instalada y agradecimiento del cliente. No hay hallazgo de su lado.' },
        { label: 'Qué hacer',  value: 'Citarla en la revisión como control: su expediente demuestra que una activación impecable no evita la baja cuando la venta llegó mal.' },
      ] },
    { nombre: 'El asesor que cerró', rol: 'Ventas · propietario de la oportunidad', color: '#f59e0b',
      campos: [
        { label: 'Evidencia',  value: 'Oportunidad del 07/10 10:37, nota completa de dos renglones. Activaciones 2.0 guarda Vendedor «Sin vendedor».' },
        { label: 'Lectura',    value: 'Cerró en quince minutos un lead que llevaba 25 días atorado. El hueco es el diagnóstico, no el esfuerzo ni la intención.' },
        { label: 'Qué hacer',  value: 'Escucharlo ANTES de concluir: puede haber información de la llamada que no quedó en el CRM, y la grabación existe.' },
        { label: 'Estado',     value: 'Nombre no registrado en las fuentes nuestras: Activaciones dice «Sin vendedor», que es el caso del 29.4% del corte.' },
      ] },
  ],

  foda: {
    fortalezas: [
      'Es el único caso de su cohorte con trazabilidad íntegra en los tres sistemas: CRM, activaciones y mesa de ayuda.',
      'La activación fue correcta y está documentada: capacitación, app instalada, 8 días y agradecimiento del cliente.',
      'La herramienta que detectó lo que el cliente quería ya está pagada, ya corre y dejó su lectura en el expediente.',
      'Perfilamiento dejó constancia de cada uno de los ocho intentos, con motivo. El esfuerzo es auditable.',
    ],
    oportunidades: [
      'Las otras 35 cuentas de una sola factura —$42,753— son una cifra de churn recuperable para el reporte en cuanto se confirmen.',
      'Las ocho cuentas que pagaron $209 en octubre 2026 permiten comprobar el patrón con datos en vez de con un caso.',
      'El campo de consumo y la lectura de la IA ya existen: las dos reglas que cambiarían este desenlace no requieren desarrollo nuevo.',
      'Comparado con Viajes Macull, el par prueba algo que ninguno de los dos probaba solo: la señal de activación no predice la baja.',
    ],
    debilidades: [
      'El campo que decidía la venta quedó vacío, y con él los de integración con CRM y CP Chat.',
      'El decisor estaba identificado en el formulario y nunca se le involucró.',
      'La cuenta no existe en `cuentas`, no tiene CID y no tiene KAM: ningún cruce automático la encuentra.',
      'El conteo de salientes del documento se contradice consigo mismo (7 en la tabla, 8 en la cronología).',
      'El campo Vendedor está ciego en el 29.4% de las activaciones pagadas, así que el patrón no se puede atribuir.',
    ],
    amenazas: [
      '$42,753 de pérdida viven en un cubo que el agregado cuenta como cero: cualquier cifra de churn que se presente hoy está por debajo del real.',
      'Mientras el folio 119093 no cierre, ni el expediente puede decir que está perdida ni el tablero que está viva.',
      'Sin la puerta de consumo, el mismo desenlace se repite con la siguiente venta de un plan de minutos a quien no hace llamadas.',
      'Concluir «es problema de Ventas» con dos casos cierra el análisis antes de medirlo, y deja intactas las reglas que sí lo evitarían.',
    ],
  },

  conclusion:
    'Este cliente dijo lo que necesitaba el 7 de octubre. Lo dijo en el formulario —«Sonar profesional»—, lo dijo en la llamada, y el análisis automático de la empresa lo transcribió: CRM y WhatsApp. Se le vendió telefonía en catorce minutos, y se le ofreció lo correcto veintiocho días después, cuando ya se iba. No cambió de opinión: nadie le preguntó.\n\n' +
    'La tentación es cerrarlo como un caso de $209 y seguir. Las fuentes nuestras dicen otra cosa. En el corte vivo del GRC hay 36 cuentas con una sola factura y facturación en cero —36 clientes distintos, $42,753 entre todas, 35 sin un solo mes de permanencia— y las 36 están rotuladas «Por confirmar (corte de datos)», en un cubo cuya pérdida agregada es cero. Esta cuenta es la número 30 por importe. El 94.7% del dinero está en las otras veinticinco. Lo que este expediente documenta no es una venta mala: es un punto ciego de $42,753 del que tenemos exactamente una película completa.\n\n' +
    'Y hay un segundo hallazgo que sólo aparece al ponerlo junto a Viajes Macull. Aquélla murió con todas las alarmas encendidas: complejidad «muy difícil», el peor 0.8% del corte, 26 días de activación. Ésta murió con todo en verde: «sencillo», que es el 67%, ocho días, capacitación impartida y cliente agradecido. Las dos en menos de un mes. La activación no distingue a la que se va, y buscar ahí la prevención es buscar donde no está.\n\n' +
    'Por eso el expediente no la da por perdida. El cliente pidió la baja y rechazó la retención, pero ninguna fuente nuestra la consuma: el GRC la rotula «Por confirmar», el folio de cancelación no aparece entre los cerrados y no hay fila en `cuentas` que mover. Documentar un riesgo no es dar de baja a nadie. Pasa a «perdido» el día que una fuente lo diga.',

  pierde: [
    '$209 de esta cuenta, y los $42,753 de las 36 que hoy no se cuentan si nadie las confirma antes del cierre del mes.',
    'La lectura real del churn mientras un cubo de 1,004 filas agregue pérdida cero con pérdidas escritas dentro.',
    'La inversión de adquisición de cada lead pagado que muere en el tramo de 25 días que hoy no se mide.',
    'El valor de un análisis de llamada que ya se paga y que no obliga a nada en el cierre.',
  ],

  gana: [
    'Una cifra de churn defendible, en cuanto las 36 filas de una sola factura estén confirmadas o desmentidas.',
    'Dos reglas que no requieren desarrollo nuevo: consumo obligatorio antes de vender minutos, y la lectura de la IA confirmada o refutada en el cierre.',
    'La prueba —con dos casos de señales opuestas— de que la complejidad de activación no sirve para predecir la baja, que evita invertir en el tablero equivocado.',
    'Un dueño para las cuentas que mueren antes de entrar a cartera, que hoy no son de nadie ni cuando viven ni cuando mueren.',
  ],

  recomendacion_central:
    'ANTES DEL CIERRE DEL MES: sacar del corte vivo del GRC las 36 filas con una sola factura y facturación en cero, asignar dueño a cada una y resolverlas. Son $42,753 que hoy cuentan como pérdida cero, y las cinco mayores concentran más de la mitad. Esta cuenta es una de ellas y es la única con película completa: úsese para explicar el patrón, no para medirlo.\n\n' +
    'Y poner las dos reglas que este caso prueba con nombre y hora: que no se pueda cerrar un plan de minutos sin responder cuántas llamadas hace al día, y que el cierre exija confirmar o refutar lo que el análisis de la llamada detectó. Las dos herramientas ya existen y ya se pagan. Lo que falta es que obliguen a algo: una alerta que no obliga a nada es una alerta que entrena a no mirarla.',

  documentos: [
    { nombre: 'Caso CP 190196 · Una venta de 14 minutos que murió en 27 días',
      ruta: '/auditorias/Caso-CP-190196-Ciclo-de-Compra-2026.html',
      descripcion: 'Anexo al diagnóstico del ciclo de compra, 19 nov 2026. Reconstrucción desde el clic en Facebook hasta el correo de cancelación, con las fuentes de Zoho CRM, el canal de Activaciones y el ticket #119093.' },
  ],
}
