# -*- coding: utf-8 -*-
u"""
MIDE EL MENÚ LATERAL CONTRA EL DEGRADADO
========================================

    python scripts/mide-paleta-sidebar.py

Dirección pidió que el índice de apartados dejara el marino plano
(`#0D1829`) y llevara el degradado del hero, con los círculos y el texto en
blanco brillante.

POR QUÉ ESTE SCRIPT EXISTE Y NO BASTA CON CAMBIAR EL FONDO
----------------------------------------------------------
El menú pintaba SEIS tonos de TEXTO como blanco translúcido —0.50, 0.55,
0.60, 0.75— y todos estaban medidos contra un marino casi negro. El degradado
del hero termina en `#1F6A90`, que es MUCHO más claro: cada una de esas
mediciones caduca de golpe, y ninguna avisa.

Es exactamente lo que pasó en la 10ª ronda, cuando `.cp-card` pasó de
`#0D1829` a `#082742` y un alfa que medía bien cayó a 4.41 sin que nadie
tocara una línea de color. [[atlas-dashboard-contrast-architecture]]

**UN DEGRADADO SE MIDE POR SU EXTREMO CLARO**, que es el que aprieta. Aquí se
miden los dos, para dejar ver cuánto se pierde de un extremo al otro.

EL ESPEJO
---------
Los topes del degradado se LEEN de `lib/paleta-cs.ts`. Si alguien los cambia
ahí y este script siguiera con su copia tecleada, daría verde sobre una
medición falsa — un espejo tecleado a mano deja de ser espejo.
"""
from __future__ import print_function
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ── WCAG ─────────────────────────────────────────────────────────────────────

