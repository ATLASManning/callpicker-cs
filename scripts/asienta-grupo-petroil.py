# -*- coding: utf-8 -*-
"""Asienta TODO Grupo Petroil en una sola cuenta, con los importes por nombre y CID.

   Dirección (23 sep 2026) compartió los 7 CID del grupo: «para que todo lo
   asientes en una misma cuenta, separando los importes por nombre y CID».

   QUÉ CUENTA SE USA Y POR QUÉ NO SE CREA OTRA
   -------------------------------------------
   Se usa F32, que ya es la cuenta madre: tiene la ficha, el contacto del Ing.
   Javier, el roster del grupo y ya está con Dan. Pasa a llamarse «Grupo Petroil
   y Cías».

   Crear una cuenta NUEVA con el total habría duplicado la facturación: F32
   ($14,197), Z47 y C54 seguirían existiendo con su importe, y el grupo entero
   aparecería dos veces en la cartera de Dan. Y absorberlas exigiría darlas de
   baja, que no se hace sin autorización expresa.

   DÓNDE VA CADA COSA
   ------------------
   · `servicios_json` → una entrada POR LÍNEA, con su CID y su importe. Es el
     campo que la ficha pinta como lista en INFORMACIÓN, así que ahí se ve el
     desglose «por nombre y CID» sin abrir nada.
   · `observaciones_kam` → la conciliación completa y lo que no cuadra.
   · `notas` → los huecos que siguen abiertos.

   LO QUE NO SE TOCA
   -----------------
   `facturacion` se queda en $14,197. Subirla al total del grupo ($80,049)
   duplicaría lo de Z47 y C54 y movería la cartera de Dan sin que nadie lo haya
   decidido. Esa es una decisión de dirección y se deja planteada, no tomada.

   USO
   ---
       python scripts/asienta-grupo-petroil.py            # diagnostica
       python scripts/asienta-grupo-petroil.py --aplicar
"""
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, 'scripts'))
from observaciones_kam import anteponer_entrada   # noqa: E402

APLICAR = '--aplicar' in sys.argv
FECHA = '2026-09-23'
CONSECUTIVO = 'F32'
NOMBRE_NUEVO = 'Grupo Petroil y Cías'

# Los 7 CID tal como los entregó dirección el 23 sep 2026.
CIDS_DIRECCION = [
    ('Petroil - Geogas',             '160933'),
    ('Petroil - Manzanillo',         '160484'),
    ('Petroil - Prebiem Oceanica',   '148385'),
    ('Petroil - Corp de Estaciones', '146201'),
    ('PETROIL Observatorio',         '134502'),
    ('Petroil - Torre de Control',   '119552'),
    ('Petroil',                      '95890'),
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


def k(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]', '', s)


def norm(v):
    s = str(v if v is not None else '').strip()
    return s[:-2] if s.endswith('.0') else s


def mx(n):
    return '${:,.2f}'.format(float(n or 0))


# ── Fuentes ──────────────────────────────────────────────────────────────
G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
LINEAS = [f for f in G['filas'] if re.search(r'petroil', str(f.get('cliente') or ''), re.I)]
LINEAS.sort(key=lambda f: -float(f.get('mrrIni') or 0))
por_k = {}
for f in LINEAS:
    por_k.setdefault(k(f['cliente']), []).append(f)

TK = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))
TK = TK if isinstance(TK, list) else (TK.get('rows') or TK.get('tickets') or [])
import collections
tickets = collections.Counter(norm(x.get('cid')) for x in TK)
DIDS = json.load(io.open(os.path.join(RAIZ, 'data', 'dids.json'), encoding='utf-8'))['porCid']

cuentas = rest('cuentas?select=id,cid,consecutivo,empresa,asesor,estado,facturacion,'
               'grupo_empresarial,servicios_json,observaciones_kam,notas&limit=500')
por_cid = dict((norm(c['cid']), c) for c in cuentas if norm(c['cid']))
F32 = [c for c in cuentas if c['consecutivo'] == CONSECUTIVO][0]

# ── Emparejar CID ↔ línea de GRC ─────────────────────────────────────────
mrr_por_cid, sin_importe = {}, []
for nombre, cid in CIDS_DIRECCION:
    hits = por_k.get(k(nombre), [])
    if len(hits) == 1:
        mrr_por_cid[cid] = hits[0]
    else:
        sin_importe.append((nombre, cid))

usados = set(k(f['cliente']) for f in mrr_por_cid.values())
sin_cid = [f for f in LINEAS if k(f['cliente']) not in usados]

total_grupo = sum(float(f.get('mrrIni') or 0) for f in LINEAS)
total_con_cid = sum(float(f.get('mrrIni') or 0) for f in mrr_por_cid.values())
total_sin_cid = sum(float(f.get('mrrIni') or 0) for f in sin_cid)
assert abs(total_con_cid + total_sin_cid - total_grupo) < 0.01, 'el dinero no cierra'
assert len(mrr_por_cid) + len(sin_cid) == len(LINEAS), 'las lineas no cierran'

