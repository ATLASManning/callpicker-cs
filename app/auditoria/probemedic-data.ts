import type { AuditoriaCase } from './types'

/**
 * PROBEMEDIC · Farmacias ProbeMedic Especializadas (F7 · CID 112478)
 * — pierde el 30% de sus llamadas desde enero y NO tiene una sola alerta.
 *
 * Octava del TOP 50. Como en IMPAS y OdontoPrev, se escribe con lo interno y
 * con la ficha institucional que dirección compiló el 13 oct 2026. Y aquí lo
 * externo hizo algo que no había hecho en las anteriores: su advertencia —«el
 * inventario de extensiones, números DID y servicios contratados puede abarcar
 * más ubicaciones que las visibles en la página comercial»— mandó a cruzar
 * nuestros DIDs, y ese cruce reveló PARA QUÉ nos usa el cliente.
 *
 * LO QUE EL CRUCE DE DIDs DESTAPÓ
 * -------------------------------
 * Los 34 números (30 del CID 112478 + 4 del fusionado 68328) NO están
 * etiquetados por sucursal. Están por ASEGURADORA, LABORATORIO y HOSPITAL:
 * «800 AXA», «Abbvie», «Botox», «Pint Farma», «CIMESA» ×3, «HOPE M CENTER»,
 * «AMBULANCIAS_SOS», «Enfermería SOS». Trece de los treinta son 800.
 *
 * Son LÍNEAS DE PROGRAMA DE PACIENTES, no conmutadores de farmacia — y eso
 * encaja exactamente con lo que la investigación describe: convenios con
 * aseguradoras y hospitales, medicamentos de alta especialidad para
 * tratamientos prolongados, seguimiento continuo a pacientes.
 *
 * Y el reparto por plaza da la oportunidad de crecimiento más concreta de
 * toda la serie: 15 números en Monterrey, 2 en CDMX, 13 nacionales y CERO en
 * Guadalajara, Puebla, Tijuana y León — cuatro de sus siete sucursales, con
 * teléfono propio publicado que no pasa por nosotros.
 *
 * TODAS las cifras salen de fuente y están verificadas:
 *   · llamadas  → app/cuentas/llamadas-data.ts, CID 112478
 *   · DIDs      → data/dids.json, CIDs 112478 y 68328
 *   · importe   → GRC por CID: $21,626. El grupo suma $29,940 en cuatro líneas.
 *   · tickets   → lib/tickets-data.json, 18 filas
 *   · alertas   → alertas_episodios: CERO abiertas, y ése es el hallazgo
 *   · la empresa → sitio oficial, Código de Ética, localizador y LinkedIn
 */
