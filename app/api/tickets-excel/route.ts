import { NextResponse } from 'next/server'

// Mock data - en un proyecto real, esto vendría del archivo Excel
const ticketsData = {
  'Tickets': [
    {
      'ID': 1,
      'Cuenta': 'Ancona Autopartes',
      'Asunto': 'Problema de enrutamiento en CAM Talleres',
      'Estado': 'Resuelto',
      'Creado': '2026-07-20',
      'Resuelto': '2026-07-20',
      'Prioridad': 'Crítica'
    },
    {
      'ID': 2,
      'Cuenta': 'ALTERNET',
      'Asunto': 'Configuración de integración API',
      'Estado': 'En Progreso',
      'Creado': '2026-08-10',
      'Resuelto': null,
      'Prioridad': 'Alta'
    },
    {
      'ID': 3,
      'Cuenta': 'Jason de México',
      'Asunto': 'Optimización de llamadas perdidas',
      'Estado': 'Cerrado',
      'Creado': '2026-06-15',
      'Resuelto': '2026-08-12',
      'Prioridad': 'Media'
    }
  ]
}

export async function GET() {
  try {
    return NextResponse.json(ticketsData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
