# -*- coding: utf-8 -*-
"""Letra clara en archivos que NUNCA dibujan una superficie oscura.

   POR QUE EXISTE
   --------------
   Octava ronda del mismo bug (8 oct 2026). `revisa-contraste-cpcard.py` cubre
   una direccion —el color que la cascada de `.cp-card` pinta de blanco dentro
   de una tarjeta oscura— y NO cubre la contraria, que es la que vuelve: texto
   claro sobre el `#EFF6FF` de la pagina, que solo se lee seleccionandolo.

   LA REGLA, QUE AQUI SI ES DECIDIBLE
   ----------------------------------
   Saber si un elemento cuelga de una `.cp-card` exige entender el arbol y eso
   no se puede por texto. Pero hay un caso que si: **un archivo que no declara
   NINGUNA superficie oscura no tiene donde poner letra clara**. Si ese archivo
   escribe blanco, es blanco sobre la pagina clara. Sin ambiguedad.

   Los archivos que declaran las dos cosas se cuentan aparte, como «hay que
   leerlos»: ahi la heuristica no alcanza y decirlo es mas honesto que inventar
   un veredicto.

   Resuelve las CONSTANTES del propio archivo, que es como se escribe de verdad
   —`const TX_HI = 'rgba(255,255,255,0.94)'` y luego `color: TX_HI`—; mirar solo
   los literales en linea no habria visto ni uno de los tres de `/alertas`.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/revisa-letra-clara-en-claro.py
       python scripts/revisa-letra-clara-en-claro.py --autoprueba
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETAS = ('app', 'components')
SALTAR = ('node_modules', '.next', '.git', 'scripts')

# Por encima de esto, el color es CLARO: no se lee sobre el fondo de pagina.
LUM_CLARA = 0.55
# Por debajo de esto, la superficie es OSCURA y la letra clara es correcta.
LUM_OSCURA = 0.30

RX_COMENTARIO = re.compile(r'/\*[\s\S]*?\*/|//[^\n]*')
RX_CONST = re.compile(r"""(?:const|let|var)\s+([A-Z][A-Z0-9_]*)\s*=\s*['"]([^'"]+)['"]""")
RX_COLOR = re.compile(r"""\bcolor\s*:\s*(?:['"]([^'"]+)['"]|([A-Z][A-Z0-9_]*))""")
RX_FONDO = re.compile(
    r"""\b(?:background|backgroundColor|backgroundImage)\s*:\s*(?:['"`]([^'"`]+)['"`]|([A-Z][A-Z0-9_]*))""")
RX_HEX = re.compile(r'#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b')
RX_RGBA = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)')
# Clases de Tailwind que pintan blanco pase lo que pase.
RX_CLASE_BLANCA = re.compile(r'\btext-white(?:/\d{1,3})?\b')


def canal(c):
    x = c / 255.0
    return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4


def luminancia(rgb):
    return 0.2126 * canal(rgb[0]) + 0.7152 * canal(rgb[1]) + 0.0722 * canal(rgb[2])


def a_rgb(valor):
    """El color de un texto CSS, o None si no se puede leer uno."""
    m = RX_RGBA.search(valor)
    if m:
        return [int(m.group(i)) for i in (1, 2, 3)]
    m = RX_HEX.search(valor)
    if m:
        h = m.group(1)
        if len(h) == 3:
            h = ''.join(c * 2 for c in h)
        return [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    v = valor.strip().lower()
    if v == 'white':
        return [255, 255, 255]
    if v == 'black':
        return [0, 0, 0]
    return None


def archivos():
    for base in CARPETAS:
        for dp, dn, fn in os.walk(os.path.join(RAIZ, base)):
            dn[:] = [d for d in dn if d not in SALTAR]
            for f in sorted(fn):
                if f.endswith('.tsx'):
                    yield os.path.join(dp, f)


def analiza(txt):
    """Devuelve (tiene_oscuro, tiene_claro, [(nombre_o_valor, rgb)] claros)."""
    limpio = RX_COMENTARIO.sub(' ', txt)
    consts = {n: v for n, v in RX_CONST.findall(limpio)}

    def resuelve(lit, nombre):
        if lit:
            return a_rgb(lit)
        if nombre and nombre in consts:
            return a_rgb(consts[nombre])
        return None

    # ── ¿Dibuja alguna superficie oscura? ──────────────────────────────
    tiene_oscuro = 'cp-card' in limpio
    tiene_claro_fondo = False
    for lit, nom in RX_FONDO.findall(limpio):
        rgb = resuelve(lit, nom)
        if rgb is None:
            continue
        # Un blanco translucido NO oscurece: hereda lo de detras. Es el caso
        # de `rgba(255,255,255,0.04)`, que sobre pagina clara sigue claro.
        l = luminancia(rgb)
        if l < LUM_OSCURA:
            tiene_oscuro = True
        elif l > LUM_CLARA:
            tiene_claro_fondo = True

    # ── Los colores de texto claros ────────────────────────────────────
    claros = []
    for lit, nom in RX_COLOR.findall(limpio):
        rgb = resuelve(lit, nom)
        if rgb is None:
            continue
        if luminancia(rgb) > LUM_CLARA:
            claros.append(nom or lit)
    if RX_CLASE_BLANCA.search(limpio):
        claros.append('text-white')
    return tiene_oscuro, tiene_claro_fondo, claros


CASOS_CAZA = [
    ('pagina clara con token blanco de tarjeta',
     "const TX_MID = 'rgba(255,255,255,0.72)'\n"
     "export default function P() {\n"
     "  return <div style={{ padding: 24 }}><p style={{ color: TX_MID }}>hola</p></div>\n}\n"),
    ('blanco literal sin ninguna superficie oscura',
     "export default function P() {\n"
     "  return <p style={{ color: '#FFFFFF' }}>hola</p>\n}\n"),
    ('clase text-white a nivel de pagina',
     "export default function P() { return <p className=\"text-white\">hola</p> }\n"),
]
CASOS_MUDOS = [
    ('tarjeta oscura declarada en el propio archivo',
     "const PANEL = '#0D1829'\nconst TX = 'rgba(255,255,255,0.9)'\n"
     "export default function P() {\n"
     "  return <div style={{ background: PANEL }}><p style={{ color: TX }}>hola</p></div>\n}\n"),
    ('cp-card de verdad, no en comentario',
     "export default function P() {\n"
     "  return <div className=\"cp-card\"><p style={{ color: '#fff' }}>hola</p></div>\n}\n"),
    ('isla clara con letra oscura, que es lo correcto',
     "export default function P() {\n"
     "  return <div style={{ background: '#FFFFFF' }}><p style={{ color: '#122E5E' }}>hola</p></div>\n}\n"),
    ('menciona cp-card SOLO en un comentario y usa letra oscura',
     "// esta pantalla no vive en una .cp-card\n"
     "export default function P() { return <p style={{ color: '#334155' }}>hola</p> }\n"),
    ('degradado oscuro como fondo',
     "const NAVY = '#0A1628'\n"
     "export default function P() {\n"
     "  return <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0F2040 100%)` }}>\n"
     "    <span style={{ color: '#FFFFFF' }}>hola</span></div>\n}\n"),
]

