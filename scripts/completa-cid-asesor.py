# -*- coding: utf-8 -*-
"""Rellena CID y asesor en una lista de clientes, diciendo COMO cruzo cada uno.

   POR QUE EXISTE
   --------------
   Jose Manuel, 28 sep 2026: «a este Excel coloca el CID que corresponde a cada
   cuenta y el nombre de asesor que tiene asignado».

   El cruce es POR NOMBRE, que es justo donde se mezclan las cuentas. La regla
   del proyecto es explicita: el CID identifica al cliente, el nombre no —cruzar
   por nombre mezcla cuentas—. Asi que esto no entrega un CID a secas: entrega el
   CID Y como se llego a el, para que se pueda revisar lo dudoso y creerle a lo
   seguro.

   TRES FUENTES, EN ESTE ORDEN
   ---------------------------
     1. `cuentas` de Supabase — la cartera CS. Es la unica que tiene ASESOR.
     2. `data/cortes-facturacion.xlsx` — los nombres de facturacion, 2,682
        distintos. Tiene CID pero NO asesor: si una cuenta solo cruza aqui, es que
        factura y no esta en la cartera CS.
     3. Nada. Se deja vacio y se dice por que. NUNCA se inventa un CID.

   CADA FILA SALE CON UNA COLUMNA «COMO SE CRUZO» que vale mas que el CID:
     · «cartera · exacta»        — el nombre coincide entero. Fiable.
     · «cartera · parcial»       — uno contiene al otro. REVISAR.
     · «facturacion · exacta»    — hay CID, no hay asesor porque no esta en cartera.
     · «facturacion · parcial»   — hay CID candidato. REVISAR.
     · «sin cruce»               — no aparece en ninguna fuente. Vacio, no cero.

   Una coincidencia parcial que devuelve MAS DE UN CID no se resuelve sola: se
   listan los candidatos y se marca para revision. Elegir uno seria adivinar.

   USO
   ---
       python scripts/completa-cid-asesor.py <entrada.xlsx> [salida.xlsx]
"""
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request
from collections import Counter, defaultdict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = sys.argv[1] if len(sys.argv) > 1 else None
if not ENTRADA:
    sys.exit('uso: python scripts/completa-cid-asesor.py <entrada.xlsx> [salida.xlsx]')
SALIDA = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    r'D:\Archivos', os.path.splitext(os.path.basename(ENTRADA))[0] + ' - con CID y asesor.xlsx')


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or ''))
                if unicodedata.category(c) != 'Mn').lower()
    s = s.replace('&', ' y ')
    return re.sub(r'[^a-z0-9]', '', s)


# ── Fuente 1: la cartera CS (la unica con asesor) ────────────────────
E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY']}
CU = json.load(urllib.request.urlopen(urllib.request.Request(
    E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas'
    '?select=empresa,cid,asesor,consecutivo,estado&limit=2000', headers=H), timeout=60))

cartera = defaultdict(list)
for c in CU:
    cartera[norm(c['empresa'])].append(c)

# ── Fuente 2: los nombres de facturacion ─────────────────────────────
wb = openpyxl.load_workbook(os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx'),
                            data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]
idx = {c: i for i, c in enumerate(cab)}
factur = defaultdict(set)
nombre_real = {}
for r in it:
    def celda(k):
        i = idx.get(k)
        return r[i] if i is not None and i < len(r) else None
    cid = str(celda('CID') or '').strip()
    nom = celda('Nombre del Cliente')
    if cid and nom:
        n = norm(nom)
        factur[n].add(cid)
        nombre_real.setdefault(n, str(nom).strip())
wb.close()


def busca(nombre):
    """Devuelve (cid, asesor, consecutivo, estado, como, nota)."""
    n = norm(nombre)
    if not n:
        return '', '', '', '', 'sin nombre', ''

    # 1. Cartera, exacta
    if n in cartera:
        ms = cartera[n]
        if len(ms) == 1:
            c = ms[0]
            return (str(c.get('cid') or ''), c.get('asesor') or '', c.get('consecutivo') or '',
                    c.get('estado') or '', 'cartera · exacta', '')
        return ('', '', '', '', 'cartera · exacta',
                'REVISAR: %d cuentas con ese mismo nombre (%s)'
                % (len(ms), ', '.join(str(x.get('consecutivo')) for x in ms)))

    # 2. Cartera, parcial. Se exige longitud para que «kia» no case con todo.
    if len(n) >= 6:
        cand = [k for k in cartera if n in k or k in n]
        if len(cand) == 1 and len(cartera[cand[0]]) == 1:
            c = cartera[cand[0]][0]
            return (str(c.get('cid') or ''), c.get('asesor') or '', c.get('consecutivo') or '',
                    c.get('estado') or '', 'cartera · parcial',
                    'REVISAR: cruzó con «%s»' % c['empresa'])
        if len(cand) > 1:
            nombres = [cartera[k][0]['empresa'] for k in cand[:4]]
            return ('', '', '', '', 'cartera · parcial',
                    'REVISAR: %d candidatas (%s)' % (len(cand), ' · '.join(nombres)))

    # 3. Facturacion, exacta
    if n in factur:
        cids = sorted(factur[n])
        if len(cids) == 1:
            return (cids[0], '', '', '', 'facturación · exacta',
                    'Factura pero NO está en la cartera CS: sin asesor asignado.')
        return ('', '', '', '', 'facturación · exacta',
                'REVISAR: ese nombre factura con %d CIDs (%s)' % (len(cids), ', '.join(cids[:6])))

    # 4. Facturacion, parcial
    if len(n) >= 6:
        cand = [k for k in factur if n in k or k in n]
        cids = sorted({c for k in cand for c in factur[k]})
        if len(cids) == 1:
            return (cids[0], '', '', '', 'facturación · parcial',
                    'REVISAR: cruzó con «%s». No está en la cartera CS.' % nombre_real.get(cand[0], ''))
        if cids:
            return ('', '', '', '', 'facturación · parcial',
                    'REVISAR: %d CIDs candidatos (%s)' % (len(cids), ', '.join(cids[:6])))

    return ('', '', '', '', 'sin cruce',
            'No aparece ni en la cartera CS ni en los cortes de facturación.')


