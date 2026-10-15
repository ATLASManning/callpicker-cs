# -*- coding: utf-8 -*-
"""Prueba AL REVES el candado de dueno: que lo que NO debe entrar no entra.

   POR QUE EXISTE
   --------------
   El 15 oct 2026 se cerraron las rutas que no comprobaban de quien son los
   datos (auditoria adversarial del 6 oct). Una regla de acceso solo se prueba
   metiendole lo que NO debe pasar, asi que esto no comprueba que el tablero
   funcione: comprueba que NIEGA.

   Y comprueba la otra mitad, que es la que se olvida: que quien SI debe seguir
   entrando sigue entrando. Un candado que deja fuera a la administracion no
   esta bien puesto, esta roto.

   TRES PERSONAJES
   ---------------
     1. asesor CON cartera  — ve lo suyo, y NO lo de las otras dos.
     2. asesor SIN cartera  — el caso fail-open del hallazgo: con el rol puesto
                              y el nombre vacio, el filtro desaparecia y se
                              servia la empresa entera. Debe recibir 403.
     3. admin               — lo sigue viendo TODO. Es la escotilla.

   EL SECRETO NUNCA SE IMPRIME. Se lee de .env.local, se usa para firmar y no
   aparece en la salida ni en los errores.

   COMO SE LEE LA SALIDA
   ---------------------
   Cada sonda dice que esperaba y que recibio. Corrido ANTES de desplegar el
   arreglo, los FALLA son la prueba de que la fuga era real. Despues de
   desplegar, cualquier FALLA es trabajo sin terminar.

   USO
   ---
       python scripts/prueba-dueno-rutas.py [--base URL] [--con-chat]

   `--con-chat` agrega la sonda de Atlas IA, que gasta una llamada a OpenAI.
"""
import base64
import hashlib
import hmac
import io
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://callpicker-cs.vercel.app'
CON_CHAT = '--con-chat' in sys.argv
CON_ESCRITURA = '--con-escritura' in sys.argv
if '--base' in sys.argv:
    BASE = sys.argv[sys.argv.index('--base') + 1]
BASE = BASE.rstrip('/')

# Toda fila que esta prueba llegue a crear lleva esta marca en su texto, y al
# final se borra buscandola. Si el candado funciona no se crea ninguna; la
# limpieza existe para el caso en que NO funcione, que es justo cuando se
# ensucia la base de un cliente real.
MARCA = 'PRUEBA-CANDADO-DUENO-NO-BORRAR-A-MANO'

E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")

_SECRETO = E['JWT_SECRET'].encode('utf-8')      # no se imprime nunca
SB = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
      'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY']}


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or ''))
                if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]', '', s)


def b64(b):
    return base64.urlsafe_b64encode(b).rstrip(b'=')


def firma(payload):
    """JWT HS256 con la libreria estandar — `jose` no existe en Python."""
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'},
                         separators=(',', ':')).encode())
    cue = b64(json.dumps(payload, separators=(',', ':')).encode())
    firmado = cab + b'.' + cue
    mac = hmac.new(_SECRETO, firmado, hashlib.sha256).digest()
    return (firmado + b'.' + b64(mac)).decode()


def token(email, rol, asesor_nombre, nombre='Prueba'):
    ahora = int(time.time())
    return firma({
        'email': email, 'nombre': nombre, 'rol': rol,
        'asesor_nombre': asesor_nombre,
        'iat': ahora, 'exp': ahora + 600,
    })


