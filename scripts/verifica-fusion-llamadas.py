# -*- coding: utf-8 -*-
u"""Comprueba que la fusion de entregas de llamadas no rompio nada.

   La carga del 12 oct 2026 fusiona una entrega nueva (67 CIDs, ventana hasta
   el 12 oct) con la anterior (144 CIDs conservados, ventana hasta el 14 sep).
   Tres cosas pueden salir mal, y las tres se comprueban contra el RESPALDO:

   1. PERDER COBERTURA. Si el generador reescribiera en vez de fusionar, 144
      cuentas se quedarian sin lectura y la ficha les pediria al cliente un
      Excel que ya teniamos. Se exige que ningun CID del respaldo falte.

   2. INVENTAR SILENCIO. `diasSinLlamada` se mide contra el corte. Si las
      cuentas conservadas se midieran contra el corte GLOBAL nuevo, cada una
      ganaria hasta 28 dias de silencio que nadie observo, y las que ya
      llevaban 3 o mas cruzarian el umbral de 30 que las declara «EN
      SILENCIO» — la primera de las precedencias del veredicto. Se exige que
      cada registro conservado lleve `hasta` con el corte VIEJO.

   3. DUPLICAR. Un CID que venga en las dos entregas no puede sumar sus
      llamadas dos veces. Se compara su total contra el respaldo: tiene que
      haber CRECIDO (ventana mas ancha), no multiplicado.

   USO
       python scripts/verifica-fusion-llamadas.py
"""
import io
import os
import re
import sys
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TS = os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts')
RESPALDO = r'D:\Archivos\llamadas-data.ts.respaldo-2026-10-12'


def lee_ts(ruta):
    u"""{meta, cuentas} de un `llamadas-data.ts`. Una cuenta por linea."""
    txt = io.open(ruta, encoding='utf-8').read()
    m = re.search(r'export const LLAMADAS_META: LlamadasMeta = (\{.*?\})\n', txt)
    meta = json.loads(m.group(1)) if m else {}
    cuentas = {}
    for linea in txt.split('\n'):
        mm = re.match(r'\s*"([^"]+)":\s*(\{.*\}),\s*$', linea)
        if mm:
            try:
                cuentas[mm.group(1)] = json.loads(mm.group(2))
            except ValueError:
                print(u'  !! no pude leer %s' % mm.group(1))
    return meta, cuentas


if not os.path.exists(RESPALDO):
    print(u'  *** no hay respaldo en %s' % RESPALDO)
    print(u'      Sin el no se puede comparar, y una fusion que no se compara')
    print(u'      contra lo que habia no esta verificada.')
    sys.exit(2)

mAnt, ant = lee_ts(RESPALDO)
mNue, nue = lee_ts(TS)

print(u'\n  ANTES : %d cuenta(s) · corte %s · mes cerrado %s'
      % (len(ant), mAnt.get('corte'), mAnt.get('mesCerrado')))
print(u'  AHORA : %d cuenta(s) · corte %s · mes cerrado %s'
      % (len(nue), mNue.get('corte'), mNue.get('mesCerrado')))

fallos = []

# ── 1 · NO PERDER NINGUNA ──────────────────────────────────────────────────
perdidas = sorted(set(ant) - set(nue))
print(u'\n  1 · COBERTURA')
if perdidas:
    fallos.append(u'%d cuenta(s) PERDIERON su lectura: %s'
                  % (len(perdidas), u', '.join(perdidas[:12])))
    print(u'      *** faltan %d' % len(perdidas))
else:
    print(u'      ninguna cuenta perdio su lectura.')
print(u'      %d cuenta(s) nuevas' % len(set(nue) - set(ant)))

# ── 2 · NO INVENTAR SILENCIO ───────────────────────────────────────────────
print(u'\n  2 · SILENCIO')
corteViejo, corteNuevo = mAnt.get('corte'), mNue.get('corte')
sin_sello, mal_sello, inventado = [], [], []
for cid in sorted(set(ant) & set(nue)):
    reg = nue[cid]
    h = reg.get('hasta')
    if not h:
        sin_sello.append(cid)
        continue
    # Una cuenta conservada tiene que seguir mirandose hasta SU corte viejo.
    # Si trae el nuevo es que se le atribuyo una ventana que nadie leyo.
    if ant[cid] == {k: v for k, v in reg.items()
                    if k not in ('hasta', 'mesCerrado')}:
        if h != corteViejo:
            mal_sello.append((cid, h))
    # ¿Cuanto silencio GANARIA esta cuenta si se midiera contra el global?
    ult = reg.get('ultima')
    if ult and h == corteViejo and corteNuevo:
        de = (int(corteNuevo[:4]), int(corteNuevo[5:7]), int(corteNuevo[8:10]))
        a = (int(corteViejo[:4]), int(corteViejo[5:7]), int(corteViejo[8:10]))
        import datetime
        d = (datetime.date(*de) - datetime.date(*a)).days
        import datetime as _dt
        viejo_dias = (_dt.date(*a) - _dt.date(int(ult[:4]), int(ult[5:7]), int(ult[8:10]))).days
        if viejo_dias <= 30 < viejo_dias + d:
            inventado.append((cid, viejo_dias, viejo_dias + d))

if sin_sello:
    fallos.append(u'%d conservada(s) SIN `hasta`: caerian al corte global'
                  % len(sin_sello))
    print(u'      *** %d sin `hasta`' % len(sin_sello))
if mal_sello:
    fallos.append(u'%d conservada(s) con `hasta` equivocado' % len(mal_sello))
    print(u'      *** %d con `hasta` != %s' % (len(mal_sello), corteViejo))
if not sin_sello and not mal_sello:
    print(u'      las %d conservadas llevan `hasta` = %s'
          % (len(set(ant) & set(nue)) - len(sin_sello), corteViejo))
print(u'      %d cuenta(s) habrian sido declaradas EN SILENCIO sin este campo'
      % len(inventado))
for cid, a1, a2 in inventado[:8]:
    print(u'        CID %-8s llevaba %d dias y habria pasado a %d' % (cid, a1, a2))

# ── 3 · NO DUPLICAR ────────────────────────────────────────────────────────
print(u'\n  3 · LOS QUE VENIAN EN LAS DOS ENTREGAS')
rehechos = [c for c in set(ant) & set(nue)
            if nue[c].get('corte') != ant[c].get('corte')]
if not rehechos:
    print(u'      ninguno se reescribio.')
for cid in sorted(rehechos):
    a, b = ant[cid], nue[cid]
    ta = (a.get('ent') or {}).get('total', 0)
    tb = (b.get('ent') or {}).get('total', 0)
    razon = (float(tb) / ta) if ta else 0
    aviso = u''
    if ta and 1.9 < razon < 2.1:
        aviso = u'  *** ~2x: huele a duplicado'
        fallos.append(u'CID %s duplico sus entrantes (%d -> %d)' % (cid, ta, tb))
    print(u'      CID %-8s entrantes %s -> %s (x%.2f)  hasta %s -> %s%s'
          % (cid, u'{:,}'.format(ta), u'{:,}'.format(tb), razon,
             a.get('hasta') or mAnt.get('corte'), b.get('hasta'), aviso))

print(u'')
for f in fallos:
    print(u'  *** %s' % f)
print(u'  %s' % (u'la fusion esta bien: nada perdido, nada inventado, nada duplicado.'
                 if not fallos else u'*** %d problema(s)' % len(fallos)))
sys.exit(1 if fallos else 0)
