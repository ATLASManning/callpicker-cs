/**
 * Corte vigente de Gross Revenue Churn.
 *
 * Separado de `page.tsx` para que Atlas (servidor) y el módulo Churn (cliente)
 * lean exactamente las mismas cifras. Al cargar un corte nuevo, este archivo se
 * reemplaza y el anterior se archiva dentro de `page.tsx`.
 */
import type { ChurnReporte } from './tipos'

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 20 · SEPTIEMBRE 2026  (15 sep 2026)
   Cierre de agosto con escenario de recuperación y septiembre en curso.
   Remitente: Valeria Zepeda Hernández (equipo Data).

   CONCILIACIÓN DE ESTE CORTE. A diferencia del de la semana 19 —que traía un
   descuadre de $2,868.27 sin explicar entre la alerta y la tabla— éste cuadra
   en todo lo verificable:
     · Hard 17,811.98 + Soft 11,844.00 + Cancelados 0 = 29,655.98 ✓ y 10+17+0 = 27 ✓
     · los cinco tramos de antigüedad suman 425,458.20 ✓
     · los tramos vencidos (12,263.00 + 17,392.98) son EXACTAMENTE Hard + Soft ✓
     · los tres downgrades suman 6,530.00 ✓, y el detalle por artículo reconstruye
       cada pérdida: Elyon 99+90+490−99 = 580 ✓ · Dicap 2,779−570 = 2,209 ✓ ·
       IBC 5,800−2,059 = 3,741 ✓
     · escenario de agosto: 68,784.18 − 22,212.40 = 46,571.78 ✓