# ── Leer la entrada y componer la salida ─────────────────────────────
wb = openpyxl.load_workbook(ENTRADA, data_only=True)
ws = wb[wb.sheetnames[0]]
cab_in = [str(c.value).strip() if c.value is not None else '' for c in ws[1]]
col_cliente = 0
col_cid = cab_in.index('CID') if 'CID' in cab_in else None

out = openpyxl.Workbook()
o = out.active
o.title = 'Clientes'

ENC = list(cab_in)
if col_cid is None:
    ENC.append('CID')
    col_cid = len(ENC) - 1
ENC += ['Asesor', 'Consecutivo', 'Estado en cartera', 'Cómo se cruzó', 'Nota']
o.append(ENC)

azul = PatternFill('solid', fgColor='1B3FCC')
for c in o[1]:
    c.font = Font(name='Arial', bold=True, color='FFFFFF')
    c.fill = azul
    c.alignment = Alignment(vertical='center', wrap_text=True)

AMARILLO = PatternFill('solid', fgColor='FEF3C7')   # revisar
GRIS     = PatternFill('solid', fgColor='F1F5F9')   # sin cruce

resumen = Counter()
for fila in ws.iter_rows(min_row=2, values_only=True):
    if not fila or not fila[col_cliente]:
        continue
    vals = list(fila) + [''] * (len(cab_in) - len(fila))
    cid, asesor, cons, estado, como, nota = busca(vals[col_cliente])
    resumen[como] += 1
    if col_cid < len(vals):
        vals[col_cid] = cid
    else:
        vals.append(cid)
    o.append(list(vals) + [asesor, cons, estado, como, nota])
    r = o.max_row
    for c in o[r]:
        c.font = Font(name='Arial')
    if como == 'sin cruce':
        for c in o[r]:
            c.fill = GRIS
    elif nota.startswith('REVISAR') or 'NO está en la cartera' in nota:
        for c in o[r]:
            c.fill = AMARILLO

anchos = [38, 20, 12, 12, 13, 17, 20, 62]
for i, w in enumerate(anchos[:len(ENC)], start=1):
    o.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w
o.freeze_panes = 'A2'

# ── Hoja de procedencia: de donde sale cada cosa ─────────────────────
g = out.create_sheet('Cómo se hizo')
g.column_dimensions['A'].width = 34
g.column_dimensions['B'].width = 86
filas_doc = [
    ('Qué se llenó', 'El CID y el asesor de cada cliente de la lista.'),
    ('Fuente del asesor', 'Tabla `cuentas` de Supabase (la cartera CS). Es la ÚNICA fuente que '
                          'tiene asesor asignado.'),
    ('Fuente del CID', 'Primero `cuentas`; si no está ahí, los nombres de `Nombre del Cliente` de '
                       'data/cortes-facturacion.xlsx.'),
    ('El cruce es POR NOMBRE', 'Y el nombre NO identifica a un cliente: el CID sí. Por eso cada fila '
                               'dice cómo se cruzó, en vez de entregar un número a secas.'),
    ('Amarillo', 'Revisar antes de usar: cruce parcial, o factura sin estar en la cartera CS.'),
    ('Gris', 'Sin cruce en ninguna fuente. Se deja VACÍO — nunca un cero ni un CID inventado.'),
    ('Lo que NO se hizo', 'No se eligió entre varios candidatos cuando había más de uno: se listan '
                          'todos en la Nota. Elegir sería adivinar.'),
]
g.append(['Concepto', 'Qué significa'])
for c in g[1]:
    c.font = Font(name='Arial', bold=True, color='FFFFFF')
    c.fill = azul
for a, b in filas_doc:
    g.append([a, b])
    for c in g[g.max_row]:
        c.font = Font(name='Arial')
        c.alignment = Alignment(vertical='top', wrap_text=True)
g.append([])
g.append(['Resumen del cruce', ''])
g[g.max_row][0].font = Font(name='Arial', bold=True)
for k, v in resumen.most_common():
    g.append([k, '%d cliente(s)' % v])
    for c in g[g.max_row]:
        c.font = Font(name='Arial')

os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
out.save(SALIDA)

print('=== CRUCE DE %d CLIENTES ===' % sum(resumen.values()))
for k, v in resumen.most_common():
    print('  %-24s %3d' % (k, v))
print()
print('  guardado en: %s' % SALIDA)
