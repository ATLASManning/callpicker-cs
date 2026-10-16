# -*- coding: utf-8 -*-
"""
Mide el texto TENUE —blanco translucido— contra el fondo REAL de cada panel.

== POR QUE EXISTE ==
El tablero pinta el texto secundario con `rgba(255,255,255,alfa)`. El ratio que
eso da NO depende del alfa solamente: depende del panel donde cae la letra. Un
0.45 que mide 4.47:1 sobre el marino viejo `#0D1829` se queda en menos sobre el
`#082742` de la paleta nueva, porque ese azul es mas CLARO. Y si la letra cae
dentro de una caja con tinte blanco (`rgba(255,255,255,0.08)`, que el tablero
usa 27 veces), el fondo se aclara otra vez y el ratio baja mas.

Por eso un reemplazo ciego de alfas no sirve: hay que medir el PEOR caso, que es
la superficie mas CLARA sobre la que de verdad se pinta texto tenue.

== LOS TRES PASOS ==
  PASO 1  Reproducir las cifras YA VERIFICADAS que documentan el codigo y la
          bitacora. Si la replica no reproduce lo conocido, nada de lo que diga
          despues vale. Sale con codigo 2.
  PASO 2  Medir cada superficie real en uso hoy, con y sin tinte anidado, y
          decir el alfa minimo que alcanza 4.5:1 en TODAS.
  PASO 3  Juzgar el token elegido. Sale con codigo 1 si falla en alguna.

Uso:  python scripts/mide-texto-tenue.py [alfa]
      (sin argumento usa el TX_TENUE que lea de lib/contraste.ts)
"""
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OBJETIVO = 4.5          # WCAG AA, texto normal
OBJ_GRAFICO = 3.0       # WCAG 1.4.11, objeto grafico


# ── Primitivas WCAG ───────────────────────────────────────────────────────────

def hex_a_rgb(h):
    s = str(h).strip().lstrip('#')
    if len(s) == 3:
        s = ''.join(c * 2 for c in s)
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def canal(c):
    x = c / 255.0
    return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4


def luminancia(c):
    return 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2])


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def compone(frente, alfa, fondo):
    """El color que de verdad se ve: `frente` al `alfa` encima de `fondo`."""
    return tuple(frente[i] * alfa + fondo[i] * (1 - alfa) for i in range(3))


BLANCO = (255, 255, 255)


def mide_tenue(alfa, fondo_hex, tinte=0.0):
    """Ratio del blanco al `alfa` sobre `fondo_hex` (con `tinte` blanco encima).

    El tinte aclara el FONDO, y un fondo mas claro baja el contraste del texto
    blanco. Se mide contra el fondo compuesto, que es el que el ojo ve.
    """
    base = hex_a_rgb(fondo_hex)
    fondo = compone(BLANCO, tinte, base) if tinte else base
    texto = compone(BLANCO, alfa, fondo)
    return contraste(texto, fondo)


def alfa_minimo(fondo_hex, tinte=0.0, objetivo=OBJETIVO):
    """El alfa mas bajo, en centesimas, que alcanza `objetivo`."""
    for centesimas in range(1, 101):
        if mide_tenue(centesimas / 100.0, fondo_hex, tinte) >= objetivo:
            return centesimas / 100.0
    return None


# ── PASO 1 · las cifras ya verificadas ────────────────────────────────────────
# Cada una esta documentada en el codigo o en la bitacora de contraste, medida
# en una sesion anterior. La replica tiene que reproducirlas ANTES de opinar.
CALIBRACION = [
    # (alfa, fondo,    esperado, de donde sale)
    (0.45, '#0F2040', 4.31, 'ColaDeTrabajoAsesor:30 — el 0.45 que reprobaba'),
    (0.47, '#0F2040', 4.57, 'ColaDeTrabajoAsesor:32 — «el alfa minimo que pasa es 0.47»'),
    (0.70, '#0F2040', 8.48, 'ColaDeTrabajoAsesor:29 — TX_MID'),
    (0.45, '#0D1829', 4.47, 'medicion del 9 oct: .cp-card de la paleta ANTERIOR'),
    (0.45, '#0F1620', 4.50, 'medicion del 9 oct: DashAlertasCriticas'),
    (0.45, '#0A1628', 4.48, 'medicion del 9 oct: tooltips de recharts'),
    (0.45, '#070C16', 4.51, 'medicion del 9 oct: app/chat (atlas.module.css)'),
]

