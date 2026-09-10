"""
Alta de la cuenta TATSA - Tanques y Equipos para Gas, S.A. de C.V. (D59).

Instruccion de direccion (9 sep 2026): alta como cuenta TOP con carga a Dan
Dominguez. Origen: recomendacion de los duenos de CBS Compresores a Jose Manuel
Lopez Delgadillo; visita coordinada por Jose Manuel; demo en oficinas de Av.
Vallarta (jun 2026).

Fuentes de los datos:
  - Ficha tecnica entregada por direccion (9 sep 2026).
  - Aviso de privacidad del propio sitio de TATSA (razon social + RFC).
  - Portal comercial tanquesestacionarios.com (sucursales, telefonos, equipo).
  - WhatsApp del 17 jun 2026 (participantes del demo).

REGLA APLICADA: no se inventa ningun dato. Lo que no vino verificado se deja
vacio y se marca con palabras, para que el dashboard lo pida en vez de que la
IA lo rellene. Ver [[contexto-ia-sin-huecos]].

Se ejecuta una sola vez. Es idempotente: si D59 ya existe, actualiza en vez de
duplicar. Verifica primero con --dry-run.
"""
import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = '--aplicar' not in sys.argv

env = {}
for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"')

URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['SUPABASE_SERVICE_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
     'Content-Type': 'application/json', 'Prefer': 'return=representation'}

CONSECUTIVO = 'D59'

# ── Contactos ────────────────────────────────────────────────────────────────
# Ricardo Lopez es el contacto directo. Su correo NO vino en la ficha y NO se
# inventa: los correos publicados (tmkt@, ventas@, ventas2@) son buzones
# generales de la empresa, no suyos. Dejarlo vacio hace que elegibilidad.ts
# marque la cuenta como "contacto incompleto" y genere una actividad de
# Completar Perfil — que es exactamente lo que debe pasar.
CONTACTOS = [
    {'nombre': 'Ricardo Lopez', 'cargo': 'Director Comercial - contacto directo de la cuenta',
     'tel': '33 3627 1950', 'email': '',
     'nota': 'Telefono es el de la matriz Vallarta; su extension o directo NO vino en la ficha. Correo por capturar. Ya hubo conversacion con el sobre telefonia, Callpicker Chat y Asistente Virtual.'},

    # Participantes del demo (WhatsApp 17 jun 2026). Se registran con nombre y
    # rol porque son los stakeholders reales de la decision; sus datos de
    # contacto no se publicaron y no se inventan.
    {'nombre': 'Zandra Lopez', 'cargo': 'Direccion / familia propietaria - hermana de Ricardo',
     'tel': '', 'email': '', 'nota': 'Participante del demo (WhatsApp 17 jun 2026). Datos de contacto por capturar.'},
    {'nombre': 'Alexis [apellido por capturar]', 'cargo': 'Ventas y Marketing',
     'tel': '', 'email': '', 'nota': 'Participante del demo (WhatsApp 17 jun 2026). Datos de contacto por capturar.'},
    {'nombre': 'Willy [apellido por capturar]', 'cargo': 'Pautas de Facebook',
     'tel': '', 'email': '', 'nota': 'Participante del demo (WhatsApp 17 jun 2026). Relevante para Callpicker Chat: es quien opera la pauta que genera los mensajes entrantes.'},
    {'nombre': 'Joaquin [apellido por capturar]', 'cargo': 'Sistemas',
     'tel': '', 'email': '', 'nota': 'Participante del demo (WhatsApp 17 jun 2026). Interlocutor tecnico para la PBX Panasonic y la integracion.'},

    # Contactos publicos de sucursales foraneas (portal comercial de TATSA).
    {'nombre': 'Patricia Saenz', 'cargo': 'Sucursal Chihuahua',
     'tel': '614 414 0414', 'email': 'chihuahua@tanquesparagastatsa.com',
     'nota': 'WhatsApp publicado 614 495 1718. Fuente: portal comercial TATSA.'},
    {'nombre': 'Cassandra Gutierrez', 'cargo': 'Sucursal Merida',
     'tel': '999 546 6696', 'email': 'merida@tanquesparagastatsa.com',
     'nota': 'Fuente: portal comercial TATSA.'},
    {'nombre': 'Elvira Fernanda Moreno Flores', 'cargo': 'Sucursal Puerto Vallarta',
     'tel': '322 596 0969', 'email': 'ptovallarta@tanquesparagastatsa.com',
     'nota': 'WhatsApp publicado 322 202 5627. Fuente: portal comercial TATSA.'},
]

