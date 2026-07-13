'use client'
import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import {
  TrendingDown, AlertTriangle, XCircle, ArrowDownRight,
  Clock, DollarSign, BarChart3, CalendarDays, ChevronDown, ChevronUp,
  Plus, Trash2, X, ChevronLeft, ChevronRight, Check, Database, FileBarChart2,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════
   TIPOS
═══════════════════════════════════════════════════════════════════════ */
type SemaforoChurn = 'cancelado' | 'pendiente' | 'downgrade' | 'suspendido'
type Tab = 'resumen' | 'pendiente' | 'cancelados' | 'downgrades' | 'suspendidos' | 'desactivados' | 'grc' | 't1'

interface ChurnPendiente   { cliente: string; monto: number; mesesActivo: number; ultimaFactura: string }
interface ChurnCancelado   { cliente: string; mrr: number;   mesesActivo: number; acumulado: number    }
interface ChurnDowngrade   { cliente: string; perdida: number; nota: string                            }
interface ChurnSuspendido  { cliente: string; importe: number; mesesActivo: number; estado: 'Suspendido' | 'Inactivo' }

interface ChurnDesactivado { cliente: string; importe: number; mesesActivo: number }
interface DowngradeArticulo { articulo: string; vecesAfectado: number; clientes: string[] }

interface ChurnGRC {
  evolucion:   { mes: string; pct: number; anterior?: number }[]
  acumulado:   number
  anterior?:   number
  notaClave:   string
  notaEspecial?: string
}

interface ChurnReporte {
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
  grc?:        ChurnGRC
  pendientesTotalReal?:   number
  pendientesCuentasReal?: number
  suspendidosTotalReal?:  number
  suspendidosCuentasReal?: number
  desactivadosTotalReal?:  number
  desactivadosCuentasReal?: number
  downgradeTotalReal?:     number
}

/* ═══════════════════════════════════════════════════════════════════════
   PALETA
═══════════════════════════════════════════════════════════════════════ */
const RED    = '#ef4444'
const ORANGE = '#f97316'
const AMBER  = '#f59e0b'
const BLUE   = '#3b82f6'
const INDIGO = '#6366f1'
const GREEN  = '#22c55e'

const SEMAFORO_MAP: Record<SemaforoChurn, { color: string; label: string; dot: string }> = {
  cancelado:  { color: RED,    label: 'Cancelado',          dot: '🔴' },
  pendiente:  { color: ORANGE, label: 'Pendiente Facturar', dot: '🟠' },
  downgrade:  { color: AMBER,  label: 'Downgrade',          dot: '🟡' },
  suspendido: { color: BLUE,   label: 'Suspendido/Inactivo',dot: '🔵' },
}

const TEAL = '#0d9488'

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE BASE — ABRIL 2026 (hardcoded, no se puede eliminar)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_ABRIL_2026: ChurnReporte = {
  id:      'abril-2026',
  periodo: 'Abril 2026',
  fecha:   '30/04/2026',
  notas:   'Análisis elaborado por el área de DATA. 8 clientes pendientes de facturar, 19 cancelaciones confirmadas y 4 downgrades con impacto en MRR.',
  pendientes: [
    { cliente: 'Diprosa',              monto: 687,     mesesActivo: 24,  ultimaFactura: '25/03/2026' },
    { cliente: 'Emporio Inmobiliario', monto: 1599,    mesesActivo: 48,  ultimaFactura: '19/03/2026' },
    { cliente: 'GLOBAL BIENES RAICES', monto: 979,     mesesActivo: 1,   ultimaFactura: '26/03/2026' },
    { cliente: 'SE DUEÑO',             monto: 1587,    mesesActivo: 43,  ultimaFactura: '25/03/2026' },
    { cliente: 'Housebook Real Estate',monto: 973.90,  mesesActivo: 28,  ultimaFactura: '16/03/2026' },
    { cliente: 'Ambientec',            monto: 986,     mesesActivo: 49,  ultimaFactura: '25/03/2026' },
    { cliente: 'jemmoma',              monto: 2634,    mesesActivo: 89,  ultimaFactura: '25/03/2026' },
    { cliente: 'Quality 360G',         monto: 489,     mesesActivo: 113, ultimaFactura: '25/03/2026' },
  ],
  cancelados: [
    { cliente: 'JAD Suministros',          mrr: 4023,    mesesActivo: 75, acumulado: 552266.81 },
    { cliente: 'ZD - Grupo RH',            mrr: 3642,    mesesActivo: 10, acumulado: 36200.98  },
    { cliente: 'Remax Lafueya',            mrr: 2597.41, mesesActivo: 73, acumulado: 179257.55 },
    { cliente: 'Filo',                     mrr: 2256,    mesesActivo: 4,  acumulado: 17474     },
    { cliente: 'TRIBECA HAIR STUDIO',      mrr: 1767,    mesesActivo: 48, acumulado: 97228     },
    { cliente: 'Hospital Merlos',          mrr: 1450,    mesesActivo: 22, acumulado: 36350     },
    { cliente: 'IT GREEN',                 mrr: 1119,    mesesActivo: 1,  acumulado: 2238      },
    { cliente: 'Valdi abogados',           mrr: 989,     mesesActivo: 25, acumulado: 25696.68  },
    { cliente: 'ROYAL HOME',               mrr: 979,     mesesActivo: 43, acumulado: 43076     },
    { cliente: 'Neek Tulum',               mrr: 500,     mesesActivo: 55, acumulado: 28000     },
    { cliente: 'Price Logistics',          mrr: 489,     mesesActivo: 20, acumulado: 10269     },
    { cliente: 'Estradata',                mrr: 489,     mesesActivo: 14, acumulado: 7335      },
    { cliente: 'Boma Coaching & Analysis', mrr: 489,     mesesActivo: 9,  acumulado: 4401      },
    { cliente: 'CITUR',                    mrr: 489,     mesesActivo: 7,  acumulado: 3912      },
    { cliente: 'Estradata MH',             mrr: 415.65,  mesesActivo: 59, acumulado: 22029.45  },
    { cliente: 'EXTIN-SON',                mrr: 359,     mesesActivo: 19, acumulado: 6428      },
    { cliente: '10 Experiences Tour',      mrr: 279,     mesesActivo: 64, acumulado: 17019     },
    { cliente: 'KINDEMEX',                 mrr: 195,     mesesActivo: 3,  acumulado: 780       },
    { cliente: 'BDM LAB',                  mrr: 169,     mesesActivo: 39, acumulado: 5971      },
  ],
  downgrades: [
    { cliente: 'Ancona Autopartes', perdida: 4583,    nota: 'Redujo plan Agente CP Chat de $17,762 a $13,919 (-$3,843). Churn de Extension CE + Extension VyC (-$11,860). Entrada de Extensión VyC min IP (+$11,120).' },
    { cliente: 'ESDIE',             perdida: 3000,    nota: 'Paquete Min Voicebot cancelado de su facturación.' },
    { cliente: 'Finsus Cobranza',   perdida: 2880,    nota: 'Extension Callcenter reducida de $8,268 a $5,388.' },
    { cliente: 'Finaura',           perdida: 2333.20, nota: 'Ofuscador $4,276→$3,000 · Paquete Min VyC $2,557→$1,794 · Paquete Campañas $984→$690. Facturación total pasa de $7,817.20 a $5,484.' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 4 · MAYO 2026 (hardcoded, no se puede eliminar)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S4_MAYO_2026: ChurnReporte = {
  id:      's4-mayo-2026',
  periodo: 'Semana 4 · Mayo 2026',
  fecha:   '22/05/2026',
  notas:   'Gross Revenue Churn · Semana 4. Al 22 de mayo del 2026. El incremento crítico en Mayo se debe principalmente al volumen de clientes que se encuentran pendientes de facturar. El GRC acumulado alcanza un 28%.',

  /* Nota FINSUS */
  grc: {
    evolucion: [
      { mes: 'Marzo',          pct: 2.3  },
      { mes: 'Abril',          pct: 2.0  },
      { mes: 'Mayo (Actual)',   pct: 19.7 },
    ],
    acumulado: 28,
    notaClave: 'El incremento crítico en Mayo se debe principalmente al volumen de clientes pendientes de facturar.',
    notaEspecial: '✅ Nota Finsus Growth: Se revisó el caso del decremento de WhatsApp API por $121,500. Confirmamos que este monto ya se facturó exitosamente y ha sido descartado de las métricas de pérdida neta de este periodo.',
  },

  /* Pendiente de Facturar — top 5 de 31 cuentas */
  pendientesTotalReal:   28735,
  pendientesCuentasReal: 31,
  pendientes: [
    { cliente: 'Inteligencia Canina',         monto: 5568, mesesActivo: 0, ultimaFactura: '08/04/2026' },
    { cliente: 'Espumas de Calidad',          monto: 1389, mesesActivo: 0, ultimaFactura: '17/04/2026' },
    { cliente: 'Evolución IT',               monto: 1278, mesesActivo: 0, ultimaFactura: '13/04/2026' },
    { cliente: 'Industrias Quimicas ANAVAL',  monto: 1189, mesesActivo: 0, ultimaFactura: '14/04/2026' },
    { cliente: 'Benemas',                     monto: 1078, mesesActivo: 0, ultimaFactura: '14/04/2026' },
    { cliente: '+ 26 clientes adicionales',   monto: 18233,mesesActivo: 0, ultimaFactura: 'Ver reporte base' },
  ],

  /* Sin cancelados confirmados en este corte */
  cancelados: [],

  /* Downgrades */
  downgrades: [
    { cliente: 'Embler Autopartes',        perdida: 3560,    nota: 'En su Extension Callcenter de $4,450 bajó a $890.' },
    { cliente: 'GTC - CENTRO MAX',         perdida: 3295.90, nota: 'De su facturación redujo el paquete ops Automatizaciones de $12,631.14 a $9,335.24.' },
    { cliente: 'GTC - NAVA',               perdida: 3295.90, nota: 'De su facturación redujo el paquete ops Automatizaciones de $12,631.14 a $9,335.' },
    { cliente: 'SG LOCALIZACION',          perdida: 3143.02, nota: 'De su facturación redujo el artículo Extension VyC de $9,429.02 a $6,286.' },
    { cliente: 'SAMALAB',                  perdida: 3000,    nota: 'Redujo su facturación recurrente en el artículo paquete Min Voicebot de $6,000 a $3,000, pero llevó la gran parte de su facturación a consumo Min Voicebot con un monto de $11,523.60.' },
    { cliente: 'GTC - FORUM',              perdida: 2396.43, nota: 'Redujo el paquete ops Automatizaciones de $9,184.03 a $6,787.60; cambió el artículo de Agente CP Chat a Agente CP Chat Callcenter con el mismo monto de $4,845.55.' },
    { cliente: 'Petroil - Prebiem Oceanica',perdida: 2431,   nota: 'Canceló el artículo Extension CE con un monto de $5,725 y adquirió Extension VyC por un monto de $3,294.' },
  ],

  /* Suspendidos e Inactivos — top 5 de 22 cuentas */
  suspendidosTotalReal:   14845,
  suspendidosCuentasReal: 22,
  suspendidos: [
    { cliente: 'ISAGAS',                     importe: 3089, mesesActivo: 68,  estado: 'Suspendido' },
    { cliente: 'Transportes BPG SAS. de CV.',importe: 2546, mesesActivo: 90,  estado: 'Inactivo'   },
    { cliente: 'Pizzall',                    importe: 1870, mesesActivo: 38,  estado: 'Inactivo'   },
    { cliente: 'CF Group',                   importe: 1182, mesesActivo: 46,  estado: 'Suspendido' },
    { cliente: 'Ruandi',                     importe: 1084, mesesActivo: 105, estado: 'Suspendido' },
    { cliente: '+ 17 cuentas adicionales',   importe: 5074, mesesActivo: 0,   estado: 'Suspendido' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 5 · MAYO 2026 (hardcoded, no se puede eliminar)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S5_MAYO_2026: ChurnReporte = {
  id:      's5-mayo-2026',
  periodo: 'Semana 5 · Mayo 2026',
  fecha:   '29/05/2026',
  notas:   'Gross Revenue Churn · Semana 5. Al 29 de mayo del 2026. Cierre de mayo con churn Q2 en 4.8% y acumulado 2026 en 13.1%. Siguiente revisión: viernes 5 de junio.',

  grc: {
    evolucion: [
      { mes: 'Abril',  pct: 1.9 },
      { mes: 'Mayo',   pct: 4.8 },
    ],
    acumulado: 13.1,
    notaClave: 'Churn Q2 mayo cerró en 4.8%. Acumulado 2026: 13.1%.',
    notaEspecial: '⚠️ Doble facturación en mayo detectada en 6 cuentas: COLEGIO CARL ROGERS ($6,996 real $3,498) · satvpafc ($3,542 real $1,771) · PVnube ($3,454 real $1,727) · Industrias la Cascada ($3,198 real $1,599) · Ncubo Capital ($3,169 real $1,584.50) · GRUPO LCHAT MEXICO ($2,386 real $1,193). Si en junio solo se factura un período, el sistema podría interpretar una baja del 50% que no es real.',
  },

  /* En Corte — top 11 de 20 cuentas */
  pendientesTotalReal:   23893.50,
  pendientesCuentasReal: 20,
  pendientes: [
    { cliente: 'EKTARIS GRUPO INMOBILIARIO', monto: 3798,    mesesActivo: 0, ultimaFactura: '23/04/2026' },
    { cliente: 'TAQUERIA EL PARIENTE',       monto: 3500,    mesesActivo: 0, ultimaFactura: '28/04/2026' },
    { cliente: 'AIRAPI MEMORIAL PARK',       monto: 2157,    mesesActivo: 0, ultimaFactura: '28/04/2026' },
    { cliente: 'Grupo Orve',                 monto: 2083,    mesesActivo: 0, ultimaFactura: '27/04/2026' },
    { cliente: 'Dos Valles Residencial',     monto: 1189,    mesesActivo: 0, ultimaFactura: '25/04/2026' },
    { cliente: 'Smart Lending SPV',          monto: 1069,    mesesActivo: 0, ultimaFactura: '25/04/2026' },
    { cliente: 'Livceller',                  monto: 1069,    mesesActivo: 0, ultimaFactura: '25/04/2026' },
    { cliente: 'Eden Zavala',                monto: 989,     mesesActivo: 0, ultimaFactura: '28/04/2026' },
    { cliente: 'Oscorp International',       monto: 986,     mesesActivo: 0, ultimaFactura: '25/04/2026' },
    { cliente: 'Urbanelle BH Inmobiliaria',  monto: 979,     mesesActivo: 0, ultimaFactura: '28/04/2026' },
    { cliente: 'SPORTIX RL',                 monto: 979,     mesesActivo: 0, ultimaFactura: '23/04/2026' },
    { cliente: '+ 9 clientes adicionales',   monto: 5095.50, mesesActivo: 0, ultimaFactura: 'REFLEXUM · Khalil Constructor · Clarivate Lifescience · Gallardo y Asoc. · Dios Del Aire · Equipos y Desarrollos Inf. · Vulcano · Brida IT Services · Biotechgraft · Remax Las Palmas' },
  ],

  cancelados: [],

  /* Downgrades */
  downgrades: [
    { cliente: 'Petroil - Prebiem Oceanica', perdida: 2431,    nota: '$7,409 → $4,978' },
    { cliente: 'GTC - FORUM',                perdida: 2396.43, nota: '$28,380.74 → $25,984.31' },
    { cliente: 'TURISMO NICETRIP',           perdida: 1656,    nota: '$1,825 → $169' },
    { cliente: 'PlastilinaBTl',              perdida: 488,     nota: '$587 → $99' },
  ],

  /* Suspendidos e Inactivos */
  suspendidosTotalReal:   7987,
  suspendidosCuentasReal: 4,
  suspendidos: [
    { cliente: 'Municipio de Teoloyucan', importe: 3290, mesesActivo: 15, estado: 'Inactivo'   },
    { cliente: 'Custodias RJ',            importe: 2920, mesesActivo: 2,  estado: 'Inactivo'   },
    { cliente: 'Sermedi Mx',              importe: 1288, mesesActivo: 7,  estado: 'Suspendido' },
    { cliente: 'LIGO CONSULTING',         importe: 489,  mesesActivo: 19, estado: 'Inactivo'   },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 1 · JUNIO 2026
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S1_JUNIO_2026: ChurnReporte = {
  id:      's1-junio-2026',
  periodo: 'Semana 1 · Jun 2026',
  fecha:   '05/06/2026',
  notas:   'Gross Revenue Churn · Semana 6. Al 5 de junio del 2026. Churn Q2: Abril 1.9% · Mayo 3%. Acumulado 2026: 11.3%. 26 cuentas canceladas · 5 suspendidas · 9 inactivas en cierre de mayo. Siguiente revisión: viernes 12 de junio.',

  grc: {
    evolucion: [
      { mes: 'Abril', pct: 1.9 },
      { mes: 'Mayo',  pct: 3.0 },
    ],
    acumulado: 11.3,
    notaClave: 'Churn Q2: Abril 1.9% · Mayo 3.0%. Acumulado 2026: 11.3%.',
    notaEspecial: '⚠️ Patrón GTC detectado: ~55% del downgrade de mayo (~$22,270) concentrado en 11 sucursales del Grupo GTC por reducción del paquete "Ops Automatizaciones". Recomendación: seguimiento preventivo por futuros downgrades. 🚨 Casos de baja real que requieren atención urgente: SAMALAB (-$3,000) · Turismo Nicetrip (-$1,656) · Rejamex (-$1,116).',
  },

  /* En Corte — 3 cuentas $24,147 */
  pendientesTotalReal:   24147,
  pendientesCuentasReal: 3,
  pendientes: [
    { cliente: 'GTC - MG LOMAS',            monto: 19544.44, mesesActivo: 0, ultimaFactura: '13/04/2026' },
    { cliente: 'GVA - República Dominicana', monto: 3623.56,  mesesActivo: 0, ultimaFactura: '17/04/2026' },
    { cliente: 'Lácteos ARCE',               monto: 979,      mesesActivo: 0, ultimaFactura: '29/04/2026' },
  ],

  /* Cancelados — 26 cuentas $24,213 */
  cancelados: [
    { cliente: 'Finaura',                     mrr: 5484,  mesesActivo: 10,  acumulado: 0 },
    { cliente: 'Abelyne Inc',                 mrr: 1797,  mesesActivo: 9,   acumulado: 0 },
    { cliente: 'Holton',                      mrr: 1555,  mesesActivo: 105, acumulado: 0 },
    { cliente: '+ 23 cuentas adicionales',    mrr: 15377, mesesActivo: 0,   acumulado: 0 },
  ],

  /* Downgrades — Mayo 2026  total desglosado $34,521 · real $40,834 · 20 clientes */
  downgrades: [
    { cliente: 'SAMALAB',          perdida: 3000, nota: '🚨 Baja real. Min Voicebot $46,000→$3,000 (−$3,000). Sin adquisición de producto equivalente.' },
    { cliente: 'Turismo Nicetrip', perdida: 1656, nota: '🚨 Baja real. Min CE $1,825→$169 (−$1,656). Sin adquisición equivalente.' },
    { cliente: 'Rejamex',          perdida: 1116, nota: '🚨 Baja real. Canceló Agente CP Chat completamente (−$1,116).' },
    { cliente: 'GTC — 11 sucursales (Patrón artículo)', perdida: 22270, nota: '⚠️ Patrón 2: 11 sucursales GTC (~$22,270) concentran ~55% del downgrade. Reducción del paquete "Ops Automatizaciones" de forma idéntica en múltiples cuentas. Decisión grupal del cliente. Aplica: GTC Forum, GTC BMW, GTC Carranza, GTC Sendero, GTC MG Poliforum, GTC Matehuala, GTC Lomas, GTC Rioverde, GTC Infiniti León, GTC Infiniti QRO + otras sucursales.' },
    { cliente: 'Otros clientes — Cambio de artículo', perdida: 12251, nota: '⚠️ Patrón 1 (10 cuentas): clientes cancelan "Agente CP Chat" pero adquieren "Agente CP Chat Callcenter" por el mismo monto. El ingreso reportado como perdido es un movimiento entre artículos, no una baja real. Clientes afectados: GTC Forum, GTC BMW, GTC Carranza, GTC Sendero, GTC MG Poliforum, GTC Matehuala, GTC Lomas, GTC Rioverde, GTC Infiniti León, GTC Infiniti QRO.' },
  ],

  /* Suspendidos (5 cuentas $5,786) + Inactivos (9 cuentas $27,799.30) = 14 cuentas $33,585 */
  suspendidosTotalReal:   33585,
  suspendidosCuentasReal: 14,
  suspendidos: [
    { cliente: 'Campers LEER',                           importe: 1870,     mesesActivo: 3,   estado: 'Suspendido' },
    { cliente: 'Virtual Homes',                          importe: 979,      mesesActivo: 39,  estado: 'Suspendido' },
    { cliente: 'PANCHOS DELI MARKET',                    importe: 979,      mesesActivo: 30,  estado: 'Suspendido' },
    { cliente: 'IMPERIO LUXURY REAL ESTATE SERVICES',    importe: 979,      mesesActivo: 26,  estado: 'Suspendido' },
    { cliente: 'Arrendo Properties by Pulppo',           importe: 979,      mesesActivo: 81,  estado: 'Suspendido' },
    { cliente: 'Travelling',                             importe: 12921.99, mesesActivo: 6,   estado: 'Inactivo'   },
    { cliente: 'EKTARIS GRUPO INMOBILIARIO',             importe: 3798,     mesesActivo: 5,   estado: 'Inactivo'   },
    { cliente: 'Custodias RJ',                           importe: 2920,     mesesActivo: 2,   estado: 'Inactivo'   },
    { cliente: 'Grupo Orve',                             importe: 2083,     mesesActivo: 104, estado: 'Inactivo'   },
    { cliente: '+ 5 inactivos adicionales',              importe: 6076.31,  mesesActivo: 0,   estado: 'Inactivo'   },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 2 · JUNIO 2026  (Semana 7 del GRC)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S2_JUNIO_2026: ChurnReporte = {
  id:      's2-junio-2026',
  periodo: 'Semana 2 · Jun 2026',
  fecha:   '11/06/2026',
  notas:   'Gross Revenue Churn · Semana 7. Al 11 de junio del 2026. Churn Q2: Abril 1.9% · Mayo 2.4% (corregido de 3%). Acumulado 2026: 10.7% (corregido de 11.3%). Siguiente revisión: viernes 19 de junio.',
  notaRemitente: 'Daniel Martínez — Solicitud especial: documentar la baja de chat aunque solo represente un downgrade. El equipo de Producto (Ing. Alex) requiere conocer el motivo. Casos prioritarios: Bliss crédito libre, Finsus Cobranza, Pronto LATAM, Akún.',

  grc: {
    evolucion: [
      { mes: 'Abril',                   pct: 1.9 },
      { mes: 'Mayo (corregido)',         pct: 2.4,  anterior: 3.0 },
    ],
    acumulado: 10.7,
    anterior:  11.3,
    notaClave: 'Churn Q2: Abril 1.9% · Mayo 2.4% (corrección de 3%). Acumulado 2026: 10.7% (corrección de 11.3%).',
    notaEspecial: '📋 Solicitud Producto (Ing. Alex): Documentar baja de CP Chat aunque solo represente downgrade — se requiere conocer el motivo de cada baja. Casos prioritarios identificados por Daniel Martínez: Bliss crédito libre, Finsus Cobranza, Pronto LATAM, Akún.',
  },

  /* En Corte — 24 cuentas · $180,215.03 */
  pendientesTotalReal:   180215.03,
  pendientesCuentasReal: 24,
  pendientes: [
    { cliente: '🔝 Municipio El Marqués', monto: 54659,    mesesActivo: 31,  ultimaFactura: '04/05/2026' },
    { cliente: 'Ancona Autopartes',       monto: 28156,    mesesActivo: 80,  ultimaFactura: '08/05/2026' },
    { cliente: 'MKG',                     monto: 17230.03, mesesActivo: 153, ultimaFactura: '06/05/2026' },
    { cliente: 'Omnitracs',               monto: 16500,    mesesActivo: 63,  ultimaFactura: '04/05/2026' },
    { cliente: 'Cintas Cove',             monto: 13560,    mesesActivo: 81,  ultimaFactura: '08/05/2026' },
    { cliente: 'IBC SUITES',              monto: 8025,     mesesActivo: 24,  ultimaFactura: '08/05/2026' },
    { cliente: 'Grupo Premier',           monto: 7134,     mesesActivo: 44,  ultimaFactura: '04/05/2026' },
    { cliente: 'Rotoplas',                monto: 4900,     mesesActivo: 149, ultimaFactura: '04/05/2026' },
    { cliente: 'CNX TELECOMUNICACIONES',  monto: 3843,     mesesActivo: 48,  ultimaFactura: '10/05/2026' },
    { cliente: 'NatGas - Mesa de Ayuda',  monto: 2912,     mesesActivo: 68,  ultimaFactura: '08/05/2026' },
    { cliente: 'WiFiTech',                monto: 2878,     mesesActivo: 73,  ultimaFactura: '05/05/2026' },
    { cliente: 'jemmoma',                 monto: 2634,     mesesActivo: 87,  ultimaFactura: '10/05/2026' },
    { cliente: 'GS Trackme',              monto: 2488,     mesesActivo: 66,  ultimaFactura: '06/05/2026' },
    { cliente: 'Grupo Premier Mochis',    monto: 2468,     mesesActivo: 36,  ultimaFactura: '04/05/2026' },
    { cliente: 'Superpass',               monto: 1959,     mesesActivo: 24,  ultimaFactura: '06/05/2026' },
    { cliente: 'Nuclea Solutions',        monto: 1684,     mesesActivo: 55,  ultimaFactura: '08/05/2026' },
    { cliente: 'Nido Fertility S.A.P.I.', monto: 1179,     mesesActivo: 7,   ultimaFactura: '10/05/2026' },
    { cliente: 'ViTrust',                 monto: 1143,     mesesActivo: 106, ultimaFactura: '06/05/2026' },
    { cliente: 'Prosanté México',         monto: 989,      mesesActivo: 73,  ultimaFactura: '04/05/2026' },
    { cliente: 'la victoria dulceria',    monto: 979,      mesesActivo: 5,   ultimaFactura: '09/05/2026' },
    { cliente: 'Ortodontica Natural Smile',monto: 979,     mesesActivo: 183, ultimaFactura: '05/05/2026' },
    { cliente: 'Remax Homelife One',      monto: 979,      mesesActivo: 109, ultimaFactura: '07/05/2026' },
    { cliente: 'World Pack',              monto: 979,      mesesActivo: 40,  ultimaFactura: '09/05/2026' },
    { cliente: 'investti',                monto: 979,      mesesActivo: 28,  ultimaFactura: '08/05/2026' },
    { cliente: 'Cañadas del Arroyo',      monto: 979,      mesesActivo: 71,  ultimaFactura: '08/05/2026' },
  ],

  /* Cancelados — 7 cuentas · $26,500 */
  cancelados: [
    { cliente: '🔝 TURBODAYS',                      mrr: 14018, mesesActivo: 0,  acumulado: 0 },
    { cliente: 'Madero Restaurante',                 mrr: 3782,  mesesActivo: 55, acumulado: 0 },
    { cliente: 'Grupo Empresarial Moran',            mrr: 3242,  mesesActivo: 91, acumulado: 0 },
    { cliente: 'HOWARD Corporativo Inmobiliario',    mrr: 1552,  mesesActivo: 35, acumulado: 0 },
    { cliente: 'Red t',                              mrr: 1488,  mesesActivo: 58, acumulado: 0 },
    { cliente: 'SalvadoreX',                         mrr: 1218,  mesesActivo: 11, acumulado: 0 },
    { cliente: 'Remax Quality',                      mrr: 1200,  mesesActivo: 90, acumulado: 0 },
  ],

  /* Suspendidos — 4 cuentas · $9,691 */
  suspendidosTotalReal:   9691,
  suspendidosCuentasReal: 4,
  suspendidos: [
    { cliente: '🔝 CH Desarrollos',    importe: 6342, mesesActivo: 68, estado: 'Suspendido' },
    { cliente: 'Nano Care America',    importe: 1377, mesesActivo: 66, estado: 'Suspendido' },
    { cliente: 'Ambientec',            importe: 986,  mesesActivo: 51, estado: 'Suspendido' },
    { cliente: 'The Erikson Agency',   importe: 986,  mesesActivo: 60, estado: 'Suspendido' },
  ],

  /* Desactivados — 5 cuentas · $10,031 */
  desactivadosTotalReal:   10031,
  desactivadosCuentasReal: 5,
  desactivados: [
    { cliente: '🔝 Gas Economico Metropolitano Chat', importe: 4500, mesesActivo: 39 },
    { cliente: 'Relematic.mx',                        importe: 1599, mesesActivo: 72 },
    { cliente: 'One Stay Hotel Residence',            importe: 1474, mesesActivo: 34 },
    { cliente: 'GASFERA',                             importe: 1339, mesesActivo: 58 },
    { cliente: 'Sunnies',                             importe: 1119, mesesActivo: 5  },
  ],

  /* Downgrades — 8 clientes · total desglosado $35,016.17 · real $40,358.43 */
  downgradeTotalReal: 40358.43,
  downgrades: [
    { cliente: '⚠️ Bliss crédito libre',  perdida: 8787.24, nota: 'Eliminó Agente CP Chat y Paquete WhatsApp API. Facturación $25,587 → $16,799. Conserva solo Paquete Min VyC. PRIORIDAD: documentar motivo de baja CP Chat.' },
    { cliente: '⚠️ Finsus Cobranza',      perdida: 7016,    nota: 'Reducción en 3 productos: Extensión Callcenter, Agente CP Chat y Ofuscador. MRR $11,211 → $4,195. PRIORIDAD: documentar motivo de baja CP Chat.' },
    { cliente: 'KIVA',                    perdida: 6000,    nota: 'Eliminó Paquete Min Voicebot ($6,000 → $0). Facturación total $7,177 → $1,177.' },
    { cliente: 'GBS Cuenta Maestra',      perdida: 5873.97, nota: 'Redujo Paquete Min VyC de $15,663 → $9,790. Facturación total $16,713 → $10,840.' },
    { cliente: 'Salud y Hogar',           perdida: 2573.96, nota: 'Quitó Plan Celular y bajó DID Nacional (pérdida bruta $4,874), pero hizo upsell en Extensión VyC con SIM (+$2,301). Pérdida neta $2,573.96.' },
    { cliente: 'Medical Hannover',        perdida: 1690,    nota: 'Eliminó Extensión VyC con SIM y Plan Celular, pero contrató Extensión VyC ($499). Sigue activo.' },
    { cliente: '⚠️ Pronto LATAM',         perdida: 1639,    nota: 'Eliminó Agente CP Chat ($1,495) y Paquete WhatsApp API ($144). PRIORIDAD: documentar motivo de baja CP Chat.' },
    { cliente: '⚠️ Akún',                 perdida: 1436,    nota: 'Redujo los 4 artículos de su factura: Min VyC, DiD Nacional, DiD Internacional y Agente CP Chat. PRIORIDAD: documentar motivo de baja CP Chat.' },
  ],

  /* Artículos más afectados en downgrades de junio */
  downgradeArticulos: [
    { articulo: 'Agente CP Chat',          vecesAfectado: 4, clientes: ['Bliss crédito libre', 'Finsus Cobranza', 'Pronto LATAM', 'Akún'] },
    { articulo: 'Paquete Min VyC',         vecesAfectado: 3, clientes: ['GBS Cuenta Maestra', 'Akún'] },
    { articulo: 'Paquete WhatsApp API',    vecesAfectado: 2, clientes: ['Bliss crédito libre', 'Pronto LATAM'] },
    { articulo: 'Plan Celular',            vecesAfectado: 2, clientes: ['Salud y Hogar', 'Medical Hannover'] },
    { articulo: 'DiD Nacional',            vecesAfectado: 2, clientes: ['Salud y Hogar', 'Akún'] },
    { articulo: 'Extensión VyC con SIM',   vecesAfectado: 2, clientes: ['Salud y Hogar', 'Medical Hannover'] },
    { articulo: 'Paquete Min Voicebot',    vecesAfectado: 1, clientes: ['KIVA'] },
    { articulo: 'Extensión Callcenter',    vecesAfectado: 1, clientes: ['Finsus Cobranza'] },
    { articulo: 'Ofuscador',               vecesAfectado: 1, clientes: ['Finsus Cobranza'] },
    { articulo: 'DiD Internacional',       vecesAfectado: 1, clientes: ['Akún'] },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 8 · JUNIO 2026  (19 jun 2026)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S3_JUNIO_2026: ChurnReporte = {
  id:      's3-junio-2026',
  periodo: 'Semana 8 · Jun 2026',
  fecha:   '19/06/2026',
  notas:   'Gross Revenue Churn · Semana 8. Al 19 de junio del 2026. Churn Q2: Abril 1.9% · Mayo 2.4% (corr.). Acumulado 2026: 10.2% (corr. de 10.7%). 35 cuentas en corte · 17 canceladas · 11 suspendidas · 10 downgrades. Siguiente revisión: viernes 26 de junio.',
  notaRemitente: 'Daniel Martínez — Solicitud: responder con información o retro de las cuentas identificadas. Se requiere retroalimentación del equipo para documentar motivos.',

  grc: {
    evolucion: [
      { mes: 'Abril',              pct: 1.9              },
      { mes: 'Mayo (corregido)',   pct: 2.4, anterior: 3.0 },
    ],
    acumulado: 10.2,
    anterior:  10.7,
    notaClave: 'Churn Q2: Abril 1.9% · Mayo 2.4% (corrección). Acumulado 2026: 10.2% (corrección de 10.7%).',
    notaEspecial: '📋 Pendiente semana anterior sin pagar ($82,256.03 · 8 cuentas): Municipio El Marqués $54,659 (31 meses) · MKG $17,230 (153 meses) · NatGas Mesa de Ayuda $2,912 · jemmoma $2,634 · Nuclea Solutions $1,684 · Nido Fertility $1,179 · la victoria dulceria $979 · World Pack $979. Requieren seguimiento urgente.',
  },

  /* En Corte — top 10 de 35 cuentas · $47,518 */
  pendientesTotalReal:   47518,
  pendientesCuentasReal: 35,
  pendientes: [
    { cliente: '🔝 SAMALAB',                          monto: 5756, mesesActivo: 26, ultimaFactura: '12/05/2026' },
    { cliente: 'Linea de Apoyo',                       monto: 4127, mesesActivo: 36, ultimaFactura: '17/05/2026' },
    { cliente: 'DOSATEC',                              monto: 3963, mesesActivo: 13, ultimaFactura: '15/05/2026' },
    { cliente: "Pipolo's",                             monto: 3480, mesesActivo: 67, ultimaFactura: '15/05/2026' },
    { cliente: 'INMOBILIARIA EL PORVENIR',             monto: 3439, mesesActivo: 61, ultimaFactura: '16/05/2026' },
    { cliente: 'SISESCO',                              monto: 2586, mesesActivo: 15, ultimaFactura: '17/05/2026' },
    { cliente: 'Comercial de Especialidades Medicas',  monto: 2497, mesesActivo: 53, ultimaFactura: '15/05/2026' },
    { cliente: 'Bosque Eterno',                        monto: 2338, mesesActivo: 68, ultimaFactura: '15/05/2026' },
    { cliente: 'VANGUARDA',                            monto: 1959, mesesActivo: 98, ultimaFactura: '13/05/2026' },
    { cliente: 'Aceros y Metales del Norte',           monto: 1659, mesesActivo: 16, ultimaFactura: '13/05/2026' },
    { cliente: '+ 25 cuentas adicionales',             monto: 15820,mesesActivo: 0,  ultimaFactura: 'Ver lista completa en documento' },
  ],

  /* Cancelados — 17 cuentas · $14,261.31 */
  cancelados: [
    { cliente: '🔝 Armonmex',                mrr: 2454,   mesesActivo: 0,   acumulado: 0 },
    { cliente: 'Aristea',                     mrr: 2387,   mesesActivo: 5,   acumulado: 0 },
    { cliente: 'GRUPO BC BIENES RAICES',      mrr: 1959,   mesesActivo: 36,  acumulado: 0 },
    { cliente: 'Colegio NWL - Milenio',       mrr: 1392,   mesesActivo: 61,  acumulado: 0 },
    { cliente: 'Bondeados Grupo Revilla',     mrr: 1389,   mesesActivo: 67,  acumulado: 0 },
    { cliente: 'MxBoxing',                    mrr: 839,    mesesActivo: 28,  acumulado: 0 },
    { cliente: 'Abkam',                       mrr: 679,    mesesActivo: 141, acumulado: 0 },
    { cliente: 'KUMON LA PRADERA',            mrr: 597,    mesesActivo: 11,  acumulado: 0 },
    { cliente: 'Comercial Regasa',            mrr: 489,    mesesActivo: 3,   acumulado: 0 },
    { cliente: 'RESTA TOOLS',                 mrr: 489,    mesesActivo: 88,  acumulado: 0 },
    { cliente: 'Lunah Eco-resorts CDMX',      mrr: 367,    mesesActivo: 38,  acumulado: 0 },
    { cliente: 'Casa Santiago',               mrr: 299,    mesesActivo: 21,  acumulado: 0 },
    { cliente: 'GRUPO REACCION GPS',          mrr: 259,    mesesActivo: 43,  acumulado: 0 },
    { cliente: 'Persianas Marais',            mrr: 195,    mesesActivo: 1,   acumulado: 0 },
    { cliente: 'Rodolfo Guerrero Scott',      mrr: 169,    mesesActivo: 45,  acumulado: 0 },
    { cliente: 'Quimicos XY',                 mrr: 169,    mesesActivo: 46,  acumulado: 0 },
    { cliente: 'SEDEMEX',                     mrr: 129.31, mesesActivo: 46,  acumulado: 0 },
  ],

  /* Downgrades — 10 clientes · desglosado $10,781.74 · real $13,351.03 */
  downgradeTotalReal: 13351.03,
  downgrades: [
    { cliente: 'AJ PENNY BLINDS',     perdida: 2653,    nota: 'Redujo Agente CP Chat de $4,169 → $1,516.' },
    { cliente: 'Dicap Desarrollos',   perdida: 2017,    nota: 'Redujo Paquete Min VyC de $2,398 → $381.' },
    { cliente: '⚠️ GTC — 8 sucursales (Patrón corporativo)', perdida: 6111.74, nota: '~67% del downgrade total. Las 8 sucursales GTC reducen el mismo artículo "Paquete Ops Automatizaciones" de forma proporcional — decisión corporativa de ajuste de presupuesto. GTC-NAVA −$1,102.44 · GTC-CENTRO MAX −$1,102.44 · GTC-FORUM −$801.57 · GTC-BMW −$800.85 · GTC-SENDERO −$601 · GTC-CARRANZA −$601 · GTC-MG LOMAS −$551.22 · GTC-MG POLIFORUM −$551.22.' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Ops Automatizaciones', vecesAfectado: 8, clientes: ['GTC-NAVA', 'GTC-CENTRO MAX', 'GTC-FORUM', 'GTC-BMW', 'GTC-SENDERO', 'GTC-CARRANZA', 'GTC-MG LOMAS', 'GTC-MG POLIFORUM'] },
    { articulo: 'Agente CP Chat',               vecesAfectado: 1, clientes: ['AJ PENNY BLINDS'] },
    { articulo: 'Paquete Min VyC',              vecesAfectado: 1, clientes: ['Dicap Desarrollos'] },
  ],

  /* Suspendidos — 11 cuentas · $5,894 */
  suspendidosTotalReal:   5894,
  suspendidosCuentasReal: 11,
  suspendidos: [
    { cliente: '🔝 Energix',                          importe: 1021, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Puerta del Cielo',                    importe: 889,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Llano de la Torre',                   importe: 800,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'SOJO INCENDIO',                       importe: 576,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'ELECTRONICOS INTMEX',                 importe: 489,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Master Blue',                         importe: 489,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Luber ingenieria',                    importe: 489,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Elias Calles y Karam Abogados',       importe: 489,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Track One',                           importe: 358,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Servicios técnicos y profesionales',  importe: 195,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'PlastilinaBTl',                       importe: 99,   mesesActivo: 0, estado: 'Suspendido' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 9 · JUNIO 2026  (26 jun 2026)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S4_JUNIO_2026: ChurnReporte = {
  id:      's4-junio-2026',
  periodo: 'Semana 9 · Jun 2026',
  fecha:   '26/06/2026',
  notas:   'Gross Revenue Churn · Semana 9. Al 26 de junio del 2026. GRC Junio: 13.2% · Acumulado 2026: 10.1%. 35 cuentas en corte ($58,889.65) · 5 canceladas ($5,904) · 3 suspendidas ($11,454) · 8 downgrades. Hallazgo GTC: MRR $70,025 → $45,474 (−35.1% en 2 meses). Resumen 1er semestre: Cancelaciones $485,296 · Downgrades $150,469.',
  notaRemitente: 'Daniel Martínez — Solicitud de retroalimentación sobre cuentas identificadas. Resumen 1er semestre 2026 disponible.',

  grc: {
    evolucion: [
      { mes: 'Enero',   pct: 2.0 },
      { mes: 'Febrero', pct: 2.1 },
      { mes: 'Marzo',   pct: 2.3 },
      { mes: 'Abril',   pct: 1.9 },
      { mes: 'Mayo',    pct: 1.8 },
      { mes: 'Junio',   pct: 13.2 },
    ],
    acumulado: 10.1,
    anterior:  16.5,
    notaClave: 'GRC Junio: 13.2% — pico más alto del año. Acumulado 2026: 10.1% (anterior 16.5%). Hallazgo crítico: MRR del grupo GTC cayó de $70,025 → $45,474 (−35.1% en 2 meses). Se requiere revisión urgente del portafolio GTC.',
    notaEspecial: '🚨 Hallazgo GTC: El MRR del grupo GTC cayó de $70,025 a $45,474 en solo 2 meses (−35.1%). 8 sucursales con reducciones coordinadas en artículos clave. Resumen 1er semestre 2026: Cancelaciones acumuladas $485,296 · Downgrades acumulados $150,469.',
  },

  /* En Corte — top 5 de 35 cuentas · total $58,889.65 */
  pendientesTotalReal:   58889.65,
  pendientesCuentasReal: 35,
  pendientes: [
    { cliente: '🔝 Blueservices',             monto: 24616.03, mesesActivo: 0, ultimaFactura: '' },
    { cliente: 'Depósito Dental Reisix',       monto: 2878,     mesesActivo: 0, ultimaFactura: '' },
    { cliente: 'ZD-Constructora Valcasa',      monto: 2596,     mesesActivo: 0, ultimaFactura: '' },
    { cliente: 'Segutrends',                   monto: 2187,     mesesActivo: 0, ultimaFactura: '' },
    { cliente: 'Novahogar',                    monto: 2166,     mesesActivo: 0, ultimaFactura: '' },
    { cliente: '+ 30 cuentas adicionales',     monto: 24446.62, mesesActivo: 0, ultimaFactura: 'Ver detalle completo' },
  ],

  /* Cancelados — 5 cuentas · $5,904 */
  cancelados: [
    { cliente: 'Adim ecosistema', mrr: 1959, mesesActivo: 0,  acumulado: 0 },
    { cliente: 'satvpafc',        mrr: 1771, mesesActivo: 30, acumulado: 0 },
    { cliente: 'Kayrot',          mrr: 1196, mesesActivo: 23, acumulado: 0 },
    { cliente: '+ 2 cuentas',     mrr: 978,  mesesActivo: 0,  acumulado: 0 },
  ],

  /* Downgrades — 8 clientes · total $43,425.68 */
  downgradeTotalReal: 43425.68,
  downgrades: [
    { cliente: '⚠️ Pitahaya',            perdida: 11189,   nota: 'Mayor downgrade del período. Reducción significativa en artículos contratados.' },
    { cliente: '⚠️ Bliss crédito libre', perdida: 8787,    nota: 'Reducción en artículos CP Chat y servicios complementarios.' },
    { cliente: 'MKG',                     perdida: 5947,    nota: 'Reducción en Paquete Min VyC u otros artículos del portafolio.' },
    { cliente: 'SAMALAB',                 perdida: 3000,    nota: '2° mes consecutivo de reducción en artículos.' },
    { cliente: 'AGRANS',                  perdida: 2570,    nota: 'Reducción en servicios contratados.' },
    { cliente: 'SG LOCALIZACION',         perdida: 1894,    nota: '2° mes consecutivo de reducción en artículos.' },
    { cliente: 'Medical Hannover',        perdida: 1191,    nota: 'Reducción en artículos del portafolio.' },
    { cliente: '⚠️ GTC — 8 sucursales (Hallazgo)', perdida: 6111.74, nota: 'Hallazgo: MRR GTC $70,025 → $45,474 (−35.1% en 2 meses). Las 8 sucursales reducen artículos clave de forma coordinada. Requiere revisión estratégica urgente.' },
  ],

  /* Suspendidos — 3 cuentas · $11,454 */
  suspendidosTotalReal:   11454,
  suspendidosCuentasReal: 3,
  suspendidos: [
    { cliente: 'SERVICIO TECNICO MORELIA', importe: 5883, mesesActivo: 91, estado: 'Suspendido' },
    { cliente: 'Linmex',                   importe: 4592, mesesActivo: 9,  estado: 'Suspendido' },
    { cliente: 'Arrendo Renta Fácil',      importe: 979,  mesesActivo: 18, estado: 'Suspendido' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE DE CIERRE — JUNIO 2026 (30 jun 2026)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_CIERRE_JUNIO_2026: ChurnReporte = {
  id:      'cierre-junio-2026',
  periodo: 'Cierre Junio 2026',
  fecha:   '30/06/2026',
  notas:   'Gross Revenue Churn · Cierre de Mes — 1er Semestre 2026. Al 30 de junio del 2026. Consolidado de semanas 7–10: corte esperando pago, suspendidos, cancelados, downgrades del período y artículos más afectados del mes. Fuente: Daniel Martínez — correo de cierre enviado 3 Jul 2026.',
  notaRemitente: 'Daniel Martínez — Correo de cierre 1er semestre 2026. Solicita comentarios respondiendo al correo. Para análisis de downgrade por artículo: Consulta de churn y downgrade por artículo. Para casos a detalle: Documento Casos.',

  grc: {
    evolucion: [
      { mes: 'Abril',           pct: 1.8, anterior: 1.9 },
      { mes: 'Mayo',            pct: 1.8 },
      { mes: 'Junio',           pct: 7.7, anterior: 13.2 },
    ],
    acumulado: 17.7,
    notaClave: 'Churn Q2: Abril 1.8% · Mayo 1.8% · Junio 7.7% (inicial 13.2%, corregido). Churn acumulado 2026: 17.7%.',
    notaEspecial: '⚠️ Seguimiento de cuentas en corte por semana — Sem 7: $10,367 · 6 cuentas (NatGas, jemmoma, Nuclea, Nido Fertility, la victoria, World Pack). Sem 8: $9,843 · 13 cuentas (SISESCO, Aceros y Metales del Norte, Grupo GECH, Floreria Suspiros…). Sem 9: $21,451 · 23 cuentas (Segutrends, Novahogar, Grúas Gutigon…). Sem 10 actual: $49,186 · 37 cuentas. 🚨 Finsus grow: $121,500 — caso especial. La 2ª factura del mes aún no se ha generado. NO es baja real — verificar emisión pendiente urgente.',
  },

  /* En Corte Sem 10 (actual) — top 5 de 37 cuentas · total $49,186 */
  pendientesTotalReal:   49186,
  pendientesCuentasReal: 37,
  pendientes: [
    { cliente: '🔝 Embler Autopartes',    monto: 5874, mesesActivo: 7,  ultimaFactura: '25/05/2026' },
    { cliente: 'Not Just',                monto: 5089, mesesActivo: 3,  ultimaFactura: '28/05/2026' },
    { cliente: 'TROQUELADOS MODULARES',   monto: 4790, mesesActivo: 38, ultimaFactura: '31/05/2026' },
    { cliente: 'TAQUERIA EL PARIENTE',    monto: 3500, mesesActivo: 83, ultimaFactura: '29/05/2026' },
    { cliente: 'iA Solutions',            monto: 2068, mesesActivo: 14, ultimaFactura: '25/05/2026' },
    { cliente: '+ 32 cuentas adicionales',monto: 27865,mesesActivo: 0,  ultimaFactura: 'Ver lista completa en el documento' },
  ],

  /* Cancelados — 6 cuentas · $7,365 */
  cancelados: [
    { cliente: '🔝 ZD - Grupo Liber',              mrr: 2355, mesesActivo: 28, acumulado: 0 },
    { cliente: 'IT REINGENIERIAS',                  mrr: 1959, mesesActivo: 87, acumulado: 0 },
    { cliente: 'RELIABLEGLOBALMANAGEMENTLME',        mrr: 1389, mesesActivo: 0,  acumulado: 0 },
    { cliente: '+ 3 cuentas adicionales',           mrr: 1662, mesesActivo: 0,  acumulado: 0 },
  ],

  /* Desactivados: cancelados < 3 meses de vida — 7 cuentas · $18,440 */
  desactivadosTotalReal:   18440,
  desactivadosCuentasReal: 7,
  desactivados: [
    { cliente: '🔝 TURBODAYS',                              importe: 14018, mesesActivo: 0 },
    { cliente: 'Adim ecosistema de cumplimiento normativo',  importe: 1959,  mesesActivo: 0 },
    { cliente: 'RELIABLEGLOBALMANAGEMENTLME',                importe: 1389,  mesesActivo: 0 },
    { cliente: 'Comercial Regasa',                           importe: 489,   mesesActivo: 3 },
    { cliente: 'Persianas Marais',                           importe: 195,   mesesActivo: 1 },
    { cliente: 'Servicios Industriales del Bajio',           importe: 195,   mesesActivo: 3 },
    { cliente: 'Despacho Ruiz',                              importe: 195,   mesesActivo: 0 },
  ],

  /* Suspendidos — 8 cuentas · $6,292 */
  suspendidosTotalReal:   6292,
  suspendidosCuentasReal: 8,
  suspendidos: [
    { cliente: '🔝 HONDA TEZONTLE',                    importe: 1396, mesesActivo: 24, estado: 'Suspendido' },
    { cliente: 'CF Group',                              importe: 1182, mesesActivo: 22, estado: 'Suspendido' },
    { cliente: 'Refacciones y reparaciones del norte',  importe: 979,  mesesActivo: 16, estado: 'Suspendido' },
    { cliente: '+ 5 cuentas adicionales',               importe: 2735, mesesActivo: 0,  estado: 'Suspendido' },
  ],

  /* Downgrades significativos del mes — $180,760.14 · 12 clientes
     (Finsus grow excluido del total real: verificación pendiente) */
  downgradeTotalReal: 180760.14,
  downgrades: [
    { cliente: '🚨 Finsus grow (VERIFICAR)',  perdida: 121500,   nota: 'CASO ESPECIAL — No confirmar como baja real. Finsus tiene 2 facturas al mes y la 2ª aún no se ha generado. Verificar emisión pendiente urgente antes de contabilizar como downgrade.' },
    { cliente: '⚠️ Pitahaya',               perdida: 11188.97, nota: 'Eliminó Paquete Min VyC ($9,799) y DID Nacional ($1,584). Sigue activa solo con Paquete Min CE ($195).' },
    { cliente: '⚠️ Bliss crédito libre',    perdida: 8787.24,  nota: 'Eliminó Agente CP Chat y Paquete WhatsApp API. Conserva solo Paquete Min VyC.' },
    { cliente: 'Finsus Cobranza',           perdida: 7016,     nota: 'Redujo 3 productos: Extensión Callcenter, Agente CP Chat y Ofuscador. MRR de $11,211 → $4,195.' },
    { cliente: 'KIVA',                      perdida: 6000,     nota: 'Eliminó Paquete Min Voicebot ($6,000 → $0). Facturación total de $7,177 → $1,177.' },
    { cliente: 'MKG',                       perdida: 5947,     nota: 'Redujo PSTN Nacional y Extensión VyC, pero hizo upsell en Extensión Callcenter (+$899). Pérdida neta real.' },
    { cliente: 'GBS Cuenta Maestra',        perdida: 5873.97,  nota: 'Redujo Paquete Min VyC de $15,663 → $9,790. Facturación total de $16,713 → $10,840.' },
    { cliente: 'Polak Grupo',               perdida: 3650,     nota: 'Redujo Paquete Min CE de $30,630 → $26,980.' },
    { cliente: 'SAMALAB',                   perdida: 3000,     nota: 'Eliminó Paquete Min Voicebot ($3,000 → $0).' },
    { cliente: 'AJ PENNY BLINDS',           perdida: 2653,     nota: 'Redujo Agente CP Chat de $4,169 → $1,516.' },
    { cliente: 'Salud y Hogar',             perdida: 2573.96,  nota: 'Eliminó Plan Celular y bajó DID Nacional. Pérdida bruta $4,874, compensada con upsell en Extensión VyC con SIM (+$2,301).' },
    { cliente: 'AGRANS',                    perdida: 2570,     nota: 'Redujo Extensión VyC de $4,886 → $2,316.' },
  ],

  /* Artículos más afectados — consolidado semanas 7–10 + significativos */
  downgradeArticulos: [
    { articulo: 'Paquete Min VyC',          vecesAfectado: 4, clientes: ['Pitahaya', 'GBS Cuenta Maestra', 'Dicap Desarrollos', 'Akún'] },
    { articulo: 'Agente CP Chat',           vecesAfectado: 4, clientes: ['Bliss crédito libre', 'Finsus Cobranza', 'AJ Penny Blinds', 'Akún'] },
    { articulo: 'Paquete Min Voicebot',     vecesAfectado: 3, clientes: ['KIVA', 'SAMALAB', 'SAMALAB (sem. anterior)'] },
    { articulo: 'Extensión VyC',            vecesAfectado: 3, clientes: ['AGRANS', 'MKG', 'Medical Hannover'] },
    { articulo: 'DID Nacional',             vecesAfectado: 4, clientes: ['Pitahaya', 'Salud y Hogar', 'SISDASA', 'Akún'] },
    { articulo: 'Paquete Ops Automatizaciones', vecesAfectado: 3, clientes: ['GTC - NAVA', 'GTC - CENTRO MAX', '+ 6 sucursales GTC (sem. 8)'] },
    { articulo: 'Extensión VyC con SIM',    vecesAfectado: 2, clientes: ['Medical Hannover', 'Salud y Hogar'] },
    { articulo: 'Plan Celular',             vecesAfectado: 2, clientes: ['Medical Hannover', 'Salud y Hogar'] },
    { articulo: 'Paquete WhatsApp API',     vecesAfectado: 2, clientes: ['Bliss crédito libre', 'Pronto LATAM'] },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 11 · JULIO 2026  (10 jul 2026)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S1_JULIO_2026: ChurnReporte = {
  id:      's1-julio-2026',
  periodo: 'Semana 11 · Jul 2026',
  fecha:   '10/07/2026',
  notas:   'Gross Revenue Churn · Semana 11. Al 10 de julio del 2026. Primer corte de julio con estado de cuentas en corte, suspendidos, desactivados y downgrades. MRR inicial julio: $4,877,021.32 (−$194,744.89 vs junio). Siguiente revisión: viernes 17 de julio.',
  notaRemitente: 'Daniel Martínez — Solicita comentarios u observaciones sobre el reporte respondiendo al correo.',

  grc: {
    evolucion: [
      { mes: 'Abril',           pct: 1.8, anterior: 1.9 },
      { mes: 'Mayo',            pct: 1.6, anterior: 1.8 },
      { mes: 'Junio',           pct: 3.7, anterior: 7.7 },
    ],
    acumulado: 13.6,
    anterior:  17.7,
    notaClave: 'Churn Q2 corregido: Abril 1.8% · Mayo 1.6% (corr. 1.8%) · Junio 3.7% (corr. 7.7%). Acumulado 2026: 13.6% (corr. 17.7%).',
    notaEspecial: '⚠️ MRR inicial julio bajó $194,744.89 vs junio — la caída no refleja cancelaciones reales. Varios clientes sin factura en junio fueron clasificados automáticamente como churn y sus facturas se emitieron en julio, contabilizándose como reactivaciones (~$98,000 con MRR inicial = $0). ✅ Finsus grow: migrado a cuenta "Finsus Producto", ingreso al corriente. Pendientes de meses anteriores — Sem 7: $10,367 · Sem 8: $9,843 · Sem 9: $21,451 · Sem 10: $49,186.',
  },

  /* En Corte Sem 1 Julio — top 10 de 20 cuentas · total $59,876.50 */
  pendientesTotalReal:   59876.50,
  pendientesCuentasReal: 20,
  pendientes: [
    { cliente: '🔝 Jason de Mexico',          monto: 17225, mesesActivo: 40,  ultimaFactura: '04/06/2026' },
    { cliente: 'Inteligencia Canina',          monto: 5568,  mesesActivo: 91,  ultimaFactura: '02/06/2026' },
    { cliente: 'Chipotle Ads',                 monto: 4866,  mesesActivo: 47,  ultimaFactura: '02/06/2026' },
    { cliente: 'PIXKITEC',                     monto: 4424,  mesesActivo: 78,  ultimaFactura: '04/06/2026' },
    { cliente: 'multileads 2',                 monto: 4110,  mesesActivo: 56,  ultimaFactura: '02/06/2026' },
    { cliente: 'AdminPlus',                    monto: 2718,  mesesActivo: 71,  ultimaFactura: '04/06/2026' },
    { cliente: 'Skyhous',                      monto: 2497,  mesesActivo: 63,  ultimaFactura: '05/06/2026' },
    { cliente: 'CFMOTO MONTERREY',             monto: 2398,  mesesActivo: 24,  ultimaFactura: '02/06/2026' },
    { cliente: 'iMarz',                        monto: 2256,  mesesActivo: 16,  ultimaFactura: '06/06/2026' },
    { cliente: 'TRIBECA HAIR STUDIO',          monto: 1767,  mesesActivo: 51,  ultimaFactura: '07/06/2026' },
    { cliente: '+ 10 cuentas adicionales',     monto: 12048.50, mesesActivo: 0, ultimaFactura: 'Ver lista completa en el dashboard' },
  ],

  cancelados: [],

  /* Downgrades Sem 1 Julio — 8 clientes · $10,851.80 */
  downgradeTotalReal: 10851.80,
  downgrades: [
    { cliente: 'Corporativo Videci',      perdida: 1729,   nota: '88% de baja. Paquete Min VyC de $1,959 → $230.' },
    { cliente: 'ROAL TRANSPORTES',        perdida: 730.80, nota: '88% de baja. Eliminó Paquete Min CE y Paquete 800. Redujo DiD Nacional de $282 → $99.' },
    { cliente: 'MIRA DIAMANTE SOLUCLOUD', perdida: 1122,   nota: '82% de baja. Paquete Min VyC de $1,364 → $242.' },
    { cliente: 'Probemedic Farmacias',    perdida: 747,    nota: '59% de baja. Agente CP Chat de $1,247 → $500.' },
    { cliente: 'ZD - Midstorage',         perdida: 1571,   nota: '40% de baja. Paquete Min VyC de $2,837 → $1,959. DiD Nacional de $1,089 → $396.' },
    { cliente: '3DX',                     perdida: 607,    nota: '23% de baja. Eliminó Agente CP Chat ($508) y DiD Nacional ($99).' },
    { cliente: 'El Surtidor',             perdida: 880,    nota: '11% de baja. Paquete Min VyC de $7,840 → $6,960.' },
    { cliente: 'EMPODERA SALUD',          perdida: 589.01, nota: '3% de baja. Eliminó Extensión VyC ($589).' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Min VyC', vecesAfectado: 4, clientes: ['Corporativo Videci', 'MIRA DIAMANTE SOLUCLOUD', 'ZD - Midstorage', 'El Surtidor'] },
    { articulo: 'DiD Nacional',    vecesAfectado: 3, clientes: ['ZD - Midstorage', 'ROAL TRANSPORTES', '3DX'] },
    { articulo: 'Agente CP Chat',  vecesAfectado: 2, clientes: ['Probemedic Farmacias', '3DX'] },
  ],

  /* Suspendidos Sem 1 Julio — 5 cuentas · $6,836.31 */
  suspendidosTotalReal:   6836.31,
  suspendidosCuentasReal: 5,
  suspendidos: [
    { cliente: '🔝 Custodias RJ',                 importe: 2920,   mesesActivo: 4,   estado: 'Suspendido' },
    { cliente: 'Servitaxi Rincón de Palma Real',  importe: 979.31, mesesActivo: 2,   estado: 'Suspendido' },
    { cliente: 'SPORTIX RL',                      importe: 979,    mesesActivo: 42,  estado: 'Suspendido' },
    { cliente: 'Urbanelle BH Inmobiliaria',       importe: 979,    mesesActivo: 5,   estado: 'Suspendido' },
    { cliente: 'Montebello Towers',               importe: 979,    mesesActivo: 116, estado: 'Suspendido' },
  ],

  /* Desactivados Sem 1 Julio — 3 cuentas · $6,811 */
  desactivadosTotalReal:   6811,
  desactivadosCuentasReal: 3,
  desactivados: [
    { cliente: '🔝 Contenedores Mas', importe: 2812, mesesActivo: 49  },
    { cliente: 'PIXEL WINDOW',        importe: 2019, mesesActivo: 105 },
    { cliente: 'TRACK SPEQ',          importe: 1980, mesesActivo: 27  },
  ],
}

/* Clientes T1 (histórico fijo) */
const T1_CLIENTES = [
  { cliente: 'GDA - Genética',          perdida: 12812,   tipo: 'Churn confirmado', mes: 'Enero'   },
  { cliente: 'GDA - Polab',             perdida: 5800,    tipo: 'Churn confirmado', mes: 'Enero'   },
  { cliente: 'GDA - Family Labs',       perdida: 4580,    tipo: 'Churn confirmado', mes: 'Enero'   },
  { cliente: 'MB Signature Properties', perdida: 9697.03, tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'Servidiesel',             perdida: 7065,    tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'Campus Residencias',      perdida: 6459,    tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'TYR International',       perdida: 3969,    tipo: 'Churn confirmado', mes: 'Febrero' },
  { cliente: 'ZIBAHOME',                perdida: 3830,    tipo: 'Downgrade',        mes: 'Febrero' },
  { cliente: 'Velfare',                 perdida: 13780,   tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'WOLFTOWERS',              perdida: 7876,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'GTC - TLALPAN',           perdida: 6760,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'Coristylo',               perdida: 6249,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'GTC - LA JOYA',           perdida: 5986,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'GTC - CROSSING',          perdida: 4042,    tipo: 'Churn confirmado', mes: 'Marzo'   },
  { cliente: 'Robotix',                 perdida: 3886,    tipo: 'Churn confirmado', mes: 'Marzo'   },
]
const TOTAL_T1     = 300510
const TOTAL_T1_REL = 102791.03

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
const fmt = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

const LS_KEY = 'churn_reportes'

function loadReportes(): ChurnReporte[] {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : [] }
  catch { return [] }
}
function saveReportes(list: ChurnReporte[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function emptyPendiente(): ChurnPendiente  { return { cliente: '', monto: 0, mesesActivo: 0, ultimaFactura: '' } }
function emptyCancelado(): ChurnCancelado  { return { cliente: '', mrr: 0, mesesActivo: 0, acumulado: 0 } }
function emptyDowngrade(): ChurnDowngrade  { return { cliente: '', perdida: 0, nota: '' } }

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENTES UI REUTILIZABLES
═══════════════════════════════════════════════════════════════════════ */
function SemaforoDot({ tipo }: { tipo: SemaforoChurn }) {
  const s = SEMAFORO_MAP[tipo]
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
      style={{ background: `${s.color}15`, color: s.color, borderColor: `${s.color}35` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }:
  { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function SemaforoLeyenda() {
  return (
    <div className="flex flex-wrap gap-3">
      {(Object.entries(SEMAFORO_MAP) as [SemaforoChurn, typeof SEMAFORO_MAP[SemaforoChurn]][]).map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />
          {v.dot} {v.label}
        </span>
      ))}
    </div>
  )
}

function DowngradeRow({ d }: { d: ChurnDowngrade }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr className="border-b border-gray-100 cursor-pointer hover:bg-amber-50/40 transition-colors"
        onClick={() => setOpen(v => !v)}>
        <td className="py-3 px-4 text-sm font-medium text-gray-900">{d.cliente}</td>
        <td className="py-3 px-4 text-right font-semibold text-sm" style={{ color: AMBER }}>{fmt(d.perdida)}</td>
        <td className="py-3 px-4"><SemaforoDot tipo="downgrade" /></td>
        <td className="py-3 px-4 text-gray-400">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
      </tr>
      {open && (
        <tr className="border-b border-gray-100 bg-amber-50/30">
          <td colSpan={4} className="px-4 py-3 text-xs text-gray-600 leading-relaxed">{d.nota}</td>
        </tr>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   FORMULARIO MULTI-PASO
═══════════════════════════════════════════════════════════════════════ */
const FORM_STEPS = ['Período & Notas', 'Pendientes', 'Cancelados', 'Downgrades']

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 bg-white'
const numCls   = `${inputCls} text-right`
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1'
const addBtnCls = 'flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 mt-2'
const delBtnCls = 'text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0'

function ChurnForm({ onClose, onSave }: { onClose: () => void; onSave: (r: ChurnReporte) => void }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<ChurnReporte>({
    id: '', periodo: '', fecha: '', notas: '',
    pendientes: [emptyPendiente()],
    cancelados: [emptyCancelado()],
    downgrades: [emptyDowngrade()],
  })

  const set = <K extends keyof ChurnReporte>(k: K, v: ChurnReporte[K]) =>
    setData(d => ({ ...d, [k]: v }))

  /* pendientes */
  const setPend = (i: number, f: keyof ChurnPendiente, v: string | number) =>
    setData(d => ({ ...d, pendientes: d.pendientes.map((r, j) => j === i ? { ...r, [f]: v } : r) }))
  const addPend  = () => setData(d => ({ ...d, pendientes: [...d.pendientes, emptyPendiente()] }))
  const delPend  = (i: number) => setData(d => ({ ...d, pendientes: d.pendientes.filter((_, j) => j !== i) }))

  /* cancelados */
  const setCanc  = (i: number, f: keyof ChurnCancelado, v: string | number) =>
    setData(d => ({ ...d, cancelados: d.cancelados.map((r, j) => j === i ? { ...r, [f]: v } : r) }))
  const addCanc  = () => setData(d => ({ ...d, cancelados: [...d.cancelados, emptyCancelado()] }))
  const delCanc  = (i: number) => setData(d => ({ ...d, cancelados: d.cancelados.filter((_, j) => j !== i) }))

  /* downgrades */
  const setDown  = (i: number, f: keyof ChurnDowngrade, v: string | number) =>
    setData(d => ({ ...d, downgrades: d.downgrades.map((r, j) => j === i ? { ...r, [f]: v } : r) }))
  const addDown  = () => setData(d => ({ ...d, downgrades: [...d.downgrades, emptyDowngrade()] }))
  const delDown  = (i: number) => setData(d => ({ ...d, downgrades: d.downgrades.filter((_, j) => j !== i) }))

  const canSave = data.periodo.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    const id = data.id.trim() || data.periodo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    onSave({ ...data, id })
  }

  /* Totales del resumen */
  const totPend = data.pendientes.reduce((s, r) => s + (Number(r.monto) || 0), 0)
  const totCanc = data.cancelados.reduce((s, r) => s + (Number(r.mrr)   || 0), 0)
  const totDown = data.downgrades.reduce((s, r) => s + (Number(r.perdida) || 0), 0)

  const renderStep = () => {
    /* ── PASO 0 ───────────────────────────────────────────────────── */
    if (step === 0) return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Período <span className="text-red-400">*</span></label>
            <input value={data.periodo} onChange={e => set('periodo', e.target.value)}
              placeholder="ej. Semana 20 – Mayo 2026" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Fecha del análisis</label>
            <input value={data.fecha} onChange={e => set('fecha', e.target.value)}
              placeholder="ej. 12/05/2026" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Notas del área DATA (opcional)</label>
          <textarea value={data.notas} onChange={e => set('notas', e.target.value)}
            placeholder="Observaciones generales, contexto, decisiones a tomar..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 bg-white resize-y min-h-[90px]" />
        </div>

        {/* Resumen de lo que se va a capturar */}
        <div className="rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50/60">
          <p className="text-xs font-semibold text-gray-500 mb-3">Resumen de captura (se actualiza en cada paso)</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pendientes',  val: fmt(totPend), count: data.pendientes.filter(r => r.cliente).length, color: ORANGE },
              { label: 'Cancelados',  val: fmt(totCanc), count: data.cancelados.filter(r => r.cliente).length, color: RED    },
              { label: 'Downgrades',  val: fmt(totDown), count: data.downgrades.filter(r => r.cliente).length, color: AMBER  },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-3 bg-white border border-gray-200 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: s.color }}>{s.label}</p>
                <p className="text-base font-bold text-gray-800">{s.val}</p>
                <p className="text-[10px] text-gray-400">{s.count} clientes</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )

    /* ── PASO 1: Pendientes ───────────────────────────────────────── */
    if (step === 1) return (
      <div>
        <p className="text-xs text-gray-500 mb-3">
          Clientes pendientes de facturar · Total: <strong style={{ color: ORANGE }}>{fmt(totPend)}</strong>
        </p>
        <div className="space-y-2">
          {/* header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 px-1">
            {['Cliente', 'Monto', 'Meses activo', 'Última factura', ''].map(h => (
              <p key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</p>
            ))}
          </div>
          {data.pendientes.map((r, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
              <input value={r.cliente} onChange={e => setPend(i, 'cliente', e.target.value)}
                placeholder="Nombre del cliente" className={inputCls} />
              <input type="number" value={r.monto || ''} onChange={e => setPend(i, 'monto', parseFloat(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              <input type="number" value={r.mesesActivo || ''} onChange={e => setPend(i, 'mesesActivo', parseInt(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              <input value={r.ultimaFactura} onChange={e => setPend(i, 'ultimaFactura', e.target.value)}
                placeholder="dd/mm/aaaa" className={inputCls} />
              {data.pendientes.length > 1
                ? <button type="button" onClick={() => delPend(i)} className={delBtnCls}><Trash2 size={13} /></button>
                : <div className="w-6" />}
            </div>
          ))}
          <button type="button" onClick={addPend} className={addBtnCls}><Plus size={13} /> Agregar cliente</button>
        </div>
      </div>
    )

    /* ── PASO 2: Cancelados ───────────────────────────────────────── */
    if (step === 2) return (
      <div>
        <p className="text-xs text-gray-500 mb-3">
          Clientes cancelados · MRR perdido: <strong style={{ color: RED }}>{fmt(totCanc)}</strong>
        </p>
        <div className="space-y-2">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 px-1">
            {['Cliente', 'MRR', 'Meses activo', 'Acumulado histórico', ''].map(h => (
              <p key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</p>
            ))}
          </div>
          {data.cancelados.map((r, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
              <input value={r.cliente} onChange={e => setCanc(i, 'cliente', e.target.value)}
                placeholder="Nombre del cliente" className={inputCls} />
              <input type="number" value={r.mrr || ''} onChange={e => setCanc(i, 'mrr', parseFloat(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              <input type="number" value={r.mesesActivo || ''} onChange={e => setCanc(i, 'mesesActivo', parseInt(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              <input type="number" value={r.acumulado || ''} onChange={e => setCanc(i, 'acumulado', parseFloat(e.target.value) || 0)}
                placeholder="0" className={numCls} />
              {data.cancelados.length > 1
                ? <button type="button" onClick={() => delCanc(i)} className={delBtnCls}><Trash2 size={13} /></button>
                : <div className="w-6" />}
            </div>
          ))}
          <button type="button" onClick={addCanc} className={addBtnCls}><Plus size={13} /> Agregar cliente</button>
        </div>
      </div>
    )

    /* ── PASO 3: Downgrades ───────────────────────────────────────── */
    if (step === 3) return (
      <div>
        <p className="text-xs text-gray-500 mb-3">
          Clientes con reducción de plan · Ingreso perdido: <strong style={{ color: AMBER }}>{fmt(totDown)}</strong>
        </p>
        <div className="space-y-3">
          {data.downgrades.map((r, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 relative">
              {data.downgrades.length > 1 && (
                <button type="button" onClick={() => delDown(i)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-400"><Trash2 size={13} /></button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cliente</label>
                  <input value={r.cliente} onChange={e => setDown(i, 'cliente', e.target.value)}
                    placeholder="Nombre del cliente" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ingreso perdido</label>
                  <input type="number" value={r.perdida || ''} onChange={e => setDown(i, 'perdida', parseFloat(e.target.value) || 0)}
                    placeholder="0" className={numCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Detalle del downgrade</label>
                <textarea value={r.nota} onChange={e => setDown(i, 'nota', e.target.value)}
                  placeholder="Describe los cambios de plan, productos cancelados, etc."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 bg-white resize-y min-h-[60px]" />
              </div>
            </div>
          ))}
          <button type="button" onClick={addDown} className={addBtnCls}><Plus size={13} /> Agregar downgrade</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${INDIGO}15` }}>
            <Database size={16} style={{ color: INDIGO }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">Nuevo Análisis DATA</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Paso {step + 1} de {FORM_STEPS.length} — <span className="font-medium text-gray-700">{FORM_STEPS[step]}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-3 pb-1">
          <div className="flex gap-1.5">
            {FORM_STEPS.map((s, i) => (
              <button key={i} type="button" onClick={() => setStep(i)}
                className="flex-1 text-center transition-all"
                title={s}>
                <div className="h-1.5 rounded-full mb-1"
                  style={{ background: i <= step ? '#1B3FCC' : '#e5e7eb' }} />
                <span className="text-[9px] font-medium"
                  style={{ color: i === step ? '#1B3FCC' : '#9ca3af' }}>
                  {s}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button type="button" disabled={step === 0}
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={16} /> Anterior
          </button>

          {step < FORM_STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: '#1B3FCC' }}>
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleSave} disabled={!canSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: canSave ? '#22c55e' : '#9ca3af' }}>
              <Check size={16} /> Guardar Análisis
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   TABS CONFIG (dinámica según reporte seleccionado)
═══════════════════════════════════════════════════════════════════════ */
function buildTabs(r: ChurnReporte): { id: Tab; label: string; color: string }[] {
  const tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'resumen',    label: 'Resumen',                                              color: INDIGO },
  ]
  if (r.grc) {
    tabs.push({ id: 'grc', label: '📊 Comportamiento GRC',                            color: TEAL   })
  }
  tabs.push(
    { id: 'pendiente',    label: `🟠 Pendientes (${r.pendientesCuentasReal ?? r.pendientes.length})`, color: ORANGE },
  )
  if (r.cancelados.length > 0) {
    tabs.push({ id: 'cancelados', label: `🔴 Cancelados (${r.cancelados.length})`,    color: RED    })
  }
  tabs.push(
    { id: 'downgrades',  label: `🟡 Downgrades (${r.downgrades.length})`,             color: AMBER  },
  )
  if (r.suspendidos && r.suspendidos.length > 0) {
    tabs.push({ id: 'suspendidos', label: `🔵 Suspendidos (${r.suspendidosCuentasReal ?? r.suspendidos.length})`, color: BLUE })
  }
  if (r.desactivados && r.desactivados.length > 0) {
    tabs.push({ id: 'desactivados', label: `🟣 Desactivados (${r.desactivadosCuentasReal ?? r.desactivados.length})`, color: '#7C3AED' })
  }
  tabs.push({ id: 't1', label: 'Resumen T1 2026',                                     color: INDIGO })
  return tabs
}

/* ═══════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════════════ */
export default function ChurnPage() {
  const [userReportes, setUserReportes] = useState<ChurnReporte[]>([])
  const [selectedId,   setSelectedId]   = useState<string>('s1-julio-2026')
  const [tab,          setTab]          = useState<Tab>('resumen')
  const [showForm,     setShowForm]     = useState(false)
  const [delConfirm,   setDelConfirm]   = useState<string | null>(null)

  useEffect(() => { setUserReportes(loadReportes()) }, [])

  const BASE_IDS = ['abril-2026', 's4-mayo-2026', 's5-mayo-2026', 's1-junio-2026', 's2-junio-2026', 's3-junio-2026', 's4-junio-2026', 'cierre-junio-2026', 's1-julio-2026']
  const allReportes: ChurnReporte[] = [REPORTE_ABRIL_2026, REPORTE_S4_MAYO_2026, REPORTE_S5_MAYO_2026, REPORTE_S1_JUNIO_2026, REPORTE_S2_JUNIO_2026, REPORTE_S3_JUNIO_2026, REPORTE_S4_JUNIO_2026, REPORTE_CIERRE_JUNIO_2026, REPORTE_S1_JULIO_2026, ...userReportes]
  const reporte = allReportes.find(r => r.id === selectedId) ?? REPORTE_S1_JULIO_2026

  const { pendientes, cancelados, downgrades, suspendidos, grc } = reporte
  const totalPendiente  = reporte.pendientesTotalReal   ?? pendientes.reduce((s, c) => s + (Number(c.monto)   || 0), 0)
  const totalCancelados = cancelados.reduce((s, c) => s + (Number(c.mrr)     || 0), 0)
  const totalDowngrades = downgrades.reduce((s, c) => s + (Number(c.perdida) || 0), 0)
  const totalSuspendidos = reporte.suspendidosTotalReal ?? (suspendidos ?? []).reduce((s, c) => s + (Number(c.importe) || 0), 0)
  const TABS = buildTabs(reporte)

  const handleSave = (r: ChurnReporte) => {
    const id = userReportes.some(x => x.id === r.id) ? `${r.id}-${Date.now()}` : r.id
    const updated = [...userReportes, { ...r, id }]
    setUserReportes(updated)
    saveReportes(updated)
    setSelectedId(id)
    setTab('resumen')
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = userReportes.filter(r => r.id !== id)
    setUserReportes(updated)
    saveReportes(updated)
    if (selectedId === id) setSelectedId('s1-julio-2026')
    setDelConfirm(null)
  }

  /* Cambio de período → reset tab */
  const selectReporte = (id: string) => { setSelectedId(id); setTab('resumen') }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Churn"
        subtitle="Análisis de pérdida de clientes · DATA → Dirección de Satisfacción al Cliente"
      />

      {/* ── Botón Zoho GRC ──────────────────────────────────────────────── */}
      <div className="px-6 pt-4">
        <a
          href="https://marketingplus.zoho.com/reports/open-view/245443000007094051"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#0E2354', color: '#FFFFFF',
            padding: '14px 28px', borderRadius: 12,
            fontWeight: 800, fontSize: 16, letterSpacing: '0.04em',
            textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.12)',
            boxShadow: '0 4px 18px rgba(14,35,84,0.35)',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <BarChart3 size={20} style={{ opacity: 0.85 }} />
          GROSS REVENUE CHURN
        </a>
      </div>

      {/* ── Selector de períodos ─────────────────────────────────────── */}
      <div className="px-6 pt-4 pb-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <FileBarChart2 size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Análisis DATA</span>
            <span className="ml-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {allReportes.length}
            </span>
            <div className="ml-auto">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: '#1B3FCC' }}
              >
                <Plus size={13} /> Nuevo Análisis DATA
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-1 p-2">
            {allReportes.map(r => {
              const active   = selectedId === r.id
              const isBase    = BASE_IDS.includes(r.id)
              const totImpact = (r.pendientesTotalReal ?? r.pendientes.reduce((s, x) => s + (Number(x.monto) || 0), 0))
                              + r.cancelados.reduce((s, x) => s + (Number(x.mrr)   || 0), 0)
                              + r.downgrades.reduce((s, x) => s + (Number(x.perdida) || 0), 0)
              return (
                <div key={r.id} className="relative group flex-shrink-0">
                  <button
                    onClick={() => selectReporte(r.id)}
                    className="flex flex-col items-start px-4 py-2.5 rounded-lg transition-all min-w-[160px] max-w-[220px] text-left"
                    style={active
                      ? { background: '#1B3FCC10', border: '1px solid #1B3FCC40' }
                      : { border: '1px solid transparent' }
                    }
                  >
                    <p className="text-xs font-semibold text-gray-800 truncate w-full"
                      style={{ color: active ? '#1B3FCC' : undefined }}>
                      {r.periodo}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{r.fecha || '—'}</span>
                      <span className="text-[9px] font-bold text-red-500">
                        {fmt(totImpact)}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${ORANGE}18`, color: ORANGE }}>
                        {r.pendientes.length} pend.
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${RED}18`, color: RED }}>
                        {r.cancelados.length} canc.
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${AMBER}18`, color: AMBER }}>
                        {r.downgrades.length} dg.
                      </span>
                    </div>
                  </button>

                  {!isBase && (
                    <button
                      onClick={e => { e.stopPropagation(); setDelConfirm(r.id) }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-0.5 rounded"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={Clock}          label="Pendiente de Facturar"    value={fmt(totalPendiente)}
          sub={`${reporte.pendientesCuentasReal ?? pendientes.length} cuentas · ${reporte.periodo}`}  color={ORANGE} />
        {cancelados.length > 0
          ? <KpiCard icon={XCircle}    label="MRR Cancelado"            value={fmt(totalCancelados)}
              sub={`${cancelados.length} clientes · ${reporte.periodo}`} color={RED} />
          : <KpiCard icon={BarChart3}  label="Suspendidos / Inactivos"  value={fmt(totalSuspendidos)}
              sub={`${reporte.suspendidosCuentasReal ?? (suspendidos?.length ?? 0)} cuentas pausadas`} color={BLUE} />
        }
        <KpiCard icon={ArrowDownRight} label="Ingreso Perdido Downgrade" value={fmt(totalDowngrades)}
          sub={`${downgrades.length} clientes · ${reporte.periodo}`}  color={AMBER}  />
        {grc
          ? <KpiCard icon={TrendingDown} label={`GRC Acumulado ${grc.evolucion[grc.evolucion.length - 1]?.mes ?? 'GRC'}`} value={`${grc.acumulado}%`}
              sub={`${grc.evolucion[grc.evolucion.length - 1]?.mes ?? 'Mes'} actual: ${grc.evolucion[grc.evolucion.length - 1]?.pct ?? 0}%`} color={RED} />
          : <KpiCard icon={TrendingDown} label="Pérdida Total T1 2026"  value={fmt(TOTAL_T1)}
              sub="34.2% en 15 clientes clave"                            color={INDIGO} />
        }
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto shadow-sm">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={tab === t.id ? { background: t.color, color: '#fff' } : { color: '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

        {/* ── RESUMEN ──────────────────────────────────────────────── */}
        {tab === 'resumen' && (
          <>
            {/* Notas del período */}
            {reporte.notas && (
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm flex gap-3">
                <Database size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Análisis DATA · {reporte.periodo}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{reporte.notas}</p>
                </div>
              </div>
            )}

            {/* Semáforo general */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Semáforo de Churn — {reporte.periodo}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Análisis elaborado por el área de DATA</p>
                </div>
                <SemaforoLeyenda />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${ORANGE}50`, background: `${ORANGE}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: ORANGE }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ORANGE }}>Pendiente de Facturar</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalPendiente)}</p>
                  <p className="text-xs text-gray-500 mt-1">{pendientes.length} clientes en riesgo</p>
                  <p className="text-xs mt-3 text-gray-600">Deben facturarse esta semana para evitar churn. Acción inmediata requerida.</p>
                </div>
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${RED}50`, background: `${RED}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: RED }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: RED }}>Cancelados</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalCancelados)}</p>
                  <p className="text-xs text-gray-500 mt-1">{cancelados.length} clientes</p>
                  <p className="text-xs mt-3 text-gray-600">Cuentas que cancelaron. MRR perdido. Acumulado histórico relevante.</p>
                </div>
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${AMBER}50`, background: `${AMBER}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: AMBER }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: AMBER }}>Downgrades</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(totalDowngrades)}</p>
                  <p className="text-xs text-gray-500 mt-1">{downgrades.length} clientes con reducción de plan</p>
                  <p className="text-xs mt-3 text-gray-600">Ingreso mensual perdido por reducción de planes o cancelación parcial de productos.</p>
                </div>
              </div>
            </div>

            {/* Impacto total */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Impacto Total — {reporte.periodo}</h3>
              <div className="space-y-3">
                {(() => {
                  const total = totalPendiente + totalCancelados + totalDowngrades || 1
                  return [
                    { label: 'MRR en riesgo (pendiente de facturar)', monto: totalPendiente,  color: ORANGE },
                    { label: 'MRR cancelado definitivo',               monto: totalCancelados, color: RED    },
                    { label: 'Ingreso perdido por downgrades',          monto: totalDowngrades, color: AMBER  },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{r.label}</span>
                        <span className="font-semibold" style={{ color: r.color }}>{fmt(r.monto)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(r.monto / total) * 100}%`, background: r.color }} />
                      </div>
                    </div>
                  ))
                })()}
                <div className="pt-2 border-t border-gray-100 flex justify-between">
                  <span className="text-sm font-semibold text-gray-800">Total impacto</span>
                  <span className="text-sm font-bold text-gray-900">{fmt(totalPendiente + totalCancelados + totalDowngrades)}</span>
                </div>
              </div>
            </div>

            {/* Contexto T1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Contexto T1 2026</h3>
              <p className="text-xs text-gray-500 mb-4">El 34.2% de la pérdida trimestral se concentró en 15 clientes clave</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3" style={{ background: `${INDIGO}06`, borderColor: `${INDIGO}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pérdida Total T1</p>
                  <p className="text-xl font-bold mt-1" style={{ color: INDIGO }}>{fmt(TOTAL_T1)}</p>
                </div>
                <div className="rounded-lg border p-3" style={{ background: `${RED}06`, borderColor: `${RED}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">15 Clientes Relevantes</p>
                  <p className="text-xl font-bold mt-1" style={{ color: RED }}>{fmt(TOTAL_T1_REL)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">34.2% del total T1</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── PENDIENTES ───────────────────────────────────────────── */}
        {tab === 'pendiente' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${ORANGE}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Pendientes de Facturación — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Total en riesgo: <strong>{fmt(totalPendiente)}</strong></p>
              </div>
              <SemaforoDot tipo="pendiente" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Por Facturar</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meses Activo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Última Factura</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: ORANGE }}>{fmt(Number(c.monto))}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.mesesActivo >= 40 ? 'bg-green-100 text-green-700' :
                          c.mesesActivo >= 12 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{c.mesesActivo} meses</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{c.ultimaFactura}</td>
                      <td className="py-3 px-4 text-center"><SemaforoDot tipo="pendiente" /></td>
                    </tr>
                  ))}
                  <tr className="bg-orange-50/50 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: ORANGE }}>{fmt(totalPendiente)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CANCELADOS ───────────────────────────────────────────── */}
        {tab === 'cancelados' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${RED}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Cancelados — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">MRR perdido: <strong>{fmt(totalCancelados)}</strong></p>
              </div>
              <SemaforoDot tipo="cancelado" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">MRR Perdido</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meses Activo</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acumulado</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...cancelados].sort((a, b) => Number(b.mrr) - Number(a.mrr)).map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-red-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: RED }}>{fmt(Number(c.mrr))}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.mesesActivo >= 40 ? 'bg-green-100 text-green-700' :
                          c.mesesActivo >= 12 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{c.mesesActivo} meses</span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-500">{fmt(Number(c.acumulado))}</td>
                      <td className="py-3 px-4 text-center"><SemaforoDot tipo="cancelado" /></td>
                    </tr>
                  ))}
                  <tr className="bg-red-50/50 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: RED }}>{fmt(totalCancelados)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DOWNGRADES ───────────────────────────────────────────── */}
        {tab === 'downgrades' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${AMBER}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Downgrades — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Ingreso perdido: <strong>{fmt(totalDowngrades)}</strong></p>
              </div>
              <SemaforoDot tipo="downgrade" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ingreso Perdido</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {downgrades.map((d, i) => <DowngradeRow key={i} d={d} />)}
                  <tr className="bg-amber-50/50 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: AMBER }}>{fmt(totalDowngrades)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-100">
              Haz clic en cada fila para ver el detalle del downgrade.
            </p>
          </div>
        )}

        {/* ── ARTÍCULOS MÁS AFECTADOS EN DOWNGRADES ──────────────── */}
        {tab === 'downgrades' && reporte.downgradeArticulos && reporte.downgradeArticulos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
            <div className="px-5 py-4 border-b border-gray-100" style={{ background: `${AMBER}06` }}>
              <h3 className="font-semibold text-sm text-gray-900">Artículos más afectados en downgrades</h3>
              <p className="text-xs text-gray-500 mt-0.5">Frecuencia de baja por producto en este periodo</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Artículo / Producto</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Veces afectado</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clientes</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.downgradeArticulos.map((a, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{a.articulo}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          a.vecesAfectado >= 3 ? 'bg-red-100 text-red-700' :
                          a.vecesAfectado === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>{a.vecesAfectado}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">{a.clientes.join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── GRC SEMANAL ──────────────────────────────────────────── */}
        {tab === 'grc' && grc && (
          <>
            {/* Encabezado */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${TEAL}15` }}>
                  <BarChart3 size={16} style={{ color: TEAL }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Comportamiento Semanal en CHURN</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Gross Revenue Churn (GRC) · {reporte.periodo}</p>
                </div>
                <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: `${RED}10`, border: `1px solid ${RED}30` }}>
                  <span className="text-xs font-semibold text-gray-600">GRC Acumulado</span>
                  <span className="text-2xl font-black" style={{ color: RED }}>{grc.acumulado}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                ⚠️ {grc.notaClave}
              </p>
            </div>

            {/* Evolución GRC */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Análisis de Evolución GRC</h3>
              <div className="grid grid-cols-3 gap-4">
                {grc.evolucion.map((e, i) => {
                  const isCritical = e.pct >= 10
                  const color = e.pct >= 10 ? RED : e.pct >= 5 ? AMBER : GREEN
                  const pctMax = Math.max(...grc.evolucion.map(x => x.pct))
                  const barW = Math.round((e.pct / pctMax) * 100)
                  return (
                    <div key={i} className="rounded-xl border p-4"
                      style={{ background: `${color}08`, borderColor: `${color}30` }}>
                      <p className="text-xs font-semibold text-gray-500 mb-1">{e.mes}</p>
                      <p className="text-3xl font-black mb-3" style={{ color }}>{e.pct}%</p>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, background: color }} />
                      </div>
                      {isCritical && (
                        <p className="text-[10px] font-bold mt-2 uppercase tracking-wide" style={{ color: RED }}>
                          ⚠ Nivel crítico
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Nota especial FINSUS u otras */}
            {grc.notaEspecial && (
              <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm"
                style={{ background: `${GREEN}06` }}>
                <p className="text-sm text-gray-800 leading-relaxed">{grc.notaEspecial}</p>
              </div>
            )}

            {/* Resumen de impacto */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Resumen de Impacto — {reporte.periodo}</h3>
              <div className="space-y-3">
                {[
                  { label: 'Pendiente de facturar (31 cuentas)',     monto: totalPendiente,  color: ORANGE, sub: 'Riesgo inmediato de churn' },
                  { label: 'Downgrades detectados',                   monto: totalDowngrades, color: AMBER,  sub: `${downgrades.length} clientes con reducción de plan` },
                  { label: 'Suspendidos / Inactivos en retención',    monto: totalSuspendidos, color: BLUE,  sub: `${reporte.suspendidosCuentasReal ?? suspendidos?.length ?? 0} cuentas pausadas` },
                ].map(row => {
                  const total = totalPendiente + totalDowngrades + totalSuspendidos || 1
                  return (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{row.label}</span>
                        <div className="text-right">
                          <span className="font-bold" style={{ color: row.color }}>{fmt(row.monto)}</span>
                          <span className="text-gray-400 ml-2 text-[11px]">{row.sub}</span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(row.monto / total) * 100}%`, background: row.color }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-3 border-t border-gray-100 flex justify-between">
                  <span className="text-sm font-semibold text-gray-800">Exposición total identificada</span>
                  <span className="text-sm font-bold text-gray-900">{fmt(totalPendiente + totalDowngrades + totalSuspendidos)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SUSPENDIDOS / INACTIVOS ───────────────────────────────── */}
        {tab === 'suspendidos' && suspendidos && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${BLUE}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Suspendidos e Inactivos — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total en riesgo retenido: <strong>{fmt(totalSuspendidos)}</strong> ·{' '}
                  {reporte.suspendidosCuentasReal ?? suspendidos.length} cuentas pausadas o inactivas
                </p>
              </div>
              <SemaforoDot tipo="suspendido" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Importe BCY</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meses Activo</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {suspendidos.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: BLUE }}>{fmt(Number(c.importe))}</td>
                      <td className="py-3 px-4 text-right">
                        {c.mesesActivo > 0 ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.mesesActivo >= 60 ? 'bg-green-100 text-green-700' :
                            c.mesesActivo >= 24 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                          }`}>{c.mesesActivo} meses</span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                          style={c.estado === 'Suspendido'
                            ? { background: `${BLUE}15`, color: BLUE,   borderColor: `${BLUE}35` }
                            : { background: `${INDIGO}15`, color: INDIGO, borderColor: `${INDIGO}35` }
                          }>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: c.estado === 'Suspendido' ? BLUE : INDIGO }} />
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/50 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL RETENIDO</td>
                    <td className="py-3 px-4 text-right" style={{ color: BLUE }}>{fmt(totalSuspendidos)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-100">
              Clientes con posibilidad de reactivación. Representan ingreso recuperable con gestión proactiva.
            </p>
          </div>
        )}

        {/* ── DESACTIVADOS ─────────────────────────────────────────── */}
        {tab === 'desactivados' && reporte.desactivados && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: '#7C3AED08' }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Desactivados — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Impacto: <strong style={{ color: '#7C3AED' }}>{fmt(reporte.desactivadosTotalReal ?? reporte.desactivados.reduce((s, c) => s + (Number(c.importe) || 0), 0))}</strong> ·{' '}
                  {reporte.desactivadosCuentasReal ?? reporte.desactivados.length} cuentas con módulo o servicio desactivado
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                style={{ background: '#7C3AED15', color: '#7C3AED', borderColor: '#7C3AED35' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#7C3AED' }} />
                Desactivado
              </span>
            </div>
            {reporte.notaRemitente && (
              <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 text-xs text-purple-800 leading-relaxed">
                📋 <strong>Nota:</strong> {reporte.notaRemitente}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Importe BCY</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meses Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.desactivados.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: '#7C3AED' }}>{fmt(Number(c.importe))}</td>
                      <td className="py-3 px-4 text-right">
                        {c.mesesActivo > 0 ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.mesesActivo >= 60 ? 'bg-green-100 text-green-700' :
                            c.mesesActivo >= 24 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                          }`}>{c.mesesActivo} meses</span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold" style={{ background: '#7C3AED0A' }}>
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: '#7C3AED' }}>
                      {fmt(reporte.desactivadosTotalReal ?? reporte.desactivados.reduce((s, c) => s + (Number(c.importe) || 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-100">
              Clientes que eliminaron un servicio o módulo. El ingreso puede recuperarse con propuesta de valor específica.
            </p>
          </div>
        )}

        {/* ── T1 2026 (histórico fijo) ─────────────────────────────── */}
        {tab === 't1' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[140px] rounded-lg border p-3" style={{ background: `${INDIGO}06`, borderColor: `${INDIGO}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pérdida Total T1 2026</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: INDIGO }}>{fmt(TOTAL_T1)}</p>
                </div>
                <div className="flex-1 min-w-[140px] rounded-lg border p-3" style={{ background: `${RED}06`, borderColor: `${RED}25` }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Clientes Relevantes (15)</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: RED }}>{fmt(TOTAL_T1_REL)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">34.2% del total trimestral</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Los 15 clientes con mayor impacto concentran el 34.2% de toda la pérdida del trimestre.
                Distribución: enero (3 clientes GDA), febrero (4 clientes), marzo (8 clientes).
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100" style={{ background: `${INDIGO}08` }}>
                <h3 className="font-semibold text-sm text-gray-900">15 Clientes de Mayor Impacto — T1 2026</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ingreso Perdido</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...T1_CLIENTES].sort((a, b) => b.perdida - a.perdida).map((c, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 text-xs text-gray-400 font-medium">{i + 1}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                        <td className="py-3 px-4 text-right font-semibold"
                          style={{ color: c.tipo === 'Downgrade' ? AMBER : RED }}>{fmt(c.perdida)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.mes === 'Enero' ? 'bg-blue-100 text-blue-700' :
                            c.mes === 'Febrero' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>{c.mes}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <SemaforoDot tipo={c.tipo === 'Downgrade' ? 'downgrade' : 'cancelado'} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-indigo-50/50 font-bold">
                      <td className="py-3 px-4" /><td className="py-3 px-4 text-gray-900">TOTAL RELEVANTES</td>
                      <td className="py-3 px-4 text-right" style={{ color: INDIGO }}>{fmt(TOTAL_T1_REL)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Modal: formulario */}
      {showForm && <ChurnForm onClose={() => setShowForm(false)} onSave={handleSave} />}

      {/* Modal: confirmar eliminación */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-2">¿Eliminar análisis?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Se eliminará del almacenamiento local del navegador. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(delConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
