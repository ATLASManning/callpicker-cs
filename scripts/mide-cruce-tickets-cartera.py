# -*- coding: utf-8 -*-
u"""Cuanto del archivo de Tickets cae dentro de la cartera, y que cuentas no cruzan.

   POR QUE EXISTE
   --------------
   El export de Zoho Desk cubre TODO Callpicker, no solo la cartera gestionada:
   la mayoria de sus CIDs son clientes que ningun asesor lleva. Lo que importa
   para el tablero es la otra direccion: **que cuentas de la cartera no tienen
   ni un ticket**, porque eso es una fuente vacia en su ficha.

   SE CRUZA POR CID Y NUNCA POR NOMBRE
   -----------------------------------
   El cruce difuso por primera palabra ya se probo y se elimino: le colgaba a 38
   cuentas los tickets de OTRA empresa, 247 mal atribuidos. «Remax Homelife»
   emparejaba con 30 franquicias Remax distintas. Y la columna CUENTA del
   archivo es la ETIQUETA del numero, no la razon social — hay CIDs con varios
   nombres. Ver [[dids-fuente]] y [[tickets-fuente]].

   Los CID 0 y 1 NO son clientes: son trafico interno (Callpicker, Digitum,
   'sin cuenta') y se cuentan aparte.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/mide-cruce-tickets-cartera.py
"""
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY'],
     'Accept': 'application/json'}
B = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'


def supa(tabla, params):
    """POR PAGINAS: PostgREST corta en 1000 filas y devuelve 200 sin avisar."""
    filas, desde, paso = [], 0, 1000
    while True:
        q = dict(params)
        q['limit'] = paso
        q['offset'] = desde
        r = urllib.request.Request(B + tabla + '?' + urllib.parse.urlencode(q), headers=H)
        with urllib.request.urlopen(r, timeout=120) as x:
            lote = json.loads(x.read().decode())
        filas.extend(lote)
        if len(lote) < paso:
            return filas
        desde += paso


def cid_util(v):
    """Un CID que sirve para cruzar. 0 y el vacio son huecos, no CIDs."""
    s = re.sub(r'\D', '', str(v or '').strip())
    return s if s and s != '0' else ''


# ── El archivo ──────────────────────────────────────────────────────────────
d = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))
filas = d['tickets'] if isinstance(d, dict) and 'tickets' in d else d
print(u'  archivo: %s tickets' % format(len(filas), ',d'))

por_cid = {}
internos = 0
for t in filas:
    c = str(t.get('cid') or '').strip()
    if c in ('0', '1'):
        internos += 1
        continue
    k = cid_util(c)
    if not k:
        internos += 1
        continue
    por_cid[k] = por_cid.get(k, 0) + 1
print(u'  CIDs de cliente: %s · tickets internos (CID 0 y 1): %d'
      % (format(len(por_cid), ',d'), internos))

# ── La cartera ──────────────────────────────────────────────────────────────
cuentas = supa('cuentas', {'select': 'cid,empresa,asesor,estado,consecutivo',
                           'asesor': 'not.is.null', 'order': 'empresa'})
cuentas = [c for c in cuentas if str(c.get('asesor') or '').strip()]
print(u'  cartera: %d cuentas con asesor' % len(cuentas))

con, sin, sin_cid = [], [], []
atribuibles = 0
for c in cuentas:
    k = cid_util(c.get('cid'))
    if not k:
        sin_cid.append(c)
        continue
    n = por_cid.get(k, 0)
    if n > 0:
        con.append((c, n))
        atribuibles += n
    else:
        sin.append(c)

assert len(con) + len(sin) + len(sin_cid) == len(cuentas), u'el reparto no cierra'

print(u'\n  ── CUANTO DEL ARCHIVO ES DE LA CARTERA ──────────────────────')
print(u'     %s de %s tickets de cliente son atribuibles a una cuenta (%.0f%%)'
      % (format(atribuibles, ',d'), format(len(filas) - internos, ',d'),
         100.0 * atribuibles / max(len(filas) - internos, 1)))
print(u'     el resto son clientes de Callpicker que ningun asesor lleva.')

print(u'\n  ── CUANTO DE LA CARTERA TIENE TICKETS ───────────────────────')
print(u'     con tickets : %3d' % len(con))
print(u'     SIN tickets : %3d' % len(sin))
print(u'     sin CID util: %3d' % len(sin_cid))

VIVAS = ('activo', 'en_riesgo')
sin_vivas = [c for c in sin if str(c.get('estado')) in VIVAS]
print(u'\n  ── LAS %d CUENTAS SIN UN SOLO TICKET ────────────────────────' % len(sin))
print(u'     de ellas %d estan vivas (activo o en_riesgo) y %d no.'
      % (len(sin_vivas), len(sin) - len(sin_vivas)))
print(u'     Cero tickets NO es señal de cuenta sana: puede ser que no pase por')
print(u'     la mesa de ayuda. Ver [[grupo-petroil]], donde F32 tiene cero por')
print(u'     eso y no por estar apagada.')
por_asesor = {}
for c in sin_vivas:
    por_asesor.setdefault(str(c.get('asesor')), []).append(c)
for a in sorted(por_asesor):
    g = sorted(por_asesor[a], key=lambda x: str(x.get('empresa') or '').lower())
    print(u'\n     %s — %d' % (a, len(g)))
    for c in g:
        print(u'       %-40s %-6s CID %-9s %s'
              % (str(c.get('empresa') or '')[:40], c.get('consecutivo') or '',
                 c.get('cid') or u'(vacío)', c.get('estado')))

if sin_cid:
    print(u'\n  ── CUENTAS SIN CID UTIL (no se pueden cruzar con nada) ──────')
    for c in sin_cid:
        print(u'       %-40s %-6s cid=%r'
              % (str(c.get('empresa') or '')[:40], c.get('consecutivo') or '', c.get('cid')))
