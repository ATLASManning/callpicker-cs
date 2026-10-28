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
   REPORTE SEMANAL — SEMANA 26 · AVANCE DE OCTUBRE
   Al 27 de octubre de 2026. Remitente: Valeria Zepeda Hernández (equipo Data).

   MAPEO, el mismo que fijó el corte de la semana 24 — el rótulo manda:
     · «Cartera por Cobrar» por antigüedad .......... pendientes + antiguedadSaldos
     · «Cancelaciones» .............................. cancelados (+ cubo de cierre)
     · «Downgrades» ................................. NINGUNO — ver abajo
     · «Resumen Soft / Hard Suspend» ................ suspendidos
     · «Top 5 · Clientes Activos» ................... NINGUNO — va en la nota,
       porque la cartera activa es lo que SÍ factura y el bloque de pendientes
       la rotularía «riesgo inmediato». [[feedback-kpi-con-fuente]]

   CONCILIADO CON `scripts/concilia-churn-s26.py`. Cierra TODO lo interno:
     · soft + hard suspend suman $58,121.84 y 63 clientes ✓
     · los cinco tramos de cartera suman $497,941.00 y 363 clientes ✓
     · el acumulado sale de sumar: 19.4% + 12.4% = 31.8% ✓

   DOS TABLAS NO CIERRAN SOLAS Y LLEVAN CUBO:
     · cancelaciones — el corte declara $20,234.00 en 11 clientes y detalla un
       TOP 5 de $18,039.00. Faltan $2,195.00 en 6 clientes.
     · top de activos — cinco de $68,554.40 sobre una cartera de $206,983.42,
       el 33.1%. El resto no se desglosa y el corte ya no dice cuántos clientes
       son (el anterior decía 26).

   DOWNGRADES: EL CORTE NO LOS MIDE. Dice textualmente «No hay downgrades
   significativos en la semana», que es un JUICIO y además habla de la SEMANA
   mientras el resto del corte habla del MES — y la semana 25 reportó cuatro por
   $6,038.00 EN ESE MISMO MES. Por eso `downgradeTotalReal` va SIN DEFINIR y la
   lista vacía: la pantalla escribe «no reportado» en vez de $0.00.
   [[feedback-cero-sin-medicion]]

   Y OJO CON EL 12.4% DE OCTUBRE: sigue siendo mes vivo. Ya se desinfló desde el
   22.1% de hace seis días, exactamente como septiembre. [[regla-churn-mes-vencido]]
   ═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S26_OCT_2026: ChurnReporte = {
  id:      's26-octubre-2026',
  periodo: 'Semana 26 · Oct 2026',
  fecha:   '27/10/2026',
  notas:   'Gross Revenue Churn · Semana 26. Al 27 de octubre del 2026. Avance del mes: Top 5 de '
         + 'clientes activos sobre una cartera de $206,983.42, resumen de soft y hard suspend —63 '
         + 'clientes, $58,121.84—, 11 cancelaciones por $20,234.00 de las que se detallan 5, y la '
         + 'cartera por cobrar por antigüedad: 363 clientes, $497,941.00. Octubre BAJA de 22.1% a '
         + '12.4% en seis días y sigue marcado MES CORRIENDO y NO DEFINITIVO; el acumulado del año '
         + 'baja con él, de 41.6% a 31.8%. El corte NO cuantifica downgrades: los llama «no '
         + 'significativos» sin cifra. Próxima revisión: miércoles 3 de noviembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 3 de noviembre.',

  grc: {
    evolucion: [
      { mes: 'Agosto',     pct: 2.1 },
      { mes: 'Septiembre', pct: 2.5, anterior: 2.6 },
      { mes: 'Octubre',    pct: 12.4, anterior: 22.1 },
    ],
    acumulado: 31.8,
    anterior:  41.6,
    acumuladoEtiqueta: '2026 acumulado hasta octubre · NO DEFINITIVO',
    notaClave:
      'Avance de octubre. El mes BAJA de 22.1% a 12.4% en seis días y el acumulado del año baja con '
      + 'él, de 41.6% a 31.8%, LAS DOS MARCADAS NO DEFINITIVAS por el propio reporte. Octubre lleva '
      + '$20,234.00 en once cancelaciones y 63 clientes suspendidos por $58,121.84, pero la cifra '
      + 'gorda sigue siendo la cartera por cobrar: $497,941.00 en 363 clientes, con $307,946.40 —el '
      + '61.8%— a menos de una semana de vencer. La cartera activa del mes son $206,983.42. Los '
      + 'downgrades NO vienen cuantificados.',
    notaEspecial:
      '✅ EL MES VIVO SE ESTÁ DESINFLANDO, TAL Y COMO ESTABA PREVISTO. Octubre pasa de 22.1% a 12.4% '
      + 'en seis días: una caída de 9.7 puntos, el 43.9% de la lectura anterior. Es el mismo '
      + 'recorrido que hizo septiembre (23.6% → 6.9% → 3.14% → 2.6% → 2.5%), y la semana 25 lo dejó '
      + 'escrito antes de que pasara. SIGUE SIENDO MES CORRIENDO: el 12.4% tampoco es el cierre, y a '
      + 'este ritmo le quedan varias lecturas por bajar. El mes vivo NO mide bajas, mide retraso de '
      + 'cobranza, y se recupera con pagos. [[regla-churn-mes-vencido]] '
      + '📌 EL ACUMULADO BAJA, Y ESO ES CORRECTO: 19.4% (hasta septiembre) + 12.4% (octubre) = 31.8%, '
      + 'exactamente lo declarado. Como el acumulado se construye SUMANDO el mes vivo, hereda entero '
      + 'su desinflado: de 41.6% a 31.8% sin que se haya recuperado ni una sola cuenta — sólo cambió '
      + 'la lectura de octubre. Un acumulado que baja no es una buena noticia operativa: es la misma '
      + 'cifra provisional corrigiéndose. '
      + '✔️ Y SE CORRIGIÓ LA BASE QUE MARCAMOS LA SEMANA PASADA: la semana 25 sumaba sobre 19.5% '
      + 'cuando septiembre ya se había reexpresado a 2.5%, así que la base debía ser 19.4%. Este '
      + 'corte YA usa 19.4%. Queda arreglado en el origen. '
      + '🚫 ESTE CORTE NO MIDE LOS DOWNGRADES. Dice «no hay downgrades significativos en la semana», '
      + 'y eso NO es un cero: es un juicio sin cifra, y además habla de la SEMANA mientras todo lo '
      + 'demás del corte habla del MES. La semana 25 reportó CUATRO downgrades por $6,038.00 en ese '
      + 'mismo octubre. Publicar «$0.00 en downgrades» afirmaría que no hubo ninguno en el mes, que '
      + 'es falso según el corte anterior. La pantalla escribe «no reportado». Hay que pedir la cifra '
      + 'del mes. [[feedback-cero-sin-medicion]] '
      + '🏆 TOP 5 DE CLIENTES ACTIVOS, sobre una cartera de $206,983.42: FabricAir Latin America '
      + '$15,186.41 (68 meses) · ATP Sofom $14,848.97 (27) · ABRL Sistemas & Proyectos $14,665.00 '
      + '(83) · SW Sapien $13,668.02 (49) · Inverdental $10,186.00 (75). Los cinco suman $68,554.40, '
      + 'el 33.1%: los otros $138,429.02 no se desglosan, y este corte YA NO DICE cuántos clientes '
      + 'son (el anterior decía 26). No se arrastra el conteo viejo. '
      + '⏳ TRES DE LOS CINCO MAYORES PASAN DE SEIS AÑOS: ABRL 83 meses, Inverdental 75, FabricAir 68. '
      + 'Las relaciones más largas del corte están en el lado que factura, no en el que se va — con '
      + 'una excepción grave, ver abajo. '
      + '💀 LAS CANCELACIONES SE TRIPLICAN: $20,234.00 en ONCE clientes, contra $6,708.50 en dos de '
      + 'la semana 25 (+201.6%). Y el motivo dominante no es el producto: de los cinco detallados, '
      + 'TRES se van por «Sin Respuesta» —Biolaboratorio Sadat $7,184.00 (56 meses), enMazatlan '
      + '$3,480.00 (73 meses) y Quality Orbi $979.00 (40 meses)— que suman $11,643.00, el 64.5% de lo '
      + 'detallado. Son 169 meses de relación acumulada que se pierden por falta de contacto, no por '
      + 'fallo de servicio. ESO ES TRABAJO DE SAC, no de producto. '
      + '🔥 enMAZATLAN LLEVABA 73 MESES — seis años y un mes — y se va «Sin Respuesta». Es la '
      + 'relación más larga que pierde el corte, y la que peor se ve: a un cliente de seis años no se '
      + 'le deja ir sin que nadie lo localice. '
      + '🆕 DOS CUENTAS JÓVENES SE VAN POR MOTIVOS DISTINTOS: UAXI Tecnología $4,041.00 a los 8 meses '
      + 'por «Limitaciones del servicio» —el único motivo de producto de los cinco, y el que hay que '
      + 'llevar a Producto— y ZD · Grupo Gira $2,355.00 a los 5 meses por «Finalización de contrato», '
      + 'que no es un fallo. '
      + '💰 LA CARTERA POR COBRAR SE DUPLICA: $497,941.00 en 363 clientes, contra $272,319.60 en 173 '
      + 'hace seis días (+82.9%, y los clientes pasan de 173 a 363). Sigue siendo casi toda reciente: '
      + '$307,946.40 en 218 clientes lleva entre 1 y 7 días, el 61.8% del total. '
      + '⚠️ REAPARECE EL TRAMO DE MÁS DE 30 DÍAS. La semana 25 lo publicaba en CERO con cero '
      + 'clientes; este corte trae $5,099.00 en SIETE clientes. Es poco dinero —el 1.0%— pero es el '
      + 'tramo que históricamente antecede a la suspensión, y pasar de 0 a 7 cuentas en seis días es '
      + 'la señal, no el importe. Esas siete cuentas son la lista de llamadas de esta semana. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas y contra '
      + 'el de hace seis días, con `scripts/concilia-churn-s26.py`. No corrige ninguna cifra '
      + 'publicada. '
      + '① «POR VENCER» YA NO SIGNIFICA LO QUE SIGNIFICABA, Y EL PROPIO CORTE LO ACLARA: agrupa a los '
      + 'clientes «de la tabla de cartera sin fecha de corte registrada aún». O sea que NO es deuda '
      + 'joven todavía no vencida: es un HUECO DE REGISTRO con nombre de tramo. Son $21,138.41 en 6 '
      + 'clientes, el 4.2% de la cartera. La semana 24 publicaba un «Por vencer» que sí era un cero '
      + 'medido, y la 25 no traía el tramo. Tres cortes, tres significados distintos del mismo '
      + 'rótulo: no se comparan entre sí. Y esos 6 clientes necesitan fecha de corte en el sistema. '
      + '[[feedback-cero-sin-medicion]] '
      + '② LAS DOS CANCELACIONES DE LA SEMANA 25 NO ESTÁN EN ESTE TOP 5, Y DEBERÍAN. Grupo Turístico '
      + 'Rumbo ($4,349.00) entraría como la #2 por importe y PSI División Latinoamérica ($2,359.50) '
      + 'como la #4 — las dos por encima de Quality Orbi ($979.00), que sí aparece. Si siguieran '
      + 'contadas en octubre, estarían en la lista. O se recuperaron, o se reclasificaron, o salieron '
      + 'del mes. HAY QUE PREGUNTARLO: es exactamente el patrón de la cuenta que se da por perdida y '
      + 'luego factura. [[polak-grupo-no-es-churn]] '
      + '③ LA CARTERA POR COBRAR Y LOS SUSPENDIDOS NO SE SUMAN. Una cuenta está suspendida PORQUE no '
      + 'pagó, así que su saldo ya está dentro de los $497,941.00 de la cartera. Sumar los $58,121.84 '
      + 'encima daría $556,062.84 de exposición, contando dos veces el mismo dinero. El corte no '
      + 'publica el cruce, así que no se puede cuantificar el solape: se citan por separado. '
      + '④ EL TOP DE ACTIVOS CAMBIA ENTERO POR TERCERA VEZ CONSECUTIVA. Ninguno de HomiRent, MKG, CS7, '
      + 'LI FINANCIERA ni SIMAGASMEX —los cinco de la semana 25— aparece ahora; y los de la 25 ya '
      + 'habían reemplazado enteros a los de la 24. Tres cortes, quince nombres, cero repeticiones. '
      + 'Con la cartera activa subiendo un 60.9% ($128,640.37 → $206,983.42) al mismo tiempo, esto no '
      + 'parece rotación de clientes: parece que la consulta cambia de población entre cortes. MISMA '
      + 'PREGUNTA QUE LA SEMANA PASADA, y sigue sin respuesta. Mientras no la haya, el Top de activos '
      + 'NO sirve para seguimiento semanal — sólo como foto del día. '
      + '⑤ EL SOFT SUSPEND PESA MÁS POR CUENTA QUE EL HARD. Soft: 35 clientes, $36,450.84, promedio '
      + '$1,041.45 y 11.1 días pendientes. Hard: 28 clientes, $21,671.00, promedio $773.96 y 21.0 '
      + 'días. Las cuentas que llegan a hard suspend son las MÁS PEQUEÑAS, y las grandes se quedan en '
      + 'soft el doble de poco tiempo. Eso es coherente con que a las grandes se les atiende antes, y '
      + 'significa que el hard suspend no es el sitio donde buscar el dinero: está en los 35 del '
      + 'soft, que es donde todavía se puede cobrar sin cortar. '
      + '⑥ LOS SUSPENDIDOS SE CUADRUPLICAN EN SEIS DÍAS: de 16 clientes y $26,949.28 a 63 y '
      + '$58,121.84 (+115.7% en dinero, +293.8% en cuentas). Con la cartera por cobrar duplicándose '
      + 'al mismo tiempo, el patrón es consistente: entró una facturación grande y la cobranza va '
      + 'detrás. No es lo mismo que churn, pero sí es el embudo que lo alimenta. '
      + '⑦ LO QUE SÍ CUADRA, al centavo: soft + hard suspend contra su total ($58,121.84) y sus 63 '
      + 'clientes; los cinco tramos de cartera contra $497,941.00 y sus 363 clientes; y el acumulado '
      + 'del año contra la suma 19.4% + 12.4%. '
      + '⑧ LO QUE NO SE PUEDE RECONSTRUIR: el correo no publica la base de MRR de cada mes, así que '
      + '2.1%, 2.5% y 12.4% se citan como vienen y no se verifican dividiendo. Tampoco publica el '
      + 'acumulado histórico facturado de las cuentas canceladas, así que el valor de vida de lo que '
      + 'se perdió no se conoce: los $20,234.00 son MRR, no lo que esos once clientes dejaron de '
      + 'facturar en toda su relación. [[feedback-metricas-derivadas-origen]]',
  },

  /* ── CARTERA POR COBRAR ─────────────────────────────────────────────────
     Lo que de verdad está pendiente de cobro, y por eso ocupa el bloque que la
     pantalla rotula «Pendiente de Facturar». El corte no da detalle por
     cliente: sólo los cinco tramos. 363 clientes, $497,941.00 ✓

     «Por vencer» NO es deuda joven: el propio corte aclara que son los clientes
     SIN FECHA DE CORTE REGISTRADA. Es un hueco de registro, y así se rotula. */
  pendientesTotalReal:   497941.00,
  pendientesCuentasReal: 363,
  /* Esto es SALDO VENCIDO, no la cartera activa. La activa del mismo corte son
     $206,983.42 (ver el Top 5 en la nota): menos de la mitad, y significa lo
     contrario. Atlas lo rotulaba «Cartera en Activo» por omisión. */
  pendientesEtiqueta: 'Cartera POR COBRAR (saldo vencido, NO la cartera activa — la activa del corte son $206,983.42)',
  pendientes: [
    { cliente: 'Por vencer — 6 clientes. OJO: el corte aclara que agrupa a los clientes «sin fecha de corte registrada aún». NO es deuda todavía no vencida: es un HUECO DE REGISTRO. Esas 6 cuentas necesitan fecha de corte en el sistema.', monto: 21138.41, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '1 a 7 días vencido — 218 clientes. El 61.8% de la cartera por cobrar, y lo más reciente que hay: esto es cobranza del día, no deuda.', monto: 307946.40, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '8 a 15 días vencido — 56 clientes.',                                                                                                   monto:  88958.84, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '16 a 30 días vencido — 76 clientes. El último tramo antes del que antecede a la suspensión.',                                           monto:  74798.35, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '⚠️ Más de 30 días — 7 clientes. REAPARECE: la semana 25 lo publicaba en CERO con cero clientes. Es poco dinero, el 1.0%, pero es el tramo que históricamente antecede a la suspensión. Estas 7 cuentas son la lista de llamadas de la semana.', monto: 5099.00, mesesActivo: 0, ultimaFactura: '—' },
  ],

  antiguedadSaldos: [
    { rango: 'Por vencer (sin fecha de corte)', monto:  21138.41 },
    { rango: '1 – 7 días vencido',              monto: 307946.40 },
    { rango: '8 – 15 días vencido',             monto:  88958.84 },
    { rango: '16 – 30 días vencido',            monto:  74798.35 },
    { rango: 'Más de 30 días',                  monto:   5099.00 },
  ],

  /* ── LAS CANCELACIONES DE OCTUBRE ───────────────────────────────────────
     El corte declara $20,234.00 en ONCE clientes y detalla un TOP 5 de
     $18,039.00 ✓. La última fila es el cubo de cierre: sin ella la tabla
     publicaría cinco bajas donde hay once. [[feedback-tablas-deben-cerrar]]

     `acumulado` va en 0 porque el corte NO publica el histórico facturado: es
     «no reportado», no «cero». [[feedback-cero-sin-medicion]] */
  canceladosCasosReal: 11,
  cancelados: [
    { cliente: 'Biolaboratorio Sadat — «Sin Respuesta». La mayor baja del mes y 56 meses de relación (4 años y 8 meses) perdidos por falta de contacto, no por fallo de servicio. Acumulado histórico no publicado por el corte.', mrr: 7184.00, mesesActivo: 56, acumulado: 0 },
    { cliente: 'UAXI Tecnología — «Limitaciones del servicio». EL ÚNICO MOTIVO DE PRODUCTO de los cinco detallados, y a los 8 meses: es el que hay que llevar a Producto con nombre y apellido. Acumulado no publicado.', mrr: 4041.00, mesesActivo: 8, acumulado: 0 },
    { cliente: 'enMazatlan — «Sin Respuesta». 73 MESES, seis años y un mes: la relación más larga que pierde el corte, y se va porque nadie la localizó. Acumulado no publicado.', mrr: 3480.00, mesesActivo: 73, acumulado: 0 },
    { cliente: 'ZD · Grupo Gira — «Finalización de contrato con el cliente». 5 meses; el contrato tenía fin, no es un fallo de servicio. Acumulado no publicado.', mrr: 2355.00, mesesActivo: 5, acumulado: 0 },
    { cliente: 'Quality Orbi — «Sin Respuesta». 40 meses de relación. La tercera del mes por el mismo motivo. Acumulado no publicado.', mrr: 979.00, mesesActivo: 40, acumulado: 0 },
    { cliente: '+ Resto de cancelaciones del mes — 6 clientes que el corte NO desglosa. Esta fila existe para que la tabla cuadre con los $20,234.00 declarados en 11 clientes: el top detalla $18,039.00. No se sabe quiénes son ni por qué se fueron.', mrr: 2195.00, mesesActivo: 0, acumulado: 0 },
  ],

  /* ── DOWNGRADES ─────────────────────────────────────────────────────────
     NO SE REPORTAN. El corte dice «No hay downgrades significativos en la
     semana»: un juicio sin cifra, y sobre la SEMANA cuando el resto del corte
     habla del MES — la semana 25 reportó 4 por $6,038.00 en ese mismo octubre.

     `downgradeTotalReal` y `downgradeCasosReal` van SIN DEFINIR a propósito:
     así la pantalla escribe «no reportado» en vez de $0.00, que se leería como
     que no hubo ninguno. [[feedback-cero-sin-medicion]] */
  downgrades: [],

  /* ── SOFT / HARD SUSPEND DE OCTUBRE ─────────────────────────────────────
     63 clientes, $58,121.84 ✓. El corte da los dos estatus agregados, con su
     promedio de días pendientes; no desglosa por cliente. */
  suspendidosTotalReal:   58121.84,
  suspendidosCuentasReal: 63,
  suspendidos: [
    { cliente: 'Soft Suspend — 35 clientes · 11.1 días promedio pendientes de pago · $1,041.45 por cuenta. AQUÍ ESTÁ EL DINERO COBRABLE: son las cuentas MÁS GRANDES y las que llevan menos tiempo paradas. Se puede cobrar sin cortar servicio.', importe: 36450.84, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Hard Suspend — 28 clientes · 21.0 días promedio pendientes de pago · $773.96 por cuenta. Servicio activo con restricciones: sin baja autorizada NO es churn. Son las cuentas más pequeñas y las que llevan el doble de días paradas.', importe: 21671.00, mesesActivo: 0, estado: 'Suspendido' },
  ],
}
