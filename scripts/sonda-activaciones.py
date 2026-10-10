# -*- coding: utf-8 -*-
"""Que /activaciones sirva el corte que está en `data/`, no el anterior.

   POR QUE EXISTE
   --------------
   El .xlsx viaja con la lambda y no hay generador ni constante `VERSION` que
   delate el cambio. Si el archivo no llegara al despliegue, la pantalla
   pintaría el corte viejo SIN UN SOLO ERROR: Vercel sigue sirviendo la
   compilación anterior cuando la nueva falla, y aquí ni eso haría falta.
   Lo único que distingue un corte de otro son las CIFRAS.

   LAS EXPECTATIVAS SE CALCULAN, NO SE ESCRIBEN
   --------------------------------------------
   La primera versión llevaba `{'filas': 2727, 'reales': 2148, 'demos': 579}`
   a mano. Eso obliga a editar el script en cada carga y, peor, lo deja
   mintiendo en verde si alguien olvida actualizarlo: compararía el corte nuevo
   contra las cifras del nuevo y daría «ok» aunque la pantalla sirviera otra
   cosa. Aquí se leen del .xlsx con los MISMOS filtros del módulo, así que la
   sonda no se podrece.

   DOS LECCIONES QUE YA COSTARON UNA CORRIDA EN FALSO
   -------------------------------------------------
   1. La pantalla formatea con `toLocaleString('es-MX')`, o sea «2,148» y no
      «2148». Buscar el número crudo daba FALLA siempre, con el corte nuevo
      sirviéndose perfectamente. Se buscan las DOS formas.
   2. Una aserción negativa sobre un número corto no vale nada. Exigir que
      «571» no aparezca en 1.8 MB de HTML con miles de cifras falla por
      cualquier otra cosa. Lo que se ancla es la FRASE que lo acompaña.

   USO
   ---
       python scripts/sonda-activaciones.py
       python scripts/sonda-activaciones.py --base http://localhost:3000
"""
import argparse
import base64
import gzip
import hashlib
import hmac
import io
import os
import re
import sys
import time
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
from openpyxl import load_workbook

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(RAIZ, 'data', 'activaciones.xlsx')

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='https://callpicker-cs.vercel.app')
ap.add_argument('--autoprueba', action='store_true',
                help='prueba los comparadores al revés, sin tocar la red')
args = ap.parse_args()


# ── Lo que el archivo dice que debe salir ────────────────────────────────────
def lee_archivo():
    """Los mismos filtros de `app/activaciones/page.tsx`: ID y Cliente no
       vacíos, `Año >= 2020`, y un demo no es una activación."""
    wb = load_workbook(XLSX, data_only=True, read_only=True)
    ws = wb['Hoja1']
    it = ws.iter_rows(values_only=True)
    cab = [str(c).strip() if c is not None else '' for c in next(it)]
    filas = []
    for r in it:
        if all(v is None or str(v).strip() == '' for v in r):
            continue
        filas.append({cab[i]: r[i] for i in range(min(len(cab), len(r)))})
    wb.close()

    def ano(f):
        v = f.get(u'Año')
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0

    regs = [f for f in filas
            if str(f.get('ID') or '').strip() and str(f.get('Cliente') or '').strip()]
    regs = [f for f in regs if ano(f) >= 2020]
    act = [f for f in regs if str(f.get('Tipo') or '').strip().lower() != 'demo']
    # Las activaciones de ID más alto son las que trajo el corte nuevo: si el
    # archivo no llegó, estos nombres NO están en el HTML. Se eligen solas, así
    # que la sonda no hay que tocarla en la carga siguiente.
    def idnum(f):
        d = re.sub(r'\D', '', str(f.get('ID') or ''))
        return int(d) if d else 0
    nuevas = [str(f.get('Cliente')).strip()
              for f in sorted(act, key=idnum, reverse=True)[:3]]

    # ── El módulo de clientes arriba de $3,500 ──────────────────────────
    # Mismo filtro que `components/charts/ActivacionesGrandes.tsx`: sin demos
    # y `primerPago > UMBRAL` ESTRICTO. Las cifras salen del archivo, así que
    # la sonda cubre el módulo sin que haya que tocarla en la carga siguiente.
    def pago(f):
        v = f.get('1er Pago')
        if isinstance(v, (int, float)):
            return float(v)
        try:
            return float(re.sub(r'[$,\s]', '', str(v or '')))
        except ValueError:
            return 0.0

    UMBRAL = 3500.0
    grandes = [f for f in act if pago(f) > UMBRAL]
    # Los tres de mayor importe: si el módulo no llegara, estos nombres no
    # están en la página aunque el resto del corte sí se sirva.
    cabeza = [str(f.get('Cliente')).strip()
              for f in sorted(grandes, key=pago, reverse=True)[:3]]
    return {'filas': len(regs), 'reales': len(act),
            'demos': len(regs) - len(act), 'nuevas': nuevas,
            'grandes': len(grandes),
            'dinero_grandes': int(round(sum(pago(f) for f in grandes))),
            'cabeza': cabeza}


