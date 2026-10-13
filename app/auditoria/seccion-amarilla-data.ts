import type { AuditoriaCase } from './types'

/**
 * SECCIÓN AMARILLA · ADSA (F3 · CID 12526) — la cuenta que el tablero no
 * sabía que facturaba.
 *
 * Auditoría del 13 oct 2026, y nace de un reorden: al rankear el TOP 50 por el
 * importe BUENO en vez de por `cuentas.facturacion`, ésta quedó la tercera sin
 * expediente. Al ir a escribirlo no había con qué: cero llamadas, cero
 * consumo, cero reuniones y NINGUNA línea de Gross Revenue Facturación.
 *
 * LA PISTA ESTABA EN SUS PROPIOS SEGUIMIENTOS
 * -------------------------------------------
 * El equipo no la llama «Sección Amarilla» cuando trabaja: la llama **ADSA**.
 * Está en cuatro de sus seis seguimientos —«REGISTRO KAM — ADSA», «VALIDAR
 * TICKETS — ADSA», «ANÁLISIS DE CALIDAD EN SOPORTE — ADSA»— y en el GRC hay
 * una línea «ADSA» que nadie había atado a esta cuenta.
 *
 * ADSA es **Anuncios en Directorios, S.A. de C.V.**, que es el nombre legal de
 * Sección Amarilla. Son la misma empresa, y lo confirman cuatro cosas
 * independientes: el nombre que usa el equipo, el nombre legal, los 93 meses
 * de vida que cuadran con su alta del 31 dic 2018, y que el promedio de vida
 * del GRC ($82,579) es casi exactamente lo que guarda la ficha ($84,254).
 *
 * TODAS las cifras salen de fuente y están verificadas:
 *   · facturación → data/grc-zoho.json, línea «ADSA», contra su respaldo del
 *                   2 oct. Se leen los DOS: es la comparación la que prueba
 *                   que la cuenta factura.
 *   · ficha       → tabla `cuentas`, registro completo
 *   · tickets     → lib/tickets-data.json, 1 fila de «Sección Amarilla»
 *   · alertas     → alertas_episodios, 2 abiertas
 *   · la empresa  → Expansión (7 sep 2026), Forbes México y Wikipedia
 *
 * LO QUE ESTA AUDITORÍA **NO** PUEDE DECIR, y se dice con palabras:
 * no hay lectura de llamadas de esta cuenta (el CID 12526 no está en la
 * entrega) y no tiene un solo mes con dato de consumo. O sea que de la
 * operación telefónica de un cliente de telefonía no se sabe NADA. Eso no se
 * rellena con suposiciones: se pide, y está puesto como alerta.
 */
