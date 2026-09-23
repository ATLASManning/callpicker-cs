# -*- coding: utf-8 -*-
"""Deja plasmado en F32 el mapa completo de Grupo Petroil.

   Dirección: «MG Mochis, MG Culiacán, MG Mazatlán son cuentas de Grupo Petroil,
   quizá por su facturación no estén en una cuenta independiente, pero puedes
   dejar este dato plasmado en la cuenta Grupo Petroil».

   Al ir a buscarlas salió algo más grande que el dato pedido: en el export
   completo de GRC hay **25 líneas «Petroil - …» que suman $80,049 de MRR**, y
   la cartera solo tiene TRES cuentas del grupo por $20,752. Es decir, el
   tablero ve una cuarta parte del grupo. Las tres que preguntaba dirección
   están ahí (MG Mazatlán, MG Mochis, Culiacán) junto con otras veinte.

   Se escribe en la bitácora de F32, que es la cuenta madre del grupo, porque
   `cuentas` no tiene dónde guardar un roster de líneas. El roster se genera
   leyendo el GRC, no a mano: así la próxima vez se regenera en vez de quedar
   viejo en silencio.

   USO
   ---
       python scripts/nota-roster-petroil.py            # diagnostica
       python scripts/nota-roster-petroil.py --aplicar
"""
import io
import json
import os
import re
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, 'scripts'))
from observaciones_kam import anteponer_entrada   # noqa: E402

APLICAR = '--aplicar' in sys.argv
FECHA = '2026-09-22'
CONSECUTIVO = 'F32'

_env = {}
for _ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    _ln = _ln.strip()
    if _ln and not _ln.startswith('#') and '=' in _ln:
        _k, _v = _ln.split('=', 1)
        _env[_k.strip()] = _v.strip().strip('"').strip("'")
URL = _env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
KEY = _env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer %s' % KEY,
     'Content-Type': 'application/json', 'Prefer': 'return=representation'}


def rest(ruta, metodo='GET', cuerpo=None):
    req = urllib.request.Request(
        URL + '/rest/v1/' + ruta,
        data=json.dumps(cuerpo).encode('utf-8') if cuerpo is not None else None,
        headers=H, method=metodo)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode('utf-8')
    return json.loads(t) if t.strip() else None


def norm(v):
    s = str(v if v is not None else '').strip()
    return s[:-2] if s.endswith('.0') else s


# ── El roster, leído del GRC ─────────────────────────────────────────────
G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
lineas = [f for f in G['filas'] if re.search(r'petroil', str(f.get('cliente') or ''), re.I)]
lineas.sort(key=lambda f: -float(f.get('mrrIni') or 0))
mrr_total = sum(float(f.get('mrrIni') or 0) for f in lineas)

cuentas = rest('cuentas?select=consecutivo,cid,empresa,asesor,estado,facturacion,'
               'grupo_empresarial,observaciones_kam&limit=500')
delgrupo = [c for c in cuentas
            if 'petroil' in str(c.get('grupo_empresarial') or '').lower()]
fact_cartera = sum(float(c['facturacion'] or 0) for c in delgrupo)

print('=== GRUPO PETROIL ===')
print('  líneas en GRC        : %d · MRR $%s' % (len(lineas), '{:,.2f}'.format(mrr_total)))
print('  cuentas en la cartera: %d · facturación $%s'
      % (len(delgrupo), '{:,.2f}'.format(fact_cartera)))
print('  el tablero ve el %.0f%% del grupo' % (100.0 * fact_cartera / mrr_total if mrr_total else 0))
print()
for c in delgrupo:
    print('  %-5s %-34s %-9s %-10s $%s'
          % (c['consecutivo'], c['empresa'][:34], c['asesor'], c['estado'],
             '{:,.2f}'.format(float(c['facturacion'] or 0))))

con_cuenta = [f for f in lineas if f.get('consecutivo')]
churn = [f for f in lineas if 'churn' in str(f.get('movimiento') or '').lower()]
desac = [f for f in lineas if 'desactivado' in str(f.get('movimiento') or '').lower()]
print('\n  de las %d líneas: %d tienen cuenta propia · %d con churn · %d desactivadas'
      % (len(lineas), len(con_cuenta), len(churn), len(desac)))

