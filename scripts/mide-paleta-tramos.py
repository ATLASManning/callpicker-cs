# -*- coding: utf-8 -*-
"""Los tres tramos del módulo de activaciones grandes, calculados.

   POR QUE EXISTE
   --------------
   El módulo parte las 143 activaciones de más de $3,500 en tres tramos por
   importe —$3,500–5,000 (54), $5,000–10,000 (62) y >$10,000 (27)— y los apila
   en dos barras al 100%: una reparte las activaciones y la otra el dinero. La
   asimetría ENTRE las dos barras es el hallazgo entero del bloque.

   Un tramo es una variable **ORDENADA**, así que sus tres colores tienen que
   ser tres pasos de un mismo tono, de claro a oscuro, y no tres matices
   distintos: con tres matices el lector no sabe cuál tramo es el grande.
   Eso ya lo exige la regla del proyecto y la de dataviz.

   Y hay dos trampas que sólo se ven midiendo:

   1. **Sobre BLANCO casi ningún paso claro llega a 3:1.** `#60A5FA` —un azul
      que a ojo parece perfectamente visible— mide 2.54:1 contra el blanco de
      la tarjeta. Un segmento de barra es un objeto gráfico que comunica, así
      que el mínimo es 3:1.
   2. **Tres pasos del mismo tono se parecen entre sí por construcción**, que
      es justo lo que se quiere para que se lean como escala, pero si se juntan
      demasiado dejan de distinguirse. Van PEGADOS en la pila, sin frontera más
      allá de los 2px de blanco, así que se les exige la separación de pares
      adyacentes.

   Y una tercera que ya costó una ronda en el Dashboard: un color de tramo no
   puede coincidir con un color de las paletas que ya viven en esta pantalla
   (ejecutivo, vendedor, giro, tamaño), porque las pastillas de la tabla de
   «quién las trae» se ven al mismo tiempo que las barras.

   Es de SOLO LECTURA: mide candidatos y dice cuál sirve.

   USO
   ---
       python scripts/mide-paleta-tramos.py
"""
import io
import math
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

FONDO = '#FFFFFF'          # las tarjetas de esta pantalla son blancas
MIN_CONTRASTE = 3.0        # objeto gráfico que comunica
MIN_DE_ADYACENTE = 10.0    # se tocan en la pila
MIN_DE_OTRAS = 8.0         # contra las paletas que ya están en pantalla

# Candidatos: rampas de UN tono, de claro a oscuro. Se prueban varias porque
# la que parece obvia casi nunca pasa el 3:1 en su paso claro.
CANDIDATAS = [
    ('azul tailwind 400/600/900',  ['#60A5FA', '#2563EB', '#1E3A8A']),
    ('azul tailwind 500/700/950',  ['#3B82F6', '#1D4ED8', '#172554']),
    ('azul de marca 0057FF',       ['#4D8DFF', '#0057FF', '#002A80']),
    ('azul frio 500/700/900',      ['#0EA5E9', '#0369A1', '#082F49']),
    ('indigo 500/700/950',         ['#6366F1', '#4338CA', '#1E1B4B']),
    ('pizarra 500/700/900',        ['#64748B', '#334155', '#0F172A']),
    # La primera ronda dejó sólo «pizarra 500/700/900», y su paso 3 es
    # EXACTAMENTE `TX` (#0F172A), el color del texto de la pantalla: un
    # segmento relleno del mismo tono que las letras se lee como un hueco.
    # Así que se prueban familias que las paletas de esta pantalla no usan.
    ('pizarra 500/700/800',        ['#64748B', '#334155', '#1E293B']),
    ('cian oscuro 600/800/950',    ['#0891B2', '#155E75', '#083344']),
    ('azul 600/900/950',           ['#2563EB', '#1E3A8A', '#0C1838']),
    ('pizarra con azul al fondo',  ['#64748B', '#3F5C8A', '#15264D']),
]

# Las paletas que YA viven en `components/charts/ActivacionesCharts.tsx`.
YA_EN_PANTALLA = [
    ('Fátima', '#A855F7'), ('Dan', '#0EA5E9'), ('Claudia', '#F97316'),
    ('Monse', '#22C55E'), ('José', '#F59E0B'), ('Ignacio', '#14B8A6'),
    ('Jorge', '#EC4899'), ('Marina', '#84CC16'), ('Brunno', '#6366F1'),
    ('Diego', '#F43F5E'), ('M. Mandujano', '#8B5CF6'),
    ('Pepe Toño', '#F59E0B'), ('Cecilia', '#EC4899'), ('Ricardo', '#14B8A6'),
    ('Enrique', '#8B5CF6'), ('Toño del Río', '#F97316'),
    ('micro', '#3B82F6'), ('pequeña', '#22C55E'), ('mediana', '#F97316'),
    ('grande', '#A855F7'), ('corporativo', '#EC4899'),
    ('Servicios', '#3B82F6'), ('Gobierno', '#0EA5E9'), ('acento', '#0057FF'),
]


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
    """sRGB -> OKLab, la fórmula de Björn Ottosson.

       En RGB la distancia no se parece a lo que el ojo ve, y aquí se están
       comparando tres pasos del mismo tono: es exactamente el caso donde RGB
       miente más.
    """
    r, g, b = (lineal(c) for c in hx(h))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (x ** (1.0 / 3.0) if x > 0 else -((-x) ** (1.0 / 3.0))
                  for x in (l, m, s))
    return (0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_)


