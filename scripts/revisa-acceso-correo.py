# -*- coding: utf-8 -*-
u"""¿ENTRA ESTE CORREO AL TABLERO? Se pregunta pidiendo rutas, no mirando tablas.

   POR QUE EXISTE
   --------------
   Cuando direccion dice «ya le di de baja en el panel», eso NO es una baja. Lo
   dice la historia de este proyecto tres veces:

     · 1 sep 2026 — cuatro usuarios marcados inactivos usando el tablero.
     · 6 oct 2026 — Aurora: su fila de `usuarios` no quedo inactiva, DESAPARECIO,
       y seguia abriendo el tablero. HTTP 200, 990 KB.
     · 6 oct 2026 — los tres asesores salian «Inactivo / contraseña expirada» en
       Gestion de Usuarios y los tres abrian el tablero completo.

   La razon es siempre la misma: **una vez que hay cookie firmada, el middleware
   no vuelve a mirar la tabla `usuarios`**. Mira la firma del JWT y la lista
   blanca de `lib/auth.ts`, y nada mas. La cookie dura 30 dias. Borrar la fila
   impide abrir una sesion NUEVA; no mata la que ya existe.

   Asi que la pregunta «¿tiene acceso?» no se contesta mirando una pantalla: se
   contesta PIDIENDO UNA RUTA CON UNA SESION SUYA.

   LAS TRES SONDAS, Y POR QUE HACEN FALTA LAS TRES
   -----------------------------------------------
   1. COOKIE FIRMADA contra rutas reales. Es la que decide: simula exactamente
      lo que tiene esa persona en su navegador si inicio sesion en los ultimos
      30 dias. Las otras dos NO cubren este caso.
   2. `/api/auth/login` con una contraseña deliberadamente invalida:
      `usuario_invalido` = la lista lo bloquea (o no tiene fila);
      `password_invalido` = YA PASO la lista. No toca la contraseña de nadie.
   3. `/api/auth/request`: devuelve HTTP 200 aunque rechace --deliberado, para
      que nadie averigue quien tiene cuenta probando correos--. El veredicto
      esta en el CUERPO: `inactive` vs `sent`. Juzgar por el status da falsos
      positivos.

   EL CONTROL POSITIVO NO ES OPCIONAL
   ----------------------------------
   Se sondea TAMBIEN un correo que SI debe entrar. Sin el, una sonda rota --un
   secreto mal leido, produccion caida, un dominio equivocado-- daria «no entra»
   para todos y se leeria como exito. Un verificador que concluye exito por
   defecto es peor que no tenerlo. [[feedback-probar-al-reves]]

   Credenciales de `.env.local`, y NO se imprimen.

   USO
   ---
       python scripts/revisa-acceso-correo.py claudia@callpicker.com
       python scripts/revisa-acceso-correo.py claudia@callpicker.com --esperado fuera
       python scripts/revisa-acceso-correo.py claudia@ --base http://localhost:3100
"""
import base64
import hashlib
import hmac
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#: El correo de control POSITIVO. Tiene que entrar SIEMPRE.
CONTROL = 'josel@callpicker.com'

#: El control NEGATIVO, y es el que faltaba. Un correo que no existe ni puede
#: existir: si este «entra», la sonda miente y no se concluye nada.
#:
#: LA PRIMERA VERSION NO LO TENIA Y SE EQUIVOCO ENTERA. Juzgaba por tamaño
#: --`HTTP 200` y mas de 2 KB-- y el middleware contesta la PAGINA DE LOGIN con
#: HTTP 200, no con un redirect visible. Asi que un correo inventado daba
#: «ABRE» en las cinco rutas con 44,579 B identicos, las dos APIs incluidas,
#: que deberian devolver JSON. Con eso llegue a creer que tres personas dadas
#: de baja seguian dentro.
#:
#: El control positivo NO lo caza: solo detecta falsos NEGATIVOS --sonda muerta,
#: produccion caida--. El falso POSITIVO, que es el que alarma en falso y el que
#: haria dar por buena una baja que no existe, solo lo caza este.
#: [[feedback-probar-al-reves]]
CONTROL_NEGATIVO = 'no-existe-jamas-9fk2@ejemplo.invalido'

