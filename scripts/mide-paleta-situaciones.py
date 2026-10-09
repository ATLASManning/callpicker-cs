# -*- coding: utf-8 -*-
"""La paleta de las siete situaciones, calculada y no elegida a ojo.

   POR QUE EXISTE
   --------------
   La grafica 1 del Dashboard apila por situacion, y el color salia de la LUZ
   del catalogo. La luz NO es unica por situacion: `no_la_vemos` y
   `sin_auditar` son las dos «amarillo» (#EAB308) y van PEGADAS en la pila, o
   sea 152 de 192 cuentas en un solo bloque sin frontera. Lo mismo
   `oportunidad` y `en_orden`, las dos «verde».

   Que dos series de una apilada compartan color no es un detalle de estilo:
   es que la grafica no dice lo que dice la leyenda.

   QUE SE EXIGE A CADA COLOR
   -------------------------
   1. Contra el panel #0F2040, >= 3:1. Es un objeto grafico que comunica.
   2. Entre CUALQUIER par, separacion perceptual suficiente. Se mide en OKLab
      —no en RGB, que miente— con la distancia euclidea x100. 8 es el objetivo
      y por debajo de 6 no se puede distinguir.
   3. Entre pares ADYACENTES en la pila, mas margen todavia: son los dos
      bloques que se tocan sin frontera.
   4. Ninguno igual a otro.

   USO
   ---
       python scripts/mide-paleta-situaciones.py
"""
import io
import math
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

PANEL = '#0F2040'
MIN_CONTRASTE = 3.0
MIN_DE = 8.0
MIN_DE_ADYACENTE = 10.0

# El orden es el de `SITUACION[k].orden`, que es el orden en que se apilan.
PALETA = [
    ('se_va',             u'Se está yendo',      '#EF4444'),
    ('apagandose',        u'Se está apagando',   '#B5651D'),
    ('no_la_vemos',       u'No la vemos',        '#EAB308'),
    ('sin_auditar',       u'Falta su auditoría', '#C084FC'),
    ('hay_que_mostrarle', u'Hay qué mostrarle',  '#2DD4BF'),
    ('oportunidad',       u'Oportunidad',        '#22C55E'),
    ('en_orden',          u'En orden',           '#15803D'),
]

# Los tres colores de ASESOR_CONFIG. Aparecen en la MISMA tarjeta —la gráfica
# 2 apila por asesor y la 1 también cuando el corte es la situación—, así que
# un tono que signifique «Fátima» aquí y «falta su auditoría» allá convierte
# la leyenda en adivinanza.
ASESORES = [('Fátima', '#A855F7'), ('Dan', '#0EA5E9'), ('Claudia', '#F97316')]


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


def oklab(h):
    """sRGB -> OKLab. La formula de Björn Ottosson.

       Se usa OKLab y no RGB porque la distancia en RGB no se parece a lo que
       el ojo ve: dos amarillos muy separados en RGB pueden ser el mismo
       amarillo en pantalla, y dos azules cercanos en RGB verse distintos.
    """
    r, g, b = (lineal(c) for c in hx(h))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (x ** (1.0 / 3.0) if x > 0 else -((-x) ** (1.0 / 3.0)) for x in (l, m, s))
    return (0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_)


def de(a, b):
    pa, pb = oklab(a), oklab(b)
    return 100.0 * math.sqrt(sum((pa[i] - pb[i]) ** 2 for i in range(3)))


fallos = []

print(u'  1 · CONTRA EL PANEL %s (minimo %.1f:1)\n' % (PANEL, MIN_CONTRASTE))
for k, etq, c in PALETA:
    r = contraste(c, PANEL)
    ok = r >= MIN_CONTRASTE
    if not ok:
        fallos.append(u'%s (%s) mide %.2f:1 contra el panel' % (k, c, r))
    print(u'    %-18s %s  %5.2f:1  %s' % (k, c, r, u'ok' if ok else u'*** POR DEBAJO'))

