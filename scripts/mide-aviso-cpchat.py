# -*- coding: utf-8 -*-
u"""
MIDE EL AVISO DE CALIDAD DEL DATO DE CALLPICKER CHAT
=====================================================

    python scripts/mide-aviso-cpchat.py

QUÉ VIGILA Y POR QUÉ HACEN FALTA LAS DOS COSAS
-----------------------------------------------
El aviso de arriba del módulo de Callpicker Chat cuelga de una `.cp-card`, y
sus tres cifras de hueco van en naranja `#F97316` dentro de un `<span>`. Ahí
se juntan dos fallos distintos que se disfrazan el uno del otro:

  1. **El naranja no se ve.** `globals.css` lleva
     `.cp-card span:not([style*="background"])`, así que un `<span>` que
     declare SOLO `color` se pinta blanco. El naranja se escribe, no se
     publica, y en pantalla no se distingue del resto del texto. Lo caza
     `scripts/revisa-contraste-cpcard.py`.

  2. **El naranja se ve y no se lee.** Salvarlo con `background:'transparent'`
     lo saca de esa regla, y entonces el color SÍ llega a la pantalla — sobre
     el marino real de la tarjeta, que es otro contraste. Un color rescatado
     sin medir es el bug de la ronda 10ª: `.cp-card` pasó de `#0D1829` a
     `#082742` y un alfa que medía bien cayó a 4.41 sin que nadie tocara una
     línea de color. [[atlas-dashboard-contrast-architecture]]

Arreglar (1) sin comprobar (2) cambia un texto invisible por un texto ilegible,
y las dos cosas se ven igual de bien en una captura.

EL ESPEJO
---------
Ni el fondo ni los colores van tecleados aquí. El fondo se LEE de la regla
`.cp-card` de `app/globals.css` y los colores se LEEN del bloque del aviso en
`app/callpicker-chat/page.tsx`. Un espejo de constantes tecleado a mano deja de
ser espejo: si alguien cambia el marino de la tarjeta, este guion tiene que
medir con el nuevo y ponerse rojo, no dar verde sobre una medición caducada.

Sale con 1 si un color del aviso no llega a 4.5:1 sobre el fondo real, o si un
`<span>` de color no declara el escape y por tanto nunca llega a pintarse.
"""
from __future__ import print_function
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGINA = os.path.join(RAIZ, 'app', 'callpicker-chat', 'page.tsx')
CSS = os.path.join(RAIZ, 'app', 'globals.css')

OBJETIVO = 4.5          # el aviso es `text-xs` (12px): texto normal, no grande


# ── WCAG ─────────────────────────────────────────────────────────────────────