print('=== GRUPO PETROIL, CONCILIADO ===')
print('  líneas en GRC        : %d · %s' % (len(LINEAS), mx(total_grupo)))
print('  con CID de dirección : %d · %s' % (len(mrr_por_cid), mx(total_con_cid)))
print('  sin CID              : %d · %s' % (len(sin_cid), mx(total_sin_cid)))
print('  CIDs sin importe     : %d — %s' % (len(sin_importe), [c for _, c in sin_importe]))

# ── servicios_json: el desglose por nombre y CID ─────────────────────────
SERVICIOS = []
for nombre, cid in CIDS_DIRECCION:
    f = mrr_por_cid.get(cid)
    c = por_cid.get(cid)
    tk_n, did_n = tickets.get(cid, 0), len(DIDS.get(cid) or [])
    marca = ' · cuenta %s' % c['consecutivo'] if c else ' · sin cuenta propia'
    if f:
        mov = str(f.get('movimiento') or '')
        SERVICIOS.append({
            'nombre': '%s — CID %s' % (nombre, cid),
            'descripcion': '%s/mes en GRC%s. %s · %d ticket(s) · %d número(s). %s'
                           % (mx(f.get('mrrIni')), marca, mov, tk_n, did_n,
                              'BAJA CONFIRMADA.' if 'churn' in mov.lower() else ''),
        })
    else:
        SERVICIOS.append({
            'nombre': '%s — CID %s' % (nombre, cid),
            'descripcion': 'IMPORTE SIN ATRIBUIR%s. GRC no tiene una línea con ese nombre '
                           'exacto, y no se le asigna una a la fuerza. %d ticket(s) · '
                           '%d número(s).' % (marca, tk_n, did_n),
        })
# Y las 20 líneas que facturan sin CID conocido, agrupadas en una sola entrada
# para que el desglose no mienta por omisión.
SERVICIOS.append({
    'nombre': 'Líneas de GRC sin CID identificado (%d)' % len(sin_cid),
    'descripcion': '%s/mes en total. No tienen CID en la lista que entregó dirección, así que '
                   'no se pueden cruzar contra cortes, tickets ni números: %s.'
                   % (mx(total_sin_cid), ', '.join(str(f['cliente']) for f in sin_cid[:8])
                      + (' y %d más' % (len(sin_cid) - 8) if len(sin_cid) > 8 else '')),
})

print('\n=== servicios_json: %d entradas ===' % len(SERVICIOS))
for s in SERVICIOS:
    print('  · %-46s %s' % (s['nombre'][:46], s['descripcion'][:74]))

# ── La bitácora ──────────────────────────────────────────────────────────
def fila(f):
    cid = next((c for c, x in mrr_por_cid.items() if x is f), None)
    return '  · %-38s %12s  %-18s%s' % (
        str(f['cliente'])[:38], mx(f.get('mrrIni')), str(f.get('movimiento'))[:18],
        ('  CID %s' % cid) if cid else '')


NOTA = (
    'GRUPO PETROIL Y CÍAS — asiento consolidado (%s).\n\n'
    'Dirección entregó los 7 CID del grupo para asentarlo todo en una cuenta con los importes '
    'separados por nombre y CID. Esta cuenta (antes «Petroil - Corp de Estaciones», F32) pasa a '
    'ser el asiento del grupo; el desglose vive en Servicios contratados.\n\n'
    'LA CONCILIACIÓN, Y DÓNDE NO CIERRA:\n'
    '· %d líneas en el export de GRC, %s/mes en total.\n'
    '· %d de los 7 CID emparejan con una línea por nombre exacto: %s/mes.\n'
    '· %d líneas NO tienen CID en la lista y suman %s/mes — o sea, **el 65%% del dinero del '
    'grupo sigue sin poder cruzarse** contra cortes, tickets o números.\n'
    '· 2 CID se quedaron SIN importe atribuido, y no se les forzó uno:\n'
    '    – «PETROIL Observatorio» (CID 134502): GRC tiene DOS líneas parecidas, '
    '«Observatorio 1873» (%s) y «Observatorio 1873 (Chat)» (%s). Elegir una sería inventar.\n'
    '    – «Petroil» (CID 95890): nombre genérico. Es el CID con MÁS peso operativo del grupo '
    '(28 números y 7 tickets), probablemente el paraguas, pero GRC no tiene una línea llamada '
    'solo «Petroil». La candidata natural es «Petroil - Corporativo» (%s), que hoy es la '
    'segunda mayor del grupo y no tiene cuenta — pero eso lo confirma dirección, no yo.\n\n'
    'LAS %d LÍNEAS, de mayor a menor:\n%s\n\n'
    'LO QUE ESTE ASIENTO **NO** HIZO, a propósito:\n'
    '· NO se cambió `facturacion`. Sigue en %s. Subirla al total del grupo duplicaría lo que ya '
    'cuentan Z47 y C54, y movería la cartera de Dan sin que nadie lo decidiera.\n'
    '· NO se tocaron Z47 Prebiem Oceánica ni C54 Oceánica. Absorberlas exige darlas de baja y '
    'eso no se hace sin autorización expresa.\n'
    '· NO se dio de alta ninguna de las líneas sin cuenta.\n\n'
    'DATO DURO QUE SIGUE ABIERTO: **ninguno de los 7 CID aparece en el archivo de cortes de '
    'facturación.** Cero cortes en los siete. Así que para este grupo no hay medición de '
    'consumo, minutos ni extensiones por ningún lado, y el único importe posible es el MRR que '
    'declara Zoho.'
    % (FECHA, len(LINEAS), mx(total_grupo), len(mrr_por_cid), mx(total_con_cid),
       len(sin_cid), mx(total_sin_cid),
       mx(next((f['mrrIni'] for f in LINEAS if 'Observatorio 1873' == str(f['cliente']).split(' - ')[-1]), 0)),
       mx(next((f['mrrIni'] for f in LINEAS if '(Chat)' in str(f['cliente'])), 0)),
       mx(next((f['mrrIni'] for f in LINEAS if str(f['cliente']).endswith('Corporativo')), 0)),
       len(LINEAS), '\n'.join(fila(f) for f in LINEAS), mx(F32['facturacion']))
)

