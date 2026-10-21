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
   REPORTE SEMANAL — SEMANA 25 · AVANCE DE OCTUBRE
   Al 21 de octubre de 2026. Remitente: Valeria Zepeda Hernández (equipo Data).

   MAPEO, el mismo que fijó el corte anterior — el rótulo manda, no la costumbre:
     · «Cartera por Cobrar» por antigüedad .......... pendientes + antiguedadSaldos
     · «Cancelaciones» .............................. cancelados
     · «Downgrades» ................................. downgrades
     · «Resumen Soft / Hard Suspend» ................ suspendidos
     · «Top 5 · Clientes Activos» ................... NINGUNO — va en la nota,
       porque la cartera activa es lo que SÍ factura y el bloque de pendientes
       la rotularía «riesgo inmediato». [[feedback-kpi-con-fuente]]

   CONCILIADO CON `scripts/concilia-churn-s25.py`. Cierra TODO lo interno:
     · las 2 cancelaciones suman $6,708.50 ✓
     · soft + hard suspend suman $26,949.28 y 16 clientes ✓
     · los tramos de cartera suman $272,319.60 y 173 clientes ✓
     · los 4 downgrades suman $6,038.00 ✓ — y es la lista COMPLETA, no un top

   LO QUE NO CUADRA ES CONTRA EL CORTE ANTERIOR, cinco días antes, y eso se
   pregunta, no se arregla:
     · cartera activa      $408,857.69 → $128,640.37   (−68.5%)
     · cartera por cobrar   $51,042.30 → $272,319.60   (+433.5%, de 45 a 173)
     · y los CINCO del Top de activos cambian enteros: ninguno se repite.
   Con eso, la cartera por cobrar es MÁS DEL DOBLE que la activa, que es al
   revés de como se ha visto siempre.

   Y OJO CON EL 22.1% DE OCTUBRE: es la PRIMERA lectura de un mes vivo, y
   septiembre enseñó que esa primera lectura se desinfla hasta la décima parte.
   [[regla-churn-mes-vencido]]
   ═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S25_OCT_2026: ChurnReporte = {
  id:      's25-octubre-2026',
  periodo: 'Semana 25 · Oct 2026',
  fecha:   '21/10/2026',
  notas:   'Gross Revenue Churn · Semana 25. Al 21 de octubre del 2026. Avance del mes: Top 5 de '
         + 'clientes activos sobre una cartera de $128,640.37 en 26 clientes, resumen de soft y hard '
         + 'suspend, las 2 cancelaciones del mes, la cartera por cobrar por antigüedad —173 clientes, '
         + '$272,319.60— y los 4 downgrades. Octubre marca 22.1% pero es MES CORRIENDO y NO '
         + 'DEFINITIVO: es la primera lectura, la misma clase de cifra que en septiembre arrancó en '
         + '23.6% y acabó en 2.5%. Próxima revisión: miércoles 28 de octubre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 28 de octubre.',

  grc: {
    /* El corte ya no publica julio: arranca en agosto. Se respeta lo que trae
       en vez de arrastrar el mes de un corte anterior. */
    evolucion: [
      { mes: 'Agosto',     pct: 2.1 },
      { mes: 'Septiembre', pct: 2.5, anterior: 2.6 },
      { mes: 'Octubre',    pct: 22.1 },
    ],
    acumulado: 41.6,
    anterior:  19.5,
    acumuladoEtiqueta: '2026 acumulado hasta octubre · NO DEFINITIVO',
    notaClave:
      'Avance de octubre. El mes marca 22.1% y el acumulado del año salta de 19.5% a 41.6%, LAS DOS '
      + 'MARCADAS NO DEFINITIVAS por el propio reporte. Octubre lleva $6,708.50 en dos cancelaciones '
      + 'y $6,038.00 en cuatro downgrades, pero la cifra gorda está en la cartera por cobrar: '
      + '$272,319.60 repartidos en 173 clientes, con $177,513.29 —el 65.2%— a menos de una semana de '
      + 'vencer. La cartera activa del mes son $128,640.37 en 26 clientes.',
    notaEspecial:
      '🚨 EL 22.1% DE OCTUBRE ES LA PRIMERA LECTURA DE UN MES VIVO, Y ESA CIFRA SE DESINFLA. '
      + 'Septiembre recorrió 23.6% → 6.9% → 3.14% → 2.6% → 2.5%: de la primera lectura a la que hoy '
      + 'se sostiene hay una DÉCIMA PARTE. Octubre arranca en 22.1%, que es casi exactamente el '
      + '23.6% con el que arrancó septiembre. Quien publique «octubre cerró en 22.1%» va a repetir, '
      + 'palabra por palabra, el error que este módulo lleva cinco cortes documentando: el mes vivo '
      + 'NO mide bajas, mide retraso de cobranza. Se recupera con pagos. [[regla-churn-mes-vencido]] '
      + '📌 EL ACUMULADO DEL AÑO SALE DE SUMAR, no de ponderar: 19.5% (hasta septiembre, semana 24) + '
      + '22.1% (octubre) = 41.6%, que es exactamente lo declarado. O sea que el acumulado hereda '
      + 'ENTERO el 22.1% no definitivo, y se va a desinflar con él. Un detalle que además no casa: '
      + 'septiembre se reexpresó de 2.6% a 2.5%, así que la base debería ser 19.4% y no 19.5%. '
      + '🔻 LAS CANCELACIONES CAEN A DOS, $6,708.50 — un 80.9% menos que los $35,127.00 de la semana '
      + '24. Grupo Turístico Rumbo ($4,349.00, 6 meses) se va porque «no lo usaba», que es la única '
      + 'de las dos sobre la que se podía haber hecho algo: seis meses pagando sin usar el producto '
      + 'es una cuenta que pedía una llamada. PSI División Latinoamérica ($2,359.50, 21 meses) cierra '
      + 'proyecto, que no es un fallo de servicio. '
      + '🏆 TOP 5 DE CLIENTES ACTIVOS, sobre una cartera de $128,640.37 en 26 clientes: HomiRent '
      + '$11,998.00 (52 meses) · MKG $11,283.03 (157) · CS7 $11,073.00 (33) · LI FINANCIERA '
      + '$9,104.00 (11) · SIMAGASMEX $8,272.00 (9). Los cinco suman $51,730.03, el 40.2%: los otros '
      + '$76,910.34 en 21 clientes no se desglosan. Va aquí, en la nota, y NO en el bloque de '
      + '«Pendiente de Facturar»: la cartera activa es lo que SÍ factura, no dinero en riesgo. '
      + '⏳ MKG LLEVA 157 MESES ACTIVO — trece años y un mes. Es, con diferencia, la relación más '
      + 'larga de todo el corte; la siguiente son los 52 de HomiRent. '
      + '💰 LA CARTERA POR COBRAR ES CASI TODA RECIENTE: $177,513.29 en 107 clientes lleva entre 1 y '
      + '7 días, el 65.2% del total; $74,008.03 en 51 clientes va de 8 a 15; y $20,798.28 en 15 '
      + 'clientes de 16 a 30. **Más de 30 días: CERO, con cero clientes.** Eso último es una buena '
      + 'noticia que conviene leer bien — es el tramo que históricamente antecede a la suspensión. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas y contra '
      + 'el de hace cinco días, con `scripts/concilia-churn-s25.py`. No corrige ninguna cifra '
      + 'publicada. '
      + '① LA CARTERA ACTIVA SE DERRUMBA UN 68.5% EN CINCO DÍAS: de $408,857.69 (semana 24) a '
      + '$128,640.37. Y no es que se hayan ido los grandes — los CINCO del Top cambian ENTEROS: '
      + 'Blueservices, Azyco Guadalajara, Gas Economico Metropolitano, VAEO y FabricAir no aparecen, '
      + 'y en su lugar hay cinco nombres nuevos. Ninguna de las dos cancelaciones del mes explica '
      + 'nada de eso: suman $6,708.50. O cambió el criterio de qué cuenta como «activo», o el corte '
      + 'mira otra población. HAY QUE PREGUNTARLO ANTES DE CITAR LA CIFRA. '
      + '② LA CARTERA POR COBRAR ES MÁS DEL DOBLE QUE LA ACTIVA — $272,319.60 contra $128,640.37 — y '
      + 'eso es al revés de como se ha visto en todos los cortes anteriores. Sube un 433.5% (de '
      + '$51,042.30) y los clientes pasan de 45 a 173. Un salto así en cinco días no es cobranza '
      + 'normal: o entró una facturación masiva, o la tabla cambió de alcance. Misma pregunta. '
      + '③ ESTE CORTE NO TRAE TRAMO «POR VENCER». El anterior lo publicaba en cero; éste lo omite. '
      + 'Como el primer tramo es «1 a 7 días», lo que la tabla reporta está TODO vencido. No se '
      + 'inventa un cero donde no hay casilla. [[feedback-cero-sin-medicion]] '
      + '④ LOS CUATRO DOWNGRADES SON LA LISTA COMPLETA, no un top: el corte declara 4 clientes y '
      + 'detalla 4, y suman los $6,038.00. Es la primera vez en cinco cortes que esta tabla cierra '
      + 'sin cubo de «otros». '
      + '⑤ EL MARCADO «top» DEL DOWNGRADE VA POR PORCENTAJE, NO POR DINERO. Señala a Proseso '
      + 'Consultores (81%, $2,210.00), pero el que más ingreso se lleva es Hotel Real de Minas '
      + '(48%, $2,490.00). Las dos lecturas valen y miden cosas distintas; citar una por la otra no. '
      + '⑥ JULIO DESAPARECE DE LA SERIE. Los cortes anteriores abrían en julio (1.9%); éste arranca '
      + 'en agosto. No se arrastra el mes que falta desde el corte viejo: se publica la serie que '
      + 'trae el reporte y se dice que son tres meses. '
      + '⑦ LO QUE SÍ CUADRA, al centavo: las dos cancelaciones contra su total ($6,708.50); soft + '
      + 'hard suspend contra el suyo ($26,949.28) y sus 16 clientes; los cuatro tramos de cartera '
      + 'contra $272,319.60 y sus 173 clientes; y los cuatro downgrades contra $6,038.00. '
      + '⑧ LOS PORCENTAJES NO SE PUEDEN RECONSTRUIR: el correo no publica la base de MRR de cada mes, '
      + 'así que 2.1%, 2.5% y 22.1% se citan como vienen y no se verifican dividiendo. '
      + '[[feedback-metricas-derivadas-origen]]',
  },

  /* ── CARTERA POR COBRAR ─────────────────────────────────────────────────
     Lo que de verdad está pendiente de cobro, y por eso ocupa el bloque que la
     pantalla rotula «Pendiente de Facturar». El corte no da detalle por
     cliente: sólo los cuatro tramos. 173 clientes, $272,319.60 ✓ */
  pendientesTotalReal:   272319.60,
  pendientesCuentasReal: 173,
  pendientes: [
    { cliente: '1 a 7 días vencido — 107 clientes. El 65.2% de la cartera por cobrar, y lo más reciente que hay: esto es cobranza del día, no deuda.', monto: 177513.29, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '8 a 15 días vencido — 51 clientes.',                                                                                                   monto:  74008.03, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '16 a 30 días vencido — 15 clientes. El último tramo antes del que antecede a la suspensión.',                                           monto:  20798.28, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: 'Más de 30 días — 0 clientes, $0.00. CERO MEDIDO, y es la buena noticia del corte: es el tramo que históricamente antecede a la suspensión.', monto: 0, mesesActivo: 0, ultimaFactura: '—' },
  ],

  /* El corte NO trae tramo «Por vencer» —el anterior lo publicaba en cero— así
     que la tabla entera es saldo vencido. No se añade una casilla que el
     reporte no tiene. */
  antiguedadSaldos: [
    { rango: '1 – 7 días vencido',   monto: 177513.29 },
    { rango: '8 – 15 días vencido',  monto:  74008.03 },
    { rango: '16 – 30 días vencido', monto:  20798.28 },
    { rango: 'Más de 30 días',       monto:      0.00 },
  ],

  /* ── LAS 2 CANCELACIONES DE OCTUBRE ─────────────────────────────────────
     Suman $6,708.50 ✓. `acumulado` va en 0 porque el corte NO publica el
     histórico facturado: es «no reportado», no «cero», y la pantalla lo
     escribe con esas palabras. [[feedback-cero-sin-medicion]] */
  cancelados: [
    { cliente: 'Grupo Turístico Rumbo S de RL de CV — «comenta que no lo usaba». Seis meses pagando sin usar el producto: de las dos, es la única sobre la que se podía haber hecho algo. Acumulado histórico no publicado por el corte.', mrr: 4349.00, mesesActivo: 6, acumulado: 0 },
    { cliente: 'PSI División Latinoamérica — cierre de proyecto, que no es un fallo de servicio: el contrato tenía fin. Acumulado no publicado.', mrr: 2359.50, mesesActivo: 21, acumulado: 0 },
  ],

  /* ── DOWNGRADES ─────────────────────────────────────────────────────────
     LISTA COMPLETA: el corte declara 4 clientes y detalla 4. Primera vez en
     cinco cortes que esta tabla cierra sin cubo de «otros». */
  downgradeTotalReal: 6038.00,
  downgradeCasosReal: 4,
  downgrades: [
    { cliente: 'Proseso Consultores — TOP por porcentaje', perdida: 2210.00, nota: '81% de reducción, la mayor en proporción del mes. El corte lo marca como «top», pero por PORCENTAJE: en dinero el mayor es Hotel Real de Minas.' },
    { cliente: 'Hotel Real de Minas San Miguel de Allende', perdida: 2490.00, nota: '48% de reducción y el MAYOR IMPORTE del mes — se lleva el 41.2% de todo el ingreso perdido por downgrade.' },
    { cliente: 'Huellitas Resort GDL', perdida: 799.00, nota: '33% de reducción, la más suave de las cuatro.' },
    { cliente: 'Sparkgam', perdida: 539.00, nota: '52% de reducción. El importe más pequeño del mes.' },
  ],

  /* ── SOFT / HARD SUSPEND DE OCTUBRE ─────────────────────────────────────
     16 clientes, $26,949.28 ✓. El corte da los dos estatus agregados, con su
     promedio de días pendientes; no desglosa por cliente. */
  suspendidosTotalReal:   26949.28,
  suspendidosCuentasReal: 16,
  suspendidos: [
    { cliente: 'Hard Suspend — 12 clientes · 17.6 días promedio pendientes de pago. Servicio activo con restricciones: sin baja autorizada NO es churn.', importe: 16311.28, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Soft Suspend — 4 clientes · 13.0 días promedio pendientes de pago.',                                                                      importe: 10638.00, mesesActivo: 0, estado: 'Suspendido' },
  ],
}
