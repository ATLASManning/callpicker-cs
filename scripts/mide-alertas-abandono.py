# -*- coding: utf-8 -*-
"""Que se perderia al retirar las alertas de abandono del lote SAC.

   `asignada_sin_cerrar` y `nunca_asignada` hablan del generador SAC: la
   primera reclama cerrar una actividad del lote, la segunda dice que la cola
   de focos «ya la pone delante». Retirado el generador, la primera pide una
   accion cuya pantalla ya no existe y la segunda describe una fila que no
   avanza. Antes de quitarlas hay que saber a cuantas cuentas dejarian MUDAS
   —sin ninguna otra alerta— porque esas son las que desaparecerian de la cola
   de trabajo si la cobertura dependiera de la lista de alertas.

   Se mide contra PRODUCCION, no con una replica: una replica en Python de la
   deteccion confirmaria lo que yo creo que hace el codigo, no lo que hace.

   USO
   ---
       python scripts/mide-alertas-abandono.py
"""
import base64
import hashlib
import hmac
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE = 'https://callpicker-cs.vercel.app'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ABANDONO = {'asignada_sin_cerrar', 'nunca_asignada'}

# Las credenciales se LEEN aqui y no se imprimen nunca.
env = {}
for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    linea = linea.strip()
    if '=' in linea and not linea.startswith('#'):
        k, v = linea.split('=', 1)
        env[k.strip()] = v.strip().strip('"')

b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
sec, now = env['JWT_SECRET'].encode(), int(time.time())
cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                      'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                     separators=(',', ':')).encode())
TOK = cab + '.' + cue + '.' + b64(hmac.new(sec, (cab + '.' + cue).encode(),
                                           hashlib.sha256).digest())


def api(ruta):
    r = urllib.request.Request(BASE + ruta)
    r.add_header('Cookie', 'cp_session=' + TOK)
    r.add_header('Cache-Control', 'no-cache')
    try:
        with urllib.request.urlopen(r, timeout=180) as x:
            return x.status, json.loads(x.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        return e.code, {'_error': e.read()[:200].decode('utf-8', 'replace')}


# ── 1. La lista de alertas ─────────────────────────────────────────────────
est, d = api('/api/alertas?limite=1000')
assert est == 200, 'la API de alertas respondio %s: %s' % (est, d)
rows = d.get('rows', [])
print('API alertas   version %s' % d.get('version'))
print('              %d alertas · %d mostradas de %d filtradas\n'
      % (len(rows), d.get('mostradas', 0), d.get('filtradas', 0)))

# ── 2. La cobertura de VEREDICTOS, que es lo que ahora sostiene la cola ────
est2, v = api('/api/alertas/veredictos')
if est2 == 200:
    print('API veredictos  %d cuentas con juicio emitido\n'
          % (v.get('total') or len(v.get('rows', v.get('veredictos', [])))))
else:
    print('API veredictos  respondio %s — no se puede afirmar la cobertura\n' % est2)

# ── 3. Cuantas cuentas quedarian MUDAS ─────────────────────────────────────
porCuenta = defaultdict(set)
importe = {}
nombre = {}
for a in rows:
    k = a.get('cuentaId') or a.get('cuenta_id') or a.get('id')
    porCuenta[k].add(a.get('tipo'))
    importe[k] = a.get('mrr') or 0
    nombre[k] = a.get('empresa') or '?'

solo_abandono = [k for k, t in porCuenta.items() if t and t <= ABANDONO]
con_otras = [k for k, t in porCuenta.items() if t and not (t <= ABANDONO) and (t & ABANDONO)]

print('Cuentas con al menos una alerta      %d' % len(porCuenta))
print('  de abandono SOLAMENTE              %d   $%s' %
      (len(solo_abandono), format(sum(importe[k] for k in solo_abandono), ',.0f')))
print('  de abandono + algo mas             %d   (no se quedan mudas)' % len(con_otras))

print('\nPor tipo:')
for t, n in Counter(a.get('tipo') for a in rows).most_common():
    marca = '  <-- se retira' if t in ABANDONO else ''
    print('  %-26s %4d%s' % (t, n, marca))

# ── 4. El guardian de quorum de los episodios ─────────────────────────────
#    `alertasConMemoria` se niega a cerrar si lo detectado cae por debajo de
#    QUORUM=0.6 de lo abierto, porque una caida asi suele ser una fuente que no
#    cargo. Retirar dos tipos ES una caida deliberada: hay que comprobar que no
#    dispare el guardian, porque si lo dispara deja de cerrarse TODO lo demas y
#    el tablero envejece alertas ya resueltas sin decir por que.
#
#    Los dos tipos comparten el grupo `trabajo`, asi que una cuenta con ambos
#    aporta UNA sola llave: el piso de llaves perdidas es el numero de cuentas
#    con alerta de abandono, no la suma de las alertas.
ep = d.get('episodios', {})
abiertos, detectados = ep.get('abiertos', 0), ep.get('detectados', 0)
pierde = len(solo_abandono) + len(con_otras)   # cuentas con grupo `trabajo`
piso = abiertos * 0.6
print('\nQuorum de episodios (0.6):')
print('  abiertos                           %d' % abiertos)
print('  detectados hoy                     %d' % detectados)
print('  llaves `trabajo` que se retiran    %d' % pierde)
print('  detectados despues (estimado)      %d   vs piso %.0f   -> %s'
      % (detectados - pierde, piso,
         'NO dispara' if detectados - pierde >= piso else '*** DISPARA, no cerraria nada'))
if ep.get('sinCerrar'):
    print('  OJO: hoy ya viene con sinCerrar = %r' % ep['sinCerrar'])

if solo_abandono:
    print('\nLas que se quedarian mudas (top 12 por importe):')
    for k in sorted(solo_abandono, key=lambda k: -importe[k])[:12]:
        print('  %-42s $%10s  %s' % (nombre[k][:42], format(importe[k], ',.0f'),
                                     ','.join(sorted(porCuenta[k]))))
    print('\n  MUDAS en la lista de alertas no significa invisibles: la pantalla')
    print('  ALERTAS enumera las 192 por veredicto, no por tener alerta. Lo que')
    print('  hay que comprobar es que estas %d traigan veredicto propio.' % len(solo_abandono))
