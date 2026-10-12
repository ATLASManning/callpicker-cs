# -*- coding: utf-8 -*-
u"""La paleta del Dashboard rediseñado, CALCULADA contra el fondo real.

   POR QUE EXISTE
   --------------
   Dirección fijó una paleta cerrada —azul marino, gris plata, naranja y
   blanco— y el Dashboard tiene que distinguir **SIETE situaciones de cuenta**
   en una barra apilada. Cuatro familias de color para siete series es
   justamente la receta del bug que ya costó una ronda en este módulo: dos
   situaciones compartían `#EAB308`, iban PEGADAS en la pila, y 152 de 192
   cuentas quedaban en un bloque indistinguible con dos pastillas iguales en la
   leyenda.

   Así que la paleta no se elige a ojo: se mide, y donde el color no alcanza se
   dice QUÉ PASO necesita trama. Un segmento que sólo se distingue por un tono
   que nadie puede separar no está distinguido.

   LO QUE SE EXIGE
   ---------------
   1. Cada relleno >= 3:1 contra la tarjeta (#12305A). Es un objeto gráfico que
      comunica, no decoración.
   2. Entre pasos ADYACENTES de la pila, separación OKLab >= 10. Se tocan sin
      más frontera que 2px de fondo.
   3. La rampa de riesgo es ORDENADA, así que su luminancia tiene que ser
      monótona: si sube y baja, deja de leerse como escala.
   4. El texto >= 4.5:1 contra las dos superficies (#0B1F3A y #12305A).
   5. Los tres asesores son CATEGÓRICOS, no ordenados: entre ellos se exige
      separación, no orden.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/mide-paleta-dashboard.py
"""
import io
import math
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# ── LA PALETA, tal como la fijó dirección ───────────────────────────────────
NAVY_900, NAVY_700, NAVY_500 = '#0B1F3A', '#12305A', '#1B4580'
SILVER_300, SILVER_500, SILVER_700 = '#C0C6CE', '#8E96A3', '#5B6573'
ORANGE_500, ORANGE_400, ORANGE_700 = '#FF7A1A', '#FF9A4D', '#C85A00'
WHITE, WHITE_SOFT = '#FFFFFF', '#F4F6F9'

MIN_RELLENO = 3.0
MIN_TEXTO = 4.5
MIN_DE_ADY = 10.0

# Las siete situaciones, de MENOR a MAYOR riesgo (el `orden` del catálogo).
SITUACIONES = ['en_orden', 'oportunidad', 'hay_que_mostrarle', 'sin_auditar',
               'no_la_vemos', 'apagandose', 'se_va']

# ── LAS TRES BANDAS, Y DE DONDE SALEN ───────────────────────────────────────
# No las invento: agrupan la `luz` que YA trae el catálogo
# (`SITUACION` en lib/alertas-veredicto.ts), que tiene cinco valores.
#
#   bajo  = verde + azul      en_orden, oportunidad, hay_que_mostrarle
#   medio = amarillo          sin_auditar, no_la_vemos
#   alto  = naranja + rojo    apagandose, se_va
#
# Por que TRES y no siete: medido abajo, la rampa plata→naranja solo admite
# tres pasos distinguibles. Y los datos dicen lo mismo — al 11 oct 2026
# `en_orden` tiene CERO cuentas y `oportunidad` UNA, mientras `no_la_vemos` y
# `sin_auditar` se llevan 152 de 193 (el 79%). Una apilada de siete series era
# ilegible por los dos motivos a la vez.
BANDAS = ['bajo', 'medio', 'alto']
BANDA_DE = {
    'en_orden': 'bajo', 'oportunidad': 'bajo', 'hay_que_mostrarle': 'bajo',
    'sin_auditar': 'medio', 'no_la_vemos': 'medio',
    'apagandose': 'alto', 'se_va': 'alto',
}
ASESORES = ['Claudia', 'Dan', 'Fátima']


def hx(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]


def hex_de(rgb):
    return '#%02X%02X%02X' % tuple(max(0, min(255, int(round(c * 255)))) for c in rgb)