def de(a, b):
    pa, pb = oklab(a), oklab(b)
    return 100.0 * math.sqrt(sum((pa[i] - pb[i]) ** 2 for i in range(3)))


def blanco_sirve(fondo):
    """¿El blanco se lee sobre este relleno? Decide la letra de la etiqueta."""
    return contraste('#FFFFFF', fondo) >= 4.5


ganadoras = []
for nombre, rampa in CANDIDATAS:
    print(u'\n  ── %s ─────────────────────────────────' % nombre)
    problemas = []

    # 1 · contra el blanco de la tarjeta
    for i, c in enumerate(rampa):
        r = contraste(c, FONDO)
        ok = r >= MIN_CONTRASTE
        if not ok:
            problemas.append(u'el paso %d (%s) mide %.2f:1 sobre blanco' % (i + 1, c, r))
        print(u'     paso %d  %s  %5.2f:1 sobre blanco  %s   letra: %s'
              % (i + 1, c, r, u'ok' if ok else u'*** POR DEBAJO DE 3',
                 u'blanca' if blanco_sirve(c) else u'oscura'))

    # 2 · ¿es una rampa de verdad? la luminancia tiene que BAJAR siempre
    lums = [lum(c) for c in rampa]
    if not all(lums[i] > lums[i + 1] for i in range(len(lums) - 1)):
        problemas.append(u'no es una rampa: la luminancia no baja de forma monótona')
    print(u'     luminancia: %s  %s'
          % (u' > '.join(u'%.3f' % x for x in lums),
             u'baja siempre' if all(lums[i] > lums[i + 1] for i in range(len(lums) - 1))
             else u'*** NO ES UNA RAMPA'))

    # 3 · separación entre los que se TOCAN en la pila
    for i in range(len(rampa) - 1):
        d = de(rampa[i], rampa[i + 1])
        ok = d >= MIN_DE_ADYACENTE
        if not ok:
            problemas.append(u'los pasos %d y %d sólo se separan %.1f' % (i + 1, i + 2, d))
        print(u'     pasos %d-%d separación %5.1f  %s'
              % (i + 1, i + 2, d, u'ok' if ok else u'*** SE CONFUNDEN'))

    # 4 · contra lo que ya está en pantalla
    peor = None
    for c in rampa:
        for etq, otro in YA_EN_PANTALLA:
            d = de(c, otro)
            if peor is None or d < peor[0]:
                peor = (d, c, etq, otro)
    if peor[0] < MIN_DE_OTRAS:
        problemas.append(u'%s choca con «%s» (%s): %.1f'
                         % (peor[1], peor[2], peor[3], peor[0]))
    print(u'     lo más cerca de una paleta existente: %.1f  (%s vs «%s» %s)  %s'
          % (peor[0], peor[1], peor[2], peor[3],
             u'ok' if peor[0] >= MIN_DE_OTRAS else u'*** CHOCA'))

    if problemas:
        for p in problemas:
            print(u'     -> %s' % p)
    else:
        print(u'     PASA TODO')
        ganadoras.append((nombre, rampa))

print(u'\n  ════════════════════════════════════════════')
if not ganadoras:
    print(u'  *** ninguna candidata pasa. Hay que proponer más pasos.')
    sys.exit(1)
print(u'  %d candidata(s) sirven:' % len(ganadoras))
for nombre, rampa in ganadoras:
    print(u'     %-28s %s' % (nombre, u' '.join(rampa)))
print(u'\n  LA ELEGIDA (10 oct 2026): cian oscuro 600/800/950')
print(u'     #0891B2  3.68:1  letra OSCURA dentro del segmento')
print(u'     #155E75  7.27:1  letra blanca')
print(u'     #083344 13.40:1  letra blanca')
print(u'  Se descartó «pizarra 500/700/900», que también pasa, porque su paso 3')
print(u'  es exactamente `TX` (#0F172A): un segmento del color de las letras.')
print(u'  Vive en `components/charts/ActivacionesGrandes.tsx` con este script')
print(u'  citado al lado, para que nadie la «mejore» a ojo.')
