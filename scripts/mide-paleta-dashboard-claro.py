# -*- coding: utf-8 -*-
u"""EL DASHBOARD COMO ISLA CLARA: la paleta DERIVADA, no elegida.

   POR QUE EXISTE
   --------------
   Direccion pidio (4 nov 2026) que el formato de color de Contratos se aplique
   «en toda la ventana del apartado, no solo en el titulo». El Dashboard era el
   ultimo modulo de ISLAS OSCURAS: tarjetas marino sobre pagina clara. Pasarlo a
   isla clara NO es cambiar unos tokens de sitio.

   LO QUE SE ROMPE AL VOLTEARLO, y por eso hace falta medir:

     · la paleta de series esta medida CONTRA MARINO. Sobre blanco,
       `WHITE.soft` (#F5F8FB) da 1.07:1 y `SILVER[500]` (#A8BACB) 1.95:1: dos
       de los tres asesores DESAPARECEN. Y el acento cian #39ABD8 da 2.63:1,
       que no llega ni al 3:1 de un objeto grafico.
     · los tintes `rgba(255,255,255,0.0X)` —hover, cebra, separadores— NO
       OSCURECEN NADA sobre claro: heredan el fondo de detras. Se ven igual que
       no ponerlos, y no falla nada. [[atlas-dashboard-contrast-architecture]]

   LO QUE SE EXIGE AQUI
   --------------------
   1. Todo relleno de barra >= 3:1 contra la tarjeta BLANCA. Es un objeto
      grafico que comunica, no decoracion (WCAG 1.4.11).
   2. Los tres asesores son CATEGORICOS: separacion OKLab >= 10 entre cada par.
   3. Las tres bandas son ORDENADAS: separacion >= 10 entre ADYACENTES y
      luminancia MONOTONA, o deja de leerse como escala.
   4. Texto >= 4.5:1 contra las DOS superficies claras (tarjeta #FFFFFF y
      lavado #F5F8FB), porque en el Dashboard conviven las dos.
   5. Nada se elige a ojo: los tonos salen de una busqueda sobre la familia
      cerrada del documento, no de mi criterio.

   Es de SOLO LECTURA. No escribe en ningun archivo.

   USO
       python -I scripts/mide-paleta-dashboard-claro.py
"""
import io
import math
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FALLOS = []


