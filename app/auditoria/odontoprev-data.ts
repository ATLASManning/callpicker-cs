import type { AuditoriaCase } from './types'

/**
 * ODONTOPREV · Odontored Seguros Dentales (C13 · CID 162545) — la voz mejora,
 * la factura de noviembre trajo un cargo de WhatsApp que no existía, y la
 * bolsa de mensajes va al 346% sin que nadie la haya medido.
 *
 * Séptima del TOP 50. Como en IMPAS, se escribe con DOS fuentes: lo interno
 * —ficha, llamadas, tickets, GRC, alertas— y la ficha institucional que
 * dirección compiló el 13 oct 2026. Y como en IMPAS, lo externo no fue un
 * adorno: resolvió una contradicción que yo tenía mal planteada.
 *
 * LA CONTRADICCIÓN QUE NO ERA TAL
 * -------------------------------
 * La ficha decía «pequeño-mediano, entre 11 y 50 empleados» y eso chocaba de
 * frente con 76,385 llamadas entrantes y 11,083 horas de conversación. Mi
 * primera lectura fue que el tamaño estaba mal capturado. **Estaba bien**:
 * OdontoPrev no es una cadena de clínicas, es una aseguradora que administra
 * coberturas a través de una RED DE PRESTADORES. Plantilla chica, operación
 * enorme — un millón de asegurados y 320 clientes corporativos. La
 * contradicción era mía.
 *
 * Y lo externo explicó además los destinos: entró a México en 2015 en joint
 * venture con **Grupo IKÉ**, y `CAT GENERAL ODONTOPREV IKE` es su segundo
 * destino de llamadas. IKÉ es el SOCIO del joint venture, no un cliente. Los
 * demás nombres de la tabla de destinos —Bradescard (en tres líneas), Zurich
 * Santander, OCESA y Welbe— sí son clientes corporativos, o sea parte de esos
 * 320: CUATRO marcas distintas, no siete.
 *
 * LO QUE SE ESCRIBIÓ TAMBIÉN EN LA FICHA (no sólo aquí)
 * ------------------------------------------------------
 * `scripts/enriquece-odontoprev.py`, con simulacro y relectura: importe
 * $10,901 → $23,325 · el correo sacado del campo de nombre · 8 contactos donde
 * había cero · razón social, matriz, JV con IKÉ, tamaño real, sede y teléfonos
 * públicos · y un addendum fechado en las observaciones del KAM.
 *
 * OJO CON EL ALCANCE DE ESO, que la v1.0 declaró más amplio de lo que fue: la
 * corrección del vínculo con Bradesco a «POR CONFIRMAR» entró en DOS campos de
 * tres —`grupo_empresarial` y `notas`— y el addendum se añadió DEBAJO del
 * párrafo de `observaciones_kam` sin tocarlo, así que ese campo sigue
 * afirmando el vínculo como hecho en la ficha que abre el asesor.
 *
 * LAS FUENTES, Y LA QUE FALTABA
 * -----------------------------
 *   · tráfico   → la auditoría v4.0 entregada, construida sobre una
 *                 exportación de detalle del 1 ene al 5 nov 2026: 93,929
 *                 registros entrantes y 56 salientes. Publicada en
 *                 `public/auditorias/Auditoria-Odontoprev-Trafico-2026.html`
 *                 por `scripts/publica-auditoria-odontoprev.py` y conciliada
 *                 por `scripts/concilia-auditoria-odontoprev.py`.
 *   · llamadas  → data/analisis-llamadas.json, CID 162545. SIGUE TRUNCADA:
 *                 76,385 entrantes, 2,420 Lost y 11 salientes, o sea el
 *                 archivo que la v4.0 retira. Medido el 19 nov 2026, no
 *                 supuesto. Hasta que se recargue, el tablero y el expediente
 *                 dicen cifras distintas de la misma cuenta.
 *   · importe   → GRC por CID: DOS líneas, `mrrFin` $20,176.40 («Odontoprev
 *                 ATC», agrupada) + $3,505.00 («Odontoprev») = $23,681.40.
 *                 Es MRR INSTITUCIONAL por la regla de dirección del 13 oct
 *                 2026 —`mrrFin` cuando es > 0— documentada en
 *                 `lib/facturacion-cuenta.ts`. `cuentas.facturacion` guarda
 *                 `acumulado ÷ meses`, que es un PROMEDIO DE VIDA y no se
 *                 mezcla con esto; hoy guarda $23,325, o sea $356.40 menos.
 *   · tickets   → lib/tickets-data.json, 40 filas, TODAS CON CIERRE. El export
 *                 sólo trae cerrados —2 filas sin cierre de 8,281, el 0.02%—
 *                 así que `ABIERTOS_MEDIBLE` es FALSE: «abiertos» no es cero,
 *                 es NO MEDIBLE. Y `fecha`/`mes` es el mes de CIERRE. Se mide
 *                 con `scripts/mide-tickets-cuenta.py`, no a mano.
 *   · chat      → app/callpicker-chat/chat-data.ts: `operational_error`,
 *                 `lecturaRota: true`, `mensajes: 0` y `semaforo:
 *                 sin_medicion`. El cero NO es desuso. Respaldo fiable: 86,492
 *                 mensajes en el corte del 2 sep contra una bolsa de 25,000.
 *   · DIDs      → data/dids.json: 21 números de VOZ para el CID 162545. Los
 *                 números de WhatsApp son otros y no están en ninguna fuente.
 *   · alertas   → alertas_episodios: 5 episodios, TRES abiertos hoy (una
 *                 crítica). `silencio_60` y `sin_contactos` están cerradas.
 *   · relación  → seguimientos (5) y reuniones (1). Se leen COMPLETOS con
 *                 `scripts/lee-tablas-cuenta.py <CID> --completo`: el recorte
 *                 a 220 caracteres se come justo lo que el cliente contestó.
 *   · la empresa → CNSF, AMIS, Cámara México-Brasil, LinkedIn, odontoprev.com.mx
 *
 * v4.0 — LA AUDITORÍA DE TRÁFICO COMPLETA, Y UN CARGO QUE NO SALE DE LAS LLAMADAS
 * --------------------------------------------------------------------------------
 * El 5 nov 2026 se entregó una auditoría de tráfico sobre una exportación que
 * la v3.0 no tuvo: el archivo anterior estaba truncado EN LAS DOS DIRECCIONES.
 * Ocho cifras de la v3.0 se retiran, y las ocho coinciden al récord con lo que
 * HOY tiene nuestra fuente viva — que es la prueba de que el reporte describe
 * bien lo anterior Y de que la exportación truncada sigue alimentando el
 * tablero:
 *
 *     la v3.0 publicaba          →  está medido en el archivo completo
 *     ─────────────────────────     ──────────────────────────────────────
 *     76,385 entrantes al 14 sep →  93,929, del 1 ene al 5 nov
 *     11 salientes desde el 13 abr → 56, desde el 6 ene
 *     «51.4% sin destino»        →  1.05% (989 filas). EL HALLAZGO SE RETIRA
 *     septiembre al 1.57%        →  1.95%. La v3.0 leyó medio mes
 *     un destino al 37.9%        →  42.47%, sobre el 1.37% del volumen
 *     «no hay día ni hora»       →  19.6% de las pérdidas cae fuera de 7–20 h
 *     Welbe 7 de 8               →  9 de 10
 *     11,083 horas               →  13,266 (ver abajo: se publica con tres)
 *
 * Y LO QUE DECIDE LA RELACIÓN NO SALÍA DE NINGÚN ARCHIVO DE LLAMADAS. Meta
 * dejó de no cobrar los mensajes de servicio de WhatsApp el 1 de octubre de
 * 2026. A Odontoprev le salieron 30,686 mensajes de servicio: $10,740.10 a
 * $0.35, un 46.0% sobre la base de voz de $23,325 con la que se escribió el
 * reporte (45.4% sobre los $23,681.40 vivos). Con VEINTIOCHO meses sin una
 * sola incidencia de pago, ésta es la primera — y el cliente la vio antes que
 * nosotros: lo planteó él, por chat, el 5 de noviembre.
 *
 * LA CONVERSACIÓN MÁS GRANDE ES LA QUE EL REPORTE NO PUDO VER. El apartado 09
 * pregunta cuántos mensajes caben en la ventana gratuita de Meta, y no
 * menciona que la bolsa propia va rebasada. Nuestra fuente de Callpicker Chat
 * no puede confirmar ni desmentir el cargo: la lectura del corte vigente FALLÓ
 * (`operational_error`, `lecturaRota: true`) y marca cero mensajes, que no es
 * desuso. El último dato fiable son 86,492 mensajes en el corte del 2 de
 * septiembre contra una bolsa contratada de 25,000: el 346%.
 *
 * LO QUE SÍ CAMBIÓ A MEJOR, Y HAY QUE DECIRLO
 * -------------------------------------------
 *   · HAY REUNIÓN. La primera registrada en 28 meses: 5 nov 2026, por Teams,
 *     «Revisión de Facturación | Actualización de tarifas Meta», con Erick,
 *     Daniel y dirección. El «cero reuniones» de la v3.0 ya no es cierto.
 *   · HAY INTERLOCUTOR. Guillermo Cisneros volvió: planteó la factura el 5
 *     nov, tomó la llamada, y el 17 nov CONTESTÓ con siete números de
 *     WhatsApp. `silencio_60` se cerró el 5 nov con motivo `remitio`, y esta
 *     vez el cierre está respaldado por contactos reales.
 *   · DIEZ TICKETS NUEVOS Y CERO FALLAS NUEVAS. De 30 a 40 tickets, y las
 *     fallas siguen siendo LAS MISMAS CINCO, la última abierta el 1 de
 *     septiembre. La mediana de resolución bajó de 69 a 59.5 horas.
 *   · EL DOWNGRADE SE RECUPERÓ Y SE SUPERÓ. La línea grande hizo $20,018 →
 *     $19,820 → $20,176.40: hoy está $158.40 ARRIBA de donde estaba el 2 de
 *     octubre. El `ganado` de $356.40 viene rotulado «Upsell por confirmar
 *     (corte de datos)», que NO vouchea durabilidad — pero el dinero SÍ se
 *     facturó: el acumulado de ese renglón creció exactamente $39,996.40 en
 *     dos cortes, que es 19,820 + 20,176.40 al centavo.
 *
 * Y TRES COSAS QUE ESTE EXPEDIENTE CORRIGE DE SÍ MISMO
 * ----------------------------------------------------
 *   1. EL FOLIO 385 YA NO SON 246 DÍAS: SON 277. La v3.0 publicó 5,908 h con
 *      cierre el 12 de septiembre, y eso era lo que decía la fuente el día en
 *      que se escribió. El export de hoy dice 6,651.2 h y cierre el 13 de
 *      OCTUBRE: el ticket se reabrió y se volvió a cerrar. **Un ticket cerrado
 *      puede dejar de estarlo, y el export reescribe su cierre y su duración
 *      sin avisar.** Una cifra copiada del export envejece, y siempre hacia
 *      arriba. Sigue siendo, sin excepción, el mayor tiempo de resolución de
 *      todas las auditorías escritas, y ahora por más margen.
 *
 *   2. LA FICHA SIGUE PUBLICANDO TRES AFIRMACIONES QUE ESTE EXPEDIENTE RETIRÓ.
 *      `observaciones_kam` conserva el addendum del 13 oct con «83 días de
 *      silencio», «la mitad de las pérdidas caben en TRES destinos que son el
 *      1.92% del volumen» y «un ticket de Envío Masivo WhatsApp que lleva
 *      5,908 horas ABIERTO: 246 días». Las dos últimas las tumbó la v2.0 hace
 *      un mes y el campo no se tocó. Corregir el expediente y dejar la ficha
 *      como estaba es dejar publicada la versión vieja donde el asesor mira.
 *
 *   3. LOS SIETE NÚMEROS QUE MANDÓ EL CLIENTE NO EXISTEN EN NINGUNA DE
 *      NUESTRAS FUENTES. El 17 nov Guillermo envió siete números de campaña de
 *      WhatsApp —WA CAT General, WA SMNYL, WA Visión, WA Zurich Odontoprev, WA
 *      Ocesa Odontoprev, WA Gonher y WA Bimbo— y dijo que «los restantes
 *      tienen que ser» de Alejandra. Buscados los siete en `data/`, `lib/` y
 *      `app/`: CERO apariciones. Y tres de esas marcas —SMNYL, Gonher y
 *      Visión— no están en la tabla de destinos de voz, o sea que el chat
 *      atiende clientes corporativos que la voz no mide.
 *
 * v3.0 — LA SEGUNDA VERIFICACIÓN: EL «NO SE SABE» DEL IMPORTE ERA FALSO
 * ----------------------------------------------------------------------
 * El 13 oct 2026 se volvió a medir, ahora contra la v2.0. Lo que la v2.0 decía
 * mal, y lo que mide la fuente:
 *
 *   1. «DE DÓNDE SALIERON LOS $10,901 NO SE PUEDE AFIRMAR» — SÍ SE PUEDE, y
 *      con la fórmula que el propio expediente nombra. Es el `acumulado ÷
 *      meses` de la línea «Odontoprev» —la pequeña de las dos— congelado en un
 *      corte en que ese renglón llevaba 23 meses facturados: $250,731.12 ÷ 23
 *      = $10,901.35, que al peso es el 10,901 que guardaba la ficha
 *      (`facturacion_guardada` en data/crecimiento-escalera.json y
 *      data/veredicto-candidatura.json). El acumulado de ese renglón crece
 *      exactamente $3,505.00 por corte —$261,246.12 el 2 de octubre y
 *      $264,751.12 hoy, con `mrrFin` estable en $3,505— así que retroceder
 *      cuatro cortes desde los 27 meses de hoy deja esos 23. Y ninguna otra
 *      línea del GRC vigente se acerca: ninguna tiene un `acumulado ÷ meses`
 *      entre $10,890 y $10,912. O sea que la v1.0 acertaba la mitad —la ficha
 *      SÍ traía una sola de las dos líneas— y erraba la otra: lo que traía no
 *      era un MRR recortado, era un PROMEDIO DE VIDA, que es exactamente lo
 *      que `cuentas.facturacion` guarda por definición. La v2.0 retiró una
 *      lectura que la fuente sí sostiene y publicó un «no se sabe» en CINCO
 *      campos.
 *
 *   2. TRES AFIRMACIONES DE LA v1.0 SOBREVIVIERON AL REEMPLAZO Y
 *      CONTRADECÍAN A LA CORRECCIÓN DENTRO DEL MISMO ARCHIVO: «tres rutas al
 *      71–91%» en `plan_estrategico`, «los tres destinos rotos» en `tacticas`
 *      y «el importe estaba al 47% porque la cuenta tiene dos líneas y sólo se
 *      traía una» en `problema_raiz_detalle`. Destino real hay UNO, y así lo
 *      decían los otros seis campos. Un expediente que se contradice es peor
 *      que uno equivocado.
 *
 *   3. EL «7.4% DE LAS 217 EN CARTERA» ERA UNA CIFRA NUEVA Y MAL ARMADA:
 *      dividía 16 CIDs del universo entero entre un denominador de cartera, y
 *      las 217 son FILAS del GRC, no cuentas. Medido: Plantillas Verificadas
 *      en 15 CIDs de cliente de los 1,647 con tickets (0.91%), de los que OCHO
 *      tienen línea en el GRC — 8 de 203 cuentas, el 3.9%.
 *
 *   4. Y SIETE RÓTULOS MÁS: es el QUINTO caso de correo-dentro-del-nombre y no
 *      el tercero; el tráfico identificado es 48.0% y no 48.6%; el cubo sin
 *      destino promedia 7.6 min y no 7.8 (el 7.8 divide entre las `c`, que es
 *      el denominador que este mismo expediente rechaza); «cero contactos» se
 *      publicaba en presente cuando ya son ocho entradas; «Envío Masivo en 11
 *      cuentas» cuenta dos CIDs internos; los días de FINSUS y Torres Corzo
 *      iban truncados; y el Health Score 72 es el más alto de las OCHO del TOP
 *      50 —Probemedic entró como octava— y el tercero de las 42 auditorías.
 *
 *   5. LOS FLAGS `tiene_*` NO MEDÍAN NADA Y SE LES ESTABA PIDIENDO UN JUICIO.
 *      `tiene_pago_automatico` está en FALSO en las 223 cuentas de la tabla y
 *      `tiene_integracion_api` en 221 de 223: nunca se poblaron, y
 *      `lib/adopcion-auto.ts` lo dice —«no distinguen ‹no contratado› de ‹sin
 *      capturar›»—. Así que la «contradicción abierta» de pago automático no
 *      existía y su tarea de plan se retira.
 *
 * v2.0 — UNA VERIFICACIÓN ADVERSARIAL TUMBÓ TRES TESIS CENTRALES
 * ---------------------------------------------------------------
 * El 13 oct 2026 se midió cada afirmación de la v1.0 contra su fuente. Lo que
 * decía mal, y lo que mide la fuente:
 *
 *   1. «UN TICKET LLEVA 246 DÍAS ABIERTO» — NO. ESTÁ CERRADO, y el otro
 *      también. El folio 385, «Envío Masivo WhatsApp», se abrió el 8 de enero
 *      y CERRÓ el 12 de septiembre de 2026: las 5,908 horas son su TIEMPO DE
 *      RESOLUCIÓN, no su antigüedad. El folio 105738, «Bandeja de entrada»,
 *      fue del 16 de abril al 7 de agosto: 2,709 horas. Los 30 tickets del CID
 *      traen fecha de cierre, y «cero abiertos» tampoco se puede afirmar
 *      porque la fuente sólo trae cerrados. La v1.0 levantó sobre eso un KPI,
 *      un renglón del comparativo, dos acciones de plan «antes de cualquier
 *      conversación comercial», una debilidad y una amenaza del FODA y parte
 *      de la recomendación central.
 *
 *   2. «LA CURVA ES DESCENDENTE LIMPIA» — NO. La v1.0 enumeró la serie mes a
 *      mes y SALTÓ abril y mayo, que son justo los dos que suben: ene 5.03 ·
 *      feb 4.01 · mar 3.37 · **abr 4.03** · **may 4.11** · jun 2.57 ·
 *      jul 2.22 · ago 1.92 · sep 1.57 (parcial). Mayo es PEOR que febrero, o
 *      sea que la serie retrocede cinco meses de mejora antes de recuperarla.
 *      El tramo que sí es limpio es junio–agosto. Y el 1.6% de septiembre se
 *      publicaba al lado de meses cerrados sin decir que es medio mes.
 *
 *   3. «LA MITAD DE LAS PÉRDIDAS CABEN EN TRES DESTINOS QUE SON EL 1.92% DEL
 *      VOLUMEN» — NO: el titular dependía de contar un cubo. De los «tres
 *      destinos», «(sin destino registrado)» es un CUBOS_AGREGADOS de
 *      `lib/llamadas-cuenta.ts` —un renglón que el generador añade para que la
 *      tabla cierre, «no un lugar por el que se pueda preguntar»— y «WELBE»
 *      son 8 llamadas en total, por debajo de cualquier umbral del módulo.
 *      Queda UN destino real, «Rojas Chávez Carlos Alberto Octaviano»: 918 de
 *      las 2,420 sin contestar (37.9%) sobre 1,009 llamadas, el 1.32% del
 *      volumen. Sigue siendo el hallazgo más accionable de la cuenta; el
 *      51.5% y el 1.92% no eran suyos.
 *
 * Y DOCE CORRECCIONES MÁS, DE CIFRA O DE RÓTULO
 * ----------------------------------------------
 *   · «la tercera seguida con `cuentas.facturacion` mal» → la racha no existe:
 *     ECODELI, la auditoría inmediatamente anterior, dice «EL IMPORTE CUADRA».
 *     Ésta es la PRIMERA tras ese corte.
 *   · «no es un promedio de vida, la ficha traía sólo una parte» → medio
 *     acierto, y la v2.0 lo corrigió de más (ver v3.0). SÍ es un promedio de
 *     vida —`acumulado ÷ meses`, que es lo que guarda `cuentas.facturacion`—
 *     y SÍ es de una sola de las dos líneas. No es $19,820, ni $3,505, ni su
 *     media ($11,663), ni el `mrrIni` ($20,018): es la línea «Odontoprev» en
 *     un corte de 23 meses, $250,731.12 ÷ 23 = $10,901.35. Hoy ese mismo
 *     cociente da $9,806 y en el corte del 2 de octubre daba $10,048.
 *   · «de 8,366 a 12,865 llamadas en agosto» → 12,865 es JULIO. Agosto son
 *     10,360, un 19.5% MENOS que julio. Enero→agosto es 8,366 → 10,360.
 *   · «la última falla, el 6 de octubre» → la última falla se abrió el 1 de
 *     SEPTIEMBRE. El «2026-10-06» que imprime la evidencia del motor mide otra
 *     cosa: `lib/tickets-cuenta.ts` acumula `ultima` sobre la apertura de
 *     TODOS los tickets, y los dos del 6 de octubre son «Reporte de Campaña»
 *     con es_falla = No.
 *   · «se abre en septiembre el ticket de 246 días» → septiembre y agosto son
 *     meses de CIERRE. Las aperturas son del 8 de enero y del 16 de abril, y
 *     el periodo declarado «marzo–octubre» es el rango de cierres: las
 *     aperturas arrancan en enero.
 *   · «el más alto de las auditorías escritas» → sólo de las del TOP 50, que
 *     con Probemedic ya son OCHO.
 *     F4 Ancona Autopartes, con auditoría escrita, tiene 76; C26 Grupo 2711, 84.
 *   · «dos de cuatro bloques medidos, el mejor registro de la serie» → TRES de
 *     cuatro, el 65% del peso —adopción 100, pago 100, relacional 31 y sólo
 *     actividad en el 50 por omisión—. Y D2 Grupo System OOAPAS tiene los
 *     CUATRO capturados: el 100%.
 *   · «el más antiguo salvo el folio de Torres Corzo» → ese folio es MENOR
 *     (155 días fuera de SLA, 156 sin movimiento). 246 > 156, sin excepción —
 *     y son dos medidas distintas.
 *   · «24 de 30 de chat» → 27. «Mediana 70 h» → 69.0: el 70 es `dur[n // 2]`,
 *     el valor superior del par central, que con n par siempre sesga arriba.
 *   · «9.0 min por llamada» → 8.7 sobre las 76,385 llamadas. El 9.0 sale de
 *     dividir entre las 73,965 `c`, que NO son «contestadas»: dentro van el
 *     menú y el buzón.
 *   · «1,009 llamadas de 102 números distintos» → los 102 son los números que
 *     quedaron SIN CONTESTAR, que es lo que define `n` en el módulo. Cuántos
 *     marcaron las 1,009 no está en la fuente.
 *   · «mismo patrón de envío masivo en FINSUS» → FINSUS no lo documenta: cero
 *     apariciones de «masivo» en su expediente. Es Torres Corzo. Y
 *     «Plantillas Verificadas en media cartera» → 15 CIDs de cliente de los
 *     1,647 con tickets, el 0.91%, y sólo OCHO en cartera: 8 de 203, el 3.9%.
 */
