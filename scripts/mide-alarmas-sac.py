# -*- coding: utf-8 -*-
"""Qué dispararían las alarmas de mesa ANTES de escribirlas.

   POR QUE EXISTE
   --------------
   Direccion, 9 oct 2026: «habrá que reforzar, robustecer las alarmas de las
   cuentas, darles mayor peso a tus hallazgos». La auditoria encontro que los
   tickets y las fallas NO llegan a ninguna alarma —correlacionan en POSITIVO
   con el health score— y que la mesa de ayuda tiene dias fuera de SLA que el
   motor de alertas no consulta nunca: Torres Corzo lleva un folio escalado
   155 dias y la cuenta va en el lugar 16 del tablero.

   Antes de anadir una alarma hay que saber a cuantas cuentas pega y con
   cuanto dinero detras. Una alarma que salta en el 80% de la cartera no es
   una alarma: es un color de fondo. Y una que no salta nunca tampoco sirve.

   Mide los cuatro umbrales candidatos sobre los datos reales y dice, para
   cada uno, cuantas cuentas, cuanto MRR y quien es el peor caso.

   USO
   ---
       python scripts/mide-alarmas-sac.py
"""
import io
import json
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOTO = (r'C:\Users\manni\AppData\Local\Temp\claude\C--Users-manni--claude'
        r'\dd44f788-ee31-44b8-aaeb-7bdea535f8a3\scratchpad\foto-auditoria.json')
DIR_MESA = os.path.join(RAIZ, 'data', 'mesa-ayuda')


def cortes():
    fs = sorted(f for f in os.listdir(DIR_MESA) if f.endswith('.json'))
    return [json.load(io.open(os.path.join(DIR_MESA, f), encoding='utf-8')) for f in fs]


def pesos(n):
    return '$' + format(int(round(n)), ',d')


todos = cortes()
ultimo = todos[-1]
print(u'  %d cortes de mesa · el ultimo es del %s' % (len(todos), ultimo['fecha']))

foto = json.load(io.open(FOTO, encoding='utf-8'))
rows = foto['fuentes']['veredictos']['rows']
porCid = {}
for r in rows:
    c = (r.get('cid') or '').strip()
    if c:
        porCid[c] = r
total_mrr = sum(float(r['mrr']) for r in rows if r.get('mrr') is not None)
print(u'  %d cuentas vivas · %s de MRR medible\n' % (len(rows), pesos(total_mrr)))

# ── el estado de mesa por CID, igual que `mesaDeCuenta` ───────────────────
vencidos_ult = ultimo.get('ticketsVencidos') or []
cids_ult = {}
for t in vencidos_ult:
    cids_ult.setdefault((t.get('cid') or '').strip(), []).append(t)

racha = {}
for c in todos:
    for cid in {(t.get('cid') or '').strip() for t in (c.get('ticketsVencidos') or [])}:
        racha[cid] = racha.get(cid, 0) + 1


def mrr_de(cid):
    r = porCid.get(cid)
    if not r or r.get('mrr') is None:
        return None
    return float(r['mrr'])


def informa(nombre, cids, extra=''):
    """Cuantas cuentas de la CARTERA pega, y cuanto dinero. Las cuentas de la
       mesa que no estan en la cartera viva se cuentan aparte: son reales pero
       no son de este tablero."""
    en_cartera = [c for c in cids if c in porCid]
    fuera = [c for c in cids if c not in porCid]
    medible = [mrr_de(c) for c in en_cartera]
    dinero = sum(m for m in medible if m is not None)
    sin_imp = sum(1 for m in medible if m is None)
    pct = 100.0 * len(en_cartera) / len(rows) if rows else 0
    print(u'  %-34s %3d cuentas (%4.1f%% de la cartera) · %s%s'
          % (nombre, len(en_cartera), pct, pesos(dinero),
             u' · %d sin importe' % sin_imp if sin_imp else u''))
    if fuera:
        print(u'  %-34s %3d CID(s) de la mesa fuera de la cartera viva: %s'
              % (u'', len(fuera), ', '.join(sorted(fuera)[:6])))
    if extra:
        print(u'  %-34s %s' % (u'', extra))
    return en_cartera


