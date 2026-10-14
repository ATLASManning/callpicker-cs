# -*- coding: utf-8 -*-
u"""La paleta del documento sobre los DOS fondos de Atlas IA.

Atlas IA tiene las dos direcciones del contraste en el mismo grupo de menu:

    /chat      OSCURO  — `atlas.module.css` pinta #070C16 y la letra va clara
    /base-cs   CLARO   — pagina clara, letra oscura

Un mismo hex NO sirve en los dos: el cian #39ABD8 mide 2.63:1 sobre blanco —ni
el 3:1 de objeto grafico— y 9.09:1 sobre el fondo oscuro. Elegir «el color del
documento» sin decir sobre QUE fondo es exactamente lo que costo once rondas
([[atlas-dashboard-contrast-architecture]]).

Esto imprime la tabla que hay que usar, con su medida al lado, para que nadie
tenga que elegir un tono a ojo.

Uso:  python scripts/mide-paleta-atlas.py
"""
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# El `:root` del Customer Success Operating System.
DOC = [
    ('--navy2', '#082742', u'el mas oscuro'),
    ('--navy',  '#10355D', u'marino'),
    ('--blue',  '#1D6CAA', u'azul, el acento sobre CLARO'),
    ('--cyan',  '#39ABD8', u'cian, el acento sobre OSCURO'),
    ('--ink',   '#202E3B', u'tinta'),
    ('--muted', '#6A7889', u'gris apagado'),
    ('--line',  '#DFE8EF', u'linea'),
    ('--wash',  '#F5F8FB', u'lavado'),
    ('--paper', '#FFFFFF', u'papel'),
]

# Un paso claro del cian, para el titular del hero del documento.
EXTRA = [('hero',    '#8AD7F8', u'el titular del hero, cian claro')]

FONDOS = [
    ('/chat  (oscuro)',    '#070C16'),
    ('/chat  si pasara a --navy2', '#082742'),
    ('/base-cs tarjeta',   '#FFFFFF'),
    ('/base-cs pagina',    '#F5F8FB'),
]

TEXTO, OBJETO = 4.5, 3.0


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def lum(h):
    c = []
    for v in rgb(h):
        v /= 255.0
        c.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contra(a, b):
    la, lb = lum(a), lum(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def veredicto(v):
    if v >= TEXTO:
        return u'texto ok'
    if v >= OBJETO:
        return u'SOLO objeto grafico'
    return u'*** NO SE VE'


for etq, fondo in FONDOS:
    print(u'\n  SOBRE %s  %s' % (etq, fondo))
    print(u'  ' + u'-' * 70)
    for nom, h, que in DOC + EXTRA:
        v = contra(h, fondo)
        print(u'    %-8s %s  %6.2f:1  %-20s %s'
              % (nom, h, v, veredicto(v), que))

print(u'\n\n  LO QUE SE DEDUCE, y es la tabla que hay que usar')
print(u'  ' + u'=' * 70)
print(u"""
  /chat — ISLA OSCURA, letra CLARA
      fondo            #070C16 se conserva (es el del modulo, no del documento)
                       o pasa a #082742 --navy2 si se quiere unificar
      titulo/valor     #FFFFFF
      cuerpo           #DFE8EF   --line
      apagado          #8AD7F8 (hero) o blanco al 70%% — el --muted #6A7889
                       NO sirve aqui: mide poco sobre el fondo del modulo
      acento           #39ABD8   --cyan  <- su sitio natural es el fondo oscuro
      superficie 2     un tinte del propio fondo, NUNCA una isla blanca

  /base-cs — ISLA CLARA, letra OSCURA
      pagina           #F5F8FB   --wash
      tarjeta          #FFFFFF   --paper
      borde            #DFE8EF   --line
      titulo           #10355D   --navy
      cuerpo           #202E3B   --ink
      apagado          #6A7889   --muted   (el mas bajo que pasa AA)
      acento           #1D6CAA   --blue    <- el cian NO vale sobre claro
""")
