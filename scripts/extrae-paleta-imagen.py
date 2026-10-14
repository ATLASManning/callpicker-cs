# -*- coding: utf-8 -*-
u"""Saca los tonos REALES de una captura, por zonas, en vez de elegirlos a ojo.

Nace de la 11a ronda de contraste (13 oct 2026): direccion mando una captura
del «Customer Success Operating System» y pidio ese juego de colores para el
Dashboard. Un hex leido a ojo de una captura se equivoca en varios puntos de
luminancia, y aqui la luminancia ES el requisito — la regla es «fondo oscuro
letra clara y viceversa», que se mide, no se estima.

Uso:
    python scripts/extrae-paleta-imagen.py <ruta.png>
    python scripts/extrae-paleta-imagen.py <ruta.png> x0 y0 x1 y1 [etiqueta]

Sin rectangulo imprime una rejilla de zonas y el color dominante de cada una,
mas los colores mas frecuentes de toda la imagen. Con rectangulo, el dominante
y los cinco mas frecuentes de ESA zona.

El dominante se toma por MODA sobre el color exacto, no por promedio: promediar
un degradado da un tono que no existe en la imagen, y promediar texto con su
fondo da el punto medio entre los dos, que es justo el color que no hay que usar.
"""
import collections
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

try:
    from PIL import Image
except ImportError:
    sys.stderr.write('Falta Pillow:  python -m pip install --user Pillow\n')
    sys.exit(2)


def hexa(t):
    return '#%02X%02X%02X' % t[:3]


def luminancia(t):
    """Luminancia relativa WCAG. Decide si una zona es «clara» u «oscura»."""
    c = []
    for v in t[:3]:
        v = v / 255.0
        c.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def dominantes(im, caja, n=6):
    rec = im.crop(caja)
    cuenta = collections.Counter(rec.convert('RGB').getdata())
    tot = sum(cuenta.values())
    return [(hexa(c), v, 100.0 * v / tot) for c, v in cuenta.most_common(n)], tot


def informa(im, caja, etq):
    top, tot = dominantes(im, caja)
    dom = top[0][0]
    rgb = tuple(int(dom[i:i + 2], 16) for i in (1, 3, 5))
    print(u'\n  %s  [%d,%d .. %d,%d] · %d px' % (etq, caja[0], caja[1], caja[2], caja[3], tot))
    print(u'      dominante %s · luminancia %.3f · %s'
          % (dom, luminancia(rgb), 'CLARO' if luminancia(rgb) > 0.179 else 'OSCURO'))
    print(u'      blanco encima mide %.2f:1 · marino #122E5E encima mide %.2f:1'
          % (contraste(rgb, (255, 255, 255)), contraste(rgb, (0x12, 0x2E, 0x5E))))
    for h, v, pc in top[1:]:
        print(u'        %s  %5.1f%%' % (h, pc))


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(__doc__)
        return 2
    p = sys.argv[1]
    if not os.path.isfile(p):
        sys.stderr.write('No existe: %s\n' % p)
        return 2
    im = Image.open(p).convert('RGB')
    W, H = im.size
    print(u'  %s · %dx%d' % (os.path.basename(p), W, H))

    if len(sys.argv) >= 6:
        caja = tuple(int(v) for v in sys.argv[2:6])
        etq = sys.argv[6] if len(sys.argv) > 6 else 'zona'
        informa(im, caja, etq)
        return 0

    # Rejilla de 4x4 para ver de un vistazo donde esta cada superficie.
    print(u'\n  REJILLA 4x4 — dominante de cada celda')
    for fy in range(4):
        linea = []
        for fx in range(4):
            caja = (fx * W // 4, fy * H // 4, (fx + 1) * W // 4, (fy + 1) * H // 4)
            top, _ = dominantes(im, caja, 1)
            rgb = tuple(int(top[0][0][i:i + 2], 16) for i in (1, 3, 5))
            linea.append('%s%s' % (top[0][0], '·c' if luminancia(rgb) > 0.179 else '·O'))
        print(u'      ' + '  '.join(linea))

    print(u'\n  LOS 14 COLORES MAS FRECUENTES DE TODA LA IMAGEN')
    top, tot = dominantes(im, (0, 0, W, H), 14)
    for h, v, pc in top:
        rgb = tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
        print(u'      %s  %5.2f%%  luminancia %.3f  %s'
              % (h, pc, luminancia(rgb),
                 'CLARO' if luminancia(rgb) > 0.179 else 'OSCURO'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
