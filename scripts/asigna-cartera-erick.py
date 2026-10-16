# -*- coding: utf-8 -*-
u"""ASIGNA LA CARTERA A ERICK EN `usuarios.asesor_nombre`.

   Erick Sánchez quedó registrado el 16 oct 2026 con rol `asesor` y la columna
   ASESOR en blanco. Con el candado de `lib/dueno.ts`, que falla CERRADO, eso
   NO es «medio acceso»: entra al tablero, navega, y recibe 403 en sus propias
   cuentas. Las 71 que eran de Claudia ya estan a su nombre en `cuentas.asesor`
   desde el 15 oct.

   EL VALOR TIENE QUE SER EL MISMO QUE ESCRIBE LA CARGA SEMANAL en
   `cuentas.asesor` —«Erick», no «Erick Sánchez»—, porque es la comparacion que
   hace el candado. Por eso el script NO acepta un nombre a mano: lo LEE de
   `cuentas` y comprueba que casa con el catalogo del alta.
   [[auditoria-acceso-oct2026]] [[erick-sustituye-a-claudia]]

   USO
       python scripts/asigna-cartera-erick.py --simulacro
       python scripts/asigna-cartera-erick.py
"""
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORREO = 'erick@callpicker.com'


def env(clave):
    """Las credenciales se LEEN aqui dentro y NUNCA se imprimen."""
    p = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(p):
        return None
    for ln in io.open(p, encoding='utf-8'):
        ln = ln.strip()
        if ln.startswith(clave + '='):
            return ln.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not KEY:
    print(u'  *** faltan credenciales en .env.local. No se toca nada.')
    sys.exit(2)


def pide(ruta, metodo='GET', cuerpo=None, extra=None):
    cab = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
           'Content-Type': 'application/json'}
    if extra:
        cab.update(extra)
    datos = json.dumps(cuerpo).encode('utf-8') if cuerpo is not None else None
    req = urllib.request.Request(URL + '/rest/v1/' + ruta, data=datos,
                                 headers=cab, method=metodo)
    with urllib.request.urlopen(req, timeout=40) as r:
        txt = r.read().decode('utf-8')
    return json.loads(txt) if txt.strip() else []


def main():
    simulacro = '--simulacro' in sys.argv
    print(u'\n  CARTERA DE ERICK · usuarios.asesor_nombre')
    print(u'  ' + u'=' * 64)

    # ── 1. EL VALOR SALE DE `cuentas`, no de mi teclado ───────────────────
    filas = pide('cuentas?select=asesor&limit=2000')
    cuenta = {}
    for f in filas:
        a = (f.get('asesor') or u'').strip()
        if a:
            cuenta[a] = cuenta.get(a, 0) + 1
    candidatos = [a for a in cuenta if a.lower().startswith('erick')]
    print(u'  valores de `cuentas.asesor`: %s'
          % u' · '.join(u'%s (%d)' % (a, cuenta[a]) for a in sorted(cuenta)))
    if len(candidatos) != 1:
        print(u'  *** esperaba UN valor que empiece por «Erick» y hay %d: %s'
              % (len(candidatos), candidatos))
        print(u'      Sin un valor unico, asignar es adivinar. No se toca nada.')
        return 1
    valor = candidatos[0]
    print(u'  valor a escribir: «%s» — %d cuentas' % (valor, cuenta[valor]))

    # ── 2. ESTADO ACTUAL DE SU FILA ───────────────────────────────────────
    us = pide('usuarios?select=id,email,nombre,rol,activo,asesor_nombre'
              '&email=eq.' + CORREO)
    if not us:
        print(u'  *** no hay fila en `usuarios` para %s. Registrala primero.' % CORREO)
        return 1
    u0 = us[0]
    print(u'  antes:  rol=%s · activo=%s · cartera=%s'
          % (u0.get('rol'), u0.get('activo'), u0.get('asesor_nombre') or u'(vacia)'))
    if u0.get('rol') != 'asesor':
        print(u'  *** su rol es «%s», no «asesor». Esta columna solo manda para'
              % u0.get('rol'))
        print(u'      el rol asesor; revisalo antes. No se toca nada.')
        return 1
    if (u0.get('asesor_nombre') or u'').strip() == valor:
        print(u'  ya estaba asignada. No hay nada que hacer.')
        return 0

    if simulacro:
        print(u'  (simulacro: no se escribio nada)\n')
        return 0

    # ── 3. ESCRIBIR Y VOLVER A LEER ───────────────────────────────────────
    pide('usuarios?id=eq.' + str(u0['id']), 'PATCH', {'asesor_nombre': valor},
         {'Prefer': 'return=minimal'})
    de_nuevo = pide('usuarios?select=asesor_nombre&email=eq.' + CORREO)
    ahora = (de_nuevo[0].get('asesor_nombre') if de_nuevo else None)
    print(u'  despues: cartera=%s' % (ahora or u'(vacia)'))
    if ahora != valor:
        print(u'  *** la escritura NO quedo. Revisar permisos de la tabla.')
        return 1
    print(u'  hecho. Comprobar con `python scripts/revisa-acceso-asesores.py`\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
