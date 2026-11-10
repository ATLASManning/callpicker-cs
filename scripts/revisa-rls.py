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


def cuantas(tabla, llave, esquema='public'):
    """Cuantas filas ve ESTA llave. `None` si la peticion no contesta datos."""
    st, cuerpo, cab = pide('/rest/v1/%s?select=*' % tabla, llave,
                           {'Prefer': 'count=exact', 'Range': '0-0',
                            'Accept-Profile': esquema})
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


def motivo_rechazo(tabla, llave, esquema='public'):
    """POR QUE dice que no. `42501` = permiso denegado: lo cierra el GRANT.

    Importa la diferencia. Esta sonda daba por «protegida» toda tabla que no
    contestara filas, y ahi caben DOS cosas que no son la misma:

      · 200 con lista vacia -> hay RLS (o no hay politicas). Cerrada de verdad.
      · 42501 / 401         -> `anon` no tiene GRANT sobre la tabla. La cierra
                               el permiso, y el RLS puede estar APAGADO: desde
                               fuera no hay forma de distinguirlo, porque un
                               INSERT tambien contesta 42501 en los dos casos.

    El 31 oct 2026 Supabase volvio a avisar de `rls_disabled_in_public` con
    las dos sondas en verde: las cuatro candidatas estaban en este segundo
    cajon y la sonda las llamaba «protegidas». Decir «no se puede comprobar
    desde fuera» es el veredicto honesto; «protegida» era una afirmacion que
    no se habia medido.
    """
    st, cuerpo, _ = pide('/rest/v1/%s?select=*' % tabla, llave,
                         {'Prefer': 'count=exact', 'Range': '0-0',
                          'Accept-Profile': esquema})
    try:
        codigo = (json.loads(cuerpo) or {}).get('code') or u''
    except (ValueError, AttributeError):
        codigo = u''
    return st, codigo


def esquemas_expuestos():
    u"""QUE ESQUEMAS publica PostgREST. No se asume `public`.

    EL PUNTO CIEGO QUE ESTO CIERRA (10 nov 2026). Durante tres rondas esta
    sonda pidio `/rest/v1/` SIN cabecera de esquema, o sea el de por defecto, y
    la consulta del catalogo filtraba `schemaname = 'public'`. Las dos miraban
    el mismo sitio. El 8 nov Supabase marco CUATRO objetos de `prediccion`
    —expuesto a mano el 7 oct para que la API lo viera— y ninguna de las dos
    podia haberlos visto NUNCA: no es que dijeran que estaban bien, es que no
    existian para ellas. Es el mismo error de octubre con otra ropa: un
    verificador que concluye sobre lo que no mira.
    [[feedback-verificar-antes-asegurar]] [[feedback-barrer-la-herramienta]]

    COMO SE DESCUBREN, sin adivinar: se pide un esquema que no existe y
    PostgREST contesta `PGRST106` enumerando los que si. La lista sale de la
    base, no de una constante tecleada aqui — que es justo lo que la dejaria
    desactualizada el dia que alguien exponga otro.
    """
    st, cuerpo, _ = pide('/rest/v1/', SERVICE,
                         {'Accept-Profile': '__no_existe_este_esquema__'})
    try:
        doc = json.loads(cuerpo) or {}
    except ValueError:
        doc = {}
    # SOLO el `hint`. La primera version concatenaba `message` + `hint` y partia
    # por el PRIMER ':', que es el de «Invalid schema: __no_existe__». El primer
    # nombre de la lista se quedaba pegado a esa frase, se descartaba por
    # contener espacios, y la sonda devolvia la lista SIN `public`: habria dado
    # luz verde sobre las 25 tablas del esquema principal sin mirar ninguna.
    pista = doc.get('hint') or u''
    out = []
    if 'exposed' in pista and ':' in pista:
        crudo = pista.split('exposed', 1)[1].split(':', 1)[-1]
        out = [s.strip().strip('.').strip('"').strip("'")
               for s in crudo.replace('\n', ' ').split(',')]
        out = [n for n in out if n and ' ' not in n]

    # CONTROL NEGATIVO del parser, no del servidor. `public` es el esquema por
    # defecto de PostgREST y se acaba de comprobar que responde sin cabecera; si
    # no sale en la lista parseada, lo que esta mal es ESTE codigo. Antes de
    # eso, una lista incompleta se veia exactamente igual que una correcta.
    if out:
        st_def, _, _ = pide('/rest/v1/', SERVICE)
        if st_def == 200 and 'public' not in out:
            return None, (u'el parser devolvio %s pero `public` responde: la lista '
                          u'esta incompleta y no se usa' % u', '.join(out))
        return out, None
    # Sin la lista NO se inventa una: se dice que no se pudo y se para.
    return None, u'HTTP %s · %s' % (st, (pista or doc.get('message') or u'')[:140])


def objetos_de(esquema):
    u"""Los objetos que PostgREST publica de UN esquema. Pide llave SECRETA."""
    st, cuerpo, _ = pide('/rest/v1/', SERVICE, {'Accept-Profile': esquema})
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

esquemas, falla = esquemas_expuestos()
if esquemas is None:
    print(u'  *** no pude averiguar que esquemas expone PostgREST (%s).' % falla)
    print(u'      Sin esa lista no se puede concluir NADA: mirar solo `public`')
    print(u'      es como se nos escapo `prediccion` tres rondas seguidas.')
    sys.exit(2)
# `graphql_public` no tiene tablas de datos: es el endpoint de GraphQL.
mirar = [e for e in esquemas if e != 'graphql_public']
print(u'  esquemas expuestos: %s' % u', '.join(esquemas))
print(u'  se revisan: %s\n' % u', '.join(mirar))

