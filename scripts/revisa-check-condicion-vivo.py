# -*- coding: utf-8 -*-
u"""¿Admite el CHECK de `alertas_episodios` TODAS las condiciones que el
   codigo emite hoy?

   Ya paso una vez, el 7 oct 2026: el CHECK no admitia `escrito`, y durante un
   dia entero cuatro alertas nuevas se vieron en pantalla y no envejecieron
   nunca, mientras el diagnostico publicaba «nuevos: 4» en cada corrida. La
   escritura se rechazaba en silencio.

   El 12 oct, probando el boton «Actualizar», volvio a saltar. Este guion lo
   comprueba SIN adivinar: intenta insertar una fila de prueba con cada
   condicion del tipo `Condicion` y mira cual rechaza la base. Despues la
   borra. Es la unica forma de leer un CHECK desde PostgREST.

   SUSTITUYE A `verifica-check-condicion.py`, que hacia lo mismo con la MISMA
   tecnica pero clavado a UNA condicion —`escrito`, la del incidente del 7
   oct—. Ese guion habria pasado en verde el 12 oct mientras `mesa` e
   `importe` se rechazaban, porque no las miraba: estaba escrito contra el
   caso reportado y no contra la clase de bug. Las condiciones de aqui se LEEN
   de `lib/alertas.ts`, asi que la numero once se comprueba sola el dia que
   alguien la añada.

   Credenciales de `.env.local`, y NO se imprimen.
"""
import io
import os
import re
import sys
import json
import urllib.request
import urllib.error

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not KEY:
    print(u'  *** faltan credenciales'); sys.exit(2)

CAB = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
       'Content-Type': 'application/json', 'Prefer': 'return=representation'}

# Las condiciones que el TIPO declara, leidas del codigo para no teclearlas.
src = io.open(os.path.join(RAIZ, 'lib', 'alertas.ts'), encoding='utf-8').read()
m = re.search(r'export type Condicion\s*=([\s\S]*?)\n\n', src)
if not m:
    print(u'  *** no encuentro `export type Condicion` en lib/alertas.ts'); sys.exit(2)
CONDICIONES = sorted(set(re.findall(r"'([a-z_]+)'", m.group(1))))
print(u'\n  el codigo declara %d condiciones: %s'
      % (len(CONDICIONES), u', '.join(CONDICIONES)))

# Y las que de verdad EMITE el mapa CONDICION.
m2 = re.search(r'export const CONDICION[\s\S]*?\n\}', src)
EMITIDAS = sorted(set(re.findall(r":\s*'([a-z_]+)'", m2.group(0)))) if m2 else []
print(u'  el mapa CONDICION emite %d: %s' % (len(EMITIDAS), u', '.join(EMITIDAS)))

CUENTA_PRUEBA = None
r = urllib.request.Request(URL + '/rest/v1/cuentas?select=id&limit=1',
                           headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
try:
    CUENTA_PRUEBA = json.loads(urllib.request.urlopen(r, timeout=30).read())[0]['id']
except Exception as e:
    print(u'  *** no pude leer una cuenta de prueba: %s' % e); sys.exit(2)

print(u'\n  %-14s %s' % (u'condicion', u'¿la admite el CHECK?'))
print(u'  ' + u'─' * 58)
rechazadas = []
for c in CONDICIONES:
    fila = {
        'condicion': c, 'tipo': 'PRUEBA_CHECK', 'tipo_apertura': 'PRUEBA_CHECK',
        'familia': 'ceguera', 'dueno': 'sac', 'cuenta_id': CUENTA_PRUEBA,
        'empresa': 'PRUEBA_CHECK', 'estado': 'cerrada',
        'abierto_en': '2000-01-01', 'confirmada_el': '2000-01-01',
        'severidad_apertura': 'media', 'severidad_actual': 'media',
        'severidad_peor': 'media',
    }
    req = urllib.request.Request(URL + '/rest/v1/alertas_episodios',
                                 data=json.dumps([fila]).encode('utf-8'),
                                 headers=CAB, method='POST')
    try:
        creada = json.loads(urllib.request.urlopen(req, timeout=30).read())
        print(u'  %-14s ok' % c)
        # borrar la fila de prueba
        for f in creada:
            d = urllib.request.Request(
                URL + '/rest/v1/alertas_episodios?id=eq.' + f['id'],
                headers=CAB, method='DELETE')
            urllib.request.urlopen(d, timeout=30).read()
    except urllib.error.HTTPError as e:
        cuerpo = e.read().decode('utf-8', 'replace')
        if 'condicion_check' in cuerpo:
            print(u'  %-14s *** EL CHECK LA RECHAZA' % c)
            rechazadas.append(c)
        else:
            # Otro CHECK (familia, dueno…) no es lo que se mide aqui.
            print(u'  %-14s ok (rechaza por otra cosa, no por la condicion)' % c)

print(u'')
if rechazadas:
    emitidas_rechazadas = [c for c in rechazadas if c in EMITIDAS]
    print(u'  *** EL CHECK RECHAZA %d: %s' % (len(rechazadas), u', '.join(rechazadas)))
    if emitidas_rechazadas:
        print(u'  *** y %d de ellas LAS EMITE EL DETECTOR HOY: %s'
              % (len(emitidas_rechazadas), u', '.join(emitidas_rechazadas)))
        print(u'      Esas alertas se ven en pantalla y NO abren episodio:')
        print(u'      no envejecen, no acumulan recurrencia y el bloque de')
        print(u'      movimiento no las puede contar.')
        print(u'      Arreglo: correr la migracion que amplia el CHECK.')
    sys.exit(1)
print(u'  el CHECK admite todas las condiciones del codigo.')
