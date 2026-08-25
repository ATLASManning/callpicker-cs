/* ═══════════════════════════════════════════════════════════════════════
   LISTA DE EXCLUSIÓN — CUENTAS EN CANCELACIÓN
   Fuente: canal Slack #alertas-cuentas-canceladas · bot "SAC · Alerta
   Cuentas Canceladas · n8n". Cada envío diario del bot se registra como un
   REPORTE con su fecha real de cancelación.

   SIN INTERFAZ. El módulo "Alertas · Cancelación" de Churn se retiró el
   24 Ago 2026 por decisión de negocio: ese tablero no vive en este
   proyecto. El dataset se conservó y se movió aquí porque NO era solo
   presentación — alimenta dos reglas de backend:
     · lib/elegibilidad.ts  → excluye cuentas en cancelación de las
                              Actividades SAC (por CID y por nombre).
     · app/api/radar/route.ts → marca cuentas con alerta de cancelación.
   Borrar este archivo desactiva ambas exclusiones.

   Para agregar un nuevo día: añadir un objeto más a REPORTES_CANCELACION.
   NO se modifican los reportes anteriores.
═══════════════════════════════════════════════════════════════════════ */

export interface CuentaAlertaCancelacion {
  cliente: string
  /** CID de Zoho · 's/d' cuando el reporte no lo trae */
  cid: string
  /** null = "sin registro" en la fuente */
  ultimoPagoMonto: number | null
  /** YYYY-MM-DD · null = sin dato */
  ultimoPagoFecha: string | null
  /** null = "sin dato" en la fuente */
  mesesEnCallpicker: number | null
  /** YYYY-MM-DD · null = sin dato */
  primerPagoFecha: string | null
  /** null = "sin dato" en la fuente */
  ltv: number | null
  servicio: string
  /** Nota libre para casos especiales o inconsistencias detectadas */
  notaEspecial?: string
  /** URL real del ticket en Zoho Desk, cuando se comparta */
  ticketUrl?: string
}

export interface ReporteCancelacion {
  /** Fecha de cancelación reportada · YYYY-MM-DD */
  fecha: string
  /** Hora del envío del bot — un mismo día puede tener varios reportes */
  hora?: string
  cuentas: CuentaAlertaCancelacion[]
  /** LTV total que reporta el propio bot (verificado: coincide con la suma) */
  ltvTotalReportado: number | null
  /** Tickets de cancelación que el bot no pudo asociar a una cuenta */
  ticketsSinIdentificar: number
}

