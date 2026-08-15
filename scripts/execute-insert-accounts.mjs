import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertAccounts() {
  console.log('🔄 Insertando nuevas cuentas en Supabase...\n')

  // LINEACEL
  const lineaceLData = {
    consecutivo: 'C52',
    cid: '180969',
    empresa: 'LINEACEL',
    asesor: 'Claudia',
    facturacion: 500,
    activo_desde: '2026-05-07',
    servicio: 'Callpicker Base + Softphone',
    estado: 'activo',
    pagos_al_corriente: true,
    health_score: 75,
    score_actividad: 85,
    score_adopcion: 90,
    score_pago: 100,
    score_relacional: 80,
    contacto_nombre: 'Contacto',
    contacto_email: 'lineacel.tecnologia@gmail.com',
    contacto_tel: null,
    contacto_cargo: 'Administrador',
    giro: 'Telecomunicaciones / Distribuidor BAIT',
    tamano_empresa: 'Pequeña',
    direccion_fiscal: 'Toluca, Estado de México',
    pagina_web: 'lineacel.com',
    tiene_chat_activo: false,
    tiene_integracion_api: false,
    tiene_pago_automatico: false,
    tiene_ia_voz: false,
    tiene_ia_chat: false,
    dashboard_revisado: true,
    dias_sin_actividad: 0,
    llamadas_cambio_pct: 0,
    llamadas_atendidas_pct: 95,
    notas: '[PROPUESTA_CHAT_API] $32,572 USD (Chat API + mensajes). Canalizado a Perfilamiento 14-ago-2026. Ciclo corto: Registro Nacional de Números puede afectar base de contactos.',
    observaciones_kam: 'Cliente muy activo con plataforma. Usa intensivamente para campañas salientes (950 llamadas out vs 20 in en 3.3 meses). Señales de expansión: vacancias POS. Monitoreo recomendado.',
    ultimo_contacto: '2026-08-14',
  }

  // ANCONA AUTOPARTES
  const anconaData = {
    consecutivo: 'F24',
    cid: '24924',
    empresa: 'Ancona Autopartes',
    asesor: 'Fátima',
    facturacion: 15543,
    activo_desde: '2019-09-01',
    servicio: 'Callpicker Base · 14 Extensiones',
    estado: 'en_riesgo',
    pagos_al_corriente: true,
    health_score: 65,
    score_actividad: 70,
    score_adopcion: 0,
    score_pago: 95,
    score_relacional: 50,
    contacto_nombre: 'Fátima',
    contacto_email: null,
    contacto_tel: null,
    contacto_cargo: 'SAC',
    giro: 'Autopartes / Refaccionaria',
    tamano_empresa: 'Grande',
    num_oficinas: 14,
    direccion_fiscal: 'Toluca / Península Yucatán',
    pagina_web: 'ancona.mx',
    tiene_chat_activo: false,
    tiene_integracion_api: false,
    tiene_pago_automatico: false,
    tiene_ia_voz: false,
    tiene_ia_chat: false,
    dashboard_revisado: false,
    dias_sin_actividad: 0,
    llamadas_cambio_pct: 0,
    llamadas_atendidas_pct: 96.1,
    notas: '[INCIDENTE_JULIO] 15 días, ~4,028 llamadas perdidas (5–19 jul 2026). Causa: falta de destino en CAM Talleres (3,522 sin routing). Corrección 20-jul exitosa (62.8%→3.9%). PERO: 5 sucursales pequeñas sin mejora (20%–41% pérdida residual). PUNTO ÚNICO DE FALLA: 98% tráfico CAM Talleres depende de "Jorge QROO". [FALTA_HS]',
    observaciones_kam: 'Reporte forense: incidente no fue detectado por Callpicker ni cliente en 15 días. Cero módulos adoptados en 6 años. Propuesta IA de Voz como red de contención en sucursales pequeñas. Oportunidad de expansión clara.',
    ultimo_contacto: '2026-08-14',
  }

  try {
    // Insertar LINEACEL
    console.log('📝 Insertando LINEACEL (C52)...')
    const { data: lineaceLResult, error: lineacelError } = await supabase
      .from('cuentas')
      .insert([lineaceLData])
      .select()

    if (lineacelError) {
      console.error('❌ Error insertando LINEACEL:', lineacelError.message)
    } else {
      console.log('✓ LINEACEL insertado:', lineaceLResult?.[0]?.empresa)
    }

    // Insertar ANCONA
    console.log('\n📝 Insertando Ancona Autopartes (F24)...')
    const { data: anconaResult, error: anconaError } = await supabase
      .from('cuentas')
      .insert([anconaData])
      .select()

    if (anconaError) {
      console.error('❌ Error insertando Ancona:', anconaError.message)
    } else {
      console.log('✓ Ancona Autopartes insertada:', anconaResult?.[0]?.empresa)
    }

    // Verificar inserciones
    console.log('\n🔍 Verificando inserciones...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('cuentas')
      .select('consecutivo, empresa, asesor, facturacion, health_score, estado')
      .in('consecutivo', ['C52', 'F24'])
      .order('consecutivo')

    if (verifyError) {
      console.error('❌ Error verificando:', verifyError.message)
    } else {
      console.log('\n✅ Cuentas insertadas correctamente:\n')
      verifyData?.forEach(cuenta => {
        console.log(`   ${cuenta.consecutivo} | ${cuenta.empresa} | ${cuenta.asesor} | $${cuenta.facturacion} | HS: ${cuenta.health_score} | ${cuenta.estado}`)
      })
    }

    console.log('\n✨ ¡Operación completada! Las cuentas ya deben aparecer en la interfaz.')
  } catch (err) {
    console.error('❌ Error general:', err)
    process.exit(1)
  }
}

insertAccounts()
