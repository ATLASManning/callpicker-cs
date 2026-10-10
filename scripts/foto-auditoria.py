# -*- coding: utf-8 -*-
"""UNA foto de todo lo que la auditoría necesita, en un solo archivo.

   POR QUE EXISTE
   --------------
   La auditoría del Prompt Master afirma que hay CINCO universos distintos de
   cartera en la misma pantalla. Comprobar eso leyendo cada bloque por su
   cuenta tiene un problema evidente: si cada comprobación consulta en un
   momento distinto, una diferencia puede ser del reloj y no del código, y la
   auditoría acabaría discutiendo su propio ruido.

   Así que se toma una foto: las cuentas de Supabase, los veredictos de la API
   y los agregados derivados, todo de una pasada, y se guarda con su sello.
   Todo lo que se afirme en `docs/AUDITORIA.md` se mide contra ESTE archivo.

   Las credenciales se leen de `.env.local` y NUNCA se imprimen ni se guardan
   en la foto.

   USO
   ---
       python scripts/foto-auditoria.py [ruta-de-salida.json]
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
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_WEB = 'https://callpicker-cs.vercel.app'
SALIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'docs', 'foto-auditoria.json')


def entorno():
    e = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as f:
        for linea in f:
            linea = linea.strip()
            if '=' in linea and not linea.startswith('#'):
                k, v = linea.split('=', 1)
                e[k.strip()] = v.strip().strip('"')
    return e


E = entorno()
H_SUPA = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
          'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY'],
          'Accept': 'application/json'}
B_SUPA = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'


def supa(tabla, params):
    """Lee una tabla POR PAGINAS. PostgREST corta en 1000 filas sin avisar:
       devuelve 200 con mil filas y nadie se entera."""
    filas, desde, paso = [], 0, 1000
    while True:
        q = dict(params)
        q['limit'] = paso
        q['offset'] = desde
        r = urllib.request.Request(B_SUPA + tabla + '?' + urllib.parse.urlencode(q),
                                   headers=H_SUPA)
        with urllib.request.urlopen(r, timeout=120) as x:
            lote = json.loads(x.read().decode())
        filas.extend(lote)
        if len(lote) < paso:
            return filas
        desde += paso


def token_web():
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    sec, now = E['JWT_SECRET'].encode(), int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                          'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(sec, (cab + '.' + cue).encode(), hashlib.sha256).digest())


def api(ruta):
    r = urllib.request.Request(BASE_WEB + ruta)
    r.add_header('Cookie', 'cp_session=' + token_web())
    r.add_header('Cache-Control', 'no-cache')
    with urllib.request.urlopen(r, timeout=300) as x:
        return json.loads(x.read().decode())


foto = {'sello': time.strftime('%Y-%m-%dT%H:%M:%S'), 'fuentes': {}}

print(u'  1 · cuentas de Supabase …')
CAMPOS = ('id,cid,consecutivo,empresa,asesor,estado,facturacion,health_score,'
          'score_actividad,score_adopcion,score_pago,score_relacional,'
          'activo_desde,ultimo_contacto,giro,nps_score,observaciones_kam,'
          'total_empleados,num_oficinas,pagina_web,contacto_nombre,contacto_cargo,'
          'contacto_tel,contacto_email,upsell_producto,crossell_producto,'
          'valor_upsell_estimado,contactos_json')
cuentas = supa('cuentas', {'select': CAMPOS})
foto['fuentes']['cuentas'] = cuentas
print(u'     %d filas (todos los estados)' % len(cuentas))
vivas = [c for c in cuentas if c.get('estado') in ('activo', 'en_riesgo')]
print(u'     %d vivas (activo|en_riesgo)' % len(vivas))

print(u'  2 · veredictos de /api/alertas/veredictos …')
ver = api('/api/alertas/veredictos')
foto['fuentes']['veredictos'] = ver
print(u'     %d cuentas · VERSION %s' % (len(ver.get('rows') or []), ver.get('version')))

print(u'  3 · alertas de /api/alertas …')
try:
    al = api('/api/alertas')
    foto['fuentes']['alertas'] = al
    print(u'     %d alertas' % len(al.get('alertas') or al.get('rows') or []))
except urllib.error.HTTPError as e:
    foto['fuentes']['alertas'] = {'error': e.code}
    print(u'     la API respondio %s' % e.code)

print(u'  4 · adopcion_producto …')
try:
    ad = supa('adopcion_producto', {'select': 'cuenta_id,producto,nivel,created_at'})
    foto['fuentes']['adopcion_producto'] = ad
    print(u'     %d filas' % len(ad))
except urllib.error.HTTPError as e:
    foto['fuentes']['adopcion_producto'] = {'error': e.code}
    print(u'     error %s' % e.code)

print(u'  5 · seguimientos, actividades y reuniones (conteos) …')
for t, campos in (('seguimientos', 'id,cuenta_id,fecha,tipo,resultado'),
                  ('actividades_sac', 'id,cuenta_id,estado,fecha_objetivo'),
                  ('reuniones', 'id,cuenta_id,fecha,tipo')):
    try:
        filas = supa(t, {'select': campos})
        foto['fuentes'][t] = filas
        print(u'     %-16s %d filas' % (t, len(filas)))
    except urllib.error.HTTPError as e:
        foto['fuentes'][t] = {'error': e.code}
        print(u'     %-16s error %s' % (t, e.code))

d = os.path.dirname(SALIDA)
if d and not os.path.isdir(d):
    os.makedirs(d)
io.open(SALIDA, 'w', encoding='utf-8').write(json.dumps(foto, ensure_ascii=False))
print(u'\n  foto en %s  (%.1f MB)' % (SALIDA, os.path.getsize(SALIDA) / 1048576.0))
print(u'  sello %s' % foto['sello'])
