import type { ChurnReporte } from './tipos'

/* ══════════════════════════════════════════════════════════════════════════
   CORTE VIGENTE · SEMANA 30 DE ANÁLISIS DATA · al 24 de noviembre de 2026
   ══════════════════════════════════════════════════════════════════════════

   LO QUE TRAE, Y DÓNDE CAE CADA BLOQUE. El rótulo del correo manda, no la
   costumbre: cada tabla va al slot que dice su propio encabezado.
   [[churn-analisis-data]]

     · Vista general (3 %)              → `grc.evolucion` + acumulado
     · Top 5 · Clientes ACTIVOS         → NINGÚN SLOT. Va en la nota.
     · Cancelados de noviembre (20)     → `cancelados` + `canceladosCasosReal`
     · Soft / Hard Suspend (62)         → `suspendidos` + sus totales reales
     · Cartera Vencida por Días (474)   → `pendientes` + `antiguedadSaldos`
     · Downgrades (8) + productos (9)   → `downgrades` + `downgradeArticulos`

   EL TOP DE ACTIVOS NO ENTRA EN `pendientes`, y es la trampa de este corte:
   ese slot es CARTERA POR COBRAR. Meter ahí $101,768.41 de cartera SANA la
   publicaría como «MRR en riesgo» en la tarjeta y en el contexto de Atlas.
   Va en `notaEspecial`, que es lo que Atlas lee de verdad.

   NOVIEMBRE ES EL MES VIVO. Sus $27,104.00 no son «noviembre»: son lo que va
   de noviembre, y el 15.5% del encabezado NO es churn consumado — se midió
   contra nuestro GRC y es la canasta «Churn confirmado» del mes vivo, o sea
   cartera por cobrar. Por eso noviembre NO entra en `grc.evolucion`: esa serie
   es de meses CERRADOS. [[regla-churn-mes-vencido]]

   CONCILIADO con `scripts/concilia-churn-s30.py`: 23 comprobaciones de cierre,
   15 avisos y 6 cosas que este corte no permite decidir, todas dentro de las
   notas. Un aviso que se queda en la consola es un aviso que nadie leyó.
   ══════════════════════════════════════════════════════════════════════════ */

