# -*- coding: utf-8 -*-
u"""¿Tienen acceso al tablero Dan, Claudia y Fatima? Las DOS puertas.

   Hay dos listas y mirar solo una ya costo una confusion en produccion:

   1. `lib/auth.ts` → EMAILS_AUTORIZADOS_DEFAULT. Se evalua en CADA request
      desde el middleware. Es la unica que muerde contra una cookie ya
      emitida, y las cookies duran 30 dias.
   2. `usuarios.activo` en Supabase. Solo se revisa en login/verify. Medido el
      6 oct 2026: los tres figuraban «Inactivo» con la contraseña vencida y
      aun asi los tres abrian el tablero completo.

   Y una ESCOTILLA que anula la primera: la variable de entorno
   `EMAILS_AUTORIZADOS` en Vercel. Si esta definida SUSTITUYE a la lista del
   codigo entera. Este guion dice si existe localmente; lo de Vercel hay que
   mirarlo en el panel, porque desde aqui no se ve.

   Tambien cuenta sus registros en `uso_dashboard`, que es lo que alimenta el
   apartado «Uso Dashboard».

   USO
       python scripts/revisa-acceso-asesores.py
"""
import io
import os
import re
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# CADA UNO CON LO QUE SE ESPERA DE EL, no «todos bloqueados».
#
# Este script nacio durante la suspension del 6 oct 2026 y su lectura final
# exigia que los TRES estuvieran fuera. Dirección les devolvio el acceso el 12
# oct, y desde entonces el script cerraba SIEMPRE con «*** El bloqueo NO esta
# completo» sobre un estado correcto. Un detector que grita cuando no pasa nada
# deja de leerse, y el dia que pase algo tampoco se leera.
# [[feedback-verificar-antes-asegurar]]
ASESORES = [
    (u'Fátima',  'fatima@callpicker.com',         u'dentro'),
    (u'Dan',     'dominguez.dan@callpicker.com',  u'dentro'),
    # Erick Sánchez sustituye a Claudia — alta del 16 oct 2026, cartera de 71.
    (u'Erick',   'erick@callpicker.com',          u'dentro'),
    # Claudia, fuera el 15 oct 2026 por instrucción de dirección.
    (u'Claudia', 'claudia@callpicker.com',        u'fuera'),
]


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(p):
        return None
    for linea in io.open(p, encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")
    return None


# ── PUERTA 1 · la lista del codigo ─────────────────────────────────────────
auth = io.open(os.path.join(RAIZ, 'lib', 'auth.ts'), encoding='utf-8').read()
m = re.search(r'const EMAILS_AUTORIZADOS_DEFAULT = \[([\s\S]*?)\n\]', auth)
if not m:
    print(u'  *** no encontre EMAILS_AUTORIZADOS_DEFAULT en lib/auth.ts'); sys.exit(2)
bloque = m.group(1)
# Activos = los que NO estan comentados.
activos = set()
for linea in bloque.split('\n'):
    s = linea.strip()
    if s.startswith('//') or s.startswith('*') or s.startswith('/*'):
        continue
    mm = re.search(r"'([^']+@[^']+)'", s)
    if mm:
        activos.add(mm.group(1).lower())

print(u'\n  PUERTA 1 · lib/auth.ts (se evalua en CADA request)')
print(u'      %d correo(s) autorizados en total' % len(activos))
for nombre, correo, _esperado in ASESORES:
    tiene = correo.lower() in activos
    print(u'      %-9s %-30s %s' % (nombre, correo,
          u'*** AUTORIZADO' if tiene else u'bloqueado (linea comentada)'))

# ── LA ESCOTILLA ───────────────────────────────────────────────────────────
local = env('EMAILS_AUTORIZADOS')
print(u'\n  LA ESCOTILLA · variable EMAILS_AUTORIZADOS')
if local:
    print(u'      *** DEFINIDA en .env.local: SUSTITUYE a la lista de arriba.')
    for nombre, correo, _esperado in ASESORES:
        if correo.lower() in local.lower():
            print(u'      *** %s SI esta en la variable: la lista del codigo NO manda' % nombre)
else:
    print(u'      no esta en .env.local.')
print(u'      OJO: en VERCEL puede estar definida y desde aqui no se ve.')
print(u'      Si lo esta, manda ella y la lista del codigo es decorativa.')

# ── PUERTA 2 · la tabla de usuarios ────────────────────────────────────────
URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')


def trae(tabla, select, extra=u''):
    filas, desde = [], 0
    while True:
        u = u'%s/rest/v1/%s?select=%s%s&offset=%d&limit=1000' % (URL, tabla, select, extra, desde)
        r = urllib.request.Request(u, headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
        try:
            lote = json.loads(urllib.request.urlopen(r, timeout=60).read().decode('utf-8'))
        except Exception as e:
            print(u'      *** %s: %s' % (tabla, e))
            return None
        filas.extend(lote)
        if len(lote) < 1000:
            return filas
        desde += 1000


print(u'\n  PUERTA 2 · usuarios.activo (solo se revisa en login/verify)')
sin_cartera = []
us = trae('usuarios', 'email,nombre,rol,activo,asesor_nombre')
if us is None:
    print(u'      no se pudo leer')
else:
    porCorreo = {str(u.get('email', '')).lower(): u for u in us}
    for nombre, correo, _esperado in ASESORES:
        u2 = porCorreo.get(correo.lower())
        if not u2:
            print(u'      %-9s sin fila en `usuarios`' % nombre)
        else:
            # LA COLUMNA QUE IMPORTA ES `asesor_nombre`, NO `nombre`.
            # Esta linea imprimia `nombre` —la etiqueta que se ve en el
            # tablero— y por eso no se notaba que Erick Sánchez entraba con la
            # cartera SIN asignar: `asesor_nombre` en blanco y el candado de
            # lib/dueno.ts, que falla cerrado, devolviendole 403 en sus propios
            # datos. Se enseñan las dos, y la vacia se grita.
            cart = u2.get('asesor_nombre')
            aviso = u'' if cart else u'   *** SIN CARTERA: entrara y recibira 403'
            print(u'      %-9s rol=%-8s activo=%-5s nombre=%-16s cartera=%s%s'
                  % (nombre, u2.get('rol'), u2.get('activo'),
                     u2.get('nombre'), cart or u'(vacia)', aviso))
            if u2.get('rol') == 'asesor' and not cart:
                sin_cartera.append(nombre)
    # «Ojo: hay DOS Dan» — se nombran todos los que contengan «dan».
    dans = [u2 for u2 in us if 'dan' in str(u2.get('email', '')).lower()
            or 'dan' in str(u2.get('nombre', '')).lower()]
    if len(dans) > 1:
        print(u'      *** HAY %d usuario(s) que casan con «Dan»:' % len(dans))
        for u2 in dans:
            print(u'          %-32s %-8s activo=%s · asesor=%s'
                  % (u2.get('email'), u2.get('rol'), u2.get('activo'),
                     u2.get('asesor_nombre')))

# ── LO QUE SE VE EN «USO DASHBOARD» ────────────────────────────────────────
print(u'\n  USO DASHBOARD · registros en `uso_dashboard`')
uso = trae('uso_dashboard', 'email,asesor,created_at')
if uso is None:
    print(u'      no se pudo leer')
else:
    print(u'      %s registro(s) en total' % u'{:,}'.format(len(uso)))
    for nombre, correo, _esperado in ASESORES:
        suyos = [x for x in uso if str(x.get('email', '')).lower() == correo.lower()]
        if not suyos:
            print(u'      %-9s SIN NINGUN registro' % nombre)
        else:
            fechas = sorted(str(x.get('created_at', ''))[:10] for x in suyos)
            print(u'      %-9s %4d registro(s) · del %s al %s'
                  % (nombre, len(suyos), fechas[0], fechas[-1]))

print(u'\n  ── LECTURA ───────────────────────────────────────────────────')
print(u'  %-9s %-9s %-9s %s' % (u'asesor', u'esperado', u'real', u'veredicto'))
fallos = []
for nombre, correo, esperado in ASESORES:
    real = u'dentro' if correo.lower() in activos else u'fuera'
    ok = (real == esperado)
    if not ok:
        fallos.append(u'%s: se esperaba %s y esta %s' % (nombre, esperado, real))
    print(u'  %-9s %-9s %-9s %s' % (nombre, esperado, real, u'ok' if ok else u'*** NO'))

print()
print(u'  Recordatorio de las DOS puertas: esta lectura es la PUERTA 1, la lista')
print(u'  blanca de lib/auth.ts, que es la unica que muerde contra una cookie ya')
print(u'  emitida. Marcar a alguien Activo en Gestion de Usuarios no le da')
print(u'  acceso, y marcarlo inactivo no se lo quita.')
print(u'  Y HAY UNA TERCERA: `usuarios.asesor_nombre`. El candado de lib/dueno.ts')
print(u'  falla CERRADO, asi que un rol `asesor` con esa columna vacia ENTRA al')
print(u'  tablero y recibe 403 en sus propios datos — se ve «dentro» en las dos')
print(u'  puertas y no puede trabajar. Se comprueba arriba, en `cartera=`.')

for n in sin_cartera:
    fallos.append(u'%s: rol asesor con `usuarios.asesor_nombre` VACIA — entra y recibe 403' % n)

if fallos:
    print()
    print(u'  *** %d DIFERENCIA(S) con lo esperado:' % len(fallos))
    for f in fallos:
        print(u'      - %s' % f)
    raise SystemExit(1)