# ── La septima cifra documentada, que NO cuadra y por que ─────────────────────
# `ColaDeTrabajoAsesor.tsx:34` rotula su TX_LOW de 0.50 como «4.84:1». La
# formula de WCAG da 4.99:1 para 0.50 sobre #0F2040. El 4.84 es el ratio de
# **0.49** (4.848), asi que la cifra del 8 oct se calculo con un alfa y se
# escribio junto a otro. Lo demas de ese mismo comentario —el 4.31 del 0.45 y
# el 4.57 del 0.47— reproduce EXACTO, que es lo que descarta un error de
# formula y lo deja en un rotulo mal puesto. Se corrige en el codigo: una cifra
# falsa en un comentario es lo que hace que no se crea la siguiente.


def paso1():
    print('PASO 1 · reproducir lo ya verificado')
    print('-' * 78)
    fallos = []
    for alfa, fondo, esperado, fuente in CALIBRACION:
        medido = mide_tenue(alfa, fondo)
        ok = abs(medido - esperado) <= 0.015
        print('  %-5s sobre %-8s  esperado %.2f  medido %.2f  %s'
              % (alfa, fondo, esperado, medido, 'OK' if ok else '<<< NO CUADRA'))
        if not ok:
            fallos.append((alfa, fondo, esperado, medido, fuente))
    if fallos:
        print()
        print('  La replica NO reproduce las cifras conocidas. No mide nada mas.')
        for alfa, fondo, esperado, medido, fuente in fallos:
            print('    %s sobre %s: %.4f != %.2f  (%s)' % (alfa, fondo, medido, esperado, fuente))
        return False
    print('  Las %d cifras conocidas se reproducen. La replica se puede usar.' % len(CALIBRACION))
    return True


# ── PASO 2 · las superficies REALES de hoy ───────────────────────────────────
# Leidas del arbol el 16 oct 2026, no de memoria. El tinte es el mas CLARO que
# se encontro envolviendo texto tenue en ese archivo (peor caso).
SUPERFICIES = [
    # (fondo,     tinte, de donde sale)
    ('#082742', 0.09, '.cp-card de globals.css:89 (paleta CS, 13 oct) + el tinte mas claro'),
    ('#082742', 0.08, '.cp-card + rgba(255,255,255,0.08), el tinte mas usado (27 veces)'),
    ('#082742', 0.05, '.cp-card + thead rgba(255,255,255,0.05) de globals.css:84'),
    ('#082742', 0.00, '.cp-card a pelo'),
    ('#16233A', 0.00, 'app/facturacion/page.tsx:501, cabecera sticky'),
    ('#16243D', 0.00, 'app/analisis-llamadas/page.tsx:617, pie sticky'),
    ('#0D1829', 0.07, 'Sidebar (#0D1829) + rgba(255,255,255,0.07) del renglon activo'),
    ('#0D1829', 0.00, 'app/alertas PANEL, analisis-llamadas DC, cortes DC, Sidebar'),
    ('#0F2040', 0.04, 'ColaDeTrabajoAsesor:49 — su CAJA rgba(255,255,255,0.04) sobre el degradado'),
    ('#0F2040', 0.00, 'extremo CLARO del degradado de AsesorCard / ColaDeTrabajoAsesor'),
    ('#0A0F1C', 0.00, 'JuntaAsesorPanel:193'),
    ('#0A1628', 0.00, 'extremo oscuro del degradado, y tooltips de recharts'),
]


def paso2():
    print()
    print('PASO 2 · las superficies reales en uso hoy')
    print('-' * 78)
    peor = 0.0
    peor_quien = None
    for fondo, tinte, fuente in SUPERFICIES:
        minimo = alfa_minimo(fondo, tinte)
        etiqueta = fondo if not tinte else '%s+%.2f' % (fondo, tinte)
        print('  %-14s alfa minimo para 4.5:1 = %.2f   %s' % (etiqueta, minimo, fuente))
        if minimo > peor:
            peor, peor_quien = minimo, (etiqueta, fuente)
    print()
    print('  El que APRIETA es %s (%s): exige %.2f' % (peor_quien[0], peor_quien[1], peor))
    print('  Un token unico tiene que ser >= %.2f para pasar en TODAS.' % peor)
    return peor


# ── PASO 3 · juzgar el token ──────────────────────────────────────────────────

