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
 * v1.1 — DIECISÉIS CIFRAS CORREGIDAS, Y LA TESIS CENTRAL ERA FALSA
 * ----------------------------------------------------------------
 * La v1.0 se publicó el 13 oct 2026 y una verificación adversarial encontró
 * 16 errores graves sobre 330 afirmaciones. Se corrigen todos. Los que
 * importan, por orden de gravedad:
 *
 * 1. LA TESIS CENTRAL NO LA SOSTIENE EL CÓDIGO. La v1.0 decía que «el motor de
 *    alertas compara cada cuenta contra su propia base y por eso lo crónico es
 *    invisible». Falso: el motor NO evalúa llamadas sin contestar — sus 21
 *    tipos de `lib/alertas.ts` no incluyen ninguno de atención telefónica. La
 *    comparación 28.08% contra 30.92% vive en `lib/llamadas-cuenta.ts`, que es
 *    el panel de llamadas. Y el motor SÍ tiene detectores de nivel absoluto:
 *    `uso_bajo`, `consumo_cero` y `rebasa_bolsa` son umbrales fijos.
 *    El hueco existe, pero es otro, y abajo se nombra bien.
 *
 * 2. `c` NO ES «CONTESTADAS». `lib/llamadas-cuenta.ts` lo dice literalmente:
 *    «NO PERDIDAS… dentro van las que resolvió el menú y las que cayeron al
 *    buzón. Para atención por una persona, `redir`». La v1.0 publicó «se
 *    contesta el 97.6% de las veces» contando 746 buzones como atención. Por
 *    persona es el 96.0%. Y la cifra que de verdad describe la cuenta no es el
 *    30.63% de Lost: son **35,224 llamadas de 92,572 —el 38.05%— que nunca
 *    llegaron a una persona**.
 *
 * 3. Dos afirmaciones comparativas, las dos falsas: no es «la segunda peor
 *    tasa de las ocho auditorías» (OOAPAS pierde el 99.70%; ésta es la
 *    TERCERA) ni «la segunda mayor facturación acumulada» (Sección Amarilla
 *    $7.68M, Tech People $6.92M y GTC-Oleksei $3.16M están por encima).
 *
 * 4. El consumo del 39.2% salía de un RESPALDO SUPERADO. La fuente vigente
 *    tiene dos cortes más y van a la baja: 40.05% → 37.27% → 35.70%.
 *
 * 5. Radar: son 12 de 12, no 2 de 12 — se contaron FILAS como preguntas.
 *
 * TODAS las cifras salen de fuente y están verificadas:
 *   · llamadas  → app/cuentas/llamadas-data.ts, CID 112478. Las dos lecturas:
 *                 `l` (perdidas) y `redir` (llegaron a una persona).
 *   · consumo   → data/cortes-facturacion.xlsx, el VIGENTE (9 oct), no el .bak
 *   · DIDs      → data/dids.json, CIDs 112478 y 68328
 *   · importe   → GRC por CID: $21,626. El grupo suma $29,940 en cuatro líneas.
 *   · tickets   → lib/tickets-data.json, 18 filas
 *   · alertas   → alertas_episodios: CERO abiertas
 *   · la empresa → sitio oficial, Código de Ética, localizador y LinkedIn
 */