# ── Servicios ────────────────────────────────────────────────────────────────
SERVICIOS = [
    {'nombre': 'Callpicker - 8 sitios atendidos',
     'descripcion': 'Cobertura ACTUAL de Callpicker. NO confundir con los 10 puntos comerciales publicos de TATSA: la huella comercial es mayor que la cobertura contratada. Diferencia = oportunidad de expansion.'},
    {'nombre': '11 DIDs / lineas telefonicas',
     'descripcion': 'Distribuidas entre los 8 sitios atendidos. El desglose por sucursal NO vino en la ficha: por capturar.'},
    {'nombre': 'PBX Panasonic en matriz Vallarta - 4 extensiones',
     'descripcion': 'Conmutador heredado que la matriz conserva. Es el punto de friccion tecnico y la palanca natural de migracion.'},
]

OBS_KAM = """INTELIGENCIA DE CUENTA - TATSA (Tanques y Equipos para Gas, S.A. de C.V.)
Ficha entregada por direccion, 9 sep 2026.

- COMO LLEGA ESTA CUENTA
Recomendacion directa de los duenos de CBS Compresores a Jose Manuel Lopez
Delgadillo. Jose Manuel coordino la visita y de ahi se detona todo. Importa
registrarlo: es una cuenta de referido, no de prospeccion fria. El costo de
perderla incluye el capital de la relacion con CBS Compresores.

- QUE ES TATSA
Comercializadora de tanques estacionarios, cilindros y equipos para gas,
calentadores, tinacos y cisternas. Red comercial publica de al menos 10 puntos:
7 en la Zona Metropolitana de Guadalajara (Vallarta, Lopez Mateos, Laureles,
Chapalita, Medrano, Ninos Heroes, Plan de San Luis) mas Chihuahua, Merida y
Puerto Vallarta.

- EL DATO QUE NO HAY QUE CONFUNDIR
Callpicker atiende 8 sitios; TATSA publica 10 puntos comerciales. NO son el
mismo numero y no deben mezclarse en ningun reporte. La diferencia de 2 sitios
es, literalmente, la oportunidad de expansion mas concreta de la cuenta.
Estructura: matriz Vallarta -> sucursales -> 11 DIDs -> PBX/telefonia -> Callpicker.

- LA PALANCA TECNICA
La matriz conserva una PBX Panasonic con 4 extensiones. Es infraestructura
heredada conviviendo con Callpicker: el argumento de consolidacion esta ahi, y
Joaquin (Sistemas) es el interlocutor.

- EL COMITE REAL DE DECISION (demo jun 2026)
No es una venta de una sola persona. Al demo en oficinas de Av. Vallarta
asistieron Ricardo Lopez, Zandra (su hermana, direccion), Alexis (ventas y
marketing), Willy (pautas de Facebook) y Joaquin (sistemas). Que el responsable
de la pauta de Facebook este en la mesa es la senal mas clara de por que Chat y
Asistente Virtual encajan: la pauta genera mensajes entrantes que hoy nadie
atiende con estructura.

- OPORTUNIDAD ABIERTA
Ya hubo conversacion con Ricardo Lopez sobre telefonia, Callpicker Chat y
Asistente Virtual. El demo de junio quedo agendado en la matriz. Pendiente
confirmar en que quedo.

- DISCREPANCIA DE DOMICILIO (registrar, no corregir a ciegas)
Padrones y directorios anteriores manejan Av. Vallarta 6235, Ciudad Granja,
C.P. 45010. La informacion corporativa vigente publica Vallarta 6220-B,
Jocotan, C.P. 45017. Para Callpicker se usa 6220-B como domicilio operativo
vigente; el anterior se conserva aqui por si aparece en facturacion o padrones.

- PROPIEDAD: LO CONFIRMADO Y LO SUPUESTO
Andres Lopez Alvarez aparece en registros publicos del Ayuntamiento de Zapopan
asociado a la sociedad, y hay antecedentes legales donde figura como apoderado.
NO hay evidencia publica reciente para afirmar que hoy sea Director General: no
se le asigna ese cargo. Ricardo Lopez consta como propietario/contacto
relevante por informacion interna de cuenta, no por cargo publicamente
verificado.

- EQUIPO COMERCIAL PUBLICADO EN EL PORTAL
Ejecutivas de Ventas: Dana Nazareth Gutierrez Gallegos, Irma Gomez Castillo,
Joselinee Acevedo Aragon, Luz Livier Aceves Gallegos, Ma. de la Luz Gallegos
Ramos, Sandra Margarita Ceja Villanueva, Veronica Jimenez Sanchez.
Telemarketing: Ma. Belen Romero Villalobos.
Ocho personas en funcion telefonica: es el tamano real del piso que Callpicker
sirve, y la base para dimensionar licencias frente a las 4 extensiones de la
PBX heredada."""