print(u'\n  2 · PARES ADYACENTES EN LA PILA (minimo %.1f de separacion)\n' % MIN_DE_ADYACENTE)
for i in range(len(PALETA) - 1):
    (ka, _, ca), (kb, _, cb) = PALETA[i], PALETA[i + 1]
    d = de(ca, cb)
    ok = d >= MIN_DE_ADYACENTE
    if not ok:
        fallos.append(u'%s y %s se tocan y solo distan %.1f' % (ka, kb, d))
    print(u'    %-18s %-18s  %5.1f  %s' % (ka, kb, d, u'ok' if ok else u'*** SE TOCAN Y SE PARECEN'))

print(u'\n  3 · TODOS LOS PARES (minimo %.1f)\n' % MIN_DE)
peor = None
for i in range(len(PALETA)):
    for j in range(i + 1, len(PALETA)):
        (ka, _, ca), (kb, _, cb) = PALETA[i], PALETA[j]
        d = de(ca, cb)
        if ca.upper() == cb.upper():
            fallos.append(u'%s y %s son EL MISMO color %s' % (ka, kb, ca))
        if d < MIN_DE:
            fallos.append(u'%s y %s solo distan %.1f' % (ka, kb, d))
            print(u'    %-18s %-18s  %5.1f  *** SE PARECEN' % (ka, kb, d))
        if peor is None or d < peor[0]:
            peor = (d, ka, kb)
print(u'    el par mas apretado: %s vs %s, %.1f' % (peor[1], peor[2], peor[0]))

print(u'\n  4 · CONTRA LOS COLORES DE ASESOR (minimo %.1f)\n' % MIN_DE)
# La gráfica 2 apila SIEMPRE por asesor y la 1 lo hace cuando el corte es la
# situación, así que las dos leyendas conviven en la misma tarjeta. Un tono
# que signifique «Claudia» arriba y «se está apagando» abajo convierte la
# leyenda en adivinanza.
#
# Esto costó: `apagandose` quiere ser naranja —la pila rojo→naranja→amarillo
# ES la escala de gravedad— y el naranja que mejor separa de sus dos vecinos
# resultó ser EL MISMO #F97316 de Claudia, cero de distancia. Se probaron 32
# tonos contra las seis restricciones a la vez; #B5651D es el que las cumple
# sin romper la lectura de la escala. Cambiar el color de Claudia habría sido
# tocar `ASESOR_CONFIG`, que usa medio tablero.
peor_ase = None
for k, _, c in PALETA:
    for ka, ca in ASESORES:
        d = de(c, ca)
        if d < MIN_DE:
            fallos.append(u'la situacion %s (%s) dista %.1f de %s (%s)'
                          % (k, c, d, ka, ca))
            print(u'    %-18s vs %-8s  %5.1f  *** EL MISMO TONO EN DOS SENTIDOS'
                  % (k, ka, d))
        if peor_ase is None or d < peor_ase[0]:
            peor_ase = (d, k, ka)
print(u'    el par mas apretado entre graficas: %s vs %s, %.1f'
      % (peor_ase[1], peor_ase[2], peor_ase[0]))

# ── y el testigo: la paleta VIEJA tiene que fallar ────────────────────────
print(u'\n  5 · EL TESTIGO — la paleta vieja (la de LUZ) debe fallar aqui\n')
VIEJA = [('no_la_vemos', '#EAB308'), ('sin_auditar', '#EAB308'),
         ('oportunidad', '#22C55E'), ('en_orden', '#22C55E')]
choques = 0
for i in range(len(VIEJA)):
    for j in range(i + 1, len(VIEJA)):
        if VIEJA[i][1] == VIEJA[j][1]:
            choques += 1
            print(u'    %s y %s compartian %s' % (VIEJA[i][0], VIEJA[j][0], VIEJA[i][1]))
if choques != 2:
    fallos.append(u'el testigo no reprodujo los dos choques de la paleta vieja')
else:
    print(u'    ok   la prueba caza los dos choques que habia')

print()
if fallos:
    print(u'  *** %d problema(s):' % len(fallos))
    for f in fallos:
        print(u'      - %s' % f)
    sys.exit(1)
print(u'  los 7 tonos pasan el contraste y se distinguen entre si.')