def lee_token_del_fuente():
    """El alfa se LEE del fuente, no se pasa a mano. Si no se puede leer, falla."""
    ruta = os.path.join(RAIZ, 'lib', 'contraste.ts')
    try:
        with open(ruta, encoding='utf-8') as fh:
            txt = fh.read()
    except OSError as e:
        return None, 'no se pudo leer lib/contraste.ts (%s)' % e
    m = re.search(r"TX_TENUE\s*=\s*['\"]rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([0-9.]+)\s*\)['\"]", txt)
    if not m:
        return None, 'lib/contraste.ts no declara TX_TENUE todavia'
    return float(m.group(1)), None


def alfa_del_css():
    """`.cp-card .text-textLow` de globals.css: el MISMO valor, escrito aparte.

    El CSS no puede importar el token de TypeScript, asi que el valor vive dos
    veces. Dos copias del mismo numero divergen —es la historia entera de este
    bug—, de modo que aqui se comprueba que no lo hayan hecho.
    """
    ruta = os.path.join(RAIZ, 'app', 'globals.css')
    try:
        with open(ruta, encoding='utf-8') as fh:
            txt = fh.read()
    except OSError as e:
        return None, 'no se pudo leer app/globals.css (%s)' % e
    m = re.search(
        r'\.cp-card\s+\.text-textLow\s*\{[^}]*color:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([0-9.]+)\s*\)',
        txt)
    if not m:
        return None, 'globals.css no declara .cp-card .text-textLow'
    return float(m.group(1)), None


def paso4(alfa_token):
    print()
    print('PASO 4 - el gemelo en CSS (.cp-card .text-textLow)')
    print('-' * 78)
    css, error = alfa_del_css()
    if css is None:
        print('  NO SE PUDO LEER: %s' % error)
        print('  Eso es un FALLO, no un "todo bien".')
        return False
    print('  globals.css dice %s, el token dice %s' % (css, alfa_token))
    if abs(css - alfa_token) > 1e-9:
        print('  DIVERGEN. Los dos valores son el mismo texto tenue y tienen que')
        print('  moverse juntos. Lo que mide el CSS en la superficie que aprieta:')
        for fondo, tinte, _ in SUPERFICIES[:3]:
            etiqueta = '%s+%.2f' % (fondo, tinte) if tinte else fondo
            print('    %-14s %.2f:1' % (etiqueta, mide_tenue(css, fondo, tinte)))
        return False
    print('  Coinciden.')
    return True


def paso3(alfa, minimo_exigido, origen):
    print()
    print('PASO 3 · el token elegido: %s (%s)' % (alfa, origen))
    print('-' * 78)
    fallos = []
    for fondo, tinte, fuente in SUPERFICIES:
        r = mide_tenue(alfa, fondo, tinte)
        etiqueta = fondo if not tinte else '%s+%.2f' % (fondo, tinte)
        ok = r >= OBJETIVO
        print('  %-14s %.2f:1  %s' % (etiqueta, r, 'OK' if ok else '<<< REPRUEBA'))
        if not ok:
            fallos.append((etiqueta, r, fuente))
    print()
    if fallos:
        print('  REPRUEBA en %d superficie(s):' % len(fallos))
        for etiqueta, r, fuente in fallos:
            print('    %s -> %.2f:1  (%s)' % (etiqueta, r, fuente))
        print('  El minimo que pasa en todas es %.2f.' % minimo_exigido)
        return False
    rangos = [mide_tenue(alfa, f, t) for f, t, _ in SUPERFICIES]
    print('  PASA en las %d superficies. Rango %.2f:1 a %.2f:1.'
          % (len(SUPERFICIES), min(rangos), max(rangos)))
    return True


def main():
    print('=' * 78)
    print('TEXTO TENUE · blanco translucido sobre los paneles oscuros')
    print('=' * 78)
    print()

    if not paso1():
        sys.exit(2)

    minimo = paso2()

    if len(sys.argv) > 1:
        alfa, origen = float(sys.argv[1]), 'argumento'
    else:
        alfa, error = lee_token_del_fuente()
        if alfa is None:
            print()
            print('PASO 3 · NO SE PUDO LEER EL TOKEN: %s' % error)
            print('  Eso es un FALLO, no un "todo bien".')
            sys.exit(1)
        origen = 'leido de lib/contraste.ts'

    ok3 = paso3(alfa, minimo, origen)
    ok4 = paso4(alfa)
    if not (ok3 and ok4):
        sys.exit(1)

    print()
    print('Nota honesta: esto mide la REPLICA en Python de la formula de WCAG')
    print('sobre los fondos leidos del arbol, no el TypeScript servido.')
    sys.exit(0)


if __name__ == '__main__':
    main()
