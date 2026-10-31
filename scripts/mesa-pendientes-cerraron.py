# -*- coding: utf-8 -*-
u"""LOS FOLIOS QUE LA MESA DEJO ABIERTOS, ¿YA CERRARON?

   Las DOS mitades del soporte miden momentos distintos y nadie las cruza:

     - `data/mesa-ayuda/*.json` sabe que un folio esta ABIERTO, pero se queda
       congelado el dia que deja de subirse el corte.
     - `lib/tickets-data.json` solo trae CERRADOS, y llega hasta hoy.

   O sea que el export de tickets es la UNICA forma de saber si un folio que
   la mesa dejo ardiendo ya se apago. Mientras no cruzen, un ticket de 155
   dias puede llevar otro mes abierto y la pantalla sigue diciendo 155.

   Lo que imprime, por cada folio del ultimo corte de la mesa:
     CERRADO   -> con su fecha y cuantos dias tardo de verdad
     SIN RASTRO-> no esta en el export, asi que SIGUE ABIERTO. Se dice
                  cuantos dias lleva YA, no los que decia el corte.

   El folio (`num`) NO identifica al ticket —conviven dos series de
   numeracion— asi que se busca por `num` Y se enseña cuantas filas casaron.
   Ver [[tickets-fuente]].

   USO
       python scripts/mesa-pendientes-cerraron.py
       python scripts/mesa-pendientes-cerraron.py 2026-10-05
"""
import glob
import io
import json
import os
import sys
from datetime import datetime, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(RAIZ, 'data', 'mesa-ayuda')
OFFSET = timedelta(hours=6)          # [[feedback-fechas-zona-mexico]]


def mx(iso):
    u"""UTC con sufijo Z -> hora de Mexico. Devuelve None si no se puede."""
    try:
        return datetime.strptime((iso or '')[:19], '%Y-%m-%dT%H:%M:%S') - OFFSET
    except (ValueError, TypeError):
        return None


cortes = sorted(glob.glob(os.path.join(DIR, '*.json')))
if not cortes:
    print(u'  *** no hay ningun corte en %s' % DIR)
    raise SystemExit(1)
if len(sys.argv) > 1:
    pedido = os.path.join(DIR, sys.argv[1] + '.json')
    if not os.path.exists(pedido):
        print(u'  *** no existe el corte %s' % pedido)
        raise SystemExit(1)
    corte = pedido
else:
    corte = cortes[-1]

m = json.load(io.open(corte, encoding='utf-8'))
fecha_corte = os.path.basename(corte)[:-5]

T = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))
T = T['tickets'] if isinstance(T, dict) else T
hasta = max((t.get('cierre') or t.get('apertura') or '') for t in T)[:10]

por_num = {}
for t in T:
    por_num.setdefault(str(t.get('num') or '').strip(), []).append(t)

print(u'\n  ══ FOLIOS ABIERTOS EN LA MESA · corte %s ════════════════' % fecha_corte)
print(u'  el export de tickets llega al %s — %s dias despues.'
      % (hasta, (datetime.strptime(hasta, '%Y-%m-%d')
                 - datetime.strptime(fecha_corte, '%Y-%m-%d')).days))

# El corte guarda los folios bajo distintas claves segun la version; se
# aceptan las conocidas y se DICE cual se uso, en vez de fallar en silencio.
folios = None
for k in ('ticketsVencidos', 'pendientes', 'abiertos', 'folios', 'tickets', 'detalle'):
    if isinstance(m.get(k), list) and m[k]:
        folios, clave = m[k], k
        break
if folios is None:
    print(u'  *** el corte no trae ninguna lista de folios conocida.')
    print(u'      claves que trae: %s' % u', '.join(sorted(m.keys())))
    raise SystemExit(1)
print(u'  %d folio(s) en la clave «%s».\n' % (len(folios), clave))

hoy = datetime.strptime(hasta, '%Y-%m-%d')
sigue, cerrados = [], []
for f in folios:
    num = str(f.get('num') or f.get('folio') or f.get('ticket') or '').strip()
    cuenta = f.get('cuenta') or f.get('empresa') or '—'
    # `diasSLA` es lo VENCIDO sobre el compromiso, no la edad del folio; es
    # la cifra que publica el corte y la que hay que seguir contando.
    dias_corte = f.get('diasSLA') if f.get('diasSLA') is not None else f.get('dias')
    filas = por_num.get(num, [])
    if filas:
        fila = max(filas, key=lambda t: (t.get('cierre') or ''))
        cie = mx(fila.get('cierre'))
        ape = mx(fila.get('apertura'))
        real = (cie - ape).days if (cie and ape) else None
        cerrados.append((num, cuenta, cie, real, len(filas)))
    else:
        ya = None
        if isinstance(dias_corte, int):
            ya = dias_corte + (hoy - datetime.strptime(fecha_corte, '%Y-%m-%d')).days
        sigue.append((num, cuenta, dias_corte, ya))

if cerrados:
    print(u'  CERRARON (%d):' % len(cerrados))
    for num, cuenta, cie, real, n in sorted(cerrados, key=lambda x: -(x[3] or 0)):
        print(u'    #%-9s %-32s cerro %s · %s dias%s'
              % (num, cuenta[:32], cie.strftime('%Y-%m-%d') if cie else '¿?',
                 real if real is not None else '¿?',
                 u'  (OJO: %d filas con ese folio)' % n if n > 1 else u''))
if sigue:
    print(u'\n  SIN RASTRO EN EL EXPORT — SIGUEN ABIERTOS (%d):' % len(sigue))
    for num, cuenta, dias_corte, ya in sorted(sigue, key=lambda x: -(x[3] or 0)):
        print(u'    #%-9s %-32s decia %s dias  ->  HOY LLEVA %s'
              % (num, cuenta[:32],
                 dias_corte if dias_corte is not None else u'¿?',
                 ya if ya is not None else u'¿? (el corte no trae los dias)'))
    print(u'\n  Un folio sin rastro NO esta medido en ningun lado: la mesa lo dejo')
    print(u'  congelado el %s y el export solo trae cerrados.' % fecha_corte)

if not cerrados and not sigue:
    print(u'  el corte no listaba folios abiertos.')
