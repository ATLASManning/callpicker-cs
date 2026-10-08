# -*- coding: utf-8 -*-
"""Que ninguna pantalla del tablero este caida.

   Un cambio de color no deberia tumbar nada, pero `ignoreBuildErrors` esta
   encendido: un error de tipos o un identificador inexistente despliega en
   verde y revienta en la cara del usuario. Y una tanda de veinte archivos es
   justo donde se cuela uno.

   Comprueba el estado Y la URL final: el middleware redirige a /acceso con
   estado 200, asi que un «exito» puede ser el muro de login. Y busca el texto
   de error de Next, que llega con estado 200 en una pagina de cliente.

   USO
   ---
       python scripts/verifica-pantallas-todas.py
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

RUTAS = [
    '/', '/asesores', '/alertas', '/cuentas', '/cuentas/dormidas',
    '/analisis-llamadas', '/auditoria', '/base-cs', '/buzon',
    '/callpicker-chat', '/chat', '/churn', '/customer-tenure',
    '/facturacion', '/facturacion/cortes', '/reuniones', '/reuniones/anexos',
    '/tickets', '/seguimiento', '/activaciones', '/perfil-rol', '/admin/uso',
]
# «This page could not be found» NO vale como señal: viaja en el bundle de
# TODAS las páginas —es el texto del 404 de Next— y la primera versión de esta
# prueba acusó a las veintidós a la vez. Veintidós pantallas con el mismo
# síntoma no son veintidós fallos, son una prueba mal hecha; un 404 de verdad
# llega con estado 404, no con 200.
MALO = ('Application error', 'a server-side exception has occurred')
# Una pantalla que responde 200 pero devuelve solo el cascarón es otra forma de
# estar caída. El umbral sale de medir: la más ligera del tablero ronda los
# 45 KB y el cascarón solo, unos 25 KB.
MINIMO_KB = 30

fallas = []
for ruta in RUTAS:
    r = urllib.request.Request(BASE + ruta)
    r.add_header('Cookie', 'cp_session=' + TOK)
    r.add_header('Cache-Control', 'no-cache')
    try:
        with urllib.request.urlopen(r, timeout=240) as x:
            est, html, final = x.status, x.read().decode('utf-8', 'replace'), x.geturl()
    except urllib.error.HTTPError as e:
        est, html, final = e.code, e.read().decode('utf-8', 'replace'), ruta

    nota = ''
    if '/acceso' in final and ruta != '/acceso':
        nota = 'redirigio al login'
    elif est != 200:
        nota = 'estado %s' % est
    elif len(html) < MINIMO_KB * 1024:
        nota = 'solo %d KB: parece el cascarón sin contenido' % (len(html) // 1024)
    else:
        for m in MALO:
            if m in html:
                nota = 'trae «%s»' % m
                break
    if nota:
        fallas.append('%s: %s' % (ruta, nota))
    print('  %-26s %s  %5d KB  %s' % (ruta, est, len(html) // 1024, nota or 'ok'))

print('\n  %s' % ('las %d pantallas responden' % len(RUTAS) if not fallas
                  else '*** REVISAR:\n    - ' + '\n    - '.join(fallas)))
sys.exit(1 if fallas else 0)
