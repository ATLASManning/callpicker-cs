/**
 * Corte vigente de Gross Revenue Churn.
 *
 * Separado de `page.tsx` para que Atlas (servidor) y el módulo Churn (cliente)
 * lean exactamente las mismas cifras. Al cargar un corte nuevo, este archivo se
 * reemplaza y el anterior se archiva dentro de `page.tsx` con
 * `scripts/archiva-corte-churn.py`.
 */
import type { ChurnReporte } from './tipos'

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 29 · SEGUIMIENTO CIERRE DE OCTUBRE
   Cuerpo fechado al 19 de noviembre de 2026. Remitente: Valeria Zepeda
   Hernández (equipo Data). Próxima revisión: miércoles 25 de noviembre.

   VUELVEN LAS CANCELACIONES, Y ES LA LECTURA MÁS COMPLETA DE OCTUBRE:

     TRAE ..... porcentajes (octubre 6.5% → 6.1%, acumulado 25.9% → 25.4%),
                cancelados de octubre (43 clientes, $76,762.84, con Top 10),
                CONTEO DE MOTIVOS —bloque nuevo, nunca había venido—,
                cancelados de noviembre (8 clientes, $7,818.00, los ocho con
                motivo) y el resumen de clientes con ≤3 meses de vida.
     NO TRAE .. cartera por cobrar, soft / hard suspend, top de clientes
                activos y downgrades cuantificados. Un bloque ausente NO es un
                cero: se publica «no reportado». [[feedback-cero-sin-medicion]]

   Y UNO DE ESOS AUSENTES LO ANUNCIA SU PROPIA ENTRADA. El correo dice traer
   «desglose de cancelados de octubre con conteo de motivos, cancelados de
   noviembre, CARTERA POR COBRAR y comentarios sobre downgrades», y el cuerpo no
   trae ninguna tabla de cartera. No se rellena con la de la semana 28
   ($208,994.05 en 172 clientes): se publica «no reportado» y se pregunta si se
   cayó del correo. Rellenarlo con una cifra vieja sería inventar una semana.

   MAPEO, el mismo que fijó la semana 24 — el rótulo manda:
     · «Cancelados de Octubre» ...................... cancelados + canceladoMotivos
     · «Cancelados de Noviembre» .................... dentro de notaEspecial (mes VIVO)
     · «Cartera por cobrar» ......................... NO VIENE → pendientes: []
     · «Downgrades» ................................. NO VIENE → downgrades: []
     · «Soft / Hard Suspend» ........................ NO VIENE → sin bloque
     · «Top de clientes activos» .................... NO VIENE

   CONCILIADO CON `scripts/concilia-churn-s29.py`. Cierra TODO lo interno:
     · el Top 10 suma $53,204.84 y el cubo de cierre cuadra: +33 clientes por
       $23,558.00 hasta los $76,762.84 declarados en 43 ✓
     · los nueve motivos suman $76,762.84 y 43 clientes — el MISMO total que
       los cancelados, así que las dos tablas hablan del mismo mes ✓
     · «17 de 43 con motivo» se reconstruye quitando «Sin motivo registrado» ✓
     · noviembre suma $7,818.00 en 8, los ocho con motivo ✓
     · los ≤3 meses suman $8,326.00 en 10, y sus tres nombres de noviembre
       casan al centavo con la tabla de noviembre ✓
     · sus siete nombres de octubre ($4,573.00) caben dentro del cubo ✓
     · el acumulado se reconstruye RESTANDO: 25.4 − 6.1 = 19.3 ✓

   LO QUE EL CONCILIADOR DESTAPÓ MIRANDO HACIA ATRÁS — y es la parte que no
   sale de cuadrar el correo consigo mismo:

     ① OCHO DE LOS DIEZ DEL TOP YA ESTABAN PUBLICADOS, AL CENTAVO. Jason de
       México, KOMBITEC y WhatsHome desde la semana 24; Grupo Turístico Rumbo y
       PSI desde la 25; UAXI y ZD · Grupo Gira desde la 26; SOBERANI desde la
       27. Sólo dos son nombres nuevos: Inversionistas LR ($3,119.00, 14 meses)
       y GRUPO 2711 BATERÍAS SENDERO ($2,732.34, 77 meses).

     ② TRES NOMBRES YA PUBLICADOS DESAPARECEN DEL TOP, Y NO DEBERÍAN. El top de
       este corte corta en $2,355.00, así que Biolaboratorio Sadat ($7,184.00,
       semana 26), enMazatlan ($3,480.00, semana 26) y ZD · The Palms
       ($2,454.00, semana 27) tendrían que estar dentro: los tres valen más que
       el piso. O salieron de la lectura de octubre, o el top no está ordenado
       por importe sobre los 43. Es PREGUNTA ABIERTA: no se borran ni se dan
       por buenos. Biolaboratorio Sadat son 56 meses y se iba «Sin Respuesta».

     ③ +23 CLIENTES POR SÓLO $1,467.34. La semana 27 declaraba 20 bajas por
       $75,295.50 y ésta declara 43 por $76,762.84: el dinero sube un 1.9% y el
       conteo se duplica, o sea $63.80 de media por cliente añadido. La semana
       27 ya medía el dinero del mes casi entero y le faltaban nombres chicos,
       no al revés. Por eso ésta es la lectura más completa, no una distinta.

   Y LO QUE HAY QUE MIRAR ANTES DE TOCAR NADA:

     ④ GRUPO 2711 BATERÍAS SENDERO NO ES UNA BAJA DE CUENTA. El cid 12283 lo
       comparten DOS filas del GRC: «GRUPO 2711 (BATERIAS SENDERO)» (banda A,
       77 meses, Desactivado) y «GRUPO 2711» (banda AAA, 99 meses, MRR estable,
       $10,048.00). La cuenta de cartera es C26, de Erick, y sigue facturando.
       Lo que se cancela es una línea AGRUPADA bajo el mismo CID. Pasarla a
       Dormidas apagaría una cuenta viva. [[polak-grupo-no-es-churn]]

     ⑤ EL MOTIVO ES LA MINORÍA. 26 de las 43 bajas de octubre (el 60%) no
       tienen motivo registrado, y son $27,672.34: el 36.0% del dinero perdido.
       El bloque nuevo es lo mejor que ha traído un corte en semanas, y aun así
       describe MENOS DE LA MITAD de los casos.

     ⑥ «CAMBIO DE PROVEEDOR» SON $25,764.00 EN 2 CLIENTES, que es EXACTAMENTE
       Jason de México ($17,225.00) + KOMBITEC ($8,539.00) al centavo. El correo
       no nombra a los clientes de cada motivo, así que es indicio fuerte y no
       prueba — pero las semanas 24 y 27 ya publicaban «MIGRACIÓN A OTRO
       PROVEEDOR» para esas dos. Si es eso, el 33.6% de la pérdida de octubre se
       fue CON LA COMPETENCIA, no por desuso ni por cierre.

     ⑦ CUATRO CLIENTES SE VAN CON CERO MESES ACTIVOS: SOLUCIONES QC, CRISTAL
       SERVICIOS, ferreclimas e Ingeniera Mantenimiento y Desarrollo Informático
       ($1,766.00). No es churn de relación: es una venta que nunca arrancó.

     ⑧ LA BASE DE MESES ANTERIORES SE MOVIÓ, 19.4% → 19.3%. Es exactamente el
       descuadre de 0.1 pp que levantó la observación ④ de la semana 28
       (septiembre bajó a 2.4% y el acumulado no lo propagaba). Ahora el
       acumulado sí incorpora la revisión. Se dice lo medido: la base cambió al
       valor que habíamos calculado; no se afirma la causa.

     ⑨ LOS DOWNGRADES SIGUEN SIENDO UN JUICIO SIN CIFRA: «no hay downgrades
       significativos». Es lo mismo que hizo la semana 26, y la 28 sí los
       cuantificó ($8,330.00 en 3 clientes). El corte además avisa de que «la
       siguiente semana se evaluarán», así que el bloque está PENDIENTE, no en
       cero. Su explicación —upsell antes del corte que aparece como downgrade
       hasta que pagan la recurrente— es la misma mecánica del mes vivo.
       [[regla-churn-mes-vencido]]

     ⑩ CUATRO DE ESTAS BAJAS ESTÁN EN LA CARTERA CS: Jason de México (cid
       135582), KOMBITEC (42184), SOBERANI (178523) y GRUPO 2711 BATERÍAS
       SENDERO (12283). Las tres primeras el GRC las trae Desactivado; la cuarta
       es el caso ④. Jason de México es cuenta TOP.

   OCTUBRE YA ES MES VENCIDO y este corte, al contrario que el de la semana 28,
   NO lo marca «mes corriendo». NOVIEMBRE SÍ ESTÁ VIVO: sus $7,818.00 no son
   «noviembre», son lo que va de noviembre. [[regla-churn-mes-vencido]]

   ESTO NO DA DE BAJA A NADIE. Es un reporte de Data: no mueve `cuentas`. Una
   baja se autoriza y se registra pasando la cuenta a Dormida, nunca borrando.
   [[feedback-conciliacion-churn]]
   ═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S29_OCT_2026: ChurnReporte = {
  id:      's29-octubre-2026',
  periodo: 'Semana 29 · Oct 2026',
  fecha:   '19/11/2026',
  notas:   'Gross Revenue Churn · Semana 29. Al 19 de noviembre del 2026. VUELVEN LAS '
         + 'CANCELACIONES y es la lectura más completa de octubre: 43 clientes por $76,762.84, '
         + 'con Top 10 ($53,204.84, el 69.3%) y un bloque NUEVO que nunca había venido, el '
         + 'conteo de motivos. Octubre BAJA de 6.5% a 6.1% —cuarta lectura a la baja— y el '
         + 'acumulado de 25.9% a 25.4%; esta vez la base de meses anteriores SÍ se mueve '
         + '(19.4% → 19.3%), que es el descuadre que levantó la semana 28. Noviembre, mes '
         + 'VIVO, lleva $7,818.00 en 8 clientes, los ocho con motivo. NO TRAE cartera por '
         + 'cobrar —aunque su propia entrada la anuncia—, ni suspendidos, ni top de activos, '
         + 'ni downgrades cuantificados. Próxima revisión: miércoles 25 de noviembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 25 de noviembre.',

  grc: {
    /* Agosto y septiembre NO vienen en este corte: se conservan de la serie,
       misma fuente y mismo remitente. Octubre sí es de aquí, y va con su
       `anterior` porque este corte lo reexpresa. */
    evolucion: [
      { mes: 'Agosto',     pct: 2.1 },
      { mes: 'Septiembre', pct: 2.4 },
      { mes: 'Octubre',    pct: 6.1, anterior: 6.5 },
    ],
    acumulado: 25.4,
    anterior:  25.9,
    acumuladoEtiqueta: 'Acumulado 2026 hasta Octubre',
    notaClave:
      'Octubre cierra en 6.1%, cuarta lectura consecutiva a la baja (12.4% → 7.4% → 6.5% → '
      + '6.1%), y el acumulado del año baja con él de 25.9% a 25.4%. Octubre ya es MES '
      + 'VENCIDO y este corte, al contrario que el de la semana 28, no lo marca «mes '
      + 'corriendo». El acumulado se reconstruye RESTANDO: 25.4 − 6.1 = 19.3% de base de '
      + 'meses anteriores, y esa base se MOVIÓ (antes 19.4%), así que esta vez sí incorpora '
      + 'la revisión de septiembre a 2.4%. No se puede verificar dividiendo: el correo no '
      + 'publica la base de MRR mensual.',
    notaEspecial:
      '📉 OCTUBRE 6.5% → 6.1% Y ACUMULADO 25.9% → 25.4%. Cuarta lectura a la baja del mismo '
      + 'mes. '
      + '✅ ① Y ESTA VEZ LA BASE SÍ SE MOVIÓ: 19.4% → 19.3%. La semana 28 bajó septiembre de '
      + '2.5% a 2.4% y dejó la base clavada, y aquí dijimos que el acumulado tendría que ser '
      + '25.8% y no 25.9%. Ahora la base está en el valor que habíamos calculado. Se dice lo '
      + 'medido: la base cambió a lo que salía de la cuenta; no se afirma la causa. '
      + '🆕 ② BLOQUE NUEVO — CONTEO DE MOTIVOS, la primera vez que un corte dice POR QUÉ se '
      + 'van. Cubre los 43 clientes y $76,762.84, el mismo total que la tabla de cancelados. '
      + '⚠️ ③ PERO EL MOTIVO ES LA MINORÍA: 26 de 43 (el 60%) van como «Sin motivo '
      + 'registrado», y son $27,672.34, el 36.0% del dinero perdido. El bloque es lo mejor '
      + 'que ha traído un corte en semanas y aun así describe MENOS DE LA MITAD de los casos. '
      + '🎯 ④ «CAMBIO DE PROVEEDOR» SON $25,764.00 EN 2 CLIENTES, que es EXACTAMENTE Jason de '
      + 'México ($17,225.00) + KOMBITEC ($8,539.00) al centavo. El correo no nombra a los '
      + 'clientes de cada motivo, así que es indicio fuerte y NO prueba — pero las semanas 24 '
      + 'y 27 ya publicaban «MIGRACIÓN A OTRO PROVEEDOR» para esas dos. Si es eso, el 33.6% '
      + 'de la pérdida de octubre se fue CON LA COMPETENCIA, no por desuso ni por cierre, y '
      + 'eso es una conversación de producto y precio, no de uso. '
      + '🔁 ⑤ OCHO DE LOS DIEZ DEL TOP YA ESTABAN PUBLICADOS, AL CENTAVO: Jason de México, '
      + 'KOMBITEC y WhatsHome desde la semana 24; Grupo Turístico Rumbo y PSI desde la 25; '
      + 'UAXI y ZD · Grupo Gira desde la 26; SOBERANI desde la 27. Sólo DOS son nombres '
      + 'nuevos: Inversionistas LR ($3,119.00, 14 meses) y GRUPO 2711 Baterías Sendero '
      + '($2,732.34, 77 meses). '
      + '❓ ⑥ Y TRES NOMBRES YA PUBLICADOS DESAPARECEN DEL TOP, AUNQUE VALEN MÁS QUE EL PISO. '
      + 'El top corta en $2,355.00 y faltan Biolaboratorio Sadat ($7,184.00, semana 26 — 56 '
      + 'meses, se iba «Sin Respuesta»), enMazatlan ($3,480.00, semana 26 — 73 meses) y ZD · '
      + 'The Palms ($2,454.00, semana 27). O salieron de la lectura de octubre, o el top no '
      + 'está ordenado por importe sobre los 43. PREGUNTA ABIERTA: no se borran ni se dan por '
      + 'buenos. '
      + '📊 ⑦ +23 CLIENTES POR SÓLO $1,467.34. La semana 27 declaraba 20 bajas por $75,295.50; '
      + 'ésta declara 43 por $76,762.84. El dinero sube 1.9% y el conteo se duplica: $63.80 '
      + 'de media por cliente añadido. La semana 27 ya medía el dinero del mes casi entero y '
      + 'le faltaban nombres chicos, no al revés. Ésta es la lectura más completa de octubre, '
      + 'no una distinta. '
      + '🚫 ⑧ GRUPO 2711 BATERÍAS SENDERO NO ES UNA BAJA DE CUENTA. El cid 12283 lo comparten '
      + 'DOS filas del GRC: «GRUPO 2711 (BATERIAS SENDERO)» (banda A, 77 meses, Desactivado) '
      + 'y «GRUPO 2711» (banda AAA, 99 meses, MRR estable, $10,048.00 de MRR). La cuenta de '
      + 'cartera es C26, de Erick, y sigue facturando. Lo que se cancela es una línea '
      + 'AGRUPADA bajo el mismo CID: pasarla a Dormidas apagaría una cuenta viva. '
      + '🗓️ ⑨ NOVIEMBRE, MES VIVO: $7,818.00 en 8 clientes, y los OCHO traen motivo — es el '
      + 'bloque mejor documentado del corte. Dos cierran la empresa (VERITest $1,596.00 y '
      + 'Rodcal Group $733.00), dos se van por ahorro (VRE México $979.00 tras 88 MESES '
      + '—«su servicio es excelente y nunca ha fallado, pero ya no lo requieren»— y '
      + 'Krezekapital $195.00), y la mayor es DESARROLLADORA ROAI, $3,349.00 al PRIMER MES: '
      + '«el volumen de llamadas que manejan no hace viable mantener la herramienta». Esos '
      + '$7,818.00 NO son «noviembre»: son lo que va de noviembre. '
      + '🆕 ⑩ CUATRO CLIENTES SE VAN CON CERO MESES ACTIVOS —SOLUCIONES QC, CRISTAL SERVICIOS, '
      + 'ferreclimas e Ingeniera Mantenimiento y Desarrollo Informático, $1,766.00—. No es '
      + 'churn de relación: es una venta que nunca arrancó, y eso se arregla antes de la '
      + 'firma, no después. En total 10 clientes de ≤3 meses por $8,326.00. '
      + '🏢 ⑪ CUATRO DE ESTAS BAJAS ESTÁN EN LA CARTERA CS: Jason de México (cid 135582, '
      + 'cuenta TOP), KOMBITEC (42184), SOBERANI (178523) y GRUPO 2711 Baterías Sendero '
      + '(12283, que es el caso ⑧). Las tres primeras el GRC las trae Desactivado. Ninguna se '
      + 'mueve sin autorización, y una baja es pasar a Dormida, nunca borrar. '
      + '🚨 ⑫ EL CORREO ANUNCIA UN BLOQUE QUE NO TRAE: su entrada dice traer «cartera por '
      + 'cobrar» y el cuerpo no tiene ninguna tabla de cartera. La última lectura es la de la '
      + 'semana 28 —$208,994.05 en 172 clientes, con el 94.3% parado a un tramo de la '
      + 'suspensión— y NO se rellena con ella: se publica «no reportado». Rellenar una semana '
      + 'con la cifra de la anterior es inventarla. '
      + '⏸️ ⑬ TAMPOCO VIENEN suspendidos, top de clientes activos ni downgrades cuantificados. '
      + 'De los downgrades el corte dice «no hay downgrades significativos» —un juicio sin '
      + 'cifra, igual que la semana 26— y avisa de que «la siguiente semana se evaluarán», así '
      + 'que están PENDIENTES, no en cero. Su explicación es la mecánica del mes vivo: clientes '
      + 'que hicieron upsell antes de su corte aparecen como downgrade hasta que pagan la '
      + 'recurrente. '
      + '📋 CONCILIADO con scripts/concilia-churn-s29.py: el Top 10 suma $53,204.84 y el cubo '
      + 'de cierre cuadra (+33 clientes, $23,558.00) hasta los $76,762.84 en 43; los nueve '
      + 'motivos suman ese MISMO total y esos MISMOS 43; «17 de 43 con motivo» se reconstruye '
      + 'quitando «Sin motivo registrado»; noviembre suma $7,818.00 en 8; los ≤3 meses suman '
      + '$8,326.00 en 10, sus tres nombres de noviembre casan al centavo con la tabla de '
      + 'noviembre y sus siete de octubre ($4,573.00) caben dentro del cubo; y el acumulado se '
      + 'reconstruye restando. '
      + 'ESTO NO DA DE BAJA A NADIE: es un reporte de Data y no mueve `cuentas`.',
  },

  /* ── CARTERA POR COBRAR: NO VIENE EN ESTE CORTE ─────────────────────────
     Y su propia entrada la anuncia, que es lo que hay que preguntar. No se
     rellena con la lectura de la semana 28 ($208,994.05 en 172 clientes):
     una semana rellenada con la cifra de la anterior es una semana inventada.
     [[feedback-cero-sin-medicion]] */
  pendientes: [],
  pendientesEtiqueta: 'Cartera por Cobrar — NO REPORTADA en este corte (su propia entrada la anuncia)',

  /* ── CANCELADOS DE OCTUBRE ──────────────────────────────────────────────
     El corte declara 43 clientes y $76,762.84 y desglosa el Top 10
     ($53,204.84, el 69.3%). La última fila es el CUBO DE CIERRE: sin ella la
     tarjeta publicaría el top como si fuera el mes.
     `acumulado: 0` es «no publicado por el corte», no cero facturado. */
  canceladosCasosReal: 43,
  cancelados: [
    { cliente: '🔴 Jason de México — CUENTA TOP y la mayor baja del mes por cuarta semana consecutiva: el 22.4% de todo lo cancelado en octubre, con 43 meses de relación. Ya la publicaban las semanas 24 y 27 al MISMO importe. El motivo lo publicó la semana 24: MIGRACIÓN A OTRO PROVEEDOR, y el conteo de motivos de este corte es coherente con eso. Está en la cartera CS, cid 135582, y el GRC la trae Desactivado. No se apagó por poco uso: se la llevó alguien más.', mrr: 17225.00, mesesActivo: 43, acumulado: 0 },
    { cliente: 'KOMBITEC — 73 meses, más de seis años. Ya estaba en las semanas 24 y 27 al mismo importe. Motivo publicado por la semana 24: MIGRACIÓN A OTRO PROVEEDOR. Con Jason de México son el 33.6% de lo cancelado del mes, y juntas valen exactamente los $25,764.00 que el conteo de motivos pone en «Cambio de proveedor». Está en cartera CS, cid 42184, Desactivado en el GRC.', mrr: 8539.00, mesesActivo: 73, acumulado: 0 },
    { cliente: 'SOBERANI — 8 meses. La semana 27 la publicaba ya, al mismo importe, y el corte sigue sin dar motivo. Está en la cartera CS, cid 178523, y el GRC la trae Desactivado: es baja con nombre y cuenta nuestra, sin razón conocida a los ocho meses.', mrr: 5235.00, mesesActivo: 8, acumulado: 0 },
    { cliente: 'Grupo Turístico Rumbo S de RL de CV — 6 meses. Cuarta aparición: la semana 25 la reportaba, la 26 la perdió de vista, la 27 la recuperó y aquí sigue, siempre al mismo importe. El corte no publica el motivo.', mrr: 4349.00, mesesActivo: 6, acumulado: 0 },
    { cliente: 'UAXI Tecnología — 8 meses. La semana 26 publicaba el motivo: «Limitaciones del servicio», y este corte lo mantiene como el ÚNICO motivo de PRODUCTO del mes ($4,041.00, 1 cliente). Es el que hay que llevar a Producto con nombre y apellido.', mrr: 4041.00, mesesActivo: 8, acumulado: 0 },
    { cliente: 'WhatsHome — 71 meses, casi seis años. Ya estaba en las semanas 24 y 27. Motivo publicado por la semana 24: Restructuración. Segunda cuenta de más de cinco años que sale en el mes junto con KOMBITEC.', mrr: 3250.00, mesesActivo: 71, acumulado: 0 },
    { cliente: 'Inversionistas LR — 14 meses. NOMBRE NUEVO: ninguno de los cuatro cortes anteriores de octubre la traía, y entra directamente en el séptimo lugar del mes. El corte no publica el motivo.', mrr: 3119.00, mesesActivo: 14, acumulado: 0 },
    { cliente: '⚠️ GRUPO 2711 (BATERÍAS SENDERO) — 77 meses, pero NO ES UNA BAJA DE CUENTA. NOMBRE NUEVO en la serie de octubre. El cid 12283 lo comparten DOS filas del GRC: ésta (banda A, 77 meses, Desactivado) y «GRUPO 2711» (banda AAA, 99 meses, MRR estable, $10,048.00). La cuenta de cartera es C26, de Erick, y sigue facturando. Lo que muere es una línea AGRUPADA bajo el mismo CID: pasar la cuenta a Dormidas apagaría una cuenta viva.', mrr: 2732.34, mesesActivo: 77, acumulado: 0 },
    { cliente: 'PSI División Latinoamérica — 21 meses. Tercera aparición, siempre al mismo importe: semanas 25 y 27, y aquí. El corte no publica el motivo.', mrr: 2359.50, mesesActivo: 21, acumulado: 0 },
    { cliente: 'ZD · Grupo Gira — 5 meses. La semana 26 publicaba el motivo: «Finalización de contrato con el cliente» — el contrato tenía fin, no es un fallo de servicio. Es el piso del top de este corte, $2,355.00, y por eso importa quién NO está por encima de él.', mrr: 2355.00, mesesActivo: 5, acumulado: 0 },
    { cliente: '+ Resto de cancelaciones del mes — 33 clientes que el corte NO desglosa. Esta fila existe para que la tabla cuadre con los $76,762.84 declarados en 43 clientes: el top detalla $53,204.84, el 69.3%. De este cubo sí conocemos SIETE nombres por la tabla de ≤3 meses de vida (KARTODROMO OSCAR CASILLAS $1,029.00, Recarga Y Gana $979.00, FOBE $519.00, SOLUCIONES QC $519.00, CRISTAL SERVICIOS $519.00, ferreclimas $519.00 y Grupo NIID AIR $489.00: $4,573.00 en total). Y PREGUNTA ABIERTA: tres nombres ya publicados valen más que el piso del top y no aparecen —Biolaboratorio Sadat $7,184.00, enMazatlan $3,480.00 y ZD · The Palms $2,454.00—, así que o están aquí dentro o salieron de la lectura del mes.', mrr: 23558.00, mesesActivo: 0, acumulado: 0 },
  ],

  /* ── CONTEO DE MOTIVOS · BLOQUE NUEVO ───────────────────────────────────
     Primera vez que un corte dice POR QUÉ se van. Cubre los 43 clientes y el
     total del mes, así que CIERRA contra la tabla de cancelados.
     «Sin motivo registrado» va como una fila más y es la mayoritaria: sacarla
     descuadraría la tabla y haría leer el bloque como si cubriera el mes
     entero. [[feedback-cero-sin-medicion]] */
  canceladoMotivos: [
    { motivo: 'Sin motivo registrado',                  clientes: 26, importe: 27672.34 },
    { motivo: 'Cambio de proveedor',                    clientes:  2, importe: 25764.00 },
    { motivo: 'Reestructuración / cierre de proyecto',  clientes:  3, importe:  7964.50 },
    { motivo: 'No lo usa / no lo necesita',             clientes:  4, importe:  7597.00 },
    { motivo: 'Limitaciones del servicio',              clientes:  1, importe:  4041.00 },
    { motivo: 'Servicio contratado para un tercero',    clientes:  2, importe:  1599.00 },
    { motivo: 'Cierre de operaciones / empresa',        clientes:  3, importe:  1147.00 },
    { motivo: 'Cambio a otra herramienta (CRM)',        clientes:  1, importe:   489.00 },
    { motivo: 'Situación económica',                    clientes:  1, importe:   489.00 },
  ],

  /* ── DOWNGRADES: NO VIENEN EN ESTE CORTE ────────────────────────────────
     «No hay downgrades significativos» es un JUICIO SIN CIFRA, igual que en la
     semana 26. Y el propio corte avisa de que «la siguiente semana se
     evaluarán», así que están PENDIENTES, no en cero: `downgradeTotalReal` se
     queda SIN DEFINIR a propósito. [[feedback-cero-sin-medicion]] */
  downgrades: [],
}
