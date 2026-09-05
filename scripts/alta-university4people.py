"""
Alta de la cuenta University 4 People (CID 180839) — ITESM Campus Queretaro.

Fuentes: factura 183476-5 (01 ago 2026), ficha tecnica de direccion (sep 2026)
y el modulo de Facturacion.

Se ejecuta una sola vez. Es idempotente: si el CID ya existe, no duplica.
"""
import json
import os
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

env = {}
for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.strip().split('=', 1)
        env[k.strip()] = v.strip()

URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
     'Content-Type': 'application/json', 'Prefer': 'return=representation'}

OBS = """INTELIGENCIA DE CUENTA - UNIVERSITY 4 PEOPLE / ITESM (Campus Queretaro)
Fuente: ficha tecnica de direccion, sep 2026 + factura 183476-5.

- QUE ES ESTA CUENTA
"University 4 People" es el nombre comercial en Zoho. La razon social es
INSTITUTO TECNOLOGICO Y DE ESTUDIOS SUPERIORES DE MONTERREY (RFC ITE430714KI0).
No es una universidad que compro un conmutador: es una institucion con Salesforce
como CRM institucional desde 2016, aplicado a aspirantes, admisiones, estudiantes,
padres, egresados, empresas, Educacion Continua, eventos y filantropia. Gano el
Dave Perry Award de Salesforce en 2022.

- POR QUE CAMBIA LA LECTURA COMERCIAL
Callpicker esta conectado a una plataforma que el Tec considera parte de su
arquitectura institucional de relacionamiento. La metrica correcta deja de ser
"extensiones + minutos" y pasa a ser: interacciones -> identificacion -> registro
en Salesforce -> trazabilidad -> seguimiento -> resolucion/conversion.

- RIESGO PRINCIPAL: que Callpicker se perciba como PBX
Si Salesforce es lo estrategico y nosotros somos "el telefono", el servicio es
sustituible. Riesgos secundarios: integracion instalada pero infrautilizada (solo
registra llamadas, no automatiza); servicio departamental mientras otras unidades
usan otra herramienta; decision centralizada a nivel nacional aunque la operacion
sea del campus; y la aceleracion de IA del Tec (TECgpt, automatizacion), que exige
evolucionar a transcripcion, resumen, clasificacion y QA.

- EQUIPO CALLPICKER
Ejecutivo de venta: Jose Galvan. KAM / Customer Success: Dan Dominguez.

- LO QUE FALTA ANTES DE PRESENTAR NADA: cuatro nombres internos
1. Dueno actual del servicio Callpicker.
2. Administrador / Product Owner de Salesforce.
3. Responsable del area usuaria.
4. Responsable de tecnologia / integraciones.
Estos cuatro valen mas que cien contactos publicos. NINGUNO se tiene hoy.

- HEALTH CHECK PENDIENTE (todo por confirmar)
Tipo de integracion (CTI / API / a la medida), usuarios activos, DID, llamadas por
mes, entrantes vs salientes, abandono, ASA, AHT, grabacion, screen-pop,
click-to-call, creacion automatica de actividad, matching Lead/Case/Contact,
dispositions, reportes integrados, WhatsApp, SMS, bot/IA, fecha de renovacion, NPS
e incidencias de los ultimos 90 dias.

- OPORTUNIDAD RECOMENDADA
No empezar vendiendo mas telefonia. Iniciativa "Customer Interaction 360":
determinar cuanto del relacionamiento telefonico del campus queda realmente
trazado en Salesforce y cuanto conocimiento se pierde fuera del CRM.
Areas a explorar por volumen: Admisiones Profesional, PrepaTec Admisiones,
Educacion Continua y TECservices (las cuatro de mayor potencial), Posgrados,
Vinculacion empresarial e Inversion Educativa.

- CLASIFICACION
Enterprise, madurez digital muy alta, CRM estrategico, complejidad organizacional
muy alta, potencial de expansion muy alto si demostramos integracion y datos,
riesgo competitivo alto. Estrategia: Customer Success + arquitectura, no venta
transaccional.

- DIMENSION E INFRAESTRUCTURA (detalle)
Unidades del Campus Queretaro: Welcome Center de mas de 2,055 m2 que agrupa
Admisiones, Direcciones de Division, Direcciones de Programa y equipo directivo;
Residencias con 494 camas; Centro Estudiantil PrepaTec de 3,180 m2; ademas de
Educacion Continua, TECservices, Becas, Internacionalizacion y EXATEC. Cada una
es una unidad de atencion con necesidades de comunicacion propias.
Cifras institucionales 2025 del Tec (NO del campus): ~88,000 estudiantes de
prepa, profesional y posgrado (51,752 profesional, 6,825 posgrado) y ~142,000
participantes de Educacion Continua. El campus incorporo en 2026 tres programas
en ingles (Architecture, Marketing y Mechatronics Engineering) sobre siete
bachelors ya impartidos en ingles. El campus cumplio 50 anos en 2025.

- NOTA DE DATOS
El health score y sus sub-scores quedan en 50 (neutro) porque NO se han evaluado.
No se invento ninguna calificacion: se recalculan cuando se capture el Radar y
lleguen consumo y tickets por CID. Tampoco se estimo la matricula del campus:
las cifras de alumnos que aparecen son institucionales del Tec, no del campus."""