def _canal(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminancia(rgb):
    r, g, b = rgb
    return 0.2126 * _canal(r) + 0.7152 * _canal(g) + 0.0722 * _canal(b)


def hex_a_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def compone(frente_rgb, alfa, fondo_rgb):
    u"""Un color translúcido NO es un color: es lo que resulta de ponerlo sobre
    el fondo. Se compone antes de medir — medir el alfa a pelo es el error que
    hace que `rgba(255,255,255,0.05)` parezca que oscurece algo."""
    return tuple(
        int(round(alfa * frente_rgb[i] + (1 - alfa) * fondo_rgb[i]))
        for i in range(3)
    )


# ── El espejo: los topes salen del archivo de paleta ─────────────────────────

def topes_del_degradado():
    ruta = os.path.join(RAIZ, 'lib', 'paleta-cs.ts')
    txt = io.open(ruta, encoding='utf-8').read()
    m = re.search(r"const\s+HERO_TOPES\s*=\s*'([^']+)'", txt)
    if not m:
        m = re.search(r"export const HERO\s*=\s*'linear-gradient\([^,]+,([^']+)\)'", txt)
        if not m:
            print(u'  *** No pude leer los topes del degradado de lib/paleta-cs.ts ***')
            sys.exit(2)
    crudo = m.group(1)
    hexes = re.findall(r'#[0-9A-Fa-f]{6}', crudo)
    if len(hexes) < 2:
        print(u'  *** Los topes leídos no traen al menos dos colores: %s ***' % crudo)
        sys.exit(2)
    return hexes


def aclara_hasta(hexc, fondo_rgb, objetivo):
    u"""Sube el tono hacia el blanco hasta que mide, conservando el matiz.

    Las cuatro funciones de `lib/contraste.ts` OSCURECEN, porque nacieron para
    fondos claros. Aquí el fondo es medio-oscuro y la salida es la contraria:
    hay que ACLARAR. Se mezcla con blanco en pasos del 2% y se mide el hex YA
    REDONDEADO —medir el candidato en coma flotante y servir el redondeado se
    come hasta una décima, que es el bug que tenían las tres funciones
    originales—. Devuelve None si ni el blanco puro llega.
    """
    base = hex_a_rgb(hexc)
    for paso in range(0, 51):
        t = paso / 50.0
        cand = tuple(int(round(base[i] + (255 - base[i]) * t)) for i in range(3))
        if contraste(cand, fondo_rgb) >= objetivo:
            return '#%02X%02X%02X' % cand
    return None


# ── Lo que hay que medir ─────────────────────────────────────────────────────
# (etiqueta, color, tipo)   tipo: 'texto' exige 4.5 · 'grafico' exige 3.0
#
# Los blancos translúcidos se escriben como ('blanco', alfa) para componerlos
# contra el fondo antes de medir.

def _sidebar_sin_comentarios():
    ruta = os.path.join(RAIZ, 'components', 'Sidebar.tsx')
    txt = io.open(ruta, encoding='utf-8').read()
    # Quita comentarios de bloque, de línea y de JSX: este archivo DOCUMENTA los
    # tonos viejos en prosa, así que medir los comentarios haría fallar al script
    # por los números que explican por qué se cambiaron. Uso contra mención.
    txt = re.sub(r'\{/\*.*?\*/\}', '', txt, flags=re.S)
    txt = re.sub(r'/\*.*?\*/', '', txt, flags=re.S)
    txt = re.sub(r'//[^\n]*', '', txt)
    return txt


def colores_literales(txt):
    u"""Los patrones del barrido, separados de la lectura del archivo para
    poder ejercitarlos contra un texto fabricado. Ver `autoprueba()`."""
    fuera = []
    for m in re.finditer(r"color:\s*'rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)'", txt):
        fuera.append(('alfa', float(m.group(1))))
    # `color: '…'` en el estilo Y `style.color = '…'` en los manejadores de
    # hover: el segundo sitio es donde se escondía un `#fff` que el barrido no
    # veía. Un color que sólo aparece al pasar el ratón se mide igual.
    for m in re.finditer(r"\.color\s*=\s*'rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)'", txt):
        fuera.append(('alfa', float(m.group(1))))
    for m in re.finditer(r"(?:color:|\.color\s*=)\s*'(#[0-9A-Fa-f]{3,6})'", txt):
        h = m.group(1)
        if len(h) == 4:                      # #fff → #ffffff
            h = '#' + ''.join(c * 2 for c in h[1:])
        fuera.append(('hex', h.upper()))
    # dedup conservando el orden
    vistos, unicos = set(), []
    for f in fuera:
        if f not in vistos:
            vistos.add(f)
            unicos.append(f)
    return unicos


u"""EL CONTROL NEGATIVO DEL BARRIDO.

Un barrido que da verde puede estar dando verde porque no hay nada que
encontrar o porque NO SABE BUSCAR, y las dos cosas se ven igual desde fuera.
Este texto fabricado ejercita los CUATRO sitios donde se puede teclear un color
en este archivo; si alguno deja de dispararse, `--autoprueba` sale con 1.

Y el texto va DENTRO de este bloque para que el propio recortador de
comentarios lo quite del archivo real: lo que está entre comentarios es mención,
no uso.
"""
TEXTO_MALO = u"""
  <p style={{ color: 'rgba(255,255,255,0.55)' }}>uno</p>
  <p style={{ color: '#9ACDFF' }}>dos</p>
  <b onMouseEnter={e => (e.currentTarget.style.color = '#fff')} />
  <b onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')} />
"""
ESPERADO_MALO = [('alfa', 0.55), ('alfa', 0.6), ('hex', '#9ACDFF'), ('hex', '#FFFFFF')]


def autoprueba():
    hallado = sorted(colores_literales(TEXTO_MALO))
    quiero = sorted(ESPERADO_MALO)
    print(u'')
    print(u'  AUTOPRUEBA DEL BARRIDO — texto fabricado con los 4 sitios')
    for esperado in quiero:
        ok = esperado in hallado
        print(u'    %-22s %s' % (u'%s %s' % esperado, u'detectado' if ok else u'*** NO LO VIO ***'))
    sobra = [h for h in hallado if h not in quiero]
    for s in sobra:
        print(u'    %-22s *** detectó algo que no estaba ***' % (u'%s %s' % s))
    if hallado == quiero:
        print(u'  El barrido ve los 4 sitios.')
        return 0
    print(u'  *** El barrido NO ejercita todos sus patrones. ***')
    return 1


def lee_colores_del_sidebar():
    u"""BARRE EL ARCHIVO, no una lista tecleada aparte.

    Saca TODO lo que `Sidebar.tsx` pone como `color:` con un valor literal —el
    `rgba(255,255,255,a)` de antes y cualquier hex que alguien escriba mañana— y
    lo mide contra el degradado. Una lista fija a mano aquí sería el mismo
    defecto de las «paletas gemelas»: se queda corta en cuanto alguien añade un
    color y el script seguiría dando verde.

    Los `color:` que apuntan a una CONSTANTE (TX, TX_SEC, textoSobreSolido(...))
    no caen aquí a propósito: esos ya están medidos arriba, o los calcula
    `lib/contraste.ts` contra su propio fondo.
    """
    return colores_literales(_sidebar_sin_comentarios())


u"""LOS CUATRO COLORES DE ROL YA NO SE MIDEN COMO TEXTO.

Medidos contra el extremo claro daban 2.34 (admin), 3.10 (asesor), 3.57
(viewer) y 1.51 (perfilamiento) — y el morado YA FALLABA sobre el marino viejo,
con 3.55. Aclararlos hacia el blanco los deja en pasteles de 4.50–4.55 que
dejan de distinguirse entre sí, o sea que el color pierde justo lo que venía a
hacer.

Se mudaron al CÍRCULO del avatar como relleno sólido. Ahí:
  · el icono de encima lo elige `textoSobreSolido()` contra ESE relleno, no
    contra el degradado, y esa función ya mide;
  · el círculo lleva un aro de blanco al 35% que es lo que lo separa del fondo,
    y ESO sí se mide aquí abajo;
  · el relleno en sí es decorativo: `rolLabel` dice el rol CON PALABRAS justo al
    lado, así que el color no es lo único que distingue nada.
"""

CANDIDATOS_FIJOS = [
    (u'texto principal  #FFFFFF',        '#FFFFFF', 'texto'),
    (u'HERO_PILL        #E5F1FA',        '#E5F1FA', 'texto'),
    (u'HERO_LEAD        #D7E7F2',        '#D7E7F2', 'texto'),
    (u'HERO_TAG         #B3E8FF',        '#B3E8FF', 'texto'),
    (u'HERO_CIAN        #8AD7F8',        '#8AD7F8', 'grafico'),
]

# Compuestos: un translúcido NO es un color. (etiqueta, frente, alfa, tipo)
# El velo del badge es NEGRO: blanco al 15% ACLARA el degradado y deja al
# blanco puro en 4.10 — por debajo de 4.5. Oscurecer el sitio devuelve margen.
# El aro del avatar NO lleva un alfa tecleado: usa `HERO_BORDE`, que es el
# mismo borde ya medido de las pastillas del hero. Blanco al 35% medía 2.05 en
# el extremo claro y no llegaba ni al 3:1 de elemento gráfico.
#
# Y el alfa TAMPOCO se teclea aquí: se lee de `lib/paleta-cs.ts`. Escribir 0.60
# en este archivo haría que bajar el token a 0.40 siguiera dando verde.


def alfa_de_hero_borde():
    ruta = os.path.join(RAIZ, 'lib', 'paleta-cs.ts')
    txt = io.open(ruta, encoding='utf-8').read()
    m = re.search(
        r"export const HERO_BORDE\s*=\s*'rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)'", txt)
    if not m:
        print(u'  *** No pude leer HERO_BORDE de lib/paleta-cs.ts ***')
        sys.exit(2)
    return float(m.group(1))


VELOS = [
    (u'aro del avatar   HERO_BORDE', (255, 255, 255), alfa_de_hero_borde(), 'grafico'),
]
SOBRE_VELO = [
    # (etiqueta, texto, velo_frente, velo_alfa, tipo)
    (u'badge: #FFF sobre velo negro 25%', '#FFFFFF', (0, 0, 0), 0.25, 'texto'),
]


def main():
    fallo_autoprueba = autoprueba()
    topes = topes_del_degradado()
    oscuro, claro = topes[0], topes[-1]
    print(u'')
    print(u'  DEGRADADO DEL MENÚ — topes leídos de lib/paleta-cs.ts')
    print(u'  extremo OSCURO %s   ·   extremo CLARO %s  ← el que aprieta' % (oscuro, claro))
    print(u'  (%d topes en total: %s)' % (len(topes), u', '.join(topes)))
    print(u'')

    rgb_osc, rgb_cla = hex_a_rgb(oscuro), hex_a_rgb(claro)
    blanco = (255, 255, 255)

    filas = []
    for etiqueta, hexc, tipo in CANDIDATOS_FIJOS:
        rgb = hex_a_rgb(hexc)
        filas.append((etiqueta, tipo, contraste(rgb, rgb_osc), contraste(rgb, rgb_cla)))

    for etiqueta, frente, alfa, tipo in VELOS:
        filas.append((
            etiqueta, tipo,
            contraste(compone(frente, alfa, rgb_osc), rgb_osc),
            contraste(compone(frente, alfa, rgb_cla), rgb_cla),
        ))

    for etiqueta, texto, frente, alfa, tipo in SOBRE_VELO:
        rgb_tx = hex_a_rgb(texto)
        filas.append((
            etiqueta, tipo,
            contraste(rgb_tx, compone(frente, alfa, rgb_osc)),
            contraste(rgb_tx, compone(frente, alfa, rgb_cla)),
        ))

    # Y lo que el ARCHIVO escribe hoy como `color:` literal — el barrido.
    hallados = lee_colores_del_sidebar()
    for clase, valor in hallados:
        if clase == 'alfa':
            et = u'blanco al %d%%  (en Sidebar.tsx)' % int(round(valor * 100))
            filas.append((
                et, 'texto',
                contraste(compone(blanco, valor, rgb_osc), rgb_osc),
                contraste(compone(blanco, valor, rgb_cla), rgb_cla),
            ))
        else:
            et = u'%s  (en Sidebar.tsx)' % valor
            rgb = hex_a_rgb(valor)
            filas.append((et, 'texto',
                          contraste(rgb, rgb_osc), contraste(rgb, rgb_cla)))

    print(u'  %-34s %-8s %9s %9s   %s' % (u'color', u'exige', u'oscuro', u'CLARO', u'veredicto'))
    print(u'  ' + u'-' * 82)
    fallan = 0
    for etiqueta, tipo, c_osc, c_cla in filas:
        objetivo = 4.5 if tipo == 'texto' else 3.0
        ok = c_cla >= objetivo
        if not ok:
            fallan += 1
        print(u'  %-34s %-8s %8.2f  %8.2f   %s' % (
            etiqueta, u'%.1f:1' % objetivo, c_osc, c_cla,
            u'ok' if ok else u'*** NO PASA en el extremo claro ***'))

    print(u'')
    if fallan:
        print(u'  *** %d color(es) NO sirven sobre el extremo claro del degradado. ***' % fallan)
        print(u'  Un tono medido contra el marino plano NO vale sobre este fondo.')
        print(u'')
        print(u'  TONOS DERIVADOS que sí pasarían (aclarando hacia el blanco):')
        print(u'  %-22s %-10s %-10s %8s %8s' % (u'color', u'original', u'derivado', u'oscuro', u'CLARO'))
        print(u'  ' + u'-' * 66)
        for etiqueta, hexc, tipo in CANDIDATOS_FIJOS:
            objetivo = 4.5 if tipo == 'texto' else 3.0
            if contraste(hex_a_rgb(hexc), rgb_cla) >= objetivo:
                continue
            d = aclara_hasta(hexc, rgb_cla, objetivo)
            if d is None:
                print(u'  %-22s %-10s %s' % (etiqueta.split()[0] + ' ' + etiqueta.split()[1],
                                             hexc, u'ni el blanco puro basta'))
                continue
            rgbd = hex_a_rgb(d)
            print(u'  %-22s %-10s %-10s %7.2f  %7.2f' % (
                u' '.join(etiqueta.split()[:2]), hexc, d,
                contraste(rgbd, rgb_osc), contraste(rgbd, rgb_cla)))
        return 1
    print(u'  Los %d colores pasan en los DOS extremos del degradado.' % len(filas))
    return fallo_autoprueba


if __name__ == '__main__':
    sys.exit(main())
