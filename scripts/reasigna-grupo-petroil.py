# -*- coding: utf-8 -*-
"""Grupo Petroil pasa a Dan, por instrucción de dirección.

   «Las cuentas Petroil - Torre de Control y Petroil - Corp de Estaciones,
   incluyendo Oceanica, son del mismo Grupo. Grupo Petroil debe atenderlas DAN»
   — dirección, 22 sep 2026.

   QUÉ MUEVE Y QUÉ NO
   ------------------
   Cambia `cuentas.asesor` de las tres cuentas del grupo. NO toca su estado, ni
   su facturación, ni las borra: solo cambian de asesor.

   Lo que NO puede cambiar, y hay que decirlo: las actividades SAC ya generadas
   llevan el asesor grabado en su propia fila. Reasignar la cuenta no las
   reasigna — se reportan al final para que alguien decida qué hacer con ellas.

   Y la facturación se mueve de cartera: lo que sale de una suma en la otra. El
   script lo imprime antes y después para que el cambio no aparezca como una
   caída inexplicable en el panel de asesores.

   USO
   ---
       python scripts/reasigna-grupo-petroil.py            # diagnostica
       python scripts/reasigna-grupo-petroil.py --aplicar
"""
import collections
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, 'scripts'))
from observaciones_kam import anteponer_entrada   # noqa: E402

APLICAR = '--aplicar' in sys.argv
FECHA = '2026-09-22'
DESTINO = 'Dan'
GRUPO = 'Grupo Petroil'

# Por CID, que es la llave fiable. Los nombres del grupo no comparten prefijo:
# «Oceánica» no empieza por «Petroil».
CIDS = {
    '146201': 'Petroil - Corp de Estaciones',
    '148385': 'Petroil - Prebiem Oceanica',
    '46962':  'Oceánica',
}

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


def carteras(cuentas):
    acc = collections.defaultdict(lambda: {'n': 0, 'f': 0.0})
    for c in cuentas:
        a = acc[str(c['asesor'])]
        a['n'] += 1
        a['f'] += float(c['facturacion'] or 0)
    return acc


cuentas = rest('cuentas?select=id,cid,consecutivo,empresa,asesor,estado,facturacion,'
               'grupo_empresarial,observaciones_kam&limit=500')
por_cid = dict((norm(c['cid']), c) for c in cuentas if norm(c['cid']))

print('=== LAS CUENTAS DEL GRUPO ===')
obj = []
for cid, nombre in CIDS.items():
    c = por_cid.get(cid)
    if not c:
        print('  CID %-8s %-34s *** NO EXISTE EN LA CARTERA ***' % (cid, nombre))
        continue
    print('  %-5s CID %-8s %-34s %-9s %-10s $%-11s grupo=%s'
          % (c['consecutivo'], cid, c['empresa'][:34], c['asesor'], c['estado'],
             '{:,.2f}'.format(float(c['facturacion'] or 0)), c.get('grupo_empresarial')))
    obj.append(c)

assert len(obj) == len(CIDS), 'faltan cuentas del grupo: se esperaban %d y hay %d' % (len(CIDS), len(obj))

mueven = [c for c in obj if c['asesor'] != DESTINO]
print('\n  ya son de %s: %d · cambian de asesor: %d' % (DESTINO, len(obj) - len(mueven), len(mueven)))
if not mueven:
    print('  nada que hacer.')
    raise SystemExit(0)

monto = sum(float(c['facturacion'] or 0) for c in mueven)
print('  facturación que se mueve: $%s' % '{:,.2f}'.format(monto))

print('\n=== CARTERAS ANTES ===')
antes = carteras(cuentas)
for a in sorted(antes):
    print('  %-9s %3d cuentas · $%s' % (a, antes[a]['n'], '{:,.2f}'.format(antes[a]['f'])))

print('\n=== ACTIVIDADES SAC DE ESAS CUENTAS ===')
ids = [c['id'] for c in mueven]
act = rest('actividades?cuenta_id=in.(%s)&select=id,empresa,tipo,estado,asesor,semana_inicio,'
           'completada&order=semana_inicio.desc' % ','.join(ids)) or []
