# -*- coding: utf-8 -*-
"""Como se reparten las cuentas entre las siete situaciones de ALERTAS.

   PRIMERO comprueba la version que sirve la ruta y SOLO DESPUES interpreta
   cifras. Sin ese paso no se distingue «el codigo no esta en linea» de «el
   codigo esta mal», y depurar las dos cosas a la vez ya costo dos rondas. Si
   la version no es la esperada el guion se detiene y lo dice, en vez de dar
   por bueno un reparto que viene del build anterior.

   Lo que se mide de verdad: si `oportunidad` SE DISPARA. Hasta el 8 oct 2026
   la situacion estaba declarada y era inalcanzable porque su campo entraba
   como `null`. Un estado que ocupa sitio en el semaforo y nunca sale no es una
   mejora cosmetica: es un color que entrena a leer mal el resto.

   USO
   ---
       python scripts/mide-situaciones-alertas.py [version-esperada]
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
from collections import Counter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE = 'https://callpicker-cs.vercel.app'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESPERADA = sys.argv[1] if len(sys.argv) > 1 else None
CRECIMIENTO = {'escalon', 'cross_sell', 'ampliacion', 'blindaje'}

# Credenciales: se LEEN aqui y no se imprimen nunca.
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
        with urllib.request.urlopen(r, timeout=240) as x:
            return x.status, json.loads(x.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        return e.code, {'_error': e.read()[:300].decode('utf-8', 'replace')}


est, d = api('/api/alertas/veredictos')
if est != 200:
    print('La ruta respondio %s: %s' % (est, d))
    sys.exit(1)

ver = d.get('version')
print('version en linea   %s' % ver)
if ESPERADA and ver != ESPERADA:
    print('version esperada   %s' % ESPERADA)
    print('\n*** EL DESPLIEGUE NO HA LLEGADO. No se interpreta nada mas: las cifras')
    print('    de abajo serian del build anterior. Reintentar en un minuto.')
    sys.exit(2)
if d.get('falla'):
    print('AVISO falla        %s' % d['falla'])

rows = d.get('rows', [])
print('cuentas            %d\n' % d.get('total', len(rows)))

print('Reparto por situacion:')
cat = d.get('catalogo', {})
porS = d.get('porSituacion', {})
orden = sorted(porS.items(), key=lambda kv: cat.get(kv[0], {}).get('orden', 99))
for k, v in orden:
    print('  %-2s %-20s %4d cuentas   $%12s%s'
          % (cat.get(k, {}).get('orden', '?'),
             cat.get(k, {}).get('titulo', k), v['cuentas'],
             format(v['mrr'], ',.0f'),
             '   (%d sin importe)' % v['sinImporte'] if v['sinImporte'] else ''))

falt = [k for k in cat if k not in porS]
if falt:
    print('\n  Situaciones declaradas que NO salieron: %s' % ', '.join(falt))
    print('  Una situacion con mosaico en el semaforo y cero cuentas puede ser')
    print('  correcta (nadie esta asi hoy) o inalcanzable (no se puede llegar).')
    print('  La diferencia importa y no se ve en el reparto.')

# ── Lo que vino a comprobarse ──────────────────────────────────────────────
op = [r for r in rows if r.get('veredicto', {}).get('situacion') == 'oportunidad']
print('\n«Oportunidad»: %d cuenta(s)' % len(op))
if op:
    print('  (antes de este cambio eran CERO por construccion, no por los datos)')
    for r in sorted(op, key=lambda r: -(r.get('mrr') or 0))[:15]:
        print('  %-38s $%9s  %s'
              % (str(r.get('empresa'))[:38],
                 format(r.get('mrr') or 0, ',.0f'),
                 r.get('veredicto', {}).get('accion', '')[:52]))

# Y el contraste: cuantas tienen candidatura pero NO salen como oportunidad,
# porque algo peor las gano. Eso es correcto, pero hay que poder verlo: si
# fueran todas, «oportunidad» seguiria siendo inalcanzable en la practica.
conCand = [r for r in rows if (r.get('datos') or {}).get('candidatura')]
print('\nCon candidatura de crecimiento:      %d' % len(conCand))
print('  de esas, clasificadas «oportunidad»: %d' % len(op))
otras = Counter(r['veredicto']['situacion'] for r in conCand
                if r['veredicto']['situacion'] != 'oportunidad')
for k, n in otras.most_common():
    print('  las demas las gano  %-20s %3d' % (cat.get(k, {}).get('titulo', k), n)
          )
conAlguna = [r for r in rows if (r.get('datos') or {}).get('candidaturasTotal')]
print('\nCon alguna candidatura (incluida la de resolver primero): %d' % len(conAlguna))
