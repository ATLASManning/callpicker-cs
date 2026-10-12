# -*- coding: utf-8 -*-
u"""¿Cuanta cobertura REAL aportan los archivos nuevos de llamadas?

   «63 CIDs nuevos» no es lo mismo que «63 cuentas nuevas»: un CID del archivo
   solo vale si corresponde a una cuenta de la cartera. Este guion cruza por
   CID —nunca por nombre, que mezcla cuentas— y dice:

     · cuantas cuentas GANAN lectura
     · cuantas la tenian y la mantienen
     · cuantas la tenian y NO vienen en los archivos nuevos (las que perderian
       la lectura si se REEMPLAZARA en vez de fusionar)
     · cuantos CIDs del archivo no corresponden a ninguna cuenta viva

   USO
       python scripts/mide-cobertura-llamadas-nueva.py <cids.json>

   donde `cids.json` lo escribe `sonda-llamadas-nuevas.py --json`, o bien se
   le pasan los .xlsx y los lee (lento).
"""
import io
import os
import re
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')


def trae(tabla, select):
    filas, desde = [], 0
    while True:
        u = u'%s/rest/v1/%s?select=%s&offset=%d&limit=1000' % (URL, tabla, select, desde)
        r = urllib.request.Request(u, headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
        lote = json.loads(urllib.request.urlopen(r, timeout=90).read().decode('utf-8'))
        filas.extend(lote)
        if len(lote) < 1000:
            return filas
        desde += 1000


def cids_del_ts():
    p = os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts')
    txt = io.open(p, encoding='utf-8').read()
    m = re.search(r'export const LLAMADAS\s*:\s*Record<[^>]*>\s*=\s*\{', txt)
    ini = m.end()
    nivel, i = 1, ini
    while i < len(txt) and nivel > 0:
        if txt[i] == '{':
            nivel += 1
        elif txt[i] == '}':
            nivel -= 1
        i += 1
    return set(re.findall(r'"([^"]+)"\s*:\s*\{', txt[ini:i - 1]))


if len(sys.argv) < 2:
    print(__doc__); sys.exit(2)
nuevos = set(str(c) for c in json.load(io.open(sys.argv[1], encoding='utf-8')))

ya = cids_del_ts()
cuentas = trae('cuentas', 'id,cid,consecutivo,empresa,asesor,estado,facturacion')
vivas = [c for c in cuentas if (c.get('estado') or '').lower() in ('activo', 'en_riesgo')]
porCid = {}
for c in vivas:
    if c.get('cid'):
        porCid[str(c['cid']).strip()] = c

print(u'\n  cartera viva: %d cuenta(s), %d con CID' % (len(vivas), len(porCid)))
print(u'  lectura de llamadas HOY: %d CID(s)' % len(ya))
print(u'  los archivos nuevos traen: %d CID(s)\n' % len(nuevos))


def dinero(cs):
    return sum(float(c.get('facturacion') or 0) for c in cs)


gana   = [porCid[c] for c in (nuevos - ya) if c in porCid]
refres = [porCid[c] for c in (nuevos & ya) if c in porCid]
pierde = [porCid[c] for c in (ya - nuevos) if c in porCid]
huerfanos = sorted(nuevos - set(porCid))
sin_nada = [c for cid, c in porCid.items() if cid not in ya and cid not in nuevos]

print(u'  %-52s %3d  $%s' % (u'GANAN lectura (no la tenian)', len(gana), u'{:,.0f}'.format(dinero(gana))))
print(u'  %-52s %3d  $%s' % (u'la REFRESCAN (ya la tenian)', len(refres), u'{:,.0f}'.format(dinero(refres))))
print(u'  %-52s %3d  $%s' % (u'la tienen y NO vienen en los nuevos', len(pierde), u'{:,.0f}'.format(dinero(pierde))))
print(u'  %-52s %3d  $%s' % (u'seguirian SIN lectura', len(sin_nada), u'{:,.0f}'.format(dinero(sin_nada))))
print(u'  %-52s %3d' % (u'CIDs del archivo sin cuenta viva', len(huerfanos)))

print(u'\n  ── SI SE FUSIONA (lo correcto) ──────────────────────────────')
print(u'  cobertura: %d -> %d cuenta(s) con lectura'
      % (len(refres) + len(pierde), len(gana) + len(refres) + len(pierde)))
print(u'  ── SI SE REEMPLAZA (lo que pasaria al correr el generador tal cual) ──')
print(u'  cobertura: %d -> %d  ·  *** %d cuenta(s) PERDERIAN su lectura, $%s'
      % (len(refres) + len(pierde), len(gana) + len(refres), len(pierde),
         u'{:,.0f}'.format(dinero(pierde))))

if gana:
    print(u'\n  LAS QUE GANAN LECTURA (las 18 de mayor facturacion):')
    for c in sorted(gana, key=lambda x: -float(x.get('facturacion') or 0))[:18]:
        print(u'    %-6s %-38s %-9s $%s'
              % (c.get('consecutivo') or u'—', (c.get('empresa') or u'')[:38],
                 c.get('asesor') or u'—', u'{:,.0f}'.format(float(c.get('facturacion') or 0))))

if huerfanos:
    print(u'\n  CIDs del archivo que NO son de una cuenta viva: %s%s'
          % (u', '.join(huerfanos[:14]), u' …' if len(huerfanos) > 14 else u''))
    print(u'  (pueden ser cuentas dormidas, canceladas, o CID mal capturado)')