print('\n=== BITÁCORA (primeras líneas) ===')
for l in NOTA.split('\n')[:10]:
    print('  %s' % l[:104])
print('  … %d líneas, %d caracteres' % (len(NOTA.split('\n')), len(NOTA)))

NOTAS = ((F32.get('notas') or '') +
         '\n\n[GRUPO PETROIL %s] Huecos abiertos del grupo: (1) ninguno de los 7 CID tiene cortes, '
         'así que no hay medición de consumo; (2) %s/mes en %d líneas de GRC sin CID, que no se '
         'pueden cruzar con nada; (3) los CID 134502 y 95890 quedaron sin importe atribuido; '
         '(4) falta decidir si Z47 y C54 se absorben en este asiento.'
         % (FECHA, mx(total_sin_cid), len(sin_cid)))

cuerpo = {
    'empresa': NOMBRE_NUEVO,
    'grupo_empresarial': 'Grupo Petroil y Cías',
    'servicios_json': SERVICIOS,
    'observaciones_kam': anteponer_entrada(F32.get('observaciones_kam'), NOTA, 'sistema', FECHA),
    'notas': NOTAS,
}

print('\n=== LO QUE SE ESCRIBIRÍA EN %s ===' % CONSECUTIVO)
print('  empresa           : %s  ->  %s' % (F32['empresa'], NOMBRE_NUEVO))
print('  grupo_empresarial : %s  ->  %s' % (F32.get('grupo_empresarial'), cuerpo['grupo_empresarial']))
print('  servicios_json    : %d entradas (antes %d)'
      % (len(SERVICIOS), len(F32.get('servicios_json') or [])))
print('  facturacion       : %s  (SIN CAMBIO)' % mx(F32['facturacion']))
print('  asesor            : %s  (SIN CAMBIO)' % F32['asesor'])

if not APLICAR:
    print('\n  (diagnostico; no se escribio nada)')
    print('  Para aplicar:  python scripts/asienta-grupo-petroil.py --aplicar')
    raise SystemExit(0)

r = rest('cuentas?id=eq.%s' % F32['id'], 'PATCH', cuerpo)
assert len(r) == 1, 'se actualizaron %d filas' % len(r)

print('\n=== COMPROBANDO, releyendo de la base ===')
d = rest('cuentas?consecutivo=eq.%s&select=consecutivo,cid,empresa,asesor,estado,facturacion,'
         'grupo_empresarial,servicios_json,observaciones_kam' % CONSECUTIVO)[0]
print('  %s · %s · CID %s · %s · %s' % (d['consecutivo'], d['empresa'], d['cid'],
                                        d['asesor'], mx(d['facturacion'])))
print('  servicios_json: %d entradas' % len(d['servicios_json']))
for s in d['servicios_json'][:3]:
    print('     · %s' % s['nombre'][:72])
assert d['empresa'] == NOMBRE_NUEVO, 'el nombre no quedó'
assert len(d['servicios_json']) == len(SERVICIOS), 'faltan servicios'
assert float(d['facturacion']) == float(F32['facturacion']), 'la facturación cambió y no debía'
assert d['asesor'] == 'Dan', 'el asesor cambió y no debía'
t = str(d['observaciones_kam'])
for esp in ('GRUPO PETROIL Y CÍAS', 'CID 134502', 'CID 95890', 'ninguno de los 7 CID'):
    print('  bitácora contiene «%-24s»: %s' % (esp[:24], 'sí' if esp in t else 'NO'))
print('\n  Asiento hecho. Facturación y asesor intactos.')
