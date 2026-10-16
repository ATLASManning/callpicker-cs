# -*- coding: utf-8 -*-
"""
Comprueba EN PRODUCCION que el texto tenue nuevo esta servido.

== POR QUE NO BASTA CON QUE LA PANTALLA CARGUE ==
Un build roto no tira el sitio: Vercel sigue sirviendo la compilacion anterior,
que estaba sana. Asi que "las pantallas cargan" no prueba nada sobre el ultimo
commit. Hace falta un marcador que viaje CON el codigo nuevo.

Para un cambio de color ese marcador existe y es publico: `.text-textLow` vive
en globals.css, que Next compila a una hoja de `/_next/static/css/`, y la
referencia esa hoja desde `/acceso`, que es la unica ruta que el middleware
deja pasar sin sesion. Si la hoja servida dice 0.55, el commit esta en linea.

Sale con codigo 1 si no lo esta, y con 2 si no pudo comprobarlo — nunca
concluye exito por defecto.

Uso:  python scripts/verifica-tenue-vivo.py
"""
import os
import re
import sys
import urllib.request

BASE = 'https://callpicker-cs.vercel.app'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def baja(url):
    pet = urllib.request.Request(url, headers={'User-Agent': 'verifica-tenue/1.0'})
    with urllib.request.urlopen(pet, timeout=60) as x:
        return x.read().decode('utf-8', 'replace')


def alfa_esperado():
    """Lo que se ESPERA se lee del fuente. Si no se puede leer, es un fallo."""
    ruta = os.path.join(RAIZ, 'app', 'globals.css')
    with open(ruta, encoding='utf-8') as fh:
        m = re.search(
            r'\.cp-card\s+\.text-textLow\s*\{[^}]*color:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([0-9.]+)\s*\)',
            fh.read())
    if not m:
        raise RuntimeError('no se pudo leer .text-textLow de app/globals.css')
    return m.group(1)


def main():
    try:
        esperado = alfa_esperado()
    except Exception as e:
        print('NO SE PUDO LEER EL FUENTE: %s' % e)
        print('Eso es un FALLO, no un "todo bien".')
        return 2

    print('se espera .text-textLow en %s (leido de app/globals.css)' % esperado)

    try:
        html = baja(BASE + '/acceso')
    except Exception as e:
        print('NO SE PUDO ABRIR /acceso: %s' % e)
        return 2

    dpl = re.search(r'dpl=(dpl_[A-Za-z0-9]+)', html)
    print('despliegue servido: %s' % (dpl.group(1) if dpl else '(no se vio el dpl_)'))

    hojas = re.findall(r'/_next/static/css/[A-Za-z0-9_.-]+\.css', html)
    if not hojas:
        print('NO SE ENCONTRO NINGUNA HOJA DE ESTILO en /acceso.')
        return 2
    hojas = sorted(set(hojas))
    print('%d hoja(s) de estilo referenciadas' % len(hojas))

    # OJO: EL MINIFICADOR CAMBIA LA NOTACION. La regla se escribe
    # `rgba(255,255,255,0.55)` y se sirve como `hsla(0,0%,100%,.55)` — el
    # blanco es el unico color donde ese cambio es gratis, y cssnano lo hace.
    # La primera version de este script buscaba solo `rgba(...)`, encontraba
    # cero y salia con "no se pudo confirmar" sobre un despliegue que SI estaba
    # en linea. Buscar la notacion que uno escribio, y no la que se sirve, es
    # un falso negativo garantizado.
    #
    # Se busca tambien el valor VIEJO: verlo es la prueba positiva de que
    # produccion sigue sirviendo la compilacion anterior.
    viejo = '0.50'

    def formas(alfa):
        a = re.escape(alfa.lstrip('0'))          # '0.55' -> '\.55'
        return re.compile(
            r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0?%s\s*\)'
            r'|hsla\(\s*0\s*,\s*0%%\s*,\s*100%%\s*,\s*0?%s\s*\)' % (a, a))

    pat_nuevo = formas(esperado)
    pat_viejo = formas(viejo)

    visto_nuevo = visto_viejo = False
    for h in hojas:
        try:
            css = baja(BASE + h)
        except Exception as e:
            print('  %s -> no se pudo bajar (%s)' % (h, e))
            continue
        n = len(pat_nuevo.findall(css))
        v = len(pat_viejo.findall(css))
        print('  %s -> %d con el alfa nuevo, %d con el viejo' % (h, n, v))
        visto_nuevo = visto_nuevo or n > 0
        visto_viejo = visto_viejo or v > 0

    print()
    if visto_nuevo:
        print('EN LINEA: la hoja servida trae el alfa %s.' % esperado)
        if visto_viejo:
            print('(el %s tambien aparece: hay otros usos legitimos de ese alfa)' % viejo)
        return 0
    if visto_viejo:
        print('NO ESTA EN LINEA: la hoja servida sigue en %s.' % viejo)
        print('Vercel tarda unos minutos; si no cambia, el build fallo y')
        print('produccion sigue sirviendo la compilacion ANTERIOR.')
        return 1
    print('NO SE PUDO CONFIRMAR: ni el alfa nuevo ni el viejo aparecen en las')
    print('hojas de /acceso. Eso NO es un "todo bien": puede que esa regla no')
    print('entre en el CSS de esta ruta. Comprobar por otra via.')
    return 2


if __name__ == '__main__':
    sys.exit(main())