#: Marcadores de la PAGINA DE LOGIN. Si el cuerpo trae uno, no se entro: se
#: rebotó, aunque el status diga 200.
MARCAS_LOGIN = ('type="password"', 'name="password"', 'Iniciar sesi',
                'autenticaci', 'Ingresa tu correo')

#: Las rutas que de verdad importan: la portada, la cartera y sus dos APIs.
#: Si una sola contesta con datos, esa persona esta dentro.
RUTAS = ['/', '/cuentas', '/alertas', '/api/cuentas', '/api/alertas?limite=1']


def entorno(clave):
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as fh:
        for ln in fh:
            ln = ln.strip()
            if ln.startswith(clave + '='):
                return ln.split('=', 1)[1].strip().strip('"').strip("'")
    return None


def b64(b):
    return base64.urlsafe_b64encode(b).decode().rstrip('=')


def cookie_de(email, rol='asesor', asesor=None):
    u"""Una sesion firmada con el MISMO secreto que pone el login.

    Es lo que tiene esa persona en su navegador. No se le roba nada ni se toca
    su contraseña: se reproduce la credencial para comprobar si sigue valiendo.
    """
    sec, now = entorno('JWT_SECRET').encode(), int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': email, 'nombre': email.split('@')[0],
                          'rol': rol, 'asesor_nombre': asesor,
                          'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return 'cp_session=' + cab + '.' + cue + '.' + b64(
        hmac.new(sec, (cab + '.' + cue).encode(), hashlib.sha256).digest())


def pide(base, ruta, gal=None):
    req = urllib.request.Request(base + ruta)
    if gal:
        req.add_header('Cookie', gal)
    req.add_header('Cache-Control', 'no-cache')
    try:
        with urllib.request.urlopen(req, timeout=120) as x:
            cuerpo = x.read().decode('utf-8', 'replace')
            return x.status, cuerpo, x.geturl()
    except urllib.error.HTTPError as e:
        return e.code, (e.read() or b'').decode('utf-8', 'replace'), None
    except Exception as e:
        return None, '', str(e)


def sonda_cookie(base, email, rol, asesor):
    u"""La sonda que decide. Devuelve (entra, detalle).

    SE JUZGA POR CONTENIDO, NO POR TAMAÑO. El middleware no contesta con un
    redirect visible: sirve la PAGINA DE LOGIN con HTTP 200. Juzgar por «200 y
    mas de 2 KB» daba «ABRE» a un correo inventado en las cinco rutas, las APIs
    incluidas. Lo que distingue de verdad:

      · una API tiene que devolver JSON. Si devuelve HTML, reboto.
      · una pagina del tablero NO trae un campo de contraseña.
    """
    gal = cookie_de(email, rol, asesor)
    filas, entra = [], False
    for r in RUTAS:
        code, cuerpo, _destino = pide(base, r, gal)
        n = len(cuerpo)
        es_api = r.startswith('/api/')
        login = any(m in cuerpo for m in MARCAS_LOGIN)
        if es_api:
            # JSON de verdad, no la pagina de login disfrazada de 200.
            ok = code == 200 and cuerpo.lstrip()[:1] in ('{', '[')
            motivo = u'DEVUELVE DATOS' if ok else (
                u'rebota (HTML)' if code == 200 else u'no')
        else:
            ok = code == 200 and not login
            motivo = u'ABRE' if ok else (
                u'pagina de LOGIN' if login else u'no')
        if ok:
            entra = True
        filas.append((r, code, n, motivo))
    return entra, filas


