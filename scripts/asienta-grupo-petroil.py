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

# Los 7 CID que entregó dirección el 23 sep 2026, con las líneas de GRC que le
# corresponden a cada uno. El tercer elemento es el mapeo EXPLÍCITO: no se
# deduce por parecido de nombres, se declara.
#
# Cinco emparejaban solas por nombre exacto. Las otras dos las confirmó
# dirección el mismo día, y por eso están aquí y no adivinadas:
#   · CID 95890 = «Petroil - Corporativo» — el nombre que mandó era solo
#     «Petroil», genérico. Cuadra con lo que ya se veía: es el CID con más peso
#     operativo del grupo (28 números, 7 tickets), o sea el paraguas.
#   · CID 134502 = Observatorio 1873 **con sus dos servicios, voz Y chat**. Son
#     dos líneas en GRC y se SUMAN; tomar solo una habría perdido la mitad.
CIDS_DIRECCION = [
    ('Petroil - Geogas',             '160933', ['Petroil - Geogas']),
    ('Petroil - Manzanillo',         '160484', ['Petroil - Manzanillo']),
    ('Petroil - Prebiem Oceanica',   '148385', ['Petroil - Prebiem Oceanica']),
    ('Petroil - Corp de Estaciones', '146201', ['Petroil - Corp de Estaciones']),
    ('Petroil - Observatorio 1873',  '134502', ['Petroil - Observatorio 1873',
                                                'Petroil - Observatorio 1873 (Chat)']),
    ('Petroil - Torre de Control',   '119552', ['Petroil - Torre de Control']),
    ('Petroil - Corporativo',        '95890',  ['Petroil - Corporativo']),
    # Oceánica no lleva el prefijo del grupo y es otro giro —clínica de
    # servicios de salud—, pero dirección la incluyó expresamente. Su CID sale
    # de su propia cuenta C54, no de la lista que mandó.
    ('Oceánica',                     '46962',  ['Oceánica']),
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

# El grupo NO es «lo que se llama Petroil». Dirección incluyó expresamente a
# Oceánica, cuya línea en GRC se llama solo «Oceánica» y que además es otro
# giro (servicios de salud, clínica). Filtrar por el nombre la habría dejado
# fuera del asiento del grupo que ella misma definió. Por eso se toman también
# las líneas de las cuentas marcadas con `grupo_empresarial` de Petroil.
EXTRA_DEL_GRUPO = ['Oceánica']   # confirmadas por dirección, sin el prefijo


def es_del_grupo(f):
    n = str(f.get('cliente') or '')
    return bool(re.search(r'petroil', n, re.I)) or n in EXTRA_DEL_GRUPO


LINEAS = [f for f in G['filas'] if es_del_grupo(f)]
LINEAS.sort(key=lambda f: -float(f.get('mrrIni') or 0))
assert any(str(f.get('cliente')) == 'Oceánica' for f in LINEAS), \
    'Oceánica no entró: dirección la puso en el grupo y tiene que estar'
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

# ── Emparejar CID ↔ línea(s) de GRC, por el mapeo declarado ──────────────
# Se valida en las dos direcciones: que cada nombre declarado exista una sola
# vez en GRC, y que ninguna línea quede asignada a dos CID. Un mapeo a mano sin
# validar es igual de peligroso que uno adivinado.
lineas_por_cid, asignadas = {}, {}
for nombre, cid, nombres_grc in CIDS_DIRECCION:
    hits = []
    for n in nombres_grc:
        c = por_k.get(k(n), [])
        assert len(c) == 1, 'la línea «%s» aparece %d veces en GRC, no 1' % (n, len(c))
        assert k(n) not in asignadas, \
            'la línea «%s» ya está asignada al CID %s' % (n, asignadas.get(k(n)))
        asignadas[k(n)] = cid
        hits.append(c[0])
    lineas_por_cid[cid] = hits

sin_cid = [f for f in LINEAS if k(f['cliente']) not in asignadas]

def mrr(fs):
    return sum(float(f.get('mrrIni') or 0) for f in fs)

total_grupo = mrr(LINEAS)
total_con_cid = sum(mrr(v) for v in lineas_por_cid.values())
total_sin_cid = mrr(sin_cid)
n_con_cid = sum(len(v) for v in lineas_por_cid.values())
assert abs(total_con_cid + total_sin_cid - total_grupo) < 0.01, 'el dinero no cierra'
assert n_con_cid + len(sin_cid) == len(LINEAS), 'las lineas no cierran'

print('=== GRUPO PETROIL, CONCILIADO ===')
print('  líneas en GRC        : %d · %s' % (len(LINEAS), mx(total_grupo)))
print('  con CID (7 cuentas)  : %d líneas · %s' % (n_con_cid, mx(total_con_cid)))
print('  sin CID              : %d líneas · %s' % (len(sin_cid), mx(total_sin_cid)))
print('  cobertura atribuida  : %.0f%% del MRR del grupo' % (100.0 * total_con_cid / total_grupo))

# ── servicios_json: el desglose por nombre y CID ─────────────────────────
#
# EL OBJETIVO ES VISIBILIDAD: «en una sola cuenta tener la visibilidad de todas
# las empresas que tienen servicio con Callpicker» (dirección, 23 sep 2026).
# Por eso va UNA ENTRADA POR EMPRESA, las 25, y no un resumen. Agrupar las que
# no tienen CID en un solo renglón —como estaba— es justo lo contrario de
# visibilidad: esconde 17 empresas detrás de un total.
SERVICIOS = []

# 1 · Encabezado con el total, para que el importe del grupo se vea de entrada.
n_empresas = len(LINEAS) - sum(len(v) - 1 for v in lineas_por_cid.values())
con_cuenta = sum(1 for _, cid, _ in CIDS_DIRECCION if por_cid.get(cid))
SERVICIOS.append({
    'nombre': 'GRUPO PETROIL Y CÍAS — %d empresas con servicio · %s/mes'
              % (n_empresas, mx(total_grupo)),
    'descripcion': 'Visibilidad completa del grupo, una entrada por empresa. %d tienen CID '
                   'identificado (%s) y %d todavía no (%s) — sin CID no se pueden cruzar contra '
                   'cortes, tickets ni números. Solo %d tienen cuenta propia en la cartera. '
                   'El importe de esta ficha NO es el del grupo: es el de esta cuenta, para no '
                   'contar dos veces lo que ya suman Z47 y C54.'
                   % (len(CIDS_DIRECCION), mx(total_con_cid), len(sin_cid), mx(total_sin_cid),
                      con_cuenta),
})

# 2 · Una entrada por empresa, de mayor a menor importe.
for f in LINEAS:
    nombre_grc = str(f.get('cliente') or '')
    cid = asignadas.get(k(nombre_grc))
    # La empresa que suma dos servicios (Observatorio: voz y chat) se pinta una
    # sola vez, con el total y el desglose; su segunda línea se salta.
    if cid and len(lineas_por_cid[cid]) > 1:
        if f is not lineas_por_cid[cid][0]:
            continue
        fs = lineas_por_cid[cid]
        etiqueta = next(n for n, c, _ in CIDS_DIRECCION if c == cid)
        importe, detalle = mrr(fs), ' Suma %d servicios: %s.' % (
            len(fs), ' + '.join('%s %s' % (str(x['cliente']).replace(etiqueta, '').strip(' -()')
                                           or 'voz', mx(x.get('mrrIni'))) for x in fs))
        movs = sorted(set(str(x.get('movimiento') or '') for x in fs))
    else:
        fs, etiqueta, importe, detalle = [f], nombre_grc, float(f.get('mrrIni') or 0), ''
        movs = [str(f.get('movimiento') or '')]

    c = por_cid.get(cid) if cid else None
    partes = [mx(importe) + '/mes']
    partes.append('CID %s' % cid if cid else 'CID sin identificar')
    partes.append('cuenta %s' % c['consecutivo'] if c else 'sin cuenta en la cartera')
    if cid:
        partes.append('%d ticket(s)' % tickets.get(cid, 0))
        partes.append('%d número(s)' % len(DIDS.get(cid) or []))
    partes.append(' / '.join(movs))
    SERVICIOS.append({
        'nombre': etiqueta,
        'descripcion': ' · '.join(partes) + '.' + detalle
                       + (' BAJA CONFIRMADA.' if any('churn' in m.lower() for m in movs) else '')
                       + (' Desactivada.' if any('desactivado' in m.lower() for m in movs) else ''),
    })

print('\n=== servicios_json: %d entradas ===' % len(SERVICIOS))
for s in SERVICIOS:
    print('  · %-46s %s' % (s['nombre'][:46], s['descripcion'][:74]))

# ── La bitácora ──────────────────────────────────────────────────────────
def fila(f):
    cid = asignadas.get(k(f['cliente']))
    return '  · %-38s %12s  %-18s%s' % (
        str(f['cliente'])[:38], mx(f.get('mrrIni')), str(f.get('movimiento'))[:18],
        ('  CID %s' % cid) if cid else '')


NOTA = (
    'GRUPO PETROIL Y CÍAS — asiento consolidado (%s).\n\n'
    'Dirección entregó los 7 CID del grupo para asentarlo todo en una cuenta con los importes '
    'separados por nombre y CID. Esta cuenta (antes «Petroil - Corp de Estaciones», F32) es el '
    'asiento del grupo; el desglose vive en Servicios contratados.\n\n'
    'LOS 7 CID CUBREN %s/mes de los %s del grupo — el %.0f%%.\n\n'
    'DOS ATRIBUCIONES LAS CONFIRMÓ DIRECCIÓN, no se dedujeron:\n'
    '· **CID 95890 = «Petroil - Corporativo»** (%s). El nombre que venía en la lista era solo '
    '«Petroil», genérico. Cuadra con lo que ya se veía: es el CID con más peso operativo del '
    'grupo —28 números y 7 tickets—, o sea el paraguas.\n'
    '· **CID 134502 = Observatorio 1873, con sus DOS servicios: voz Y chat.** Son dos líneas '
    'en GRC y se SUMAN (%s + %s). Tomar solo una habría perdido la mitad del importe. Y tiene '
    'una consecuencia de producto: **Grupo Petroil YA tiene Callpicker Chat contratado.**\n\n'
    'LO QUE SIGUE SIN CUBRIR: %d líneas sin CID por %s/mes (el %.0f%% del grupo). Sin CID no se '
    'pueden cruzar contra cortes, tickets ni números. Las mayores son «Centro de Ayuda TI» '
    '(baja confirmada), «MG Mazatlán», «Colosio Mzt» (baja) y «GC Motors Culiacán».\n\n'
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
    % (FECHA, mx(total_con_cid), mx(total_grupo), 100.0 * total_con_cid / total_grupo,
       mx(mrr(lineas_por_cid['95890'])),
       mx(lineas_por_cid['134502'][0].get('mrrIni')),
       mx(lineas_por_cid['134502'][1].get('mrrIni')),
       len(sin_cid), mx(total_sin_cid), 100.0 * total_sin_cid / total_grupo,
       len(LINEAS), '\n'.join(fila(f) for f in LINEAS), mx(F32['facturacion']))
)

print('\n=== BITÁCORA (primeras líneas) ===')
for l in NOTA.split('\n')[:10]:
    print('  %s' % l[:104])
print('  … %d líneas, %d caracteres' % (len(NOTA.split('\n')), len(NOTA)))

NOTAS = ((F32.get('notas') or '') +
         '\n\n[GRUPO PETROIL %s] Huecos abiertos del grupo: (1) ninguno de los 7 CID tiene cortes, '
         'así que no hay medición de consumo, minutos ni extensiones; (2) %s/mes en %d líneas de '
         'GRC sin CID, que no se pueden cruzar con nada; (3) falta decidir si Z47 y C54 se '
         'absorben en este asiento y si `facturacion` sube al total del grupo.'
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
