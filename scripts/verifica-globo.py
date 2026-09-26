# -*- coding: utf-8 -*-
"""Que dice el globo de cada cuenta, replicando lib/estado-cuenta.ts.

   POR QUE EXISTE
   --------------
   El globo se muestra al abrir CADA cuenta, asi que una frase mal compuesta no
   se ve en una pantalla: se ve en las 179. Y sin Node no hay forma de ejecutar
   el TypeScript, asi que esto replica la composicion sobre los datos reales y
   permite leer lo que van a leer los asesores ANTES de publicarlo.

   Comprueba ademas las dos reglas que sostienen el modulo:
     · que ningun hueco se pinte como un cero — «sin lectura de llamadas» no es
       «atiende bien», y «nunca ha tenido actividad SAC» no es «sin pendientes»;
     · que las fechas de ticket se lean en dia de MEXICO y no en UTC, que corre
       un dia las aperturas nocturnas.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/verifica-globo.py                 # resumen de la cartera
       python scripts/verifica-globo.py Clikauto        # el globo de una cuenta
"""
import glob
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
BUSCA = sys.argv[1] if len(sys.argv) > 1 else None
HOY = '2026-09-26'
DIAS_LIMITE = 60
MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

RELLENO = {'na', 'n/a', 'noaplica', 'pendiente', 'sininformacion', 'sininfo', 'sindato',
           'sindatos', 'tbd', 'porconfirmar', 'pordefinir', 'desconocido', 'ninguno',
           'nodisponible', 'nd', 'xx', 'xxx', '-', '--', '0', 'null', 'undefined'}


def real(v):
    if v is None:
        return False
    raw = str(v).strip()
    if raw == '':
        return False
    k = re.sub(r'\s+', '', ''.join(c for c in unicodedata.normalize('NFD', raw)
                                   if unicodedata.category(c) != 'Mn').lower())
    return not (k in RELLENO or re.fullmatch(r'[-–—._]+', k))


def tel_real(v):
    if not real(v):
        return False
    d = re.sub(r'\D', '', str(v))
    return len(d) >= 7 and len(set(d)) > 1


def dia_mexico(v):
    """Mismo criterio que `diaMexico` del TS: UTC menos seis horas."""
    s = str(v or '')
    if 'T' not in s:
        return s[:10]
    try:
        t = datetime.strptime(s[:19], '%Y-%m-%dT%H:%M:%S')
    except ValueError:
        return s[:10]
    return (t - timedelta(hours=6)).strftime('%Y-%m-%d')


def fmt(v):
    d = dia_mexico(v)
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})', d)
    if not m:
        return str(v or '')
    return '%d %s %s' % (int(m.group(3)), MESES[int(m.group(2)) - 1], m.group(1))


def dias(desde, hasta):
    a = re.match(r'^(\d{4})-(\d{2})-(\d{2})', dia_mexico(desde))
    b = re.match(r'^(\d{4})-(\d{2})-(\d{2})', hasta)
    if not a or not b:
        return None
    return (datetime(int(b.group(1)), int(b.group(2)), int(b.group(3)))
            - datetime(int(a.group(1)), int(a.group(2)), int(a.group(3)))).days


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s or '')
                if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]', '', s)


# ── datos ────────────────────────────────────────────────────────────
E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY']}
B = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'


def sb(t, p):
    f, o = [], 0
    while True:
        d = json.load(urllib.request.urlopen(
            urllib.request.Request(B + t + '?' + p + '&offset=%d&limit=1000' % o, headers=H), timeout=60))
        f += d
        if len(d) < 1000:
            return f
        o += 1000


CU = sb('cuentas', 'select=id,consecutivo,empresa,cid,asesor,estado,ultimo_contacto,'
                   'contacto_nombre,contacto_cargo,contacto_email,contacto_tel,contactos_json')
SEG = sb('seguimientos', 'select=cuenta_id,fecha')
ACT = sb('actividades', 'select=cuenta_id,tipo,completada')

seg_por = defaultdict(list)
for s in SEG:
    f = str(s.get('fecha') or '')[:10]
    if s.get('cuenta_id') and f:
        seg_por[s['cuenta_id']].append(f)
