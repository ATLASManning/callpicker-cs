# -*- coding: utf-8 -*-
"""Que el asesor VE sus alertas en sus dos modulos, no solo en el menu.

   Comprueba las dos superficies nuevas contra produccion:
     · /asesores            su cola de trabajo en la tarjeta
     · /cuentas/<id>        el veredicto y el guion en la ficha

   Las dos son componentes de SERVIDOR, asi que su contenido viaja en el HTML
   y una lectura HTTP si prueba algo — a diferencia de las pantallas
   'use client' de este repo, donde no probaria nada. Aun asi se comprueba la
   URL final: el middleware redirige a /acceso con estado 200 y un «exito» de
   esos devuelve el muro de login, no la pagina.

   Primero confirma la version desplegada. Si no ha llegado, se detiene en vez
   de interpretar el build anterior.

   USO
   ---
       python scripts/verifica-alertas-del-asesor.py [version-esperada]
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

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE = 'https://callpicker-cs.vercel.app'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESPERADA = sys.argv[1] if len(sys.argv) > 1 else None

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


def pide(ruta, timeout=240):
    r = urllib.request.Request(BASE + ruta)
    r.add_header('Cookie', 'cp_session=' + TOK)
    r.add_header('Cache-Control', 'no-cache')
    try:
        with urllib.request.urlopen(r, timeout=timeout) as x:
            return x.status, x.read().decode('utf-8', 'replace'), x.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace'), ruta


# ── 0. ¿Esta en linea lo que vamos a probar? ──────────────────────────────
est, cuerpo, _ = pide('/api/alertas/veredictos')
if est != 200:
    print('La API de veredictos respondio %s' % est)
    sys.exit(1)
d = json.loads(cuerpo)
print('version en linea   %s' % d.get('version'))
if ESPERADA and d.get('version') != ESPERADA:
    print('version esperada   %s\n\n*** EL DESPLIEGUE NO HA LLEGADO.' % ESPERADA)
    sys.exit(2)

rows = d.get('rows', [])
# Una cuenta de cada extremo: la primera de la cola (lo mas urgente) y una
# «oportunidad», que es la rama que menos se ejercita y la que mas cambio hoy.
casos = [('la primera de la cola', rows[0])] if rows else []
op = next((r for r in rows if r['veredicto']['situacion'] == 'oportunidad'), None)
if op:
    casos.append(('una «oportunidad»', op))

fallas = []


def revisa(etq, ruta, deben, no_deben=()):
    est, html, final = pide(ruta)
    print('\n%s  —  %s   estado %s' % (etq, ruta[:58], est))
    if '/acceso' in final:
        fallas.append('%s: redirigio al login' % ruta)
        print('  *** redirigio al login, no se probo nada')
        return
    if est != 200:
        fallas.append('%s: estado %s' % (ruta, est))
    for t in deben:
        ok = t in html
        if not ok:
            fallas.append('%s: falta «%s»' % (ruta, t))
        print('  %-44s %s' % ('trae «%s»' % t[:40], 'si' if ok else '** NO'))
    for t in no_deben:
        ok = t not in html
        if not ok:
            fallas.append('%s: aun trae «%s»' % (ruta, t))
        print('  %-44s %s' % ('NO trae «%s»' % t[:38], 'limpio' if ok else '** AHI SIGUE'))


# ── 1. La tarjeta del asesor ──────────────────────────────────────────────
revisa('TARJETA DEL ASESOR', '/asesores',
       ['Mis alertas', 'Abrir mi cola de trabajo', 'cuenta', 'situacion='],
       ['Application error'])

# ── 2. La ficha, con su veredicto y su guion ──────────────────────────────
for etq, c in casos:
    sit = c['veredicto']['situacion']
    # El guion de cada situacion se delata por su titulo.
    titulos = {
        'se_va': 'LLAMADA DE RETENCIÓN HOY',
        'apagandose': 'LLAMADA DE DIAGNÓSTICO DE USO',
        'no_la_vemos': 'LLAMADA DE LEVANTAMIENTO DE DATOS',
        'sin_auditar': 'ARMAR LA AUDITORÍA Y AGENDARLA',
        'oportunidad': 'CASO DE CRECIMIENTO',
        'hay_que_mostrarle': 'PRESENTAR HALLAZGOS DE SU OPERACIÓN',
        'en_orden': 'SIN TAREA',
    }
    revisa('FICHA · %s (%s)' % (c['empresa'][:28], sit),
           '/cuentas/%s' % c['cuentaId'],
           [titulos.get(sit, ''), 'ANTES DE MARCAR', 'QUÉ PREGUNTAR',
            'QUÉ DEJAR REGISTRADO', 'Cuidado:', 'Este juicio se apoya en'],
           ['Application error', '{empresa}', '{mrr}', '{consumoPct}'])

print('\n  %s' % ('las dos superficies muestran las alertas' if not fallas
                  else '*** REVISAR:\n    - ' + '\n    - '.join(fallas)))
sys.exit(1 if fallas else 0)
