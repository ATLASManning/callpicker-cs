# -*- coding: utf-8 -*-
u"""La paleta de Cuentas → Contratos, CALCULADA contra el fondo real.

   POR QUE EXISTE
   --------------
   4 nov 2026. José Manuel mandó dos capturas —la pantalla de Contratos y el
   «Customer Success Operating System»— y pidió aplicar a Contratos el formato
   de color del documento.

   Contratos YA usaba la mitad clara de esa paleta (marino, cian, línea,
   lavado, tinta). Lo que el documento añade es lo que NO estaba: un HERO de
   fondo oscuro con letra clara, encabezados de tabla en marino con letra
   blanca y filas alternas. Eso invierte el fondo de cada token de texto que
   cae encima, y es exactamente la clase de cambio que costó once rondas en
   este repo: la medición de un tono CADUCA cuando cambia el fondo, y no avisa.
   [[atlas-dashboard-contrast-architecture]]

   LOS HEX NO SALEN DE LA CAPTURA
   ------------------------------
   Salen del `:root` y de las reglas del propio documento, que es la fuente:
   `public/docs/Callpicker_Customer_Success_Operating_System.html`.

       --navy #10355D  --navy2 #082742  --blue #1D6CAA  --cyan #39ABD8
       --ink  #202E3B  --muted #6A7889  --line #DFE8EF  --wash #F5F8FB

       .hero  linear-gradient(127deg, #0B2D4D, #15537F 72%, #247BA6)
       .tag   #B3E8FF   .hero h1 span #8AD7F8   .hero p #D7E7F2
       .pill  texto #E5F1FA sobre borde #FFFFFF4D
       th     background #10355D, color white
       tbody tr:nth-child(even) #F4F8FB

   UN DEGRADADO SE MIDE POR SU EXTREMO QUE APRIETA, no por el oscuro: aquí el
   que aprieta es `#247BA6`, el final claro. Medir sólo contra `#0B2D4D` da
   cifras holgadas y una esquina ilegible.

   Es de SOLO LECTURA. Sale con 1 si algo no alcanza su mínimo.

   USO
   ---
       python scripts/mide-paleta-contratos.py
"""
import io
import math
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# ── La fuente, al peso ──────────────────────────────────────────────────────
NAVY, NAVY2, BLUE, CYAN = '#10355D', '#082742', '#1D6CAA', '#39ABD8'
INK, MUTED, LINE, WASH = '#202E3B', '#6A7889', '#DFE8EF', '#F5F8FB'

HERO_OSCURO, HERO_MEDIO = '#0B2D4D', '#15537F'

# ── LAS TRES CORRECCIONES AL DOCUMENTO, Y POR QUÉ ───────────────────────────
#
# El documento es la FUENTE de los tonos, no una autoridad sobre el contraste:
# tiene tres pares que no alcanzan AA, medidos aquí abajo.
#
# 1. EL EXTREMO CLARO DEL DEGRADADO. El documento acaba el hero en `#247BA6`,
#    y contra ese tono sus PROPIOS tokens fallan: el TAG mide 3.57:1, el
#    párrafo 3.72:1, el texto de las pastillas 4.10:1 y el cian del titular
#    2.95:1 — por debajo incluso del 3:1 de texto grande. En el documento no
#    salta porque su hero es enorme y la esquina clara queda detrás del aro
#    decorativo; en una pantalla de trabajo el texto cae justo ahí.
#    `#1F6A90` es el mismo tono oscurecido por descenso hasta que los CINCO
#    tokens pasan (ΔE 5.6 contra el original: sigue siendo el mismo azul).
HERO_CLARO = '#1F6A90'
#
# 2. EL BORDE DE LAS PASTILLAS. El documento usa `#FFFFFF` al 30%, que compuesto
#    sobre el degradado da 1.70:1. Sube a 0.60 → 3.22:1.
PILL_ALFA = 0.60
#
# 3. `--muted #6A7889` NO SE ADOPTA PARA TEXTO SOBRE FILA ALTERNA. Mide 4.51:1
#    sobre blanco —justo— y **4.22:1 sobre el zebra `#F4F8FB`**, que es el
#    fondo nuevo. La tinta tenue se queda en la que ya tenía la página,
#    `#667384`, que mide 4.83 y 4.52. Es el caso exacto de la 10ª ronda: una
#    medición caduca cuando cambia el fondo, y no avisa.
TX_BAJO = '#667384'