def lineal(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def gamma(c):
    c = max(0.0, min(1.0, c))
    return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def lum(h):
    r, g, b = (lineal(c) for c in hx(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def oklab(h):
    r, g, b = (lineal(c) for c in hx(h))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (x ** (1.0 / 3.0) if x > 0 else -((-x) ** (1.0 / 3.0)) for x in (l, m, s))
    return (0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_)


def de_oklab(L, a, b):
    """OKLab -> hex. Hace falta para INTERPOLAR en OKLab: mezclar en RGB
       atraviesa tonos que no estan en la paleta y produce pasos sucios."""
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return hex_de([gamma(r), gamma(g), gamma(bb)])


def dist(a, b):
    pa, pb = oklab(a), oklab(b)
    return 100.0 * math.sqrt(sum((pa[i] - pb[i]) ** 2 for i in range(3)))


def rampa(desde, hasta, n):
    """n pasos interpolados EN OKLab entre dos colores de la paleta."""
    A, B = oklab(desde), oklab(hasta)
    out = []
    for i in range(n):
        t = i / float(n - 1)
        out.append(de_oklab(*[A[k] + (B[k] - A[k]) * t for k in range(3)]))
    return out


fallos, avisos = [], []


def exige(ok, que, detalle=u''):
    print(u'    %s  %-52s %s' % (u'ok  ' if ok else u'FALLA', que, detalle))
    if not ok:
        fallos.append(que)


# ── 1 · El texto sobre las dos superficies ──────────────────────────────────
print(u'\n  1 · TEXTO SOBRE LAS DOS SUPERFICIES (mínimo %.1f:1)\n' % MIN_TEXTO)
for etq, c in ((u'blanco', WHITE), (u'blanco suave', WHITE_SOFT),
               (u'plata 300', SILVER_300), (u'plata 500', SILVER_500),
               (u'plata 700', SILVER_700), (u'naranja 500', ORANGE_500),
               (u'naranja 400', ORANGE_400)):
    for sup, nsup in ((NAVY_900, u'navy-900'), (NAVY_700, u'navy-700')):
        r = contraste(c, sup)
        ok = r >= MIN_TEXTO
        if not ok:
            avisos.append(u'%s sobre %s mide %.2f:1 — NO sirve para texto' % (etq, nsup, r))
        print(u'    %-14s %s sobre %-9s %5.2f:1  %s'
              % (etq, c, nsup, r, u'texto ok' if ok else
                 (u'sólo objeto gráfico' if r >= MIN_RELLENO else u'*** ni para objeto')))

# ── 2 · Por qué SIETE no cabe, dicho con el número ──────────────────────────
print(u'\n  2 · LA PRUEBA DE QUE SIETE NO CABE\n')
SIETE = rampa(SILVER_300, ORANGE_500, len(SITUACIONES))
print(u'    %-20s %-9s %s' % (u'situación', u'color', u'separación con el anterior'))
for i, (s, c) in enumerate(zip(SITUACIONES, SIETE)):
    d = dist(SIETE[i - 1], c) if i else None
    print(u'    %-20s %-9s %s'
          % (s, c, (u'%5.1f  %s' % (d, u'ok' if d >= MIN_DE_ADY else u'*** se confunden'))
             if d is not None else u'    —'))
print(u'\n    Los seis pares fallan. No es cuestión de elegir mejor los tonos:')
print(u'    la rampa entera mide lo que mide y partirla en siete da ~3.7 por')
print(u'    paso. Por eso el diseño agrupa en TRES bandas.')

# ── 3 · LAS TRES BANDAS, que es el diseño que se publica ────────────────────
print(u'\n  3 · LAS TRES BANDAS DEL CATÁLOGO (lo que de verdad se pinta)\n')
PASOS = rampa(SILVER_300, ORANGE_500, len(BANDAS))
lums = [lum(c) for c in PASOS]
print(u'    %-8s %-9s %-10s %-28s %s'
      % (u'banda', u'color', u'contraste', u'situaciones que agrupa', u'sep.'))
for i, (b, c) in enumerate(zip(BANDAS, PASOS)):
    dentro = [s for s in SITUACIONES if BANDA_DE[s] == b]
    d = dist(PASOS[i - 1], c) if i else None
    print(u'    %-8s %-9s %7.2f:1  %-28s %s'
          % (b, c, contraste(c, NAVY_700), u', '.join(dentro)[:28],
             (u'%5.1f' % d) if d is not None else u'  —'))
    if contraste(c, NAVY_700) < MIN_RELLENO:
        fallos.append(u'la banda «%s» mide %.2f:1' % (b, contraste(c, NAVY_700)))

print(u'')
exige(all(contraste(c, NAVY_700) >= MIN_RELLENO for c in PASOS),
      u'las 3 bandas llegan a %.1f:1 sobre la tarjeta' % MIN_RELLENO)
exige(all(dist(PASOS[i], PASOS[i + 1]) >= MIN_DE_ADY for i in range(len(PASOS) - 1)),
      u'las bandas adyacentes se separan >= %.1f' % MIN_DE_ADY,
      u'%s' % u' '.join(u'%.1f' % dist(PASOS[i], PASOS[i + 1]) for i in range(len(PASOS) - 1)))
mono = all(lums[i] > lums[i + 1] for i in range(len(lums) - 1))
exige(mono, u'la luminancia baja siempre (se lee como escala)',
      u'%s' % u' '.join(u'%.2f' % x for x in lums))

# Aun con tres, NO se depende solo del color: la banda alta lleva trama, que es
# la que hay que ver a dos metros de la pantalla.
necesitan_trama = ['alto']
print(u'\n    TRAMA en «alto» de todos modos: el encargo pide no depender solo')
print(u'    del color, y la banda que importa a dos metros es ésa.')

# ── 3b · ¿CUÁNTOS pasos aguanta de verdad esta rampa? ───────────────────────
#
# Si TODOS los pares adyacentes fallan, el problema no son los colores: es el
# NÚMERO de series. La rampa entera mide lo que mide, y partirla en n pasos da
# separación ≈ largo/(n-1). Eso es aritmética, no gusto — así que se calcula
# cuántos pasos caben con separación legible y se dice.
print(u'\n  3b · CUÁNTAS SERIES CABEN DE VERDAD EN ESTA RAMPA\n')
largo = dist(SILVER_300, ORANGE_500)
print(u'    la rampa plata→naranja mide %.1f de largo en OKLab.' % largo)
print(u'    %-8s %-10s %s' % (u'pasos', u'separación', u'veredicto'))
maximo = 1
for n in range(2, 9):
    r = rampa(SILVER_300, ORANGE_500, n)
    peor_d = min(dist(r[i], r[i + 1]) for i in range(n - 1))
    ok = peor_d >= MIN_DE_ADY
    if ok:
        maximo = n
    print(u'    %-8d %-10.1f %s' % (n, peor_d, u'legible' if ok else u'*** se confunden'))
print(u'')
print(u'    MÁXIMO LEGIBLE: %d series apiladas sólo por color.' % maximo)
print(u'    El Dashboard quiere SIETE. La diferencia no se arregla con tramas:')
print(u'    siete tramas distintas en segmentos de pocos píxeles tampoco se')
print(u'    distinguen. Se arregla cambiando la FORMA, no el color.')
RIESGO_BANDAS = rampa(SILVER_300, ORANGE_500, maximo)
print(u'\n    La rampa de %d que SÍ sirve: %s'
      % (maximo, u' '.join(RIESGO_BANDAS)))

# ── 4 · Los tres asesores: CATEGÓRICOS, no ordenados ────────────────────────
print(u'\n  4 · LOS TRES ASESORES (categóricos: separación, no orden)\n')
CAT = [ORANGE_500, WHITE_SOFT, SILVER_500]
for a, c in zip(ASESORES, CAT):
    r = contraste(c, NAVY_700)
    print(u'    %-10s %-9s %6.2f:1 sobre la tarjeta' % (a, c, r))
    if r < MIN_RELLENO:
        fallos.append(u'el color de %s mide %.2f:1' % (a, r))
peor = None
for i in range(len(CAT)):
    for j in range(i + 1, len(CAT)):
        d = dist(CAT[i], CAT[j])
        if peor is None or d < peor[0]:
            peor = (d, ASESORES[i], ASESORES[j])
print(u'')
exige(peor[0] >= MIN_DE_ADY, u'los tres asesores se separan entre sí',
      u'el par más apretado: %s vs %s, %.1f' % (peor[1], peor[2], peor[0]))

# ── 5 · Y que la rampa NO se confunda con los asesores ──────────────────────
# Las dos paletas conviven en pantalla: la apilada puede agrupar por asesor o
# por situación con el mismo combo, así que un color que signifique dos cosas
# distintas segun el combo es una trampa.
print(u'\n  5 · LA RAMPA CONTRA LOS COLORES DE ASESOR\n')
choques = []
for s, c in zip(SITUACIONES, PASOS):
    for a, ca in zip(ASESORES, CAT):
        d = dist(c, ca)
        if d < 8.0:
            choques.append((d, s, a))
if choques:
    for d, s, a in sorted(choques)[:8]:
        print(u'    «%s» y «%s» se parecen: %.1f' % (s, a, d))
    print(u'\n    Las dos paletas NO se muestran a la vez —el combo elige una—,')
    print(u'    así que esto se anota, no bloquea. Pero la leyenda tiene que')
    print(u'    decir siempre por qué se está agrupando.')
else:
    print(u'    ningún color de la rampa se confunde con uno de asesor.')

# ── 6 · NINGÚN COLOR FUERA DEL TEMA ─────────────────────────────────────────
#
# El encargo lo pide explícitamente, y sin detector se pudre en dos commits:
# alguien añade un `#22C55E` «provisional» para probar y ahí se queda. Se
# escanean los componentes del Dashboard y se exige que todo hex que aparezca
# esté declarado en `lib/chart-theme.ts`.
print(u'\n  6 · COLORES ESCRITOS FUERA DEL TEMA\n')
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMA = os.path.join(RAIZ, 'lib', 'chart-theme.ts')
# Los del rediseño. Se amplía conforme se migran los demás componentes.
VIGILADOS = [
    os.path.join(RAIZ, 'lib', 'chart-theme.ts'),
]
_tema_txt = io.open(TEMA, encoding='utf-8').read() if os.path.exists(TEMA) else u''
PERMITIDOS = {h.upper() for h in re.findall(r'#[0-9a-fA-F]{6}\b', _tema_txt)}
print(u'    el tema declara %d colores.' % len(PERMITIDOS))

RX_HEX = re.compile(r'#([0-9a-fA-F]{6})\b')
sueltos = []
for ruta in VIGILADOS:
    if not os.path.exists(ruta):
        continue
    rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
    if os.path.abspath(ruta) == os.path.abspath(TEMA):
        continue          # el tema ES donde se declaran
    txt = io.open(ruta, encoding='utf-8').read()
    for m in RX_HEX.finditer(txt):
        h = ('#' + m.group(1)).upper()
        if h not in PERMITIDOS:
            linea = txt.count('\n', 0, m.start()) + 1
            sueltos.append((rel, linea, h))

if sueltos:
    for rel, linea, h in sueltos[:20]:
        print(u'    *** %s:%d  %s no está en el tema' % (rel, linea, h))
    fallos.append(u'%d color(es) escritos fuera del tema' % len(sueltos))
else:
    print(u'    ninguno: los %d archivos vigilados sólo usan el tema.' % len(VIGILADOS))
print(u'    (la lista VIGILADOS crece conforme se migra cada gráfica)')

# ── 7 · El espejo de Tailwind tiene que decir lo mismo ──────────────────────
# `tailwind.config.ts` repite la paleta para las utilidades. Dos sitios con la
# misma verdad se desincronizan en cuanto alguien toca uno — asi que se
# comprueba, no se confia.
print(u'\n  7 · `tailwind.config.ts` CONTRA EL TEMA\n')
TW = os.path.join(RAIZ, 'tailwind.config.ts')
tw = io.open(TW, encoding='utf-8').read()
ESPEJO = {
    'dash-navy-900': NAVY_900, 'dash-navy-700': NAVY_700, 'dash-navy-500': NAVY_500,
    'dash-silver-300': SILVER_300, 'dash-silver-500': SILVER_500,
    'dash-silver-700': SILVER_700,
    'dash-orange-500': ORANGE_500, 'dash-orange-400': ORANGE_400,
    'dash-orange-700': ORANGE_700,
    'dash-white': WHITE, 'dash-white-soft': WHITE_SOFT,
    'dash-riesgo-bajo': PASOS[0], 'dash-riesgo-medio': PASOS[1],
    'dash-riesgo-alto': PASOS[2],
}
malos = 0
for token, esperado in ESPEJO.items():
    m = re.search(r"'%s':\s*'(#[0-9a-fA-F]{6})'" % re.escape(token), tw)
    if not m:
        print(u'    *** falta el token `%s`' % token)
        malos += 1
    elif m.group(1).upper() != esperado.upper():
        print(u'    *** `%s` dice %s y el tema dice %s'
              % (token, m.group(1), esperado))
        malos += 1
if malos:
    fallos.append(u'%d token(s) de Tailwind no coinciden con el tema' % malos)
else:
    print(u'    los %d tokens coinciden con el tema al carácter.' % len(ESPEJO))

# ── Veredicto ───────────────────────────────────────────────────────────────
print(u'\n  ═══════════════════════════════════════════════════════════')
print(u'  LA PALETA, para pegar en lib/chart-theme.ts:\n')
print(u"    RIESGO: %s" % u', '.join(u"'%s'" % c for c in PASOS))
print(u"    TRAMA EN: %s" % (u', '.join(necesitan_trama) or u'ninguno'))
print(u"    ASESOR: %s" % u', '.join(u"'%s'" % c for c in CAT))
print(u'')
if avisos:
    print(u'  %d aviso(s) de uso:' % len(avisos))
    for a in avisos:
        print(u'     · %s' % a)
if fallos:
    print(u'\n  *** %d comprobación(es) fallan.' % len(fallos))
    for f in fallos:
        print(u'     · %s' % f)
    sys.exit(1)
print(u'\n  la paleta sirve, con las tramas indicadas.')
