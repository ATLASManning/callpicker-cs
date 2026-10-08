# -*- coding: utf-8 -*-
"""Cuantas cuentas salen en VERDE teniendo una alerta de familia `riesgo`.

   El 8 oct 2026 el reordenamiento de `oportunidad` dejo seis cuentas en verde
   con el texto «la cuenta esta medida, auditada y sin senal de riesgo»
   mientras su propia ficha listaba, en rojo y debajo, «Consumo de 81% -> 54%
   -> 48%» o «72 dias sin contacto». El tablero se contradecia a si mismo en
   la misma tarjeta.

   La causa de fondo no es el reordenamiento sino una DERIVA: `veredictoDe`
   decide el riesgo con umbrales escritos a mano —silencio >= 90, consumo <= 0—
   que se separaron de los del CATALOGO, que es quien de verdad emite las
   alertas (silencio a los 60, consumo cero por debajo de 0.5). Lo que este
   guion mide es cuanto se moveria si la compuerta la dictara el catalogo.

   NO replica la decision: cruza lo que produccion YA publica. Las alertas
   vienen de /api/alertas con su familia, las situaciones de
   /api/alertas/veredictos. La unica regla nueva que se aplica aqui es «tiene
   o no una alerta de familia riesgo».

   USO
   ---
       python scripts/mide-riesgo-en-verde.py
"""
import base64
import hashlib
import hmac
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE = 'https://callpicker-cs.vercel.app'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERDES = {'oportunidad', 'en_orden'}

env = {}
for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    linea = linea.strip()
    if '=' in linea and not linea.startswith('#'):
        k, v = linea.split('=', 1)
        env[k.strip()] = v.strip().strip('"')

b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
sec, now = env['JWT_SECRET'].encode(), int(time.time())
cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                      'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                     separators=(',', ':')).encode())
TOK = cab + '.' + cue + '.' + b64(hmac.new(sec, (cab + '.' + cue).encode(),
                                           hashlib.sha256).digest())


def api(ruta):
    r = urllib.request.Request(BASE + ruta)
    r.add_header('Cookie', 'cp_session=' + TOK)
    r.add_header('Cache-Control', 'no-cache')
    with urllib.request.urlopen(r, timeout=240) as x:
        return json.loads(x.read().decode() or '{}')


al = api('/api/alertas?limite=1000')
ve = api('/api/alertas/veredictos')
print('alertas   version %s · %d filas' % (al.get('version'), len(al.get('rows', []))))
print('veredicto version %s · %d cuentas\n' % (ve.get('version'), ve.get('total', 0)))

riesgoDe = defaultdict(list)
for a in al.get('rows', []):
    if a.get('familia') == 'riesgo':
        riesgoDe[str(a.get('cuentaId'))].append(a)

cat = ve.get('catalogo', {})
hoy, moverian = Counter(), Counter()
enVerdeConRiesgo = []
for c in ve.get('rows', []):
    sit = c['veredicto']['situacion']
    hoy[sit] += 1
    rs = riesgoDe.get(str(c.get('cuentaId')), [])
    if rs:
        moverian[sit] += 1
        if sit in VERDES:
            enVerdeConRiesgo.append((c, rs))

print('Cuentas CON alerta de familia riesgo, por situacion actual:')
for k, v in sorted(hoy.items(), key=lambda kv: cat.get(kv[0], {}).get('orden', 99)):
    m = moverian.get(k, 0)
    marca = '  <-- HOY EN VERDE Y CON RIESGO' if k in VERDES and m else ''
    print('  %-20s %4d cuentas · %3d con riesgo%s'
          % (cat.get(k, {}).get('titulo', k), v, m, marca))

print('\nSi la compuerta la dictara el catalogo, se moverian %d cuenta(s) a'
      % sum(n for k, n in moverian.items() if k not in ('se_va', 'apagandose')))
print('una situacion no verde. Las que hoy estan en verde con riesgo vivo:\n')
for c, rs in sorted(enVerdeConRiesgo, key=lambda x: -(x[0].get('mrr') or 0)):
    print('  %-34s $%9s  %s' % (str(c.get('empresa'))[:34],
                                format(c.get('mrr') or 0, ',.0f'),
                                c['veredicto']['situacion']))
    for a in rs:
        print('        [%-8s] %s' % (a.get('severidad'), str(a.get('titulo'))[:62]))

print('\nY el reves, que es lo que importa para no romper otra cosa:')
print('  cuentas SIN alerta de riesgo que hoy estan en verde: %d'
      % sum(1 for c in ve.get('rows', [])
            if c['veredicto']['situacion'] in VERDES
            and not riesgoDe.get(str(c.get('cuentaId')))))
print('  (esas son las que seguirian en verde, y son las unicas que deberian)')
