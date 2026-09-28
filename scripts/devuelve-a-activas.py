# -*- coding: utf-8 -*-
"""Devuelve a Activas las cuentas que la conciliacion durmio sin churn confirmado.

   POR QUE EXISTE
   --------------
   Jose Manuel, 28 sep 2026, sobre ALTERNET: «¿por que esta cuenta esta en
   Dormidas si aun no esta en Churn confirmado? Es solo una solicitud que no se
   ha ejecutado. Solo deberas colocarla en Dormida cuando cumpla con el requisito
   de documentar las acciones que hizo el asesor, o cuando este dentro del
   reporte de Churn confirmado. Mientras tanto debe estar en Activas.»

   La conciliacion tenia un camino que reclasificaba sola cualquier señal
   ANTERIOR a un corte, «como limpieza de historico». La premisa —lo viejo ya
   esta resuelto— resulto falsa: ALTERNET paso a Dormida por un «Dormida en
   Zoho» de 2022-10 mientras facturaba $16,548 y tenia auditoria de junio 2026.

   A QUIENES TOCA, Y A QUIENES NO
   ------------------------------
   SOLO a las que cumplen las TRES: estan en `hibernacion`, su ficha tiene la
   nota de «limpieza de historico», y NO aparecen en el reporte de churn
   confirmado ni en los cancelados. Las que si estan en el reporte NO se tocan:
   esas si cumplen el requisito.

   A QUE ESTADO
   ------------
   `en_riesgo`, no `activo`. No hay registro de cual tenian antes —se busco en
   `actividades_audit` y ninguna lo tiene— asi que inventar `activo` seria
   afirmar que no pasa nada. Todas arrastran una señal de churn, por vieja o
   dudosa que sea: vivas pero señaladas es lo que son, y asi entran en la
   rotacion de seguimientos en vez de quedarse invisibles.

   La nota queda ANTEPUESTA en observaciones_kam, nunca sustituyendo: la
   bitacora del KAM es de otro.

   USO
   ---
       python scripts/devuelve-a-activas.py            # ensayo, no escribe
       python scripts/devuelve-a-activas.py --ejecutar
"""
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request
from datetime import datetime, timedelta, timezone

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EJECUTAR = '--ejecutar' in sys.argv
MEXICO = timezone(timedelta(hours=-6))
HOY = datetime.now(MEXICO).strftime('%Y-%m-%d')
DESTINO = 'en_riesgo'


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or ''))
                if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]', '', s)


E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY'],
     'Content-Type': 'application/json'}
B = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'


def sb(t, p):
    f, o = [], 0
    while True:
        d = json.load(urllib.request.urlopen(
            urllib.request.Request(B + t + '?' + p + '&offset=%d&limit=1000' % o, headers=H), timeout=90))
        f += d
        if len(d) < 1000:
            return f
        o += 1000


def patch(t, filtro, cuerpo):
    r = urllib.request.Request(B + t + '?' + filtro, method='PATCH',
                               data=json.dumps(cuerpo).encode('utf-8'),
                               headers=dict(H, Prefer='return=representation'))
    return json.load(urllib.request.urlopen(r, timeout=60))


# ── El reporte de churn, con la regla real (sin el mes vivo) ─────────
src = io.open(os.path.join(RAIZ, 'app', 'churn', 'aaa-grc-data.ts'), encoding='utf-8').read()
rep = io.open(os.path.join(RAIZ, 'app', 'churn', 'grc-reporte.ts'), encoding='utf-8').read()
m = re.search(r"GRC_MES_EN_CURSO\s*(?::[^=]*)?=\s*(?:'([^']*)'|null)", rep)
if not m:
    sys.exit('*** No se encontro GRC_MES_EN_CURSO')
MES_VIVO = (m.group(1) or '').lower()

CHURN = set()
for b in re.finditer(r"mes:\s*'([^']+)'([\s\S]*?)(?=\n\s*\{\s*mes:|\Z)", src):
    if MES_VIVO and b.group(1).lower() == MES_VIVO:
        continue
    for x in re.finditer(r"cliente:\s*'([^']+)'[^}]*?movimiento:\s*'([^']*)'", b.group(2)):
        if 'Churn confirmado' in x.group(2):
            CHURN.add(norm(x.group(1)))
CANCEL = {norm(x) for x in re.findall(
    r"cliente:\s*'([^']+)'",
    io.open(os.path.join(RAIZ, 'lib', 'churn-cancelados-data.ts'), encoding='utf-8').read())}

CU = sb('cuentas', 'select=id,consecutivo,empresa,asesor,estado,facturacion,observaciones_kam')

objetivo = []
for c in CU:
    if str(c.get('estado') or '') != 'hibernacion':
        continue
    obs = str(c.get('observaciones_kam') or '')
    if 'limpieza de hist' not in obs:
        continue            # no la durmio este camino: no se toca
    n = norm(c['empresa'])
    if n in CHURN or n in CANCEL:
        continue            # SI cumple el requisito: se queda dormida
    señal = re.search(r'(Dormida en Zoho|Churn[^,.]*|Cancelaci[oó]n[^,.]*) en (\d{4}-\d{2})', obs)
    objetivo.append((c, señal.group(2) if señal else '?'))

objetivo.sort(key=lambda t: -float(t[0].get('facturacion') or 0))

print('=== DEVOLVER A ACTIVAS (estado «%s») ===' % DESTINO)
print('    modo: %s' % ('EJECUTAR — escribe en Supabase' if EJECUTAR else 'ENSAYO — no escribe nada'))
print()
if not objetivo:
    print('  Ninguna cuenta cumple las tres condiciones. Nada que hacer.')
    sys.exit(0)

print('  %-5s %-32s %-9s %-11s %s' % ('#', 'EMPRESA', 'ASESOR', 'FACTURA', 'SEÑAL QUE LA DURMIÓ'))
total = 0
for c, f in objetivo:
    fac = float(c.get('facturacion') or 0)
    total += fac
    print('  %-5s %-32s %-9s $%-10s %s' % (c.get('consecutivo'), str(c['empresa'])[:32],
                                           str(c.get('asesor'))[:9], format(int(fac), ','), f))
print()
print('  %d cuentas · $%s de facturación que estaba dada por muerta'
      % (len(objetivo), format(int(total), ',')))
print()
print('  NO se tocan las que sí están en el reporte de churn: ésas cumplen el requisito.')
print()

if not EJECUTAR:
    print('  Ensayo. Para aplicarlo: python scripts/devuelve-a-activas.py --ejecutar')
    sys.exit(0)

NOTA = (
    '[Conciliación %s] Devuelta a Activas. Estaba en Dormida por una señal de «%s» '
    'que NO es Churn confirmado. Regla de dirección del 28 sep 2026: una cuenta solo '
    'pasa a Dormida cuando el asesor documenta las acciones o cuando aparece en el '
    'reporte de Churn confirmado; una solicitud de baja no ejecutada no basta. Se '
    'deja en «en riesgo» y no en «activo» porque la señal existe y no consta cuál '
    'era su estatus anterior.'
)

hechas = 0
for c, f in objetivo:
    obs = str(c.get('observaciones_kam') or '')
    nueva = (NOTA % (HOY, f)) + ('\n\n' + obs if obs.strip() else '')
    patch('cuentas', 'id=eq.' + c['id'], {'estado': DESTINO, 'observaciones_kam': nueva})
    hechas += 1
    print('  devuelta  %-5s %s' % (c.get('consecutivo'), c['empresa']))

print()
print('  %d devueltas a «%s». La nota quedó ANTEPUESTA, sin borrar la bitácora previa.' % (hechas, DESTINO))
