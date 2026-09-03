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
  suspendidosTotalReal?:  number
  suspendidosCuentasReal?: number
  desactivadosTotalReal?:  number
  desactivadosCuentasReal?: number
  downgradeTotalReal?:     number
}