export const PROBEMEDIC: AuditoriaCase = {
  id: 'probemedic',
  asesor: 'Fátima',
  nombre: 'PROBEMEDIC · Farmacias ProbeMedic Especializadas',
  sector: 'Farmacéutica — distribución de medicamentos de alta especialidad · Monterrey, N.L.',
  fecha_periodo: 'Marzo 2021 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA · 67 meses · 51–200 empleados · 7 sucursales en 6 estados',
  descripcion_contexto: 'Pierde el 30.63% de sus llamadas y lleva NUEVE MESES así, con CERO alertas abiertas — porque el motor la compara contra su propia base y su base ya es mala · El 93.4% de las pérdidas cabe en cuatro destinos · Y no nos usa para sus farmacias: opera líneas de programa de pacientes de AXA, AbbVie, Pint Farma y CIMESA',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Quien reportó el fallo de hoy',    value: 'NO estaba', color: '#ef4444' },
    { label: 'Sin contestar · 9 meses seguidos', value: '30.63%',  color: '#ef4444' },
    { label: 'Alertas abiertas',                 value: 'CERO',    color: '#ef4444' },
    { label: 'De las pérdidas, en 4 destinos',   value: '93.4%',   color: '#f97316' },
    { label: 'Cuando llega a un destino bueno',  value: '97.6% ok', color: '#22c55e' },
    { label: 'Sucursales sin un número nuestro', value: '4 de 7',  color: '#f97316' },
  ],

  resumen_ejecutivo: 'PROBEMEDIC pierde 28,357 de sus 92,572 llamadas entrantes: el 30.63%. Es la segunda peor tasa de las ocho auditorías escritas, sólo por detrás del septiembre de Torres Corzo. Pero a diferencia de aquél, esto no es un colapso: es una condición crónica. La tasa lleva nueve meses sin moverse —28.3% en enero, 31.1% en febrero, 32.0% en junio, 28.1% en agosto— y en todo ese tiempo **no se ha abierto una sola alerta sobre esta cuenta**.\n\nY ÉSE ES EL HALLAZGO QUE NO ES SOBRE PROBEMEDIC. El motor de alertas compara cada cuenta contra su PROPIA base. La base de ésta es 30.92%, así que el mes cerrado al 28.08% sale 2.84 puntos POR DEBAJO y se lee como una mejora. Una cuenta que ha normalizado perder tres de cada diez llamadas queda en verde, porque lo único que el sistema sabe detectar es el cambio. Lo crónico es invisible por construcción.\n\nLO SEGUNDO ES QUE EL PROBLEMA NO ES DE PERSONAL, ES DE ENRUTAMIENTO, y eso lo vuelve barato de arreglar. Cuando la llamada llega a un destino que funciona, se contesta el 97.6% de las veces. El 84.2% de todas las pérdidas cae en un solo sitio: «(sin destino registrado)», con 23,881 perdidas de 29,783 —el 80.2%—, desde 2,251 números distintos y con CERO minutos de conversación. Y tres extensiones personales se llevan casi todo lo demás: Lezly Iohanna Carreón Loera pierde 2,053 de 2,142 (95.8%), Marco Antonio Moreno Ibarra pierde 346 de 346 —el 100%, nunca contestó ninguna— y Azucena Garcia Segura 219 de 351. Entre esos cuatro destinos está el 93.4% de las pérdidas de la cuenta.\n\nLO TERCERO CAMBIA LO QUE CREÍAMOS QUE ERA LA CUENTA. La investigación de dirección advirtió que el inventario de números podía cubrir más ubicaciones que las visibles en su web, y al cruzarlo contra nuestros DIDs salió otra cosa: los 34 números no están etiquetados por sucursal sino por aseguradora, laboratorio y hospital —«800 AXA», «Abbvie», «Botox», «Pint Farma», «CIMESA», «HOPE M CENTER», «AMBULANCIAS_SOS», «Enfermería SOS»—, con trece números 800 entre ellos. **No nos usa para atender farmacias: opera líneas de programa de pacientes.** Encaja con lo que la investigación describe: medicamentos de alta especialidad para enfermedades crónicas y degenerativas, de tratamiento prolongado, con seguimiento continuo al paciente.\n\nEso cambia qué significa una llamada perdida. No es una venta que no ocurrió: es un paciente en tratamiento largo que no consiguió hablar con nadie. Y son 28,357 en nueve meses.\n\nY HAY UNA OPORTUNIDAD QUE EL MISMO CRUCE DEJA SERVIDA: por lada tenemos 15 números en Monterrey, 2 en CDMX y 13 nacionales. Cero en Guadalajara, Puebla, Tijuana y León — cuatro de sus siete sucursales oficiales, todas con teléfono propio publicado que no es nuestro.\n\nY HOY PASÓ ALGO QUE VALE POR TODO LO ANTERIOR. A las 10:50, un cambio nuestro de plataforma le rompió al cliente la búsqueda en call details y el export de llamadas a correo —el chat interno lo reconoce sin rodeos: «no hubo sign off, fue un hotfix»—. Pero lo importante no es el fallo: es QUIÉN lo reportó. **Daniel Olivares, un nombre que no estaba en ninguna parte de nuestra ficha.**\n\nEn 67 meses de relación teníamos registrados dos contactos: el director general y un técnico de soporte. Ninguno de los dos es quien usa el servicio todos los días. La persona que de verdad lo opera —la que nota en diez minutos que una búsqueda dejó de funcionar— era invisible para nosotros hasta que algo se rompió. Y el detalle que lo delata es que no llamó para preguntar: llamó sabiendo exactamente qué había cambiado y cómo lo usaban («buscaban a 8 dígitos»). Lleva tiempo ahí.\n\nEso significa que nuestro mapa de contactos no está incompleto por descuido: está sesgado. Capturamos a quien FIRMA y a quien nos escribe cuando algo falla, no a quien USA. Y la alerta que existe para avisarlo, `sin_contactos`, no se enciende aquí — porque hay dos contactos, y el motor cuenta cuántos hay, no si son los que importan. Tener algunos contactos tapa el hecho de no tener los correctos.',

  resultado_positivo: 'Hay más de lo que la tasa del 30% sugiere, y conviene separarlo.\n\nCUANDO LA LLAMADA LLEGA A SU DESTINO, SE CONTESTA. El bloque «otros destinos» —46,438 llamadas contestadas de 47,593, más de la mitad del tráfico— pierde el 2.4%. Y los destinos nominales que funcionan están en el mismo rango: Aly Osorio 6.2%, Jessica Ana Karen Sanchez Hernandez 10.6%, Cesar Niño 18.5%. Hay un equipo que contesta y lo hace bien; el problema está antes, en el enrutamiento.\n\nLA TENDENCIA, MEDIDA CONTRA SÍ MISMA, VA A MEJOR. El mes cerrado pierde 28.08% contra una base propia de 30.92%: son 289 llamadas perdidas menos de las que esta cuenta normalmente pierde. Es poco consuelo con una base tan alta, pero no es un deterioro.\n\nEL TRABAJO DEL ASESOR ESTÁ Y ES RECIENTE. Cinco seguimientos, uno de ellos de hoy mismo, y una actividad completada. El 25 de septiembre Fátima marcó tres veces sin respuesta, insistió por WhatsApp y el cliente contestó: «que lo busque el lunes y con gusto platicamos. Muy amable». El mapa de decisores está capturado. Su score de actividad es 66, de los más altos de la serie.\n\nEL PAGO ES IMPECABLE: cero incidencias en 67 meses, score de pago 100, y el GRC la clasifica AAA con un acumulado de $1,012,485 — la segunda mayor facturación acumulada de las cuentas auditadas, después de Sección Amarilla.\n\nY HAY CRECIMIENTO NUEVO SIN REGISTRAR: en el GRC aparece una línea «PROBEMEDIC CANALES DIGITALES» con $1,649 al mes y UN SOLO mes de vida. Es su unidad de comercio electrónico empezando a facturar, y nadie la ha anotado en la ficha.',

  hallazgos: [
    'RELACIÓN — HOY APARECIÓ UN USUARIO DEL SERVICIO QUE NO TENÍAMOS REGISTRADO, Y SE SUPO PORQUE ALGO SE ROMPIÓ. El 13 de octubre a las 10:50, **Daniel Olivares** reportó que un cambio nuestro les tumbó la búsqueda en call details y el export de llamadas a correo. Su nombre no aparecía en ningún campo de la ficha. En 67 meses teníamos dos contactos: el director general y un técnico de soporte — ninguno de los dos es quien usa el servicio a diario.',
    'RELACIÓN — Y NO ERA UN USUARIO CUALQUIERA: SABÍA EXACTAMENTE CÓMO LO USAN. No llamó a preguntar qué pasaba; llamó diciendo qué había cambiado y cómo lo ocupaban —«buscaban a 8 dígitos»— y señalando además el export a correo. Eso no lo dice alguien que acaba de llegar: lleva tiempo operando la plataforma. Un usuario con ese nivel de detalle llevaba meses, puede que años, fuera de nuestro radar.',
    'RELACIÓN — EL MAPA DE CONTACTOS NO ESTÁ INCOMPLETO: ESTÁ SESGADO. Capturamos a quien FIRMA el contrato y a quien nos escribe cuando algo falla, no a quien USA el servicio todos los días. Es el mismo patrón en las ocho auditorías —en IMPAS el contacto era un contratante que no responde, en OdontoPrev un líder que ya no está en la operación— y aquí se ve el costo: el único que podía avisarnos de que la plataforma se rompió no estaba en la lista de a quién avisar.',
    'ALERTAS — Y LA ALERTA QUE EXISTE PARA ESTO NO SE ENCIENDE. `sin_contactos` sólo salta cuando `contactos_json` está VACÍO, y aquí había dos. El motor cuenta cuántos contactos hay, no si son los que importan. **Tener algunos contactos tapa el hecho de no tener los correctos** — y es el mismo defecto de diseño que el de la tasa de pérdida: se mide la presencia, no la calidad.',
    'ATENCIÓN — PIERDE EL 30.63% DE SUS LLAMADAS: 28,357 de 92,572. Es la segunda peor tasa de las ocho auditorías, sólo detrás del septiembre de Torres Corzo. Y las salientes van igual: 48,787 de 148,963 no conectaron, el 32.75%.',
    'ATENCIÓN — Y LLEVA NUEVE MESES ASÍ, SIN MOVERSE. Enero 28.3%, febrero 31.1%, marzo 30.4%, abril 31.7%, mayo 31.9%, junio 32.0%, julio 31.2%, agosto 28.1%, septiembre 31.6%. No es un incidente: es el estado normal de la cuenta.',
    'ALERTAS — CERO ABIERTAS, Y ÉSE ES EL HALLAZGO DE FONDO. El motor compara cada cuenta contra su PROPIA base. Con una base de 30.92%, el mes cerrado al 28.08% sale 2.84 puntos por DEBAJO y se lee como mejora. Una cuenta que normalizó perder tres de cada diez llamadas queda en verde. El sistema detecta cambios, no niveles — y lo crónico es invisible por construcción. Es un hueco de diseño, no un fallo de nadie.',
    'ATENCIÓN — NO ES UN PROBLEMA DE PERSONAL, ES DE ENRUTAMIENTO. Cuando la llamada llega a un destino que funciona se contesta el 97.6% de las veces: el bloque «otros destinos» mueve 47,593 llamadas y pierde el 2.4%. Lo que falla es lo que pasa ANTES de llegar.',
    'ATENCIÓN — EL 84.2% DE TODAS LAS PÉRDIDAS CAE EN UN SOLO SITIO. «(sin destino registrado)»: 23,881 perdidas de 29,783, el 80.2%, desde 2,251 números distintos y con CERO minutos. Veintitrés mil llamadas que entraron y no llegaron a ninguna parte.',
    'ATENCIÓN — Y TRES EXTENSIONES PERSONALES SE LLEVAN CASI TODO LO DEMÁS. «Lezly Iohanna Carreón Loera» pierde 2,053 de 2,142 (95.8%) desde 1,318 números distintos. «Marco Antonio Moreno Ibarra» pierde 346 de 346: el 100%, nunca contestó ninguna. «Azucena Garcia Segura», 219 de 351 (62.4%). Las tres tienen CERO o casi cero minutos. Entre esos tres y el sin destino, el 93.4% de las pérdidas de la cuenta.',
    'ESTRUCTURA — NO NOS USA PARA SUS FARMACIAS: OPERA LÍNEAS DE PROGRAMA DE PACIENTES. Los 34 números (30 del CID 112478 + 4 del fusionado 68328) están etiquetados por aseguradora, laboratorio y hospital — «800 AXA», «Abbvie», «Botox», «Pint Farma», «CIMESA» ×3, «HOPE M CENTER», «AMBULANCIAS_SOS», «Enfermería SOS»— y trece de los treinta son números 800. Es la firma de un programa de apoyo a pacientes, no la de un conmutador de sucursal.',
    'ESTRUCTURA — Y ESO CAMBIA QUÉ ES UNA LLAMADA PERDIDA AQUÍ. La empresa distribuye medicamentos de alta especialidad para enfermedades crónicas, degenerativas o graves, de tratamiento prolongado, con seguimiento continuo al paciente. Una llamada que no se contesta no es una venta que no ocurrió: es un paciente en tratamiento largo que no consiguió hablar con nadie. Son 28,357 en nueve meses.',
    'CRECIMIENTO — CUATRO DE SUS SIETE SUCURSALES NO TIENEN UN NÚMERO NUESTRO. Por lada: 15 en Monterrey, 2 en CDMX y 13 nacionales (800). CERO en Guadalajara, Puebla, Tijuana y León, que sí tienen teléfono propio publicado en su localizador oficial. Es la oportunidad más concreta y verificable de toda la serie de auditorías.',
    'FACTURACIÓN — EL IMPORTE DE LA FICHA ESTABA AL 73% DEL REAL: $15,696 contra $21,626 del GRC por CID. Y el GRUPO factura más: hay tres líneas más de «Probemedic» sin CID —PROBEMEDIC $5,418, PROBEMEDIC CANALES DIGITALES $1,649 y Probemedic Farmacias $1,247— que suman $8,314. El total del grupo sería $29,940, pero sin CID no se puede afirmar que sean la misma empresa: es tarea de facturación, no una conclusión.',
    'FACTURACIÓN — HAY UNA LÍNEA NUEVA QUE NADIE HA REGISTRADO: «PROBEMEDIC CANALES DIGITALES», $1,649 al mes y UN SOLO mes de vida en el GRC. Coincide con la unidad de comercio electrónico que describe la investigación. Es crecimiento ocurriendo ahora mismo y no está en la ficha.',
    'FACTURACIÓN — La línea principal viene de un Downgrade: de $21,634 a $21,626, con $8.30 de pérdida. Son ocho pesos, pero el movimiento está marcado y conviene saber qué se redujo.',
    'SERVICIO — INCIDENTE ABIERTO HOY, Y ES NUESTRO. El 13 de octubre a las 10:50 el cliente reportó que un cambio en la plataforma les rompió la búsqueda en call details —buscaban a 8 dígitos— y el export de llamadas a correo. El chat interno lo dice sin rodeos: «no hubo sign off, fue un hotfix… se hizo para hacer algo rápido para acelerar las búsquedas». Ticket #117503. Un cliente que pierde el 30% de sus llamadas no es el cliente al que conviene sorprender con un cambio sin avisar.',
    'SERVICIO — Y LO REPORTÓ ALGUIEN QUE NO ESTABA EN LA FICHA: Daniel Olivares. Los contactos registrados eran Enrique Castillo (director general) y Rafael García (soporte técnico). Hay un tercer interlocutor operativo que lleva tiempo usando el servicio y nadie lo había capturado.',
    'SERVICIO — 18 tickets, y esta vez son de VOZ: «Duda Operativa» 6, «Queja o Sugerencia» 3, APIs 2, Softphone 2, Falla SIP 1, Login 1. Sólo uno de chat. Dos fallas (11.1%). La mediana de resolución son 2.2 horas —la mejor de la serie— pero tres tickets pasaron de siete días y el peor llegó a 407 horas.',
    'SERVICIO — TRES «QUEJA O SUGERENCIA» FORMALES. Es el único cliente de las ocho auditorías que ha usado esa categoría, y la usó tres veces. Una queja formal es una señal que no hay que promediar con las dudas operativas.',
    'OPERACIÓN — EL SÁBADO ES SU PEOR DÍA Y EL DOMINGO NO DEBERÍA EXISTIR. Sábado: 7,244 llamadas con 36.7% de pérdida, contra un horario publicado de 9:00 a 14:00 — cinco horas para absorber un día entero de demanda. Domingo: 1,095 llamadas con 36.5% de pérdida y NINGÚN horario publicado. Entre semana la tasa ronda el 29–31%.',
    'OPERACIÓN — El perfil horario es de negocio normal, con pico a las 11:00 (13.1%) y meseta de 10:00 a 16:00. Pero hay tráfico hasta las 22:00, por encima del horario publicado de 20:00: 4,009 llamadas a las 18:00, 1,368 a las 19:00 y 987 después de las 20:00.',
    'CONSUMO — BAJO_CONSUMO confirmado: usa el 39.2% de su bolsa (19,606 de 50,000 minutos del plan «Visibilidad y Control 25,000 min ×2»). Paga por más del doble de lo que gasta, mientras pierde el 30% de las llamadas. Las dos cosas juntas sugieren que el cuello no está en los minutos.',
    'FICHA — EL CAMPO `servicio` NO DECÍA EL SERVICIO. Guardaba «Subcuenta integrada: PROBEMEDIC · CID 68328», que es una nota de la fusión del 31 de agosto, no el producto contratado. El plan real —Visibilidad y Control 25,000 ×2— sólo aparecía dentro de los registros de adopción. Corregido el 13 oct 2026.',
    'RELACIÓN — CERO REUNIONES EN 67 MESES y score relacional 4, el más bajo de todas las auditorías escritas con diferencia. Y sin embargo el trabajo reciente SÍ está: cinco seguimientos, uno de hoy, y el cliente respondió por WhatsApp el 25 de septiembre. Lo que falta no es esfuerzo: es una conversación de fondo que nunca se ha tenido.',
    'FICHA — El número de sucursales no está cerrado. La ficha decía 10; el localizador oficial publica 7 en 6 estados; y LinkedIn conserva 4 direcciones más en Monterrey que no están en el localizador. Se dejan las tres cifras con su fuente en vez de elegir una.',
  ],

  cronologia: [
    { fecha: '2011',         responsable: 'Probemedic',       evento: 'Se funda en Monterrey. Distribución de medicamentos de alta especialidad, patente y genéricos, equipo médico e insumos.', tipo: 'neutral' },
    { fecha: '27 Mar 2021',  responsable: 'Callpicker',       evento: 'Alta de la cuenta. 67 meses de relación — la segunda más antigua de las auditadas.', tipo: 'ok' },
    { fecha: 'Ene–Sep 2026', responsable: 'Operación',        evento: 'NUEVE MESES con la tasa de pérdida clavada en ~30%: 28.3%, 31.1%, 30.4%, 31.7%, 31.9%, 32.0%, 31.2%, 28.1%, 31.6%. Ninguna alerta se abre en todo el periodo.', tipo: 'problema' },
    { fecha: 'Abr–Jun 2026', responsable: 'Mesa de ayuda',    evento: 'Seis tickets de voz, dos de ellos fallas. Empiezan a aparecer las «Queja o Sugerencia».', tipo: 'problema' },
    { fecha: '31 Ago 2026',  responsable: 'Dirección',        evento: 'Conciliación: se integra la subcuenta PROBEMEDIC (Z17, CID 68328) como duplicado. La nota de fusión acaba escrita en el campo `servicio`, desplazando el servicio real.', tipo: 'neutral' },
    { fecha: '02 Sep 2026',  responsable: 'SAC',              evento: 'Se registra la adopción: plan «Visibilidad y Control 25,000 min ×2», consumo promedio 39.2%. Señal BAJO_CONSUMO.', tipo: 'problema' },
    { fecha: '21 Sep 2026',  responsable: 'Fátima',           evento: 'Validación completada: se contacta a Enrique Castillo y se agenda llamada para el lunes.', tipo: 'ok' },
    { fecha: '25 Sep 2026',  responsable: 'Fátima',           evento: 'Tres llamadas sin respuesta al titular. Insiste por WhatsApp y el cliente contesta: «que lo busque el lunes y con gusto platicamos. Muy amable». Se captura el mapa de decisores.', tipo: 'ok' },
    { fecha: 'Sep 2026',     responsable: 'Mesa de ayuda',    evento: 'Siete tickets, el pico del año.', tipo: 'problema' },
    { fecha: 'Oct 2026',     responsable: 'Facturación',      evento: 'Aparece en el GRC una línea nueva: «PROBEMEDIC CANALES DIGITALES», $1,649 al mes, con UN solo mes de vida. Es su comercio electrónico empezando a facturar.', tipo: 'ok' },
    { fecha: '13 Oct 2026',  responsable: 'Daniel Olivares / Callpicker', evento: 'A las 10:50 el cliente reporta que un cambio nuestro rompió la búsqueda en call details y el export a correo. Interno: «no hubo sign off, fue un hotfix». Ticket #117503. Quien reporta NO estaba capturado en la ficha.', tipo: 'problema' },
    { fecha: '13 Oct 2026',  responsable: 'Callpicker',       evento: 'Auditoría. El cruce de DIDs revela que la cuenta opera líneas de programa de pacientes —AXA, AbbVie, Pint Farma, CIMESA— y no conmutadores de farmacia. Se corrige el importe y se capturan 11 contactos donde había 2.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Nombre comercial',      value: 'Farmacias Probemedic · «Farmacias ProbeMedic Especializadas»' },
    { label: 'Razón social',          value: 'PENDIENTE de confirmar por constancia fiscal. Varios directorios dicen «Probemedic Distribuciones, S.A. de C.V.», pero un directorio no es una constancia.' },
    { label: 'Fundación',             value: '2011 · sede en Monterrey, Nuevo León' },
    { label: 'Giro',                  value: 'Medicamentos de ALTA ESPECIALIDAD (enfermedades crónicas, degenerativas o graves, de tratamiento prolongado), patente, genéricos, equipo médico e insumos' },
    { label: 'Modelo',                value: 'B2C, B2B y atención a pacientes asegurados. Seis unidades: farmacias, e-commerce, alta especialidad, convenios con aseguradoras, logística y programas de lealtad.' },
    { label: 'Tamaño',                value: '51–200 empleados (LinkedIn). 121 perfiles asociados, que NO es plantilla verificada.' },
    { label: 'Sucursales',            value: '7 en el localizador oficial, en 6 estados. La ficha decía 10. LinkedIn añade 4 direcciones en Monterrey que no están en el localizador. SIN CERRAR.' },
    { label: 'Domicilio fiscal',      value: 'Orquídea 412, Col. Real de Cumbres, C.P. 64346, Monterrey, N.L.' },
    { label: 'Teléfonos públicos',    value: 'General 81 2474 0080 · WhatsApp 81 1763 9974 · Pacientes asegurados 800 522 5268 · Quejas y sugerencias 81 1765 9247' },
    { label: 'Horario publicado',     value: 'L–V 8:00–20:00 · sábados 9:00–14:00. No hay horario de domingo, y entran 1,095 llamadas en domingo.' },
    { label: 'Cliente desde',         value: '27 de marzo de 2021 — 67 meses' },
    { label: 'Servicio contratado',   value: 'Visibilidad y Control 25,000 min ×2 (bolsa de 50,000) + DIDs. Consumo 39.2%.' },
    { label: 'Nuestros números',      value: '34 DIDs — etiquetados por ASEGURADORA, LABORATORIO y HOSPITAL, no por sucursal. 15 en Monterrey, 2 en CDMX, 13 nacionales.' },
    { label: 'Facturación mensual',   value: '$21,626 MXN (GRC por CID). La ficha decía $15,696. El grupo sumaría $29,940 con tres líneas más sin CID.' },
    { label: 'Salud de pago',         value: 'Al corriente · 0 incidencias en 67 meses · acumulado $1,012,485' },
    { label: 'Health Score',          value: '64 · pago 100, adopción 68, actividad 66, relacional 4 — el relacional más bajo de todas las auditorías' },
  ],

  necesidad_negocio: 'Probemedic distribuye medicamentos de alta especialidad: los que se recetan para enfermedades crónicas, degenerativas o graves y que el paciente va a tomar durante años. Ese negocio no se parece a vender en una farmacia de barrio. Requiere seguimiento continuo del paciente, convenios con el laboratorio que fabrica el medicamento, con la aseguradora que lo cubre y con el hospital que lo prescribe.\n\nY eso es exactamente lo que compró. Nuestros 34 números no están puestos por sucursal: están puestos por programa — «800 AXA» para los asegurados de esa compañía, «Abbvie» y «Pint Farma» para los pacientes de esos laboratorios, «CIMESA» y «HOPE M CENTER» para esos hospitales, «AMBULANCIAS_SOS» y «Enfermería SOS» para servicios asociados. Trece de los treinta son números 800, que es lo que se pone cuando quien llama no debe pagar la llamada: el paciente.\n\nEso define el servicio que nos compra. No es un conmutador: es la línea por la que un paciente en tratamiento prolongado contacta con quien le surte su medicamento. El laboratorio que patrocina ese programa mide si la línea funciona, y la aseguradora también.\n\nPor eso el 30.63% de llamadas sin contestar es más grave de lo que la cifra sugiere. No es un cliente que no compró: es un paciente que no pudo. Y por eso el cuello de botella está donde está: lo que falla no es el equipo que atiende —cuando la llamada llega, se contesta el 97.6% de las veces— sino los números que ya no apuntan a ningún sitio. Veintitrés mil llamadas entrando a un destino que no existe, en una operación de salud, es un problema distinto de un SLA.',

  potencial_corto: [
    'Arreglar «(sin destino registrado)»: 23,881 llamadas perdidas, el 84.2% de todas las de la cuenta. Es un enrutamiento, no una contratación.',
    'Revisar las tres extensiones personales que pierden entre el 62% y el 100%. «Marco Antonio Moreno Ibarra» no contestó ninguna de 346: o la persona ya no está, o el número sobra.',
    'Las cuatro sucursales sin número nuestro —Guadalajara, Puebla, Tijuana y León— tienen teléfono propio publicado. Es la venta más concreta de toda la serie.',
    'Registrar «PROBEMEDIC CANALES DIGITALES»: $1,649 al mes facturando desde hace un mes y sin anotar en la ficha.',
  ],

  potencial_largo: [
    'Reporte por programa de pacientes: cada número es un convenio con un laboratorio o una aseguradora que mide si su línea funciona. Un informe por programa es con lo que el cliente defiende esos convenios.',
    'IA de Voz para la franja fuera de horario: entran 987 llamadas después de las 20:00 y 1,095 en domingo, días y horas sin servicio publicado.',
    'Callpicker Chat: no lo tiene contratado, y el seguimiento continuo a pacientes crónicos es el caso natural de un canal asíncrono.',
    'Integración API con su sistema de pacientes: `tiene_integracion_api` está en falso, y dos de sus 18 tickets ya son de APIs.',
  ],

  tacticas: [
    { nombre: 'Entrar por el incidente de hoy, no por el 30%', descripcion: 'El cambio sin aviso es nuestro y es de hoy. Llamar a reconocerlo antes de que escale compra el derecho a hablar del resto.', impacto: 'Convierte un error propio en una conversación, en vez de esperar a que llegue como queja.' },
    { nombre: 'Llevar el desglose por destino', descripcion: '«Hay 23,881 llamadas que entraron y no llegaron a ningún sitio, y tres extensiones que pierden más del 60%». Es específico y se arregla sin vender nada.', impacto: 'Demuestra que miramos su operación, y resuelve el 93% de sus pérdidas.' },
    { nombre: 'Hablar de pacientes, no de llamadas', descripcion: 'Su negocio es tratamiento prolongado. Una llamada perdida es un paciente que no pudo surtir. Esa es la conversación con el director general.', impacto: 'Sube el tema del nivel técnico al nivel de dirección, que es donde está el titular de la cuenta.' },
    { nombre: 'Preguntar por las cuatro plazas sin número', descripcion: 'Guadalajara, Puebla, Tijuana y León publican teléfono propio. Preguntar cómo atienden ahí, no ofrecer todavía.', impacto: 'Abre la ampliación desde la curiosidad por su operación, no desde el catálogo.' },
  ],

  senal_alarma: 'HOY NOS ENTERAMOS DE QUE HAY UN USUARIO DEL SERVICIO QUE NO CONOCÍAMOS, Y NOS ENTERAMOS PORQUE ALGO SE ROMPIÓ. Daniel Olivares reportó a las 10:50 que un cambio nuestro le tumbó la búsqueda en call details; su nombre no estaba en ningún campo de la ficha. En 67 meses habíamos registrado dos contactos —el director general y un técnico— y ninguno es quien opera la plataforma a diario.\n\nAlrededor de eso: una cuenta que pierde tres de cada diez llamadas desde enero, en una operación de salud donde quien llama es un paciente en tratamiento prolongado; CERO alertas abiertas, porque el sistema sólo ve cambios y esto no cambia; ninguna reunión en 67 meses; score relacional 4; y tres quejas formales en la mesa que no abrieron ninguna conversación.',

  problema_raiz: 'El motor de alertas compara cada cuenta contra su propia base, así que una cuenta que normalizó perder el 30% de sus llamadas nunca se enciende. Lo crónico es invisible por construcción.',

  problema_raiz_detalle: 'Esta cuenta lleva nueve meses perdiendo alrededor del 30% de sus llamadas entrantes y no ha generado una sola alerta. No es un descuido del equipo: es cómo está construido el motor. Los detectores buscan DETERIORO —una caída de consumo, un silencio que se alarga, un salto contra la base propia— y aquí no hay deterioro que detectar. La base propia de la cuenta es 30.92%, así que el mes cerrado al 28.08% sale 2.84 puntos por debajo y el sistema lo lee, correctamente según su regla, como una mejora.\n\nEsa regla es buena y la defendimos por una razón: comparar cada cuenta contra sí misma evita acusar de mal servicio a quien opera en un sector con tasas naturalmente altas. Pero tiene un costo que esta cuenta hace visible: **premia la mediocridad estable**. Una cuenta que empeora del 2% al 5% enciende alarmas; una que lleva años al 30% no enciende ninguna. Falta un detector de NIVEL, no sólo de cambio.\n\nLa segunda capa es que el promedio escondió dónde está el problema, igual que en OdontoPrev pero más extremo. El 30.63% global no dice nada accionable. Mirando por destino, el 84.2% de las pérdidas está en «(sin destino registrado)» y otro 9.2% en tres extensiones personales, mientras el grueso del tráfico —47,593 llamadas— se atiende al 97.6%. O sea que no hay un problema de personal ni de capacidad: hay números que ya no apuntan a ningún sitio. Es barato de arreglar y nadie lo ha mirado porque la cifra agregada no invitaba a mirar.\n\nLa tercera es que no sabíamos para qué nos usaba el cliente. La ficha decía «Farmacéutica» y «10 oficinas», y de ahí se seguía que atendíamos sus farmacias. El cruce de DIDs dice otra cosa: los números están etiquetados por aseguradora, laboratorio y hospital —AXA, AbbVie, Pint Farma, CIMESA— y trece de treinta son 800. Son líneas de programa de pacientes. Sin esa lectura, una llamada perdida parecía una venta perdida; con ella, es un paciente en tratamiento prolongado que no consiguió hablar con nadie. El dato estaba en nuestro propio export de DIDs desde siempre; lo que faltó fue que algo obligara a cruzarlo.\n\nLa cuarta la enseñó el día mismo en que se escribía esta auditoría, y es la que más dice sobre cómo trabajamos. Un cambio nuestro rompió una función que el cliente usa a diario, y nos enteramos porque lo reportó **alguien cuyo nombre no estaba en ninguna parte de nuestra ficha**. En 67 meses habíamos capturado dos contactos: quien firma —el director general— y a quien se le escribe cuando algo falla —un técnico de soporte—. A quien USA el servicio nunca lo capturamos, y resultó ser el único capaz de notar el problema en diez minutos y describirlo con precisión.\n\nNo es un descuido de esta cuenta: es un sesgo del procedimiento. Pedimos «el mapa de decisores» y eso trae a quien decide, no a quien opera. Y la alerta que debería avisarlo, `sin_contactos`, mide si la lista está vacía, no si tiene a la gente correcta — así que con dos contactos equivocados la cuenta sale en verde. Es el mismo defecto que la tasa de pérdida comparada contra la base propia: se mide la presencia, no la calidad.\n\nY la quinta es de ficha, menor pero ilustrativa: el campo `servicio` guardaba una nota de la fusión del 31 de agosto —«Subcuenta integrada: PROBEMEDIC · CID 68328»— en lugar del producto contratado, que sólo aparecía dentro de los registros de adopción. Un campo usado para otra cosa es un campo que deja de informar.',

  flujo_real: [
    { fase: 'El paciente marca',        area: 'Paciente en tratamiento', accion: 'Llama al 800 de su programa — AXA, AbbVie, Pint Farma, CIMESA', resultado: '92,572 llamadas entrantes en 8.5 meses' },
    { fase: 'Entra al número',          area: 'Callpicker',              accion: 'El DID recibe la llamada', resultado: '34 números, 13 de ellos 800 nacionales' },
    { fase: 'Debería enrutarse',        area: 'Callpicker / Probemedic', accion: 'La llamada se dirige al destino configurado', resultado: '23,881 caen en «(sin destino registrado)» — el 84.2% de todas las pérdidas' },
    { fase: '…o a una extensión muerta', area: 'Probemedic',             accion: 'Suena en una extensión personal', resultado: 'Marco Antonio Moreno Ibarra: 346 llamadas, 0 contestadas' },
    { fase: 'Si llega bien, se atiende', area: 'Probemedic',             accion: 'Un agente contesta', resultado: '47,593 llamadas con 2.4% de pérdida — el equipo funciona' },
    { fase: 'El tablero evalúa',        area: 'Dashboard',               accion: 'Compara el 28.08% del mes contra la base propia de 30.92%', resultado: 'MEJORA de 2.84 pts. Cero alertas abiertas.' },
    { fase: 'SAC trabaja la cuenta',    area: 'SAC',                     accion: 'Cinco seguimientos, llamadas y WhatsApp al titular', resultado: 'El cliente responde amablemente; la conversación de fondo nunca ocurre' },
    { fase: 'Nosotros cambiamos algo',  area: 'Callpicker',              accion: 'Hotfix sin sign off para acelerar búsquedas', resultado: 'Le rompe la búsqueda en call details y el export. Lo reporta él, el 13 oct.' },
  ],

  comparativo: [
    { metrica: 'Llamadas sin contestar', real: '30.63% (28,357 de 92,572)', ideal: 'El 2.4% que ya logra cuando la llamada llega bien' },
    { metrica: 'Alertas abiertas', real: 'CERO, en nueve meses al 30%', ideal: 'Un detector de NIVEL, no sólo de cambio' },
    { metrica: 'Concentración de las pérdidas', real: '93.4% en cuatro destinos', ideal: 'Repartidas, o sea sin un cuello identificable' },
    { metrica: '«(sin destino registrado)»', real: '23,881 perdidas de 29,783 · 80.2%', ideal: 'Que no exista: toda llamada con destino' },
    { metrica: 'Marco Antonio Moreno Ibarra', real: '346 de 346 perdidas · 100%', ideal: 'Retirar el número o reasignarlo' },
    { metrica: 'Salientes que no conectan', real: '48,787 de 148,963 · 32.75%', ideal: 'Sin diagnóstico todavía: nadie lo ha mirado' },
    { metrica: 'Sábado', real: '36.7% de pérdida sobre 7,244 llamadas', ideal: 'Al nivel de entre semana: ~29%' },
    { metrica: 'Domingo', real: '1,095 llamadas, 36.5% perdidas, sin horario publicado', ideal: 'O se atiende, o se desvía con mensaje' },
    { metrica: 'Consumo de la bolsa de 50,000 min', real: '39.2% · 19,606 min', ideal: 'Ajustar el plan o aprovechar lo pagado' },
    { metrica: 'Sucursales con número nuestro', real: '2 plazas de 6', ideal: 'Las 7 sucursales del localizador' },
    { metrica: 'Reuniones en 67 meses', real: 'NINGUNA', ideal: 'Trimestral: 22' },
    { metrica: 'Score relacional', real: '4 — el más bajo de las ocho auditorías', ideal: 'Por encima de 50' },
  ],

  plan_inmediato: [
    { accion: 'PREGUNTARLE A DANIEL OLIVARES QUIÉN MÁS USA LA PLATAFORMA. Apareció hoy reportando un fallo y no estaba en la ficha; sabía al detalle cómo la ocupan. Es la puerta directa al equipo que de verdad opera el servicio, y nunca hemos hablado con ellos', responsable: 'Fátima', criterio: 'Daniel capturado con cargo, correo y teléfono, y al menos un nombre más del equipo operativo' },
    { accion: 'RECONOCER EL INCIDENTE DE HOY antes de que escale: el hotfix sin sign off les rompió la búsqueda en call details y el export a correo. Es nuestro, es de hoy, y lo reportó el cliente', responsable: 'Producto / Fátima', criterio: 'Aviso enviado al cliente con qué cambió y qué se repone. Ticket #117503 cerrado con explicación.' },
    { accion: 'ARREGLAR «(sin destino registrado)»: 23,881 llamadas perdidas, el 84.2% de todas las de la cuenta, desde 2,251 números distintos y con cero minutos', responsable: 'Ingeniería', criterio: 'Toda llamada entrante con un destino asignado, y el bloque por debajo del 5% de pérdida' },
    { accion: 'Revisar las tres extensiones personales que pierden entre el 62% y el 100%: Lezly Iohanna Carreón Loera, Marco Antonio Moreno Ibarra y Azucena Garcia Segura', responsable: 'Ingeniería / Fátima', criterio: 'Cada una reasignada, retirada o explicada' },
    { accion: '✓ HECHO el 13 oct 2026 — Corregido el importe ($15,696 → $21,626), capturados 11 contactos donde había 2 —incluido Daniel Olivares, que reportó el incidente y no estaba— y puesto el servicio real en su campo, que guardaba una nota de fusión', responsable: 'Fátima / Facturación', criterio: 'Aplicado y comprobado con `scripts/enriquece-probemedic.py`' },
    { accion: 'Llevar a facturación las tres líneas «Probemedic» sin CID del GRC —$8,314 al mes— para saber si son del mismo grupo. Una de ellas, «CANALES DIGITALES», lleva un mes facturando', responsable: 'Facturación', criterio: 'Las tres con CID asignado o descartadas por escrito' },
  ],

  plan_mediano: [
    { accion: 'Primera reunión en 67 meses, con el director general y con quien opere las líneas de programa', responsable: 'Fátima', criterio: 'Reunión registrada con minuta, y el Radar completado (hoy 2 de 12)' },
    { accion: 'Atender el sábado y decidir qué hacer con el domingo: 36.7% y 36.5% de pérdida, con cinco horas publicadas el sábado y ninguna el domingo', responsable: 'Fátima / Probemedic', criterio: 'O se amplía la ventana, o las llamadas fuera de horario reciben un mensaje en vez de nada' },
    { accion: 'Diagnosticar el 32.75% de salientes que no conectan: 48,787 llamadas. Nadie lo ha mirado todavía', responsable: 'Ingeniería', criterio: 'Se explica el origen o se descarta que sea configuración' },
    { accion: 'Cerrar el número de sucursales: la ficha decía 10, el localizador publica 7 y LinkedIn añade 4 direcciones más', responsable: 'Fátima', criterio: 'Una cifra con fuente, confirmada con el cliente' },
  ],

  plan_estrategico: [
    { accion: 'UN DETECTOR DE NIVEL, NO SÓLO DE CAMBIO. Esta cuenta lleva nueve meses al 30% de pérdida sin encender una sola alerta, porque el motor sólo compara contra la base propia y la suya ya es mala. Comparar a cada quien consigo mismo premia la mediocridad estable', responsable: 'Producto / Dirección', criterio: 'Una cuenta por encima de un umbral absoluto abre alerta aunque no empeore' },
    { accion: 'Reporte por programa de pacientes: cada número es un convenio con un laboratorio o una aseguradora que mide si esa línea funciona', responsable: 'Producto / Fátima', criterio: 'El cliente recibe un informe por programa, no por cuenta' },
    { accion: 'Avisar SIEMPRE de los cambios de plataforma. El propio chat interno lo reconoce: «se les avisará a los clientes para evitar estas situaciones de sorpresa». Hoy no pasó', responsable: 'Producto / Dirección', criterio: 'Procedimiento de aviso previo, incluso para hotfix' },
    { accion: 'IA de Voz para la franja sin servicio: 987 llamadas después de las 20:00 y 1,095 en domingo', responsable: 'Fátima', criterio: 'Propuesta con el perfil horario real de la cuenta' },
  ],

  areas_oportunidad: [
    { area: 'El destino sin registrar', impacto: '23,881 llamadas perdidas, el 84.2% del total de la cuenta', responsable: 'Ingeniería' },
    { area: 'Cuatro sucursales sin número nuestro', impacto: 'Guadalajara, Puebla, Tijuana y León, con teléfono propio publicado', responsable: 'Fátima' },
    { area: 'Reporte por programa de pacientes', impacto: 'Es con lo que el cliente defiende sus convenios con laboratorios y aseguradoras', responsable: 'Producto' },
    { area: 'La franja sin servicio', impacto: '987 llamadas después de las 20:00 y 1,095 en domingo', responsable: 'Fátima' },
    { area: 'Canales digitales', impacto: 'Línea nueva facturando $1,649 al mes sin registrar en la ficha', responsable: 'Facturación' },
    { area: 'Integración API', impacto: 'Dos tickets ya son de APIs y `tiene_integracion_api` está en falso', responsable: 'Ingeniería' },
  ],

  perfiles: [
    {
      nombre: 'Enrique Manuel Castillo Morales', rol: 'Director General — titular de la cuenta', color: '#6366f1',
      campos: [
        { label: 'Correo',     value: 'ecastillo@probemedic.mx · (81) 2073-4041' },
        { label: 'Trato',     value: '25 sep 2026: no tomó tres llamadas, pero respondió por WhatsApp — «que lo busque el lunes y con gusto platicamos. Muy amable»' },
        { label: 'Es la vía', value: 'El tema de pacientes sin atender es de su nivel, no del técnico' },
      ],
    },
    {
      nombre: 'Daniel Olivares', rol: 'USUARIO DEL SERVICIO QUE NO TENÍAMOS REGISTRADO', color: '#ef4444',
      campos: [
        { label: 'Apareció',  value: '13 oct 2026, 10:50 — reportando que un cambio nuestro les tumbó la búsqueda en call details y el export de llamadas a correo' },
        { label: 'Estado antes', value: 'SU NOMBRE NO ESTABA EN NINGÚN CAMPO DE LA FICHA. En 67 meses sólo teníamos al director general y a un técnico de soporte.' },
        { label: 'Lo que delata', value: 'No llamó a preguntar: llamó sabiendo qué cambió y cómo lo usan —«buscaban a 8 dígitos»—. Eso no lo dice alguien recién llegado: lleva tiempo operando la plataforma.' },
        { label: 'Por qué importa', value: 'Es el ÚNICO que podía avisarnos de que algo se rompió, y no estaba en la lista de a quién avisar. Capturado el 13 oct 2026.' },
        { label: 'Lo siguiente',  value: 'Preguntarle quién más usa la plataforma. Es la puerta al equipo operativo con el que nunca hemos hablado.' },
      ],
    },
    {
      nombre: 'Rafael Garcia Torres', rol: 'Soporte técnico — Probemedic', color: '#22c55e',
      campos: [
        { label: 'Correo',  value: 'rafael.garcia@probemedic.mx · 55 4674 1020' },
        { label: 'Papel',   value: 'Es el contacto técnico registrado, y el interlocutor natural para los tres enrutamientos rotos' },
      ],
    },
    {
      nombre: 'Comité de Ética (3 nombres)', rol: 'Del Código de Ética oficial — CONFIRMAR VIGENCIA', color: '#8b5cf6',
      campos: [
        { label: 'Quiénes',   value: 'Elena Guadalupe Rodríguez Torres (RH), Adrián García Villarreal (Almacenes y Logística), Ceydi Yolotzi Cortés Hernández (Cumplimiento y Calidad)' },
        { label: 'Por qué importan', value: 'Logística coordina sucursales y entregas; Cumplimiento toca trazabilidad, que en alta especialidad es materia regulada' },
        { label: 'Reserva',   value: 'La investigación pide confirmar que siguen en el cargo antes de tratarlos como decisores. Se capturaron con esa marca.' },
      ],
    },
    {
      nombre: 'Fátima', rol: 'Asesora SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividad', value: '5 seguimientos —uno de hoy— y 1 actividad completada. Score de actividad 66.' },
        { label: 'Lo que hizo bien', value: 'Insistió: tres llamadas, WhatsApp, y consiguió respuesta. Capturó el mapa de decisores.' },
        { label: 'Con qué trabajaba', value: 'Con el importe al 73%, el servicio real escondido en otro campo, y sin una sola alerta que le dijera que la cuenta pierde el 30%' },
        { label: 'Contexto',  value: 'Suspendida del tablero del 6 al 12 oct 2026 por instrucción de dirección' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cuando la llamada llega a un destino que funciona, se contesta el 97.6% de las veces',
      '67 meses de relación y cero incidencias de pago · acumulado $1,012,485',
      'La mediana de resolución de tickets son 2.2 horas, la mejor de las ocho auditorías',
      'El cliente responde: contestó por WhatsApp el 25 sep y reportó el incidente de hoy por su cuenta',
      'Hay crecimiento nuevo: «CANALES DIGITALES» empezó a facturar este mes',
      'El trabajo del asesor es reciente y sostenido, con score de actividad 66',
    ],
    oportunidades: [
      'Cuatro de sus siete sucursales no tienen número nuestro, y publican teléfono propio',
      'No tiene Chat, IA de Voz, IA de Chat ni integración API contratados',
      'Usa el 39.2% de su bolsa de minutos: paga por más del doble de lo que gasta',
      'Cada número es un convenio con un laboratorio o aseguradora: hay un reporte por programa que nadie le da',
    ],
    debilidades: [
      'Pierde el 30.63% de las llamadas y lleva nueve meses así',
      'Cero alertas abiertas: el motor no ve lo crónico',
      'El 93.4% de las pérdidas en cuatro destinos, uno de ellos con el 100% de pérdida',
      'El usuario que de verdad opera la plataforma no estaba registrado: apareció hoy, al reportar un fallo nuestro',
      'Cero reuniones en 67 meses · score relacional 4, el más bajo de la serie',
      'Tres quejas formales en la mesa, el único cliente de las ocho que ha usado esa categoría',
      'El sábado pierde el 36.7% y el domingo entra tráfico sin horario publicado',
    ],
    amenazas: [
      'LO QUE SE PIERDE AQUÍ SON PACIENTES EN TRATAMIENTO PROLONGADO, no ventas. 28,357 llamadas sin contestar en una operación de alta especialidad es un riesgo que no se mide en pesos.',
      'Los dueños de los programas —AXA, AbbVie, Pint Farma, CIMESA— miden si su línea funciona. Una queja ahí escala por encima de nuestro interlocutor y del suyo.',
      'Hoy le cambiamos la plataforma sin avisar y se lo rompimos. En un cliente que ya pierde el 30%, es el peor momento posible para una sorpresa.',
      'Tres quejas formales sin que ninguna haya abierto una conversación de fondo',
      'Sin alertas y sin reuniones, no hay ningún mecanismo que avise antes de una no renovación',
    ],
  },

  conclusion: 'PROBEMEDIC lleva nueve meses perdiendo tres de cada diez llamadas y el tablero nunca dijo nada. No por descuido: porque el motor compara cada cuenta consigo misma, y con una base del 30.92% el mes cerrado al 28.08% se lee como mejora. Ésa es la lección que esta cuenta deja y no es sobre ella: comparar a cada quien contra su propio pasado detecta los derrumbes y deja pasar lo crónico. Falta un detector de nivel.\n\nLa buena noticia es que el problema es barato. Cuando la llamada llega a un destino que funciona, se contesta el 97.6% de las veces — el equipo está y responde. El 93.4% de las pérdidas cabe en cuatro destinos: uno que no existe, por donde se van 23,881 llamadas, y tres extensiones personales, una de las cuales no ha contestado ni una sola de las 346 que recibió. Eso se arregla en días, no en trimestres, y nadie lo había mirado porque la cifra agregada no invitaba a mirar.\n\nLo que cambia la gravedad del asunto es para qué nos usa el cliente, y eso lo destapó cruzar nuestros propios DIDs con la investigación de dirección. Los 34 números no están puestos por sucursal: están puestos por aseguradora, laboratorio y hospital, y trece de treinta son 800. Son líneas de programa de pacientes de una empresa que distribuye medicamentos de alta especialidad para enfermedades crónicas y degenerativas. Las 28,357 llamadas sin contestar no son ventas perdidas: son pacientes en tratamiento prolongado que no consiguieron hablar con nadie.\n\nY el mismo cruce deja servida la ampliación más concreta de toda la serie: tenemos números en Monterrey y CDMX, y ninguno en Guadalajara, Puebla, Tijuana ni León, que son cuatro de sus siete sucursales y publican teléfono propio.\n\nHoy, mientras se escribía esto, el cliente reportó que un cambio nuestro le rompió la búsqueda de llamadas. Interno: «no hubo sign off, fue un hotfix». Lo reportó alguien que ni siquiera estaba en nuestra ficha. Es un mal día para que eso pase, y es exactamente la razón para llamar mañana.',

  pierde: [
    'Callpicker pierde $21,626 al mes si la cuenta se va — y hasta $29,940 si las otras tres líneas del grupo resultan ser la misma empresa.',
    'Se pierde la relación con los dueños de los programas: AXA, AbbVie, Pint Farma, CIMESA y HOPE Medical Center miden esas líneas.',
    'Probemedic pierde contacto con pacientes en tratamiento prolongado — 28,357 llamadas en nueve meses, y seguirá perdiéndolos mientras el enrutamiento siga igual.',
    'Se pierde una relación de 67 meses con pago impecable y más de un millón de pesos facturados.',
  ],

  gana: [
    'Arreglar cuatro destinos elimina el 93.4% de las pérdidas de la cuenta: el mejor retorno por esfuerzo de las ocho auditorías.',
    'Cuatro sucursales sin número nuestro, con teléfono propio publicado: la ampliación está identificada y es verificable.',
    'No tiene Chat, IA de Voz, IA de Chat ni API contratados, y usa el 39.2% de su bolsa: hay espacio por los dos lados.',
    'Un reporte por programa de pacientes es el entregable con el que el cliente defiende sus convenios, y hoy nadie se lo da.',
  ],

  recomendacion_central: 'MAÑANA, Y EMPEZANDO POR LO QUE ES NUESTRO. Hoy a las 10:50 el cliente reportó que un cambio en la plataforma le rompió la búsqueda en call details y el export de llamadas a correo, y el chat interno lo reconoce sin rodeos: «no hubo sign off, fue un hotfix». Reconocerlo nosotros, con qué cambió y qué se repone, antes de que vuelva como queja — porque este cliente ya ha usado tres veces la categoría «Queja o Sugerencia», que es el único de las ocho auditorías que lo ha hecho.\n\nDESPUÉS, EL ENRUTAMIENTO, QUE ES LO QUE DE VERDAD LE DUELE Y NO LO SABE. Pierde el 30.63% de sus llamadas desde enero y el 93.4% de esas pérdidas cabe en cuatro destinos: «(sin destino registrado)» con 23,881, y tres extensiones personales —una de las cuales, a nombre de Marco Antonio Moreno Ibarra, recibió 346 llamadas y no contestó ninguna—. Cuando la llamada llega a un destino que funciona, se contesta el 97.6% de las veces. No es un problema de equipo ni de capacidad: son números que ya no apuntan a ningún sitio, y se arreglan en días.\n\nY LA CONVERSACIÓN DE FONDO ES CON EL DIRECTOR GENERAL, NO CON EL TÉCNICO. Esta cuenta no opera conmutadores de farmacia: opera líneas de programa de pacientes de AXA, AbbVie, Pint Farma, CIMESA y HOPE Medical Center, con trece números 800. Lo que se pierde cuando una llamada no se contesta no es una venta: es un paciente en tratamiento prolongado. Enrique Castillo contestó por WhatsApp hace tres semanas y dijo que con gusto platicaba el lunes. Ese lunes no ha ocurrido, y van 67 meses sin una sola reunión.\n\nDE PASO, HAY UNA VENTA IDENTIFICADA Y VERIFICABLE: tenemos números en Monterrey y CDMX, y ninguno en Guadalajara, Puebla, Tijuana ni León, que son cuatro de sus siete sucursales oficiales y publican teléfono propio.\n\nY LO QUE NO ES DE ESTA CUENTA pero que esta cuenta demuestra: mientras el motor sólo compare a cada quien contra su propia base, una cuenta puede normalizar un 30% de pérdida y quedar en verde nueve meses seguidos. Hace falta un umbral absoluto.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 18 tickets de «Probemedic Distribuciones» (CID 112478) en lib/tickets-data.json',
    periodo: 'Abril 2026 – Octubre 2026 · la fuente trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí',
    diagnostico: 'A diferencia de OdontoPrev, aquí los tickets son de VOZ: «Duda Operativa» 6, «Queja o Sugerencia» 3, APIs 2, Softphone 2, Falla SIP 1, Login 1, y uno solo de chat. La mediana de resolución son 2.2 horas, la mejor de las ocho auditorías, y sólo dos de los 18 son fallas. En resolución, la mesa atiende bien a este cliente.\n\nLo que no encaja es el contenido. Tres «Queja o Sugerencia» formales —es el ÚNICO cliente de las ocho auditorías que ha usado esa categoría, y la usó tres veces— y seis «Duda Operativa» sobre un servicio que lleva 67 meses contratado. Un cliente veterano que sigue preguntando cómo se opera, y que además se queja formalmente, está pidiendo algo que no es un ticket. Y el ticket #117503, abierto hoy por un cambio nuestro sin aviso, va a ser el cuarto.',
    metricas: [
      { metrica: 'Tickets totales',          valor: '18 (abr–oct 2026)',      lectura: 'Pico en septiembre con 7' },
      { metrica: 'De voz',                   valor: '17 de 18',               lectura: 'Al revés que OdontoPrev: aquí el canal problemático es la voz' },
      { metrica: 'Quejas formales',          valor: '3 · «Queja o Sugerencia»', lectura: 'Único cliente de las ocho auditorías que ha usado esa categoría' },
      { metrica: 'Dudas operativas',         valor: '6 · 33.3%',              lectura: 'En un cliente de 67 meses. Es una señal de capacitación, no de soporte.' },
      { metrica: 'Fallas del servicio',      valor: '2 · 11.1%',              lectura: 'Falla SIP y Falla Cliente, ambas en mayo' },
      { metrica: 'Mediana de resolución',    valor: '2.2 horas',              lectura: 'La MEJOR de las ocho auditorías. La mesa responde rápido.' },
      { metrica: 'El más largo',             valor: '407 h · 17 días',        lectura: 'Tres tickets (16.7%) pasaron de siete días' },
    ],
    reincidencias: [
      { patron: 'Duda Operativa (voz)',      veces: '6 · 33.3%', causa: 'Un cliente de 67 meses que sigue preguntando cómo se opera el servicio. Es capacitación pendiente, no demanda de soporte.' },
      { patron: 'Queja o Sugerencia (voz)',  veces: '3 · 16.7%', causa: 'El único cliente de la serie que usa el canal formal de queja. Ninguna de las tres abrió una conversación de fondo.' },
      { patron: 'APIs (voz)',                veces: '2 · 11.1%', causa: 'Hay interés o necesidad de integración, y `tiene_integracion_api` está en falso.' },
      { patron: 'Softphone (voz)',           veces: '2 · 11.1%', causa: 'Operación con agentes en softphone: coherente con líneas de programa de pacientes.' },
    ],
    hallazgos: [
      'La mesa responde bien —2.2 horas de mediana— y aun así el cliente ha puesto tres quejas formales. El problema no es el tiempo de respuesta: es que nada de lo que reporta cambia su situación de fondo.',
      'Seis dudas operativas en un cliente de 67 meses apuntan a capacitación, y esa es una conversación que nadie ha tenido en 67 meses sin reuniones.',
      'El ticket #117503, abierto hoy por un cambio nuestro sin sign off, llega al peor cliente posible para una sorpresa: uno que ya pierde el 30% de sus llamadas.',
    ],
  },
}
