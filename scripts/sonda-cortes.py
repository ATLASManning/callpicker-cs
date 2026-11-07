# -*- coding: utf-8 -*-
u"""Que /facturacion/cortes sirva el corte que esta en `data/`, no el anterior.

   POR QUE EXISTE
   --------------
   El .xlsx viaja con la lambda y no hay constante `VERSION` que delate el
   cambio. Si no llegara al despliegue, la pantalla pintaria el corte viejo SIN
   UN SOLO ERROR. Lo unico que distingue un corte de otro son las CIFRAS.

   HAY QUE PEDIRLE A LA API, NO AL HTML
   ------------------------------------
   Esa pantalla es `'use client'`: las cifras no viajan en el HTML, las pide el
   navegador. Y **`byMes` y `zonas` llegan como DICCIONARIOS de objetos, no
   como listas** — sumarlos como lista da 0 y la sonda acusa a produccion de un
   fallo que es suyo. Me paso con /api/tickets el 11 oct con la advertencia ya
   escrita. Aqui se comprueba la FORMA antes de sumar.

   LAS EXPECTATIVAS SE CALCULAN, NO SE ESCRIBEN
   --------------------------------------------
   Salen del propio `data/cortes-facturacion.xlsx`, asi que la sonda no se
   pudre en la carga siguiente ni da verde comparando el corte nuevo contra si
   mismo.

   USO
   ---
       python scripts/sonda-cortes.py
       python scripts/sonda-cortes.py --autoprueba
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
from openpyxl import load_workbook

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx')

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='https://callpicker-cs.vercel.app')
ap.add_argument('--autoprueba', action='store_true')
args = ap.parse_args()


def del_archivo():
    wb = load_workbook(XLSX, data_only=True, read_only=True)
    ws = wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    cab = [str(c).strip() if c is not None else '' for c in next(it)]
    n, cids, meses = 0, set(), set()
    for r in it:
        if all(v is None or str(v).strip() == '' for v in r):
            continue
        n += 1
        fila = {cab[i]: r[i] for i in range(min(len(cab), len(r)))}
        c = str(fila.get('CID') or '').strip()
        if c:
            cids.add(c)
        # El mes se SACA del archivo, no se teclea — ver la nota de abajo.
        f = fila.get('Fecha de corte')
        m = (f.strftime('%Y-%m') if hasattr(f, 'strftime')
             else str(f or '').strip()[:7])
        if len(m) == 7 and m[4] == '-' and m[:4].isdigit():
            meses.add(m)
    wb.close()
    return {'filas': n, 'cids': len(cids), 'columnas': len(cab),
            'meses': meses, 'mesUltimo': max(meses) if meses else None}


def juzga_meses(meses_archivo, by_mes):
    u"""Que la API sirva TODOS los meses que el archivo declara.

    Devuelve una lista de (ok, titulo, detalle). Esta aparte del cuerpo de la
    sonda para poder probarla AL REVES: con lo que NO debe pasar. Una regla
    solo queda probada cuando se le ensena lo que tiene que rechazar.
    [[feedback-probar-al-reves]]
    """
    ult = max(meses_archivo) if meses_archivo else None
    if not ult:
        return [(False, u'el archivo no declara ningun mes de corte legible '
                        u'(columna «Fecha de corte»)', u'')]
    faltan = sorted(m for m in meses_archivo if m not in by_mes)
    detalle = (u'faltan: %s' % u', '.join(faltan)) if faltan else (
        u'los %d meses del archivo coinciden' % len(meses_archivo))
    return [
        (ult in by_mes,
         u'la API sirve el mes mas nuevo del archivo (%s)' % ult,
         u'byMes trae %d cubos: %s' % (len(by_mes), u', '.join(sorted(by_mes)))),
        (not faltan, u'la API no pierde ningun mes del archivo', detalle),
    ]


esp = del_archivo()
print(u'  el archivo dice: %s filas · %s CIDs · %d columnas'
      % (format(esp['filas'], ',d'), format(esp['cids'], ',d'), esp['columnas']))

if args.autoprueba:
    assert esp['filas'] > 0, 'no leyo ninguna fila'
    assert esp['columnas'] == 39, 'cambio el numero de columnas'
    # El lector tiene que SACAR los meses del archivo. Antes aqui habia un
    # `filas != 21567` tecleado: solo cazaba un corte viejo concreto y se
    # quedaba obsoleto en cuanto cambiaba el numero.
    assert esp['meses'], 'no leyo ningun mes de la columna «Fecha de corte»'
    assert esp['mesUltimo'] == max(esp['meses']), 'el mes mas nuevo no es el maximo'

    # ── AL REVES: lo que NO debe pasar ────────────────────────────────────
    todos = {m: {'count': 1} for m in esp['meses']}
    assert all(ok for ok, _, _ in juzga_meses(esp['meses'], todos)), \
        'con todos los meses servidos deberia pasar y no pasa'

    sin_ultimo = dict(todos)
    sin_ultimo.pop(esp['mesUltimo'])
    r = juzga_meses(esp['meses'], sin_ultimo)
    assert not r[0][0], 'NO detecto que falte el mes mas nuevo (%s)' % esp['mesUltimo']
    assert not r[1][0], 'NO detecto que la API pierda un mes'

    falta_uno_viejo = dict(todos)
    falta_uno_viejo.pop(min(esp['meses']))
    r = juzga_meses(esp['meses'], falta_uno_viejo)
    assert r[0][0], 'se queja del mes nuevo cuando el que falta es uno viejo'
    assert not r[1][0], 'NO detecto que falte un mes ANTERIOR — el informe es ' \
                        'acumulativo: perder un mes viejo es igual de grave'

    assert not juzga_meses(set(), todos)[0][0], \
        'un archivo sin meses legibles deberia fallar y da por bueno'

    print(u'\n  autoprueba: el lector saca %d mes(es) del archivo (ultimo %s),'
          % (len(esp['meses']), esp['mesUltimo']))
    print(u'  y la regla de meses RECHAZA que falte el nuevo, que falte uno viejo')
    print(u'  y que el archivo no declare ninguno.')
    sys.exit(0)


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


fallos = []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'   — ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


d = api('/api/cortes')
claves = sorted(d.keys()) if isinstance(d, dict) else []
print(u'\n  /api/cortes -> %s' % (u', '.join(claves) if claves else type(d).__name__))

total = d.get('total') if isinstance(d, dict) else None
if total is not None:
    exige(total == esp['filas'],
          u'el total de la API es el del archivo (%s)' % format(esp['filas'], ',d'),
          u'la API dice %s' % total)

# LA FORMA ANTES DE SUMAR. `byMes` y `zonas` son DICCIONARIOS.
for clave in ('byMes', 'zonas'):
    cubo = d.get(clave) if isinstance(d, dict) else None
    if cubo is None:
        print(u'  --    %s no viene en esta respuesta' % clave)
        continue
    exige(isinstance(cubo, dict), u'%s llega como diccionario' % clave,
          u'llego %s' % type(cubo).__name__)
    if isinstance(cubo, dict):
        print(u'        %s: %d cubos · %s'
              % (clave, len(cubo), u', '.join(sorted(cubo.keys())[:6])))

# EL MES NUEVO TIENE QUE ESTAR: es lo unico que distingue este corte.
#
# Esta comprobacion estuvo TECLEADA A '2026-10' hasta el 6 nov 2026, y por eso
# seguia diciendo «ok» con el corte de noviembre cargado: lo que comprobaba era
# que siguiera existiendo octubre, que existe siempre porque el informe es
# ACUMULATIVO. O sea, se cumplia sola. Un verificador que concluye exito por
# defecto es peor que no tenerlo. Ahora el mes se saca del ARCHIVO —el maximo
# de su columna «Fecha de corte»— y se exige que la API lo sirva, asi que la
# comprobacion se mueve sola en cada carga y no hay que acordarse de editarla.
#
# La regla vive en `juzga_meses` y la usan LOS DOS —la sonda y su autoprueba—,
# para que no haya dos versiones de lo mismo que puedan separarse.
bm = d.get('byMes') if isinstance(d, dict) else None
if isinstance(bm, dict):
    for ok, titulo, detalle in juzga_meses(esp['meses'], bm):
        exige(ok, titulo, detalle)

print()
if fallos:
    print(u'  *** %d comprobacion(es) fallan: la pantalla NO sirve el corte de data/.'
          % len(fallos))
    sys.exit(1)
print(u'  /api/cortes sirve el corte que esta en data/cortes-facturacion.xlsx.')
