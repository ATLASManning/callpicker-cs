# -*- coding: utf-8 -*-
u"""COMPRUEBA EN PRODUCCION QUE LOS FOLIOS VENCIDOS TRAEN SU DESENLACE.

   «Lo desplegue» no es «lo estan viendo» ([[incidente-atlas-oscuro]]). La
   pestaña Fuera de SLA publicaba folios ya cerrados como «Abierto»; el
   arreglo cruza cada folio contra el export de tickets en
   `/api/mesa-ayuda`. Esto lo pide a PRODUCCION y comprueba la forma, no el
   HTML — `/tickets` es 'use client' y no sirve nada en el servidor.

   Las expectativas NO se tecleaN: salen del propio archivo de tickets, igual
   que hace `sonda-tickets.py`, asi que el guion no se pudre con el proximo
   corte.

   OJO CON LA COOKIE: el middleware sirve la pantalla de ACCESO con HTTP 200,
   asi que una sonda sin sesion no recibe un 401 — recibe HTML y se rompe al
   leerlo como JSON. Aqui se detecta y se dice con palabras.
   La cookie la da `node scripts/sesion-local.cjs`.

   USO
       python scripts/sonda-mesa-desenlace.py <cookie>
       python scripts/sonda-mesa-desenlace.py <cookie> --local   # contra el 3100
"""
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = ('http://localhost:3100' if '--local' in sys.argv
        else 'https://callpicker-cs.vercel.app')

fallos = []


def check(ok, texto, detalle=''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', texto,
                           u'' if ok else u'   — ' + detalle))
    if not ok:
        fallos.append(texto)


# La verdad de referencia: el export que esta en el repo.
T = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))
T = T['tickets'] if isinstance(T, dict) else T
por_num = {}
for t in T:
    por_num.setdefault(str(t.get('num') or '').strip(), []).append(t)
print(u'\n  el archivo local trae %s tickets cerrados.' % format(len(T), ',d'))

cookie = next((a for a in sys.argv[1:] if not a.startswith('--')), '')
if not cookie:
    print(u'  *** falta la cookie de sesion. `node scripts/sesion-local.cjs` la da.')
    raise SystemExit(2)

cab = {'User-Agent': 'sonda-mesa-desenlace', 'Cookie': 'cp_session=' + cookie}
r = urllib.request.Request(BASE + '/api/mesa-ayuda', headers=cab)
with urllib.request.urlopen(r, timeout=120) as x:
    crudo = x.read().decode('utf-8', 'replace')
try:
    d = json.loads(crudo)
except ValueError:
    # El middleware sirve el LOGIN con HTTP 200: sin este aviso, la sonda
    # revienta con un JSONDecodeError que parece un fallo del API.
    # [[project-callpicker-auth-pending]]
    print(u'  *** la respuesta no es JSON. Empieza asi: %r' % crudo[:80])
    print(u'      Si trae HTML, es la pantalla de ACCESO servida con HTTP 200:')
    print(u'      la cookie falta o ya expiro (duran una hora).')
    raise SystemExit(1)

print(u'  %s/api/mesa-ayuda -> corte %s · %s vencido(s)\n'
      % (BASE, d.get('fecha'), d.get('vencidos')))

det = d.get('vencidosDetalle')
check(isinstance(det, list), 'la API devuelve vencidosDetalle como lista',
      u'llego %s' % type(det).__name__)
if not isinstance(det, list):
    raise SystemExit(1)

check(all('desenlace' in v for v in det),
      'los %d folios traen el campo `desenlace`' % len(det),
      u'faltan en %s' % [v.get('folio') for v in det if 'desenlace' not in v])

for v in det:
    folio = str(v.get('folio') or '').strip()
    filas = por_num.get(folio, [])
    des = v.get('desenlace')
    if len(filas) == 0:
        check(des is None,
              u'#%s sigue abierto y la API no lo da por cerrado' % folio,
              u'la API dice %s' % des)
    elif len(filas) > 1:
        check(isinstance(des, dict) and 'ambiguo' in des,
              u'#%s cae en %d filas y se marca ambiguo' % (folio, len(filas)),
              u'la API dice %s' % des)
    else:
        esperado = (filas[0].get('cierre') or '')[:10]
        check(isinstance(des, dict) and des.get('cerro') == esperado,
              u'#%s cerro el %s y la API lo dice' % (folio, esperado),
              u'la API dice %s' % des)
        # Dias CUMPLIDOS, no redondeados: tiene que casar con el calculo de
        # `mesa-pendientes-cerraron.py`, que usa el `.days` de Python.
        if isinstance(des, dict) and isinstance(des.get('dias'), int):
            check(des['dias'] >= 0, u'#%s: los dias abiertos no son negativos' % folio,
                  u'%s' % des.get('dias'))

cerrados = [v for v in det if isinstance(v.get('desenlace'), dict)
            and 'cerro' in v['desenlace']]
print(u'\n  %d de %d folios del corte ya habian cerrado.' % (len(cerrados), len(det)))

print(u'\n  ' + (u'la pantalla cruza el corte con el export.' if not fallos
                 else u'*** %d comprobacion(es) fallan.' % len(fallos)))
sys.exit(1 if fallos else 0)