FILA = {
    'consecutivo': 'D58',
    # El nombre debe coincidir EXACTO con Zoho: de ese match sale la facturacion
    # viva. La razon social va en direccion_fiscal y grupo_empresarial.
    'empresa': 'University 4 People',
    'cid': '180839',
    'asesor': 'Dan',
    'estado': 'activo',
    'facturacion': 54060.0,
    'grupo_empresarial': 'Instituto Tecnologico y de Estudios Superiores de Monterrey (ITESM) - RFC ITE430714KI0. Campus Queretaro.',
    'giro': 'Educacion superior privada. Tec de Monterrey, Campus Queretaro: PrepaTec, Profesional, Posgrados, Educacion Continua, Admisiones, Becas, Residencias, Internacionalizacion, EXATEC y vinculacion empresarial. CRM institucional Salesforce desde 2016.',
    'tamano_empresa': 'Enterprise - institucion educativa nacional',
    'direccion_fiscal': 'Campus Queretaro: Epigmenio Gonzalez 500, San Pablo, 76130 Santiago de Queretaro, Qro. | Razon social: INSTITUTO TECNOLOGICO Y DE ESTUDIOS SUPERIORES DE MONTERREY | RFC: ITE430714KI0',
    'pagina_web': 'https://tec.mx/es/queretaro',
    # varchar(255): el detalle completo de las unidades vive en observaciones_kam.
    'num_oficinas': 'Campus Queretaro, unidad de la red nacional del Tec. Multiples unidades de atencion independientes: Welcome Center, Residencias (494 camas), PrepaTec, Educacion Continua, TECservices, Admisiones, Becas y EXATEC.',
    # varchar(255). Cifras INSTITUCIONALES, no del campus: no se estima la matricula local.
    'total_empleados': 'Cifras institucionales del Tec (NO del campus): ~88,000 estudiantes en 2025 y ~142,000 en Educacion Continua. Sin fuente verificable del headcount de Campus Queretaro.',
    # Contacto publico verificado. NO es el dueno operativo del servicio: ese es
    # justamente uno de los cuatro nombres que faltan (ver observaciones_kam).
    'contacto_nombre': 'Mtro. Pascual Alcocer Alcocer',
    'contacto_cargo': 'Director General Campus Queretaro - contacto publico verificado, NO es el dueno operativo del servicio Callpicker',
    'contacto_email': 'pascual.alcocer@tec.mx',
    'contacto_tel': '+52 442 238 3100',
    'contactos_json': [
        {'nombre': 'Mtro. Pascual Alcocer Alcocer', 'cargo': 'Director General Campus Queretaro - sponsor ejecutivo', 'email': 'pascual.alcocer@tec.mx', 'tel': '+52 442 238 3100'},
        {'nombre': 'Admisiones Queretaro', 'cargo': 'Atencion a aspirantes - prioridad muy alta', 'email': 'admisiones.qro@info.tec.mx', 'tel': ''},
        {'nombre': 'TECservices', 'cargo': 'Atencion y servicios multicanal - prioridad muy alta', 'email': 'tecservices@servicios.tec.mx', 'tel': ''},
        {'nombre': 'Educacion Continua', 'cargo': 'Captacion y seguimiento - prioridad muy alta', 'email': 'educacion.continua@itesm.mx', 'tel': '800 800 2114'},
        {'nombre': 'Becas Queretaro', 'cargo': 'Becas - prioridad alta', 'email': 'becas.qro@info.tec.mx', 'tel': ''},
        {'nombre': 'Inversion Educativa QRO', 'cargo': 'Atencion Campus Queretaro - prioridad alta', 'email': 'inversion.qro@info.tec.mx', 'tel': 'WhatsApp (446) 139-7835'},
        {'nombre': 'Asociacion EXATEC Queretaro', 'cargo': 'Egresados - prioridad media/alta', 'email': 'asociacion.queretaro@exatec.tec.mx', 'tel': ''},
        {'nombre': 'Jorge Alfredo Nunez', 'cargo': 'Prensa Campus Queretaro - prioridad media', 'email': 'jnunezc@tec.mx', 'tel': ''},
        {'nombre': 'Raquel Ortiz Ledesma', 'cargo': 'Servicio Social QRO - prioridad media', 'email': 'rortizle@tec.mx', 'tel': ''},
        {'nombre': 'Carles Abarca de Haro', 'cargo': 'VP Transformacion Digital, Grupo Educativo - muy alta relevancia estrategica. SIN correo publico verificado.', 'email': '', 'tel': ''},
        {'nombre': 'Claudia Felix Sandoval', 'cargo': 'VP Campus Centro-Occidente - relevancia regional. SIN correo vigente verificado.', 'email': '', 'tel': ''},
    ],
    'servicios_json': [
        {'nombre': 'Extension VyC - 170 licencias', 'descripcion': 'Factura 183476-5 del 01 ago 2026. 170 x $249.00 = $42,330.00'},
        {'nombre': 'Ofuscador - 170 licencias', 'descripcion': 'Factura 183476-5 del 01 ago 2026. 170 x $69.00 = $11,730.00'},
        {'nombre': 'Integracion con Salesforce', 'descripcion': 'Declarada en la ficha tecnica como solucion actual. Alcance real POR CONFIRMAR: no se sabe si es CTI, API o desarrollo a la medida, ni que automatiza.'},
    ],
    'notas': 'Factura 183476-5 (01 ago 2026): subtotal $54,060.00 + IVA $8,649.60 = $62,709.60, pagada, saldo $0. Zoho reporta MRR $58,975, acumulado recurrente $648,720, LTV 1-VIP, semaforo 0-Factura Futura, 11 meses activo, ultima factura 01 mar 2027.',
    'observaciones_kam': OBS,
    # `health_score` es columna generada: la calcula la base a partir de los
    # sub-scores. Insertarla da error 428C9.
    'score_actividad': 50, 'score_adopcion': 50,
    'score_pago': 50, 'score_relacional': 50,
    'pagos_al_corriente': True, 'incidencias_pago': 0,
    # Integracion con Salesforce declarada en la ficha tecnica.
    'tiene_integracion_api': True,
    'tiene_chat_activo': False, 'tiene_ia_voz': False, 'tiene_ia_chat': False,
    'tiene_pago_automatico': False,
    'tickets_abiertos': 0, 'dias_sin_actividad': 0,
    'llamadas_atendidas_pct': 0.0, 'llamadas_cambio_pct': 0.0,
    'dashboard_revisado': False,
}


def get(q):
    r = urllib.request.Request(URL + '/rest/v1/' + q, headers=H)
    return json.load(urllib.request.urlopen(r))


def main():
    ya = get('cuentas?select=id,consecutivo,empresa&cid=eq.180839')
    if ya:
        print('El CID 180839 ya existe:', ya[0]['consecutivo'], ya[0]['empresa'])
        print('No se duplica. Aborta.')
        return

    body = json.dumps(FILA, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(URL + '/rest/v1/cuentas', data=body, headers=H, method='POST')
    try:
        c = json.load(urllib.request.urlopen(req))[0]
    except urllib.error.HTTPError as e:
        print('ERROR', e.code, e.read().decode()[:600])
        return

    print('ALTA OK')
    for campo in ['id', 'consecutivo', 'empresa', 'cid', 'asesor', 'estado', 'facturacion', 'health_score']:
        print('  %-14s %s' % (campo, c[campo]))
    print('  %-14s %d' % ('contactos', len(c['contactos_json'])))
    print('  %-14s %d' % ('servicios', len(c['servicios_json'])))


if __name__ == '__main__':
    main()