def sonda_login(base, email):
    u"""Contraseña deliberadamente invalida. No toca la de nadie."""
    datos = json.dumps({'email': email, 'password': 'contraseña-invalida-de-prueba-0000'})
    req = urllib.request.Request(base + '/api/auth/login', data=datos.encode('utf-8'),
                                 headers={'Content-Type': 'application/json'},
                                 method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as x:
            return x.status, x.read().decode('utf-8', 'replace')[:200]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')[:200]
    except Exception as e:
        return None, str(e)


def sonda_request(base, email):
    u"""El veredicto esta en el CUERPO, no en el status: siempre contesta 200."""
    datos = json.dumps({'email': email})
    req = urllib.request.Request(base + '/api/auth/request', data=datos.encode('utf-8'),
                                 headers={'Content-Type': 'application/json'},
                                 method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as x:
            return x.status, x.read().decode('utf-8', 'replace')[:200]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')[:200]
    except Exception as e:
        return None, str(e)


def revisa(base, email, rol, asesor, etiqueta):
    print(u'\n  %s  —  %s' % (etiqueta, email))
    print(u'  ' + u'-' * 70)
    entra, filas = sonda_cookie(base, email, rol, asesor)
    for r, code, n, veredicto in filas:
        print(u'    %-26s HTTP %-4s %8s B   %s'
              % (r, code, format(n, ',d'), veredicto))
    c_code, c_cuerpo = sonda_login(base, email)
    print(u'    %-26s HTTP %-4s %s' % (u'login (clave invalida)', c_code, c_cuerpo))
    r_code, r_cuerpo = sonda_request(base, email)
    print(u'    %-26s HTTP %-4s %s' % (u'request (leer el CUERPO)', r_code, r_cuerpo))
    print(u'    => CON UNA SESION SUYA: %s' % (u'*** ENTRA ***' if entra else u'NO entra'))
    return entra


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(u'  uso: python scripts/revisa-acceso-correo.py <correo> [--esperado dentro|fuera]')
        sys.exit(2)
    email = args[0].strip().lower()
    base = 'https://callpicker-cs.vercel.app'
    if '--base' in sys.argv:
        base = sys.argv[sys.argv.index('--base') + 1].rstrip('/')
    esperado = None
    if '--esperado' in sys.argv:
        esperado = sys.argv[sys.argv.index('--esperado') + 1].lower()

    print(u'\n  ACCESO AL TABLERO — se pregunta pidiendo rutas, no mirando tablas')
    print(u'  ' + u'=' * 70)
    print(u'  objetivo: %s' % base)

    entra = revisa(base, email, 'asesor', None, u'EL CORREO EN CUESTION')
    ctrl = revisa(base, CONTROL, 'admin', None, u'CONTROL POSITIVO (debe entrar)')
    neg = revisa(base, CONTROL_NEGATIVO, 'asesor', None,
                 u'CONTROL NEGATIVO (NO debe entrar jamas)')

    print(u'\n  ' + u'=' * 70)
    if not ctrl:
        print(u'  *** EL CONTROL POSITIVO NO ENTRA: la sonda esta rota.')
        print(u'      (secreto mal leido, produccion caida, o el dominio cambio)')
        sys.exit(2)
    if neg:
        print(u'  *** UN CORREO INVENTADO «ENTRA»: LA SONDA MIENTE.')
        print(u'      No concluyas nada de lo de arriba. Es lo que paso el 15 oct')
        print(u'      2026 por juzgar el acceso por tamaño de respuesta en vez de')
        print(u'      por contenido: el middleware sirve el login con HTTP 200.')
        sys.exit(2)
    print(u'  los DOS controles cuadran: detecta un acceso real y rechaza uno falso.')

    if esperado == 'fuera' and entra:
        print(u'  *** %s TODAVIA ENTRA y deberia estar fuera.' % email)
        print(u'      Quitarlo de EMAILS_AUTORIZADOS_DEFAULT en lib/auth.ts y desplegar.')
        sys.exit(1)
    if esperado == 'dentro' and not entra:
        print(u'  *** %s NO entra y deberia estar dentro.' % email)
        sys.exit(1)
    if esperado:
        print(u'  %s esta %s, como se esperaba.' % (email, esperado.upper()))
    print(u'')


if __name__ == '__main__':
    main()
