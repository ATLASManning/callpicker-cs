/**
 * Corte vigente de Gross Revenue Churn.
 *
 * Separado de `page.tsx` para que Atlas (servidor) y el módulo Churn (cliente)
 * lean exactamente las mismas cifras. Al cargar un corte nuevo, este archivo se
 * reemplaza y el anterior se archiva dentro de `page.tsx`.
 */
import type { ChurnReporte } from './tipos'

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 19 · SEPTIEMBRE 2026  (8 sep 2026)
   Cierre de agosto y arranque de septiembre. Remitente: Valeria Zepeda
   Hernández (equipo Data).
═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S19_SEPTIEMBRE_2026: ChurnReporte = {
  id:      's19-septiembre-2026',
  periodo: 'Semana 19 · Sep 2026',
  fecha:   '08/09/2026',
  notas:   'Gross Revenue Churn · Semana 19. Al 8 de septiembre del 2026. Cierra agosto con los pocos clientes Activos que quedaron con pago pendiente de julio, y arranca septiembre con el Top 10 de cuentas Activas, el resumen de Hard Suspend / Soft Suspend / Cancelados, la antigüedad de la cartera por cobrar y los downgrades del mes ordenados de mayor a menor reducción. Próxima revisión: miércoles 16 de septiembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 16 de septiembre.',

  grc: {
    evolucion: [
      { mes: 'Julio',                pct: 2.1 },
      { mes: 'Agosto',               pct: 3.4, anterior: 4.9 },
    ],
    acumulado: 18.6,
    anterior:  20.1,
    notaClave: 'Churn Q3: Julio 2.1% · Agosto corregido a la baja de 4.9% a 3.4%. Churn acumulado hasta agosto 2026: 18.6% — MES CORRIENDO, NO DEFINITIVO (ant. 20.1%).',
    notaEspecial:
      '🚨 ALERTA DE DOWNGRADE POR ENCIMA DEL PROMEDIO: a sólo 8 días de septiembre ya se acumula más de la mitad del downgrade que correspondería al mes completo. El promedio mensual ronda los $39,092.19 y al 8 de septiembre el reporte declara $37,398.30. ' +
      '⚠️ DESCUADRE A CONCILIAR: esa cifra de alerta ($37,398.30) NO coincide con la tabla de downgrades del mismo correo, que lista 9 clientes y suma exactamente $34,530.03. La diferencia es de $2,868.27 y el reporte no la explica. Las dos cifras se conservan tal como llegaron: no se elige una sobre la otra hasta que el equipo Data aclare qué incluye la de la alerta. ' +
      '💰 DINERO FUERA DE LA CARTERA: $34,573.96 en 16 cuentas — Hard Suspend 4 cuentas · $2,105.00 · 18.8 días promedio pendiente de pago · Soft Suspend 6 cuentas · $14,697.98 · 10.7 días · Cancelados 6 cuentas · $17,770.98. ' +
      '📌 CIERRE DE AGOSTO — 5 clientes siguen en estatus Activo (ni Hard ni Soft Suspend) pero su última factura pagada es de julio, $24,533.28 en total: TATSA $11,086.00 (24/07) · AS CONSULTING $4,745.00 (07/07) · GVA - República Dominicana $3,884.28 (21/07) · TAQUERIA EL PARIENTE $3,500.00 (29/07) · syndeX $1,318.00 (21/07). Ese monto es exactamente el tramo "Más de 30 días" de la antigüedad de saldos. ' +
      '🔗 NOTA GTC: el cliente unió dos de sus cuentas — las subcuentas GTC - CARRANZA y GTC - LOMAS juntaron su cuenta de facturación. Conviene tenerlo presente al comparar contra cortes anteriores, donde aparecían por separado. ' +
      '📋 MOTIVOS DE CANCELACIÓN del mes: Cambio interno 3 · Migración a otro proveedor 1 · Falta de valor percibido 1. El sexto caso (Mexico Development Center) fue por Cierre de operaciones, motivo fuera de esas tres categorías. Las notas provienen del equipo de SAC directamente del cliente.',
  },

  /* Top 10 · Cuentas Activo de septiembre — total cartera Activo $136,410.47 en 90 cuentas.
     Las 5 cuentas Activas con pago pendiente de julio ($24,533.28) NO están incluidas
     en esta cifra: son un tramo aparte de la antigüedad de saldos (+30 días) y se
     detallan íntegras en notaEspecial. */
  pendientesTotalReal:   136410.47,
  pendientesCuentasReal: 90,
  pendientes: [
    { cliente: '🔝 Neruc Sede Central',              monto: 13538.97, mesesActivo: 63, ultimaFactura: 'Activo' },
    { cliente: 'ALARMAS GUARDIAN',                   monto: 11324.00, mesesActivo: 40, ultimaFactura: 'Activo' },
    { cliente: 'Grupo Guía',                         monto: 5589.00,  mesesActivo: 87, ultimaFactura: 'Activo' },
    { cliente: 'Petroil - Centro de Ayuda TI',       monto: 4771.00,  mesesActivo: 36, ultimaFactura: 'Activo' },
    { cliente: 'Colegio NWL - Campus Juriquilla',    monto: 4526.00,  mesesActivo: 41, ultimaFactura: 'Activo' },
    { cliente: 'PIXKITEC',                           monto: 4424.00,  mesesActivo: 80, ultimaFactura: 'Activo' },
    { cliente: 'X-Gas',                              monto: 4100.00,  mesesActivo: 4,  ultimaFactura: 'Activo' },
    { cliente: 'Petroil - Colosio Mzt',              monto: 3893.00,  mesesActivo: 51, ultimaFactura: 'Activo' },
    { cliente: 'Petroil - Torre de Control',         monto: 3839.00,  mesesActivo: 50, ultimaFactura: 'Activo' },
    { cliente: 'Instituto Simon Bolivar',            monto: 3748.00,  mesesActivo: 27, ultimaFactura: 'Activo' },
    { cliente: '+ 80 cuentas adicionales en Activo de septiembre — el reporte no desglosa sus nombres.', monto: 76657.50, mesesActivo: 0, ultimaFactura: 'Activo' },
  ],

  /* Cancelados al 8 de septiembre — 6 cuentas · $17,770.98.
     El reporte SÍ trae el motivo declarado por el cliente vía SAC: se conserva
     íntegro en la nota, porque es la información que el ritual de aclaración de
     bajas exige y la que más cuesta recuperar después. */
  cancelados: [
    { cliente: '🔝 Mas Suites',              mrr: 7372.98, mesesActivo: 70, acumulado: 393693.64 },
    { cliente: 'Sofia',                      mrr: 6543.00, mesesActivo: 7,  acumulado: 49783.00  },
    { cliente: 'GESTICAL',                   mrr: 2589.00, mesesActivo: 12, acumulado: 33657.00  },
    { cliente: 'VAQCSA Corregidora',         mrr: 928.00,  mesesActivo: 22, acumulado: 39143.00  },
    { cliente: 'Orion',                      mrr: 169.00,  mesesActivo: 48, acumulado: 6891.85   },
    { cliente: 'Mexico Development Center',  mrr: 169.00,  mesesActivo: 72, acumulado: 10690.00  },
  ],

  /* Downgrades septiembre (al día 8) — 9 clientes · $34,530.03, ordenados por
     % de reducción de mayor a menor. Ver el descuadre señalado en notaEspecial:
     la alerta del propio correo declara $37,398.30. */
  downgradeTotalReal: 34530.03,
  downgrades: [
    { cliente: '🔝 Mas clic',                              perdida: 9238.01, nota: '97% de baja — la mayor reducción porcentual del mes. DiD Nacional $345 → $207 · canceló paquete 800 ($135) y paquete Min Calltracking ($8,965.01).' },
    { cliente: 'Sermedi Mx',                               perdida: 1189.00, nota: '92% de baja. Canceló paquete Min CE ($1,189).' },
    { cliente: 'Hound Express',                            perdida: 4481.00, nota: '64% de baja. Paquete Min VyC $7,000 → $4,481.' },
    { cliente: 'Lineacel',                                 perdida: 9618.00, nota: '58% de baja — el mayor monto del mes. Agente CP Chat $1,400 → $519 · paquete WhatsApp API $22,020 → $8,165. Adquirió Extensión Callcenter, Ofuscador y paquete Campañas (upsell parcial en la misma cuenta).' },
    { cliente: 'Corporativo grupo funerario San Javier',   perdida: 1959.00, nota: '44% de baja. Canceló paquete Min VyC ($1,959).' },
    { cliente: 'Multiburó',                                perdida: 1189.00, nota: '37% de baja. Paquete Min CE $3,068 → $1,879.' },
    { cliente: 'ISAGAS',                                   perdida: 1047.00, nota: '33% de baja. Canceló Extensión Callcenter ($2,792) y adquirió 5 Extensiones SIP Visibilidad y Control ($1,745) — es una sustitución, no una baja limpia.' },
    { cliente: 'GBS Cuenta Maestra',                       perdida: 2408.00, nota: '22% de baja. DiD Nacional $1,050 → $660 · paquete Min VyC $9,790 → $7,772.' },
    { cliente: 'Salud y Hogar',                            perdida: 3401.02, nota: '12% de baja. Quitó Plan Celular, paquete Chatbot y paquete Min Voicebot ($5,801 en total), con upsell en DiD Nacional y Extensión VyC con SIM que compensa parte de la pérdida.' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Min VyC',            vecesAfectado: 3, clientes: ['Hound Express', 'Corporativo grupo funerario San Javier', 'GBS Cuenta Maestra'] },
    { articulo: 'DiD Nacional',               vecesAfectado: 2, clientes: ['Mas clic', 'GBS Cuenta Maestra'] },
    { articulo: 'Paquete Min CE',             vecesAfectado: 2, clientes: ['Sermedi Mx', 'Multiburó'] },
    { articulo: 'Extensión Callcenter',       vecesAfectado: 1, clientes: ['ISAGAS'] },
    { articulo: 'Agente CP Chat',             vecesAfectado: 1, clientes: ['Lineacel'] },
    { articulo: 'Paquete WhatsApp API',       vecesAfectado: 1, clientes: ['Lineacel'] },
    { articulo: 'Paquete Min Calltracking',   vecesAfectado: 1, clientes: ['Mas clic'] },
    { articulo: 'Paquete 800',                vecesAfectado: 1, clientes: ['Mas clic'] },
    { articulo: 'Plan Celular',               vecesAfectado: 1, clientes: ['Salud y Hogar'] },
    { articulo: 'Paquete Chatbot',            vecesAfectado: 1, clientes: ['Salud y Hogar'] },
    { articulo: 'Paquete Min Voicebot',       vecesAfectado: 1, clientes: ['Salud y Hogar'] },
  ],

  /* Antigüedad de la cartera por cobrar — total $177,746.73.
     Incluye Activo + Hard Suspend + Soft Suspend. Cancelado NO se considera
     parte de la cartera por cobrar. "Por vencer" es el total Activo de
     septiembre: este corte no trae desglose de días por cuenta. */
  antiguedadSaldos: [
    { rango: 'Por vencer',          monto: 136410.47 },
    { rango: '1 – 7 días vencido',  monto: 419.00 },
    { rango: '8 – 15 días vencido', monto: 14278.98 },
    { rango: '16 – 30 días vencido',monto: 2105.00 },
    { rango: 'Más de 30 días',      monto: 24533.28 },
  ],

  /* Fuera de cartera — Hard Suspend 4 cuentas · $2,105.00 · 18.8 días promedio
     y Soft Suspend 6 cuentas · $14,697.98 · 10.7 días. El reporte no desglosa
     nombres en ninguno de los dos estados. Total 10 cuentas · $16,802.98. */
  suspendidosTotalReal:   16802.98,
  suspendidosCuentasReal: 10,
  suspendidos: [
    { cliente: 'Hard Suspend — 4 cuentas · 18.8 días promedio pendiente de pago. El reporte no desglosa nombres. Corresponde al tramo de 16 a 30 días vencido de la antigüedad de saldos.', importe: 2105.00,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Soft Suspend — 6 cuentas · 10.7 días promedio pendiente de pago. El reporte no desglosa nombres. Corresponde a los tramos de 1 a 7 y de 8 a 15 días vencido ($419.00 + $14,278.98).', importe: 14697.98, mesesActivo: 0, estado: 'Suspendido' },
  ],
}
