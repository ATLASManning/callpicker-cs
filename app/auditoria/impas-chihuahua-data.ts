import type { AuditoriaCase } from './types'

/**
 * IMPAS · Instituto Municipal de Prevención y Atención a la Salud
 * (Z63 · CID 177810) — la cuenta que el tablero tenía en CERO.
 *
 * Auditoría del 13 oct 2026. Se escribe porque al reordenar el TOP 50 por el
 * importe BUENO apareció de la nada: su ficha dice $0 y su MRR real son
 * $65,640 al mes. Estaba hundida al fondo de todas las listas —de los
 * rankings, del TOP 25, de cualquier priorización por dinero— por un cero que
 * no era una medición sino una ausencia de captura.
 *
 * DOS FUENTES, Y LAS DOS HACÍAN FALTA
 * -----------------------------------
 * Lo interno: ficha, llamadas, tickets, GRC y alertas.
 * Lo externo: la ficha institucional que dirección compiló el 13 oct 2026 del
 * sitio del Municipio de Chihuahua —directorio de 14 funcionarios con nombre,
 * cargo, correo y extensión; ocho ubicaciones; los servicios del organismo—.
 *
 * Sin lo externo, esta auditoría habría repetido lo que ya decía la ficha: que
 * no se sabe quién es el cliente. Con lo externo, el hallazgo se da la vuelta:
 * **el contacto que el asesor no encontraba lleva meses publicado en un sitio
 * .gob.mx**, con correo institucional y extensión.
 *
 * v1.1 — LA INVESTIGACIÓN YA ESTÁ EN LA FICHA, NO SÓLO AQUÍ
 * ----------------------------------------------------------
 * La v1.0 cometió un error de alcance: escribió el expediente y dejó la ficha
 * de la cuenta igual que estaba, con el director equivocado, el teléfono en
 * ceros y la facturación en $0. **Una auditoría que vive sólo en su módulo no
 * le sirve al asesor que abre la cuenta** — el dato tiene que estar donde se
 * trabaja. Lo señaló dirección.
 *
 * El 13 oct 2026 se escribió en `cuentas` (Z63) con
 * `scripts/enriquece-impas.py`, que corre en simulacro por omisión y comprueba
 * leyendo de vuelta: importe $0 → $65,640 · director corregido · los 14
 * funcionarios del directorio público capturados como contactos · 8
 * ubicaciones · giro precisado · notas reescritas con el contexto del
 * organismo · y un addendum fechado en las observaciones del KAM que NO borra
 * lo que el asesor escribió, sino que desmiente sus tres afirmaciones caducas
 * al lado.
 *
 * Lo que NO se escribió, a propósito: `total_empleados` y `tamano_empresa`
 * siguen vacíos porque el personal no está validado públicamente, y los
 * correos de los 12 funcionarios sin correo publicado no se construyeron por
 * patrón aunque el patrón se vea.
 *
 * LAS CIFRAS, VERIFICADAS UNA POR UNA
 * -----------------------------------
 *   · importe   → GRC por CID: $65,640 «MRR estable», y CUADRA AL CENTAVO con
 *                 los servicios contratados ($63,450 Marcación Corta + $2,190
 *                 Extensión CE). 10 facturas en 10 meses.
 *   · llamadas  → app/cuentas/llamadas-data.ts, CID 177810. 352 entrantes,
 *                 TODAS al IVR, cero a una persona, cero minutos.
 *   · tickets   → lib/tickets-data.json, 1 fila
 *   · alertas   → alertas_episodios, 2 abiertas
 *   · el cliente → impas.mpiochih.gob.mx y el directorio municipal
 *
 * LO QUE SE CONSERVA COMO DUDA, PORQUE LA FUENTE LO DICE ASÍ
 * ----------------------------------------------------------
 * La investigación institucional marca sus propios límites y aquí se respetan
 * en vez de aplanarlos: el personal total y el presupuesto no están validados
 * documentalmente; las ocho ubicaciones son «de referencia», no un inventario
 * certificado; los teléfonos de las tres UBR vienen de un comunicado de
 * octubre de 2024 y hay que confirmar que sigan operativos; las clínicas
 * colaboradoras NO son oficinas del IMPAS; y el nombramiento de la
 * subdirección de Salud Mental difiere entre dos versiones del directorio.
 * Un dato con reserva se escribe con su reserva. [[feedback-cero-sin-medicion]]
 */
