import type { AuditoriaCase } from './types'

/**
 * TECH PEOPLE (C1 · CID 2094) — 9.6 años de cliente, y ni una conversación
 * registrada. (La v1.1 titulaba «y nadie ha hablado con él»: eso es más de lo
 * que la fuente sostiene — ver el punto 5 de las correcciones.)
 *
 * Auditoría del 12 oct 2026 · v1.1, v1.2 y v1.3, las tres del 13 oct.
 *
 * (El campo `version` se había quedado en '1.0' al publicar la v1.1. Con esta
 * ronda queda en '1.3'.)
 *
 * LA v1.0 DIJO QUE LA ATENCIÓN ERA «EXCELENTE EN EL AGREGADO —6.21% sin
 * contestar—». El 6.21% es correcto como tasa de PERDIDAS, pero no mide lo
 * que la frase daba a entender. `lib/llamadas-cuenta.ts` lo advierte: una
 * llamada que resolvió el menú o que cayó al buzón no cuenta como perdida,
 * y tampoco llegó a una persona. Medido con `redir`:
 *
 *     a una persona   51,529 de 116,054  =  44.40%
 *     al menú         56,011
 *     al buzón         1,302
 *     NUNCA a nadie   64,525           =  55.60%
 *
 * Más de la mitad del tráfico de esta cuenta no habla con nadie. Eso no
 * convierte el 6.21% en falso —no lo es— pero sí convierte en falsa la
 * lectura de que la atención es excelente. Lo que falla no está sólo
 * «debajo del promedio, tienda por tienda»: está en el agregado también.
 *
 * ── LO QUE LA v1.2 CORRIGE DE LA v1.1 ────────────────────────────────────
 *
 * Una verificación adversarial del 13 oct midió afirmación por afirmación
 * contra su fuente. Esto es lo que se cambió, y por qué:
 *
 * 1. EL PUESTO EN LA CARTERA. La v1.1 decía «la #2 de la cartera por MRR
 *    real, por encima de Sección Amarilla», y lo sostenía comparando el MRR
 *    del GRC de ESTA cuenta contra el `facturacion` de la ficha de las demás
 *    — dos cosas distintas. Con la regla institucional de dirección (13 oct
 *    2026: «lo que debes tomar como institucional financiero es el MRR de
 *    facturación Gross Revenue Facturación», implementada en
 *    `lib/facturacion-cuenta.ts` y medida por `scripts/mide-peso-cartera.py`):
 *      · C1 = $88,783.20 es el MRR institucional MÁS ALTO medido por CID en
 *        el GRC. Es cierto, y no lo decía ninguna versión. (La población que
 *        se ordena son 171 cuentas y no 203: lo corrige la v1.3.)
 *      · Sección Amarilla queda muy por debajo, pero no por lo que decía la
 *        v1.1: en el GRC se llama «ADSA» y factura $32,375, no los $84,254
 *        de su ficha, que son promedio de vida.
 *    Las dos frases van con su calificativo, porque son dos cosas distintas.
 *    La v1.2 añadió además «NO es la #1 de la cartera: GTC factura $272,436»,
 *    y eso es lo que desmonta la v1.3: el método del ranking, no el dato.
 *
 * 2. EL 93.8% «ATENDIDO» (ya corregido en la v1.1; se deja dicho). El 6.21%
 *    es la tasa de no contestadas y su complemento NO es atención por una
 *    persona: a una persona llegó el 44.40%.
 *
 * 3. LAS «CINCO TIENDAS» SON SIETE, Y 908 PERDIDAS, NO 744. La v1.1 enumeró
 *    los destinos de `app/cuentas/llamadas-data.ts`, que es un TOP-8 por
 *    perdidas ABSOLUTAS (`gen-llamadas-data.py`, `conNombre[:TOP_DESTINOS]`),
 *    no por tasa. `data/analisis-llamadas.json` —el mismo corte— publica
 *    catorce destinos con nombre y añade dos tiendas dentro de la misma
 *    banda: iShop Parque Tepeyac 47.64% (91 de 191) e iShop Las Américas
 *    Playa del Carmen 40.56% (73 de 180). Y siguen siendo un PISO: el cubo
 *    «otros destinos» agrupa 140 destinos más con 2,248 perdidas sin
 *    desglosar. La v1.1 nunca dijo que la lista estuviera truncada.
 *
 * 4. LA ÚLTIMA FALLA ES DEL 17 SEP, NO DEL 29. El ticket del 29 de
 *    septiembre es `Administrativo (chat)` / `Contratación (chat)` con
 *    es_falla «No». La última falla del CID 2094 se abrió el 17 y se cerró
 *    el 24 de septiembre. El 29 venía de la evidencia de
 *    `sac_fallas_recurrentes`, donde `ultima` es la apertura más reciente de
 *    TODOS los tickets de la cuenta y no de las fallas (lib/tickets-cuenta.ts).
 *
 * 5. LA ENUMERACIÓN DE LOS CINCO SEGUIMIENTOS NO CERRABA, y lo que dejaba
 *    fuera tumba media tesis. Los cinco son: 18 jul resumen para el área
 *    técnica · 06 ago aviso «COMPLETAR PERFIL» · 06 ago «Se agregan datos
 *    generales de la cuenta» · 22 ago análisis de uso · 08 OCT el hilo de
 *    Monse y Toño sobre el cobro de $2,046. Hay UN análisis, no dos. Y el
 *    del 8 de octubre registra un intercambio con el cliente —«Solo
 *    corroborar con ellos si se les puede enviar una segunda factura», «me
 *    dice que se la mandan a Sandra Sanchez»— y recoge un nombre del lado de
 *    la facturación que la v1.1 no tenía en ningún perfil. (Quién es ese
 *    nombre y con quién consta el intercambio lo acota la v1.3, punto 6.) «CERO contactos por un canal
 *    real» sigue siendo exacto como afirmación sobre `seguimientos.tipo`;
 *    «nadie ha hablado con ella» era un salto, y se retira.
 *
 * 6. LA ATRIBUCIÓN DE LO PERDIDO. «El 43.3% no se puede atribuir a ninguna
 *    tienda» sólo restaba el cubo de la columna que no vino. Sin atribuir a
 *    ningún destino son 3,341 (46.33%: 3,125 + 216 de «(sin destino
 *    registrado)»); atribuible a una tienda, COMO MÁXIMO, 3,603 (50.0%), y
 *    del desglose publicado sólo 1,355 (18.8%) resuelven a una tienda con
 *    nombre.
 *
 * 7. «FIN DE LLAMADA» NO REGISTRA 116 CONTESTADAS: registra 116 que cayeron
 *    al BUZÓN (`redir` 0, `ivr` 0, buzón 116), y por eso los minutos son
 *    cero en los dos lados. Su tasa, 174 de 290 = 60.0%, cae dentro de la
 *    banda de las siete tiendas.
 *
 * 8. NO ES LA RELACIÓN MÁS LARGA. 115 meses la ponen la #13 de la cartera
 *    VIVA por antigüedad: DOCE consecutivos activos o en riesgo la superan
 *    —F20 189 · Z23 162 · F11 157 · Z24 156 · F16 152 · C7 150 · C17 142 ·
 *    D5 132 · D56 127 · Z25 124 · D17 119 · D3 118—, y D3 Salud y Hogar la
 *    supera con 118 meses y $23,480 de MRR. La v1.2 decía «la #14, trece por
 *    encima» porque contaba a Z22 Grupo Garmo (155 meses), que está en
 *    `hibernacion`: fuera de la cartera viva, que es la población con la que
 *    este archivo mide TODAS sus cifras de dinero.
 *
 * 9. LOS $59,423 DE LA FICHA no son «una de las dos líneas». No coinciden
 *    con ninguna ($82,360.30 ni $6,422.90) ni con su suma: son
 *    `acumulado ÷ meses`, el PROMEDIO DE VIDA de la línea principal, y de un
 *    corte viejo — en el respaldo del 2 oct ese promedio ya era $59,973 y
 *    hoy es $60,168. La diferencia de $29,360.20 sí es correcta.
 *
 * 10. NO ES EL ÚNICO CONTACTO BIEN CAPTURADO, y no está bien capturado:
 *    `contacto_nombre` es «Camilo Eckardt      camilo@techpeople.mx» —con el
 *    correo pegado— y su cargo en `contactos_json` es «Director Gral.
 *    Cliente desde2017». Sección Amarilla, IMPAS, Probemedic y Odontoprev
 *    tienen contacto principal completo y MÁS de un interlocutor.
 *
 * 11. LAS VENTANAS NO COINCIDEN, y el archivo lo declara. Las 116,054
 *    entrantes cubren del 1 ene al 14 sep; las 121,485 salientes arrancan el
 *    9 abr. Puestas juntas sugerían que marca más de lo que recibe, que
 *    sobre la misma ventana no está establecido. Se publica además el 67.3%
 *    de salientes que conectó (39,775 no conectaron).
 *
 * 12. DOS ENTRADAS DE LA CRONOLOGÍA ERAN DE LA SUBCUENTA. Las actividades
 *    del 4 y del 5 de agosto llevan cid 32785, consecutivo Z33 y empresa
 *    «Tech People Soluciones». Las de C1 son tres: `tickets` el 17 jul,
 *    `analisis` el 23 jul —que quedó bloqueada— y `llamada` el 20 ago.
 *
 * ── LO QUE LA v1.3 CORRIGE DE LA v1.2 ────────────────────────────────────
 *
 * Una segunda verificación adversarial, también del 13 oct, volvió a medir
 * afirmación por afirmación. Esto es lo que cambia:
 *
 * 1. EL MÉTODO DEL RANKING — y es lo que tumba la tesis del puesto. La v1.2
 *    sostenía «la SEGUNDA de la cartera, sólo detrás de GTC» sumando a mano
 *    las 19 líneas sin CID de GTC ($272,436) y reconociendo a ADSA, pero sin
 *    barrer el resto del archivo con ese mismo método. Agrupadas las 3,608
 *    filas de `data/grc-zoho.json` con la regla institucional, HAY TRES
 *    LECTURAS Y LAS TRES SON CIERTAS:
 *      · por CID en el GRC          → Tech People $88,783.20 es la #1.
 *        Le siguen IMPAS Z63 $65,640, University 4 People D58 $54,060,
 *        Finsus Growth F1 $38,215 y ECODELI C2 $32,740.
 *      · sumando a mano los grupos  → las SIETE líneas «Finsus …» suman
 *        $278,154 y las 19 de GTC sumaban $272,436 en el corte del 2 oct.
 *        Las dos por encima de C1.
 *      · lo que publica el tablero  → GTC $316,541, Sección Amarilla
 *        $84,254, IMPAS $65,640 y C1 cuarta. Es promedio de vida, no MRR.
 *    Y UN DATO QUE NINGUNA VERSIÓN TENÍA: GTC suma $0 EN EL CORTE VIGENTE.
 *    Sus 19 líneas son 13 «Churn confirmado» con `mrrFin` 0 y `verificacion`
 *    `sin_verificar` —que la regla institucional NO rescata— y 6
 *    «Desactivado». Los $272,436 son su ÚLTIMO MRR institucional MEDIDO, el
 *    del corte del 2 de octubre, que es el `mrrIni` del vigente. Así hay que
 *    decirlo cada vez que se le compare con esta cuenta.
 *    El segundo GTC escondido va como PREGUNTA PARA DIRECCIÓN en los
 *    hallazgos, no como afirmación: la nota de `lib/grc-asesor-alias.ts` es
 *    del 22 sep 2026, dice «Finsus es Fátima» y menciona SÓLO «Growth» y
 *    «Cobranza»; las cuatro líneas grandes no estaban en esa confirmación.
 *
 * 2. LA RESERVA DE «20 CUENTAS VIVAS» ERA 22, Y SU MÁXIMO NO ERA $14,197.
 *    Medido sobre las 193 vivas: 171 cruzan con MRR institucional > 0
 *    ($1,758,279), 13 sólo traen el promedio de la ficha ($488,540, que no es
 *    MRR) y 9 no traen nada. Descontando a GTC quedan 12 de sólo-ficha con
 *    $171,999 — el mismo total que cita la cabecera de
 *    `lib/facturacion-cuenta.ts`—, y el mayor de ese cubo es Sección Amarilla
 *    con $84,254, no los $14,197 de F32 Grupo Petroil. Y el motivo que daba
 *    la v1.2 es falso para cuatro: C9 Neruc, C66 INBROTEK, Z25 99 minutos y
 *    Z23 ProHabitación SÍ tienen línea con CID; lo que pasa es que su MRR
 *    institucional computa 0. Cierra: 171 + 13 + 9 = 193.
 *
 * 3. EL «4.37% DE $2,030,715» NO SALÍA DE SUS PROPIAS PARTES. Ese denominador
 *    mezclaba los $1,758,279 del corte vigente con los $272,436 de GTC, que
 *    son la lectura del corte anterior, y dejaba fuera a ADSA, a Finsus y a
 *    Petroil medidos con el mismo método. Se publica el porcentaje LIMPIO:
 *    el 5.05% de los $1,758,279 de las 171 que cruzan por CID — y se dice que
 *    es un TECHO, porque al denominador le faltan las que facturan sin CID.
 *
 * 4. NO ES LA RED MÁS GRANDE DE LA CARTERA. Medido en `cuentas.num_oficinas`
 *    de la cartera viva: C17 Agua Inmaculada «más de 1,800 sucursales /
 *    franquicias + 8 CEDIS», F32 Grupo Petroil «300 puntos o sitios en 24
 *    Estados», F20 ETICKET «más de 100 puntos de venta». Tech People declara
 *    «más de 100 ubicaciones». Es la misma clase de superlativo que la v1.2
 *    corrigió en la antigüedad y no barrió aquí. Se retira también «el caso
 *    de uso más limpio de la cartera», que no tenía ninguna métrica detrás.
 *
 * 5. «ES LA PRIMERA VEZ QUE LE LLAMAMOS» SOBREVIVÍA EN LA RECOMENDACIÓN —el
 *    único campo que se le lee en voz alta al cliente— aunque la propia v1.2
 *    había retirado «nadie ha hablado con ella» por ser un salto. Queda «la
 *    primera llamada REGISTRADA», que es lo que sostiene la fuente.
 *
 * 6. SANDRA SÁNCHEZ Y EL TERCER NOMBRE. La nota del 8 oct dice, en boca de
 *    Monse y dirigido a Toño: «a quien» · «me dice que se la mandan a a
 *    Sandra Sanchez». El intercambio consta con un TERCERO SIN NOMBRE —«me
 *    dice»—, no con Sandra; nada la sitúa en Tech People y no está en
 *    `contactos_json`. Y no es el segundo nombre del expediente: el desglose
 *    por destino publica «Brenda Rizo Garrido» con 94 perdidas y 2,230 no
 *    perdidas, y nadie se ha preguntado quién es. Son tres nombres, no dos.
 *    Del mismo hilo: quién SOLICITA el cobro no lo establece la nota, y
 *    leída completa apunta al revés —abre Monse pidiéndole apoyo a Toño—.
 *    El cargo «Comercial» de Toño era una inferencia y se retira.
 *
 * 7. DE LOS 140 DESTINOS DEL CUBO, SÓLO 106 PERDIERON ALGUNA LLAMADA. Los
 *    otros 34 contestaron todo lo que les entró: `gen-llamadas-data.py` los
 *    separa en un cubo propio, «destinos sin ninguna perdida» (l 0, c 171),
 *    mientras el cubo de `gen-analisis-llamadas.py` los mete dentro porque su
 *    `conNombre` no filtra `l>0`. Cierra por los dos lados: 8 + 112 + 34 =
 *    14 + 140 = 154 destinos, y 2,766 − 518 = 2,248. El argumento de fondo
 *    —siete es un piso— se sostiene igual con 106.
 *
 * 8. LOS TICKETS SON 57, NO 31. La v1.2 sumaba las DOS líneas del CID 2094
 *    para el dinero y contaba UN solo CID para la mesa, sin declarar la
 *    asimetría. Tras la fusión del 31 ago la cuenta es una:
 *    `lib/tickets-data.json` trae 31 tickets del CID 2094 con 7 fallas y 26
 *    del CID 32785 «Tech People - Soluciones» con 5. Juntos, 12 de 57 =
 *    21.05%, y los cierres de la subcuenta se concentran en OCTUBRE (8), su
 *    mes más cargado. «La mesa casi no ve a esta cuenta» no se sostiene sobre
 *    57 tickets, y el «casi tres veces Torres Corzo» pasa a dos veces y
 *    media (17 de 203 = 8.37%). Los desgloses por subcategoría siguen siendo
 *    del CID 2094 y ahora lo dicen fila por fila.
 *
 * 9. TRES FECHAS Y UNA PERMANENCIA QUE NO SE PUEDEN SOSTENER:
 *      · la nota del área técnica es del 18 DE JULIO (`seguimientos` la sella
 *        el 2026-07-18T18:33Z = 12:33 en México); el 17 es la
 *        `fecha_programada` de la ACTIVIDAD `tickets`, cuyo `resultado`
 *        repite el mismo texto. La v1.2 ponía las dos fechas a la vez.
 *      · el «08 Ago» de la ficha NO se sabe de dónde sale: ningún seguimiento
 *        ni actividad lleva esa fecha y las cinco actividades tienen
 *        `completada_en` en null. «Viene de cerrar una actividad» era una
 *        invención sobre un hueco; la evidencia de la alerta sólo advierte
 *        que esa fecha «la escribe también el cierre de tareas internas».
 *      · «las siete tiendas llevan ahí todo el periodo medido» NO es medible:
 *        el desglose por destino no tiene dimensión mensual en ninguna de las
 *        dos fuentes, y las series por mes, día y hora son del total.
 *
 * Cifras verificadas una por una contra fuente:
 *   · llamadas → app/cuentas/llamadas-data.ts, CID 2094 (entrega «40+», corte
 *     14 sep 2026 · su mes cerrado es AGOSTO, no septiembre)
 *   · tickets  → lib/tickets-data.json, 57 filas: 31 del CID 2094 «Tech
 *     People» + 26 del CID 32785 «Tech People - Soluciones»
 *   · dinero   → data/grc-zoho.json, DOS líneas con consecutivo C1 — y las
 *     3,608 filas del archivo agrupadas por CID y por nombre para el ranking
 *   · alertas  → alertas_episodios, 4 abiertos
 *   · ficha    → tabla `cuentas`, registro completo
 */
