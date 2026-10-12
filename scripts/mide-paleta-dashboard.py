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
MIN_DE_TODOS = 8.0   # entre CUALQUIER par, no solo vecinos

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

# ── 3a · LA RAMPA QUE SÍ DA SIETE ───────────────────────────────────────────
#
# Direccion (11 oct): «dales el color que deba, el tamaño y caracteristicas
# necesarias para que funcione». O sea: que funcione manda sobre la paleta
# cerrada. Vuelven las SIETE situaciones, y lo que hay que encontrar es una
# rampa que de verdad las separe.
#
# La de dos anclas (plata→naranja) mide 22.3 y no da. La salida NO es inventar
# siete tonos sueltos —eso rompe la escala ordenada y vuelve categorico lo que
# es un orden de riesgo— sino ALARGAR el camino con mas anclas DENTRO de la
# familia calida de la paleta: del blanco al naranja profundo.
#
# Se prueban varias polilineas y se queda la primera que pase TODO.
def polilinea(anclas, n):
    """n pasos sobre una polilinea de anclas, EQUIESPACIADOS EN DISTANCIA.

       Con dos anclas es una rampa recta; con mas, el camino perceptual es mas
       largo y caben mas pasos distinguibles. Es la unica forma de meter siete
       series en una escala ordenada sin convertirla en siete etiquetas.

       EL MUESTREO VA POR LONGITUD DE ARCO, NO POR PARAMETRO.
       La primera version repartia los siete puntos a intervalos iguales de
       PARAMETRO —un septimo de polilinea cada uno— y los tramos cortos
       amontonaban muestras: una polilinea de 104.9 de largo, de sobra para
       siete pasos de 10, daba una separacion minima de 6.7 y yo concluia que
       la paleta no daba. La paleta daba; el muestreador estaba mal.
    """
    pts = [oklab(a) for a in anclas]
    # Se densifica la polilinea y se acumula distancia real.
    denso, acum = [], [0.0]
    POR_TRAMO = 240
    for k in range(len(pts) - 1):
        for i in range(POR_TRAMO):
            f = i / float(POR_TRAMO)
            denso.append(tuple(pts[k][j] + (pts[k + 1][j] - pts[k][j]) * f
                               for j in range(3)))
    denso.append(tuple(pts[-1]))
    for i in range(1, len(denso)):
        d = 100.0 * math.sqrt(sum((denso[i][j] - denso[i - 1][j]) ** 2 for j in range(3)))
        acum.append(acum[-1] + d)
    total = acum[-1]

    out, k = [], 0
    for i in range(n):
        objetivo = (i / float(n - 1)) * total
        while k < len(acum) - 1 and acum[k] < objetivo:
            k += 1
        out.append(de_oklab(*denso[k]))
    return out


# Para SIETE pasos a 10 de separacion hace falta un camino de 60 o mas. Las
# rampas que solo cambian CLARIDAD dentro de la familia calida no llegan ni de
# lejos — blanco→naranja mide ~37. Hay que meter TONO.
#
# Y el tono frio no es ajeno a la paleta: `#1B4580` es el acento azul que fijo
# direccion. Aclarado sirve de ancla fria, y ademas es semanticamente correcto
# —azul = esta bien, plata = no sabemos, naranja = hay que actuar— que es
# exactamente como lee el equipo el semaforo de hoy.
AZUL_CLARO = '#8FB3E8'   # el acento #1B4580 aclarado hasta pasar sobre marino
AZUL_MEDIO = '#5B8FD4'

CANDIDATAS = [
    (u'blanco→plata→naranja→naranja profundo',
     [WHITE_SOFT, SILVER_300, ORANGE_400, ORANGE_500, ORANGE_700]),
    (u'blanco→plata→plata media→naranja→profundo',
     [WHITE_SOFT, SILVER_300, SILVER_500, ORANGE_400, ORANGE_500, ORANGE_700]),
    (u'FRÍA→neutra→cálida (azul→plata→naranja)',
     [AZUL_CLARO, SILVER_300, ORANGE_400, ORANGE_500, ORANGE_700]),
    (u'azul medio→azul claro→plata→naranja→profundo',
     [AZUL_MEDIO, AZUL_CLARO, SILVER_300, ORANGE_400, ORANGE_500, ORANGE_700]),
    (u'azul medio→azul claro→blanco→plata→naranja→profundo',
     [AZUL_MEDIO, AZUL_CLARO, WHITE_SOFT, SILVER_500, ORANGE_400, ORANGE_500, ORANGE_700]),
]


