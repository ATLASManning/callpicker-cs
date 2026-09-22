# -*- coding: utf-8 -*-
"""Las cuentas que Callpicker reporta CANCELADAS no pueden seguir activas.

   Instruccion de direccion (22 sep 2026): «asegura que estas cuentas no se
   encuentren en estatus activo, deben estar en dormidas si existen en las
   cuentas de los asesores».

   COMO
   ----
   · Se cruza por CID. Es la llave fiable: los nombres de esta lista vienen con
     mojibake («Bliss cr√©dito libre») y con variantes que no coinciden con la
     razon social de la cartera.
   · Lo que ya esta en Dormida o cancelado NO se toca.
   · Lo que no existe en `cuentas` NO se da de alta: no toda cuenta facturada es
     cartera gestionada —hay 2,138 CIDs que facturan sin fila— y ademas estas
     son bajas.
   · La cuenta CONSERVA a su asesor. A una cuenta muerta se le marca, no se le
     quita de la cartera: es justo la que hay que recuperar.
   · Nada se borra. Una baja es pasar a Dormida.
   · Cada cambio deja entrada fechada en la bitacora del KAM.

   USO
   ---
       python scripts/concilia-cancelados-callpicker.py            # diagnostica
       python scripts/concilia-cancelados-callpicker.py --aplicar
"""
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
DESTINO = 'hibernacion'          # «Dormidas» en la interfaz
VIVAS = ('activo', 'en_riesgo')

# CID -> nombre tal como lo reporta Callpicker (solo para leerlo; no se cruza por el)
CANCELADAS = [
    ('126', 'GP - Cd Maderas Qro'), ('168', 'Grupo Garmo'), ('410', '99 minutos'),
    ('4718', 'Holton'), ('28065', 'JAD Suministros'),
    ('29132', 'Centro Mexicano de Psicologia Integrativa CEMEPI'),
    ('53964', 'Mas Suites'), ('125645', 'WOLFTOWERS'), ('127502', 'Koltin'),
    ('129593', 'INBROTEK SERVICIOS'), ('130058', 'GDA Polab'), ('135258', 'Coristylo'),
    ('148520', 'Corporativo Fenix'), ('155537', 'Torre 2 - Via Montejo'),
    ('157382', 'GDA - Centro Nacional de Genetica'), ('160374', 'ZD - Campus Residencias'),
    ('161499', 'INVEXIO'), ('161610', 'Bliss crédito libre'), ('163915', 'Global Digital'),
    ('163934', 'MB Signature Properties'), ('164443', 'Velfare'), ('165190', 'Capela'),
    ('173484', 'Finaura'), ('176345', 'Global Trust Solutions EZQ'),
    ('176685', 'Campus Residencias'), ('177360', 'Trustworthy Business Services'),
    ('178011', 'Sofia'), ('178020', 'Servidiesel'), ('180846', 'TURBODAYS'),
]

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


cuentas = rest('cuentas?select=id,cid,consecutivo,empresa,estado,asesor,facturacion,'
               'observaciones_kam&limit=500')
por_cid = dict((norm(c['cid']), c) for c in cuentas if norm(c['cid']))
print('cartera: %d cuentas' % len(cuentas))
print('lista de canceladas de Callpicker: %d CIDs' % len(CANCELADAS))
assert len(set(c for c, _ in CANCELADAS)) == len(CANCELADAS), 'hay CIDs repetidos en la lista'

mover, ya, fuera = [], [], []
for cid, nombre in CANCELADAS:
    c = por_cid.get(cid)
    if not c:
        fuera.append((cid, nombre))
    elif c['estado'] in VIVAS:
        mover.append((cid, nombre, c))
    else:
        ya.append((cid, nombre, c))

print('\n' + '=' * 78)
print('A · YA ESTABAN FUERA DE CARTERA VIVA — no se tocan (%d)' % len(ya))
print('=' * 78)
for cid, nombre, c in ya:
    print('  %-5s CID %-7s %-34s %s' % (c['consecutivo'], cid, c['empresa'][:34], c['estado']))

