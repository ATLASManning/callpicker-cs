# -*- coding: utf-8 -*-
u"""ASIENTA EN LA FICHA DE TECH PEOPLE (C1) LA AUDITORIA DE TRAFICO.

   El expediente de auditoria lo lee quien abre /auditoria. El asesor que abre
   la FICHA de la cuenta no lo ve, y es quien va a llamar al cliente. Esto
   pone en `observaciones_kam` lo accionable, no el expediente entero.

   SE ESCRIBE SOLO LO QUE SE PUEDE SOSTENER, con su alcance al lado: el
   documento mezcla cifras de la cuenta principal con cifras de las dos
   cuentas, y citar una por la otra es falso.

   `notas` NO se toca: lo escribe el motor de señales.

   Las credenciales se leen de .env.local aqui dentro y NUNCA se imprimen.

   USO
       python scripts/asienta-auditoria-techpeople.py --simulacro
       python scripts/asienta-auditoria-techpeople.py
"""
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CID = '2094'
MARCA = 'AUDITORIA DE TRAFICO DE VOZ'

TEXTO = (
    u'AUDITORIA DE TRAFICO DE VOZ · 27 oct 2026. Censo de 399,585 CDR del 1 ene al '
    u'26/27 oct, las DOS cuentas (2094 y la subcuenta Soluciones 32785), sin muestreo. '
    u'Expediente completo en Auditoria > Tech People (v1.4).\n'
    u'\n'
    u'LO QUE HAY QUE LLEVAR A LA LLAMADA, en este orden:\n'
    u'\n'
    u'1) LA PRUEBA ESTA EN SU PROPIA CASA, y por eso no admite discusion tecnica. Su '
    u'equipo Soluciones atiende el 94.4% de sus entrantes con 16 agentes, desde enero, '
    u'sobre la MISMA plataforma y el mismo menu. La red de mostradores atiende el 45.7%. '
    u'Cuarenta y nueve puntos sin una sola diferencia de tecnologia: una tiene cola de '
    u'respaldo y la otra reparte a mostradores sin plan alterno.\n'
    u'\n'
    u'2) EL BLOQUE MAS GRANDE NO ES UNA TIENDA MALA. 51,991 llamadas entrantes (37.3% de '
    u'la cuenta principal) nunca se enrutaron a ninguna extension, cola ni sitio, y CERO '
    u'llegaron a un agente. En hora pico sigue siendo 31-35%, asi que no es abandono del '
    u'cliente: es configuracion del menu. Se corrige sin comprar nada.\n'
    u'\n'
    u'3) LA DEVOLUCION FUNCIONA CUANDO SE HACE, Y NO SE HACE. 59,697 clientes llamaron, '
    u'nadie los atendio y nadie les devolvio la llamada en 72 horas. De las que si se '
    u'devuelven, conecta el 76.9%. El argumento de «el cliente no contesta» esta cerrado.\n'
    u'\n'
    u'4) LA VENTANA DE 9 A 11, los siete dias: 9,432 llamadas con 18.6% de atencion, sin '
    u'una sola hora que llegue al 30%. Y el domingo atienden mejor que el martes: es '
    u'cobertura programada, no actitud.\n'
    u'\n'
    u'ANTES DE LLAMAR — DOS COSAS DE CASA:\n'
    u'· Nuestra ficha dice que la Integracion API NO esta activada y el registro muestra '
    u'205,080 salientes originadas por integracion (92%). El propio documento lo marca '
    u'como HIPOTESIS —el campo de origen podria ser interno de plataforma— asi que hay '
    u'que validarlo con ingenieria ANTES de mencionarlo al cliente.\n'
    u'· Cualquier reporte por sucursal que se le enseñe hoy esta mal: 32 sitios con dos '
    u'nombres y 11 etiquetas de prueba con trafico real.\n'
    u'\n'
    u'LO QUE NO SE DEBE DECIR: que corregir el enrutamiento cierra la brecha de uso del '
    u'plan. No la cierra — lleva el uso util del 14% al 19%, y el propio documento pide '
    u'no prometer lo contrario. Y las cifras «de las dos cuentas» no son «de la cuenta»: '
    u'sin conversacion son 150,594 sumando las dos y 147,422 solo la principal.'
)


def env(clave):
    for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        ln = ln.strip()
        if ln.startswith(clave + '='):
            return ln.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = (env('NEXT_PUBLIC_SUPABASE_URL') or '').rstrip('/')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')


def pide(ruta, metodo='GET', cuerpo=None, extra=None):
    cab = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
           'Content-Type': 'application/json'}
    if extra:
        cab.update(extra)
    datos = json.dumps(cuerpo).encode('utf-8') if cuerpo is not None else None
    req = urllib.request.Request(URL + '/rest/v1/' + ruta, data=datos,
                                 headers=cab, method=metodo)
    with urllib.request.urlopen(req, timeout=40) as r:
        t = r.read().decode('utf-8')
    return json.loads(t) if t.strip() else []


def main():
    simulacro = '--simulacro' in sys.argv
    if not URL or not KEY:
        print(u'  *** faltan credenciales en .env.local. No se toca nada.')
        return 2

    cs = pide('cuentas?select=id,cid,consecutivo,empresa,asesor,observaciones_kam,notas'
              '&cid=eq.' + CID)
    if not cs:
        print(u'  *** no encuentro la cuenta con CID %s. No se toca nada.' % CID)
        return 1
    c = cs[0]
    print(u'\n  TECH PEOPLE — asentar la auditoria de trafico')
    print(u'  ' + u'=' * 66)
    print(u'  cuenta : %s · %s · asesor %s'
          % (c.get('consecutivo'), c.get('empresa'), c.get('asesor')))
    previo = (c.get('observaciones_kam') or '').strip()
    print(u'  observaciones_kam ahora: %s'
          % (u'(vacio)' if not previo else u'%d caracteres' % len(previo)))

    if MARCA in previo.upper():
        print(u'\n  ya estaba asentada. No se escribe nada.')
        return 0

    nuevo = TEXTO if not previo else (TEXTO + u'\n\n---\n\n' + previo)
    print(u'  se escribiran %d caracteres%s'
          % (len(nuevo), u'' if not previo else u' (conservando los %d previos)' % len(previo)))

    if simulacro:
        print(u'\n' + TEXTO[:700] + u'…')
        print(u'\n  (simulacro: no se escribio nada)\n')
        return 0

    pide('cuentas?id=eq.' + str(c['id']), 'PATCH',
         {'observaciones_kam': nuevo}, {'Prefer': 'return=minimal'})
    otra = pide('cuentas?select=observaciones_kam,notas&cid=eq.' + CID)
    ok = otra and MARCA in (otra[0].get('observaciones_kam') or '').upper()
    print(u'  comprobado tras escribir: %s' % (u'quedo' if ok else u'*** NO quedo'))
    print(u'  `notas` sigue en        : %s'
          % ((otra[0].get('notas') or '')[:60] if otra else u'?'))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
