import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const lineacelData = {
  nombre: 'LINEACEL',
  razon_social: 'Lineacel, S.A.S. de C.V.',
  sector: 'Telecomunicaciones / Comercialización de servicios móviles',
  giro: 'Distribuidor Autorizado BAIT',
  ubicacion: 'Toluca, Estado de México',
  cid_zoho: 180969,
  consecutivo: 'C52', // Claudia, número asignado
  asesor_sac: 'Claudia H.',
  ejecutivo_activaciones: 'Enrique',
  fecha_activacion: '2026-05-07',
  estado: 'activa',
  clasificacion: 'BAIT · Distribución · Expansión de puntos de venta',

  // Datos de implementación
  configuracion_realizada: true,
  extensiones: 8,
  grupos: true,
  ivr_menu: true,
  integraciones: false,

  // Validación inicial
  llamadas_entrantes: 20,
  llamadas_salientes: 950,
  ivr_count: 1,
  tipo_redirecciones: 'Softphone',

  // Capacitación
  capacitacion_realizada: true,
  capacitacion_participantes: 3,
  capacitacion_pendientes: null,

  // Información comercial
  resumen_actividad: 'Realizan campañas salientes a base de datos de clientes BAIT y Movistar. Utilizan el servicio de manera constante, conocen la plataforma. Esperan aumentar llamadas antes del registro de números nacionales.',

  // Módulos adoptados
  chat_api: false,
  asistente_voz: false,
  panel_administrador: true,
  integracion_api: false,
  pago_automatico: false,

  // Health Score components
  antigüedad_dias: 100, // desde 07/May/26 hasta 14/Aug/26
  informacion_completa: false,
  pagos_al_dia: true,
  modulos_adoptados: 1, // Solo panel base
  seguimiento_kam: false,

  // Propuesta pendiente
  propuesta_chat_api: true,
  propuesta_monto: 32572, // USD sin IVA
  propuesta_detalles: 'Chat API $299 + 10,000 mensajes $480 + 30,000 msg marketing $29,700',
  propuesta_estado: 'pendiente_perfilamiento',

  // Observaciones
  observaciones: 'Uso constante de la plataforma. Proyecto podría ser a corto plazo debido a que el registro nacional de números bajará el numero de usuarios a contactar. Handoff listo para SAC.',

  siguiente_accion: 'Monitoreo y seguimiento de campañas',

  // Proyección de MRR
  mrr_estimado: 500, // Plan base inicial, sin Chat API
}

console.log('📝 Insertando cuenta de LINEACEL...')
console.log(JSON.stringify(lineacelData, null, 2))

// Nota: Este script requiere que la tabla 'cuentas' esté configurada en Supabase
// con los campos necesarios. En su lugar, se recomienda:
// 1. Usar la API de Callpicker si existe un endpoint POST /api/cuentas
// 2. O insertar directamente en Supabase dashboard si no hay API

console.log('\n⚠️  Este script requiere:')
console.log('   1. Configurar tabla "cuentas" en Supabase')
console.log('   2. O usar endpoint POST /api/cuentas de la aplicación')
console.log('   3. O insertar manualmente en dashboard de Supabase')
console.log('\n✓ Datos preparados. Ejecutar inserción manualmente o via API.')