print('\n' + '=' * 78)
print('B · NO EXISTEN EN `cuentas` — no se dan de alta, son bajas (%d)' % len(fuera))
print('=' * 78)
for cid, nombre in fuera:
    print('  CID %-7s %s' % (cid, nombre))

print('\n' + '=' * 78)
print('C · ACTIVAS QUE DEBEN PASAR A DORMIDA (%d)' % len(mover))
print('=' * 78)
if mover:
    print('  %-5s %-7s %-34s %-11s %-9s %10s'
          % ('CONS', 'CID', 'EMPRESA', 'ESTADO HOY', 'ASESOR', 'FACT.'))
    for cid, nombre, c in mover:
        print('  %-5s %-7s %-34s %-11s %-9s %10s'
              % (c['consecutivo'], cid, c['empresa'][:34], c['estado'], c['asesor'],
                 c['facturacion']))
    print('\n  MRR que sale de la cartera viva: $%s'
          % '{:,.2f}'.format(sum(float(c['facturacion'] or 0) for _, _, c in mover)))
else:
    print('  ninguna — la cartera ya estaba conciliada con esta lista')

assert len(ya) + len(fuera) + len(mover) == len(CANCELADAS), 'la cuenta no cierra'
print('\n  cierre: %d ya + %d fuera + %d por mover = %d  OK'
      % (len(ya), len(fuera), len(mover), len(CANCELADAS)))

if not mover:
    raise SystemExit(0)

if not APLICAR:
    print('\n  (diagnostico; no se escribio nada)')
    print('  Para aplicar:  python scripts/concilia-cancelados-callpicker.py --aplicar')
    raise SystemExit(0)

print('\n=== APLICANDO ===')
for cid, nombre, c in mover:
    nota = ('[Conciliación %s] Callpicker la reporta como **Cancelado** en el corte de cuentas '
            'que compartió dirección, y aquí seguía como «%s». Pasa a Dormida. '
            'El asesor la conserva en cartera: a una cuenta muerta se le marca, no se le quita '
            '— es justo la que hay que recuperar. Facturación registrada al momento del cambio: '
            '$%s. No se dio de baja ningún dato.'
            % (FECHA, c['estado'], '{:,.2f}'.format(float(c['facturacion'] or 0))))
    r = rest('cuentas?id=eq.%s' % c['id'], 'PATCH', {
        'estado': DESTINO,
        'observaciones_kam': anteponer_entrada(c.get('observaciones_kam'), nota, 'sistema',
                                               FECHA),
    })
    assert len(r) == 1, 'se actualizaron %d filas para %s' % (len(r), c['empresa'])
    print('  %-5s %-34s %s -> %s' % (c['consecutivo'], c['empresa'][:34], c['estado'], DESTINO))

print('\n=== COMPROBANDO, releyendo de la base ===')
ids = [c['id'] for _, _, c in mover]
rel = rest('cuentas?id=in.(%s)&select=consecutivo,cid,empresa,estado,asesor' % ','.join(ids))
mal = [x for x in rel if x['estado'] != DESTINO]
for x in sorted(rel, key=lambda y: str(y['consecutivo'])):
    print('  %-5s %-34s %-12s asesor %s'
          % (x['consecutivo'], x['empresa'][:34], x['estado'], x['asesor']))
assert not mal, '%d no quedaron en %s' % (len(mal), DESTINO)
assert all(x['asesor'] for x in rel), 'alguna perdio a su asesor'

despues = rest('cuentas?select=id,estado&limit=500')
print('\n  cartera: %d cuentas (no cambia: nada se borro)' % len(despues))
assert len(despues) == len(cuentas), 'el total de cuentas cambio'
import collections
print('  por estado: %s' % dict(collections.Counter(x['estado'] for x in despues)))
print('\n  Conciliacion aplicada. Ahora correr:')
print('    python scripts/bloquea-actividades-dormidas.py --aplicar')