# ── Producción ──────────────────────────────────────────────────────────────
def token():
    """El secreto se LEE del .env.local y no se imprime nunca."""
    env = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as f:
        for l in f:
            l = l.strip()
            if '=' in l and not l.startswith('#'):
                k, v = l.split('=', 1)
                env[k.strip()] = v.strip().strip('"')
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    import json
    sec, now = env['JWT_SECRET'].encode(), int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                          'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(sec, (cab + '.' + cue).encode(), hashlib.sha256).digest())


def pide(ruta):
    r = urllib.request.Request(args.base + ruta)
    r.add_header('Cookie', 'cp_session=' + token())
    r.add_header('Accept-Encoding', 'gzip')
    r.add_header('Cache-Control', 'no-cache')
    with urllib.request.urlopen(r, timeout=300) as x:
        b = x.read()
        if (x.headers.get('Content-Encoding') or '').lower() == 'gzip':
            b = gzip.decompress(b)
    return b.decode('utf-8', 'replace')


esp = lee_archivo()
print(u'  el archivo dice: %s filas · %s activaciones · %s demos'
      % tuple(format(esp[k], ',d') for k in ('filas', 'reales', 'demos')))
print(u'  arriba de $3,500: %s clientes · $%s'
      % (format(esp['grandes'], ',d'), format(esp['dinero_grandes'], ',d')))

# ── Comparadores ────────────────────────────────────────────────────────────
t = u''
fallos = []


def exige(ok, que):
    print(u'  %s  %s' % (u'ok  ' if ok else u'FALLA', que))
    if not ok:
        fallos.append(que)


def hay(n):
    """La pantalla formatea con `toLocaleString('es-MX')`, así que se buscan
       las dos formas: «2148» y «2,148»."""
    return (re.search(r'\b%d\b' % n, t) is not None
            or re.search(r'\b%s\b' % format(n, ',d'), t) is not None)


# ── Los comparadores, probados AL REVÉS ─────────────────────────────────────
# Una sonda que sólo se prueba con el caso bueno no sabe fallar. Aquí se le
# mete lo que NO debe pasar y se exige que lo rechace. Si alguna de estas
# cuatro afirmaciones se rompiera, la sonda daría verde con la pantalla
# sirviendo el corte viejo, que es exactamente el fallo que viene a cazar.
if args.autoprueba:
    t = u' Activaciones 2.0 2,148 activaciones · 579 demos · 2020 '
    assert hay(2148),       'no reconoce la forma con coma'
    assert hay(579),        'no reconoce un número de tres dígitos presente'
    assert not hay(2145),   'acepta una cifra que NO está en la página'
    assert re.search(r'\b579\s+demos\b', t), 'no ancla la frase que sí está'
    assert not re.search(r'\b571\s+demos\b', t), 'acepta la frase del corte viejo'
    print(u'\n  autoprueba: los cuatro comparadores distinguen bien.')
    sys.exit(0)

html = pide('/activaciones')
print(u'  /activaciones · %d KB de HTML\n' % (len(html) / 1024))
t = re.sub(r'<[^>]+>', ' ', html)
t = t.replace('&#x27;', "'").replace('&amp;', '&').replace('&quot;', '"')
t = re.sub(r'\s+', ' ', t)

for k, etq in (('filas', u'filas del archivo'),
               ('reales', u'activaciones reales'),
               ('demos', u'demos')):
    exige(hay(esp[k]), u'aparece la cifra de %s (%s)' % (etq, format(esp[k], ',d')))

# La frase, no el número suelto: así la aserción discrimina de verdad.
exige(re.search(r'\b%s\s+demos\b' % format(esp['demos'], ',d'), t) is not None,
      u'la pantalla escribe «%s demos»' % format(esp['demos'], ',d'))

for nom in esp['nuevas']:
    exige(nom.lower() in t.lower(), u'llega la activación de ID más alto «%s»' % nom)

# ── El módulo de clientes arriba de $3,500 ──────────────────────────────────
print(u'')
exige(hay(esp['grandes']),
      u'aparece el conteo de clientes arriba de $3,500 (%s)' % format(esp['grandes'], ',d'))
# El importe se busca con el formato que la pantalla imprime: `Intl` con
# `maximumFractionDigits: 0` da «$1,163,212». Buscar el entero crudo no
# serviría.
exige(format(esp['dinero_grandes'], ',d') in t,
      u'aparece la suma del módulo ($%s)' % format(esp['dinero_grandes'], ',d'))
exige(u'primer pago de la activación' in t.lower(),
      u'el pie aclara que la cifra es el primer pago, no el cobro vigente')
for nom in esp['cabeza']:
    exige(nom.lower() in t.lower(),
          u'el módulo lista a «%s», de los de mayor importe' % nom)

m = re.search(r'Activaciones 2\.0.{0,200}', t)
if m:
    print(u'\n  lo que se lee arriba:\n  %s' % m.group(0)[:200])

print()
if fallos:
    print(u'  *** %d comprobación(es) fallan: la pantalla NO sirve el corte de data/.'
          % len(fallos))
    sys.exit(1)
print(u'  la pantalla sirve el corte que está en data/activaciones.xlsx.')