export const PROBEMEDIC: AuditoriaCase = {
  id: 'probemedic',
  asesor: 'Fátima',
  nombre: 'PROBEMEDIC · Farmacias ProbeMedic Especializadas',
  sector: 'Farmacéutica — distribución de medicamentos de alta especialidad · Monterrey, N.L.',
  fecha_periodo: 'Marzo 2021 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA · 67 meses · 51–200 empleados · 7 sucursales en 6 estados · CID 112478',
  descripcion_contexto: '35,224 de sus 92,572 llamadas —el 38.05%— nunca llegaron a una persona, y lleva NUEVE MESES así · CERO alertas abiertas, porque el motor no evalúa atención telefónica en absoluto · El 93.4% de las pérdidas cabe en cuatro destinos, y en el resto sí se atiende al 96.0% · Y no nos usa para sus farmacias: opera líneas de programa de pacientes de AXA, AbbVie, Pint Farma y CIMESA',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.1',

  kpis: [
    { label: 'Quien reportó el fallo de hoy',      value: 'NO estaba', color: '#ef4444' },
    { label: 'Nunca llegaron a una persona',       value: '38.05%',  color: '#ef4444' },
    { label: 'Alertas abiertas',                   value: 'CERO',    color: '#ef4444' },
    { label: 'De las pérdidas, en 4 destinos',     value: '93.4%',   color: '#f97316' },
    { label: 'En el resto, sí llega a una persona', value: '96.0%',  color: '#22c55e' },
    { label: 'Sucursales sin un número nuestro',   value: '4 de 7',  color: '#f97316' },
  ],

  resumen_ejecutivo: 'LA CIFRA QUE DESCRIBE ESTA CUENTA NO ES LA QUE EL TABLERO PUBLICA. El tablero dice que pierde 28,357 de sus 92,572 llamadas: el 30.63%. Pero «perdida» sólo cuenta la que nadie descolgó, y aquí hay otras 6,867 que las atendió el menú automático o murieron en un buzón. Medido como lo define la casa —atendida es la que llega a UNA PERSONA— son **35,224 de 92,572, el 38.05%, las que nunca hablaron con nadie**. Es la tercera peor de las ocho auditorías escritas, detrás de OOAPAS (99.70%) y del septiembre de Torres Corzo (55.5%).\n\nY NO ES UN COLAPSO, ES UNA CONDICIÓN CRÓNICA. La tasa lleva nueve meses sin moverse —28.3% en enero, 31.1% en febrero, 32.0% en junio, 28.1% en agosto, 31.6% en septiembre—. En todo ese tiempo **no se ha abierto una sola alerta sobre esta cuenta**, y el motivo es más simple y más incómodo de lo que parece: el motor de alertas **no evalúa la atención telefónica en absoluto**. Sus 21 tipos cubren consumo, silencio, mesa de ayuda y huecos de ficha; ninguno mira llamadas sin contestar. Una cuenta puede perder cuatro de cada diez durante nueve meses sin que el sistema tenga nada que decir, porque no está mirando ahí.\n\nLO SEGUNDO ES QUE EL PROBLEMA NO ES DE PERSONAL, ES DE ENRUTAMIENTO, y eso lo vuelve barato de arreglar. En el grueso del tráfico la atención es buena: el bloque «otros destinos» mueve 47,593 llamadas y **45,692 llegan a una persona, el 96.0%**. El desastre está concentrado en cuatro sitios. «(sin destino registrado)» recibe 29,783 llamadas y sólo **46** llegan a alguien —el 0.2%, con cero minutos de conversación—, desde 2,251 números distintos. Y tres extensiones personales: Marco Antonio Moreno Ibarra, 346 llamadas y **ninguna** atendida; Azucena Garcia Segura, 351 llamadas de las que 219 se perdieron y las otras 132 cayeron íntegras al buzón, o sea **tampoco ninguna**; y Lezly Iohanna Carreón Loera, 2,142 llamadas de las que sólo 89 llegaron a una persona (el 4.2%). Entre esos cuatro destinos está el 93.4% de las pérdidas de la cuenta sobre el 1.9% de su tráfico.\n\nLO TERCERO CAMBIA LO QUE CREÍAMOS QUE ERA LA CUENTA. La investigación de dirección advirtió que el inventario de números podía cubrir más ubicaciones que las visibles en su web, y al cruzarlo contra nuestros DIDs salió otra cosa: los 34 números no están etiquetados por sucursal sino por aseguradora, laboratorio y hospital —«800 AXA», «Abbvie», «Botox», «Pint Farma», «CIMESA», «HOPE M CENTER», «AMBULANCIAS_SOS», «Enfermería SOS»—, con trece números 800 entre ellos. **No nos usa para atender farmacias: opera líneas de programa de pacientes.** Encaja con lo que la investigación describe: medicamentos de alta especialidad para enfermedades crónicas y degenerativas, de tratamiento prolongado, con seguimiento continuo al paciente.\n\nEso cambia qué significa una llamada que no llega. No es una venta que no ocurrió: es un paciente en tratamiento largo que no consiguió hablar con nadie. Y son 35,224 en nueve meses — no las 28,357 de la métrica de perdidas, porque otras 6,867 las atendió una máquina o un buzón.\n\nY HAY UNA OPORTUNIDAD QUE EL MISMO CRUCE DEJA SERVIDA: por lada tenemos 15 números en Monterrey, 2 en CDMX y 13 nacionales. Cero en Guadalajara, Puebla, Tijuana y León — cuatro de sus siete sucursales oficiales, todas con teléfono propio publicado que no es nuestro.\n\nY HOY PASÓ ALGO QUE VALE POR TODO LO ANTERIOR. A las 10:50, un cambio nuestro de plataforma le rompió al cliente la búsqueda en call details y el export de llamadas a correo —el chat interno lo reconoce sin rodeos: «no hubo sign off, fue un hotfix»—. Pero lo importante no es el fallo: es QUIÉN lo reportó. **Daniel Olivares, un nombre que no estaba en ninguna parte de nuestra ficha.**\n\nEn 67 meses de relación teníamos registrados dos contactos: el director general y un técnico de soporte. Ninguno de los dos es quien usa el servicio todos los días. La persona que de verdad lo opera —la que nota en diez minutos que una búsqueda dejó de funcionar— era invisible para nosotros hasta que algo se rompió. Y el detalle que lo delata es que no llamó para preguntar: llamó sabiendo exactamente qué había cambiado y cómo lo usaban («buscaban a 8 dígitos»). Lleva tiempo ahí.\n\nEso significa que nuestro mapa de contactos no está incompleto por descuido: está sesgado. Capturamos a quien FIRMA y a quien nos escribe cuando algo falla, no a quien USA. Y la alerta que existe para avisarlo, `sin_contactos`, no se enciende aquí — porque hay dos contactos, y el motor cuenta cuántos hay, no si son los que importan. Tener algunos contactos tapa el hecho de no tener los correctos.',

  resultado_positivo: 'Hay más de lo que la tasa del 30% sugiere, y conviene separarlo.\n\nCUANDO LA LLAMADA LLEGA A SU DESTINO, SE CONTESTA. El bloque «otros destinos» mueve 47,593 llamadas —más de la mitad del tráfico— y 45,692 llegan a una persona: el 96.0%. Y los cinco destinos nominales que funcionan, TODOS, sin escoger: Aly Osorio atiende el 93.8%, Jessica Ana Karen Sanchez Hernandez el 86.9%, Cesar Niño el 80.7%, ALEJANDRO GOMEZ el 74.6% y Erika Pérez el 65.5%. Los dos últimos quedaron fuera de la v1.0, que citaba sólo los tres mejores. Hay un equipo que contesta; el problema está antes, en el enrutamiento.\n\nLA TENDENCIA, MEDIDA CONTRA SÍ MISMA, VA A MEJOR. El mes cerrado pierde 28.08% contra una base propia de 30.92%: son 289 llamadas perdidas menos de las que esta cuenta normalmente pierde. Es poco consuelo con una base tan alta, pero no es un deterioro.\n\nEL TRABAJO DEL ASESOR ESTÁ Y ES RECIENTE. Cinco seguimientos, uno de ellos de hoy mismo, y una actividad completada. El 25 de septiembre Fátima marcó tres veces sin respuesta, insistió por WhatsApp y el cliente contestó: «que lo busque el lunes y con gusto platicamos. Muy amable». El mapa de decisores está capturado. Su score de actividad es 66, de los más altos de la serie.\n\nEL PAGO ES IMPECABLE: cero incidencias en 67 meses, score de pago 100, y el GRC la clasifica AAA con un acumulado de $1,012,485. (La v1.0 dijo que era la segunda mayor de las auditadas y es falso: Sección Amarilla acumula $7.68M, Tech People $6.92M y la línea GTC-Oleksei $3.16M.)\n\nY HAY CRECIMIENTO NUEVO SIN REGISTRAR: en el GRC aparece una línea «PROBEMEDIC CANALES DIGITALES» con $1,649 al mes y UN SOLO mes de vida. Es su unidad de comercio electrónico empezando a facturar, y nadie la ha anotado en la ficha.',

  hallazgos: [
    'RELACIÓN — HOY APARECIÓ UN USUARIO DEL SERVICIO QUE NO TENÍAMOS REGISTRADO, Y SE SUPO PORQUE ALGO SE ROMPIÓ. El 13 de octubre a las 10:50, **Daniel Olivares** reportó que un cambio nuestro les tumbó la búsqueda en call details y el export de llamadas a correo. Su nombre no aparecía en ningún campo de la ficha. En 67 meses teníamos dos contactos: el director general y un técnico de soporte — ninguno de los dos es quien usa el servicio a diario.',
    'RELACIÓN — Y NO ERA UN USUARIO CUALQUIERA: SABÍA EXACTAMENTE CÓMO LO USAN. No llamó a preguntar qué pasaba; llamó diciendo qué había cambiado y cómo lo ocupaban —«buscaban a 8 dígitos»— y señalando además el export a correo. Eso no lo dice alguien que acaba de llegar: lleva tiempo operando la plataforma. Un usuario con ese nivel de detalle llevaba meses, puede que años, fuera de nuestro radar.',
    'RELACIÓN — EL MAPA DE CONTACTOS NO ESTÁ INCOMPLETO: ESTÁ SESGADO. Capturamos a quien FIRMA el contrato y a quien nos escribe cuando algo falla, no a quien USA el servicio todos los días. Es el mismo patrón en las ocho auditorías —en IMPAS el contacto era un contratante que no responde, en OdontoPrev un líder que ya no está en la operación— y aquí se ve el costo: el único que podía avisarnos de que la plataforma se rompió no estaba en la lista de a quién avisar.',
    'ALERTAS — Y LA ALERTA QUE EXISTE PARA ESTO NO SE ENCIENDE. `sin_contactos` sólo salta cuando `contactos_json` está VACÍO, y aquí había dos. El motor cuenta cuántos contactos hay, no si son los que importan. **Tener algunos contactos tapa el hecho de no tener los correctos** — y es el mismo defecto de diseño que el de la tasa de pérdida: se mide la presencia, no la calidad.',
    'ATENCIÓN — LA CIFRA BUENA NO ES EL 30.63%, ES EL 38.05%. El tablero publica 28,357 llamadas «perdidas» de 92,572, pero «perdida» sólo cuenta la que nadie descolgó. Otras 6,867 las atendió el menú o murieron en un buzón. Medido como lo define `lib/llamadas-cuenta.ts` —atendida es la que llega a UNA PERSONA, el campo `redir`— son 35,224 de 92,572 las que nunca hablaron con nadie: el 38.05%.',
    'ATENCIÓN — Y LAS SALIENTES VAN BIEN, aunque la cifra suene mal: 48,787 de 148,963 no conectaron, el 32.75%. `lib/llamadas-cuenta.ts` advierte que una saliente que no conecta NO es lo mismo que una entrante perdida, y da la referencia: «43.6%, que es lo normal». Está ONCE PUNTOS POR DEBAJO de lo normal. La v1.0 escribió que «van igual» que las entrantes y mandó diagnosticarlo: no hay nada que diagnosticar.',
    'ATENCIÓN — Y ES LA TERCERA PEOR DE LAS OCHO AUDITORÍAS, no la segunda como decía la v1.0. Por delante están OOAPAS, que pierde el 99.70% (2,625 de 2,633), y el septiembre de Torres Corzo, con el 55.5%.',
    'ATENCIÓN — LLEVA NUEVE MESES ASÍ, SIN MOVERSE. Enero 28.3%, febrero 31.1%, marzo 30.4%, abril 31.7%, mayo 31.9%, junio 32.0%, julio 31.2%, agosto 28.1%, septiembre 31.6% (sobre la métrica de perdidas). No es un incidente: es el estado normal de la cuenta.',
    'ALERTAS — CERO ABIERTAS, Y EL MOTIVO ES MÁS SIMPLE DE LO QUE LA v1.0 DIJO. No es que el motor compare contra la base propia: **el motor no evalúa la atención telefónica en absoluto**. Los 21 tipos de `lib/alertas.ts` cubren consumo, contacto, mesa de ayuda y huecos de ficha, y ninguno mira llamadas sin contestar; `lib/alertas-detectar.ts` ni siquiera importa el archivo de llamadas. El veredicto que compara 28.08% contra la base de 30.92% vive en `lib/llamadas-cuenta.ts`, que pinta el panel de la ficha: es una lectura de pantalla, no una alerta, y no le llega a nadie que no abra la cuenta.',
    'ALERTAS — Y EL MOTOR SÍ TIENE DETECTORES DE NIVEL ABSOLUTO, así que la recomendación de la v1.0 también estaba mal fundada. `uso_bajo` salta por debajo del 15% del plan, `consumo_cero` por debajo del 0.5% y `rebasa_bolsa` por encima del 100%: son umbrales fijos. Lo que falta no es «un detector de nivel»: es que la atención telefónica tenga CUALQUIER detector que la saque de la ficha.',
    'ATENCIÓN — NO ES UN PROBLEMA DE PERSONAL, ES DE ENRUTAMIENTO. En el grueso del tráfico se atiende bien: el bloque «otros destinos» mueve 47,593 llamadas y 45,692 llegan a una persona — el 96.0%. (La v1.0 publicó 97.6% contando 746 caídas al buzón como atención.) Lo que falla es lo que pasa ANTES de llegar.',
    'ATENCIÓN — EL PEOR SITIO ES PEOR DE LO QUE DECÍA LA v1.0. «(sin destino registrado)» recibe 29,783 llamadas desde 2,251 números distintos: 23,881 se pierden, 5,159 las resuelve el menú, 697 caen al buzón y **sólo 46 llegan a una persona** — el 0.2%, con CERO minutos de conversación. No son 23,881 llamadas que no llegaron a ninguna parte: son 29,737.',
    'ATENCIÓN — Y SON DOS EXTENSIONES AL 100%, NO UNA. «Marco Antonio Moreno Ibarra»: 346 llamadas, ninguna atendida. «Azucena Garcia Segura»: 351 llamadas, 219 perdidas y las otras 132 al buzón íntegras, con cero minutos — o sea que tampoco atendió ninguna. La v1.0 la publicó al 62.4% por contar el buzón como atención, y reservaba el veredicto fuerte sólo para Marco. «Lezly Iohanna Carreón Loera»: 2,142 llamadas y sólo 89 a una persona (4.2%), aunque esas 89 sí son conversaciones reales —230 minutos, 2.6 por llamada—. Entre esos tres y el sin destino, el 93.4% de las pérdidas sobre el 1.9% del tráfico.',
    'ESTRUCTURA — CATORCE DE SUS 34 NÚMEROS ESTÁN A NOMBRE DE UN TERCERO, y eso es lo que dice para qué nos usa. Los de tercero: «800 AXA», «Abbvie», «Botox», «Pint Farma», «Synthon», «TOTEM VP», «CIMESA» ×3, «HOPE M CENTER», «Sos Enfermería en el Hogar» ×2, «AMBULANCIAS_SOS» y «Enfermería SOS». Los otros veinte dicen «Probemedic» o una variante, dos están libres («Available») y uno es de sucursal («PROBEMEDIC FARMACIAS _ MTY»). La v1.0 afirmó que NINGUNO estaba etiquetado por sucursal y que todos eran de tercero: ni lo uno ni lo otro. Lo que sí sostiene la fuente es que hay una familia entera de líneas de aseguradora, laboratorio y hospital, y que trece de los treinta del CID principal son números 800 — la firma de un programa de apoyo a pacientes.',
    'ESTRUCTURA — Y ESO CAMBIA QUÉ ES UNA LLAMADA PERDIDA AQUÍ. La empresa distribuye medicamentos de alta especialidad para enfermedades crónicas, degenerativas o graves, de tratamiento prolongado, con seguimiento continuo al paciente. Una llamada que no llega a una persona no es una venta que no ocurrió: es un paciente en tratamiento largo que no consiguió hablar con nadie. Son 35,224 en nueve meses.',
    'CRECIMIENTO — CUATRO DE SUS SIETE SUCURSALES NO TIENEN UN NÚMERO NUESTRO. Por lada: 15 en Monterrey, 2 en CDMX y 13 nacionales (800). CERO en Guadalajara, Puebla, Tijuana y León, que sí tienen teléfono propio publicado en su localizador oficial. Es la oportunidad más concreta y verificable de toda la serie de auditorías.',
    'FACTURACIÓN — EL IMPORTE DE LA FICHA ESTABA AL 73% DEL REAL: $15,696 contra $21,626 del GRC por CID. Y el GRUPO factura más: hay tres líneas más de «Probemedic» sin CID —PROBEMEDIC $5,418, PROBEMEDIC CANALES DIGITALES $1,649 y Probemedic Farmacias $1,247— que suman $8,314. El total del grupo sería $29,940, pero sin CID no se puede afirmar que sean la misma empresa: es tarea de facturación, no una conclusión.',
    'FACTURACIÓN — HAY UNA LÍNEA NUEVA QUE NADIE HA REGISTRADO: «PROBEMEDIC CANALES DIGITALES», $1,649 al mes y UN SOLO mes de vida en el GRC. Coincide con la unidad de comercio electrónico que describe la investigación. Es crecimiento ocurriendo ahora mismo y no está en la ficha.',
    'FACTURACIÓN — La línea principal viene de un Downgrade: de $21,634 a $21,626, con $8.30 de pérdida. Son ocho pesos, pero el movimiento está marcado y conviene saber qué se redujo.',
    'SERVICIO — INCIDENTE ABIERTO HOY, Y ES NUESTRO. El 13 de octubre a las 10:50 el cliente reportó que un cambio en la plataforma les rompió la búsqueda en call details —buscaban a 8 dígitos— y el export de llamadas a correo. El chat interno lo dice sin rodeos: «no hubo sign off, fue un hotfix… se hizo para hacer algo rápido para acelerar las búsquedas». Ticket #117503. Un cliente que pierde el 30% de sus llamadas no es el cliente al que conviene sorprender con un cambio sin avisar.',
    'SERVICIO — Y LO REPORTÓ ALGUIEN QUE NO ESTABA EN LA FICHA: Daniel Olivares. Los contactos registrados eran Enrique Castillo (director general) y Rafael García (soporte técnico). Hay un tercer interlocutor operativo que lleva tiempo usando el servicio y nadie lo había capturado.',
    'SERVICIO — 18 tickets y 17 son de VOZ. El reparto completo, que ahora SÍ cierra: «Duda Operativa» 6, «Queja o Sugerencia» 3, APIs 2, Softphone 2, «Ajuste en Flujo» 1, «Falla Cliente» 1, «Falla SIP» 1, Login 1 y «Cliente Activo (chat)» 1. (La v1.0 enumeraba sólo 16 de 18 y lo presentaba como completo.) Dos fallas, el 11.1%. La mediana real es 1.70 horas, no las 2.2 que publicó la v1.0: con 18 valores la mediana es el promedio de los dos centrales, y `resumenDuracion()` toma el superior.',
    'SERVICIO — TRES «QUEJA O SUGERENCIA» FORMALES, Y LAS TRES EL MISMO DÍA. Es el único cliente de las ocho auditorías que ha usado esa categoría, y la usó tres veces el 25 de septiembre de 2026. No es una señal que se venía incubando: es un estallido puntual. Y coincide con el día en que Fátima marcó tres veces sin respuesta y acabó escribiendo por WhatsApp.',
    'OPERACIÓN — EL SÁBADO ES SU PEOR DÍA Y EL DOMINGO NO DEBERÍA EXISTIR. Sábado: 7,244 llamadas con 36.7% de pérdida, contra un horario publicado de 9:00 a 14:00 — cinco horas para absorber un día entero de demanda. Domingo: 1,095 llamadas con 36.5% de pérdida y NINGÚN horario publicado. Entre semana la tasa ronda el 29–31%.',
    'OPERACIÓN — El perfil horario es de negocio normal, con pico a las 11:00 (13.1%) y meseta de 10:00 a 16:00. Pero hay tráfico hasta las 23:00, por encima del horario publicado de 20:00: 4,009 llamadas a las 18:00, 1,368 a las 19:00 y 1,025 de las 20:00 en adelante (651 + 220 + 116 + 38). La v1.0 decía 987 porque dejó fuera el cubo de las 23:00.',
    'CONSUMO — NO ES ESTABLE AL 39.2%: ESTÁ CAYENDO. La v1.0 publicó «39.2%» y esa cifra salía de los tres últimos cortes de un RESPALDO SUPERADO (jun/jul/ago del .bak del 30 de agosto). La fuente vigente —`data/cortes-facturacion.xlsx`, refrescada el 9 de octubre— trae dos cortes más, y los tres últimos van a la baja: 40.05% en agosto, 37.27% en septiembre y 35.70% en octubre, el mínimo de los nueve cortes. El promedio del año es 39.04%. Son tres bajadas seguidas sobre una bolsa de 50,000 minutos que ya usaba a menos de la mitad.',
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

  necesidad_negocio: 'Probemedic distribuye medicamentos de alta especialidad: los que se recetan para enfermedades crónicas, degenerativas o graves y que el paciente va a tomar durante años. Ese negocio no se parece a vender en una farmacia de barrio. Requiere seguimiento continuo del paciente, convenios con el laboratorio que fabrica el medicamento, con la aseguradora que lo cubre y con el hospital que lo prescribe.\n\nY eso es exactamente lo que compró. Nuestros 34 números no están puestos por sucursal: están puestos por programa — «800 AXA» para los asegurados de esa compañía, «Abbvie» y «Pint Farma» para los pacientes de esos laboratorios, «CIMESA» y «HOPE M CENTER» para esos hospitales, «AMBULANCIAS_SOS» y «Enfermería SOS» para servicios asociados. Trece de los treinta son números 800, que es lo que se pone cuando quien llama no debe pagar la llamada: el paciente.\n\nEso define el servicio que nos compra. No es un conmutador: es la línea por la que un paciente en tratamiento prolongado contacta con quien le surte su medicamento. El laboratorio que patrocina ese programa mide si la línea funciona, y la aseguradora también.\n\nPor eso el 30.63% de llamadas sin contestar es más grave de lo que la cifra sugiere. No es un cliente que no compró: es un paciente que no pudo. Y por eso el cuello de botella está donde está: lo que falla no es el equipo que atiende —cuando la llamada llega a un destino bueno, el 96.0% acaba hablando con una persona— sino los números que ya no apuntan a ningún sitio. Veintitrés mil llamadas entrando a un destino que no existe, en una operación de salud, es un problema distinto de un SLA.',

  potencial_corto: [
    'Arreglar «(sin destino registrado)»: 23,881 llamadas perdidas, el 84.2% de todas las de la cuenta. Es un enrutamiento, no una contratación.',
    'Revisar las tres extensiones personales: DOS no atendieron ni una sola llamada —Marco Antonio Moreno Ibarra (346) y Azucena Garcia Segura (351, con 132 al buzón)— y la tercera, Lezly Iohanna Carreón Loera, sólo 89 de 2,142. O las personas ya no están, o los números sobran.',
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

  problema_raiz: 'El motor de alertas no mira la atención telefónica: ninguno de sus 21 tipos evalúa llamadas sin contestar. Una cuenta puede perder cuatro de cada diez durante nueve meses sin que nada se encienda, porque el sistema no está mirando ahí.',

  problema_raiz_detalle: 'Esta cuenta lleva nueve meses sin que cuatro de cada diez llamadas lleguen a una persona, y no ha generado una sola alerta. La explicación que esta auditoría dio en su primera versión —que el motor compara cada cuenta contra su propia base y por eso lo crónico es invisible— era elegante y era falsa. El código dice otra cosa, y conviene decirlo con precisión porque de ahí sale la recomendación.\n\n**El motor de alertas no evalúa la atención telefónica en absoluto.** `lib/alertas.ts` define 21 tipos y ninguno mira llamadas sin contestar: los 18 disparadores de `lib/alertas-detectar.ts` son de consumo (caída, desplome, cero, uso bajo, rebase, sin medición), de contacto (silencio 30 y 60, sin interlocutor, nunca contactada), de mesa de ayuda (fuera de SLA, atraso crónico, fallas recurrentes) y de huecos de ficha (sin radar, sin contactos, sin ficha, sin datos auditables, sin importe). El detector ni siquiera importa el archivo de llamadas.\n\nLa comparación «28.08% contra una base propia de 30.92%» que la v1.0 atribuyó al motor vive en otro sitio: en `lib/llamadas-cuenta.ts`, que alimenta el panel de llamadas de la ficha, con sus propios umbrales. Es un veredicto de pantalla, no una alerta. Nadie lo recibe si no abre la cuenta.\n\nY la recomendación de la v1.0 —«falta un detector de nivel, no sólo de cambio»— también estaba mal fundada: el motor SÍ tiene detectores de nivel absoluto. `uso_bajo` salta por debajo del 15% del plan, `consumo_cero` por debajo del 0.5% y `rebasa_bolsa` por encima del 100%. Son umbrales fijos, no comparaciones contra la base propia.\n\nEl hueco real, entonces, es más sencillo y más fácil de cerrar: **la atención telefónica se mide bien y se pinta bien, pero no tiene ningún detector que la saque de la ficha**. Una cuenta como ésta sólo se descubre si alguien la abre, y nadie abre una cuenta que no sale en ninguna lista. Eso es lo que hay que proponer, y no lo que decía la versión anterior.\n\nLA SEGUNDA CAPA ES QUE EL PROMEDIO ESCONDE DÓNDE ESTÁ EL PROBLEMA, igual que en OdontoPrev pero más extremo. El 38.05% global no dice nada accionable. Mirando por destino, el 84.2% de las pérdidas está en «(sin destino registrado)» y otro 9.2% en tres extensiones personales, mientras el grueso del tráfico —47,593 llamadas— se atiende al 96.0%. O sea que no hay un problema de personal ni de capacidad: hay números que ya no apuntan a ningún sitio. Es barato de arreglar y nadie lo ha mirado porque la cifra agregada no invitaba a mirar.\n\nLa tercera es que no sabíamos para qué nos usaba el cliente. La ficha decía «Farmacéutica» y «10 oficinas», y de ahí se seguía que atendíamos sus farmacias. El cruce de DIDs dice otra cosa: los números están etiquetados por aseguradora, laboratorio y hospital —AXA, AbbVie, Pint Farma, CIMESA— y trece de treinta son 800. Son líneas de programa de pacientes. Sin esa lectura, una llamada perdida parecía una venta perdida; con ella, es un paciente en tratamiento prolongado que no consiguió hablar con nadie. El dato estaba en nuestro propio export de DIDs desde siempre; lo que faltó fue que algo obligara a cruzarlo.\n\nLa cuarta la enseñó el día mismo en que se escribía esta auditoría, y es la que más dice sobre cómo trabajamos. Un cambio nuestro rompió una función que el cliente usa a diario, y nos enteramos porque lo reportó **alguien cuyo nombre no estaba en ninguna parte de nuestra ficha**. En 67 meses habíamos capturado dos contactos: quien firma —el director general— y a quien se le escribe cuando algo falla —un técnico de soporte—. A quien USA el servicio nunca lo capturamos, y resultó ser el único capaz de notar el problema en diez minutos y describirlo con precisión.\n\nNo es un descuido de esta cuenta: es un sesgo del procedimiento. Pedimos «el mapa de decisores» y eso trae a quien decide, no a quien opera. Y la alerta que debería avisarlo, `sin_contactos`, mide si la lista está vacía, no si tiene a la gente correcta — así que con dos contactos equivocados la cuenta sale en verde. Es el mismo defecto que la tasa de pérdida comparada contra la base propia: se mide la presencia, no la calidad.\n\nY la quinta es de ficha, menor pero ilustrativa: el campo `servicio` guardaba una nota de la fusión del 31 de agosto —«Subcuenta integrada: PROBEMEDIC · CID 68328»— en lugar del producto contratado, que sólo aparecía dentro de los registros de adopción. Un campo usado para otra cosa es un campo que deja de informar.',

  flujo_real: [
    { fase: 'El paciente marca',        area: 'Paciente en tratamiento', accion: 'Llama al 800 de su programa — AXA, AbbVie, Pint Farma, CIMESA', resultado: '92,572 llamadas entrantes en 8.5 meses' },
    { fase: 'Entra al número',          area: 'Callpicker',              accion: 'El DID recibe la llamada', resultado: '34 números, 13 de ellos 800 nacionales' },
    { fase: 'Debería enrutarse',        area: 'Callpicker / Probemedic', accion: 'La llamada se dirige al destino configurado', resultado: '23,881 caen en «(sin destino registrado)» — el 84.2% de todas las pérdidas' },
    { fase: '…o a una extensión muerta', area: 'Probemedic',             accion: 'Suena en una extensión personal', resultado: 'Marco Antonio Moreno Ibarra: 346 llamadas, 0 contestadas' },
    { fase: 'Si llega bien, se atiende', area: 'Probemedic',             accion: 'Un agente contesta', resultado: '47,593 llamadas con 2.4% de pérdida — el equipo funciona' },
    { fase: 'El tablero evalúa',        area: 'Dashboard',               accion: 'El panel de llamadas compara el mes contra la base propia', resultado: 'Lo pinta como mejora, y nadie lo ve: el motor de alertas no mira llamadas. Cero alertas.' },
    { fase: 'SAC trabaja la cuenta',    area: 'SAC',                     accion: 'Cinco seguimientos, llamadas y WhatsApp al titular', resultado: 'El cliente responde amablemente; la conversación de fondo nunca ocurre' },
    { fase: 'Nosotros cambiamos algo',  area: 'Callpicker',              accion: 'Hotfix sin sign off para acelerar búsquedas', resultado: 'Le rompe la búsqueda en call details y el export. Lo reporta él, el 13 oct.' },
  ],

  comparativo: [
    { metrica: 'Que NO llegan a una persona', real: '38.05% (35,224 de 92,572)', ideal: 'El 96.0% de atención que ya logra en el resto del tráfico' },
    { metrica: 'Alertas abiertas', real: 'CERO — el motor no evalúa atención telefónica', ideal: 'Que la atención telefónica tenga algún detector' },
    { metrica: 'Concentración de las pérdidas', real: '93.4% en cuatro destinos', ideal: 'Repartidas, o sea sin un cuello identificable' },
    { metrica: '«(sin destino registrado)»', real: '29,783 llamadas y sólo 46 a una persona · 0.2%', ideal: 'Que no exista: toda llamada con destino' },
    { metrica: 'Extensiones con CERO atención humana', real: 'DOS: Marco (346) y Azucena (351)', ideal: 'Retirar los números o reasignarlos' },
    { metrica: 'Salientes que no conectan', real: '32.75%', ideal: 'Ya está BIEN: lo normal son 43.6% según el propio archivo' },
    { metrica: 'Sábado', real: '36.7% de pérdida sobre 7,244 llamadas', ideal: 'Al nivel de entre semana: ~29%' },
    { metrica: 'Domingo', real: '1,095 llamadas, 36.5% perdidas, sin horario publicado', ideal: 'O se atiende, o se desvía con mensaje' },
    { metrica: 'Consumo de la bolsa de 50,000 min', real: 'CAYENDO: 40.05% → 37.27% → 35.70%', ideal: 'Entender la caída antes de ajustar el plan' },
    { metrica: 'Sucursales con número nuestro', real: '2 plazas de 6', ideal: 'Las 7 sucursales del localizador' },
    { metrica: 'Reuniones en 67 meses', real: 'NINGUNA', ideal: 'Trimestral: 22' },
    { metrica: 'Score relacional', real: '4 — el más bajo de las ocho auditorías', ideal: 'Por encima de 50' },
  ],

  plan_inmediato: [
    { accion: 'PREGUNTARLE A DANIEL OLIVARES QUIÉN MÁS USA LA PLATAFORMA. Apareció hoy reportando un fallo y no estaba en la ficha; sabía al detalle cómo la ocupan. Es la puerta directa al equipo que de verdad opera el servicio, y nunca hemos hablado con ellos', responsable: 'Fátima', criterio: 'Daniel capturado con cargo, correo y teléfono, y al menos un nombre más del equipo operativo' },
    { accion: 'RECONOCER EL INCIDENTE DE HOY antes de que escale: el hotfix sin sign off les rompió la búsqueda en call details y el export a correo. Es nuestro, es de hoy, y lo reportó el cliente', responsable: 'Producto / Fátima', criterio: 'Aviso enviado al cliente con qué cambió y qué se repone. Ticket #117503 cerrado con explicación.' },
    { accion: 'ARREGLAR «(sin destino registrado)»: 23,881 llamadas perdidas, el 84.2% de todas las de la cuenta, desde 2,251 números distintos y con cero minutos', responsable: 'Ingeniería', criterio: 'Toda llamada entrante con un destino asignado, y el bloque por debajo del 5% de pérdida' },
    { accion: 'Revisar las tres extensiones personales: Marco Antonio Moreno Ibarra y Azucena Garcia Segura no atendieron NI UNA de 346 y 351 llamadas, y Lezly Iohanna Carreón Loera sólo 89 de 2,142', responsable: 'Ingeniería / Fátima', criterio: 'Cada una reasignada, retirada o explicada' },
    { accion: '✓ HECHO el 13 oct 2026 — Corregido el importe ($15,696 → $21,626), capturados 11 contactos donde había 2 —incluido Daniel Olivares, que reportó el incidente y no estaba— y puesto el servicio real en su campo, que guardaba una nota de fusión', responsable: 'Fátima / Facturación', criterio: 'Aplicado y comprobado con `scripts/enriquece-probemedic.py`' },
    { accion: 'Llevar a facturación las tres líneas «Probemedic» sin CID del GRC —$8,314 al mes— para saber si son del mismo grupo. Una de ellas, «CANALES DIGITALES», lleva un mes facturando', responsable: 'Facturación', criterio: 'Las tres con CID asignado o descartadas por escrito' },
  ],

  plan_mediano: [
    { accion: 'Primera reunión en 67 meses, con el director general y con quien opere las líneas de programa', responsable: 'Fátima', criterio: 'Reunión registrada con minuta, y el Radar REVISADO — ya está 12 de 12, contestado el 25 sep 2026 en dos tomas; lo que falta no son respuestas, es que alguien las lea' },
    { accion: 'Atender el sábado y decidir qué hacer con el domingo: 36.7% y 36.5% de pérdida, con cinco horas publicadas el sábado y ninguna el domingo', responsable: 'Fátima / Probemedic', criterio: 'O se amplía la ventana, o las llamadas fuera de horario reciben un mensaje en vez de nada' },
    { accion: 'Publicar las salientes al derecho: hoy se publica «32.75% no conectaron», que suena mal y es BUENO — lo normal según el propio archivo es 43.6%. Decirlo como % que SÍ conectó evita que se lea como un problema', responsable: 'Producto', criterio: 'La ficha publica el porcentaje que conecta, con su referencia' },
    { accion: 'Cerrar el número de sucursales: la ficha decía 10, el localizador publica 7 y LinkedIn añade 4 direcciones más', responsable: 'Fátima', criterio: 'Una cifra con fuente, confirmada con el cliente' },
  ],

  plan_estrategico: [
    { accion: 'QUE LA ATENCIÓN TELEFÓNICA TENGA ALGÚN DETECTOR. Hoy no tiene ninguno: los 21 tipos del motor miran consumo, contacto, mesa y huecos de ficha, y las llamadas sólo se evalúan en el panel de la ficha, que nadie ve si no abre la cuenta. Esta cuenta lleva nueve meses al 38% sin llegar a una persona y jamás apareció en una lista', responsable: 'Producto / Dirección', criterio: 'Una cuenta cuya atención por persona cae por debajo de un umbral abre alerta, como ya hacen `uso_bajo` y `consumo_cero` con el consumo' },
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
      'Cuando la llamada llega a un destino que funciona, el 96.0% acaba hablando con una persona',
      '67 meses de relación y cero incidencias de pago · acumulado $1,012,485',
      'La mediana de resolución de tickets es de 1.70 horas, la mejor de las ocho auditorías',
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

  conclusion: 'PROBEMEDIC lleva nueve meses sin que cuatro de cada diez de sus llamadas lleguen a una persona —35,224 de 92,572, el 38.05%— y el tablero nunca dijo nada. El motivo es más simple de lo que esta auditoría creyó en su primera versión: **el motor de alertas no evalúa la atención telefónica**. Sus 21 tipos miran consumo, contacto, mesa de ayuda y huecos de ficha, y ninguno mira llamadas. La comparación contra la base propia existe, pero vive en el panel de la ficha, no en el motor — es una lectura de pantalla que sólo ve quien abre la cuenta. Ésa es la lección, y no es sobre esta cuenta: lo que se mide bien y se pinta bien, pero no tiene detector, no le llega a nadie.\n\nLa buena noticia es que el problema es barato. Cuando la llamada llega a un destino que funciona, el 96.0% acaba hablando con una persona — el equipo está y responde. El 93.4% de las pérdidas cabe en cuatro destinos: uno que no existe, por donde se van 23,881 llamadas, y tres extensiones personales, una de las cuales no ha contestado ni una sola de las 346 que recibió. Eso se arregla en días, no en trimestres, y nadie lo había mirado porque la cifra agregada no invitaba a mirar.\n\nLo que cambia la gravedad del asunto es para qué nos usa el cliente, y eso lo destapó cruzar nuestros propios DIDs con la investigación de dirección. Los 34 números no están puestos por sucursal: están puestos por aseguradora, laboratorio y hospital, y trece de treinta son 800. Son líneas de programa de pacientes de una empresa que distribuye medicamentos de alta especialidad para enfermedades crónicas y degenerativas. Las 35,224 llamadas que no llegaron a una persona no son ventas perdidas: son pacientes en tratamiento prolongado que no consiguieron hablar con nadie.\n\nY el mismo cruce deja servida la ampliación más concreta de toda la serie: tenemos números en Monterrey y CDMX, y ninguno en Guadalajara, Puebla, Tijuana ni León, que son cuatro de sus siete sucursales y publican teléfono propio.\n\nHoy, mientras se escribía esto, el cliente reportó que un cambio nuestro le rompió la búsqueda de llamadas. Interno: «no hubo sign off, fue un hotfix». Lo reportó alguien que ni siquiera estaba en nuestra ficha. Es un mal día para que eso pase, y es exactamente la razón para llamar mañana.',

  pierde: [
    'Callpicker pierde $21,626 al mes si la cuenta se va — y hasta $29,940 si las otras tres líneas del grupo resultan ser la misma empresa.',
    'Se pierde la relación con los dueños de los programas: AXA, AbbVie, Pint Farma, CIMESA y HOPE Medical Center miden esas líneas.',
    'Probemedic pierde contacto con pacientes en tratamiento prolongado — 35,224 llamadas sin llegar a una persona en nueve meses, y seguirá perdiéndolos mientras el enrutamiento siga igual.',
    'Se pierde una relación de 67 meses con pago impecable y más de un millón de pesos facturados.',
  ],

  gana: [
    'Arreglar cuatro destinos elimina el 93.4% de las pérdidas de la cuenta: el mejor retorno por esfuerzo de las ocho auditorías.',
    'Cuatro sucursales sin número nuestro, con teléfono propio publicado: la ampliación está identificada y es verificable.',
    'No tiene Chat, IA de Voz, IA de Chat ni API contratados, y usa el 39.2% de su bolsa: hay espacio por los dos lados.',
    'Un reporte por programa de pacientes es el entregable con el que el cliente defiende sus convenios, y hoy nadie se lo da.',
  ],

  recomendacion_central: 'MAÑANA, Y EMPEZANDO POR LO QUE ES NUESTRO. Hoy a las 10:50 el cliente reportó que un cambio en la plataforma le rompió la búsqueda en call details y el export de llamadas a correo, y el chat interno lo reconoce sin rodeos: «no hubo sign off, fue un hotfix». Reconocerlo nosotros, con qué cambió y qué se repone, antes de que vuelva como queja — porque este cliente ya ha usado tres veces la categoría «Queja o Sugerencia», que es el único de las ocho auditorías que lo ha hecho.\n\nDESPUÉS, EL ENRUTAMIENTO, QUE ES LO QUE DE VERDAD LE DUELE Y NO LO SABE. Pierde el 30.63% de sus llamadas desde enero y el 93.4% de esas pérdidas cabe en cuatro destinos: «(sin destino registrado)» con 23,881, y tres extensiones personales —una de las cuales, a nombre de Marco Antonio Moreno Ibarra, recibió 346 llamadas y no contestó ninguna—. Cuando la llamada llega a un destino que funciona, el 96.0% acaba hablando con una persona. No es un problema de equipo ni de capacidad: son números que ya no apuntan a ningún sitio, y se arreglan en días.\n\nY LA CONVERSACIÓN DE FONDO ES CON EL DIRECTOR GENERAL, NO CON EL TÉCNICO. Esta cuenta no opera conmutadores de farmacia: opera líneas de programa de pacientes de AXA, AbbVie, Pint Farma, CIMESA y HOPE Medical Center, con trece números 800. Lo que se pierde cuando una llamada no se contesta no es una venta: es un paciente en tratamiento prolongado. Enrique Castillo contestó por WhatsApp hace tres semanas y dijo que con gusto platicaba el lunes. Ese lunes no ha ocurrido, y van 67 meses sin una sola reunión.\n\nDE PASO, HAY UNA VENTA IDENTIFICADA Y VERIFICABLE: tenemos números en Monterrey y CDMX, y ninguno en Guadalajara, Puebla, Tijuana ni León, que son cuatro de sus siete sucursales oficiales y publican teléfono propio.\n\nY LO QUE NO ES DE ESTA CUENTA pero que esta cuenta demuestra: mientras el motor sólo compare a cada quien contra su propia base, una cuenta puede normalizar un 30% de pérdida y quedar en verde nueve meses seguidos. Hace falta un umbral absoluto.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 18 tickets de «Probemedic Distribuciones» (CID 112478) en lib/tickets-data.json',
    periodo: 'Abril 2026 – Octubre 2026 · la fuente trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí',
    diagnostico: 'A diferencia de OdontoPrev, aquí los tickets son de VOZ. El reparto completo, que cierra en 18: «Duda Operativa» 6, «Queja o Sugerencia» 3, APIs 2, Softphone 2, «Ajuste en Flujo» 1, «Falla Cliente» 1, «Falla SIP» 1, Login 1 y «Cliente Activo (chat)» 1. La mediana de resolución es de 1.70 horas —la mejor de las ocho auditorías— y sólo dos de los 18 son fallas. En resolución, la mesa atiende bien a este cliente.\n\nLo que no encaja es el contenido. Tres «Queja o Sugerencia» formales —es el ÚNICO cliente de las ocho auditorías que ha usado esa categoría, y la usó tres veces— y seis «Duda Operativa» sobre un servicio que lleva 67 meses contratado. Un cliente veterano que sigue preguntando cómo se opera, y que además se queja formalmente, está pidiendo algo que no es un ticket. Y el ticket #117503, abierto hoy por un cambio nuestro sin aviso, va a ser el cuarto.',
    metricas: [
      { metrica: 'Tickets totales',          valor: '18 (abr–oct 2026)',      lectura: 'Pico en septiembre con 7' },
      { metrica: 'De voz',                   valor: '17 de 18',               lectura: 'Al revés que OdontoPrev: aquí el canal problemático es la voz' },
      { metrica: 'Quejas formales',          valor: '3 · «Queja o Sugerencia»', lectura: 'Único cliente de las ocho auditorías que ha usado esa categoría' },
      { metrica: 'Dudas operativas',         valor: '6 · 33.3%',              lectura: 'En un cliente de 67 meses. Es una señal de capacitación, no de soporte.' },
      { metrica: 'Fallas del servicio',      valor: '2 · 11.1%',              lectura: 'Falla SIP y Falla Cliente, ambas en mayo' },
      { metrica: 'Mediana de resolución',    valor: '1.70 horas',             lectura: 'La MEJOR de las ocho auditorías. (La v1.0 publicó 2.2 h: con 18 valores la mediana es el promedio de los dos centrales.)' },
      { metrica: 'El más largo',             valor: '407 h · 17 días',        lectura: 'Tres tickets (16.7%) pasaron de siete días' },
    ],
    reincidencias: [
      { patron: 'Duda Operativa (voz)',      veces: '6 · 33.3%', causa: 'Un cliente de 67 meses que sigue preguntando cómo se opera el servicio. Es capacitación pendiente, no demanda de soporte.' },
      { patron: 'Queja o Sugerencia (voz)',  veces: '3 · 16.7%', causa: 'El único cliente de la serie que usa el canal formal de queja. Ninguna de las tres abrió una conversación de fondo.' },
      { patron: 'APIs (voz)',                veces: '2 · 11.1%', causa: 'Hay interés o necesidad de integración, y `tiene_integracion_api` está en falso.' },
      { patron: 'Softphone (voz)',           veces: '2 · 11.1%', causa: 'Operación con agentes en softphone: coherente con líneas de programa de pacientes.' },
    ],
    hallazgos: [
      'La mesa responde bien —1.70 horas de mediana— y aun así el cliente ha puesto tres quejas formales, las tres el mismo día. El problema no es el tiempo de respuesta: es que nada de lo que reporta cambia su situación de fondo.',
      'Seis dudas operativas en un cliente de 67 meses apuntan a capacitación, y esa es una conversación que nadie ha tenido en 67 meses sin reuniones.',
      'El ticket #117503, abierto hoy por un cambio nuestro sin sign off, llega al peor cliente posible para una sorpresa: uno que ya pierde el 30% de sus llamadas.',
    ],
  },
}
