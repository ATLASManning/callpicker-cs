# -*- coding: utf-8 -*-
u"""QUE LUGAR OCUPA UNA CUENTA POR IMPORTE, CON LA MISMA REGLA DEL TABLERO.

   «TOP» no es una columna: se DERIVA de las 25 de mayor importe entre las
   cuentas `activo` o `en_riesgo`, con el importe resuelto por
   `importeDeCuenta` — GRC `mrrFin` por CID, y si el GRC no la tiene, lo que
   trae la ficha. [[altas-cuentas]]

   Escribir «la cuenta numero N de la cartera» en una auditoria sin medirlo es
   como se publico que GTC era el 23.3% de la cartera: con un denominador que
   ya no existia. Esto imprime el lugar, el importe, Y EL DENOMINADOR, porque
   el porcentaje depende de cual se use y el repo ya lo movio dos veces.

   Es de SOLO LECTURA. Las credenciales salen de `.env.local` y no se imprimen.

   USO
       python scripts/mide-rango-cuenta.py F16
"""
import io
import os
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if len(sys.argv) < 2:
    print(__doc__); sys.exit(2)
CONS = sys.argv[1].strip().upper()

N_TOP = 25  # lib/facturacion-cuenta.ts


def env(c):
    for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        l = l.strip()
        if l.startswith(c + '='):
            return l.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')


def trae(ruta):
    r = urllib.request.Request(URL + '/rest/v1/' + ruta,
                               headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
    return json.loads(urllib.request.urlopen(r, timeout=90).read().decode('utf-8'))


# ── El mapa del GRC por CID, sumando las lineas del mismo CID ──────────────
G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
por_cid = {}
for x in G['filas']:
    cid = str(x.get('cid') or '').strip()
    if not cid:
        continue
    d = por_cid.setdefault(cid, {'mrr': 0.0, 'filas': 0})
    d['mrr'] += float(x.get('mrrFin') or 0)
    d['filas'] += 1

cuentas = trae('cuentas?select=id,consecutivo,empresa,asesor,estado,cid,facturacion'
               '&estado=in.(activo,en_riesgo)')


def importe(c):
    u"""Espejo de `importeDeCuenta`: GRC por CID gana; si no, la ficha."""
    cid = str(c.get('cid') or '').strip()
    g = por_cid.get(cid)
    if g and g['mrr'] > 0:
        return g['mrr'], u'grc', g['filas']
    propio = float(c.get('facturacion') or 0)
    if propio > 0:
        return propio, u'ficha', 0
    return 0.0, u'sin_dato', 0


filas = []
for c in cuentas:
    mrr, origen, nf = importe(c)
    filas.append((mrr, origen, nf, c))
filas.sort(key=lambda t: -t[0])

mia = [i for i, t in enumerate(filas, 1) if (t[3].get('consecutivo') or u'').upper() == CONS]
if not mia:
    print(u'  *** %s no esta entre las cuentas activo/en_riesgo.' % CONS); sys.exit(1)
pos = mia[0]
mrr, origen, nf, c = filas[pos - 1]
total = sum(t[0] for t in filas)
con_dato = [t for t in filas if t[0] > 0]

print(u'\n  ══ RANGO POR IMPORTE · %s · %s ══════════════════' % (CONS, c.get('empresa')))
print(u'  importe        $%s al mes (origen: %s%s)'
      % (u'{:,.2f}'.format(mrr), origen,
         u', %d linea(s) del CID' % nf if nf else u''))
print(u'  ficha dice     $%s%s'
      % (u'{:,.2f}'.format(float(c.get('facturacion') or 0)),
         u'   <<< LA FICHA NO SIRVE PARA RANKEAR' if origen == 'grc' and
         abs(float(c.get('facturacion') or 0) - mrr) > 0.05 * max(mrr, 1) else u''))
print(u'  lugar          #%d de %d cuentas activo/en_riesgo (%d con importe > 0)'
      % (pos, len(filas), len(con_dato)))
print(u'  TOP (25)       %s' % (u'SI' if pos <= N_TOP else u'no'))

# El lugar que ocuparia con la cifra de la ficha: es la medida de lo que el
# dato viejo escondia. Un cero no baja un puesto — saca de la lista.
propio = float(c.get('facturacion') or 0)
alt = sorted((float(x[3].get('facturacion') or 0) for x in filas), reverse=True)
pos_ficha = alt.index(propio) + 1 if propio in alt else None
if pos_ficha and pos_ficha != pos:
    print(u'  con la cifra de la ficha seria la #%d: %d lugares de diferencia.'
          % (pos_ficha, abs(pos_ficha - pos)))

print(u'\n  EL DENOMINADOR, que es lo que hace mentir a un porcentaje:')
print(u'    suma de los importes resueltos  $%s' % u'{:,.0f}'.format(total))
print(u'    -> la cuenta es el %.2f%% de ESA suma' % (100.0 * mrr / total if total else 0))
print(u'    OJO: no es «el %» de la cartera. Hay lineas de GRC sin CID que no')
print(u'    entran aqui (GTC son 19), asi que este denominador es un PISO y el')
print(u'    porcentaje un TECHO. Si hay que publicar un %, se dice contra que.')

asesor = c.get('asesor')
suyas = [t for t in filas if t[3].get('asesor') == asesor]
p2 = [i for i, t in enumerate(suyas, 1)
      if (t[3].get('consecutivo') or u'').upper() == CONS][0]
tot2 = sum(t[0] for t in suyas)
print(u'\n  dentro de %s: #%d de %d cuentas · %.2f%% de sus $%s'
      % (asesor, p2, len(suyas), 100.0 * mrr / tot2 if tot2 else 0,
         u'{:,.0f}'.format(tot2)))
print(u'  sus mayores: %s'
      % u', '.join(u'%s $%s' % (t[3].get('consecutivo'), u'{:,.0f}'.format(t[0]))
                   for t in suyas[:6]))
print(u'')
