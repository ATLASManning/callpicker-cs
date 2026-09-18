"""Corrige D60 contra el esquema y el render REALES de la ficha.

   Escribi la cuenta con campos que la pantalla no muestra. Cuatro defectos
   encontrados leyendo app/cuentas/[id]/page.tsx y lib/types.ts:

   1. contactos_json usaba la llave `nota`. ContactoCuenta es
      {nombre, cargo, email, tel} (lib/types.ts:31) y el render pinta `ct.cargo`
      (page.tsx:311) — nunca `nota`. Las siete personas saldrian como nombres
      pelones. Y un campo vacio se rellena con invencion: justo lo que se queria
      evitar. La evidencia se pasa a `cargo` diciendo con palabras que el cargo
      NO esta confirmado.

   2. servicios_json usaba `nota`. ServicioCuenta es {nombre, descripcion}
      (lib/types.ts:38) y el render pinta `sv.descripcion` (page.tsx:255).

   3. total_empleados se pinta como «· {valor} empleados» (page.tsx:357). Mi
      parrafo de tres lineas ahi dentro se leia como basura. Va el rango corto;
      la advertencia ya vive en notas y en observaciones_kam.

   4. num_oficinas NO se pinta en la ficha (cero ocurrencias): solo lo consumen
      el detector de huecos y el enriquecimiento, y ahi se lee como «No. de
      sitios» con primerEntero(). Se deja corto -empieza con «2» para que
      primerEntero funcione- y la direccion completa de Queretaro se sube a
      observaciones_kam, que si se muestra.
"""
import sys, io, json, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
ESCRIBIR = '--escribir' in sys.argv

env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}
ID = '26a15fd8-92b2-4c3c-a9ca-a6045e9bb096'

NO_CONF = 'Cargo NO confirmado — verificar con el cliente'

CONTACTOS = [
    {'nombre': 'Conmutador general', 'cargo': 'Línea y correo generales — no es una persona',
     'tel': '55 8854 4330', 'email': 'info@supremeresources.com.mx'},
    {'nombre': 'Eduardo Díaz Landa',          'cargo': NO_CONF, 'tel': '', 'email': ''},
    {'nombre': 'Marielle Ruiz Olivera',       'cargo': NO_CONF, 'tel': '', 'email': ''},
    {'nombre': 'Fernando Vidauri Díaz',       'cargo': NO_CONF, 'tel': '', 'email': ''},
    {'nombre': 'Sandra Patricia de Paz Miguel',
     'cargo': 'Cargo NO confirmado — figura en el registro mercantil CDMX 2025 del domicilio',
     'tel': '', 'email': ''},
    {'nombre': 'Juan Luis Scarpio',
     'cargo': 'Cargo NO confirmado — perfil orientado a desarrollo de negocio', 'tel': '', 'email': ''},
    {'nombre': 'Itzel CE',                    'cargo': NO_CONF, 'tel': '', 'email': ''},
    {'nombre': 'Javier Martínez',
     'cargo': 'Cargo NO confirmado — perfil relacionado con Supply Chain', 'tel': '', 'email': ''},
]

SERVICIOS = [
    {'nombre': 'Visibilidad y Control 400 minutos',
     'descripcion': '$979/mes · corte 17 ago 2026 · consumo 9.75% (39 de 400 min)'},
]