print(u'  ── CANDIDATA 1 · SAC_FUERA_SLA ─────────────────────────────────')
print(u'  Un ticket abierto fuera de SLA en el ULTIMO corte.')
c1 = informa(u'cualquier dia de atraso', list(cids_ult))
for cid in sorted(cids_ult, key=lambda c: -max((t.get('diasSLA') or 0) for t in cids_ult[c])):
    ts = cids_ult[cid]
    peor = max(ts, key=lambda t: t.get('diasSLA') or 0)
    r = porCid.get(cid)
    print(u'      CID %-8s %-26s %3d dias SLA · %3s sin mover · %-10s · %s'
          % (cid, (r['empresa'][:26] if r else peor.get('cuenta', '')[:26]),
             peor.get('diasSLA') or 0, peor.get('diasSinMover') or '—',
             peor.get('estado', ''),
             pesos(mrr_de(cid)) if mrr_de(cid) is not None else 'sin importe'))

print(u'\n  ── CANDIDATA 2 · SAC_ATRASO_CRONICO ────────────────────────────')
print(u'  Aparece con vencidos en varios cortes. «No tuvo un mal dia: no ha')
print(u'  tenido uno bueno.» Umbral candidato: >= 3 de %d cortes.' % len(todos))
for umbral in (2, 3, 5, 8):
    cids = [c for c, n in racha.items() if n >= umbral and c]
    informa(u'>= %d cortes con vencidos' % umbral, cids)
print(u'      ranking de racha:')
for cid, n in sorted(racha.items(), key=lambda kv: -kv[1])[:8]:
    r = porCid.get(cid)
    print(u'        CID %-8s %-28s %2d de %d cortes · %s'
          % (cid, (r['empresa'][:28] if r else '(fuera de la cartera)'), n, len(todos),
             pesos(mrr_de(cid)) if mrr_de(cid) is not None else 'sin importe'))

print(u'\n  ── CANDIDATA 3 · SAC_FALLAS_RECURRENTES ────────────────────────')
print(u'  Fallas del servicio registradas por la mesa. Hoy NO llegan a')
print(u'  ninguna alarma y correlacionan en POSITIVO con el health score.')
for umbral in (1, 2, 3, 5):
    cids = [r['cid'] for r in rows
            if (r['datos'].get('fallas') or 0) >= umbral and r.get('cid')]
    informa(u'>= %d fallas' % umbral, cids)
print(u'      las peores:')
for r in sorted(rows, key=lambda x: -(x['datos'].get('fallas') or 0))[:8]:
    f = r['datos'].get('fallas') or 0
    if not f:
        break
    print(u'        %-30s %2d fallas sobre %s tickets · %s'
          % (r['empresa'][:30], f, r['datos'].get('tickets'),
             pesos(r['mrr']) if r.get('mrr') is not None else 'sin importe'))

print(u'\n  ── CANDIDATA 4 · SIN_IMPORTE ───────────────────────────────────')
print(u'  Cuenta viva sin MRR en NINGUNA fuente. De las ocho fuentes,')
print(u'  facturacion es la unica que se mide, se publica y no dispara nada.')
sin = [r for r in rows if r.get('mrr') is None]
print(u'  %-34s %3d cuentas (%.1f%% de la cartera)'
      % (u'sin importe', len(sin), 100.0 * len(sin) / len(rows)))
for r in sin:
    print(u'        %-30s  situacion actual: %s' % (r['empresa'][:30], r['veredicto']['situacion']))

print(u'\n  ── SOLAPE: ¿las nuevas dirian algo que ya se dice? ─────────────')
ya = {r['cid']: r['veredicto']['situacion'] for r in rows if r.get('cid')}
nuevas = set(c1) | {c for c, n in racha.items() if n >= 3 and c in porCid} \
         | {r['cid'] for r in rows if (r['datos'].get('fallas') or 0) >= 3 and r.get('cid')}
import collections
rep = collections.Counter(ya.get(c) for c in nuevas)
print(u'  %d cuentas tocaria al menos una alarma nueva. Hoy estan en:' % len(nuevas))
for k, v in rep.most_common():
    print(u'      %-20s %3d' % (k, v))
verdes = [c for c in nuevas if ya.get(c) in ('oportunidad', 'en_orden')]
print(u'\n  de esas, %d estan HOY en luz verde y dejarian de estarlo:' % len(verdes))
for c in verdes:
    r = porCid[c]
    print(u'      %-30s %s · %s fallas · racha %d'
          % (r['empresa'][:30],
             pesos(r['mrr']) if r.get('mrr') is not None else 'sin importe',
             r['datos'].get('fallas'), racha.get(c, 0)))
