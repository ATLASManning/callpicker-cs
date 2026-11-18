# -*- coding: utf-8 -*-
u"""
¿PRODUCCIÓN SIRVE DE VERDAD ESTE DOCUMENTO DE AUDITORÍA?
=========================================================

    python scripts/sonda-documento-auditoria.py /auditorias/<archivo>.html "frase que tiene que estar"

POR QUÉ HACE FALTA
------------------
`/auditorias/` y `/docs/` están cerrados por el middleware, y **el middleware
devuelve 307 también para un archivo que NO existe**. Así que un 307 no prueba
nada: ni que el documento subió, ni que no. Y un 200 tampoco basta por sí solo,
porque el middleware sirve la pantalla de LOGIN con 200.

Por eso esta sonda hace tres cosas, no una:
  1. Pide el documento SIN sesión y exige que lo rechace — si lo sirviera a
     cualquiera, eso es la noticia, y es peor que un documento que falta.
  2. Pide el documento CON sesión y exige HTTP 200.
  3. Exige que el cuerpo contenga la frase que se le pasa, que es lo único que
     distingue el documento nuevo del viejo, de la pantalla de login y de una
     página de error con buena cara.

LAS CREDENCIALES SE LEEN DE `.env.local` DENTRO DEL GUION Y NO SE IMPRIMEN.
El token se arma aquí y muere aquí.

Sale con 1 si cualquiera de las tres falla, y dice cuál.
"""
from __future__ import print_function
import base64
import gzip
import hashlib
import hmac
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.environ.get('CP_BASE', 'https://callpicker-cs.vercel.app')

if len(sys.argv) < 3:
    print(u'uso: sonda-documento-auditoria.py /auditorias/<archivo> "frase obligatoria"')
    sys.exit(2)
RUTA, FRASE = sys.argv[1], sys.argv[2]


def normaliza(ruta):
    u"""Git Bash reescribe los argumentos que empiezan por `/`.

    Un `/auditorias/x.html` escrito en la línea de órdenes llega aquí como
    `C:/Program Files/Git/auditorias/x.html` —conversión de rutas POSIX de
    MSYS— y la sonda revienta con «URL can't contain control characters»
    por el espacio de «Program Files». Pasó de verdad: el guion quedó en un
    bucle de reintentos toda una tarde sin llegar nunca a pedir la página, y
    el fallo no se parecía en nada a su causa.

    Se corta por el primer `/auditorias/` o `/docs/` que aparezca, se acepte
    como se acepte, y se devuelve la ruta con su barra inicial.
    """
    r = ruta.replace('\\', '/')
    for carpeta in ('/auditorias/', '/docs/'):
        i = r.find(carpeta)
        if i >= 0:
            return r[i:]
    return r if r.startswith('/') else '/' + r


_PEDIDA = RUTA
RUTA = normaliza(RUTA)
if RUTA != _PEDIDA:
    print(u'  (la ruta llegó como «%s»; se pide «%s»)' % (_PEDIDA, RUTA))


def entorno():
    d = {}
    p = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(p):
        return d
    for l in io.open(p, encoding='utf-8'):
        l = l.strip()
        if l and not l.startswith('#') and '=' in l:
            k, v = l.split('=', 1)
            d[k.strip()] = v.strip().strip('"').strip("'")
    return d


E = entorno()
if not E.get('JWT_SECRET'):
    print(u'  *** falta JWT_SECRET en .env.local. NO se concluye nada.')
    sys.exit(1)


def token():
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    now = int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'sonda@callpicker.com', 'nombre': 'Sonda',
                          'rol': 'admin', 'asesor_nombre': None,
                          'iat': now, 'exp': now + 600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(E['JWT_SECRET'].encode(), (cab + '.' + cue).encode(),
                 hashlib.sha256).digest())


def pide(con_sesion):
    r = urllib.request.Request(BASE + RUTA)
    r.add_header('Accept-Encoding', 'gzip')
    if con_sesion:
        r.add_header('Cookie', 'cp_session=' + token())
    try:
        with urllib.request.urlopen(r, timeout=90) as x:
            b = x.read()
            if (x.headers.get('Content-Encoding') or '').lower() == 'gzip':
                b = gzip.decompress(b)
            return x.status, b.decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')


print(u'')
print(u'  SONDA · %s%s' % (BASE, RUTA))
print(u'  ' + u'─' * 70)

fallos = []

# 1 · sin sesión: tiene que rechazarlo.
cod, cuerpo = pide(False)
# urllib sigue el 307, así que lo que llega es la pantalla de login con 200.
es_login = u'Acceso al dashboard' in cuerpo or u'password' in cuerpo.lower()
if cod == 200 and FRASE in cuerpo:
    fallos.append(u'EL DOCUMENTO SE SIRVE SIN SESIÓN — es un documento de '
                  u'cliente abierto a cualquiera')
    print(u'    sin sesión   *** LO SIRVE (HTTP 200 con el contenido) ***')
elif es_login or cod in (301, 302, 307, 308, 401, 403):
    print(u'    sin sesión   ok · lo rechaza (acaba en la pantalla de acceso)')
else:
    print(u'    sin sesión   ok · no entrega el documento (HTTP %s)' % cod)

# 2 y 3 · con sesión: 200 y la frase.
cod, cuerpo = pide(True)
if cod != 200:
    fallos.append(u'con sesión devuelve HTTP %s — el archivo no está en el '
                  u'despliegue' % cod)
    print(u'    con sesión   *** HTTP %s ***' % cod)
else:
    print(u'    con sesión   ok · HTTP 200 · %s bytes' % len(cuerpo))
    if u'Acceso al dashboard' in cuerpo:
        # OJO: esto NO dice que el documento falte.
        #
        # El middleware solo hace `jwtVerify` con `JWT_SECRET`; no mira la
        # tabla de usuarios. Así que si devuelve el login con una cookie que
        # acabamos de firmar, lo que ha fallado es la FIRMA: el secreto de
        # producción no es el de `.env.local`. El documento puede estar
        # perfectamente subido y esta sonda no puede verlo desde fuera.
        #
        # Decirlo al revés sería el error de siempre: un verificador que
        # concluye «no está desplegado» cuando lo que pasa es que no tiene
        # llave. Se reporta como NO CONCLUYE, con su salida 2, y se dice quién
        # sí puede comprobarlo.
        print(u'    contenido    ~ es la pantalla de acceso')
        print(u'')
        print(u'  ' + u'─' * 70)
        print(u'  NO CONCLUYE. La cookie que firma esta sonda no la acepta')
        print(u'  producción: el `JWT_SECRET` del despliegue no es el de')
        print(u'  `.env.local`. Eso NO dice nada sobre si el documento subió.')
        print(u'')
        print(u'  Lo comprueba en un clic quien ya tenga sesión abierta:')
        print(u'      %s%s' % (BASE, RUTA))
        print(u'  y ahí tiene que leerse «%s».' % FRASE[:60])
        sys.exit(2)
    elif FRASE in cuerpo:
        print(u'    contenido    ok · encontrado «%s»' % FRASE[:60])
    else:
        fallos.append(u'el documento se sirve pero NO contiene «%s»: produccion '
                      u'tiene una version vieja del archivo' % FRASE[:60])
        print(u'    contenido    *** no contiene «%s» ***' % FRASE[:60])

print(u'  ' + u'─' * 70)
if fallos:
    for f in fallos:
        print(u'  *** %s' % f)
    sys.exit(1)
print(u'  Producción sirve este documento, y sólo con sesión.')
sys.exit(0)