def pide(ruta, tok, metodo='GET', cuerpo=None):
    """Devuelve (status, texto). No sigue redirecciones: un 307 a /acceso ES
       el resultado, y seguirlo lo convertiria en un 200 enganoso."""
    url = BASE + ruta
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(url, data=datos, method=metodo)
    req.add_header('Cookie', 'cp_session=' + tok)
    if datos:
        req.add_header('Content-Type', 'application/json')

    class SinRedir(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None

    op = urllib.request.build_opener(SinRedir)
    try:
        r = op.open(req, timeout=90)
        return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as ex:
        return ex.code, ex.read().decode('utf-8', 'replace')
    except urllib.error.URLError as ex:
        return 0, 'URLError: %s' % ex.reason


def trae_sb(tabla, select, extra=''):
    url = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/' + tabla + '?select=' + select + extra
    return json.load(urllib.request.urlopen(
        urllib.request.Request(url, headers=SB), timeout=60))


# ── Material de prueba: una cuenta de cada cartera ───────────────────────
CUENTAS = trae_sb('cuentas', 'id,empresa,asesor', '&limit=5000')
por_asesor = {}
for c in CUENTAS:
    por_asesor.setdefault(norm(c.get('asesor')), []).append(c)

if 'claudia' not in por_asesor or 'dan' not in por_asesor:
    print('No puedo armar la prueba: faltan cuentas de Claudia o de Dan.')
    sys.exit(2)

MIA   = por_asesor['claudia'][0]     # de Claudia — la sesion de prueba
AJENA = por_asesor['dan'][0]         # de Dan — lo que NO debe ver

ANEXOS = trae_sb('anexos', 'id,cuenta_id', '&limit=500')
id_por_cuenta = {a['cuenta_id']: a['id'] for a in ANEXOS if a.get('cuenta_id')}
anexo_ajeno = next((id_por_cuenta[c['id']] for c in por_asesor['dan']
                    if c['id'] in id_por_cuenta), None)
anexo_mio = next((id_por_cuenta[c['id']] for c in por_asesor['claudia']
                  if c['id'] in id_por_cuenta), None)

T_CON   = token('claudia@callpicker.com', 'asesor', 'Claudia')
T_SIN   = token('claudia@callpicker.com', 'asesor', '')        # fail-open
T_ADMIN = token('lopezdjosemanuel@gmail.com', 'admin', '')

def espera_despliegue(tok, minutos=8):
    """Espera a que el codigo de ESTE cambio este sirviendo en linea.

       Existe porque «lo desplegue» no es «lo estan viendo»: un build que aun
       no termina deja servida la compilacion anterior, y entonces una sonda en
       falla no distingue «el codigo no esta en linea» de «el codigo esta mal».
       Se depuran las dos cosas a la vez y se pierde la tarde.

       La marca es `candado` en /api/relacionamiento, que lleva la version de
       lib/dueno.ts. Se compara contra la del archivo LOCAL, que es el codigo
       que se acaba de escribir.

       La primera version de esto miraba solo si el campo `alcance` existia, y
       eso no servia: el campo ya estaba del despliegue anterior, asi que daba
       verde con el build viejo en linea. Una marca que no cambia no es una
       marca."""
    esperada = None
    for ln in io.open(os.path.join(RAIZ, 'lib', 'dueno.ts'), encoding='utf-8'):
        m = re.search(r"CANDADO_VERSION\s*=\s*'([^']+)'", ln)
        if m:
            esperada = m.group(1)
            break
    if not esperada:
        print('  No encontre CANDADO_VERSION en lib/dueno.ts — no puedo esperar.')
        return False
    print('  Esperando la version: %s' % esperada)
    limite = time.time() + minutos * 60
    intento = 0
    while time.time() < limite:
        intento += 1
        st, tx = pide('/api/relacionamiento', tok)
        if st == 200 and ('"candado":"%s"' % esperada) in tx.replace(' ', ''):
            print('  Despliegue EN LINEA (intento %d).' % intento)
            return True
        viva = re.search(r'"candado"\s*:\s*"([^"]*)"', tx)
        print('  ...aun sirve %s (intento %d, status %d)'
              % (viva.group(1) if viva else 'un build sin marca', intento, st))
        time.sleep(20)
    print('  NO LLEGO en %d min. Las sondas de abajo medirian el build VIEJO:' % minutos)
    print('  no se puede concluir nada de ellas. Revisar el build en Vercel.')
    return False


if '--espera-despliegue' in sys.argv:
    print('Esperando a que el despliegue entre...')
    if not espera_despliegue(token('lopezdjosemanuel@gmail.com', 'admin', '')):
        sys.exit(2)
    print()

print('Base:', BASE)
print('Cuenta propia : %s' % MIA['empresa'])
print('Cuenta ajena  : %s (Dan)' % AJENA['empresa'])
print('Anexo ajeno   : %s' % (anexo_ajeno or 'no hay — esa sonda se omite'))
print()

fallos = []
omitidas = []


def sonda(titulo, tok, ruta, espera, metodo='GET', cuerpo=None):
    """`espera` recibe (status, texto) y devuelve (ok, que_paso)."""
    st, tx = pide(ruta, tok, metodo, cuerpo)
    ok, detalle = espera(st, tx)
    print('  %-5s %-62s %s' % ('OK' if ok else 'FALLA', titulo, detalle))
    if not ok:
        fallos.append(titulo)


def filas(tx):
    """Cuenta elementos de una respuesta, sea lista o {rows|leads|filas}."""
    try:
        d = json.loads(tx)
    except Exception:
        return None
    if isinstance(d, list):
        return len(d)
    for k in ('rows', 'leads', 'filas', 'candidatos'):
        if isinstance(d.get(k), list):
            return len(d[k])
    return None


N_MIAS  = len(por_asesor['claudia'])
N_TODAS = len(CUENTAS)

print('=' * 100)
print('1. EL ASESOR SIN CARTERA (fail-open) — con el rol puesto y el nombre vacio')
print('=' * 100)
print('   Lo que NO debe pasar: que se le sirva la empresa entera.')

def niega(st, tx):
    n = filas(tx)
    if st == 403:
        return True, '403 — niega, correcto'
    if st in (307, 302):
        return True, '%d — rebota a /acceso, correcto' % st
    if n is not None and n == 0:
        return True, '200 con 0 filas — vacio, aceptable'
    return False, 'status %d%s  <-- SE LE SIRVIO' % (
        st, ' con %d filas' % n if n is not None else '')

sonda('GET /api/cuentas  (sin cartera)',             T_SIN, '/api/cuentas', niega)
sonda('GET /api/anexos  (sin cartera)',              T_SIN, '/api/anexos', niega)
sonda('GET /api/leads  (sin cartera)',               T_SIN, '/api/leads', niega)
sonda('GET /api/relacionamiento  (sin cartera)',     T_SIN, '/api/relacionamiento', niega)

print()
print('=' * 100)
print('2. EL ASESOR CON CARTERA PIDIENDO LO AJENO')
print('=' * 100)
print('   Lo que NO debe pasar: que reciba datos de la cartera de Dan.')

def no_encontrado(st, tx):
    if st in (403, 404):
        return True, '%d — niega, correcto' % st
    return False, 'status %d  <-- ENTREGO DATO AJENO' % st

sonda('GET /api/cuentas/[id ajeno]',        T_CON, '/api/cuentas/%s' % AJENA['id'], no_encontrado)
sonda('GET /api/adopcion?cuentaId=ajeno',   T_CON, '/api/adopcion?cuentaId=%s' % AJENA['id'], no_encontrado)
sonda('GET /api/radar?cuentaId=ajeno',      T_CON, '/api/radar?cuentaId=%s' % AJENA['id'], no_encontrado)
sonda('GET /api/seguimientos?cuenta_id=ajeno', T_CON, '/api/seguimientos?cuenta_id=%s' % AJENA['id'], no_encontrado)
sonda('GET /api/anexos?cuenta_id=ajeno',    T_CON, '/api/anexos?cuenta_id=%s' % AJENA['id'], no_encontrado)

def pagina_404(st, tx):
    if st == 404:
        return True, '404 — notFound, correcto'
    if st == 200 and AJENA['empresa'][:18].lower() not in tx.lower():
        return True, '200 pero sin el nombre del cliente — no lo pinto'
    return False, 'status %d  <-- PINTO LA FICHA AJENA' % st

sonda('GET /cuentas/[id ajeno]  (pagina)',  T_CON, '/cuentas/%s' % AJENA['id'], pagina_404)

def zoho_niega(st, tx):
    if st in (403, 404):
        return True, '%d — niega, correcto' % st
    try:
        d = json.loads(tx)
        if not d.get('acumulado') and not d.get('factura_mensual'):
            return True, '200 pero sin cifras — vacio'
    except Exception:
        pass
    return False, 'status %d  <-- ENTREGO FACTURACION AJENA' % st

sonda('GET /api/zoho-lookup?empresa=ajena', T_CON,
      '/api/zoho-lookup?empresa=' + urllib.parse.quote(AJENA['empresa']), zoho_niega)

if anexo_ajeno:
    def descarga_niega(st, tx):
        if st in (403, 404):
            return True, '%d — niega, correcto' % st
        return False, 'status %d  <-- DESCARGO DOCUMENTO DE CLIENTE AJENO' % st
    sonda('GET /api/anexos/[id ajeno]/descargar', T_CON,
          '/api/anexos/%s/descargar' % anexo_ajeno, descarga_niega)
else:
    omitidas.append('descarga de anexo ajeno (no hay anexos en la cartera de Dan)')

def cuentas_acotadas(st, tx):
    n = filas(tx)
    if st != 200 or n is None:
        return False, 'status %d — no pude medir' % st
    if n == N_MIAS:
        return True, '%d filas = su cartera exacta' % n
    if n >= N_TODAS:
        return False, '%d filas de %d  <-- LA EMPRESA ENTERA' % (n, N_TODAS)
    return False, '%d filas (su cartera son %d)' % (n, N_MIAS)

sonda('GET /api/cuentas  (debe traer SOLO sus %d)' % N_MIAS, T_CON, '/api/cuentas', cuentas_acotadas)

def ignora_param(st, tx):
    """Un asesor pidiendo ?asesor=Dan debe recibir LO SUYO, no lo de Dan."""
    n = filas(tx)
    if st in (403, 404):
        return True, '%d — niega, correcto' % st
    if st == 200 and n == N_MIAS:
        return True, '%d filas = su cartera; ignoro el parametro' % n
    if st == 200 and n == len(por_asesor['dan']):
        return False, '%d filas = LA CARTERA DE DAN  <-- OBEDECIO EL PARAMETRO' % n
    return False, 'status %d con %s filas' % (st, n)

sonda('GET /api/cuentas?asesor=Dan  (debe ignorarlo)', T_CON, '/api/cuentas?asesor=Dan', ignora_param)

if CON_ESCRITURA:
    print()
    print('=' * 100)
    print('3. ESCRITURA EN CARTERA AJENA, Y FIRMANDO CON OTRO NOMBRE')
    print('=' * 100)
    print('   Lo que NO debe pasar: escribir donde no le toca, ni firmar como Dan.')
    print('   OJO: estas sondas ESCRIBEN. Si el candado no esta puesto, las filas')
    print('   entran de verdad en la base del cliente — se borran al final por su')
    print('   marca, y lo que no se pueda borrar se avisa.')

    sonda('POST /api/seguimientos  (cuenta ajena)', T_CON, '/api/seguimientos', no_encontrado,
          'POST', {'cuenta_id': AJENA['id'], 'asesor': 'Dan', 'tipo': 'llamada',
                   'descripcion': MARCA + ' — no debe entrar',
                   'fecha': '2026-10-15'})

    sonda('POST /api/adopcion  (cuenta ajena)', T_CON, '/api/adopcion', no_encontrado,
          'POST', {'cuenta_id': AJENA['id'], 'asesor': 'Dan',
                   'productos': [{'producto': 'Chat', 'nivel': 'alto',
                                  'notas': MARCA}]})

    sonda('POST /api/radar  (cuenta ajena)', T_CON, '/api/radar', no_encontrado,
          'POST', {'cuenta_id': AJENA['id'], 'asesor': 'Dan',
                   'respuestas': {'marca': MARCA},
                   'score_atlas': 1, 'nivel_atlas': 'bajo'})

    def firma_forzada(st, tx):
        """Escribe en SU cuenta pero firmando como Dan: debe entrar con su nombre."""
        if st not in (200, 201):
            return False, 'status %d — no pude comprobar la firma' % st
        try:
            d = json.loads(tx)
        except Exception:
            return False, 'respuesta no-JSON'
        quien = norm(d.get('asesor') if isinstance(d, dict) else '')
        if quien == 'claudia':
            return True, 'guardado y firmado «Claudia» — forzo la sesion'
        if quien == 'dan':
            return False, 'guardado firmado «Dan»  <-- RASTRO FALSO'
        return False, 'guardado con asesor=%r' % quien

    sonda('POST /api/seguimientos en SU cuenta firmando «Dan»', T_CON, '/api/seguimientos',
          firma_forzada, 'POST',
          {'cuenta_id': MIA['id'], 'asesor': 'Dan', 'tipo': 'llamada',
           'descripcion': MARCA + ' — se espera que quede firmado Claudia',
           'fecha': '2026-10-15'})
else:
    omitidas.append('escritura en cartera ajena (correr con --con-escritura; '
                    'ESCRIBE en la base real)')

print()
print('=' * 100)
print('4. LA ESCOTILLA — administracion lo sigue viendo TODO')
print('=' * 100)
print('   Lo que NO debe pasar: que el candado deje fuera a quien si debe entrar.')

def admin_ve_todo(st, tx):
    n = filas(tx)
    if st != 200:
        return False, 'status %d  <-- EL CANDADO EXPULSO AL ADMIN' % st
    if n is not None and n >= N_TODAS:
        return True, '200 con %d filas = cartera completa' % n
    return False, '200 pero solo %s filas de %d  <-- LE RECORTO' % (n, N_TODAS)

def admin_200(st, tx):
    if st == 200:
        return True, '200 — entra, correcto'
    return False, 'status %d  <-- EL CANDADO EXPULSO AL ADMIN' % st

sonda('GET /api/cuentas  (admin, las %d)' % N_TODAS, T_ADMIN, '/api/cuentas', admin_ve_todo)
sonda('GET /api/cuentas/[id de Dan]  (admin)', T_ADMIN, '/api/cuentas/%s' % AJENA['id'], admin_200)
sonda('GET /cuentas/[id de Dan]  (admin, pagina)', T_ADMIN, '/cuentas/%s' % AJENA['id'], admin_200)
sonda('GET /api/anexos  (admin)', T_ADMIN, '/api/anexos', admin_200)
sonda('GET /api/relacionamiento  (admin)', T_ADMIN, '/api/relacionamiento', admin_200)
sonda('GET /api/zoho-lookup  (admin, cuenta de Dan)', T_ADMIN,
      '/api/zoho-lookup?empresa=' + urllib.parse.quote(AJENA['empresa']), admin_200)

print()
print('=' * 100)
print('5. EL ASESOR CON CARTERA SIGUE TRABAJANDO')
print('=' * 100)
print('   Lo que NO debe pasar: que el candado le quite lo suyo.')

sonda('GET /api/cuentas/[id propio]',  T_CON, '/api/cuentas/%s' % MIA['id'], admin_200)
sonda('GET /cuentas/[id propio]  (pagina)', T_CON, '/cuentas/%s' % MIA['id'], admin_200)
sonda('GET /api/adopcion?cuentaId=propio', T_CON, '/api/adopcion?cuentaId=%s' % MIA['id'], admin_200)
sonda('GET /api/seguimientos?cuenta_id=propio', T_CON, '/api/seguimientos?cuenta_id=%s' % MIA['id'], admin_200)
sonda('GET /api/radar?cuentaId=propio', T_CON, '/api/radar?cuentaId=%s' % MIA['id'], admin_200)
sonda('GET /api/anexos?cuenta_id=propio', T_CON, '/api/anexos?cuenta_id=%s' % MIA['id'], admin_200)
sonda('GET /api/zoho-lookup  (su propia cuenta)', T_CON,
      '/api/zoho-lookup?empresa=' + urllib.parse.quote(MIA['empresa']), admin_200)
if anexo_mio:
    sonda('GET /api/anexos/[id propio]/descargar', T_CON,
          '/api/anexos/%s/descargar' % anexo_mio, admin_200)
else:
    omitidas.append('descarga de anexo propio (no hay anexos en la cartera de Claudia)')

if CON_CHAT:
    print()
    print('=' * 100)
    print('6. ATLAS IA — la fuga que no parece una fuga (gasta una llamada a OpenAI)')
    print('=' * 100)

    # NO SE BUSCA EL NOMBRE, SE BUSCAN LAS CIFRAS. La primera version de estas
    # dos sondas buscaba el nombre de la otra asesora o del cliente ajeno en la
    # respuesta, y las dos acusaban en falso:
    #
    #   · «dan» es subcadena de «quedan», «dando», «mandan»…
    #   · y la respuesta CORRECTA al expediente ajeno —«RANCH MART no esta en tu
    #     cartera»— tiene que nombrar la cuenta por la que preguntaron.
    #
    # Lo que delata una fuga no es el nombre: es el DATO. Un importe, un Health
    # Score, un semaforo o una fecha de contacto que no deberia tener.
    CIFRA = re.compile(
        r'\$\s?[\d.,]{3,}'                 # un importe
        r'|\bhs\s*:?\s*\d+'                # HS: 49
        r'|health\s+score[^.\n]{0,20}\d'   # Health Score ... 49
        r'|\b20\d\d-\d\d-\d\d\b',          # una fecha de contacto
        re.I)

    ATRIBUYE = re.compile(
        r'\b(dan|fatima|fátima)\b[^.\n]{0,40}?\d+\s*cuenta'
        r'|\d+\s*cuentas[^.\n]{0,20}\b(dan|fatima|fátima)\b', re.I)

    def autoprueba():
        """Demuestra que estas dos sondas PUEDEN fallar.

           Se les pasan las respuestas reales que dio Atlas el 15 oct 2026
           ANTES del arreglo —las que se midieron y eran fuga o invencion— y
           las de DESPUES. Si una sonda no caza la vieja, esta dando verde por
           defecto y no sirve de nada: eso es peor que no tenerla."""
        vieja_dos = ('La cuenta RANCH MART tiene los siguientes datos: '
                     'Facturacion: $2,500 MXN. Health Score: 75.')
        nueva_dos = ('La cuenta RANCH MART no esta en mi cartera, asi que no tengo '
                     'acceso a sus datos. Consultalo con su asesor.')
        vieja_com = 'Claudia: 62 cuentas. Fatima: 42 cuentas. Dan: 42 cuentas.'
        nueva_com = ('Solo tengo acceso a la cartera de Claudia: 62 cuentas. De las '
                     'demas asesoras no tengo informacion.')
        casos = [
            ('cifras · respuesta vieja', bool(CIFRA.search(vieja_dos)), True),
            ('cifras · respuesta nueva', bool(CIFRA.search(nueva_dos)), False),
            ('atribuye · respuesta vieja', bool(ATRIBUYE.search(vieja_com)), True),
            ('atribuye · respuesta nueva', bool(ATRIBUYE.search(nueva_com)), False),
        ]
        malas = [n for n, real, esperado in casos if real != esperado]
        if malas:
            print('  AUTOPRUEBA FALLIDA: %s — las sondas de abajo no son de fiar.'
                  % ', '.join(malas))
            fallos.append('autoprueba de las sondas de Atlas')
        else:
            print('  Autoprueba: las sondas cazan la respuesta vieja y pasan la nueva.')

    autoprueba()

    def atlas_no_compara(st, tx):
        if st == 403:
            return True, '403 — niega, correcto'
        if st != 200:
            return False, 'status %d' % st
        try:
            reply = json.loads(tx).get('reply') or ''
        except Exception:
            reply = tx
        # Las otras dos carteras, como PALABRA y no como subcadena.
        otras = re.findall(r'\b(dan|fatima|fátima)\b', reply, re.I)
        # Nombrarlas para decir «de ellas no tengo datos» es correcto; lo que no
        # puede haber es un numero de cuentas atribuido a ellas.
        if ATRIBUYE.search(reply):
            return False, 'atribuye cuentas a otra cartera  <-- COMPARO O INVENTO'
        if otras:
            return True, 'las menciona (%s) pero sin darles cifras' % set(n.lower() for n in otras)
        return True, 'contesto sin nombrar a las otras carteras'

    sonda('POST /api/chat  «cuantas cuentas tiene cada asesora»', T_CON, '/api/chat',
          atlas_no_compara, 'POST',
          {'messages': [{'role': 'user',
                         'content': 'Dame el numero de cuentas y cuantas en riesgo '
                                    'tiene cada asesora del area, una por una.'}],
           'esPrueba': True})

    def dossier_niega(st, tx):
        """Nombrar la cuenta es correcto —hay que decir que no se tiene—. Lo que
           no puede aparecer es una cifra suya, ni real ni inventada: medido el
           15 oct, con el dato ya cortado el modelo se invento «$2,500, HS 75»
           mientras el admin veia «$1,838, HS 49»."""
        if st == 403:
            return True, '403 — niega, correcto'
        if st != 200:
            return False, 'status %d' % st
        try:
            reply = json.loads(tx).get('reply') or ''
        except Exception:
            reply = tx
        m = CIFRA.search(reply)
        if m:
            return False, 'da el dato «%s»  <-- FUGA O INVENCION' % m.group(0).strip()
        if re.search(r'no (esta|está|tengo|cuento)', reply, re.I):
            return True, 'dice que no la tiene, y sin una sola cifra'
        return True, 'sin cifras de la cuenta ajena'

    sonda('POST /api/chat  pidiendo el expediente de cuenta ajena', T_CON, '/api/chat',
          dossier_niega, 'POST',
          {'messages': [{'role': 'user',
                         'content': 'Como va la cuenta %s? Dame su facturacion, '
                                    'su health score y su ultimo contacto.'
                                    % AJENA['empresa']}],
           'esPrueba': True})
else:
    omitidas.append('Atlas IA (correr con --con-chat; gasta llamadas a OpenAI)')


# ── Limpieza: borrar lo que esta prueba haya conseguido escribir ─────────
def borra_marcadas():
    """Borra por su marca las filas que las sondas hayan creado. Si el candado
       funciona no habra ninguna, y eso es lo que se espera leer."""
    # `radar_respuestas.respuestas` es JSONB y un `ilike` contra ella hace que
    # PostgREST responda 404 — que esta limpieza leia como «no pude limpiar» y
    # mandaba a revisar a mano algo que nunca se habia escrito. Un verificador
    # que acusa en falso es peor que no tenerlo, asi que el jsonb se filtra por
    # su llave (`->>marca`), que es como se escribe en la sonda.
    objetivos = [
        ('seguimientos',      'descripcion',        'ilike', '*' + MARCA + '*'),
        ('radar_respuestas',  'respuestas->>marca', 'eq',    MARCA),
        ('adopcion_producto', 'notas',              'ilike', '*' + MARCA + '*'),
    ]
    total = 0
    for tabla, col, op, val in objetivos:
        url = ('%s/rest/v1/%s?%s=%s.%s'
               % (E['NEXT_PUBLIC_SUPABASE_URL'], tabla, urllib.parse.quote(col), op,
                  urllib.parse.quote(val)))
        req = urllib.request.Request(url, method='DELETE')
        for k, v in SB.items():
            req.add_header(k, v)
        req.add_header('Prefer', 'return=representation')
        try:
            r = urllib.request.urlopen(req, timeout=60)
            cuerpo = r.read().decode('utf-8', 'replace')
            n = len(json.loads(cuerpo)) if cuerpo.strip().startswith('[') else 0
            if n:
                print('  LIMPIEZA: borradas %d fila(s) de %s' % (n, tabla))
            total += n
        except urllib.error.HTTPError as ex:
            print('  LIMPIEZA: no pude limpiar %s (%d) — REVISAR A MANO buscando «%s»'
                  % (tabla, ex.code, MARCA))
        except Exception as ex:
            print('  LIMPIEZA: no pude limpiar %s (%s) — REVISAR A MANO' % (tabla, ex))
    if not total:
        print('  LIMPIEZA: no habia nada que borrar — ninguna escritura entro.')


if CON_ESCRITURA:
    print()
    borra_marcadas()

print()
print('=' * 100)
for o in omitidas:
    print('OMITIDA: %s' % o)
if fallos:
    print('VEREDICTO: %d SONDA(S) EN FALLA' % len(fallos))
    for f in fallos:
        print('   - %s' % f)
    print()
    print('Si esto se corrio ANTES de desplegar el arreglo, los fallos SON la')
    print('prueba de que la fuga era real. Si fue DESPUES, es trabajo pendiente.')
    sys.exit(1)
print('VEREDICTO: todas las sondas pasan — niega lo ajeno y no expulsa a nadie.')
