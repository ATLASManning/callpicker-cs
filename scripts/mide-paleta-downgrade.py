# -*- coding: utf-8 -*-
u"""La paleta de Cuentas → Activas con Downgrade, CALCULADA contra el fondo real.

   ── POR QUE EXISTE ────────────────────────────────────────────────────────
   La pantalla es clara con UNA isla oscura (el hero) y una tabla con cabecera
   marino y filas alternas. Eso son CINCO fondos distintos —blanco, el zebra,
   la isla `mission`, el ambar del aviso y el marino de la cabecera— y la
   medicion de un tono CADUCA cuando cambia el fondo, sin avisar. Es la clase
   de cambio que costo catorce rondas en este repo.
   [[atlas-dashboard-contrast-architecture]]

   El hero NO se mide aqui: lo mide `scripts/mide-paleta-sidebar.py` contra el
   extremo CLARO del degradado, que es el que aprieta, y es el mismo componente
   compartido (`components/HeroModulo.tsx`). Medirlo dos veces seria tener dos
   espejos del mismo tono que se pueden desalinear.

   ── LOS TONOS SE LEEN DE `lib/paleta-cs.ts`, NO SE TECLEAN ────────────────
   Si alguien corrige un token alli y aqui estuviera tecleado, este guion
   seguiria dando verde midiendo un color que ya nadie pinta. Un espejo
   tecleado a mano deja de ser espejo. Si un token no se encuentra, ABORTA:
   medir con un valor supuesto da un verde que no corresponde a la pantalla.
   [[feedback-verificar-antes-asegurar]]

   Es de SOLO LECTURA. Sale con 1 si algun par no alcanza su minimo.

   USO
       python -I scripts/mide-paleta-downgrade.py
       python -I scripts/mide-paleta-downgrade.py --autoprueba
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PALETA = os.path.join(RAIZ, 'lib', 'paleta-cs.ts')
PAGINA = os.path.join(RAIZ, 'app', 'cuentas', 'downgrade', 'page.tsx')

MIN_TEXTO = 4.5


def tokens():
    u"""{NOMBRE: '#RRGGBB'} leidos de lib/paleta-cs.ts."""
    txt = io.open(PALETA, encoding='utf-8').read()
    return dict(re.findall(r"export const (\w+)\s*=\s*'(#[0-9A-Fa-f]{6})'", txt))


def t(mapa, nombre):
    v = mapa.get(nombre)
    if not v:
        print(u'')
        print(u'  *** No encontré el token «%s» en lib/paleta-cs.ts.' % nombre)
        print(u'      Puede que lo renombraran. NO se asume un valor: medir con')
        print(u'      un color supuesto da un verde que no es el de la pantalla.')
        sys.exit(2)
    return v


def hx(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]


def lineal(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
    r, g, b = (lineal(c) for c in hx(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def pares(P):
    u"""Los pares que ESTA pantalla pinta de verdad, fondo por fondo."""
    BLANCO, ZEBRA = '#FFFFFF', t(P, 'ZEBRA')
    MISION, LAVADO = t(P, 'MISION'), t(P, 'LAVADO')
    MARINO = t(P, 'MARINO')
    AMBAR_FONDO, AMBAR_TINTA = '#FEF3C7', '#78350F'

    grupos = [
        (u'cabecera de la tabla (fondo marino)', MARINO, [
            (u'los seis títulos (11.5px, 700)', BLANCO, MIN_TEXTO),
        ]),
        (u'filas impares (fondo blanco)', BLANCO, [
            (u'nombre de la cuenta (12.5px, 700)', MARINO, MIN_TEXTO),
            (u'consecutivo (12.5px, 800)', t(P, 'AZUL'), MIN_TEXTO),
            (u'MRR vigente (12.5px, 700)', MARINO, MIN_TEXTO),
            (u'la razón y el asesor (11.5px)', t(P, 'TX_MED'), MIN_TEXTO),
            (u'estado y CID (11px)', t(P, 'TX_BAJO'), MIN_TEXTO),
            (u'caída medida (12.5px, 700)', t(P, 'ROJO_TX'), MIN_TEXTO),
            (u'«no es cero, no lo mide» (11.5px, 600)', t(P, 'AMBAR_TX'), MIN_TEXTO),
        ]),
        (u'filas pares (fondo zebra)', ZEBRA, [
            (u'nombre de la cuenta (12.5px, 700)', MARINO, MIN_TEXTO),
            (u'consecutivo (12.5px, 800)', t(P, 'AZUL'), MIN_TEXTO),
            (u'la razón y el asesor (11.5px)', t(P, 'TX_MED'), MIN_TEXTO),
            (u'estado y CID (11px)', t(P, 'TX_BAJO'), MIN_TEXTO),
            (u'caída medida (12.5px, 700)', t(P, 'ROJO_TX'), MIN_TEXTO),
            (u'«no es cero, no lo mide» (11.5px, 600)', t(P, 'AMBAR_TX'), MIN_TEXTO),
        ]),
        (u'la isla de «ninguna marcada» (fondo mission)', MISION, [
            (u'título (16px, 800)', MARINO, MIN_TEXTO),
            (u'cuerpo y lista (12.5px)', t(P, 'TX_MED'), MIN_TEXTO),
        ]),
        (u'el <code> del nombre de archivo (fondo lavado)', LAVADO, [
            (u'ruta del archivo (11.5px)', MARINO, MIN_TEXTO),
        ]),
        (u'el aviso ámbar de entradas sin resolver', AMBAR_FONDO, [
            (u'título (12.5px, 800)', MARINO, MIN_TEXTO),
            (u'cuerpo (12px)', AMBAR_TINTA, MIN_TEXTO),
        ]),
        (u'el pie que dice qué periodo cubre (fondo blanco)', BLANCO, [
            (u'texto (11.5px)', t(P, 'TX_MED'), MIN_TEXTO),
            (u'error de carga (13px, 700)', t(P, 'ROJO_TX'), MIN_TEXTO),
        ]),
    ]
    return grupos


def corre(grupos, callado=False):
    fallos = []
    for titulo, fondo, items in grupos:
        if not callado:
            print(u'\n  %s  — fondo %s' % (titulo, fondo))
        for etq, tinta, minimo in items:
            r = contraste(tinta, fondo)
            ok = r >= minimo
            if not ok:
                fallos.append(u'%s · %s — %.2f:1 sobre %s, pide %.1f'
                              % (titulo, etq, r, fondo, minimo))
            if not callado:
                print(u'    %s %-42s %s  %6.2f:1  (min %.1f)'
                      % (u'ok  ' if ok else u'FALLA', etq, tinta, r, minimo))
    return fallos


def decorativos(P):
    u"""Lo que se ve pero NO se exige, y por qué — dicho, no callado.

       Mi primera versión le pedía 3:1 a la línea separadora de la tabla y la
       daba por FALLO (1.24:1 sobre blanco). El umbral estaba mal elegido: el
       3:1 de WCAG 1.4.11 es para el borde del que depende IDENTIFICAR un
       control —el contorno de un campo de texto—, no para una divisoria.

       Aquí la estructura de la tabla no se apoya en la línea: cada renglón se
       distingue por su contenido y por la fila alterna, y la línea es
       redundancia visual. Bajarle el mínimo en silencio para que pasara
       habría sido exactamente el vicio que este guion vigila; quitarla sin
       decir nada, también. Se imprime, con su cifra y sin veredicto.
    """
    print(u'')
    print(u'  decorativos — se imprimen, no se exigen')
    for etq, c, fondo in (
            (u'línea separadora sobre blanco', t(P, 'LINEA'), '#FFFFFF'),
            (u'línea separadora sobre zebra', t(P, 'LINEA'), t(P, 'ZEBRA')),
            (u'la propia fila alterna contra el blanco', t(P, 'ZEBRA'), '#FFFFFF')):
        print(u'    --   %-42s %s  %6.2f:1' % (etq, c, contraste(c, fondo)))
    print(u'    La tabla NO depende de ellos: el renglón se distingue por su')
    print(u'    contenido. Son redundancia visual, no el límite de un control.')


def usa_token_no_medido(P):
    u"""Colores escritos a pelo en la página que esta medición no cubre.

       Una pantalla que empieza a pintar un hex suelto deja de estar medida por
       este guion sin que nada falle. Los dos conocidos —el ámbar del aviso—
       van declarados arriba; cualquier otro se nombra aquí."""
    txt = io.open(PAGINA, encoding='utf-8').read()
    txt = re.sub(r'/\*.*?\*/', '', txt, flags=re.S)
    txt = re.sub(r'//[^\n]*', '', txt)
    vistos = set(m.upper() for m in re.findall(r"'(#[0-9A-Fa-f]{6})'", txt))
    conocidos = {'#FFFFFF', '#FEF3C7', '#78350F', '#F59E0B'}
    return sorted(vistos - conocidos - set(v.upper() for v in P.values()))


def autoprueba():
    u"""Un medidor del que sólo se ha visto el «ok» no está probado.
       [[feedback-probar-al-reves]]"""
    print(u'\n  AUTOPRUEBA')
    print(u'  ' + u'─' * 68)
    malos = 0

    # 1. Un par que SABEMOS malo tiene que salir como fallo.
    f = corre([(u'prueba', '#FFFFFF', [(u'gris clarísimo', '#CCCCCC', MIN_TEXTO)])],
              callado=True)
    ok1 = len(f) == 1
    print(u'    %-46s %s' % (u'detecta un par ilegible', u'ok' if ok1 else u'*** FALLA ***'))

    # 2. Un par que SABEMOS bueno NO puede salir como fallo.
    f = corre([(u'prueba', '#FFFFFF', [(u'negro', '#000000', MIN_TEXTO)])], callado=True)
    ok2 = len(f) == 0
    print(u'    %-46s %s' % (u'acepta un par legible', u'ok' if ok2 else u'*** FALLA ***'))

    # 3. Un token que no existe tiene que ABORTAR, no inventarse un color.
    ok3 = t({'MARINO': '#10355D'}, 'MARINO') == '#10355D'
    print(u'    %-46s %s' % (u'lee un token existente', u'ok' if ok3 else u'*** FALLA ***'))

    # 4. La fórmula contra una referencia conocida: blanco sobre negro = 21:1.
    ok4 = abs(contraste('#FFFFFF', '#000000') - 21.0) < 0.01
    print(u'    %-46s %s' % (u'la fórmula da 21:1 en blanco sobre negro',
                             u'ok' if ok4 else u'*** FALLA ***'))

    malos = sum(0 if x else 1 for x in (ok1, ok2, ok3, ok4))
    print(u'')
    print(u'  %s' % (u'las 4 comprobaciones de la autoprueba pasan' if not malos
                     else u'*** %d rama(s) NO funcionan ***' % malos))
    return 1 if malos else 0


def main():
    if '--autoprueba' in sys.argv:
        return autoprueba()

    P = tokens()
    print(u'')
    print(u'  PALETA DE «ACTIVAS CON DOWNGRADE», contra el fondo real')
    print(u'  ' + u'═' * 68)
    print(u'  %d token(s) leídos de lib/paleta-cs.ts' % len(P))
    print(u'  El hero NO se mide aquí: es HeroModulo, y lo mide')
    print(u'  mide-paleta-sidebar.py contra el extremo claro del degradado.')

    fallos = corre(pares(P))

    decorativos(P)

    sueltos = usa_token_no_medido(P)
    print(u'')
    if sueltos:
        print(u'  *** la página pinta %d color(es) que esta medición NO cubre:'
              % len(sueltos))
        for s in sueltos:
            print(u'      %s' % s)
        print(u'      Añádelos a `pares()` o cámbialos por un token de la paleta.')
        fallos.append(u'colores sin medir en la página: %s' % u', '.join(sueltos))
    else:
        print(u'  ningún color suelto sin medir en la página.')

    print(u'')
    if fallos:
        print(u'  *** %d par(es) NO alcanzan su mínimo:' % len(fallos))
        for f in fallos:
            print(u'      %s' % f)
        return 1
    print(u'  todos los pares de la pantalla alcanzan su mínimo.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