def _canal(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminancia(rgb):
    r, g, b = rgb
    return 0.2126 * _canal(r) + 0.7152 * _canal(g) + 0.0722 * _canal(b)


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def compone(frente, alfa, fondo):
    u"""Un color translúcido NO es un color: es lo que resulta de ponerlo sobre
    el fondo. Medir el alfa a pelo da un número que no existe en pantalla."""
    return tuple(int(round(alfa * frente[i] + (1 - alfa) * fondo[i]))
                 for i in range(3))


def a_rgb(txt, fondo):
    u"""Convierte `#rrggbb`, `#rgb`, `white`/`#fff` o `rgba(r,g,b,a)` a un RGB
    opaco ya compuesto sobre `fondo`. Devuelve None si no sabe leerlo — y eso
    se reporta, no se ignora: un color que el guion no entiende es un color sin
    medir, no un color que pasa."""
    t = txt.strip().lower()
    if t == 'white':
        return (255, 255, 255)
    m = re.match(r'^#([0-9a-f]{3})$', t)
    if m:
        return tuple(int(m.group(1)[i] * 2, 16) for i in range(3))
    m = re.match(r'^#([0-9a-f]{6})$', t)
    if m:
        h = m.group(1)
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    m = re.match(r'^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$', t)
    if m:
        frente = tuple(int(m.group(i)) for i in (1, 2, 3))
        alfa = float(m.group(4)) if m.group(4) is not None else 1.0
        return compone(frente, alfa, fondo) if alfa < 1.0 else frente
    return None


# ── Los dos espejos ──────────────────────────────────────────────────────────

def fondo_de_la_tarjeta():
    u"""El marino real de `.cp-card`, leído de su propia regla."""
    txt = io.open(CSS, encoding='utf-8').read()
    m = re.search(r'\.cp-card\s*\{(.*?)\}', txt, re.S)
    if not m:
        print(u'  *** No encuentro la regla `.cp-card` en app/globals.css ***')
        sys.exit(2)
    c = re.search(r'background\s*:\s*(#[0-9A-Fa-f]{3,6})', m.group(1))
    if not c:
        print(u'  *** La regla `.cp-card` no declara un `background` hex ***')
        sys.exit(2)
    return c.group(1)


def bloque_del_aviso():
    u"""El bloque del aviso, delimitado por su propio comentario y el siguiente.

    Se delimita por los comentarios `{/* ── ... ── */}` que separan los bloques
    de la pantalla, no por números de línea: una línea de más arriba movería la
    medición a otro sitio sin avisar."""
    txt = io.open(PAGINA, encoding='utf-8').read()
    i = txt.find(u'Aviso de calidad del dato')
    if i < 0:
        print(u'  *** No encuentro el bloque «Aviso de calidad del dato» en %s ***'
              % os.path.relpath(PAGINA, RAIZ))
        print(u'      Si el aviso se renombró o se movió, hay que actualizar este guion:')
        print(u'      un medidor que no encuentra lo que mide tiene que fallar, no callar.')
        sys.exit(2)
    j = txt.find(u'{/* ──', i)          # el comentario del bloque siguiente
    if j < 0:
        j = len(txt)
    return txt[i:j], txt


# ── El barrido ───────────────────────────────────────────────────────────────

RX_SPAN = re.compile(r'<span\b([^>]*?)style=\{\{(.*?)\}\}', re.S)
RX_COLOR = re.compile(r"(?<![A-Za-z])color\s*:\s*'([^']+)'", re.I)
RX_BG = re.compile(r'background', re.I)
RX_BLANCO = re.compile(r"^\s*(?:#fff(?:fff)?|white|rgba?\(\s*255\s*,\s*255\s*,\s*255)", re.I)

FONDO_HEX = fondo_de_la_tarjeta()
FONDO = a_rgb(FONDO_HEX, (0, 0, 0))
AVISO, TODO = bloque_del_aviso()

print(u'')
print(u'  EL AVISO DE CALLPICKER CHAT CONTRA EL FONDO REAL DE LA TARJETA')
print(u'  ' + u'─' * 70)
print(u'  fondo `.cp-card`, leído de globals.css:  %s' % FONDO_HEX)
print(u'  objetivo: %.1f:1 (el aviso es text-xs = 12px, texto normal)' % OBJETIVO)
print(u'')

fallos = []

# 1 · ¿los <span> de color declaran el escape? Si no, el color no se publica.
print(u'  LOS <span> DE COLOR, Y SI LLEGAN A PINTARSE')
spans = RX_SPAN.findall(AVISO)
if not spans:
    fallos.append(u'el bloque del aviso no trae ni un <span> con style: '
                  u'o se reescribió, o este guion ya no mide lo que cree')
for atrs, estilo in spans:
    col = RX_COLOR.search(estilo)
    if not col:
        continue
    crudo = col.group(1)
    if RX_BLANCO.match(crudo):
        print(u'    %-28s ya es blanco · no necesita escape' % crudo)
        continue
    if RX_BG.search(estilo):
        print(u'    %-28s ok · declara `background`, el color sobrevive' % crudo)
    else:
        print(u'    %-28s *** SIN `background`: globals.css lo pinta de blanco ***' % crudo)
        fallos.append(u'el <span> de `%s` no declara `background`: ese color se '
                      u'escribe pero no se publica' % crudo)

# 2 · ¿se LEEN sobre el marino? Todos los colores del bloque, no solo los span.
print(u'')
print(u'  CADA COLOR DEL BLOQUE, MEDIDO')
vistos = []
for crudo in re.findall(r"color\s*:\s*'([^']+)'", AVISO) + \
             re.findall(r"borderLeftColor\s*:\s*'([^']+)'", AVISO):
    if crudo not in vistos:
        vistos.append(crudo)
for crudo in vistos:
    rgb = a_rgb(crudo, FONDO)
    if rgb is None:
        print(u'    %-28s *** no sé leer este color: queda SIN MEDIR ***' % crudo)
        fallos.append(u'«%s» no se pudo interpretar, así que no está medido' % crudo)
        continue
    r = contraste(rgb, FONDO)
    es_borde = crudo not in re.findall(r"(?<![A-Za-z])color\s*:\s*'([^']+)'", AVISO)
    if es_borde:
        # Un borde de 2px no es texto: su umbral es 3:1 (WCAG 1.4.11).
        veredicto = u'ok · borde, umbral 3:1' if r >= 3 else u'*** NO LLEGA A 3:1 (borde) ***'
        if r < 3:
            fallos.append(u'el borde `%s` mide %.2f:1 y no llega a 3:1' % (crudo, r))
    elif r >= OBJETIVO:
        veredicto = u'ok'
    elif r >= 3:
        veredicto = u'*** solo %.1f:1 — vale para texto grande, NO para 12px ***' % r
        fallos.append(u'`%s` mide %.2f:1 sobre %s y el aviso es de 12px: '
                      u'hace falta %.1f:1' % (crudo, r, FONDO_HEX, OBJETIVO))
    else:
        veredicto = u'*** NO PASA ***'
        fallos.append(u'`%s` mide %.2f:1 sobre %s: ilegible' % (crudo, r, FONDO_HEX))
    print(u'    %-28s %5.2f:1   %s' % (crudo, r, veredicto))

print(u'')
print(u'  ' + u'─' * 70)
if fallos:
    for f in fallos:
        print(u'  *** %s' % f)
    sys.exit(1)
print(u'  El aviso se publica entero y se lee entero sobre %s.' % FONDO_HEX)
sys.exit(0)