TAG, TITULO2, LEAD, PILL_TX = '#B3E8FF', '#8AD7F8', '#D7E7F2', '#E5F1FA'
ZEBRA = '#F4F8FB'
BLANCO = '#FFFFFF'

# Los que ya vivían en la página
TX_ALTO, TX_MED = '#202E3B', '#3D4B5C'
TX_BAJO_VIEJO = '#6A7889'   # el --muted del documento, el que NO se adopta
ROJO_TX, AMBAR_TX = '#A4262C', '#8A5200'
PLATA_500 = '#A8BACB'

# ── Y LA CUARTA, que no es del documento sino un defecto que ya estaba ──────
#
# `TINTA_ESTADO` era un mapa de cuatro tonos TECLEADO A MANO, y su comentario
# afirmaba «firmado #0ca30c → TX_ALTO 4.2:1 ✓». Son **4.13:1**, por debajo de
# AA, en las cifras de 10.5px en negrita que van dentro de cada segmento.
# Llevaba así desde que se escribió la gráfica.
#
# `textoSobreSolido()` de `lib/contraste.ts` no es la herramienta aquí: se para
# en cuanto alcanza 4.5 para CONSERVAR el color del relleno, y devuelve
# `#64470A` sobre el ámbar y `#4A4E53` sobre el gris —4.68 y 4.74— cuando una
# tinta neutra da 8.75 y 9.08 en esos mismos sitios. Conservar el tono tiene
# sentido en una pastilla cuyo texto ES la etiqueta del color; aquí el texto es
# una CIFRA y lo que se quiere es que se lea.
#
# ── Y LA QUINTA: LA PALETA DE ESTADO SE RETIRA (4 nov 2026) ─────────────────
#
# Dirección, al ver la pantalla ya con la paleta del documento: «los colores de
# la gráfica llévalos a azul oscuro y gris claro».
#
# DOS COLORES NO PINTAN CUATRO SERIES: «azul oscuro» y «gris claro» son los
# EXTREMOS, y los dos pasos de en medio se interpolan EN OKLab —mezclar en RGB
# atraviesa tonos que no están en la paleta—. Los extremos no se inventan:
# `#10355D` es el `--navy` del documento, el mismo de los títulos y de las
# cabeceras de tabla, y `#B9C4D0` es el gris que `sin_estatus` ya tenía, así
# que la ausencia de captura conserva exactamente su color.
#
# Y la tinta ahora VOLTEA a mitad de rampa, que con la paleta de estado no
# pasaba: allí sólo uno de los cuatro llevaba letra clara y aquí son dos y dos.
ESTATUS = [u'firmado', u'en proceso', u'no firmado', u'sin estatus']
RAMPA = ['#10355D', '#476283', '#7E92A9', '#B9C4D0']
TINTA_RELLENO = '#172230'
TINTAS = ['#FFFFFF', '#FFFFFF', TINTA_RELLENO, TINTA_RELLENO]
MIN_DE_ADY = 10.0   # separación OKLab entre pasos que se TOCAN

MIN_TEXTO = 4.5
MIN_TEXTO_GRANDE = 3.0   # >=24px, o >=19px en negrita (WCAG 1.4.3)
MIN_OBJETO = 3.0


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
    r, g, b = (lineal(c) for c in hx(h))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (x ** (1.0 / 3.0) if x > 0 else -((-x) ** (1.0 / 3.0)) for x in (l, m, s))
    return (0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_)


def dist(a, b):
    u"""Separación perceptual en OKLab (×100). Dos rellenos que se tocan tienen
       que separarse al menos MIN_DE_ADY; en RGB esa distancia miente."""
    pa, pb = oklab(a), oklab(b)
    return 100.0 * math.sqrt(sum((pa[i] - pb[i]) ** 2 for i in range(3)))


def sobre(capa, alfa, fondo):
    """Compone una capa translúcida sobre un fondo y devuelve el hex real.
       Un borde `#FFFFFF4D` NO es blanco: es blanco al 30% sobre lo que haya
       debajo, y ahí es donde se mide."""
    a, b = hx(capa), hx(fondo)
    mix = [a[i] * alfa + b[i] * (1 - alfa) for i in range(3)]
    return '#%02X%02X%02X' % tuple(int(round(c * 255)) for c in mix)