export const REPORTE_S30_NOV_2026: ChurnReporte = {
  id: 's30-noviembre-2026',
  periodo: 'Semana 30 · Nov 2026',
  fecha: '24/11/2026',
  notas: 'Seguimiento de noviembre: top de clientes activos, cancelados con su '
    + 'motivo, resumen de soft y hard suspend, cartera vencida y downgrades. '
    + 'Noviembre es el MES VIVO: lo que mide es retraso de cobranza, no bajas '
    + 'consumadas.',
  notaRemitente: 'Valeria Zepeda Hernández (equipo Data) · correo semanal de '
    + 'seguimiento, miércoles. Siguiente revisión: miércoles 2 de diciembre. '
    + 'Tablero: marketingplus.zoho.com/reports/open-view/245443000007094051',

  grc: {
    /* Agosto y septiembre NO vienen en este corte: se conservan de la serie,
       misma fuente y mismo remitente. Octubre sí es de aquí y va con su
       `anterior` porque este corte lo reexpresa a la baja (6.1% → 5.5%).

       NOVIEMBRE NO ESTÁ EN LA SERIE A PROPÓSITO. El corte publica 15.5% y lo
       rotula «MES CORRIENDO · NO DEFINITIVO». Un punto en la gráfica no puede
       llevar ese pie: dibujado al lado del 5.5% de octubre se leería como que
       el churn se triplicó. La serie es de meses cerrados; el 15.5% va
       explicado en las notas. [[regla-churn-mes-vencido]] */
    evolucion: [
      { mes: 'Agosto',     pct: 2.1 },
      { mes: 'Septiembre', pct: 2.4 },
      { mes: 'Octubre',    pct: 5.5, anterior: 6.1 },
    ],
    acumulado: 24.7,
    anterior:  25.4,
    acumuladoEtiqueta: 'Acumulado 2026 hasta Octubre',

    notaClave:
      '📅 CORTE AL 24 DE NOVIEMBRE · SEMANA 30. Noviembre es el MES VIVO: todo '
      + 'lo que dice de noviembre es parcial por definición. '
      + '✅ ① LA SEMANA 29 PROMETIÓ DOS BLOQUES Y ÉSTE LOS PAGA. La 29 anunciaba '
      + '«cartera por cobrar» en su entrada y no traía ninguna tabla, y de los '
      + 'downgrades decía que «se evaluarán la siguiente semana». Aquí vienen los '
      + 'dos: cartera $709,965.95 en 474 clientes y downgrades $39,814.00 en 8. '
      + 'Las dos preguntas abiertas de la 29 quedan contestadas. '
      + '🚨 ② EL HALLAZGO DEL CORTE: LAS DOS BAJAS MAYORES DE NOVIEMBRE SON CUENTAS '
      + 'NUESTRAS QUE NUESTRA PROPIA BASE DA POR VIVAS. Grupo DC Mexico ($8,390.00, '
      + 'F67, Erick, en_riesgo) y CH Desarrollos ($6,342.00, C34, Erick, activo) '
      + 'suman $14,732.00 —el 54.4% de todo lo cancelado del mes— y las DOS van SIN '
      + 'MOTIVO en el correo. El correo las cancela, `cuentas` las tiene activas y '
      + 'nadie ha ejecutado nada. '
      + '🔁 ③ Y HAY QUE DECIR DE QUÉ VALE ESE «SIGUE VIVA»: viene de '
      + '`verificadoPor = cartera`, o sea de `cuentas.estado`, que está activo '
      + 'PORQUE NADIE LAS HA PASADO A DORMIDAS —que es justo la acción que este '
      + 'corte dispara—. Es circular y no es prueba de vida: sólo '
      + '`verificadoPor = facturacion` lo sería, y ninguna de las dos lo tiene. Van '
      + 'al corte TOP de churn confirmado como CANDIDATAS. Ninguna se mueve sin '
      + 'autorización de dirección, y una baja es pasar a Dormida, nunca borrar. '
      + '📉 ④ EL 15.5% DE NOVIEMBRE ES CARTERA POR COBRAR, Y ESTÁ MEDIDO. El correo '
      + 'no publica denominador, así que se reconstruyó contra nuestro GRC: la '
      + 'canasta «Churn confirmado» del mes vivo vale $759,330.43 sobre una base de '
      + '$4,743,246.91, o sea 16.01% — medio punto del 15.5% declarado, la misma '
      + 'magnitud en otro día de corte. En Zoho «churn confirmado» marca TODO '
      + 'contrato que aún no factura. El churn de verdad es el del mes VENCIDO: '
      + 'octubre, 5.5%. '
      + '🔢 ⑤ EL «474» DEL CORREO Y EL «474» DEL GRC SON, CASI SEGURO, LA MISMA '
      + 'POBLACIÓN. El correo cuenta 474 clientes de cartera vencida ($709,965.95); '
      + 'el GRC trae 474 filas de churn confirmado SIN VERIFICAR ($480,485.47 de '
      + 'MRR). El conteo casa exacto y la razón de dinero (1.48) cuadra con los 1.55 '
      + 'meses de saldo que implica el reparto por antigüedad. NO está probado por '
      + 'nombre —el correo no publica los 474—, pero si lo son, la cartera vencida y '
      + 'el churn de noviembre son EL MISMO HECHO contado dos veces. '
      + '⚠️ ⑥ EL AVISO DE LA SEMANA 28 SE CUMPLIÓ Y SE QUEDÓ CORTO. Decía que si la '
      + 'ola de 16–30 días envejecía sin cobrarse «se multiplica por veinte». El '
      + 'tramo de +30 días pasa de $10,770.00 en 16 clientes a $393,029.87 en 259: '
      + 'por 36.5. Y 16–30 NO se vació ($270,504.47 en 190), así que los DOS tramos '
      + 'están cargados a la vez: envejeció una ola y entró otra detrás. El 93.5% de '
      + 'la cartera lleva 16 días o más. '
      + '📝 ⑦ LA DOCUMENTACIÓN DE MOTIVOS RETROCEDE. La semana 29 publicaba sus 8 '
      + 'bajas de noviembre CON motivo —el 100%, y lo decía como mérito—; ésta trae '
      + '11 de 20 (55%), y lo que queda sin motivo es el 64.9% del dinero. No es un '
      + 'hueco cualquiera: son los dos clientes mayores. '
      + '🔝 ⑧ LOS CINCO «CLIENTES ACTIVOS» DEL TOP SALEN EN EL GRC COMO «CHURN '
      + 'CONFIRMADO» CON MRR EN CERO, AL MISMO PESO ($101,768.41). No es una '
      + 'contradicción: nuestra escalera de verificación ya los marca `sigue_viva` y '
      + 'el correo no los cancela. Es la regla del mes vencido vista de frente. '
      + 'Quien leyera el GRC de noviembre a la letra pasaría a Dormidas a las cinco '
      + 'cuentas mayores del mes, Hospital Santa Rosa (61 meses) entre ellas. '
      + '🟠 ⑨ Y DOS DE ESAS CINCO YA ESTÁN «en_riesgo» EN NUESTRA BASE: Azyco '
      + 'Guadalajara ($22,984.00, F6, Fátima) y Gas Economico Metropolitano '
      + '($18,659.00, C3, Erick). El correo las publica como el techo de la cartera '
      + 'activa y no lo sabe; nosotros sí. '
      + '🔂 ⑩ DOS DE LOS OCHO DOWNGRADES REPITEN LA SEMANA 28 AL CENTAVO Y AL PUNTO '
      + 'PORCENTUAL, bajo rótulo «Noviembre»: Grupo Guía ($2,400.00, 30%) y Grupo '
      + 'SPH ($2,392.00, 71%). Son $4,792.00, el 12.0% del bloque. Hay DOS lecturas '
      + 'y el correo no distingue: o es un registro que corre arrastrando casos '
      + 'vivos, o es octubre reetiquetado. NO se decide contando: se publica el total '
      + 'como viene DICIENDO que $4,792.00 de él ya estaba publicado en octubre. '
      + '📊 ⑪ LA TABLA DE PRODUCTOS ES BRUTA, y el propio corte lo declara: «no '
      + 'incluye productos que aumentaron». Los $39,814.00 NO están neteados de '
      + 'upsell. La semana 27 publicaba bruto y neto distintos ($38,225.97 contra '
      + '$31,187.97) y ahí la diferencia importaba. '
      + '🕳️ ⑫ EL MISMO HUECO DE REGISTRO APARECE DOS VECES. En suspend, el promedio '
      + 'de días sólo mide a 52 de 62 clientes (Soft 34/41, Hard 18/21): a 10 no se '
      + 'les ha registrado fecha de corte. Y en cartera, «Por vencer» ($46,431.61 en '
      + '25) es exactamente eso mismo —el corte aclara que agrupa a los clientes sin '
      + 'fecha de corte registrada—, así que NO es deuda joven. Son 35 registros '
      + 'incompletos, no una lectura. '
      + '🆕 ⑬ LOS 8 DE LA SEMANA 29 SIGUEN AQUÍ, TODOS, AL MISMO IMPORTE, y entran 12 '
      + 'nombres nuevos por $19,286.00. La lista de noviembre pasó de $7,818.00 a '
      + '$27,104.00 en cinco días. Cinco de los 20 llevan 3 meses o menos de vida '
      + '($4,991.00), y uno CERO meses: Ingeniera Mantenimiento, una venta que nunca '
      + 'arrancó —eso se arregla antes de la firma, no después—. '
      + '❓ ⑭ UNA FILA CAMBIA DE MESES ACTIVO ENTRE DOS CORTES DE CINCO DÍAS: GANA '
      + 'A.C. pasa de 31 a 34 meses. Los otros siete repiten mes por mes, así que no '
      + 'es un redatado global: es una fila. PREGUNTA ABIERTA, no se corrige a ojo. '
      + '❓ ⑮ SIGUE ABIERTA LA PREGUNTA DE LA SEMANA 29 y este corte no la responde '
      + 'porque es de otro mes: Biolaboratorio Sadat ($7,184.00), enMazatlan '
      + '($3,480.00) y ZD · The Palms ($2,454.00) valían más que el piso del top de '
      + 'octubre y no aparecían en él. '
      + '🔁 ⑯ Y UNA DE LAS VEINTE YA SE HABÍA PUBLICADO COMO CANCELADA HACE DOS '
      + 'MESES: Espacio Mexico, $169.00, que la semana 21 de septiembre ya daba de '
      + 'baja («motivo desconocido, sin respuesta del cliente»). Mismo importe al '
      + 'centavo, y la antigüedad no casa: la semana 21 decía 0 meses y aquí dice 51 '
      + '—el GRC también dice 51, así que el 0 de septiembre estaba mal—. Así que '
      + 'esta lista no es sólo noviembre: igual que en los downgrades, el total del '
      + 'mes arrastra algo viejo. '
      + '🔧 ⑰ PUBLICAR ESTE CORTE DESTAPÓ QUE LA PUERTA DE ANÁLISIS DATA DEL CIRCUITO '
      + 'DE DORMIDAS ESTABA MEDIO CIEGA. `lib/churn-cancelados-data.ts` se genera '
      + 'extrayendo el campo `cliente` de los cortes, y desde que los cortes escriben '
      + 'el análisis DENTRO de ese campo se llevaba la prosa entera: 86 de 172 '
      + 'nombres eran párrafos de 400 caracteres que no empatan con `cuentas.empresa` '
      + 'NUNCA. Nada fallaba. Arreglado el extractor, cuatro cuentas TOP que ya '
      + 'estaban apagadas pasan de puerta «GRC+DIRECCIÓN» a «GRC+DATA+DIRECCIÓN» '
      + '(Jason de México, KOMBITEC, Biolaboratorio Sadat y SOBERANI) y aparece '
      + 'CH Desarrollos como candidata. De paso entraron tres cubos «+ Resto de…» a '
      + 'la lista de bajas como si fueran clientes: el filtro exigía un dígito tras '
      + 'el «+». '
      + '📌 ⑱ EL CORTE TOP DE CHURN CONFIRMADO, YA CORRIDO '
      + '(data/cortes-top-churn/top-churn-Noviembre.json): CH Desarrollos (C34, '
      + 'Erick) entra en «SÓLO Análisis DATA» como ÚNICA candidata nueva. Grupo DC '
      + 'Mexico NO entra, y no por estar sana: es F67 y el filtro TOP llega a F46, '
      + 'así que la mayor baja de noviembre en cartera queda FUERA del alcance de ese '
      + 'corte. Y ojo con su importe: el corte TOP le calcula $2,057 de MRR a CH '
      + 'Desarrollos contra los $6,342 del correo y del GRC, porque sale del mapa de '
      + 'facturación y no del GRC. Ninguna se mueve: son candidatas. '
      + '📋 CONCILIADO con scripts/concilia-churn-s30.py: las 20 cancelaciones suman '
      + 'los $27,104.00 declarados en 20 clientes; suspend suma $62,590.00 en 62; '
      + 'cartera suma $709,965.95 en 474; downgrades suman $39,814.00 y sus nueve '
      + 'filas de producto cierran una por una (8 reducciones + 3 cancelaciones = 11 '
      + 'pares cliente-producto sobre 8 clientes); la base ene–sep no se mueve al '
      + 'reexpresar octubre (19.2% contra 19.3%, dentro del redondeo a un decimal); y '
      + 'el 15.5% se reconstruye contra el GRC. '
      + 'ESTO NO DA DE BAJA A NADIE: es un reporte de Data y no mueve `cuentas`.',

    /* LO QUE ATLAS LEE DE VERDAD. `notaClave` la ve la pantalla; el contexto de
       Atlas sólo arrastra `notaEspecial` (lib/atlas-context.ts), así que un
       hallazgo que viva únicamente arriba no existe para el modelo. Aquí va
       comprimido lo que no puede faltarle, y el top de activos —que no tiene
       slot— va aquí porque es su único sitio.
       [[feedback-contexto-ia-sin-huecos]] */
    notaEspecial:
      'TOP 5 DE CLIENTES ACTIVOS de noviembre (cartera SANA, NO es churn y NO '
      + 'está en ningún otro bloque de este corte; el correo no declara total, los '
      + '$101,768.41 son nuestra suma): Alianza Multimarca $26,594.00 (35 meses, D4, '
      + 'Dan) · Azyco Guadalajara $22,984.00 (26 meses, F6, Fátima, EN RIESGO en '
      + 'nuestra base) · Gas Economico Metropolitano $18,659.00 (44 meses, C3, '
      + 'Erick, EN RIESGO en nuestra base) · Hospital Santa Rosa $18,345.00 (61 '
      + 'meses, C4, Erick) · FabricAir Latin America $15,186.41 (69 meses, D9, Dan). '
      + 'LAS CINCO salen en el GRC como «Churn confirmado» con MRR en cero y al '
      + 'mismo peso, y nuestra verificación las marca `sigue_viva`: es el mes vivo '
      + 'marcando como perdido lo que todavía no factura. NO están de baja y no se '
      + 'mueve ninguna. '
      + 'EL 15.5% DE NOVIEMBRE NO ES CHURN CONSUMADO: es cartera por cobrar, medido '
      + 'contra nuestro GRC en 16.01% ($759,330.43 de «Churn confirmado» sobre '
      + '$4,743,246.91 de base, mes vivo noviembre). Si te preguntan el churn del '
      + 'mes, el bueno es el del mes VENCIDO: octubre, 5.5%. '
      + 'DOS CANCELACIONES DE ESTE CORTE SON CUENTAS NUESTRAS QUE `cuentas` DA POR '
      + 'ACTIVAS: Grupo DC Mexico ($8,390.00, F67, Erick) y CH Desarrollos '
      + '($6,342.00, C34, Erick), $14,732.00 y el 54.4% de lo cancelado del mes, las '
      + 'dos SIN MOTIVO publicado. Son CANDIDATAS a Dormidas, no bajas: nada se '
      + 'mueve sin autorización de dirección. '
      + 'DOS DE LOS OCHO DOWNGRADES ($4,792.00: Grupo Guía y Grupo SPH) repiten la '
      + 'semana 28 al centavo bajo rótulo «Noviembre»: no afirmes que son pérdida '
      + 'nueva del mes. Y la tabla de productos es BRUTA —el corte dice que no '
      + 'incluye los que aumentaron—, así que los $39,814.00 no están neteados de '
      + 'upsell. '
      + 'UNA DE LAS 20 YA SE HABÍA PUBLICADO COMO CANCELADA: Espacio Mexico ($169.00) '
      + 'ya salía de baja en la semana 21 de septiembre, al mismo importe. Esta lista '
      + 'no es sólo noviembre. '
      + 'EL CORTE TOP DE CHURN CONFIRMADO YA ESTÁ CORRIDO: CH Desarrollos (C34, '
      + 'Erick) es la única candidata nueva y está en «sólo Análisis DATA». Grupo DC '
      + 'Mexico queda fuera de ese corte por ser F67 (el filtro TOP llega a F46), no '
      + 'por estar sana. Son CANDIDATAS: ninguna se mueve sin autorización. '
      + 'LOS 474 CLIENTES DE CARTERA VENCIDA NO TIENEN NOMBRE EN ESTE CORTE: sólo se '
      + 'publican los cinco tramos de antigüedad. No los nombres, no los estimes y '
      + 'no los repartas entre asesores.',
  },

  /* ── CARTERA VENCIDA POR DÍAS ────────────────────────────────────────────
     474 clientes y $709,965.95. Es SALDO VENCIDO, no cartera activa, y el
     corte no publica NINGÚN nombre: sólo los cinco tramos. Las filas de abajo
     describen tramos, no clientes, igual que en la semana 28.

     Y es la lectura más alta de la serie: S24 $51,042.30 · S25 $272,319.60 ·
     S26 $497,941.00 · S27 $268,705.50 · S28 $208,994.05 · S29 no reportada ·
     ÉSTA $709,965.95. Máximo en dinero y máximo en clientes (474 contra 363).
     [[feedback-fuentes-semanales-snapshot]] */
  pendientesTotalReal:   709965.95,
  pendientesCuentasReal: 474,
  pendientesEtiqueta: 'Cartera POR COBRAR (saldo vencido) — MÁXIMO de la serie: '
    + '$709,965.95 en 474 clientes, contra $208,994.05 en 172 de la semana 28. El '
    + 'corte NO publica ningún nombre, sólo los cinco tramos',
  pendientes: [
    { cliente: 'Por vencer — 25 clientes. NO ES DEUDA JOVEN: el propio corte aclara que agrupa a los clientes «sin fecha de corte registrada aún». Es un HUECO DE REGISTRO, y es el MISMO que deja al promedio de días de suspend midiendo sólo 52 de 62. Sube desde $519.00 en 1 cliente en la semana 28, así que el registro no se está limpiando: se está ensuciando. Estas 25 cuentas necesitan fecha de corte en el sistema.', monto: 46431.61, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '1 a 7 días vencido — 0 clientes. ESTE SÍ ES UN CERO MEDIDO: hay tramo, importe y conteo. Y tiene explicación estructural, no es un hueco: con corte mensual y el reporte al día 24, lo facturado el día 1 ya cayó en 16–30 días y entre el 9 y el 23 no se emitió nada.', monto: 0.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '8 a 15 días vencido — 0 clientes. SEGUNDO CERO MEDIDO SEGUIDO, misma explicación. En la semana 28 este tramo valía $714.00 en 2 cuentas; se vació hacia adelante, no se cobró.', monto: 0.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '⚠️ 16 a 30 días vencido — 190 clientes, el 38.1% de la cartera. NO SE VACIÓ al envejecer la ola de la semana 28 ($196,991.05 en 153): subió. Eso significa que entró una ola NUEVA detrás de la que envejeció, y que los dos tramos viejos están cargados al mismo tiempo. Está a UN SOLO TRAMO del que antecede a la suspensión.', monto: 270504.47, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '🔴 Más de 30 días — 259 clientes, el 55.4% de la cartera y el tramo mayor. LA SEMANA 28 LO AVISÓ Y SE QUEDÓ CORTA: decía que si la ola de 16–30 días envejecía sin cobrarse «se multiplica por veinte». Pasó de $10,770.00 en 16 clientes a $393,029.87 en 259: POR 36.5 en dinero y por 16.2 en clientes. Es el tramo que antecede a la suspensión y ya es más de la mitad de la cartera.', monto: 393029.87, mesesActivo: 0, ultimaFactura: '—' },
  ],

  antiguedadSaldos: [
    { rango: 'Por vencer (sin fecha de corte)', monto:  46431.61 },
    { rango: '1 – 7 días vencido',              monto:      0.00 },
    { rango: '8 – 15 días vencido',             monto:      0.00 },
    { rango: '16 – 30 días vencido',            monto: 270504.47 },
    { rango: 'Más de 30 días',                  monto: 393029.87 },
  ],

  /* ── CANCELADOS DE NOVIEMBRE · MES VIVO ──────────────────────────────────
     LA LISTA VIENE COMPLETA, y es la primera vez en la serie: 20 clientes y
     $27,104.00, y las 20 filas suman exactamente ese total. NO HAY CUBO DE
     CIERRE porque no falta nadie — un cubo aquí inventaría una fila.

     `acumulado: 0` es «no publicado por el corte», no cero facturado.
     [[feedback-cero-sin-medicion]] */
  canceladosCasosReal: 20,
  cancelados: [
    { cliente: '🔴 Grupo DC Mexico — LA MAYOR BAJA DEL MES Y SIN MOTIVO. Está en la cartera CS: cid 180111, cuenta F67, de Erick, y nuestra base la tiene «en_riesgo», o sea ACTIVA. El GRC la trae «Churn confirmado» con MRR $8,390.00 → $0.00 y nuestra verificación la marca `sigue_viva` por cartera. Siete meses de relación. ES CANDIDATA A DORMIDAS, no una baja ejecutada: el correo la cancela, nosotros la tenemos viva y nadie ha movido nada. No se toca sin autorización de dirección.', mrr: 8390.00, mesesActivo: 7, acumulado: 0 },
    { cliente: '🔴 CH Desarrollos — SEGUNDA MAYOR Y TAMBIÉN SIN MOTIVO, con 73 MESES de relación: más de seis años. Está en la cartera CS: cid 52196, cuenta C34, de Erick, y nuestra base la tiene «activo». El GRC la trae «Churn confirmado» con MRR $6,342.00 → $0.00 y la verificación la marca `sigue_viva` por cartera. Con Grupo DC Mexico son $14,732.00, el 54.4% de todo lo cancelado del mes, y de ninguna de las dos se publica por qué. CANDIDATA A DORMIDAS, no baja ejecutada.', mrr: 6342.00, mesesActivo: 73, acumulado: 0 },
    { cliente: 'DESARROLLADORA ROAI — «Bajo uso», AL PRIMER MES. Ya la publicaba la semana 29 al mismo importe y con motivo más largo: «el volumen de llamadas que manejan no hace viable mantener la herramienta activa por ahora». Es la mayor de las bajas de ≤3 meses.', mrr: 3349.00, mesesActivo: 1, acumulado: 0 },
    { cliente: 'VERITest — «Cierre de empresa», 33 meses. Ya estaba en la semana 29 al mismo importe y con el mismo motivo. No es un fallo de servicio: la empresa cierra.', mrr: 1596.00, mesesActivo: 33, acumulado: 0 },
    { cliente: '⚠️ Novahogar — 98 MESES, OCHO AÑOS Y MEDIO, Y SIN MOTIVO. Es la relación más larga que se va en el mes y el corte no dice por qué. NOMBRE NUEVO: la semana 29 no la traía.', mrr: 1278.00, mesesActivo: 98, acumulado: 0 },
    { cliente: 'VEV Travels — «Cuenta de prueba», al primer mes. NOMBRE NUEVO. Si era una prueba, no es churn de relación: es una venta que no arrancó, y el motivo lo dice el propio corte.', mrr: 1029.00, mesesActivo: 1, acumulado: 0 },
    { cliente: 'VRE México — «Ahorro / ya no lo necesita» tras 88 MESES. Ya estaba en la semana 29 al mismo importe, y allí el motivo venía entero y vale repetirlo: «su servicio es excelente y nunca ha fallado, pero ya no lo requieren más». Siete años y medio, y se va sin queja de producto.', mrr: 979.00, mesesActivo: 88, acumulado: 0 },
    { cliente: 'Rodcal Group Bienes Raíces — «Cierre de empresa», 9 meses. Ya estaba en la semana 29 al mismo importe y motivo.', mrr: 733.00, mesesActivo: 9, acumulado: 0 },
    { cliente: 'Vonda — «Bajo uso», 22 meses. Ya estaba en la semana 29 al mismo importe; allí el motivo era «No están utilizando el servicio».', mrr: 588.00, mesesActivo: 22, acumulado: 0 },
    { cliente: 'ALFAPROM — «Cambio a conmutadores físicos» tras 94 MESES. NOMBRE NUEVO, y el motivo es el más incómodo del corte: casi ocho años de nube y vuelve a hardware. Eso es una conversación de producto, no de uso.', mrr: 489.00, mesesActivo: 94, acumulado: 0 },
    { cliente: 'Alux Capital — SIN MOTIVO, 52 meses. NOMBRE NUEVO.', mrr: 489.00, mesesActivo: 52, acumulado: 0 },
    { cliente: 'Track One — SIN MOTIVO, 49 meses. NOMBRE NUEVO.', mrr: 384.00, mesesActivo: 49, acumulado: 0 },
    { cliente: 'Ingeniera Mantenimiento y Desarrollo Informático — «Bajo uso» con CERO MESES ACTIVOS. Ya estaba en la semana 29 al mismo importe, y allí el motivo venía entero: «la comunicación en su mayoría es por correo y no por llamadas». NO ES CHURN DE RELACIÓN: es una venta que nunca arrancó, y eso se arregla antes de la firma. La semana 29 contaba cuatro casos así en octubre y noviembre.', mrr: 209.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'SMUM México — SIN MOTIVO, 2 meses. NOMBRE NUEVO, y otra de ≤3 meses.', mrr: 209.00, mesesActivo: 2, acumulado: 0 },
    { cliente: 'Krezekapital — «Ahorro / ya no lo necesita», al primer mes. Ya estaba en la semana 29 al mismo importe; allí el motivo era «Ahorro económico».', mrr: 195.00, mesesActivo: 1, acumulado: 0 },
    { cliente: '❓ GANA A.C. — «Cambio de proyectos», y AQUÍ DICE 34 MESES CUANDO LA SEMANA 29 DECÍA 31, cinco días antes. Los otros siete clientes que las dos listas comparten repiten su antigüedad mes por mes, así que no es un redatado general: es esta fila. PREGUNTA ABIERTA; no se corrige a ojo. El importe sí coincide.', mrr: 169.00, mesesActivo: 34, acumulado: 0 },
    { cliente: 'Arlow Vertical — SIN MOTIVO, 49 meses. NOMBRE NUEVO.', mrr: 169.00, mesesActivo: 49, acumulado: 0 },
    { cliente: 'youpro — SIN MOTIVO, 52 meses. NOMBRE NUEVO.', mrr: 169.00, mesesActivo: 52, acumulado: 0 },
    { cliente: 'Espacio Mexico — SIN MOTIVO, 51 meses. NOMBRE NUEVO.', mrr: 169.00, mesesActivo: 51, acumulado: 0 },
    { cliente: 'BLACKTELECOM — «Problema de método de pago», 34 meses. NOMBRE NUEVO, y es el único motivo del mes que NO es una decisión del cliente: es cobranza. Una baja por método de pago a los 34 meses es recuperable si alguien la llama.', mrr: 169.00, mesesActivo: 34, acumulado: 0 },
  ],

  /* ── POR QUÉ SE FUERON ───────────────────────────────────────────────────
     ESTA TABLA NO LA PUBLICA EL CORREO: es NUESTRA agrupación de su columna
     «Motivo», que esta vez viene cliente por cliente. Se dice porque un
     agregado que parece de la fuente y no lo es es peor que no tenerlo.

     Cierra: 20 clientes y $27,104.00, los mismos que la tabla de arriba. Y
     «Sin motivo registrado» va como una fila más —la mayoritaria—: sacarla
     descuadraría el bloque y lo haría leer como si explicara el mes.
     [[feedback-cero-sin-medicion]] [[feedback-tablas-deben-cerrar]] */
  canceladoMotivos: [
    { motivo: 'Sin motivo registrado',          clientes: 9, importe: 17599.00 },
    { motivo: 'Bajo uso',                       clientes: 3, importe:  4146.00 },
    { motivo: 'Cierre de empresa',              clientes: 2, importe:  2329.00 },
    { motivo: 'Ahorro / ya no lo necesita',     clientes: 2, importe:  1174.00 },
    { motivo: 'Cuenta de prueba',               clientes: 1, importe:  1029.00 },
    { motivo: 'Cambio a conmutadores físicos',  clientes: 1, importe:   489.00 },
    { motivo: 'Cambio de proyectos',            clientes: 1, importe:   169.00 },
    { motivo: 'Problema de método de pago',     clientes: 1, importe:   169.00 },
  ],

  /* ── SOFT / HARD SUSPEND ─────────────────────────────────────────────────
     62 clientes y $62,590.00. El corte NO publica nombres: sólo las dos
     canastas, así que las filas describen canastas. La semana 29 no traía este
     bloque y la 28 tampoco; la última lectura era la de la semana 27, 33
     clientes por $50,199.34.

     `Suspendido` ↔ Soft y `Inactivo` ↔ Hard: es el único par que ofrece el
     tipo, y Hard es el estado más cerca de la baja. */
  suspendidosTotalReal:   62590.00,
  suspendidosCuentasReal: 62,
  suspendidos: [
    { cliente: 'SOFT SUSPEND — 41 clientes. Promedio de 45.0 días pendientes de pago, PERO ese promedio sólo mide a 34 de los 41: a siete no se les ha registrado fecha de corte, y el propio corte lo declara. Soft es el estado reversible: el servicio sigue, el cobro no.', importe: 38283.50, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: '🔴 HARD SUSPEND — 21 clientes. Promedio de 51.2 días, medido sobre 18 de los 21 (tres sin fecha de corte). Hard es el estado que antecede a la baja: son seis días más de retraso que los Soft y el 38.8% del dinero suspendido. Estos 21 son la lista corta.', importe: 24306.50, mesesActivo: 0, estado: 'Inactivo' },
  ],

  /* ── DOWNGRADES DE NOVIEMBRE ─────────────────────────────────────────────
     $39,814.00 en 8 clientes, y la semana 29 ya avisaba de que vendrían. Las
     ocho filas suman el total declarado.

     OJO CON EL RÓTULO: dos de los ocho son la semana 28 al centavo y al punto
     porcentual. No se corrige el total —es lo que publica la fuente— pero se
     dice. [[churn-analisis-data]]

     LOS % NO SE PUEDEN RECONSTRUIR AQUÍ: el correo no publica las bases de MRR
     y la mitad de estos nombres no está en el GRC con una base utilizable. Se
     publican como vienen, diciendo que son declarados.
     [[feedback-metricas-derivadas-origen]] */
  downgradeTotalReal: 39814.00,
  downgradeCasosReal: 8,
  downgrades: [
    { cliente: '🔴 Blueservices', perdida: 18399.03, nota: 'EL 46.2% DE TODO EL BLOQUE, y el mayor downgrade de la serie reciente: 75% de reducción declarada. Está en la cartera CS: cid 135456, cuenta C35, de Erick, y el GRC la trae con movimiento «Downgrade». Quedarse con el 25% de lo que facturaba está más cerca de una baja que de un cliente activo: esto se atiende como riesgo de churn, no como un ajuste de plan. El % es declarado — el correo no publica la base de MRR.' },
    { cliente: '🔴 Ancona Autopartes', perdida: 7610.00, nota: '29% de reducción declarada. Está en la cartera CS: cid 24924, cuenta F4, de Fátima, y el GRC la trae «Downgrade». ES LA CUENTA DE CHAT CON 15 SUCURSALES: cualquier lectura de su consumo va por la llave (CID, cuenta Chatwoot, periodo, corrida) y no por nombre. El % es declarado.' },
    { cliente: 'CASTDIM', perdida: 4500.00, nota: '46% de reducción declarada. NO está en la cartera CS, así que el impacto es institucional y no hay asesor asignado que lo defienda. El % es declarado.' },
    { cliente: '⚠️ Grupo Guía', perdida: 2400.00, nota: 'REPITE LA SEMANA 28 AL CENTAVO Y AL PUNTO: allí era $2,400.00 y 30%, reduciendo el paquete Min VyC, reconstruido entonces contra el GRC ($7,989.00 → $5,589.00, 2400/7989 = 30.0%). Bajo rótulo «Noviembre» eso tiene DOS lecturas que el correo no distingue: o el registro arrastra casos vivos, o es octubre reetiquetado. Es la TERCERA aparición del caso con tres lecturas: la semana 27 lo publicó a $1,600.00 y 25%, la 28 lo corrigió a $2,400.00 y 30%, y ésta confirma la corrección. 90 MESES de relación y $203,899.48 facturados según el GRC. NO está en la cartera CS.' },
    { cliente: '⚠️ Grupo SPH', perdida: 2392.00, nota: 'TAMBIÉN REPITE LA SEMANA 28 AL CENTAVO Y AL PUNTO: $2,392.00 y 71%, quitando Agente CP Chat, reconstruido entonces contra el GRC ($3,371.00 → $979.00, 2392/3371 = 70.96%). Misma advertencia de rótulo que Grupo Guía. Se queda con el 29% de lo que facturaba. 14 meses de relación y $42,410.00 facturados (GRC). NO está en la cartera CS, pero SÍ existe en Activaciones 2.0: ID 174954, vendedor Monse.' },
    { cliente: 'DO ALL MEXICANA', perdida: 2391.97, nota: '22% de reducción declarada — la menor del corte en porcentaje. Está en la cartera CS: cid 120038, cuenta F21, de Fátima, y el GRC la trae «Downgrade». El % es declarado.' },
    { cliente: 'Noktos', perdida: 1221.00, nota: '70% de reducción declarada, la segunda mayor en porcentaje. NO está en la cartera CS. Un 70% es un cliente que se está yendo por partes. El % es declarado.' },
    { cliente: 'Ferreteria Osito', perdida: 900.00, nota: '31% de reducción declarada. NO está en la cartera CS. El % es declarado.' },
  ],

  /* ── PRODUCTOS QUE REDUJERON O CANCELARON ────────────────────────────────
     Nueve artículos, y cada fila cierra: reducciones + cancelaciones =
     clientes. En total 8 reducciones y 3 cancelaciones sobre 11 PARES
     cliente-artículo, no once clientes — hay ocho clientes con downgrade y
     alguno toca dos artículos.

     ES UNA TABLA BRUTA, y lo dice el corte: «no incluye productos que
     aumentaron». Los $39,814.00 NO están neteados de upsell.

     `vecesAfectado` viene del corte. LOS NOMBRES POR ARTÍCULO NO: con nueve
     artículos y ocho clientes el cruce NO es único, así que aquí NO se
     reparten nombres. Decir «Blueservices quitó el Agente CP Chat» sería
     inventarlo. [[feedback-contexto-ia-sin-huecos]] */
  downgradeArticulos: [
    { articulo: 'Agente CP Chat',        vecesAfectado: 3, clientes: ['EL ARTÍCULO MÁS GOLPEADO Y EL ÚNICO CON CANCELACIONES: 1 cliente lo REDUJO y 2 lo CANCELARON. El corte no dice quiénes, y con nueve artículos sobre ocho clientes el cruce NO es único: no se reparten nombres. Es el mismo artículo que encabezaba la semana 28 (Onilog y Grupo SPH lo quitaban).'] },
    { articulo: 'Extensión CE',          vecesAfectado: 1, clientes: ['1 cliente lo CANCELA (0 reducciones). Es la tercera y última cancelación de producto del corte. Nombre no publicado.'] },
    { articulo: 'Extensión VyC',         vecesAfectado: 1, clientes: ['1 cliente lo reduce. Nombre no publicado.'] },
    { articulo: 'Extensión VyC min IP',  vecesAfectado: 1, clientes: ['1 cliente lo reduce. Nombre no publicado.'] },
    { articulo: 'DiD Nacional',          vecesAfectado: 1, clientes: ['1 cliente lo reduce. Nombre no publicado.'] },
    { articulo: 'DiD Internacional',     vecesAfectado: 1, clientes: ['1 cliente lo reduce. Nombre no publicado.'] },
    { articulo: 'paquete Min VyC',       vecesAfectado: 1, clientes: ['1 cliente lo reduce. Era el artículo más golpeado de la semana 27 (9 de 14 casos, $18,664.00) y lleva dos cortes en uno solo.'] },
    { articulo: 'paquete Min CE',        vecesAfectado: 1, clientes: ['1 cliente lo reduce. Nombre no publicado.'] },
    { articulo: 'Extensión Callcenter',  vecesAfectado: 1, clientes: ['1 cliente lo reduce. Nombre no publicado.'] },
  ],
}
