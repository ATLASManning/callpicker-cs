# -*- coding: utf-8 -*-
"""Comprueba que las columnas nuevas del select de ALERTAS existen de verdad.

   `alertas-estado.ts` amplio su select para alimentar la candidatura. En
   PostgREST un nombre de columna inventado NO devuelve ese campo vacio:
   revienta el select COMPLETO con un 400, y la pantalla entera se cae. Una ya
   me pico —`dias_sin_contacto` parece columna y la calcula `getCuentas` en
   codigo—, asi que las demas se comprueban contra la base en vez de suponerse.

   Pide cada columna POR SEPARADO: pedirlas juntas solo diria que alguna falla,
   no cual.

   USO
   ---
       python scripts/verifica-columnas-candidatura.py
"""
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Credenciales: se LEEN aqui y no se imprimen nunca.
env = {}
for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    linea = linea.strip()
    if '=' in linea and not linea.startswith('#'):
        k, v = linea.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
SB, KEY = env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']

NUEVAS = ['activo_desde', 'num_oficinas', 'health_score',
          'contacto_nombre', 'contacto_tel', 'contacto_email']
# El testigo: esta NO existe y debe fallar. Sin el, una prueba que todo lo
# aprueba no distingue «la columna existe» de «mi comprobacion no comprueba».
TESTIGO = 'dias_sin_contacto'


def pide(col):
    r = urllib.request.Request('%s/rest/v1/cuentas?select=%s&limit=1' % (SB, col))
    r.add_header('apikey', KEY)
    r.add_header('Authorization', 'Bearer ' + KEY)
    try:
        with urllib.request.urlopen(r, timeout=60) as x:
            return x.status, json.loads(x.read().decode() or '[]')
    except urllib.error.HTTPError as e:
        return e.code, e.read()[:160].decode('utf-8', 'replace')


fallas = []
for col in NUEVAS:
    est, cuerpo = pide(col)
    ok = est == 200
    if not ok:
        fallas.append(col)
    print('  %-20s %s  %s' % (col, 'existe  ' if ok else '** NO EXISTE',
                              '' if ok else str(cuerpo)[:100]))

est, cuerpo = pide(TESTIGO)
print('\n  %-20s %s' % (TESTIGO + ' (testigo)',
      'falla, como debe' if est != 200 else '*** RESPONDIO 200: entonces SI es columna'))
if est == 200:
    fallas.append(TESTIGO + ': es columna y la saque del select por nada')

print('\n  %s' % ('las seis columnas estan en la tabla' if not fallas
                  else '*** REVISAR: ' + ', '.join(fallas)))
sys.exit(1 if fallas else 0)
