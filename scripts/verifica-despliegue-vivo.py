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

   LA VERSION ESPERADA SE LEE DEL FUENTE, NO SE PASA A MANO
   --------------------------------------------------------
   La primera version solo comparaba si se le daba la version por argumento.
   Llamada sin argumentos imprimia la VERSION en linea y acto seguido
   declaraba «el codigo de HEAD esta sirviendo» — sin haber comparado nada.
   Paso el 8 oct 2026: dijo que HEAD estaba sirviendo mientras el marcador en
   linea era `.10` y el fuente ya iba por `.11`.

   Un verificador que concluye exito por defecto es peor que no tenerlo: da
   la tranquilidad sin el trabajo. Ahora la espera sale de
   `app/api/alertas/veredictos/route.ts`, y si no se puede leer, eso es un
   fallo y no un «todo bien».

   USO
   ---
       python scripts/verifica-despliegue-vivo.py [version-esperada] [commit-del-correo]

   El primer argumento solo hace falta para comparar contra algo que no sea
   el fuente de ahora.
"""
import io
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
BASE = 'https://callpicker-cs.vercel.app'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_VERSION = os.path.join(RAIZ, 'app', 'api', 'alertas', 'veredictos', 'route.ts')


def version_del_fuente():
    """La `VERSION` que el codigo de ahora deberia estar sirviendo."""
    try:
        txt = io.open(RUTA_VERSION, encoding='utf-8').read()
    except OSError:
        return None
    m = re.search(r"""const\s+VERSION\s*=\s*['"]([^'"]+)['"]""", txt)
    return m.group(1) if m else None


ESPERADA = sys.argv[1] if len(sys.argv) > 1 else version_del_fuente()
DEL_CORREO = sys.argv[2] if len(sys.argv) > 2 else None


def git(*args):
    return subprocess.run(('git', '-C', RAIZ) + args, capture_output=True,
                          text=True, encoding='utf-8').stdout.strip()


head = git('rev-parse', '--short', 'HEAD')
print('  HEAD local                %s  %s' % (head, git('log', '-1', '--format=%s')[:52]))

# ── 1. El `dpl_` de una ruta publica ──────────────────────────────────────
# Se GUARDA en una variable, no solo se imprime: es la unica senal que cambia
# con cada build, y la comprobacion 4 la necesita.
dpl = None
try:
    with urllib.request.urlopen(BASE + '/acceso', timeout=60) as x:
        html = x.read().decode('utf-8', 'replace')
    m = re.search(r'dpl=(dpl_[A-Za-z0-9]+)', html)
    dpl = m.group(1) if m else None
    print('  despliegue sirviendo      %s' % (dpl or 'no se encontro el dpl_'))
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
    print('  VERSION esperada          %s%s'
          % (ESPERADA, '' if len(sys.argv) > 1 else '   (leida del fuente)'))
    if viva != ESPERADA:
        fallas.append('la VERSION no coincide: el build NO esta en linea')
else:
    # SIN ESPERA NO HAY VEREDICTO. Antes se caia por aqui y el script decia
    # que todo estaba bien sin haber comparado nada.
    fallas.append('no se pudo leer la VERSION del fuente: no hay con que comparar')

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

# ── 4. LA VERSION NO SE MUEVE SOLA, Y POR ESO NO BASTA ────────────────────
#
# `VERSION` es una constante que se sube A MANO. Un commit que no la toca —la
# inmensa mayoria— la deja igual, asi que la comparacion CUADRA aunque el
# build no haya entrado nunca. Es exactamente el fallo que la cabecera de este
# guion dice que no hay que cometer, cometido por el guion.
#
# Paso el 21-23 oct 2026: el corte de Churn de la semana 25 se empujo a las
# dos ramas, Vercel no lo recogio, y este script dijo DOS DIAS SEGUIDOS «el
# codigo de HEAD esta sirviendo en produccion». La unica senal que sirve
# siempre es el `dpl_`, que cambia con CADA build.
#
# Asi que se recuerda: el dpl visto la ultima vez, con su commit y su fecha.
# Si el HEAD avanzo y el dpl NO, el build no entro — lo diga la VERSION lo que
# diga. [[feedback-verificar-antes-asegurar]]
MEMORIA = os.path.join(RAIZ, 'scripts', '.ultimo-despliegue.json')
previo = {}
try:
    previo = json.loads(io.open(MEMORIA, encoding='utf-8').read())
except (OSError, ValueError):
    pass

if previo.get('dpl') and previo.get('commit'):
    print('\n  la vez anterior           %s  con HEAD %s'
          % (previo['dpl'][:28], previo['commit']))
    if previo['commit'] != head and previo['dpl'] == dpl:
        n = git('rev-list', '--count', '%s..HEAD' % previo['commit']) or '?'
        fallas.append('EL HEAD AVANZO %s commit(s) y el despliegue NO CAMBIO: '
                      'el build no entro, por mucho que la VERSION cuadre' % n)
    elif previo['dpl'] != dpl:
        print('  el despliegue CAMBIO desde entonces')
else:
    print('\n  la vez anterior           (sin registro — esta es la primera)')
    print('  OJO: sin un dpl anterior con que comparar, lo unico que se ha')
    print('  mirado es la VERSION, y esa no cambia si el commit no la toca.')

try:
    io.open(MEMORIA, 'w', encoding='utf-8', newline='\n').write(
        json.dumps({'dpl': dpl, 'commit': head, 'version': viva}, indent=1) + '\n')
except OSError:
    pass

print('\n  %s' % ('el codigo de HEAD esta sirviendo en produccion' if not fallas
                  else '*** ' + ' · '.join(fallas)))
sys.exit(1 if fallas else 0)
