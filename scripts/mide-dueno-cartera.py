# -*- coding: utf-8 -*-
"""Mide si el nombre de asesor de la SESION casa con el dueno de la CUENTA.

   POR QUE EXISTE
   --------------
   El 15 oct 2026 se cierran las rutas que no comprobaban de quien son los
   datos. El candado es fail-closed: un rol `asesor` cuyo nombre no case con
   `cuentas.asesor` no ve NADA.

   Eso convierte una diferencia de un acento en una expulsion silenciosa. La
   sesion trae `usuarios.asesor_nombre` (lo elige un <select> en Gestion de
   Usuarios); la cuenta trae `cuentas.asesor` (lo escribe la carga semanal).
   Son DOS columnas distintas que nadie ha obligado nunca a coincidir.

   Asi que antes de poner el candado hay que medir las dos y, sobre todo,
   probar AL REVES: que quien si debe entrar siga entrando.

   QUE IMPRIME
   -----------
     1. Los valores distintos de `cuentas.asesor`, con cuantas cuentas cada uno.
     2. Los usuarios con rol `asesor` y su `asesor_nombre`.
     3. El VEREDICTO por usuario: cuantas cuentas vera con el candado puesto.
        Un 0 aqui es una expulsion, no un acierto.
     4. Las cuentas que quedarian HUERFANAS: su `asesor` no corresponde a
        ningun usuario, asi que ningun asesor las vera (las sigue viendo
        admin, que es lo correcto, pero conviene saberlo).

   Sale con codigo 1 si algun usuario con rol asesor se queda en cero: eso
   significa que el candado lo expulsa de su propia cartera.

   USO
   ---
       python scripts/mide-dueno-cartera.py
"""
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request
from collections import Counter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(s):
    """La MISMA normalizacion que lib/dueno.ts. Si las dos se separan, el
       script deja de medir lo que el codigo hace."""
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or ''))
                if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]', '', s)


E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY']}


def trae(tabla, select, extra=''):
    url = (E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/' + tabla
           + '?select=' + select + extra)
    return json.load(urllib.request.urlopen(
        urllib.request.Request(url, headers=H), timeout=60))


CUENTAS  = trae('cuentas',  'empresa,asesor,estado', '&limit=5000')
USUARIOS = trae('usuarios', 'email,nombre,rol,asesor_nombre,activo', '&limit=500')

print('=' * 72)
print('1. VALORES DE `cuentas.asesor` (el dueno del dato)')
print('=' * 72)
duenos = Counter()
for c in CUENTAS:
    duenos[c.get('asesor') or '<NULL>'] += 1
for nombre, n in duenos.most_common():
    print('  %-28s %4d cuentas   norm=%s' % (nombre, n, norm(nombre)))
print('  TOTAL: %d cuentas' % len(CUENTAS))

print()
print('=' * 72)
print('2. USUARIOS CON ROL `asesor` (lo que trae la sesion)')
print('=' * 72)
asesores = [u for u in USUARIOS if (u.get('rol') or '') == 'asesor']
if not asesores:
    print('  NINGUNO. Hoy no hay usuarios con rol asesor en la tabla.')
for u in asesores:
    print('  %-32s asesor_nombre=%-12s activo=%s  norm=%s'
          % (u['email'], u.get('asesor_nombre') or '<NULL>',
             u.get('activo'), norm(u.get('asesor_nombre'))))

print()
print('=' * 72)
print('3. VEREDICTO — cuantas cuentas vera cada uno CON EL CANDADO PUESTO')
print('=' * 72)
print('   (un 0 es una expulsion de su propia cartera, no un acierto)')
fallo = False
for u in asesores:
    suyo = norm(u.get('asesor_nombre'))
    if not suyo:
        print('  %-32s SIN NOMBRE -> 403 por diseno (fail-closed, correcto)'
              % u['email'])
        continue
    n = sum(1 for c in CUENTAS if norm(c.get('asesor')) == suyo)
    marca = 'OK' if n else '*** EXPULSADO ***'
    print('  %-32s %4d cuentas   %s' % (u['email'], n, marca))
    if not n:
        fallo = True

print()
print('=' * 72)
print('4. CUENTAS HUERFANAS — su `asesor` no es de ningun usuario asesor')
print('=' * 72)
conocidos = {norm(u.get('asesor_nombre')) for u in asesores
             if norm(u.get('asesor_nombre'))}
huerfanas = Counter()
for c in CUENTAS:
    if norm(c.get('asesor')) not in conocidos:
        huerfanas[c.get('asesor') or '<NULL>'] += 1
if not huerfanas:
    print('  Ninguna: toda cuenta tiene un asesor que es usuario.')
for nombre, n in huerfanas.most_common():
    print('  %-28s %4d cuentas  (solo admin/viewer las vera)' % (nombre, n))

print()
if fallo:
    print('VEREDICTO: FALLA. Hay un rol asesor que el candado deja en cero.')
    sys.exit(1)
print('VEREDICTO: el candado no expulsa a nadie de su propia cartera.')