fallos, notas = [], []


def mide(etq, tinta, fondo, minimo=MIN_TEXTO, nota=u''):
    r = contraste(tinta, fondo)
    ok = r >= minimo
    print(u'    %s %-34s %s sobre %s  %6.2f:1  (min %.1f)%s'
          % (u'ok  ' if ok else u'FALLA', etq, tinta, fondo, r, minimo,
             u'  ' + nota if nota else u''))
    if not ok:
        fallos.append(u'%s — %.2f:1 contra %s, pide %.1f' % (etq, r, fondo, minimo))
    return r


print(u'\n  ════ 1 · EL HERO ════════════════════════════════════════════════')
print(u'\n  El degradado va de %s a %s. Se mide contra el extremo CLARO,' % (HERO_OSCURO, HERO_CLARO))
print(u'  que es el que aprieta; el oscuro se imprime sólo de referencia.\n')
for etq, c, minimo in ((u'título, línea 1 (blanco, 44px)', BLANCO, MIN_TEXTO_GRANDE),
                       (u'título, línea 2 (cian claro, 44px)', TITULO2, MIN_TEXTO_GRANDE),
                       (u'rótulo superior (TAG, 11px)', TAG, MIN_TEXTO),
                       (u'párrafo de entrada (13.5px)', LEAD, MIN_TEXTO),
                       (u'texto de las pastillas (11.5px)', PILL_TX, MIN_TEXTO)):
    mide(etq, c, HERO_CLARO, minimo)
print(u'')
for etq, c in ((u'  (ref) blanco sobre el extremo oscuro', BLANCO),
               (u'  (ref) cian claro sobre el oscuro', TITULO2),
               (u'  (ref) TAG sobre el oscuro', TAG),
               (u'  (ref) lead sobre el oscuro', LEAD)):
    print(u'         %-40s %6.2f:1' % (etq, contraste(c, HERO_OSCURO)))

print(u'\n  El borde de las pastillas es #FFFFFF al %d%%, no blanco: se compone' % (PILL_ALFA * 100))
print(u'  sobre lo que haya debajo, y ahí es donde se mide.')
for fondo, nf in ((HERO_CLARO, u'extremo claro'), (HERO_OSCURO, u'extremo oscuro')):
    real = sobre(BLANCO, PILL_ALFA, fondo)
    mide(u'borde de pastilla (%s)' % nf, real, fondo, MIN_OBJETO, u'objeto gráfico')

print(u'\n  ════ 2 · LO QUE VA SOBRE LAS TARJETAS BLANCAS ═══════════════════\n')
mide(u'tinta tenue de la página', TX_BAJO, BLANCO)
mide(u'título de sección (marino)', NAVY, BLANCO)
mide(u'enlace / acento sobre claro', BLUE, BLANCO)
print(u'\n  LO QUE NO ALCANZA Y NO SE CAMBIA, dicho con el número: el borde de')
print(u'  los controles. El documento usa #CBDDE9 y esta página usa --line;')
print(u'  ninguno llega a 3:1, y en la familia azulada del documento NADA')
print(u'  llega sin volverse un trazo gris oscuro:\n')
for c in ('#DFE8EF', '#CBDDE9', '#A8BACB', '#8697A8'):
    print(u'         borde %s sobre blanco           %6.2f:1' % (c, contraste(c, BLANCO)))
print(u'\n  Es la convención de TODO el tablero —cada input de cada pantalla—,')
print(u'  no algo que nazca aquí, así que cambiarla es un trabajo de tablero')
print(u'  completo y no de este módulo. Queda dicho en vez de pasar por alto.')
print(u'  Lo que sí se hace aquí: el filtro activo se marca con borde MARINO')
print(u'  (%.2f:1) y con negrita, así que el estado del control nunca depende' % contraste(NAVY, BLANCO))
print(u'  de un borde que no se ve.')

print(u'\n  ════ 3 · LA CABECERA DE TABLA, AHORA EN MARINO ══════════════════')
print(u'\n  Las nueve cabeceras pasan de letra oscura sobre lavado a letra')
print(u'  clara sobre %s. Es el cambio que invierte el fondo.\n' % NAVY)
mide(u'columna ACTIVA (blanco)', BLANCO, NAVY)
mide(u'columna inactiva (plata 500)', PLATA_500, NAVY)
mide(u'columna inactiva (línea #DFE8EF)', LINE, NAVY)
mide(u'triángulo de orden (cian claro)', TITULO2, NAVY, MIN_OBJETO, u'objeto gráfico')

