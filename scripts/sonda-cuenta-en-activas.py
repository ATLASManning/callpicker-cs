# -*- coding: utf-8 -*-
u"""Que dice PRODUCCION de una cuenta: los campos que deciden Activas/Dormidas.

   ── POR QUE CONTRA PRODUCCION ───────────────────────────────────────────────
   `revisa-reactivadas.mjs` comprueba el codigo: que la clave cruce y que el Set
   la deje fuera. Eso puede estar perfecto y la pantalla seguir mostrando la
   cuenta en Dormidas, porque entre el Set y la pantalla hay un despliegue que
   pudo no entrar y un Service Worker que pudo servir el build viejo.
   «Lo desplegue» no es «lo estan viendo». [[incidente-atlas-oscuro]]

   ── LO QUE SI AFIRMA Y LO QUE NO ────────────────────────────────────────────
   Afirma lo que el API devuelve, que es el dato. NO reimplementa
   `vaEnDormidas()` —vive en app/cuentas/page.tsx y duplicarla aqui seria un
   espejo tecleado a mano—: imprime los campos EXACTOS que esa funcion mira y
   deja la lectura a la vista.

   Es de SOLO LECTURA.

       python -I scripts/sonda-cuenta-en-activas.py "ABRL"
       python -I scripts/sonda-cuenta-en-activas.py "ABRL" --exige-activa
"""
import argparse
import base64
import gzip
import hashlib
import hmac
import io
import json
import os
import sys
import time
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ap = argparse.ArgumentParser()
ap.add_argument('nombre', help='parte del nombre de la empresa')
ap.add_argument('--base', default='https://callpicker-cs.vercel.app')
ap.add_argument('--exige-activa', action='store_true',
                help='sale con 1 si la cuenta trae churn_confirmado o '
                     'cancelacion_reportada, que es lo que la saca de Activas')
args = ap.parse_args()

E = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        E[k.strip()] = v.strip().strip('"')


def token():
    u"""El secreto se LEE del .env.local y NO se imprime nunca."""
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    now = int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                          'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(E['JWT_SECRET'].encode(), (cab + '.' + cue).encode(), hashlib.sha256).digest())


url = args.base.rstrip('/') + '/api/cuentas'
req = urllib.request.Request(url)
# `cp_session`, el nombre que lee el middleware. Con otro nombre la peticion
# NO falla: devuelve el login con HTTP 200, que es justo lo que caza el
# control de abajo.
req.add_header('Cookie', 'cp_session=' + token())
req.add_header('Accept-Encoding', 'gzip')
with urllib.request.urlopen(req, timeout=300) as r:
    ctype = r.headers.get('Content-Type', '')
    crudo = r.read()
    if (r.headers.get('Content-Encoding') or '').lower() == 'gzip':
        crudo = gzip.decompress(crudo)
cuerpo = crudo.decode('utf-8', 'replace')

# El middleware sirve el LOGIN con HTTP 200: un 200 no basta.
# [[project-callpicker-auth-pending]]
if 'json' not in ctype.lower():
    print(u'  *** la respuesta NO es JSON (%s). Es la pantalla de login, no el dato.'
          % ctype)
    sys.exit(1)

filas = json.loads(cuerpo)
aguja = args.nombre.strip().lower()
hits = [c for c in filas if aguja in str(c.get('empresa', '')).lower()]

print(u'\n  PRODUCCION · %s · %d cuentas servidas' % (args.base, len(filas)))
print(u'  ' + u'─' * 68)
if not hits:
    print(u'  «%s» no aparece. Un hueco aqui NO prueba que no exista:' % args.nombre)
    print(u'  prueba que con ese texto no se encontro.')
    sys.exit(1)

malas = []
for c in hits:
    print(u'\n    %s  (%s · CID %s · %s)'
          % (c.get('empresa'), c.get('consecutivo'), c.get('cid'), c.get('asesor')))
    # Los CINCO campos que mira `vaEnDormidas()` + `getEstadoKey()`, sin
    # reimplementar la regla: estos son los insumos, no el veredicto.
    for k in ('churn_confirmado', 'cancelacion_reportada', 'estado',
              'facturacion', 'health_score'):
        print(u'       %-24s %s' % (k, c.get(k)))
    mot = c.get('bloqueo_motivos') or []
    print(u'       %-24s %s' % (u'bloqueo_sac', c.get('bloqueo_sac')))
    for m in mot:
        print(u'         · %s' % m)
    if c.get('churn_confirmado') or c.get('cancelacion_reportada'):
        malas.append(c.get('empresa'))

print(u'\n  ' + u'═' * 68)
if args.exige_activa and malas:
    print(u'  *** %d cuenta(s) siguen marcadas como churn o cancelacion, asi que'
          % len(malas))
    print(u'      `vaEnDormidas()` las saca de Activas: %s' % u', '.join(malas))
    print(u'      Si el codigo ya las excluye, lo que falta es el despliegue.')
    sys.exit(1)
if args.exige_activa:
    print(u'  NINGUNA trae churn ni cancelacion: por ese motivo ya no salen de')
    print(u'  Activas. El resto de la colocacion la deciden `estado`,')
    print(u'  `facturacion` y `health_score`, impresos arriba.')
else:
    print(u'  Campos servidos por el API. El veredicto Activas/Dormidas lo pone')
    print(u'  `vaEnDormidas()` en app/cuentas/page.tsx, que no se duplica aqui.')
