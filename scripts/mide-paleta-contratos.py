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
# Así que una sola tinta oscura para los tres rellenos claros, elegida por
# descenso y **sin ir al filo**: `#1A2631` da los 4.5 justos (4.58) y `#172230`
# deja margen. El rojo sigue siendo el único con letra clara.
TINTA_RELLENO = '#172230'

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

print(u'\n  ════ 5 · LA TINTA SOBRE CADA RELLENO DE ESTATUS ═════════════════')
print(u'\n  Son las cifras de 10.5px en NEGRITA que van dentro de cada segmento')
print(u'  de la gráfica: texto normal, 4.5:1. El relleno es sólido, así que el')
print(u'  zebra no lo altera.\n')
for etq, fill, tinta in ((u'firmado', '#0ca30c', TINTA_RELLENO),
                         (u'en proceso', '#fab219', TINTA_RELLENO),
                         (u'no firmado', '#d03b3b', BLANCO),
                         (u'sin estatus', '#B9C4D0', TINTA_RELLENO)):
    mide(u'%s' % etq, tinta, fill)
print(u'\n  Lo que había antes, y que llevaba ahí desde que se escribió la')
print(u'  gráfica (el comentario afirmaba 4.2:1 para el primero):')
for etq, fill in ((u'firmado con TX_ALTO', '#0ca30c'), (u'en proceso con TX_ALTO', '#fab219'),
                  (u'sin estatus con TX_ALTO', '#B9C4D0')):
    r = contraste(TX_ALTO, fill)
    print(u'         %-34s %6.2f:1  %s' % (etq, r, u'ok' if r >= MIN_TEXTO else u'*** por debajo de AA'))
print(u'\n  Y los rellenos COMO OBJETO sobre las dos filas. Dos no llegan a 3:1')
print(u'  a propósito y por eso el color NUNCA identifica solo: cada segmento')
print(u'  lleva su cifra escrita y la leyenda su etiqueta y su total.\n')
for etq, fill in ((u'firmado', '#0ca30c'), (u'en proceso', '#fab219'),
                  (u'no firmado', '#d03b3b'), (u'sin estatus', '#B9C4D0')):
    print(u'         %-20s blanco %5.2f:1   zebra %5.2f:1'
          % (etq, contraste(fill, BLANCO), contraste(fill, ZEBRA)))

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