═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S20_SEPTIEMBRE_2026: ChurnReporte = {
  id:      's20-septiembre-2026',
  periodo: 'Semana 20 · Sep 2026',
  fecha:   '15/09/2026',
  notas:   'Gross Revenue Churn · Semana 20. Al 15 de septiembre del 2026. Cierra agosto con el escenario de recuperación de las cuentas en Hard Suspend y sigue septiembre en curso: Top 10 de cuentas Activas, resumen de Hard Suspend / Soft Suspend / Cancelados, antigüedad de la cartera por cobrar y los downgrades de la semana. Próxima revisión: miércoles 23 de septiembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 23 de septiembre.',

  grc: {
    evolucion: [
      { mes: 'Julio',  pct: 2.0, anterior: 2.1 },
      { mes: 'Agosto', pct: 2.4, anterior: 3.4 },
    ],
    acumulado: 17.4,
    anterior:  18.6,
    notaClave: 'Churn Q3: Julio corregido a la baja de 2.1% a 2.0% · Agosto corregido a la baja de 3.4% a 2.4% por el ajuste de reestructura de facturación de las subcuentas de GTC. Churn acumulado hasta agosto 2026: 17.4% — MES CORRIENDO, NO DEFINITIVO (ant. 18.6%).',
    notaEspecial:
      '🔴 CONCENTRACIÓN EN UN SOLO GRUPO: nueve de las diez cuentas del Top 10 son subcuentas de GTC y suman $230,154.22 — el 58.1% de TODA la cartera Activo de $395,802.22. La única cuenta del Top 10 que no es GTC es ADSA ($32,375.00, 92 meses activo). El Top 10 completo pesa $262,529.22, el 66.3% de la cartera; los $133,273.00 restantes se reparten entre el resto de las cuentas, cuyo número este corte no declara. Esto no es un dato del reporte: sale de sumar su propia tabla. Un impago o una renegociación de GTC no es un evento de cuenta, es un evento de cartera. ' +
      '⚠️ NO COMPARABLE CONTRA LA SEMANA 19: la cartera Activo pasó de $136,410.47 (90 cuentas) a $395,802.22 — un factor de 2.90x en una semana. El salto viene de que las subcuentas de GTC entran ahora con su facturación reestructurada, no de crecimiento comercial. Cualquier lectura de "la cartera casi se triplicó" es falsa. ' +
      '🔁 AGOSTO SE HA CORREGIDO DOS VECES POR LA MISMA CAUSA: 4.9% → 3.4% (semana 19) → 2.4% (semana 20), una corrección acumulada de 2.5 puntos, toda ella atribuida a la reestructura de facturación de GTC - CARRANZA y GTC - LOMAS. La nota del corte declara una reducción de 30k por ese ajuste. ' +
      '🔴 Y SEPTIEMBRE ARRASTRA LA MISMA CAUSA SIN CORREGIR. El tablero de Zoho publica para septiembre un churn de $1,726,942.29 y un GRC de 36.2%, contra una banda de 1.5% a 3.3% en todos los meses anteriores. Dirección confirmó el 17 sep 2026 que ese monto NO es churn: es la reestructura de facturación de GTC. Excluyéndolo, septiembre cae a ~1.5% —dentro de su banda normal— y el GRC acumulado del año pasa de 53.5% a ~18.8%. El churn real de 2026 no son $2,270,022 sino ~$570,022: el 76% de la cifra publicada es una sola reestructura contada como pérdida. Agosto ya recibió ese ajuste en la consulta; septiembre todavía no. Mientras no se aplique, ninguna cifra de septiembre del tablero de Zoho es publicable. ' +
      '⚠️ LO QUE ESTE CASO ENSEÑA, Y APLICA MÁS ALLÁ DEL CHURN: una reestructura crea DOS representaciones del mismo dinero —las subcuentas viejas cerrando y la fusionada abriendo— y cualquier proceso que las sume cuenta esa plata dos veces. Aquí infló el churn; en la cartera puede inflar la facturación, porque el enriquecimiento de Zoho suma todas las claves que empiezan con la sigla del grupo. Cada vez que un cliente reestructure, hay que preguntar si las dos representaciones conviven. ' +
      '📌 DOS CIFRAS DISTINTAS DE HARD SUSPEND, Y NO SE CONTRADICEN: el escenario de cierre de agosto habla de 23 cuentas · $22,212.40, y la tabla de septiembre en curso de 10 cuentas · $17,811.98. Son periodos distintos —cierre de agosto contra mes corriendo— y no deben restarse ni compararse entre sí. ' +
      '✅ CERO CANCELADOS EN LA SEMANA: el corte no registra ningún cliente cancelado, contra 6 cuentas y $17,770.98 en la semana 19. Es la primera semana sin bajas del trimestre. ' +
      '💰 DINERO FUERA DE LA CARTERA: $29,655.98 en 27 cuentas — Hard Suspend 10 cuentas · $17,811.98 · 19.5 días promedio pendiente de pago · Soft Suspend 17 cuentas · $11,844.00 · 10.5 días · Cancelados 0 · $0.00. Ese monto es exactamente la suma de los tramos vencidos de la antigüedad de saldos. ' +
      '📉 DOWNGRADE POCO DINERO, MUCHA PROFUNDIDAD: los tres únicos downgrades de la semana suman $6,530.00 —poco contra el promedio mensual— pero los tres recortaron más del 40% de su facturación, y dos de ellos más del 79%. El riesgo aquí no es el monto de la semana: es que un cliente que corta el 85% de lo que paga rara vez se queda en el 15% restante.',
  },

  /* Top 10 · Cuentas Activo de septiembre — total cartera Activo $395,802.22.
     El corte NO declara cuántas cuentas componen ese total, así que no se
     inventa el número: la fila de cierre lleva el monto y dice que el conteo
     no viene en el reporte. */
  pendientesTotalReal: 395802.22,
  pendientes: [
    { cliente: '🔝 GTC - CENTRO MAX',     monto: 34601.46, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - NAVA',              monto: 34189.46, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - CARRANZA, LOMAS',   monto: 33021.73, mesesActivo: 0,  ultimaFactura: 'Activo' },
    { cliente: 'ADSA',                    monto: 32375.00, mesesActivo: 92, ultimaFactura: 'Activo' },
    { cliente: 'GTC - FORUM',             monto: 28484.81, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - BMW',               monto: 26297.55, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - SENDERO',           monto: 23255.06, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - MG POLIFORUM',      monto: 19694.24, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - MG LOMAS',          monto: 16626.24, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - MATEHUALA',         monto: 13983.67, mesesActivo: 6,  ultimaFactura: 'Activo' },
    /* El «+» de arranque NO es decorativo: lib/atlas-context.ts filtra por él
       (`!p.cliente.startsWith('+')`) para no pasarle esta fila de cierre al
       modelo como si fuera un cliente. Sin el prefijo, Atlas reportaría un
       cliente llamado «Resto de la cartera Activo» con $133,273.00. */
    { cliente: '+ Resto de la cartera Activo — el corte no desglosa nombres ni declara cuántas cuentas son.', monto: 133273.00, mesesActivo: 0, ultimaFactura: 'Activo' },
  ],

  /* Cancelados: NINGUNO en la semana. El corte lo dice con todas sus letras
     —«No contamos con registros de clientes cancelados en la semana»— así que
     la lista va vacía a propósito. Vacío por ausencia de bajas, no por falta
     de dato: son cosas distintas y la de aquí es la buena. */
  cancelados: [],

  /* Downgrades de la semana — 3 clientes · $6,530.00, ordenados por % de
     reducción de mayor a menor. El detalle por artículo reconstruye exactamente
     la pérdida declarada de cada uno (ver la conciliación del encabezado). */
  downgradeTotalReal: 6530.00,
  downgrades: [
    { cliente: '🔝 Sellos de Seguridad Grupo Elyon', perdida: 580.00,  nota: '85% de baja — la mayor reducción porcentual de la semana. Quitó DiD Nacional ($99), paquete 800 ($90) y Paquete Min VyC ($490); adquirió DiD Internacional ($99). Neto $580. Se queda con una fracción mínima de lo que pagaba.' },
    { cliente: 'Dicap Desarrollos',                  perdida: 2209.00, nota: '79% de baja. Paquete Min VyC $2,779.00 → $570.00.' },
    { cliente: 'IBC SUITES',                         perdida: 3741.00, nota: '46% de baja — el mayor monto de la semana. Paquete Min VyC $5,800.00 → $2,059.00.' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Min VyC',      vecesAfectado: 3, clientes: ['Sellos de Seguridad Grupo Elyon', 'Dicap Desarrollos', 'IBC SUITES'] },
    { articulo: 'DiD Nacional',         vecesAfectado: 1, clientes: ['Sellos de Seguridad Grupo Elyon'] },
    { articulo: 'Paquete 800',          vecesAfectado: 1, clientes: ['Sellos de Seguridad Grupo Elyon'] },
  ],

  /* Antigüedad de la cartera por cobrar — total $425,458.20.
     Incluye Activo + Hard Suspend + Soft Suspend; Cancelado no forma parte de
     la cartera por cobrar. «Por vencer» es el total Activo al corriente.
     Los dos tramos vencidos suman exactamente el dinero fuera de cartera. */
  antiguedadSaldos: [
    { rango: 'Por vencer',           monto: 395802.22 },
    { rango: '1 – 7 días vencido',   monto: 0.00 },
    { rango: '8 – 15 días vencido',  monto: 12263.00 },
    { rango: '16 – 30 días vencido', monto: 17392.98 },
    { rango: 'Más de 30 días',       monto: 0.00 },
  ],

  /* Fuera de cartera — Hard Suspend 10 cuentas · $17,811.98 · 19.5 días
     promedio y Soft Suspend 17 cuentas · $11,844.00 · 10.5 días. El reporte no
     desglosa nombres en ninguno de los dos estados. Total 27 cuentas ·
     $29,655.98. Ojo: el escenario de CIERRE DE AGOSTO habla de 23 cuentas en
     Hard Suspend por $22,212.40 — es otro periodo, no se compara con éste.

     Y un detalle que el corte no explica: el TOTAL de Hard + Soft empata exacto
     con los tramos vencidos, pero el reparto cruza por $419.00 — Hard tiene
     $419.00 MÁS que el tramo de 16 a 30 días y Soft exactamente $419.00 MENOS
     que el de 8 a 15. No se le inventa una correspondencia cuenta por cuenta:
     se deja anotado para preguntarlo. */
  suspendidosTotalReal:   29655.98,
  suspendidosCuentasReal: 27,
  suspendidos: [
    { cliente: 'Hard Suspend — 10 cuentas · 19.5 días promedio pendiente de pago. El reporte no desglosa nombres.', importe: 17811.98, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Soft Suspend — 17 cuentas · 10.5 días promedio pendiente de pago. El reporte no desglosa nombres.', importe: 11844.00, mesesActivo: 0, estado: 'Suspendido' },
  ],
}
