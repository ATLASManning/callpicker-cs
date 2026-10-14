import type { AuditoriaCase } from './types'

/**
 * ODONTOPREV · Odontored Seguros Dentales (C13 · CID 162545) — la voz mejora,
 * el chat tuvo un ticket que tardó 246 días en CERRARSE, y no sabemos quién
 * decide.
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
 *   · llamadas  → app/cuentas/llamadas-data.ts, CID 162545. Ventana
 *                 2026-01-01 → 2026-09-14 y `mesCerrado` 2026-08, así que
 *                 SEPTIEMBRE ES UN MES PARCIAL: del 1 al 14, 4,575 llamadas.
 *   · importe   → GRC por CID: DOS líneas, `mrrFin` $19,820 + $3,505 = $23,325.
 *                 Es MRR INSTITUCIONAL por la regla de dirección del 13 oct
 *                 2026 —`mrrFin` cuando es > 0— documentada en
 *                 `lib/facturacion-cuenta.ts`. `cuentas.facturacion` guarda
 *                 `acumulado ÷ meses`, que es un PROMEDIO DE VIDA y no se
 *                 mezcla con esto.
 *   · tickets   → lib/tickets-data.json, 30 filas, TODAS CON CIERRE. El export
 *                 sólo trae cerrados —2 filas sin cierre de 6,676, el 0.03%—
 *                 así que `ABIERTOS_MEDIBLE` es FALSE: «abiertos» no es cero,
 *                 es NO MEDIBLE. Y `fecha`/`mes` es el mes de CIERRE.
 *   · DIDs      → data/dids.json: 21 números para el CID 162545. La v1.0 NO
 *                 abrió esta fuente, y por eso contó mal las marcas.
 *   · alertas   → alertas_episodios, 5 abiertas (2 críticas)
 *   · la empresa → CNSF, AMIS, Cámara México-Brasil, LinkedIn, odontoprev.com.mx
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
  asesor: 'Claudia',
  nombre: 'ODONTOPREV México (Odontored Seguros Dentales)',
  sector: 'Seguros dentales y salud bucal — administra coberturas vía red de prestadores',
  fecha_periodo: 'Julio 2024 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA · 27 meses · 1 millón de asegurados, 320 clientes corporativos',
  descripcion_contexto: 'El MRR institucional son $23,325, no los $10,901 de la ficha · La voz MEJORA sola: 5.0% en enero → 1.9% en agosto, por debajo de su propia base, aunque abril y mayo subieron · Y UN destino real —una extensión personal— concentra el 37.9% de las pérdidas sobre el 1.32% del volumen, mientras el chat tuvo un ticket que tardó 246 días en cerrarse',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '3.0',

  kpis: [
    { label: 'MRR institucional · la ficha decía $10,901', value: '$23,325',  color: '#ef4444' },
    { label: 'Pérdida: ene → ago (abr y may suben)',        value: '5.0→1.9%', color: '#22c55e' },
    { label: 'De las pérdidas, en UN destino real',        value: '37.9%',   color: '#f97316' },
    { label: '…que es del volumen',                        value: '1.32%',   color: '#f97316' },
    { label: 'El ticket que más tardó en cerrarse',         value: '246 días', color: '#ef4444' },
    { label: 'Horas de conversación medidas',      value: '11,083',  color: '#6366f1' },
  ],

  resumen_ejecutivo: 'ODONTOPREV es la séptima del TOP 50 y vuelve a traer el problema del importe, pero NO es una racha: la auditoría inmediatamente anterior, ECODELI, la rompió —ahí el importe de la ficha y el del GRC coincidían al peso, «EL IMPORTE CUADRA»—, así que ésta es la primera tras ese corte y no la tercera seguida. La ficha decía $10,901 y el MRR institucional son $23,325: un 114% más. Son DOS líneas del mismo CID 162545, «Odontoprev ATC» con `mrrFin` $19,820 y «Odontoprev» con $3,505. Y de dónde salieron los $10,901 SÍ se sabe, contra lo que publicó la v2.0: es un PROMEDIO DE VIDA de una sola de las dos líneas. No son $19,820, ni $3,505, ni su media ($11,663), ni el `mrrIni` ($20,018): son el `acumulado ÷ meses` de la línea «Odontoprev» congelado en un corte en que ese renglón llevaba 23 meses facturados —$250,731.12 ÷ 23 = $10,901.35, que al peso es el 10,901 que guardaba la ficha—. Ese cociente hoy da $9,806 y en el corte del 2 de octubre daba $10,048, y ninguna otra línea del GRC vigente cae entre $10,890 y $10,912. O sea que la ficha no traía un MRR recortado: traía lo que `cuentas.facturacion` guarda por definición, un promedio de vida, y además de un solo renglón. Conviene anotar además que la línea grande viene de un **Downgrade** —de $20,018 a $19,820— pequeño en pesos pero real.\n\nLO QUE ESTÁ BIEN, Y HAY QUE DECIRLO PRIMERO PORQUE ES LA TENDENCIA. El servicio de voz funciona y viene mejorando sin que nadie haya intervenido. La pérdida pasó de 5.0% en enero a 1.9% en agosto, que es el último mes CERRADO de esta cuenta; septiembre marca 1.6% pero es un mes PARCIAL —la ventana del archivo se corta el 14 de septiembre, con 4,575 llamadas— y no se pone al lado de los cerrados. Y la mejora no es una línea recta: abril (4.03%) y mayo (4.11%) SUBIERON, y mayo quedó peor que febrero, así que el tramo limpio es junio–agosto. El volumen sí creció: de 8,366 llamadas en enero a 12,865 en JULIO, su pico, y agosto cerró en 10,360 —un 19.5% menos que julio y un 23.8% más que enero—. El mes cerrado pierde 1.92% contra una base propia de 3.50%: son 163 llamadas perdidas MENOS de las que esta cuenta normalmente pierde. Y las líneas de negocio están impecables — Bradescard al 0.5%, Bradescard Asistencias al 0.4%, CAT IKÉ al 1.5%.\n\nPERO UN SOLO DESTINO REAL CONCENTRA CASI CUATRO DE CADA DIEZ PÉRDIDAS SOBRE EL 1.32% DEL TRÁFICO. Un destino llamado «Rojas Chávez Carlos Alberto Octaviano» —el nombre de una persona— recibió 1,009 llamadas y 918 quedaron sin contestar: el 91.0% de lo suyo, y el 37.9% de las 2,420 sin contestar de todo el periodo. Arreglar ese enrutamiento vale más que cualquier otra cosa que se pueda hacer en la voz de esta cuenta. Aparte, y sin mezclarlo: 322 cayeron en «(sin destino registrado)», que NO es un destino sino un cubo que el generador añade para que la tabla cierre —no llegaron a ninguna extensión, el archivo no dice por qué, y eso se revisa con soporte antes de culpar a nadie—; otras 859 cayeron en «(destino no venía en el archivo)», el cubo de las filas cuya columna de destino nunca se exportó; y «WELBE» dejó sin contestar 7 de 8 llamadas, demasiado poco para juzgarlo. La tabla cierra sobre las 2,420: Rojas Chávez 918 + cubo sin columna 859 + cubo sin destino 322 + CAT IKÉ 192 + Bradescard 98 + 31 repartidas entre los siete renglones restantes. Fuera de esa extensión y de los dos cubos, el resto de sus destinos deja sin contestar el 0.9%: 321 de 35,668.\n\nEL PROBLEMA DE VERDAD NO ESTÁ EN LA VOZ, ESTÁ EN EL CHAT. De los 30 tickets de la mesa, 27 son de canal chat y veinte son sobre envíos masivos y campañas. Hay cinco fallas registradas —alerta `sac_fallas_recurrentes` abierta el 12 de octubre— y la última de ellas se abrió el 1 de SEPTIEMBRE: en octubre no hay ninguna. Y hay dos casos que tardaron una eternidad en cerrarse: el folio 385 de «Envío Masivo WhatsApp» estuvo del 8 de enero al 12 de septiembre —**5,908 horas, 246 días de RESOLUCIÓN**— y el 105738 de «Bandeja de entrada» del 16 de abril al 7 de agosto, 2,709 horas. LOS DOS ESTÁN CERRADOS, y «cero abiertos» tampoco se puede afirmar: la fuente sólo trae tickets cerrados —2 filas sin cierre de 6,676— así que «abiertos» no es cero, es NO MEDIBLE. La mediana de resolución son 69 horas, pero la media sube a 379 por esos dos.\n\nY NO SABEMOS QUIÉN DECIDE. El único contacto que nos ha respondido, Guillermo Cisneros, nos dijo el 22 de julio que «actualmente no participa de forma directa en la operación» y que validaría con su equipo. No hubo retroalimentación. Van 83 días de silencio, con `silencio_60` crítica abierta. La investigación pública tampoco identifica un responsable de telefonía: hay CEO con nombre —Mércia Leite Nagem— pero sin vía de contacto verificable. La ficha no tenía NI UN contacto capturado hasta el 13 de octubre, cuando se le cargaron ocho entradas — y ocho entradas no son ocho personas: cuatro son nombres, tres son teléfonos institucionales y la octava es el marcador «RESPONSABLE DE TELEFONÍA — SIN IDENTIFICAR». Cero reuniones en 27 meses, cero de doce del Radar.',

  resultado_positivo: 'Esta cuenta tiene más cosas bien que mal, y la lista es concreta — pero dos de las cosas que la v1.0 ponía aquí no eran ciertas, y se corrigen en el mismo sitio donde se afirmaron.\n\nLA VOZ MEJORA SOLA Y SE PUEDE DEMOSTRAR, AUNQUE NO EN LÍNEA RECTA. La serie completa, sin saltarse ningún mes: enero 5.03%, febrero 4.01%, marzo 3.37%, abril 4.03%, mayo 4.11%, junio 2.57%, julio 2.22%, agosto 1.92% y septiembre 1.57% sobre un mes PARCIAL (del 1 al 14, 4,575 llamadas). La v1.0 enumeró esta misma serie omitiendo abril y mayo y la llamó «curva descendente limpia»: no lo es, porque esos dos meses SUBEN y mayo queda peor que febrero. Lo que sí se sostiene, y es la buena noticia, es el tramo de junio a agosto: tres meses seguidos a la baja que dejan la pérdida en menos de la mitad de donde arrancó el año. Y mientras tanto el volumen SUBIÓ: de 8,366 llamadas en enero a 12,865 en julio, su pico, con agosto cerrando en 10,360. Mejorar la tasa mientras crece el tráfico es lo difícil. Medido contra su propia base, el mes cerrado está 1.58 puntos por debajo: 163 llamadas perdidas menos de lo normal.\n\nLAS LÍNEAS DE NEGOCIO ESTÁN IMPECABLES. ASEGURADOS BRADESCARD: 17,960 llamadas con 0.5% de pérdida y 12.4 minutos de media. BRADESCARD ASISTENCIAS: 0.4%. DIRECTO ASEGURADOS BRADESCARD: 0.4% y 13.7 minutos. CAT GENERAL ODONTOPREV IKÉ: 1.5%. Son conversaciones largas y reales —664,956 minutos sobre 76,385 llamadas, o sea 8.7 minutos por llamada, y 11,083 horas en el periodo— que es exactamente lo contrario de una cuenta automatizada.\n\nLA ADOPCIÓN ESTÁ MEDIDA Y ES ALTA. Tres registros, los tres en ALTO: Callpicker Chat, Pago Automático y Uso del Panel Administrador. Su Health Score es 72, el más alto de las OCHO del TOP 50, con los bloques de adopción y pago en 100. Y están medidos TRES de los cuatro bloques, el 65% del peso: adopción 100, pago 100 y relacional 31, con sólo actividad en el 50 por omisión —que `lib/health-score.ts` cuenta como NO medido—. La v1.0 decía «dos de cuatro» y lo presentaba como el mejor registro de la serie: ninguna de las dos cosas era cierta. D2 Grupo System OOAPAS tiene los CUATRO bloques capturados —actividad 69, adopción 4, pago 100, relacional 11—, o sea el 100% del peso.\n\nY EL ANÁLISIS DEL ASESOR DEL 16 DE JULIO ACERTÓ EN EL DIAGNÓSTICO: «la categoría con mayor recurrencia es Asistencia en Chat… los tickets generados corresponden principalmente a solicitudes de creación de campañas, seguimiento y configuraciones… la demanda de soporte es de carácter operativo y no por fallas del servicio». Eso es correcto y es la lectura buena. Lo que faltó fue la consecuencia: si el soporte que el cliente consume es operativo y repetido, eso es una necesidad de producto o de capacitación, no una cola de tickets.',

  hallazgos: [
    'IMPORTE — LA FICHA DECÍA $10,901 Y EL MRR INSTITUCIONAL SON $23,325. Un 114% más. Son DOS líneas del mismo CID 162545 —«Odontoprev ATC» con `mrrFin` $19,820 y «Odontoprev» con $3,505— y las dos traen `mrrFin` > 0, que es lo que manda la regla de dirección del 13 oct 2026. Y de dónde salieron los $10,901 SE REPRODUCE, así que el «no se sabe» de la v2.0 queda retirado: son el `acumulado ÷ meses` de la línea «Odontoprev» en un corte en que ese renglón llevaba 23 meses facturados —$250,731.12 ÷ 23 = $10,901.35, el 10,901 de la ficha al peso—. El acumulado de ese renglón crece exactamente $3,505.00 por corte ($261,246.12 el 2 de octubre y $264,751.12 hoy, con `mrrFin` estable), así que retroceder cuatro cortes desde los 27 meses de hoy deja esos 23; y ninguna otra línea del GRC vigente tiene un `acumulado ÷ meses` entre $10,890 y $10,912. No coincide con ningún MRR —ni $19,820, ni $3,505, ni su media ($11,663), ni el `mrrIni` ($20,018)— porque no era un MRR: era un PROMEDIO DE VIDA, que es lo que `cuentas.facturacion` guarda por definición, y de UNA sola de las dos líneas. Hoy ese mismo cociente da $9,806 y el 2 de octubre daba $10,048. La v1.0 acertaba la mitad («la ficha traía sólo una parte») y erraba la otra («no es un promedio de vida»); la v2.0 retiró las dos. Y no hay racha: ECODELI, la auditoría anterior, tenía el importe CUADRADO al peso, así que ésta es la primera tras ese corte y no la tercera seguida.',
    'IMPORTE — LA LÍNEA GRANDE VIENE DE UN DOWNGRADE. «Odontoprev ATC» pasó de $20,018 a $19,820, con $198 de pérdida declarada y movimiento «Downgrade». Son $198 al mes, o sea poco dinero — pero es un movimiento a la baja en la línea que concentra el 85% del contrato, y nadie lo ha preguntado.',
    'ATENCIÓN — LA VOZ MEJORA SOLA, PERO NO EN LÍNEA RECTA. De 5.0% de pérdida en enero a 1.9% en agosto, el último mes CERRADO; septiembre marca 1.6% sobre un mes PARCIAL —del 1 al 14, 4,575 llamadas— y no se compara con los cerrados. En medio, abril (4.03%) y mayo (4.11%) SUBIERON, y mayo quedó peor que febrero: el tramo limpio es junio–agosto, tres meses seguidos a la baja. El volumen subió de 8,366 llamadas en enero a 12,865 en JULIO —su pico— y agosto cerró en 10,360, un 19.5% menos que julio. El mes cerrado está 1.58 puntos POR DEBAJO de su base propia: 163 llamadas perdidas menos de las que normalmente pierde. De la serie del TOP 50 es la única cuya curva va a mejor sin que hayamos intervenido.',
    'ATENCIÓN — UN SOLO DESTINO REAL CONCENTRA EL 37.9% DE LAS PÉRDIDAS SOBRE EL 1.32% DEL VOLUMEN. «Rojas Chávez Carlos Alberto Octaviano» deja sin contestar 918 de 1,009 llamadas (91.0%), y esas 918 son el 37.9% de las 2,420 sin contestar del periodo. La v1.0 lo sumaba con otros dos renglones para titular «la mitad de las pérdidas en tres destinos que son el 1.92% del volumen», y eso no se sostiene: «(sin destino registrado)» es un CUBOS_AGREGADOS de `lib/llamadas-cuenta.ts` —«no un lugar por el que se pueda preguntar», y `destinoPorConfirmar()` lo excluye por nombre— y «WELBE» son 8 llamadas en total, por debajo de cualquier umbral del módulo. La tabla cierra sobre las 2,420: Rojas Chávez 918 · cubo «(destino no venía en el archivo)» 859 · cubo «(sin destino registrado)» 322 · CAT IKÉ 192 · Bradescard 98 · y 31 repartidas entre los siete renglones restantes. Fuera de esa extensión y de los dos cubos, el resto de sus destinos deja sin contestar el 0.9%: 321 de 35,668.',
    'ATENCIÓN — Y ESE DESTINO ES EL NOMBRE DE UNA PERSONA. «Rojas Chávez Carlos Alberto Octaviano» recibió 1,009 llamadas; 918 quedaron sin contestar desde 102 números distintos, y sólo 91 las tomó una persona (`redir` = 91). Los 102 NO son los números que marcaron: `lib/llamadas-cuenta.ts` define `n` como «números distintos que quedaron sin contestar», y cuántos marcaron las 1,009 no está en la fuente. Una extensión personal que recibe mil llamadas y atiende noventa no es un problema de capacidad: o la persona ya no está, o el enrutamiento manda ahí lo que no debería. Las dos cosas se arreglan el mismo día en que alguien lo mire.',
    'MEDICIÓN — EL 51.4% DEL TRÁFICO NO TRAE DESTINO. 39,258 de las 76,385 llamadas caen en «(destino no venía en el archivo)». Tiene 2.2% de pérdida y 7.6 minutos de media —299,422 minutos entre sus 39,258 llamadas; los 7.8 que publicaba la v2.0 salían de dividir entre las 38,399 `c`, el mismo denominador que este expediente rechaza para la cuenta—, o sea que se comporta como las líneas de negocio — pero mientras la mitad del tráfico sea anónima, no se puede decirle al cliente qué línea suya funciona mejor.',
    'SERVICIO — EL PROBLEMA ESTÁ EN EL CHAT, NO EN LA VOZ. De 30 tickets, 27 son de canal chat y VEINTE son sobre envíos masivos y campañas: «Reporte de Campaña» 9, «Envío Masivo WhatsApp» 7, «Falla Envíos Masivos» 3, «Envío Masivo SMS» 1. La voz aparece una sola vez: un ticket de DiDs abierto el 29 de septiembre y cerrado el 1 de octubre.',
    'SERVICIO — UN TICKET TARDÓ 246 DÍAS EN CERRARSE, Y ESTÁ CERRADO. El folio 385, «Envío Masivo WhatsApp (chat)», se abrió el 8 de enero de 2026 y cerró el 12 de septiembre: 5,908 horas de RESOLUCIÓN, no de antigüedad. El segundo, el folio 105738 de «Bandeja de entrada», fue del 16 de abril al 7 de agosto: 2,709 horas, 113 días. Los 30 tickets del CID traen fecha de cierre —y «cero abiertos» tampoco se puede afirmar: la fuente sólo trae cerrados, 2 filas sin cierre de 6,676 (el 0.03%), así que `ABIERTOS_MEDIBLE` da FALSE y el 0 que guarda la ficha no es una medición. La mediana de resolución son 69 horas, razonable; la media sube a 379 por culpa de esos dos. Ocho de los 30 (26.7%) pasaron de siete días.',
    'SERVICIO — CINCO FALLAS REGISTRADAS Y UNA ALERTA NUEVA. `sac_fallas_recurrentes` se abrió el 12 de octubre: 5 fallas sobre 30 tickets (16.7%). La última se abrió el 1 de SEPTIEMBRE —folio 114355, «Falla Envíos Masivos», cerrado el 8— y en octubre no hay ninguna falla. El «6 de octubre» que imprime la evidencia del motor mide otra cosa: `lib/tickets-cuenta.ts` acumula `ultima` sobre la apertura de TODOS los tickets, y los dos del 6 de octubre son «Reporte de Campaña» con es_falla = No. Las cinco son Falla Web (19 may), Falla Envíos Masivos (30 jul, 4 ago y 1 sep) y Falla App (21 ago): tres de las cinco de envíos masivos. El envío masivo no es un capricho del cliente: es el producto que le falla.',
    'RELACIÓN — EL ÚNICO CONTACTO NOS DIJO QUE YA NO ESTÁ EN LA OPERACIÓN. El 22 de julio, Guillermo Cisneros —Líder de Operaciones CAT— respondió que «actualmente no participa de forma directa en la operación» y que validaría con su equipo antes de darnos retroalimentación. Esa retroalimentación nunca llegó. Lo dijo él mismo hace casi tres meses y nadie buscó al sustituto.',
    'RELACIÓN — Y NO HAY RESPONSABLE DE TELEFONÍA EN NINGUNA FUENTE. Ni en la ficha ni en la investigación pública: no se identificó un CIO, un gerente de infraestructura ni un responsable del servicio. Hay CEO con nombre —Mércia Leite Nagem, identificada por la Cámara México-Brasil en 2026— pero sin teléfono ni correo verificable. El hueco es doble: no sabemos quién decide y no tenemos cómo preguntarlo.',
    'RELACIÓN — 83 días sin que nada llegue al cliente (`silencio_60` crítica), `contactos_json` estaba VACÍO hasta el 13 de octubre —hoy tiene ocho entradas, y sólo cuatro son personas con nombre—, cero reuniones en 27 meses y 0 de 12 del Radar. Score relacional 31. Hay cinco alertas abiertas, dos de ellas críticas.',
    'FICHA — EL CORREO VIVÍA DENTRO DEL CAMPO DE NOMBRE. «Oscar Guillermo Cisneros Linares      olinares@odontoprev.com.mx» en `contacto_nombre`, con `contacto_email` VACÍO. Es el QUINTO caso idéntico de la serie del TOP 50 —tras Torres Corzo (D1), Tech People (C1), Grupo System OOAPAS (D2) y ECODELI (C2)—, y el TERCERO en el que además `contacto_email` estaba VACÍO, que es lo que lo vuelve invisible: en C1 y en D2 el correo también estaba en su propio campo. La v2.0 contó «el tercero» saltándose dos cuentas de la serie. En toda la cartera el patrón aparece en 51 cuentas, 40 de ellas sin `contacto_email`. Un dato que existe pero está en el campo equivocado es invisible para cualquier automatismo. Corregido el 13 oct 2026.',
    'CONTEXTO — LA CONTRADICCIÓN DE TAMAÑO NO EXISTÍA, Y ERA MÍA. La ficha decía «11 a 50 empleados» y eso parecía incompatible con 76,385 llamadas y 11,083 horas de conversación. No lo es: OdontoPrev administra coberturas a través de una RED DE PRESTADORES afiliados, no de clínicas propias. Plantilla pequeña, operación grande — un millón de asegurados y 320 clientes corporativos. La investigación lo advierte de forma explícita y hay que respetarlo: una red de odontólogos NO equivale a sucursales.',
    'CONTEXTO — LOS DESTINOS DE LLAMADAS SON SUS CLIENTES CORPORATIVOS, y eso explica la estructura. Bradescard (17,960 llamadas), CAT GENERAL ODONTOPREV IKÉ (12,779), Bradescard Asistencias, Directo Asegurados Bradescard, Zurich Santander, OCESA, Welbe. Es un modelo B2B2C: cada cliente corporativo tiene su línea y sus asegurados marcan ahí. La v1.0 contó «siete clientes corporativos con línea» a partir de esta tabla, y son CUATRO marcas —Bradescard, Zurich Santander, OCESA y Welbe—, porque las tres líneas de Bradescard son el mismo cliente y porque IKÉ es el socio del joint venture, no un cliente. La cuenta de verdad está en una fuente que la v1.0 no abrió: `data/dids.json` registra 21 números para el CID 162545, y sus etiquetas nombran al menos DOCE marcas externas sobre 16 líneas —Chubb Seguros AMEX, Welbe, Bradescard (4 líneas), Bimbo, OCESA, Price Waterhouse Cooper, Qualitas Salud, Seguros Libertad, Tokio Marine, Zurich (2 líneas), Invisalign y Murguía Dental— más 5 internas: APP Odontoprev, CAT GENERAL (dos), RETENCIONES y WA API. Con la advertencia que manda `lib/dids-cuenta.ts`: la etiqueta NO es la razón social, es como el cliente bautizó ese número, así que cuáles de esas doce están entre los 320 corporativos la fuente no lo dice.',
    'CONTEXTO — Y EL SEGUNDO DESTINO MÁS GRANDE ES SU SOCIO DE ENTRADA AL PAÍS. OdontoPrev llegó a México en 2015 mediante joint venture con **Grupo IKÉ**, y `CAT GENERAL ODONTOPREV IKE` mueve 12,779 llamadas y 99,456 minutos. La alianza no es historia corporativa: está viva en el tráfico.',
    'FICHA — EL VÍNCULO CON BRADESCO QUE AFIRMABA LA FICHA NO ESTÁ CONFIRMADO. La ficha decía «Odontoprev está vinculada al Grupo Bradesco Seguros» y las notas lo repetían. La investigación institucional identifica como matriz a Odontoprev Brasil y como alianza de entrada a Grupo IKÉ, sin mencionar a Bradesco. Se reescribió como «POR CONFIRMAR» en DOS campos de tres —`grupo_empresarial` y `notas`— y el tercero NO se tocó: `observaciones_kam` sigue arrancando con «Odontoprev pertenece indirectamente al grupo financiero brasileño Bradesco, a través de su división de seguros», porque el addendum del 13 oct se añadió debajo sin corregir ese párrafo. La v1.0 declaró la corrección como completa, y por eso mismo `plan_mediano` seguía pidiendo confirmarlo. Lo que SÍ está medido es otra cosa y es más útil: **Bradescard es su mayor destino de llamadas**, con 222,233 minutos. La relación comercial con ese grupo es un hecho aunque la societaria esté sin verificar.',
    'FICHA — Y NO HABÍA CONTRADICCIÓN DE PAGO AUTOMÁTICO: EL FLAG NO MIDE NADA. `tiene_pago_automatico` está en FALSO aquí y en las 223 cuentas de la tabla —ni una sola en verdadero—, así que no es un dato que pueda contradecir al registro de adopción («Pago Automático: ALTO»): es un campo que nunca se pobló, y `lib/adopcion-auto.ts` lo dice con todas las letras —«no distinguen ‹no contratado› de ‹sin capturar›»—. Lo que SÍ está medido es el `score_pago` en 100 y cero incidencias de pago en 27 meses. La v2.0 pedía resolver con el cliente una contradicción que no existe.',
    'OPERACIÓN — EL CAT TRABAJA SÁBADO Y DOMINGO. 6,997 llamadas en sábado y 2,561 en domingo, contra unas 13,000 por día entre semana. Un centro de atención de seguros con cobertura de fin de semana es coherente con asistencias y urgencias dentales — y significa que la ventana de servicio es más ancha de lo que una ficha de «oficina corporativa» sugiere.',
  ],

  cronologia: [
    { fecha: '2015',          responsable: 'OdontoPrev',        evento: 'La matriz brasileña entra a México mediante joint venture con Grupo IKÉ. La razón social mexicana es Odontored Seguros Dentales, S.A. de C.V.', tipo: 'neutral' },
    { fecha: '03 Jul 2024',   responsable: 'Callpicker',        evento: 'Alta de la cuenta. Servicio: CP Chat + Paquete de SMS + Visibilidad y Control + DID. 27 meses de relación.', tipo: 'ok' },
    { fecha: 'Ene 2026',      responsable: 'Operación CAT',     evento: '8,366 llamadas con 421 perdidas: 5.0%. Es el peor mes del periodo medido y el punto de partida de una mejora sostenida.', tipo: 'problema' },
    { fecha: 'Mar–May 2026',  responsable: 'Mesa de ayuda',     evento: 'Empiezan a acumularse los tickets de chat: envíos masivos, reportes de campaña, plantillas verificadas. Nueve en tres meses.', tipo: 'problema' },
    { fecha: '26 Jun 2026',   responsable: 'Claudia',           evento: 'Actividad de llamada programada: NO se completó.', tipo: 'problema' },
    { fecha: '16 Jul 2026',   responsable: 'Claudia',           evento: 'Análisis de tickets cerrado, y el diagnóstico es correcto: «la categoría con mayor recurrencia es Asistencia en Chat… la demanda de soporte es de carácter operativo y no por fallas del servicio».', tipo: 'ok' },
    { fecha: '22 Jul 2026',   responsable: 'Claudia / Cisneros', evento: 'ÚLTIMO contacto efectivo. Cisneros responde que «actualmente no participa de forma directa en la operación» y que validará con su equipo. Desde aquí se cuentan los 83 días.', tipo: 'pivote' },
    { fecha: '24 Jul 2026',   responsable: 'Claudia',           evento: 'Se registra el seguimiento. La retroalimentación prometida por el cliente nunca llegó, y nadie buscó al sustituto.', tipo: 'problema' },
    { fecha: 'Ago 2026',      responsable: 'Mesa de ayuda',     evento: 'Siete tickets CERRADOS, empatado con septiembre como el mes de más cierres del año, con dos fallas. Entre ellos el folio 105738 de «Bandeja de entrada», abierto el 16 de abril y cerrado el 7 de agosto: 2,709 horas de resolución.', tipo: 'problema' },
    { fecha: 'Ago 2026',      responsable: 'Operación CAT',     evento: 'Mes cerrado: 10,360 llamadas con 1.9% de pérdida, 1.58 puntos por DEBAJO de su base propia. La mejor lectura del periodo.', tipo: 'ok' },
    { fecha: '12 Sep 2026',   responsable: 'Mesa de ayuda',     evento: 'Se CIERRA el folio 385 de «Envío Masivo WhatsApp», que se había abierto el 8 de enero: 5,908 horas de resolución, 246 días. Septiembre es su mes de CIERRE y no de apertura — en esta fuente `fecha`/`mes` es el mes de cierre, y la v1.0 lo leyó como si fuera la apertura.', tipo: 'problema' },
    { fecha: '06 Oct 2026',   responsable: 'Motor de alertas',  evento: 'Se abren cuatro alertas: `sin_consumo_medible` y `silencio_60` (críticas), `sin_radar` y `sin_contactos` (altas).', tipo: 'problema' },
    { fecha: '12 Oct 2026',   responsable: 'Motor de alertas',  evento: 'Se abre `sac_fallas_recurrentes`: 5 fallas sobre 30 tickets. La última falla se abrió el 1 de septiembre; el «6 de octubre» de la evidencia es la última apertura de CUALQUIER ticket, no de una falla.', tipo: 'problema' },
    { fecha: '13 Oct 2026',   responsable: 'Callpicker',        evento: 'Auditoría. Se corrige el importe ($10,901 → $23,325), se separa el correo del campo de nombre y se capturan 8 contactos donde había cero, con la investigación institucional de dirección.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Nombre comercial',      value: 'OdontoPrev México' },
    { label: 'Razón social',          value: 'Odontored Seguros Dentales, S.A. de C.V.' },
    { label: 'Sector',                value: 'Seguros / salud dental — B2B, B2C y colectivos' },
    { label: 'Modelo',                value: 'Administra coberturas a través de una RED DE PRESTADORES. NO es cadena de clínicas propias.' },
    { label: 'Entrada a México',      value: '2015, mediante joint venture con Grupo IKÉ' },
    { label: 'Matriz',                value: 'Odontoprev Brasil. El vínculo con Bradesco está POR CONFIRMAR en `grupo_empresarial` y `notas` — pero `observaciones_kam` todavía lo afirma como hecho, y eso sigue publicado en la ficha.' },
    { label: 'Operación',             value: '~1 millón de asegurados · 320 clientes corporativos' },
    { label: 'Plantilla',             value: '11–50 en México (LinkedIn) · ~2,000 en el grupo global' },
    { label: 'Sede',                  value: 'UNA oficina corporativa: Av. Paseo de la Reforma 373, Piso 11, Col. Cuauhtémoc, CDMX 06500' },
    { label: 'Expansión mencionada',  value: 'Querétaro, Guanajuato y Nuevo León (Cámara México-Brasil, 2026). NO confirma oficinas físicas.' },
    { label: 'Teléfonos públicos',    value: '55 5480 0911 (directorio AMIS) · 55 5080 0200 y 55 5480 0777 (directorios comerciales, vigencia por comprobar)' },
    { label: 'Cliente desde',         value: '3 de julio de 2024 — 27 meses' },
    { label: 'Servicio contratado',   value: 'CP Chat + Paquete de SMS + Visibilidad y Control + DID' },
    { label: 'MRR institucional',     value: '$23,325 MXN — el `mrrFin` de las DOS líneas del mismo CID: «Odontoprev ATC» $19,820 (en Downgrade) + «Odontoprev» $3,505. La ficha decía $10,901, y esa cifra SÍ se reproduce: es el `acumulado ÷ meses` —el promedio de vida— de la línea «Odontoprev» en un corte de 23 meses ($250,731.12 ÷ 23 = $10,901.35), o sea UNA de las dos líneas y medida con otra fórmula. No es un MRR y no se compara con uno.' },
    { label: 'Uso real medido',       value: '76,385 llamadas · 664,956 minutos · 11,083 horas · 8.7 min por llamada (9.0 si se divide entre las 73,965 no perdidas, que es otro denominador y además incluye menú y buzón)' },
    { label: 'Health Score',          value: '72 — el más alto de las OCHO del TOP 50, no de todas las auditorías escritas: F4 Ancona tiene 76 y C26 Grupo 2711, 84 · adopción 100, pago 100, relacional 31 y actividad en el 50 por omisión, o sea medido al 65%' },
  ],

  necesidad_negocio: 'OdontoPrev no atiende pacientes: administra coberturas. Vende seguros dentales a empresas y a personas, y cuando un asegurado necesita algo, lo resuelve a través de una red de odontólogos afiliados. Su plantilla en México es de 11 a 50 personas y su operación cubre a cerca de un millón de asegurados de 320 clientes corporativos. Esa desproporción es el negocio, no una anomalía.\n\nY por eso el teléfono es su operación entera. Cada cliente corporativo tiene su propia línea —Bradescard, Zurich Santander, OCESA, Welbe, y en `data/dids.json` ocho marcas más— y los asegurados de cada uno marcan ahí; la línea de IKÉ es la de su socio del joint venture, no la de un cliente. Son 76,385 llamadas en ocho meses y medio con 8.7 minutos de conversación de media: once mil horas de gente resolviendo coberturas, autorizaciones y citas. Para una empresa de cincuenta personas como máximo, el centro de atención es casi todo lo que hace.\n\nEso define qué significa una llamada perdida aquí: es un asegurado de un cliente corporativo que no fue atendido, y la queja no llega a OdontoPrev — llega a Bradescard, a IKÉ o a Zurich. El servicio que nos compra es, literalmente, cómo cumple frente a sus propios clientes.\n\nLa necesidad que tiene hoy y que nadie ha puesto sobre la mesa es doble. Una: saber qué línea suya funciona mejor y cuál peor, que hoy no puede porque la mitad de su tráfico ni siquiera trae destino identificado en nuestro archivo. Y dos: que el envío masivo deje de fallarle, porque veinte de sus treinta tickets son envíos masivos y reportes de campaña —once y nueve— y uno de ellos tardó 246 días en cerrarse.',

  potencial_corto: [
    'Arreglar el enrutamiento de «Rojas Chávez Carlos Alberto Octaviano»: 918 sin contestar de 1,009, el 37.9% de todas las pérdidas de la cuenta sobre el 1.32% de su volumen. Y aparte —como revisión con soporte, no como enrutamiento que se retire— las 322 que cayeron en el cubo «(sin destino registrado)» sin llegar a ninguna extensión.',
    'Explicarle los dos tickets que tardaron 246 y 113 días en cerrarse, antes de que los saque él. Están cerrados, pero el cliente los vivió: llegar a hablar de crecimiento sin haberlos explicado le entrega el argumento.',
    'Identificar al responsable de telefonía: nuestro único contacto dijo hace tres meses que ya no está en la operación, y no hay sustituto ni en la ficha ni en fuentes públicas.',
    'Etiquetar el 51.4% del tráfico que no trae destino, para poder darle al cliente el desglose por línea corporativa.',
  ],

  potencial_largo: [
    'Reporte por cliente corporativo: cada línea es un contrato suyo con Bradescard, Zurich, OCESA o cualquiera de las otras marcas que etiquetan sus 21 números —la de IKÉ es la de su socio, no la de un cliente—. Un informe de atención por línea es material con el que él cumple frente a SUS clientes, no una función más.',
    'IA de Chat: no la tiene contratada, y el chat es justo donde se concentran todos sus tickets. Es el producto que resolvería su dolor conocido.',
    'IA de Voz: tampoco contratada. Con 11,083 horas de conversación y un CAT que trabaja fin de semana, hay franja para automatizar lo repetitivo.',
    'Integración API: no la nombra su servicio contratado —«CP Chat + Paquete de SMS + Visibilidad y Control + DID»— ni tiene registro de adopción. El flag `tiene_integracion_api` NO es la prueba y no se cita como tal: está en falso en 221 de las 223 cuentas de la tabla y nunca se pobló. Una aseguradora que valida coberturas por teléfono es el caso natural de una consulta automatizada contra su sistema.',
  ],

  tacticas: [
    { nombre: 'Abrir con la mejora, no con el problema', descripcion: 'Su pérdida bajó de 5.0% a 1.9% mientras el volumen subía. Es verdad, es suyo y es una buena noticia que nadie le ha dado.', impacto: 'Compra el derecho a hablar después del destino roto —UNO, la extensión de Rojas Chávez, con 918 sin contestar de 1,009— y del ticket de 246 días.' },
    { nombre: 'Llevar el destino roto con nombre y cifra', descripcion: '«Hay una extensión a nombre de Carlos Alberto Rojas Chávez que recibió 1,009 llamadas y sólo 91 las tomó alguien: 918 quedaron sin contestar, desde 102 números distintos». Es específico, verificable y se arregla en un día.', impacto: 'Demuestra que miramos su operación al detalle, y resuelve el 37.9% de sus pérdidas.' },
    { nombre: 'Reconocer los 246 días de resolución antes de que lo saque él', descripcion: 'Llevarlo nosotros a la mesa: ya está cerrado, pero tardó 246 días y el cliente lo vivió. Con la causa por escrito y la medida que evita el siguiente. Es nuestro, no suyo.', impacto: 'Quita de la conversación la única objeción que no se puede contestar con datos.' },
    { nombre: 'Buscar al sustituto por la vía corporativa', descripcion: 'Cisneros dijo que validaría con su equipo. Preguntarle directamente a quién hay que escribirle, en vez de seguir escribiéndole a él.', impacto: 'Convierte tres meses de silencio en un nombre.' },
  ],

  senal_alarma: 'Una cuenta de $23,325 al mes cuyo único contacto nos avisó hace tres meses de que ya no está en la operación, sin que nadie haya buscado al sustituto; con la ficha sin un solo contacto capturado hasta el 13 de octubre, cero reuniones en 27 meses, cero del Radar y cinco alertas abiertas; y con un ticket de envío masivo que tardó 246 días en cerrarse. El servicio de voz mejora solo, lo cual es justamente lo que ha hecho que nadie mire la cuenta.',

  problema_raiz: 'El indicador que todos miran —la pérdida de llamadas— viene mejorando, y esa mejora tapó que el cliente nos avisó de que ya no teníamos interlocutor.',

  problema_raiz_detalle: 'El 22 de julio de 2026 el cliente nos dijo algo importante y quedó escrito en nuestra propia ficha: Guillermo Cisneros, el único contacto registrado, respondió que «actualmente no participa de forma directa en la operación» y que validaría la información con su equipo antes de darnos retroalimentación. Esa retroalimentación nunca llegó, y en los 83 días siguientes nadie buscó a quién la tenía. La frase estaba ahí, en el seguimiento, legible. Un cliente que te avisa de que has dejado de hablar con la persona correcta te está dando la oportunidad de corregirlo, y la dejamos pasar.\n\nLa primera capa de por qué pasó es que los números iban bien. La pérdida de llamadas bajó de 5.0% a 1.9% mientras el volumen crecía, y el Health Score es 72, el más alto de las OCHO del TOP 50 —y el tercero de las 42 auditorías escritas: C26 Grupo 2711 tiene 84 y F4 Ancona, 76—. Cuando el semáforo mejora, la cuenta deja de subir a la cola de nadie. Es la misma mecánica que en ECODELI —una cuenta que no da problemas no es una cuenta atendida— sólo que aquí es más engañosa, porque la mejora era real.\n\nLa segunda es que se miró el canal equivocado. El servicio de voz, que es lo que el tablero mide con detalle, es justamente lo que funciona. El canal que falla es el chat: veinte de sus treinta tickets son sobre envíos masivos y campañas, hay cinco fallas registradas y uno de esos tickets tardó 246 días en cerrarse. El propio asesor lo diagnosticó bien el 16 de julio —«la categoría con mayor recurrencia es Asistencia en Chat… la demanda de soporte es de carácter operativo»— pero la conclusión que se sacó fue que la cuenta estaba estable, cuando lo que ese patrón decía es que el cliente necesita del producto algo que el producto no le está dando solo.\n\nLa tercera es de agregación, y es la que esconde el hallazgo más accionable. La cuenta pierde el 3.17% de sus llamadas, que es una cifra aceptable y no invita a investigar. Pero ese promedio mezcla líneas impecables —Bradescard al 0.5%— con una extensión personal que deja sin contestar el 91.0% de lo que recibe. Mirando sólo el total es invisible; mirando por destino es el 37.9% de todas las pérdidas sobre el 1.32% del tráfico. El promedio no mintió: ocultó.\n\nY la cuarta es de ficha. El importe de la ficha era el 47% del MRR institucional porque no era un MRR: era el `acumulado ÷ meses` —el promedio de vida— de UNA de las dos líneas del GRC, congelado en un corte en que ese renglón llevaba 23 meses ($250,731.12 ÷ 23 = $10,901.35); el correo del contacto vivía dentro del campo de nombre, donde ningún automatismo lo ve; y `contactos_json` estaba vacío en una cuenta de 27 meses. Nada de eso es culpa de quien la atiende: es que la ficha no obliga a nada y nadie revisa si lo que guarda es cierto.',

  flujo_real: [
    { fase: 'El asegurado marca',      area: 'Cliente de Bradescard, Zurich u OCESA', accion: 'Llama a la línea de su propio corporativo', resultado: '76,385 llamadas al periodo, 8.7 minutos de media' },
    { fase: 'Entra por su línea',      area: 'Callpicker',          accion: 'La llamada se dirige al destino de ese cliente corporativo', resultado: 'Bradescard 0.5% de pérdida · CAT IKÉ 1.5% — impecables' },
    { fase: '…salvo una extensión',    area: 'Callpicker / OdontoPrev', accion: 'La llamada cae en una extensión personal que casi nunca contesta', resultado: '918 de las 2,420 sin contestar, sobre el 1.32% del volumen' },
    { fase: 'Un agente del CAT atiende', area: 'OdontoPrev',        accion: 'Resuelve cobertura, autorización o cita', resultado: '11,083 horas de conversación con una plantilla de 11–50 personas' },
    { fase: 'El tablero lo evalúa',    area: 'Dashboard',           accion: 'Publica el 3.17% de pérdida del total', resultado: 'Cifra aceptable que esconde una extensión al 91.0%' },
    { fase: 'El cliente pide campañas',area: 'Mesa de ayuda',       accion: 'Abre ticket de envío masivo o reporte de campaña', resultado: '20 de 30 tickets · 5 fallas · uno tardó 246 días en cerrarse' },
    { fase: 'SAC revisa',              area: 'SAC',                 accion: 'Análisis de tickets del 16 de julio', resultado: 'Diagnóstico correcto —«asistencia en chat, carácter operativo»— y conclusión de cuenta estable' },
    { fase: 'El cliente avisa',        area: 'OdontoPrev',          accion: '«Ya no participo de forma directa en la operación»', resultado: '83 días después, nadie ha buscado al sustituto' },
  ],

  comparativo: [
    { metrica: 'Importe en la ficha', real: '$10,901 — el promedio de vida de UNA de las dos líneas: $250,731.12 ÷ 23 meses', ideal: '$23,325 — el `mrrFin` de las DOS líneas del mismo CID' },
    { metrica: 'Pérdida de llamadas · tendencia', real: '5.0% (ene) → 1.9% (ago, cerrado), con abril y mayo al alza', ideal: 'Ya va bien. Es la única del TOP 50 que mejora sola, y el tramo limpio es jun–ago.' },
    { metrica: 'La peor ruta real', real: '91.0% sin contestar — 918 de 1,009', ideal: 'Al nivel del resto de sus destinos: 0.9%' },
    { metrica: 'Concentración de las pérdidas', real: '37.9% de ellas en el 1.32% del tráfico — un solo destino', ideal: 'Repartidas, o sea sin un cuello identificable' },
    { metrica: 'Tráfico con destino identificado', real: '48.0% — 36,677 de 76,385, descontando los DOS cubos', ideal: '100% — sin eso no hay reporte por cliente corporativo' },
    { metrica: 'Ticket que más tardó en cerrarse', real: '5,908 horas · 246 días — 8 ene → 12 sep, CERRADO', ideal: 'Ninguno fuera de SLA' },
    { metrica: 'Tickets abiertos hoy', real: 'NO MEDIBLE — el export sólo trae cerrados', ideal: 'Un export que traiga también los abiertos' },
    { metrica: 'Tickets por encima de 7 días', real: '8 de 30 (26.7%)', ideal: '<5%' },
    { metrica: 'Contactos capturados', real: '0 en `contactos_json` (corregido a 8 el 13 oct)', ideal: 'Quien opera, quien decide y quien paga' },
    { metrica: 'Responsable de telefonía', real: 'SIN IDENTIFICAR en ninguna fuente', ideal: 'Un nombre con correo' },
    { metrica: 'Reuniones en 27 meses', real: 'NINGUNA', ideal: 'Trimestral: 9' },
    { metrica: 'Radar de 12 preguntas', real: '0 respondidas', ideal: '12 de 12' },
    { metrica: 'Días desde el último contacto', real: '83', ideal: '<30' },
  ],

  plan_inmediato: [
    { accion: '✓ HECHO el 13 oct 2026 — Corregido el importe de la ficha: $10,901 → $23,325, que son las DOS líneas del mismo CID. Y capturados 8 contactos donde había cero, con el correo sacado del campo de nombre', responsable: 'Claudia / Facturación', criterio: 'Aplicado y comprobado leyendo de vuelta con `scripts/enriquece-odontoprev.py`' },
    { accion: 'ARREGLAR EL ENRUTAMIENTO DE LA EXTENSIÓN «Rojas Chávez Carlos Alberto Octaviano»: 918 sin contestar de 1,009, que es el 37.9% de las pérdidas de la cuenta sobre el 1.32% del tráfico. Y, por separado y con soporte, revisar las 322 que cayeron en el cubo «(sin destino registrado)» sin llegar a ninguna extensión: eso no es un destino que se pueda retirar, es una pregunta para el archivo', responsable: 'Ingeniería / Claudia', criterio: 'La extensión por debajo del 5% sin contestar, o retirada si ya no debe existir; y una explicación escrita de las 322' },
    { accion: 'EXPLICAR los 246 días que tardó en cerrarse el folio 385 de «Envío Masivo WhatsApp» (8 ene → 12 sep) y los 113 del 105738 de «Bandeja de entrada» (16 abr → 7 ago). Los DOS están cerrados, así que no hay nada que cerrar: lo que falta es por qué tardaron y qué evita el tercero', responsable: 'Mesa de ayuda', criterio: 'Causa escrita de los dos casos y una medida de contención, antes de la conversación comercial' },
    { accion: 'IDENTIFICAR AL RESPONSABLE DE LA OPERACIÓN. Cisneros avisó el 22 de julio de que ya no participa; preguntarle a él mismo a quién hay que escribirle, que es lo que no se hizo en 83 días', responsable: 'Claudia', criterio: 'Un nombre con cargo y correo, capturado en la ficha' },
    { accion: 'Preguntar por el Downgrade de la línea «Odontoprev ATC»: de $20,018 a $19,820. Son $198, pero es un movimiento a la baja en la línea que concentra el 85% del contrato', responsable: 'Claudia', criterio: 'Se sabe qué se redujo y por qué' },
    { accion: 'RETIRADA el 13 oct 2026 — no había contradicción que resolver: `tiene_pago_automatico` está en FALSO en las 223 cuentas de la tabla y nunca se pobló, así que no contradice al registro de adopción. No se le pregunta al cliente por un campo vacío nuestro', responsable: '—', criterio: 'Sin tarea: el flag no es una medición (`lib/adopcion-auto.ts`)' },
  ],

  plan_mediano: [
    { accion: 'Etiquetar el 51.4% del tráfico que llega sin destino identificado', responsable: 'Ingeniería', criterio: 'Todas las llamadas con su línea corporativa identificada' },
    { accion: 'Primera reunión en 27 meses, con quien opere el CAT y con quien decida sobre el servicio', responsable: 'Claudia', criterio: 'Reunión registrada con minuta, y el Radar contestado en la misma sesión' },
    { accion: 'Atacar de raíz el envío masivo Y los reportes de campaña: 20 de 30 tickets —11 de envío masivo y 9 de reporte de campaña— y 3 de las 5 fallas son eso. O es una capacitación que no se dio, o es una función que no cubre lo que el cliente necesita', responsable: 'Mesa de ayuda / Producto', criterio: 'Cero tickets de envío masivo durante 60 días' },
    { accion: 'Confirmar o descartar el vínculo con Bradesco que la ficha afirmaba y la investigación no respalda — y mientras tanto corregir `observaciones_kam`, que sigue afirmándolo como hecho aunque `grupo_empresarial` y `notas` ya digan POR CONFIRMAR', responsable: 'Claudia', criterio: 'Los TRES campos dicen lo mismo, y dicen lo que se puede sostener con su fuente' },
  ],

  plan_estrategico: [
    { accion: 'Reporte de atención por cliente corporativo. Cada destino es un contrato suyo —Bradescard, Zurich, OCESA, Welbe y las ocho marcas más que etiquetan sus 21 números; la de IKÉ es la de su socio—: un informe por línea es con lo que él cumple frente a SUS clientes', responsable: 'Producto / Claudia', criterio: 'El cliente recibe un reporte mensual por línea corporativa' },
    { accion: 'IA de Chat: es el canal donde se concentran todos sus tickets, y no la tiene contratada', responsable: 'Claudia', criterio: 'Propuesta presentada citando sus propios 20 tickets de campañas y envíos masivos' },
    { accion: 'IA de Voz para la franja de fin de semana: el CAT atiende sábado (6,997 llamadas) y domingo (2,561)', responsable: 'Claudia', criterio: 'Propuesta con el perfil real de su tráfico de fin de semana' },
    { accion: 'QUE EL TABLERO MUESTRE LA PÉRDIDA POR DESTINO, NO SÓLO EL TOTAL. El 3.17% de esta cuenta es aceptable y esconde UN destino real al 91.0% —la extensión «Rojas Chávez», 918 sin contestar de 1,009— más dos cubos de la tabla que no son destinos. El promedio no mintió: ocultó', responsable: 'Producto / Dirección', criterio: 'La ficha de cuenta señala los destinos cuya pérdida se aparta del resto' },
  ],

  areas_oportunidad: [
    { area: 'La extensión «Rojas Chávez» mal enrutada', impacto: '918 llamadas sin contestar, el 37.9% del total de la cuenta', responsable: 'Ingeniería' },
    { area: 'El envío masivo y los reportes de campaña, en el chat', impacto: '20 de 30 tickets —11 de envío masivo y 9 de reporte de campaña— y 3 de las 5 fallas', responsable: 'Mesa de ayuda / Producto' },
    { area: 'Reporte por cliente corporativo', impacto: 'Es con lo que el cliente cumple frente a Bradescard, Zurich, OCESA y las demás marcas de sus 21 números', responsable: 'Producto' },
    { area: 'IA de Chat', impacto: 'El canal que le falla, sin producto que lo resuelva', responsable: 'Claudia' },
    { area: 'Identificar al decisor', impacto: 'Cuenta de $23,325 al mes sin interlocutor desde julio', responsable: 'Claudia' },
    { area: 'Integración API', impacto: 'Validación de coberturas por teléfono, hoy manual', responsable: 'Ingeniería' },
  ],

  perfiles: [
    {
      nombre: 'Oscar Guillermo Cisneros Linares', rol: 'Líder de Operaciones CAT — OdontoPrev', color: '#f59e0b',
      campos: [
        { label: 'Correo',    value: 'olinares@odontoprev.com.mx · 55 7112 6459' },
        { label: 'Lo que dijo', value: '22 jul 2026: «actualmente no participa de forma directa en la operación». Prometió validar con su equipo.' },
        { label: 'Qué pasó después', value: 'Nada. 83 días sin retroalimentación y sin que nadie buscara al sustituto.' },
        { label: 'Sigue siendo útil', value: 'Es el único que nos ha respondido. Preguntarle a QUIÉN escribirle es la vía más corta al decisor.' },
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
        { label: 'Por qué importa', value: 'Es quien decide sobre un contrato de $23,325 al mes y quien sufre el ticket de 246 días' },
        { label: 'Dónde buscarlo', value: 'Por Cisneros, que ofreció validar con su equipo, o por la dirección general' },
      ],
    },
    {
      nombre: 'Claudia', rol: 'Asesora SAC de la cuenta — Callpicker', color: '#22c55e',
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
      'La pérdida de llamadas MEJORA sola: 5.0% en enero → 1.9% en agosto, con el volumen creciendo — y con abril y mayo al alza en medio, así que el tramo limpio es junio–agosto',
      'El mes cerrado está 1.58 puntos por debajo de su propia base: 163 llamadas perdidas menos de lo normal',
      'Las líneas de negocio son impecables: Bradescard 0.5%, Bradescard Asistencias 0.4%, CAT IKÉ 1.5%',
      'Health Score 72, el más alto de las OCHO del TOP 50, con adopción y pago en 100 y tres de los cuatro bloques capturados: el 65% del peso',
      'Adopción medida y ALTA en los tres productos registrados',
      'Cero incidencias de pago en 27 meses',
    ],
    oportunidades: [
      'Un enrutamiento roto concentra el 37.9% de las pérdidas sobre el 1.32% del tráfico: arreglo barato y de efecto grande',
      'No tiene IA de Chat ni IA de Voz contratadas, y el chat es justo su canal problemático',
      'Cuatro clientes corporativos en la tabla de destinos, y al menos doce marcas externas etiquetando sus 21 números: un reporte por línea es material con el que él cumple frente a ellos',
      'Ni Integración API en el servicio contratado ni registro de adopción de ella, en una aseguradora que valida coberturas por teléfono — el flag `tiene_integracion_api` no lo prueba: está en falso en 221 de las 223 cuentas y nunca se pobló',
    ],
    debilidades: [
      'El único contacto avisó hace tres meses de que ya no está en la operación, y no se buscó sustituto',
      'Un ticket de envío masivo tardó 246 días en cerrarse; otro, 113 — y «abiertos hoy» no se puede medir con esta fuente',
      '20 de 30 tickets son sobre envíos masivos y campañas, con 5 fallas registradas',
      'El 51.4% del tráfico no trae destino identificado',
      'Cero reuniones en 27 meses, 0 de 12 del Radar, score relacional 31',
      'La ficha tenía el importe al 47% del MRR institucional —guardaba un promedio de vida de UNA de las dos líneas, no un MRR— y el correo dentro del campo de nombre',
    ],
    amenazas: [
      'NO SABEMOS QUIÉN DECIDE SOBRE ESTE CONTRATO. En una cuenta de $23,325 al mes, con el interlocutor retirado desde julio y sin responsable de telefonía identificado en ninguna fuente, una decisión de renovación la tomaría alguien con quien nunca hemos hablado.',
      'Sus clientes corporativos son marcas grandes: CUATRO están MEDIDAS en su tabla de destinos —Bradescard, Zurich Santander, OCESA y Welbe— y las etiquetas de sus 21 DIDs nombran otras, entre ellas Chubb Seguros AMEX, Bimbo y Tokio Marine, con la salvedad que manda `lib/dids-cuenta.ts`: la etiqueta es como el cliente bautizó ese número, no la razón social. Una llamada sin contestar no se queja a OdontoPrev, se queja a ellos, y eso escala por encima de nuestro interlocutor',
      'Los 246 días que tardó en cerrarse ese ticket son el argumento servido para cualquier conversación de renovación, aunque hoy esté cerrado',
      'La línea que concentra el 85% del contrato viene de un Downgrade sin explicar',
      'La mejora de la voz hace que la cuenta no se encienda en ningún semáforo, así que seguiría invisible otros 27 meses',
    ],
  },

  conclusion: 'ODONTOPREV es la primera cuenta de la serie donde lo que el tablero mide va a MEJOR. La pérdida de llamadas bajó de 5.0% en enero a 1.9% en agosto —con abril y mayo al alza en medio, así que la curva no es recta— mientras el volumen crecía de 8,366 a 12,865 llamadas en julio, su pico, para cerrar agosto en 10,360. El mes cerrado está 1.58 puntos por debajo de su propia base. Las líneas de sus clientes corporativos funcionan a media décima de punto. El Health Score es 72, el más alto de las OCHO del TOP 50 — no de todas las auditorías escritas, que es como lo decía la v1.0. Nada de eso es un espejismo.\n\nY aun así hay tres cosas que no se pueden dejar como están. La primera es que el promedio esconde: el 3.17% global de pérdida mezcla líneas impecables con una extensión a nombre de una persona —«Rojas Chávez Carlos Alberto Octaviano»— que recibió 1,009 llamadas y de la que sólo 91 las tomó alguien, concentrando el 37.9% de todas las pérdidas sobre el 1.32% del tráfico. Se arregla en un día y nadie lo ha mirado porque el total no invitaba a mirar. Y hay que decirlo porque cambia el titular: la v1.0 inflaba esto a «la mitad de las pérdidas en tres destinos» sumándole un cubo de la tabla y un destino de ocho llamadas. Corregido, el hallazgo sigue siendo el más accionable de la cuenta — pero vale 918 llamadas, no 1,247.\n\nLa segunda es que el canal que falla no es el que medimos. La voz va bien; el chat acumula veinte tickets de envíos masivos, cinco fallas —la última abierta el 1 de septiembre— y un caso que tardó 246 días en cerrarse. El asesor diagnosticó el patrón correctamente en julio —«asistencia en chat, de carácter operativo»— y la conclusión que se sacó fue «cuenta estable». Pero un soporte operativo que se repite veinte veces no es estabilidad: es una necesidad de producto que nadie ha convertido en propuesta.\n\nLa tercera es la que más pesa. El 22 de julio el cliente nos dijo, por escrito y en nuestra propia ficha, que la persona con la que hablábamos ya no participa en la operación. Prometió validar con su equipo y nunca volvió. Han pasado 83 días y no hemos buscado a quién. Hoy no sabemos quién decide sobre un contrato de $23,325 al mes, y la investigación pública tampoco lo sabe: hay CEO con nombre pero sin forma de contactarla, y ningún responsable de telefonía identificable.\n\nLa lección es la misma que en ECODELI, con un giro: allí una cuenta que no se quejaba nunca se volvió invisible; aquí una cuenta que MEJORABA se volvió invisible. Un indicador que va bien no es una razón para dejar de mirar — es exactamente cuando conviene mirar lo que ese indicador no cubre.',

  pierde: [
    'Callpicker pierde $23,325 al mes si la cuenta no renueva, y la decisión la tomaría alguien a quien no conocemos.',
    'Se pierde el acceso indirecto a sus clientes corporativos: cuatro aparecen en la tabla de destinos —Bradescard, Zurich Santander, OCESA y Welbe— y las etiquetas de sus 21 números nombran al menos DOCE marcas externas, entre ellas Chubb Seguros AMEX, Bimbo, Price Waterhouse Cooper, Qualitas Salud, Tokio Marine y Seguros Libertad. IKÉ no cuenta aquí: es el socio del joint venture, no un cliente.',
    'Se pierden 11,083 horas de conversación al periodo: uno de los mayores volúmenes reales de voz de la cartera.',
    'Y se pierde una cuenta que estaba mejorando, que es la peor forma de perder una.',
  ],

  gana: [
    'Arreglar un enrutamiento elimina el 37.9% de las pérdidas de la cuenta: es el mejor retorno por esfuerzo de toda la serie.',
    'No tiene IA de Chat ni IA de Voz contratadas, y el chat es su dolor conocido y documentado en 20 tickets.',
    'Un reporte por cliente corporativo convierte nuestro dato en el instrumento con el que él cumple frente a Bradescard y Zurich.',
    'La curva de mejora es un argumento real y verificable para abrir la conversación en positivo.',
  ],

  recomendacion_central: 'BUSCAR AL DECISOR ESTA SEMANA, Y POR LA VÍA MÁS CORTA: preguntándole a Cisneros a quién hay que escribirle. Él mismo nos avisó el 22 de julio de que ya no participa en la operación y se ofreció a validar con su equipo; en 83 días nadie recogió esa pelota. Hoy no sabemos quién decide sobre un contrato de $23,325 al mes, y la investigación pública tampoco: hay CEO identificada —Mércia Leite Nagem— pero sin vía de contacto verificable, y ningún responsable de telefonía en ninguna fuente. Mientras eso siga así, todo lo demás que se haga en esta cuenta es trabajo sin destinatario.\n\nANTES DE LLAMAR, DOS COSAS DE CASA, Y LAS DOS SON NUESTRAS. Arreglar el enrutamiento de «Rojas Chávez Carlos Alberto Octaviano» —918 sin contestar de 1,009—, que es el 37.9% de las pérdidas de la cuenta sobre el 1.32% de su tráfico y se corrige en un día; y, por separado, preguntarle a soporte por las 322 que cayeron en el cubo «(sin destino registrado)» sin llegar a ninguna extensión, que no es un enrutamiento que se retire sino una pregunta para el archivo. Y tener lista la explicación de los dos tickets que tardaron 246 y 113 días en cerrarse: están CERRADOS los dos, pero el cliente los vivió, y llegar a una conversación de renovación sin haberlos explicado es entregarle el único argumento que no se puede contestar con datos.\n\nY CUANDO SE HABLE, ABRIR POR LA MEJORA. Su pérdida bajó de 5.0% a 1.9% mientras su volumen crecía: es verdad, es suyo, y nadie se lo ha dicho. Después de eso se puede llevar lo demás — el desglose por línea corporativa que hoy no podemos darle porque la mitad de su tráfico llega sin destino, y la propuesta de IA de Chat, que es el canal donde se concentran veinte de sus treinta tickets.\n\nLo que NO hay que hacer es leer la mejora de la voz como que la cuenta está atendida. Lo que mejora es el indicador que miramos; lo que falla es el canal que no miramos y la relación que no existe.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 30 tickets de «Odontoprev» (CID 162545) en lib/tickets-data.json',
    periodo: 'Cierres de marzo a octubre de 2026 — `fecha`/`mes` es el mes de CIERRE, no de apertura: las aperturas de estos 30 tickets arrancan en ENERO. La fuente trae SÓLO tickets cerrados (2 filas sin cierre de 6,676, el 0.03%), así que «abiertos» no es cero: es NO MEDIBLE',
    diagnostico: 'El producto que le falla a OdontoPrev no es la voz: es el CHAT, y dentro del chat, el envío masivo. De 30 tickets, 27 son de canal chat y veinte son sobre campañas y envíos masivos —«Reporte de Campaña» 9, «Envío Masivo WhatsApp» 7, «Falla Envíos Masivos» 3, «Envío Masivo SMS» 1— y la voz aparece una sola vez: un ticket de DiDs abierto el 29 de septiembre y cerrado el 1 de octubre. El asesor lo diagnosticó bien en julio: «la demanda de soporte es de carácter operativo y no por fallas del servicio». Es cierto para 25 de los 30, pero las otras cinco SÍ son fallas, tres de ellas de envíos masivos, y la alerta `sac_fallas_recurrentes` se abrió el 12 de octubre por eso — con su última falla abierta el 1 de SEPTIEMBRE, no en octubre. Un cliente que pide veinte veces ayuda con lo mismo no es un cliente demandante: es una función que no se basta sola.',
    metricas: [
      { metrica: 'Tickets totales',          valor: '30 · cierres mar–oct 2026', lectura: 'Por mes de CIERRE: 7 en agosto y 7 en septiembre, empatados como el pico. Las aperturas arrancan en enero.' },
      { metrica: 'De chat',                  valor: '27 de 30',               lectura: 'Producto Chat 27, Voz 1, sin producto 2. La voz aparece una vez: el canal problemático es el otro.' },
      { metrica: 'Sobre envíos masivos y campañas', valor: '20 · 66.7%',      lectura: 'El patrón dominante y la conversación de producto pendiente' },
      { metrica: 'Fallas del servicio',      valor: '5 · 16.7%',              lectura: '3 de ellas de envíos masivos. La última se abrió el 1 de septiembre; la alerta, el 12 de octubre.' },
      { metrica: 'Mediana de resolución',    valor: '69 horas',               lectura: 'Razonable. La media (379 h) está inflada por dos casos extremos. El «70» de la v1.0 era `dur[n // 2]`, el valor superior del par central (68 y 70), que con n par siempre sesga arriba.' },
      { metrica: 'El que más tardó',         valor: '5,908 h · 246 días',     lectura: 'Folio 385, «Envío Masivo WhatsApp»: abierto el 8 de enero, CERRADO el 12 de septiembre' },
      { metrica: 'El segundo',               valor: '2,709 h · 113 días',     lectura: 'Folio 105738, «Bandeja de entrada»: abierto el 16 de abril, CERRADO el 7 de agosto' },
      { metrica: 'Tickets de más de 7 días', valor: '8 de 30 · 26.7%',        lectura: 'Uno de cada cuatro se queda semanas' },
      { metrica: 'Abiertos hoy',             valor: 'NO MEDIBLE',            lectura: 'El export sólo trae cerrados —2 filas sin cierre de 6,676— así que `ABIERTOS_MEDIBLE` da FALSE. El 0 de la ficha no es una medición.' },
    ],
    reincidencias: [
      { patron: 'Reporte de Campaña (chat)',     veces: '9 · 30.0%', causa: 'El cliente pide el reporte en vez de obtenerlo. Es una función que no se basta sola, o una capacitación que no se dio.' },
      { patron: 'Envío Masivo WhatsApp (chat)',  veces: '7 · 23.3%', causa: 'Mismo patrón documentado en Torres Corzo, que levanta 22 de éstos. NO en FINSUS: su expediente no menciona «masivo» ni una vez, y lo suyo son las plantillas verificadas. En toda la fuente, «Envío Masivo» de cualquier tipo aparece en 9 cuentas de CLIENTE: los 11 CIDs de la v2.0 incluían a los internos 0 y 1, con un ticket cada uno, que `lib/tickets-norm.ts` cuenta aparte porque son tráfico interno y de pruebas.' },
      { patron: 'Falla Envíos Masivos (chat)',   veces: '3 · 10.0%', causa: 'Éstas SÍ son fallas, no asistencia. Son el núcleo de la alerta `sac_fallas_recurrentes`.' },
      { patron: 'Plantillas Verificadas (chat)', veces: '2 · 6.7%',  causa: 'El mismo trámite de WhatsApp que es la reincidencia crítica de FINSUS y pesa 29 tickets en Torres Corzo. Pero no es «media cartera»: son 15 CIDs de CLIENTE de los 1,647 con tickets, el 0.91% —16 de 1,649 si se cuenta el CID interno 1, que lleva cuatro de estos tickets y que `lib/tickets-norm.ts` deja fuera junto con el 0—. Y de esos 15, sólo OCHO tienen línea en el GRC: 8 de las 203 cuentas en cartera, el 3.9%. El «7.4% de las 217» que publicaba la v2.0 dividía un numerador del universo entero entre un denominador de cartera, y las 217 son FILAS del GRC, no cuentas.' },
    ],
    hallazgos: [
      'El canal que el tablero mide con detalle (voz) es el que funciona; el que apenas se mira (chat) es el que acumula 27 de los 30 tickets y las 5 fallas.',
      'Los 246 días del folio 385 son, SIN EXCEPCIÓN, el mayor tiempo de resolución de todas las auditorías escritas: le siguen el folio 104289 de FINSUS con 3,548.1 h (148 días) y el 104448 de Torres Corzo con 3,522.1 h (147), los dos CERRADOS en la fuente. La v2.0 publicaba 147 y 146 porque truncaba los días, mientras en este mismo expediente 2,709.1 h se redondean a 113: con una sola convención —redondeo— los dos crecen un día, y el 147 del 104448 es además el que publica Torres Corzo en su propio expediente. La v1.0 exceptuaba «el folio de Torres Corzo», y ese folio es MENOR —155 días fuera de SLA y 156 sin movimiento— además de ser otra medida: un folio escalado y abierto no se compara con el tiempo de resolución de un ticket ya cerrado. Y el de aquí ya está cerrado, así que lo que queda no es cerrarlo: es explicar por qué tardó.',
      'Veinte tickets sobre campañas en ocho meses es una señal de producto, no de soporte: el cliente necesita algo que la función no le da sola, y eso es exactamente lo que resolvería IA de Chat.',
    ],
  },
}
