# -*- coding: utf-8 -*-
"""¿Admite la tabla `alertas_episodios` la condicion `escrito`?

   El archivo de migracion del repo declara SIETE condiciones y no incluye
   `escrito`, que es la de la capa cualitativa. Pero el archivo es lo que se
   corrio UNA VEZ: la base pudo alterarse despues y el repo no lo refleja. Lo
   que manda es la base.

   Y no se pregunta leyendo el esquema —no hay forma por PostgREST— sino
   INTENTANDO la escritura y mirando si la rechaza. Es la version de base de
   datos de «probar la validacion al reves»: si el CHECK no admite el valor,
   la insercion falla con 23514 y eso es la respuesta.

   La prueba se hace sobre una fila de mentira que se BORRA al terminar, en
   una cuenta real elegida al azar porque hay clave foranea. No toca ninguna
   fila existente.

   USO
   ---
       python scripts/verifica-check-condicion.py
"""
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

env = {}
for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    linea = linea.strip()
    if '=' in linea and not linea.startswith('#'):
        k, v = linea.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
SB, KEY = env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']

MARCA = 'ZZ-PRUEBA-CHECK-CONDICION'


def sb(metodo, ruta, cuerpo=None, extra=None):
    r = urllib.request.Request(SB + ruta, method=metodo)
    r.add_header('apikey', KEY)
    r.add_header('Authorization', 'Bearer ' + KEY)
    r.add_header('Content-Type', 'application/json')
    for k, v in (extra or {}).items():
        r.add_header(k, v)
    if cuerpo is not None:
        r.data = json.dumps(cuerpo).encode()
    try:
        with urllib.request.urlopen(r, timeout=60) as x:
            return x.status, x.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')


est, cuerpo = sb('GET', '/rest/v1/cuentas?select=id&limit=1')
assert est == 200 and json.loads(cuerpo), 'no pude leer una cuenta de referencia'
cuenta_id = json.loads(cuerpo)[0]['id']

# Lo que ya hay en la tabla, que prueba por si solo que el valor se usa.
est, cuerpo = sb('GET', '/rest/v1/alertas_episodios?select=id&condicion=eq.escrito&limit=1',
                 extra={'Prefer': 'count=exact'})
print('  filas existentes con condicion=escrito: %s'
      % ('al menos 1' if est == 200 and json.loads(cuerpo) else 'ninguna'))

fila = {
    # `tipo_apertura` es NOT NULL y no estaba en la primera version de esta
    # prueba: la insercion fallaba con 23502 y yo estuve a punto de publicar
    # que la base rechazaba `escrito`. Una prueba incompleta acusa igual de
    # fuerte que un defecto real. Ver [[feedback-verificar-antes-asegurar]].
    'cuenta_id': cuenta_id, 'tipo': 'riesgo_escrito',
    'tipo_apertura': 'riesgo_escrito', 'condicion': 'escrito',
    'familia': 'riesgo', 'dueno': 'asesor', 'estado': 'abierta',
    'abierto_en': '2026-10-08', 'confirmada_el': '2026-10-08',
    'severidad_apertura': 'critica', 'severidad_actual': 'critica',
    'severidad_peor': 'critica', 'mrr_apertura': 0, 'mrr_actual': 0,
    'es_top_apertura': False, 'es_top_actual': False,
    'evidencia_apertura': MARCA, 'evidencia_actual': MARCA,
}
est, cuerpo = sb('POST', '/rest/v1/alertas_episodios', fila,
                 extra={'Prefer': 'return=representation'})

if est in (200, 201):
    print('  insercion con `escrito`               ACEPTADA -> el CHECK de la')
    print('                                        BASE si admite el valor; el')
    print('                                        archivo .sql del repo esta')
    print('                                        desactualizado, no la base.')
    ids = [f['id'] for f in json.loads(cuerpo)]
    for i in ids:
        b, _ = sb('DELETE', '/rest/v1/alertas_episodios?id=eq.%s' % i)
        print('  fila de prueba borrada                %s' % ('si' if b in (200, 204) else 'NO (%s)' % b))
    sys.exit(0)

try:
    err = json.loads(cuerpo)
except Exception:
    err = {'message': cuerpo[:300]}
codigo = err.get('code', '?')
print('  insercion con `escrito`               RECHAZADA (%s, code %s)' % (est, codigo))
print('  mensaje : %s' % str(err.get('message'))[:200])
print('  hint    : %s' % str(err.get('hint'))[:160])

# 23514 = violacion de CHECK. CUALQUIER otro codigo dice que la fila de prueba
# esta mal construida, no que la base rechace el valor. Confundirlos seria
# acusar a la base de un defecto que es de la prueba — y esa acusacion ya me
# la he tragado una vez hoy.
if codigo != '23514':
    print('\n  NO concluyente. El codigo %s no es una violacion de CHECK' % codigo)
    print('  (23514): es la fila de prueba la que esta incompleta o mal armada.')
    print('  Completar la fila y repetir. Hasta entonces no se puede afirmar')
    print('  nada sobre si la base admite `escrito`.')
    sys.exit(2)

print('\n  *** EL CHECK DE LA BASE NO ADMITE `escrito`. Los tres tipos de la')
print('      capa cualitativa no pueden abrir episodio: su alerta sale en')
print('      pantalla y NUNCA envejece, porque la escritura falla en silencio')
print('      (supabase-js devuelve {data,error}, no lanza). Hace falta un')
print('      ALTER del CHECK en Supabase.')
sys.exit(1)
