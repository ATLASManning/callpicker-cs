# -*- coding: utf-8 -*-
"""Caza el bug de contraste nº1 del proyecto: el color semántico que se pierde.

   LA REGLA QUE LO CAUSA, en `app/globals.css`:

       .cp-card span:not([style*="background"]) { color: ... !important; }
       .cp-card p, .cp-card strong, .cp-card em, .cp-card small,
       .cp-card h1..h5, .cp-card td, .cp-card th  { color: ... !important; }

   O sea, dentro de una tarjeta oscura:

     · un <span> que declare SOLO `color` se pinta BLANCO. Para salvarlo hay
       que declarar también `background` —aunque sea `transparent`—, que es lo
       que lo saca del `:not([style*="background"])`.
     · un <strong>, <p>, <em>, <small>, <td> o <th> se pinta blanco SIEMPRE:
       esos selectores no llevan cláusula de escape. Ahí no hay `background`
       que valga — el color va en un <span> que sí la tenga.

   Van seis rondas de este mismo bug. Es un patrón fijo, así que se busca solo.

   ESTO ES UNA HEURÍSTICA, no un compilador de CSS: no sabe si la etiqueta está
   de verdad dentro de una `.cp-card`. Por eso solo mira archivos que mencionen
   `cp-card` y por eso imprime el contexto: la última palabra es de quien lee.
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# `<span ... style={{ ... }}>` con su objeto de estilo entero. El objeto puede
# ocupar varias líneas, así que se captura hasta el `}}` que lo cierra.
RX_SPAN = re.compile(r'<span\b([^>]*?)style=\{\{(.*?)\}\}', re.S)
# Las etiquetas que se fuerzan SIN escape posible.
RX_DURAS = re.compile(r'<(strong|em|small|p)\b([^>]*?)style=\{\{(.*?)\}\}', re.S)
RX_COLOR = re.compile(r'(?<![A-Za-z])color\s*:', re.I)
RX_BG    = re.compile(r'background', re.I)

# Un color que ya es blanco o casi no pierde nada al forzarse a blanco: esos no
# son el bug, son lo mismo escrito dos veces.
RX_YA_BLANCO = re.compile(
    r"""['"]\s*(?:#fff(?:fff)?|white|rgba?\(\s*255\s*,\s*255\s*,\s*255)""", re.I)


def pinta(ruta, linea, etiqueta, fragmento, motivo):
    print('  %s:%d' % (ruta, linea))
    print('     <%s> %s' % (etiqueta, motivo))
    print('     %s' % fragmento.replace('\n', ' ')[:120].strip())


def revisar(ruta_abs, rel):
    txt = io.open(ruta_abs, encoding='utf-8-sig').read()
    # Solo tiene sentido donde hay tarjetas oscuras.
    if 'cp-card' not in txt:
        return []
    fallos = []

    for m in RX_SPAN.finditer(txt):
        antes, estilo = m.group(1), m.group(2)
        if not RX_COLOR.search(estilo):
            continue
        if RX_BG.search(estilo) or RX_BG.search(antes):
            continue          # declara background: se salva del selector
        if RX_YA_BLANCO.search(estilo):
            continue          # ya era blanco, forzarlo no cambia nada
        if 'cp-light' in antes:
            continue          # va por la clase de escape
        fallos.append((txt[:m.start()].count('\n') + 1, 'span', m.group(0),
                       'declara color y NO background: globals.css lo pinta de blanco.'))

    for m in RX_DURAS.finditer(txt):
        etiqueta, estilo = m.group(1), m.group(3)
        if not RX_COLOR.search(estilo):
            continue
        if RX_YA_BLANCO.search(estilo):
            continue
        fallos.append((txt[:m.start()].count('\n') + 1, etiqueta, m.group(0),
                       'se fuerza a blanco SIEMPRE; el color va en un <span> con background.'))

    return fallos


def main():
    revisados = 0
    total = 0
    for base, dirs, ficheros in os.walk(RAIZ):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.git', 'scripts')]
        for f in sorted(ficheros):
            if not f.endswith(('.tsx', '.jsx')):
                continue
            ruta = os.path.join(base, f)
            rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
            fallos = revisar(ruta, rel)
            if 'cp-card' in io.open(ruta, encoding='utf-8-sig').read():
                revisados += 1
            for linea, etiqueta, frag, motivo in fallos:
                pinta(rel, linea, etiqueta, frag, motivo)
                print()
                total += 1

    print('  %d archivo(s) con .cp-card revisados.' % revisados)
    if total == 0:
        print('  ningun color semantico en riesgo de perderse.')
        return 0
    print('  *** %d color(es) que globals.css pintaria de blanco. ***' % total)
    print('  Arreglo: en un <span>, anadir `background` al style (vale')
    print('  `transparent`). En <strong>/<p>/<em>/<small>, mover el color a un')
    print('  <span> que lo declare, o usar la clase de escape .cp-light.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