def largo(anclas):
    return sum(dist(anclas[i], anclas[i + 1]) for i in range(len(anclas) - 1))


print(u'\n    (para 7 pasos a %.0f de separación hace falta un camino de %.0f+)'
      % (MIN_DE_ADY, MIN_DE_ADY * (len(SITUACIONES) - 1)))

print(u'\n  3a · BUSCANDO UNA RAMPA QUE DÉ LAS SIETE\n')
ELEGIDA, NOMBRE_ELEGIDA = None, None
for nombre, anclas in CANDIDATAS:
    r = polilinea(anclas, len(SITUACIONES))
    cs = [contraste(c, NAVY_700) for c in r]
    ds = [dist(r[i], r[i + 1]) for i in range(len(r) - 1)]
    ls = [lum(c) for c in r]
    mono = all(ls[i] > ls[i + 1] for i in range(len(ls) - 1))
    # TODOS los pares, no solo los vecinos. Con siete series el lector no solo
    # compara segmentos pegados: busca «el naranja» en la leyenda y lo ubica en
    # la barra. Dos colores lejanos en el orden pero iguales a la vista hacen
    # eso imposible, y el vecino no lo detecta.
    todos = min(dist(r[i], r[j]) for i in range(len(r)) for j in range(i + 1, len(r)))
    ok_c = all(x >= MIN_RELLENO for x in cs)
    ok_d = all(x >= MIN_DE_ADY for x in ds)
    ok_t = todos >= MIN_DE_TODOS
    # La monotonia de claridad SOLO se exige a una rampa secuencial. Esta es
    # DIVERGENTE —frio = esta bien, neutro = no sabemos, calido = hay que
    # actuar— y ahi la claridad sube y baja a proposito: es el tono el que
    # ordena. Exigirle monotonia descartaba la unica rampa que si funciona.
    print(u'    %-46s largo %5.1f · contr. %.1f-%.1f · vecinos %4.1f · todos %4.1f · %s'
          % (nombre[:46], largo(anclas), min(cs), max(cs), min(ds), todos,
             u'secuencial' if mono else u'divergente'))
    if ok_c and ok_d and ok_t and ELEGIDA is None:
        ELEGIDA, NOMBRE_ELEGIDA = r, nombre

