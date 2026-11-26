# -*- coding: utf-8 -*-
u"""Dispara a mano la corrida diaria y publica lo que devolvio, paso por paso.

   USO
   ---
       python scripts/dispara-cron-diario.py
       python scripts/dispara-cron-diario.py --base https://otro.vercel.app

   EL SECRETO NO SE IMPRIME NUNCA
   ------------------------------
   `CRON_SECRET` se lee de `.env.local` y viaja en la cabecera. Esta sonda
   publica el resultado, no la credencial: ni en la salida, ni en un mensaje de
   error, ni al fallar la autenticacion —ahi solo dice que fue 401.

   POR QUE EXISTE
   --------------
   La corrida va a las 12:00 UTC. Sin esto, comprobar que los compromisos
   nacen bien significa esperar a mañana, y para entonces nadie recuerda que
   estaba mirando. Y la respuesta del endpoint trae CUATRO pasos con su propio
   `ok` cada uno: leer solo el `ok` de arriba se saltaria que el aviso por
   correo no salio, o que `sinConfigurar` trae condiciones sin plazo —que es
   un hueco que NO se ve en pantalla: deja alertas sin fecha, o sea leidas
   como atendidas por omision.

   `maxDuration` del endpoint es 300s, asi que el timeout va por encima.
"""
import argparse
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(p):
        return None
    for ln in io.open(p, encoding='utf-8'):
        ln = ln.strip()
        if ln.startswith(clave + '='):
            return ln.split('=', 1)[1].strip().strip('"').strip("'")
    return None


ap = argparse.ArgumentParser()
ap.add_argument('--base', default='https://callpicker-cs.vercel.app')
ap.add_argument('--snapshot', action='store_true',
                help='fuerza tambien el snapshot semanal (normalmente solo lunes)')
args = ap.parse_args()

secreto = env('CRON_SECRET')
if not secreto:
    print(u'  *** no hay CRON_SECRET en .env.local. Sin el no se puede disparar,')
    print(u'      y eso NO es un aprobado: es que no se corrio.')
    sys.exit(2)

url = args.base.rstrip('/') + '/api/cron/diario?manual=1'
if args.snapshot:
    url += '&snapshot=1'

req = urllib.request.Request(url)
req.add_header('Authorization', 'Bearer ' + secreto)

print('')
print(u'  Disparando %s' % url)
print(u'  (puede tardar: el endpoint declara maxDuration 300s)')
print('')

try:
    with urllib.request.urlopen(req, timeout=320) as r:
        datos = json.loads(r.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    # El cuerpo de un 401 no trae el secreto, pero se recorta igual por si
    # alguna capa intermedia decidiera devolver la peticion entera.
    print(u'  *** HTTP %s. El endpoint rechazo la llamada.' % e.code)
    if e.code == 401:
        print(u'      401 = el CRON_SECRET de .env.local no es el de Vercel.')
    sys.exit(1)
except Exception as e:
    print(u'  *** no se pudo llamar: %s' % str(e)[:160])
    sys.exit(1)


def bloque(titulo, d):
    print(u'  %s' % titulo)
    print(u'  ' + '-' * 68)
    if d is None:
        print(u'    no corrio en esta corrida')
        print('')
        return
    for k, v in d.items():
        if v is None or v == [] or v == {}:
            v = u'(vacio)'
        print(u'    %-18s %s' % (k, v))
    print('')


print(u'  DIA %s · disparo %s · ok global: %s'
      % (datos.get('dia'), datos.get('disparo'), datos.get('ok')))
print(u'  %s' % datos.get('snapshotHoy'))
print('')
bloque(u'1 · SELLADO DE EPISODIOS', datos.get('sellado'))
bloque(u'2 · COMPROMISOS SLA', datos.get('compromisos'))
bloque(u'3 · AVISO POR CORREO', datos.get('aviso'))
bloque(u'4 · SNAPSHOT SEMANAL', datos.get('snapshot'))

# Lo que hay que mirar aunque el `ok` venga en true.
comp = datos.get('compromisos') or {}
sinconf = comp.get('sinConfigurar')
if sinconf:
    print(u'  *** OJO: condiciones que alertan y NO tienen plazo configurado:')
    print(u'      %s' % sinconf)
    print(u'      Sus alertas nacen SIN fecha limite, o sea que el panel las lee')
    print(u'      como atendidas por omision. Se arregla con una fila en')
    print(u'      sla_config, no tocando codigo.')
    print('')

print(u'  ' + '=' * 68)
if datos.get('ok') is True:
    print(u'  La corrida termino bien.')
else:
    print(u'  *** La corrida publica al menos una falla. Esta arriba, por paso. ***')
print('')
sys.exit(0 if datos.get('ok') is True else 1)
