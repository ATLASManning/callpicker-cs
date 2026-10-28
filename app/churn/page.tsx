'use client'
import { useState, useEffect, useMemo } from 'react'
import PageHeader from '@/components/PageHeader'
import { REPORTE_S26_OCT_2026 } from './reporte-actual'
import ConciliacionChurn from '@/components/ConciliacionChurn'
import type {
  ChurnPendiente, ChurnCancelado, ChurnDowngrade, ChurnReporte,
} from './tipos'
import GrcAaaSection from '@/components/GrcAaaSection'
import CustomSelect from '@/components/CustomSelect'
import {
  TrendingDown, XCircle, ArrowDownRight,
  Clock, BarChart3, CalendarDays, ChevronDown, ChevronUp,
  Plus, Trash2, X, ChevronLeft, ChevronRight, Check, Database, FileBarChart2,
  RefreshCw,
} from 'lucide-react'
import { tonoSobreClaro } from '@/lib/contraste'

/* ═══════════════════════════════════════════════════════════════════════
   TIPOS
═══════════════════════════════════════════════════════════════════════ */
type SemaforoChurn = 'cancelado' | 'pendiente' | 'downgrade' | 'suspendido'
type Tab = 'resumen' | 'pendiente' | 'cancelados' | 'downgrades' | 'suspendidos' | 'desactivados' | 'grc' | 't1' | 'aaa' | 'conciliacion'