export const REPORTES_CANCELACION: ReporteCancelacion[] = [
  {
    fecha: '2026-08-11', hora: '08:30', ltvTotalReportado: 65504.13, ticketsSinIdentificar: 2,
    cuentas: [
      { cliente: 'Red Box Mexico', cid: 's/d', ultimoPagoMonto: 196.04, ultimoPagoFecha: '2026-07-20', mesesEnCallpicker: 50, primerPagoFecha: '2022-05-24', ltv: 7110.78, servicio: 'Comunicación Empresarial 60 minutos', notaEspecial: 'El reporte no trae CID. Se repitió en el corte del 12 ago con datos idénticos.' },
      { cliente: 'Tropicalia', cid: '102865', ultimoPagoMonto: 652.33, ultimoPagoFecha: '2026-06-14', mesesEnCallpicker: 52, primerPagoFecha: '2022-02-27', ltv: 22668.30, servicio: 'Comunicación Empresarial 400 minutos' },
      { cliente: 'GS Trackme - Sercurezza', cid: '81374', ultimoPagoMonto: 635.68, ultimoPagoFecha: '2026-06-19', mesesEnCallpicker: 58, primerPagoFecha: '2021-08-06', ltv: 32407.98, servicio: '1 Licencia Callpicker sin saldo' },
      { cliente: 'NEXUM', cid: '181272', ultimoPagoMonto: 1576.52, ultimoPagoFecha: '2026-07-23', mesesEnCallpicker: 2, primerPagoFecha: '2026-05-20', ltv: 3317.07, servicio: 'Visibilidad y Control 400 minutos' },
    ],
  },
  {
    fecha: '2026-08-12', hora: '08:30', ltvTotalReportado: 307880.44, ticketsSinIdentificar: 2,
    cuentas: [
      { cliente: 'INBROTEK SERVICIOS', cid: '129593', ultimoPagoMonto: 4563.32, ultimoPagoFecha: '2026-08-11', mesesEnCallpicker: 45, primerPagoFecha: '2022-11-02', ltv: 300769.66, servicio: 'Visibilidad y Control 4,500 minutos', notaEspecial: 'LTV más alto registrado en el módulo ($300K).' },
      { cliente: 'Red Box Mexico', cid: 's/d', ultimoPagoMonto: 196.04, ultimoPagoFecha: '2026-07-20', mesesEnCallpicker: 50, primerPagoFecha: '2022-05-24', ltv: 7110.78, servicio: 'Comunicación Empresarial 60 minutos', notaEspecial: 'Repetición del corte del 11 ago (datos idénticos) — no se cuenta dos veces en KPIs ni LTV.' },
    ],
  },
  {
    fecha: '2026-08-13', hora: '08:30', ltvTotalReportado: 54985.56, ticketsSinIdentificar: 4,
    cuentas: [
      { cliente: 'EURO STERN', cid: '181577', ultimoPagoMonto: null, ultimoPagoFecha: null, mesesEnCallpicker: null, primerPagoFecha: null, ltv: null, servicio: 'Visibilidad y Control IP 5,000 min' },
      { cliente: 'EMPRESAS BASGON Y BASANT', cid: '25769', ultimoPagoMonto: 1026.60, ultimoPagoFecha: '2026-06-03', mesesEnCallpicker: 80, primerPagoFecha: '2019-10-01', ltv: 54985.56, servicio: 'Comunicación Empresarial 400 minutos' },
    ],
  },
  {
    fecha: '2026-08-14', hora: '08:30', ltvTotalReportado: 105705.59, ticketsSinIdentificar: 3,
    cuentas: [
      { cliente: 'COESPRO', cid: '93000', ultimoPagoMonto: 671.64, ultimoPagoFecha: '2026-07-02', mesesEnCallpicker: 55, primerPagoFecha: '2021-12-06', ltv: 27989.65, servicio: 'Comunicación Empresarial 800 minutos' },
      { cliente: 'Sheep', cid: '2201', ultimoPagoMonto: 899.00, ultimoPagoFecha: '2026-06-15', mesesEnCallpicker: 111, primerPagoFecha: '2017-03-23', ltv: 77715.94, servicio: '2 Extensiones Visibilidad y Control IL con SIM', notaEspecial: 'Cuenta más antigua del módulo: 111 meses (desde mar 2017).' },
      { cliente: 'Delta Capital y Holding Street', cid: '185835', ultimoPagoMonto: 9601.32, ultimoPagoFecha: '2026-06-29', mesesEnCallpicker: null, primerPagoFecha: null, ltv: null, servicio: 'Visibilidad y Control 400 minutos', notaEspecial: 'Último pago de $9,601.32 pero sin LTV ni antigüedad registrados — dato incompleto en la fuente.' },
    ],
  },
  {
    fecha: '2026-08-15', hora: '08:30', ltvTotalReportado: 127239.91, ticketsSinIdentificar: 0,
    cuentas: [
      { cliente: 'Hotel kaan', cid: '180514', ultimoPagoMonto: 1135.64, ultimoPagoFecha: '2026-06-24', mesesEnCallpicker: 2, primerPagoFecha: '2026-04-15', ltv: 2937.00, servicio: 'Visibilidad y Control 400 minutos' },
      { cliente: 'ADG Proctel Ferreteros', cid: '173487', ultimoPagoMonto: 174.00, ultimoPagoFecha: '2025-07-21', mesesEnCallpicker: 11, primerPagoFecha: '2025-07-15', ltv: 1938.00, servicio: '10% Comunicación Empresarial 60 minutos' },
      { cliente: 'Pauliu', cid: '173457', ultimoPagoMonto: 2100.01, ultimoPagoFecha: '2025-07-15', mesesEnCallpicker: 11, primerPagoFecha: '2025-07-15', ltv: 1810.44, servicio: '10% Comunicación Empresarial 60 minutos' },
      { cliente: 'Martin Tours', cid: '173381', ultimoPagoMonto: 2074.08, ultimoPagoFecha: '2025-07-15', mesesEnCallpicker: 11, primerPagoFecha: '2025-07-15', ltv: 1788.00, servicio: 'Anualidad Comunicación Empresarial 60 min' },
      { cliente: 'The Brokers Real Estate Cancún', cid: '135585', ultimoPagoMonto: 567.24, ultimoPagoFecha: '2026-06-22', mesesEnCallpicker: 40, primerPagoFecha: '2023-02-23', ltv: 16699.35, servicio: 'Comunicación Empresarial 400 minutos' },
      { cliente: 'GMRV Consultoría Administrativa', cid: '13880', ultimoPagoMonto: 567.24, ultimoPagoFecha: '2026-06-18', mesesEnCallpicker: 90, primerPagoFecha: '2018-12-07', ltv: 102067.12, servicio: 'Comunicación Empresarial 400 minutos' },
      {
        cliente: 'Solicitud de baja del servicio y suspensión de cobros — 98 18 15 66', cid: '55',
        ultimoPagoMonto: null, ultimoPagoFecha: null, mesesEnCallpicker: null, primerPagoFecha: null, ltv: null,
        servicio: '—',
        notaEspecial: 'Sin historial de pagos: la cuenta nunca facturó (demo que no convirtió).',
      },
    ],
  },
  {
    fecha: '2026-08-16', hora: '08:30', ltvTotalReportado: 157876.35, ticketsSinIdentificar: 0,
    cuentas: [
      { cliente: 'Dios Del Aire CLN', cid: '182556', ultimoPagoMonto: 567.24, ultimoPagoFecha: '2026-06-16', mesesEnCallpicker: 2, primerPagoFecha: '2026-06-16', ltv: 489.00, servicio: 'Comunicación Empresarial 400 minutos' },
      { cliente: 'VALLMON', cid: '151689', ultimoPagoMonto: 172.84, ultimoPagoFecha: '2026-06-20', mesesEnCallpicker: 29, primerPagoFecha: '2024-01-09', ltv: 4470.00, servicio: 'Conmutador Virtual CE 60 minutos' },
      { cliente: 'Housebook Real Estate', cid: '149301', ultimoPagoMonto: 1079.96, ultimoPagoFecha: '2026-06-16', mesesEnCallpicker: 31, primerPagoFecha: '2023-11-14', ltv: 11706.90, servicio: 'Comunicación empresarial 400 minutos con grabación' },
      { cliente: 'The Brokers Real Estate', cid: '89032', ultimoPagoMonto: 567.24, ultimoPagoFecha: '2026-06-22', mesesEnCallpicker: 56, primerPagoFecha: '2021-10-18', ltv: 24523.35, servicio: 'Comunicación Empresarial 400 minutos', notaEspecial: 'Segunda cuenta del grupo "The Brokers" — la de Cancún (CID 135585) canceló el 15 ago.' },
      { cliente: 'CGP CREATIVOS', cid: '44008', ultimoPagoMonto: 767.17, ultimoPagoFecha: '2026-06-22', mesesEnCallpicker: 72, primerPagoFecha: '2020-06-24', ltv: 116687.10, servicio: 'Comunicación Empresarial 400 minutos' },
    ],
  },
  {
    fecha: '2026-08-17', hora: '08:30', ltvTotalReportado: 35819.14, ticketsSinIdentificar: 0,
    cuentas: [
      { cliente: 'Óptica On Global', cid: '177681', ultimoPagoMonto: 226.20, ultimoPagoFecha: '2026-06-25', mesesEnCallpicker: 6, primerPagoFecha: '2025-12-17', ltv: 1365.00, servicio: 'Comunicación Empresarial 60 minutos' },
      { cliente: 'Centro de Capacitación y Resultados', cid: '48688', ultimoPagoMonto: 652.33, ultimoPagoFecha: '2026-06-17', mesesEnCallpicker: 70, primerPagoFecha: '2020-08-10', ltv: 32807.14, servicio: 'Comunicación Empresarial 400 minutos' },
      {
        cliente: 'TECHNO SECURITY MEXICO', cid: '30540',
        ultimoPagoMonto: 756.73, ultimoPagoFecha: '2026-06-18', mesesEnCallpicker: 2, primerPagoFecha: '2018-11-13', ltv: 1647.00,
        servicio: 'Comunicación Empresarial 400 minutos',
        notaEspecial: 'Dato fuente inconsistente: primer pago 2018 pero "meses en Callpicker" reportado como 2 (serían ~93) — verificar con Zoho.',
      },
    ],
  },
  {
    fecha: '2026-08-18', hora: '08:30', ltvTotalReportado: 417009.66, ticketsSinIdentificar: 0,
    cuentas: [
      { cliente: 'A reservar', cid: '179952', ultimoPagoMonto: 416.44, ultimoPagoFecha: '2026-07-13', mesesEnCallpicker: 4, primerPagoFecha: '2026-03-18', ltv: 1436.00, servicio: 'Plan Emprendedor 200 minutos', notaEspecial: 'Ya reportada como Suspendida ($359) en el análisis DATA Semana 2 · Ago 2026.' },
      { cliente: 'LUNAH ECO-RESORTS', cid: '115829', ultimoPagoMonto: 682.08, ultimoPagoFecha: '2026-06-26', mesesEnCallpicker: 48, primerPagoFecha: '2022-06-06', ltv: 26550.00, servicio: 'Comunicación Empresarial 400 minutos', notaEspecial: 'Cuenta distinta de "Lunah Eco-resorts CDMX" (CID 136200), que canceló el mismo día. Historial previo en Churn como cancelada/suspendida — verificar duplicidad de registro.' },
      { cliente: 'Uno Suministros', cid: '55428', ultimoPagoMonto: 2040.44, ultimoPagoFecha: '2026-06-22', mesesEnCallpicker: 68, primerPagoFecha: '2020-10-29', ltv: 227120.82, servicio: '2 Extensiones Visibilidad y Control IL con SIM', notaEspecial: 'Ya reportada como Desactivada ($1,759) en un corte semanal previo.' },
      { cliente: 'Hause Arq.', cid: '135918', ultimoPagoMonto: 196.04, ultimoPagoFecha: '2026-06-07', mesesEnCallpicker: 39, primerPagoFecha: '2023-03-03', ltv: 5738.35, servicio: 'Comunicación Empresarial 60 minutos' },
      { cliente: 'Mobiliario Médico Nacional', cid: '2490', ultimoPagoMonto: 567.24, ultimoPagoFecha: '2026-06-07', mesesEnCallpicker: 110, primerPagoFecha: '2017-04-05', ltv: 51158.60, servicio: 'Comunicación Empresarial 400 minutos' },
      {
        cliente: 'Travelling', cid: '176205',
        ultimoPagoMonto: 15120.60, ultimoPagoFecha: '2026-06-10', mesesEnCallpicker: 7, primerPagoFecha: '2025-10-07', ltv: 105005.89,
        servicio: '4 Extensiones VyC Callcenter con 1,250 min',
        notaEspecial: '⚠️ CONTRADICCIÓN CON GRC AAA: ahí figura como "Churn confirmado" con MRR fin $0 y pérdida de $12,922 (acumulado $102,583.98). Aquí reporta último pago de $15,120.60 el 10/06/2026 y LTV $105,005.89. Aclarar con DATA cuál es el estado vigente.',
      },
    ],
  },
  {
    fecha: '2026-08-18', hora: '12:57', ltvTotalReportado: null, ticketsSinIdentificar: 0,
    cuentas: [
      { cliente: 'Lunah Eco-resorts CDMX', cid: '136200', ultimoPagoMonto: 425.72, ultimoPagoFecha: '2026-06-29', mesesEnCallpicker: 41, primerPagoFecha: '2023-03-09', ltv: 12614.85, servicio: 'Comunicación Empresarial 60 minutos', notaEspecial: 'Cuenta distinta de "LUNAH ECO-RESORTS" (CID 115829), reportada el mismo día en el corte de las 08:30.' },
      {
        cliente: 'ARAC GRUPO INMOBILIARIO', cid: '188997',
        ultimoPagoMonto: null, ultimoPagoFecha: null, mesesEnCallpicker: 16, primerPagoFecha: '2017-02-01', ltv: 118804.30,
        servicio: 'Prueba sin Costo',
        notaEspecial: '⚠️ Tres inconsistencias en la fuente: (1) "Prueba sin Costo" pero LTV de $118,804.30; (2) sin registro de último pago pese a ese LTV; (3) primer pago 2017 con solo 16 meses reportados (serían ~114). Verificar en Zoho antes de contabilizar la pérdida.',
      },
      {
        cliente: 'demo julio 001', cid: '188968',
        ultimoPagoMonto: null, ultimoPagoFecha: null, mesesEnCallpicker: null, primerPagoFecha: null, ltv: null,
        servicio: 'Prueba sin Costo',
        notaEspecial: 'Sin historial de pagos: la cuenta nunca facturó (demo que no convirtió).',
      },
    ],
  },
]