export const TECH_PEOPLE: AuditoriaCase = {
  id: 'tech-people',
  asesor: 'Claudia',
  nombre: 'Tech People — Servicios y Reparaciones TP, S.A. de C.V.',
  sector: 'Reparación de dispositivos Apple — centros de servicio en tiendas iShop Mixup',
  fecha_periodo: 'Marzo 2017 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA — 115 meses facturados · $88,783.20 de MRR institucional (GRC): el más alto medido por CID, sobre las 171 cuentas vivas que cruzan con el archivo. El puesto en la cartera entera depende del camino por el que se mida — hay tres lecturas y las tres son ciertas',
  descripcion_contexto: '9.6 años de cliente · $88,783.20 al mes de MRR institucional en el GRC (la ficha dice $59,423, que es promedio de vida) · 116,054 entrantes del 1 ene al 14 sep 2026 y 121,485 salientes desde el 9 abr —ventanas distintas, no se comparan— · 6.21% sin contestar y 44.40% atendido por una persona · 57 tickets entre los dos CIDs de la cuenta · CERO contactos registrados por canal real en todo el historial',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.3',

  kpis: [
    { label: 'Llegan a una persona',      value: '44.40%',                   color: '#ef4444' },
    { label: 'Y SIETE tiendas pierden',    value: 'entre 38.7% y 64.2%',     color: '#ef4444' },
    { label: 'Contacto REGISTRADO en 9.6 años', value: 'CERO · 0 reuniones', color: '#ef4444' },
    { label: 'MRR institucional vs. ficha', value: '$88,783 vs $59,423',     color: '#f97316' },
    { label: 'Fallas del servicio',        value: '12 de 57 tickets · 21.05%', color: '#f59e0b' },
  ],

  resumen_ejecutivo: 'Tech People lleva 115 meses facturados —desde marzo de 2017— y con el MRR institucional del GRC, $88,783.20 al mes, es la cuenta de MAYOR facturación de las 171 cuentas vivas que cruzan por CID con el archivo: suman $1,758,279, así que ella sola pesa el 5.05% — y ese porcentaje es un TECHO, porque al denominador le faltan las que facturan sin CID. El puesto en la cartera entera no se puede dar sin decir por dónde se mide, y hay TRES lecturas ciertas: por CID en el GRC es la #1; sumando a mano los grupos que facturan sin CID hay al menos dos por encima —las siete líneas «Finsus …» suman $278,154 y las 19 de GTC sumaban $272,436 en el corte del 2 de octubre—; y por la columna que publica el tablero, que es promedio de vida y no MRR, figura cuarta. La v1.2 publicaba «la SEGUNDA de la cartera, el 4.37% de $2,030,715»: ese método sumaba a mano a GTC y a nadie más, y no se sostiene. Repara dispositivos Apple en más de cien centros de servicio dentro de tiendas iShop Mixup, y su conmutador es exactamente eso: el teléfono por el que un cliente pregunta si ya está su equipo.\n\nLo que no se le cae es el servicio, y hay que decirlo primero: 7,212 llamadas sin contestar de 116,054, un 6.21%, y el mes cerrado (agosto) en 6.10% contra una base propia de 6.24% — MEJOR que su propio promedio. No hay deterioro. Pero ese 6.21% mide perdidas, no atención: a una persona llegaron 51,529 llamadas, el 44.40%; el menú resolvió 56,011 (48.26%) y 1,302 murieron en un buzón (1.12%). Más de la mitad del tráfico de esta cuenta no habla con nadie.\n\nY el promedio esconde además tienda por tienda. Al abrir por destino, SIETE tiendas pierden entre el 38.7% y el 64.2% de lo que les entra: Tulum Hunab 64.2%, iShop Oceania 48.5%, iShop Parque Tepeyac 47.6%, iShop Monterrey Esfera 46.1%, iShop Santa Anita 43.3%, iShop Las Américas Playa del Carmen 40.6% e iShop San Nicolás de los Garza 38.7% — 908 llamadas perdidas entre las siete. Y siete es un PISO, no un techo: el desglose publicado llega a catorce destinos con nombre y manda otros 140 a un cubo de «otros destinos» con 2,248 perdidas que nadie ha abierto —de esos 140, los que perdieron alguna llamada son 106: los otros 34 contestaron todo lo que les entró—. En una red de más de cien sucursales, un 6% general convive con tiendas donde la mitad de los clientes no encuentra a nadie. Y el cliente no lo ve, porque nadie se lo ha enseñado nunca.\n\nY ahí está el verdadero hallazgo de esta auditoría. En nueve años y medio NO HAY UN SOLO CONTACTO REGISTRADO POR UN CANAL REAL: los cinco seguimientos son todos de tipo `nota` y las reuniones son cero. Con un matiz que la v1.1 se saltó y que importa: la nota del 8 de octubre —el hilo de Monse y Toño sobre el cobro de $2,046— SÍ documenta un intercambio con el cliente, y de ahí sale el nombre de Sandra Sánchez, que un tercero sin nombre da como destino de las facturas —la nota no dice su empresa ni su cargo—. Lo exacto, entonces, es que nadie ha REGISTRADO una conversación de relación con esta cuenta, no que nadie haya hablado nunca con ella. El motor de alertas lo marca CRÍTICO y tiene razón: es una cuenta de $88,783.20 al mes que paga puntualmente desde 2017 y con la que Callpicker nunca se ha sentado a hablar de su servicio.\n\nY una tercera cosa, que es de casa: la ficha dice que factura $59,423 y el MRR institucional del GRC son $88,783.20. La diferencia son $29,360.20 al mes, el 33%. Pero no es, como dijo la v1.1, que la columna recogiera una línea y dejara la otra: los $59,423 no coinciden con ninguna de las dos ($82,360.30 y $6,422.90) ni con su suma — son `acumulado ÷ meses`, el promedio de vida de la línea principal, y de un corte viejo. Ordenada por esa columna la cuenta figura CUARTA de la cartera, detrás de GTC ($316,541), Sección Amarilla ($84,254) e IMPAS ($65,640), que son tres promedios de vida; con el MRR institucional es la PRIMERA de las 171 que cruzan por CID. Son dos columnas distintas y ninguna de las dos, sola, fija un puesto en la cartera entera.',

  resultado_positivo: 'Es una relación de 115 meses facturados —y hay que decir el puesto bien: es la #13 de la cartera VIVA por antigüedad, no la más larga. La superan DOCE consecutivos activos o en riesgo, entre ellos F20 Eticket con 189 meses, F16 Grupo Frisa con 152, D5 Cargo Lift con 132 y D3 Salud y Hogar con 118 y $23,480 de MRR; un decimotercero, Z22 Grupo Garmo con 155, está en hibernación y queda fuera de la población con la que este archivo mide—. Lleva $6,919,304 acumulados en la línea principal y $915,880 más en la subcuenta, con cero incidencias de pago en todo ese tiempo.\n\nLa operación no se le cae. El 6.21% sin contestar es bajo para una red de más de cien puntos de servicio —aunque no diga nada de cuántas llamadas atendió una persona—, y los fines de semana —cuando las tiendas de centro comercial trabajan— pierde MENOS que entre semana: 5.0% el sábado y 4.3% el domingo contra 6.3%–6.9% de lunes a viernes. Eso es una operación que sabe dónde está su demanda.\n\nLa adopción está medida y es alta: Voz VyC en nivel ALTO y uso del panel administrador entre medio y alto. Tiene Callpicker Chat activo. Y hay un interlocutor de alto nivel identificado: Camilo Eckardt, Director General, con correo y teléfono. Dos avisos sobre eso, porque la v1.1 lo contó al revés: no es el contacto mejor capturado de las cuentas auditadas —Sección Amarilla, IMPAS, Probemedic y Odontoprev tienen el principal completo y MÁS de un interlocutor, mientras aquí hay exactamente uno— y su registro está sucio: `contacto_nombre` trae el correo pegado («Camilo Eckardt      camilo@techpeople.mx») y el cargo de `contactos_json` dice «Director Gral.    Cliente desde2017».\n\nEl 8 de octubre se facturó un upsell de $2,046 —3 usuarios, 3 números y un administrador adicional— que el GRC ya registra. La cuenta crece sola.',

  hallazgos: [
    'DINERO — La ficha dice $59,423 y el MRR institucional del GRC son $88,783.20, repartidos en DOS líneas con el mismo CID 2094: «Tech People» ($82,360.30) y «Tech People Soluciones» ($6,422.90). La diferencia es de $29,360.20 al mes, el 33%. Y los $59,423 no son ninguna de las dos líneas ni su suma: son `acumulado ÷ meses` —el promedio de vida— de un corte anterior; hoy ese mismo promedio da $60,168 y en el respaldo del 2 de octubre daba $59,973. Las alertas usan el MRR; la ficha y el ranking de cartera, el promedio viejo.',
    'DINERO — Con el MRR institucional, $88,783.20 es el importe MÁS ALTO medido por CID en el GRC. La población que se ordena son 171 cuentas y no 203: en `data/grc-zoho.json` hay 203 CIDs distintos, pero 32 computan $0 y 28 corresponden a cuentas canceladas o en hibernación. Sobre esas 171 —todas vivas, $1,758,279 entre todas— C1 pesa el 5.05%, y el porcentaje es un TECHO: al denominador le faltan los $488,540 de promedio de vida de 13 vivas y todas las líneas del GRC que facturan sin CID. EL PUESTO EN LA CARTERA DEPENDE DEL CAMINO, y hay tres lecturas ciertas: (1) por CID en el GRC, C1 es la #1 —le siguen IMPAS Z63 $65,640, University 4 People D58 $54,060, Finsus Growth F1 $38,215 y ECODELI C2 $32,740—; (2) sumando a mano los grupos que facturan sin CID, las siete líneas «Finsus …» suman $278,154 y las 19 de GTC sumaban $272,436 en el corte del 2 de octubre, las dos por encima de C1; (3) por la columna del tablero —promedio de vida, que no es MRR— figura CUARTA, detrás de GTC ($316,541), Sección Amarilla ($84,254) e IMPAS ($65,640). La v1.2 decía «la SEGUNDA, detrás de GTC» y sumaba a mano sólo a GTC: ése es el método que no se sostiene.',
    'DINERO — La reserva, dicha bien y cerrada. De las 193 cuentas vivas, 22 NO tienen MRR institucional: 13 sólo traen el promedio de la ficha —$488,540, que no es MRR— y 9 no traen nada. Descontando a GTC, que se suma a mano, quedan 12 de sólo-ficha con $171,999, el mismo total que cita la cabecera de `lib/facturacion-cuenta.ts`. El mayor de ese cubo es Sección Amarilla con $84,254; el siguiente, F32 Grupo Petroil con $14,197, que es lo que la v1.2 publicaba como máximo. Y el motivo no es siempre la falta de CID: C9 Neruc Sede Central, C66 INBROTEK, Z25 99 minutos y Z23 ProHabitación SÍ tienen línea con CID en el GRC, pero su MRR institucional computa 0. Cierra: 171 + 13 + 9 = 193.',
    'PREGUNTA PARA DIRECCIÓN — ¿«Finsus» es una cuenta o son siete? El GRC trae SIETE líneas con ese nombre y suman $278,154 de MRR institucional: Finsus Producto $121,500 · Finsus Crédito al Consumo $93,997 · Finsus Growth $38,215 · Finsus Cross Selling $17,335 (movimiento «Nuevo») · Finsus Cobranza $4,195 · Finsus Crédito $2,912 · Finsus PyME $0. Sólo UNA trae CID —Growth, cid 139590, que es F1— así que el tablero ve $38,215 y $239,939 al mes no cruzan. Aquí NO se afirma que Finsus sea una cuenta de $278,154: la nota de dirección en `lib/grc-asesor-alias.ts` es del 22 sep 2026, dice «Finsus es Fátima» y menciona SÓLO «Growth» y «Cobranza» — las cuatro líneas grandes no estaban en esa confirmación. Hace falta que dirección diga si son el mismo cliente, porque de eso depende cuál es la cuenta mayor de la cartera. Mismo caso medido: «Petroil …» son 25 líneas y $80,049, con una sola con CID ($4,978, de Z47); y «ADSA» —que es Sección Amarilla, F3— llega sin CID con $32,375.',
    'DINERO — GTC (D1) SUMA $0 EN EL CORTE VIGENTE, y hay que decirlo así cada vez que se le compare con esta cuenta. Sus 19 líneas son 13 «Churn confirmado» con `mrrFin` 0 y `verificacion` en `sin_verificar` —que la regla institucional NO rescata, porque sólo rescata las que dicen `sigue_viva`— y 6 «Desactivado». Los $272,436 son su ÚLTIMO MRR institucional MEDIDO: el del corte del 2 de octubre, que es el `mrrIni` del vigente. Los $316,541 que publica el tablero son otra cosa, el promedio de vida de su ficha.',
    'RELACIÓN — CERO contactos por un canal real en 9.6 años: los 5 seguimientos son todos de tipo `nota` y no hay ninguna llamada, correo, WhatsApp ni reunión registrada como tal. El motor lo marca `nunca_contactada` en severidad CRÍTICA, y como afirmación sobre `seguimientos.tipo` es exacta. Lo que NO se puede decir —y la v1.1 lo decía— es que nadie haya hablado con la cuenta: la nota del 8 de octubre transcribe un intercambio con el cliente sobre el cobro de $2,046 y de ahí sale el nombre de Sandra Sánchez, que un tercero sin nombre da como destino de las facturas. Falta el registro de la relación, no necesariamente el contacto.',
    'RELACIÓN — CERO reuniones en todo el historial. La nota del 22 de agosto dice que «una vez confirmado por el cliente el horario y la fecha disponibles, se realizará el contacto»: la llamada se preparó y no consta que ocurriera. La actividad de llamada del 20 de agosto quedó SIN completar.',
    'ATENCIÓN — EL 6.21% NO MIDE ATENCIÓN, MIDE PERDIDAS. Sólo 51,529 de las 116,054 llamadas llegan a una persona: el 44.40%. Las otras 64,525 las resolvió el menú (56,011) o murieron en un buzón (1,302). El peor caso es «(sin destino registrado)», con 25,022 llamadas, apenas 0.9% de perdidas —así que el indicador las da por atendidas— y CERO que lleguen a una persona.',
    'ATENCIÓN — Y el promedio esconde también tienda por tienda. 6.21% general, pero SIETE tiendas pierden entre el 38.7% y el 64.2%: Tulum Hunab 64.2% (97 de 151), iShop Oceania 48.5% (176 de 363), iShop Parque Tepeyac 47.6% (91 de 191), iShop Monterrey Esfera 46.1% (135 de 293), iShop Santa Anita 43.3% (103 de 238), iShop Las Américas Playa del Carmen 40.6% (73 de 180) e iShop San Nicolás de los Garza 38.7% (233 de 602). Son 908 perdidas entre las siete. La v1.1 dijo «cinco» porque leyó `app/cuentas/llamadas-data.ts`, que publica un TOP-8 de destinos por perdidas ABSOLUTAS y no por tasa; las dos que faltaban están en `data/analisis-llamadas.json`, el mismo corte.',
    'MEDICIÓN — LA LISTA DE DESTINOS ESTÁ TRUNCADA, Y SIETE ES UN PISO. El desglose publicado llega a catorce destinos con nombre y manda los otros 140 a un cubo de «otros destinos» con 2,248 perdidas, que nadie ha abierto. De esos 140, los que perdieron alguna llamada son 106: los otros 34 contestaron todo lo que les entró, y el otro generado del mismo corte los separa en un cubo propio —«destinos sin ninguna perdida», l 0 y c 171—. La v1.2 atribuía perdidas a los 140. Cierra por los dos lados: 8 con nombre + 112 + 34 = 14 con nombre + 140 = 154 destinos, y 2,766 − 518 = 2,248. Dentro del cubo puede haber más tiendas en la misma banda, así que «siete» es el mínimo demostrable y no el total. Para cerrarlo hay que pedir el desglose completo por destino.',
    'ATENCIÓN — El destino «Fin de llamada» registra 174 sin contestar y 116 que no se perdieron, pero ninguna de esas 116 la tomó una persona: `redir` 0, `ivr` 0, buzón 116. Son exactamente las 116 que cayeron al buzón de voz, y por eso los minutos son cero en los dos lados — la v1.1 las llamó «contestadas» y no lo son. Su tasa, 174 de 290 = 60.0%, cae dentro de la banda de las siete tiendas. El archivo dice qué pasó con esas llamadas, pero no qué ES ese destino: hay que preguntarlo antes de interpretarlo.',
    'MEDICIÓN — 3,125 de las 7,212 perdidas (el 43.3%) caen en «(destino no venía en el archivo)»: esas filas se exportaron SIN la columna de destino. No es que la llamada no llegara a ningún lado — es que no se puede saber a dónde fue. Y hay que sumarles otras 216 de «(sin destino registrado)»: SIN ATRIBUIR A NINGÚN DESTINO son 3,341, el 46.33%. Descontando además «Fin de llamada» (174) y «Brenda Rizo Garrido» (94), que no son tiendas, lo atribuible a una tienda es COMO MÁXIMO 3,603 — el 50.0%, no el 56.7% que decía la v1.1. Y del desglose publicado sólo 1,355 perdidas (18.8%) resuelven a una tienda con nombre; el resto vive en el cubo de «otros destinos».',
    'ATENCIÓN — Pierde MENOS el fin de semana: sábado 5.0% y domingo 4.3% sin contestar contra 6.3%–6.9% de lunes a viernes. Coherente con centros de servicio dentro de tiendas de centro comercial. No hay un día malo que explique nada: el problema es de tienda, no de día.',
    'SERVICIO — 12 de 57 tickets (21.05%) son FALLAS del servicio, dos veces y media la proporción de Torres Corzo (17 de 203, 8.37%). Los 57 son los DOS CIDs de la misma cuenta desde la fusión del 31 de agosto: 31 del CID 2094 con 7 fallas y 26 del CID 32785 «Tech People - Soluciones» con 5. La v1.2 publicaba «7 de 31 · 22.6%» porque sumaba las dos líneas del GRC para el dinero y contaba un solo CID para la mesa. La alerta `sac_fallas_recurrentes` se abrió el 12 de octubre y cuenta sólo el CID 2094: su evidencia dice «7 fallas … sobre 31 tickets». La última falla del CID 2094 se abrió el 17 de septiembre y se cerró el 24: `Falla (voz)` / `Falla SIP (voz)`. NO es del 29 de septiembre, como decía la v1.1: ese ticket es `Administrativo (chat)` / `Contratación (chat)` con es_falla «No». El 29 sale de la evidencia de la alerta, donde `ultima` es la apertura más reciente de TODOS los tickets de la cuenta y no de las fallas.',
    'SERVICIO — «Venta Equipo (voz)» es la subcategoría más frecuente del CID 2094: 9 de sus 31 tickets, el 29%. Una mesa de ayuda que atiende ventas de equipo es un canal comercial sin dueño comercial.',
    'SERVICIO — Por mes de CIERRE, que es lo que trae la fuente, el CID 2094 concentró 8 tickets en agosto con 3 fallas y 4 en septiembre con 2. La proporción de fallas sube en los dos últimos meses medidos: de 0 fallas en feb–abr a 5 fallas en ago–sep. Por mes de APERTURA el reparto cambia —junio tiene 2 fallas y julio ninguna—, así que la lectura es de cierres y se dice. La subcuenta CID 32785 tiene su propio reparto y su mes más cargado es OCTUBRE, con 8 cierres.',
    'MEDICIÓN — El CID 2094 tiene 0 de 5 meses con dato de consumo. La alerta `sin_consumo_medible` está en severidad CRÍTICA desde el 6 de octubre: de una cuenta de $88,783.20 al mes no se puede decir cuánto de su plan usa.',
    'RELACIÓN — 0 de 12 preguntas del Radar respondidas, en 9.6 años de relación.',
    'DATOS — El Health Score 51 está medido al 15%: actividad, adopción y pago traen 50, que es el marcador por omisión. Sólo el relacional (57) está calculado.',
    'COMERCIAL — El 8 de octubre se solicitó cobrar $2,046 + IVA por 3 usuarios, 3 números y un administrador adicional. El GRC lo registra como «Upsell temporal». Si esos usuarios son permanentes, el MRR debería subir de forma permanente y no clasificarse como temporal.',
    'ESTRUCTURA — La fusión del 31 de agosto integró la subcuenta «Tech People - Soluciones» (Z33, CID 32785) y eliminó el duplicado en `cuentas`. El GRC sigue facturando las dos líneas por separado, pero las dos llevan el CID 2094 y el MRR institucional las SUMA: por ese lado el dinero está entero, y la v1.1 se equivocó al decir que la columna «sólo recogió una». Lo que quedó atrás es `cuentas.facturacion`, que no recogió ni una ni la otra: guarda un promedio de vida de un corte anterior. Y las actividades de la subcuenta siguen colgadas de la cuenta de C1 con cid 32785 y consecutivo Z33.',
  ],

  cronologia: [
    { fecha: '01 Mar 2017', responsable: 'Callpicker',       evento: 'Alta de la cuenta. 115 meses facturados hasta hoy, $6,919,304 acumulados en la línea principal.', tipo: 'ok' },
    { fecha: 'Ene–Ago 2026', responsable: 'Operación TP',    evento: 'Perdidas estables entre 5.9% y 6.6% cada mes — pero la atención POR UNA PERSONA se mantiene plana en torno al 44% todo el periodo, de 43.1% en enero a 45.2% en agosto. Lo estable no es que se atienda bien: es que la mitad del tráfico nunca llega a nadie.', tipo: 'ok' },
    { fecha: '18 Jul 2026', responsable: 'Claudia',          evento: 'Resumen para el área técnica: «la operación del cliente se mantuvo estable; los tickets se distribuyen de forma equilibrada». La nota es del 18 —`seguimientos` la sella el 2026-07-18T18:33Z, que son las 12:33 en México—; el 17 de julio es la `fecha_programada` de la ACTIVIDAD `tickets` (vencimiento el 21), cuyo `resultado` repite el mismo texto. La v1.2 ponía la nota el 17 en esta línea y el 18 en el cuerpo, y se contradecía.', tipo: 'neutral' },
    { fecha: '23 Jul 2026', responsable: 'Claudia',          evento: 'Actividad de análisis programada. NO se completó.', tipo: 'problema' },
    { fecha: '04 Ago 2026', responsable: 'Claudia',          evento: 'Se completa el perfil de cliente — pero la actividad es de la SUBCUENTA: lleva cid 32785, consecutivo Z33 y empresa «Tech People Soluciones». Trabajo de ficha, no contacto con el cliente.', tipo: 'neutral' },
    { fecha: '05 Ago 2026', responsable: 'Claudia',          evento: 'Análisis cerrado: «no se identificaron incumplimientos recurrentes de los SLA». También es de la SUBCUENTA (cid 32785, Z33). Las actividades de C1 son tres: `tickets` el 17 jul, `analisis` el 23 jul —que quedó bloqueada— y `llamada` el 20 ago.', tipo: 'neutral' },
    { fecha: '06 Ago 2026', responsable: 'Sistema',          evento: 'Aviso automático: el perfil de Tech People Soluciones tiene 10 campos incompletos, 4 de ellos CRÍTICOS para análisis de riesgo.', tipo: 'problema' },
    { fecha: '08 Ago 2026', responsable: '—',                evento: 'Último contacto que registra la ficha —`cuentas.ultimo_contacto` = 2026-08-08— y el motor no reconoce ninguno por canal real. DE DÓNDE SALE ESA FECHA NO SE SABE: ningún seguimiento ni actividad la lleva (seguimientos 18 jul, 06 ago ×2, 22 ago y 08 oct; actividades 17 jul, 23 jul, 04 ago, 05 ago y 20 ago) y las cinco actividades tienen `completada_en` en null, así que no hay cierre de tarea del que pudiera salir. La v1.2 afirmaba «la fecha viene de cerrar una actividad»: la evidencia de la alerta sólo advierte que esa fecha «la escribe también el cierre de tareas internas», que es una cautela y no una atribución.', tipo: 'problema' },
    { fecha: '20 Ago 2026', responsable: 'Claudia',          evento: 'Actividad de LLAMADA programada. NO se completó.', tipo: 'problema' },
    { fecha: '22 Ago 2026', responsable: 'Claudia',          evento: 'Se prepara el análisis de uso «como preparación previa a la llamada con el cliente». La llamada no consta.', tipo: 'problema' },
    { fecha: '31 Ago 2026', responsable: 'Dirección',        evento: 'FUSIÓN: la subcuenta «Tech People - Soluciones» (Z33, CID 32785) se integra a C1 y se elimina el duplicado. La columna `facturacion` de la ficha no se actualizó: sigue en $59,423, que es un promedio de vida viejo y no el MRR de ninguna de las dos líneas.', tipo: 'pivote' },
    { fecha: '14 Sep 2026', responsable: 'Callpicker',       evento: 'Corte del archivo de llamadas de esta cuenta. Su lectura llega hasta aquí; su mes cerrado es AGOSTO.', tipo: 'neutral' },
    { fecha: '17–24 Sep 2026', responsable: 'Mesa de ayuda', evento: 'ÚLTIMA FALLA del CID 2094: `Falla (voz)` / `Falla SIP (voz)`, abierta el 17 y cerrada el 24. Son 5 fallas de ese CID cerradas en agosto y septiembre contra 0 entre febrero y abril. El ticket del 29 de septiembre NO es una falla: es `Contratación (chat)`.', tipo: 'problema' },
    { fecha: '06 Oct 2026', responsable: 'Motor de alertas', evento: 'Se abren dos alertas CRÍTICAS: nunca contactada y sin consumo medible. Más `sin_radar` en alta.', tipo: 'problema' },
    { fecha: '08 Oct 2026', responsable: 'Monse / Toño del Río', evento: 'Monse le pide apoyo a Toño del Río para cobrar $2,046 + IVA: 3 usuarios, 3 números y 1 administrador adicional —«Toño solicitando tu apoyo para realizar un cobro al cliente TechPeople por…»—, y Toño es quien emite y manda la factura. El GRC lo registra como «Upsell temporal». El hilo documenta además un intercambio CON el cliente —si acepta una segunda factura en octubre— y recoge el nombre de Sandra Sánchez como destino de las facturas, dicho por un tercero sin nombre («me dice que se la mandan a a Sandra Sanchez») y sin que la nota la sitúe en Tech People: es el único rastro de la voz del cliente en todo el expediente.', tipo: 'ok' },
    { fecha: '12 Oct 2026', responsable: 'Motor de alertas', evento: 'Se abre `sac_fallas_recurrentes` en alta. Su evidencia dice «7 fallas … sobre 31 tickets»: cuenta sólo el CID 2094. Sumando la subcuenta fusionada son 12 fallas de 57 tickets.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'Servicios y Reparaciones TP, S.A. de C.V.' },
    { label: 'Giro',                value: 'Reparación de dispositivos Apple' },
    { label: 'Red',                 value: 'Más de 100 centros de servicio dentro de tiendas iShop Mixup, en todo México' },
    { label: 'Sede',                value: 'Lago Zúrich, Ciudad de México, C.P. 11529' },
    { label: 'Tamaño',              value: 'Mediana — 201 a 500 empleados' },
    { label: 'Sitio',               value: 'techpeople.mx' },
    { label: 'Contacto principal',  value: 'Camilo Eckardt — Director General · camilo@techpeople.mx · 55 3145 4893 · ES EL ÚNICO, y la captura está sucia: el nombre arrastra el correo y el cargo arrastra «Cliente desde2017»' },
    { label: 'Cliente desde',       value: '1 de marzo de 2017 — 115 meses facturados · la #13 de la cartera VIVA por antigüedad, con doce consecutivos por encima' },
    { label: 'Servicio contratado', value: 'Visibilidad y Control — usuario ilimitado SIP + extensión VyC con SIM' },
    { label: 'Subcuenta',           value: '«Tech People - Soluciones» (ex Z33, CID 32785), fusionada el 31 ago 2026 · sigue facturando aparte en el GRC' },
    { label: 'MRR institucional',   value: '$88,783.20 — $82,360.30 + $6,422.90, las dos líneas del CID 2094 · el más alto medido por CID, sobre las 171 cuentas vivas que cruzan y suman $1,758,279: el 5.05%, y es un techo. El puesto en la cartera entera tiene TRES lecturas: ver los hallazgos de DINERO' },
    { label: 'MRR en la ficha',     value: '$59,423 — NO es MRR: es `acumulado ÷ meses`, el promedio de vida de la línea principal, y de un corte viejo. Queda $29,360.20 por debajo del MRR' },
    { label: 'Acumulado histórico', value: '$6,919,304.35 la línea principal · $915,880.70 la subcuenta' },
    { label: 'Salud de pago',       value: 'Al corriente · 0 incidencias en 115 meses' },
    { label: 'Health Score',        value: '51 · relacional 57 · los otros tres bloques sin medir (50 por omisión)' },
  ],

  necesidad_negocio: 'Tech People repara equipos Apple en más de cien mostradores dentro de tiendas iShop Mixup. Su teléfono sirve para una sola cosa: que un cliente pregunte si ya está listo su equipo, cuánto cuesta una reparación o si la tienda tiene la pieza. Es una operación de alto volumen y baja complejidad por llamada — 116,054 entrantes del 1 de enero al 14 de septiembre de 2026, ocho meses y medio, repartidas entre cien puntos. Sus 121,485 salientes NO son comparables con ésas y el archivo lo declara: arrancan el 9 de abril, cinco meses y una semana, y de ellas conectó el 67.3% (39,775 no conectaron). Poner las dos cifras una al lado de la otra sugiere que marca más de lo que recibe, y sobre la misma ventana eso no está establecido.\n\nSu contrato es de Visibilidad y Control con SIM: cada mostrador es una extensión. Eso significa que lo que le importa no es el agregado nacional, que no se le cae, sino poder ver QUÉ TIENDA no contesta. Hoy no tiene esa vista, y Callpicker tampoco se la ha dado.\n\nLa necesidad real, entonces, es de visibilidad por sucursal — exactamente el producto que compró, aplicado a su propia operación. Y en segundo lugar, de una relación: una cuenta de 9.6 años que nunca ha tenido una reunión no tiene a nadie que la defienda el día que alguien compare precios.',

  potencial_corto: [
    'Enseñarle el desglose por tienda. SIETE sucursales pierden entre el 38.7% y el 64.2% —908 llamadas— y es su propio dato, que no ha visto nunca.',
    'Averiguar qué es el destino «Fin de llamada»: 290 llamadas, 174 sin contestar y 116 al buzón, cero minutos en los dos lados.',
    'Pedir el export de llamadas CON la columna de destino y con el desglose completo: hoy 3,341 perdidas (46.3%) no se atribuyen a ningún destino y otras 2,248 se quedan en el cubo de «otros destinos».',
    'Cerrar la clasificación del upsell de $2,046: si los 3 usuarios son permanentes, no es «temporal».',
  ],

  potencial_largo: [
    'IA de Voz: no la tiene contratada y su patrón —alto volumen, preguntas repetitivas sobre el estado de una reparación— es el caso de uso directo.',
    'Integración API con su sistema de órdenes de servicio: que la llamada sepa en qué va el equipo sin que nadie lo busque.',
    'Panel por sucursal como producto: tiene +100 puntos y compró Visibilidad y Control. Es el cliente natural de esa vista.',
    'Pago automático: 115 meses sin una sola incidencia y sin domiciliación.',
  ],

  tacticas: [
    { nombre: 'Abrir con lo bueno, y es cierto', descripcion: 'Su 6.21% sin contestar es bajo para una red de cien puntos y el fin de semana pierde menos que entre semana. Empezar por ahí no es cortesía: es el dato. Sin convertirlo en «atiende el 93.8%», que es lo que decía la v1.1 y no es cierto.', impacto: 'Gana el derecho a enseñar las SIETE tiendas que fallan sin que suene a reclamo.' },
    { nombre: 'Bajar del promedio a la tienda', descripcion: 'Pasar del 6.21% nacional a «Tulum Hunab pierde el 64.2% de lo que le entra». El promedio es de Callpicker; la tienda es del cliente.', impacto: 'Convierte un reporte en una lista de acciones con nombre y dirección.' },
    { nombre: 'Nombrar los nueve años sin reunión', descripcion: 'Decirlo de frente: llevamos 115 meses facturando y nunca nos hemos sentado. Proponer la primera.', impacto: 'Es la única forma de abrir la relación sin inventar un pretexto comercial.' },
    { nombre: 'Llevar corregido el importe', descripcion: 'Antes de la llamada, cuadrar los $88,783 del GRC con la ficha. Hablar de una cuenta de $59,423 con quien paga $88,783 descalifica todo lo demás.', impacto: 'Evita el único error que el cliente detecta en el primer minuto.' },
  ],

  senal_alarma: 'Nueve años y medio, $88,783.20 al mes de MRR institucional, cero reuniones, cero contactos REGISTRADOS por un canal real y cero de doce del Radar. Lo único que consta de boca del cliente es un recado de facturación del 8 de octubre. Nadie en Callpicker puede decir qué piensa este cliente de su servicio. Si aparece un competidor con una propuesta por escrito, nadie se entera hasta que llegue la baja.',

  problema_raiz: 'La cuenta nunca dio problemas, y por eso nunca se le habló de su servicio. Nueve años de silencio cómodo.',

  problema_raiz_detalle: 'Tech People paga puntualmente desde 2017, no escala conflictos y su operación telefónica no se cae. Ese perfil produce exactamente el resultado que tiene: una cuenta que nunca llega a la cola de trabajo porque nunca enciende una alarma de las clásicas.\n\nLo que sí se hizo fue trabajo de escritorio. Los cinco seguimientos registrados son notas, y son éstos, los cinco —la v1.1 enumeró otros y la enumeración no cerraba—: el resumen para el área técnica del 18 de julio, el aviso automático «COMPLETAR PERFIL» del 6 de agosto, el «Se agregan datos generales de la cuenta» del mismo 6 de agosto, el análisis de uso del 22 de agosto (UNO, no dos) y el hilo del 8 de octubre sobre el cobro de $2,046. Y justo el que faltaba es el que contradice la tesis: ahí hay un intercambio con el cliente, y de ahí sale Sandra Sánchez. El 22 de agosto se escribió que «una vez confirmado por el cliente el horario y la fecha disponibles, se realizará el contacto» — y la actividad de llamada del 20 de agosto figura sin completar. Se preparó la conversación y no se tuvo.\n\nEl segundo nivel es que lo que el cliente compró —Visibilidad y Control— es justo lo que Callpicker no le está dando sobre sí mismo. Tiene más de cien mostradores y el único número que existe es el nacional. Las siete tiendas que pierden entre el 38.7% y el 64.2% de sus llamadas no las ha mirado nadie por separado, de ninguno de los dos lados — y el desglose publicado deja otros 140 destinos sin abrir, así que pueden ser más. CUÁNTO TIEMPO LLEVAN ASÍ NO ES MEDIBLE con lo que hay: el desglose por destino no tiene dimensión mensual en ninguna de las dos fuentes (sus campos son d, l, c, min, n, redir, ivr y buzon) y las series por mes, por día y por hora son del total de la cuenta. La v1.2 decía «llevan ahí todo el periodo medido» y eso no se puede afirmar ni negar.\n\nEl tercero es de datos propios. La fusión del 31 de agosto integró la subcuenta en la ficha, pero la columna `facturacion` se quedó con un promedio de vida viejo, así que la cuenta figura un 33% más pequeña de lo que factura y se ordena mal en cualquier lista por esa columna. Y su consumo no es medible: cero de cinco meses con dato. De la cuenta de mayor MRR institucional de las 171 que cruzan por CID no se puede decir cuánto de su plan usa.',

  flujo_real: [
    { fase: 'Entra la llamada',      area: 'Cliente final',        accion: 'Pregunta por su equipo, un precio o una pieza', resultado: '116,054 entrantes de ene a 14 sep 2026' },
    { fase: 'Enrutamiento',          area: 'Plataforma Callpicker', accion: 'Se dirige a la extensión del mostrador', resultado: '3,341 perdidas (46.3%) sin atribuir a ningún destino: 3,125 sin la columna en el archivo y 216 «(sin destino registrado)»' },
    { fase: 'Atiende la tienda',     area: 'Mostrador iShop',      accion: 'Un técnico toma la llamada', resultado: 'A una persona llega el 44.40% nacional — y en Tulum Hunab el 29.8% (45 de 151) y en Oceania el 44.4% (161 de 363)' },
    { fase: 'No contesta',           area: '—',                    accion: 'El cliente cuelga', resultado: 'Sin integración con su sistema de órdenes: no queda rastro de quién llamó' },
    { fase: 'TP pide algo',          area: 'Mesa de ayuda',        accion: 'Abre ticket', resultado: '57 tickets entre los dos CIDs · de los 31 del CID 2094, 9 (29%) de «Venta Equipo (voz)»' },
    { fase: 'Callpicker revisa',     area: 'SAC',                  accion: 'Escribe un análisis o un resumen técnico', resultado: '5 notas internas · 0 llamadas y 0 reuniones REGISTRADAS en 9.6 años · el único rastro del cliente es un recado de facturación' },
  ],

  comparativo: [
    { metrica: 'Sin contestar · nacional',          real: '6.21% (7,212 de 116,054)', ideal: 'No se le cae — su base propia es 6.24%' },
    { metrica: 'Atendido por una PERSONA',          real: '44.40% (51,529 de 116,054)', ideal: 'El menú resolvió el 48.26% y el 1.12% murió en un buzón' },
    { metrica: 'Sin contestar · Tulum Hunab',       real: '64.2% (97 de 151)',        ideal: 'Al nivel de su propia red: 6.2%' },
    { metrica: 'Sin contestar · iShop Oceania',     real: '48.5% (176 de 363)',       ideal: '6.2%' },
    { metrica: 'Contactos REGISTRADOS por canal real', real: '0 en 9.6 años',         ideal: 'Mínimo trimestral: 38' },
    { metrica: 'Reuniones en 9.6 años',             real: '0',                        ideal: 'Mínimo anual: 9' },
    { metrica: 'Radar de 12 preguntas',             real: '0 respondidas',            ideal: '12 de 12' },
    { metrica: 'Ficha vs. MRR institucional',       real: '$59,423 contra $88,783.20', ideal: 'La misma cifra en los dos sitios' },
    { metrica: 'Meses con dato de consumo',         real: '0 de 5',                   ideal: '5 de 5' },
    { metrica: 'Fallas sobre tickets',              real: '21.05% (12 de 57, los dos CIDs)', ideal: '<10% — Torres Corzo está en 8.37% (17 de 203)' },
    { metrica: 'Perdidas atribuibles a una tienda', real: 'como máximo 50.0% (3,603 de 7,212) · con nombre de tienda, 18.8% (1,355)', ideal: '100% — pedir el export con destino y sin truncar' },
  ],

  plan_inmediato: [
    { accion: 'Corregir el importe de la cuenta: la ficha dice $59,423 —promedio de vida de un corte viejo— y el MRR institucional del GRC son $88,783.20 en dos líneas con CID 2094', responsable: 'Dirección / Facturación', criterio: 'La columna `facturacion` cuadra con el MRR institucional, y todo ranking de cartera deja dicho por qué camino se mide' },
    { accion: 'Llamar a Camilo Eckardt. Es la PRIMERA llamada REGISTRADA en 9.6 años y así se plantea', responsable: 'Claudia', criterio: 'Contacto registrado por canal real; la alerta `nunca_contactada` se apaga' },
    { accion: 'Llevar a esa llamada el desglose por tienda, con las SIETE que pierden más del 38%', responsable: 'Claudia', criterio: 'El cliente recibe la lista con nombre de sucursal y porcentaje, y se le dice que el desglose llega a catorce destinos y deja 140 sin abrir, 106 de ellos con alguna perdida' },
    { accion: 'Preguntar qué es el destino «Fin de llamada»: 290 llamadas, 174 sin contestar y 116 al buzón, cero minutos en los dos lados', responsable: 'Claudia', criterio: 'Respuesta del cliente registrada; se descarta o se confirma que sea un problema de configuración' },
    { accion: 'Pedir el export de llamadas CON la columna `destination_data_1` y el desglose completo por destino: hoy el 46.3% de lo perdido no se atribuye a ningún destino y 2,248 perdidas se quedan en un cubo', responsable: 'Claudia', criterio: 'Siguiente entrega con destino en todas las filas y sin cubo de «otros»' },
  ],

  plan_mediano: [
    { accion: 'Contestar las 12 preguntas del Radar en la misma visita', responsable: 'Claudia', criterio: '12 de 12 en la ficha' },
    { accion: 'Resolver por qué el CID 2094 no tiene dato de consumo en ninguno de los últimos 5 cortes', responsable: 'Facturación', criterio: 'La cuenta aparece con su % de plan en el siguiente Informe de Cortes' },
    { accion: 'Clasificar correctamente el upsell de $2,046: si los 3 usuarios son permanentes no es «temporal»', responsable: 'Facturación', criterio: 'El GRC refleja el movimiento con su naturaleza real' },
    { accion: 'Revisar las 12 fallas de servicio de los DOS CIDs: de las 7 del CID 2094, 5 cerraron en agosto y septiembre contra 0 entre febrero y abril, y la última se abrió el 17 de septiembre; las 5 del CID 32785 no se habían contado', responsable: 'Mesa de ayuda', criterio: 'Se identifica si hay una causa común o son independientes' },
  ],

  plan_estrategico: [
    { accion: 'Panel de desempeño por sucursal — es el producto que ya compró, aplicado a sus +100 puntos', responsable: 'Producto / Claudia', criterio: 'El cliente recibe un reporte mensual por tienda' },
    { accion: 'Proponer IA de Voz para el alto volumen de consultas repetitivas de estado de reparación', responsable: 'Claudia', criterio: 'Propuesta presentada con el cálculo sobre sus 116,054 entrantes' },
    { accion: 'Integración con su sistema de órdenes de servicio', responsable: 'Ingeniería / Claudia', criterio: 'Propuesta técnica y costo entregados' },
    { accion: 'Gobernanza: reunión semestral fija. Nunca ha habido una', responsable: 'Claudia / Dirección', criterio: 'Primera reunión agendada con fecha y asistentes' },
  ],

  areas_oportunidad: [
    { area: 'Las SIETE tiendas que pierden más del 38%', impacto: '908 llamadas perdidas en siete sucursales de más de cien — y 140 destinos sin abrir, 106 de ellos con alguna perdida', responsable: 'Claudia + TP' },
    { area: 'Visibilidad por sucursal',                  impacto: 'Es el producto contratado, sin aplicar a su propia red', responsable: 'Producto' },
    { area: 'IA de Voz',                                 impacto: '116,054 entrantes de consulta repetitiva, sin automatizar', responsable: 'Claudia' },
    { area: 'El 46.3% de perdidas sin destino',          impacto: '3,341 llamadas sin atribuir a ningún destino: 3,125 sin la columna y 216 «(sin destino registrado)»', responsable: 'Claudia' },
    { area: 'Corrección del MRR',                        impacto: '$29,360.20 al mes mal reflejados en la ficha y en el ranking', responsable: 'Facturación' },
    { area: 'Pago automático',                           impacto: '115 meses sin incidencias y sin domiciliación', responsable: 'Administración' },
  ],

  perfiles: [
    {
      nombre: 'Camilo Eckardt', rol: 'Director General — Tech People', color: '#22c55e',
      campos: [
        { label: 'Correo',   value: 'camilo@techpeople.mx' },
        { label: 'Teléfono', value: '55 3145 4893' },
        { label: 'Estado',   value: 'ÚNICO contacto de la cuenta — y NO está bien capturado: `contacto_nombre` trae el correo pegado («Camilo Eckardt      camilo@techpeople.mx») y el cargo de `contactos_json` dice «Director Gral.    Cliente desde2017». Sección Amarilla, IMPAS, Probemedic y Odontoprev tienen el principal completo y MÁS de un interlocutor' },
        { label: 'Riesgo',   value: 'Es el Director General: el interlocutor correcto para abrir, pero no para resolver una tienda concreta. Falta el responsable de operación de la red.' },
      ],
    },
    {
      nombre: 'Sandra Sánchez', rol: 'Nombre al que se le envían las facturas · su empresa no consta', color: '#94a3b8',
      campos: [
        { label: 'De dónde sale', value: 'La nota del 8 oct 2026, en boca de Monse y dirigido a Toño: «a quien» · «me dice que se la mandan a a Sandra Sanchez». El intercambio consta con un TERCERO SIN NOMBRE —«me dice»—, no con Sandra, y nada en la nota la sitúa en Tech People. La v1.2 la daba por «la única persona de Tech People con la que consta un intercambio»: es el mismo salto inferencial que esa misma versión acababa de retirar.' },
        { label: 'Lo que no se sabe', value: 'Ni empresa, ni cargo, ni correo, ni teléfono, y no está en `contactos_json`. Hay que preguntar quién es antes de la primera llamada. Y no es el segundo nombre del expediente: el desglose por destino publica «Brenda Rizo Garrido» dentro del conmutador del cliente, con 94 perdidas y 2,230 no perdidas, y nadie se ha preguntado nunca quién es. Con ella son TRES nombres, no dos.' },
      ],
    },
    {
      nombre: 'Claudia', rol: 'Asesora SAC de la cuenta — Callpicker', color: '#6366f1',
      campos: [
        { label: 'Actividades',    value: '5 colgadas de esta cuenta, pero sólo 3 son de C1 —`tickets` el 17 jul, `analisis` el 23 jul (quedó bloqueada) y `llamada` el 20 ago—; las del 4 y 5 de agosto llevan cid 32785 / Z33 / «Tech People Soluciones». La de LLAMADA del 20 ago quedó sin completar' },
        { label: 'Seguimientos',   value: '5, todos de tipo `nota`. Ninguno está REGISTRADO como contacto — pero el del 8 de octubre transcribe un intercambio con el cliente, así que «ninguno es un contacto» vale para el tipo, no para el contenido' },
        { label: 'Último análisis', value: 'La actividad de `analisis` del 5 ago 2026 —«no se identificaron incumplimientos recurrentes de los SLA»— es de la SUBCUENTA Z33. El último análisis de C1 es el de uso del 22 de agosto, registrado como nota' },
      ],
    },
    {
      nombre: 'Toño del Río', rol: 'Callpicker — la nota no dice su área', color: '#f59e0b',
      campos: [
        { label: 'Intervención', value: '8 oct 2026 — el hilo del cobro de $2,046 + IVA por 3 usuarios, 3 números y 1 admin adicional. Quién lo SOLICITA no lo establece la nota, y leída completa apunta al revés de como lo publicó la v1.2: abre Monse —«Toño solicitando tu apoyo para realizar un cobro al cliente TechPeople por…»— y Toño es quien emite y manda la factura («ya se mandó la factura de octubre», «de acuerdo, se la mando»). El cargo «Comercial» no aparece en ningún sitio: era una inferencia y se retira' },
        { label: 'Resultado',    value: 'El GRC lo registra como «Upsell temporal»: $80,314.30 → $82,360.30' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '115 meses facturados desde marzo de 2017 — la #13 de la cartera VIVA por antigüedad, con doce consecutivos por encima',
      'Cero incidencias de pago en 9.6 años · $7.8M acumulados entre las dos líneas',
      'No se le cae el servicio: 6.21% sin contestar, estable, y el mes cerrado MEJOR que su propia base',
      'Pierde menos el fin de semana que entre semana: la operación conoce su demanda',
      'Adopción ALTA en Voz VyC y Callpicker Chat activo',
      'Hay un interlocutor de alto nivel identificado: el Director General',
    ],
    oportunidades: [
      'Más de 100 sucursales sin una sola vista por tienda, habiendo comprado Visibilidad y Control',
      'No tiene IA de Voz ni IA de Chat ni integración API',
      'Upsell orgánico demostrado: $2,046 facturados en octubre sin campaña',
      'Nunca ha habido una reunión: la primera es, por definición, la de mayor margen',
    ],
    debilidades: [
      'Cero contactos REGISTRADOS por un canal real y cero reuniones en 9.6 años',
      'SIETE tiendas pierden entre el 38.7% y el 64.2% —908 llamadas— y nadie las ha mirado',
      '0 de 12 del Radar · consumo no medible · Health Score medido al 15%',
      'El 46.3% de las llamadas perdidas no se atribuye a ningún destino, y sólo el 18.8% resuelve a una tienda con nombre',
      '21.05% de los tickets son fallas —12 de 57 entre los dos CIDs—, y 5 de las 7 del CID 2094 cerraron en los dos últimos meses medidos',
    ],
    amenazas: [
      'Una cuenta de 9.6 años sin una sola conversación registrada no tiene quien la defienda frente a un competidor',
      'El importe de la ficha está un 33% por debajo del real: la cuenta se prioriza como si fuera más pequeña',
      'Las fallas de servicio cierran concentradas en agosto y septiembre — puede ser el inicio de una tendencia',
      'Su operación está dentro de tiendas iShop Mixup: una decisión de ese tercero puede arrastrar la cuenta',
    ],
  },

  conclusion: 'Tech People es el caso contrario a una cuenta en crisis, y por eso es peligrosa. Todo lo que el tablero mide bien, sale bien: paga, usa, no se queja y sólo pierde el 6.21% de sus llamadas. Durante 115 meses eso bastó para que nunca llegara a la cola de trabajo de nadie. Pero ese 6.21% no dice que la atiendan: a una persona llega el 44.40%, y el menú se queda con casi la mitad del tráfico.\n\nDebajo del promedio hay SIETE tiendas donde entre el 38% y el 64% de quien llama no encuentra a nadie —y 140 destinos más que nadie ha abierto—, y encima de todo hay un hecho que ninguna métrica captura: en nueve años y medio no hay una sola conversación REGISTRADA. No hay una reunión, ni una llamada, ni doce preguntas contestadas. Lo único que consta de boca del cliente es un recado de facturación del 8 de octubre, y de ahí salió el único nombre nuevo de toda la auditoría. Callpicker no sabe qué piensa este cliente de su servicio.\n\nLa cuenta no está en riesgo por lo que hace mal, sino por lo que nadie sabe de ella. Y la corrección es barata: una llamada al Director General, su propio desglose por tienda en la mano, y la ficha con el importe correcto.',

  pierde: [
    'Callpicker pierde $88,783.20 al mes —el 5.05% de los $1,758,279 de MRR institucional de las 171 cuentas vivas que cruzan por CID, y es un techo: al denominador le faltan las que facturan sin CID— si esta relación se enfría del todo.',
    'Tech People pierde a los clientes de siete tiendas donde entre el 38% y el 64% de las llamadas no se contesta, sin saber que ocurre.',
    'Se pierde un caso de uso de red grande: más de cien puntos de servicio. «El más grande de la cartera» NO es — medido en `cuentas.num_oficinas` de la cartera viva, C17 Agua Inmaculada declara «más de 1,800 sucursales / franquicias» más 8 CEDIS, F32 Grupo Petroil «300 puntos o sitios en 24 Estados» y F20 ETICKET «más de 100 puntos de venta».',
    'Se pierde una referencia de 9.6 años y $7.8M acumulados.',
  ],

  gana: [
    'La primera reunión en 9.6 años: cualquier cosa que salga de ahí es información que hoy no existe.',
    'Un panel por sucursal convierte lo que ya compró en una herramienta de gestión de su red.',
    'IA de Voz sobre 116,054 entrantes de consulta repetitiva: alto volumen y preguntas repetidas es justo el patrón que esa función resuelve. No se dice «el más limpio de la cartera» porque no hay ninguna métrica que ordene eso.',
    'Corregir el importe coloca la cuenta donde le toca en la prioridad de todo el equipo.',
  ],

  recomendacion_central: 'Llamar a Camilo Eckardt esta semana y decirle la verdad de entrada: llevamos nueve años y medio trabajando juntos y ésta es la primera llamada que queda REGISTRADA. Dicho así, y no «la primera vez que hablamos», porque es lo que sostiene la fuente: los 5 seguimientos son de tipo `nota`, la tabla `reuniones` está vacía para esta cuenta y la nota del 8 de octubre recoge un intercambio con el cliente. Abrir con lo que hace bien —sólo pierde el 6.21% de sus llamadas, y los fines de semana pierde menos que entre semana— y después enseñarle las SIETE tiendas donde entre el 38% y el 64% de quien marca no encuentra a nadie: Tulum Hunab, Oceania, Parque Tepeyac, Monterrey Esfera, Santa Anita, Las Américas Playa del Carmen y San Nicolás. Es su dato, es de su red, y nunca lo ha visto. Y decirle también que a una persona sólo llega el 44.40% del tráfico nacional: el menú resuelve casi la mitad, y eso es una decisión de diseño que conviene revisar con él.\n\nAntes de esa llamada, corregir el importe en la ficha. Hablar de una cuenta de $59,423 con quien paga $88,783 descalifica todo lo que venga después.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — lib/tickets-data.json: 31 tickets del CID 2094 «Tech People» MÁS 26 del CID 32785 «Tech People - Soluciones», la subcuenta que se fusionó el 31 ago 2026. Son 57 de la misma cuenta, con 12 fallas. Los desgloses por subcategoría de abajo son del CID 2094 y lo dicen fila por fila',
    periodo: 'Febrero 2026 – Octubre 2026 · la fuente trae SÓLO tickets CERRADOS, y `fecha`/`mes` es el mes de CIERRE: «abiertos» no es medible con esta fuente',
    diagnostico: 'La cuenta es UNA desde la fusión del 31 de agosto, y sus tickets son 57: 31 del CID 2094 y 26 del CID 32785. Las fallas son 12 — el 21.05%, dos veces y media la proporción de Torres Corzo (17 de 203, 8.37%). La v1.2 contaba 31 tickets y 7 fallas (22.6%) porque sumaba las dos líneas del GRC para el dinero y un solo CID para la mesa, sin declarar la asimetría. La concentración importa, leída por mes de CIERRE —que es lo único que trae la fuente—: del CID 2094, cero fallas entre febrero y abril y cinco en agosto y septiembre; de la subcuenta, OCTUBRE es su mes más cargado, con 8 cierres. Y la subcategoría más frecuente del CID 2094 es «Venta Equipo (voz)» con 9 de sus 31: una mesa de ayuda atendiendo operaciones comerciales.',
    metricas: [
      { metrica: 'Tickets totales',        valor: '57 (feb–oct 2026)', lectura: '31 del CID 2094 + 26 del CID 32785, la subcuenta fusionada. Volumen moderado para una red de +100 puntos, no «casi nada»' },
      { metrica: 'Fallas del servicio',    valor: '12 de 57 · 21.05%', lectura: 'Alta. Torres Corzo, con 203 tickets, está en 8.37% — dos veces y media menos' },
      { metrica: 'Concentración temporal', valor: '5 de las 7 del CID 2094, en ago–sep', lectura: 'Por mes de CIERRE: cero fallas de febrero a abril en ese CID. Las 5 de la subcuenta van aparte y su mes más cargado es octubre, con 8 cierres' },
      { metrica: 'Mediana de resolución',  valor: '50.0 horas · CID 2094', lectura: 'Dos días, medida sobre los 31 del CID 2094. Aceptable para el tipo de petición' },
      { metrica: 'Tickets de más de 7 días', valor: '3 de los 31 del CID 2094 · 9.7%', lectura: 'Bajo. El peor tardó 473 horas (20 días)' },
      { metrica: 'Subcategoría dominante', valor: 'Venta Equipo (voz) · 9 de 31 del CID 2094 · 29%', lectura: 'Ventas entrando por soporte: un canal comercial sin dueño comercial' },
    ],
    reincidencias: [
      { patron: 'Venta Equipo (voz)',  veces: '9 de 31 · 29.0% · CID 2094', causa: 'El cliente pide equipo por la mesa de ayuda. No es una falla, es un canal de venta que nadie ha formalizado.' },
      { patron: 'Ajuste en Flujo (voz)', veces: '5 de 31 · 16.1% · CID 2094', causa: 'Mismo patrón que en Torres Corzo, a menor escala: configuración que requiere intervención repetida.' },
      { patron: 'Teléfono IP (voz)',   veces: '4 de 31 · 12.9% · CID 2094', causa: 'Hardware en mostradores. Con +100 puntos, una tasa de incidencia esperable.' },
      { patron: 'Falla SIP (voz)',     veces: '3 de 31 · 9.7% · CID 2094', causa: 'Las tres son fallas reales del servicio. Conviene mirar si coinciden con las tiendas que peor contestan.' },
    ],
    hallazgos: [
      'La proporción de fallas del CID 2094 sube con el tiempo: 0 de 10 tickets entre febrero y abril, 5 de 12 entre agosto y septiembre. Son meses de CIERRE, porque la fuente sólo trae tickets cerrados; por mes de apertura junio tiene 2 fallas y julio ninguna.',
      'LA ÚLTIMA FALLA SE ABRIÓ EL 17 DE SEPTIEMBRE Y CERRÓ EL 24, no el 29 de septiembre. La evidencia de `sac_fallas_recurrentes` dice «el último, el 2026-09-29 09:34», pero ése es el ticket más reciente de la cuenta —`Administrativo (chat)` / `Contratación (chat)`, es_falla «No»— y no una falla: `ultima` se calcula sobre todos los tickets.',
      'Las 3 «Falla SIP (voz)» merecen cruzarse contra las siete tiendas que peor contestan: si coinciden, el problema de atención puede ser técnico y no de personal.',
      'LA MESA SÍ VE A ESTA CUENTA: 57 tickets en nueve meses entre los dos CIDs, y la subcuenta cierra 8 en octubre, su mes más cargado. La v1.2 decía «casi no ve a esta cuenta» contando 31, el CID 2094 solo. Lo que sigue siendo cierto es que ninguno de esos tickets la hizo entrar a la cola de trabajo de relación: son peticiones de operación y de venta de equipo, no una conversación sobre su servicio.',
    ],
  },
}