print(u'\n  Y la columna ACTIVA lleva además un tinte blanco al 10%, que ACLARA')
print(u'  el fondo: el alfa lo fija el panel CON la caja encima, no a pelo.\n')
NAVY_TINTE = sobre(BLANCO, 0.10, NAVY)
print(u'         el fondo real de la celda activa es %s\n' % NAVY_TINTE)
mide(u'blanco sobre la celda tintada', BLANCO, NAVY_TINTE)
mide(u'plata sobre la celda tintada', PLATA_500, NAVY_TINTE)
mide(u'cian claro sobre la celda tintada', TITULO2, NAVY_TINTE, MIN_OBJETO, u'objeto gráfico')
print(u'         y el tinte CONTRA el marino sin tintar: %5.2f:1  (el realce'
      % contraste(NAVY_TINTE, NAVY))
print(u'         no se percibe solo, y por eso NO identifica solo: la columna')
print(u'         activa va además en blanco, en negrita y con el triángulo')
print(u'         relleno frente al hueco de las inactivas.)')
print(u'\n  Y lo que NO sirve ahí, dicho con el número:')
for etq, c in ((u'TX_BAJO viejo', TX_BAJO_VIEJO), (u'TX_MED', TX_MED),
               (u'marino sobre marino', NAVY)):
    print(u'         %-40s %6.2f:1  *** inservible' % (etq, contraste(c, NAVY)))

print(u'\n  ════ 4 · LAS FILAS ALTERNAS (%s) ══════════════════════════' % ZEBRA)
print(u'\n  Nada de esto se midió nunca contra el zebra: hasta hoy las filas')
print(u'  eran todas blancas.\n')
for etq, c in ((u'tinta alta', TX_ALTO), (u'tinta media', TX_MED),
               (u'tinta tenue, la que se queda', TX_BAJO),
               (u'rojo de texto', ROJO_TX), (u'ámbar de texto', AMBAR_TX),
               (u'azul de enlace', BLUE)):
    mide(etq, c, ZEBRA)
print(u'\n  Y el --muted del documento, que por esto NO se adopta:')
print(u'         %-34s %s sobre %s  %6.2f:1  *** pide 4.5'
      % (u'--muted del documento', TX_BAJO_VIEJO, ZEBRA, contraste(TX_BAJO_VIEJO, ZEBRA)))

print(u'\n  ════ 5 · LA RAMPA DE LAS BARRAS, DE MARINO A GRIS CLARO ═════════')
print(u'\n  4 nov 2026, pedido por dirección: «los colores de la gráfica llévalos')
print(u'  a azul oscuro y gris claro». Son CUATRO estatus, así que esos dos son')
print(u'  los EXTREMOS y los pasos de en medio se interpolan en OKLab.\n')
print(u'    %-14s %s  %s  %s  %s' % ((u'rampa',) + tuple(RAMPA)))
print(u'    %-14s %s' % (u'estatus', u'  '.join(u'%-7s' % e[:7] for e in ESTATUS)))

print(u'\n  a) SEPARACIÓN ENTRE PASOS ADYACENTES (OKLab, mínimo %.0f)' % MIN_DE_ADY)
print(u'     Es lo que importa: se tocan con 2px de fondo entre medias.\n')
for i in range(len(RAMPA) - 1):
    d = dist(RAMPA[i], RAMPA[i + 1])
    ok = d >= MIN_DE_ADY
    print(u'    %s %s → %s   ΔE %5.1f' % (u'ok  ' if ok else u'FALLA', RAMPA[i], RAMPA[i + 1], d))
    if not ok:
        fallos.append(u'los pasos %s y %s se confunden (ΔE %.1f)' % (RAMPA[i], RAMPA[i + 1], d))

print(u'\n  b) LUMINANCIA MONÓTONA — es una escala ORDENADA; si sube y baja,')
print(u'     deja de leerse como escala.\n')
luces = [lum(c) for c in RAMPA]
mono = all(luces[i] < luces[i + 1] for i in range(len(luces) - 1))
print(u'    %s  %s' % (u'ok  ' if mono else u'FALLA',
                       u'  '.join(u'%.4f' % l for l in luces)))
