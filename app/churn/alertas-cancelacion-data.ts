/* ═══════════════════════════════════════════════════════════════════════
   ALERTAS: CUENTAS CANCELACIÓN
   Fuente: reporte manual compartido por el usuario (canal de alertas).
   Cada tanda de cuentas se agrega como un nuevo lote — NO se sobrescriben
   los lotes anteriores. Para registrar una nueva tanda, agregar un objeto
   más al array LOTES_ALERTAS_CANCELACION.
═══════════════════════════════════════════════════════════════════════ */

export interface CuentaAlertaCancelacion {
  cliente: string
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
  /** Nota libre para casos especiales (ej. demo que nunca convirtió) */
  notaEspecial?: string
  /** URL real del ticket en Zoho Desk, cuando se comparta */
  ticketUrl?: string
}

export interface LoteAlertasCancelacion {
  id: string
  /** YYYY-MM-DD — fecha en que se registró este lote en el dashboard */
  fechaCorte: string
  cuentas: CuentaAlertaCancelacion[]
}

export const LOTES_ALERTAS_CANCELACION: LoteAlertasCancelacion[] = [
  {
    id: 'lote-2026-08-17',
    fechaCorte: '2026-08-17',
    cuentas: [
      { cliente: 'Tropicalia', cid: '102865', ultimoPagoMonto: 652.33, ultimoPagoFecha: '2026-06-14', mesesEnCallpicker: 52, primerPagoFecha: '2022-02-27', ltv: 22668.30, servicio: 'Comunicación Empresarial 400 minutos' },
      { cliente: 'GS Trackme - Sercurezza', cid: '81374', ultimoPagoMonto: 635.68, ultimoPagoFecha: '2026-06-19', mesesEnCallpicker: 58, primerPagoFecha: '2021-08-06', ltv: 32407.98, servicio: '1 Licencia Callpicker sin saldo' },
      { cliente: 'NEXUM', cid: '181272', ultimoPagoMonto: 1576.52, ultimoPagoFecha: '2026-07-23', mesesEnCallpicker: 2, primerPagoFecha: '2026-05-20', ltv: 3317.07, servicio: 'Visibilidad y Control 400 minutos' },
      { cliente: 'INBROTEK SERVICIOS', cid: '129593', ultimoPagoMonto: 4563.32, ultimoPagoFecha: '2026-08-11', mesesEnCallpicker: 45, primerPagoFecha: '2022-11-02', ltv: 300769.66, servicio: 'Visibilidad y Control 4,500 minutos' },
      { cliente: 'EURO STERN', cid: '181577', ultimoPagoMonto: null, ultimoPagoFecha: null, mesesEnCallpicker: null, primerPagoFecha: null, ltv: null, servicio: 'Visibilidad y Control IP 5,000 min' },
      { cliente: 'EMPRESAS BASGON Y BASANT', cid: '25769', ultimoPagoMonto: 1026.60, ultimoPagoFecha: '2026-06-03', mesesEnCallpicker: 80, primerPagoFecha: '2019-10-01', ltv: 54985.56, servicio: 'Comunicación Empresarial 400 minutos' },
      { cliente: 'COESPRO', cid: '93000', ultimoPagoMonto: 671.64, ultimoPagoFecha: '2026-07-02', mesesEnCallpicker: 55, primerPagoFecha: '2021-12-06', ltv: 27989.65, servicio: 'Comunicación Empresarial 800 minutos' },
      { cliente: 'Sheep', cid: '2201', ultimoPagoMonto: 899.00, ultimoPagoFecha: '2026-06-15', mesesEnCallpicker: 111, primerPagoFecha: '2017-03-23', ltv: 77715.94, servicio: '2 Extensiones Visibilidad y Control IL con SIM' },
      { cliente: 'Delta Capital y Holding Street', cid: '185835', ultimoPagoMonto: 9601.32, ultimoPagoFecha: '2026-06-29', mesesEnCallpicker: null, primerPagoFecha: null, ltv: null, servicio: 'Visibilidad y Control 400 minutos' },
      { cliente: 'Hotel kaan', cid: '180514', ultimoPagoMonto: 1135.64, ultimoPagoFecha: '2026-06-24', mesesEnCallpicker: 2, primerPagoFecha: '2026-04-15', ltv: 2937.00, servicio: 'Visibilidad y Control 400 minutos' },
      { cliente: 'ADG Proctel Ferreteros', cid: '173487', ultimoPagoMonto: 174.00, ultimoPagoFecha: '2025-07-21', mesesEnCallpicker: 11, primerPagoFecha: '2025-07-15', ltv: 1938.00, servicio: '10% Comunicación Empresarial 60 minutos' },
      { cliente: 'Pauliu', cid: '173457', ultimoPagoMonto: 2100.01, ultimoPagoFecha: '2025-07-15', mesesEnCallpicker: 11, primerPagoFecha: '2025-07-15', ltv: 1810.44, servicio: '10% Comunicación Empresarial 60 minutos' },
      { cliente: 'Martin Tours', cid: '173381', ultimoPagoMonto: 2074.08, ultimoPagoFecha: '2025-07-15', mesesEnCallpicker: 11, primerPagoFecha: '2025-07-15', ltv: 1788.00, servicio: 'Anualidad Comunicación Empresarial 60 min' },
      { cliente: 'The Brokers Real Estate Cancún', cid: '135585', ultimoPagoMonto: 567.24, ultimoPagoFecha: '2026-06-22', mesesEnCallpicker: 40, primerPagoFecha: '2023-02-23', ltv: 16699.35, servicio: 'Comunicación Empresarial 400 minutos' },
      { cliente: 'GMRV Consultoría Administrativa', cid: '13880', ultimoPagoMonto: 567.24, ultimoPagoFecha: '2026-06-18', mesesEnCallpicker: 90, primerPagoFecha: '2018-12-07', ltv: 102067.12, servicio: 'Comunicación Empresarial 400 minutos' },
      {
        cliente: 'Solicitud de baja del servicio y suspensión de cobros — 98 18 15 66',
        cid: '55',
        ultimoPagoMonto: null, ultimoPagoFecha: null, mesesEnCallpicker: null, primerPagoFecha: null, ltv: null,
        servicio: '—',
        notaEspecial: 'Sin historial de pagos: la cuenta nunca facturó (demo que no convirtió).',
      },
      { cliente: 'Dios Del Aire CLN', cid: '182556', ultimoPagoMonto: 567.24, ultimoPagoFecha: '2026-06-16', mesesEnCallpicker: 2, primerPagoFecha: '2026-06-16', ltv: 489.00, servicio: 'Comunicación Empresarial 400 minutos' },
      { cliente: 'VALLMON', cid: '151689', ultimoPagoMonto: 172.84, ultimoPagoFecha: '2026-06-20', mesesEnCallpicker: 29, primerPagoFecha: '2024-01-09', ltv: 4470.00, servicio: 'Conmutador Virtual CE 60 minutos' },
      { cliente: 'Housebook Real Estate', cid: '149301', ultimoPagoMonto: 1079.96, ultimoPagoFecha: '2026-06-16', mesesEnCallpicker: 31, primerPagoFecha: '2023-11-14', ltv: 11706.90, servicio: 'Comunicación empresarial 400 minutos con grabación' },
      { cliente: 'The Brokers Real Estate', cid: '89032', ultimoPagoMonto: 567.24, ultimoPagoFecha: '2026-06-22', mesesEnCallpicker: 56, primerPagoFecha: '2021-10-18', ltv: 24523.35, servicio: 'Comunicación Empresarial 400 minutos' },
      { cliente: 'CGP CREATIVOS', cid: '44008', ultimoPagoMonto: 767.17, ultimoPagoFecha: '2026-06-22', mesesEnCallpicker: 72, primerPagoFecha: '2020-06-24', ltv: 116687.10, servicio: 'Comunicación Empresarial 400 minutos' },
      { cliente: 'Óptica On Global', cid: '177681', ultimoPagoMonto: 226.20, ultimoPagoFecha: '2026-06-25', mesesEnCallpicker: 6, primerPagoFecha: '2025-12-17', ltv: 1365.00, servicio: 'Comunicación Empresarial 60 minutos' },
      { cliente: 'Centro de Capacitación y Resultados', cid: '48688', ultimoPagoMonto: 652.33, ultimoPagoFecha: '2026-06-17', mesesEnCallpicker: 70, primerPagoFecha: '2020-08-10', ltv: 32807.14, servicio: 'Comunicación Empresarial 400 minutos' },
      {
        cliente: 'TECHNO SECURITY MEXICO', cid: '30540',
        ultimoPagoMonto: 756.73, ultimoPagoFecha: '2026-06-18', mesesEnCallpicker: 2, primerPagoFecha: '2018-11-13', ltv: 1647.00,
        servicio: 'Comunicación Empresarial 400 minutos',
        notaEspecial: 'Dato fuente inconsistente: primer pago 2018 pero "meses en Callpicker" reportado como 2 — verificar con Zoho.',
      },
    ],
  },
]

/** Todas las cuentas de todos los lotes, aplanadas (la UI trabaja sobre esta lista). */
export const ALERTAS_CANCELACION: CuentaAlertaCancelacion[] =
  LOTES_ALERTAS_CANCELACION.flatMap(l => l.cuentas)
