# -*- coding: utf-8 -*-
u"""La señal de FACTURACION que el motor de alertas no usa: el GRC ya tiene
   medido, mes a mes y cuenta por cuenta, quien hizo DOWNGRADE y quien entro en
   churn. Nada de eso llega hoy a una alerta.

   POR QUE IMPORTA
   ---------------
   Direccion pidio alertas sobre «indicios que puedan favorecer una solicitud de
   baja o downgrade». Un downgrade YA FACTURADO no es un indicio de downgrade:
   es la prueba. Y lo que de verdad interesa no es el que ya paso una vez, sino
   el que REPITE —una cuenta que baja su MRR dos y tres meses seguidos esta
   negociandose a la baja sola— y el que ocurre sin que el asesor lo registrara.

   `NOMBRES_CHURN_GRC` existe en lib/elegibilidad.ts y se usa para BLOQUEAR
   actividades, no para avisar. De `Downgrade` no hay derivacion ninguna.

   EL CRUCE ES POR NOMBRE y eso no es gratis: el GRC no trae CID. Se mide
   cuantas cuentas de la cartera casan y cuantas filas del GRC se quedan sin
   casar, porque un cruce que no se mide inventa cobertura. [[dids-fuente]]

   USO
   ---
       python scripts/mide-senal-facturacion.py
       python scripts/mide-senal-facturacion.py --autoprueba
"""
import argparse
import base64
import collections
import gzip
import hashlib
import hmac
import io
import json
import os
import re
import sys
import time
import unicodedata
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def normaliza(s):
    u"""La MISMA normalizacion que `normalizarNombre` en lib/elegibilidad.ts.

       Si aqui se normalizara distinto, este guion mediria una cobertura que el
       codigo no va a reproducir — y eso es peor que no medirla.
    """
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s.lower())


def lee_grc(ruta):
    u"""{mes: [(cliente, movimiento, perdido)]} del .ts generado."""
    txt = io.open(ruta, encoding='utf-8').read()
    fila = re.compile(r"\{ cliente: '((?:[^'\\]|\\.)*)', clas: '([^']*)',.*?"
                      r"movimiento: '([^']*)', perdido: ([-\d.]+), perdido2: ([-\d.]+)")
    out = []
    for b in re.split(r"\n  \{\n    mes: '", txt)[1:]:
        mes = b.split("'")[0]
        for cli, clas, mov, per, per2 in fila.findall(b):
            out.append({'mes': mes, 'cli': cli.replace("\\'", "'"), 'clas': clas,
                        'mov': mov, 'per': float(per) + float(per2)})
    return out


def juzga_repeticion(meses_con_downgrade, orden):
    u"""(veces, consecutivos) — cuantos meses bajo y cuantos SEGUIDOS.

       Dos downgrades sueltos en once meses son ruido; dos seguidos son una
       cuenta que se esta reduciendo. La regla vive aqui y la prueba la
       autoprueba, al derecho y al reves.
    """
    idx = sorted(orden.index(m) for m in meses_con_downgrade if m in orden)
    if not idx:
        return 0, 0
    mejor = run = 1
    for i in range(1, len(idx)):
        run = run + 1 if idx[i] == idx[i - 1] + 1 else 1
        mejor = max(mejor, run)
    return len(idx), mejor


ap = argparse.ArgumentParser()
ap.add_argument('--base', default='https://callpicker-cs.vercel.app')
ap.add_argument('--autoprueba', action='store_true')
args = ap.parse_args()

ORDEN = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
         'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

if args.autoprueba:
    assert normaliza('Grupo System, S.A. de C.V.') == normaliza('grupo system sa de cv')
    assert normaliza('') == ''
    assert juzga_repeticion([], ORDEN) == (0, 0)
    assert juzga_repeticion(['Marzo'], ORDEN) == (1, 1)
    assert juzga_repeticion(['Marzo', 'Abril'], ORDEN) == (2, 2)
    assert juzga_repeticion(['Marzo', 'Mayo'], ORDEN) == (2, 1), 'sueltos no son seguidos'
    assert juzga_repeticion(['Abril', 'Marzo'], ORDEN) == (2, 2), 'el orden no debe importar'
    assert juzga_repeticion(['Enero', 'Febrero', 'Marzo', 'Mayo'], ORDEN) == (4, 3)
    assert juzga_repeticion(['Mes Inventado'], ORDEN) == (0, 0), 'un mes que no existe no cuenta'
    print(u'  autoprueba: 7/7 — normalizacion y racha, con sueltos y desordenados.')
    sys.exit(0)

E = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        E[k.strip()] = v.strip().strip('"')


def token():
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    now = int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                          'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(E['JWT_SECRET'].encode(), (cab + '.' + cue).encode(), hashlib.sha256).digest())