export const IMPAS_CHIHUAHUA: AuditoriaCase = {
  id: 'impas-chihuahua',
  asesor: 'Dan',
  nombre: 'IMPAS · Instituto Municipal de Prevención y Atención a la Salud',
  sector: 'Gobierno municipal · Salud pública — organismo público descentralizado del Municipio de Chihuahua',
  fecha_periodo: 'Diciembre 2025 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA · 10 meses · gobierno municipal',
  descripcion_contexto: '$65,640 al mes y la ficha decía $0 — por eso nunca se auditó · El 96.7% del contrato es UN producto: la Marcación Corta (el 072) · 352 llamadas medidas en enero, ninguna llegó a una persona, y desde el 21 de enero no hay ni una más',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.1',

  kpis: [
    { label: 'MRR real · la ficha decía $0',      value: '$65,640',    color: '#ef4444' },
    { label: 'Del contrato es la Marcación Corta', value: '96.7%',     color: '#f97316' },
    { label: 'De 352 llamadas llegaron a alguien', value: '0',         color: '#ef4444' },
    { label: 'Minutos de conversación medidos',    value: '0',         color: '#ef4444' },
    { label: 'Sin una sola llamada desde',         value: '21 ene',    color: '#f59e0b' },
    { label: 'Facturas pagadas de 10 meses',       value: '10 de 10',  color: '#22c55e' },
  ],

  resumen_ejecutivo: 'EMPEZANDO POR LO QUE EXPLICA TODO LO DEMÁS: esta cuenta factura $65,640 al mes y el tablero la tenía en CERO. No es la cuarta cifra equivocada de esta serie de auditorías, es la más cara de todas, porque un cero no desplaza un puesto: hunde la cuenta al fondo de cada lista. IMPAS es la segunda cuenta más grande de todas las que cruzan por CID en Gross Revenue Facturación, sólo por detrás de Tech People, y nunca entró a ninguna priorización por dinero. Por eso llega a auditarse hoy y no hace diez meses.\n\nEl importe está verificado y cuadra al centavo contra lo contratado: $63,450 de «Renta de número de Marcación Corta» más $2,190 de tres Extensiones CE dan exactamente los $65,640 que publica el GRC. Y ahí está el segundo dato que ordena la cuenta: **el 96.7% de lo que paga este cliente es UN SOLO producto, el número de marcación corta**. No es una cuenta de telefonía con varios servicios: es un número, y todo lo demás es accesorio. Si ese número se va, se va la cuenta entera.\n\nLO QUE NO SE PUEDE VER, Y ES CASI TODO. Hay 352 llamadas entrantes medidas, todas entre el 1 y el 21 de enero de 2026. Después de esa fecha no hay ni una más, y el corte de la entrega llega hasta el 14 de septiembre: son casi ocho meses sin un solo registro. Tampoco hay consumo: cero de cinco meses con dato, con alerta crítica abierta desde el 6 de octubre. De la cuenta número dos de la cartera no sabemos nada de su operación desde enero.\n\nY LAS 352 QUE SÍ SE MIDIERON DICEN ALGO INCÓMODO: ninguna llegó a una persona. Cero. Las 352 terminaron en el menú automático, con CERO minutos de conversación. El tablero las reporta como «0% sin contestar» —porque la máquina contestó— y ésa es una luz verde falsa: contra la definición de la casa, donde «atendida» significa que alguien la tomó, la cifra real es 0 de 352. El asesor, mirando el panel, escribió lo contrario: que «todas aparecen con estatus de perdidas». Los dos miraban el mismo dato con definiciones distintas, y ninguna de las dos lecturas llegó a ser una pregunta para el cliente.\n\nEL CONTACTO QUE NADIE ENCONTRABA ESTÁ PUBLICADO. Las observaciones del asesor dicen que el único dato disponible es el del contratante, Luis Álvarez, y que no responde a los correos. Mientras tanto el Municipio de Chihuahua publica en su sitio el directorio completo del organismo: catorce funcionarios con nombre, cargo, correo institucional y extensión, incluidos el director general y —lo que importa aquí— el subdirector administrativo, que es exactamente quien lleva contratación y presupuesto. La ficha, además, tiene mal al director: registra a «Lic. Erick Lucero» cuando el directorio municipal nombra al Dr. Luis Antonio Arrieta Trevizo, y guarda su teléfono como «0000000000».\n\nY EL CLIENTE ESTÁ VIVO, CONTRA LO QUE LA FICHA SUGIERE. Ha pagado diez facturas en diez meses, sin una sola incidencia. En septiembre de 2026 el Municipio publicó una extensión NUEVA sobre este servicio —072, extensión 5495, para agendar consultas dentales, de 8:00 a 18:00—, y en octubre abrió un ticket con la mesa por un tema de facturación. Un cliente que publica extensiones nuevas y que llama para hablar de su factura no es un cliente ausente: es un cliente al que no estamos mirando.',

  resultado_positivo: 'El cliente paga, y paga completo. Diez facturas en diez meses desde el alta del 24 de diciembre de 2025, cero incidencias de pago, y el GRC lo clasifica «MRR estable» con pérdida cero y clasificación AAA. En una cartera donde esta misma semana hemos encontrado cuentas marcadas de baja por error, ésta no tiene una sola sombra en su historial de cobranza.\n\nEl servicio tampoco falla: UN solo ticket en toda la relación, de categoría «Facturación y Pagos», sin falla técnica, resuelto en 42 horas. No hay un problema de producto que arreglar aquí.\n\nY hay una señal de uso que vale más que cualquier métrica interna: **el cliente está publicando extensiones nuevas sobre este servicio**. En septiembre de 2026 el Municipio difundió el 072 extensión 5495 para agendar consultas dentales, con horario de 8:00 a 18:00. Un organismo no publica un canal de atención ciudadana sobre una plataforma que no usa. El servicio está vivo; lo que no está es nuestra medición.\n\nEl trabajo del asesor además dejó rastro útil: tres actividades registradas y las tres completadas, con un análisis del 7 de septiembre que detectó por escrito «irregularidades que requieren validación directa con el cliente». La lectura era correcta; lo que faltó fue a quién preguntarle, y eso se resuelve hoy.',

  hallazgos: [
    'IMPORTE — LA FICHA DECÍA $0 Y SON $65,640 AL MES. Es la segunda cuenta más grande de todas las que cruzan por CID en Gross Revenue Facturación, sólo detrás de Tech People. Un cero no desplaza un puesto en el ranking: manda la cuenta al fondo de TODAS las listas ordenadas por dinero, así que esta cuenta nunca entró a una priorización, a un TOP 25 ni a una auditoría. Diez meses invisible por un campo sin capturar.',
    'IMPORTE — Y CUADRA AL CENTAVO, lo cual confirma que el dato bueno es el del GRC y no el de la ficha: $63,450 de «Renta de número de Marcación Corta» más $2,190 de tres Extensiones CE dan exactamente $65,640. La reconciliación es exacta, no aproximada.',
    'ESTRUCTURA — EL 96.7% DEL CONTRATO ES UN SOLO PRODUCTO: la Marcación Corta, $63,450 de los $65,640. Las tres extensiones valen $2,190 entre las tres. Esto no es una cuenta de telefonía con varios servicios: es UN NÚMERO. Concentra todo el riesgo y todo el valor en una sola línea de contrato, y cualquier conversación de renovación es, en realidad, la conversación de esa línea.',
    'MEDICIÓN — NO HAY UNA SOLA LLAMADA DESDE EL 21 DE ENERO. Las 352 entrantes medidas caen entre el 1 y el 21 de enero de 2026; el corte de la entrega llega al 14 de septiembre. Son casi ocho meses sin un registro de una cuenta que paga $65,640 al mes. O la captura se rompió, o el tráfico dejó de pasar por donde lo medimos: las dos cosas hay que saberlas, y ninguna se puede suponer.',
    'MEDICIÓN — Cero de cinco meses con dato de consumo. Alerta `sin_consumo_medible` abierta desde el 6 de octubre, severidad crítica. De la cuenta número dos de la cartera no se puede decir si usa el servicio.',
    'ATENCIÓN — DE 352 LLAMADAS, NINGUNA LLEGÓ A UNA PERSONA. Las 352 terminaron en el menú automático: `redir` 0, `buzón` 0, y CERO minutos de conversación en total. El contraste con cuentas comparables es absoluto — CBS Compresores tiene 12,883 llamadas atendidas por personas y 36,798 minutos sobre 17,283 entrantes; GTC, 84,081 y 384,252 sobre 208,255.',
    'ATENCIÓN — Y EL TABLERO LO PINTA COMO «0% SIN CONTESTAR», que es una luz verde falsa. El indicador cuenta la llamada como contestada porque la contestó la MÁQUINA. Contra la definición de la casa —«atendida» es la que llega a una persona— la cifra real es 0 de 352. Es la misma firma que ya documentamos en OOAPAS, pero al revés: allí producía una falsa alarma del 99.7%, aquí produce un falso todo-en-orden.',
    'ATENCIÓN — LAS DOS LECTURAS CONVIVIERON SIN QUE NADIE PREGUNTARA. El asesor escribió en las observaciones que «todas las llamadas aparecen con estatus de perdidas»; el tablero decía 0%. Los dos miraban el mismo dato con definiciones distintas y la contradicción se quedó dentro de la ficha. Una discrepancia entre dos pantallas de la casa es una pregunta para el cliente, no una nota al pie.',
    'ATENCIÓN — EL TRÁFICO ENTRA A TODAS HORAS: 22 de las 24 horas del día tienen llamadas, incluidas las de madrugada, y los siete días de la semana (sábado 39, domingo 43). El horario administrativo publicado del organismo es de lunes a viernes de 8:00 a 15:00. O hay un canal 24/7 detrás —el organismo opera una línea de atención a crisis *800 «Hablar Salva Vidas», 24/7— o hay llamadas entrando a horas en las que no hay nadie. Es la primera pregunta técnica que hay que hacer.',
    'RIESGO — SI LA LÍNEA DE CRISIS PASA POR AQUÍ, ESTO DEJA DE SER UN TEMA DE SLA. El organismo opera una línea de atención a crisis 24/7 («Hablar Salva Vidas», *800). NO está confirmado que ese canal viaje sobre nuestro servicio, y no se debe suponer — pero confirmarlo o descartarlo es lo primero del plan, porque si viaja, una llamada que no llega a una persona no es una métrica: es una emergencia sin atender.',
    'RELACIÓN — EL CONTACTO QUE NADIE ENCONTRABA ESTÁ PUBLICADO EN UN SITIO .GOB.MX. Las observaciones KAM dicen que el único dato disponible es el del contratante, Luis Álvarez, y que no responde correos. El Municipio de Chihuahua publica el directorio completo del organismo con catorce funcionarios, cada uno con cargo, correo institucional y extensión. No era un dato difícil: era un dato que nadie fue a buscar.',
    'RELACIÓN — EL DECISOR ÚTIL TIENE NOMBRE, CORREO Y EXTENSIÓN: C.P. Miguel de los Santos Arévalo, subdirector administrativo (miguel.delossantos@mpiochih.gob.mx, 614 200-4800 ext. 2255). En un organismo público, contratación, renovación y presupuesto pasan por la subdirección administrativa, no por la dirección general. Es el contacto que esta cuenta necesitaba desde diciembre.',
    'FICHA — EL DIRECTOR REGISTRADO NO ERA EL DIRECTOR. La ficha guardaba «Lic. Erick Lucero — Director IMPAS» con teléfono «0000000000», cuando el directorio municipal nombra al Dr. Luis Antonio Arrieta Trevizo (ext. 2264). Un contacto equivocado es peor que ninguno: hace creer que la cuenta está mapeada. CORREGIDO el 13 oct 2026, junto con la captura del directorio completo — la ficha pasó de 2 contactos, uno de ellos falso, a 15.',
    'OPERACIÓN — EL CLIENTE PUBLICÓ UNA EXTENSIÓN NUEVA EN SEPTIEMBRE. El Municipio difundió el 072 extensión 5495 para agendar consultas dentales, de lunes a viernes de 8:00 a 18:00. Dos cosas se siguen de ahí: que el servicio está vivo y creciendo en usos, y que **hay flujos de atención diferenciados por servicio** — algo que nuestra medición no refleja en ninguna parte.',
    'OPERACIÓN — OCHO UBICACIONES DE REFERENCIA, Y NO SABEMOS CÓMO TELEFONEAN. Cuatro sedes principales, tres Unidades Básicas de Rehabilitación y un Centro de Equinoterapia. Las tres UBR tienen teléfonos propios publicados (614 434 4065, 614 424 5194, 614 446 0586) en un comunicado municipal de octubre de 2024. Si esas sedes marcan por fuera, hay tráfico del cliente que no pasa por nosotros — y es la conversación de crecimiento más concreta que tiene esta cuenta. (La cifra de ocho es de referencia, no un inventario certificado, y los teléfonos hay que confirmar que sigan operativos.)',
    'CONTRADICCIÓN — LA FICHA DICE QUE LA CUENTA NO TIENE NADA CONFIGURADO, Y EL CLIENTE PUBLICA EXTENSIONES. Las observaciones afirman que «no cuenta con un número Callpicker asignado ni con extensiones configuradas». Pero paga $63,450 al mes por un número de marcación corta, y el Municipio publica catorce extensiones en el rango 2251–2389 más la 5495 nueva. Lo que la ficha describe y lo que el cliente hace no se parecen: hay que ir a ver cuál de las dos cosas es verdad.',
    'SERVICIO — El cliente SÍ está en contacto: abrió un ticket en octubre de 2026 por «Facturación y Pagos (voz)», resuelto en 42 horas sin falla técnica. Es posterior a las observaciones del 11 de septiembre que lo daban por ilocalizable. La cuenta responde cuando le toca pagar: eso es una vía de contacto, y es la única que ha funcionado.',
    'RELACIÓN — Cero reuniones en diez meses · 1 de 12 del Radar · score relacional 27, el más bajo de todas las auditorías escritas. Health Score 47, con tres de sus cuatro bloques en el 50 por omisión, o sea medido al 25%.',
    'CONTEXTO — ES UN ORGANISMO PÚBLICO DESCENTRALIZADO, creado por acuerdo municipal en noviembre de 2021, y eso cambia el calendario de la cuenta: contratación y renovación van por ciclo presupuestal, y un cambio de administración municipal puede reabrir decisiones que un cliente privado no reabre. No es un riesgo hoy; es el reloj que esta cuenta tiene y que no está anotado en ninguna parte.',
    'FICHA — Campos sin capturar que importan en un cliente de este tipo: `tamano_empresa`, `total_empleados` y `num_oficinas` están vacíos. Sabemos por la investigación que son ocho ubicaciones de referencia, pero el personal total no está validado documentalmente en ninguna fuente pública: se anota como no medido en vez de estimarlo.',
  ],

  cronologia: [
    { fecha: 'Nov 2021',     responsable: 'Municipio de Chihuahua', evento: 'Se crea el IMPAS por acuerdo municipal, como organismo público descentralizado de prevención y atención a la salud.', tipo: 'neutral' },
    { fecha: '24 Dic 2025',  responsable: 'Callpicker',             evento: 'Alta de la cuenta. Servicios: renta de número de Marcación Corta ($63,450) y tres Extensiones CE ($2,190). El 96.7% del valor es el número.', tipo: 'ok' },
    { fecha: '01–21 Ene 2026', responsable: 'Operación IMPAS',      evento: '352 llamadas entrantes medidas. TODAS terminan en el menú automático: cero llegan a una persona, cero minutos de conversación. Entran a 22 de las 24 horas y los siete días.', tipo: 'problema' },
    { fecha: '21 Ene 2026',  responsable: 'Medición',               evento: 'ÚLTIMA llamada registrada. A partir de aquí no hay un solo registro, y el corte de la entrega llega hasta el 14 de septiembre.', tipo: 'pivote' },
    { fecha: 'Ene–Oct 2026', responsable: 'Facturación',            evento: 'Diez facturas en diez meses, sin una sola incidencia. GRC «MRR estable», pérdida cero, clasificación AAA. El cliente paga puntualmente todo el periodo invisible.', tipo: 'ok' },
    { fecha: '05 Ago 2026',  responsable: 'Dan',                    evento: 'Análisis cerrado: «No se ha detectado ningún SLA excedido ni interacciones mediante chat, se tiene mapeado al DM de la cuenta».', tipo: 'neutral' },
    { fecha: '12 Ago 2026',  responsable: 'Dan',                    evento: 'Análisis cerrado: «no se ha detectado interacciones relevantes de la cuenta».', tipo: 'neutral' },
    { fecha: '07 Sep 2026',  responsable: 'Dan',                    evento: 'Validación cerrada: «durante el análisis se detectaron irregularidades que requieren validación directa con el cliente». La lectura era correcta; faltaba a quién preguntarle.', tipo: 'problema' },
    { fecha: 'Sep 2026',     responsable: 'Municipio de Chihuahua', evento: 'Se publica el 072 extensión 5495 para agendar consultas dentales, de 8:00 a 18:00. El cliente está AMPLIANDO usos sobre el servicio mientras nosotros no vemos tráfico.', tipo: 'ok' },
    { fecha: '11 Sep 2026',  responsable: 'Dan',                    evento: 'Correo de seguimiento a ambos contactos (interacción #115235). Último contacto registrado. Las observaciones KAM quedan escritas: el contratante no responde correos.', tipo: 'problema' },
    { fecha: 'Oct 2026',     responsable: 'Mesa de ayuda',          evento: 'El cliente abre un ticket de «Facturación y Pagos (voz)», resuelto en 42 horas sin falla. Está localizable: responde por la vía de la factura.', tipo: 'neutral' },
    { fecha: '06 Oct 2026',  responsable: 'Motor de alertas',       evento: 'Se abre `sin_consumo_medible`, severidad crítica: cero de cinco meses con dato de consumo.', tipo: 'problema' },
    { fecha: '13 Oct 2026',  responsable: 'Callpicker',             evento: 'Al reordenar el TOP 50 por el importe bueno, la cuenta aparece: la ficha decía $0 y son $65,640. Y la investigación institucional localiza el directorio completo del organismo, con el decisor administrativo y su extensión.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Nombre',                value: 'Instituto Municipal de Prevención y Atención a la Salud (IMPAS)' },
    { label: 'Naturaleza',            value: 'Organismo público descentralizado del Municipio de Chihuahua, creado por acuerdo municipal en noviembre de 2021' },
    { label: 'Sector',                value: 'Gobierno municipal · Salud pública' },
    { label: 'Ciudad',                value: 'Chihuahua, Chihuahua' },
    { label: 'Sitio',                 value: 'impas.mpiochih.gob.mx · municipiochihuahua.gob.mx' },
    { label: 'Director general',      value: 'Dr. Luis Antonio Arrieta Trevizo — antonio.arrieta@mpiochih.gob.mx · ext. 2264. LA FICHA TIENE OTRO NOMBRE.' },
    { label: 'Teléfono institucional',value: '(614) 200-4800 · línea municipal 072, extensiones 2259, 2260 y 2261' },
    { label: 'Horario administrativo',value: 'Lunes a viernes, 8:00–15:00 (publicado). La línea de crisis es 24/7 y la de citas dentales 8:00–18:00.' },
    { label: 'Ubicaciones',           value: '8 de referencia: 4 sedes + 3 Unidades Básicas de Rehabilitación + 1 Centro de Equinoterapia. NO es un inventario certificado.' },
    { label: 'Personal total',        value: 'NO MEDIDO — no identificado públicamente con certeza suficiente. No se estima.' },
    { label: 'Presupuesto',           value: 'NO MEDIDO — pendiente de validación documental.' },
    { label: 'Cliente desde',         value: '24 de diciembre de 2025 — 10 meses' },
    { label: 'Servicios contratados', value: 'Renta de número de Marcación Corta ($63,450) + 3 Extensiones CE ($2,190). Total $65,640 — cuadra al centavo con el GRC.' },
    { label: 'Facturación mensual',   value: '$65,640 MXN (GRC `mrrFin`, «MRR estable», AAA). LA FICHA DICE $0.' },
    { label: 'Salud de pago',         value: 'Al corriente · 10 facturas en 10 meses · 0 incidencias' },
    { label: 'Health Score',          value: '47 · relacional 27, actividad 50, adopción 50, pago 50 (tres de cuatro son el valor por omisión)' },
  ],

  necesidad_negocio: 'IMPAS no vende nada por teléfono: atiende a ciudadanos. Es un organismo público de salud que da consulta médica y dental, psicoterapia, rehabilitación física y ocupacional, atención metabólica y —esto es lo que cambia la conversación— una línea de atención a crisis abierta 24 horas, «Hablar Salva Vidas».\n\nEso define qué significa una llamada aquí. En una empresa, una llamada perdida es una venta que no ocurrió. En un organismo de salud pública, una llamada perdida es un ciudadano que no recibió atención, y en el caso de la línea de crisis puede ser bastante más que eso. El cliente no está comprando capacidad comercial: está comprando que el teléfono de un servicio público funcione.\n\nY la forma del contrato lo confirma: el 96.7% de lo que paga es el NÚMERO —la marcación corta, el 072 por el que un ciudadano de Chihuahua marca sin saberse un número largo—. Las extensiones son el accesorio. Lo que compró es el acceso.\n\nLa necesidad real que tiene hoy, y que nadie le ha ofrecido, es saber qué pasa con ese acceso: cuántos marcan, a qué horas, a qué servicio, cuántos esperan y cuántos cuelgan. Es un organismo que rinde cuentas públicas y que acaba de publicar una extensión nueva para citas dentales: el dato de atención telefónica por servicio es, para él, materia de informe. Hoy no lo tiene, y nosotros tampoco.',

  potencial_corto: [
    'Recuperar la medición: no hay una sola llamada desde el 21 de enero ni un mes de consumo. Sin eso no se puede hablar de nada más, y es lo único que vuelve gestionable una cuenta de $65,640 al mes.',
    'Averiguar por qué ninguna de las 352 llamadas llegó a una persona. O el enrutamiento termina en un menú sin salida, o la transferencia ocurre fuera de nuestra vista: las dos respuestas abren trabajo distinto.',
    'Reporte de atención por servicio: el cliente acaba de publicar una extensión para citas dentales con horario propio. Medir cada flujo por separado es lo que un organismo público necesita para informar.',
    'Capturar los decisores que ya están publicados —director general y subdirector administrativo, con correo y extensión— y corregir el director que la ficha tiene mal.',
  ],

  potencial_largo: [
    'Las tres Unidades Básicas de Rehabilitación tienen teléfonos propios publicados. Si marcan por fuera, hay tráfico del cliente que no pasa por nosotros: es la conversación de crecimiento más concreta de esta cuenta.',
    'IA de Voz para la línea de citas: un organismo con horario de 8:00 a 18:00 en citas dentales y tráfico a 22 de las 24 horas tiene una franja larga sin nadie detrás.',
    'Callpicker Chat: no lo tiene contratado, y un organismo de salud con atención psicológica tiene canales donde el texto sirve mejor que la voz.',
    'La puerta del Municipio: IMPAS es UN organismo descentralizado del Municipio de Chihuahua. Una cuenta bien llevada aquí es la referencia natural hacia las demás dependencias del mismo ayuntamiento.',
  ],

  tacticas: [
    { nombre: 'Entrar por la subdirección administrativa', descripcion: 'Escribir al C.P. Miguel de los Santos Arévalo (ext. 2255), no al director general. En un organismo público, contratación y presupuesto viven ahí.', impacto: 'Es el contacto que resuelve renovación y el único que puede explicar el ticket de facturación de octubre.' },
    { nombre: 'Llevar la pregunta técnica, no el reproche', descripcion: 'Abrir con «no estamos viendo su tráfico desde enero y queremos entender por qué»: es un problema nuestro de medición, no una acusación al cliente.', impacto: 'Un organismo público responde mejor a una petición de verificación técnica que a una llamada comercial.' },
    { nombre: 'Preguntar por la línea de crisis ANTES que por nada', descripcion: 'Confirmar si «Hablar Salva Vidas» viaja sobre este servicio. No suponerlo en ninguna dirección.', impacto: 'Si viaja, reordena todas las prioridades de la cuenta. Si no, se descarta en una frase y se sigue.' },
    { nombre: 'Ofrecer el reporte que necesita para informar', descripcion: 'Un organismo público rinde cuentas. El desglose de atención por servicio y por horario es material de informe, no una función de producto.', impacto: 'Convierte la conversación de «qué nos paga» a «qué le damos», con un entregable que nadie más le da.' },
  ],

  senal_alarma: 'La segunda cuenta más grande de la cartera estuvo diez meses en CERO en el tablero, pagando $65,640 cada mes sin que nadie la priorizara. En ese tiempo no hubo una reunión, no se registró una llamada desde el 21 de enero, no hubo un mes de consumo medible, y las 352 llamadas que sí se midieron no llegaron a una sola persona mientras el indicador decía «0% sin contestar». El contacto que el asesor no conseguía estaba publicado en un sitio del gobierno municipal. Si esta cuenta no renueva, nos enteramos por la factura que deje de llegar.',

  problema_raiz: 'Un campo vacío apagó la cuenta. Con la facturación en cero, IMPAS no apareció en ninguna lista ordenada por dinero durante diez meses, y lo que no aparece no se audita, no se prioriza y no se visita.',

  problema_raiz_detalle: 'El origen es mecánico y por eso es tan caro: `cuentas.facturacion` quedó en cero cuando la cuenta se importó —sus propias `notas` lo dicen: «Cuenta importada — pendiente capturar: activo_desde, contacto principal, giro, servicios contratados, MRR»—. A partir de ahí, todo lo que el tablero ordena por importe la mandó al fondo: el TOP 25, la priorización de auditorías, el peso en cualquier reporte. No es que alguien la despriorizara; es que nunca compitió. Un cero no es un número pequeño en una lista ordenada: es la exclusión de la lista.\n\nLa segunda capa es de medición, y tiene dos huecos distintos. El primero: no hay una sola llamada desde el 21 de enero y cero meses con dato de consumo, de modo que durante ocho meses no hubo absolutamente nada que mirar. El segundo es peor porque no se ve: las 352 llamadas que sí se midieron se reportan como «0% sin contestar» cuando ninguna llegó a una persona. El indicador cuenta la llamada como contestada porque la contestó la máquina, y eso produce una luz verde sobre una cuenta ciega. Ya conocíamos esta firma en OOAPAS, donde generaba una falsa alarma del 99.7%; aquí genera lo contrario, que es más difícil de detectar porque nadie investiga un verde.\n\nLa tercera es de relación, y es la que más fácil se podía haber evitado. El asesor dejó escrito que no tenía a quién escribirle y que el contratante no respondía. El cliente es una dependencia de gobierno: su directorio es información pública y está publicado, con catorce funcionarios, sus cargos, sus correos institucionales y sus extensiones. No fue un problema de acceso ni de esfuerzo: fue que buscar en el sitio del cliente no es un paso del procedimiento. Las observaciones lo dicen con todas sus letras —«no se identificó presencia relevante en LinkedIn»— y ahí se detuvo la búsqueda. Para un cliente privado, LinkedIn es razonable; para una dependencia municipal, el directorio oficial es la fuente, y es mejor.\n\nY la cuarta, que es de criterio: dos pantallas de la casa dijeron cosas opuestas sobre las mismas 352 llamadas —el tablero «0% perdidas», el asesor «todas perdidas»— y la contradicción se quedó escrita dentro de la ficha sin convertirse en una pregunta. Cuando dos de nuestras fuentes se contradicen sobre un cliente, eso no es un matiz: es exactamente el momento de llamar.',

  flujo_real: [
    { fase: 'El ciudadano marca',        area: 'Ciudadano de Chihuahua', accion: 'Marca el 072, la marcación corta del Municipio', resultado: 'El acceso es el producto: el 96.7% del contrato es ese número' },
    { fase: 'Entra a la plataforma',     area: 'Callpicker',             accion: 'La llamada llega y la atiende el menú automático', resultado: '352 llamadas medidas, las 352 al IVR' },
    { fase: 'Debería pasar a alguien',   area: 'IMPAS',                  accion: 'Transferencia a la extensión del área que corresponda', resultado: 'CERO llegaron a una persona · CERO minutos de conversación' },
    { fase: 'El tablero lo evalúa',      area: 'Dashboard',              accion: 'Calcula el porcentaje sin contestar', resultado: '«0% sin contestar» — porque contestó la máquina. Luz verde sobre una cuenta ciega.' },
    { fase: 'Se corta la medición',      area: 'Medición',               accion: '—', resultado: 'Ni una llamada desde el 21 ene · 0 de 5 meses de consumo · ocho meses sin nada' },
    { fase: 'La cuenta factura igual',   area: 'Facturación',            accion: 'Se emite la mensualidad', resultado: '10 facturas en 10 meses, $65,640, «MRR estable», sin incidencias' },
    { fase: 'La ficha pinta el importe', area: 'Dashboard',              accion: 'Lee `cuentas.facturacion`', resultado: '$0 — la cuenta desaparece de toda lista ordenada por dinero' },
    { fase: 'El asesor busca contacto',  area: 'SAC',                    accion: 'Correos al contratante · búsqueda en LinkedIn', resultado: 'Sin respuesta. El directorio oficial, con 14 funcionarios, no se consultó.' },
  ],

  comparativo: [
    { metrica: 'Importe en la ficha', real: '$0', ideal: '$65,640 — el del GRC, que cuadra al centavo con lo contratado' },
    { metrica: 'Puesto por dinero en la cartera', real: 'El último, por el cero', ideal: 'El segundo de las cuentas que cruzan por CID' },
    { metrica: 'Llamadas que llegaron a una persona', real: '0 de 352', ideal: 'Lo que el cliente haya definido; hoy no está definido' },
    { metrica: 'Minutos de conversación medidos', real: '0', ideal: 'CBS Compresores: 36,798 sobre 17,283 entrantes' },
    { metrica: 'Lo que reporta el indicador', real: '«0% sin contestar»', ideal: 'Que distinga contestada POR UNA PERSONA de contestada por la máquina' },
    { metrica: 'Última llamada registrada', real: '21 de enero de 2026', ideal: 'El corte de la entrega: 14 de septiembre' },
    { metrica: 'Meses con dato de consumo', real: '0 de 5', ideal: '5 de 5' },
    { metrica: 'Reuniones en 10 meses', real: 'NINGUNA', ideal: 'Al menos una en el alta y otra trimestral' },
    { metrica: 'Decisores capturados', real: '2, y el principal está MAL (director equivocado, teléfono 0000000000)', ideal: 'Director general y subdirector administrativo, los dos publicados' },
    { metrica: 'Radar de 12 preguntas', real: '1 respondida', ideal: '12 de 12' },
    { metrica: 'Bloques del Health Score medidos', real: '1 de 4 (sólo el relacional)', ideal: '4 de 4' },
  ],

  plan_inmediato: [
    { accion: '✓ HECHO el 13 oct 2026 — Corregido el importe de la ficha: $0 → $65,640, el del GRC, que cuadra al centavo con los servicios contratados. La cuenta vuelve a todas las listas ordenadas por dinero de las que llevaba diez meses fuera', responsable: 'Facturación', criterio: 'Aplicado y comprobado leyendo de vuelta con `scripts/enriquece-impas.py`' },
    { accion: 'CONFIRMAR si la línea de atención a crisis 24/7 («Hablar Salva Vidas», *800) viaja sobre nuestro servicio. No suponerlo en ninguna dirección', responsable: 'Dan / Ingeniería', criterio: 'Respuesta escrita del cliente. Si es que sí, la cuenta se reprioriza entera ese mismo día.' },
    { accion: 'Escribir al C.P. Miguel de los Santos Arévalo, subdirector administrativo (miguel.delossantos@mpiochih.gob.mx, ext. 2255), y al Dr. Luis Antonio Arrieta Trevizo, director general (ext. 2264). Los dos ya están capturados en la ficha — lo que falta es la llamada', responsable: 'Dan', criterio: 'Respuesta de al menos uno, registrada en seguimiento' },
    { accion: 'Averiguar con Ingeniería por qué no hay una sola llamada desde el 21 de enero ni un mes de consumo, en una cuenta que factura $65,640', responsable: 'Ingeniería', criterio: 'O entra la lectura, o queda escrito por qué esta cuenta no se puede medir' },
    { accion: 'Averiguar por qué ninguna de las 352 llamadas llegó a una persona: revisar el enrutamiento del menú y a dónde transfiere', responsable: 'Ingeniería / Dan', criterio: 'Se explica el flujo completo de una llamada, desde el 072 hasta la extensión que la toma' },
    { accion: '✓ HECHO el 13 oct 2026 — Corregido el director de la ficha (registraba «Lic. Erick Lucero» con teléfono 0000000000) y capturado el DIRECTORIO COMPLETO: los 14 funcionarios publicados por el Municipio, con cargo y extensión, más el contratante histórico. Quince contactos donde había dos, y uno de los dos estaba mal', responsable: 'Dan', criterio: 'Aplicado y comprobado. Los correos de los 12 sin correo publicado NO se construyeron por patrón: sólo van los 2 verificados.' },
  ],

  plan_mediano: [
    { accion: 'Primera reunión en diez meses, con la subdirección administrativa y con quien opere el conmutador', responsable: 'Dan', criterio: 'Reunión registrada con minuta, y el Radar contestado en la misma sesión' },
    { accion: 'Mapear los flujos de atención por servicio: citas dentales (072 ext. 5495, 8:00–18:00), salud mental, rehabilitación y la línea de crisis. El cliente ya los tiene diferenciados; nuestra medición no', responsable: 'Dan / Ingeniería', criterio: 'Queda escrito qué extensión atiende qué servicio y en qué horario' },
    { accion: 'Confirmar si las tres Unidades Básicas de Rehabilitación telefonean por su cuenta: tienen números propios publicados en un comunicado municipal de octubre de 2024 y hay que verificar que sigan operativos', responsable: 'Dan', criterio: 'Se sabe cuántas sedes pasan por nosotros y cuántas no' },
    { accion: 'Capturar los campos vacíos de la ficha —tamaño, número de oficinas— y dejar escrito que el personal total NO está validado públicamente, en vez de estimarlo', responsable: 'Dan', criterio: 'La ficha dice lo que se sabe y marca con palabras lo que no' },
  ],

  plan_estrategico: [
    { accion: 'QUE EL INDICADOR DISTINGA QUIÉN CONTESTÓ. «0% sin contestar» sobre 352 llamadas que ninguna llegó a una persona es una luz verde falsa, y es la misma firma que en OOAPAS producía una falsa alarma. El tablero tiene que separar contestada por una persona de contestada por la máquina', responsable: 'Producto / Dirección', criterio: 'La ficha de cuenta muestra las dos cifras, y el semáforo usa la de personas' },
    { accion: 'Reporte de atención telefónica por servicio, pensado para rendición de cuentas pública', responsable: 'Producto / Dan', criterio: 'El cliente recibe un informe mensual por línea de servicio y horario' },
    { accion: 'IA de Voz para la franja sin personal: el horario administrativo es 8:00–15:00 y entra tráfico a 22 de las 24 horas', responsable: 'Dan', criterio: 'Propuesta presentada con el perfil horario real de sus llamadas' },
    { accion: 'La puerta del Ayuntamiento: IMPAS es uno de los organismos descentralizados del Municipio de Chihuahua. Una cuenta bien llevada aquí abre las demás dependencias', responsable: 'Dirección / Dan', criterio: 'Caso de éxito documentado y presentado al Municipio' },
  ],

  areas_oportunidad: [
    { area: 'Recuperar la medición', impacto: 'Ocho meses sin un registro en la cuenta #2 de la cartera', responsable: 'Ingeniería' },
    { area: 'El enrutamiento del 072', impacto: '0 de 352 llamadas llegaron a una persona', responsable: 'Ingeniería / IMPAS' },
    { area: 'Las tres UBR con teléfono propio', impacto: 'Tráfico del cliente que puede no estar pasando por nosotros', responsable: 'Dan' },
    { area: 'Reporte por servicio', impacto: 'Materia de informe para un organismo que rinde cuentas públicas', responsable: 'Producto' },
    { area: 'IA de Voz fuera de horario', impacto: 'Tráfico en 22 de 24 horas contra un horario administrativo de 8:00 a 15:00', responsable: 'Dan' },
    { area: 'El resto del Ayuntamiento', impacto: 'IMPAS es uno de varios organismos del mismo municipio', responsable: 'Dirección' },
  ],

  perfiles: [
    {
      nombre: 'C.P. Miguel de los Santos Arévalo', rol: 'Subdirector administrativo — IMPAS', color: '#22c55e',
      campos: [
        { label: 'Correo',     value: 'miguel.delossantos@mpiochih.gob.mx' },
        { label: 'Extensión',  value: '(614) 200-4800 ext. 2255' },
        { label: 'Por qué él', value: 'En un organismo público, contratación, renovación y presupuesto pasan por la subdirección administrativa' },
        { label: 'Estado',     value: 'NO capturado en la ficha. Publicado en el directorio municipal desde antes del alta.' },
      ],
    },
    {
      nombre: 'Dr. Luis Antonio Arrieta Trevizo', rol: 'Director general — IMPAS', color: '#6366f1',
      campos: [
        { label: 'Correo',     value: 'antonio.arrieta@mpiochih.gob.mx' },
        { label: 'Extensión',  value: '(614) 200-4800 ext. 2264' },
        { label: 'Patrocinio', value: 'Es el patrocinador ejecutivo potencial de la cuenta' },
        { label: 'OJO',        value: 'La ficha registra como director a «Lic. Erick Lucero», con teléfono 0000000000. Hay que corregirlo.' },
      ],
    },
    {
      nombre: 'Luis Álvarez', rol: 'Contratante — el único contacto que la ficha tenía útil', color: '#f59e0b',
      campos: [
        { label: 'Correo',  value: 'luisalvarez21@yahoo.com.mx (correo personal, no institucional)' },
        { label: 'Teléfono', value: '614 132 2909' },
        { label: 'Estado',  value: 'No responde a los correos, según las observaciones del 11 sep 2026' },
        { label: 'Lección', value: 'Un contratante con correo personal no es una vía de contacto institucional. El directorio oficial sí.' },
      ],
    },
    {
      nombre: 'Dan', rol: 'Asesor SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades',  value: '3 registradas · 3 completadas' },
        { label: 'Lo que vio bien', value: '7 sep 2026: «se detectaron irregularidades que requieren validación directa con el cliente». El diagnóstico era correcto.' },
        { label: 'Dónde se atascó', value: 'Buscó en LinkedIn y no halló nada. Para una dependencia de gobierno la fuente es el directorio oficial.' },
        { label: 'Con qué trabajaba', value: 'Con la facturación en $0, sin llamadas desde enero y sin consumo. El hueco no es suyo.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Diez facturas en diez meses, cero incidencias de pago, GRC «MRR estable» y clasificación AAA',
      'El cliente está AMPLIANDO usos: publicó una extensión nueva para citas dentales en septiembre de 2026',
      'Un solo ticket en toda la relación, sin falla técnica, resuelto en 42 horas',
      'El directorio de decisores es información pública, completa y verificable',
      'Es un organismo del Municipio de Chihuahua: la referencia abre otras dependencias',
    ],
    oportunidades: [
      'Tres Unidades Básicas de Rehabilitación con teléfono propio publicado: posible tráfico fuera de nuestro servicio',
      'No tiene IA de Voz, Chat, IA de Chat ni integración API contratados',
      'Tráfico en 22 de 24 horas contra un horario administrativo de 8:00 a 15:00',
      'Un organismo que rinde cuentas públicas necesita reportes de atención por servicio, y hoy no los tiene',
    ],
    debilidades: [
      'La ficha tenía el importe en $0: diez meses fuera de toda lista ordenada por dinero',
      'Cero llamadas registradas desde el 21 de enero y cero meses de consumo medible',
      'De 352 llamadas medidas, ninguna llegó a una persona, y el tablero lo reporta como 0% sin contestar',
      'Ninguna reunión en diez meses · 1 de 12 del Radar · score relacional 27, el más bajo de las auditorías escritas',
      'El director registrado en la ficha no es el director, y su teléfono es 0000000000',
      'El 96.7% del contrato depende de un solo producto',
    ],
    amenazas: [
      'EL 96.7% DEL CONTRATO ES UNA SOLA LÍNEA. Si el número de marcación corta se va, se va la cuenta completa: no hay nada que retenga al cliente por los lados.',
      'Es un organismo público: contratación y renovación van por ciclo presupuestal, y un cambio de administración municipal puede reabrir decisiones que un cliente privado no reabre',
      'Si la línea de crisis 24/7 viaja sobre este servicio, una llamada que no llega a una persona deja de ser una métrica de SLA',
      'Sin llamadas ni consumo no hay forma de ver venir nada: el primer aviso sería la no renovación',
      'Diez meses sin una reunión en una cuenta de $65,640 al mes: no hay relación que amortigüe una mala experiencia',
    ],
  },

  conclusion: 'IMPAS no es una cuenta en problemas: es una cuenta que no estábamos mirando, y el motivo es trivial y caro a la vez. Su facturación quedó en cero al importarla, y con el cero desapareció de todas las listas que el tablero ordena por dinero. Diez meses pagando $65,640 puntualmente, sin una reunión, sin una llamada registrada desde el 21 de enero y sin un mes de consumo medible.\n\nLo que sí se midió dice algo que hay que llevar a la conversación con cuidado: de 352 llamadas entrantes, ninguna llegó a una persona y no hubo un solo minuto de conversación. Puede ser un enrutamiento que termina en un menú sin salida, o puede ser que la transferencia ocurra fuera de nuestra vista. No lo sabemos, y es exactamente por eso que es la primera pregunta. Lo que no se puede es seguir reportando «0% sin contestar» sobre eso, porque es una luz verde encendida sobre una cuenta ciega.\n\nY hay una pregunta que va antes que todas las demás: si la línea de atención a crisis 24/7 del organismo viaja sobre este servicio, entonces esto no es un asunto de calidad de atención. Hay que confirmarlo o descartarlo esta semana, sin suponer ninguna de las dos cosas.\n\nLa parte alentadora es que el cliente está vivo y creciendo en usos —publicó una extensión nueva en septiembre— y que el camino para hablar con él estaba abierto todo el tiempo. El asesor dejó escrito que no encontraba a nadie después de buscar en LinkedIn; el cliente es una dependencia municipal y su directorio, con catorce funcionarios, sus cargos, sus correos y sus extensiones, lleva meses publicado en un sitio del gobierno. Esa es la lección que deja este expediente y no es sobre IMPAS: para un cliente privado, LinkedIn es una fuente razonable; para una dependencia de gobierno, el directorio oficial es la fuente, y es mejor.',

  pierde: [
    'Callpicker pierde $65,640 al mes si esta cuenta no renueva — la segunda mayor de las que cruzan por CID.',
    'Y lo perdería de golpe: el 96.7% del contrato es una sola línea, el número de marcación corta.',
    'Se pierde la puerta al resto del Ayuntamiento de Chihuahua, que tiene más organismos descentralizados.',
    'Se pierde sin aviso: sin llamadas ni consumo medible, no hay indicador capaz de anticiparlo.',
  ],

  gana: [
    'Corregir el importe devuelve la cuenta a todas las listas de las que lleva diez meses fuera, y eso solo ya cambia cómo se la trata.',
    'No tiene contratados IA de Voz, Chat, IA de Chat ni API: la base para crecer está entera.',
    'Las tres UBR con teléfono propio son una ampliación concreta y verificable, no una hipótesis.',
    'Un reporte de atención por servicio es, para un organismo que rinde cuentas, un entregable de valor directo que hoy nadie le da.',
  ],

  recomendacion_central: 'ESTA SEMANA, Y EN ESTE ORDEN.\n\nPRIMERO, UNA PREGUNTA QUE NO ADMITE ESPERA: ¿la línea de atención a crisis 24/7 del organismo —«Hablar Salva Vidas»— viaja sobre nuestro servicio? No está confirmado y no se debe suponer en ninguna dirección. Si la respuesta es que sí, que de 352 llamadas ninguna haya llegado a una persona deja de ser un indicador de SLA y pasa a ser lo primero de la agenda de toda la cuenta. Si es que no, se descarta en una frase y se sigue con lo demás.\n\nSEGUNDO, HACIA DENTRO: corregir el importe de la ficha, de $0 a $65,640. Es un campo, y es lo que ha mantenido a la segunda cuenta más grande de la cartera fuera de toda priorización durante diez meses. En la misma pasada, averiguar con Ingeniería por qué no hay una sola llamada desde el 21 de enero ni un mes de consumo: hoy, de esta cuenta, no se puede afirmar nada sobre su operación.\n\nTERCERO, HACIA FUERA, Y POR LA PUERTA CORRECTA: escribir al subdirector administrativo, el C.P. Miguel de los Santos Arévalo (ext. 2255), que en un organismo público es quien lleva contratación y presupuesto, y al director general, el Dr. Luis Antonio Arrieta Trevizo (ext. 2264). Los dos están publicados con correo institucional en el directorio del Municipio. Y abrir con la pregunta técnica, no con el reproche: «no estamos viendo su tráfico desde enero y queremos entender por qué» es un problema nuestro, no una acusación al cliente — y es verdad.\n\nY UNA COSA QUE NO ES DE ESTA CUENTA pero que esta cuenta destapó: el indicador que dice «0% sin contestar» cuenta como contestada la llamada que atendió la máquina. Aquí produce una luz verde sobre una cuenta donde nadie tomó ninguna de 352 llamadas. En OOAPAS la misma firma producía una falsa alarma del 99.7%. Es el mismo defecto dando resultados opuestos, y mientras no se separe «contestada por una persona» de «contestada por el menú», ninguna de las dos lecturas es fiable.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 1 ticket de «IMPAS Municipio Chihuahua» (CID 177810) en lib/tickets-data.json',
    periodo: 'Octubre 2026 · la fuente trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí',
    diagnostico: 'No hay nada que auditar en servicio, y eso es el hallazgo. UN ticket en diez meses, de categoría «Facturación y Pagos», sin falla técnica, resuelto en 42 horas. El producto no le ha fallado a este cliente. Pero el dato tiene una segunda lectura que importa más: ese ticket es de OCTUBRE, posterior a las observaciones del 11 de septiembre que daban al cliente por ilocalizable. O sea que el cliente SÍ responde — por la vía de la factura. Es la única vía de contacto que ha funcionado en toda la relación, y nadie la aprovechó para abrir una conversación.',
    metricas: [
      { metrica: 'Tickets totales',       valor: '1 (oct 2026)',          lectura: 'En diez meses de relación. No hay patrón que leer.' },
      { metrica: 'Fallas del servicio',   valor: '0 · 0.0%',              lectura: 'El producto no ha fallado' },
      { metrica: 'Subcategoría',          valor: 'Facturación y Pagos · 100%', lectura: 'El único contacto del cliente con la mesa fue por su factura' },
      { metrica: 'Tiempo de resolución',  valor: '42 horas',              lectura: 'Dentro de lo razonable. Con un solo caso no hay mediana que valga.' },
      { metrica: 'Tickets de más de 7 días', valor: '0 de 1',             lectura: 'Nada atascado' },
    ],
    reincidencias: [
      { patron: 'Facturación y Pagos (voz)', veces: '1 · 100%', causa: 'No es reincidencia, es el único caso. Importa por su fecha: es de octubre, posterior a las observaciones que daban al cliente por ilocalizable. El cliente responde cuando se trata de su factura.' },
    ],
    hallazgos: [
      'Un solo ticket en diez meses, en una cuenta de $65,640 al mes, es un dato excepcional en esta cartera. No hay problema de servicio: hay ausencia de relación.',
      'El ticket es posterior a las observaciones KAM que declaraban al cliente ilocalizable. La contradicción entre las dos fuentes no se resolvió: se quedó escrita.',
      'Con un denominador de 1, ninguna métrica de servicio de esta cuenta es interpretable. Se publican para que conste que se miraron, no para concluir.',
    ],
  },
}
