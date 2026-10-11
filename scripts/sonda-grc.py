# -*- coding: utf-8 -*-
u"""Que /facturacion sirva el corte de GRC que esta en `data/`, no el anterior.

   POR QUE EXISTE
   --------------
   `data/grc-zoho.json` viaja con la lambda y no hay constante `VERSION` que
   delate el cambio. Si no llegara, la pantalla pintaria el corte viejo SIN UN
   SOLO ERROR. Lo unico que distingue un corte de otro son las CIFRAS.

   Y hay un antecedente que lo hace obligatorio: `/api/grc` leia el archivo con
   una ruta armada en tiempo de ejecucion y **devolvia vacio dentro de otra
   lambda** sin avisar, porque el trazador de Next no puede seguir una ruta que
   no es literal. El `catch` se tragaba el error y 48 cuentas salian en cero —
   que se leyo como un hallazgo cuando era la fuente que no cargaba.

   LAS EXPECTATIVAS SE CALCULAN, NO SE ESCRIBEN
   --------------------------------------------
   Salen del propio JSON, asi que la sonda no se pudre en la carga siguiente.

   USO
   ---
       python scripts/sonda-grc.py
       python scripts/sonda-grc.py --autoprueba
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
ap.add_argument('--base', default='https://callpicker-cs.vercel.app')
ap.add_argument('--autoprueba', action='store_true')
args = ap.parse_args()

d = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
serie = d.get('serie') or []
meta = d.get('meta') or {}
esp = {
    'filas':   len(d.get('filas') or []),
    'meses':   [m['mes'] for m in serie],
    'mesVivo': meta.get('mesVivo'),
    'origen':  meta.get('origen'),
}
vivo = next((m for m in serie if m['mes'] == esp['mesVivo']), None)
print(u'  el archivo dice: %d filas · %d meses · mes vivo «%s»'
      % (esp['filas'], len(esp['meses']), esp['mesVivo']))
print(u'  origen: %s' % esp['origen'])
if vivo:
    print(u'  %s: MRR inicio %s · perdida %s · GRC %.1f%%'
          % (vivo['mes'], format(int(vivo['mrrInicio']), ',d'),
             format(int(vivo['churn'] + vivo['downgrade']), ',d'), vivo['grcMensual']))

if args.autoprueba:
    assert esp['filas'] > 0, 'no leyo ninguna fila'
    assert len(esp['meses']) == 10, 'esperaba diez meses, hay %d' % len(esp['meses'])
    assert esp['mesVivo'] == 'Octubre', 'el mes vivo deberia ser Octubre'
    assert 'Septiembre' in esp['meses'], 'falta septiembre'
    print(u'\n  autoprueba: el lector distingue el corte nuevo.')
    sys.exit(0)

E = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        E[k.strip()] = v.strip().strip('"')


def token():
    """El secreto se LEE del .env.local y no se imprime nunca."""
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    now = int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                          'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(E['JWT_SECRET'].encode(), (cab + '.' + cue).encode(), hashlib.sha256).digest())


def api(ruta):
    r = urllib.request.Request(args.base + ruta)
    r.add_header('Cookie', 'cp_session=' + token())
    r.add_header('Accept-Encoding', 'gzip')
    r.add_header('Cache-Control', 'no-cache')
    with urllib.request.urlopen(r, timeout=600) as x:
        b = x.read()
        if (x.headers.get('Content-Encoding') or '').lower() == 'gzip':
            b = gzip.decompress(b)
    return json.loads(b.decode('utf-8', 'replace'))


fallos = []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'   — ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


print(u'')
v = api('/api/grc')
sv = v.get('serie') if isinstance(v, dict) else None
exige(isinstance(sv, list), u'la serie llega como lista',
      u'llego %s' % type(sv).__name__)
if isinstance(sv, list):
    meses = [m.get('mes') for m in sv]
    print(u'        la API publica %d meses: %s' % (len(meses), u', '.join(str(x) for x in meses)))
    exige(meses == esp['meses'], u'los meses de la API son los del archivo')
    exige('Octubre' in meses, u'aparece OCTUBRE, que es lo que trajo este corte')

mv = (v.get('meta') or {}).get('mesVivo') if isinstance(v, dict) else None
exige(mv == esp['mesVivo'], u'el mes vivo de la API es «%s»' % esp['mesVivo'],
      u'la API dice «%s»' % mv)

# EL ANTECEDENTE: la fuente cargando VACIA sin avisar. Si el mapa por cuenta
# viene en cero para todas, no es un hallazgo — es el archivo que no llego.
c = api('/api/grc?mode=cuenta&cid=178812')
print(u'\n  /api/grc?mode=cuenta&cid=178812 -> %s'
      % json.dumps(c, ensure_ascii=False)[:220])
exige(isinstance(c, dict) and (c.get('mrrFin') is not None or c.get('filas')),
      u'el cruce por CID responde con datos (no vacio en silencio)')

print()
if fallos:
    print(u'  *** %d comprobacion(es) fallan: la pantalla NO sirve el corte de data/.'
          % len(fallos))
    sys.exit(1)
print(u'  /facturacion sirve el corte que esta en data/grc-zoho.json.')