vivas = [a for a in act if str(a.get('estado')) in ('pendiente', 'en_proceso', 'iniciada')]
print('  %d actividad(es) en total · %d sin cerrar' % (len(act), len(vivas)))
for a in vivas:
    print('     %-30s %-12s %-11s asesor %-9s %s'
          % (str(a['empresa'])[:30], a['tipo'], a['estado'], a['asesor'], a['semana_inicio']))
if not vivas:
    print('     ninguna pide trabajo ahora mismo')
print('  OJO: la actividad guarda su propio asesor. Reasignar la cuenta NO las mueve.')

if not APLICAR:
    print('\n  (diagnostico; no se escribio nada)')
    print('  Para aplicar:  python scripts/reasigna-grupo-petroil.py --aplicar')
    raise SystemExit(0)

print('\n=== APLICANDO ===')
for c in mueven:
    nota = ('[Reasignación %s] Pasa de %s a %s por instrucción de dirección: «Petroil - Torre de '
            'Control, Petroil - Corp de Estaciones y Oceánica son del mismo Grupo; Grupo Petroil '
            'debe atenderlas Dan». Solo cambia el asesor: el estado, la facturación y el histórico '
            'quedan intactos. Las actividades SAC ya creadas conservan el asesor con el que '
            'nacieron.' % (FECHA, c['asesor'], DESTINO))
    cuerpo = {
        'asesor': DESTINO,
        'observaciones_kam': anteponer_entrada(c.get('observaciones_kam'), nota, 'sistema', FECHA),
    }
    # Oceánica no tenía grupo capturado; dirección acaba de decir cuál es.
    if not (c.get('grupo_empresarial') or '').strip():
        cuerpo['grupo_empresarial'] = GRUPO
    r = rest('cuentas?id=eq.%s' % c['id'], 'PATCH', cuerpo)
    assert len(r) == 1, 'se actualizaron %d filas para %s' % (len(r), c['empresa'])
    print('  %-5s %-34s %s -> %s' % (c['consecutivo'], c['empresa'][:34], c['asesor'], DESTINO))

print('\n=== COMPROBANDO, releyendo de la base ===')
rel = rest('cuentas?cid=in.(%s)&select=consecutivo,cid,empresa,asesor,estado,facturacion,'
           'grupo_empresarial' % ','.join(CIDS.keys()))
for c in sorted(rel, key=lambda x: str(x['consecutivo'])):
    print('  %-5s %-34s %-9s %-10s $%-11s grupo=%s'
          % (c['consecutivo'], c['empresa'][:34], c['asesor'], c['estado'],
             '{:,.2f}'.format(float(c['facturacion'] or 0)), c.get('grupo_empresarial')))
mal = [c for c in rel if c['asesor'] != DESTINO]
assert not mal, '%d no quedaron con %s' % (len(mal), DESTINO)

despues_raw = rest('cuentas?select=id,asesor,facturacion&limit=500')
print('\n=== CARTERAS DESPUÉS ===')
desp = carteras(despues_raw)
for a in sorted(set(list(antes) + list(desp))):
    da, dd = antes.get(a, {'n': 0, 'f': 0}), desp.get(a, {'n': 0, 'f': 0})
    print('  %-9s %3d -> %3d cuentas · $%s -> $%s  (%+.2f)'
          % (a, da['n'], dd['n'], '{:,.2f}'.format(da['f']), '{:,.2f}'.format(dd['f']),
             dd['f'] - da['f']))
assert len(despues_raw) == len(cuentas), 'cambió el número de cuentas'
tot_a = sum(v['f'] for v in antes.values())
tot_d = sum(v['f'] for v in desp.values())
assert abs(tot_a - tot_d) < 0.01, 'la facturación total cambió: solo debía moverse de cartera'
print('\n  la facturación total NO cambió: solo se movió de cartera  OK')
