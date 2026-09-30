/**
 * Corte vigente de Gross Revenue Churn.
 *
 * Separado de `page.tsx` para que Atlas (servidor) y el módulo Churn (cliente)
 * lean exactamente las mismas cifras. Al cargar un corte nuevo, este archivo se
 * reemplaza y el anterior se archiva dentro de `page.tsx`.
 */
import type { ChurnReporte } from './tipos'

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 22 · SEPTIEMBRE 2026  (29 sep 2026)
   Cierre de septiembre. Remitente: Valeria Zepeda Hernández (equipo Data).

   EL CORTE QUE MEJOR CIERRA DE TODA LA SERIE. Se concilió contra sus propias
   tablas antes de publicarlo y cuadra todo lo verificable, al centavo:
     · Hard 26,457.50 + Soft 19,610.93 + Cancelados 44,663.96 = 90,732.39 ✓
       y 32 + 31 + 18 = 81 cuentas ✓
     · los cinco tramos de antigüedad suman 206,471.95 ✓
     · Hard → Cancelado: 10,946.98 + 1,276.00 + 1,238.00 = 13,460.98 ✓
     · los tres casos clave: 6,543 + 10,946.98 + 7,372.98 = 24,862.96 ✓
     · menos de 3 meses activos: las ocho suman 20,952.98 ✓

   Y SE RESUELVE EL CRUCE DEL $489 QUE LLEVABA DOS CORTES. En las semanas 20 y
   21 los tramos vencidos no empataban con Hard/Soft por $419 y $489, y quedó
   anotado que «dos veces seguidas ya no es casualidad». Aquí sí empatan:
   8–15 días = Soft exacto (19,610.93) y Hard se reparte entre 16–30
   (25,968.50) y más de 30 días (489.00) = 26,457.50. Era una cuenta de Hard
   con más de 30 días de atraso, y este corte por fin la separa. Cerrado.