abiertas, protegidas, vacias, raras, sin_grant = [], [], [], [], []
total_objetos = 0
for esq in mirar:
    tablas, st = objetos_de(esq)
    if tablas is None:
        raras.append((u'%s.*' % esq, u'no pude listar el esquema (HTTP %s)' % st))
        continue
    total_objetos += len(tablas)
    for t in tablas:
        etq = u'%s.%s' % (esq, t)
        con_secreta = cuantas(t, SERVICE, esq)
        con_publica = cuantas(t, ANON, esq)
        if con_secreta is None:
            raras.append((etq, u'la llave secreta tampoco la lee'))
        elif con_publica is None:
            st_a, cod = motivo_rechazo(t, ANON, esq)
            if cod == '42501' or st_a in (401, 403):
                sin_grant.append((etq, con_secreta, st_a, cod))
            else:
                raras.append((etq, u'rechaza con HTTP %s / %s' % (st_a, cod or u'sin codigo')))
        elif con_secreta == 0:
            # Una tabla vacia no prueba nada en ningun sentido: se dice aparte.
            vacias.append(etq)
        elif con_publica > 0:
            abiertas.append((etq, con_secreta, con_publica))
        else:
            protegidas.append((etq, con_secreta, u'0 filas'))
print(u'  PostgREST publica %d objeto(s) en total\n' % total_objetos)

print(u'  %-38s %9s %9s   %s' % (u'OBJETO', u'SECRETA', u'PUBLICA', u'VEREDICTO'))
print(u'  ' + u'-' * 78)
for t, s, p in sorted(abiertas, key=lambda x: -x[1]):
    print(u'  %-38s %9s %9s   *** ABIERTO' % (t[:38], u'{:,}'.format(s), u'{:,}'.format(p)))
for t, s, como in sorted(protegidas, key=lambda x: -(x[1] or 0)):
    print(u'  %-38s %9s %9s   protegido' % (t[:38], u'{:,}'.format(s), como))
for t, s, st_a, cod in sorted(sin_grant, key=lambda x: -(x[1] or 0)):
    print(u'  %-38s %9s %9s   RLS NO COMPROBABLE — la cierra el GRANT'
          % (t[:38], u'{:,}'.format(s), cod or st_a))
for t in vacias:
    print(u'  %-38s %9s %9s   vacio — no concluye' % (t[:38], 0, 0))
for t, por in raras:
    print(u'  %-38s %9s %9s   %s' % (t[:38], u'?', u'?', por))

print()
print(u'  ' + u'=' * 72)
if abiertas:
    filas = sum(p for _, _, p in abiertas)
    print(u'  *** %d TABLA(S) ABIERTAS · %s fila(s) que lee cualquiera que abra'
          % (len(abiertas), u'{:,}'.format(filas)))
    print(u'      el tablero: la llave publicable viaja en el bundle.')
else:
    print(u'  Ninguna tabla con datos contesta filas a la llave publica.')
print(u'  %d protegida(s) · %d sin GRANT · %d vacia(s) · %d sin clasificar'
      % (len(protegidas), len(sin_grant), len(vacias), len(raras)))
if vacias:
    print(u'  OJO: las vacias NO estan comprobadas. Una tabla sin filas contesta')
    print(u'       lo mismo con RLS y sin el; se revisan en el panel.')
if sin_grant:
    print(u'  OJO: las %d «sin GRANT» TAMPOCO estan comprobadas, y son las que' % len(sin_grant))
    print(u'       el aviso de Supabase marca. Que `anon` no tenga permiso las')
    print(u'       cierra HOY; si alguien le concede SELECT y el RLS esta')
    print(u'       apagado, quedan abiertas de par en par. Se resuelven con el')
    print(u'       catalogo —`relrowsecurity` en pg_class—, no desde fuera:')
    print(u'         public      -> scripts/migracion-rls-2026-11-03.sql')
    print(u'         prediccion  -> scripts/migracion-rls-prediccion-2026-11-10.sql')
    print(u'       Y OJO con el rol `authenticated`: esta sonda usa la llave')
    print(u'       PUBLICABLE, que es `anon`. Un objeto con SELECT concedido a')
    print(u'       `authenticated` sale aqui como «la cierra el GRANT» y lo lee')
    print(u'       cualquiera que pueda darse de alta. Eso lo dice 1.c del SQL')
    print(u'       de arriba, y si el alta esta abierta, /auth/v1/settings.')

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
        f.write(u'\n-- ACTIVAR RLS PUEDE NO BASTAR, y pasó aquí el 21 oct 2026:\n')
        f.write(u'-- una politica permisiva de antes se queda escrita aunque RLS este\n')
        f.write(u'-- APAGADO —ahi no se aplica— y al encenderlo se ACTIVA. Resultado: el\n')
        f.write(u'-- aviso de Supabase se calla, `rowsecurity` dice true, y la llave\n')
        f.write(u'-- publica sigue leyendo la tabla entera. Por eso el veredicto sale de\n')
        f.write(u'-- pedir las filas desde fuera, no de mirar el panel.\n')
        f.write(u'SELECT tablename, policyname, roles, cmd, qual\n  FROM pg_policies\n'
                u" WHERE schemaname = 'public'\n ORDER BY tablename, policyname;\n")
        f.write(u'\n-- COMPROBAR DESPUES, en el mismo editor:\n')
        f.write(u'SELECT tablename, rowsecurity\n  FROM pg_tables\n'
                u" WHERE schemaname = 'public'\n ORDER BY rowsecurity, tablename;\n")
        f.write(u'\n-- Y DESDE FUERA, que es lo que de verdad cierra el asunto:\n')
        f.write(u'--   python scripts/revisa-rls.py\n')
    print(u'\n  SQL escrito en scripts/migracion-rls.sql (%d tabla(s))' % len(abiertas))