# ── Color: WCAG + OKLab ──────────────────────────────────────────────────────
def hx(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def hex_de(rgb):
    return '#%02X%02X%02X' % tuple(max(0, min(255, int(round(c)))) for c in rgb)


def _lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
    r, g, b = hx(h)
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def contraste(a, b):
    la, lb = lum(a), lum(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def oklab(h):
    r, g, b = [_lin(c) for c in hx(h)]
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = [math.copysign(abs(v) ** (1.0 / 3.0), v) for v in (l, m, s)]
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def de_oklab(L, a, b):
    """OKLab -> hex. Inversa de `oklab`, para poder generar tonos nuevos."""
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def gam(c):
        c = max(0.0, min(1.0, c))
        return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055

    return hex_de([gam(c) * 255 for c in (r, g, bb)])


def dist(a, b):
    """Separacion perceptual en OKLab x100. Umbral del proyecto: 10."""
    pa, pb = oklab(a), oklab(b)
    return 100 * math.sqrt(sum((x - y) ** 2 for x, y in zip(pa, pb)))


def mezcla(frente, fondo, alfa):
    """El color COMPUESTO de un tinte semitransparente sobre su fondo.
       Un tinte NO se mide por su hex: se mide por lo que de verdad se ve."""
    f, b = hx(frente), hx(fondo)
    return hex_de([f[i] * alfa + b[i] * (1 - alfa) for i in range(3)])


def exige(ok, que, detalle=u''):
    print(u'    %-5s %s' % (u'ok' if ok else u'FALLA', que))
    if detalle:
        print(u'          %s' % detalle)
    if not ok:
        FALLOS.append(que)


def par(rot, fg, bg, minimo):
    r = contraste(fg, bg)
    ok = r >= minimo - 1e-9
    print(u'  %-5s %-38s %s sobre %s  %6.2f:1  (min %s)'
          % (u'ok' if ok else u'FALLA', rot, fg, bg, r, minimo))
    if not ok:
        FALLOS.append(u'%s (%.2f:1 < %s)' % (rot, r, minimo))
    return r


# ── Las superficies claras del documento ─────────────────────────────────────
TARJETA = '#FFFFFF'   # la isla clara
LAVADO = '#F5F8FB'    # --wash, la pagina
LINEA = '#DFE8EF'     # --line

# Las anclas de la familia cerrada, del :root del documento.
NAVY2 = '#082742'
MARINO = '#10355D'
AZUL = '#1D6CAA'
CIAN = '#39ABD8'


def seccion(t):
    print(u'\n  ════ %s ' % t + u'═' * max(0, 62 - len(t)))


print(u'\n  EL DASHBOARD COMO ISLA CLARA — paleta derivada')
print(u'  ' + u'=' * 74)

# ═════════════════════════════════════════════════════════════════════════════
seccion(u'1 · REPRODUCIR LO YA VERIFICADO')
print(u'''
  Antes de opinar de un tono nuevo, el medidor tiene que reproducir las
  cifras que otros scripts de este repo ya verificaron. Si una no cuadra,
  el error es mio y lo demas no vale. [[feedback-verificar-antes-asegurar]]
''')
CONOCIDAS = [
    (u'marino sobre tarjeta',   MARINO, TARJETA, 12.43),
    (u'marino sobre lavado',    MARINO, LAVADO,  11.66),
    (u'azul sobre tarjeta',     AZUL,   TARJETA,  5.56),
    (u'azul sobre lavado',      AZUL,   LAVADO,   5.22),
    (u'cian sobre tarjeta',     CIAN,   TARJETA,  2.63),
    (u'cian sobre lavado',      CIAN,   LAVADO,   2.47),
    (u'#202E3B sobre tarjeta',  '#202E3B', TARJETA, 13.86),
    (u'#667384 sobre lavado',   '#667384', LAVADO,  4.53),
    (u'linea sobre tarjeta',    LINEA,  TARJETA,  1.24),
]
for rot, fg, bg, esperado in CONOCIDAS:
    real = contraste(fg, bg)
    ok = abs(real - esperado) < 0.015
    print(u'    %-5s %-26s esperado %6.2f   medido %6.2f'
          % (u'ok' if ok else u'FALLA', rot, esperado, real))
    if not ok:
        FALLOS.append(u'no reproduce %s' % rot)

# ═════════════════════════════════════════════════════════════════════════════
seccion(u'2 · LO QUE SE ROMPE AL VOLTEAR (la prueba del encargo)')
print(u'''
  Esto NO es una lista de fallos a corregir: es la demostracion de por que
  el cambio no puede ser un intercambio de tokens. Son los valores que HOY
  pinta el Dashboard, medidos contra la tarjeta BLANCA a la que va.
''')
ROTOS = [
    (u'asesor Dan   = WHITE.soft',  '#F5F8FB'),
    (u'asesor Fatima= SILVER[500]', '#A8BACB'),
    (u'asesor Claudia = CIAN[500]', '#39ABD8'),
    (u'banda bajo   = SILVER[300]', '#DFE8EF'),
    (u'banda medio  = #95CAE4',     '#95CAE4'),
    (u'banda alto   = CIAN[500]',   '#39ABD8'),
    (u'texto TX.hi  = blanco puro', '#FFFFFF'),
    (u'texto TX.low = SILVER[300]', '#DFE8EF'),
]
for rot, h in ROTOS:
    r = contraste(h, TARJETA)
    print(u'    %-30s %s sobre blanco  %6.2f:1   %s'
          % (rot, h, r, u'<- invisible' if r < 3 else u''))
print(u'''
  Y los tintes de hover/cebra: `rgba(255,255,255,0.05)` sobre una tarjeta
  blanca compone %s — el MISMO blanco. No oscurece nada y no falla nada.'''
      % mezcla('#FFFFFF', TARJETA, 0.05))

# ═════════════════════════════════════════════════════════════════════════════
seccion(u'3 · LA FAMILIA DISPONIBLE SOBRE BLANCO')
print(u'''
  El pozo de donde puede salir todo: la polilinea navy2 -> marino -> azul
  -> cian en OKLab, densa, filtrada por el 3:1 que pide un objeto grafico
  contra la tarjeta blanca. Nada de fuera de la familia del documento.
''')


def polilinea(anclas, n):
    """Interpola en OKLab por tramos. Recto en RGB daria tonos sucios."""
    pts = [oklab(h) for h in anclas]
    largos = [math.sqrt(sum((b[i] - a[i]) ** 2 for i in range(3)))
              for a, b in zip(pts, pts[1:])]
    total = sum(largos)
    out = []
    for k in range(n):
        t = total * k / float(n - 1)
        acc = 0.0
        for i, L in enumerate(largos):
            if t <= acc + L or i == len(largos) - 1:
                u = 0.0 if L == 0 else (t - acc) / L
                a, b = pts[i], pts[i + 1]
                out.append(de_oklab(*[a[j] + (b[j] - a[j]) * u for j in range(3)]))
                break
            acc += L
    return out


POZO_TODO = polilinea([NAVY2, MARINO, AZUL, CIAN], 220)
POZO = []
for h in POZO_TODO:
    if contraste(h, TARJETA) >= 3.0 and h not in POZO:
        POZO.append(h)
print(u'    %d tonos en la familia · %d pasan 3:1 sobre blanco'
      % (len(set(POZO_TODO)), len(POZO)))
print(u'    extremo claro util: %s (%.2f:1)   extremo oscuro: %s (%.2f:1)'
      % (POZO[-1], contraste(POZO[-1], TARJETA), POZO[0], contraste(POZO[0], TARJETA)))
print(u'''
    El cian vivo queda FUERA del pozo: la familia util sobre blanco va del
    marino al azul, y se corta antes de llegar al cian. Es la asimetria del
    acento, otra vez — el cian es color de fondo OSCURO.''')

# ═════════════════════════════════════════════════════════════════════════════
seccion(u'4 · LOS TRES ASESORES — categorico, separacion mutua')
print(u'''
  No estan ordenados entre si, asi que no se les pide monotonia: se les
  pide que NO SE CONFUNDAN. Se busca el trio del pozo que MAXIMIZA la
  separacion minima entre sus tres pares.
''')
paso = max(1, len(POZO) // 60)
idx = list(range(0, len(POZO), paso))

#: CUANTOS ASESORES HAY se LEE de `lib/types.ts`, no se escribe aqui.
#:
#: EL BUG QUE ESTO CIERRA. `chart-theme.ts` tenia un mapa de tres nombres
#: —Claudia, Dan, Fatima— y el consumidor hace `COLOR_ASESOR[a] ?? GRIS`.
#: Erick sustituyo a Claudia el 15 oct 2026 y NO entro en ese mapa: cae al
#: gris de respaldo, que es `SILVER[500]`… el mismo tono que Fatima. Dos de
#: los tres asesores pintados IGUAL en una barra apilada, sin que falle
#: nada. Es la clase de bug que este tema existe para evitar.
#:
#: Derivar la paleta para los nombres REALES y comprobar las dos listas es
#: lo unico que impide que el proximo cambio de asesor lo repita.
RUTA_TIPOS = os.path.join(RAIZ, 'lib', 'types.ts')
try:
    _tipos = io.open(RUTA_TIPOS, encoding='utf-8').read()
except IOError:
    _tipos = u''
    exige(False, u'se puede leer lib/types.ts')

_bloque = re.search(r'ASESOR_CONFIG[^=]*=\s*\{(.*?)\n\}', _tipos, re.S)
if not _bloque:
    ASESORES = []
    exige(False, u'se encuentra ASESOR_CONFIG en lib/types.ts')
else:
    cuerpo = re.sub(r'/\*[\s\S]*?\*/', ' ', _bloque.group(1))
    ASESORES = re.findall(r"^\s*'([^']+)'\s*:", cuerpo, re.M)

print(u'    asesores leidos de lib/types.ts: %s  (%d)'
      % (u', '.join(ASESORES), len(ASESORES)))

N = max(3, len(ASESORES))
CAT = polilinea([POZO[-1], POZO[0]], N)
sep_cat = min(dist(CAT[i], CAT[j])
              for i in range(N) for j in range(i + 1, N))
for nombre, h in zip(ASESORES, CAT):
    par(u'asesor %-9s' % nombre, h, TARJETA, 3.0)
print(u'    separacion minima entre pares: %.1f  (umbral 10)' % sep_cat)
exige(sep_cat >= 10, u'los %d asesores se separan >= 10 en OKLab' % N,
      u'par mas apretado: %.1f' % sep_cat)
A1, A2, A3 = CAT[0], CAT[1], CAT[2]
print(u'''
    OJO — tonos de la MISMA familia separados solo por luminancia se leen
    como una escala aunque sean categoricos. Por eso la leyenda y la
    etiqueta directa NO son opcionales aqui: el color es el apoyo, no el
    dato. Y el orden es el de `ASESOR_CONFIG`, no el de la vista: si fuera
    el de la vista, filtrar un asesor repintaria a los que quedan.''')

# ═════════════════════════════════════════════════════════════════════════════
seccion(u'5 · LAS TRES BANDAS — ordenado, monotono y adyacente')
print(u'''
  Se apilan: el ojo las compara borde con borde. Se exige separacion >= 10
  entre ADYACENTES y que la luminancia no suba y baje.
''')
#: `POZO` va de OSCURO a CLARO —es el orden en que lo genera la polilinea—,
#: asi que la rampa «claro -> oscuro» se lee con los indices al reves. La
#: primera version pedia `lum(a) > lum(b) > lum(c)` sobre indices crecientes:
#: imposible por construccion, y el script dijo FALLA en vez de elegir algo.
#: Un buscador que no encuentra nada tiene que gritar, no devolver el primero.
mejor_ord, mejor_min = None, -1
for i in idx:
    for j in idx:
        if j <= i:
            continue
        for k in idx:
            if k <= j:
                continue
            # claro -> oscuro = indice descendente
            a, b, c = POZO[k], POZO[j], POZO[i]
            if not (lum(a) > lum(b) > lum(c)):
                continue
            m = min(dist(a, b), dist(b, c))
            if m > mejor_min:
                mejor_min, mejor_ord = m, (a, b, c)
if mejor_ord is None:
    exige(False, u'existe una rampa ordenada de 3 pasos sobre blanco')
    B1 = B2 = B3 = MARINO
else:
    B1, B2, B3 = mejor_ord
    print(u'    rampa ganadora (claro -> oscuro): %s -> %s -> %s' % (B1, B2, B3))
    print(u'    adyacentes: %.1f y %.1f  (umbral 10)' % (dist(B1, B2), dist(B2, B3)))
    for n, h in ((u'banda bajo', B1), (u'banda medio', B2), (u'banda alto', B3)):
        par(n, h, TARJETA, 3.0)
    exige(lum(B1) > lum(B2) > lum(B3), u'la luminancia es MONOTONA')
    exige(mejor_min >= 10, u'los pasos adyacentes se separan >= 10',
          u'el mas apretado: %.1f' % mejor_min)
    print(u'''
    LA ESCALA VA AL REVES QUE EN OSCURO, y esto importa: sobre marino el
    riesgo alto era el tono CLARO (cian); sobre blanco el riesgo alto es el
    tono OSCURO. Es lo correcto —mas tinta, mas peso— pero cualquiera que
    recuerde la pantalla vieja va a leerlo invertido el primer dia.''')

# ═════════════════════════════════════════════════════════════════════════════
seccion(u'6 · LA TIRA DE ACENTO — 7 situaciones, posicion no categoria')
print(u'''
  Los siete tonos de la tira NO compiten entre si (van en filas distintas,
  cada una con su etiqueta): solo se les pide verse. Se reparten por la
  polilinea util y se mide el que menos aprieta.
''')
TIRA = polilinea([POZO[-1], POZO[0]], 7)
for i, h in enumerate(TIRA):
    r = contraste(h, TARJETA)
    print(u'    %d  %s   %6.2f:1   %s' % (i, h, r, u'ok' if r >= 3 else u'FALLA'))
    if r < 3:
        FALLOS.append(u'tira paso %d (%.2f:1)' % (i, r))

# ═════════════════════════════════════════════════════════════════════════════
seccion(u'7 · TEXTO Y SUPERFICIES — las DOS, porque conviven')
print(u'''
  En el Dashboard hay tarjetas blancas Y el lavado de la pagina en la misma
  vista. Un secundario que valga en una y no en la otra cae de lado sin que
  nadie lo toque: por eso los tres niveles se exigen en LAS DOS.
''')
#: LAS SUPERFICIES QUE CONVIVEN, LEIDAS DE `lib/paleta-cs.ts`.
#:
#: NO se inventan tintes nuevos aqui. Contratos ya tiene sus superficies
#: claras y el encargo es que el Dashboard se vea COMO Contratos: derivar un
#: juego paralelo seria fabricar paletas gemelas, y la proxima correccion
#: entraria en una y no en la otra sin que fallara nada.
#: [[atlas-dashboard-contrast-architecture]]
RUTA_PAL = os.path.join(RAIZ, 'lib', 'paleta-cs.ts')
try:
    _pal = io.open(RUTA_PAL, encoding='utf-8').read()
except IOError:
    _pal = u''
    exige(False, u'se puede leer lib/paleta-cs.ts')


def de_paleta(nombre, respaldo):
    m = re.search(nombre + r"\s*=\s*'(#[0-9A-Fa-f]{6})'", _pal)
    if not m:
        FALLOS.append(u'%s no esta en lib/paleta-cs.ts' % nombre)
        return respaldo
    return m.group(1).upper()


ZEBRA = de_paleta('ZEBRA', '#F4F8FB')
MISION = de_paleta('MISION', '#EFF7FC')

#: LAS DE TEXTO CORRIDO: aqui cae cualquiera de los tres niveles de tinta,
#: asi que los tres tienen que pasar en las tres.
SUPERFICIES = [
    (u'tarjeta', TARJETA),
    (u'lavado',  LAVADO),
    (u'zebra',   ZEBRA),
]

#: MISION VA APARTE, Y NO ES UN UMBRAL RELAJADO. Es el recuadro de aviso, y
#: en Contratos (`page.tsx:983`) SIEMPRE lleva titular MARINO: el par
#: «secundario sobre mision» no existe en el codigo. Medirlo como si
#: existiera daria un FALLA de un par que nadie pinta, y un detector que
#: grita por algo que no pasa acaba sin que nadie lo lea.
#: Lo que SI se exige es lo que de verdad se empareja.
SUPERFICIE_AVISO = [(u'mision', MISION)]
TINTA_DE_AVISO = [(u'marino', MARINO), (u'azul', AZUL)]


def baja_hasta(hexa, objetivo=4.5):
    """Oscurece un tono hasta que pase el objetivo en TODAS las superficies.

    Se mide el hex YA REDONDEADO, no el candidato en coma flotante: el
    redondeo se come hasta una decima y un tono puede salir del calculo con
    4.5001 y llegar a la pantalla con 4.4997. Es el bug que tuvieron las tres
    funciones de `lib/contraste.ts`. [[atlas-dashboard-contrast-architecture]]
    """
    L, a, b = oklab(hexa)
    for paso in range(0, 400):
        cand = de_oklab(max(0.0, L - paso * 0.0015), a, b)
        if all(contraste(cand, bg) >= objetivo for _, bg in SUPERFICIES):
            return cand
    return hexa


#: Los tres niveles de tinta que YA tiene `lib/paleta-cs.ts`. Si los tres
#: pasan en las cuatro superficies, el Dashboard NO estrena tokens de texto:
#: usa los de Contratos, que es justo lo que pidio direccion.
TX_ALTO = de_paleta('TX_ALTO', '#202E3B')
TX_MED = de_paleta('TX_MED', '#3D4B5C')
TX_BAJO = de_paleta('TX_BAJO', '#667384')

print(u'''  Las superficies son CUATRO, no dos: %s.
  Una fila cebra es una superficie mas, y el secundario la cruza sin que
  nadie lo toque.
''' % (u', '.join(n for n, _ in SUPERFICIES)))

TEXTO = [
    (u'alto   (titulos)', TX_ALTO),
    (u'medio  (cuerpo) ', TX_MED),
    (u'bajo   (secund.)', TX_BAJO),
    (u'marino de titular', MARINO),
    (u'acento azul      ', AZUL),
]
for rot, h in TEXTO:
    for nsup, bg in SUPERFICIES:
        par(u'%s %s / %-8s' % (rot, h, nsup), h, bg, 4.5)

print(u'''
  El recuadro de aviso (MISION) se mide con la tinta que de verdad lleva:''')
for rot, h in TINTA_DE_AVISO:
    for nsup, bg in SUPERFICIE_AVISO:
        par(u'aviso · %-10s %s / %s' % (rot, h, nsup), h, bg, 4.5)

#: EL PANEL DE FALLO DE FUENTE. Es el unico color de fuera de la familia y
#: esta acotado a esto. Iba en `rgba(248,113,113,…)` —rojo Tailwind suelto,
#: 2.57:1 sobre blanco—: el aviso de que los datos no son de fiar se leia
#: peor que los datos. Es el rojo que YA usa Contratos, no uno nuevo.
ROJO = de_paleta('ROJO_TX', '#A4262C')
print(u'''
  El panel de «una fuente no respondio» —el unico rojo del modulo:''')
par(u'rojo de aviso / su fondo', ROJO, '#FFF7F7', 4.5)
par(u'rojo de aviso / tarjeta ', ROJO, TARJETA, 4.5)
AMBAR = de_paleta('AMBAR_TX', '#8A5200')
par(u'ambar de aviso / tarjeta', AMBAR, TARJETA, 4.5)
par(u'ambar de aviso / cebra  ', AMBAR, ZEBRA, 4.5)
print(u'''    Los que habia: `#F87171` mide %.2f:1 y `#F97316` %.2f:1 sobre blanco.
    Ninguno de los dos llegaba. El naranja-500 y el rojo-400 de Tailwind son
    acentos de fondo OSCURO.''' % (contraste('#F87171', TARJETA),
                                   contraste('#F97316', TARJETA)))
print(u'''    El secundario %s sobre MISION daria %.2f:1 — por debajo. Ese par NO
    existe en el codigo (Contratos lo pinta siempre con marino) y por eso no
    se exige; queda escrito para que nadie lo estrene sin medirlo.'''
      % (TX_BAJO, contraste(TX_BAJO, MISION)))


def baja_hasta(hexa, objetivo=4.5):
    """Oscurece un tono hasta que pase el objetivo en TODAS las superficies.

    Se mide el hex YA REDONDEADO, no el candidato en coma flotante: el
    redondeo se come hasta una decima y un tono puede salir del calculo con
    4.5001 y llegar a la pantalla con 4.4997. Es el bug que tuvieron las tres
    funciones de `lib/contraste.ts`. [[atlas-dashboard-contrast-architecture]]
    """
    L, a, b = oklab(hexa)
    for paso in range(0, 400):
        cand = de_oklab(max(0.0, L - paso * 0.0015), a, b)
        if all(contraste(cand, bg) >= objetivo for _, bg in SUPERFICIES):
            return cand
    return hexa


if all(contraste(TX_BAJO, bg) >= 4.5 for _, bg in SUPERFICIES):
    print(u'''
    Los tres niveles de Contratos pasan en las cuatro superficies: el
    Dashboard NO estrena tokens de texto. Un secundario propio seria otra
    paleta gemela.''')
else:
    print(u'''
    `%s` NO pasa en alguna superficie; el derivado seria `%s`. Antes de
    escribirlo, mirar si la superficie que lo tumba hace falta: estrenar un
    secundario propio del Dashboard crea dos secundarios en el tablero.'''
          % (TX_BAJO, baja_hasta(TX_BAJO)))

print(u'''
    Y el que HOY usa el Dashboard, `#6A7889`, da %.2f:1 sobre el lavado:
    NO llega. Es un fallo que YA ESTABA; voltear el modulo lo pone a la
    vista en vez de taparlo.''' % contraste('#6A7889', LAVADO))

# ═════════════════════════════════════════════════════════════════════════════
seccion(u'8 · LOS TINTES: POR QUE NO SE TIÑE CON BLANCO')
print(u'''
  El Dashboard pinta hover, cebra y realce con `rgba(255,255,255,0.0X)`.
  Eso funciona sobre marino y sobre claro NO HACE NADA: el blanco sobre
  blanco compone blanco. No falla, no avisa, y la fila deja de marcarse.
''')
for alfa in (0.03, 0.04, 0.05, 0.06, 0.10, 0.12):
    print(u'    blanco al %2d%% sobre la tarjeta blanca  ->  %s   (sin efecto)'
          % (int(alfa * 100), mezcla('#FFFFFF', TARJETA, alfa)))
print(u'''
  Las superficies de realce del Dashboard pasan a ser las de Contratos,
  que son hex declarados y no tintes:

      cebra   %s
      mision  %s   (el realce de una fila elegida)
''' % (ZEBRA, MISION))
exige(all(contraste(TX_BAJO, bg) >= 4.5 for _, bg in SUPERFICIES),
      u'el secundario de Contratos pasa en las CUATRO superficies')

# ═════════════════════════════════════════════════════════════════════════════
seccion(u'9 · ESPEJO CONTRA lib/chart-theme.ts')
print(u'''
  Un espejo tecleado a mano deja de ser espejo. Esto lee el archivo real y
  falla si los tonos que el tema declara no son los que este script deriva.
  Mientras el tema siga en OSCURO, esta seccion DICE QUE FALTA EL CAMBIO en
  vez de callar: un verificador que no puede verificar no da veredicto.
''')
RUTA_TEMA = os.path.join(RAIZ, 'lib', 'chart-theme.ts')
try:
    fuente = io.open(RUTA_TEMA, encoding='utf-8').read()
except IOError:
    fuente = u''
    exige(False, u'se puede leer lib/chart-theme.ts')

if fuente:
    sup = re.search(r'SUPERFICIE\s*=\s*\{(.*?)\n\}', fuente, re.S)
    claro = bool(sup and re.search(r"tarjeta:\s*'#FFFFFF'", sup.group(1), re.I))
    if not claro:
        print(u'    PENDIENTE  el tema todavia no declara SUPERFICIE.tarjeta')
        print(u'               en blanco: sigue siendo un modulo OSCURO.')
        print(u'               Esta seccion no puede dar veredicto y no lo da,')
        print(u'               en vez de darlo en falso.')
        FALLOS.append(u'el tema no esta volteado a claro')
    else:
        cuerpo_sup = sup.group(1)
        for clave, val in ((u'pagina', LAVADO), (u'tarjeta', TARJETA),
                           (u'cebra', ZEBRA), (u'aviso', MISION)):
            mm = re.search(clave + r":\s*'(#[0-9A-Fa-f]{6})'", cuerpo_sup)
            exige(bool(mm) and mm.group(1).upper() == val.upper(),
                  u'SUPERFICIE.%-8s = %s' % (clave, val),
                  u'' if mm else u'no esta declarada')

        bl = re.search(r'BANDA\s*=\s*\{(.*?)\n\}', fuente, re.S)
        for clave, val in ((u'bajo', B1), (u'medio', B2), (u'alto', B3)):
            mm = bl and re.search(clave + r":\s*'(#[0-9A-Fa-f]{6})'", bl.group(1))
            exige(bool(mm) and mm.group(1).upper() == val.upper(),
                  u'BANDA.%-6s = %s' % (clave, val))

        tx = re.search(r'\nexport const TX\s*=\s*\{(.*?)\n\}', fuente, re.S)
        for clave, val in ((u'mid', TX_MED), (u'low', TX_BAJO)):
            mm = tx and re.search(clave + r":\s*'(#[0-9A-Fa-f]{6})'", tx.group(1))
            exige(bool(mm) and mm.group(1).upper() == val.upper(),
                  u'TX.%-4s = %s' % (clave, val))

        tira = re.findall(r"'(#[0-9A-Fa-f]{6})',\s*//\s*(?:en_orden|oportunidad|"
                          r"hay_que_mostrarle|sin_auditar|no_la_vemos|apagandose|se_va)",
                          fuente)
        exige([t.upper() for t in tira] == [t.upper() for t in TIRA],
              u'TIRA_RIESGO son los 7 tonos derivados',
              u'tema: %s' % u' '.join(tira))

        # ── LAS DOS LISTAS DE ASESORES ───────────────────────────────────
        # El bug que cerro este cambio fue justamente que divergieran.
        bl_as = re.search(r'ASESOR:\s*Record<string, string>\s*=\s*\{(.*?)\n\}',
                          fuente, re.S)
        nombres_tema = []
        tonos_tema = []
        if bl_as:
            for mm in re.finditer(r"^\s*'?([^':\s]+)'?:\s*'(#[0-9A-Fa-f]{6})'",
                                  bl_as.group(1), re.M):
                nombres_tema.append(mm.group(1))
                tonos_tema.append(mm.group(2).upper())
        exige(set(nombres_tema) == set(ASESORES),
              u'los asesores del tema son los de ASESOR_CONFIG',
              u'tema: %s · types.ts: %s'
              % (u', '.join(nombres_tema), u', '.join(ASESORES)))
        exige(len(set(tonos_tema)) == len(tonos_tema),
              u'NINGUN asesor comparte tono con otro',
              u'tonos: %s' % u' '.join(tonos_tema))
        esperado_as = dict(zip(ASESORES, [c.upper() for c in CAT]))
        for n, t in zip(nombres_tema, tonos_tema):
            exige(esperado_as.get(n) == t,
                  u'asesor %-8s = %s' % (n, esperado_as.get(n, u'?')),
                  u'el tema dice %s' % t)

# ═════════════════════════════════════════════════════════════════════════════
print(u'\n  ' + u'─' * 74)
if FALLOS:
    print(u'\n  *** %d PAR(ES) O CONDICION(ES) SIN CUMPLIR ***' % len(FALLOS))
    for f in FALLOS:
        print(u'      · %s' % f)
    print(u'')
    sys.exit(1)

print(u'''
  Todas las condiciones se cumplen.

  LOS TONOS QUE SALEN DE AQUI, para escribirlos en el tema:

      asesores (categorico)   %s  %s  %s
      bandas (claro->oscuro)  %s  %s  %s
      tira de 7               %s

  Esto prueba el CALCULO contra los fondos declarados. NO prueba el render:
  eso lo cierra abrir la pantalla y mirarla.
  [[feedback-verificar-antes-asegurar]]
''' % (A1, A2, A3, B1, B2, B3, u' '.join(TIRA)))
