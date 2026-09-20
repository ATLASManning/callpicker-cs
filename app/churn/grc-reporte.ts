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

   ── REEXPRESIÓN DEL 20-SEP-2026 ───────────────────────────────────────────
   El export `DT_Churn_etiquetas.xlsx` no sólo trajo septiembre: reescribió
   cuatro meses YA REPORTADOS. Un contrato marcado «Churn confirmado» que
   después se factura desaparece del corte, y Zoho reclasifica a fraude /
   reestructura sin avisar. Las cifras de mayo a agosto de este archivo se
   actualizaron a la nueva expresión; las anteriores quedan en
   GRC_REEXPRESION_2026_09_20 para que el cambio sea auditable y no una
   corrección silenciosa. Conciliado al centavo con
   `scripts/concilia-grc-export.py`.
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
  // Confirmada contra el reporte GRC el 20-sep-2026: el tablero de Zoho pinta
  // $4,905,228.27 de MRR inicio para septiembre, el mismo número que había
  // salido de sumar los 3,574 contratos del export completo. Ya no es
  // provisional — lo provisional de septiembre es la PÉRDIDA, no la base.
  Septiembre: 4905228.27,
}

/** Meses cuya base NO viene del reporte oficial. Se marcan en pantalla. */
export const GRC_BASE_PROVISIONAL: readonly string[] = []

/**
 * EL MES VIVO NO ES CHURN — ES CARTERA POR COBRAR.
 *
 * Regla de negocio, José Manuel López Delgadillo (20-sep-2026): «dentro del
 * Churn, hablando de septiembre, son clientes que tardan en pagar. El
 * verdadero churn es el mes vencido. Aún se están recibiendo pagos vencidos
 * de agosto, y eso juega en septiembre un papel importante porque existe
 * recuperación por pagos, y así cada mes.»
 *
 * Zoho marca «Churn confirmado» todo contrato que aún no factura, así que el
 * mes vivo mide retraso de cobranza, no bajas. El churn de un mes sólo madura
 * cuando ese mes vence y entran los pagos tardíos — y sigue bajando después.
 *
 * En septiembre 2026: 754 de 790 filas traen la firma «MRR fin en cero y
 * pérdida igual al MRR inicio», y de las que se pueden cotejar contra la
 * cartera el 95% sigue viva. Medido, no supuesto: ver GRC_RECUPERACION_PAGOS.
 *
 * Esta constante gobierna TRES cosas — no es sólo cosmética:
 *   1. la etiqueta y el sombreado del mes en la tabla;
 *   2. el renglón «Meses cerrados», que es la cifra comparable;
 *   3. que NO se generen aclaraciones de baja sobre este mes
 *      (ver lib/aclaraciones.ts).
 *
 * Al cerrar el mes: poner aquí el siguiente mes vivo. Sus bajas sobrevivientes
 * pasan a ser churn real y generan aclaración solas.
 */
export const GRC_MES_EN_CURSO: string | null = 'Septiembre'

/**
 * RECUPERACIÓN POR PAGOS — la prueba de que el mes vivo no es churn.
 *
 * Entre el corte del 17-sep-2026 y el del 20-sep-2026 —tres días— 26 cuentas
 * marcadas «Churn confirmado» facturaron y salieron del churn. Veintidós son
 * de AGOSTO, el mes vencido: es exactamente la cobranza tardía entrando.
 *
 * Esto NO incluye los $40,231.54 de GTC (CARRANZA y LOMAS), que no se
 * recuperaron sino que Zoho reclasificó a fraude / reestructura. Son cosas
 * distintas y mezclarlas inventaría una recuperación que no ocurrió.
 */
