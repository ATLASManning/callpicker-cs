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
   REPORTE SEMANAL — SEMANA 28 · SEGUIMIENTO DE OCTUBRE
   Cuerpo fechado al 10 de noviembre de 2026; recibido el miércoles 11, que es
   la fecha que anunció la semana 27. Remitente: Valeria Zepeda Hernández
   (equipo Data).

   ESTE CORTE TRAE TRES BLOQUES Y LE FALTAN TRES. Es la primera vez que llega
   así, y por eso hay dos cosas que NO se pueden hacer:

     TRAE ..... porcentajes de churn (septiembre, octubre y acumulado, los tres
                reexpresados), cartera por cobrar por antigüedad (172 clientes,
                $208,994.05) y downgrades (3 clientes, $8,330.00) con su
                desglose por producto.
     NO TRAE .. cancelaciones, soft / hard suspend y top de clientes activos.
                Los tres los publicaba la semana 27. Un bloque ausente NO es un
                cero: se publica «no reportado». Octubre tuvo $75,295.50 en
                veinte bajas según la semana 27, así que un «$0» en esa tarjeta
                se leería como que el mes no perdió a nadie.
                [[feedback-cero-sin-medicion]]

   Y POR ESO HIZO FALTA TOCAR LA PANTALLA. La tarjeta de en medio es un ternario:
   con `cancelados` vacío se cambiaba sola a «Suspendidos / Inactivos», que en
   este corte TAMBIÉN está vacío — iba a publicar «$0 · 0 cuentas pausadas».
   Ahora `canceladoNoReportado` y `suspendidoNoReportado` cubren la clase entera,
   igual que ya hacían `pendienteNoReportado` y `downgradeNoReportado`.

   MAPEO, el mismo que fijó la semana 24 — el rótulo manda:
     · «Cartera por Cobrar» por antigüedad .......... pendientes + antiguedadSaldos
     · «Downgrades» ................................. downgrades + downgradeArticulos
     · «Cancelaciones» .............................. NO VIENE → cancelados: []
     · «Soft / Hard Suspend» ........................ NO VIENE → sin bloque
     · «Top de clientes activos» .................... NO VIENE

   CONCILIADO CON `scripts/concilia-churn-s28.py` (control negativo probado:
   con un conteo mal sale en rojo y con código 1). Cierra TODO lo interno:
     · los cinco tramos de cartera suman $208,994.05 y 172 clientes ✓
     · los downgrades por cliente suman $8,330.00 y son 3 ✓
     · los downgrades por producto suman $8,330.00 y afectan a 3 ✓
     · bruto == neto: este corte NO netea ningún upsell dentro de los 3 casos,
       al contrario que la semana 27 ($38,225.97 bruto vs $31,187.97 neto) ✓
     · el acumulado se reconstruye SUMANDO: 19.4% + 6.5% = 25.9% ✓
     · y POR PRIMERA VEZ los % de reducción se reconstruyen DIVIDIENDO, contra
       las bases de MRR del GRC, que el correo no publica ✓

   EL CORREO SE CONTRADICE CON SU PROPIO TÍTULO: se llama «Seguimiento Cierre de
   Octubre» y en el cuerpo marca octubre «MES CORRIENDO · NO DEFINITIVO», igual
   que el acumulado. No es el cierre. Aquí manda el cuerpo, que es donde está la
   advertencia. [[regla-churn-mes-vencido]]

   ESTO NO DA DE BAJA A NADIE. Es un reporte de Data: no mueve `cuentas`. Una
   baja se autoriza y se registra pasando la cuenta a Dormida, nunca borrándola.
   [[feedback-conciliacion-churn]]
   ═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S28_OCT_2026: ChurnReporte = {
  id:      's28-octubre-2026',
  periodo: 'Semana 28 · Oct 2026',
  fecha:   '10/11/2026',
  notas:   'Gross Revenue Churn · Semana 28. Cuerpo al 10 de noviembre del 2026, recibido el 11. '
         + 'Seguimiento del cierre de octubre con TRES bloques: los porcentajes —septiembre baja de '
         + '2.5% a 2.4%, octubre de 7.4% a 6.5% y el acumulado del año de 26.8% a 25.9%, los dos '
         + 'últimos marcados NO DEFINITIVOS—, la cartera por cobrar por antigüedad (172 clientes, '
         + '$208,994.05, que cae 22.2% desde la semana 27) y los downgrades (3 clientes, $8,330.00). '
         + 'LE FALTAN TRES BLOQUES que la semana 27 sí traía: cancelaciones, soft/hard suspend y top '
         + 'de clientes activos; se publican como NO REPORTADO, no como cero. El 94.3% de la cartera '
         + 'está concentrado en el tramo de 16 a 30 días, a UN tramo del que antecede a la '
         + 'suspensión. El propio corte avisa de que el monto mayor de downgrades que muestra el '
         + 'tablero no son downgrades sino upsells tomados antes de la fecha de corte, y lo '
         + 'corroboramos contra el GRC con nombre y apellido. Próxima revisión: miércoles 18 de '
         + 'noviembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 18 de noviembre.',

  grc: {
    /* Agosto NO viene en este corte: se conserva de la serie de las semanas 25 y
       26, misma fuente y mismo remitente. Septiembre y octubre sí son de aquí, y
       los DOS vienen reexpresados — septiembre por primera vez desde la semana
       26, así que esta vez sí lleva `anterior`. */
    evolucion: [
      { mes: 'Agosto',     pct: 2.1 },
      { mes: 'Septiembre', pct: 2.4, anterior: 2.5 },
      { mes: 'Octubre',    pct: 6.5, anterior: 7.4 },
    ],
    acumulado: 25.9,
    anterior:  26.8,
    acumuladoEtiqueta: '2026 acumulado hasta octubre · NO DEFINITIVO',
    notaClave:
      'Seguimiento de octubre. El mes BAJA de 7.4% a 6.5% —CUARTA lectura a la baja— y el acumulado '
      + 'del año baja con él, de 26.8% a 25.9%, LAS DOS MARCADAS NO DEFINITIVAS por el propio '
      + 'reporte. Septiembre también se reexpresa, de 2.5% a 2.4%. La cartera por cobrar sigue '
      + 'cediendo: $208,994.05 en 172 clientes contra $268,705.50 en 208 hace una semana (−22.2% y '
      + '−36 cuentas), pero el 94.3% está parado en el tramo de 16 a 30 días. Los downgrades del mes '
      + 'se reexpresan A LA BAJA: $8,330.00 en 3 clientes contra $31,187.97 en 14 de la semana 27, y '
      + 'el corte explica por qué. ESTE CORTE NO PUBLICA cancelaciones, suspendidos ni top de '
      + 'activos: la última lectura completa de cancelaciones de octubre sigue siendo la de la '
      + 'semana 27, $75,295.50 en veinte clientes.',
    notaEspecial:
      '📉 CUARTA LECTURA A LA BAJA DEL MES, Y EL GUION NO CAMBIA. Octubre pasa de 7.4% a 6.5%: 0.9 '
      + 'puntos, el 12.2% de la lectura anterior. El recorrido completo del mes es 22.1% → 12.4% → '
      + '7.4% → 6.5%, el mismo que hizo septiembre. Y SEPTIEMBRE SIGUE MOVIÉNDOSE: 2.5% → 2.4%, que '
      + 'es su SEXTA lectura (23.6% → 6.9% → 3.14% → 2.6% → 2.5% → 2.4%). El mes vivo NO mide bajas, '
      + 'mide retraso de cobranza, y se recupera con pagos. [[regla-churn-mes-vencido]] '
      + '📌 EL ACUMULADO BAJA Y ES CORRECTO: 19.4% (hasta septiembre) + 6.5% (octubre) = 25.9%, '
      + 'exactamente lo declarado, con la MISMA base 19.4% que ya usaban las semanas 26 y 27. Como '
      + 'se construye SUMANDO el mes vivo, hereda entero su desinflado sin que se recupere una sola '
      + 'cuenta. '
      + '💰 LA COBRANZA SIGUE FUNCIONANDO, PERO LA OLA SE MOVIÓ UN TRAMO. La cartera por cobrar cae '
      + 'de $268,705.50 en 208 clientes a $208,994.05 en 172 (−22.2%, −36 cuentas). Y el movimiento '
      + 'interno es el mismo patrón de la semana pasada, una semana más viejo: el tramo de 8 a 15 '
      + 'días se VACÍA ($208,046.71 en 145 cuentas pasa a $714.00 en 2) y el de 16 a 30 se dispara '
      + '($43,568.34 en 41 cuentas pasa a $196,991.05 en 153). Ese dinero no desapareció: envejeció. '
      + '⚠️ Y AHÍ ESTÁ EL RIESGO DE LA SEMANA: el 94.3% de toda la cartera por cobrar —$196,991.05 en '
      + '153 clientes— está parado en 16 a 30 días, o sea a UN SOLO TRAMO del de más de 30 días, que '
      + 'es el que históricamente antecede a la suspensión. Si esa ola envejece sin cobrarse, el '
      + 'tramo que hoy vale $10,770.00 se multiplica por veinte. Esos 153 clientes son la lista de '
      + 'cobranza de esta semana, y es la cifra más accionable del corte. '
      + '✅ LO ÚNICO QUE MEJORA EN TÉRMINOS ABSOLUTOS ES EL TRAMO PELIGROSO: más de 30 días baja de '
      + '$11,138.45 en 17 clientes a $10,770.00 en 16. Es la primera vez en tres cortes que no '
      + 'empeora. Pequeño, pero va en la dirección correcta. '
      + '🔻 LOS DOWNGRADES DEL MES SE REEXPRESAN A LA BAJA, DE $31,187.97 A $8,330.00. Tres clientes: '
      + 'Onilog pierde $3,538.00 (56%) al quitar Agente CP Chat, Grupo Guía $2,400.00 (30%) al '
      + 'reducir el paquete Min VyC, y Grupo SPH $2,392.00 (71%) al quitar Agente CP Chat. Por '
      + 'producto: Agente CP Chat $5,930.00 en 2 clientes y paquete Min VyC $2,400.00 en 1. Las dos '
      + 'tablas suman lo mismo, así que este corte no netea ningún upsell dentro de los tres casos. '
      + '🥇 Y POR PRIMERA VEZ LOS PORCENTAJES DE REDUCCIÓN SE PUEDEN VERIFICAR. La semana 27 tuvo que '
      + 'citarlos como venían porque el correo no publica la facturación anterior. Esta vez los tres '
      + 'casos están en el GRC —fuente independiente— CON su base de MRR, y los tres reconstruyen '
      + 'dividiendo: Onilog 6,317 → 2,779 da 56.0%, Grupo Guía 7,989 → 5,589 da 30.0%, Grupo SPH '
      + '3,371 → 979 da 70.96%. Los importes casan al centavo y mrrIni − mrrFin es exactamente la '
      + 'pérdida en los tres. Queda contestada la observación ⑥ de la semana 27, al menos para '
      + 'estos tres. [[feedback-metricas-derivadas-origen]] '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas, contra '
      + 'los cuatro cortes anteriores del mismo mes y contra el GRC, con '
      + '`scripts/concilia-churn-s28.py`. No corrige ninguna cifra publicada. '
      + '① LA CAÍDA DE LOS DOWNGRADES ES UNA CORRECCIÓN, NO UNA REBANADA — Y LO PODEMOS PROBAR CON UN '
      + 'NOMBRE. El corte avisa de que «en el dashboard se ve un mayor monto en downgrades, pero no '
      + 'lo son: son clientes que hicieron upsell antes de su fecha de corte». Eso, dicho así, es '
      + 'una afirmación suya. Pues bien: CORPORATIVO GRUPO FUNERARIO SAN JAVIER, que la semana 27 '
      + 'publicó como downgrade de $1,959.00 con «44.4% de reducción», en el GRC aparece como «Upsell '
      + 'por confirmar» con MRR de $2,450.00 a $4,409.00. O sea que no bajó: SUBIÓ un 80%. La '
      + 'explicación del corte está corroborada por una segunda fuente y sobre una cuenta concreta. '
      + 'Es exactamente lo contrario de lo que pasó con las cancelaciones en la semana 27, donde la '
      + 'cifra pequeña SÍ era una rebanada. No se puede aplicar el mismo reflejo a los dos casos. '
      + '② GRUPO GUÍA ESTÁ REEXPRESADO Y LA SEMANA 27 ERA LA EQUIVOCADA. La semana 27 publicó '
      + '$1,600.00 con 25% de reducción; este corte dice $2,400.00 con 30%, y el GRC dice $2,400.00 '
      + 'con MRR de $7,989.00 a $5,589.00. Dos fuentes contra una: la cifra correcta es $2,400.00. '
      + 'No es palabra contra palabra. '
      + '③ LOS OTROS CUATRO NOMBRES DEL TOP DE LA SEMANA 27 TAMPOCO SE SOSTIENEN COMO DOWNGRADES. En '
      + 'el GRC, Portalia, TUNALI TEC, Hotel Real de Minas y Proseso Consultores aparecen las cuatro '
      + 'como «Por confirmar (corte de datos)» —no como Downgrade— y con importes que no se parecen a '
      + 'los publicados: Portalia $2,029.00 contra los $9,754.97 de la semana 27, TUNALI $2,990.00 '
      + 'contra $5,404.00, Proseso $519.00 contra $2,210.00. Las cuatro tienen la misma firma: MRR '
      + 'fin en cero y pérdida igual al MRR inicio, que es justo el perfil de una cuenta pillada a '
      + 'medio ciclo de facturación. Los $9,754.97 de Portalia —«el mayor downgrade del mes», el '
      + '31.3% del total— no están corroborados por ninguna otra fuente. '
      + '④ EL ACUMULADO NO PROPAGA LA REVISIÓN DE SEPTIEMBRE, Y SON 0.1 PUNTOS SIN DECLARAR. '
      + 'Septiembre baja de 2.5% a 2.4%, pero la base de meses anteriores se queda clavada en 19.4% '
      + 'en las dos lecturas (26.8 − 7.4 = 19.4 y 25.9 − 6.5 = 19.4). Propagando la revisión, el '
      + 'acumulado tendría que ser 25.8%, no 25.9%. Publicamos el 25.9% que declara el corte y lo '
      + 'preguntamos: puede ser redondeo de cifras sin redondear, o puede ser que la revisión del mes '
      + 'no haya llegado al acumulado. [[feedback-metricas-derivadas-origen]] '
      + '⑤ EL GRC VE TRECE DOWNGRADES MÁS QUE EL CORREO, Y UNO ES MAYOR QUE TODOS LOS DEL CORREO. El '
      + 'export del repo lista 16 filas con movimiento «Downgrade» por $21,568.27; los tres del '
      + 'correo están dentro al centavo y los otros trece suman $13,238.27, con Mi Hospedaje Travel '
      + 'a la cabeza ($4,095.00, más que Onilog). PERO ESO NO ES UN HALLAZGO TODAVÍA: el export del '
      + 'repo tiene mes vivo NOVIEMBRE y el correo habla de octubre, y el GRC no trae periodo por '
      + 'fila. No se puede afirmar que al correo le falten trece del mes. Se pregunta. '
      + '⑥ NINGUNO DE LOS DOWNGRADES TOCA LA CARTERA CS, Y ES UN CERO DÉBIL. Las 16 filas del GRC '
      + 'salen con `enCartera: false`, y los tres del correo tampoco están en la cartera —ni Onilog, '
      + 'ni Grupo Guía, ni Grupo SPH, comprobado con `busca-cuenta.py`—. Grupo SPH sí existe en '
      + 'Activaciones 2.0 (ID 174954, vendedor Monse). Pero NINGUNA de las 16 filas trae CID, así que '
      + 'el cruce es por nombre y por nombre se mezclan cuentas: esto NO autoriza a decir «no nos '
      + 'afecta». Lo que sí se puede decir es que el impacto es institucional y que de los tres, '
      + 'Grupo Guía es el que duele —90 meses de relación y $203,899.48 facturados según el GRC—. '
      + '[[grc-fuente-zoho]] [[dids-fuente]] '
      + '⑦ EL CORREO SE CONTRADICE CON SU PROPIO TÍTULO. Se llama «Seguimiento Cierre de Octubre» y '
      + 'el cuerpo marca octubre «MES CORRIENDO · NO DEFINITIVO» y el acumulado «NO DEFINITIVO». No '
      + 'es un cierre. Publicamos lo que dice el cuerpo, que es donde está la advertencia, y el '
      + 'rótulo de la tarjeta lo dice. La cuarta lectura a la baja de un mes vivo tampoco es el '
      + 'cierre del mes. [[regla-churn-mes-vencido]] '
      + '⑧ TRES BLOQUES AUSENTES, Y UNO DE ELLOS IBA A PUBLICAR UN CERO FALSO. Este corte no trae '
      + 'cancelaciones, ni soft/hard suspend, ni top de activos. La tarjeta de en medio de la '
      + 'pantalla se cambiaba sola a «Suspendidos / Inactivos» cuando no hay cancelaciones, y como '
      + 'aquí tampoco hay suspendidos iba a decir «$0 · 0 cuentas pausadas»: un cero sobre un bloque '
      + 'que nadie midió, tapando además que faltan las cancelaciones. Arreglado para la clase '
      + 'entera, no para esta semana. La última lectura completa de cancelaciones de octubre sigue '
      + 'siendo la de la semana 27: $75,295.50 en veinte clientes, con Jason de México dentro. '
      + '[[feedback-cero-sin-medicion]] '
      + '⑨ «POR VENCER» SIGUE SIENDO UN HUECO DE REGISTRO CON NOMBRE DE TRAMO, y el corte lo repite '
      + 'literal: agrupa a los clientes «sin fecha de corte registrada aún». Son $519.00 en 1 solo '
      + 'cliente, el 0.2% de la cartera, y baja desde $5,952.00 en 5 — así que el registro se está '
      + 'limpiando. En cambio «1 a 7 días = $0.00 en 0 clientes» SÍ es un cero medido: hay tramo, '
      + 'importe y conteo. No se comparan los «Por vencer» de dos cortes entre sí: el rótulo ha '
      + 'significado tres cosas distintas en tres semanas. '
      + '⑩ LO QUE SÍ CUADRA, al centavo: los cinco tramos contra $208,994.05 y sus 172 clientes; los '
      + 'downgrades por cliente contra $8,330.00 y sus 3; los downgrades por producto contra el mismo '
      + '$8,330.00 y los mismos 3; el acumulado contra la suma 19.4% + 6.5%; y los tres porcentajes '
      + 'de reducción contra las bases de MRR del GRC. '
      + '⑪ LO QUE NO SE PUEDE RECONSTRUIR: el correo no publica la base de MRR mensual, así que 2.1%, '
      + '2.4% y 6.5% se citan como vienen. Agosto (2.1%) no viene en este corte: se conserva de la '
      + 'serie de las semanas 25 y 26. Y no se publica el cruce entre cartera por cobrar y '
      + 'suspendidos —que este corte ni trae—, así que el solape no se puede cuantificar.',
  },

  /* ── CARTERA POR COBRAR ─────────────────────────────────────────────────
     172 clientes, $208,994.05 ✓. El corte no da detalle por cliente: sólo los
     cinco tramos. Este corte NO declara descuadre contra el documento fuente,
     al contrario que la semana 27 (que arrastraba un total de dos semanas
     antes).

     LA OLA SE MOVIÓ UN TRAMO: el de 8 a 15 días se vació y el de 16 a 30 se
     disparó. El 94.3% de la cartera está a UN tramo del que antecede a la
     suspensión, y eso es lo más accionable que trae el corte.

     «Por vencer» NO es deuda joven: el propio corte aclara que son los clientes
     SIN FECHA DE CORTE REGISTRADA. Es un hueco de registro, y así se rotula. */
  pendientesTotalReal:   208994.05,
  pendientesCuentasReal: 172,
  /* Esto es SALDO VENCIDO, no la cartera activa. Y a diferencia de la semana 27,
     este corte NO publica la cartera activa —no trae top de activos—, así que
     aquí no hay con qué contrastarlo: se dice que no viene. */
  pendientesEtiqueta: 'Cartera POR COBRAR (saldo vencido). Este corte NO publica la cartera activa, así que no hay cifra con la que contrastarla — la de la semana 27 eran $120,148.01',
  pendientes: [
    { cliente: 'Por vencer — 1 cliente. OJO: el corte aclara que agrupa a los clientes «sin fecha de corte registrada aún». NO es deuda todavía no vencida: es un HUECO DE REGISTRO. Baja desde $5,952.00 en 5 clientes, así que el registro se está limpiando. Esa cuenta necesita fecha de corte en el sistema.', monto: 519.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '1 a 7 días vencido — 0 clientes. ESTE SÍ ES UN CERO MEDIDO: hay tramo, importe y conteo. Segunda semana seguida vacío, lo que indica que la facturación nueva del periodo todavía no entra a este tramo.', monto: 0.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '8 a 15 días vencido — 2 clientes. SE VACÍA: hace una semana eran $208,046.71 en 145 cuentas, el 77.4% de la cartera. Ese dinero no se cobró todo — envejeció al tramo siguiente.', monto: 714.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '⚠️ 16 a 30 días vencido — 153 clientes. EL 94.3% DE TODA LA CARTERA POR COBRAR. Se dispara desde $43,568.34 en 41 cuentas: es la ola de la semana pasada, un tramo más vieja. Está a UN SOLO TRAMO del que antecede a la suspensión. Estos 153 clientes son la lista de cobranza de la semana.', monto: 196991.05, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: 'Más de 30 días — 16 clientes. POR PRIMERA VEZ EN TRES CORTES NO EMPEORA: baja desde $11,138.45 en 17 clientes. Sigue siendo el tramo que antecede a la suspensión, y si la ola de 16-30 días envejece sin cobrarse se multiplica por veinte.', monto: 10770.00, mesesActivo: 0, ultimaFactura: '—' },
  ],

  antiguedadSaldos: [
    { rango: 'Por vencer (sin fecha de corte)', monto:    519.00 },
    { rango: '1 – 7 días vencido',              monto:      0.00 },
    { rango: '8 – 15 días vencido',             monto:    714.00 },
    { rango: '16 – 30 días vencido',            monto: 196991.05 },
    { rango: 'Más de 30 días',                  monto:  10770.00 },
  ],

  /* ── CANCELACIONES: NO VIENEN EN ESTE CORTE ─────────────────────────────
     La lista va VACÍA y NO se declara `canceladosCasosReal`, que es lo que
     dispara el «no reportado» del render. No es cero: octubre tuvo $75,295.50
     en veinte bajas según la semana 27 —con Jason de México, cuenta TOP,
     dentro—, y ésa sigue siendo la última lectura completa del mes.
     [[feedback-cero-sin-medicion]] */
  cancelados: [],

  /* ── DOWNGRADES DE OCTUBRE · REEXPRESADOS A LA BAJA ─────────────────────
     $8,330.00 en 3 clientes, contra $31,187.97 en 14 de la semana 27. Las dos
     tablas del corte suman lo mismo ✓, así que no hay upsell neteado dentro de
     estos tres casos — al contrario que en la semana 27.

     ES UNA CORRECCIÓN, NO UNA REBANADA, y está probado con un nombre: San
     Javier, publicado entonces como downgrade de $1,959.00, es «Upsell por
     confirmar» en el GRC con MRR de $2,450.00 a $4,409.00. Ver la observación ①.

     LOS % SÍ SE PUEDEN VERIFICAR ESTA VEZ: las bases de MRR salen del GRC, no
     del correo, y los tres reconstruyen dividiendo. Las cifras de `mrrIni`,
     `mrrFin` y el acumulado facturado que se citan en las notas vienen del GRC
     y se dice de dónde salen — el correo no publica ninguna de las tres.
     [[feedback-metricas-derivadas-origen]] */
  downgradeTotalReal: 8330.00,
  downgradeCasosReal: 3,
  downgrades: [
    { cliente: 'Onilog', perdida: 3538.00, nota: 'QUITA Agente CP Chat. 56% de reducción, y esta vez se RECONSTRUYE: el GRC le da MRR de $6,317.00 a $2,779.00, o sea $3,538.00 de pérdida —el mismo importe del correo al centavo— y 3538/6317 = 56.0%. 57 meses de relación y $161,941.00 facturados según el GRC (el correo no publica ninguno de los dos). NO está en la cartera CS.' },
    { cliente: '🔴 Grupo Guía', perdida: 2400.00, nota: 'REDUCE el paquete Min VyC. 30% de reducción, reconstruido: el GRC le da MRR de $7,989.00 a $5,589.00 y 2400/7989 = 30.0%. OJO, ESTÁ REEXPRESADO: la semana 27 publicó $1,600.00 con 25%, y entre este corte y el GRC son dos fuentes contra una — la cifra buena es $2,400.00. Es el caso que más duele de los tres: 90 MESES de relación, siete años y medio, y $203,899.48 facturados según el GRC. NO está en la cartera CS, así que el impacto es institucional y no hay asesor asignado que lo defienda.' },
    { cliente: 'Grupo SPH', perdida: 2392.00, nota: 'QUITA Agente CP Chat. 71% de reducción —la mayor del corte—, reconstruida: el GRC le da MRR de $3,371.00 a $979.00 y 2392/3371 = 70.96%. Se queda con el 29% de lo que facturaba, y eso está más cerca de una baja que de un cliente activo. Sólo 14 meses de relación y $42,410.00 facturados (GRC). NO está en la cartera CS, pero SÍ existe en Activaciones 2.0: ID 174954, vendedor Monse.' },
  ],

  /* Las dos tablas del corte suman lo mismo, $8,330.00 ✓, así que este corte
     NO netea upsells dentro de los tres casos. La semana 27 tenía que advertir
     lo contrario ($38,225.97 bruto contra $31,187.97 neto) y esa advertencia NO
     se hereda: es una diferencia de forma entre cortes.

     `vecesAfectado` viene en el corte. Los nombres por artículo NO se publican
     en la tabla de productos, pero aquí sí se pueden decir: con tres casos y
     dos productos, el cruce con la tabla por cliente es único.
     [[feedback-contexto-ia-sin-huecos]] */
  downgradeArticulos: [
    { articulo: 'Agente CP Chat — $5,930.00',   vecesAfectado: 2, clientes: ['Onilog ($3,538.00) y Grupo SPH ($2,392.00), los dos lo QUITAN. Es el 71.2% del impacto del corte, y es un artículo que no aparecía en la tabla de productos de la semana 27 — ahí sólo salía como producto AÑADIDO por TUNALI TEC.'] },
    { articulo: 'paquete Min VyC — $2,400.00',  vecesAfectado: 1, clientes: ['Grupo Guía, que lo REDUCE. Era el artículo más golpeado de la semana 27 (9 de 14 casos, $18,664.00) y aquí queda en uno solo.'] },
  ],

  /* ── SOFT / HARD SUSPEND: NO VIENEN EN ESTE CORTE ───────────────────────
     Sin bloque y sin `suspendidosTotalReal`, que es lo que dispara el «no
     reportado». La semana 27 publicaba 33 clientes por $50,199.34; que este
     corte no los traiga NO significa que se hayan liberado.
     [[feedback-cero-sin-medicion]] */
}
