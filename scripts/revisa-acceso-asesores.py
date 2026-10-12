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

ASESORES = [
    (u'Fátima',  'fatima@callpicker.com'),
    (u'Claudia', 'claudia@callpicker.com'),
    (u'Dan',     'dominguez.dan@callpicker.com'),
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
for nombre, correo in ASESORES:
    tiene = correo.lower() in activos
    print(u'      %-9s %-30s %s' % (nombre, correo,
          u'*** AUTORIZADO' if tiene else u'bloqueado (linea comentada)'))

# ── LA ESCOTILLA ───────────────────────────────────────────────────────────
local = env('EMAILS_AUTORIZADOS')
print(u'\n  LA ESCOTILLA · variable EMAILS_AUTORIZADOS')
if local:
    print(u'      *** DEFINIDA en .env.local: SUSTITUYE a la lista de arriba.')
    for nombre, correo in ASESORES:
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
us = trae('usuarios', 'email,nombre,rol,activo,asesor_nombre')
if us is None:
    print(u'      no se pudo leer')
else:
    porCorreo = {str(u.get('email', '')).lower(): u for u in us}
    for nombre, correo in ASESORES:
        u2 = porCorreo.get(correo.lower())
        if not u2:
            print(u'      %-9s sin fila en `usuarios`' % nombre)
        else:
            print(u'      %-9s rol=%-8s activo=%-5s nombre=%s'
                  % (nombre, u2.get('rol'), u2.get('activo'), u2.get('nombre')))
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
    for nombre, correo in ASESORES:
        suyos = [x for x in uso if str(x.get('email', '')).lower() == correo.lower()]
        if not suyos:
            print(u'      %-9s SIN NINGUN registro' % nombre)
        else:
            fechas = sorted(str(x.get('created_at', ''))[:10] for x in suyos)
            print(u'      %-9s %4d registro(s) · del %s al %s'
                  % (nombre, len(suyos), fechas[0], fechas[-1]))

print(u'\n  ── LECTURA ───────────────────────────────────────────────────')
bloqueados = [n for n, c in ASESORES if c.lower() not in activos]
if len(bloqueados) == 3 and not local:
    print(u'  Los tres estan BLOQUEADOS en la puerta que de verdad muerde.')
    print(u'  Que no tengan registro de acceso HOY es lo esperado.')
    print(u'  Para devolverselo: descomentar sus tres lineas en lib/auth.ts y')
    print(u'  desplegar. Marcarlos activos en Gestion de Usuarios NO basta.')
else:
    print(u'  *** El bloqueo NO esta completo. Revisa lo marcado arriba.')