NOTAS = """[FALTA_TC] Alta 9 sep 2026 por instruccion de direccion. Cuenta TOP (D59).

DATOS QUE FALTAN Y POR QUE IMPORTAN — no se inventaron:
- CID de Zoho: SIN CAPTURAR. Sin el, esta cuenta no cruza con Tickets ni con
  Facturacion; sus metricas por cuenta quedaran vacias. Al intentar obtenerlo el
  9 sep 2026, /api/facturacion devolvia source=empty (Zoho sin datos).
- Facturacion mensual: SIN CAPTURAR. Mientras siga en 0 la cuenta se clasifica
  "0 - Factura Futura" y aparece tambien en Cuentas > Dormidas por la regla de
  "sin facturacion". No es que este dormida: es que falta el dato.
- Correo de Ricardo Lopez: SIN CAPTURAR. Los correos publicados (tmkt@,
  ventas@, ventas2@) son buzones generales, no suyos. Por eso la cuenta figura
  con contacto incompleto y recibira una actividad de Completar Perfil.
- Fecha de inicio como cliente (activo_desde): SIN CAPTURAR.
- Desglose de los 11 DIDs por sucursal: SIN CAPTURAR.

Health Score en 50 por omision: es el neutro del sistema para una cuenta sin
historial medido en el dashboard, no una evaluacion."""

FILA = {
    'consecutivo':       CONSECUTIVO,
    'empresa':           'TATSA',
    'grupo_empresarial': 'Tanques y Equipos para Gas, S.A. de C.V. - RFC TEG8607245F9',
    'asesor':            'Dan',
    'estado':            'activo',
    'cid':               None,
    'facturacion':       0,
    'giro':              'Comercializacion de tanques estacionarios, cilindros y equipos para gas, calentadores, tinacos, cisternas y productos relacionados. Actividad historica registrada: compra-venta de equipos para gas licuado.',
    'servicio':          'Callpicker en 8 sitios - 11 DIDs - PBX Panasonic (4 ext) en matriz',
    'tamano_empresa':    'Mediana - red comercial multisucursal (10 puntos publicos: 7 ZMG + Chihuahua, Merida, Puerto Vallarta)',
    'num_oficinas':      '10 puntos comerciales publicos; Callpicker atiende 8. NO son el mismo numero.',
    'total_empleados':   'Sin cifra corporativa publicada. El portal publica 8 personas en funcion telefonica: 7 Ejecutivas de Ventas + 1 Telemarketing.',
    'pagina_web':        'https://tanquesestacionarios.com',
    'direccion_fiscal':  'Av. Ignacio L. Vallarta 6220-B, Jocotan, Zapopan, Jalisco, C.P. 45017 (domicilio operativo vigente) | Historico en padrones: Av. Vallarta 6235, Ciudad Granja, C.P. 45010',
    'contacto_nombre':   'Ricardo Lopez',
    'contacto_cargo':    'Director Comercial',
    'contacto_tel':      '33 3627 1950',
    'contacto_email':    None,
    'contactos_json':    CONTACTOS,
    'servicios_json':    SERVICIOS,
    'upsell_producto':   'Callpicker Chat + Asistente Virtual (demo en matriz Vallarta, jun 2026)',
    'crossell_producto': 'Consolidacion de la PBX Panasonic de matriz (4 ext) + 2 sitios comerciales sin cobertura Callpicker',
    'observaciones_kam': OBS_KAM,
    'notas':             NOTAS,
    'score_actividad':   50,
    'score_adopcion':    50,
    'score_pago':        50,
    'score_relacional':  50,
}


def req(method, path, body=None):
    r = urllib.request.Request(URL + '/rest/v1/' + path, method=method, headers=H,
                               data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(r, timeout=90) as x:
            raw = x.read().decode('utf-8', 'replace')
            return x.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')


st, ya = req('GET', 'cuentas?select=id,consecutivo,empresa,asesor,estado&consecutivo=eq.' + CONSECUTIVO)
existe = isinstance(ya, list) and len(ya) > 0

print('=== ALTA TATSA (%s) ===' % CONSECUTIVO)
print('consecutivo libre : %s' % ('NO — ya existe %s' % ya if existe else 'si'))
for k in ('empresa', 'asesor', 'estado', 'cid', 'facturacion', 'contacto_nombre',
          'contacto_cargo', 'contacto_email'):
    print('  %-18s %s' % (k, FILA[k]))
print('  %-18s %d' % ('contactos_json', len(CONTACTOS)))
print('  %-18s %d' % ('servicios_json', len(SERVICIOS)))

if DRY:
    print('\nSIMULACRO. Ejecuta con --aplicar para escribir.')
    raise SystemExit(0)

if existe:
    st, out = req('PATCH', 'cuentas?consecutivo=eq.' + CONSECUTIVO, FILA)
    print('\nPATCH -> HTTP %s' % st)
else:
    st, out = req('POST', 'cuentas', FILA)
    print('\nPOST -> HTTP %s' % st)

if st not in (200, 201):
    print(out)
    raise SystemExit(1)

fila = out[0] if isinstance(out, list) and out else out
print('id           : %s' % fila.get('id'))
print('consecutivo  : %s' % fila.get('consecutivo'))
print('health_score : %s  (columna generada)' % fila.get('health_score'))
print('\nOK. Falta capturar: CID, facturacion, correo de Ricardo Lopez, activo_desde,')
print('y el desglose de los 11 DIDs por sucursal.')
