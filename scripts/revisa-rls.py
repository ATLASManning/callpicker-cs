# -*- coding: utf-8 -*-
u"""¿QUE TABLAS PUEDE LEER CUALQUIERA CON LA LLAVE PUBLICA?

   Supabase avisó el 17 oct 2026: «Table publicly accessible — anyone with your
   project URL can read, edit and delete all data in this table because
   Row-Level Security is not enabled».

   La llave publicable viaja en el bundle del navegador: es PUBLICA por
   definicion, cualquiera que abra el tablero la tiene. Si una tabla no lleva
   RLS, esa llave la lee entera — nombres de cliente, importes, contactos.

   ESTO NO SE DEDUCE, SE MIDE. El aviso no dice QUE tabla.

   ── EL CRITERIO, Y POR QUE NO ES EL CODIGO HTTP ────────────────────────────
   Una tabla CON RLS y sin politicas no contesta 401: contesta **200 con una
   lista vacia**. Clasificar por el status da «abierta» a todas, que es la
   misma trampa del middleware que sirve el login con 200.
   Se juzga comparando FILAS: lo que ve la llave secreta contra lo que ve la
   publica. Si las dos ven lo mismo, la tabla esta abierta. Si la publica ve
   cero y la secreta ve miles, esta protegida.
   [[feedback-probar-al-reves]] [[feedback-verificar-antes-asegurar]]

   SOLO LEE. No escribe ni borra: para demostrar que una puerta esta abierta
   basta con abrirla, no hace falta entrar a tirar muebles.

   Las credenciales se leen aqui dentro y NUNCA se imprimen.

   USO
       python scripts/revisa-rls.py
       python scripts/revisa-rls.py --sql     # escribe el SQL del arreglo
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
ANON = env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
SERVICE = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not ANON or not SERVICE:
    print(u'  *** faltan credenciales en .env.local. Sin las DOS llaves no hay')
    print(u'      comparacion posible, y sin comparacion no hay veredicto.')
    sys.exit(2)


def pide(ruta, llave, cabeceras=None):
    cab = {'apikey': llave, 'Authorization': 'Bearer ' + llave}
    if cabeceras:
        cab.update(cabeceras)
    req = urllib.request.Request(URL + ruta, headers=cab, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.read().decode('utf-8'), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace'), dict(e.headers or {})
    except Exception as e:                                   # noqa: BLE001
        return 0, str(e), {}


def cuantas(tabla, llave):
    """Cuantas filas ve ESTA llave. `None` si la peticion no contesta datos."""
    st, cuerpo, cab = pide('/rest/v1/%s?select=*' % tabla, llave,
                           {'Prefer': 'count=exact', 'Range': '0-0'})
    if st not in (200, 206):
        return None
    rango = cab.get('Content-Range', '')
    total = rango.split('/')[-1] if '/' in rango else ''
    if total.isdigit():
        return int(total)
    try:
        return len(json.loads(cuerpo))
    except ValueError:
        return None


def tablas_publicadas():
    """La raiz de PostgREST lista el esquema. Pide llave SECRETA."""
    st, cuerpo, _ = pide('/rest/v1/', SERVICE)
    if st != 200:
        return None, st
    try:
        doc = json.loads(cuerpo)
    except ValueError:
        return None, st
    out = [p.lstrip('/') for p in (doc.get('paths') or {})
           if p.startswith('/') and len(p) > 1 and not p.startswith('/rpc/')]
    return sorted(set(out)), st


print(u'\n  RLS — ¿QUE LEE LA LLAVE PUBLICA?')
print(u'  ' + u'=' * 72)
print(u'  proyecto: %s' % URL.replace('https://', '').split('.')[0])

tablas, st = tablas_publicadas()
if tablas is None:
    print(u'  *** no pude listar el esquema (HTTP %s). Sin la lista no se puede' % st)
    print(u'      concluir NADA — y «no pude mirar» NO es «no hay nada expuesto».')
    sys.exit(2)
print(u'  PostgREST publica %d objeto(s) del esquema `public`\n' % len(tablas))

abiertas, protegidas, vacias, raras = [], [], [], []
for t in tablas:
    con_secreta = cuantas(t, SERVICE)
    con_publica = cuantas(t, ANON)
    if con_secreta is None:
        raras.append((t, u'la llave secreta tampoco la lee'))
    elif con_publica is None:
        protegidas.append((t, con_secreta, u'rechaza'))
    elif con_secreta == 0:
        # Una tabla vacia no prueba nada en ningun sentido: se dice aparte.
        vacias.append(t)
    elif con_publica > 0:
        abiertas.append((t, con_secreta, con_publica))
    else:
        protegidas.append((t, con_secreta, u'0 filas'))

print(u'  %-30s %9s %9s   %s' % (u'TABLA', u'SECRETA', u'PUBLICA', u'VEREDICTO'))
print(u'  ' + u'-' * 72)
for t, s, p in sorted(abiertas, key=lambda x: -x[1]):
    print(u'  %-30s %9s %9s   *** ABIERTA' % (t[:30], u'{:,}'.format(s), u'{:,}'.format(p)))
for t, s, como in sorted(protegidas, key=lambda x: -(x[1] or 0)):
    print(u'  %-30s %9s %9s   protegida' % (t[:30], u'{:,}'.format(s), como))
for t in vacias:
    print(u'  %-30s %9s %9s   vacia — no concluye' % (t[:30], 0, 0))
for t, por in raras:
    print(u'  %-30s %9s %9s   %s' % (t[:30], u'?', u'?', por))

print()
print(u'  ' + u'=' * 72)
if abiertas:
    filas = sum(p for _, _, p in abiertas)
    print(u'  *** %d TABLA(S) ABIERTAS · %s fila(s) que lee cualquiera que abra'
          % (len(abiertas), u'{:,}'.format(filas)))
    print(u'      el tablero: la llave publicable viaja en el bundle.')
else:
    print(u'  Ninguna tabla con datos contesta filas a la llave publica.')
print(u'  %d protegida(s) · %d vacia(s) · %d sin clasificar'
      % (len(protegidas), len(vacias), len(raras)))
if vacias:
    print(u'  OJO: las vacias NO estan comprobadas. Una tabla sin filas contesta')
    print(u'       lo mismo con RLS y sin el; se revisan en el panel.')

if '--sql' in sys.argv and abiertas:
    destino = os.path.join(RAIZ, 'scripts', 'migracion-rls.sql')
    with io.open(destino, 'w', encoding='utf-8', newline='\n') as f:
        f.write(u'-- RLS para las tablas que hoy lee la llave publica.\n')
        f.write(u'-- Generado por scripts/revisa-rls.py contra el proyecto real.\n--\n')
        f.write(u'-- POR QUE ESTO NO ROMPE EL TABLERO: la app consulta SIEMPRE con\n')
        f.write(u'-- `supabaseAdmin`, o sea la llave secreta, y esa IGNORA RLS por\n')
        f.write(u'-- diseno. Comprobado en el codigo: NADIE importa el cliente anonimo\n')
        f.write(u'-- para consultar — cero usos de `supabase.from(` en todo el repo.\n--\n')
        f.write(u'-- Al activar RLS SIN politicas, la llave publica deja de leer. Es lo\n')
        f.write(u'-- que se quiere: hoy no la usa nadie. Si manana una pantalla tuviera\n')
        f.write(u'-- que leer desde el navegador, se le escribe su politica entonces.\n\n')
        f.write(u'-- 1 · LAS COMPROBADAS: la llave publica lee hoy las mismas filas\n')
        f.write(u'--     que la secreta. Medido, no supuesto.\n')
        for t, s, _ in sorted(abiertas):
            f.write(u'ALTER TABLE public."%s" ENABLE ROW LEVEL SECURITY;  -- %s filas\n'
                    % (t, u'{:,}'.format(s)))
        if vacias:
            f.write(u'\n-- 2 · LAS QUE NO SE PUEDEN COMPROBAR DESDE FUERA: estan VACIAS, y una\n')
            f.write(u'--     tabla sin filas contesta igual con RLS y sin el. No se sabe si\n')
            f.write(u'--     estan abiertas; se cierran ANTES de que tengan dato, que es\n')
            f.write(u'--     cuando sale gratis. Si ya lo tenian, esto no cambia nada.\n')
            for t in sorted(vacias):
                f.write(u'ALTER TABLE public."%s" ENABLE ROW LEVEL SECURITY;  -- vacia\n' % t)
        f.write(u'\n-- COMPROBAR DESPUES, en el mismo editor:\n')
        f.write(u'SELECT tablename, rowsecurity\n  FROM pg_tables\n'
                u" WHERE schemaname = 'public'\n ORDER BY rowsecurity, tablename;\n")
        f.write(u'\n-- Y DESDE FUERA, que es lo que de verdad cierra el asunto:\n')
        f.write(u'--   python scripts/revisa-rls.py\n')
    print(u'\n  SQL escrito en scripts/migracion-rls.sql (%d tabla(s))' % len(abiertas))