def api(ruta):
    r = urllib.request.Request(args.base + ruta)
    r.add_header('Cookie', 'cp_session=' + token())
    r.add_header('Accept-Encoding', 'gzip')
    with urllib.request.urlopen(r, timeout=600) as x:
        b = x.read()
        if (x.headers.get('Content-Encoding') or '').lower() == 'gzip':
            b = gzip.decompress(b)
    return json.loads(b.decode('utf-8', 'replace'))


# La cartera asignada sale de las alertas, que ya traen asesor, empresa y MRR.
d = api('/api/alertas?limite=5000')
rows = d.get('rows') or []
cartera = {}
for a in rows:
    n = normaliza(a.get('empresa'))
    if not n:
        continue
    cartera.setdefault(n, {'empresa': a.get('empresa'), 'asesor': a.get('asesor'),
                           'cons': a.get('consecutivo'), 'mrr': a.get('mrr') or 0,
                           'top': a.get('esTop')})

grc = lee_grc(os.path.join(RAIZ, 'app', 'churn', 'aaa-grc-data.ts'))
meses = [m for m in ORDEN if any(f['mes'] == m for f in grc)]
vivo = meses[-1] if meses else None

print(u'')
print(u'  %d filas del GRC · %d meses (%s) · mes vivo «%s», que NO cuenta'
      % (len(grc), len(meses), u'-'.join([meses[0], meses[-1]]) if meses else u'—', vivo))
print(u'  %d cuentas en la cartera asignada' % len(cartera))

# ── DOWNGRADE ───────────────────────────────────────────────────────────────
# El mes vivo se excluye por la misma razon que en NOMBRES_CHURN_GRC: lo del
# mes en curso todavia no esta maduro. [[regla-churn-mes-vencido]]
down = collections.defaultdict(list)
for f in grc:
    if f['mes'] == vivo or not f['mov'].startswith('Downgrade'):
        continue
    down[normaliza(f['cli'])].append(f)

casan = {n: v for n, v in down.items() if n in cartera}
nocasan = {n: v for n, v in down.items() if n not in cartera}
print(u'')
print(u'  DOWNGRADE en meses CERRADOS')
print(u'     %d nombres distintos · %d casan con la cartera · %d no casan'
      % (len(down), len(casan), len(nocasan)))
print(u'     (los que no casan son cuentas fuera de la cartera CS, no un fallo')
print(u'      del cruce — pero se cuentan para no inventar cobertura)')

filas = []
for n, fs in casan.items():
    veces, seguidos = juzga_repeticion([f['mes'] for f in fs], ORDEN)
    filas.append((cartera[n], veces, seguidos, sum(f['per'] for f in fs),
                  sorted({f['mes'] for f in fs}, key=ORDEN.index)))

for corte, etq in ((2, u'DOS O MAS meses con downgrade'),
                   (3, u'TRES O MAS')):
    sel = [x for x in filas if x[1] >= corte]
    print(u'     >= %d veces: %3d cuentas · $%s de MRR'
          % (corte, len(sel), format(sum(x[0]['mrr'] for x in sel), ',.0f')))
seg = [x for x in filas if x[2] >= 2]
print(u'     con RACHA de 2+ meses seguidos: %d cuentas · $%s'
      % (len(seg), format(sum(x[0]['mrr'] for x in seg), ',.0f')))

print(u'')
print(u'  LAS QUE MAS SE REDUCEN (racha >= 2, por MRR):')
for c, veces, seguidos, perd, ms in sorted(seg, key=lambda x: -x[0]['mrr'])[:20]:
    print(u'     %-34s %-5s %-8s $%9s  %d veces, racha %d   %s'
          % (c['empresa'][:34], c['cons'] or u'—', (c['asesor'] or u'—')[:8],
             format(c['mrr'], ',.0f'), veces, seguidos, u', '.join(ms)))

# ── CHURN CONFIRMADO ────────────────────────────────────────────────────────
ch = collections.defaultdict(list)
for f in grc:
    if f['mes'] == vivo or not f['mov'].startswith('Churn confirmado'):
        continue
    ch[normaliza(f['cli'])].append(f)
chc = {n: v for n, v in ch.items() if n in cartera}
print(u'')
print(u'  CHURN CONFIRMADO en meses cerrados: %d nombres · %d casan con la cartera'
      % (len(ch), len(chc)))
print(u'  (esto ya existe como `NOMBRES_CHURN_GRC` y BLOQUEA actividades, pero')
print(u'   no emite ninguna alerta: la cuenta no avisa, solo deja de poder trabajarse)')
for n in sorted(chc, key=lambda x: -cartera[x]['mrr'])[:12]:
    c = cartera[n]
    ms = sorted({f['mes'] for f in chc[n]}, key=ORDEN.index)
    print(u'     %-34s %-5s %-8s $%9s   %s'
          % (c['empresa'][:34], c['cons'] or u'—', (c['asesor'] or u'—')[:8],
             format(c['mrr'], ',.0f'), u', '.join(ms)))
