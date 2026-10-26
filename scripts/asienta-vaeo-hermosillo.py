# -*- coding: utf-8 -*-
u"""ASIENTA EN LA FICHA DE VAEO (C51) LO QUE EXPLICO DANIEL MARTINEZ.

   El 26 oct 2026 el globo del Dashboard anuncio «cp190357 · $41,110 de primer
   pago, sin asesor». Direccion lo pregunto por Slack y Daniel Martinez
   explico que NO es un cliente nuevo: es una linea de VAEO (C51) para su
   cliente final Grupo Hermosillo.

   Esto se asienta en la ficha porque es CONTEXTO DE NEGOCIO que no se deduce
   de ninguna fuente del tablero: ni la facturacion, ni las llamadas, ni los
   tickets dicen por que aparecio un CID nuevo con $41,110.

   SE ESCRIBE EN `observaciones_kam`, QUE ESTA VACIO. No se toca `notas`, que
   trae «Señales: SIN_ADOPCION» y lo escribe el motor: pisarlo seria borrar
   una señal calculada con una nota a mano.

   Las credenciales se leen de .env.local aqui dentro y NUNCA se imprimen.

   USO
       python scripts/asienta-vaeo-hermosillo.py --simulacro
       python scripts/asienta-vaeo-hermosillo.py
"""
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CID_VAEO = '180631'

TEXTO = (
    u'GRUPO HERMOSILLO — LINEA APARTE (CID 190357). Confirmado por Daniel Martinez '
    u'por Slack el 26 oct 2026, a raiz de que el Dashboard anuncio ese CID como un '
    u'cliente nuevo de $41,110 sin asesor.\n'
    u'\n'
    u'Grupo Hermosillo es cliente DE VAEO, no de Callpicker. VAEO le sigue dando el '
    u'servicio de Callpicker directamente; lo que paso es que el cliente final, al '
    u'tener una operacion mas grande, pidio tener sus llamadas APARTE para no '
    u'mezclarlas con las de los demas clientes de VAEO. Por eso se abrio una linea '
    u'con CID propio.\n'
    u'\n'
    u'EL IMPORTE NO ES RECURRENTE. De los $41,110 del primer pago, el upsell real son '
    u'~$2,900 AL MES; el resto es compra e instalacion de equipo, que es de una sola '
    u'vez. Leer los $41,110 como MRR multiplica por catorce lo que esta cuenta '
    u'realmente subio.\n'
    u'\n'
    u'VAEO tiene un costo de extension preferencial, y por eso solo pidio un '
    u'incremento en su facturacion en vez de un contrato nuevo.\n'
    u'\n'
    u'RELACION: la cuenta la llevaba Claudia y hoy es de Erick. Enrique le da '
    u'seguimiento y conserva mucho contacto con ellos — el caso llego por el.'
)


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    for ln in io.open(p, encoding='utf-8'):
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
              '&cid=eq.' + CID_VAEO)
    if not cs:
        print(u'  *** no encuentro la cuenta con CID %s. No se toca nada.' % CID_VAEO)
        return 1
    c = cs[0]
    print(u'\n  VAEO — asentar el caso Grupo Hermosillo')
    print(u'  ' + u'=' * 66)
    print(u'  cuenta   : %s · %s · asesor %s'
          % (c.get('consecutivo'), c.get('empresa'), c.get('asesor')))
    previo = (c.get('observaciones_kam') or '').strip()
    print(u'  observaciones_kam ahora: %s'
          % (u'(vacio)' if not previo else u'%d caracteres' % len(previo)))
    print(u'  notas (NO se toca)     : %s' % ((c.get('notas') or '')[:60] or u'(vacio)'))

    if previo and 'GRUPO HERMOSILLO' in previo.upper():
        print(u'\n  ya estaba asentado. No se escribe nada.')
        return 0

    # NO se pisa lo que haya: se antepone y se conserva lo anterior.
    nuevo = TEXTO if not previo else (TEXTO + u'\n\n---\n\n' + previo)
    print(u'\n  se escribiran %d caracteres%s'
          % (len(nuevo), u'' if not previo else u' (conservando los %d previos)' % len(previo)))

    if simulacro:
        print(u'\n' + TEXTO[:600] + u'…')
        print(u'\n  (simulacro: no se escribio nada)\n')
        return 0

    pide('cuentas?id=eq.' + str(c['id']), 'PATCH',
         {'observaciones_kam': nuevo}, {'Prefer': 'return=minimal'})
    de_nuevo = pide('cuentas?select=observaciones_kam,notas&cid=eq.' + CID_VAEO)
    ok = de_nuevo and 'GRUPO HERMOSILLO' in (de_nuevo[0].get('observaciones_kam') or '').upper()
    print(u'  comprobado tras escribir: %s' % (u'quedo' if ok else u'*** NO quedo'))
    print(u'  `notas` sigue en        : %s'
          % ((de_nuevo[0].get('notas') or '')[:60] if de_nuevo else u'?'))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
