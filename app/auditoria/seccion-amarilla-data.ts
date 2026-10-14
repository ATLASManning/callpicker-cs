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
 * LA PISTA ESTABA EN LOS REGISTROS DE LA PROPIA CUENTA
 * ----------------------------------------------------
 * El nombre **ADSA** está escrito en los registros de la propia cuenta: en
 * CINCO de sus seis seguimientos —«Llamada de revisión preventiva con ADSA»
 * (26 jun), «Llamada preventiva con ADSA» (2 jul), «VALIDAR TICKETS — ADSA»,
 * «ANÁLISIS DE CALIDAD EN SOPORTE — ADSA», «REGISTRO KAM — ADSA»— y en el
 * campo `empresa` de sus SIETE actividades, que dice «ADSA» mientras
 * `cuentas.empresa` dice «Seccion Amarilla». En el GRC hay una línea «ADSA»
 * que nadie había atado a esta cuenta.
 *
 * ADSA es **Anuncios en Directorios, S.A. de C.V.**, que es el nombre legal de
 * Sección Amarilla. Son la misma empresa, y lo confirman tres cosas
 * independientes: el nombre escrito en los registros de la cuenta, el nombre
 * legal, y los 93 meses de vida que cuadran con su alta del 31 dic 2018.
 *
 * TODAS las cifras salen de fuente y están verificadas:
 *   · facturación → data/grc-zoho.json (corte del 11 oct con el desmentido
 *                   aplicado), su respaldo `.2026-10-13-antes-desmentidos` y
 *                   el respaldo del 2 oct. Se leen los TRES: la comparación
 *                   del acumulado es la que prueba que la cuenta factura.
 *   · ficha       → tabla `cuentas`, registro completo
 *   · tickets     → lib/tickets-data.json, 1 fila del CID 12526. La fuente
 *                   cubre SÓLO los meses de cierre feb–oct 2026 (6,676 filas,
 *                   nueve meses): antes de febrero no trae nada de nadie.
 *   · alertas     → alertas_episodios, 2 abiertas
 *   · la empresa  → Expansión (7 sep 2026)
 *
 * LO QUE ESTA AUDITORÍA **NO** PUEDE DECIR, y se dice con palabras:
 * de la operación telefónica de este cliente hay CUATRO ausencias, no tres.
 * El CID 12526 no está en la entrega de llamadas (211 cuentas), ni en
 * data/cortes-facturacion.xlsx (22,076 filas, 2,701 CIDs), ni en
 * data/dids.json (16,534 números sobre 3,717 CIDs, `sinCid: 0`), y su línea
 * del GRC llega sin CID. O sea que de un cliente de telefonía no se sabe
 * NADA: ni si llama, ni cuánto consume, ni cuántos números tiene. Eso no se
 * rellena con suposiciones: se pide, y está puesto como alerta.
 *
 * ── QUÉ CORRIGE LA v2.0 (13 oct 2026) ─────────────────────────────────────
 * La v1.0 se midió contra su fuente y falló en diez cosas. Se escriben porque
 * dirección lee este expediente y una afirmación sustituida en silencio deja
 * al lector sin saber qué cambió.
 *
 *  1. DECÍA que el GRC la marca «Churn confirmado» `sin_verificar` en los dos
 *     cortes, y abría con «hay una cosa que resolver antes que ninguna otra».
 *     MIDE: el corte vigente trae `verificacion: sigue_viva` y
 *     `verificadoPor: facturacion`. `scripts/desmiente-churn-por-acumulado.py`
 *     aplicó el desmentido el 13 oct a las 10:51, media hora después de que se
 *     escribiera la v1.0. El `sin_verificar` sólo vive en el respaldo
 *     SUPERADO. La tarea nº1 del plan inmediato YA ESTÁ HECHA.
 *  2. DECÍA que es la cuenta con MAYOR facturación acumulada de las auditadas.
 *     MIDE: es la SEGUNDA de las 40. Tech People (C1) suma $7,835,185 en sus
 *     dos líneas del CID 2094, $155,297 más.
 *  3. DECÍA que su score relacional 71 es el más alto de las auditorías.
 *     MIDE: es el CUARTO de las 40 y el cuarto de las 193 cuentas vivas —F45
 *     Arkansas 82, F17 PUBSA 73, C9 Neruc 72, F3 71—.
 *  4. DECÍA «1 de 12 preguntas del Radar» y lo llamaba debilidad.
 *     MIDE: `radar_respuestas` trae los DOCE ids contestados en UNA fila, con
 *     `score_atlas: 90` y `nivel_atlas: grow`. El «1» era el número de FILAS,
 *     por una etiqueta equivocada de `scripts/expediente-datos.py`.
 *  5. DECÍA «1 ticket en 93 meses» y «el producto no le ha fallado nunca».
 *     MIDE: la fuente cubre nueve meses (feb–oct 2026). De los otros 84 no se
 *     puede decir ni que falló ni que no.
 *  6. DECÍA que el ticket #111148 NO aparece en el export de la mesa.
 *     MIDE: #111148 ES el único ticket del CID 12526 en la fuente —abierto el
 *     20 jul, no el 22—. El que falta es el #109637, el de API. Hubo DOS
 *     asuntos en julio, no uno.
 *  7. DECÍA «no tiene Chat, IA de Chat, IA de Voz ni API contratados».
 *     MIDE: `tiene_ia_chat`, `tiene_ia_voz` y `tiene_pago_automatico` están en
 *     `false` en las 223 filas de `cuentas`, y `tiene_integracion_api` sólo en
 *     2. Un flag así no distingue «no contratado» de «sin capturar»
 *     —lib/adopcion-auto.ts lo dice—. El único con lectura real es
 *     `tiene_chat_activo`, true en 46 de 223.
 *  8. DECÍA que es filial de América Móvil / Telmex Internacional, y releía
 *     el ticket de la «redirección de Telmex» sobre esa base.
 *     MIDE: ninguna fuente del proyecto lo respalda. El artículo de Expansión
 *     que la propia auditoría cita dice que Grupo Carso adquirió Teléfonos de
 *     México en 1991 y que Sección Amarilla quedó integrada al grupo
 *     empresarial de Carlos Slim —Grupo Carso y América Móvil son dos
 *     emisoras distintas— y `cuentas.grupo_empresarial` está en null.
 *  9. DECÍA que $7,679,888 ÷ 93 = $82,579 es «casi exactamente» los $84,254
 *     de la ficha, y lo usaba como uno de los cuatro pilares de la
 *     identificación. MIDE: $82,579.44 contra $84,254 deja $1,675 sin
 *     explicar, y la igualdad no reconstruye en ninguna de las cuatro cuentas
 *     —C1 ficha 59,423 vs 68,132; D2 ficha 38,123 vs 30,324; D1 sin línea por
 *     CID—. lib/zoho-enrich.ts llena `facturacion` desde la columna
 *     `ticket_limpio_promedio` de Zoho, que no es `acumulado ÷ meses`. Que es
 *     un PROMEDIO y no el mes vigente se sostiene; la igualdad exacta, no.
 * 10. DECÍA que la entrega de llamadas cubre «las otras 147 cuentas».
 *     MIDE: la entrega trae 211 cuentas; 185 de las 193 vivas tienen lectura y
 *     sólo 8 no la tienen, F3 entre ellas.
 *
 * Y nueve cosas menores, todas medidas y corregidas en su sitio: la alerta
 * `silencio_60` se abrió el 6 oct y no el 2 jul (el 2 jul es su
 * `condicion_desde`, y la fuente guarda DOS evidencias que no concuerdan); son
 * cinco de seis seguimientos con «ADSA» y son texto PLANTILLA del generador
 * SAC, no prosa; por MRR institucional F3 es la SEGUNDA de Fátima, no la
 * primera (F1 Finsus Growth $38,215); el registro del 1 sep es de
 * `seguimientos` y `adopcion_producto`, no de `actividades` —la última
 * actividad es del 14 ago—; la etiqueta «Sin correo» de Emmanuel decía lo
 * contrario de lo que contenía; las cero incidencias de pago son el valor por
 * omisión de 222 de 223 filas; los «1,001–5,000 empleados» no tienen fuente en
 * el proyecto; un ticket no es «excepcional» —3 de las 40 auditadas tienen
 * cero y 6 tienen uno o menos, con mediana 7.5—; y el parque de DIDs era
 * comprobable: no hay ninguno medido.
 */
