# -*- coding: utf-8 -*-
"""Replica lib/focos-riesgo.ts y dice CUANTAS tareas saldrian, y de quien.

   POR QUE EXISTE
   --------------
   La regla de focos toca la carga de trabajo de tres personas y tiene un
   candado que no se puede equivocar: **churn confirmado NO genera actividad
   SAC** (instruccion expresa de direccion, 25 sep 2026). Estas actividades se
   saltan `evaluarElegibilidad` a proposito, asi que si el candado falla, se le
   manda trabajo de retencion a cuentas ya perdidas.

   Sin Node no hay forma de ejecutar el TypeScript, asi que esto replica la
   logica sobre los mismos datos y comprueba:
     · que ninguna cuenta con churn confirmado o cancelacion entre;
     · cuantos focos salen por asesor y por clase;
     · en cuantas semanas se drena el acervo al ritmo configurado.

   Es de SOLO LECTURA.
"""
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UMBRAL = 20          # UMBRAL_CONSUMO_BAJO
POR_SEMANA = 2       # FOCOS_POR_SEMANA

# ── plan-minutos.ts ──────────────────────────────────────────────────
RX_EXT = re.compile(r'(\d+)\s*(?:extensi[oó]n(?:es)?|ext\b)', re.I)
RX_EXT_ABR = re.compile(r'^(\d+)\s+\S.*\bIL\b', re.I)
RX_SIN_VOZ = re.compile(r'\bchat\b|\bagentes?\s+cp\b|sin\s+saldo|n[uú]meros?\s+virtuales?|whatsapp', re.I)


def base_minutos(plan, incl):
    n = str(plan or '')
    m = RX_EXT.search(n) or RX_EXT_ABR.search(n)
    ext = int(m.group(1)) if m else None
    if RX_SIN_VOZ.search(n) and not ext and incl < 3:
        return None
    if ext and ext > 0:
        return incl if (incl > 0 and incl / ext >= 50) else ext * 1500
    return incl if incl >= 3 else None


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s or '')
                if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]', '', s)


def num(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(',', '').strip())
    except (TypeError, ValueError):
        return 0.0


def mes_de(v):
    if isinstance(v, datetime):
        return v.strftime('%Y-%m')
    if isinstance(v, (int, float)):
        return (datetime(1899, 12, 30) + timedelta(days=float(v))).strftime('%Y-%m')
    return str(v or '')[:7]


def ts_strings(ruta, patron):
    """Saca los literales de una lista declarada en un .ts."""
    try:
        s = io.open(os.path.join(RAIZ, ruta), encoding='utf-8').read()
    except OSError:
        return set()
    return {norm(x) for x in re.findall(patron, s)}


# ── cartera ──────────────────────────────────────────────────────────
E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")
req = urllib.request.Request(
    E['NEXT_PUBLIC_SUPABASE_URL'] +
    '/rest/v1/cuentas?select=id,consecutivo,empresa,cid,asesor,estado,health_score,facturacion,tiene_chat_activo&limit=2000',
    headers={'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
             'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY']})
CU = json.load(urllib.request.urlopen(req, timeout=40))

# ── churn confirmado y cancelados ────────────────────────────────────
CHURN = ts_strings('app/churn/aaa-grc-data.ts', r"cliente:\s*'([^']+)'")
CANCEL = ts_strings('lib/churn-cancelados-data.ts', r"cliente:\s*'([^']+)'")
print('nombres en GRC-AAA (todas las filas): %d · cancelados: %d' % (len(CHURN), len(CANCEL)))
# OJO: aqui se toma TODA fila del GRC, no solo las de «Churn confirmado». Es a
# proposito: sobre-excluir es el lado seguro. Si el TS excluye menos, saldran
# MAS focos que los que dice esta simulacion, nunca menos en las de churn.

# ── auditadas en riesgo ──────────────────────────────────────────────
import glob
AUD = set()
for f in glob.glob(os.path.join(RAIZ, 'app', 'auditoria', '*-data.ts')):
    s = io.open(f, encoding='utf-8').read()
    e = re.search(r"^  estado:\s+'([^']+)'", s, re.M)
    n = re.search(r"^  nombre:\s+'([^']+)'", s, re.M)
    if e and n and e.group(1) in ('en_riesgo', 'rescatable', 'en_recuperacion'):
        AUD.add(norm(n.group(1)))

# ── cortes ───────────────────────────────────────────────────────────
wb = openpyxl.load_workbook(os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx'),
                            data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]
idx = {c: i for i, c in enumerate(cab)}
por_cid = defaultdict(list)
for r in it:
    f = {c: (r[i] if i < len(r) else None) for c, i in idx.items()}
    cid = str(f.get('CID') or '').strip()
    if not cid:
        continue
    b = base_minutos(f.get('Nombre del Plan'), num(f.get('Minutos Incluidos')))
    por_cid[cid].append({
        'mes': mes_de(f.get('Fecha de corte')),
        'plan': str(f.get('Nombre del Plan') or ''),
        'cons': num(f.get('Minutos Consumidos')),
        'base': b,
    })
