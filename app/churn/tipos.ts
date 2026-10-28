/**
 * Tipos de los cortes semanales de Gross Revenue Churn.
 *
 * Viven fuera de `page.tsx` porque el corte más reciente también lo consume
 * Atlas del lado del servidor: la página es un componente cliente y un módulo
 * de servidor no puede importar de ahí. Con los tipos aquí, el reporte vigente
 * queda en un solo archivo y las dos vistas leen la misma fuente.
 */
export interface ChurnPendiente   { cliente: string; monto: number; mesesActivo: number; ultimaFactura: string }
export interface ChurnCancelado   { cliente: string; mrr: number;   mesesActivo: number; acumulado: number    }
export interface ChurnDowngrade   { cliente: string; perdida: number; nota: string                            }
export interface ChurnSuspendido  { cliente: string; importe: number; mesesActivo: number; estado: 'Suspendido' | 'Inactivo' }
export interface ChurnDesactivado { cliente: string; importe: number; mesesActivo: number }
export interface DowngradeArticulo { articulo: string; vecesAfectado: number; clientes: string[] }

export interface ChurnGRC {
  evolucion:   { mes: string; pct: number; anterior?: number }[]
  acumulado:   number
  anterior?:   number
  /**
   * Qué periodo cubre `acumulado`, cuando NO es el acumulado del año.
   *
   * La tarjeta rotula «GRC Acumulado {último mes de evolución}», que durante
   * toda la serie ha querido decir acumulado 2026. El cierre de T3 publica un
   * porcentaje del TRIMESTRE (2.39%) mientras el último acumulado anual era
   * 23.7%: sin esta etiqueta la tarjeta diría «GRC Acumulado Septiembre 2.39%»
   * y se leería como un desplome del año que no existe. Un rótulo falso no se
   * arregla con una nota debajo.
   */
  acumuladoEtiqueta?: string
  notaClave:   string
  notaEspecial?: string
}

export interface ChurnReporte {
  id:          string
  periodo:     string
  fecha:       string
  notas:       string
  notaRemitente?: string
  pendientes:  ChurnPendiente[]
  cancelados:  ChurnCancelado[]
  downgrades:  ChurnDowngrade[]
  suspendidos?: ChurnSuspendido[]
  desactivados?: ChurnDesactivado[]
  downgradeArticulos?: DowngradeArticulo[]
  /** Antigüedad de saldos por vencer / vencidos, cuando el corte la reporta. */
  antiguedadSaldos?: { rango: string; monto: number }[]
  grc?:        ChurnGRC
  pendientesTotalReal?:   number
  pendientesCuentasReal?: number
  /**
   * Qué es, con palabras, lo que el corte puso en el slot `pendientes`.
   *
   * El contexto de Atlas lo rotulaba fijo como «Cartera en Activo», y desde la
   * semana 24 ese slot guarda la CARTERA POR COBRAR. O sea que Atlas le decía a
   * un asesor que los $497,941.00 de saldo vencido eran la cartera activa,
   * cuando la activa de ese mismo corte son $206,983.42: menos de la mitad, y
   * significa lo contrario. Un rótulo que miente no se arregla con una nota.
   * [[feedback-kpi-con-fuente]]
   */
  pendientesEtiqueta?: string
  suspendidosTotalReal?:  number
  suspendidosCuentasReal?: number
  desactivadosTotalReal?:  number
  desactivadosCuentasReal?: number
  downgradeTotalReal?:     number
  /**
   * Cuántos casos de downgrade tuvo el corte, cuando declara más de los que
   * desglosa. La tabla lleva el Top N más una fila de cierre, así que contar
   * filas daba «5 clientes con reducción de plan» sobre un mes de 10 casos.
   */
  downgradeCasosReal?:     number
  /**
   * Cuántas cancelaciones tuvo el corte, cuando declara más de las que
   * desglosa.
   *
   * `cancelados` era el único de los tres bloques sin conteo declarado ni filtro
   * de cubo: la tarjeta sumaba filas, así que la semana 26 publicaba «MRR
   * Cancelado $20,234 · 6 clientes» cuando el corte declara ONCE —cinco con
   * nombre y un cubo de cierre por los seis restantes—. El importe salía bien y
   * el conteo mentía, que es la peor combinación: nadie revisa un número que
   * acompaña a una cifra correcta. [[feedback-tablas-deben-cerrar]]
   */
  canceladosCasosReal?:    number
}
