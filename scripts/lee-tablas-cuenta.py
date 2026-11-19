# -*- coding: utf-8 -*-
u"""IMPRIME LAS FILAS DE LAS TABLAS COLGADAS DE UNA CUENTA.

   `busca-cuenta.py` dice CUÁNTAS filas tiene cada tabla y marca «← MIRAR»,
   pero no las enseña. Mirarlas es lo que hace falta antes de publicar un
   expediente: una auditoría que dice «sin tickets» mientras el motor tiene
   una alerta crítica abierta se contradice con nuestra propia herramienta, y
   ésa es la contradicción más barata de detectar. [[feedback-auditorias-verificar]]

   Credenciales de `.env.local`, dentro del guion, sin imprimirlas.

   USO
       python -I scripts/lee-tablas-cuenta.py <CID> [tabla ...]
"""
import io
import json
import os
import sys
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if len(sys.argv) < 2:
    print(u'  uso: python -I scripts/lee-tablas-cuenta.py <CID> [tabla ...]')
    sys.exit(1)
CID = sys.argv[1]
TABLAS = sys.argv[2:] or ['alertas_episodios', 'seguimientos', 'actividades', 'reuniones']

env = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
BASE = env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']


def rest(path):
    req = urllib.request.Request(u'%s/rest/v1/%s' % (BASE, path),
                                 headers={'apikey': KEY, 'Authorization': 'Bearer %s' % KEY})
    return json.loads(urllib.request.urlopen(req, timeout=30).read().decode('utf-8'))


cuentas = rest(u'cuentas?select=id,consecutivo,empresa,asesor&cid=eq.%s' % urllib.parse.quote(CID))
if not cuentas:
    print(u'  no hay cuenta con cid %s' % CID)
    sys.exit(1)
c = cuentas[0]
print(u'\n  %s · %s · asesor %s · cid %s' % (c['consecutivo'], c['empresa'], c['asesor'], CID))
print(u'  ' + u'=' * 72)

for t in TABLAS:
    print(u'\n  ── %s ──' % t)
    try:
        filas = rest(u'%s?select=*&cuenta_id=eq.%s&limit=200' % (t, c['id']))
    except Exception as e:                                        # noqa: BLE001
        # UNA FUENTE QUE NO SE PUDO LEER NO ES UNA FUENTE VACÍA.
        print(u'    *** NO SE PUDO LEER: %s' % e)
        continue
    if not filas:
        print(u'    sin filas (leído, no supuesto)')
        continue
    for f in filas:
        trozos = []
        for k, v in f.items():
            if k in ('id', 'cuenta_id', 'created_at', 'updated_at') or v in (None, '', [], {}):
                continue
            s = json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else str(v)
            trozos.append(u'%s=%s' % (k, s if len(s) <= 220 else s[:220] + u'…'))
        print(u'    · ' + u' | '.join(trozos))
