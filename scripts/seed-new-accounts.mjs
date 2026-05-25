// INSERT D42-D48 (nuevas cuentas de Dan)
import { createClient } from '@supabase/supabase-js'

const URL     = process.env.NEXT_PUBLIC_SUPABASE_URL    || ''
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY   || ''
const sb = createClient(URL, SERVICE, { auth: { persistSession: false } })

const inserts = [
  {
    consecutivo: 'D42', empresa: 'Notaria Publica Dieciocho', cid: '164794',
    asesor: 'Dan', facturacion: 5769, estado: 'activo',
    score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
    activo_desde: '2024-10-08', servicio: 'Visibilidad y Control 2,400 minutos',
    contacto_nombre: 'Ricardo Antonio Alvarado Ponce', contacto_email: 'alvaradoponcer@gmail.com', contacto_tel: '6181371352',
    giro: 'Servicios notariales / juridicos', tamano_empresa: 'Pequena',
    pagina_web: 'https://www.durango.gob.mx/directorio/notarios',
    direccion_fiscal: 'CALLE NEGRETE 1004, CP:34000, VICTORIA DE DURANGO CENTRO, DURANGO',
    zoho_link: 'https://crm.zoho.com/crm/org5406171/tab/Accounts/346103000146134135',
    dias_sin_actividad: 0, llamadas_cambio_pct: 0, llamadas_atendidas_pct: 0,
    tiene_chat_activo: false, tiene_integracion_api: false, tiene_pago_automatico: false,
    tiene_ia_voz: false, tiene_ia_chat: false, dashboard_revisado: false,
    pagos_al_corriente: true, incidencias_pago: 0, tickets_abiertos: 0,
    tiene_ticket_reincidente: false, dias_como_cliente: 0,
  },
  {
    consecutivo: 'D43', empresa: 'CLINICA DIGITAL', cid: '97357',
    asesor: 'Dan', facturacion: 5790, estado: 'activo',
    score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
    activo_desde: '2022-01-14', servicio: 'Visibilidad y Control 1,100 minutos',
    contacto_nombre: 'Jorge Cueto', contacto_email: 'jorge.cueto@clinicadigital.mx', contacto_tel: '5589938445',
    giro: 'Servicios de salud privada / telemedicina / consulta presencial', tamano_empresa: 'PYME en expansion',
    pagina_web: 'https://www.clinicadigital.mx/',
    direccion_fiscal: 'BOULEVARD PALMAS HILLS 2 PISO 17 INT 1701, CP 52787, HUIXQUILUCAN',
    zoho_link: 'https://crm.zoho.com/crm/org5406171/tab/Contacts/346103000072598035',
    dias_sin_actividad: 0, llamadas_cambio_pct: 0, llamadas_atendidas_pct: 0,
    tiene_chat_activo: false, tiene_integracion_api: false, tiene_pago_automatico: false,
    tiene_ia_voz: false, tiene_ia_chat: false, dashboard_revisado: false,
    pagos_al_corriente: true, incidencias_pago: 0, tickets_abiertos: 0,
    tiene_ticket_reincidente: false, dias_como_cliente: 0,
  },
  {
    consecutivo: 'D44', empresa: 'Remax Homelife', cid: '1743',
    asesor: 'Dan', facturacion: 5597, estado: 'activo',
    score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
    activo_desde: '2017-03-22', servicio: 'Visibilidad y Control 5,300 minutos',
    contacto_nombre: 'Luis Omar Mendez', contacto_email: 'omar.mendez@remax-homelife.com', contacto_tel: '5553938427',
    giro: 'Franquicia inmobiliaria: compraventa, arrendamiento, valuacion, asesoria patrimonial', tamano_empresa: 'PYME franquiciada',
    pagina_web: 'https://www.remax-homelife.com/',
    direccion_fiscal: 'Circuito Puericultores 42B, Ciudad Satelite, Naucalpan de Juarez, C.P. 53100',
    zoho_link: 'https://crm.zoho.com/crm/org5406171/tab/Contacts/346103000005205027',
    dias_sin_actividad: 0, llamadas_cambio_pct: 0, llamadas_atendidas_pct: 0,
    tiene_chat_activo: false, tiene_integracion_api: false, tiene_pago_automatico: false,
    tiene_ia_voz: false, tiene_ia_chat: false, dashboard_revisado: false,
    pagos_al_corriente: true, incidencias_pago: 0, tickets_abiertos: 0,
    tiene_ticket_reincidente: false, dias_como_cliente: 0,
  },
  {
    consecutivo: 'D45', empresa: 'KW - Pedregal', cid: '3298',
    asesor: 'Dan', facturacion: 6382, estado: 'activo',
    score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
    activo_desde: '2022-05-03', servicio: 'Visibilidad y Control 2,600 minutos',
    contacto_nombre: 'Casandra Castaneda', contacto_email: 'casandra.c@kwmexico.mx', contacto_tel: '4422512295',
    giro: 'Franquicia maestra Keller Williams Realty — plataforma inmobiliaria', tamano_empresa: 'Empresa mediana / franquiciante',
    pagina_web: 'https://www.kwmexico.mx/',
    direccion_fiscal: 'Cto. Alamos 83, Alamos 2a Secc., Queretaro 76160',
    zoho_link: 'https://crm.zoho.com/crm/org5406171/tab/Contacts/346103000005543005',
    dias_sin_actividad: 0, llamadas_cambio_pct: 0, llamadas_atendidas_pct: 0,
    tiene_chat_activo: false, tiene_integracion_api: false, tiene_pago_automatico: false,
    tiene_ia_voz: false, tiene_ia_chat: false, dashboard_revisado: false,
    pagos_al_corriente: true, incidencias_pago: 0, tickets_abiertos: 0,
    tiene_ticket_reincidente: false, dias_como_cliente: 0,
  },
  {
    consecutivo: 'D46', empresa: 'JAZAK TRUCKS, S.A.P.I. DE C.V.', cid: '168142',
    asesor: 'Dan', facturacion: 5512, estado: 'activo',
    score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
    activo_desde: '2025-02-18', servicio: '8 Extensiones Visibilidad y Control con 2,500 min',
    contacto_nombre: 'Jose Manuel Delgadillo', contacto_email: 'j.delgadillo@sit8.com.mx', contacto_tel: '5540001929',
    giro: 'Blindaje especializado de transporte de carga / seguridad en movimiento', tamano_empresa: 'Mediana empresa / PyME',
    pagina_web: 'https://jazaktrucks.com/',
    direccion_fiscal: 'CALLE JOSELILLO 6 A INT 302, EL PARQUE CP: 53398, NAUCALPAN DE JUAREZ, EDOMEX',
    zoho_link: 'https://crm.zoho.com/crm/org5406171/tab/Accounts/346103000159947001',
    dias_sin_actividad: 0, llamadas_cambio_pct: 0, llamadas_atendidas_pct: 0,
    tiene_chat_activo: false, tiene_integracion_api: false, tiene_pago_automatico: false,
    tiene_ia_voz: false, tiene_ia_chat: false, dashboard_revisado: false,
    pagos_al_corriente: true, incidencias_pago: 0, tickets_abiertos: 0,
    tiene_ticket_reincidente: false, dias_como_cliente: 0,
  },
  {
    consecutivo: 'D47', empresa: 'TRANSPORTES DE CARGA FEMA', cid: '167602',
    asesor: 'Dan', facturacion: 5349, estado: 'activo',
    score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
    activo_desde: '2025-01-27', servicio: 'Visibilidad y Control 5,000 minutos',
    contacto_nombre: 'Omar Camarillo', contacto_email: 'omar.camarillo@tfema.com', contacto_tel: '8674540045',
    giro: 'Transporte de carga terrestre nacional e internacional / Cruce Internacional Nuevo Laredo', tamano_empresa: 'Empresa grande',
    pagina_web: 'https://www.tfema.com/',
    direccion_fiscal: 'CARRETERA AEROPUERTO PIEDRAS NEGRAS KM. 0.440, NUEVO LAREDO, TAMAULIPAS. CP: 88298',
    zoho_link: 'https://crm.zoho.com/crm/org5406171/tab/Leads/346103000154321425',
    dias_sin_actividad: 0, llamadas_cambio_pct: 0, llamadas_atendidas_pct: 0,
    tiene_chat_activo: false, tiene_integracion_api: false, tiene_pago_automatico: false,
    tiene_ia_voz: false, tiene_ia_chat: false, dashboard_revisado: false,
    pagos_al_corriente: true, incidencias_pago: 0, tickets_abiertos: 0,
    tiene_ticket_reincidente: false, dias_como_cliente: 0,
  },
  {
    consecutivo: 'D48', empresa: 'REJAMEX', cid: '163784',
    asesor: 'Dan', facturacion: 3274, estado: 'activo',
    score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
    activo_desde: '2024-08-28', servicio: 'Visibilidad y Control 2,400 minutos',
    contacto_nombre: 'Yessenia Rodriguez', contacto_email: 'marketing@tcdl.com.mx', contacto_tel: '5562830347',
    giro: 'Fabricacion de productos metalicos / proteccion perimetral / rejas y vallas', tamano_empresa: 'PyME Industrial / Manufactura',
    pagina_web: 'https://rejamex.com/',
    direccion_fiscal: 'MALAQUIAS HUTITRON #43 LT.6, SAN LORENZO TETLIXTAC, COACALCO, EDOMEX. CP 55714',
    zoho_link: 'https://crm.zoho.com/crm/org5406171/tab/Accounts/346103000129135089',
    dias_sin_actividad: 0, llamadas_cambio_pct: 0, llamadas_atendidas_pct: 0,
    tiene_chat_activo: false, tiene_integracion_api: false, tiene_pago_automatico: false,
    tiene_ia_voz: false, tiene_ia_chat: false, dashboard_revisado: false,
    pagos_al_corriente: true, incidencias_pago: 0, tickets_abiertos: 0,
    tiene_ticket_reincidente: false, dias_como_cliente: 0,
  },
]

async function run() {
  console.log('=== INSERT D42-D48 ===')
  for (const ins of inserts) {
    const { error, data } = await sb
      .from('cuentas')
      .upsert(ins, { onConflict: 'consecutivo' })
      .select('id, consecutivo, empresa')
      .single()
    if (error) {
      console.error(`X ${ins.consecutivo}: ${error.message}`)
    } else {
      console.log(`OK ${data.consecutivo} ${data.empresa} (id: ${data.id})`)
    }
  }
  console.log('Listo.')
}

run().catch(console.error)
