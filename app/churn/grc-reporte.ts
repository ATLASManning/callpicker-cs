/* ═══════════════════════════════════════════════════════════════════════
   GROSS REVENUE CHURN · 2026 CONFIRMADO — cifras oficiales del reporte GRC

   Este archivo complementa a `aaa-grc-data.ts` (generado desde el Excel) con
   lo único que el Excel NO trae: la BASE de MRR de cada mes, que es el
   denominador del porcentaje de GRC.

   Por qué hace falta: el export de Zoho lista sólo los contratos afectados
   por churn o downgrade. La suma de su "MRR Inicio Contrato" da, por ejemplo,
   $257,972.65 en enero — pero la base del GRC de ese mes es $4,650,020.89,
   que es el MRR TOTAL de la compañía. Ese dato vive en el reporte GRC, no en
   el export, así que se captura aquí a mano desde el reporte.

   ➕ Al cerrar un mes nuevo: añade su base aquí Y su fila de verificación en
      GRC_VERIFICACION. Si no se agrega la base, el mes aparece en la tabla
      sin porcentaje (no se inventa un denominador).
═══════════════════════════════════════════════════════════════════════ */

/** MRR total de la compañía al inicio de cada mes — denominador del GRC %. */
export const GRC_BASE_MRR: Record<string, number> = {
  Enero:   4650020.89,
  Febrero: 4696696.10,
  Marzo:   4776920.30,
  Abril:   4857171.51,
  Mayo:    5074882.09,
  Junio:   5103295.12,
  Julio:   4943564.29,
  Agosto:  5006567.60,
}

/**
 * Cifras tal como aparecen en el reporte GRC, para CONTRASTAR contra lo que
 * el dashboard calcula desde el Excel. No se muestran: se usan sólo para
 * detectar divergencias. Si al regenerar los datos algún mes deja de cuadrar,
 * el módulo lo señala en pantalla en vez de mostrar un número equivocado
 * con cara de correcto.
 */
export interface GrcFilaReporte {
  mes: string
  churn: number
  downgrade: number
  perdida: number
}

export const GRC_VERIFICACION: GrcFilaReporte[] = [
  { mes: 'Enero',   churn:  74083.11, downgrade: 20848.01, perdida:  94931.12 },
  { mes: 'Febrero', churn:  65589.19, downgrade: 34216.37, perdida:  99805.56 },
  { mes: 'Marzo',   churn:  82546.00, downgrade: 25734.97, perdida: 108280.97 },
  { mes: 'Abril',   churn:  58214.06, downgrade: 26413.59, perdida:  84627.65 },
  { mes: 'Mayo',    churn:  32586.00, downgrade: 44979.51, perdida:  77565.51 },
  { mes: 'Junio',   churn:  87260.00, downgrade: 82424.66, perdida: 169684.66 },
  { mes: 'Julio',   churn:  76624.46, downgrade: 28143.20, perdida: 104767.66 },
  { mes: 'Agosto',  churn: 114612.17, downgrade: 49977.17, perdida: 164589.34 },
]

/** Totales del renglón "Resumen amplio" del reporte. */
export const GRC_RESUMEN_REPORTE = {
  base:      39109117.90,
  churn:       591514.99,
  downgrade:   312737.48,
  perdida:     904252.47,
  pct:               2.3,
}

/**
 * El fraude / reestructura queda FUERA del Gross Revenue Churn: el reporte
 * cierra en $904,252.47, que es la pérdida real sin los $203,132.14 de
 * fraude-reestructura del mismo periodo. Se reporta por separado.
 */
export const GRC_EXCLUYE_FRAUDE = true