if not mono:
    fallos.append(u'la rampa no es monótona')

print(u'\n  c) LA TINTA, QUE SE VOLTEA A MITAD DE RAMPA. El punto donde voltea')
print(u'     se MIDE: poner blanco en los cuatro deja dos cifras ilegibles.\n')
for etq, fill, tinta in zip(ESTATUS, RAMPA, TINTAS):
    r = mide(u'%s' % etq, tinta, fill)
    otra = TINTA_RELLENO if tinta == BLANCO else BLANCO
    print(u'         (la otra opción, %s, daría %5.2f:1)' % (otra, contraste(otra, fill)))

print(u'\n  d) LOS RELLENOS COMO OBJETO sobre las dos filas. Los dos últimos no')
print(u'     llegan a 3:1 — antes NO llegaban el ámbar (1.83) y el gris (1.77),')
print(u'     así que esta rampa pasa UN paso más que la que sustituye. El color')
print(u'     NUNCA identifica solo: cada segmento lleva su cifra y la leyenda su')
print(u'     etiqueta y su total.\n')
for etq, fill in zip(ESTATUS, RAMPA):
    a, b = contraste(fill, BLANCO), contraste(fill, ZEBRA)
    print(u'         %-12s %s  blanco %5.2f:1   zebra %5.2f:1   %s'
          % (etq, fill, a, b,
             u'ok' if min(a, b) >= MIN_OBJETO else u'bajo 3:1 — lo sostiene la cifra'))

print(u'\n  e) EL ARO DE LA LEYENDA. El de antes era `--line`, que mide 1.24:1')
print(u'     contra el blanco: un aro que no contrasta no delimita nada, y con')
print(u'     una rampa que acaba en gris claro los dos últimos cuadros se')
print(u'     deshacían contra la tarjeta.\n')
mide(u'aro nuevo (la tinta tenue)', TX_BAJO, BLANCO, MIN_OBJETO, u'objeto gráfico')
print(u'         (el viejo, %s, medía %5.2f:1)' % (LINE, contraste(LINE, BLANCO)))

print(u'\n  ════ 6 · LOS DOS FILETES, DECLARADOS COMO DECORACIÓN ════════════')
print(u'\n  El documento subraya cada h2 con 3px de cian y marca los párrafos')
print(u'  de lista con 3px de #B1D9EC. Medidos contra blanco:\n')
for etq, c in ((u'filete cian bajo el título', CYAN), (u'filete de lista', '#B1D9EC')):
    r = contraste(c, BLANCO)
    print(u'         %-40s %6.2f:1' % (etq, r))
    notas.append(u'%s mide %.2f:1 sobre blanco' % (etq, r))
print(u'\n  NINGUNO alcanza 3:1 y NINGUNO lo necesita: no son objetos que haya')
print(u'  que percibir para entender nada. El título que subrayan va en marino')
print(u'  (%.2f:1 sobre blanco) y el párrafo que marcan lleva su propia tinta.'
      % contraste(NAVY, BLANCO))
print(u'  Se dice aquí en vez de dejarlo pasar: si algún día el filete fuera')
print(u'  lo ÚNICO que distingue dos cosas, esta cifra deja de valer.')

print(u'\n  ════ 7 · LA CAJA DE CIERRE (.mission del documento) ═════════════\n')
mide(u'marino sobre #EFF7FC', NAVY, '#EFF7FC')
mide(u'filete izquierdo (azul)', BLUE, '#EFF7FC', MIN_OBJETO, u'objeto gráfico')

# ── 8 · EL ESPEJO CONTRA `lib/paleta-cs.ts` ─────────────────────────────────
#
# La paleta dejó de vivir dentro de la pantalla de Contratos: ahora es
# `lib/paleta-cs.ts`, compartida con el Dashboard. Este medidor tenía los hex
# TECLEADOS, así que a partir de aquí son DOS copias del mismo valor — y un
# espejo tecleado a mano deja de ser espejo en cuanto alguien corrige uno.
# Se leen del archivo y se exige que coincidan. [[feedback-verificar-antes-asegurar]]
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PALETA = os.path.join(RAIZ, 'lib', 'paleta-cs.ts')