if '--autoprueba' in sys.argv:
    fallos = []
    print('  DEBE CAZARLOS:')
    for etq, src in CASOS_CAZA:
        osc, _, claros = analiza(src)
        ok = (not osc) and bool(claros)
        if not ok:
            fallos.append(etq)
        print('    %-46s %s' % (etq[:46], 'caza' if ok else '** SE LE ESCAPA'))
    print('\n  DEBE CALLAR:')
    for etq, src in CASOS_MUDOS:
        osc, _, claros = analiza(src)
        ok = osc or not claros
        if not ok:
            fallos.append('%s -> %s' % (etq, ', '.join(claros)))
        print('    %-46s %s' % (etq[:46], 'calla' if ok else '** GRITA'))
    print('\n  %s' % ('la autoprueba pasa entera' if not fallos
                      else '*** FALLA:\n    - ' + '\n    - '.join(fallos)))
    sys.exit(1 if fallos else 0)


seguros, mixtos, n = [], [], 0
for ruta in archivos():
    n += 1
    txt = io.open(ruta, encoding='utf-8-sig').read()
    osc, claro_fondo, claros = analiza(txt)
    if not claros:
        continue
    rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
    if not osc:
        seguros.append((rel, sorted(set(claros))))
    elif claro_fondo:
        mixtos.append((rel, sorted(set(claros))))

print('  %d archivo(s) .tsx revisados.\n' % n)
if seguros:
    print('  *** LETRA CLARA SIN NINGUNA SUPERFICIE OSCURA ***')
    print('  Estos archivos no declaran ni una `.cp-card` ni un fondo oscuro,')
    print('  así que su texto claro cae sobre el #EFF6FF de la página.\n')
    for rel, cs in seguros:
        print('  %s' % rel)
        print('      %s' % ', '.join(cs)[:100])
else:
    print('  ningún archivo pone letra clara sin tener dónde ponerla.')

if mixtos:
    print('\n  --- Y %d con fondos de los DOS tipos: hay que leerlos ---' % len(mixtos))
    print('  La heurística no sabe cuál texto cae en cuál fondo. No son')
    print('  hallazgos: son los que no se pueden decidir desde fuera.')
    for rel, cs in mixtos:
        print('  %s' % rel)

sys.exit(1 if seguros else 0)
