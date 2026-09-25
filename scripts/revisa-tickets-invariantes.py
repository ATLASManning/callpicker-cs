# -*- coding: utf-8 -*-
"""Comprueba que `lib/tickets-norm.ts` sigue siendo cierto con el dataset de hoy.

   POR QUE EXISTE
   --------------
   La capa de normalizacion se escribio y se verifico contra un corte concreto
   (5,871 filas, sep 2026). El export crece cada semana, y con el pueden llegar
   valores que la capa no contempla. Dos que romperian en silencio:

     - Un propietario nuevo que COLISIONE al fundirse. La clave es nombre +
       inicial del apellido, precisamente porque «Jose Antonio R.» y «Jose
       Manuel L.» son dos personas. Si mañana entra «Jose Antonio Perez», se
       fundiria con del Rio y le atribuiriamos su trabajo a otro.
     - Una categoria o prioridad nueva, que caeria en «Sin clasificar» / «Sin
       prioridad» sin avisar. (`diff-tickets.py` ya avisa del valor nuevo; esto
       comprueba la CONSECUENCIA.)

   Y de paso revalida los cierres: las particiones tienen que sumar el universo.

   Es de SOLO LECTURA. Correr despues de cada actualizacion del Excel.
"""
import io
import json
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))

fallos = []


def check(cond, msg):
    print('  %-4s %s' % ('OK' if cond else '***', msg))
    if not cond:
        fallos.append(msg)


def sin_acentos(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s or '')
                   if unicodedata.category(c) != 'Mn')


def clave(s):
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9\s]', ' ', sin_acentos(s).lower())).strip()


print('dataset: %d filas' % len(T))
print()

# ══ PROPIETARIOS: el fundido no debe mezclar personas ═══════════════
print('=== PROPIETARIOS ===')


def clave_prop(p):
    k = clave(p)
    if not k:
        return ''
    t = k.split(' ')
    return '%s %s' % (t[0], t[1][0]) if len(t) > 1 else t[0]


grupos = defaultdict(lambda: {'var': Counter(), 'total': 0})
for t in T:
    p = (t['propietario'] or '').strip()
    if not p:
        continue
    k = clave_prop(p)
    if k:
        grupos[k]['var'][p] += 1
        grupos[k]['total'] += 1

claves = list(grupos)
redirige = {}
for k in claves:
    if ' ' in k:
        continue
    cand = [o for o in claves if o != k and o.startswith(k + ' ')]
    if len(cand) == 1:
        redirige[k] = cand[0]
    elif len(cand) > 1:
        fallos.append('el nombre suelto «%s» encaja en %d grupos: %s — queda aparte, '
                      'revisar a mano' % (k, len(cand), cand))
for desde, hacia in redirige.items():
    grupos[hacia]['var'].update(grupos[desde]['var'])
    grupos[hacia]['total'] += grupos[desde]['total']
    del grupos[desde]

print('  %d cadenas distintas -> %d personas/colas'
      % (len({t['propietario'] for t in T if (t['propietario'] or '').strip()}), len(grupos)))

# Dentro de un grupo, TODOS los apellidos completos deben ser compatibles.
for k, g in grupos.items():
    completos = set()
    for v in g['var']:
        toks = sin_acentos(v).lower().replace('.', ' ').split()
        if len(toks) > 1 and len(toks[1]) > 1:          # apellido escrito entero
            completos.add(toks[1])
    if len(completos) > 1:
        fallos.append('el grupo «%s» mezcla apellidos distintos %s -> %s'
                      % (k, sorted(completos), sorted(g['var'])))

check(not [f for f in fallos if 'mezcla apellidos' in f],
      'ningun grupo mezcla dos apellidos completos distintos')

con_prop = sum(1 for t in T if (t['propietario'] or '').strip())
check(sum(g['total'] for g in grupos.values()) == con_prop,
      'los grupos suman los %d tickets con propietario' % con_prop)
check(con_prop + sum(1 for t in T if not (t['propietario'] or '').strip()) == len(T),
      'con propietario + sin propietario = %d' % len(T))

# ══ PRIORIDAD ═══════════════════════════════════════════════════════
print()
print('=== PRIORIDAD ===')
CANON = {'urgent': 'Urgent', 'high': 'High', 'medium': 'Medium',
         'normal': 'Normal', 'low': 'Low'}
cp = Counter(CANON.get(clave(t['prioridad']), 'Sin prioridad') for t in T)
for k in ('Urgent', 'High', 'Medium', 'Normal', 'Low', 'Sin prioridad'):
    print('    %-14s %5d' % (k, cp.get(k, 0)))
