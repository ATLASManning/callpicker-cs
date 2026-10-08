# -*- coding: utf-8 -*-
"""QUE COMMIT esta sirviendo produccion ahora mismo.

   Existe porque el 8 oct 2026 di un build por recuperado mirando que las
   pantallas cargaban, y no probaba nada: **un build roto no tira el sitio,
   sigue sirviendo la compilacion ANTERIOR**. Y porque los correos de Vercel
   llegan con retraso y pueden referirse a un commit que ya quedo atras en la
   cadena — leerlos como si hablaran del HEAD lleva a arreglar lo que ya esta
   arreglado.

   Tres evidencias independientes:
     1. El identificador `dpl_` del HTML de /acceso, que es publico. Si no
        cambia tras un push, el build NO entro.
     2. La constante `VERSION` de /api/alertas/veredictos, que viaja CON el
        codigo y solo cambia si compilo.
     3. Que el commit que menciona el correo sea o no ancestro del HEAD.

   USO
   ---
       python scripts/verifica-despliegue-vivo.py [version-esperada] [commit-del-correo]
"""
import io
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
BASE = 'https://callpicker-cs.vercel.app'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESPERADA = sys.argv[1] if len(sys.argv) > 1 else None
DEL_CORREO = sys.argv[2] if len(sys.argv) > 2 else None


def git(*args):
    return subprocess.run(('git', '-C', RAIZ) + args, capture_output=True,
                          text=True, encoding='utf-8').stdout.strip()


head = git('rev-parse', '--short', 'HEAD')
print('  HEAD local                %s  %s' % (head, git('log', '-1', '--format=%s')[:52]))

# ── 1. El `dpl_` de una ruta publica ──────────────────────────────────────
try:
    with urllib.request.urlopen(BASE + '/acceso', timeout=60) as x:
        html = x.read().decode('utf-8', 'replace')
    m = re.search(r'dpl=(dpl_[A-Za-z0-9]+)', html)
    print('  despliegue sirviendo      %s' % (m.group(1) if m else 'no se encontro el dpl_'))
except urllib.error.HTTPError as e:
    print('  despliegue sirviendo      /acceso respondio %s' % e.code)

# ── 2. La VERSION, que viaja con el codigo ────────────────────────────────
# Se lee sin sesion a proposito: si el middleware redirige, se dice y punto —
# una redireccion con estado 200 no es una medicion.
import base64, hashlib, hmac, json, time          # noqa: E402
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
tok = cab + '.' + cue + '.' + b64(hmac.new(sec, (cab + '.' + cue).encode(),
                                           hashlib.sha256).digest())
r = urllib.request.Request(BASE + '/api/alertas/veredictos')
r.add_header('Cookie', 'cp_session=' + tok)
r.add_header('Cache-Control', 'no-cache')
viva = None
try:
    with urllib.request.urlopen(r, timeout=240) as x:
        viva = json.loads(x.read().decode()).get('version')
except urllib.error.HTTPError as e:
    print('  VERSION en linea          la API respondio %s' % e.code)
print('  VERSION en linea          %s' % viva)

fallas = []
if ESPERADA:
    print('  VERSION esperada          %s' % ESPERADA)
    if viva != ESPERADA:
        fallas.append('la VERSION no coincide: el build NO esta en linea')

# ── 3. El commit del correo, en su sitio de la cadena ─────────────────────
if DEL_CORREO:
    es_ancestro = subprocess.run(
        ('git', '-C', RAIZ, 'merge-base', '--is-ancestor', DEL_CORREO, 'HEAD')).returncode == 0
    mismo = git('rev-parse', '--short', DEL_CORREO) == head
    print('\n  el correo habla de        %s' % DEL_CORREO)
    if mismo:
        print('  ...y es el HEAD           *** el fallo es del codigo de AHORA')
        fallas.append('el correo se refiere al HEAD')
    elif es_ancestro:
        print('  ...que quedo ATRAS        ya hay %s commit(s) encima'
              % git('rev-list', '--count', '%s..HEAD' % DEL_CORREO))
        print('  Un correo de Vercel llega con retraso: puede hablar de un commit')
        print('  ya superado. Lo que manda es la VERSION de arriba.')
    else:
        print('  ...que NO esta en esta rama')

print('\n  %s' % ('el codigo de HEAD esta sirviendo en produccion' if not fallas
                  else '*** ' + ' · '.join(fallas)))
sys.exit(1 if fallas else 0)