wb.close()
for v in por_cid.values():
    v.sort(key=lambda x: x['mes'])
ULTIMO = max((c['mes'] for v in por_cid.values() for c in v), default='')
print('último mes de corte: %s' % ULTIMO)
print()

# ── la regla ─────────────────────────────────────────────────────────
focos = []
excluidas = Counter()
for c in CU:
    n = norm(c['empresa'])
    if n in CHURN:
        excluidas['churn_grc'] += 1
        continue
    if n in CANCEL:
        excluidas['cancelacion'] += 1
        continue
    est = str(c.get('estado') or '').strip()
    if est in ('cancelado', 'hibernacion'):
        excluidas[est] += 1
        continue

    cid = str(c.get('cid') or '').strip()
    cortes = por_cid.get(cid, [])
    fact = float(c.get('facturacion') or 0)
    chat = bool(c.get('tiene_chat_activo'))

    if cortes and ULTIMO and cortes[-1]['mes'] < ULTIMO:
        focos.append((c, 'sin_corte', fact, chat)); continue
    if n in AUD:
        continue     # lo cubre el seguimiento a auditoría
    if not cortes or cortes[-1]['mes'] != ULTIMO:
        continue
    u = cortes[-1]
    if not u['base']:
        continue
    p = 100.0 * u['cons'] / u['base']
    if p < 0.0001:
        focos.append((c, 'consumo_cero', fact, chat))
    elif p < UMBRAL:
        focos.append((c, 'consumo_bajo', fact, chat))

print('=== CANDADO: cuentas EXCLUIDAS antes de cualquier foco ===')
for k, v in excluidas.most_common():
    print('  %-16s %3d' % (k, v))
print('  total excluidas   %3d de %d' % (sum(excluidas.values()), len(CU)))
print()

colision = [c for c, _, _, _ in focos if norm(c['empresa']) in CHURN or norm(c['empresa']) in CANCEL]
print('  *** cuentas en churn/cancelación que SE COLARON: %d  %s'
      % (len(colision), 'OK' if not colision else [c['empresa'] for c in colision]))
print()

print('=== FOCOS POR ASESOR Y CLASE ===')
por = defaultdict(Counter)
for c, k, _, _ in focos:
    por[c.get('asesor') or '[sin asesor]'][k] += 1
print('  %-12s %10s %12s %12s %8s' % ('ASESOR', 'SIN CORTE', 'CONSUMO 0', 'CONSUMO BAJO', 'TOTAL'))
for a in sorted(por):
    d = por[a]
    t = sum(d.values())
    print('  %-12s %10d %12d %12d %8d'
          % (a, d['sin_corte'], d['consumo_cero'], d['consumo_bajo'], t))
print()
aud_por = Counter()
for f in glob.glob(os.path.join(RAIZ, 'app', 'auditoria', '*-data.ts')):
    s = io.open(f, encoding='utf-8').read()
    e = re.search(r"^  estado:\s+'([^']+)'", s, re.M)
    a = re.search(r"^  asesor:\s+'([^']+)'", s, re.M)
    if e and a and e.group(1) in ('en_riesgo', 'rescatable', 'en_recuperacion'):
        aud_por[a.group(1)] += 1

print('=== ACERVO TOTAL Y CUÁNTO TARDA EN DRENARSE (a %d por semana) ===' % POR_SEMANA)
print('  %-12s %8s %10s %9s %12s' % ('ASESOR', 'FOCOS', 'AUDITORÍA', 'TOTAL', 'SEMANAS'))
for a in sorted(set(list(por) + list(aud_por))):
    f = sum(por[a].values())
    ad = aud_por.get(a, 0)
    # las de auditoría entran completas la primera semana; los focos, de a dos
    import math
    print('  %-12s %8d %10d %9d %12s'
          % (a, f, ad, f + ad, '%d' % math.ceil(f / POR_SEMANA) if f else '—'))
print()
print('  Las de auditoría entran COMPLETAS en la primera corrida (una sola vez).')
print('  Los focos se entregan de %d en %d por semana, los más graves primero.' % (POR_SEMANA, POR_SEMANA))
print()
print('=== LAS QUE DESAPARECIERON DEL CORTE (el foco más grave) ===')
sc = sorted([x for x in focos if x[1] == 'sin_corte'], key=lambda x: -x[2])
for c, _, fact, chat in sc:
    print('  %-5s %-30s %-9s $%-9s %s'
          % (c.get('consecutivo'), c['empresa'][:30], str(c.get('asesor'))[:9],
             format(int(fact), ','), 'chat' if chat else ''))