check(sum(cp.values()) == len(T), 'las seis prioridades cierran el total')
# Un valor desconocido caeria en «Sin prioridad» junto a los vacios: se separan.
vacios = sum(1 for t in T if not clave(t['prioridad']))
desconocidos = cp.get('Sin prioridad', 0) - vacios
check(desconocidos == 0,
      'ningun valor de prioridad DESCONOCIDO se disfraza de «Sin prioridad» '
      '(vacios reales: %d)' % vacios)

# ══ CATEGORIA -> tipo ═══════════════════════════════════════════════
print()
print('=== CATEGORIA ===')
TIPOS = ['Asistencia', 'Administrativo', 'Activación', 'Falla', 'Capacitación']


def tipo_de(cat):
    k = clave(cat)
    for tp in TIPOS:
        if k.startswith(clave(tp)):
            return tp
    return 'Sin clasificar'


ct = Counter(tipo_de(t['categoria']) for t in T)
for k, n in ct.most_common():
    print('    %-16s %5d' % (k, n))
check(sum(ct.values()) == len(T), 'los tipos cierran el total')
# «Sin clasificar» solo debe contener los que de verdad no traen categoria.
sin_cat = sum(1 for t in T if clave(t['categoria']) in ('', 'sin categoria'))
check(ct.get('Sin clasificar', 0) == sin_cat,
      'en «Sin clasificar» solo caen los %d sin categoria, no valores nuevos' % sin_cat)

# ══ FALLAS ══════════════════════════════════════════════════════════
print()
print('=== FALLAS ===')
band = {t['ticket_id'] for t in T if t['es_falla'] == 'Si'}
cat = {t['ticket_id'] for t in T if tipo_de(t['categoria']) == 'Falla'}
print('    bandera %d | categoria %d | interseccion %d' % (len(band), len(cat), len(band & cat)))
check(band <= cat, 'la bandera sigue siendo subconjunto EXACTO de la categoria')
check(set(t['es_falla'] for t in T) <= {'Si', 'No'},
      'es_falla solo vale Si/No (valores: %s)' % sorted(set(t['es_falla'] for t in T)))

# ══ IDENTIDAD ═══════════════════════════════════════════════════════
print()
print('=== IDENTIDAD ===')
ids = [t['ticket_id'] for t in T]
check(len(set(ids)) == len(T), 'ticket_id unico en las %d filas' % len(T))
check(all(str(i).isdigit() for i in ids), 'todos los ticket_id son numericos')
dups = {v for v, n in Counter(t['num'] for t in T).items() if n > 1}
print('    folios `num` repartidos en varias filas: %d (esperado: no identifican)' % len(dups))

# ══ CIERRES DE PARTICION ════════════════════════════════════════════
print()
print('=== CIERRES ===')
OFFSET = timedelta(hours=6)


def mes_ap(t):
    a = t.get('apertura') or ''
    try:
        return (datetime.strptime(a[:19], '%Y-%m-%dT%H:%M:%S') - OFFSET).strftime('%Y-%m')
    except (ValueError, TypeError):
        return ''


ma = Counter(mes_ap(t) for t in T)
check(ma.get('', 0) == 0, 'todas las aperturas se convierten a hora de Mexico')
check(sum(ma.values()) == len(T), 'el eje de mes de apertura cierra')
porcid = Counter((t['cid'] or '').strip() for t in T)
check(sum(porcid.values()) == len(T), 'los CIDs cierran el universo')
orden = porcid.most_common()
top, resto = orden[:20], orden[20:]
check(sum(n for _, n in top) + sum(n for _, n in resto) == len(T),
      'top-20 + otros = %d (topQueCierra no lanzara)' % len(T))

# ══ INTERNOS ════════════════════════════════════════════════════════
print()
print('=== INTERNOS (CID 0 y 1) ===')
internos = sum(n for c, n in porcid.items() if c in ('0', '1'))
print('    %d tickets internos de %d (%.1f%%)' % (internos, len(T), 100.0 * internos / len(T)))
for c in ('0', '1'):
    nombres = Counter(t['empresa'] for t in T if (t['cid'] or '').strip() == c)
    print('    CID %-2s -> %s' % (c, dict(nombres.most_common(5))))

print()
print('=' * 62)
print('RESULTADO: %d comprobacion(es) fallida(s)' % len(fallos))
for f in fallos:
    print('  - %s' % f)
sys.exit(1 if fallos else 0)