print(u'\n  ════ 8 · ESPEJO CONTRA lib/paleta-cs.ts ═════════════════════════\n')
try:
    fuente = io.open(PALETA, encoding='utf-8').read()
except IOError:
    print(u'    FALLA  no pude leer lib/paleta-cs.ts — no se puede comparar')
    fallos.append(u'lib/paleta-cs.ts ilegible')
    fuente = u''

if fuente:
    # `export const X = '#hex'` / `= 'linear-gradient(...)'`
    declara = dict(re.findall(r"export const (\w+)\s*=\s*'([^']+)'", fuente))
    ESPEJO = [
        ('MARINO', NAVY), ('AZUL', BLUE), ('CIAN', CYAN), ('LINEA', LINE),
        ('LAVADO', WASH), ('TX_ALTO', TX_ALTO), ('TX_MED', TX_MED),
        ('TX_BAJO', TX_BAJO), ('ROJO_TX', ROJO_TX), ('AMBAR_TX', AMBAR_TX),
        ('PLATA', PLATA_500), ('ZEBRA', ZEBRA),
        ('HERO_TAG', TAG), ('HERO_CIAN', TITULO2), ('HERO_LEAD', LEAD),
        ('HERO_PILL', PILL_TX),
    ]
    for nombre, medido in ESPEJO:
        real = declara.get(nombre)
        ok = real is not None and real.upper() == medido.upper()
        print(u'    %s  %-12s medido %s · declara %s'
              % (u'ok  ' if ok else u'FALLA', nombre, medido, real or u'(no existe)'))
        if not ok:
            fallos.append(u'%s: se mide %s y lib/paleta-cs.ts declara %s'
                          % (nombre, medido, real or u'nada'))
    # El degradado: que su extremo claro sea el CORREGIDO y no el del documento.
    grad = declara.get('HERO', u'')
    ok = HERO_CLARO.lower() in grad.lower()
    print(u'    %s  %-12s el degradado acaba en %s'
          % (u'ok  ' if ok else u'FALLA', 'HERO', HERO_CLARO))
    if not ok:
        fallos.append(u'HERO: el degradado de lib/paleta-cs.ts no acaba en %s (es «%s»)'
                      % (HERO_CLARO, grad))

# ── 9 · EL INDICADOR DE AUTOREFRESH SOBRE EL HERO ───────────────────────────
#
# El hero del Dashboard lleva en la esquina el indicador de `AutoRefresh`, que
# se pintaba con la clase `text-textLow`. Esa clase vale `#6A7889` —tinta
# OSCURA— y sólo se vuelve blanco translúcido DENTRO de una `.cp-card`, por
# `globals.css:84`. El hero es un `<header>` con degradado propio, no una
# `.cp-card`: la clase se queda en su valor oscuro.
#
# Es la Variante B del bug de este tablero —un panel oscuro usando tokens cuyo
# valor correcto depende de que algo más los sobreescriba— y se vería
# exactamente como las ocho rondas anteriores: texto que sólo se lee
# seleccionándolo. [[atlas-dashboard-contrast-architecture]]
print(u'\n  ════ 9 · EL INDICADOR DEL HERO (AutoRefresh) ════════════════════\n')
print(u'  lo que HABRÍA pasado dejando `text-textLow` sobre el degradado:\n')
for etq, fondo in ((u'extremo CLARO (el que aprieta)', HERO_CLARO),
                   (u'extremo oscuro', HERO_OSCURO)):
    print(u'         #6A7889 sobre %-32s %6.2f:1' % (etq, contraste('#6A7889', fondo)))
print(u'\n  corregido a HERO_LEAD, el token ya medido del párrafo del hero:\n')
mide(u'indicador sobre el extremo claro', LEAD, HERO_CLARO)
mide(u'indicador sobre el extremo oscuro', LEAD, HERO_OSCURO)

print(u'\n  ─────────────────────────────────────────────────────────────────')
if fallos:
    print(u'\n  %d PAR(ES) NO ALCANZAN:\n' % len(fallos))
    for f in fallos:
        print(u'    · %s' % f)
    print(u'')
    sys.exit(1)
print(u'\n  Todos los pares alcanzan su mínimo.')
print(u'  Esto prueba el CÁLCULO, no el render: eso lo cierra abrir la')
print(u'  pantalla y mirarla. [[feedback-verificar-antes-asegurar]]\n')
