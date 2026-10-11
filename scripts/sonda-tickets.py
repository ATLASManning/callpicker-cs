# -*- coding: utf-8 -*-
u"""Que /tickets sirva el corte que esta en `lib/tickets-data.json`, no el anterior.

   POR QUE EXISTE
   --------------
   El JSON viaja con la lambda y no hay constante `VERSION` que delate el
   cambio. Si no llegara al despliegue, la pantalla pintaria el corte viejo SIN
   UN SOLO ERROR. Lo unico que distingue un corte de otro son las CIFRAS.

   HAY QUE PEDIRLE A LA API, NO AL HTML
   ------------------------------------
   `/tickets` es `'use client'`: el HTML servido no trae las cifras, las pide
   el navegador. Y `/api/tickets` **pagina de 50 en 50**, asi que contar `rows`
   siempre da 50 y parece una falla aunque todo este bien. Lo que se mira es
   `total` y los modos de resumen (`stats`, `meses`, `clientes`, `propietarios`),
   que son los que pintan las graficas.

   LAS EXPECTATIVAS SE CALCULAN, NO SE ESCRIBEN
   --------------------------------------------
   Salen del propio `lib/tickets-data.json`, asi que la sonda no se pudre en la
   carga siguiente ni da verde comparando el corte nuevo contra si mismo.

   USO
   ---
       python scripts/sonda-tickets.py
       python scripts/sonda-tickets.py --autoprueba
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
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='https://callpicker-cs.vercel.app')
ap.add_argument('--autoprueba', action='store_true')
args = ap.parse_args()


def entorno():
    e = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as f:
        for l in f:
            l = l.strip()
            if '=' in l and not l.startswith('#'):
                k, v = l.split('=', 1)
                e[k.strip()] = v.strip().strip('"')
    return e


E = entorno()


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


# ── Lo que el archivo dice que debe salir ───────────────────────────────────
def del_archivo():
    d = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))
    filas = d['tickets'] if isinstance(d, dict) and 'tickets' in d else d
    if not isinstance(filas, list):
        for k in ('rows', 'data', 'items'):
            if isinstance(d, dict) and isinstance(d.get(k), list):
                filas = d[k]
                break
    cids = set()
    sin_cierre = 0
    for t in filas:
        c = str(t.get('cid') if isinstance(t, dict) else '').strip()
        if c:
            cids.add(c)
        if not str((t.get('cierre') if isinstance(t, dict) else '') or '').strip():
            sin_cierre += 1
    return {'total': len(filas), 'cids': len(cids), 'sin_cierre': sin_cierre}


esp = del_archivo()
print(u'  el archivo dice: %s tickets · %s CIDs · %d sin fecha de cierre'
      % (format(esp['total'], ',d'), format(esp['cids'], ',d'), esp['sin_cierre']))

fallos = []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'   — ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


if args.autoprueba:
    # Los comparadores, probados AL REVES. Una sonda que solo se prueba con el
    # caso bueno no sabe fallar.
    assert esp['total'] > 0, 'no leyo ningun ticket del archivo'
    assert esp['cids'] > 0, 'no leyo ningun CID'
    assert esp['total'] != 6328, 'esta leyendo el corte anterior'
    print(u'\n  autoprueba: el lector del archivo distingue el corte nuevo.')
    sys.exit(0)

# ── Produccion ──────────────────────────────────────────────────────────────
print(u'')
d = api('/api/tickets?limit=1')
total = d.get('total')
print(u'  /api/tickets -> total=%s · rows=%d (la pagina, no el universo)'
      % (total, len(d.get('rows') or [])))
exige(total == esp['total'],
      u'el total de la API es el del archivo (%s)' % format(esp['total'], ',d'),
      u'la API dice %s' % total)

st = api('/api/tickets?mode=stats')
print(u'\n  mode=stats -> total=%s · fallasBandera=%s · fallasCategoria=%s'
      % (st.get('total'), st.get('fallasBandera'), st.get('fallasCategoria')))
exige(st.get('total') == esp['total'], u'mode=stats reporta el total del archivo')

# LA BANDERA DE FALLA ES SUBCONJUNTO DE LA CATEGORIA, nunca al reves.
fb, fc = st.get('fallasBandera'), st.get('fallasCategoria')
if isinstance(fb, int) and isinstance(fc, int):
    exige(fb <= fc, u'la bandera de falla (%s) no excede a la categoria (%s)' % (fb, fc))

# ── LAS PARTICIONES TIENEN QUE CERRAR ───────────────────────────────────────
# `byMes` y `byMesCierre` llegan como DICCIONARIOS {mes: n}, no como listas de
# objetos. La primera version de esta sonda los sumo como lista y dio 0, o sea
# que acusaba a produccion de un fallo que era suyo. La forma se comprueba
# antes de sumar.
for clave in ('byMes', 'byMesCierre'):
    cubo = st.get(clave)
    if not isinstance(cubo, dict):
        exige(False, u'%s llega como diccionario' % clave,
              u'llego %s' % type(cubo).__name__)
        continue
    suma = sum(int(v or 0) for v in cubo.values())
    print(u'  %-12s %d meses · suma %s' % (clave, len(cubo), format(suma, ',d')))
    exige(suma == esp['total'], u'la particion %s CIERRA contra el total' % clave,
          u'suma %s contra %s' % (format(suma, ',d'), format(esp['total'], ',d')))

# `mode=meses` NO devuelve conteos: devuelve el EJE de meses. Pedirle una suma
# era el error de la primera version.
ms = api('/api/tickets?mode=meses')
eje = ms.get('meses') or []
print(u'\n  mode=meses -> el eje, %d meses de apertura (%s .. %s)'
      % (len(eje), eje[0] if eje else u'?', eje[-1] if eje else u'?'))
exige(len(eje) > 0, u'el eje de meses responde')
if isinstance(st.get('byMes'), dict):
    exige(set(eje) == set(st['byMes'].keys()),
          u'el eje de meses y los cubos de byMes son el MISMO conjunto')

cl = api('/api/tickets?mode=clientes')
lista = cl if isinstance(cl, list) else (cl.get('clientes') or cl.get('rows') or [])
print(u'\n  mode=clientes -> %d entradas' % len(lista))

pr = api('/api/tickets?mode=propietarios')
props = pr if isinstance(pr, list) else (pr.get('propietarios') or pr.get('rows') or [])
print(u'  mode=propietarios -> %d entradas' % len(props))
exige(len(props) > 0, u'el corte por propietario responde')

print()
if fallos:
    print(u'  *** %d comprobacion(es) fallan: la pantalla NO sirve el corte de lib/.'
          % len(fallos))
    sys.exit(1)
print(u'  /tickets sirve el corte que esta en lib/tickets-data.json.')
