# -*- coding: utf-8 -*-
"""Que la portada y ALERTAS siguen renderizando despues de la cirugia.

   Las dos se tocaron fuerte: la portada perdio 233 lineas y su derivacion de
   candidaturas se mudo a otro modulo; ALERTAS perdio dos tipos de alerta y
   gano la candidatura. Ninguna de las dos cosas la atrapa el build, porque
   `next.config.js` lleva `ignoreBuildErrors` encendido: un error de tipos
   despliega en verde y revienta en la cara del usuario.

   No basta con un 200. El middleware redirige a /acceso cuando la sesion no
   sirve y `urlopen` SIGUE el redirect, asi que lo que llega es el HTML del
   login con estado 200 — un «exito» que no probo nada. Se comprueba la URL
   final y un texto que solo existe en la pantalla de verdad.

   USO
   ---
       python scripts/verifica-pantallas-tocadas.py
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

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE = 'https://callpicker-cs.vercel.app'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

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

# (ruta, textos que DEBEN estar, textos que NO deben estar)
CASOS = [
    ('/', ['Dashboard Customer Success', 'Candidato a'],
          ['Cumplimiento SAC', 'SACWeeklyPanel', 'Application error']),
    ('/alertas', ['Alertas'],
                 ['La soltamos', 'Nunca ha entrado a un lote', 'Application error']),
]

fallas = []
for ruta, deben, no_deben in CASOS:
    r = urllib.request.Request(BASE + ruta)
    r.add_header('Cookie', 'cp_session=' + TOK)
    r.add_header('Cache-Control', 'no-cache')
    try:
        with urllib.request.urlopen(r, timeout=240) as x:
            est, html, final = x.status, x.read().decode('utf-8', 'replace'), x.geturl()
    except urllib.error.HTTPError as e:
        est, html, final = e.code, e.read().decode('utf-8', 'replace'), ruta

    print('\n%s   estado %s' % (ruta, est))
    if '/acceso' in final:
        fallas.append('%s: redirigio al login' % ruta)
        print('  *** redirigio a %s — la sesion no sirvio, no se probo nada' % final)
        continue
    if est != 200:
        fallas.append('%s: estado %s' % (ruta, est))

    for t in deben:
        ok = t in html
        if not ok:
            fallas.append('%s: falta «%s»' % (ruta, t))
        print('  %-34s %s' % ('debe traer «%s»' % t[:24], 'si' if ok else '** NO'))
    for t in no_deben:
        ok = t not in html
        if not ok:
            fallas.append('%s: aun trae «%s»' % (ruta, t))
        print('  %-34s %s' % ('no debe traer «%s»' % t[:20], 'limpio' if ok else '** AHI SIGUE'))

print('\n  %s' % ('las dos pantallas renderizan' if not fallas
                  else '*** REVISAR:\n    - ' + '\n    - '.join(fallas)))
sys.exit(1 if fallas else 0)
