# -*- coding: utf-8 -*-
u"""Comprueba POR COMPORTAMIENTO que la bitacora de SLA no se deja modificar.

   USO
   ---
       python scripts/prueba-inmutabilidad-bitacora.py

   QUE PRUEBA
   ----------
   El criterio 10 del encargo: «La bitacora registra cada cambio y no permite
   update/delete». Eso lo sostiene el disparador `trg_sla_bitacora_inmutable`,
   y PostgREST no sirve el catalogo de Postgres, asi que el disparador no se
   puede VER desde fuera. Lo que si se puede es INTENTAR el UPDATE y el DELETE
   con la llave de servicio —que salta el RLS pero NO los disparadores— y
   comprobar que los dos rebotan.

   EL CONTROL POSITIVO ES LA MITAD DE LA PRUEBA
   --------------------------------------------
   Un UPDATE que no toca NINGUNA fila no dispara nada y devuelve 204 tan
   contento. Leido de prisa, «no fallo» parece «se permitio» y «0 filas»
   parece «se rechazo»: las dos lecturas son falsas. Por eso esta sonda:

     1. Primero CUENTA las filas. Si la bitacora esta vacia, NO prueba nada
        y lo dice —no se pone verde por ausencia de datos.
     2. Apunta a un `id` REAL, leido antes. Asi el disparador tiene algo que
        morder.
     3. Control positivo: la misma llave SI puede LEER esa fila. Sin esto, una
        base caida o una llave mala daria «no pude escribir» y se leeria como
        candado. [[feedback-probar-al-reves]]

   NO ESCRIBE NADA
   ---------------
   No inserta filas de prueba. Meter un renglon inventado en un registro
   append-only para probar que es append-only lo deja sucio para siempre, y
   la bitacora es justo lo que alguien va a leer el dia que haya que
   responder por una alerta.
"""
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(p):
        return None
    for ln in io.open(p, encoding='utf-8'):
        ln = ln.strip()
        if ln.startswith(clave + '='):
            return ln.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = (env('NEXT_PUBLIC_SUPABASE_URL') or '').rstrip('/')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not KEY:
    print(u'  *** faltan credenciales en .env.local. No se midio nada, y eso')
    print(u'      NO es un aprobado. ***')
    sys.exit(2)

OK = (200, 204, 206)


def llama(metodo, ruta, cuerpo=None, prefer=None):
    req = urllib.request.Request(URL + '/rest/v1/' + ruta, method=metodo)
    req.add_header('apikey', KEY)
    req.add_header('Authorization', 'Bearer ' + KEY)
    if prefer:
        req.add_header('Prefer', prefer)
    datos = None
    if cuerpo is not None:
        datos = json.dumps(cuerpo).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, datos, timeout=30) as r:
            texto = r.read().decode('utf-8')
            rango = r.headers.get('Content-Range') or ''
            total = None
            if '/' in rango and rango.split('/')[-1].isdigit():
                total = int(rango.split('/')[-1])
            try:
                return r.status, json.loads(texto) if texto else None, total
            except ValueError:
                return r.status, texto, total
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')[:300], None
    except Exception as e:
        return 0, str(e)[:200], None


fallan = 0
print('')
print(u'  LA BITACORA DE SLA — CRITERIO 10 DEL ENCARGO')
print(u'  ' + '-' * 68)

cod, filas, total = llama('GET', 'alertas_sla_bitacora?select=id,evento&limit=1',
                          prefer='count=exact')
if cod not in OK:
    print(u'    *** no se puede leer la tabla (HTTP %s). Sin lectura no hay' % cod)
    print(u'        prueba: %s ***' % str(filas)[:160])
    sys.exit(1)

print(u'    filas en la bitacora        %s' % total)
if not total:
    print('')
    print(u'    *** LA BITACORA ESTA VACIA. Un UPDATE contra cero filas no')
    print(u'        dispara nada y vuelve «sin error»: eso se leeria como')
    print(u'        «se permitio». Esta sonda NO prueba nada hoy y no se pone')
    print(u'        verde. Vuelve a correrla cuando haya un cierre, una')
    print(u'        reprogramacion o un aviso registrado. ***')
    print('')
    sys.exit(3)

fila = filas[0]
ident = fila['id']
print(u'    fila elegida                %s  (evento: %s)' % (ident, fila.get('evento')))
print(u'    CONTROL POSITIVO            la llave de servicio SI lee esa fila,')
print(u'                                asi que el disparador tiene que morder.')
print('')

# ── UPDATE: tiene que rebotar ─────────────────────────────────────────────
cod, cuerpo, _ = llama('PATCH', 'alertas_sla_bitacora?id=eq.%s' % ident,
                       {'evento': 'PRUEBA_QUE_NO_DEBE_ENTRAR'},
                       prefer='return=representation')
if cod in OK:
    fallan += 1
    print(u'    UPDATE   *** SE PERMITIO *** HTTP %s — la bitacora NO es' % cod)
    print(u'             inmutable: %s' % str(cuerpo)[:140])
else:
    print(u'    UPDATE   rechazado HTTP %s   ok' % cod)
    print(u'             %s' % str(cuerpo)[:150])

# ── DELETE: tiene que rebotar ─────────────────────────────────────────────
cod, cuerpo, _ = llama('DELETE', 'alertas_sla_bitacora?id=eq.%s' % ident,
                       prefer='return=representation')
if cod in OK:
    fallan += 1
    print(u'    DELETE   *** SE PERMITIO *** HTTP %s — se borro un renglon del' % cod)
    print(u'             registro: %s' % str(cuerpo)[:140])
else:
    print(u'    DELETE   rechazado HTTP %s   ok' % cod)
    print(u'             %s' % str(cuerpo)[:150])

# ── Y la fila sigue ahi, con su valor de antes ────────────────────────────
cod, despues, total2 = llama(
    'GET', 'alertas_sla_bitacora?select=id,evento&id=eq.%s' % ident,
    prefer='count=exact')
if cod in OK and despues and despues[0].get('evento') == fila.get('evento'):
    print('')
    print(u'    DESPUES  la fila sigue ahi y su `evento` no cambio   ok')
else:
    fallan += 1
    print('')
    print(u'    *** DESPUES: la fila cambio o desaparecio. %s ***' % str(despues)[:140])

print('')
print(u'  ' + '=' * 68)
if fallan:
    print(u'  *** %d en rojo: la bitacora SE DEJA modificar. ***' % fallan)
else:
    print(u'  La bitacora rechaza UPDATE y DELETE con la llave mas poderosa que')
    print(u'  hay en el proyecto. Criterio 10 comprobado por comportamiento.')
print('')
sys.exit(1 if fallan else 0)