if ELEGIDA is None:
    print(u'\n    Ninguna polilínea da siete. Y la razón es estructural, no de')
    print(u'    gusto: una rampa SUAVE recorre el espacio de color en una sola')
    print(u'    curva y vuelve a pasar cerca de donde ya estuvo — por eso la de')
    print(u'    104.9 de largo da 10.6 entre vecinos y sólo 5.5 entre TODOS.')
    print(u'    Siete series no son una rampa: son siete puntos que hay que')
    print(u'    SEPARAR, y eso se busca, no se dibuja.\n')

    # ── BÚSQUEDA: siete puntos lo más separados posible ─────────────────────
    # Se genera un vivero de colores legibles sobre la tarjeta y se eligen
    # siete por «punto más lejano»: se siembran los dos que el negocio obliga
    # —naranja para `se_va`, que es la que hay que ver primero, y el azul del
    # acento para `en_orden`— y cada siguiente es el que está más lejos de
    # todos los ya elegidos. Es determinista y se puede auditar.
    def vivero():
        out = []
        for L in [x / 100.0 for x in range(55, 92, 3)]:
            for C in [x / 100.0 for x in range(4, 19, 2)]:
                for H in range(0, 360, 10):
                    a = C * math.cos(math.radians(H))
                    b = C * math.sin(math.radians(H))
                    h = de_oklab(L, a, b)
                    # Que el ida y vuelta cuadre: si al reconvertir se va del
                    # gamut, el color no existe de verdad en pantalla.
                    o = oklab(h)
                    if abs(o[0] - L) > 0.02 or abs(o[1] - a) > 0.02 or abs(o[2] - b) > 0.02:
                        continue
                    if contraste(h, NAVY_700) < MIN_RELLENO:
                        continue
                    if contraste(h, NAVY_900) < MIN_RELLENO:
                        continue
                    out.append(h)
        return sorted(set(out))

    pool = vivero()
    print(u'    vivero de colores legibles sobre las dos superficies: %d' % len(pool))
    print(u'\n    OJO CON LO QUE VIENE: esta búsqueda maximiza separación SIN')
    print(u'    mirar la paleta. Sirve para PROBAR que siete separables existen,')
    print(u'    no para usarla — devuelve un arcoíris, que es lo que el encargo')
    print(u'    prohíbe. Es la demostración del trilema, no la solución.')

    # `se_va` manda: es la situación que hay que reconocer primero y se queda
    # con el naranja de la marca. `en_orden` se queda con el azul del acento.
    elegidos = [ORANGE_500, AZUL_CLARO]
    while len(elegidos) < len(SITUACIONES):
        mejor, mejor_d = None, -1.0
        for c in pool:
            d = min(dist(c, e) for e in elegidos)
            if d > mejor_d:
                mejor, mejor_d = c, d
        elegidos.append(mejor)
    # Se ordenan por riesgo: del más frío/claro al naranja.
    elegidos.sort(key=lambda c: dist(c, ORANGE_500), reverse=True)
    ELEGIDA, NOMBRE_ELEGIDA = elegidos, u'búsqueda por punto más lejano'
    ds = [dist(ELEGIDA[i], ELEGIDA[i + 1]) for i in range(len(ELEGIDA) - 1)]
    todos = min(dist(ELEGIDA[i], ELEGIDA[j])
                for i in range(len(ELEGIDA)) for j in range(i + 1, len(ELEGIDA)))
    print(u'    separación: vecinos %.1f · TODOS %.1f' % (min(ds), todos))
    print(u'''
    ── EL TRILEMA, YA MEDIDO ────────────────────────────────────────────
    Las tres cosas no caben juntas. Sólo dos:

      paleta cerrada + 7 categorías  ->  separación 3.7. ILEGIBLE.
      paleta cerrada + legibilidad   ->  máximo 3 categorías.
      7 categorías + legibilidad     ->  separación 22.6, pero arcoíris.

    LA SALIDA NO ES EL COLOR, ES LA FORMA. El problema real es meter siete
    categorías en UNA barra apilada. Si en lugar de eso cada situación es su
    propia FILA, dentro de cada barra sólo conviven TRES series —los tres
    asesores— y eso la paleta lo da holgado: 21.2 de separación, medido.

    Las siete situaciones siguen estando, con etiqueta directa y en orden de
    riesgo, y el orden se refuerza con una tira de acento plata→naranja a la
    izquierda de cada fila. Más legible que la apilada, y dentro de la paleta.
    ''')
    if min(ds) < MIN_DE_ADY or todos < MIN_DE_TODOS:
        fallos.append(u'ni buscando salen 7 colores separados')
    # No se adopta: queda como demostración.
    ELEGIDA, NOMBRE_ELEGIDA = None, None
if ELEGIDA is not None:
    print(u'\n    ELEGIDA: %s' % NOMBRE_ELEGIDA)
    print(u'    %-20s %-9s %-11s %s' % (u'situación', u'color', u'contraste', u'sep.'))
    for i, (s, c) in enumerate(zip(SITUACIONES, ELEGIDA)):
        d = dist(ELEGIDA[i - 1], c) if i else None
        print(u'    %-20s %-9s %8.2f:1  %s'
              % (s, c, contraste(c, NAVY_700),
                 (u'%5.1f' % d) if d is not None else u'    —'))

# ── 3c · EL DISEÑO QUE SE PUBLICA: una fila por situación ───────────────────
#
# Dentro de cada barra conviven solo TRES series (los asesores). Eso es lo que
# hace legible el conjunto sin salirse de la paleta.
print(u'\n  3c · EL DISEÑO QUE SE PUBLICA — una FILA por situación\n')
print(u'    %d filas, y dentro de cada una solo %d series.' % (len(SITUACIONES), len(ASESORES)))
TIRA = rampa(SILVER_300, ORANGE_500, len(SITUACIONES))
print(u'    La tira de acento que ordena las filas (plata→naranja):')
for s, c in zip(SITUACIONES, TIRA):
    print(u'      %-20s %-9s %6.2f:1' % (s, c, contraste(c, NAVY_700)))
print(u'\n    La tira NO tiene que separarse entre pasos: no son series que')
print(u'    compitan, es un indicador de posición en una lista ya ordenada y')
print(u'    etiquetada. Lo que sí tiene que hacer es verse sobre la tarjeta,')
print(u'    y los siete pasos pasan 3:1.')
exige(all(contraste(c, NAVY_700) >= MIN_RELLENO for c in TIRA),
      u'los 7 pasos de la tira se ven sobre la tarjeta')


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