/* ─── Tipos GRC Detalle AAA ───────────────────────────────────────── */
type AAAClienteRow = {
  cid: string; nombre: string; clasificacion: string; segmento: string
  mrr: number; mrrInicio: number; acumulado: number; mesesActivo: number
  ultimaFactura: string; semaforo: string; movimiento: string
  diasSinFactura: number; totalFacturas: number
}
type AAAMes = {
  mes: string; clientes: AAAClienteRow[]
  count: number; totalMrr: number; totalAcumulado: number
}
type AAAData = {
  clasificacion: string
  meses: AAAMes[]
  totales: { clientesAAA: number; clientesEnMes: number; totalMrr: number; mesesConData: number }
  error?: string
  _debug?: {
    totalFactRows: number
    totalAAA: number
    clasificaciones: string[]
    semaforosEnAAA: string[]
    muestraFechasAAA: string[]
    hint: string
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   PALETA
═══════════════════════════════════════════════════════════════════════ */
const RED    = '#ef4444'
const ORANGE = '#f97316'
const AMBER  = '#f59e0b'
const BLUE   = '#1D6CAA'
const INDIGO = '#082742'
const GREEN  = '#22c55e'

/* ── EL MISMO COLOR, PERO PARA LEERLO ──────────────────────────────────────
 *
 * Los cinco de arriba son colores de SEÑAL: el punto del semáforo, la barra
 * de una gráfica, el borde de una tarjeta. Ahí el tono vivo es lo que
 * comunica y se queda como está.
 *
 * Como LETRA no sirven, y está medido en la pantalla el 15 oct 2026 — 80
 * textos del módulo por debajo del mínimo:
 *
 *     ámbar  #f59e0b sobre su tinte .... 1.80:1   «14 dg.»
 *     naranja #f97316 sobre su tinte ... 2.29:1   «0 pend.»
 *     rojo   #ef4444 sobre su tinte .... 2.99:1   «5 canc.»
 *
 * Estas variantes las oscurece `tonoSobreClaro` hasta que miden 4.5:1 contra
 * su propio tinte. El relleno y el punto conservan el color original, que es
 * donde el color tiene que verse. [[atlas-dashboard-contrast-architecture]]
 *
 * Regla para quien añada un color: si va en `color:` de un texto, usa la
 * variante `_TX`; si va en `background`, `borderColor` o `fill`, la de arriba. */
const RED_TX    = tonoSobreClaro(RED, 0.22)
const ORANGE_TX = tonoSobreClaro(ORANGE, 0.22)
const AMBER_TX  = tonoSobreClaro(AMBER, 0.22)
const GREEN_TX  = tonoSobreClaro(GREEN, 0.22)

const SEMAFORO_MAP: Record<SemaforoChurn, { color: string; label: string; dot: string }> = {
  cancelado:  { color: RED_TX,    label: 'Cancelado',          dot: '🔴' },
  pendiente:  { color: ORANGE_TX, label: 'Pendiente Facturar', dot: '🟠' },
  downgrade:  { color: AMBER_TX,  label: 'Downgrade',          dot: '🟡' },
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
  canceladosCasosReal: 26,
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
  canceladosCasosReal: 5,
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
  canceladosCasosReal: 6,
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

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 12 · JULIO 2026  (17 jul 2026)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S2_JULIO_2026: ChurnReporte = {
  id:      's2-julio-2026',
  periodo: 'Semana 12 · Jul 2026',
  fecha:   '17/07/2026',
  notas:   'Gross Revenue Churn · Semana 12. Al 17 de julio del 2026. Segundo corte de julio con consolidado de cuentas en corte, suspendidos, desactivados, cancelados y downgrades. Siguiente revisión: viernes 24 de julio.',
  notaRemitente: 'Daniel Martínez — Siguiente revisión: viernes 24 de julio.',

  grc: {
    evolucion: [
      { mes: 'Abril', pct: 1.8, anterior: 1.9 },
      { mes: 'Mayo',  pct: 1.6, anterior: 1.8 },
      { mes: 'Junio', pct: 3.4, anterior: 3.7 },
    ],
    acumulado: 13.3,
    anterior:  13.6,
    notaClave: 'Churn Q2 cierre final definitivo: Abril 1.8% · Mayo 1.6% · Junio 3.4% (corr. 3.7%). Acumulado 2026: 13.3% (corr. 13.6%).',
    notaEspecial: 'Seguimiento pendientes Jun S9 y S10 — Suspendido $21,170 · Desactivado $979 · Cancelado $689. Clientes en amarillo en el documento de casos ya facturaron en julio y se contabilizan como reactivaciones. Consulta de churn y downgrade por artículo disponible en el dashboard.',
  },

  /* En Corte Sem 2 Julio — 3 cuentas · $2,937.31 */
  pendientesTotalReal:   2937.31,
  pendientesCuentasReal: 3,
  pendientes: [
    { cliente: 'Servitaxi Rincón de Palma Real', monto: 979.31, mesesActivo: 2,   ultimaFactura: '05/06/2026' },
    { cliente: 'Urbanelle BH Inmobiliaria',      monto: 979,    mesesActivo: 5,   ultimaFactura: '03/06/2026' },
    { cliente: 'Montebello Towers',              monto: 979,    mesesActivo: 116, ultimaFactura: '01/06/2026' },
  ],

  /* Cancelados Sem 2 Julio — 6 cuentas · $5,868 */
  cancelados: [
    { cliente: '🔝 Yapp',                   mrr: 1996, mesesActivo: 12, acumulado: 0 },
    { cliente: 'Houses Land',               mrr: 1959, mesesActivo: 14, acumulado: 0 },
    { cliente: 'Grupo Taneg',               mrr: 786,  mesesActivo: 20, acumulado: 0 },
    { cliente: 'Grupo CBCA',               mrr: 489,  mesesActivo: 40, acumulado: 0 },
    { cliente: 'GROW Real Estate',          mrr: 489,  mesesActivo: 29, acumulado: 0 },
    { cliente: 'Dinosaurio Hosting Mexico', mrr: 149,  mesesActivo: 52, acumulado: 0 },
  ],

  /* Downgrades Sem 2 Julio — 6 clientes · $9,911.81 */
  downgradeTotalReal: 9911.81,
  downgrades: [
    { cliente: '🔝 Latinx Revops',   perdida: 5129.01, nota: '74% de baja. Redujo Extensión VyC y DiD Nacional. Eliminó DiD Internacional. Adquirió Agente CP Chat ($1,953).' },
    { cliente: 'DOSATEC',            perdida: 1581,    nota: '52% de baja. Redujo Agente CP Chat y eliminó Extensión VyC. Adquirió Paquete Min CE ($489).' },
    { cliente: 'labsus lab',         perdida: 1053,    nota: '18% de baja. Redujo Paquete Min CE de $2,500 → $1,447.' },
    { cliente: 'DRENVIO',            perdida: 729,     nota: '37% de baja. Redujo Paquete Min VyC de $1,959 → $1,230.' },
    { cliente: 'ROAL TRANSPORTES',   perdida: 730.80,  nota: '88% de baja. Eliminó Paquete Min CE y Paquete 800. Redujo DiD Nacional de $282 → $99.' },
    { cliente: 'SAMALAB',            perdida: 689,     nota: '25% de baja. Redujo Extensión VyC de $2,756 → $2,067.' },
  ],

  downgradeArticulos: [
    { articulo: 'Extensión VyC', vecesAfectado: 3, clientes: ['Latinx Revops', 'DOSATEC', 'SAMALAB'] },
    { articulo: 'DiD Nacional',  vecesAfectado: 2, clientes: ['Latinx Revops', 'ROAL TRANSPORTES'] },
  ],

  /* Suspendidos Sem 2 Julio — 5 cuentas · $16,302 */
  suspendidosTotalReal:   16302,
  suspendidosCuentasReal: 5,
  suspendidos: [
    { cliente: '🔝 Travelling',            importe: 12922, mesesActivo: 8,  estado: 'Suspendido' },
    { cliente: 'REMAX DREAMS',             importe: 2157,  mesesActivo: 67, estado: 'Suspendido' },
    { cliente: 'EMPRESAS BASGON Y BASANT', importe: 885,   mesesActivo: 80, estado: 'Suspendido' },
    { cliente: 'Terrabionic',              importe: 169,   mesesActivo: 49, estado: 'Suspendido' },
    { cliente: 'Electraton',               importe: 169,   mesesActivo: 47, estado: 'Suspendido' },
  ],

  /* Desactivados Sem 2 Julio — 18 cuentas · $18,214.31 (top 5) */
  desactivadosTotalReal:   18214.31,
  desactivadosCuentasReal: 18,
  desactivados: [
    { cliente: '🔝 AJ PENNY BLINDS',                importe: 6194,    mesesActivo: 89 },
    { cliente: 'O.F. FLETES Y LOGISTICA DE MEXICO', importe: 3189,    mesesActivo: 8  },
    { cliente: 'Superpass',                         importe: 1959,    mesesActivo: 25 },
    { cliente: 'Casablanca Juriquilla',             importe: 849,     mesesActivo: 87 },
    { cliente: 'Protección Juridica',               importe: 799,     mesesActivo: 51 },
    { cliente: '+ 13 cuentas adicionales',          importe: 5224.31, mesesActivo: 0  },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 13 · JULIO 2026
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S3_JULIO_2026: ChurnReporte = {
  id:      's3-julio-2026',
  periodo: 'Semana 13 · Jul 2026',
  fecha:   '23/07/2026',
  notas:   'Gross Revenue Churn · Semana 13. Al 23 de julio del 2026. Tercer corte de julio con seguimiento de cuentas pendientes, nuevos casos de la semana, downgrades y análisis especial de patrones de cancelación y cuentas de largo plazo. Siguiente revisión: viernes 31 de julio.',
  notaRemitente: 'Daniel Martínez — Siguiente revisión: viernes 31 de julio.',

  grc: {
    evolucion: [
      { mes: 'Abril', pct: 1.7, anterior: 1.8 },
      { mes: 'Mayo',  pct: 1.5, anterior: 1.6 },
      { mes: 'Junio', pct: 3.4 },
    ],
    acumulado: 13.1,
    anterior:  13.3,
    notaClave: 'Q2 cierre final actualizado: Abril 1.7% (corr. 1.8%) · Mayo 1.5% (corr. 1.6%) · Junio 3.4%. Acumulado 2026: 13.1% (corr. 13.3%). Julio en curso: 17.4% — mes corriendo, solo monitoreo, no definitivo.',
    notaEspecial: 'Seguimiento Sem 1: AdminPlus suspendido · syndeX ✓ activo (facturó jul). Seguimiento Sem 2: 3 cuentas sin resolver ($2,937.31). Análisis especial: 21 cancelados con ≤2 meses activo ($33,115 acumulado) · 23 cancelados con >60 meses activo ($2,485,288 MRR acumulado). Caso destacado JAD Suministros: 75 meses activo · $552,266 acumulado · 2 downgrades consecutivos previos a su cancelación.',
  },

  /* En Corte Sem 3 — ~42 cuentas · $52,821.67 · top 10 */
  pendientesTotalReal:   52821.67,
  pendientesCuentasReal: 42,
  pendientes: [
    { cliente: '🔝 Biolaboratorio Sadat',                   monto: 7184,    mesesActivo: 53,  ultimaFactura: '20/06/2026' },
    { cliente: 'Bufette del Migrante ATC',                  monto: 6882.40, mesesActivo: 59,  ultimaFactura: '19/06/2026' },
    { cliente: 'FERS MED',                                  monto: 3912,    mesesActivo: 4,   ultimaFactura: '19/06/2026' },
    { cliente: 'CENTRO DE DIAGNOSTICO NEUROFISIOLOGICO',    monto: 3486,    mesesActivo: 60,  ultimaFactura: '19/06/2026' },
    { cliente: 'enMazatlan',                                monto: 3480,    mesesActivo: 70,  ultimaFactura: '21/06/2026' },
    { cliente: 'Médica El Marqués',                         monto: 2485,    mesesActivo: 31,  ultimaFactura: '20/06/2026' },
    { cliente: 'Meds for Pets',                             monto: 1938,    mesesActivo: 80,  ultimaFactura: '15/06/2026' },
    { cliente: 'Garantía de renta',                         monto: 1288,    mesesActivo: 55,  ultimaFactura: '18/06/2026' },
    { cliente: 'K13 Inmobiliaria',                          monto: 1276,    mesesActivo: 132, ultimaFactura: '19/06/2026' },
    { cliente: 'MultiEmpaques del Norte',                   monto: 1119,    mesesActivo: 69,  ultimaFactura: '21/06/2026' },
    { cliente: '+ ~32 cuentas adicionales',                 monto: 20771.27,mesesActivo: 0,   ultimaFactura: 'Ver dashboard' },
  ],

  /* Cancelados Sem 3 (6 cuentas · $26,823.28) + Suspendidos→Cancelados Jun S9/S10 (8 cuentas) */
  cancelados: [
    { cliente: '🔝 Bliss crédito libre',              mrr: 16799.97, mesesActivo: 24,  acumulado: 242183.09 },
    { cliente: 'GRUPO GEVHE',                         mrr: 3817,     mesesActivo: 1,   acumulado: 0         },
    { cliente: 'INVEXIO',                             mrr: 2779,     mesesActivo: 24,  acumulado: 0         },
    { cliente: 'Alamo Seguros',                       mrr: 1959,     mesesActivo: 0,   acumulado: 0         },
    { cliente: 'Servitaxi Rincón de Palma Real',      mrr: 979.31,   mesesActivo: 2,   acumulado: 0         },
    { cliente: 'Grupo Sirob',                         mrr: 489,      mesesActivo: 0,   acumulado: 0         },
    { cliente: '— Suspendido→Cancelado · Grúas Gutigon',         mrr: 2094, mesesActivo: 23, acumulado: 0 },
    { cliente: '— Suspendido→Cancelado · Xelbor Transfer',       mrr: 1959, mesesActivo: 25, acumulado: 0 },
    { cliente: '— Suspendido→Cancelado · CORRUBOX MEXICO',       mrr: 979,  mesesActivo: 10, acumulado: 0 },
    { cliente: '— Suspendido→Cancelado · Globovista',            mrr: 689,  mesesActivo: 13, acumulado: 0 },
    { cliente: '— Suspendido→Cancelado · DISTRIB. MEDICA ONCOPHARMAX', mrr: 489, mesesActivo: 28, acumulado: 0 },
    { cliente: '— Suspendido→Cancelado · Taxis Unidos Camargo',  mrr: 489,  mesesActivo: 1,  acumulado: 0 },
    { cliente: '— Suspendido→Cancelado · WALT AND MACON',        mrr: 489,  mesesActivo: 0,  acumulado: 0 },
    { cliente: '— Suspendido→Cancelado · Roal Travel',           mrr: 195,  mesesActivo: 5,  acumulado: 0 },
  ],

  /* Downgrades Sem 3 — 6 clientes · $4,551 */
  downgradeTotalReal: 4551,
  downgrades: [
    { cliente: '🔝 DOSATEC',          perdida: 1581,  nota: '39% de baja. Redujo Agente CP Chat y eliminó Extensión VyC. Adquirió Paquete Min CE ($489).' },
    { cliente: 'labsus lab',          perdida: 1053,  nota: '18% de baja. Paquete Min CE de $2,500 → $1,447.' },
    { cliente: 'ValueSearch',         perdida: 450,   nota: '21% de baja. DiD Internacional de $700 → $250.' },
    { cliente: 'Corporativo Vegamas', perdida: 489,   nota: '83% de baja. Eliminó Paquete Min CE ($489).' },
    { cliente: 'THL INMOBILIARIA',    perdida: 489,   nota: '49% de baja. Paquete Min VyC de $979 → $490.' },
    { cliente: 'Servisco',            perdida: 489,   nota: '41% de baja. Paquete Min VyC de $979 → $490.' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Min VyC', vecesAfectado: 2, clientes: ['THL INMOBILIARIA', 'Servisco'] },
    { articulo: 'Paquete Min CE',  vecesAfectado: 2, clientes: ['Corporativo Vegamas', 'DOSATEC'] },
  ],

  /* Suspendidos Sem 3 — 5 cuentas · $4,991 */
  suspendidosTotalReal:   4991,
  suspendidosCuentasReal: 5,
  suspendidos: [
    { cliente: '🔝 ELAM FAW',              importe: 1797, mesesActivo: 29,  estado: 'Suspendido' },
    { cliente: 'Montebello Towers',        importe: 979,  mesesActivo: 116, estado: 'Suspendido' },
    { cliente: 'Urbanelle BH Inmobiliaria',importe: 979,  mesesActivo: 5,   estado: 'Suspendido' },
    { cliente: 'Sheep',                    importe: 747,  mesesActivo: 111, estado: 'Suspendido' },
    { cliente: 'MARQUEZ VARGAS ABOGADOS',  importe: 489,  mesesActivo: 67,  estado: 'Suspendido' },
  ],

  /* Desactivados Sem 3 (8 cuentas · $10,034 top 5) + Activos→Desactivados (8 cuentas · $3,448) */
  desactivadosTotalReal:   13482,
  desactivadosCuentasReal: 16,
  desactivados: [
    { cliente: '🔝 AdminPlus',               importe: 2718, mesesActivo: 71  },
    { cliente: 'Jarvis Holding',             importe: 2500, mesesActivo: 4   },
    { cliente: 'C21 PREMIUM LIFE',           importe: 1344, mesesActivo: 16  },
    { cliente: 'JOINLIST',                   importe: 1187, mesesActivo: 84  },
    { cliente: 'Traveltrustee',              importe: 889,  mesesActivo: 66  },
    { cliente: '+ 3 desactivados adicionales',importe: 1396, mesesActivo: 0  },
    { cliente: '— Act→Desact · NOVAGAS',     importe: 979,  mesesActivo: 28  },
    { cliente: '— Act→Desact · Tropicalia',  importe: 489,  mesesActivo: 52  },
    { cliente: '— Act→Desact · Anhela Fertilidad', importe: 489, mesesActivo: 17 },
    { cliente: '— Act→Desact · KR33 SOLUTIONS',    importe: 489, mesesActivo: 36 },
    { cliente: '— Act→Desact · RED MAGISTERIAL',   importe: 489, mesesActivo: 0  },
    { cliente: '— Act→Desact · Molina Market',     importe: 195, mesesActivo: 0  },
    { cliente: '— Act→Desact · Ethics Real Estate',importe: 169, mesesActivo: 0  },
    { cliente: '— Act→Desact · Comercializadora Hook', importe: 149, mesesActivo: 0 },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 14 · JULIO 2026  (30 jul 2026)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S4_JULIO_2026: ChurnReporte = {
  id:      's4-julio-2026',
  periodo: 'Semana 14 · Jul 2026',
  fecha:   '30/07/2026',
  notas:   'Gross Revenue Churn · Semana 14. Al 30 de julio del 2026. Cuarto y último corte de julio. Q2: Mayo 1.5% · Junio 3.4% · Julio 4.8% (en curso, NO DEFINITIVO). Acumulado 2026: 17.9%. Próxima revisión: viernes 7 de agosto.',
  notaRemitente: 'Daniel Martínez — Próxima revisión: viernes 7 de agosto.',

  grc: {
    evolucion: [
      { mes: 'Abril',           pct: 1.7, anterior: 1.8 },
      { mes: 'Mayo',            pct: 1.5, anterior: 1.6 },
      { mes: 'Junio',           pct: 3.4 },
      { mes: 'Julio (en curso)',pct: 4.8 },
    ],
    acumulado: 17.9,
    anterior:  13.1,
    notaClave: 'Q2 final: Abril 1.7% · Mayo 1.5% · Junio 3.4%. Julio en curso: 4.8% — NO DEFINITIVO. Acumulado 2026: 17.9% (ant. 13.1%).',
    notaEspecial: '🚨 Alerta "Churn Silencioso": 3 de 5 clientes con downgrade presentaron reducciones >40% — CiberZion −86%, Soluciones Textiles −68%, H2 business club −51%. Reducciones de esta magnitud representan riesgo de cancelación total en los próximos 30–60 días. Seguimiento acumulado semanas: S1 AdminPlus desactivado · S2 Servitaxi cancelado / Urbanelle cancelado / Montebello suspendido · S3 8 desactivados $10,034.',
  },

  /* En Corte Sem 4 — top 5 de ~20 cuentas · total $69,581 */
  pendientesTotalReal:   69581,
  pendientesCuentasReal: 20,
  pendientes: [
    { cliente: '🔝 Gas Economico Metropolitano', monto: 18659, mesesActivo: 0, ultimaFactura: '' },
    { cliente: 'GRUPO RIZO',                     monto: 9211,  mesesActivo: 0, ultimaFactura: '' },
    { cliente: 'Grupo Suma',                     monto: 7190,  mesesActivo: 0, ultimaFactura: '' },
    { cliente: 'Mexico Asistencia',              monto: 3380,  mesesActivo: 0, ultimaFactura: '' },
    { cliente: 'Nano Care',                      monto: 2357,  mesesActivo: 0, ultimaFactura: '' },
    { cliente: '+ ~15 cuentas adicionales',      monto: 28784, mesesActivo: 0, ultimaFactura: 'Ver lista completa en el dashboard' },
  ],

  /* Cancelados Sem 4 — 8 cuentas · $8,378 */
  cancelados: [
    { cliente: '🔝 HostPal',     mrr: 2695, mesesActivo: 0, acumulado: 0 },
    { cliente: 'Reactor',        mrr: 1659, mesesActivo: 0, acumulado: 0 },
    { cliente: 'Pasteur Soft',   mrr: 1177, mesesActivo: 0, acumulado: 0 },
    { cliente: 'PAN AMERICAN',   mrr: 944,  mesesActivo: 0, acumulado: 0 },
    { cliente: 'QuikPeso',       mrr: 730,  mesesActivo: 0, acumulado: 0 },
    { cliente: 'Torre Himalaya', mrr: 489,  mesesActivo: 0, acumulado: 0 },
    { cliente: 'ENVIRONET',      mrr: 489,  mesesActivo: 0, acumulado: 0 },
    { cliente: 'Creativa',       mrr: 195,  mesesActivo: 0, acumulado: 0 },
  ],

  /* Downgrades Sem 4 — 5 clientes · $5,308.87 */
  downgradeTotalReal: 5308.87,
  downgrades: [
    { cliente: '🚨 H2 business club',    perdida: 2277,   nota: '51% de baja. Reducción crítica. Riesgo alto de cancelación total en los próximos 30–60 días.' },
    { cliente: '🚨 Soluciones Textiles', perdida: 1350,   nota: '68% de baja. Reducción crítica. Riesgo de churn silencioso inminente.' },
    { cliente: 'Servisco',              perdida: 489,    nota: '41% de baja. Reducción en artículos contratados.' },
    { cliente: '🚨 CiberZion',           perdida: 421.87, nota: '86% de baja — mayor porcentaje del período. Riesgo de cancelación total en siguiente ciclo.' },
    { cliente: 'Dicap Desarrollos',     perdida: 381,    nota: '12% de baja. Reducción menor en artículos contratados.' },
  ],

  downgradeArticulos: [
    { articulo: 'Reducción >40% (churn silencioso)', vecesAfectado: 3, clientes: ['CiberZion −86%', 'Soluciones Textiles −68%', 'H2 business club −51%'] },
    { articulo: 'Reducción ≤41%',                    vecesAfectado: 2, clientes: ['Servisco −41%', 'Dicap Desarrollos −12%'] },
  ],

  /* Suspendidos Sem 4 — 4 cuentas · $4,685 */
  suspendidosTotalReal:   4685,
  suspendidosCuentasReal: 4,
  suspendidos: [
    { cliente: '🔝 Pizzall',    importe: 1870, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'WTC Querétaro', importe: 1469, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Flexzone',      importe: 979,  mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Lunah',         importe: 367,  mesesActivo: 0, estado: 'Suspendido' },
  ],

  /* Desactivados Sem 4 — 17 cuentas · $14,415.26 · top 5 */
  desactivadosTotalReal:   14415.26,
  desactivadosCuentasReal: 17,
  desactivados: [
    { cliente: '🔝 Depósito Dental Reisix', importe: 2878,    mesesActivo: 0 },
    { cliente: 'Quiero Flores',             importe: 1869,    mesesActivo: 0 },
    { cliente: 'Uno Suministros',           importe: 1759,    mesesActivo: 0 },
    { cliente: 'Clear Intelligence',        importe: 1177.26, mesesActivo: 0 },
    { cliente: 'MRT',                       importe: 979,     mesesActivo: 0 },
    { cliente: '+ 12 cuentas adicionales',  importe: 5753,    mesesActivo: 0 },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 2 · AGOSTO 2026  (14 ago 2026)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S2_AGOSTO_2026: ChurnReporte = {
  id:      's2-agosto-2026',
  periodo: 'Semana 2 · Ago 2026',
  fecha:   '14/08/2026',
  notas:   'Gross Revenue Churn · Semana 2. Al 14 de agosto del 2026. Segundo corte de agosto incluyendo cierre definitivo de julio y alerta crítica sobre patrón de conversión suspendidos→cancelados. Siguiente revisión: viernes 21 de agosto.',
  notaRemitente: 'Daniel Martínez — Siguiente revisión: viernes 21 de agosto.',

  grc: {
    evolucion: [
      { mes: 'Mayo',              pct: 1.5             },
      { mes: 'Junio',             pct: 3.4             },
      { mes: 'Julio',             pct: 2.3, anterior: 4.8 },
      { mes: 'Agosto (en curso)', pct: 40.7            },
    ],
    acumulado: 15.3,
    anterior:  17.9,
    notaClave: 'GRC Julio cerró en 2.3% (corr. 4.8%). Agosto en curso: 40.7% — NO DEFINITIVO. Acumulado hasta julio 2026: 15.3% (corr. 17.9%).',
    notaEspecial: '🚨 ALERTA PATRÓN CONVERSIÓN: En julio, el 83% de Suspendidos cancelaron (15/18 cuentas = $12,550.31). El 63% de Desactivados pasaron a Suspendidos y el 100% de esos terminó en Cancelados. Proyección agosto sem 2: $9,128.34 desde suspendidos + $17,715.29 desde desactivados = $26,843.63 en riesgo total. ¿Existe protocolo de prevención para clientes suspendidos y desactivados? · Cierre Julio: $59,737.59 · 41 cancelaciones · $28,142.94 downgrades · 13 clientes. Nota GTC: 4 downgrades consecutivos mar–ago en "Paquete Ops Automatizaciones" — pérdida acumulada $38,414.31 en todas sus subcuentas.',
  },

  /* En Corte Sem 2 Agosto — top 5 de 29 cuentas · $37,968.50
     Sem 1 previa: $27,349.50 · 26 cuentas — incluida en fila adicional */
  pendientesTotalReal:   37968.50,
  pendientesCuentasReal: 29,
  pendientes: [
    { cliente: '🔝 Linden',                    monto: 6522,     mesesActivo: 72, ultimaFactura: '10/07/2026' },
    { cliente: 'TRANSPORTES FEMA',             monto: 5349,     mesesActivo: 16, ultimaFactura: '13/07/2026' },
    { cliente: 'AS CONSULTING',                monto: 4745,     mesesActivo: 0,  ultimaFactura: '12/07/2026' },
    { cliente: 'Ikan experience',              monto: 3049,     mesesActivo: 45, ultimaFactura: '09/07/2026' },
    { cliente: 'Ashkenazi',                    monto: 1945,     mesesActivo: 18, ultimaFactura: '08/07/2026' },
    { cliente: '+ 24 cuentas adicionales sem 2 · Sem 1 ($27,349.50 · 26 cuentas): Vecinos Comprometidos $3,948 (29m) · PROSESO CONSULTORES $2,729 (74m) · transportes BPG $2,447 (39m) · Su Perro Limpio $2,387 (58m) · FLETES ESPECIALIZADOS TOFRA $2,387 (9m) + 21 más', monto: 16358.50, mesesActivo: 0, ultimaFactura: 'Ver documento' },
  ],

  /* Cancelados Sem 2 Agosto — 4 cuentas · $3,153 */
  cancelados: [
    { cliente: '🔝 Torre 2 - Via Montejo',      mrr: 1890, mesesActivo: 29,  acumulado: 52920 },
    { cliente: 'COESPRO',                       mrr: 579,  mesesActivo: 55,  acumulado: 25702 },
    { cliente: 'Quality Lema',                  mrr: 489,  mesesActivo: 158, acumulado: 97821 },
    { cliente: 'ESG Servicios Migratorios',     mrr: 195,  mesesActivo: 11,  acumulado: 2340  },
  ],

  /* Downgrades Sem 2 Agosto — 6 clientes · desglosado $29,242.58 · real $35,330.06 */
  downgradeTotalReal: 35330.06,
  downgrades: [
    { cliente: '⚠️ Universidad UniverMilenium', perdida: 17914,   nota: '49% de baja. Extensión Callcenter de $35,828 → $17,914. Mayor downgrade absoluto de la semana.' },
    { cliente: '🚨 INBROTEK SERVICIOS',          perdida: 6915.96, nota: '71% de baja. Eliminó: Canales concurrentes, DiD Nacional, Extensión VyC, Ofuscador y Paquete Min VyC. Mayor % de reducción de la semana.' },
    { cliente: 'GTC - CENTRO MAX',              perdida: 1277.71, nota: '3% de baja. Paquete Ops Automatizaciones de $8,415.06 → $7,076.84.' },
    { cliente: 'GTC - NAVA',                    perdida: 1277.71, nota: '3% de baja. Paquete Ops Automatizaciones de $8,415.06 → $7,076.84. Upsell en DiD Nacional.' },
    { cliente: 'GTC - FORUM',                   perdida: 929.02,  nota: '3% de baja. Paquete Ops Automatizaciones de $8,415.06 → $7,076.84.' },
    { cliente: 'GTC - BMW',                     perdida: 928.18,  nota: '3% de baja. Paquete Ops Automatizaciones de $6,113.03 → $5,140.90.' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Ops Automatizaciones', vecesAfectado: 4, clientes: ['GTC-CENTRO MAX', 'GTC-NAVA', 'GTC-FORUM', 'GTC-BMW'] },
    { articulo: 'Extensión Callcenter',          vecesAfectado: 1, clientes: ['Universidad UniverMilenium'] },
    { articulo: 'Paquete Min VyC',              vecesAfectado: 1, clientes: ['INBROTEK SERVICIOS'] },
    { articulo: 'DiD Nacional',                 vecesAfectado: 1, clientes: ['INBROTEK SERVICIOS'] },
    { articulo: 'Extensión VyC',                vecesAfectado: 1, clientes: ['INBROTEK SERVICIOS'] },
    { articulo: 'Ofuscador',                    vecesAfectado: 1, clientes: ['INBROTEK SERVICIOS'] },
    { articulo: 'Canales concurrentes',          vecesAfectado: 1, clientes: ['INBROTEK SERVICIOS'] },
  ],

  /* Suspendidos Sem 2 Agosto — 9 cuentas · $10,998
     Riesgo de cancelación: 83% → $9,128.34 proyectado */
  suspendidosTotalReal:   10998,
  suspendidosCuentasReal: 9,
  suspendidos: [
    { cliente: '🔝 Centro Mexicano de Psicología Integrativa CEMEPI', importe: 2921, mesesActivo: 77, estado: 'Suspendido' },
    { cliente: 'Custodias RJ',                                        importe: 2920, mesesActivo: 5,  estado: 'Suspendido' },
    { cliente: 'AVILA HERRERA GRUPO INMOBILIARIO',                    importe: 1959, mesesActivo: 33, estado: 'Suspendido' },
    { cliente: 'Ferjer soluciones',                                   importe: 989,  mesesActivo: 3,  estado: 'Suspendido' },
    { cliente: 'eBoss',                                               importe: 588,  mesesActivo: 65, estado: 'Suspendido' },
    { cliente: '+ 4 cuentas · FERCO $578 · APEX Capital México $489 · A reservar $359 · Gestory $195', importe: 1621, mesesActivo: 0, estado: 'Suspendido' },
  ],

  /* Desactivados Sem 2 Agosto — 19 cuentas · $28,119.50
     Riesgo cadena Desactivado→Suspendido→Cancelado: $17,715.29 proyectado */
  desactivadosTotalReal:   28119.50,
  desactivadosCuentasReal: 19,
  desactivados: [
    { cliente: '🔝 SOBERANI',            importe: 5235,    mesesActivo: 6  },
    { cliente: 'SYCA',                   importe: 4152,    mesesActivo: 72 },
    { cliente: 'multileads 2',           importe: 4110,    mesesActivo: 57 },
    { cliente: 'Skyhous',               importe: 2497,    mesesActivo: 64 },
    { cliente: 'GS Trackme',            importe: 2488,    mesesActivo: 68 },
    { cliente: '+ 14 cuentas adicionales', importe: 9637.50, mesesActivo: 0 },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 3 · AGOSTO 2026  (21 ago 2026)
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S3_AGOSTO_2026: ChurnReporte = {
  id:      's3-agosto-2026',
  periodo: 'Semana 3 · Ago 2026',
  fecha:   '21/08/2026',
  notas:   'Gross Revenue Churn · Semana 3. Al 21 de agosto del 2026. Tercer corte de agosto con seguimiento acumulado de las semanas 1 y 2 en Activo (Pendiente), proyección de cierre de agosto según el patrón de conversión observado en julio, y confirmación de Daniel Martínez de que las cuentas AAA de mayor tamaño del corte ya pagaron. Siguiente revisión: viernes 28 de agosto.',
  notaRemitente: 'Daniel Martínez — Siguiente revisión: viernes 28 de agosto.',

  grc: {
    evolucion: [
      { mes: 'Junio',             pct: 3.4  },
      { mes: 'Julio',             pct: 2.2,  anterior: 2.3  },
      { mes: 'Agosto (en curso)', pct: 21.6, anterior: 40.7 },
    ],
    acumulado: 36.9,
    anterior:  15.3,
    notaClave: 'GRC Julio corregido a 2.2% (ant. 2.3%). Agosto en curso: 21.6% (ant. 40.7%) — corrección a la baja según pagos confirmados. Churn acumulado hasta agosto 2026: 36.9% — MES CORRIENDO, NO DEFINITIVO (ant. 15.3%).',
    notaEspecial: '🚨 ALERTA PATRÓN DE CONVERSIÓN: con la tasa observada en julio (83% de Suspendidos termina en Cancelado; 63% de Desactivados pasa a Suspendido, de los cuales el 100% termina cancelando), las 13 cuentas suspendidas de esta semana proyectan ≈11 cancelaciones y las 25 desactivadas ≈16 — ≈27 cuentas adicionales, ≈$20,100 MXN en riesgo directo sumado a los $8,514 ya cancelados: cerca del 76% del valor de la cartera semanal ($37,505 MXN) quedaría cancelado si se repite el patrón de julio. La cadena Desactivado → Suspendido → Cancelado ya está ocurriendo esta semana, aunque en menor escala que en julio. Nota de Daniel Martínez: hay algunos casos de cuentas AAA en el corte, pero ya validó que las cuentas más grandes han pagado.',
  },

  /* En Corte Sem 3 Agosto — top 5 de 43 cuentas · $53,819
     Seguimiento Sem 1 y 2 en Activo (Pendiente): $13,264 · 8 cuentas — incluido en fila adicional */
  pendientesTotalReal:   53819,
  pendientesCuentasReal: 43,
  pendientes: [
    { cliente: '🔝 LI FINANCIERA',  monto: 9104, mesesActivo: 9,  ultimaFactura: '17/07/2026' },
    { cliente: 'KW - Pedregal',     monto: 6382, mesesActivo: 92, ultimaFactura: '15/07/2026' },
    { cliente: 'AS CONSULTING',     monto: 4745, mesesActivo: 0,  ultimaFactura: '07/07/2026' },
    { cliente: 'GRUPO CYA',         monto: 3661, mesesActivo: 57, ultimaFactura: '16/07/2026' },
    { cliente: 'Ikan experience',   monto: 3049, mesesActivo: 45, ultimaFactura: '13/07/2026' },
    { cliente: '+ 38 cuentas adicionales sem 3 · Seguimiento Activo (Pendiente) Sem 1 y 2: $13,264.00 · 8 cuentas — Sem 1: Urban Capital $2,058 · Doña Alegria $979 · LEAH Inmobiliaria $418.50 · GRUPO EMPRESARIAL THUKI $279 — Sem 2: AS CONSULTING $4,745 · Ikan experience $3,049 · NatGas - Línea de Emergencias $1,540.50 · Property Solutions $195. Total pasado a Desactivado en Sem 1 y 2: $13,817.00 (18 cuentas).', monto: 26878, mesesActivo: 0, ultimaFactura: 'Ver documento' },
  ],

  /* Cancelados Sem 3 Agosto — 8 cuentas · $11,667 · top 5 */
  canceladosCasosReal: 8,
  cancelados: [
    { cliente: '🔝 Centro Mexicano de Psicología Integrativa CEMEPI', mrr: 2921, mesesActivo: 77, acumulado: 204386 },
    { cliente: 'Custodias RJ',                                       mrr: 2920, mesesActivo: 5,  acumulado: 14600  },
    { cliente: 'Prya grupo inmobiliario',                            mrr: 2314, mesesActivo: 83, acumulado: 165926 },
    { cliente: 'Torre 2 - Vía Montejo',                               mrr: 1890, mesesActivo: 29, acumulado: 52920  },
    { cliente: 'COESPRO',                                            mrr: 579,  mesesActivo: 55, acumulado: 25702  },
    { cliente: '+ 3 cuentas adicionales',                            mrr: 1043, mesesActivo: 0,  acumulado: 0      },
  ],

  /* Downgrades Sem 3 Agosto — 5 clientes · $10,905 */
  downgradeTotalReal: 10905,
  downgrades: [
    { cliente: '🔝 Grupo Hodaya - Holtz', perdida: 3274, nota: '50% de baja — mayor % de reducción de la semana. DiD Nacional $990.00 → $495.00 · Paquete Min VyC $5,558.00 → $2,779.00.' },
    { cliente: 'City HUB',               perdida: 3240, nota: '44% de baja. Paquete Min VyC $4,900.00 → $3,921.00.' },
    { cliente: "Pipolo's",               perdida: 1400, nota: '40% de baja. Paquete Min CE $3,480.00 → $2,030.00 · Adquirió Usuario admin adicional (+$50.00).' },
    { cliente: 'ZD - Midstorage',        perdida: 1761, nota: '27% de baja. Paquete Min VyC $5,355.00 → $3,000.00 · Upsell DiD Nacional $1,089.00 → $1,683.00 en la misma cuenta.' },
    { cliente: 'DRENVIO',                perdida: 1230, nota: '27% de baja. Paquete Min VyC $4,419.00 → $3,189.00.' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Min VyC', vecesAfectado: 4, clientes: ['Grupo Hodaya - Holtz', 'City HUB', 'ZD - Midstorage', 'DRENVIO'] },
    { articulo: 'DiD Nacional',    vecesAfectado: 1, clientes: ['Grupo Hodaya - Holtz'] },
    { articulo: 'Paquete Min CE',  vecesAfectado: 1, clientes: ["Pipolo's"] },
  ],

  /* Suspendidos Sem 3 Agosto — 13 cuentas · $22,026
     Riesgo de cancelación: 83% (patrón julio) → ≈11 cuentas */
  suspendidosTotalReal:   22026,
  suspendidosCuentasReal: 13,
  suspendidos: [
    { cliente: '🔝 EASO',                                                          importe: 13021, mesesActivo: 76, estado: 'Suspendido' },
    { cliente: 'Servicio Plus Técnicos Especialistas en Línea Blanca',            importe: 2256,  mesesActivo: 6,  estado: 'Suspendido' },
    { cliente: 'AVILA HERRERA GRUPO INMOBILIARIO',                                importe: 1959,  mesesActivo: 33, estado: 'Suspendido' },
    { cliente: 'Energix',                                                        importe: 1021,  mesesActivo: 54, estado: 'Suspendido' },
    { cliente: 'Bell Internacional de Mexico',                                   importe: 687,   mesesActivo: 60, estado: 'Suspendido' },
    { cliente: '+ 8 cuentas adicionales',                                        importe: 3082,  mesesActivo: 0,  estado: 'Suspendido' },
  ],

  /* Desactivados Sem 3 Agosto — 25 cuentas · $19,973
     Riesgo cadena Desactivado→Suspendido→Cancelado: 63%→100% (patrón julio) → ≈16 cuentas */
  desactivadosTotalReal:   19973,
  desactivadosCuentasReal: 25,
  desactivados: [
    { cliente: '🔝 transportes BPG SAS. DE CV.',   importe: 2447, mesesActivo: 39 },
    { cliente: 'FLETES ESPECIALIZADOS TOFRA',      importe: 2387, mesesActivo: 9  },
    { cliente: 'Citlali Amezcua',                  importe: 2012, mesesActivo: 49 },
    { cliente: 'The Yacht Experiences',            importe: 1577, mesesActivo: 86 },
    { cliente: 'Colegio NWL - Milenio',            importe: 1392, mesesActivo: 63 },
    { cliente: '+ 20 cuentas adicionales',         importe: 10158, mesesActivo: 0 },
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
   ARCHIVADO — cada corte baja aquí cuando deja de ser el vigente, para que
   siga siendo consultable desde el selector de períodos. El vigente vive
   siempre en reporte-actual.ts, que es lo que lee Atlas del lado del
   servidor: por eso solo puede haber uno ahí.
     · S18 archivado el  9 sep 2026, al llegar la Semana 19.
     · S19 archivado el 15 sep 2026, al llegar la Semana 20.
     · S22 archivado el 11 oct 2026, al llegar el cierre de T3 (Semana 23).
═══════════════════════════════════════════════════════════════════════ */

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
const REPORTE_S22_SEPTIEMBRE_2026: ChurnReporte = {
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


/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 19 · SEPTIEMBRE 2026  (8 sep 2026)
   Cierre de agosto y arranque de septiembre. Remitente: Valeria Zepeda
   Hernández (equipo Data).
═══════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 20 · SEPTIEMBRE 2026  (15 sep 2026)
   Cierre de agosto con escenario de recuperación y septiembre en curso.
   Remitente: Valeria Zepeda Hernández (equipo Data).

   CONCILIACIÓN DE ESTE CORTE. A diferencia del de la semana 19 —que traía un
   descuadre de $2,868.27 sin explicar entre la alerta y la tabla— éste cuadra
   en todo lo verificable:
     · Hard 17,811.98 + Soft 11,844.00 + Cancelados 0 = 29,655.98 ✓ y 10+17+0 = 27 ✓
     · los cinco tramos de antigüedad suman 425,458.20 ✓
     · los tramos vencidos (12,263.00 + 17,392.98) son EXACTAMENTE Hard + Soft ✓
     · los tres downgrades suman 6,530.00 ✓, y el detalle por artículo reconstruye
       cada pérdida: Elyon 99+90+490−99 = 580 ✓ · Dicap 2,779−570 = 2,209 ✓ ·
       IBC 5,800−2,059 = 3,741 ✓
     · escenario de agosto: 68,784.18 − 22,212.40 = 46,571.78 ✓
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S20_SEPTIEMBRE_2026: ChurnReporte = {
  id:      's20-septiembre-2026',
  periodo: 'Semana 20 · Sep 2026',
  fecha:   '15/09/2026',
  notas:   'Gross Revenue Churn · Semana 20. Al 15 de septiembre del 2026. Cierra agosto con el escenario de recuperación de las cuentas en Hard Suspend y sigue septiembre en curso: Top 10 de cuentas Activas, resumen de Hard Suspend / Soft Suspend / Cancelados, antigüedad de la cartera por cobrar y los downgrades de la semana. Próxima revisión: miércoles 23 de septiembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 23 de septiembre.',

  grc: {
    evolucion: [
      { mes: 'Julio',  pct: 2.0, anterior: 2.1 },
      { mes: 'Agosto', pct: 2.4, anterior: 3.4 },
    ],
    acumulado: 17.4,
    anterior:  18.6,
    notaClave: 'Churn Q3: Julio corregido a la baja de 2.1% a 2.0% · Agosto corregido a la baja de 3.4% a 2.4% por el ajuste de reestructura de facturación de las subcuentas de GTC. Churn acumulado hasta agosto 2026: 17.4% — MES CORRIENDO, NO DEFINITIVO (ant. 18.6%).',
    notaEspecial:
      '🔴 CONCENTRACIÓN EN UN SOLO GRUPO: nueve de las diez cuentas del Top 10 son subcuentas de GTC y suman $230,154.22 — el 58.1% de TODA la cartera Activo de $395,802.22. La única cuenta del Top 10 que no es GTC es ADSA ($32,375.00, 92 meses activo). El Top 10 completo pesa $262,529.22, el 66.3% de la cartera; los $133,273.00 restantes se reparten entre el resto de las cuentas, cuyo número este corte no declara. Esto no es un dato del reporte: sale de sumar su propia tabla. Un impago o una renegociación de GTC no es un evento de cuenta, es un evento de cartera. ' +
      '⚠️ NO COMPARABLE CONTRA LA SEMANA 19: la cartera Activo pasó de $136,410.47 (90 cuentas) a $395,802.22 — un factor de 2.90x en una semana. El salto viene de que las subcuentas de GTC entran ahora con su facturación reestructurada, no de crecimiento comercial. Cualquier lectura de "la cartera casi se triplicó" es falsa. ' +
      '🔁 AGOSTO SE HA CORREGIDO DOS VECES POR LA MISMA CAUSA: 4.9% → 3.4% (semana 19) → 2.4% (semana 20), una corrección acumulada de 2.5 puntos, toda ella atribuida a la reestructura de facturación de GTC - CARRANZA y GTC - LOMAS. La nota del corte declara una reducción de 30k por ese ajuste. El número no termina de asentarse: conviene preguntarle al equipo Data si la revisión ya cerró o si agosto puede moverse otra vez. ' +
      '📌 DOS CIFRAS DISTINTAS DE HARD SUSPEND, Y NO SE CONTRADICEN: el escenario de cierre de agosto habla de 23 cuentas · $22,212.40, y la tabla de septiembre en curso de 10 cuentas · $17,811.98. Son periodos distintos —cierre de agosto contra mes corriendo— y no deben restarse ni compararse entre sí. ' +
      '✅ CERO CANCELADOS EN LA SEMANA: el corte no registra ningún cliente cancelado, contra 6 cuentas y $17,770.98 en la semana 19. Es la primera semana sin bajas del trimestre. ' +
      '💰 DINERO FUERA DE LA CARTERA: $29,655.98 en 27 cuentas — Hard Suspend 10 cuentas · $17,811.98 · 19.5 días promedio pendiente de pago · Soft Suspend 17 cuentas · $11,844.00 · 10.5 días · Cancelados 0 · $0.00. Ese monto es exactamente la suma de los tramos vencidos de la antigüedad de saldos. ' +
      '📉 DOWNGRADE POCO DINERO, MUCHA PROFUNDIDAD: los tres únicos downgrades de la semana suman $6,530.00 —poco contra el promedio mensual— pero los tres recortaron más del 40% de su facturación, y dos de ellos más del 79%. El riesgo aquí no es el monto de la semana: es que un cliente que corta el 85% de lo que paga rara vez se queda en el 15% restante.',
  },

  /* Top 10 · Cuentas Activo de septiembre — total cartera Activo $395,802.22.
     El corte NO declara cuántas cuentas componen ese total, así que no se
     inventa el número: la fila de cierre lleva el monto y dice que el conteo
     no viene en el reporte. */
  pendientesTotalReal: 395802.22,
  pendientes: [
    { cliente: '🔝 GTC - CENTRO MAX',     monto: 34601.46, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - NAVA',              monto: 34189.46, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - CARRANZA, LOMAS',   monto: 33021.73, mesesActivo: 0,  ultimaFactura: 'Activo' },
    { cliente: 'ADSA',                    monto: 32375.00, mesesActivo: 92, ultimaFactura: 'Activo' },
    { cliente: 'GTC - FORUM',             monto: 28484.81, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - BMW',               monto: 26297.55, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - SENDERO',           monto: 23255.06, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - MG POLIFORUM',      monto: 19694.24, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - MG LOMAS',          monto: 16626.24, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - MATEHUALA',         monto: 13983.67, mesesActivo: 6,  ultimaFactura: 'Activo' },
    /* El «+» de arranque NO es decorativo: lib/atlas-context.ts filtra por él
       (`!p.cliente.startsWith('+')`) para no pasarle esta fila de cierre al
       modelo como si fuera un cliente. Sin el prefijo, Atlas reportaría un
       cliente llamado «Resto de la cartera Activo» con $133,273.00. */
    { cliente: '+ Resto de la cartera Activo — el corte no desglosa nombres ni declara cuántas cuentas son.', monto: 133273.00, mesesActivo: 0, ultimaFactura: 'Activo' },
  ],

  /* Cancelados: NINGUNO en la semana. El corte lo dice con todas sus letras
     —«No contamos con registros de clientes cancelados en la semana»— así que
     la lista va vacía a propósito. Vacío por ausencia de bajas, no por falta
     de dato: son cosas distintas y la de aquí es la buena. */
  cancelados: [],

  /* Downgrades de la semana — 3 clientes · $6,530.00, ordenados por % de
     reducción de mayor a menor. El detalle por artículo reconstruye exactamente
     la pérdida declarada de cada uno (ver la conciliación del encabezado). */
  downgradeTotalReal: 6530.00,
  downgrades: [
    { cliente: '🔝 Sellos de Seguridad Grupo Elyon', perdida: 580.00,  nota: '85% de baja — la mayor reducción porcentual de la semana. Quitó DiD Nacional ($99), paquete 800 ($90) y Paquete Min VyC ($490); adquirió DiD Internacional ($99). Neto $580. Se queda con una fracción mínima de lo que pagaba.' },
    { cliente: 'Dicap Desarrollos',                  perdida: 2209.00, nota: '79% de baja. Paquete Min VyC $2,779.00 → $570.00.' },
    { cliente: 'IBC SUITES',                         perdida: 3741.00, nota: '46% de baja — el mayor monto de la semana. Paquete Min VyC $5,800.00 → $2,059.00.' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Min VyC',      vecesAfectado: 3, clientes: ['Sellos de Seguridad Grupo Elyon', 'Dicap Desarrollos', 'IBC SUITES'] },
    { articulo: 'DiD Nacional',         vecesAfectado: 1, clientes: ['Sellos de Seguridad Grupo Elyon'] },
    { articulo: 'Paquete 800',          vecesAfectado: 1, clientes: ['Sellos de Seguridad Grupo Elyon'] },
  ],

  /* Antigüedad de la cartera por cobrar — total $425,458.20.
     Incluye Activo + Hard Suspend + Soft Suspend; Cancelado no forma parte de
     la cartera por cobrar. «Por vencer» es el total Activo al corriente.
     Los dos tramos vencidos suman exactamente el dinero fuera de cartera. */
  antiguedadSaldos: [
    { rango: 'Por vencer',           monto: 395802.22 },
    { rango: '1 – 7 días vencido',   monto: 0.00 },
    { rango: '8 – 15 días vencido',  monto: 12263.00 },
    { rango: '16 – 30 días vencido', monto: 17392.98 },
    { rango: 'Más de 30 días',       monto: 0.00 },
  ],

  /* Fuera de cartera — Hard Suspend 10 cuentas · $17,811.98 · 19.5 días
     promedio y Soft Suspend 17 cuentas · $11,844.00 · 10.5 días. El reporte no
     desglosa nombres en ninguno de los dos estados. Total 27 cuentas ·
     $29,655.98. Ojo: el escenario de CIERRE DE AGOSTO habla de 23 cuentas en
     Hard Suspend por $22,212.40 — es otro periodo, no se compara con éste.

     Y un detalle que el corte no explica: el TOTAL de Hard + Soft empata exacto
     con los tramos vencidos, pero el reparto cruza por $419.00 — Hard tiene
     $419.00 MÁS que el tramo de 16 a 30 días y Soft exactamente $419.00 MENOS
     que el de 8 a 15. No se le inventa una correspondencia cuenta por cuenta:
     se deja anotado para preguntarlo. */
  suspendidosTotalReal:   29655.98,
  suspendidosCuentasReal: 27,
  suspendidos: [
    { cliente: 'Hard Suspend — 10 cuentas · 19.5 días promedio pendiente de pago. El reporte no desglosa nombres.', importe: 17811.98, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Soft Suspend — 17 cuentas · 10.5 días promedio pendiente de pago. El reporte no desglosa nombres.', importe: 11844.00, mesesActivo: 0, estado: 'Suspendido' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 21 · SEPTIEMBRE 2026  (22 sep 2026)
   Remitente: Valeria Zepeda Hernández (equipo Data).

   CONCILIACIÓN DE ESTE CORTE. Cuadra en casi todo, y donde no, se dice:
     · Hard: 15,917.98 (6 previas) + 16,079.00 (17 nuevas) = 31,996.98 ✓ y 6+17 = 23 ✓
     · Cancelados: los 7 importes suman 12,144.00 ✓
     · Fuera de cartera: 31,996.98 + 24,107.00 + 12,144.00 = 68,247.98 ✓ y 23+23+7 = 53 ✓
     · Antigüedad: los cinco tramos suman 249,215.25 ✓
     · Contempo BR se puede reconstruir: 1,959.00 → 1,029.00 = 930.00, el 47% ✓

   ✗ LOS DOWNGRADES NO CIERRAN. La tabla suma 8,115.55 y con Neruc (11,105.97)
     da 19,221.52, pero el corte declara 22,183.52: faltan $2,962.00. Y NO es
     un cliente sin listar —dice «6 clientes identificados» y hay 5 + Neruc = 6—,
     así que o una cifra publicada está mal o hay un importe sin desglosar.

   ✗ DOS IMPORTES CRUZADOS entre CAMPESTRE LOS VIVEROS y HOTEL REAL DE MINAS:
     CAMPESTRE quitó un artículo de $1,245 y se le carga una pérdida de $1,460;
     al HOTEL le pasa justo al revés. Cada uno lleva la cifra del otro. El total
     no cambia (2,705 de cualquier modo), pero los porcentajes sí.

   ⚠ LOS TRAMOS VENCIDOS VUELVEN A CRUZARSE, y ya van dos cortes seguidos: el
     de 8–15 días tiene $489.00 MÁS que Soft Suspend y el de 16–30 exactamente
     $489.00 MENOS que Hard. En la semana 20 el cruce fue de $419.00. El neto
     es cero y el total general no se mueve, así que no es un error de suma —
     parece que una cuenta se clasifica por fecha en un lado y por estado en el
     otro. Dos veces seguidas ya no es casualidad: hay que preguntarlo.

   ⚠ EL CORREO SE CONTRADICE EN EL NÚMERO DE SEMANA: el asunto dice «Semana 21»
     y el cuerpo dice «semana 13» dos veces (en la entrada y en el título de
     los downgrades). Por continuidad con el corte anterior —que fue la 20— se
     registra como 21, y queda dicho que el original no es consistente.
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S21_SEPTIEMBRE_2026: ChurnReporte = {
  id:      's21-septiembre-2026',
  periodo: 'Semana 21 · Sep 2026',
  fecha:   '22/09/2026',
  notas:   'Gross Revenue Churn · Semana 21. Al 22 de septiembre del 2026. Top 10 de cuentas Activas, Hard Suspend / Soft Suspend / Cancelados con el seguimiento de quiénes escalaron de Soft a Hard, antigüedad de la cartera por cobrar y downgrades ordenados por % de reducción, incluido el caso especial de Neruc Sede Central. Próxima revisión: miércoles 30 de septiembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 30 de septiembre.',

  grc: {
    evolucion: [
      { mes: 'Julio',      pct: 1.9,  anterior: 2.0 },
      { mes: 'Agosto',     pct: 2.3,  anterior: 2.4 },
      { mes: 'Septiembre', pct: 23.6 },
    ],
    acumulado: 17.2,
    anterior:  17.4,
    notaClave: 'Churn Q3: Julio baja de 2.0% a 1.9% · Agosto baja de 2.4% a 2.3% · Septiembre 23.6%, MES CORRIENDO Y NO DEFINITIVO. Acumulado hasta agosto 2026: 17.2% (ant. 17.4%).',
    notaEspecial:
      '🔴 EL 23.6% DE SEPTIEMBRE NO ES UNA CAÍDA DEL NEGOCIO. Es el mes sin cerrar: Zoho marca como churn todo contrato que aún no se factura. Julio y agosto, ya cerrados, están en 1.9% y 2.3%. Leer el 23.6% como resultado sería el mismo error que ya documentamos en el corte de la semana 20 — el mes vivo mide retraso de cobranza, no bajas. '
      + '📉 TERCERA CORRECCIÓN A LA BAJA CONSECUTIVA de julio y agosto, ahora de una décima cada uno. Después de los vaivenes de agosto (4.9% → 3.4% → 2.4% → 2.3%) el número por fin se está asentando. '
      + '🟠 LA ESCALACIÓN ES EL DATO DE LA SEMANA: de las 17 cuentas que estaban en Soft Suspend, 11 pasaron a Hard — el 64%. No es una foto de morosidad, es una tendencia: quien entra en Soft acaba en Hard dos de cada tres veces. El Hard Suspend pasó de 10 cuentas y $17,811.98 (semana 20) a 23 cuentas y $31,996.98, y el promedio de días pendientes subió de 19.5 a 17.9 sobre una base mucho mayor. '
      + '💰 $68,247.98 EN 53 CUENTAS NO HAN ENTRADO A LA CARTERA — 27.4% de los $249,215.25 por cobrar. '
      + '⛽ TRES CUENTAS DE GRUPO PETROIL EN EL TOP 10 ACTIVO: Centro de Ayuda TI ($4,771), Colosio Mzt ($3,893) y Torre de Control ($3,839), $12,503 entre las tres. Coincide con lo que GRC ya marcaba como Churn confirmado para esas mismas tres líneas. '
      + '🆕 «Mi Hospedaje Travel» entra al Top 10 con $4,914.00 y CERO meses activo: una cuenta que nunca llegó a facturar un mes completo y ya está en cartera por cobrar. '
      + '📌 EL TOP 10 PESA EL 60.0% de la cartera Activo ($115,771.52 de $193,111.27). Ese porcentaje sale de sumar su propia tabla: el corte no declara cuántas cuentas tiene la cartera en total. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas. Por instrucción de dirección queda REGISTRADO de nuestra parte y NO se consultó al equipo Data. No corregimos ninguna cifra publicada: se respeta lo que el corte declara y se anota la diferencia. '
      + '① LOS DOWNGRADES NO CIERRAN POR $2,962.00. La tabla suma $8,115.55 y con Neruc $19,221.52, pero el corte declara $22,183.52. No es un cliente sin listar: dice «6 clientes identificados» y hay 5 + Neruc = 6. O una cifra publicada está mal, o hay un importe que no se desglosó. Se conserva el total declarado. '
      + '② DOS IMPORTES CRUZADOS ENTRE DOS CLIENTES. CAMPESTRE LOS VIVEROS quitó un artículo de $1,245 y se le carga una pérdida de $1,460; al HOTEL REAL DE MINAS le ocurre justo al revés. Cada uno lleva la cifra del otro. La suma de los dos no cambia ($2,705 de cualquier modo), pero sus porcentajes de baja sí: el 55% y el 24% están calculados sobre el importe equivocado. '
      + '③ LOS TRAMOS VENCIDOS SE CRUZAN POR $489.00, Y VAN DOS CORTES SEGUIDOS. El tramo de 8–15 días tiene $489.00 más que Soft Suspend y el de 16–30 exactamente $489.00 menos que Hard. En la semana 20 el mismo cruce fue de $419.00. El neto es cero y el total general no se mueve, así que no es un error de suma: parece que alguna cuenta se clasifica por fecha en un lado y por estado en el otro. Dos cortes seguidos ya no es casualidad. '
      + '④ EL CORREO SE CONTRADICE EN EL NÚMERO DE SEMANA. El asunto dice «Semana 21» y el cuerpo dice «semana 13» dos veces. Se registra como 21 por continuidad con el corte anterior. '
      + '⑤ LO QUE SÍ CUADRA, para que conste: Hard Suspend (6+17 = 23 cuentas, $31,996.98), los 7 cancelados ($12,144.00), el total fuera de cartera ($68,247.98 en 53 cuentas) y los cinco tramos de antigüedad ($249,215.25). Contempo BR se reconstruye al centavo desde sus propios datos: 1,959.00 − 1,029.00 = 930.00, el 47%.',
  },

  /* Top 10 de cuentas Activo. `ultimaFactura` no viene en este corte. */
  pendientesTotalReal:   193111.27,
  pendientes: [
    { cliente: 'ADSA',                          monto: 32375.00, mesesActivo: 92, ultimaFactura: '—' },
    { cliente: 'Ancona Autopartes',             monto: 27707.00, mesesActivo: 83, ultimaFactura: '—' },
    { cliente: 'VAEO',                          monto: 15995.52, mesesActivo:  4, ultimaFactura: '—' },
    { cliente: 'HomiRent',                      monto: 11998.00, mesesActivo: 51, ultimaFactura: '—' },
    { cliente: 'KW - Pedregal',                 monto:  6481.00, mesesActivo: 93, ultimaFactura: '—' },
    { cliente: 'Mi Hospedaje Travel',           monto:  4914.00, mesesActivo:  0, ultimaFactura: '—' },
    { cliente: 'Petroil - Centro de Ayuda TI',  monto:  4771.00, mesesActivo: 36, ultimaFactura: '—' },
    { cliente: 'Petroil - Colosio Mzt',         monto:  3893.00, mesesActivo: 51, ultimaFactura: '—' },
    { cliente: 'Petroil - Torre de Control',    monto:  3839.00, mesesActivo: 50, ultimaFactura: '—' },
    { cliente: 'EKTARIS GRUPO INMOBILIARIO',    monto:  3798.00, mesesActivo:  9, ultimaFactura: '—' },
  ],

  /* El corte da el motivo de cada baja pero NO los meses activos ni el
     acumulado histórico: van en 0 porque no se miden, no porque valgan cero. */
  cancelados: [
    { cliente: 'VEMEPE — proyecto en pausa: es para un tercero que aún no tiene equipo de atención listo; posible reactivación en ~2 meses.', mrr: 6890.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'INBROTEK SERVICIOS — problema financiero: no puede seguir pagando y requiere capitalizarse; rechazó el plan de extensiones ilimitadas en CE.', mrr: 2801.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'Bodegard — cambios organizacionales internos.', mrr: 979.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'ISESA GENERADORES — falla técnica: la plataforma se desconectaba con frecuencia.', mrr: 967.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'Visium Supplies — falta de valor percibido, sin respuesta del cliente.', mrr: 169.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'GMG Inmuebles — reducción de operaciones: cliente en proceso de jubilación, ya no usaba el servicio.', mrr: 169.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'Espacio Mexico — motivo desconocido, sin respuesta del cliente.', mrr: 169.00, mesesActivo: 0, acumulado: 0 },
  ],

  downgradeTotalReal: 22183.52,
  downgrades: [
    { cliente: 'IML', perdida: 3699.55, nota: '23% de baja. Quitó CALLPICKER ($3,699.55) — artículo «PND Mensaje en Conversación Nov 25». Es la mayor pérdida de la tabla.' },
    { cliente: 'CAMPESTRE LOS VIVEROS', perdida: 1460.00, nota: '55% de baja. Quitó Agente CP Chat ($1,245). ⚠ La cifra de pérdida y la del artículo NO coinciden, y están cruzadas con las del Hotel Real de Minas: ese quitó $1,460 y se le carga $1,245. Cada uno lleva el importe del otro.' },
    { cliente: 'HOTEL REAL DE MINAS SAN MIGUEL DE ALLENDE', perdida: 1245.00, nota: '24% de baja. Quitó Extensión VyC ($1,460). ⚠ Mismo cruce que CAMPESTRE: el artículo vale más que la pérdida declarada.' },
    { cliente: 'Contempo BR', perdida: 930.00, nota: '47% de baja. Paquete Min VyC de $1,959.00 a $1,029.00. Es el único que se reconstruye al centavo desde sus propios datos.' },
    { cliente: 'Terralta Residencial', perdida: 781.00, nota: '79% de baja, la mayor en proporción. Quitó paquete Min VyC ($979) y adquirió DiD Nacional ($198): 979 − 198 = 781 ✓.' },
    { cliente: 'Neruc Sede Central — CASO ESPECIAL, NO ENTRA AL RANKING', perdida: 11105.97, nota: 'Facturaba Min Calltracking ($6,099.97) + DiD Nacional ($7,139.00) + DiD Internacional ($300.00) y ahora solo Min VyC ($475.00) + DiD Nacional ($1,958.00). El corte NO define si es un downgrade real por cambio de artículos o un upsell cuyos conceptos del mes anterior faltan por facturar. Requiere revisión antes de contarlo como pérdida.' },
    /* El descuadre de $2,962.00 NO va aquí. Estuvo un momento como una fila más
       y era un error: la tabla es de CLIENTES, y meter ahí una observación
       nuestra la convierte en un cliente que no existe. Vive en `notaEspecial`,
       bajo el bloque de observaciones de Customer Success. */
  ],

  suspendidosTotalReal:   56103.98,
  suspendidosCuentasReal: 46,
  suspendidos: [
    { cliente: 'Hard Suspend — 23 cuentas · 17.9 días promedio pendiente de pago. 6 vienen de la semana anterior ($15,917.98) y 17 son nuevas ($16,079.00); de ellas, 11 escalaron desde Soft Suspend.', importe: 31996.98, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Soft Suspend — 23 cuentas · 11.7 días promedio pendiente de pago. El corte solo desglosa las 5 mayores: iELO ($3,969), EM SOLUCIONES ($3,217), DOSATEC ($2,382), COTERRA AGROBSNSS ($2,356) y MUMBII ($1,745).', importe: 24107.00, mesesActivo: 0, estado: 'Suspendido' },
  ],

  antiguedadSaldos: [
    { rango: 'Por vencer (total Activo)', monto: 193111.27 },
    { rango: '1–7 días vencido',          monto: 0.00 },
    { rango: '8–15 días vencido',         monto: 24596.00 },
    { rango: '16–30 días vencido',        monto: 31507.98 },
    { rango: 'Más de 30 días',            monto: 0.00 },
  ],
}


const REPORTE_S19_SEPTIEMBRE_2026: ChurnReporte = {
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

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 18 · CIERRE AGOSTO 2026  (1 sep 2026)
   Primer envío con la nueva cadencia semanal en martes.
═══════════════════════════════════════════════════════════════════════ */
const REPORTE_S18_AGOSTO_2026: ChurnReporte = {
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
  canceladosCasosReal: 21,
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

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENTES UI REUTILIZABLES
═══════════════════════════════════════════════════════════════════════ */
function SemaforoDot({ tipo }: { tipo: SemaforoChurn }) {
  const s = SEMAFORO_MAP[tipo]
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
      /* El punto de color de al lado sigue siendo `s.color`: ese es el
         que comunica. Lo que se oscurece es la LETRA. */
      style={{ background: `${s.color}15`, color: tonoSobreClaro(s.color, 0.08), borderColor: `${s.color}35` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

/* La tarjeta de KPI, CON EL COLOR DEL DATO A LA VISTA.
 *
 * Antes era una caja blanca con un borde gris: las cinco se veían iguales y
 * había que leer la cifra para saber de qué hablaba cada una. La franja
 * superior lleva el color del dato —rojo lo cancelado, ámbar lo que baja,
 * marino lo institucional— así que la tarjeta se identifica de un vistazo y
 * antes de leerla.
 *
 * La LETRA del valor no usa el color crudo: pasa por `tonoSobreClaro`, que lo
 * oscurece hasta que mide 4.5:1 sobre blanco. El ámbar `#F59E0B` da 2.15:1 en
 * crudo —ilegible— y la franja conserva el tono vivo, que es donde el color
 * tiene que comunicar. [[atlas-dashboard-contrast-architecture]] */
function KpiCard({ icon: Icon, label, value, sub, color }:
  { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  const letra = tonoSobreClaro(color, 0.10)
  return (
    <div className="rounded-xl p-4 transition-shadow hover:shadow-md"
      style={{
        background: '#FFFFFF',
        border: '1px solid #DFE8EF',
        borderTop: `3px solid ${color}`,
        boxShadow: '0 1px 2px rgba(16,53,93,0.06)',
      }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: '#667384', letterSpacing: '0.04em' }}>{label}</p>
          <p className="text-2xl font-extrabold mt-1.5" style={{ color: letra }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: '#667384' }}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}1A`, border: `1px solid ${color}33` }}>
          <Icon size={17} style={{ color: letra }} />
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
        <td className="py-3 px-4 text-right font-semibold text-sm" style={{ color: AMBER_TX }}>{fmt(d.perdida)}</td>
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
              { label: 'Pendientes',  val: fmt(totPend), count: data.pendientes.filter(r => r.cliente).length, color: ORANGE_TX },
              { label: 'Cancelados',  val: fmt(totCanc), count: data.cancelados.filter(r => r.cliente).length, color: RED_TX    },
              { label: 'Downgrades',  val: fmt(totDown), count: data.downgrades.filter(r => r.cliente).length, color: AMBER_TX  },
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
          Clientes pendientes de facturar · Total: <strong style={{ color: ORANGE_TX }}>{fmt(totPend)}</strong>
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
          Clientes cancelados · MRR perdido: <strong style={{ color: RED_TX }}>{fmt(totCanc)}</strong>
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
          Clientes con reducción de plan · Ingreso perdido: <strong style={{ color: AMBER_TX }}>{fmt(totDown)}</strong>
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
                  style={{ background: i <= step ? '#10355D' : '#DFE8EF' }} />
                <span className="text-[9px] font-medium"
                  style={{ color: i === step ? '#10355D' : '#667384' }}>
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
              style={{ background: '#10355D' }}>
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleSave} disabled={!canSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: canSave ? '#22c55e' : '#667384' }}>
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
/* Filas de cierre: las que agrupan «el resto» para que el total cuadre. Se
   marcan con «+» al principio del nombre, y ese mismo prefijo es el que usa
   `lib/atlas-context.ts` para no pasárselas al modelo como si fueran clientes. */
function sinCubo<T extends { cliente: string }>(rows: T[]): T[] {
  return rows.filter(r => !r.cliente.trimStart().startsWith('+'))
}

/* Cuántas cancelaciones rotular, en UN solo sitio para los cuatro que lo pintan
   (tarjeta KPI, resumen, pestaña y tarjeta del selector). Devuelve 'n/d' cuando
   el corte sólo trae cubo y no declara el conteo: ahí el número no es cero, es
   desconocido. [[feedback-cero-sin-medicion]] [[feedback-tablas-deben-cerrar]] */
function etiquetaCancelados(r: ChurnReporte): string {
  if (r.canceladosCasosReal !== undefined) return String(r.canceladosCasosReal)
  const n = sinCubo(r.cancelados).length
  return n === 0 && r.cancelados.length > 0 ? 'n/d' : String(n)
}

/* Un corte que no cuantifica downgrades no es un corte con cero downgrades. */
function downgradesSinMedir(r: ChurnReporte): boolean {
  return r.downgradeTotalReal === undefined && r.downgrades.length === 0
}

function buildTabs(r: ChurnReporte): { id: Tab; label: string; color: string }[] {
  const tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'resumen',    label: 'Resumen',                                              color: INDIGO },
  ]
  if (r.grc) {
    tabs.push({ id: 'grc', label: '📊 Comportamiento GRC',                            color: TEAL   })
  }
  tabs.push(
    { id: 'pendiente',    label: `🟠 Pendientes (${r.pendientesCuentasReal ?? sinCubo(r.pendientes).length})`, color: ORANGE_TX },
  )
  if (r.cancelados.length > 0) {
    tabs.push({ id: 'cancelados', label: `🔴 Cancelados (${etiquetaCancelados(r)})`, color: RED_TX })
  }
  tabs.push(
    /* «(0)» en el rótulo afirma que no hubo ninguno. Cuando el corte no los
       mide, el rótulo lo dice. [[feedback-cero-sin-medicion]] */
    { id: 'downgrades',  label: downgradesSinMedir(r)
        ? '🟡 Downgrades (no reportados)'
        : `🟡 Downgrades (${r.downgradeCasosReal ?? sinCubo(r.downgrades).length})`, color: AMBER_TX  },
  )
  if (r.suspendidos && r.suspendidos.length > 0) {
    tabs.push({ id: 'suspendidos', label: `🔵 Suspendidos (${r.suspendidosCuentasReal ?? r.suspendidos.length})`, color: BLUE })
  }
  if (r.desactivados && r.desactivados.length > 0) {
    tabs.push({ id: 'desactivados', label: `🔵 Desactivados (${r.desactivadosCuentasReal ?? r.desactivados.length})`, color: '#10355D' })
  }
  tabs.push({ id: 't1',   label: 'Resumen T1 2026',                                   color: INDIGO })
  // NOTA: 'aaa' y 'conciliacion' NO van aquí. Son secciones propias, con su
  // botón en la barra de accesos del encabezado, no tabs del Análisis DATA.
  // Mezclarlos hacía que el selector de períodos y los KPIs del análisis
  // siguieran visibles encima de su contenido.
  //
  // ('zoho' era otra de estas secciones hasta que se eliminó el módulo Zoho ·
  // Dormidos el 17 sep 2026. El endpoint /api/facturacion?mode=dormidos sigue
  // vivo: lo consumen /api/conciliacion y la compuerta de actividades SAC.)
  return tabs
}

/* ── Botón de acceso rápido — fila del encabezado ──────────────────────── */
function AccesoBtn({ active, onClick, icon, label, bg, badge, href }: {
  active: boolean
  onClick?: () => void
  icon: React.ReactNode
  label: string
  bg: string
  badge?: number
  href?: string
}) {
  const style: React.CSSProperties = {
    background: active ? bg : `${bg}12`,
    color: active ? '#fff' : bg,
    padding: '10px 11px',
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: '0.01em',
    lineHeight: 1.25,
    border: active ? '1.5px solid rgba(255,255,255,0.15)' : `1.5px solid ${bg}25`,
  }
  const content = (
    <>
      <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 16 }}>{icon}</span>
      <span>{label}</span>
      {badge != null && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.22)' : `${bg}20`,
          color: active ? '#fff' : bg,
          borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 800, flexShrink: 0,
        }}>{badge}</span>
      )}
    </>
  )
  // Sin `w-full`: en una fila horizontal cada botón mide lo que mide su
  // texto. `whitespace-nowrap` evita que «Gross Revenue Churn» se parta.
  const className = 'flex items-center gap-2 rounded-lg transition-all whitespace-nowrap'
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {content}
      </a>
    )
  }
  return (
    <button onClick={onClick} className={className} style={style}>
      {content}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════════════ */
/* ── ARCHIVADO: era el corte vigente hasta que llegó el siguiente.
      NO se retecleó: se extrajo de git con
      `scripts/archiva-corte-churn.py` y se verificó byte a byte. */
const REPORTE_S23_T3_2026: ChurnReporte = {
  id:      's23-t3-2026',
  periodo: 'Semana 23 · Cierre T3 2026',
  fecha:   '06/10/2026',
  notas:   'Gross Revenue Churn · Semana 23. Cierre de trimestre T3 al 6 de octubre del 2026. '
         + 'Consolidado de julio, agosto y septiembre; Top 5 de cancelaciones del trimestre, '
         + 'pérdida por producto en CP Chat y CP Voz, las 24 salidas tempranas con 0 o 1 mes '
         + 'activo y los 14 downgrades de más del 60%. Por ser cierre de trimestre NO trae Top 10 '
         + 'de Activo, ni Hard/Soft Suspend, ni antigüedad de saldos: esos bloques salen vacíos '
         + 'porque el corte no los reporta, no porque valgan cero. Próxima revisión: miércoles '
         + 'próximo, por la mañana.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles próximo, por la mañana.',

  grc: {
    evolucion: [
      { mes: 'Julio',      pct: 1.91 },
      { mes: 'Agosto',     pct: 2.12 },
      { mes: 'Septiembre', pct: 3.14, anterior: 6.9 },
    ],
    acumulado: 2.39,
    /* El 2.39% es del TRIMESTRE, no del año. Sin esta etiqueta la tarjeta
       diría «GRC Acumulado Septiembre 2.39%» y se leería como que el año se
       desplomó desde el 23.7% de la semana 22, que es otra cosa. */
    acumuladoEtiqueta: 'T3 2026 · Jul–Sep (ponderado)',
    notaClave:
      'Cierre de T3 2026: Julio 1.91% · Agosto 2.12% · Septiembre 3.14%. Baja total del trimestre '
      + '$356,494.79 sobre $14,905,931.06 de MRR. El trimestre EMPEORA mes a mes y lo que crece es '
      + 'el churn confirmado ($69,086.46 → $100,567.96), no el downgrade. El 2.39% es el promedio '
      + 'PONDERADO de los tres meses: el corte deja esa casilla en blanco y lo reconstruye '
      + 'Customer Success dividiendo la baja total entre la suma de las tres bases.',
    notaEspecial:
      '🔵 SEPTIEMBRE CIERRA EN 3.14%, Y ES LA TERCERA LECTURA DEL MISMO MES: 23.6% el 22 de '
      + 'septiembre, 6.9% el 29, y 3.14% ya cerrado. De la primera cifra a la definitiva se '
      + 'desinfló a UNA SÉPTIMA PARTE. Quien haya reportado el 23.6% como resultado de septiembre '
      + 'reportó un número siete veces mayor que el real. Es exactamente lo que este módulo lleva '
      + 'tres cortes advirtiendo: el mes vivo mide retraso de cobranza, no bajas, porque Zoho marca '
      + 'como churn todo contrato que aún no factura. '
      + '📌 EL ACUMULADO DEL AÑO QUEDA VENCIDO Y SIN SUSTITUTO. La semana 22 publicó 23.7% acumulado '
      + '2026; este corte reexpresa septiembre a la baja y NO vuelve a publicar el acumulado anual. '
      + 'O sea que el 23.7% ya no es cierto y no hay cifra nueva — no se inventa una. El 2.39% de la '
      + 'tarjeta es del TRIMESTRE. '
      + '⏱️ VEINTICUATRO CUENTAS SE FUERON CON 0 O 1 MES DE VIDA ($26,808.00), y DIECIOCHO de ellas '
      + 'con CERO meses ($13,740.00): nunca llegaron a facturar un mes completo. Dos ni siquiera '
      + 'tienen nombre en el sistema (cp188899, cp189204) — entraron y se fueron sin que nadie las '
      + 'bautizara. '
      + '🔻 EL TOP 5 DE CANCELACIONES SUMA $53,095.93 de los $225,867.20 de churn confirmado del '
      + 'trimestre: el 23.5%. Los otros $172,771.27 no se desglosan en este corte. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas con '
      + '`scripts/concilia-churn-t3.py`. Queda registrado de nuestra parte, no se consultó al equipo '
      + 'Data y no se corrige ninguna cifra publicada. '
      + '① EL TOP 5 DE CP VOZ DEJA FUERA $99,642.28, el 22.8% de su categoría. Los cinco artículos '
      + 'suman $337,904.27 y la categoría vale $437,546.55. Citar el Top 5 como «la pérdida de voz» '
      + 'se equivoca por casi un cuarto. El de CP Chat sí cierra: son los cuatro artículos completos. '
      + '② LAS DOS BASES DE MRR DEL MISMO TRIMESTRE NO COINCIDEN. El resumen mensual usa '
      + '$14,905,931.06 y el resumen amplio $14,282,606.76 — $623,324.30 de diferencia que el corte '
      + 'no explica. Preguntarlo antes de citar cualquiera de los dos como «el MRR del T3». '
      + '③ LA PÉRDIDA POR PRODUCTO ($482,999.06) SUPERA A LA BAJA TOTAL ($356,494.79) EN $126,504.27, '
      + 'y eso NO es un descuadre: la tabla de productos es impacto BRUTO, sin netear contra los '
      + 'upsells dentro de la misma cuenta. Es el mismo aviso de la semana 22. No sumar las dos tablas. '
      + '④ TATSA (D59) ES LA SEGUNDA CANCELACIÓN MÁS GRANDE DEL TRIMESTRE —$11,086 en agosto, 4 meses '
      + 'activa— Y LA DIMOS DE ALTA COMO CUENTA TOP EL 9 DE SEPTIEMBRE, un mes DESPUÉS de su baja. '
      + 'Hoy figura en hibernación, así que ya se corrigió; lo que conviene saber es cómo entró: el '
      + 'alta se hizo desde una ficha de dirección y SIN CID, así que no cruzaba con facturación y '
      + 'ninguna fuente pudo avisar. Es el argumento más concreto para exigir CID en toda alta. '
      + '⑤ CINCO CLIENTES DE ESTE CORTE ESTÁN EN NUESTRA CARTERA: Bliss crédito libre (C28, '
      + 'cancelado), TATSA (D59, hibernación), Mas Suites (C32, hibernación), INBROTEK SERVICIOS '
      + '(C66, en riesgo) y Hound Express (D30, en riesgo). Los tres primeros ya están movidos; los '
      + 'dos últimos siguen vivos con downgrades del 71.17% y 64.01%. El cruce es POR NOMBRE —el '
      + 'correo no trae CIDs— así que es indicativo y no obliga a mover nada por sí solo. '
      + '⑥ INBROTEK CAMBIA DE CLASIFICACIÓN ENTRE CORTES: la semana 22 la listaba como Cancelado '
      + '($2,801) y ésta como downgrade del 71.17% ($6,915.96) en agosto. Dos lecturas distintas del '
      + 'mismo cliente en la misma familia de reportes. Hoy está en nuestra cartera como en riesgo '
      + 'con $5,510, que es coherente con el downgrade y no con la cancelación. Vale preguntarlo. '
      + '⑦ LO QUE SÍ CUADRA, al centavo: las tres filas mensuales contra el TOTAL T3 en las cuatro '
      + 'columnas; Downgrade + Churn = Baja Total en cada mes; los tres porcentajes reconstruidos '
      + 'desde sus propias cifras; las 24 salidas tempranas ($26,808.00); los 14 downgrades '
      + '($22,399.83); los 4 artículos de CP Chat ($45,452.51); CP Chat + CP Voz = la pérdida total '
      + 'del resumen amplio ($482,999.06); y las TRES bases de MRR del correo coincidían al centavo '
      + 'con las del export institucional cuando se publicó este corte. '
      + '⑧ ACTUALIZACIÓN DEL 11 OCT: el export institucional reexpresó esas bases DESPUÉS de que '
      + 'Data mandó este corte —+$700 en julio y agosto, +$1,225.33 en septiembre— y bajó el churn '
      + 'de septiembre de $100,567.96 a $79,483.96. No es un error de nadie: es que el '
      + 'institucional se mueve. Y la bajada de septiembre NO es sólo cobranza que entró: la mayor '
      + 'parte son contratos reclasificados de «Churn confirmado» a «Churn mensual», que el GRC no '
      + 'cuenta. Las cifras de este corte se conservan tal como Data las publicó el 6 de octubre.',
  },

  /* El cierre de trimestre NO reporta Top 10 de cuentas Activo. Va vacío
     porque el corte no lo trae, no porque no haya cartera por cobrar. */
  pendientes: [],

  /* Top 5 de cancelaciones de TODO el trimestre. Suman $53,095.93 de los
     $225,867.20 de churn confirmado: el 23.5%. El resto no se desglosa.
     `acumulado` (histórico facturado) sólo lo traía el corte de la semana 22
     para tres de ellos; para Bliss y TATSA NO hay dato y queda en 0 dicho con
     palabras — un cero sin medición no es un cero. */
  cancelados: [
    { cliente: 'Bliss crédito libre — la mayor cancelación del trimestre, 24 meses activa, baja en julio. ACUMULADO HISTÓRICO NO DISPONIBLE: ningún corte lo ha publicado. En nuestra cartera es C28 y ya figura como cancelado.', mrr: 16799.97, mesesActivo: 24, acumulado: 0 },
    { cliente: 'TATSA — baja en agosto con 4 meses activa. ACUMULADO HISTÓRICO NO DISPONIBLE. ⚠ Es D59 en nuestra cartera: se dio de alta como cuenta TOP el 9 de septiembre, un mes DESPUÉS de esta baja, con ficha de dirección y sin CID. Hoy está en hibernación.', mrr: 11086.00, mesesActivo: 4, acumulado: 0 },
    { cliente: 'Hoteles y Servicios — contratado en junio 2026, llegó por Adwords tras cambiar de proveedor. Empezó con 16 extensiones y terminó con 6 antes de cancelar en septiembre. Acumulado del corte de la semana 22.', mrr: 10946.98, mesesActivo: 2, acumulado: 32742.00 },
    { cliente: 'Mas Suites — 70 meses activo, el cliente más antiguo de los que se fueron en el trimestre. El corte no da motivo. Es C32 en nuestra cartera, ya en hibernación. Acumulado del corte de la semana 22.', mrr: 7372.98, mesesActivo: 70, acumulado: 393693.64 },
    { cliente: 'VEMEPE — 1 mes activo. También encabeza las salidas tempranas del trimestre. Acumulado del corte de la semana 22.', mrr: 6890.00, mesesActivo: 1, acumulado: 13780.00 },
  ],

  /* El total del trimestre es $130,627.59; los 14 de abajo son SÓLO el
     subconjunto de reducciones mayores al 60%, que suman $22,399.83. */
  downgradeTotalReal: 130627.59,
  downgrades: [
    { cliente: 'MEGAVIAL ABOGADOS', perdida: 1407.00, nota: '93.43% de reducción — la mayor en proporción del trimestre. Septiembre.' },
    { cliente: 'CiberZion',          perdida:  421.87, nota: '86.27% de reducción. Julio. Ojo: la semana 22 reportó para este cliente $1,926.74 de pérdida con 49% de baja — es otro evento, no el mismo.' },
    { cliente: 'MIRA DIAMANTE SOLUCLOUD', perdida: 1122.00, nota: '82.26% de reducción. Julio.' },
    { cliente: 'DUNA',               perdida:  784.00, nota: '80.08% de reducción. Agosto.' },
    { cliente: 'Artesanal.com.mx',   perdida:  784.00, nota: '80.08% de reducción. Septiembre. Mismo importe y mismo porcentaje que DUNA en agosto.' },
    { cliente: 'DATA SMART INFORMATIC', perdida: 604.00, nota: '75.59% de reducción. Septiembre.' },
    { cliente: 'INBROTEK SERVICIOS', perdida: 6915.96, nota: '71.17% de reducción y la MAYOR pérdida de este subconjunto. Agosto. ⚠ Es C66 en nuestra cartera, de Fátima, hoy en riesgo con $5,510. La semana 22 la listaba como Cancelado ($2,801): dos clasificaciones distintas del mismo cliente.' },
    { cliente: 'Zuhma',              perdida:  340.00, nota: '69.53% de reducción. Agosto.' },
    { cliente: 'Soluciones Textiles del Norte', perdida: 1350.00, nota: '68.91% de reducción. Julio.' },
    { cliente: 'BAKELGROUP',         perdida:  320.00, nota: '65.44% de reducción. Julio.' },
    { cliente: 'Hound Express',      perdida: 4481.00, nota: '64.01% de reducción. Septiembre. Es D30 en nuestra cartera, de Dan, hoy en riesgo. La semana 22 reportó el mismo importe ($4,481, paquete Min VyC de $7,000 a $2,519): es el mismo evento visto dos veces, no dos bajas.' },
    { cliente: 'Embler Autopartes',  perdida: 3281.00, nota: '61.44% de reducción. Agosto.' },
    { cliente: 'Visualizza',         perdida:  295.00, nota: '60.20% de reducción. Julio.' },
    { cliente: 'CASBA Consultoría, Seguridad e Higiene Laboral y Salud Ocupacional', perdida: 294.00, nota: '60.12% de reducción. Julio. El menor del subconjunto, justo en el umbral.' },
  ],

  /* Pérdida por producto del trimestre. El importe va en el nombre porque el
     corte NO publica en cuántos casos se perdió cada artículo: `vecesAfectado`
     se queda en 0 y eso significa «no reportado», no «ninguno». */
  downgradeArticulos: [
    { articulo: 'CP VOZ · paquete Min VyC — $118,684.52',             vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · Extension Callcenter — $78,481.64',         vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · paquete Min CE — $63,561.10',               vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · Extension VyC — $48,689.44',                vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · DiD Nacional — $28,487.57',                 vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · el resto de la categoría — $99,642.28',     vecesAfectado: 0, clientes: ['⚠ CUBO DE CIERRE. El corte sólo publica el Top 5 ($337,904.27) de una categoría que vale $437,546.55. Sin esta fila el Top 5 se leería como toda la pérdida de voz, y deja fuera el 22.8%.'] },
    { articulo: 'CP CHAT · Agente CP Chat — $34,079.14',              vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP CHAT · Agente CP Chat Callcenter — $10,313.37',   vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP CHAT · paquete Chatbot — $1,000.00',              vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP CHAT · paquete Whatsapp API — $60.00',            vecesAfectado: 0, clientes: ['CP Chat SÍ cierra: estos cuatro artículos son la categoría completa, $45,452.51.'] },
  ],

  /* Las 24 salidas tempranas del trimestre: cuentas que se cayeron con 0 o 1
     mes activo. 18 con CERO meses ($13,740.00) y 6 con uno ($13,068.00). */
  desactivadosTotalReal:   26808.00,
  desactivadosCuentasReal: 24,
  desactivados: [
    { cliente: 'VEMEPE — septiembre',                              importe: 6890.00, mesesActivo: 1 },
    { cliente: 'GRUPO GEVHE — julio. Pedía un plan más grande: no le avisaron al contratar que los minutos se tarifican distinto. Se le ofrecieron alternativas y decidió no continuar.', importe: 3817.00, mesesActivo: 1 },
    { cliente: 'RDS ELITE CONDOS PDC SA DE CV — agosto. Se fue por la caída de las tasas de respuesta telefónica, que bajaron al 6–10%. Descartó ajustar plan o migrar a chat y contrató a un competidor externo con mensajería integrada.', importe: 2387.00, mesesActivo: 0 },
    { cliente: 'Delta Capital & Holding Street — julio',           importe: 2377.00, mesesActivo: 0 },
    { cliente: 'Alamo Seguros — julio',                            importe: 1959.00, mesesActivo: 0 },
    { cliente: 'syndeX — agosto',                                  importe: 1318.00, mesesActivo: 1 },
    { cliente: 'IMAGINA SER — septiembre',                         importe: 1080.00, mesesActivo: 0 },
    { cliente: 'BLACKNET — septiembre',                            importe:  668.00, mesesActivo: 0 },
    { cliente: 'INTERHOME GJ — septiembre',                        importe:  519.00, mesesActivo: 0 },
    { cliente: 'Grupo Altiora — septiembre',                       importe:  519.00, mesesActivo: 0 },
    { cliente: 'Dios Del Aire CLN — julio',                        importe:  489.00, mesesActivo: 0 },
    { cliente: 'Torre Himalaya 24 — julio',                        importe:  489.00, mesesActivo: 1 },
    { cliente: 'MA-AR TRANSPORTE LOGISTICO — julio',               importe:  489.00, mesesActivo: 0 },
    { cliente: 'DISENSA FC — agosto',                              importe:  489.00, mesesActivo: 0 },
    { cliente: 'Sistemas Secuencia — agosto',                      importe:  489.00, mesesActivo: 0 },
    { cliente: 'Sport and Therapy — agosto',                       importe:  489.00, mesesActivo: 0 },
    { cliente: 'cp188899 — agosto. SIN NOMBRE en el sistema: entró y se fue sin que nadie la bautizara.', importe: 489.00, mesesActivo: 0 },
    { cliente: 'COMERCIALIZADORA SIN FRONTERAS — agosto',          importe:  489.00, mesesActivo: 0 },
    { cliente: 'cp189204 — septiembre. SIN NOMBRE en el sistema.', importe:  359.00, mesesActivo: 1 },
    { cliente: 'SMUM México — septiembre',                         importe:  209.00, mesesActivo: 0 },
    { cliente: 'Rentería Flow& Axis Consulting — septiembre. Aparecía como Hard Suspend en la semana 22 por el mismo importe.', importe: 209.00, mesesActivo: 0 },
    { cliente: 'Inmobiliaria Gess 2.17 — agosto',                  importe:  195.00, mesesActivo: 1 },
    { cliente: 'SGI MEXICO — agosto',                              importe:  195.00, mesesActivo: 0 },
    { cliente: 'Denver Medical — agosto',                          importe:  195.00, mesesActivo: 0 },
  ],
}


/* ── ARCHIVADO: era el corte vigente hasta que llegó el siguiente.
      NO se retecleó: se extrajo de git con
      `scripts/archiva-corte-churn.py` y se verificó byte a byte. */
const REPORTE_S24_OCT_2026: ChurnReporte = {
  id:      's24-octubre-2026',
  periodo: 'Semana 24 · Oct 2026',
  fecha:   '16/10/2026',
  notas:   'Gross Revenue Churn · Semana 24. Al 16 de octubre del 2026. Trae el cierre definitivo de '
         + 'septiembre —quién sigue activo y quién quedó en hard suspend— y el avance de octubre: '
         + 'Top 5 de cuentas Activas sobre una cartera activa de $408,857.69, las 11 cancelaciones '
         + 'del mes con su motivo, la cartera por cobrar por antigüedad de días pendientes y los '
         + 'downgrades por producto y por cliente. Vuelve a ser un corte semanal: el cierre de T3 no '
         + 'traía estos bloques. Próxima revisión: miércoles 21 de octubre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 21 de octubre.',

  grc: {
    /* Los tres meses del trimestre con su reexpresión. `anterior` guarda la
       cifra del corte previo para que la pantalla enseñe de dónde viene cada
       número: que un mes cerrado cambie no es un error, son los pagos que
       entran tarde. [[regla-churn-mes-vencido]] */
    evolucion: [
      { mes: 'Julio',      pct: 1.9 },
      { mes: 'Agosto',     pct: 2.1, anterior: 2.3 },
      { mes: 'Septiembre', pct: 2.6, anterior: 6.9 },
    ],
    acumulado: 19.5,
    anterior:  23.7,
    /* El acumulado vuelve a ser el DEL AÑO —19.5%, reexpresado desde el 23.7%
       de la semana 22— y no el del trimestre como el 2.39% del corte de T3. La
       misma casilla significó dos cosas en dos cortes seguidos; sin rótulo se
       leería como un salto del 2.39% al 19.5%. [[churn-analisis-data]] */
    acumuladoEtiqueta: '2026 acumulado hasta septiembre · NO DEFINITIVO',
    notaClave:
      'Cierre de septiembre y avance de octubre. Septiembre cierra en 2.6%, reexpresado desde el '
      + '6.9% de la semana 22, y el acumulado del año baja de 23.7% a 19.5%. LAS DOS CIFRAS SIGUEN '
      + 'MARCADAS COMO NO DEFINITIVAS por el propio reporte. En octubre van $35,127.00 en once '
      + 'cancelaciones y $51,042.30 de cartera por cobrar en 45 clientes, con el grueso '
      + '—$38,671.30 en 27 clientes— en el tramo de 8 a 15 días. La cartera activa del mes es de '
      + '$408,857.69.',
    notaEspecial:
      '🔵 SEPTIEMBRE BAJA OTRA VEZ: 6.9% → 2.6%. Es la CUARTA lectura del mismo mes — 23.6% el 22 de '
      + 'septiembre, 6.9% el 29, 3.14% en el cierre de trimestre y 2.6% ahora. Cada corte lo afina a '
      + 'la baja conforme entran los pagos, que es exactamente lo que este módulo lleva cuatro '
      + 'cortes advirtiendo: el mes vivo mide retraso de cobranza, no bajas. Quien reportó el 23.6% '
      + 'como resultado de septiembre publicó un número NUEVE VECES mayor que el que hoy se '
      + 'sostiene. Ojo con la flecha del correo: su «antes» es el 6.9% de la semana 22, no el 3.14% '
      + 'del cierre de T3, así que la caída real de este corte es de 3.14% a 2.6%. '
      + '📌 EL ACUMULADO DEL AÑO VUELVE A TENER CIFRA: 19.5%, reexpresado desde el 23.7% de la '
      + 'semana 22. El cierre de T3 lo había dejado vencido y sin sustituto —y no se inventó uno—; '
      + 'este corte lo repone y lo marca NO DEFINITIVO. '
      + '🔻 LAS ONCE CANCELACIONES DE OCTUBRE SUMAN $35,127.00 Y DOS SON EL 73.4%: Jason de México '
      + '($17,225.00, 43 meses) y KOMBITEC ($8,539.00, 73 meses), las dos por MIGRACIÓN A OTRO '
      + 'PROVEEDOR. Es el motivo más caro del mes con diferencia —$26,253.00 de los $35,127.00— y '
      + 'las otras nueve juntas suman $8,874.00. Cuatro cuentas se fueron por «cambios '
      + 'organizacionales internos», dos por poco uso, una por precio y una sin comentarios. '
      + '⏱️ TRES DE LAS ONCE SE FUERON CON MENOS DE UN AÑO: FOBE con 1 MES ($519.00), Avezado '
      + 'Abogados con 8 ($489.00) y ENCAMINO Chat con 11 ($1,750.00). En el otro extremo, TP DIGITAL '
      + 'se va tras 105 MESES —casi nueve años— por cambios organizacionales internos. '
      + '💰 LA CARTERA POR COBRAR ES JOVEN: $38,671.30 de los $51,042.30 (el 75.8%) lleva entre 8 y '
      + '15 días y son 27 de los 45 clientes; sólo $3,505.00 en 3 clientes pasa de 30 días. Eso es '
      + 'cobranza reciente y se recupera con pagos, no cartera perdida. Los tramos «por vencer» y '
      + '«1 a 7 días» vienen en CERO con CERO clientes: esta vez el cero está medido, no es un hueco. '
      + '🏆 TOP 5 DE CUENTAS ACTIVAS DE OCTUBRE, sobre una cartera activa total de $408,857.69: '
      + 'Blueservices $24,616.03 (43 meses) · Azyco Guadalajara $22,984.00 (25) · Gas Economico '
      + 'Metropolitano $18,659.00 (43) · VAEO $15,995.52 (5) · FabricAir Latin America $15,186.41 '
      + '(68). Los cinco suman $97,440.96, el 23.8%: los otros $311,416.73 —el 76.2%— no tienen '
      + 'nombre en el corte y tampoco dice cuántas cuentas son. Esto va aquí, en la nota, y NO en el '
      + 'bloque de «Pendiente de Facturar» como en los cortes de las semanas 20 a 22: la cartera '
      + 'activa es lo que SÍ factura, no dinero en riesgo, y sumarla al impacto del mes daba un '
      + '«MRR en riesgo» de $408,857.69 que es falso. '
      + '🟢 UNA CUENTA SIGUE ACTIVA Y NO ES CHURN: Colegio NWL - Corregidora, $1,392.00, 64 meses, '
      + 'última factura de agosto y 54 días pendientes de pago desde el corte del 23 de agosto. El '
      + 'reporte la publica aparte, fuera del hard suspend, precisamente para que no se cuente como '
      + 'baja. No está en el Top 5 de activos ni en los suspendidos de esta pantalla. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas con '
      + '`scripts/concilia-churn-s24.py`. Queda registrado de nuestra parte y no corrige ninguna '
      + 'cifra publicada. '
      + '① EL HARD SUSPEND DE SEPTIEMBRE NO CUADRA. Las cuatro cuentas listadas suman $16,379.98 y '
      + 'el correo declara un total de $12,371.00: $4,008.98 de diferencia. Quitando «Hoteles y '
      + 'Servicios» —el caso que el propio corte pone en duda— tampoco cuadra, porque las otras tres '
      + 'suman $5,433.00: el total declarado no lo está excluyendo. Esta pantalla publica LAS CUATRO '
      + 'FILAS, que es el dato verificable; antes de citar los $12,371.00 hay que preguntarlo. '
      + '② «HOTELES Y SERVICIOS» CAMBIA DE ESTADO ENTRE CORTES, Y NOSOTROS TENEMOS EL DATO ANTERIOR. '
      + 'El cierre de T3 lo publicó como la TERCERA mayor cancelación del trimestre: $10,946.98, 2 '
      + 'meses activo, baja en septiembre, con $32,742.00 de acumulado histórico. Éste lo reporta en '
      + 'hard suspend —servicio activo con restricciones— y pregunta abiertamente si debe seguir '
      + 'contándose en la cartera por cobrar. Es el mismo patrón de INBROTEK en la semana 22: un '
      + 'cliente clasificado de dos formas en la misma familia de reportes. Nuestra respuesta, por '
      + 'la regla de la casa: mientras no haya baja autorizada no es churn, y un servicio activo con '
      + 'restricciones es cartera por cobrar, no pérdida. [[feedback-conciliacion-churn]] '
      + '③ EL TOP 5 DE ACTIVOS DEJA FUERA EL 76.2% DE LA CARTERA. Los cinco suman $97,440.96 de los '
      + '$408,857.69: $311,416.73 no se desglosan y el corte tampoco dice cuántas cuentas son. Por '
      + 'eso el Top 5 se publica en esta nota, con el porcentaje que deja fuera a la vista, y no '
      + 'como tabla con total propio: una tabla que enseña el 23.8% y un total del 100% se lee como '
      + 'si fuera la cartera entera. [[feedback-tablas-deben-cerrar]] '
      + '④ LAS DOS TABLAS DE DOWNGRADE NO SE SUMAN, y el corte lo avisa. El impacto por producto es '
      + 'BRUTO ($32,187.97) y el total neto es $31,620.33: la diferencia son los upsells dentro de la '
      + 'misma cuenta, como TUNALI TEC, que quita DiD Nacional y Min VyC pero añade Agente CP Chat. '
      + 'Mismo aviso que en los dos cortes anteriores. '
      + '⑤ EL TOP 4 DE DOWNGRADES CUBRE EL 59.2% del total neto: $18,717.97 de $31,620.33 sobre 10 '
      + 'casos. Los otros $12,902.36 —el 40.8%— no se desglosan en este corte. '
      + '⑥ PORTALIA ES EL MAYOR DOWNGRADE DEL MES con $9,754.97, el 30.9% de todo el ingreso perdido '
      + 'por reducción, y el movimiento es doble: quita Extension VyC y además recorta el paquete de '
      + 'minutos de Voicebot de $3,000 a $1,000. Dos decisiones sobre la misma cuenta en el mismo mes. '
      + '⑦ LO QUE SÍ CUADRA, al centavo: las once cancelaciones contra su total ($35,127.00); los '
      + 'cinco tramos de cartera contra el suyo ($51,042.30) y sus 45 clientes; y el Top 4 de '
      + 'downgrades contra la «sumatoria a detalle» ($18,717.97). '
      + '⑧ LOS PORCENTAJES DE CHURN NO SE PUEDEN RECONSTRUIR: el correo no publica la base de MRR de '
      + 'cada mes, así que 1.9%, 2.1% y 2.6% se citan como vienen del reporte y no se verifican '
      + 'dividiendo, a diferencia del cierre de T3, que sí traía las bases. '
      + '[[feedback-metricas-derivadas-origen]]',
  },

  /* ── CARTERA POR COBRAR ─────────────────────────────────────────────────
     Hard suspend arrastrado de septiembre + soft suspend nuevo de octubre, por
     antigüedad de días pendientes de pago. 45 clientes, $51,042.30 ✓
     Esto es lo que de verdad está pendiente de cobro, y por eso ocupa el
     bloque que la pantalla rotula «Pendiente de Facturar». El corte NO da
     detalle por cliente de este bloque: sólo los cinco tramos. */
  pendientesTotalReal:   51042.30,
  pendientesCuentasReal: 45,
  pendientes: [
    { cliente: '8 a 15 días vencido — 27 clientes. El 75.8% de la cartera por cobrar: cobranza reciente, se recupera con pagos.', monto: 38671.30, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '16 a 30 días vencido — 15 clientes. El tramo donde la conversación de valor todavía llega antes del corte.',       monto:  8866.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: 'Más de 30 días vencido — 3 clientes. El único tramo que ya es cartera vencida de verdad.',                         monto:  3505.00, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: 'Por vencer y de 1 a 7 días — 0 clientes, $0.00. El corte los reporta en CERO con cero clientes: es un cero medido, no un bloque que falte.', monto: 0, mesesActivo: 0, ultimaFactura: '—' },
  ],

  antiguedadSaldos: [
    { rango: 'Por vencer',           monto:     0.00 },
    { rango: '1 – 7 días vencido',   monto:     0.00 },
    { rango: '8 – 15 días vencido',  monto: 38671.30 },
    { rango: '16 – 30 días vencido', monto:  8866.00 },
    { rango: 'Más de 30 días',       monto:  3505.00 },
  ],

  /* ── LAS 11 CANCELACIONES DE OCTUBRE ────────────────────────────────────
     Suman $35,127.00 ✓. `acumulado` va en 0 porque este corte NO publica el
     histórico facturado de cada cuenta: es «no reportado», no «cero», y así se
     dice en el texto de cada fila. [[feedback-cero-sin-medicion]] */
  cancelados: [
    { cliente: 'Jason de México — TOP, la mayor del mes. MIGRACIÓN A OTRO PROVEEDOR. Acumulado histórico no publicado por el corte.', mrr: 17225.00, mesesActivo: 43, acumulado: 0 },
    { cliente: 'KOMBITEC — más de seis años. MIGRACIÓN A OTRO PROVEEDOR. Con Jason son el 73.4% de las bajas del mes. Acumulado no publicado.', mrr: 8539.00, mesesActivo: 73, acumulado: 0 },
    { cliente: 'WhatsHome — Restructuración. Acumulado no publicado.', mrr: 3250.00, mesesActivo: 71, acumulado: 0 },
    { cliente: 'ENCAMINO Chat — Poco uso. Acumulado no publicado.', mrr: 1750.00, mesesActivo: 11, acumulado: 0 },
    { cliente: 'TP DIGITAL — 105 meses: casi nueve años, el cliente más antiguo que se va este mes. Cambios organizacionales internos. Acumulado no publicado.', mrr: 1300.00, mesesActivo: 105, acumulado: 0 },
    { cliente: 'LUNAH ECO-RESORTS — el corte dice «sin comentarios»: no registra motivo. Acumulado no publicado.', mrr: 588.00, mesesActivo: 51, acumulado: 0 },
    { cliente: 'FOBE — 1 MES ACTIVO, la salida más temprana del mes. Cambios organizacionales internos. Acumulado no publicado.', mrr: 519.00, mesesActivo: 1, acumulado: 0 },
    { cliente: 'Avezado Abogados Penales — 8 meses. Cambios organizacionales internos. Acumulado no publicado.', mrr: 489.00, mesesActivo: 8, acumulado: 0 },
    { cliente: 'Schimer — Poco uso. Acumulado no publicado.', mrr: 489.00, mesesActivo: 18, acumulado: 0 },
    { cliente: 'Cole Majzner arquitectos — PRECIO: la única del mes que se va por costo. Acumulado no publicado.', mrr: 489.00, mesesActivo: 40, acumulado: 0 },
    { cliente: 'Annova Logistics — Migración a otro proveedor. Acumulado no publicado.', mrr: 489.00, mesesActivo: 29, acumulado: 0 },
  ],

  /* ── DOWNGRADES ─────────────────────────────────────────────────────────
     Total NETO del mes $31,620.33 sobre 10 casos; el corte detalla los 4 de
     mayor importe ($18,717.97 ✓) y la última fila es el cubo de cierre. */
  downgradeTotalReal: 31620.33,
  downgradeCasosReal: 10,
  downgrades: [
    { cliente: 'Portalia — TOP', perdida: 9754.97, nota: 'El mayor del mes: el 30.9% de todo el ingreso perdido por reducción. Movimiento doble — quita Extension VyC y recorta el paquete de minutos de Voicebot de $3,000 a $1,000.' },
    { cliente: 'TUNALI TEC', perdida: 5404.00, nota: 'Quita DiD Nacional y paquete Min VyC, pero AÑADE Agente CP Chat. Es el caso que explica por qué la tabla de productos (bruta) no cuadra con el total neto.' },
    { cliente: 'Corporativo grupo funerario San Javier', perdida: 1959.00, nota: 'Quita el paquete Min VyC.' },
    { cliente: 'Grupo Guía', perdida: 1600.00, nota: 'Reduce DiD Nacional y paquete Min VyC.' },
    { cliente: '+ Resto de los downgrades de octubre', perdida: 12902.36, nota: '⚠ CUBO DE CIERRE. Son 10 los casos de downgrade del mes y el corte sólo detalla los 4 de mayor importe. Sin esta fila el Top 4 se leería como todo el downgrade de octubre y dejaría fuera el 40.8% del total neto.' },
  ],

  /* Impacto BRUTO por producto: lo que se quitó o redujo en cada caso, SIN
     netear los upsells de la misma cuenta. Suma $32,187.97 contra los
     $31,620.33 de pérdida neta y el propio corte advierte que no coinciden
     1:1. NO se suman las dos tablas. `vecesAfectado` sí viene en este corte. */
  downgradeArticulos: [
    { articulo: 'paquete Min VyC — $17,326.00',     vecesAfectado: 7, clientes: ['El artículo más golpeado del mes: 7 de los 10 casos.'] },
    { articulo: 'Extension VyC — $10,161.97',       vecesAfectado: 2, clientes: ['Sólo 2 casos pero el segundo importe del mes: Portalia se lleva la mayor parte.'] },
    { articulo: 'paquete Min Voicebot — $2,000.00', vecesAfectado: 1, clientes: ['Un solo caso: Portalia, de $3,000 a $1,000.'] },
    { articulo: 'DiD Nacional — $1,671.00',         vecesAfectado: 4, clientes: ['El segundo más repetido y el de menor importe por caso.'] },
    { articulo: 'paquete Min CE — $1,029.00',       vecesAfectado: 1, clientes: ['Un solo caso.'] },
  ],

  /* ── CIERRE DE SEPTIEMBRE · HARD SUSPEND ────────────────────────────────
     Las cuatro cuentas que quedaron en hard suspend —servicio activo con
     restricciones— y que el corte describe como «continúa sin entrar a la
     cartera». Van en `suspendidos`, que la pantalla rotula «Suspendidos /
     Inactivos en retención»: es exactamente lo que son.

     El total es la SUMA DE LAS FILAS ($16,379.98), no los $12,371.00 que
     declara el correo: ver la observación ① de la nota.

     Colegio NWL - Corregidora ($1,392.00, 64 meses, última factura de agosto,
     54 días pendientes) NO va aquí: el corte lo publica aparte como ACTIVO y
     meterlo en este bloque lo contaría como baja. Va dicho en la nota. */
  suspendidosTotalReal:   16379.98,
  suspendidosCuentasReal: 4,
  suspendidos: [
    { cliente: 'Hoteles y Servicios — HARD SUSPEND. ⚠ El cierre de T3 lo publicó como la TERCERA mayor cancelación del trimestre ($10,946.98, baja en septiembre, $32,742.00 de acumulado histórico) y aquí figura en hard suspend. El propio reporte pregunta si debe seguir contándose en la cartera por cobrar. Por la regla de la casa: sin baja autorizada no es churn. Corte al 29 ago 2026 · 48 días pendientes.', importe: 10946.98, mesesActivo: 2, estado: 'Suspendido' },
    { cliente: 'Skyhous — HARD SUSPEND. Corte al 05 sep 2026 · 41 días pendientes.',                                  importe: 2497.00, mesesActivo: 65, estado: 'Suspendido' },
    { cliente: 'Uno Suministros — HARD SUSPEND. 70 meses, la más antigua del bloque. Corte al 18 sep 2026 · 28 días.', importe: 1759.00, mesesActivo: 70, estado: 'Suspendido' },
    { cliente: 'Epinova Bio Labs — HARD SUSPEND. Corte al 26 sep 2026 · 20 días pendientes.',                          importe: 1177.00, mesesActivo:  9, estado: 'Suspendido' },
  ],
}


/* ── ARCHIVADO: era el corte vigente hasta que llegó el siguiente.
      NO se retecleó: se extrajo de git con
      `scripts/archiva-corte-churn.py` y se verificó byte a byte. */
const REPORTE_S25_OCT_2026: ChurnReporte = {
  id:      's25-octubre-2026',
  periodo: 'Semana 25 · Oct 2026',
  fecha:   '21/10/2026',
  notas:   'Gross Revenue Churn · Semana 25. Al 21 de octubre del 2026. Avance del mes: Top 5 de '
         + 'clientes activos sobre una cartera de $128,640.37 en 26 clientes, resumen de soft y hard '
         + 'suspend, las 2 cancelaciones del mes, la cartera por cobrar por antigüedad —173 clientes, '
         + '$272,319.60— y los 4 downgrades. Octubre marca 22.1% pero es MES CORRIENDO y NO '
         + 'DEFINITIVO: es la primera lectura, la misma clase de cifra que en septiembre arrancó en '
         + '23.6% y acabó en 2.5%. Próxima revisión: miércoles 28 de octubre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 28 de octubre.',

  grc: {
    /* El corte ya no publica julio: arranca en agosto. Se respeta lo que trae
       en vez de arrastrar el mes de un corte anterior. */
    evolucion: [
      { mes: 'Agosto',     pct: 2.1 },
      { mes: 'Septiembre', pct: 2.5, anterior: 2.6 },
      { mes: 'Octubre',    pct: 22.1 },
    ],
    acumulado: 41.6,
    anterior:  19.5,
    acumuladoEtiqueta: '2026 acumulado hasta octubre · NO DEFINITIVO',
    notaClave:
      'Avance de octubre. El mes marca 22.1% y el acumulado del año salta de 19.5% a 41.6%, LAS DOS '
      + 'MARCADAS NO DEFINITIVAS por el propio reporte. Octubre lleva $6,708.50 en dos cancelaciones '
      + 'y $6,038.00 en cuatro downgrades, pero la cifra gorda está en la cartera por cobrar: '
      + '$272,319.60 repartidos en 173 clientes, con $177,513.29 —el 65.2%— a menos de una semana de '
      + 'vencer. La cartera activa del mes son $128,640.37 en 26 clientes.',
    notaEspecial:
      '🚨 EL 22.1% DE OCTUBRE ES LA PRIMERA LECTURA DE UN MES VIVO, Y ESA CIFRA SE DESINFLA. '
      + 'Septiembre recorrió 23.6% → 6.9% → 3.14% → 2.6% → 2.5%: de la primera lectura a la que hoy '
      + 'se sostiene hay una DÉCIMA PARTE. Octubre arranca en 22.1%, que es casi exactamente el '
      + '23.6% con el que arrancó septiembre. Quien publique «octubre cerró en 22.1%» va a repetir, '
      + 'palabra por palabra, el error que este módulo lleva cinco cortes documentando: el mes vivo '
      + 'NO mide bajas, mide retraso de cobranza. Se recupera con pagos. [[regla-churn-mes-vencido]] '
      + '📌 EL ACUMULADO DEL AÑO SALE DE SUMAR, no de ponderar: 19.5% (hasta septiembre, semana 24) + '
      + '22.1% (octubre) = 41.6%, que es exactamente lo declarado. O sea que el acumulado hereda '
      + 'ENTERO el 22.1% no definitivo, y se va a desinflar con él. Un detalle que además no casa: '
      + 'septiembre se reexpresó de 2.6% a 2.5%, así que la base debería ser 19.4% y no 19.5%. '
      + '🔻 LAS CANCELACIONES CAEN A DOS, $6,708.50 — un 80.9% menos que los $35,127.00 de la semana '
      + '24. Grupo Turístico Rumbo ($4,349.00, 6 meses) se va porque «no lo usaba», que es la única '
      + 'de las dos sobre la que se podía haber hecho algo: seis meses pagando sin usar el producto '
      + 'es una cuenta que pedía una llamada. PSI División Latinoamérica ($2,359.50, 21 meses) cierra '
      + 'proyecto, que no es un fallo de servicio. '
      + '🏆 TOP 5 DE CLIENTES ACTIVOS, sobre una cartera de $128,640.37 en 26 clientes: HomiRent '
      + '$11,998.00 (52 meses) · MKG $11,283.03 (157) · CS7 $11,073.00 (33) · LI FINANCIERA '
      + '$9,104.00 (11) · SIMAGASMEX $8,272.00 (9). Los cinco suman $51,730.03, el 40.2%: los otros '
      + '$76,910.34 en 21 clientes no se desglosan. Va aquí, en la nota, y NO en el bloque de '
      + '«Pendiente de Facturar»: la cartera activa es lo que SÍ factura, no dinero en riesgo. '
      + '⏳ MKG LLEVA 157 MESES ACTIVO — trece años y un mes. Es, con diferencia, la relación más '
      + 'larga de todo el corte; la siguiente son los 52 de HomiRent. '
      + '💰 LA CARTERA POR COBRAR ES CASI TODA RECIENTE: $177,513.29 en 107 clientes lleva entre 1 y '
      + '7 días, el 65.2% del total; $74,008.03 en 51 clientes va de 8 a 15; y $20,798.28 en 15 '
      + 'clientes de 16 a 30. **Más de 30 días: CERO, con cero clientes.** Eso último es una buena '
      + 'noticia que conviene leer bien — es el tramo que históricamente antecede a la suspensión. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas y contra '
      + 'el de hace cinco días, con `scripts/concilia-churn-s25.py`. No corrige ninguna cifra '
      + 'publicada. '
      + '① LA CARTERA ACTIVA SE DERRUMBA UN 68.5% EN CINCO DÍAS: de $408,857.69 (semana 24) a '
      + '$128,640.37. Y no es que se hayan ido los grandes — los CINCO del Top cambian ENTEROS: '
      + 'Blueservices, Azyco Guadalajara, Gas Economico Metropolitano, VAEO y FabricAir no aparecen, '
      + 'y en su lugar hay cinco nombres nuevos. Ninguna de las dos cancelaciones del mes explica '
      + 'nada de eso: suman $6,708.50. O cambió el criterio de qué cuenta como «activo», o el corte '
      + 'mira otra población. HAY QUE PREGUNTARLO ANTES DE CITAR LA CIFRA. '
      + '② LA CARTERA POR COBRAR ES MÁS DEL DOBLE QUE LA ACTIVA — $272,319.60 contra $128,640.37 — y '
      + 'eso es al revés de como se ha visto en todos los cortes anteriores. Sube un 433.5% (de '
      + '$51,042.30) y los clientes pasan de 45 a 173. Un salto así en cinco días no es cobranza '
      + 'normal: o entró una facturación masiva, o la tabla cambió de alcance. Misma pregunta. '
      + '③ ESTE CORTE NO TRAE TRAMO «POR VENCER». El anterior lo publicaba en cero; éste lo omite. '
      + 'Como el primer tramo es «1 a 7 días», lo que la tabla reporta está TODO vencido. No se '
      + 'inventa un cero donde no hay casilla. [[feedback-cero-sin-medicion]] '
      + '④ LOS CUATRO DOWNGRADES SON LA LISTA COMPLETA, no un top: el corte declara 4 clientes y '
      + 'detalla 4, y suman los $6,038.00. Es la primera vez en cinco cortes que esta tabla cierra '
      + 'sin cubo de «otros». '
      + '⑤ EL MARCADO «top» DEL DOWNGRADE VA POR PORCENTAJE, NO POR DINERO. Señala a Proseso '
      + 'Consultores (81%, $2,210.00), pero el que más ingreso se lleva es Hotel Real de Minas '
      + '(48%, $2,490.00). Las dos lecturas valen y miden cosas distintas; citar una por la otra no. '
      + '⑥ JULIO DESAPARECE DE LA SERIE. Los cortes anteriores abrían en julio (1.9%); éste arranca '
      + 'en agosto. No se arrastra el mes que falta desde el corte viejo: se publica la serie que '
      + 'trae el reporte y se dice que son tres meses. '
      + '⑦ LO QUE SÍ CUADRA, al centavo: las dos cancelaciones contra su total ($6,708.50); soft + '
      + 'hard suspend contra el suyo ($26,949.28) y sus 16 clientes; los cuatro tramos de cartera '
      + 'contra $272,319.60 y sus 173 clientes; y los cuatro downgrades contra $6,038.00. '
      + '⑧ LOS PORCENTAJES NO SE PUEDEN RECONSTRUIR: el correo no publica la base de MRR de cada mes, '
      + 'así que 2.1%, 2.5% y 22.1% se citan como vienen y no se verifican dividiendo. '
      + '[[feedback-metricas-derivadas-origen]]',
  },

  /* ── CARTERA POR COBRAR ─────────────────────────────────────────────────
     Lo que de verdad está pendiente de cobro, y por eso ocupa el bloque que la
     pantalla rotula «Pendiente de Facturar». El corte no da detalle por
     cliente: sólo los cuatro tramos. 173 clientes, $272,319.60 ✓ */
  pendientesTotalReal:   272319.60,
  pendientesCuentasReal: 173,
  pendientes: [
    { cliente: '1 a 7 días vencido — 107 clientes. El 65.2% de la cartera por cobrar, y lo más reciente que hay: esto es cobranza del día, no deuda.', monto: 177513.29, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '8 a 15 días vencido — 51 clientes.',                                                                                                   monto:  74008.03, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: '16 a 30 días vencido — 15 clientes. El último tramo antes del que antecede a la suspensión.',                                           monto:  20798.28, mesesActivo: 0, ultimaFactura: '—' },
    { cliente: 'Más de 30 días — 0 clientes, $0.00. CERO MEDIDO, y es la buena noticia del corte: es el tramo que históricamente antecede a la suspensión.', monto: 0, mesesActivo: 0, ultimaFactura: '—' },
  ],

  /* El corte NO trae tramo «Por vencer» —el anterior lo publicaba en cero— así
     que la tabla entera es saldo vencido. No se añade una casilla que el
     reporte no tiene. */
  antiguedadSaldos: [
    { rango: '1 – 7 días vencido',   monto: 177513.29 },
    { rango: '8 – 15 días vencido',  monto:  74008.03 },
    { rango: '16 – 30 días vencido', monto:  20798.28 },
    { rango: 'Más de 30 días',       monto:      0.00 },
  ],

  /* ── LAS 2 CANCELACIONES DE OCTUBRE ─────────────────────────────────────
     Suman $6,708.50 ✓. `acumulado` va en 0 porque el corte NO publica el
     histórico facturado: es «no reportado», no «cero», y la pantalla lo
     escribe con esas palabras. [[feedback-cero-sin-medicion]] */
  cancelados: [
    { cliente: 'Grupo Turístico Rumbo S de RL de CV — «comenta que no lo usaba». Seis meses pagando sin usar el producto: de las dos, es la única sobre la que se podía haber hecho algo. Acumulado histórico no publicado por el corte.', mrr: 4349.00, mesesActivo: 6, acumulado: 0 },
    { cliente: 'PSI División Latinoamérica — cierre de proyecto, que no es un fallo de servicio: el contrato tenía fin. Acumulado no publicado.', mrr: 2359.50, mesesActivo: 21, acumulado: 0 },
  ],

  /* ── DOWNGRADES ─────────────────────────────────────────────────────────
     LISTA COMPLETA: el corte declara 4 clientes y detalla 4. Primera vez en
     cinco cortes que esta tabla cierra sin cubo de «otros». */
  downgradeTotalReal: 6038.00,
  downgradeCasosReal: 4,
  downgrades: [
    { cliente: 'Proseso Consultores — TOP por porcentaje', perdida: 2210.00, nota: '81% de reducción, la mayor en proporción del mes. El corte lo marca como «top», pero por PORCENTAJE: en dinero el mayor es Hotel Real de Minas.' },
    { cliente: 'Hotel Real de Minas San Miguel de Allende', perdida: 2490.00, nota: '48% de reducción y el MAYOR IMPORTE del mes — se lleva el 41.2% de todo el ingreso perdido por downgrade.' },
    { cliente: 'Huellitas Resort GDL', perdida: 799.00, nota: '33% de reducción, la más suave de las cuatro.' },
    { cliente: 'Sparkgam', perdida: 539.00, nota: '52% de reducción. El importe más pequeño del mes.' },
  ],

  /* ── SOFT / HARD SUSPEND DE OCTUBRE ─────────────────────────────────────
     16 clientes, $26,949.28 ✓. El corte da los dos estatus agregados, con su
     promedio de días pendientes; no desglosa por cliente. */
  suspendidosTotalReal:   26949.28,
  suspendidosCuentasReal: 16,
  suspendidos: [
    { cliente: 'Hard Suspend — 12 clientes · 17.6 días promedio pendientes de pago. Servicio activo con restricciones: sin baja autorizada NO es churn.', importe: 16311.28, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Soft Suspend — 4 clientes · 13.0 días promedio pendientes de pago.',                                                                      importe: 10638.00, mesesActivo: 0, estado: 'Suspendido' },
  ],
}


export default function ChurnPage() {
  const [userReportes, setUserReportes] = useState<ChurnReporte[]>([])
  /* LA SELECCIÓN POR DEFECTO SE DERIVA DEL CORTE VIGENTE, no se escribe.
     Estaba fija en 's21-septiembre-2026' y nadie la movió al rotar: con el
     S22 ya publicado, el módulo seguía ABRIENDO en la Semana 21, un corte de
     tres semanas antes. El `?? REPORTE_…` de abajo no lo salvaba, porque
     `find` encontraba el S21 y el fallback nunca entraba. Atada a la
     constante, la próxima rotación sólo tiene que cambiar el import. */
  const [selectedId,   setSelectedId]   = useState<string>(REPORTE_S26_OCT_2026.id)
  const [tab,          setTab]          = useState<Tab>('resumen')
  const [showForm,     setShowForm]     = useState(false)
  const [acumCancelSort, setAcumCancelSort] = useState<{ col: 'cliente' | 'mrr' | 'mesesActivo' | 'acumulado' | 'periodo'; dir: 'asc' | 'desc' }>({ col: 'mrr', dir: 'desc' })
  const [acumDgSort,     setAcumDgSort]     = useState<{ col: 'cliente' | 'perdida' | 'periodo' | 'nota'; dir: 'asc' | 'desc' }>({ col: 'perdida', dir: 'desc' })
  const [delConfirm,   setDelConfirm]   = useState<string | null>(null)
  const [aaaOpenMes,     setAaaOpenMes]     = useState<Record<string, boolean>>({})

  useEffect(() => { setUserReportes(loadReportes()) }, [])

  const BASE_IDS = ['abril-2026', 's4-mayo-2026', 's5-mayo-2026', 's1-junio-2026', 's2-junio-2026', 's3-junio-2026', 's4-junio-2026', 'cierre-junio-2026', 's1-julio-2026', 's2-julio-2026']
  const allReportes: ChurnReporte[] = [REPORTE_ABRIL_2026, REPORTE_S4_MAYO_2026, REPORTE_S5_MAYO_2026, REPORTE_S1_JUNIO_2026, REPORTE_S2_JUNIO_2026, REPORTE_S3_JUNIO_2026, REPORTE_S4_JUNIO_2026, REPORTE_CIERRE_JUNIO_2026, REPORTE_S1_JULIO_2026, REPORTE_S2_JULIO_2026, REPORTE_S3_JULIO_2026, REPORTE_S4_JULIO_2026, REPORTE_S2_AGOSTO_2026, REPORTE_S3_AGOSTO_2026, REPORTE_S18_AGOSTO_2026, REPORTE_S19_SEPTIEMBRE_2026, REPORTE_S20_SEPTIEMBRE_2026, REPORTE_S21_SEPTIEMBRE_2026, REPORTE_S22_SEPTIEMBRE_2026, REPORTE_S23_T3_2026, REPORTE_S24_OCT_2026, REPORTE_S25_OCT_2026, REPORTE_S26_OCT_2026, ...userReportes]
  const reporte = allReportes.find(r => r.id === selectedId) ?? REPORTE_S26_OCT_2026

  const { pendientes, cancelados, downgrades, suspendidos, grc } = reporte
  const totalPendiente  = reporte.pendientesTotalReal   ?? pendientes.reduce((s, c) => s + (Number(c.monto)   || 0), 0)
  /* UN CERO SIN MEDICIÓN NO ES UN CERO.
     El cierre de trimestre (S23) no reporta cartera por cobrar: no trae Top 10
     de Activo ni total. Sin esto la tarjeta diría «Pendiente de Facturar $0 ·
     0 cuentas», que se lee como que no hay nada por cobrar — y lo que pasa es
     que este corte no lo mide. Ver [[feedback-cero-sin-medicion]]. */
  const pendienteNoReportado =
    reporte.pendientesTotalReal === undefined && pendientes.length === 0
  const totalCancelados = cancelados.reduce((s, c) => s + (Number(c.mrr)     || 0), 0)
  /* EL TOTAL DECLARADO MANDA SOBRE LA SUMA DE LAS FILAS.
     Durante nueve cortes esta línea era `downgrades.reduce(...)` y no consultaba
     `downgradeTotalReal`, así que cuando el correo detallaba un TOP y declaraba
     un total mayor, la pantalla publicaba el top como si fuera el mes entero:
     $177,602.61 subdeclarados en total, y el cierre de T3 publicaba $22,399.83
     de los $130,627.59 que dice el corte — un 83% de menos. Medido con
     `scripts/mide-total-downgrades.py`. [[feedback-tablas-deben-cerrar]] */
  const sumaFilasDowngrade = downgrades.reduce((s, c) => s + (Number(c.perdida) || 0), 0)
  const totalDowngrades = reporte.downgradeTotalReal ?? sumaFilasDowngrade
  /* Lo que el corte declara y no desglosa. Se calcula aquí y se pinta como fila
     de cierre, en vez de teclearlo en los nueve bloques archivados: así cierra
     también el próximo corte que llegue con un top. */
  const restoDowngrade = Math.max(0, totalDowngrades - sumaFilasDowngrade)
  /* UN CERO SIN MEDICIÓN NO ES UN CERO — y «no significativos» tampoco.
     La semana 26 dice «no hay downgrades significativos en la semana»: es un
     juicio sobre la SEMANA mientras el resto del corte habla del MES, y el
     corte anterior reportaba 4 por $6,038.00 en ese mismo mes. Sin esto la
     tarjeta diría «$0.00 · 0 clientes», que se lee como que no hubo ninguno.
     [[feedback-cero-sin-medicion]] */
  const downgradeNoReportado =
    reporte.downgradeTotalReal === undefined && downgrades.length === 0
  const totalSuspendidos = reporte.suspendidosTotalReal ?? (suspendidos ?? []).reduce((s, c) => s + (Number(c.importe) || 0), 0)
  /* UN CUBO DE CIERRE NO ES UN CLIENTE.
     Las tablas parciales llevan una fila «+ Resto de…» para que el total
     cierre, y contar filas la contaba como cliente: la tarjeta decía «4
     clientes en riesgo» sobre 45, y «5 clientes con reducción» sobre un mes de
     10 casos. El conteo sale del dato declarado por el corte y, si no lo trae,
     de las filas SIN cubo. [[feedback-tablas-deben-cerrar]] */
  const nPendientes = reporte.pendientesCuentasReal ?? sinCubo(pendientes).length
  const nDowngrades = reporte.downgradeCasosReal    ?? sinCubo(downgrades).length
  const nCancelados = reporte.canceladosCasosReal   ?? sinCubo(cancelados).length
  /* Y SI EL CORTE SÓLO TRAE CUBO, EL CONTEO NO ES CERO: ES DESCONOCIDO.
     Filtrar cubos arregló los cortes que detallan un top, pero el cierre de
     agosto —cuya única fila es «+ 21 cuentas canceladas»— pasaba a «0 canc.»
     con $20,040 al lado. A esos cinco cortes se les declaró el conteo a mano
     (`scripts/mide-conteo-cancelados.py` los encontró y dice de dónde sale cada
     número); esto es la red para el PRÓXIMO que llegue sin declararlo.
     [[feedback-cero-sin-medicion]] */
  const nCanceladosDesconocido =
    reporte.canceladosCasosReal === undefined && cancelados.length > 0 && nCancelados === 0
  const etqCancelados = nCanceladosDesconocido ? 'n/d' : String(nCancelados)
  const TABS = buildTabs(reporte)

  const isAcumulado = selectedId === 'acumulado'

  // Secciones independientes de la barra de accesos. Cuando una está activa, el
  // Análisis DATA (selector de períodos + KPIs + su tab-bar) se oculta por
  // completo para que el contenido de la sección se despliegue solo, sin
  // mezclarse con datos de otro contexto.
  const SECCIONES_SUBMENU: Tab[] = ['aaa', 'conciliacion']
  const enSeccionSubmenu = SECCIONES_SUBMENU.includes(tab)

  /* Rango real del acumulado, derivado de los reportes cargados.
     Antes decía "Abr–Jul 2026" escrito a mano y ya iba dos meses atrasado: al
     cargar septiembre seguía anunciando julio. Ahora se mueve solo. */
  const rangoAcumulado = useMemo(() => {
    const MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const NOMBRE: Record<string, string> = {
      enero:'Ene', febrero:'Feb', marzo:'Mar', abril:'Abr', mayo:'May', junio:'Jun',
      julio:'Jul', agosto:'Ago', septiembre:'Sep', octubre:'Oct', noviembre:'Nov', diciembre:'Dic',
    }
    const vistos: string[] = []
    for (const r of allReportes) {
      const p = (r.periodo || '').toLowerCase()
      const hit = Object.keys(NOMBRE).find(k => p.includes(k)) ??
                  MES.find(m => p.includes(m.toLowerCase()))?.toLowerCase()
      const abrev = hit ? (NOMBRE[hit] ?? hit) : null
      if (abrev && !vistos.includes(abrev)) vistos.push(abrev)
    }
    if (!vistos.length) return ''
    const orden = vistos.slice().sort((a, b) => MES.indexOf(a) - MES.indexOf(b))
    const anios = Array.from(new Set(allReportes.map(r => (r.periodo.match(/20\d\d/) || [''])[0]).filter(Boolean)))
    const anio = anios.length === 1 ? anios[0] : `${anios[0]}–${anios[anios.length - 1]}`
    return orden.length === 1 ? `${orden[0]} ${anio}` : `${orden[0]}–${orden[orden.length - 1]} ${anio}`
  }, [allReportes])

  /* Filas que NO son un cliente sino el resumen de varias cuentas que el corte
     no desglosó ("+ 21 cuentas canceladas en agosto…"). Cuentan para el DINERO
     pero no para el número de clientes: mezclarlas hacía que el acumulado
     dijera "100 cancelaciones" cuando 5 de esas filas representan decenas de
     cuentas sin nombre. */
  const esFilaAgregada = (nombre: string) =>
    /^\s*\+|cuentas adicionales|no desglosa|cuentas canceladas en|^\d+\s+cuentas|^(Hard|Soft) Suspend —/i.test(nombre || '')

  const acumuladoCancelados = useMemo<Array<ChurnCancelado & { periodo: string }>>(() => {
    const items: Array<ChurnCancelado & { periodo: string }> = []
    for (const r of allReportes) {
      for (const c of r.cancelados) {
        items.push({ ...c, periodo: r.periodo })
      }
    }
    return items.sort((a, b) => Number(b.mrr) - Number(a.mrr))
  }, [allReportes])

  const acumuladoDowngrades = useMemo<Array<ChurnDowngrade & { periodo: string }>>(() => {
    const items: Array<ChurnDowngrade & { periodo: string }> = []
    for (const r of allReportes) {
      for (const d of r.downgrades) {
        items.push({ ...d, periodo: r.periodo })
      }
    }
    return items.sort((a, b) => Number(b.perdida) - Number(a.perdida))
  }, [allReportes])

  const acumCancelAgregados = useMemo(() =>
    acumuladoCancelados.filter(c => esFilaAgregada(c.cliente)).length, [acumuladoCancelados])
  const acumCancelNombrados = useMemo(() =>
    acumuladoCancelados.length - acumCancelAgregados, [acumuladoCancelados, acumCancelAgregados])

  const totalAcumCancelados = useMemo(() =>
    acumuladoCancelados.reduce((s, c) => s + (Number(c.mrr) || 0), 0),
    [acumuladoCancelados])

  const totalAcumDowngrades = useMemo(() =>
    acumuladoDowngrades.reduce((s, d) => s + (Number(d.perdida) || 0), 0),
    [acumuladoDowngrades])

  const sortedAcumCancelados = useMemo(() => {
    const arr = [...acumuladoCancelados]
    const { col, dir } = acumCancelSort
    arr.sort((a, b) => {
      let va: string | number, vb: string | number
      if (col === 'mrr')        { va = Number(a.mrr);        vb = Number(b.mrr) }
      else if (col === 'mesesActivo') { va = a.mesesActivo;  vb = b.mesesActivo }
      else if (col === 'acumulado')   { va = Number(a.acumulado); vb = Number(b.acumulado) }
      else if (col === 'periodo')     { va = a.periodo;       vb = b.periodo }
      else                            { va = a.cliente;       vb = b.cliente }
      if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return dir === 'asc' ? va - (vb as number) : (vb as number) - va
    })
    return arr
  }, [acumuladoCancelados, acumCancelSort])

  const sortedAcumDowngrades = useMemo(() => {
    const arr = [...acumuladoDowngrades]
    const { col, dir } = acumDgSort
    arr.sort((a, b) => {
      let va: string | number, vb: string | number
      if (col === 'perdida')  { va = Number(a.perdida); vb = Number(b.perdida) }
      else if (col === 'periodo') { va = a.periodo;     vb = b.periodo }
      else if (col === 'nota')    { va = a.nota;        vb = b.nota }
      else                        { va = a.cliente;     vb = b.cliente }
      if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return dir === 'asc' ? va - (vb as number) : (vb as number) - va
    })
    return arr
  }, [acumuladoDowngrades, acumDgSort])

  const ACUM_TABS = [
    { id: 'cancelados' as Tab, label: `🔴 Cancelados (${acumuladoCancelados.length})`, color: RED_TX   },
    { id: 'downgrades' as Tab, label: `🟡 Downgrades (${acumuladoDowngrades.length})`, color: AMBER_TX },
  ]

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
    if (selectedId === id) setSelectedId(REPORTE_S26_OCT_2026.id)
    setDelConfirm(null)
  }

  /* Cambio de período → reset tab */
  const selectReporte = (id: string) => { setSelectedId(id); setTab('resumen') }

  return (
    <div className="cp-doc cp-churn flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Churn"
        subtitle="Análisis de pérdida de clientes · DATA → Dirección de Satisfacción al Cliente"
        actions={
          /* Los accesos viven aquí y ya no en una barra lateral: esa columna
             ocupaba 184px fijos en todas las pantallas de Churn, y las tablas
             de cancelados y downgrades los necesitan. `flex-wrap` para que en
             pantalla angosta bajen de renglón en vez de aplastar el título. */
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AccesoBtn
              active={!enSeccionSubmenu}
              onClick={() => setTab('resumen')}
              icon={<FileBarChart2 size={14} />}
              label="Análisis DATA"
              bg="#10355D"
              badge={allReportes.length}
            />
            <AccesoBtn
              active={tab === 'aaa'}
              onClick={() => setTab('aaa')}
              icon={<span style={{ fontSize: 13, lineHeight: 1 }}>⭐</span>}
              label="GRC · AAA 2026"
              bg="#10355D"
            />
            <AccesoBtn
              active={tab === 'conciliacion'}
              onClick={() => setTab('conciliacion')}
              icon={<RefreshCw size={14} />}
              label="Conciliación"
              bg="#0f766e"
            />
            <AccesoBtn
              active={false}
              href="https://marketingplus.zoho.com/reports/open-view/245443000007094051"
              icon={<BarChart3 size={14} />}
              label="Gross Revenue Churn"
              bg="#082742"
            />
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">

        {/* ── Columna principal ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── ANÁLISIS DATA — selector de períodos + KPIs + tabs.
             Solo visible cuando NO hay una sección del submenú activa. ── */}
      {!enSeccionSubmenu && (
      <>
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
                style={{ background: '#10355D' }}
              >
                <Plus size={13} /> Nuevo Análisis DATA
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-1 p-2">
            {/* El botón ACUMULADO se retiró por instrucción de dirección (22 sep
                2026): la concentración de Churn confirmado y Downgrade vive
                ahora en GRC AAA 2026, acotada a AAA y AA y con el asesor
                responsable de cada cuenta.

                `selectedId` ya no puede valer 'acumulado', así que `isAcumulado`
                es siempre false y las ramas que dependen de él quedan sin
                alcanzar. Se dejan en pie a propósito: borrarlas es una poda de
                ~200 líneas en un archivo de 3,000 sin compilador local que la
                respalde, y eso es otro cambio, no éste. */}

            {[...allReportes].reverse().map(r => {
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
                      ? { background: '#10355D10', border: '1px solid #10355D40' }
                      : { border: '1px solid transparent' }
                    }
                  >
                    <p className="text-xs font-semibold text-gray-800 truncate w-full"
                      style={{ color: active ? '#10355D' : undefined }}>
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
                        style={{ background: `${ORANGE}18`, color: ORANGE_TX }}>
                        {r.pendientesCuentasReal ?? sinCubo(r.pendientes).length} pend.
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${RED}18`, color: RED_TX }}>
                        {etiquetaCancelados(r)} canc.
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${AMBER}18`, color: AMBER_TX }}>
                        {downgradesSinMedir(r)
                          ? 'dg. s/d'
                          : `${r.downgradeCasosReal ?? sinCubo(r.downgrades).length} dg.`}
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
      {isAcumulado ? (
        <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard icon={XCircle}        label="MRR Cancelado · Acumulado"    value={fmt(totalAcumCancelados)}
            sub={`${acumCancelNombrados} clientes${acumCancelAgregados ? ` + ${acumCancelAgregados} resúmenes sin desglosar` : ''} · ${rangoAcumulado}`} color={RED}    />
          <KpiCard icon={ArrowDownRight} label="Downgrades · Acumulado"       value={fmt(totalAcumDowngrades)}
            sub={`${acumuladoDowngrades.length} eventos · ${rangoAcumulado}`}       color={AMBER}  />
          <KpiCard icon={TrendingDown}   label="Impacto Total Acumulado"      value={fmt(totalAcumCancelados + totalAcumDowngrades)}
            sub="Cancelados + Downgrades desde abr 2026"                        color={INDIGO} />
          <KpiCard icon={CalendarDays}   label="Reportes Analizados"          value={String(allReportes.length)}
            sub={`${allReportes.length} cortes semanales`}                      color={BLUE}   />
        </div>
      ) : (
        <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard icon={Clock}          label="Pendiente de Facturar"
            value={pendienteNoReportado ? 'sin medir' : fmt(totalPendiente)}
            sub={pendienteNoReportado
              ? `este corte no reporta cartera por cobrar · ${reporte.periodo}`
              : `${nPendientes} cuentas · ${reporte.periodo}`}
            color={ORANGE} />
          {cancelados.length > 0
            ? <KpiCard icon={XCircle}    label="MRR Cancelado"            value={fmt(totalCancelados)}
                sub={nCanceladosDesconocido
                  ? `el corte no dice cuántas cuentas · ${reporte.periodo}`
                  : `${nCancelados} clientes · ${reporte.periodo}`} color={RED} />
            : <KpiCard icon={BarChart3}  label="Suspendidos / Inactivos"  value={fmt(totalSuspendidos)}
                sub={`${reporte.suspendidosCuentasReal ?? (suspendidos?.length ?? 0)} cuentas pausadas`} color={BLUE} />
          }
          <KpiCard icon={ArrowDownRight} label="Ingreso Perdido Downgrade"
            value={downgradeNoReportado ? 'no reportado' : fmt(totalDowngrades)}
            sub={downgradeNoReportado
              ? `El corte no los mide · ${reporte.periodo}`
              : `${nDowngrades} clientes · ${reporte.periodo}`}  color={AMBER}  />
          {grc
            ? <KpiCard icon={TrendingDown} label={grc.acumuladoEtiqueta ? `GRC ${grc.acumuladoEtiqueta}` : `GRC Acumulado ${grc.evolucion[grc.evolucion.length - 1]?.mes ?? 'GRC'}`} value={`${grc.acumulado}%`}
                sub={`${grc.evolucion[grc.evolucion.length - 1]?.mes ?? 'Mes'} actual: ${grc.evolucion[grc.evolucion.length - 1]?.pct ?? 0}%`} color={RED} />
            : <KpiCard icon={TrendingDown} label="Pérdida Total T1 2026"  value={fmt(TOTAL_T1)}
                sub="34.2% en 15 clientes clave"                            color={INDIGO} />
          }
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto shadow-sm">
          {(isAcumulado ? ACUM_TABS : TABS).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={tab === t.id ? { background: t.color, color: '#fff' } : { color: '#667384' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      </>
      )}

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
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: tonoSobreClaro(ORANGE, 0.06) }}>Pendiente de Facturar</span>
                  </div>
                  <p className="text-2xl font-extrabold" style={{ color: tonoSobreClaro(ORANGE, 0.06) }}>{fmt(totalPendiente)}</p>
                  <p className="text-xs text-gray-500 mt-1">{nPendientes} clientes en riesgo</p>
                  <p className="text-xs mt-3 text-gray-600">Deben facturarse esta semana para evitar churn. Acción inmediata requerida.</p>
                </div>
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${RED}50`, background: `${RED}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: RED }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: tonoSobreClaro(RED, 0.06) }}>Cancelados</span>
                  </div>
                  <p className="text-2xl font-extrabold" style={{ color: tonoSobreClaro(RED, 0.06) }}>{fmt(totalCancelados)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {nCanceladosDesconocido ? 'el corte no dice cuántas cuentas' : `${etqCancelados} clientes`}
                  </p>
                  <p className="text-xs mt-3 text-gray-600">Cuentas que cancelaron. MRR perdido. Acumulado histórico relevante.</p>
                </div>
                <div className="rounded-xl border-2 p-4" style={{ borderColor: `${AMBER}50`, background: `${AMBER}06` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: AMBER }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: tonoSobreClaro(AMBER, 0.06) }}>Downgrades</span>
                  </div>
                  <p className="text-2xl font-extrabold" style={{ color: tonoSobreClaro(AMBER, 0.06) }}>
                    {downgradeNoReportado ? 'no reportado' : fmt(totalDowngrades)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {downgradeNoReportado
                      ? 'El corte no desglosa downgrades del período'
                      : `${nDowngrades} clientes con reducción de plan`}
                  </p>
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
                    { label: 'MRR en riesgo (pendiente de facturar)', monto: totalPendiente,  color: ORANGE_TX },
                    { label: 'MRR cancelado definitivo',               monto: totalCancelados, color: RED_TX    },
                    { label: 'Ingreso perdido por downgrades',          monto: totalDowngrades, color: AMBER_TX,
                      sinMedir: downgradeNoReportado  },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{r.label}</span>
                        <span className="font-bold" style={{ color: tonoSobreClaro(r.color, 0.10) }}>
                          {r.sinMedir ? 'no reportado' : fmt(r.monto)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(r.monto / total) * 100}%`, background: r.color }} />
                      </div>
                    </div>
                  ))
                })()}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      Total impacto{downgradeNoReportado ? ' (mínimo)' : ''}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{fmt(totalPendiente + totalCancelados + totalDowngrades)}</span>
                  </div>
                  {/* Sin downgrades medidos, la suma es un PISO, no un total. */}
                  {downgradeNoReportado && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Es un piso: el corte no mide los downgrades, así que falta
                      un sumando que nadie cuantificó.
                    </p>
                  )}
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
                  <p className="text-xl font-bold mt-1" style={{ color: RED_TX }}>{fmt(TOTAL_T1_REL)}</p>
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
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: ORANGE_TX }}>{fmt(Number(c.monto))}</td>
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
                    <td className="py-3 px-4 text-right" style={{ color: ORANGE_TX }}>{fmt(totalPendiente)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CANCELADOS ───────────────────────────────────────────── */}
        {!isAcumulado && tab === 'cancelados' && (
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
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: RED_TX }}>{fmt(Number(c.mrr))}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.mesesActivo >= 40 ? 'bg-green-100 text-green-700' :
                          c.mesesActivo >= 12 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{c.mesesActivo} meses</span>
                      </td>
                      {/* UN CERO SIN MEDICIÓN NO ES UN CERO. Hay cortes que no
                          publican el acumulado histórico de cada baja, y la
                          celda decía «$0» en las once filas: se lee como que
                          esos clientes nunca facturaron nada, cuando lo que
                          pasa es que el corte no lo trae.
                          [[feedback-cero-sin-medicion]] */}
                      <td className="py-3 px-4 text-right text-xs text-gray-500">
                        {Number(c.acumulado) > 0
                          ? fmt(Number(c.acumulado))
                          : <span title="El corte no publica el acumulado histórico de esta cuenta">no reportado</span>}
                      </td>
                      <td className="py-3 px-4 text-center"><SemaforoDot tipo="cancelado" /></td>
                    </tr>
                  ))}
                  <tr className="bg-red-50/50 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: RED_TX }}>{fmt(totalCancelados)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DOWNGRADES ───────────────────────────────────────────── */}
        {!isAcumulado && tab === 'downgrades' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${AMBER}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Downgrades — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ingreso perdido:{' '}
                  <strong>{downgradeNoReportado ? 'no reportado por el corte' : fmt(totalDowngrades)}</strong>
                </p>
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
                  {/* La tabla CIERRA en pantalla: si el corte detalla un top y
                      declara más, el resto se ve. No un top que calla el resto. */}
                  {restoDowngrade > 0.004 && (
                    <tr className="border-b border-gray-100 bg-amber-50/20">
                      <td className="py-3 px-4 text-gray-600 italic">
                        + Resto no desglosado por el corte
                      </td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: AMBER_TX }}>
                        {fmt(restoDowngrade)}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">—</td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        El corte declara <strong>{fmt(totalDowngrades)}</strong> y detalla{' '}
                        {fmt(sumaFilasDowngrade)} en {sinCubo(downgrades).length} cliente(s).
                        Esta fila es la diferencia, para que la tabla cuadre con lo
                        declarado; el corte no dice a quién corresponde.
                      </td>
                    </tr>
                  )}
                  {downgradeNoReportado && (
                    <tr className="border-b border-gray-100">
                      <td colSpan={4} className="py-4 px-4 text-xs text-gray-600">
                        <strong>El corte no reporta downgrades.</strong> No es un cero:
                        el correo dice que «no hay downgrades significativos en la
                        semana», que es un juicio y además habla de la semana, no del
                        mes. No se publica $0.00 sobre algo que nadie midió.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-amber-50/50 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: AMBER_TX }}>
                      {downgradeNoReportado ? 'no reportado' : fmt(totalDowngrades)}
                    </td>
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

        {/* ── ACUMULADO · CANCELADOS ───────────────────────────────── */}
        {isAcumulado && tab === 'cancelados' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${RED}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Cancelados · Acumulado — Desde Abr 2026</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  MRR total perdido: <strong>{fmt(totalAcumCancelados)}</strong> · {acumuladoCancelados.length} cancelaciones en {allReportes.length} reportes
                </p>
              </div>
              <SemaforoDot tipo="cancelado" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {([ ['cliente','Cliente','left'], ['mrr','MRR Perdido','right'], ['mesesActivo','Meses Activo','right'], ['acumulado','Acumulado','right'], ['periodo','Período','left'] ] as [typeof acumCancelSort['col'], string, string][]).map(([col, label, align]) => (
                      <th key={col}
                        className={`py-3 px-4 text-xs font-semibold uppercase tracking-wide cursor-pointer select-none group whitespace-nowrap text-${align}`}
                        style={{ color: acumCancelSort.col === col ? RED_TX : undefined }}
                        onClick={() => setAcumCancelSort(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }))}>
                        <span className="inline-flex items-center gap-1">
                          {label}
                          <span className="text-[10px] opacity-50 group-hover:opacity-100">
                            {acumCancelSort.col === col ? (acumCancelSort.dir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedAcumCancelados.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-red-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: RED_TX }}>{fmt(Number(c.mrr))}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.mesesActivo >= 40 ? 'bg-green-100 text-green-700' :
                          c.mesesActivo >= 12 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{c.mesesActivo} meses</span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-500">
                        {Number(c.acumulado) > 0 ? fmt(Number(c.acumulado)) : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">{c.periodo}</td>
                    </tr>
                  ))}
                  <tr className="bg-red-50/60 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL ACUMULADO</td>
                    <td className="py-3 px-4 text-right" style={{ color: RED_TX }}>{fmt(totalAcumCancelados)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ACUMULADO · DOWNGRADES ───────────────────────────────── */}
        {isAcumulado && tab === 'downgrades' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
              style={{ background: `${AMBER}08` }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Downgrades · Acumulado — Desde Abr 2026</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ingreso perdido total: <strong>{fmt(totalAcumDowngrades)}</strong> · {acumuladoDowngrades.length} eventos en {allReportes.length} reportes
                </p>
              </div>
              <SemaforoDot tipo="downgrade" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {([ ['cliente','Cliente','left'], ['perdida','Ingreso Perdido','right'], ['periodo','Período','left'], ['nota','Detalle','left'] ] as [typeof acumDgSort['col'], string, string][]).map(([col, label, align]) => (
                      <th key={col}
                        className={`py-3 px-4 text-xs font-semibold uppercase tracking-wide cursor-pointer select-none group whitespace-nowrap text-${align}`}
                        style={{ color: acumDgSort.col === col ? AMBER_TX : undefined }}
                        onClick={() => setAcumDgSort(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }))}>
                        <span className="inline-flex items-center gap-1">
                          {label}
                          <span className="text-[10px] opacity-50 group-hover:opacity-100">
                            {acumDgSort.col === col ? (acumDgSort.dir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedAcumDowngrades.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{d.cliente}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: AMBER_TX }}>{fmt(Number(d.perdida))}</td>
                      <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">{d.periodo}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">{d.nota}</td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50/60 font-bold">
                    <td className="py-3 px-4 text-gray-900">TOTAL ACUMULADO</td>
                    <td className="py-3 px-4 text-right" style={{ color: AMBER_TX }}>{fmt(totalAcumDowngrades)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ARTÍCULOS MÁS AFECTADOS EN DOWNGRADES ──────────────── */}
        {!isAcumulado && tab === 'downgrades' && reporte.downgradeArticulos && reporte.downgradeArticulos.length > 0 && (
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
                  {/* EL RÓTULO SALE DE LA ETIQUETA DEL CORTE, no está fijo.
                      Esta chapa decía «GRC Acumulado» a secas, y con el cierre
                      de T3 —cuyo acumulado es del TRIMESTRE, 2.39%— se leía
                      como el acumulado del año desplomándose desde el 23.7%.
                      La tarjeta de arriba ya respetaba `acumuladoEtiqueta`;
                      ésta no, y es la que se ve dentro del módulo. */}
                  <span className="text-xs font-semibold text-gray-600">
                    {grc.acumuladoEtiqueta ? `GRC ${grc.acumuladoEtiqueta}` : 'GRC Acumulado'}
                  </span>
                  <span className="text-2xl font-black" style={{ color: RED_TX }}>{grc.acumulado}%</span>
                  {grc.anterior !== undefined && (
                    <span className="text-[11px] font-semibold text-gray-400">
                      antes {grc.anterior}%
                    </span>
                  )}
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
                  /* El mismo tono, pero para la CIFRA. El verde `#22c55e` da
                     2.22:1 sobre su tinte y el porcentaje es el dato de la
                     tarjeta: el relleno de la barra y el borde conservan el
                     color vivo, que es donde el color informa. */
                  const colorTx = tonoSobreClaro(color, 0.10)
                  const pctMax = Math.max(...grc.evolucion.map(x => x.pct))
                  const barW = Math.round((e.pct / pctMax) * 100)
                  return (
                    <div key={i} className="rounded-xl border p-4"
                      style={{ background: `${color}08`, borderColor: `${color}30` }}>
                      <p className="text-xs font-semibold text-gray-500 mb-1">{e.mes}</p>
                      <p className="text-3xl font-black mb-1" style={{ color: colorTx }}>{e.pct}%</p>
                      {/* LA REEXPRESIÓN SE VE O NO EXISTE. `anterior` estaba en
                          el tipo desde la semana 20 y sólo lo usaba el contexto
                          de Atlas: en pantalla, septiembre pasaba de 6.9% a
                          2.6% sin que nada dijera que había cambiado, y un mes
                          cerrado que cambia solo se explica si se enseña de
                          dónde viene. [[regla-churn-mes-vencido]] */}
                      <p className="text-[10px] mb-2 h-3.5 text-gray-400">
                        {e.anterior !== undefined
                          ? `antes ${e.anterior}% · reexpresado`
                          : ''}
                      </p>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, background: color }} />
                      </div>
                      {isCritical && (
                        <p className="text-[10px] font-bold mt-2 uppercase tracking-wide" style={{ color: RED_TX }}>
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

            {/* Antigüedad de saldos — solo en cortes que la reportan */}
            {reporte.antiguedadSaldos && reporte.antiguedadSaldos.length > 0 && (() => {
              const filas = reporte.antiguedadSaldos!
              const totalSaldos = filas.reduce((s, f) => s + f.monto, 0)
              const vencido = filas.filter(f => !/por vencer/i.test(f.rango)).reduce((s, f) => s + f.monto, 0)
              /* Entre más vieja la deuda, más caliente el color: por vencer aún es sano. */
              const colorRango = (rango: string) =>
                /por vencer/i.test(rango) ? GREEN :
                /^\s*1\b|1 –|1-/.test(rango) ? TEAL :
                /^\s*8\b|8 –|8-/.test(rango) ? AMBER :
                /16/.test(rango) ? ORANGE : RED
              return (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
                    <h3 className="font-semibold text-gray-900 text-sm">Antigüedad de saldos — {reporte.periodo}</h3>
                    <p className="text-xs text-gray-500">
                      Total <strong className="text-gray-900">{fmt(totalSaldos)}</strong> ·{' '}
                      vencido <strong style={{ color: RED_TX }}>{fmt(vencido)}</strong>{' '}
                      ({Math.round((vencido / (totalSaldos || 1)) * 100)}%)
                    </p>
                  </div>
                  <div className="space-y-3">
                    {filas.map(f => {
                      const c = colorRango(f.rango)
                      return (
                        <div key={f.rango}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700 font-medium">{f.rango}</span>
                            <div className="text-right">
                              <span className="font-bold" style={{ color: c }}>{fmt(f.monto)}</span>
                              <span className="text-gray-400 ml-2 text-[11px]">
                                {Math.round((f.monto / (totalSaldos || 1)) * 100)}% del saldo
                              </span>
                            </div>
                          </div>
                          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full"
                                 style={{ width: `${(f.monto / (totalSaldos || 1)) * 100}%`, background: c }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100 leading-relaxed">
                    El saldo con más de 30 días es el que históricamente antecede a la suspensión.
                    Cobranza y Customer Success trabajan el mismo tramo: si la cuenta ya está vencida,
                    la conversación de valor tiene que ocurrir antes del corte, no después.
                  </p>
                </div>
              )
            })()}

            {/* Resumen de impacto */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Resumen de Impacto — {reporte.periodo}</h3>
              <div className="space-y-3">
                {[
                  { label: pendienteNoReportado
                      ? 'Pendiente de facturar (no reportado en este corte)'
                      : `Pendiente de facturar (${nPendientes} cuentas)`,
                    monto: totalPendiente, color: ORANGE_TX, sinMedir: pendienteNoReportado,
                    sub: pendienteNoReportado
                      ? 'El cierre de trimestre no trae cartera por cobrar — no es que valga cero'
                      : 'Riesgo inmediato de churn' },
                  { label: downgradeNoReportado
                      ? 'Downgrades (no reportados en este corte)'
                      : 'Downgrades detectados',
                    monto: totalDowngrades, color: AMBER_TX, sinMedir: downgradeNoReportado,
                    sub: downgradeNoReportado
                      ? 'El corte los llama «no significativos» sin cuantificarlos — no es que valgan cero'
                      : `${nDowngrades} clientes con reducción de plan` },
                  { label: 'Suspendidos / Inactivos en retención',    monto: totalSuspendidos, color: BLUE, sinMedir: false, sub: `${reporte.suspendidosCuentasReal ?? suspendidos?.length ?? 0} cuentas pausadas` },
                ].map(row => {
                  const total = totalPendiente + totalDowngrades + totalSuspendidos || 1
                  return (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{row.label}</span>
                        <div className="text-right">
                          {/* Un rótulo que dice «no reportado» con un $0.00 al lado
                              se contradice: la cifra es la que se recuerda. */}
                          <span className="font-bold" style={{ color: row.color }}>
                            {row.sinMedir ? 'no reportado' : fmt(row.monto)}
                          </span>
                          <span className="text-gray-400 ml-2 text-[11px]">{row.sub}</span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(row.monto / total) * 100}%`, background: row.color }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-gray-800">Exposición total identificada</span>
                    <span className="text-sm font-bold text-gray-900">{fmt(totalPendiente + totalDowngrades + totalSuspendidos)}</span>
                  </div>
                  {(pendienteNoReportado || downgradeNoReportado) && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Falta{pendienteNoReportado && downgradeNoReportado ? 'n' : ''}{' '}
                      {[pendienteNoReportado && 'la cartera por cobrar',
                        downgradeNoReportado && 'los downgrades'].filter(Boolean).join(' y ')}
                      , que este corte no cuantifica: la suma es un piso.
                    </p>
                  )}
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
              style={{ background: '#10355D08' }}>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Desactivados — {reporte.periodo}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Impacto: <strong style={{ color: '#10355D' }}>{fmt(reporte.desactivadosTotalReal ?? reporte.desactivados.reduce((s, c) => s + (Number(c.importe) || 0), 0))}</strong> ·{' '}
                  {reporte.desactivadosCuentasReal ?? reporte.desactivados.length} cuentas con módulo o servicio desactivado
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                style={{ background: '#10355D15', color: '#10355D', borderColor: '#10355D35' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10355D' }} />
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
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: '#10355D' }}>{fmt(Number(c.importe))}</td>
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
                  <tr className="font-bold" style={{ background: '#10355D0A' }}>
                    <td className="py-3 px-4 text-gray-900">TOTAL</td>
                    <td className="py-3 px-4 text-right" style={{ color: '#10355D' }}>
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
                  <p className="text-2xl font-bold mt-1" style={{ color: RED_TX }}>{fmt(TOTAL_T1_REL)}</p>
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
                          style={{ color: c.tipo === 'Downgrade' ? AMBER_TX : RED_TX }}>{fmt(c.perdida)}</td>
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

        {/* ── GRC · AAA 2026 (Ene–Jul, corte 15 Jul) ─────────────── */}
        {tab === 'aaa' && <GrcAaaSection />}

        {/* ── CONCILIACIÓN ─────────────────────────────────────────── */}
        {tab === 'conciliacion' && <ConciliacionChurn />}

      </div>

        </div>
        {/* /Columna principal */}

      </div>
      {/* /Columna principal */}

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
              {/* Igual que el de /auditoria: el blanco sobre `bg-red-500`
                  mide 3.76:1. El `-600` da 4.83:1. */}
              <button onClick={() => handleDelete(delConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
