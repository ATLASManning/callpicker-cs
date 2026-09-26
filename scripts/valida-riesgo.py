# -*- coding: utf-8 -*-
"""Un puntaje de riesgo de churn, PROBADO contra el churn que ya ocurrio.

   POR QUE EXISTE
   --------------
   Jose Manuel, 25 sep 2026: «tu eres el inteligente con toda la data, debes
   preveer cuales cuentas estan con mayor riesgo».

   Tiene razon y mi enfoque anterior estaba mal: poner un umbral por senal
   —20% de consumo, tantos tickets, tantas fallas— es inventarse un corte
   arbitrario por cada cosa y pedirle a direccion que los apruebe. Lo correcto
   es UN puntaje que combine todo y rankee la cartera entera.

   PERO UN PUNTAJE QUE NO SE PRUEBA ES DECORACION.
   Cualquiera puede sumar penalizaciones y producir una lista que suene
   sensata. La pregunta que importa es otra: **con los datos de julio, ¿habria
   puesto a ALTERNET arriba antes de que pidiera la baja en septiembre?**

   Eso es lo que hace este script. Corta los datos a una fecha, calcula el
   puntaje como si fuera ese dia, y mide donde quedaron rankeadas las cuentas
   que DESPUES se dieron de baja de verdad. Si las cazaba, el puntaje sirve; si
   no, hay que rehacerlo antes de escribirlo en el tablero.

   LO QUE ESTA PRUEBA NO PUEDE HACER
   ---------------------------------
   La mesa de ayuda solo tiene cortes desde el 3 de septiembre, asi que los dias
   fuera de SLA NO entran en el retroceso a julio — no existian. El puntaje real
   si los usara, y seria MEJOR que lo que mide esta prueba, no peor. Se dice
   para no atribuirle al puntaje una precision que esta prueba no demuestra.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/valida-riesgo.py            # corta en julio
       python scripts/valida-riesgo.py 2026-06
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
CORTE = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else '2026-07'


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


RX_EXT = re.compile(r'(\d+)\s*(?:extensi[oó]n(?:es)?|ext\b)', re.I)
RX_EXT_ABR = re.compile(r'^(\d+)\s+\S.*\bIL\b', re.I)
RX_SIN_VOZ = re.compile(r'\bchat\b|\bagentes?\s+cp\b|sin\s+saldo|n[uú]meros?\s+virtuales?|whatsapp', re.I)


def base_min(plan, incl):
    n = str(plan or '')
    m = RX_EXT.search(n) or RX_EXT_ABR.search(n)
    ext = int(m.group(1)) if m else None
    if RX_SIN_VOZ.search(n) and not ext and incl < 3:
        return None
    if ext and ext > 0:
        return incl if (incl > 0 and incl / ext >= 50) else ext * 1500
    return incl if incl >= 3 else None


# ══ Datos ════════════════════════════════════════════════════════════
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


CU = sb('cuentas', 'select=id,consecutivo,empresa,cid,asesor,estado,health_score,facturacion,tiene_chat_activo,activo_desde')
SEG = sb('seguimientos', 'select=cuenta_id,fecha')
TK = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))

# cortes
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
    if not cid:
        continue
    cortes[cid].append({'mes': mes_de(f.get('Fecha de corte')),
                        'cons': num(f.get('Minutos Consumidos')),
                        'base': base_min(f.get('Nombre del Plan'), num(f.get('Minutos Incluidos')))})
wb.close()
for v in cortes.values():
    v.sort(key=lambda x: x['mes'])

# quien se dio de baja DESPUES del corte (la verdad contra la que se mide)
CHURN_POR_MES = defaultdict(set)
s = io.open(os.path.join(RAIZ, 'app', 'churn', 'aaa-grc-data.ts'), encoding='utf-8').read()
for bloque in re.finditer(r"mes:\s*'([^']+)'([\s\S]*?)(?=\n\s*\{\s*mes:|\Z)", s):
    mes = bloque.group(1)
    for m in re.finditer(r"cliente:\s*'([^']+)'[^}]*?movimiento:\s*'([^']*)'", bloque.group(2)):
        if 'Churn confirmado' in m.group(2):
            CHURN_POR_MES[mes.lower()].add(norm(m.group(1)))

MESES_ORD = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
             'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
n_corte = int(CORTE[5:7])
futuros = set()
for i, nm in enumerate(MESES_ORD, start=1):
    if i > n_corte:
        futuros |= CHURN_POR_MES.get(nm, set())
print('corte de datos: %s · cuentas con churn confirmado DESPUÉS: %d' % (CORTE, len(futuros)))

# ══ El puntaje ═══════════════════════════════════════════════════════
def puntaje(c, hasta):
    """Riesgo 0-100 con los datos disponibles HASTA `hasta` (AAAA-MM)."""
    pts, por = 0, []
    cid = str(c.get('cid') or '').strip()
    serie = [x for x in cortes.get(cid, []) if x['mes'] <= hasta]

    # 1. Caída de consumo: 3 cortes recientes contra 3 antiguos
    if len(serie) >= 6:
        a = sum(x['cons'] for x in serie[:3]) / 3
        b = sum(x['cons'] for x in serie[-3:]) / 3
        if a >= 100:
            d = 100 * (b - a) / a
            if d <= -40:
                pts += 25; por.append('consumo -%.0f%%' % -d)
            elif d <= -25:
                pts += 15; por.append('consumo -%.0f%%' % -d)

    # 2. Capacidad ociosa del último corte
    if serie:
        u = serie[-1]
        if u['base']:
            uso = 100 * u['cons'] / u['base']
            if uso < 1:
                pts += 20; por.append('consumo 0%')
            elif uso < 20:
                pts += 12; por.append('uso %.0f%%' % uso)
            elif uso < 40:
                pts += 6; por.append('uso %.0f%%' % uso)

    # 3. Desapareció del corte
    meses = sorted({x['mes'] for v in cortes.values() for x in v if x['mes'] <= hasta})
    if serie and meses and serie[-1]['mes'] < meses[-1]:
        pts += 22; por.append('fuera del corte')

    # 4. Tickets y fallas hasta la fecha
    tot = fal = 0
    for t in TK:
        if (t['cid'] or '').strip() != cid:
            continue
        ap = (t.get('apertura') or '')[:7]
        if not ap or ap > hasta:
            continue
        tot += 1
        if t['es_falla'] == 'Si':
            fal += 1
    if fal >= 8:
        pts += 18; por.append('%d fallas' % fal)
    elif fal >= 4:
        pts += 11; por.append('%d fallas' % fal)
    elif fal >= 2:
        pts += 5; por.append('%d fallas' % fal)
    if tot >= 40:
        pts += 10; por.append('%d tickets' % tot)
    elif tot >= 15:
        pts += 5; por.append('%d tickets' % tot)

    # 5. Silencio: sin seguimiento registrado en los últimos 60 días del corte
    ult = max((str(x.get('fecha') or '')[:10] for x in SEG
               if x.get('cuenta_id') == c['id'] and str(x.get('fecha') or '')[:7] <= hasta),
              default='')
    fin = hasta + '-28'
    if not ult:
        pts += 12; por.append('sin seguimiento')
    else:
        try:
            dias = (datetime.strptime(fin, '%Y-%m-%d') - datetime.strptime(ult, '%Y-%m-%d')).days
            if dias > 90:
                pts += 12; por.append('%d días sin contacto' % dias)
            elif dias > 45:
                pts += 6; por.append('%d días sin contacto' % dias)
        except ValueError:
            pass

    # 6. Health score
    hs = c.get('health_score')
    if isinstance(hs, (int, float)):
        if hs < 45:
            pts += 12; por.append('HS %d' % hs)
        elif hs < 60:
            pts += 6; por.append('HS %d' % hs)

    return min(100, pts), por


filas = []
for c in CU:
    p, por = puntaje(c, CORTE)
    filas.append((c, p, por, norm(c['empresa']) in futuros))
filas.sort(key=lambda x: -x[1])

# ══ ¿Sirve? ══════════════════════════════════════════════════════════
cayeron = [f for f in filas if f[3]]
print('cuentas de la cartera que cayeron después: %d' % len(cayeron))
if not cayeron:
    print('  sin casos que validar en este corte.')
    sys.exit(0)

n = len(filas)
print()
print('=== DÓNDE QUEDARON RANKEADAS LAS QUE SÍ CAYERON ===')
print('  %-5s %-30s %6s %8s  %s' % ('#', 'CUENTA', 'PUNTOS', 'PUESTO', 'POR QUÉ'))
posiciones = []
for i, (c, p, por, _) in enumerate(filas, start=1):
    if not _:
        continue
    posiciones.append(i)
    print('  %-5s %-30s %6d %5d/%d  %s'
          % (c.get('consecutivo') or '?', c['empresa'][:30], p, i, n, ', '.join(por[:4])))

posiciones.sort()
mediana = posiciones[len(posiciones) // 2]
print()
print('=== VEREDICTO ===')
for k in (10, 20, 30, 50):
    cazadas = sum(1 for x in posiciones if x <= k)
    print('  en el top %-3d entraron %d de %d (%.0f%%)  — el azar daría %.0f%%'
          % (k, cazadas, len(posiciones), 100.0 * cazadas / len(posiciones), 100.0 * k / n))
print('  puesto mediano de una cuenta que cayó: %d de %d' % (mediana, n))
azar = n / 2.0
print('  el azar la pondría en el %d. %s'
      % (int(azar),
         'El puntaje SÍ ordena.' if mediana < azar * 0.6 else
         '*** El puntaje NO separa mejor que el azar: hay que rehacerlo.'))