# ── La nota ──────────────────────────────────────────────────────────────
def fila(f):
    cons = f.get('consecutivo')
    marca = (' [%s]' % cons) if cons else ''
    mov = str(f.get('movimiento') or '')
    extra = ''
    if 'churn' in mov.lower():
        extra = ' — CHURN CONFIRMADO'
    elif 'desactivado' in mov.lower():
        extra = ' — desactivada'
    return '  · %-38s $%9s%s%s' % (str(f.get('cliente'))[:38],
                                   '{:,.0f}'.format(float(f.get('mrrIni') or 0)), marca, extra)


NOTA = (
    'MAPA COMPLETO DE GRUPO PETROIL (al %s).\n\n'
    'Dirección confirmó que MG Mochis, MG Culiacán y MG Mazatlán son del grupo aunque no tengan '
    'cuenta independiente —«quizá por su facturación»—. Al buscarlas salió el grupo entero: en '
    'el export de GRC hay **%d líneas «Petroil - …» que suman $%s de MRR**, y la cartera solo '
    'tiene **%d cuentas por $%s**. El tablero ve alrededor del %.0f%% del grupo; los otros tres '
    'cuartos facturan sin que nadie los vea desde aquí.\n\n'
    'LAS %d LÍNEAS, de mayor a menor MRR:\n%s\n\n'
    'LO QUE ESTO SIGNIFICA. Solo %d de las %d líneas tienen cuenta en la cartera (F32 y Z47). '
    'Las demás no aparecen en el módulo Cuentas, no reciben actividades SAC y no entran en '
    'ningún análisis — igual que le pasaba a CBS Compresores. No se dan de alta por iniciativa '
    'propia: facturar no es prueba de cartera gestionada, y darlas de alta es decisión de '
    'dirección.\n\n'
    'LO QUE YA SE PERDIÓ. Tres líneas están en Churn confirmado por $%s: %s. Otras dos figuran '
    'desactivadas (FODEN y GC Motors Los Mochis). Esa pérdida SÍ entra en la concentración de '
    'GRC AAA y desde el 22 sep se atribuye a Dan, vía la regla de grupo de '
    'lib/grc-asesor-alias.ts.\n\n'
    'OJO CON EL CORPORATIVO. Hay DOS líneas de corporativo y no son la misma: «Petroil - Corp '
    'de Estaciones» ($14,637, que es esta cuenta F32) y «Petroil - Corporativo» ($12,394, sin '
    'cuenta en la cartera). No confundirlas al conciliar.'
    % (FECHA, len(lineas), '{:,.2f}'.format(mrr_total), len(delgrupo),
       '{:,.2f}'.format(fact_cartera), 100.0 * fact_cartera / mrr_total if mrr_total else 0,
       len(lineas), '\n'.join(fila(f) for f in lineas), len(con_cuenta), len(lineas),
       '{:,.2f}'.format(sum(float(f.get('mrrIni') or 0) for f in churn)),
       ', '.join(str(f.get('cliente')) for f in churn))
)

print('\n=== NOTA (primeras líneas) ===')
for l in NOTA.split('\n')[:8]:
    print('  %s' % l[:106])
print('  … %d líneas en total, %d caracteres' % (len(NOTA.split('\n')), len(NOTA)))

if not APLICAR:
    print('\n  (diagnostico; no se escribio nada)')
    print('  Para aplicar:  python scripts/nota-roster-petroil.py --aplicar')
    raise SystemExit(0)

c = [x for x in cuentas if x['consecutivo'] == CONSECUTIVO][0]
fila_id = rest('cuentas?consecutivo=eq.%s&select=id' % CONSECUTIVO)[0]['id']
r = rest('cuentas?id=eq.%s' % fila_id, 'PATCH',
         {'observaciones_kam': anteponer_entrada(c.get('observaciones_kam'), NOTA, 'sistema', FECHA)})
assert len(r) == 1, 'se actualizaron %d filas' % len(r)

print('\n=== COMPROBANDO ===')
d = rest('cuentas?consecutivo=eq.%s&select=consecutivo,empresa,observaciones_kam' % CONSECUTIVO)[0]
t = str(d['observaciones_kam'])
for esperado in ('MG Mazatlán', 'MG Mochis', 'Petroil - Culiacán', 'MAPA COMPLETO',
                 'Petroil - Corporativo', 'CHURN CONFIRMADO'):
    print('  contiene «%-24s»: %s' % (esperado, 'sí' if esperado in t else 'NO — REVISAR'))
print('\n  Mapa del grupo asentado en %s.' % CONSECUTIVO)