export const SECCION_AMARILLA: AuditoriaCase = {
  id: 'seccion-amarilla',
  asesor: 'Fátima',
  nombre: 'Sección Amarilla · ADSA (Anuncios en Directorios)',
  sector: 'Marketing digital — en el grupo empresarial de Carlos Slim; la matriz exacta no está verificada',
  fecha_periodo: 'Diciembre 2018 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA · 93 meses · $7.68M facturados en su vida',
  descripcion_contexto: 'La factura REAL son $32,375 al mes, no los $84,254 de la ficha, que es un promedio · Marcada «Churn confirmado» en los cortes del 2 y del 11 de octubre mientras emitía otra factura: el desmentido ya corrió y la línea quedó `sigue_viva` · Sin llamadas, sin consumo y sin DIDs medidos',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '2.0',

  /* El NÚMERO va en `value` y el contexto en `label`. La primera versión metía
     «$32,375 (ficha dice $84,254)» en el valor y la tarjeta se partía en cuatro
     renglones: dejaba de ser un KPI y pasaba a ser una frase. Se vio mirando la
     pantalla, no leyendo el archivo. */
  kpis: [
    { label: 'Factura real · la ficha dice $84,254', value: '$32,375',    color: '#ef4444' },
    { label: 'De su promedio de $82,579 al mes',     value: '39%',        color: '#ef4444' },
    { label: 'La baja del GRC, ya desmentida',       value: 'sigue_viva', color: '#22c55e' },
    { label: 'Facturado en 93 meses',                value: '$7,679,888', color: '#6366f1' },
    { label: 'Meses con consumo medible',            value: '0 de 5',     color: '#f97316' },
    { label: 'Reuniones en 7.8 años',                value: 'NINGUNA',    color: '#f59e0b' },
  ],

  resumen_ejecutivo: 'LO PRIMERO YA ESTÁ RESUELTO, Y ES LO QUE ESTE EXPEDIENTE DESTRABÓ. Gross Revenue Facturación daba esta cuenta por PERDIDA: «Churn confirmado» con $32,375 de pérdida declarada en los cortes del 2 y del 11 de octubre, los dos entonces `sin_verificar`. El 13 de octubre a las 10:51 `scripts/desmiente-churn-por-acumulado.py` aplicó el desmentido y la línea «ADSA» del corte vigente quedó en `verificacion: sigue_viva`, `verificadoPor: facturacion`. La v1.0 de este expediente se escribió media hora antes, contra el respaldo `grc-zoho.2026-10-13-antes-desmentidos.bak.json`, y publicaba ese `sin_verificar` como el estado de hoy: ya no lo es.\n\nEl desmentido se sostiene con una prueba que no admite discusión: entre esos dos cortes el importe ACUMULADO de la cuenta subió de $7,647,513 a $7,679,888. Son $32,375 exactos, su mensualidad al centavo, y el contador de facturas pasó de 8 a 9. **Una cuenta dada de baja no emite facturas.** Sección Amarilla facturó en el periodo en que el reporte decía que se fue. Lo que queda abierto es el `movimiento` de la línea, que sigue diciendo «Churn confirmado»: la verificación ya lo contradice, el rótulo no.\n\nLA SEGUNDA COSA ES QUE NADIE SABÍA QUE ESTA CUENTA FACTURABA. En el GRC no se llama Sección Amarilla: se llama **ADSA** —Anuncios en Directorios, S.A. de C.V., su nombre legal— y llega sin CID y con `enCartera: false`. Por eso ningún cruce automático la encontraba y la ficha parecía no tener respaldo. La pista llevaba meses escrita en los registros de la propia cuenta: el campo `empresa` de sus siete actividades dice «ADSA» mientras `cuentas.empresa` dice «Seccion Amarilla», y cinco de sus seis seguimientos llevan ese nombre. Hay que precisar que esos seguimientos son texto PLANTILLA del generador de tareas SAC, no prosa de nadie: el nombre estaba escrito en el sistema, no es que el equipo hable así.\n\nLA TERCERA, Y ES LA QUE DEBERÍA PREOCUPAR: la cuenta se ha encogido a menos de la mitad y el tablero enseña el tamaño que tenía antes. La ficha dice $84,254 al mes; lo que factura hoy son $32,375. Los $84,254 no son un error de captura: son un PROMEDIO. lib/zoho-enrich.ts llena `cuentas.facturacion` desde la columna `ticket_limpio_promedio` de Zoho, y lib/facturacion-cuenta.ts advierte en su cabecera que ese campo es un promedio de vida y NO sirve como cifra financiera. El promedio que sí se puede reconstruir es el del GRC: $7,679,888 entre 93 meses dan $82,579.44, $1,675 por debajo de lo que guarda la ficha. La igualdad exacta NO reconstruye —la v1.0 la publicaba como prueba y no lo es—, pero los dos números están en el orden del promedio de ocho años y muy lejos del mes. Medida contra sí misma, esta cuenta opera al 39% de lo que fue. Son unos $50,000 al mes que ya se perdieron sin que ninguna alerta los nombrara.\n\nY LA CUARTA: de la operación telefónica de este cliente no se sabe absolutamente nada, y son CUATRO ausencias y no tres. El CID 12526 no está en la entrega de llamadas, no tiene una sola fila en `data/cortes-facturacion.xlsx` —22,076 filas, 2,701 CIDs— así que son 0 de 5 meses con dato de consumo, no tiene un solo número en `data/dids.json` —16,534 números sobre 3,717 CIDs, `sinCid: 0`— y su línea del GRC llega sin CID. Es un cliente de telefonía del que no se puede decir si usa el teléfono, cuánto consume ni cuántos números tiene. La alerta `sin_consumo_medible` lleva abierta desde el 6 de octubre con severidad crítica, y dice textualmente que «factura $84,254 al mes»: repite la cifra equivocada.\n\nEl contexto de la empresa explica el encogimiento mejor que cualquier hipótesis de servicio. Sección Amarilla dejó de imprimir directorios en 2018 —el mismo año en que entró como cliente— y desde 2017 opera como agencia de marketing digital. Es una empresa en plena reconversión —quedó integrada al grupo empresarial de Carlos Slim cuando Grupo Carso adquirió Teléfonos de México en 1991, aunque su matriz actual no está verificada en ninguna fuente de este proyecto— y su gasto en telefonía se mueve con esa reconversión. La pregunta para el cliente no es «por qué bajaron»: es qué están construyendo ahora y si lo que compraron hace ocho años sigue sirviendo para eso.',

  resultado_positivo: 'La relación está sana y el expediente lo sostiene con datos, no con impresiones. Son 93 meses de cliente ininterrumpidos desde el 31 de diciembre de 2018. $7,679,888 facturados en su vida: es el SEGUNDO acumulado de las 40 auditadas, detrás de Tech People (C1), que suma $7,835,185 en sus dos líneas del CID 2094. Del pago no se puede decir nada halagüeño ni lo contrario: `incidencias_pago` está en 0 en 222 de las 223 filas de `cuentas` y `pagos_al_corriente` en true en las mismas 222, así que es el valor por omisión de la cartera y no una medición de estos 93 meses.\n\nEl trabajo del asesor está hecho y se nota. Las SIETE actividades registradas están COMPLETADAS —siete de siete—, cosa que no ocurre en ninguna otra cuenta de este tamaño: Torres Corzo tenía cuatro de siete sin cerrar. El mapa de decisores está capturado con nombre, cargo y correo: Luis Torres León (estrategia comercial) y Emmanuel Roman Santibañez (desarrollador Java SR). Las observaciones KAM están escritas con el formato completo de los cinco puntos. Y el Radar está contestado ENTERO: las doce preguntas, con `score_atlas: 90` y nivel `grow`. Su score relacional es 71, el CUARTO de las 40 auditadas y el cuarto de las 193 cuentas vivas —detrás de Arkansas (F45) con 82, PUBSA (F17) con 73 y Neruc Sede Central (C9) con 72; Torres Corzo tenía 32—.\n\nEl servicio tampoco da señales de falla: UN solo ticket cerrado en los nueve meses que trae la fuente (feb–oct 2026), sin falla técnica, y el propio cliente lo confirmó por teléfono el 2 de julio — «me comenta el Ing. Luis que todo se encuentra en orden sin cambio en operación». El 9 de julio: «Soporte dio rápida respuesta en tema de API».\n\nY hay una puerta abierta que casi nadie tiene: el segundo contacto registrado es un DESARROLLADOR, y en julio hubo DOS asuntos de los que uno fue de API. El que la fuente trae es el #111148, que Zoho clasificó «APIs (voz)» y que el asesor describe como «un tema con una redirección de Telmex»; el que el asesor sí llama de API —el #109637, que reporta resuelto el 9 de julio— no está en el export. Este cliente tiene equipo técnico propio y ya trabajó con nosotros un tema de API, mientras `tiene_integracion_api` está en falso — un flag que sólo está en true en 2 de 223 filas, así que no dice si la integración existe.',

  hallazgos: [
    'FACTURACIÓN — LA PRUEBA DE QUE NO ES CHURN, Y ES ARITMÉTICA. El GRC marcó «Churn confirmado» con $32,375 de pérdida en los cortes del 2 y del 11 de octubre, los dos entonces `sin_verificar`. Pero entre esos dos cortes el importe acumulado de la cuenta subió de $7,647,513 a $7,679,888 —exactamente $32,375, su mensualidad al centavo— y el contador de facturas pasó de 8 a 9. Una cuenta dada de baja no emite facturas. El desmentido YA ESTÁ APLICADO: `scripts/desmiente-churn-por-acumulado.py` corrió el 13 oct a las 10:51 y la línea «ADSA» de `data/grc-zoho.json` quedó en `verificacion: sigue_viva`, `verificadoPor: facturacion`. La v1.0 de este expediente, escrita media hora antes, publicaba el `sin_verificar` del respaldo como estado vigente. Lo que sigue abierto es el `movimiento`, que todavía dice «Churn confirmado».',
    'FACTURACIÓN — EN EL GRC NO SE LLAMA SECCIÓN AMARILLA, SE LLAMA «ADSA». Por eso ningún cruce la encontraba: llega sin CID, con `consecutivo: null` y `enCartera: false`. ADSA es Anuncios en Directorios, S.A. de C.V., el nombre legal de Sección Amarilla. No es una conjetura por parecido —ese camino ya propuso «ADSA ≈ TATSA» y son empresas distintas—: lo confirman TRES cosas independientes, y la primera estaba en casa. La v1.0 contaba una cuarta —que $7,679,888 ÷ 93 = $82,579 fuera «casi exactamente» los $84,254 de la ficha— y esa no reconstruye: sobran $1,675. Se retira como prueba; las otras tres bastan.',
    'FACTURACIÓN — LA PRIMERA CONFIRMACIÓN LLEVABA MESES ESCRITA EN LA PROPIA CUENTA. CINCO de sus seis seguimientos llevan «ADSA»: «Llamada de revisión preventiva con ADSA» (26 jun), «Llamada preventiva con ADSA» (2 jul), «VALIDAR TICKETS — ADSA», «ANÁLISIS DE CALIDAD EN SOPORTE — ADSA» y «REGISTRO KAM — ADSA». El único sin él es el del 1 sep, el mapa de decisores. Hay que decir qué es ese texto: es la PLANTILLA del generador de tareas SAC —«Actualiza el campo Observaciones KAM con: (1) estado de la relación…»—, no prosa que alguien escribiera, así que no prueba cómo habla el equipo. Lo que sí prueba es que el nombre estaba escrito en los registros de la cuenta, y en un sitio que no es plantilla: el campo `empresa` de sus siete actividades dice «ADSA» mientras `cuentas.empresa` dice «Seccion Amarilla». Nadie juntó las dos pantallas.',
    'FACTURACIÓN — EL IMPORTE DE LA FICHA ES UN PROMEDIO, NO SU MES. La ficha guarda $84,254 y lo que factura hoy son $32,375. Que es un promedio está documentado: lib/zoho-enrich.ts llena `cuentas.facturacion` desde la columna `ticket_limpio_promedio` de Zoho, y la cabecera de lib/facturacion-cuenta.ts advierte que ese campo es un promedio de vida y no una cifra financiera. Lo que la v1.0 publicaba y NO se sostiene es la igualdad exacta: $7,679,888 entre 93 meses dan $82,579.44, o sea $1,675 menos que la ficha, y la fórmula `acumulado ÷ meses` no reconstruye en ninguna de las cuatro cuentas donde la dimos por buena —Tech People ficha $59,423 contra $68,132; OOAPAS ficha $38,123 contra $30,324; Torres Corzo no tiene línea por CID, así que no se puede comprobar—. El efecto sigue siendo el más engañoso de los cuatro casos: no infla una cuenta pequeña, DISFRAZA el encogimiento de una grande.',
    'RIESGO — LA CUENTA OPERA AL 39% DE SU PROPIA MEDIA Y NINGUNA ALERTA LO DICE. $32,375 hoy contra $82,579 de promedio histórico. Son unos $50,000 al mes que ya se perdieron. No lo ve el detector de caída de consumo —que mira los últimos cinco cortes y esta cuenta no tiene NI UNO—, ni el de importe —que sólo salta cuando no hay importe en ninguna fuente, y aquí hay uno, equivocado—. El hueco es de diseño: nadie compara el mes contra la vida.',
    'MEDICIÓN — DE UN CLIENTE DE TELEFONÍA NO SABEMOS SI USA EL TELÉFONO, Y SON CUATRO AUSENCIAS. El CID 12526 no está en la entrega de llamadas (211 cuentas), no tiene una sola fila en `data/cortes-facturacion.xlsx` —22,076 filas, 2,701 CIDs— así que son 0 de 5 meses con dato de consumo, no tiene un solo número en `data/dids.json` —16,534 números sobre 3,717 CIDs, `sinCid: 0`, y la fuente no pierde ninguno por falta de CID— y su línea del GRC llega sin CID. Cero en las cuatro. No es que use poco: es que no hay con qué saberlo. Alerta `sin_consumo_medible` abierta desde el 6 de octubre, severidad crítica.',
    'MEDICIÓN — Y LA ALERTA CRÍTICA REPITE LA CIFRA EQUIVOCADA: dice que la cuenta «factura $84,254 al mes» porque toma el importe de la ficha. La alerta que existe para avisar de un hueco de medición está propagando el error que esta auditoría corrige.',
    'CONTACTO — 74 días sin que nada llegue al cliente. El último contacto efectivo fue el 31 de julio, y del 31 de julio al 13 de octubre son 74 días. La alerta `silencio_60` se abrió el 6 de octubre —el mismo día que `sin_consumo_medible`—, con severidad crítica: el 2 de julio es su `condicion_desde`, no su apertura, así que la alerta lleva una semana, no tres meses. Y la fuente guarda DOS evidencias que no concuerdan entre sí: `evidencia_apertura` dice «último contacto 2026-07-02, hace 96 días» y `evidencia_actual` «2026-07-31, hace 74 días». Las observaciones KAM comprometían «próximos pasos: última semana de agosto», que no ocurrieron. El trabajo venía siendo bueno —siete actividades de siete completadas— y se detuvo en seco.',
    'RELACIÓN — NINGUNA REUNIÓN EN 93 MESES. Cero filas en `reuniones`. Es una cuenta AAA con casi ocho años de relación, $7.68M facturados y dos decisores capturados, y nunca se ha sentado nadie con ella. El score relacional dice 71 —el cuarto de las 40 auditorías y el cuarto de las 193 cuentas vivas, no el más alto— porque mide seguimientos y contactos, no reuniones: está premiando una relación que no se ha reunido jamás.',
    'HERRAMIENTA — EL RADAR ESTÁ CONTESTADO ENTERO, Y LA v1.0 DECÍA LO CONTRARIO. `radar_respuestas` tiene UNA fila para esta cuenta (1 sep 2026) y esa fila trae los DOCE ids de `PREGUNTAS_RADAR` con valor —acción, champion («Luis Torres»), predictiva, competencia, dependencia, valor de negocio, cambios de negocio, señal de reducción, shadow workflow, pregunta de finanzas, fricción normalizada y responsable económico—, más `score_atlas: 90` y `nivel_atlas: grow`. `contarRespuestasRadar()` de lib/radar.ts devuelve 12 de 12. El «1 de 12» que publicaba la v1.0 era el número de FILAS que imprime `scripts/expediente-datos.py` bajo la etiqueta equivocada «radar: %d de 12 contestadas»: hace `select=id` y cuenta filas. Hay que arreglar esa etiqueta, porque cualquier expediente escrito con ese guion arrastra el mismo error.',
    'COMERCIAL — HAY EQUIPO TÉCNICO DEL LADO DEL CLIENTE Y YA TRABAJÓ UN TEMA DE API. El segundo contacto capturado es Emmanuel Roman Santibañez, «Desarrollador Java SR». Y en julio hubo DOS asuntos: el #109637, que el asesor reporta el 9 de julio como «soporte dio rápida respuesta en tema de API» y que NO está en el export de la mesa, y el #111148, el único que la fuente trae, que el asesor describe como «un tema con una redirección de Telmex» y que Zoho clasificó «APIs (voz)». Conviene no confundirlos: la subcategoría «APIs (voz)» es la que Zoho puso al ticket de la redirección. `tiene_integracion_api` está en falso, pero ese flag sólo está en true en 2 de 223 filas de `cuentas`, así que no dice si la integración existe. Preguntar sigue siendo una conversación comercial inmediata.',
    'SERVICIO — UN solo ticket cerrado en la ventana que trae la fuente, sin falla. Es el #111148: abierto el 20 de julio, cerrado el 30, 238 horas (10 días), prioridad High, `es_falla: No`. Tardar diez días es lo único reprochable, y el cliente igualmente dijo por teléfono que «soporte dio rápida respuesta». Hay que acotar la ventana: lib/tickets-data.json cubre los meses de CIERRE feb–oct 2026 y nada anterior, de nadie, así que de los otros 84 meses de esta cuenta no se puede decir ni que hubo tickets ni que no. En lo que se puede medir no hay problema de servicio: hay ausencia de relación.',
    'CONTEXTO — EL ENCOGIMIENTO TIENE UNA EXPLICACIÓN DE NEGOCIO, Y NO ES NUESTRA. Sección Amarilla dejó de imprimir directorios en 2018 —el mismo año en que entró como cliente— y desde 2017 opera como agencia de marketing digital bajo el nombre Agencia Digital ADN. Es una empresa en reconversión, no una empresa en problemas, y su gasto telefónico se mueve con esa reconversión. Fuente: Expansión, 7 sep 2026.',
    'CONTEXTO — LA FILIACIÓN QUE PUBLICABA LA v1.0 NO TIENE FUENTE, Y HAY QUE RETIRARLA. Decía «es filial de América Móvil / Telmex Internacional» y sobre eso releía el asunto del 22 de julio —«el cliente me indica tienen un tema con una redirección de Telmex»— como si el cliente fuera la filial de su propio carrier. Ninguna fuente de este proyecto lo respalda: el artículo de Expansión que la propia auditoría cita dice que Grupo Carso adquirió Teléfonos de México en 1991 y que Sección Amarilla quedó integrada al grupo empresarial de Carlos Slim, y Grupo Carso y América Móvil son dos emisoras distintas; `cuentas.grupo_empresarial` está en null. Lo que queda en pie: la empresa está en la órbita de Carlos Slim, la matriz exacta hay que preguntarla antes de apoyar nada en ella, y la «redirección de Telmex» es lo que dice ser, un tema de carrier.',
    'FICHA — El tamaño declarado hay que confirmarlo, y el contraste que publicaba la v1.0 no tenía fuente. La ficha dice «Mediana, 533 empleados» —`tamano_empresa` y `total_empleados`, eso sí está medido—. Los «1,001 a 5,000» de perfiles públicos que la v1.0 ponía enfrente no están en ningún archivo del proyecto y el artículo de Expansión que se cita no da número de empleados, así que no se puede afirmar que la ficha subestime nada. Lo que queda es la pregunta: si los 533 son la empresa entera o la parte que nos compete, y eso se le pregunta al cliente.',
  ],

  cronologia: [
    { fecha: '2017',          responsable: 'Sección Amarilla', evento: 'La empresa cambia su nombre comercial a Agencia Digital ADN y arranca su reconversión a marketing digital. Fuente: Expansión, 7 sep 2026.', tipo: 'neutral' },
    { fecha: '2018',          responsable: 'Sección Amarilla', evento: 'Deja de imprimir sus directorios en papel. Fin del negocio con el que la empresa nació.', tipo: 'pivote' },
    { fecha: '31 Dic 2018',   responsable: 'Callpicker',       evento: 'Alta de la cuenta, el mismo año en que el cliente deja el papel. Servicio: consumo PSTN Nacional + DIDs nacionales adicionales. 93 meses de relación ininterrumpida.', tipo: 'ok' },
    { fecha: '2019–2025',     responsable: 'ADSA / Callpicker', evento: 'La relación acumula $7.68M facturados, con un promedio de $82,579 al mes y cero incidencias de pago. El detalle mes a mes no está en ninguna fuente que tengamos.', tipo: 'neutral' },
    { fecha: '24 Jun 2026',   responsable: 'Fátima',           evento: 'Llamada de revisión preventiva. Queda pendiente de respuesta por WhatsApp.', tipo: 'neutral' },
    { fecha: '02 Jul 2026',   responsable: 'Fátima / Luis Torres', evento: 'Llamada preventiva: «me comenta el Ing. Luis que todo se encuentra en orden sin cambio en operación». Es el último mes con contacto efectivo sostenido.', tipo: 'ok' },
    { fecha: '09 Jul 2026',   responsable: 'Fátima',           evento: 'Revisión de tickets: «Ticket de julio #109637 y todo en orden. Soporte dio rápida respuesta en tema de API». Este #109637 NO está en el export de la mesa — es el ticket que falta, no el otro.', tipo: 'ok' },
    { fecha: '20 Jul 2026',   responsable: 'Mesa de ayuda',    evento: 'Se abre el ticket #111148, el ÚNICO del CID 12526 en la ventana que trae la fuente. Subcategoría «APIs (voz)», prioridad High, sin falla técnica.', tipo: 'neutral' },
    { fecha: '22 Jul 2026',   responsable: 'Fátima',           evento: 'La actividad del 22 de julio lo registra: «Se abrió ticket #111148 derivado que el cliente me indica tienen un tema con una redirección de Telmex. Soporte nos apoya a resolverlo». La fuente lo abre el 20, no el 22: el 22 es la fecha de la actividad.', tipo: 'neutral' },
    { fecha: '30 Jul 2026',   responsable: 'Mesa de ayuda',    evento: 'Cierra el #111148 tras 238 horas —10 días—. Es el único ticket que esta cuenta tiene en la fuente, que sólo cubre los cierres de feb a oct 2026.', tipo: 'neutral' },
    { fecha: '31 Jul 2026',   responsable: 'Fátima',           evento: 'Llamada: «todo en orden». ÚLTIMO contacto que llegó al cliente. Desde aquí se cuentan los 74 días de silencio.', tipo: 'problema' },
    { fecha: '14 Ago 2026',   responsable: 'Fátima',           evento: 'Se completan las observaciones KAM con el formato de cinco puntos. Estado de la relación: «Positivo». Próximos pasos comprometidos: «última semana de agosto».', tipo: 'ok' },
    { fecha: 'Fin Ago 2026',  responsable: 'Fátima',           evento: 'Los próximos pasos comprometidos NO ocurren. No hay registro de contacto posterior.', tipo: 'problema' },
    { fecha: '01 Sep 2026',   responsable: 'Fátima',           evento: 'Se captura el mapa de decisores —Luis Torres León y Emmanuel Roman Santibañez— y el Radar completo, con `score_atlas: 90`. Son filas de `seguimientos`, `radar_respuestas` y `adopcion_producto`, no de `actividades`: es el último registro de cualquier tipo, y la última ACTIVIDAD es la del 14 de agosto.', tipo: 'ok' },
    { fecha: '02 Oct 2026',   responsable: 'Gross Revenue Fact.', evento: 'Respaldo del corte: ADSA ya figura «Churn confirmado» con $32,375 de pérdida, `sin_verificar`. Acumulado $7,647,513 sobre 92 meses, 8 facturas. La columna `Periodo` mide el mes anterior.', tipo: 'problema' },
    { fecha: '06 Oct 2026',   responsable: 'Motor de alertas', evento: 'Se abre `sin_consumo_medible`, severidad crítica: «0 de 5 meses con dato de consumo». La evidencia dice que factura $84,254 al mes — la cifra de la ficha, que es su promedio de vida.', tipo: 'problema' },
    { fecha: '11 Oct 2026',   responsable: 'Gross Revenue Fact.', evento: 'Corte nuevo: sigue «Churn confirmado» y llega `sin_verificar` — PERO el acumulado sube a $7,679,888 (+$32,375 exactos) y las facturas pasan de 8 a 9. La cuenta facturó mientras el reporte la daba por ida.', tipo: 'pivote' },
    { fecha: '13 Oct 2026',   responsable: 'Callpicker',       evento: 'Al reordenar el TOP 50 por el importe bueno se descubre que «ADSA» del GRC es esta cuenta. Primera vez que la facturación de Sección Amarilla aparece atada a su ficha.', tipo: 'pivote' },
    { fecha: '13 Oct 2026 · 10:51', responsable: 'Facturación',  evento: 'DESMENTIDO APLICADO. `scripts/desmiente-churn-por-acumulado.py` deja la línea «ADSA» en `verificacion: sigue_viva`, `verificadoPor: facturacion`. El `sin_verificar` queda sólo en el respaldo `grc-zoho.2026-10-13-antes-desmentidos.bak.json`, contra el que se escribió la v1.0 de este expediente.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'Anuncios en Directorios, S.A. de C.V. (ADSA)' },
    { label: 'Nombre comercial',      value: 'Sección Amarilla · desde 2017 también Agencia Digital ADN' },
    { label: 'Giro',                  value: 'Marketing digital — sitios web, SEO y campañas. Dejó el directorio impreso en 2018.' },
    { label: 'Grupo',                 value: 'En el grupo empresarial de Carlos Slim desde que Grupo Carso compró Telmex (1991). La matriz actual NO está verificada en ninguna fuente del proyecto y `cuentas.grupo_empresarial` está en null.' },
    { label: 'Tamaño',                value: 'La ficha dice «Mediana, 533 empleados». No hay fuente en el proyecto para contrastarlo: hay que preguntar si son la empresa entera o la parte que nos compete.' },
    { label: 'Domicilio fiscal',      value: 'James Sullivan 127, San Rafael, 06470, Cuauhtémoc, CDMX' },
    { label: 'Sitio',                 value: 'seccionamarilla.com.mx' },
    { label: 'Cliente desde',         value: '31 de diciembre de 2018 — 93 meses' },
    { label: 'Servicio contratado',   value: 'Consumo PSTN Nacional + DIDs nacionales adicionales' },
    { label: 'Nombre en el GRC',      value: '«ADSA», sin CID, `enCartera: false` — por eso ningún cruce la encontraba' },
    { label: 'Facturación real',      value: '$32,375 MXN al mes — MRR institucional del GRC (`mrrFin` 0 con `verificacion: sigue_viva`, así que manda `mrrIni`). La ficha dice $84,254, que es un promedio y no el mes.' },
    { label: 'Facturado en su vida',  value: '$7,679,888 en 93 meses · clasificación AAA' },
    { label: 'Salud de pago',         value: 'Al corriente · 0 incidencias — valor por omisión: 222 de las 223 filas de `cuentas` dicen lo mismo, así que no distingue «nunca falló» de «nadie lo capturó»' },
    { label: 'Health Score',          value: '53 · relacional 71, actividad 50, adopción 50, pago 50 (tres de cuatro son el valor por omisión)' },
    { label: 'Decisores capturados',  value: 'Luis Torres León (estrategia comercial) y Emmanuel Roman Santibañez (desarrollador Java SR)' },
  ],

  necesidad_negocio: 'Sección Amarilla es una empresa a mitad de una reconversión. Vivía de un directorio impreso que dejó de imprimir en 2018, y desde 2017 se reconstruye como agencia de marketing digital: sitios, SEO, campañas. Lo que vende hoy a sus clientes son LEADS, y el teléfono es uno de los canales por los que esos leads aterrizan.\n\nEso cambia qué significa su contrato. No compró telefonía para que su gente hable: compró PSTN nacional y DIDs adicionales, que es la forma de dar NÚMEROS — un número por campaña, por cliente anunciante o por canal, para poder medir qué anuncio produjo qué llamada. Es la infraestructura de medición de una agencia, no la central telefónica de una oficina.\n\nSi eso es así, su gasto se mueve con el número de campañas activas, y la caída de $82,579 de promedio a $32,375 sería la de una empresa que redujo su parque de números mientras reorganiza el negocio. Es hipótesis, y el inventario que la confirmaría o la tumbaría se puede consultar: `data/dids.json` trae 16,534 números sobre 3,717 CIDs con `sinCid: 0`, y para el CID 12526 no trae NINGUNO. O sea que no hay parque medido ni antes ni ahora — es la cuarta ausencia de esta cuenta, junto a las llamadas, el consumo y la línea por CID. La pregunta para el cliente no es por qué gastan menos: es qué están armando ahora y si lo que compraron hace ocho años —números sueltos y consumo— sigue siendo la forma correcta de medirlo. La respuesta probable es que no: hoy eso se hace con llamadas rastreadas y API, y el cliente ya tiene un desarrollador capturado y un tema de API trabajado en julio — con soporte nuestro, según el propio asesor, así que no es que la esté tocando a solas.',

  potencial_corto: [
    'Integración por API: el segundo contacto capturado es un desarrollador Java SR y en julio hubo dos asuntos técnicos — el #109637, que el asesor reporta como «tema de API» y que no está en el export, y el #111148, el único que la fuente trae, clasificado «APIs (voz)» por Zoho. `tiene_integracion_api` está en falso, pero ese flag sólo está en true en 2 de 223 filas: no dice si la integración existe. O ya existe y no se registró, o el cliente la está construyendo solo, o no la tiene. Las tres se resuelven con una llamada.',
    'Recuperar visibilidad: hoy no hay lectura de llamadas, ni un solo mes de consumo, ni un número en el inventario de DIDs. Pedir el export y conectar el CID 12526 convierte una cuenta invisible en una cuenta medible, que es condición para cualquier otra conversación.',
    'Primera reunión en 93 meses. No hace falta un pretexto comercial: hay dos decisores capturados y una relación sana que nunca se ha sentado a una mesa.',
    'Atar «ADSA» a esta ficha en la tabla de alias del GRC, para que su facturación deje de ser invisible para el tablero y para el reporte de churn de dirección.',
  ],

  potencial_largo: [
    'Llamadas rastreadas por campaña: es exactamente lo que una agencia de marketing digital necesita para probarle a su anunciante que el anuncio funcionó, y es la evolución natural de los DIDs sueltos que compró en 2018.',
    'Callpicker Chat e IA de Chat: su negocio es generar contactos para terceros y el chat es el canal que falta. `tiene_chat_activo` está en falso y ese flag SÍ discrimina —true en 46 de 223 filas—, así que el Chat se puede afirmar como no activo. De la IA de Chat no: `tiene_ia_chat` está en false en las 223 filas, nunca se pobló, y hay que preguntar en vez de darlo por no contratado.',
    'IA de Voz: una agencia que gestiona números de muchos anunciantes es el caso de uso de un agente que califica y enruta. Si la tiene o no, no lo sabemos: `tiene_ia_voz` está en false en las 223 filas de `cuentas` y lib/adopcion-auto.ts advierte que esos flags nunca se poblaron.',
    'La puerta del grupo: la empresa está en la órbita de Carlos Slim, aunque su matriz exacta no está verificada en ninguna fuente del proyecto. Si se confirma, una cuenta bien llevada aquí es una referencia dentro de un grupo enorme — y la razón para llevarla impecable. Confirmar la filiación es el paso previo, no un detalle.',
  ],

  tacticas: [
    { nombre: 'Entrar por la API, no por el precio', descripcion: 'Abrir con «vimos que su equipo trabajó un tema de API en julio; ¿qué están construyendo?». Es verdad, es reciente y es su terreno.', impacto: 'Convierte una llamada de seguimiento en una conversación técnica con el desarrollador, que es quien sabe hacia dónde va la operación.' },
    { nombre: 'Llevar la corrección, no esconderla', descripcion: 'Decirle al cliente que nuestro reporte lo tenía mal clasificado y ya está corregido. Un proveedor que corrige su propio dato antes de que se lo señalen compra crédito.', impacto: 'Quita de la mesa el riesgo de que el error aparezca por otro lado, y abre la puerta a pedir el export de llamadas.' },
    { nombre: 'Preguntar por la reconversión', descripcion: 'Son públicos el fin del papel y el giro a digital. Preguntar qué papel juega el teléfono en el negocio de hoy, no por qué bajó el consumo.', impacto: 'La caída deja de ser un reproche y pasa a ser el punto de partida de un rediseño del servicio.' },
    { nombre: 'Pedir el export como favor técnico', descripcion: 'No tenemos sus llamadas ni su consumo. Pedirlo explicando para qué: para poder decirle qué números timbran y cuáles están muertos.', impacto: 'Es una petición que le devuelve valor inmediato, y sin ella no hay forma de auditar su operación.' },
  ],

  senal_alarma: 'Una cuenta AAA de 93 meses y $7.68M facturados que el reporte de facturación dio por perdida en dos cortes seguidos sin que nadie lo comprobara —hizo falta un guion para desmentirlo—, que ha encogido al 39% de su propia media sin que ninguna alerta lo nombre, de la que no tenemos ni una llamada, ni un minuto, ni un número medidos, que nunca ha tenido una reunión, y que lleva 74 días sin que nada le llegue. Cada una de esas cosas por separado es un pendiente; juntas son el retrato de una cuenta que se puede ir sin que nos enteremos.',

  problema_raiz: 'El tablero no sabía que esta cuenta facturaba, porque en facturación se llama de otra forma. Y lo que sí mostraba —su importe— era el tamaño que tuvo de media en ocho años, no el que tiene hoy.',

  problema_raiz_detalle: 'El problema no es de atención: el asesor hizo su trabajo y se puede demostrar —siete actividades de siete completadas, los decisores capturados, las observaciones KAM escritas con el formato completo, y el cliente diciendo por teléfono que todo está en orden—. El problema es que el tablero le estaba dando una foto equivocada de su propia cuenta.\n\nLa primera capa es de identidad. En Gross Revenue Facturación esta cuenta se llama «ADSA» y llega sin CID, con `consecutivo: null` y `enCartera: false`. El cruce del tablero es por CID, así que una de las cuentas mayores de Fátima aparecía sin ninguna línea de facturación, y cualquiera que mirara habría concluido que no factura. Conviene decir su puesto real, porque es el mismo error que este expediente denuncia: por MRR institucional F3 es la SEGUNDA de las 63 cuentas vivas de Fátima —Finsus Growth (F1) factura $38,215 contra sus $32,375—; sólo es la primera si se ordena por `cuentas.facturacion`, o sea por el promedio de vida. La pista llevaba meses en los registros de la cuenta —el campo `empresa` de sus siete actividades dice «ADSA»—; nadie juntó las dos pantallas porque nada obliga a juntarlas.\n\nLa segunda es de métrica, y es la que más daño hace. `cuentas.facturacion` guarda un PROMEDIO de vida —lib/zoho-enrich.ts lo llena desde `ticket_limpio_promedio` de Zoho—, no el mes vigente. No es exactamente `acumulado ÷ meses`: aquí esa división da $82,579.44 y la ficha guarda $84,254, y la diferencia de $1,675 no está explicada; la v1.0 publicaba la igualdad como si reconstruyera. En una cuenta estable el promedio se parece al mes vigente y el error no se nota. En una cuenta que se encogió a la mitad, el promedio ESCONDE el encogimiento — enseña el tamaño que tuvo, no el que tiene. Es la cuarta cuenta en la que encontramos esta columna engañosa, y la primera en la que el efecto es ocultar una caída en vez de inflar o desinflar un número.\n\nLa tercera es de cobertura. Ninguna alerta mira el mes contra la vida. El detector de caída de consumo necesita cinco cortes y esta cuenta no tiene ninguno; el de importe sólo salta cuando no hay importe en ninguna fuente, y aquí hay uno —equivocado, pero lo hay—. Una cuenta puede perder el 61% de su facturación sin que nada se encienda, y eso no es un fallo de nadie: es un hueco del diseño que esta auditoría deja nombrado.\n\nY la cuarta es que la alerta que sí está abierta repite el error: `sin_consumo_medible` avisa correctamente de que no se puede medir el consumo, y en la misma frase afirma que la cuenta «factura $84,254 al mes». El aviso que existe para señalar un hueco está propagando el dato equivocado.',

  flujo_real: [
    { fase: 'El cliente contrata',     area: 'ADSA / Callpicker', accion: 'Compra consumo PSTN nacional y DIDs adicionales — números para medir campañas', resultado: 'Diciembre 2018, el año en que deja el papel' },
    { fase: 'La cuenta factura',       area: 'Facturación',       accion: 'Se emite la mensualidad bajo el nombre «ADSA»', resultado: '$7,679,888 en 93 meses · 9 facturas en el periodo vigente' },
    { fase: 'El tablero busca su importe', area: 'Dashboard',     accion: 'Cruza la ficha contra el GRC por CID', resultado: 'NO la encuentra: la línea «ADSA» no trae CID. La ficha queda con su valor viejo.' },
    { fase: 'La ficha muestra un importe', area: 'Dashboard',     accion: 'Pinta `cuentas.facturacion`', resultado: '$84,254 — un promedio (`ticket_limpio_promedio` de Zoho), no el mes: el encogimiento queda tapado' },
    { fase: 'El GRC clasifica',        area: 'Zoho Analytics',    accion: 'Marca la línea «Churn confirmado» con $32,375 de pérdida', resultado: '`sin_verificar` en los dos cortes, hasta que el guion del acumulado la pasa a `sigue_viva`' },
    { fase: 'Pero la cuenta factura',  area: 'Facturación',       accion: 'Emite la factura número 9', resultado: 'El acumulado sube $32,375 exactos — la prueba de que la baja es falsa' },
    { fase: 'El motor alerta',         area: 'Alertas',           accion: 'Abre `sin_consumo_medible` crítica', resultado: 'Correcta en el fondo, y repite «factura $84,254 al mes» en la evidencia' },
    { fase: 'El asesor trabaja',       area: 'SAC',               accion: 'Siete actividades, siete completadas, decisores capturados', resultado: 'Con una foto equivocada del tamaño y sin un solo dato de la operación telefónica' },
  ],

  comparativo: [
    { metrica: 'Facturación mensual real', real: '$32,375 (GRC)', ideal: 'Que la ficha diga eso y no $84,254' },
    { metrica: 'Contra su propio promedio de vida', real: '39% de $82,579 — unos $50,000 al mes perdidos', ideal: 'Que exista una alerta que compare el mes contra la vida' },
    { metrica: 'Clasificación en el GRC', real: '`verificacion: sigue_viva` desde el 13 oct · el `movimiento` todavía dice «Churn confirmado»', ideal: 'Que el movimiento deje de decir baja: emitió factura entre los dos cortes' },
    { metrica: 'Identificación en facturación', real: 'Sin CID, `enCartera: false`, nombre «ADSA»', ideal: 'CID 12526 asignado, o regla de alias confirmada' },
    { metrica: 'Meses con dato de consumo', real: '0 de 5 — ni una fila en los cortes', ideal: '5 de 5 — hoy no se puede decir si usa el servicio' },
    { metrica: 'Números (DIDs) inventariados', real: 'NINGUNO para el CID 12526', ideal: 'El inventario, que es lo que diría si encogió el parque' },
    { metrica: 'Lectura de llamadas', real: 'NO existe para el CID 12526 — es una de las 8 cuentas vivas sin lectura', ideal: 'La entrega mensual, como las otras 185 cuentas vivas que sí la tienen' },
    { metrica: 'Reuniones en 93 meses', real: 'NINGUNA', ideal: 'Trimestral en una cuenta AAA: 31' },
    { metrica: 'Radar de 12 preguntas', real: '12 de 12 respondidas (1 sep 2026) · `score_atlas` 90, nivel `grow`', ideal: 'Sostenerlo: revisarlo en la primera reunión' },
    { metrica: 'Días desde el último contacto', real: '74', ideal: '<30, que es el umbral de la casa' },
    { metrica: 'Actividades completadas', real: '7 de 7 — el mejor de las 40 auditorías', ideal: 'Sostenerlo: la última actividad es del 14 de agosto' },
    { metrica: 'Bloques del Health Score medidos', real: '1 de 4 (sólo el relacional)', ideal: '4 de 4' },
  ],

  plan_inmediato: [
    { accion: 'HECHO el 13 oct: la baja ya está desmentida. `scripts/desmiente-churn-por-acumulado.py` dejó la línea «ADSA» en `verificacion: sigue_viva`, `verificadoPor: facturacion`, con la evidencia del acumulado (+$32,375 exactos, facturas 8→9). Lo que queda es que el `movimiento` deje de decir «Churn confirmado» en origen', responsable: 'Dirección / Facturación', criterio: 'El reporte de churn de dirección no incluye a esta cuenta en el siguiente corte' },
    { accion: 'Atar «ADSA» a la cuenta F3 en la tabla de alias del GRC, o asignarle el CID 12526 a la línea en origen — lo segundo es mejor porque arregla el cruce para siempre', responsable: 'Facturación / Dirección', criterio: 'La ficha de F3 muestra su facturación sin intervención manual' },
    { accion: 'CORREGIR el importe de la ficha: $84,254 es un promedio —viene de `ticket_limpio_promedio` de Zoho— y el mes vigente son $32,375. No es exactamente `acumulado ÷ meses`: ésa da $82,579.44 y la ficha guarda $1,675 más, y la diferencia tampoco está explicada', responsable: 'Facturación', criterio: '`cuentas.facturacion` refleja el mes, la alerta crítica deja de citar la cifra vieja, y queda escrito de dónde salen los $84,254' },
    { accion: 'Llamar al cliente: lleva 74 días sin que nada le llegue y los próximos pasos comprometidos para la última semana de agosto no ocurrieron', responsable: 'Fátima', criterio: 'Contacto efectivo registrado, y la alerta `silencio_60` cerrada por trabajo y no por el paso del tiempo' },
    { accion: 'Pedir el export de llamadas del CID 12526 y revisar con Ingeniería por qué no tiene un solo mes de consumo en los cortes NI un solo número en el inventario de DIDs — son cuatro ausencias de la misma cuenta y probablemente una sola causa', responsable: 'Fátima / Ingeniería', criterio: 'O entra la lectura, o queda escrito por qué esta cuenta no se puede medir' },
    { accion: 'Preguntar por la API: el segundo contacto es un desarrollador y en julio hubo dos asuntos técnicos, uno de API. `tiene_integracion_api` está en falso, pero sólo está en true en 2 de 223 filas: no dice nada', responsable: 'Fátima', criterio: 'Queda escrito si hay integración, si la están construyendo, o si la necesitan — y el flag se captura con lo que diga el cliente' },
  ],

  plan_mediano: [
    { accion: 'Primera reunión en 93 meses, con Luis Torres León y con el desarrollador', responsable: 'Fátima', criterio: 'Reunión registrada con minuta y acuerdos, y el Radar del 1 sep revisado contra lo que diga el cliente en la mesa — está contestado entero, lo que falta es contrastarlo' },
    { accion: 'Entender la reconversión: qué papel juega el teléfono en el negocio digital de hoy, y si los DIDs sueltos siguen siendo la forma correcta de medir campañas', responsable: 'Fátima', criterio: 'Queda escrito en la ficha para qué usa el cliente el servicio HOY, no en 2018' },
    { accion: 'Aclarar dos datos de identidad que hoy no tienen fuente: a qué alcance corresponden los 533 empleados de la ficha, y cuál es la matriz real de la empresa', responsable: 'Fátima', criterio: 'La ficha dice a qué alcance corresponde la cifra, y `grupo_empresarial` deja de estar en null o queda escrito que no se sabe' },
    { accion: 'Reconstruir la serie de facturación de la cuenta para ver CUÁNDO empezó a encogerse. Hoy sólo se sabe el acumulado y el mes vigente.', responsable: 'Facturación', criterio: 'Se identifica el periodo de la caída, que es lo que dice si fue una decisión o una fuga' },
  ],

  plan_estrategico: [
    { accion: 'UNA ALERTA QUE COMPARE EL MES CONTRA LA VIDA. Esta cuenta perdió el 61% de su facturación sin que nada se encendiera: el detector de consumo necesita cinco cortes que no tiene, y el de importe sólo salta cuando no hay importe', responsable: 'Producto / Dirección', criterio: 'Una cuenta que cae por debajo de una fracción de su propio promedio histórico abre alerta' },
    { accion: 'Llamadas rastreadas por campaña, que es lo que una agencia necesita para probarle resultados a su anunciante', responsable: 'Producto / Fátima', criterio: 'Propuesta presentada con el caso de uso de la agencia, no con la lista de funciones' },
    { accion: 'Chat e IA de Chat: su negocio es generar contactos para terceros. El Chat no está activo y eso sí se puede afirmar; de la IA de Chat el flag no dice nada —false en las 223 filas—, así que la propuesta empieza preguntando qué tiene', responsable: 'Fátima', criterio: 'Propuesta entregada, y la ficha con lo que el cliente conteste' },
    { accion: 'Gobernanza de cuenta AAA: reunión trimestral fija. Esta cuenta lleva 93 meses sin una sola.', responsable: 'Fátima / Dirección', criterio: 'Primera reunión agendada con fecha y asistentes' },
  ],

  areas_oportunidad: [
    { area: 'Cerrar la baja falsa en origen', impacto: '$32,375 al mes ya recuperados en la verificación; falta que el `movimiento` del GRC deje de decir baja', responsable: 'Facturación' },
    { area: 'Recuperar la medición', impacto: 'Cero llamadas, cero consumo y cero DIDs inventariados: la cuenta no se puede auditar hoy', responsable: 'Ingeniería / Fátima' },
    { area: 'Integración API', impacto: 'Hay desarrollador del lado del cliente y dos asuntos de julio —uno de ellos de API— sin seguimiento comercial; el flag no dice si la integración existe', responsable: 'Fátima' },
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
        { label: 'Rol real',   value: 'Es el interlocutor de la relación, y el `champion` que registra el Radar. Lleva 74 días sin que le llegue nada, contados desde el 31 de julio.' },
      ],
    },
    {
      nombre: 'Emmanuel Roman Santibañez', rol: 'Desarrollador Java SR — Sección Amarilla', color: '#22c55e',
      campos: [
        { label: 'Capturado',  value: '1 sep 2026, en el mapa de decisores' },
        { label: 'Por qué importa', value: 'El asesor reporta el 9 de julio un tema de API resuelto (#109637, que no está en el export), y el único ticket que la fuente trae está clasificado «APIs (voz)»' },
        { label: 'Sin teléfono', value: 'Está su correo pero no su teléfono' },
        { label: 'La puerta',  value: 'Es la conversación técnica que esta cuenta no ha tenido' },
      ],
    },
    {
      nombre: 'Fátima', rol: 'Asesora SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades', value: '7 registradas · 7 COMPLETADAS. El mejor de las 40 auditorías: el siguiente son 4 completadas (C22 de 5, F5 de 4).' },
        { label: 'Lo que hizo bien', value: 'Capturó los decisores, llenó las observaciones KAM con el formato completo, confirmó el estado por teléfono' },
        { label: 'Dónde se cortó', value: 'Los próximos pasos comprometidos para la última semana de agosto no ocurrieron. Última ACTIVIDAD: 14 ago. El 1 de sep hay seguimiento, Radar y adopción capturados, pero ninguna actividad.' },
        { label: 'Con qué trabajaba', value: 'Con un importe equivocado, sin llamadas y sin consumo. El hueco no es suyo.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '93 meses de relación ininterrumpida y $7,679,888 facturados — el SEGUNDO acumulado de las 40 auditorías, tras Tech People (C1) con $7,835,185',
      'El Radar contestado entero: 12 de 12, `score_atlas` 90, nivel `grow`',
      'Siete actividades de siete completadas: el mejor registro de seguimiento de la cartera auditada',
      'Decisores capturados con nombre, cargo y correo, incluido un perfil técnico',
      'Un solo ticket cerrado en los nueve meses que trae la fuente, sin falla técnica',
      'Score relacional 71, el cuarto de las 40 auditadas y de las 193 cuentas vivas',
    ],
    oportunidades: [
      'Hay desarrollador del lado del cliente y un ticket de API sin seguimiento comercial',
      'Chat sin activar (`tiene_chat_activo` false, y ese flag sí discrimina: true en 46 de 223). De IA de Chat, IA de Voz y API no se sabe: esos flags están en false en toda la tabla y nunca se poblaron — hay que preguntar, no darlo por no contratado',
      'Su negocio —generar contactos para anunciantes— es el caso de uso exacto de las llamadas rastreadas',
      'Nunca ha tenido una reunión: la primera es territorio virgen, no una recuperación',
      'Si se confirma su filiación en el grupo de Carlos Slim —hoy no hay fuente que la respalde— es una referencia dentro de un grupo enorme',
    ],
    debilidades: [
      'Factura el 39% de su propio promedio histórico y nadie lo había medido',
      'Cero lectura de llamadas y cero meses de consumo medible: la operación es invisible',
      'Ninguna reunión en 93 meses, con dos decisores capturados y el Radar contestado entero',
      '74 días sin contacto efectivo, con compromisos de agosto sin cumplir',
      'Su importe en la ficha está 2.6 veces por encima del real',
      'Tres de los cuatro bloques del Health Score son el valor por omisión',
    ],
    amenazas: [
      'EL REPORTE DE DIRECCIÓN LA DABA POR PERDIDA: «Churn confirmado», $32,375, `sin_verificar`, en los cortes del 2 y del 11 de octubre. La verificación ya está corregida a `sigue_viva`, pero el `movimiento` de la línea sigue diciendo baja: si alguien publica por el movimiento y no por la verificación, declara perdida una cuenta que acaba de facturar.',
      'La reconversión del cliente sigue en marcha: lo que compró en 2018 fue para un negocio que ya no existe, y si nadie rediseña el servicio, la caída del 61% tiene continuación natural',
      'Un cliente con desarrollador propio que ya trabajó un tema de API sin seguimiento comercial es un cliente que puede construirse la alternativa',
      'Si la filiación en el grupo de Carlos Slim se confirma, ese grupo tiene capacidad propia de telefonía y una cuenta desatendida sería fácil de internalizar — por ahora es una amenaza a confirmar, no un hecho',
      'Sin llamadas, sin consumo y sin inventario de números no hay forma de ver venir nada: el próximo aviso sería la carta de cancelación',
    ],
  },

  conclusion: 'Esta auditoría empezó como un expediente que no se podía escribir —sin llamadas, sin consumo, sin reuniones y sin una sola línea de facturación— y terminó siendo la de una cuenta que el tablero tenía mal en todo lo que importaba: mal el nombre, mal el importe y mal el estado.\n\nLo urgente era de dentro y ya se resolvió el mismo día: Gross Revenue Facturación la daba por perdida en dos cortes seguidos, sin verificar, y estaba equivocado con una prueba que no se discute — entre esos dos cortes la cuenta emitió otra factura y el acumulado subió exactamente su mensualidad. El desmentido está aplicado y la línea quedó `sigue_viva`. Un reporte de churn que incluya a Sección Amarilla seguiría siendo falso, y el `movimiento` de la línea todavía dice «Churn confirmado»: eso es lo que falta cerrar en origen.\n\nLo importante es de fuera y es más incómodo: la cuenta factura el 39% de lo que facturó de media durante ocho años, y nadie lo sabía porque el tablero enseña el promedio. Son unos $50,000 al mes que ya se fueron. Lo que hay que averiguar no es si el cliente está molesto —no lo está: levantó un solo ticket en los nueve meses que la mesa nos deja ver y dice por teléfono que todo está en orden; de su historial de pago no podemos presumir, porque las cero incidencias son el valor por omisión de 222 de 223 fichas— sino qué quedó de su operación telefónica después de que la empresa dejara de imprimir directorios y se volviera una agencia digital.\n\nY hay dos lecciones de la casa que no son sobre Sección Amarilla. La primera: el dato que destrabó todo —que en facturación se llama ADSA— llevaba meses escrito en los registros de la propia cuenta, en el campo `empresa` de sus siete actividades y en cinco de sus seis seguimientos. No hacía falta investigar nada: hacía falta que algo obligara a mirar las dos pantallas a la vez. La segunda la trajo medir esta auditoría contra su fuente: de los diez fallos de la v1.0, CUATRO eran superlativos que nadie había consultado —la mayor facturación, el score más alto, el único ticket, la cuenta más grande de la asesora— y uno era una etiqueta equivocada de nuestro propio guion de expedientes, que convirtió un Radar contestado entero en una debilidad. Un superlativo es una consulta, y una etiqueta mal escrita se propaga a todos los expedientes que se escriban con ella.',

  pierde: [
    'Callpicker pierde $32,375 al mes si la cuenta se va — y ya perdió unos $50,000 al mes de lo que esta cuenta fue, sin diagnóstico.',
    'Se pierde el segundo acumulado de la cartera auditada: $7,679,888 en 93 meses, sólo por detrás de Tech People (C1) con $7,835,185.',
    'Se pierde, si la filiación se confirma, una referencia dentro del grupo empresarial de Carlos Slim — hoy ninguna fuente del proyecto la respalda.',
    'Y se pierde sin aviso: sin llamadas, sin consumo medible y sin inventario de números, no hay indicador que pueda anticiparlo.',
  ],

  gana: [
    'La baja falsa ya está desmentida: $32,375 al mes que vuelven al reporte de dirección en vez de publicarse como pérdida. Falta cerrarlo en origen.',
    'La base para crecer está sin tocar y hay interlocutor técnico para abrirla: el Chat no está activo y eso sí se puede afirmar; de IA de Chat, IA de Voz y API los flags no dicen nada —están en false en toda la tabla— así que la conversación empieza por preguntar qué tiene.',
    'Es el caso de uso natural de las llamadas rastreadas por campaña — lo que el cliente vende es exactamente eso para sus anunciantes.',
    'Una relación de 93 meses, sin conflictos y con pago impecable, es el punto de partida más fácil que hay para una primera reunión.',
  ],

  recomendacion_central: 'PRIMERO, HACIA DENTRO, Y LA MITAD YA ESTÁ HECHA: la baja está desmentida. El GRC marcaba esta cuenta «Churn confirmado» con $32,375 de pérdida `sin_verificar` en los cortes del 2 y del 11 de octubre, y la prueba de que es falsa es aritmética — entre esos dos cortes el acumulado subió de $7,647,513 a $7,679,888, exactamente su mensualidad, y las facturas pasaron de 8 a 9. Una cuenta dada de baja no factura. El 13 de octubre el guion del acumulado dejó la línea en `sigue_viva`; lo que falta es que el `movimiento` deje de decir baja en origen. En la misma pasada hay que atar «ADSA» a esta ficha —mejor asignándole el CID 12526 en origen que con una regla de alias— y corregir el importe, porque los $84,254 que muestra el tablero son un promedio y no el mes vigente.\n\nDESPUÉS, HACIA FUERA: llamar, y no para disculparse por los 74 días. La conversación que esta cuenta necesita no es de servicio —no hay nada roto en lo que se puede medir: un ticket cerrado en los nueve meses que la mesa nos deja ver, sin falla técnica, y el propio cliente diciendo que todo está en orden—. Es de negocio, y también de identidad: hay que confirmar de qué grupo depende hoy, porque la ficha no lo sabe y la v1.0 de este expediente lo daba por sabido sin fuente. El cliente dejó de imprimir directorios en 2018 y se reconvirtió en agencia digital; lo que compró entonces, números sueltos y consumo, era para medir campañas de un negocio que ya cambió. Abrir con lo que su propio equipo tocó en julio —«vimos que trabajaron un tema de API, ¿qué están construyendo?»— lleva la conversación a su terreno y al único interlocutor técnico capturado; y de paso sirve para preguntar lo que los flags de la ficha no contestan, que es qué tiene contratado y qué no.\n\nY SIN ESTO NO HAY NADA: pedir el export de llamadas y averiguar por qué esta cuenta no tiene un solo mes de consumo en los cortes. Hoy, de un cliente de telefonía con casi ocho años de relación, no podemos decir si usa el teléfono. Mientras eso siga así, cualquier cosa que afirmemos sobre su operación es opinión.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 1 ticket del CID 12526 en lib/tickets-data.json (6,676 filas en total)',
    periodo: 'La fuente cubre los meses de CIERRE feb–oct 2026 y nada anterior, de ninguna cuenta: son NUEVE meses de los 93 de esta relación. Trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí.',
    diagnostico: 'No hay casi nada que auditar en servicio, y decirlo es el hallazgo. UN ticket cerrado en los nueve meses que la fuente deja ver, sin falla técnica. La v1.0 decía «un ticket en todo el histórico de la mesa, en una cuenta de 93 meses» y eso no es medible: antes de febrero de 2026 la fuente no trae nada de ninguna cuenta, así que de los otros 84 meses no se puede decir ni que hubo tickets ni que no. En la misma ventana, el contraste con las otras auditorías sigue siendo enorme: Torres Corzo levanta 203. Esta cuenta no nos necesita para operar — lo cual es bueno y también explica por qué se puede encoger un 61% sin que nadie en soporte lo note. Lo único reprochable es que ese ticket tardó 238 horas (10 días) en cerrarse, y aun así el cliente dijo por teléfono que «soporte dio rápida respuesta».',
    metricas: [
      { metrica: 'Tickets totales',       valor: '1 (jul 2026)',      lectura: 'En los NUEVE meses que trae la fuente, no en los 93 de la relación. No hay patrón que leer.' },
      { metrica: 'Fallas del servicio',   valor: '0 de 1',            lectura: '`es_falla: No` en el único ticket medible. De los 84 meses que la fuente no cubre no se puede decir nada.' },
      { metrica: 'Subcategoría',          valor: 'APIs (voz) · 1 de 1', lectura: 'Es la etiqueta que Zoho puso al #111148, el de la «redirección de Telmex». El tema que el asesor sí llama de API es el #109637, que no está en el export.' },
      { metrica: 'Tiempo de resolución',  valor: '238 h · 10 días',   lectura: 'Abierto el 20 jul, cerrado el 30. Por encima de los 7 días, y con un solo caso no hay mediana que valga.' },
      { metrica: 'Tickets por encima de 7 días', valor: '1 de 1',     lectura: 'El 100%, pero el denominador es uno: no se puede concluir' },
    ],
    reincidencias: [
      { patron: 'APIs (voz)', veces: '1 de 1', causa: 'No es reincidencia, es el único caso de la ventana. Y es la etiqueta de Zoho para el asunto de la redirección de Telmex, no para el tema de API que reporta el asesor. Lo que sí señala, por los dos asuntos de julio juntos, es que el cliente tiene equipo técnico y ya trabajó un tema de API sin acompañamiento comercial.' },
    ],
    hallazgos: [
      'Un ticket en nueve meses está muy por debajo de la mediana de las auditadas, que es 7.5 (media 18.6, con Torres Corzo en 203). Lo que NO se sostiene es llamarlo excepcional, como hacía la v1.0: en la misma ventana, 6 de las 40 auditadas tienen un ticket o menos y TRES tienen cero —Finsus Growth (F1), Grupo System OOAPAS (D2) y ECODELI (C2)—. Poco tráfico a la mesa no es raro en esta cartera.',
      'EL #111148 SÍ ESTÁ EN EL EXPORT: es el único ticket del CID 12526 que la fuente trae, abierto el 20 de julio y cerrado el 30. La v1.0 lo daba por ausente y lo contaba como un segundo asunto perdido. El que NO aparece es el #109637, el de API que el asesor reporta resuelto el 9 de julio — así que en julio hubo al menos DOS asuntos y la fuente sólo trae uno. Lo que hay que comprobar es por qué falta el #109637.',
      'Con un denominador de 1 y una ventana de nueve meses sobre 93, ninguna métrica de servicio de esta cuenta es interpretable. Se publican para que conste que se miraron, no para concluir.',
    ],
  },
}
