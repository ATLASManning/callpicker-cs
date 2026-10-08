# -*- coding: utf-8 -*-
"""Letra clara en archivos que NUNCA dibujan una superficie oscura.

   POR QUE EXISTE
   --------------
   Octava ronda del mismo bug (8 oct 2026). `revisa-contraste-cpcard.py` cubre
   una direccion â€”el color que la cascada de `.cp-card` pinta de blanco dentro
   de una tarjeta oscuraâ€” y NO cubre la contraria, que es la que vuelve: texto
   claro sobre el `#EFF6FF` de la pagina, que solo se lee seleccionandolo.

   LA REGLA, QUE AQUI SI ES DECIDIBLE
   ----------------------------------
   Saber si un elemento cuelga de una `.cp-card` exige entender el arbol y eso
   no se puede por texto. Pero hay un caso que si: **un archivo que no declara
   NINGUNA superficie oscura no tiene donde poner letra clara**. Si ese archivo
   escribe blanco, es blanco sobre la pagina clara. Sin ambiguedad.

   Los archivos que declaran las dos cosas se cuentan aparte, como Â«hay que
   leerlosÂ»: ahi la heuristica no alcanza y decirlo es mas honesto que inventar
   un veredicto.

   Resuelve las CONSTANTES del propio archivo, que es como se escribe de verdad
   â€”`const TX_HI = 'rgba(255,255,255,0.94)'` y luego `color: TX_HI`â€”; mirar solo
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


def sin_comentarios(txt):
    """Quita los comentarios CONSERVANDO los saltos de línea.

       Sustituirlos por un espacio a secas desplaza todos los números de línea
       posteriores, y un detector que señala la línea equivocada manda a leer
       otra cosa. Se vio aquí mismo: reportaba `base-cs/page.tsx:675` para un
       `style` que está ciento y pico líneas más abajo.
    """
    return RX_COMENTARIO.sub(lambda m: re.sub(r'[^\n]', ' ', m.group(0)), txt)
RX_CONST = re.compile(r"""(?:const|let|var)\s+([A-Z][A-Z0-9_]*)\s*=\s*['"]([^'"]+)['"]""")
# El punto en la mirada-atras no sobra: sin el, el `cat.color : BORDER` de un
# ternario dentro de un template —`border: \`1px solid ${query ? cat.color :
# BORDER}\`\`— se lee como una declaracion `color: BORDER` y acusa al buscador
# de base-cs de 1.42:1. Un acceso a propiedad no es una declaracion CSS.
RX_COLOR = re.compile(r"""(?<![A-Za-z.])color\s*:\s*(?:['"]([^'"]+)['"]|([A-Z][A-Z0-9_]*))""")
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


RX_HEX8 = re.compile(r'#([0-9a-fA-F]{8})\b')
RX_RGBA_A = re.compile(r'rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)')


def a_rgba(valor):
    """(rgb, alfa). El alfa importa: un tinte NO es un fondo, toma el de atrás.

       El hex de OCHO digitos —`#F9731622`— es como se escribe un tinte en
       este repo (`${col}22`, `${e.color}44`) y la autoprueba destapo que no se
       estaba leyendo: `RX_HEX` pide `\\b` tras seis digitos y los dos del alfa
       lo rompen. Justo el caso del mosaico de /alertas, o sea el unico que
       este chequeo existe para cazar.
    """
    m = RX_HEX8.search(valor)
    if m:
        h = m.group(1)
        return [int(h[i:i + 2], 16) for i in (0, 2, 4)], int(h[6:8], 16) / 255.0
    rgb = a_rgb(valor)
    if rgb is None:
        return None, None
    ma = RX_RGBA_A.search(valor)
    return rgb, (float(ma.group(1)) if ma else 1.0)


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


def objetos_style(txt):
    """Cada `style={{ â€¦ }}` del archivo, con su contenido y su linea.

       Se recorre con balance de llaves y no con una expresion regular porque
       dentro hay `${â€¦}`, objetos anidados y plantillas: un `[^}]*` corta en la
       primera llave y se pierde justo el `color` que viene despues.
    """
    out = []
    for m in re.finditer(r'style=\{\{', txt):
        i = m.end()
        prof, n = 2, len(txt)
        while i < n and prof:
            if txt[i] == '{':
                prof += 1
            elif txt[i] == '}':
                prof -= 1
                if prof == 0:
                    break
            i += 1
        out.append((txt.count('\n', 0, m.start()) + 1, txt[m.end():i]))
    return out


RX_TERNARIO_FONDO = re.compile(
    r"""\b(?:background|backgroundColor)\s*:\s*[^,}]*?\?\s*"""
    r"""(?:['"`]([^'"`]*)['"`]|([A-Za-z_$][\w$]*))\s*:\s*"""
    r"""(?:['"`]([^'"`]*)['"`]|([A-Za-z_$][\w$]*))""")


def pares_medibles(txt):
    """Elementos que declaran SU PROPIO fondo y SU PROPIO color.

       Es el unico caso totalmente decidible desde fuera: no hace falta saber
       nada del arbol, los dos lados estan en el mismo `style`. Se mide y se
       acabo.
    """
    limpio = sin_comentarios(txt)
    consts = {n: v for n, v in RX_CONST.findall(limpio)}

    def resuelve(lit, nombre):
        if lit:
            return a_rgb(lit)
        if nombre and nombre in consts:
            return a_rgb(consts[nombre])
        return None

    def resuelve_a(lit, nombre):
        if lit:
            return a_rgba(lit)
        if nombre and nombre in consts:
            return a_rgba(consts[nombre])
        return None, None

    malos, volteos = [], []
    for linea, cuerpo in objetos_style(limpio):
        # â”€â”€ El fondo que CAMBIA de claro a oscuro con una condicion â”€â”€â”€â”€â”€â”€â”€
        # El texto de dentro no puede ser correcto en los dos estados. Es el
        # bug del mosaico seleccionado de /alertas, 8 oct 2026.
        for m in RX_TERNARIO_FONDO.finditer(cuerpo):
            a = resuelve_a(m.group(1), m.group(2))
            b = resuelve_a(m.group(3), m.group(4))
            if a[0] is None or b[0] is None:
                continue
            # La regla: una rama es OPACA Y OSCURA y la otra es clara o es un
            # TINTE. Un tinte toma el fondo de atrás, así que la letra que
            # servía sobre la tarjeta oscura deja de servir en cuanto el
            # elemento se pinta de tinte sobre la página clara. Dos tintes
            # entre sí no son un volteo — RadarCuenta hace eso y está bien.
            def opaco_oscuro(x):
                return x[1] >= 0.85 and luminancia(x[0]) < LUM_OSCURA

            def claro_o_tinte(x):
                return x[1] < 0.85 or luminancia(x[0]) > LUM_CLARA

            if not ((opaco_oscuro(a) and claro_o_tinte(b))
                    or (opaco_oscuro(b) and claro_o_tinte(a))):
                continue
            # Si el COLOR tambien es condicional, el autor ya penso en los dos
            # estados: una pestana que cambia de fondo y de letra a la vez esta
            # bien. Sin esta guarda salian doce falsos positivos de pestanas y
            # botones, que es como se desactiva un detector.
            mcol = RX_COLOR.search(cuerpo)
            # SIN `color` propio en el mismo objeto no hay nada que decidir: el
            # texto lo pone otro, o no hay texto. Asi salian barras de progreso
            # de 1.5px de alto y contenedores de menu — once avisos de doce.
            if not mcol:
                continue
            tramo = cuerpo[mcol.start():cuerpo.find(',', mcol.end())]
            # Si el COLOR tambien es condicional, el autor ya penso en los dos
            # estados: una pestana que cambia de fondo y de letra a la vez esta
            # bien.
            if '?' in tramo:
                continue
            volteos.append((linea, m.group(0)[:70], mcol.group(1) or mcol.group(2)))

        mf = RX_FONDO.search(cuerpo)
        mc = RX_COLOR.search(cuerpo)
        if not mf or not mc:
            continue
        fondo, alfa = resuelve_a(mf.group(1), mf.group(2))
        color = resuelve(mc.group(1), mc.group(2))
        if fondo is None or color is None:
            continue
        # Un fondo translucido NO se puede medir: depende de lo que tenga
        # detras. Solo se miden los opacos.
        #
        # Se mira el alfa del color YA RESUELTO, no del literal. La primera
        # version preguntaba si la cadena traia «rgba», y eso falla cuando el
        # fondo viene de una constante —`background: RED_BG`— que es como se
        # escribe casi siempre: `RED_BG` es `rgba(239,68,68,0.09)` sobre una
        # tarjeta oscura y salia acusado de 1.98:1 contra el rojo del texto,
        # midiendo un fondo que no existe.
        if alfa is None or alfa < 0.85:
            continue
        lf, lc = luminancia(fondo), luminancia(color)
        ratio = (max(lf, lc) + 0.05) / (min(lf, lc) + 0.05)
        if ratio < 3.0:
            malos.append((linea, round(ratio, 2),
                          mc.group(1) or mc.group(2), mf.group(1) or mf.group(2)))
    return malos, volteos


def archivos():
    for base in CARPETAS:
        for dp, dn, fn in os.walk(os.path.join(RAIZ, base)):
            dn[:] = [d for d in dn if d not in SALTAR]
            for f in sorted(fn):
                if f.endswith('.tsx'):
                    yield os.path.join(dp, f)


def analiza(txt):
    """Devuelve (tiene_oscuro, tiene_claro, [(nombre_o_valor, rgb)] claros)."""
    limpio = sin_comentarios(txt)
    consts = {n: v for n, v in RX_CONST.findall(limpio)}

    def resuelve(lit, nombre):
        if lit:
            return a_rgb(lit)
        if nombre and nombre in consts:
            return a_rgb(consts[nombre])
        return None

    # â”€â”€ Â¿Dibuja alguna superficie oscura? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    # â”€â”€ Los colores de texto claros â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

# Los dos casos MEDIBLES, que no dependen de ninguna heuristica del arbol.
CASOS_MEDIBLE_CAZA = [
    ('el mosaico seleccionado de /alertas: fondo claro, letra que no cambia',
     "const TX = 'rgba(255,255,255,0.94)'\n"
     "export default function P({ activo }) {\n"
     "  return <div style={{ background: activo ? '#F9731622' : '#0D1829', color: TX }}>22</div>\n}\n",
     'volteo'),
    ('fondo y color en el mismo style, sin contraste',
     "export default function P() {\n"
     "  return <div style={{ background: '#0D1829', color: '#1B3FCC' }}>hola</div>\n}\n",
     'medido'),
]
CASOS_MEDIBLE_MUDOS = [
    ('pestana que cambia fondo Y letra',
     "export default function P({ act }) {\n"
     "  return <div style={{ background: act ? '#1B3FCC' : '#fff', color: act ? '#fff' : '#1B3FCC' }}>x</div>\n}\n"),
    ('barra de progreso sin texto',
     "export default function P({ i, step }) {\n"
     "  return <div className=\"h-1.5\" style={{ background: i <= step ? '#1B3FCC' : '#e5e7eb' }} />\n}\n"),
    ('fondo y color que si contrastan',
     "export default function P() {\n"
     "  return <div style={{ background: '#0D1829', color: '#FFFFFF' }}>hola</div>\n}\n"),
    ('un `cat.color` dentro de un template, que no es una declaracion',
     "const PANEL = '#0D1829'\nconst BORDER = 'rgba(255,255,255,0.08)'\nconst TX = '#FFFFFF'\n"
     "export default function P({ query, cat }) {\n"
     "  return <input style={{ background: PANEL,\n"
     "    border: `1px solid ${query ? cat.color : BORDER}`, color: TX }} />\n}\n"),
    ('fondo translucido que viene de una constante: no se puede medir',
     "const RED_BG = 'rgba(239,68,68,0.09)'\n"
     "export default function P() {\n"
     "  return <span style={{ background: RED_BG, color: '#FCA5A5' }}>x</span>\n}\n"),
]

if '--autoprueba' in sys.argv:
    fallos = []
    print('  LO MEDIBLE — debe cazarlo:')
    for etq, src, clase in CASOS_MEDIBLE_CAZA:
        mal, vol = pares_medibles(src)
        ok = bool(vol) if clase == 'volteo' else bool(mal)
        if not ok:
            fallos.append(etq)
        print('    %-54s %s' % (etq[:54], 'caza' if ok else '** SE LE ESCAPA'))
    print('\n  LO MEDIBLE — debe callar:')
    for etq, src in CASOS_MEDIBLE_MUDOS:
        mal, vol = pares_medibles(src)
        ok = not mal and not vol
        if not ok:
            fallos.append(etq)
        print('    %-54s %s' % (etq[:54], 'calla' if ok else '** GRITA'))
    print('')
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


seguros, mixtos, medidos, flips, n = [], [], [], [], 0
for ruta in archivos():
    n += 1
    txt = io.open(ruta, encoding='utf-8-sig').read()
    rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')

    # Lo totalmente decidible primero: el mismo elemento declara las dos cosas.
    m_malos, m_volteos = pares_medibles(txt)
    for linea, ratio, col, fon in m_malos:
        medidos.append((rel, linea, ratio, col, fon))
    for linea, frag, col in m_volteos:
        flips.append((rel, linea, frag, col))

    osc, claro_fondo, claros = analiza(txt)
    if not claros:
        continue
    if not osc:
        seguros.append((rel, sorted(set(claros))))
    elif claro_fondo:
        mixtos.append((rel, sorted(set(claros))))

print('  %d archivo(s) .tsx revisados.\n' % n)

if medidos:
    print('  *** FONDO Y COLOR EN EL MISMO ELEMENTO, Y NO CONTRASTAN ***')
    print('  Esto no es heurÃ­stica: los dos lados estÃ¡n en el mismo `style`,')
    print('  asÃ­ que se mide. Por debajo de 3:1 no se lee.\n')
    for rel, linea, ratio, col, fon in sorted(medidos, key=lambda x: x[2]):
        print('  %s:%d  %.2f:1' % (rel, linea, ratio))
        print('      color %s  sobre  %s' % (str(col)[:34], str(fon)[:38]))
    print('')

if flips:
    print('  *** EL FONDO CAMBIA DE CLARO A OSCURO Y EL TEXTO NO ***')
    print('  Un estado que voltea el fondo con una condiciÃ³n deja al texto de')
    print('  dentro correcto en uno de los dos y mal en el otro. Fue el mosaico')
    print('  seleccionado de /alertas.\n')
    for rel, linea, frag, col in flips:
        print('  %s:%d   (el texto se queda en %s)' % (rel, linea, col))
        print('      %s' % frag)
    print('')

if seguros:
    print('  *** LETRA CLARA SIN NINGUNA SUPERFICIE OSCURA ***')
    print('  Estos archivos no declaran ni una `.cp-card` ni un fondo oscuro,')
    print('  asÃ­ que su texto claro cae sobre el #EFF6FF de la pÃ¡gina.\n')
    for rel, cs in seguros:
        print('  %s' % rel)
        print('      %s' % ', '.join(cs)[:100])
else:
    print('  ningÃºn archivo pone letra clara sin tener dÃ³nde ponerla.')

if mixtos:
    print('\n  --- Y %d con fondos de los DOS tipos: hay que leerlos ---' % len(mixtos))
    print('  La heurÃ­stica no sabe cuÃ¡l texto cae en cuÃ¡l fondo. No son')
    print('  hallazgos: son los que no se pueden decidir desde fuera.')
    for rel, cs in mixtos:
        print('  %s' % rel)

sys.exit(1 if (seguros or medidos or flips) else 0)
