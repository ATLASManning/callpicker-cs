import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno')
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
    notas: '[PROPUESTA_CHAT_API] $32,572 USD. Canalizado a Perfilamiento 14-ago-2026.',
    observaciones_kam: 'Cliente muy activo. 950 llamadas out vs 20 in. Señales de expansión POS.',
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
    notas: '[INCIDENTE_JULIO] 15 días, 4,028 llamadas perdidas. Corrección exitosa 20-jul. 5 sucursales con pérdida residual 20-41%.',
    observaciones_kam: 'Incidente no detectado por Callpicker ni cliente en 15 días. Cero módulos en 6 años. Propuesta IA de Voz.',
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
      console.error('❌ Error:', lineacelError.message)
    } else {
      console.log('✓ LINEACEL insertado:', lineaceLResult?.[0]?.empresa)
    }

    // Insertar ANCONA (o actualizar si existe)
    console.log('\n📝 Insertando/Actualizando Ancona Autopartes (F24)...')

    // Primero intentar actualizar si existe
    const { data: checkData } = await supabase
      .from('cuentas')
      .select('id')
      .eq('consecutivo', 'F24')
      .single()

    if (checkData?.id) {
      // Actualizar
      const { data: updateResult, error: updateError } = await supabase
        .from('cuentas')
        .update(anconaData)
        .eq('consecutivo', 'F24')
        .select()

      if (updateError) {
        console.error('❌ Error actualizando:', updateError.message)
      } else {
        console.log('✓ Ancona Autopartes actualizada:', updateResult?.[0]?.empresa)
      }
    } else {
      // Insertar nuevo
      const { data: insertResult, error: insertError } = await supabase
        .from('cuentas')
        .insert([anconaData])
        .select()

      if (insertError) {
        console.error('❌ Error:', insertError.message)
      } else {
        console.log('✓ Ancona Autopartes insertada:', insertResult?.[0]?.empresa)
      }
    }

    // Verificar inserciones
    console.log('\n🔍 Verificando inserciones...')
    const { data: verifyData } = await supabase
      .from('cuentas')
      .select('consecutivo, empresa, asesor, facturacion, estado')
      .in('consecutivo', ['C52', 'F24'])
      .order('consecutivo')

    if (verifyData && verifyData.length > 0) {
      console.log('\n✅ Cuentas en el sistema:\n')
      verifyData.forEach(cuenta => {
        console.log(`   ${cuenta.consecutivo} | ${cuenta.empresa} | ${cuenta.asesor} | $${cuenta.facturacion} | ${cuenta.estado}`)
      })
      console.log('\n✨ ¡Listo! Las cuentas ahora aparecerán en la interfaz.')
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

insertAccounts()