export const SECCION_AMARILLA: AuditoriaCase = {
  id: 'seccion-amarilla',
  asesor: 'Fátima',
  nombre: 'Sección Amarilla · ADSA (Anuncios en Directorios)',
  sector: 'Marketing digital — filial de América Móvil / Telmex Internacional',
  fecha_periodo: 'Diciembre 2018 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA · 93 meses · $7.68M facturados en su vida',
  descripcion_contexto: 'La factura REAL son $32,375 al mes, no los $84,254 de la ficha · Marcada «Churn confirmado» sin verificar en DOS cortes seguidos, mientras emitía otra factura · Sin lectura de llamadas y sin un solo mes de consumo medible',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  /* El NÚMERO va en `value` y el contexto en `label`. La primera versión metía
     «$32,375 (ficha dice $84,254)» en el valor y la tarjeta se partía en cuatro
     renglones: dejaba de ser un KPI y pasaba a ser una frase. Se vio mirando la
     pantalla, no leyendo el archivo. */
  kpis: [
    { label: 'Factura real · la ficha dice $84,254', value: '$32,375',    color: '#ef4444' },
    { label: 'De su promedio de $82,579 al mes',     value: '39%',        color: '#ef4444' },
    { label: 'El GRC la da de baja, sin verificar',  value: '2 cortes',   color: '#ef4444' },
    { label: 'Facturado en 93 meses',                value: '$7,679,888', color: '#6366f1' },
    { label: 'Meses con consumo medible',            value: '0 de 5',     color: '#f97316' },
    { label: 'Reuniones en 7.8 años',                value: 'NINGUNA',    color: '#f59e0b' },
  ],

  resumen_ejecutivo: 'HAY UNA COSA QUE RESOLVER ANTES QUE NINGUNA OTRA, Y ES DE ESTA SEMANA: Gross Revenue Facturación da esta cuenta por PERDIDA. La marca «Churn confirmado» con $32,375 de pérdida declarada, y lo hace en los DOS cortes disponibles —el del 2 y el del 11 de octubre—, los dos con verificación `sin_verificar`. Nadie la ha comprobado.\n\nY está mal, con una prueba que no admite discusión: entre esos dos cortes el importe ACUMULADO de la cuenta subió de $7,647,513 a $7,679,888. Son $32,375 exactos, su mensualidad al centavo, y el contador de facturas pasó de 8 a 9. **Una cuenta dada de baja no emite facturas.** Sección Amarilla facturó en el periodo en que el reporte dice que se fue.\n\nLA SEGUNDA COSA ES QUE NADIE SABÍA QUE ESTA CUENTA FACTURABA. En el GRC no se llama Sección Amarilla: se llama **ADSA** —Anuncios en Directorios, S.A. de C.V., su nombre legal— y llega sin CID y con `enCartera: false`. Por eso ningún cruce automático la encontraba y la ficha parecía no tener respaldo. La pista llevaba meses escrita en sus propios seguimientos, donde el equipo la llama ADSA y no Sección Amarilla.\n\nLA TERCERA, Y ES LA QUE DEBERÍA PREOCUPAR: la cuenta se ha encogido a menos de la mitad y el tablero enseña el tamaño que tenía antes. La ficha dice $84,254 al mes; lo que factura hoy son $32,375. Los $84,254 no son un error de captura, son su PROMEDIO DE VIDA —$7,679,888 entre 93 meses da $82,579—, o sea el tamaño medio de una relación de casi ocho años, no su tamaño de hoy. Medida contra sí misma, esta cuenta opera al 39% de lo que fue. Son unos $50,000 al mes que ya se perdieron sin que ninguna alerta los nombrara.\n\nY LA CUARTA: de la operación telefónica de este cliente no se sabe absolutamente nada. No hay lectura de llamadas del CID 12526 y no tiene un solo mes con dato de consumo —0 de 5—. Es un cliente de telefonía del que no se puede decir si usa el teléfono. La alerta `sin_consumo_medible` lleva abierta desde el 6 de octubre con severidad crítica, y dice textualmente que «factura $84,254 al mes»: repite la cifra equivocada.\n\nEl contexto de la empresa explica el encogimiento mejor que cualquier hipótesis de servicio. Sección Amarilla dejó de imprimir directorios en 2018 —el mismo año en que entró como cliente— y desde 2017 opera como agencia de marketing digital. Es una empresa en plena reconversión, filial de América Móvil, y su gasto en telefonía se mueve con esa reconversión. La pregunta para el cliente no es «por qué bajaron»: es qué están construyendo ahora y si lo que compraron hace ocho años sigue sirviendo para eso.',

  resultado_positivo: 'La relación está sana y el expediente lo sostiene con datos, no con impresiones. Son 93 meses de cliente ininterrumpidos desde el 31 de diciembre de 2018, con CERO incidencias de pago y pagos al corriente. $7,679,888 facturados en su vida: es la cuenta con mayor facturación acumulada de todas las que llevamos auditadas.\n\nEl trabajo del asesor está hecho y se nota. Las SIETE actividades registradas están COMPLETADAS —siete de siete—, cosa que no ocurre en ninguna otra cuenta de este tamaño: Torres Corzo tenía cuatro de siete sin cerrar. El mapa de decisores está capturado con nombre, cargo y correo: Luis Torres León (estrategia comercial) y Emmanuel Roman Santibañez (desarrollador Java SR). Las observaciones KAM están escritas con el formato completo de los cinco puntos. Su score relacional es 71, el más alto que hemos visto en estas auditorías —Torres Corzo tenía 32—.\n\nEl servicio tampoco falla: UN solo ticket en todo el histórico de la mesa, sin fallas técnicas, y el propio cliente lo confirmó por teléfono el 2 de julio — «me comenta el Ing. Luis que todo se encuentra en orden sin cambio en operación». El 9 de julio: «Soporte dio rápida respuesta en tema de API».\n\nY hay una puerta abierta que casi nadie tiene: el segundo contacto registrado es un DESARROLLADOR, y el único ticket del histórico es de APIs. Este cliente tiene equipo técnico propio y ya está tocando la API — teniendo `tiene_integracion_api` en falso.',

  hallazgos: [
    'FACTURACIÓN — LA PRUEBA DE QUE NO ES CHURN, Y ES ARITMÉTICA. El GRC marca «Churn confirmado» con $32,375 de pérdida en los cortes del 2 y del 11 de octubre, los dos `sin_verificar`. Pero entre esos dos cortes el importe acumulado de la cuenta subió de $7,647,513 a $7,679,888 —exactamente $32,375, su mensualidad al centavo— y el contador de facturas pasó de 8 a 9. Una cuenta dada de baja no emite facturas. La baja es falsa y hay que revertirla en la conciliación.',
    'FACTURACIÓN — EN EL GRC NO SE LLAMA SECCIÓN AMARILLA, SE LLAMA «ADSA». Por eso ningún cruce la encontraba: llega sin CID, con `consecutivo: null` y `enCartera: false`. ADSA es Anuncios en Directorios, S.A. de C.V., el nombre legal de Sección Amarilla. No es una conjetura por parecido —ese camino ya propuso «ADSA ≈ TATSA» y son empresas distintas—: lo confirman cuatro cosas independientes, y la primera estaba en casa.',
    'FACTURACIÓN — LA PRIMERA CONFIRMACIÓN LLEVABA MESES ESCRITA EN LA PROPIA CUENTA. Cuatro de sus seis seguimientos llaman ADSA a este cliente: «REGISTRO KAM — ADSA», «VALIDAR TICKETS — ADSA», «ANÁLISIS DE CALIDAD EN SOPORTE — ADSA», «Llamada preventiva con ADSA». El equipo lleva meses usando el nombre que el GRC usa, y nadie juntó las dos pantallas.',
    'FACTURACIÓN — EL IMPORTE DE LA FICHA ES SU PROMEDIO DE VIDA, NO SU MES. $7,679,888 entre 93 meses da $82,579, y la ficha guarda $84,254. Lo que factura hoy son $32,375. Es la CUARTA cuenta en la que `cuentas.facturacion` resulta ser `acumulado ÷ meses` —tras Torres Corzo, Tech People y OOAPAS—, y aquí el efecto es el más engañoso de los cuatro: no infla una cuenta pequeña, DISFRAZA el encogimiento de una grande.',
    'RIESGO — LA CUENTA OPERA AL 39% DE SU PROPIA MEDIA Y NINGUNA ALERTA LO DICE. $32,375 hoy contra $82,579 de promedio histórico. Son unos $50,000 al mes que ya se perdieron. No lo ve el detector de caída de consumo —que mira los últimos cinco cortes y esta cuenta no tiene NI UNO—, ni el de importe —que sólo salta cuando no hay importe en ninguna fuente, y aquí hay uno, equivocado—. El hueco es de diseño: nadie compara el mes contra la vida.',
    'MEDICIÓN — DE UN CLIENTE DE TELEFONÍA NO SABEMOS SI USA EL TELÉFONO. El CID 12526 no está en la entrega de llamadas y tiene 0 de 5 meses con dato de consumo. Cero. No es que use poco: es que no hay con qué saberlo. Alerta `sin_consumo_medible` abierta desde el 6 de octubre, severidad crítica.',
    'MEDICIÓN — Y LA ALERTA CRÍTICA REPITE LA CIFRA EQUIVOCADA: dice que la cuenta «factura $84,254 al mes» porque toma el importe de la ficha. La alerta que existe para avisar de un hueco de medición está propagando el error que esta auditoría corrige.',
    'CONTACTO — 74 días sin que nada llegue al cliente. Alerta `silencio_60` abierta desde el 2 de julio, severidad crítica. El último contacto efectivo fue el 31 de julio y las observaciones KAM comprometían «próximos pasos: última semana de agosto», que no ocurrieron. El trabajo venía siendo bueno —siete actividades de siete completadas— y se detuvo en seco.',
    'RELACIÓN — NINGUNA REUNIÓN EN 93 MESES. Cero filas en `reuniones`. Es una cuenta AAA con casi ocho años de relación, $7.68M facturados y dos decisores capturados, y nunca se ha sentado nadie con ella. El score relacional dice 71 —el más alto de las auditorías escritas— porque mide seguimientos y contactos, no reuniones: está premiando una relación que no se ha reunido jamás.',
    'RELACIÓN — 1 de 12 preguntas del Radar. La única cuenta de este tamaño que tiene al menos una respondida, y aun así es el 8%.',
    'COMERCIAL — HAY EQUIPO TÉCNICO DEL LADO DEL CLIENTE Y YA ESTÁ TOCANDO LA API. El segundo contacto capturado es Emmanuel Roman Santibañez, «Desarrollador Java SR», y el ÚNICO ticket del histórico (julio 2026) es de subcategoría «APIs (voz)». Pero `tiene_integracion_api` está en falso. O la integración existe y no está registrada, o el cliente la está intentando solo: las dos cosas son una conversación comercial inmediata.',
    'SERVICIO — UN solo ticket en todo el histórico, sin fallas. Tardó 238 horas (10 días) en cerrarse, que es lo único reprochable, y el cliente igualmente dijo por teléfono que «soporte dio rápida respuesta». No hay problema de servicio en esta cuenta: hay ausencia de relación.',
    'CONTEXTO — EL ENCOGIMIENTO TIENE UNA EXPLICACIÓN DE NEGOCIO, Y NO ES NUESTRA. Sección Amarilla dejó de imprimir directorios en 2018 —el mismo año en que entró como cliente— y desde 2017 opera como agencia de marketing digital bajo el nombre Agencia Digital ADN. Es una empresa en reconversión, no una empresa en problemas, y su gasto telefónico se mueve con esa reconversión. Fuente: Expansión, 7 sep 2026.',
    'CONTEXTO — ES FILIAL DE AMÉRICA MÓVIL / TELMEX INTERNACIONAL, el grupo de Carlos Slim. Eso recontextualiza un ticket que en la ficha parecía anecdótico: el 22 de julio el asesor registra que «el cliente me indica tienen un tema con una redirección de Telmex». El cliente ES la filial de Telmex. Una cuenta de telefonía dentro del mayor grupo de telecomunicaciones del país no se gestiona como una PyME.',
    'FICHA — El tamaño declarado no cuadra con la fuente pública. La ficha dice «Mediana, 533 empleados»; los perfiles públicos de la empresa reportan entre 1,001 y 5,000. Puede que 533 sea la parte que nos compete, pero entonces hay que escribirlo: hoy la ficha hace pensar que el cliente es la mitad de lo que es.',
  ],

  cronologia: [
    { fecha: '2017',          responsable: 'Sección Amarilla', evento: 'La empresa cambia su nombre comercial a Agencia Digital ADN y arranca su reconversión a marketing digital. Fuente: Expansión, 7 sep 2026.', tipo: 'neutral' },
    { fecha: '2018',          responsable: 'Sección Amarilla', evento: 'Deja de imprimir sus directorios en papel. Fin del negocio con el que la empresa nació.', tipo: 'pivote' },
    { fecha: '31 Dic 2018',   responsable: 'Callpicker',       evento: 'Alta de la cuenta, el mismo año en que el cliente deja el papel. Servicio: consumo PSTN Nacional + DIDs nacionales adicionales. 93 meses de relación ininterrumpida.', tipo: 'ok' },
    { fecha: '2019–2025',     responsable: 'ADSA / Callpicker', evento: 'La relación acumula $7.68M facturados, con un promedio de $82,579 al mes y cero incidencias de pago. El detalle mes a mes no está en ninguna fuente que tengamos.', tipo: 'neutral' },
    { fecha: '24 Jun 2026',   responsable: 'Fátima',           evento: 'Llamada de revisión preventiva. Queda pendiente de respuesta por WhatsApp.', tipo: 'neutral' },
    { fecha: '02 Jul 2026',   responsable: 'Fátima / Luis Torres', evento: 'Llamada preventiva: «me comenta el Ing. Luis que todo se encuentra en orden sin cambio en operación». Es el último mes con contacto efectivo sostenido.', tipo: 'ok' },
    { fecha: '09 Jul 2026',   responsable: 'Fátima',           evento: 'Revisión KAM: ticket #109637 de API resuelto, «soporte dio rápida respuesta».', tipo: 'ok' },
    { fecha: 'Jul 2026',      responsable: 'Mesa de ayuda',    evento: 'ÚNICO ticket del histórico, subcategoría «APIs (voz)». Sin falla técnica. Tarda 238 horas —10 días— en cerrarse.', tipo: 'neutral' },
    { fecha: '22 Jul 2026',   responsable: 'Fátima',           evento: 'Se abre el ticket #111148: «el cliente me indica tienen un tema con una redirección de Telmex». El cliente es filial de Telmex.', tipo: 'neutral' },
    { fecha: '31 Jul 2026',   responsable: 'Fátima',           evento: 'Llamada: «todo en orden». ÚLTIMO contacto que llegó al cliente. Desde aquí se cuentan los 74 días de silencio.', tipo: 'problema' },
    { fecha: '14 Ago 2026',   responsable: 'Fátima',           evento: 'Se completan las observaciones KAM con el formato de cinco puntos. Estado de la relación: «Positivo». Próximos pasos comprometidos: «última semana de agosto».', tipo: 'ok' },
    { fecha: 'Fin Ago 2026',  responsable: 'Fátima',           evento: 'Los próximos pasos comprometidos NO ocurren. No hay registro de contacto posterior.', tipo: 'problema' },
    { fecha: '01 Sep 2026',   responsable: 'Fátima',           evento: 'Se captura el mapa de decisores: Luis Torres León y Emmanuel Roman Santibañez. Es la última actividad registrada en la cuenta.', tipo: 'ok' },
    { fecha: '02 Oct 2026',   responsable: 'Gross Revenue Fact.', evento: 'Respaldo del corte: ADSA ya figura «Churn confirmado» con $32,375 de pérdida, `sin_verificar`. Acumulado $7,647,513 sobre 92 meses, 8 facturas.', tipo: 'problema' },
    { fecha: '06 Oct 2026',   responsable: 'Motor de alertas', evento: 'Se abre `sin_consumo_medible`, severidad crítica: «0 de 5 meses con dato de consumo». La evidencia dice que factura $84,254 al mes — la cifra de la ficha, que es su promedio de vida.', tipo: 'problema' },
    { fecha: '11 Oct 2026',   responsable: 'Gross Revenue Fact.', evento: 'Corte vigente: sigue «Churn confirmado» y `sin_verificar` — PERO el acumulado sube a $7,679,888 (+$32,375 exactos) y las facturas pasan de 8 a 9. La cuenta facturó mientras el reporte la daba por ida.', tipo: 'pivote' },
    { fecha: '13 Oct 2026',   responsable: 'Callpicker',       evento: 'Al reordenar el TOP 50 por el importe bueno se descubre que «ADSA» del GRC es esta cuenta. Primera vez que la facturación de Sección Amarilla aparece atada a su ficha.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'Anuncios en Directorios, S.A. de C.V. (ADSA)' },
    { label: 'Nombre comercial',      value: 'Sección Amarilla · desde 2017 también Agencia Digital ADN' },
    { label: 'Giro',                  value: 'Marketing digital — sitios web, SEO y campañas. Dejó el directorio impreso en 2018.' },
    { label: 'Grupo',                 value: 'Filial de América Móvil / Telmex Internacional (grupo Carlos Slim)' },
    { label: 'Tamaño',                value: 'La ficha dice «Mediana, 533 empleados». Los perfiles públicos reportan 1,001–5,000: hay que aclarar cuál es el alcance.' },
    { label: 'Domicilio fiscal',      value: 'James Sullivan 127, San Rafael, 06470, Cuauhtémoc, CDMX' },
    { label: 'Sitio',                 value: 'seccionamarilla.com.mx' },
    { label: 'Cliente desde',         value: '31 de diciembre de 2018 — 93 meses' },
    { label: 'Servicio contratado',   value: 'Consumo PSTN Nacional + DIDs nacionales adicionales' },
    { label: 'Nombre en el GRC',      value: '«ADSA», sin CID, `enCartera: false` — por eso ningún cruce la encontraba' },
    { label: 'Facturación real',      value: '$32,375 MXN al mes (GRC). La ficha dice $84,254, que es su promedio de vida.' },
    { label: 'Facturado en su vida',  value: '$7,679,888 en 93 meses · clasificación AAA' },
    { label: 'Salud de pago',         value: 'Al corriente · 0 incidencias en 93 meses' },
    { label: 'Health Score',          value: '53 · relacional 71, actividad 50, adopción 50, pago 50 (tres de cuatro son el valor por omisión)' },
    { label: 'Decisores capturados',  value: 'Luis Torres León (estrategia comercial) y Emmanuel Roman Santibañez (desarrollador Java SR)' },
  ],

  necesidad_negocio: 'Sección Amarilla es una empresa a mitad de una reconversión. Vivía de un directorio impreso que dejó de imprimir en 2018, y desde 2017 se reconstruye como agencia de marketing digital: sitios, SEO, campañas. Lo que vende hoy a sus clientes son LEADS, y el teléfono es uno de los canales por los que esos leads aterrizan.\n\nEso cambia qué significa su contrato. No compró telefonía para que su gente hable: compró PSTN nacional y DIDs adicionales, que es la forma de dar NÚMEROS — un número por campaña, por cliente anunciante o por canal, para poder medir qué anuncio produjo qué llamada. Es la infraestructura de medición de una agencia, no la central telefónica de una oficina.\n\nSi eso es así, su gasto se mueve con el número de campañas activas, y la caída de $82,579 a $32,375 es la de una empresa que redujo su parque de números mientras reorganiza el negocio. La pregunta para el cliente no es por qué gastan menos: es qué están armando ahora y si lo que compraron hace ocho años —números sueltos y consumo— sigue siendo la forma correcta de medirlo. La respuesta probable es que no: hoy eso se hace con llamadas rastreadas y API, y el cliente ya tiene un desarrollador tocando nuestra API por su cuenta.',

  potencial_corto: [
    'Integración por API: el único ticket del histórico es de «APIs (voz)» y el segundo contacto capturado es un desarrollador Java SR, pero `tiene_integracion_api` está en falso. O ya existe y no se registró, o el cliente la está construyendo solo. Las dos cosas se resuelven con una llamada.',
    'Recuperar visibilidad: hoy no hay lectura de llamadas ni un solo mes de consumo. Pedir el export y conectar el CID 12526 convierte una cuenta invisible en una cuenta medible, que es condición para cualquier otra conversación.',
    'Primera reunión en 93 meses. No hace falta un pretexto comercial: hay dos decisores capturados y una relación sana que nunca se ha sentado a una mesa.',
    'Atar «ADSA» a esta ficha en la tabla de alias del GRC, para que su facturación deje de ser invisible para el tablero y para el reporte de churn de dirección.',
  ],

  potencial_largo: [
    'Llamadas rastreadas por campaña: es exactamente lo que una agencia de marketing digital necesita para probarle a su anunciante que el anuncio funcionó, y es la evolución natural de los DIDs sueltos que compró en 2018.',
    'Callpicker Chat e IA de Chat: no los tiene contratados y su negocio es generar contactos para terceros. El chat es el canal que falta.',
    'IA de Voz: no contratada. Una agencia que gestiona números de muchos anunciantes es el caso de uso de un agente que califica y enruta.',
    'La puerta del grupo: es filial de América Móvil. Una cuenta bien llevada aquí es una referencia dentro del mayor grupo de telecomunicaciones de México — y también la razón por la que hay que llevarla impecable.',
  ],

  tacticas: [
    { nombre: 'Entrar por la API, no por el precio', descripcion: 'Abrir con «vimos que su equipo trabajó un tema de API en julio; ¿qué están construyendo?». Es verdad, es reciente y es su terreno.', impacto: 'Convierte una llamada de seguimiento en una conversación técnica con el desarrollador, que es quien sabe hacia dónde va la operación.' },
    { nombre: 'Llevar la corrección, no esconderla', descripcion: 'Decirle al cliente que nuestro reporte lo tenía mal clasificado y ya está corregido. Un proveedor que corrige su propio dato antes de que se lo señalen compra crédito.', impacto: 'Quita de la mesa el riesgo de que el error aparezca por otro lado, y abre la puerta a pedir el export de llamadas.' },
    { nombre: 'Preguntar por la reconversión', descripcion: 'Son públicos el fin del papel y el giro a digital. Preguntar qué papel juega el teléfono en el negocio de hoy, no por qué bajó el consumo.', impacto: 'La caída deja de ser un reproche y pasa a ser el punto de partida de un rediseño del servicio.' },
    { nombre: 'Pedir el export como favor técnico', descripcion: 'No tenemos sus llamadas ni su consumo. Pedirlo explicando para qué: para poder decirle qué números timbran y cuáles están muertos.', impacto: 'Es una petición que le devuelve valor inmediato, y sin ella no hay forma de auditar su operación.' },
  ],

  senal_alarma: 'Una cuenta AAA de 93 meses y $7.68M facturados que el reporte de facturación da por perdida en dos cortes seguidos sin que nadie lo compruebe, que ha encogido al 39% de su propia media sin que ninguna alerta lo nombre, de la que no tenemos ni una llamada ni un minuto medido, que nunca ha tenido una reunión, y que lleva 74 días sin que nada le llegue. Cada una de esas cosas por separado es un pendiente; juntas son el retrato de una cuenta que se puede ir sin que nos enteremos.',

  problema_raiz: 'El tablero no sabía que esta cuenta facturaba, porque en facturación se llama de otra forma. Y lo que sí mostraba —su importe— era el tamaño que tuvo de media en ocho años, no el que tiene hoy.',

  problema_raiz_detalle: 'El problema no es de atención: el asesor hizo su trabajo y se puede demostrar —siete actividades de siete completadas, los decisores capturados, las observaciones KAM escritas con el formato completo, y el cliente diciendo por teléfono que todo está en orden—. El problema es que el tablero le estaba dando una foto equivocada de su propia cuenta.\n\nLa primera capa es de identidad. En Gross Revenue Facturación esta cuenta se llama «ADSA» y llega sin CID, con `consecutivo: null` y `enCartera: false`. El cruce del tablero es por CID, así que la cuenta más grande de Fátima aparecía sin ninguna línea de facturación, y cualquiera que mirara habría concluido que no factura. La pista llevaba meses en sus propios seguimientos, donde el equipo la llama ADSA; nadie juntó las dos pantallas porque nada obliga a juntarlas.\n\nLa segunda es de métrica, y es la que más daño hace. `cuentas.facturacion` guarda `acumulado ÷ meses`: el promedio de una vida. En una cuenta estable eso se parece al mes vigente y el error no se nota. En una cuenta que se encogió a la mitad, el promedio ESCONDE el encogimiento — enseña el tamaño que tuvo, no el que tiene. Es la cuarta cuenta en la que encontramos esta columna equivocada, y la primera en la que el efecto es ocultar una caída en vez de inflar o desinflar un número.\n\nLa tercera es de cobertura. Ninguna alerta mira el mes contra la vida. El detector de caída de consumo necesita cinco cortes y esta cuenta no tiene ninguno; el de importe sólo salta cuando no hay importe en ninguna fuente, y aquí hay uno —equivocado, pero lo hay—. Una cuenta puede perder el 61% de su facturación sin que nada se encienda, y eso no es un fallo de nadie: es un hueco del diseño que esta auditoría deja nombrado.\n\nY la cuarta es que la alerta que sí está abierta repite el error: `sin_consumo_medible` avisa correctamente de que no se puede medir el consumo, y en la misma frase afirma que la cuenta «factura $84,254 al mes». El aviso que existe para señalar un hueco está propagando el dato equivocado.',

  flujo_real: [
    { fase: 'El cliente contrata',     area: 'ADSA / Callpicker', accion: 'Compra consumo PSTN nacional y DIDs adicionales — números para medir campañas', resultado: 'Diciembre 2018, el año en que deja el papel' },
    { fase: 'La cuenta factura',       area: 'Facturación',       accion: 'Se emite la mensualidad bajo el nombre «ADSA»', resultado: '$7,679,888 en 93 meses · 9 facturas en el periodo vigente' },
    { fase: 'El tablero busca su importe', area: 'Dashboard',     accion: 'Cruza la ficha contra el GRC por CID', resultado: 'NO la encuentra: la línea «ADSA» no trae CID. La ficha queda con su valor viejo.' },
    { fase: 'La ficha muestra un importe', area: 'Dashboard',     accion: 'Pinta `cuentas.facturacion`', resultado: '$84,254 — que es el promedio de 93 meses, no el mes: el encogimiento queda tapado' },
    { fase: 'El GRC clasifica',        area: 'Zoho Analytics',    accion: 'Marca la línea «Churn confirmado» con $32,375 de pérdida', resultado: '`sin_verificar` en los DOS cortes. Nadie lo comprueba.' },
    { fase: 'Pero la cuenta factura',  area: 'Facturación',       accion: 'Emite la factura número 9', resultado: 'El acumulado sube $32,375 exactos — la prueba de que la baja es falsa' },
    { fase: 'El motor alerta',         area: 'Alertas',           accion: 'Abre `sin_consumo_medible` crítica', resultado: 'Correcta en el fondo, y repite «factura $84,254 al mes» en la evidencia' },
    { fase: 'El asesor trabaja',       area: 'SAC',               accion: 'Siete actividades, siete completadas, decisores capturados', resultado: 'Con una foto equivocada del tamaño y sin un solo dato de la operación telefónica' },
  ],

  comparativo: [
    { metrica: 'Facturación mensual real', real: '$32,375 (GRC)', ideal: 'Que la ficha diga eso y no $84,254' },
    { metrica: 'Contra su propio promedio de vida', real: '39% de $82,579 — unos $50,000 al mes perdidos', ideal: 'Que exista una alerta que compare el mes contra la vida' },
    { metrica: 'Clasificación en el GRC', real: '«Churn confirmado» · `sin_verificar` en 2 de 2 cortes', ideal: '`sigue_viva` — emitió factura entre los dos cortes' },
    { metrica: 'Identificación en facturación', real: 'Sin CID, `enCartera: false`, nombre «ADSA»', ideal: 'CID 12526 asignado, o regla de alias confirmada' },
    { metrica: 'Meses con dato de consumo', real: '0 de 5', ideal: '5 de 5 — hoy no se puede decir si usa el servicio' },
    { metrica: 'Lectura de llamadas', real: 'NO existe para el CID 12526', ideal: 'La entrega mensual, como las otras 147 cuentas' },
    { metrica: 'Reuniones en 93 meses', real: 'NINGUNA', ideal: 'Trimestral en una cuenta AAA: 31' },
    { metrica: 'Radar de 12 preguntas', real: '1 respondida', ideal: '12 de 12' },
    { metrica: 'Días desde el último contacto', real: '74', ideal: '<30, que es el umbral de la casa' },
    { metrica: 'Actividades completadas', real: '7 de 7 — el mejor de todas las auditorías', ideal: 'Sostenerlo: se detuvo el 1 de septiembre' },
    { metrica: 'Bloques del Health Score medidos', real: '1 de 4 (sólo el relacional)', ideal: '4 de 4' },
  ],

  plan_inmediato: [
    { accion: 'REVERTIR la baja: el GRC marca «Churn confirmado» con $32,375 `sin_verificar` en dos cortes, y la cuenta emitió factura entre ellos (acumulado +$32,375 exactos, facturas 8→9)', responsable: 'Dirección / Facturación', criterio: 'La línea «ADSA» queda como `sigue_viva` antes del siguiente corte, con la evidencia del acumulado anotada' },
    { accion: 'Atar «ADSA» a la cuenta F3 en la tabla de alias del GRC, o asignarle el CID 12526 a la línea en origen — lo segundo es mejor porque arregla el cruce para siempre', responsable: 'Facturación / Dirección', criterio: 'La ficha de F3 muestra su facturación sin intervención manual' },
    { accion: 'CORREGIR el importe de la ficha: $84,254 es el promedio de 93 meses, el mes vigente son $32,375', responsable: 'Facturación', criterio: '`cuentas.facturacion` refleja el mes y la alerta crítica deja de citar la cifra vieja' },
    { accion: 'Llamar al cliente: lleva 74 días sin que nada le llegue y los próximos pasos comprometidos para la última semana de agosto no ocurrieron', responsable: 'Fátima', criterio: 'Contacto efectivo registrado, y la alerta `silencio_60` cerrada por trabajo y no por el paso del tiempo' },
    { accion: 'Pedir el export de llamadas del CID 12526 y revisar con Ingeniería por qué no tiene un solo mes de consumo en los cortes', responsable: 'Fátima / Ingeniería', criterio: 'O entra la lectura, o queda escrito por qué esta cuenta no se puede medir' },
    { accion: 'Preguntar por la API: el único ticket del histórico es de APIs y el segundo contacto es un desarrollador, pero `tiene_integracion_api` está en falso', responsable: 'Fátima', criterio: 'Queda escrito si hay integración, si la están construyendo, o si la necesitan' },
  ],

  plan_mediano: [
    { accion: 'Primera reunión en 93 meses, con Luis Torres León y con el desarrollador', responsable: 'Fátima', criterio: 'Reunión registrada con minuta y acuerdos, y el Radar contestado en la misma sesión' },
    { accion: 'Entender la reconversión: qué papel juega el teléfono en el negocio digital de hoy, y si los DIDs sueltos siguen siendo la forma correcta de medir campañas', responsable: 'Fátima', criterio: 'Queda escrito en la ficha para qué usa el cliente el servicio HOY, no en 2018' },
    { accion: 'Aclarar el tamaño real: la ficha dice 533 empleados y las fuentes públicas 1,001–5,000', responsable: 'Fátima', criterio: 'La ficha dice a qué alcance corresponde la cifra' },
    { accion: 'Reconstruir la serie de facturación de la cuenta para ver CUÁNDO empezó a encogerse. Hoy sólo se sabe el acumulado y el mes vigente.', responsable: 'Facturación', criterio: 'Se identifica el periodo de la caída, que es lo que dice si fue una decisión o una fuga' },
  ],

  plan_estrategico: [
    { accion: 'UNA ALERTA QUE COMPARE EL MES CONTRA LA VIDA. Esta cuenta perdió el 61% de su facturación sin que nada se encendiera: el detector de consumo necesita cinco cortes que no tiene, y el de importe sólo salta cuando no hay importe', responsable: 'Producto / Dirección', criterio: 'Una cuenta que cae por debajo de una fracción de su propio promedio histórico abre alerta' },
    { accion: 'Llamadas rastreadas por campaña, que es lo que una agencia necesita para probarle resultados a su anunciante', responsable: 'Producto / Fátima', criterio: 'Propuesta presentada con el caso de uso de la agencia, no con la lista de funciones' },
    { accion: 'Chat e IA de Chat: no los tiene y su negocio es generar contactos para terceros', responsable: 'Fátima', criterio: 'Propuesta entregada' },
    { accion: 'Gobernanza de cuenta AAA: reunión trimestral fija. Esta cuenta lleva 93 meses sin una sola.', responsable: 'Fátima / Dirección', criterio: 'Primera reunión agendada con fecha y asistentes' },
  ],

  areas_oportunidad: [
    { area: 'Revertir la baja falsa', impacto: '$32,375 al mes que el reporte de dirección da por perdidos sin comprobar', responsable: 'Facturación' },
    { area: 'Recuperar la medición', impacto: 'Cero llamadas y cero consumo: la cuenta no se puede auditar hoy', responsable: 'Ingeniería / Fátima' },
    { area: 'Integración API', impacto: 'Hay desarrollador del lado del cliente y un ticket de API sin seguimiento comercial', responsable: 'Fátima' },
    { area: 'Entender la caída del 61%', impacto: 'Unos $50,000 al mes ya perdidos, sin diagnóstico', responsable: 'Fátima / Dirección' },
    { area: 'Llamadas rastreadas por campaña', impacto: 'Es el producto que corresponde a lo que el cliente hace hoy', responsable: 'Producto' },
    { area: 'Primera reunión en 93 meses', impacto: 'Relación AAA sana y nunca sentada a una mesa', responsable: 'Fátima' },
  ],

  perfiles: [
    {
      nombre: 'Luis Torres León', rol: 'Estrategia comercial — Sección Amarilla', color: '#6366f1',
      campos: [
        { label: 'Correo',     value: 'luis.torres@seccionamarilla.com' },
        { label: 'Teléfono',   value: '55 2845 7919' },
        { label: 'Lo que dijo', value: '2 jul 2026: «todo se encuentra en orden sin cambio en operación»' },
        { label: 'Rol real',   value: 'Es el interlocutor de la relación. Lleva 74 días sin que le llegue nada.' },
      ],
    },
    {
      nombre: 'Emmanuel Roman Santibañez', rol: 'Desarrollador Java SR — Sección Amarilla', color: '#22c55e',
      campos: [
        { label: 'Capturado',  value: '1 sep 2026, en el mapa de decisores' },
        { label: 'Por qué importa', value: 'El ÚNICO ticket del histórico es de «APIs (voz)» y `tiene_integracion_api` está en falso' },
        { label: 'Sin correo', value: 'Está su correo pero no su teléfono' },
        { label: 'La puerta',  value: 'Es la conversación técnica que esta cuenta no ha tenido' },
      ],
    },
    {
      nombre: 'Fátima', rol: 'Asesora SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades', value: '7 registradas · 7 COMPLETADAS. El mejor registro de todas las auditorías escritas.' },
        { label: 'Lo que hizo bien', value: 'Capturó los decisores, llenó las observaciones KAM con el formato completo, confirmó el estado por teléfono' },
        { label: 'Dónde se cortó', value: 'Los próximos pasos comprometidos para la última semana de agosto no ocurrieron. Última actividad: 1 sep.' },
        { label: 'Con qué trabajaba', value: 'Con un importe equivocado, sin llamadas y sin consumo. El hueco no es suyo.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '93 meses de relación ininterrumpida y $7,679,888 facturados — la mayor facturación acumulada de las auditorías escritas',
      'Cero incidencias de pago en casi ocho años',
      'Siete actividades de siete completadas: el mejor registro de seguimiento de la cartera auditada',
      'Decisores capturados con nombre, cargo y correo, incluido un perfil técnico',
      'Un solo ticket en todo el histórico, sin fallas técnicas',
      'Score relacional 71, el más alto de las cuentas auditadas',
    ],
    oportunidades: [
      'Hay desarrollador del lado del cliente y un ticket de API sin seguimiento comercial',
      'No tiene Chat, IA de Chat, IA de Voz ni integración API contratados',
      'Su negocio —generar contactos para anunciantes— es el caso de uso exacto de las llamadas rastreadas',
      'Nunca ha tenido una reunión: la primera es territorio virgen, no una recuperación',
      'Es filial de América Móvil: una referencia dentro del mayor grupo de telecomunicaciones del país',
    ],
    debilidades: [
      'Factura el 39% de su propio promedio histórico y nadie lo había medido',
      'Cero lectura de llamadas y cero meses de consumo medible: la operación es invisible',
      'Ninguna reunión en 93 meses · 1 de 12 del Radar',
      '74 días sin contacto efectivo, con compromisos de agosto sin cumplir',
      'Su importe en la ficha está 2.6 veces por encima del real',
      'Tres de los cuatro bloques del Health Score son el valor por omisión',
    ],
    amenazas: [
      'EL REPORTE DE DIRECCIÓN LA DA POR PERDIDA: «Churn confirmado», $32,375, `sin_verificar`, en dos cortes seguidos. Si se publica sin revisar, se declara perdida una cuenta que acaba de facturar.',
      'La reconversión del cliente sigue en marcha: lo que compró en 2018 fue para un negocio que ya no existe, y si nadie rediseña el servicio, la caída del 61% tiene continuación natural',
      'Un cliente con desarrollador propio que toca nuestra API sin acompañamiento es un cliente que puede construirse la alternativa',
      'Es filial de Telmex: el mismo grupo tiene capacidad propia de telefonía, y una cuenta desatendida es una cuenta fácil de internalizar',
      'Sin llamadas ni consumo no hay forma de ver venir nada: el próximo aviso sería la carta de cancelación',
    ],
  },

  conclusion: 'Esta auditoría empezó como un expediente que no se podía escribir —sin llamadas, sin consumo, sin reuniones y sin una sola línea de facturación— y terminó siendo la de una cuenta que el tablero tenía mal en todo lo que importaba: mal el nombre, mal el importe y mal el estado.\n\nLo urgente es de dentro y es esta semana: Gross Revenue Facturación la da por perdida en dos cortes seguidos, sin verificar, y está equivocado con una prueba que no se discute — entre esos dos cortes la cuenta emitió otra factura y el acumulado subió exactamente su mensualidad. Un reporte de churn que incluya a Sección Amarilla hoy sería falso.\n\nLo importante es de fuera y es más incómodo: la cuenta factura el 39% de lo que facturó de media durante ocho años, y nadie lo sabía porque el tablero enseña el promedio. Son unos $50,000 al mes que ya se fueron. Lo que hay que averiguar no es si el cliente está molesto —no lo está: paga puntual, levanta un ticket al año y dice por teléfono que todo está en orden— sino qué quedó de su operación telefónica después de que la empresa dejara de imprimir directorios y se volviera una agencia digital.\n\nY hay una lección de la casa que no es sobre Sección Amarilla. El dato que destrabó todo —que en facturación se llama ADSA— llevaba meses escrito en los seguimientos de la propia cuenta. No hacía falta investigar nada: hacía falta que algo obligara a mirar las dos pantallas a la vez. Ésa es la tarea que deja este expediente.',

  pierde: [
    'Callpicker pierde $32,375 al mes si la cuenta se va — y ya perdió unos $50,000 al mes de lo que esta cuenta fue, sin diagnóstico.',
    'Se pierde la cuenta con mayor facturación acumulada de toda la cartera auditada: $7,679,888 en 93 meses.',
    'Se pierde una referencia dentro de América Móvil, el mayor grupo de telecomunicaciones de México.',
    'Y se pierde sin aviso: sin llamadas ni consumo medible, no hay indicador que pueda anticiparlo.',
  ],

  gana: [
    'Corregir la baja falsa devuelve $32,375 al mes al reporte de dirección y evita publicar una pérdida que no ocurrió.',
    'La cuenta no tiene contratados Chat, IA de Chat, IA de Voz ni API: la base para crecer está entera y hay interlocutor técnico para abrirla.',
    'Es el caso de uso natural de las llamadas rastreadas por campaña — lo que el cliente vende es exactamente eso para sus anunciantes.',
    'Una relación de 93 meses, sin conflictos y con pago impecable, es el punto de partida más fácil que hay para una primera reunión.',
  ],

  recomendacion_central: 'PRIMERO, Y ESTA SEMANA, HACIA DENTRO: revertir la baja. El GRC marca esta cuenta «Churn confirmado» con $32,375 de pérdida `sin_verificar` en los cortes del 2 y del 11 de octubre, y la prueba de que es falsa es aritmética — entre esos dos cortes el acumulado subió de $7,647,513 a $7,679,888, exactamente su mensualidad, y las facturas pasaron de 8 a 9. Una cuenta dada de baja no factura. En la misma pasada hay que atar «ADSA» a esta ficha —mejor asignándole el CID 12526 en origen que con una regla de alias— y corregir el importe, porque los $84,254 que muestra el tablero son el promedio de 93 meses y no el mes vigente.\n\nDESPUÉS, HACIA FUERA: llamar, y no para disculparse por los 74 días. La conversación que esta cuenta necesita no es de servicio —no hay nada roto: un ticket en todo el histórico y el propio cliente diciendo que todo está en orden—. Es de negocio. El cliente dejó de imprimir directorios en 2018 y se reconvirtió en agencia digital; lo que compró entonces, números sueltos y consumo, era para medir campañas de un negocio que ya cambió. Abrir con lo que su propio equipo tocó en julio —«vimos que trabajaron un tema de API, ¿qué están construyendo?»— lleva la conversación a su terreno y al único interlocutor técnico capturado.\n\nY SIN ESTO NO HAY NADA: pedir el export de llamadas y averiguar por qué esta cuenta no tiene un solo mes de consumo en los cortes. Hoy, de un cliente de telefonía con casi ocho años de relación, no podemos decir si usa el teléfono. Mientras eso siga así, cualquier cosa que afirmemos sobre su operación es opinión.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 1 ticket de «Sección Amarilla» (CID 12526) en lib/tickets-data.json',
    periodo: 'Julio 2026 · la fuente trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí',
    diagnostico: 'No hay nada que auditar en servicio, y decirlo es el hallazgo. UN ticket en todo el histórico de la mesa, sin falla técnica, en una cuenta de 93 meses. El contraste con las otras auditorías es total: Torres Corzo levanta 203 tickets. Esta cuenta no nos necesita para operar — lo cual es bueno y también explica por qué se puede encoger un 61% sin que nadie en soporte lo note. Lo único reprochable es que ese único ticket tardó 238 horas (10 días) en cerrarse, y aun así el cliente dijo por teléfono que «soporte dio rápida respuesta».',
    metricas: [
      { metrica: 'Tickets totales',       valor: '1 (jul 2026)',      lectura: 'En 93 meses de relación. No hay patrón que leer.' },
      { metrica: 'Fallas del servicio',   valor: '0 · 0.0%',          lectura: 'El producto no le ha fallado nunca que conste' },
      { metrica: 'Subcategoría',          valor: 'APIs (voz) · 100%', lectura: 'El único tema que ha traído a la mesa es la API — y no tiene integración registrada' },
      { metrica: 'Tiempo de resolución',  valor: '238 h · 10 días',   lectura: 'Por encima de los 7 días. Con un solo caso no hay mediana que valga.' },
      { metrica: 'Tickets por encima de 7 días', valor: '1 de 1',     lectura: 'El 100%, pero el denominador es uno: no se puede concluir' },
    ],
    reincidencias: [
      { patron: 'APIs (voz)', veces: '1 · 100%', causa: 'No es reincidencia, es el único caso. Importa por lo que señala: el cliente tiene equipo técnico y está trabajando la API sin integración registrada ni acompañamiento comercial.' },
    ],
    hallazgos: [
      'Un solo ticket en 93 meses es, en esta cartera, un dato excepcional: la mediana de las cuentas auditadas está muy por encima. No hay problema de servicio aquí.',
      'El 22 de julio el asesor registra un segundo asunto —ticket #111148, «un tema con una redirección de Telmex»— que no aparece en el export de la mesa. O se resolvió por otra vía, o la fuente no lo trae: hay que comprobar cuál.',
      'Con un denominador de 1, ninguna métrica de servicio de esta cuenta es interpretable. Se publican para que conste que se miraron, no para concluir.',
    ],
  },
}
