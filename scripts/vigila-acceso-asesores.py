# -*- coding: utf-8 -*-
u"""Espera a que Dan, Claudia y Fatima registren sesion de verdad.

   Que el codigo los deje pasar NO es que hayan entrado. Este guion mira la
   base cada dos minutos y termina cuando los tres tienen `ultimo_acceso` de
   HOY, o cuando se acaba el plazo.

   Mira DOS cosas, porque miden distinto:

     · `usuarios.ultimo_acceso` — lo escribe `verify/route.ts` al pasar el
       login. Es la prueba de que la puerta se abrio.
     · `uso_dashboard`          — lo escribe cada vista de pantalla. Es la
       prueba de que ademas NAVEGARON. Alguien puede entrar y quedarse en la
       primera pantalla; eso tambien se ve.

   Se reporta por separado: «entro» y «ademas uso el tablero» no son lo mismo
   y colapsarlos diria que alguien trabajo cuando solo abrio la puerta.

   USO
       python scripts/vigila-acceso-asesores.py [minutos]
"""
import io
import os
import sys
import json
import time
import datetime
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PLAZO_MIN = int(sys.argv[1]) if len(sys.argv) > 1 else 90
CADA_SEG = 120

ASESORES = [
    (u'Fátima',  'fatima@callpicker.com'),
    (u'Claudia', 'claudia@callpicker.com'),
    (u'Dan',     'dominguez.dan@callpicker.com'),
]


def env(clave):
    for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
CAB = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}


def pide(ruta):
    r = urllib.request.Request(URL + '/rest/v1/' + ruta, headers=CAB)
    return json.loads(urllib.request.urlopen(r, timeout=60).read().decode('utf-8'))


# El dia en MEXICO, no en UTC: el servidor de Supabase va en UTC y a partir de
# las 18:00 de Mexico «hoy» en UTC ya es mañana. Ver [[feedback-fechas-zona-mexico]].
HOY = (datetime.datetime.utcnow() - datetime.timedelta(hours=6)).strftime('%Y-%m-%d')
print(u'  vigilando hasta %d min · hoy en Mexico es %s\n' % (PLAZO_MIN, HOY))

# Linea base: con que fecha arrancamos, para no confundir un acceso viejo con
# uno nuevo.
base = {}
for _, correo in ASESORES:
    f = pide('usuarios?select=email,ultimo_acceso&email=eq.' + correo)
    base[correo] = (f[0].get('ultimo_acceso') if f else None)
    print(u'  base %-30s ultimo acceso %s' % (correo, base[correo] or u'—'))
print(u'')

fin = time.time() + PLAZO_MIN * 60
entraron, navegaron = {}, {}
vuelta = 0

while time.time() < fin:
    vuelta += 1
    for nombre, correo in ASESORES:
        if correo in entraron and correo in navegaron:
            continue
        f = pide('usuarios?select=ultimo_acceso&email=eq.' + correo)
        ult = f[0].get('ultimo_acceso') if f else None
        if correo not in entraron and ult and ult != base[correo] and str(ult)[:10] >= HOY:
            entraron[correo] = ult
            print(u'  [%s] *** %s ENTRO · %s'
                  % (time.strftime('%H:%M'), nombre, ult))
        if correo in entraron and correo not in navegaron:
            u2 = pide('uso_dashboard?select=created_at&email=eq.' + correo
                      + '&created_at=gte.' + HOY + '&limit=1')
            if u2:
                navegaron[correo] = u2[0].get('created_at')
                print(u'  [%s]     %s ademas ya esta navegando el tablero'
                      % (time.strftime('%H:%M'), nombre))
    if len(entraron) == len(ASESORES):
        print(u'\n  LOS TRES ENTRARON.')
        break
    if vuelta % 5 == 0:
        print(u'  [%s] van %d de %d · siguen faltando: %s'
              % (time.strftime('%H:%M'), len(entraron), len(ASESORES),
                 u', '.join(n for n, c in ASESORES if c not in entraron)))
    time.sleep(CADA_SEG)

print(u'\n  ── RESULTADO ─────────────────────────────────────────────────')
for nombre, correo in ASESORES:
    if correo in entraron:
        print(u'  %-9s ENTRO %s%s' % (nombre, entraron[correo],
              u'  · y navegando' if correo in navegaron else
              u'  · pero sin registrar una sola vista de pantalla'))
    else:
        print(u'  %-9s NO ha entrado' % nombre)
faltan = [n for n, c in ASESORES if c not in entraron]
if faltan:
    print(u'\n  Sin entrar al cerrar el plazo: %s' % u', '.join(faltan))
    print(u'  Puede ser que no lo hayan intentado todavia. Si lo intentaron y')
    print(u'  sigue fallando, correr revisa-acceso-asesores.py: lo que mas')
    print(u'  probable es que el despliegue de Vercel no haya terminado.')
