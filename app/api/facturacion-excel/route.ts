import { NextResponse } from 'next/server'

// Mock data de Información de Cortes - integración con Excel
const facturacionData = {
  'Resumen': [
    { 'Métrica': 'Total Facturación', 'Valor': '$2,456,892' },
    { 'Métrica': 'Cuentas Activas', 'Valor': 156 },
    { 'Métrica': 'Ingresos Recurrentes (MRR)', 'Valor': '$245,689' },
    { 'Métrica': 'Tasa de Cobranza', 'Valor': '98.5%' }
  ],
  'Cortes': [
    {
      'Cuenta': 'Ancona Autopartes',
      'CID': 24924,
      'MRR': '$15,543',
      'Facturación Mes': '$15,543',
      'Pagos Recibidos': '$15,543',
      'Saldo': '$0',
      'Estado': 'Pagado',
      'Días Vencimiento': 0
    },
    {
      'Cuenta': 'ALTERNET',
      'CID': 12245,
      'MRR': '$8,234',
      'Facturación Mes': '$8,234',
      'Pagos Recibidos': '$8,234',
      'Saldo': '$0',
      'Estado': 'Pagado',
      'Días Vencimiento': 0
    },
    {
      'Cuenta': 'Jason de México',
      'CID': 15632,
      'MRR': '$12,456',
      'Facturación Mes': '$12,456',
      'Pagos Recibidos': '$12,456',
      'Saldo': '$0',
      'Estado': 'Pagado',
      'Días Vencimiento': 0
    }
  ],
  'Vencimientos': [
    { 'Rango': '0-7 días', 'Cantidad': 8, 'Monto': '$82,340' },
    { 'Rango': '8-14 días', 'Cantidad': 5, 'Monto': '$45,670' },
    { 'Rango': '15-30 días', 'Cantidad': 12, 'Monto': '$125,890' },
    { 'Rango': '30+ días', 'Cantidad': 3, 'Monto': '$34,560' }
  ]
}

export async function GET() {
  try {
    return NextResponse.json(facturacionData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
