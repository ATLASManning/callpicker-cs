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
   REPORTE SEMANAL — SEMANA 27 · AVANCE DE OCTUBRE
   Al 4 de noviembre de 2026. Remitente: Valeria Zepeda Hernández (equipo Data).

   MAPEO, el mismo que fijó el corte de la semana 24 — el rótulo manda:
     · «Cartera por Cobrar» por antigüedad .......... pendientes + antiguedadSaldos
     · «Cancelaciones» .............................. cancelados (+ cubo de cierre)
     · «Downgrades» ................................. downgrades + downgradeArticulos
     · «Resumen Soft / Hard Suspend» ................ suspendidos
     · «Top 5 · Clientes Activos» ................... NINGUNO — va en la nota,
       porque la cartera activa es lo que SÍ factura y el bloque de pendientes
       la rotularía «riesgo inmediato». [[feedback-kpi-con-fuente]]

   CONCILIADO CON `scripts/concilia-churn-s27.py`. Cierra TODO lo interno:
     · soft + hard suspend suman $50,199.34 y 33 clientes ✓
     · los cinco tramos de cartera suman $268,705.50 y 208 clientes ✓
     · las 11 cancelaciones detalladas suman $60,471.50 y son el 80.3% de los
       $75,295.50 declarados — el % se reconstruye DIVIDIENDO, no se copia ✓
     · el top 6 de downgrades suma $23,417.97 y los seis productos $38,225.97 ✓
     · el acumulado sale de sumar: 19.4% + 7.4% = 26.8% ✓

   TRES TABLAS NO CIERRAN SOLAS Y LLEVAN CUBO:
     · cancelaciones — 20 clientes por $75,295.50, de los que se detallan 11.
       Cubo de 9 clientes por $14,824.00.
     · downgrades — 14 clientes por $31,187.97, de los que se detallan 6.
       Cubo de 8 clientes por $7,770.00.
     · top de activos — cinco de $61,381.01 sobre una cartera activa de
       $120,148.01, el 51.1%. El resto, $58,767.00, no se desglosa y el corte no
       dice cuántos clientes son.

   VUELVEN LOS DOWNGRADES. La semana 26 no los midió —decía «no significativos»
   sin cifra— y este corte sí los cuantifica: $31,187.97 en 14 clientes. Queda
   contestado lo que marcamos la semana pasada.

   AGOSTO (2.1%) NO VIENE EN ESTE CORTE: lo trae la serie de los cortes 25 y 26.
   Se conserva en la evolución porque es la misma serie institucional y el mismo
   remitente, pero NO es dato de esta semana. Septiembre y octubre sí.

   Y OJO CON EL 7.4% DE OCTUBRE: sigue siendo mes vivo y ya es la TERCERA lectura
   a la baja (22.1% → 12.4% → 7.4%). [[regla-churn-mes-vencido]]

   ESTO NO DA DE BAJA A NADIE. Es un reporte de Data: no mueve `cuentas`. Una
   baja se autoriza y se registra pasando la cuenta a Dormida, nunca borrándola.
   [[feedback-conciliacion-churn]]
   ═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S27_OCT_2026: ChurnReporte = {
  id:      's27-octubre-2026',
  periodo: 'Semana 27 · Oct 2026',
  fecha:   '04/11/2026',
  notas:   'Gross Revenue Churn · Semana 27. Al 4 de noviembre del 2026. Avance del mes: Top 5 de '
         + 'clientes activos sobre una cartera de $120,148.01, resumen de soft y hard suspend —33 '
         + 'clientes, $50,199.34—, 20 cancelaciones por $75,295.50 de las que se detallan 11, 14 '
         + 'downgrades por $31,187.97 con su desglose por producto, y la cartera por cobrar por '
         + 'antigüedad: 208 clientes, $268,705.50. Octubre BAJA de 12.4% a 7.4% —tercera lectura a '
         + 'la baja— y sigue marcado MES CORRIENDO y NO DEFINITIVO; el acumulado del año baja con '
         + 'él, de 31.8% a 26.8%. VUELVEN los downgrades, que la semana 26 no midió. El propio corte '
         + 'declara un descuadre de $3,614.10 en la tabla de cartera. Próxima revisión: miércoles 11 '
         + 'de noviembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 11 de noviembre.',

  grc: {
    /* Agosto NO viene en este corte: se conserva de la serie de los cortes 25 y
       26, misma fuente y mismo remitente. Septiembre y octubre sí son de aquí.
       Septiembre va SIN `anterior` porque este corte no lo reexpresa: sigue en
       2.5% desde la semana 26, y marcar un cambio que no hubo sería falso. */
    evolucion: [
      { mes: 'Agosto',     pct: 2.1 },
      { mes: 'Septiembre', pct: 2.5 },
      { mes: 'Octubre',    pct: 7.4, anterior: 12.4 },
    ],
    acumulado: 26.8,
    anterior:  31.8,
    acumuladoEtiqueta: '2026 acumulado hasta octubre · NO DEFINITIVO',
    notaClave:
      'Avance de octubre. El mes BAJA de 12.4% a 7.4% y el acumulado del año baja con él, de 31.8% a '
      + '26.8%, LAS DOS MARCADAS NO DEFINITIVAS por el propio reporte. Octubre lleva $75,295.50 en '
      + 'veinte cancelaciones, $31,187.97 en catorce downgrades y 33 clientes suspendidos por '
      + '$50,199.34. La cartera por cobrar CAE casi a la mitad: $268,705.50 en 208 clientes contra '
      + '$497,941.00 en 363 hace seis días — la cobranza funcionó. La cartera activa del mes son '
      + '$120,148.01. Los downgrades VUELVEN a venir cuantificados después de que la semana 26 no '
      + 'los midiera.',
    notaEspecial:
      '✅ TERCERA LECTURA A LA BAJA DEL MES VIVO, Y SIGUE EL GUION. Octubre pasa de 12.4% a 7.4%: una '
      + 'caída de 5.0 puntos, el 40.3% de la lectura anterior. El recorrido completo del mes es '
      + '22.1% → 12.4% → 7.4%, el mismo que hizo septiembre (23.6% → 6.9% → 3.14% → 2.6% → 2.5%). '
      + 'SIGUE SIENDO MES CORRIENDO: el 7.4% tampoco es el cierre. El mes vivo NO mide bajas, mide '
      + 'retraso de cobranza, y se recupera con pagos. [[regla-churn-mes-vencido]] '
      + '📌 EL ACUMULADO BAJA, Y ESO ES CORRECTO: 19.4% (hasta septiembre) + 7.4% (octubre) = 26.8%, '
      + 'exactamente lo declarado, con la MISMA base 19.4% que ya usaba la semana 26. Como el '
      + 'acumulado se construye SUMANDO el mes vivo, hereda entero su desinflado: de 31.8% a 26.8% '
      + 'sin que se haya recuperado ni una sola cuenta — sólo cambió la lectura de octubre. '
      + '✔️ VUELVEN LOS DOWNGRADES, Y ERA LO QUE PEDIMOS. La semana 26 decía «no hay downgrades '
      + 'significativos en la semana» —un juicio sin cifra— y lo marcamos como no medido. Este corte '
      + 'trae $31,187.97 en 14 clientes con desglose por producto. Queda contestado. '
      + '💰 LA COBRANZA FUNCIONÓ: la cartera por cobrar cae de $497,941.00 en 363 clientes a '
      + '$268,705.50 en 208 (−46.0% en dinero, −155 cuentas) y el tramo de 1 a 7 días se vacía por '
      + 'completo: $307,946.40 en 218 cuentas pasa a $0.00 en cero. Ese dinero no desapareció: '
      + 'envejeció un tramo. El de 8 a 15 días sube de $88,958.84 en 56 cuentas a $208,046.71 en '
      + '145. Es la misma ola de facturación una semana más vieja, y buena parte se cobró. '
      + '⚠️ PERO EL TRAMO DE MÁS DE 30 DÍAS SE DUPLICA: $5,099.00 en 7 clientes pasa a $11,138.45 en '
      + '17 (+118.4% en dinero, +143% en cuentas). Es el tramo que históricamente antecede a la '
      + 'suspensión, y es el ÚNICO que empeora en un corte donde todo lo demás de cobranza mejora. '
      + 'Esas 17 cuentas son la lista de llamadas de esta semana. '
      + '🔻 LOS SUSPENDIDOS BAJAN EN CUENTAS PERO CASI NO EN DINERO: de 63 clientes y $58,121.84 a 33 '
      + 'y $50,199.34 (−47.6% en cuentas, −13.6% en dinero). O sea que el promedio por cuenta casi se '
      + 'duplica, de $922.57 a $1,521.19: se liberaron las cuentas pequeñas y quedaron las grandes. '
      + 'Sin baja autorizada NO son churn, pero el saldo atascado ahora está en menos manos y vale '
      + 'más cada una. '
      + '🏆 TOP 5 DE CLIENTES ACTIVOS, sobre una cartera de $120,148.01: ATP Sofom $14,848.97 (27 '
      + 'meses, marcada TOP) · ABRL Sistemas & Proyectos $14,665.00 (83) · SW Sapien $13,668.02 (49) '
      + '· Grupo Rizo $9,211.00 (26) · Imagen Dental AMT $8,988.02 (56). Los cinco suman $61,381.01, '
      + 'el 51.1%: los otros $58,767.00 no se desglosan y el corte NO dice cuántos clientes son. '
      + '🔁 Y POR PRIMERA VEZ EL TOP DE ACTIVOS REPITE NOMBRES: tres de los cinco —ATP Sofom, ABRL y '
      + 'SW Sapien— ya estaban en la semana 26. Llevábamos tres cortes seguidos con quince nombres y '
      + 'cero repeticiones, y lo marcamos dos semanas seguidas como señal de que la consulta cambiaba '
      + 'de población. Esto es una mejora real. Pero la cartera activa CAE un 42.0% al mismo tiempo '
      + '($206,983.42 → $120,148.01), así que la pregunta por la población sigue abierta, sólo que '
      + 'ahora en la otra dirección: hay que saber si eso es caída de facturación o cambio de '
      + 'consulta. '
      + '💀 UNA CUENTA TOP SE VA, Y ES LA MAYOR BAJA DEL MES: Jason de México, $17,225.00 de MRR y 43 '
      + 'meses de relación, marcada TOP por el corte. Pesa el 22.9% de TODO lo cancelado en octubre. '
      + 'La semana 24 ya publicaba su motivo: MIGRACIÓN A OTRO PROVEEDOR. No es una cuenta que se '
      + 'apaga por poco uso: es una que alguien más se llevó, y a una cuenta TOP eso se le escala. '
      + '[[feedback-conciliacion-churn]] '
      + '⏳ TRES BAJAS PASAN DE CINCO AÑOS: KOMBITEC 73 meses, enMazatlan 73 y WhatsHome 71. Son 217 '
      + 'meses de relación acumulada —dieciocho años entre tres cuentas— que salen en un solo mes. '
      + 'enMazatlan se iba «Sin Respuesta» según la semana 26: a un cliente de seis años no se le deja '
      + 'ir sin que nadie lo localice. '
      + '🆕 Y CINCO BAJAS NO LLEGAN A LOS OCHO MESES: ZD · The Palms (3), ZD · Grupo Gira (5), Grupo '
      + 'Turístico Rumbo (6), SOBERANI (8) y UAXI Tecnología (8). El mes pierde por los dos extremos '
      + 'a la vez: las relaciones muy largas y las que nunca arrancaron. Las jóvenes suman $18,434.00, '
      + 'el 24.5% de lo cancelado. '
      + '📉 PORTALIA PIERDE EL 82.8% DE LO QUE FACTURABA: $9,754.97, el mayor downgrade del mes y el '
      + '31.3% de todo el ingreso perdido por reducción. Es la misma reducción que ya publicaba la '
      + 'semana 24, al centavo. Una cuenta que se queda con el 17% de su contrato está más cerca de '
      + 'una baja que de un cliente activo, y hay que tratarla como tal. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas y contra '
      + 'los TRES cortes anteriores del mismo mes, con `scripts/concilia-churn-s27.py`. No corrige '
      + 'ninguna cifra publicada. '
      + '① EL DESCUADRE QUE EL PROPIO CORTE DECLARA ES UN TOTAL ARRASTRADO, NO UN RENGLÓN PERDIDO. El '
      + 'corte avisa que el documento fuente reporta $272,319.60 para la cartera mientras los 208 '
      + 'renglones suman $268,705.50, y que la diferencia de $3,614.10 no se identificó «tras '
      + 'revisión línea por línea». Pues bien: $272,319.60 es, AL CENTAVO, el total de cartera por '
      + 'cobrar que publicó la SEMANA 25 —la semana 26 lo cita literal: «contra $272,319.60 en 173 '
      + 'hace seis días»—. No falta un renglón: hay una celda de total que se quedó con la cifra de '
      + 'hace dos semanas. Publicamos la suma de los 208 renglones, que es lo que cierra, y hay que '
      + 'pedir que lo corrijan en el origen. [[feedback-metricas-derivadas-origen]] '
      + '② EL MISMO OCTUBRE LLEVA CUATRO LECTURAS QUE NO SE PARECEN, Y ESTA ES LA PRIMERA COMPLETA. '
      + 'Cancelaciones del mes según cada corte: semana 24, 11 clientes por $35,127.00 · semana 25, 2 '
      + 'por $6,708.50 · semana 26, 11 por $20,234.00 · semana 27, 20 por $75,295.50. Lo conciliamos '
      + 'nombre por nombre contra los bloques ya archivados y la unión de los cuatro cortes son '
      + 'EXACTAMENTE 20 nombres distintos: los mismos 20 que declara este corte, y los nueve que '
      + 'repiten vienen al mismo importe al centavo. Nombres verdaderamente nuevos sólo hay dos, '
      + 'SOBERANI y ZD · The Palms. O sea que la cifra no creció: la semana 25 y la semana 26 '
      + 'publicaron una REBANADA del mes y la rotularon «las cancelaciones del mes». La semana 26 '
      + 'declaró $20,234.00 cuando la semana 24 ya había publicado $35,127.00 de ese mismo octubre, '
      + 'con Jason de México dentro. ESTE corte es el acumulado real del mes, y los anteriores no se '
      + 'comparan entre sí. '
      + '③ EL CUBO DE CANCELACIONES COINCIDE EN CONTEO CON LOS NOMBRES VIEJOS, PERO NO EN DINERO. El '
      + 'cubo son 9 clientes por $14,824.00. Bajo el corte de importe de este top ($2,355.00) quedan '
      + 'exactamente 9 nombres ya publicados por cortes anteriores —ENCAMINO Chat, TP DIGITAL, '
      + 'Quality Orbi, LUNAH ECO-RESORTS, FOBE, Avezado Abogados Penales, Schimer, Cole Majzner '
      + 'arquitectos y Annova Logistics—, pero esos nueve sumaban $7,092.00. Faltan $7,732.00. El '
      + 'conteo cuadra y el importe no, así que NO son los mismos nueve o alguno se reexpresó: por '
      + 'eso la pantalla publica el cubo tal como lo declara el corte y NO nombra a esos nueve. '
      + 'Coincide el número, no la cifra. [[feedback-verificar-antes-asegurar]] '
      + '④ LOS DOWNGRADES DEL MES BAJAN DE DINERO MIENTRAS SUBEN DE CASOS. La semana 24 publicaba '
      + '$31,620.33 en 10 casos; esta trae $31,187.97 en 14. El detalle, en cambio, SUBE: el top pasa '
      + 'de $18,717.97 en 4 casos a $23,417.97 en 6, y el incremento de $4,700.00 son exactamente '
      + 'Hotel Real de Minas ($2,490.00) y Proseso Consultores ($2,210.00) — los otros cuatro repiten '
      + 'importe al centavo. Todo el movimiento está en el cubo, que se encoge de $12,902.36 en 6 '
      + 'casos a $7,770.00 en 8: más casos y menos dinero sin desglosar. Puede ser upsell neteado en '
      + 'esas cuentas, pero el corte no lo dice. Hay que pedir el desglose. '
      + '⑤ LAS DOS TABLAS DE DOWNGRADE NO SE SUMAN NI SE COMPARAN 1:1, Y EL CORTE LO ADVIERTE. Los '
      + 'productos son impacto BRUTO —sólo renglones de «Quita» y «Reduce»— y suman $38,225.97, '
      + 'contra $31,187.97 de pérdida NETA por cliente. La diferencia de $7,038.00 son los productos '
      + 'AÑADIDOS en el mismo evento. Sumar las dos tablas contaría dos veces. '
      + '⑥ LOS PORCENTAJES DE REDUCCIÓN NO SE PUEDEN VERIFICAR. Para reconstruir el 82.8% de Portalia '
      + 'o el 64.4% de TUNALI TEC haría falta su facturación ANTERIOR, y el corte no la publica. Se '
      + 'citan como vienen. Las bases implícitas que salen de dividir (Portalia ≈ $11,781, TUNALI ≈ '
      + '$8,391) son DERIVADAS NUESTRAS y por eso no se publican como dato. '
      + '[[feedback-metricas-derivadas-origen]] '
      + '⑦ «POR VENCER» SIGUE SIENDO UN HUECO DE REGISTRO CON NOMBRE DE TRAMO, y el corte lo repite: '
      + 'agrupa a los clientes «de la tabla de cartera sin fecha de corte registrada aún». Son '
      + '$5,952.00 en 5 clientes, el 2.2% de la cartera —cayó desde $21,138.41 en 6 clientes—. Esas 5 '
      + 'cuentas necesitan fecha de corte en el sistema. En cambio «1 a 7 días = $0.00 en 0 clientes» '
      + 'SÍ es un cero medido: hay tramo, hay importe y hay conteo. No es lo mismo que un hueco. '
      + '[[feedback-cero-sin-medicion]] '
      + '⑧ LA CARTERA POR COBRAR Y LOS SUSPENDIDOS NO SE SUMAN. Una cuenta está suspendida PORQUE no '
      + 'pagó, así que su saldo ya está dentro de los $268,705.50. Sumar los $50,199.34 encima daría '
      + '$318,904.84 de exposición, contando dos veces el mismo dinero. El corte no publica el cruce, '
      + 'así que no se puede cuantificar el solape: se citan por separado. '
      + '⑨ EL HARD SUSPEND SIGUE PESANDO MÁS POR CUENTA QUE EL SOFT, Y SE INVIRTIÓ RESPECTO A LA '
      + 'SEMANA 26. Soft: 21 clientes, $29,852.00, promedio $1,421.52 y 10.7 días. Hard: 12 '
      + 'clientes, $20,347.34, promedio $1,695.61 y 21.7 días. La semana 26 tenía el promedio del '
      + 'soft POR ENCIMA del hard ($1,041.45 contra $773.96); ahora es al revés. Las cuentas que '
      + 'llegan a hard suspend ya no son las más pequeñas, y siguen llevando el doble de días '
      + 'paradas. Doce cuentas grandes a 21.7 días de impago es donde está el riesgo, no en el '
      + 'volumen. '
      + '⑩ LO QUE SÍ CUADRA, al centavo: soft + hard contra su total ($50,199.34) y sus 33 clientes; '
      + 'los cinco tramos de cartera contra $268,705.50 y sus 208 clientes; las 11 cancelaciones '
      + 'detalladas contra $60,471.50 y contra el 80.3% declarado —reconstruido dividiendo, no '
      + 'copiado—; el top 6 de downgrades contra $23,417.97; los seis productos contra $38,225.97; y '
      + 'el acumulado del año contra la suma 19.4% + 7.4%. '
      + '⑪ LO QUE NO SE PUEDE RECONSTRUIR: el correo no publica la base de MRR de cada mes, así que '
      + '2.1%, 2.5% y 7.4% se citan como vienen y no se verifican dividiendo. Tampoco publica el '
      + 'acumulado histórico facturado de las cuentas canceladas, así que el valor de vida de lo '
      + 'perdido no se conoce: los $75,295.50 son MRR, no lo que esos veinte clientes dejaron de '
      + 'facturar en toda su relación. Y agosto (2.1%) no viene en este corte: se conserva de la '
      + 'serie de las semanas 25 y 26. [[feedback-metricas-derivadas-origen]]',
  },

  /* ── CARTERA POR COBRAR ─────────────────────────────────────────────────
     Lo que de verdad está pendiente de cobro, y por eso ocupa el bloque que la
     pantalla rotula «Pendiente de Facturar». El corte no da detalle por
     cliente: sólo los cinco tramos. 208 clientes, $268,705.50 ✓

     EL TOTAL ES LA SUMA DE LOS RENGLONES, no los $272,319.60 que el propio
     corte dice que reporta el documento fuente: esa cifra es, al centavo, la
     cartera de la semana 25 — un total arrastrado. Ver la observación ① de la
     nota. [[feedback-tablas-deben-cerrar]]

     «Por vencer» NO es deuda joven: el propio corte aclara que son los clientes
     SIN FECHA DE CORTE REGISTRADA. Es un hueco de registro, y así se rotula. */
  pendientesTotalReal:   268705.50,
  pendientesCuentasReal: 208,
  /* Esto es SALDO VENCIDO, no la cartera activa. La activa del mismo corte son
     $120,148.01 (ver el Top 5 en la nota). Atlas lo rotulaba «Cartera en
     Activo» por omisión. */
  pendientesEtiqueta: 'Cartera POR COBRAR (saldo vencido, NO la cartera activa — la activa del corte son $120,148.01)',
  pendientes: [
    { cliente: 'Por vencer — 5 clientes. OJO: el corte aclara que agrupa a los clientes «sin fecha de corte registrada aún». NO es deuda todavía no vencida: es un HUECO DE REGISTRO. Esas 5 cuentas necesitan fecha de corte en el sistema.', monto: 5952.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '1 a 7 días vencido — 0 clientes. ESTE SÍ ES UN CERO MEDIDO: hay tramo, importe y conteo. Se vació por completo desde los $307,946.40 en 218 cuentas de hace seis días — ese dinero se cobró o envejeció al tramo siguiente.', monto: 0.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '8 a 15 días vencido — 145 clientes. El 77.4% de la cartera por cobrar. Sube desde $88,958.84 en 56 cuentas: es la ola de facturación de la semana pasada, un tramo más vieja.', monto: 208046.71, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '16 a 30 días vencido — 41 clientes. El último tramo antes del que antecede a la suspensión. Baja desde $74,798.35 en 76 cuentas.', monto: 43568.34, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '⚠️ Más de 30 días — 17 clientes. SE DUPLICA: hace seis días eran $5,099.00 en 7 clientes. Es el ÚNICO tramo que empeora en un corte donde toda la cobranza mejora, y es el que históricamente antecede a la suspensión. Estas 17 cuentas son la lista de llamadas de la semana.', monto: 11138.45, mesesActivo: 0, ultimaFactura: '—' },
  ],

  antiguedadSaldos: [
    { rango: 'Por vencer (sin fecha de corte)', monto:   5952.00 },
    { rango: '1 – 7 días vencido',              monto:      0.00 },
    { rango: '8 – 15 días vencido',             monto: 208046.71 },
    { rango: '16 – 30 días vencido',            monto:  43568.34 },
    { rango: 'Más de 30 días',                  monto:  11138.45 },
  ],

  /* ── LAS CANCELACIONES DE OCTUBRE ───────────────────────────────────────
     El corte declara $75,295.50 en VEINTE clientes y detalla las ONCE mayores,
     que suman $60,471.50 ✓ — el 80.3% declarado, reconstruido dividiendo. La
     última fila es el cubo de cierre: sin ella la tabla publicaría once bajas
     donde hay veinte. [[feedback-tablas-deben-cerrar]]

     ES LA PRIMERA LECTURA COMPLETA DEL MES: la unión de los cuatro cortes de
     octubre son exactamente estos 20 nombres, y los nueve que repiten vienen al
     mismo importe. Ver la observación ② de la nota.

     Los motivos no vienen en ESTE corte; los que se citan los publicó la semana
     24 o la 26 para la misma cuenta y el mismo importe, y así se dice.

     `acumulado` va en 0 porque el corte NO publica el histórico facturado: es
     «no reportado», no «cero». [[feedback-cero-sin-medicion]] */
  canceladosCasosReal: 20,
  cancelados: [
    { cliente: '🔴 Jason de México — CUENTA TOP. La mayor baja del mes: el 22.9% de todo lo cancelado en octubre, con 43 meses de relación. La semana 24 publicaba el motivo: MIGRACIÓN A OTRO PROVEEDOR. No se apagó por poco uso — se la llevó alguien más, y a una cuenta TOP eso se escala. Acumulado histórico no publicado por el corte.', mrr: 17225.00, mesesActivo: 43, acumulado: 0 },
    { cliente: 'KOMBITEC — 73 meses, más de seis años. La semana 24 publicaba el motivo: MIGRACIÓN A OTRO PROVEEDOR. Con Jason de México son el 34.2% de lo cancelado del mes y las dos se fueron con la competencia. Acumulado no publicado.', mrr: 8539.00, mesesActivo: 73, acumulado: 0 },
    { cliente: 'Biolaboratorio Sadat — 56 meses (4 años y 8 meses). La semana 26 publicaba el motivo: «Sin Respuesta» — se perdió por falta de contacto, no por fallo de servicio. Eso es trabajo de SAC. Acumulado no publicado.', mrr: 7184.00, mesesActivo: 56, acumulado: 0 },
    { cliente: 'SOBERANI — 8 meses. NOMBRE NUEVO: ninguno de los tres cortes anteriores de octubre la traía. El corte no publica el motivo. Acumulado no publicado.', mrr: 5235.00, mesesActivo: 8, acumulado: 0 },
    { cliente: 'Grupo Turístico Rumbo S de RL de CV — 6 meses. VUELVE: la semana 25 la reportaba y la semana 26 la perdió de vista; lo marcamos entonces como pregunta abierta. Aquí está, al mismo importe. No se había recuperado: se había caído del top por importe. Acumulado no publicado.', mrr: 4349.00, mesesActivo: 6, acumulado: 0 },
    { cliente: 'UAXI Tecnología — 8 meses. La semana 26 publicaba el motivo: «Limitaciones del servicio», el único motivo de PRODUCTO de ese corte. Es el que hay que llevar a Producto con nombre y apellido. Acumulado no publicado.', mrr: 4041.00, mesesActivo: 8, acumulado: 0 },
    { cliente: 'enMazatlan — 73 MESES, seis años y un mes. La semana 26 publicaba el motivo: «Sin Respuesta». A un cliente de seis años no se le deja ir sin que nadie lo localice. Acumulado no publicado.', mrr: 3480.00, mesesActivo: 73, acumulado: 0 },
    { cliente: 'WhatsHome — 71 meses. La semana 24 publicaba el motivo: Restructuración. Tercera cuenta de más de cinco años que sale en el mes. Acumulado no publicado.', mrr: 3250.00, mesesActivo: 71, acumulado: 0 },
    { cliente: 'ZD · The Palms — 3 MESES, la salida más temprana del corte. NOMBRE NUEVO. El corte no publica el motivo, y a los tres meses eso es justo lo que hay que saber. Acumulado no publicado.', mrr: 2454.00, mesesActivo: 3, acumulado: 0 },
    { cliente: 'PSI División Latinoamérica — 21 meses. VUELVE, igual que Grupo Turístico Rumbo: la reportaba la semana 25, la semana 26 la perdió de vista y aquí está al mismo importe. Acumulado no publicado.', mrr: 2359.50, mesesActivo: 21, acumulado: 0 },
    { cliente: 'ZD · Grupo Gira — 5 meses. La semana 26 publicaba el motivo: «Finalización de contrato con el cliente» — el contrato tenía fin, no es un fallo de servicio. Segunda cuenta «ZD ·» del mes. Acumulado no publicado.', mrr: 2355.00, mesesActivo: 5, acumulado: 0 },
    { cliente: '+ Resto de cancelaciones del mes — 9 clientes que el corte NO desglosa. Esta fila existe para que la tabla cuadre con los $75,295.50 declarados en 20 clientes: el top detalla $60,471.50, el 80.3%. OJO: bajo el corte de $2,355.00 quedan exactamente 9 nombres ya publicados por cortes anteriores, pero sumaban $7,092.00 y el cubo vale $14,824.00 — coincide el conteo, no la cifra, así que NO se nombran. Faltan $7,732.00 por explicar.', mrr: 14824.00, mesesActivo: 0, acumulado: 0 },
  ],

  /* ── DOWNGRADES DE OCTUBRE ──────────────────────────────────────────────
     VUELVEN A MEDIRSE. La semana 26 decía «no hay downgrades significativos»
     sin cifra y lo marcamos como no medido; este corte trae $31,187.97 en 14
     clientes y detalla los 6 mayores, que suman $23,417.97 ✓ — el 75.1%.

     Los cuatro primeros repiten AL CENTAVO los que publicó la semana 24, y el
     incremento del top ($4,700.00) son exactamente Hotel Real de Minas y
     Proseso Consultores. Pero el total del mes BAJA de $31,620.33 a $31,187.97
     mientras los casos suben de 10 a 14: todo el movimiento está en el cubo.
     Ver la observación ④ de la nota.

     Los % de reducción se citan COMO VIENEN: reconstruirlos exigiría la
     facturación anterior de cada cuenta y el corte no la publica.
     [[feedback-metricas-derivadas-origen]] */
  downgradeTotalReal: 31187.97,
  downgradeCasosReal: 14,
  downgrades: [
    { cliente: '🔴 Portalia — TOP', perdida: 9754.97, nota: 'PIERDE EL 82.8% DE LO QUE FACTURABA, y es el 31.3% de todo el ingreso perdido por reducción del mes. Mismo importe al centavo que publicó la semana 24, donde el movimiento era doble: quita Extension VyC y recorta el paquete de minutos de Voicebot de $3,000 a $1,000. Una cuenta que se queda con el 17% de su contrato está más cerca de una baja que de un cliente activo.' },
    { cliente: 'TUNALI TEC', perdida: 5404.00, nota: '64.4% de reducción. Mismo importe que la semana 24, que detallaba el movimiento: quita DiD Nacional y paquete Min VyC, pero AÑADE Agente CP Chat. Es el caso que explica por qué la tabla de productos (bruta, $38,225.97) no cuadra con el total neto ($31,187.97).' },
    { cliente: 'Hotel Real de Minas San Miguel de Allende', perdida: 2490.00, nota: '48% de reducción. ENTRA NUEVO al top: no estaba en la semana 24. Con Proseso Consultores son los $4,700.00 que explican todo el aumento del detalle.' },
    { cliente: 'Proseso Consultores', perdida: 2210.00, nota: '81% de reducción — el segundo porcentaje más alto del corte después de Portalia. ENTRA NUEVO al top. Un 81% menos es churn silencioso: la cuenta sigue viva y ya casi no factura.' },
    { cliente: 'Corporativo Grupo Funerario San Javier', perdida: 1959.00, nota: '44.4% de reducción. Mismo importe que la semana 24, que detallaba: quita el paquete Min VyC.' },
    { cliente: 'Grupo Guía', perdida: 1600.00, nota: '25% de reducción, la menor del top. Mismo importe que la semana 24, que detallaba: reduce DiD Nacional y paquete Min VyC.' },
    { cliente: '+ Resto de los downgrades de octubre', perdida: 7770.00, nota: '⚠ CUBO DE CIERRE. Son 14 los casos del mes y el corte sólo detalla los 6 mayores ($23,417.97, el 75.1%). Sin esta fila el top se leería como todo el downgrade de octubre. OJO: este cubo se ENCOGIÓ respecto a la semana 24, que publicaba $12,902.36 en 6 casos — más casos y menos dinero sin desglosar. Hay que pedir el desglose.' },
  ],

  /* Impacto BRUTO por producto: lo que se quitó o redujo en cada caso, SIN
     netear los upsells de la misma cuenta. Suma $38,225.97 ✓ contra los
     $31,187.97 de pérdida neta, y el propio corte advierte que no coinciden
     1:1 — la diferencia de $7,038.00 son los productos AÑADIDOS en el mismo
     evento. NO se suman las dos tablas. [[feedback-tablas-deben-cerrar]]

     `vecesAfectado` SÍ viene en este corte. Los nombres de cliente por artículo
     NO: la columna lo dice con palabras en vez de quedarse vacía.
     [[feedback-contexto-ia-sin-huecos]] */
  downgradeArticulos: [
    { articulo: 'paquete Min VyC — $18,664.00',        vecesAfectado: 9, clientes: ['El artículo más golpeado del mes: 9 de los 14 casos y el 48.8% del impacto bruto. (El corte no desglosa los clientes por artículo.)'] },
    { articulo: 'Extension VyC — $12,400.97',          vecesAfectado: 3, clientes: ['Sólo 3 casos pero el segundo importe del mes: Portalia se lleva la mayor parte. (El corte no desglosa los clientes por artículo.)'] },
    { articulo: 'paquete Min CE — $3,239.00',          vecesAfectado: 2, clientes: ['(El corte no desglosa los clientes por artículo.)'] },
    { articulo: 'paquete Min Voicebot — $2,000.00',    vecesAfectado: 1, clientes: ['Un solo caso, el mismo importe que publicó la semana 24: Portalia, de $3,000 a $1,000. (El corte no desglosa los clientes por artículo.)'] },
    { articulo: 'DiD Nacional — $1,796.00',            vecesAfectado: 5, clientes: ['El segundo más repetido y el de menor importe por caso: $359.20 de media. (El corte no desglosa los clientes por artículo.)'] },
    { articulo: 'DiD Internacional — $126.00',         vecesAfectado: 1, clientes: ['El menor impacto del corte y la primera vez que aparece este artículo. (El corte no desglosa los clientes por artículo.)'] },
  ],

  /* ── SOFT / HARD SUSPEND DE OCTUBRE ─────────────────────────────────────
     33 clientes, $50,199.34 ✓. El corte da los dos estatus agregados, con su
     promedio de días pendientes; no desglosa por cliente.

     SE INVIRTIÓ LA RELACIÓN DE LA SEMANA 26: entonces el soft pesaba más por
     cuenta que el hard ($1,041.45 contra $773.96); ahora es al revés. Ver la
     observación ⑨ de la nota. */
  suspendidosTotalReal:   50199.34,
  suspendidosCuentasReal: 33,
  suspendidos: [
    { cliente: 'Soft Suspend — 21 clientes · 10.7 días promedio pendientes de pago · $1,421.52 por cuenta. Es donde todavía se puede cobrar sin cortar servicio, y lleva la MITAD de días paradas que el hard. Bajó desde 35 clientes hace seis días.', importe: 29852.00, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Hard Suspend — 12 clientes · 21.7 días promedio pendientes de pago · $1,695.61 por cuenta. Servicio activo con restricciones: sin baja autorizada NO es churn. AHORA PESAN MÁS POR CUENTA QUE EL SOFT —la semana 26 era al revés—: doce cuentas grandes a 21.7 días de impago es donde está el riesgo.', importe: 20347.34, mesesActivo: 0, estado: 'Suspendido' },
  ],
}
