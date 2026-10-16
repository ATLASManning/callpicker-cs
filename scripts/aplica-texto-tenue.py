# -*- coding: utf-8 -*-
"""
Migra el texto tenue suelto al token compartido `TX_TENUE` de lib/contraste.ts.

== POR QUE UN SCRIPT Y NO UN REEMPLAZO ==
`rgba(255,255,255,0.45)` aparece en el tablero con TRES oficios distintos y
solo uno de ellos es texto:

  color: / color=      -> TEXTO. Pide 4.5:1. Se migra.
  <text ... fill=      -> TEXTO dentro de un SVG (rotulos de eje). Se migra.
  background / border / stroke / backgroundImage / fill de una forma
                       -> SUPERFICIE u OBJETO GRAFICO. Pide 3:1 o nada.
                          NO se toca: subirle el alfa a una linea de rejilla
                          la convierte en protagonista de la grafica.

Un `--arregla` ciego sobre la cadena habria tocado las 27 cajas tintadas y las
rejillas de las cinco graficas. Por eso cada cambio se clasifica y se imprime.

== QUE HACE ==
  * Si el archivo declara una constante cuyo valor ES el literal tenue
    (`const TENUE = 'rgba(255,255,255,0.45)'`), le pone `TX_TENUE`. Asi no hay
    que tocar sus 30 usos y la constante local sigue siendo el nombre que lee
    quien trabaja ese archivo.
  * Si el literal esta en linea en un `color:`, lo sustituye por `TX_TENUE`.
  * Inserta el import si falta, ANCLADO EN LA ULTIMA LINEA QUE CIERRA UN
    IMPORT --no en la ultima que empieza por `import`--, porque esa heuristica
    cae DENTRO de un `import {` multilinea y rompe el archivo.

Uso:  python scripts/aplica-texto-tenue.py            (simulacro, no escribe)
      python scripts/aplica-texto-tenue.py --aplica
"""
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Alfas que son texto tenue: del 0.30 al 0.52. Por encima de 0.52 ya pasa o es
# otro token (TX_MID va en 0.70). Por debajo de 0.30 no hay texto, son tintes.
LITERAL = re.compile(
    r"'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(0?\.(?:3[0-9]|4[0-9]|5[0-2]))\s*\)'"
    r'|"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(0?\.(?:3[0-9]|4[0-9]|5[0-2]))\s*\)"'
)

# Una constante de modulo cuyo valor es exactamente el literal tenue.
CONSTANTE = re.compile(
    r"^(const\s+\w+\s*(?::\s*string\s*)?=\s*)"
    r"(['\"]rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0?\.(?:3[0-9]|4[0-9]|5[0-2])\s*\)['\"])"
    r"(.*)$"
)

IMPORT_TOKEN = "import { TX_TENUE } from '@/lib/contraste'"

# Carpetas que no son codigo de la app.
EXCLUIDAS = {'node_modules', '.next', '.git', 'scripts', 'public'}


def tsx_del_repo():
    for base, dirs, files in os.walk(RAIZ):
        dirs[:] = [d for d in dirs if d not in EXCLUIDAS]
        for f in files:
            if f.endswith('.tsx'):
                yield os.path.join(base, f)


#   `color:` y el literal NO siempre caen en la misma linea: un ternario
#   partido deja `color:` arriba (app/admin/uso/page.tsx:795-796). Y un
#   `avg === null ? 'rgba(...)'` tiene un `=` entre medias que se lee como
#   propiedad si no se excluyen los operadores de comparacion. Las dos cosas
#   dieron tres falsos "propiedad no reconocida" en la primera pasada.
PROP = re.compile(r'(\w+)\s*:(?!:)|(\w+)\s*=(?![=<>])')


def propiedad_de(contexto):
    """La ultima propiedad declarada en `contexto`, ignorando comparaciones."""
    ultima = ''
    for m in PROP.finditer(contexto):
        ultima = m.group(1) or m.group(2)
    return ultima.lower()


def es_texto(linea, inicio, previas=''):
    """Decide si el literal que empieza en `inicio` pinta TEXTO.

    Se mira lo que hay justo ANTES del literal en su misma linea, que es donde
    vive la propiedad. `color:` y `color=` son texto. `fill=` solo es texto si
    la etiqueta de la linea es un `<text>`; en un `<line>`, `<rect>` o `<path>`
    es un objeto grafico.
    """
    prop = propiedad_de(previas + linea[:inicio])

    if prop == 'color':
        return True, 'color'
    if prop == 'fill':
        if '<text' in linea.lower():
            return True, 'fill de <text> (rotulo de eje)'
        return False, 'fill de una forma SVG (objeto grafico, pide 3:1)'
    if prop in ('background', 'backgroundcolor', 'backgroundimage', 'bordercolor',
                'border', 'bordertop', 'borderbottom', 'borderleft', 'borderright',
                'stroke', 'boxshadow', 'outline', 'textshadow', 'borderleftcolor'):
        return False, '%s (superficie o linea, no texto)' % prop
    return False, 'propiedad no reconocida: %r -- se deja y se revisa a mano' % prop