OBS = """INTELIGENCIA DE CUENTA — SUPREME RESOURCES MÉXICO (actualizada 14 sep 2026)

QUÉ HACE REALMENTE. No es una empresa logística sin más: es distribuidor e
importador especializado + operador de cadena de suministro + proveedor de
químicos y materias primas. Importa desde plantas en Suiza, Bélgica y Gran
Bretaña, mantiene inventario local y distribuye en México y Centroamérica.

RELACIÓN ESTRATÉGICA. Distribuidor EXCLUSIVO de las moléculas aromáticas de
Givaudan para México y Centroamérica. Es el activo comercial más fuerte de la
cuenta y la razón por la que su operación pesa más que su tamaño.

MERCADOS QUE ATIENDE. Cuidado personal, resinas, adhesivos, construcción,
tintas, alimentos, farmacéutica, perfumería, cosmética, cuidado del hogar y
fragancias.

IDENTIDAD FISCAL (confianza alta). SUPREME RESOURCES MEXICO, S.A. DE C.V. ·
RFC SRM150506K25 · sector SAT: Productos Químicos · en el Padrón de
Importadores de Sectores Específicos, sector 1, desde el 29 oct 2018.

DOS SITIOS OPERATIVOS — son dos conversaciones de telefonía, no una:
· CDMX (sede y domicilio fiscal): Ana Bolena 63, Int. B, Col. La Nopalera,
  Alcaldía Tláhuac, C.P. 13220.
· Querétaro (operación): Carretera Estatal 431 Km 1, Nave 20 N, Conjunto
  Industrial PKCo, El Colorado, El Marqués, C.P. 76246.
Preguntar en la primera sesión si Querétaro tiene línea propia o cuelga de CDMX.

POR QUÉ IMPORTA PARA CALLPICKER. Su head count declarado (11–50 en LinkedIn)
subestima la complejidad: su propia bolsa de trabajo recibe candidatos para
almacén, atención a clientes, compras, contabilidad, facturación, calidad,
laboratorio de aplicaciones, mercadotecnia, planeación de demanda, RR.HH.,
sistemas, tesorería, tráfico y ventas. Comercio internacional, químicos
regulados, inventarios y dos sitios. El potencial de comunicaciones NO debe
medirse por número de empleados.

LECTURA KAM. PYME especializada por head count, con complejidad operacional
superior a su tamaño. Y hoy consume 39 de 400 minutos incluidos (9.75% en el
corte de agosto): paga por una capacidad que su operación no está usando. Esa
es la conversación, y no es de recorte — es de por qué catorce áreas distintas
y dos sitios no están pasando por el conmutador.

LO QUE NO SE SABE Y NO SE INVENTÓ. El head count exacto no está publicado. De
las siete personas identificadas públicamente, LinkedIn no expone el cargo
actual de ninguna de forma fiable: van registradas por nombre y marcadas como
«cargo NO confirmado». Tampoco hay mapa de decisores ni se sabe quién autoriza
el gasto."""

PARCHE = {
    'contactos_json': CONTACTOS,
    'servicios_json': SERVICIOS,
    'observaciones_kam': OBS,
    'total_empleados': '11–50',
    'num_oficinas': '2 sitios: CDMX (sede) y El Marqués, Querétaro',
}

print('=== CORRECCION D60 ===')
for k, v in PARCHE.items():
    if isinstance(v, list):
        print('  %-18s %d entrada(s) con el esquema real' % (k, len(v)))
    else:
        print('  %-18s %s' % (k, str(v)[:70].replace('\n', ' ') + ('...' if len(str(v)) > 70 else '')))
print()
print('  render comprobado: total_empleados -> «· %s empleados»' % PARCHE['total_empleados'])

if not ESCRIBIR:
    print()
    print('SIMULACION. Nada escrito.')
    raise SystemExit(0)

r = urllib.request.Request(URL + '/rest/v1/cuentas?id=eq.' + ID,
                           data=json.dumps(PARCHE).encode(),
                           headers=dict(H, **{'Prefer': 'return=representation'}),
                           method='PATCH')
c = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())[0]
print()
print('=== ACTUALIZADA ===')
print('  contactos: %d · servicios: %d' % (len(c['contactos_json']), len(c['servicios_json'])))
for x in c['contactos_json']:
    print('    %-32s %s' % (x['nombre'], x['cargo']))
print('  servicio : %s — %s' % (c['servicios_json'][0]['nombre'], c['servicios_json'][0]['descripcion']))
print('  empleados: %s' % c['total_empleados'])
print('  sitios   : %s' % c['num_oficinas'])
