# -*- coding: utf-8 -*-
u"""Dispara `/api/cron/diario` como lo haria Vercel.

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

def pide(extra):
    u"""Dispara la ruta y devuelve (estado, cuerpo)."""
    url = BASE + '/api/cron/diario?manual=1' + extra
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + SECRETO})
    print(u'\n  disparando %s' % url)
    try:
        r = urllib.request.urlopen(req, timeout=300)
        return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')
    except Exception as e:
        print(u'  *** no respondio: %s' % e)
        sys.exit(1)


def aJson(estado, cuerpo):
    print(u'  HTTP %d' % estado)
    # ── UN 200 NO BASTA ────────────────────────────────────────────────────
    if cuerpo.lstrip()[:1] == '<':
        print(u'  *** CONTESTO HTML, NO JSON.')
        print(u'      Es el login: el middleware no dejo pasar al cron. Vercel')
        print(u'      marcaria esto como exito. Revisa CRON_SECRET en el EDGE')
        print(u'      con /api/cron/estado — Node y el Edge pueden discrepar.')
        sys.exit(1)
    if estado == 401:
        print(u'  *** 401: el secreto que manda este guion no es el que espera.')
        sys.exit(1)
    try:
        return json.loads(cuerpo)
    except Exception:
        print(u'  *** no es JSON: %s' % cuerpo[:200])
        sys.exit(1)


fallos = []

# ── 1 · LA CORRIDA NORMAL ──────────────────────────────────────────────────
d = aJson(*pide(''))
print(u'      %-14s %s' % (u'dia', d.get('dia')))
print(u'      %-14s %s' % (u'snapshotHoy', d.get('snapshotHoy')))
sel = d.get('sellado') or {}
for k in ('alertas', 'abiertos', 'detectados', 'nuevos', 'cerrados',
          'sinCerrar', 'falla'):
    print(u'      sellado.%-6s %s' % (k, sel.get(k)))

if not sel.get('ok'):
    fallos.append(u'el sellado reporta `ok: false` — mira `sellado.falla`')
if sel.get('falla'):
    fallos.append(u'escrituras rechazadas: %s' % sel['falla'])
if sel.get('sinCerrar'):
    # En la corrida COMPLETA del cron esto significa que el quorum salto: una
    # fuente no cargo y por eso no se cerro nada.
    fallos.append(u'no cerro nada: %s' % sel['sinCerrar'])

# ── 2 · EL GATEO DEL SNAPSHOT, EN LOS DOS SENTIDOS ─────────────────────────
#
# Es la logica NUEVA de esta ruta y por eso se prueba al reves: que corra el
# snapshot cuando toca NO prueba que lo omita cuando no toca, y justo esa
# mitad —omitirlo de martes a domingo— es la que evita reescribir el retrato
# del lunes con datos de otro dia bajo la misma clave de semana.
snap = d.get('snapshot')
esLunes = u'es lunes' in (d.get('snapshotHoy') or u'')
if esLunes:
    if snap is None:
        fallos.append(u'hoy es lunes y NO tomo snapshot')
    elif not snap.get('ok'):
        fallos.append(u'el snapshot fallo: %s' % snap.get('falla'))
    print(u'\n  es lunes: el snapshot corrio, como debe.')
else:
    if snap is not None:
        fallos.append(u'hoy NO es lunes y aun asi tomo snapshot: '
                      u'reescribiria el retrato del lunes')
    print(u'\n  no es lunes: el snapshot se omitio, como debe.')
    # Y que se pueda forzar, que es la otra mitad del gateo.
    d2 = aJson(*pide('&snapshot=1'))
    s2 = d2.get('snapshot')
    if s2 is None:
        fallos.append(u'`?snapshot=1` no forzo el snapshot')
    elif not s2.get('ok'):
        fallos.append(u'el snapshot forzado fallo: %s' % s2.get('falla'))
    else:
        print(u'      forzado con ?snapshot=1: semana %s, %s fila(s)'
              % (s2.get('semana'), s2.get('filasEscritas')))

print(u'')
for f in fallos:
    print(u'  *** %s' % f)
print(u'  %s' % (u'el cron corre, sella, y el snapshot se gatea bien.'
                 if not fallos else u'*** %d cosa(s) que mirar' % len(fallos)))
sys.exit(1 if fallos else 0)