export const GRC_RECUPERACION_PAGOS = {
  entre:  ['2026-09-17', '2026-09-20'] as const,
  total:  29919.00,
  cuentas: 26,
  porMes: [
    { mes: 'Julio',  monto:  5092.00, cuentas:  4 },
    { mes: 'Agosto', monto: 24827.00, cuentas: 22 },
  ],
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
  { mes: 'Enero',      churn:   74083.11, downgrade: 20848.01, perdida:   94931.12 },
  { mes: 'Febrero',    churn:   65589.19, downgrade: 34216.37, perdida:   99805.56 },
  { mes: 'Marzo',      churn:   82546.00, downgrade: 25734.97, perdida:  108280.97 },
  { mes: 'Abril',      churn:   58214.06, downgrade: 26413.59, perdida:   84627.65 },
  { mes: 'Mayo',       churn:   32586.00, downgrade: 42283.26, perdida:   74869.26 },
  { mes: 'Junio',      churn:   87260.00, downgrade: 81522.81, perdida:  168782.81 },
  { mes: 'Julio',      churn:   71532.46, downgrade: 25576.75, perdida:   97109.21 },
  { mes: 'Agosto',     churn:   66804.18, downgrade: 49977.17, perdida:  116781.35 },
  // Septiembre se mueve todos los días: es el mes vivo. Aquí va lo que trae el
  // export del 20-sep. El tablero de Zoho, consultado más tarde ese mismo día,
  // ya marcaba $1,252,672.37 — $4,426.00 menos, que son cuentas que pagaron en
  // el intervalo. No se persigue esa cifra: se vuelve a capturar con cada
  // export, y al cerrar el mes deja de moverse.
  { mes: 'Septiembre', churn: 1257098.37, downgrade: 49465.26, perdida: 1306563.63 },
]

/**
 * Lo que este archivo decía ANTES del export del 20-sep-2026, con el porqué
 * de cada cambio. Informativo/auditable: que nadie tenga que adivinar por qué
 * un número que ya se presentó a dirección hoy es otro.
 *
 * Tres movimientos, y la conciliación cierra al centavo en -$59,064.54:
 *
 *   · -$40,231.54  GTC (CARRANZA y LOMAS) reclasificados de pérdida REAL a
 *                  fraude / reestructura. Como el GRC excluye el fraude
 *                  (ver GRC_EXCLUYE_FRAUDE), salen del porcentaje. Agosto se
 *                  lleva $34,066.99 de esos.
 *   · -$29,919.00  26 cuentas (4 de julio, 22 de agosto) marcadas «Churn
 *                  confirmado» que desde entonces facturaron. Nunca fueron
 *                  baja: es cobranza tardía entrando, lo que José Manuel llama
 *                  recuperación por pagos. Ver GRC_RECUPERACION_PAGOS.
 *   · +$11,086.00  TATSA vuelve al NÚMERO. No es un movimiento de Zoho: es que
 *                  la tabla oficial dejó de excluirla para poder cuadrar con
 *                  el reporte. Sigue fuera de la operación — ver
 *                  REACTIVADAS_FUERA_DEL_CHURN en lib/elegibilidad.ts.
 */
export const GRC_REEXPRESION_2026_09_20 = {
  fecha:  '2026-09-20',
  origen: 'DT_Churn_etiquetas.xlsx',
  delta:  -59064.54,
  anterior: [
    { mes: 'Mayo',   churn:  32586.00, downgrade: 44979.51, perdida:  77565.51 },
    { mes: 'Junio',  churn:  87260.00, downgrade: 82424.66, perdida: 169684.66 },
    { mes: 'Julio',  churn:  76624.46, downgrade: 28143.20, perdida: 104767.66 },
    { mes: 'Agosto', churn: 114612.17, downgrade: 49977.17, perdida: 164589.34 },
  ] as GrcFilaReporte[],
  resumenAnterior: {
    base:      39109117.90,
    churn:       591514.99,
    downgrade:   312737.48,
    perdida:     904252.47,
    pct:               2.3,
  },
}

/**
 * Totales del renglón "Resumen amplio" del reporte.
 *
 * OJO al leer el salto: la pérdida pasa de $904,252.47 a $2,151,751.56, pero
 * $1,306,563.63 de eso es septiembre — el mes vivo, que no es churn sino
 * cartera por cobrar (ver GRC_MES_EN_CURSO). El porcentaje de septiembre no es
 * una caída del negocio; es el mes sin cerrar. Los ocho meses cerrados suman
 * $845,187.93 y dan 2.16%, en línea con el histórico.
 */
export const GRC_RESUMEN_REPORTE = {
  base:      44014346.17,
  churn:      1795713.37,
  downgrade:   356038.19,
  perdida:    2151751.56,
  pct:               4.89,
}

/** El mismo resumen sin el mes en curso — la cifra comparable contra el histórico. */
export const GRC_RESUMEN_CERRADOS = {
  hasta:     'Agosto',
  base:      39109117.90,
  churn:       538615.00,
  downgrade:   306572.93,
  perdida:     845187.93,
  pct:               2.16,
}

/**
 * El fraude / reestructura queda FUERA del Gross Revenue Churn: la pérdida
 * real del periodo enero–septiembre es $2,151,751.56, sin los $244,432.68 de
 * fraude-reestructura de los mismos nueve meses. Se reporta por separado.
 */
export const GRC_EXCLUYE_FRAUDE = true