act_por = defaultdict(list)
for a in ACT:
    if a.get('cuenta_id'):
        act_por[a['cuenta_id']].append(a)

TK = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))
tk_por = defaultdict(list)
for t in TK:
    c = str(t.get('cid') or '').strip()
    if c:
        tk_por[c].append(t)
for v in tk_por.values():
    v.sort(key=lambda t: str(t.get('apertura') or ''), reverse=True)

LL = io.open(os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts'), encoding='utf-8').read()
CIDS_LL = set(re.findall(r'\n\s*"(\d{2,8})":', LL))

AUD = {}
for f in glob.glob(os.path.join(RAIZ, 'app', 'auditoria', '*-data.ts')):
    s = io.open(f, encoding='utf-8').read()
    n = re.search(r"^  nombre:\s+'([^']+)'", s, re.M)
    e = re.search(r"^  estado:\s+'([^']+)'", s, re.M)
    if n:
        AUD[norm(n.group(1))] = e.group(1) if e else ''

wb = openpyxl.load_workbook(os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx'),
                            data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]
idx = {c: i for i, c in enumerate(cab)}
cortes = defaultdict(list)
for r in it:
    f = {c: (r[i] if i < len(r) else None) for c, i in idx.items()}
    cid = str(f.get('CID') or '').strip()
    if cid:
        cortes[cid].append(f.get('Fecha de corte'))
wb.close()


def personas(c):
    out, vis = [], set()

    def add(n, ca, e, t):
        n = str(n).strip() if real(n) else ''
        e = str(e).strip() if real(e) else ''
        k = (n or e).lower()
        if not k or k in vis:
            return
        vis.add(k)
        out.append({'nombre': n, 'cargo': str(ca).strip() if real(ca) else '', 'tel': tel_real(t)})
    add(c.get('contacto_nombre'), c.get('contacto_cargo'), c.get('contacto_email'), c.get('contacto_tel'))
    j = c.get('contactos_json')
    if isinstance(j, str):
        try:
            j = json.loads(j)
        except ValueError:
            j = None
    for x in (j or []):
        if isinstance(x, dict):
            add(x.get('nombre'), x.get('cargo'), x.get('email'), x.get('tel'))
    return [p for p in out if p['nombre']]


def globo(c):
    L = []
    cid = str(c.get('cid') or '').strip()

    fechas = sorted(seg_por.get(c['id'], []))
    ref = fechas[-1] if fechas else (str(c.get('ultimo_contacto') or '')[:10] or None)
    d = dias(ref, HOY)
    if not ref:
        L.append(('hueco', 'Último contacto', 'NUNCA se le ha registrado un contacto.'))
    elif d is not None and d > DIAS_LIMITE:
        L.append(('grave', 'Último contacto', '%s — hace %d días. Pasa del límite de %d.' % (fmt(ref), d, DIAS_LIMITE)))
    else:
        L.append(('bien' if (d or 0) <= 30 else 'aviso', 'Último contacto',
                  '%s — hace %s días. %d seguimientos en total.' % (fmt(ref), d, len(fechas))))

    acts = act_por.get(c['id'], [])
    if not acts:
        L.append(('hueco', 'Actividades SAC', 'NUNCA ha tenido una actividad SAC asignada.'))
    else:
        ab = sum(1 for a in acts if not a.get('completada'))
        L.append(('aviso' if ab else 'neutro', 'Actividades SAC',
                  '%d en total: %d cerradas y %d abiertas.' % (len(acts), len(acts) - ab, ab)))

    tks = tk_por.get(cid, [])
    if tks:
        u = tks[0]
        dt = dias(u.get('apertura'), HOY)
        L.append(('neutro', 'Último ticket', '%s — hace %s días, «%s». %d en su historia.'
                  % (fmt(u.get('apertura')), dt, u.get('categoria'), len(tks))))
    else:
        L.append(('hueco', 'Tickets', 'Sin tickets cruzados en el export de Zoho.'))

    if cid in CIDS_LL:
        L.append(('neutro', 'Análisis de llamadas', 'Tiene lectura en la ficha.'))
    else:
        L.append(('hueco', 'Análisis de llamadas', 'NO tiene lectura. Hay que sacarlas de Callpicker.'))

    est = AUD.get(norm(c['empresa']))
    if est is not None:
        riesgo = est in ('en_riesgo', 'rescatable', 'en_recuperacion')
        L.append(('grave' if riesgo else 'aviso', 'Auditoría',
                  'Tiene auditoría entregada, estado «%s».' % est.replace('_', ' ')))
    else:
        L.append(('neutro', 'Auditoría', 'No tiene auditoría entregada.'))

    p = personas(c)
    if not p:
        L.append(('hueco', 'Con quién hablar', 'Sin una sola persona con nombre registrada.'))
    elif len(p) == 1:
        L.append(('grave', 'Con quién hablar', 'Cuelga de UNA sola persona: %s%s%s'
                  % (p[0]['nombre'],
                     ' (%s)' % p[0]['cargo'] if p[0]['cargo'] else ' — sin cargo registrado',
                     '.' if p[0]['tel'] else ', y sin teléfono marcable.')))
    else:
        con_tel = sum(1 for x in p if x['tel'])
        con_cargo = sum(1 for x in p if x['cargo'])
        if con_tel == 0:
            L.append(('grave', 'Con quién hablar',
                      '%d personas registradas y NINGUNA con telefono marcable. El correo es el unico canal.' % len(p)))
        elif con_cargo == 0:
            L.append(('aviso', 'Con quién hablar',
                      '%d personas registradas, ninguna con cargo. Sin cargo no se sabe quien decide.' % len(p)))
        else:
            L.append(('neutro', 'Con quién hablar', '%d personas registradas, %d con telefono marcable.' % (len(p), con_tel)))

    if cortes.get(cid):
        L.append(('neutro', 'Consumo', 'Con cortes de facturación cruzados.'))
    else:
        L.append(('hueco', 'Consumo', 'Sin cortes de facturación cruzados por su CID.'))
    return L


vivas = [c for c in CU if str(c.get('estado') or '').strip() in ('activo', 'en_riesgo')]

if BUSCA:
    got = [c for c in vivas if BUSCA.lower() in c['empresa'].lower()]
    if not got:
        sys.exit('No encontre ninguna cuenta viva que coincida con %r' % BUSCA)
    for c in got[:3]:
        L = globo(c)
        grave = next((x for x in L if x[0] == 'grave'), None) or next((x for x in L if x[0] == 'hueco'), None)
        print('=' * 72)
        print('%s · %s · %s' % (c['empresa'], c.get('consecutivo'), c.get('asesor')))
        print('=' * 72)
        print('ANTES DE LLAMAR:')
        print('  %s' % ('%s: %s' % (grave[1], grave[2]) if grave
                        else 'No tiene señales encendidas hoy.'))
        print()
        for tono, tit, txt in L:
            marca = {'grave': 'ATENDER  ', 'aviso': 'REVISAR  ', 'hueco': 'NO MEDIDO',
                     'bien': 'EN ORDEN ', 'neutro': '         '}[tono]
            print('  [%s] %-22s %s' % (marca, tit, txt))
        print()
        print('  piden accion: %d' % sum(1 for x in L if x[0] in ('grave', 'hueco')))
        print()
    sys.exit(0)

print('=== QUE DICE EL GLOBO EN LAS %d CUENTAS VIVAS ===' % len(vivas))
print()
tonos = Counter()
pend = Counter()
for c in vivas:
    L = globo(c)
    for t, _, _ in L:
        tonos[t] += 1
    pend[sum(1 for x in L if x[0] in ('grave', 'hueco'))] += 1
tot = sum(tonos.values())
print('  %d lineas en total, %.1f por cuenta:' % (tot, tot / len(vivas)))
for k in ('grave', 'hueco', 'aviso', 'neutro', 'bien'):
    print('    %-8s %4d  (%.0f%%)' % (k, tonos[k], 100.0 * tonos[k] / tot))
print()
print('  Cuantas cosas piden accion por cuenta:')
for k in sorted(pend):
    print('    %d → %3d cuentas' % (k, pend[k]))
print()
print('  Un globo con CERO señales significa que las siete lineas salieron')
print('  neutras o en orden. Si eso pasara en la mayoria, el globo no estaria')
print('  midiendo nada y habria que revisarlo.')