═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S22_SEPTIEMBRE_2026: ChurnReporte = {
  id:      's22-septiembre-2026',
  periodo: 'Semana 22 · Sep 2026',
  fecha:   '29/09/2026',
  notas:   'Gross Revenue Churn · Semana 22. Al 29 de septiembre del 2026. Cierra septiembre: Top 10 de cuentas Activas, seguimiento de quiénes pasaron de Hard Suspend a Cancelado, resumen de Hard / Soft / Cancelados, antigüedad de la cartera por cobrar, Top 5 de downgrades por % de reducción, productos más afectados y las notas de los 3 casos clave que cancelaron. Próxima revisión: miércoles 7 de octubre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 7 de octubre.',

  grc: {
    evolucion: [
      { mes: 'Julio',      pct: 1.9 },
      { mes: 'Agosto',     pct: 2.3 },
      { mes: 'Septiembre', pct: 6.9, anterior: 23.6 },
    ],
    acumulado: 23.7,
    anterior:  17.2,
    notaClave: 'Churn Q3: Julio 1.9% · Agosto 2.3% · Septiembre BAJA de 23.6% a 6.9%, y sigue siendo MES CORRIENDO Y NO DEFINITIVO. Acumulado hasta septiembre 2026: 23.7% — tampoco definitivo.',
    notaEspecial:
      '🔵 SEPTIEMBRE SE CORRIGIÓ DE 23.6% A 6.9%: dieciséis puntos y siete décimas en una semana, la mayor corrección de la serie. No es que el negocio mejorara — es que entraron los pagos. Es exactamente lo que este módulo lleva dos cortes advirtiendo: el mes vivo mide retraso de cobranza, no bajas, porque Zoho marca como churn todo contrato que aún no factura. Quien haya reportado el 23.6% como resultado de septiembre reportó una cifra que se desinfló a menos de un tercio. '
      + '📌 EL ACUMULADO SUBE DE 17.2% A 23.7% y no se reconstruye exacto: 17.2% (hasta agosto) + 6.9% (septiembre) = 24.1%, cuatro décimas por encima de lo declarado. La diferencia cabe en correcciones de meses anteriores que el corte no detalla. Se conserva el 23.7% publicado. '
      + '🟠 LA ESCALACIÓN YA NO SOLO CRECE, TAMBIÉN MATA: tres cuentas pasaron de Hard Suspend a Cancelado en la semana ($13,460.98), y Hoteles y Servicios se lleva $10,946.98 de esos tres. El Hard Suspend pasa de 23 a 32 cuentas y el Soft de 23 a 31; el promedio de días en Hard sube de 17.9 a 21.3. '
      + '💰 $90,732.39 EN 81 CUENTAS NO HAN ENTRADO A LA CARTERA — el 43.9% de los $206,471.95 por cobrar. La semana pasada eran $68,247.98 en 53 cuentas, el 27.4%. El dinero fuera de la cartera creció un 33% en siete días. '
      + '⚠️ EL TOP 10 CONCENTRA MENOS, PERO PORQUE LA CARTERA ENCOGIÓ: pesa $75,007.02 de $160,403.52 —el 46.8%, contra el 60.0% de la semana 21— y la cartera Activo bajó de $193,111.27 a $160,403.52. Ese porcentaje sale de sumar su propia tabla: el corte no declara cuántas cuentas tiene la cartera. '
      + '🔻 MAS SUITES CANCELA TRAS 70 MESES y con $393,693.64 de MRR acumulado histórico: con diferencia, el cliente más antiguo y más valioso de los que se fueron. El corte no da motivo. '
      + '⏱️ OCHO CUENTAS SE CAYERON CON MENOS DE TRES MESES DE VIDA ($20,952.98). Hoteles y Servicios duró 2 meses con $10,946.98 y VEMEPE 1 mes con $6,890. CINCO DE LAS OCHO TIENEN CERO MESES ACTIVOS: nunca llegaron a facturar un mes completo. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas. Queda registrado de nuestra parte y no se consultó al equipo Data. No se corrige ninguna cifra publicada. '
      + '① SE CIERRA EL CRUCE DEL $489 QUE LLEVABA DOS CORTES. En las semanas 20 y 21 los tramos vencidos no empataban con Hard/Soft por $419 y $489. Este corte lo explica: 8–15 días = Soft exacto, y Hard se reparte entre 16–30 ($25,968.50) y más de 30 días ($489.00). Era una cuenta de Hard con más de 30 días de atraso. Queda resuelto y no hay que volver a preguntarlo. '
      + '② UNA CUARTA PARTE DE LOS DOWNGRADES NO TIENE CARA. El corte declara $58,751.63 de total general y desglosa $44,806.71 en 12 clientes: quedan $13,944.92 sin detalle. No es un descuadre —distingue las dos cifras a propósito— pero conviene saberlo antes de citar el total. '
      + '③ LA TABLA DE PRODUCTOS SUMA $1,032.98 MÁS que los downgrades desglosados ($45,839.69 contra $44,806.71), y el propio corte lo advierte: es impacto BRUTO por producto, sin netear contra los upsells dentro de la misma cuenta. Nada que corregir; se anota para que nadie sume las dos tablas. '
      + '④ IBC SUITES BAJA POR EL MISMO IMPORTE QUE EN LA SEMANA 20: $3,741.00, con el mismo movimiento de paquete Min VyC de $5,800 a $2,059. O bajó dos veces, o se está contando dos veces. Vale preguntarlo. '
      + '⑤ DOS CUENTAS DE ESTE CORTE ESTÁN EN NUESTRA CARTERA VIVA. INBROTEK SERVICIOS (C66) e Inverdental (F9), las dos de Fátima y las dos devueltas a Activas el 28 de septiembre porque no estaban en el reporte de Churn confirmado. INBROTEK aparece aquí como Cancelado ($2,801) e Inverdental en el Top 10 Activo ($10,186, 74 meses). Ninguna de las dos obliga a moverlas: «Cancelado» en Análisis DATA no es «Churn confirmado» en GRC, y la regla de dirección del 28 sep exige lo segundo o el expediente documentado. Queda señalado para decisión. '
      + '⑥ LO QUE SÍ CUADRA, al centavo: Hard + Soft + Cancelados ($90,732.39 en 81 cuentas), los cinco tramos de antigüedad ($206,471.95), las tres que pasaron de Hard a Cancelado ($13,460.98), los tres casos clave ($24,862.96) y las ocho de menos de tres meses ($20,952.98).',
  },

  /* Top 10 de cuentas Activo. `ultimaFactura` no viene en este corte. */
  pendientesTotalReal:   160403.52,
  pendientes: [
    { cliente: 'Gas Economico Metropolitano — TOP', monto: 18659.00, mesesActivo: 42, ultimaFactura: '—' },
    { cliente: 'Inverdental',                       monto: 10186.00, mesesActivo: 74, ultimaFactura: '—' },
    { cliente: 'IMAGEN DENTAL AMT',                 monto:  8988.02, mesesActivo: 55, ultimaFactura: '—' },
    { cliente: 'Grupo DC Mexico',                   monto:  8390.00, mesesActivo:  5, ultimaFactura: '—' },
    { cliente: 'Grupo Suma',                        monto:  7190.00, mesesActivo: 17, ultimaFactura: '—' },
    { cliente: 'Cocinas del Futuro AP',             monto:  6201.00, mesesActivo: 39, ultimaFactura: '—' },
    { cliente: 'queplan',                           monto:  4310.00, mesesActivo: 60, ultimaFactura: '—' },
    { cliente: 'ICASA',                             monto:  4144.00, mesesActivo: 18, ultimaFactura: '—' },
    { cliente: 'Pamplona Recolector',               monto:  3500.00, mesesActivo: 94, ultimaFactura: '—' },
    { cliente: 'RM Hoteles',                        monto:  3439.00, mesesActivo: 42, ultimaFactura: '—' },
  ],

  /* 18 cancelados por $44,663.96; el corte solo detalla el Top 5. Los otros 13
     suman $10,110.00 y no se desglosan. */
  cancelados: [
    { cliente: 'Hoteles y Servicios — TOP. Contratado en junio 2026, llegó por Adwords con mucha urgencia tras cambiar de proveedor y cerró rápido pese a la fricción entre perfilamiento y ventas. Empezó con 16 extensiones y terminó con 6 antes de cancelar.', mrr: 10946.98, mesesActivo: 2, acumulado: 32742.00 },
    { cliente: 'Mas Suites — 70 meses activo, el más antiguo de los tres casos clave. El corte no da motivo de la baja.', mrr: 7372.98, mesesActivo: 70, acumulado: 393693.64 },
    { cliente: 'VEMEPE', mrr: 6890.00, mesesActivo: 1, acumulado: 13780.00 },
    { cliente: 'Sofia — cerró en enero 2026 con un plan Min VyC de $2,779 y encadenó upsells (DID, ajustes de VyC) entre enero y abril hasta $6,543/mes. Canceló en agosto.', mrr: 6543.00, mesesActivo: 7, acumulado: 49783.00 },
    { cliente: 'INBROTEK SERVICIOS', mrr: 2801.00, mesesActivo: 45, acumulado: 262104.86 },
  ],

  downgradeTotalReal: 58751.63,
  downgrades: [
    { cliente: 'MEGAVIAL ABOGADOS', perdida: 1407.00, nota: '93% de baja, la mayor en proporción. Quitó Extensión Callcenter ($1,506) y adquirió DiD Nacional ($99): 1,506 − 99 = 1,407 ✓.' },
    { cliente: 'Artesanal.com.mx', perdida: 784.00, nota: '80% de baja. Quitó paquete Min VyC ($979) y adquirió paquete Min CE ($195): 979 − 195 = 784 ✓.' },
    { cliente: 'Hound Express', perdida: 4481.00, nota: '64% de baja y la mayor pérdida del Top 5. Paquete Min VyC de $7,000.00 a $2,519.00 ✓.' },
    { cliente: 'CiberZion', perdida: 1926.74, nota: '49% de baja. Quitó paquete Min CE ($489), bajó el usuario admin adicional de $99 a $50 y el paquete Min VyC de $3,347.74 a $1,959: 489 + 49 + 1,388.74 = 1,926.74 ✓.' },
    { cliente: 'IBC SUITES', perdida: 3741.00, nota: '47% de baja. Paquete Min VyC de $5,800.00 a $2,059.00 ✓. ⚠ Mismo cliente y mismo importe que en la semana 20: o bajó dos veces, o se está contando dos veces.' },
  ],

  downgradeArticulos: [
    { articulo: 'paquete Min VyC — $18,393.69 en 6 casos',     vecesAfectado: 6, clientes: ['Hound Express', 'CiberZion', 'IBC SUITES', 'Artesanal.com.mx'] },
    { articulo: 'Agente CP Chat — $16,817.00 en 2 casos',      vecesAfectado: 2, clientes: ['(el corte no los desglosa)'] },
    { articulo: 'Extensión Callcenter — $8,951.00 en 2 casos', vecesAfectado: 2, clientes: ['MEGAVIAL ABOGADOS'] },
    { articulo: 'paquete Min CE — $1,678.00 en 2 casos',       vecesAfectado: 2, clientes: ['CiberZion'] },
  ],

  suspendidosTotalReal:   46068.43,
  suspendidosCuentasReal: 63,
  suspendidos: [
    { cliente: 'Hard Suspend — 32 cuentas · 21.3 días promedio pendiente de pago. Crece desde las 23 de la semana anterior, y el promedio de días sube de 17.9 a 21.3.', importe: 26457.50, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Soft Suspend — 31 cuentas · 10.9 días promedio pendiente de pago. Crece desde las 23 de la semana anterior.', importe: 19610.93, mesesActivo: 0, estado: 'Suspendido' },
  ],

  desactivadosTotalReal:   20952.98,
  desactivadosCuentasReal: 8,
  desactivados: [
    { cliente: 'Hoteles y Servicios — Cancelado',                importe: 10946.98, mesesActivo: 2 },
    { cliente: 'VEMEPE — Cancelado',                             importe:  6890.00, mesesActivo: 1 },
    { cliente: 'Transmontes — Soft Suspend',                     importe:  1302.00, mesesActivo: 2 },
    { cliente: 'BLACKNET — Hard Suspend',                        importe:   668.00, mesesActivo: 0 },
    { cliente: 'INTERHOME GJ — Hard Suspend',                    importe:   519.00, mesesActivo: 0 },
    { cliente: 'Rentería Flow & Axis Consulting — Hard Suspend', importe:   209.00, mesesActivo: 0 },
    { cliente: 'SMUM México — Soft Suspend',                     importe:   209.00, mesesActivo: 0 },
    { cliente: 'AppGo — Soft Suspend',                           importe:   209.00, mesesActivo: 0 },
  ],

  antiguedadSaldos: [
    { rango: 'Por vencer (total Activo)', monto: 160403.52 },
    { rango: '1–7 días vencido',          monto: 0.00 },
    { rango: '8–15 días vencido',         monto: 19610.93 },
    { rango: '16–30 días vencido',        monto: 25968.50 },
    { rango: 'Más de 30 días',            monto: 489.00 },
  ],
}
