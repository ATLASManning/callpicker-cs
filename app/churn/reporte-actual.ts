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
   REPORTE SEMANAL — SEMANA 24 · CIERRE DE SEPTIEMBRE Y AVANCE DE OCTUBRE
   Al 16 de octubre de 2026. Remitente: Valeria Zepeda Hernández (equipo Data).

   VUELVE A SER UN CORTE SEMANAL. El de la semana 23 era el consolidado de T3 y
   por eso no traía Top de Activo, ni suspendidos, ni antigüedad de saldos; éste
   los trae, así que esos bloques dejan de salir vacíos.

   CÓMO SE MAPEÓ EL CORREO A LOS BLOQUES DE LA PANTALLA
     · «Cartera por Cobrar» por antigüedad .................. pendientes + antiguedadSaldos
     · «Cancelaciones» de octubre ........................... cancelados
     · «Top 4 · Mayor Reducción» y la suma por producto ..... downgrades + downgradeArticulos
     · «Mes de Septiembre — Cómo Cerró» (hard suspend) ...... suspendidos
     · «Top 5 · Clientes Activos» ........................... NINGUNO — va en la nota

   Y AQUÍ SE ROMPE CON LAS SEMANAS 20 A 22 A PROPÓSITO. Esos cortes metían el
   Top de cuentas ACTIVO en `pendientes`, y la pantalla rotula ese bloque
   «PENDIENTE DE FACTURAR · clientes en riesgo · acción inmediata requerida» y
   lo suma al «Total impacto». Con este corte eso daba «MRR en riesgo
   $408,857.69» usando la cartera SANA del mes, y un impacto total de
   $475,605.02 que mezcla lo que facturamos con lo que perdimos. La cartera
   activa no está en riesgo: la que lo está es la cartera POR COBRAR
   ($51,042.30 en 45 clientes), y ésa es la que va en ese bloque.
   El Top 5 de Activos no tiene bloque con rótulo honesto, así que va completo
   dentro de la nota —con sus cinco nombres, sus importes y el 76.2% que el
   corte no desglosa— en vez de bajo una etiqueta que lo llama riesgo.
   [[feedback-kpi-con-fuente]]

   CONCILIADO CON `scripts/concilia-churn-s24.py`. Cierra:
     · las 11 cancelaciones suman $35,127.00 ✓
     · los cinco tramos de cartera suman $51,042.30 y 45 clientes ✓
     · el Top 4 de downgrades suma los $18,717.97 «a detalle» ✓

   LO QUE NO CIERRA, Y VA DICHO EN LA NOTA:
     · HARD SUSPEND DE SEPTIEMBRE. Las cuatro filas suman $16,379.98 y el correo
       declara $12,371.00 — $4,008.98 de diferencia. Sin «Hoteles y Servicios»
       tampoco cuadra ($5,433.00), así que el total declarado no lo excluye.
       Se publican LAS CUATRO FILAS, que es el dato verificable.
     · EL TOP 5 DE ACTIVOS DEJA FUERA $311,416.73, el 76.2% de la cartera activa
       de octubre, y el TOP 4 DE DOWNGRADES el 40.8% del total neto. Los dos
       llevan cubo «otros». [[feedback-tablas-deben-cerrar]]

   Y UNA COINCIDENCIA QUE VALE LA PENA: «Hoteles y Servicios» es la 3ª mayor
   cancelación del corte archivado de T3 ($10,946.98, 2 meses) y este corte lo
   reporta en hard suspend preguntando si sigue contando.
   ═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S24_OCT_2026: ChurnReporte = {
  id:      's24-octubre-2026',
  periodo: 'Semana 24 · Oct 2026',
  fecha:   '16/10/2026',
  notas:   'Gross Revenue Churn · Semana 24. Al 16 de octubre del 2026. Trae el cierre definitivo de '
         + 'septiembre —quién sigue activo y quién quedó en hard suspend— y el avance de octubre: '
         + 'Top 5 de cuentas Activas sobre una cartera activa de $408,857.69, las 11 cancelaciones '
         + 'del mes con su motivo, la cartera por cobrar por antigüedad de días pendientes y los '
         + 'downgrades por producto y por cliente. Vuelve a ser un corte semanal: el cierre de T3 no '
         + 'traía estos bloques. Próxima revisión: miércoles 21 de octubre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 21 de octubre.',

  grc: {
    /* Los tres meses del trimestre con su reexpresión. `anterior` guarda la
       cifra del corte previo para que la pantalla enseñe de dónde viene cada
       número: que un mes cerrado cambie no es un error, son los pagos que
       entran tarde. [[regla-churn-mes-vencido]] */
    evolucion: [
      { mes: 'Julio',      pct: 1.9 },
      { mes: 'Agosto',     pct: 2.1, anterior: 2.3 },
      { mes: 'Septiembre', pct: 2.6, anterior: 6.9 },
    ],
    acumulado: 19.5,
    anterior:  23.7,
    /* El acumulado vuelve a ser el DEL AÑO —19.5%, reexpresado desde el 23.7%
       de la semana 22— y no el del trimestre como el 2.39% del corte de T3. La
       misma casilla significó dos cosas en dos cortes seguidos; sin rótulo se
       leería como un salto del 2.39% al 19.5%. [[churn-analisis-data]] */
    acumuladoEtiqueta: '2026 acumulado hasta septiembre · NO DEFINITIVO',
    notaClave:
      'Cierre de septiembre y avance de octubre. Septiembre cierra en 2.6%, reexpresado desde el '
      + '6.9% de la semana 22, y el acumulado del año baja de 23.7% a 19.5%. LAS DOS CIFRAS SIGUEN '
      + 'MARCADAS COMO NO DEFINITIVAS por el propio reporte. En octubre van $35,127.00 en once '
      + 'cancelaciones y $51,042.30 de cartera por cobrar en 45 clientes, con el grueso '
      + '—$38,671.30 en 27 clientes— en el tramo de 8 a 15 días. La cartera activa del mes es de '
      + '$408,857.69.',
    notaEspecial:
      '🔵 SEPTIEMBRE BAJA OTRA VEZ: 6.9% → 2.6%. Es la CUARTA lectura del mismo mes — 23.6% el 22 de '
      + 'septiembre, 6.9% el 29, 3.14% en el cierre de trimestre y 2.6% ahora. Cada corte lo afina a '
      + 'la baja conforme entran los pagos, que es exactamente lo que este módulo lleva cuatro '
      + 'cortes advirtiendo: el mes vivo mide retraso de cobranza, no bajas. Quien reportó el 23.6% '
      + 'como resultado de septiembre publicó un número NUEVE VECES mayor que el que hoy se '
      + 'sostiene. Ojo con la flecha del correo: su «antes» es el 6.9% de la semana 22, no el 3.14% '
      + 'del cierre de T3, así que la caída real de este corte es de 3.14% a 2.6%. '
      + '📌 EL ACUMULADO DEL AÑO VUELVE A TENER CIFRA: 19.5%, reexpresado desde el 23.7% de la '
      + 'semana 22. El cierre de T3 lo había dejado vencido y sin sustituto —y no se inventó uno—; '
      + 'este corte lo repone y lo marca NO DEFINITIVO. '
      + '🔻 LAS ONCE CANCELACIONES DE OCTUBRE SUMAN $35,127.00 Y DOS SON EL 73.4%: Jason de México '
      + '($17,225.00, 43 meses) y KOMBITEC ($8,539.00, 73 meses), las dos por MIGRACIÓN A OTRO '
      + 'PROVEEDOR. Es el motivo más caro del mes con diferencia —$26,253.00 de los $35,127.00— y '
      + 'las otras nueve juntas suman $8,874.00. Cuatro cuentas se fueron por «cambios '
      + 'organizacionales internos», dos por poco uso, una por precio y una sin comentarios. '
      + '⏱️ TRES DE LAS ONCE SE FUERON CON MENOS DE UN AÑO: FOBE con 1 MES ($519.00), Avezado '
      + 'Abogados con 8 ($489.00) y ENCAMINO Chat con 11 ($1,750.00). En el otro extremo, TP DIGITAL '
      + 'se va tras 105 MESES —casi nueve años— por cambios organizacionales internos. '
      + '💰 LA CARTERA POR COBRAR ES JOVEN: $38,671.30 de los $51,042.30 (el 75.8%) lleva entre 8 y '
      + '15 días y son 27 de los 45 clientes; sólo $3,505.00 en 3 clientes pasa de 30 días. Eso es '
      + 'cobranza reciente y se recupera con pagos, no cartera perdida. Los tramos «por vencer» y '
      + '«1 a 7 días» vienen en CERO con CERO clientes: esta vez el cero está medido, no es un hueco. '
      + '🏆 TOP 5 DE CUENTAS ACTIVAS DE OCTUBRE, sobre una cartera activa total de $408,857.69: '
      + 'Blueservices $24,616.03 (43 meses) · Azyco Guadalajara $22,984.00 (25) · Gas Economico '
      + 'Metropolitano $18,659.00 (43) · VAEO $15,995.52 (5) · FabricAir Latin America $15,186.41 '
      + '(68). Los cinco suman $97,440.96, el 23.8%: los otros $311,416.73 —el 76.2%— no tienen '
      + 'nombre en el corte y tampoco dice cuántas cuentas son. Esto va aquí, en la nota, y NO en el '
      + 'bloque de «Pendiente de Facturar» como en los cortes de las semanas 20 a 22: la cartera '
      + 'activa es lo que SÍ factura, no dinero en riesgo, y sumarla al impacto del mes daba un '
      + '«MRR en riesgo» de $408,857.69 que es falso. '
      + '🟢 UNA CUENTA SIGUE ACTIVA Y NO ES CHURN: Colegio NWL - Corregidora, $1,392.00, 64 meses, '
      + 'última factura de agosto y 54 días pendientes de pago desde el corte del 23 de agosto. El '
      + 'reporte la publica aparte, fuera del hard suspend, precisamente para que no se cuente como '
      + 'baja. No está en el Top 5 de activos ni en los suspendidos de esta pantalla. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas con '
      + '`scripts/concilia-churn-s24.py`. Queda registrado de nuestra parte y no corrige ninguna '
      + 'cifra publicada. '
      + '① EL HARD SUSPEND DE SEPTIEMBRE NO CUADRA. Las cuatro cuentas listadas suman $16,379.98 y '
      + 'el correo declara un total de $12,371.00: $4,008.98 de diferencia. Quitando «Hoteles y '
      + 'Servicios» —el caso que el propio corte pone en duda— tampoco cuadra, porque las otras tres '
      + 'suman $5,433.00: el total declarado no lo está excluyendo. Esta pantalla publica LAS CUATRO '
      + 'FILAS, que es el dato verificable; antes de citar los $12,371.00 hay que preguntarlo. '
      + '② «HOTELES Y SERVICIOS» CAMBIA DE ESTADO ENTRE CORTES, Y NOSOTROS TENEMOS EL DATO ANTERIOR. '
      + 'El cierre de T3 lo publicó como la TERCERA mayor cancelación del trimestre: $10,946.98, 2 '
      + 'meses activo, baja en septiembre, con $32,742.00 de acumulado histórico. Éste lo reporta en '
      + 'hard suspend —servicio activo con restricciones— y pregunta abiertamente si debe seguir '
      + 'contándose en la cartera por cobrar. Es el mismo patrón de INBROTEK en la semana 22: un '
      + 'cliente clasificado de dos formas en la misma familia de reportes. Nuestra respuesta, por '
      + 'la regla de la casa: mientras no haya baja autorizada no es churn, y un servicio activo con '
      + 'restricciones es cartera por cobrar, no pérdida. [[feedback-conciliacion-churn]] '
      + '③ EL TOP 5 DE ACTIVOS DEJA FUERA EL 76.2% DE LA CARTERA. Los cinco suman $97,440.96 de los '
      + '$408,857.69: $311,416.73 no se desglosan y el corte tampoco dice cuántas cuentas son. Por '
      + 'eso el Top 5 se publica en esta nota, con el porcentaje que deja fuera a la vista, y no '
      + 'como tabla con total propio: una tabla que enseña el 23.8% y un total del 100% se lee como '
      + 'si fuera la cartera entera. [[feedback-tablas-deben-cerrar]] '
      + '④ LAS DOS TABLAS DE DOWNGRADE NO SE SUMAN, y el corte lo avisa. El impacto por producto es '
      + 'BRUTO ($32,187.97) y el total neto es $31,620.33: la diferencia son los upsells dentro de la '
      + 'misma cuenta, como TUNALI TEC, que quita DiD Nacional y Min VyC pero añade Agente CP Chat. '
      + 'Mismo aviso que en los dos cortes anteriores. '
      + '⑤ EL TOP 4 DE DOWNGRADES CUBRE EL 59.2% del total neto: $18,717.97 de $31,620.33 sobre 10 '
      + 'casos. Los otros $12,902.36 —el 40.8%— no se desglosan en este corte. '
      + '⑥ PORTALIA ES EL MAYOR DOWNGRADE DEL MES con $9,754.97, el 30.9% de todo el ingreso perdido '
      + 'por reducción, y el movimiento es doble: quita Extension VyC y además recorta el paquete de '
      + 'minutos de Voicebot de $3,000 a $1,000. Dos decisiones sobre la misma cuenta en el mismo mes. '
      + '⑦ LO QUE SÍ CUADRA, al centavo: las once cancelaciones contra su total ($35,127.00); los '
      + 'cinco tramos de cartera contra el suyo ($51,042.30) y sus 45 clientes; y el Top 4 de '
      + 'downgrades contra la «sumatoria a detalle» ($18,717.97). '
      + '⑧ LOS PORCENTAJES DE CHURN NO SE PUEDEN RECONSTRUIR: el correo no publica la base de MRR de '
      + 'cada mes, así que 1.9%, 2.1% y 2.6% se citan como vienen del reporte y no se verifican '
      + 'dividiendo, a diferencia del cierre de T3, que sí traía las bases. '
      + '[[feedback-metricas-derivadas-origen]]',
  },

  /* ── CARTERA POR COBRAR ─────────────────────────────────────────────────
     Hard suspend arrastrado de septiembre + soft suspend nuevo de octubre, por
     antigüedad de días pendientes de pago. 45 clientes, $51,042.30 ✓
     Esto es lo que de verdad está pendiente de cobro, y por eso ocupa el
     bloque que la pantalla rotula «Pendiente de Facturar». El corte NO da
     detalle por cliente de este bloque: sólo los cinco tramos. */
  pendientesTotalReal:   51042.30,
  pendientesCuentasReal: 45,
  pendientes: [
    { cliente: '8 a 15 días vencido — 27 clientes. El 75.8% de la cartera por cobrar: cobranza reciente, se recupera con pagos.', monto: 38671.30, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '16 a 30 días vencido — 15 clientes. El tramo donde la conversación de valor todavía llega antes del corte.',       monto:  8866.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: 'Más de 30 días vencido — 3 clientes. El único tramo que ya es cartera vencida de verdad.',                         monto:  3505.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: 'Por vencer y de 1 a 7 días — 0 clientes, $0.00. El corte los reporta en CERO con cero clientes: es un cero medido, no un bloque que falte.', monto: 0, mesesActivo: 0, ultimaFactura: '—' },
  ],

  antiguedadSaldos: [
    { rango: 'Por vencer',           monto:     0.00 },
    { rango: '1 – 7 días vencido',   monto:     0.00 },
    { rango: '8 – 15 días vencido',  monto: 38671.30 },
    { rango: '16 – 30 días vencido', monto:  8866.00 },
    { rango: 'Más de 30 días',       monto:  3505.00 },
  ],

  /* ── LAS 11 CANCELACIONES DE OCTUBRE ────────────────────────────────────
     Suman $35,127.00 ✓. `acumulado` va en 0 porque este corte NO publica el
     histórico facturado de cada cuenta: es «no reportado», no «cero», y así se
     dice en el texto de cada fila. [[feedback-cero-sin-medicion]] */
  cancelados: [
    { cliente: 'Jason de México — TOP, la mayor del mes. MIGRACIÓN A OTRO PROVEEDOR. Acumulado histórico no publicado por el corte.', mrr: 17225.00, mesesActivo: 43, acumulado: 0 },
    { cliente: 'KOMBITEC — más de seis años. MIGRACIÓN A OTRO PROVEEDOR. Con Jason son el 73.4% de las bajas del mes. Acumulado no publicado.', mrr: 8539.00, mesesActivo: 73, acumulado: 0 },
    { cliente: 'WhatsHome — Restructuración. Acumulado no publicado.', mrr: 3250.00, mesesActivo: 71, acumulado: 0 },
    { cliente: 'ENCAMINO Chat — Poco uso. Acumulado no publicado.', mrr: 1750.00, mesesActivo: 11, acumulado: 0 },
    { cliente: 'TP DIGITAL — 105 meses: casi nueve años, el cliente más antiguo que se va este mes. Cambios organizacionales internos. Acumulado no publicado.', mrr: 1300.00, mesesActivo: 105, acumulado: 0 },
    { cliente: 'LUNAH ECO-RESORTS — el corte dice «sin comentarios»: no registra motivo. Acumulado no publicado.', mrr: 588.00, mesesActivo: 51, acumulado: 0 },
    { cliente: 'FOBE — 1 MES ACTIVO, la salida más temprana del mes. Cambios organizacionales internos. Acumulado no publicado.', mrr: 519.00, mesesActivo: 1, acumulado: 0 },
    { cliente: 'Avezado Abogados Penales — 8 meses. Cambios organizacionales internos. Acumulado no publicado.', mrr: 489.00, mesesActivo: 8, acumulado: 0 },
    { cliente: 'Schimer — Poco uso. Acumulado no publicado.', mrr: 489.00, mesesActivo: 18, acumulado: 0 },
    { cliente: 'Cole Majzner arquitectos — PRECIO: la única del mes que se va por costo. Acumulado no publicado.', mrr: 489.00, mesesActivo: 40, acumulado: 0 },
    { cliente: 'Annova Logistics — Migración a otro proveedor. Acumulado no publicado.', mrr: 489.00, mesesActivo: 29, acumulado: 0 },
  ],

  /* ── DOWNGRADES ─────────────────────────────────────────────────────────
     Total NETO del mes $31,620.33 sobre 10 casos; el corte detalla los 4 de
     mayor importe ($18,717.97 ✓) y la última fila es el cubo de cierre. */
  downgradeTotalReal: 31620.33,
  downgradeCasosReal: 10,
  downgrades: [
    { cliente: 'Portalia — TOP', perdida: 9754.97, nota: 'El mayor del mes: el 30.9% de todo el ingreso perdido por reducción. Movimiento doble — quita Extension VyC y recorta el paquete de minutos de Voicebot de $3,000 a $1,000.' },
    { cliente: 'TUNALI TEC', perdida: 5404.00, nota: 'Quita DiD Nacional y paquete Min VyC, pero AÑADE Agente CP Chat. Es el caso que explica por qué la tabla de productos (bruta) no cuadra con el total neto.' },
    { cliente: 'Corporativo grupo funerario San Javier', perdida: 1959.00, nota: 'Quita el paquete Min VyC.' },
    { cliente: 'Grupo Guía', perdida: 1600.00, nota: 'Reduce DiD Nacional y paquete Min VyC.' },
    { cliente: '+ Resto de los downgrades de octubre', perdida: 12902.36, nota: '⚠ CUBO DE CIERRE. Son 10 los casos de downgrade del mes y el corte sólo detalla los 4 de mayor importe. Sin esta fila el Top 4 se leería como todo el downgrade de octubre y dejaría fuera el 40.8% del total neto.' },
  ],

  /* Impacto BRUTO por producto: lo que se quitó o redujo en cada caso, SIN
     netear los upsells de la misma cuenta. Suma $32,187.97 contra los
     $31,620.33 de pérdida neta y el propio corte advierte que no coinciden
     1:1. NO se suman las dos tablas. `vecesAfectado` sí viene en este corte. */
  downgradeArticulos: [
    { articulo: 'paquete Min VyC — $17,326.00',     vecesAfectado: 7, clientes: ['El artículo más golpeado del mes: 7 de los 10 casos.'] },
    { articulo: 'Extension VyC — $10,161.97',       vecesAfectado: 2, clientes: ['Sólo 2 casos pero el segundo importe del mes: Portalia se lleva la mayor parte.'] },
    { articulo: 'paquete Min Voicebot — $2,000.00', vecesAfectado: 1, clientes: ['Un solo caso: Portalia, de $3,000 a $1,000.'] },
    { articulo: 'DiD Nacional — $1,671.00',         vecesAfectado: 4, clientes: ['El segundo más repetido y el de menor importe por caso.'] },
    { articulo: 'paquete Min CE — $1,029.00',       vecesAfectado: 1, clientes: ['Un solo caso.'] },
  ],

  /* ── CIERRE DE SEPTIEMBRE · HARD SUSPEND ────────────────────────────────
     Las cuatro cuentas que quedaron en hard suspend —servicio activo con
     restricciones— y que el corte describe como «continúa sin entrar a la
     cartera». Van en `suspendidos`, que la pantalla rotula «Suspendidos /
     Inactivos en retención»: es exactamente lo que son.

     El total es la SUMA DE LAS FILAS ($16,379.98), no los $12,371.00 que
     declara el correo: ver la observación ① de la nota.

     Colegio NWL - Corregidora ($1,392.00, 64 meses, última factura de agosto,
     54 días pendientes) NO va aquí: el corte lo publica aparte como ACTIVO y
     meterlo en este bloque lo contaría como baja. Va dicho en la nota. */
  suspendidosTotalReal:   16379.98,
  suspendidosCuentasReal: 4,
  suspendidos: [
    { cliente: 'Hoteles y Servicios — HARD SUSPEND. ⚠ El cierre de T3 lo publicó como la TERCERA mayor cancelación del trimestre ($10,946.98, baja en septiembre, $32,742.00 de acumulado histórico) y aquí figura en hard suspend. El propio reporte pregunta si debe seguir contándose en la cartera por cobrar. Por la regla de la casa: sin baja autorizada no es churn. Corte al 29 ago 2026 · 48 días pendientes.', importe: 10946.98, mesesActivo: 2, estado: 'Suspendido' },
    { cliente: 'Skyhous — HARD SUSPEND. Corte al 05 sep 2026 · 41 días pendientes.',                                  importe: 2497.00, mesesActivo: 65, estado: 'Suspendido' },
    { cliente: 'Uno Suministros — HARD SUSPEND. 70 meses, la más antigua del bloque. Corte al 18 sep 2026 · 28 días.', importe: 1759.00, mesesActivo: 70, estado: 'Suspendido' },
    { cliente: 'Epinova Bio Labs — HARD SUSPEND. Corte al 26 sep 2026 · 20 días pendientes.',                          importe: 1177.00, mesesActivo:  9, estado: 'Suspendido' },
  ],
}
