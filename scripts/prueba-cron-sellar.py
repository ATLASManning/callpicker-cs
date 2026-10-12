# -*- coding: utf-8 -*-
u"""Dispara `/api/cron/sellar-alertas` como lo haria Vercel.

   Usa la puerta REAL —`Authorization: Bearer $CRON_SECRET` contra el
   middleware— y no un atajo de arnes, porque lo que hay que probar es
   justamente esa puerta: `/api/cron/refresh-tenure` paso MESES sin correr
   porque el middleware lo mandaba al login y el redirect contesta 200 con
   HTML, asi que Vercel lo daba por exitoso.

   Por eso aqui se comprueba que la respuesta sea JSON y no HTML. Un 200 no
   basta: el login tambien contesta 200.

   El secreto se lee de `.env.local` y NO se imprime.

   USO
       python scripts/prueba-cron-sellar.py [base]

   `base` por defecto es http://localhost:3100. Para produccion se le pasa la
   URL del despliegue.
"""
import io
import os
import sys
import json
import urllib.request
import urllib.error

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100'


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(p):
        return None
    for linea in io.open(p, encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")
    return None


SECRETO = env('CRON_SECRET')
if not SECRETO:
    print(u'  *** CRON_SECRET no esta en .env.local.')
    print(u'      En local, sin el, el middleware cierra la puerta a proposito')
    print(u'      (fail-closed). En Vercel se configura en Settings ->')
    print(u'      Environment Variables.')
    sys.exit(2)

url = BASE + '/api/cron/sellar-alertas?manual=1'
req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + SECRETO})
print(u'\n  disparando %s' % url)
try:
    r = urllib.request.urlopen(req, timeout=300)
    cuerpo = r.read().decode('utf-8', 'replace')
    estado = r.status
except urllib.error.HTTPError as e:
    cuerpo = e.read().decode('utf-8', 'replace')
    estado = e.code
except Exception as e:
    print(u'  *** no respondio: %s' % e)
    sys.exit(1)

print(u'  HTTP %d' % estado)

# ── UN 200 NO BASTA ────────────────────────────────────────────────────────
if cuerpo.lstrip()[:1] == '<':
    print(u'  *** CONTESTO HTML, NO JSON.')
    print(u'      Es el login: el middleware no dejo pasar al cron. Vercel')
    print(u'      marcaria esto como exito. Revisa CRON_SECRET en el EDGE con')
    print(u'      /api/cron/estado — Node y el Edge pueden discrepar.')
    sys.exit(1)

try:
    d = json.loads(cuerpo)
except Exception:
    print(u'  *** no es JSON: %s' % cuerpo[:200])
    sys.exit(1)

if estado == 401:
    print(u'  *** 401: el secreto que manda este guion no es el que espera la ruta.')
    sys.exit(1)

for k in ('ok', 'disparo', 'alertas', 'abiertos', 'detectados', 'nuevos',
          'cerrados', 'sinCerrar', 'falla'):
    if k in d:
        print(u'      %-12s %s' % (k, d[k]))

fallos = []
if not d.get('ok'):
    fallos.append(u'la corrida reporta `ok: false` — mira `falla`')
if d.get('falla'):
    fallos.append(u'escrituras rechazadas: %s' % d['falla'])
if d.get('sinCerrar'):
    # No es un fallo por si mismo en una parcial, pero en la COMPLETA del cron
    # significa que el quorum salto: una fuente no cargo.
    fallos.append(u'no cerro nada: %s' % d['sinCerrar'])

print(u'')
for f in fallos:
    print(u'  *** %s' % f)
print(u'  %s' % (u'el cron corre y sella.' if not fallos
                 else u'*** %d cosa(s) que mirar' % len(fallos)))
sys.exit(1 if fallos else 0)
