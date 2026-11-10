# -*- coding: utf-8 -*-
u"""QUE CONTESTA PostgREST, EN CRUDO, cuando se le pide un esquema inexistente.

   Existe porque al parsear ese mensaje me sali0 una lista SIN `public`, y eso
   no podia ser: la app lee `cuentas` por PostgREST todos los dias. Antes de
   creerle a mi propio parser, se mira el texto tal cual viene.

   Solo lee. Las credenciales se leen aqui dentro y NUNCA se imprimen.

   USO
       python -I scripts/sonda-esquemas-expuestos.py
"""
import io
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    for ln in io.open(p, encoding='utf-8'):
        ln = ln.strip()
        if ln.startswith(clave + '='):
            return ln.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = (env('NEXT_PUBLIC_SUPABASE_URL') or '').rstrip('/')
SERVICE = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not SERVICE:
    print(u'  *** faltan credenciales en .env.local')
    sys.exit(2)


def pide(ruta, cabeceras=None):
    cab = {'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE}
    if cabeceras:
        cab.update(cabeceras)
    req = urllib.request.Request(URL + ruta, headers=cab, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')
    except Exception as e:                                       # noqa: BLE001
        return 0, str(e)


print(u'\n  1 · raiz con un esquema que NO existe')
st, cuerpo = pide('/rest/v1/', {'Accept-Profile': '__no_existe__'})
print(u'     HTTP %s' % st)
print(u'     %s' % cuerpo[:600])

print(u'\n  2 · una tabla de `public` SIN cabecera de esquema (control positivo)')
st, cuerpo = pide('/rest/v1/cuentas?select=id&limit=1')
print(u'     HTTP %s · %s' % (st, cuerpo[:200]))

print(u'\n  3 · la misma tabla CON Accept-Profile: public')
st, cuerpo = pide('/rest/v1/cuentas?select=id&limit=1', {'Accept-Profile': 'public'})
print(u'     HTTP %s · %s' % (st, cuerpo[:200]))

print(u'\n  4 · cuantos objetos lista la raiz por esquema')
for esq in ('public', 'prediccion', 'graphql_public'):
    st, cuerpo = pide('/rest/v1/', {'Accept-Profile': esq})
    n = cuerpo.count(u'"/') if st == 200 else -1
    print(u'     %-16s HTTP %s · ~%s rutas' % (esq, st, n if n >= 0 else u'—'))

# ── 5 · ¿PUEDE UN DESCONOCIDO VOLVERSE `authenticated`? ─────────────────────
#
# Importa por una linea concreta de scripts/migracion-prediccion-snapshot.sql:
#
#     GRANT SELECT ON ALL TABLES IN SCHEMA prediccion TO authenticated;
#
# `anon` no tiene permiso —por eso contesta 42501— pero `authenticated` lee los
# cuatro objetos, `v_cuentas_vivas` incluida, que lleva nombre, correo, telefono
# y `observaciones_kam` de cada cuenta viva. Si el alta de Supabase Auth esta
# abierta, cualquiera con la llave publicable del bundle se da de alta y pasa a
# ser `authenticated`. Si esta cerrada, ese rol no se alcanza desde fuera.
#
# SE MIDE LEYENDO LA CONFIGURACION, QUE ES PUBLICA. No se da de alta nadie:
# crear una cuenta en el proyecto de produccion de otra persona no es una sonda,
# es un efecto.
print(u'\n  5 · alta de Supabase Auth (decide si `authenticated` se alcanza)')
st, cuerpo = pide('/auth/v1/settings')
print(u'     HTTP %s' % st)
print(u'     %s' % cuerpo[:500])
print()