def ancla_import(lineas):
    """La ultima linea que CIERRA un import. Nunca una que lo abre."""
    ancla = -1
    dentro = False
    for i, l in enumerate(lineas):
        s = l.strip()
        if dentro:
            if s.startswith('}') and ' from ' in s:
                ancla = i
                dentro = False
            continue
        if s.startswith('import '):
            if ' from ' in s or s.endswith("'") or s.endswith('"'):
                ancla = i          # import de una sola linea: ya cierra
            elif s.endswith('{'):
                dentro = True      # import { ... multilinea
    return ancla


def procesa(ruta):
    with open(ruta, encoding='utf-8') as fh:
        original = fh.read()

    if not LITERAL.search(original):
        return None

    lineas = original.split('\n')
    cambios = []
    saltos = []

    for i, linea in enumerate(lineas):
        # 1) Constante de modulo cuyo valor es el literal.
        mc = CONSTANTE.match(linea.strip())
        if mc:
            sangria = linea[:len(linea) - len(linea.lstrip())]
            nueva = sangria + mc.group(1) + 'TX_TENUE' + mc.group(3)
            cambios.append((i, linea, nueva, 'constante de modulo -> TX_TENUE'))
            lineas[i] = nueva
            continue

        # 2) Literales en linea.
        nueva = linea
        desplazado = 0
        toco = False
        motivos = []
        previas = '\n'.join(lineas[max(0, i - 3):i])
        for m in LITERAL.finditer(linea):
            texto, motivo = es_texto(linea, m.start(), previas)
            if texto:
                # UN ATRIBUTO JSX NECESITA LLAVES. `fill="rgba(...)"` es una
                # cadena y `fill=TX_TENUE` es un error de sintaxis: el valor de
                # un atributo o es literal entre comillas o es una expresion
                # entre llaves. Esto rompio seis `<text>` de las graficas y lo
                # cazo `tsc`, no la lectura. Dentro de un objeto de estilo
                # (`color: X`) va sin llaves, porque ya se esta en JS.
                atributo = re.search(r'\w+\s*=\s*$', linea[:m.start()]) is not None
                reemplazo = '{TX_TENUE}' if atributo else 'TX_TENUE'
                ini = m.start() + desplazado
                fin = m.end() + desplazado
                nueva = nueva[:ini] + reemplazo + nueva[fin:]
                desplazado += len(reemplazo) - (m.end() - m.start())
                toco = True
                motivos.append(motivo)
            else:
                saltos.append((i + 1, m.group(0), motivo))
        if toco:
            cambios.append((i, linea, nueva, ' + '.join(motivos)))
            lineas[i] = nueva

    if not cambios:
        return {'ruta': ruta, 'cambios': [], 'saltos': saltos, 'texto': None}

    # 3) El import, si falta.
    if 'TX_TENUE' in original and 'lib/contraste' in original:
        pass
    elif "from '@/lib/contraste'" in original:
        # Ya importa del modulo: agregar el nombre al import existente.
        for i, l in enumerate(lineas):
            if "from '@/lib/contraste'" in l and 'import' in l and 'TX_TENUE' not in l:
                lineas[i] = re.sub(r'import\s*\{\s*', 'import { TX_TENUE, ', l, count=1)
                cambios.append((i, l, lineas[i], 'TX_TENUE agregado al import existente'))
                break
    else:
        a = ancla_import(lineas)
        if a < 0:
            return {'ruta': ruta, 'cambios': cambios, 'saltos': saltos,
                    'texto': None, 'error': 'no se encontro donde anclar el import'}
        lineas.insert(a + 1, IMPORT_TOKEN)
        cambios.append((a + 1, '', IMPORT_TOKEN, 'import insertado tras la linea %d' % (a + 1)))

    return {'ruta': ruta, 'cambios': cambios, 'saltos': saltos, 'texto': '\n'.join(lineas)}


def main():
    aplica = '--aplica' in sys.argv
    print('=' * 78)
    print('TEXTO TENUE -> TX_TENUE   %s' % ('APLICANDO' if aplica else 'SIMULACRO (no escribe)'))
    print('=' * 78)

    tot_c = tot_s = tot_f = 0
    for ruta in sorted(tsx_del_repo()):
        r = procesa(ruta)
        if not r or (not r['cambios'] and not r['saltos']):
            continue
        rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
        print()
        print('-- %s' % rel)
        for i, viejo, nuevo, motivo in r['cambios']:
            print('   L%-5d %s' % (i + 1, motivo))
        if r['saltos']:
            for ln, lit, motivo in r['saltos']:
                print('   L%-5d SE DEJA  %s  -> %s' % (ln, lit, motivo))
        if r.get('error'):
            print('   ERROR: %s' % r['error'])
            tot_f += 1
            continue
        tot_c += len(r['cambios'])
        tot_s += len(r['saltos'])
        if aplica and r['texto']:
            with open(ruta, 'w', encoding='utf-8', newline='\n') as fh:
                fh.write(r['texto'])
            tot_f += 1

    print()
    print('-' * 78)
    print('%d cambios | %d usos dejados a proposito | %d archivos%s'
          % (tot_c, tot_s, tot_f, ' escritos' if aplica else ''))
    if not aplica:
        print('Simulacro. Para escribir: python scripts/aplica-texto-tenue.py --aplica')


if __name__ == '__main__':
    main()
