# -*- coding: utf-8 -*-
u"""Que alarmas destapa la entrega de llamadas de octubre 2026.

   Las 63 cuentas que ganan lectura llevaban meses siendo «no la vemos»: el
   tablero no podia decir nada de su atencion telefonica. Este guion aplica
   las MISMAS reglas que `lib/llamadas-cuenta.ts` —mismos umbrales, leidos de
   ahi y no copiados— y ordena lo que aparecio.

   NO inventa un veredicto: para una cuenta sin base suficiente dice que no
   se puede comparar, en vez de publicar un porcentaje suelto.

   USO
       python scripts/alarmas-llamadas-nuevas.py
"""
import io
import os
import re
import sys
import json
import datetime
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def umbral(nombre):
    u"""El umbral, LEIDO de lib/llamadas-cuenta.ts. Copiarlo seria crear una
       segunda definicion que se puede desincronizar en silencio."""
    txt = io.open(os.path.join(RAIZ, 'lib', 'llamadas-cuenta.ts'), encoding='utf-8').read()
    m = re.search(r'\b%s:\s*([\d.]+)' % nombre, txt)
    if not m:
        raise SystemExit('no encontre el umbral %s en lib/llamadas-cuenta.ts' % nombre)
    return float(m.group(1))


MES_MINIMO = umbral('MES_MINIMO')
BASE_MINIMA = umbral('BASE_MINIMA')
PTS_LLAMA = umbral('PTS_LLAMA')
PTS_VIGILAR = umbral('PTS_VIGILAR')
DIAS_SILENCIO = umbral('DIAS_SILENCIO')
VOLUMEN_MINIMO = umbral('VOLUMEN_MINIMO')


def env(clave):
    for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
req = urllib.request.Request(
    URL + '/rest/v1/cuentas?select=cid,consecutivo,empresa,asesor,estado,facturacion&limit=1000',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
cuentas = json.loads(urllib.request.urlopen(req, timeout=90).read().decode('utf-8'))
porCid = {str(c['cid']).strip(): c for c in cuentas
          if c.get('cid') and (c.get('estado') or '').lower() in ('activo', 'en_riesgo')}

txt = io.open(os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts'), encoding='utf-8').read()
LL = {}
for linea in txt.split('\n'):
    m = re.match(r'\s*"([^"]+)":\s*(\{.*\}),\s*$', linea)
    if m:
        LL[m.group(1)] = json.loads(m.group(2))

filas = []
for cid, d in LL.items():
    c = porCid.get(cid)
    if not c:
        continue
    if d.get('corte') != 'oct-2026':
        continue                      # solo lo que destapa esta entrega
    ent = d.get('ent') or {}
    cer = d.get('cerrado')
    base = d.get('base') or {}
    total = ent.get('total', 0)
    mrr = float(c.get('facturacion') or 0)

    pct = (100.0 * cer['l'] / cer['t']) if cer and cer['t'] else None
    pctBase = (100.0 * base['l'] / base['t']) if base.get('t') else None
    comparable = bool(cer and cer['t'] >= MES_MINIMO and base.get('t', 0) >= BASE_MINIMA)
    delta = (pct - pctBase) if (comparable and pct is not None and pctBase is not None) else None

    ult, hasta = d.get('ultima'), d.get('hasta')
    dias = None
    if ult and hasta:
        dias = (datetime.date(int(hasta[:4]), int(hasta[5:7]), int(hasta[8:10]))
                - datetime.date(int(ult[:4]), int(ult[5:7]), int(ult[8:10]))).days

    if dias is not None and dias > DIAS_SILENCIO:
        v, orden = u'EN SILENCIO', 0
    elif total < VOLUMEN_MINIMO:
        v, orden = u'sin volumen', 4
    elif delta is not None and delta >= PTS_LLAMA:
        v, orden = u'LLAMA ESTA SEMANA', 1
    elif delta is not None and delta >= PTS_VIGILAR:
        v, orden = u'vigilar', 2
    elif delta is None:
        v, orden = u'sin base para comparar', 3
    else:
        v, orden = u'estable', 5
    filas.append((orden, -mrr, c, v, pct, pctBase, delta, total, dias))

filas.sort(key=lambda x: (x[0], x[1]))

print(u'\n  LO QUE DESTAPA LA ENTREGA DE OCTUBRE — %d cuenta(s) con lectura nueva\n'
      % len(filas))
print(u'  %-6s %-34s %-9s %11s %7s %7s %8s  %s'
      % (u'cons', u'cuenta', u'asesor', u'$/mes', u'sin', u'base', u'delta', u'veredicto'))
print(u'  ' + u'─' * 108)
for _, _, c, v, pct, pctBase, delta, total, dias in filas:
    print(u'  %-6s %-34s %-9s %11s %7s %7s %8s  %s'
          % (c.get('consecutivo') or u'—', (c.get('empresa') or u'')[:34],
             c.get('asesor') or u'—',
             u'{:,.0f}'.format(float(c.get('facturacion') or 0)),
             u'%.0f%%' % pct if pct is not None else u'—',
             u'%.0f%%' % pctBase if pctBase is not None else u'—',
             u'%+.1f' % delta if delta is not None else u'—',
             v + (u' (%d d)' % dias if v == u'EN SILENCIO' else u'')))

print(u'')
for etq in (u'EN SILENCIO', u'LLAMA ESTA SEMANA', u'vigilar'):
    g = [f for f in filas if f[3] == etq]
    if g:
        print(u'  %-20s %2d cuenta(s) · $%s al mes'
              % (etq, len(g), u'{:,.0f}'.format(sum(float(f[2].get('facturacion') or 0) for f in g))))