/** Clave de identidad: CID cuando existe; si no, el nombre normalizado. */
function claveCuenta(c: CuentaAlertaCancelacion): string {
  if (c.cid && c.cid !== 's/d') return `cid:${c.cid}`
  return `nom:${c.cliente.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')}`
}

/** Cada cuenta con la fecha del reporte en que apareció (incluye repeticiones). */
export const CANCELACIONES_POR_FECHA: Array<CuentaAlertaCancelacion & { fechaCancelacion: string; hora?: string }> =
  REPORTES_CANCELACION.flatMap(r => r.cuentas.map(c => ({ ...c, fechaCancelacion: r.fecha, hora: r.hora })))

/**
 * Cuentas ÚNICAS (una entrada por cliente real), conservando la PRIMERA
 * fecha en que fue reportada. Es la lista que alimenta los KPIs, el LTV
 * total y el gráfico — así una cuenta repetida en dos cortes (p.ej.
 * Red Box Mexico, 11 y 12 ago) no se contabiliza ni suma su LTV dos veces.
 */
export const ALERTAS_CANCELACION: Array<CuentaAlertaCancelacion & { fechaCancelacion: string }> = (() => {
  const vistas = new Set<string>()
  const out: Array<CuentaAlertaCancelacion & { fechaCancelacion: string }> = []
  for (const c of CANCELACIONES_POR_FECHA) {
    const k = claveCuenta(c)
    if (vistas.has(k)) continue
    vistas.add(k)
    out.push(c)
  }
  return out
})()

/** Total de tickets de cancelación que el bot no pudo asociar a una cuenta. */
export const TICKETS_SIN_IDENTIFICAR = REPORTES_CANCELACION.reduce((s, r) => s + r.ticketsSinIdentificar, 0)
