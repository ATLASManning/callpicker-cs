/**
 * Corte vigente de Gross Revenue Churn.
 *
 * Separado de `page.tsx` para que Atlas (servidor) y el módulo Churn (cliente)
 * lean exactamente las mismas cifras. Al cargar un corte nuevo, este archivo se
 * reemplaza y el anterior se archiva dentro de `page.tsx`.
 */
import type { ChurnReporte } from './tipos'

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 18 · CIERRE AGOSTO 2026  (1 sep 2026)
   Primer envío con la nueva cadencia semanal en martes.
═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S18_AGOSTO_2026: ChurnReporte = {
  id:      's18-agosto-2026',
  periodo: 'Semana 18 · Cierre Ago 2026',
  fecha:   '01/09/2026',
  notas:   'Gross Revenue Churn · Semana 18. Cierre de agosto del 2026. Corrección a la baja del GRC de agosto, cartera en Activo de 50 cuentas, dinero fuera de cartera por estado con días promedio, antigüedad de saldos y downgrades del mes. Cambio de cadencia: el reporte pasa a enviarse semanalmente los martes. Próxima revisión: martes 8 de septiembre.',
  notaRemitente: 'Daniel Martínez — El reporte pasa a enviarse los martes. Próxima revisión: martes 8 de septiembre.',

  grc: {
    evolucion: [
      { mes: 'Julio',             pct: 2.1, anterior: 2.2  },
      { mes: 'Agosto (en curso)', pct: 4.9, anterior: 17.0 },
    ],
    acumulado: 20.1,
    anterior:  36.9,
    notaClave: 'Churn Q3: Julio 2.1% (ant. 2.2%) · Agosto 4.9% (ant. 17.0%) — corrección a la baja por pagos confirmados. Churn acumulado hasta agosto 2026: 20.1% — MES CORRIENDO, NO DEFINITIVO (ant. 36.9%).',
    notaEspecial: '💰 Dinero fuera de cartera: $72,631.00 en 71 cuentas — Suspendidos 27 cuentas · $18,692 · 25.2 días promedio · Desactivados 23 cuentas · $33,899 · 11.9 días promedio · Cancelados 21 cuentas · $20,040. Nota GTC: la pérdida acumulada en "Paquete Ops Automatizaciones" suma $7,316.72 considerando todas las subcuentas del grupo. ⚠️ Nota UniverMilenium: los $17,914.00 NO son un downgrade — corresponde a una segunda factura que no se generó; el monto queda excluido de los totales de downgrade del mes. 🔎 Dos puntos a conciliar con Daniel Martínez antes de tomarlos como definitivos: (1) el reporte da como valor anterior de agosto 17.0%, mientras que el corte de la semana 3 publicó 21.6% — la diferencia del acumulado (36.9% → 20.1% = 16.8 pts) sí corresponde a 21.6 → 4.9; (2) los downgrades del mes listan 11 clientes por $22,544.58 y no incluyen a Grupo Hodaya - Holtz ($3,274), ZD - Midstorage ($1,761) ni DRENVIO ($1,230), que sí se reportaron como downgrades de agosto en la semana 3.',
  },

  /* Cartera en Activo al cierre de agosto — top 10 de 50 cuentas · $124,565.62 */
  pendientesTotalReal:   124565.62,
  pendientesCuentasReal: 50,
  pendientes: [
    { cliente: '🔝 Alianza Multimarca',        monto: 26594.00, mesesActivo: 32, ultimaFactura: 'Activo' },
    { cliente: 'GTC-CARRANZA',                 monto: 23113.62, mesesActivo: 5,  ultimaFactura: 'Activo' },
    { cliente: 'TATSA',                        monto: 11086.00, mesesActivo: 1,  ultimaFactura: 'Activo' },
    { cliente: 'GTC-LOMAS',                    monto: 10953.37, mesesActivo: 5,  ultimaFactura: 'Activo' },
    { cliente: 'AS CONSULTING',                monto: 4745.00,  mesesActivo: 0,  ultimaFactura: 'Activo' },
    { cliente: 'queplan',                      monto: 4310.00,  mesesActivo: 59, ultimaFactura: 'Activo' },
    { cliente: 'GVA-República Dominicana',     monto: 3884.28,  mesesActivo: 30, ultimaFactura: 'Activo' },
    { cliente: 'TAQUERIA EL PARIENTE',         monto: 3500.00,  mesesActivo: 85, ultimaFactura: 'Activo' },
    { cliente: 'Ncubo Capital',                monto: 3169.00,  mesesActivo: 40, ultimaFactura: 'Activo' },
    { cliente: 'jemmoma',                      monto: 2634.00,  mesesActivo: 89, ultimaFactura: 'Activo' },
    { cliente: '+ 40 cuentas adicionales en Activo — el reporte no desglosa sus nombres.', monto: 30576.35, mesesActivo: 0, ultimaFactura: 'Activo' },
  ],

  /* Cancelados agosto — 21 cuentas · $20,040. El corte de cierre no desglosa nombres;
     el detalle por cuenta está en los cortes semanales de agosto. */
  cancelados: [
    { cliente: '+ 21 cuentas canceladas en agosto — el reporte de cierre no desglosa nombres (ver cortes semanales 2 y 3 de agosto).', mrr: 20040, mesesActivo: 0, acumulado: 0 },
  ],

  /* Downgrades agosto — 11 clientes · $22,544.58 (excluye UniverMilenium) */
  downgradeTotalReal: 22544.58,
  downgrades: [
    { cliente: '🔝 INBROTEK SERVICIOS', perdida: 6915.96, nota: '71% de baja — mayor reducción porcentual y mayor monto del mes.' },
    { cliente: 'Embler Autopartes',     perdida: 3281.00, nota: '61% de baja.' },
    { cliente: 'Chemical Broker',       perdida: 1419.00, nota: '59% de baja.' },
    { cliente: 'City HUB',              perdida: 3240.00, nota: '55% de baja. Ya reportado en el corte de la semana 3 de agosto.' },
    { cliente: "Pipolo's",              perdida: 1400.00, nota: '41% de baja. Ya reportado en el corte de la semana 3 de agosto.' },
    { cliente: 'transportes BPG',       perdida: 978.00,  nota: '39% de baja. Aparece además como desactivado en el corte de la semana 3.' },
    { cliente: 'KINEOUMF',              perdida: 898.00,  nota: '19% de baja.' },
    { cliente: 'GTC-CENTRO MAX',        perdida: 1277.71, nota: '3% de baja — Paquete Ops Automatizaciones.' },
    { cliente: 'GTC-NAVA',              perdida: 1277.71, nota: '3% de baja — Paquete Ops Automatizaciones.' },
    { cliente: 'GTC-FORUM',             perdida: 929.02,  nota: '3% de baja — Paquete Ops Automatizaciones.' },
    { cliente: 'GTC-BMW',               perdida: 928.18,  nota: '3% de baja — Paquete Ops Automatizaciones.' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Ops Automatizaciones (GTC)', vecesAfectado: 4, clientes: ['GTC-CENTRO MAX', 'GTC-NAVA', 'GTC-FORUM', 'GTC-BMW'] },
  ],

  /* Antigüedad de saldos al cierre de agosto — total $177,156.62 */
  antiguedadSaldos: [
    { rango: 'Por vencer',   monto: 22284.78 },
    { rango: '1 – 7 días',   monto: 59066.45 },
    { rango: '8 – 15 días',  monto: 42362.40 },
    { rango: '16 – 30 días', monto: 16792.00 },
    { rango: '+ 30 días',    monto: 36650.99 },
  ],

  /* Fuera de cartera — Suspendidos 27 cuentas · $18,692 · 25.2 días promedio */
  suspendidosTotalReal:   18692,
  suspendidosCuentasReal: 27,
  suspendidos: [
    { cliente: '27 cuentas suspendidas al cierre de agosto — 25.2 días promedio en ese estado. El reporte de cierre no desglosa nombres.', importe: 18692, mesesActivo: 0, estado: 'Suspendido' },
  ],

  /* Fuera de cartera — Desactivados 23 cuentas · $33,899 · 11.9 días promedio */
  desactivadosTotalReal:   33899,
  desactivadosCuentasReal: 23,
  desactivados: [
    { cliente: '23 cuentas desactivadas al cierre de agosto — 11.9 días promedio en ese estado. El reporte de cierre no desglosa nombres.', importe: 33899, mesesActivo: 0 },
  ],
}
