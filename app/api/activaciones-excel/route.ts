import { NextResponse } from 'next/server'

// Mock data de Activaciones 2.0 - integración con Excel
const activacionesData = {
  'Resumen': [
    { 'Métrica': 'Total Cuentas Activas', 'Valor': 156 },
    { 'Métrica': 'Activaciones Completadas', 'Valor': 89 },
    { 'Métrica': 'Tasa de Adopción', 'Valor': '57%' },
    { 'Métrica': 'Módulos Promedio por Cuenta', 'Valor': 3.2 }
  ],
  'Activaciones': [
    {
      'Cuenta': 'Ancona Autopartes',
      'IA de Voz': 'Pendiente',
      'Chat': 'Completado',
      'Integración API': 'En Progreso',
      'Panel Admin': 'Completado',
      'Pagos Automáticos': 'Pendiente',
      'Porcentaje': '40%',
      'Responsable': 'Fátima',
      'Fecha Inicio': '2026-07-15',
      'Fecha Meta': '2026-09-15'
    },
    {
      'Cuenta': 'ALTERNET',
      'IA de Voz': 'Completado',
      'Chat': 'Completado',
      'Integración API': 'Completado',
      'Panel Admin': 'Completado',
      'Pagos Automáticos': 'Completado',
      'Porcentaje': '100%',
      'Responsable': 'Claudia',
      'Fecha Inicio': '2026-06-01',
      'Fecha Meta': '2026-08-15'
    },
    {
      'Cuenta': 'Jason de México',
      'IA de Voz': 'Completado',
      'Chat': 'Pendiente',
      'Integración API': 'En Progreso',
      'Panel Admin': 'Completado',
      'Pagos Automáticos': 'Pendiente',
      'Porcentaje': '60%',
      'Responsable': 'Dan',
      'Fecha Inicio': '2026-05-20',
      'Fecha Meta': '2026-09-01'
    }
  ],
  'Módulos': [
    { 'Módulo': 'IA de Voz', 'Adoptado': 42, 'Pendiente': 23, 'Impacto': 'Alto' },
    { 'Módulo': 'Chat', 'Adoptado': 58, 'Pendiente': 18, 'Impacto': 'Alto' },
    { 'Módulo': 'Integración API', 'Adoptado': 35, 'Pendiente': 31, 'Impacto': 'Medio' },
    { 'Módulo': 'Panel Admin', 'Adoptado': 67, 'Pendiente': 12, 'Impacto': 'Alto' },
    { 'Módulo': 'Pagos Automáticos', 'Adoptado': 28, 'Pendiente': 45, 'Impacto': 'Medio' }
  ]
}

export async function GET() {
  try {
    return NextResponse.json(activacionesData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