export const ODONTOPREV: AuditoriaCase = {
  id: 'odontoprev',
  asesor: 'Erick',
  nombre: 'ODONTOPREV México (Odontored Seguros Dentales)',
  sector: 'Seguros dentales y salud bucal — administra coberturas vía red de prestadores',
  fecha_periodo: 'Tráfico del 1 Enero al 5 Noviembre 2026 · relación desde julio 2024',
  fecha_auditoria: 'Nov 2026',
  tipo_cliente: 'Cuenta AAA · 28 meses · 1 millón de asegurados, 320 clientes corporativos',
  descripcion_contexto: 'La factura de noviembre trae un cargo de WhatsApp que antes no existía —30,686 mensajes de servicio, $10,740.10, el 46% sobre la voz— y es la PRIMERA incidencia de pago en 28 meses · Nuestra propia bolsa de chat va al 346% y la lectura del corte FALLÓ, así que nadie lo ha medido · La voz funciona: 96.22% atendidas de 93,929 llamadas, y lo que se pierde está en DOS sitios configurables — una extensión (42.47%) y las horas sin cobertura (19.6%)',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '4.0',

  /* CUATRO, que es el máximo del contrato, y los cuatro con el mismo hex que
     ya usa el módulo: aquí NO entra ningún color nuevo
     ([[atlas-dashboard-contrast-architecture]]). */
  kpis: [
    { label: 'Cargo de WhatsApp que antes no existía · 46% sobre la voz', value: '$10,740.10', color: '#ef4444' },
    { label: 'Bolsa de chat · 86,492 sobre 25,000, y hoy SIN medir',      value: '346%',       color: '#f59e0b' },
    { label: 'Pérdidas en dos sitios configurables · es un techo',        value: 'hasta 62%',  color: '#f97316' },
    { label: 'Lo que de verdad se perdió, de 93,929 llamadas',            value: '712 · 0.76%', color: '#22c55e' },
  ],

  resumen_ejecutivo: 'LA v4.0 CAMBIA EL TITULAR DE ESTA CUENTA, Y NO LO CAMBIA LA VOZ. La factura de noviembre trajo un cargo que antes no existía: Meta dejó de no cobrar los mensajes de servicio de WhatsApp el 1 de octubre de 2026, y a Odontoprev le salieron 30,686 mensajes de servicio —$10,740.10 a $0.35, un 46.0% sobre la base de voz de $23,325 con la que se escribió el reporte, 45.4% sobre los $23,681.40 vivos—. Con VEINTIOCHO meses sin una sola incidencia de pago, ésta es la primera. Y la vio el cliente antes que nosotros: Guillermo lo planteó él mismo el 5 de noviembre, por chat, diciendo que la factura «le llegó del doble». No es un aumento de Callpicker y eso hay que decirlo con el documento de Meta a la vista — pero tampoco se resuelve explicándolo.\n\nY LA CONVERSACIÓN MÁS GRANDE ES LA QUE NO ESTÁ EN NINGÚN REPORTE. El apartado 09 del documento entregado pregunta cuántos mensajes caben en la ventana gratuita de Meta, y no menciona que la bolsa propia va rebasada. Nuestra fuente de Callpicker Chat no puede confirmar ni desmentir el cargo: la lectura del corte vigente FALLÓ —`operational_error`, `lecturaRota: true`— y marca cero mensajes, que no es desuso. El último dato fiable son 86,492 mensajes en el corte del 2 de septiembre contra una bolsa contratada de 25,000: el 346%. Negociar el cargo de Meta sin haber medido el excedente propio es negociar la mitad del problema, y la mitad que falta es la nuestra.\n\nLA VOZ, EN CAMBIO, FUNCIONA, Y AHORA ESTÁ MEDIDA DE VERDAD. La exportación que usó la v3.0 estaba truncada en las dos direcciones; la completa cubre del 1 de enero al 5 de noviembre: 93,929 llamadas entrantes, de las que un agente atendió el 96.22% —90,381—, con 13,266 horas de conversación real. Las cuatro líneas que mueven el 93% del tráfico pierden menos del 2.2%, y las tres columnas de las dos tablas grandes cierran AL RÉCORD contra los totales del periodo, que es algo que casi ninguna fuente nuestra consigue. Ocho cifras de la v3.0 se retiran, y las ocho coinciden al récord con lo que hoy tiene `data/analisis-llamadas.json` — lo cual prueba dos cosas: que el reporte describe bien lo anterior, y que la exportación truncada SIGUE alimentando el tablero. Hasta que se recargue, la ficha y este expediente dirán cifras distintas de la misma cuenta, y la razón es nuestra.\n\nLO QUE SE PIERDE ESTÁ EN DOS SITIOS, Y LOS DOS SE ARREGLAN CONFIGURANDO. Una línea que enruta a una extensión con el nombre de una persona recibe 1,291 llamadas y deja sin contestar 1,198 —el 92.8% de lo suyo, el 42.47% de todas las pérdidas de la cuenta sobre el 1.37% del volumen—; y las horas en que ya nadie atiende, fuera de las 7 a las 20, aportan otro 19.6% sobre el 1.0% del tráfico. El documento dice que «entre las dos cosas cabe el 62%», y conviene decirlo como es: ese 62% es un TECHO y no una suma limpia, porque una llamada perdida en esa extensión a las 21:00 cuenta en los dos conjuntos y la intersección no está publicada. La conclusión no cambia. Y hay un número que defiende la cuenta y que conviene tener a mano: siguiendo cada número que llamó, el 63.2% de las perdidas fue atendido dentro de 24 horas y el 74.8% dentro de la semana. Las que de verdad se perdieron son 712 — el 0.76% de todo el tráfico. Ése es el tamaño real del daño.\n\nEL ENRUTAMIENTO ROTO CAMBIÓ DE NATURALEZA EN OCTUBRE, Y ESO ES LO QUE LO VUELVE URGENTE. De enero a junio, tres números marcaban a esa extensión sin parar: entre ellos hicieron 958 de las 1,167 llamadas del tramo, o sea que se comportaba como un marcador automático y el volumen alto era menos grave de lo que parecía. En julio casi se detuvo. Volvió el 6 de octubre y volvió distinta: 73 llamadas de 68 números distintos, casi todos una sola vez. El volumen bajó y el daño subió — son personas diferentes marcando una vez cada una y no encontrando a nadie, y de las pérdidas de esa extensión 378 nunca volvieron a marcar. Antes de tocar el enrutamiento hay que preguntar si esa persona sigue en la operación de Odontoprev: si no está, llevamos desde enero mandando clientes a una extensión vacía, y eso cambia la conversación.\n\nY HAY TRES COSAS QUE MEJORARON Y QUE LA v3.0 DABA POR PERDIDAS. HAY REUNIÓN: la primera registrada en 28 meses, el 5 de noviembre, por Teams. HAY INTERLOCUTOR: Guillermo Cisneros volvió, tomó la llamada y el 17 de noviembre CONTESTÓ con siete números de WhatsApp; `silencio_60` se cerró el 5 de noviembre con motivo `remitio` y esta vez el cierre está respaldado por contactos reales. Y LA MESA NO SE DETERIORÓ: diez tickets nuevos —de 30 a 40— y CERO fallas nuevas, con la mediana de resolución bajando de 69 a 59.5 horas. Las cinco fallas siguen siendo las mismas cinco, la última abierta el 1 de septiembre.\n\nLO QUE SIGUE ABIERTO, ENTONCES, ES CORTO Y CONCRETO. Tres alertas vivas, una de ellas CRÍTICA —`sin_consumo_medible`, cuyo dueño es ingeniería y que este reporte NO cierra: el reporte mide minutos de conversación, y la alerta mide la serie de consumo de los cortes de facturación—. El Radar sigue en 0 de 12. La ficha que abre el asesor todavía publica tres afirmaciones que este expediente retiró. La fuente de llamadas sigue truncada. Y el etiquetado que el cliente aceptó está parado esperando los números de Alejandra — con el detalle de que ninguno de los siete que Guillermo YA mandó aparece en ninguna de nuestras fuentes.\n\n── LO QUE SIGUE ES LA LECTURA DE LA v3.0, QUE SE CONSERVA PORQUE LAS CORRECCIONES DE IMPORTE Y DE MÉTODO SIGUEN VALIENDO ──\n\nODONTOPREV es la séptima del TOP 50 y vuelve a traer el problema del importe, pero NO es una racha: la auditoría inmediatamente anterior, ECODELI, la rompió —ahí el importe de la ficha y el del GRC coincidían al peso, «EL IMPORTE CUADRA»—, así que ésta es la primera tras ese corte y no la tercera seguida. La ficha decía $10,901 y el MRR institucional son $23,325: un 114% más. Son DOS líneas del mismo CID 162545, «Odontoprev ATC» con `mrrFin` $19,820 y «Odontoprev» con $3,505. Y de dónde salieron los $10,901 SÍ se sabe, contra lo que publicó la v2.0: es un PROMEDIO DE VIDA de una sola de las dos líneas. No son $19,820, ni $3,505, ni su media ($11,663), ni el `mrrIni` ($20,018): son el `acumulado ÷ meses` de la línea «Odontoprev» congelado en un corte en que ese renglón llevaba 23 meses facturados —$250,731.12 ÷ 23 = $10,901.35, que al peso es el 10,901 que guardaba la ficha—. Ese cociente hoy da $9,806 y en el corte del 2 de octubre daba $10,048, y ninguna otra línea del GRC vigente cae entre $10,890 y $10,912. O sea que la ficha no traía un MRR recortado: traía lo que `cuentas.facturacion` guarda por definición, un promedio de vida, y además de un solo renglón. Conviene anotar además que la línea grande viene de un **Downgrade** —de $20,018 a $19,820— pequeño en pesos pero real.\n\nLO QUE ESTÁ BIEN, Y HAY QUE DECIRLO PRIMERO PORQUE ES LA TENDENCIA. El servicio de voz funciona y viene mejorando sin que nadie haya intervenido. La pérdida pasó de 5.0% en enero a 1.9% en agosto, que es el último mes CERRADO de esta cuenta; septiembre marca 1.6% pero es un mes PARCIAL —la ventana del archivo se corta el 14 de septiembre, con 4,575 llamadas— y no se pone al lado de los cerrados. Y la mejora no es una línea recta: abril (4.03%) y mayo (4.11%) SUBIERON, y mayo quedó peor que febrero, así que el tramo limpio es junio–agosto. El volumen sí creció: de 8,366 llamadas en enero a 12,865 en JULIO, su pico, y agosto cerró en 10,360 —un 19.5% menos que julio y un 23.8% más que enero—. El mes cerrado pierde 1.92% contra una base propia de 3.50%: son 163 llamadas perdidas MENOS de las que esta cuenta normalmente pierde. Y las líneas de negocio están impecables — Bradescard al 0.5%, Bradescard Asistencias al 0.4%, CAT IKÉ al 1.5%.\n\nPERO UN SOLO DESTINO REAL CONCENTRA CASI CUATRO DE CADA DIEZ PÉRDIDAS SOBRE EL 1.32% DEL TRÁFICO. Un destino llamado «Rojas Chávez Carlos Alberto Octaviano» —el nombre de una persona— recibió 1,009 llamadas y 918 quedaron sin contestar: el 91.0% de lo suyo, y el 37.9% de las 2,420 sin contestar de todo el periodo. Arreglar ese enrutamiento vale más que cualquier otra cosa que se pueda hacer en la voz de esta cuenta. Aparte, y sin mezclarlo: 322 cayeron en «(sin destino registrado)», que NO es un destino sino un cubo que el generador añade para que la tabla cierre —no llegaron a ninguna extensión, el archivo no dice por qué, y eso se revisa con soporte antes de culpar a nadie—; otras 859 cayeron en «(destino no venía en el archivo)», el cubo de las filas cuya columna de destino nunca se exportó; y «WELBE» dejó sin contestar 7 de 8 llamadas, demasiado poco para juzgarlo. La tabla cierra sobre las 2,420: Rojas Chávez 918 + cubo sin columna 859 + cubo sin destino 322 + CAT IKÉ 192 + Bradescard 98 + 31 repartidas entre los siete renglones restantes. Fuera de esa extensión y de los dos cubos, el resto de sus destinos deja sin contestar el 0.9%: 321 de 35,668.\n\nEL PROBLEMA DE VERDAD NO ESTÁ EN LA VOZ, ESTÁ EN EL CHAT. De los 30 tickets de la mesa, 27 son de canal chat y veinte son sobre envíos masivos y campañas. Hay cinco fallas registradas —alerta `sac_fallas_recurrentes` abierta el 12 de octubre— y la última de ellas se abrió el 1 de SEPTIEMBRE: en octubre no hay ninguna. Y hay dos casos que tardaron una eternidad en cerrarse: el folio 385 de «Envío Masivo WhatsApp» estuvo del 8 de enero al 12 de septiembre —**5,908 horas, 246 días de RESOLUCIÓN**— y el 105738 de «Bandeja de entrada» del 16 de abril al 7 de agosto, 2,709 horas. LOS DOS ESTÁN CERRADOS, y «cero abiertos» tampoco se puede afirmar: la fuente sólo trae tickets cerrados —2 filas sin cierre de 6,676— así que «abiertos» no es cero, es NO MEDIBLE. La mediana de resolución son 69 horas, pero la media sube a 379 por esos dos.\n\nY NO SABEMOS QUIÉN DECIDE. El único contacto que nos ha respondido, Guillermo Cisneros, nos dijo el 22 de julio que «actualmente no participa de forma directa en la operación» y que validaría con su equipo. No hubo retroalimentación. Van 83 días de silencio, con `silencio_60` crítica abierta. La investigación pública tampoco identifica un responsable de telefonía: hay CEO con nombre —Mércia Leite Nagem— pero sin vía de contacto verificable. La ficha no tenía NI UN contacto capturado hasta el 13 de octubre, cuando se le cargaron ocho entradas — y ocho entradas no son ocho personas: cuatro son nombres, tres son teléfonos institucionales y la octava es el marcador «RESPONSABLE DE TELEFONÍA — SIN IDENTIFICAR». Cero reuniones en 27 meses, cero de doce del Radar.',

  resultado_positivo: 'Esta cuenta tiene más cosas bien que mal, y en la v4.0 la lista es más larga que en la v3.0 — porque tres de las cosas que el expediente daba por perdidas se recuperaron en noviembre.\n\nLA VOZ FUNCIONA, Y AHORA ESTÁ MEDIDA DE VERDAD. De 93,929 llamadas entrantes entre el 1 de enero y el 5 de noviembre, un agente atendió el 96.22% —90,381—, con 13,266 horas de conversación real y 8.81 minutos por llamada atendida, que es exactamente lo contrario de una cuenta automatizada. La tasa del periodo completo es 3.00% y la serie va de 5.0% en enero a 1.9% en agosto. Septiembre cerró en 1.95% y octubre subió a 2.4%, pero ese retroceso NO es de la operación: apartando la extensión que no contesta, octubre cierra en 1.7% —mejor que septiembre—. Y lo que de verdad se perdió son 712 llamadas, el 0.76% de todo el tráfico: eso es el tamaño real del daño y es la cifra que defiende la cuenta.\n\nLAS CUATRO LÍNEAS QUE MUEVEN EL 93% DEL TRÁFICO PIERDEN MENOS DEL 2.2%. Asegurados Bradescard: 50,307 llamadas con 0.6% de pérdida y 7,984 horas. Directo Asegurados Bradescard: 0.3%. Bradescard Asistencias: 0.6%. El CAT general con IKÉ: 2.2% sobre 28,458. Chubb, Quálitas, Price Waterhouse, Zurich y Tokio Marine, todos por debajo del 1.2%. De las 21 líneas contratadas, DIECINUEVE trabajan por debajo del 4%.\n\nY ALGO QUE CASI NINGUNA FUENTE NUESTRA CONSIGUE: ESTE ARCHIVO CIERRA. Las tres columnas de las tablas de destinos y de líneas cierran AL RÉCORD contra los totales del periodo —93,929, 90,381 y 2,821— y la columna «nunca volvieron» suma exactamente 712. Conviene no estropearlo.\n\nTRES COSAS SE RECUPERARON EN NOVIEMBRE. HAY REUNIÓN: la primera registrada en 28 meses, el 5 de noviembre por Teams, con Erick, Daniel y dirección. HAY INTERLOCUTOR: Guillermo Cisneros volvió, planteó él la factura, tomó la llamada y el 17 de noviembre contestó con datos; `silencio_60` se cerró con motivo `remitio` y el cierre está respaldado por contactos reales. Y LA MESA NO SE DETERIORÓ: diez tickets nuevos y CERO fallas nuevas, con la mediana de resolución bajando de 69 a 59.5 horas. Las cinco fallas siguen siendo las mismas cinco, la última abierta el 1 de septiembre.\n\nY EL IMPORTE SE MOVIÓ HACIA ARRIBA. El Downgrade que la v3.0 dejó abierto se recuperó y se superó: $20,018 → $19,820 → $20,176.40, o sea $158.40 arriba de donde estaba el 2 de octubre. Y el dinero se facturó, no es una promesa de corte: el acumulado de ese renglón creció exactamente $39,996.40 en dos cortes, que es 19,820 + 20,176.40 al centavo.\n\nLA ADOPCIÓN ESTÁ MEDIDA Y ES ALTA. Tres registros, los tres en ALTO: Callpicker Chat, Pago Automático y Uso del Panel Administrador. Su Health Score es 72, el más alto de las OCHO del TOP 50, con los bloques de adopción y pago en 100. Y están medidos TRES de los cuatro bloques, el 65% del peso: adopción 100, pago 100 y relacional 31, con sólo actividad en el 50 por omisión —que `lib/health-score.ts` cuenta como NO medido—. La v1.0 decía «dos de cuatro» y lo presentaba como el mejor registro de la serie: ninguna de las dos cosas era cierta. D2 Grupo System OOAPAS tiene los CUATRO bloques capturados —actividad 69, adopción 4, pago 100, relacional 11—, o sea el 100% del peso.\n\nY EL ANÁLISIS DEL ASESOR DEL 16 DE JULIO ACERTÓ EN EL DIAGNÓSTICO: «la categoría con mayor recurrencia es Asistencia en Chat… los tickets generados corresponden principalmente a solicitudes de creación de campañas, seguimiento y configuraciones… la demanda de soporte es de carácter operativo y no por fallas del servicio». Eso es correcto y es la lectura buena. Lo que faltó fue la consecuencia: si el soporte que el cliente consume es operativo y repetido, eso es una necesidad de producto o de capacitación, no una cola de tickets.',

  /* EL ORDEN DE ESTA LISTA ES UNA DECISIÓN DE PRODUCTO, NO ESTÉTICA.
     `lib/atlas-context.ts` le pasa al modelo SÓLO LOS CUATRO PRIMEROS y los
     recorta a 180 caracteres, y `lib/seguimiento-auditoria.ts` se lleva los
     TRES PRIMEROS ENTEROS a la actividad de SAC. Así que los cuatro de arriba
     cierran su afirmación DENTRO de los 180: un hallazgo cortado a media
     cifra es un hueco, y un hueco se rellena con invención
     ([[feedback-contexto-ia-sin-huecos]]). Lo mide
     `scripts/revisa-dossier-auditoria.mjs odontoprev`, que es quien lo cuenta.
     Y nada de `[[enlaces]]` dentro de un hallazgo: esto se imprime tal cual en
     la pantalla de Dirección. */
  hallazgos: [
    'FACTURA — Meta cobra los mensajes de servicio desde el 1 oct: 30,686 × $0.35 = $10,740.10, el 46% sobre la voz. Primera incidencia de pago en 28 meses, y la vio él primero.',
    'CHAT — Nuestra bolsa va al 346%: 86,492 mensajes sobre 25,000 contratados. Y hoy no se mide, porque la lectura del corte falló y marca cero, que no es desuso.',
    'ATENCIÓN — Una línea enruta a una extensión con nombre de persona: 1,198 sin contestar de 1,291. Es el 42.47% de las pérdidas sobre el 1.37% del volumen, y se arregla configurando.',
    'ATENCIÓN — Fuera de las 7 a las 20 h entran 938 llamadas, el 1.0% del tráfico, y 553 se caen: el 19.6% de todas las pérdidas. A las 21:00 entran 492 y un agente toma 4.',

    'FACTURA — EL CARGO ES DE META, PERO LA SORPRESA ES NUESTRA. Meta dejó de no cobrar los mensajes de servicio de WhatsApp el 1 de octubre de 2026; su propia documentación de precios lo confirma, y confirma también que los enviados dentro de la ventana gratuita de 72 horas siguen sin costo y que, a diferencia de las plantillas de utilidad, no tienen escalones por volumen. A Odontoprev le salieron 30,686 mensajes de servicio en este corte: $10,740.10 a $0.35, un 46.0% sobre la base de voz de $23,325 con la que se escribió el reporte —45.4% sobre los $23,681.40 vivos—. No es un aumento de Callpicker y eso hay que decirlo con el documento de Meta a la vista. Pero tampoco se resuelve explicándolo: son VEINTIOCHO meses sin una sola incidencia de pago y ésta es la primera, y el cliente la planteó él, por chat, el 5 de noviembre, diciendo que la factura «le llegó del doble». Conviene saber cuál de los dos números vio: «al doble» calza con la línea de chat, no con el total de voz.',
    'CHAT — Y LA PREGUNTA QUE EL REPORTE NO HIZO ES LA MÁS CARA: LA BOLSA PROPIA VA REBASADA. El documento entregado pregunta cuántos de esos 30,686 mensajes caben en la ventana gratuita de Meta, y no menciona que la bolsa contratada está desbordada. Nuestra propia fuente no lo puede confirmar ni desmentir: en `app/callpicker-chat/chat-data.ts` el corte vigente de este CID trae `estado: operational_error`, `lecturaRota: true`, `mensajes: 0` y `semaforo: sin_medicion`. Un cero ahí NO es desuso, es que no se pudo leer. El último dato fiable son 86,492 mensajes en el corte del 2 de septiembre contra una bolsa de 25,000: el 346%. Negociar el cargo de Meta sin haber medido el excedente propio es negociar la mitad del problema — y la mitad que falta es la nuestra.',
    'MEDICIÓN — NUESTRA FUENTE DE LLAMADAS SIGUE TRUNCADA, Y ESO NO ES DEL CLIENTE. Las OCHO cifras que la v4.0 retira de la v3.0 coinciden AL RÉCORD con lo que hoy guarda `data/analisis-llamadas.json`: 76,385 entrantes con corte al 14 de septiembre, 11 salientes desde el 13 de abril, el 51.4% sin columna de destino, septiembre al 1.57% sobre 4,575 llamadas, el destino al 37.9%, Welbe 7 de 8 y 11,083 horas. Medido el 19 nov 2026, no supuesto. Eso prueba dos cosas: que el reporte describe bien lo que decía la v3.0, y que la exportación truncada SIGUE siendo la que alimenta el tablero. Hasta que se recargue, la ficha de la cuenta y este expediente dirán cifras distintas de la misma cuenta, y la razón es nuestra.',
    'ATENCIÓN — EL ENRUTAMIENTO ROTO CAMBIÓ DE NATURALEZA EN OCTUBRE, Y ESO ES LO QUE LO VUELVE URGENTE. De enero a junio tres números marcaban a esa extensión sin parar —958 de las 1,167 llamadas del tramo—, o sea que se comportaba como un marcador automático y el volumen alto era menos grave de lo que parecía. En julio casi se detuvo. Volvió el 6 de octubre y volvió distinta: 73 llamadas de 68 números distintos, casi todos una sola vez. El volumen bajó y el daño subió, porque ahora son personas diferentes marcando una vez cada una y no encontrando a nadie: de las pérdidas de esa extensión, 378 nunca volvieron a marcar. Y antes de tocar el enrutamiento hay que preguntar si esa persona sigue en la operación de Odontoprev — si no está, llevamos desde enero mandando clientes a una extensión vacía.',
    'ATENCIÓN — LA MEJORA DE LA VOZ SIGUE, PERO EL INDICADOR GLOBAL YA NO LO ENSEÑA. La tasa del periodo completo es 3.00%, y la serie va de 5.0% en enero a 1.9% en agosto. Septiembre cerró en 1.95% —ligeramente peor que agosto, y NO en el 1.57% que publicó la v3.0 leyendo medio mes— y octubre subió a 2.4%. Pero ese retroceso no viene de la operación: apartando la extensión que no contesta, octubre cierra en 1.7%, mejor que septiembre. La operación siguió mejorando y el indicador empeoró por un enrutamiento mal puesto. Noviembre va del día 1 al 5 y no se compara con los cerrados.',
    'ATENCIÓN — LAS CUATRO LÍNEAS QUE MUEVEN EL 93% DEL TRÁFICO PIERDEN MENOS DEL 2.2%. Asegurados Bradescard mueve 50,307 llamadas con 0.6% de pérdida y 7,984 horas; Directo Asegurados Bradescard 0.3%; Bradescard Asistencias 0.6%; y el CAT general con IKÉ 2.2% sobre 28,458. Chubb, Quálitas, Price Waterhouse, Zurich y Tokio Marine, todos por debajo del 1.2%. De las 21 líneas contratadas, DIECINUEVE trabajan por debajo del 4% y sólo DOS están rotas: la 36813, que enruta a la extensión (82.7% de pérdida), y la 36831 de Welbe, que deja sin contestar 9 de 10 — pocas, pero rota y barata de cerrar.',
    'ATENCIÓN — LO QUE DE VERDAD SE PERDIÓ SON 712 LLAMADAS, NO 2,821. Siguiendo cada número que llamó, el 63.2% de las perdidas volvió a marcar y fue atendido dentro de 24 horas, y el 74.8% dentro de la semana. Quedan 712 que nunca volvieron: el 0.76% de todo el tráfico. Y las dos tasas no se miden sobre la misma base —el 63.2% sale de 1,779 recuperadas sobre las 2,816 que la tabla alcanza, y el 74.8% sí usa las 2,821—, así que conviene citarlas con su base. La utilidad de este corte no es tranquilizar, es priorizar: donde la recuperación es alta la pérdida fue un tropiezo —el CAT con IKÉ recupera el 97.6% y sólo 13 se quedaron sin atender—, y donde es baja se fue un cliente. En la extensión rota la recuperación es del 47.4%: 378 clientes perdidos.',
    'MEDICIÓN — EL 62% DEL RESUMEN ES UN TECHO, NO UNA SUMA. El documento suma el 42.47% de la extensión y el 19.6% de las horas sin cobertura y dice que «entre las dos cosas cabe el 62%». Las dos poblaciones PUEDEN solaparse —una llamada perdida en esa extensión a las 21:00 cuenta en los dos conjuntos— y la intersección no se publica, así que la cifra correcta es «hasta el 62%». La conclusión no cambia: las dos se arreglan configurando. Y en el mismo apartado, las 21:00 no cierran: 492 entradas, 4 atendidas y 298 perdidas dejan 190 sin explicar, que son menú y buzón —el documento los cuenta aparte en «Definiciones» pero no en esa frase—.',
    'MEDICIÓN — Y LAS HORAS DE CONVERSACIÓN SE PUBLICAN CON TRES VALORES. El resumen dice 13,268, la tabla de correcciones del apartado 08 dice 13,267 y sumando la columna «Horas» de las dos tablas grandes salen 13,266. Dos horas sobre 13,266 son el 0.015% y no mueven nada, pero una cifra con tres valores en el mismo documento se le nota al cliente. La que cierra contra las tablas es 13,266, y de ahí salen los 8.81 minutos por llamada atendida. Lo bueno de este archivo es justamente lo contrario y conviene no estropearlo: las tres columnas de las tablas de destinos y de líneas CIERRAN AL RÉCORD contra 93,929, 90,381 y 2,821, y la columna «nunca volvieron» suma exactamente 712.',
    'MEDICIÓN — EL «51.4% SIN DESTINO» SE RETIRA: ERA EL ARCHIVO, NO EL CLIENTE. En la exportación completa sólo 989 llamadas (1.05%) no traen destino registrado —de ellas 371 las resolvió el menú y 618 quedaron sin contestar sin que el archivo diga a dónde iban—. El hallazgo de la v3.0 queda sin efecto, y con él su tarea de plan: el destino SÍ viene. Lo que sobrevive es mucho más chico y sigue valiendo: ese 1% es el único punto ciego que queda en la medición, y se revisa con soporte antes de atribuirlo a nadie.',
    'OPERACIÓN — EL CANAL SALIENTE ESTÁ APAGADO, Y AHORA SE PUEDE DECIR CON NÚMEROS. En diez meses la cuenta hizo 56 llamadas salientes desde 2 extensiones, y no marca ninguna desde el 1 de junio: 157 días al 5 de noviembre —el documento dice 156, que es un día de menos y no cambia el punto—. Por cada llamada que sale, entran 1,677. Su tasa de conexión del 60.7% no es una medición: sobre 56 llamadas es una anécdota y hay que presentarla así. Para una aseguradora con un millón de asegurados y 320 clientes corporativos, el saliente es cobranza, renovación, confirmación de cita y recuperación de siniestro — y está en cero. Ésa es la conversación de expansión que esta cuenta nunca ha tenido.',
    'OPERACIÓN — Y LA DURACIÓN POR LLAMADA ATENDIDA CAYÓ DE 10.7 A 7.1 MINUTOS MIENTRAS EL VOLUMEN CRECÍA. No se publica como logro ni como problema, porque el archivo no dice cuál de los dos es. Si es eficiencia, es un logro del cliente que nadie ha medido y conviene que lo vea. Si no lo es, es un síntoma. Hay que preguntarlo.',
    'IMPORTE — EL MRR INSTITUCIONAL SON $23,681.40, Y LA FICHA GUARDA $23,325: $356.40 MENOS. Son las DOS líneas del mismo CID 162545 —«Odontoprev ATC» con `mrrFin` $20,176.40, agrupada, y «Odontoprev» con $3,505.00—, las dos con `mrrFin` > 0, que es lo que manda la regla de dirección del 13 oct 2026. El `ganado` de $356.40 viene rotulado «Upsell por confirmar (corte de datos)», que NO vouchea durabilidad — pero el dinero SÍ se facturó, y eso se puede demostrar: el acumulado de ese renglón creció exactamente $39,996.40 entre el corte del 2 de octubre y el vigente, que es 19,820 + 20,176.40 al centavo. `cuentas.facturacion` sigue en $23,325 y hay que subirla.',
    'IMPORTE — EL DOWNGRADE QUE LA v3.0 DEJÓ ABIERTO SE RECUPERÓ Y SE SUPERÓ. La línea grande hizo $20,018 (2 oct) → $19,820 (Downgrade de $198) → $20,176.40 (hoy): está $158.40 ARRIBA de donde estaba el 2 de octubre. La tarea de «preguntar por el Downgrade» se cierra por hechos, no por explicación — aunque sigue sin saberse qué se redujo en medio. Y de dónde salían los $10,901 que guardaba la ficha hasta el 13 oct sigue reproduciéndose: era el `acumulado ÷ meses` —el PROMEDIO DE VIDA, que es lo que `cuentas.facturacion` guarda por definición— de la línea pequeña en un corte de 23 meses, $250,731.12 ÷ 23 = $10,901.35. Hoy ese mismo cociente da $9,580.58 sobre 28 meses.',
    'SERVICIO — DIEZ TICKETS NUEVOS Y CERO FALLAS NUEVAS. De 30 a 40 tickets, y las fallas siguen siendo LAS MISMAS CINCO (12.5%), la última abierta el 1 de SEPTIEMBRE: en octubre y noviembre no hay ninguna. La mediana de resolución BAJÓ de 69 a 59.5 horas. El producto son TRES cajones y los tres cierran: Chat 36, Voz 2 y «sin producto» 2 — la voz aparece dos veces en cuarenta tickets, o sea que el canal problemático sigue siendo el otro. Las reincidencias: «Envío Masivo WhatsApp» 11, «Reporte de Campaña» 11 y «Plantillas Verificadas» 4. Con una salvedad: los folios 119624 y 119625 se abrieron el 9 de noviembre con un minuto de diferencia y cerraron al mismo minuto, los dos «Reporte de Campaña», así que puede ser un pedido contado dos veces.',
    'SERVICIO — EL FOLIO 385 YA NO SON 246 DÍAS: SON 277, Y ESO ES UNA LECCIÓN SOBRE LA FUENTE. La v3.0 publicó 5,908 horas con cierre el 12 de septiembre, y eso era lo que decía el export el día en que se escribió. El export de hoy dice 6,651.2 horas y cierre el 13 de OCTUBRE: el ticket se reabrió y se volvió a cerrar. Un ticket cerrado puede dejar de estarlo, y el export reescribe su cierre y su duración SIN AVISAR — así que una cifra copiada de ahí envejece, y siempre hacia arriba. Sigue siendo, sin excepción, el mayor tiempo de resolución de todas las auditorías escritas, y ahora por más margen. El segundo sigue igual: folio 105738, 2,709 horas, 113 días. Los dos están CERRADOS, y «abiertos hoy» sigue siendo NO MEDIBLE: 2 filas sin cierre de 8,281.',
    'RELACIÓN — HAY REUNIÓN, Y ES LA PRIMERA EN 28 MESES. El 5 de noviembre de 2026, por Teams: «Revisión de Facturación | Actualización de tarifas Meta», con Erick, Daniel y dirección. El «cero reuniones» de la v3.0 ya no es cierto, y su tarea de plan se cierra. En la reunión Daniel mostró un reporte con el consumo y su costo, y se le propuso al cliente o un plan más amplio para evitar el excedente o un plan de uso de los mensajes — así que la conversación comercial ya está abierta y no hay que volver a abrirla. Lo que sigue en cero es el Radar: 0 de 12 preguntas.',
    'RELACIÓN — Y HAY INTERLOCUTOR OTRA VEZ: GUILLERMO VOLVIÓ, Y VOLVIÓ ÉL. Planteó la factura el 5 de noviembre por chat, tomó la llamada de Teams ese mismo día a las 16:00, dejó pasar el correo del 10 de noviembre sin respuesta y el 17 de noviembre CONTESTÓ con datos. `silencio_60` se cerró el 5 de noviembre con motivo `remitio`, y esta vez el cierre está respaldado por contactos reales y no sólo por el campo. Ojo con una cosa, porque es el vicio que ya documentamos: su `evidencia_actual` quedó congelada en «Último contacto que llegó al cliente: 2026-07-22, hace 106 días», que ya no describe la cuenta — `ultimo_contacto` dice 2026-11-17. Una alerta cerrada cuya evidencia no se actualiza sigue contando la historia vieja a quien la lea.',
    'RELACIÓN — APARECE UNA SEGUNDA PERSONA, Y NO TENEMOS NADA DE ELLA. En el correo del 17 de noviembre Guillermo manda SIETE números de campaña de WhatsApp bajo el rótulo «CAT ATENCIÓN» —WA CAT General, WA SMNYL, WA Visión, WA Zurich Odontoprev, WA Ocesa Odontoprev, WA Gonher y WA Bimbo— y dice que «los restantes tienen que ser» de **Alejandra**, una compañera suya. De Alejandra no tenemos apellido, cargo ni correo, y maneja la otra mitad del consumo que estamos intentando separar. El etiquetado que el cliente ACEPTÓ está parado esperando esa lista.',
    'MEDICIÓN — Y NINGUNO DE LOS SIETE NÚMEROS QUE MANDÓ EL CLIENTE EXISTE EN NUESTRAS FUENTES. Buscados los siete en `data/`, `lib/` y `app/`: cero apariciones. `data/dids.json` tiene 21 números para este CID, pero son de VOZ; los de WhatsApp son otros y no están en ninguna parte. Lo más cercano a un inventario es el corte de chat, que observó 19 bandejas y 25 agentes — y ese corte es justamente el que falló, así que el 19 tampoco es una cuenta fiable. O sea que no podemos deducir la lista de Alejandra por resta: hay que pedirla. Y tres de las marcas que nombra —SMNYL, Gonher y Visión— NO están en la tabla de destinos de voz: el chat atiende clientes corporativos que la voz no mide.',
    'ALERTAS — DE CINCO ABIERTAS A TRES, Y LA QUE QUEDA CRÍTICA NO ES NUESTRA DE CERRAR. `sin_contactos` se cerró el 13 de octubre (`resuelta`) y `silencio_60` el 5 de noviembre (`remitio`). Siguen abiertas `sin_radar` (alta), `sac_fallas_recurrentes` (alta) y `sin_consumo_medible` (CRÍTICA), cuyo dueño es INGENIERÍA. Y esta auditoría NO la cierra, aunque lo parezca: el reporte mide minutos de conversación, y la alerta mide la serie de consumo que sale de los cortes de facturación —0 de 5 meses con dato—. Son dos cosas distintas y confundirlas sería dar por resuelto un hueco que sigue abierto.',
    'FICHA — LA FICHA QUE ABRE EL ASESOR TODAVÍA PUBLICA TRES AFIRMACIONES QUE ESTE EXPEDIENTE RETIRÓ. `observaciones_kam` conserva el addendum del 13 oct con «83 días de silencio» (hoy el último contacto es del 17 de noviembre), «la mitad de las pérdidas caben en TRES destinos que son el 1.92% del volumen» (la v2.0 tumbó ese titular hace un mes) y «un ticket de Envío Masivo WhatsApp que lleva 5,908 horas ABIERTO: 246 días» (está cerrado, y son 277). Corregir el expediente y dejar la ficha como estaba es dejar publicada la versión vieja justo donde se mira primero.',
    'IMPORTE — EL HISTORIAL DE ESTA CIFRA, QUE EXPLICA POR QUÉ `cuentas.facturacion` NO ES UN MRR. Hasta el 13 oct 2026 la ficha decía $10,901, y el MRR institucional de entonces eran $23,325 — hoy son $23,681.40, que es lo que vale la cuenta y lo que dice el hallazgo de arriba. Lo que sigue es el registro de aquella corrección, no una cifra vigente. Un 114% más. Son DOS líneas del mismo CID 162545 —«Odontoprev ATC» con `mrrFin` $19,820 y «Odontoprev» con $3,505— y las dos traen `mrrFin` > 0, que es lo que manda la regla de dirección del 13 oct 2026. Y de dónde salieron los $10,901 SE REPRODUCE, así que el «no se sabe» de la v2.0 queda retirado: son el `acumulado ÷ meses` de la línea «Odontoprev» en un corte en que ese renglón llevaba 23 meses facturados —$250,731.12 ÷ 23 = $10,901.35, el 10,901 de la ficha al peso—. El acumulado de ese renglón crece exactamente $3,505.00 por corte ($261,246.12 el 2 de octubre y $264,751.12 hoy, con `mrrFin` estable), así que retroceder cuatro cortes desde los 27 meses de hoy deja esos 23; y ninguna otra línea del GRC vigente tiene un `acumulado ÷ meses` entre $10,890 y $10,912. No coincide con ningún MRR —ni $19,820, ni $3,505, ni su media ($11,663), ni el `mrrIni` ($20,018)— porque no era un MRR: era un PROMEDIO DE VIDA, que es lo que `cuentas.facturacion` guarda por definición, y de UNA sola de las dos líneas. Hoy ese mismo cociente da $9,806 y el 2 de octubre daba $10,048. La v1.0 acertaba la mitad («la ficha traía sólo una parte») y erraba la otra («no es un promedio de vida»); la v2.0 retiró las dos. Y no hay racha: ECODELI, la auditoría anterior, tenía el importe CUADRADO al peso, así que ésta es la primera tras ese corte y no la tercera seguida.',
    /* RETIRADOS POR LA v4.0 — su registro está en el comentario de cabecera.
       Se BORRAN de aquí en vez de dejarse con una nota, porque esta lista se
       lee de corrido en la pantalla de Dirección y en el contexto de Atlas:
       un expediente que se contradice es peor que uno equivocado (regla que
       este mismo archivo se puso en la v3.0).
         · «la línea grande viene de un Downgrade sin explicar» → se recuperó
           y se superó: hoy está $158.40 arriba del 2 de octubre.
         · «la curva: sep 1.6% parcial» → 1.95%, y octubre al 2.4% global.
         · «un destino concentra el 37.9% sobre el 1.32%» → 42.47% / 1.37%.
         · «918 de 1,009, 102 números» → 1,198 de 1,291.
         · «el 51.4% del tráfico no trae destino» → 1.05%. Era el archivo.
         · «de 30 tickets, 27 de chat» → de 40, 36. Y 5 fallas de 40, no de 30.
         · «246 días» → 277: el folio se reabrió y volvió a cerrar.
         · «el único contacto ya no está / 83 días / cero reuniones / cinco
           alertas» → volvió el 5 nov, hay reunión y quedan tres alertas. */
    'RELACIÓN — EL RESPONSABLE DE TELEFONÍA SIGUE SIN IDENTIFICAR, Y ESO NO LO ARREGLÓ NOVIEMBRE. Haber recuperado interlocutor no es haber encontrado al decisor: Guillermo volvió a responder, pero lo que dijo el 22 de julio sigue en pie —«actualmente no participa de forma directa en la operación»— y la conversación de noviembre fue de FACTURACIÓN, no de servicio. Ni la ficha ni la investigación pública identifican un CIO, un gerente de infraestructura ni un responsable del servicio. Hay CEO con nombre —Mércia Leite Nagem, identificada por la Cámara México-Brasil en 2026— pero sin teléfono ni correo verificable. Lo que SÍ apareció es una segunda persona de la operación, Alejandra, de la que no tenemos ni apellido: ésa es la vía más corta que hay hoy.',
    'FICHA — EL CORREO VIVÍA DENTRO DEL CAMPO DE NOMBRE. «Oscar Guillermo Cisneros Linares      olinares@odontoprev.com.mx» en `contacto_nombre`, con `contacto_email` VACÍO. Es el QUINTO caso idéntico de la serie del TOP 50 —tras Torres Corzo (D1), Tech People (C1), Grupo System OOAPAS (D2) y ECODELI (C2)—, y el TERCERO en el que además `contacto_email` estaba VACÍO, que es lo que lo vuelve invisible: en C1 y en D2 el correo también estaba en su propio campo. La v2.0 contó «el tercero» saltándose dos cuentas de la serie. En toda la cartera el patrón aparece en 51 cuentas, 40 de ellas sin `contacto_email`. Un dato que existe pero está en el campo equivocado es invisible para cualquier automatismo. Corregido el 13 oct 2026.',
    'CONTEXTO — LA CONTRADICCIÓN DE TAMAÑO NO EXISTÍA, Y ERA MÍA. La ficha decía «11 a 50 empleados» y eso parecía incompatible con 93,929 llamadas y 13,266 horas de conversación. No lo es: OdontoPrev administra coberturas a través de una RED DE PRESTADORES afiliados, no de clínicas propias. Plantilla pequeña, operación grande — un millón de asegurados y 320 clientes corporativos. La investigación lo advierte de forma explícita y hay que respetarlo: una red de odontólogos NO equivale a sucursales.',
    'CONTEXTO — LOS DESTINOS DE LLAMADAS SON SUS CLIENTES CORPORATIVOS, y eso explica la estructura. Asegurados Bradescard (50,307 llamadas), CAT GENERAL ODONTOPREV IKÉ (28,458), Directo Asegurados Bradescard (5,719), Bradescard Asistencias (3,520), Zurich Santander (920), Chubb Seguros (660), Price Waterhouse Cooper (608), OCESA (434), Quálitas Salud (358), Zurich Seguros (85), Tokio Marine (20), Welbe (10), Murguía Dental (8), Libertad Diamante (7), Bimbo (6), Bradescard Hospitalización (6) e Invisalign (1). Es un modelo B2B2C: cada cliente corporativo tiene su línea y sus asegurados marcan ahí. La v1.0 contó «siete clientes corporativos con línea» a partir de esta tabla, y son CUATRO marcas —Bradescard, Zurich Santander, OCESA y Welbe—, porque las tres líneas de Bradescard son el mismo cliente y porque IKÉ es el socio del joint venture, no un cliente. La cuenta de verdad está en una fuente que la v1.0 no abrió: `data/dids.json` registra 21 números para el CID 162545, y sus etiquetas nombran al menos DOCE marcas externas sobre 16 líneas —Chubb Seguros AMEX, Welbe, Bradescard (4 líneas), Bimbo, OCESA, Price Waterhouse Cooper, Qualitas Salud, Seguros Libertad, Tokio Marine, Zurich (2 líneas), Invisalign y Murguía Dental— más 5 internas: APP Odontoprev, CAT GENERAL (dos), RETENCIONES y WA API. Con la advertencia que manda `lib/dids-cuenta.ts`: la etiqueta NO es la razón social, es como el cliente bautizó ese número, así que cuáles de esas doce están entre los 320 corporativos la fuente no lo dice.',
    'CONTEXTO — Y EL SEGUNDO DESTINO MÁS GRANDE ES SU SOCIO DE ENTRADA AL PAÍS. OdontoPrev llegó a México en 2015 mediante joint venture con **Grupo IKÉ**, y `CAT GENERAL ODONTOPREV IKE` mueve 28,458 llamadas y 3,467 horas de conversación — el 30.3% de todo su tráfico entrante. La alianza no es historia corporativa: está viva en el tráfico. Y es además el destino que mejor se recupera de sus propias pérdidas: de las 615 que quedaron sin contestar ahí, 600 volvieron a marcar y fueron atendidas dentro de 24 horas (el 97.6%), y sólo 13 se quedaron sin atender.',
    'FICHA — EL VÍNCULO CON BRADESCO QUE AFIRMABA LA FICHA NO ESTÁ CONFIRMADO. La ficha decía «Odontoprev está vinculada al Grupo Bradesco Seguros» y las notas lo repetían. La investigación institucional identifica como matriz a Odontoprev Brasil y como alianza de entrada a Grupo IKÉ, sin mencionar a Bradesco. Se reescribió como «POR CONFIRMAR» en DOS campos de tres —`grupo_empresarial` y `notas`— y el tercero NO se tocó: `observaciones_kam` sigue arrancando con «Odontoprev pertenece indirectamente al grupo financiero brasileño Bradesco, a través de su división de seguros», porque el addendum del 13 oct se añadió debajo sin corregir ese párrafo. La v1.0 declaró la corrección como completa, y por eso mismo `plan_mediano` seguía pidiendo confirmarlo. Lo que SÍ está medido es otra cosa y es más útil: **Bradescard es su mayor destino de llamadas**, con 50,307 entrantes y 7,984 horas de conversación sólo en la línea de Asegurados — el 53.6% de su tráfico, y a 0.6% de pérdida. La relación comercial con ese grupo es un hecho aunque la societaria esté sin verificar.',
    'FICHA — Y NO HABÍA CONTRADICCIÓN DE PAGO AUTOMÁTICO: EL FLAG NO MIDE NADA. `tiene_pago_automatico` está en FALSO aquí y en las 223 cuentas de la tabla —ni una sola en verdadero—, así que no es un dato que pueda contradecir al registro de adopción («Pago Automático: ALTO»): es un campo que nunca se pobló, y `lib/adopcion-auto.ts` lo dice con todas las letras —«no distinguen ‹no contratado› de ‹sin capturar›»—. Lo que SÍ está medido es el `score_pago` en 100 y VEINTIOCHO meses sin una sola incidencia de pago — hasta la factura de noviembre, que es la primera y que no es de pago sino de IMPORTE: el cargo de mensajes de Meta. La v2.0 pedía resolver con el cliente una contradicción que no existe.',
    'OPERACIÓN — EL CAT TRABAJA FIN DE SEMANA, Y LO TRABAJA MEJOR. El sábado es su día más limpio de la semana. Un centro de atención de seguros con cobertura de fin de semana es coherente con asistencias y urgencias dentales, y significa que la ventana de servicio es más ancha de lo que una ficha de «oficina corporativa» sugiere. Las llamadas de sábado y domingo que publicaba la v3.0 —6,997 y 2,561— salían del archivo truncado y no se sustituyen por otras: el reporte v4.0 publica el reparto por día en una gráfica y su tasa, no los conteos, y teclear aquí una cifra que no he medido sería inventarla. Lo que importa para el plan es el eje de la HORA, no el del día: el problema está fuera de las 7 a las 20.',
  ],

  cronologia: [
    { fecha: '2015',          responsable: 'OdontoPrev',        evento: 'La matriz brasileña entra a México mediante joint venture con Grupo IKÉ. La razón social mexicana es Odontored Seguros Dentales, S.A. de C.V.', tipo: 'neutral' },
    { fecha: '03 Jul 2024',   responsable: 'Callpicker',        evento: 'Alta de la cuenta. Servicio: CP Chat + Paquete de SMS + Visibilidad y Control + DID. 28 meses de relación al 19 nov 2026.', tipo: 'ok' },
    { fecha: 'Ene 2026',      responsable: 'Operación CAT',     evento: '8,366 llamadas con 421 perdidas: 5.0%. Es el peor mes del periodo medido y el punto de partida de una mejora sostenida.', tipo: 'problema' },
    { fecha: 'Mar–May 2026',  responsable: 'Mesa de ayuda',     evento: 'Empiezan a acumularse los tickets de chat: envíos masivos, reportes de campaña, plantillas verificadas. Nueve en tres meses.', tipo: 'problema' },
    { fecha: '26 Jun 2026',   responsable: 'Erick',           evento: 'Actividad de llamada programada: NO se completó.', tipo: 'problema' },
    { fecha: '16 Jul 2026',   responsable: 'Erick',           evento: 'Análisis de tickets cerrado, y el diagnóstico es correcto: «la categoría con mayor recurrencia es Asistencia en Chat… la demanda de soporte es de carácter operativo y no por fallas del servicio».', tipo: 'ok' },
    { fecha: '22 Jul 2026',   responsable: 'Claudia / Cisneros', evento: 'ÚLTIMO contacto efectivo. Cisneros responde que «actualmente no participa de forma directa en la operación» y que validará con su equipo. Desde aquí se cuentan los 83 días.', tipo: 'pivote' },
    { fecha: '24 Jul 2026',   responsable: 'Erick',           evento: 'Se registra el seguimiento. La retroalimentación prometida por el cliente nunca llegó, y nadie buscó al sustituto.', tipo: 'problema' },
    { fecha: 'Ago 2026',      responsable: 'Mesa de ayuda',     evento: 'Siete tickets CERRADOS, empatado con septiembre como el mes de más cierres del año, con dos fallas. Entre ellos el folio 105738 de «Bandeja de entrada», abierto el 16 de abril y cerrado el 7 de agosto: 2,709 horas de resolución.', tipo: 'problema' },
    { fecha: 'Ago 2026',      responsable: 'Operación CAT',     evento: 'Mes cerrado: 10,360 llamadas con 1.9% de pérdida, 1.58 puntos por DEBAJO de su base propia. La mejor lectura del periodo.', tipo: 'ok' },
    { fecha: '12 Sep 2026',   responsable: 'Mesa de ayuda',     evento: 'Se CIERRA el folio 385 de «Envío Masivo WhatsApp», que se había abierto el 8 de enero: 5,908 horas de resolución, 246 días. Septiembre es su mes de CIERRE y no de apertura — en esta fuente `fecha`/`mes` es el mes de cierre, y la v1.0 lo leyó como si fuera la apertura.', tipo: 'problema' },
    { fecha: '01 Oct 2026',   responsable: 'Meta',              evento: 'Meta deja de no cobrar los mensajes de servicio de WhatsApp. Su documentación de precios lo confirma, y confirma también que los enviados dentro de la ventana gratuita de 72 horas siguen sin costo y que, a diferencia de las plantillas de utilidad, no tienen escalones por volumen.', tipo: 'pivote' },
    { fecha: '06 Oct 2026',   responsable: 'Enrutamiento',      evento: 'La extensión «Rojas Chávez» vuelve a recibir llamadas después de pararse en julio, y vuelve DISTINTA: 73 llamadas de 68 números distintos, casi todos una sola vez. Ya no es un marcador automático: son personas que marcan una vez y no encuentran a nadie. De las pérdidas de esa extensión, 378 nunca volvieron.', tipo: 'problema' },
    { fecha: 'Oct 2026',      responsable: 'Operación CAT',     evento: 'El mes de más tickets CERRADOS del año: 11. Y la tasa global de llamadas sin contestar sube a 2.4% — pero apartando la extensión que no contesta, octubre cierra en 1.7%: mejor que septiembre. La operación siguió mejorando; el indicador empeoró por un enrutamiento mal puesto.', tipo: 'neutral' },
    { fecha: '06 Oct 2026',   responsable: 'Motor de alertas',  evento: 'Se abren cuatro alertas: `sin_consumo_medible` y `silencio_60` (críticas), `sin_radar` y `sin_contactos` (altas).', tipo: 'problema' },
    { fecha: '12 Oct 2026',   responsable: 'Motor de alertas',  evento: 'Se abre `sac_fallas_recurrentes`: 5 fallas sobre los 30 tickets que había entonces —hoy son 5 sobre 40, o sea que no ha habido ninguna nueva—. La última falla se abrió el 1 de septiembre; el «6 de octubre» de la evidencia es la última apertura de CUALQUIER ticket, no de una falla.', tipo: 'problema' },
    { fecha: '13 Oct 2026',   responsable: 'Callpicker',        evento: 'Auditoría v3.0. Se corrige el importe ($10,901 → $23,325), se separa el correo del campo de nombre y se capturan 8 contactos donde había cero, con la investigación institucional de dirección. Se cierra `sin_contactos` (`resuelta`).', tipo: 'pivote' },
    { fecha: '13 Oct 2026',   responsable: 'Mesa de ayuda',     evento: 'Se vuelve a cerrar el folio 385 de «Envío Masivo WhatsApp», que ya se había cerrado el 12 de septiembre: se reabrió. Su duración pasa de 5,908 a 6,651.2 horas —de 246 a 277 días— y el expediente v3.0, escrito ese mismo día, publicó la cifra vieja.', tipo: 'problema' },
    { fecha: '05 Nov 2026',   responsable: 'Guillermo Cisneros', evento: 'EL CLIENTE PLANTEA LA FACTURA, Y LO HACE ÉL. Vía José Galván: «le llegó del doble su factura y quieren ver por qué». Es la primera incidencia de pago en 28 meses, y la vio antes que nosotros.', tipo: 'pivote' },
    { fecha: '05 Nov 2026',   responsable: 'Erick / Daniel',    evento: 'PRIMERA REUNIÓN REGISTRADA EN 28 MESES. Por Teams: se explica el cambio de tarifas de Meta, Daniel muestra el reporte de consumo con su costo, y se le propone un plan más amplio o un plan de uso de mensajes para evitar el excedente. Se cierra `silencio_60` (`remitio`).', tipo: 'ok' },
    { fecha: '05 Nov 2026',   responsable: 'Callpicker',        evento: 'Se entrega la auditoría de tráfico v4.0, sobre la exportación completa del 1 ene al 5 nov: 93,929 entrantes y 56 salientes. Retira OCHO cifras de la v3.0, que venían de un archivo truncado en las dos direcciones.', tipo: 'pivote' },
    { fecha: '10 Nov 2026',   responsable: 'Erick',             evento: 'Segundo correo pidiendo los números de Guillermo y los de Alejandra, para etiquetar y separar los consumos manteniendo una sola factura. SIN RESPUESTA.', tipo: 'problema' },
    { fecha: '17 Nov 2026',   responsable: 'Guillermo Cisneros', evento: 'CONTESTA, y con datos: siete números de campaña de WhatsApp bajo el rótulo «CAT ATENCIÓN» —WA CAT General, WA SMNYL, WA Visión, WA Zurich Odontoprev, WA Ocesa Odontoprev, WA Gonher y WA Bimbo— y «los restantes tienen que ser» de Alejandra. Ninguno de los siete existe en nuestras fuentes, y tres de esas marcas no están en la tabla de destinos de voz.', tipo: 'ok' },
    { fecha: '19 Nov 2026',   responsable: 'Callpicker',        evento: 'Se carga la v4.0 en el módulo. Medido ese día: `data/analisis-llamadas.json` SIGUE con el archivo truncado —76,385 entrantes, 11 salientes—, así que el tablero continúa sirviendo las cifras que este expediente retira.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Nombre comercial',      value: 'OdontoPrev México' },
    { label: 'Razón social',          value: 'Odontored Seguros Dentales, S.A. de C.V.' },
    { label: 'Sector',                value: 'Seguros / salud dental — B2B, B2C y colectivos' },
    { label: 'Modelo',                value: 'Administra coberturas a través de una RED DE PRESTADORES. NO es cadena de clínicas propias.' },
    { label: 'Entrada a México',      value: '2015, mediante joint venture con Grupo IKÉ' },
    { label: 'Matriz',                value: 'Odontoprev Brasil. El vínculo con Bradesco está POR CONFIRMAR en `grupo_empresarial` y `notas` — pero `observaciones_kam` todavía lo afirma como hecho, y eso sigue publicado en la ficha.' },
    { label: 'Operación',             value: '~1 millón de asegurados · 320 clientes corporativos' },
    { label: 'Contactos vivos',       value: 'Oscar Guillermo Cisneros Linares (olinares@odontoprev.com.mx · 55 7112 6459) — volvió el 5 nov 2026 y contestó el 17 · y **Alejandra**, compañera suya que maneja la otra mitad de los números de WhatsApp: sin apellido, sin cargo y sin correo' },
    { label: 'Plantilla',             value: '11–50 en México (LinkedIn) · ~2,000 en el grupo global' },
    { label: 'Sede',                  value: 'UNA oficina corporativa: Av. Paseo de la Reforma 373, Piso 11, Col. Cuauhtémoc, CDMX 06500' },
    { label: 'Expansión mencionada',  value: 'Querétaro, Guanajuato y Nuevo León (Cámara México-Brasil, 2026). NO confirma oficinas físicas.' },
    { label: 'Teléfonos públicos',    value: '55 5480 0911 (directorio AMIS) · 55 5080 0200 y 55 5480 0777 (directorios comerciales, vigencia por comprobar)' },
    { label: 'Cliente desde',         value: '3 de julio de 2024 — 28 meses' },
    { label: 'Servicio contratado',   value: 'CP Chat + Paquete de SMS + Visibilidad y Control + DID' },
    { label: 'MRR institucional',     value: '$23,681.40 MXN — el `mrrFin` de las DOS líneas del mismo CID: «Odontoprev ATC» $20,176.40 (agrupada) + «Odontoprev» $3,505.00. La ficha guarda $23,325, o sea $356.40 menos. El `ganado` de $356.40 viene rotulado «Upsell por confirmar (corte de datos)», que no vouchea durabilidad, pero el dinero se facturó: el acumulado de ese renglón creció exactamente $39,996.40 en dos cortes, que es 19,820 + 20,176.40 al centavo.' },
    { label: 'Y de dónde salían los $10,901', value: 'Era el `acumulado ÷ meses` —el PROMEDIO DE VIDA, que es lo que `cuentas.facturacion` guarda por definición— de la línea pequeña en un corte de 23 meses: $250,731.12 ÷ 23 = $10,901.35. No era un MRR y no se compara con uno. Hoy ese cociente da $9,580.58 sobre 28 meses.' },
    { label: 'Cargo nuevo en la factura', value: '30,686 mensajes de servicio de WhatsApp × $0.35 = $10,740.10, el 46.0% sobre la base de voz de $23,325 (45.4% sobre los $23,681.40 vivos). Meta dejó de no cobrarlos el 1 oct 2026. PRIMERA incidencia de pago en 28 meses, y la planteó el cliente.' },
    { label: 'Bolsa de chat',         value: 'Contratada 25,000 mensajes. Último dato FIABLE: 86,492 en el corte del 2 sep — el 346%. El corte vigente NO se pudo leer (`operational_error`, `lecturaRota: true`, `mensajes: 0`), y ese cero no es desuso.' },
    { label: 'Uso real medido',       value: '93,929 llamadas entrantes y 56 salientes del 1 ene al 5 nov 2026 · 90,381 atendidas por un agente (96.22%) · 2,821 sin contestar (3.00%) · 712 que nunca volvieron (0.76%) · 13,266 horas de conversación y 8.81 min por llamada atendida (el documento publica las horas con tres valores —13,268, 13,267 y 13,266—; la que cierra contra las tablas es 13,266)' },
    { label: 'Números de WhatsApp',   value: 'SIN INVENTARIO. El cliente mandó SIETE el 17 nov 2026 y ninguno de los siete aparece en `data/`, `lib/` ni `app/`. `data/dids.json` tiene 21 números, pero son de VOZ. Lo más cercano es el corte de chat, que observó 19 bandejas y 25 agentes — y es justo el corte cuya lectura falló.' },
    { label: 'Health Score',          value: '72 — el más alto de las OCHO del TOP 50, no de todas las auditorías escritas: F4 Ancona tiene 76 y C26 Grupo 2711, 84 · adopción 100, pago 100, relacional 31 y actividad en el 50 por omisión, o sea medido al 65%' },
  ],

  necesidad_negocio: 'OdontoPrev no atiende pacientes: administra coberturas. Vende seguros dentales a empresas y a personas, y cuando un asegurado necesita algo, lo resuelve a través de una red de odontólogos afiliados. Su plantilla en México es de 11 a 50 personas y su operación cubre a cerca de un millón de asegurados de 320 clientes corporativos. Esa desproporción es el negocio, no una anomalía.\n\nY por eso el teléfono es su operación entera. Cada cliente corporativo tiene su propia línea —Asegurados Bradescard, Zurich Santander, Chubb, Quálitas, Price Waterhouse, OCESA, Tokio Marine, Bimbo, Welbe, Invisalign, Murguía Dental, Libertad Diamante— y los asegurados de cada uno marcan ahí; la del CAT general con IKÉ es la de su socio del joint venture, no la de un cliente. Son 93,929 llamadas entrantes en diez meses con 8.81 minutos de conversación por llamada atendida: trece mil horas de gente resolviendo coberturas, autorizaciones y citas. Para una empresa de cincuenta personas como máximo, el centro de atención es casi todo lo que hace. Y el CAT trabaja fin de semana: el sábado es su día más limpio.\n\nEso define qué significa una llamada perdida aquí: es un asegurado de un cliente corporativo que no fue atendido, y la queja no llega a OdontoPrev — llega a Bradescard, a IKÉ o a Zurich. El servicio que nos compra es, literalmente, cómo cumple frente a sus propios clientes. Y ahora sabemos que eso no se agota en la voz: el correo del 17 de noviembre enseñó que el chat atiende campañas de WhatsApp para marcas que la voz NO mide —SMNYL, Gonher y Visión entre ellas—, repartidas entre dos personas de su operación.\n\nLa necesidad que tiene hoy, y que es la más urgente que ha tenido en 28 meses, es de COSTO. Meta empezó a cobrar los mensajes de servicio el 1 de octubre y a Odontoprev le salieron 30,686: $10,740.10, el 46% sobre su voz. Él lo planteó así —«le llegó del doble»— y lo que necesita no es que se lo expliquemos, que ya se hizo, sino que alguien le diga cuántos de esos mensajes podían no haberse cobrado. Debajo de eso hay una necesidad que todavía no sabe que tiene: su bolsa contratada son 25,000 mensajes y el último dato fiable son 86,492 — el 346%. Y las otras dos siguen en pie: que el envío masivo deje de fallarle, porque veintiséis de sus cuarenta tickets son envíos masivos, campañas y plantillas; y que pueda ver qué línea suya funciona mejor, que ahora SÍ se puede porque el destino viene en el 98.95% del tráfico.',

  potencial_corto: [
    'Llevarle el desglose del cargo de Meta con el mix de mensajes: cuántos de los 30,686 cabían en la ventana gratuita de 72 horas y cuántos podían haber viajado como plantilla de utilidad. Es lo que pidió y es lo único que convierte una explicación en un ahorro.',
    'Medir nuestro propio excedente antes de esa conversación: la bolsa son 25,000 mensajes, el último dato fiable son 86,492 —el 346%— y el corte vigente no se pudo leer. Hoy no tenemos cifra propia para una negociación que es nuestra.',
    'Arreglar el enrutamiento de la línea 36813: 1,198 sin contestar de 1,291, el 42.47% de todas las pérdidas de la cuenta sobre el 1.37% de su volumen. Y antes, preguntar si esa persona sigue en la operación. Más la 36831 de Welbe, 9 de 10.',
    'Decidir qué pasa después de las 20:00: 553 llamadas se caen fuera de las 7 a las 20, el 19.6% de todas las pérdidas sobre el 1% del tráfico. Es el caso de uso más limpio de IA de voz que tiene esta cuenta, y se sostiene con sus propios datos.',
    'Pedir la lista de números de Alejandra y su correo: el etiquetado que el cliente ya aceptó está parado por eso, y no se puede deducir porque no tenemos inventario de números de WhatsApp.',
    'Explicarle los dos tickets que tardaron 277 y 113 días en cerrarse, antes de que los saque él. Están cerrados, pero el cliente los vivió: llegar a hablar de crecimiento sin haberlos explicado le entrega el argumento.',
    'Identificar al responsable de telefonía: Guillermo volvió, pero sigue sin estar en la operación y la conversación de noviembre fue de facturación. Alejandra es la vía más corta que hay hoy.',
  ],

  potencial_largo: [
    'Reporte por cliente corporativo: cada línea es un contrato suyo con Bradescard, Zurich, OCESA o cualquiera de las otras marcas que etiquetan sus 21 números —la de IKÉ es la de su socio, no la de un cliente—. Un informe de atención por línea es material con el que él cumple frente a SUS clientes, no una función más.',
    'IA de Chat: no la tiene contratada, y el chat es justo donde se concentran todos sus tickets. Es el producto que resolvería su dolor conocido.',
    'IA de Voz: tampoco contratada. Con 13,266 horas de conversación, un CAT que trabaja fin de semana y 553 llamadas que se caen fuera de las 7 a las 20, hay franja para automatizar lo repetitivo — y la franja nocturna es el caso de uso más limpio, porque hoy esas llamadas no las atiende nadie.',
    'Integración API: no la nombra su servicio contratado —«CP Chat + Paquete de SMS + Visibilidad y Control + DID»— ni tiene registro de adopción. El flag `tiene_integracion_api` NO es la prueba y no se cita como tal: está en falso en 221 de las 223 cuentas de la tabla y nunca se pobló. Una aseguradora que valida coberturas por teléfono es el caso natural de una consulta automatizada contra su sistema.',
  ],

  tacticas: [
    { nombre: 'Llegar con el mix, no con la explicación', descripcion: 'La explicación del cargo de Meta ya se dio el 5 de noviembre y no cerró nada. Lo que mueve la conversación es el desglose: cuántos de los 30,686 mensajes cabían en la ventana gratuita y cuántos podían ser plantilla de utilidad.', impacto: 'Convierte «no es culpa nuestra» en «esto es lo que puedes dejar de pagar», que es lo único que resuelve una incidencia de pago.' },
    { nombre: 'Decirle lo de la bolsa antes de que lo descubra en una factura', descripcion: 'Su bolsa contratada son 25,000 mensajes y el último dato fiable son 86,492: el 346%. Llevarlo nosotros, con la propuesta de plan más amplio que ya se insinuó en la reunión.', impacto: 'Es la conversación más grande de las dos, y es la única que puede acabar en un plan mayor en vez de en una queja.' },
    { nombre: 'Abrir con el 96.22% y con las 712', descripcion: 'De 93,929 llamadas, un agente atendió el 96.22%, y lo que de verdad se perdió son 712 —el 0.76% del tráfico—. Es verdad, es suyo y es una buena noticia que nadie le ha dado.', impacto: 'Compra el derecho a hablar después de la extensión rota y del cargo, y le da una cifra con la que defenderse ante sus propios clientes corporativos.' },
    { nombre: 'Llevar el destino roto con nombre, cifra y la pregunta incómoda', descripcion: '«Hay una línea que enruta a una extensión a nombre de Carlos Alberto Rojas Chávez: recibió 1,291 llamadas y sólo 93 las tomó alguien». Y luego la pregunta: ¿sigue esa persona en la operación? Si no está, llevamos desde enero mandando clientes a una extensión vacía.', impacto: 'Demuestra que miramos su operación al detalle, resuelve el 42.47% de sus pérdidas, y la pregunta es lo que separa un cambio de configuración de una conversación más larga.' },
    { nombre: 'Enseñarle que en octubre el daño cambió de forma', descripcion: 'De enero a junio esa extensión recibía llamadas de tres números en bucle: parecía un marcador automático. Desde el 6 de octubre son 68 números distintos marcando una vez cada uno, y 378 no volvieron. El volumen bajó y el daño subió.', impacto: 'Es el argumento de urgencia, y es suyo: son sus asegurados los que no encontraron a nadie.' },
    { nombre: 'Reconocer los 277 días de resolución antes de que lo saque él', descripcion: 'Llevarlo nosotros a la mesa: ya está cerrado, pero tardó 277 días —y la cifra creció desde los 246 que publicamos, porque el folio se reabrió—. Con la causa por escrito y la medida que evita el siguiente.', impacto: 'Quita de la conversación la única objeción que no se puede contestar con datos, y llega con la cifra correcta en vez de con una que él puede corregirnos.' },
    { nombre: 'Pedir el saliente como piloto, no como capacidad', descripcion: '56 llamadas salientes en diez meses y 157 días sin marcar ninguna. Una extensión, un guion de confirmación de cita o de cobranza, y una meta semanal.', impacto: 'Es la conversación de expansión que esta cuenta nunca ha tenido, y entra por una necesidad suya en vez de por una lista de módulos.' },
  ],

  senal_alarma: 'Una cuenta de $23,681.40 al mes que en 28 meses no tuvo una sola incidencia de pago y acaba de tener la primera: $10,740.10 de mensajes de WhatsApp que antes costaban cero. El cargo es de Meta, no nuestro — pero la bolsa propia va al 346% y no lo hemos medido, el cliente lo planteó antes que nosotros, el etiquetado que aceptó está parado esperando una lista, y la ficha que abre el asesor todavía publica tres afirmaciones que este expediente ya retiró. El servicio de voz funciona, lo cual es justamente lo que ha hecho que nadie mirara el otro canal.',

  problema_raiz: 'Miramos con detalle el canal que funciona —la voz— y el que decide la relación, el chat, lo medimos con una fuente que no se puede leer: cuando llegó la primera factura con sorpresa, el cliente tenía más datos que nosotros.',

  problema_raiz_detalle: 'EL 5 DE NOVIEMBRE EL CLIENTE NOS ENSEÑÓ UN NÚMERO QUE NOSOTROS NO TENÍAMOS. Guillermo escribió —vía José Galván, por chat— que «le llegó del doble su factura y quieren ver por qué». Se le explicó bien y rápido: Meta dejó de no cobrar los mensajes de servicio el 1 de octubre, son 30,686 mensajes a $0.35, $10,740.10. Hasta ahí la respuesta es correcta y está documentada. Lo que no se pudo hacer es la otra mitad: decirle cuánto de ese consumo es evitable, porque nuestra propia medición del chat no se puede leer. En `app/callpicker-chat/chat-data.ts` el corte vigente de este CID trae `operational_error`, `lecturaRota: true` y `mensajes: 0`, y ese cero no significa que dejó de usarlo. El último dato fiable son 86,492 mensajes contra una bolsa de 25,000: el 346%. O sea que en la conversación más delicada de los 28 meses, el cliente llegó con una factura y nosotros con una explicación, no con una cifra.\n\nLA PRIMERA CAPA DE POR QUÉ ES DE ATENCIÓN DESIGUAL ENTRE CANALES. La voz la medimos al detalle —93,929 llamadas, 21 líneas una por una, el reparto por hora y por día, la recuperación por destino— y la voz es justo lo que funciona: 96.22% atendidas. El chat, que es donde están 36 de sus 40 tickets y de donde salió el cargo, lo medimos con una fuente que falla y cuyo fallo se ve como un cero. Un cero se lee como desuso, y el desuso no preocupa a nadie: así es como una cuenta que consume el 346% de su bolsa pasa por una cuenta sin actividad de chat.\n\nLA SEGUNDA ES DE AGREGACIÓN, Y ES LA MISMA QUE EN LA v3.0 CON OTRA CIFRA. La cuenta pierde el 3.00% de sus llamadas, que es aceptable y no invita a investigar. Pero ese promedio mezcla líneas impecables —Bradescard al 0.6%— con una extensión que deja sin contestar el 92.8% de lo que recibe. Mirando sólo el total es invisible; mirando por destino es el 42.47% de todas las pérdidas sobre el 1.37% del tráfico. Y hay un segundo eje que ningún tablero nuestro enseña: la HORA. Fuera de las 7 a las 20 entran 938 llamadas y se caen 553 — otro 19.6% de las pérdidas en el 1% del volumen. El promedio no mintió: ocultó dos veces.\n\nLA TERCERA ES QUE NUESTRAS PROPIAS FUENTES SE QUEDARON VIEJAS Y NADIE LO NOTÓ. La exportación de llamadas que alimenta el tablero está truncada en las dos direcciones y sigue estándolo: 76,385 entrantes con corte al 14 de septiembre y 11 salientes, medido el 19 de noviembre. Durante dos meses el tablero publicó un «51.4% del tráfico sin destino» que era un defecto del archivo, y un septiembre al 1.57% que era medio mes. El expediente se corrigió y la ficha no: `observaciones_kam` todavía afirma «83 días de silencio», «la mitad de las pérdidas en TRES destinos» y «un ticket que lleva 5,908 horas ABIERTO». Corregir el expediente y dejar la ficha como estaba es dejar publicada la versión vieja justo donde el asesor mira primero.\n\nY LA CUARTA, QUE ES LA QUE CONVIENE NO PERDER DE VISTA: ESTA VEZ LA RELACIÓN RESPONDIÓ. El cliente planteó el problema, hubo reunión en 48 horas —la primera en 28 meses—, se le explicó con el documento de Meta a la vista, se le propuso un plan más amplio y él contestó el 17 de noviembre con datos. Eso es lo contrario de lo que decía la v3.0. Lo que falta ya no es interlocutor: es que lleguemos a la próxima conversación con la mitad que nos toca medida.\n\n── LO QUE SIGUE ES EL DIAGNÓSTICO DE LA v3.0, QUE SE CONSERVA PORQUE EXPLICA CÓMO SE LLEGÓ HASTA AQUÍ ──\n\nEl 22 de julio de 2026 el cliente nos dijo algo importante y quedó escrito en nuestra propia ficha: Guillermo Cisneros, el único contacto registrado, respondió que «actualmente no participa de forma directa en la operación» y que validaría la información con su equipo antes de darnos retroalimentación. Esa retroalimentación nunca llegó, y en los 83 días siguientes nadie buscó a quién la tenía. La frase estaba ahí, en el seguimiento, legible. Un cliente que te avisa de que has dejado de hablar con la persona correcta te está dando la oportunidad de corregirlo, y la dejamos pasar.\n\nLa primera capa de por qué pasó es que los números iban bien. La pérdida de llamadas bajó de 5.0% a 1.9% mientras el volumen crecía, y el Health Score es 72, el más alto de las OCHO del TOP 50 —y el tercero de las 42 auditorías escritas: C26 Grupo 2711 tiene 84 y F4 Ancona, 76—. Cuando el semáforo mejora, la cuenta deja de subir a la cola de nadie. Es la misma mecánica que en ECODELI —una cuenta que no da problemas no es una cuenta atendida— sólo que aquí es más engañosa, porque la mejora era real.\n\nLa segunda es que se miró el canal equivocado. El servicio de voz, que es lo que el tablero mide con detalle, es justamente lo que funciona. El canal que falla es el chat: veinte de sus treinta tickets son sobre envíos masivos y campañas, hay cinco fallas registradas y uno de esos tickets tardó 246 días en cerrarse. El propio asesor lo diagnosticó bien el 16 de julio —«la categoría con mayor recurrencia es Asistencia en Chat… la demanda de soporte es de carácter operativo»— pero la conclusión que se sacó fue que la cuenta estaba estable, cuando lo que ese patrón decía es que el cliente necesita del producto algo que el producto no le está dando solo.\n\nLa tercera es de agregación, y es la que esconde el hallazgo más accionable. La cuenta pierde el 3.17% de sus llamadas, que es una cifra aceptable y no invita a investigar. Pero ese promedio mezcla líneas impecables —Bradescard al 0.5%— con una extensión personal que deja sin contestar el 91.0% de lo que recibe. Mirando sólo el total es invisible; mirando por destino es el 37.9% de todas las pérdidas sobre el 1.32% del tráfico. El promedio no mintió: ocultó.\n\nY la cuarta es de ficha. El importe de la ficha era el 47% del MRR institucional porque no era un MRR: era el `acumulado ÷ meses` —el promedio de vida— de UNA de las dos líneas del GRC, congelado en un corte en que ese renglón llevaba 23 meses ($250,731.12 ÷ 23 = $10,901.35); el correo del contacto vivía dentro del campo de nombre, donde ningún automatismo lo ve; y `contactos_json` estaba vacío en una cuenta de 27 meses. Nada de eso es culpa de quien la atiende: es que la ficha no obliga a nada y nadie revisa si lo que guarda es cierto.',

  flujo_real: [
    { fase: 'El asegurado marca',      area: 'Cliente de Bradescard, Zurich u OCESA', accion: 'Llama a la línea de su propio corporativo', resultado: '93,929 llamadas entrantes en diez meses, 8.81 min por atendida' },
    { fase: 'Entra por su línea',      area: 'Callpicker',          accion: 'La llamada se dirige al destino de ese cliente corporativo', resultado: '19 de las 21 líneas pierden menos del 4% · Bradescard 0.6% · CAT IKÉ 2.2%' },
    { fase: '…salvo dos líneas',       area: 'Callpicker / OdontoPrev', accion: 'La 36813 enruta a una extensión personal que casi nunca contesta, y la 36831 de Welbe está rota', resultado: '1,198 sin contestar de 1,291 — el 42.47% de las pérdidas sobre el 1.37% del volumen' },
    { fase: '…o salvo la hora',        area: 'Callpicker / OdontoPrev', accion: 'La llamada entra fuera de las 7 a las 20 y ya no hay quien conteste, pero sigue entrando igual', resultado: '553 de 938 se caen — otro 19.6% de las pérdidas en el 1% del tráfico' },
    { fase: 'Un agente del CAT atiende', area: 'OdontoPrev',        accion: 'Resuelve cobertura, autorización o cita', resultado: '13,266 horas de conversación con una plantilla de 11–50 personas' },
    { fase: 'El que no fue atendido vuelve a marcar', area: 'Cliente', accion: 'Reintenta, y casi siempre lo consigue', resultado: '63.2% atendido en 24 h y 74.8% en la semana. Los que no volvieron: 712 — el 0.76%' },
    { fase: 'El tablero lo evalúa',    area: 'Dashboard',           accion: 'Publica el 3.00% de pérdida del total, y lo hace sobre una exportación truncada', resultado: 'Cifra aceptable que esconde una extensión al 92.8% y un bloque horario al 59.0%' },
    { fase: 'El cliente pide campañas',area: 'Mesa de ayuda',       accion: 'Abre ticket de envío masivo, reporte de campaña o plantilla verificada', resultado: '26 de 40 tickets · 36 de canal chat · 5 fallas, las mismas cinco desde el 1 de septiembre' },
    { fase: 'Y manda mensajes de WhatsApp', area: 'OdontoPrev',     accion: 'Campañas por siete números suyos y los que maneja Alejandra', resultado: '30,686 mensajes de servicio en el corte. Y 86,492 en el último corte legible, sobre una bolsa de 25,000: el 346%' },
    { fase: 'Meta cambia el precio',   area: 'Meta',                accion: 'Deja de no cobrar los mensajes de servicio el 1 de octubre', resultado: '$10,740.10 en la factura, un 46% sobre su voz. Primera incidencia de pago en 28 meses' },
    { fase: 'El cliente lo ve primero', area: 'OdontoPrev',         accion: 'Escribe por chat: «le llegó del doble su factura y quieren ver por qué»', resultado: 'Reunión en 48 horas, la primera en 28 meses. Se explica el cargo, pero no el mix: nuestra fuente de chat no se puede leer' },
  ],

  comparativo: [
    { metrica: 'Cargo de WhatsApp en la factura', real: '$10,740.10 — 30,686 mensajes de servicio × $0.35, el 46% sobre la voz. Primera incidencia de pago en 28 meses', ideal: 'Un desglose por tipo de mensaje y cuántos caben en la ventana gratuita, antes de la próxima factura' },
    { metrica: 'Bolsa de mensajes propia', real: '346% — 86,492 sobre 25,000, y ése es el último dato FIABLE: el corte vigente no se pudo leer', ideal: 'Dentro de la bolsa, o una bolsa del tamaño del consumo real' },
    { metrica: 'Medición del chat', real: 'ROTA — `operational_error`, `lecturaRota: true`, `mensajes: 0`. El cero no es desuso', ideal: 'Un corte que se lea, para poder negociar con cifras propias' },
    { metrica: 'Importe en la ficha', real: '$23,325 — $356.40 por debajo del GRC vivo', ideal: '$23,681.40 — el `mrrFin` de las DOS líneas del mismo CID' },
    { metrica: 'Llamadas atendidas por un agente', real: '96.22% — 90,381 de 93,929', ideal: 'Ya va bien. Es lo que hay que decirle primero.' },
    { metrica: 'La peor ruta real', real: '92.8% sin contestar — 1,198 de 1,291, en la línea 36813', ideal: 'Al nivel del resto de sus destinos: menos del 2.2%' },
    { metrica: 'Concentración de las pérdidas', real: '42.47% en una sola extensión, sobre el 1.37% del tráfico', ideal: 'Repartidas, o sea sin un cuello identificable' },
    { metrica: 'Pérdidas fuera de 7–20 h', real: '19.6% de todas, sobre el 1.0% del volumen. A las 21:00 entran 492 y un agente toma 4', ideal: 'Un buzón con compromiso de devolución, un mensaje de horario, o un agente de voz con IA' },
    { metrica: 'Lo que de verdad se perdió', real: '712 llamadas — el 0.76% del tráfico', ideal: 'Es el tamaño real del daño, y la cifra que defiende la cuenta' },
    { metrica: 'Tráfico sin destino registrado', real: '1.05% — 989 llamadas, de ellas 618 sin contestar', ideal: '0%. El «51.4%» de la v3.0 era el archivo truncado, no el cliente' },
    { metrica: 'Marcación saliente', real: '56 llamadas en diez meses desde 2 extensiones, y 157 días sin marcar ninguna', ideal: 'Un caso de uso con extensión, guion y meta semanal: cobranza o confirmación de cita' },
    { metrica: 'Ticket que más tardó en cerrarse', real: '6,651.2 horas · 277 días — 8 ene → 13 oct. La v3.0 publicó 246 porque el folio se reabrió después', ideal: 'Ninguno fuera de SLA' },
    { metrica: 'Tickets abiertos hoy', real: 'NO MEDIBLE — el export sólo trae cerrados: 2 filas sin cierre de 8,281', ideal: 'Un export que traiga también los abiertos' },
    { metrica: 'Tickets por encima de 7 días', real: '9 de 40 (22.5%)', ideal: '<5%' },
    { metrica: 'Fallas del servicio', real: '5 de 40 (12.5%) — LAS MISMAS CINCO, la última abierta el 1 de septiembre', ideal: 'Diez tickets nuevos sin una falla nueva ya es la tendencia buena' },
    { metrica: 'Inventario de números de WhatsApp', real: 'NO EXISTE. El cliente mandó siete el 17 nov y ninguno aparece en nuestras fuentes', ideal: 'La lista completa, y con dueño: cuáles son de Guillermo y cuáles de Alejandra' },
    { metrica: 'Responsable de telefonía', real: 'SIN IDENTIFICAR en ninguna fuente. Guillermo volvió, pero por facturación y sin estar en la operación', ideal: 'Un nombre con correo' },
    { metrica: 'Reuniones en 28 meses', real: 'UNA — 5 nov 2026, por facturación', ideal: 'Trimestral: 9' },
    { metrica: 'Radar de 12 preguntas', real: '0 respondidas', ideal: '12 de 12' },
    { metrica: 'Días desde el último contacto', real: '2 — último contacto el 17 nov 2026', ideal: '<30. Ya está' },
    { metrica: 'Alertas abiertas', real: 'TRES: `sin_radar`, `sac_fallas_recurrentes` y `sin_consumo_medible` (CRÍTICA, dueño ingeniería)', ideal: 'Cero. Y la crítica NO la cierra este reporte: mide otra cosa' },
  ],

  plan_inmediato: [
    { accion: 'MEDIR NUESTRO PROPIO EXCEDENTE DE MENSAJES ANTES DE VOLVER A SENTARSE CON ÉL. La bolsa contratada son 25,000 y el último dato fiable son 86,492 en el corte del 2 de septiembre: el 346%. El corte vigente NO se pudo leer, así que hoy no tenemos cifra. Negociar el cargo de Meta sin esto es negociar la mitad del problema, y la mitad que falta es la nuestra', responsable: 'Ingeniería / Erick', criterio: 'Un corte de Callpicker Chat que se lea para este CID, con el consumo del mes y el reparto por tipo de mensaje' },
    { accion: 'CERRAR EL DESGLOSE DE LA FACTURA QUE EL CLIENTE YA PIDIÓ: cuántos de los 30,686 mensajes de servicio cabían en la ventana gratuita de 72 horas, cuántos podrían haber viajado como plantilla de utilidad, y si los $0.35 son costo trasladado o llevan margen. Daniel ya mostró un reporte de consumo en la reunión del 5 nov: lo que falta es el MIX, no el total', responsable: 'Daniel / Facturación', criterio: 'Un desglose por tipo de mensaje y un número de ahorro posible, no una hipótesis' },
    { accion: 'PEDIR LA LISTA DE ALEJANDRA, Y PEDIRLA SABIENDO QUE NO LA PODEMOS DEDUCIR. Guillermo mandó sus siete números el 17 nov y dijo que «los restantes tienen que ser» de ella. Ninguno de los siete existe en nuestras fuentes y no tenemos inventario de números de WhatsApp, así que la resta no es posible: hay que pedirla, y pedir también su apellido y su correo', responsable: 'Erick', criterio: 'La lista completa con dueño por número, y Alejandra capturada en `contactos_json`' },
    { accion: 'CORREGIR LA FICHA, QUE TODAVÍA PUBLICA TRES AFIRMACIONES RETIRADAS. `observaciones_kam` conserva el addendum del 13 oct con «83 días de silencio», «la mitad de las pérdidas en TRES destinos que son el 1.92% del volumen» y «un ticket que lleva 5,908 horas ABIERTO: 246 días». Las dos últimas las tumbó la v2.0 hace un mes. Y de paso, `cuentas.facturacion`: $23,325 → $23,681.40', responsable: 'Erick / Facturación', criterio: 'Los tres párrafos reescritos y el importe al día, comprobado leyendo de vuelta' },
    { accion: 'RECARGAR `data/analisis-llamadas.json` CON LA EXPORTACIÓN COMPLETA. Hoy sigue con 76,385 entrantes y 11 salientes —medido el 19 nov—, o sea con el archivo que esta versión retira. Mientras no se recargue, el tablero y este expediente dicen cifras distintas de la misma cuenta, y el cliente puede verlas las dos', responsable: 'Ingeniería', criterio: 'El tablero publica 93,929 entrantes y 56 salientes, y la ficha deja de contradecir al expediente' },
    { accion: 'ARREGLAR EL ENRUTAMIENTO DE LA LÍNEA 36813, que marca a la extensión «Rojas Chávez Carlos Alberto Octaviano»: 1,198 sin contestar de 1,291, el 42.47% de las pérdidas de la cuenta sobre el 1.37% del tráfico. ANTES de tocarlo, preguntar si esa persona sigue en la operación de Odontoprev: si no está, llevamos desde enero mandando clientes a una extensión vacía, y eso cambia la conversación. Y revisar también la 36831 de Welbe, que deja sin contestar 9 de 10: son pocas, pero está rota y es barata de cerrar', responsable: 'Ingeniería / Erick', criterio: 'Las dos líneas por debajo del 5% sin contestar, o retiradas si ya no deben existir' },
    { accion: 'DECIDIR QUÉ PASA DESPUÉS DE LAS 20:00. Hoy la llamada entra y se cae: fuera de las 7 a las 20 entran 938 llamadas y quedan sin contestar 553, el 19.6% de todas las pérdidas sobre el 1.0% del tráfico. A las 21:00 entran 492, un agente toma 4 y se pierden 298. Un buzón con compromiso de devolución, un mensaje de horario o un agente de voz con IA convierten esas 553 en contactos registrados', responsable: 'Erick / Producto', criterio: 'Una decisión escrita sobre la ventana de servicio — y antes, confirmar las horas con el cliente: el archivo no trae zona horaria' },
    { accion: '✓ CERRADA POR HECHOS — «preguntar por el Downgrade de la línea Odontoprev ATC». Se recuperó y se superó: $20,018 → $19,820 → $20,176.40, o sea $158.40 arriba del 2 de octubre, y el acumulado prueba que se facturó. Sigue sin saberse qué se redujo en medio, pero ya no es un riesgo abierto', responsable: '—', criterio: 'Sin tarea. Si el renglón vuelve a bajar, se reabre' },
    { accion: '✓ CERRADA — «primera reunión en 28 meses». Hecha el 5 nov 2026 por Teams: «Revisión de Facturación | Actualización de tarifas Meta», con Erick, Daniel y dirección. Lo que NO se hizo en ella es el Radar, que sigue en 0 de 12', responsable: '—', criterio: 'Sin tarea. El Radar pasa a plan de mediano plazo' },
    { accion: '✓ HECHO el 13 oct 2026 — Corregido el importe de la ficha: $10,901 → $23,325, que son las DOS líneas del mismo CID. Y capturados 8 contactos donde había cero, con el correo sacado del campo de nombre', responsable: 'Claudia / Facturación', criterio: 'Aplicado y comprobado leyendo de vuelta con `scripts/enriquece-odontoprev.py`' },
    { accion: '✓ EXPLICADOS, PERO LA CIFRA CAMBIÓ — el folio 385 ya no son 246 días: son 277, porque se reabrió después del 12 de septiembre y volvió a cerrarse el 13 de octubre. Los dos casos siguen CERRADOS, así que no hay nada que cerrar: lo que falta es por qué tardaron y qué evita el tercero. Y la lección de método: una cifra copiada del export de tickets envejece, y siempre hacia arriba', responsable: 'Mesa de ayuda', criterio: 'Causa escrita de los dos casos y una medida de contención, antes de la conversación comercial' },
    { accion: 'RETIRADA el 13 oct 2026 — no había contradicción que resolver: `tiene_pago_automatico` está en FALSO en las 223 cuentas de la tabla y nunca se pobló, así que no contradice al registro de adopción. No se le pregunta al cliente por un campo vacío nuestro', responsable: '—', criterio: 'Sin tarea: el flag no es una medición (`lib/adopcion-auto.ts`)' },
  ],

  plan_mediano: [
    { accion: 'RETIRADA — «etiquetar el 51.4% del tráfico sin destino». En la exportación completa sólo el 1.05% (989 llamadas) no trae destino. Lo que queda es mucho más chico y se revisa con soporte: de esas 989, 371 las resolvió el menú y 618 quedaron sin contestar sin que el archivo diga a dónde iban. Es el único punto ciego que queda en la medición de voz', responsable: 'Ingeniería', criterio: 'Una explicación escrita de las 989, no un proyecto de etiquetado' },
    { accion: 'CONTESTAR EL RADAR, que sigue en 0 de 12 aunque ya haya reunión. La del 5 nov fue de facturación y no lo tocó. Y una segunda reunión, ésta de SERVICIO, con quien opere el CAT: la de noviembre no nos acercó al responsable de telefonía', responsable: 'Erick', criterio: 'Radar contestado y una reunión de servicio con minuta' },
    { accion: 'COMPLETAR EL ETIQUETADO QUE EL CLIENTE YA ACEPTÓ: separar los consumos de Guillermo y de Alejandra manteniendo una sola factura. Es el acuerdo de la reunión del 5 nov, está parado desde entonces, y lo único que falta es la lista de ella', responsable: 'Erick / Ingeniería', criterio: 'El cliente puede ver sus cargos separados por responsable en una factura' },
    { accion: 'PREGUNTAR POR LA CAÍDA DE LA DURACIÓN PROMEDIO, de 10.7 a 7.1 minutos por llamada atendida mientras el volumen crecía. El archivo no dice cuál de las dos cosas es: si es eficiencia, es un logro del cliente que nadie ha medido y conviene que lo vea; si no lo es, es un síntoma', responsable: 'Erick', criterio: 'Una respuesta del cliente, no una interpretación nuestra' },
    { accion: 'Atacar de raíz el envío masivo Y los reportes de campaña: 26 de 40 tickets —11 de envío masivo, 11 de reporte de campaña y 4 de plantillas verificadas— y 3 de las 5 fallas son eso. O es una capacitación que no se dio, o es una función que no cubre lo que el cliente necesita. Y ahora tiene una segunda consecuencia: cada campaña que se manda a mano son mensajes que se facturan', responsable: 'Mesa de ayuda / Producto', criterio: 'Cero tickets de envío masivo durante 60 días' },
    { accion: 'Confirmar o descartar el vínculo con Bradesco que la ficha afirmaba y la investigación no respalda — y mientras tanto corregir `observaciones_kam`, que sigue afirmándolo como hecho aunque `grupo_empresarial` y `notas` ya digan POR CONFIRMAR', responsable: 'Erick', criterio: 'Los TRES campos dicen lo mismo, y dicen lo que se puede sostener con su fuente' },
  ],

  plan_estrategico: [
    { accion: 'Reporte de atención por cliente corporativo. Cada destino es un contrato suyo —Bradescard, Zurich, OCESA, Welbe y las ocho marcas más que etiquetan sus 21 números; la de IKÉ es la de su socio—: un informe por línea es con lo que él cumple frente a SUS clientes', responsable: 'Producto / Erick', criterio: 'El cliente recibe un reporte mensual por línea corporativa' },
    { accion: 'IA de Chat: es el canal donde se concentran todos sus tickets, y no la tiene contratada', responsable: 'Erick', criterio: 'Propuesta presentada citando sus propios 20 tickets de campañas y envíos masivos' },
    { accion: 'IA de Voz para la franja de fin de semana: el CAT atiende sábado (6,997 llamadas) y domingo (2,561)', responsable: 'Erick', criterio: 'Propuesta con el perfil real de su tráfico de fin de semana' },
    { accion: 'QUE EL TABLERO MUESTRE LA PÉRDIDA POR DESTINO, NO SÓLO EL TOTAL. El 3.00% de esta cuenta es aceptable y esconde una extensión al 92.8% —1,198 sin contestar de 1,291— que concentra el 42.47% de las pérdidas sobre el 1.37% del tráfico. El promedio no mintió: ocultó. Y lo mismo con el eje de la HORA: el 19.6% de las pérdidas cae fuera de 7–20 h, en el 1.0% del volumen, y ningún tablero nuestro lo enseña', responsable: 'Producto / Dirección', criterio: 'La ficha de cuenta señala los destinos y las horas cuya pérdida se aparta del resto' },
    { accion: 'ABRIR LA MARCACIÓN SALIENTE COMO CONVERSACIÓN DE EXPANSIÓN, con un caso de uso concreto y no como venta de capacidad: cobranza o confirmación de cita, con una extensión, un guion y una meta semanal. Hoy la cuenta hizo 56 llamadas salientes en diez meses y lleva 157 días sin marcar ninguna — por cada llamada que sale, entran 1,677. En una aseguradora de un millón de asegurados, cero marcación no es falta de necesidad: es falta de configuración, de capacitación o de ambas', responsable: 'Erick / Producto', criterio: 'Un piloto con una extensión y una meta semanal, medido' },
  ],

  areas_oportunidad: [
    { area: 'El mix de mensajes de WhatsApp', impacto: '30,686 mensajes de servicio, $10,740.10. Cuántos cabían en la ventana gratuita de 72 horas es la pregunta de la que depende el ahorro', responsable: 'Daniel / Facturación' },
    { area: 'La bolsa de chat, rebasada y sin medir', impacto: '86,492 mensajes sobre 25,000 contratados —el 346%— y el corte vigente no se pudo leer. Es la conversación de plan mayor', responsable: 'Ingeniería / Erick' },
    { area: 'La línea 36813, mal enrutada', impacto: '1,198 llamadas sin contestar de 1,291: el 42.47% de las pérdidas de la cuenta sobre el 1.37% de su volumen', responsable: 'Ingeniería' },
    { area: 'La ventana de servicio después de las 20:00', impacto: '553 pérdidas en el 1% del tráfico. Es el caso de uso más limpio de IA de voz que tiene la cuenta', responsable: 'Erick / Producto' },
    { area: 'La marcación saliente, apagada', impacto: '56 llamadas en diez meses y 157 días sin marcar. Cobranza, renovación y confirmación de cita en una aseguradora de un millón de asegurados', responsable: 'Erick / Producto' },
    { area: 'El envío masivo y los reportes de campaña, en el chat', impacto: '26 de 40 tickets —11 de envío masivo, 11 de reporte de campaña y 4 de plantillas— y 3 de las 5 fallas', responsable: 'Mesa de ayuda / Producto' },
    { area: 'Reporte por cliente corporativo', impacto: 'Ahora SÍ se puede: el destino viene en el 98.95% del tráfico. Es con lo que el cliente cumple frente a Bradescard, Zurich, OCESA y Chubb', responsable: 'Producto' },
    { area: 'IA de Chat', impacto: 'El canal que le falla y donde está el cargo, sin producto que lo resuelva', responsable: 'Erick' },
    { area: 'Inventario de números de WhatsApp', impacto: 'No existe. Bloquea el etiquetado que el cliente ya aceptó, y nos deja sin forma de auditar su consumo', responsable: 'Ingeniería' },
    { area: 'Integración API', impacto: 'Validación de coberturas por teléfono, hoy manual', responsable: 'Ingeniería' },
  ],

  perfiles: [
    {
      nombre: 'Oscar Guillermo Cisneros Linares', rol: 'Líder de Operaciones CAT — OdontoPrev', color: '#22c55e',
      campos: [
        { label: 'Correo',    value: 'olinares@odontoprev.com.mx · 55 7112 6459' },
        { label: 'Lo que dijo en julio', value: '22 jul 2026: «actualmente no participa de forma directa en la operación». Prometió validar con su equipo y no volvió.' },
        { label: 'VOLVIÓ, Y VOLVIÓ ÉL', value: 'El 5 nov 2026 planteó la factura por chat —«le llegó del doble»—, tomó la llamada de Teams ese mismo día a las 16:00, dejó pasar el correo del 10 sin respuesta, y el 17 de noviembre CONTESTÓ con datos.' },
        { label: 'Lo que mandó el 17 nov', value: 'Siete números de campaña de WhatsApp bajo «CAT ATENCIÓN»: WA CAT General, WA SMNYL, WA Visión, WA Zurich Odontoprev, WA Ocesa Odontoprev, WA Gonher y WA Bimbo. Y que «los restantes tienen que ser» de Alejandra.' },
        { label: 'Qué sigue siendo cierto', value: 'Que no está en la operación. La conversación de noviembre fue de FACTURACIÓN, así que tenerlo de vuelta no es haber encontrado al responsable del servicio.' },
      ],
    },
    {
      nombre: 'Alejandra', rol: 'Operación / campañas de WhatsApp — OdontoPrev', color: '#f59e0b',
      campos: [
        { label: 'Qué sabemos', value: 'Sólo lo que Guillermo escribió el 17 nov 2026: es «compañera» suya y maneja los números de WhatsApp que no son los siete de él. Sin apellido, sin cargo y sin correo.' },
        { label: 'Por qué importa', value: 'Maneja la otra mitad del consumo que estamos intentando separar. El etiquetado que el cliente ACEPTÓ en la reunión del 5 nov está parado esperando su lista.' },
        { label: 'Y no se puede deducir', value: 'Ninguno de los siete números que mandó Guillermo aparece en `data/`, `lib/` ni `app/`, y no tenemos inventario de números de WhatsApp. La resta no es posible: hay que pedirla.' },
        { label: 'Es la vía más corta', value: 'Es la única persona nueva de la operación que ha aparecido en 28 meses, y es de la operación — no de facturación.' },
      ],
    },
    {
      nombre: 'Mércia Leite Nagem', rol: 'CEO / Directora General México — OdontoPrev', color: '#6366f1',
      campos: [
        { label: 'Fuente',    value: 'Identificada públicamente por la Cámara México-Brasil, 2026' },
        { label: 'Contacto',  value: 'SIN teléfono ni correo público verificable' },
        { label: 'Papel',     value: 'Patrocinador ejecutivo potencial en una plantilla de 11–50 personas, donde la dirección está cerca de la operación' },
      ],
    },
    {
      nombre: 'Responsable de telefonía', rol: 'SIN IDENTIFICAR — OdontoPrev', color: '#ef4444',
      campos: [
        { label: 'Qué sabemos', value: 'Nada. Ni la ficha ni la investigación pública identifican CIO, gerente de infraestructura o responsable del servicio.' },
        { label: 'Por qué importa', value: 'Es quien decide sobre un contrato de $23,681.40 al mes, y es quien tendría que responder si la persona cuyo nombre lleva la extensión 36813 sigue en la operación — la pregunta de la que depende si el punto uno del plan es un cambio de configuración o algo más largo' },
        { label: 'Dónde buscarlo', value: 'Por Alejandra, que es de la OPERACIÓN y es la única persona nueva que ha aparecido en 28 meses. Por Cisneros ya se intentó y nos devolvió a facturación.' },
      ],
    },
    {
      nombre: 'Erick', rol: 'Asesora SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades', value: '3 registradas · 2 completadas · 1 sin completar (llamada del 26 jun)' },
        { label: 'Lo que diagnosticó bien', value: '16 jul 2026: identificó que el grueso del soporte es asistencia en chat sobre campañas, «de carácter operativo y no por fallas del servicio». Correcto.' },
        { label: 'Lo que faltó', value: 'Sacar la consecuencia: un soporte operativo repetido es una necesidad de producto, no una cola de tickets. Y perseguir el aviso de Cisneros.' },
        { label: 'Contexto',    value: 'Suspendida del tablero del 6 al 12 oct 2026 por instrucción de dirección' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'La voz FUNCIONA y ahora está medida de verdad: 96.22% atendidas de 93,929 llamadas, con 13,266 horas de conversación real',
      'Lo que de verdad se perdió son 712 llamadas, el 0.76% del tráfico: el 63.2% de las perdidas se recuperó en 24 h y el 74.8% en la semana',
      'Las cuatro líneas que mueven el 93% del tráfico pierden menos del 2.2%, y 19 de las 21 contratadas van por debajo del 4%',
      'El archivo CIERRA: las tres columnas de las dos tablas grandes cuadran al récord contra 93,929, 90,381 y 2,821, y «nunca volvieron» suma exactamente 712',
      'HAY REUNIÓN: la primera registrada en 28 meses, el 5 nov 2026, y se convocó en 48 horas desde que el cliente escribió',
      'HAY INTERLOCUTOR: Guillermo volvió él mismo y contestó con datos el 17 nov. `silencio_60` cerrada con respaldo real',
      'Diez tickets nuevos y CERO fallas nuevas: las cinco son las mismas desde el 1 de septiembre, y la mediana de resolución bajó de 69 a 59.5 horas',
      'El Downgrade se recuperó y se superó: la línea grande está $158.40 arriba del 2 de octubre, y el acumulado prueba que se facturó',
      'Health Score 72, el más alto de las OCHO del TOP 50, con adopción y pago en 100 y tres de los cuatro bloques capturados: el 65% del peso',
      'Adopción medida y ALTA en los tres productos registrados',
    ],
    oportunidades: [
      'La bolsa de chat va al 346% —86,492 sobre 25,000— y en la reunión del 5 nov ya se insinuó un plan más amplio: es la conversación de expansión más natural que ha tenido esta cuenta',
      'Dos enrutamientos rotos concentran el 42.47% de las pérdidas sobre el 1.37% del tráfico: arreglo barato y de efecto grande',
      'La ventana de servicio después de las 20:00: 553 pérdidas en el 1% del tráfico, y es el caso de uso más limpio de IA de voz que tiene la cuenta, sostenido con sus propios datos',
      'La marcación saliente está en cero —56 llamadas en diez meses, 157 días sin marcar— en una aseguradora donde el saliente es cobranza, renovación y confirmación de cita',
      'El reporte por línea corporativa ahora SÍ es posible: el destino viene en el 98.95% del tráfico',
      'No tiene IA de Chat ni IA de Voz contratadas, y el chat es justo su canal problemático y de donde salió el cargo',
      'Ni Integración API en el servicio contratado ni registro de adopción de ella, en una aseguradora que valida coberturas por teléfono — el flag `tiene_integracion_api` no lo prueba: está en falso en 221 de las 223 cuentas y nunca se pobló',
    ],
    debilidades: [
      'NO PODEMOS MEDIR SU CHAT. El corte vigente trae `operational_error` y `lecturaRota: true`, y marca cero mensajes — que no es desuso. En la conversación más delicada de los 28 meses llegamos con una explicación y no con una cifra',
      'No tenemos inventario de números de WhatsApp: los siete que mandó el cliente no existen en ninguna de nuestras fuentes, y eso bloquea el etiquetado que él ya aceptó',
      'Nuestra exportación de llamadas sigue truncada: el tablero publica 76,385 entrantes y el expediente 93,929, de la misma cuenta y en el mismo día',
      'La ficha que abre el asesor todavía publica tres afirmaciones que este expediente retiró, dos de ellas tumbadas hace un mes',
      'Un ticket de envío masivo tardó 277 días en cerrarse; otro, 113 — y «abiertos hoy» sigue sin poderse medir con esta fuente',
      '26 de 40 tickets son sobre envíos masivos, campañas y plantillas, con 5 fallas registradas',
      'Una sola reunión en 28 meses, 0 de 12 del Radar, score relacional 31 — y la reunión fue de facturación, no de servicio',
      'Sigue sin identificarse el responsable de telefonía, y de Alejandra no tenemos ni apellido',
    ],
    amenazas: [
      'LA PRIMERA INCIDENCIA DE PAGO EN 28 MESES, Y LA VIO ÉL PRIMERO. $10,740.10 de mensajes que antes costaban cero, un 46% sobre su voz. El cargo es de Meta y eso se puede demostrar, pero si la próxima factura llega igual sin que hayamos tocado el mix, la explicación deja de servir.',
      'Y la conversación grande sigue sin abrirse: su bolsa va al 346% y no se lo hemos dicho porque no lo hemos medido. Si lo descubre en una factura antes de que lo llevemos nosotros, deja de ser una oportunidad de plan mayor y se vuelve una queja.',
      'Sus clientes corporativos son marcas grandes —Bradescard, Zurich Santander, Chubb, Quálitas, Price Waterhouse, OCESA, Tokio Marine, Bimbo, Welbe— con la salvedad que manda `lib/dids-cuenta.ts`: la etiqueta es como el cliente bautizó ese número, no la razón social. Una llamada sin contestar no se queja a OdontoPrev, se queja a ellos, y eso escala por encima de nuestro interlocutor. Y el chat alcanza marcas que la voz no mide: SMNYL, Gonher y Visión.',
      'La extensión 36813 cambió de naturaleza en octubre: ya no son tres números en bucle, son 68 personas distintas marcando una vez y no encontrando a nadie. 378 no volvieron. Si esa persona ya no está en la operación, llevamos desde enero mandando clientes de sus corporativos a una extensión vacía.',
      'Los 277 días que tardó en cerrarse ese ticket son el argumento servido para cualquier conversación de renovación, aunque hoy esté cerrado — y la cifra creció desde la que publicamos.',
      'Sigue abierta `sin_consumo_medible` en CRÍTICA, cuyo dueño es ingeniería: 0 de 5 meses con dato de consumo en una cuenta de $23,681.40. Esta auditoría NO la cierra, y confundirlas daría por resuelto un hueco que sigue abierto.',
      'La voz funciona tan bien que la cuenta no se encendería en ningún semáforo por sí sola: lo que la encendió fue una factura, no un indicador nuestro.',
    ],
  },

  conclusion: 'LA v4.0 DEJA ESTA CUENTA EN UN SITIO DISTINTO, Y CONVIENE DECIRLO EN ORDEN. La voz funciona y ahora está medida de verdad: de 93,929 llamadas entrantes entre el 1 de enero y el 5 de noviembre, un agente atendió el 96.22%, con 13,266 horas de conversación real; 19 de sus 21 líneas pierden menos del 4%, y lo que de verdad se perdió son 712 llamadas —el 0.76% del tráfico—, porque el 63.2% de las perdidas volvió a marcar y fue atendido dentro de 24 horas. Ésa es la cifra que defiende la cuenta, y es la primera que hay que darle.\n\nLO QUE SE PIERDE ESTÁ EN DOS SITIOS Y LOS DOS SE CONFIGURAN. Una línea, la 36813, enruta a una extensión con el nombre de una persona: recibió 1,291 llamadas y sólo 93 las tomó alguien, lo que concentra el 42.47% de todas las pérdidas sobre el 1.37% del volumen. Y las horas en que ya nadie atiende, fuera de las 7 a las 20, aportan otro 19.6% sobre el 1% del tráfico. El documento dice que entre las dos cosas cabe el 62%, y hay que citarlo como «hasta el 62%»: las dos poblaciones pueden solaparse y la intersección no está publicada. Lo importante no cambia — ninguna de las dos es un problema de capacidad. Y hay una pregunta que va antes de tocar el enrutamiento: si la persona cuyo nombre lleva esa extensión ya no está en la operación, llevamos desde enero mandando asegurados de Bradescard y de Zurich a un sitio vacío, y en octubre eso dejó de ser un marcador automático para convertirse en 68 personas distintas marcando una vez y no encontrando a nadie.\n\nPERO EL TITULAR DE ESTA VERSIÓN NO LO PONE LA VOZ: LO PONE LA FACTURA. Meta dejó de no cobrar los mensajes de servicio de WhatsApp el 1 de octubre, y a Odontoprev le salieron 30,686: $10,740.10, un 46% sobre su voz. Con veintiocho meses sin una sola incidencia de pago, ésta es la primera. Y la planteó él, por chat, el 5 de noviembre, diciendo que la factura «le llegó del doble». La respuesta fue buena y rápida —reunión por Teams en 48 horas, el documento de Meta a la vista, la propuesta de un plan más amplio—, pero sólo cubrió la mitad: la mitad que falta es cuánto de ese consumo era evitable, y eso no se pudo contestar porque nuestra propia medición del chat no se puede leer. El corte vigente trae `operational_error` y marca cero mensajes, y ese cero no significa que dejó de usarlo. El último dato fiable son 86,492 mensajes contra una bolsa de 25,000: el 346%. El apartado 09 del reporte pregunta cuántos mensajes caben en la ventana gratuita de Meta y no menciona que la bolsa propia va rebasada — ésa es la conversación más grande de las dos, y es nuestra.\n\nTRES COSAS QUE LA v3.0 DABA POR PERDIDAS SE RECUPERARON, Y HAY QUE DEJAR DE REPETIRLAS. Hay reunión, la primera en 28 meses. Hay interlocutor: Guillermo volvió y contestó el 17 de noviembre con siete números de WhatsApp y el nombre de una segunda persona de su operación, Alejandra. Y la mesa no se deterioró: diez tickets nuevos sin una sola falla nueva, con la mediana de resolución bajando de 69 a 59.5 horas. Lo que sigue en pie es que el responsable de telefonía no está identificado: tener a Guillermo de vuelta por facturación no es haber encontrado a quien decide sobre el servicio.\n\nY DOS COSAS QUE SON NUESTRAS Y NO DEL CLIENTE. La exportación de llamadas que alimenta el tablero sigue truncada: medido el 19 de noviembre, guarda 76,385 entrantes y 11 salientes, o sea las ocho cifras que esta versión retira. Mientras no se recargue, la ficha y este expediente dirán números distintos de la misma cuenta y el cliente puede verlos los dos. Y la ficha que abre el asesor todavía publica tres afirmaciones que este expediente retiró, dos de ellas tumbadas hace un mes: corregir el expediente y dejar la ficha como estaba es dejar publicada la versión vieja justo donde se mira primero.\n\nLA LECCIÓN, ENTONCES, NO ES LA DE LA v3.0. Allí era que una cuenta que mejoraba se volvía invisible. Aquí es más incómoda: la voz la medimos al detalle y es lo que funciona; el chat, que es de donde salió el cargo y donde están 36 de sus 40 tickets, lo medimos con una fuente que falla y cuyo fallo se ve como un cero. Un cero se lee como desuso, y el desuso no preocupa a nadie. Así es como una cuenta que consume el 346% de su bolsa pasó por una cuenta sin actividad de chat hasta que llegó la factura.\n\n── LO QUE SIGUE ES LA CONCLUSIÓN DE LA v3.0, QUE SE CONSERVA PORQUE SUS CORRECCIONES DE MÉTODO SIGUEN VALIENDO ──\n\nODONTOPREV es la primera cuenta de la serie donde lo que el tablero mide va a MEJOR. La pérdida de llamadas bajó de 5.0% en enero a 1.9% en agosto —con abril y mayo al alza en medio, así que la curva no es recta— mientras el volumen crecía de 8,366 a 12,865 llamadas en julio, su pico, para cerrar agosto en 10,360. El mes cerrado está 1.58 puntos por debajo de su propia base. Las líneas de sus clientes corporativos funcionan a media décima de punto. El Health Score es 72, el más alto de las OCHO del TOP 50 — no de todas las auditorías escritas, que es como lo decía la v1.0. Nada de eso es un espejismo.\n\nY aun así hay tres cosas que no se pueden dejar como están. La primera es que el promedio esconde: el 3.17% global de pérdida mezcla líneas impecables con una extensión a nombre de una persona —«Rojas Chávez Carlos Alberto Octaviano»— que recibió 1,009 llamadas y de la que sólo 91 las tomó alguien, concentrando el 37.9% de todas las pérdidas sobre el 1.32% del tráfico. Se arregla en un día y nadie lo ha mirado porque el total no invitaba a mirar. Y hay que decirlo porque cambia el titular: la v1.0 inflaba esto a «la mitad de las pérdidas en tres destinos» sumándole un cubo de la tabla y un destino de ocho llamadas. Corregido, el hallazgo sigue siendo el más accionable de la cuenta — pero vale 918 llamadas, no 1,247.\n\nLa segunda es que el canal que falla no es el que medimos. La voz va bien; el chat acumula veinte tickets de envíos masivos, cinco fallas —la última abierta el 1 de septiembre— y un caso que tardó 246 días en cerrarse. El asesor diagnosticó el patrón correctamente en julio —«asistencia en chat, de carácter operativo»— y la conclusión que se sacó fue «cuenta estable». Pero un soporte operativo que se repite veinte veces no es estabilidad: es una necesidad de producto que nadie ha convertido en propuesta.\n\nLa tercera es la que más pesa. El 22 de julio el cliente nos dijo, por escrito y en nuestra propia ficha, que la persona con la que hablábamos ya no participa en la operación. Prometió validar con su equipo y nunca volvió. Han pasado 83 días y no hemos buscado a quién. Hoy no sabemos quién decide sobre un contrato de $23,325 al mes, y la investigación pública tampoco lo sabe: hay CEO con nombre pero sin forma de contactarla, y ningún responsable de telefonía identificable.\n\nLa lección es la misma que en ECODELI, con un giro: allí una cuenta que no se quejaba nunca se volvió invisible; aquí una cuenta que MEJORABA se volvió invisible. Un indicador que va bien no es una razón para dejar de mirar — es exactamente cuando conviene mirar lo que ese indicador no cubre.',

  pierde: [
    'Callpicker pierde $23,681.40 al mes de voz si la cuenta no renueva, más el consumo de chat — y la decisión sobre el servicio la tomaría alguien a quien no conocemos: el responsable de telefonía sigue sin identificar.',
    'Se pierde el acceso indirecto a sus clientes corporativos, que están MEDIDOS en su tabla de destinos: Asegurados Bradescard (50,307 llamadas), el CAT general con IKÉ (28,458), Zurich Santander, Chubb Seguros, Price Waterhouse Cooper, OCESA, Quálitas Salud, Tokio Marine, Bimbo, Welbe, Invisalign, Murguía Dental y Libertad Diamante — con la salvedad de que la etiqueta es como el cliente bautizó ese número, no la razón social. IKÉ no cuenta aquí: es el socio del joint venture, no un cliente. Y el chat alcanza otras tres que la voz no mide: SMNYL, Gonher y Visión.',
    'Se pierden 13,266 horas de conversación al periodo: uno de los mayores volúmenes reales de voz de la cartera.',
    'Y se pierde una cuenta cuyo servicio funciona —96.22% atendidas— que se iría por una factura y no por el servicio. Ésa es la peor forma de perder una.',
  ],

  gana: [
    'Medir el excedente de mensajes y llevarle el mix abre la conversación de plan mayor que la reunión del 5 nov ya insinuó: su bolsa va al 346% y todavía no lo sabe por nuestra boca.',
    'Arreglar dos enrutamientos elimina el 42.47% de las pérdidas de la cuenta: sigue siendo el mejor retorno por esfuerzo de toda la serie.',
    'La ventana después de las 20:00 convierte 553 pérdidas al año en contactos registrados, y es el caso de uso de IA de voz más limpio de la cartera — sostenido con datos del propio cliente, no con una presentación.',
    'La marcación saliente está en cero en una aseguradora de un millón de asegurados: cobranza, renovación y confirmación de cita son tres pilotos que caben en una extensión.',
    'No tiene IA de Chat ni IA de Voz contratadas, y el chat es su dolor conocido, documentado en 26 de sus 40 tickets y ahora también en su factura.',
    'Un reporte por cliente corporativo convierte nuestro dato en el instrumento con el que él cumple frente a Bradescard y Zurich — y ahora SÍ se puede hacer: el destino viene en el 98.95% del tráfico.',
    'Las 712 son un argumento real y verificable para abrir en positivo: de 93,929 llamadas, lo que de verdad se perdió es el 0.76%.',
  ],

  recomendacion_central: 'MEDIR LO NUESTRO ANTES DE LA PRÓXIMA CONVERSACIÓN, PORQUE LA ANTERIOR SE QUEDÓ A MEDIAS. El 5 de noviembre el cliente planteó la factura y se le explicó bien: Meta dejó de no cobrar los mensajes de servicio el 1 de octubre, son 30,686 mensajes a $0.35, $10,740.10, un 46% sobre su voz. Eso cubre el «por qué». Lo que no se pudo cubrir es el «cuánto de esto era evitable», y no se pudo porque nuestra propia medición del chat no se lee: el corte vigente trae `operational_error` y marca cero mensajes. Así que la tarea uno no es del cliente, es de casa — un corte de Callpicker Chat que se lea para este CID, con el consumo del mes y el reparto por tipo de mensaje. Sin eso vamos a la siguiente reunión igual que a la primera: con una explicación en vez de una cifra.\n\nY LLEVARLE LA BOLSA NOSOTROS, ANTES DE QUE LA DESCUBRA EN UNA FACTURA. Contrató 25,000 mensajes y el último dato fiable son 86,492: el 346%. El reporte entregado pregunta cuántos de los 30,686 caben en la ventana gratuita de Meta y no menciona esto, que es la conversación más grande de las dos. En la reunión ya se insinuó un plan más amplio: ésa es la forma de que el 346% acabe en un contrato mayor en vez de en una queja. Si lo descubre él, el orden se invierte.\n\nDOS COSAS DE CASA MÁS, Y LAS DOS SON NUESTRAS. Recargar `data/analisis-llamadas.json` con la exportación completa: hoy sigue con 76,385 entrantes y 11 salientes, así que el tablero publica las ocho cifras que este expediente retira y el cliente puede ver las dos versiones. Y corregir `observaciones_kam`, que todavía afirma «83 días de silencio», «la mitad de las pérdidas en TRES destinos que son el 1.92% del volumen» y «un ticket que lleva 5,908 horas ABIERTO: 246 días» — las dos últimas las tumbamos hace un mes. De paso, `cuentas.facturacion` de $23,325 a $23,681.40.\n\nEN LA OPERACIÓN, DOS CAMBIOS DE CONFIGURACIÓN Y UNA PREGUNTA. Arreglar la línea 36813, que enruta a la extensión «Rojas Chávez Carlos Alberto Octaviano»: 1,198 sin contestar de 1,291, el 42.47% de las pérdidas de la cuenta sobre el 1.37% de su tráfico. Y la 36831 de Welbe, 9 de 10. La pregunta va antes del cambio: si esa persona ya no está en la operación de Odontoprev, llevamos desde enero mandando asegurados a una extensión vacía, y desde el 6 de octubre son personas distintas marcando una vez cada una —378 no volvieron—. Lo tercero es decidir qué pasa después de las 20:00: hoy la llamada entra y se cae, 553 de 938, y un buzón con compromiso de devolución o un agente de voz con IA las convierte en contactos registrados.\n\nY CUANDO SE HABLE, ABRIR POR LAS 712. De 93,929 llamadas un agente atendió el 96.22%, y lo que de verdad se perdió son 712 — el 0.76% del tráfico. Es verdad, es suyo, nadie se lo ha dicho, y le sirve a él para responder ante Bradescard y ante Zurich. Después de eso se puede llevar lo demás: el desglose por línea corporativa, que ahora SÍ podemos darle, y la propuesta de IA de Chat, que es el canal donde está su dolor y su factura.\n\nLO QUE NO HAY QUE HACER es leer la recuperación de noviembre como que la cuenta ya está atendida. Volvió el interlocutor y hubo reunión, pero la reunión fue de facturación, el responsable de telefonía sigue sin nombre, el Radar sigue en 0 de 12 y de Alejandra —que es quien maneja la otra mitad del consumo— no tenemos ni apellido.\n\n── LO QUE SIGUE ES LA RECOMENDACIÓN DE LA v3.0 ──\n\nBUSCAR AL DECISOR ESTA SEMANA, Y POR LA VÍA MÁS CORTA: preguntándole a Cisneros a quién hay que escribirle. Él mismo nos avisó el 22 de julio de que ya no participa en la operación y se ofreció a validar con su equipo; en 83 días nadie recogió esa pelota. Hoy no sabemos quién decide sobre un contrato de $23,325 al mes, y la investigación pública tampoco: hay CEO identificada —Mércia Leite Nagem— pero sin vía de contacto verificable, y ningún responsable de telefonía en ninguna fuente. Mientras eso siga así, todo lo demás que se haga en esta cuenta es trabajo sin destinatario.\n\nANTES DE LLAMAR, DOS COSAS DE CASA, Y LAS DOS SON NUESTRAS. Arreglar el enrutamiento de «Rojas Chávez Carlos Alberto Octaviano» —918 sin contestar de 1,009—, que es el 37.9% de las pérdidas de la cuenta sobre el 1.32% de su tráfico y se corrige en un día; y, por separado, preguntarle a soporte por las 322 que cayeron en el cubo «(sin destino registrado)» sin llegar a ninguna extensión, que no es un enrutamiento que se retire sino una pregunta para el archivo. Y tener lista la explicación de los dos tickets que tardaron 246 y 113 días en cerrarse: están CERRADOS los dos, pero el cliente los vivió, y llegar a una conversación de renovación sin haberlos explicado es entregarle el único argumento que no se puede contestar con datos.\n\nY CUANDO SE HABLE, ABRIR POR LA MEJORA. Su pérdida bajó de 5.0% a 1.9% mientras su volumen crecía: es verdad, es suyo, y nadie se lo ha dicho. Después de eso se puede llevar lo demás — el desglose por línea corporativa que hoy no podemos darle porque la mitad de su tráfico llega sin destino, y la propuesta de IA de Chat, que es el canal donde se concentran veinte de sus treinta tickets.\n\nLo que NO hay que hacer es leer la mejora de la voz como que la cuenta está atendida. Lo que mejora es el indicador que miramos; lo que falla es el canal que no miramos y la relación que no existe.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 40 tickets de «Odontoprev» (CID 162545) en lib/tickets-data.json. Medido con `scripts/mide-tickets-cuenta.py 162545`, que respeta las reglas de `lib/tickets-norm.ts`: no se teclea aquí ninguna cifra que el dato pueda mover sin avisar',
    periodo: 'Cierres de marzo a noviembre de 2026 — `fecha`/`mes` es el mes de CIERRE, no de apertura: las aperturas de estos 40 tickets arrancan en ENERO. La fuente trae SÓLO tickets cerrados (2 filas sin cierre de 8,281, el 0.02%), así que «abiertos» no es cero: es NO MEDIBLE',
    diagnostico: 'El producto que le falla a OdontoPrev no es la voz: es el CHAT, y dentro del chat, el envío masivo. De 40 tickets, 36 son de canal chat y VEINTISÉIS son sobre campañas, envíos masivos y plantillas —«Envío Masivo WhatsApp» 11, «Reporte de Campaña» 11, «Plantillas Verificadas» 4, «Falla Envíos Masivos» 3 y «Envío Masivo SMS» 1 (los dos últimos solapan con las fallas)—. El producto son TRES cajones y los tres cierran: Chat 36, Voz 2 y «sin producto» 2; la voz aparece dos veces en cuarenta tickets, o sea que el canal problemático sigue siendo el otro. Y la noticia buena de esta versión está justo aquí: desde la v3.0 entraron DIEZ tickets nuevos y CERO fallas nuevas. Las cinco fallas son las mismas cinco, la última abierta el 1 de SEPTIEMBRE, y la mediana de resolución bajó de 69 a 59.5 horas. El asesor lo diagnosticó bien en julio —«la demanda de soporte es de carácter operativo y no por fallas del servicio»— y los diez tickets siguientes le dan la razón: la demanda que crece es de asistencia, no de reparación. Un cliente que pide veintiséis veces ayuda con lo mismo no es un cliente demandante: es una función que no se basta sola — y ahora esa misma función le está costando $10,740.10 en la factura.',
    metricas: [
      { metrica: 'Tickets totales',          valor: '40 · cierres mar–nov 2026', lectura: 'Diez más que en la v3.0. Por mes de CIERRE el pico es OCTUBRE con 11; noviembre va en 3. Por mes de APERTURA, octubre 9 y noviembre 3. Junio no tiene ninguno en ninguno de los dos ejes.' },
      { metrica: 'De chat',                  valor: '36 de 40',               lectura: 'Producto Chat 36, Voz 2, sin producto 2 — TRES cajones, y suman 40. Una pantalla que enseñe dos deja fuera a los que el export no clasifica.' },
      { metrica: 'Campañas, envíos masivos y plantillas', valor: '26 · 65.0%', lectura: 'El patrón dominante y la conversación de producto pendiente. «Envío Masivo WhatsApp» pasó de 7 a 11 y «Plantillas Verificadas» de 2 a 4.' },
      { metrica: 'Fallas del servicio',      valor: '5 · 12.5%',              lectura: 'LAS MISMAS CINCO: Falla Web (19 may), Falla Envíos Masivos (30 jul, 4 ago y 1 sep) y Falla App (21 ago). Tres de las cinco de envíos masivos. Diez tickets nuevos sin una falla nueva: en octubre y noviembre no hay ninguna.' },
      { metrica: 'La última falla · y la trampa', valor: '1 sep 2026',        lectura: 'La evidencia del motor imprime «2026-11-09», que es otra cosa: `lib/tickets-cuenta.ts` acumula `ultima` sobre la apertura de TODOS los tickets, y los dos del 9 de noviembre son «Reporte de Campaña» con es_falla = No.' },
      { metrica: 'Mediana de resolución',    valor: '59.5 horas',             lectura: 'MEJORÓ desde las 69 de la v3.0. Se toma del par central promediado: `dur[n // 2]` coge el valor superior y con n par siempre sesga arriba — ése fue el «70» de la v1.0. La media (318 h) sigue inflada por dos casos extremos.' },
      { metrica: 'El que más tardó',         valor: '6,651.2 h · 277 días',   lectura: 'Folio 385, «Envío Masivo WhatsApp»: abierto el 8 de enero y cerrado el 13 de OCTUBRE. La v3.0 publicó 5,908 h con cierre el 12 de septiembre, y eso era lo que decía la fuente ese día: el folio se REABRIÓ y volvió a cerrarse. Un ticket cerrado puede dejar de estarlo, y el export reescribe su cierre y su duración sin avisar.' },
      { metrica: 'El segundo',               valor: '2,709 h · 113 días',     lectura: 'Folio 105738, «Bandeja de entrada»: abierto el 16 de abril, CERRADO el 7 de agosto. Éste no se movió.' },
      { metrica: 'Tickets de más de 7 días', valor: '9 de 40 · 22.5%',        lectura: 'Mejor que el 26.7% de la v3.0, pero sigue siendo uno de cada cinco' },
      { metrica: 'Los tres de noviembre',    valor: '2 nov y 9 nov (×2)',     lectura: 'Una «Duda Operativa» el 2, y los folios 119624 y 119625 abiertos el 9 con UN MINUTO de diferencia y cerrados al mismo minuto, los dos «Reporte de Campaña». Puede ser un pedido contado dos veces: se declara, no se resuelve por nuestra cuenta.' },
      { metrica: 'Abiertos hoy',             valor: 'NO MEDIBLE',            lectura: 'El export sólo trae cerrados —2 filas sin cierre de 8,281— así que `ABIERTOS_MEDIBLE` da FALSE. El 0 de la ficha no es una medición.' },
    ],
    reincidencias: [
      { patron: 'Reporte de Campaña (chat)',     veces: '9 · 30.0%', causa: 'El cliente pide el reporte en vez de obtenerlo. Es una función que no se basta sola, o una capacitación que no se dio.' },
      { patron: 'Envío Masivo WhatsApp (chat)',  veces: '7 · 23.3%', causa: 'Mismo patrón documentado en Torres Corzo, que levanta 22 de éstos. NO en FINSUS: su expediente no menciona «masivo» ni una vez, y lo suyo son las plantillas verificadas. En toda la fuente, «Envío Masivo» de cualquier tipo aparece en 9 cuentas de CLIENTE: los 11 CIDs de la v2.0 incluían a los internos 0 y 1, con un ticket cada uno, que `lib/tickets-norm.ts` cuenta aparte porque son tráfico interno y de pruebas.' },
      { patron: 'Falla Envíos Masivos (chat)',   veces: '3 · 10.0%', causa: 'Éstas SÍ son fallas, no asistencia. Son el núcleo de la alerta `sac_fallas_recurrentes`.' },
      { patron: 'Plantillas Verificadas (chat)', veces: '2 · 6.7%',  causa: 'El mismo trámite de WhatsApp que es la reincidencia crítica de FINSUS y pesa 29 tickets en Torres Corzo. Pero no es «media cartera»: son 15 CIDs de CLIENTE de los 1,647 con tickets, el 0.91% —16 de 1,649 si se cuenta el CID interno 1, que lleva cuatro de estos tickets y que `lib/tickets-norm.ts` deja fuera junto con el 0—. Y de esos 15, sólo OCHO tienen línea en el GRC: 8 de las 203 cuentas en cartera, el 3.9%. El «7.4% de las 217» que publicaba la v2.0 dividía un numerador del universo entero entre un denominador de cartera, y las 217 son FILAS del GRC, no cuentas.' },
    ],
    hallazgos: [
      'El canal que el tablero mide con detalle (voz) es el que funciona; el que apenas se mira (chat) es el que acumula 36 de los 40 tickets y las 5 fallas — y es también de donde salió el cargo de $10,740.10 de la factura de noviembre.',
      'DIEZ TICKETS NUEVOS Y CERO FALLAS NUEVAS, con la mediana de resolución bajando de 69 a 59.5 horas. La demanda que crece es de asistencia y no de reparación, que es exactamente lo que el asesor diagnosticó en julio.',
      'Los 246 días del folio 385 son, SIN EXCEPCIÓN, el mayor tiempo de resolución de todas las auditorías escritas: le siguen el folio 104289 de FINSUS con 3,548.1 h (148 días) y el 104448 de Torres Corzo con 3,522.1 h (147), los dos CERRADOS en la fuente. La v2.0 publicaba 147 y 146 porque truncaba los días, mientras en este mismo expediente 2,709.1 h se redondean a 113: con una sola convención —redondeo— los dos crecen un día, y el 147 del 104448 es además el que publica Torres Corzo en su propio expediente. La v1.0 exceptuaba «el folio de Torres Corzo», y ese folio es MENOR —155 días fuera de SLA y 156 sin movimiento— además de ser otra medida: un folio escalado y abierto no se compara con el tiempo de resolución de un ticket ya cerrado. Y el de aquí ya está cerrado, así que lo que queda no es cerrarlo: es explicar por qué tardó.',
      'Veintiséis tickets sobre campañas, envíos masivos y plantillas en once meses es una señal de producto, no de soporte: el cliente necesita algo que la función no le da sola, y eso es exactamente lo que resolvería IA de Chat. Y ahora esa misma función aparece en su factura.',
    ],
  },

  documentos: [
    {
      nombre:      'Auditoría de tráfico · Odontoprev 2026 (v4.0)',
      ruta:        '/auditorias/Auditoria-Odontoprev-Trafico-2026.html',
      descripcion: 'Versión vigente. 1 ene – 5 nov 2026, SAC Callpicker. 93,929 llamadas entrantes y 56 salientes: tendencia mensual con y sin la extensión que no contesta, pérdida por hora y por día, pérdida por destino y por cada una de las 21 líneas, recuperación de perdidas a 24 h y a la semana, marcación saliente, siete acciones en orden de impacto, y un apartado 08 que retira OCHO cifras de la v3.0. El apartado 09 trae el cargo de WhatsApp de Meta, que NO sale de los archivos de llamadas y se identifica como tal. Lleva dentro, visibles, las siete aclaraciones y los ocho desfases declarados de la conciliación del 19 nov 2026.',
    },
  ],
}
